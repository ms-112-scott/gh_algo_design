export const meta = {
  name: 'gh-enrich',
  description: 'GH 演算法設計圖鑑：既有演算法補充變形與案例。依缺口挑單元 → 產出 → 去重與查證審查 → 合併 → 補卡片圖 → 驗收並推送 main。每次最多 30 個 agent。args: {run: "RYYYYMMDD-HHMM", dry?: true}',
  phases: ['準備', '內容產出', '去重審查', '合併', '卡片圖', '收尾'],
}

/* ------------------------------------------------------------------
   gh-enrich｜既有演算法補充變形與案例
   - 用法（Claude Code，在 gh_algo_design 內）：/gh-enrich，args 例如 {"run": "R20260929-0300"}
     run 是台北時間的執行編號（腳本裡不能取得時間，所以由呼叫者提供）。
     dry: true → 不推送到 GitHub（其餘照做，方便測試）。
   - 所有 shell／git／python 工作都交給 agent（workflow 腳本本身不能讀寫檔案）。
   - 規格：_workflow/specs/*.md；工具：tools/wf_*.py；說明：_workflow/README.md
   - 雲端排程（沒有 Workflow 工具時）改照 _workflow/SPEC.md 執行相同流程。
   - 修改 agent 提示時，請同步更新 _workflow/SPEC.md 的對應段落。
   ------------------------------------------------------------------ */

const A = (typeof args === 'object' && args !== null) ? args : {}
const RUN = A.run
if (typeof RUN !== 'string' || !/^R\d{8}-\d{4}$/.test(RUN)) {
  log('缺少 args.run（格式 RYYYYMMDD-HHMM，台北時間），工作流程結束。')
  return { ok: false, error: 'args.run 缺少或格式錯誤' }
}
const DRY = A.dry === true

// ---------------- agent 名額：整個執行最多 30 個（含重試），用計數器硬性限制
const MAX_AGENTS = 30
const FIXED = 4                         // 準備、關卡、合併、收尾
const N1 = Math.min(15, Number.isInteger(A.stage1) ? A.stage1 : 15)   // 內容單元上限
const NREV = 3                          // 審查 agent 上限
const N3 = Math.min(8, MAX_AGENTS - FIXED - N1 - NREV)                 // 卡片圖上限（預設 8）
let used = 0
function spawn(prompt, opts) {
  if (used >= MAX_AGENTS) {
    log(`已達 ${MAX_AGENTS} 個 agent 上限，略過 ${opts && opts.label}`)
    return Promise.resolve(null)
  }
  used += 1
  return agent(prompt, opts)
}

const CTX = [
  `工作目錄是 gh_algo_design 儲存庫根目錄（若目前不在，先 cd 到含有 build.py 與 _workflow/ 的資料夾）。`,
  `本次執行編號 RUN=${RUN}。全部文字用繁體中文（台灣用語）。`,
].join('\n')

const GIT_PUSH = [
  `推送規則：git fetch origin main；若 origin/main 有新的提交就 git merge origin/main，`,
  `data.js 或 演算法總表.md 衝突時執行 python build.py 產生新版後 git add 並完成 merge；其他檔案衝突就 git merge --abort、不要推送、回報 pushed=false。`,
  `然後 git push origin HEAD:main。永遠不可 force push。`,
  DRY ? `（本次為 dry run：只 commit，不要 push，pushed 回報 false。）` : ``,
  `commit 訊息格式：「wf ${RUN}: <摘要>」，最後一行加「Co-Authored-By: Claude <noreply@anthropic.com>」。`,
].join('\n')

// ---------------- schema
const S_UNIT = { type: 'object', additionalProperties: true,
  required: ['id', 'type'],
  properties: { id: { type: 'string' }, type: { type: 'string' }, algo: { type: 'string' }, family: { type: 'string' }, need: { type: 'integer' } } }
const S_ART = { type: 'object', additionalProperties: true,
  required: ['id', 'algo'],
  properties: { id: { type: 'string' }, algo: { type: 'string' }, no_gen: { type: 'boolean' },
    missing_var: { type: 'array', items: { type: 'integer' } }, missing_case: { type: 'array', items: { type: 'string' } } } }
const S_PREP = { type: 'object',
  required: ['ok', 'reason', 'all_done', 'clip_baseline', 'stage1', 'stage3'],
  properties: { ok: { type: 'boolean' }, reason: { type: 'string' }, all_done: { type: 'boolean' },
    clip_baseline: { type: 'integer' }, stage1: { type: 'array', items: S_UNIT }, stage3: { type: 'array', items: S_ART } } }
const S_DONE = { type: 'object', required: ['unit', 'file', 'produced', 'note'],
  properties: { unit: { type: 'string' }, file: { type: 'string' }, produced: { type: 'integer' }, note: { type: 'string' } } }
