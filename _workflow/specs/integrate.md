# INTEGRATE｜把新演算法／新家族接進網站

先讀 `_workflow/specs/_common.md`。這一步由**一個** agent 做，負責所有共用檔案（其他 agent 不能改的那些）。

## 輸入
- `_workflow/explore/<RUN>/selected.json`（入選清單、新家族）
- 各建立 agent 產生的 `data/ag_<id>.json`、`assets/art/<id>.js`、`cs/<id>_*.cs`、`_workflow/explore/<RUN>/images_<id>.json`

## 步驟
1. **確認產出**：每個入選 id 的三個檔案都在、JSON 能解析；缺的就記在報告裡，不要替它補（該演算法本次不接進網站：把它的 data 檔移到 `_workflow/explore/<RUN>/incomplete/`，art 檔不加 script tag）。
2. **新家族**（`new_families` 不是空的才做）：
   - `build.py` 的 `FAMILIES` 加上 `"<字母>": "<中文名>"`
   - `assets/app.js` 的 `FAMC` 加上三色；把寫死 A–F 的正規表示式（例如 `/^[A-F]\d\d/`）改成 `/^[A-Z]\d\d/`
   - `grep -rn "六大家族\|A–F\|A-F\|6 大\|六個家族" index.html assets/app.js README.md` 把固定的「六大家族」改成正確數量（例如「七大家族」），「A–F」改成新範圍
   - 確認篩選列、關於頁的家族清單會自動出現新家族（它們讀 `CAT.families`）；若有寫死的地方一併修正
3. **index.html**：在既有 `<script src="assets/art/F06.js"></script>` 之後依編號加入每個新演算法的 `<script src="assets/art/<id>.js"></script>`。
4. **README.md**：更新演算法數量與家族清單（例如「33 個演算法，分成七大家族」）。
5. **圖片**：把 `images_<id>.json` 的每一筆轉進 `_workflow/image_queue.json`（格式：`case_id`、`url`、`page`、`source`、`author`、`license`、`license_url`、`note`、`queued_run`）；主機是 `raw.githubusercontent.com` 等 GitHub 網域的可以直接下載（PIL RGB、thumbnail 900、quality 84，存 `img/cases/<案例編號>.jpg`，出處寫進 `img/credits_wf.json`）。
6. **檢查**：
   - `python build.py`（不能有警告）
   - `python tools/sanitize.py --check`、`python tools/zhcheck.py --all`
   - `python tools/wf_plan.py --index`（重建索引，讓 gh-enrich 之後看得到新演算法）
   - `python tools/artsheet.py <所有新 id>` 並用 Read 打開 `_shots/art_<id>.png`：演算法卡片必須正常繪出、無錯誤（變形與案例的獨立畫法之後由 gh-enrich 補，缺圖是預期的）
   - 用 Playwright 開 `index.html#algo:<id>` 截圖確認詳細頁正常（可參考 `tools/clipcheck.py` 的寫法）
   - `python tools/clipcheck.py`：TOTAL 不可比開始時多（開始時的數字由協調流程提供）
7. **報告**：更新 `_workflow/explore/<RUN>/report.md` 最後加一節「已接進網站」：每個新演算法的編號、名稱、變形／案例數、C# 行數、圖片排隊數；以及需要人工處理的事（例如 C# 需在 Rhino 實測、排隊圖片要在本機跑 `python tools/fetch_images.py`）。

## 回報
一行：接進網站的演算法數、新家族、build／zhcheck／clipcheck 結果。
