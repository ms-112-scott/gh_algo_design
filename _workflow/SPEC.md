# SPEC｜沒有 Workflow 工具時的執行方式（雲端排程用）

`.claude/workflows/gh-enrich.js` 與 `gh-new-algos.js` 是正式流程，需在支援 Dynamic Workflows 的 Claude Code（CLI／桌面版）執行。
Claude app 的雲端排程工作階段可能**沒有** Workflow 工具；這時由協調者（你）照本文件，用 **Agent 工具**執行完全相同的步驟。

- 兩個 JS 檔裡的 agent 提示就是範本：打開對應的 `.js`，把 `${RUN}`、`${u.algo}` 等變數代入後原樣使用。
- 協調者自己可以跑 shell，所以 JS 裡「準備／去重關卡／合併／收尾」這些 shell 步驟**由你直接做**，不必派 agent。
- **每次執行最多呼叫 30 次 Agent（含重試），同時最多 16 個**；在同一則訊息送出多個 Agent 呼叫就會並行。

## 共同前置
1. 若工作目錄沒有 repo：`git clone https://github.com/ms-112-scott/gh_algo_design.git` 後 `cd gh_algo_design`。
2. RUN 編號：台北時間 `RYYYYMMDD-HHMM`（例如 `python -c "import sys;sys.path.insert(0,'tools');import wf_common;print(wf_common.run_id())"`）。
3. `pip install --break-system-packages opencc-python-reimplemented playwright pillow`（已安裝就略過）。

## gh-enrich（既有演算法補充）
1. **準備**：照 `gh-enrich.js` 準備 agent 的 1–6 步自己執行（git 同步、`python tools/wf_lock.py acquire RUN --wait 9`（仍 LOCKED 就重複，最多 5 次，約 45 分鐘）、clipcheck 基準、`python tools/wf_plan.py --select RUN --stage1 15 --stage3 8`）。仍被占用或 ALL_DONE 就依 JS 的處理結束。
   `wf_plan.py` 會自動納入 gh-new-algos 新增的演算法與新家族（資料檔 `data/ag_<編號>.json` 或 A–F 以外的家族），並在 P0 之後優先處理（`config.json` 的 `priority_new_algos`）。
2. **內容產出**：plan 的 stage1 每個單元一個 Agent（`contentPrompt` 範本），一次並行送出（最多 15 個）。
3. **去重審查**：自己跑 `python tools/wf_dedup.py RUN`；把 `need_review` 檔案分成最多 3 批，每批一個審查 Agent（JS 的審查範本）。
4. **合併**：自己照 JS 合併 agent 的 1–6 步執行（`wf_merge.py`、`build.py`、`sanitize.py --check`、`zhcheck.py --all`、commit、推送、`wf_plan.py --art RUN --stage3 8`）。
5. **卡片圖**：stage3 每個演算法一個 Agent（JS 的卡片圖範本），最多 8 個。
6. **驗收**：派 1 個 Agent 打開本次 `_shots/art_<編號>.png` 做獨立檢查、寫 `_workflow/redo_art.json`（避免自己檢查自己）；其餘照 JS 收尾步驟自己做：`build.py`、`clipcheck.py`（不可大於基準）、寫 `_workflow/runs/RUN.md`、commit、推送、`python tools/wf_lock.py release`（一定要做）。
7. 用 SendUserMessage 送出摘要（5–8 行）。

名額：內容 ≤ 15 ＋ 審查 ≤ 3 ＋ 卡片圖 ≤ 8 ＋ 驗收 1 ＝ ≤ 27。

### 模型分配（呼叫 Agent 時一定要指定 `model`）
協調者本身維持排程設定的模型（Opus）。派出的 Agent 依角色指定：