const S_GATE = { type: 'object', required: ['ok', 'need_review', 'pass', 'flag', 'reject'],
  properties: { ok: { type: 'boolean' }, need_review: { type: 'array', items: { type: 'string' } },
    pass: { type: 'integer' }, flag: { type: 'integer' }, reject: { type: 'integer' } } }
const S_REV = { type: 'object', required: ['file', 'accept', 'reject', 'note'],
  properties: { file: { type: 'string' }, accept: { type: 'integer' }, reject: { type: 'integer' }, note: { type: 'string' } } }
const S_MERGE = { type: 'object', required: ['ok', 'pushed', 'merged', 'rejected', 'images_queued', 'stage3', 'note'],
  properties: { ok: { type: 'boolean' }, pushed: { type: 'boolean' },
    merged: { type: 'object', additionalProperties: { type: 'integer' } }, rejected: { type: 'integer' },
    images_queued: { type: 'integer' }, stage3: { type: 'array', items: S_ART }, note: { type: 'string' } } }
const S_ARTDONE = { type: 'object', required: ['algo', 'var_done', 'case_done', 'ok', 'note'],
  properties: { algo: { type: 'string' }, var_done: { type: 'integer' }, case_done: { type: 'integer' },
    ok: { type: 'boolean' }, note: { type: 'string' } } }
const S_FIN = { type: 'object', required: ['pushed', 'summary'],
  properties: { pushed: { type: 'boolean' }, summary: { type: 'string' } } }

// ================================================================ 1. 準備
phase('準備')
const prep = await spawn([
  `你是 gh-enrich 工作流程的「準備」步驟。`, CTX,
  `依序執行：`,
  `1. git fetch origin main；確認在 main 分支且工作目錄沒有未提交的修改（有的話回報 ok=false、reason 寫明並停止）；git merge --ff-only origin/main。`,
  `2. python tools/wf_lock.py acquire ${RUN} --wait 9；仍印出 LOCKED 就再執行同一指令，最多共 5 次（約 45 分鐘，等 gh-new-algos 或前一次執行結束）；5 次後仍 LOCKED 就回報 ok=false、reason=「鎖被占用」並停止（不要釋放別人的鎖）。`,
  `3. 確認 python 套件：opencc-python-reimplemented、playwright、Pillow（缺就 pip install；playwright 的瀏覽器無法啟動時執行 python -m playwright install chromium）。`,
  `4. python tools/clipcheck.py，最後一行 TOTAL 的數字就是 clip_baseline。`,
  `5. python tools/wf_plan.py --select ${RUN} --stage1 ${N1} --stage3 ${N3}：stdout 第一行是本次計畫 JSON（也寫在 _workflow/runs/${RUN}.plan.json）；exit code 3 並印出 ALL_DONE 代表全部完成。`,
  `6. 若 ALL_DONE：python tools/wf_lock.py release，回報 all_done=true、ok=true。`,
  `回傳：ok、reason（一句話）、all_done、clip_baseline、stage1（plan 的 stage1 原樣，每個單元保留 id、type、algo、family、need）、stage3（plan 的 stage3 原樣）。`,
].join('\n'), { label: '準備', schema: S_PREP })

if (!prep || !prep.ok) {
  log(`準備失敗：${prep ? prep.reason : 'agent 無回應'}。本次結束（若鎖已取得，170 分鐘後自動過期）。`)
  return { ok: false, run: RUN, stage: '準備', reason: prep ? prep.reason : 'agent 無回應', agents: used }
}
if (prep.all_done) {
  log('所有演算法都已達標或已耗盡。')
  return { ok: true, run: RUN, all_done: true, message: 'GH 圖鑑內容豐富化已全部完成，可以停用排程。', agents: used }
}
log(`本次內容單元 ${prep.stage1.length} 個、卡片圖單元 ${prep.stage3.length} 個；clipcheck 基準 ${prep.clip_baseline}`)

