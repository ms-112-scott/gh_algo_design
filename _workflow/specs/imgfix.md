# IMGFIX｜每張卡片都要有自己的圖

先讀 `_workflow/specs/_common.md` 與 `_workflow/specs/art.md`（畫法介面與要求都照 art.md）。

## 問題
`python tools/imgdup.py` 會列出每個演算法的四種問題（明細在 `_workflow/imgdup.json`）：
- `fallback`：變形或無照片案例沒有自己的畫法，網站只好用演算法生成器換亂數，看起來和演算法卡幾乎一樣
- `like_algo`：畫出來的圖和演算法本身的卡片圖近乎相同
- `near_dup`：同一演算法底下兩張卡片近乎相同（成對列出）
- `photo_dup`：兩個案例用了同一張實景照片

目標：你負責的演算法，這四項全部歸零。

## 做法
### 案例（先找真實圖片，找不到才畫示意圖）
1. 用 WebSearch／WebFetch 找**該作品本身**的圖片：作品頁的 og:image、Wikimedia Commons、論文的 CC BY 圖、GitHub README 的示範圖。必須是這件作品，不能是 logo、通用圖或別的作品。**不可用 YouTube／Vimeo 縮圖、影片標題卡、講者人像或教學封面**（使用者 2026-09-29 決定）；藝術設計案例一定要用作品本身的演算法生成畫面（The Coding Train 的範例輸出圖在其 GitHub repo 的 `content/videos/<路徑>/images/`）。
2. 圖片網址的主機是 `raw.githubusercontent.com`、`user-images.githubusercontent.com`、`github.com/…/raw/…`、`*.github.io`：雲端可以直接下載——
   `curl -sSL -m 30 -o /tmp/<編號>.img "<網址>"`，確認是圖片後
   `python tools/addimg.py <案例編號> /tmp/<編號>.img "<來源名稱>" "<授權>" "<出處頁網址>" "<一句話說明>"`
   （本機執行時任何主機都可以這樣下載。）
3. 其他主機（雲端下載不到）：把 `{"case_id","url","page","source","author","license","license_url","note","queued_run"}` 加進 `_workflow/image_queue.json`（使用者之後在本機跑 `python tools/fetch_images.py`），**同時**照第 4 步畫一張示意圖，讓網站現在就不重複。
4. 畫示意圖：依案例的 summary／category／scale 取景（建築量體、平面配置、基地鳥瞰、構件、裝置、繪圖機線稿…），寫在 `assets/art/<演算法>.js` 的 `ART.case["<案例編號>"]`。
5. 授權欄：作品頁明確標示授權就照寫（CC BY 4.0、MIT…），否則寫「網頁預覽圖，教學引用」。

### 變形（畫圖示）
依變形的 how／result 畫出**這個改法的結果**（3D 化、曲面上、吸引子、邊界、混合其他演算法、製造輸出、分析色階…），寫在 `ART.var["<演算法>"][<索引>]`。不可只換亂數種子。

### 重畫
`like_algo`、`near_dup` 列出的項目、以及 `_workflow/redo_art.json` 裡屬於你的項目，**可以改寫既有的畫法函式**（這是 art.md「既有畫法不可改動」的例外，只限這些項目）。成對的 `near_dup` 只要改其中一張，讓兩張在構圖或視角上明顯不同。

## 只能修改
- `assets/art/<你負責的演算法>.js`
- `img/cases/<你負責演算法的案例>.jpg` 與 `img/credits.json`（只透過 `tools/addimg.py`）
- `_workflow/image_queue.json`（只新增你負責的案例）
（多個 agent 同時執行時，`img/credits.json` 與 `image_queue.json` 可能同時被寫：寫之前重新讀檔、只加自己的項目、寫完馬上存檔。）

## 自我檢查
1. `node --check assets/art/<演算法>.js`
2. `python build.py`（圖片有新增時要重建）
3. `python tools/imgdup.py <演算法>`：fallback、like_algo、near_dup、errors 都是 0
4. `python tools/artsheet.py <演算法>`，用 Read 打開 `_shots/art_<演算法>.png`：每張都不同、看得出和標題的關係、沒有空白或壞圖；slow 與 errors 為空

## 回報
一行：找到真實圖片幾張（直接下載幾張、排隊幾張）、畫示意圖幾張、重畫幾張、imgdup 結果。
