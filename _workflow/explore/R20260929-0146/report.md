# R20260929-0146 報告

本次為 add 模式，from R20260928-2216（入選清單沿用該次挑選結果，使用者已確認新增 G 家族與全部建議）。

## 已接進網站

8 個新演算法全部接進網站：每個都有資料檔、生成器、C# 三個檔案，JSON 都能解析，沒有移到 incomplete/。新增家族 **G 空間分析**，配色 #C8378B／#F8E1EE／#962466。網站現在是 37 個演算法、七大家族。

| 編號 | 名稱 | 變形 | 案例（研究＋creative coding） | 專案發想 | C# 行數 | 圖片候選 | 已下載 | 排隊 |
|---|---|---|---|---|---|---|---|---|
| B06 | 離散聚合（連接點規則生長） | 12 | 10（7＋3） | 5 | 253 | 4 | 1（B06-52） | 3 |
| E05 | 圖解靜力學（索多邊形與力圖） | 12 | 13（9＋4） | 5 | 161 | 2 | 0 | 2 |
| E06 | 力密度法（FDM） | 12 | 11（8＋3） | 5 | 190 | 2 | 0 | 2 |
| F07 | 模擬退火（以房間鄰接配置為例） | 12 | 12（7＋5） | 5 | 206 | 5 | 0 | 5 |
| F08 | 最小生成樹與 Steiner 樹 | 12 | 10（6＋4） | 5 | 226 | 4 | 0 | 4 |
| G01 | Isovist 可視域與可見性圖分析 | 12 | 12（7＋5） | 5 | 193 | 5 | 0 | 5 |
| G02 | 太陽包絡 | 12 | 11（7＋4） | 5 | 189 | 5 | 1（G02-52） | 4 |
| G03 | 地表逕流與集水區（D8 流向累積） | 12 | 8（5＋3） | 5 | 305 | 3 | 0 | 3 |
| 合計 | | 96 | 87 | 40 | 1723 | 30 | 2 | 28 |

報告「下一步」第 3 點的案例要求都已達成：F08 有 5 件直接使用 MST／Steiner 樹的案例（F08-01 Athanasopoulos 2020 最直接）；E05 研究 9、G03 研究 5、B06 研究 7；F07 creative coding 5、B06 creative coding 3。

### 共用檔案的修改
- `build.py`：`FAMILIES` 加上 `"G": "空間分析"`。
- `assets/app.js`：`FAMC` 加上 G 三色；`/^[A-F]\d\d/` 改成 `/^[A-Z]\d\d/`；標籤說明改成「七大家族 A–G」。
- `index.html`：在 F06 之後依編號加入 8 個 art script；「六大家族」改成「七大家族」（3 處）。篩選列與關於頁的家族清單讀 `CAT.families`，已截圖確認 G 會出現。
- `README.md`：37 個演算法、七大家族、A–G；檔案表加上 `cs/*.cs`。
- 圖片：30 筆候選中 2 筆在 GitHub 網域已下載（`img/cases/B06-52.jpg`、`img/cases/G02-52.jpg`，出處寫進 `img/credits_wf.json`），其餘 28 筆排進 `_workflow/image_queue.json`。

### 建立 agent 交代事項的處理
- E05-05 作者：已用 Springer 論文頁確認五位作者（Beghini、Carrion、Beghini、Mazurek、Baker，2014）。
- E06-54（2026-08 新建、0 星的 repo）證據不足已刪除，記入 rejected／removed；E06 creative coding 仍有 3 筆。
- 為遵守「不收神經網路」規則：E06 未收 JAX FDM（宣傳可當神經網路層）、G02 未收 UrbanSolarCarver（相依 PyTorch）。
- F08-54、E06-06、G03-01／02／52 的圖片內容未確認，只排隊並加註。

## 報告建議的 28 個變形

依 to_variation 分成 8 個撰寫 agent 寫成正式變形（17 個演算法），`wf_dedup` 全數 pass，審查 agent accept 28／reject 0，`wf_merge` 合併 28 筆：
A05 +1、A06 +1、B02 +3、B04 +1、C01 +2、C02 +2、C04 +1、C05 +2、D01 +1、E01 +1、E03 +1、E04 +4、F01 +2、F02 +1、F04 +2、F05 +2、F06 +1。

## 檢查結果
- `python build.py`：沒有警告（algorithms=37、cases=591、images=112）。
- `python tools/zhcheck.py --all`：0 處。
- `python tools/sanitize.py --check`：殘留 16 筆，15 筆為既有檔案的「現場」字樣，1 筆為 G03 論文網址中的「W2」誤判（網址正確，不改）。
- `python tools/clipcheck.py`：TOTAL 22，與基準相同（全部來自既有 A02 詳細頁）。

## 需要人工處理的事
1. 8 個 C# 檔（`cs/*.cs`，共 1723 行）要在 Rhino 8／Grasshopper 的 C# Script 元件實測。
2. 在本機執行 `python tools/fetch_images.py` 下載 28 張排隊圖片，再 `python build.py`。
3. 下載後逐一檢查 F08-54、E06-06、G03-01、G03-02、G03-52 的畫面內容。
4. 變形與案例的獨立卡片畫法：本次補一部分，其餘由 gh-enrich 排程接手。
