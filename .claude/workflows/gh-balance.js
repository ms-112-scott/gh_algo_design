export const meta = {
  name: 'gh-balance',
  description: 'GH 演算法設計圖鑑：案例分成「數位研究／藝術設計」並調成 1:1（以 p5.js／Processing 等藝術作品替換較弱的研究案例，總數不增加）→ 每個案例找真實圖片（藝術案例用作品本身的演算法生成畫面，不用影片縮圖）→ 後段家族卡片圖重畫。可續跑。args: {run: "RYYYYMMDD-HHMM", only?: ["classify","review","merge","images","art","finish"], dry?: true, conc?: 12, img_per?: 18, rev_per?: 4, models?: {...}|false}',
  phases: ['準備', '分類與替換', '審查', '合併', '找圖', '卡片圖', '收尾'],
}

/* ------------------------------------------------------------------
   gh-balance｜數位研究／藝術設計 1:1 ＋ 每張卡片都有自己的圖（使用者 2026-09-29 的要求）
   - 用法（Claude Code 桌面版／CLI，在 gh_algo_design 內，先 git pull）：
       /gh-balance   args: {"run": "R20260929-0900"}
     run：台北時間的執行編號（腳本裡不能取得時間，由呼叫者提供）。
     同一個 run 可以重複執行來續跑：已完成的單元（輸出檔已存在）會自動略過。
     only：只跑某幾段，例如 ["images","art","finish"]；「準備」一定會跑。
     dry：只 commit 不推送。conc：同時執行的 agent 數（預設 12，最多 16）。
     img_per：每個找圖 agent 負責的案例數（預設 18）。rev_per：每個審查 agent 負責的演算法數（預設 4）。
     models：覆寫模型分配，例如 {"img": "opus"}；給 false 則全部沿用工作階段的模型。
   - 要在「自己的電腦」執行：找圖需要下載各網站的圖片（雲端工作階段只能連 GitHub）。
   - 所有 shell／git／python 工作都交給 agent（workflow 腳本本身不能讀寫檔案）。
   - 規格：_workflow/specs/balance.md、balreview.md、imgreal.md、artbal.md（＋ _common.md、art.md、imgfix.md）
     工具：tools/bal_plan.py、bal_merge.py、setimg.py、ct_index.py；說明：_workflow/README.md
   - 流程：
       準備 → 分類與替換（每個演算法一個 agent；同時開始畫「完全沒有變形畫法」的 E03、E04、F01–F06）
       → 審查（Opus，不是撰寫者）→ 合併（bal_merge.py：套用分類、替換、全站剛好 1:1，推送）
       → 找圖（每個案例找真實圖片／檢查既有照片）→ 卡片圖（補畫與重畫，imgdup 歸零）→ 收尾（驗收、報告、推送、釋放鎖）
   ------------------------------------------------------------------ */

const A = (typeof args === 'object' && args !== null) ? args : {}
const RUN = A.run
if (typeof RUN !== 'string' || !/^R\d{8}-\d{4}$/.test(RUN)) {
  log('缺少 args.run（格式 RYYYYMMDD-HHMM，台北時間），工作流程結束。')
  return { ok: false, error: 'args.run 缺少或格式錯誤' }
}
const DRY = A.dry === true
const STEPS = ['classify', 'review', 'merge', 'images', 'art', 'finish']
const ONLY = new Set(Array.isArray(A.only) && A.only.length ? A.only.filter(s => STEPS.includes(s)) : STEPS)
const CONC = Math.max(1, Math.min(16, Number.isInteger(A.conc) ? A.conc : 12))
const IMG_PER = Math.max(6, Math.min(30, Number.isInteger(A.img_per) ? A.img_per : 18))
const REV_PER = Math.max(1, Math.min(8, Number.isInteger(A.rev_per) ? A.rev_per : 4))
const MAX_AGENTS = Number.isInteger(A.max_agents) ? A.max_agents : 130

