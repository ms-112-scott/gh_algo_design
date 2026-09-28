# GH 演算法設計圖鑑

為教學用途建立的 Grasshopper 生成式演算法收集網頁，供學習建築參數化建模使用。最初為國立陽明交通大學建築研究所（NYCU GIA）115-1「演算法設計」課程整理，現以通用形式公開。

- 29 個演算法，分成六大家族（A 規則與語法、B 生長、C 場與擴散、D 代理人、E 排列與鬆弛、F 圖樣與最佳化）
- 每個演算法附變形食譜、建築與研究案例、creative coding 案例（p5.js、Processing、TouchDesigner、openFrameworks…）與延伸專案題目
- 工具：Rhino 8、Grasshopper、C# Script 元件

## 使用

直接用瀏覽器開 `index.html` 即可，不需要伺服器。也可以用 GitHub Pages 發佈（Settings → Pages → 從 `main` 分支根目錄）。

- 首頁就是圖鑑：以圖片為主的瀑布流，可依卡片類型、來源（建築與研究／Creative Coding）、家族、演算法、應用類型篩選
- 點卡片看詳細頁：圖示化的運作流程、關鍵參數、C# 觀念、變形與案例
- 右上角「i」是關於這個圖鑑與課程背景的說明；「標籤說明」解釋各種標籤外觀
- 網址可直接指到某張卡，例如 `index.html#algo:A01`、`#var:C01:3`、`#A01-03`

## 編號規則

- 家族：A–F
- 演算法：家族字母＋兩位數，例如 `A01`
- 變形：`演算法編號·V兩位數`，例如 `A01·V03`
- 案例：`演算法編號-兩位數`，例如 `A01-12`；creative coding 案例從 51 開始，例如 `A01-51`

## 檔案

| 路徑 | 內容 |
|---|---|
| `index.html` | 網站（圖鑑首頁、詳細頁、關於） |
| `assets/app.js` | 瀑布流、篩選、詳細頁 |
| `assets/lsystem.js` | A01 L-System 的完整網頁版引擎（互動滑桿、參數小圖） |
| `assets/gen.js` | 其他 28 個演算法的網頁版簡化實作，用來畫卡片與示意圖 |
| `assets/gia-logo*.svg` | 陽明交通大學建築研究所標誌 |
| `data/*.json` | 原始資料：`ag*.json` 為演算法與建築／研究案例，`cc_*.json` 為 creative coding 案例 |
| `assets/art/*.js` | 每個演算法的變形與無照片案例的獨立卡片畫法 |
| `.claude/workflows/` | 內容擴充工作流程（見下方） |
| `data.js` | 網頁讀取的合併檔，由 `build.py` 產生 |
| `img/cases/` | 案例圖片，檔名＝案例編號 |
| `img/credits*.json` | 每張圖片的來源、作者與授權 |
| `演算法總表.md` | 全部演算法的標籤與難度一覽，由 `build.py` 產生 |

修改 `data/*.json` 或新增圖片後執行：

```bash
python build.py
```

## 工具

| 指令 | 用途 |
|---|---|
| `python build.py` | 合併資料與圖片出處，產生 `data.js` 與總表 |
| `python tools/sanitize.py --check` | 檢查資料裡是否殘留特定課程週次或課堂流程的字句 |
| `python tools/commons.py search "關鍵字"` | 在 Wikimedia Commons 搜尋可自由使用的實景照片 |
| `python tools/commons.py get <案例編號> "File:..."` | 下載 Commons 圖片並自動登記作者與授權 |
| `python tools/addimg.py <案例編號> <圖檔> <來源> <授權> <網址>` | 登記論文圖或官網圖片 |
| `python tools/clipcheck.py` | 用 Playwright 逐頁打開詳細頁，檢查元素是否被裁切 |
| `python tools/artsheet.py <編號…>` | 把某演算法的所有變形卡、無照片案例卡畫成總覽圖，列出缺圖、過慢與錯誤 |
| `python tools/wf_plan.py` | 內容擴充的現況表：每個演算法的變形、案例、缺圖與總缺口 |
| `python tools/zhcheck.py --all` | 檢查資料裡是否有簡體字 |
| `python tools/fetch_images.py` | 下載內容擴充工作流程排隊的案例圖片（在自己電腦上執行） |

## 內容擴充工作流程

`.claude/workflows/` 有兩個 Claude Code 工作流程，說明、規格與紀錄在 [`_workflow/`](_workflow/README.md)：

| 指令 | 用途 |
|---|---|
| `/gh-new-algos` | 探索並新增新家族與新演算法（先產出報告，確認後再建立） |
| `/gh-enrich` | 為既有演算法補充變形、建築／研究案例、creative coding 案例與卡片圖，每次最多 30 個 agent，可排程重複執行 |

## 來源與授權說明

- 案例資料盡量附原始出處；少數出處尚待查證，頁面會標示「出處待查證」。
- 案例圖片優先使用 Wikimedia Commons 的自由授權照片與 CC BY 開放論文圖，每張圖下方標示作者與授權；其餘官網、論文或作品頁圖片著作權屬原作者，僅作非商業教學引用，如有疑慮請開 issue，會立即移除。
- 標示「示意」的圖是本站程式依演算法概念重畫，不是原作品。
- 陽明交通大學建築研究所標誌取自研究所官方網站，僅用於標示課程所屬單位。