| 角色 | model | 理由 |
|---|---|---|
| VAR 新變形 | `opus` | 要理解演算法原理、分類既有變形並避開重複，需要創作判斷 |
| 審查 | `opus` | 品質關卡；用不同模型交叉檢查 Sonnet 的產出 |
| 卡片圖：新演算法補基本生成器（no_gen）或重畫（redo） | `opus` | 較難的程式與視覺判斷 |
| 驗收（看總覽圖、寫 redo_art.json） | `opus` | 視覺品質把關 |
| RES 建築／研究案例、CC creative coding 案例、FIX 補網址 | `sonnet` | 以大量搜尋與查證為主 |
| 一般卡片圖 | `sonnet` | 依規格補畫；由 Opus 驗收把關 |

設定值在 `_workflow/config.json` 的 `models`（與 `gh-enrich.js` 的 `MODEL_DEFAULT` 一致）。一次完整執行約 Opus 10、Sonnet 20。

## gh-balance（數位研究／藝術設計 1:1、真實圖片、卡片圖重畫）
正式流程是 `.claude/workflows/gh-balance.js`，**要在自己的電腦執行**（找圖要下載各網站圖片；雲端只能連 GitHub）。沒有 Workflow 工具時，照 JS 的提示範本用 Agent 工具做：
1. **準備**（自己做）：git 同步、`python tools/wf_lock.py acquire RUN --wait 9`、`python tools/ct_index.py`、`python build.py`、clipcheck 基準、`python tools/bal_plan.py prep RUN`（units）、`python tools/bal_plan.py artvar RUN`（先行的變形圖單元）。
2. **分類與替換**：units 每個一個 Agent（sonnet，`balance.md`）；同時派先行變形圖 Agent（opus，`artbal.md`，只畫變形）。
3. **審查**：每 4 個演算法一個 Agent（opus，`balreview.md`），輸出 `BALREV_<第一個演算法>.json`。
4. **合併**（自己做）：`python tools/bal_merge.py RUN` → `build.py` → `sanitize.py --check`、`zhcheck.py --all` → `wf_plan.py --index` → commit（不要 add assets/）、推送 → `python tools/bal_plan.py images RUN --per 18`。
5. **找圖**：每個 image unit 一個 Agent（sonnet，`imgreal.md`）。
6. **卡片圖**：等先行變形圖做完 → `build.py`、commit、推送 → `python tools/bal_plan.py art RUN` → 每個 art unit 一個 Agent（hard 用 opus，其餘 sonnet；`artbal.md`）。
7. **收尾**（驗收交給 opus Agent）：`bal_plan.py status` 兩類相等、`imgdup.py`、artsheet 目視、抽查新照片、`sanitize`／`zhcheck`／`clipcheck`、寫 `_workflow/runs/RUN.md`、commit、推送、`python tools/wf_lock.py release`。
同一個 RUN 可重跑續做（已完成的單元會略過）。同時執行最多 16 個 Agent。

## gh-new-algos（新家族／新演算法）
依 `gh-new-algos.js` 的 mode（預設 propose）：
- **propose**：準備（自己做，含 `python tools/wf_plan.py --index`）→ 5 個探索 Agent（JS 的 DIRECTIONS 與探索範本）→ 彙整 Agent → 最多 3 個候選審查 Agent → 挑選 Agent → 自己收尾（報告、commit、推送、釋放鎖）。
- **add**：準備（讀 `_workflow/explore/<from>/selected.json`）→ 每個入選演算法一個建立 Agent（最多 8）→ 整合 Agent → 自己收尾。
- **auto**：兩者依序做完。

## 推送規則（兩個流程相同）
`git fetch origin main`；有新提交就 `git merge origin/main`；`data.js`、`演算法總表.md` 衝突時 `python build.py` 後 `git add` 完成 merge；其他衝突就 `git merge --abort`、不推送、回報。然後 `git push origin HEAD:main`。永遠不可 force push。
commit 訊息：`wf RUN: <摘要>`，最後一行 `Co-Authored-By: Claude <noreply@anthropic.com>`。