// ---------------- 模型分配：Opus 負責審查、難的卡片圖與驗收；Sonnet 負責搜尋查證、找圖與機械步驟
const MODEL_DEFAULT = {
  prep: 'sonnet', bal: 'sonnet', review: 'opus', merge: 'sonnet', img: 'sonnet',
  plan: 'sonnet', art: 'sonnet', art_hard: 'opus', finish: 'opus',
}
const MODELS = A.models === false ? null
  : Object.assign({}, MODEL_DEFAULT, (A.models && typeof A.models === 'object') ? A.models : {})
function opt(role, o) {
  return (MODELS && MODELS[role]) ? Object.assign({ model: MODELS[role] }, o) : o
}
const usage = { opus: 0, sonnet: 0, other: 0 }

// ---------------- 同時執行上限（號誌）與總數上限
//   主名額 CONC 個；分類階段先行的變形圖另有小名額（ART_CONC），兩者合計不超過 16
let used = 0
function pool(n) {
  let active = 0
  const waiters = []
  return {
    take() { if (active < n) { active += 1; return Promise.resolve() } return new Promise(r => waiters.push(r)) },
    give() { const w = waiters.shift(); if (w) w(); else active -= 1 },   // 直接把名額交給下一個等待者
  }
}
const MAIN = pool(CONC)
const SIDE = CONC >= 16 ? MAIN : pool(Math.min(4, 16 - CONC))
async function spawn(prompt, opts, lane) {
  if (used >= MAX_AGENTS) {
    log(`已達 ${MAX_AGENTS} 個 agent 上限，略過 ${opts && opts.label}`)
    return null
  }
  used += 1
  const m = opts && opts.model
  usage[m === 'opus' || m === 'sonnet' ? m : 'other'] += 1
  const L = lane || MAIN
  await L.take()
  try {
    return await agent(prompt, opts)
  } catch (e) {
    log(`${opts && opts.label} 失敗：${e && e.message ? e.message : e}`)
    return null
  } finally {
    L.give()
  }
}
const all = (items, fn) => Promise.all((items || []).map(fn)).then(r => r.filter(Boolean))

const CTX = [
  `工作目錄是 gh_algo_design 儲存庫根目錄（若目前不在，先 cd 到含有 build.py 與 _workflow/ 的資料夾）。`,
  `本次執行編號 RUN=${RUN}。全部文字用繁體中文（台灣用語）。Windows 終端機請先設 PYTHONIOENCODING=utf-8。`,
  `這是在使用者自己的電腦上執行：任何網站的圖片都可以下載（用 tools/setimg.py）。`,
].join('\n')

const GIT_PUSH = [
  `推送規則：git fetch origin main；若 origin/main 有新的提交就 git merge origin/main，`,
  `data.js 或 演算法總表.md 衝突時執行 python build.py 產生新版後 git add 並完成 merge；其他檔案衝突就 git merge --abort、不要推送、回報 pushed=false。`,
  `然後 git push origin HEAD:main。永遠不可 force push。`,
  DRY ? `（本次為 dry run：只 commit，不要 push，pushed 回報 false。）` : ``,
  `commit 訊息格式：「wf ${RUN}: <摘要>」，最後一行加「Co-Authored-By: Claude <noreply@anthropic.com>」。`,
].join('\n')

// ---------------- schema
const S_BALUNIT = { type: 'object', additionalProperties: true, required: ['id', 'algos'],
  properties: { id: { type: 'string' }, algos: { type: 'array', items: { type: 'string' } } } }
const S_ARTUNIT = { type: 'object', additionalProperties: true, required: ['id', 'algo'],
  properties: { id: { type: 'string' }, algo: { type: 'string' }, missing_var: { type: 'array', items: { type: 'integer' } },
    missing_case: { type: 'array', items: { type: 'string' } }, redo: { type: 'array', items: { type: 'object', additionalProperties: true } },
    review_all: { type: 'boolean' }, hard: { type: 'boolean' }, var_only: { type: 'boolean' } } }
const S_IMGUNIT = { type: 'object', additionalProperties: true, required: ['id', 'algo', 'file', 'todo', 'check'],
  properties: { id: { type: 'string' }, algo: { type: 'string' }, file: { type: 'string' },
    todo: { type: 'array', items: { type: 'string' } }, check: { type: 'array', items: { type: 'string' } } } }
