# 所有 agent 共用規則

這些規則適用於 `_workflow/specs/` 裡的每一種 agent。你的單元規格會再補充細節；兩者衝突時以單元規格為準，但「絕對規則」永遠優先。

## 絕對規則
1. **只寫你被指定的輸出檔**。不可修改 data/*.json、data.js、assets/、index.html 或其他 agent 的檔案（art agent 例外：它只能改自己負責的 `assets/art/<編號>.js`）。
2. **不可捏造**。作品、作者、年份、網址、文獻都必須查證過；查不到就不要收，寧缺勿濫。
3. 全部文字用**繁體中文（台灣用語）**，絕不可出現簡體字；專有名詞可保留英文。常見用語：程式、資料、網路、介面、元件、演算法、迴圈、陣列、物件、預設、參數、品質、影片、圖片。
4. 只在 repo 內工作；不 commit、不 push（協調流程會統一處理）。
5. 網站內容不可出現特定課程週次或課堂流程字句（例如「W3」「課堂」「學生」），改用通用說法（「基礎範例」「學習者」）。

## 不收的內容
神經網路相關（神經網路、深度學習、GAN、CNN、感知器、自組織映射 SOM）與格子波茲曼（LBM）超出教學難度，不要加入任何變形、案例、專案發想或參考（使用者 2026-09-28 決定）。

## 查證方式
- 用 **WebSearch** 找、用 **WebFetch** 打開頁面確認標題、作者、年份相符。
- WebSearch 額度用完時，用 ToolSearch 載入 `mcp__Parallel_Search__web_search`、`mcp__Parallel_Search__web_fetch` 改用。
- 雲端工作階段的 shell 連不到外部網站（只能連 GitHub 與套件庫），**不要用 curl／wget／Python 抓網頁**；本機執行時也一律用 WebFetch，讓兩種環境結果一致。
- 每筆資料附 `evidence`：一句話寫出你在頁面上看到的確認內容（例如頁面標題）。

## 既有內容與去重
- 開工前先讀 `_workflow/index/<演算法>.json`：既有變形、既有案例（標題、作者、年份、網址、類別、尺度、工具）、分布統計、以及**曾被拒絕的項目**（不要再提）。
- 全目錄摘要在 `_workflow/index/_catalog.md`（所有演算法、變形、專案種子）。
- 同一件作品（即使網址不同頁、或換了標題）已經收錄過，就不要再收。
- 跨演算法可以引用同一件作品，但摘要必須講「本演算法」在作品中的角色，且審查會特別檢查。

## 列舉值
- `category`：`2d-pattern` `3d-architecture` `modeling` `drawing` `urban-landscape` `fabrication` `performance` `art-installation`
- `scale`：`物件` `構件` `立面／表皮` `建築` `群體／都市` `地景`
- `difficulty`／`level`：1 入門、2 基礎、3 中階、4 進階、5 研究級
- `logic`：`直接公式` `改寫／遞迴` `迭代模擬` `搜尋／求解` `幾何轉換`

## 輸出檔驗證
寫完用 `python -c "import json;json.load(open(r'<路徑>',encoding='utf-8'))"` 確認能解析，並跑 `python tools/zhcheck.py <路徑>` 確認沒有簡體字。
