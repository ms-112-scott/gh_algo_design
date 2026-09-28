# EXPLORE｜新演算法／新家族探索

先讀 `_workflow/specs/_common.md`。

## 背景
「GH 演算法設計圖鑑」的每個「演算法」＝一個可在 Grasshopper **C# Script 元件**內從零實作的生成式演算法（約 100–400 行、只用 RhinoCommon、不依賴外掛），附原理、關鍵參數、C# 觀念、12–16 個變形、建築／研究案例、creative coding 案例。
目前的家族與演算法：看 `_workflow/index/_catalog.md`（**開工前一定要讀完**，裡面有每個演算法的全部變形與專案種子）。很多看起來是新演算法的東西，其實已經是某個演算法的變形（例如 3D 差異生長、加權 Voronoi 點描），這種不算新演算法。

## 任務
在你被指定的**方向**內找出值得新增的演算法（或新家族），並嚴格去重。協調流程會在提示裡告訴你方向、代號、以及參考清單（參考清單不是限制，也不代表一定要收）。

每個候選都要回答：
1. `name_zh`（台灣用語）、`name_en`、`family_suggest`（既有字母，或新家族的建議字母與名稱）
2. `one_liner`：一句白話說明
3. `mechanism`：3–5 個步驟說清楚演算法怎麼運作
4. `overlap`：
   - `nearest`：最接近的既有演算法或既有變形（寫出編號與變形標題）
   - `difference`：差在哪裡（核心機制、資料結構、產出類型）
   - `verdict`：`new`（可以當新演算法）／`variation`（其實是某個既有演算法的變形，寫出併入哪個）／`duplicate`（已經有了）
5. `new_concept`：它教到既有演算法沒教到的什麼（新的資料結構如圖、半邊網格、優先佇列、KD-tree、矩陣求解；新的思考方式如機率、學習、搜尋空間…）
6. `logic`：1–2 個（見列舉值）
7. `difficulty` 1–5、`loc_estimate`、`gh_feasibility`：在 GH C# 元件內怎麼做、用哪些 RhinoCommon 型別、有沒有做不到的地方
8. `architecture_cases`：2–3 個**真實**的建築／研究案例，每個 `{title, creator, year, url, verified, evidence}`
9. `cc_refs`：1–2 個 creative coding 參考，同上格式
10. `references`：1–2 個經典文獻（論文或書），同上格式
11. `card_visual`：網站卡片的生成器會畫什麼（一句話）
12. `scores`：`novelty`、`architecture_relevance`、`teachability`、`feasibility` 各 1–5，加總為 `total`

## 查證
每個 url 都要用 WebFetch 打開確認（標題、作者、年份相符），`verified: true` 並寫 `evidence`；打不開或不符就換一個或不要列。**不可捏造。**

## 輸出
`_workflow/explore/<RUN>/<代號>.json`
```json
{"scope": "…", "direction": "…", "candidates": [ {…上面 12 個欄位…} ],
 "rejected": [ {"name": "…", "overlap_with": "B01 變形「3D 網格差異生長」", "reason": "…"} ]}
```
- 候選 6–10 個（寧缺勿濫）；被判 `variation`、`duplicate` 的放 `rejected`（或保留在 candidates 但 verdict 標清楚），不要湊數。
- **新家族方向**的結構改為：
```json
{"scope": "new families", "families": [ {"letter_suggest": "G", "name_zh": "…", "name_en": "…", "definition": "…",
  "boundary_vs_existing": "逐一說明和既有家族的界線", "recommendation": "建議新增家族｜候選可分散併入既有家族｜不建議",
  "reason": "…", "candidates": [ {…} ]} ], "rejected": [ … ]}
```
- **外部對照稽核方向**的結構改為：
```json
{"scope": "coverage audit", "sources": [ {"title", "url", "verified": true, "evidence", "topics": ["…"]} ],
 "matrix": [ {"topic": "…", "seen_in": ["來源 title"], "atlas_status": "已有（A01）｜已是變形（E03「…」）｜缺", "note": "…"} ],
 "candidates": [ {…只放 atlas_status=缺、且被 2 個以上來源提到的，照 12 個欄位…} ]}
```
  matrix 至少 40 個主題。

## 回報
只回覆：候選名稱＋verdict＋total 的精簡清單、被判為重複／併入變形的清單。不要貼整份 JSON。
