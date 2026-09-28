# CC｜新增 creative coding 案例

先讀 `_workflow/specs/_common.md`。（本檔由舊的 `_cc_spec.md` 改寫。）

## 背景
為每個演算法補上 **creative coding** 案例，讓學習者看到同一個演算法在 p5.js、Processing、openFrameworks、TouchDesigner、Shadertoy／GLSL、three.js、vvvv、Houdini VEX、Unity、Blender Geometry Nodes 等創作程式環境裡怎麼被使用與變化。

## 步驟
1. 讀 `_workflow/index/<演算法>.json`：既有 creative coding 案例（`cc: true`）用了哪些工具、曾被拒絕的項目。
2. 寫 `coverage_note`：已用過哪些工具／平台，本次優先找**還沒用過的工具**；整個演算法的 creative coding 案例最後要涵蓋至少 3 種工具。
3. 找作品並用 WebFetch 查證。常用來源（可以直接瀏覽索引頁）：
   - The Coding Train：`https://thecodingtrain.com/challenges`
   - The Nature of Code：`https://natureofcode.com/`
   - p5.js 範例：`https://p5js.org/examples/`；Processing 範例：`https://processing.org/examples/`
   - OpenProcessing：`https://openprocessing.org/sketch/<id>`
   - Generative Design：`http://www.generative-gestaltung.de/2/`
   - Inconvergent（Anders Hoff）、Tyler Hobbs、Matt DesLauriers、Jason Webb（GitHub `jasonwebb/morphogenesis-resources`）、Sage Jenson、Entagma、Junichiro Horikawa 等創作者網站
   - Shadertoy：`https://www.shadertoy.com/view/<id>`
   - GitHub 儲存庫（README 與示範圖）
4. 和既有案例比對：同一個作品、同一個 repo、同一支影片都算重複（包含研究案例那邊已收錄的）。

## 每個案例的欄位
與 `res.md` 相同，另外：
- `tags` **一定要包含 `"creative coding"`**，再加上工具名（`"p5.js"`、`"Processing"`、`"openFrameworks"`、`"TouchDesigner"`、`"GLSL"`、`"three.js"`…）與特性標籤。
- `tools` 填實際使用的工具。
- `summary` 說明：這是什麼、演算法在其中怎麼被使用、跟 Grasshopper C# 基礎範例有什麼不同。
- `image_candidate`：作品頁的 `og:image`／`twitter:image`；YouTube 用 `https://i.ytimg.com/vi/<影片ID>/hqdefault.jpg`；GitHub repo 用 README 裡的示範圖（`raw.githubusercontent.com` 網址最好，雲端可以直接下載）。授權欄：作品頁明確標示授權就照寫，否則寫 `網頁預覽圖，教學引用`。**不要自己下載圖片**，合併工具會處理。

## 輸出
`_workflow/stage/<RUN>/CC_<演算法>.json`：
```json
{"unit": "CC:<演算法>", "algo": "<演算法>", "coverage_note": "…", "items": [ … ]}
```
找不到足量可查證的作品就交找得到的數量，在 `coverage_note` 說明。

## 回報
一行：產出幾個、用了哪些工具、有圖片候選的數量。