const S_PREP = { type: 'object', required: ['ok', 'reason', 'clip_baseline', 'units', 'done', 'var_units', 'totals'],
  properties: { ok: { type: 'boolean' }, reason: { type: 'string' }, clip_baseline: { type: 'integer' },
    units: { type: 'array', items: S_BALUNIT }, done: { type: 'array', items: { type: 'string' } },
    var_units: { type: 'array', items: S_ARTUNIT }, totals: { type: 'object', additionalProperties: true } } }
const S_BAL = { type: 'object', required: ['unit', 'files', 'note'],
  properties: { unit: { type: 'string' }, files: { type: 'array', items: { type: 'string' } },
    new_art: { type: 'integer' }, need: { type: 'integer' }, note: { type: 'string' } } }
const S_REV = { type: 'object', required: ['file', 'reviewed', 'rejected', 'note'],
  properties: { file: { type: 'string' }, reviewed: { type: 'integer' }, rejected: { type: 'integer' }, note: { type: 'string' } } }
const S_MERGE = { type: 'object', required: ['ok', 'pushed', 'balanced', 'research', 'art', 'removed', 'added', 'image_units', 'note'],
  properties: { ok: { type: 'boolean' }, pushed: { type: 'boolean' }, balanced: { type: 'boolean' },
    research: { type: 'integer' }, art: { type: 'integer' }, removed: { type: 'integer' }, added: { type: 'integer' },
    image_units: { type: 'array', items: S_IMGUNIT }, note: { type: 'string' } } }
const S_IMG = { type: 'object', required: ['unit', 'found', 'none', 'kept', 'replaced', 'removed', 'note'],
  properties: { unit: { type: 'string' }, found: { type: 'integer' }, none: { type: 'integer' }, kept: { type: 'integer' },
    replaced: { type: 'integer' }, removed: { type: 'integer' }, note: { type: 'string' } } }
const S_PLAN = { type: 'object', required: ['ok', 'pushed', 'art_units', 'note'],
  properties: { ok: { type: 'boolean' }, pushed: { type: 'boolean' }, art_units: { type: 'array', items: S_ARTUNIT },
    photos: { type: 'integer' }, note: { type: 'string' } } }
const S_ART = { type: 'object', required: ['algo', 'var_done', 'case_done', 'redo_done', 'ok', 'note'],
  properties: { algo: { type: 'string' }, var_done: { type: 'integer' }, case_done: { type: 'integer' },
    redo_done: { type: 'integer' }, ok: { type: 'boolean' }, note: { type: 'string' } } }
const S_FIN = { type: 'object', required: ['pushed', 'balanced', 'summary'],
  properties: { pushed: { type: 'boolean' }, balanced: { type: 'boolean' }, summary: { type: 'string' } } }

// ================================================================ 1. 準備
phase('準備')
const prep = await spawn([
  `你是 gh-balance 工作流程的「準備」步驟。`, CTX,
  `依序執行：`,
  `1. git status --porcelain：`,
  `   - 若 _workflow/stage/${RUN}/ 已存在（同一個 RUN 續跑），未提交的修改是上次中斷留下的，保留不動、繼續。`,
  `   - 否則若只有 img/cases/*.jpg、img/credits*.json、_workflow/image_queue.json 的修改（本機跑 fetch_images.py 下載的圖），先 git add 這些檔案並 commit「本機下載的排隊圖片」。`,
  `   - 否則（有其他未提交的修改）回報 ok=false、reason 列出檔案並停止。`,
  `2. git pull --ff-only --autostash origin main（失敗就回報 ok=false 並停止）。`,
  `3. python tools/wf_lock.py acquire ${RUN} --wait 9；仍印出 LOCKED 就再執行同一指令，最多共 5 次；仍 LOCKED 就回報 ok=false、reason=「鎖被占用」並停止（不要釋放別人的鎖）。`,
  `4. 確認 python 套件：opencc-python-reimplemented、playwright、Pillow（缺就 pip install；playwright 的瀏覽器無法啟動時執行 python -m playwright install chromium）；確認 node、curl、git 可用。`,
  `5. python tools/ct_index.py（建立 The Coding Train 範例輸出圖索引；第一次需要幾分鐘）。`,
  `6. python build.py。clipcheck 基準：若 _workflow/stage/${RUN}/clip_baseline.txt 存在就讀它；否則執行 python tools/clipcheck.py，最後一行 TOTAL 的數字寫進該檔。這個數字就是 clip_baseline。`,
  `7. python tools/bal_plan.py prep ${RUN}：stdout 最後一行是 JSON，取 units、done、totals。`,
  `8. python tools/bal_plan.py artvar ${RUN}：stdout 最後一行是 JSON，取 units 當作 var_units。`,
  `回傳：ok、reason（一句話）、clip_baseline、units、done、totals、var_units（都原樣）。`,
].join('\n'), opt('prep', { label: '準備', schema: S_PREP }))

