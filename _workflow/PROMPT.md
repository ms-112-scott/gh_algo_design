# 排程提示詞

把下面其中一段設成排程任務的提示詞（每 3 小時）。

## A. 在 Claude Code 桌面版的排程（有 Workflow 工具）

```
在 gh_algo_design 儲存庫內（先 git pull origin main）執行 /gh-enrich 工作流程，args 為 {"run": "<現在的台北時間，格式 RYYYYMMDD-HHMM>"}。
全程使用繁體中文。工作流程結束後，把它回傳的 summary 原文轉述給我；若回傳 all_done 為 true，只回覆「GH 圖鑑內容豐富化已全部完成，可以停用排程」。
```

## B. Claude app 雲端排程（目前使用中：2026-09-28 23:59 起每 3 小時一次，共 4 次）

```
你是 GH 演算法設計圖鑑（gh_algo_design）內容豐富化排程的協調者。全程使用繁體中文（台灣用語）。
1. 取得 repo：目前目錄沒有就 git clone https://github.com/ms-112-scott/gh_algo_design.git，進入資料夾後 git checkout main、git pull origin main。
   安裝：pip install --break-system-packages opencc-python-reimplemented playwright pillow（已安裝就略過）。
2. RUN 編號＝現在的台北時間，格式 RYYYYMMDD-HHMM。
3. 執行 gh-enrich：有 Workflow 工具就執行 /gh-enrich（.claude/workflows/gh-enrich.js），args {"run": RUN}；
   沒有就讀 _workflow/SPEC.md 的「gh-enrich」段落，用 Agent 工具照做，提示範本取自 .claude/workflows/gh-enrich.js（變數代入後原樣使用）。
4. 硬性規則：
   - 本次最多呼叫 30 次 Agent（含重試），同時最多 16 個。
   - 鎖：python tools/wf_lock.py acquire RUN --wait 9，仍 LOCKED 就重複，最多 5 次；仍被占用就不做任何修改，送出「本次因鎖被占用而略過」後結束。取得鎖後，結束前一定要 python tools/wf_lock.py release。
   - 要納入 gh-new-algos 新增的演算法與新家族：開工前一定 git pull 取得最新 main；wf_plan.py 會自動把它們排在 P0 之後優先處理。
   - 每次完成都推送到 main：推送前 git fetch origin main，有新提交就 git merge origin/main（data.js、演算法總表.md 衝突就 python build.py 後 git add；其他衝突就 git merge --abort 並回報）；然後 git push origin HEAD:main。不可 force push。
     推送若因權限失敗：用 ToolSearch 載入 mcp__claude-code-remote__add_repo，以 owner=ms-112-scott、repo=gh_algo_design、access=push 呼叫後重試一次。
   - 只修改本儲存庫內的檔案；不可捏造作品、作者、年份、網址，查證不到就不收；既有內容只能新增或補空白欄位，不可刪除、改寫或重排。
5. 結束時用 SendUserMessage 送出 5–8 行摘要：本次處理的家族與單元（含哪些是新演算法／新家族）、各類新增數量、被拒數量與主因、卡片圖、是否已推送、剩餘缺口、需要人工處理的事。
6. 若 wf_plan.py 回報 ALL_DONE：release 鎖，只送出「GH 圖鑑內容豐富化已全部完成，可以停用排程」並結束。
```

## gh-new-algos 不建議排程
新家族與新演算法會改變網站架構，建議手動執行：先 `propose` 看報告，再用 `add` 建立。
