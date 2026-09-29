export const meta = {
  name: 'gh-new-algos',
  description: 'GH 演算法設計圖鑑：探索並新增新家族／新演算法。5 個方向探索 → 跨方向去重 → 審查查證 → 挑選編號 →（add）建立資料、生成器、C# → 接進網站並推送 main。每次最多 30 個 agent。args: {run: "RYYYYMMDD-HHMM", mode?: "propose"|"add"|"auto", from?: "R…", max_new?: 8, dry?: true}',
  phases: ['準備', '探索', '彙整', '審查', '挑選', '建立', '整合', '收尾'],
}

/* ------------------------------------------------------------------
   gh-new-algos｜新家族與新演算法
   mode（預設 propose）：
     propose：探索、去重、審查、挑選，產出 _workflow/explore/<run>/report.md 與 selected.json，推送後結束（不改網站）
     add    ：讀 _workflow/explore/<from>/selected.json（from 預設為最近一次 propose 的 run），建立新演算法並接進網站
     auto   ：propose ＋ add 一次做完
   其他 args：max_new（最多新增幾個演算法，預設 8、上限 8）、dry（true＝不推送）
   規格：_workflow/specs/explore.md、select.md、candreview.md、newalgo.md、integrate.md
   新演算法接進網站後，變形擴到 16、案例擴到 18＋8、卡片圖都由 gh-enrich 自動接手。
   ------------------------------------------------------------------ */

const A = (typeof args === 'object' && args !== null) ? args : {}
const RUN = A.run
if (typeof RUN !== 'string' || !/^R\d{8}-\d{4}$/.test(RUN)) {
  log('缺少 args.run（格式 RYYYYMMDD-HHMM，台北時間），工作流程結束。')
  return { ok: false, error: 'args.run 缺少或格式錯誤' }
}
const MODE = ['propose', 'add', 'auto'].includes(A.mode) ? A.mode : 'propose'
const FROM = MODE === 'add' ? (typeof A.from === 'string' ? A.from : '') : RUN
const MAX_NEW = Math.max(1, Math.min(8, Number.isInteger(A.max_new) ? A.max_new : 8))
const DRY = A.dry === true
const EXPLORE = MODE !== 'add'
const BUILD = MODE !== 'propose'

const MAX_AGENTS = 30
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
const DIR = `_workflow/explore/${RUN}`