// ================================================================ 2. 內容產出
phase('內容產出')
const SPEC_OF = { VAR: 'var.md', RES: 'res.md', CC: 'cc.md', FIX: 'fix.md' }
function outFile(u) {
  return u.type === 'FIX' ? `_workflow/stage/${RUN}/FIX_${u.id.split(':')[1]}.json`
                          : `_workflow/stage/${RUN}/${u.type}_${u.algo}.json`
}
function contentPrompt(u) {
  return [
    `你是 gh-enrich 工作流程的內容 agent，負責單元 ${u.id}。`, CTX,
    `規格：先讀 _workflow/specs/_common.md，再讀 _workflow/specs/${SPEC_OF[u.type]}，完全照做。`,
    u.type === 'FIX'
      ? `要查的案例：_workflow/runs/${RUN}.plan.json 裡 id 為 "${u.id}" 的單元的 cases 清單（共 ${u.need} 筆）。`
      : `演算法：${u.algo}（家族 ${u.family}）；本次需要新增 ${u.need} 筆；既有內容索引：_workflow/index/${u.algo}.json；全目錄：_workflow/index/_catalog.md。`,
    `輸出檔（只能寫這一個檔案）：${outFile(u)}；JSON 的 unit 欄位填 "${u.id}"${u.type === 'FIX' ? '' : `、algo 欄位填 "${u.algo}"`}。`,
    `不要 commit、不要 push、不要修改任何其他檔案。`,
    `完成後回傳 unit、file（輸出檔路徑）、produced（items 數量）、note（一句話；查不到足量時說明原因）。`,
  ].join('\n')
}
const units = prep.stage1.filter(u => SPEC_OF[u.type]).slice(0, N1)
const done = (await pipeline(units, u => spawn(contentPrompt(u), { label: u.id, schema: S_DONE }))).filter(Boolean)
log(`內容產出：${done.length}/${units.length} 個單元完成，共 ${done.reduce((s, d) => s + (d.produced || 0), 0)} 筆`)

// ================================================================ 3. 去重審查
phase('去重審查')
let gate = null
let reviews = []
if (done.length) {
  gate = await spawn([
    `你是 gh-enrich 工作流程的「去重關卡」。`, CTX,
    `執行 python tools/wf_dedup.py ${RUN}（第 2 層機械去重），它會寫 _workflow/stage/${RUN}/_dedup.json 並在 stdout 印出 JSON（stats、need_review、flags）。`,
    `不要修改任何暫存檔。回傳 ok、need_review（需要審查的暫存檔檔名清單，原樣）、pass、flag、reject 三個數字。`,
  ].join('\n'), { label: '去重關卡', schema: S_GATE })

  const files = gate && gate.ok ? gate.need_review : []
  const nb = Math.min(NREV, Math.ceil(files.length / 5), MAX_AGENTS - used - 2 - 1)   // 保留合併、收尾與至少 1 個卡片圖
  const batches = Array.from({ length: Math.max(nb, 0) }, () => [])
  files.forEach((f, i) => batches[i % batches.length] && batches[i % batches.length].push(f))
  reviews = (await pipeline(batches.map((b, i) => ({ b, n: i + 1 })), ({ b, n }) => spawn([
    `你是 gh-enrich 工作流程的審查 agent #${n}（你不是撰寫者）。`, CTX,
    `規格：先讀 _workflow/specs/_common.md，再讀 _workflow/specs/review.md，完全照做。`,
    `你負責的暫存檔（都在 _workflow/stage/${RUN}/）：${b.join('、')}。`,
    `機械檢查結果在 _workflow/stage/${RUN}/_dedup.json；reject 的項目不用審，flag 的要特別說明。`,
    `輸出檔（只能寫這一個）：_workflow/stage/${RUN}/_review_${n}.json。`,
    `回傳 file（輸出檔路徑）、accept、reject（數量）、note（最常見的拒絕原因）。`,
  ].join('\n'), { label: `審查 #${n}`, schema: S_REV }))).filter(Boolean)
  log(`去重：pass ${gate ? gate.pass : '?'}／flag ${gate ? gate.flag : '?'}／reject ${gate ? gate.reject : '?'}；審查 ${reviews.length} 批`)
} else {
  log('沒有任何內容產出，略過去重審查。')
}

// ================================================================ 4. 合併
phase('合併')
const merge = await spawn([
  `你是 gh-enrich 工作流程的「合併」步驟。`, CTX,
  `依序執行：`,
  `1. python tools/wf_merge.py ${RUN}：把通過去重與審查的內容寫進 data（只新增），並更新 ledger、rejected、image_queue；stdout 印出摘要 JSON。`,
  `2. python build.py（不能有警告；有警告就修正本次新增的資料欄位）。`,
  `3. python tools/sanitize.py --check；有殘留就執行 python tools/sanitize.py 改寫後再檢查一次。`,
  `4. python tools/zhcheck.py --all；有疑似簡體字就修正（只改本次新增的項目），再跑一次到 0。`,
  `5. git add -A 後 commit（摘要寫各類合併數量）。`,
  GIT_PUSH,
  `6. python tools/wf_plan.py --art ${RUN} --stage3 ${N3}：重新計算合併後的缺圖，stdout 印出新的 stage3。`,
  `回傳：ok（步驟 1–5 都成功）、pushed、merged（{VAR, RES, CC, FIX} 各合併幾筆）、rejected（被拒總數）、images_queued、stage3（步驟 6 的結果原樣）、note（一句話，含 unreviewed 數量與任何錯誤）。`,
].join('\n'), { label: '合併', schema: S_MERGE })
if (merge) log(`合併：${JSON.stringify(merge.merged)}，被拒 ${merge.rejected}，圖片排隊 ${merge.images_queued}，推送 ${merge.pushed ? '成功' : '未推送'}`)
else log('合併 agent 失敗；卡片圖改用準備階段的清單。')

