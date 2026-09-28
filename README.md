# GH 演算法設計圖鑑

為教學用途建立的 Grasshopper 生成式演算法收集網頁，供學習建築參數化建模使用。最初為國立陽明交通大學 115-1「演算法設計」課程整理，現以通用形式公開。

- 29 個演算法，分成六大家族（A 規則與語法、B 生長、C 場與擴散、D 代理人、E 排列與鬆弛、F 圖樣與最佳化）
- 每個演算法附變形食譜、真實應用案例與延伸專案題目
- 工具：Rhino 8、Grasshopper、C# Script 元件

## 頁面

| 檔案 | 內容 |
|---|---|
| `index.html` | 關於：用途、使用方式、六大家族、五種演算法邏輯、標籤說明、課程背景 |
| `atlas.html` | 圖鑑：以圖片為主的瀑布流，點開看圖示化的運作流程、參數、變形與案例（目前圖像版完成 A01 L-System） |
| `catalog.html` | 文字索引：全部演算法、案例、變形與專案的篩選清單 |

直接用瀏覽器開 `index.html` 即可，不需要伺服器。也可以用 GitHub Pages 發佈（Settings → Pages → 從 `main` 分支根目錄）。

## 編號規則

- 家族：A–F
- 演算法：家族字母＋兩位數，例如 `A01`
- 變形：`演算法編號·V兩位數`，例如 `A01·V03`
- 案例：`演算法編號-兩位數`，例如 `A01-12`

## 資料

- `data/*.json`：原始資料，一個檔案對應一組演算法
- `data.js`：網頁讀取的合併檔，由 `build.py` 產生
- `演算法總表.md`：全部演算法的標籤與難度一覽，由 `build.py` 產生
- `img/cases/`：案例圖片，檔名＝案例編號；出處與授權記在 `img/credits.json`，`build.py` 會把兩者寫進每個案例的 `image` 欄位

修改 `data/*.json` 之後執行：

```bash
python build.py
```

## 工具

| 指令 | 用途 |
|---|---|
| `python build.py` | 合併資料、產生 `data.js` 與總表 |
| `python tools/sanitize.py --check` | 檢查資料裡是否殘留特定課程週次或課堂流程的字句 |
| `python tools/commons.py search "關鍵字"` | 在 Wikimedia Commons 搜尋可自由使用的實景照片 |
| `python tools/commons.py get <案例編號> "File:..."` | 下載 Commons 圖片並自動登記作者與授權 |
| `python tools/addimg.py <案例編號> <圖檔> <來源> <授權> <網址>` | 登記論文圖或官網圖片 |
| `python tools/clipcheck.py` | 用 Playwright 逐頁打開圖鑑的所有詳細頁，檢查元素是否被裁切（需安裝 Chrome） |

## 來源與授權說明

- 案例資料盡量附原始出處；少數出處尚待查證，頁面會標示「出處待查證」。
- 案例圖片優先使用 Wikimedia Commons 的自由授權照片與 CC BY 開放論文圖，每張圖下方標示作者與授權；其餘官網或論文圖片著作權屬原作者，僅作非商業教學引用，如有疑慮請開 issue，會立即移除。
- 標示「示意」的圖是本站程式依演算法概念重畫，不是原作品。
- 國立陽明交通大學標誌取自 [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:NYCU_(%E5%9C%8B%E7%AB%8B%E9%99%BD%E6%98%8E%E4%BA%A4%E9%80%9A%E5%A4%A7%E5%AD%B8)_Blue_Logo.png)，僅用於標示課程所屬單位。