// ---------------- 探索方向（參考清單不是限制，也不代表一定要收）
const DIRECTIONS = [
  { key: 'x1_AF', title: 'A 規則與語法、F 圖樣與最佳化 家族內的新演算法',
    hints: 'IFS 迭代函數系統／Barnsley 蕨、Mandelbrot／Julia 逃逸時間分形、Penrose 或其他非週期替換鋪磚（含 2023 年 hat 單形磚）、de Bruijn 五格線法準晶、細分曲面（Catmull-Clark、Loop）、一維基本細胞自動機（Wolfram 規則）、圖文法、CGA split grammar、模擬退火、拓撲最佳化（BESO／SIMP）、粒子群最佳化 PSO、多目標最佳化（NSGA-II／Pareto）、旅行推銷員問題與單線畫、最小生成樹／Steiner 樹、空間配置／鄰接最佳化、Escher／Heesch 鑲嵌、凱爾特結、疊紋、Kolam' },
  { key: 'x2_BC', title: 'B 生長、C 場與擴散 家族內的新演算法',
    hints: 'Eden 生長、介電崩潰模型／Laplacian 生長、貝殼生長（Raup 模型）、雪花結晶（Reiter 模型）、細胞形態生長（Andy Lomas Cellular Forms）、菌絲生長、累積生長、侵入滲流；波動方程與干涉、熱傳導／Laplace 求解、Stable Fluids 風場、SDF 與 Marching Cubes 3D 等值面、curl noise、Fast Marching／測地距離場、循環細胞自動機／Brian\'s Brain／Lenia、domain warping、Gierer–Meinhardt 等其他圖靈斑紋模型' },
  { key: 'x3_DE', title: 'D 代理人、E 排列與鬆弛 家族內的新演算法（粒子群最佳化 PSO 由 x1 負責，不要列）',
    hints: '蟻群演算法／費洛蒙 stigmergy、白蟻築巢式代理人建造、捕食者–獵物、Lévy flight 與隨機行走、Nagel–Schreckenberg 交通細胞自動機、代理人建構的構造（Roland Snooks 等）、機器人群體建造；力導向圖佈局（泡泡圖轉平面）、矩形／裝箱排列、3D 球體堆積、Delaunay 三角化與網格重新鋪面、平面化（PQ 網格）最佳化、剛性摺紙模擬、張拉整體／力密度法（FDM）找形、編織與針織鬆弛、測地線圓頂' },
  { key: 'x4_family', title: '既有家族以外的全新家族（每個家族評估定義、與既有家族的界線、3–5 個候選、建議）',
    hints: '幾何處理／網格（細分、平滑、重新鋪面、測地線、可展面攤平、共形映射）；空間分析／圖論（isovist、visibility graph、space syntax、網路中心性、最小生成樹）；資料驅動（k-means、PCA；神經網路相關與格子波茲曼 LBM 不收）；物理與動力（布料、剛體、質點彈簧，注意與 E04、D 家族重疊）；機率與隨機過程（Markov 鏈、Monte Carlo、Metropolis）' },
  { key: 'x5_audit', title: '外部對照稽核：拿權威教材、課程大綱、Grasshopper 外掛分類對照既有演算法，找出常被教但圖鑑還沒有的',
    hints: 'The Nature of Code（2024 版各章）、Generative Design（Generative Gestaltung）章節、Food4Rhino 外掛（Kangaroo、Anemone、Rabbit、Culebra、Wallacei、Octopus、Millipede、DeCodingSpaces、Space Syntax 相關、Ladybug）、至少 2 個大學計算設計課程大綱（ETH、MIT、AA、Harvard GSD、TU Delft、Stuttgart ICD…）、Algorithms-Aided Design（Tedeschi）、Form+Code、Paul Bourke 網站' },
]

// ---------------- schema
const S_PREP = { type: 'object', required: ['ok', 'reason', 'next_ids', 'clip_baseline', 'selected'],
  properties: { ok: { type: 'boolean' }, reason: { type: 'string' },
    next_ids: { type: 'object', additionalProperties: { type: 'string' } },
    clip_baseline: { type: 'integer' },
    selected: { type: 'array', items: { type: 'object', required: ['id', 'family', 'name_zh'],
      properties: { id: { type: 'string' }, family: { type: 'string' }, name_zh: { type: 'string' } } } } } }
const S_EXP = { type: 'object', required: ['key', 'file', 'new_count', 'summary'],
  properties: { key: { type: 'string' }, file: { type: 'string' }, new_count: { type: 'integer' }, summary: { type: 'string' } } }
const S_SYN = { type: 'object', required: ['ok', 'keys', 'to_variation', 'note'],
  properties: { ok: { type: 'boolean' }, keys: { type: 'array', items: { type: 'string' } },
    to_variation: { type: 'integer' }, note: { type: 'string' } } }
const S_REV = { type: 'object', required: ['file', 'accept', 'reject', 'variation'],
  properties: { file: { type: 'string' }, accept: { type: 'integer' }, reject: { type: 'integer' }, variation: { type: 'integer' } } }
const S_SEL = { type: 'object', required: ['ok', 'selected', 'new_families', 'note'],
  properties: { ok: { type: 'boolean' },
    selected: { type: 'array', items: { type: 'object', required: ['id', 'family', 'name_zh'],
      properties: { id: { type: 'string' }, family: { type: 'string' }, name_zh: { type: 'string' } } } },
    new_families: { type: 'array', items: { type: 'string' } }, note: { type: 'string' } } }