// ================================================================ 5. 卡片圖
phase('卡片圖')
const artList = ((merge && merge.ok) ? merge.stage3 : prep.stage3) || []
const nArt = Math.max(0, Math.min(N3, MAX_AGENTS - used - 1))   // 保留 1 個給收尾
const arts = (await pipeline(artList.slice(0, nArt), u => spawn([
  `你是 gh-enrich 工作流程的卡片圖 agent，負責 ${u.algo}。`, CTX,
  `規格：先讀 _workflow/specs/_common.md，再讀 _workflow/specs/art.md，完全照做。`,
  `缺圖的變形索引（0 起算）：${JSON.stringify(u.missing_var || [])}`,
  `缺圖的案例：${JSON.stringify(u.missing_case || [])}`,
  u.no_gen ? `這個演算法還沒有基本生成器：先在 art 檔最前面補上 U.GEN["${u.algo}"]。` : ``,
  (u.redo && u.redo.length) ? `要重畫的項目（_workflow/redo_art.json）：${JSON.stringify(u.redo)}` : ``,
  `只能修改 assets/art/${u.algo}.js；既有畫法不可改動（redo 清單除外）。不要 commit、不要 push。`,
  `完成後回傳 algo、var_done、case_done（補了幾張）、ok（artsheet 的 missingVar／missingCase／slow／errors 都為空）、note。`,
].join('\n'), { label: `卡片圖 ${u.algo}`, schema: S_ARTDONE }))).filter(Boolean)
log(`卡片圖：${arts.length}/${Math.min(artList.length, nArt)} 個演算法完成`)

// ================================================================ 6. 收尾（一定執行，確保推送與釋放鎖）
phase('收尾')
const facts = {
  run: RUN, agents_used_before_finish: used,
  content: done, gate: gate, reviews: reviews, merge: merge, art: arts,
  art_algos: artList.slice(0, nArt).map(u => u.algo), clip_baseline: prep.clip_baseline,
}
const fin = await spawn([
  `你是 gh-enrich 工作流程的「收尾」步驟。`, CTX,
  `本次各步驟的結果（JSON）：${JSON.stringify(facts)}`,
  `依序執行：`,
  `1. 若本次有處理卡片圖（art_algos 不是空的）：python tools/artsheet.py ${artList.slice(0, nArt).map(u => u.algo).join(' ') || '（無）'}，`,
  `   用 Read 打開每張 _shots/art_<編號>.png 檢查：同演算法內兩張太像、和標題看不出關係、空白或壞圖的卡，寫進 _workflow/redo_art.json`,
  `   （格式 [{"algo","kind":"var|case","key":索引或案例編號,"reason","run"}]；保留原有項目，本次已重畫好的舊項目移除）。`,
  `2. python build.py；python tools/clipcheck.py：最後一行 TOTAL 不可大於 ${prep.clip_baseline}；變大就找出本次造成的問題並修正（只能改本次新增的 art 或資料），修不了就寫進報告。`,
  `3. python tools/wf_plan.py --no-art 取得剩餘缺口表。`,
  `4. 寫 _workflow/runs/${RUN}.md：本次單元與結果、各類新增數、被拒數與主要原因、卡片圖結果、圖片排隊數（提醒在本機跑 python tools/fetch_images.py）、剩餘缺口表、需要人工處理的事（例如 FIX 查不到的案例、既有重複案例）。`,
  `5. git add -A、commit（「wf ${RUN}: 卡片圖與報告」）。`,
  GIT_PUSH,
  `6. python tools/wf_lock.py release（一定要做，即使前面失敗）。`,
  `回傳 pushed，以及 summary：5–8 行的繁體中文摘要（處理的家族與單元、各類新增數、被拒數與主因、卡片圖、剩餘缺口、需要人工處理的事）。`,
].join('\n'), { label: '收尾', schema: S_FIN })

const result = {
  ok: !!(fin && merge && merge.ok), run: RUN, agents: used,
  merged: merge ? merge.merged : null, rejected: merge ? merge.rejected : null,
  art: arts.map(a => `${a.algo}: 變形 ${a.var_done}、案例 ${a.case_done}${a.ok ? '' : '（未全數通過）'}`),
  pushed: !!(fin && fin.pushed),
  summary: fin ? fin.summary : '收尾 agent 失敗：請檢查 wf-lock 是否已釋放（python tools/wf_lock.py status）。',
}
log(result.summary)
return result
