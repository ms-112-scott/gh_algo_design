# SELECT｜彙整、交叉去重、挑選新演算法

先讀 `_workflow/specs/_common.md`。這份規格有兩個階段，協調流程會告訴你做哪一段。

## 階段 1：彙整（synth）
輸入：`_workflow/explore/<RUN>/*.json`（各方向的探索結果，底線開頭的檔案略過）。
1. 把所有 `verdict: new` 的候選（包含新家族方向裡的候選、稽核方向的 candidates）合成一張表。
2. **跨方向去重**：同一個演算法被不同方向提出（例如「模擬退火」同時出現在 A/F 與稽核）→ 合併成一筆，保留較完整的欄位、合併查證過的網址、`sources` 記錄來自哪些方向（被越多方向提到，越值得收）。
3. **再和既有內容比一次**：讀 `_workflow/index/_catalog.md`，任何其實是既有變形的，改判 `variation` 並寫出併入哪個演算法。
4. 給每筆一個暫時編號 `K01`、`K02`…
輸出 `_workflow/explore/<RUN>/_candidates.json`：
```json
{"run": "…", "candidates": [ {"key": "K01", "sources": ["x1_AF", "x5_audit"], …12 個欄位…} ],
 "to_variation": [ {"name": "…", "merge_into": "E03", "reason": "…"} ],
 "families": [ {…新家族方向的家族評估，原樣保留…} ]}
```

## 階段 2：挑選（select）
輸入：`_candidates.json` ＋ `_workflow/explore/<RUN>/_review_*.json`（審查 agent 對每個 key 的查證與重複判斷）。
1. 淘汰：審查判 reject、查證失敗的網址過半、或 total 低於 `_workflow/config.json` 的 `new_algos.min_total_score`。
2. **新家族**：只有當某個新家族有 **≥ 3 個**通過的候選、而且它們放進既有 A–F 任何一個都明顯勉強時，才建議新增家族；否則把候選分派到最合適的既有家族。
3. 排序：total 高、被越多方向提到、建築相關性高、教到新觀念者優先；同一家族一次最多新增 3 個，避免失衡。挑出最多 `new_algos.max_new_per_run` 個（協調流程可能給更小的上限）。
4. **編號**：既有家族接在該家族最大編號之後（例如 D 目前到 D03 → D04）；新家族從 `<字母>01` 起。讀 `data/*.json` 確認編號沒被用過。
5. 每個入選者寫出 `id`、`family`（新家族另給 `family_name_zh`、`family_name_en`、`color` 建議三色：主色、淺色、深色，要和既有六色明顯不同）、`why`（一句話說明為什麼收）。
輸出：
- `_workflow/explore/<RUN>/selected.json`：`{"run", "new_families": [ {"letter", "name_zh", "name_en", "definition", "color": ["#主色", "#淺色", "#深色"]} ], "algorithms": [ {"id", "family", "key", …候選欄位…, "why"} ], "not_selected": [ {"key", "name_zh", "reason"} ], "to_variation": [ … ]}`
- `_workflow/explore/<RUN>/report.md`：給人看的報告（繁體中文）：入選清單（編號、名稱、家族、一句話、分數、代表案例）、新家族的理由、未入選與原因、建議併入既有演算法當變形的清單（之後可交給 gh-enrich 的 VAR 單元）。

## 回報
一行：候選總數、入選數、是否新增家族（哪些）、轉為變形建議的數量。
