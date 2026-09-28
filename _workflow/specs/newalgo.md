# NEWALGO｜建立一個新演算法

先讀 `_workflow/specs/_common.md`。

## 輸入
協調流程給你一筆 `_workflow/explore/<RUN>/selected.json` 裡的入選資料：`id`（例如 `D04`、`G01`）、`family`、名稱、機制、查證過的案例與文獻等。

## 參考既有格式
先打開一個既有演算法當範本，例如 `data/ag17.json`（E03 Voronoi＋Lloyd），看每個欄位怎麼寫、寫多細。**新演算法要和既有演算法同等完整。**

## 要產生的檔案（只能寫這三個）
### 1. `data/ag_<id>.json`
```json
{"agent": "ag_<id>", "algorithms": [ {…完整演算法物件…} ], "cases": [ {…案例…} ]}
```
演算法物件欄位（全部都要）：
- `id`、`name_zh`、`name_en`、`family`、`family_name`（既有家族照 build.py 的名稱；新家族用 selected.json 的名稱）
- `file`：C# 範例檔名（`<id>_<英文名稱駝峰>.cs`，與下面第 3 項一致）、`loc`：該檔實際行數
- `logic`（1–2 個列舉值）、`data_structure`（例如 `幾何`、`粒子`、`網格`、`圖`、`矩陣`…）
- `difficulty` 1–5、`difficulty_reason`（行數、元件數、自訂 class、需要的數學）
- `tags`（沿用既有標籤風格：`隨機`、`可重現種子`、`收斂`、`鄰居搜尋`、`最佳化`、`拼貼`、`遞迴`…，可加新的）
- `one_liner`：一句白話
- `how_it_works`：4–6 步，每步一句，和 C# 程式的結構對應
- `key_params`：4–6 個 `{name, effect}`，name 與 C# 輸入名稱一致
- `csharp_concepts`：5–7 個 C# 觀念
- `prerequisites`：3–5 個
- `teaching_note`：一段，建議從零實作的順序、常見錯誤、效能注意事項
- `variations`：**12 個**，格式照 `_workflow/specs/var.md`（只放 title、level、what_changes、how、result），分散在不同軸向、難度有高有低
- `project_seeds`：5 個 `{title, brief, difficulty, combine_with: [其他演算法編號]}`
- `references`：2–4 個 `{title, author, year, url}`，都要查證

案例：
- 研究／建築案例 **至少 5 個**（編號 `<id>-01` 起），creative coding 案例 **至少 3 個**（編號 `<id>-51` 起），格式照 `res.md`／`cc.md`（只放網站欄位，不放 evidence、image_candidate）。可以直接用 selected.json 裡查證過的案例，但要補齊欄位並再確認一次網址。
- 圖片候選另外寫在第 4 項。

### 2. `assets/art/<id>.js`：基本生成器
```js
/* <id> <中文名>：基本生成器（變形與案例的獨立畫法由 gh-enrich 的 ART 單元補上） */
(function(){
const ART = window.ART, U = window.GENUTIL;
U.GEN["<id>"] = function(g, W, H, r, v, c){ /* 演算法的真實簡化實作 */ };
ART.var["<id>"] = ART.var["<id>"] || [];
})();
```
- 生成器必須是演算法的**真實簡化實作**（真的跑幾步模擬、真的算一次三角化…），畫面讓人一眼認出演算法特徵；`v` 不同時畫面要有變化；每張 < 150 ms；只用 `r()` 亂數。細節見 `_workflow/specs/art.md` 的介面說明。
- 用 `node --check assets/art/<id>.js` 檢查語法。（網站要等整合步驟把 `<script>` 加進 index.html 後才看得到。）

### 3. `cs/<id>_<英文名稱>.cs`：Grasshopper C# Script 範例
- Rhino 8 Grasshopper C# Script 元件的完整程式（`RunScript` 的輸入與 `key_params` 一致，輸出幾何），只用 RhinoCommon，不依賴外掛，註解用繁體中文。
- 檔頭註解寫：演算法名稱、輸入輸出說明、「由 gh-new-algos 工作流程產生，尚未在 Rhino 中實測」。
- 行數填進 `loc`。

### 4. `_workflow/explore/<RUN>/images_<id>.json`
案例的圖片候選：`[{"case_id", "url", "page", "source", "author", "license", "license_url", "note"}]`（格式同 image_candidate；整合步驟會處理下載或排隊）。

## 自我檢查
- 兩個 JSON 都能解析、`python tools/zhcheck.py data/ag_<id>.json` 為 0。
- 編號沒有和既有衝突（`grep -r '"<id>"' data/`）。
- 12 個變形之間、以及和其他演算法的變形之間沒有重複（讀 `_workflow/index/_catalog.md`）。

## 回報
一行：變形數、研究案例數、creative coding 案例數、C# 行數、有圖片候選的案例數。
