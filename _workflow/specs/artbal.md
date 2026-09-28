# ARTBAL｜後段家族卡片圖重畫：每張都要一眼分得出來

先讀 `_workflow/specs/_common.md`、`_workflow/specs/art.md`（畫法介面與要求）、`_workflow/specs/imgfix.md`（重畫規則）。本檔是 gh-balance 的補充，衝突時以本檔為準。

## 背景（使用者 2026-09-29）
「很多圖片都是基於演算法幾乎一樣的畫面去產生的，尤其是比較靠後面的家族」。E03、E04、F01–F06 的變形與案例完全沒有自己的畫法（只是演算法生成器換亂數）；E05、E06、F07、F08、G01–G03 也有大量互相相似的圖。

## 你的工作
協調流程會給你：
- `missing_var`：沒有畫法的變形索引（0 起算）→ 依變形的 `how`／`result` 畫出**這個改法的結果**。
- `missing_case`：沒有照片也沒有畫法的案例 → 依案例的 summary／category／scale 畫。這些案例已經找過真實圖片但找不到，所以示意圖要盡量貼近作品本身（量體、配置、構件、裝置、圖樣……）。
- `redo`：imgdup 判定太像的項目、或 `_workflow/redo_art.json` 的項目 → 重畫（可以改寫既有畫法函式）。
- `review_all: true`：使用者指定整個演算法要重新檢查。先跑 `python tools/artsheet.py <演算法>`，用 Read 打開 `_shots/art_<演算法>.png` 看**所有**變形卡與無照片案例卡；凡是和同演算法其他卡、或和演算法本身卡片（`GEN.<編號>`）構圖相近的，一律重畫，即使 imgdup 沒有抓到。

## 畫面要求（比 art.md 更嚴格）
- 同一演算法底下，任兩張卡的**構圖、視角或表現方式**都要不同，例如：平面圖／等角 3D／剖面／立面／透視／細部特寫／分析色階圖／製造拆件圖／疊圖對照／時間序列小多圖／曲面上的圖樣／實物剪影。不能只換顏色、密度、亂數或參數。
- 每張卡都要看得出和它標題的關係（變形：改了什麼；案例：是哪種作品）。
- 也要和演算法本身的卡片明顯不同。
- 保持整站調性：深色底、家族主色為主、少量白與第二色點綴；不要畫文字。
- 效能：每張 < 400 ms（盡量 < 150 ms）。

## 只能修改
`assets/art/<你負責的演算法>.js`。不要 commit。

## 自我檢查
1. `node --check assets/art/<演算法>.js`
2. `python build.py`
3. `python tools/imgdup.py <演算法>`：fallback、like_algo、near_dup、errors 都是 0
4. `python tools/artsheet.py <演算法>`，用 Read 打開 `_shots/art_<演算法>.png`：每張都不同、看得出和標題的關係、沒有空白或壞圖；slow 與 errors 為空
5. 寫完成標記 `_workflow/stage/<RUN>/ART_<演算法>.json`：`{"algo": "<演算法>", "phases": ["var"] 或 ["var","case"], "reviewed_all": true/false, "var_done": n, "case_done": n, "redo_done": n}`（已有檔案就合併 phases）

## 回報
一行：補了幾張變形圖、幾張案例圖、重畫幾張、imgdup 與 artsheet 結果。