if (!prep || !prep.ok) {
  log(`準備失敗：${prep ? prep.reason : 'agent 無回應'}。本次結束（若鎖已取得，170 分鐘後自動過期，或用同一個 run 重跑）。`)
  return { ok: false, run: RUN, stage: '準備', reason: prep ? prep.reason : 'agent 無回應', agents: used }
}
log(`目標：${JSON.stringify(prep.totals)}；分類單元 ${prep.units.length} 個（已完成 ${prep.done.length} 個演算法）；先畫變形的演算法 ${prep.var_units.map(u => u.algo).join('、') || '無'}`)

// ---------------- 卡片圖 agent 提示（分類階段就先畫完全沒有變形畫法的演算法；卡片圖階段再補其餘）
function artPrompt(u, early) {
  return [
    `你是 gh-balance 工作流程的卡片圖 agent，負責 ${u.algo}。`, CTX,
    `規格：先讀 _workflow/specs/_common.md、_workflow/specs/art.md、_workflow/specs/imgfix.md，再讀 _workflow/specs/artbal.md（本次的補充規則，衝突時以它為準），完全照做。`,
    early
      ? `本次只畫**變形**：${u.algo} 目前沒有任何變形畫法，要補的索引（0 起算）：${JSON.stringify(u.missing_var || [])}。案例的示意圖先不要畫（其他 agent 正在替案例找真實圖片，之後會再處理）。`
      : `要補的變形索引（0 起算）：${JSON.stringify(u.missing_var || [])}\n要補的案例（已確認找不到真實圖片）：${JSON.stringify(u.missing_case || [])}`,
    (u.redo && u.redo.length) ? `要重畫的項目：${JSON.stringify(u.redo)}` : ``,
    u.review_all ? `review_all：使用者指定整個 ${u.algo} 要重新檢查，畫完後打開總覽圖，把構圖相近的卡全部重畫（即使 imgdup 沒抓到）。` : ``,
    `完成標記：_workflow/stage/${RUN}/ART_${u.algo}.json，phases 加入 ${early ? '"var"' : '"var", "case"'}${u.review_all ? '，reviewed_all 設 true' : ''}。`,
    `只能修改 assets/art/${u.algo}.js 與上述標記檔。不要 commit、不要 push。`,
    `完成後回傳 algo、var_done、case_done、redo_done（各畫了幾張）、ok（imgdup 對 ${u.algo} 的 fallback／like_algo／near_dup／errors 都是 0，且 artsheet 的 slow／errors 為空）、note（一句話）。`,
  ].filter(Boolean).join('\n')
}
const earlyArt = ONLY.has('art')
  ? all(prep.var_units, u => spawn(artPrompt(u, true), opt('art_hard', { label: `變形圖 ${u.algo}`, schema: S_ART }), SIDE))
  : Promise.resolve([])

