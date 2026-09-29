export const meta = {
  name: 'gh-comp',
  description: 'GH 演算法設計圖鑑：每個演算法寫一個 Grasshopper C# 元件檔（comp_codes/<家族>/<id>_<英文名>.cs，照 C#_gh_comp_base_template.cs 與課堂完成版格式）。Sonnet 撰寫 → Opus 審查 → 未通過由 Sonnet 修正再審（最多 2 輪）→ 編譯檢查、commit、推送。可續跑。args: {run: "RYYYYMMDD-HHMM", ids?: ["A01"], redo?: ["A01"]|"all", max_fix?: 2, opus_conc?: 10, sonnet_conc?: 20, dry?: true, models?: {...}|false}',
  phases: [
    { title: '準備', detail: '確認編譯環境、列出要做的演算法' },
    { title: '撰寫', detail: 'Sonnet：每個演算法一個 agent' },
    { title: '審查', detail: 'Opus：逐檔審查，blocker／major 就退回' },
    { title: '修正', detail: 'Sonnet：依審查意見修正' },
    { title: '收尾', detail: '全部編譯檢查、紀錄、commit、推送' },
  ],
}

/* ------------------------------------------------------------------
   gh-comp｜每個演算法一個 Grasshopper C# 元件檔（使用者 2026-09-29 的要求）
   - 用法（Claude Code，在 gh_algo_design 內）：/gh-comp   args: {"run": "R20260929-1200"}
     run：台北時間的執行編號（腳本裡不能取得時間，由呼叫者提供）。
     同一個 run 可以重複執行來續跑：已通過審查的演算法（CSR_<id>.json 的 pass 為 true）會自動略過。
     ids：只做指定的演算法。redo：指定的演算法（或 "all"）即使已通過也重寫。max_fix：審查未通過時最多修幾輪（預設 2，最多 3）。
     opus_conc／sonnet_conc：各模型同時執行的 agent 數（預設也是上限：Opus 10、Sonnet 20；另受工作流程本身的同時上限限制）。
     dry：只 commit 不推送。models：覆寫模型分配，例如 {"write": "opus"}；給 false 則全部沿用工作階段的模型。
   - 要在「自己的電腦」執行：編譯檢查需要 VS Build Tools 的 csc 與 Rhino 8（tools/cs_check.py）。
   - 不取 wf-lock：只寫 comp_codes/ 與自己的 stage 檔，可以和其他工作流程同時執行；commit 只包含本流程的路徑。
   - 規格：_workflow/specs/comp.md（撰寫、修正）、compreview.md（審查）；工具：tools/cs_plan.py、tools/cs_check.py
   - 流程：準備 → 每個演算法各自走「撰寫 → 審查 →（修正 → 再審）× max_fix」（pipeline，不互相等待）→ 收尾
   ------------------------------------------------------------------ */

const A = (typeof args === 'object' && args !== null) ? args : {}
const RUN = A.run
if (typeof RUN !== 'string' || !/^R\d{8}-\d{4}$/.test(RUN)) {
  log('缺少 args.run（格式 RYYYYMMDD-HHMM，台北時間），工作流程結束。')
  return { ok: false, error: 'args.run 缺少或格式錯誤' }
}
const DRY = A.dry === true
const IDS = Array.isArray(A.ids) ? A.ids.filter(s => typeof s === 'string' && /^[A-Z]\d{2}$/.test(s)) : []
const REDO = A.redo === 'all' ? 'all' : (Array.isArray(A.redo) ? A.redo.filter(s => typeof s === 'string' && /^[A-Z]\d{2}$/.test(s)) : [])
const MAX_FIX = Math.max(0, Math.min(3, Number.isInteger(A.max_fix) ? A.max_fix : 2))
const OPUS_CONC = Math.max(1, Math.min(10, Number.isInteger(A.opus_conc) ? A.opus_conc : 10))
const SONNET_CONC = Math.max(1, Math.min(20, Number.isInteger(A.sonnet_conc) ? A.sonnet_conc : 20))
const CONC = Math.max(1, Math.min(30, Number.isInteger(A.conc) ? A.conc : 12))
const MAX_AGENTS = Number.isInteger(A.max_agents) ? A.max_agents : 200

// ---------------- 模型分配：Sonnet 撰寫與修正、Opus 審查
const MODEL_DEFAULT = { prep: 'sonnet', write: 'sonnet', review: 'opus', fix: 'sonnet', finish: 'sonnet' }
const MODELS = A.models === false ? null
  : Object.assign({}, MODEL_DEFAULT, (A.models && typeof A.models === 'object') ? A.models : {})
function opt(role, o) {
  return (MODELS && MODELS[role]) ? Object.assign({ model: MODELS[role] }, o) : o
}
const usage = { opus: 0, sonnet: 0, other: 0 }

