# IMGREAL｜每個案例都找到自己的真實圖片

先讀 `_workflow/specs/_common.md`。

## 背景（使用者 2026-09-29 決定）
- 每個案例都要有**不同的**圖片，優先用網路上的**真實圖片**；找不到才由卡片圖步驟畫示意圖。
- **藝術設計**案例（`source: art`）：一定要是**作品本身的演算法生成畫面**。
- **數位研究**案例（`source: research`）：該專案本身的圖——建成作品實景、裝置現場、研究原型照片、論文中呈現成果的圖、軟體工具產出的畫面。
- **一律不用**：YouTube／Vimeo 縮圖、影片標題卡、講者人像、教學封面、logo、程式編輯器或介面截圖（除非該案例就是介面本身）、和作品無關的通用圖、空白或載入失敗的圖。

## 你的清單
協調流程給你一個演算法的兩種清單：
- `todo`：目前**沒有照片**的案例 → 找圖。
- `check`：已有照片，但屬於藝術設計或出處像影片縮圖 → 用 Read 打開 `img/cases/<編號>.jpg` 檢查；合格就 `kept`，不合格就換圖（找不到合格的就移除照片，讓卡片圖步驟畫示意圖）。
案例資料在 `data/*.json`（用編號找：title、creator、year、url、summary、source、category）。

## 找圖
1. 先看案例 `url` 的頁面（WebFetch，要求列出 og:image、twitter:image 與頁面內 `<img>` 的完整網址與替代文字），再用 WebSearch 找其他頁面（事務所／藝術家網站、ArchDaily、Dezeen、designboom、Wikimedia Commons、論文頁、GitHub README、OpenProcessing、Behance）。
2. 藝術設計案例：The Coding Train 相關用 `python tools/ct_index.py 關鍵字` 找範例執行畫面；GitHub 專案用 README 示範圖的 `raw.githubusercontent.com` 網址。
3. 研究論文：開放取用的論文頁常有圖片（arXiv、MDPI、Frontiers、CumInCAD 的摘要頁不一定有）；只有 PDF 時可以找作者網站或研究室頁面的成果圖。
4. **不可以猜網址格式**；只用你在頁面上實際看到的網址。
5. 每個案例最多花 3 次搜尋；真的找不到就記 `none`，交給畫示意圖。

## 下載、確認、登記
1. 預覽：`python tools/setimg.py <編號> "<圖片網址>" --preview`，用 Read 打開 `_shots/cand/<編號>.jpg` **親眼確認**是這件作品、符合上面的規則。
2. 登記：
   `python tools/setimg.py <編號> _shots/cand/<編號>.jpg --page "<圖片所在頁面>" --source "<來源名稱>" --author "<作者>" --license "<授權>" --note "<一句話說明畫面>"`
   - 授權：頁面明確標示就照寫（例如 CC BY 4.0、CC BY-SA 4.0、MIT），否則寫「網頁預覽圖，教學引用」。Wikimedia Commons 要寫檔案頁標示的授權與作者。
   - `--note` 用繁體中文，描述圖上是什麼（例如「Truchet 磁磚以四分之一圓弧拼成的蜿蜒曲線，黑白印刷版」）。
   - 論文圖、白底截圖會自動裁白邊；不想裁加 `--no-trim`。
3. 移除不合格的既有照片（找不到替代圖時）：`python tools/setimg.py <編號> --remove`。
4. 同一張圖不可以給兩個案例；同一件作品的不同案例要用不同畫面。

## 輸出
`<協調流程指定的檔案>`（例如 `_workflow/stage/<RUN>/IMG_A02a.json`）：
```json
{"unit": "IMG:A02a", "algo": "A02",
 "results": [
   {"id": "A02-03", "status": "new", "url": "圖片網址", "page": "出處頁", "note": "畫面說明"},
   {"id": "A02-51", "status": "replaced", "url": "…", "page": "…", "note": "原本是 YouTube 縮圖，換成範例執行畫面"},
   {"id": "A02-52", "status": "kept", "note": "已確認是作品生成畫面"},
   {"id": "A02-53", "status": "removed", "note": "原圖為影片標題卡，找不到作品畫面"},
   {"id": "A02-07", "status": "none", "note": "查了 3 個來源都沒有作品圖"}
 ]}
```
清單裡每個案例都要有一筆。寫完驗證 JSON 可解析。

## 只能修改
- `img/cases/<你清單裡的案例>.jpg`、`img/credits*.json`（**只透過 `tools/setimg.py`**，它會處理多個 agent 同時寫入）
- 你的輸出檔、`_shots/cand/` 預覽圖
不要改 data、assets 或其他案例的圖。不要 commit。

## 回報
一行：todo 找到幾張（沒找到幾個）、check 保留／更換／移除各幾張。