// ================================================================ 2. 分類與替換
phase('分類與替換')
let balDone = []
if (ONLY.has('classify') && prep.units.length) {
  balDone = await all(prep.units, u => spawn([
    `你是 gh-balance 工作流程的「分類與替換」agent，負責 ${u.algos.join('、')}。`, CTX,
    `規格：先讀 _workflow/specs/_common.md，再讀 _workflow/specs/balance.md，完全照做。`,
    ...u.algos.map(k => `- ${k}：輸入 _workflow/stage/${RUN}/in_${k}.json；既有內容索引 _workflow/index/${k}.json；輸出 _workflow/stage/${RUN}/BAL_${k}.json`),
    `全目錄：_workflow/index/_catalog.md。The Coding Train 範例輸出圖：python tools/ct_index.py 關鍵字。`,
    `多個演算法時逐一完成、每做完一個就先寫出它的輸出檔。`,
    `只能寫上述輸出檔（與 _shots/cand/ 預覽圖）。不要 commit、不要 push、不要修改 data、img、assets。`,
    `完成後回傳 unit（"${u.id}"）、files（輸出檔路徑）、new_art（新增藝術案例總數，含備援）、need（各演算法 need 總和）、note（一句話；找不到足量時說明原因）。`,
  ].join('\n'), opt('bal', { label: u.id, schema: S_BAL })))
  log(`分類與替換：${balDone.length}/${prep.units.length} 個單元完成，新增藝術案例候選 ${balDone.reduce((s, d) => s + (d.new_art || 0), 0)} 個`)
}

// ================================================================ 3. 審查
phase('審查')
let reviews = []
if (ONLY.has('review')) {
  const algosAll = [...new Set([...prep.done, ...prep.units.flatMap(u => u.algos)])].sort()
  const batches = []
  for (let i = 0; i < algosAll.length; i += REV_PER) batches.push(algosAll.slice(i, i + REV_PER))
  reviews = await all(batches, b => spawn([
    `你是 gh-balance 工作流程的審查 agent（你不是撰寫者），負責 ${b.join('、')}。`, CTX,
    `規格：先讀 _workflow/specs/_common.md、_workflow/specs/balance.md，再讀 _workflow/specs/balreview.md，完全照做。`,
    `先檢查 _workflow/stage/${RUN}/BALREV_*.json：已經審過的演算法（出現在某個檔案的 algos 鍵）就略過；BAL_<演算法>.json 不存在的也略過並在 note 說明。`,
    `輸出檔（只能寫這一個）：_workflow/stage/${RUN}/BALREV_${b[0]}.json（已存在就合併進去，保留原有的演算法）。`,
    `不要 commit、不要 push、不要修改 BAL 檔或其他檔案。`,
    `完成後回傳 file、reviewed（審了幾個新案例）、rejected（reject 幾個）、note（最常見的問題）。`,
  ].join('\n'), opt('review', { label: `審查 ${b[0]}–${b[b.length - 1]}`, schema: S_REV })))
  log(`審查：${reviews.length}/${batches.length} 批，審 ${reviews.reduce((s, r) => s + (r.reviewed || 0), 0)} 個、退 ${reviews.reduce((s, r) => s + (r.rejected || 0), 0)} 個`)
}

// ================================================================ 4. 合併
phase('合併')
let merge = null
if (ONLY.has('merge') || ONLY.has('images')) {
  merge = await spawn([
    `你是 gh-balance 工作流程的「合併」步驟。`, CTX,
    `依序執行：`,
    ONLY.has('merge')
      ? `1. python tools/bal_merge.py ${RUN}：套用分類、替換、全站 1:1（同一個 RUN 已合併過會直接印出上次結果）。stdout 最後一行是摘要 JSON（balanced、research、art、removed、added、images_ok、images_queued）。若回報 missing_bal 不是空的，在 note 說明哪些演算法沒有分類結果（它們維持原分類、不替換）。`
      : `1. （本次不合併）python tools/bal_plan.py status，取最後一行 JSON 的 research、art、balanced；removed、added 回報 0。`,
    `2. python build.py（不能有警告；有警告就修正 data/bal_art.json 裡本次新增的欄位）。`,
    `3. python tools/sanitize.py --check（有殘留就 python tools/sanitize.py 後再檢查）；python tools/zhcheck.py --all（有疑似簡體字就只改本次新增的案例，再跑到 0）。`,
    `4. python tools/wf_plan.py --index（更新去重索引）。`,
    `5. git add data img _workflow data.js 演算法總表.md（**不要** add assets/，卡片圖 agent 可能正在修改），commit（摘要：研究／藝術數量、移除與新增數）。`,
    GIT_PUSH,
    `6. python tools/bal_plan.py images ${RUN} --per ${IMG_PER}：stdout 最後一行 JSON 的 units 就是 image_units。`,
    `回傳：ok（1–5 成功）、pushed、balanced、research、art、removed、added、image_units（原樣）、note（一句話，含 missing_bal、圖片排隊數與任何錯誤）。`,
  ].join('\n'), opt('merge', { label: '合併', schema: S_MERGE }))
  if (merge) log(`合併：數位研究 ${merge.research}／藝術設計 ${merge.art}（${merge.balanced ? '相等' : '不相等'}），移除 ${merge.removed}、新增 ${merge.added}；找圖單元 ${merge.image_units.length} 個；推送 ${merge.pushed ? '成功' : '未推送'}`)
  else log('合併 agent 失敗。')
}