// ---------------- 同時執行上限（依模型分開計）與總數上限
let used = 0
function pool(n) {
  let active = 0
  const waiters = []
  return {
    take() { if (active < n) { active += 1; return Promise.resolve() } return new Promise(r => waiters.push(r)) },
    give() { const w = waiters.shift(); if (w) w(); else active -= 1 },   // 直接把名額交給下一個等待者
  }
}
const LANES = { opus: pool(OPUS_CONC), sonnet: pool(SONNET_CONC), other: pool(CONC) }
async function spawn(prompt, opts) {
  if (used >= MAX_AGENTS) {
    log(`已達 ${MAX_AGENTS} 個 agent 上限，略過 ${opts && opts.label}`)
    return null
  }
  used += 1
  const m = opts && opts.model
  const key = m === 'opus' || m === 'sonnet' ? m : 'other'
  usage[key] += 1
  const L = LANES[key]
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

const CTX = [
  `工作目錄是 gh_algo_design 儲存庫根目錄（若目前不在，先 cd 到含有 build.py 與 _workflow/ 的資料夾）。`,
  `本次執行編號 RUN=${RUN}。全部文字用繁體中文（台灣用語）。Windows 終端機請先設 PYTHONIOENCODING=utf-8。`,
  `其他工作流程可能同時在這個資料夾工作：不要動你負責範圍以外的檔案，也不要執行 git stash／checkout／reset／pull 之類會改動工作目錄的指令。`,
].join('\n')

// ---------------- schema
const S_UNIT = { type: 'object', additionalProperties: true, required: ['id', 'family', 'target', 'write'],
  properties: { id: { type: 'string' }, family: { type: 'string' }, name: { type: 'string' }, target: { type: 'string' },
    write: { type: 'boolean' }, legacy: { type: 'string' }, course: { type: 'string' }, state: { type: 'string' } } }
const S_PREP = { type: 'object', required: ['ok', 'reason', 'compiled', 'units', 'done'],
  properties: { ok: { type: 'boolean' }, reason: { type: 'string' }, compiled: { type: 'boolean' },
    units: { type: 'array', items: S_UNIT }, done: { type: 'array', items: { type: 'string' } } } }
const S_WRITE = { type: 'object', required: ['id', 'ok', 'lines', 'check', 'note'],
  properties: { id: { type: 'string' }, ok: { type: 'boolean' }, lines: { type: 'integer' },
    check: { type: 'string' }, based_on: { type: 'string' }, note: { type: 'string' } } }
const S_ISSUE = { type: 'object', additionalProperties: true, required: ['severity', 'problem'],
  properties: { severity: { type: 'string', enum: ['blocker', 'major', 'minor'] }, line: { type: 'integer' },
    problem: { type: 'string' }, fix: { type: 'string' } } }
const S_REVIEW = { type: 'object', required: ['id', 'pass', 'issues', 'summary'],
  properties: { id: { type: 'string' }, pass: { type: 'boolean' }, issues: { type: 'array', items: S_ISSUE },
    summary: { type: 'string' } } }
const S_FIN = { type: 'object', required: ['pushed', 'ok_files', 'fail_files', 'summary'],
  properties: { pushed: { type: 'boolean' }, ok_files: { type: 'integer' }, fail_files: { type: 'integer' },
    commit: { type: 'string' }, summary: { type: 'string' } } }

// ================================================================ 1. 準備
phase('準備')
const listArgs = REDO === 'all' ? ' --all' : (REDO.length ? ` --redo ${REDO.join(',')}` : '')
const prep = await spawn([
  `你是 gh-comp 工作流程的「準備」步驟。`, CTX,
  `依序執行：`,
  `1. 確認 python 可用、pip 套件 opencc-python-reimplemented 已安裝（沒有就 pip install）。`,
  `2. 編譯環境：python tools/cs_check.py "../115-1_演算法設計/04_程式碼/W3_實作/L3_CirclePacking_step5.cs"。`,
  `   印出 OK 且沒有「只做格式檢查」→ compiled=true；印出「找不到 csc 或 Rhino 8」→ compiled=false（仍繼續，但在 reason 說明）；其他錯誤照抄進 reason 並回報 ok=false。`,
  `3. python tools/cs_plan.py list ${RUN}${listArgs}：stdout 最後一行是 JSON，取 units、done。`,
  `4. 依 units 的 family 建立資料夾 comp_codes/<family>/（已存在就略過）。`,
  `不要修改其他檔案、不要 commit。回傳 ok、reason（一句話）、compiled、units、done（都原樣）。`,
].join('\n'), opt('prep', { label: '準備', phase: '準備', schema: S_PREP }))

if (!prep || !prep.ok) {
  log(`準備失敗：${prep ? prep.reason : 'agent 無回應'}。本次結束。`)
  return { ok: false, run: RUN, stage: '準備', reason: prep ? prep.reason : 'agent 無回應', agents: used }
}
let units = prep.units
if (IDS.length) units = units.filter(u => IDS.includes(u.id))
log(`要處理 ${units.length} 個演算法（撰寫 ${units.filter(u => u.write).length}、只需審查 ${units.filter(u => !u.write).length}）；已通過略過 ${prep.done.length} 個；編譯檢查${prep.compiled ? '可用' : '不可用（只做格式檢查）'}；同時上限 Opus ${OPUS_CONC}、Sonnet ${SONNET_CONC}`)

// ---------------- 提示
function unitCtx(u) {
  return [
    `負責演算法：${u.id} ${u.name || ''}；目標檔：${u.target}`,
    u.legacy ? `舊版範例（已能編譯，可當演算法實作的起點）：${u.legacy}` : ``,
    u.course ? `課堂完成版（直接當起點）：${u.course}` : ``,
  ].filter(Boolean).join('\n')
}
function writePrompt(u) {
  return [
    `你是 gh-comp 工作流程的撰寫 agent。`, CTX, unitCtx(u),
    `規格：先讀 _workflow/specs/comp.md，完全照做（先讀、檔案格式、程式規則、自我檢查）。`,
    `只能寫 ${u.target} 與 _workflow/stage/${RUN}/CSW_${u.id}.json（fix_round 填 0）。不要 commit、不要 push。`,
    prep.compiled ? `` : `（本機沒有編譯環境，cs_check.py 只做格式檢查；請特別仔細確認語法與 RhinoCommon API 名稱。）`,
    `完成後回傳 id、ok（cs_check 印出 OK）、lines（行數）、check（cs_check 那一行的原文）、based_on（new／legacy／course）、note（一句話）。`,
  ].filter(Boolean).join('\n')
}
function reviewPrompt(u, round) {
  return [
    `你是 gh-comp 工作流程的審查 agent（你不是撰寫者），第 ${round + 1} 輪審查。`, CTX, unitCtx(u),
    `規格：先讀 _workflow/specs/compreview.md，再讀 _workflow/specs/comp.md，完全照做。round 填 ${round + 1}。`,
    round > 0 ? `這是修正後的再審：先讀現有的 _workflow/stage/${RUN}/CSR_${u.id}.json（上一輪意見）與 CSW_${u.id}.json 的 note，確認每個 blocker／major 都已解決，再照清單完整檢查一次（修正可能帶進新問題）。` : ``,
    `只能寫 _workflow/stage/${RUN}/CSR_${u.id}.json。不要修改 .cs、不要 commit。`,
    `完成後回傳 id、pass（沒有 blocker 也沒有 major）、issues（和 CSR 檔相同）、summary（一句話）。`,
  ].filter(Boolean).join('\n')
}
function fixPrompt(u, rev, round) {
  return [
    `你是 gh-comp 工作流程的修正 agent，第 ${round} 輪修正。`, CTX, unitCtx(u),
    `規格：先讀 _workflow/specs/comp.md（特別是「修正模式」與「自我檢查」），完全照做。`,
    `Opus 審查意見（也在 _workflow/stage/${RUN}/CSR_${u.id}.json）：${JSON.stringify(rev.issues)}`,
    `審查總評：${rev.summary}`,
    `只能修改 ${u.target} 與 _workflow/stage/${RUN}/CSW_${u.id}.json（fix_round 填 ${round}）。不要修改 CSR 檔、不要 commit。`,
    `完成後回傳 id、ok（cs_check 印出 OK）、lines、check（cs_check 那一行的原文）、based_on（沿用）、note（改了什麼；沒改的意見與理由）。`,
  ].join('\n')
}

// ================================================================ 2–4. 每個演算法：撰寫 → 審查 →（修正 → 再審）
const count = (issues, sev) => (issues || []).filter(i => i.severity === sev).length
async function doUnit(u) {
  let wrote = null
  if (u.write) {
    wrote = await spawn(writePrompt(u), opt('write', { label: `撰寫 ${u.id}`, phase: '撰寫', schema: S_WRITE }))
    if (!wrote) return { id: u.id, pass: false, stage: '撰寫', note: '撰寫 agent 失敗' }
  }
  let rev = null
  let fixes = 0
  for (let round = 0; round <= MAX_FIX; round++) {
    rev = await spawn(reviewPrompt(u, round),
      opt('review', { label: `審查 ${u.id}${round ? ` 第 ${round + 1} 輪` : ''}`, phase: '審查', schema: S_REVIEW }))
    if (!rev) return { id: u.id, pass: false, stage: '審查', fixes, note: '審查 agent 失敗' }
    if (rev.pass) break
    if (round === MAX_FIX) break
    const fixed = await spawn(fixPrompt(u, rev, round + 1),
      opt('fix', { label: `修正 ${u.id} 第 ${round + 1} 輪`, phase: '修正', schema: S_WRITE }))
    if (!fixed) return { id: u.id, pass: false, stage: '修正', fixes, note: '修正 agent 失敗', issues: rev.issues }
    fixes += 1
  }
  const r = { id: u.id, target: u.target, pass: !!rev.pass, fixes, lines: wrote ? wrote.lines : null,
    blocker: count(rev.issues, 'blocker'), major: count(rev.issues, 'major'), minor: count(rev.issues, 'minor'),
    summary: rev.summary }
  log(`${u.id}：${r.pass ? '通過' : '未通過'}（修正 ${fixes} 輪${r.pass ? '' : `，剩 blocker ${r.blocker}、major ${r.major}`}）`)
  return r
}
phase('撰寫')
const results = (await Promise.all(units.map(doUnit))).filter(Boolean)
const passed = results.filter(r => r.pass).map(r => r.id)
const failed = results.filter(r => !r.pass)
log(`審查結果：通過 ${passed.length}/${results.length}；未通過 ${failed.map(r => r.id).join('、') || '無'}`)

// ================================================================ 5. 收尾
phase('收尾')
const facts = { run: RUN, models: MODELS || '沿用工作階段模型', model_usage_before_finish: usage, agents_before_finish: used,
  skipped_done: prep.done, results }
const PATHS = `comp_codes tools/cs_plan.py tools/cs_check.py _workflow/specs/comp.md _workflow/specs/compreview.md .claude/workflows/gh-comp.js _workflow/runs/${RUN}.comp.json`
const fin = await spawn([
  `你是 gh-comp 工作流程的「收尾」步驟。`, CTX,
  `本次各演算法的結果（JSON）：${JSON.stringify(facts)}`,
  `依序執行：`,
  `1. python tools/cs_check.py --all：記下 OK／FAIL 數與 FAIL 的檔案。`,
  `2. python tools/cs_plan.py status ${RUN}：記下 counts。`,
  `3. 寫 _workflow/runs/${RUN}.comp.json：{"run", "check": {ok, fail, fail_files}, "status": counts, "results": 上面的 results 陣列, "model_usage": model_usage_before_finish 再加收尾本身 1 個 ${MODELS ? MODELS.finish : ''}, "manual": 需要人工處理的事（未通過的演算法與原因、編譯失敗的檔案、所有檔案都尚未在 Rhino 中實測）}。確認 JSON 可解析。`,
  `4. git add ${PATHS}（檔案不存在的路徑略過）。`,
  `   然後只提交這些路徑：git commit -m "<訊息>" -- ${PATHS}（一定要加「-- 路徑」，其他工作流程可能有已暫存或未提交的修改，不能混進來）。`,
  `   訊息第一行「wf ${RUN}: 每個演算法一個 Grasshopper C# 元件（comp_codes/，通過 N/M）」，最後一行加「Co-Authored-By: Claude <noreply@anthropic.com>」。`,
  DRY ? `5. （本次為 dry run：只 commit，不要 push，pushed 回報 false。）`
    : `5. git push origin HEAD:main。被拒絕（遠端有新提交）時：git fetch origin main，再 git merge --no-edit origin/main；merge 失敗（衝突或工作目錄有會被覆蓋的修改）就 git merge --abort、不要推送、pushed=false 並在 summary 說明；merge 成功就再 git push origin HEAD:main。永遠不可 force push、不可 stash／reset。`,
  `回傳 pushed、ok_files、fail_files、commit（短 hash）、summary：5–8 行繁體中文摘要（通過數、修正輪數分布、未通過的演算法與主要問題、編譯檢查結果、提醒尚未在 Rhino 實測、推送結果）。`,
].join('\n'), opt('finish', { label: '收尾', phase: '收尾', schema: S_FIN }))

const result = {
  ok: failed.length === 0 && !!fin, run: RUN, agents: used, model_usage: usage,
  passed: passed.length, total: results.length, skipped_done: prep.done.length,
  failed: failed.map(r => ({ id: r.id, stage: r.stage || '審查', blocker: r.blocker, major: r.major, summary: r.summary || r.note })),
  pushed: !!(fin && fin.pushed), commit: fin ? fin.commit : '',
  summary: fin ? fin.summary : '收尾 agent 失敗：comp_codes/ 的檔案已寫好但尚未 commit，可用同一個 run 重跑（已通過的會略過）。',
}
log(result.summary)
return result