const S_NEW = { type: 'object', required: ['id', 'ok', 'variations', 'res_cases', 'cc_cases', 'loc', 'note'],
  properties: { id: { type: 'string' }, ok: { type: 'boolean' }, variations: { type: 'integer' },
    res_cases: { type: 'integer' }, cc_cases: { type: 'integer' }, loc: { type: 'integer' }, note: { type: 'string' } } }
const S_INT = { type: 'object', required: ['ok', 'integrated', 'note'],
  properties: { ok: { type: 'boolean' }, integrated: { type: 'array', items: { type: 'string' } }, note: { type: 'string' } } }
const S_FIN = { type: 'object', required: ['pushed', 'summary'],
  properties: { pushed: { type: 'boolean' }, summary: { type: 'string' } } }

// ================================================================ 1. 準備
phase('準備')
const prep = await spawn([
  `你是 gh-new-algos 工作流程的「準備」步驟（mode=${MODE}）。`, CTX,
  `依序執行：`,
  `1. git fetch origin main；確認在 main 分支且工作目錄沒有未提交的修改（有就回報 ok=false 並停止）；git merge --ff-only origin/main。`,
  `2. python tools/wf_lock.py acquire ${RUN} --wait 9；仍印出 LOCKED 就再執行同一指令，最多共 3 次；仍 LOCKED 就回報 ok=false、reason=「鎖被占用」並停止（不要釋放別人的鎖）。`,
  `3. 確認 python 套件：opencc-python-reimplemented、playwright、Pillow（缺就 pip install）。`,
  `4. python tools/wf_plan.py --index（重建 _workflow/index/ 與 _catalog.md）；建立資料夾 ${DIR}/。`,
  `5. 讀 data/*.json，列出每個家族目前最大的演算法編號，next_ids 回傳每個家族下一個可用編號（例如 {"A":"A07","D":"D04",…}）。`,
  BUILD ? `6. python tools/clipcheck.py，最後一行 TOTAL 的數字就是 clip_baseline。` : `6. clip_baseline 回傳 0（本模式不需要）。`,
  MODE === 'add'
    ? `7. 讀 _workflow/explore/${FROM || '<最近一次有 selected.json 的資料夾>'}/selected.json${FROM ? '' : '（from 沒給：找 _workflow/explore/ 底下最新、有 selected.json、且其中演算法尚未出現在 data/ 的資料夾）'}，把 algorithms 的 id、family、name_zh 放進 selected；並把該 selected.json 複製到 ${DIR}/selected.json（add 模式之後的步驟都讀這份）。找不到就回報 ok=false。`
    : `7. selected 回傳空陣列。`,
  `回傳 ok、reason（一句話）、next_ids、clip_baseline、selected。`,
].join('\n'), { label: '準備', schema: S_PREP })

if (!prep || !prep.ok) {
  log(`準備失敗：${prep ? prep.reason : 'agent 無回應'}。本次結束。`)
  return { ok: false, run: RUN, stage: '準備', reason: prep ? prep.reason : 'agent 無回應', agents: used }
}

let selected = prep.selected || []
let syn = null, reviews = [], sel = null, explored = []

