# 內容擴充工作流程

這個資料夾放「GH 演算法設計圖鑑」的兩個自動化工作流程所需的規格、狀態與紀錄。底線開頭的資料夾不會被 GitHub Pages 發佈。

## 兩個工作流程

| 工作流程 | 檔案 | 做什麼 | agent 數 |
|---|---|---|---|
| **gh-new-algos** | `.claude/workflows/gh-new-algos.js` | 探索可新增的**新家族與新演算法**：5 個方向探索（A/F、B/C、D/E、全新家族、外部教材稽核）→ 跨方向去重 → 審查查證 → 挑選編號 →（add）建立資料、卡片生成器、C# 範例 → 接進網站 | propose 12、add ≤ 11、auto ≤ 21 |
| **gh-enrich** | `.claude/workflows/gh-enrich.js` | **既有演算法補充**變形與案例：依缺口挑單元 → 產出 → 機械去重＋審查查證 → 合併 → 補卡片圖 → 驗收推送 | 每次 ≤ 30 |

兩者都直接推送到 `main`，並用遠端分支 `wf-lock` 當鎖，不會同時執行。

### 在 Claude Code 執行（CLI 或桌面版，需支援 Dynamic Workflows）
在 repo 內：
```
/gh-new-algos   args: {"run": "R20260929-0900"}                      ← 只探索、產出報告（propose）
/gh-new-algos   args: {"run": "R20260929-1200", "mode": "add", "from": "R20260929-0900"}   ← 看過報告後建立
/gh-new-algos   args: {"run": "R20260929-0900", "mode": "auto", "max_new": 6}               ← 一次做完
/gh-enrich      args: {"run": "R20260929-0300"}
```
`run` 是台北時間的執行編號（workflow 腳本裡不能取得時間，所以要傳進去）。加 `"dry": true` 就只 commit 不推送。
也可以直接用自然語言：「執行 /gh-enrich，run 用現在的台北時間」。

### 雲端排程（Claude app）
雲端排程工作階段可能沒有 Workflow 工具，這時照 `SPEC.md` 用 Agent 工具執行相同流程。排程提示詞見 `PROMPT.md`。

## 流程重點
- **完成定義**（`config.json`）：每個演算法 變形 ≥ 16、建築／研究案例 ≥ 18、creative coding 案例 ≥ 8、網址空白 0、每個變形與無照片案例都有獨立卡片圖。
- **優先序**：P0（缺卡片圖、變形 < 12、沒有 creative coding 案例、網址空白）→ gh-new-algos 新增的演算法（`priority_new_algos`）→ 完成度最低的家族。新演算法與新家族不需要任何設定，合併進 data 後下一次執行就會被納入。
- **三層去重**：① 缺口每次從資料直接計算，已完成／已耗盡的單元不再排；② `tools/wf_dedup.py` 比對網址（正規化）、標題、作者＋年份、變形字詞相似度、曾被拒清單；③ 非撰寫者的審查 agent 用 WebFetch 查證並判斷語意重複。
- **只新增不改舊**：合併只 append；既有內容與卡片圖不會被改寫或重排（網址 `#var:C01:3` 等保持有效）。
- **耗盡規則**：同一演算法同一類型連續 2 次查不到足量可查證的案例，就把目標降為現有數量。

## 檔案

| 路徑 | 用途 |
|---|---|
| `config.json` | 目標數量、每單元產量、agent 名額、去重門檻、鎖的過期時間 |
| `SPEC.md` | 沒有 Workflow 工具時的執行步驟 |
| `PROMPT.md` | 排程任務的提示詞 |
| `specs/_common.md` | 所有 agent 的共用規則（不可捏造、繁體中文、查證方式、列舉值） |
| `specs/var.md` `res.md` `cc.md` `fix.md` `review.md` `art.md` | gh-enrich 各類 agent 規格 |
| `specs/explore.md` `select.md` `candreview.md` `newalgo.md` `integrate.md` | gh-new-algos 各類 agent 規格 |
| `index/` | 每個演算法的既有內容摘要（去重用），`_catalog.md` 為全目錄；由 `tools/wf_plan.py` 產生 |
| `backlog.json` | 目前所有待做單元 |
| `ledger.json` | 每個單元的嘗試次數、結果、耗盡標記、FIX 嘗試次數、每次執行摘要 |
| `rejected.json` | 被拒的內容（之後不再收） |
| `image_queue.json` | 等待在本機下載的圖片 |
| `redo_art.json` | 驗收時判定要重畫的卡片圖 |
| `runs/` | 每次執行的計畫（`*.plan.json`）與報告（`*.md`） |
| `stage/` | 每次執行的暫存產出、去重與審查結果（保留供追查） |
| `explore/` | gh-new-algos 每次的探索結果、`report.md`、`selected.json` |
| `orphan_images/` | 找不到對應案例的舊圖片（先前中斷的 agent 留下的 F 家族圖），保留備查 |

## 工具（`tools/`）

| 指令 | 用途 |
|---|---|
| `python tools/wf_plan.py` | 現況表：每個演算法的變形、案例、缺圖與總缺口（`--no-art` 略過瀏覽器） |
| `python tools/wf_plan.py --select RUN` | 挑選本次單元 → `runs/RUN.plan.json` |
| `python tools/wf_dedup.py RUN` | 機械去重 |
| `python tools/wf_merge.py RUN` | 合併通過的內容 |
| `python tools/wf_lock.py status` | 查看鎖；`acquire RUN`／`release` |
| `python tools/zhcheck.py --all` | 簡體字檢查 |
| `python tools/fetch_images.py` | **在自己電腦上**下載排隊的圖片（雲端連不到大多數網站），之後跑 `python build.py` 並 commit |

## 需要人工處理的事
- 新演算法的 C# 範例（`cs/`）由 agent 撰寫，需在 Rhino 8 實測。
- 排隊的圖片要在本機跑 `python tools/fetch_images.py`。
- 既有的重複案例（同一演算法內研究案例與 creative coding 案例指向同一作品）只列在報告，不會自動刪改。
- FIX 查了 2 次仍找不到出處的案例，列在報告等人工決定。
