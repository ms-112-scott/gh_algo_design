# 待辦（排程於 2026-09-28 20:23 以 Workflow 執行）

範圍：只能修改 `G:/我的雲端硬碟/02_碩班/09_教學/gh_algo_design/` 內的檔案，其他資料夾只能讀取。

## 1. 中斷前未完成
- [ ] 手機版搜尋框：`index.html` 的 `.search input` 加 `min-width:0;width:100%;text-overflow:ellipsis`，`.search` 加 `overflow:hidden`（placeholder 目前會溢出到按鈕上）
- [ ] creative coding 案例 A、F 家族：agent 被中斷。檢查 `data/cc_a.json`、`data/cc_f.json`、`img/credits_a.json`、`img/credits_f.json` 是否存在或不完整，清掉 `_tmp_a/`、`_tmp_f/`，依 `_cc_spec.md` 補完 A01–A06、F01–F06（編號從 51 起）

## 2. 新需求：每張卡片的圖都要不一樣
- 現況：變形卡與沒有照片的案例卡，只是用同一個演算法生成器換亂數，看起來幾乎一樣
- 目標：**每一個變形、每一個沒有照片的案例，都要有自己獨立畫法的圖**，反映該變形／案例的內容
  - 變形：依 `variations[].title / how / result` 實作對應的視覺差異（例：3D 化、曲面上、吸引子控制、邊界約束、混合其他演算法、影像輸入、輸出成管件／製造幾何、動畫軌跡等），不能只是換 seed
  - 案例（無 `image` 者）：依案例 `summary / variations / category / scale` 畫出能代表該案例的示意圖（例：立面、平面配置、地景、家具、裝置、繪圖機線稿），仍標「示意」
  - 做法建議：在 `assets/gen.js` 為每個演算法加上「變體畫法」表 `VARIANTS[algoId][i]`（變形）與 `CASEART[caseId]`（案例），每筆是一個獨立的繪圖函式或參數組合＋後處理（例：投影到曲面、疊到立面框、加吸引子光暈、轉等角 3D、單線繪圖機風格）；A01 則擴充 `lsystem.js` 的 `P` 預設與 `CASE_PRESET`
  - 分工：以 Workflow 依六大家族分 6 個 agent，各自負責該家族所有演算法的變形與無照片案例畫法；完成後由一個 agent 做整體檢查
  - 驗收：產生縮圖總覽，同一演算法底下任兩張卡視覺上可明顯分辨；所有生成器單張 < 400 ms、無 console error

## 3. 新需求：難度篩選
- [ ] 篩選列第二行「家族」後面加一組「難度」：全部／★1 入門／★2 基礎／★3 中階／★4 進階／★5 研究級（可複選），同樣是未選白底、選取整顆黑底
- [ ] 難度套用在所有卡片類型：演算法用 `difficulty`、變形用 `level`、案例用 `difficulty`、專案種子用 `difficulty`
- [ ] 點選難度也記入瀏覽偏好（`prefs.diff`）

## 4. 收尾
- [ ] `python build.py`、`python tools/clipcheck.py`（應為 0）
- [ ] 截圖檢查：首頁三層篩選列（含難度）、隨機排序、偏好記憶、各家族變形與案例圖是否各不相同
- [ ] 刪除 `_cc_spec.md`、`_shots/`、`_TODO.md` 等暫存
- [ ] `git commit`（不要 push）
- [ ] 向使用者回報，並再次詢問是否推上 GitHub 與授權條款
