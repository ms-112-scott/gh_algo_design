# Creative Coding 案例研究｜Agent 共用規格

## 背景
公開網站「GH 演算法設計圖鑑」收集建築參數化設計會用到的生成式演算法（Grasshopper C#）。現在要為每個演算法補上 **creative coding** 的案例，讓學習者看到同一個演算法在 p5.js、Processing、openFrameworks、TouchDesigner、Shadertoy／GLSL、three.js、vvvv、Houdini VEX 等創作程式環境裡怎麼被使用與變化。

## 絕對規則
1. **只能寫入這個資料夾**：`G:/我的雲端硬碟/02_碩班/09_教學/gh_algo_design/`。不可以修改這個資料夾以外的任何檔案。
2. 只能新增你自己的檔案（見「輸出」），不可以修改其他檔案。
3. 全部文字用**繁體中文（台灣用語）**，絕不可出現簡體字；專有名詞可保留英文。
4. **不可捏造**：作品、作者、年份、網址都必須查證過。查不到就不要收錄那個案例。

## 查證方式
- 先試 WebSearch 或 `mcp__claude_ai_Parallel_Search__web_search`（先用 ToolSearch 載入）。這個工作階段的搜尋額度可能已經用完；用完就改用下面的方法。
- **用 curl 直接打開頁面確認**（Python 內建的憑證庫在這台機器上會失敗，一律用 curl）：
  `curl -sSL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36" -m 20 <網址>`
  確認 HTTP 200，而且頁面內容（title、og:title、內文）真的是你要收錄的作品。
- 常用來源（可以直接瀏覽其索引頁找作品）：
  - The Coding Train：`https://thecodingtrain.com/challenges`（Coding Challenge 列表，每題有 p5.js 程式與影片）
  - The Nature of Code：`https://natureofcode.com/`（各章節）
  - p5.js 範例：`https://p5js.org/examples/`
  - Processing 範例：`https://processing.org/examples/`
  - OpenProcessing：`https://openprocessing.org/`（作品頁 `https://openprocessing.org/sketch/<id>`）
  - Generative Design（Generative Gestaltung）：`http://www.generative-gestaltung.de/2/`
  - Inconvergent（Anders Hoff）：`https://inconvergent.net/`
  - Shadertoy：`https://www.shadertoy.com/view/<id>`
  - Tyler Hobbs、Matt DesLauriers、Jason Webb（`https://jasonwebb.io/`、GitHub `jasonwebb/morphogenesis-resources`）、Sage Jenson 等創作者網站
  - GitHub 儲存庫（README 與示範圖）

## 每個案例的格式
寫進 `cases` 陣列，格式與網站既有案例相同：

```json
{
  "id": "A01-51",
  "algo": "A01",
  "title": "作品或教學名稱（可中英並列）",
  "creator": "作者／團隊",
  "year": "2016",
  "category": "drawing",
  "categories_extra": ["art-installation"],
  "scale": "物件",
  "summary": "2–3 句：這是什麼、演算法在其中怎麼被使用、跟基礎範例（Grasshopper C#）有什麼不同",
  "variations": [
    {"name": "變形名稱", "how": "相對於基礎範例要怎麼改（具體）", "effect": "得到什麼效果"}
  ],
  "difficulty": 2,
  "tags": ["creative coding", "p5.js", "動畫"],
  "tools": ["p5.js"],
  "url": "https://..."
}
```

- `id`：**從 51 開始編號**（A01-51、A01-52…），避免和既有案例衝突。
- `category` 只能用：`2d-pattern` `3d-architecture` `modeling` `drawing` `urban-landscape` `fabrication` `performance` `art-installation`
- `scale` 只能用：`物件` `構件` `立面／表皮` `建築` `群體／都市` `地景`
- `difficulty` 1–5（1 入門、2 基礎、3 中階、4 進階、5 研究級）
- `tags` **一定要包含 `"creative coding"`**，再加上工具名（`"p5.js"`、`"Processing"`、`"openFrameworks"`、`"TouchDesigner"`、`"GLSL"`、`"three.js"` 等）與其他特性標籤
- `tools` 填實際使用的工具
- `variations` 2–3 條

## 數量
每個負責的演算法 **4–6 個** creative coding 案例。來源要分散：不要全部都是同一個網站；至少涵蓋 3 種不同工具或平台。若某演算法真的找不到 4 個可查證的案例，就收錄找得到的數量，在回報中說明。

## 圖片（每個案例盡量都要有）
1. 從作品頁抓 `og:image`（或 `twitter:image`；YouTube 影片可用 `https://i.ytimg.com/vi/<影片ID>/hqdefault.jpg`；GitHub 儲存庫可用 README 裡的示範圖）。
2. 用 curl 下載到暫存檔，再用 Python PIL 轉成 RGB、`thumbnail((900, 900))`、存成 `img/cases/<案例編號>.jpg`（quality 84）。暫存檔放在 `_tmp_<agent key>/`，完成後刪除。
3. 確認圖片確實是該作品（不是網站 logo 或通用預設圖）；不是的話就不要用。
4. 把出處登記到 `img/credits_<agent key>.json`：

```json
{
  "A01-51": {"source": "The Coding Train", "author": "Daniel Shiffman", "license": "網頁預覽圖，教學引用", "license_url": "", "page": "https://...", "note": "一句話說明圖片內容"}
}
```

授權欄：作品頁若明確標示授權（例如 CC BY、MIT 且圖在 repo 裡）就照寫；否則寫 `網頁預覽圖，教學引用`。

## 輸出
- `data/cc_<agent key>.json`：`{"agent": "<agent key>", "algorithms": [], "cases": [...]}`，UTF-8
- `img/cases/<案例編號>.jpg`
- `img/credits_<agent key>.json`
- 寫完用 `python -c "import json;json.load(open(r'路徑',encoding='utf-8'))"` 驗證兩個 JSON 都能解析

## 完成回報
只回覆：每個演算法的案例數、有圖片的案例數、用了哪些工具／平台、沒找齊的演算法與原因。不要貼 JSON 內容。