// ================================================================ 5. 找圖
phase('找圖')
let imgs = []
if (ONLY.has('images') && merge && merge.image_units && merge.image_units.length) {
  imgs = await all(merge.image_units, u => spawn([
    `你是 gh-balance 工作流程的找圖 agent，負責 ${u.id}（演算法 ${u.algo}）。`, CTX,
    `規格：先讀 _workflow/specs/_common.md，再讀 _workflow/specs/imgreal.md，完全照做。`,
    `todo（沒有照片，要找圖）：${JSON.stringify(u.todo)}`,
    `check（已有照片，要檢查；不合格就換）：${JSON.stringify(u.check)}`,
    `輸出檔（只能寫這一個）：${u.file}；unit 欄位填 "${u.id}"。清單裡每個案例都要有一筆結果。`,
    `圖片只能透過 python tools/setimg.py 寫入。不要 commit、不要 push、不要修改 data、assets 或其他案例的圖。`,
    `完成後回傳 unit、found（todo 找到幾張）、none（todo 沒找到幾個）、kept、replaced、removed（check 的結果）、note（一句話）。`,
  ].join('\n'), opt('img', { label: u.id, schema: S_IMG })))
  log(`找圖：${imgs.length}/${merge.image_units.length} 個單元；找到 ${imgs.reduce((s, x) => s + (x.found || 0), 0)}、沒找到 ${imgs.reduce((s, x) => s + (x.none || 0), 0)}、更換 ${imgs.reduce((s, x) => s + (x.replaced || 0), 0)}、移除 ${imgs.reduce((s, x) => s + (x.removed || 0), 0)}`)
}

// ================================================================ 6. 卡片圖
phase('卡片圖')
const early = await earlyArt          // 先等分類階段開始畫的變形圖做完，避免兩個 agent 同時改同一個 art 檔
if (early.length) log(`變形圖（先行）：${early.map(a => `${a.algo} ${a.var_done} 張${a.ok ? '' : '（未全數通過）'}`).join('、')}`)
let plan = null
let arts = []
if (ONLY.has('art')) {
  plan = await spawn([
    `你是 gh-balance 工作流程的「卡片圖規劃」步驟。`, CTX,
    `依序執行：`,
    `1. python build.py（不能有警告）。`,
    `2. 若有找圖的新圖片：git add img _workflow data.js 演算法總表.md（不要 add assets/），commit（「找圖：真實圖片 N 張」）。`,
    GIT_PUSH,
    `3. python tools/bal_plan.py art ${RUN}（會跑 imgdup，約數分鐘）：stdout 最後一行 JSON 的 units 就是 art_units。`,
    `回傳 ok、pushed、art_units（原樣）、photos（目前有照片的案例數，見 python tools/bal_plan.py status 最後一行）、note。`,
  ].join('\n'), opt('plan', { label: '卡片圖規劃', schema: S_PLAN }))
  const units = plan ? plan.art_units : []
  arts = await all(units, u => spawn(artPrompt(u, false),
    opt(u.hard ? 'art_hard' : 'art', { label: `卡片圖 ${u.algo}`, schema: S_ART })))
  log(`卡片圖：${arts.length}/${units.length} 個演算法完成；${arts.filter(a => !a.ok).map(a => a.algo).join('、') || '全部通過'}`)
}