if (EXPLORE) {
  // ============================================================== 2. 探索
  phase('探索')
  explored = (await pipeline(DIRECTIONS, d => spawn([
    `你是 gh-new-algos 工作流程的探索 agent，代號 ${d.key}。`, CTX,
    `規格：先讀 _workflow/specs/_common.md，再讀 _workflow/specs/explore.md，完全照做。既有內容：_workflow/index/_catalog.md（一定要讀完）。`,
    `你的方向：${d.title}。`,
    `可參考（不限於此，每個都要先和既有演算法及其變形比對去重）：${d.hints}。`,
    `目前各家族下一個可用編號（僅供參考，不要自己編號）：${JSON.stringify(prep.next_ids)}。`,
    `輸出檔（只能寫這一個）：${DIR}/${d.key}.json。不要 commit、不要 push。`,
    `回傳 key、file、new_count（verdict=new 的候選數）、summary（候選名稱＋verdict＋total 的精簡清單，一行一個）。`,
  ].join('\n'), { label: `探索 ${d.key}`, schema: S_EXP }))).filter(Boolean)
  log(`探索：${explored.length}/${DIRECTIONS.length} 個方向完成，新候選 ${explored.reduce((s, e) => s + e.new_count, 0)} 個（含跨方向重複）`)

  // ============================================================== 3. 彙整
  phase('彙整')
  if (explored.length) {
    syn = await spawn([
      `你是 gh-new-algos 工作流程的「彙整」步驟。`, CTX,
      `規格：先讀 _workflow/specs/_common.md，再讀 _workflow/specs/select.md 的「階段 1：彙整」，完全照做。`,
      `輸入：${DIR}/ 底下各方向的 JSON（${explored.map(e => e.file).join('、')}）。輸出：${DIR}/_candidates.json。`,
      `回傳 ok、keys（全部候選 key，例如 K01…）、to_variation（轉為變形建議的數量）、note。`,
    ].join('\n'), { label: '彙整', schema: S_SYN })
  }

  // ============================================================== 4. 審查
  phase('審查')
  const keys = syn && syn.ok ? syn.keys : []
  const nb = Math.min(3, Math.ceil(keys.length / 6))
  const batches = Array.from({ length: nb }, () => [])
  keys.forEach((k, i) => batches[i % nb].push(k))
  reviews = (await pipeline(batches.map((b, i) => ({ b, n: i + 1 })), ({ b, n }) => spawn([
    `你是 gh-new-algos 工作流程的候選審查 agent #${n}（你不是提出候選的人）。`, CTX,
    `規格：先讀 _workflow/specs/_common.md，再讀 _workflow/specs/candreview.md，完全照做。`,
    `候選檔：${DIR}/_candidates.json；你負責的 key：${b.join('、')}。`,
    `輸出檔（只能寫這一個）：${DIR}/_review_${n}.json。`,
    `回傳 file、accept、reject、variation（數量）。`,
  ].join('\n'), { label: `審查 #${n}`, schema: S_REV }))).filter(Boolean)
  log(`審查：${reviews.length} 批；accept ${reviews.reduce((s, r) => s + r.accept, 0)}、reject ${reviews.reduce((s, r) => s + r.reject, 0)}、轉變形 ${reviews.reduce((s, r) => s + r.variation, 0)}`)

  // ============================================================== 5. 挑選
  phase('挑選')
  if (syn && syn.ok) {
    sel = await spawn([
      `你是 gh-new-algos 工作流程的「挑選」步驟。`, CTX,
      `規格：先讀 _workflow/specs/_common.md，再讀 _workflow/specs/select.md 的「階段 2：挑選」，完全照做。`,
      `輸入：${DIR}/_candidates.json 與 ${DIR}/_review_*.json；_workflow/config.json 的 new_algos 設定。`,
      `本次最多挑 ${MAX_NEW} 個新演算法。各家族目前下一個可用編號：${JSON.stringify(prep.next_ids)}（新家族從 <字母>01 起）。`,
      `輸出：${DIR}/selected.json 與 ${DIR}/report.md。不要 commit、不要 push。`,
      `回傳 ok、selected（每個入選的 id、family、name_zh）、new_families（新家族字母清單）、note。`,
    ].join('\n'), { label: '挑選', schema: S_SEL })
    if (sel && sel.ok) selected = sel.selected
  }
  log(sel && sel.ok ? `挑選：${selected.map(s => `${s.id} ${s.name_zh}`).join('、') || '無'}${sel.new_families.length ? `；新家族 ${sel.new_families.join('、')}` : ''}` : '挑選失敗或沒有候選。')
}

