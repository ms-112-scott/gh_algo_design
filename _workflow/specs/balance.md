# BALANCE｜案例分成「數位研究／藝術設計」並把兩者調成一樣多

先讀 `_workflow/specs/_common.md`。本規格的圖片規則比其他規格嚴格，衝突時以本檔為準。

## 背景（使用者 2026-09-29 決定）
- 案例的「來源」標籤改成兩類：**數位研究（research）**、**藝術設計（art）**，取代原本的「建築與研究／Creative Coding」。網站已改用案例的 `source` 欄位。
- 全站兩類數量要**相等**；**不再增加案例總數**：藝術設計不夠的演算法，把最弱的研究案例換成新的藝術設計案例（每換一個就移除一個）。
- 藝術設計要以 **creative coding 藝術作品**為主，尤其是**平面、開放性的視覺表現**（生成藝術、圖樣、繪圖機作品、互動視覺、以視覺為目的的資料視覺化）。**優先找 p5.js、Processing**（OpenProcessing、The Coding Train、The Nature of Code、Generative Design、藝術家自己的草圖）；語言和 Grasshopper C# 不同沒關係，重點是讓學習者看懂背後的演算法。其次可用 openFrameworks、Shadertoy／GLSL、TouchDesigner、vvvv、three.js、繪圖機（pen plotter）作品等。
- 藝術設計案例的圖片**必須是作品本身的演算法生成畫面**。**不可以用** YouTube／Vimeo 縮圖、影片標題卡、講者人像、教學封面、logo、程式編輯器截圖。

## 分類準則
- **art 藝術設計**：作品的主要成果是視覺作品——生成藝術、creative coding 草圖（p5.js、Processing、openFrameworks、TouchDesigner、Shadertoy…）、平面／圖樣／紋理／字體／紡織設計、插畫、動態影像、藝術裝置、繪圖機作品、以視覺表現為目的的資料視覺化。
- **research 數位研究**：建成建築與營建專案、競圖、學術論文與研究原型、工程與性能分析、軟體工具與 Grasshopper 外掛、數學或科學說明、都市與環境分析、遊戲系統的技術說明。
- 邊界：
  - The Coding Train、Nature of Code 等教學，**成果是一張生成畫面** → art。純數學講解影片（例如 3Blue1Brown）→ research。
  - 美術館委託、藝術節、畫廊展出的裝置或立面 → art；一般建成建築 → research。
  - Grasshopper／Houdini 外掛與工具 → research；用工具做出來、以視覺為目的的作品 → art。
- 目前標為 creative coding（`currently_cc: true`）的案例**預設是 art**，除非明顯屬於 research。

## 輸入
- `_workflow/stage/<RUN>/in_<演算法>.json`：演算法說明、`final_total`、`target_art`、`target_research`、`must_remove_extra`、全部既有案例（含 `photo`：目前是否有照片與出處）。
- `_workflow/index/<演算法>.json`：去重用（既有內容、曾被拒絕的項目，不要再提）。全站目錄 `_workflow/index/_catalog.md`。
- **The Coding Train 範例輸出圖索引**：`python tools/ct_index.py 關鍵字 [關鍵字…]`（例如 `python tools/ct_index.py voronoi`）。每筆的 `image` 是該範例的**執行畫面**（在 GitHub repo 的 `images/`，不是影片縮圖），`page` 是作品頁。

## 步驟
1. **逐筆分類**所有既有案例：`art` 或 `research`，附 30 字內理由。
2. 計算 `need = target_art − 分類為 art 的數量`（`must_remove_extra` 為 1 時，另外要多移除 1 個研究案例、不補）。
3. **移除順序** `removal_order`：把所有 research 案例從最弱排到最強，至少列 `need + must_remove_extra + 3` 個。弱的判斷：和本演算法關係薄弱、與其他案例重複或高度相似、出處不明或難以查證、很難找到真實圖片。有真實照片、經典代表作、唯一的某類型（例如唯一的都市尺度）盡量留。每個附一句理由（`removal_reasons`）。
4. **新增藝術設計案例**：找 `need + 3` 個（多出的 3 個是備援，依好壞排序，最好的放前面）。每個都要：
   - 本演算法在作品中是核心（不是順帶用到）。
   - 用 WebFetch 打開作品頁確認標題、作者、年份；GitHub 儲存庫也可以。
   - 不和既有案例重複（包含本演算法的研究案例，以及 `_catalog.md` 裡其他演算法已收的同一件作品）。同一作者可以，但要不同作品。
   - **有生成畫面圖片，而且你親眼確認過**（見下方「圖片」），找不到合格圖片的作品不要收。
   - 同一演算法的新案例盡量涵蓋不同創作者與不同視覺風格；p5.js／Processing 至少占一半。