// ================================================================ 7. 收尾（一定執行，確保推送與釋放鎖）
phase('收尾')
const facts = {
  run: RUN, agents_used_before_finish: used, models: MODELS || '沿用工作階段模型', model_usage_before_finish: usage,
  steps: [...ONLY], totals: prep.totals, classify: balDone, reviews, merge: merge && { ...merge, image_units: merge.image_units.length },
  images: imgs, art_early: early, art: arts, clip_baseline: prep.clip_baseline,
}
const touched = [...new Set([...early, ...arts].map(a => a.algo))]
const fin = await spawn([
  `你是 gh-balance 工作流程的「收尾」步驟。`, CTX,
  `本次各步驟的結果（JSON）：${JSON.stringify(facts)}`,
  `依序執行：`,
  `1. python build.py（不能有警告）；python tools/bal_plan.py status：數位研究與藝術設計必須相等、缺 source 必須為 0，不相等就在報告寫明差額與原因（不要自行刪改案例）。`,
  `2. python tools/imgdup.py：記下 fallback／like_algo／near_dup／photo_dup 總數。`,
  touched.length
    ? `3. python tools/artsheet.py ${touched.join(' ')}，用 Read 打開每張 _shots/art_<編號>.png 檢查：同演算法內兩張構圖太像、和標題看不出關係、空白或壞圖的卡，寫進 _workflow/redo_art.json（格式 [{"algo","kind":"var|case","key":索引或案例編號,"reason","run":"${RUN}"}]；保留原有項目，本次已重畫好的舊項目移除）。`
    : `3. （本次沒有畫卡片圖，略過總覽圖檢查。）`,
  `4. 從 img/credits_bal.json（本次登記的圖片）隨機抽 12 個案例，用 Read 打開 img/cases/<編號>.jpg 確認：藝術設計是作品生成畫面、研究是作品本身、沒有影片縮圖或人像；有問題的寫進報告與 _workflow/redo_art.json 以外的「需要人工處理」清單。`,
  `5. python tools/sanitize.py --check；python tools/zhcheck.py --all；python tools/clipcheck.py：最後一行 TOTAL 不可大於 ${prep.clip_baseline}；變大就找出本次造成的問題並修正（只能改本次新增的 art 或資料），修不了就寫進報告。`,
  `6. 寫 _workflow/runs/${RUN}.md：兩類數量（全站與各演算法）、移除與新增的案例清單（見 _workflow/stage/${RUN}/_merge.json）、審查退件、找圖結果（真實圖片數、沒找到數、更換的影片縮圖數）、卡片圖結果、imgdup 前後、各模型使用數（見 model_usage_before_finish，另加收尾本身 1 個 ${MODELS ? MODELS.finish : ''}）、需要人工處理的事。`,
  `7. git add -A、commit（「wf ${RUN}: 數位研究／藝術設計 1:1、真實圖片與卡片圖」）。`,
  GIT_PUSH,
  `8. python tools/wf_lock.py release（一定要做，即使前面失敗）。`,
  `回傳 pushed、balanced，以及 summary：6–10 行的繁體中文摘要（兩類數量、移除／新增數、真實圖片數與沒找到數、更換的縮圖數、卡片圖補畫與重畫數、imgdup 結果、需要人工處理的事）。`,
].join('\n'), opt('finish', { label: '收尾', schema: S_FIN }))

const result = {
  ok: !!(fin && fin.balanced), run: RUN, agents: used, model_usage: usage, steps: [...ONLY],
  balanced: !!(fin && fin.balanced), pushed: !!(fin && fin.pushed),
  merge: merge ? { research: merge.research, art: merge.art, removed: merge.removed, added: merge.added } : null,
  images: { units: imgs.length, found: imgs.reduce((s, x) => s + (x.found || 0), 0), none: imgs.reduce((s, x) => s + (x.none || 0), 0) },
  art: [...early, ...arts].map(a => `${a.algo}: 變形 ${a.var_done}、案例 ${a.case_done}、重畫 ${a.redo_done}${a.ok ? '' : '（未全數通過）'}`),
  summary: fin ? fin.summary : '收尾 agent 失敗：請檢查 wf-lock 是否已釋放（python tools/wf_lock.py status），可用同一個 run 重跑續做。',
}
log(result.summary)
return result