// ================================================================ 6. 建立（add／auto）
let made = [], integ = null
if (BUILD && selected.length) {
  phase('建立')
  const room = Math.max(0, MAX_AGENTS - used - 2)          // 保留整合與收尾
  const todo = selected.slice(0, Math.min(MAX_NEW, room))
  made = (await pipeline(todo, s => spawn([
    `你是 gh-new-algos 工作流程的建立 agent，負責新演算法 ${s.id}（${s.name_zh}，家族 ${s.family}）。`, CTX,
    `規格：先讀 _workflow/specs/_common.md，再讀 _workflow/specs/newalgo.md，完全照做；卡片生成器的介面見 _workflow/specs/art.md。`,
    `入選資料：${DIR}/selected.json 的 algorithms 中 id 為 "${s.id}" 的那一筆；既有內容：_workflow/index/_catalog.md。`,
    `只能寫：data/ag_${s.id}.json、assets/art/${s.id}.js、cs/${s.id}_*.cs、${DIR}/images_${s.id}.json。不要改其他檔案、不要 commit、不要 push。`,
    `回傳 id、ok（四個檔案都完成且通過自我檢查）、variations、res_cases、cc_cases、loc（C# 行數）、note。`,
  ].join('\n'), { label: `建立 ${s.id}`, schema: S_NEW }))).filter(Boolean)
  log(`建立：${made.filter(m => m.ok).length}/${todo.length} 個完成`)

  // ============================================================== 7. 整合
  phase('整合')
  integ = await spawn([
    `你是 gh-new-algos 工作流程的「整合」步驟。`, CTX,
    `規格：先讀 _workflow/specs/_common.md，再讀 _workflow/specs/integrate.md，完全照做。`,
    `入選清單：${DIR}/selected.json；建立結果：${JSON.stringify(made)}；clipcheck 開始時的 TOTAL：${prep.clip_baseline}。`,
    `不要 commit、不要 push（收尾步驟負責）。`,
    `回傳 ok、integrated（成功接進網站的演算法 id）、note（build／zhcheck／clipcheck 結果與需要人工處理的事）。`,
  ].join('\n'), { label: '整合', schema: S_INT })
}

// ================================================================ 8. 收尾（一定執行，確保推送與釋放鎖）
phase('收尾')
const facts = { run: RUN, mode: MODE, from: FROM, explored, synth: syn, reviews, select: sel, made, integrate: integ }
const fin = await spawn([
  `你是 gh-new-algos 工作流程的「收尾」步驟。`, CTX,
  `本次各步驟的結果（JSON）：${JSON.stringify(facts)}`,
  `依序執行：`,
  `1. 若 ${DIR}/report.md 存在，在最後加一節「執行紀錄」：mode、各步驟結果摘要、agent 使用數 ${used + 1}。不存在就建立一份簡短報告。`,
  BUILD ? `2. python build.py 確認沒有警告。` : `2. （propose 模式不改網站，略過 build。）`,
  `3. git add -A、commit（「wf ${RUN}: gh-new-algos ${MODE}」＋摘要，最後一行「Co-Authored-By: Claude <noreply@anthropic.com>」）。`,
  `4. 推送：git fetch origin main；origin/main 有新提交就 git merge origin/main（data.js、演算法總表.md 衝突時 python build.py 後 git add；其他衝突就 git merge --abort、不要推送）；然後 git push origin HEAD:main，永遠不可 force push。${DRY ? '（本次為 dry run：不要 push。）' : ''}`,
  `5. python tools/wf_lock.py release（一定要做）。`,
  `回傳 pushed，以及 summary：5–8 行繁體中文摘要（新候選數、入選清單、新家族、已接進網站的演算法、報告路徑 ${DIR}/report.md、需要人工處理的事；propose 模式要提醒「確認後以 mode:"add", from:"${RUN}" 執行」）。`,
].join('\n'), { label: '收尾', schema: S_FIN })

const result = {
  ok: !!fin, run: RUN, mode: MODE, agents: used,
  selected: selected.map(s => `${s.id} ${s.name_zh}`),
  integrated: integ ? integ.integrated : [],
  report: `${DIR}/report.md`,
  pushed: !!(fin && fin.pushed),
  summary: fin ? fin.summary : '收尾 agent 失敗：請檢查 wf-lock 是否已釋放（python tools/wf_lock.py status）。',
}
log(result.summary)
return result
