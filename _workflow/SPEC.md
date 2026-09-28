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
1. **準備**：照 `gh-enrich.js` 準備 agent 的 1–6 步自己執行（git 同步、`python tools/wf_lock.py acquire RUN`、clipcheck 基準、`python tools/wf_plan.py --select RUN --stage1 15 --stage3 8`）。鎖被占用或 ALL_DONE 就依 JS 的處理結束。
2. **內容產出**：plan 的 stage1 每個單元一個 Agent（`contentPrompt` 範本），一次並行送出（最多 15 個）。
3. **去重審查**：自己跑 `python tools/wf_dedup.py RUN`；把 `need_review` 檔案分成最多 3 批，每批一個審查 Agent（JS 的審查範本）。
4. **合併**：自己照 JS 合併 agent 的 1–6 步執行（`wf_merge.py`、`build.py`、`sanitize.py --check`、`zhcheck.py --all`、commit、推送、`wf_plan.py --art RUN --stage3 8`）。
5. **卡片圖**：stage3 每個演算法一個 Agent（JS 的卡片圖範本），最多 8 個。
6. **驗收**：派 1 個 Agent 打開本次 `_shots/art_<編號>.png` 做獨立檢查、寫 `_workflow/redo_art.json`（避免自己檢查自己）；其餘照 JS 收尾步驟自己做：`build.py`、`clipcheck.py`（不可大於基準）、寫 `_workflow/runs/RUN.md`、commit、推送、`python tools/wf_lock.py release`（一定要做）。
7. 用 SendUserMessage 送出摘要（5–8 行）。

名額：內容 ≤ 15 ＋ 審查 ≤ 3 ＋ 卡片圖 ≤ 8 ＋ 驗收 1 ＝ ≤ 27。

## gh-new-algos（新家族／新演算法）
依 `gh-new-algos.js` 的 mode（預設 propose）：
- **propose**：準備（自己做，含 `python tools/wf_plan.py --index`）→ 5 個探索 Agent（JS 的 DIRECTIONS 與探索範本）→ 彙整 Agent → 最多 3 個候選審查 Agent → 挑選 Agent → 自己收尾（報告、commit、推送、釋放鎖）。
- **add**：準備（讀 `_workflow/explore/<from>/selected.json`）→ 每個入選演算法一個建立 Agent（最多 8）→ 整合 Agent → 自己收尾。
- **auto**：兩者依序做完。

## 推送規則（兩個流程相同）
`git fetch origin main`；有新提交就 `git merge origin/main`；`data.js`、`演算法總表.md` 衝突時 `python build.py` 後 `git add` 完成 merge；其他衝突就 `git merge --abort`、不推送、回報。然後 `git push origin HEAD:main`。永遠不可 force push。
commit 訊息：`wf RUN: <摘要>`，最後一行 `Co-Authored-By: Claude <noreply@anthropic.com>`。
