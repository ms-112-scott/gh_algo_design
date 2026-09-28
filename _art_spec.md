# 獨立卡片圖｜Agent 共用規格

網站：`G:/我的雲端硬碟/02_碩班/09_教學/gh_algo_design/index.html`（GH 演算法設計圖鑑）。
問題：變形卡與沒有照片的案例卡，目前只是同一個演算法生成器換亂數，看起來幾乎一樣。
目標：**每個變形、每個沒有照片的案例，都要有一張自己的圖**，畫出該變形／案例的內容，而且同一演算法底下任兩張卡一眼就能分辨。

## 絕對規則
1. 只能修改你負責的那一個檔案：`assets/art/<演算法編號>.js`。不可修改任何其他檔案（包括其他演算法的 art 檔、gen.js、app.js、index.html、data/*.json）。
2. 不可寫入 gh_algo_design 資料夾以外的任何地方。暫存截圖放 `_shots/`。
3. 程式註解用繁體中文。

## 要讀的資料
- `data.js`（`window.CATALOG`）或 `data/*.json`：找出你的演算法的 `variations`（title、what_changes、how、result）與所有 `cases` 中 **沒有 `image` 欄位** 的案例（summary、category、scale、variations、tags、tools）。
  快速列出：
  `python -c "import json;d=json.loads(open('data.js',encoding='utf-8').read()[len('window.CATALOG = '):-2]);a=[x for x in d['algorithms'] if x['id']=='C01'][0];[print(i,v['title'],'|',v['result']) for i,v in enumerate(a['variations'])];[print(c['id'],c['category'],c['scale'],c['title'],'|',c['summary'][:80]) for c in d['cases'] if c['algo']=='C01' and not c.get('image')]"`
  （把 C01 換成你的編號；Windows 終端機請先設 `PYTHONIOENCODING=utf-8`）
- `assets/gen.js`：`GEN.<編號>` 是這個演算法現有的基本生成器，可參考或透過 `U.base()` 重用。
- A01 另有 `assets/lsystem.js`（全域的 `expand`、`turtle`、`build`、`bounds`、`P` 預設），A01 的 12 個變形已有獨立預設，A01 只需處理沒有照片的案例。

## 介面（寫在 `assets/art/<編號>.js`）
```js
/* C01 反應擴散：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
// 變形：索引對應 variations 陣列（0 起算）
ART.var["C01"] = [
  function(g, W, H, r, c, U){ /* V01 … */ },
  // …每個變形一個函式
];
// 沒有照片的案例：key 為案例編號
ART.case["C01-03"] = function(g, W, H, r, c, U){ /* … */ };
ART.case["C01-03"].ratio = 1.2;   // 可選：高／寬比，0.75–1.35，讓瀑布流高低錯落
})();
```
- `g` 已鋪好深色底（#1C1C24→#121217）、已套 DPR 縮放；用 `W`、`H`（CSS 像素）作畫。
- `r()`：0–1 決定性亂數（每張卡的種子不同）。一定用 `r()`，不要用 `Math.random()`。
- `c`：家族主色（十六進位字串）。可加白色、`U.rgba(c, a)` 的透明度、少量第二色點綴，保持整站調性。
- `U`：`TAU, mk(seed), vnoise(seed)→(x,y)=>0..1, rgba(hex,a), rgb(hex), poly(g,pts,close), field(g,W,H,n,m,val,c,gamma), contour(n,m,f,iso)→線段, GEN, base(id,v,W,H,c,transparent)→離屏 canvas`

## 畫法要求
- **畫內容，不是換種子**。從變形的 how／result、案例的 summary／category／scale 推出畫面：
  - 維度與投影：等角 3D、透視、剖面、平面圖、立面圖、曲面上（把圖樣投影到彎曲屋面或圓柱）
  - 輸入：吸引點光暈、影像灰階、邊界曲線／量體輪廓、路網或基地
  - 輸出：管件粗細、雷切／繪圖機單線稿、3D 列印分層、模組拼裝、燈具或家具剪影
  - 混合：疊上其他演算法（`U.GEN.E01`、`U.base("C03", …)` 等）
  - 案例依 category 取景：`3d-architecture` 建築量體或室內、`2d-pattern` 圖樣拼貼、`urban-landscape` 基地鳥瞰、`fabrication` 構件與製造、`drawing` 單線或筆觸、`performance` 結構或環境分析的色階圖、`art-installation` 裝置空間、`modeling` 建模介面感（線框、節點）
- 同一演算法底下，任兩張卡在**構圖或視角**上要不同，不只是顏色或密度不同；也要和演算法本身的卡片（`GEN.<編號>` 的樣子）明顯不同。
- 效能：每張 < 400 ms（盡量 < 150 ms）；不要載入外部檔案或圖片。
- 不要畫文字說明（可以有極少量的刻度、編號等圖形元素）。

## 自我檢查（一定要做）
1. `python tools/artsheet.py <編號>`：印出 `missingVar`、`missingCase`、`slow`、`errors`，並產生 `_shots/art_<編號>.png`。
2. 用 Read 工具打開 `_shots/art_<編號>.png` 看總覽圖，確認：每張都不同、每張都看得出和標題的關係、沒有空白或壞圖。
3. 修到 `missingVar`、`missingCase` 都是空、`slow` 與 `errors` 都是空為止。
