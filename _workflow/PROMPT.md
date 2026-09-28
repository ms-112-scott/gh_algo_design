# 排程提示詞

排程還沒建立。要開始時，把下面其中一段設成排程任務的提示詞（每 3 小時）。

## A. 在 Claude Code 桌面版的排程（有 Workflow 工具）

```
在 gh_algo_design 儲存庫內（先 git pull origin main）執行 /gh-enrich 工作流程，args 為 {"run": "<現在的台北時間，格式 RYYYYMMDD-HHMM>"}。
全程使用繁體中文。工作流程結束後，把它回傳的 summary 原文轉述給我；若回傳 all_done 為 true，只回覆「GH 圖鑑內容豐富化已全部完成，可以停用排程」。
```

## B. Claude app 雲端排程（可能沒有 Workflow 工具）

```
你是 GH 演算法設計圖鑑（gh_algo_design）排程工作流程的協調者。全程使用繁體中文（台灣用語）。
1. git clone https://github.com/ms-112-scott/gh_algo_design.git（已存在就 git pull origin main），進入該資料夾。
2. 若有 Workflow 工具：執行 /gh-enrich，args 為 {"run": "<現在的台北時間 RYYYYMMDD-HHMM>"}。
   沒有 Workflow 工具：讀 _workflow/SPEC.md，照「gh-enrich」段落用 Agent 工具執行，提示範本取自 .claude/workflows/gh-enrich.js。
3. 硬性規則：
   - 本次最多呼叫 30 次 Agent（含重試），同時最多 16 個。
   - 直接推送到 main，不可 force push；只修改本儲存庫內的檔案。
   - 不可捏造作品、作者、年份、網址；查證不到就不收。
   - 既有內容只能新增或補空白欄位，不可刪除、改寫或重排；需要刪除的只寫進報告。
   - 取不到鎖（python tools/wf_lock.py acquire 印出 LOCKED）就直接結束。結束前一定要 python tools/wf_lock.py release。
4. 結束時用 SendUserMessage 送出 5–8 行摘要：本次處理的家族與單元、各類新增數量、被拒數量與主因、剩餘缺口、需要人工處理的事。
5. 若 wf_plan.py 回報 ALL_DONE：只送出「GH 圖鑑內容豐富化已全部完成，可以停用排程」並結束。
```

## gh-new-algos 不建議排程
新家族與新演算法會改變網站架構，建議手動執行：先 `propose` 看報告，再用 `add` 建立。