5. 若 `need ≤ 0`：不用移除也不用新增，但仍要完成分類，並照樣提供 3 個備援藝術案例與至少 3 個 `removal_order`（協調者可能用來補其他演算法的缺口）。

## 圖片（新增的藝術案例一定要有）
1. 找圖片直接網址，依優先序：The Coding Train 範例輸出圖（`tools/ct_index.py`）、作品 GitHub repo README 的示範圖（用 `raw.githubusercontent.com` 網址）、藝術家網站作品頁的大圖、OpenProcessing 草圖頁的縮圖、Wikimedia Commons、作品頁的 og:image（必須是作品畫面，不是頭像或 logo）。用 WebFetch 讀頁面時請要求列出 og:image 與 `<img>` 的完整網址，**不可以猜網址格式**。
2. **下載預覽並親眼確認**：
   `python tools/setimg.py <暫定編號> "<圖片網址>" --preview`（暫定編號用 `<演算法>-NEW1`、`<演算法>-NEW2`…）
   然後用 Read 打開它印出的 `_shots/cand/<暫定編號>.jpg`，確認是**這件作品的演算法生成畫面**（不是影片縮圖、人像、標題卡、logo、編輯器、空白）。不合格就換一張或放棄這個作品。
   （`setimg.py --preview` 只下載到 `_shots/cand/`，不會登記；正式登記由合併步驟處理。）
3. 在 `image.verified` 填 `true`，`image.checked` 寫一句你在圖上看到的內容。

## 輸出
`_workflow/stage/<RUN>/BAL_<演算法>.json`：
```json
{
  "algo": "F01",
  "classification": [{"id": "F01-01", "source": "research", "why": "…"}],
  "art_count": 3,
  "need": 4,
  "removal_order": ["F01-09", "F01-12", "…"],
  "removal_reasons": {"F01-09": "…"},
  "new_art": [
    {
      "title": "作品名稱（可中英並列）",
      "creator": "作者",
      "year": "2021",
      "category": "2d-pattern",
      "categories_extra": ["drawing"],
      "scale": "物件",
      "summary": "2–3 句：這是什麼作品、演算法在其中怎麼被使用、和 Grasshopper C# 基礎範例有什麼不同",
      "variations": [{"name": "…", "how": "相對於基礎範例要怎麼改（具體）", "effect": "…"}],
      "difficulty": 2,
      "tags": ["creative coding", "p5.js", "特性標籤"],
      "tools": ["p5.js"],
      "url": "https://…（作品頁）",
      "evidence": "WebFetch 看到的頁面標題或確認句",
      "nearest_existing": "最接近的既有案例編號與標題（沒有就寫「無」）",
      "image": {"url": "圖片直接網址", "page": "圖片所在頁面", "verified": true, "checked": "圖上看到什麼",
                "source": "來源名稱", "author": "作者", "license": "授權（沒有明確標示就寫「網頁預覽圖，教學引用」）",
                "license_url": "", "note": "一句話說明圖片畫面（會顯示在網站圖片下方）"}
    }
  ],
  "notes": "找不到足量時說明原因；其他需要協調者注意的事"
}
```
- `new_art` 依好壞排序；前 `need` 個會先用，其餘是備援。
- `variations` 2–3 條；`tags` 一定含 `"creative coding"` 與工具名；`category` 用 _common.md 的列舉值，平面作品多用 `2d-pattern`、`drawing`、`art-installation`；`scale` 平面作品用 `物件`。
- 寫完驗證 JSON 可解析，並跑 `python tools/zhcheck.py <檔案>`。

## 只能寫
`_workflow/stage/<RUN>/BAL_<演算法>.json`（與 `_shots/cand/` 的預覽圖）。不要改 data、img、assets 或其他檔案。

## 回報
一行：art／research 分類數、need、新增藝術案例幾個（全部已親眼確認圖片）、備援幾個、找不到足量的原因。
