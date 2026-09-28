window.CATALOG = {
 "families": {
  "A": "規則與語法",
  "B": "生長",
  "C": "場與擴散",
  "D": "代理人",
  "E": "排列與鬆弛",
  "F": "圖樣與最佳化"
 },
 "categories": {
  "2d-pattern": "平面圖像／圖樣",
  "3d-architecture": "3D 建築／空間",
  "modeling": "建模技巧",
  "drawing": "繪圖／視覺表現",
  "urban-landscape": "都市／景觀",
  "fabrication": "材料／數位製造",
  "performance": "結構／環境性能",
  "art-installation": "藝術／裝置"
 },
 "logics": [
  "直接公式",
  "改寫／遞迴",
  "迭代模擬",
  "搜尋／求解",
  "幾何轉換"
 ],
 "difficulty": {
  "1": "入門",
  "2": "基礎",
  "3": "中階",
  "4": "進階",
  "5": "研究級"
 },
 "algorithms": [
  {
   "id": "A01",
   "name_zh": "L-System",
   "name_en": "L-System",
   "family": "A",
   "family_name": "規則與語法",
   "file": "A01_LSystem.cs",
   "loc": 180,
   "logic": [
    "改寫／遞迴"
   ],
   "data_structure": [
    "符號"
   ],
   "difficulty": 2,
   "difficulty_reason": "約 180 行、只有一個自訂 struct（Pen），核心是字串改寫迴圈加上 Stack 分枝，無鄰居搜尋或收斂；但 Plane 旋轉與 struct 複製語意需要稍微解釋。",
   "tags": [
    "字串改寫",
    "遞迴",
    "分形",
    "3D",
    "自訂 class"
   ],
   "one_liner": "用幾條「字母換成字串」的規則反覆改寫，再讓一支畫筆照字串前進、轉彎、分岔，長出樹、草、分枝柱等結構。",
   "how_it_works": [
    "把規則文字（如 F=F[+F]F[-F]F）拆成 Dictionary<char,string> 規則表。",
    "從起始字串開始，每一代把每個字元「同時」換成規則右邊的字串（沒規則的字元原樣保留），重複 generations 次；字串超過 50 萬字就停止。",
    "畫筆（Pen = Plane + 步長）逐字讀最終字串：F 前進畫線、f 前進不畫、+ - & ^ \\ / 繞三個軸旋轉。",
    "遇到 [ 把目前畫筆壓進 Stack 並把步長乘上 branchScale；遇到 ] 從 Stack 取回，回到分岔點繼續畫。",
    "輸出所有線段與（截斷後的）最終字串。"
   ],
   "pseudo_code": [
    "#region Usings",
    "  System.Text",
    "",
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 startString, rules, generations, stepLength, turnAngle, branchScale",
    "    輸出 lines, finalString",
    "",
    "    // 0. 防呆",
    "    沒字串或沒規則 → 結束",
    "",
    "    // 1. DATA 資料",
    "    rules → 對照表",
    "",
    "    // 2. INIT 初始",
    "    從 startString 開始",
    "",
    "    // 3. LOOP 迭代",
    "    重複 generations 次：",
    "      每個字照表同時換",
    "      超過 50 萬字 → 停",
    "",
    "    // 4. OUTPUT 輸出",
    "    畫筆照字串畫線 → lines",
    "    字串 → finalString",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：上限 50 萬字",
    "  ApplyRules：照表換字，沒規則照抄",
    "  DrawLines：F 畫線、+ - 轉彎、[ 記位置、] 回去",
    "  ReadRules：文字拆成對照表",
    "",
    "// ----- Script_Instance 外面 -----",
    "Pen：位置、方向、步長"
   ],
   "key_params": [
    {
     "name": "startString",
     "effect": "起始字串（axiom），決定一開始有幾根主幹、朝哪裡長。"
    },
    {
     "name": "rules",
     "effect": "改寫規則，是形態的「基因」；改一個符號就可能從草變成灌木。"
    },
    {
     "name": "generations",
     "effect": "代數越多越細密，但字串長度指數成長，4–6 代通常就夠。"
    },
    {
     "name": "stepLength",
     "effect": "每一步前進的長度，控制整體尺寸。"
    },
    {
     "name": "turnAngle",
     "effect": "轉彎角度；小角度（15–25°）像草，大角度（60–90°）接近幾何圖樣。"
    },
    {
     "name": "branchScale",
     "effect": "每進一層分枝長度的縮放；< 1 讓末梢變短，產生樹冠般的收斂感。"
    }
   ],
   "csharp_concepts": [
    "StringBuilder",
    "Dictionary<char,string>",
    "TryGetValue",
    "Stack<T>",
    "struct 值型別複製",
    "switch 敘述",
    "Plane.Rotate",
    "string.Split"
   ],
   "prerequisites": [
    "迴圈與 foreach",
    "字串處理",
    "Plane 與向量（YAxis 為前進方向）",
    "值型別 vs 參考型別（struct 為何能直接 Push 副本）"
   ],
   "teaching_note": "非常適合從零實作：先只寫改寫迴圈並印出字串，再加畫筆，最後加 [ ] 分枝，每一步都看得到結果。要提醒學習者字串爆炸（代數別超過 6–7）以及 struct 存進 Stack 是副本、若改成 class 就會出錯。3D 旋轉符號容易混淆，建議先用 2D（只用 + -）再開放 & ^ \\ /。",
   "variations": [
    {
     "title": "隨機 L-System",
     "level": 2,
     "what_changes": "規則",
     "how": "規則表改成 Dictionary<char, List<(string rule, double prob)>>，ApplyRules 時用 new Random(seed) 依機率挑一條；新增 seed 輸入確保可重現。",
     "result": "同一組規則長出一片「同種不同株」的樹林，形態自然不死板。"
    },
    {
     "title": "參數化 L-System（帶數值的符號）",
     "level": 3,
     "what_changes": "規則／狀態",
     "how": "符號改成 class Module { char Symbol; double[] Params; }，規則寫成 F(l) → F(l*0.7)[+F(l*0.5)]，字串改為 List<Module>；畫筆讀 Params 決定步長與角度。",
     "result": "每一段長度、角度、粗細都可隨代數遞減，接近真實樹木與 Prusinkiewicz 書中的植物。"
    },
    {
     "title": "線段轉管件／可製造構件",
     "level": 2,
     "what_changes": "輸出",
     "how": "在 DrawLines 中同時記錄每段的分枝深度（Stack.Count），輸出後用 Pipe 或 Brep.CreatePipe 依深度給不同半徑；或輸出節點與桿件清單給結構分析。",
     "result": "主幹粗、末梢細的實體分枝結構，可 3D 列印或轉為鋼管桿件。"
    },
    {
     "title": "向性（Tropism）：重力／光線吸引",
     "level": 3,
     "what_changes": "狀態",
     "how": "每次 F 之後把 pen.Location.YAxis 朝一個向量（如 -Z 重力或吸引點方向）微量插值再重建 Plane，強度用 tropism 參數控制。",
     "result": "枝條下垂成垂柳、或整體朝光源／吸引點彎曲。"
    },
    {
     "title": "吸引子控制的局部規則",
     "level": 3,
     "what_changes": "規則／輸入",
     "how": "改寫時查詢每個符號對應位置（需先跑一次畫筆取得位置）到吸引點的距離，距離近用茂密規則、遠用稀疏規則；新增 attractors 點輸入。",
     "result": "靠近指定位置分枝密集、遠處稀疏，可對應採光或視線需求。"
    },
    {
     "title": "邊界／體積約束修剪",
     "level": 3,
     "what_changes": "約束",
     "how": "畫線前用 Brep.IsPointInside 或 Curve.Contains 檢查 nextPoint；出界時忽略直到遇到對應的 ]（用計數器跳過該分枝）。",
     "result": "樹冠被修剪成指定量體，像造型植栽或填滿建築量體的分枝構架。"
    },
    {
     "title": "在曲面上生長",
     "level": 3,
     "what_changes": "維度",
     "how": "畫筆位置改記在曲面 UV 參數空間，每步用 Surface.PointAt 與 FrameAt 求 3D 點與切平面，轉彎繞曲面法向量旋轉。",
     "result": "分枝紋理貼附在曲面屋頂或立面上，可作為肋條或開孔圖樣。"
    },
    {
     "title": "生長動畫（逐代／逐字顯示）",
     "level": 2,
     "what_changes": "迴圈／輸出",
     "how": "把 generations 接滑桿或 Timer，或輸出前 N 條線（N 隨時間遞增）；進階可讓每段長度依「年齡」從 0 漸長到 stepLength。",
     "result": "看得見植物由主幹逐步分枝長大的過程，適合簡報與影片。"
    },
    {
     "title": "影像控制參數",
     "level": 3,
     "what_changes": "輸入",
     "how": "讀入 Bitmap，依畫筆目前 XY 位置取像素亮度，映射到 turnAngle 或 branchScale（亮處分枝開、暗處收）。",
     "result": "同一規則在不同區域長出不同疏密，可做以影像驅動的立面分枝圖樣。"
    },
    {
     "title": "混合 E01 Circle Packing：枝端長葉／節點",
     "level": 3,
     "what_changes": "混合其他家族",
     "how": "在每個分枝末端（遇到 ] 前的位置）記錄點，把這些點當作 Circle Packing 或 Voronoi 的種子。",
     "result": "枝幹加上不重疊的葉片或板材，形成樹狀遮陽棚或燈具。"
    },
    {
     "title": "分枝柱結構回饋",
     "level": 4,
     "what_changes": "混合搜尋／求解",
     "how": "將輸出桿件送進 Karamba3D 計算變形或應力，再用 Galapagos 調整 turnAngle、branchScale、generations 以最小化重量與位移。",
     "result": "兼顧形態與結構效率的樹狀柱，呼應 Frei Otto 樹狀柱的設計邏輯。"
    },
    {
     "title": "空間填充曲線與圖樣模式",
     "level": 1,
     "what_changes": "規則",
     "how": "改用 90° 或 60° 轉角與不含 [ ] 的規則（如 Koch、Hilbert、Sierpinski 的 L-system 寫法），可直接輸出為一筆畫曲線。",
     "result": "連續不交叉的圖樣線，可作為雷射切割、繪圖機或 3D 列印路徑。"
    }
   ],
   "project_seeds": [
    {
     "title": "L-System 繪圖機植物標本集",
     "brief": "設計 6–9 組規則，輸出成 A3 繪圖機（pen plotter）或雷射雕刻的系列作品，比較規則差異對形態的影響。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "可製造的樹狀燈具",
     "brief": "用隨機 + 參數化 L-system 生成分枝，轉成變徑管件並 3D 列印，研究光影投射效果。",
     "difficulty": 3,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "受量體約束的分枝立面",
     "brief": "讓分枝在建築立面曲面上生長並被開口邊界修剪，輸出肋條或遮陽構件，以影像或日照分析控制疏密。",
     "difficulty": 3,
     "combine_with": [
      "C03"
     ]
    },
    {
     "title": "樹狀支撐柱的結構最佳化",
     "brief": "以參數化 L-system 產生分枝柱，接 Karamba3D 分析並用演化演算法搜尋輕量且低位移的配置，呼應 Stuttgart 機場樹狀柱。",
     "difficulty": 4,
     "combine_with": [
      "B03"
     ]
    },
    {
     "title": "L-system 路網與街廓生成",
     "brief": "仿 Parish & Müller，以受約束的 L-system 長出道路網，遇水域或既有路網時修正，再切割街廓配置量體。",
     "difficulty": 5,
     "combine_with": [
      "A04",
      "C05"
     ]
    },
    {
     "title": "生成式景觀植栽群落",
     "brief": "在基地上散布不同物種規則（喬木、灌木、草），依日照或土壤影像決定生長參數，產出植栽配置與透視表現。",
     "difficulty": 3,
     "combine_with": [
      "C04"
     ]
    }
   ],
   "references": [
    {
     "title": "The Algorithmic Beauty of Plants",
     "author": "Przemyslaw Prusinkiewicz, Aristid Lindenmayer",
     "year": "1990",
     "url": "https://archive.org/details/the-algorithmic-beauty-of-plants"
    },
    {
     "title": "L-System manual（L-System User Notes）",
     "author": "Paul Bourke",
     "year": "",
     "url": "https://paulbourke.net/fractals/lsys/"
    },
    {
     "title": "Procedural Modeling of Cities",
     "author": "Yoav I. H. Parish, Pascal Müller",
     "year": "2001",
     "url": "https://history.siggraph.org/learning/procedural-modeling-of-cities-by-parish-and-muller/"
    },
    {
     "title": "Realistic modeling and rendering of plant ecosystems",
     "author": "Oliver Deussen 等",
     "year": "1998",
     "url": "https://algorithmicbotany.org/papers/ecosys.sig98.pdf"
    },
    {
     "title": "Rabbit: Tools for Grasshopper",
     "author": "Morphocode",
     "year": "",
     "url": "https://morphocode.com/rabbit/"
    },
    {
     "title": "L-System geometry node",
     "author": "SideFX",
     "year": "",
     "url": "https://www.sidefx.com/docs/houdini/nodes/sop/lsystem.html"
    },
    {
     "title": "L-Systems in Architecture",
     "author": "Michael Hansmeyer",
     "year": "",
     "url": "https://michael-hansmeyer.com/l-systems"
    }
   ]
  },
  {
   "id": "A02",
   "name_zh": "Koch 曲線／雪花",
   "name_en": "Koch Curve / Koch Snowflake",
   "family": "A",
   "family_name": "規則與語法",
   "file": "A02_Koch.cs",
   "loc": 143,
   "logic": [
    "改寫／遞迴"
   ],
   "data_structure": [
    "幾何"
   ],
   "difficulty": 2,
   "difficulty_reason": "只有一個遞迴方法 SplitEdge 加兩個小工具（起始多邊形、向量旋轉），沒有自訂 class，C# 基礎程度理解遞迴的停止條件就能讀懂。",
   "tags": [
    "遞迴",
    "分形",
    "對稱"
   ],
   "one_liner": "把每條線段的中間三分之一往外推成尖角，一層一層重複，讓一個三角形長成周長無限增加的雪花輪廓。",
   "how_it_works": [
    "依 sides 建立起始正多邊形（或一條直線）的角點清單",
    "每條邊交給遞迴 SplitEdge：切成三等分，中段用旋轉 -60° 的向量推出尖點，得到四段",
    "四段各自再呼叫 SplitEdge、深度減 1；深度為 0 時只記起點",
    "所有點依序串成 Polyline 輸出，點數 = 邊數 × 4^depth + 1"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 sides, size, depth",
    "    輸出 curve, pointCount",
    "",
    "    // 0. 防呆",
    "    size ≤ 0 → 結束",
    "    depth 限 0～7",
    "",
    "    // 1. DATA 資料",
    "    起始多邊形的角點（sides、size）",
    "",
    "    // 2. INIT 初始",
    "    空的點清單",
    "",
    "    // 3. LOOP 迭代：遞迴",
    "    每條邊丟給 SplitEdge",
    "",
    "    // 4. OUTPUT 輸出",
    "    點連成線 → curve",
    "    點數 → pointCount",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：深度上限 7",
    "  SplitEdge：切四段、中間推尖角，每段再丟回自己；層數用完 → 記點",
    "  MakeStartShape：正多邊形，sides < 3 → 一條線",
    "  TurnVector：向量轉角度"
   ],
   "key_params": [
    {
     "name": "sides",
     "effect": "起始多邊形邊數；3 = 經典雪花，4 以上輪廓趨近圓形，1–2 = 單條 Koch 曲線"
    },
    {
     "name": "size",
     "effect": "起始邊長，整體尺度"
    },
    {
     "name": "depth",
     "effect": "細分層數；每加一層線段數 ×4、周長 ×4/3，上限 7 以免點數爆炸"
    }
   ],
   "csharp_concepts": [
    "遞迴方法",
    "Vector3d 運算",
    "List<Point3d> 以參考傳入累積結果",
    "const 常數",
    "Polyline"
   ],
   "prerequisites": [
    "迴圈與方法",
    "向量加減與縮放",
    "三角函數旋轉公式"
   ],
   "teaching_note": "非常適合從零實作：規則只有「切三段、推一個尖」，可以先畫 depth=1 讓學習者看清楚五個點，再開到 4–5 層。要特別講清楚「只記起點、終點交給下一段」避免重複點，以及旋轉方向決定尖角朝外還是朝內。",
   "variations": [
    {
     "title": "尖角朝內（反雪花）",
     "level": 1,
     "what_changes": "規則",
     "how": "把 TurnVector(oneThird, -60) 改成 +60，尖角由外凸變內凹。",
     "result": "得到反雪花（anti-snowflake），輪廓向內捲出空洞，像冰晶的負形。"
    },
    {
     "title": "Cesàro／可調角度 Koch",
     "level": 2,
     "what_changes": "規則",
     "how": "新增輸入 angle（60°–89°），尖點長度改為 oneThird 依角度換算的腰長，firstCut、secondCut 位置也跟著調。",
     "result": "角度越大尖角越細長，輪廓從雪花過渡到針狀、接近填滿平面的曲線。"
    },
    {
     "title": "方形 Koch（Minkowski sausage）",
     "level": 2,
     "what_changes": "規則",
     "how": "把一段切成四等分或三等分，中段改成往外推出方形凸塊（90° 轉角），遞迴呼叫改為 5 或 8 段。",
     "result": "直角鋸齒的方形分形邊界，適合做正交立面或平面格柵。"
    },
    {
     "title": "隨機方向與不等分切點",
     "level": 2,
     "what_changes": "規則",
     "how": "加入 seed 與 Random，每次遞迴隨機決定尖角朝內或朝外、切點落在 0.3–0.4 之間。",
     "result": "像真實海岸線的不規則分形邊界，可重現種子控制形狀。"
    },
    {
     "title": "吸引子控制細分深度",
     "level": 3,
     "what_changes": "輸入／停止條件",
     "how": "新增吸引點 Point3d attractor，遞迴時依線段中點到吸引點距離決定 depthLeft 是否提早歸零。",
     "result": "靠近吸引點處細碎、遠處平直的漸變分形邊緣，可做立面開口或海岸步道的疏密變化。"
    },
    {
     "title": "任意曲線邊界上的 Koch",
     "level": 2,
     "what_changes": "輸入",
     "how": "把 MakeStartShape 換成讀入一條使用者畫的 Polyline（Curve.TryGetPolyline），逐段交給 SplitEdge。",
     "result": "任何平面輪廓（基地線、房間平面）都能長出分形邊緣。"
    },
    {
     "title": "3D 化：Koch 曲面／Kochcube",
     "level": 4,
     "what_changes": "維度",
     "how": "把遞迴對象從線段改成三角面：每個三角形切成四個，中間那片沿法向推出四面體，輸出 Mesh。",
     "result": "3D 分形刺狀曲面，接近 Koch 四面體或 Kochcube，可做雕塑或聲學擴散板。"
    },
    {
     "title": "逐層高度堆疊",
     "level": 2,
     "what_changes": "輸出／維度",
     "how": "用迴圈把 depth 0 到 n 的雪花各自 Move 到 z = level × h，再以 Loft 或逐層輸出。",
     "result": "由三角形逐層長成雪花的塔狀量體，高度即是遞迴層級的視覺化。"
    },
    {
     "title": "輸出可製造的封閉輪廓",
     "level": 2,
     "what_changes": "輸出",
     "how": "將結果 Polyline 做 Offset 形成厚度、Extrude 成板，或用 Region 布林切出孔洞，輸出給雷射切割。",
     "result": "可雷切的雪花屏風、壓克力燈罩或天花吸音板輪廓。"
    },
    {
     "title": "天線式周長最大化",
     "level": 3,
     "what_changes": "約束",
     "how": "加入外接框約束，計算每層 pointCount 與周長 Length，找出在固定尺寸下周長最大但線段不小於最小加工寬度的 depth。",
     "result": "理解分形天線、散熱鰭片「同面積增加周長」的邏輯並能輸出比較表。"
    },
    {
     "title": "深度漸進動畫",
     "level": 2,
     "what_changes": "迴圈／輸出",
     "how": "用 Timer 或 Slider 動畫把 depth 由 0 增加到 6，並用插值讓尖點高度從 0 慢慢長出。",
     "result": "雪花逐步生長的動畫，適合簡報說明遞迴。"
    },
    {
     "title": "混合 L-System 寫法",
     "level": 2,
     "what_changes": "規則（混合 A01）",
     "how": "改用字串改寫 F → F+F--F+F，再以 A01 的烏龜繪圖解譯，對照直接遞迴的差異。",
     "result": "同一個雪花的兩種實作，能延伸到任意 L-System 分形邊界。"
    }
   ],
   "project_seeds": [
    {
     "title": "分形吸音天花板",
     "brief": "以 3D Koch 曲面或方形 Koch 產生擴散板單元，依房間聲學需求用吸引子控制細分深度，輸出 CNC／3D 列印可製造的面板。",
     "difficulty": 3,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "分形海岸步道與景觀邊界",
     "brief": "以基地既有岸線為起始多邊形，用隨機 Koch 產生不同尺度的曲折邊界，比較周長增加對親水面、植栽帶長度的影響。",
     "difficulty": 3,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "雪花立面遮陽屏",
     "brief": "在立面格網中每格放入不同深度的 Koch 開口，依日照強度決定深度與尖角方向，輸出雷切板。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "周長 vs 面積：分形散熱／通風構件研究",
     "brief": "以 Koch 截面做通風管或散熱鰭片，量測各深度的周長、面積比並做簡單環境分析，討論分形天線、散熱器的同一原理。",
     "difficulty": 4,
     "combine_with": []
    },
    {
     "title": "3D Koch 雕塑與數位製造",
     "brief": "把遞迴從線段推廣到三角面，產生 Koch 四面體曲面並處理自相交與薄件問題，完成 3D 列印實體模型。",
     "difficulty": 5,
     "combine_with": [
      "A01"
     ]
    }
   ],
   "references": [
    {
     "title": "Sur une courbe continue sans tangente, obtenue par une construction géométrique élémentaire",
     "author": "Helge von Koch",
     "year": "1904",
     "url": ""
    },
    {
     "title": "How Long Is the Coast of Britain? Statistical Self-Similarity and Fractional Dimension",
     "author": "Benoit B. Mandelbrot",
     "year": "1967",
     "url": "https://www.science.org/doi/10.1126/science.156.3775.636"
    },
    {
     "title": "The Fractal Geometry of Nature",
     "author": "Benoit B. Mandelbrot",
     "year": "1982",
     "url": ""
    },
    {
     "title": "Koch snowflake",
     "author": "Wikipedia",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Koch_snowflake"
    },
    {
     "title": "Koch Snowflake",
     "author": "Wolfram MathWorld",
     "year": "",
     "url": "https://mathworld.wolfram.com/KochSnowflake.html"
    },
    {
     "title": "The Algorithmic Beauty of Plants",
     "author": "Przemysław Prusinkiewicz, Aristid Lindenmayer",
     "year": "1990",
     "url": ""
    }
   ]
  },
  {
   "id": "A03",
   "name_zh": "Hilbert 曲線",
   "name_en": "Hilbert Curve",
   "family": "A",
   "family_name": "規則與語法",
   "file": "A03_Hilbert.cs",
   "loc": 96,
   "logic": [
    "改寫／遞迴"
   ],
   "data_structure": [
    "網格",
    "幾何"
   ],
   "difficulty": 2,
   "difficulty_reason": "不到 100 行、只有一個遞迴方法，但要理解用兩條邊向量對調與反向來表示翻轉，比 Koch 多一點空間想像，屬基礎級。",
   "tags": [
    "遞迴",
    "分形",
    "空間填充"
   ],
   "one_liner": "把正方形一直切成 2×2 小格，用一條不交叉的連續線依 ㄇ 字順序走遍每一格，所以一筆就能填滿整個平面。",
   "how_it_works": [
    "整個正方形用角點 corner 加兩條邊向量 edgeA、edgeB 表示",
    "遞迴 VisitSquare 把正方形切成四個小格，依 ㄇ 字順序走過",
    "第 1 格把兩邊向量對調（翻轉）、第 4 格反向對調，四段頭尾才接得上",
    "切到最小格（levelsLeft = 0）就記下格子中心，最後串成 Polyline，點數 = 4^order"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 order, size",
    "    輸出 curve, pointCount",
    "",
    "    // 0. 防呆",
    "    size ≤ 0 → 結束",
    "    order 限 1～8",
    "",
    "    // 1. DATA 資料",
    "    空的點清單",
    "",
    "    // 3. LOOP 迭代：遞迴",
    "    整個正方形丟給 VisitSquare",
    "",
    "    // 4. OUTPUT 輸出",
    "    點連成線 → curve",
    "    點數 → pointCount",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：階數上限 8",
    "  VisitSquare：切 2×2、照ㄇ字走，第 1、4 格翻轉；最小格 → 記中心"
   ],
   "key_params": [
    {
     "name": "order",
     "effect": "階數；每多一階格子數 ×4、線段變短一半，上限 8（65536 點）"
    },
    {
     "name": "size",
     "effect": "正方形邊長，決定整體尺度與最小格寬 = size / 2^order"
    }
   ],
   "csharp_concepts": [
    "遞迴方法",
    "Vector3d 表示方向與翻轉",
    "List<Point3d> 累積",
    "const 常數",
    "Polyline"
   ],
   "prerequisites": [
    "方法與遞迴",
    "向量加法與負向量",
    "A02 Koch 遞迴概念"
   ],
   "teaching_note": "適合從零實作，但建議先用紙畫 order 1、2 讓學習者看出第 1、4 格為什麼要翻轉。可以在每個點旁輸出索引數字，讓學習者看到「一維順序對應到二維位置、相鄰索引在空間上也相鄰」這個最重要的性質。",
   "variations": [
    {
     "title": "Moore 曲線（封閉環）",
     "level": 2,
     "what_changes": "規則",
     "how": "最上層改成四個 Hilbert 子格以旋轉對稱方式排列（頭尾位於同一邊中央），其餘遞迴不變。",
     "result": "頭尾相接的封閉空間填充迴路，可做連續走道或無接縫列印路徑。"
    },
    {
     "title": "Peano 曲線（3×3 切分）",
     "level": 3,
     "what_changes": "規則",
     "how": "把 halfA、halfB 改成三分之一，每層依蛇形順序呼叫九次 VisitSquare，並交替翻轉方向。",
     "result": "3×3 遞迴的 Peano 曲線，格線更規律，適合正交格網建築。"
    },
    {
     "title": "Gosper（flowsnake）六角變體",
     "level": 4,
     "what_changes": "規則／網格",
     "how": "改用 L-System 規則 A → A-B--B+A++AA+B-、B → +A-BB--B-A++A+B（60° 轉角）以烏龜繪圖展開。",
     "result": "六角格上的空間填充曲線，輪廓像雪花海岸，可接六角平面或蜂巢單元。"
    },
    {
     "title": "3D Hilbert 立方體",
     "level": 4,
     "what_changes": "維度",
     "how": "把正方形改成立方體（三條邊向量），每層切成 2×2×2 共八格，依 3D Hilbert 順序排列八次遞迴並給定各子格的向量置換。",
     "result": "一筆走遍立方體所有格子的 3D 管線，像 Séquin 的 Hilbert Cube 雕塑。"
    },
    {
     "title": "非均勻細分（四分樹自適應）",
     "level": 3,
     "what_changes": "停止條件／輸入",
     "how": "新增吸引點或影像亮度輸入，只有在格子內需求高（距離近或暗）時才繼續往下切，否則提早記中心。",
     "result": "疏密漸變的空間填充線，可做半色調線畫或局部加密的列印填充。"
    },
    {
     "title": "曲面上的 Hilbert",
     "level": 3,
     "what_changes": "維度／輸出",
     "how": "把 size 設為 1，在 UV 參數空間 (0–1) 產生點，再用 Surface.PointAt(u,v) 映射到自由曲面上。",
     "result": "貼附雙曲面的連續線，可做機械手臂熱線、擠出或鋪磚路徑。"
    },
    {
     "title": "任意邊界裁切與重連",
     "level": 3,
     "what_changes": "約束",
     "how": "輸入一條封閉邊界曲線，只保留落在邊界內的格心（Curve.Contains），斷開處再用最近點重新接上。",
     "result": "非方形平面（基地、樓板）內的近似空間填充路徑。"
    },
    {
     "title": "依序號上色的資料地圖",
     "level": 2,
     "what_changes": "輸出",
     "how": "把每個點的索引 i 換算成 0–1 的顏色漸層，或把一維資料（時間序列、IP、樓層使用率）依序對應到每一格輸出色塊 Mesh。",
     "result": "像 xkcd IPv4 地圖的資料視覺化，一維相近的資料在平面上也聚在一起。"
    },
    {
     "title": "Hilbert 排序做點雲／構件編號",
     "level": 3,
     "what_changes": "輸入／用途",
     "how": "反過來寫：輸入一堆點，算出每點所在格的 Hilbert 索引（xy→d），依索引排序後連線。",
     "result": "空間局部性良好的構件編號、施工順序或近似旅行推銷員路徑。"
    },
    {
     "title": "輸出可製造的 3D 列印／刀具路徑",
     "level": 3,
     "what_changes": "輸出",
     "how": "對 Polyline 做 Fillet 圓角與 Offset 寬度，並逐層 Move 或旋轉 90° 堆疊成 G-code 路徑。",
     "result": "連續不斷料的填充路徑，減少空跑與拉絲，可直接做 3D 列印磚或 CNC 雕刻圖樣。"
    },
    {
     "title": "迷宮與通道",
     "level": 2,
     "what_changes": "輸出",
     "how": "把曲線 Offset 成兩條邊界，封閉兩端形成單一通道，或在相鄰格之間隨機打通。",
     "result": "一筆走完的迷宮、景觀步道或花園小徑圖樣。"
    },
    {
     "title": "逐點生長動畫",
     "level": 2,
     "what_changes": "迴圈／輸出",
     "how": "用 Slider 或 Timer 控制只輸出前 n 個點（allPoints.GetRange(0, n)）。",
     "result": "曲線如蛇般一格一格填滿平面的動畫，直觀呈現空間填充性。"
    }
   ],
   "project_seeds": [
    {
     "title": "Hilbert 路徑 3D 列印磚",
     "brief": "以 Hilbert／Moore 曲線做每層填充路徑，依受力或透光需求用非均勻細分改變密度，輸出 G-code 並列印牆磚樣本。",
     "difficulty": 3,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "校園使用資料的 Hilbert 地圖",
     "brief": "收集一維資料（例如一年逐時的教室使用率），用 Hilbert 映射成平面色塊，再做成立面或地坪的圖樣，讓資料變成空間。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "3D Hilbert 管線雕塑",
     "brief": "實作 2×2×2 的 3D Hilbert，把路徑做成圓管並處理轉角，比較不同階數的可製造性，完成 3D 列印或金屬彎管模型。",
     "difficulty": 4,
     "combine_with": [
      "A01"
     ]
    },
    {
     "title": "自由曲面上的空間填充鋪面",
     "brief": "將 Hilbert 映射到 UV 空間，依曲率做自適應細分，產出曲面屋頂的連續鋪面或機械手臂擠出路徑。",
     "difficulty": 4,
     "combine_with": [
      "C03"
     ]
    },
    {
     "title": "空間填充曲線族比較平台",
     "brief": "在同一元件中實作 Hilbert、Moore、Peano、Gosper，定義局部性、長度、轉角數等指標做量化比較，並作為刀具路徑選擇工具。",
     "difficulty": 5,
     "combine_with": [
      "A01"
     ]
    }
   ],
   "references": [
    {
     "title": "Über die stetige Abbildung einer Linie auf ein Flächenstück",
     "author": "David Hilbert",
     "year": "1891",
     "url": ""
    },
    {
     "title": "Space-Filling Curves",
     "author": "Hans Sagan",
     "year": "1994",
     "url": ""
    },
    {
     "title": "Hilbert curve",
     "author": "Wikipedia",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Hilbert_curve"
    },
    {
     "title": "Peano-Gosper Curve",
     "author": "Wolfram MathWorld",
     "year": "",
     "url": "https://mathworld.wolfram.com/Peano-GosperCurve.html"
    },
    {
     "title": "Map of the Internet (xkcd 195)",
     "author": "Randall Munroe",
     "year": "2006",
     "url": "https://www.explainxkcd.com/wiki/index.php/195:_Map_of_the_Internet"
    },
    {
     "title": "Gosper-Peano Curve in Grasshopper",
     "author": "designcoding",
     "year": "",
     "url": "https://www.designcoding.net/gosper-peano-curve-in-grasshopper/"
    }
   ]
  },
  {
   "id": "A04",
   "name_zh": "遞迴分割",
   "name_en": "Recursive Subdivision",
   "family": "A",
   "family_name": "規則與語法",
   "file": "A04_RecursiveSubdivision.cs",
   "loc": 160,
   "logic": [
    "改寫／遞迴"
   ],
   "data_structure": [
    "幾何"
   ],
   "difficulty": 2,
   "difficulty_reason": "約 160 行，只有一個自訂 class（Block）加一個自己呼叫自己的 SplitBlock 函式，沒有鄰居搜尋或空間索引，C# 基礎程度能讀懂。",
   "tags": [
    "遞迴",
    "隨機",
    "可重現種子",
    "自訂 class"
   ],
   "one_liner": "把一塊基地沿長邊切成兩塊，每一塊再丟回同一個函式繼續切，直到太小或隨機停下，得到 Mondrian 式的矩形分區。",
   "how_it_works": [
    "用 width、height 建立一個代表整塊基地的 Block（左下角＋寬＋深＋深度 0）。",
    "SplitBlock 先檢查停止條件：最長邊已切不出兩塊 minSize，或（深度 > 0 時）擲骰小於 stopChance，就把這塊收進 finishedBlocks。",
    "否則比較寬與深，沿長邊切；切割位置 = 長邊 × 介於 minRatio～maxRatio 的隨機比例，並夾在 minSize 與（長邊 − minSize）之間。",
    "產生兩個深度 +1 的新 Block，分別再呼叫 SplitBlock（遞迴）。",
    "全部遞迴結束後，把每塊轉成封閉 Polyline 輸出，並輸出每塊的 Depth 供上色。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 width, height, minSize, seed, minRatio, maxRatio, stopChance",
    "    輸出 rectangles, depths",
    "",
    "    // 0. 防呆",
    "    尺寸 ≤ 0 → 結束",
    "    minRatio、maxRatio 填反 → 對調",
    "",
    "    // 1. DATA 資料",
    "    隨機數（seed）、完成的區塊清單",
    "",
    "    // 2. INIT 初始",
    "    整塊基地（width × height）",
    "",
    "    // 3. LOOP 迭代：遞迴",
    "    基地丟給 SplitBlock",
    "",
    "    // 4. OUTPUT 輸出",
    "    每塊外框 → rectangles",
    "    切了幾次 → depths",
    "",
    "  // ----- RunScript 下方 -----",
    "  SplitBlock：太小或擲骰停 → 收起來；否則沿長邊切兩塊，各自丟回自己",
    "",
    "// ----- Script_Instance 外面 -----",
    "Block：左下角、寬、深、切了幾次"
   ],
   "key_params": [
    {
     "name": "minSize",
     "effect": "最小邊長；越小切得越細、區塊數量急遽增加"
    },
    {
     "name": "minRatio / maxRatio",
     "effect": "切割位置範圍；接近 0.5 得到均勻格狀，範圍拉大（0.2–0.8）則大小懸殊、更像 Mondrian"
    },
    {
     "name": "stopChance",
     "effect": "每塊提早停止的機率；越高越會留下大塊空白，形成大小混合的層級感"
    },
    {
     "name": "seed",
     "effect": "隨機種子；同一組種子結果可重現，換種子就換一個方案"
    },
    {
     "name": "width / height",
     "effect": "基地尺寸；長寬比會影響第一刀方向與整體走向"
    }
   ],
   "csharp_concepts": [
    "遞迴函式（自己呼叫自己）",
    "自訂 class Block",
    "List<Block> 收集結果",
    "Random(seed) 可重現亂數",
    "三元運算子 ? :",
    "LINQ Select 轉輸出",
    "Polyline 建構封閉外框"
   ],
   "prerequisites": [
    "函式與參數傳遞",
    "if 條件與 bool",
    "class 與建構子",
    "Point3d + Vector3d 位移"
   ],
   "teaching_note": "非常適合從零實作：先只寫「切一刀」，再把兩塊丟回自己，學習者能直接看到遞迴展開。要特別強調停止條件，否則會無限遞迴讓 Rhino 當掉；建議先把 minSize 設大一點再慢慢調小。也可以用 depths 上色，讓學習者看見遞迴樹的層級。",
   "variations": [
    {
     "title": "四分樹（Quadtree）分割",
     "level": 2,
     "what_changes": "規則",
     "how": "把「切成兩塊」改成一次切成四塊（寬、深各切一半或隨機比例），在 SplitBlock 裡產生四個 Block 並各自遞迴。",
     "result": "規整的四分樹網格，大小以 2 的次方遞減，適合做像素化或多解析度網格。"
    },
    {
     "title": "吸引子控制細緻度",
     "level": 2,
     "what_changes": "停止條件",
     "how": "新增輸入 attractor（Point3d），把 minSize 改成隨區塊中心到吸引子的距離線性放大：越靠近吸引子允許切得越小。",
     "result": "靠近某點（入口、廣場、視線焦點）切得很碎，遠處保持大塊，形成密度漸變。"
    },
    {
     "title": "影像驅動的自適應分割",
     "level": 3,
     "what_changes": "輸入／停止條件",
     "how": "讀入 Bitmap，對每個區塊取樣像素灰階的變異數；變異數大於門檻才繼續切，否則停止並填入平均色。",
     "result": "類似 Quadtree Art 的影像馬賽克：細節多的地方切得細、平坦處保留大塊。"
    },
    {
     "title": "任意多邊形基地（OBB 分割）",
     "level": 3,
     "what_changes": "資料結構／幾何",
     "how": "把 Block 從「角點＋寬深」改成封閉 Curve，每次算最小外接矩形（OBB）的長軸，用垂直於長軸的線切開（Curve.Split 或 Brep 切割），再遞迴。",
     "result": "可以切不規則的都市街廓或基地，得到類 CityEngine 的地籍分割。"
    },
    {
     "title": "3D 量體切分（BSP 盒子）",
     "level": 3,
     "what_changes": "維度",
     "how": "Block 增加 Depth 方向的 Z 尺寸，停止條件與切割方向改成比較 X、Y、Z 三個邊中最長者，輸出改成 Box。",
     "result": "立體的量體分割，可當成住宅單元堆疊、書架或積木量體研究。"
    },
    {
     "title": "面積比例驅動（Treemap 平面配置）",
     "level": 3,
     "what_changes": "規則",
     "how": "輸入一串房間面積 List<double>，每次把房間清單分成兩組，使兩組面積和的比例就是切割比例，再各自遞迴（切片式 treemap，進一步可改為 squarified 排列讓長寬比接近 1）。",
     "result": "自動產生符合面積需求的房間配置泡泡圖，可當住宅或辦公平面的起點。"
    },
    {
     "title": "立面開窗分割",
     "level": 2,
     "what_changes": "輸出／維度",
     "how": "把基地改成立面平面（XZ 平面），分割完的區塊依深度或隨機決定是玻璃、實牆或內縮窗框，對每塊做 Offset 後 Extrude。",
     "result": "類 split grammar 的立面：樓層、開間、窗框層層細分，具有層級秩序。"
    },
    {
     "title": "Mondrian 上色與線寬",
     "level": 1,
     "what_changes": "輸出",
     "how": "依 depths 或隨機給每塊紅／黃／藍／白色，並用深度決定黑色分隔線粗細，在 GH 用 Custom Preview 顯示。",
     "result": "可直接輸出的 Mondrian 風格圖樣，適合 2D 圖面與海報。"
    },
    {
     "title": "曲面上分割",
     "level": 3,
     "what_changes": "維度",
     "how": "改成在曲面的 UV 參數空間（0–1）裡做分割，再用 Surface.PointAt 把每塊四角映射回 3D，組成曲面上的面板。",
     "result": "曲面立面或屋頂上大小不一的嵌板分割。"
    },
    {
     "title": "可製造的面板與框料",
     "level": 3,
     "what_changes": "輸出",
     "how": "每個區塊往內 Offset 一個框料寬度，外框做 Extrude 當框料、內框做薄板，並依尺寸分群統計數量輸出清單。",
     "result": "可雷射切割或 CNC 的框架＋嵌板組件，與料單。"
    },
    {
     "title": "逐層動畫化",
     "level": 2,
     "what_changes": "迴圈",
     "how": "新增 maxDepth 輸入，當 Depth 達 maxDepth 時強制停止；接 GH Slider 或 Timer 從 0 往上加，就能一層一層看遞迴展開。",
     "result": "展示遞迴樹逐代生長的動畫，學習效果好。"
    },
    {
     "title": "網格細分（Catmull-Clark 精神）",
     "level": 4,
     "what_changes": "資料結構／維度",
     "how": "把 Block 換成 Mesh 的面，每一代把四邊形面切成四個子面，並依鄰接頂點平均移動新點（或直接用 Weaverbird），加上權重擾動。",
     "result": "從簡單量體長出平滑或 Hansmeyer 式繁複的有機表面。"
    }
   ],
   "project_seeds": [
    {
     "title": "Mondrian 式立面產生器",
     "brief": "以建築立面為基地做遞迴分割，依朝向或室內機能決定開窗比例與材質，輸出可比較的多個立面方案。",
     "difficulty": 2,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "影像驅動的像素化地景鋪面",
     "brief": "讀入航照或灰階圖，用四分樹自適應分割產生鋪面分割圖，細節多處用小磚、平坦處用大板，並輸出磚塊數量。",
     "difficulty": 3,
     "combine_with": [
      "C05"
     ]
    },
    {
     "title": "面積需求自動平面配置",
     "brief": "輸入房間清單與面積，用 treemap 式遞迴分割產生平面，再檢查房間長寬比與鄰接需求，比較多種種子。",
     "difficulty": 3,
     "combine_with": [
      "A05"
     ]
    },
    {
     "title": "不規則街廓地籍切分",
     "brief": "在真實都市街廓（任意多邊形）上以 OBB 遞迴分割出地籍，並依臨街面寬與面積限制過濾，最後擠出建築量體。",
     "difficulty": 4,
     "combine_with": [
      "A05",
      "C03"
     ]
    },
    {
     "title": "3D 遞迴細分柱／牆",
     "brief": "以網格細分為核心，加入自訂權重讓每一代的新點偏移，做出 Hansmeyer 式裝飾柱，並切片輸出成可疊層製造的輪廓線。",
     "difficulty": 5,
     "combine_with": [
      "B01"
     ]
    }
   ],
   "references": [
    {
     "title": "Squarified Treemaps",
     "author": "Mark Bruls, Kees Huizing, Jarke J. van Wijk",
     "year": "2000",
     "url": "https://link.springer.com/chapter/10.1007/978-3-7091-6783-0_4"
    },
    {
     "title": "Recursively Generated B-Spline Surfaces on Arbitrary Topological Meshes",
     "author": "Edwin Catmull, Jim Clark",
     "year": "1978",
     "url": ""
    },
    {
     "title": "Procedural Modeling of Buildings",
     "author": "Pascal Müller, Peter Wonka, Simon Haegler, Andreas Ulmer, Luc Van Gool",
     "year": "2006",
     "url": "https://history.siggraph.org/learning/procedural-modeling-of-buildings-by-muller-wonka-haegler-ulmer-and-gool/"
    },
    {
     "title": "Procedural Generation of Parcels in Urban Modeling",
     "author": "Carlos A. Vanegas, Tom Kelly, Basil Weber, Jan Halatsch, Daniel G. Aliaga, Pascal Müller",
     "year": "2012",
     "url": "https://twak.org/project/parcels/"
    },
    {
     "title": "Automatic Real-Time Generation of Floor Plans Based on Squarified Treemaps Algorithm",
     "author": "Fernando Marson, Soraia Raupp Musse",
     "year": "2010",
     "url": "https://www.researchgate.net/publication/47696530_Automatic_Real-Time_Generation_of_Floor_Plans_Based_on_Squarified_Treemaps_Algorithm"
    },
    {
     "title": "Michael Hansmeyer: Computational Architecture Projects",
     "author": "Michael Hansmeyer",
     "year": "",
     "url": "https://michael-hansmeyer.com/projects"
    }
   ]
  },
  {
   "id": "A05",
   "name_zh": "形狀文法",
   "name_en": "Shape Grammar",
   "family": "A",
   "family_name": "規則與語法",
   "file": "A05_ShapeGrammar.cs",
   "loc": 189,
   "logic": [
    "改寫／遞迴"
   ],
   "data_structure": [
    "幾何",
    "符號"
   ],
   "difficulty": 2,
   "difficulty_reason": "約 190 行、只有一個自訂 class（LabeledSquare）加一個規則函式，每代把清單整批替換，沒有鄰居搜尋或空間索引；難點只在旋轉向量與直角三角形的邊長換算。",
   "tags": [
    "字串改寫",
    "遞迴",
    "分形",
    "自訂 class",
    "對稱"
   ],
   "one_liner": "不改寫文字，而是直接把「帶標籤的形狀」換成新的形狀組合：一個大正方形 A 被換成定住的 B 加上兩個縮小旋轉的 A，反覆套用就長出畢氏樹。",
   "how_it_works": [
    "起始形狀：一個標籤為 A 的正方形（左下角、底邊方向、邊長）。",
    "每一代把清單裡所有形狀同時丟進 ApplyRules：B、C 原樣保留；A 太小就改標籤成 C（葉）；A 夠大就變成 B，並在頂邊架出兩個新的 A。",
    "兩個新 A 的邊長分別是 size·cos(angle) 與 size·sin(angle)，方向分別轉 angle 與 angle−90°，剛好和頂邊圍成直角三角形。",
    "新清單取代舊清單；若已經沒有 A 就提早停止。",
    "輸出每個正方形的封閉 Polyline 與標籤字串，可用標籤分色。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 generations, size, angle, minSize",
    "    輸出 outlines, labels",
    "",
    "    // 0. 防呆",
    "    size ≤ 0 → 結束",
    "    angle 限 1～89",
    "    generations 最多 14",
    "",
    "    // 1. DATA 資料",
    "    形狀清單",
    "",
    "    // 2. INIT 初始",
    "    一個 A 正方形（size）",
    "",
    "    // 3. LOOP 迭代",
    "    重複 generations 次：",
    "      所有形狀同時套規則",
    "      沒有 A → 停",
    "",
    "    // 4. OUTPUT 輸出",
    "    外框 → outlines",
    "    標籤 → labels",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：世代上限 14",
    "  ApplyRules：B、C 不變；A 太小（< minSize）→ C；A → B ＋ 兩個轉 angle 的小 A",
    "  TurnVector：向量轉角度",
    "",
    "// ----- Script_Instance 外面 -----",
    "LabeledSquare：標籤、左下角、方向、邊長"
   ],
   "key_params": [
    {
     "name": "generations",
     "effect": "世代數，形狀數最多 2 的 generations 次方，上限 14 代"
    },
    {
     "name": "size",
     "effect": "第一個正方形邊長，決定整棵樹的尺度"
    },
    {
     "name": "angle",
     "effect": "分叉角度；45° 左右對稱，偏離 45° 樹會往一側傾倒並形成螺旋"
    },
    {
     "name": "minSize",
     "effect": "終止條件：邊長小於它的 A 變成葉 C，越大樹越稀疏、越早停"
    }
   ],
   "csharp_concepts": [
    "自訂 class（欄位＋建構子＋方法）",
    "List<T> 整批替換（雙緩衝）",
    "char 標籤判斷",
    "Vector3d 旋轉（cos/sin 矩陣）",
    "LINQ Any / Select",
    "const 常數"
   ],
   "prerequisites": [
    "迴圈與 if",
    "class 與建構子",
    "三角函數 cos/sin",
    "Point3d＋Vector3d 運算"
   ],
   "teaching_note": "很適合從零實作：規則函式很短，學習者能立刻改規則看到形變。重點要講清楚「每代同時套用（新清單取代舊清單）」與 L-System 的差別；旋轉向量那段可以先當黑盒子，再回頭解釋。",
   "variations": [
    {
     "title": "隨機分叉角的畢氏樹",
     "level": 2,
     "what_changes": "規則",
     "how": "新增 seed 輸入並建立 Random，在規則 1 裡把 angle 換成 angle + random.NextDouble()*jitter，每個 A 各自決定角度。",
     "result": "每一枝傾斜不同、像被風吹過的自然樹形，但同一 seed 可重現。"
    },
    {
     "title": "多條規則競爭（機率文法）",
     "level": 2,
     "what_changes": "規則",
     "how": "在 ApplyRules 為 A 準備 2–3 條替換規則（分兩枝、分三枝、只長一枝），用機率或邊長區間選一條套用。",
     "result": "同一顆種子長出風格一致但細節不同的一整個「家族」設計。"
    },
    {
     "title": "分割文法（split grammar）",
     "level": 2,
     "what_changes": "規則／狀態",
     "how": "把 LabeledSquare 換成矩形，規則改成「A → 沿長邊切成 n 份」，標籤分為 Floor、Bay、Window、Wall，最後一層輸出開口框。",
     "result": "類似 CityEngine CGA 的立面分割：樓層→開間→窗牆。"
    },
    {
     "title": "冰裂紋窗格（Ice-ray）",
     "level": 3,
     "what_changes": "狀態／規則",
     "how": "形狀改成任意凸多邊形，規則為「A 若面積大於門檻 → 隨機選兩條邊，連一條線把它切成兩個 A」，面積小的變成 C。",
     "result": "中式冰裂紋窗花，每片大小自然遞減。"
    },
    {
     "title": "3D 畢氏樹（立方體版）",
     "level": 3,
     "what_changes": "維度",
     "how": "LabeledSquare 改成 LabeledBox，用 Plane 取代 Direction/Up，規則在頂面長出 2–4 個繞不同軸旋轉的小方塊，輸出 Box 或 Brep。",
     "result": "立體分枝的方塊樹，可當雕塑或構架量體。"
    },
    {
     "title": "曲面上的形狀文法",
     "level": 3,
     "what_changes": "維度／輸出",
     "how": "在 UV 參數空間 (0–1) 執行原本的規則，最後用 surface.PointAt(u,v) 把每個正方形的四角映射到曲面上。",
     "result": "畢氏樹或分割圖樣貼附在自由曲面表皮上。"
    },
    {
     "title": "吸引子控制的終止條件",
     "level": 2,
     "what_changes": "輸入／規則",
     "how": "新增 attractor 點輸入，把 minSize 改成隨形狀中心到吸引子的距離變化，越近越小（越細密）。",
     "result": "靠近吸引子處分枝細密，遠處早早成葉，形成密度漸層。"
    },
    {
     "title": "邊界約束（不可出界／不可重疊）",
     "level": 3,
     "what_changes": "約束",
     "how": "新增 boundary 曲線輸入，規則 1 產生新 A 前先用 Curve.Contains 或與既有形狀做相交測試，失敗則改標為 C。",
     "result": "樹被限制在基地或立面範圍內，形成貼合邊界的填充。"
    },
    {
     "title": "標籤驅動的構件語言",
     "level": 2,
     "what_changes": "輸出",
     "how": "依標籤輸出不同幾何：B 擠出成實牆、C 變成開口或植栽、A 留空；用 Extrusion.Create 給不同高度。",
     "result": "一張平面文法圖直接變成有虛實的 2.5D 模型。"
    },
    {
     "title": "逐代動畫",
     "level": 2,
     "what_changes": "迴圈／輸出",
     "how": "把 generations 接 Slider 或 Timer，每次只多跑一代並保留舊形狀；或輸出每一代的 DataTree 分支給 GH 顯示。",
     "result": "看見規則一步步改寫形狀的過程，適合簡報與教學。"
    },
    {
     "title": "混合 L-System 的語彙",
     "level": 3,
     "what_changes": "混合其他家族",
     "how": "用 A01 的字串產生規則序列（例如 L/R/S 代表左長、右長、停止），逐字元決定每個 A 要套用哪條形狀規則。",
     "result": "字串控制結構、形狀文法控制幾何，兩層可分開設計。"
    },
    {
     "title": "輸出成可雷切的片材",
     "level": 3,
     "what_changes": "輸出轉成可製造幾何",
     "how": "把每個正方形向內 Offset 板厚並在接觸邊加卡榫缺口，依標籤分層排版到板材上並編號。",
     "result": "可雷射切割組裝的畢氏樹或分割立面模型。"
    }
   ],
   "project_seeds": [
    {
     "title": "我的立面文法",
     "brief": "觀察一棟既有建築立面，歸納成 5–8 條分割規則（樓層、開間、窗、牆），在 GH 用分割文法重現原立面，再調參數生成 20 種變體並比較。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "冰裂紋遮陽板",
     "brief": "以 Ice-ray 切割文法生成窗格，依日照方向或吸引子調整格子密度，最後輸出成可雷切的遮陽板。",
     "difficulty": 3,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "Malagueira 式客製化住宅產生器",
     "brief": "仿照 Duarte 的做法，把一種合院住宅類型整理成規則，輸入家庭人數與基地尺寸，自動產生符合風格的平面配置。",
     "difficulty": 4,
     "combine_with": [
      "A04"
     ]
    },
    {
     "title": "3D 方塊樹構架",
     "brief": "把畢氏樹擴展為 3D 方塊文法，加入不可碰撞約束與重力方向偏好，產生可當亭子或裝置的構架量體並做構件拆解。",
     "difficulty": 3,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "文法＋性能最佳化的桁架",
     "brief": "參考 eifForm 的 shape annealing：用形狀規則增刪桁架節點與桿件，搭配簡單結構評估與模擬退火搜尋，比較不同規則集找到的形。",
     "difficulty": 5,
     "combine_with": [
      "A04"
     ]
    },
    {
     "title": "街廓尺度 CGA 城市",
     "brief": "用分割文法把地塊切成量體、量體再切成樓層與立面，依道路距離調整高度與開窗比例，生成一個小街廓。",
     "difficulty": 4,
     "combine_with": [
      "A04",
      "C04"
     ]
    }
   ],
   "references": [
    {
     "title": "Shape Grammars and the Generative Specification of Painting and Sculpture",
     "author": "George Stiny, James Gips",
     "year": "1972",
     "url": "https://www.semanticscholar.org/paper/Shape-Grammars-and-the-Generative-Specification-of-Stiny-Gips/c8f7baf704f7d7713eee196de6cb90cbfb7fc4cd"
    },
    {
     "title": "The Palladian Grammar",
     "author": "G. Stiny, W. J. Mitchell",
     "year": "1978",
     "url": "https://journals.sagepub.com/doi/10.1068/b050005"
    },
    {
     "title": "Procedural Modeling of Buildings",
     "author": "Pascal Müller, Peter Wonka, Simon Haegler, Andreas Ulmer, Luc Van Gool",
     "year": "2006",
     "url": "https://dl.acm.org/doi/10.1145/1141911.1141931"
    },
    {
     "title": "Instant Architecture",
     "author": "Peter Wonka, Michael Wimmer, François Sillion, William Ribarsky",
     "year": "2003",
     "url": "https://www.cg.tuwien.ac.at/research/publications/2003/Wonka-2003-Ins"
    },
    {
     "title": "Shape grammar（Wikipedia）",
     "author": "",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Shape_grammar"
    },
    {
     "title": "Fifty years of shape grammars: A systematic mapping of its application in engineering and architecture",
     "author": "Sverre Magnus Haakonsen, Anders Rønnquist, Nathalie Labonnote",
     "year": "2023",
     "url": "https://journals.sagepub.com/doi/10.1177/14780771221089882"
    },
    {
     "title": "Shape Computation Lab（Shape Machine、GRAPE 等文法直譯器）",
     "author": "Georgia Tech",
     "year": "",
     "url": "https://shape.gatech.edu/Research/index.html"
    }
   ]
  },
  {
   "id": "A06",
   "name_zh": "波函數塌縮",
   "name_en": "Wave Function Collapse (WFC)",
   "family": "A",
   "family_name": "規則與語法",
   "file": "A06_WFC.cs",
   "loc": 256,
   "logic": [
    "搜尋／求解"
   ],
   "data_structure": [
    "網格"
   ],
   "difficulty": 3,
   "difficulty_reason": "256 行、一個自訂 class（PipeTile），核心是「最少可能性優先＋Stack 約束傳播＋失敗整張重來」三段流程，要理解 List<int>[] 候選集合與 RemoveAll 內的巢狀 lambda；沒有回溯與空間索引，所以停在中階。",
   "tags": [
    "約束滿足",
    "拼貼",
    "隨機",
    "可重現種子",
    "鄰居搜尋",
    "網格擴散",
    "自訂 class"
   ],
   "one_liner": "先定好「哪些模組可以相鄰」的規則，再讓電腦從最沒得選的格子開始一格一格決定，並把限制傳給鄰居，直到整張網格都拼得起來。",
   "how_it_works": [
    "建立 tile 清單：每個水管 tile 用北東南西四個 0/1 表示哪邊有開口（共 12 種，不含只開一邊的死路）",
    "每格一開始把所有 tile 都當成候選；邊界格先刪掉開口朝外的 tile，並傳播一次",
    "找候選數最少（但還大於 1）的格子，同分隨機挑一格，從它的候選中隨機決定一個 tile（塌縮）",
    "傳播：用 Stack 記錄有變動的格子，逐一通知四個鄰居，鄰居刪掉「跟這格任何候選都接不起來」的 tile；鄰居有刪東西就再推進 Stack",
    "若某格候選變 0 就是矛盾，整張重來（最多 20 次）；全部格子只剩一個候選就完成，輸出每格中心到開口邊中點的線段"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 width, height, cellSize, seed",
    "    輸出 pipes, tileNumbers",
    "",
    "    // 0. 防呆",
    "    格數或 cellSize 不合理 → 結束",
    "    格數最多 40",
    "",
    "    // 1. DATA 資料",
    "    tile 清單（12 種水管）",
    "",
    "    // 2. INIT 初始",
    "    隨機數（seed）",
    "",
    "    // 3. LOOP 迭代：失敗就重來",
    "    最多試 MaxAttempts 次，解出來 → 停",
    "    全失敗 → 結束",
    "",
    "    // 4. OUTPUT 輸出",
    "    水管線段 → pipes",
    "    每格 tile 編號 → tileNumbers",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：格數上限 40、MaxAttempts 20、四個方向",
    "  TrySolve：挑最確定的格子隨機定一個 → 傳播，直到全定；矛盾 → 失敗",
    "  Propagate：鄰居刪掉接不起來的 tile，一路傳下去",
    "  FindMostCertainCell：找可能性最少的格子",
    "  MakeTileSet：字串 → tile",
    "  OpensToOutside：開口朝外嗎",
    "  DrawPipes：格子中心連到開口",
    "",
    "// ----- Script_Instance 外面 -----",
    "PipeTile：北東南西開或關"
   ],
   "key_params": [
    {
     "name": "width / height",
     "effect": "格子數；越大越容易遇到矛盾、重來次數變多，上限被夾在 40"
    },
    {
     "name": "cellSize",
     "effect": "只影響輸出尺寸，不影響解的結構"
    },
    {
     "name": "seed",
     "effect": "決定挑格與挑 tile 的隨機序列；同 seed 同結果，換 seed 可跳過矛盾"
    },
    {
     "name": "tile 清單（MakeTileSet 內的字串）",
     "effect": "加減 tile 種類直接改變風格：拿掉十字就沒有四岔、只留直管與空白會變成長直線"
    },
    {
     "name": "MaxAttempts",
     "effect": "失敗重來次數上限；規則越嚴格需要越大"
    }
   ],
   "csharp_concepts": [
    "List<int>[]（每格一個候選清單）",
    "Stack<int>（待傳播佇列）",
    "RemoveAll 與 lambda",
    "LINQ Any / Select / Enumerable.Range",
    "static readonly 方向陣列",
    "自訂 class PipeTile",
    "System.Random 種子",
    "一維索引 ↔ row/column 換算"
   ],
   "prerequisites": [
    "迴圈與 List",
    "自訂 class",
    "lambda 基本寫法",
    "一維陣列表示二維網格（cell = row * width + column）"
   ],
   "teaching_note": "建議先讀懂再修改，不建議從零寫：先用紙上 3×3 格子手動玩一次「塌縮→傳播」，學習者會秒懂。實作時先只做塌縮不做傳播，讓學習者看到接不起來的結果，再補上 Propagate，對比很有學習效果；RemoveAll 內的巢狀 Any 是最大理解門檻，建議拆成具名方法 CanConnect() 講解。",
   "variations": [
    {
     "title": "換 tile 組：自訂圖樣規則",
     "level": 1,
     "what_changes": "規則",
     "how": "改 MakeTileSet 內的字串陣列，例如只留直管與彎管、或加入只開一邊的端點 tile；也可替每個 tile 加 weight 欄位，挑選時用加權隨機取代 random.Next。",
     "result": "同一套程式產生迷宮、電路板、長直線條、稀疏管線等不同風格的圖樣"
    },
    {
     "title": "邊的標籤從 0/1 改成多種接頭",
     "level": 2,
     "what_changes": "規則／狀態",
     "how": "把 bool[] Open 改成 int[] 或 string[] Socket（例如 0=無、1=細管、2=粗管、3=牆），相容判斷改成 Socket[side] == Socket[opposite]，或查一張相容表 Dictionary<(int,int),bool>。",
     "result": "可以表達「道路只能接道路、牆只能接牆」的多材質／多類型拼貼"
    },
    {
     "title": "tile 換成 Rhino 幾何模組",
     "level": 2,
     "what_changes": "輸出",
     "how": "新增 List<GeometryBase> modules 輸入（每個 tile 一個 Brep 或 Mesh），DrawPipes 改成把對應模組用 Transform.Translation 搬到格子中心；配合旋轉可從少量原型自動產生 4 個方向的 tile。",
     "result": "從線稿變成可渲染的平面鋪面、景觀鋪面或平面配置模組"
    },
    {
     "title": "2D → 3D 體素 WFC",
     "level": 4,
     "what_changes": "維度",
     "how": "方向陣列從 4 個擴成 6 個（加上 / 下），格子索引改成 x + y*W + z*W*H，tile 用 6 位元字串描述；Propagate 的迴圈 side < 6、opposite 改成查表。",
     "result": "產生可堆疊的 3D 模組化建築量體、樓梯、橋、屋頂組合"
    },
    {
     "title": "指定格子預先塌縮（設計者控制）",
     "level": 2,
     "what_changes": "約束",
     "how": "新增 List<Point3d> fixedPoints 與 List<int> fixedTiles 輸入，在 TrySolve 開頭把這些格子的候選直接設成單一 tile 並推入 changedCells 傳播。",
     "result": "設計者先放入口、中庭或主要動線，其餘由 WFC 自動補齊且保證接得起來"
    },
    {
     "title": "曲線邊界／不規則基地",
     "level": 3,
     "what_changes": "輸入／約束",
     "how": "新增 Curve boundary 輸入，用 Curve.Contains 判斷格子中心在不在基地內；在外面的格子強制只能放空 tile（0000），OpensToOutside 改成判斷鄰居是否在基地外。",
     "result": "管線、步道或房間配置自動貼合任意形狀的基地邊界"
    },
    {
     "title": "吸引子／影像控制 tile 機率",
     "level": 3,
     "what_changes": "輸入／規則",
     "how": "新增 Point3d attractor 或灰階影像輸入，依格子到吸引子的距離（或像素亮度）調整每種 tile 的權重，例如越近十字 tile 權重越高；挑 tile 時改用加權隨機。",
     "result": "密度有梯度的網路：中心密集交織、外圍稀疏，可對應都市密度或立面開口率"
    },
    {
     "title": "加入回溯取代整張重來",
     "level": 4,
     "what_changes": "迴圈",
     "how": "每次塌縮前把 possibleTiles 深拷貝推進 Stack<List<int>[]> history；遇到矛盾時 pop 回上一步，並把剛才選的 tile 從該格候選中刪掉再試。",
     "result": "大網格或嚴格規則下也能穩定求解，不再依賴換 seed"
    },
    {
     "title": "連通性約束：保證水管／動線是一整個網路",
     "level": 4,
     "what_changes": "約束",
     "how": "完成後用 BFS 從任一有開口格子出發計算連通元件數，若大於 1 就重來；進階版在塌縮過程中就檢查（參考 Bad North 的可通行啟發式、DeBroglie 的 path constraint）。",
     "result": "產出單一連通的管線、步道或走廊系統，可直接當動線圖使用"
    },
    {
     "title": "Timer 動畫：看見塌縮過程",
     "level": 2,
     "what_changes": "迴圈／輸出",
     "how": "把 possibleTiles 與 random 存成欄位，用 Timer 元件每次 tick 只做一次「挑格＋塌縮＋傳播」；未決定的格子依候選數畫成不同灰階或大小的圓。",
     "result": "看到網格從一片不確定逐步「塌縮」成確定圖樣，適合做簡報動畫"
    },
    {
     "title": "從範例學規則（範例驅動）",
     "level": 3,
     "what_changes": "規則",
     "how": "新增一個學習者手排的範例網格輸入（例如 List<int> exampleTiles），掃描範例中實際出現過的相鄰組合建成 allowed[tileA, tileB, side] 表，取代原本的 Open 比對。",
     "result": "設計者用「畫一小塊範例」代替寫規則，WFC 生成大面積但風格一致的配置"
    },
    {
     "title": "輸出轉成可製造管件／擠出實體",
     "level": 3,
     "what_changes": "輸出",
     "how": "把每條 Line 用 Pipe.CreatePipe 或 Brep.CreatePipe 轉成管狀實體，並在每格中心依 tile 類型放置彎頭、三通、十字接頭；最後統計每種接頭數量輸出料件表。",
     "result": "可 3D 列印或以標準管件組裝的管線裝置，附帶零件數量清單"
    }
   ],
   "project_seeds": [
    {
     "title": "WFC 地坪與鋪面產生器",
     "brief": "以 3–6 種鋪面模組（磚、草、步道、座椅）定義接頭規則，在曲線基地內生成鋪面配置，並用吸引子控制步道密度。輸出可直接排版成施工分割圖。",
     "difficulty": 2,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "模組化集合住宅量體",
     "brief": "把 A06 擴成 3D 體素 WFC，自訂單元、走廊、樓梯核、陽台、屋頂等模組與上下左右接頭，在基地包絡中生成集合住宅量體，並統計各單元數量與日照面。",
     "difficulty": 4,
     "combine_with": [
      "A04"
     ]
    },
    {
     "title": "範例驅動的平面配置",
     "brief": "學習者手繪一張小型平面範例（房間、走廊、門），程式自動學出相鄰規則，再生成大面積且風格一致的平面；加上連通性檢查保證每個房間都走得到。",
     "difficulty": 4,
     "combine_with": [
      "A04"
     ]
    },
    {
     "title": "不規則網格上的小鎮",
     "brief": "仿 Townscaper：先把平面切成不規則四邊形網格，再把 WFC 套到每個四邊形上，用雙線性映射把方形模組變形貼合；使用者點選格子升降高度即時重算。",
     "difficulty": 5,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "可組裝的管線裝置",
     "brief": "直接延伸基礎範例水管範例，把結果轉成管材＋接頭的實體模型並輸出料件表，以 Timer 動畫記錄生成過程，最後做 1:1 或縮尺實體裝置。",
     "difficulty": 3,
     "combine_with": []
    }
   ],
   "references": [
    {
     "title": "WaveFunctionCollapse（原始程式與說明）",
     "author": "Maxim Gumin",
     "year": "2016",
     "url": "https://github.com/mxgmn/WaveFunctionCollapse"
    },
    {
     "title": "Model Synthesis（博士論文）",
     "author": "Paul C. Merrell",
     "year": "2009",
     "url": "http://gamma-web.iacs.umd.edu/papers/documents/dissertations/merrell09.pdf"
    },
    {
     "title": "Texture Synthesis by Non-parametric Sampling",
     "author": "Alexei A. Efros, Thomas K. Leung",
     "year": "1999",
     "url": ""
    },
    {
     "title": "Consistency in Networks of Relations",
     "author": "Alan K. Mackworth",
     "year": "1977",
     "url": ""
    },
    {
     "title": "Wave Function Collapse Explained",
     "author": "Boris the Brave（Adam Newgas）",
     "year": "2020",
     "url": "https://www.boristhebrave.com/2020/04/13/wave-function-collapse-explained/"
    },
    {
     "title": "Tessera: A Practical System for Extended WaveFunctionCollapse",
     "author": "Adam Newgas",
     "year": "",
     "url": "https://www.boristhebrave.com/permanent/21/08/Tessera_A_Practical_System_for_WFC.pdf"
    },
    {
     "title": "Coding Challenge 171：Wave Function Collapse",
     "author": "The Coding Train（Daniel Shiffman）",
     "year": "",
     "url": "https://thecodingtrain.com/challenges/171-wave-function-collapse/"
    },
    {
     "title": "Monoceros 使用手冊",
     "author": "Ján Pernecký, Ján Tóth（Subdigital）",
     "year": "",
     "url": "https://www.monoceros.tools/monoceros-user-manual/"
    }
   ]
  },
  {
   "id": "B01",
   "name_zh": "差異生長",
   "name_en": "Differential Growth",
   "family": "B",
   "family_name": "生長",
   "file": "B01_DifferentialGrowth.cs",
   "loc": 157,
   "logic": [
    "迭代模擬"
   ],
   "data_structure": [
    "粒子",
    "圖（點＋連線）"
   ],
   "difficulty": 3,
   "difficulty_reason": "157 行、無自訂 class，但有 O(n²) 兩兩鄰居推開、List 中途插入點的索引處理，且五個力參數彼此牽制、需要反覆調參才會長出好看的皺褶。",
   "tags": [
    "開放生長",
    "鄰居搜尋",
    "物理模擬",
    "隨機",
    "可重現種子",
    "收斂"
   ],
   "one_liner": "一條封閉曲線上的點互相推擠、又被鄰居拉住，邊一拉長就插新點，於是曲線越長越皺，像珊瑚、腦紋或花瓣邊緣。",
   "how_it_works": [
    "在半徑 startRadius 的圓上依 maxEdgeLength 排一圈點，並加一點隨機擾動打破完美對稱。",
    "每一步先建立一個 moves 陣列，所有點兩兩比距離：小於 repelRadius 就依距離互相推開（規則 1）。",
    "每個點再往前後兩鄰居的中點靠（規則 2），讓曲線保持平滑連續。",
    "把累積的位移一次加回所有點（同步更新），避免先動的點影響後動的點。",
    "檢查每條邊，比 maxEdgeLength 長就在中點插入新點（規則 3），曲線總長因此持續增加，被迫在有限空間中摺皺。",
    "重複 steps 次或點數達 maxPoints 上限後，把點串成封閉 Polyline 輸出。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 steps, startRadius, maxEdgeLength, repelRadius, repelStrength, attractStrength, maxPoints, seed",
    "    輸出 curve, points",
    "",
    "    // 0. 防呆",
    "    startRadius、maxEdgeLength、repelRadius ≤ 0 → 結束",
    "    maxPoints 限 8～1500",
    "",
    "    // 1. DATA 資料",
    "    隨機數（seed）、曲線上的點清單",
    "",
    "    // 2. INIT 初始",
    "    圓周排點（每 maxEdgeLength 一點，至少 8 個），加小擾動",
    "",
    "    // 3. LOOP 迭代",
    "    重複 steps 次：",
    "      每個點的位移歸零",
    "      太近的點互相推開",
    "      每個點往前後鄰居的中點靠",
    "      全部點照位移動",
    "      邊太長 → 中間插新點",
    "",
    "    // 4. OUTPUT 輸出",
    "    點連成封閉線 → curve",
    "    點 → points",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：點數上限 1500",
    "  AddRepelMoves：repelRadius 內兩點互推，越近推越多",
    "  AddAttractMoves：往前後鄰居的中點拉，頭尾相接",
    "  InsertPoints：邊超過 maxEdgeLength → 插點，最多 maxPoints"
   ],
   "key_params": [
    {
     "name": "steps",
     "effect": "迭代次數；越多曲線越長、越皺，但點數到上限後只剩鬆弛不再長。"
    },
    {
     "name": "maxEdgeLength",
     "effect": "插點門檻；越小插點越頻繁，皺褶越細密、點數也越快爆掉。"
    },
    {
     "name": "repelRadius",
     "effect": "互斥範圍，決定皺褶之間的「走道寬度」；通常要大於 maxEdgeLength 才會長出蜿蜒形。"
    },
    {
     "name": "repelStrength",
     "effect": "推開力道；太大會抖動甚至交叉，太小則擠成一團。"
    },
    {
     "name": "attractStrength",
     "effect": "平滑力道；越大曲線越圓順、波長越大，越小越碎、越尖。"
    },
    {
     "name": "maxPoints",
     "effect": "點數上限（程式硬性限制 1500），因為推開是 O(n²)，是效能保險絲。"
    },
    {
     "name": "seed",
     "effect": "初始擾動的隨機種子；同樣參數換 seed 會長出不同但同質感的形。"
    }
   ],
   "csharp_concepts": [
    "List<Point3d>.Insert",
    "Vector3d[] 位移累加陣列",
    "巢狀 for 迴圈（first/second 不重複配對）",
    "取餘數 % 做頭尾相接",
    "SquareLength 省開根號",
    "Point3d 是 struct（取出、加、寫回）",
    "Polyline",
    "Random(seed)"
   ],
   "prerequisites": [
    "迴圈與 List",
    "向量加減與單位化",
    "封閉曲線的索引環繞",
    "理解「同步更新」與「就地更新」的差別"
   ],
   "teaching_note": "非常適合從零實作：三條規則各是一個短函式，可以一條一條加上去讓學習者看形態如何改變。要特別提醒插入點後 index++ 跳過新點、以及 O(n²) 讓點數超過一千就明顯變慢，順勢引出空間索引的必要。建議用 Timer 或 Anemone 做逐步動畫，學習者對「生長」的直覺會強很多。",
   "variations": [
    {
     "title": "空間索引加速",
     "level": 4,
     "what_changes": "迴圈（鄰居搜尋方式）",
     "how": "把 AddRepelMoves 的兩兩比較改成 RTree.Point3dClosestPoints 或自寫格子雜湊（Dictionary<(int,int),List<int>>，格子邊長 = repelRadius），只比同格與相鄰格的點。",
     "result": "同一台電腦可以跑到上萬點，長出細密如腦紋的大尺度圖樣。"
    },
    {
     "title": "吸引子控制生長速率",
     "level": 3,
     "what_changes": "規則（插點門檻隨空間改變）",
     "how": "新增 List<Point3d> attractors 輸入，InsertPoints 時用邊中點到最近吸引子的距離重新映射出該邊的 maxEdgeLength；靠近吸引子門檻小、長得快。",
     "result": "皺褶在指定區域特別密、遠處平緩，可做有焦點的立面或地坪圖樣。"
    },
    {
     "title": "影像控制密度",
     "level": 3,
     "what_changes": "輸入（影像取代常數參數）",
     "how": "讀入 Bitmap，依點的 XY 取像素亮度，映射成該點的 repelRadius 或生長機率；暗處走道窄、亮處走道寬。",
     "result": "曲線以迷宮般的單線重現照片明暗，類似 Pedersen & Singh 的有機迷宮。"
    },
    {
     "title": "邊界曲線約束",
     "level": 3,
     "what_changes": "約束（加入容器）",
     "how": "新增 Curve boundary 輸入，每步位移後用 boundary.Contains 檢查，跑出去的點以 ClosestPoint 拉回邊界內；也可把邊界本身當成一排固定的斥力點。",
     "result": "曲線填滿任意平面輪廓（基地、房間、雷切板），邊緣處自然貼齊。"
    },
    {
     "title": "開放曲線與多條曲線",
     "level": 2,
     "what_changes": "狀態（拓撲）",
     "how": "起點改成一條開放 Polyline：鄰居吸引時跳過頭尾兩點並把端點固定；或同時放多條曲線，推開時全部點一起比、吸引時各自算。",
     "result": "從一條直線長出蜿蜒河道，或多條曲線互相擠壓成分區圖樣。"
    },
    {
     "title": "曲面上生長",
     "level": 4,
     "what_changes": "維度（2D 平面 → 曲面上）",
     "how": "新增 Surface 或 Mesh 輸入，每步位移後以 surface.ClosestPoint / mesh.ClosestPoint 把點投影回曲面，並把推開距離改用 3D 距離計算。",
     "result": "在雙曲面、殼體或構件表面長出貼合的皺褶紋路，可轉成浮雕或溝槽。"
    },
    {
     "title": "3D 空間曲線",
     "level": 3,
     "what_changes": "維度（讓 z 也參與）",
     "how": "初始點的 z 也加隨機擾動，並加一點向上或向外的偏好力；推開與吸引程式碼不用改，因為本來就是 Vector3d。",
     "result": "曲線在空間中盤繞成類似腸子或線團的 3D 纏繞形，可做管件或燈具骨架。"
    },
    {
     "title": "3D 網格差異生長",
     "level": 5,
     "what_changes": "資料結構（曲線 → 三角網格）",
     "how": "把點列換成 Mesh（建議 Plankton 半邊結構），鄰居改為頂點拓撲鄰居，規則 3 改成「邊太長就 split edge」並處理翻邊與面法向。",
     "result": "平面圓盤長出荷葉邊、珊瑚、Floraform 花瓣般的波浪曲面。"
    },
    {
     "title": "動畫化逐步生長",
     "level": 3,
     "what_changes": "迴圈（改成跨幀保存狀態）",
     "how": "把 curvePoints 移到類別欄位，加 bool reset 輸入；每次 RunScript 只跑一步並由 Timer 或 Anemone 觸發，同時輸出每一代曲線形成 DataTree。",
     "result": "看得到曲線即時長大的過程，也能把各代疊起來做成等高線般的 3D 堆疊形。"
    },
    {
     "title": "生長時間轉高度（可製造）",
     "level": 2,
     "what_changes": "輸出（曲線 → 可切割、可列印幾何）",
     "how": "每隔 N 步記錄一次曲線並依步數給 z 高度做 Loft；或把最終曲線 Offset 成雙線後輸出給雷切或 CNC。",
     "result": "得到可直接雷切的迷宮板、或像地層般往上長的 3D 列印花器與燈罩。"
    },
    {
     "title": "混合噪聲場（C04）",
     "level": 3,
     "what_changes": "混合其他家族",
     "how": "用 C04 Noise 的 Perlin 值決定每條邊是否插點或每個點額外受到的切向力，讓生長速率有空間連續的變化。",
     "result": "形態出現大尺度的疏密起伏，比均勻隨機更自然、更像生物組織。"
    },
    {
     "title": "隨機插點與最長邊優先",
     "level": 2,
     "what_changes": "規則（插點策略）",
     "how": "InsertPoints 改成每步只隨機挑 k 條超長邊插點，或先排序後只切最長邊；也可只讓某段索引範圍的邊能生長。",
     "result": "前者更不對稱、有機；後者更規律；局部生長則出現單一方向的舌狀突出。"
    }
   ],
   "project_seeds": [
    {
     "title": "差異生長迷宮鋪面",
     "brief": "以基地邊界約束一條差異生長曲線，輸出成兩種材質交界的鋪面圖樣，並用吸引子讓入口處紋理最密。重點在參數調校與輸出成施工圖。",
     "difficulty": 2,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "雷切層疊珊瑚燈",
     "brief": "逐代記錄生長曲線，每一代轉成一片雷切板並依序堆疊，組成由內往外長的燈罩。需處理板間連接孔與材料厚度。",
     "difficulty": 3,
     "combine_with": []
    },
    {
     "title": "影像驅動的單線肖像牆",
     "brief": "讀入人物或地景照片，以亮度控制互斥半徑，長出一條不相交的單線，最後用筆式繪圖機或 CNC 刻線輸出成大幅牆面。",
     "difficulty": 3,
     "combine_with": [
      "C05"
     ]
    },
    {
     "title": "殼體表面的生長浮雕立面",
     "brief": "在自由曲面立面上做曲面投影的差異生長，把曲線轉成深淺不一的溝槽或凸肋，並加入空間索引讓點數可達數千，討論遮陽與陰影效果。",
     "difficulty": 4,
     "combine_with": [
      "C03"
     ]
    },
    {
     "title": "3D 網格生長珊瑚雕塑",
     "brief": "以半邊網格實作 3D 差異生長，研究邊緣生長快於中心時的荷葉邊形態，最後處理厚度與自交檢查後 3D 列印。需要閱讀 inconvergent 與 Nervous System 的技術說明。",
     "difficulty": 5,
     "combine_with": [
      "B03"
     ]
    }
   ],
   "references": [
    {
     "title": "differential-line: a generative algorithm",
     "author": "Anders Hoff (inconvergent)",
     "year": "",
     "url": "https://github.com/inconvergent/differential-line"
    },
    {
     "title": "On Generative Algorithms: Differential Mesh",
     "author": "Anders Hoff (inconvergent)",
     "year": "",
     "url": "https://inconvergent.net/generative/differential-mesh-3d/"
    },
    {
     "title": "Floraform – an exploration of differential growth",
     "author": "Nervous System (Jessica Rosenkrantz, Jesse Louis-Rosenberg)",
     "year": "2015",
     "url": "https://n-e-r-v-o-u-s.com/blog/?p=6721"
    },
    {
     "title": "Organic Labyrinths and Mazes",
     "author": "Hans Køhling Pedersen, Karan Singh",
     "year": "2006",
     "url": "https://www.dgp.toronto.edu/~karan/pdf/mazes.pdf"
    },
    {
     "title": "2d-differential-growth-experiments",
     "author": "Jason Webb",
     "year": "",
     "url": "https://github.com/jasonwebb/2d-differential-growth-experiments"
    },
    {
     "title": "morphogenesis-resources",
     "author": "Jason Webb",
     "year": "",
     "url": "https://github.com/jasonwebb/morphogenesis-resources"
    },
    {
     "title": "Cellular Forms: an Artistic Exploration of Morphogenesis",
     "author": "Andy Lomas",
     "year": "2014",
     "url": "https://dl.acm.org/doi/10.1145/2619195.2656282"
    }
   ]
  },
  {
   "id": "B02",
   "name_zh": "DLA 擴散限制聚集",
   "name_en": "Diffusion-Limited Aggregation",
   "family": "B",
   "family_name": "生長",
   "file": "B02_DLA.cs",
   "loc": 215,
   "logic": [
    "迭代模擬"
   ],
   "data_structure": [
    "粒子",
    "圖（點＋連線）"
   ],
   "difficulty": 3,
   "difficulty_reason": "主流程只是一個粒子迴圈加一個隨機走函式，但用了自訂 class NearbyPointFinder（格子雜湊空間索引）與 out 參數，且走丟重生、遠距加速步長需要理解才調得動參數。",
   "tags": [
    "隨機",
    "可重現種子",
    "鄰居搜尋",
    "空間索引",
    "開放生長",
    "分形",
    "自訂 class"
   ],
   "one_liner": "讓粒子一顆一顆隨機亂走，碰到群集就黏住，慢慢長出像珊瑚、閃電、礦物結晶一樣的樹枝狀結構。",
   "how_it_works": [
    "在原點放一顆種子點，當作群集的起點。",
    "每顆新粒子從比群集稍大的圓上出發，每一步往隨機方向走 stepSize；離群集越遠就走越大步以加速。",
    "走到群集附近時用格子空間索引找 stickDistance 內最近的已黏點，找到就黏住，並把位置對齊到剛好 stickDistance，讓枝段等長。",
    "走出逃逸圓就回到出發圓重來；超過 MaxWalkSteps 就停止整個模擬。",
    "每顆黏住的粒子記錄它黏在哪一顆上（stuckToIndex），最後輸出點與父子連線形成樹。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 particleCount, stickDistance, stepSize, seed",
    "    輸出 points, lines",
    "",
    "    // 0. 防呆",
    "    particleCount < 1 → 結束",
    "    stickDistance、stepSize ≤ 0 → 結束",
    "",
    "    // 1. DATA 資料",
    "    隨機數（seed）、黏住的點清單、每點黏在誰身上、群集半徑",
    "",
    "    // 2. INIT 初始",
    "    原點放一顆種子",
    "",
    "    // 3. LOOP 迭代",
    "    重複 particleCount 次：",
    "      丟給 WalkUntilStuck 亂走到黏住",
    "      走太久沒黏住 → 停",
    "      黏住的點加進清單，群集半徑更新",
    "",
    "    // 4. OUTPUT 輸出",
    "    黏住的點 → points",
    "    每點連到它黏住的點 → lines",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：一顆粒子最多走 10 萬步",
    "  WalkUntilStuck：圓上出發亂走，碰到就黏；走丟回圓上，走滿失敗",
    "  PointOnCircle：圓上隨機一點",
    "",
    "// ----- Script_Instance 外面 -----",
    "NearbyPointFinder：所有點、格子大小、每格有哪些點"
   ],
   "key_params": [
    {
     "name": "particleCount",
     "effect": "黏住的粒子總數；越多枝越密、群集越大，時間約隨數量超線性成長。"
    },
    {
     "name": "stickDistance",
     "effect": "黏住距離兼枝段長度，也是空間索引格子大小；越大越粗略、越快。"
    },
    {
     "name": "stepSize",
     "effect": "隨機走的步長；越大越快但枝會變粗鈍、較不細碎，太大會穿過細枝。"
    },
    {
     "name": "seed",
     "effect": "隨機種子；同一個 seed 永遠長出同一棵樹，換 seed 得到不同分枝。"
    }
   ],
   "csharp_concepts": [
    "自訂 class（NearbyPointFinder）",
    "Dictionary<long, List<int>> 格子雜湊",
    "out 參數",
    "Random 與種子",
    "List<Line> 輸出",
    "Math.Floor 取格子座標",
    "const 常數"
   ],
   "prerequisites": [
    "迴圈與函式",
    "Point3d／Vector3d 運算",
    "List 與 Dictionary",
    "極座標（cos、sin）"
   ],
   "teaching_note": "很適合從零實作：規則三句話講得完，改一行（出發位置、黏住條件）就能看到形態大變。建議先寫不含空間索引的暴力版（每步比對所有點）讓學習者感受變慢，再引入 NearbyPointFinder 說明空間索引的價值；注意 particleCount 先用 300 以內避免 GH 卡住。",
   "variations": [
    {
     "title": "黏著機率（stickiness）",
     "level": 2,
     "what_changes": "規則",
     "how": "在 FindNearest 找到後加 if (random.NextDouble() > stickiness) 就不黏、繼續走；新增輸入 stickiness（0.05–1）。",
     "result": "機率低時枝變粗、變密實像苔蘚；機率 1 時最細碎。"
    },
    {
     "title": "方向偏移（重力／風）",
     "level": 2,
     "what_changes": "狀態／迴圈",
     "how": "每一步的位移加上一個固定偏移向量 bias（例如 -Y 方向 0.2×stepSize），出發點改成從上方直線落下。",
     "result": "長出單向偏長的結構，像冰柱、鐘乳石或往光源生長的珊瑚。"
    },
    {
     "title": "線種子／邊界種子",
     "level": 2,
     "what_changes": "狀態（初始）",
     "how": "INIT 時不是只放原點，而是沿著一條輸入曲線 Curve.DivideByCount 放一排種子，粒子從曲線另一側出發。",
     "result": "從牆面或地面長出一排像森林或霜花的樹枝，適合立面或地坪圖樣。"
    },
    {
     "title": "2D → 3D 球殼出發",
     "level": 3,
     "what_changes": "維度",
     "how": "PointOnCircle 改成球面上隨機點，隨機方向改成單位球隨機向量；NearbyPointFinder 加 CellZ 並查 27 格。",
     "result": "得到立體珊瑚狀群集，可接管徑變厚做成燈具或雕塑。"
    },
    {
     "title": "曲面上的 DLA",
     "level": 4,
     "what_changes": "維度／輸入",
     "how": "粒子在 UV 參數空間走（Surface.PointAt(u,v) 求 3D 位置），距離用 3D 或測地近似判斷，邊界改成 UV 範圍。",
     "result": "樹枝紋貼附在任意曲面（屋頂、殼體）上，可做表皮開孔或雕刻紋路。"
    },
    {
     "title": "邊界約束（在形體內生長）",
     "level": 3,
     "what_changes": "加約束",
     "how": "每走一步檢查 Brep.IsPointInside 或 Curve.Contains，出界就退回上一步或重生；出發點改成邊界上的點往內走。",
     "result": "群集被限制在輸入的平面輪廓或量體內，長出填滿形體的枝狀結構。"
    },
    {
     "title": "吸引子控制黏著",
     "level": 3,
     "what_changes": "輸入",
     "how": "新增吸引子點清單，黏著機率 = f(到最近吸引子距離)；或讓隨機走帶有朝吸引子的漂移。",
     "result": "枝條往指定方向（入口、光源、支撐點）集中生長，形態可被設計者引導。"
    },
    {
     "title": "影像控制密度",
     "level": 3,
     "what_changes": "輸入",
     "how": "讀入灰階影像（System.Drawing.Bitmap.GetPixel），依粒子所在位置的亮度決定黏著機率或步長。",
     "result": "樹枝紋在暗部密、亮部疏，可生成類似照片的枝狀圖像。"
    },
    {
     "title": "多種子競爭",
     "level": 2,
     "what_changes": "狀態",
     "how": "INIT 放多顆種子並各自記錄所屬群組（List<int> groupOf），黏住時繼承被黏點的群組，輸出時依群組分 DataTree 分支上色。",
     "result": "多棵樹彼此搶空間，界線處形成空隙，類似細胞或行政區劃分。"
    },
    {
     "title": "輸出成可製造管材",
     "level": 3,
     "what_changes": "輸出",
     "how": "依每個點的子孫數（從葉往根累加）決定半徑，Line → Brep.CreatePipe 或輸出給 Dendro／Mesh Pipe；根部粗、枝梢細。",
     "result": "得到可 3D 列印的樹枝狀燈罩、支架或珠寶的實體網格。"
    },
    {
     "title": "動畫化逐步生長",
     "level": 2,
     "what_changes": "迴圈",
     "how": "把 stuckPoints 存為欄位，用 Timer 或 Iteration 每次只加 N 顆粒子並輸出目前結果。",
     "result": "可以看到群集像結晶一樣逐步長大的過程，適合簡報與影片。"
    },
    {
     "title": "混合 C 家族：場驅動 DLA（DBM）",
     "level": 4,
     "what_changes": "規則／混合其他家族",
     "how": "改用網格計算電位場（Laplace 疊代，類似 C01 擴散），黏著位置依電場強度的 η 次方機率選擇，即 Dielectric Breakdown Model。",
     "result": "用參數 η 在緻密團塊與閃電狀細枝之間連續切換，更可控。"
    }
   ],
   "project_seeds": [
    {
     "title": "樹枝狀地坪／立面圖樣產生器",
     "brief": "以基地邊界曲線為種子線，讓 DLA 從牆邊往內長，並用影像控制疏密，輸出可雷射切割的 2D 圖樣。重點在黏著機率與偏移的調參與圖面表現。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "3D DLA 燈具",
     "brief": "把 DLA 擴展到 3D，在球形或自訂量體內生長，依子孫數給管徑，輸出可 3D 列印的燈罩並做光影測試。",
     "difficulty": 3,
     "combine_with": [
      "B03"
     ]
    },
    {
     "title": "吸引子引導的枝狀結構亭",
     "brief": "以支撐點與出入口為吸引子引導 DLA 在量體內生長，後處理把細枝合併成可施作的構件並用 Kangaroo 做形態檢核。參考 IaaC MRAC DLA 研究的經驗，重點在可建造化。",
     "difficulty": 4,
     "combine_with": [
      "D01"
     ]
    },
    {
     "title": "DLA 都市擴張模擬",
     "brief": "以既有市中心與道路為種子，模擬人口（粒子）聚集，比較不同黏著機率下的碎形維度與密度梯度，對照 Batty 的 Fractal Cities 研究。",
     "difficulty": 3,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "曲面上的閃電紋表皮",
     "brief": "在自由曲面的 UV 空間實作 Dielectric Breakdown Model，產生可控的放電紋路並轉成表皮開孔或雕刻刀路。需處理參數空間扭曲與場的數值疊代。",
     "difficulty": 5,
     "combine_with": [
      "C01"
     ]
    }
   ],
   "references": [
    {
     "title": "Diffusion-Limited Aggregation, a Kinetic Critical Phenomenon",
     "author": "T. A. Witten, L. M. Sander",
     "year": "1981",
     "url": "https://link.aps.org/doi/10.1103/PhysRevLett.47.1400"
    },
    {
     "title": "DLA - Diffusion Limited Aggregation",
     "author": "Paul Bourke",
     "year": "",
     "url": "https://paulbourke.net/fractals/dla/"
    },
    {
     "title": "Urban Growth and Form: Scaling, Fractal Geometry, and Diffusion-Limited Aggregation",
     "author": "M. Batty, P. Longley, S. Fotheringham",
     "year": "1989",
     "url": "https://discovery.ucl.ac.uk/10053169/"
    },
    {
     "title": "Simulating 2D diffusion-limited aggregation (DLA) with JavaScript",
     "author": "Jason Webb",
     "year": "2019",
     "url": "https://medium.com/@jason.webb/simulating-dla-in-js-f1914eb04b1d"
    },
    {
     "title": "Coding Challenge #34: Diffusion-Limited Aggregation",
     "author": "Daniel Shiffman（The Coding Train）",
     "year": "2016",
     "url": "https://thecodingtrain.com/challenges/34-diffusion-limited-aggregation/"
    },
    {
     "title": "Diffusion-limited aggregation（Wikipedia）",
     "author": "",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Diffusion-limited_aggregation"
    }
   ]
  },
  {
   "id": "B03",
   "name_zh": "空間殖民",
   "name_en": "Space Colonization",
   "family": "B",
   "family_name": "生長",
   "file": "B03_SpaceColonization.cs",
   "loc": 198,
   "logic": [
    "迭代模擬"
   ],
   "data_structure": [
    "粒子",
    "圖（點＋連線）"
   ],
   "difficulty": 3,
   "difficulty_reason": "約 200 行、一個自訂 class（TreeNode 用 ParentIndex 串成樹），每步要做「吸引點 × 枝端」的暴力最近鄰搜尋，並需要調 influenceRadius／killDistance／segmentLength 三者比例才長得好；尚未用空間索引，所以停在中階。",
   "tags": [
    "開放生長",
    "鄰居搜尋",
    "吸引子控制",
    "隨機",
    "可重現種子",
    "自訂 class",
    "3D"
   ],
   "one_liner": "在空間裡撒一堆「養分點」，讓樹枝從根部一步步往最近的養分長過去、吃掉它們，最後長成填滿空間的分枝網路。",
   "how_it_works": [
    "準備吸引點（使用者輸入或在根部上方方塊內隨機撒點），樹一開始只有一個根節點。",
    "每一步：每個吸引點找離它最近的枝端；距離小於 killDistance 就把吸引點刪掉（被吃掉），小於 influenceRadius 就對那個枝端施加一個單位向量拉力。",
    "每個被拉的枝端把所有拉力加總後取單位方向，往該方向長出一段 segmentLength 的新節點，記住父節點索引。",
    "若這一步沒有任何枝端被拉（樹幹還沒進入影響範圍），就讓最新的枝端直接朝最近的吸引點長一段，當作「樹幹階段」。",
    "重複直到吸引點用完、長不動或達到 maxSteps，最後把每個節點與其父節點連成線段輸出。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 attractors, rootPoint, attractorCount, boxSize, influenceRadius, killDistance, segmentLength, maxSteps, seed",
    "    輸出 branches, remainingAttractors",
    "",
    "    // 0. 防呆",
    "    influenceRadius、killDistance、segmentLength ≤ 0 → 結束",
    "",
    "    // 1. DATA 資料",
    "    attractors 沒接 → 隨機撒 attractorCount 個（boxSize、seed）",
    "    樹節點清單",
    "",
    "    // 2. INIT 初始",
    "    rootPoint 當第一個節點",
    "",
    "    // 3. LOOP 迭代",
    "    重複 maxSteps 次：",
    "      吸引點吃光 → 停",
    "      丟給 GrowOneStep 長一步",
    "      長不出來 → 停",
    "",
    "    // 4. OUTPUT 輸出",
    "    每個節點連回母節點 → branches",
    "    剩下的吸引點 → remainingAttractors",
    "",
    "  // ----- RunScript 下方 -----",
    "  GrowOneStep：吸引點拉最近枝端，太近就吃掉；被拉的枝端往平均方向長一節",
    "  NearestNode：找最近的枝端",
    "  RandomPointsAboveRoot：根部上方方塊內隨機撒點",
    "",
    "// ----- Script_Instance 外面 -----",
    "TreeNode：位置、母節點編號"
   ],
   "key_params": [
    {
     "name": "influenceRadius",
     "effect": "吸引點能拉多遠的枝端；越大枝條越早分叉、越直，太小則要靠樹幹階段慢慢爬過去"
    },
    {
     "name": "killDistance",
     "effect": "枝端多近就吃掉吸引點；越大枝越稀疏、末梢越粗略，越小越細密但步數大增"
    },
    {
     "name": "segmentLength",
     "effect": "每步生長長度；需小於 killDistance，否則枝端會跳過吸引點而來回抖動"
    },
    {
     "name": "attractorCount / boxSize",
     "effect": "決定樹冠的密度與包絡形狀；點越多分枝越細碎，換成任意點雲就能控制樹冠形"
    },
    {
     "name": "maxSteps",
     "effect": "生長上限；可用來做生長動畫或提早截斷得到「幼苗」狀態"
    },
    {
     "name": "seed",
     "effect": "隨機吸引點的種子；同一種子必得同一棵樹，方便比較參數"
    }
   ],
   "csharp_concepts": [
    "自訂 class（TreeNode）",
    "List<T> 與以索引表示父子關係",
    "Vector3d 加總與單位化",
    "out 參數",
    "倒序迴圈 + RemoveAt",
    "LINQ OrderBy().First()",
    "System.Random 種子"
   ],
   "prerequisites": [
    "迴圈與 List",
    "自訂 class",
    "向量加法與單位化",
    "距離平方比較（省開根號）"
   ],
   "teaching_note": "很適合從零實作：規則只有三條、畫面回饋強，學習者改吸引點分布就立刻看到不同樹形。要特別講清楚「只讓這一步開始前就存在的枝端生長」（nodeCount 快照）與倒序 RemoveAt 的原因；並提醒 segmentLength < killDistance < influenceRadius 的比例關係，否則會無限抖動或長不出來。",
   "variations": [
    {
     "title": "吸引點改用曲面／Brep 內部取樣",
     "level": 2,
     "what_changes": "輸入",
     "how": "上游用 Populate Geometry 在任意 Brep、球體或建築量體內撒點接到 attractors，程式碼不用改；也可用 Surface 取樣做成貼在立面上的吸引點。",
     "result": "樹冠／網路會精準填滿指定的形體，例如長成雲朵狀樹冠或貼著立面的藤蔓。"
    },
    {
     "title": "多根部同時生長（葉脈／根系網路）",
     "level": 2,
     "what_changes": "狀態",
     "how": "把 rootPoint 改成 List<Point3d>，INIT 時每個根都 Add 一個 ParentIndex = -1 的 TreeNode；輸出迴圈要略過 ParentIndex < 0 的節點。",
     "result": "多棵樹互相搶吸引點，形成邊界分明的競爭式分枝，像葉脈從葉柄與葉緣同時長或多個樹根搶地盤。"
    },
    {
     "title": "向性（Tropism）：加重力或光照偏向",
     "level": 2,
     "what_changes": "規則",
     "how": "在規則 2 算出 direction 後加一個常數向量，例如 direction += tropismVector * tropismWeight 再單位化；新增 tropismVector 與 tropismWeight 兩個輸入。",
     "result": "枝條整體往上（向光）、往下（垂柳）或往某一方向（受風）偏，形體更有方向性。"
    },
    {
     "title": "依管道流量算枝粗（Pipe Model / Murray 定律）",
     "level": 3,
     "what_changes": "輸出",
     "how": "生長結束後從葉端往根部倒推：每個節點的半徑 r^n = 子節點半徑 r^n 總和（n 約 2–3），末梢給最小半徑；再用 Pipe 或 MultiPipe 依每段半徑成管。",
     "result": "由細末梢逐漸合流成粗主幹的可 3D 列印分枝實體，接近真實樹木或血管的粗細分布。"
    },
    {
     "title": "RTree／網格空間索引加速",
     "level": 4,
     "what_changes": "迴圈",
     "how": "把 NearestNode 的暴力搜尋換成 Rhino.Geometry.RTree 或自製均勻網格（Dictionary<(int,int,int), List<int>>），每步只查鄰近格子；新節點加入時同步插入索引。",
     "result": "吸引點可從數百提升到數萬，長出細密的葉脈或整片樹林而不卡頓。"
    },
    {
     "title": "開放式 → 封閉式葉脈（產生迴圈）",
     "level": 4,
     "what_changes": "規則",
     "how": "依 Runions 2005 的封閉模型：吸引點不在第一個枝端碰到時就刪除，而是要等所有「朝它生長」的枝端都抵達才刪；允許多個枝端同時被同一個吸引點拉，並把相遇的枝端連起來。",
     "result": "網路從樹狀變成有環路的網狀，類似雙子葉植物的網狀葉脈或冗餘的管線網路。"
    },
    {
     "title": "生長在曲面上",
     "level": 3,
     "what_changes": "維度",
     "how": "吸引點用曲面 UV 取樣產生；每次長出新點後以 surface.ClosestPoint 拉回曲面，或直接在 UV 平面上生長再用 PointAt 映射回 3D。",
     "result": "在圓頂、雙曲面或立面上長出貼附的葉脈紋理，可作為表皮開孔或肋骨圖樣。"
    },
    {
     "title": "影像控制吸引點密度",
     "level": 3,
     "what_changes": "輸入",
     "how": "讀入灰階圖（System.Drawing.Bitmap），在範圍內隨機撒點時以像素亮度當接受機率（亮度越高越容易留下），再把點轉成 attractors。",
     "result": "枝網在亮處密、暗處疏，可做出以照片為底的分枝線畫或依日照分析決定開孔疏密的立面。"
    },
    {
     "title": "障礙物與邊界約束",
     "level": 3,
     "what_changes": "約束",
     "how": "新增 obstacles（Brep 或封閉曲線）輸入，長出新節點前用 IsPointInside 或 Contains 檢查，若在障礙內就不加入；邊界外的吸引點一開始就過濾掉。",
     "result": "樹枝會繞開量體、開口或既有結構生長，適合做避開窗洞的立面藤蔓或繞開柱子的管線。"
    },
    {
     "title": "反向生長：由上往下的樹狀柱／支撐",
     "level": 3,
     "what_changes": "規則",
     "how": "把屋頂或懸挑下緣的支撐點當吸引點、把地面柱腳當根，killDistance 設小讓每個支撐點都被精準碰到；再以 Pipe 模型算粗細並簡化成直線段。",
     "result": "得到從柱腳分叉、撐住多個屋頂點的樹狀柱，也可類比 3D 列印的樹狀支撐。"
    },
    {
     "title": "Timer 動畫化與逐步輸出",
     "level": 2,
     "what_changes": "迴圈",
     "how": "把 treeNodes 與 targetPoints 存成 class 層級欄位，加 reset 輸入；每次元件被 Timer 觸發只呼叫一次 GrowOneStep 並輸出目前線段。",
     "result": "可以在 Rhino 視窗即時看樹從根部慢慢長出、吸引點一顆顆消失，適合做展示或錄影。"
    },
    {
     "title": "與其他家族混合：吸引點來自 Noise／Phyllotaxis／DLA",
     "level": 3,
     "what_changes": "輸入",
     "how": "用 C04 Noise 的閾值點、B04 Phyllotaxis 的螺旋點或 E01 Circle Packing 的圓心當 attractors；或反過來把本元件輸出的枝網當 B01 Differential Growth 的起始曲線。",
     "result": "分枝同時帶有另一個演算法的秩序（螺旋、群聚、均勻分布），產生混種形態。"
    }
   ],
   "project_seeds": [
    {
     "title": "葉脈立面：依日照強度長出遮陽肋",
     "brief": "在立面曲面上依日照分析結果撒吸引點（曝曬高處密），用曲面上的空間殖民長出葉脈狀遮陽肋，最後轉成可雷射切割的板片。",
     "difficulty": 3,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "樹狀柱：大跨屋頂的分枝支撐",
     "brief": "以屋頂下緣的受力點為吸引點、地面柱腳為根，反向生長出分枝柱，依管道模型給每段斷面，再以 Karamba 或簡化的軸力檢查比較不同參數的用料。",
     "difficulty": 4,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "3D 列印分枝燈具",
     "brief": "仿 Nervous System Hyphae，在球體或蛋形量體內撒吸引點、多根部生長，依流量算粗細後成管，輸出可列印的 mesh 燈罩並研究光影。",
     "difficulty": 3,
     "combine_with": []
    },
    {
     "title": "校園步道網路生成",
     "brief": "以建築出入口與人流熱點為吸引點、捷運站或主入口為根，在基地邊界內生長出步道網，並加上障礙物約束與封閉式迴圈，比較與既有路網的差異。",
     "difficulty": 4,
     "combine_with": [
      "D03"
     ]
    },
    {
     "title": "即時生長樹林：多樹競爭與光照",
     "brief": "多個根部在共享的吸引點雲中競爭生長，加入向光性與 Timer 動畫，展示樹冠如何互相讓位，作為地景設計的樹冠配置研究。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "大規模血管式管線網（空間索引＋封閉模型）",
     "brief": "實作 RTree 或均勻網格加速到數萬吸引點，並改寫成 Runions 封閉式葉脈模型，生成可供建築設備管線或冷卻水路參考的冗餘網路。",
     "difficulty": 5,
     "combine_with": [
      "C01"
     ]
    }
   ],
   "references": [
    {
     "title": "Modeling and visualization of leaf venation patterns",
     "author": "Adam Runions, Martin Fuhrer, Brendan Lane, Pavol Federl, Anne-Gaëlle Rolland-Lagan, Przemyslaw Prusinkiewicz",
     "year": "2005",
     "url": "https://algorithmicbotany.org/papers/venation.sig2005.html"
    },
    {
     "title": "Modeling Trees with a Space Colonization Algorithm",
     "author": "Adam Runions, Brendan Lane, Przemyslaw Prusinkiewicz",
     "year": "2007",
     "url": "https://algorithmicbotany.org/papers/colonization.egwnp2007.pdf"
    },
    {
     "title": "Modeling Biological Patterns using the Space Colonization Algorithm（碩士論文）",
     "author": "Adam Runions",
     "year": "2008",
     "url": "https://algorithmicbotany.org/papers/runionsa.th2008.html"
    },
    {
     "title": "Modeling organic branching structures with the space colonization algorithm and JavaScript",
     "author": "Jason Webb",
     "year": "",
     "url": "https://medium.com/@jason.webb/modeling-organic-branching-structures-with-the-space-colonization-algorithm-and-javascript-6f683b743dc5"
    },
    {
     "title": "morphogenesis-resources（數位形態生成資源整理）",
     "author": "Jason Webb",
     "year": "",
     "url": "https://github.com/jasonwebb/morphogenesis-resources"
    },
    {
     "title": "Coding Challenge #17: Fractal Trees - Space Colonization",
     "author": "Daniel Shiffman（The Coding Train）",
     "year": "",
     "url": "https://www.youtube.com/watch?v=kKT0v3qhIQY"
    }
   ]
  },
  {
   "id": "B04",
   "name_zh": "葉序",
   "name_en": "Phyllotaxis",
   "family": "B",
   "family_name": "生長",
   "file": "B04_Phyllotaxis.cs",
   "loc": 87,
   "logic": [
    "直接公式"
   ],
   "data_structure": [
    "粒子",
    "幾何"
   ],
   "difficulty": 1,
   "difficulty_reason": "全檔 87 行、只有一個 for 迴圈加一個 PointAt 公式函式，沒有自訂 class、沒有狀態與迭代，每個點只看自己的編號就能算出位置。",
   "tags": [
    "對稱",
    "動畫",
    "吸引子控制",
    "曲面上",
    "3D"
   ],
   "one_liner": "把第 n 個點轉 n × 137.5°、推到 √n 的距離，就長出向日葵般均勻又不重複的螺旋點陣。",
   "how_it_works": [
    "給每個點一個編號 number = 1…count。",
    "角度 = number × angle（預設黃金角 137.508°），轉成弧度。",
    "半徑 = spacing × √number；開根號讓每一圈的面積相同，點的密度因此均勻（Vogel 1979 的 Fermat 螺旋）。",
    "用極座標 (cos, sin) × 半徑得到 Point3d，並依編號由內到外放大圓的半徑作為視覺輸出。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 count, spacing, angle",
    "    輸出 points, circles",
    "",
    "    // 0. 防呆",
    "    count < 1 或 spacing ≤ 0 → 結束",
    "    angle 沒接 → 用黃金角",
    "",
    "    // 1. DATA 資料",
    "    點清單、圓清單",
    "    angle 度 → 弧度",
    "",
    "    // 4. OUTPUT 輸出",
    "    對編號 1～count 的每個點：",
    "      丟給 PointAt 算位置",
    "      以該點為圓心畫圓，越外圈越大（0.1～0.5 倍 spacing）",
    "    點 → points",
    "    圓 → circles",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：黃金角 137.508",
    "  PointAt：編號 → 位置，轉 編號 × angle，離中心 spacing × √編號"
   ],
   "key_params": [
    {
     "name": "count",
     "effect": "點的數量；越多圓盤越大，外圈會自然浮現 Fibonacci 數（21、34、55…）條的左右螺旋。"
    },
    {
     "name": "spacing",
     "effect": "整體縮放比例；決定相鄰點的距離與圓盤總半徑（≈ spacing × √count）。"
    },
    {
     "name": "angle",
     "effect": "發散角；137.508° 最均勻，偏離 0.1° 就會出現明顯的放射狀『輻條』，整數分之一的角度（如 90°、120°）會排成直線。"
    }
   ],
   "csharp_concepts": [
    "for 迴圈",
    "List<Point3d>",
    "List<Circle>",
    "自訂方法回傳 Point3d",
    "const 常數",
    "Math.Sqrt / Math.Cos / Math.Sin",
    "RhinoMath.ToRadians"
   ],
   "prerequisites": [
    "迴圈與方法",
    "極座標（角度＋半徑 → x, y）",
    "度與弧度換算"
   ],
   "teaching_note": "非常適合從零實作，10 分鐘內可完成並立刻看到結果。建議讓學習者拖動 angle 滑桿從 137.0 到 138.0，親眼看到黃金角為何特別；再把 √number 改成 number，對比密度不均的阿基米德螺旋。注意 angle 輸入為 0 時程式會自動改用黃金角，示範時要說明這個防呆。",
   "variations": [
    {
     "title": "發散角掃描與有理角對照",
     "level": 1,
     "what_changes": "規則（發散角）",
     "how": "把 angle 接到 0–360 的滑桿或 Gene Pool，並另外輸入 360 × p/q（如 360×3/8）的有理角做比較。",
     "result": "黃金角得到最均勻的點陣；有理角得到 q 條直線輻條；略偏黃金角則出現旋轉的螺旋臂。"
    },
    {
     "title": "改變半徑函數（Fermat → 阿基米德／指數）",
     "level": 1,
     "what_changes": "規則（半徑公式）",
     "how": "PointAt 中的 spacing × Math.Sqrt(number) 改為 spacing × number 或 spacing × Math.Pow(number, k)，把 k 做成輸入。",
     "result": "k = 0.5 為均勻圓盤；k = 1 外圈稀疏、中心密集；k < 0.5 則外圈擠壓，可做密度漸層圖樣。"
    },
    {
     "title": "圓柱葉序（鳳梨／棕櫚幹）",
     "level": 2,
     "what_changes": "維度（2D → 3D 圓柱）",
     "how": "半徑固定為 R，改用 z = number × pitch 往上長：new Point3d(R·cos(turn), R·sin(turn), number·pitch)。",
     "result": "沿柱身盤旋的點陣，可直接作為塔樓立面開口、柱體鑲板或 3D 列印燈罩的孔位。"
    },
    {
     "title": "Fibonacci Sphere 球面均佈",
     "level": 2,
     "what_changes": "維度（平面 → 球面）",
     "how": "緯度改用 z = 1 − 2(number − 0.5)/count、r = √(1 − z²)，經度仍用 number × 黃金角；乘上球半徑。",
     "result": "在球面上近乎等距的點，可用來做圓頂分割、球形燈具孔位或日照取樣點。"
    },
    {
     "title": "貼到任意曲面（UV 映射）",
     "level": 3,
     "what_changes": "輸出（映射到 Surface／Brep）",
     "how": "把點的 (x, y) 正規化到 0–1 當作 UV，呼叫 surface.PointAt(u, v) 與 surface.NormalAt 取得曲面上的位置與法向。",
     "result": "葉序點陣包覆在自由曲面屋頂或立面上，法向可用來長出鱗片或遮陽鰭片。"
    },
    {
     "title": "吸引子控制元件大小",
     "level": 2,
     "what_changes": "輸入（吸引子點／曲線）",
     "how": "新增 attractor 輸入，每個點的圓半徑改為依 point.DistanceTo(attractor) 重新映射（Remap）到 min–max。",
     "result": "開孔或鱗片在吸引子附近變大或變小，形成有焦點的穿孔立面。"
    },
    {
     "title": "影像灰階控制密度／大小",
     "level": 3,
     "what_changes": "輸入（影像）",
     "how": "讀入 Bitmap，把每個點的 (x, y) 對應到像素，用 GetPixel 的亮度決定圓的半徑或是否保留該點。",
     "result": "由葉序點陣構成的半色調（halftone）圖像，可做穿孔金屬板上的圖案。"
    },
    {
     "title": "曲線邊界裁切與填滿",
     "level": 2,
     "what_changes": "加約束（邊界）",
     "how": "新增 Curve boundary 輸入，用 boundary.Contains(point) 只保留在封閉曲線內的點，count 加大到覆蓋整個邊界。",
     "result": "在任意平面形狀（基地、樓板、面板外框）內均勻散佈的點，不會出現規則網格的方向感。"
    },
    {
     "title": "Voronoi／Delaunay 化為鑲板",
     "level": 2,
     "what_changes": "混合其他家族（幾何分割）",
     "how": "把 points 輸出接到 Grasshopper 的 Voronoi 或 Delaunay 元件，或在 C# 中呼叫 Rhino.Geometry 的網格工具。",
     "result": "向日葵式的蜂巢鑲板，每片面積接近，可直接拆成雷射切割片或屋頂格柵。"
    },
    {
     "title": "螺旋連線（parastichy）結構",
     "level": 3,
     "what_changes": "輸出（點 → 線／圖）",
     "how": "每個點 i 連到 i + F（F 為 Fibonacci 數，如 21、34），分別畫出順時針與逆時針兩組 Polyline。",
     "result": "兩組交錯螺旋線形成的放射 diagrid，可作為屋頂梁系統（類似 Eden Project The Core 的做法）。"
    },
    {
     "title": "Blooms 式的 3D 花苞與動畫",
     "level": 3,
     "what_changes": "維度＋動畫",
     "how": "在球面葉序上，每個點依編號伸出長度遞增的錐體或花瓣；加入 time 輸入，讓整體每幀旋轉 137.5° 並逐步放大。",
     "result": "類似 John Edmark 的 Blooms 雕塑，可輸出 3D 列印模型或 Grasshopper 動畫。"
    },
    {
     "title": "輸出成可製造的開孔板／鱗片",
     "level": 2,
     "what_changes": "輸出（可製造幾何）",
     "how": "把 circles 轉成 Curve 後以 Boundary Surfaces 與板材做布林差集，或在每點放置沿法向傾斜的矩形板片。",
     "result": "可送雷射切割或 CNC 的穿孔面板、可組裝的鱗片外皮。"
    }
   ],
   "project_seeds": [
    {
     "title": "葉序穿孔金屬立面",
     "brief": "以葉序點陣配合吸引子與影像灰階控制開孔大小，設計一面遮陽穿孔立面，並輸出雷射切割圖檔與日照透光率比較。",
     "difficulty": 2,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "向日葵式太陽能板／集熱場配置",
     "brief": "仿 MIT 的 heliostat 研究，在不規則基地邊界內用葉序配置太陽能板，評估互相遮蔭比例並與矩形網格配置比較。",
     "difficulty": 3,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "Fibonacci 圓頂分割與構件化",
     "brief": "用 Fibonacci Sphere 在半球上產生節點，再以 Delaunay 連成三角網格，統計桿件長度種類，做一座可組裝的小型亭子。",
     "difficulty": 4,
     "combine_with": [
      "C05"
     ]
    },
    {
     "title": "葉序塔樓：旋轉樓板與陽台",
     "brief": "以圓柱葉序決定每層陽台或遮陽板的位置，比較不同發散角對日照與視野的影響，產出塔樓量體與立面。",
     "difficulty": 3,
     "combine_with": [
      "C03"
     ]
    },
    {
     "title": "頻閃動畫雕塑（Blooms 再詮釋）",
     "brief": "在球面或曲面上以葉序長出尺寸漸變的花瓣，做出 3D 列印模型並以轉台＋頻閃（或手機慢動作）呈現動畫效果。",
     "difficulty": 4,
     "combine_with": [
      "B01"
     ]
    },
    {
     "title": "曲面葉序＋鱗片自由曲面屋頂",
     "brief": "把葉序映射到自由曲面後，依曲率與日照角度調整每片鱗片的開合，並處理 UV 失真造成的密度不均（需要重新取樣或鬆弛）。",
     "difficulty": 5,
     "combine_with": [
      "E01",
      "D01"
     ]
    }
   ],
   "references": [
    {
     "title": "A better way to construct the sunflower head",
     "author": "Helmut Vogel",
     "year": "1979",
     "url": "https://www.sciencedirect.com/science/article/abs/pii/0025556479900804"
    },
    {
     "title": "The Algorithmic Beauty of Plants（第 4 章 Phyllotaxis）",
     "author": "Przemyslaw Prusinkiewicz, Aristid Lindenmayer",
     "year": "1990",
     "url": ""
    },
    {
     "title": "Phyllotaxis（Wikipedia）",
     "author": "",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Phyllotaxis"
    },
    {
     "title": "Golden angle（Wikipedia）",
     "author": "",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Golden_angle"
    },
    {
     "title": "Evenly distributing points on a sphere",
     "author": "Extreme Learning",
     "year": "",
     "url": "https://extremelearning.com.au/evenly-distributing-points-on-a-sphere/"
    },
    {
     "title": "Golden Angle",
     "author": "John Edmark",
     "year": "",
     "url": "http://www.johnedmark.com/phi"
    },
    {
     "title": "Sunflower Seed Arrangements（Wolfram Demonstrations Project）",
     "author": "",
     "year": "",
     "url": "https://demonstrations.wolfram.com/SunflowerSeedArrangements/"
    }
   ]
  },
  {
   "id": "B05",
   "name_zh": "Substrate 裂紋",
   "name_en": "Substrate (Tarbell Crack Growth)",
   "family": "B",
   "family_name": "生長",
   "file": "B05_Substrate.cs",
   "loc": 209,
   "logic": [
    "迭代模擬"
   ],
   "data_structure": [
    "網格",
    "幾何"
   ],
   "difficulty": 3,
   "difficulty_reason": "一個自訂 class（Crack）配二維 int 佔用格，邏輯清楚；但要處理倒序 RemoveAt、剛分岔時忽略母裂紋的例外（ParentId）、分岔前的前方檢查，除錯需要理解格子與裂紋編號的對應。",
   "tags": [
    "隨機",
    "可重現種子",
    "開放生長",
    "網格擴散",
    "自訂 class",
    "動畫"
   ],
   "one_liner": "裂紋直直往前走，撞到別的裂紋或邊界就停，再從既有裂紋上垂直分岔出新裂紋，長出像都市街道或乾裂泥地的分割圖樣。",
   "how_it_works": [
    "把正方形範圍切成 400×400 的佔用格，每格記錄被哪條裂紋佔用（-1 表示空）。",
    "隨機放 3 條起始裂紋，各有起點與方向。",
    "每一輪讓所有還在走的裂紋前進半格，走過的空格記上自己的編號。",
    "撞到邊界或別的裂紋（剛分岔時的母裂紋除外）就停下，從清單移除。",
    "每停一條，就隨機挑一條已存在的裂紋，在其上隨機一點以垂直方向（±5 度抖動）分岔出最多 2 條新裂紋，直到總數達 crackCount。",
    "最後把每條裂紋從起點到終點輸出成 Line。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 size, crackCount, seed",
    "    輸出 lines",
    "",
    "    // 0. 防呆",
    "    size ≤ 0 或 crackCount < 1 → 結束",
    "",
    "    // 1. DATA 資料",
    "    隨機數（seed）、裂紋清單、還在走的裂紋清單",
    "    400 × 400 格，記誰佔用",
    "",
    "    // 2. INIT 初始",
    "    格子全設為空",
    "    隨機放 3 條起始裂紋",
    "",
    "    // 3. LOOP 迭代",
    "    重複，直到沒裂紋在走或滿 MaxRounds 輪：",
    "      每條走中的裂紋丟給 MoveOneStep",
    "      撞到 → 停，BranchFrom 分岔（總數 ≤ crackCount）",
    "",
    "    // 4. OUTPUT 輸出",
    "    每條有走過的裂紋，起點連終點 → lines",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：格數 400 × 400、起始裂紋 3 條、最多 10 萬輪",
    "  MoveOneStep：往前半格，出界或碰到別條 → 撞到",
    "  BranchFrom：從隨機裂紋上一點垂直分岔（偏 ±5 度）",
    "  IsClearAhead：前方 2 格是空的嗎",
    "  RotateFlat：平面向量轉角度",
    "",
    "// ----- Script_Instance 外面 -----",
    "Crack：起點、位置、方向、母裂紋"
   ],
   "key_params": [
    {
     "name": "size",
     "effect": "正方形範圍邊長；格子數固定 400，所以 size 越大每格越粗。"
    },
    {
     "name": "crackCount",
     "effect": "裂紋總數上限；越多分割越細碎，接近街廓或泥裂的尺度。"
    },
    {
     "name": "seed",
     "effect": "隨機種子，控制起始裂紋與分岔位置，可重現。"
    },
    {
     "name": "GridResolution（常數）",
     "effect": "佔用格解析度；越高碰撞越精準、越不會穿越，但記憶體與時間增加。"
    },
    {
     "name": "wobble ±5 度（程式內）",
     "effect": "分岔方向的抖動量；設 0 得到正交格狀，放大則趨向有機裂紋。"
    }
   ],
   "csharp_concepts": [
    "自訂 class（Crack）與參考型別",
    "int[,] 二維陣列",
    "List 倒序 RemoveAt",
    "while 迴圈與安全上限",
    "Random 與種子",
    "向量旋轉（2D 旋轉矩陣）",
    "RhinoMath.ToRadians"
   ],
   "prerequisites": [
    "迴圈與陣列",
    "Vector3d 與垂直向量",
    "class 與 List 參考行為"
   ],
   "teaching_note": "適合從零實作，規則直觀、畫面有力。建議先寫不分岔版本（只有起始裂紋互撞）再加入分岔，讓學習者看到分岔規則才是複雜度來源；要特別講解為何剛分岔時要忽略母裂紋，否則新裂紋一出生就撞到。可延伸討論與 Voronoi 分割在形態上的差異（T 字接頭 vs Y 字接頭）。",
   "variations": [
    {
     "title": "角度規則：正交／任意角",
     "level": 1,
     "what_changes": "規則",
     "how": "把 wobble 範圍改成輸入參數；0 度得到正交格，加入 random 選 60°/120° 可得三角格，±30° 則趨向有機。",
     "result": "從曼哈頓網格到舊城巷弄、到自然泥裂的連續光譜。"
    },
    {
     "title": "彎曲裂紋",
     "level": 2,
     "what_changes": "狀態",
     "how": "Crack 新增 curvature 欄位，每一步用 RotateFlat 把 Direction 轉一點點；輸出改存每步位置成 Polyline。",
     "result": "裂紋變成弧線，類似陶瓷釉裂或有機街道。"
    },
    {
     "title": "曲線邊界",
     "level": 2,
     "what_changes": "輸入／加約束",
     "how": "新增輸入 boundary 曲線，MoveOneStep 的邊界判斷改成 boundary.Contains(nextPoint) != Inside 就停。",
     "result": "在任意基地輪廓內產生街廓或分割圖樣。"
    },
    {
     "title": "既有路網當初始裂紋",
     "level": 3,
     "what_changes": "輸入（初始）",
     "how": "INIT 時把輸入的線段逐點寫入 occupiedBy 並建立為已停止的 Crack，新裂紋只從它們分岔。",
     "result": "在既有道路之間自動長出次級巷道，接近都市填充式發展。"
    },
    {
     "title": "吸引子控制密度",
     "level": 3,
     "what_changes": "輸入",
     "how": "BranchFrom 選分岔位置時用拒絕抽樣：離吸引子越近接受機率越高。",
     "result": "靠近中心或景點的區域切得更碎，形成密度梯度（市中心小街廓、郊區大街廓）。"
    },
    {
     "title": "影像控制分岔",
     "level": 3,
     "what_changes": "輸入",
     "how": "讀灰階圖，分岔起點所在像素越暗越容易被接受，或亮度決定裂紋最大長度。",
     "result": "裂紋密度重現影像明暗，可做立面分割或圖像化鋪面。"
    },
    {
     "title": "輸出街廓多邊形",
     "level": 4,
     "what_changes": "輸出",
     "how": "把所有線段與邊界一起用 Curve.CreateBooleanRegions 或 Planar Graph 找封閉面，得到每個街廓／碎片的區域。",
     "result": "可進一步做街廓退縮、建物量體擠出或分色鋪面。"
    },
    {
     "title": "曲面上的裂紋",
     "level": 4,
     "what_changes": "維度",
     "how": "在曲面 UV 參數空間跑同樣演算法，輸出時用 Surface.PointAt 映射回 3D，佔用格改在 UV 上。",
     "result": "裂紋貼附於曲面殼體，可做 3D 表皮切割或雕刻紋路。"
    },
    {
     "title": "裂紋寬度與沙畫渲染",
     "level": 2,
     "what_changes": "輸出",
     "how": "依裂紋世代（ParentId 深度）決定線寬或偏移成雙線，並沿裂紋一側撒點（模仿 Tarbell 的 sand painter）。",
     "result": "得到有層級、有陰影質感的繪圖，更接近原作的視覺表現。"
    },
    {
     "title": "逐輪動畫",
     "level": 2,
     "what_changes": "迴圈",
     "how": "把 occupiedBy、allCracks、movingCracks 改成欄位，每次 RunScript 只跑 k 輪，用 Timer 驅動。",
     "result": "看到裂紋一條條延伸、分岔的過程，適合影片或互動展示。"
    },
    {
     "title": "混合 C05 Voronoi／Marching Squares 比較",
     "level": 3,
     "what_changes": "混合其他家族",
     "how": "同一基地同時生成 Voronoi 分割與 Substrate 分割，統計接頭形式（T 字 vs Y 字）與碎片面積分佈。",
     "result": "理解「依序生長」與「同時分割」兩種裂紋機制的形態差異。"
    },
    {
     "title": "輸出為雷射切割拼板",
     "level": 3,
     "what_changes": "輸出",
     "how": "取得封閉碎片後各自向內 Offset 留縫、加編號，排版到板材上輸出切割路徑。",
     "result": "製作碎裂感的拼貼牆面、桌面或鋪面。"
    }
   ],
   "project_seeds": [
    {
     "title": "裂紋式立面分割",
     "brief": "以立面輪廓為邊界、開窗需求為吸引子，用 Substrate 產生立面板材分割線，輸出板片清單與雷射切割圖。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "既有路網下的巷弄生成",
     "brief": "匯入真實都市路網作為初始裂紋，在街廓內長出次級巷道，比較不同角度規則下的街廓面積分佈，並擠出建築量體。",
     "difficulty": 3,
     "combine_with": [
      "A04"
     ]
    },
    {
     "title": "陶瓷釉裂紋路產生器",
     "brief": "結合彎曲裂紋與多世代線寬，在花瓶或碗的曲面上生成開片紋，輸出成可雕刻或釉下彩印的紋樣。",
     "difficulty": 4,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "泥裂 vs Voronoi：裂紋形態比較研究",
     "brief": "以 Substrate（依序、T 字接頭）與 Voronoi（同時、Y 字接頭）產生分割，搭配角度統計與碎片面積直方圖，對照真實乾裂泥土照片。",
     "difficulty": 3,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "曲面殼體裂紋開孔",
     "brief": "在自由曲面 UV 上跑 Substrate，把封閉碎片轉成開孔或分板，並以結構分析檢查開孔後殼體性能，屬研究級題目。",
     "difficulty": 5,
     "combine_with": []
    }
   ],
   "references": [
    {
     "title": "Substrate（Complexification.net）",
     "author": "Jared Tarbell",
     "year": "2003",
     "url": "http://www.complexification.net/gallery/machines/substrate/"
    },
    {
     "title": "Substrate (2003)（Procedural Generation 部落格介紹）",
     "author": "Isaac Karth",
     "year": "2015",
     "url": "https://procedural-generation.isaackarth.com/2015/07/21/substrate-2003-shortly-after-the-turn-of-the.html"
    },
    {
     "title": "Substrate (Tarbell Crack Growth) · morphogenesis-resources Issue #61",
     "author": "Jason Webb",
     "year": "",
     "url": "https://github.com/jasonwebb/morphogenesis-resources/issues/61"
    },
    {
     "title": "Procedural Modeling of Cities",
     "author": "Y. I. H. Parish, P. Müller",
     "year": "2001",
     "url": ""
    },
    {
     "title": "Generating Surface Crack Patterns",
     "author": "H. N. Iben, J. F. O'Brien",
     "year": "2006",
     "url": ""
    }
   ]
  },
  {
   "id": "C01",
   "name_zh": "反應擴散",
   "name_en": "Reaction-Diffusion (Gray-Scott)",
   "family": "C",
   "family_name": "場與擴散",
   "file": "C01_ReactionDiffusion.cs",
   "loc": 183,
   "logic": [
    "迭代模擬"
   ],
   "data_structure": [
    "網格"
   ],
   "difficulty": 2,
   "difficulty_reason": "約 180 行、沒有自訂 class，核心只是兩個 double[,] 陣列加三層巢狀迴圈與固定 3×3 鄰居加權；C# 基礎程度讀得懂，但 feed／kill 參數極敏感、要理解雙緩衝交換，比入門範例多一層概念。",
   "tags": [
    "網格擴散",
    "鄰居搜尋",
    "迭代模擬",
    "雙緩衝",
    "週期邊界",
    "參數敏感"
   ],
   "one_liner": "在一張方格紙上放兩種虛擬化學物質 A 與 B，讓它們互相吃、各自以不同速度擴散，幾千步後自己長出斑點、迷宮、指紋般的花紋。",
   "how_it_works": [
    "建立兩張 gridSize×gridSize 的濃度表：A 全部設為 1（原料），B 只在中央放一小塊 1（種子）。",
    "每一步對每一格計算反應量 A·B²（兩個 B 吃掉一個 A 變成 B）。",
    "用 3×3 卷積（上下左右 0.2、斜角 0.05、自己 −1）算出擴散量，A 擴散速度 1.0、B 只有 0.5。",
    "A 加上 feed·(1−A) 補充原料；B 扣掉 (kill+feed)·B 被移除；結果寫進 next 陣列並夾在 0–1 之間。",
    "整張算完後交換新舊陣列（雙緩衝），重複 steps 次；邊界左右、上下相接（像甜甜圈）。",
    "最後把 B 濃度輸出為點與數值，並用灰階頂點色建成 Mesh，B 越濃越黑。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 gridSize, feed, kill, steps, seedSize, cellSize, makeMesh",
    "    輸出 centerPoints, valuesB, coloredMesh",
    "",
    "    // 0. 防呆",
    "    gridSize < 10 → 改 10",
    "    cellSize ≤ 0 → 改 1",
    "    seedSize 限 1～gridSize",
    "",
    "    // 1. DATA 資料",
    "    A、B 兩張網格，再各備一張放下一步",
    "",
    "    // 2. INIT 初始",
    "    全部是 A",
    "    中央放一小塊 B（seedSize）",
    "",
    "    // 3. LOOP 迭代",
    "    重複 steps 次：",
    "      每格同時算下一步",
    "      A 擴散、被 B 吃掉、feed 補回",
    "      B 擴散、吃 A 長大、被 kill＋feed 移除",
    "      新舊網格交換",
    "",
    "    // 4. OUTPUT 輸出",
    "    每格中心點 → centerPoints",
    "    每格 B 濃度 → valuesB",
    "    makeMesh 才做：上色 Mesh → coloredMesh",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：DiffusionRateA 1.0、DiffusionRateB 0.5",
    "  DiffusionAmount：鄰居加權平均減自己，邊界左右上下相接",
    "  Clamp：限 0～1",
    "  BuildColoredMesh：格點連成 Mesh，B 越濃越黑"
   ],
   "key_params": [
    {
     "name": "feed",
     "effect": "A 的補充速度；和 kill 一起決定花紋類型，0.055/0.062 迷宮、0.035/0.065 斑點、0.030/0.057 細胞分裂"
    },
    {
     "name": "kill",
     "effect": "B 的移除速度；只要差 0.002 花紋就可能完全不同，或整片消失"
    },
    {
     "name": "steps",
     "effect": "模擬步數；太少只看到種子往外擴散的方塊，數千步後花紋才布滿整張網格"
    },
    {
     "name": "gridSize",
     "effect": "網格解析度；運算量是 gridSize² × steps，200 以上會明顯變慢"
    },
    {
     "name": "seedSize",
     "effect": "初始 B 種子大小；影響花紋從哪裡、以什麼形狀開始長"
    },
    {
     "name": "DiffusionRateA / DiffusionRateB",
     "effect": "程式內常數；兩者比值決定花紋尺度，B 相對越慢花紋越細"
    }
   ],
   "csharp_concepts": [
    "double[,] 二維陣列",
    "三層巢狀 for 迴圈",
    "雙緩衝交換（swap 參照）",
    "三元運算子處理週期邊界",
    "const 常數",
    "Mesh.Vertices / Faces / VertexColors",
    "LINQ Max()"
   ],
   "prerequisites": [
    "迴圈與陣列",
    "網格家族（C 家族）的鄰居概念",
    "Mesh 頂點與面的索引關係"
   ],
   "teaching_note": "很適合從零實作：規則只有兩行公式，改 feed／kill 立刻看到截然不同的圖，學習者會很有成就感。要特別講清楚為何需要 next 陣列（否則同一步內讀到已更新的值）以及參數極度敏感，建議先給 Karl Sims 或 Pearson 的參數圖讓學習者「查表」。範例一次跑完所有步數，gridSize 開太大會卡住 GH，建議 100 以內。",
   "variations": [
    {
     "title": "空間變化的 feed／kill（吸引子或影像控制）",
     "level": 2,
     "what_changes": "規則／輸入",
     "how": "把 feed、kill 從單一 double 改成每格一個值：新增 attractor 點或影像輸入，依距離或灰階在兩組參數間內插，迴圈中改讀 feedMap[row,column]。",
     "result": "同一張圖上斑點漸變成迷宮，可做由密到疏的立面開孔梯度。"
    },
    {
     "title": "各向異性擴散（有方向的花紋）",
     "level": 3,
     "what_changes": "規則",
     "how": "把 DiffusionAmount 的權重拆成水平與垂直兩組（例：左右 0.3、上下 0.1），或依一個向量場旋轉權重，讓擴散沿某方向較快。",
     "result": "條紋會順著指定方向排列，可對齊應力線、流線或視線方向。"
    },
    {
     "title": "隨機種子與多點起始",
     "level": 1,
     "what_changes": "狀態（初始條件）",
     "how": "INIT 階段改用 Random(seed) 撒 N 個小方塊，或讓使用者輸入一組 Point3d 作為種子位置。",
     "result": "花紋從多處同時長出、交會處形成接縫，構圖更自然且可重現。"
    },
    {
     "title": "遮罩邊界（任意平面輪廓）",
     "level": 2,
     "what_changes": "加約束",
     "how": "輸入一條封閉曲線，每格中心用 Curve.Contains 判斷；外部格子每步強制 B=0（或 A=1），並取消週期邊界。",
     "result": "花紋只長在樓板、立面或景觀邊界內，邊緣自然收邊。"
    },
    {
     "title": "Mesh 上的反應擴散（曲面上）",
     "level": 4,
     "what_changes": "維度（2D→曲面）",
     "how": "把 double[,] 換成每個頂點一個值的 double[]，用 mesh.TopologyVertices.ConnectedTopologyVertices 取鄰居，以鄰居平均減自己取代 3×3 卷積。",
     "result": "花紋直接長在花瓶、殼體或任意自由曲面上，沒有 UV 拉伸變形。"
    },
    {
     "title": "3D 體素反應擴散＋等值面",
     "level": 4,
     "what_changes": "維度（2D→3D）",
     "how": "陣列改成 double[,,]，鄰居改為 6 或 26 個；結果交給 Marching Cubes（可結合 C05 或 Chromodoris 類等值面工具）抽出 B=0.3 的等值面。",
     "result": "得到類似珊瑚、海綿的立體多孔實體，可 3D 列印。"
    },
    {
     "title": "等值線輸出（花紋→可切割曲線）",
     "level": 3,
     "what_changes": "輸出",
     "how": "把 valuesB 接到 C05 Marching Squares 或用 Mesh 等高線（Mesh.CreateContourCurves 需先把 B 當 Z 高度）取 B=0.25 的輪廓線。",
     "result": "得到封閉曲線，可直接雷射切割成開孔遮陽板或 CNC 雕刻路徑。"
    },
    {
     "title": "高度場浮雕／厚度調變",
     "level": 2,
     "what_changes": "輸出",
     "how": "建 Mesh 時把頂點 Z 設為 B × depth，或沿曲面法向量位移；再 Offset 成實體。",
     "result": "產生 Nervous System 式凹凸觸感表面，可做磁磚、燈罩的透光厚度變化。"
    },
    {
     "title": "動畫化（Timer 逐步顯示）",
     "level": 2,
     "what_changes": "迴圈",
     "how": "把 chemicalA／B 移到 class 欄位保存，每次 RunScript 只跑 stepsPerFrame 步，配合 Timer 或 reset 布林輸入重新初始化。",
     "result": "可以看到花紋從種子長出、分裂、填滿畫面的過程，適合教學與簡報錄影。"
    },
    {
     "title": "多尺度疊層（級聯）",
     "level": 3,
     "what_changes": "規則／混合",
     "how": "先用大尺度參數跑一次，把結果當作第二次模擬的 feed 地圖或初始值，再以小尺度參數跑一次。",
     "result": "產生花豹玫瑰斑、長頸鹿網紋那種「大花紋裡還有小花紋」的階層圖樣。"
    },
    {
     "title": "與 Voronoi／Circle Packing 混合",
     "level": 3,
     "what_changes": "混合其他家族",
     "how": "用 E01 Circle Packing 或 Voronoi 的圓心當作種子，或把 RD 結果當密度場來決定圓的大小。",
     "result": "有機斑點與幾何單元並存，可做分區清楚的鋪面或屋頂天窗配置。"
    },
    {
     "title": "改成其他反應模型（FitzHugh-Nagumo 等）",
     "level": 3,
     "what_changes": "規則",
     "how": "替換 reaction 那兩行公式為其他活化－抑制模型，允許負值並移除 Clamp，或加入第三種化學物質。",
     "result": "得到螺旋波、行進波等 Gray-Scott 沒有的動態圖樣。"
    }
   ],
   "project_seeds": [
    {
     "title": "反應擴散開孔遮陽立面",
     "brief": "以日照分析結果作為 feed／kill 地圖，讓 RD 花紋在日照強的區域變密、開孔變小；用等值線輸出雷射切割板並做 1:20 模型。",
     "difficulty": 3,
     "combine_with": [
      "C05"
     ]
    },
    {
     "title": "RD 浮雕陶瓷磚",
     "brief": "在方形網格上跑 RD，做成可四方連續拼接的高度場（利用範例本來的週期邊界），3D 列印模具後翻模成磁磚。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "沿主應力線的肋板樓板",
     "brief": "先用結構分析取得主應力方向，當作各向異性擴散的方向場，讓條紋自然順著應力線排列，再轉成肋板實體。",
     "difficulty": 5,
     "combine_with": [
      "C03"
     ]
    },
    {
     "title": "曲面殼體上的 RD 花紋亭",
     "brief": "把 RD 搬到自由曲面 Mesh 的頂點上，花紋轉成開孔或加厚區，產出小型亭子或燈具殼體。",
     "difficulty": 4,
     "combine_with": [
      "C05"
     ]
    },
    {
     "title": "3D 體素 RD 珊瑚家具",
     "brief": "把演算法升級成 3D 體素，抽取等值面做成多孔座椅或邊桌，比較不同參數的孔隙率與重量。",
     "difficulty": 4,
     "combine_with": [
      "C05",
      "C02"
     ]
    },
    {
     "title": "互動式 RD 地景鋪面",
     "brief": "以基地動線（人流吸引子）控制 kill 值，讓步道處花紋稀疏、停留處花紋密集，轉成植栽與鋪面分區圖。",
     "difficulty": 3,
     "combine_with": [
      "D03"
     ]
    }
   ],
   "references": [
    {
     "title": "The Chemical Basis of Morphogenesis",
     "author": "A. M. Turing",
     "year": "1952",
     "url": "https://groups.csail.mit.edu/mac/projects/amorphous/6.978/papers/turing-chemical-basis.pdf"
    },
    {
     "title": "Complex Patterns in a Simple System",
     "author": "John E. Pearson",
     "year": "1993",
     "url": "https://arxiv.org/abs/patt-sol/9304003"
    },
    {
     "title": "Generating Textures on Arbitrary Surfaces Using Reaction-Diffusion",
     "author": "Greg Turk",
     "year": "1991",
     "url": "https://dl.acm.org/doi/10.1145/127719.122749"
    },
    {
     "title": "Reaction-Diffusion Tutorial",
     "author": "Karl Sims",
     "year": "",
     "url": "https://karlsims.com/rd.html"
    },
    {
     "title": "Reaction Diffusion（互動 WebGL 範例）",
     "author": "Amit Patel（Red Blob Games）",
     "year": "2019",
     "url": "https://www.redblobgames.com/x/1905-reaction-diffusion"
    },
    {
     "title": "Nervous System｜Reaction 專案集",
     "author": "Nervous System",
     "year": "",
     "url": "https://n-e-r-v-o-u-s.com/projects/sets/reaction/"
    }
   ]
  },
  {
   "id": "C02",
   "name_zh": "生命遊戲疊層",
   "name_en": "Game of Life 3D (Stacked Generations)",
   "family": "C",
   "family_name": "場與擴散",
   "file": "C02_GameOfLife3D.cs",
   "loc": 146,
   "logic": [
    "迭代模擬"
   ],
   "data_structure": [
    "網格"
   ],
   "difficulty": 2,
   "difficulty_reason": "只用 bool[,] 二維陣列與兩個輔助方法（NextGeneration、CountNeighbors），沒有自訂 class；重點是雙緩衝同步更新與 % 環面邊界，C# 基礎程度讀得懂，但需要理解「時間＝樓層」的轉換。",
   "tags": [
    "隨機",
    "可重現種子",
    "鄰居搜尋",
    "3D",
    "雙緩衝",
    "環面邊界",
    "時間轉空間"
   ],
   "one_liner": "在一張棋盤上跑 Conway 生命遊戲，每一代活著的格子疊成一層方塊，時間往上長成一棟由規則「長」出來的量體。",
   "how_it_works": [
    "建立 width × depth 的 bool[,] 網格，用固定 seed 的 Random 依 density 撒下初始活細胞。",
    "每一代先把活著的格子轉成 Box 放在第 layer 層（z = layer × cellSize），並記錄活格數。",
    "對每一格數周圍 8 格（Moore 鄰域，邊界用 % 左右上下相接）有幾個活鄰居。",
    "套 B3/S23 規則：活的有 2 或 3 個鄰居才存活；死的剛好 3 個鄰居就復活；結果寫進新陣列（雙緩衝），避免同一代互相干擾。",
    "新陣列取代舊陣列，重複 generations 次，最後輸出所有方塊與每層活格數。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 width, depth, generations, density, seed, cellSize",
    "    輸出 boxes, aliveCounts",
    "",
    "    // 0. 防呆",
    "    width、depth < 3 或 generations < 1 → 結束",
    "    cellSize ≤ 0 → 改 1",
    "",
    "    // 1. DATA 資料",
    "    活死網格、隨機數（seed）、方塊清單、每層活數清單",
    "",
    "    // 2. INIT 初始",
    "    每格依 density 擲骰，決定活或死",
    "",
    "    // 3. LOOP 迭代",
    "    重複 generations 次：",
    "      活的格子變方塊，疊在這一層，記活數",
    "      算下一代，往上一層",
    "",
    "    // 4. OUTPUT 輸出",
    "    方塊 → boxes",
    "    每層活數 → aliveCounts",
    "",
    "  // ----- RunScript 下方 -----",
    "  NextGeneration：全格同時更新；活的 2～3 鄰居續活，死的 3 鄰居復活",
    "  CountNeighbors：數周圍 8 格，邊界左右上下相接",
    "  AddLayerBoxes：活的格子變方塊放進這一層，回傳活數"
   ],
   "key_params": [
    {
     "name": "width / depth",
     "effect": "平面格數；越大圖樣越豐富，但方塊數與運算量是平方成長"
    },
    {
     "name": "generations",
     "effect": "世代數＝樓層數；太多代時常趨於穩定或閃爍，上層會變成重複的柱狀"
    },
    {
     "name": "density",
     "effect": "初始活細胞比例；約 0.2–0.4 最有生命力，太低很快死光，太高第一代就因擁擠大量死亡"
    },
    {
     "name": "seed",
     "effect": "同一 seed 結果完全可重現；換 seed 就換一棟量體"
    },
    {
     "name": "cellSize",
     "effect": "每格邊長兼層高；可改成分開的 cellSize 與 floorHeight 以符合建築尺度"
    }
   ],
   "csharp_concepts": [
    "bool[,] 二維陣列",
    "GetLength(0/1)",
    "巢狀 for 迴圈",
    "模數 % 處理環面邊界",
    "雙緩衝（寫進新陣列再交換）",
    "Random(seed)",
    "Box 與 Interval",
    "List<Box> / List<int>",
    "方法回傳值與 ref 輸出"
   ],
   "prerequisites": [
    "巢狀迴圈與陣列",
    "方法（函式）拆分",
    "網格家族觀念",
    "Box／Interval 建構"
   ],
   "teaching_note": "非常適合從零實作：規則只有兩行，最關鍵的學習重點是「為什麼要寫進新陣列」與「% 讓邊界相接」。可以先故意寫成原地更新讓學習者看到錯誤結果，再改成雙緩衝。提醒學習者 generations 與網格大小相乘後方塊數會爆量，預覽時先用 20×20×20。",
   "variations": [
    {
     "title": "改規則字串（B/S 記法）",
     "level": 1,
     "what_changes": "規則",
     "how": "新增輸入 birth、survive（例如 \"3\" 與 \"23\"），在 NextGeneration 裡用 birth.Contains(neighbors.ToString()) 判斷；可試 B36/S23（HighLife）、B3678/S34678（Day & Night）、B3/S12345（迷宮）。",
     "result": "同一套程式長出完全不同性格的量體：碎裂、迷宮牆、塊狀聚落。"
    },
    {
     "title": "一維 Wolfram 規則立面",
     "level": 1,
     "what_changes": "維度（2D→1D）",
     "how": "網格改成 bool[] 一列，鄰居只看左、自己、右三格，組成 0–7 的索引後查 rule 數字的第 n 個位元：(rule >> index) & 1。每一代往下畫一排方格或開孔。",
     "result": "Rule 30、90、110 等三角形與條紋圖樣，可直接當立面穿孔板。"
    },
    {
     "title": "真 3D 生命遊戲（26 鄰居）",
     "level": 3,
     "what_changes": "維度（2D＋時間→3D 空間）",
     "how": "改用 bool[,,]，CountNeighbors 加第三層 offsetZ 迴圈（26 鄰居），規則改成如 B5/S45 等 3D Life 規則；每一代輸出整個立體格子，而非疊層。",
     "result": "在立方體空間中生長、崩解的團塊，可作雕塑或量體研究。"
    },
    {
     "title": "年齡／歷史累積",
     "level": 2,
     "what_changes": "狀態",
     "how": "另開 int[,] age，活著就 +1、死掉歸零；輸出時依 age 決定方塊高度、縮放或顏色，或像 Krawczyk 的 Metallic Lace 累積「被造訪次數」當尺寸。",
     "result": "穩定存活的區域變粗、變高，形成有主次層級的結構與浮雕。"
    },
    {
     "title": "影像當初始狀態",
     "level": 2,
     "what_changes": "輸入",
     "how": "把 INIT 的 random.NextDouble() < density 改成讀取 Bitmap.GetPixel 的亮度 < 門檻，或讀入一組點（基地既有建物）轉成活格。",
     "result": "量體從基地紋理或圖像「長」出來，初始層就是設計意圖。"
    },
    {
     "title": "曲線邊界遮罩",
     "level": 2,
     "what_changes": "約束",
     "how": "新增 Curve boundary 輸入，預先算 bool[,] inside（格心用 Curve.Contains 判斷），在 NextGeneration 中 inside 為 false 的格子永遠是死的。",
     "result": "量體被限制在基地紅線或不規則平面內，邊緣自然退縮。"
    },
    {
     "title": "結構支撐約束（懸挑限制）",
     "level": 3,
     "what_changes": "約束／規則",
     "how": "在疊層時加一條規則：第 layer 層的活格若下一層同位置與周圍 4 格都沒有支撐就強制死亡；或限制每層活格數不超過上一層的某比例。",
     "result": "可建造的層層退縮量體，不會出現懸空方塊。"
    },
    {
     "title": "吸引子調整規則",
     "level": 3,
     "what_changes": "規則（空間變化）",
     "how": "加入吸引點，依格子到吸引點距離在兩組規則間切換，或把 density、存活門檻變成距離函數。",
     "result": "靠近吸引點處密實、遠處稀疏，形成有梯度的量體或立面開孔率。"
    },
    {
     "title": "體素合併與可製造輸出",
     "level": 3,
     "what_changes": "輸出",
     "how": "不輸出個別 Box，而是對每個活格只輸出朝向死格的面，組成 Mesh 後 Mesh.Weld／合併；或每層輸出成 2D 輪廓曲線供雷切疊層模型。",
     "result": "乾淨的外殼 mesh 可 3D 列印；逐層輪廓可雷射切割堆疊成實體模型。"
    },
    {
     "title": "曲面上的生命遊戲",
     "level": 3,
     "what_changes": "維度（平面→曲面）",
     "how": "把 x、y 格子對應到 Surface 的 UV 參數，Box 改成 surface.PointAt 取四角做四邊形面板，層數改成沿法向量偏移；環面邊界剛好對應封閉曲面。",
     "result": "包覆在圓柱或自由曲面上的立面圖樣或多層表皮。"
    },
    {
     "title": "Timer 動畫化",
     "level": 2,
     "what_changes": "迴圈",
     "how": "把 alive 改成類別欄位保留狀態，每次 RunScript 只推進一代，搭配 GH Timer 與 reset 布林輸入；只顯示當前層或最近 N 層。",
     "result": "即時看到滑翔機、振盪器移動，方便挑出想要的時間片段。"
    },
    {
     "title": "連續狀態（Lenia 式）",
     "level": 5,
     "what_changes": "狀態／規則",
     "how": "把 bool 改成 double（0–1），鄰居改用環形核加權平均，成長函數用高斯曲線，每步小幅更新；輸出用等值面或高度場取代方塊。",
     "result": "平滑、有機、會移動的「生物」形態，與 C01 反應擴散類似但規則來自 Lenia。"
    }
   ],
   "project_seeds": [
    {
     "title": "CA 穿孔立面系統",
     "brief": "用一維 Wolfram 規則或 2D 生命遊戲產生穿孔金屬板圖樣，依方位日照調整開孔率，輸出可雷切的板片分割與編號。",
     "difficulty": 2,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "生命遊戲集合住宅量體",
     "brief": "把 2D 疊層改成以住宅單元為格的量體生成，加入採光、懸挑、樓層數上限約束，比較不同規則產生的空間組合與日照表現。",
     "difficulty": 3,
     "combine_with": [
      "C03"
     ]
    },
    {
     "title": "時間切片雕塑",
     "brief": "挑選有趣的 seed 與規則，把世代疊層轉成合併外殼並 3D 列印，或逐層雷切壓克力疊成實體，展示「時間變成形」。",
     "difficulty": 3,
     "combine_with": []
    },
    {
     "title": "都市擴張 CA 模擬",
     "brief": "參考 White & Engelen 的土地使用 CA，格子帶多種狀態（住、商、綠地），依鄰居組成與適宜性機率轉換，在真實基地上模擬 20 年擴張情境。",
     "difficulty": 4,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "3D 體素 CA 與結構篩選",
     "brief": "用 26 鄰居 3D CA 生成空間體素，再以連通性與支撐規則淘汰不可建造的格子，輸出可組裝的模組化構件。",
     "difficulty": 4,
     "combine_with": [
      "A04"
     ]
    },
    {
     "title": "Lenia 連續場表皮",
     "brief": "實作連續 CA（環形核卷積＋高斯成長函數），把演化中的場轉成曲面高度或開孔率，研究數值穩定性與參數空間。",
     "difficulty": 5,
     "combine_with": [
      "C01",
      "C05"
     ]
    }
   ],
   "references": [
    {
     "title": "Mathematical Games: The fantastic combinations of John Conway's new solitaire game \"life\"",
     "author": "Martin Gardner",
     "year": "1970",
     "url": ""
    },
    {
     "title": "Game of Life -- Wolfram MathWorld",
     "author": "Eric W. Weisstein",
     "year": "",
     "url": "https://mathworld.wolfram.com/GameofLife.html"
    },
    {
     "title": "An Evolutionary Architecture",
     "author": "John Frazer",
     "year": "1995",
     "url": ""
    },
    {
     "title": "Adapting cellular automata to support the architectural design process",
     "author": "Christiane M. Herr, Thomas Kvan",
     "year": "2007",
     "url": "https://www.researchgate.net/publication/222923429_Adapting_cellular_automata_to_support_the_architectural_design_process"
    },
    {
     "title": "Architectural Interpretation of Cellular Automata (Generative Art 2002)",
     "author": "Robert J. Krawczyk",
     "year": "2002",
     "url": "https://generativeart.com/on/cic/papersGA2002/7.pdf"
    },
    {
     "title": "Adapting Cellular Automata as Architectural Design Tools (CAADRIA 2015)",
     "author": "Christiane M. Herr, Ryan C. Ford",
     "year": "2015",
     "url": "https://papers.cumincad.org/data/works/att/caadria2015_139.content.pdf"
    },
    {
     "title": "Lenia - Biology of Artificial Life",
     "author": "Bert Wang-Chak Chan",
     "year": "2018",
     "url": "https://arxiv.org/abs/1812.05433"
    },
    {
     "title": "Oh My Gosh, It's Covered in Rule 30s!",
     "author": "Stephen Wolfram",
     "year": "2017",
     "url": "https://writings.stephenwolfram.com/2017/06/oh-my-gosh-its-covered-in-rule-30s"
    }
   ]
  },
  {
   "id": "C03",
   "name_zh": "向量場流線",
   "name_en": "Vector Field Streamlines",
   "family": "C",
   "family_name": "場與擴散",
   "file": "C03_VectorField.cs",
   "loc": 150,
   "logic": [
    "直接公式",
    "迭代模擬"
   ],
   "data_structure": [
    "網格",
    "粒子"
   ],
   "difficulty": 2,
   "difficulty_reason": "約 150 行、沒有自訂 class，只有「場公式」與「沿場走一步」兩個函式加兩層迴圈；最難的是理解外積轉 90° 與距離衰減，C# 基礎程度讀得懂。",
   "tags": [
    "吸引子控制",
    "網格擴散",
    "開放生長"
   ],
   "one_liner": "在基地上每一點用公式算出一個方向（被吸引點拉＋繞著轉），再從格子起點順著方向一步步走，畫出像風、水、磁力線的流線。",
   "how_it_works": [
    "在正方形範圍內排出 seedsPerSide × seedsPerSide 個格子起點。",
    "FieldDirection：對每個吸引點算「指向它的方向 × pullStrength」加「轉 90° 的方向 × swirlStrength」，乘上 1/(1+距離) 的衰減後全部相加，得到該點的場方向。",
    "TraceStreamline：從起點取場方向、單位化、前進 stepSize，重複 streamlineSteps 次，走出範圍、場為零或碰到吸引點就停，記成 Polyline。",
    "另外在每個起點輸出一段短線（arrows）顯示場的方向，方便對照場與流線。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 attractors, pullStrength, swirlStrength, fieldSize, seedsPerSide, streamlineSteps, stepSize",
    "    輸出 streamlines, arrows",
    "",
    "    // 0. 防呆",
    "    沒 attractors → 結束",
    "    fieldSize、stepSize ≤ 0 或 seedsPerSide < 1 → 結束",
    "",
    "    // 1. DATA 資料",
    "    流線清單、箭頭清單",
    "",
    "    // 2. INIT 初始",
    "    起點排成格子（每邊 seedsPerSide 個），鋪滿 fieldSize",
    "",
    "    // 3. LOOP 迭代",
    "    對每個起點：",
    "      丟給 TraceStreamline 走出流線，超過 1 點才留",
    "      起點的場方向 → 短線",
    "",
    "    // 4. OUTPUT 輸出",
    "    流線 → streamlines",
    "    短線 → arrows",
    "",
    "  // ----- RunScript 下方 -----",
    "  FieldDirection：每個吸引點「拉」＋「轉」，越遠越弱，全部相加",
    "  TraceStreamline：順著場走 streamlineSteps 步；出界或到吸引點 → 停",
    "  IsOutside：出了 fieldSize 的方框嗎",
    "  IsNearAttractor：離任一吸引點太近嗎"
   ],
   "key_params": [
    {
     "name": "pullStrength",
     "effect": "吸引力；正值流線被吸進吸引點，負值被推開成放射狀"
    },
    {
     "name": "swirlStrength",
     "effect": "繞圈力；越大越像漩渦，正負值決定順逆時針"
    },
    {
     "name": "seedsPerSide",
     "effect": "起點密度；越多流線越密，但可能擠在一起、重疊"
    },
    {
     "name": "streamlineSteps",
     "effect": "流線最長能走幾步；太少線會很短，太多只是在範圍外提早停止"
    },
    {
     "name": "stepSize",
     "effect": "每步長度；小則平滑但慢，大則折線感重且可能衝過吸引點"
    },
    {
     "name": "fieldSize",
     "effect": "場的範圍（也是停止邊界），同時決定起點間距"
    },
    {
     "name": "attractors",
     "effect": "吸引點的位置與數量；多個吸引點的場會互相疊加出鞍點與分流"
    }
   ],
   "csharp_concepts": [
    "Vector3d 加減與純量乘法",
    "Vector3d.CrossProduct",
    "Vector3d.Unitize() 回傳 bool",
    "Polyline",
    "List<Line>",
    "函式拆分（場公式 vs. 追蹤）"
   ],
   "prerequisites": [
    "雙層迴圈",
    "向量基本觀念（方向、長度、單位化）",
    "Point3d 與 Vector3d 的差別"
   ],
   "teaching_note": "非常適合從零實作：先只寫 FieldDirection 畫 arrows，讓學習者看到「場」，再加 TraceStreamline 變成流線，兩段各 10 分鐘。要提醒 Unitize() 是改自己並回傳成功與否、場為零時要 break，以及 stepSize 太大會在吸引點附近來回抖動（這正好帶出為何有 IsNearAttractor）。",
   "variations": [
    {
     "title": "換場公式：Perlin Noise 角度場",
     "level": 2,
     "what_changes": "規則（場公式）",
     "how": "把 FieldDirection 改成 angle = noise.ValueAt(x/scale, y/scale) * 2π，回傳 (cos angle, sin angle, 0)；可直接借用 C04 的 PerlinNoise class。",
     "result": "有機、如頭髮或木紋般流動的曲線，就是 Tyler Hobbs 式 flow field。"
    },
    {
     "title": "電荷場／磁力線",
     "level": 2,
     "what_changes": "規則（場公式）",
     "how": "每個點給正負電荷值，場 = Σ q·(p−a)/|p−a|³，移除 swirl 項；流線從正電荷附近的小圓上出發。",
     "result": "物理課本上的電力線：從正電荷發散、收到負電荷，同號電荷之間出現分界。"
    },
    {
     "title": "Curl noise 無源場",
     "level": 3,
     "what_changes": "規則（場公式）",
     "how": "先有一個純量場 ψ（例如 noise），用有限差分算 (∂ψ/∂y, −∂ψ/∂x) 當方向；這個場沒有源與匯，流線不會聚成一點。",
     "result": "像煙、水流的迴旋，流線均勻不擠在一起，適合做鋪面紋理。"
    },
    {
     "title": "改成 RK4 積分",
     "level": 3,
     "what_changes": "迴圈（積分方法）",
     "how": "把 current += dir*step 換成四階 Runge-Kutta：取 k1..k4 四次場方向加權平均後再前進。",
     "result": "同樣 stepSize 下流線更準、漩渦中心不會螺旋外洩，可以用較大步長。"
    },
    {
     "title": "等間距流線（Jobard–Lefer）",
     "level": 4,
     "what_changes": "狀態＋輸出（起點策略）",
     "how": "不用格子起點，改成從已完成流線的兩側 dsep 距離取新起點；追蹤時用格子型空間索引檢查與既有流線距離 < dtest 就停。",
     "result": "密度均勻、不重疊的流線，像手繪等高線或雕版畫，可直接拿去雷切或繪圖機。"
    },
    {
     "title": "雙向追蹤",
     "level": 1,
     "what_changes": "迴圈",
     "how": "每個起點同時往 +direction 與 −direction 各走一次，把後半段反轉接在前面。",
     "result": "流線從上游一路貫穿到下游，不會只從格點開始，構圖完整很多。"
    },
    {
     "title": "曲面上的流線",
     "level": 3,
     "what_changes": "維度（2D→曲面）",
     "how": "新增 Surface 輸入，在 (u,v) 參數空間算場並追蹤，每步用 surface.PointAt(u,v) 映射回 3D；或把 3D 場向量投影到切平面。",
     "result": "貼在屋頂、殼體或地形上的流線，可當分割線、肋條或排水溝走向。"
    },
    {
     "title": "3D 場與空間流線",
     "level": 3,
     "what_changes": "維度（2D→3D）",
     "how": "拿掉 toAttractor.Z = 0，起點改成 3D 格子，旋轉軸改成可輸入的向量；停止條件改成立方體邊界。",
     "result": "空間中的螺旋與渦流線，可做懸吊裝置或管線雕塑。"
    },
    {
     "title": "影像／曲線當場的輸入",
     "level": 2,
     "what_changes": "輸入",
     "how": "把灰階影像的梯度（相鄰像素亮度差）當方向，或取最近邊界曲線的切線方向（Curve.ClosestPoint + TangentAt）與吸引力混合。",
     "result": "流線沿著影像輪廓或基地邊界流動，像順著建築外框繞行的人流或風。"
    },
    {
     "title": "流線轉成可製造幾何",
     "level": 2,
     "what_changes": "輸出",
     "how": "把 Polyline 平滑成 Curve 後 Offset 成帶狀、或沿線 Sweep 圓管；依場強度（向量長度）決定帶寬或管徑。",
     "result": "可雷切的鋪面分割、CNC 的地景溝槽、或 3D 列印的流線雕塑。"
    },
    {
     "title": "粒子動畫化",
     "level": 2,
     "what_changes": "狀態＋迴圈（Timer）",
     "how": "把粒子位置存在 class 欄位，每次 Timer 觸發只前進一步並保留最近 N 步當尾巴；場的吸引點可隨時間移動。",
     "result": "像風場地圖一樣的流動動畫，可錄成影片做分析圖。"
    },
    {
     "title": "與 D01 Boids 混合",
     "level": 4,
     "what_changes": "混合其他家族",
     "how": "把場方向當成 Boids 的一個額外轉向力（steer toward field direction），權重可調。",
     "result": "群體既有自主避讓又順著環境流動，接近人流或魚群在水流中的行為。"
    }
   ],
   "project_seeds": [
    {
     "title": "風流線鋪面",
     "brief": "以基地盛行風向與建築量體當吸引／排斥點建立向量場，產生等間距流線當廣場鋪面分割線，並依流線密度調整鋪面材料。輸出為可施工的分割圖。",
     "difficulty": 3,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "電荷場屋頂肋條",
     "brief": "在屋頂曲面上放置正負「電荷」代表柱位與天窗，把場線映射到曲面上成為結構肋條或採光縫；比較不同電荷配置的視覺與結構邏輯。",
     "difficulty": 4,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "Flow field 繪圖機作品集",
     "brief": "以 noise 角度場為基礎，實作碰撞檢查讓流線不重疊，輸出一系列可用筆式繪圖機或雷射雕刻的線稿，探索密度、線寬、色帶的變化。",
     "difficulty": 2,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "CFD 結果重繪的都市風環境圖",
     "brief": "用 Butterfly/OpenFOAM 或簡化的吸引／排斥場取得街廓風速向量，再用本元件的流線追蹤重畫成具表現力的分析圖，並以流線密度標示不舒適區。",
     "difficulty": 5,
     "combine_with": [
      "D03"
     ]
    },
    {
     "title": "流場導引的地景溝槽",
     "brief": "以地形坡度（C04 地形的梯度）為場，追蹤雨水流線並 Sweep 成排水溝與種植帶，輸出 CNC 地形模型。",
     "difficulty": 3,
     "combine_with": [
      "C04",
      "C05"
     ]
    }
   ],
   "references": [
    {
     "title": "Flow Fields",
     "author": "Tyler Hobbs",
     "year": "2020",
     "url": "https://www.tylerxhobbs.com/words/flow-fields"
    },
    {
     "title": "Creating Evenly-Spaced Streamlines of Arbitrary Density",
     "author": "Bruno Jobard, Wilfrid Lefer",
     "year": "1997",
     "url": "https://link.springer.com/chapter/10.1007/978-3-7091-6876-9_5"
    },
    {
     "title": "Curl-Noise for Procedural Fluid Flow",
     "author": "Robert Bridson, Jim Hourihan, Marcus Nordenstam",
     "year": "2007",
     "url": "https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf"
    },
    {
     "title": "The Nature of Code（Flow Field 範例）",
     "author": "Daniel Shiffman",
     "year": "",
     "url": ""
    },
    {
     "title": "Field line",
     "author": "Wikipedia",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Field_line"
    },
    {
     "title": "Parametricism – A New Global Style for Architecture and Urban Design",
     "author": "Patrik Schumacher",
     "year": "2009",
     "url": "https://patrikschumacher.com/parametricism-a-new-global-style-for-architecture-and-urban-design"
    }
   ]
  },
  {
   "id": "C04",
   "name_zh": "Perlin Noise 雜訊地形",
   "name_en": "Perlin Noise Terrain",
   "family": "C",
   "family_name": "場與擴散",
   "file": "C04_Noise.cs",
   "loc": 206,
   "logic": [
    "直接公式"
   ],
   "data_structure": [
    "網格"
   ],
   "difficulty": 2,
   "difficulty_reason": "只有一個自訂 class（PerlinNoise）、沒有迭代或鄰居搜尋，每點直接算；門檻在洗牌查表、& 255 位元運算與五次平滑曲線的數學，但可以當黑盒子先用再拆。",
   "tags": [
    "隨機",
    "可重現種子",
    "自訂 class",
    "網格擴散"
   ],
   "one_liner": "用「平滑、連續的隨機」替每個格點算高度，再疊幾層越來越細的起伏，做出像真的山丘地形 Mesh。",
   "how_it_works": [
    "建構 PerlinNoise：0–255 依 seed 洗牌後重複兩次成 512 長的查表，同 seed 永遠得到同一片地形。",
    "ValueAt(x,y)：找出點所在的整數格，四個角各查表得到一個隨機斜坡方向（8 選 1），算「角到點」與斜坡的內積，再用 6t⁵−15t⁴+10t³ 平滑混合四角。",
    "LayeredNoise（fBm 疊層）：每一層細節 ×2、強度 ×0.5，共疊 octaves 層後除以總強度，結果約在 −1 到 1。",
    "對 (width+1)×(depth+1) 個格點算 elevation = LayeredNoise × height，取樣座標加 0.37 偏移避開整數點恆為 0 的問題。",
    "BuildGridMesh：每相鄰 4 點組成一個四邊形面，計算法線後輸出地形 Mesh。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 width, depth, cellSize, scale, height, octaves, seed",
    "    輸出 terrainPoints, terrainMesh",
    "",
    "    // 0. 防呆",
    "    width 或 depth < 1 → 結束",
    "    cellSize ≤ 0 → 改 1",
    "    scale ≤ 0 → 改 1",
    "    octaves 限 1～8",
    "",
    "    // 1. DATA 資料",
    "    雜訊（seed）、格點清單",
    "",
    "    // 2. INIT 初始：每一點直接用公式算高度",
    "    對每個格點：",
    "      位置 ÷ scale，再錯開一點",
    "      疊層雜訊 × height → 高度",
    "",
    "    // 4. OUTPUT 輸出",
    "    格點 → terrainPoints",
    "    格點連成四邊形 Mesh → terrainMesh",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：取樣錯開 0.37",
    "  LayeredNoise：疊 octaves 層，每層細節 ×2、比重 ×0.5",
    "  BuildGridMesh：每 4 點一個四邊形",
    "",
    "// ----- Script_Instance 外面 -----",
    "PerlinNoise：查表＋四角平滑混合 → 約 -1～1"
   ],
   "key_params": [
    {
     "name": "scale",
     "effect": "起伏的水平尺度；越大山丘越寬、越平緩，越小越像碎石"
    },
    {
     "name": "height",
     "effect": "垂直放大倍率，決定最高與最低點差"
    },
    {
     "name": "octaves",
     "effect": "疊層數；1 層是圓滑丘陵，4–6 層出現山脊與細部，超過 8 被限制"
    },
    {
     "name": "seed",
     "effect": "換一片地形但保持同樣「性格」；同 seed 可重現"
    },
    {
     "name": "width / depth / cellSize",
     "effect": "格點數與間距；格太粗會看不到高層 octave 的細節"
    }
   ],
   "csharp_concepts": [
    "自訂 class 與建構子",
    "int[] 陣列查表",
    "位元運算 & 255",
    "System.Random(seed) 洗牌（Fisher–Yates）",
    "switch 語句",
    "static 方法",
    "const 欄位",
    "Mesh.Vertices / Mesh.Faces.AddFace"
   ],
   "prerequisites": [
    "雙層迴圈與一維索引 row*n+col",
    "內部 vs. 外部 class 版面",
    "線性內插 Blend 的觀念"
   ],
   "teaching_note": "適合從零實作，但建議把 PerlinNoise class 當現成工具直接貼上，只從零寫 LayeredNoise 與網格 Mesh，重點放在 scale／octaves 的直覺。要特別講 SampleOffset：整數座標值恆為 0，不偏移會得到全平的地；也可以對照 System.Random 的白雜訊讓學習者看出「平滑」的差別。",
   "variations": [
    {
     "title": "脊狀雜訊（Ridged）",
     "level": 1,
     "what_changes": "規則（每層的值）",
     "how": "LayeredNoise 內把 noise 值改成 1 − |n|，再平方後疊加。",
     "result": "尖銳的山脊線與峽谷，像山脈或沙丘脊。"
    },
    {
     "title": "Domain warping 扭曲座標",
     "level": 2,
     "what_changes": "規則（取樣座標）",
     "how": "先算 qx = noise(x,y)、qy = noise(x+5.2, y+1.3)，再用 noise(x + k·qx, y + k·qy) 取值；k 控制扭曲量。",
     "result": "像大理石、流體或岩層褶皺的紋理，比單純 fBm 更有流動感。"
    },
    {
     "title": "階梯化／等高梯田",
     "level": 1,
     "what_changes": "輸出",
     "how": "elevation = Math.Floor(elevation / step) * step，或只在輸出前量化。",
     "result": "梯田、層層平台的地景，可直接當等高線模型切片。"
    },
    {
     "title": "吸引點遮罩（島嶼、盆地）",
     "level": 2,
     "what_changes": "輸入（吸引子控制）",
     "how": "新增吸引點或基地邊界曲線，高度乘上 falloff = 1 − 距離/半徑（截在 0–1），或用曲線距離做衰減。",
     "result": "中心隆起、邊緣下沉的島嶼，或以建築量體為中心的挖填地形。"
    },
    {
     "title": "影像混合高度",
     "level": 2,
     "what_changes": "輸入",
     "how": "讀入灰階圖 Bitmap.GetPixel 當大尺度高度，再加小尺度 noise 做細節。",
     "result": "人為設計的大地形保留輪廓，同時帶有自然細節。"
    },
    {
     "title": "noise 驅動立面面板",
     "level": 2,
     "what_changes": "輸出（從高度改成參數）",
     "how": "不做地形，而把 noise 值映射到每片立面板的旋轉角、開孔半徑或出挑深度；格點改在立面 UV 上取樣。",
     "result": "漸變而不規則的立面遮陽或開孔韻律，避免純隨機的雜亂感。"
    },
    {
     "title": "曲面上取樣（3D noise）",
     "level": 3,
     "what_changes": "維度（2D→3D）",
     "how": "把 ValueAt 擴充成 3D（8 個角、12 個梯度方向，參考 Perlin 2002），對任意曲面或 Mesh 的頂點位置取樣，沿法線位移。",
     "result": "包在球體、殼體或建築表皮上的連續凹凸，不會出現 UV 接縫。"
    },
    {
     "title": "時間當第三維做動畫",
     "level": 2,
     "what_changes": "狀態（Timer）",
     "how": "用 3D noise 的 z = time，Timer 每次加一小段；或 2D 情況下讓取樣偏移量隨時間移動。",
     "result": "像水面或雲層般緩慢變形的地形動畫。"
    },
    {
     "title": "等高線輸出",
     "level": 2,
     "what_changes": "輸出",
     "how": "把 terrainMesh 用 Mesh.CreateContourCurves 或 Brep 切片，或直接交給 C05 Marching Squares 從格點值抽出等值線。",
     "result": "可雷切疊層的等高線模型（地形模型的標準做法）。"
    },
    {
     "title": "水力侵蝕後處理",
     "level": 4,
     "what_changes": "混合迭代模擬",
     "how": "在 noise 高度場上丟大量水滴粒子，沿坡度往下流、依速度帶走與堆積泥沙，反覆數千次。",
     "result": "出現沖溝、扇狀堆積與平緩谷底，地形可信度大幅提升。"
    },
    {
     "title": "noise 當向量場角度",
     "level": 2,
     "what_changes": "混合其他家族（C03）",
     "how": "angle = noise(x,y)·2π 當 C03 的 FieldDirection，或取高度梯度當雨水流向。",
     "result": "flow field 生成藝術或地形上的雨水流線。"
    },
    {
     "title": "閾值分區（生物群系／用地）",
     "level": 2,
     "what_changes": "輸出",
     "how": "用兩張不同 seed 的 noise（例：高度與濕度）查表決定每格類型，對不同類型上色或放不同構件。",
     "result": "水域、草地、林地、建地的自然分區圖，可當景觀植栽配置草圖。"
    }
   ],
   "project_seeds": [
    {
     "title": "可重現的地形模型切片機",
     "brief": "以 fBm＋吸引點遮罩生成基地假想地形，輸出等高線雷切檔與 CNC 高度圖，並用 seed 系統性比較 10 種地形。",
     "difficulty": 2,
     "combine_with": [
      "C05"
     ]
    },
    {
     "title": "noise 立面遮陽系統",
     "brief": "以 noise 值控制百葉角度與開孔大小，再加入日照方位作為權重，比較純 noise、純日照、混合三種版本的立面效果與遮陽率。",
     "difficulty": 3,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "侵蝕地景公園",
     "brief": "先用 noise 生成起伏，再做水滴侵蝕模擬，擷取沖溝當步道與排水系統，最後輸出景觀配置圖。",
     "difficulty": 4,
     "combine_with": [
      "C03",
      "D02"
     ]
    },
    {
     "title": "3D noise 曲面表皮",
     "brief": "實作 3D Perlin noise 並對殼體 Mesh 頂點沿法線位移，控制位移不超過製造公差，輸出可 3D 列印或 CNC 的表皮模組。",
     "difficulty": 3,
     "combine_with": [
      "A04"
     ]
    },
    {
     "title": "Domain warping 生成鋪面與地毯圖樣",
     "brief": "以多層 domain warping 做出大理石般的紋理，再量化成 4–6 種材料或顏色，輸出可施工的鋪面拼貼圖。",
     "difficulty": 2,
     "combine_with": [
      "C01"
     ]
    },
    {
     "title": "GPU 即時無限地形",
     "brief": "把 noise 移到 shader 或平行運算，搭配 LOD 分塊產生可漫遊的大範圍地景，研究效能與接縫問題。",
     "difficulty": 5,
     "combine_with": []
    }
   ],
   "references": [
    {
     "title": "An Image Synthesizer",
     "author": "Ken Perlin",
     "year": "1985",
     "url": "https://dl.acm.org/doi/10.1145/325165.325247"
    },
    {
     "title": "Improving Noise",
     "author": "Ken Perlin",
     "year": "2002",
     "url": "https://mrl.cs.nyu.edu/~perlin/paper445.pdf"
    },
    {
     "title": "Improved Noise reference implementation",
     "author": "Ken Perlin",
     "year": "2002",
     "url": "https://mrl.cs.nyu.edu/~perlin/noise"
    },
    {
     "title": "Curl-Noise for Procedural Fluid Flow",
     "author": "Robert Bridson, Jim Hourihan, Marcus Nordenstam",
     "year": "2007",
     "url": "https://dl.acm.org/doi/10.1145/1275808.1276435"
    },
    {
     "title": "Perlin noise and its improvements: A literature review",
     "author": "",
     "year": "",
     "url": "https://ace.ewapub.com/article/view/14225.pdf"
    },
    {
     "title": "Three Ways of Generating Terrain with Erosion Features",
     "author": "dandrino",
     "year": "",
     "url": "https://github.com/dandrino/terrain-erosion-3-ways"
    }
   ]
  },
  {
   "id": "C05",
   "name_zh": "Marching Squares 等值線",
   "name_en": "Marching Squares",
   "family": "C",
   "family_name": "場與擴散",
   "file": "C05_MarchingSquares.cs",
   "loc": 186,
   "logic": [
    "幾何轉換",
    "直接公式"
   ],
   "data_structure": [
    "網格"
   ],
   "difficulty": 2,
   "difficulty_reason": "186 行、無自訂 class、無遞迴；核心是 2D 陣列加一張 16 格查表與線性內插，C# 基礎程度能讀懂，唯一難點是用位元運算算情況編號與對角（鞍點）情況判斷。",
   "tags": [
    "等值面",
    "網格擴散",
    "吸引子控制",
    "查表"
   ],
   "one_liner": "先在方格網每個格點算一個「場值」（像地形高度），再逐格找出剛好等於某個數值的位置，連成一圈圈等高線。",
   "how_it_works": [
    "依中心點與半徑決定取樣範圍，切成 cellSize 大小的方格網。",
    "每個格點用 metaball 公式 Σ(半徑² ÷ 距離²) 算場值，存進 double[,]。",
    "逐格檢查 4 個角是否 ≥ threshold，用 1、2、4、8 相加得到 0–15 的情況編號。",
    "情況 5、10 是對角（鞍點），用 4 角平均值決定要不要把兩個內側角連起來。",
    "查 EdgePairs 表得知要連哪兩條邊，在邊上依數值比例線性內插出端點，輸出 Line。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 centers, radii, cellSize, threshold, margin",
    "    輸出 contourLines, gridPoints",
    "",
    "    // 0. 防呆",
    "    沒 centers → 結束",
    "    沒 radii → 半徑 1",
    "    cellSize 或 threshold ≤ 0 → 結束",
    "",
    "    // 1. DATA 資料",
    "    取樣範圍：包住所有圓，再往外留 margin",
    "    範圍 ÷ cellSize → 欄數、列數",
    "",
    "    // 2. INIT 初始：每個格點的場值",
    "    每個格點記位置，丟給 FieldValue 算場值",
    "",
    "    // 3. LOOP 掃描：每一格看一次",
    "    對每一格：丟給 AddCellLines",
    "",
    "    // 4. OUTPUT 輸出",
    "    線段 → contourLines",
    "    格點 → gridPoints",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：EdgePairs，16 種情況各連哪些邊",
    "  FieldValue：各圓 半徑² ÷ 距離² 加總",
    "  AddCellLines：四角在線內外 → 情況編號 → 查表連線",
    "  EdgePoint：邊上剛好等於 threshold 的點"
   ],
   "key_params": [
    {
     "name": "centers",
     "effect": "metaball 中心，靠得越近，等值線越容易融合成一團"
    },
    {
     "name": "radii",
     "effect": "每個中心的影響力，半徑越大圈越大、越容易與鄰居黏在一起"
    },
    {
     "name": "cellSize",
     "effect": "格子越小線越平滑，但格點數以平方成長，速度變慢"
    },
    {
     "name": "threshold",
     "effect": "等值線取在哪個數值；調小輪廓變大變胖、調大則縮成各自獨立的小圈"
    },
    {
     "name": "margin",
     "effect": "邊界外多留的範圍；太小時外圈會被切斷成開口曲線"
    }
   ],
   "csharp_concepts": [
    "二維陣列 double[,] / Point3d[,]",
    "static readonly int[][] 查表",
    "位元位移 1 << corner",
    "LINQ Min/Max/Average",
    "線性內插",
    "List<Line>"
   ],
   "prerequisites": [
    "巢狀迴圈",
    "陣列索引",
    "Point3d 與向量加減",
    "距離平方 DistanceToSquared"
   ],
   "teaching_note": "非常適合從零實作：先只畫格點與內外著色，再加查表，最後加內插，每一步都看得到結果。要特別講清楚「角的編號→情況編號→查表」這條對應，以及對角情況為何需要中心值判斷；也可提醒輸出的是零散線段，要成封閉曲線需再 Curve.JoinCurves。",
   "variations": [
    {
     "title": "換場函數：從 metaball 改成 SDF／雜訊",
     "level": 2,
     "what_changes": "規則（FieldValue）",
     "how": "把 FieldValue 換成 Perlin／Simplex noise、到曲線的距離（curve.ClosestPoint 後取距離）或正弦波疊加，其餘掃描程式碼完全不動。",
     "result": "從泡泡狀融合形變成有機斑紋、等距偏移輪廓或波紋圖樣。"
    },
    {
     "title": "多條等值線：一次輸出整張等高線圖",
     "level": 1,
     "what_changes": "迴圈／輸出",
     "how": "把 threshold 改成 List<double> 或用 start、step、count 產生多個數值，外層多包一個迴圈，輸出 DataTree<Line> 每一層一條分支。",
     "result": "類似地形圖的多層同心等高線，可直接拿去做分層雷切模型。"
    },
    {
     "title": "影像輸入：照片亮度當場值",
     "level": 2,
     "what_changes": "輸入",
     "how": "新增 string imagePath 輸入，用 System.Drawing.Bitmap 讀圖，GetPixel(column,row).GetBrightness() 當作 cornerValues。",
     "result": "照片或手繪灰階圖轉成向量輪廓線，可用於立面穿孔或地景圖案。"
    },
    {
     "title": "曲面上的等值線",
     "level": 3,
     "what_changes": "維度（2D→曲面上）",
     "how": "格點改成在 Surface 的 (u,v) 參數空間取樣，場值用 surface.PointAt(u,v) 的 3D 位置計算，內插完的 uv 點再用 PointAt 映射回 3D。",
     "result": "貼在屋頂或曲面立面上的等值線，可做分割線或肋條走向。"
    },
    {
     "title": "Isoband 填色：輸出封閉面域",
     "level": 3,
     "what_changes": "輸出",
     "how": "線段先用 Curve.JoinCurves 接成封閉 Polyline，再用 Brep.CreatePlanarBreps 或 Mesh 填面；進階可實作 Marching Squares 的 isoband 版本（每格 3 態，81 種情況）。",
     "result": "可擠出成高低分層的地景量體或雷切板材。"
    },
    {
     "title": "升維成 Marching Cubes／四面體",
     "level": 4,
     "what_changes": "維度（2D→3D）",
     "how": "格點改成 double[,,]，每格 8 角；可直接套用 F03 的「立方體切 6 個四面體」寫法避開 256 格大表，輸出 Mesh。",
     "result": "3D metaball 融合體、有機雕塑或體素化建築量體。"
    },
    {
     "title": "吸引子加權與負電荷",
     "level": 2,
     "what_changes": "規則／輸入",
     "how": "新增 weights 輸入，允許負數：total += weight * r² / d²；負權重的點會把輪廓挖出凹洞。",
     "result": "能做出孔洞、夾縫與不對稱輪廓的平面配置或景觀水池形狀。"
    },
    {
     "title": "曲線邊界裁切",
     "level": 2,
     "what_changes": "加約束",
     "how": "新增 Curve boundary 輸入，對每個格點用 boundary.Contains(point) 判斷，在邊界外的格點強制設為 0（永遠在外側）。",
     "result": "等值線只出現在基地範圍內，並自然沿著邊界收邊。"
    },
    {
     "title": "混合反應擴散或生命遊戲",
     "level": 3,
     "what_changes": "混合其他家族",
     "how": "把 C01 Reaction-Diffusion 或 C02 生命遊戲算出的網格濃度直接當 cornerValues 輸入，Marching Squares 只負責「描邊」。",
     "result": "平滑、可加工的斑紋向量輪廓，而不是鋸齒狀像素。"
    },
    {
     "title": "動畫化：移動中心、流動輪廓",
     "level": 2,
     "what_changes": "動畫",
     "how": "接 Timer 或滑桿時間 t，讓 centers 沿圓或雜訊路徑移動（center + new Vector3d(Math.Cos(t), Math.Sin(t), 0) * amplitude），每次重算。",
     "result": "熔岩燈般融合又分離的輪廓動畫，可輸出成連續幀做影片或拿每幀疊成 3D 量體。"
    },
    {
     "title": "堆疊成 3D：時間或高度當 Z",
     "level": 3,
     "what_changes": "維度／輸出",
     "how": "對一系列 threshold（或一系列時間步）各算一次，把結果線段 Z 設為對應高度，再用 Loft 或輸出成疊層切片。",
     "result": "類似地形模型的疊層量體或可逐層列印的切片路徑。"
    },
    {
     "title": "轉成可製造的肋條與刀具路徑",
     "level": 3,
     "what_changes": "輸出轉可製造幾何",
     "how": "Join 後的等值線用 Curve.Offset 做成有寬度的板條，或按高度排序輸出成 CNC／雷切路徑；可加上編號文字方便組裝。",
     "result": "可以直接雷切的等高線地形模型或疊層立面。"
    }
   ],
   "project_seeds": [
    {
     "title": "基地等高線疊層模型產生器",
     "brief": "以測量點或 DEM 影像為場值，一次產出多層等高線並自動排版成雷切板，附編號。重點在多閾值、Join 封閉曲線與排版。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "人流熱區等值線立面",
     "brief": "把 D01 Boids 或 D03 行人模擬的密度格網當場值，用等值線決定立面穿孔或遮陽板的疏密分區，讓使用行為變成立面圖樣。",
     "difficulty": 3,
     "combine_with": [
      "D01",
      "D03"
     ]
    },
    {
     "title": "反應擴散斑紋的可加工輪廓",
     "brief": "C01 產生 Turing 斑紋，C05 描邊並偏移成有厚度的板件，輸出為可 CNC 的隔屏或地坪鋪面分割。",
     "difficulty": 3,
     "combine_with": [
      "C01"
     ]
    },
    {
     "title": "曲面屋頂上的日照等值線分割",
     "brief": "在屋頂曲面的 uv 網格上計算日照或曲率值，於曲面上畫等值線作為面板分割或肋條走向，比較不同閾值下面板數量與尺寸。",
     "difficulty": 4,
     "combine_with": [
      "C03"
     ]
    },
    {
     "title": "自寫 Marching Cubes 有機量體",
     "brief": "把 C05 升維成 3D 並加入 SDF 布林（聯集、平滑聯集、差集），做出可 3D 列印的 metaball 雕塑或構件接頭，並比較與 Dendro 的結果。",
     "difficulty": 5,
     "combine_with": [
      "F03"
     ]
    }
   ],
   "references": [
    {
     "title": "Marching cubes: A high resolution 3D surface construction algorithm",
     "author": "William E. Lorensen, Harvey E. Cline",
     "year": "1987",
     "url": "https://dl.acm.org/doi/10.1145/37402.37422"
    },
    {
     "title": "A Generalization of Algebraic Surface Drawing（metaballs 原始論文，ACM TOG 1(3)）",
     "author": "James F. Blinn",
     "year": "1982",
     "url": ""
    },
    {
     "title": "Polygonising a Scalar Field (Marching Cubes)",
     "author": "Paul Bourke",
     "year": "1994",
     "url": "https://paulbourke.net/geometry/polygonise/"
    },
    {
     "title": "Marching squares（Wikipedia）",
     "author": "",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Marching_squares"
    },
    {
     "title": "C5 — Marching Squares（Coding Train 教學）",
     "author": "Daniel Shiffman",
     "year": "",
     "url": "https://thecodingtrain.com/challenges/c5-marching-squares"
    },
    {
     "title": "Distance functions（SDF 基本形與組合公式）",
     "author": "Inigo Quilez",
     "year": "",
     "url": "https://iquilezles.org/articles/distfunctions/"
    }
   ]
  },
  {
   "id": "D01",
   "name_zh": "Boids 群聚",
   "name_en": "Boids (Flocking)",
   "family": "D",
   "family_name": "代理人",
   "file": "D01_Boids.cs",
   "loc": 213,
   "logic": [
    "迭代模擬"
   ],
   "data_structure": [
    "粒子"
   ],
   "difficulty": 3,
   "difficulty_reason": "約 210 行、一個自訂 class Bird，每步對所有鳥做 O(n²) 鄰居搜尋並混合三條規則；沒有空間索引但需要同時調 3 組半徑與權重才會出現群聚，屬於需要調參的中階。",
   "tags": [
    "自訂 class",
    "鄰居搜尋",
    "隨機",
    "可重現種子",
    "3D",
    "物理模擬",
    "群聚",
    "軌跡"
   ],
   "one_liner": "每隻鳥只看附近的鄰居，照「別太擠、跟著飛、往中間靠」三條規則轉向，整群就自己長出流動的集體軌跡。",
   "how_it_works": [
    "在正方體範圍內用固定種子隨機放 birdCount 隻鳥，每隻給一個隨機方向、速度為 maxSpeed。",
    "每一步先讓每隻鳥掃過所有其他鳥：在分離半徑內累加「遠離」向量（距離平方反比）、在對齊半徑內累加鄰居速度、在聚集半徑內累加鄰居位置。",
    "把三個方向各自單位化，乘上各自權重相加得到轉向量，只允許轉一小步（TurnStrength = 0.1），再把速度限制在 maxSpeed 以內。",
    "所有鳥的新速度都算完後才一起移動（同步更新），碰到邊界就把該軸速度反向並夾回範圍內。",
    "每一步把位置加進該鳥的 Polyline，最後輸出軌跡與最終位置。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 birdCount, steps, boxSize, separationRadius, separationWeight, alignmentRadius, alignmentWeight, cohesionRadius, cohesionWeight, maxSpeed, seed",
    "    輸出 trails, finalPoints",
    "",
    "    // 0. 防呆",
    "    birdCount、steps < 1 或 boxSize、maxSpeed ≤ 0 → 結束",
    "",
    "    // 1. DATA 資料",
    "    隨機數（seed）、鳥清單",
    "",
    "    // 2. INIT 初始",
    "    每隻鳥：範圍內隨機位置、隨機方向，速度 maxSpeed",
    "",
    "    // 3. LOOP 迭代",
    "    重複 steps 次：",
    "      每隻鳥看鄰居算新速度（大家看同一時間點）",
    "      再一起移動",
    "",
    "    // 4. OUTPUT 輸出",
    "    每隻鳥的軌跡 → trails",
    "    最後位置 → finalPoints",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：轉向強度 0.1",
    "  Steer：分離、對齊、聚集加權混合，限 maxSpeed",
    "  UnitOrZero：長度變 1，長度 0 → 回 0",
    "",
    "// ----- Script_Instance 外面 -----",
    "Bird：位置、速度、軌跡；Move 前進、撞邊反彈"
   ],
   "key_params": [
    {
     "name": "birdCount",
     "effect": "鳥越多群越密，但計算量是 n² 成長，超過幾百隻會明顯變慢"
    },
    {
     "name": "steps",
     "effect": "步數越多軌跡越長，群體有時間從隨機狀態收攏成一群或多群"
    },
    {
     "name": "boxSize",
     "effect": "範圍越小越常撞牆反彈，軌跡在盒子裡纏繞得越密"
    },
    {
     "name": "separationRadius / separationWeight",
     "effect": "調大會讓鳥彼此保持距離、群體蓬鬆；太小則擠成一團線"
    },
    {
     "name": "alignmentRadius / alignmentWeight",
     "effect": "調大會讓整群朝同一方向平行飛行，軌跡變成一束束平行的纖維"
    },
    {
     "name": "cohesionRadius / cohesionWeight",
     "effect": "調大會讓鳥往中心收，形成團塊或繞圈的漩渦；太大會縮成一點"
    },
    {
     "name": "maxSpeed",
     "effect": "每步移動距離，越大軌跡越粗放、轉彎半徑越大"
    },
    {
     "name": "seed",
     "effect": "換種子得到不同初始配置，同一種子結果可重現"
    }
   ],
   "csharp_concepts": [
    "自訂 class（Bird，參考型別）",
    "List<Bird>",
    "Vector3d 向量運算與 Unitize",
    "Polyline 累加軌跡",
    "LINQ Select",
    "三元運算子 ? :",
    "const 常數",
    "Random(seed)"
   ],
   "prerequisites": [
    "迴圈與巢狀迴圈",
    "class vs struct（參考型別在 List 內可直接修改）",
    "向量加減與長度",
    "D 家族：代理人與同步更新概念"
   ],
   "teaching_note": "很適合從零實作：規則直觀、每改一個權重就看得到變化。要特別講「先算全部新速度、再一起移動」的同步更新，否則學習者會寫成邊算邊動而產生偏差；另外提醒 n² 成本，先用 60 隻以內示範。",
   "variations": [
    {
     "title": "吸引子／目標點群聚",
     "level": 2,
     "what_changes": "規則：加第四條力",
     "how": "新增 List<Point3d> attractors 輸入，在 Steer 裡找最近的吸引點，加上 (target - me.Position) 單位向量乘 attractWeight。",
     "result": "鳥群會繞著吸引點盤旋、在點與點之間拉出束狀軌跡，可用來控制群聚的空間分布"
    },
    {
     "title": "障礙物迴避（Reynolds steering）",
     "level": 3,
     "what_changes": "規則：加迴避力",
     "how": "輸入 Brep 或 Mesh 障礙物，每步用 ClosestPoint 找最近點，若距離小於 avoidRadius 就加一個背離最近點、與距離成反比的力。",
     "result": "軌跡會繞過量體流動，形成像水流繞柱的分流與渦旋，可做為量體周邊的動線或結構纖維"
    },
    {
     "title": "曲面上的 Boids",
     "level": 3,
     "what_changes": "維度：3D 空間 → 曲面（UV）",
     "how": "移動後用 surface.ClosestPoint 把位置拉回曲面，並把速度投影到該點切平面（扣掉沿法向量的分量），邊界反彈改成 UV 範圍判斷。",
     "result": "在屋頂或立面曲面上長出流線紋理，可直接作為表皮開孔、肋條或鋪面圖樣"
    },
    {
     "title": "2D 平面群聚繪圖",
     "level": 1,
     "what_changes": "維度：3D → 2D",
     "how": "初始化時 Z 設 0、速度 Z 分量設 0，並刪掉 Z 軸反彈；步數拉高、把 trails 用漸層線寬或 Offset 表現。",
     "result": "得到像筆觸或鐵砂紋的平面軌跡繪畫，適合做海報或平面圖樣"
    },
    {
     "title": "向量場引導（混 C03）",
     "level": 3,
     "what_changes": "輸入：外部向量場",
     "how": "在 Steer 裡取鳥所在位置的場向量（例如 C03 VectorField 或 C04 Noise 的方向），乘 fieldWeight 加入轉向。",
     "result": "群聚同時受局部鄰居與全域場影響，軌跡有整體流向又保留局部的聚散"
    },
    {
     "title": "影像控制密度與速度",
     "level": 3,
     "what_changes": "輸入：影像",
     "how": "讀入 Bitmap，依鳥在 XY 的位置取灰階值，用來縮放 maxSpeed 或 separationRadius（亮處快而疏、暗處慢而密）。",
     "result": "軌跡密度對應影像明暗，可做出「用鳥群畫出來」的肖像或地形"
    },
    {
     "title": "空間索引加速（RTree／網格分桶）",
     "level": 4,
     "what_changes": "迴圈：鄰居搜尋",
     "how": "每步把所有鳥的位置放進 RTree 或以 cohesionRadius 為邊長的網格 Dictionary，Steer 只查附近格子，取代掃過整個 List。",
     "result": "可跑上千隻鳥仍流暢，群體尺度能放大到都市或地景"
    },
    {
     "title": "Stigmergy：留痕跡、追痕跡",
     "level": 4,
     "what_changes": "狀態：加上環境記憶",
     "how": "建一個 3D 網格記錄鳥走過的次數（費洛蒙），每步衰減；Steer 多一條力朝附近費洛蒙濃度高的格子轉。",
     "result": "軌跡會自我強化成少數粗壯的主幹與分支，像蟻道或 Physarum，適合做結構纖維路徑"
    },
    {
     "title": "軌跡轉成可製造的纖維／管件",
     "level": 3,
     "what_changes": "輸出：Polyline → 可製造幾何",
     "how": "把 trails 用 Curve.Rebuild 平滑、依局部密度決定 Pipe 半徑，並剔除過短或重疊太多的線；或輸出成 G-code 路徑供 3D 列印。",
     "result": "得到可 3D 列印或纏繞纖維的線性構件群，粗細反映群聚密度"
    },
    {
     "title": "Timer 動畫化即時模擬",
     "level": 3,
     "what_changes": "迴圈：一次跑完 → 每次 SolveInstance 走一步",
     "how": "把 birds 提升為 Script_Instance 欄位，加 reset 輸入；每次執行只做一步並用 Timer 觸發，軌跡只保留最近 N 點。",
     "result": "在 Rhino 視窗即時看到鳥群流動，可邊調權重邊觀察，也能錄成動畫"
    },
    {
     "title": "視野角與個體差異",
     "level": 2,
     "what_changes": "規則：鄰居判定",
     "how": "只把前方 fov 角度內（Vector3d.VectorAngle(me.Velocity, toOther) < fov）的鄰居算進去；每隻鳥的權重再加一點隨機偏差。",
     "result": "群體出現領頭與追隨、分裂與重組，軌跡更像真實椋鳥群"
    },
    {
     "title": "群聚軌跡連成網（混 E／圖結構）",
     "level": 4,
     "what_changes": "輸出：軌跡 → 圖（點＋連線）",
     "how": "每隔 k 步把距離小於 linkRadius 的兩隻鳥位置連一條 Line，累積成空間網格，再用 Kangaroo 或自寫彈簧鬆弛。",
     "result": "形成如蜘蛛網或纖維塔的立體網架，可作裝置或結構概念模型"
    }
   ],
   "project_seeds": [
    {
     "title": "群聚紋理屋頂",
     "brief": "在自由曲面屋頂上跑曲面版 Boids，以天窗位置作吸引子，用軌跡密度決定開孔與肋條。輸出可展開的面板圖樣。",
     "difficulty": 3,
     "combine_with": [
      "C03"
     ]
    },
    {
     "title": "鳥群畫出的肖像海報",
     "brief": "2D Boids 讀入照片灰階控制速度與分離半徑，產生只由軌跡構成的影像。比較不同權重組合的畫風。",
     "difficulty": 2,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "Stigmergy 纖維塔",
     "brief": "在 3D 網格中讓群聚代理人留費洛蒙並互相追蹤，自我強化出主幹纖維，再轉成 Pipe 做 3D 列印模型，致敬 Kokkugia 的 fibrous 系列。",
     "difficulty": 4,
     "combine_with": [
      "D02"
     ]
    },
    {
     "title": "廣場人流與動線模擬",
     "brief": "把鳥換成行人，加入障礙物迴避與出入口吸引子，比較不同家具配置下的軌跡密度熱區，作為廣場設計依據。",
     "difficulty": 4,
     "combine_with": [
      "D03"
     ]
    },
    {
     "title": "千隻代理人的地景流線",
     "brief": "以 RTree 加速把 Boids 擴大到上千隻，在地形 Mesh 上受坡度場引導，軌跡轉為步道與植栽帶配置。",
     "difficulty": 5,
     "combine_with": [
      "C03",
      "C05"
     ]
    },
    {
     "title": "即時互動群聚裝置原型",
     "brief": "用 Timer 做即時模擬，吸引子由滑鼠或 Rhino 點物件拖曳控制，輸出燈光位置序列，模擬 Studio Drift 式的無人機編隊構想。",
     "difficulty": 3,
     "combine_with": []
    }
   ],
   "references": [
    {
     "title": "Flocks, Herds, and Schools: A Distributed Behavioral Model",
     "author": "Craig W. Reynolds",
     "year": "1987",
     "url": "https://dl.acm.org/doi/10.1145/37402.37406"
    },
    {
     "title": "Boids (Flocks, Herds, and Schools: a Distributed Behavioral Model)",
     "author": "Craig W. Reynolds",
     "year": "",
     "url": "https://www.red3d.com/cwr/boids/"
    },
    {
     "title": "Steering Behaviors For Autonomous Characters",
     "author": "Craig W. Reynolds",
     "year": "1999",
     "url": ""
    },
    {
     "title": "Behavioural Production: Autonomous Swarm-Constructed Architecture",
     "author": "Robert Stuart-Smith",
     "year": "2016",
     "url": "https://onlinelibrary.wiley.com/doi/abs/10.1002/ad.2024"
    },
    {
     "title": "Behavioural Production: Semi-Autonomous Approaches to Architectural Design, Robotic Fabrication and Collective Robotic Construction",
     "author": "Robert Stuart-Smith",
     "year": "",
     "url": "https://www.routledge.com/Behavioural-Production-Semi-Autonomous-Approaches-to-Architectural-Design-Robotic-Fabrication-and-Collective-Robotic-Construction/Stuart-Smith/p/book/9780367463427"
    },
    {
     "title": "Aerial additive manufacturing with multiple autonomous robots",
     "author": "Zhang et al.（Kovac、Stuart-Smith 等）",
     "year": "2022",
     "url": "https://www.nature.com/articles/s41586-022-04988-4"
    },
    {
     "title": "Culebra（Grasshopper 代理人行為函式庫）",
     "author": "Luis Quinones（elQuixote）",
     "year": "",
     "url": "https://github.com/elQuixote/Culebra"
    }
   ]
  },
  {
   "id": "D02",
   "name_zh": "Physarum 黏菌",
   "name_en": "Physarum Transport Network",
   "family": "D",
   "family_name": "代理人",
   "file": "D02_Physarum.cs",
   "loc": 210,
   "logic": [
    "迭代模擬"
   ],
   "data_structure": [
    "粒子",
    "網格"
   ],
   "difficulty": 3,
   "difficulty_reason": "約 210 行、一個 Agent class，但同時要管理「粒子」與「痕跡網格」兩套資料、雙緩衝擴散與邊界環繞，而且形態對 sensorAngle／sensorDistance／decay 非常敏感，需要大量調參。",
   "tags": [
    "自訂 class",
    "網格擴散",
    "隨機",
    "可重現種子",
    "開放生長",
    "鄰居搜尋"
   ],
   "one_liner": "上千隻只會「聞、轉、走、留」的小蟲在網格上互相跟隨彼此留下的氣味，最後自己織出一張像葉脈或交通網的網絡。",
   "how_it_works": [
    "建立 gridSize × gridSize 的痕跡場 trail[x,y]，並把代理人隨機撒在中央的圓裡、面向隨機。",
    "聞：每個代理人讀取左、前、右三個感測器位置（離身體 sensorDistance 格、張開 sensorAngle）的痕跡濃度。",
    "轉：前面最濃就直走；左或右比較濃就轉過去 turnAngle；前面最淡就隨機左轉或右轉。",
    "走與留：往前走一格（超出邊界從對面出來），並在腳下的格子加上 DepositAmount 的痕跡。",
    "散：整張痕跡場做 3×3 平均（擴散），再乘上 (1 − decay) 讓舊痕跡變淡；重複 steps 次。",
    "輸出：把痕跡值正規化成 0–1，接 Gradient 為 gridPoints 上色。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 gridSize, agentCount, steps, sensorAngle, sensorDistance, turnAngle, decay, seed",
    "    輸出 gridPoints, trailValues, agentPoints",
    "",
    "    // 0. 防呆",
    "    gridSize < 3 或 agentCount、steps < 1 → 結束",
    "    decay 限 0～1",
    "",
    "    // 1. DATA 資料",
    "    隨機數（seed）、痕跡網格、代理人清單",
    "    sensorAngle、turnAngle 換弧度",
    "",
    "    // 2. INIT 初始",
    "    代理人散在中央圓內，面向隨機",
    "",
    "    // 3. LOOP 迭代",
    "    重複 steps 次：",
    "      每個代理人聞、轉、走一格、腳下留痕跡",
    "      痕跡擴散再變淡",
    "",
    "    // 4. OUTPUT 輸出",
    "    最濃的當 1，濃度換成 0～1",
    "    每格中心點 → gridPoints",
    "    每格濃度 → trailValues",
    "    代理人位置 → agentPoints",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：每步留痕跡量 5",
    "  SmellAndTurn：左前右聞，往濃的轉",
    "  SpreadAndFade：和周圍 8 格平均，再乘 (1 − decay)",
    "  ReadTrail：讀某方向、某距離那一格的濃度",
    "  WrapIndex：超出邊界從對面回來",
    "",
    "// ----- Script_Instance 外面 -----",
    "Agent：位置、面向；MoveForward 走一格"
   ],
   "key_params": [
    {
     "name": "sensorAngle",
     "effect": "感測器張開越大，代理人越容易轉向，網絡越細碎、格網越密；越小則形成長而直的主幹。"
    },
    {
     "name": "sensorDistance",
     "effect": "感測距離越遠，代理人「看」得越遠，網絡的孔洞（lacunae）越大、線條越粗疏。"
    },
    {
     "name": "turnAngle",
     "effect": "轉彎角度與 sensorAngle 的比例決定圖樣類型：小轉角偏向連續網絡，大轉角偏向斑點或迷宮紋。"
    },
    {
     "name": "decay",
     "effect": "痕跡消失越快，只有常被走的路徑能留下，網絡越精簡；越慢則整片模糊成團。"
    },
    {
     "name": "agentCount",
     "effect": "代理人越多，網絡越粗、越連續；太少會斷裂成零散線段。"
    },
    {
     "name": "steps",
     "effect": "步數越多，網絡從一團霧逐漸收斂成清楚的線網，並持續緩慢重組。"
    }
   ],
   "csharp_concepts": [
    "double[,] 二維陣列",
    "自訂 class Agent",
    "List<Agent>",
    "雙緩衝（寫到 newTrail 再換回）",
    "取餘數環繞 WrapIndex",
    "三角函數 Math.Cos／Math.Sin",
    "RhinoMath.ToRadians",
    "Random(seed)"
   ],
   "prerequisites": [
    "巢狀迴圈",
    "class 與欄位",
    "角度／弧度與方向向量",
    "Game of Life 的網格鄰居概念"
   ],
   "teaching_note": "很適合從零實作：規則只有五句，學習者能一邊改 sensorAngle 一邊看圖樣劇烈變化，是解釋「湧現」最直觀的範例。要提醒雙緩衝（不能邊讀邊寫同一張網格）與 decay 範圍；gridSize 超過 200、agentCount 上萬時 GH 會明顯變慢，建議 100×100、2000 隻。",
   "variations": [
    {
     "title": "食物點吸引（Tero 式網絡）",
     "level": 2,
     "what_changes": "輸入／狀態",
     "how": "新增 List<Point3d> foodPoints 輸入，每一步在食物點所在格子持續加上高濃度痕跡（例如 trail[x,y] += 50），讓代理人被吸引到食物之間。",
     "result": "網絡會收斂成連接各食物點的交通網，類似 Tero 2010 東京鐵路網實驗，可當作站點／節點連線的設計工具。"
    },
    {
     "title": "障礙與邊界遮罩",
     "level": 2,
     "what_changes": "規則",
     "how": "輸入一條封閉邊界曲線與障礙曲線，事先算出 bool[,] blocked；代理人要走進 blocked 格就隨機轉向不前進，且擴散時 blocked 格強制設為 0。",
     "result": "網絡只在基地內生長並繞過既有建物，得到依地形與基地輪廓的路徑網。"
    },
    {
     "title": "影像引導的濃度場",
     "level": 2,
     "what_changes": "輸入",
     "how": "讀入一張灰階圖（System.Drawing.Bitmap），把亮度乘上權重加進感測值：sense = trail + imageWeight × brightness，讓代理人偏好亮處。",
     "result": "網絡會沿著影像的亮區聚集，可用衛星圖、綠地圖或人口密度圖驅動紋理。"
    },
    {
     "title": "多物種互斥",
     "level": 3,
     "what_changes": "狀態／規則",
     "how": "準備兩張痕跡場 trailA、trailB，Agent 加上 species 欄位；每個物種感測時用 自己的痕跡 − 對方的痕跡，並各自沉積到自己的場。",
     "result": "兩種顏色的網絡互相避開、交錯成領域分明的斑紋，類似 Sage Jenson 的多物種作品。"
    },
    {
     "title": "3D 體素黏菌",
     "level": 4,
     "what_changes": "維度",
     "how": "把 trail 改成 double[,,]，Agent 加上 Z 與俯仰角；感測器改為前方一個＋圍繞前方的四到六個，擴散改 3×3×3 平均，最後用 Marching Cubes（C05）或 Dendro 轉成網格。",
     "result": "得到立體的海綿／骨架網絡，可作結構格柵、燈具或雕塑。"
    },
    {
     "title": "曲面上的黏菌",
     "level": 3,
     "what_changes": "維度",
     "how": "把網格對應到曲面的 UV 參數空間，痕跡場仍用 2D 陣列，但輸出時用 surface.PointAt(u,v) 取得 3D 點；如要等距，可用曲面曲率修正每步步長。",
     "result": "網紋貼附在屋頂或殼體表面，可轉成立面開孔或肋梁。"
    },
    {
     "title": "痕跡場轉等高線／可製造曲線",
     "level": 3,
     "what_changes": "輸出",
     "how": "把 trailValues 丟給 Marching Squares（C05）取某個門檻的等值線，再 Offset、Boolean 成板件，送雷切或 CNC。",
     "result": "得到可切割的有機網狀鏤空板，可作隔屏或立面板。"
    },
    {
     "title": "代理人軌跡轉粗細不一的管線",
     "level": 3,
     "what_changes": "輸出",
     "how": "在 Agent 裡記錄 List<Point3d> path，模擬結束後抽稀並依所在格子的痕跡值決定管徑，用 Pipe 或 Mesh Pipe 建模。",
     "result": "主要路徑粗、次要路徑細的樹枝狀管網，可 3D 列印成燈罩或珠寶。"
    },
    {
     "title": "動畫化（Timer 逐步顯示）",
     "level": 2,
     "what_changes": "迴圈",
     "how": "把 trail 與 agents 移到 class 欄位並加上 reset 輸入，每次 RunScript 只跑 1–5 步，搭配 GH Timer 更新。",
     "result": "可以看到網絡從一團霧長出主幹再重組的過程，方便調參與簡報錄影。"
    },
    {
     "title": "吸引子調變參數",
     "level": 3,
     "what_changes": "規則",
     "how": "新增吸引點，依代理人到吸引點的距離內插 sensorAngle 與 decay（近處細密、遠處粗疏）。",
     "result": "同一張網絡中出現由密到疏的漸層，適合做立面透光率漸變。"
    },
    {
     "title": "混合 Voronoi／Delaunay 比較",
     "level": 3,
     "what_changes": "混合其他家族",
     "how": "用相同食物點另外算 Delaunay／最小生成樹，將兩者疊圖並計算總長度與平均最短路徑，比較效率與冗餘。",
     "result": "得到可量化的網絡評估圖表，把黏菌當作路網最佳化的候選方案產生器。"
    },
    {
     "title": "痕跡高度場地形",
     "level": 2,
     "what_changes": "輸出",
     "how": "把 trailValues 乘上高度係數當作 Z，用 Mesh 或 Surface from Points 建出地形，濃度高處隆起或凹下。",
     "result": "得到有溝渠網絡的景觀地形，可做雨水路徑或步道系統的概念模型。"
    }
   ],
   "project_seeds": [
    {
     "title": "校園步道網絡生成器",
     "brief": "以校園建物出入口當食物點、既有建物當障礙，用黏菌模擬生成候選步道網，再和現況步道比較總長度與繞行距離。",
     "difficulty": 2,
     "combine_with": [
      "D03"
     ]
    },
    {
     "title": "黏菌鏤空隔屏",
     "brief": "在立面範圍內跑 2D 黏菌，以日照或視線吸引子調變密度，用 Marching Squares 取等值線轉成可雷切的鏤空板，做 1:1 局部樣品。",
     "difficulty": 3,
     "combine_with": [
      "C05"
     ]
    },
    {
     "title": "多物種都市綠帶",
     "brief": "以綠地與水系當兩個物種的食物，模擬兩張互相避讓的網絡，作為藍綠帶系統的規劃草案，呼應 ecoLogicStudio 的做法。",
     "difficulty": 3,
     "combine_with": [
      "C03"
     ]
    },
    {
     "title": "3D 黏菌結構格柵",
     "brief": "在體素空間中以支撐點與載重點為食物，長出立體網絡，再用等值面轉成網格並 3D 列印，比較與拓撲最佳化結果的差異。",
     "difficulty": 4,
     "combine_with": [
      "C05",
      "D01"
     ]
    },
    {
     "title": "黏菌網絡 × 人流驗證",
     "brief": "先用黏菌生成地區路網，再把網絡交給社會力人流模擬跑尖峰人潮，檢驗壅塞點並回饋修改食物點權重，形成雙向迭代設計流程。",
     "difficulty": 5,
     "combine_with": [
      "D03"
     ]
    }
   ],
   "references": [
    {
     "title": "Characteristics of Pattern Formation and Evolution in Approximations of Physarum Transport Networks",
     "author": "Jeff Jones",
     "year": "2010",
     "url": "https://cognet.mit.edu/journal/10.1162/artl.2010.16.2.16202"
    },
    {
     "title": "Rules for Biologically Inspired Adaptive Network Design",
     "author": "A. Tero, S. Takagi, T. Saigusa, K. Ito, D. P. Bebber, M. D. Fricker, K. Yumiki, R. Kobayashi, T. Nakagaki",
     "year": "2010",
     "url": "https://www.science.org/doi/10.1126/science.1177894"
    },
    {
     "title": "From Pattern Formation to Material Computation: Multi-agent Modelling of Physarum Polycephalum",
     "author": "Jeff Jones",
     "year": "",
     "url": "https://us.amazon.com/Pattern-Formation-Material-Computation-Polycephalum/dp/3319386514"
    },
    {
     "title": "physarum（36 Points 等作品與說明）",
     "author": "Sage Jenson",
     "year": "",
     "url": "https://cargocollective.com/sagejenson/physarum"
    },
    {
     "title": "Understanding the Physarum Simulation",
     "author": "Deniz Bicer",
     "year": "2024",
     "url": "https://denizbicer.com/202408-UnderstandingPhysarum.html"
    },
    {
     "title": "Physarum-inspired Network Optimization: A Review",
     "author": "Yahui Sun",
     "year": "",
     "url": "https://arxiv.org/pdf/1712.02910"
    }
   ]
  },
  {
   "id": "D03",
   "name_zh": "Pedestrian 人流模擬",
   "name_en": "Pedestrian Simulation (Social Force Model)",
   "family": "D",
   "family_name": "代理人",
   "file": "D03_Pedestrian.cs",
   "loc": 207,
   "logic": [
    "迭代模擬"
   ],
   "data_structure": [
    "粒子"
   ],
   "difficulty": 3,
   "difficulty_reason": "約 207 行、一個 Person class，要把三種力相加再積分成速度與位置，人推人是 O(n²) 的鄰居搜尋，且多個力道常數需互相平衡才不會穿牆或卡死，屬於需調參的中階模擬。",
   "tags": [
    "物理模擬",
    "鄰居搜尋",
    "自訂 class",
    "吸引子控制",
    "隨機",
    "可重現種子"
   ],
   "one_liner": "每個人都被「想去目的地」的力拉著走、被旁人和障礙物推開，幾十個人一起算，就能看到繞行、排隊與瓶頸壅塞。",
   "how_it_works": [
    "在每個出發點周圍隨機站 peoplePerStart 個人，全部投影到 XY 平面。",
    "目標力：（想要的速度 − 現在的速度）÷ 反應時間，讓人逐漸加速到 walkSpeed 並朝向目的地。",
    "人推人：對 6 倍半徑內的每個人，依身體間空隙 gap 以 exp(−gap / PushRange) 計算推開的力。",
    "障礙力：靠近圓形障礙時被推開，並加上一個垂直分量，往目的地那一側繞過去。",
    "先算完所有人的力，再一起更新：速度 += 力 × 時間步，限制最高速度，位置 += 速度 × 時間步，並記錄軌跡。",
    "到達目的地附近就停下；全部抵達或跑完 steps 就結束，輸出每個人的軌跡 Polyline。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 startPoints, peoplePerStart, goal, obstacleCenters, obstacleRadius, personRadius, walkSpeed, steps, seed",
    "    輸出 trails, finalPoints",
    "",
    "    // 0. 防呆",
    "    沒 startPoints，或 peoplePerStart、steps < 1 → 結束",
    "    沒 obstacleCenters → 空清單",
    "    personRadius、walkSpeed ≤ 0 → 預設值",
    "",
    "    // 1. DATA 資料",
    "    隨機數（seed）、人清單",
    "",
    "    // 2. INIT 初始",
    "    每個 startPoints 周圍隨機站 peoplePerStart 個人",
    "    goal 壓到 XY 平面",
    "",
    "    // 3. LOOP 迭代",
    "    重複 steps 次：",
    "      每人三種力相加（抵達的不動）",
    "      再一起移動",
    "      全部抵達 → 停",
    "",
    "    // 4. OUTPUT 輸出",
    "    每人軌跡 → trails",
    "    最後位置 → finalPoints",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：時間步長、反應時間、推力大小等常數",
    "  GoalForce：朝 goal 加速",
    "  PeopleForce：被別人推開，越近越大；太遠不管",
    "  ObstacleForce：被障礙推開，再往 goal 那一側繞；太遠不管",
    "",
    "// ----- Script_Instance 外面 -----",
    "Person：位置、速度、軌跡；Move 力 → 速度 → 位置"
   ],
   "key_params": [
    {
     "name": "peoplePerStart",
     "effect": "人數越多，人推人的力越明顯，瓶頸處開始出現排隊與擠壓；計算量隨人數平方成長。"
    },
    {
     "name": "walkSpeed",
     "effect": "想走的速度越快，越容易在出口前擠成扇形；Helbing 稱之為「越急越慢」。"
    },
    {
     "name": "personRadius",
     "effect": "身體越大，通道相對越窄、越容易堵塞，也可以用來模擬推行李或輪椅。"
    },
    {
     "name": "obstacleRadius",
     "effect": "障礙越大，繞行軌跡越寬、兩側分流越明顯。"
    },
    {
     "name": "obstacleCenters 位置",
     "effect": "障礙放在出口前方適當位置時，可以把人流切成兩股，反而減少堵塞。"
    },
    {
     "name": "steps",
     "effect": "模擬時間（每步 0.1 秒）；太短時人還沒到目的地，軌跡看不出分流。"
    }
   ],
   "csharp_concepts": [
    "Vector3d 加減與內積",
    "Vector3d.CrossProduct 求垂直方向",
    "自訂 class Person",
    "List<Vector3d> 先算後更新",
    "Polyline 軌跡",
    "LINQ All／Count／Select",
    "const 常數欄位",
    "Math.Exp 指數衰減"
   ],
   "prerequisites": [
    "粒子系統（力 → 速度 → 位置）",
    "class 與 List",
    "向量長度、單位化與內積",
    "D01 Boids 的鄰居力概念"
   ],
   "teaching_note": "適合從零實作，尤其能和懸垂鏈粒子系統的「力 → 速度 → 位置」接起來。要強調「先算所有人的力、再一起移動」的同步更新，否則先動的人會影響後算的人；也要提醒障礙力常數必須大於目標力，否則人會穿過障礙。人數超過 300 時 O(n²) 會變慢，可順勢引出空間格網索引。",
   "variations": [
    {
     "title": "牆面與走廊（線段障礙）",
     "level": 2,
     "what_changes": "輸入／規則",
     "how": "新增 List<Curve> walls 輸入，對每道牆用 curve.ClosestPoint 找最近點，以與圓形障礙相同的指數衰減推開人。",
     "result": "可以用平面圖的牆線直接模擬走廊、門口與樓梯口的人流。"
    },
    {
     "title": "多出口疏散",
     "level": 3,
     "what_changes": "規則",
     "how": "把 goal 改成 List<Point3d> exits，每個人選最近（或加上擁擠度懲罰後成本最低）的出口，並統計各出口抵達時間。",
     "result": "得到疏散時間與各出口負荷，可比較不同出口配置的安全性。"
    },
    {
     "title": "雙向對流與車道形成",
     "level": 2,
     "what_changes": "狀態",
     "how": "讓兩組人從兩端出發、目的地互換，其餘規則不變；可以加一點隨機擾動力。",
     "result": "會自然出現同向行人排成一條條「車道」的自組織現象，適合解說湧現。"
    },
    {
     "title": "導航場取代直線目標",
     "level": 4,
     "what_changes": "規則",
     "how": "先在網格上以 BFS／Dijkstra 從目的地往外算距離場，目標力改為沿距離場梯度下降的方向，而不是直指目的地。",
     "result": "人會在複雜平面（U 型走廊、多房間）中正確繞路，不會卡在凹角。"
    },
    {
     "title": "空間格網加速",
     "level": 3,
     "what_changes": "資料結構",
     "how": "用 Dictionary<(int,int), List<Person>> 以 personRadius×6 為格子大小做空間雜湊，人推人只查鄰近 9 格。",
     "result": "人數可從數十人擴增到上千人，仍維持可互動的速度。"
    },
    {
     "title": "人流熱圖",
     "level": 2,
     "what_changes": "輸出",
     "how": "建立 int[,] 計數網格，每一步把每個人所在格子 +1，最後輸出網格點與正規化計數，接 Gradient 上色。",
     "result": "得到停留時間與通行密度的熱圖，可找出壅塞點與主要動線。"
    },
    {
     "title": "熱圖轉鋪面或屋頂形",
     "level": 3,
     "what_changes": "輸出／混合其他家族",
     "how": "把熱圖值當作高度或密度：高密度區提高屋頂、或以 Voronoi（E 家族）點密度對應鋪面分割大小。",
     "result": "動線越集中處屋頂越高、鋪面越細碎，形成由人流驅動的地景或頂棚。"
    },
    {
     "title": "曲面／多樓層",
     "level": 4,
     "what_changes": "維度",
     "how": "把模擬移到曲面 UV 空間或 Mesh 上（每步後用 mesh.ClosestPoint 投影回表面），樓梯以連接點切換樓層。",
     "result": "可模擬坡道、看台與多樓層車站的垂直動線。"
    },
    {
     "title": "吸引點：展品與店面",
     "level": 2,
     "what_changes": "輸入／規則",
     "how": "加入 List<Point3d> attractions 與停留時間，人在路途中若經過吸引點半徑內，有機率轉向並停留數秒再繼續前往目的地。",
     "result": "得到展場或商店街的停留分布，評估展品配置是否造成堵塞。"
    },
    {
     "title": "動畫化與即時調整",
     "level": 2,
     "what_changes": "迴圈",
     "how": "把 people 放到 class 欄位，搭配 GH Timer 每次只跑數步，並允許使用者拖動障礙點即時看人流改變。",
     "result": "可以像 MassMotion 那樣即時觀察動線，方便設計討論。"
    },
    {
     "title": "軌跡轉成可製造的地景",
     "level": 3,
     "what_changes": "輸出",
     "how": "把所有軌跡平滑後依重疊次數加粗，用 Offset 與 Boolean Union 合併成步道輪廓，再擠出成地景模型或鋪面切割線。",
     "result": "得到從使用行為推導出的「慾望路徑」步道系統，可 CNC 或雷切模型。"
    },
    {
     "title": "Space syntax 可見度加權",
     "level": 4,
     "what_changes": "規則／混合其他家族",
     "how": "先以視線分析計算每個網格點的可見範圍，人在選路時偏好可見度高的方向（對目標力加上可見度梯度）。",
     "result": "人流更貼近真實行為，會集中在視野開闊的主軸上。"
    }
   ],
   "project_seeds": [
    {
     "title": "教室大樓下課人流診斷",
     "brief": "把系館平面的牆與樓梯口轉成障礙與出口，模擬下課同時離開的人流，輸出熱圖找出瓶頸並提出修改方案。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "出口前的柱子：越急越慢實驗",
     "brief": "重現 Helbing 等人的出口瓶頸實驗，系統性改變出口寬度、柱子位置與人數，繪製疏散時間圖表並轉成設計準則。",
     "difficulty": 3,
     "combine_with": []
    },
    {
     "title": "人流熱圖生成的車站頂棚",
     "brief": "以轉乘車站為基地模擬尖峰人流，熱圖高處對應頂棚升起或開天窗，產出可建模的屋頂曲面。",
     "difficulty": 4,
     "combine_with": [
      "C04",
      "E01"
     ]
    },
    {
     "title": "展場動線與停留配置最佳化",
     "brief": "以吸引點模擬觀展停留，再用搜尋或演化演算法調整展品位置，使平均停留時間最長且最大密度低於門檻。",
     "difficulty": 4,
     "combine_with": [
      "D01"
     ]
    },
    {
     "title": "多樓層導航場疏散模擬",
     "brief": "以 Dijkstra 導航場加空間格網加速，模擬上千人的多樓層疏散，比較不同樓梯配置，並與商業軟體結果對照驗證。",
     "difficulty": 5,
     "combine_with": [
      "D02"
     ]
    }
   ],
   "references": [
    {
     "title": "Social force model for pedestrian dynamics（Physical Review E）",
     "author": "Dirk Helbing, Péter Molnár",
     "year": "1995",
     "url": ""
    },
    {
     "title": "Simulating dynamical features of escape panic（Nature）",
     "author": "Dirk Helbing, Illés Farkas, Tamás Vicsek",
     "year": "2000",
     "url": ""
    },
    {
     "title": "Modelling the evolution of human trail systems（Nature）",
     "author": "Dirk Helbing, Joachim Keltsch, Péter Molnár",
     "year": "1997",
     "url": ""
    },
    {
     "title": "Natural movement: or, configuration and attraction in urban pedestrian movement（Environment and Planning B）",
     "author": "Bill Hillier, Alan Penn, Julienne Hanson, T. Grajewski, J. Xu",
     "year": "1993",
     "url": ""
    },
    {
     "title": "How simple rules determine pedestrian behavior and crowd disasters（PNAS）",
     "author": "Mehdi Moussaïd, Dirk Helbing, Guy Theraulaz",
     "year": "2011",
     "url": ""
    }
   ]
  },
  {
   "id": "E01",
   "name_zh": "圓填充",
   "name_en": "Circle Packing",
   "family": "E",
   "family_name": "排列與鬆弛",
   "file": "E01_CirclePacking.cs",
   "loc": 168,
   "logic": [
    "迭代模擬"
   ],
   "data_structure": [
    "粒子",
    "幾何"
   ],
   "difficulty": 2,
   "difficulty_reason": "168 行、沒有自訂 class，只用兩個平行 List 與一個雙層迴圈兩兩互推，加上單一收斂門檻；不需空間索引，C# 基礎程度能讀懂，唯一陷阱是 Point3d 為 struct 必須整個寫回。",
   "tags": [
    "隨機",
    "可重現種子",
    "收斂",
    "鄰居搜尋",
    "物理模擬",
    "最佳化"
   ],
   "one_liner": "先把一堆大小不一的圓隨便丟在一起，再讓重疊的圓互相推開、超出邊界的拉回來，推到幾乎不重疊為止。",
   "how_it_works": [
    "隨機產生 circleCount 個圓：圓心散在邊界中心附近，半徑介於 minRadius 與 maxRadius 之間（一開始一定大量重疊）。",
    "每一輪檢查所有圓的配對：兩圓重疊量 = r1 + r2 − 距離，若大於 0，兩個圓沿連線各往反方向退一半重疊量。",
    "檢查每個圓是否超出外圍邊界圓，超出多少就往圓心拉回多少。",
    "把這一輪累積的位移一次套用（先算完再移動，避免順序影響結果）。",
    "重複直到總重疊量小於 0.001（收斂）或迭代次數用完，輸出圓與剩餘重疊量。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 circleCount, minRadius, maxRadius, boundaryRadius, iterations, seed",
    "    輸出 circles, totalOverlap",
    "",
    "    // 0. 防呆",
    "    數量或半徑不合理 → 結束",
    "    maxRadius < minRadius → 等於 minRadius",
    "",
    "    // 1. DATA 資料",
    "    隨機數（seed）、圓心清單、半徑清單",
    "",
    "    // 2. INIT 初始",
    "    圓心隨機散在中心附近",
    "    半徑在 minRadius～maxRadius 隨機",
    "",
    "    // 3. LOOP 迭代",
    "    重複 iterations 次：",
    "      推一次，量這輪總重疊量",
    "      總重疊量 < 0.001 → 停",
    "",
    "    // 4. OUTPUT 輸出",
    "    圓心＋半徑 → 圓 → circles",
    "    重新量最後總重疊量 → totalOverlap",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：收斂門檻 0.001",
    "  PushApart：重疊各退一半、出界拉回，算完一起移",
    "  MeasureOverlap：圓與圓、圓超出邊界的重疊量加總"
   ],
   "key_params": [
    {
     "name": "circleCount",
     "effect": "圓越多越擠；數量超過邊界容量時永遠無法收斂，totalOverlap 會停在大於 0。"
    },
    {
     "name": "minRadius / maxRadius",
     "effect": "兩者差距越大，大圓之間的縫越能被小圓填滿，畫面越有層次；相等時接近六角最密排列。"
    },
    {
     "name": "boundaryRadius",
     "effect": "邊界越小越擠；與圓總面積的比值決定「填充率」能否達成。"
    },
    {
     "name": "iterations",
     "effect": "推的次數上限；太少會殘留重疊，太多只是浪費時間（收斂後會自動提早停）。"
    },
    {
     "name": "seed",
     "effect": "換種子得到不同的排列，但同一種子結果可重現。"
    }
   ],
   "csharp_concepts": [
    "List<Point3d>",
    "List<double>",
    "Vector3d 陣列累積位移",
    "雙層 for 迴圈（second = first + 1）",
    "Vector3d.Unitize()",
    "struct 值型別寫回",
    "const 常數",
    "提早 break 收斂"
   ],
   "prerequisites": [
    "迴圈與 List",
    "Point3d / Vector3d 運算",
    "Point3d 是 struct",
    "Random 與種子"
   ],
   "teaching_note": "非常適合從零實作：規則只有兩條、結果立即可見，而且能順便示範「收斂」與「先累積再套用」的觀念。要特別提醒 N² 的兩兩比對在 1000 顆以上會明顯變慢，這正好是引出 E02 網格空間索引的好時機。",
   "variations": [
    {
     "title": "任意曲線邊界",
     "level": 2,
     "what_changes": "規則 2（邊界拉回）",
     "how": "新增 Curve boundary 輸入，用 boundary.Contains() 判斷圓心是否在內、用 ClosestPoint 找最近邊界點，把圓心拉回到離邊界至少一個半徑的位置。",
     "result": "圓填滿建築平面、基地或立面開口等任意形狀，而非只能填圓形。"
    },
    {
     "title": "吸引子控制半徑",
     "level": 2,
     "what_changes": "初始狀態（半徑分配）",
     "how": "新增 List<Point3d> attractors，每個圓的半徑改為依圓心到最近吸引子的距離線性映射到 minRadius–maxRadius，並在每輪推完後重算。",
     "result": "吸引子附近圓小而密、遠處圓大而疏，形成漸變的開孔或透光密度。"
    },
    {
     "title": "影像驅動半徑",
     "level": 3,
     "what_changes": "輸入（影像）",
     "how": "讀入 Bitmap，用圓心對應的像素亮度決定目標半徑；暗處小圓、亮處大圓，每輪依新位置重新取樣。",
     "result": "用圓的大小重現照片或灰階圖，可做立面圖像化開孔或海報。"
    },
    {
     "title": "曲面上 circle packing",
     "level": 3,
     "what_changes": "維度（平面 → 曲面）",
     "how": "每輪互推後用 Surface.ClosestPoint 把圓心拉回曲面，並用該點的法向量建立 Plane 產生 Circle；距離改用 3D 距離近似。",
     "result": "圓貼附在自由曲面上，可當成曲面立面的開孔或面板配置。"
    },
    {
     "title": "3D 球體堆疊",
     "level": 3,
     "what_changes": "維度（2D → 3D）",
     "how": "初始圓心加上隨機 Z，邊界改成球或 Brep（用 IsPointInside），輸出 Sphere；互推公式完全不用改。",
     "result": "得到球體最密堆疊、泡泡團或量體內部的空腔配置。"
    },
    {
     "title": "網格空間索引加速",
     "level": 4,
     "what_changes": "迴圈（鄰居搜尋）",
     "how": "仿照 E02 以 2×maxRadius 為格子大小建立 Dictionary<(int,int), List<int>>，每輪只比對同格與相鄰 8 格的圓。",
     "result": "可在互動速度下處理數千到上萬個圓，適合大面積立面。"
    },
    {
     "title": "貪婪插入式填充（先大後小）",
     "level": 2,
     "what_changes": "規則（改成放置與拒絕，不互推）",
     "how": "照 Tyler Hobbs 的做法：由大到小依序隨機試放，與既有圓重疊就放棄，連續失敗 N 次換下一個尺寸；完全不需要迭代鬆弛。",
     "result": "圓彼此完全不重疊、間隙隨機，視覺上更像手作拼貼。"
    },
    {
     "title": "成長式填充",
     "level": 2,
     "what_changes": "狀態（半徑隨時間變大）",
     "how": "每輪在空位新增小圓，所有圓的半徑每輪 +Δ，碰到其他圓或邊界就停止成長（加一個 bool[] isGrowing）。",
     "result": "圓一邊出現一邊長大，最後彼此相切，適合做成動畫。"
    },
    {
     "title": "Timer 動畫化",
     "level": 3,
     "what_changes": "迴圈（由一次算完改成逐步）",
     "how": "把 centers、radii 移到 class 欄位，每次 RunScript 只呼叫一次 PushApart，reset 輸入為 true 時才重新初始化，搭配 Timer 元件。",
     "result": "即時看到圓被推開、慢慢收斂的過程，便於展示與調參。"
    },
    {
     "title": "輸出可製造開孔板",
     "level": 3,
     "what_changes": "輸出（轉成可製造幾何）",
     "how": "每個圓半徑縮小 gap/2 作為最小肋寬，輸出成 Curve 給雷射切割，或與板材 Brep 做布林差集，並在 Print 中回報開孔率。",
     "result": "可直接送雷切或 CNC 的穿孔板，肋寬受控不會斷裂。"
    },
    {
     "title": "Circle packing → 加權 Voronoi",
     "level": 4,
     "what_changes": "混合其他家族（Voronoi／Power diagram）",
     "how": "以收斂後的圓心為種子、半徑為權重做 power diagram（或簡化成一般 Voronoi 後向內偏移），得到大小不一的多邊形單元。",
     "result": "得到大小與圓對應的蜂巢／泡泡狀分割，可做鋪面或結構網格。"
    },
    {
     "title": "Apollonian 遞迴填充",
     "level": 3,
     "what_changes": "規則（迭代 → 遞迴）",
     "how": "改用 Descartes 圓定理：從三個互切圓出發，遞迴計算每個空隙中與三圓相切的新圓，半徑小於門檻就停止。",
     "result": "所有圓精確相切、無限細分的分形圖樣（Apollonian gasket）。"
    }
   ],
   "project_seeds": [
    {
     "title": "漸變透光的 circle packing 立面",
     "brief": "在建築立面輪廓內做 circle packing，依室內機能（辦公、樓梯、廁所）設定吸引子控制開孔大小，輸出可雷切的穿孔鋁板並計算每區開孔率。",
     "difficulty": 2,
     "combine_with": [
      "E02"
     ]
    },
    {
     "title": "影像轉圓點的巨型壁面",
     "brief": "讀入一張基地歷史照片，以亮度控制圓半徑做 circle packing，輸出成 CNC 鑽孔或不同尺寸圓形磁磚的施工圖與數量表。",
     "difficulty": 3,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "公園樹冠與林下空間配置",
     "brief": "把不同樹種視為不同半徑的圓，在基地邊界內做 packing，並用步道曲線作為排斥邊界，比較不同密度下的遮蔭率。",
     "difficulty": 3,
     "combine_with": [
      "E02",
      "D01"
     ]
    },
    {
     "title": "自由曲面上的圓形採光頂棚",
     "brief": "在 NURBS 雙曲面上做 circle packing，半徑受日照分析結果控制，最後把圓轉成平面化的圓形玻璃或 ETFE 氣枕並檢查間距。",
     "difficulty": 4,
     "combine_with": [
      "C03"
     ]
    },
    {
     "title": "3D 泡泡空間：球體堆疊到多面體單元",
     "brief": "在建築量體內做不同大小的球體堆疊，再以球心做 3D Voronoi 得到類似 Water Cube 的泡沫多面體結構，並輸出桿件與節點。",
     "difficulty": 5,
     "combine_with": [
      "E02"
     ]
    }
   ],
   "references": [
    {
     "title": "Packing Circles and Spheres on Surfaces",
     "author": "Alexander Schiftner, Mathias Höbinger, Johannes Wallner, Helmut Pottmann",
     "year": "2009",
     "url": "https://www.geometrie.tuwien.ac.at/geom/ig/pottmann/oldpub/2009/packing09/packing09.html"
    },
    {
     "title": "A Randomized Approach to Circle Packing",
     "author": "Tyler Hobbs",
     "year": "2016",
     "url": "https://tylerxhobbs.com/essays/2016/a-randomized-approach-to-cicle-packing"
    },
    {
     "title": "Coding Challenge #50.1: Animated Circle Packing",
     "author": "Daniel Shiffman（The Coding Train）",
     "year": "",
     "url": "https://www.youtube.com/watch?v=QHEQuoIKgNE"
    },
    {
     "title": "Apollonian gasket（維基百科）",
     "author": "",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Apollonian_gasket"
    },
    {
     "title": "Circle packing in a circle（維基百科）",
     "author": "",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Circle_packing_in_a_circle"
    }
   ]
  },
  {
   "id": "E02",
   "name_zh": "Poisson 圓盤取樣",
   "name_en": "Poisson Disk Sampling",
   "family": "E",
   "family_name": "排列與鬆弛",
   "file": "E02_PoissonDisk.cs",
   "loc": 155,
   "logic": [
    "搜尋／求解"
   ],
   "data_structure": [
    "粒子",
    "網格"
   ],
   "difficulty": 3,
   "difficulty_reason": "155 行、無自訂 class，但用了 int[,] 網格空間索引、活躍名單（active list）的 while 迴圈與 5×5 鄰格檢查；需要理解 cellSize = r/√2 的理由，比單純雙層迴圈難一級。",
   "tags": [
    "隨機",
    "可重現種子",
    "空間索引",
    "鄰居搜尋",
    "開放生長"
   ],
   "one_liner": "撒出「均勻但不規則」的點：任兩點至少相隔 minDistance，卻不像格子那麼死板，也不像純隨機那樣擠成一團。",
   "how_it_works": [
    "建立邊長 minDistance/√2 的網格，保證每格最多只會有一個點，並用 int[,] 記錄每格裡是第幾個點（-1 = 空）。",
    "隨機放第一個點，加入「還能往外長」的名單。",
    "從名單隨機挑一個點，在它外圍 minDistance 到 2×minDistance 的圓環內隨機試放候選點。",
    "只檢查候選點周圍 5×5 格裡的點：全部都夠遠就收下，登記到網格並加入名單。",
    "若試了 triesPerPoint 次都失敗，就把這個點移出名單；名單空了代表整個範圍已填滿，同時輸出同點數的純隨機點做對照。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 width, height, minDistance, triesPerPoint, seed",
    "    輸出 poissonPoints, randomPoints",
    "",
    "    // 0. 防呆",
    "    width、height、minDistance ≤ 0 → 結束",
    "    triesPerPoint < 1 → 30",
    "",
    "    // 1. DATA 資料",
    "    隨機數（seed）",
    "    網格：格邊 minDistance ÷ √2，每格最多一點",
    "    收下的點清單、還能往外長的名單",
    "",
    "    // 2. INIT 初始",
    "    隨機放第一個點 → 收下、列入名單",
    "",
    "    // 3. LOOP 迭代",
    "    當名單還有點：",
    "      隨機挑一個點",
    "      外圍 minDistance～2×minDistance 環內試 triesPerPoint 次",
    "      夠遠 → 收下、停止試",
    "      全失敗 → 移出名單",
    "",
    "    // 4. OUTPUT 輸出",
    "    同點數的純隨機點（對照組）→ randomPoints",
    "    收下的點 → poissonPoints",
    "",
    "  // ----- RunScript 下方 -----",
    "  IsFarEnough：只查周圍 5×5 格，都 ≥ minDistance 嗎",
    "  AddPoint：加進清單、登記網格、列入名單"
   ],
   "key_params": [
    {
     "name": "minDistance",
     "effect": "點與點的最小間距，直接決定密度；減半會讓點數約變 4 倍。"
    },
    {
     "name": "triesPerPoint",
     "effect": "每個點往外試幾次（Bridson 建議 30）；越小越快但留下的空洞越多，越大越緻密。"
    },
    {
     "name": "width / height",
     "effect": "取樣範圍；點數大約與面積成正比。"
    },
    {
     "name": "seed",
     "effect": "換種子得到不同排列，同一種子可重現。"
    }
   ],
   "csharp_concepts": [
    "int[,] 二維陣列",
    "GetLength(0) / GetLength(1)",
    "List<int> 活躍名單與 RemoveAt",
    "while 迴圈直到名單為空",
    "極座標取樣（Math.Cos / Math.Sin）",
    "bool 函式早退（return false）",
    "(int) 強制轉型求格子編號"
   ],
   "prerequisites": [
    "迴圈、List 與陣列",
    "距離與極座標",
    "E01 的兩兩比對（對照為何需要空間索引）"
   ],
   "teaching_note": "適合從零實作，但建議先讓學習者寫「暴力版」（每個候選點跟所有點比），再改成網格版，親身感受空間索引的速度差。poissonPoints 與 randomPoints 並排顯示非常直觀，是講「藍噪點 vs 白噪點」的好教材。",
   "variations": [
    {
     "title": "變密度取樣（影像／吸引子）",
     "level": 3,
     "what_changes": "規則（minDistance 變成位置的函式）",
     "how": "新增 Func<Point3d,double> 或依影像亮度／吸引子距離計算每個點的 r(p)；網格 cellSize 改用最小半徑，檢查範圍擴大到 ceil(rMax/cellSize) 格，判斷距離時用兩點半徑的最大值。",
     "result": "點在指定區域變密、其他區域變疏，可做漸變開孔、點描圖或植栽密度。"
    },
    {
     "title": "任意曲線邊界",
     "level": 2,
     "what_changes": "規則（範圍檢查）",
     "how": "把 IsFarEnough 開頭的矩形檢查換成 boundary.Contains(candidate) == PointContainment.Inside，網格仍以邊界的 BoundingBox 建立；可再加內部洞口曲線排除。",
     "result": "點只落在基地、立面或平面輪廓內，並能避開中庭或既有結構。"
    },
    {
     "title": "3D Poisson 取樣",
     "level": 3,
     "what_changes": "維度（2D → 3D）",
     "how": "cellSize 改成 minDistance/√3、網格改為 int[,,]、候選點在球殼內用兩個角度取樣，檢查範圍改為 5×5×5 格。",
     "result": "空間中均勻而不規則的點雲，可當 3D Voronoi 種子或空間桁架節點。"
    },
    {
     "title": "曲面上取樣",
     "level": 4,
     "what_changes": "維度（平面 → 曲面）",
     "how": "在曲面的 UV 空間生成候選點，但距離判斷改用 surface.PointAt(u,v) 之後的 3D 距離；或先在曲面上撒大量隨機點，再做 Yuksel 的 sample elimination 刪到目標點數。",
     "result": "在彎曲立面或屋頂上得到間距一致的點，不會因 UV 拉伸而疏密不均。"
    },
    {
     "title": "多類別 Poisson（多種物件）",
     "level": 3,
     "what_changes": "狀態（每個點帶類別與半徑）",
     "how": "每個點多存一個 type 與 radius，檢查距離時改用 r_i + r_j（或類別間的間距表），先放大半徑類別再放小的。",
     "result": "大樹、小樹、灌木或大小開孔各自有合理的最小間距，彼此不衝突。"
    },
    {
     "title": "Poisson 點 → Voronoi／Delaunay",
     "level": 2,
     "what_changes": "混合其他家族（輸出轉幾何）",
     "how": "把 poissonPoints 接到 Grasshopper 的 Voronoi 或 Delaunay 元件，或在 C# 中用 Rhino 的 Delaunay 功能產生網格。",
     "result": "得到單元大小接近一致但形狀自然的分割，適合鋪面、石板與結構網格。"
    },
    {
     "title": "點描開孔（stippling）",
     "level": 2,
     "what_changes": "輸出（點 → 圓孔）",
     "how": "每個點依影像亮度產生不同半徑的圓，半徑上限設為 minDistance/2 減去肋寬，保證孔與孔不相交。",
     "result": "用開孔大小與密度重現影像的穿孔板或點描海報。"
    },
    {
     "title": "Lloyd 鬆弛修整",
     "level": 4,
     "what_changes": "混合迭代（後處理）",
     "how": "以取樣結果為種子做 Voronoi，將每個點移到所屬單元的（加權）重心，重複數次；加權版即 Secord 的 weighted Voronoi stippling。",
     "result": "點分布更均勻，單元更接近正六邊形，影像點描的色調更平滑。"
    },
    {
     "title": "TSP 單筆路徑",
     "level": 4,
     "what_changes": "輸出（點 → 連續路徑）",
     "how": "用最近鄰居法加 2-opt 把所有點串成一條不交叉的折線，輸出 Polyline。",
     "result": "可給繪圖機、雷射或 3D 列印連續走完的單筆線稿。"
    },
    {
     "title": "逐步生長動畫",
     "level": 3,
     "what_changes": "迴圈（改成每次 Timer 只做 K 步）",
     "how": "把 acceptedPoints、growingPoints、cellOwner 移到欄位，每次 RunScript 只處理 K 次挑點，並另外輸出目前名單中的點以不同顏色顯示。",
     "result": "看見點從一個種子往外擴散的「波前」，適合展示演算法本質。"
    },
    {
     "title": "沿曲線的 1D Poisson",
     "level": 2,
     "what_changes": "維度（2D → 1D）",
     "how": "在曲線參數上取樣：以弧長代替座標，新點位置 = 上一點弧長 + minDistance × (1 + random)，用 Curve.PointAtLength 取點。",
     "result": "沿步道或立面分割線放置柱子、路燈或欄杆，間距自然但不小於規範值。"
    }
   ],
   "project_seeds": [
    {
     "title": "變密度點描穿孔立面",
     "brief": "以立面日照或視線分析圖作為密度圖，做變密度 Poisson 取樣再轉成大小不一的圓孔，輸出雷切檔並驗證最小肋寬。",
     "difficulty": 2,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "多物種植栽點位產生器",
     "brief": "在景觀基地中，依樹種冠幅設定不同最小間距做多類別 Poisson，並以步道、建築退縮曲線為排除區，輸出各樹種數量表。",
     "difficulty": 3,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "Poisson + Voronoi 自然石鋪面",
     "brief": "在廣場邊界內做 Poisson 取樣，用 Voronoi 切出石塊並向內偏移留縫，依石塊面積分群以控制材料種類。",
     "difficulty": 3,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "自由曲面屋頂的均勻節點網格",
     "brief": "在雙曲面屋頂上做曲面 Poisson 取樣，以 Delaunay 連成三角網作為結構桿件，比較與 UV 均分網格的桿長變異。",
     "difficulty": 4,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "3D Poisson 泡沫結構體",
     "brief": "在量體內做 3D 變密度 Poisson 取樣，接 3D Voronoi 產生泡沫單元，外圍密、內部疏，輸出可 3D 列印的格架。",
     "difficulty": 5,
     "combine_with": [
      "C04",
      "E01"
     ]
    }
   ],
   "references": [
    {
     "title": "Fast Poisson Disk Sampling in Arbitrary Dimensions",
     "author": "Robert Bridson",
     "year": "2007",
     "url": "https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf"
    },
    {
     "title": "Weighted Voronoi Stippling",
     "author": "Adrian Secord",
     "year": "2002",
     "url": "https://dl.acm.org/doi/abs/10.1145/508530.508537"
    },
    {
     "title": "Sample Elimination for Generating Poisson Disk Sample Sets",
     "author": "Cem Yuksel",
     "year": "2015",
     "url": "http://www.cemyuksel.com/research/sampleelimination/"
    },
    {
     "title": "Visualizing Algorithms",
     "author": "Mike Bostock",
     "year": "2014",
     "url": "https://bost.ocks.org/mike/algorithms/"
    },
    {
     "title": "Poisson-Disc Sampling（互動視覺化）",
     "author": "Jason Davies",
     "year": "",
     "url": "https://www.jasondavies.com/poisson-disc/"
    },
    {
     "title": "Coding Challenge #33: Poisson-disc Sampling",
     "author": "Daniel Shiffman（The Coding Train）",
     "year": "",
     "url": "https://thecodingtrain.com/challenges/33-poisson-disc-sampling"
    }
   ]
  },
  {
   "id": "E03",
   "name_zh": "Voronoi 圖＋Lloyd 鬆弛",
   "name_en": "Voronoi + Lloyd Relaxation",
   "family": "E",
   "family_name": "排列與鬆弛",
   "file": "E03_VoronoiLloyd.cs",
   "loc": 181,
   "logic": [
    "幾何轉換",
    "迭代模擬"
   ],
   "data_structure": [
    "幾何",
    "粒子"
   ],
   "difficulty": 2,
   "difficulty_reason": "181 行、單一元件、無自訂 class，只有 BuildCells／KeepCloserSide／AreaCenter 三個方法；用 O(n²) 暴力半平面切割，不需空間索引，但內積判斷邊與鞋帶重心公式需要先講清楚數學。",
   "tags": [
    "隨機",
    "可重現種子",
    "收斂",
    "鄰居搜尋",
    "最佳化",
    "拼貼"
   ],
   "one_liner": "把平面切成「離哪個點最近就歸誰」的細胞，再反覆把每個點搬到自己細胞的重心，讓大小不一的亂格子慢慢變成均勻的蜂巢。",
   "how_it_works": [
    "用種子在矩形內撒 pointCount 個隨機點（site）。",
    "Voronoi：每個點都從整個矩形開始，對每一個其他點畫垂直平分線，用內積判斷角點在哪一側，只留下靠近自己的那一半（半平面切割），切完就是它的細胞。",
    "Lloyd：用鞋帶公式算每個細胞的面積重心，把點移到重心。",
    "用新的點重新切一次 Voronoi，重複 iterations 次；點間距越來越平均，細胞越來越接近六角形（CVT，重心 Voronoi 鑲嵌）。",
    "輸出封閉 polyline 細胞與最終點位，並印出面積總和，用來檢查細胞有沒有剛好鋪滿矩形。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 pointCount, width, height, iterations, seed",
    "    輸出 cells, points",
    "",
    "    // 0. 防呆",
    "    數量或尺寸不合理 → 結束",
    "    iterations < 0 → 0",
    "",
    "    // 1. DATA 資料",
    "    隨機數（seed）、點清單",
    "",
    "    // 2. INIT 初始",
    "    矩形內隨機撒 pointCount 個點",
    "    每點切出自己的區塊",
    "",
    "    // 3. LOOP 迭代",
    "    重複 iterations 次：",
    "      每個點移到自己區塊的重心",
    "      重切一次",
    "",
    "    // 4. OUTPUT 輸出",
    "    角點少於 3 個的區塊不要",
    "    區塊首尾相接成封閉線 → cells",
    "    點的最終位置 → points",
    "",
    "  // ----- RunScript 下方 -----",
    "  BuildCells：每點從整個矩形開始，被每個其他點切一刀",
    "  KeepCloserSide：垂直平分線切多邊形，只留靠近自己那半",
    "  AreaCenter：多邊形的面積重心",
    "  PolygonArea：鞋帶公式算面積"
   ],
   "key_params": [
    {
     "name": "pointCount",
     "effect": "細胞數量；計算量約為 n² × 角點數，點數加倍時間約變四倍"
    },
    {
     "name": "iterations",
     "effect": "0 = 純 Voronoi（大小懸殊）；5–20 次就明顯均勻，之後變化越來越小（收斂）"
    },
    {
     "name": "width / height",
     "effect": "外框矩形大小，也是每個細胞的起始多邊形"
    },
    {
     "name": "seed",
     "effect": "同一個種子得到同一組起始點，可重現；換種子就換一組圖樣"
    }
   ],
   "csharp_concepts": [
    "List<List<Point3d>>",
    "Random(seed)",
    "Point3d 與 Vector3d 運算（內積 *）",
    "Point3d 是 struct 直接寫回 list",
    "Polyline 首尾相接封閉",
    "helper 方法回傳新 List"
   ],
   "prerequisites": [
    "巢狀迴圈與方法",
    "向量內積的正負意義",
    "多邊形面積（鞋帶公式）概念",
    "E 家族：排列與鬆弛的概念"
   ],
   "teaching_note": "很適合從零實作：先只寫 KeepCloserSide 切一刀、畫出來，再加外層迴圈變 Voronoi，最後加兩行 Lloyd 迴圈，學習者能看到「一次一刀」到「整張圖」的過程。要提醒垂直平分線用內積判斷側邊、以及點數太多會慢（n²），建議 pointCount ≤ 200。可和 GH 內建 Voronoi 元件對照，說明自己寫的好處是能改規則（加權、邊界、重心密度）。",
   "variations": [
    {
     "title": "密度圖加權 Lloyd（影像點描）",
     "level": 3,
     "what_changes": "Lloyd 的重心計算（規則）＋新增影像輸入",
     "how": "把 AreaCenter 改成在細胞內取樣網格點，以影像亮度當權重求加權重心（Σw·p / Σw）；新增 Bitmap 或 Mesh 顏色輸入。",
     "result": "暗處點密、亮處點疏的點描畫（Weighted Voronoi Stippling），細胞大小隨影像漸變。"
    },
    {
     "title": "吸引子控制細胞大小",
     "level": 2,
     "what_changes": "重心權重或初始撒點分布（輸入）",
     "how": "新增 attractor 點輸入，權重 w = 1 / (1 + 距離)；或撒點時用拒絕取樣讓靠近吸引子的點較多，再做 Lloyd。",
     "result": "靠近吸引子的細胞小而密、遠處大而疏的漸變立面開孔或鋪面。"
    },
    {
     "title": "任意曲線邊界",
     "level": 3,
     "what_changes": "BuildCells 的起始多邊形（輸入）",
     "how": "把起始矩形換成輸入的封閉凸多邊形 Polyline；若是凹形，先照常切割再用 Curve.CreateBooleanIntersection 與邊界相交，撒點改成在邊界內拒絕取樣。",
     "result": "細胞填滿基地輪廓、樓板形狀或家具面板形狀。"
    },
    {
     "title": "Power diagram（加權 Voronoi）",
     "level": 3,
     "what_changes": "平分線位置（規則）",
     "how": "每個點帶半徑 r，KeepCloserSide 的判斷改成 |x−a|²−ra² ≤ |x−b|²−rb²，分界線仍是直線但往小權重的一側偏移。",
     "result": "大小可指定的細胞，適合房間面積配置、泡泡圖轉平面。"
    },
    {
     "title": "3D Voronoi（半空間切割）",
     "level": 4,
     "what_changes": "維度（2D 多邊形 → 3D 多面體）",
     "how": "起始改成 Box/Brep，每個其他點用中垂面 Plane 切割（Brep.Trim 或 Mesh.Split 保留近側），Lloyd 改用 VolumeMassProperties 取體積重心。",
     "result": "泡泡狀多面體堆疊，類似水立方 Weaire-Phelan 泡沫的隨機版本。"
    },
    {
     "title": "曲面上的 Voronoi",
     "level": 4,
     "what_changes": "維度（平面 → 曲面 UV）",
     "how": "在曲面 UV 參數域上做 Voronoi 與 Lloyd，再用 Surface.PointAt 把細胞角點映射回 3D；進階版以 3D 距離近似修正 UV 拉伸造成的變形。",
     "result": "包覆在自由曲面殼體上的細胞網格，可做立面嵌板或殼體肋梁。"
    },
    {
     "title": "收斂判斷與停止條件",
     "level": 2,
     "what_changes": "迴圈（固定次數 → 收斂）",
     "how": "每輪記錄所有點移動距離的最大值，小於 tolerance 就 break，並 Print 實際跑了幾輪。",
     "result": "自動停在穩定的 CVT，並能畫出能量（移動量）下降曲線做教學說明。"
    },
    {
     "title": "Timer 動畫化鬆弛過程",
     "level": 2,
     "what_changes": "狀態保存與輸出（動畫）",
     "how": "把 sites 移到類別成員變數，加 reset 輸入；每次 RunScript 只做一輪 Lloyd，接 GH Timer 觸發。",
     "result": "看到亂格子逐幀變成蜂巢的動畫，適合簡報錄影。"
    },
    {
     "title": "細胞縮孔與圓角 → 可切割板材",
     "level": 2,
     "what_changes": "輸出（線 → 可製造幾何）",
     "how": "對每個細胞 Polyline 做向內 Offset（Curve.Offset）與 Fillet，外框保留，輸出雷切或 CNC 用封閉曲線。",
     "result": "穿孔板、隔屏、層架、首飾等可直接雷切／CNC 的圖樣。"
    },
    {
     "title": "Delaunay 對偶網路",
     "level": 3,
     "what_changes": "輸出（細胞 → 鄰接圖）",
     "how": "切割時記錄是哪個 other 點切出最後的邊，把 site 與該 other 連線，得到 Delaunay 三角網；可當結構桿件或路徑網。",
     "result": "與細胞互為對偶的三角桁架或動線網路，可與細胞同時輸出做雙層結構。"
    },
    {
     "title": "細胞長高成 3D 量體",
     "level": 2,
     "what_changes": "輸出維度（平面細胞 → 擠出量體）",
     "how": "每個縮孔後的細胞依面積、到吸引子距離或影像亮度決定高度，用 Extrusion.Create 擠出。",
     "result": "蜂巢狀城市量體模型、柱列或景觀座椅群。"
    },
    {
     "title": "與 Circle Packing / Boids 混合",
     "level": 3,
     "what_changes": "點的更新規則（混合其他家族）",
     "how": "把 Lloyd 的重心移動與 E01 Circle Packing 的排斥力或 D01 Boids 的鄰居規則加權相加，點會同時被重心拉、被其他點推。",
     "result": "可控制疏密又帶流動感的細胞圖樣，細胞會沿流向拉長。"
    }
   ],
   "project_seeds": [
    {
     "title": "漸變 Voronoi 穿孔隔屏",
     "brief": "以日照或視線需求當吸引子控制細胞大小，Lloyd 鬆弛後縮孔圓角，輸出雷切板材並做 1:1 局部樣品。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "影像點描立面",
     "brief": "以城市照片或人像做加權 Lloyd，點位轉成立面開孔或燈點，比較 iterations 與點數對辨識度的影響。",
     "difficulty": 3,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "面積指定的泡泡平面生成器",
     "brief": "用 Power diagram 讓每個房間的細胞面積接近需求值（迭代調整權重），在任意基地邊界內產生平面分區草案。",
     "difficulty": 4,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "曲面殼體 Voronoi 肋梁",
     "brief": "在自由曲面上做 Voronoi＋Lloyd，細胞邊轉成木肋或鋼件，Delaunay 對偶當第二層支撐，檢查構件長度分布是否適合製造。",
     "difficulty": 4,
     "combine_with": [
      "F01"
     ]
    },
    {
     "title": "3D Voronoi 仿骨骼支架",
     "brief": "在量體內以應力或密度場控制 3D Voronoi 點的疏密，細胞邊加厚成桿件，做 3D 列印的輕量化家具或節點，並以有限元素或載重測試比較。",
     "difficulty": 5,
     "combine_with": [
      "C03"
     ]
    }
   ],
   "references": [
    {
     "title": "Least squares quantization in PCM",
     "author": "Stuart P. Lloyd",
     "year": "1982",
     "url": "https://dl.acm.org/doi/10.1109/TIT.1982.1056489"
    },
    {
     "title": "Centroidal Voronoi Tessellations: Applications and Algorithms",
     "author": "Qiang Du, Vance Faber, Max Gunzburger",
     "year": "1999",
     "url": "https://dl.acm.org/doi/abs/10.1137/S0036144599352836"
    },
    {
     "title": "Weighted Voronoi Stippling",
     "author": "Adrian Secord",
     "year": "2002",
     "url": "https://www.cs.ubc.ca/labs/imager/tr/2002/secord2002b/"
    },
    {
     "title": "Centroidal Voronoi tessellation（Wikipedia）",
     "author": "",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Centroidal_Voronoi_tessellation"
    },
    {
     "title": "Weighted Voronoi diagram（Wikipedia）",
     "author": "",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Weighted_Voronoi_diagram"
    },
    {
     "title": "PowerDiagrams：2D Weighted Voronoi/Power diagrams for Grasshopper",
     "author": "Daniel Abalde",
     "year": "",
     "url": "https://github.com/DanielAbalde/PowerDiagrams"
    }
   ]
  },
  {
   "id": "E04",
   "name_zh": "動態鬆弛找形",
   "name_en": "Dynamic Relaxation Form-Finding",
   "family": "E",
   "family_name": "排列與鬆弛",
   "file": "E04_DynamicRelaxation.cs",
   "loc": 185,
   "logic": [
    "迭代模擬"
   ],
   "data_structure": [
    "粒子",
    "圖（點＋連線）"
   ],
   "difficulty": 3,
   "difficulty_reason": "約 185 行、兩個自訂 class（Particle、Spring）以索引組成圖結構，需要理解力→速度→位置的積分、阻尼與收斂判斷，且 stiffness 與 TimeStep 的比例調錯就會數值爆炸，屬於中階。",
   "tags": [
    "物理模擬",
    "收斂",
    "自訂 class",
    "3D",
    "迭代",
    "最佳化"
   ],
   "one_liner": "把一張網格想成用彈簧連起來的質點，固定幾個角點、施加重力，讓它反覆晃動直到靜止，得到的懸垂形倒過來就是只受壓的殼。",
   "how_it_works": [
    "建立 (n+1)×(n+1) 個質點，四個角點設為固定；相鄰質點之間各連一條彈簧，原長等於格距。",
    "每一步先算彈簧力：每條彈簧依伸長量（目前長度－原長）× stiffness，把兩端點互相拉近或推開，累加到力陣列。",
    "再把彈簧力加上重力，更新速度（v = (v + F·dt)·damping）與位置（p += v·dt），固定點跳過。",
    "記錄每一步最快質點的速度；速度趨近 0 表示系統已達平衡（收斂）。",
    "重複 iterations 次後，用彈簧兩端點畫出線段；gravity 設正值就是把懸垂網倒過來，得到純受壓殼的形狀。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 gridCount, size, gravity, stiffness, damping, iterations",
    "    輸出 lines, maxSpeed, speedHistory",
    "",
    "    // 0. 防呆",
    "    gridCount < 1 或 size ≤ 0 或 iterations < 0 → 結束",
    "",
    "    // 1. DATA 資料",
    "    質點清單、彈簧清單、每步最快速度清單",
    "",
    "    // 2. INIT 初始",
    "    (gridCount + 1)² 個點排成方格，四個角固定",
    "    每點往右、往上各連一條彈簧，原長 size ÷ gridCount",
    "",
    "    // 3. LOOP 迭代",
    "    重力 → 往上的力（gravity）",
    "    重複 iterations 次：",
    "      算每條彈簧的力（stiffness）",
    "      力＋重力 → 速度 → 位置（damping）",
    "      記下這步最快速度",
    "",
    "    // 4. OUTPUT 輸出",
    "    每條彈簧兩端連成線 → lines",
    "    最後一步最快速度 → maxSpeed",
    "    每步最快速度 → speedHistory",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：時間步長 0.02",
    "  SpringForces：拉長就把兩端拉近，壓短就推開",
    "  MoveParticles：力 → 速度（damping）→ 位置，固定點不動",
    "",
    "// ----- Script_Instance 外面 -----",
    "Particle：位置、速度、是否固定",
    "Spring：兩端點編號、原長"
   ],
   "key_params": [
    {
     "name": "gridCount",
     "effect": "每邊格數；越多網越細，但點數平方成長、收斂變慢"
    },
    {
     "name": "size",
     "effect": "網的邊長，同時決定每條彈簧原長（size ÷ gridCount）"
    },
    {
     "name": "gravity",
     "effect": "重力大小與方向；正值往上得到殼、負值往下得到懸垂網；與 stiffness 的比值決定殼的高度"
    },
    {
     "name": "stiffness",
     "effect": "彈簧硬度；越大越接近不可伸長，但 stiffness × TimeStep² 過大會爆炸"
    },
    {
     "name": "damping",
     "effect": "每步速度保留比例；越小收斂越快但可能卡在未平衡狀態，越接近 1 晃越久"
    },
    {
     "name": "iterations",
     "effect": "迭代步數；不夠時網還在晃，看 speedHistory 判斷是否已收斂"
    }
   ],
   "csharp_concepts": [
    "自訂 class（Particle、Spring）",
    "List<T> 與索引互相參照",
    "Vector3d 向量運算",
    "陣列累加（Vector3d[]）",
    "class 參考語意（改了就生效）",
    "const 常數",
    "方法拆分與回傳值"
   ],
   "prerequisites": [
    "粒子系統（力 → 速度 → 位置）",
    "迴圈與巢狀迴圈",
    "class 與 struct 差異",
    "向量基本概念（長度、單位化）",
    "牛頓第二定律直覺（力→加速度）"
   ],
   "teaching_note": "很適合從零實作：先寫一條一維懸垂鏈，再把一維鏈擴成二維網，學習者一眼就懂。要提醒數值爆炸（stiffness 太大或 TimeStep 太大）與「跑完 iterations 不等於已收斂」，務必接 Quick Graph 看 speedHistory。可順帶說明這就是 Kangaroo 的核心，讓學習者知道外掛背後在做什麼。",
   "variations": [
    {
     "title": "自訂錨點與邊界",
     "level": 2,
     "what_changes": "狀態（固定點條件）",
     "how": "把 isCorner 改成：整排邊界固定、或輸入一組 List<Point3d> 錨點，距離最近的質點設為 IsFixed；也可讓錨點高度不同。",
     "result": "從四角支撐的枕頭殼變成拱廊、單邊懸挑、多柱支撐的傘形殼。"
    },
    {
     "title": "對角彈簧與三角網",
     "level": 2,
     "what_changes": "規則（連線拓撲）",
     "how": "在彈簧迴圈中多加 here→here+pointsPerRow+1 的對角線，原長為 spacing×√2；或改用 Rhino Mesh 的 TopologyEdges 建彈簧。",
     "result": "網格抗剪、不再像魚網般歪斜，形狀更接近連續薄殼。"
    },
    {
     "title": "從任意 Mesh 找形",
     "level": 3,
     "what_changes": "輸入（初始幾何）",
     "how": "新增 Mesh 輸入，用 mesh.Vertices 建 Particle、mesh.TopologyEdges 建 Spring，裸邊（naked edge）頂點設為固定。",
     "result": "任何平面圖形（L 形、圓形、有洞的平面）都能長成對應的受壓殼或帳篷。"
    },
    {
     "title": "張拉膜：原長縮短（預力）",
     "level": 2,
     "what_changes": "規則（彈簧原長）",
     "how": "RestLength 乘上 0.0~0.5 的係數（或直接設 0），並把 gravity 設為 0，讓彈簧只想縮短；配合高低錨點。",
     "result": "得到接近最小曲面的馬鞍形張拉膜，類似 Frei Otto 的帳篷屋頂。"
    },
    {
     "title": "吸引子控制的載重或硬度",
     "level": 3,
     "what_changes": "輸入（空間變化參數）",
     "how": "每個質點依到吸引子點的距離給不同重量（重力乘上權重），或每條彈簧依距離給不同 stiffness。",
     "result": "殼在特定區域隆起或下垂，形成天窗、入口拱等局部變化。"
    },
    {
     "title": "改用 Kinetic Damping 加速收斂",
     "level": 4,
     "what_changes": "迴圈（積分與阻尼策略）",
     "how": "每步計算總動能，若動能比上一步下降，就把所有速度歸零（Barnes 的 kinetic damping），並用 maxSpeed < 門檻值提前 break。",
     "result": "相同形狀用更少步數收斂，也可學到真正工程軟體的 DR 做法。"
    },
    {
     "title": "Timer 動畫化找形過程",
     "level": 3,
     "what_changes": "迴圈（跨執行保存狀態）",
     "how": "把 particles、springs 移到 class 欄位並加 reset 輸入，每次 RunScript 只跑 10 步，接 GH Timer 反覆觸發。",
     "result": "看到網從平面慢慢垂下再倒過來成殼的過程，可直接錄影做簡報。"
    },
    {
     "title": "受壓殼 → 可製造構件",
     "level": 3,
     "what_changes": "輸出（幾何轉換）",
     "how": "把平衡後的點重建成 Mesh，沿頂點法向量加厚（Offset）；或把每格四邊形輸出成平板並展開編號。",
     "result": "得到可 3D 列印的殼模型、可雷切的石塊或木板面板，類似 Armadillo Vault 的切分思路。"
    },
    {
     "title": "應力視覺化",
     "level": 2,
     "what_changes": "輸出（顏色資料）",
     "how": "輸出每條彈簧的 stretch 或 stiffness×stretch 數值，接 Gradient 上色；正值（受拉）與負值（受壓）分兩色。",
     "result": "一眼看出哪些桿件受力大，可作為構件斷面大小或編織密度的依據。"
    },
    {
     "title": "混合 E 家族：Circle Packing＋鬆弛",
     "level": 4,
     "what_changes": "混合其他家族",
     "how": "先在平面上用 E01 Circle Packing 產生點，再做 Delaunay 連線成彈簧網，最後用本範例找形。",
     "result": "得到不規則三角網的自由形殼，桿件長度較一致，適合做 gridshell。"
    },
    {
     "title": "充氣結構：法向壓力",
     "level": 4,
     "what_changes": "規則（外力種類）",
     "how": "改用三角 Mesh，每步對每個面計算法向量 × 面積 × 壓力，平分給三個頂點，取代固定方向的重力。",
     "result": "網像氣球一樣鼓起，形成充氣枕或氣膜結構的形狀。"
    },
    {
     "title": "曲面上的網：約束在基底曲面",
     "level": 4,
     "what_changes": "加約束（位置投影）",
     "how": "每步更新位置後，用 Surface.ClosestPoint 把質點拉回輸入曲面上，重力改為 0、只保留彈簧。",
     "result": "在任意曲面上得到均勻分布的網格，可作為立面分割或 gridshell 桿件排布。"
    }
   ],
   "project_seeds": [
    {
     "title": "校園涼亭受壓殼",
     "brief": "以校園某處平面輪廓與柱位為錨點，用動態鬆弛找出受壓殼形，再輸出加厚 Mesh 做 3D 列印縮尺模型，比較不同支撐配置的殼高與形狀。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "張拉膜遮陽棚設計工具",
     "brief": "做一個可輸入高低錨點與預力比例的張拉膜找形元件，輸出應力色彩與膜片展開圖，並用布料實作 1:20 模型驗證。",
     "difficulty": 3,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "石塊拼砌拱頂（Armadillo 式）",
     "brief": "先找出受壓殼，再把殼面依主應力方向或網格切成塊，每塊加厚成實體並編號，最後以泡棉或紙板切割拼成無接著劑的拱頂模型。",
     "difficulty": 4,
     "combine_with": [
      "C03"
     ]
    },
    {
     "title": "動畫式充氣裝置",
     "brief": "以 Timer 即時模擬一個會隨壓力脹縮的充氣裝置，壓力由時間或聲音資料驅動，輸出動畫與展開裁片作為藝術裝置提案。",
     "difficulty": 4,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "自寫迷你 Kangaroo：多目標約束求解器",
     "brief": "把彈簧、錨點、平面化、等長等約束抽象成共同介面（Goal），用投影式（Projective）或 kinetic damping 求解，並與 Kangaroo2 結果比對速度與精度。",
     "difficulty": 5,
     "combine_with": [
      "E01",
      "E02"
     ]
    }
   ],
   "references": [
    {
     "title": "An introduction to dynamic relaxation（The Engineer, vol. 219, pp. 218–221）",
     "author": "A. S. Day",
     "year": "1965",
     "url": "https://en.wikipedia.org/wiki/Dynamic_relaxation"
    },
    {
     "title": "Form Finding and Analysis of Tension Structures by Dynamic Relaxation",
     "author": "Michael R. Barnes",
     "year": "1999",
     "url": "https://journals.sagepub.com/doi/10.1260/0266351991494722"
    },
    {
     "title": "Thrust Network Analysis: A New Methodology for Three-Dimensional Equilibrium",
     "author": "Philippe Block, John Ochsendorf",
     "year": "2007",
     "url": "https://web.mit.edu/masonry/thrustNetwork/papers/IASS07_block+ochsendorf.pdf"
    },
    {
     "title": "Kangaroo Physics（Grasshopper 外掛）",
     "author": "Daniel Piker",
     "year": "",
     "url": "https://www.food4rhino.com/en/app/kangaroo-physics"
    },
    {
     "title": "Frei Otto and the Development of Gridshells",
     "author": "",
     "year": "",
     "url": "https://www.researchgate.net/publication/283164806_Frei_Otto_and_the_Development_of_Gridshells"
    },
    {
     "title": "Form-finding and fabric forming in the work of Heinz Isler",
     "author": "",
     "year": "2012",
     "url": "http://fabric-formedconcrete.com/lib/exe/fetch.php?media=nottingham%3Aform-finding_and_fabric_forming_in_the_work_of_heinz_isler.pdf"
    },
    {
     "title": "Shell Structures for Architecture: Form Finding and Optimization",
     "author": "Sigrid Adriaenssens, Philippe Block, Diederik Veenendaal, Chris Williams（編）",
     "year": "2014",
     "url": ""
    }
   ]
  },
  {
   "id": "F01",
   "name_zh": "Truchet 磁磚",
   "name_en": "Truchet Tiles",
   "family": "F",
   "family_name": "圖樣與最佳化",
   "file": "F01_Truchet.cs",
   "loc": 127,
   "logic": [
    "直接公式"
   ],
   "data_structure": [
    "網格"
   ],
   "difficulty": 1,
   "difficulty_reason": "127 行、只有一個雙層 for 迴圈，每格擲一次硬幣決定方向，不看鄰居、沒有自訂 class，只要懂 Plane 與 Arc 建構就能讀懂。",
   "tags": [
    "拼貼",
    "隨機",
    "可重現種子",
    "對稱"
   ],
   "one_liner": "把同一片「兩段四分之一圓弧」的方磚隨機轉 0° 或 90° 鋪滿網格，弧線在邊中點自動接成連續的蜿蜒曲線。",
   "how_it_works": [
    "以 columns × rows 建立正方形網格，每格左下角 = (column × tileSize, row × tileSize)。",
    "每格用 Random(seed) 擲硬幣：決定用「左下＋右上」或「右下＋左上」這組對角當圓心。",
    "以兩個對角為圓心、半格為半徑各畫一段 90° 圓弧；弧線端點都落在邊的中點。",
    "因為所有弧都停在邊中點，相鄰格的弧必然首尾相接，整體浮現連續曲線與封閉圈。",
    "輸出所有圓弧（arcs）與每格外框（tiles）。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 columns, rows, tileSize, seed",
    "    輸出 arcs, tiles",
    "",
    "    // 0. 防呆",
    "    格數 < 1 或 tileSize ≤ 0 → 結束",
    "",
    "    // 1. DATA 資料",
    "    隨機數（seed）、圓弧清單、格子外框清單",
    "",
    "    // 4. OUTPUT 輸出",
    "    對每一格：",
    "      擲硬幣決定轉不轉 90 度",
    "      放兩段圓弧、記格子外框",
    "    圓弧 → arcs",
    "    外框 → tiles",
    "",
    "  // ----- RunScript 下方 -----",
    "  TileArcs：左下＋右上，或右下＋左上，兩段半格圓弧",
    "  QuarterArc：以圓心為中心轉 90 度 → 圓弧",
    "  TileOutline：四個角連成框"
   ],
   "key_params": [
    {
     "name": "columns / rows",
     "effect": "格數；越多圖樣越細碎，連續曲線越長越難追蹤。"
    },
    {
     "name": "tileSize",
     "effect": "每格邊長；只改變整體尺度，不改變圖樣拓樸。"
    },
    {
     "name": "seed",
     "effect": "隨機種子；同一 seed 永遠得到同一張圖，換 seed 就換一組旋轉排列。"
    }
   ],
   "csharp_concepts": [
    "Random(seed)",
    "雙層 for 迴圈",
    "Plane(origin, xAxis, yAxis)",
    "Arc(Plane, radius, angle)",
    "List<Arc>",
    "Polyline",
    "helper method 回傳 List"
   ],
   "prerequisites": [
    "迴圈與條件判斷",
    "Vector3d 加減與純量乘法",
    "Plane 的 X 軸方向決定弧起點"
   ],
   "teaching_note": "非常適合作為第一個從零實作的範例：10 分鐘就能看到圖，改一行就能換規則。要特別提醒 QuarterArc 的 Plane 以 startDirection 為 X 軸、endDirection 為 Y 軸，方向寫反弧就會畫到格子外。可順勢帶出「局部規則 → 全域圖樣」的湧現概念。",
   "variations": [
    {
     "title": "吸引子控制方向",
     "level": 1,
     "what_changes": "規則（取代擲硬幣）",
     "how": "新增 Point3d attractor 輸入，改成 rotated = (distance(corner, attractor) / range) > random.NextDouble()；近吸引子處偏向一種方向、遠處偏另一種。",
     "result": "隨機紋理中出現有方向性的漸層區塊，可作為立面開口疏密的母題。"
    },
    {
     "title": "影像驅動 Truchet（半色調）",
     "level": 2,
     "what_changes": "輸入（影像取代隨機）",
     "how": "讀入 Bitmap，取每格中心像素亮度 brightness；亮度 > 0.5 用一種方向，或依亮度選不同磁磚（空白／單弧／雙弧／粗弧）。",
     "result": "遠看是照片或字樣、近看是連續曲線的圖像，適合入口牆面或穿孔板。"
    },
    {
     "title": "原始三角形 Truchet（四方向）",
     "level": 1,
     "what_changes": "規則（磁磚圖案與旋轉數）",
     "how": "把 TileArcs 換成回傳對角線切出的三角形 Brep，random.Next(4) 決定 0/90/180/270°；也可用 row、column 公式（例如 (row+column)%4）做規則排列。",
     "result": "重現 Truchet 1704 的黑白三角拼花，規則排列時得到鑽石、鋸齒、風車等對稱紋。"
    },
    {
     "title": "對角線迷宮（10 PRINT）",
     "level": 1,
     "what_changes": "規則（弧改直線）",
     "how": "每格改畫一條對角線 Line，方向由擲硬幣決定：左下→右上 或 左上→右下。",
     "result": "經典 10 PRINT 迷宮；可再用 flood fill 找出封閉區域上色。"
    },
    {
     "title": "兩色分區填色（Smith 著色）",
     "level": 2,
     "what_changes": "輸出（線 → 面）",
     "how": "每格額外輸出由弧與邊界圍成的區域；依 (row + column + (rotated?1:0)) % 2 決定黑白，可證明相鄰區塊永遠異色。",
     "result": "黑白交錯的有機色塊，可直接當雷射切割或雙色磁磚的製圖。"
    },
    {
     "title": "多尺度 Truchet（Carlson）",
     "level": 3,
     "what_changes": "迴圈（加入遞迴細分）",
     "how": "寫遞迴函式 Subdivide(corner, size, depth)：若 random < p 且 depth < max，就切成四格各自遞迴，否則放一片「帶翼」磁磚；每層顏色反轉、尺寸減半。",
     "result": "大圈套小圈、粗細交錯的多尺度圖樣，視覺層次遠比單一尺度豐富。"
    },
    {
     "title": "六角形 Truchet",
     "level": 2,
     "what_changes": "維度／網格（方格 → 六角格）",
     "how": "改用六角格座標；每格 6 個邊中點兩兩配對（3 條弧），隨機轉 0/60/120°；圓心放在六角形頂點、半徑 = 邊長一半。",
     "result": "三向交織的流線，比方格版更像編織或纖維。"
    },
    {
     "title": "曲面上的 Truchet 立面",
     "level": 2,
     "what_changes": "維度（平面 → 曲面 UV）",
     "how": "新增 Surface 輸入，把每格的弧取樣成點後用 surface.PointAt(u, v) 映射，或直接在 UV 空間畫弧再 Pushup；tileSize 換成 U、V 的分段數。",
     "result": "包覆在曲面立面上的連續紋路，可直接接 Pipe 或 Offset 變成立面肋條。"
    },
    {
     "title": "弧線轉成可製造的 3D 模組",
     "level": 2,
     "what_changes": "輸出（線 → 實體）",
     "how": "把同方向的兩段弧 Join 後 Sweep 一個斷面，或把兩色區域 Extrude 成不同高度；只需建兩種模組（0°/90°）即可量產。",
     "result": "可 CNC、3D 列印或灌模的立體磁磚／面板，一種模具組出無限多種牆面。"
    },
    {
     "title": "3D Truchet 方塊（空間管路）",
     "level": 3,
     "what_changes": "維度（2D → 3D 體素）",
     "how": "改成三層迴圈的立方格；每個立方體 6 個面中心兩兩以 1/4 圓管相連，隨機旋轉 24 種方向中的幾種。",
     "result": "在空間中蜿蜒的連續管道網，可做成裝置、格柵或結構概念模型。"
    },
    {
     "title": "動畫：逐格翻轉",
     "level": 2,
     "what_changes": "狀態（加入時間）",
     "how": "用 static bool[,] 記住每格方向，接 Timer 或 Iteration，每 tick 隨機翻轉幾格（或讓翻轉機率沿波前傳播）。",
     "result": "曲線不斷重新連接、分裂與合併的動態圖樣，適合互動立面或投影。"
    },
    {
     "title": "偵測封閉迴圈並分級",
     "level": 3,
     "what_changes": "輸出（加入圖論分析）",
     "how": "把所有弧 Join 成曲線，判斷 IsClosed 並計算長度或面積；依大小分層、上色或只保留最長的一條當路徑。",
     "result": "可以控制「島」與「長河」的比例，用於景觀步道、動線或燈光設計。"
    }
   ],
   "project_seeds": [
    {
     "title": "一種模具的無限立面",
     "brief": "設計兩種方向的預鑄面板模組，以 Truchet 規則排列建築立面，並用吸引子或日照分析控制方向比例；產出面板數量表與組裝圖。",
     "difficulty": 2,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "照片變成可切割的穿孔板",
     "brief": "以影像驅動多種 Truchet 磁磚（空白、細弧、粗弧），輸出雷射切割用的封閉輪廓，製作 1:1 局部樣板。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "多尺度 Truchet 天花吸音系統",
     "brief": "實作 Carlson 多尺度遞迴細分，在人流或噪音熱區細分更密，輸出不同尺寸的吸音模組並估算開孔率。",
     "difficulty": 3,
     "combine_with": [
      "A04"
     ]
    },
    {
     "title": "Truchet 景觀步道迷宮",
     "brief": "在基地曲面上鋪 Truchet 網格，偵測封閉迴圈與最長路徑，把最長路徑轉成步道、封閉島轉成植栽區。",
     "difficulty": 4,
     "combine_with": [
      "C05"
     ]
    },
    {
     "title": "3D Truchet 空間格柵裝置",
     "brief": "把 Truchet 延伸到立方格，生成連續管道網，再用約束（每條管需落地、需連通）篩選旋轉組合，做成可 3D 列印的節點裝置。",
     "difficulty": 5,
     "combine_with": [
      "A06"
     ]
    }
   ],
   "references": [
    {
     "title": "Mémoire sur les combinaisons",
     "author": "Sébastien Truchet",
     "year": "1704",
     "url": "https://en.wikipedia.org/wiki/Truchet_tile"
    },
    {
     "title": "The Tiling Patterns of Sebastien Truchet and the Topology of Structural Hierarchy (Leonardo 20(4))",
     "author": "Cyril Stanley Smith, Pauline Boucher",
     "year": "1987",
     "url": "https://www.jstor.org/stable/1578535"
    },
    {
     "title": "Multi-Scale Truchet Patterns (Bridges 2018)",
     "author": "Christopher Carlson",
     "year": "2018",
     "url": "https://archive.bridgesmathart.org/2018/bridges2018-39.html"
    },
    {
     "title": "10 PRINT CHR$(205.5+RND(1)); : GOTO 10",
     "author": "Nick Montfort 等",
     "year": "2012",
     "url": "https://10print.org/"
    },
    {
     "title": "Truchet tilings and their generalisations",
     "author": "",
     "year": "",
     "url": "https://www.researchgate.net/publication/227098904_Truchet_tilings_and_their_generalisations"
    }
   ]
  },
  {
   "id": "F02",
   "name_zh": "伊斯蘭幾何圖樣（Hankin 法）",
   "name_en": "Islamic Star Pattern (Hankin's Polygons-in-Contact)",
   "family": "F",
   "family_name": "圖樣與最佳化",
   "file": "F02_IslamicPattern.cs",
   "loc": 176,
   "logic": [
    "直接公式",
    "幾何轉換"
   ],
   "data_structure": [
    "幾何"
   ],
   "difficulty": 2,
   "difficulty_reason": "176 行、沒有自訂 class 也不看鄰居，但需要理解多邊形方向（逆時針）、以外積求內側法向量、兩射線求交點的 2D 行列式，數學門檻比 F01 高一階。",
   "tags": [
    "拼貼",
    "對稱",
    "幾何轉換"
   ],
   "one_liner": "先鋪一層八角形＋小正方形的底圖，再從每條邊的中點以固定角度往內射兩條線，交會處連起來，就長出八角星與四角星交織的伊斯蘭圖樣。",
   "how_it_works": [
    "BuildTiling：每格中心放一個平邊朝上下左右的正八角形，格線交點補一個轉 45° 的小正方形，組成 4.8.8 半正鋪面。",
    "對每個多邊形的每一對相鄰邊 A→B、B→C，取兩邊中點。",
    "以外積 Z × 邊方向求得內側法向量，把邊方向與法向量按 cos/sin(contactAngle) 混合，得到朝角點 B 往內偏的兩條射線。",
    "RaysMeet 用 2D 行列式解兩射線交點；只保留兩者都往前（distance > 0）的交點。",
    "從兩個中點各連一條線到交點；因相鄰多邊形共用邊中點，所有星形自動連成一張連續網。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 columns, rows, tileSize, contactAngle",
    "    輸出 patternLines, tiles",
    "",
    "    // 0. 防呆",
    "    格數 < 1 或 tileSize ≤ 0 → 結束",
    "    contactAngle 不在 0～90 → 改 67.5",
    "",
    "    // 1. DATA 資料",
    "    底圖多邊形（八角形＋小正方形）",
    "    contactAngle 轉弧度",
    "",
    "    // 4. OUTPUT 輸出",
    "    對每個多邊形：",
    "      丟給 HankinLines 得星線",
    "      外框首尾相連",
    "    星線 → patternLines",
    "    外框 → tiles",
    "",
    "  // ----- RunScript 下方 -----",
    "  HankinLines：邊中點斜射（contactAngle），兩線交會 → 連線",
    "  BuildTiling：每格中心放正八角形，格線交點放轉 45 度小正方形",
    "  RaysMeet：兩射線的交點；平行或交在背後 → 沒有"
   ],
   "key_params": [
    {
     "name": "contactAngle",
     "effect": "射線與邊的夾角（0–90°）；小角度星芒扁而寬、接近底圖，大角度星芒尖而細長，67.5° 是八角星的經典值。"
    },
    {
     "name": "columns / rows",
     "effect": "八角形的格數；小正方形會多一圈（columns+1 × rows+1）。"
    },
    {
     "name": "tileSize",
     "effect": "每格邊長；八角形邊長 = tileSize / (1 + √2)，只影響尺度。"
    }
   ],
   "csharp_concepts": [
    "List<List<Point3d>>",
    "Vector3d.CrossProduct",
    "Unitize",
    "RhinoMath.ToRadians",
    "out 參數",
    "模運算 (i+1)%n 環狀索引",
    "Polyline"
   ],
   "prerequisites": [
    "迴圈與 helper method",
    "向量加減、單位化與外積",
    "三角函數 cos/sin",
    "多邊形頂點順序（逆時針）"
   ],
   "teaching_note": "適合從零實作，但建議先用紙筆畫一個八角形示範 Hankin 法，再寫程式；最容易出錯的是多邊形頂點順序，順時針輸入會讓射線往外跑。把 contactAngle 接滑桿從 30° 拉到 85° 的效果非常好，能直觀看到「一個參數改變整個圖樣家族」。",
   "variations": [
    {
     "title": "換底圖：六角形／三角形鋪面",
     "level": 1,
     "what_changes": "規則（底圖鋪面）",
     "how": "改寫 BuildTiling，產生正六角形蜂巢或 3.6.3.6 等半正鋪面；HankinLines 完全不用改。",
     "result": "六角星、十二角星等不同家族的圖樣，驗證「底圖決定星形、角度決定風格」。"
    },
    {
     "title": "吸引子漸變接觸角",
     "level": 2,
     "what_changes": "輸入（每個多邊形各自的角度）",
     "how": "新增 Point3d attractor，對每個多邊形用其中心到吸引子距離映射出 contactAngle，再傳給 HankinLines。",
     "result": "星芒從粗鈍漸變到尖細的連續立面，類似 Kaplan 論文中的 parquet deformation 效果。"
    },
    {
     "title": "兩點接觸（contact offset）",
     "level": 2,
     "what_changes": "規則（射線起點）",
     "how": "射線不從中點出發，而是從中點沿邊往兩側各偏 delta 的兩點出發，各自射出一條線（Kaplan 的 delta 參數）。",
     "result": "線條分叉成雙線帶，星形中心出現小多邊形，圖樣更接近傳統交織（interlace）。"
    },
    {
     "title": "交織帶（over-under strapwork）",
     "level": 3,
     "what_changes": "輸出（線 → 有厚度的帶）",
     "how": "把每條線 Offset 成兩條平行線形成帶狀，在交叉處依序交替判斷上下並切斷下方帶；需要建立交點清單與線段順序。",
     "result": "經典伊斯蘭編織帶效果，可直接做雷射切割的兩層板或石材拼花。"
    },
    {
     "title": "girih 十角鋪面（五重對稱）",
     "level": 3,
     "what_changes": "規則（底圖改為 girih 五種磁磚）",
     "how": "底圖改用十邊形、五邊形、細長六邊形、蝴蝶結六邊形、菱形五種等邊磁磚，接觸角固定 54°（或 72°）。",
     "result": "十角星與五角星交織的波斯風圖樣，可延伸到準週期（Penrose 型）鋪面。"
    },
    {
     "title": "Penrose / 準週期底圖",
     "level": 4,
     "what_changes": "規則（底圖由遞迴細分產生）",
     "how": "先用遞迴 deflation 產生 Penrose 菱形鋪面（或 girih 的自相似細分），再對每片菱形套 Hankin 法。",
     "result": "永不重複但處處有局部對稱的圖樣，對應 Lu & Steinhardt 對 Darb-e Imam 的研究。"
    },
    {
     "title": "Voronoi 自由底圖",
     "level": 3,
     "what_changes": "輸入（不規則多邊形）",
     "how": "以點雲建 Voronoi 或 Delaunay 對偶多邊形當底圖，確保每個多邊形為凸且逆時針，再套 HankinLines；角度可依多邊形邊數調整。",
     "result": "失去嚴格對稱、但保留「星形＋共用中點」語彙的自由形圖樣，適合不規則基地或雙曲立面。"
    },
    {
     "title": "曲面上的星形圖樣",
     "level": 2,
     "what_changes": "維度（平面 → 曲面）",
     "how": "在 UV 參數空間生成圖樣，再用 surface.PointAt 映射每條線的端點（或細分後映射）；圓頂可用極座標網格代替方格。",
     "result": "覆蓋穹頂或雙曲屋頂的連續星形格柵，類似 Louvre Abu Dhabi 穹頂的概念。"
    },
    {
     "title": "星形開口與面板輸出",
     "level": 2,
     "what_changes": "輸出（線 → 封閉面）",
     "how": "用 Curve.CreateBooleanRegions 或 Region 元件把線網切出封閉區域，依區域是星、多邊形或縫隙分類，分別 Extrude 或做開孔。",
     "result": "可直接送 CNC 的穿孔鋁板或 mashrabiya 屏風。"
    },
    {
     "title": "日照驅動可動遮陽",
     "level": 3,
     "what_changes": "狀態（加入時間與環境輸入）",
     "how": "以太陽向量與面板法向量的夾角決定每個星形的開合程度（contactAngle 或縮放中心點），接 Timer 模擬一天中的變化。",
     "result": "隨日照開閉的星形遮陽立面，呼應 Institut du Monde Arabe 與 Al Bahr Towers。"
    },
    {
     "title": "多層疊合（穹頂光影）",
     "level": 2,
     "what_changes": "維度（單層 → 多層）",
     "how": "同一底圖用不同 tileSize、旋轉角與 contactAngle 產生 3–8 層，沿 Z 方向堆疊，再用太陽光線投影計算地面光斑。",
     "result": "多層交錯形成的「光之雨」效果，可做天花或雨遮研究。"
    },
    {
     "title": "星形內再長星形（遞迴）",
     "level": 3,
     "what_changes": "迴圈（加入遞迴）",
     "how": "把 Hankin 線切出的中心星形或多邊形當成新底圖，縮小角度再套一次 HankinLines，遞迴 2–3 層。",
     "result": "自相似的多層星形，接近波斯後期兩層級 girih 圖樣。"
    }
   ],
   "project_seeds": [
    {
     "title": "參數化 mashrabiya 遮陽立面",
     "brief": "以 Hankin 法產生立面格柵，接日照分析讓每片面板的接觸角隨太陽輻射變化，比較開孔率與室內日照時數。",
     "difficulty": 3,
     "combine_with": [
      "C03"
     ]
    },
    {
     "title": "雙曲穹頂星形屋頂",
     "brief": "在穹頂曲面上以極座標網格生成星形圖樣，疊 3 層不同尺度，模擬地面光斑，並輸出可製造的平板展開件。",
     "difficulty": 4,
     "combine_with": [
      "E01"
     ]
    },
    {
     "title": "底圖圖鑑：一個角度，十種鋪面",
     "brief": "實作 4 種以上半正鋪面與 girih 五磚，系統性比較不同 contactAngle 的結果，整理成可挑選的圖樣目錄並雷射切割樣板。",
     "difficulty": 2,
     "combine_with": [
      "F01"
     ]
    },
    {
     "title": "自由形伊斯蘭圖樣（Voronoi／圓堆積底圖）",
     "brief": "以 Circle Packing 或 Voronoi 生成不規則底圖，讓星形大小對應功能需求（採光、視線），參考 Lin & Kaplan 2023 的自由形方法。",
     "difficulty": 4,
     "combine_with": [
      "E01",
      "E02"
     ]
    },
    {
     "title": "準週期 girih 地坪",
     "brief": "以遞迴細分產生 Penrose／girih 準週期鋪面，再套 Hankin 法輸出交織帶，做成廣場或室內地坪的石材拼花圖。",
     "difficulty": 5,
     "combine_with": [
      "A04"
     ]
    }
   ],
   "references": [
    {
     "title": "Islamic star patterns from polygons in contact (Graphics Interface 2005, pp.177–185)",
     "author": "Craig S. Kaplan",
     "year": "2005",
     "url": "https://graphicsinterface.org/proceedings/gi2005/gi2005-22/"
    },
    {
     "title": "Decagonal and Quasi-Crystalline Tilings in Medieval Islamic Architecture (Science 315)",
     "author": "Peter J. Lu, Paul J. Steinhardt",
     "year": "2007",
     "url": "https://www.science.org/doi/10.1126/science.1135491"
    },
    {
     "title": "Freeform Islamic Geometric Patterns",
     "author": "Rebecca Lin, Craig S. Kaplan",
     "year": "2023",
     "url": "https://arxiv.org/abs/2301.01471"
    },
    {
     "title": "Next Generation of Star Patterns",
     "author": "Hadi Mansourifar, Weidong Shi",
     "year": "2018",
     "url": "https://arxiv.org/abs/1809.09270"
    },
    {
     "title": "Islamic geometric patterns（含 Hankin polygons in contact 說明）",
     "author": "Wikipedia",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Islamic_geometric_patterns"
    },
    {
     "title": "Girih tiles",
     "author": "Wikipedia",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Girih_tiles"
    }
   ]
  },
  {
   "id": "F03",
   "name_zh": "TPMS 三週期極小曲面",
   "name_en": "Triply Periodic Minimal Surface (TPMS)",
   "family": "F",
   "family_name": "圖樣與最佳化",
   "file": "F03_TPMS.cs",
   "loc": 250,
   "logic": [
    "直接公式",
    "幾何轉換"
   ],
   "data_structure": [
    "網格",
    "幾何"
   ],
   "difficulty": 4,
   "difficulty_reason": "公式本身只有一行，但要處理 3D 網格 double[,,]、立方體切 6 個四面體的查表、三角形朝向判斷與頂點合併，是多階段 3D 網格管線，出錯時很難從畫面看出原因。",
   "tags": [
    "等值面",
    "3D",
    "對稱",
    "查表",
    "晶格"
   ],
   "one_liner": "用一行三角函數公式定義一個會在 x、y、z 三方向無限重複的曲面（如 Gyroid），再把「公式等於 0 的地方」轉成可 3D 列印的 Mesh。",
   "how_it_works": [
    "把 size 邊長的立方體切成 cellCount³ 個小格，每個格點用公式算一個值（Gyroid：sin x cos y + sin y cos z + sin z cos x）。",
    "periods 控制公式的頻率，也就是每邊重複幾個單元。",
    "逐一掃過每個小立方體，取出 8 個角的座標與數值。",
    "每個立方體切成 6 個四面體；依四面體中「內側角（f < isoValue）」的數量產生 0、1 或 2 個三角形。",
    "三角形頂點用線性內插放在數值剛好等於 isoValue 的位置，並依內外側方向統一法線，最後合併重複頂點成 Mesh。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 surfaceType, cellCount, size, periods, isoValue",
    "    輸出 mesh, triangleCount",
    "",
    "    // 0. 防呆",
    "    cellCount 限 2～60",
    "    size ≤ 0 → 10",
    "    periods ≤ 0 → 1",
    "",
    "    // 1. DATA 資料",
    "    每格大小（size ÷ cellCount）",
    "    格點數值表、三角形點清單",
    "",
    "    // 2. INIT 初始",
    "    每個格點算一次公式",
    "",
    "    // 3. LOOP 迭代：逐一掃過每個小立方體",
    "    對每個小立方體：",
    "      取 8 個角的位置和數值",
    "      切 6 個四面體，各自丟給 AddTetrahedronTriangles",
    "",
    "    // 4. OUTPUT 輸出",
    "    三角形數 → triangleCount",
    "    點清單建成 mesh → mesh",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：立方體 8 角的位移、6 個四面體的角編號",
    "  SurfaceFormula：Gyroid 或 Schwarz P 公式，0 就是曲面",
    "  AddTetrahedronTriangles：看幾個角在 isoValue 內側 → 畫 0～2 個三角形",
    "  PointOnEdge：邊上剛好等於 isoValue 的點",
    "  AveragePoint：幾個角的平均位置",
    "  AddTriangle：加三角形，朝向統一",
    "  BuildMesh：三角形 → Mesh，合併重複頂點"
   ],
   "key_params": [
    {
     "name": "surfaceType",
     "effect": "0 = Gyroid（螺旋迷宮）、1 = Schwarz P（管狀十字接頭）"
    },
    {
     "name": "cellCount",
     "effect": "取樣解析度；越高越平滑，但計算量以立方成長（60 已約 21 萬格）"
    },
    {
     "name": "size",
     "effect": "整個立方體的實際邊長"
    },
    {
     "name": "periods",
     "effect": "每邊重複幾個單元；越大孔越小越密，但要同步提高 cellCount 才不會破面"
    },
    {
     "name": "isoValue",
     "effect": "0 為標準極小曲面（兩側體積相等）；偏離 0 會讓一側通道變粗、另一側變細"
    }
   ],
   "csharp_concepts": [
    "三維陣列 double[,,]",
    "static readonly int[,] 查表",
    "Math.Sin / Math.Cos",
    "向量外積與內積判斷朝向",
    "Mesh.Vertices / Faces",
    "CombineIdentical",
    "List<int> 分組"
   ],
   "prerequisites": [
    "巢狀迴圈",
    "C05 Marching Squares 概念",
    "三角函數與弧度",
    "向量外積／內積"
   ],
   "teaching_note": "建議在 C05 之後學，強調「2D 找線 → 3D 找面」是同一個想法；可只改 SurfaceFormula 讓學習者立刻看到不同曲面，四面體切割部分當黑盒子說明即可。要提醒 cellCount 不要一次拉到 60，且 periods 提高時要同步提高解析度。",
   "variations": [
    {
     "title": "換公式：Schwarz D、Neovius、I-WP、Lidinoid",
     "level": 1,
     "what_changes": "規則（SurfaceFormula）",
     "how": "在 SurfaceFormula 加更多 surfaceType 分支，例如 Schwarz D：sin x sin y sin z + sin x cos y cos z + cos x sin y cos z + cos x cos y sin z；Neovius：3(cos x + cos y + cos z) + 4 cos x cos y cos z。",
     "result": "同一套管線立即得到不同拓樸的晶格，可比較孔洞形態與連通性。"
    },
    {
     "title": "Sheet（薄殼）與 Solid（實心骨架）版本",
     "level": 2,
     "what_changes": "規則／輸出",
     "how": "Sheet：改用 |f| - thickness 當場值，isoValue 設 0，就得到有厚度的雙面殼；Solid：只取 f < isoValue 並在外框補蓋面。",
     "result": "從無厚度曲面變成可直接列印、有壁厚的晶格構件。"
    },
    {
     "title": "漸變密度（Functionally Graded）",
     "level": 2,
     "what_changes": "輸入／規則",
     "how": "讓 isoValue 或 thickness 隨位置變化，例如 isoValue = map(point.Z) 或依到吸引子曲線的距離調整；即 f(x,y,z) - t(x,y,z)。",
     "result": "底部密實、頂部通透的漸層晶格，可對應受力或透光需求。"
    },
    {
     "title": "漸變週期與單元尺度",
     "level": 3,
     "what_changes": "規則",
     "how": "讓 periods 隨位置平滑變化（toAngle 依 point 變），或對座標先做非線性變形（如 x' = x + a·sin(y)），再代入公式。",
     "result": "孔洞大小由小到大漸變、或整體扭曲流動的晶格。"
    },
    {
     "title": "填入任意外形（SDF 交集）",
     "level": 3,
     "what_changes": "加約束／輸入",
     "how": "新增 Mesh 或 Brep 邊界輸入，對每個格點算到邊界的有號距離 d（內負外正），場值改為 max(f, d)，即布林交集。",
     "result": "Gyroid 晶格被裁成柱子、椅子或構件外形，而不是只能是立方體。"
    },
    {
     "title": "兩種 TPMS 混合過渡",
     "level": 3,
     "what_changes": "混合規則",
     "how": "f = (1 - w)·fGyroid + w·fSchwarzP，其中 w 依位置從 0 漸變到 1（例如依 X 座標或到吸引子的距離）。",
     "result": "晶格由螺旋迷宮逐漸轉成十字管網，可做空間序列或功能分區的過渡。"
    },
    {
     "title": "圓柱／曲面座標映射",
     "level": 4,
     "what_changes": "維度（直角座標→圓柱或曲面座標）",
     "how": "公式代入前先把 (x,y,z) 轉成 (角度 θ·R, 半徑 r, 高度 z)，讓週期沿圓周閉合；或用曲面 uv＋法向距離當三個座標。",
     "result": "環繞柱子的 Gyroid 外殼、或順著曲面立面彎曲的 TPMS 表皮。"
    },
    {
     "title": "只取 2D 切片當立面圖樣",
     "level": 1,
     "what_changes": "維度（3D→2D）",
     "how": "固定 z = 常數，把 SurfaceFormula 當作 C05 的 FieldValue 用 Marching Squares 描線；改變 z 就得到一系列不同切片。",
     "result": "迷宮狀的 2D 花紋，可做穿孔板、地坪或逐層雷切疊合。"
    },
    {
     "title": "輸出可製造幾何：封閉、減面、分件",
     "level": 3,
     "what_changes": "輸出轉可製造幾何",
     "how": "sheet 版本用 Mesh.Offset(thickness, true) 或自寫雙層加側邊封閉；再用 Mesh.Reduce 降面數、依單元切成可列印尺寸的模組並檢查 IsClosed。",
     "result": "可送 3D 列印（FDM、SLA、砂印）的水密 Mesh 構件。"
    },
    {
     "title": "效能版：只算一次邊點＋平行化",
     "level": 4,
     "what_changes": "迴圈／資料結構",
     "how": "用 Dictionary<(int,int,int,int),int> 快取每條邊的內插頂點避免重複，外層迴圈改 Parallel.For，每執行緒各自收集三角形再合併。",
     "result": "解析度可拉到 100 以上而仍可互動，Mesh 也不需要事後 CombineIdentical。"
    },
    {
     "title": "動畫化：isoValue 或相位掃描",
     "level": 2,
     "what_changes": "動畫",
     "how": "接 Timer，讓 isoValue 在 -1 到 1 間往復，或在公式座標加相位 x + t；每幀重算。",
     "result": "晶格通道一邊膨脹一邊收縮、或持續流動的動畫，可展示兩個互鎖空間的關係。"
    },
    {
     "title": "混合其他家族：依應力或生長結果調密度",
     "level": 4,
     "what_changes": "混合其他家族",
     "how": "把 E 家族排列或結構分析（例如 Karamba／Millipede 的應力值）取樣到格點，當成 thickness(x,y,z) 輸入；或用 B 家族 DLA／空間殖民結果的距離場當遮罩。",
     "result": "受力大處密實、受力小處通透的仿生骨骼式構件。"
    }
   ],
   "project_seeds": [
    {
     "title": "TPMS 公式圖鑑與切片花磚",
     "brief": "至少實作 5 種 TPMS 公式，並取 2D 切片轉成可雷切或陶瓷壓模的花磚圖樣，整理每種曲面的孔隙率與視覺特性。",
     "difficulty": 2,
     "combine_with": [
      "C05"
     ]
    },
    {
     "title": "漸變密度 Gyroid 柱或椅",
     "brief": "把 Gyroid 裁進柱或椅的外形，依支撐位置或載重方向調整壁厚，輸出可 3D 列印的縮尺原型並比較重量。",
     "difficulty": 3,
     "combine_with": []
    },
    {
     "title": "TPMS 通風／遮陽表皮模組",
     "brief": "在曲面立面上做 TPMS 晶格表皮，依日照或視線需求調整 isoValue，讓開孔率沿立面漸變，並切成可製造的模組單元。",
     "difficulty": 4,
     "combine_with": [
      "C05"
     ]
    },
    {
     "title": "兩種 TPMS 混合的空間序列裝置",
     "brief": "在一個可穿越的裝置尺度中，讓 Schwarz P 漸變為 Gyroid，研究兩個互鎖空間的連通與動線，產出分件與組裝圖。",
     "difficulty": 4,
     "combine_with": []
    },
    {
     "title": "應力驅動的 TPMS 構件",
     "brief": "先以結構分析取得構件內部應力場，再轉成 TPMS 壁厚場，比較均勻晶格與漸變晶格的重量與剛度；需自寫高效能等值面。",
     "difficulty": 5,
     "combine_with": [
      "E01"
     ]
    }
   ],
   "references": [
    {
     "title": "Infinite Periodic Minimal Surfaces Without Self-Intersections（NASA Technical Note）",
     "author": "Alan H. Schoen",
     "year": "1970",
     "url": "https://schoengeometry.com/e-tpms.html"
    },
    {
     "title": "Triply periodic minimal surface（Wikipedia）",
     "author": "",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Triply_periodic_minimal_surface"
    },
    {
     "title": "Gyroid（Wikipedia）",
     "author": "",
     "year": "",
     "url": "https://en.wikipedia.org/wiki/Gyroid"
    },
    {
     "title": "Polygonising a Scalar Field（含四面體切割法）",
     "author": "Paul Bourke",
     "year": "1994",
     "url": "https://paulbourke.net/geometry/polygonise/"
    },
    {
     "title": "Marching cubes: A high resolution 3D surface construction algorithm",
     "author": "William E. Lorensen, Harvey E. Cline",
     "year": "1987",
     "url": "https://dl.acm.org/doi/10.1145/37402.37422"
    },
    {
     "title": "Novel 3D printed TPMS scaffolds: microstructure, characteristics and applications in bone regeneration",
     "author": "",
     "year": "",
     "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11283664"
    },
    {
     "title": "An Overview of Additive Manufacturing of Triply Periodic Minimal Surface (TPMS) Structures",
     "author": "",
     "year": "",
     "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12736839"
    }
   ]
  },
  {
   "id": "F04",
   "name_zh": "基因演算法",
   "name_en": "Genetic Algorithm",
   "family": "F",
   "family_name": "圖樣與最佳化",
   "file": "F04_GeneticAlgorithm.cs",
   "loc": 199,
   "logic": [
    "搜尋／求解",
    "迭代模擬"
   ],
   "data_structure": [
    "粒子"
   ],
   "difficulty": 3,
   "difficulty_reason": "有自訂 class Candidate、精英保留＋小組比賽選擇＋交配＋突變四個步驟，還要注意陣列 Clone 的參考陷阱，且結果高度依賴族群數與突變率的調參。",
   "tags": [
    "最佳化",
    "隨機",
    "可重現種子",
    "收斂",
    "自訂 class"
   ],
   "one_liner": "先亂丟一大堆方案，打分數、讓好方案互相「生小孩」再隨機小改，一代一代留下更好的設計。",
   "how_it_works": [
    "把一個設計方案編碼成「基因」：這裡是一整組點的座標（Point3d 陣列）。",
    "隨機產生第一代 populationSize 組方案，每組用 ScoreOf 算分數（點與點最近距離，越大越分散）。",
    "排序後保留最好的 EliteCount 組直接進下一代（精英）。",
    "其餘名額：用小組比賽（Tournament）挑兩個父母，逐點隨機繼承（均勻交配），再以 mutationRate 讓少數點小幅移動（突變）。",
    "重複 generations 代，記錄每代最佳分數，最後輸出最佳解與收斂曲線。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 pointCount, width, height, populationSize, generations, mutationRate, seed",
    "    輸出 bestPoints, bestScores, bestScore",
    "",
    "    // 0. 防呆",
    "    pointCount < 2 或尺寸 ≤ 0 → 結束",
    "    populationSize 至少 EliteCount + 2",
    "    mutationRate 限 0～1",
    "",
    "    // 1. DATA 資料",
    "    隨機數（seed）、族群、每代最佳分數清單",
    "",
    "    // 2. INIT 初始",
    "    隨機產生第一代",
    "",
    "    // 3. LOOP 迭代",
    "    重複 generations 次：",
    "      評分、排序（高分在前），記最佳分數",
    "      精英直接進下一代",
    "      其餘：挑父母 → 交配 → 突變，補滿",
    "      下一代 → 族群",
    "",
    "    // 4. OUTPUT 輸出",
    "    再評一次分，挑最高分",
    "    最佳解的點 → bestPoints",
    "    每代最佳分數 → bestScores",
    "    最終分數 → bestScore",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：EliteCount 2、TournamentSize 3",
    "  ScoreOf：所有點兩兩之間最近的距離",
    "  PickByTournament：抽 TournamentSize 組，最高分勝出",
    "  Crossover：每個點隨機拿爸爸或媽媽的",
    "  Mutate：少數點（機率 mutationRate）隨機挪一點，不出矩形",
    "",
    "// ----- Script_Instance 外面 -----",
    "Candidate：一組點、分數；可隨機產生、可複製"
   ],
   "key_params": [
    {
     "name": "populationSize",
     "effect": "族群越大越不容易卡在局部最佳，但每代運算量線性增加。"
    },
    {
     "name": "generations",
     "effect": "代數越多分數越高，但後期進步趨緩；可接 Quick Graph 看何時收斂。"
    },
    {
     "name": "mutationRate",
     "effect": "太低容易早熟收斂成一樣的解；太高則像亂數搜尋、好基因被破壞。"
    },
    {
     "name": "seed",
     "effect": "同一個 seed 可重現同一次演化；換 seed 可比較不同演化路線。"
    },
    {
     "name": "EliteCount / TournamentSize（常數）",
     "effect": "精英越多越保守；比賽人數越多選擇壓力越大、收斂越快但多樣性下降。"
    }
   ],
   "csharp_concepts": [
    "自訂 class（Candidate）",
    "static 工廠方法 CreateRandom",
    "陣列 Clone 與參考型別",
    "List.Sort 搭配 lambda 比較器",
    "LINQ OrderByDescending",
    "Random 與種子"
   ],
   "prerequisites": [
    "迴圈與巢狀迴圈",
    "class 與欄位",
    "參考型別 vs 值型別",
    "Point3d.DistanceTo"
   ],
   "teaching_note": "很適合從零實作：五個步驟（評分、排序、精英、選擇、交配突變）各自是一個小方法，可以一次講一個。務必示範 Copy() 不 Clone 陣列時精英被突變污染的 bug；也要提醒「適應度函數就是設計意圖」，換題目主要是改 ScoreOf。",
   "variations": [
    {
     "title": "換適應度：最大化日照或視野",
     "level": 3,
     "what_changes": "規則（ScoreOf）",
     "how": "把 ScoreOf 改成計算每個點到太陽向量的遮蔽次數或到景觀點的可見性（用 Ray 與 Mesh 求交），分數越高越好。",
     "result": "點會自動移到不被遮擋、日照最佳的位置，可當量體或開窗配置。"
    },
    {
     "title": "多目標加權：分散又靠近邊界",
     "level": 3,
     "what_changes": "規則（ScoreOf）",
     "how": "新增輸入 weight，分數 = 最近距離 × weight + 平均到邊界距離的倒數 × (1 − weight)；調權重觀察取捨。",
     "result": "同一組程式可在「均勻分散」與「貼邊排列」之間連續切換，理解 Pareto 取捨的概念。"
    },
    {
     "title": "曲線邊界內配置",
     "level": 3,
     "what_changes": "輸入／狀態",
     "how": "把矩形換成任意封閉 Curve 輸入，CreateRandom 與 Mutate 用 Curve.Contains 檢查，超出就重抽或拉回最近點。",
     "result": "可在不規則基地、樓板輪廓內自動分散柱位、樹木或座位。"
    },
    {
     "title": "升到 3D 或曲面上",
     "level": 3,
     "what_changes": "維度",
     "how": "基因改存曲面 UV 參數（Point2d），評分時用 Surface.PointAt 轉 3D 再算距離；或直接加 Z 座標與 depth 輸入。",
     "result": "在曲面屋頂上均勻分布天窗、在體積內分布懸吊物件。"
    },
    {
     "title": "基因改成滑桿參數",
     "level": 3,
     "what_changes": "資料結構（基因編碼）",
     "how": "Candidate 改存 double[] genes，每個 gene 對應一個設計參數（樓高、旋轉、退縮），評分函數先用 genes 生成幾何再算面積或體積誤差。",
     "result": "等於自己寫一個迷你 Galapagos，可對任何參數化量體做最佳化。"
    },
    {
     "title": "吸子加權的評分",
     "level": 2,
     "what_changes": "輸入（吸子）",
     "how": "新增 attractorPoints 輸入，最近距離的門檻依離吸子的距離放大或縮小，讓評分鼓勵「靠近吸子密、遠離吸子疏」。",
     "result": "自動產生有疏密變化的點陣，可接 Voronoi 做立面開孔。"
    },
    {
     "title": "動畫化演化過程",
     "level": 2,
     "what_changes": "迴圈／輸出",
     "how": "把族群存成類別欄位，接 Timer 每次 RunScript 只跑一代並輸出當代最佳解；加 reset 布林輸入重新初始化。",
     "result": "可以即時看點雲一代代散開，適合簡報與理解收斂。"
    },
    {
     "title": "混合 Voronoi 產生可製造圖樣",
     "level": 3,
     "what_changes": "輸出／混合其他家族",
     "how": "把 bestPoints 接 Voronoi，並把 ScoreOf 改成「每個 Voronoi cell 面積與目標面積的差」越小越好。",
     "result": "得到大小均勻、可雷切的蜂巢或石板鋪面切割圖。"
    },
    {
     "title": "結構或性能外掛評分",
     "level": 4,
     "what_changes": "規則（外部模擬）",
     "how": "評分不在 C# 裡算，而是讀取 Karamba 位移或 Ladybug 日照結果；需要多元件、一代一代把 genes 輸出再讀回分數（或改用 Galapagos 接相同基因）。",
     "result": "真正的性能導向設計：桁架高度、遮陽板角度依模擬結果演化。"
    },
    {
     "title": "互動式演化（人當評審）",
     "level": 3,
     "what_changes": "規則（選擇方式）",
     "how": "每代輸出 9 組候選幾何排成九宮格，用 Value List 讓使用者點選喜歡的兩組當父母，取代 ScoreOf。",
     "result": "類似 Karl Sims Genetic Images 的美學演化，適合形式探索而非數值最佳化。"
    }
   ],
   "project_seeds": [
    {
     "title": "樓板柱位自動配置器",
     "brief": "給一個不規則樓板輪廓與最大跨距，用 GA 找出柱子數量最少、又滿足每點到最近柱距離上限的柱位配置。輸出柱位與分數收斂圖。",
     "difficulty": 2,
     "combine_with": [
      "C03"
     ]
    },
    {
     "title": "日照導向的住宅量體排列",
     "brief": "在基地上放 N 棟方塊，基因為位置與高度，評分同時考慮容積與冬至日照時數（Ray 遮擋計算），比較不同權重的結果。",
     "difficulty": 3,
     "combine_with": []
    },
    {
     "title": "GA × Voronoi 均質鋪面",
     "brief": "在曲線邊界內演化 Voronoi 種子點，讓每塊鋪面面積接近目標值，輸出可雷切的切割圖與編號。",
     "difficulty": 3,
     "combine_with": [
      "E02"
     ]
    },
    {
     "title": "迷你 Octopus：兩目標 Pareto 前緣",
     "brief": "改寫評分為兩個目標並實作非支配排序，把整個族群畫成二維散佈圖，挑選前緣上的幾組方案做比較展板。",
     "difficulty": 4,
     "combine_with": []
    },
    {
     "title": "演化出來的遮陽立面",
     "brief": "立面上每片遮陽板的角度是一個基因，評分結合日照遮蔽比例與視野開口比例，最後輸出可製造的板件清單。",
     "difficulty": 5,
     "combine_with": [
      "C04"
     ]
    }
   ],
   "references": [
    {
     "title": "Adaptation in Natural and Artificial Systems",
     "author": "John H. Holland",
     "year": "1975",
     "url": ""
    },
    {
     "title": "Genetic Algorithms in Search, Optimization, and Machine Learning",
     "author": "David E. Goldberg",
     "year": "1989",
     "url": ""
    },
    {
     "title": "An Evolutionary Architecture",
     "author": "John Frazer",
     "year": "1995",
     "url": "https://www.aaschool.ac.uk/public/whats-on/an-evolutionary-architecture"
    },
    {
     "title": "Galapagos: On the Logic and Limitations of Generic Solvers",
     "author": "David Rutten",
     "year": "2013",
     "url": "https://www.researchgate.net/publication/264299633_Galapagos_On_the_Logic_and_Limitations_of_Generic_Solvers"
    },
    {
     "title": "Project Discover: An Application of Generative Design for Architectural Space Planning",
     "author": "Danil Nagy, Damon Lau, John Locke, Jim Stoddart, Lorenzo Villaggi, Ray Wang, Dale Zhao, David Benjamin",
     "year": "",
     "url": "https://www.research.autodesk.com/app/uploads/2023/03/project-discover-an-application.pdf_recXlggwMF7WwIj7i.pdf"
    },
    {
     "title": "Galapagos Evolutionary Solver in Grasshopper（CMU 課程講義）",
     "author": "Dave Touretzky",
     "year": "",
     "url": "https://www.cs.cmu.edu/afs/cs/academic/class/15394-s23/lectures/galapagos/galapagos.html"
    }
   ]
  },
  {
   "id": "F05",
   "name_zh": "最短路徑（Dijkstra）",
   "name_en": "Shortest Path (Dijkstra)",
   "family": "F",
   "family_name": "圖樣與最佳化",
   "file": "F05_ShortestPath.cs",
   "loc": 196,
   "logic": [
    "搜尋／求解"
   ],
   "data_structure": [
    "網格",
    "圖（點＋連線）"
   ],
   "difficulty": 3,
   "difficulty_reason": "沒有自訂 class，但要同時維護五個二維陣列（障礙、已確定、距離、來源欄列）、8 鄰居更新與終點倒推路徑，屬於鄰居搜尋＋收斂判斷的中階結構。",
   "tags": [
    "鄰居搜尋",
    "最佳化",
    "網格擴散"
   ],
   "one_liner": "把基地切成格子，從起點像水波一樣一圈圈擴散，第一個碰到終點的那條就是繞過障礙物的最短路線。",
   "how_it_works": [
    "把範圍切成 cellSize 大小的格點，距離障礙物中心小於 obstacleRadius 的格點標為不能走。",
    "所有格點的「離起點距離」先設為無限大，起點設為 0。",
    "每一輪掃描全部格點，挑出「還沒確定、距離最小」的格點，把它標為已確定。",
    "更新它 8 個鄰居：直走加 1 格、斜走加 √2 格，如果比原本記錄的距離更短就改寫，並記下「從哪一格走過來」。",
    "確定到終點時停止，沿著「從哪一格走過來」從終點倒推回起點，反轉後輸出 Polyline。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 startPoint, endPoint, obstaclePoints, obstacleRadius, cellSize, areaWidth, areaHeight",
    "    輸出 path, blockedPoints, pathLength",
    "",
    "    // 0. 防呆",
    "    cellSize 或範圍 ≤ 0 → 結束",
    "    沒有 obstaclePoints → 空清單",
    "    格子超過 1 萬 → 結束",
    "",
    "    // 1. DATA 資料",
    "    欄數、列數",
    "    每格記錄：被擋、已確定、離起點距離、從哪一格來",
    "    被擋格點清單",
    "",
    "    // 2. INIT 初始",
    "    obstacleRadius 內的格點 → 被擋 → blockedPoints",
    "    起點、終點對齊格點；被擋 → 結束",
    "    距離全設無限大，起點 0",
    "",
    "    // 3. LOOP 迭代",
    "    重複到終點確定為止：",
    "      挑還沒確定、離起點最近的格點",
    "      找不到 → 停（剩下走不到）",
    "      標成已確定；是終點 → 停",
    "      8 個鄰居：更近 → 更新距離、記從哪來",
    "",
    "    // 4. OUTPUT 輸出",
    "    終點距離仍無限大 → 結束",
    "    從終點倒推回起點",
    "    路徑 → path",
    "    路徑長度 → pathLength",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：8 個方向的一步",
    "  GridPoint：欄列編號 → 座標",
    "  NearestIndex：座標 → 最近的格號，超出就夾在邊上"
   ],
   "key_params": [
    {
     "name": "cellSize",
     "effect": "格子越小路徑越平滑精準，但格點數平方成長，超過 10000 格會被防呆擋下。"
    },
    {
     "name": "obstacleRadius",
     "effect": "障礙半徑越大，通道越窄甚至被封死（輸出「走不到終點」）。"
    },
    {
     "name": "obstaclePoints",
     "effect": "障礙物分布決定路徑繞行方式；可改成建築量體、樹木或設備位置。"
    },
    {
     "name": "NeighborSteps（常數）",
     "effect": "4 鄰居只能直角轉彎、8 鄰居可斜走；改成 16 鄰居路徑更接近任意角度。"
    }
   ],
   "csharp_concepts": [
    "二維陣列 bool[,] / double[,] / int[,]",
    "double.MaxValue 當無限大",
    "static readonly 常數表 int[,]",
    "LINQ Any",
    "Polyline 與 Reverse",
    "while(true) 搭配 break"
   ],
   "prerequisites": [
    "巢狀迴圈",
    "陣列",
    "格點座標與索引互換",
    "圖（節點＋邊）的概念"
   ],
   "teaching_note": "適合從零實作，但建議先用紙上 5×5 格手算一次再寫程式。範例用 O(n²) 掃描找最小值，刻意不用優先佇列，方便理解；可以當作「為什麼需要 PriorityQueue」的延伸話題。倒推路徑那段（cameFrom）是學習者最常卡住的地方。",
   "variations": [
    {
     "title": "A* 啟發式搜尋",
     "level": 3,
     "what_changes": "規則",
     "how": "挑下一格時改比較「已走距離＋到終點直線距離」，其餘不變；可再印出展開格數跟 Dijkstra 比較。",
     "result": "路徑一樣最短，但搜尋範圍明顯縮小、速度更快。"
    },
    {
     "title": "地形坡度成本",
     "level": 3,
     "what_changes": "規則（邊的權重）",
     "how": "新增 terrain Surface 輸入，stepDistance 改成 3D 距離再乘上坡度懲罰（高差／水平距離超過門檻就加倍或禁止）。",
     "result": "得到沿等高線蜿蜒、符合無障礙坡度的步道。"
    },
    {
     "title": "影像當成本地圖",
     "level": 3,
     "what_changes": "輸入（影像）",
     "how": "讀入一張灰階圖，每格成本 = 1 + 亮度 × k，黑色直接視為障礙；stepDistance 乘上格子成本。",
     "result": "用畫筆就能描繪「好走／難走」區域，快速做景觀動線研究。"
    },
    {
     "title": "多起點距離場（可及性地圖）",
     "level": 3,
     "what_changes": "狀態／輸出",
     "how": "把多個入口都設為距離 0，不設終點跑到全部確定，輸出每個格點的距離值並依距離上色。",
     "result": "得到「離最近出口幾公尺」的熱圖，可做逃生距離或服務範圍檢討。"
    },
    {
     "title": "在曲線網路上走（真正的圖）",
     "level": 3,
     "what_changes": "資料結構",
     "how": "改用 Dictionary<int, List<(int, double)>> 表示節點與邊，節點由既有街道或走廊曲線的端點與交點產生，再跑相同 Dijkstra。",
     "result": "在真實街道網路上找最短路，接近 ShortestWalk 或 SpiderWeb 的做法。"
    },
    {
     "title": "3D 體素路徑",
     "level": 4,
     "what_changes": "維度",
     "how": "陣列改成三維 [x, y, z]，鄰居擴成 26 個方向，障礙改成 Brep.IsPointInside；注意格數立方成長需要優先佇列。",
     "result": "在樓板、梁之間自動繞行的管線或風管路由。"
    },
    {
     "title": "多組起終點＋流量疊加",
     "level": 3,
     "what_changes": "迴圈／輸出",
     "how": "對一組起終點配對逐一求最短路，每走過一個格點就把計數加一，輸出計數熱圖或依計數加粗路徑。",
     "result": "看出哪些通道最常被使用（類似 betweenness），可決定主動線寬度。"
    },
    {
     "title": "路徑轉成可製造幾何",
     "level": 2,
     "what_changes": "輸出",
     "how": "把 Polyline 做 Curve.Fillet 或重新擬合成 NURBS，再 Offset 兩側或 Pipe 成管，輸出步道板或管線實體。",
     "result": "從鋸齒折線變成可施工的平順步道或 3D 列印管路模型。"
    },
    {
     "title": "動畫化擴散波前",
     "level": 2,
     "what_changes": "迴圈／輸出",
     "how": "把陣列存成類別欄位並接 Timer，每次只擴展 k 個格點，輸出已確定格點依距離上色。",
     "result": "可以看見 Dijkstra 由起點一圈圈擴散的過程，學習效果極佳。"
    },
    {
     "title": "混合 GA：最佳化出入口位置",
     "level": 4,
     "what_changes": "混合其他家族",
     "how": "把出入口座標當 F04 的基因，評分為所有房間到最近出口的最長 Dijkstra 距離（越小越好）。",
     "result": "自動找到讓最遠點逃生距離最短的出口配置。"
    }
   ],
   "project_seeds": [
    {
     "title": "校園步行地圖：從教室到最近的咖啡",
     "brief": "把校園平面轉成格點與障礙，用多起點距離場算出每處到最近咖啡店的步行距離，輸出熱圖與建議新增點位。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "無障礙坡道自動選線",
     "brief": "在地形曲面上以坡度作為成本做 A*，找出不超過 1/12 坡度的最短路線，並輸出可施工的步道實體。",
     "difficulty": 3,
     "combine_with": []
    },
    {
     "title": "逃生距離檢討工具",
     "brief": "讀入樓層平面牆線，對所有出口做距離場，標示超過法規步行距離的區域，並用 GA 移動出口位置改善。",
     "difficulty": 4,
     "combine_with": [
      "F04"
     ]
    },
    {
     "title": "3D 管線自動路由",
     "brief": "在結構梁柱與樓板之間的體素空間中，為多條設備管線依序找最短路並避開已佔用格，輸出 Pipe 幾何。",
     "difficulty": 5,
     "combine_with": []
    },
    {
     "title": "人流熱度決定鋪面紋理",
     "brief": "隨機產生多組起終點求最短路並疊加流量，依流量改變鋪面磚的密度或顏色，做成景觀鋪面圖樣。",
     "difficulty": 3,
     "combine_with": [
      "C04"
     ]
    }
   ],
   "references": [
    {
     "title": "A note on two problems in connexion with graphs",
     "author": "Edsger W. Dijkstra",
     "year": "1959",
     "url": ""
    },
    {
     "title": "A Formal Basis for the Heuristic Determination of Minimum Cost Paths（A* 演算法）",
     "author": "Peter E. Hart, Nils J. Nilsson, Bertram Raphael",
     "year": "1968",
     "url": ""
    },
    {
     "title": "The Social Logic of Space",
     "author": "Bill Hillier, Julienne Hanson",
     "year": "1984",
     "url": ""
    },
    {
     "title": "Urban Network Analysis Toolbox",
     "author": "Andres Sevtsuk（MIT City Form Lab）",
     "year": "2012",
     "url": "https://cityform.mit.edu/projects/urban-network-analysis"
    },
    {
     "title": "The cityseer Python package for pedestrian-scale network-based urban analysis",
     "author": "Gareth Simons",
     "year": "2021",
     "url": "https://arxiv.org/pdf/2106.15314"
    },
    {
     "title": "SpiderWeb - Addon for Grasshopper",
     "author": "Richard Schaffranek",
     "year": "",
     "url": "https://grasshopperdocs.com/addons/spiderweb.html"
    }
   ]
  },
  {
   "id": "F06",
   "name_zh": "奇異吸子",
   "name_en": "Strange Attractor",
   "family": "F",
   "family_name": "圖樣與最佳化",
   "file": "F06_StrangeAttractor.cs",
   "loc": 118,
   "logic": [
    "迭代模擬",
    "直接公式"
   ],
   "data_structure": [
    "粒子"
   ],
   "difficulty": 1,
   "difficulty_reason": "扣掉樣板實際邏輯約 60 行、單一 for 迴圈、沒有自訂 class，每一步只是把公式代進去；難處在係數敏感而不在程式。",
   "tags": [
    "混沌",
    "直接公式",
    "3D",
    "動畫"
   ],
   "one_liner": "一條固定、沒有亂數的公式反覆代入上一步的位置，卻畫出永不重複、細節無窮的蝴蝶曲線或點雲。",
   "how_it_works": [
    "從 startPoint 出發，把目前位置放進清單。",
    "Lorenz（type 0）：用 a(y−x)、x(b−z)−y、xy−cz 算出速度向量，往前走 stepTime（歐拉法積分）。",
    "Clifford（type 1）：直接用 sin／cos 公式把 (x, y) 映射到下一個點，沒有時間概念。",
    "每一步檢查是否發散（無效或離原點超過 10⁶），發散就停止並提示係數不對。",
    "輸出 Polyline（看 Lorenz 軌跡）與點清單（看 Clifford 點雲）。"
   ],
   "pseudo_code": [
    "public class Script_Instance",
    "  private void RunScript(…)",
    "    輸入 attractorType, steps, stepTime, a, b, c, d, startPoint",
    "    輸出 curve, points",
    "",
    "    // 0. 防呆",
    "    steps < 1 → 結束",
    "    steps 最多 MaxSteps",
    "    stepTime ≤ 0 → 0.01",
    "",
    "    // 1. DATA 資料",
    "    路徑點清單",
    "",
    "    // 2. INIT 初始",
    "    從 startPoint 開始，記進路徑",
    "",
    "    // 3. LOOP 迭代：只看上一步",
    "    重複 steps 次：",
    "      attractorType 是 1 → CliffordNext，否則 LorenzNext",
    "      點無效或離原點太遠 → 發散，停",
    "      新點記進路徑",
    "",
    "    // 4. OUTPUT 輸出",
    "    點連成線 → curve",
    "    所有點 → points",
    "",
    "  // ----- RunScript 下方 -----",
    "  Fields：步數上限 200000",
    "  LorenzNext：算出速度，往前走 stepTime",
    "  CliffordNext：公式直接跳到下一點，Z 為 0"
   ],
   "key_params": [
    {
     "name": "a, b, c, d",
     "effect": "決定吸子的形狀；Lorenz 的 b 低於約 24 會收斂到固定點，Clifford 小改一點圖樣就完全不同。"
    },
    {
     "name": "steps",
     "effect": "步數越多點雲越濃密、曲線越完整；上限 200000。"
    },
    {
     "name": "stepTime",
     "effect": "Lorenz 的時間步長，太大軌跡會失真甚至發散，太小要更多步才畫得完整。"
    },
    {
     "name": "startPoint",
     "effect": "混沌的核心：起點差 0.001，長時間後軌跡完全不同，但整體形狀仍落在同一個吸子上。"
    }
   ],
   "csharp_concepts": [
    "Point3d 與 Vector3d 運算",
    "Math.Sin / Math.Cos",
    "Point3d.IsValid",
    "Polyline 建構",
    "const 常數"
   ],
   "prerequisites": [
    "for 迴圈",
    "向量加法與純量乘法",
    "基本三角函數"
   ],
   "teaching_note": "非常適合當暖身練習：程式短、結果驚豔。可以把兩個只差 0.001 的起點同時畫出來，直觀說明混沌。提醒學習者 Clifford 必須看點（Polyline 會亂連成一團），而 Lorenz 是看曲線。",
   "variations": [
    {
     "title": "換公式：de Jong、Rössler、Aizawa",
     "level": 1,
     "what_changes": "規則",
     "how": "新增 DeJongNext（x' = sin(a·y) − cos(b·x)、y' = sin(c·x) − cos(d·y)）或 Rössler 的速度公式，attractorType 多加幾個分支。",
     "result": "一支元件就能產生多種經典吸子，做成吸子圖鑑。"
    },
    {
     "title": "密度直方圖著色",
     "level": 2,
     "what_changes": "輸出",
     "how": "建立二維 int 陣列當格子，每個點落在哪格就加一，最後把次數用對數映射成顏色或 Mesh 頂點色。",
     "result": "得到 Paul Bourke 風格、有柔和明暗的吸子影像，可輸出高解析圖。"
    },
    {
     "title": "軌跡轉管狀雕塑",
     "level": 2,
     "what_changes": "輸出（可製造幾何）",
     "how": "Lorenz Polyline 先 Rebuild 平滑，再 Brep.CreatePipe，半徑依速度大小或步數變化。",
     "result": "可 3D 列印的吸子雕塑或吊燈骨架。"
    },
    {
     "title": "Clifford 點雲升到 3D",
     "level": 2,
     "what_changes": "維度",
     "how": "把 z 設成步數 × 高度係數，或加入第三條公式 z' = sin(e·x) + f·cos(e·z)。",
     "result": "平面圖樣變成螺旋堆疊的點雲塔或 3D 雲霧量體。"
    },
    {
     "title": "係數沿參數漸變",
     "level": 2,
     "what_changes": "狀態／迴圈",
     "how": "外層再跑一個 k 迴圈，每層的 a 從 a0 線性變到 a1，並把每層吸子往 Z 方向平移。",
     "result": "看見形狀如何隨係數演變，堆疊成一個有機量體或做成切片模型。"
    },
    {
     "title": "自動搜尋好看的係數",
     "level": 3,
     "what_changes": "混合搜尋",
     "how": "隨機產生係數，先跑幾千步排除發散或塌縮成點的組合，再用點雲覆蓋格數或 Lyapunov 指數篩選；可接 F04 當適應度。",
     "result": "仿 Sprott 的做法，自動產出大量不重複的吸子圖樣。"
    },
    {
     "title": "吸子映射到曲面上",
     "level": 3,
     "what_changes": "維度（曲面上）",
     "how": "把 Clifford 的 (x, y) 正規化到 0–1 後當 UV，用 Surface.PointAt 取得 3D 點，並沿法線做微小凸起。",
     "result": "在曲面屋頂或立面上形成混沌紋理的開孔或浮雕。"
    },
    {
     "title": "多起點粒子動畫",
     "level": 2,
     "what_changes": "迴圈／動畫",
     "how": "改成 N 個粒子各自從起點附近出發，存成類別欄位，接 Timer 每次推進一步並輸出最近 200 步的尾巴。",
     "result": "看到原本擠在一起的粒子逐漸分開、卻都繞著同一個蝴蝶形運動。"
    },
    {
     "title": "筆繪機輸出",
     "level": 2,
     "what_changes": "輸出（製造）",
     "how": "Lorenz 取 XY 投影或正交視圖，Polyline 簡化（Reduce Segments）後依長度切段，匯出成單線條曲線給 pen plotter 或雷射雕刻。",
     "result": "一筆畫到底的混沌線條畫作。"
    },
    {
     "title": "改用 RK4 積分",
     "level": 3,
     "what_changes": "規則（數值方法）",
     "how": "把 LorenzNext 的歐拉一步改成四階 Runge–Kutta（算 k1–k4 四次速度再加權平均）。",
     "result": "同樣 stepTime 下軌跡更準確、更不易發散，可比較兩種積分的差異。"
    }
   ],
   "project_seeds": [
    {
     "title": "吸子圖鑑海報",
     "brief": "實作 Clifford、de Jong 與密度直方圖著色，挑選 12 組係數排成海報並標註參數，討論係數敏感度。",
     "difficulty": 2,
     "combine_with": []
    },
    {
     "title": "Lorenz 管狀吊燈",
     "brief": "把 Lorenz 軌跡轉成變半徑的 Pipe，檢查最小管徑與自我相交後 3D 列印，做成可掛的燈具原型。",
     "difficulty": 3,
     "combine_with": []
    },
    {
     "title": "混沌立面開孔",
     "brief": "把吸子點雲的密度映射到立面曲面上，密度高處開大孔、低處開小孔，輸出可雷切的板件。",
     "difficulty": 3,
     "combine_with": [
      "C04"
     ]
    },
    {
     "title": "演化出來的吸子",
     "brief": "以 GA 搜尋 Clifford 係數，適應度為點雲覆蓋率與對稱度，把一代代的最佳吸子排成演化樹展示。",
     "difficulty": 4,
     "combine_with": [
      "F04"
     ]
    },
    {
     "title": "吸子流場中的粒子雕塑",
     "brief": "把 Lorenz 速度場當成 3D 向量場，讓上千個粒子隨場移動並留下軌跡，再轉成可製造的線材雕塑。",
     "difficulty": 4,
     "combine_with": [
      "C03"
     ]
    }
   ],
   "references": [
    {
     "title": "Deterministic Nonperiodic Flow",
     "author": "Edward N. Lorenz",
     "year": "1963",
     "url": "https://en.wikipedia.org/wiki/Lorenz_system"
    },
    {
     "title": "Clifford Attractors",
     "author": "Paul Bourke",
     "year": "2004",
     "url": "https://paulbourke.net/fractals/clifford/"
    },
    {
     "title": "Peter de Jong Attractors",
     "author": "Paul Bourke",
     "year": "",
     "url": "https://paulbourke.net/fractals/peterdejong/"
    },
    {
     "title": "The Lorenz Attractor, a thing of beauty",
     "author": "Paul Bourke",
     "year": "1997",
     "url": "https://paulbourke.net/fractals/lorenz/"
    },
    {
     "title": "Strange Attractors: Creating Patterns in Chaos",
     "author": "Julien C. Sprott",
     "year": "1993",
     "url": "https://sprott.physics.wisc.edu/sa.htm"
    },
    {
     "title": "Chaos in Wonderland",
     "author": "Clifford A. Pickover",
     "year": "1994",
     "url": ""
    },
    {
     "title": "Chaos: Making a New Science",
     "author": "James Gleick",
     "year": "1987",
     "url": ""
    }
   ]
  }
 ],
 "cases": [
  {
   "id": "A01-01",
   "algo": "A01",
   "title": "L-Systems in Architecture",
   "creator": "Michael Hansmeyer",
   "year": "",
   "category": "3d-architecture",
   "categories_extra": [
    "modeling"
   ],
   "scale": "建築",
   "summary": "Hansmeyer 探討將 L-system 從植物模擬轉用到建築形態生成，以字串改寫產生具遞迴與模組性的空間結構。展示了極少的規則如何產生空間上高度複雜的建築構成。",
   "variations": [
    {
     "name": "符號改成量體模組",
     "how": "畫筆遇到 F 時不畫線，改放置一個 Box 或柱樑模組（沿 pen.Location 定向），步長即模組尺寸。",
     "effect": "從線條分枝變成可讀的空間構架與量體堆疊。"
    },
    {
     "name": "90° 正交規則",
     "how": "turnAngle 固定 90°，並使用 & ^ 在三軸間轉向，讓結果貼齊建築格網。",
     "effect": "得到可施工的正交分枝框架，而非有機曲折。"
    },
    {
     "name": "多代並列比較",
     "how": "把 generations 從 1 到 N 分別輸出並沿 X 軸排開。",
     "effect": "形成設計演化序列，便於挑選與說明。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "字串改寫",
    "遞迴"
   ],
   "tools": [],
   "url": "https://michael-hansmeyer.com/l-systems",
   "image": {
    "file": "img/cases/A01-01.jpg",
    "w": 720,
    "h": 450,
    "source": "Michael Hansmeyer 官網",
    "author": "",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://michael-hansmeyer.com/l-systems",
    "note": ""
   }
  },
  {
   "id": "A01-02",
   "algo": "A01",
   "title": "以 L-system 進行分枝柱的形態生成與最佳化",
   "creator": "研究論文（Journal of Building Engineering）",
   "year": "2025",
   "category": "performance",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "提出以參數化 L-system 在設計早期生成分枝柱，並以吸引與排斥向量影響生長，再串接拓撲修正、結構分析與斷面最佳化（應力與挫屈約束）。比較不同規則所得分枝的剛度、重量與變形。",
   "variations": [
    {
     "name": "吸引／排斥向量",
     "how": "每次 F 前把前進方向朝屋頂支承點（吸引）偏轉、遠離其他分枝（排斥），偏轉量為參數。",
     "effect": "分枝末梢自動對準屋頂支撐點。"
    },
    {
     "name": "結構回饋迴圈",
     "how": "輸出桿件給 Karamba3D，以重量與最大位移為目標，讓最佳化器調整 turnAngle 與 branchScale。",
     "effect": "得到輕量且剛度足夠的分枝配置。"
    },
    {
     "name": "斷面依深度分級",
     "how": "記錄每段的分枝深度，主幹大斷面、末梢小斷面。",
     "effect": "更接近真實荷載傳遞的構件尺寸。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "吸引子控制",
    "最佳化"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://www.sciencedirect.com/science/article/pii/S2352710225030542",
   "image": {
    "file": "img/cases/A01-02.jpg",
    "w": 900,
    "h": 675,
    "source": "Wikimedia Commons",
    "author": "Rp22",
    "license": "CC BY 3.0",
    "license_url": "https://creativecommons.org/licenses/by/3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Sagrada-familia-arches2.jpg",
    "note": "相關實例：聖家堂的分枝柱（非論文原圖）"
   }
  },
  {
   "id": "A01-03",
   "algo": "A01",
   "title": "Stuttgart 機場航廈樹狀柱／以參數工具重探 Frei Otto 分枝柱",
   "creator": "Semra Arslan Selçuk, Nur Banu Gülle, Güneş Mutlu Avinç（研究）；原作 gmp 與 Frei Otto 樹狀柱原理",
   "year": "2022",
   "category": "3d-architecture",
   "categories_extra": [
    "performance"
   ],
   "scale": "建築",
   "summary": "Stuttgart 機場航廈以多層級分枝的鋼管樹狀柱支撐單坡屋頂，源自 Frei Otto 的分枝結構研究。Selçuk 等人的論文以參數化工具重新建構這類分枝柱，正是 L-system 的「幾層分枝、每層角度與長度縮放」邏輯。",
   "variations": [
    {
     "name": "固定層級數",
     "how": "generations 對應分枝層數（如 4 層），每層規則為 F → F[&F][^F][+F][-F] 的對稱四岔。",
     "effect": "得到與航廈相同的階層式樹狀柱。"
    },
    {
     "name": "頂部對齊屋面",
     "how": "最後一代分枝終點投影或延伸到屋頂平面／曲面上，截斷多餘長度。",
     "effect": "枝端均勻支撐屋面。"
    },
    {
     "name": "陣列成柱林",
     "how": "把起點改為網格點清單，每點跑一次 L-system，並加入隨機種子讓各柱略有差異。",
     "effect": "形成整片樹狀柱林的大跨空間。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "對稱",
    "遞迴"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://journals.sagepub.com/doi/10.1177/21582440221119479",
   "image": {
    "file": "img/cases/A01-03.jpg",
    "w": 900,
    "h": 675,
    "source": "Wikimedia Commons",
    "author": "JamesBowes",
    "license": "CC BY-SA 3.0",
    "license_url": "http://creativecommons.org/licenses/by-sa/3.0/",
    "page": "https://commons.wikimedia.org/wiki/File:Stuttgart_Airport_Interior_2005-06-02.jpg",
    "note": "斯圖加特機場航廈的樹狀柱"
   }
  },
  {
   "id": "A01-04",
   "algo": "A01",
   "title": "Rabbit：Grasshopper 的 L-system 與 3D Turtle 外掛",
   "creator": "Morphocode",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Rabbit 為 Grasshopper 提供 L-system 與 3D Turtle 直譯元件，支援確定性與隨機 L-system，並可視化為 3D 結構。與基礎範例幾乎是同一套邏輯，適合作為對照與延伸。",
   "variations": [
    {
     "name": "改寫與畫筆拆成兩個元件",
     "how": "把 ApplyRules 與 DrawLines 分成兩個 C# 元件，中間以字串串接，仿 Rabbit 的 LSystem + Turtle 架構。",
     "effect": "可以同一字串接不同直譯器（線、管、量體）。"
    },
    {
     "name": "加入隨機規則",
     "how": "同一符號允許多條規則並依機率選取，加 seed 輸入。",
     "effect": "重現 Rabbit 的隨機 L-system 功能。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "字串改寫",
    "3D",
    "多元件"
   ],
   "tools": [
    "Grasshopper",
    "Rabbit",
    "C#"
   ],
   "url": "https://morphocode.com/rabbit-grasshopper-3d-l-systems-3d-cellular-automata/",
   "image": {
    "file": "img/cases/A01-04.jpg",
    "w": 500,
    "h": 375,
    "source": "Morphocode",
    "author": "",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://morphocode.com/rabbit-grasshopper-3d-l-systems-3d-cellular-automata/",
    "note": ""
   }
  },
  {
   "id": "A01-05",
   "algo": "A01",
   "title": "Houdini L-System SOP 與 LsystemBuilding 範例",
   "creator": "SideFX",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "Houdini 內建 L-System 節點，以迭代字串改寫生成幾何；官方 LsystemBuilding 範例示範以 L-system 生成帶有窗戶的建築物，說明 L-system 不只用於植物。",
   "variations": [
    {
     "name": "符號實例化物件",
     "how": "新增符號（如 J、K）代表「在此放一個窗／板件」，DrawLines 遇到時輸出 Plane 清單供 Orient 使用。",
     "effect": "字串直接變成建築元件配置。"
    },
    {
     "name": "樓層式改寫",
     "how": "以 ^ 垂直前進代表樓層，規則控制每層重複與退縮。",
     "effect": "產生逐層變化的塔樓量體。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "字串改寫",
    "3D"
   ],
   "tools": [
    "Houdini"
   ],
   "url": "https://www.sidefx.com/docs/houdini/examples/nodes/sop/lsystem/LsystemBuilding.html"
  },
  {
   "id": "A01-06",
   "algo": "A01",
   "title": "Procedural Modeling of Cities（CityEngine 前身）",
   "creator": "Yoav I. H. Parish, Pascal Müller",
   "year": "2001",
   "category": "urban-landscape",
   "categories_extra": [
    "modeling"
   ],
   "scale": "群體／都市",
   "summary": "以擴充的 L-system 生成整座城市：輸入水陸邊界、人口密度等影像，長出高速公路與街道網，再切分地塊並生成建築。加入「全域目標」與「局部約束」降低規則複雜度，成為程序化城市生成的經典。",
   "variations": [
    {
     "name": "局部約束修正",
     "how": "每次 F 前檢查下一點是否落入水域或與既有道路太近，若是則縮短、轉向或刪除該分枝。",
     "effect": "道路會避開水體並自動接上既有路口。"
    },
    {
     "name": "影像驅動全域目標",
     "how": "讀入人口密度圖，在高密度處讓轉角偏向密度梯度方向、並提高分枝機率。",
     "effect": "路網自然向人口集中區延伸加密。"
    },
    {
     "name": "輸出為圖結構",
     "how": "DrawLines 同時建立節點與邊的清單（圖），供後續街廓切分。",
     "effect": "可銜接 A04 遞迴分割生成地塊。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "影像輸入",
    "約束滿足",
    "字串改寫"
   ],
   "tools": [
    "CityEngine"
   ],
   "url": "https://history.siggraph.org/learning/procedural-modeling-of-cities-by-parish-and-muller/",
   "image": {
    "file": "img/cases/A01-06.jpg",
    "w": 720,
    "h": 311,
    "source": "ACM SIGGRAPH History Archive",
    "author": "",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://history.siggraph.org/learning/procedural-modeling-of-cities-by-parish-and-muller/",
    "note": ""
   }
  },
  {
   "id": "A01-07",
   "algo": "A01",
   "title": "植物生態系的真實建模與算圖",
   "creator": "Oliver Deussen, Pat Hanrahan, Bernd Lintermann, Radomír Měch, Matt Pharr, Przemyslaw Prusinkiewicz",
   "year": "1998",
   "category": "urban-landscape",
   "categories_extra": [
    "drawing"
   ],
   "scale": "地景",
   "summary": "SIGGRAPH 98 論文，結合 L-system 植物模型與植物分布模擬，生成含大量植株的自然景觀並算圖。示範了從單株 L-system 到群落地景的尺度跳躍。",
   "variations": [
    {
     "name": "多物種規則庫",
     "how": "建立數組規則（喬木、灌木、草），每個散布點依物種選規則與代數。",
     "effect": "一次生成混合植栽的景觀。"
    },
    {
     "name": "競爭決定大小",
     "how": "先以點散布，再依鄰近點距離決定 generations 或 stepLength（擁擠則較小）。",
     "effect": "呈現林緣大、林內小的自然分布。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "隨機",
    "鄰居搜尋",
    "3D"
   ],
   "tools": [],
   "url": "https://algorithmicbotany.org/papers/ecosys.sig98.pdf",
   "image": {
    "file": "img/cases/A01-07.jpg",
    "w": 900,
    "h": 633,
    "source": "Deussen et al., SIGGRAPH 1998",
    "author": "",
    "license": "論文圖，教學引用",
    "license_url": "",
    "page": "https://algorithmicbotany.org/papers/ecosys.sig98.pdf",
    "note": "論文算圖：程序化生成的植物生態系"
   }
  },
  {
   "id": "A01-08",
   "algo": "A01",
   "title": "以 L-system 與參數最佳化設計 3D 列印輕量結構",
   "creator": "研究論文（Applied Sciences）",
   "year": "2022",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "構件",
   "summary": "沿主應力線方向生成與分布 L-system 樹狀結構，作為積層製造用的輕量化內部構造；以數值模擬評估並將分枝粗細作為設計變數最佳化。",
   "variations": [
    {
     "name": "沿向量場生長",
     "how": "讀入主應力方向（向量場），每步把前進方向對齊該處向量後再執行轉彎。",
     "effect": "分枝沿力流排列，材料用在需要的地方。"
    },
    {
     "name": "線轉實體",
     "how": "以深度決定管徑產生 Pipe，並合併為可列印的網格。",
     "effect": "直接得到可 3D 列印的樹狀支撐。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "最佳化",
    "物理模擬"
   ],
   "tools": [],
   "url": "https://doi.org/10.3390/app12115530",
   "image": {
    "file": "img/cases/A01-08.jpg",
    "w": 900,
    "h": 726,
    "source": "Applied Sciences (MDPI)",
    "author": "",
    "license": "CC BY 4.0",
    "license_url": "",
    "page": "https://doi.org/10.3390/app12115530",
    "note": "論文圖：不同 L-system 規則生成的輕量結構"
   }
  },
  {
   "id": "A01-09",
   "algo": "A01",
   "title": "分枝幾何的機械手臂空間列印路徑生成",
   "creator": "研究論文（Buildings）",
   "year": "2022",
   "category": "fabrication",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "針對仿生分枝結構的機械手臂空間列印（spatial printing），提出自動生成列印路徑的方法（圖生成、圖走訪、曲線調整等）。L-system 產生的分枝線正是這類流程的上游輸入。",
   "variations": [
    {
     "name": "輸出為樹狀圖",
     "how": "DrawLines 同時記錄父子關係（節點 id 與父節點 id），得到樹狀圖而非散線。",
     "effect": "可依深度優先走訪排出列印順序。"
    },
    {
     "name": "限制懸挑角度",
     "how": "計算每段與 Z 軸夾角，超過機器可列印角度就忽略該分枝或改變轉角。",
     "effect": "生成的分枝保證可空間列印。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "約束滿足"
   ],
   "tools": [],
   "url": "https://doi.org/10.3390/buildings12122247",
   "image": {
    "file": "img/cases/A01-09.jpg",
    "w": 900,
    "h": 752,
    "source": "Buildings (MDPI)",
    "author": "",
    "license": "CC BY 4.0",
    "license_url": "",
    "page": "https://doi.org/10.3390/buildings12122247",
    "note": "論文圖：分枝節點的列印路徑成果"
   }
  },
  {
   "id": "A01-10",
   "algo": "A01",
   "title": "L-System User Notes（L-system 規則範例集）",
   "creator": "Paul Bourke",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Paul Bourke 整理的 L-system 說明與大量規則範例（植物、分形曲線、圖樣），被許多程式與教學引用，是替基礎範例找新規則最直接的素材庫。",
   "variations": [
    {
     "name": "直接套用規則集",
     "how": "把網站上的 axiom、規則、角度抄進 startString、rules、turnAngle 三個輸入，逐一測試。",
     "effect": "不改程式即可得到數十種不同圖樣。"
    },
    {
     "name": "加入線寬與顏色符號",
     "how": "新增符號如 ! 表示線寬遞減、' 表示換色，Pen 多存 Width 與 ColorIndex。",
     "effect": "繪圖表現更有層次。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "字串改寫",
    "分形"
   ],
   "tools": [],
   "url": "https://paulbourke.net/fractals/lsys/",
   "image": {
    "file": "img/cases/A01-10.jpg",
    "w": 446,
    "h": 650,
    "source": "Paul Bourke",
    "author": "",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://paulbourke.net/fractals/lsys/",
    "note": ""
   }
  },
  {
   "id": "A01-11",
   "algo": "A01",
   "title": "L-System 與分形的繪圖機（Pen Plotter）作品",
   "creator": "Pen Plotter Kit（部落格）",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "介紹以 L-system 生成樹、蕨類、珊瑚與空間填充曲線，並用繪圖機畫出。烏龜繪圖（turtle）本身就類似繪圖機筆頭移動，輸出線段可直接轉成繪圖路徑。",
   "variations": [
    {
     "name": "路徑排序減少抬筆",
     "how": "依 DrawLines 產生順序把連續線段 Join 成 Polyline，只在 ] 回溯時斷開。",
     "effect": "繪圖時間大幅縮短、線條連續。"
    },
    {
     "name": "系列網格排版",
     "how": "以雙層迴圈改變 turnAngle 與 generations，把結果排成網格輸出 SVG／DXF。",
     "effect": "得到一張「規則參數對照表」式的藝術作品。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "分形",
    "字串改寫"
   ],
   "tools": [
    "繪圖機"
   ],
   "url": "https://penplotterkit.com/blog/l-systems-and-fractal-art-for-plotters/",
   "image": {
    "file": "img/cases/A01-11.jpg",
    "w": 720,
    "h": 493,
    "source": "Pen Plotter Kit",
    "author": "",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://penplotterkit.com/blog/l-systems-and-fractal-art-for-plotters/",
    "note": ""
   }
  },
  {
   "id": "A01-12",
   "algo": "A01",
   "title": "Mutiertes L-System（突變的 L-System）",
   "creator": "Lotta Stöver",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "將 L-system 演算法從軟體搬到實體世界「長出來」的裝置作品，讓結構依所在空間環境調整。展示 L-system 作為空間裝置的可能。",
   "variations": [
    {
     "name": "房間邊界修剪",
     "how": "以房間 Brep 為約束，畫線前檢查 IsPointInside，出界分枝整支略過。",
     "effect": "結構填滿展場但不穿牆。"
    },
    {
     "name": "標準構件化",
     "how": "stepLength 固定為現成材料長度，turnAngle 限定為接頭可做的幾種角度。",
     "effect": "可用標準桿件與接頭實際搭建。"
    },
    {
     "name": "逐代展出",
     "how": "將不同代數輸出為分階段搭建圖。",
     "effect": "展期中結構可逐步「生長」。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "約束滿足"
   ],
   "tools": [],
   "url": "https://lotta-stoever.net/works/mutiertes-l-system",
   "image": {
    "file": "img/cases/A01-12.jpg",
    "w": 480,
    "h": 720,
    "source": "Lotta Stöver 官網",
    "author": "",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://lotta-stoever.net/works/mutiertes-l-system",
    "note": ""
   }
  },
  {
   "id": "A01-13",
   "algo": "A01",
   "title": "以計算方法解構巴塔克族 Gorga 裝飾紋樣",
   "creator": "Hokky Situngkir",
   "year": "2015",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "立面／表皮",
   "summary": "以 L-system 等計算方法分析並重建印尼巴塔克族傳統建築上的 Gorga 紋樣，說明傳統裝飾圖樣可被規則化描述與生成。",
   "variations": [
    {
     "name": "鏡射對稱",
     "how": "輸出線段後對一條或兩條軸做 Mirror，或在字串中用 + - 互換產生對稱規則。",
     "effect": "得到傳統裝飾常見的左右對稱紋樣。"
    },
    {
     "name": "捲曲紋",
     "how": "讓轉角每步遞增（pen 多存 currentAngle），產生螺旋捲曲的枝條。",
     "effect": "接近藤蔓捲紋的裝飾效果。"
    },
    {
     "name": "拼貼成立面",
     "how": "把單元紋樣沿格網陣列並用於立面穿孔板。",
     "effect": "文化紋樣轉為可雷射切割的表皮。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "對稱",
    "拼貼",
    "字串改寫"
   ],
   "tools": [],
   "url": "https://arxiv.org/pdf/1510.01140",
   "image": {
    "file": "img/cases/A01-13.jpg",
    "w": 599,
    "h": 400,
    "source": "Wikimedia Commons",
    "author": "parpining",
    "license": "CC BY-SA 4.0",
    "license_url": "https://creativecommons.org/licenses/by-sa/4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Gorga_boraspati_dan_adop-adop.jpg",
    "note": "巴塔克族傳統住屋的 Gorga 雕刻紋樣"
   }
  },
  {
   "id": "A01-14",
   "algo": "A01",
   "title": "Riemannian L-systems：在彎曲空間中生長的形態",
   "creator": "研究論文（arXiv）",
   "year": "2024",
   "category": "modeling",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "將 L-system 的烏龜繪圖擴展到曲面等彎曲空間，讓生長形態沿曲面的幾何前進。對應到建築上就是讓分枝圖樣貼附在自由曲面屋頂或立面上。",
   "variations": [
    {
     "name": "UV 空間畫筆",
     "how": "Pen 改存曲面 (u,v) 與切向量，每步用 Surface.FrameAt 取得切平面後前進並拉回曲面。",
     "effect": "分枝貼著曲面生長而不懸空。"
    },
    {
     "name": "依曲率調整步長",
     "how": "以 Surface.CurvatureAt 取得曲率，曲率大處縮短 stepLength。",
     "effect": "在彎曲處分枝更細密。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "曲面上",
    "3D"
   ],
   "tools": [],
   "url": "https://arxiv.org/pdf/2404.03270",
   "image": {
    "file": "img/cases/A01-14.jpg",
    "w": 900,
    "h": 515,
    "source": "arXiv:2404.03270",
    "author": "",
    "license": "論文圖，教學引用",
    "license_url": "",
    "page": "https://arxiv.org/abs/2404.03270",
    "note": "論文圖：在球面上生長的分枝"
   }
  },
  {
   "id": "A01-15",
   "algo": "A01",
   "title": "SpeedTree 程序化植物建模",
   "creator": "SpeedTree",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "drawing"
   ],
   "scale": "地景",
   "summary": "業界標準的程序化植物建模工具，廣泛用於遊戲、電影與建築表現（Archviz），以規則化方式生成樹木、枝葉與風動。可視為 L-system 思想在商業工具中的延伸。",
   "variations": [
    {
     "name": "風動動畫",
     "how": "以 Timer 驅動，讓每段依深度加上 sin(t) 的小角度擺動（深度越大擺幅越大）。",
     "effect": "枝條隨風擺動的動畫。"
    },
    {
     "name": "細節層級（LOD）",
     "how": "依與相機的距離決定 generations，遠處少代數、近處多代數。",
     "effect": "大面積植栽仍能維持運算效能。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "動畫",
    "3D",
    "隨機"
   ],
   "tools": [
    "SpeedTree"
   ],
   "url": "https://en.wikipedia.org/wiki/SpeedTree",
   "image": {
    "file": "img/cases/A01-15.jpg",
    "w": 900,
    "h": 450,
    "source": "SpeedTree 官網",
    "author": "",
    "license": "官網圖片，教學引用",
    "license_url": "",
    "page": "https://www.speedtree.com/",
    "note": "SpeedTree 程序化生成的樹"
   }
  },
  {
   "id": "A01-51",
   "algo": "A01",
   "title": "Coding Challenge #16：L-System Fractal Trees（L-System 分形樹）",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2016",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Daniel Shiffman 在 p5.js 裡從零寫出 L-System：先做字串改寫，再用 turtle（translate／rotate／push／pop）把字串畫成樹。流程與 Grasshopper 範例幾乎一一對應，差別在 p5.js 用畫布座標變換取代 Plane，而且用一個按鈕觸發 generate()，每按一次長一代，可以逐代觀察字串與圖形一起變長。",
   "variations": [
    {
     "name": "逐代互動生長",
     "how": "把 generations 迴圈拆開：每次按鈕（或 Grasshopper 的 Button／Timer）只做一次改寫並重畫，同時輸出目前字串長度。",
     "effect": "學習者能一代一代看到字串爆炸與形態加密的對應關係。"
    },
    {
     "name": "分枝越深越細、越透明",
     "how": "Pen 多存一個 depth，遇到 [ 時 depth+1，畫線時用 depth 決定線寬（或管徑）與透明度。",
     "effect": "主幹粗、末梢細，接近真實樹木的視覺層次。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "字串改寫",
    "分形",
    "教學影片"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://thecodingtrain.com/challenges/16-l-system-fractal-trees",
   "image": {
    "file": "img/cases/A01-51.jpg",
    "w": 900,
    "h": 506,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/16-l-system-fractal-trees",
    "note": "Coding Challenge #16 影片縮圖"
   }
  },
  {
   "id": "A01-52",
   "algo": "A01",
   "title": "ofxLSystem：openFrameworks 的 3D L-System 網格樹",
   "creator": "Davide Prati（edap）",
   "year": "2016",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "物件",
   "summary": "openFrameworks 外掛，搭配同作者的 ofxLSystemGrammar（實作《The Algorithmic Beauty of Plants》中多數改寫文法），把 L-System 字串用 3D turtle 轉成帶材質的網格，可以做出森林、環狀結構與動畫。和基礎範例只輸出線段不同，它直接生成可著色、可即時算圖的實體枝幹。",
   "variations": [
    {
     "name": "線段轉成管狀實體",
     "how": "把每條輸出線段依分枝深度給半徑，用 Pipe 或自建圓環斷面 Loft 成網格，而不是只輸出 Line。",
     "effect": "得到可算圖、可 3D 列印的實體枝幹。"
    },
    {
     "name": "改用參數化文法",
     "how": "規則表從 Dictionary<char,string> 擴充成帶參數的符號（例如 F(l) → F(l*0.7)），改寫時一併計算參數。",
     "effect": "每段長度與角度可以隨代數連續變化，形態更自然。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "openFrameworks",
    "C++",
    "3D",
    "網格"
   ],
   "tools": [
    "openFrameworks"
   ],
   "url": "https://github.com/edap/ofxLSystem",
   "image": {
    "file": "img/cases/A01-52.jpg",
    "w": 800,
    "h": 466,
    "source": "GitHub edap/ofxLSystem",
    "author": "Davide Prati",
    "license": "MIT",
    "license_url": "https://github.com/edap/ofxLSystem",
    "page": "https://github.com/edap/ofxLSystem",
    "note": "README 示範圖：以 ofxLSystem 生成的 3D 森林"
   }
  },
  {
   "id": "A01-53",
   "algo": "A01",
   "title": "lindenmayer：可把 JavaScript 函式當規則的 L-System 函式庫",
   "creator": "Tom Brewe（nylki）",
   "year": "2015",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "JavaScript 的 L-System 函式庫，支援經典的分枝、上下文相關與參數化 L-System，也允許直接用 JavaScript 函式當改寫規則；它只負責改寫，繪圖交給使用者（範例用 canvas 畫出 Koch 雪花，另有 A-Frame 的 3D／VR 元件）。對照基礎範例，重點是把「改寫」與「畫筆解讀」徹底分開。",
   "variations": [
    {
     "name": "規則寫成函式",
     "how": "把規則表的值從字串改成 Func<int,string>（輸入目前位置或代數），改寫時呼叫函式決定要換成什麼。",
     "effect": "可以做隨機、依位置而變的規則，而不需要擴充語法。"
    },
    {
     "name": "上下文相關規則",
     "how": "改寫每個字元時同時檢查左右鄰字元（a<b>c 形式），符合才替換。",
     "effect": "能模擬訊號沿枝幹傳遞，例如開花從基部逐漸往上。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "JavaScript",
    "字串改寫",
    "函式庫"
   ],
   "tools": [
    "JavaScript"
   ],
   "url": "https://github.com/nylki/lindenmayer",
   "image": {
    "file": "img/cases/A01-53.jpg",
    "w": 477,
    "h": 491,
    "source": "GitHub nylki/lindenmayer",
    "author": "Tom Brewe",
    "license": "MIT",
    "license_url": "https://github.com/nylki/lindenmayer",
    "page": "https://github.com/nylki/lindenmayer",
    "note": "README 範例結果：以 L-System 函式庫畫出的 Koch 雪花"
   }
  },
  {
   "id": "A01-54",
   "algo": "A01",
   "title": "TouchDesigner LSystem SOP",
   "creator": "Derivative",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "TouchDesigner 內建的 L-System 節點，支援上下文相關規則、機率、參數符號與管狀（Tube）輸出。官方文件指出 Generations 可以放時間函式來驅動生長動畫，適合在即時影像與演出中讓樹、閃電或雪花隨時間長出來；它是節點參數化，而不是像基礎範例那樣自己寫改寫迴圈。",
   "variations": [
    {
     "name": "時間驅動生長",
     "how": "把 generations 改成可以是小數，整數部分決定完整代數，小數部分用來縮放最後一代新增線段的長度，接上 Grasshopper Timer 或滑桿動畫。",
     "effect": "枝幹連續地長出，而不是一代一代跳動。"
    },
    {
     "name": "Skeleton／Tube 兩種輸出",
     "how": "加一個 bool 輸入：false 只輸出線段，true 則依深度給半徑轉成管狀網格。",
     "effect": "同一組規則可以切換草圖預覽與實體算圖。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "TouchDesigner",
    "即時影像",
    "節點式"
   ],
   "tools": [
    "TouchDesigner"
   ],
   "url": "https://docs.derivative.ca/LSystem_SOP"
  },
  {
   "id": "A01-55",
   "algo": "A01",
   "title": "The Nature of Code 第 8 章：L-systems",
   "creator": "Daniel Shiffman",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "《The Nature of Code》p5.js 版第 8 章「Fractals」的 L-systems 小節，先用程式產生 L-System 句子（Example 8.8），再把句子交給 turtle 畫成樹（Example 8.9），並從遞迴樹、隨機樹一路銜接。適合當作基礎範例的前導閱讀：同一個樹形先用遞迴寫、再改用字串改寫寫，比較兩種思路。",
   "variations": [
    {
     "name": "遞迴版與改寫版對照",
     "how": "另寫一個直接遞迴畫分枝的版本（不產生字串），與 L-System 版輸出同一棵樹並排比較。",
     "effect": "看清楚 L-System 是把遞迴結構「先存成字串」再解讀。"
    },
    {
     "name": "隨機規則",
     "how": "同一個符號給多條規則並附機率，改寫時用 Random(seed) 挑選。",
     "effect": "每棵樹都不同但風格一致，可做一片樹林。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "creative coding",
    "p5.js",
    "教科書",
    "分形"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://natureofcode.com/fractals/#l-systems",
   "image": {
    "file": "img/cases/A01-55.jpg",
    "w": 900,
    "h": 491,
    "source": "The Nature of Code",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://natureofcode.com/fractals/",
    "note": "第 8 章 Figure 8.17：依產生規則逐代長出的分形樹"
   }
  },
  {
   "id": "A02-01",
   "algo": "A02",
   "title": "Koch 雪花分形天線（寬頻透明天線）",
   "creator": "IEEE 研討會論文作者群",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "以 Koch 雪花作為貼片天線的輪廓，在同樣尺寸下增加有效周長，讓一片天線涵蓋 GSM、UMTS、WLAN、LTE 多個頻段；透明基板使它能貼在玻璃上。Koch 遞迴層數直接控制電氣長度。",
   "variations": [
    {
     "name": "深度對應頻段",
     "how": "把 depth 當成設計變數，輸出每層的周長 Length，對照需要的波長做表格",
     "effect": "理解遞迴層級如何換成性能指標"
    },
    {
     "name": "開槽雪花",
     "how": "在雪花內再放一個縮小、尖角朝內的 Koch 並做布林差集",
     "effect": "得到環狀雪花貼片，增加共振模式"
    },
    {
     "name": "玻璃立面上的天線圖樣",
     "how": "把輸出曲線陣列到立面格網並縮小到毫米尺度",
     "effect": "建築玻璃同時作為訊號元件的概念提案"
    }
   ],
   "difficulty": 3,
   "tags": [
    "分形",
    "遞迴",
    "最佳化"
   ],
   "tools": [
    "電磁模擬軟體"
   ],
   "url": "https://ieeexplore.ieee.org/document/9157327/"
  },
  {
   "id": "A02-02",
   "algo": "A02",
   "title": "MATLAB Antenna Toolbox：fractalSnowflake 元件",
   "creator": "MathWorks",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "MATLAB 內建的 Koch 雪花天線產生函式，以迭代次數、邊長等參數化輸入產生天線幾何並直接模擬。和基礎範例一樣是「參數 → 遞迴幾何」的元件化思維。",
   "variations": [
    {
     "name": "參數對照",
     "how": "比照 fractalSnowflake 的參數，替 C# 元件加入 iterations、length、厚度輸入",
     "effect": "把範例包成可重複使用的參數化工具"
    },
    {
     "name": "陣列化",
     "how": "用迴圈把多個雪花排成 2×2 或線性陣列",
     "effect": "得到天線陣列般的重複圖樣"
    }
   ],
   "difficulty": 2,
   "tags": [
    "分形",
    "遞迴"
   ],
   "tools": [
    "MATLAB"
   ],
   "url": "https://www.mathworks.com/help/antenna/ref/fractalsnowflake.html"
  },
  {
   "id": "A02-03",
   "algo": "A02",
   "title": "S 頻段 Koch 雪花天線（CubeSat 立方衛星）",
   "creator": "IEEE 研討會論文作者群",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "為體積極小的立方衛星設計 Koch 雪花天線，利用分形在有限面積內塞入更長邊界的特性達到小型化。展示分形在「空間受限」條件下的價值。",
   "variations": [
    {
     "name": "外框約束",
     "how": "給定外接正方形尺寸，自動調整 size 讓雪花剛好貼齊框內",
     "effect": "在固定面積下比較不同 depth 的周長"
    },
    {
     "name": "方形 Koch",
     "how": "改成 90° 方形凸塊規則",
     "effect": "更貼合方形板件，適合正交構件"
    }
   ],
   "difficulty": 3,
   "tags": [
    "分形",
    "最佳化"
   ],
   "tools": [
    "電磁模擬軟體"
   ],
   "url": "https://ieeexplore.ieee.org/document/7836227/"
  },
  {
   "id": "A02-04",
   "algo": "A02",
   "title": "Koch 雪花啟發的聲學超穎表面（車用喇叭擴散）",
   "creator": "Journal of Applied Physics 論文作者群",
   "year": "2025",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "以 Koch 雪花邊緣做聲學透射超穎表面，分形邊緣產生多個二次繞射源，在 10–18 kHz 讓聲音更均勻地擴散。分形邊界被當成聲學性能工具。",
   "variations": [
    {
     "name": "3D Koch 擴散板",
     "how": "把遞迴改成三角面細分並沿法向推出四面體",
     "effect": "得到室內可用的分形聲學擴散板"
    },
    {
     "name": "吸引子控制細分",
     "how": "依喇叭或聲源位置距離決定每段是否繼續細分",
     "effect": "局部加密的擴散邊緣"
    },
    {
     "name": "雷切疊層",
     "how": "把不同深度的雪花 Offset 後逐層 Move，輸出多層雷切板",
     "effect": "可手工組裝的分層擴散面板"
    }
   ],
   "difficulty": 4,
   "tags": [
    "分形",
    "3D",
    "吸引子控制"
   ],
   "tools": [
    "聲學模擬"
   ],
   "url": "https://pubs.aip.org/aip/jap/article/138/18/183102/3371768/Koch-snowflake-inspired-acoustic-metasurface-for"
  },
  {
   "id": "A02-05",
   "algo": "A02",
   "title": "Koch 曲線結構中的快慢聲波",
   "creator": "Scientific Reports 論文作者群",
   "year": "2018",
   "category": "performance",
   "categories_extra": [],
   "scale": "構件",
   "summary": "用 Koch 曲線形狀的聲波導管，利用多條傳遞路徑的共振與干涉同時得到慢波與快波。說明分形路徑長度可以控制波的行為。",
   "variations": [
    {
     "name": "Koch 管道",
     "how": "把輸出曲線 Offset 成兩側牆，形成 Koch 形通道",
     "effect": "得到可 3D 列印的分形聲學管道"
    },
    {
     "name": "層級比較",
     "how": "同時輸出 depth 1–4 的通道並列排版",
     "effect": "做成教學或實驗比較模型"
    }
   ],
   "difficulty": 3,
   "tags": [
    "分形",
    "遞迴"
   ],
   "tools": [],
   "url": "https://www.nature.com/articles/s41598-018-19797-x"
  },
  {
   "id": "A02-06",
   "algo": "A02",
   "title": "分形擴散器作為隔音牆頂端構件",
   "creator": "研究論文作者群",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "performance"
   ],
   "scale": "群體／都市",
   "summary": "以邊界元素法分析一維分形擴散器作為道路隔音牆頂部斷面，結果比傳統 T 形牆頂在陰影區有更好的衰減。分形斷面成為都市基礎設施的造形語彙。",
   "variations": [
    {
     "name": "斷面擠出",
     "how": "把單條 Koch 曲線（sides=1）當斷面，沿道路曲線 Sweep",
     "effect": "得到連續的分形隔音牆頂"
    },
    {
     "name": "漸變深度",
     "how": "沿路徑長度改變 depth 或尖角角度",
     "effect": "隔音牆沿路逐漸變化的造形"
    },
    {
     "name": "方形 Koch 版本",
     "how": "改用直角凸塊規則",
     "effect": "更容易以預鑄板製造"
    }
   ],
   "difficulty": 3,
   "tags": [
    "分形",
    "遞迴"
   ],
   "tools": [
    "BEM 聲學分析"
   ],
   "url": "https://www.academia.edu/97336487/Investigation_of_broadband_attenuation_with_fractal_diffusers_as_noise_barrier_top_edge_devices_using_indirect_boundary_element_method"
  },
  {
   "id": "A02-07",
   "algo": "A02",
   "title": "Koch 雪花截面的套管式熱交換器",
   "creator": "Georgia Southern University 學位論文",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "構件",
   "summary": "把熱交換器內管截面改成第 2 層 Koch 雪花，增加表面積，總熱傳係數與熱傳率都明顯提升。展示 Koch 截面擠出成實體構件的製造與性能關係。",
   "variations": [
    {
     "name": "截面擠出",
     "how": "輸出雪花後用 Extrude 或 Sweep 成管，再 Offset 出壁厚",
     "effect": "得到可 3D 列印的分形管件"
    },
    {
     "name": "沿管扭轉",
     "how": "沿管長逐段旋轉雪花截面再 Loft",
     "effect": "螺旋分形管，增加擾流"
    }
   ],
   "difficulty": 3,
   "tags": [
    "分形",
    "3D"
   ],
   "tools": [
    "CFD 熱流模擬"
   ],
   "url": "https://digitalcommons.georgiasouthern.edu/etd/1697/"
  },
  {
   "id": "A02-08",
   "algo": "A02",
   "title": "方形 Koch 島熱交換器",
   "creator": "研究論文作者群",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "以方形（quadratic）Koch 島作為熱交換器截面，研究其熱傳特性。是基礎範例 60° 規則換成 90° 規則的直接實例。",
   "variations": [
    {
     "name": "90° 規則",
     "how": "中段改為推出方形凸塊，遞迴改呼叫 5 段或 8 段",
     "effect": "得到方形 Koch 島輪廓"
    },
    {
     "name": "周長面積比表",
     "how": "輸出每層周長與 AreaMassProperties 面積",
     "effect": "量化比較 60° 與 90° 版本"
    }
   ],
   "difficulty": 3,
   "tags": [
    "分形",
    "遞迴"
   ],
   "tools": [],
   "url": "https://www.researchgate.net/publication/233225229_Heat_Transfer_Characteristics_of_a_Quadratic_Koch_Island_Fractal_Heat_Exchanger"
  },
  {
   "id": "A02-09",
   "algo": "A02",
   "title": "雪花分形仿生微流道散熱器",
   "creator": "Journal of Thermal Analysis and Calorimetry 論文作者群",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "以雪花分形形式規劃電子元件的微流道散熱器，比原始分形流道有更好的熱傳與更低壓降。分形路徑從輪廓轉為流道網路。",
   "variations": [
    {
     "name": "中心放射流道",
     "how": "從雪花中心連線到每個尖點，把 Koch 輪廓與放射線結合",
     "effect": "得到分支狀流道網"
    },
    {
     "name": "流道 Offset",
     "how": "對曲線做雙向 Offset 並 Extrude 成凹槽",
     "effect": "可 CNC 銑削的流道板"
    }
   ],
   "difficulty": 4,
   "tags": [
    "分形",
    "3D"
   ],
   "tools": [
    "CFD 熱流模擬"
   ],
   "url": "https://link.springer.com/article/10.1007/s10973-025-14920-3"
  },
  {
   "id": "A02-10",
   "algo": "A02",
   "title": "Federation Square（對照：pinwheel 分形立面）",
   "creator": "LAB Architecture Studio（Don Bates、Peter Davidson）",
   "year": "2002",
   "category": "3d-architecture",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "建築",
   "summary": "墨爾本聯邦廣場立面採用 Conway 與 Radin 的 pinwheel 非週期鋪磚：五片三角磚組成一片面板，五片面板組成巨型面板，同一三角形比例在各尺度自我相似並可異地預製。它不是 Koch，但示範了「遞迴細分 → 建築構件層級」的同一邏輯。",
   "variations": [
    {
     "name": "遞迴細分三角形",
     "how": "把 SplitEdge 的對象由線段換成三角形，每次切成 5 個相似小三角形（pinwheel 規則）",
     "effect": "得到自我相似的三角鋪面"
    },
    {
     "name": "依層級指定材料",
     "how": "在遞迴的每一層記錄 depth，輸出時依層級或隨機指定砂岩、鋅板、玻璃",
     "effect": "層級分明的立面材料配置"
    },
    {
     "name": "Koch 邊緣立面",
     "how": "改用 Koch 邊界當立面開口輪廓，與 pinwheel 鋪面比較",
     "effect": "理解邊界分形與鋪面分形的差異"
    }
   ],
   "difficulty": 4,
   "tags": [
    "分形",
    "拼貼",
    "遞迴"
   ],
   "tools": [],
   "url": "https://en.wikipedia.org/wiki/Federation_Square"
  },
  {
   "id": "A02-11",
   "algo": "A02",
   "title": "街景中的分形設計：建築立面組成的視覺美學",
   "creator": "Alexandria Engineering Journal 論文作者群",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "群體／都市",
   "summary": "以分形維度分析街道立面組成，討論立面的複雜度與視覺偏好的關係。Koch 曲線常被當作已知分形維度（約 1.26）的參考圖形。",
   "variations": [
    {
     "name": "天際線 Koch",
     "how": "以 sides=1 的直線為起點，用隨機 Koch 產生街廓天際線",
     "effect": "不同複雜度的天際線比較"
    },
    {
     "name": "計算盒維度",
     "how": "新增 box-counting：用不同格寬數覆蓋曲線的格子數，取對數斜率",
     "effect": "能驗算輸出曲線的分形維度"
    }
   ],
   "difficulty": 3,
   "tags": [
    "分形",
    "隨機"
   ],
   "tools": [],
   "url": "https://www.sciencedirect.com/science/article/pii/S1110016819300845"
  },
  {
   "id": "A02-12",
   "algo": "A02",
   "title": "英國海岸線有多長？（分形維度的起點）",
   "creator": "Benoit B. Mandelbrot",
   "year": "1967",
   "category": "urban-landscape",
   "categories_extra": [
    "drawing"
   ],
   "scale": "地景",
   "summary": "Mandelbrot 指出海岸線具統計自我相似性，量尺越小長度越長，並以 Koch 曲線類比，提出分數維度的概念。是用 Koch 理解地景邊界的經典文獻。",
   "variations": [
    {
     "name": "隨機海岸",
     "how": "每次遞迴隨機決定尖角方向與切點位置，加入 seed",
     "effect": "逼真的虛擬海岸線"
    },
    {
     "name": "量尺實驗",
     "how": "用不同長度的分段 Curve.DivideByLength 量同一條曲線",
     "effect": "重現「量尺越小越長」的海岸線悖論"
    },
    {
     "name": "等高線疊層",
     "how": "以不同 size 的隨機 Koch 島逐層上移，Loft 成地形",
     "effect": "分形島嶼地景模型"
    }
   ],
   "difficulty": 2,
   "tags": [
    "分形",
    "隨機",
    "可重現種子"
   ],
   "tools": [],
   "url": "https://www.science.org/doi/10.1126/science.156.3775.636"
  },
  {
   "id": "A02-13",
   "algo": "A02",
   "title": "Koch snowflake Fractal Pattern（Grasshopper 教學）",
   "creator": "Parametric House",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "立面／表皮",
   "summary": "參數化設計教學網站提供的 Koch 雪花圖樣 Grasshopper 定義，示範用電池而非程式碼產生雪花圖樣。可與基礎範例的 C# 遞迴寫法對照。",
   "variations": [
    {
     "name": "電池版 vs C# 版",
     "how": "用 Anemone 迴圈重建同樣規則，比較與 C# 遞迴的可讀性",
     "effect": "理解遞迴在視覺化程式中的限制"
    },
    {
     "name": "鋪排成圖樣",
     "how": "把雪花放在六角格點上並縮放",
     "effect": "連續的雪花表皮圖樣"
    }
   ],
   "difficulty": 2,
   "tags": [
    "分形",
    "拼貼"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://parametrichouse.com/koch-snowflake-fractal-pattern"
  },
  {
   "id": "A02-14",
   "algo": "A02",
   "title": "Koch 雪花圖樣的數位參數化設計（Blender）",
   "creator": "Dovramadjiev",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "modeling",
    "fabrication"
   ],
   "scale": "物件",
   "summary": "以 Blender 與 Snowflake Generator 外掛產生不同階數的 Koch 雪花數位模型，作為圖樣設計與製造的基礎。",
   "variations": [
    {
     "name": "多階並陳",
     "how": "迴圈輸出 depth 0–5 並依序排列",
     "effect": "階數比較圖版"
    },
    {
     "name": "擠出成浮雕",
     "how": "將不同階數雪花以不同高度 Extrude 疊合",
     "effect": "階梯狀雪花浮雕，可 3D 列印"
    }
   ],
   "difficulty": 2,
   "tags": [
    "分形",
    "3D"
   ],
   "tools": [
    "Blender"
   ],
   "url": "https://atna-mam.utcluj.ro/index.php/Acta/article/view/1514"
  },
  {
   "id": "A02-15",
   "algo": "A02",
   "title": "Koch 雪花的墊片（gasket）構造與變體",
   "creator": "arXiv 論文作者群",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "從墊片（gasket）式的挖除與填補觀點重新建構 Koch 雪花並提出變體，說明同一個形可以有不同的遞迴生成方式。",
   "variations": [
    {
     "name": "填補式雪花",
     "how": "每層不只記邊界，也把新增的小三角形當作填色區塊輸出",
     "effect": "看到雪花由大小三角形拼成的結構"
    },
    {
     "name": "挖除式變體",
     "how": "把尖角朝內並輸出被挖掉的三角形",
     "effect": "類 Sierpiński 的負形圖樣"
    }
   ],
   "difficulty": 3,
   "tags": [
    "分形",
    "遞迴",
    "拼貼"
   ],
   "tools": [],
   "url": "https://arxiv.org/pdf/2502.00815"
  },
  {
   "id": "A02-51",
   "algo": "A02",
   "title": "Coding Challenge #129：Koch Fractal Snowflake（Koch 雪花）",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2018",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "The Coding Train 雪花系列第 3 集，用 Processing（Java）畫出 Koch 曲線與雪花。以 Segment 類別與 ArrayList 存放所有線段，每按一次滑鼠（mousePressed）就把每段切成四段、產生下一代清單；這是「迭代換清單」寫法，和基礎範例一次遞迴到指定深度不同，因此可以逐代觀察。",
   "variations": [
    {
     "name": "逐代動畫",
     "how": "把遞迴 SplitEdge 改成「每次呼叫只把目前線段清單全部細分一次」，用 Timer 或按鈕觸發下一代。",
     "effect": "可以一代一代看雪花長出尖角。"
    },
    {
     "name": "各代疊印",
     "how": "保留每一代的 Polyline 並輸出成 DataTree，依代數給不同顏色或 Z 高度。",
     "effect": "得到層層疊加的等高線式圖樣，可做雷射切割分層板。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "creative coding",
    "Processing",
    "分形",
    "教學影片"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://thecodingtrain.com/challenges/129-koch-fractal-snowflake",
   "image": {
    "file": "img/cases/A02-51.jpg",
    "w": 900,
    "h": 509,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/129-koch-fractal-snowflake",
    "note": "Coding Challenge #129 影片縮圖"
   }
  },
  {
   "id": "A02-52",
   "algo": "A02",
   "title": "The Nature of Code 第 8 章：The Koch Curve",
   "creator": "Daniel Shiffman",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "《The Nature of Code》p5.js 版第 8 章的 Koch 曲線小節（Example 8.5 與雪花練習），用 KochLine 物件存兩端點，以 p5.Vector 除以 3、旋轉 60° 算出五個點。它把每條線段當成物件並用 ArrayList 世代替換，和基礎範例的遞迴函式寫法互為對照。",
   "variations": [
    {
     "name": "線段物件化",
     "how": "新增 class KochLine { Point3d A, B; }，寫 KochPoints() 回傳五個點；每代把 List<KochLine> 全部換成 4 倍數量的新清單。",
     "effect": "結構清楚，方便日後替每條線段附加屬性（顏色、代數）。"
    },
    {
     "name": "隨機凸凹",
     "how": "每條線段擲骰決定旋轉 -60° 或 +60°。",
     "effect": "尖角有進有出，輪廓變成不規則的海岸線狀。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "creative coding",
    "p5.js",
    "教科書",
    "向量"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://natureofcode.com/fractals/#the-koch-curve",
   "image": {
    "file": "img/cases/A02-52.jpg",
    "w": 900,
    "h": 99,
    "source": "The Nature of Code",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://natureofcode.com/fractals/#the-koch-curve",
    "note": "第 8 章 Figure 8.12：Koch 曲線的逐代演變"
   }
  },
  {
   "id": "A02-53",
   "algo": "A02",
   "title": "3Blue1Brown：Fractals are typically not self-similar（碎形維度）",
   "creator": "Grant Sanderson（3Blue1Brown）",
   "year": "2017",
   "category": "drawing",
   "categories_extra": [],
   "scale": "物件",
   "summary": "3Blue1Brown 解說碎形維度的影片，以 Koch 曲線等碎形說明「縮小為 1/3 時長度變成 4 倍」如何導出約 1.262 的 Hausdorff 維度；動畫由 Grant Sanderson 自己用 Python 寫的 Manim 產生。它提醒學習者：基礎範例的 depth 不只是細緻度，也是量測「粗糙度」的方法。",
   "variations": [
    {
     "name": "輸出碎形量測",
     "how": "在程式中同時輸出每一代的周長與線段數，並計算 log(線段數)/log(3^depth)。",
     "effect": "數值會逼近 log4/log3 ≈ 1.262，把 Koch 當作維度量測的教具。"
    },
    {
     "name": "改變縮放比",
     "how": "把三等分改成可調比例 r（中段長度也跟著變），重新計算維度 log4/log(1/r)。",
     "effect": "觀察同樣四段規則下，比例越接近 1/2 輪廓越粗糙、越接近填滿平面。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "Manim",
    "Python",
    "數學動畫",
    "碎形維度"
   ],
   "tools": [
    "Manim"
   ],
   "url": "https://www.3blue1brown.com/lessons/fractal-dimension",
   "image": {
    "file": "img/cases/A02-53.jpg",
    "w": 480,
    "h": 360,
    "source": "YouTube（3Blue1Brown）",
    "author": "Grant Sanderson",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.youtube.com/watch?v=gB9n2gHsHN4",
    "note": "影片「Fractals are typically not self-similar」縮圖"
   }
  },
  {
   "id": "A02-54",
   "algo": "A02",
   "title": "Koch Snowflake using VEX（Houdini VEX 版 Koch 雪花）",
   "creator": "secarri（GitHub）",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "在 Houdini 中以 VEX 建立正三角形，並在 For-Each 迴圈用 Fetch Feedback 方式一代一代細分出 Koch 雪花，最後再用 VEX 把點連成幾何；另附 ArtStation 文章解說。它以節點迴圈與點屬性取代基礎範例的 C# 遞迴，是同一演算法在程序化特效流程中的寫法。",
   "variations": [
    {
     "name": "迴圈回饋取代遞迴",
     "how": "不寫遞迴函式，改用 Grasshopper 的 Anemone 迴圈（或 C# 內 for 迴圈）每次把上一代點列整條細分一次。",
     "effect": "流程與 Houdini 的 Feedback 迴圈相同，也方便輸出每代結果。"
    },
    {
     "name": "擠出成浮雕",
     "how": "把最後的封閉 Polyline 依代數偏移或擠出不同高度，疊成階梯狀量體。",
     "effect": "從平面圖樣變成可列印的雪花浮雕或裝飾構件。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "Houdini",
    "VEX",
    "程序化建模"
   ],
   "tools": [
    "Houdini"
   ],
   "url": "https://github.com/secarri/KochSnowflake"
  },
  {
   "id": "A03-01",
   "algo": "A03",
   "title": "Map of the Internet（xkcd 195）",
   "creator": "Randall Munroe",
   "year": "2006",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "漫畫用 Hilbert 曲線把一維的 IPv4 位址空間摺進正方形，讓同一網段聚成方塊。是 Hilbert 曲線「保持局部性」最有名的資料視覺化示範。",
   "variations": [
    {
     "name": "索引上色",
     "how": "依點的序號 i 產生色彩漸層並輸出色塊 Mesh",
     "effect": "一眼看出曲線走向與分區"
    },
    {
     "name": "資料映射",
     "how": "讀入 CSV 一維資料，第 i 筆資料決定第 i 格的顏色或高度",
     "effect": "任何序列資料都能變成平面地圖"
    },
    {
     "name": "分區標註",
     "how": "每 4^k 個點框出一個方塊並加文字",
     "effect": "重現漫畫中網段方塊的標示"
    }
   ],
   "difficulty": 2,
   "tags": [
    "遞迴",
    "空間填充"
   ],
   "tools": [],
   "url": "https://www.explainxkcd.com/wiki/index.php/195:_Map_of_the_Internet"
  },
  {
   "id": "A03-02",
   "algo": "A03",
   "title": "IPv4 Census Map",
   "creator": "CAIDA",
   "year": "",
   "category": "drawing",
   "categories_extra": [],
   "scale": "物件",
   "summary": "以 12 階 Hilbert 曲線把 IPv4 空間映射成 4096×4096 影像，每個像素代表一個 /24 網段，顏色顯示使用率。示範高階 Hilbert 作為大規模資料的版面。",
   "variations": [
    {
     "name": "高階改用像素",
     "how": "order 高時不畫 Polyline，改成直接把格心寫入點雲或 Bitmap 像素",
     "effect": "避免幾何過多，可處理數萬筆資料"
    },
    {
     "name": "xy→d 反查",
     "how": "寫一個函式由格座標算出 Hilbert 索引",
     "effect": "可以點擊平面位置查回原資料"
    }
   ],
   "difficulty": 3,
   "tags": [
    "空間填充",
    "影像輸入"
   ],
   "tools": [],
   "url": "https://www.caida.org/archive/id-consumption/census-map/"
  },
  {
   "id": "A03-03",
   "algo": "A03",
   "title": "Hilbert Map of IPv4 address space（互動筆記本）",
   "creator": "Vasco Asturiano",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "在 Observable 上以互動方式呈現 IPv4 的 Hilbert 地圖，可縮放瀏覽各網段。說明 Hilbert 版面天然支援「縮放 = 換階數」的層級瀏覽。",
   "variations": [
    {
     "name": "層級縮放",
     "how": "以 order 滑桿即時切換，粗階數顯示大區、細階數顯示細節",
     "effect": "多尺度閱讀同一份資料"
    },
    {
     "name": "局部放大",
     "how": "只對某個子方塊再遞迴展開更深",
     "effect": "像地圖一樣局部放大"
    }
   ],
   "difficulty": 2,
   "tags": [
    "空間填充",
    "動畫"
   ],
   "tools": [
    "Observable",
    "JavaScript"
   ],
   "url": "https://observablehq.com/@vasturiano/hilbert-map-of-ipv4-address-space"
  },
  {
   "id": "A03-04",
   "algo": "A03",
   "title": "ggip：以 Hilbert 曲線視覺化 IP 資料的 R 套件",
   "creator": "David Hall",
   "year": "",
   "category": "drawing",
   "categories_extra": [],
   "scale": "物件",
   "summary": "R 語言的 ggplot2 延伸套件，說明 Hilbert 與 Morton 曲線的差異並以 Hilbert 版面繪製 IP 資料熱圖。可作為比較兩種空間填充曲線的教材。",
   "variations": [
    {
     "name": "Morton（Z 形）對照",
     "how": "把第 1、4 格的翻轉拿掉，四格一律同方向依 Z 字順序走",
     "effect": "得到 Morton 曲線，可看出跳躍處與局部性差異"
    },
    {
     "name": "熱度高度化",
     "how": "把每格數值轉成柱體高度輸出 Box",
     "effect": "3D 資料地景"
    }
   ],
   "difficulty": 2,
   "tags": [
    "空間填充"
   ],
   "tools": [
    "R"
   ],
   "url": "https://davidchall.github.io/ggip/articles/visualizing-ip-data.html"
  },
  {
   "id": "A03-05",
   "algo": "A03",
   "title": "用 Hilbert 曲線繪製整個 IPv4 網際網路",
   "creator": "benjojo（blog.benjojo.co.uk）",
   "year": "2018",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "對全部 IPv4 位址發送 ping，再依 Hilbert 版面把回應結果畫成一張圖，重現並更新 xkcd 的網路地圖。",
   "variations": [
    {
     "name": "時間序列比較",
     "how": "同一版面輸入不同年份資料，並排或做差值上色",
     "effect": "看出空間化資料隨時間的變化"
    },
    {
     "name": "大圖輸出",
     "how": "將高階結果切成多張 tile 輸出",
     "effect": "可印製成大尺寸牆面圖"
    }
   ],
   "difficulty": 3,
   "tags": [
    "空間填充",
    "影像輸入"
   ],
   "tools": [],
   "url": "https://soylentnews.org/article.pl?sid=18%2F04%2F23%2F074207"
  },
  {
   "id": "A03-06",
   "algo": "A03",
   "title": "Hilbert Cube 512 雕塑",
   "creator": "Carlo H. Séquin",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "fabrication",
    "modeling"
   ],
   "scale": "物件",
   "summary": "Séquin 把 2D Hilbert 推到三維：以立方體邊上的路徑為起點，每個角再代入縮小一半的路徑，三次遞迴後得到 512 個 L 形轉角的「大腦狀」結構，並以不鏽鋼粉末加銅滲透的快速原型製程鑄成小型金屬雕塑。",
   "variations": [
    {
     "name": "2×2×2 遞迴",
     "how": "把兩條邊向量擴成三條，每層切成八個子立方體並定義各自的向量置換",
     "effect": "得到 3D Hilbert 路徑"
    },
    {
     "name": "管狀化",
     "how": "對路徑做 Fillet 後用 Pipe 產生圓管",
     "effect": "可 3D 列印的雕塑實體"
    },
    {
     "name": "只取前 n 點",
     "how": "用 GetRange 輸出部分路徑",
     "effect": "看到路徑如何逐步填滿立方體"
    }
   ],
   "difficulty": 4,
   "tags": [
    "遞迴",
    "3D",
    "空間填充"
   ],
   "tools": [
    "3D 列印"
   ],
   "url": "https://people.eecs.berkeley.edu/~sequin/SCULPTS/CHS_bronzes/Hilbert512/"
  },
  {
   "id": "A03-07",
   "algo": "A03",
   "title": "Hilbert Cube（SIGGRAPH 藝術展）",
   "creator": "Carlo H. Séquin",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "物件",
   "summary": "收錄於 ACM SIGGRAPH 藝術展檔案的 Hilbert Cube，說明以遞迴方式把立方體反覆切成鏡像對稱的兩半來生成路徑。可作為把空間填充曲線放大成空間構架的靈感。",
   "variations": [
    {
     "name": "放大為空間構架",
     "how": "把 size 放大到建築尺度，路徑轉成梁柱線段",
     "effect": "Hilbert 立方構架或裝置"
    },
    {
     "name": "漸變粗細",
     "how": "依點序號改變 Pipe 半徑",
     "effect": "沿路徑漸變的雕塑線條"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "遞迴",
    "對稱"
   ],
   "tools": [],
   "url": "https://history.siggraph.org/artwork/carlo-sequin-hilbert-cube/"
  },
  {
   "id": "A03-08",
   "algo": "A03",
   "title": "Hilbert 曲線數學繪畫",
   "creator": "Mathematical paintings and sculptures 部落格",
   "year": "2008",
   "category": "art-installation",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "以 Hilbert 曲線為題材的數學繪畫與雕塑作品分享，展示同一條曲線在不同色彩與線寬下的藝術表現。",
   "variations": [
    {
     "name": "漸層線寬",
     "how": "依點序號或位置改變 Offset 寬度",
     "effect": "有粗細韻律的曲線畫"
    },
    {
     "name": "多階疊圖",
     "how": "把 order 1–5 的曲線疊在同一正方形並分色",
     "effect": "呈現遞迴層級的抽象構圖"
    }
   ],
   "difficulty": 2,
   "tags": [
    "遞迴",
    "空間填充"
   ],
   "tools": [],
   "url": "http://mathpaint.blogspot.com/2008/02/hilbert-curve.html"
  },
  {
   "id": "A03-09",
   "algo": "A03",
   "title": "以 Hilbert 曲線為基礎的 FDM 刀具路徑",
   "creator": "研究論文作者群",
   "year": "",
   "category": "fabrication",
   "categories_extra": [],
   "scale": "構件",
   "summary": "提出 FDM 列印以 Hilbert 曲線作為每層路徑的策略，一筆連續走完、消除空跑，可調整填充率並得到較等向的性質。",
   "variations": [
    {
     "name": "逐層旋轉",
     "how": "每層路徑繞中心旋轉 90° 並 Move 一個層高",
     "effect": "層間交錯的列印路徑"
    },
    {
     "name": "圓角化",
     "how": "對 Polyline 做 Fillet 以減少急停",
     "effect": "列印頭運動更平順"
    },
    {
     "name": "填充率控制",
     "how": "用 order 與線寬換算填充百分比",
     "effect": "可指定密度的填充"
    }
   ],
   "difficulty": 3,
   "tags": [
    "空間填充",
    "3D"
   ],
   "tools": [
    "3D 列印",
    "G-code"
   ],
   "url": "https://www.researchgate.net/publication/318174069_Hilbert_Curve_Based_Toolpath_for_FDM_Process"
  },
  {
   "id": "A03-10",
   "algo": "A03",
   "title": "以 Hilbert 曲線規劃 3D 列印件填充路徑",
   "creator": "Procedia Manufacturing 論文作者群",
   "year": "2018",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "構件",
   "summary": "以 Hilbert 曲線讓每層填充以單一連續運動完成，減少時間與能耗；同階曲線依斷面縮小而縮短邊長，形成自適應密度填充。",
   "variations": [
    {
     "name": "斷面自適應",
     "how": "每層依斷面外框尺寸重設 size、order 不變",
     "effect": "斷面小的層密度自動提高"
    },
    {
     "name": "邊界裁切",
     "how": "只保留落在斷面曲線內的格心並重新連線",
     "effect": "能填非方形斷面"
    }
   ],
   "difficulty": 3,
   "tags": [
    "空間填充",
    "約束滿足"
   ],
   "tools": [
    "3D 列印"
   ],
   "url": "https://www.sciencedirect.com/science/article/pii/S235197891830221X"
  },
  {
   "id": "A03-11",
   "algo": "A03",
   "title": "離散化區域的 Hilbert 填充：可調性質的 3D 列印構件",
   "creator": "研究論文作者群",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "構件",
   "summary": "先把構件區域離散成格子，再以 Hilbert 曲線填充，並在不同區域改變填充參數，得到局部性質可調的列印件。",
   "variations": [
    {
     "name": "非均勻細分",
     "how": "依應力圖或吸引子決定每格是否繼續遞迴",
     "effect": "受力處加密、其他處稀疏"
    },
    {
     "name": "分區不同階數",
     "how": "把正方形先分區，各區用不同 order 並處理接縫",
     "effect": "性質分區的構件"
    }
   ],
   "difficulty": 4,
   "tags": [
    "空間填充",
    "吸引子控制",
    "最佳化"
   ],
   "tools": [
    "3D 列印"
   ],
   "url": "https://www.researchgate.net/publication/347781041_3D_Printing_of_Components_with_Tailored_Properties_Through_Hilbert_Curve_Filling_of_a_Discretized_Domain"
  },
  {
   "id": "A03-12",
   "algo": "A03",
   "title": "SFCDecomp：以空間填充曲線分解區域的多準則刀具路徑最佳化",
   "creator": "arXiv 論文作者群",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "以四分樹把正交多邊形分解成正方形格，再用 Hilbert（也可用 Peano、Moore）曲線決定走訪順序，對多個準則最佳化 3D 列印路徑。",
   "variations": [
    {
     "name": "Moore 閉環",
     "how": "最上層改成 Moore 曲線排列四個 Hilbert 子格",
     "effect": "路徑頭尾相接，適合連續列印"
    },
    {
     "name": "四分樹分解",
     "how": "先用遞迴把不規則區域切成大小不一的正方形，再在各格內放不同階 Hilbert",
     "effect": "能處理 L 形、ㄇ 形樓板"
    },
    {
     "name": "路徑指標",
     "how": "輸出總長、轉角數、空跑距離做比較",
     "effect": "量化選擇最佳曲線"
    }
   ],
   "difficulty": 5,
   "tags": [
    "空間填充",
    "最佳化",
    "空間索引"
   ],
   "tools": [
    "3D 列印"
   ],
   "url": "https://arxiv.org/pdf/2109.01769"
  },
  {
   "id": "A03-13",
   "algo": "A03",
   "title": "Hilbert R-tree 空間索引",
   "creator": "Ibrahim Kamel、Christos Faloutsos",
   "year": "1994",
   "category": "urban-landscape",
   "categories_extra": [
    "performance"
   ],
   "scale": "群體／都市",
   "summary": "以 Hilbert 值排序空間物件來建構 R-tree，讓空間上相近的資料在索引中也相鄰，提升地理資料庫查詢效能。都市尺度的建物、地籍資料都能用同樣方式排序。",
   "variations": [
    {
     "name": "建物 Hilbert 排序",
     "how": "輸入建物中心點，算出所在格的 Hilbert 索引並排序輸出",
     "effect": "空間上連續的建物編號"
    },
    {
     "name": "分組",
     "how": "每連續 k 個索引分成一組並畫出外框",
     "effect": "由曲線順序自動分出街廓群組"
    }
   ],
   "difficulty": 4,
   "tags": [
    "空間索引",
    "空間填充"
   ],
   "tools": [],
   "url": ""
  },
  {
   "id": "A03-14",
   "algo": "A03",
   "title": "以 Google S2 儲存遙測影像",
   "creator": "Wang 等人（IEEE Access）",
   "year": "2020",
   "category": "urban-landscape",
   "categories_extra": [],
   "scale": "地景",
   "summary": "利用 Google S2（在球面上以 Hilbert 曲線編碼格子）組織遙測影像的儲存。展示 Hilbert 從平面推廣到球面地理格網。",
   "variations": [
    {
     "name": "球面上的 Hilbert",
     "how": "在立方體六面各產生 Hilbert，再把點投影到球面",
     "effect": "包覆球體的空間填充曲線"
    },
    {
     "name": "地形曲面映射",
     "how": "用 Surface.PointAt 把 UV 點映到地形曲面",
     "effect": "貼地的連續掃描路徑"
    }
   ],
   "difficulty": 4,
   "tags": [
    "空間索引",
    "曲面上"
   ],
   "tools": [],
   "url": ""
  },
  {
   "id": "A03-15",
   "algo": "A03",
   "title": "Gosper-Peano 曲線的 Grasshopper 實作",
   "creator": "designcoding",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "以 Anemone 迴圈與 Orient 元件重複移動、旋轉、縮放同一曲線，在 Grasshopper 中產生 Gosper（flowsnake）空間填充曲線，是 Hilbert 的六角格變體。",
   "variations": [
    {
     "name": "改寫成 C# 遞迴",
     "how": "比照 VisitSquare，以七個子單元與 60° 轉角的遞迴取代 Anemone",
     "effect": "得到可調階數的 Gosper 元件"
    },
    {
     "name": "六角平面",
     "how": "把 Gosper 島邊界當作建築或景觀平面輪廓",
     "effect": "分形邊界的六角平面"
    }
   ],
   "difficulty": 3,
   "tags": [
    "遞迴",
    "空間填充",
    "分形"
   ],
   "tools": [
    "Grasshopper",
    "Anemone"
   ],
   "url": "https://www.designcoding.net/gosper-peano-curve-in-grasshopper/"
  },
  {
   "id": "A03-51",
   "algo": "A03",
   "title": "Coding in the Cabana 3：Hilbert Curve（Hilbert 曲線）",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2020",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "The Coding Train「Coding in the Cabana」系列，用 Processing 以「迭代演算法」算出 Hilbert 曲線：由每個索引的二進位位元逐層推出格子位置，而不是遞迴切格，把路徑逐點畫出並加上顏色。與基礎範例的遞迴 VisitSquare 形成對照。",
   "variations": [
    {
     "name": "索引轉座標（非遞迴）",
     "how": "寫 IndexToPoint(i, order)：每次取 i 的最低 2 位元決定象限，依象限做翻轉並累加偏移，迴圈 order 次。",
     "effect": "可以直接查任一索引的位置，不用生成整條曲線。"
    },
    {
     "name": "沿曲線漸層",
     "how": "依點的索引 i／總點數映射到色相，替每段線上色或當作 3D 高度。",
     "effect": "一眼看出一維順序在平面上的「相鄰保持」性質。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "Processing",
    "空間填充",
    "教學影片"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://thecodingtrain.com/challenges/c3-hilbert-curve",
   "image": {
    "file": "img/cases/A03-51.jpg",
    "w": 900,
    "h": 496,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/c3-hilbert-curve",
    "note": "Coding in the Cabana 3 影片縮圖"
   }
  },
  {
   "id": "A03-52",
   "algo": "A03",
   "title": "3Blue1Brown：Hilbert's Curve: Is infinite math useful?",
   "creator": "Grant Sanderson（3Blue1Brown）",
   "year": "2017",
   "category": "drawing",
   "categories_extra": [],
   "scale": "物件",
   "summary": "3Blue1Brown 以 Manim 動畫說明 Hilbert 曲線如何把一維位置對應到二維平面，並以「用聲音頻率讓人『聽見』影像」的假想應用，說明為什麼要用 Hilbert 而不是逐行掃描：階數提高時，同一個點的位置幾乎不變。這正是基礎範例 teaching note 所說「相鄰索引在空間上也相鄰」的直覺版。",
   "variations": [
    {
     "name": "蛇形掃描對照",
     "how": "另寫一個逐行來回（boustrophedon）掃描同一格網的版本，與 Hilbert 版並排，並標出同一索引比例（例如 0.3）在兩個階數下的位置。",
     "effect": "看出 Hilbert 在提高階數時位置穩定，蛇形掃描則會大幅跳動。"
    },
    {
     "name": "連續化的曲線",
     "how": "將多個階數的點列依參數 t 插值（order n 與 n+1 之間做 morph）。",
     "effect": "做出曲線逐漸填滿平面的動畫。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "Manim",
    "Python",
    "數學動畫",
    "空間填充"
   ],
   "tools": [
    "Manim"
   ],
   "url": "https://www.3blue1brown.com/lessons/hilbert-curve",
   "image": {
    "file": "img/cases/A03-52.jpg",
    "w": 480,
    "h": 360,
    "source": "YouTube（3Blue1Brown）",
    "author": "Grant Sanderson",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.youtube.com/watch?v=3s7h2MHQtxc",
    "note": "影片「Hilbert's Curve: Is infinite math useful?」縮圖"
   }
  },
  {
   "id": "A03-53",
   "algo": "A03",
   "title": "Hilbert Curve（D3.js 互動展示）",
   "creator": "Jason Davies",
   "year": "2012",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Jason Davies 以 D3.js 與 SVG 做的互動頁面：拉動 n 看 Hilbert 曲線的第 n 次近似如何逐漸填滿正方形，並可切換「show colours」，把彩虹色依曲線順序排上，讓相近顏色永遠落在相鄰位置（參考 Mike Bostock 的 Hilbert Tiles）。展示的是基礎範例輸出結果在網頁上的即時視覺化。",
   "variations": [
    {
     "name": "彩虹著色",
     "how": "依點索引把色相 0–360° 均勻分配，替每一小格填色（以格中心畫小正方形）。",
     "effect": "顏色在平面上呈連續色塊，直觀呈現局部性。"
    },
    {
     "name": "階數切換動畫",
     "how": "把 order 滑桿接到 Timer，並把前一階的線淡出、新一階淡入。",
     "effect": "適合簡報或網站展示遞迴層級的變化。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "creative coding",
    "D3.js",
    "JavaScript",
    "互動網頁",
    "資料視覺化"
   ],
   "tools": [
    "D3.js"
   ],
   "url": "https://www.jasondavies.com/hilbert-curve/"
  },
  {
   "id": "A03-54",
   "algo": "A03",
   "title": "Portrait of the Hilbert curve（Hilbert 曲線肖像）",
   "creator": "Aldo Cortesi",
   "year": "2010",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "立面／表皮",
   "summary": "Aldo Cortesi 的文章：先用 3D Hilbert 曲線走遍 RGB 色彩立方體，再把這串顏色依 2D Hilbert 順序鋪滿平面，得到「Hilbert on Hilbert」的抽象色塊畫，並與 Zigzag 順序比較；文中 3D Hilbert 曲線以 POV-Ray 算圖，也說明 N 維 Hilbert 曲線（Gray code）的演算法。它把基礎範例的 2D 曲線延伸到 3D，並把順序當成色彩映射工具。",
   "variations": [
    {
     "name": "3D Hilbert 曲線",
     "how": "把正方形換成立方體（角點＋三個邊向量），每層切成 2×2×2 共八格，依 Gray code 順序走訪並做對應的軸對調。",
     "effect": "得到可做空間走道、3D 列印填充路徑的立體連續線。"
    },
    {
     "name": "兩條曲線對映上色",
     "how": "以 3D Hilbert 順序列出一組顏色（或材料等級），再按 2D Hilbert 順序填入面板格網。",
     "effect": "立面或地磚上的色塊漸變平順、局部聚集，而不是條紋。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "POV-Ray",
    "資料視覺化",
    "色彩",
    "空間填充"
   ],
   "tools": [
    "POV-Ray"
   ],
   "url": "https://corte.si/posts/code/hilbert/portrait/",
   "image": {
    "file": "img/cases/A03-54.jpg",
    "w": 512,
    "h": 512,
    "source": "corte.si",
    "author": "Aldo Cortesi",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://corte.si/posts/code/hilbert/portrait/",
    "note": "文中「Hilbert on Hilbert」：3D Hilbert 走訪 RGB 色彩，鋪在 2D Hilbert 曲線上"
   }
  },
  {
   "id": "A04-01",
   "algo": "A04",
   "title": "Subdivided Columns – A New Order",
   "creator": "Michael Hansmeyer",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "fabrication",
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "以多立克柱為起點，用自寫的 Java 細分程式反覆細分網格面，柱體面數可達數百萬；再切成約 3,000 層 1 mm 厚紙板以銑床切割疊成 3 公尺高柱。設計的是「產生柱子的過程」，換參數即得無窮變體，曾於 2011 光州設計雙年展展出。",
   "variations": [
    {
     "name": "從矩形換成網格面",
     "how": "把基礎範例的 Block 換成 Mesh 面，每一代把一個四邊形面切成四個子面，而不是把矩形切成兩塊。",
     "effect": "從平面分區變成 3D 表面細分，細節量指數成長。"
    },
    {
     "name": "加權偏移新點",
     "how": "細分時新產生的邊點、面點不放在中點，而是乘上可調權重往法向推出或縮進。",
     "effect": "產生凹凸、分枝、繁複裝飾般的表面。"
    },
    {
     "name": "切片製造輸出",
     "how": "完成後用固定間距的水平面與網格求交，輸出每層輪廓 Polyline 給雷射切割。",
     "effect": "把超高面數模型轉成可疊層組裝的實體柱。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "遞迴",
    "3D",
    "數位製造"
   ],
   "tools": [
    "Java"
   ],
   "url": "https://michael-hansmeyer.com/subdivided-columns"
  },
  {
   "id": "A04-02",
   "algo": "A04",
   "title": "Platonic Solids – Subdivision Studies",
   "creator": "Michael Hansmeyer",
   "year": "2008",
   "category": "modeling",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "從最原始的柏拉圖多面體出發，只重複一個操作：把面分成更小的面。所有形體都用同一個過程，只改變控制分割的變數，就影響拓樸、曲率、分枝與孔隙度，許多結果看起來像植物或生物。",
   "variations": [
    {
     "name": "同一規則、只改參數",
     "how": "固定遞迴函式，只把 minRatio、maxRatio 之類的切割比例換成面細分的權重，並批次跑多組參數。",
     "effect": "做出一整個系列的形態目錄，看出參數與形態的對應。"
    },
    {
     "name": "起始形體換成多面體",
     "how": "初始不再是一塊矩形基地，而是正四面體、立方體等 Mesh，遞迴對每個面操作。",
     "effect": "同一規則在不同起點下長出截然不同的形。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "遞迴",
    "3D",
    "分形"
   ],
   "tools": [],
   "url": "https://michael-hansmeyer.com/platonic-solids"
  },
  {
   "id": "A04-03",
   "algo": "A04",
   "title": "Digital Grotesque I",
   "creator": "Michael Hansmeyer, Benjamin Dillenburger",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "第一個以 3D 列印砂岩構成的人尺度沉浸空間，為 FRAC Centre（奧爾良）製作。演算法從一個簡單立方體出發，反覆分割並變形幾何，形成約 8,000 萬個面的洞窟。",
   "variations": [
    {
     "name": "3D 盒子遞迴",
     "how": "把基礎範例 2D Block 擴成 3D Box，每一代分割並對子塊做縮放、扭轉或偏移。",
     "effect": "從單一立方體生出多層次、具空間深度的量體。"
    },
    {
     "name": "分塊列印",
     "how": "最後依列印機工作範圍再做一次粗的空間分割，把模型切成可列印的單元並編號。",
     "effect": "把巨量幾何拆成可製造、可組裝的構件。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "遞迴",
    "3D",
    "數位製造"
   ],
   "tools": [
    "3D 列印"
   ],
   "url": "https://michael-hansmeyer.com/digital-grotesque-I"
  },
  {
   "id": "A04-04",
   "algo": "A04",
   "title": "Digital Grotesque II",
   "creator": "Michael Hansmeyer, Benjamin Dillenburger",
   "year": "2017",
   "category": "art-installation",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "建築",
   "summary": "於龐畢度中心 Imprimer le monde 展首展的全尺度 3D 列印洞窟，並成為館方永久典藏。細分演算法被設計成能產生拓樸複雜、多孔、多層次的結構，據報導含約 13.5 億個面。",
   "variations": [
    {
     "name": "分支式細分",
     "how": "遞迴時一塊不只分成兩塊，而是依機率分出多個子塊並各自往外生長。",
     "effect": "單一量體衍生大量分枝，形成多孔洞的地景。"
    },
    {
     "name": "依深度控制孔隙",
     "how": "依 Depth 決定該塊保留實體或挖空，深層區塊更容易被挖空。",
     "effect": "外層較實、內部越來越通透的多層結構。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "遞迴",
    "3D",
    "數位製造"
   ],
   "tools": [
    "3D 列印"
   ],
   "url": "https://www.designboom.com/architecture/digital-grotesque-grotto-2-3d-printed-michael-hansmeyer-benjamin-dillenburger-07-14-2017/"
  },
  {
   "id": "A04-05",
   "algo": "A04",
   "title": "Mondrian-Generative-Art（Processing／p5.js）",
   "creator": "PzanettiD",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "向 Piet Mondrian 致敬的開源生成藝術，以 Processing 與 p5.js 產生 Mondrian 式構圖並隨機上色。Mondrian 的語彙只有三原色、黑白灰與水平垂直兩方向，正好就是遞迴矩形分割的輸出。",
   "variations": [
    {
     "name": "依深度上色",
     "how": "用基礎範例輸出的 depths 對照一組紅黃藍白調色盤，並讓少數區塊隨機填色。",
     "effect": "直接產生 Mondrian 風格的畫面。"
    },
    {
     "name": "線寬分層",
     "how": "越早切的分隔線（深度小）畫得越粗，深層的線越細。",
     "effect": "畫面有主從秩序，更接近原作的構圖感。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "遞迴",
    "隨機"
   ],
   "tools": [
    "Processing",
    "p5.js"
   ],
   "url": "https://github.com/PzanettiD/Mondrian-Generative-Art"
  },
  {
   "id": "A04-06",
   "algo": "A04",
   "title": "Squarified Treemaps",
   "creator": "Mark Bruls, Kees Huizing, Jarke J. van Wijk",
   "year": "2000",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "把階層資料（如資料夾結構）畫成巢狀矩形的 treemap 視覺化方法。原始 treemap 會產生細長矩形，本文改進排列方式讓每個矩形接近正方形，更易比較與點選。",
   "variations": [
    {
     "name": "面積決定切割比例",
     "how": "把隨機 ratio 改成「兩組資料值總和的比例」，資料值由輸入清單提供。",
     "effect": "每塊面積精確對應資料大小。"
    },
    {
     "name": "長寬比最佳化",
     "how": "每次放入下一個項目前比較加入前後的最差長寬比，變差就換新的一列（squarified 規則）。",
     "effect": "區塊接近正方形，版面更整齊易讀。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "遞迴",
    "最佳化"
   ],
   "tools": [],
   "url": "https://link.springer.com/chapter/10.1007/978-3-7091-6783-0_4"
  },
  {
   "id": "A04-07",
   "algo": "A04",
   "title": "以 Squarified Treemaps 即時產生住宅平面",
   "creator": "Fernando Marson, Soraia Raupp Musse",
   "year": "2010",
   "category": "3d-architecture",
   "categories_extra": [
    "modeling"
   ],
   "scale": "建築",
   "summary": "把原本用於資料視覺化的 squarified treemap 改用來產生住宅平面，自動切出帶有機能語意的房間，並建出對應的 3D 模型，強調即時、穩健與參數簡單。",
   "variations": [
    {
     "name": "分區再分房",
     "how": "第一層先依公共／私密區面積切，第二層再在各區內依房間面積切（兩層遞迴、各自有面積清單）。",
     "effect": "平面具有分區邏輯，不只是隨機切塊。"
    },
    {
     "name": "加上走道與門",
     "how": "切完後檢查相鄰區塊的共用邊，在需要連通的房間共用邊上開門；無法連通的插入走道帶。",
     "effect": "從泡泡圖變成可走動的平面。"
    },
    {
     "name": "擠出成 3D",
     "how": "把每塊外框 Offset 出牆厚再 Extrude 樓高。",
     "effect": "快速得到可檢視的 3D 住宅模型。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "遞迴",
    "約束滿足"
   ],
   "tools": [],
   "url": "https://www.researchgate.net/publication/47696530_Automatic_Real-Time_Generation_of_Floor_Plans_Based_on_Squarified_Treemaps_Algorithm"
  },
  {
   "id": "A04-08",
   "algo": "A04",
   "title": "Procedural Modeling of Buildings（CGA shape）",
   "creator": "Pascal Müller, Peter Wonka, Simon Haegler, Andreas Ulmer, Luc Van Gool",
   "year": "2006",
   "category": "3d-architecture",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "建築",
   "summary": "提出 CGA shape 形狀文法，以 split 規則把量體與立面一層層分割成樓層、開間、窗戶等元素，可大量產生高細節的建築，並以重建龐貝古城示範。遞迴分割在此成為有名稱、有語意的文法規則。",
   "variations": [
    {
     "name": "有標籤的分割",
     "how": "Block 增加 Label 欄位（Facade、Floor、Tile、Window），每種標籤對應不同的切法與停止條件。",
     "effect": "分割結果具有建築語意，可依標籤換材質或構件。"
    },
    {
     "name": "固定尺寸重複切",
     "how": "除了按比例切，加入「每隔固定樓高切一刀」的重複規則。",
     "effect": "得到規律的樓層與開間節奏。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "遞迴",
    "字串改寫",
    "3D"
   ],
   "tools": [
    "CityEngine"
   ],
   "url": "https://history.siggraph.org/learning/procedural-modeling-of-buildings-by-muller-wonka-haegler-ulmer-and-gool/"
  },
  {
   "id": "A04-09",
   "algo": "A04",
   "title": "Image-based Procedural Modeling of Facades",
   "creator": "Pascal Müller, Gang Zeng, Peter Wonka, Luc Van Gool",
   "year": "2007",
   "category": "3d-architecture",
   "categories_extra": [
    "drawing"
   ],
   "scale": "立面／表皮",
   "summary": "結合形狀文法與影像分析，從一張立面照片推導出階層式的立面分割（樓層、開間、窗格），再轉成可編輯的程序化模型。是「從影像反推遞迴分割」的代表研究。",
   "variations": [
    {
     "name": "依影像找切割線",
     "how": "不再隨機選切割位置，而是在區塊內找影像灰階變化最大（邊緣最明顯）的位置切。",
     "effect": "分割線會對齊照片中的窗框與樓板。"
    },
    {
     "name": "重複性偵測",
     "how": "切出一個窗格後，比較相鄰區塊的影像相似度，相似就直接複製同一組子分割。",
     "effect": "立面分割更規整、參數更少。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "遞迴",
    "影像輸入"
   ],
   "tools": [],
   "url": "https://dl.acm.org/doi/10.1145/1276377.1276484"
  },
  {
   "id": "A04-10",
   "algo": "A04",
   "title": "Procedural Generation of Parcels in Urban Modeling",
   "creator": "Carlos A. Vanegas, Tom Kelly, Basil Weber, Jan Halatsch, Daniel G. Aliaga, Pascal Müller",
   "year": "2012",
   "category": "urban-landscape",
   "categories_extra": [],
   "scale": "群體／都市",
   "summary": "在都市街廓內部互動式產生地籍分割，其中一種方法是以最小外接矩形（OBB）做二元空間分割，遞迴切到目標地塊大小，並保證結果在幾何與機能上合理，編輯後仍能對應原本的地塊。",
   "variations": [
    {
     "name": "OBB 取代矩形",
     "how": "把 Block 改成任意多邊形，每次計算 OBB 長軸，用垂直長軸的線切開多邊形。",
     "effect": "可以切不規則的真實街廓。"
    },
    {
     "name": "臨街約束",
     "how": "切完檢查每塊是否有一邊碰到街道邊界，沒有臨街的切法就重選位置或放棄這一刀。",
     "effect": "每塊地都能臨路，符合實際地籍需求。"
    },
    {
     "name": "穩定種子",
     "how": "在遞迴前先為兩個子塊各自算好子種子（例如 seed*31+index），而不是共用一個 Random。",
     "effect": "改動某一區時其他地塊不會跟著全部重洗。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "遞迴",
    "可重現種子",
    "約束滿足"
   ],
   "tools": [
    "CityEngine"
   ],
   "url": "https://twak.org/project/parcels/"
  },
  {
   "id": "A04-11",
   "algo": "A04",
   "title": "ArcGIS CityEngine 街廓遞迴分割（Recursive Subdivision）",
   "creator": "Esri",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "modeling"
   ],
   "scale": "群體／都市",
   "summary": "CityEngine 預設的街廓分割方法即為遞迴分割，將街廓切成大小不一的矩形地塊，使用者可設定地塊面積、寬度、變化量等參數，並可逐個街廓個別設定。",
   "variations": [
    {
     "name": "面積上下限",
     "how": "把 minSize（邊長）換成 minArea、maxArea 兩個輸入：大於 maxArea 必切、介於之間依機率停。",
     "effect": "地塊面積分布更貼近都市計畫規範。"
    },
    {
     "name": "地塊擠出量體",
     "how": "每塊依面積或到主要道路距離決定樓高並 Extrude。",
     "effect": "從街廓分割一路產生都市量體模型。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "遞迴",
    "隨機"
   ],
   "tools": [
    "CityEngine"
   ],
   "url": "https://doc.arcgis.com/en/cityengine/latest/help/help-layers-block-parameters.htm"
  },
  {
   "id": "A04-12",
   "algo": "A04",
   "title": "Quads – Quadtree Art",
   "creator": "Michael Fogleman",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing",
    "art-installation"
   ],
   "scale": "物件",
   "summary": "讀入照片，以四分樹反覆分割：每個象限填平均色，誤差最大的象限優先再切成四塊，重複 N 次，得到色塊風格化的影像，也可輸出分割過程的動畫。",
   "variations": [
    {
     "name": "改成四分",
     "how": "每次切成四個等大子塊，而不是沿長邊切成兩塊。",
     "effect": "得到規整的四分樹方塊。"
    },
    {
     "name": "誤差優先佇列",
     "how": "不用遞迴，改用 List 儲存所有區塊，每一輪挑顏色誤差最大的那塊來切。",
     "effect": "可精確控制總塊數，細節集中在影像複雜處。"
    },
    {
     "name": "過程動畫",
     "how": "每切一次就輸出一幀（配合 Timer 或 Slider 控制步數）。",
     "effect": "看見影像從粗到細浮現。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "遞迴",
    "影像輸入",
    "動畫"
   ],
   "tools": [
    "Go"
   ],
   "url": "https://github.com/fogleman/Quads"
  },
  {
   "id": "A04-13",
   "algo": "A04",
   "title": "Weaverbird – Topological Mesh Editor",
   "creator": "Giulio Piacentino",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "Grasshopper 外掛，提供 Catmull-Clark、Loop 等常見網格細分運算子。Catmull-Clark 每次把網格面細分並平滑，趨近 B-spline 曲面；Loop 細分則永遠輸出三角面。是建築系學習者最常接觸的「遞迴細分」工具。",
   "variations": [
    {
     "name": "局部細分",
     "how": "只對吸引子附近或面積大於門檻的網格面做細分，其餘面保留。",
     "effect": "細節集中在需要的地方，控制面數。"
    },
    {
     "name": "細分後再開孔",
     "how": "細分數代後，對每個面做 Offset 開孔（Weaverbird 的 Window/Frame 類操作）再加厚。",
     "effect": "得到可 3D 列印或雷切的網狀表皮。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "遞迴",
    "3D"
   ],
   "tools": [
    "Grasshopper",
    "Weaverbird"
   ],
   "url": "https://www.giuliopiacentino.com/weaverbird/"
  },
  {
   "id": "A04-14",
   "algo": "A04",
   "title": "Recursive image subdivision（Grasshopper 論壇範例）",
   "creator": "Grasshopper3d 社群",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "立面／表皮",
   "summary": "Grasshopper 論壇上分享的範例：用 Anemone 做迴圈，可指定遞迴層數，並比較每個矩形取樣的灰階值來決定是否繼續切，把影像轉成大小不一的矩形分割。",
   "variations": [
    {
     "name": "C# 取代 Anemone",
     "how": "直接把基礎範例的 SplitBlock 加上 Bitmap 取樣，用灰階門檻當停止條件，不需外掛。",
     "effect": "單一 C# 元件完成影像驅動分割，速度更快。"
    },
    {
     "name": "轉為立面開孔",
     "how": "每個矩形依灰階決定開孔大小（Offset 距離），輸出成穿孔板。",
     "effect": "把照片轉成可雷切的立面穿孔板。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "遞迴",
    "影像輸入"
   ],
   "tools": [
    "Grasshopper",
    "Anemone"
   ],
   "url": "https://www.grasshopper3d.com/forum/topics/recursive-image-subdivision-samples-examples"
  },
  {
   "id": "A04-51",
   "algo": "A04",
   "title": "Coding Challenge #77：Recursion（遞迴）",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2017",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "用 p5.js 示範函式呼叫自己來畫碎形：drawCircle 在畫完一個圓後，於兩側呼叫自己畫出較小的圓，加上離開條件，最後再加入隨機性。雖然切的是圓不是矩形，但「檢查停止條件 → 產生子圖形 → 再丟回同一函式」的結構和基礎範例的 SplitBlock 完全相同，是理解遞迴分割最直接的入門。",
   "variations": [
    {
     "name": "四向遞迴",
     "how": "SplitBlock 不再只切成兩塊，而是一次切成 2×2 四塊，各自遞迴。",
     "effect": "得到類似四分樹的規則網格，對比二分切割的 Mondrian 感。"
    },
    {
     "name": "以深度控制停止",
     "how": "停止條件改成 depth ≥ maxDepth，並讓 stopChance 隨 depth 變大。",
     "effect": "可以更直覺控制層級數量與疏密。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "creative coding",
    "p5.js",
    "遞迴",
    "教學影片"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://thecodingtrain.com/challenges/77-recursion",
   "image": {
    "file": "img/cases/A04-51.jpg",
    "w": 900,
    "h": 506,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/77-recursion",
    "note": "Coding Challenge #77 影片縮圖"
   }
  },
  {
   "id": "A04-52",
   "algo": "A04",
   "title": "Coding Challenge #98：Quadtree（四分樹）",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2018",
   "category": "2d-pattern",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "多集的 p5.js 挑戰，實作 Quadtree：一個格子內的點數超過容量就平均切成四塊，再遞迴處理，並用它加速碰撞偵測與範圍查詢。和基礎範例相比，切割不是隨機而是「依資料密度」觸發，所以點越密的地方分割越細。",
   "variations": [
    {
     "name": "依點密度分割",
     "how": "新增一組點輸入（例如人流、樹木或建物中心），停止條件改成「區塊內點數 ≤ capacity」，否則切四等分。",
     "effect": "高密度區自動細分，得到反映使用強度的分區。"
    },
    {
     "name": "範圍查詢",
     "how": "保留 Block 樹狀結構（子節點清單），寫一個函式只走進與查詢矩形相交的子區塊。",
     "effect": "大量元素時能快速找出鄰近物件，可接到後續的配置或模擬。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "p5.js",
    "空間索引",
    "資料結構"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://thecodingtrain.com/challenges/98-quadtree",
   "image": {
    "file": "img/cases/A04-52.jpg",
    "w": 900,
    "h": 506,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/98-quadtree",
    "note": "Coding Challenge #98 影片縮圖"
   }
  },
  {
   "id": "A04-53",
   "algo": "A04",
   "title": "Aesthetically Pleasing Triangle Subdivision（好看的三角形遞迴分割）",
   "creator": "Tyler Hobbs",
   "year": "2017",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "立面／表皮",
   "summary": "生成藝術家 Tyler Hobbs 的文章：從頂點連到對邊的一點把三角形切成兩個，遞迴下去。他比較中點切割（僵硬）、以截尾常態分布隨機取點、永遠切最長邊（自我平衡、避免細長三角形），以及以機率或依位置決定何時停止；文中程式為 Clojure 語法。和基礎範例一樣是二分遞迴，只是單元從矩形換成三角形。",
   "variations": [
    {
     "name": "三角形版本",
     "how": "把 Block 改成三個頂點，永遠找最長邊，在上面取 t（以常態分布集中在 0.5 附近）連到對角頂點，切成兩個三角形遞迴。",
     "effect": "得到不規則但均衡的三角網，可作面板分割。"
    },
    {
     "name": "依位置調整停止機率",
     "how": "stopChance 改成三角形中心 y 座標（或到吸引點距離）的函數。",
     "effect": "畫面一側密、一側疏，形成漸層式的細分。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "Clojure",
    "生成藝術",
    "三角網"
   ],
   "tools": [
    "Clojure"
   ],
   "url": "https://tylerxhobbs.com/essays/2017/aesthetically-pleasing-triangle-subdivision",
   "image": {
    "file": "img/cases/A04-53.jpg",
    "w": 900,
    "h": 900,
    "source": "tylerxhobbs.com",
    "author": "Tyler Hobbs",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://tylerxhobbs.com/essays/2017/aesthetically-pleasing-triangle-subdivision",
    "note": "文中插圖：隨機取點的三角形遞迴分割"
   }
  },
  {
   "id": "A04-54",
   "algo": "A04",
   "title": "SideFX Labs Lot Subdivision（Houdini 地塊／面板細分節點）",
   "creator": "SideFX",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "3d-architecture",
    "modeling"
   ],
   "scale": "群體／都市",
   "summary": "Houdini SideFX Labs 的節點，把多邊形反覆切割成大小不一的「lot」，可用於太空船面板、科幻室內、城市街廓與不規則牆面；可選依世界座標或最長邊對齊切割，設定最小尺寸、迭代次數、不規則度，還能把相鄰小塊合併成更有趣的形狀。它把基礎範例的矩形遞迴推廣到任意多邊形。",
   "variations": [
    {
     "name": "任意多邊形切割",
     "how": "Block 改存封閉 Polyline，找最長邊，用垂直於該邊的直線在隨機比例處切開（Curve.Split 或 Brep 切割），兩塊各自遞迴。",
     "effect": "可以直接細分不規則基地或斜向街廓。"
    },
    {
     "name": "切完再合併",
     "how": "遞迴結束後，隨機挑選共用一條邊的相鄰小塊，以 Region Union 合併成 L 形或 T 形。",
     "effect": "打破全是矩形的單調感，更接近真實地塊。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Houdini",
    "程序化建模",
    "街廓"
   ],
   "tools": [
    "Houdini"
   ],
   "url": "https://www.sidefx.com/docs/houdini/nodes/sop/labs--lot_subdivision-2.0.html"
  },
  {
   "id": "A05-01",
   "algo": "A05",
   "title": "形狀文法的起點：繪畫與雕塑的生成規格",
   "creator": "George Stiny、James Gips",
   "year": "1972",
   "category": "art-installation",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Stiny 與 Gips 首次提出形狀文法，主張規則直接作用在形狀上而非符號，並用一組規則生成一系列抽象繪畫與雕塑。這是基礎範例「形狀→形狀」改寫概念的源頭。",
   "variations": [
    {
     "name": "標記點規則",
     "how": "在 LabeledSquare 加一個標記點（marker）欄位，規則只在標記所在的邊上長出新形狀，並把標記傳給子形狀。",
     "effect": "用標記控制生長位置，得到不對稱但有秩序的構圖。"
    },
    {
     "name": "形狀疊加上色",
     "how": "依標籤與世代給不同填色與透明度，輸出 Hatch 而非外框。",
     "effect": "直接成為一張抽象繪畫。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "字串改寫",
    "對稱"
   ],
   "tools": [
    "手繪",
    "理論"
   ],
   "url": "https://www.semanticscholar.org/paper/Shape-Grammars-and-the-Generative-Specification-of-Stiny-Gips/c8f7baf704f7d7713eee196de6cb90cbfb7fc4cd"
  },
  {
   "id": "A05-02",
   "algo": "A05",
   "title": "Palladian Grammar：帕拉底歐別墅平面文法",
   "creator": "George Stiny、William J. Mitchell",
   "year": "1978",
   "category": "3d-architecture",
   "categories_extra": [
    "drawing"
   ],
   "scale": "建築",
   "summary": "以參數化形狀文法定義帕拉底歐別墅的平面風格，從網格格線開始，經過多個階段的規則逐步生成房間配置、牆、柱廊與門窗，並成功推導出 Villa Malcontenta 的平面。",
   "variations": [
    {
     "name": "分階段規則",
     "how": "把 ApplyRules 拆成多個階段函式（格網→房間→牆→開口），每個階段只允許特定標籤被改寫。",
     "effect": "像真正的建築設計流程一樣由粗到細生成平面。"
    },
    {
     "name": "對稱約束",
     "how": "只在左半部套用規則，再以中軸 Mirror 產生右半部。",
     "effect": "保證生成的平面具有帕拉底歐式的雙向對稱。"
    },
    {
     "name": "房間比例檢查",
     "how": "切割矩形房間時只允許 1:1、2:3、3:5 等比例，不符合的切法捨棄。",
     "effect": "生成的房間符合古典比例系統。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "對稱",
    "約束滿足"
   ],
   "tools": [
    "手繪",
    "理論"
   ],
   "url": "https://journals.sagepub.com/doi/10.1068/b050005"
  },
  {
   "id": "A05-03",
   "algo": "A05",
   "title": "The Language of the Prairie：萊特草原住宅文法",
   "creator": "Hank Koning、Julie Eizenberg",
   "year": "1981",
   "category": "3d-architecture",
   "categories_extra": [],
   "scale": "建築",
   "summary": "以壁爐為起始形狀，用參數化形狀文法生成萊特草原住宅的量體組合與機能分區，證明形狀文法能處理三維建築語彙，並能推導出新的「萊特風格」住宅。",
   "variations": [
    {
     "name": "以核心為種子",
     "how": "起始形狀改成一個標籤為 Core 的方塊（壁爐），規則讓各翼量體沿十字軸向外長出。",
     "effect": "形成以壁爐為中心的十字形平面。"
    },
    {
     "name": "3D 量體＋屋頂",
     "how": "把正方形擠出成 Box，最後一階段依標籤加上出挑的低斜屋頂板。",
     "effect": "得到有水平延伸感的草原風格量體模型。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D"
   ],
   "tools": [
    "理論"
   ],
   "url": ""
  },
  {
   "id": "A05-04",
   "algo": "A05",
   "title": "Siza Malagueira 住宅文法與大量客製化",
   "creator": "José P. Duarte",
   "year": "2005",
   "category": "urban-landscape",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "群體／都市",
   "summary": "Duarte 從 Álvaro Siza 在 Malagueira 設計的 35 棟合院住宅歸納出形狀文法，目標是做出讓住戶參與設計的客製化集合住宅系統。文法把「建築師的風格」與「住戶的需求」同時寫進規則裡。",
   "variations": [
    {
     "name": "需求驅動的規則選擇",
     "how": "新增輸入（臥室數、基地寬度），在 ApplyRules 裡依需求決定要套用哪一條切割規則。",
     "effect": "同一套文法產生符合不同家庭的平面。"
    },
    {
     "name": "長條基地分割",
     "how": "起始形狀改成長方形基地，先切出合院與建築帶，再往下細分房間。",
     "effect": "得到 Malagueira 式前院或後院的合院住宅平面。"
    },
    {
     "name": "整排生成",
     "how": "外層迴圈沿街道複製基地，每戶用不同 seed 與需求套文法。",
     "effect": "一整排風格一致但各戶不同的街屋。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "約束滿足",
    "可重現種子"
   ],
   "tools": [
    "理論",
    "電腦程式"
   ],
   "url": "https://journals.sagepub.com/doi/10.1068/b31124"
  },
  {
   "id": "A05-05",
   "algo": "A05",
   "title": "CGA Shape：程序化建築生成與龐貝古城重建",
   "creator": "Pascal Müller、Peter Wonka、Simon Haegler、Andreas Ulmer、Luc Van Gool",
   "year": "2006",
   "category": "urban-landscape",
   "categories_extra": [
    "modeling"
   ],
   "scale": "群體／都市",
   "summary": "CGA shape 把形狀文法轉成以量體、分割（split）、重複（repeat）與構件取代為核心的電腦文法，可大量生成具細節的建築外殼，並以龐貝古城的虛擬重建展示其效率。後來發展為 CityEngine 的核心語言。",
   "variations": [
    {
     "name": "量體→立面→構件三層",
     "how": "形狀加上 Scope（Box）欄位，規則依序做 extrude、comp（拆面）、split（切樓層），最後把 Window 標籤換成外部構件。",
     "effect": "從地塊一路生成到有窗的建築外殼。"
    },
    {
     "name": "重複分割",
     "how": "寫一個 RepeatSplit(長度, 目標寬度) 讓開間數依量體長度自動調整。",
     "effect": "不同長度的立面都能自動填滿窗戶。"
    },
    {
     "name": "情境敏感規則",
     "how": "在套用規則前檢查形狀是否與其他量體相交（遮擋），若被擋住就不放窗。",
     "effect": "避免窗戶開在被鄰棟擋住的牆上。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "多元件"
   ],
   "tools": [
    "CityEngine",
    "CGA"
   ],
   "url": "https://dl.acm.org/doi/10.1145/1141911.1141931"
  },
  {
   "id": "A05-06",
   "algo": "A05",
   "title": "CityEngine 立面建模教學（CGA split 規則）",
   "creator": "Esri",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "立面／表皮",
   "summary": "CityEngine 官方教學示範以 CGA 規則把立面水平切成樓層、以重複分割讓中間樓層自動填滿高度，再插入窗、門、線腳等構件。是分割文法最直接的業界工具範例。",
   "variations": [
    {
     "name": "樓層索引參數化",
     "how": "切樓層時把 index 存進形狀，規則依 index 決定一樓店面、頂樓退縮或中間標準層。",
     "effect": "同一條規則生成有基座、中段、頂部的立面。"
    },
    {
     "name": "在 GH 重現 split",
     "how": "把 LabeledSquare 換成矩形，寫 SplitY(比例陣列) 與 SplitX 兩個規則函式，模仿 CGA 的 split 語法。",
     "effect": "不用 CityEngine 也能在 Grasshopper 中做立面文法。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "多元件"
   ],
   "tools": [
    "CityEngine",
    "CGA"
   ],
   "url": "https://doc.arcgis.com/en/cityengine/latest/tutorials/tutorial-7-facade-modeling.htm"
  },
  {
   "id": "A05-07",
   "algo": "A05",
   "title": "Ice-ray：中式冰裂紋窗格文法",
   "creator": "George Stiny",
   "year": "1977",
   "category": "2d-pattern",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "Stiny 分析中式冰裂紋窗格的構成慣例，提出以一條線把多邊形切成兩個多邊形的參數化遞迴規則。簡單的切割規則就能生成大小遞減、看似自然的窗花。",
   "variations": [
    {
     "name": "多邊形切割規則",
     "how": "LabeledSquare 改成 LabeledPolygon（Polyline），規則為「選兩條邊各取一點連線切開」，面積小於門檻變 C。",
     "effect": "生成冰裂紋窗格。"
    },
    {
     "name": "切割位置限制",
     "how": "只允許切在邊的 1/3–2/3 範圍內，並限制新產生的角度不可太尖。",
     "effect": "避免碎片過細，更接近傳統窗花。"
    },
    {
     "name": "窗框木條輸出",
     "how": "把每條切割線 Offset 成固定寬度的條材，輸出成可雷切的外框。",
     "effect": "可以直接製作實體窗花。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "遞迴",
    "隨機",
    "拼貼"
   ],
   "tools": [
    "理論"
   ],
   "url": "https://journals.sagepub.com/doi/10.1068/b040089"
  },
  {
   "id": "A05-08",
   "algo": "A05",
   "title": "Chinese Ice-ray Lattices Revisited（Grasshopper 實作）",
   "creator": "designcoding",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "立面／表皮",
   "summary": "以 Grasshopper 重新實作冰裂紋格柵的生成，把 Stiny 的切割文法轉成可調參數的視覺程式。是學習者從論文走向 GH 實作的好參考。",
   "variations": [
    {
     "name": "改為 C# 一元件完成",
     "how": "把 GH 元件串接改寫進 A05 的 LOOP 架構，用 List<Polyline> 每代整批替換。",
     "effect": "可控制世代數與終止面積，運算更集中。"
    },
    {
     "name": "吸引子密度",
     "how": "終止面積改為隨多邊形中心到吸引子距離變化。",
     "effect": "窗格在吸引子附近變得細碎，遠處開闊。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "吸引子控制",
    "拼貼"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://www.designcoding.net/revisiting-chinese-ice-ray-lattices/"
  },
  {
   "id": "A05-09",
   "algo": "A05",
   "title": "The Grammar of Paradise：蒙兀兒花園文法",
   "creator": "George Stiny、William J. Mitchell",
   "year": "1980",
   "category": "urban-landscape",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "地景",
   "summary": "以參數化形狀文法描述蒙兀兒四分花園（char-bagh）的設計慣例：正方形基地被水道與步道十字分割，四個象限再遞迴細分並加上邊界。泰姬瑪哈陵的花園平面可由此推導。",
   "variations": [
    {
     "name": "四分遞迴",
     "how": "規則 1 改成「A → 中央十字水道 B ＋ 四個縮小的 A」，而不是兩個旋轉的 A。",
     "effect": "生成層層四分的花園平面。"
    },
    {
     "name": "邊界帶",
     "how": "在每次細分前先 Offset 出一圈步道標籤 D，剩下的內部才繼續切。",
     "effect": "花圃之間出現步道與水渠系統。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "遞迴",
    "對稱",
    "分形"
   ],
   "tools": [
    "理論"
   ],
   "url": "https://www.andrew.cmu.edu/user/ramesh/teaching/course/48-747/subFrames/readings/Stiny&MItchell-1980-EPB7_209-226.TheGrammarOfParadise..pdf"
  },
  {
   "id": "A05-10",
   "algo": "A05",
   "title": "More than the Sum of Parts：Queen Anne 住宅文法",
   "creator": "Ulrich Flemming",
   "year": "1987",
   "category": "3d-architecture",
   "categories_extra": [
    "drawing"
   ],
   "scale": "建築",
   "summary": "Flemming 為 1880 年代美國 Queen Anne 風格住宅寫出形狀文法，從平面配置、量體外推到複雜屋頂組合逐步生成，說明規則的組合能產生「大於部分總和」的整體風格。",
   "variations": [
    {
     "name": "量體外推規則",
     "how": "新增規則讓牆面上的 A 往外推出凸窗或塔樓量體，並標記需要加屋頂。",
     "effect": "形成凹凸豐富的住宅輪廓。"
    },
    {
     "name": "規則順序限制",
     "how": "某些規則必須在另一條規則之後才能套用（例如先外推再加屋頂），用階段變數控制。",
     "effect": "避免屋頂和量體衝突，示範規則之間的依賴。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "約束滿足"
   ],
   "tools": [
    "理論"
   ],
   "url": "https://journals.sagepub.com/doi/10.1068/b140323"
  },
  {
   "id": "A05-11",
   "algo": "A05",
   "title": "Palladian Construction Grammar：文法加快速原型",
   "creator": "Larry Sass",
   "year": "2007",
   "category": "fabrication",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "Sass 把帕拉底歐文法延伸為「構築文法」，從平面圖出發，用規則生成可以實際製造組裝的構件，並透過快速原型製作實體模型，讓文法直接連到數位製造。",
   "variations": [
    {
     "name": "標籤→構件",
     "how": "最後一階段依標籤把每個形狀轉成牆板、樓板或柱的實體幾何，並加上接合缺口。",
     "effect": "文法的輸出變成可以組裝的零件。"
    },
    {
     "name": "零件展開與編號",
     "how": "把所有構件平放到 XY 平面、排版並加上文字編號。",
     "effect": "可直接送雷切或 CNC 的製造圖。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "多元件"
   ],
   "tools": [
    "CAD",
    "快速原型"
   ],
   "url": "https://www.researchgate.net/publication/23541586_A_Palladian_construction_grammar_-_Design_reasoning_with_shape_grammars_and_rapid_prototyping"
  },
  {
   "id": "A05-12",
   "algo": "A05",
   "title": "eifForm：形狀退火結構生成系統",
   "creator": "Kristina Shea（與 Jonathan Cagan 合作）",
   "year": "2000",
   "category": "performance",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "eifForm 結合參數化形狀文法、結構分析與隨機最佳化（shape annealing），用規則增刪桁架節點與桿件，並以結構性能與成本評估引導搜尋，生成有效率又新穎的平面桁架與空間桁架。",
   "variations": [
    {
     "name": "三角形桁架文法",
     "how": "把正方形改成三角形元素，規則為「在三角形中加一個節點分成三個三角形」或「翻轉共用邊」。",
     "effect": "生成不同拓撲的桁架。"
    },
    {
     "name": "退火選規則",
     "how": "每一步隨機挑一條規則試套，用簡化的評分（總桿長、最長跨距）決定接受與否，接受機率隨溫度下降。",
     "effect": "文法不再盲目生長，而是朝性能較好的形收斂。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "最佳化",
    "隨機",
    "收斂"
   ],
   "tools": [
    "eifForm",
    "Java"
   ],
   "url": "https://www.acsa-arch.org/proceedings/Technology%20Proceedings/ACSA.Tech.2000/ACSA.Tech.2000.13.pdf"
  },
  {
   "id": "A05-13",
   "algo": "A05",
   "title": "Diebenkorn《Ocean Park》系列的繪畫文法",
   "creator": "Russell A. Kirsch、Joan L. Kirsch",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "電腦科學家 Russell Kirsch 與藝術史學者 Joan Kirsch 為 Richard Diebenkorn 的《Ocean Park》抽象畫系列寫出形狀文法，以水平與垂直分割規則描述畫面結構，並能生成風格相似的新構圖。",
   "variations": [
    {
     "name": "直交分割構圖",
     "how": "起始形狀改成直立長方形畫布，規則為依比例水平或垂直切一刀，並標記色塊或留白。",
     "effect": "生成類似 Ocean Park 的直交分割抽象畫。"
    },
    {
     "name": "斜線例外規則",
     "how": "加一條低機率規則，允許在某些格子內切一條斜線。",
     "effect": "在嚴謹格子中加入 Diebenkorn 式的斜向張力。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "隨機"
   ],
   "tools": [
    "電腦程式"
   ],
   "url": "https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=821704"
  },
  {
   "id": "A05-14",
   "algo": "A05",
   "title": "《營造法式》形狀文法",
   "creator": "Andrew I-kang Li",
   "year": "",
   "category": "3d-architecture",
   "categories_extra": [
    "drawing"
   ],
   "scale": "建築",
   "summary": "以形狀文法解讀北宋李誡《營造法式》，將單一建築類型的平面、剖面與材分制度寫成可生成的規則，並用於教學，讓學習者自己判斷生成結果是否屬於宋式風格並調整文法。",
   "variations": [
    {
     "name": "模數（材分）參數",
     "how": "新增一個模數輸入，所有尺寸以模數的倍數計算，改一個數就能縮放整棟建築。",
     "effect": "示範傳統模數系統如何轉成參數化規則。"
    },
    {
     "name": "平面＋剖面同步生成",
     "how": "形狀同時帶平面矩形與剖面輪廓兩份資料，規則一次更新兩者。",
     "effect": "開間與屋架同時生成，一致性由規則保證。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "多元件"
   ],
   "tools": [
    "理論",
    "電腦程式"
   ],
   "url": "https://dspace.mit.edu/handle/1721.1/8631"
  },
  {
   "id": "A05-15",
   "algo": "A05",
   "title": "Shape Machine：在 CAD 中搜尋並取代形狀",
   "creator": "Athanassios Economou（Georgia Tech Shape Computation Lab）",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Shape Machine 是一套在 CAD 系統中做向量形狀「搜尋與取代」的工具，能在任意線稿中辨識出規則左側的形狀（包含子形狀），再換成右側的形狀，是真正「視覺計算」式的形狀文法直譯器。",
   "variations": [
    {
     "name": "輸入任意線稿",
     "how": "把起始形狀改成 Rhino 裡畫好的曲線集合，規則改成「找到符合的正方形就替換」，用端點距離容差比對。",
     "effect": "讓學習者在自己的手繪線稿上套用規則。"
    },
    {
     "name": "子形狀辨識",
     "how": "先把所有線段在交點打斷，再搜尋任意四條能組成正方形的線段。",
     "effect": "發現畫面中原本沒有被「畫出來」的隱藏正方形，這是形狀文法與符號文法的核心差異。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "鄰居搜尋"
   ],
   "tools": [
    "Shape Machine",
    "Rhino"
   ],
   "url": "https://shape.gatech.edu/Research/index.html"
  },
  {
   "id": "A05-51",
   "algo": "A05",
   "title": "Context Free Art（CFDG 設計文法）",
   "creator": "Chris Coyne（CFDG 語言）；Mark Lentczner、John Horigan（Context Free 程式）",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Context Free 是以「上下文無關設計文法」（cfdg）生成圖像的程式：從 startshape 出發，每條 shape rule 把一個形狀換成一組帶有位移、縮放、旋轉、色彩調整的子形狀，最後只剩圓、方、三角等基本形；同一形狀可有多條加權規則。這與基礎範例「A 換成 B + 兩個縮小旋轉的 A」是同一件事，只是寫成文字文法。社群藝廊收錄近千件作品。",
   "variations": [
    {
     "name": "加權多規則",
     "how": "替 A 寫兩三條不同的替換規則並給權重（例如 0.8 分叉、0.2 只長一支），套用時用 Random(seed) 依權重挑選。",
     "effect": "畢氏樹變成有機、不對稱的形態，每個種子都不同。"
    },
    {
     "name": "相對狀態累積",
     "how": "LabeledSquare 多存 hue、brightness，子形狀在父形狀的值上加減。",
     "effect": "越往末梢顏色越淡或色相漸變，和 CFDG 的 adjustment 一樣。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "Context Free",
    "CFDG",
    "文法",
    "生成藝術"
   ],
   "tools": [
    "Context Free"
   ],
   "url": "https://www.contextfreeart.org/"
  },
  {
   "id": "A05-52",
   "algo": "A05",
   "title": "Structure Synth（EisenScript 3D 設計文法）",
   "creator": "Mikael Hvidtfeldt Christensen（Syntopia）",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "物件",
   "summary": "Structure Synth 是用設計文法（EisenScript）生成 3D 結構的跨平台程式，構想來自 Chris Coyne 的 Context Free；有 OpenGL 預覽、內建光線追蹤、可匯出 OBJ 或交給 Sunflow、POV-Ray 算圖。它把基礎範例的 2D 正方形替換規則推到 3D 方塊與球體，常用來生成巨構、塔樓狀的抽象量體。",
   "variations": [
    {
     "name": "3D 方塊文法",
     "how": "LabeledSquare 改成帶 Plane 的 LabeledBox，規則在頂面生出兩個縮小、繞 X／Y 軸旋轉的子方塊。",
     "effect": "長出立體的畢氏樹或分枝塔。"
    },
    {
     "name": "最大深度與最小尺寸並用",
     "how": "除了 minSize，另設全域最大物件數，超過就停止所有替換。",
     "effect": "避免 3D 版本數量暴增，也對應 EisenScript 的 maxobjects 概念。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Structure Synth",
    "EisenScript",
    "3D",
    "文法"
   ],
   "tools": [
    "Structure Synth"
   ],
   "url": "https://structuresynth.sourceforge.net/"
  },
  {
   "id": "A05-53",
   "algo": "A05",
   "title": "MarkovJunior：以改寫規則與約束傳播生成的機率式程式語言",
   "creator": "Maxim Gumin（mxgmn）",
   "year": "2022",
   "category": "3d-architecture",
   "categories_extra": [
    "2d-pattern",
    "urban-landscape"
   ],
   "scale": "建築",
   "summary": "WFC 作者 Maxim Gumin 的新專案：程式就是一串改寫規則（例如 RBB=GGR），直譯器每一步找到第一條能匹配的規則並隨機套用一處，可組合 WFC、路徑搜尋等節點；範例包含迷宮、地牢，以及等角視圖的 ModernHouse 等建築。它是格網上的「形狀文法」：左手邊是一小塊圖樣，右手邊是替換結果。",
   "variations": [
    {
     "name": "格網圖樣替換",
     "how": "把形狀換成格網上的標籤陣列，規則為「左邊 1×3 圖樣 → 右邊 1×3 圖樣」，每步隨機挑一處匹配替換，直到沒有規則可用。",
     "effect": "用幾條規則就能長出迷宮、走道或房間配置。"
    },
    {
     "name": "規則分階段",
     "how": "把規則分成數個有順序的組（先長走道、再長房間、再放門），前一組無匹配才進入下一組。",
     "effect": "得到有層級的建築平面生成流程。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "C#",
    "改寫規則",
    "體素",
    "程序化生成"
   ],
   "tools": [
    "C#"
   ],
   "url": "https://github.com/mxgmn/MarkovJunior",
   "image": {
    "file": "img/cases/A05-53.jpg",
    "w": 480,
    "h": 330,
    "source": "GitHub mxgmn/MarkovJunior",
    "author": "Maxim Gumin",
    "license": "MIT",
    "license_url": "https://github.com/mxgmn/MarkovJunior",
    "page": "https://github.com/mxgmn/MarkovJunior",
    "note": "README 動圖（取一格）：ModernHouse 範例與其規則樹"
   }
  },
  {
   "id": "A05-54",
   "algo": "A05",
   "title": "ShapeML：規則式程序化 3D 建模語言",
   "creator": "Stefan Lienhard",
   "year": "",
   "category": "3d-architecture",
   "categories_extra": [
    "modeling"
   ],
   "scale": "建築",
   "summary": "受形狀文法、L-System、CGA／CityEngine 與 G² 啟發的規則式建模框架：文法反覆把粗略的部件替換成更細的構件，附互動預覽程式 ShapeMaker，可即時調整文法參數；範例包含城堡、農舍、威尼斯建築與樹木（部分移植自 Lienhard 等人 2017 年論文）。和基礎範例相比，它的形狀是 3D 量體，規則以分割（split）與替換為主。",
   "variations": [
    {
     "name": "量體分割規則",
     "how": "新增標籤 Facade、Floor、Window：Facade 依樓高切成多個 Floor，Floor 再依開間切成 Window 與 Wall，每種標籤各自一條規則。",
     "effect": "從一個量體逐層長出立面細節。"
    },
    {
     "name": "參數即時調整",
     "how": "把樓高、開間寬、窗比例拉成 Grasshopper 滑桿輸入給規則函式。",
     "effect": "像 ShapeMaker 一樣即時探索同一文法的變化。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "C++",
    "OpenGL",
    "程序化建模",
    "文法"
   ],
   "tools": [
    "ShapeML"
   ],
   "url": "https://github.com/stefalie/shapeml",
   "image": {
    "file": "img/cases/A05-54.jpg",
    "w": 900,
    "h": 601,
    "source": "GitHub stefalie/shapeml",
    "author": "Stefan Lienhard",
    "license": "GPL-3.0",
    "license_url": "https://github.com/stefalie/shapeml",
    "page": "https://github.com/stefalie/shapeml",
    "note": "README showcase：以 ShapeML 文法生成的地形、樹木、城堡、建築等模型"
   }
  },
  {
   "id": "A05-55",
   "algo": "A05",
   "title": "CGAjs：瀏覽器中的 CGA 形狀文法編輯器",
   "creator": "Gunnar Aastrand Grimnes（gromgull）",
   "year": "",
   "category": "3d-architecture",
   "categories_extra": [
    "modeling"
   ],
   "scale": "建築",
   "summary": "以 JavaScript 實作的 CGA Shape Grammar 解析、處理與視覺化工具，用 PEG.js 解析、three.js 顯示：在文字框輸入文法，3D 視窗立即更新，內建 house、church、castle、office building 等範例，支援 split、comp、extrude、taper、隨機規則等。作者自述只實作了 CGA 的一小部分，但很適合用來體驗「文字文法 → 建築量體」。",
   "variations": [
    {
     "name": "comp 拆面",
     "how": "把量體 Brep 拆成頂面與各側面（依法向量分類），分別貼上不同標籤，再各自套規則（頂面生屋頂、側面切窗）。",
     "effect": "對應 CGA 的 comp(f) 操作，量體可以長出不同的屋頂與立面。"
    },
    {
     "name": "隨機規則選擇",
     "how": "同一標籤寫 2–3 條規則並給百分比，用 Random(seed) 選擇。",
     "effect": "同一套文法生成一整排風格一致但各不相同的房子。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "three.js",
    "JavaScript",
    "CGA",
    "互動網頁"
   ],
   "tools": [
    "three.js"
   ],
   "url": "https://gromgull.github.io/cgajs/"
  },
  {
   "id": "A06-01",
   "algo": "A06",
   "title": "WaveFunctionCollapse 原始實作",
   "creator": "Maxim Gumin",
   "year": "2016",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "WFC 的起點：從一張小範例圖產生局部相似的大圖，分成 overlapping model（從像素範例學 N×N 圖樣）與 tiled model（像基礎範例一樣用 tile 相鄰規則）。README 整理了後續遊戲、3D 與研究的延伸。",
   "variations": [
    {
     "name": "改成 overlapping model",
     "how": "把 tile 改成從範例點陣圖切出的 N×N 小圖樣，相鄰規則改為「兩圖樣重疊區完全相同才可相鄰」。",
     "effect": "只要畫一張範例圖就能生成紋理，不必手寫接頭規則"
    },
    {
     "name": "加入 tile 權重與熵",
     "how": "把 FindMostCertainCell 的「候選數最少」改成 Gumin 的 Shannon 熵（依權重計算），挑 tile 時用權重加權。",
     "effect": "頻率與範例一致，常見 tile 多、稀有 tile 少，結果更自然"
    },
    {
     "name": "對稱與旋轉自動展開",
     "how": "只定義一個彎管原型，程式自動旋轉 90° 產生其餘方向並推算接頭，取代手寫四個字串。",
     "effect": "大幅減少規則撰寫量，方便換整組圖樣"
    }
   ],
   "difficulty": 3,
   "tags": [
    "約束滿足",
    "拼貼",
    "影像輸入",
    "隨機"
   ],
   "tools": [
    "C#"
   ],
   "url": "https://github.com/mxgmn/WaveFunctionCollapse"
  },
  {
   "id": "A06-02",
   "algo": "A06",
   "title": "Model Synthesis：從範例模型產生大型 3D 模型",
   "creator": "Paul C. Merrell",
   "year": "2007",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture",
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "WFC 的前身。Merrell 從使用者給的小型 3D 範例模型中推導模組間的相鄰限制，再用約束傳播（AC-3）生成大很多的建築群、橋、管線等模型；並提出分區逐塊修改以降低失敗率。",
   "variations": [
    {
     "name": "分區逐塊求解",
     "how": "把大網格切成數個重疊區塊，一次只對一個區塊跑 TrySolve，失敗只重做該區塊而非整張。",
     "effect": "大尺度網格也能穩定完成，失敗成本小"
    },
    {
     "name": "從 3D 範例學相鄰表",
     "how": "讓學習者在 Rhino 以方塊模組堆一個小範例，程式掃描 6 個方向的相鄰組合建成允許表。",
     "effect": "以範例取代規則撰寫，生成風格一致的大量建築量體"
    }
   ],
   "difficulty": 5,
   "tags": [
    "約束滿足",
    "3D",
    "拼貼"
   ],
   "tools": [
    "C++"
   ],
   "url": "https://paulmerrell.org/model-synthesis/"
  },
  {
   "id": "A06-03",
   "algo": "A06",
   "title": "Bad North 島嶼關卡生成",
   "creator": "Oskar Stålberg（Plausible Concept）",
   "year": "2018",
   "category": "urban-landscape",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "地景",
   "summary": "策略遊戲 Bad North 用 3D WFC 把手工製作的 tile 組拼成小島地景（崖壁、階梯、房屋、沙灘），並加入「每一步都保持可通行」的啟發式選 tile。Stålberg 在 Everything Procedural 2018 講解了整套流程。",
   "variations": [
    {
     "name": "3D 地形 tile",
     "how": "把 A06 擴成 6 方向，tile 包含高低差、坡道、階梯；上下方向接頭區分「地面」「空氣」。",
     "effect": "生成有高低層次、可行走的小型地景"
    },
    {
     "name": "可通行性約束",
     "how": "每次塌縮後用 BFS 檢查已決定區域是否仍連通，若會切斷動線就換一個 tile。",
     "effect": "保證地景中每個平台都能走到"
    },
    {
     "name": "海岸邊界條件",
     "how": "把 OpensToOutside 改成「最外圈只能放水或沙灘 tile」。",
     "effect": "自然形成被海包圍的島嶼輪廓"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "約束滿足",
    "拼貼",
    "鄰居搜尋"
   ],
   "tools": [
    "Unity",
    "C#"
   ],
   "url": "https://www.youtube.com/watch?v=0bcZb-SsnrA"
  },
  {
   "id": "A06-04",
   "algo": "A06",
   "title": "Townscaper：不規則網格上的小鎮玩具",
   "creator": "Oskar Stålberg",
   "year": "2020",
   "category": "art-installation",
   "categories_extra": [
    "modeling",
    "3d-architecture"
   ],
   "scale": "群體／都市",
   "summary": "使用者點一下就長出房子的造鎮玩具。底層把六角網格切成四邊形並擾動成不規則網格，再結合 WFC 與 marching cubes 決定每個角落該放哪種屋頂、牆、拱、樓梯模組，讓任意點擊都能得到合理的建築形。",
   "variations": [
    {
     "name": "不規則四邊形網格",
     "how": "先用六角網格細分並鬆弛出不規則四邊形，WFC 的鄰居改成查四邊形的邊鄰接表，而非 RowStep/ColumnStep。",
     "effect": "擺脫方格感，城鎮看起來有機自然"
    },
    {
     "name": "模組變形貼合",
     "how": "把方形 tile 幾何用雙線性（或 Box Morph）映射到每個不規則四邊形上。",
     "effect": "同一組模組可貼合任何形狀的格子"
    },
    {
     "name": "互動式局部重算",
     "how": "使用者點選格子改變佔據狀態，只把該格與鄰近格重設為全部候選再傳播，而非整張重來。",
     "effect": "即時回應、其餘城鎮保持不變"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "約束滿足",
    "拼貼",
    "等值面"
   ],
   "tools": [
    "Unity"
   ],
   "url": "https://www.gamedeveloper.com/game-platforms/how-townscaper-works-a-story-four-games-in-the-making"
  },
  {
   "id": "A06-05",
   "algo": "A06",
   "title": "無限程序城市（Infinite City）",
   "creator": "Marian Kleineberg（marian42）",
   "year": "2018",
   "category": "urban-landscape",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "群體／都市",
   "summary": "Procjam 2018 作品：玩家在城市中行走時，城市用 3D 方塊模組與帶回溯的 WFC 即時長出來。作者撰文說明如何設定模組接頭、回溯與「邊走邊生成」的線上版 WFC，後續又寫了更快、可決定、可平行化的無限世界版本。",
   "variations": [
    {
     "name": "加入回溯",
     "how": "每次塌縮前存檔，遇到矛盾就退回上一步並排除剛才的選擇，取代整張重來。",
     "effect": "3D 大量模組也能可靠求解"
    },
    {
     "name": "分塊（chunk）逐步生成",
     "how": "只在相機附近的區塊跑 WFC，新區塊以已生成區塊邊緣作為預先塌縮的邊界條件。",
     "effect": "可無限延伸且接縫連續的城市"
    },
    {
     "name": "接頭命名系統",
     "how": "每個模組面以「接頭名稱＋是否對稱／翻轉」描述，程式自動推導相容表。",
     "effect": "幾十種模組的規則也能維護"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "約束滿足",
    "開放生長",
    "拼貼"
   ],
   "tools": [
    "Unity",
    "C#"
   ],
   "url": "https://marian42.de/article/wfc/"
  },
  {
   "id": "A06-06",
   "algo": "A06",
   "title": "Caves of Qud 遺跡地圖生成",
   "creator": "Brian Bucklew（Freehold Games）",
   "year": "2019",
   "category": "2d-pattern",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "建築",
   "summary": "第一個商業使用 WFC 的遊戲。在多階段生成流程的中段用 WFC 補上遺跡、建築平面的細節，並討論過度擬合、單調與連通性問題，以及如何與其他建構式生成方法混用。",
   "variations": [
    {
     "name": "多階段管線",
     "how": "先用 A04 遞迴分割或手寫規則決定大區塊（房間、街道），再只在區塊內部跑 A06 填細部。",
     "effect": "大結構可控、細節豐富，不再整片一樣"
    },
    {
     "name": "範例圖樣庫切換",
     "how": "準備多組範例或 tile 組，依區域屬性（文化、樓層）選用不同組跑 WFC。",
     "effect": "同一張地圖中不同區域有不同風格"
    }
   ],
   "difficulty": 4,
   "tags": [
    "約束滿足",
    "拼貼",
    "多元件"
   ],
   "tools": [
    "C#"
   ],
   "url": "https://gdcvault.com/play/1026263/Math-for-Game-Developers-Tile"
  },
  {
   "id": "A06-07",
   "algo": "A06",
   "title": "Monoceros：Grasshopper 模組化組合外掛",
   "creator": "Ján Tóth、Ján Pernecký（Subdigital）",
   "year": "2021",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "把 WFC 包成 Grasshopper 元件：使用者定義包絡（Envelope）切成 Slot、自訂 Module 與面對面的 Rule，外掛負責把模組填滿空間並保證相鄰合法，用於離散聚合的建築與都市設計。",
   "variations": [
    {
     "name": "用 GH 幾何定義模組與規則",
     "how": "仿 Monoceros 把 A06 的字串 tile 改成從 Rhino 方塊內幾何讀取模組，接頭由使用者在面上標註編號。",
     "effect": "設計者不寫程式也能換整組建築構件"
    },
    {
     "name": "任意包絡的 Slot",
     "how": "用 Brep.IsPointInside 判斷體素中心是否在包絡內，只有內部格子參與 WFC，外部固定為空。",
     "effect": "模組組合貼合任意建築量體外形"
    },
    {
     "name": "指定特定 Slot 的模組",
     "how": "輸入點位清單把入口、樓梯核所在 Slot 預先塌縮成指定模組。",
     "effect": "設計意圖與自動生成並存"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "約束滿足",
    "拼貼",
    "多元件"
   ],
   "tools": [
    "Grasshopper",
    "C#"
   ],
   "url": "https://monoceros.sub.digital/"
  },
  {
   "id": "A06-08",
   "algo": "A06",
   "title": "Subdigital 離散實體化實習",
   "creator": "Subdigital（Ján Pernecký 等）",
   "year": "2020",
   "category": "fabrication",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "Subdigital 2020 年舉辦的暑期實習，以既有數位製造技術探索「資料驅動設計的離散實體化」，並為此開發了後來成為 Monoceros 的工具，讓學習者以 WFC 組合可製造的模組。",
   "variations": [
    {
     "name": "模組即料件",
     "how": "每個 tile 對應一種可切割或列印的實體構件，輸出時統計每種 tile 數量作為料件表。",
     "effect": "生成結果直接變成下料與組裝清單"
    },
    {
     "name": "限制模組種類數",
     "how": "tile 清單刻意精簡到 3–5 種並加權控制比例，檢查是否能在少量模具下完成組合。",
     "effect": "降低製造成本、提高重複性"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "拼貼",
    "約束滿足"
   ],
   "tools": [
    "Grasshopper",
    "Monoceros"
   ],
   "url": ""
  },
  {
   "id": "A06-09",
   "algo": "A06",
   "title": "以編碼建築 tile 組做量體設計（Gameplay with encoded architectural tilesets）",
   "creator": "E. Chasioti",
   "year": "2020",
   "category": "3d-architecture",
   "categories_extra": [
    "modeling"
   ],
   "scale": "建築",
   "summary": "碩士論文提出以 WFC 做建築量體設計的四步驟框架：把建築 tile 幾何編碼成二進位字串，在 Grasshopper 中重新實作兩種不需回溯的 WFC 變體，再把結果解碼回量體。",
   "variations": [
    {
     "name": "二進位面編碼",
     "how": "把每個 3D tile 的六個面各編成一串 0/1（例如 3×3 取樣點是否實心），相容判斷改成比較兩面編碼是否互為鏡像。",
     "effect": "只要建好模組幾何，規則就能自動算出"
    },
    {
     "name": "不回溯的快速版本",
     "how": "沿用 A06 的「失敗整張重來」但縮小網格並多開 seed 平行試算，挑出成功者。",
     "effect": "在 GH 中快速產生大量量體選項供比較"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "約束滿足",
    "拼貼"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://www.academia.edu/44870033/Gameplay_with_encoded_architectural_tilesets_A_computational_framework_for_building_massing_design_using_the_Wave_Function_Collapse_algorithm"
  },
  {
   "id": "A06-10",
   "algo": "A06",
   "title": "WFC 生成社會住宅平面並連結 BIM（IFC）",
   "creator": "",
   "year": "",
   "category": "3d-architecture",
   "categories_extra": [
    "modeling"
   ],
   "scale": "建築",
   "summary": "研究以 WFC 生成社會住宅的房間配置，把 WFC 輸出的整數矩陣解讀為 BIM 結構區塊（IFC 格式）之間的關係，產生符合巴西最大社會住宅計畫最低需求的平面。",
   "variations": [
    {
     "name": "房間類型當 tile",
     "how": "tile 改成客廳、臥室、衛浴、廚房、走廊，接頭表示牆、門、開放邊；再加入每種房間數量上下限的全域檢查。",
     "effect": "自動產生合法的住宅單元平面"
    },
    {
     "name": "輸出成 BIM 物件",
     "how": "把 tileNumbers 整數矩陣對應到牆、門、樓板物件，而非只畫線。",
     "effect": "結果可直接進入 BIM 流程做後續設計"
    }
   ],
   "difficulty": 4,
   "tags": [
    "約束滿足",
    "拼貼"
   ],
   "tools": [],
   "url": "https://link.springer.com/chapter/10.1007/978-3-031-71008-7_28"
  },
  {
   "id": "A06-11",
   "algo": "A06",
   "title": "階層式 WFC 平面生成（HWFC floor plan generation）",
   "creator": "qin2500（GitHub）",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "用階層式 WFC 產生建築平面：從粗略的建築結構開始，經過多層細化一路做到房間內部配置，每一層的結果成為下一層的約束。",
   "variations": [
    {
     "name": "兩層網格",
     "how": "先在粗網格（每格 = 一個房間區）跑 A06 決定房間分區，再把每個粗格細分成 4×4 細網格，細網格邊界由粗格結果預先塌縮。",
     "effect": "大尺度分區合理、細部家具或隔間豐富"
    },
    {
     "name": "平面圖出圖",
     "how": "把細網格結果轉成牆線（接頭為牆的邊畫粗線）、門洞（接頭為門的邊留空）。",
     "effect": "直接得到可讀的平面圖線稿"
    }
   ],
   "difficulty": 4,
   "tags": [
    "約束滿足",
    "拼貼",
    "多元件"
   ],
   "tools": [],
   "url": "https://github.com/qin2500/HWFC_floor_plan_generation"
  },
  {
   "id": "A06-13",
   "algo": "A06",
   "title": "以 WFC 生成與評估鄉村住宅配置",
   "creator": "Yin Zhang、Zhen Xu、Hanlin Li 等",
   "year": "2026",
   "category": "urban-landscape",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "群體／都市",
   "summary": "以 WFC 生成鄉村住宅群的配置，能適應不同基地條件與居住需求，並對生成結果進行評估。",
   "variations": [
    {
     "name": "基地條件當預先約束",
     "how": "輸入河道、既有道路、保留樹曲線，落在其上的格子預先塌縮成對應 tile 再傳播。",
     "effect": "配置自動避開並呼應基地既有元素"
    },
    {
     "name": "生成後評估篩選",
     "how": "每個 seed 跑出結果後計算日照、戶數、道路長度等指標，只保留分數前幾名。",
     "effect": "從大量隨機解中挑出性能較佳的配置"
    }
   ],
   "difficulty": 4,
   "tags": [
    "約束滿足",
    "最佳化",
    "拼貼"
   ],
   "tools": [],
   "url": "https://doi.org/10.1177/14780771251326773"
  },
  {
   "id": "A06-14",
   "algo": "A06",
   "title": "WFC 結合 AR／MR 的不規則原木升級再利用",
   "creator": "Scientific Reports 論文作者群",
   "year": "2025",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "構件",
   "summary": "把原木、樹枝分岔等不規則木材 3D 掃描後，用 WFC 當作數位聚合方法自動排出空間組合，再以有限元素分析檢查結構可行性，並以 AR 輔助組裝，目標是循環設計。",
   "variations": [
    {
     "name": "掃描構件當 tile",
     "how": "每根掃描木料是一個 tile，接頭由端點方向與斷面尺寸分類；每種 tile 設數量上限（庫存）。",
     "effect": "只用現有庫存材料拼出結構"
    },
    {
     "name": "結構評估回饋",
     "how": "WFC 完成後把組合送進 Karamba 等分析，位移超標就換 seed 重算。",
     "effect": "生成結果兼顧可組裝與結構可行"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "約束滿足",
    "最佳化"
   ],
   "tools": [],
   "url": "https://www.nature.com/articles/s41598-025-20398-8"
  },
  {
   "id": "A06-15",
   "algo": "A06",
   "title": "以 WFC 生成材料晶粒方向",
   "creator": "arXiv 論文作者群",
   "year": "2023",
   "category": "performance",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "把 WFC 用在材料科學，生成多晶材料的晶粒方向分布，作為材料微結構與性能模擬的輸入，是 WFC 跨出遊戲與設計的例子。",
   "variations": [
    {
     "name": "tile 帶數值屬性",
     "how": "每個 tile 除了接頭外再帶一個方向角或材料參數，輸出時依數值著色或指定給有限元素網格。",
     "effect": "生成可直接做性能模擬的材料分布圖"
    },
    {
     "name": "相鄰相似度規則",
     "how": "相容判斷從「接頭相等」改成「兩 tile 的角度差小於門檻」。",
     "effect": "形成方向連續、邊界清楚的區塊紋理"
    }
   ],
   "difficulty": 4,
   "tags": [
    "約束滿足",
    "拼貼",
    "物理模擬"
   ],
   "tools": [],
   "url": "https://arxiv.org/pdf/2311.12272"
  },
  {
   "id": "A06-51",
   "algo": "A06",
   "title": "Coding Challenge 171：Wave Function Collapse",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2022",
   "category": "2d-pattern",
   "categories_extra": [],
   "scale": "物件",
   "summary": "分三次直播錄成的 p5.js 挑戰，實作 WFC 的 tiled model：每格保留可能的 tile 清單，挑熵最低的格子塌縮，再依規則刪減鄰居選項；第二天重構成 Tile 類別並由 Tile 物件自動產生規則、換上電路板 tile 組，第三天替邊緣編索引以處理不對稱 tile，並在無解時重來。和基礎範例相同屬 tiled model，但 tile 是圖片、相容性由邊緣編碼比對而得。",
   "variations": [
    {
     "name": "邊緣編碼自動比對",
     "how": "每個 tile 的四邊改存字串（例如 \"ABA\"），兩格相容的條件是一邊字串等於另一邊字串反轉，不再手寫 0/1 開口表。",
     "effect": "新增 tile 時不用重寫規則，tile 組可以更豐富。"
    },
    {
     "name": "自動旋轉產生 tile",
     "how": "寫 Rotate(tile) 把四邊字串循環位移，從少數原始 tile 自動產生 90°、180°、270° 版本並去除重複。",
     "effect": "只畫幾種模組就能得到完整的 tile 組。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "p5.js",
    "約束滿足",
    "拼貼",
    "教學影片"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://thecodingtrain.com/challenges/171-wave-function-collapse",
   "image": {
    "file": "img/cases/A06-51.jpg",
    "w": 900,
    "h": 506,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/171-wave-function-collapse",
    "note": "Coding Challenge 171 縮圖"
   }
  },
  {
   "id": "A06-52",
   "algo": "A06",
   "title": "wavefunctioncollapse：WFC 的 JavaScript 移植",
   "creator": "Kevin Chapelier（kchapelier）",
   "year": "2016",
   "category": "2d-pattern",
   "categories_extra": [],
   "scale": "物件",
   "summary": "mxgmn 原始 WFC 的 JavaScript 移植（npm 套件，MIT 授權），同時提供 OverlappingModel 與 SimpleTiledModel，可設定圖樣大小 N、輸入／輸出是否週期性、對稱數以及 ground 圖樣，並以 iterate() 分步執行。它讓網頁創作者直接把 WFC 當成函式庫使用；與基礎範例的差別在於多了從範例圖學習的 overlapping model。",
   "variations": [
    {
     "name": "Overlapping model",
     "how": "從一張範例格網擷取所有 N×N 小圖樣當 tile，兩圖樣相容的條件是重疊部分相同，其餘流程（塌縮、傳播）不變。",
     "effect": "不用手訂規則，畫一張範例就能生成風格相似的大圖。"
    },
    {
     "name": "分步迭代",
     "how": "把主迴圈改成每次只做 k 次「塌縮＋傳播」，接 Timer 反覆呼叫。",
     "effect": "可以看見網格從不確定逐步被填滿的動畫。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "JavaScript",
    "npm",
    "函式庫"
   ],
   "tools": [
    "JavaScript"
   ],
   "url": "https://github.com/kchapelier/wavefunctioncollapse"
  },
  {
   "id": "A06-53",
   "algo": "A06",
   "title": "Wave：瀏覽器中的互動 WFC tiled model",
   "creator": "Oskar Stålberg",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "Oskar Stålberg 做的互動版 tiled model，以 Unity WebGL 在瀏覽器中執行，mxgmn 的 WFC README 把它列為可直接體驗的互動示範。Stålberg 後來把 WFC 發展到 3D tile、不規則網格與球面上，並用於 Bad North 與 Townscaper。它和基礎範例的差別是「人機互動」：使用者可以指定格子，其餘交給演算法補完。",
   "variations": [
    {
     "name": "使用者預先指定",
     "how": "加一組輸入（格子索引＋tile 編號），在開始前先把這些格子塌縮並傳播，再跑自動流程。",
     "effect": "設計者畫出關鍵位置，演算法自動補齊合法的周邊。"
    },
    {
     "name": "3D tile",
     "how": "把四方向擴充成六方向（上下前後左右），PipeTile 改成六位元開口，網格改為三維索引。",
     "effect": "生成立體管線或模組化建築量體。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Unity",
    "WebGL",
    "互動",
    "約束滿足"
   ],
   "tools": [
    "Unity"
   ],
   "url": "https://oskarstalberg.com/game/wave/wave.html"
  },
  {
   "id": "A06-54",
   "algo": "A06",
   "title": "wfc_houdini：在 Houdini 中實作 WFC（2D Wang tiles、3D 管線、拱橋）",
   "creator": "Chloe Sun",
   "year": "2020",
   "category": "3d-architecture",
   "categories_extra": [
    "modeling"
   ],
   "scale": "構件",
   "summary": "在 Houdini（18.0，Python 2.7）中實作 mxgmn WFC 的 Simple Tiled Model，示範 2D Wang tiles、3D 管線與 3D 拱／橋三種 tile 組，並有 Medium 文章與示範影片。其中 3D 管線範例幾乎就是基礎範例水管 tile 的立體版本，展示 WFC 從平面拼貼走向 3D 內容生成。",
   "variations": [
    {
     "name": "水管升級成 3D",
     "how": "把四方向開口擴成六方向，每個 tile 對應一個彎管／直管／三通的 3D 模組（Block Instance），依格子位置與旋轉放置。",
     "effect": "生成連續不斷的立體管線雕塑或構架。"
    },
    {
     "name": "拱與橋模組",
     "how": "加入有上下關係的 tile（柱、拱、橋面），並限制「拱的上方只能接橋面」等垂直規則。",
     "effect": "得到有結構邏輯的橋梁／拱廊組合。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "Houdini",
    "Python",
    "3D",
    "模組化"
   ],
   "tools": [
    "Houdini"
   ],
   "url": "https://github.com/chloesun/wfc_houdini",
   "image": {
    "file": "img/cases/A06-54.jpg",
    "w": 640,
    "h": 360,
    "source": "GitHub chloesun/wfc_houdini",
    "author": "Chloe Sun",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://github.com/chloesun/wfc_houdini",
    "note": "README 動圖最後一格：Houdini 中以 WFC 生成的 3D 管線"
   }
  },
  {
   "id": "A06-55",
   "algo": "A06",
   "title": "The Wavefunction Collapse Algorithm explained very clearly",
   "creator": "Robert Heaton",
   "year": "2018",
   "category": "2d-pattern",
   "categories_extra": [],
   "scale": "物件",
   "summary": "以終端機文字方塊（陸地 L、海岸 C、海 S）為例，用 Python 一步步說明 WFC：從範例學出相鄰規則與出現權重，以 Shannon 熵挑選最不確定性最低的格子、依權重塌縮、再傳播約束。和基礎範例相比，它多了「從範例統計權重」與「以熵加權挑格」兩項。",
   "variations": [
    {
     "name": "從範例學規則與權重",
     "how": "輸入一張小範例格網，掃描所有相鄰配對建立相容表，並統計每種 tile 出現次數當權重。",
     "effect": "不用手寫規則，而且生成結果的比例會接近範例。"
    },
    {
     "name": "Shannon 熵挑格",
     "how": "把「候選數最少」改成計算 −Σ p log p（p 依權重），挑熵最小的格子，並加一點隨機雜訊打破平手。",
     "effect": "權重懸殊時選格更合理，結果更像範例。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Python",
    "教學文章",
    "約束滿足"
   ],
   "tools": [
    "Python"
   ],
   "url": "https://robertheaton.com/2018/12/17/wavefunction-collapse-algorithm/",
   "image": {
    "file": "img/cases/A06-55.jpg",
    "w": 900,
    "h": 485,
    "source": "robertheaton.com",
    "author": "Robert Heaton",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://robertheaton.com/2018/12/17/wavefunction-collapse-algorithm/",
    "note": "文章預覽圖：終端機中以 L／C／S 字元生成的陸地、海岸、海洋"
   }
  },
  {
   "id": "B01-01",
   "algo": "B01",
   "title": "Differential Line",
   "creator": "Anders Hoff (inconvergent)",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "創作程式碼圈公認的差異生長經典：一條線上的節點互斥、與鄰居相吸，並依規則插入新節點，長成如腸道或珊瑚的密集線條，以黑白細線繪圖呈現。程式碼開源，是本課範例三條規則的原型。",
   "variations": [
    {
     "name": "只讓部分節點生長",
     "how": "給每條邊一個生長機率（例如依索引或隨機），InsertPoints 只在被選中的邊插點。",
     "effect": "生長集中在局部，出現舌狀突出與大小不一的皺褶。"
    },
    {
     "name": "疊加歷代軌跡",
     "how": "每隔幾步把當下曲線以極低透明度畫出並保留，不清除上一代。",
     "effect": "得到有深淺層次、像版畫的生長痕跡圖。"
    },
    {
     "name": "空間索引",
     "how": "以格子雜湊取代兩兩比較的斥力計算。",
     "effect": "點數可以放大十倍以上，細節更綿密。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "開放生長",
    "鄰居搜尋",
    "空間索引"
   ],
   "tools": [
    "Python"
   ],
   "url": "https://github.com/inconvergent/differential-line"
  },
  {
   "id": "B01-02",
   "algo": "B01",
   "title": "Differential Mesh 3D",
   "creator": "Anders Hoff (inconvergent)",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "把差異生長從曲線推廣到 3D 三角網格：頂點具有「生長強度」，強度高的地方移動多、分裂多，網格逐漸捲曲成像地衣或海蛞蝓的皺褶曲面。以半邊資料結構維持網格一致並處理碰撞。",
   "variations": [
    {
     "name": "點列換成半邊網格",
     "how": "把 List<Point3d> 改成網格頂點，鄰居吸引改用拓撲相鄰頂點，插點改成 split edge 並重新三角化。",
     "effect": "由一片平面長出 3D 波浪曲面。"
    },
    {
     "name": "生長強度場",
     "how": "每個頂點帶一個 growth 值（可由距離中心、吸引子或噪聲決定），只有 growth 高的邊才允許分裂。",
     "effect": "可控制哪裡起皺、哪裡保持平坦。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "物理模擬",
    "空間索引",
    "開放生長"
   ],
   "tools": [
    "Python",
    "Cython"
   ],
   "url": "https://inconvergent.net/generative/differential-mesh-3d/"
  },
  {
   "id": "B01-03",
   "algo": "B01",
   "title": "Floraform 3D 列印珠寶系列",
   "creator": "Nervous System",
   "year": "2015",
   "category": "fabrication",
   "categories_extra": [
    "modeling"
   ],
   "scale": "物件",
   "summary": "受雞冠花與 Mahadevan 百合開花力學論文啟發，模擬一片「邊緣長得比中心快」的彈性曲面，長出花瓣般的荷葉邊，再 3D 列印成項圈、耳環等首飾。設計者稱之為「數位園藝」。",
   "variations": [
    {
     "name": "邊緣優先生長",
     "how": "插點門檻隨點到中心的距離變小（越外圍 maxEdgeLength 越短），曲線版可先試做。",
     "effect": "外緣越長越皺，形成荷葉邊或花瓣。"
    },
    {
     "name": "加上彈性曲面的彎曲剛度",
     "how": "在網格版中加入相鄰面角度的平滑力（類比 attractStrength），控制皺褶波長。",
     "effect": "剛度高得到大波浪，剛度低得到細碎皺褶。"
    },
    {
     "name": "加厚後列印",
     "how": "最終網格以法向偏移做出厚度並封口，再檢查自交。",
     "effect": "得到可 3D 列印的尼龍或金屬飾品。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "物理模擬",
    "開放生長"
   ],
   "tools": [
    "自製模擬軟體",
    "3D 列印"
   ],
   "url": "https://n-e-r-v-o-u-s.com/blog/?p=6721"
  },
  {
   "id": "B01-04",
   "algo": "B01",
   "title": "Floraform 吊燈",
   "creator": "Nervous System",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "以 Floraform 差異生長系統生成的 3D 列印尼龍吊燈，曾在 2017 年阿斯塔納世博會展出，並於丹佛美術館的自然與設計展中呈現；光線穿過皺褶曲面投下複雜陰影。",
   "variations": [
    {
     "name": "由生長歷程做燈罩層",
     "how": "記錄每一代的生長曲線，依步數賦予高度並 Loft，或每代轉成一片薄殼。",
     "effect": "燈罩呈現由內而外長出的層次。"
    },
    {
     "name": "開口控制光線",
     "how": "在曲線或網格密度低的地方挖孔，用吸引子控制孔的位置。",
     "effect": "光影分布可被設計，不再只是均勻透光。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "開放生長",
    "物理模擬"
   ],
   "tools": [
    "自製模擬軟體",
    "3D 列印"
   ],
   "url": "https://n-e-r-v-o-u-s.com/projects/sets/floraform"
  },
  {
   "id": "B01-05",
   "algo": "B01",
   "title": "2D Differential Growth Experiments",
   "creator": "Jason Webb",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以 JavaScript 做的一系列 2D 差異生長實驗，將規則拆成鄰居吸引、曲率平滑、互斥、插點與不對稱生長五條，並展示邊界約束、SVG 輸入形狀等變化，可輸出成向量圖給繪圖機。",
   "variations": [
    {
     "name": "SVG 形狀當起點與邊界",
     "how": "在 GH 以 Curve 輸入取代起始圓（Divide Curve 取點），另一條 Curve 當邊界並把越界點拉回。",
     "effect": "文字、Logo 或平面輪廓會長成有機的填滿圖樣。"
    },
    {
     "name": "分離曲率平滑與鄰居吸引",
     "how": "把 AddAttractMoves 拆成「靠近鄰居」與「往中點對齊」兩個力，各自一個強度參數。",
     "effect": "可以獨立調整曲線粗細感與平滑度。"
    },
    {
     "name": "輸出繪圖機路徑",
     "how": "輸出最終 Polyline 並依需要 Offset 成雙線，匯出 SVG/DXF。",
     "effect": "可直接用筆式繪圖機或雷射雕刻。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "開放生長",
    "鄰居搜尋",
    "空間索引"
   ],
   "tools": [
    "JavaScript"
   ],
   "url": "https://github.com/jasonwebb/2d-differential-growth-experiments"
  },
  {
   "id": "B01-06",
   "algo": "B01",
   "title": "Organic Labyrinths and Mazes",
   "creator": "Hans Køhling Pedersen, Karan Singh",
   "year": "2006",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "NPAR 2006 論文：以動態曲線模擬生成有機迷宮，曲線演化參數由貼圖在空間中變化控制；可用邊界曲線阻擋穿越，後期再放鬆邊界，讓迷宮線條自然填滿一幅畫的構圖。",
   "variations": [
    {
     "name": "貼圖控制參數",
     "how": "讀入灰階圖，依點位置取亮度映射成 repelRadius，讓不同區域的迷宮走道寬度不同。",
     "effect": "迷宮本身就成為一張圖像。"
    },
    {
     "name": "漸弱的邊界",
     "how": "加入邊界曲線作為斥力源，並讓其強度隨 step 線性遞減到 0。",
     "effect": "先依輪廓分區生長，最後邊界消失、線條融成一體。"
    },
    {
     "name": "切斷成可解迷宮",
     "how": "生長完成後在曲線上選兩處打斷作為入口出口。",
     "effect": "把純圖樣轉成可走的迷宮平面，可做地坪或景觀迷宮。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "影像輸入",
    "約束滿足",
    "開放生長"
   ],
   "tools": [],
   "url": "https://www.dgp.toronto.edu/~karan/pdf/mazes.pdf"
  },
  {
   "id": "B01-07",
   "algo": "B01",
   "title": "Deep Facade：3D 列印砂模鑄造的客製鋁立面",
   "creator": "Aghaei Meibodi 等（ETH Zurich MAS DFAB 17-18）",
   "year": "2019",
   "category": "3d-architecture",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "立面／表皮",
   "summary": "研究以黏結劑噴射 3D 列印砂模鑄造客製鋁製立面構件，並用差異生長演算法把鑄造限制（壁厚、脫模、金屬流動）整合進造形生成，最後與學習者實作一道實驗性的自由形立面屏風。",
   "variations": [
    {
     "name": "製造限制轉成生長參數",
     "how": "把最小壁厚對應到 repelRadius、最大懸臂或流道長度對應到 maxEdgeLength，並設定點數上限控制重量。",
     "effect": "長出來的形態天生就能被鑄造。"
    },
    {
     "name": "構件邊界約束",
     "how": "每塊立面板給一條矩形邊界，並固定邊界上的連接點不讓其移動。",
     "effect": "各板生長紋理不同，但邊緣可以互相接合。"
    },
    {
     "name": "曲線轉厚度",
     "how": "將生長曲線 Pipe 或 Extrude 後與背板布林聯集。",
     "effect": "得到具有深度、光影強烈的立面構件。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "約束滿足",
    "開放生長",
    "3D"
   ],
   "tools": [
    "Grasshopper",
    "3D 列印砂模",
    "鋁鑄造"
   ],
   "url": "https://papers.cumincad.org/data/works/att/acadia19_100.pdf"
  },
  {
   "id": "B01-08",
   "algo": "B01",
   "title": "大尺度珊瑚仿生模組的積層製造工作流程",
   "creator": "Construction Robotics 期刊論文作者群",
   "year": "2025",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "構件",
   "summary": "以 Grasshopper 建立從造形到大尺度積層製造（LSAM）的流程，生成珊瑚形態的模組；其中「Toadstool Coral」等圖樣以會擴張、延展曲線的生長演算法產生，並對應人工珊瑚礁棲地的需求。",
   "variations": [
    {
     "name": "逐層生長對應列印層",
     "how": "每 N 步記錄曲線並賦予 z = 層高 × 代數，直接當成列印路徑。",
     "effect": "一條連續的生長曲線就是可列印的層層刀路。"
    },
    {
     "name": "限制懸臂",
     "how": "限制每一代曲線相對前一代的水平位移上限（例如把 moves 長度夾在層高 × tan45° 內）。",
     "effect": "形態仍然有機，但不需支撐即可列印。"
    },
    {
     "name": "表面積最大化",
     "how": "以曲線總長或曲面面積作為指標，比較不同 repelRadius 的結果。",
     "effect": "找出最多棲地表面積、仍可製造的參數組合。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "開放生長",
    "最佳化"
   ],
   "tools": [
    "Grasshopper",
    "Rhino",
    "大尺度積層製造"
   ],
   "url": "https://link.springer.com/article/10.1007/s41693-025-00150-4"
  },
  {
   "id": "B01-09",
   "algo": "B01",
   "title": "Cellular Forms",
   "creator": "Andy Lomas",
   "year": "2014",
   "category": "art-installation",
   "categories_extra": [
    "modeling"
   ],
   "scale": "物件",
   "summary": "以細胞生長模擬創作的雕塑形態系列：細胞之間有力的規則，細胞累積養分超過門檻就分裂並與鄰居重新連接，長出像植物、珊瑚、內臟的複雜形。與差異生長同屬「受限空間中持續增加元素而起皺」的邏輯。",
   "variations": [
    {
     "name": "養分門檻取代邊長門檻",
     "how": "每個點帶一個 nutrient 值，每步依光照方向或位置累積，超過門檻才在它與鄰居之間插點。",
     "effect": "生長位置由環境決定，形態出現向光、分枝等偏好。"
    },
    {
     "name": "升為 3D 點雲網格",
     "how": "改用網格頂點並加入到平均平面的平面化力。",
     "effect": "由球體長出多褶層的 3D 有機體。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "物理模擬",
    "開放生長"
   ],
   "tools": [
    "自製模擬軟體",
    "GPU"
   ],
   "url": "https://andylomas.com/cellularForms.html"
  },
  {
   "id": "B01-10",
   "algo": "B01",
   "title": "Kangaroo 在網格曲面上做差異生長",
   "creator": "",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "立面／表皮",
   "summary": "Grasshopper 教學影片：把起始曲線投影到任意網格曲面，再用 Kangaroo 模擬讓曲線在曲面上差異生長，得到貼合曲面的皺褶紋路。示範了不用自寫程式碼也能在曲面上生長的做法。",
   "variations": [
    {
     "name": "C# 版曲面投影",
     "how": "在範例每步位移後加 mesh.ClosestPoint(point) 把點拉回曲面。",
     "effect": "不依賴外掛即可在曲面上生長，可與其他 C# 規則整合。"
    },
    {
     "name": "換成 Kangaroo Goal",
     "how": "把互斥改為 SphereCollide、鄰居吸引改為 Length 或 Smooth、曲面約束改為 OnMesh，自己只負責插點。",
     "effect": "解算更穩定，可與其他形態尋找目標混用。"
    },
    {
     "name": "紋路轉浮雕",
     "how": "把曲面上的生長曲線沿法向做 Pipe 或 Sweep，再與原曲面布林。",
     "effect": "得到可 CNC 或 3D 列印的浮雕立面板。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "曲面上",
    "物理模擬",
    "3D"
   ],
   "tools": [
    "Grasshopper",
    "Kangaroo"
   ],
   "url": "https://www.youtube.com/watch?v=CVM-hk-p0C0"
  },
  {
   "id": "B01-11",
   "algo": "B01",
   "title": "Differential Line Growth／Differential Mesh Growth（Houdini 教學）",
   "creator": "Entagma",
   "year": "2016",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Houdini 教學網站 Entagma 的差異生長系列：先做線的差異生長，並用噪聲場傳值控制生長；接著推廣到網格差異生長，強調可藝術指導的控制方式。",
   "variations": [
    {
     "name": "噪聲場控制生長",
     "how": "以 C04 的噪聲值乘上每條邊的 maxEdgeLength，讓不同位置插點速度不同。",
     "effect": "皺褶疏密呈現連續的大尺度變化。"
    },
    {
     "name": "逐幀輸出做動畫",
     "how": "每步輸出一條曲線到 DataTree，在 Rhino 中依序顯示或匯出成序列。",
     "effect": "得到曲線生長的動畫素材。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "動畫",
    "開放生長",
    "3D"
   ],
   "tools": [
    "Houdini"
   ],
   "url": "https://entagma.com/differential-line-growth"
  },
  {
   "id": "B01-12",
   "algo": "B01",
   "title": "Interactive Differential Growth Simulation for Design",
   "creator": "Emilie Yu 等",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "研究如何讓設計者以互動方式引導差異生長模擬，把原本難以預測的生長過程轉成可操控的設計工具，是「如何控制差異生長」這個問題的學術回應。",
   "variations": [
    {
     "name": "筆刷控制生長區域",
     "how": "在 Rhino 中畫幾條控制曲線當輸入，距離這些曲線近的邊才允許插點。",
     "effect": "設計者用「畫」的方式決定哪裡起皺。"
    },
    {
     "name": "可暫停與續跑",
     "how": "把點列存成欄位，加 run / reset 布林輸入，可隨時調參後繼續長。",
     "effect": "邊長邊調，像在修剪植物。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "吸引子控制",
    "動畫",
    "3D"
   ],
   "tools": [],
   "url": "https://em-yu.github.io/media/papers/interactive-diff-growth.pdf"
  },
  {
   "id": "B01-13",
   "algo": "B01",
   "title": "Cabbage：開放曲面的差異生長框架",
   "creator": "",
   "year": "2025",
   "category": "modeling",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "arXiv 上的研究論文，提出針對「開放曲面」（有自由邊界的曲面，例如葉片、花瓣）的差異生長框架，處理邊界生長與曲面彎曲，可視為 Floraform 類型形態的開源研究延伸。",
   "variations": [
    {
     "name": "開放邊界的曲線版練習",
     "how": "先把範例改成開放曲線、兩端固定，只讓中段生長，觀察端點約束對形態的影響。",
     "effect": "理解開放曲面「邊界自由、內部受限」的起皺機制。"
    },
    {
     "name": "邊緣長得比內部快",
     "how": "網格版中依頂點到邊界的拓撲距離設定生長速率，越靠邊界越快。",
     "effect": "長出高麗菜葉或羽衣甘藍般的波浪邊。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "物理模擬",
    "開放生長"
   ],
   "tools": [],
   "url": "https://arxiv.org/pdf/2504.18040"
  },
  {
   "id": "B01-51",
   "algo": "B01",
   "title": "Differential Line（差異線）",
   "creator": "Anders Hoff（Inconvergent）",
   "year": "2015",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Anders Hoff 以一條由節點串成的閉合線為起點，隨機在相鄰節點之間插入新節點，讓每個節點在「靠近鄰居、遠離其他節點」之間反覆調整位置，長出類似紅高麗菜切面、腸道般的皺褶。原始碼以 Python 撰寫並公開於 GitHub（MIT 授權）。和 Grasshopper C# 基礎範例相比，它更強調大量節點下的長時間生長與黑白細線的繪圖質感。",
   "variations": [
    {
     "name": "隨機插入點 vs. 均勻插入",
     "how": "把每回合固定在最長邊插點，改成依機率隨機挑選相鄰節點對插入新節點",
     "effect": "生長不對稱，皺褶疏密不均，更接近自然組織"
    },
    {
     "name": "累積軌跡繪圖",
     "how": "每一回合不清除畫面，而以極淡的線把當前曲線疊加繪製",
     "effect": "得到有年輪般層次的灰階圖，記錄整個生長過程"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Python",
    "生成藝術",
    "開源"
   ],
   "tools": [
    "Python"
   ],
   "url": "https://inconvergent.net/generative/differential-line/",
   "image": {
    "file": "img/cases/B01-51.jpg",
    "w": 800,
    "h": 800,
    "source": "inconvergent.net",
    "author": "Anders Hoff",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://inconvergent.net/generative/differential-line/",
    "note": "差異線生長後形成的密集皺褶黑白線圖"
   }
  },
  {
   "id": "B01-52",
   "algo": "B01",
   "title": "2D Differential Growth Experiments（2D 差異生長實驗）",
   "creator": "Jason Webb",
   "year": "2018",
   "category": "drawing",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "Jason Webb 以 JavaScript 在瀏覽器中實作一系列差異生長實驗，節點遵守吸引、對齊、排斥與超距分裂等規則，可從圓形、SVG 圖形或文字開始長出皺褶曲線。作者明確以數位製造為目標，輸出以向量線與 SVG 匯出為主。相較於基礎範例，它多了邊界約束、SVG 輸入與互動參數面板。",
   "variations": [
    {
     "name": "SVG 形狀作為邊界",
     "how": "把外框曲線當作不可穿越的邊界，節點越界時推回內部",
     "effect": "皺褶被限制在指定輪廓裡，適合做成填滿圖樣或雷射切割圖"
    },
    {
     "name": "以文字或圖形作為起始路徑",
     "how": "把初始的圓換成字型或 SVG 路徑的取樣點",
     "effect": "從可辨識的形狀逐漸長成有機紋理"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "JavaScript",
    "SVG",
    "數位製造",
    "互動"
   ],
   "tools": [
    "JavaScript"
   ],
   "url": "https://github.com/jasonwebb/2d-differential-growth-experiments",
   "image": {
    "file": "img/cases/B01-52.jpg",
    "w": 900,
    "h": 440,
    "source": "GitHub Pages（jasonwebb）",
    "author": "Jason Webb",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://jasonwebb.github.io/2d-differential-growth-experiments/",
    "note": "專案社群預覽圖，差異生長曲線"
   }
  },
  {
   "id": "B01-53",
   "algo": "B01",
   "title": "Floraform",
   "creator": "Nervous System",
   "year": "2015",
   "category": "fabrication",
   "categories_extra": [
    "3d-architecture",
    "modeling"
   ],
   "scale": "物件",
   "summary": "Nervous System 從雞冠花出發，建立一套「薄殼彈性曲面的差異生長」模擬：三角網格以 half-edge 結構表示，每步計算頂點受力並依生長速率擴張邊長，邊緣長得快就產生皺摺。成果以 3D 列印製成雕塑與首飾，工作室表示所用軟體皆為自行撰寫。它把基礎範例的 2D 曲線生長擴展為 3D 曲面生長。",
   "variations": [
    {
     "name": "由線到面",
     "how": "把節點串成的曲線換成三角網格，邊長超過門檻就細分三角形，並加入彎曲剛性",
     "effect": "得到會起伏、捲曲的 3D 皺摺曲面"
    },
    {
     "name": "空間分布的生長速率",
     "how": "讓生長速率隨與邊緣距離變化，邊緣長得比中心快",
     "effect": "形成花瓣或雞冠花般的波浪狀邊緣"
    }
   ],
   "difficulty": 5,
   "tags": [
    "creative coding",
    "3D 列印",
    "網格",
    "模擬",
    "自製軟體"
   ],
   "tools": [
    "自製模擬軟體"
   ],
   "url": "https://n-e-r-v-o-u-s.com/projects/sets/floraform/",
   "image": {
    "file": "img/cases/B01-53.jpg",
    "w": 900,
    "h": 596,
    "source": "Nervous System",
    "author": "Nervous System",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://n-e-r-v-o-u-s.com/projects/sets/floraform/",
    "note": "Floraform 差異生長曲面測試圖"
   }
  },
  {
   "id": "B01-54",
   "algo": "B01",
   "title": "Differential line growth with Processing（Processing 差異線生長教學）",
   "creator": "Alberto Giachino（CodePlastic）",
   "year": "2017",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "CodePlastic 的教學文章以 Processing 實作差異線生長，作者指出其行為與鳥群（flocking）相似，因此直接以 Daniel Shiffman 的 Flocking 範例為基礎，把分離與凝聚力改寫成節點規則。文章提供完整程式碼並示範如何改變參數與生長方式。和基礎範例相比，它用 Boids 的轉向力框架來組織程式。",
   "variations": [
    {
     "name": "以雜訊調變節點參數",
     "how": "新增節點時用 noise(i) 乘上 maxForce 等參數，讓每個節點的力不同",
     "effect": "曲線各段的皺褶尺度不同，更有變化"
    },
    {
     "name": "調整分離／凝聚比例",
     "how": "改變 separationCohesionRation 參數",
     "effect": "比例高時線條鬆散，比例低時皺褶緊密"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "Processing",
    "教學",
    "Boids"
   ],
   "tools": [
    "Processing"
   ],
   "url": "http://www.codeplastic.com/2017/07/22/differential-line-growth-with-processing/",
   "image": {
    "file": "img/cases/B01-54.jpg",
    "w": 370,
    "h": 264,
    "source": "CodePlastic",
    "author": "Alberto Giachino",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "http://www.codeplastic.com/2017/07/22/differential-line-growth-with-processing/",
    "note": "Processing 差異線生長的迷宮狀曲線"
   }
  },
  {
   "id": "B01-55",
   "algo": "B01",
   "title": "Differential Line Growth（Houdini 差異線生長）",
   "creator": "Moritz Schwind（Entagma）",
   "year": "2016",
   "category": "modeling",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "Entagma 的 Houdini 教學以 Point Relax SOP 為核心做出簡化版差異線生長，並用雜訊場傳遞數值來控制各處的生長量。把一個幾何體接進 Relax SOP 的第二個輸入，就能讓曲線貼著曲面生長。相較於基礎範例手寫受力迴圈，它用 Houdini 的現成節點組合出相同行為並直接算圖。",
   "variations": [
    {
     "name": "雜訊場控制生長",
     "how": "以 3D noise 產生每點的生長權重，只在權重高的區段插入新點",
     "effect": "局部密集生長，形成疏密對比"
    },
    {
     "name": "在曲面上生長",
     "how": "把目標曲面當作鬆弛運算的約束，點每回合投影回曲面",
     "effect": "皺褶曲線包覆在任意 3D 形體表面"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Houdini",
    "教學",
    "3D"
   ],
   "tools": [
    "Houdini"
   ],
   "url": "http://www.entagma.com/differential-line-growth/",
   "image": {
    "file": "img/cases/B01-55.jpg",
    "w": 900,
    "h": 506,
    "source": "Entagma",
    "author": "Moritz Schwind",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "http://www.entagma.com/differential-line-growth/",
    "note": "Houdini 差異線生長算圖"
   }
  },
  {
   "id": "B02-01",
   "algo": "B02",
   "title": "Aggregation 系列",
   "creator": "Andy Lomas",
   "year": "2005",
   "category": "art-installation",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "數學家兼視覺特效藝術家 Andy Lomas 以 DLA 變體模擬數百萬顆粒子在力場中流動並沉積在初始種子曲面上，長出類似珊瑚與植物的雕塑形態，並於 SIGGRAPH 2005 發表「Aggregation: Complexity out of Simplicity」。DLA 是整個形態的生成核心。",
   "variations": [
    {
     "name": "種子曲面取代種子點",
     "how": "INIT 時把一個 Mesh 或曲面的頂點全部加入 stuckPoints，粒子從外圍球殼出發。",
     "effect": "結構從整個表面向外長出，得到覆滿表面的珊瑚質感。"
    },
    {
     "name": "力場中的流動",
     "how": "隨機走每一步加上力場向量（例如向下沉降或繞軸旋轉），取代純布朗運動。",
     "effect": "群集沿流動方向拉長、產生方向性層次。"
    },
    {
     "name": "3D 高密度渲染",
     "how": "升到 3D 並大幅提高粒子數，輸出點雲給 Rhino 渲染或用點大小表現深度。",
     "effect": "得到極細緻的白色雕塑影像。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "物理模擬",
    "開放生長",
    "空間索引"
   ],
   "tools": [
    "自製軟體"
   ],
   "url": "https://andylomas.com/aggregation.html"
  },
  {
   "id": "B02-02",
   "algo": "B02",
   "title": "2D Diffusion-Limited Aggregation Experiments",
   "creator": "Jason Webb",
   "year": "2019",
   "category": "drawing",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "Jason Webb 以 JavaScript 做了一系列 DLA 視覺實驗：基本 DLA、方向偏移、不同粒子大小、不同形狀、以 SVG 形狀作為邊界或種子，並著重輸出可供數位製造的向量 SVG。示範了同一演算法換輸入與約束後的多樣性。",
   "variations": [
    {
     "name": "方向偏移",
     "how": "每一步位移加上固定 bias 向量，出發位置改到對側邊界。",
     "effect": "群集朝單一方向長，像冰柱或往光生長的植物。"
    },
    {
     "name": "SVG 形狀當邊界",
     "how": "新增 Curve 輸入，出界的粒子重生；種子放在曲線上。",
     "effect": "枝條被限制在字形或圖形內生長。"
    },
    {
     "name": "粒子大小漸變",
     "how": "stickDistance 依離中心距離遞減，NearbyPointFinder 格子取最大值。",
     "effect": "根部粗、枝梢細，視覺層次更自然。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "隨機",
    "開放生長",
    "空間索引"
   ],
   "tools": [
    "JavaScript"
   ],
   "url": "https://github.com/jasonwebb/2d-diffusion-limited-aggregation-experiments"
  },
  {
   "id": "B02-03",
   "algo": "B02",
   "title": "Coding Challenge #34：Diffusion-Limited Aggregation",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2016",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "The Coding Train 以 p5.js 現場寫出 DLA：隨機行走者圍繞中心種子聚集成樹枝狀圖樣，是最常被引用的入門教學之一，另有雪花（Brownian Tree Snowflake）延伸。適合對照本課 C# 版本理解相同邏輯。",
   "variations": [
    {
     "name": "六重對稱雪花",
     "how": "每顆黏住的點同時複製旋轉 60° 的 6 份並鏡射，只在一個 30° 扇形內模擬。",
     "effect": "得到對稱的雪花結晶。"
    },
    {
     "name": "依生長順序上色",
     "how": "輸出黏住順序 index，在 GH 用 Gradient 依序上色。",
     "effect": "看出由內而外的生長時間層。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "對稱",
    "隨機",
    "動畫"
   ],
   "tools": [
    "p5.js",
    "Processing"
   ],
   "url": "https://thecodingtrain.com/challenges/34-diffusion-limited-aggregation/"
  },
  {
   "id": "B02-04",
   "algo": "B02",
   "title": "Urban Growth and Form：以 DLA 模擬都市擴張",
   "creator": "Michael Batty, Paul Longley, Stewart Fotheringham",
   "year": "1989",
   "category": "urban-landscape",
   "categories_extra": [],
   "scale": "群體／都市",
   "summary": "Batty 等人把 DLA 用來解釋都市形態：人口像粒子從外圍移入，碰到已開發區就定居，模擬出具負密度梯度與碎形維度的都市，與真實城市形態相似，是後來《Fractal Cities》研究的基礎。",
   "variations": [
    {
     "name": "黏著機率 = 可開發度",
     "how": "黏著機率由土地可開發度（坡度、水域）網格查表決定。",
     "effect": "都市避開山坡與河川，沿平原延伸。"
    },
    {
     "name": "多中心",
     "how": "INIT 放多個城鎮中心作為種子。",
     "effect": "多個聚落擴張後相連，形成都會區。"
    },
    {
     "name": "碎形維度量測",
     "how": "輸出後用盒計數法統計不同格子大小下的佔用格數並取 log 斜率。",
     "effect": "量化比較模擬與真實城市。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "隨機",
    "開放生長",
    "分形"
   ],
   "tools": [],
   "url": "https://discovery.ucl.ac.uk/10053169/"
  },
  {
   "id": "B02-05",
   "algo": "B02",
   "title": "Modeling Urban Morphology by Unifying DLA and Stochastic Gravitation",
   "creator": "",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "performance"
   ],
   "scale": "群體／都市",
   "summary": "發表於 Findings 期刊的研究，將 DLA 與隨機重力模型結合來模擬都市形態，讓遠方中心的吸引力影響粒子行走，補足純 DLA 只有單一中心的限制。",
   "variations": [
    {
     "name": "重力漂移",
     "how": "隨機走每一步加上朝各中心的吸引向量，大小與中心規模成正比、與距離平方成反比。",
     "effect": "粒子往大城市集中，枝條形態較緊密。"
    },
    {
     "name": "參數掃描比較",
     "how": "以不同重力強度批次執行，輸出碎形維度與半徑。",
     "effect": "看出從樹枝狀到緊密團塊的連續變化。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "吸引子控制",
    "隨機"
   ],
   "tools": [],
   "url": "https://findingspress.org/article/22296-modeling-urban-morphology-by-unifying-diffusion-limited-aggregation-and-stochastic-gravitation"
  },
  {
   "id": "B02-06",
   "algo": "B02",
   "title": "IaaC MRAC Diffusion-Limited Aggregation 亭",
   "creator": "Abdullah Sheikh, Andreea Bunica, Anna Batalle Garcia（IaaC MRAC，指導 Alessio Erioli, Eugenio Bettucchi）",
   "year": "",
   "category": "3d-architecture",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "IaaC 機器人與先進營造碩士的研究，在 Grasshopper 中以 DLA 生成亭子結構：先在 2D 測試種子數、黏著距離、吸引子與邊界，再到 3D 引入點電荷、旋轉力、曲線吸引子等場，最後寫後處理讓節點與接頭可建造。結論是需選擇易於合理化的生長方式。",
   "variations": [
    {
     "name": "曲線吸引子場",
     "how": "隨機走加上朝輸入曲線最近點的漂移（Curve.ClosestPoint）。",
     "effect": "枝條沿設計曲線生長，形成拱或樑。"
    },
    {
     "name": "後處理加連接",
     "how": "生成後對距離小於 d 且不同枝的點補上連線，變成網狀圖。",
     "effect": "從樹變成有迴路的網，結構更穩定。"
    },
    {
     "name": "節點合理化",
     "how": "統一枝段長度（本範例已做）並把分岔角度吸附到有限種類。",
     "effect": "接頭種類減少，便於製造。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "吸引子控制",
    "多元件"
   ],
   "tools": [
    "Grasshopper",
    "Kangaroo2",
    "Anemone",
    "Galapagos"
   ],
   "url": "https://github.com/MRAC-IAAC/Diffusion-Limited-Aggregation"
  },
  {
   "id": "B02-07",
   "algo": "B02",
   "title": "Paul Bourke 的 3D DLA 與約束生長",
   "creator": "Paul Bourke",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "modeling",
    "art-installation"
   ],
   "scale": "物件",
   "summary": "Paul Bourke 長期整理 DLA：3D 體素 DLA（26 方向）、黏著機率從 1 到 0.01 的形態差異、在盒子、圓柱、球、頭像等形體內生長，並有處理成 3D 列印模型的流程，以及與藝術家合作的容器、雕塑作品。",
   "variations": [
    {
     "name": "黏著機率掃描",
     "how": "加入 stickiness 輸入，以 1、0.2、0.05、0.01 各跑一次並排比較。",
     "effect": "從細碎到毛茸茸、密實的結構。"
    },
    {
     "name": "在量體內生長",
     "how": "每步檢查 Brep.IsPointInside，出界就退回。",
     "effect": "DLA 填滿任意形體，如杯子、頭像。"
    },
    {
     "name": "點／線／面吸引子",
     "how": "種子改成點、直線或矩形面上的一組點。",
     "effect": "得到放射狀、梳狀或森林狀的不同整體形態。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "網格擴散",
    "隨機"
   ],
   "tools": [
    "自製軟體"
   ],
   "url": "https://paulbourke.net/fractals/dla/"
  },
  {
   "id": "B02-08",
   "algo": "B02",
   "title": "VEX in Houdini：Diffusion Limited Aggregation",
   "creator": "Entagma",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Entagma 的教學示範在 Houdini 以 VEX 寫 DLA，並用 Mantra 與 Redshift 渲染。呈現 DLA 在影視與動態設計建模流程中的用法，可與本課 C# 實作互相對照。",
   "variations": [
    {
     "name": "轉成網格體積",
     "how": "輸出線段後以 Mesh Pipe 或體素化（VDB 概念）加厚。",
     "effect": "得到可渲染、可列印的實體。"
    },
    {
     "name": "依生長時間上材質",
     "how": "記錄黏住順序作為屬性，渲染時映射成發光強度。",
     "effect": "生長路徑以光呈現，適合動態影像。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "動畫"
   ],
   "tools": [
    "Houdini",
    "VEX"
   ],
   "url": "https://entagma.com/vex-in-houdini-diffusion-limited-aggregation-plus-rendering-in-mantra-redshift/"
  },
  {
   "id": "B02-09",
   "algo": "B02",
   "title": "Exploring Diffusion Limited Aggregation in Geometry Nodes",
   "creator": "Blender Artists 社群作者",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "Blender 使用者以 Geometry Nodes 的節點式模擬實作 DLA 並分享成果，顯示 DLA 不一定要寫程式，也能在節點環境中以模擬迴圈完成。",
   "variations": [
    {
     "name": "節點與程式對照",
     "how": "把本範例拆成 GH 原生元件＋Anemone 迴圈版本，與 C# 版比較速度。",
     "effect": "理解空間索引在節點環境中的效能瓶頸。"
    },
    {
     "name": "表面生長",
     "how": "種子放在 Mesh 頂點，粒子從 Mesh 外殼出發。",
     "effect": "物件表面長出苔蘚狀覆蓋物。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "曲面上"
   ],
   "tools": [
    "Blender"
   ],
   "url": "https://blenderartists.org/t/exploring-diffusion-limited-aggregation-in-geometry-nodes/1589322"
  },
  {
   "id": "B02-10",
   "algo": "B02",
   "title": "Lichtenberg 圖形與介電崩潰模型",
   "creator": "自然現象（DBM：Niemeyer, Pietronero, Wiesmann）",
   "year": "1984",
   "category": "performance",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "高壓放電在壓克力或木材中留下的 Lichtenberg 圖形、閃電分枝，其形態與 DLA 相關；1984 年提出的介電崩潰模型（DBM）把電場與 DLA 結合來描述這類放電。可作為閃電紋表皮或木作燒紋設計的依據。",
   "variations": [
    {
     "name": "DBM 電場版",
     "how": "在網格上以疊代求解電位（Laplace），黏著位置依電場強度的 η 次方機率挑選。",
     "effect": "η 大時得到細長閃電、η 小時接近緊密團塊。"
    },
    {
     "name": "雙極生長",
     "how": "放兩個種子（正負極），限制只能長向對方。",
     "effect": "形成連接兩點的放電路徑。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "網格擴散",
    "物理模擬",
    "分形"
   ],
   "tools": [],
   "url": "https://en.wikipedia.org/wiki/Lichtenberg_figure"
  },
  {
   "id": "B02-11",
   "algo": "B02",
   "title": "以 DLA 模擬鋰電池枝晶生長（MRI 驗證）",
   "creator": "",
   "year": "",
   "category": "performance",
   "categories_extra": [],
   "scale": "物件",
   "summary": "電化學研究以 DLA 模型模擬鋰對稱電池充電時的枝晶（dendrite）生長，並以 MRI 觀測驗證，顯示 DLA 除了造形，也是材料性能與失效分析的工具。",
   "variations": [
    {
     "name": "平面電極種子",
     "how": "種子改為底部一整排點，粒子從上方均勻落下並帶向下偏移。",
     "effect": "得到從電極表面長出的枝晶森林。"
    },
    {
     "name": "量測枝晶高度",
     "how": "每加一顆粒子記錄最大高度，輸出成曲線圖。",
     "effect": "觀察枝晶突破隔板的時間點。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "物理模擬",
    "隨機"
   ],
   "tools": [],
   "url": "https://www.researchgate.net/publication/384758624_Simulation_of_Dendrite_Growth_with_a_Diffusion-Limited_Aggregation_Model_Validated_by_MRI_of_a_Lithium_Symmetric_Cell_during_Charging"
  },
  {
   "id": "B02-12",
   "algo": "B02",
   "title": "Grasshopper Swarm Intelligence IV：Diffuse Limited Aggregation",
   "creator": "Grasshopper3d 社群",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "Grasshopper3d 社群的影片教學與討論串示範在 GH 裡以腳本實作 DLA，是建築領域使用者接觸 DLA 的主要入口之一，可作為本課範例的延伸參考。",
   "variations": [
    {
     "name": "Anemone 迴圈版",
     "how": "用 Anemone 每圈加入一顆粒子並回饋點集。",
     "effect": "可在畫布上即時看到生長。"
    },
    {
     "name": "空間索引效能比較",
     "how": "把 NearbyPointFinder 換成 RTree（Rhino.Geometry.RTree）比較速度。",
     "effect": "學會使用 RhinoCommon 內建空間索引。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "空間索引",
    "動畫"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://www.grasshopper3d.com/video/swarm-intelligence-iv-diffuse-limited-aggregation"
  },
  {
   "id": "B02-13",
   "algo": "B02",
   "title": "OPENFUSE DLA 草稿（openFrameworks）",
   "creator": "Fuse*",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "義大利數位藝術工作室 Fuse* 在其研發實驗室以 openFrameworks 實作 DLA 草稿，作為即時影像與裝置作品的生成素材，示範 DLA 在即時互動藝術中的應用。",
   "variations": [
    {
     "name": "即時互動種子",
     "how": "滑鼠或感測器位置即時新增種子點，粒子持續從外圍生成。",
     "effect": "觀眾的動作決定枝條長向。"
    },
    {
     "name": "粒子軌跡可視化",
     "how": "輸出行走中粒子的路徑線（非只有黏住點）。",
     "effect": "呈現流動與沉積並存的動態畫面。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "動畫",
    "隨機"
   ],
   "tools": [
    "openFrameworks",
    "C++"
   ],
   "url": "https://fusefactory.github.io/openfuse/r&d/laboratory/openframeworks/DLA-Draft/"
  },
  {
   "id": "B02-14",
   "algo": "B02",
   "title": "珊瑚、礦物樹枝石與電沉積結晶",
   "creator": "自然現象",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "DLA 被用來描述珊瑚、地衣、礦物樹枝石（dendrite）、硫酸銅電沉積結晶與雪花等自然樹枝狀形態，是學習者觀察自然、蒐集參考影像並對照模擬結果的好題材。",
   "variations": [
    {
     "name": "照片對照調參",
     "how": "蒐集礦物樹枝石照片，調 stickiness 與偏移直到碎形維度接近。",
     "effect": "學會用量化方式比對模擬與自然。"
    },
    {
     "name": "晶格 DLA",
     "how": "把隨機方向限制為 4 或 6 個方向（網格上走）。",
     "effect": "產生帶晶格方向性的結晶枝。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "分形",
    "隨機"
   ],
   "tools": [],
   "url": "https://en.wikipedia.org/wiki/Diffusion-limited_aggregation"
  },
  {
   "id": "B02-51",
   "algo": "B02",
   "title": "Coding Challenge #34：Diffusion-Limited Aggregation",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2016",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "The Coding Train 的程式挑戰影片，以 p5.js 從零寫出擴散限制聚集：隨機漫步的粒子碰到已固定的團簇就黏上去，逐漸長成布朗樹。影片同時提供 p5.js 與 Processing 程式碼。適合作為把 Grasshopper C# 範例移植到網頁的入門對照。",
   "variations": [
    {
     "name": "粒子逐漸變小",
     "how": "每黏上一個粒子，就把下一個漫步者的半徑乘上一個略小於 1 的係數",
     "effect": "越外圍的枝越細，形成由粗到細的樹狀層次"
    },
    {
     "name": "依生成順序上色",
     "how": "以粒子加入團簇的順序對應色相",
     "effect": "可以直接看出團簇由內往外的生長歷程"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "Processing",
    "教學",
    "影片"
   ],
   "tools": [
    "p5.js",
    "Processing"
   ],
   "url": "https://thecodingtrain.com/challenges/34-diffusion-limited-aggregation",
   "image": {
    "file": "img/cases/B02-51.jpg",
    "w": 900,
    "h": 506,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/34-diffusion-limited-aggregation",
    "note": "Coding Challenge #34 影片縮圖，DLA 團簇"
   }
  },
  {
   "id": "B02-52",
   "algo": "B02",
   "title": "Coding Challenge #127：Brownian Tree Snowflake（布朗樹雪花）",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2018",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "這一集把 DLA 限制在一個 30° 的楔形區域中生長：粒子從外側沿水平方向往中心漂移，黏住後再把這一片鏡射、旋轉 6 次，組成六重對稱的雪花。它示範了「只算一小塊，再用對稱性複製」的做法。",
   "variations": [
    {
     "name": "楔形區域＋鏡射",
     "how": "粒子只在 0°–30° 的扇形內漫步並黏附，繪圖時做鏡射與 6 次旋轉",
     "effect": "計算量大減，並得到六重對稱的雪花"
    },
    {
     "name": "改變對稱次數",
     "how": "把 6 次旋轉改成 4、5 或 8 次，楔形角度同步調整",
     "effect": "得到不同對稱性的晶體或花窗圖樣"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "對稱",
    "教學",
    "影片"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://thecodingtrain.com/challenges/127-brownian-tree-snowflake",
   "image": {
    "file": "img/cases/B02-52.jpg",
    "w": 900,
    "h": 509,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/127-brownian-tree-snowflake",
    "note": "Coding Challenge #127 影片縮圖，布朗樹雪花"
   }
  },
  {
   "id": "B02-53",
   "algo": "B02",
   "title": "2D Diffusion-Limited Aggregation Experiments（2D DLA 實驗）",
   "creator": "Jason Webb",
   "year": "2018",
   "category": "drawing",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "Jason Webb 以 JavaScript 做的一系列 DLA 實驗，採用「非網格（off-lattice）」的粒子方式而非像素格點，以便輸出適合數位製造的向量 SVG。實驗包含方向偏移、不同粒子大小與形狀、以 SVG 圖形作為種子或障礙等。相較於基礎範例，它著重可調參數與向量輸出。",
   "variations": [
    {
     "name": "方向偏移（directional bias）",
     "how": "漫步者每步的隨機位移加上一個固定方向分量",
     "effect": "團簇朝單一方向生長，像閃電或冰晶"
    },
    {
     "name": "SVG 形狀作為種子",
     "how": "把 SVG 路徑取樣成固定粒子，當作初始團簇",
     "effect": "枝狀結構沿著指定輪廓長出來"
    },
    {
     "name": "線段渲染",
     "how": "以父子粒子之間的連線取代圓點繪製",
     "effect": "得到可直接繪圖機輸出的線稿"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "JavaScript",
    "SVG",
    "數位製造"
   ],
   "tools": [
    "JavaScript"
   ],
   "url": "https://github.com/jasonwebb/2d-diffusion-limited-aggregation-experiments",
   "image": {
    "file": "img/cases/B02-53.jpg",
    "w": 900,
    "h": 471,
    "source": "GitHub（jasonwebb/2d-diffusion-limited-aggregation-experiments）",
    "author": "Jason Webb",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://github.com/jasonwebb/2d-diffusion-limited-aggregation-experiments",
    "note": "README 中「方向偏移」實驗的預覽圖"
   }
  },
  {
   "id": "B02-54",
   "algo": "B02",
   "title": "dlaf：Diffusion-limited aggregation, fast",
   "creator": "Michael Fogleman",
   "year": "2019",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "物件",
   "summary": "Michael Fogleman 以 C++ 與 Boost 空間索引寫成的高速 DLA 程式，支援 2D 與 3D，單核心約 35 秒可算出一百萬個粒子；README 中展示了一千萬粒子的 3D 光線追蹤成果。程式輸出每個粒子的 id、父節點與座標，並提供黏附距離、黏性（Stickiness）等參數。和基礎範例相比，它示範空間索引如何把 DLA 推到百萬級規模。",
   "variations": [
    {
     "name": "空間索引加速",
     "how": "以 R-tree 等空間索引查詢最近的固定粒子，取代逐一比對",
     "effect": "粒子數可從數千提高到數百萬"
    },
    {
     "name": "調整黏性機率",
     "how": "粒子碰觸時只以 Stickiness 機率黏住，否則繼續漫步",
     "effect": "枝幹變粗、分枝變少，形體更緊實"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "C++",
    "3D",
    "高效能",
    "開源"
   ],
   "tools": [
    "C++"
   ],
   "url": "https://github.com/fogleman/dlaf",
   "image": {
    "file": "img/cases/B02-54.jpg",
    "w": 900,
    "h": 900,
    "source": "GitHub（fogleman/dlaf）README",
    "author": "Michael Fogleman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://github.com/fogleman/dlaf",
    "note": "一千萬粒子 3D DLA 光線追蹤算圖"
   }
  },
  {
   "id": "B02-55",
   "algo": "B02",
   "title": "VEX in Houdini：Diffusion Limited Aggregation",
   "creator": "Entagma",
   "year": "2017",
   "category": "modeling",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "Entagma 的影片教學先講解 DLA 理論，再用 Houdini 的 VEX 實作基本演算法、調整模擬形態，最後分別以 Mantra 與 Redshift 算圖，並提供專案檔下載。相較於基礎範例，它把 DLA 放進 3D 視覺特效流程，從模擬直接接到高品質渲染。",
   "variations": [
    {
     "name": "3D 空間的 DLA",
     "how": "漫步粒子在 3D 空間移動，並以點雲查詢最近的已固定點",
     "effect": "長出珊瑚狀的立體枝狀結構"
    },
    {
     "name": "塑形模擬範圍",
     "how": "讓漫步者只在指定形體內生成或受力場偏移",
     "effect": "枝狀結構被引導成特定外形"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Houdini",
    "VEX",
    "3D",
    "教學",
    "影片"
   ],
   "tools": [
    "Houdini"
   ],
   "url": "https://vimeo.com/218372128",
   "image": {
    "file": "img/cases/B02-55.jpg",
    "w": 640,
    "h": 360,
    "source": "Vimeo（Entagma）",
    "author": "Entagma",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://vimeo.com/218372128",
    "note": "Houdini VEX DLA 教學影片縮圖"
   }
  },
  {
   "id": "B03-01",
   "algo": "B03",
   "title": "葉脈圖樣的建模與視覺化（Leaf Venation Patterns）",
   "creator": "Adam Runions 等（University of Calgary, Algorithmic Botany）",
   "year": "2005",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "空間殖民演算法的原點：在葉片中放置生長素（auxin）來源點，葉脈朝來源點生長、靠近後來源點消失，並隨葉片長大持續加入新來源點。論文同時提出開放（樹狀）與封閉（網狀）兩種葉脈，並用 Voronoi 空間分割加速。",
   "variations": [
    {
     "name": "葉片邊界內撒點",
     "how": "把 RandomPointsAboveRoot 換成在封閉葉形曲線內（Curve.Contains）撒點，根部放在葉柄位置，改成 2D（Z=0）。",
     "effect": "得到限定在葉形內的開放式葉脈。"
    },
    {
     "name": "邊界成長時持續補點",
     "how": "每隔 k 步把葉形曲線放大一點（Transform.Scale），並在新增的區域補撒吸引點，模擬葉片邊長邊長脈。",
     "effect": "主脈先成形、細脈後補，階層感更接近真實葉片。"
    },
    {
     "name": "封閉式葉脈",
     "how": "吸引點要等所有朝它長的枝端都抵達才刪除，並允許相遇枝端互連。",
     "effect": "產生有迴圈的網狀葉脈。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "開放生長",
    "鄰居搜尋",
    "空間索引",
    "網格擴散"
   ],
   "tools": [
    "論文",
    "自製程式"
   ],
   "url": "https://algorithmicbotany.org/papers/venation.sig2005.html"
  },
  {
   "id": "B03-02",
   "algo": "B03",
   "title": "以空間殖民演算法建模樹木（Modeling Trees with a Space Colonization Algorithm）",
   "creator": "Adam Runions, Brendan Lane, Przemyslaw Prusinkiewicz",
   "year": "2007",
   "category": "modeling",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "物件",
   "summary": "把 2005 年的開放式葉脈模型延伸到 3D，以樹冠包絡內的吸引點代表「可用空間」，枝條彼此競爭空間，就能長出相當逼真的樹。基礎範例就是這篇的簡化版。",
   "variations": [
    {
     "name": "自訂樹冠包絡",
     "how": "attractors 改接在橢球、錐體或手繪 Brep 內 Populate 3D 的點。",
     "effect": "控制樹種外形（圓冠、尖塔、傘形）。"
    },
    {
     "name": "枝粗與葉片",
     "how": "輸出時以 Pipe 模型從末梢倒推半徑，末梢節點放置葉片平面。",
     "effect": "從線框變成可渲染的實體樹。"
    },
    {
     "name": "環境遮擋",
     "how": "把建築量體內部或陰影區的吸引點先刪除。",
     "effect": "樹會自然避開牆面、朝開闊處生長。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "開放生長",
    "吸引子控制"
   ],
   "tools": [
    "論文",
    "自製程式"
   ],
   "url": "https://algorithmicbotany.org/papers/colonization.egwnp2007.pdf"
  },
  {
   "id": "B03-03",
   "algo": "B03",
   "title": "Hyphae Lamps 分枝燈具系列",
   "creator": "Nervous System（Jessica Rosenkrantz, Jesse Louis-Rosenberg）",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "受葉脈形成啟發的 3D 列印尼龍燈具，每一盞都獨一無二。設計軟體以 C++（CGAL、Cinder）自製，從一個基底量體與一組根部點出發，讓根部往充滿 auxin 的環境生長，並依流過的量決定枝的粗細，投出分枝狀光影。",
   "variations": [
    {
     "name": "量體表面／內部撒點",
     "how": "吸引點改為蛋形或球形 Brep 表面附近的點，根部設在燈座一圈。",
     "effect": "枝網包覆成燈罩外形。"
    },
    {
     "name": "流量決定粗細",
     "how": "從末梢倒推，每個節點累計下游末梢數，半徑依累計量的 1/2–1/3 次方給定後 Pipe。",
     "effect": "根部粗、末梢細，結構可列印且有層次。"
    },
    {
     "name": "輸出可列印網格",
     "how": "用 MultiPipe 或 Dendro 類外掛把線段轉成單一封閉 mesh。",
     "effect": "得到可直接送 SLS 列印的燈罩檔。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "開放生長",
    "曲面上"
   ],
   "tools": [
    "C++",
    "CGAL",
    "Cinder",
    "3D 列印（SLS 尼龍）"
   ],
   "url": "https://n-e-r-v-o-u-s.com/blog/?p=1701"
  },
  {
   "id": "B03-04",
   "algo": "B03",
   "title": "Xylem + Hyphae 演算法草圖",
   "creator": "Nervous System",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Nervous System 以 Runions 的葉脈論文為基礎，發展出 2D 的 Xylem 與 3D 的 Hyphae 兩套模擬系統；此相簿收錄大量演算法草圖，展示同一規則在不同邊界、根部配置下的網路變化。",
   "variations": [
    {
     "name": "多根部從邊緣長入",
     "how": "rootPoint 改成邊界曲線上等分的多個點，全部以 ParentIndex = -1 起始。",
     "effect": "網路由外向內收攏，形成放射狀脈紋。"
    },
    {
     "name": "線寬依階層",
     "how": "計算每段下游末梢數，輸出時以不同線寬或 Offset 曲線表現。",
     "effect": "像版畫一樣具主次層次的平面圖樣。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "開放生長",
    "吸引子控制"
   ],
   "tools": [
    "C++",
    "自製程式"
   ],
   "url": "https://n-e-r-v-o-u-s.com/projects/albums/networks-sketches/"
  },
  {
   "id": "B03-05",
   "algo": "B03",
   "title": "2D Space Colonization Experiments",
   "creator": "Jason Webb",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "以 JavaScript 與 Canvas 實作的一系列瀏覽器互動實驗，涵蓋基本空間殖民、邊界（bounds）限制、障礙物、開放與封閉葉脈、依階層改變線寬等，是理解參數與變形最直觀的資源。",
   "variations": [
    {
     "name": "邊界＋障礙物",
     "how": "新增 boundary 與 obstacles 曲線輸入，吸引點與新節點都要通過 Contains 檢查。",
     "effect": "網路只長在指定形狀內並繞開洞口。"
    },
    {
     "name": "空間索引",
     "how": "以 RTree 取代 NearestNode 的全掃描。",
     "effect": "可放上萬吸引點仍即時生長。"
    },
    {
     "name": "末梢加粗顯示",
     "how": "依節點到根的深度或下游數量設定顯示線寬。",
     "effect": "得到有粗細變化的線畫。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "空間索引",
    "動畫",
    "約束滿足"
   ],
   "tools": [
    "JavaScript",
    "Canvas API"
   ],
   "url": "https://github.com/jasonwebb/2d-space-colonization-experiments"
  },
  {
   "id": "B03-06",
   "algo": "B03",
   "title": "Coding Challenge #17：Fractal Trees - Space Colonization",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "modeling"
   ],
   "scale": "物件",
   "summary": "The Coding Train 演算法植物系列第 4 集，以 p5.js／Processing 從零寫出空間殖民樹生成器，並提供原始碼。邏輯與基礎範例幾乎一一對應，是自學對照的好教材。",
   "variations": [
    {
     "name": "逐步動畫",
     "how": "改成 Timer 驅動，每次只跑一次 GrowOneStep。",
     "effect": "看見樹一步步長出。"
    },
    {
     "name": "改成 3D",
     "how": "基礎範例本身已是 3D，可對照影片的 2D 版本把 Z 固定為 0 比較差異。",
     "effect": "理解維度只影響撒點範圍。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "動畫",
    "開放生長"
   ],
   "tools": [
    "p5.js",
    "Processing"
   ],
   "url": "https://www.youtube.com/watch?v=kKT0v3qhIQY"
  },
  {
   "id": "B03-07",
   "algo": "B03",
   "title": "以空間殖民生成道路網（Space Colonisation for Procedural Road Generation）",
   "creator": "",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "群體／都市",
   "summary": "把吸引點詮釋為需要被道路服務的地點，用空間殖民生成都市與城際道路網，並可結合流場、人口分布、地理與邊界地圖微調路網佈局。",
   "variations": [
    {
     "name": "人口密度撒點",
     "how": "以人口或容積率圖的灰階當接受機率撒吸引點。",
     "effect": "密集區道路細密、郊區稀疏。"
    },
    {
     "name": "地形約束",
     "how": "新節點若落在坡度過大或水域區域就捨棄，並把方向向量混入等高線切線方向。",
     "effect": "道路順應地形蜿蜒。"
    },
    {
     "name": "封閉成路網",
     "how": "改寫為封閉式模型，讓相近的末梢互相連接。",
     "effect": "從樹狀路網變成有環路的街廓網。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "影像輸入",
    "約束滿足",
    "吸引子控制"
   ],
   "tools": [
    "論文"
   ],
   "url": "https://www.researchgate.net/publication/330256216_Space_Colonisation_for_Procedural_Road_Generation"
  },
  {
   "id": "B03-08",
   "algo": "B03",
   "title": "Procedural World：Space Colonization（城市街道的自然生長）",
   "creator": "Miguel Cepero（Procedural World 部落格）",
   "year": "2011",
   "category": "urban-landscape",
   "categories_extra": [
    "modeling"
   ],
   "scale": "群體／都市",
   "summary": "程序化世界生成部落格文章，主張未經規劃的城市街道就像植物一樣「以最經濟的方式佔滿空間」，並用空間殖民演算法生成沿地形蔓延、覆蓋可用空間的街道網。",
   "variations": [
    {
     "name": "地形上生長",
     "how": "新節點以 Mesh.ClosestPoint 投回地形網格，吸引點也撒在地形上。",
     "effect": "得到貼合地形的街道網。"
    },
    {
     "name": "主次街道分級",
     "how": "依每段下游末梢數分主幹道、次要道路與巷弄，輸出不同寬度。",
     "effect": "形成有階層的道路系統。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "曲面上",
    "開放生長"
   ],
   "tools": [
    "C++",
    "自製程式"
   ],
   "url": "http://procworld.blogspot.com/2011/02/space-colonization.html"
  },
  {
   "id": "B03-09",
   "algo": "B03",
   "title": "Space-Colonization 建築剖面生成工具",
   "creator": "tiago0320（GitHub）",
   "year": "",
   "category": "3d-architecture",
   "categories_extra": [
    "drawing"
   ],
   "scale": "建築",
   "summary": "互動式生成設計與建築剖面工具：使用者繪製實／虛邊界、放置根部、甚至分析手繪草圖，用空間殖民生成剖面上的分枝空間網路；支援向性偏向、主次枝分級與修剪、曲直形態調整、以及產生次級連接迴圈來模擬結構斜撐與動線，並可匯出到 CAD／3D 軟體。",
   "variations": [
    {
     "name": "剖面內的空間網",
     "how": "把生長限制在 XZ 平面、以剖面輪廓為邊界，吸引點依樓層或採光需求配置。",
     "effect": "生成樹狀中庭或垂直動線的剖面構想。"
    },
    {
     "name": "主次分級修剪",
     "how": "計算每段下游末梢數，低於閾值的枝刪除。",
     "effect": "只保留主要結構或動線骨架。"
    },
    {
     "name": "直線化",
     "how": "把 segmentLength 小步合併成長段，方向量化為 0°／45°／90°。",
     "effect": "得到可施工的直線構架。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "約束滿足",
    "吸引子控制",
    "影像輸入"
   ],
   "tools": [
    "JavaScript",
    "HTML5 Canvas"
   ],
   "url": "https://github.com/tiago0320/Space-Colonization"
  },
  {
   "id": "B03-10",
   "algo": "B03",
   "title": "以空間殖民在 Blender 中設計軟材料內的血管通道（專利文件）",
   "creator": "USPTO 專利（Fabrication materials and processes useful to form structures in soft materials）",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "構件",
   "summary": "專利文件描述以 Blender Python API 自製的空間殖民實作設計血管結構：先在指定邊界內隨機產生 N 個虛擬細胞當吸引點，讓血管網長到每個細胞的擴散距離內，再製造成軟材料中的通道。",
   "variations": [
    {
     "name": "擴散距離當 killDistance",
     "how": "把 killDistance 設成材料的擴散極限距離，吸引點均勻撒滿整個組織體積。",
     "effect": "保證每個點都在通道服務範圍內。"
    },
    {
     "name": "入口／出口雙樹",
     "how": "兩個根部（動脈、靜脈）同時生長，末梢配對連接。",
     "effect": "形成可灌流的封閉迴路。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "開放生長",
    "最佳化"
   ],
   "tools": [
    "Blender",
    "Python"
   ],
   "url": "https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12208441"
  },
  {
   "id": "B03-11",
   "algo": "B03",
   "title": "血管化生物混合組織的多尺度運算框架",
   "creator": "bioRxiv 預印本作者群",
   "year": "2026",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "研究以 Space Colonization 作為迭代生長方法，逐步把血管網擴展到尚未被灌流的區域，用於生成可製造的血管化組織構造。可視為「以服務範圍為性能指標」的空間殖民應用，概念上可類比建築設備管線或通風路徑。",
   "variations": [
    {
     "name": "以覆蓋率為收斂條件",
     "how": "每步計算剩餘吸引點比例，低於門檻即停止，並輸出覆蓋率曲線。",
     "effect": "可比較不同參數的服務效率。"
    },
    {
     "name": "粗細依 Murray 定律",
     "how": "從末梢倒推，父段半徑的三次方等於子段半徑三次方總和。",
     "effect": "得到流體力學上合理的管徑分布。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "收斂",
    "最佳化"
   ],
   "tools": [
    "論文"
   ],
   "url": "https://www.biorxiv.org/content/10.64898/2026.02.28.708633v1.full"
  },
  {
   "id": "B03-12",
   "algo": "B03",
   "title": "spacetree：Blender 空間殖民樹木外掛",
   "creator": "Michel Anders（varkenvarken）",
   "year": "2013",
   "category": "modeling",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "物件",
   "summary": "以 Runions 演算法實作的 Blender 樹木生成外掛，參數對應景觀設計常用的樹形特徵，並特別適合建築表現：可輕易納入建築物或牆面造成的遮蔽效果，讓樹木對周邊環境做出反應。",
   "variations": [
    {
     "name": "建築遮蔽",
     "how": "以 Brep 量體做 IsPointInside 或以太陽方向做遮蔽射線測試，刪掉陰影中的吸引點。",
     "effect": "樹冠向開闊或向陽側偏長。"
    },
    {
     "name": "景觀配置批次生成",
     "how": "把 seed 與樹冠包絡做成清單，一次生成整排行道樹。",
     "effect": "每棵樹都不同卻同屬一種樹形。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "吸引子控制",
    "可重現種子"
   ],
   "tools": [
    "Blender",
    "Python"
   ],
   "url": "https://github.com/varkenvarken/spacetree"
  },
  {
   "id": "B03-13",
   "algo": "B03",
   "title": "Sverchok Tree Generator（節點式空間殖民）",
   "creator": "elfnor",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "把空間殖民樹生成器寫成 Blender Sverchok 的腳本節點，與 Grasshopper C# Script 的使用情境非常相似：上游節點提供吸引點與根部，下游接成管或網格。",
   "variations": [
    {
     "name": "上游撒點多樣化",
     "how": "吸引點改接自 Voronoi、Noise 或曲面取樣元件。",
     "effect": "同一元件長出截然不同的樹冠。"
    },
    {
     "name": "輸出骨架給 Skin 包覆",
     "how": "輸出節點與父節點索引，交給 Dendro 或 Mesh 包覆元件。",
     "effect": "得到平滑連續的分枝實體。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "多元件",
    "3D"
   ],
   "tools": [
    "Blender",
    "Sverchok",
    "Python"
   ],
   "url": "https://elfnor.com/sverchok-tree-generator.html"
  },
  {
   "id": "B03-14",
   "algo": "B03",
   "title": "VEX in Houdini：Space Colonization",
   "creator": "Entagma（Manuel）",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "modeling"
   ],
   "scale": "物件",
   "summary": "Entagma 免費教學，在 Houdini 中以 VEX 與 SOP Solver 實作 Runions 的空間殖民，利用 Houdini 內建的最近點查詢函式加速，常用於動態圖像與藝術裝置的分枝生長動畫。",
   "variations": [
    {
     "name": "Solver 式逐幀生長",
     "how": "對應 GH 做法：以 Timer 或 Anemone 迴圈每次生長一步並保留狀態。",
     "effect": "流暢的生長動畫。"
    },
    {
     "name": "內建最近點查詢",
     "how": "以 Rhino RTree.Point3dClosestPoints 取代自寫 NearestNode。",
     "effect": "大幅加速並可處理大量吸引點。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "動畫",
    "空間索引",
    "3D"
   ],
   "tools": [
    "Houdini",
    "VEX"
   ],
   "url": "https://entagma.com/1028-2/"
  },
  {
   "id": "B03-15",
   "algo": "B03",
   "title": "Grasshopper 空間殖民範例（Parametric House）",
   "creator": "Parametric House",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "Grasshopper 教學範例網站提供的空間殖民定義，示範在 GH 中以目標點與起始點建立樹狀結構，可直接與基礎範例的 C# 版本比較元件式與程式碼式實作的差異。",
   "variations": [
    {
     "name": "C# 取代元件迴圈",
     "how": "把 Anemone 或元件式迴圈換成本課的 C# Script，一次在元件內跑完所有步驟。",
     "effect": "運算更快、參數更集中。"
    },
    {
     "name": "轉成結構構件",
     "how": "枝段以 Pipe 成管並在節點處放置接頭球。",
     "effect": "可作為樹狀柱或裝置構架的初步模型。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "多元件",
    "3D"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://parametrichouse.com/space-colonization/"
  },
  {
   "id": "B03-51",
   "algo": "B03",
   "title": "Coding Challenge #17：Fractal Trees - Space Colonization",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2016",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "The Coding Train 依 Runions 等人的空間殖民演算法，在畫面上散布「葉子」吸引點，樹枝節點朝影響範圍內的吸引點平均方向長出新枝，吸引點被觸及後就移除。影片提供 p5.js 與 Processing 程式碼。適合對照 Grasshopper C# 版本的吸引距離與消除距離參數。",
   "variations": [
    {
     "name": "吸引點分布改變樹形",
     "how": "把吸引點從矩形隨機分布改成圓形或特定輪廓內",
     "effect": "樹冠自然長成吸引點所定義的外形"
    },
    {
     "name": "3D 版本",
     "how": "吸引點改在 3D 空間中分布並以 3D 向量運算",
     "effect": "得到立體的樹冠枝幹"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "Processing",
    "教學",
    "影片"
   ],
   "tools": [
    "p5.js",
    "Processing"
   ],
   "url": "https://thecodingtrain.com/challenges/17-fractal-trees-space-colonization",
   "image": {
    "file": "img/cases/B03-51.jpg",
    "w": 900,
    "h": 504,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/17-fractal-trees-space-colonization",
    "note": "Coding Challenge #17 影片縮圖，空間殖民樹"
   }
  },
  {
   "id": "B03-52",
   "algo": "B03",
   "title": "2D Space Colonization Experiments（2D 空間殖民實驗）",
   "creator": "Jason Webb",
   "year": "2019",
   "category": "drawing",
   "categories_extra": [
    "fabrication",
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Jason Webb 以 JavaScript 實作空間殖民演算法的開放（open）與封閉（closed）葉脈兩種模式，並加入依末端累加的葉脈加粗（auxin flux canalization）、SVG 邊界與障礙物等功能。目標同樣是可輸出向量的數位製造用圖樣。相較於基礎範例，它多了封閉迴圈葉脈與粗細層級。",
   "variations": [
    {
     "name": "封閉葉脈",
     "how": "吸引點改與相對鄰域（relative neighborhood）內所有葉脈段關聯，直到全部抵達才移除",
     "effect": "葉脈彼此接合成網狀迴圈"
    },
    {
     "name": "葉脈加粗",
     "how": "從末端往根部回溯，把子段粗細累加到父段",
     "effect": "主脈粗、細脈細，接近真實葉脈層級"
    },
    {
     "name": "邊界與障礙",
     "how": "以 SVG 輪廓限制生長範圍，並設定不可穿越的障礙形狀",
     "effect": "葉脈繞過孔洞，填滿指定輪廓"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "JavaScript",
    "SVG",
    "葉脈",
    "數位製造"
   ],
   "tools": [
    "JavaScript"
   ],
   "url": "https://github.com/jasonwebb/2d-space-colonization-experiments",
   "image": {
    "file": "img/cases/B03-52.jpg",
    "w": 847,
    "h": 793,
    "source": "GitHub（jasonwebb/2d-space-colonization-experiments）",
    "author": "Jason Webb",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://github.com/jasonwebb/2d-space-colonization-experiments",
    "note": "圓形範圍內的空間殖民葉脈圖"
   }
  },
  {
   "id": "B03-53",
   "algo": "B03",
   "title": "Hyphae Lamps（Hyphae 燈具）",
   "creator": "Nervous System",
   "year": "2011",
   "category": "fabrication",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "物件",
   "summary": "Nervous System 以葉脈形成為靈感設計的生成式燈具，每盞燈從基礎體積與一組根點出發，在充滿 auxin 吸引點的環境中反覆生長出分枝網路，再以選擇性雷射燒結 3D 列印製作。設計軟體是工作室以 C++ 與 CGAL 自行開發。部落格記錄了他們如何改成以機率讓流量大的葉脈優先生長，並以隱函數曲面產生網格。",
   "variations": [
    {
     "name": "機率式生長",
     "how": "葉脈不是全部同時沿平均方向生長，而是依流向它的吸引點數量決定生長機率",
     "effect": "先出現主脈再長出次脈，層級更清楚"
    },
    {
     "name": "封閉網格與隱函數曲面",
     "how": "以 3D Delaunay 決定鄰域形成封閉網格，再用隱函數把骨架轉成實體",
     "effect": "結構連續、強度足以 3D 列印"
    }
   ],
   "difficulty": 5,
   "tags": [
    "creative coding",
    "C++",
    "CGAL",
    "3D 列印",
    "產品設計"
   ],
   "tools": [
    "C++",
    "CGAL"
   ],
   "url": "https://n-e-r-v-o-u-s.com/projects/sets/hyphae/",
   "image": {
    "file": "img/cases/B03-53.jpg",
    "w": 900,
    "h": 602,
    "source": "Nervous System",
    "author": "Nervous System",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://n-e-r-v-o-u-s.com/projects/sets/hyphae/",
    "note": "Hyphae 燈具內部分枝結構照片"
   }
  },
  {
   "id": "B03-54",
   "algo": "B03",
   "title": "ofxSpaceColonization",
   "creator": "Davide Prati（edap）",
   "year": "2017",
   "category": "modeling",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "openFrameworks 的附加套件，實作 Runions、Lane 與 Prusinkiewicz 的論文〈Modeling Trees with a Space Colonization Algorithm〉，只要 build()、grow()、draw() 三步即可在 3D 中長出樹。可設定最大／最小吸引距離等選項，並能以包絡體（envelope）決定樹冠外形。相較於基礎範例，它著重即時 3D 繪製與可重用的 C++ 套件介面。",
   "variations": [
    {
     "name": "自訂包絡體",
     "how": "搭配 ofxEnvelope，把吸引點散布在自訂的樹冠曲面內",
     "effect": "控制樹冠輪廓，例如球形或柱形"
    },
    {
     "name": "調整吸引距離",
     "how": "修改 maxDist／minDist 參數",
     "effect": "分枝密度與枝距跟著改變"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "openFrameworks",
    "C++",
    "3D",
    "即時"
   ],
   "tools": [
    "openFrameworks"
   ],
   "url": "https://github.com/edap/ofxSpaceColonization",
   "image": {
    "file": "img/cases/B03-54.jpg",
    "w": 900,
    "h": 536,
    "source": "GitHub（edap/ofxSpaceColonization）README",
    "author": "Davide Prati",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://github.com/edap/ofxSpaceColonization",
    "note": "README 封面圖，openFrameworks 生成的 3D 樹"
   }
  },
  {
   "id": "B03-55",
   "algo": "B03",
   "title": "Dendrite",
   "creator": "mattatz",
   "year": "2018",
   "category": "art-installation",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "mattatz 在 Unity 中以 GPU 運算實作空間殖民演算法，以輸入的點作為種子長出樹枝狀（dendrite）圖樣，並提供以 GPU marching cubes 把枝條轉成體積的渲染方式；SkinnedDendrite 還能讓分枝附著在動畫角色的蒙皮網格上。相較於基礎範例，它把演算法搬到 GPU 上以支援即時大量運算。",
   "variations": [
    {
     "name": "GPU 平行運算",
     "how": "以 Compute Shader 平行計算每個吸引點的最近節點",
     "effect": "可即時處理大量吸引點與節點"
    },
    {
     "name": "附著在動畫網格上",
     "how": "從 SkinnedMeshRenderer 取樣體積點作為吸引點",
     "effect": "樹枝結構跟著角色動作一起變形"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "Unity",
    "GPU",
    "即時"
   ],
   "tools": [
    "Unity"
   ],
   "url": "https://github.com/mattatz/Dendrite",
   "image": {
    "file": "img/cases/B03-55.jpg",
    "w": 480,
    "h": 312,
    "source": "GitHub（mattatz/Dendrite）README",
    "author": "mattatz",
    "license": "MIT（圖在 repo 中）",
    "license_url": "https://github.com/mattatz/Dendrite/blob/master/LICENSE",
    "page": "https://github.com/mattatz/Dendrite",
    "note": "DendriteSphere 動畫的第一格，球體上的分枝"
   }
  },
  {
   "id": "B04-01",
   "algo": "B04",
   "title": "Blooms 頻閃動畫雕塑",
   "creator": "John Edmark",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "3D 列印的葉序雕塑，放在轉台上以頻閃燈照射，每轉 137.5° 閃一次，雕塑看起來就像自己在綻放。葉序公式同時決定了幾何形態與動畫的節奏。",
   "variations": [
    {
     "name": "球面葉序",
     "how": "把基礎範例的平面 Vogel 公式改成 Fibonacci Sphere 的緯度公式，讓點落在球面或花苞形曲面上。",
     "effect": "點陣包覆整顆花苞，而非平面圓盤。"
    },
    {
     "name": "依編號長出尺寸漸變的花瓣",
     "how": "在每個點沿法向放一個錐體或花瓣，長度與寬度隨 number 線性增加。",
     "effect": "相鄰花瓣只差一點點，旋轉 137.5° 後恰好接到下一個，產生連續動畫。"
    },
    {
     "name": "時間輸入模擬頻閃",
     "how": "新增 frame 輸入，每一幀把整體旋轉 frame × 黃金角後輸出。",
     "effect": "在 Grasshopper 內就能預覽雕塑『綻放』的效果。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "曲面上",
    "動畫",
    "對稱"
   ],
   "tools": [
    "3D 列印"
   ],
   "url": "https://www.designboom.com/art/john-edmark-3d-printed-strobe-animated-blooms-01-11-2017/"
  },
  {
   "id": "B04-02",
   "algo": "B04",
   "title": "Eden Project：The Core 教育中心屋頂",
   "creator": "Grimshaw（Jolyon Brewis）、Peter Randall-Page、SKM Anthony Hunts（Mike Purvis）",
   "year": "2005",
   "category": "3d-architecture",
   "categories_extra": [
    "performance",
    "fabrication"
   ],
   "scale": "建築",
   "summary": "屋頂的木構梁以兩組相反方向的 Fibonacci 螺旋（21 與 34 條）排列，形式取自向日葵花盤。結構工程師開發了『Phyllotactic converter』，採用 21／34 的螺旋數讓梁深能控制在約 0.8 公尺。",
   "variations": [
    {
     "name": "Parastichy 連線成梁",
     "how": "每個點 i 分別連到 i+21 與 i+34，得到順時針與逆時針兩組螺旋 Polyline。",
     "effect": "兩組交錯螺旋構成放射狀格柵梁系統。"
    },
    {
     "name": "投影到穹頂曲面",
     "how": "把平面點陣的半徑 r 映射成高度 z = f(r)（如拋物面或球冠），再重新連線。",
     "effect": "由平面花盤變成有起伏的屋頂殼體。"
    },
    {
     "name": "統計構件長度",
     "how": "連線後計算每段梁長並分群，找出重複構件數量。",
     "effect": "作為木構預製與成本評估的依據。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "對稱"
   ],
   "tools": [],
   "url": "https://grimshaw.global/projects/culture-and-exhibition/the-eden-project-the-core/"
  },
  {
   "id": "B04-03",
   "algo": "B04",
   "title": "向日葵式聚光太陽能鏡場配置（PS10 改良）",
   "creator": "MIT（Mitsos 研究室）與 RWTH Aachen",
   "year": "2012",
   "category": "performance",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "地景",
   "summary": "研究者把聚光太陽能電廠的定日鏡改成以約 137° 黃金角螺旋排列（Fermat 螺旋），與 PS10 電廠原配置相比，鏡場佔地減少約 20%，同時減少鏡子間的遮蔽與阻擋、提升效率。",
   "variations": [
    {
     "name": "半徑函數參數化",
     "how": "把 √number 改成 a × number^b，讓外圈間距可調。",
     "effect": "外圈鏡子間距加大，減少遠處互相遮擋。"
    },
    {
     "name": "只保留北側扇形",
     "how": "加入角度範圍約束，只保留塔北側（北半球）的點。",
     "effect": "符合真實電廠只在接收塔一側佈鏡的配置。"
    },
    {
     "name": "遮蔭評估迴圈",
     "how": "對每個點以太陽向量做射線測試，計算被前排遮擋的比例並輸出成顏色。",
     "effect": "把葉序配置接上性能評估，可與網格配置比較。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "最佳化",
    "吸引子控制"
   ],
   "tools": [],
   "url": "https://news.mit.edu/2012/sunflower-concentrated-solar-0111"
  },
  {
   "id": "B04-04",
   "algo": "B04",
   "title": "Phyllotaxis Tower 葉序塔樓",
   "creator": "Ernesto Bueno Wills",
   "year": "2009",
   "category": "3d-architecture",
   "categories_extra": [
    "performance"
   ],
   "scale": "建築",
   "summary": "以向日葵葉序為概念的摩天樓提案：每層五片『葉』繞著核心旋轉生長並折出做為遮陽，內部結構以依黃金比例擴大的環狀點陣連成放射 diagrid。以 Grasshopper 與 RhinoScript 產生。",
   "variations": [
    {
     "name": "圓柱葉序決定每層元件位置",
     "how": "半徑固定、z 隨樓層增加，角度用 number × 發散角。",
     "effect": "陽台或遮陽葉片沿塔身螺旋排列。"
    },
    {
     "name": "改用 45° 固定轉角",
     "how": "把 angle 改成 45°，每 8 層回到原位（原作做法），與 137.5° 比較。",
     "effect": "看到有理角與黃金角在立面上的節奏差異。"
    },
    {
     "name": "點陣連成 diagrid",
     "how": "把每環的點與下一環的相鄰點連線形成交叉斜撐。",
     "effect": "得到類似幹細胞組織的內部結構網。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "對稱"
   ],
   "tools": [
    "Grasshopper",
    "RhinoScript",
    "Rhino"
   ],
   "url": "https://ernestobueno.blogspot.com/2009/07/phyllotaxis-tower.html"
  },
  {
   "id": "B04-05",
   "algo": "B04",
   "title": "Phyllo Pavilion",
   "creator": "Maryam Deshmukh、Sidhant Choudhary（IAAC）",
   "year": "2022",
   "category": "3d-architecture",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "IAAC 學習者的半透空亭子設計，以 21:34 的 Fibonacci 比例產生網格拓樸，把葉子換成參數化演化的面片，靈感也來自棕櫚葉柄束作為結構的 Arish 建築。以 Grasshopper 外掛完成運算設計。",
   "variations": [
    {
     "name": "21:34 網格拓樸",
     "how": "用 i→i+21、i→i+34 的連線把葉序點轉成四邊形網格。",
     "effect": "得到每格面積接近的螺旋網格。"
    },
    {
     "name": "每格面片依位置變形",
     "how": "依點的編號或與入口距離決定面片開口率。",
     "effect": "由內到外產生由封閉到通透的漸變。"
    },
    {
     "name": "映射到亭子曲面",
     "how": "把點的 (x, y) 正規化為 UV，用 Surface.PointAt 放到殼體上。",
     "effect": "平面葉序變成包覆亭子的外皮。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "曲面上",
    "3D"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://www.iaacblog.com/programs/phyllo-pavilion/"
  },
  {
   "id": "B04-06",
   "algo": "B04",
   "title": "Phyllotaxis：Estufa Fria 溫室花園裝置",
   "creator": "Melanie Waidler",
   "year": "2019",
   "category": "urban-landscape",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "地景",
   "summary": "位於里斯本 Estufa Fria 植物溫室的 follie 設計，以 Fibonacci 螺旋撐起一片紅色的可穿透摺面，讓它『殖民』整個溫室結構，讓人有置身花朵之中的空間體驗。",
   "variations": [
    {
     "name": "以曲線邊界裁切",
     "how": "用既有溫室平面作為 boundary，只保留落在邊界內的葉序點。",
     "effect": "螺旋圖樣自然填滿不規則基地。"
    },
    {
     "name": "點高度隨半徑變化",
     "how": "z = f(r) 讓外圈升高，形成下凹的花形空間。",
     "effect": "平面點陣變成可走入的起伏地景。"
    },
    {
     "name": "點轉成穿孔面",
     "how": "把 circles 對一張曲面做投影開孔。",
     "effect": "得到可透光的紅色穿孔摺面。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "曲面上",
    "3D"
   ],
   "tools": [],
   "url": "https://archive.dpa-etsam.com/projects/phyllotaxis"
  },
  {
   "id": "B04-07",
   "algo": "B04",
   "title": "Fibonacci Lattice：球面點均佈",
   "creator": "Extreme Learning",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "物件",
   "summary": "說明如何把 Fibonacci 格點以等面積圓柱投影映射到球面，快速得到近乎均勻的球面點分佈，並提出比標準 Fibonacci lattice 更佳的偏移修正。是把基礎範例平面葉序推到球面的標準做法。",
   "variations": [
    {
     "name": "緯度用 arccos 分佈",
     "how": "z = 1 − 2(i + 0.5)/N、r = √(1 − z²)，經度仍用 i × 黃金角。",
     "effect": "點在球面上幾乎等距。"
    },
    {
     "name": "只取上半球做圓頂",
     "how": "過濾 z < 0 的點，再做 Delaunay 或凸包得到三角網格。",
     "effect": "可直接作為圓頂分割的節點。"
    },
    {
     "name": "端點偏移修正",
     "how": "依文章把 i + 0.5 改成帶有 epsilon 的偏移。",
     "effect": "改善極點附近的點分佈品質。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "3D",
    "曲面上"
   ],
   "tools": [],
   "url": "https://extremelearning.com.au/evenly-distributing-points-on-a-sphere/"
  },
  {
   "id": "B04-08",
   "algo": "B04",
   "title": "Coding Challenge：Phyllotaxis",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "以 p5.js 逐幀畫出 Vogel 葉序點，並用編號或角度改變顏色，是最普及的葉序入門教學，與基礎 C# 範例的公式完全相同。",
   "variations": [
    {
     "name": "逐幀生長",
     "how": "用 Grasshopper Timer 或 frame 輸入，只輸出 number ≤ frame 的點。",
     "effect": "看到花盤由中心往外一顆顆長出來。"
    },
    {
     "name": "依編號上色",
     "how": "把 number % 256 或角度對應到色相，輸出顏色清單給 Custom Preview。",
     "effect": "顏色會凸顯出 Fibonacci 螺旋臂。"
    },
    {
     "name": "點大小隨時間脈動",
     "how": "半徑乘上 sin(time + number × k)。",
     "effect": "產生波紋式的動態圖像。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "動畫",
    "Timer"
   ],
   "tools": [
    "p5.js",
    "Processing"
   ],
   "url": "https://editor.p5js.org/codingtrain/sketches/CehY0jsLV"
  },
  {
   "id": "B04-09",
   "algo": "B04",
   "title": "Coding Challenge 181：Voronoi Phyllotaxis",
   "creator": "The Coding Train",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "把葉序點陣當作 Voronoi 的種子點，得到向日葵花盤般的細胞圖樣。示範了葉序與幾何分割家族的混合。",
   "variations": [
    {
     "name": "點接 Voronoi",
     "how": "把 points 輸出接到 GH Voronoi 元件，邊界用 count 對應的外圓。",
     "effect": "得到面積接近的螺旋細胞圖樣。"
    },
    {
     "name": "細胞內縮做開孔",
     "how": "每個 Voronoi 格用 Offset 往內縮，縮量隨半徑變化。",
     "effect": "由中心到外圈孔洞漸變的格柵。"
    },
    {
     "name": "用 Lloyd 鬆弛比較",
     "how": "對隨機點做數次 Lloyd relaxation，與葉序的 Voronoi 並排比較。",
     "effect": "理解葉序本身已是一種『免迭代』的均勻分佈。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "拼貼",
    "鄰居搜尋"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://editor.p5js.org/codingtrain/sketches/ydiZeUK8R"
  },
  {
   "id": "B04-10",
   "algo": "B04",
   "title": "以葉序排列立面面板（Dynamo 論壇討論）",
   "creator": "Dynamo BIM 社群",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "立面／表皮",
   "summary": "BIM 使用者討論如何讓立面面板改以葉序排列，取代傳統上下左右對齊的菱形排列。代表葉序從圖樣走向實際立面面板的需求。",
   "variations": [
    {
     "name": "矩形邊界內填滿",
     "how": "count 開大，再以立面外框 Curve.Contains 過濾點。",
     "effect": "在長方形立面中得到無明顯方向性的面板分佈。"
    },
    {
     "name": "點位放置族群／面板",
     "how": "每個點建立朝立面法向的 Plane，放置固定尺寸的面板或開孔。",
     "effect": "可直接轉成 BIM 構件或 CNC 開孔清單。"
    },
    {
     "name": "吸引子控制開孔率",
     "how": "依點到窗戶或入口的距離調整開孔半徑。",
     "effect": "視線與採光需要的位置更通透。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "吸引子控制"
   ],
   "tools": [
    "Dynamo",
    "Revit"
   ],
   "url": "https://forum.dynamobim.com/t/phyllotaxis-for-facade-panel-pattern/32489"
  },
  {
   "id": "B04-11",
   "algo": "B04",
   "title": "以葉序排列的高爾夫球凹洞（Phyllotaxis-based dimple patterns 專利）",
   "creator": "美國專利 US 6,682,441",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "以葉序規則在球面上配置高爾夫球的凹洞，讓凹洞分佈均勻且不重複，影響球的空氣動力表現。說明葉序也是工業產品表面均佈的方法。",
   "variations": [
    {
     "name": "Fibonacci Sphere 取點",
     "how": "把平面公式改成球面公式，count 設為凹洞數量。",
     "effect": "在球面上得到均勻的凹洞中心。"
    },
    {
     "name": "凹洞大小分級",
     "how": "依與最近鄰點的距離決定凹洞半徑（需簡單鄰居搜尋）。",
     "effect": "填補空隙，提高表面覆蓋率。"
    },
    {
     "name": "布林差集成實體",
     "how": "每個點沿法向放小球，與主球做 BooleanDifference。",
     "effect": "得到可 3D 列印的凹洞球體模型。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "曲面上",
    "鄰居搜尋"
   ],
   "tools": [],
   "url": "https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/6682441"
  },
  {
   "id": "B04-12",
   "algo": "B04",
   "title": "開孔非均勻分佈的研磨片（Abrasive article 專利）",
   "creator": "美國專利 US 9,656,366",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "構件",
   "summary": "研磨圓片上的集塵開孔以非均勻（葉序類）方式分佈，而非規則網格，使開孔不會沿同一軌跡排列。可視為『圓盤上的葉序開孔』的工業應用。",
   "variations": [
    {
     "name": "圓盤邊界與中心留白",
     "how": "只保留 rMin < 半徑 < rMax 的點。",
     "effect": "中心留出固定孔、外緣保留邊距。"
    },
    {
     "name": "調整發散角避免同心軌跡",
     "how": "比較黃金角與有理角時，點在旋轉方向上的重疊情況。",
     "effect": "理解葉序為何能避免開孔落在同一圓周軌跡上。"
    },
    {
     "name": "輸出切割路徑",
     "how": "circles 轉成 Curve 輸出為 DXF。",
     "effect": "直接供雷射或沖壓加工使用。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "對稱"
   ],
   "tools": [],
   "url": "https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9656366"
  },
  {
   "id": "B04-13",
   "algo": "B04",
   "title": "Flourish (Bloom) 互動展品",
   "creator": "Exploratorium（John Edmark 作品）",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "舊金山 Exploratorium 科學博物館的展品，觀眾可觀看以黃金角旋轉搭配頻閃產生動畫的葉序雕塑，把葉序數學轉成可體驗的公共教育裝置。",
   "variations": [
    {
     "name": "發散角可調的互動版",
     "how": "把 angle 綁到滑桿，並即時以 frame 旋轉預覽。",
     "effect": "觀眾能看到換角度後動畫如何失效或改變方向。"
    },
    {
     "name": "平面版浮雕",
     "how": "點的高度 z 隨編號遞增，做成階梯狀浮雕。",
     "effect": "可 CNC 切削的平面版 Bloom。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "動畫",
    "3D"
   ],
   "tools": [],
   "url": "https://www.exploratorium.edu/exhibits/flourish-bloom"
  },
  {
   "id": "B04-14",
   "algo": "B04",
   "title": "Fibonacci Sphere 與 Sunflower Spiral 參數化教學",
   "creator": "designcoding",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "參數化設計教學網站示範在 Grasshopper 中建立向日葵螺旋與 Fibonacci 球面點陣，並延伸成球形結構（Fibonacci Dome）。適合作為學習者把 C# 範例對照 GH 原生元件寫法的參考。",
   "variations": [
    {
     "name": "C# 與原生元件對照",
     "how": "把基礎範例 PointAt 公式用 Series、Multiplication、Construct Point 等原生元件重建。",
     "effect": "理解公式寫法與視覺化程式之間的對應。"
    },
    {
     "name": "球面點連成圓頂",
     "how": "上半球點做 Delaunay Mesh，再取邊線作為桿件。",
     "effect": "得到節點均勻的 Fibonacci 圓頂結構。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "3D",
    "曲面上"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://www.designcoding.net/fibonacci-sphere/"
  },
  {
   "id": "B04-51",
   "algo": "B04",
   "title": "Coding Challenge #30：Phyllotaxis（葉序）",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2016",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "The Coding Train 以 p5.js 實作 Vogel 葉序模型：第 n 個點的角度為 n × 137.5°、半徑為 c√n，逐幀加一個點就畫出向日葵般的螺旋。是 Grasshopper C# 葉序範例最直接的網頁對照。",
   "variations": [
    {
     "name": "微調發散角",
     "how": "把 137.5° 改成 137.3° 或 137.6°",
     "effect": "螺旋臂變成明顯的直線放射或斷裂，說明黃金角的關鍵性"
    },
    {
     "name": "依序號上色",
     "how": "以 n 或與中心的距離對應色相",
     "effect": "更容易看出斐波那契螺旋線（parastichy）"
    }
   ],
   "difficulty": 1,
   "tags": [
    "creative coding",
    "p5.js",
    "黃金角",
    "教學",
    "影片"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://thecodingtrain.com/challenges/30-phyllotaxis",
   "image": {
    "file": "img/cases/B04-51.jpg",
    "w": 900,
    "h": 506,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/30-phyllotaxis",
    "note": "Coding Challenge #30 影片縮圖，葉序螺旋"
   }
  },
  {
   "id": "B04-52",
   "algo": "B04",
   "title": "ofxPhyllotaxis",
   "creator": "Davide Prati（edap）",
   "year": "2017",
   "category": "modeling",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "openFrameworks 附加套件，只提供三個靜態方法：simple（平面圓盤）、conical（沿 y 軸推出的圓錐）與 apple（包成蘋果般的球面），傳入序號、發散角與間距就回傳位置，可用來排列任何 2D 或 3D 物件。相較於基礎範例只在平面上放點，它把葉序當成可套用在 3D 場景的排列工具。",
   "variations": [
    {
     "name": "圓錐葉序",
     "how": "每個點的 y 值依序號遞增（extrude 參數）",
     "effect": "排列成松果或多肉植物般的錐形"
    },
    {
     "name": "球面葉序（apple）",
     "how": "依總數 total 把點映射到封閉的球狀曲面",
     "effect": "物件均勻包覆整個球面"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "openFrameworks",
    "C++",
    "3D"
   ],
   "tools": [
    "openFrameworks"
   ],
   "url": "https://github.com/edap/ofxPhyllotaxis",
   "image": {
    "file": "img/cases/B04-52.jpg",
    "w": 900,
    "h": 508,
    "source": "GitHub（edap/ofxPhyllotaxis）README",
    "author": "Davide Prati",
    "license": "MIT（圖在 repo 中）",
    "license_url": "https://github.com/edap/ofxPhyllotaxis",
    "page": "https://github.com/edap/ofxPhyllotaxis",
    "note": "README 中 apple 方法的 3D 葉序排列圖"
   }
  },
  {
   "id": "B04-53",
   "algo": "B04",
   "title": "TD Essentials：Create a Swept Phyllotaxis Operator in Houdini",
   "creator": "Manuel（Entagma）",
   "year": "2021",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "物件",
   "summary": "Entagma 的教學以 VEX 在 Houdini 中建立葉序運算子，但不只做平面圓盤模型，而是讓葉序分布在一條輪廓旋轉而成的曲面（surface of revolution）上。成果可作為可重複使用的 Houdini 工具。相較於基礎範例，它處理了曲面上面積不均時如何保持密鋪。",
   "variations": [
    {
     "name": "沿旋轉曲面分布",
     "how": "以輪廓曲線的弧長或面積累積來決定每個點的高度，再乘上黃金角旋轉",
     "effect": "點在鳳梨、松果般的曲面上仍保持均勻密度"
    },
    {
     "name": "封裝成運算子",
     "how": "把 VEX 程式與參數包成 HDA",
     "effect": "可在不同專案重複套用並即時調參"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Houdini",
    "VEX",
    "教學",
    "影片"
   ],
   "tools": [
    "Houdini"
   ],
   "url": "https://entagma.com/td-essentials-create-a-swept-phyllotaxis-operator-in-houdini/",
   "image": {
    "file": "img/cases/B04-53.jpg",
    "w": 480,
    "h": 360,
    "source": "YouTube（Entagma）",
    "author": "Entagma",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.youtube.com/watch?v=yGwhnt7mZ50",
    "note": "Houdini 旋轉曲面葉序教學影片縮圖"
   }
  },
  {
   "id": "B04-54",
   "algo": "B04",
   "title": "ECS-Phyllotaxis（Unity ECS 葉序方塊）",
   "creator": "avvie",
   "year": "2018",
   "category": "performance",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "一個學習 Unity ECS（Entity Component System）的練習專案，以葉序公式排列大量方塊並讓它們全部旋轉，並加入剔除（culling）以提升效能。它示範葉序排列在遊戲引擎中大量實例化時的做法。相較於基礎範例，重點是在即時引擎中處理上萬個物件。",
   "variations": [
    {
     "name": "大量實例化",
     "how": "以 Entity 與系統（System）取代逐一建立 GameObject",
     "effect": "上萬個方塊仍能即時旋轉"
    },
    {
     "name": "加上逐元素動畫",
     "how": "讓每個方塊依序號加上旋轉相位差",
     "effect": "整體螺旋出現波動般的動態效果"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Unity",
    "C#",
    "即時",
    "效能"
   ],
   "tools": [
    "Unity"
   ],
   "url": "https://github.com/avvie/ECS-Phyllotaxis",
   "image": {
    "file": "img/cases/B04-54.jpg",
    "w": 900,
    "h": 512,
    "source": "GitHub（avvie/ECS-Phyllotaxis）README",
    "author": "avvie",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://github.com/avvie/ECS-Phyllotaxis",
    "note": "Unity 中以葉序排列的大量方塊截圖"
   }
  },
  {
   "id": "B05-01",
   "algo": "B05",
   "title": "Substrate",
   "creator": "Jared Tarbell",
   "year": "2003",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing",
    "art-installation"
   ],
   "scale": "物件",
   "summary": "Jared Tarbell 以 Processing 創作並開源的生成藝術：直線從其他直線上垂直長出、撞到就停，最終形成像都市街道的結晶圖樣，並沿裂紋以沙畫筆觸上色。本課範例即依其規則簡化而來。",
   "variations": [
    {
     "name": "沙畫筆觸",
     "how": "每條裂紋一側沿法向撒大量半透明點，點的分佈寬度隨機擺動。",
     "effect": "得到原作那種有深度、有顏色暈染的畫面。"
    },
    {
     "name": "影像取色",
     "how": "讀入一張圖片作為調色盤，每條裂紋隨機取一色。",
     "effect": "整體色調可控制。"
    },
    {
     "name": "彎曲模式",
     "how": "Crack 加入每步微量旋轉。",
     "effect": "出現原作中的弧形裂紋變體。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "隨機",
    "開放生長",
    "動畫"
   ],
   "tools": [
    "Processing"
   ],
   "url": "http://www.complexification.net/gallery/machines/substrate/"
  },
  {
   "id": "B05-02",
   "algo": "B05",
   "title": "substrate CLI（CityLAB Berlin）",
   "creator": "Fabian Morón Zirfas（Technologiestiftung Berlin／CityLAB Berlin）",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "為 CityLAB Berlin 開發的命令列工具，依 Tarbell 演算法產生 A0 尺寸的 SVG，可設定執行時間、最大裂紋數與最短線長過濾（1px = 1mm），用於輸出大型圖面或繪圖機。",
   "variations": [
    {
     "name": "最短線長過濾",
     "how": "輸出時跳過 TraveledLength 小於門檻的裂紋。",
     "effect": "去除碎線，繪圖機輸出更乾淨。"
    },
    {
     "name": "以時間控制",
     "how": "用 Stopwatch 限制總執行時間取代 MaxRounds。",
     "effect": "大尺寸時仍能在固定時間內得到結果。"
    },
    {
     "name": "紙張比例",
     "how": "把正方形改為 841×1189 矩形，格子依長寬各自切分。",
     "effect": "直接輸出 A 系列紙張圖面。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "隨機"
   ],
   "tools": [
    "Node.js",
    "SVG"
   ],
   "url": "https://github.com/technologiestiftung/substrate"
  },
  {
   "id": "B05-03",
   "algo": "B05",
   "title": "ARCH 430 Networked Technologies 課程中的 Substrate 研究",
   "creator": "ARCH 430 修課學習者",
   "year": "2012",
   "category": "urban-landscape",
   "categories_extra": [
    "drawing"
   ],
   "scale": "群體／都市",
   "summary": "建築系課程部落格記錄學習者研究 Tarbell 的 Substrate，觀察執行 1.5 小時後浮現類似都市格網的圖樣，並討論 Processing 作為建築設計工具的可能與限制。",
   "variations": [
    {
     "name": "正交化成都市格網",
     "how": "wobble 設 0 並把起始方向限制為 0°/90°。",
     "effect": "得到接近棋盤式都市的街廓。"
    },
    {
     "name": "街廓擠出",
     "how": "取得封閉區域後依面積 Extrude 不同高度。",
     "effect": "從 2D 圖樣變成 3D 城市量體。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "開放生長"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://networkedtechnologies.wordpress.com/tag/jared-tarbell/"
  },
  {
   "id": "B05-04",
   "algo": "B05",
   "title": "Substrate JavaScript 移植（CodePen）",
   "creator": "josazar（CodePen）",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "社群開發者將 Substrate 移植到瀏覽器的 CodePen 版本，可即時看到裂紋生長動畫，說明此演算法已成為生成藝術的經典練習題。",
   "variations": [
    {
     "name": "逐輪動畫",
     "how": "每次 RunScript 只跑少量輪次，狀態存為欄位並以 Timer 驅動。",
     "effect": "在 Rhino 視窗重現逐步生長。"
    },
    {
     "name": "點擊新增起點",
     "how": "新增輸入點清單，每個點產生一條新起始裂紋。",
     "effect": "使用者可以互動決定裂紋起源。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "動畫",
    "Timer"
   ],
   "tools": [
    "JavaScript"
   ],
   "url": "https://codepen.io/josazar/details/wvvRKyL"
  },
  {
   "id": "B05-05",
   "algo": "B05",
   "title": "Procedural Modeling of Cities（CityEngine 前身）",
   "creator": "Yoav I. H. Parish, Pascal Müller",
   "year": "2001",
   "category": "urban-landscape",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "群體／都市",
   "summary": "SIGGRAPH 2001 論文以擴充 L-System 生成街道網路，再切分街廓與地塊、以語法產生建築，後發展為 CityEngine。其「道路延伸、碰到既有道路就截止並接上」的規則與 Substrate 的撞停分岔邏輯相通，可作為對照。",
   "variations": [
    {
     "name": "撞到就接上",
     "how": "撞到別的裂紋時不是停在前一格，而是把終點吸附到被撞裂紋上的最近點。",
     "effect": "形成乾淨的 T 字路口，可直接轉成路網圖。"
    },
    {
     "name": "主次道路層級",
     "how": "起始裂紋視為主幹道（較長、線寬大），分岔世代越深越短越細。",
     "effect": "出現主要道路與巷弄的層級結構。"
    },
    {
     "name": "人口密度圖控制",
     "how": "以影像或吸引子決定分岔密度。",
     "effect": "市中心街廓小、郊區街廓大。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "字串改寫",
    "約束滿足",
    "多元件"
   ],
   "tools": [
    "CityEngine"
   ],
   "url": ""
  },
  {
   "id": "B05-06",
   "algo": "B05",
   "title": "Generating Surface Crack Patterns",
   "creator": "Hayley N. Iben, James F. O'Brien",
   "year": "2006",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "電腦圖學研究以表面應力場驅動裂紋在網格表面上生長，用來產生泥土、陶瓷釉面、老化油漆等真實裂紋。相較 Substrate 的純幾何規則，它以物理應力決定方向，是進階比較對象。",
   "variations": [
    {
     "name": "應力場決定方向",
     "how": "給一個向量場（例如收縮中心的放射方向），分岔方向改成垂直於該點的主應力方向。",
     "effect": "裂紋更像乾裂與收縮造成的真實紋路。"
    },
    {
     "name": "曲面 UV 上生長",
     "how": "在網格或曲面 UV 空間執行並映射回 3D。",
     "effect": "裂紋貼附在 3D 物件表面。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "曲面上",
    "物理模擬"
   ],
   "tools": [],
   "url": ""
  },
  {
   "id": "B05-07",
   "algo": "B05",
   "title": "乾裂泥土圖樣",
   "creator": "自然現象",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "地景",
   "summary": "泥土乾燥收縮時先出現的裂紋會成為後來裂紋的邊界，因此多形成 T 字接頭且後生裂紋常垂直於前者，與 Substrate「依序生長、撞停、垂直分岔」的規則高度吻合，是很好的觀察對照。",
   "variations": [
    {
     "name": "垂直角度加大抖動",
     "how": "wobble 從 ±5 度放大到 ±20 度並加入彎曲。",
     "effect": "更接近自然泥裂的不規則多邊形。"
    },
    {
     "name": "多層尺度",
     "how": "先用少量裂紋切出大塊，再在每塊內以小尺度重跑一次。",
     "effect": "出現大裂縫套小裂縫的階層感。"
    },
    {
     "name": "地景鋪面",
     "how": "碎片向內 Offset 成鋪面板，縫隙當植栽帶。",
     "effect": "做出仿泥裂的景觀鋪面。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "隨機",
    "拼貼"
   ],
   "tools": [],
   "url": ""
  },
  {
   "id": "B05-08",
   "algo": "B05",
   "title": "哥窯開片（冰裂紋釉）",
   "creator": "宋代哥窯（傳統陶瓷工藝）",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "釉與胎體收縮率不同，冷卻時釉面產生開片裂紋，並可能以大小兩層紋路呈現（俗稱金絲鐵線）。這是材料物理造成的裂紋圖樣，可用 Substrate 加彎曲與多世代線寬來模擬其視覺。",
   "variations": [
    {
     "name": "雙層紋路",
     "how": "第一輪少量粗裂紋（線寬大、深色），第二輪在碎片內跑大量細裂紋（線寬小、淺色）。",
     "effect": "呈現大開片中有小開片的層次。"
    },
    {
     "name": "器物曲面上",
     "how": "在旋轉曲面的 UV 空間生成裂紋並映射回瓶身。",
     "effect": "得到可雕刻或轉印的器物紋樣。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "曲面上",
    "隨機"
   ],
   "tools": [],
   "url": ""
  },
  {
   "id": "B05-09",
   "algo": "B05",
   "title": "Voronoi 碎裂（Cell Fracture／RBD Material Fracture）",
   "creator": "Blender Cell Fracture 外掛、Houdini RBD Material Fracture",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "3D 軟體常用 Voronoi 分割把物件打碎做破壞模擬。Voronoi 是同時分割、接頭多為 Y 字，與 Substrate 依序生長的 T 字接頭形態不同，適合當作兩種裂紋機制的比較教材。",
   "variations": [
    {
     "name": "Substrate 取代 Voronoi 切割",
     "how": "以 Substrate 產生的封閉碎片作為切割面，對實體做 Brep.Split。",
     "effect": "得到更像乾裂、層次化的碎裂。"
    },
    {
     "name": "混合",
     "how": "先 Voronoi 切大塊，再在每塊內跑 Substrate。",
     "effect": "結合兩種裂紋特徵的碎片。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "拼貼",
    "3D"
   ],
   "tools": [
    "Blender",
    "Houdini"
   ],
   "url": ""
  },
  {
   "id": "B05-10",
   "algo": "B05",
   "title": "金繼（Kintsugi）",
   "creator": "日本傳統修補工藝",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "以漆與金粉修補破碎陶瓷，讓裂縫成為視覺焦點。可作為 Substrate 輸出「裂紋即裝飾」的延伸：用演算法決定裂紋，再以數位製造（CNC 刻溝、金屬填縫）實現。",
   "variations": [
    {
     "name": "裂紋轉刻溝刀路",
     "how": "把裂紋線段依世代給不同深度，輸出成 CNC 刻溝刀路。",
     "effect": "在木板或石材上刻出裂紋溝槽可再填金屬或樹脂。"
    },
    {
     "name": "碎片化拼板",
     "how": "取得封閉碎片後向內 Offset 留縫並編號。",
     "effect": "做成可拼回的碎片桌面或牆板，縫隙填色。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "拼貼"
   ],
   "tools": [],
   "url": ""
  },
  {
   "id": "B05-11",
   "algo": "B05",
   "title": "油畫龜裂（Craquelure）",
   "creator": "藝術品保存研究（自然老化現象）",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "油畫顏料與底層隨時間收縮產生的細密龜裂網，形態與畫布張力方向相關，是修復與鑑定研究的對象。用 Substrate 加方向偏好可以模擬不同畫布的龜裂風格，作為繪圖表現的肌理。",
   "variations": [
    {
     "name": "方向偏好",
     "how": "起始方向與分岔方向加入偏好軸（例如畫布經緯向），抖動只在偏好軸附近。",
     "effect": "出現有方向性的長方形龜裂。"
    },
    {
     "name": "疊加於影像",
     "how": "裂紋輸出成細線，疊在渲染圖或照片上做老化效果。",
     "effect": "取得手繪老化質感的圖面。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "影像輸入",
    "隨機"
   ],
   "tools": [],
   "url": ""
  },
  {
   "id": "B05-12",
   "algo": "B05",
   "title": "Substrate 生長過程影片",
   "creator": "Vimeo 影片（上傳者未確認；原作 Jared Tarbell）",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Vimeo 上的 Substrate 動態記錄，呈現裂紋逐步延伸、分岔、填滿畫面的時間過程，說明此演算法本身的生長過程就是作品，而不只是最終靜態圖。",
   "variations": [
    {
     "name": "Timer 動態呈現",
     "how": "將狀態改存欄位，每次 Timer 觸發只推進一輪並輸出已走過的線段。",
     "effect": "在 Rhino 中錄製生長動畫。"
    },
    {
     "name": "投影裝置",
     "how": "把輸出即時投影到牆面或地面，觀眾位置作為新起點輸入。",
     "effect": "成為互動式裂紋投影裝置。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "動畫",
    "Timer"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://vimeo.com/208903786"
  },
  {
   "id": "B05-51",
   "algo": "B05",
   "title": "Substrate",
   "creator": "Jared Tarbell",
   "year": "2003",
   "category": "drawing",
   "categories_extra": [
    "urban-landscape",
    "2d-pattern"
   ],
   "scale": "群體／都市",
   "summary": "Jared Tarbell 以 Processing 創作的經典作品：裂紋像晶體一樣在計算「基底」上直線前進，碰到其他裂紋或邊界就停下，並從既有裂紋上以垂直方向分岔出新裂紋，簡單規則長出像城市街廓的結構，沿裂紋再加上類似水彩的「沙畫」上色。作者頁面也展示了允許裂紋彎曲的非線性版本。",
   "variations": [
    {
     "name": "沙畫上色",
     "how": "每條裂紋一側沿垂直方向隨機取樣，以極低透明度畫點",
     "effect": "街廓內出現水彩般的漸層色塊"
    },
    {
     "name": "曲線裂紋",
     "how": "讓裂紋前進方向每步加上微小角度變化",
     "effect": "結構更不規則，獨立區塊會以複雜方式互相合併"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Processing",
    "生成藝術",
    "經典作品"
   ],
   "tools": [
    "Processing"
   ],
   "url": "http://www.complexification.net/gallery/machines/substrate/",
   "image": {
    "file": "img/cases/B05-51.jpg",
    "w": 780,
    "h": 580,
    "source": "complexification.net",
    "author": "Jared Tarbell",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "http://www.complexification.net/gallery/machines/substrate/",
    "note": "Substrate 作品頁主圖，城市街廓般的裂紋與沙畫上色"
   }
  },
  {
   "id": "B05-52",
   "algo": "B05",
   "title": "Substrate（p5.js 移植版）",
   "creator": "Tom White（dribnet）",
   "year": "2021",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "群體／都市",
   "summary": "Tom White 把 Tarbell 的 Processing 原始碼移植到 p5.js，並刻意盡量少改原程式，repo 中同時保留原始 .pde 檔以便對照。滑鼠按下即重新開始生長。適合用來對照 Processing 與 p5.js 的語法差異，以及把本圖鑑的 C# 版本移植到網頁。",
   "variations": [
    {
     "name": "原版與移植並排對照",
     "how": "逐函式比對 substrate.pde 與 substrate.js",
     "effect": "理解從 Java 語法轉到 JavaScript 的最小改動"
    },
    {
     "name": "更換色盤",
     "how": "原作色盤取自 Pollock 畫作，改換成自訂調色盤圖片",
     "effect": "同樣的結構呈現完全不同的氛圍"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "移植",
    "開源"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://github.com/dribnet/substrate",
   "image": {
    "file": "img/cases/B05-52.jpg",
    "w": 900,
    "h": 506,
    "source": "GitHub Pages（dribnet/substrate）",
    "author": "Tom White",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://dribnet.github.io/substrate/",
    "note": "p5.js 移植版的預覽圖"
   }
  },
  {
   "id": "B05-53",
   "algo": "B05",
   "title": "substrate CLI（繪圖機用 SVG 產生器）",
   "creator": "Fabian Morón Zirfas（Technologiestiftung Berlin／CityLAB Berlin）",
   "year": "2019",
   "category": "fabrication",
   "categories_extra": [
    "drawing"
   ],
   "scale": "群體／都市",
   "summary": "為 CityLAB Berlin 撰寫的命令列工具，以 Tarbell 的 Substrate 演算法產生 SVG，可指定模擬時間、紙張寬高與最大裂紋數，輸出給繪圖機（plotter）畫出。相較於原作的像素渲染，它只保留裂紋的向量線，直接作為製造輸出。",
   "variations": [
    {
     "name": "以紙張尺寸設定畫布",
     "how": "用 --width 841 --height 1189（A0 公釐）設定畫布",
     "effect": "輸出尺寸與實體紙張一致，可直接上繪圖機"
    },
    {
     "name": "限制裂紋數與時間",
     "how": "調整 --maxcracks 與 --duration",
     "effect": "控制線條密度與繪圖時間"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "JavaScript",
    "Node.js",
    "SVG",
    "繪圖機"
   ],
   "tools": [
    "Node.js"
   ],
   "url": "https://github.com/technologiestiftung/substrate",
   "image": {
    "file": "img/cases/B05-53.jpg",
    "w": 502,
    "h": 502,
    "source": "GitHub（technologiestiftung/substrate）README",
    "author": "Fabian Morón Zirfas",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://github.com/technologiestiftung/substrate",
    "note": "CLI 輸出的 Substrate 向量線稿"
   }
  },
  {
   "id": "B05-54",
   "algo": "B05",
   "title": "Substrate iPad 移植版",
   "creator": "Jon Cooper",
   "year": "2011",
   "category": "drawing",
   "categories_extra": [
    "performance"
   ],
   "scale": "群體／都市",
   "summary": "Jon Cooper 把 Tarbell 的 Substrate 移植到 iPad，作為學習 iOS 開發與 OpenGL 的練習。由於 iOS 沒有直接的 2D 點陣繪圖，作者自己寫了繪製層：先渲染到貼圖再貼到四邊形上，並實作反鋸齒線條與顏色混合，裂紋由另一條執行緒寫入貼圖。以 MIT 授權釋出。",
   "variations": [
    {
     "name": "渲染到貼圖",
     "how": "裂紋與沙畫點先累積寫入一張貼圖，每幀只把貼圖畫到螢幕",
     "effect": "在行動裝置上也能保留累積繪圖的效果"
    },
    {
     "name": "計算與繪製分離",
     "how": "以獨立執行緒更新裂紋，主執行緒只負責顯示",
     "effect": "生長持續進行而畫面保持流暢"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "Objective-C",
    "OpenGL",
    "iOS",
    "移植"
   ],
   "tools": [
    "Objective-C",
    "OpenGL"
   ],
   "url": "https://github.com/joncooper/Substrate"
  },
  {
   "id": "C01-01",
   "algo": "C01",
   "title": "Reaction Jewelry 反應擴散珠寶系列",
   "creator": "Nervous System",
   "year": "2023",
   "category": "fabrication",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "從一對客製婚戒發展出的整個珠寶系列，戒指、莫比烏斯環、貝殼形耳環表面布滿 RD 生成的凹凸脊谷，以不鏽鋼、銀、黃銅金屬 3D 列印。RD 在平面上模擬，再包覆到環形；莫比烏斯款利用「兩面各一份花紋等於兩倍長的環」的性質避開非定向曲面的模擬。",
   "variations": [
    {
     "name": "週期邊界→無縫環帶",
     "how": "範例已有左右相接的週期邊界，把網格改成長方形（寬 = 周長、高 = 戒寬），只保留左右相接、上下改為固定邊界。",
     "effect": "攤平的花紋繞成環時接縫看不出來。"
    },
    {
     "name": "B 濃度→徑向位移",
     "how": "把輸出點映射到圓柱座標，半徑 = r0 + B × depth，重建封閉 Mesh 後加厚。",
     "effect": "得到可直接送金屬列印的浮雕戒指。"
    },
    {
     "name": "莫比烏斯雙倍長度",
     "how": "網格長度設為兩倍周長並週期相接，映射到莫比烏斯帶時前半貼正面、後半貼反面。",
     "effect": "花紋在單面曲面上連續不斷。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "網格擴散",
    "週期邊界",
    "曲面上",
    "3D 列印"
   ],
   "tools": [
    "客製模擬軟體",
    "金屬 3D 列印"
   ],
   "url": "https://n-e-r-v-o-u-s.com/blog/?p=9442"
  },
  {
   "id": "C01-02",
   "algo": "C01",
   "title": "Reaction Lamps 反應擴散燈具",
   "creator": "Nervous System",
   "year": "2010",
   "category": "fabrication",
   "categories_extra": [
    "performance",
    "art-installation"
   ],
   "scale": "物件",
   "summary": "以 Processing 自寫的 RD 模擬，讓一顆球「長」成有雕刻感的燈罩，再以 SLS 選擇性雷射燒結列印。Seed 系列同時疊加大尺度（整體起伏）與小尺度（壁厚變化）兩層 RD，點燈時薄處透光形成細胞紋理。",
   "variations": [
    {
     "name": "兩層尺度疊加",
     "how": "跑兩次 RD：第一次用較大的 DiffusionRate 比值控制整體起伏，第二次用小尺度參數，結果分別對應法向位移與壁厚。",
     "effect": "遠看有地形起伏、近看有細胞紋理。"
    },
    {
     "name": "B 濃度→壁厚（透光控制）",
     "how": "把 valuesB 轉成每個頂點的 offset 距離（例 0.8–2.5 mm），內外兩層 Mesh 縫合成實體。",
     "effect": "點燈時厚處暗、薄處亮，花紋由光顯現。"
    },
    {
     "name": "球面上的 RD",
     "how": "改用 Mesh 頂點鄰居版本（見演算法變形「Mesh 上的反應擴散」）直接在球面網格上模擬。",
     "effect": "花紋在球面上均勻分布，沒有極點擠壓。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "曲面上",
    "網格擴散",
    "多尺度",
    "3D 列印"
   ],
   "tools": [
    "Processing",
    "SLS 3D 列印"
   ],
   "url": "https://n-e-r-v-o-u-s.com/blog/?p=1009"
  },
  {
   "id": "C01-03",
   "algo": "C01",
   "title": "Coral Cup 珊瑚杯（瓷器）",
   "creator": "Nervous System（陶藝：Kevin Cieplensky）",
   "year": "2018",
   "category": "fabrication",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "受腦珊瑚啟發的瓷杯，表面深溝般的蜿蜒脊谷由 RD 生成，調整反應速率、尺度與擴散方向可得不同花紋。製程為 3D 列印原型→矽膠翻模→石膏模→注漿成型，分模線刻意對齊花紋脊線。",
   "variations": [
    {
     "name": "調整擴散方向",
     "how": "在 DiffusionAmount 中讓垂直方向權重大於水平方向，使迷宮紋沿杯身高度方向拉長。",
     "effect": "脊谷呈現由下往上流動的方向感。"
    },
    {
     "name": "迷宮參數＋高度場",
     "how": "使用 feed 0.055／kill 0.062（範例預設迷宮）並把 B 轉為法向凹陷深度。",
     "effect": "得到腦珊瑚般連續溝槽，適合翻模脫模。"
    },
    {
     "name": "分模線對齊花紋",
     "how": "在輸出階段找 B 值峰線（等值線）作為候選分模線，選最接近幾何分割位置的一條。",
     "effect": "翻模接縫藏在脊線上，後處理最省工。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "網格擴散",
    "各向異性",
    "翻模",
    "曲面上"
   ],
   "tools": [
    "客製模擬軟體",
    "3D 列印",
    "注漿成型"
   ],
   "url": "https://n-e-r-v-o-u-s.com/blog/?p=8222"
  },
  {
   "id": "C01-04",
   "algo": "C01",
   "title": "New Balance Kawhi Leonard 球鞋 RD 花紋合作",
   "creator": "Nervous System × New Balance",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "Nervous System 在其 Reaction Jewelry 文章中提到與 New Balance 合作，將 RD 花紋用在 Kawhi Leonard 系列球鞋上，是 RD 圖樣進入量產產品設計的例子。",
   "variations": [
    {
     "name": "遮罩邊界",
     "how": "把鞋面版型輪廓當成封閉曲線遮罩，只在輪廓內部模擬。",
     "effect": "花紋貼合版型、邊緣自然收尾。"
    },
    {
     "name": "吸引子控制密度",
     "how": "依據鞋面需要支撐的區域設吸引子，靠近時 kill 值調低讓 B 條紋變粗。",
     "effect": "花紋同時具有裝飾與局部加強的功能暗示。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "吸引子控制",
    "網格擴散",
    "產品設計"
   ],
   "tools": [],
   "url": "https://www.newbalance.com/pd/kawhi/BBKLSQUA-D-10.html"
  },
  {
   "id": "C01-05",
   "algo": "C01",
   "title": "Reaction-Diffusion Tutorial 與 RD Tool",
   "creator": "Karl Sims",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "最常被引用的 Gray-Scott 圖解教學：本課範例的 DA=1.0、DB=0.5、f=0.055、k=0.062 與 3×3 卷積權重（中心 −1、上下左右 0.2、斜角 0.05）都出自此頁。另提供 k–f 參數圖與線上 RD Tool 互動實驗。",
   "variations": [
    {
     "name": "參數圖網格",
     "how": "外層再包一個 for 迴圈，讓每一塊子網格使用不同的 (kill, feed)，kill 沿 x 從 0.045 到 0.07、feed 沿 y 從 0.01 到 0.1。",
     "effect": "一次在 GH 裡生成整張「花紋型錄」，方便學習者挑參數。"
    },
    {
     "name": "改變反應／擴散速度比",
     "how": "把 const DiffusionRateA／B 改為輸入，或在 reaction 前乘一個 timeScale。",
     "effect": "同一種花紋的尺度放大或縮小。"
    },
    {
     "name": "A、B 雙色上色",
     "how": "BuildColoredMesh 中同時讀 A 與 B，用 Color 內插兩種顏色而非單純灰階。",
     "effect": "視覺表現更豐富，可直接做海報圖像。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "網格擴散",
    "參數探索"
   ],
   "tools": [
    "網頁互動工具"
   ],
   "url": "https://karlsims.com/rd.html"
  },
  {
   "id": "C01-06",
   "algo": "C01",
   "title": "Complex Patterns in a Simple System（Gray-Scott 參數圖）",
   "creator": "John E. Pearson",
   "year": "1993",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Pearson 以數值模擬系統性掃描 Gray-Scott 模型的 (F, k) 平面，發現十餘種不同的時空圖樣類型（斑點分裂、條紋、混沌等），並指出擴散係數相等時不會出現花紋。是理解範例中 feed／kill 為何如此敏感的經典依據。",
   "variations": [
    {
     "name": "小擾動初始條件",
     "how": "INIT 時在中央種子加上 ±1% 的隨機雜訊（Random 加可重現種子）。",
     "effect": "打破對稱，讓花紋更接近論文中的不規則圖樣。"
    },
    {
     "name": "擴散係數相等對照組",
     "how": "把 DiffusionRateB 設成 1.0 與 A 相同，比較結果。",
     "effect": "花紋消失，親眼驗證「擴散速度差」是圖樣形成的必要條件。"
    },
    {
     "name": "時間序列輸出",
     "how": "每 N 步把 B 陣列複製存到 DataTree 的一個分支。",
     "effect": "觀察斑點自我複製（細胞分裂）的過程。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "網格擴散",
    "混沌",
    "參數探索",
    "DataTree"
   ],
   "tools": [
    "數值模擬"
   ],
   "url": "https://arxiv.org/abs/patt-sol/9304003"
  },
  {
   "id": "C01-07",
   "algo": "C01",
   "title": "Generating Textures on Arbitrary Surfaces Using Reaction-Diffusion",
   "creator": "Greg Turk",
   "year": "1991",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "SIGGRAPH 91 論文，直接在任意 3D 模型表面上模擬 RD，讓紋理貼合幾何而不需 UV 展開；並用多個 RD 系統級聯（先鋪底圖再細化）生成花豹玫瑰斑、長頸鹿網紋等。",
   "variations": [
    {
     "name": "網格→Mesh 頂點",
     "how": "把二維陣列換成頂點陣列，鄰居用 Mesh 拓樸取得，擴散量改為鄰居平均減自己。",
     "effect": "花紋直接長在任意曲面上。"
    },
    {
     "name": "級聯 RD",
     "how": "第一次模擬結果二值化成遮罩，第二次模擬只在遮罩內（或邊緣）進行，參數不同。",
     "effect": "產生斑中有斑、網狀邊框等複合圖樣。"
    },
    {
     "name": "B→凹凸貼圖",
     "how": "把 B 值沿頂點法向量位移。",
     "effect": "由紋理變成真實的表面起伏。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "曲面上",
    "多階段",
    "網格擴散"
   ],
   "tools": [
    "C",
    "電腦圖學"
   ],
   "url": "https://sites.cc.gatech.edu/home/turk/reaction_diffusion/reaction_diffusion.html"
  },
  {
   "id": "C01-08",
   "algo": "C01",
   "title": "三角網格上的反應擴散（花瓶與兔子）",
   "creator": "Laurent Delrieu",
   "year": "2015",
   "category": "modeling",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "在 Grasshopper 論壇分享以 Kangaroo 重新網格化、再在 40 萬個三角面的花瓶上跑 RD 的流程；拉普拉斯改用相鄰頂點的正規化權重。後來以自寫 C# 取代 Sandbox 拓樸運算，速度提升約 14 倍；兔子模型示範調整 B 擴散係數改變花紋尺度。",
   "variations": [
    {
     "name": "預先建鄰居表",
     "how": "迴圈前先把每個頂點的鄰居索引存成 int[][]，模擬時只查表，不在每步重算拓樸。",
     "effect": "大幅加速，讓數十萬頂點的 Mesh 也跑得動。"
    },
    {
     "name": "正規化鄰居權重",
     "how": "每個頂點鄰居數不同，擴散量改為 (Σ鄰居 / 鄰居數) − 自己。",
     "effect": "三角網格上花紋尺度均勻，不因頂點度數不同而失真。"
    },
    {
     "name": "調 B 擴散係數控制尺度",
     "how": "把 DiffusionRateB 從 0.4 往 0.1 調整並配合網格密度。",
     "effect": "在同一模型上得到粗細不同的花紋。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "曲面上",
    "鄰居搜尋",
    "網格擴散",
    "效能最佳化"
   ],
   "tools": [
    "Grasshopper",
    "Kangaroo",
    "C#"
   ],
   "url": "https://www.grasshopper3d.com/forum/topics/reaction-diffusion-on-triangular-mesh"
  },
  {
   "id": "C01-09",
   "algo": "C01",
   "title": "把反應擴散變成曲線（Nautilus iso-split）",
   "creator": "McNeel 論壇討論（Laurent Delrieu、Peter Davis 等）",
   "year": "2023",
   "category": "drawing",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "使用者詢問如何把 RD 結果輸出成曲線而不是密集 Mesh；回覆建議用 Nautilus 外掛的 RD 元件與 Mesh 等值切割，再用 Catmull-Clark 細分平滑；另有人結合 Kangaroo 的圓堆積非均勻網格與自寫 C# 做六角形 RD 花紋。",
   "variations": [
    {
     "name": "等值切割輸出曲線",
     "how": "把 coloredMesh 的頂點 Z 設為 B，用 Mesh 等高線在固定高度切出輪廓，或接 C05 Marching Squares。",
     "effect": "得到可雷射切割、可繪圖機描繪的封閉曲線。"
    },
    {
     "name": "細分平滑",
     "how": "等值切割前先把 Mesh 做 1–2 次細分（或先放大 gridSize 再降採樣）。",
     "effect": "曲線鋸齒消失，邊緣呈圓滑有機形。"
    },
    {
     "name": "非均勻網格",
     "how": "用圓堆積點建立三角網格代替正方格，RD 改為頂點鄰居版本。",
     "effect": "花紋密度隨網格密度變化，並出現六角形排列傾向。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "等值面",
    "網格擴散",
    "多元件"
   ],
   "tools": [
    "Grasshopper",
    "Nautilus",
    "Kangaroo",
    "C#"
   ],
   "url": "https://discourse.mcneel.com/t/reaction-diffusion-curves/160082"
  },
  {
   "id": "C01-10",
   "algo": "C01",
   "title": "以各向異性反應擴散生成等應力肋板樓板",
   "creator": "",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "研究以各向異性 RD 系統設計等應力（isostatic）肋板樓板：系統會自發沿主應力與彎矩場形成條紋，條紋再轉成加勁肋，並可調控肋的密度與厚度。是 RD 從裝飾走向結構性能的代表。",
   "variations": [
    {
     "name": "應力方向場→各向異性擴散",
     "how": "每格讀入一個主應力方向向量，把 3×3 權重沿該方向加大、垂直方向減小。",
     "effect": "條紋自動順著應力線排列。"
    },
    {
     "name": "彎矩大小→kill 地圖",
     "how": "彎矩大處降低 kill，使 B 條紋變粗變密。",
     "effect": "受力大的區域肋較密較厚，材料分配更有效率。"
    },
    {
     "name": "條紋→肋板實體",
     "how": "等值線取 B 條紋中線後 Extrude 成肋高，肋高可再依應力值變化。",
     "effect": "輸出可模板或 3D 列印模具施工的肋板幾何。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "各向異性",
    "最佳化",
    "結構",
    "網格擴散"
   ],
   "tools": [],
   "url": "https://www.researchgate.net/publication/372165602_Generative_design_of_isostatic_ribbed_slabs_using_anisotropic_Reaction-Diffusion"
  },
  {
   "id": "C01-11",
   "algo": "C01",
   "title": "Turing 圖樣設計的充氣變形結構",
   "creator": "Masato Tanaka、S. Macrae Montgomery、Liang Yue、Yaochi Wei、Yuyang Song、Tsuyoshi Nomura、H. Jerry Qi",
   "year": "2023",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "發表於 Science Advances。先以最佳化求出各處材料的各向異性分布，再用 Turing 圖樣把它轉成只有兩種材料的離散分布，以灰階 DLP 3D 列印製作，充氣後可變形為指定形狀。",
   "variations": [
    {
     "name": "方向場驅動條紋",
     "how": "以最佳化得到的材料方向作為每格的擴散主方向（各向異性權重）。",
     "effect": "條紋方向即為剛性方向，控制膨脹時的彎曲方式。"
    },
    {
     "name": "二值化成兩種材料",
     "how": "B 大於門檻者標為硬材料、其餘為軟材料，輸出兩組 Mesh 分別指定材質。",
     "effect": "可直接交給多材料列印。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "各向異性",
    "最佳化",
    "多材料",
    "3D 列印"
   ],
   "tools": [
    "有限元素分析",
    "DLP 3D 列印"
   ],
   "url": "https://www.science.org/doi/10.1126/sciadv.ade4381"
  },
  {
   "id": "C01-12",
   "algo": "C01",
   "title": "具 Turing 圖樣紋理的織物氣動致動器",
   "creator": "Masato Tanaka、Yuyang Song、Tsuyoshi Nomura",
   "year": "2024",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "構件",
   "summary": "發表於 Scientific Reports。以方向最佳化結合殼元素分析求出材料方向，再以各向異性 RD 生成 Turing 紋理；製作時雷射切割 Dyneema 硬布熱壓到 TPU 軟布，或以 Kevlar 線刺繡，做出 C 形、S 形彎曲與扭轉的充氣元件。",
   "variations": [
    {
     "name": "紋理→雷射切割路徑",
     "how": "B 等值線輸出為封閉曲線，按圖層分為切割線，供硬布切割後熱壓。",
     "effect": "平面織物獲得可程式化的變形行為。"
    },
    {
     "name": "紋理→刺繡／縫紉路徑",
     "how": "取 B 條紋的中心線（骨架）轉成連續 Polyline 作為刺繡針跡。",
     "effect": "用縫線形成剛性條紋，可做軟性建築構件或可展開遮蔽。"
    },
    {
     "name": "局部方向切換",
     "how": "把網格分區，各區指定不同擴散方向（如 0°、45°）。",
     "effect": "同一片布上產生彎曲與扭轉兩種變形。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "各向異性",
    "紡織",
    "軟性結構"
   ],
   "tools": [
    "有限元素分析",
    "雷射切割",
    "刺繡"
   ],
   "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11333703/"
  },
  {
   "id": "C01-13",
   "algo": "C01",
   "title": "Morphogenetic Metasurfaces：以 Turing 圖樣設計天線超表面",
   "creator": "Thomas Fromenteze、Okan Yurduseven、Chidinma Uche、Eric Arnaud、David R. Smith、Cyril Decroze",
   "year": "2023",
   "category": "performance",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "立面／表皮",
   "summary": "發表於 Nature Communications。把 Turing 反應擴散模型加入各向異性擴散，讓橢圓形單元自組織排列以滿足局部電磁需求，程序化生成可控制波束方向與極化的超表面，不需手工排版網格。",
   "variations": [
    {
     "name": "目標場→局部參數",
     "how": "以每格需要的性能值（本案為電磁相位；建築上可換成遮光率）決定該格的擴散方向與 feed。",
     "effect": "花紋同時是圖樣也是性能分布。"
    },
    {
     "name": "斑點→單元幾何",
     "how": "把每個 B 斑點抽成輪廓後擬合橢圓，記錄長軸方向。",
     "effect": "得到可製造、方向各異的離散單元，可類比為立面開孔。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "各向異性",
    "性能導向",
    "自組織"
   ],
   "tools": [
    "數值模擬",
    "電磁模擬"
   ],
   "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10558543/"
  },
  {
   "id": "C01-14",
   "algo": "C01",
   "title": "以各向異性反應擴散做影像風格化",
   "creator": "Ming-Te Chi、Wei-Ching Liu、Shu-Hsuan Hsu",
   "year": "2016",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "發表於 The Visual Computer。把照片轉成 RD 自組織圖樣：以各向異性擴散與流場引導花紋方向，搭配邊緣偵測、分區與門檻、上色後處理，產生剪紙、風格化網點、運動錯視等效果；GitHub 公開實作。",
   "variations": [
    {
     "name": "影像灰階→feed／kill 地圖",
     "how": "讀取影像每個像素的亮度，內插成每格的 kill 值（暗處斑點密、亮處稀疏）。",
     "effect": "RD 花紋「畫」出照片，類似網點印刷。"
    },
    {
     "name": "影像梯度→擴散方向",
     "how": "計算影像亮度梯度，取其垂直方向作為各向異性擴散主方向。",
     "effect": "條紋沿著物體輪廓流動，像版畫筆觸。"
    },
    {
     "name": "門檻二值化輸出",
     "how": "B>門檻輸出黑色面、其餘挖空，轉成曲線。",
     "effect": "得到可雷射切割的剪紙或鏤空板。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "影像輸入",
    "各向異性",
    "網格擴散"
   ],
   "tools": [
    "C++",
    "GitHub 開源"
   ],
   "url": "https://github.com/cglabnccu/stylizationRD"
  },
  {
   "id": "C01-15",
   "algo": "C01",
   "title": "Red Blob Games 互動反應擴散（WebGL）",
   "creator": "Amit Patel（Red Blob Games）",
   "year": "2019",
   "category": "drawing",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "依 Karl Sims 公式寫成的 WebGL 即時互動頁面，可調 feed／kill，也可用滑鼠或觸控在畫布上塗抹干擾系統；作者提到受 Jonathan McCabe 多尺度 Turing 圖樣作品啟發。適合當作互動裝置或教學展示的原型。",
   "variations": [
    {
     "name": "即時互動（Timer＋繪製輸入）",
     "how": "把陣列存為 class 欄位，搭配 Timer 每次跑數步；新增一組 Point3d 輸入，每步把這些點附近格子的 B 設為 1。",
     "effect": "在 Rhino 中用滑鼠點（或感測器資料）即時「畫」出花紋。"
    },
    {
     "name": "GPU 加速概念",
     "how": "理解每格只依賴上一步鄰居、彼此獨立，可先用 Parallel.For 平行化最外層 row 迴圈。",
     "effect": "大網格也能流暢動畫，為投影裝置做準備。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "動畫",
    "Timer",
    "互動",
    "網格擴散"
   ],
   "tools": [
    "WebGL",
    "JavaScript"
   ],
   "url": "https://www.redblobgames.com/x/1905-reaction-diffusion"
  },
  {
   "id": "C01-51",
   "algo": "C01",
   "title": "Coding Challenge #13：Reaction Diffusion Algorithm in p5.js",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2016",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以 p5.js 逐像素實作 Gray-Scott 反應擴散：兩個二維陣列存 A、B 濃度，用 3×3 卷積核算拉普拉斯，再把結果寫回畫布像素。邏輯和 Grasshopper C# 基礎範例相同，但輸出直接是即時動畫的像素，而不是網格點或曲面，適合先看懂 feed／kill 參數怎麼改變圖樣。",
   "variations": [
    {
     "name": "雙緩衝交換",
     "how": "把基礎範例的更新改成 grid／next 兩個陣列，每幀算完後交換參照，不在同一個陣列上就地寫入",
     "effect": "避免更新順序造成的方向性偏差，圖樣更對稱"
    },
    {
     "name": "直接寫像素",
     "how": "不輸出點或網格，改為把 A−B 映射成灰階後寫入點陣圖（GH 裡可用 Bitmap 或 Mesh 頂點色）",
     "effect": "解析度可以拉高，觀察斑點、條紋的生成過程"
    },
    {
     "name": "改變初始種子",
     "how": "把中央一小塊 B=1 的初始條件改成數個隨機方塊或文字形狀",
     "effect": "圖樣從多個起點向外長，彼此相遇後形成邊界"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "JavaScript",
    "Gray-Scott",
    "教學影片",
    "動畫"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://thecodingtrain.com/challenges/13-reaction-diffusion",
   "image": {
    "file": "img/cases/C01-51.jpg",
    "w": 600,
    "h": 600,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/13-reaction-diffusion",
    "note": "挑戰頁預覽圖：紫黃相間的反應擴散迷宮紋"
   }
  },
  {
   "id": "C01-52",
   "algo": "C01",
   "title": "Reaction-Diffusion Playground 反應擴散遊樂場",
   "creator": "Jason Webb",
   "year": "2020",
   "category": "2d-pattern",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "瀏覽器上的互動式反應擴散模擬：用 three.js 的 data texture 當格點，GLSL 片段著色器以 ping-pong 方式每幀迭代多次，再由另一個著色器把濃度映射成顏色。提供 f、k、dA、dB 參數、筆刷、預設樣式與可空間變化的參數地圖，比 Grasshopper 的 CPU 迴圈快上數個量級。",
   "variations": [
    {
     "name": "GPU ping-pong",
     "how": "把基礎範例的雙重 for 迴圈搬進片段著色器，兩張 render target 輪流讀寫，一幀迭代數十次",
     "effect": "可即時跑到螢幕解析度，互動時幾乎無延遲"
    },
    {
     "name": "參數隨空間變化",
     "how": "f、k 不再是常數，而是讀一張灰階圖或依座標內插取得",
     "effect": "同一畫面中由斑點漸變為迷宮紋，可當立面材質漸層的草圖"
    },
    {
     "name": "外部圖像當種子",
     "how": "把圖片或文字的亮度寫入初始 B 濃度",
     "effect": "反應擴散沿著既有圖形生長，形成有字形或輪廓的紋理"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "three.js",
    "GLSL",
    "WebGL",
    "互動",
    "Gray-Scott"
   ],
   "tools": [
    "three.js",
    "GLSL"
   ],
   "url": "https://github.com/jasonwebb/reaction-diffusion-playground",
   "image": {
    "file": "img/cases/C01-52.jpg",
    "w": 900,
    "h": 439,
    "source": "GitHub jasonwebb/reaction-diffusion-playground",
    "author": "Jason Webb",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://github.com/jasonwebb/reaction-diffusion-playground",
    "note": "README 中的 12 張模擬截圖拼貼"
   }
  },
  {
   "id": "C01-53",
   "algo": "C01",
   "title": "Gray-Scott Reaction Diffusion in TouchDesigner（Part 1）",
   "creator": "Lake Heckaman",
   "year": "2024",
   "category": "performance",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "TouchDesigner 教學影片：用 GLSL 著色器在 GPU 上模擬 Gray-Scott 系統，說明數學基礎、著色器實作、無縫拼接（tiling），以及如何用任意色盤替模擬上色。和 Grasshopper 的離線計算不同，這是即時視覺表演的做法，模擬結果可直接接到其他影像節點或互動輸入。",
   "variations": [
    {
     "name": "Feedback 迴圈",
     "how": "把基礎範例的「迭代 N 次後輸出」改成每幀讀上一幀結果再算一次（TD 的 Feedback TOP，GH 可用計時器或 Anemone 迴圈）",
     "effect": "圖樣持續演化，可做成現場投影"
    },
    {
     "name": "無縫拼接",
     "how": "取鄰格時座標取餘數（環狀邊界），不讓邊緣固定為 0",
     "effect": "輸出紋理左右上下可以無縫重複鋪貼"
    },
    {
     "name": "色盤映射",
     "how": "把 B 濃度當索引去查一條漸層色帶，而非直接輸出灰階",
     "effect": "同一個模擬可快速換成不同配色氛圍"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "TouchDesigner",
    "GLSL",
    "即時影像",
    "教學影片"
   ],
   "tools": [
    "TouchDesigner",
    "GLSL"
   ],
   "url": "https://www.youtube.com/watch?v=1k_uPHcV6BA",
   "image": {
    "file": "img/cases/C01-53.jpg",
    "w": 480,
    "h": 360,
    "source": "YouTube",
    "author": "Lake Heckaman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.youtube.com/watch?v=1k_uPHcV6BA",
    "note": "教學影片縮圖：TouchDesigner 中的 Gray-Scott 斑塊"
   }
  },
  {
   "id": "C01-54",
   "algo": "C01",
   "title": "Reaction diffusion simulation（WebGL Gray-Scott 實驗）",
   "creator": "Pablo Márquez Neila（pmneila）",
   "year": "2012",
   "category": "2d-pattern",
   "categories_extra": [],
   "scale": "物件",
   "summary": "早期的網頁版 Gray-Scott 模擬，用 three.js 建立兩張紋理互相渲染，GLSL 著色器計算擴散與反應，並以五段顏色漸層顯示。提供 Solitons、Worms、Mazes、Holes、Chaos、Moving spots、Waves 等預設參數，可用滑鼠直接在畫面上畫入 B 物質。原始碼以 BSD-3-Clause 公開，是很多後續網頁 RD 作品的參考。",
   "variations": [
    {
     "name": "預設參數組",
     "how": "把基礎範例的 feed／kill 做成下拉選單，對應 Pearson 分類中的幾組值",
     "effect": "一鍵切換孤立子、蠕蟲、迷宮等不同形態，方便比較"
    },
    {
     "name": "滑鼠筆刷",
     "how": "在每一步更新前，把游標附近半徑內的 B 設為 1",
     "effect": "使用者可以即時「播種」，看圖樣從筆跡長出"
    },
    {
     "name": "多段色帶",
     "how": "B 濃度分成五個門檻，各段之間線性插值顏色",
     "effect": "同一張濃度圖呈現出等高線般的色階"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "three.js",
    "GLSL",
    "WebGL",
    "互動",
    "開源"
   ],
   "tools": [
    "three.js",
    "GLSL"
   ],
   "url": "https://pmneila.github.io/jsexp/grayscott/"
  },
  {
   "id": "C01-55",
   "algo": "C01",
   "title": "Reaction-Diffusion by the Gray-Scott Model: Pearson's Parameterization（Xmorphia 參數地圖）",
   "creator": "Robert Munafo",
   "year": "2009",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "把 Gray-Scott 模型在 k–F 參數平面上逐格計算，做成可點選的參數地圖，每一格連到該組參數的圖片、動畫與說明，並延伸 Pearson 的圖樣分類與命名。作者也記錄了多核心與 GPU 的加速實作方法。對 Grasshopper 使用者而言，它是挑選 feed／kill 數值的視覺索引。",
   "variations": [
    {
     "name": "參數掃描",
     "how": "把基礎範例包在兩層迴圈外，F 與 k 各取一段範圍，每組參數跑固定步數後縮圖排成矩陣",
     "effect": "一次看出哪些參數區產生斑點、條紋或混沌"
    },
    {
     "name": "空間漸變參數",
     "how": "讓 F 沿 x 軸、k 沿 y 軸線性變化，只跑一次模擬",
     "effect": "單張圖就呈現完整的形態光譜"
    },
    {
     "name": "多執行緒",
     "how": "把格點分成多個橫條，用 Parallel.For 分別更新",
     "effect": "大尺寸格點的計算時間大幅縮短"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "C",
    "OpenGL",
    "參數空間",
    "視覺化"
   ],
   "tools": [
    "C",
    "OpenGL"
   ],
   "url": "https://www.mrob.com/pub/comp/xmorphia/",
   "image": {
    "file": "img/cases/C01-55.jpg",
    "w": 900,
    "h": 900,
    "source": "MROB（mrob.com）",
    "author": "Robert Munafo",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.mrob.com/pub/comp/xmorphia/",
    "note": "Gray-Scott 模型 k–F 參數平面的圖樣地圖"
   }
  },
  {
   "id": "C02-01",
   "algo": "C02",
   "title": "Cambridge North 車站 Rule 30 穿孔鋁板立面",
   "creator": "Cambridge North 車站（設計方未查證；Stephen Wolfram 撰文辨識出規則）",
   "year": "2017",
   "category": "2d-pattern",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "立面／表皮",
   "summary": "英國劍橋北站外牆以穿孔鋁板包覆，圖樣經 Wolfram 比對，正是一維細胞自動機 Rule 30 圖樣右側邊緣旋轉 45° 後的結果（從外看是 rule 135，從內看為 rule 149）。演算法在此直接產生整座車站的立面紋理與透光孔。",
   "variations": [
    {
     "name": "2D 改 1D 規則",
     "how": "把基礎範例的 bool[,] 改成 bool[] 一列，鄰居只看左中右三格，用 (rule >> index) & 1 查表；每代往下排一列而非往上疊一層。",
     "effect": "得到三角形與條紋交錯的 Rule 30 圖樣，可直接當立面圖樣。"
    },
    {
     "name": "旋轉與裁切",
     "how": "輸出方格時對格心套 Transform.Rotation(45°)，再用立面輪廓裁切，只取圖樣邊緣區域。",
     "effect": "重現車站斜向的菱形格紋與不規則邊緣。"
    },
    {
     "name": "方格轉開孔",
     "how": "活格輸出成圓或方形開孔曲線（而非 Box），並依板材尺寸分割成多片。",
     "effect": "可交給 CNC 沖孔或雷切的面板檔。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "對稱",
    "拼貼",
    "字串改寫"
   ],
   "tools": [
    "Wolfram Language"
   ],
   "url": "https://writings.stephenwolfram.com/2017/06/oh-my-gosh-its-covered-in-rule-30s"
  },
  {
   "id": "C02-02",
   "algo": "C02",
   "title": "Metallic Lace：以細胞自動機為基礎的裝飾系統",
   "creator": "Robert J. Krawczyk（Illinois Institute of Technology）",
   "year": "2006",
   "category": "2d-pattern",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "Krawczyk 從 450 個初始世代中挑出 27 種圖樣，記錄每一格在生長過程中被造訪的次數，以此決定格子尺寸，再轉成圓、方、菱形、八角、十字、八角星等單元。成果被構想為浮雕、鍛鐵裝飾或噴砂、雷刻玻璃圖樣。",
   "variations": [
    {
     "name": "累積歷史取代疊層",
     "how": "新增 int[,] visits，每代活著就 +1，不輸出每層 Box，只在最後依 visits 輸出一層。",
     "effect": "把整段時間壓縮成一張有深淺層級的平面圖。"
    },
    {
     "name": "換單元形狀",
     "how": "新增 cellType 輸入，依 visits 大小縮放圓、多邊形或星形曲線，取代 Box。",
     "effect": "同一資料產生多種裝飾語彙。"
    },
    {
     "name": "浮雕化",
     "how": "把 visits 對應成 Extrusion 高度或曲面高度場。",
     "effect": "可 CNC 銑削的淺浮雕板。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "影像輸入",
    "拼貼"
   ],
   "tools": [],
   "url": "https://www.wolframscience.com/conference/2006/presentations/materials/krawczyk.pdf"
  },
  {
   "id": "C02-03",
   "algo": "C02",
   "title": "Architectural Interpretation of Cellular Automata：CA 量體生成",
   "creator": "Robert J. Krawczyk",
   "year": "2002",
   "category": "3d-architecture",
   "categories_extra": [
    "modeling"
   ],
   "scale": "建築",
   "summary": "Krawczyk 把 2D 細胞自動機的世代往上堆疊當成建築量體，並研究如何以人工詮釋與修改把原始 CA 結果轉成可讀的建築形體；後續論文〈Exploring the Massing of Growth in Cellular Automata〉進一步以細胞存活世代數塑造量體。與基礎範例的「時間＝樓層」概念完全相同。",
   "variations": [
    {
     "name": "存活時間決定高度",
     "how": "記錄每格連續存活代數，輸出時該格柱子高度＝存活代數×層高，取代逐層方塊。",
     "effect": "形成高低錯落的塔群與基座。"
    },
    {
     "name": "詮釋層",
     "how": "加入後處理：只保留與下一層有接觸的格子、把相鄰活格合併成較大樓板。",
     "effect": "去除懸空碎塊，讓 CA 結果更像建築。"
    },
    {
     "name": "格子比例分離",
     "how": "把 cellSize 拆成 cellSizeXY 與 floorHeight 兩個輸入。",
     "effect": "量體符合真實柱距與層高比例。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "3D",
    "開放生長"
   ],
   "tools": [],
   "url": "https://generativeart.com/on/cic/papersGA2002/7.pdf"
  },
  {
   "id": "C02-04",
   "algo": "C02",
   "title": "以 CA 生成荷蘭高密度集合住宅量體",
   "creator": "Sanaz Khalili Araghi、Rudi Stouffs（TU Delft）",
   "year": "2015",
   "category": "3d-architecture",
   "categories_extra": [
    "performance"
   ],
   "scale": "建築",
   "summary": "研究在設計初期用複合 CA 為荷蘭高密度住宅專案生成三維量體，格子狀態包含自然採光等條件，並以知名建築地標為基準比較生成的空間單元組合。示範 CA 規則如何加入建築需求而非只追求圖樣。",
   "variations": [
    {
     "name": "多狀態格子",
     "how": "把 bool 改成 int 狀態（0 空、1 住宅、2 陽台、3 核心），規則依鄰居中各狀態的數量決定轉換。",
     "effect": "量體內自然分出不同機能空間。"
    },
    {
     "name": "採光約束",
     "how": "每格計算上方與南向被遮擋的格數，超過門檻就不能成為住宅格。",
     "effect": "生成結果保證每戶有基本日照。"
    },
    {
     "name": "以地標為目標比較",
     "how": "輸出 aliveCounts 以外再計算體積、外表面積比等指標，與目標值比較挑選 seed。",
     "effect": "從大量隨機結果中篩出符合密度指標的方案。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "約束滿足",
    "最佳化"
   ],
   "tools": [],
   "url": "https://www.sciencedirect.com/science/article/abs/pii/S0926580514002180"
  },
  {
   "id": "C02-05",
   "algo": "C02",
   "title": "Automated Diagrams：以 CA 作為設計工作室的概念圖解",
   "creator": "Christiane M. Herr、Joanna Karakiewicz",
   "year": "2007",
   "category": "drawing",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "Herr 主張 CA 不必是全自動的形體產生器，而可以作為和設計者對話的「自動化圖解」：在設計工作室中讓學習者用 CA 產生抽象空間關係，再由設計者詮釋成混合機能的建築。延續她在香港大學的博士研究〈From Form Generators to Automated Diagrams〉。",
   "variations": [
    {
     "name": "手動編輯初始層",
     "how": "INIT 改為讀入使用者在 Rhino 畫的點或方格，而非隨機撒點。",
     "effect": "設計者可控制起點，CA 只負責發展。"
    },
    {
     "name": "圖解輸出",
     "how": "不輸出 Box，改輸出每層活格的外輪廓線與機能色塊（依鄰居數上色）。",
     "effect": "得到可疊圖閱讀的分層圖解。"
    },
    {
     "name": "中途介入",
     "how": "搭配 Timer，允許在某一代暫停、手動改格子後繼續。",
     "effect": "CA 成為可互動的設計草圖工具。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "Timer",
    "動畫"
   ],
   "tools": [],
   "url": "https://papers.cumincad.org/data/works/att/cf2007_167.content.pdf"
  },
  {
   "id": "C02-06",
   "algo": "C02",
   "title": "Adapting Cellular Automata as Architectural Design Tools：實務專案中的 CA 改造",
   "creator": "Christiane M. Herr、Ryan C. Ford",
   "year": "2015",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "論文整理 CA 被用於建築設計時常見的改造方式，並以一個從 Game of Life 規則出發的案例研究說明：通用 CA 產生的形雖然精緻卻常是任意的，必須加入與建築需求相關的規則並經過建築詮釋才有用。",
   "variations": [
    {
     "name": "從 Life 規則出發再調參",
     "how": "把 2 與 3 兩個門檻改成輸入參數 surviveMin、surviveMax、birthCount，逐步調整。",
     "effect": "觀察規則微調如何改變量體密度與孔隙。"
    },
    {
     "name": "固定初始、改規則",
     "how": "固定 seed，只換規則組合批次輸出並排比較。",
     "effect": "建立同一起點的規則型錄，方便設計決策。"
    },
    {
     "name": "加入建築性規則",
     "how": "在 NextGeneration 後再套一層規則：例如最高樓層、最小樓板面積、交通核必須連續。",
     "effect": "CA 結果更接近可發展的建築方案。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "約束滿足",
    "3D"
   ],
   "tools": [],
   "url": "https://papers.cumincad.org/data/works/att/caadria2015_139.content.pdf"
  },
  {
   "id": "C02-07",
   "algo": "C02",
   "title": "Les Folies Cellulaires：以 CA 生成的點景建築（Folies）",
   "creator": "Mirjana Devetaković、Ljiljana Petruševski、Milana Dabić、Bojan Mitrović（貝爾格勒大學建築學院）",
   "year": "2009",
   "category": "3d-architecture",
   "categories_extra": [
    "art-installation",
    "urban-landscape"
   ],
   "scale": "建築",
   "summary": "受 Tschumi 拉維列特公園的 Folies 啟發，貝爾格勒大學與高年級學習者以 Fun3D 軟體的 CA 模組生成一系列小型點景建築，探討 CA 在建築與都市設計中的應用，發表於 2009 年米蘭 Generative Art 研討會。",
   "variations": [
    {
     "name": "小網格多 seed",
     "how": "把 width/depth 縮到 8–12，批次跑多個 seed，每個結果排列在公園網格上。",
     "effect": "一組同家族但各不相同的 Folies。"
    },
    {
     "name": "統一外框",
     "how": "限制在固定的立方體範圍內生長（類似 Tschumi 的立方格架），超出範圍的格子不生成。",
     "effect": "外框一致、內部各異的系列作品。"
    },
    {
     "name": "輸出構件",
     "how": "把活格方塊轉成框架線（Box 的 12 條邊）與樓板面。",
     "effect": "像紅色鋼構 Folies 般的骨架形態。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "3D",
    "可重現種子"
   ],
   "tools": [
    "Fun3D"
   ],
   "url": "https://generativeart.com/on/cic/GA2009Papers/p18.pdf"
  },
  {
   "id": "C02-08",
   "algo": "C02",
   "title": "KnitYak：細胞自動機針織圍巾",
   "creator": "Fabienne \"fbz\" Serrière",
   "year": "2015",
   "category": "fabrication",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Serrière 改裝工業針織機，用 Processing 產生以 Rule 110、Rule 73 等一維 CA 為主的圖樣直接織成圍巾；每條圍巾記錄規則與起始種子，保證獨一無二。演算法一代一列，正好對應針織一排一排往下織的製程。",
   "variations": [
    {
     "name": "一代一排",
     "how": "改用一維 CA，每一代輸出一列像素而非一層方塊，輸出成黑白點陣圖。",
     "effect": "可直接送到針織機、雷刻或刺繡機的圖檔。"
    },
    {
     "name": "種子即簽名",
     "how": "把 seed 當成客製化編號（例如由名字雜湊產生），同時輸出規則與 seed 文字。",
     "effect": "大量客製化、每件可追溯。"
    },
    {
     "name": "製程限制",
     "how": "限制連續同色格數（針織浮線長度），超過就強制翻轉。",
     "effect": "圖樣符合材料與製程限制。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "可重現種子",
    "隨機"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://www.kickstarter.com/projects/fbz/knityak-custom-mathematical-knit-scarves/"
  },
  {
   "id": "C02-09",
   "algo": "C02",
   "title": "Cellular Automata and Fractal Urban Form：都市土地使用 CA 模型",
   "creator": "Roger White、Guy Engelen",
   "year": "1993",
   "category": "urban-landscape",
   "categories_extra": [],
   "scale": "群體／都市",
   "summary": "White 與 Engelen 的經典模型以格子狀態代表土地使用，轉換規則同時考慮鄰域內既有土地使用與該格本身的適宜性，模擬都市土地使用的演變並呈現碎形都市形態，成為後續大量都市、區域與交通 CA 研究的基礎。",
   "variations": [
    {
     "name": "多狀態＋機率轉換",
     "how": "bool 改為 enum 土地使用，NextGeneration 依鄰居組成計算各用途的潛力值，再用 Random 依機率轉換。",
     "effect": "模擬住宅、商業、綠地的擴張與聚集。"
    },
    {
     "name": "適宜性圖層",
     "how": "新增 double[,] suitability，由影像或坡度、道路距離計算，乘入轉換潛力。",
     "effect": "擴張沿道路、避開陡坡，更接近真實城市。"
    },
    {
     "name": "擴大鄰域",
     "how": "CountNeighbors 的 offset 範圍由 ±1 改成半徑 r，並依距離加權。",
     "effect": "呈現較大尺度的群聚與碎形邊界。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "隨機",
    "影像輸入",
    "鄰居搜尋"
   ],
   "tools": [],
   "url": "https://journals.sagepub.com/doi/10.1068/a251175"
  },
  {
   "id": "C02-10",
   "algo": "C02",
   "title": "Rabbit：Grasshopper 的細胞自動機與 L-System 外掛",
   "creator": "Morphocode",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "物件",
   "summary": "Rabbit 是 Morphocode 開發的開源 Grasshopper 外掛，提供 Conway's Life、Amoeba、Coral、Day&Night、Diamoeba 等多種 CA 規則與 3D CA 元件，可直接在 Rhino 中探索圖樣形成、自組織與湧現。適合拿來和自己寫的 C# 版本對照。",
   "variations": [
    {
     "name": "規則庫",
     "how": "把 Rabbit 內建規則名稱（如 Coral、Day&Night）寫成 Dictionary<string,(string birth,string survive)>，用下拉輸入切換。",
     "effect": "自己的元件也能一鍵換規則比較。"
    },
    {
     "name": "3D CA 對照",
     "how": "用 Rabbit 的 3D CA 結果與自己改寫的 bool[,,] 版本比對，驗證 26 鄰居計數是否正確。",
     "effect": "學習除錯與驗證演算法。"
    },
    {
     "name": "改寫成 Timer 元件",
     "how": "仿照外掛的逐步推進，把狀態存成類別欄位，每次觸發推進一代。",
     "effect": "可動畫播放並中途停下挑形。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "3D",
    "Timer"
   ],
   "tools": [
    "Grasshopper",
    "Rabbit"
   ],
   "url": "https://morphocode.com/rabbit-grasshopper-3d-l-systems-3d-cellular-automata/"
  },
  {
   "id": "C02-11",
   "algo": "C02",
   "title": "Stacked Game of Life：世代疊層的 3D 視覺化",
   "creator": "vnglst（GitHub）",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "網頁版 3D 視覺化：目前世代在最上方，舊世代逐步往下沉成歷史堆疊，八層歷史依序淡出透明度與顏色，以等角視角呈現時間切片。和基礎範例的「時間＝高度」相同，但只保留最近幾層做成動畫。",
   "variations": [
    {
     "name": "只保留最近 N 層",
     "how": "用 Queue<bool[,]> 儲存最近 N 代，超過就 Dequeue，每次只輸出這 N 層。",
     "effect": "像捲動的時間窗口，適合動畫。"
    },
    {
     "name": "依層齡上色",
     "how": "輸出 Box 同時輸出 Color 清單，越舊越透明或越淡，用 Custom Preview 顯示。",
     "effect": "清楚看出圖樣的移動軌跡。"
    },
    {
     "name": "發光材質渲染",
     "how": "把活格輸出成 mesh 並依層數設定自發光強度，在 Rhino 渲染或匯出 three.js。",
     "effect": "作品集用的時間切片視覺圖。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "動畫",
    "Timer",
    "3D"
   ],
   "tools": [
    "JavaScript",
    "three.js"
   ],
   "url": "https://github.com/vnglst/stacked-game-of-life"
  },
  {
   "id": "C02-12",
   "algo": "C02",
   "title": "Lenia：連續狀態的生命遊戲",
   "creator": "Bert Wang-Chak Chan",
   "year": "2018",
   "category": "art-installation",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Lenia 把 Conway 生命遊戲推廣成空間、時間、狀態都連續的細胞自動機，用環形核計算鄰域勢能、高斯成長函數更新，產生會移動、脈動、分裂的類生物圖樣；後續研究再擴展到高維度、多核與多通道。",
   "variations": [
    {
     "name": "bool 換 double",
     "how": "狀態改為 double[,]（0–1），CountNeighbors 改為環形核加權平均，更新用 state += dt * growth(u) 再夾在 0–1。",
     "effect": "平滑有機的斑塊取代方格。"
    },
    {
     "name": "疊層轉等值面",
     "how": "把每代的 double 場當成 3D 體積資料，交給 C05 Marching Squares／Cubes 抽等值面。",
     "effect": "連續、流動的時間雕塑曲面。"
    },
    {
     "name": "3D Lenia",
     "how": "核改為球殼、狀態改為 double[,,]，運算量大，需縮小網格或用 FFT。",
     "effect": "立體的類生物形體，屬研究級挑戰。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "等值面",
    "動畫",
    "網格擴散"
   ],
   "tools": [
    "Python"
   ],
   "url": "https://arxiv.org/abs/1812.05433"
  },
  {
   "id": "C02-13",
   "algo": "C02",
   "title": "以細胞自動機控制動態遮陽立面",
   "creator": "",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "立面／表皮",
   "summary": "研究以 CA 規則驅動建築立面的動態遮陽單元，讓每個立面格子依自身與鄰居的狀態（例如日照）決定開關，形成兼具性能與變化圖樣的表皮。演算法把 CA 的局部規則轉成分散式的立面控制邏輯。",
   "variations": [
    {
     "name": "日照當外部輸入",
     "how": "每格額外讀入 double[,] sun（由日照分析或太陽向量與面板法向量內積得到），規則改為日照高且鄰居開啟數少時才開啟遮陽。",
     "effect": "遮陽分布跟著太陽移動並保留局部連續性。"
    },
    {
     "name": "世代對應時刻",
     "how": "不再把世代疊成樓層，而是一代對應一個小時，輸出每小時的面板開合狀態。",
     "effect": "一天的立面動態動畫。"
    },
    {
     "name": "面板旋轉角度",
     "how": "活格輸出為旋轉的百葉板（角度依鄰居數映射），而非有無。",
     "effect": "連續變化的動態百葉立面。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "Timer",
    "動畫",
    "吸引子控制"
   ],
   "tools": [],
   "url": "https://www.academia.edu/48830065/Implementing_Cellular_Automata_for_Dynamically_Shading_a_Building_Facade"
  },
  {
   "id": "C02-14",
   "algo": "C02",
   "title": "An Evolutionary Architecture：演化建築與細胞自動機",
   "creator": "John Frazer（AA 建築聯盟學院）",
   "year": "1995",
   "category": "3d-architecture",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "Frazer 的著作把建築視為會生長、演化的人工生命，早期實驗以人工演化與細胞自動機生成隨時間發展的建築形體，是 CA 建築生成的奠基文獻之一，與 Paul Coates 等人的研究同為此領域的起點。",
   "variations": [
    {
     "name": "規則當基因",
     "how": "把 B/S 規則編碼成 18 位元的整數（birth 9 位＋survive 9 位），當成基因交給演化演算法挑選。",
     "effect": "自動搜尋能長出特定量體特徵的規則。"
    },
    {
     "name": "適應度指標",
     "how": "由 aliveCounts 與方塊統計計算適應度（例如穩定性、體積、外表面比）。",
     "effect": "把主觀挑選轉為可量化的演化目標。"
    },
    {
     "name": "世代成長而非固定高度",
     "how": "讓 generations 不固定，直到活格數穩定或死光才停止。",
     "effect": "量體高度由系統自行決定。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "最佳化",
    "3D",
    "開放生長"
   ],
   "tools": [],
   "url": ""
  },
  {
   "id": "C02-15",
   "algo": "C02",
   "title": "Cellular Automata for Infill Designs in Historic Urban Quarters",
   "creator": "Nexus Network Journal 論文（作者未查證）",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "群體／都市",
   "summary": "研究把 CA 用於歷史街區的填充建築設計，讓新量體依周邊既有紋理的局部規則生成，以延續歷史街區的尺度與虛實關係。示範 CA 以既有環境為初始狀態、只在空地上生長的用法。",
   "variations": [
    {
     "name": "既有建物為固定格",
     "how": "新增 bool[,] fixedCells，由基地既有建物投影得到；計數鄰居時算入但永不改變狀態。",
     "effect": "新量體會回應鄰房的位置與密度。"
    },
    {
     "name": "只在空地生長",
     "how": "以基地空地曲線做遮罩，遮罩外的格子保持死亡。",
     "effect": "填充設計不超出可建範圍。"
    },
    {
     "name": "高度跟隨鄰房",
     "how": "層數上限依周邊既有建物高度平均值動態決定。",
     "effect": "天際線與歷史街區協調。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "約束滿足",
    "影像輸入"
   ],
   "tools": [],
   "url": "https://link.springer.com/article/10.1007/s00004-022-00602-2"
  },
  {
   "id": "C02-51",
   "algo": "C02",
   "title": "Coding Challenge 85：The Game of Life",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2017",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "用 p5.js 從零寫出 Conway 生命遊戲：建立二維陣列、隨機初始化、計算八鄰格存活數，並依規則產生下一代，同時說明邊界處理。和 Grasshopper C# 範例同一套規則，但以畫布方格即時播放世代變化。",
   "variations": [
    {
     "name": "環狀邊界",
     "how": "計算鄰居時用 (i + x + cols) % cols 取餘數，讓左右上下相接",
     "effect": "滑翔機可從一邊出去、另一邊回來，不會在邊緣卡死"
    },
    {
     "name": "新陣列取代就地更新",
     "how": "每一代都寫入新陣列，算完再整批替換",
     "effect": "所有細胞同時更新，結果才符合規則定義"
    },
    {
     "name": "年齡上色",
     "how": "除了 0／1 再多存一個存活代數，依代數決定顏色或高度",
     "effect": "穩定結構與新生區域一眼可分"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "JavaScript",
    "細胞自動機",
    "教學影片"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://thecodingtrain.com/challenges/85-the-game-of-life",
   "image": {
    "file": "img/cases/C02-51.jpg",
    "w": 900,
    "h": 498,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/85-the-game-of-life",
    "note": "挑戰頁預覽圖：生命遊戲方格"
   }
  },
  {
   "id": "C02-52",
   "algo": "C02",
   "title": "A Processing implementation of Game of Life（Processing 官方範例）",
   "creator": "Joan Soler-Adillon",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "Processing 官方範例庫「Cellular Automata」類別中的生命遊戲，可用空白鍵暫停、在暫停時用滑鼠點選切換細胞，按 R 隨機重設、按 C 清空。重點是把規則做成可以手動介入的互動畫面，而不只是自動跑。",
   "variations": [
    {
     "name": "暫停與手繪",
     "how": "加一個 bool 暫停開關；暫停時把游標所在格反轉狀態（GH 可用 Point 輸入或 Human UI 取代）",
     "effect": "可以手動擺出滑翔機、振盪器等特定圖形再觀察"
    },
    {
     "name": "計時器控制世代",
     "how": "不是每幀都更新，而是累積到固定毫秒數才算下一代",
     "effect": "繪圖流暢度和演化速度可以分開調整"
    },
    {
     "name": "重設與清空",
     "how": "把初始化寫成獨立方法，以按鍵或布林輸入觸發",
     "effect": "方便反覆實驗不同的初始密度"
    }
   ],
   "difficulty": 1,
   "tags": [
    "creative coding",
    "Processing",
    "Java",
    "細胞自動機",
    "互動"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://processing.org/examples/gameoflife.html",
   "image": {
    "file": "img/cases/C02-52.jpg",
    "w": 800,
    "h": 450,
    "source": "Processing.org",
    "author": "Joan Soler-Adillon",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://processing.org/examples/gameoflife.html",
    "note": "Processing 官方範例的生命遊戲畫面"
   }
  },
  {
   "id": "C02-53",
   "algo": "C02",
   "title": "The Nature of Code 第 7 章：Cellular Automata",
   "creator": "Daniel Shiffman",
   "year": "2024",
   "category": "2d-pattern",
   "categories_extra": [],
   "scale": "物件",
   "summary": "《The Nature of Code》2024 年版（p5.js）的細胞自動機章節，從 Wolfram 一維基本 CA（Rule 30、90、110 等）講到二維生命遊戲，並示範穩定、振盪、移動的典型圖形與物件導向的細胞寫法。比 Grasshopper 基礎範例多了規則分類與變形的系統整理。",
   "variations": [
    {
     "name": "一維規則疊層",
     "how": "把二維格點改成一列 bool，用 rule 數字的位元查表產生下一列，並把每一代往下排",
     "effect": "得到 Rule 30、Rule 90 等三角形與謝爾賓斯基圖樣"
    },
    {
     "name": "細胞物件化",
     "how": "每個細胞寫成類別，記錄目前與前一個狀態",
     "effect": "可以依「剛誕生」「剛死亡」分別上色，看出變化前緣"
    },
    {
     "name": "連續或機率規則",
     "how": "把 0／1 換成 0–1 的浮點數，或讓規則以一定機率成立",
     "effect": "形態變得柔和或帶雜訊，脫離純格子感"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "細胞自動機",
    "Wolfram CA",
    "線上教科書"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://natureofcode.com/cellular-automata/",
   "image": {
    "file": "img/cases/C02-53.jpg",
    "w": 900,
    "h": 298,
    "source": "The Nature of Code",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://natureofcode.com/cellular-automata/",
    "note": "書中 Figure 7.30：會移動的圖形（滑翔機、輕型太空船）"
   }
  },
  {
   "id": "C02-54",
   "algo": "C02",
   "title": "Creating Generative Visuals with Complex Systems（TouchDesigner Summit 2019 工作坊）",
   "creator": "Simon Alexander-Adams",
   "year": "2019",
   "category": "performance",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "2019 年 TouchDesigner Summit 工作坊，以 GLSL 從零建構一維與二維細胞自動機，並示範衰減細胞（generations 變體）、在同一系統中使用多組規則，以及把 CA 圖樣拿去驅動粒子、變形幾何，搭配聲音或 Kinect、Leap Motion 互動。工作坊也涵蓋反應擴散，範例檔（CA_Explorer.tox、Wolfram.tox）以 MIT 授權公開在 GitHub。",
   "variations": [
    {
     "name": "Generations 衰減",
     "how": "死亡的細胞不直接歸 0，而是在數代內逐步遞減一個狀態值",
     "effect": "活躍區域後方拖出漸淡的尾跡，畫面更有動態層次"
    },
    {
     "name": "多規則混合",
     "how": "依空間遮罩或時間切換不同的誕生／存活條件（B/S 規則）",
     "effect": "同一畫面出現不同質感的區塊"
    },
    {
     "name": "CA 當驅動訊號",
     "how": "把細胞狀態圖當作粒子發射位置或頂點位移貼圖",
     "effect": "CA 不只是方格圖，而變成立體形體或粒子動畫的控制層"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "TouchDesigner",
    "GLSL",
    "細胞自動機",
    "即時影像",
    "工作坊"
   ],
   "tools": [
    "TouchDesigner",
    "GLSL"
   ],
   "url": "https://www.simonaa.media/tutorials/complex-systems-workshop",
   "image": {
    "file": "img/cases/C02-54.jpg",
    "w": 900,
    "h": 250,
    "source": "simonaa.media",
    "author": "Simon Alexander-Adams",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.simonaa.media/tutorials/complex-systems-workshop",
    "note": "工作坊頁面橫幅：生成圖樣"
   }
  },
  {
   "id": "C02-55",
   "algo": "C02",
   "title": "Coding Challenge 179：Elementary Cellular Automata（Wolfram CA）",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2024",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以 p5.js 實作 Wolfram 的一維基本細胞自動機：一列細胞依左右與自身三格的狀態查 8 位元規則表，逐代往下堆疊成二維圖樣。是二維生命遊戲的「降維版」，也是 Rule 30 等立面圖樣背後的程式寫法。",
   "variations": [
    {
     "name": "規則編號輸入",
     "how": "把規則寫成 0–255 的整數，用 (rule >> index) & 1 取出對應位元",
     "effect": "一個滑桿就能瀏覽全部 256 條規則"
    },
    {
     "name": "捲動堆疊",
     "how": "每代畫一列，畫到底部後整張往上捲",
     "effect": "得到無限延伸的圖樣帶，可當長條立面或織帶"
    },
    {
     "name": "隨機或單點起始",
     "how": "第一代改成只有中央一格為 1，或隨機分布",
     "effect": "對稱三角形與不規則紋理兩種結果差異明顯"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "細胞自動機",
    "Wolfram CA",
    "教學影片"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://thecodingtrain.com/challenges/179-wolfram-ca",
   "image": {
    "file": "img/cases/C02-55.jpg",
    "w": 900,
    "h": 506,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/179-wolfram-ca",
    "note": "挑戰頁預覽圖：一維 CA 世代疊層圖樣"
   }
  },
  {
   "id": "C03-01",
   "algo": "C03",
   "title": "Flow Fields（生成藝術教學文章）",
   "creator": "Tyler Hobbs",
   "year": "2020",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "summary": "Hobbs 系統整理 flow field 的做法：在畫面上鋪一張角度格網，讓曲線順著角度前進，並討論起點分布、碰撞檢查、線寬與色彩等讓成品好看的技巧。是本元件「場＋流線」最直接的藝術版本。",
   "variations": [
    {
     "name": "角度格網取代公式",
     "how": "先把場預先算好存在 double[,] 角度陣列（格網），追蹤時用所在格或雙線性內插查角度，而非每步呼叫 FieldDirection。",
     "effect": "速度快、可手動塗改場，也方便換成 noise 或影像。"
    },
    {
     "name": "碰撞停止",
     "how": "追蹤時檢查新點與既有流線點距離，小於間距就 break。",
     "effect": "流線不重疊，畫面呈現有節奏的留白。"
    },
    {
     "name": "起點隨機分布",
     "how": "把格子起點換成 Random 點或 Poisson 分布點。",
     "effect": "消除格子感，構圖更自然。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "隨機",
    "可重現種子"
   ],
   "tools": [
    "Processing",
    "Clojure/Quil"
   ],
   "url": "https://www.tylerxhobbs.com/words/flow-fields"
  },
  {
   "id": "C03-02",
   "algo": "C03",
   "title": "Fidenza",
   "creator": "Tyler Hobbs",
   "year": "2021",
   "category": "art-installation",
   "categories_extra": [
    "2d-pattern"
   ],
   "summary": "在 Art Blocks 發表的 999 件長篇生成藝術，以 flow field 引導大量帶狀曲線形狀排列，亂流程度（none／low／medium／high）是可變特徵之一。展示同一演算法如何透過參數空間產生整個作品系列。",
   "variations": [
    {
     "name": "流線加寬成帶狀色塊",
     "how": "把每條 Polyline 依法向 Offset 成封閉帶狀，填色並檢查與其他帶的碰撞。",
     "effect": "從線稿變成有面積與色彩的構圖。"
    },
    {
     "name": "亂流等級參數",
     "how": "把 swirlStrength 或 noise 振幅做成 0／低／中／高 四檔，其中 0 時流線全直。",
     "effect": "同一系統產生從規整到混亂的系列作品。"
    },
    {
     "name": "seed 驅動整套特徵",
     "how": "以一個 seed 決定調色盤、密度、亂流等所有參數。",
     "effect": "每個 seed 都是獨立但可重現的作品。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "隨機",
    "可重現種子"
   ],
   "tools": [
    "JavaScript",
    "p5.js"
   ],
   "url": "https://www.artblocks.io/collection/fidenza-by-tyler-hobbs"
  },
  {
   "id": "C03-03",
   "algo": "C03",
   "title": "Wind Map",
   "creator": "Fernanda Viégas, Martin Wattenberg（HINT.FM）",
   "year": "2012",
   "category": "drawing",
   "categories_extra": [
    "performance"
   ],
   "summary": "讀取美國國家數位預報資料庫的風速風向，把全美的風畫成持續流動的細線。場不是公式而是實測資料，流線則以動畫粒子呈現。",
   "variations": [
    {
     "name": "資料格網當場",
     "how": "FieldDirection 改為從風速格網（CSV 或 Ladybug 風資料）做雙線性內插取向量。",
     "effect": "流線呈現真實風向而非假想吸引點。"
    },
    {
     "name": "短命粒子動畫",
     "how": "每個粒子只活 N 步後重生於隨機位置，保留尾巴漸淡。",
     "effect": "畫面持續流動、密度穩定。"
    },
    {
     "name": "以風速調透明度／線寬",
     "how": "不 Unitize 前先記錄向量長度，映射到線寬或顏色。",
     "effect": "強風區一眼可辨。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "動畫",
    "Timer"
   ],
   "tools": [
    "JavaScript"
   ],
   "url": "http://hint.fm/projects/wind/"
  },
  {
   "id": "C03-04",
   "algo": "C03",
   "title": "Wind of Boston: Data Paintings",
   "creator": "Refik Anadol Studio",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "3d-architecture"
   ],
   "summary": "以波士頓洛根機場一年、每 20 秒一筆的風速、風向、陣風資料，在 1.8 m × 4 m 的數位畫布上生成四個章節的動態「資料繪畫」，設於 Fan Pier 100 Northern Avenue 大廳。風場資料成為建築室內的公共藝術。",
   "variations": [
    {
     "name": "時間序列驅動場",
     "how": "每一 Timer 步讀下一筆風速風向，改變全域場的主方向與 swirl。",
     "effect": "流線隨真實時間變化。"
    },
    {
     "name": "3D 流線雕塑",
     "how": "把時間當 Z 軸，每一時刻的流線疊高。",
     "effect": "一年風況變成可以繞著看的立體紀錄。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "動畫",
    "3D"
   ],
   "tools": [
    "客製軟體"
   ],
   "url": "https://refikanadol.com/works/wind-of-boston-data-paintings/"
  },
  {
   "id": "C03-05",
   "algo": "C03",
   "title": "Butterfly：Grasshopper 中的 OpenFOAM 風場模擬",
   "creator": "Ladybug Tools",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "urban-landscape"
   ],
   "summary": "Butterfly 把 Grasshopper 幾何匯出到 OpenFOAM 做 CFD，可模擬戶外都市風場與室內通風；結果常以速度向量與流線視覺化。本元件的公式場可以視為 CFD 速度場的簡化替身。",
   "variations": [
    {
     "name": "以 CFD 結果取代公式",
     "how": "把 Butterfly 輸出的點與速度向量存成清單，FieldDirection 改為取最近點（或 RTree 內插）的向量。",
     "effect": "流線反映真實的街谷風與角隅加速。"
    },
    {
     "name": "建築量體當排斥點",
     "how": "在沒有 CFD 前，先把量體中心當 pullStrength 為負的吸引點做快速概念研究。",
     "effect": "數秒內得到量體配置對氣流的直覺。"
    },
    {
     "name": "風速門檻標示",
     "how": "依向量長度把流線切段並上色，超過舒適門檻的段落改紅色。",
     "effect": "直接標出不舒適區。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "空間索引"
   ],
   "tools": [
    "Grasshopper",
    "Butterfly",
    "OpenFOAM"
   ],
   "url": "https://www.ladybug.tools/butterfly.html"
  },
  {
   "id": "C03-06",
   "algo": "C03",
   "title": "Rheotomic Surfaces 流線曲面",
   "creator": "Daniel Piker",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "summary": "以複數函數的虛部建立曲面，其等高線就是位勢流的流線，實部則是正交的等位線；Piker 把它包成 Grasshopper 工具，可由渦旋與源點配置產生可行走、互相連通的曲面。",
   "variations": [
    {
     "name": "流函數高度場",
     "how": "不追蹤流線，而在格點上計算流函數 ψ（例如各渦旋的 Γ·ln r 相加）當 Z 值建 Mesh。",
     "effect": "曲面的等高線就是流線，一次得到空間形體。"
    },
    {
     "name": "等位線與流線雙網格",
     "how": "同時計算位勢 φ 與流函數 ψ，各取等值線。",
     "effect": "得到正交的曲線網，可當結構格柵。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "等值面",
    "3D"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://www.grasshopper3d.com/profiles/blogs/rheotomic-surfaces-and-flowline-generation-tool"
  },
  {
   "id": "C03-07",
   "algo": "C03",
   "title": "等間距流線演算法",
   "creator": "Bruno Jobard, Wilfrid Lefer",
   "year": "1997",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "summary": "科學視覺化的經典方法：只設定流線間距 dsep，就能產生從紋理到手繪風格的均勻流線圖，且比先前方法計算更便宜。是把本元件從「格子起點」升級成「漂亮構圖」的關鍵。",
   "variations": [
    {
     "name": "由既有流線衍生起點",
     "how": "維護一個待處理流線佇列，沿每條流線兩側 dsep 處試種新起點。",
     "effect": "流線自動填滿空間。"
    },
    {
     "name": "格子空間索引",
     "how": "建立邊長 dsep 的 bucket 格網，追蹤時只查周圍 9 格的點。",
     "effect": "上千條流線也能即時計算。"
    },
    {
     "name": "變密度",
     "how": "讓 dsep 隨吸引點距離或影像亮度變化。",
     "effect": "可做出明暗層次，類似雕版畫。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "空間索引",
    "鄰居搜尋"
   ],
   "tools": [
    "C",
    "MATLAB"
   ],
   "url": "https://link.springer.com/chapter/10.1007/978-3-7091-6876-9_5"
  },
  {
   "id": "C03-08",
   "algo": "C03",
   "title": "evenly_spaced_streamlines（MATLAB 實作）",
   "creator": "keithfma",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "summary": "以 MATLAB 實作 Jobard & Lefer 1997 等間距流線，提供可直接閱讀的程式碼，適合學習者對照改寫成 C#。",
   "variations": [
    {
     "name": "移植到 GH C#",
     "how": "把其 dsep／dtest 的邏輯寫成 TraceStreamline 的額外停止條件。",
     "effect": "本元件輸出立即變得均勻整齊。"
    },
    {
     "name": "輸出成切割線",
     "how": "流線直接當雷切或雕刻路徑。",
     "effect": "可製作流線紋理板。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "鄰居搜尋"
   ],
   "tools": [
    "MATLAB"
   ],
   "url": "https://github.com/keithfma/evenly_spaced_streamlines"
  },
  {
   "id": "C03-09",
   "algo": "C03",
   "title": "Curl-Noise for Procedural Fluid Flow",
   "creator": "Robert Bridson, Jim Hourihan, Marcus Nordenstam",
   "year": "2007",
   "category": "modeling",
   "categories_extra": [
    "art-installation"
   ],
   "summary": "SIGGRAPH 2007 論文，以 Perlin noise 的旋度（curl）產生恰好不可壓縮、可尊重固體邊界的亂流速度場，廣泛用於煙、火等特效。它說明了如何從 noise 得到「不會聚成一點」的好流場。",
   "variations": [
    {
     "name": "curl 取代吸引點",
     "how": "ψ = noise(x/s, y/s)，方向 = (ψ(x,y+h)−ψ(x,y−h), −(ψ(x+h,y)−ψ(x−h,y))) / 2h。",
     "effect": "流線均勻迴旋、沒有匯點。"
    },
    {
     "name": "靠近邊界時衰減 ψ",
     "how": "ψ 乘上到障礙物（建築輪廓）距離的平滑函數。",
     "effect": "流線自然繞過建築而不穿透。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "物理模擬",
    "隨機"
   ],
   "tools": [
    "Houdini 等 VFX 軟體"
   ],
   "url": "https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf"
  },
  {
   "id": "C03-10",
   "algo": "C03",
   "title": "Kartal-Pendik Masterplan（場域式都市設計）",
   "creator": "Zaha Hadid Architects",
   "year": "2006",
   "category": "urban-landscape",
   "categories_extra": [
    "3d-architecture"
   ],
   "summary": "伊斯坦堡競圖首獎案，以既有東西向道路與主軸交織出「soft grid」，再以 urban script 依位置生成不同建築類型；Schumacher 以此為 Parametric Urbanism 的代表，強調「場的規律性差異化」。注意：此案是場的概念與網格變形，並非直接以本元件的流線追蹤產生。",
   "variations": [
    {
     "name": "流線當 soft grid",
     "how": "把基地既有道路端點當吸引點（或以道路切線當場），分別追蹤兩組互相接近正交的流線，交織成街廓網。",
     "effect": "隨基地脈絡彎曲的都市格網。"
    },
    {
     "name": "場強度驅動建築類型",
     "how": "在每個街廓中心取場強度或 swirl 值，映射到高度或塔／合院類型。",
     "effect": "建築形態在基地上漸變。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "吸引子控制",
    "多元件"
   ],
   "tools": [],
   "url": "https://www.zaha-hadid.com/masterplans/kartal-pendik-masterplan"
  },
  {
   "id": "C03-11",
   "algo": "C03",
   "title": "StreamLines3D 元件（FlowLines 外掛）",
   "creator": "FlowLines",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "performance"
   ],
   "summary": "Grasshopper 外掛元件，以 RK4 計算 3D 向量場的流線。可與本課程元件對照：本範例用最簡單的 Euler 法，外掛用 RK4 取得更準的路徑。",
   "variations": [
    {
     "name": "Euler → RK4",
     "how": "在 TraceStreamline 中依 RK4 取四次方向加權。",
     "effect": "漩渦中心不再外洩、步長可放大。"
    },
    {
     "name": "3D 起點雲",
     "how": "起點改為 3D 格子或隨機點雲並拿掉 Z=0。",
     "effect": "空間中的流線束。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D"
   ],
   "tools": [
    "Grasshopper",
    "FlowLines"
   ],
   "url": "https://grasshopperdocs.com/components/flowlines/streamLines3D.html"
  },
  {
   "id": "C03-12",
   "algo": "C03",
   "title": "Grasshopper 參數化鋪面教學",
   "creator": "Landscape Architecture Store",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "fabrication"
   ],
   "summary": "以 Grasshopper 設計動態鋪面圖樣的逐步教學。可把本元件的流線當分割線，將鋪面切成隨流向彎曲的條帶，是流線直接落地成施工圖的應用方向。",
   "variations": [
    {
     "name": "流線分割鋪面",
     "how": "流線 Offset 成條帶後與基地邊界做 Region 切割，每條帶再依長度切成可施工的鋪面塊。",
     "effect": "有方向感的廣場鋪面。"
    },
    {
     "name": "場強度決定材料",
     "how": "取每塊鋪面中心的場向量長度，分 3 級映射成 3 種材料或顏色。",
     "effect": "鋪面漸層呼應人流或風向。"
    },
    {
     "name": "吸引點＝出入口",
     "how": "把主要出入口與座椅位置設成吸引點。",
     "effect": "鋪面紋理引導動線。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "吸引子控制",
    "拼貼"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://landscapearchitecture.store/blogs/news/how-to-design-a-parametric-paving-pattern-using-rhino-grasshopper"
  },
  {
   "id": "C03-13",
   "algo": "C03",
   "title": "Grasshopper 論壇：用向量場畫流線",
   "creator": "McNeel Forum 使用者",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "modeling"
   ],
   "summary": "McNeel 論壇上關於在 Grasshopper 以向量場繪製流線的討論，展示原生元件與腳本兩種做法，常見困難是流線均勻分布。適合學習者遇到問題時查閱。",
   "variations": [
    {
     "name": "原生元件 vs. C#",
     "how": "先用 GH 原生 Field 元件（Point Charge、Spin Force）建場，再與本 C# 元件結果比較。",
     "effect": "理解公式場的組成。"
    },
    {
     "name": "流線長度篩選",
     "how": "只保留 Polyline.Length 大於門檻的流線。",
     "effect": "去除零碎短線，畫面更乾淨。"
    }
   ],
   "difficulty": 2,
   "tags": [],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://discourse.mcneel.com/t/draw-streamline-with-vector-field/104056"
  },
  {
   "id": "C03-51",
   "algo": "C03",
   "title": "Coding Challenge #24：Perlin Noise Flow Field",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2016",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "用 p5.js 以 Perlin noise 產生隨時間變化的向量格，讓大量粒子依所在格的向量加速前進，並以半透明線條累積軌跡。與 Grasshopper 範例的逐條追蹤流線不同，這裡是很多粒子同時被場推動，畫面由累積的筆觸構成。",
   "variations": [
    {
     "name": "粒子累積筆觸",
     "how": "不再一次算完整條流線，而是維持一組粒子，每步只前進一小段並畫出前後兩點的線段（低不透明度）",
     "effect": "重疊越多處越深，形成絲綢般的密度變化"
    },
    {
     "name": "場隨時間變化",
     "how": "向量角度改用 noise(x, y, z) 並讓 z 隨時間增加",
     "effect": "流場緩慢扭動，軌跡呈現動態漩渦"
    },
    {
     "name": "邊界環繞",
     "how": "粒子超出畫面時從對側回來，並同步重設前一點避免畫出長直線",
     "effect": "粒子數量守恆，畫面均勻被填滿"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "Perlin noise",
    "粒子",
    "教學影片"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://thecodingtrain.com/challenges/24-perlin-noise-flow-field",
   "image": {
    "file": "img/cases/C03-51.jpg",
    "w": 900,
    "h": 508,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/24-perlin-noise-flow-field",
    "note": "挑戰頁預覽圖：流場粒子累積的半透明線條"
   }
  },
  {
   "id": "C03-52",
   "algo": "C03",
   "title": "The Nature of Code 第 5 章：Autonomous Agents（Flow Fields 小節）",
   "creator": "Daniel Shiffman",
   "year": "2024",
   "category": "drawing",
   "categories_extra": [],
   "scale": "物件",
   "summary": "《The Nature of Code》2024 年版把流場放在「自主代理人」脈絡中：流場是一張向量格，每個 vehicle 查詢所在格的向量當作「期望速度」，再以轉向力（desired − velocity，限制最大力）逐步修正方向。和直接沿向量積分的流線相比，多了速度與轉向的慣性。",
   "variations": [
    {
     "name": "轉向力取代直接跟隨",
     "how": "流線追蹤時不直接把位置加上場向量，而是 steer = desired − velocity，限制長度後加到速度",
     "effect": "路徑有慣性、轉彎較圓滑，不會瞬間折角"
    },
    {
     "name": "多種場來源",
     "how": "把場換成全部向右、隨機方向、Perlin noise 三種版本比較",
     "effect": "清楚看到場的結構如何決定軌跡"
    },
    {
     "name": "由影像產生場",
     "how": "以圖片亮度梯度或自訂函數計算每格角度",
     "effect": "軌跡沿著影像輪廓或指定圖形流動"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "自主代理人",
    "線上教科書"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://natureofcode.com/autonomous-agents/",
   "image": {
    "file": "img/cases/C03-52.jpg",
    "w": 900,
    "h": 270,
    "source": "The Nature of Code",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://natureofcode.com/autonomous-agents/",
    "note": "書中 Figure 5.16：以 Perlin noise 計算的流場向量格"
   }
  },
  {
   "id": "C03-53",
   "algo": "C03",
   "title": "Getting Creative with Perlin Noise Fields",
   "creator": "Manohar Vanga（Sighack）",
   "year": "2018",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "作者用幾個 Processing 類別快速迭代 Perlin noise 力場中粒子的畫法：從白底低透明度黑色粒子開始，陸續嘗試黑白反轉、手選色盤分層、1% 透明度、方形筆觸端點、黃金比例配色、改畫弧線，以及依粒子壽命改變飽和度與線寬，逐步衍生出大量不同風格；程式與圖檔公開在 GitHub。重點在「同一演算法的設計變化」。",
   "variations": [
    {
     "name": "分層疊色",
     "how": "同一流場分多批粒子繪製，每批換一個由暗到亮的顏色（或用黃金比例在 HSB 色相環上取色）",
     "effect": "畫面產生深度感，色彩不需手動逐一挑選"
    },
    {
     "name": "筆觸形式",
     "how": "改變線寬、透明度（約 1%）與線端樣式（圓頭改方頭），或把線段換成弧線",
     "effect": "同一組軌跡呈現炭筆、絲線或碎片等不同質感"
    },
    {
     "name": "依壽命變化",
     "how": "粒子帶一個壽命值，隨壽命遞減調整線寬、飽和度或透明度",
     "effect": "軌跡像彗星般由粗到細、由濃到淡"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "Processing",
    "Perlin noise",
    "生成藝術"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://sighack.com/post/getting-creative-with-perlin-noise-fields",
   "image": {
    "file": "img/cases/C03-53.jpg",
    "w": 800,
    "h": 800,
    "source": "Sighack",
    "author": "Manohar Vanga",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://sighack.com/post/getting-creative-with-perlin-noise-fields",
    "note": "文章範例圖：彩色 Perlin noise 流場筆觸"
   }
  },
  {
   "id": "C03-54",
   "algo": "C03",
   "title": "Particle system with 2D vector field in TouchDesigner",
   "creator": "exsstas",
   "year": "2020",
   "category": "performance",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "TouchDesigner 教學影片：把「建立向量場並用它驅動粒子」這個生成藝術常見手法搬進 TouchDesigner，主要工作由兩個 GLSL 節點完成，程式碼簡短並逐行講解，適合 GLSL 初學者。專案檔（2D vector fields - full.toe）公開在作者的 GitHub；2021 年另有進階續集。",
   "variations": [
    {
     "name": "場存成紋理",
     "how": "把基礎範例的向量函數預先算成一張 RG 貼圖（R=x、G=y），查詢時取樣貼圖",
     "effect": "場可以用任何影像處理手法修改（模糊、疊加、手繪）"
    },
    {
     "name": "粒子位置存成紋理",
     "how": "每個像素代表一顆粒子的位置，每幀用著色器讀場並加上位移",
     "effect": "數十萬粒子也能即時運算"
    },
    {
     "name": "即時輸入改變場",
     "how": "把攝影機、聲音或滑鼠轉成貼圖後疊加到向量場",
     "effect": "觀眾動作可即時擾動流動方向"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "TouchDesigner",
    "GLSL",
    "粒子",
    "即時影像",
    "教學影片"
   ],
   "tools": [
    "TouchDesigner",
    "GLSL"
   ],
   "url": "https://www.youtube.com/watch?v=Dke6OCePR6E",
   "image": {
    "file": "img/cases/C03-54.jpg",
    "w": 480,
    "h": 360,
    "source": "YouTube",
    "author": "exsstas",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.youtube.com/watch?v=Dke6OCePR6E",
    "note": "教學影片縮圖：TouchDesigner 2D 向量場粒子"
   }
  },
  {
   "id": "C03-55",
   "algo": "C03",
   "title": "GLSL Particle Simulations in TouchDesigner Tutorial",
   "creator": "Dean Cheesman",
   "year": "2024",
   "category": "performance",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "TouchDesigner 教學影片：以 GLSL 搭配 Feedback 迴圈建立 GPU 粒子系統，章節包含 Flow Field 設定、Curl Noise、以速度控制深度、高度衰減、上色、打光、旋轉縮放與壽命重映射，最後以 Instancing 渲染成立體粒子。把平面流場延伸到三維、並加入渲染設計。",
   "variations": [
    {
     "name": "Curl noise 取代一般 noise",
     "how": "向量不是直接由 noise 值轉角度，而是取 noise 場的旋度（curl）",
     "effect": "流場無散度，粒子不會聚成點或散開，看起來像流體"
    },
    {
     "name": "速度映射到深度與顏色",
     "how": "用粒子當下速度大小控制 z 位移、顏色或尺寸",
     "effect": "靜態的流場圖變成有層次的立體雕塑感"
    },
    {
     "name": "壽命重生",
     "how": "每顆粒子有壽命，歸零時在隨機位置重生，並依壽命調整透明度",
     "effect": "畫面持續更新，不會全部聚集在匯流處"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "TouchDesigner",
    "GLSL",
    "curl noise",
    "粒子",
    "教學影片"
   ],
   "tools": [
    "TouchDesigner",
    "GLSL"
   ],
   "url": "https://www.youtube.com/watch?v=Tc0BuhlrWbM",
   "image": {
    "file": "img/cases/C03-55.jpg",
    "w": 480,
    "h": 360,
    "source": "YouTube",
    "author": "Dean Cheesman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.youtube.com/watch?v=Tc0BuhlrWbM",
    "note": "教學影片縮圖：GLSL 粒子流場"
   }
  },
  {
   "id": "C04-01",
   "algo": "C04",
   "title": "An Image Synthesizer（Perlin noise 原始論文）",
   "creator": "Ken Perlin",
   "year": "1985",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "summary": "SIGGRAPH 1985 論文，提出以非線性函數組合產生自然複雜度的「solid texture」，用來做雲、火、水、大理石、木紋、岩石等效果。本元件的 PerlinNoise class 就源自這一系列工作。",
   "variations": [
    {
     "name": "大理石紋",
     "how": "value = sin(x·k + turbulence(x,y)·a)，turbulence 為各 octave |noise| 的疊加。",
     "effect": "條紋被 noise 擾動成大理石紋路。"
    },
    {
     "name": "木紋年輪",
     "how": "以距中心距離 r 加上 noise 擾動，再取 frac(r·k)。",
     "effect": "不規則的同心年輪。"
    },
    {
     "name": "Solid texture 上色",
     "how": "對 Mesh 每個頂點位置取 3D noise，映射成頂點顏色。",
     "effect": "像從實心材料切出來的表面紋理，沒有 UV 接縫。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "隨機",
    "分形"
   ],
   "tools": [
    "論文"
   ],
   "url": "https://dl.acm.org/doi/10.1145/325165.325247"
  },
  {
   "id": "C04-02",
   "algo": "C04",
   "title": "Improving Noise 與參考實作",
   "creator": "Ken Perlin",
   "year": "2002",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "summary": "修正原版 noise 的兩個缺點：二階導數不連續（改用 6t⁵−15t⁴+10t³ 平滑曲線）與梯度選擇不佳（改用固定的 12 個方向）。本課程範例的 SmoothStep 與 CornerSlope 正是這篇的 2D 簡化版。",
   "variations": [
    {
     "name": "擴充成 3D",
     "how": "照參考實作把 ValueAt 改成 (x,y,z)、查 8 個角、12 個梯度方向。",
     "effect": "可對任意 3D 位置取樣，做曲面位移或時間動畫。"
    },
    {
     "name": "比較平滑曲線",
     "how": "把 SmoothStep 換成 3t²−2t³ 或線性，觀察 Mesh 法線著色。",
     "effect": "看出舊版在格線上的光影折痕。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "自訂 class"
   ],
   "tools": [
    "Java"
   ],
   "url": "https://mrl.cs.nyu.edu/~perlin/noise"
  },
  {
   "id": "C04-03",
   "algo": "C04",
   "title": "Minecraft 的地形生成",
   "creator": "Markus Persson（Notch）／Mojang",
   "year": "",
   "category": "3d-architecture",
   "categories_extra": [
    "modeling"
   ],
   "summary": "Minecraft 最早以 Perlin noise 生成地形，並以多層疊加的 fractal noise 增加細節；後期版本以 Continentalness、Erosion、Peaks & Valleys 等多張 noise 圖共同決定地形。是 noise 生成可探索 3D 空間的代表。",
   "variations": [
    {
     "name": "體素化",
     "how": "把高度四捨五入成整數層，每格往下堆 Box。",
     "effect": "方塊堆疊的體素地景，可直接當量體研究。"
    },
    {
     "name": "多張 noise 圖混合",
     "how": "用不同 seed 產生「大陸性」與「侵蝕度」兩張 noise，查表組合出高度曲線。",
     "effect": "平原、丘陵、山脈分區明確。"
    },
    {
     "name": "3D noise 洞穴",
     "how": "對 3D 格點取 noise，小於閾值就挖空。",
     "effect": "地下洞穴與懸崖。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "可重現種子"
   ],
   "tools": [
    "Java"
   ],
   "url": "https://dawnosaur.substack.com/p/how-minecraft-generates-worlds-you"
  },
  {
   "id": "C04-04",
   "algo": "C04",
   "title": "Perlin noise 的 Minecraft 風格渲染實驗",
   "creator": "Endre Simo",
   "year": "2014",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "summary": "以 noise 生成類 Minecraft 地圖並做網頁渲染的實驗，附開源程式碼（minecraft.js）。適合學習者對照看 noise 值如何轉成高度與材質顏色。",
   "variations": [
    {
     "name": "依高度上色",
     "how": "elevation 分成水、沙、草、岩、雪數段，給 Mesh 頂點顏色。",
     "effect": "一眼看懂的彩色地形圖。"
    },
    {
     "name": "等角投影呈現",
     "how": "體素化後以等角視角擷取。",
     "effect": "像素遊戲風格的地景分析圖。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "隨機"
   ],
   "tools": [
    "JavaScript"
   ],
   "url": "https://esimov.com/2014/10/perlin-noise-based-minecraft-rendering-experiment"
  },
  {
   "id": "C04-05",
   "algo": "C04",
   "title": "World Machine 地形生成軟體",
   "creator": "World Machine Software",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "urban-landscape"
   ],
   "summary": "專業程序化地形軟體，以 fractal（多層 Perlin）產生基礎地形，再以流水侵蝕與熱侵蝕模擬雕刻出沖溝與崖錐，輸出高度圖給遊戲與影視。展示了「noise 只是第一步」的完整管線。",
   "variations": [
    {
     "name": "節點式管線",
     "how": "把 noise、遮罩、侵蝕寫成多個 GH 元件串接，每個元件輸入輸出高度陣列 double[,]。",
     "effect": "可以逐步檢視與替換各階段。"
    },
    {
     "name": "熱侵蝕",
     "how": "反覆檢查相鄰格高差，超過安息角就把部分高度移給較低鄰格。",
     "effect": "崖壁坍落成自然的崖錐斜坡。"
    },
    {
     "name": "輸出高度圖",
     "how": "把 elevation 正規化成 0–255 寫成灰階 Bitmap。",
     "effect": "可匯入其他軟體或 CNC 軟體。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "迭代模擬",
    "物理模擬"
   ],
   "tools": [
    "World Machine"
   ],
   "url": "https://www.world-machine.com/features.php"
  },
  {
   "id": "C04-06",
   "algo": "C04",
   "title": "World Machine：Advanced Perlin Noise 裝置",
   "creator": "World Machine Software",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "summary": "World Machine 中的進階 Perlin noise 產生器說明頁，列出可調的 noise 參數（尺度、細節層數、各層衰減等），可與本元件的 scale／octaves 一一對照。",
   "variations": [
    {
     "name": "開放 persistence 與 lacunarity",
     "how": "把 LayeredNoise 中寫死的 0.5 與 2.0 改成輸入參數。",
     "effect": "控制細節是粗糙還是平滑。"
    },
    {
     "name": "ridged / billow 切換",
     "how": "每層取 |n| 或 1−|n| 的選項。",
     "effect": "同一元件產生圓丘、雲朵或山脊。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "分形"
   ],
   "tools": [
    "World Machine"
   ],
   "url": "https://help.world-machine.com/topic/device-advancedperlinnoise/"
  },
  {
   "id": "C04-07",
   "algo": "C04",
   "title": "Three Ways of Generating Terrain with Erosion Features",
   "creator": "dandrino",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "modeling"
   ],
   "summary": "開源專案比較三種生成帶侵蝕特徵地形的方法（含以 noise 為起點的模擬式侵蝕）。可作為本元件往「環境過程模擬」延伸的參考。",
   "variations": [
    {
     "name": "水滴侵蝕",
     "how": "在 noise 高度格上丟數萬個水滴，沿梯度下降並帶走、堆積泥沙。",
     "effect": "出現枝狀沖溝與沖積扇。"
    },
    {
     "name": "比較指標",
     "how": "計算坡度分布或流量累積圖，比較侵蝕前後。",
     "effect": "能量化說明地形變化，用於排水或基地分析。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "迭代模擬",
    "物理模擬"
   ],
   "tools": [
    "Python"
   ],
   "url": "https://github.com/dandrino/terrain-erosion-3-ways"
  },
  {
   "id": "C04-08",
   "algo": "C04",
   "title": "One-North Masterplan（人造地景形態的都市）",
   "creator": "Zaha Hadid Architects",
   "year": "2001",
   "category": "urban-landscape",
   "categories_extra": [
    "3d-architecture"
   ],
   "summary": "新加坡 one-north 總體規劃，把整個街區當作起伏如沙丘的人造地景處理，街廓尺寸差異化、天際線像地形。注意：官方並未說明使用 Perlin noise，此處作為「平滑連續起伏場」的都市尺度類比。",
   "variations": [
    {
     "name": "低頻 noise 當天際線",
     "how": "octaves 設 1–2、scale 很大，在每個街廓中心取值映射成建築高度。",
     "effect": "連續起伏、有整體感的天際線。"
    },
    {
     "name": "公園處強制下凹",
     "how": "以公園範圍曲線做距離遮罩，把高度壓低。",
     "effect": "中央谷地與周邊高起的地景式配置。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "吸引子控制"
   ],
   "tools": [],
   "url": "https://www.zha.com/projects/masterplans/one-north-masterplan"
  },
  {
   "id": "C04-09",
   "algo": "C04",
   "title": "Flow Fields 中以 noise 決定角度",
   "creator": "Tyler Hobbs",
   "year": "2020",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "summary": "Hobbs 的 flow field 文章指出常見做法是以 Perlin noise 決定格網上每點的角度，再讓曲線順著走。這正是 C04 與 C03 最自然的組合方式。",
   "variations": [
    {
     "name": "noise → 角度",
     "how": "angle = LayeredNoise(x,y)·2π·k，k>1 時流線更捲曲。",
     "effect": "有機、連續的流動紋理。"
    },
    {
     "name": "角度量化",
     "how": "把角度四捨五入到 45° 或 90° 的倍數。",
     "effect": "流線變成幾何折線，像電路或迷宮。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "隨機",
    "可重現種子"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://www.tylerxhobbs.com/words/flow-fields"
  },
  {
   "id": "C04-10",
   "algo": "C04",
   "title": "Curl noise：從 noise 得到流體速度場",
   "creator": "Robert Bridson, Jim Hourihan, Marcus Nordenstam",
   "year": "2007",
   "category": "art-installation",
   "categories_extra": [
    "modeling"
   ],
   "summary": "以 Perlin noise 為基礎、取其旋度產生不可壓縮的亂流場，用於影視特效的煙與粒子。對 C04 而言，是把「高度場」轉成「流動場」的經典方法。",
   "variations": [
    {
     "name": "高度場取旋度",
     "how": "對 LayeredNoise 做有限差分，取 (∂n/∂y, −∂n/∂x)。",
     "effect": "流線沿 noise 的等高線環繞，不會匯聚。"
    },
    {
     "name": "粒子雲裝置",
     "how": "大量粒子在 3D curl noise 中漂移，輸出軌跡成管狀。",
     "effect": "像煙霧凝固的懸吊雕塑。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "物理模擬",
    "3D"
   ],
   "tools": [
    "VFX 軟體"
   ],
   "url": "https://dl.acm.org/doi/10.1145/1275808.1276435"
  },
  {
   "id": "C04-11",
   "algo": "C04",
   "title": "Making maps with noise functions",
   "creator": "Amit Patel（Red Blob Games）",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "urban-landscape"
   ],
   "summary": "以互動網頁示範如何用 noise 做地圖：頻率、振幅疊加、重新分配高度、以高度與濕度兩張 noise 決定生物群系等。是理解本元件參數最友善的教材。（網址未於本次搜尋中取得）",
   "variations": [
    {
     "name": "高度重新分配",
     "how": "elevation = Math.Pow(normalized, exponent)，exponent>1 讓低地變多、山峰更尖。",
     "effect": "從起伏丘陵變成平原＋孤峰。"
    },
    {
     "name": "高度＋濕度分區",
     "how": "第二個 PerlinNoise(seed+1) 當濕度，二維查表決定分區顏色。",
     "effect": "自然的植栽／用地分區圖。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "可重現種子"
   ],
   "tools": [
    "JavaScript"
   ],
   "url": ""
  },
  {
   "id": "C04-12",
   "algo": "C04",
   "title": "Perlin noise 及其改良：文獻回顧",
   "creator": "",
   "year": "",
   "category": "drawing",
   "categories_extra": [],
   "summary": "回顧 Perlin noise 1985 原版、2002 改良版（三次→五次平滑曲線、固定梯度表）與 Simplex noise 的差異，附圖比較未內插與內插的 2D noise。適合寫研究報告時引用演算法演進。",
   "variations": [
    {
     "name": "換成 Simplex / OpenSimplex",
     "how": "把 PerlinNoise class 換成三角形格的 simplex 實作，介面 ValueAt 不變。",
     "effect": "減少方向性格線痕跡，高維度時更快。"
    },
    {
     "name": "Value noise 對照",
     "how": "角落直接存隨機值而非梯度，內插得到 value noise。",
     "effect": "看出 gradient noise 為何較不塊狀。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "自訂 class"
   ],
   "tools": [
    "論文"
   ],
   "url": "https://ace.ewapub.com/article/view/14225.pdf"
  },
  {
   "id": "C04-51",
   "algo": "C04",
   "title": "Coding Challenge 11：3D Terrain Generation with Perlin Noise in Processing",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2016",
   "category": "urban-landscape",
   "categories_extra": [
    "modeling"
   ],
   "scale": "地景",
   "summary": "用 Processing 建立三角網格（TRIANGLE_STRIP），以二維 Perlin noise 決定每個頂點高度，並讓 noise 取樣座標隨時間平移，做出像飛越山脈般的無限地形動畫。和 Grasshopper 範例的靜態高度場相比，重點在「移動 noise 取樣窗」產生連續動態。",
   "variations": [
    {
     "name": "取樣窗平移",
     "how": "每幀把 noise 的 y 起點加上一個小值（flying），其餘不變",
     "effect": "地形看起來往前捲動，像在飛行"
    },
    {
     "name": "調整取樣間距",
     "how": "改變 xoff、yoff 每格遞增量",
     "effect": "遞增量小得到緩丘，大則得到尖銳崎嶇的山"
    },
    {
     "name": "以高度上色",
     "how": "依頂點高度套用水、草、岩、雪的色帶",
     "effect": "純網格變成可讀的地形圖"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "Processing",
    "Perlin noise",
    "地形",
    "教學影片"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://thecodingtrain.com/challenges/11-3d-terrain-generation-with-perlin-noise",
   "image": {
    "file": "img/cases/C04-51.jpg",
    "w": 900,
    "h": 506,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/11-3d-terrain-generation-with-perlin-noise",
    "note": "挑戰頁預覽圖：Perlin noise 三角網格地形"
   }
  },
  {
   "id": "C04-52",
   "algo": "C04",
   "title": "Coding Challenge #136：Polar Perlin Noise Loops",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2019",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "兩部分的挑戰：先用極座標繞圓在 noise 空間中取樣，讓不規則圓形的起點與終點相接不留接縫；再用同樣原理讓粒子隨機移動但在固定幀數後回到原位，做成完美循環的 GIF。提供 p5.js 與 Processing 版本。",
   "variations": [
    {
     "name": "沿圓周取樣",
     "how": "半徑擾動不用 noise(angle)，而是 noise(cos(a)·r, sin(a)·r)",
     "effect": "封閉曲線首尾平滑相接，沒有斷點"
    },
    {
     "name": "時間也走圓",
     "how": "把時間參數也換成在 noise 空間中繞一圈（多一個維度）",
     "effect": "動畫完美循環，可輸出無縫 GIF"
    },
    {
     "name": "取樣半徑當粗糙度",
     "how": "增大 noise 空間中的圓半徑",
     "effect": "形狀由圓潤變得皺摺豐富"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "Processing",
    "Perlin noise",
    "循環動畫",
    "教學影片"
   ],
   "tools": [
    "p5.js",
    "Processing"
   ],
   "url": "https://thecodingtrain.com/challenges/136-polar-noise-loops",
   "image": {
    "file": "img/cases/C04-52.jpg",
    "w": 480,
    "h": 360,
    "source": "YouTube／The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/136-polar-noise-loops",
    "note": "影片縮圖：以極座標 noise 繪製的封閉形狀"
   }
  },
  {
   "id": "C04-53",
   "algo": "C04",
   "title": "Noise loop／noise propagation（Processing 循環動畫教學）",
   "creator": "Étienne Jacob（bleuje）",
   "year": "2020",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "以循環 GIF 作品聞名的 Étienne Jacob 的教學：先用「在 2D noise 中繞圓」得到平滑的隨機週期函數，再用 4D OpenSimplex noise 的另外兩個維度讓週期函數隨空間位置緩慢變化，加上徑向偏移，讓大量小點產生像波浪傳遞般的完美循環動畫。",
   "variations": [
    {
     "name": "4D noise",
     "how": "noise 取樣座標改為 (圓周 x, 圓周 y, 位置 x·scl, 位置 y·scl)",
     "effect": "每個點的運動都循環，但彼此在空間中平滑相異"
    },
    {
     "name": "徑向延遲",
     "how": "每個點的時間參數減去與中心距離乘上係數",
     "effect": "運動由中心向外一圈圈傳播"
    },
    {
     "name": "改用 OpenSimplex",
     "how": "把內建 Perlin noise 換成 OpenSimplex 實作",
     "effect": "較少方向性格線瑕疵，質感不同"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Processing",
    "OpenSimplex noise",
    "循環動畫"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://bleuje.com/tutorial3/",
   "image": {
    "file": "img/cases/C04-53.jpg",
    "w": 500,
    "h": 500,
    "source": "bleuje.com",
    "author": "Étienne Jacob",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://bleuje.com/tutorial3/",
    "note": "教學成品 GIF 第一格：noise 傳播的點陣循環動畫"
   }
  },
  {
   "id": "C04-54",
   "algo": "C04",
   "title": "Looping Noise Part 1: Ending at the Beginning（TouchDesigner）",
   "creator": "Simon Alexander-Adams",
   "year": "2019",
   "category": "performance",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "入門級 TouchDesigner 教學，說明如何讓 noise 在時間上首尾相接以製作循環動畫，並在 TouchDesigner 中重現 Étienne Jacob 部落格文章裡的 Processing 草圖。示範同一個 noise 技巧如何從程式碼環境移植到節點式的即時影像環境。",
   "variations": [
    {
     "name": "節點化的 noise 取樣",
     "how": "把程式裡的 noise 呼叫改成 Noise CHOP／TOP，以圓形路徑的座標作為輸入",
     "effect": "不用寫程式就能調整循環 noise"
    },
    {
     "name": "循環週期參數化",
     "how": "把一圈的幀數做成可調參數，與輸出影格數綁定",
     "effect": "輸出長度改變時仍保持無縫"
    },
    {
     "name": "移植到 Grasshopper",
     "how": "以 Series 產生角度，cos／sin 得到座標後餵給 noise 元件，再驅動點位移",
     "effect": "在 GH 中也能做出可循環的參數動畫"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "TouchDesigner",
    "Perlin noise",
    "循環動畫",
    "教學"
   ],
   "tools": [
    "TouchDesigner"
   ],
   "url": "https://www.simonaa.media/tutorials/looping-noise-part-1",
   "image": {
    "file": "img/cases/C04-54.jpg",
    "w": 900,
    "h": 250,
    "source": "simonaa.media",
    "author": "Simon Alexander-Adams",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.simonaa.media/tutorials/looping-noise-part-1",
    "note": "教學頁 GIF 第一格：循環 noise 點雲"
   }
  },
  {
   "id": "C04-55",
   "algo": "C04",
   "title": "The Book of Shaders 第 11 章：Noise",
   "creator": "Patricio Gonzalez Vivo、Jen Lowe",
   "year": "2015",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "GLSL 片段著色器入門書的雜訊章節：從 value noise 開始，說明其塊狀感的來源，再介紹 Ken Perlin 的梯度雜訊（gradient noise）與 simplex noise，每個概念都附可即時編修的著色器範例。和 Grasshopper 中逐點呼叫 noise 不同，這裡每個像素平行計算。",
   "variations": [
    {
     "name": "Value 改 Gradient",
     "how": "格點上不存隨機數值，而是隨機梯度向量，內插的是點積",
     "effect": "消除方塊狀瑕疵，得到更自然的起伏"
    },
    {
     "name": "平滑內插函數",
     "how": "把線性內插換成 smoothstep 或五次曲線",
     "effect": "格線邊界的折痕消失"
    },
    {
     "name": "Noise 驅動圖樣",
     "how": "用 noise 值扭曲線條、同心圓或木紋函數的輸入",
     "effect": "得到木紋、大理石、水波等材質"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "GLSL",
    "shader",
    "Perlin noise",
    "simplex noise",
    "線上教科書"
   ],
   "tools": [
    "GLSL"
   ],
   "url": "https://thebookofshaders.com/11/"
  },
  {
   "id": "C04-56",
   "algo": "C04",
   "title": "Domain Warping 領域扭曲",
   "creator": "Inigo Quilez",
   "year": "2002",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "把 fBM（多層不同頻率 noise 疊加）的輸入座標再用另一組 fBM 扭曲，形成 f(p + fbm(p + fbm(p))) 的巢狀結構，得到類似大理石、煙霧、流體的有機紋理，並用中間變數上色。文章附 GLSL 程式與 Shadertoy 即時範例，是 noise 在 shader 藝術中最常見的進階用法之一。",
   "variations": [
    {
     "name": "fBM 疊層",
     "how": "把單一 noise 改成 4–8 個八度相加，頻率倍增、振幅減半",
     "effect": "同時具有大起伏與細節"
    },
    {
     "name": "一層或兩層扭曲",
     "how": "先算 q = (fbm(p), fbm(p+偏移))，再算 fbm(p + 4q)；可再多套一層",
     "effect": "每多一層，紋理越捲曲、越像流體"
    },
    {
     "name": "以中間值上色",
     "how": "把 q、r 等中間向量的長度或分量拿來混合顏色",
     "effect": "色彩隨扭曲結構分布，層次比單純灰階豐富"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "GLSL",
    "Shadertoy",
    "fBM",
    "shader"
   ],
   "tools": [
    "GLSL",
    "Shadertoy"
   ],
   "url": "https://iquilezles.org/articles/warp/",
   "image": {
    "file": "img/cases/C04-56.jpg",
    "w": 900,
    "h": 352,
    "source": "iquilezles.org",
    "author": "Inigo Quilez",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://iquilezles.org/articles/warp/",
    "note": "文章首圖：f(p)=fbm(p+fbm(p+fbm(p))) 的領域扭曲紋理"
   }
  },
  {
   "id": "C05-01",
   "algo": "C05",
   "title": "Marching Cubes：CT／MRI 醫學影像重建",
   "creator": "William E. Lorensen、Harvey E. Cline（General Electric）",
   "year": "1987",
   "category": "drawing",
   "categories_extra": [
    "modeling"
   ],
   "scale": "物件",
   "summary": "SIGGRAPH 1987 論文，把 CT、MRI 等 3D 醫學掃描資料中「密度相同」的位置轉成三角形模型，是 Marching Squares 的 3D 版本，也是電腦圖學引用最多的論文之一。基礎範例的查表＋邊上內插就是它在 2D 的縮小版。",
   "variations": [
    {
     "name": "改成讀取切片影像",
     "how": "把 FieldValue 換成讀取一疊灰階影像（每張一層 Z），先在單層上做 C05 的等值線",
     "effect": "得到每層的輪廓，疊起來就是斷層掃描重建的雛形"
    },
    {
     "name": "升維為 3D 查表",
     "how": "cornerValues 改成 double[,,]，每格 8 角，用 F03 的四面體切法產生三角形",
     "effect": "直接從體素資料生成可列印的 3D Mesh"
    },
    {
     "name": "梯度法線",
     "how": "在格點用中央差分算場的梯度，內插到頂點作為 Mesh 法線",
     "effect": "著色更平滑，不需加密網格"
    }
   ],
   "difficulty": 4,
   "tags": [
    "等值面",
    "3D",
    "查表",
    "影像輸入"
   ],
   "tools": [
    "C"
   ],
   "url": "https://dl.acm.org/doi/10.1145/37402.37422"
  },
  {
   "id": "C05-02",
   "algo": "C05",
   "title": "Metaballs：Carl Sagan《Cosmos》的原子模型",
   "creator": "Jim Blinn",
   "year": "1982",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Blinn 為電視節目《Cosmos》模擬原子交互作用而發展出 blobby 模型，1982 年發表於 ACM TOG。每個球貢獻一個隨距離衰減的場，相加後取等值面，形體會自然融合——正是基礎範例 FieldValue 的原型。",
   "variations": [
    {
     "name": "換衰減函數",
     "how": "把 r²/d² 換成高斯函數 exp(-d²/r²) 或 Wyvill 的多項式軟物件函數",
     "effect": "融合更柔順，且影響範圍有限、遠處不會互相干擾"
    },
    {
     "name": "線段與曲線當場源",
     "how": "場源改成到線段或 Curve 的距離，而不只是點",
     "effect": "得到骨架狀、管狀融合的有機形"
    },
    {
     "name": "負球挖洞",
     "how": "允許半徑權重為負值",
     "effect": "在融合體中挖出凹陷或孔洞"
    }
   ],
   "difficulty": 2,
   "tags": [
    "等值面",
    "吸引子控制"
   ],
   "tools": [],
   "url": "https://en.wikipedia.org/wiki/Metaballs"
  },
  {
   "id": "C05-03",
   "algo": "C05",
   "title": "Blob Architecture（泡泡建築）",
   "creator": "Greg Lynn",
   "year": "1995",
   "category": "3d-architecture",
   "categories_extra": [
    "modeling"
   ],
   "scale": "建築",
   "summary": "Greg Lynn 在 1995 年以 metaball 圖學軟體實驗設計並提出 blob architecture 一詞，影響了一整代以數位工具生成有機曲面的建築。其形體生成邏輯即為多個場源加總後取等值面。",
   "variations": [
    {
     "name": "空間計畫當場源",
     "how": "每個機能空間一個中心點，半徑對應面積需求，threshold 決定是否融合成一棟",
     "effect": "由泡泡圖直接長出平面輪廓，可比較不同門檻下的連通關係"
    },
    {
     "name": "多樓層切片",
     "how": "對每個樓層高度 z 算一次等值線（場源為 3D 點）",
     "effect": "得到逐層變化的樓板輪廓，疊起來是有機量體"
    },
    {
     "name": "結合 3D 等值面",
     "how": "改用 F03 的四面體管線輸出 Mesh",
     "effect": "直接生成泡泡狀量體外殼"
    }
   ],
   "difficulty": 3,
   "tags": [
    "等值面",
    "吸引子控制",
    "3D"
   ],
   "tools": [],
   "url": "https://en.wikipedia.org/wiki/Blob_architecture"
  },
  {
   "id": "C05-04",
   "algo": "C05",
   "title": "AR Sandbox 擴增實境沙盤",
   "creator": "Oliver Kreylos（UC Davis）",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "地景",
   "summary": "用 Kinect 深度相機即時掃描沙盤高度，再以投影機把高程色帶、地形等高線與模擬水流投回沙面，讓人用手堆沙就能看懂等高線地形圖。全世界已有數千處安裝，軟體開源。",
   "variations": [
    {
     "name": "深度影像當場值",
     "how": "把 cornerValues 換成深度相機或 DEM 影像的像素高度",
     "effect": "即時從實體模型生成等高線"
    },
    {
     "name": "多層等高線加色帶",
     "how": "threshold 改為等距多值，每層用不同顏色輸出",
     "effect": "完整的地形分層圖"
    },
    {
     "name": "加上水流模擬",
     "how": "在同一網格上跑簡單的水流擴散（C 家族），水深再描一條等值線",
     "effect": "看出集水區與積水範圍"
    }
   ],
   "difficulty": 3,
   "tags": [
    "影像輸入",
    "動畫",
    "網格擴散"
   ],
   "tools": [
    "Kinect",
    "開源軟體"
   ],
   "url": "https://datalab.ucdavis.edu/arsandbox/"
  },
  {
   "id": "C05-05",
   "algo": "C05",
   "title": "等高線地形圖與氣象等壓線",
   "creator": "地圖與氣象製圖通用做法",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "drawing"
   ],
   "scale": "地景",
   "summary": "Marching Squares 最典型的用途：從規則格網的高程或氣壓資料畫出等高線（isoline）與等值帶（isoband）。建築系做基地模型時的分層等高線，背後就是同一件事。",
   "variations": [
    {
     "name": "多閾值等距輸出",
     "how": "threshold 改為 start + i·step 的迴圈，輸出 DataTree",
     "effect": "標準等高線圖"
    },
    {
     "name": "封閉並擠出",
     "how": "JoinCurves 後以 Extrude 依高度擠出板厚",
     "effect": "可雷切的疊層地形模型"
    },
    {
     "name": "Isoband 填色",
     "how": "每兩個閾值之間的區域做成面並著色",
     "effect": "高程色帶地圖"
    }
   ],
   "difficulty": 2,
   "tags": [
    "等值面",
    "影像輸入"
   ],
   "tools": [
    "GIS"
   ],
   "url": "https://en.wikipedia.org/wiki/Marching_squares"
  },
  {
   "id": "C05-06",
   "algo": "C05",
   "title": "d3-contour：網頁資料視覺化的等值線",
   "creator": "D3（Mike Bostock 與貢獻者）",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "D3 的 d3-contour 模組對矩形數值陣列套用 Marching Squares 計算等值多邊形，常用於密度圖、地形圖等資料視覺化。它輸出的是封閉多邊形，是基礎範例「散線段」的進階版。",
   "variations": [
    {
     "name": "點密度當場值",
     "how": "把一堆散點（例如人流 GPS 點）以核密度估計累加到格點上",
     "effect": "人流或事件的熱區等值圖"
    },
    {
     "name": "直接輸出多邊形",
     "how": "線段依端點相接串成 Polyline，並判斷方向區分外框與洞",
     "effect": "可直接填色的封閉區塊"
    },
    {
     "name": "平滑處理",
     "how": "輸出的 Polyline 再做 Chaikin 細分或轉成 NURBS",
     "effect": "去除格子造成的折角感"
    }
   ],
   "difficulty": 3,
   "tags": [
    "等值面",
    "資料視覺化"
   ],
   "tools": [
    "JavaScript",
    "D3"
   ],
   "url": "https://github.com/d3/d3-contour"
  },
  {
   "id": "C05-07",
   "algo": "C05",
   "title": "Coding Train C5 — Marching Squares",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以 p5.js 逐步講解 Marching Squares，示範把 Open Simplex 雜訊、metaballs、Worley 雜訊、攝影機畫面與影像等各種輸入描成平滑等值線，是自學最好上手的教材。",
   "variations": [
    {
     "name": "換成雜訊場",
     "how": "FieldValue 改為 Simplex／Perlin noise 取樣",
     "effect": "有機地形般的斑紋"
    },
    {
     "name": "Worley 雜訊",
     "how": "場值改為到最近隨機點的距離",
     "effect": "細胞、龜裂狀圖樣"
    },
    {
     "name": "即時攝影機輸入",
     "how": "每幀讀取影像亮度當場值（GH 可用 Timer 讀取檔案）",
     "effect": "會跟著畫面流動的輪廓藝術"
    }
   ],
   "difficulty": 2,
   "tags": [
    "隨機",
    "影像輸入",
    "動畫"
   ],
   "tools": [
    "p5.js",
    "Processing"
   ],
   "url": "https://thecodingtrain.com/challenges/c5-marching-squares"
  },
  {
   "id": "C05-08",
   "algo": "C05",
   "title": "Dendro：OpenVDB 體素建模外掛",
   "creator": "ryein（Dendro 開發者）",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "Grasshopper 外掛，建構於 OpenVDB，把點、曲線、Mesh 包成體積資料後做布林、平滑、偏移、形變，再轉回 Mesh。本質是 3D 場＋等值面擷取，等於基礎範例的工業強度版。",
   "variations": [
    {
     "name": "曲線包覆",
     "how": "場值改為到多條曲線的最短距離，threshold 當作管徑",
     "effect": "節點自然融合的管網結構，類似 Dendro 的 curve to volume"
    },
    {
     "name": "平滑聯集",
     "how": "兩個場用 smooth min 公式合併，而不是直接取 min",
     "effect": "接合處圓順過渡的構件接頭"
    },
    {
     "name": "偏移與挖空",
     "how": "對距離場加減常數再取差集",
     "effect": "有固定壁厚的殼體，可 3D 列印"
    }
   ],
   "difficulty": 4,
   "tags": [
    "等值面",
    "3D",
    "空間索引"
   ],
   "tools": [
    "Grasshopper",
    "OpenVDB",
    "C#",
    "C++"
   ],
   "url": "https://github.com/ryein/dendro"
  },
  {
   "id": "C05-09",
   "algo": "C05",
   "title": "Millipede：結構分析與等值面擷取",
   "creator": "Panagiotis Michalatos",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "modeling"
   ],
   "scale": "構件",
   "summary": "Millipede 是 Grasshopper 的結構分析與拓樸最佳化外掛，同時提供從體積純量場擷取等值面 Mesh，以及在 Mesh 上畫曲線等值線的功能。拓樸最佳化得到的密度場，就是靠等值面變成可建造的形。",
   "variations": [
    {
     "name": "應力場等值線",
     "how": "把結構分析每個格點的應力值當 cornerValues",
     "effect": "看出高應力區的輪廓，決定加勁或開孔位置"
    },
    {
     "name": "密度場描邊",
     "how": "拓樸最佳化結果（0–1 密度）取 0.5 等值線",
     "effect": "從灰階最佳化結果得到清楚的構件外形"
    },
    {
     "name": "Mesh 上的等值線",
     "how": "在 Mesh 每個三角形上做 marching triangles（3 角、8 種情況）",
     "effect": "在任意曲面上畫出分析結果的等值線"
    }
   ],
   "difficulty": 4,
   "tags": [
    "等值面",
    "最佳化",
    "曲面上"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://www.grasshopper3d.com/group/millipede"
  },
  {
   "id": "C05-10",
   "algo": "C05",
   "title": "Axolotl：SDF 體積建模元件",
   "creator": "Mathias Bernhard、Benjamin Dillenburger（ETH Zurich DBT）",
   "year": "2019",
   "category": "modeling",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "ETH Zurich 數位建築技術研究室開發的 Grasshopper 元件集，以有號距離函數（SDF）表示形體，支援布林、晶格與 TPMS，並用 Marching Cubes 轉成 Mesh。多數元件為 Python 腳本，定位偏向教學。",
   "variations": [
    {
     "name": "SDF 基本形",
     "how": "FieldValue 改為圓、矩形的有號距離，threshold 設 0",
     "effect": "精準的幾何輪廓而非泡泡形"
    },
    {
     "name": "SDF 布林",
     "how": "聯集 min(a,b)、交集 max(a,b)、差集 max(a,-b)",
     "effect": "用數學組合出複雜平面形"
    },
    {
     "name": "偏移即等值",
     "how": "threshold 改成 ±offset",
     "effect": "等距外擴或內縮的輪廓，可做牆厚或退縮線"
    }
   ],
   "difficulty": 3,
   "tags": [
    "等值面",
    "3D"
   ],
   "tools": [
    "Grasshopper",
    "Python"
   ],
   "url": "https://dbt.arch.ethz.ch/project/axolotl/"
  },
  {
   "id": "C05-11",
   "algo": "C05",
   "title": "Modeling with Distance Functions（SDF 建模）",
   "creator": "Inigo Quilez",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "modeling"
   ],
   "scale": "物件",
   "summary": "Shadertoy 共同創辦人 Inigo Quilez 整理的 SDF 基本形與平滑組合公式集，是 demoscene 與程式化建模的重要參考。這些公式可直接貼進基礎範例的 FieldValue，再由 Marching Squares／Cubes 轉成幾何。",
   "variations": [
    {
     "name": "smooth min 融合",
     "how": "用 smin(a,b,k) 取代加總，k 控制融合圓角",
     "effect": "可控制圓角大小的有機聯集"
    },
    {
     "name": "空間重複",
     "how": "座標先取 mod 再算 SDF",
     "effect": "一個公式得到整片重複圖樣，可做立面花格"
    },
    {
     "name": "扭轉與彎曲",
     "how": "代入公式前先旋轉座標，角度隨位置變化",
     "effect": "扭曲、流動的圖樣"
    }
   ],
   "difficulty": 3,
   "tags": [
    "等值面",
    "對稱"
   ],
   "tools": [
    "GLSL",
    "Shadertoy"
   ],
   "url": "https://iquilezles.org/articles/distfunctions/"
  },
  {
   "id": "C05-12",
   "algo": "C05",
   "title": "Marching Cubes 程式化地形（Coding Adventure）",
   "creator": "Sebastian Lague",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "modeling"
   ],
   "scale": "地景",
   "summary": "以 Unity 與 compute shader 實作 Marching Cubes 產生可挖掘、可有洞穴的程式化地形，並附教學影片與 MIT 授權原始碼。展示了等值面方法能處理高度圖做不到的懸崖與洞穴。",
   "variations": [
    {
     "name": "3D 雜訊地形",
     "how": "場值 = 雜訊(x,y,z) − z，取 0 等值面",
     "effect": "有懸挑與洞穴的地形，而非單純高度圖"
    },
    {
     "name": "即時挖填",
     "how": "滑鼠點擊處對周圍格點加減場值再重算",
     "effect": "可互動雕塑的地景模型"
    },
    {
     "name": "GPU 加速",
     "how": "把逐格計算搬到平行迴圈或 shader",
     "effect": "高解析度仍可即時互動"
    }
   ],
   "difficulty": 4,
   "tags": [
    "等值面",
    "3D",
    "隨機",
    "動畫"
   ],
   "tools": [
    "Unity",
    "C#",
    "Compute Shader"
   ],
   "url": "https://github.com/SebLague/Marching-Cubes"
  },
  {
   "id": "C05-13",
   "algo": "C05",
   "title": "Monolith：多材料體素設計工具",
   "creator": "Panagiotis Michalatos、Andrew O. Payne（Autodesk）",
   "year": "2018",
   "category": "fabrication",
   "categories_extra": [
    "modeling"
   ],
   "scale": "物件",
   "summary": "Autodesk 研究團隊開發的體素化設計工具，以體積場而非邊界曲面描述物件，適合多材料 3D 列印與漸變材質。場的思維與基礎範例一致，最後同樣需要等值面把場轉成可輸出的幾何。",
   "variations": [
    {
     "name": "兩種材料的場",
     "how": "同時計算兩個場，比較大小決定每格屬於哪種材料，並各自描邊",
     "effect": "材料分區圖，可對應多材料列印"
    },
    {
     "name": "漸變材料比例",
     "how": "輸出每格的混合比例並以點雲顏色表示",
     "effect": "軟硬漸變的構件"
    },
    {
     "name": "逐層切片輸出",
     "how": "每個 Z 高度做一次 C05，得到該層輪廓",
     "effect": "可直接給列印機的切片路徑"
    }
   ],
   "difficulty": 4,
   "tags": [
    "等值面",
    "3D"
   ],
   "tools": [
    "Monolith"
   ],
   "url": "https://www.monolith.zone/"
  },
  {
   "id": "C05-51",
   "algo": "C05",
   "title": "Coding Challenge #28：Metaballs",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2016",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以 Processing 對每個像素計算多顆移動圓的距離倒數總和，得到會互相融合的「變形球」純量場並依數值上色。它示範的是等值線要擷取的那個純量場本身；後續 C5 Marching Squares 挑戰再把同類場轉成輪廓線。",
   "variations": [
    {
     "name": "場函數 Σ r/d",
     "how": "把基礎範例的場函數改成多個移動中心的 r／距離 總和",
     "effect": "等值線會像水滴般融合與分離"
    },
    {
     "name": "逐像素上色",
     "how": "不擷取輪廓，直接把場值映射成亮度或色相",
     "effect": "看出整個場的分布，便於決定等值門檻"
    },
    {
     "name": "中心點運動",
     "how": "每顆球有速度並在邊界反彈，每幀重算場",
     "effect": "得到持續變形的有機形體動畫"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "Processing",
    "metaballs",
    "純量場",
    "教學影片"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://thecodingtrain.com/challenges/28-metaballs",
   "image": {
    "file": "img/cases/C05-51.jpg",
    "w": 900,
    "h": 506,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/28-metaballs",
    "note": "挑戰頁預覽圖：metaball 純量場上色"
   }
  },
  {
   "id": "C05-52",
   "algo": "C05",
   "title": "Metaballs and Marching Squares",
   "creator": "Jamie Wong",
   "year": "2014",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "互動式文章，在 HTML canvas 上逐步說明 metaball 的場函數、marching squares 的 16 種角點情況對應表，以及用線性內插讓輪廓頂點落在正確位置，每一步都有可操作的 JavaScript 示範。是 Grasshopper C# 範例背後演算法的圖解版。",
   "variations": [
    {
     "name": "線性內插頂點",
     "how": "邊上的頂點不放在邊中點，而是依兩端場值與門檻比例內插",
     "effect": "輪廓由鋸齒狀變成平滑曲線"
    },
    {
     "name": "只算邊界附近",
     "how": "先找出跨越門檻的格子，只在該區域細分計算",
     "effect": "大格點時效能明顯提升"
    },
    {
     "name": "調整網格解析度",
     "how": "改變取樣格大小並比較輪廓品質",
     "effect": "直觀理解解析度與精度、速度的取捨"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "JavaScript",
    "Canvas",
    "metaballs",
    "互動文章"
   ],
   "tools": [
    "JavaScript",
    "HTML Canvas"
   ],
   "url": "https://jamie-wong.com/2014/08/19/metaballs-and-marching-squares/",
   "image": {
    "file": "img/cases/C05-52.jpg",
    "w": 700,
    "h": 200,
    "source": "jamie-wong.com",
    "author": "Jamie Wong",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://jamie-wong.com/2014/08/19/metaballs-and-marching-squares/",
    "note": "文章圖：兩顆 metaball 逐步融合的過程"
   }
  },
  {
   "id": "C05-53",
   "algo": "C05",
   "title": "Polygonising a scalar field（Marching Cubes 參考實作）",
   "creator": "Paul Bourke（表格來自 Cory Gene Bloyd）",
   "year": "1994",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "物件",
   "summary": "把 marching squares 延伸到三維：對每個立方體的 8 個角點判斷內外，查 256 種情況的邊表與三角形表，在跨越等值的邊上內插頂點並輸出三角面。這份網頁附短小的 C 程式與查表，被後來無數 creative coding 與遊戲的 marching cubes 實作沿用。",
   "variations": [
    {
     "name": "2D 到 3D",
     "how": "把 cornerValues 從 4 個角點改為 8 個，case 索引由 4 位元變 8 位元，查 edgeTable／triTable",
     "effect": "從等值線變成等值面網格"
    },
    {
     "name": "頂點法向量",
     "how": "以場的梯度（中央差分）作為頂點法向量",
     "effect": "著色平滑，不會看到網格面折"
    },
    {
     "name": "讀入體積資料",
     "how": "場值改為讀取醫學影像切片或模擬結果的 3D 陣列",
     "effect": "可重建器官、土壤或結構應力的等值面"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "C",
    "marching cubes",
    "等值面",
    "參考實作"
   ],
   "tools": [
    "C",
    "OpenGL"
   ],
   "url": "https://paulbourke.net/geometry/polygonise/",
   "image": {
    "file": "img/cases/C05-53.jpg",
    "w": 415,
    "h": 214,
    "source": "paulbourke.net",
    "author": "Paul Bourke",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://paulbourke.net/geometry/polygonise/",
    "note": "立方體頂點與邊的編號圖（查表用）"
   }
  },
  {
   "id": "C05-54",
   "algo": "C05",
   "title": "ofxMetaballs：openFrameworks 變形球外掛",
   "creator": "Kyle McDonald",
   "year": "2012",
   "category": "modeling",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "openFrameworks 的 addon，提供 marching cubes（MC）與 marching tetrahedrons（MT）兩種三維等值面擷取實作，附以 noise 為場的範例。README 說明兩者差異：MT 產生的網格一定可 3D 列印，MC 較快但不一定是流形。適合比較兩種擷取法在可製造性上的取捨。",
   "variations": [
    {
     "name": "改用四面體切分",
     "how": "每個立方體再切成 6 個四面體，對每個四面體做 marching",
     "effect": "沒有 MC 的歧義情況，網格保證封閉可列印"
    },
    {
     "name": "noise 當場",
     "how": "場函數用 3D noise 取代 metaball 距離函數",
     "effect": "得到像洞穴或珊瑚的有機體積"
    },
    {
     "name": "場值正規化",
     "how": "輸入前先把場值縮放到 0–1（MC 內部為 −1 到 1）",
     "effect": "同一組資料可在兩種方法間切換而不需改門檻"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "openFrameworks",
    "C++",
    "marching cubes",
    "3D 列印"
   ],
   "tools": [
    "openFrameworks"
   ],
   "url": "https://github.com/kylemcdonald/ofxMetaballs"
  },
  {
   "id": "C05-55",
   "algo": "C05",
   "title": "Smooth Voxel Terrain（Part 2）：Marching Cubes 與 Surface Nets",
   "creator": "Mikola Lysenko（0 FPS）",
   "year": "2012",
   "category": "urban-landscape",
   "categories_extra": [
    "modeling"
   ],
   "scale": "地景",
   "summary": "比較三種從體素純量場擷取網格的方法：marching cubes、marching tetrahedra 與 surface nets，說明 marching cubes 的歷史、查表結構與實作難處，並提供可在瀏覽器執行的 JavaScript 示範。適合了解 marching 系列之外的等值面替代做法。",
   "variations": [
    {
     "name": "Surface Nets",
     "how": "不在每條邊放頂點，而是每個跨越門檻的格子放一個頂點（取邊交點平均），再連接相鄰格子的頂點",
     "effect": "網格頂點數較少、四邊形為主、表面較平順"
    },
    {
     "name": "Minecraft 式體素",
     "how": "只輸出場值大於門檻的方塊面",
     "effect": "得到方塊風格地形，可與平滑版本對照"
    },
    {
     "name": "三線性內插場",
     "how": "粗格點上的場值用三線性內插取得中間值",
     "effect": "解析度與平滑度可分開控制"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "JavaScript",
    "WebGL",
    "marching cubes",
    "surface nets",
    "體素"
   ],
   "tools": [
    "JavaScript",
    "WebGL"
   ],
   "url": "https://0fps.net/2012/07/12/smooth-voxel-terrain-part-2/",
   "image": {
    "file": "img/cases/C05-55.jpg",
    "w": 501,
    "h": 236,
    "source": "0fps.net",
    "author": "Mikola Lysenko",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://0fps.net/2012/07/12/smooth-voxel-terrain-part-2/",
    "note": "文章預覽圖：marching cubes 的立方體情況"
   }
  },
  {
   "id": "D01-01",
   "algo": "D01",
   "title": "Stanley and Stella in: Breaking the Ice",
   "creator": "Craig Reynolds／Symbolics Graphics Division 與 Whitney / Demos Productions",
   "year": "1987",
   "category": "drawing",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "群體／都市",
   "summary": "Boids 模型最早的應用之一，在 SIGGRAPH '87 Electronic Theater 首映的動畫短片。片中鳥群與魚群分別在被冰層隔開的球體兩半中游動，群體運動全由每隻個體的局部規則產生，而不是逐隻打關鍵格。",
   "variations": [
    {
     "name": "球體內群聚",
     "how": "把 Move 的正方體反彈改成球體邊界：超出半徑就把速度沿法向量反射。",
     "effect": "群體沿球殼內側流動，呈現片中那種被容器包住的魚群感"
    },
    {
     "name": "雙群體分隔",
     "how": "建立兩個 List<Bird>，各自只看同群鄰居，中間放一個平面障礙物加迴避力。",
     "effect": "兩群各自群聚、隔著界面互望，可做成對照的雙群軌跡圖"
    },
    {
     "name": "Timer 動畫輸出",
     "how": "改成每次執行走一步並用 Timer 驅動，每步輸出鳥的位置與方向作為 Plane。",
     "effect": "可在 Rhino 中擺放鳥的幾何並錄成動畫"
    }
   ],
   "difficulty": 3,
   "tags": [
    "動畫",
    "3D",
    "自訂 class",
    "鄰居搜尋"
   ],
   "tools": [
    "Symbolics Lisp Machine"
   ],
   "url": "https://en.wikipedia.org/wiki/Stanley_and_Stella_in:_Breaking_the_Ice"
  },
  {
   "id": "D01-02",
   "algo": "D01",
   "title": "《蝙蝠俠大顯神威》（Batman Returns）蝙蝠群與企鵝群",
   "creator": "Tim Burton 電影；VIFX（蝙蝠群）、Boss Film（企鵝）",
   "year": "1992",
   "category": "drawing",
   "categories_extra": [],
   "scale": "群體／都市",
   "summary": "第一部使用 Boids 模型的劇情長片，以修改過的 Symbolics Boids 程式產生電腦模擬的蝙蝠群，企鵝大軍則以基於 Reynolds 研究的工具製作。說明群聚規則可以從研究原型直接變成大規模視覺表現工具。",
   "variations": [
    {
     "name": "空間路徑引導群體",
     "how": "輸入一條 Curve，在 Steer 裡加一條力朝曲線上前方一點（ClosestPoint 參數往前加一段）轉向。",
     "effect": "整群沿指定路線飛行但保有局部的聚散，像被導演安排的群眾鏡頭"
    },
    {
     "name": "地面行走群體",
     "how": "把維度鎖在 XY、速度下限提高並減少對齊權重，模擬企鵝式的地面行進。",
     "effect": "得到地面上的密集行進隊伍軌跡"
    },
    {
     "name": "個體幾何擺放",
     "how": "輸出每隻鳥最後的 Plane（原點為位置、X 軸為速度），用 Orient 擺上蝙蝠或企鵝模型。",
     "effect": "群聚結果直接變成可渲染的場景"
    }
   ],
   "difficulty": 3,
   "tags": [
    "動畫",
    "3D",
    "吸引子控制"
   ],
   "tools": [
    "Boids（Symbolics 版修改）"
   ],
   "url": "https://en.wikipedia.org/wiki/Boids"
  },
  {
   "id": "D01-03",
   "algo": "D01",
   "title": "Swarm Urbanism",
   "creator": "Kokkugia（Roland Snooks、Robert Stuart-Smith）",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "群體／都市",
   "summary": "Kokkugia 以群體智能（swarm intelligence）為核心的都市設計研究，把都市元素視為依局部規則互動的代理人，以自下而上的方式生成都市紋理，取代傳統由上而下的總體規劃。",
   "variations": [
    {
     "name": "基地邊界內群聚",
     "how": "把正方體範圍換成基地邊界 Curve（2D），用 Contains 判斷出界並把速度反射回內部。",
     "effect": "軌跡限定在真實基地內，密度分布可作為街廓或動線的初稿"
    },
    {
     "name": "既有道路作吸引子",
     "how": "輸入既有街道 Curve，對最近道路加吸引力、對水岸或綠地加排斥力。",
     "effect": "群聚軌跡順著城市骨架延伸並避開保留區"
    },
    {
     "name": "軌跡轉量體",
     "how": "統計網格內軌跡通過次數，次數越高的格子 Extrude 越高。",
     "effect": "由群聚密度直接長出高低起伏的都市量體場"
    }
   ],
   "difficulty": 4,
   "tags": [
    "吸引子控制",
    "空間索引",
    "鄰居搜尋"
   ],
   "tools": [],
   "url": "https://www.kokkugia.com/swarm-urbanism"
  },
  {
   "id": "D01-04",
   "algo": "D01",
   "title": "Composite Swarm",
   "creator": "Kokkugia／Roland Snooks（與 James Pazzi、Marc Gibson）",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "構件",
   "summary": "以複合材料製作的原型，裝飾性構件的分布由模仿螞蟻以身體相連搭橋邏輯的多代理人演算法決定，屬於 Snooks 的 Behavioral Formation 設計流程，用來測試日後可放大到建築尺度的複合材料構造。",
   "variations": [
    {
     "name": "代理人互相連結搭橋",
     "how": "當兩隻鳥距離小於 linkRadius 且持續 k 步，就把兩者之間記一條 Line 並降低兩者速度（黏住）。",
     "effect": "代理人逐漸串成跨越空間的橋狀纖維束"
    },
    {
     "name": "只在兩支點間生成",
     "how": "輸入兩個錨點作吸引子，代理人從一端出發、被另一端吸引。",
     "effect": "形成跨距型的纖維構件，可評估跨越能力"
    },
    {
     "name": "纖維加厚輸出",
     "how": "依每段軌跡附近的鄰居數決定 Pipe 半徑，最後 BooleanUnion。",
     "effect": "得到可 3D 列印或翻模成複合材料的實體構件"
    }
   ],
   "difficulty": 4,
   "tags": [
    "鄰居搜尋",
    "3D",
    "物理模擬"
   ],
   "tools": [],
   "url": "https://www.kokkugia.com/Composite-Swarm"
  },
  {
   "id": "D01-05",
   "algo": "D01",
   "title": "AADRL Aerial Robot Thread Construction",
   "creator": "Robert Stuart-Smith（Kokkugia／AA DRL）",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "構件",
   "summary": "在 AA DRL 進行的研究，讓空中機器人依行為式生產（behavioural production）與 swarm-printing 邏輯拉線編織空間結構，機器人的路徑不是預先排好，而是由群體互動與回饋決定。",
   "variations": [
    {
     "name": "軌跡即拉線路徑",
     "how": "把 trails 重新取樣成等距點，並限制轉角角度，輸出為機器人可執行的航點清單。",
     "effect": "群聚軌跡直接變成可飛行、可拉線的施工路徑"
    },
    {
     "name": "防碰撞的最小間距",
     "how": "把 separationRadius 設成機體尺寸加安全距離，並把分離權重拉高到遠大於聚集。",
     "effect": "群體保持安全間距，軌跡互不相交過近"
    },
    {
     "name": "錨點間往返",
     "how": "設多個固定錨點輪流作為吸引子，鳥到達一個就換下一個目標。",
     "effect": "線在錨點間來回纏繞，形成張力網結構"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "吸引子控制",
    "動畫"
   ],
   "tools": [],
   "url": "https://www.kokkugia.com/AADRL-aerial-robot-thread-construction"
  },
  {
   "id": "D01-06",
   "algo": "D01",
   "title": "Aerial Additive Manufacturing（多台自主無人機空中 3D 列印）",
   "creator": "Zhang et al.；Mirko Kovac 領導，Robert Stuart-Smith 等共同研究（Imperial College London、Empa、UPenn 等）",
   "year": "2022",
   "category": "fabrication",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "發表於 Nature 的研究，模仿蜂群分工，由 BuilDrone 在飛行中擠出材料、ScanDrone 持續量測成果並決定下一步，多台無人機依同一份藍圖協作建造與修補結構，目標是高處或災後等難以到達的現場施工。",
   "variations": [
    {
     "name": "分工角色",
     "how": "在 Bird class 加 role 欄位（建造／掃描），兩種角色用不同權重與目標：建造者追列印路徑、掃描者追建造者。",
     "effect": "同一群體內出現分工的兩種軌跡"
    },
    {
     "name": "逐層沉積",
     "how": "給一條螺旋或逐層升高的目標路徑，建造者依序追蹤，走過的軌跡作為沉積材料的中心線。",
     "effect": "群聚模擬轉成逐層堆疊的列印路徑"
    },
    {
     "name": "回饋修正",
     "how": "每步比對已沉積軌跡與目標曲面的距離，偏差大的區域設為吸引子讓代理人回來補。",
     "effect": "形成會自動補洞的閉迴路建造模擬"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "吸引子控制",
    "多元件"
   ],
   "tools": [],
   "url": "https://www.nature.com/articles/s41586-022-04988-4"
  },
  {
   "id": "D01-07",
   "algo": "D01",
   "title": "Behavioural Production: Autonomous Swarm-Constructed Architecture",
   "creator": "Robert Stuart-Smith",
   "year": "2016",
   "category": "3d-architecture",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "建築",
   "summary": "刊於 AD（Architectural Design）的論文，探討以多代理人行為式運算做建築設計，並延伸到個體與群體機器人的積層製造，讓機器人以即時回饋參與設計，而不只是照預設指令施工。",
   "variations": [
    {
     "name": "邊飛邊建",
     "how": "每隻鳥走過的位置寫入 3D 網格作為已建成材料，之後的鳥把這些格子當障礙物並沿其表面爬行。",
     "effect": "結構在模擬中逐步長出，形態由群體與既有構造互動決定"
    },
    {
     "name": "性能寫入規則",
     "how": "加一個結構或日照的評估值場，讓代理人往應力高或需要遮陽處聚集。",
     "effect": "材料自動多放在需要的位置，形成性能導向的密度分布"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "物理模擬",
    "最佳化"
   ],
   "tools": [],
   "url": "https://onlinelibrary.wiley.com/doi/abs/10.1002/ad.2024"
  },
  {
   "id": "D01-08",
   "algo": "D01",
   "title": "Ghost Tectonics",
   "creator": "Roland Snooks／RMIT Architecture Tectonic Formation Lab",
   "year": "2025",
   "category": "3d-architecture",
   "categories_extra": [
    "fabrication",
    "performance"
   ],
   "scale": "建築",
   "summary": "實驗性展亭，形體由代理人群互動產生的湧現空間形態生成；再以大尺度 3D 列印的半透明外殼作為犧牲模板，搭配 Tailored Fibre Placement 將連續碳纖維依有限元素分析的應力流向配置。",
   "variations": [
    {
     "name": "群聚軌跡當殼體骨架",
     "how": "把 trails 用 Loft 或 MeshPipe 包覆，或以軌跡密度做 Marching Cubes（混 C05）轉成殼體。",
     "effect": "由群聚纖維長出連續的有機殼體形態"
    },
    {
     "name": "沿應力場對齊",
     "how": "把結構分析得到的主應力方向做成向量場，在 Steer 加一條對齊該場的力。",
     "effect": "軌跡順著受力方向排列，可直接作為纖維鋪設路徑"
    },
    {
     "name": "列印路徑化",
     "how": "把曲面上的軌跡依高度切層、重新排序並平滑，輸出為連續的列印／鋪纖維路徑。",
     "effect": "群聚結果可轉為機器人製造指令"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "曲面上",
    "物理模擬"
   ],
   "tools": [],
   "url": "https://parametric-architecture.com/ghost-tectonics-by-roland-snooks/"
  },
  {
   "id": "D01-09",
   "algo": "D01",
   "title": "Franchise Freedom",
   "creator": "Studio Drift（Lonneke Gordijn、Ralph Nauta）",
   "year": "2017",
   "category": "art-installation",
   "categories_extra": [
    "drawing"
   ],
   "scale": "地景",
   "summary": "數百台自主飛行的發光無人機模擬椋鳥群的群飛（murmuration），演算法源自團隊十多年對椋鳥飛行行為的研究；每台無人機的燈光強度與顏色依與其他無人機的距離變化，凸顯群體密度。2017 年於邁阿密海灘首演，之後在紐約中央公園以一千台演出。",
   "variations": [
    {
     "name": "依鄰居密度上色",
     "how": "在 Steer 裡順便回傳 cohesionNeighbors 數量，輸出時依數量對應顏色（Gradient）給每個點。",
     "effect": "群體密集處發亮、稀疏處轉暗，像空中的密度熱圖"
    },
    {
     "name": "天空範圍與高度限制",
     "how": "把盒子改成扁平長方體並設最低高度，Z 方向反彈改為較柔和的向上推力。",
     "effect": "群體在空中水平鋪開、起伏翻滾，接近真實群飛"
    },
    {
     "name": "即時動畫",
     "how": "改為 Timer 每步更新，只輸出當下位置的點與顏色。",
     "effect": "在 Rhino 中預覽燈光群體的動態演出"
    }
   ],
   "difficulty": 3,
   "tags": [
    "動畫",
    "3D",
    "鄰居搜尋"
   ],
   "tools": [
    "Intel Shooting Star 無人機"
   ],
   "url": "https://studiodrift.com/work/franchise-freedom/"
  },
  {
   "id": "D01-10",
   "algo": "D01",
   "title": "Gossamer Skins",
   "creator": "Alisa Andrasek",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "3d-architecture",
    "fabrication"
   ],
   "scale": "立面／表皮",
   "summary": "高層建築的機器人 3D 列印立面系統，以 stigmergy（代理人留痕跡、再依痕跡行動）在立面場中分配資料，其痕跡反映在幾何密度上，控制不同孔隙率以回應光、熱等性能需求，並以 octree 產生多解析度面板。",
   "variations": [
    {
     "name": "立面平面上的留痕群聚",
     "how": "把 Boids 鎖在立面 UV 平面，並加一張 2D 網格記錄走過次數（每步衰減），代理人會朝高濃度處轉。",
     "effect": "立面上形成自我強化的流線，濃度圖即可作為開孔密度圖"
    },
    {
     "name": "日照值作吸引／排斥",
     "how": "輸入立面各點的日照量，日照高處加排斥力讓代理人稀疏、背陽處吸引。",
     "effect": "痕跡密度對應遮陽需求，得到性能導向的立面紋理"
    },
    {
     "name": "密度轉多解析度面板",
     "how": "把濃度網格依門檻值遞迴細分（高濃度處切小格），每格依濃度決定開孔大小。",
     "effect": "得到遠看有機、近看像素化的多解析度立面"
    }
   ],
   "difficulty": 4,
   "tags": [
    "曲面上",
    "網格擴散",
    "最佳化"
   ],
   "tools": [
    "機器人 3D 列印"
   ],
   "url": "https://www.alisaandrasek.com/projects/gossamer-skins"
  },
  {
   "id": "D01-11",
   "algo": "D01",
   "title": "Culebra（Grasshopper 代理人外掛）",
   "creator": "Luis Quinones（complicitMatter）",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以 C# 撰寫、包裝 Culebra Java 函式庫的 Grasshopper 即時代理人外掛，提供 2D／3D 的 flocking 與 noise 行為、網格吸引與排斥，以及把軌跡或曲線網自我組織化的功能，是在 GH 裡做群聚軌跡建模最常見的工具之一。",
   "variations": [
    {
     "name": "群聚＋噪聲混合",
     "how": "在 Steer 加一條依 Perlin noise（C04）取樣方向的力，權重由 noiseWeight 控制。",
     "effect": "軌跡在群聚中帶有有機擾動，像 Culebra 的 hybrid 行為示範"
    },
    {
     "name": "Mesh 吸引與排斥",
     "how": "輸入一個 Mesh，用 ClosestPoint 找最近點，距離在範圍內時依正負權重吸引或排斥。",
     "effect": "軌跡貼附或包覆既有量體，產生纏繞型表面紋理"
    },
    {
     "name": "和外掛比對",
     "how": "用同樣的權重在 Culebra 與基礎範例的 C# 版各跑一次，比較參數意義與效能。",
     "effect": "理解外掛背後就是同樣的三條規則，能自行擴充"
    }
   ],
   "difficulty": 2,
   "tags": [
    "3D",
    "隨機",
    "吸引子控制"
   ],
   "tools": [
    "Grasshopper",
    "C#",
    "Java"
   ],
   "url": "https://github.com/elQuixote/Culebra"
  },
  {
   "id": "D01-12",
   "algo": "D01",
   "title": "Quelea：Grasshopper 代理人設計外掛",
   "creator": "Quelea 開發者（Grasshopper 社群外掛）",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "Grasshopper 的代理人建模與模擬元件庫，可建立 flocking 模擬，也用於模擬人與車輛等群體，並附有教學影片，是學習者從基礎範例 Boids 延伸到更多行為的入門工具。",
   "variations": [
    {
     "name": "發射器與生命週期",
     "how": "改成每步從一個出生點新增幾隻鳥、並在走完 lifespan 步後移除。",
     "effect": "形成持續流動的群體流，而不是固定數量"
    },
    {
     "name": "人車群體",
     "how": "關掉 Z 軸、降低速度並加入道路 Curve 引導力，行人與車輛用不同權重的兩群。",
     "effect": "得到街道上人車分流的軌跡圖"
    }
   ],
   "difficulty": 2,
   "tags": [
    "吸引子控制",
    "動畫"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://www.food4rhino.com/en/app/quelea-agent-based-design-grasshopper"
  },
  {
   "id": "D01-13",
   "algo": "D01",
   "title": "Brass Swarm",
   "creator": "Kokkugia／Roland Snooks",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "Kokkugia「agent bodies」研究系列中的黃銅作品，以群體代理人互動生成形體，再轉為金屬實體，示範群聚演算法如何在物件尺度成為裝飾與構造合一的形態。",
   "variations": [
    {
     "name": "小範圍高密度",
     "how": "boxSize 縮小、步數與鳥數增加、分離半徑壓小，讓軌跡在小空間內密集纏繞。",
     "effect": "得到像金屬鑄件般緻密的纖維團塊"
    },
    {
     "name": "軌跡轉實體鑄造模型",
     "how": "軌跡 Pipe 後用 Mesh Boolean 合併，並檢查最小厚度以符合鑄造或金屬列印。",
     "effect": "可輸出成可製造的小型金屬物件"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "自訂 class"
   ],
   "tools": [],
   "url": "https://www.kokkugia.com/brass-swarm"
  },
  {
   "id": "D01-14",
   "algo": "D01",
   "title": "RMIT Mace",
   "creator": "Kokkugia／Roland Snooks",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "同屬 Kokkugia「agent bodies」系列的物件作品，以代理人群互動生成的複雜形體包覆在一個物件軸線周圍，說明群聚演算法在小尺度物件上也能產生豐富細節。",
   "variations": [
    {
     "name": "沿軸線群聚",
     "how": "輸入一條中心軸 Curve，加吸引力讓鳥保持在距軸線某半徑內，並給一個沿軸線方向的推進力。",
     "effect": "軌跡沿著軸線螺旋纏繞，形成桿狀的纖維包覆"
    },
    {
     "name": "半徑隨高度變化",
     "how": "吸引半徑依鳥在軸線上的參數 t 用函數（如 sin）變化。",
     "effect": "包覆體出現膨脹與收束的節奏"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "吸引子控制"
   ],
   "tools": [],
   "url": "https://www.kokkugia.com/RMIT-Mace"
  },
  {
   "id": "D01-51",
   "algo": "D01",
   "title": "Coding Challenge #124：Flocking Simulation（群聚模擬）",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2018",
   "category": "drawing",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "以 p5.js 從零實作 Craig Reynolds 的 boids，依序加入對齊（alignment）、聚合（cohesion）、分離（separation）三條規則，並用滑桿即時調整三股力的權重。與 Grasshopper C# 範例相比，它是在瀏覽器裡逐格即時繪製的 2D 動畫，重點在觀察參數改變時群體行為的即時變化。",
   "variations": [
    {
     "name": "權重滑桿即時調參",
     "how": "把 alignment／cohesion／separation 三個權重改成 GH Number Slider，並在每次迭代讀取",
     "effect": "可以即時看到群體從鬆散游走切換成緊密團塊或分散漂流"
    },
    {
     "name": "邊界環繞（wrap-around）",
     "how": "個體超出畫布時從對邊重新進入，取代反彈或刪除",
     "effect": "群體可無限持續運動，不會在邊界堆積"
    },
    {
     "name": "軌跡累積成圖",
     "how": "不清除背景，把每一步的位置連成 Polyline 保留下來",
     "effect": "得到流線般的群聚軌跡圖，可作為平面圖紋或表皮紋理"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "Processing",
    "群聚",
    "boids",
    "動畫",
    "教學影片"
   ],
   "tools": [
    "p5.js",
    "Processing"
   ],
   "url": "https://thecodingtrain.com/challenges/124-flocking-simulation",
   "image": {
    "file": "img/cases/D01-51.jpg",
    "w": 900,
    "h": 501,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/124-flocking-simulation",
    "note": "Flocking Simulation 挑戰頁的預覽圖，漸層背景上的 boids 群聚點團"
   }
  },
  {
   "id": "D01-52",
   "algo": "D01",
   "title": "Flocking（Processing 官方範例）",
   "creator": "Daniel Shiffman",
   "year": "2007",
   "category": "drawing",
   "categories_extra": [],
   "scale": "物件",
   "summary": "Processing 官方範例（Topics › Simulate），以 PVector 與 ArrayList 實作 Reynolds 的 boids，每個個體依避碰、對齊、聚合三條規則自行轉向，點擊滑鼠可加入新個體。程式分成 Boid 與 Flock 兩個類別，是對照 GH C# 範例類別設計最精簡的版本。",
   "variations": [
    {
     "name": "互動加入個體",
     "how": "在 GH 中以點擊或新增點來即時增加 boid，而非固定初始數量",
     "effect": "觀察新個體如何被既有群體吸收"
    },
    {
     "name": "箭頭形狀顯示方向",
     "how": "用速度向量的方向角，把每個個體畫成三角形而非點",
     "effect": "能直接讀出群體的流向與轉向"
    }
   ],
   "difficulty": 1,
   "tags": [
    "creative coding",
    "Processing",
    "群聚",
    "boids",
    "官方範例",
    "入門"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://processing.org/examples/flocking.html",
   "image": {
    "file": "img/cases/D01-52.jpg",
    "w": 800,
    "h": 450,
    "source": "Processing.org",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://processing.org/examples/flocking.html",
    "note": "Processing Flocking 範例執行畫面，深色背景上的三角形 boids"
   }
  },
  {
   "id": "D01-53",
   "algo": "D01",
   "title": "three.js webgl gpgpu birds（GPU 鳥群）",
   "creator": "Joshua Koo（zz85）／three.js",
   "year": "2013",
   "category": "art-installation",
   "categories_extra": [
    "performance"
   ],
   "scale": "群體／都市",
   "summary": "three.js 官方範例，把每隻鳥的位置與速度存成浮點紋理，用 GLSL shader 在 GPU 上平行計算群聚規則，可在瀏覽器即時模擬大量 3D 鳥群，滑鼠則扮演讓鳥群閃避的「掠食者」。與 GH C# 範例的 CPU 迴圈不同，關鍵在「以紋理當資料結構、以 shader 當更新函式」的 GPGPU 思路。",
   "variations": [
    {
     "name": "掠食者迴避",
     "how": "加入一個跟著游標（或 GH 中的吸引點）移動的點，距離內的個體加上反向排斥力",
     "effect": "鳥群出現被撕開再癒合的動態破口"
    },
    {
     "name": "GPU 平行化",
     "how": "把個體狀態改存成紋理／陣列，用 shader 同時更新所有個體",
     "effect": "個體數可從數百提升到數萬，形成雲狀的大尺度群體"
    },
    {
     "name": "拍翅動畫",
     "how": "依速度大小驅動每個個體網格頂點的上下擺動",
     "effect": "讓抽象的點群變成可讀的鳥群影像"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "three.js",
    "GLSL",
    "WebGL",
    "GPGPU",
    "群聚",
    "3D"
   ],
   "tools": [
    "three.js",
    "GLSL"
   ],
   "url": "https://threejs.org/examples/webgl_gpgpu_birds.html",
   "image": {
    "file": "img/cases/D01-53.jpg",
    "w": 400,
    "h": 250,
    "source": "three.js examples",
    "author": "Joshua Koo（zz85）／three.js",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://threejs.org/examples/webgl_gpgpu_birds.html",
    "note": "three.js 官方範例截圖，白色背景上的 GPU 鳥群"
   }
  },
  {
   "id": "D01-54",
   "algo": "D01",
   "title": "TouchDesigner Boids Flocking Tutorial",
   "creator": "David Braun",
   "year": "2021",
   "category": "performance",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "群體／都市",
   "summary": "在 TouchDesigner 中以 GLSL compute shader 實作 boids，並用「分箱」（binning）把空間切成格子、只搜尋鄰近格內的個體，大幅降低鄰居搜尋成本。專案檔公開於作者的 TouchDesigner_Shared GitHub 儲存庫，適合用於即時視覺演出。",
   "variations": [
    {
     "name": "空間分箱加速鄰居搜尋",
     "how": "把 GH 範例中兩兩比較全部個體的做法，改成先依格子索引分組、只比較同格與相鄰格",
     "effect": "個體數增加時仍能維持即時互動"
    },
    {
     "name": "接上音訊或感測器",
     "how": "把群聚權重或速度上限綁到外部輸入（音量、感測器數值）",
     "effect": "群體行為隨聲音或觀眾動作即時改變，可用於演出與裝置"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "TouchDesigner",
    "GLSL",
    "compute shader",
    "群聚",
    "即時視覺"
   ],
   "tools": [
    "TouchDesigner",
    "GLSL"
   ],
   "url": "https://www.youtube.com/watch?v=f2yOYmOgZEA",
   "image": {
    "file": "img/cases/D01-54.jpg",
    "w": 480,
    "h": 360,
    "source": "YouTube",
    "author": "David Braun",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.youtube.com/watch?v=f2yOYmOgZEA",
    "note": "TouchDesigner Boids Flocking Tutorial 影片縮圖"
   }
  },
  {
   "id": "D01-55",
   "algo": "D01",
   "title": "3D Flocking with POPs",
   "creator": "Dean Cheesman（dcheesman）",
   "year": "2025",
   "category": "performance",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "群體／都市",
   "summary": "利用 TouchDesigner 新推出的 POPs 運算子建構 3D boids，作者表示過去在 TouchDesigner 做群聚並不直觀，POPs 讓它容易許多。與 GH C# 範例的程式碼寫法相比，這是以節點圖表達同一套規則的做法，接近 Grasshopper 本身的視覺化程式思維。",
   "variations": [
    {
     "name": "從 2D 延伸到 3D",
     "how": "把位置與速度向量從 XY 平面改成完整的 3D 向量，邊界改用立方體或球體",
     "effect": "得到立體的魚群、鳥群團塊，可作為空間裝置的動態量體"
    },
    {
     "name": "節點化規則",
     "how": "把三條規則拆成獨立元件（或 GH Cluster），各自輸出力向量再加總",
     "effect": "更容易替換、關閉或新增規則進行實驗"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "TouchDesigner",
    "POPs",
    "群聚",
    "3D",
    "節點式程式"
   ],
   "tools": [
    "TouchDesigner"
   ],
   "url": "https://derivative.ca/community-post/tutorial/3d-flocking-pops/73049",
   "image": {
    "file": "img/cases/D01-55.jpg",
    "w": 900,
    "h": 473,
    "source": "Derivative（TouchDesigner 社群）",
    "author": "Dean Cheesman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://derivative.ca/community-post/tutorial/3d-flocking-pops/73049",
    "note": "3D Flocking with POPs 教學封面，含 TouchDesigner 群聚畫面"
   }
  },
  {
   "id": "D02-01",
   "algo": "D02",
   "title": "黏菌重現東京鐵路網",
   "creator": "Atsushi Tero, Toshiyuki Nakagaki 等",
   "year": "2010",
   "category": "performance",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "研究者把燕麥片放在培養皿上對應東京周邊城市的位置，黏菌長出的管網在效率、容錯與成本上可與真實鐵路網相比，並據此提出一套自適應網絡的數學規則。這是「黏菌會做網絡最佳化」最常被引用的案例。",
   "variations": [
    {
     "name": "食物點＝車站",
     "how": "在範例中加入 foodPoints 輸入，於食物點所在格子每步持續加上高濃度痕跡。",
     "effect": "網絡收斂成連接各站的路網，而不是均勻的葉脈紋。"
    },
    {
     "name": "地形障礙",
     "how": "以海岸線與山地當作 blocked 遮罩，代理人不可進入、擴散時歸零。",
     "effect": "路網會像實驗中的光照限制區一樣繞過不利地形。"
    },
    {
     "name": "網絡評估",
     "how": "把最終痕跡場用門檻值骨架化成圖（點＋連線），計算總長度與任兩站最短路徑。",
     "effect": "可以量化比較黏菌網絡、最小生成樹與真實路網的效率與冗餘。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "最佳化",
    "吸引子控制",
    "網格擴散"
   ],
   "tools": [
    "生物實驗",
    "數學模型"
   ],
   "url": "https://www.science.org/doi/10.1126/science.1177894"
  },
  {
   "id": "D02-02",
   "algo": "D02",
   "title": "Physarum 多代理人模型的圖樣地圖",
   "creator": "Jeff Jones",
   "year": "2010",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "基礎範例的原型論文：以只會感測、轉向、前進、沉積的粒子群近似黏菌管網，並系統性掃描感測角度與轉向角度，整理出網狀、斑點、迷宮紋等圖樣對照圖。",
   "variations": [
    {
     "name": "參數掃描圖表",
     "how": "在 GH 中用兩個 Series 分別改 sensorAngle 與 turnAngle，把每組結果排成矩陣並排顯示。",
     "effect": "重現論文中的圖樣地圖，學習者可以直接挑選喜歡的紋理參數。"
    },
    {
     "name": "改用機率轉向",
     "how": "把 SmellAndTurn 的 if 判斷改成依三個感測值的比例抽籤決定方向。",
     "effect": "線條變得柔和、較少銳角，網絡更像生物組織。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "網格擴散",
    "隨機",
    "開放生長"
   ],
   "tools": [
    "Processing",
    "Java"
   ],
   "url": "https://cognet.mit.edu/journal/10.1162/artl.2010.16.2.16202"
  },
  {
   "id": "D02-03",
   "algo": "D02",
   "title": "physarum／36 Points 生成藝術",
   "creator": "Sage Jenson (mxsage)",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Sage Jenson 以 Jeff Jones 的模型為基礎，在 GPU 上跑數百萬粒子並混合多物種與參數切換，產生極具辨識度的發光網紋作品，後來衍生出 36 Points 等廣為流傳的生成藝術系列。",
   "variations": [
    {
     "name": "多物種顏色",
     "how": "建立 trailA、trailB 兩張痕跡場，Agent 加 species 欄位，感測時以自己的痕跡減掉對方的痕跡。",
     "effect": "兩種顏色的網絡互相推擠、各自成區。"
    },
    {
     "name": "參數點切換",
     "how": "預先存 3–5 組參數，依代理人所在位置或時間在不同參數組間內插。",
     "effect": "同一畫面中出現多種紋理並平滑過渡，類似 36 Points 的效果。"
    },
    {
     "name": "發光渲染",
     "how": "把 trailValues 取對數或開根號後上色，並在 Rhino 以 Display 模式或輸出點雲至渲染器。",
     "effect": "細微的弱痕跡也會顯現，畫面有發光纖維感。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "動畫",
    "隨機",
    "網格擴散"
   ],
   "tools": [
    "GPU shader"
   ],
   "url": "https://cargocollective.com/sagejenson/physarum"
  },
  {
   "id": "D02-04",
   "algo": "D02",
   "title": "3D Physarum 青銅燭台",
   "creator": "Sage Jenson × Nervous System",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "Jenson 在 Nervous System 駐村期間，用受引導的 3D 粒子—網格混合黏菌模擬長出網狀柱體，以 Formlabs 列印可燃蠟樹脂、做石膏模，再澆鑄成青銅燭台。展示了黏菌網絡從螢幕走向實體製造的完整流程。",
   "variations": [
    {
     "name": "3D 痕跡場",
     "how": "trail 改成 double[,,]，代理人加上 Z 與俯仰角，擴散改 3×3×3。",
     "effect": "得到立體海綿狀網絡。"
    },
    {
     "name": "形體引導",
     "how": "在柱狀範圍外設 blocked，並在上下兩端放食物點。",
     "effect": "網絡被約束成連接上下的柱體，適合作燭台、椅腳等構件。"
    },
    {
     "name": "轉成可列印網格",
     "how": "將痕跡場以 Marching Cubes（C05 延伸到 3D）取等值面，再平滑並檢查封閉性。",
     "effect": "得到可直接 3D 列印或脫蠟鑄造的網格。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "等值面",
    "網格擴散"
   ],
   "tools": [
    "GPU 模擬",
    "Formlabs",
    "脫蠟鑄造"
   ],
   "url": "https://n-e-r-v-o-u-s.com/blog/?p=9137"
  },
  {
   "id": "D02-06",
   "algo": "D02",
   "title": "bioTallinn 與 Paljassaare 半島黏菌規劃",
   "creator": "ecoLogicStudio／Claudia Pasquero（策展）",
   "year": "2017",
   "category": "urban-landscape",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "地景",
   "summary": "2017 塔林建築雙年展以 bioTallinn 為題，ecoLogicStudio 的 Paljassaare 半島提案讓黏菌在代表基地資訊的地景上生長，把城市汙水基礎設施與生物基質納入總體規劃的形態生成。",
   "variations": [
    {
     "name": "資訊地景作為食物分布",
     "how": "把基地的汙染、水系、植被等圖層各給權重，合成為一張食物濃度網格，每步注入痕跡場。",
     "effect": "網絡反映多圖層條件的疊合，成為規劃的基礎骨架。"
    },
    {
     "name": "分階段生長",
     "how": "分成數個階段，每階段結束時把高濃度路徑固定為永久食物，再加入新食物點。",
     "effect": "模擬分期開發，網絡隨時間逐步擴張。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "影像輸入",
    "開放生長"
   ],
   "tools": [
    "生物實驗",
    "衛星資料"
   ],
   "url": "https://www.ecologicstudio.com/projects/biotallinn-2"
  },
  {
   "id": "D02-07",
   "algo": "D02",
   "title": "如果黏菌蓋高速公路：英國路網",
   "creator": "Andrew Adamatzky, Jeff Jones",
   "year": "2010",
   "category": "urban-landscape",
   "categories_extra": [
    "performance"
   ],
   "scale": "群體／都市",
   "summary": "把英國十大都會區當作食物點，比較黏菌網絡與真實高速公路網；結果大致吻合，但黏菌會改以 Newcastle 直通 Glasgow。之後同一方法擴及荷蘭、比利時、加拿大、德國與羅馬古道等研究。",
   "variations": [
    {
     "name": "食物量依人口加權",
     "how": "每個城市點每步注入的痕跡量乘上人口比例。",
     "effect": "大城市之間的連線更粗，小城市可能被省略。"
    },
    {
     "name": "多次隨機種子統計",
     "how": "以不同 seed 跑 20 次，把各次骨架化後的連線出現頻率統計成權重。",
     "effect": "得到「穩健路徑」與「偶發路徑」的機率地圖。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "可重現種子",
    "吸引子控制",
    "最佳化"
   ],
   "tools": [
    "生物實驗",
    "多代理人模型"
   ],
   "url": "https://arxiv.org/abs/0912.3967"
  },
  {
   "id": "D02-08",
   "algo": "D02",
   "title": "Monte Carlo Physarum Machine 描繪宇宙網",
   "creator": "Joseph N. Burchett, Oskar Elek 等（UC Santa Cruz）",
   "year": "2020",
   "category": "drawing",
   "categories_extra": [
    "performance"
   ],
   "scale": "地景",
   "summary": "天文學家把 37,000 多個星系當作食物點，用 3D 黏菌演算法（MCPM）重建連接星系的暗物質纖維網，並以哈伯太空望遠鏡的觀測資料驗證。說明同一套規則能在完全不同尺度上重建網絡結構。",
   "variations": [
    {
     "name": "點雲作為食物",
     "how": "輸入大量 Point3d（例如樹木、建物、人口點），在 3D 體素網格中注入痕跡。",
     "effect": "從離散點資料推測出潛在連結網絡。"
    },
    {
     "name": "機率式感測",
     "how": "感測方向改為在錐形範圍內隨機取樣多個方向，依濃度機率選擇。",
     "effect": "網絡更平滑、對參數不那麼敏感，適合資料視覺化。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "隨機",
    "空間索引"
   ],
   "tools": [
    "GPU",
    "Python"
   ],
   "url": "https://news.ucsc.edu/2020/03/cosmic-web/"
  },
  {
   "id": "D02-09",
   "algo": "D02",
   "title": "3D Physarum 產生 3D 列印內部支撐",
   "creator": "ACM 論文研究團隊（arXiv 2212.11527）",
   "year": "2022",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "以 Monte Carlo 版的 3D 黏菌演算法，替 3D 列印物件產生近似拓撲最佳的內部支撐網絡，並以抗衝擊自行車安全帽為案例。把黏菌網絡從紋理提升為結構與材料設計。",
   "variations": [
    {
     "name": "封閉體積內生長",
     "how": "以 Mesh.IsPointInside 產生體素遮罩，只在物件內部允許生長與擴散。",
     "effect": "網絡填滿物件內部，形成有機格柵。"
    },
    {
     "name": "受力點當食物",
     "how": "把支撐點與載重點設為高濃度食物點。",
     "effect": "主要傳力路徑變粗，接近拓撲最佳化的材料分布。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "最佳化",
    "等值面"
   ],
   "tools": [
    "3D 列印"
   ],
   "url": "https://arxiv.org/pdf/2212.11527"
  },
  {
   "id": "D02-10",
   "algo": "D02",
   "title": "PolyPhy：開源 3D 列印仿生物件生成器",
   "creator": "PolyPhy 專案團隊",
   "year": "2023",
   "category": "modeling",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "發表於 ACM 計算製造研討會的開源工具，把三角網格轉成以黏菌行為生成的網狀、可 3D 列印物件，讓設計者不用自己寫 GPU 模擬也能使用黏菌網絡建模。",
   "variations": [
    {
     "name": "網格頂點當食物",
     "how": "把輸入 Mesh 的頂點（或抽樣點）注入痕跡場作為食物。",
     "effect": "網絡依附在物件輪廓上，形成鏤空外殼。"
    },
    {
     "name": "厚度對應濃度",
     "how": "輸出時依痕跡值決定管徑或等值面門檻。",
     "effect": "網絡粗細有層次，可控制重量與強度。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "等值面"
   ],
   "tools": [
    "Python",
    "3D 列印"
   ],
   "url": "https://dl.acm.org/doi/10.1145/3623263.3629159"
  },
  {
   "id": "D02-11",
   "algo": "D02",
   "title": "Physarealm：Grasshopper 黏菌外掛",
   "creator": "maajor",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "以 Jeff Jones 的 Processing 程式為基礎，擴展到 3D 並寫成 Rhino／Grasshopper 外掛，可在自訂邊界與食物源中跑黏菌代理人，常與 Anemone、Kangaroo 搭配做建築形體研究。",
   "variations": [
    {
     "name": "Brep 邊界",
     "how": "以 Brep.IsPointInside 判斷代理人是否可前進，取代範例的環繞邊界。",
     "effect": "網絡被限制在建築量體內，產生室內結構或裝置骨架。"
    },
    {
     "name": "搭配 Kangaroo 鬆弛",
     "how": "把網絡骨架化後的線段交給 Kangaroo 做長度與平滑目標。",
     "effect": "得到更平順、可建造的桿件網格。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "多元件"
   ],
   "tools": [
    "Grasshopper",
    "C#",
    "Anemone",
    "Kangaroo"
   ],
   "url": "https://www.food4rhino.com/en/app/physarealm"
  },
  {
   "id": "D02-12",
   "algo": "D02",
   "title": "Skeleton Physarum：以骨架化誤差驅動的黏菌",
   "creator": "YufanX",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "構件",
   "summary": "開源 Grasshopper 外掛「Slime」的 C# 原始碼，提出以 Voronoi 為基礎的骨架化方法產生黏菌圖樣，示範如何把網格痕跡轉換成乾淨的線性網絡。",
   "variations": [
    {
     "name": "痕跡場骨架化",
     "how": "把 trailValues 以門檻二值化，再用 Voronoi 中軸或細線化演算法取骨架線。",
     "effect": "得到可直接用於建模的中心線網絡。"
    },
    {
     "name": "骨架回饋",
     "how": "把骨架線上的格子作為下一輪的食物點再跑一次模擬。",
     "effect": "網絡逐輪精簡，保留最主要的幹道。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "自訂 class",
    "幾何轉換"
   ],
   "tools": [
    "Grasshopper",
    "C#"
   ],
   "url": "https://github.com/YufanX/SkeletonPhysarum"
  },
  {
   "id": "D02-13",
   "algo": "D02",
   "title": "黏菌分步生長作為都市設計樣板",
   "creator": "Scientific Reports 論文研究團隊",
   "year": "2022",
   "category": "urban-landscape",
   "categories_extra": [
    "performance"
   ],
   "scale": "群體／都市",
   "summary": "研究以分步方式讓黏菌在城市節點間生長，觀察網絡在不同階段的形態，探討其作為都市設計與路網規劃樣板的可能性。",
   "variations": [
    {
     "name": "分步加入節點",
     "how": "把 foodPoints 依時間分批啟用（例如每 100 步加入一批）。",
     "effect": "看到網絡如何隨新節點出現而重組或保留既有路徑。"
    },
    {
     "name": "既有路網記憶",
     "how": "每階段結束把痕跡場存下，下一階段以其 50% 作為初始值。",
     "effect": "新網絡會傾向沿用舊路徑，模擬都市的路徑依賴。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "開放生長",
    "吸引子控制"
   ],
   "tools": [
    "生物實驗"
   ],
   "url": "https://www.nature.com/articles/s41598-022-05439-w"
  },
  {
   "id": "D02-14",
   "algo": "D02",
   "title": "受黏菌生長啟發的非均質建築材料",
   "creator": "PubMed 收錄論文研究團隊",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "研究以黏菌依養分分布生長的原理設計空間非均質的蜂巢／多孔材料，並量測其力學反應，示範黏菌網絡如何轉化為可調性能的結構材料。",
   "variations": [
    {
     "name": "養分場＝應力場",
     "how": "把 FEM 或 Karamba 算出的應力值柵格化成食物濃度網格。",
     "effect": "高應力區網絡更密，形成依受力分級的格柵。"
    },
    {
     "name": "密度量測回饋",
     "how": "計算每區痕跡平均值作為孔隙率，並與目標孔隙率比較後調整 decay。",
     "effect": "可針對指定密度分布反向調整參數。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "最佳化",
    "網格擴散"
   ],
   "tools": [
    "數值模擬",
    "3D 列印"
   ],
   "url": "https://pubmed.ncbi.nlm.nih.gov/31412323/"
  },
  {
   "id": "D02-15",
   "algo": "D02",
   "title": "互動式黏菌裝置（遊戲手把操控）",
   "creator": "Bleuje",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "以 openFrameworks 實作、受 36 Points 啟發的黏菌模擬，讓觀眾用遊戲手把即時改變參數，作為藝術裝置展出，展現參數空間的豐富度。",
   "variations": [
    {
     "name": "即時參數滑桿",
     "how": "把模擬狀態存在 class 欄位並用 Timer 連續執行，以 GH 滑桿即時改 sensorAngle、turnAngle。",
     "effect": "可在現場即時探索圖樣，適合作評圖展示。"
    },
    {
     "name": "觀眾位置當吸引子",
     "how": "以滑鼠或感測器位置作為食物點，每步注入痕跡。",
     "effect": "網絡會追著觀眾移動，形成互動裝置。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "動畫",
    "Timer",
    "吸引子控制"
   ],
   "tools": [
    "openFrameworks"
   ],
   "url": "https://github.com/Bleuje/interactive-physarum"
  },
  {
   "id": "D02-51",
   "algo": "D02",
   "title": "physarum",
   "creator": "Sage Jenson",
   "year": "2019",
   "category": "2d-pattern",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "地景",
   "summary": "依據 Jeff Jones（2010）的 Physarum 傳輸網路模型，以 openFrameworks 的 C++ 與 GLSL 在 GPU 上即時模擬大量粒子：每個粒子有前、左前、右前三個感測器，朝軌跡濃度最高處轉向並沉積軌跡，軌跡圖每步做 3×3 平均擴散與乘法衰減。作者的圖解文章讓這個模型在 creative coding 社群廣為流傳，並示範感測角度、距離等參數對網路形態的巨大影響。",
   "variations": [
    {
     "name": "感測角／轉向角掃描",
     "how": "系統性地改變 sensor angle、sensor distance、rotation angle 三個參數並並排輸出",
     "effect": "從細密網格、粗大管路到點狀聚集，得到一整張形態圖譜"
    },
    {
     "name": "多物種競爭",
     "how": "加入多組粒子，各自只追蹤自己的軌跡並迴避他者軌跡",
     "effect": "不同顏色的網路互相排擠，形成領域邊界"
    },
    {
     "name": "GPU 化",
     "how": "把粒子與軌跡圖改成紋理，以 shader 平行更新",
     "effect": "粒子數大幅增加，網路細節更連續"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "openFrameworks",
    "GLSL",
    "黏菌",
    "physarum",
    "GPU"
   ],
   "tools": [
    "openFrameworks",
    "GLSL"
   ],
   "url": "https://sagejenson.com/physarum",
   "image": {
    "file": "img/cases/D02-51.jpg",
    "w": 400,
    "h": 268,
    "source": "Sage Jenson（Cargo 網站）",
    "author": "Sage Jenson",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://sagejenson.com/physarum",
    "note": "physarum 文章首圖，黑白格狀黏菌網路"
   }
  },
  {
   "id": "D02-52",
   "algo": "D02",
   "title": "Coding Adventure: Ant and Slime Simulations",
   "creator": "Sebastian Lague",
   "year": "2021",
   "category": "2d-pattern",
   "categories_extra": [
    "performance"
   ],
   "scale": "地景",
   "summary": "以 Unity compute shader 實作 Jeff Jones 的黏菌模型（並與螞蟻費洛蒙模擬對照），影片逐步示範感測、轉向、沉積、擴散衰減的每個步驟，專案原始碼以 GPL-3.0 公開於 GitHub。多物種設定與色彩映射讓結果更具視覺張力。",
   "variations": [
    {
     "name": "多物種色彩",
     "how": "為每個物種指定獨立的軌跡通道與顏色，感測時吸引同類、排斥異類",
     "effect": "產生彼此交織或互相劃界的彩色網路"
    },
    {
     "name": "初始分布改變",
     "how": "粒子從圓心向外、圓周向內或隨機分布出發",
     "effect": "得到放射狀、環狀或均勻的不同網路起始形態"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "Unity",
    "compute shader",
    "HLSL",
    "黏菌",
    "physarum"
   ],
   "tools": [
    "Unity",
    "HLSL"
   ],
   "url": "https://github.com/SebLague/Slime-Simulation",
   "image": {
    "file": "img/cases/D02-52.jpg",
    "w": 480,
    "h": 360,
    "source": "YouTube",
    "author": "Sebastian Lague",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.youtube.com/watch?v=X-iSQQgOd1A",
    "note": "Coding Adventure: Ant and Slime Simulations 影片縮圖，青綠色放射狀黏菌圖樣"
   }
  },
  {
   "id": "D02-53",
   "algo": "D02",
   "title": "p5.js Coding Tutorial | Slime Molds (Physarum)",
   "creator": "Patt Vira",
   "year": "2024",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以 p5.js 在 CPU 上實作 Jeff Jones 的黏菌演算法，並附教學影片逐步講解；草圖也收錄於 p5.js 官方網站的社群作品區。粒子數較少但程式精簡，最適合作為 GH C# 範例的對照入門版本。",
   "variations": [
    {
     "name": "用二維陣列當軌跡圖",
     "how": "在 GH 中以二維 double 陣列或 Mesh 頂點顏色作為軌跡圖，每步做 3×3 平均與乘法衰減",
     "effect": "不需 GPU 也能看到網路逐步收斂"
    },
    {
     "name": "降低粒子數以看清個體",
     "how": "只放數百個粒子並畫出其感測點",
     "effect": "適合教學時說明「感測—轉向—前進—沉積」的迴圈"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "黏菌",
    "physarum",
    "教學影片",
    "入門"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://www.youtube.com/watch?v=VyXxSNcgDtg",
   "image": {
    "file": "img/cases/D02-53.jpg",
    "w": 480,
    "h": 360,
    "source": "YouTube",
    "author": "Patt Vira",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.youtube.com/watch?v=VyXxSNcgDtg",
    "note": "p5.js Slime Molds 教學影片縮圖，含黑白黏菌網路"
   }
  },
  {
   "id": "D02-54",
   "algo": "D02",
   "title": "interactive-physarum／Algorithms for making interesting organic simulations",
   "creator": "Etienne Jacob（bleuje）",
   "year": "2024",
   "category": "art-installation",
   "categories_extra": [
    "performance"
   ],
   "scale": "地景",
   "summary": "作者以 openFrameworks 與 compute shader 延伸 Physarum 模型，受 Sage Jenson《36 Points》啟發，並以遊戲手把即時操控，作為藝術裝置使用。搭配的長文（bleuje.com）逐步圖解原始演算法與各種變形。",
   "variations": [
    {
     "name": "參數隨濃度變化",
     "how": "讓 sensor distance、移動步長等不再是常數，而是所在位置軌跡濃度的函數",
     "effect": "出現更有機、多尺度的紋理，而非單一尺度的網路"
    },
    {
     "name": "參數組合切換",
     "how": "預存多組參數，執行中平滑內插切換",
     "effect": "圖樣在不同形態間流動變化，適合現場互動"
    }
   ],
   "difficulty": 5,
   "tags": [
    "creative coding",
    "openFrameworks",
    "GLSL",
    "compute shader",
    "黏菌",
    "互動裝置"
   ],
   "tools": [
    "openFrameworks",
    "GLSL"
   ],
   "url": "https://github.com/Bleuje/interactive-physarum",
   "image": {
    "file": "img/cases/D02-54.jpg",
    "w": 900,
    "h": 518,
    "source": "bleuje.com",
    "author": "Etienne Jacob",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://bleuje.com/physarum-explanation",
    "note": "文章縮圖，左為單一代理感測示意，右為橘色有機網路模擬"
   }
  },
  {
   "id": "D02-55",
   "algo": "D02",
   "title": "Artist in Residency: Sage Jenson — 3D Physarum 形體",
   "creator": "Sage Jenson（Nervous System 駐村）",
   "year": "2022",
   "category": "fabrication",
   "categories_extra": [
    "3d-architecture",
    "modeling"
   ],
   "scale": "構件",
   "summary": "Sage Jenson 在 Nervous System 駐村期間，把先前的 Houdini 草稿改寫成引導式的 3D 粒子—網格混合模擬（3D Physarum），產生網狀柱體（candlestick）等形體並以青銅鑄造實體化。這是把黏菌演算法從 2D 圖像推向 3D 可製造量體的案例，與建築構件尺度最接近。",
   "variations": [
    {
     "name": "2D 軌跡圖改為 3D 體素",
     "how": "軌跡圖改成三維格點，粒子以 3D 方向感測與轉向",
     "effect": "得到立體的管狀網路量體"
    },
    {
     "name": "引導場",
     "how": "加入目標形狀或邊界作為額外吸引／限制",
     "effect": "網路長成指定的柱體或容器外形，便於後續製造"
    },
    {
     "name": "體素轉網格製造",
     "how": "以 marching cubes 等方法把軌跡濃度場轉成封閉網格",
     "effect": "可直接 3D 列印或翻模鑄造"
    }
   ],
   "difficulty": 5,
   "tags": [
    "creative coding",
    "Houdini",
    "黏菌",
    "physarum",
    "3D",
    "數位製造"
   ],
   "tools": [
    "Houdini"
   ],
   "url": "https://n-e-r-v-o-u-s.com/blog?p=9137",
   "image": {
    "file": "img/cases/D02-55.jpg",
    "w": 675,
    "h": 900,
    "source": "Nervous System blog",
    "author": "Sage Jenson",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://n-e-r-v-o-u-s.com/blog?p=9137",
    "note": "駐村文章首圖，置於草地上的 3D physarum 網狀形體實體"
   }
  },
  {
   "id": "D03-01",
   "algo": "D03",
   "title": "社會力模型（Social Force Model）",
   "creator": "Dirk Helbing, Péter Molnár",
   "year": "1995",
   "category": "performance",
   "categories_extra": [
    "modeling"
   ],
   "scale": "群體／都市",
   "summary": "基礎範例的理論來源：把行人看成受「想去目的地的驅動力」與「他人、牆面排斥力」作用的粒子。模型能自然重現對向人流自動分成車道、門口雙向交替通行等現象。",
   "variations": [
    {
     "name": "雙向對流",
     "how": "設兩組出發點與互換的目的地，其餘規則不變。",
     "effect": "觀察車道自組織的形成。"
    },
    {
     "name": "視野角度",
     "how": "在 PeopleForce 中對身後的人（與速度方向內積為負）降低推力權重。",
     "effect": "行為更接近真人：只閃避前方的人。"
    },
    {
     "name": "牆面排斥",
     "how": "新增 walls 曲線輸入，用 ClosestPoint 計算與牆的距離並加上指數衰減的推力。",
     "effect": "可以在平面圖上直接模擬走廊與門口。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "物理模擬",
    "鄰居搜尋"
   ],
   "tools": [
    "數學模型"
   ],
   "url": ""
  },
  {
   "id": "D03-02",
   "algo": "D03",
   "title": "逃生恐慌模擬與「越急越慢」",
   "creator": "Dirk Helbing, Illés Farkas, Tamás Vicsek",
   "year": "2000",
   "category": "performance",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "在社會力模型中加入身體擠壓與摩擦，模擬緊急疏散時出口前的拱形堵塞；結果顯示人越急反而越慢，並提出在出口前方適當位置放柱子可以減少堵塞。",
   "variations": [
    {
     "name": "出口前放柱子",
     "how": "在 obstacleCenters 加一個位於出口前方的點，掃描柱子距離與人數，記錄全部抵達所需步數。",
     "effect": "找到能縮短疏散時間的柱位。"
    },
    {
     "name": "越急越慢實驗",
     "how": "以 Series 改變 walkSpeed，並把 MaxSpeedRatio 提高；記錄疏散時間。",
     "effect": "繪出速度與疏散時間的曲線，觀察超過某值後反而變慢。"
    },
    {
     "name": "身體擠壓力",
     "how": "當兩人 gap < 0 時額外加上與重疊量成正比的彈力及切向摩擦力。",
     "effect": "出口前出現拱形堵塞與間歇性湧出。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "物理模擬",
    "最佳化"
   ],
   "tools": [
    "數學模型"
   ],
   "url": ""
  },
  {
   "id": "D03-03",
   "algo": "D03",
   "title": "草地上的捷徑：人類步道系統的演化",
   "creator": "Dirk Helbing, Joachim Keltsch, Péter Molnár",
   "year": "1997",
   "category": "urban-landscape",
   "categories_extra": [
    "drawing"
   ],
   "scale": "地景",
   "summary": "以「主動行走者」模型解釋公園草地上被踩出的捷徑：行人偏好走已被踩過的路，路徑又會因少人走而恢復。模型與黏菌的「留痕跡—跟隨痕跡」機制非常相似，可用來預測慾望路徑。",
   "variations": [
    {
     "name": "踩踏痕跡場",
     "how": "加入 double[,] 痕跡網格，每人每步在所在格加值並全場衰減；目標力方向加上痕跡梯度的偏好。",
     "effect": "多次模擬後自然出現被大家共用的捷徑網絡。"
    },
    {
     "name": "多組起訖點",
     "how": "每個人隨機從入口清單中選起點與終點，而不是單一目的地。",
     "effect": "得到像校園草地上三角形折衷路徑的步道系統。"
    },
    {
     "name": "轉成鋪面設計",
     "how": "痕跡場以門檻取等值線（C05）成為步道輪廓並 Offset 出鋪面邊界。",
     "effect": "直接從使用行為推導出步道配置。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "網格擴散",
    "開放生長"
   ],
   "tools": [
    "數學模型"
   ],
   "url": ""
  },
  {
   "id": "D03-04",
   "algo": "D03",
   "title": "自然移動理論與軸線圖（Space Syntax）",
   "creator": "Bill Hillier, Alan Penn 等",
   "year": "1993",
   "category": "drawing",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "Space syntax 認為街道網絡的空間構成（整合度）本身就能解釋大部分的步行人流，並以軸線圖和可見度圖呈現。它不模擬個人，而是用圖論分析空間，常與代理人模擬互補。",
   "variations": [
    {
     "name": "整合度當作吸引場",
     "how": "先在網格上算每點的可見範圍或整合度，作為額外的吸引力方向加入目標力。",
     "effect": "人流集中在整合度高的主軸上，更接近 space syntax 的預測。"
    },
    {
     "name": "模擬結果對照",
     "how": "把人流熱圖與整合度圖並排或計算相關係數。",
     "effect": "檢驗「空間構成決定人流」在自己的基地是否成立。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "鄰居搜尋"
   ],
   "tools": [
    "DepthmapX"
   ],
   "url": ""
  },
  {
   "id": "D03-05",
   "algo": "D03",
   "title": "Trafalgar Square 步行化改造中的人流分析",
   "creator": "Space Syntax Ltd × Foster + Partners",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "drawing"
   ],
   "scale": "群體／都市",
   "summary": "倫敦 World Squares for All 計畫中，Space Syntax 以人流觀測與空間分析支持把廣場北側道路步行化並新增大階梯，是以人流分析直接影響公共空間設計的代表案例。",
   "variations": [
    {
     "name": "多入口多目的地",
     "how": "出發點與目的地都改為清單，每人隨機配對起訖點。",
     "effect": "得到廣場內的交叉穿越人流分布。"
    },
    {
     "name": "新增或移除道路比較",
     "how": "把車道以 walls 表示，分別跑有牆與無牆兩種情境並比較熱圖。",
     "effect": "量化步行化後人流如何重新分布。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "吸引子控制"
   ],
   "tools": [
    "Space syntax 分析",
    "現場觀測"
   ],
   "url": ""
  },
  {
   "id": "D03-06",
   "algo": "D03",
   "title": "麥加朝覲 Jamarat 橋的人潮災害研究",
   "creator": "Dirk Helbing, Anders Johansson, Habib Z. Al-Abideen",
   "year": "2007",
   "category": "performance",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "分析 2006 年朝覲人潮事故的影像資料，發現高密度下人流從停走波轉為「群眾湍流」，研究成果被用於改善動線管理與設施設計，是人流研究影響真實建築與營運的重要例子。",
   "variations": [
    {
     "name": "密度監測",
     "how": "每步以網格統計每平方公尺人數，超過門檻的格子標紅並輸出。",
     "effect": "找出危險高密度區。"
    },
    {
     "name": "單向動線",
     "how": "把雙向改為分隔的單向走道（加 walls），比較最大密度與通過量。",
     "effect": "驗證單向動線對安全的效果。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "物理模擬",
    "鄰居搜尋"
   ],
   "tools": [
    "影像追蹤",
    "數學模型"
   ],
   "url": ""
  },
  {
   "id": "D03-07",
   "algo": "D03",
   "title": "MassMotion 行人模擬軟體",
   "creator": "Oasys（Arup）",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "performance"
   ],
   "scale": "建築",
   "summary": "由 Arup 發展、Oasys 發行的商業級 3D 行人模擬軟體，常用於車站、機場、體育場的動線與疏散評估，能處理樓梯、電扶梯與排隊等設施，並輸出密度熱圖與服務水準。",
   "variations": [
    {
     "name": "服務水準（LOS）著色",
     "how": "以網格統計密度，依每人可用面積分成 A–F 級並以顏色輸出。",
     "effect": "得到與顧問報告相同格式的服務水準圖。"
    },
    {
     "name": "排隊設施",
     "how": "在閘門位置加入限速點：人進入半徑內後需停留固定秒數才能通過。",
     "effect": "可模擬剪票口或安檢的排隊長度。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "物理模擬"
   ],
   "tools": [
    "MassMotion"
   ],
   "url": ""
  },
  {
   "id": "D03-08",
   "algo": "D03",
   "title": "Pathfinder 疏散模擬",
   "creator": "Thunderhead Engineering",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "modeling"
   ],
   "scale": "建築",
   "summary": "常用於防火與建築法規檢討的代理人疏散模擬軟體，可匯入建築模型，計算每個出口與樓梯的疏散時間，並以動畫呈現。展示了人流模擬在建築性能設計中的實務角色。",
   "variations": [
    {
     "name": "最近出口選擇",
     "how": "goal 改成出口清單，每人以最短路徑距離選擇出口。",
     "effect": "得到各出口負荷與總疏散時間。"
    },
    {
     "name": "出口寬度掃描",
     "how": "以兩根障礙柱之間的距離代表出口寬度，用 Series 掃描並記錄疏散時間。",
     "effect": "找出符合目標疏散時間的最小出口寬度。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "物理模擬",
    "最佳化"
   ],
   "tools": [
    "Pathfinder"
   ],
   "url": ""
  },
  {
   "id": "D03-09",
   "algo": "D03",
   "title": "Arnhem Centraal 轉運站",
   "creator": "UNStudio",
   "year": "2015",
   "category": "3d-architecture",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "建築",
   "summary": "UNStudio 以轉乘旅客在火車、公車、停車與步行之間的動線分析作為設計主軸，最後形成連續扭轉、無明確樓層分界的大廳空間。是人流研究直接決定建築形體的代表案例。",
   "variations": [
    {
     "name": "熱圖決定樓板開口",
     "how": "把人流熱圖以門檻取等值線，高密度區作為挑空或坡道位置。",
     "effect": "空間形體跟著主要動線走。"
    },
    {
     "name": "多模式轉乘",
     "how": "設多組起訖點（月台、公車站、停車場），並給不同組不同速度與人數。",
     "effect": "看到不同交通模式轉乘動線的交會熱點。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "吸引子控制"
   ],
   "tools": [
    "動線分析"
   ],
   "url": ""
  },
  {
   "id": "D03-10",
   "algo": "D03",
   "title": "Quelea：Grasshopper 代理人外掛",
   "creator": "Alex Fischer",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "建築",
   "summary": "Grasshopper 上的代理人模擬外掛，提供分離、對齊、聚集、尋找、環境邊界等行為元件，可以組合出人流、群集與路徑追蹤，適合與基礎 C# 範例互相對照。",
   "variations": [
    {
     "name": "改寫成行為組合",
     "how": "把 GoalForce、PeopleForce、ObstacleForce 各自寫成可開關、可加權的方法，並把權重做成輸入。",
     "effect": "像外掛一樣能自由組合行為，方便比較。"
    },
    {
     "name": "曲面環境",
     "how": "每步移動後用 surface.ClosestPoint 把人投影回曲面。",
     "effect": "人流可在坡地或看台上模擬。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "多元件",
    "曲面上"
   ],
   "tools": [
    "Grasshopper",
    "Quelea"
   ],
   "url": ""
  },
  {
   "id": "D03-11",
   "algo": "D03",
   "title": "DecodingSpaces Toolbox",
   "creator": "Reinhard König 等（Bauhaus-Universität Weimar）",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "drawing",
    "modeling"
   ],
   "scale": "群體／都市",
   "summary": "Grasshopper 的都市分析工具組，提供街道網絡中心性、可見度（isovist）等 space syntax 類型的分析，可與代理人模擬搭配，把空間分析與人流評估整合在同一個參數化流程。",
   "variations": [
    {
     "name": "Isovist 加權選路",
     "how": "對每個人前方數個候選方向計算可見距離，目標力加上偏向可見距離長的方向。",
     "effect": "人流傾向開闊視野的路徑。"
    },
    {
     "name": "中心性當人口來源",
     "how": "以街道中心性高的節點當作出發點並給較多人數。",
     "effect": "模擬的人流量與都市結構對應。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "鄰居搜尋",
    "多元件"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": ""
  },
  {
   "id": "D03-12",
   "algo": "D03",
   "title": "視覺啟發式行人模型",
   "creator": "Mehdi Moussaïd, Dirk Helbing, Guy Theraulaz",
   "year": "2011",
   "category": "modeling",
   "categories_extra": [
    "performance"
   ],
   "scale": "群體／都市",
   "summary": "以兩條簡單的視覺規則（選擇最快不受阻擋的方向、與前方障礙保持反應時間距離）取代力的相加，更貼近實驗觀察，並能重現高密度下的人潮湍流。是社會力模型之後的重要改良方向。",
   "variations": [
    {
     "name": "方向掃描取代目標力",
     "how": "每人在 ±75° 內掃描若干方向，計算每個方向撞到他人前可走的距離，選擇最接近目的地且可走距離足夠的方向。",
     "effect": "閃避更自然，較少原地抖動。"
    },
    {
     "name": "距離決定速度",
     "how": "速度設為 min(walkSpeed, 前方可走距離 ÷ 反應時間)。",
     "effect": "高密度時自然減速，形成走走停停的波。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "鄰居搜尋",
    "搜尋"
   ],
   "tools": [
    "數學模型"
   ],
   "url": ""
  },
  {
   "id": "D03-13",
   "algo": "D03",
   "title": "PEDSIM 開源行人模擬函式庫",
   "creator": "Christian Gloor",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "群體／都市",
   "summary": "以社會力模型為核心的開源 C++ 行人模擬函式庫，提供代理人、障礙、路徑點等基本物件，程式結構與基礎範例相近，適合想把範例擴充成完整模擬器的學習者參考。",
   "variations": [
    {
     "name": "路徑點（waypoint）序列",
     "how": "Person 加上 List<Point3d> waypoints 與目前索引，抵達一點後切換下一點。",
     "effect": "可模擬逛展、排隊繞行等多段路徑。"
    },
    {
     "name": "類別拆分",
     "how": "把力的計算移入 Person 方法、把障礙寫成 Obstacle class（圓或線段）。",
     "effect": "程式結構更接近函式庫，易於擴充新障礙類型。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "自訂 class"
   ],
   "tools": [
    "C++"
   ],
   "url": ""
  },
  {
   "id": "D03-51",
   "algo": "D03",
   "title": "Steering Behaviors For Autonomous Characters",
   "creator": "Craig Reynolds",
   "year": "1999",
   "category": "urban-landscape",
   "categories_extra": [
    "drawing"
   ],
   "scale": "群體／都市",
   "summary": "Reynolds 在 GDC 1999 發表的論文線上版，定義 seek／flee、pursue／evade、arrival、wander、path following、wall following、collision avoidance、flow field following 等轉向行為，網站另附 Java 動畫圖示，後來成為遊戲與 creative coding 中人流、角色移動的共同基礎。與 GH C# 範例相比，這是把「人流」拆解成可組合轉向力模組的原始來源。",
   "variations": [
    {
     "name": "路徑跟隨",
     "how": "預測個體未來位置，投影到路徑中心線，若偏離半徑外就朝投影點前方 seek",
     "effect": "人流沿走廊或動線流動，而非直線衝向目標"
    },
    {
     "name": "碰撞迴避",
     "how": "預測兩兩個體未來最接近點，若會相撞就提早側向閃避",
     "effect": "對向人流會自然錯身，減少擠成一團"
    },
    {
     "name": "牆面跟隨",
     "how": "以建築平面邊界曲線做為牆，計算個體到牆的預測距離並施加法向排斥",
     "effect": "模擬沿牆行走、轉角繞行等空間行為"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "steering behaviors",
    "人流",
    "自主代理",
    "經典論文",
    "Java"
   ],
   "tools": [
    "Java"
   ],
   "url": "https://www.red3d.com/cwr/steer/gdc99/",
   "image": {
    "file": "img/cases/D03-51.jpg",
    "w": 436,
    "h": 292,
    "source": "red3d.com",
    "author": "Craig Reynolds",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.red3d.com/cwr/steer/gdc99/",
    "note": "論文 Figure 9：路徑跟隨（path following）示意圖"
   }
  },
  {
   "id": "D03-52",
   "algo": "D03",
   "title": "5.7 Path Following（Nature of Code 影片）",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2021",
   "category": "drawing",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "Nature of Code 第 5 章的影片教學，以 p5.js 實作 Reynolds 的路徑跟隨：用純量投影（scalar projection）找出未來位置在路徑上的最近點，偏離時才轉向。這正是把 GH 中的動線曲線當作行人導引的核心計算。",
   "variations": [
    {
     "name": "多段折線路徑",
     "how": "把單一線段換成 GH Polyline，逐段計算投影並取最近者",
     "effect": "行人可沿轉折的走廊或街道前進"
    },
    {
     "name": "路徑半徑即走廊寬度",
     "how": "讓路徑半徑對應實際走廊寬度，並與分離力一起作用",
     "effect": "可觀察寬窄走廊造成的人流密度差異"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "路徑跟隨",
    "steering behaviors",
    "教學影片"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://thecodingtrain.com/tracks/the-nature-of-code-2/noc/5-autonomous-agents/7-path-following",
   "image": {
    "file": "img/cases/D03-52.jpg",
    "w": 480,
    "h": 360,
    "source": "YouTube",
    "author": "Daniel Shiffman（The Coding Train）",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.youtube.com/watch?v=rlZYT-uvmGQ",
    "note": "5.7 Path Following 影片縮圖，代理沿河道狀路徑移動"
   }
  },
  {
   "id": "D03-53",
   "algo": "D03",
   "title": "The Nature of Code 第 5 章：Autonomous Agents",
   "creator": "Daniel Shiffman",
   "year": "2024",
   "category": "drawing",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "Nature of Code（2024 年 No Starch 出版，全文在網站上以 Creative Commons 公開）第 5 章，以 p5.js 講解轉向代理、flow field、path following 與 flocking 等群體行為，並討論演算法效率（空間分格）。可視為把 GH C# 人流範例拆成一個個可單獨練習的積木。",
   "variations": [
    {
     "name": "流場導引",
     "how": "把 GH 中的向量場（例如由出口距離計算的梯度）當作每個格子的期望速度",
     "effect": "整群行人被場引導流向出口，類似疏散模擬"
    },
    {
     "name": "分離 + 路徑跟隨組合",
     "how": "對每個代理把 separation 與 path following 兩股力依權重相加",
     "effect": "得到既沿動線又彼此保持距離的較真實人流"
    },
    {
     "name": "空間分格加速",
     "how": "用 bin-lattice 空間分割只檢查鄰近格的代理",
     "effect": "數千人規模仍可即時模擬"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "自主代理",
    "steering behaviors",
    "人流",
    "教科書"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://natureofcode.com/autonomous-agents/",
   "image": {
    "file": "img/cases/D03-53.jpg",
    "w": 900,
    "h": 506,
    "source": "The Nature of Code",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://natureofcode.com/autonomous-agents/",
    "note": "第 5 章章首圖，魚群照片"
   }
  },
  {
   "id": "D03-54",
   "algo": "D03",
   "title": "Simple Crowd Simulation（Houdini 人群模擬）",
   "creator": "bubble pins",
   "year": "2020",
   "category": "urban-landscape",
   "categories_extra": [
    "performance"
   ],
   "scale": "群體／都市",
   "summary": "SideFX 官網收錄的 Houdini 18 入門教學，以 Crowds 工具架建立代理並模擬大量行走角色。與 GH C# 範例的抽象點粒子不同，Houdini 的 crowd 系統把轉向行為接到帶骨架動畫的角色上，適合做街道、廣場的人流視覺化。",
   "variations": [
    {
     "name": "以密度圖分布人群",
     "how": "用影像或 Mesh 頂點權重控制初始人數密度，而非均勻隨機撒點",
     "effect": "廣場、入口等處出現符合設計意圖的人潮熱區"
    },
    {
     "name": "狀態切換",
     "how": "為代理定義站立、行走、奔跑等狀態，依周邊密度或距離目標切換",
     "effect": "人流在擁擠處放慢、空曠處加速，更接近真實"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Houdini",
    "人群模擬",
    "crowd",
    "3D"
   ],
   "tools": [
    "Houdini"
   ],
   "url": "https://www.sidefx.com/tutorials/simple-crowd-simulation-in-houdini/",
   "image": {
    "file": "img/cases/D03-54.jpg",
    "w": 900,
    "h": 505,
    "source": "SideFX",
    "author": "bubble pins",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.sidefx.com/tutorials/simple-crowd-simulation-in-houdini/",
    "note": "教學封面，Houdini 人群模擬中大量行走角色"
   }
  },
  {
   "id": "D03-55",
   "algo": "D03",
   "title": "People in a Crowd",
   "creator": "Sonia Martin",
   "year": "2014",
   "category": "drawing",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "OpenProcessing 上的 Processing 作品，以向量、物件與陣列模擬人群穿越場地並嘗試閃避放置的障礙物。作者自述行人仍會互相碰撞、路徑被推偏，正好示範只有排斥力而缺乏目標導向與預測迴避時的人流問題（程式需貼回 Processing 執行）。",
   "variations": [
    {
     "name": "加入目標吸引力",
     "how": "為每位行人加上朝對側出口的 seek 力，與障礙排斥相加",
     "effect": "行人繞過障礙後會回到原本方向，而非被推離"
    },
    {
     "name": "預測式迴避",
     "how": "改用未來位置判斷是否相撞，提早側向轉向",
     "effect": "減少個體彼此碰撞、路徑較平順"
    }
   ],
   "difficulty": 1,
   "tags": [
    "creative coding",
    "Processing",
    "OpenProcessing",
    "人流",
    "障礙迴避"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://openprocessing.org/sketch/139678/"
  },
  {
   "id": "E01-01",
   "algo": "E01",
   "title": "Packing Circles and Spheres on Surfaces（CP mesh）",
   "creator": "Alexander Schiftner, Mathias Höbinger, Johannes Wallner, Helmut Pottmann",
   "year": "2009",
   "category": "3d-architecture",
   "categories_extra": [
    "performance",
    "fabrication"
   ],
   "scale": "立面／表皮",
   "summary": "SIGGRAPH Asia 2009 論文，提出一種三角網格，其每個三角面的內切圓彼此相切形成 packing，可延伸出曲面上的圓形圖樣、球體堆疊、帶無扭轉支撐結構的六角網格等，專為自由曲面建築設計。演算法角色是「以最佳化讓網格達到內切圓相切」，和基礎範例的互推同屬收斂型鬆弛。",
   "variations": [
    {
     "name": "由圓心改為網格頂點",
     "how": "基礎範例移動的是圓心；改成移動三角網格頂點，目標函式是讓相鄰三角形的內切圓在共用邊上相切（兩圓切點重合）。",
     "effect": "得到能直接當結構網格的 CP mesh，圓可作為開孔或玻璃。"
    },
    {
     "name": "圓 → 球 → 節點",
     "how": "將每個內切圓沿法向量推成球，球心連線做成桿件。",
     "effect": "得到球體相切的空間結構，節點幾何單純利於製造。"
    },
    {
     "name": "曲面約束",
     "how": "每輪最佳化後把頂點拉回參考曲面（Surface.ClosestPoint），邊界頂點鎖在邊緣曲線上。",
     "effect": "圓的排列貼合任意自由曲面設計。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "曲面上",
    "最佳化",
    "收斂",
    "3D"
   ],
   "tools": [
    "研究原型",
    "數值最佳化"
   ],
   "url": "https://www.geometrie.tuwien.ac.at/geom/ig/pottmann/oldpub/2009/packing09/packing09.html"
  },
  {
   "id": "E01-02",
   "algo": "E01",
   "title": "北京國家游泳中心「水立方」泡泡立面",
   "creator": "PTW Architects、Arup、CSCEC、CCDI",
   "year": "2008",
   "category": "3d-architecture",
   "categories_extra": [
    "performance"
   ],
   "scale": "建築",
   "summary": "為 2008 北京奧運興建，立面與屋頂靈感來自肥皂泡的自然排列（Weaire-Phelan 泡沫結構），以鋼構空間桁架與 ETFE 氣枕構成，看似隨機卻高度重複、可施工。它是「3D 球體／泡泡堆疊再切成多面體」的經典建築案例。",
   "variations": [
    {
     "name": "3D 球體堆疊當泡泡種子",
     "how": "將 E01 升到 3D（圓心加 Z、輸出 Sphere），在長方體量體內做不同半徑的球體 packing。",
     "effect": "得到大小不一但分布均勻的泡泡中心。"
    },
    {
     "name": "球心轉多面體單元",
     "how": "以收斂後的球心做 3D Voronoi（或 power diagram 以半徑加權），再用量體外框切出立面剖面。",
     "effect": "立面上出現類似水立方的不規則多邊形泡泡格。"
    },
    {
     "name": "限制泡泡尺寸種類",
     "how": "半徑不再連續隨機，而是從少數幾種尺寸清單中挑選（List<double> 尺寸族）。",
     "effect": "降低構件種類，接近實際專案「幾種尺寸重複使用」的可建造性。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "物理模擬",
    "拼貼"
   ],
   "tools": [],
   "url": "https://www.arup.com/en-us/projects/national-aquatics-center-water-cube/"
  },
  {
   "id": "E01-03",
   "algo": "E01",
   "title": "Circle-Pack Facade（Kangaroo 自由邊界立面開孔）",
   "creator": "Parametric House",
   "year": "",
   "category": "3d-architecture",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "立面／表皮",
   "summary": "Grasshopper 教學：用 Kangaroo 的 circle packing 在自由形狀邊界內排圓，做成參數化立面，並用點吸引子控制最小與最大半徑。與基礎範例幾乎同構，只是把互推交給 Kangaroo 求解。",
   "variations": [
    {
     "name": "吸引子控制半徑",
     "how": "每個圓的半徑依到吸引點的距離 remap 到 minRadius–maxRadius，每輪重算。",
     "effect": "開孔由密到疏漸變，控制視線與採光。"
    },
    {
     "name": "曲線邊界",
     "how": "把圓形邊界拉回規則改成 Curve.Contains + ClosestPoint 拉回。",
     "effect": "開孔只出現在立面的指定區塊。"
    },
    {
     "name": "輸出穿孔板",
     "how": "圓縮小一個肋寬後與面板做 Boolean 差集，或輸出曲線給雷切。",
     "effect": "可直接加工的穿孔金屬立面。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "吸引子控制",
    "物理模擬"
   ],
   "tools": [
    "Grasshopper",
    "Kangaroo"
   ],
   "url": "https://parametrichouse.com/parametric/circle-pack-facade/"
  },
  {
   "id": "E01-04",
   "algo": "E01",
   "title": "Kangaroo 2 不同大小圓的曲面 circle packing",
   "creator": "Daniel Piker（McNeel 論壇討論）",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "立面／表皮",
   "summary": "Kangaroo 作者 Daniel Piker 在論壇與示範中展示結合 Plankton（可動態改變網格連接）與 Kangaroo（鬆弛最佳化）的 circle packing，包含變動半徑、固定半徑與尺寸族等版本，並可在曲面上進行。",
   "variations": [
    {
     "name": "把互推寫成 Kangaroo goal",
     "how": "基礎範例的「重疊就各推一半」其實就是 Kangaroo 的 Collider／SphereCollide goal；改寫成自訂 goal 或直接接元件，另加 OnMesh 約束。",
     "effect": "可與其他 goal（錨點、邊界、平面化）同時求解。"
    },
    {
     "name": "固定尺寸族",
     "how": "半徑只從 3–5 種尺寸中選，並在收斂後統計各尺寸數量。",
     "effect": "減少模具或切割刀具種類，利於製造。"
    },
    {
     "name": "曲面上鬆弛",
     "how": "每輪互推後用 Mesh.ClosestPoint 拉回網格，圓用該點法向量建立。",
     "effect": "圓均勻鋪在雙曲面上。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "曲面上",
    "物理模擬",
    "收斂"
   ],
   "tools": [
    "Grasshopper",
    "Kangaroo",
    "Plankton"
   ],
   "url": "https://discourse.mcneel.com/t/kangaroo2-circle-packing-different-sized-circles/89878/23"
  },
  {
   "id": "E01-05",
   "algo": "E01",
   "title": "Circle Packing T-Shirt（服裝曲面上的圓）",
   "creator": "Parametric House",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "modeling"
   ],
   "scale": "物件",
   "summary": "Grasshopper 教學：用 Kangaroo 的 circle packing 元件在 T 恤模型上鋪滿圓，示範曲面上 packing 如何用在服裝與穿戴物件。",
   "variations": [
    {
     "name": "曲面拉回",
     "how": "每輪互推後把圓心投影回服裝網格，圓平面採用該點法向量。",
     "effect": "圓均勻貼在不可展的身體曲面上。"
    },
    {
     "name": "展開成布片",
     "how": "把網格展開成 2D 版型後，再把圓映射回平面輸出。",
     "effect": "可雷切布料或皮革的開孔版型。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "曲面上",
    "物理模擬"
   ],
   "tools": [
    "Grasshopper",
    "Kangaroo"
   ],
   "url": "https://parametrichouse.com/circle-packing-t-shirt/"
  },
  {
   "id": "E01-06",
   "algo": "E01",
   "title": "A Randomized Approach to Circle Packing",
   "creator": "Tyler Hobbs",
   "year": "2016",
   "category": "art-installation",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "生成藝術家 Tyler Hobbs 的文章：不用數學最佳化，而是暴力地在隨機位置試放圓，放得下就收，連續失敗 2000 次就換下一個較小的尺寸（例如 10 個半徑 50、300 個半徑 10）。是基礎範例「互推」法之外最直觀的替代規則。",
   "variations": [
    {
     "name": "互推 → 放置與拒絕",
     "how": "移除 PushApart 迴圈，改成對每個尺寸：隨機產生圓心，若與所有已放圓不重疊就加入，否則失敗計數 +1。",
     "effect": "結果完全沒有重疊，縫隙分布更隨機、更有手感。"
    },
    {
     "name": "尺寸清單由大到小",
     "how": "新增兩個輸入 List<double> sizes、List<int> counts，外層迴圈依序處理。",
     "effect": "大圓先佔位、小圓填縫，形成清楚的層次。"
    },
    {
     "name": "圓內再填圓",
     "how": "對每個大圓遞迴呼叫同一函式，以它為邊界再填更小的圓。",
     "effect": "巢狀、分形感的圖樣。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "隨機",
    "可重現種子",
    "遞迴"
   ],
   "tools": [
    "Processing",
    "Quil／Clojure"
   ],
   "url": "https://tylerxhobbs.com/essays/2016/a-randomized-approach-to-cicle-packing"
  },
  {
   "id": "E01-07",
   "algo": "E01",
   "title": "Coding Challenge #50：Animated Circle Packing",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "p5.js／Processing 教學影片，示範「成長式」circle packing：每幀在空位產生新圓，圓持續長大直到碰到其他圓；後續部分用影像決定圓出現的位置，拼出文字或圖像。",
   "variations": [
    {
     "name": "成長式規則",
     "how": "新增 bool[] isGrowing，每輪所有成長中的圓 r += 0.1，碰到別的圓或邊界就停；每輪在空白處加一個新圓。",
     "effect": "動畫中圓一邊冒出一邊長大，最後彼此相切。"
    },
    {
     "name": "影像遮罩",
     "how": "讀入黑白影像，只允許在白色像素處生成新圓，並以像素顏色上色。",
     "effect": "用圓拼出文字或 Logo。"
    },
    {
     "name": "Timer 動畫",
     "how": "把圓的清單放到欄位，每次 RunScript 只推進一步。",
     "effect": "在 Grasshopper 中即時播放生成過程。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "動畫",
    "影像輸入",
    "開放生長"
   ],
   "tools": [
    "p5.js",
    "Processing"
   ],
   "url": "https://www.youtube.com/watch?v=QHEQuoIKgNE"
  },
  {
   "id": "E01-08",
   "algo": "E01",
   "title": "Apollonian Gasket 互動草稿",
   "creator": "Malin Christersson（OpenProcessing）",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "OpenProcessing 上的 Apollonian gasket 互動作品，按數字鍵顯示 0–9 層遞迴，並可切換顯示與 Apollonian 圓正交的圓。Apollonian gasket 是三個互切圓出發、不斷在空隙填入相切圓的分形，是 circle packing 的「精確遞迴版」。",
   "variations": [
    {
     "name": "迭代 → 遞迴",
     "how": "改用 Descartes 圓定理（曲率 k4 = k1+k2+k3 ± 2√(k1k2+k2k3+k3k1)）計算相切圓，寫一個遞迴函式處理每個三圓空隙。",
     "effect": "所有圓精確相切、層層細分的分形。"
    },
    {
     "name": "深度控制",
     "how": "新增 depth 輸入或最小半徑門檻作為遞迴終止條件，並用 DataTree 依層分支輸出。",
     "effect": "可分層上色或分層加工（不同深度用不同刀具）。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "遞迴",
    "分形",
    "DataTree"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://openprocessing.org/sketch/147596/"
  },
  {
   "id": "E01-09",
   "algo": "E01",
   "title": "Single Line Apollonian Gaskets for Fashion",
   "creator": "Loe Feijs, Marina Toeters",
   "year": "2022",
   "category": "fabrication",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Bridges 2022 數學與藝術研討會論文，把 Apollonian gasket 轉成可用於時尚設計的單筆線圖樣，探討如何讓圓形分形能以連續路徑製作。",
   "variations": [
    {
     "name": "圓 → 單筆路徑",
     "how": "把收斂後的圓依鄰接關係（相切者視為相鄰）建圖，用深度優先走訪串成一條連續曲線。",
     "effect": "適合刺繡、繪圖機或雷射連續加工，減少跳針或抬刀。"
    },
    {
     "name": "遞迴深度當層次",
     "how": "不同遞迴層輸出到不同圖層，給不同線材或顏色。",
     "effect": "服裝上的圖樣有深淺與粗細層次。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "遞迴",
    "分形"
   ],
   "tools": [],
   "url": "http://www.m.archive.bridgesmathart.org/2022/bridges2022-119.pdf"
  },
  {
   "id": "E01-10",
   "algo": "E01",
   "title": "以 Freeform Auxetics 做可穿戴、可調的 MRI 超材料",
   "creator": "Ke Wu, Xia Zhu, Thomas G. Bifano, Stephan W. Anderson, Xin Zhang",
   "year": "2023",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "研究論文，以計算設計工具互動且有效率地求解複雜的 circle packing 問題，用來排列可展開的自由形 auxetic（負泊松比）單元，使超材料能貼合人體曲面並調整性能。",
   "variations": [
    {
     "name": "圓 = 可變形單元",
     "how": "每個圓的位置決定一個 auxetic 單元（例如旋轉方塊）的中心與尺寸，收斂後在每個圓內放置單元幾何。",
     "effect": "單元大小隨曲率變化、可貼合身體。"
    },
    {
     "name": "目標曲面驅動半徑",
     "how": "以曲面各處的高斯曲率決定目標半徑，曲率大處用小圓。",
     "effect": "展開後能包覆雙曲面而不皺摺。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "曲面上",
    "最佳化"
   ],
   "tools": [],
   "url": "https://arxiv.org/pdf/2311.13611"
  },
  {
   "id": "E01-11",
   "algo": "E01",
   "title": "Finetuning Discrete Architectural Surfaces by use of Circle Packing",
   "creator": "Journal of Asian Architecture and Building Engineering 期刊論文（作者待查）",
   "year": "2023",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "立面／表皮",
   "summary": "期刊論文，以 circle packing 作為工具微調離散化的建築曲面（網格面板），讓面板尺寸與排列更規則，承接 Schiftner 等人的 CP mesh 研究方向。",
   "variations": [
    {
     "name": "圓當品質指標",
     "how": "把網格每個面的內切圓算出來，量測相鄰內切圓的間隙或重疊量作為 totalOverlap，類似基礎範例的收斂指標。",
     "effect": "可視化哪裡的面板最不規則、需要調整。"
    },
    {
     "name": "以互推修正頂點",
     "how": "把基礎範例的互推位移改施加在網格頂點上，並加上拉回原曲面的約束。",
     "effect": "面板形狀更接近正三角形，尺寸種類減少。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "最佳化",
    "曲面上",
    "收斂"
   ],
   "tools": [],
   "url": "https://doi.org/10.1080/13467581.2023.2229407"
  },
  {
   "id": "E01-12",
   "algo": "E01",
   "title": "Controlled Circle Packing with Processing",
   "creator": "CodePlastic",
   "year": "2017",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Processing 教學文章，示範可控制的 circle packing：以互推力讓圓分開並加入控制條件，用來做有設計意圖的圓形構圖。",
   "variations": [
    {
     "name": "力的加權",
     "how": "把「各推一半」改成依半徑比例分配（大圓推得少、小圓推得多），並加入阻尼係數。",
     "effect": "大圓較穩定、小圓填縫，收斂更快更平順。"
    },
    {
     "name": "滑鼠／點吸引",
     "how": "加入 attractor 輸入，每輪給所有圓一個朝吸引點的小位移。",
     "effect": "圓群聚往設計者指定的焦點。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "吸引子控制",
    "物理模擬"
   ],
   "tools": [
    "Processing"
   ],
   "url": "http://www.codeplastic.com/2017/09/09/controlled-circle-packing-with-processing/"
  },
  {
   "id": "E01-13",
   "algo": "E01",
   "title": "植物生態系的建模與渲染（以圓的競爭決定植株分布）",
   "creator": "Oliver Deussen, Pat Hanrahan, Bernd Lintermann, Radomír Měch, Matt Pharr, Przemyslaw Prusinkiewicz",
   "year": "1998",
   "category": "urban-landscape",
   "categories_extra": [
    "drawing"
   ],
   "scale": "地景",
   "summary": "SIGGRAPH 1998 論文 Realistic Modeling and Rendering of Plant Ecosystems，以圓代表每株植物的影響範圍，透過圓的重疊競爭（較弱者死亡）與成長模擬出自然的植被分布，再放置 L-System 植物模型。是 circle packing 應用在地景配置的經典做法。",
   "variations": [
    {
     "name": "重疊 → 淘汰",
     "how": "兩圓重疊時不互推，而是比較半徑，較小的圓被移除（或縮小），每輪所有圓半徑成長。",
     "effect": "自然形成「大樹稀疏、小樹填縫」的自我疏化林相。"
    },
    {
     "name": "多物種",
     "how": "每個圓加上 species 欄位，不同物種有不同最大半徑與耐陰度。",
     "effect": "群落邊界與混生區域自然出現。"
    },
    {
     "name": "接 L-System",
     "how": "收斂後在每個圓心放置 A01 的 L-System 樹，半徑決定代數與大小。",
     "effect": "完整的 3D 地景植栽模型。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "物理模擬",
    "隨機",
    "多元件"
   ],
   "tools": [],
   "url": ""
  },
  {
   "id": "E01-14",
   "algo": "E01",
   "title": "d3.pack 階層式圓形圖（circle packing 資料視覺化）",
   "creator": "Mike Bostock（D3.js）",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "D3.js 的 pack 版面以圓的面積代表數值、以圓套圓代表階層，是資訊圖表中最常見的 circle packing 用法。可轉用於建築計畫書的空間需求（各空間面積）視覺化。",
   "variations": [
    {
     "name": "半徑 = √面積",
     "how": "輸入 List<double> areas（空間需求表），半徑設為 √(area/π)，再做 packing。",
     "effect": "一眼看出各空間需求大小的泡泡圖（bubble diagram）。"
    },
    {
     "name": "巢狀邊界",
     "how": "先 pack 各樓層或分區的大圓，再以每個大圓為邊界 pack 其中的房間。",
     "effect": "空間計畫的階層式泡泡圖。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "遞迴",
    "DataTree"
   ],
   "tools": [
    "D3.js",
    "JavaScript"
   ],
   "url": ""
  },
  {
   "id": "E01-51",
   "algo": "E01",
   "title": "Packing The Torus（Houdini 曲面圓填充）",
   "creator": "Manuel Casasola Merkle（Entagma）",
   "year": "2017",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "立面／表皮",
   "summary": "Entagma 在 Houdini 裡用模擬的方式，把半徑各不相同的粒子緊密排在甜甜圈（torus）曲面上：粒子彼此推開，同時藉由符號距離場（SDF）與其梯度被投影回曲面。和 Grasshopper C# 基礎範例在平面圓形邊界內互推不同，這裡的「邊界」換成任意 3D 曲面，而且整個鬆弛過程本身就是可以輸出的動畫。",
   "variations": [
    {
     "name": "平面邊界改成曲面投影",
     "how": "每輪推開之後，不再做「超出邊界圓就拉回」，改成把圓心用 Surface.ClosestPoint（或 Mesh.ClosestPoint）拉回目標曲面，並以曲面法向量決定圓的平面。",
     "effect": "圓填充可以包覆穹頂、雙曲面等自由曲面，直接成為開孔立面或表皮面板的配置。"
    },
    {
     "name": "半徑依曲率或吸引點變化",
     "how": "把 minRadius～maxRadius 的隨機半徑改成依曲面曲率或到吸引點的距離做 remap。",
     "effect": "曲率大或靠近焦點的地方圓較小，形成有方向性的疏密漸層。"
    },
    {
     "name": "輸出每一輪的狀態",
     "how": "把每次迭代的圓心清單存成 DataTree 的一個分支，用 Slider 選擇顯示第幾輪。",
     "effect": "可以做成從擁擠重疊到均勻鋪滿的過程動畫，方便教學說明收斂。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Houdini",
    "VEX",
    "曲面",
    "模擬",
    "動畫"
   ],
   "tools": [
    "Houdini"
   ],
   "url": "https://entagma.com/packing-the-torus/",
   "image": {
    "file": "img/cases/E01-51.jpg",
    "w": 480,
    "h": 360,
    "source": "YouTube（Entagma）",
    "author": "Manuel Casasola Merkle",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.youtube.com/watch?v=OkiwsuFo_gA",
    "note": "影片縮圖：甜甜圈曲面上大小不一的粒子緊密排列"
   }
  },
  {
   "id": "E01-52",
   "algo": "E01",
   "title": "Circle packing with compute shaders（TouchDesigner）",
   "creator": "noones_img（Derivative 社群轉載）",
   "year": "2021",
   "category": "performance",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "這是 TouchDesigner 社群的教學，用 GLSL compute shader 在 GPU 上實作圓填充，讓大量圓能即時生成、推擠並用於視覺表演。基礎範例用 C# 雙層迴圈兩兩比對（N²），這裡則把每個圓的碰撞檢查平行分給 GPU 執行緒，換取即時互動的效能。",
   "variations": [
    {
     "name": "平行化的兩兩比對",
     "how": "把「先累積位移、再一次套用」的兩階段迴圈改成 Parallel.For（每個圓一個工作），各自只寫入自己的位移陣列欄位。",
     "effect": "在 Grasshopper 裡也能體會 GPU 版「每個圓獨立計算」的思路，圓數變多時明顯加速。"
    },
    {
     "name": "由影像控制生成區域",
     "how": "在隨機放置圓心時，先取樣一張影像的亮度，亮度低於門檻的位置才接受。",
     "effect": "圓只長在影像的暗部，排出文字、標誌或平面圖的輪廓。"
    },
    {
     "name": "即時參數驅動",
     "how": "把 maxRadius 或 boundaryRadius 接到 Timer 或音訊振幅之類隨時間變化的輸入，每次更新都從上一輪結果繼續推。",
     "effect": "圖樣會隨節奏呼吸、重新排列，適合展場投影。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "TouchDesigner",
    "GLSL",
    "GPU",
    "即時互動"
   ],
   "tools": [
    "TouchDesigner",
    "GLSL"
   ],
   "url": "https://derivative.ca/community-post/tutorial/circle-packing-compute-shaders/63846",
   "image": {
    "file": "img/cases/E01-52.jpg",
    "w": 900,
    "h": 473,
    "source": "Derivative（TouchDesigner 社群）",
    "author": "noones_img",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://derivative.ca/community-post/tutorial/circle-packing-compute-shaders/63846",
    "note": "文章預覽圖：GPU 即時生成的圓填充"
   }
  },
  {
   "id": "E01-53",
   "algo": "E01",
   "title": "A Recursive Circle Packing Algorithm for Organic Growth Patterns",
   "creator": "Ahmad Moussa（Gorilla Sun）",
   "year": "2023",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Ahmad Moussa 以 p5.js 寫的圓填充變體：新圓不是隨機散落，而是從一個起始節點開始，在已有圓的旁邊找空位放置，成為它的子節點；放不下時就遞迴往子節點、孫節點找空間，長成樹狀分枝的圓群（靈感來自 Happy Coding 的 Bonsai Tree 範例）。與基礎範例「一次撒滿再互推」不同，它是逐一放置、不重疊的生長式填充。",
   "variations": [
    {
     "name": "互推改成貼邊生長",
     "how": "不再一次產生全部圓，而是每次挑一個已放置的圓，在其外側距離 r1+r2 的位置試放新圓，只要不與任何圓重疊就收下並記錄父子關係。",
     "effect": "得到由核心向外延伸的有機分枝圖樣，而非均勻鋪滿。"
    },
    {
     "name": "遞迴往外尋找空位",
     "how": "放置失敗時，改從該圓的子節點中隨機挑一個再試，直到末端節點。",
     "effect": "生長集中在外緣，形狀像珊瑚或菌落。"
    },
    {
     "name": "父子連線",
     "how": "除了輸出圓，也把每對父子圓心連成 Line。",
     "effect": "同時得到一張樹狀網絡，可轉成結構分枝或路徑系統。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "遞迴",
    "生長",
    "生成藝術"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://www.gorillasun.de/blog/a-recursive-circle-packing-strategy-for-organic-growth-patterns/",
   "image": {
    "file": "img/cases/E01-53.jpg",
    "w": 900,
    "h": 707,
    "source": "Gorilla Sun",
    "author": "Ahmad Moussa",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.gorillasun.de/blog/a-recursive-circle-packing-strategy-for-organic-growth-patterns/",
    "note": "文章預覽圖：遞迴生長的彩色圓群"
   }
  },
  {
   "id": "E01-54",
   "algo": "E01",
   "title": "circlepack-cpp：openFrameworks 圓填充編輯器",
   "creator": "Joseff（jn3008）",
   "year": "2023",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以 openFrameworks（C++）寫的互動應用，使用者編輯一張三角化的圖（刪點、翻邊、加點），程式依 Collins 與 Stephenson 的方法算出每個頂點對應圓的半徑，讓相鄰的圓剛好相切。和基礎範例「隨機圓互推到不重疊」不同，這是由拓樸（誰和誰相鄰）決定幾何的「相切型」圓填充，可固定邊界圓半徑或邊界角度和。",
   "variations": [
    {
     "name": "由網格拓樸決定相切",
     "how": "先把一張三角網格的每個頂點當作一個圓，對每個內部頂點反覆調整半徑，使它與所有鄰居圓相切時角度總和為 2π。",
     "effect": "得到 CP mesh 式的相切圓陣列，可直接對應到立面開孔或節點配置。"
    },
    {
     "name": "固定邊界條件",
     "how": "邊界頂點的半徑固定為設定值（或讓邊界圓都貼齊外框），只迭代內部頂點。",
     "effect": "同一張網格可以產生不同的外輪廓與漸變大小。"
    },
    {
     "name": "互動編輯網格",
     "how": "把三角網格作為 Grasshopper 輸入，讓設計者在 Rhino 中移動、刪除頂點後重新計算。",
     "effect": "設計者用拓樸控制圖樣，而不是用亂數種子碰運氣。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "openFrameworks",
    "C++",
    "互動",
    "拓樸"
   ],
   "tools": [
    "openFrameworks"
   ],
   "url": "https://github.com/jn3008/circlepack-cpp",
   "image": {
    "file": "img/cases/E01-54.jpg",
    "w": 900,
    "h": 350,
    "source": "GitHub jn3008/circlepack-cpp",
    "author": "Joseff（jn3008）",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://github.com/jn3008/circlepack-cpp",
    "note": "README 示範圖：三角網與對應的相切圓填充"
   }
  },
  {
   "id": "E02-01",
   "algo": "E02",
   "title": "Fast Poisson Disk Sampling in Arbitrary Dimensions",
   "creator": "Robert Bridson",
   "year": "2007",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "SIGGRAPH 2007 短文，提出只要對傳統 dart throwing 做小修改（在既有點的 r–2r 環內試放、用網格加速），就能以 O(N) 時間在任意維度產生 Poisson 圓盤取樣，正是基礎範例的原始演算法。",
   "variations": [
    {
     "name": "升到 3D",
     "how": "cellSize = r/√3、網格改 int[,,]、候選點改在球殼內取樣，鄰格檢查改為 3D。",
     "effect": "空間中的藍噪點，可當 3D Voronoi 或粒子初始位置。"
    },
    {
     "name": "調整 k 值",
     "how": "把 triesPerPoint 從 30 改成 5–10 做比較並計時（Stopwatch）。",
     "effect": "理解速度與填充緻密度的取捨。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "空間索引",
    "隨機",
    "3D"
   ],
   "tools": [
    "研究原型"
   ],
   "url": "https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf"
  },
  {
   "id": "E02-02",
   "algo": "E02",
   "title": "Weighted Voronoi Stippling（加權 Voronoi 點描）",
   "creator": "Adrian Secord",
   "year": "2002",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "NPAR 2002 論文，模仿傳統點描畫以點的疏密表現色調：以影像亮度為權重反覆做加權 Voronoi 重心鬆弛（Lloyd），把點移到暗處較密的位置。常以 Poisson 或隨機點作為初始點，是變密度藍噪點取樣的代表作。",
   "variations": [
    {
     "name": "Poisson 當初始點",
     "how": "先以 E02 產生點（或依亮度的變密度版），再進行加權 Lloyd 鬆弛。",
     "effect": "收斂更快、初始不會有大片空洞。"
    },
    {
     "name": "加權重心",
     "how": "每個 Voronoi 單元內取樣像素，以（1 − 亮度）為權重計算重心，把點移過去。",
     "effect": "暗處點密、亮處點疏，重現照片色調。"
    },
    {
     "name": "點 → 開孔",
     "how": "把最終點轉成相同或依亮度變化的圓孔。",
     "effect": "點描影像穿孔立面或鋼板。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "影像輸入",
    "收斂",
    "最佳化"
   ],
   "tools": [
    "研究原型"
   ],
   "url": "https://dl.acm.org/doi/abs/10.1145/508530.508537"
  },
  {
   "id": "E02-03",
   "algo": "E02",
   "title": "StippleGen：加權 Voronoi 點描與 TSP 路徑",
   "creator": "Evil Mad Scientist Laboratories（Windell Oskay 等）",
   "year": "2012",
   "category": "fabrication",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以 Processing 寫成的免費開源軟體，實作 Secord 的點描演算法，並能把點串成旅行推銷員（TSP）單一路徑，輸出 SVG 給繪圖機、Egg-Bot 或 CNC 使用，最多約 10,000 點。",
   "variations": [
    {
     "name": "點 → TSP 路徑",
     "how": "對 poissonPoints 做最近鄰居串接，再以 2-opt 消除交叉，輸出 Polyline。",
     "effect": "繪圖機一筆畫完，抬筆次數大幅減少。"
    },
    {
     "name": "路徑 → 雕刻",
     "how": "把 Polyline 交給 CNC 以固定深度雕刻或雷射燒刻。",
     "effect": "木板或金屬板上的連續線點描圖。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "影像輸入",
    "最佳化"
   ],
   "tools": [
    "Processing",
    "Inkscape"
   ],
   "url": "https://www.evilmadscientist.com/2012/stipplegen-weighted-voronoi-stippling-and-tsp-paths-in-processing/"
  },
  {
   "id": "E02-04",
   "algo": "E02",
   "title": "Sample Elimination for Generating Poisson Disk Sample Sets",
   "creator": "Cem Yuksel",
   "year": "2015",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Eurographics 2015 論文，先撒出大量隨機點，再以加權方式逐一刪除最擠的點，直到剩下目標數量的 Poisson 取樣；因只需要距離計算，可直接用在 3D 網格表面，論文示範了在兔子模型上放頭髮與在樹枝上放葉子。",
   "variations": [
    {
     "name": "由「長出來」改成「刪下去」",
     "how": "先用 Mesh 表面隨機取樣 5N 個點，建立每點的擁擠權重（鄰近點距離和），反覆刪掉權重最大者並更新鄰居，直到剩 N 個點。",
     "effect": "可精確指定點數，且適用任何曲面或網格。"
    },
    {
     "name": "在建築曲面上放構件",
     "how": "把剩下的點當作面板支撐點或植栽牆盆位置，用點的法向量建立 Plane 放置構件。",
     "effect": "自由曲面上間距均勻的構件配置。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "曲面上",
    "空間索引",
    "3D"
   ],
   "tools": [
    "C++"
   ],
   "url": "http://www.cemyuksel.com/research/sampleelimination/"
  },
  {
   "id": "E02-05",
   "algo": "E02",
   "title": "Visualizing Algorithms：Poisson-disc 取樣動畫",
   "creator": "Mike Bostock",
   "year": "2014",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "D3.js 作者的長文，以動畫比較純隨機、Mitchell 最佳候選法與 Bridson 的 Poisson-disc 取樣，展示新點如何從既有點逐步向外長出；是把基礎範例視覺化最好的參考。",
   "variations": [
    {
     "name": "顯示活躍名單",
     "how": "多輸出一組 activePoints（growingPoints 對應的點）與每次試放的候選點，用不同顏色顯示。",
     "effect": "看得見「波前」由種子往外擴散。"
    },
    {
     "name": "改成最佳候選法",
     "how": "每次產生 k 個隨機候選點，選離既有點最遠者，不需要活躍名單。",
     "effect": "比較兩種演算法的速度與分布差異。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "動畫",
    "隨機"
   ],
   "tools": [
    "D3.js",
    "JavaScript"
   ],
   "url": "https://bost.ocks.org/mike/algorithms/"
  },
  {
   "id": "E02-06",
   "algo": "E02",
   "title": "Poisson-Disc Sampling 互動視覺化",
   "creator": "Jason Davies",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以動畫展示 Bridson 的 O(n) 演算法如何產生「緊密但不小於最小距離」的點，作者並提到曾把 Poisson-disc 取樣用在球面上。",
   "variations": [
    {
     "name": "球面取樣",
     "how": "候選點改在球面上取樣（切平面內偏移後正規化回球面），距離改用大圓距離或弦長。",
     "effect": "在圓頂或球形量體上均勻分布開孔或節點。"
    },
    {
     "name": "點 → Voronoi 圖樣",
     "how": "把點接 Voronoi 元件並向內偏移。",
     "effect": "大小均勻、形狀自然的細胞圖樣。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "曲面上",
    "動畫"
   ],
   "tools": [
    "D3.js",
    "JavaScript"
   ],
   "url": "https://www.jasondavies.com/poisson-disc/"
  },
  {
   "id": "E02-07",
   "algo": "E02",
   "title": "Coding Challenge #33：Poisson-disc Sampling",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "p5.js 現場寫程式教學，一步步建立網格、活躍名單與鄰格檢查，實作 Bridson 演算法；結構與基礎 C# 範例幾乎一一對應，適合自學對照。",
   "variations": [
    {
     "name": "上色依生成順序",
     "how": "輸出每個點的收下順序編號，映射到漸層色。",
     "effect": "看得出由種子向外擴張的年輪狀圖樣。"
    },
    {
     "name": "多個種子",
     "how": "初始化時放入多個種子點（例如滑鼠點或輸入點清單）。",
     "effect": "多個波前同時生長並在中間相遇。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "動畫",
    "空間索引"
   ],
   "tools": [
    "p5.js"
   ],
   "url": "https://thecodingtrain.com/challenges/33-poisson-disc-sampling"
  },
  {
   "id": "E02-08",
   "algo": "E02",
   "title": "mapgen4：Poisson 點＋Voronoi 的程序化地形地圖",
   "creator": "Amit J. Patel（Red Blob Games）",
   "year": "2018",
   "category": "urban-landscape",
   "categories_extra": [
    "drawing"
   ],
   "scale": "地景",
   "summary": "互動式程序化地圖產生器，以 poisson-disk-sampling 函式庫產生點，再建立 Delaunay／Voronoi 結構，於其上計算高程、河流與降雨，最後渲染成手繪風地圖。",
   "variations": [
    {
     "name": "Poisson 點 → Delaunay 地形網格",
     "how": "以取樣點建立 Delaunay 三角網，每個頂點的 Z 值由噪聲（C04）決定。",
     "effect": "不規則但均勻的地形網格，沒有格狀假象。"
    },
    {
     "name": "Voronoi 區塊當地塊",
     "how": "每個 Voronoi 單元依高程或坡度分類成水域、綠地或建地。",
     "effect": "自然形狀的基地分區圖。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "多元件",
    "隨機"
   ],
   "tools": [
    "JavaScript",
    "WebGL"
   ],
   "url": "https://www.redblobgames.com/maps/mapgen4/"
  },
  {
   "id": "E02-09",
   "algo": "E02",
   "title": "Poisson disc vs. jittered grid 比較",
   "creator": "Amit J. Patel（Red Blob Games）",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "比較抖動格點與 Poisson disc 兩種產生不規則點的方法，說明 Poisson disc 沒有群聚、空洞較少、角度分布較佳，並指出把 tries 從預設 30 降到 5–10 可加速 2–4 倍而品質仍可接受。",
   "variations": [
    {
     "name": "改成抖動格點對照",
     "how": "新增第三個輸出：每個網格中心加上小於 cellSize/2 的隨機偏移。",
     "effect": "三組點（隨機、抖動、Poisson）並排比較，理解藍噪點。"
    },
    {
     "name": "降低 tries 做效能測試",
     "how": "用 System.Diagnostics.Stopwatch 量測不同 triesPerPoint 的時間與點數。",
     "effect": "學會在大尺度（整個街區植栽）時取得速度與品質的平衡。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "隨機",
    "空間索引"
   ],
   "tools": [
    "JavaScript"
   ],
   "url": "https://www.redblobgames.com/x/1830-jittered-grid/"
  },
  {
   "id": "E02-10",
   "algo": "E02",
   "title": "Blender Geometry Nodes：Distribute Points on Faces（Poisson Disk 模式）",
   "creator": "Blender Foundation",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "地景",
   "summary": "Blender 幾何節點中的點分布節點提供 Random 與 Poisson Disk 兩種模式，後者在網格表面上以最小距離與密度（可用權重貼圖控制）撒點，常用於散佈植物、石頭等實例。",
   "variations": [
    {
     "name": "網格表面取樣",
     "how": "在 C# 中先用 MeshFace 面積加權隨機取樣大量點，再依 minDistance 做剔除（類似 Yuksel 或 dart throwing）。",
     "effect": "在地形網格上均勻散佈樹木或景觀元素。"
    },
    {
     "name": "頂點色控制密度",
     "how": "讀取 Mesh.VertexColors 或自訂權重作為局部 minDistance。",
     "effect": "坡度大處稀疏、谷地密集等設計意圖的植栽分布。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "曲面上",
    "3D"
   ],
   "tools": [
    "Blender"
   ],
   "url": "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/point/distribute_points_on_faces.html"
  },
  {
   "id": "E02-11",
   "algo": "E02",
   "title": "Grasshopper 的 Poisson Disk Sampling 元件（2D 與 3D 球體版）",
   "creator": "Peter Krattenmacher（McNeel 論壇）",
   "year": "2020",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "論壇使用者分享自製的 Grasshopper Poisson 取樣元件，一個做標準 2D 取樣，另一個在 3D 空間中以球代替圓盤，並計畫開發測地距離（geodesic）版本以用於曲面。",
   "variations": [
    {
     "name": "測地距離版",
     "how": "在網格上以測地距離（沿表面最短距離，可用 Dijkstra 在網格邊上近似）取代直線距離判斷。",
     "effect": "在強烈彎曲的曲面上間距仍然一致。"
    },
    {
     "name": "3D 點當空間桁架節點",
     "how": "3D 取樣後以固定半徑連接鄰近點成桿件，輸出 Line 清單。",
     "effect": "不規則但桿長接近的空間桁架。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "曲面上",
    "空間索引"
   ],
   "tools": [
    "Grasshopper",
    "C#"
   ],
   "url": "https://discourse.mcneel.com/t/poisson-disk-sampling-component/109884"
  },
  {
   "id": "E02-12",
   "algo": "E02",
   "title": "玻璃纖維立體字的有機纖維分布",
   "creator": "McNeel 論壇討論（Laurent Delrieu 回覆）",
   "year": "2025",
   "category": "art-installation",
   "categories_extra": [
    "modeling",
    "drawing"
   ],
   "scale": "物件",
   "summary": "論壇上一個以大量纖維構成、帶放射狀動態模糊感的 3D 字體案例，回覆者建議以 Poisson 圓盤取樣取代 Populate Geometry，讓纖維起點分布更有機、不群聚，再以 Pipe 與網格化轉成 3D 物件。",
   "variations": [
    {
     "name": "邊界改成文字輪廓",
     "how": "把矩形範圍換成文字曲線（TextEntity 轉 Curve），用 Contains 判斷候選點。",
     "effect": "點均勻填滿字形。"
    },
    {
     "name": "點 → 放射狀纖維",
     "how": "每個點沿遠離某中心的方向長出長度隨機的線段，再 Pipe 成實體。",
     "effect": "帶有速度感的纖維字體，可做裝置或招牌。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "隨機",
    "3D"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://discourse.mcneel.com/t/letters-in-fiberglass/198463"
  },
  {
   "id": "E02-51",
   "algo": "E02",
   "title": "Fun With Poisson Disk Sampling（Processing 影像風格化）",
   "creator": "Manohar Vanga（Sighack）",
   "year": "2018",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Manohar Vanga 先用 Processing 實作 Bridson 演算法，再把 Poisson 點用在照片上，做出點描、油畫、炭筆、Voronoi 馬賽克、交叉排線、點彩等八種風格。基礎範例只輸出點與對照用的純隨機點，這裡則示範同一組藍噪點如何透過「點的大小、顏色、筆觸方向」變成完全不同的畫面。",
   "variations": [
    {
     "name": "點大小對應影像灰階",
     "how": "為每個 Poisson 點取樣影像亮度，把圓半徑設為亮度的反比。",
     "effect": "得到點描（stippling）效果，也可轉成立面穿孔板的孔徑分布。"
    },
    {
     "name": "由大到小多層取樣",
     "how": "以遞減的 minDistance 重複執行取樣，大間距層先畫、小間距層後畫。",
     "effect": "先有大色塊再有細節，類似油畫層層上色。"
    },
    {
     "name": "點轉成 Voronoi 馬賽克",
     "how": "把輸出點送進 Voronoi 元件，並以細胞中心的影像顏色填色。",
     "effect": "得到均勻但不規則的馬賽克磚拼貼。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "Processing",
    "影像處理",
    "點描",
    "生成藝術"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://sighack.com/post/fun-with-poisson-disk-sampling",
   "image": {
    "file": "img/cases/E02-51.jpg",
    "w": 500,
    "h": 500,
    "source": "Sighack",
    "author": "Manohar Vanga",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://sighack.com/post/fun-with-poisson-disk-sampling",
    "note": "文章預覽圖：以 Poisson 點做成的點描肖像"
   }
  },
  {
   "id": "E02-52",
   "algo": "E02",
   "title": "ofxPoissonDiskSampling（openFrameworks 外掛）",
   "creator": "Marcel Ruegenberg",
   "year": "2015",
   "category": "2d-pattern",
   "categories_extra": [
    "modeling"
   ],
   "scale": "物件",
   "summary": "把 Poisson 圓盤取樣包成 openFrameworks 外掛，README 以兩張 Delaunay 三角網做對照：用 ofRandom 純隨機點會出現細長三角形，改用 Poisson 點則得到大小接近、形狀勻稱的三角形。這正好延伸基礎範例的「Poisson 點 vs 純隨機點」對照，把差異放到網格品質上來看。",
   "variations": [
    {
     "name": "輸出點接 Delaunay",
     "how": "把 poissonPoints 與 randomPoints 分別送入 Delaunay Mesh 元件並排顯示。",
     "effect": "直接看到藍噪點產生較均勻的三角網，適合作為面板分割或結構網格。"
    },
    {
     "name": "量化網格品質",
     "how": "計算每個三角形的最小內角，統計兩種點集的平均值與最小值。",
     "effect": "用數字說明 Poisson 取樣為何能避免細長三角形。"
    },
    {
     "name": "在曲面 UV 上取樣",
     "how": "把 width/height 改成曲面的 UV 範圍，取樣後用 Surface.PointAt 映射到 3D。",
     "effect": "在自由曲面上得到分布均勻的點，可作為開孔或節點位置（注意 UV 變形需修正）。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "openFrameworks",
    "C++",
    "Delaunay",
    "開源"
   ],
   "tools": [
    "openFrameworks"
   ],
   "url": "https://github.com/mruegenberg/ofxPoissonDiskSampling",
   "image": {
    "file": "img/cases/E02-52.jpg",
    "w": 900,
    "h": 675,
    "source": "GitHub mruegenberg/ofxPoissonDiskSampling",
    "author": "Marcel Ruegenberg",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://github.com/mruegenberg/ofxPoissonDiskSampling",
    "note": "README 示範圖：Poisson 點的 Delaunay 三角網"
   }
  },
  {
   "id": "E02-53",
   "algo": "E02",
   "title": "poisson-disk-sampling（JavaScript 任意維度與變密度）",
   "creator": "Kevin Chapelier",
   "year": "2015",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Kevin Chapelier 維護的 JavaScript 函式庫（MIT 授權），以 Bridson 演算法支援任意維度取樣，並可傳入距離函式讓最小間距隨位置變化；線上示範用影像亮度控制點的疏密。基礎範例只有固定的 minDistance，這個函式庫示範了變密度與高維度兩種延伸。",
   "variations": [
    {
     "name": "變距離取樣",
     "how": "把固定 minDistance 改成 minDistance(x,y) 函式，例如依影像亮度在 minDist～maxDist 之間插值；網格邊長改用最小值 minDist/√2，檢查鄰格範圍則依最大值加大。",
     "effect": "點在暗部密、亮部疏，形成漸層網點。"
    },
    {
     "name": "推廣到 3D",
     "how": "把網格改成 int[,,]，候選點改在球殼（r～2r）內取樣，並檢查 5×5×5 鄰格。",
     "effect": "在體積內得到均勻散布的點，可作為 3D Voronoi 或空間桁架的節點。"
    },
    {
     "name": "逐步產生動畫",
     "how": "每次只從活躍名單取一個點處理，把目前結果輸出後再繼續下一步。",
     "effect": "可以看到點從種子向外擴散填滿的過程。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "JavaScript",
    "開源",
    "變密度",
    "3D"
   ],
   "tools": [
    "JavaScript"
   ],
   "url": "https://github.com/kchapelier/poisson-disk-sampling",
   "image": {
    "file": "img/cases/E02-53.jpg",
    "w": 500,
    "h": 200,
    "source": "GitHub kchapelier/poisson-disk-sampling",
    "author": "Kevin Chapelier",
    "license": "MIT",
    "license_url": "https://github.com/kchapelier/poisson-disk-sampling",
    "page": "https://github.com/kchapelier/poisson-disk-sampling",
    "note": "README 示範圖：Poisson 取樣點分布"
   }
  },
  {
   "id": "E02-54",
   "algo": "E02",
   "title": "Fast Poisson Disk Sampling in Processing（2D／3D 動畫）",
   "creator": "Nikolai Janakiev",
   "year": "2017",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "以 Processing 實作 Bridson 論文的 Poisson 圓盤取樣（MIT 授權），同時提供 2D 與 3D 版本，並把「活躍點」與「已確定的點」用不同方式畫出來做成動畫。基礎範例只輸出最終點位，這個作品把演算法的生長過程本身變成可觀看的視覺。",
   "variations": [
    {
     "name": "顯示活躍名單",
     "how": "另外輸出目前 active list 裡的點（用不同顏色），並以 Slider 控制已執行的步數。",
     "effect": "清楚看出取樣前緣如何向外推進，適合講解演算法。"
    },
    {
     "name": "3D 空間取樣",
     "how": "把平面網格改成立體網格，候選點改在 3D 球殼內取樣。",
     "effect": "在體積內撒出均勻點雲，可接 3D Voronoi 做多孔構造。"
    },
    {
     "name": "點轉成實體",
     "how": "把每個點替換成直徑略小於 minDistance 的球或柱。",
     "effect": "得到不互相碰撞、分布均勻的構件陣列。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "Processing",
    "動畫",
    "3D",
    "開源"
   ],
   "tools": [
    "Processing"
   ],
   "url": "https://github.com/njanakiev/poisson-disk-sampling",
   "image": {
    "file": "img/cases/E02-54.jpg",
    "w": 600,
    "h": 600,
    "source": "GitHub njanakiev/poisson-disk-sampling",
    "author": "Nikolai Janakiev",
    "license": "MIT",
    "license_url": "https://github.com/njanakiev/poisson-disk-sampling",
    "page": "https://github.com/njanakiev/poisson-disk-sampling",
    "note": "README 2D 動畫的最後一格：完成的 Poisson 點分布"
   }
  },
  {
   "id": "E02-55",
   "algo": "E02",
   "title": "[Unity] Procedural Object Placement（E01: poisson disc sampling）",
   "creator": "Sebastian Lague",
   "year": "2018",
   "category": "urban-landscape",
   "categories_extra": [
    "modeling"
   ],
   "scale": "地景",
   "summary": "Sebastian Lague 在 Unity（C#）中依 Bridson 論文實作 Poisson 圓盤取樣，目的是在遊戲場景裡擺放物件，使物件彼此保持最小距離又不顯得規則。和 Grasshopper C# 基礎範例語言相同，但應用從「畫點」轉成「放置場景物件」，很適合對照到地景配置。",
   "variations": [
    {
     "name": "點轉成植栽配置",
     "how": "在每個 Poisson 點放置樹木或灌木的 Block，並依種類設定不同的 minDistance。",
     "effect": "得到自然、不排排站的植栽分布。"
    },
    {
     "name": "限制在指定區域內",
     "how": "候選點除了要在矩形內，還要通過 Curve.Contains 檢查，只在基地邊界曲線內部收下。",
     "effect": "點只落在基地、草坪或廣場範圍內。"
    },
    {
     "name": "多種物件分層取樣",
     "how": "先用較大的 minDistance 放大樹，再以較小的間距放小樹，並同時檢查與前一層的距離。",
     "effect": "形成大、中、小物件交錯的層次。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "Unity",
    "C#",
    "遊戲",
    "程序化生成"
   ],
   "tools": [
    "Unity"
   ],
   "url": "https://www.youtube.com/watch?v=7WcmyxyFO7o",
   "image": {
    "file": "img/cases/E02-55.jpg",
    "w": 480,
    "h": 360,
    "source": "YouTube（Sebastian Lague）",
    "author": "Sebastian Lague",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.youtube.com/watch?v=7WcmyxyFO7o",
    "note": "影片縮圖：Poisson disc sampling 標題與取樣點"
   }
  },
  {
   "id": "E03-01",
   "algo": "E03",
   "title": "北京國家游泳中心（水立方）",
   "creator": "PTW Architects、Arup、CSCEC",
   "year": "2008",
   "category": "3d-architecture",
   "categories_extra": [
    "performance"
   ],
   "scale": "建築",
   "summary": "以 Weaire-Phelan 泡沫（兩種多面體組成、表面積極小的空間分割）為原型，將 3D 陣列旋轉後以建築外框切割，得到看似隨機的立面；約 22,000 根鋼構件與 4,000 片 ETFE 氣枕。它是規則的泡沫結構，而非隨機 Voronoi，但與 3D Voronoi／CVT 同屬「細胞分割空間」的概念，是最常被拿來對照的案例。",
   "variations": [
    {
     "name": "3D 規則點陣＋旋轉切割",
     "how": "把撒點改成 3D 週期點陣（例如 BCC/A15 類排列），做 3D Voronoi（中垂面切 Box），再把整組細胞旋轉後用建築外框 Brep 切割。",
     "effect": "內部規則、切面看似隨機的泡泡立面。"
    },
    {
     "name": "3D Lloyd 均勻化泡泡",
     "how": "3D 版本中每輪以 VolumeMassProperties 求細胞體積重心並移動點。",
     "effect": "近似等體積泡泡，逼近泡沫最小表面積的外觀。"
    },
    {
     "name": "細胞面轉 ETFE 氣枕",
     "how": "把立面切出的每個多邊形向外沿法向做膨脹（例如以 Kangaroo 充氣或簡單抬高中心點成網格）。",
     "effect": "可視化氣枕外皮，並統計面板種類與尺寸。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "拼貼",
    "最佳化"
   ],
   "tools": [
    "MicroStation",
    "Bentley Structural"
   ],
   "url": "https://www.arup.com/en-us/projects/national-aquatics-center-water-cube"
  },
  {
   "id": "E03-02",
   "algo": "E03",
   "title": "On the Disappearance of Clouds（威尼斯雙年展）",
   "creator": "Tomás Saraceno",
   "year": "2019",
   "category": "art-installation",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "第 58 屆威尼斯雙年展的漂浮雕塑，由受 Weaire-Phelan 泡沫幾何啟發的叢集多面體組成。展示「泡沫細胞分割」如何變成可以組裝的空間雕塑。",
   "variations": [
    {
     "name": "局部叢集取樣",
     "how": "做 3D Voronoi 後只保留距離某條曲線或某群吸引子一定範圍內的細胞。",
     "effect": "從整塊泡沫中挖出漂浮的雲狀叢集。"
    },
    {
     "name": "細胞邊轉桿件",
     "how": "取 3D 細胞的邊線去重後做 Pipe，節點用球接頭。",
     "effect": "可組裝的輕量框架雕塑。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "拼貼"
   ],
   "tools": [],
   "url": "https://studiotomassaraceno.org/on-the-disappearance-of-clouds/"
  },
  {
   "id": "E03-03",
   "algo": "E03",
   "title": "Let's Join：Weaire-Phelan 空間鑲嵌展亭",
   "creator": "Nexus Network Journal 論文作者群",
   "year": "2021",
   "category": "3d-architecture",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "建築",
   "summary": "以 Weaire-Phelan 空間鑲嵌實際建造的人體尺度展亭，論文討論如何把理論上略彎的極小曲面細胞以平面多面體近似、並轉成可施工構件。",
   "variations": [
    {
     "name": "多面體平面化",
     "how": "3D 細胞的每個面以最小平方平面（Plane.FitPlaneToPoints）投影，確保可用平板製作。",
     "effect": "可用平板切割組裝的細胞展亭。"
    },
    {
     "name": "構件分類統計",
     "how": "依面的邊數與邊長分組計數（Dictionary），輸出每種板片的數量。",
     "effect": "評估模組化程度與製造成本。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "拼貼"
   ],
   "tools": [],
   "url": "https://link.springer.com/article/10.1007/s00004-020-00544-7"
  },
  {
   "id": "E03-04",
   "algo": "E03",
   "title": "Voronoi Shelf（大理石層架）",
   "creator": "Marc Newson",
   "year": "2006",
   "category": "fabrication",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "以單一塊 Carrara 大理石用 CNC 石材銑削挖出 Voronoi 細胞格架，版次 8 件。平面 Voronoi 直接成為家具的結構格線，是「細胞縮孔→CNC」的經典例子。",
   "variations": [
    {
     "name": "縮孔圓角 → CNC 刀路",
     "how": "每個細胞做 Offset（壁厚一半）＋ Fillet（半徑 ≥ 刀具半徑），輸出封閉曲線當挖槽邊界。",
     "effect": "可直接銑削的格架，壁厚一致。"
    },
    {
     "name": "少量 Lloyd 保留自然感",
     "how": "iterations 設 1–3，並限制最小細胞面積（太小就刪點重跑）。",
     "effect": "介於隨機與蜂巢之間、又能放物品的格子尺寸。"
    },
    {
     "name": "底部加厚",
     "how": "依細胞中心高度（y）調整 Offset 距離，下方壁厚、上方壁薄。",
     "effect": "視覺上有承重感的漸變格架。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "可重現種子",
    "拼貼"
   ],
   "tools": [
    "CNC"
   ],
   "url": "https://marc-newson.com/voronoi-shelf/"
  },
  {
   "id": "E03-05",
   "algo": "E03",
   "title": "Radiolaria 首飾系列",
   "creator": "Nervous System",
   "year": "2007",
   "category": "fabrication",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "以放射蟲與植物細胞為靈感的演算法首飾，用蝕刻不鏽鋼與雷切矽膠製作，細胞圖樣在方向與尺度上漸變。Nervous System 也把生成器做成線上 app 讓使用者自行設計。",
   "variations": [
    {
     "name": "非等向細胞（橢圓化）",
     "how": "在 KeepCloserSide 的距離判斷前先把座標乘上縮放矩陣（x 方向 ×k），做完再縮回。",
     "effect": "沿某方向拉長的細胞，產生流動與張力感。"
    },
    {
     "name": "尺度漸變",
     "how": "撒點密度用沿曲線的距離場控制，再做少量 Lloyd。",
     "effect": "由密到疏的細胞帶，適合手環或項鍊。"
    },
    {
     "name": "互動式生成器",
     "how": "把 seed、pointCount、吸引子做成 Slider，輸出即時預覽的縮孔細胞。",
     "effect": "讓使用者自己調出一件作品。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "吸引子控制",
    "隨機"
   ],
   "tools": [],
   "url": "https://n-e-r-v-o-u-s.com/projects/albums/radiolaria/"
  },
  {
   "id": "E03-06",
   "algo": "E03",
   "title": "Voronoi Wall：3D 列印混凝土綠牆",
   "creator": "Saxion Industrial Design Research Group、De Witte van der Heijden Architecten、Vertico",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "立面／表皮",
   "summary": "荷蘭 Twente 地區第一件 3D 列印混凝土構造物，以參數化 Voronoi 切出每塊形狀都不同的構件，限制每塊須放得進棧板、重量低於 50 公斤，讓兩個人就能堆疊組裝，並作為植栽綠牆。",
   "variations": [
    {
     "name": "尺寸約束的鬆弛",
     "how": "Lloyd 迴圈中檢查每個細胞外接框，超過棧板尺寸就在該細胞內加點、太小就刪點，再繼續鬆弛。",
     "effect": "所有構件都在可運輸、可搬運的範圍內。"
    },
    {
     "name": "細胞擠出成植栽盒",
     "how": "縮孔後做向內 Offset 當壁厚，Extrude 出深度，並依位置決定哪些細胞留作植栽穴。",
     "effect": "可 3D 列印、可種植的牆體單元。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "約束滿足",
    "拼貼"
   ],
   "tools": [
    "Grasshopper",
    "3D 混凝土列印"
   ],
   "url": "https://www.vertico.com/projects/voronoi-wall"
  },
  {
   "id": "E03-07",
   "algo": "E03",
   "title": "Adaptive Voronoi Facade（光感應動態立面）",
   "creator": "諾維薩德大學 Digital Techniques, Design and Production 課程",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "立面／表皮",
   "summary": "立面開孔由點分布產生的 Voronoi 細胞決定，構件會依光線強度移動，調整進入室內的光量，外觀類似細胞組織。",
   "variations": [
    {
     "name": "日照量控制開孔率",
     "how": "以每個細胞中心的日照值（例如 Ladybug 分析結果）決定 Offset 比例，日照越強開孔越小。",
     "effect": "依環境性能調整的漸變開孔。"
    },
    {
     "name": "動態開合動畫",
     "how": "Timer 驅動時間參數 t，開孔比例 = f(太陽角度, t)。",
     "effect": "模擬一天中立面開合的動畫。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "吸引子控制",
    "動畫",
    "Timer"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://www.arhns.uns.ac.rs/digital/adaptive-voronoi-facade/"
  },
  {
   "id": "E03-08",
   "algo": "E03",
   "title": "Upsilon Pavilion：木構 Voronoi 殼體",
   "creator": "",
   "year": "",
   "category": "3d-architecture",
   "categories_extra": [
    "performance",
    "fabrication"
   ],
   "scale": "建築",
   "summary": "以 Voronoi 細胞邊作為木梁的殼體展亭，梁件以 CNC 製造；最佳化後用料約減少 12.9%，結構能力大致維持。示範曲面上 Voronoi 如何轉成構件並最佳化。",
   "variations": [
    {
     "name": "曲面 UV 上 Voronoi＋Lloyd",
     "how": "在殼體曲面 UV 域做 Voronoi 與 Lloyd，再以 Surface.PointAt 映射回 3D。",
     "effect": "包覆殼體、長度較平均的梁網。"
    },
    {
     "name": "梁長分布最佳化",
     "how": "Lloyd 之後統計邊長標準差，加上對過短邊的點合併規則，重複到標準差低於門檻。",
     "effect": "構件種類與極端長度減少，利於製造。"
    },
    {
     "name": "依應力調密度",
     "how": "以結構分析得到的應力值當加權 Lloyd 的密度場。",
     "effect": "受力大處細胞小、梁多；受力小處省料。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "曲面上",
    "最佳化",
    "3D"
   ],
   "tools": [
    "CNC"
   ],
   "url": "https://www.researchgate.net/figure/The-Upsilon-pavilion-as-a-timber-Voronoi-shell_fig7_338584125"
  },
  {
   "id": "E03-09",
   "algo": "E03",
   "title": "Weighted Voronoi Stippling（加權 Voronoi 點描）",
   "creator": "Adrian Secord",
   "year": "2002",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "NPAR 2002 論文，以灰階影像為密度的加權重心 Voronoi 迭代產生點描畫，點的疏密呈現明暗、又避免規則格或團塊的瑕疵。是 Lloyd 鬆弛在繪圖上最經典的應用。",
   "variations": [
    {
     "name": "影像亮度加權重心",
     "how": "AreaCenter 改成在細胞內以網格取樣，權重 = 1 − 亮度，求 Σw·p / Σw。",
     "effect": "暗處點聚集、亮處稀疏的點描。"
    },
    {
     "name": "點大小也隨亮度",
     "how": "輸出時每點畫圓，半徑依所在處暗度調整。",
     "effect": "更強的明暗對比，可直接給繪圖機或雷雕。"
    },
    {
     "name": "點連成單筆路徑",
     "how": "對最終點位做最近鄰貪婪連線（TSP 近似）。",
     "effect": "一筆畫藝術，適合筆式繪圖機。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "影像輸入",
    "收斂",
    "最佳化"
   ],
   "tools": [],
   "url": "https://www.cs.ubc.ca/labs/imager/tr/2002/secord2002b/"
  },
  {
   "id": "E03-10",
   "algo": "E03",
   "title": "多層級 Voronoi 晶格骨支架",
   "creator": "ACS Biomaterials Science & Engineering 論文作者群",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "以週期排列的 Voronoi 單元設計積層製造的骨支架，用多面體體積與兩個縮放因子控制局部細胞形狀，使力學性質接近骨骼。說明 3D Voronoi 在仿生輕量結構的用途。",
   "variations": [
    {
     "name": "3D 細胞邊 → 桿件晶格",
     "how": "3D Voronoi 細胞邊線去重後做 Pipe 或 MultiPipe，桿徑依細胞大小調整。",
     "effect": "可 3D 列印的仿海綿骨晶格。"
    },
    {
     "name": "密度梯度",
     "how": "3D 撒點時以到外表面的距離決定機率，外層密、內層疏，再做少量 3D Lloyd。",
     "effect": "外硬內輕的梯度材料。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "物理模擬",
    "最佳化"
   ],
   "tools": [],
   "url": "https://pubs.acs.org/doi/10.1021/acsbiomaterials.1c01482"
  },
  {
   "id": "E03-11",
   "algo": "E03",
   "title": "Voronoi 多孔晶格結構的參數化設計",
   "creator": "Materials & Design 論文作者群",
   "year": "2020",
   "category": "modeling",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "提出以參數控制 Voronoi 晶格多孔結構的建模方法，讓孔隙率與細胞規則度可被調整，供積層製造使用。對應基礎範例「點分布 → 細胞 → 實體化」的建模流程。",
   "variations": [
    {
     "name": "規則度滑桿",
     "how": "起始點 = 規則格點 + 隨機擾動 × irregularity（0–1），再做 iterations 次 Lloyd。",
     "effect": "從完全規則到完全隨機連續調整的多孔結構。"
    },
    {
     "name": "孔隙率控制",
     "how": "縮孔 Offset 距離由目標孔隙率反推（總面積 × 比例），迭代微調到誤差內。",
     "effect": "可指定開孔率的面板或晶格。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "隨機",
    "可重現種子"
   ],
   "tools": [],
   "url": "https://www.sciencedirect.com/science/article/pii/S0264127520301416"
  },
  {
   "id": "E03-12",
   "algo": "E03",
   "title": "Cellular Topology Optimization on Differentiable Voronoi Diagrams",
   "creator": "arXiv 論文作者群",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "modeling"
   ],
   "scale": "構件",
   "summary": "把 Voronoi 細胞結構做成可微分的形式，讓點位能被結構最佳化直接調整，得到兼具細胞外觀與力學性能的結構。可看成 Lloyd「移動點」的延伸：移動方向改由結構目標決定。",
   "variations": [
    {
     "name": "目標函數驅動的點移動",
     "how": "把 Lloyd 的「移到重心」換成「朝降低某指標的方向移一小步」，例如細胞面積與目標值差的平方和。",
     "effect": "由性能目標決定的細胞配置。"
    },
    {
     "name": "混合 Lloyd",
     "how": "新位置 = α·重心 + (1−α)·最佳化方向步，α 為輸入參數。",
     "effect": "兼顧均勻外觀與性能需求。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "最佳化",
    "收斂"
   ],
   "tools": [],
   "url": "https://arxiv.org/pdf/2204.10313"
  },
  {
   "id": "E03-13",
   "algo": "E03",
   "title": "PowerDiagrams：Grasshopper 加權 Voronoi 外掛",
   "creator": "Daniel Abalde",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "開源的 Grasshopper 2D 加權 Voronoi／Power diagram 元件，也能輸出最小生成樹、相對鄰域圖等結構，處理退化情形。可作為自寫版本的對照與延伸。",
   "variations": [
    {
     "name": "自寫 Power diagram",
     "how": "KeepCloserSide 的判斷式改成比較 |x−p|² − r²，並把中點改成依權重偏移的分界點。",
     "effect": "細胞大小可由半徑指定，分界仍是直線。"
    },
    {
     "name": "輸出鄰接圖",
     "how": "記錄每條切出邊對應的鄰點，建立 site 間連線（Delaunay 對偶），再取最小生成樹。",
     "effect": "由細胞導出的動線或結構骨架。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "鄰居搜尋",
    "自訂 class"
   ],
   "tools": [
    "Grasshopper",
    "C#"
   ],
   "url": "https://github.com/DanielAbalde/PowerDiagrams"
  },
  {
   "id": "E03-14",
   "algo": "E03",
   "title": "埃及 Qena 市公共服務的演算法空間規劃",
   "creator": "arXiv 論文作者群",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "performance"
   ],
   "scale": "群體／都市",
   "summary": "以演算法方法評估城市公共服務設施的分布，Voronoi 常用來劃出每個設施的服務範圍，檢查是否有覆蓋不足的區域。對應 Lloyd「把設施移到服務區重心」的資源配置意義（CVT 原論文也列出資源分配應用）。",
   "variations": [
    {
     "name": "人口加權 Lloyd 選址",
     "how": "以人口密度網格當加權重心的權重，每輪把設施點移到加權重心。",
     "effect": "近似最小化平均步行距離的設施配置。"
    },
    {
     "name": "固定點＋可移動點",
     "how": "新增 bool 清單標記既有設施不動，只移動新增設施。",
     "effect": "在既有都市條件下找新設施的建議位置。"
    },
    {
     "name": "服務區面積警示",
     "how": "細胞面積或人口總和超過門檻就改顏色輸出。",
     "effect": "視覺化服務不足區域。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "最佳化",
    "收斂",
    "影像輸入"
   ],
   "tools": [],
   "url": "https://arxiv.org/pdf/2512.06431"
  },
  {
   "id": "E03-15",
   "algo": "E03",
   "title": "景觀建築的生成式設計（Voronoi 鋪面與分區）",
   "creator": "Digital Landscape Architecture 2022 論文作者",
   "year": "2022",
   "category": "urban-landscape",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "地景",
   "summary": "數位景觀建築研討會論文，探討以生成式方法產生景觀配置；Voronoi 在景觀中常用於鋪面分割、植栽分區與廣場圖樣，可在短時間產生多種鋪面方案比較。",
   "variations": [
    {
     "name": "鋪面石材尺寸控制",
     "how": "Lloyd 後檢查細胞最長邊，超過石材最大尺寸就在細胞內加點再鬆弛。",
     "effect": "每塊石材都在可取得尺寸內的自然鋪面。"
    },
    {
     "name": "沿步道漸變",
     "how": "以步道中心線為吸引曲線（Curve.ClosestPoint 距離）控制點密度。",
     "effect": "步道上細碎、兩側草地中較大的過渡鋪面。"
    },
    {
     "name": "細胞分區上色",
     "how": "依細胞中心的地形高度或排水方向指定材料類別（硬鋪、草、礫石）。",
     "effect": "兼顧排水與使用的景觀分區圖。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "吸引子控制",
    "拼貼",
    "約束滿足"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://gispoint.de/fileadmin/user_upload/paper_gis_open/DLA_2022/537724058.pdf"
  },
  {
   "id": "E03-51",
   "algo": "E03",
   "title": "Coding Challenge 181：Weighted Voronoi Stippling",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2024",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "Daniel Shiffman 用 p5.js 搭配 d3-delaunay 套件，從 Delaunay 三角化與 Voronoi 圖講起，逐步實作 Lloyd 鬆弛，再把重心改成「以影像暗度加權的重心」，做出點描肖像。基礎範例的 Lloyd 用的是細胞的幾何面積重心，這裡則把影像當成密度場，讓點聚集到暗部。",
   "variations": [
    {
     "name": "加權重心",
     "how": "計算細胞重心時，對細胞內的取樣點以影像暗度（1 − 亮度）加權平均，而非用鞋帶公式算幾何重心。",
     "effect": "點往暗部聚集，數次迭代後形成點描影像。"
    },
    {
     "name": "點大小隨暗度變化",
     "how": "最後輸出時，依點所在位置的暗度設定圓半徑。",
     "effect": "加強明暗對比，也能對應成穿孔板的孔徑。"
    },
    {
     "name": "迭代中逐步移動",
     "how": "每次只把點往重心移動一部分（例如 10%）而非直接跳到重心。",
     "effect": "動畫更平滑，並可在任何時刻停下取得中間狀態。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "p5.js",
    "d3.js",
    "點描",
    "影像處理"
   ],
   "tools": [
    "p5.js",
    "d3.js"
   ],
   "url": "https://thecodingtrain.com/challenges/181-image-stippling",
   "image": {
    "file": "img/cases/E03-51.jpg",
    "w": 900,
    "h": 506,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/181-image-stippling",
    "note": "頁面預覽圖：加權 Voronoi 點描肖像"
   }
  },
  {
   "id": "E03-52",
   "algo": "E03",
   "title": "Voronoi edges（精確 Voronoi 邊界著色器）",
   "creator": "Inigo Quilez",
   "year": "2012",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "立面／表皮",
   "summary": "Inigo Quilez 的文章與 Shadertoy 範例，用 GLSL 片段著色器逐像素計算 Voronoi：一般 F2−F1 近似會讓細胞邊線粗細不均，他改用第二輪搜尋算出到細胞邊界的真正距離，得到線寬一致、等距線正確的程序化 Voronoi 紋理。與基礎範例用半平面切出多邊形不同，這裡從「每個像素找最近點」的角度計算，而且完全在 GPU 上即時執行。",
   "variations": [
    {
     "name": "逐點查詢距離場",
     "how": "對一組取樣點（例如表面上的格點）計算到最近與次近 site 的距離，並求到兩者垂直平分線的距離。",
     "effect": "得到可用於厚度、顏色或凹凸的距離場，而不只是細胞外框。"
    },
    {
     "name": "等寬邊框",
     "how": "以「到邊界距離 < 固定值」判定是否為邊框，取代 Polyline 偏移。",
     "effect": "所有細胞框的寬度一致，適合轉成雷射切割的格柵。"
    },
    {
     "name": "網格加速",
     "how": "把 site 放在規則格子裡（每格一點並加隨機偏移），查詢時只看鄰近 3×3 格。",
     "effect": "點數很多時也能快速計算，延伸至無限平鋪的紋理。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "GLSL",
    "Shadertoy",
    "著色器",
    "程序化紋理"
   ],
   "tools": [
    "GLSL",
    "Shadertoy"
   ],
   "url": "https://iquilezles.org/articles/voronoilines/",
   "image": {
    "file": "img/cases/E03-52.jpg",
    "w": 400,
    "h": 343,
    "source": "Inigo Quilez 個人網站",
    "author": "Inigo Quilez",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://iquilezles.org/articles/voronoilines/",
    "note": "文章插圖：以著色器算出的 Voronoi 細胞與邊界"
   }
  },
  {
   "id": "E03-53",
   "algo": "E03",
   "title": "The Book of Shaders 第 12 章：Cellular Noise",
   "creator": "Patricio Gonzalez Vivo、Jen Lowe",
   "year": "2015",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "立面／表皮",
   "summary": "The Book of Shaders 的細胞雜訊章節，從 Steven Worley 的 cellular texture 講起，用 GLSL 在網格中每格放一點、只檢查鄰近 9 格，最後導出 Voronoi 演算法並延伸到 Gustavson 的優化與 Quilez 的精確邊界。書中可直接在網頁上修改並即時預覽。與基礎範例的多邊形 Voronoi 相比，它把 Voronoi 當成連續的「距離場」來上色。",
   "variations": [
    {
     "name": "顯示最近距離場",
     "how": "對平面上的格點計算到最近 site 的距離，並以灰階或色帶上色。",
     "effect": "看到每顆細胞由中心向外漸變的圖樣，類似細胞或龜裂地面。"
    },
    {
     "name": "以 site 編號上色",
     "how": "記錄每個取樣點最近的 site 是哪一個，依編號給顏色。",
     "effect": "得到色塊拼貼，可對應材料分區。"
    },
    {
     "name": "site 隨時間移動",
     "how": "讓 site 依正弦函數或 Lloyd 迭代緩慢移動，每幀重新計算。",
     "effect": "細胞會流動、呼吸，適合動態立面或投影。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "GLSL",
    "著色器",
    "雜訊",
    "教學"
   ],
   "tools": [
    "GLSL"
   ],
   "url": "https://thebookofshaders.com/12/",
   "image": {
    "file": "img/cases/E03-53.jpg",
    "w": 480,
    "h": 183,
    "source": "The Book of Shaders",
    "author": "Patricio Gonzalez Vivo、Jen Lowe",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thebookofshaders.com/12/",
    "note": "章節插圖（GIF 第一格）：著色器產生的 Voronoi 細胞與距離場"
   }
  },
  {
   "id": "E03-54",
   "algo": "E03",
   "title": "ofxVoronoi（openFrameworks Voronoi 與 Lloyd 鬆弛外掛）",
   "creator": "Matthias Esterl、Todd Vanderlin 等",
   "year": "2015",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "openFrameworks 的 Voronoi 外掛，使用 Voro++ 中改寫的 Fortune 掃描線演算法產生 2D Voronoi 圖；2015 年加入 relax() 方法，可反覆執行 Lloyd 鬆弛，讓細胞變得均勻，README 也提到可用於點描效果。基礎範例用 O(n²) 半平面切割自行計算，這裡則示範採用較快的掃描線演算法，並把鬆弛包成一行呼叫。",
   "variations": [
    {
     "name": "只做少數次鬆弛",
     "how": "把 iterations 設為 1～3，並依次輸出各次的結果。",
     "effect": "細胞保有一些大小差異卻不再極端，介於隨機與蜂巢之間。"
    },
    {
     "name": "圓形邊界",
     "how": "把起始的矩形改成近似圓的多邊形（例如 64 邊形）作為每個細胞的初始範圍。",
     "effect": "得到圓盤內的 Voronoi，可做圓形天花或廣場鋪面。"
    },
    {
     "name": "換成更快的 Voronoi",
     "how": "點數超過數百時，把自製半平面切割改成呼叫 Grasshopper 內建 Voronoi，只保留 Lloyd 迴圈。",
     "effect": "可以處理上千個細胞並保持互動速度。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "openFrameworks",
    "C++",
    "開源",
    "Lloyd 鬆弛"
   ],
   "tools": [
    "openFrameworks"
   ],
   "url": "https://github.com/madc/ofxVoronoi",
   "image": {
    "file": "img/cases/E03-54.jpg",
    "w": 900,
    "h": 715,
    "source": "GitHub madc/ofxVoronoi",
    "author": "Matthias Esterl 等",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://github.com/madc/ofxVoronoi",
    "note": "README 截圖：圓形範圍內的 Voronoi 圖"
   }
  },
  {
   "id": "E03-55",
   "algo": "E03",
   "title": "Lloyd’s Relaxation（d3.js 互動示範）",
   "creator": "Jason Davies",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Jason Davies 用 d3.js 在畫布上即時展示 Lloyd 鬆弛：1000 個點一開始擠在滑鼠點擊處，每一步計算 Voronoi 後把點移到細胞重心，直到總位移小於門檻才停；每次點擊會換一組色調重新開始。基礎範例從均勻隨機分布出發，這裡刻意從「全部擠在一點」開始，讓擴散與收斂過程更戲劇化。",
   "variations": [
    {
     "name": "從單點出發",
     "how": "起始點不在整個矩形內隨機撒，而是全部放在同一點附近（加上極小亂數）。",
     "effect": "可以看到細胞從中心爆開、逐漸鋪滿畫面的過程。"
    },
    {
     "name": "以位移量判斷收斂",
     "how": "每輪計算所有點移動距離的總和，小於門檻就停止，並輸出實際迭代次數。",
     "effect": "不必猜 iterations，得到可比較的收斂速度。"
    },
    {
     "name": "依距離上色",
     "how": "以細胞到起始點的距離決定填色明暗。",
     "effect": "畫面出現同心放射的色彩層次，突顯生長方向。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "d3.js",
    "JavaScript",
    "互動",
    "動畫"
   ],
   "tools": [
    "d3.js"
   ],
   "url": "https://www.jasondavies.com/lloyd/",
   "image": {
    "file": "img/cases/E03-55.jpg",
    "w": 460,
    "h": 400,
    "source": "Jason Davies 個人網站",
    "author": "Jason Davies",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.jasondavies.com/lloyd/",
    "note": "作品縮圖：Lloyd 鬆弛後由中心擴散的 Voronoi 細胞"
   }
  },
  {
   "id": "E04-01",
   "algo": "E04",
   "title": "慕尼黑奧林匹克體育場索網屋頂",
   "creator": "Frei Otto、Günter Behnisch、Fritz Leonhardt",
   "year": "1972",
   "category": "performance",
   "categories_extra": [
    "3d-architecture",
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "以桅杆吊起的預力鋼索網屋頂，覆蓋體育場與奧林匹克公園。先用大型實體模型找形，再由 Argyris、Linkwitz 等人以迭代電腦計算求出索長與節點位置，是電腦找形的里程碑。",
   "variations": [
    {
     "name": "預力索網",
     "how": "gravity 設 0，RestLength 乘 0.3 左右讓彈簧只想縮短；錨點改成數根高桅杆頂點加地面邊緣點。",
     "effect": "得到多個馬鞍形索網連成的起伏屋頂。"
    },
    {
     "name": "邊索（edge cable）",
     "how": "邊界不再全固定，改為沿邊界另建一組 stiffness 較大的彈簧，只固定邊索端點。",
     "effect": "邊界向內彎成弧形，形成典型帳篷屋頂的扇貝邊。"
    },
    {
     "name": "索長輸出",
     "how": "收斂後輸出每條彈簧長度與編號，做成索料清單。",
     "effect": "從形狀直接得到可施工的下料資訊。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "物理模擬",
    "收斂",
    "3D"
   ],
   "tools": [
    "實體模型",
    "早期電腦找形"
   ],
   "url": "https://www.sbp.de/en/project/roof-for-munich-olympic-stadium-1972/"
  },
  {
   "id": "E04-02",
   "algo": "E04",
   "title": "曼海姆多功能廳 Multihalle 木格殼",
   "creator": "Frei Otto、Carlfried Mutschler",
   "year": "1975",
   "category": "3d-architecture",
   "categories_extra": [
    "performance",
    "fabrication"
   ],
   "scale": "建築",
   "summary": "被視為世界最大木格殼之一，形狀以懸垂鏈網模型找出後倒轉，再由 Klaus Linkwitz 以攝影測量轉成數位模型。本範例的「網＋重力＋倒轉」正是其找形原理。",
   "variations": [
    {
     "name": "等距格網",
     "how": "彈簧原長全部相等且 stiffness 很大，模擬等長木條；只在不規則邊界上固定質點。",
     "effect": "得到可由等距木條彎成的格殼形。"
    },
    {
     "name": "任意平面輪廓",
     "how": "用曲線輸入邊界，只保留落在曲線內的格點，邊界點固定。",
     "effect": "得到像 Multihalle 那樣自由平面的連續殼。"
    },
    {
     "name": "雙層格柵輸出",
     "how": "收斂後沿法向量偏移出第二層線段。",
     "effect": "呈現多層木條交疊的格殼構造。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "物理模擬",
    "3D",
    "收斂"
   ],
   "tools": [
    "懸垂鏈模型",
    "攝影測量"
   ],
   "url": "https://mannheim-multihalle.de/en/architecture/"
  },
  {
   "id": "E04-03",
   "algo": "E04",
   "title": "古埃爾紡織村教堂（Colònia Güell）懸垂模型",
   "creator": "Antoni Gaudí",
   "year": "1898–1908",
   "category": "3d-architecture",
   "categories_extra": [
    "performance"
   ],
   "scale": "建築",
   "summary": "Gaudí 用繩子與裝鉛的小袋做成倒吊的多重懸垂模型，拍照後翻轉描繪，得到只受壓的拱與柱。這是物理版的動態鬆弛：讓重力把繩子拉到平衡，再倒過來。",
   "variations": [
    {
     "name": "只用鏈（1D）",
     "how": "只建一串串彈簧（不連成網），不同鏈共用某些節點，錨點在上方。",
     "effect": "得到多條互相牽連的懸垂拱，重現多重懸垂模型。"
    },
    {
     "name": "節點加重",
     "how": "給特定質點額外的重力倍率，模擬掛上的鉛袋。",
     "effect": "鏈在加重處形成折點，對應教堂上方的載重位置。"
    },
    {
     "name": "倒轉輸出",
     "how": "gravity 設負值跑完後，把所有 Z 取負再輸出。",
     "effect": "直接看到『倒過來的教堂』。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "物理模擬",
    "3D"
   ],
   "tools": [
    "懸垂模型",
    "攝影"
   ],
   "url": "https://dataphys.org/list/gaudis-hanging-chain-models/"
  },
  {
   "id": "E04-04",
   "algo": "E04",
   "title": "Deitingen 南服務區薄殼",
   "creator": "Heinz Isler",
   "year": "1968",
   "category": "performance",
   "categories_extra": [
    "fabrication",
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "Isler 以「倒吊的布」找形：把浸濕的布掛在少數支點上、凍結後倒轉，得到只受壓的混凝土薄殼。Deitingen 服務區兩片三點支撐的殼是其代表作。",
   "variations": [
    {
     "name": "三點支撐",
     "how": "只固定三個質點（例如兩角與對邊中點），其餘邊界自由。",
     "effect": "得到邊緣自由上揚、三點落地的 Isler 式殼。"
    },
    {
     "name": "自由邊加勁",
     "how": "自由邊界上的彈簧 stiffness 乘 3–5 倍。",
     "effect": "邊緣不會過度下垂，形成優雅的弧形邊緣。"
    },
    {
     "name": "布料剪裁",
     "how": "初始網格挖洞或切成不規則形再找形。",
     "effect": "探索 Isler 大量實驗中不同的殼形家族。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "物理模擬",
    "3D"
   ],
   "tools": [
    "懸吊布模型",
    "石膏模型"
   ],
   "url": "https://en.wikipedia.org/wiki/Heinz_Isler"
  },
  {
   "id": "E04-05",
   "algo": "E04",
   "title": "Armadillo Vault 無砂漿石拱",
   "creator": "Block Research Group（ETH Zurich）、ODB Engineering、The Escobedo Group",
   "year": "2016",
   "category": "fabrication",
   "categories_extra": [
    "performance",
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "威尼斯建築雙年展展出的 399 塊石灰岩拱殼，跨距達 16 公尺，完全靠受壓自承、無砂漿無連接件。形狀以受壓平衡找形（Thrust Network Analysis）求得，再切分成可加工的石塊。",
   "variations": [
    {
     "name": "開口與拱腳",
     "how": "錨點只放在數個拱腳區，網格中挖出開口，gravity 為正。",
     "effect": "得到有大開口、數點落地的自由形受壓殼。"
    },
    {
     "name": "切成石塊",
     "how": "收斂後每個網格面沿法向量上下偏移成實體，每塊編號輸出。",
     "effect": "得到可 CNC 切割的石塊（voussoir）模型。"
    },
    {
     "name": "塊線對齊力流",
     "how": "依彈簧受力方向決定切分方向，使塊間接縫垂直於主壓力。",
     "effect": "接縫受力合理，模型更接近真實疊砌邏輯。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "收斂",
    "3D",
    "最佳化"
   ],
   "tools": [
    "RhinoVAULT",
    "Rhino",
    "CNC"
   ],
   "url": "https://www.dezeen.com/2016/05/31/armadillo-vault-block-research-group-eth-zurich-beyond-the-bending-limestone-structure-without-glue-venice-architecture-biennale-2016/"
  },
  {
   "id": "E04-06",
   "algo": "E04",
   "title": "NEST HiLo 索網模板混凝土屋頂",
   "creator": "Block Research Group、Architecture and Building Systems（ETH Zurich）",
   "year": "2021",
   "category": "fabrication",
   "categories_extra": [
    "performance",
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "雙曲率混凝土夾層殼屋頂，以可重複使用的張力索網加薄膜作為模板，直接在上面噴灑混凝土。索網形狀需透過找形計算，使索網受混凝土重量後仍能落在目標幾何上。",
   "variations": [
    {
     "name": "反向找形：目標形 → 索網預力",
     "how": "給定目標殼形，調整每條彈簧 RestLength 讓加上重力後的平衡形接近目標（迴圈外再包一層迭代修正）。",
     "effect": "求出索網該怎麼張才會在載重後變成想要的殼。"
    },
    {
     "name": "索網＋薄膜兩層",
     "how": "粗網用高 stiffness、細網用低 stiffness 並連到粗網節點。",
     "effect": "模擬索網支撐布膜的雙層模板行為。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "收斂",
    "最佳化",
    "3D"
   ],
   "tools": [
    "COMPAS",
    "Rhino"
   ],
   "url": "https://www.empa.ch/web/nest/hilo"
  },
  {
   "id": "E04-07",
   "algo": "E04",
   "title": "Striatus 3D 列印混凝土拱橋",
   "creator": "Block Research Group、Zaha Hadid Architects Computation and Design Group（ZHACODE）",
   "year": "2021",
   "category": "fabrication",
   "categories_extra": [
    "performance",
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "16×12 公尺的步行拱橋，由 53 塊 3D 列印混凝土塊乾式疊砌，無砂漿、無鋼筋。拱形為純受壓找形結果，列印層方向垂直於主壓力。",
   "variations": [
    {
     "name": "橋面拱",
     "how": "網格改成長條形，兩端短邊整排固定，gravity 為正。",
     "effect": "得到橋形受壓拱殼。"
    },
    {
     "name": "列印層方向",
     "how": "收斂後依每區彈簧受力方向產生垂直於力流的等高切片線。",
     "effect": "得到每塊的列印路徑方向示意。"
    },
    {
     "name": "分塊",
     "how": "沿網格行列每隔 k 格切出一塊並輸出成實體。",
     "effect": "得到可分塊列印、編號組裝的構件。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "收斂",
    "3D"
   ],
   "tools": [
    "COMPAS",
    "3D 混凝土列印"
   ],
   "url": "https://www.zaha-hadid.com/design/striatus/"
  },
  {
   "id": "E04-08",
   "algo": "E04",
   "title": "Thrust Network Analysis 與 RhinoVAULT",
   "creator": "Philippe Block、John Ochsendorf",
   "year": "2007",
   "category": "modeling",
   "categories_extra": [
    "performance"
   ],
   "scale": "建築",
   "summary": "以投影幾何與力圖（force diagram）的對偶關係，找出落在給定包絡內的純受壓推力網。與動態鬆弛同樣求平衡網，但改用圖解靜力學求解，後來發展成 RhinoVAULT 外掛。",
   "variations": [
    {
     "name": "只允許 Z 方向移動",
     "how": "每步更新時只更新 Position.Z，XY 保持平面圖不動。",
     "effect": "平面投影固定、只找高度，對應 TNA 的『平面形固定』假設。"
    },
    {
     "name": "力密度控制",
     "how": "把彈簧力改成 q × 向量長度（力密度法），不同邊給不同 q。",
     "effect": "調 q 就能讓殼局部變高或變平。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "收斂",
    "最佳化",
    "3D"
   ],
   "tools": [
    "RhinoVAULT",
    "Rhino"
   ],
   "url": "https://web.mit.edu/masonry/thrustNetwork/"
  },
  {
   "id": "E04-09",
   "algo": "E04",
   "title": "Kangaroo Physics（Grasshopper 物理引擎）",
   "creator": "Daniel Piker",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "performance",
    "art-installation"
   ],
   "scale": "物件",
   "summary": "Rhino 內建的即時物理／約束求解器，用來做找形、最佳化、平面化等。核心概念與本範例一樣：點、目標（彈簧、錨點、載重）、反覆求解到平衡。",
   "variations": [
    {
     "name": "Goal 化重構",
     "how": "把彈簧、重力、錨點各寫成一個 class，實作共同方法 Apply(particles)，主迴圈只呼叫所有 Goal。",
     "effect": "程式可擴充新約束，理解 Kangaroo 的架構。"
    },
    {
     "name": "加權平均投影",
     "how": "每個 Goal 算出點該去的位置，最後依權重取平均移動（不再用速度積分）。",
     "effect": "更穩定、不會爆炸，接近 Kangaroo2 的投影式求解。"
    },
    {
     "name": "互動拖曳",
     "how": "搭配 Timer，錨點位置由 Rhino 中可拖曳的點輸入。",
     "effect": "即時拉動錨點看網變形，做現場互動展示。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "物理模擬",
    "約束滿足",
    "Timer"
   ],
   "tools": [
    "Grasshopper",
    "Kangaroo2"
   ],
   "url": "https://www.food4rhino.com/en/app/kangaroo-physics"
  },
  {
   "id": "E04-10",
   "algo": "E04",
   "title": "張拉結構的動態鬆弛找形與分析（Barnes 方法）",
   "creator": "Michael R. Barnes",
   "year": "1999",
   "category": "performance",
   "categories_extra": [
    "modeling"
   ],
   "scale": "建築",
   "summary": "以 kinetic damping 的動態鬆弛法做大跨度索網、格殼、預力膜與肋膜屋頂的找形、分析與裁片，是張拉膜工程軟體的經典基礎。",
   "variations": [
    {
     "name": "Kinetic damping",
     "how": "damping 設 1，改為每步計算總動能，出現峰值就全部速度歸零。",
     "effect": "收斂步數大幅減少。"
    },
    {
     "name": "膜元素",
     "how": "除了邊彈簧外，每個三角面加上面積縮小的力（模擬膜的等向預力）。",
     "effect": "形狀從索網更接近連續膜的最小曲面。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "收斂",
    "物理模擬",
    "最佳化"
   ],
   "tools": [
    "自寫程式"
   ],
   "url": "https://journals.sagepub.com/doi/10.1260/0266351991494722"
  },
  {
   "id": "E04-11",
   "algo": "E04",
   "title": "KnitCandela 針織模板混凝土殼",
   "creator": "Block Research Group、Zaha Hadid Architects Computation and Design Group",
   "year": "2018",
   "category": "fabrication",
   "categories_extra": [
    "art-installation",
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "以電腦針織的織物作為受拉模板，張開後在上面塗覆混凝土形成薄殼展館。織物張開後的形狀需以找形模擬預測，並依此設計針織圖案。",
   "variations": [
    {
     "name": "不同部位不同彈性",
     "how": "依區域給不同 stiffness（對應針織密度不同），再找形。",
     "effect": "同一片織物張開後產生局部鼓起或收緊。"
    },
    {
     "name": "織物平面展開",
     "how": "記錄收斂後各彈簧長度與原長比例，反推平面裁片尺寸。",
     "effect": "得到可針織／裁剪的平面圖樣。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "物理模擬",
    "3D"
   ],
   "tools": [
    "COMPAS",
    "電腦針織"
   ],
   "url": ""
  },
  {
   "id": "E04-12",
   "algo": "E04",
   "title": "大型懸浮漁網雕塑",
   "creator": "Janet Echelman",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "以纖維網懸掛於建築物或城市廣場上空的大尺度雕塑，網的形狀取決於懸掛點與網本身的受力平衡，常以張力網模擬輔助設計。",
   "variations": [
    {
     "name": "都市錨點",
     "how": "錨點改成周邊建築物屋頂高度的點，gravity 為負（往下垂）。",
     "effect": "得到懸在廣場上空、中間下垂的網。"
    },
    {
     "name": "風力擾動",
     "how": "每步加一個隨時間變化的側向力（Math.Sin(step×頻率)），用 Timer 播放。",
     "effect": "網像在風中飄動，可做動態展示。"
    },
    {
     "name": "密度漸變",
     "how": "網格格距由中心往外漸變，彈簧原長依位置不同。",
     "effect": "網面出現疏密變化與不同垂度。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "物理模擬",
    "動畫",
    "3D"
   ],
   "tools": [],
   "url": ""
  },
  {
   "id": "E04-13",
   "algo": "E04",
   "title": "Ark Nova 充氣音樂廳",
   "creator": "Anish Kapoor、磯崎新（Arata Isozaki）",
   "year": "2013",
   "category": "art-installation",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "為東日本震災後巡迴演出設計的可移動充氣音樂廳，以單一薄膜充氣成型。充氣膜的最終形狀是內壓與膜張力的平衡結果，可用法向壓力版本的動態鬆弛模擬。",
   "variations": [
    {
     "name": "法向內壓",
     "how": "改用封閉三角 Mesh，每步對每面加上法向量×面積×壓力，平分到三頂點。",
     "effect": "網格鼓成氣球狀的充氣體。"
    },
    {
     "name": "穿孔拓撲",
     "how": "初始 Mesh 用帶洞的環形（torus 類）拓撲並固定底部點。",
     "effect": "得到有貫穿孔洞的充氣造形。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "物理模擬",
    "3D"
   ],
   "tools": [],
   "url": ""
  },
  {
   "id": "E04-14",
   "algo": "E04",
   "title": "Savill Building 木格殼屋頂",
   "creator": "Glenn Howells Architects、Buro Happold",
   "year": "2006",
   "category": "3d-architecture",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "建築",
   "summary": "英國溫莎大公園遊客中心的波浪形木格殼屋頂，以落葉松木條構成。此類 gridshell 常以動態鬆弛模擬木條從平面格網彎折成形的過程。",
   "variations": [
    {
     "name": "波浪形屋頂",
     "how": "長條網格的長邊固定成正弦曲線高度，短邊自由。",
     "effect": "得到三個起伏波峰的屋頂。"
    },
    {
     "name": "木條彎曲勁度",
     "how": "在同一行相鄰三點間加『抗彎』力，把中間點推向兩端點連線中點。",
     "effect": "模擬木條抗彎，網不再出現尖折。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "物理模擬",
    "3D"
   ],
   "tools": [],
   "url": ""
  },
  {
   "id": "E04-51",
   "algo": "E04",
   "title": "Coding Challenge 177：Soft Body Physics",
   "creator": "Daniel Shiffman（The Coding Train）",
   "year": "2023",
   "category": "drawing",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "Daniel Shiffman 用 p5.js 搭配 toxiclibs.js 的 Verlet 物理，把一個卡通角色的輪廓拆成粒子，再以外圈彈簧加上內部交叉彈簧撐住形狀，做出可以被滑鼠拖動、Q 彈晃動的軟體角色。基礎範例是固定角點、以重力找出懸垂形，這裡則是自由的彈簧網，重點在形狀的保持與互動。",
   "variations": [
    {
     "name": "加入內部對角彈簧",
     "how": "除了相鄰質點的彈簧，額外在網格對角線與跨越多格的點之間加上 Spring。",
     "effect": "網格抵抗剪切與塌陷，形狀更能維持，像有骨架的軟體。"
    },
    {
     "name": "拖曳一個質點",
     "how": "把某個質點設為固定，位置由 Rhino 中可移動的點參數決定，每次更新都從上一個狀態繼續模擬。",
     "effect": "可以互動地拉扯網面，觀察整體如何重新平衡。"
    },
    {
     "name": "改用 Verlet 積分",
     "how": "不存速度，改以 p_new = p + (p − p_prev)·damping + F·dt² 更新位置。",
     "effect": "程式更精簡且數值較穩定，與 toxiclibs、Kangaroo 的做法一致。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "p5.js",
    "toxiclibs.js",
    "物理模擬",
    "互動"
   ],
   "tools": [
    "p5.js",
    "toxiclibs.js"
   ],
   "url": "https://thecodingtrain.com/challenges/177-soft-body-character",
   "image": {
    "file": "img/cases/E04-51.jpg",
    "w": 900,
    "h": 506,
    "source": "The Coding Train",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://thecodingtrain.com/challenges/177-soft-body-character",
    "note": "頁面預覽圖：彈簧骨架與軟體角色"
   }
  },
  {
   "id": "E04-52",
   "algo": "E04",
   "title": "The Nature of Code 第 6 章：Physics Libraries",
   "creator": "Daniel Shiffman",
   "year": "2024",
   "category": "drawing",
   "categories_extra": [
    "modeling"
   ],
   "scale": "物件",
   "summary": "The Nature of Code（2024 年 JavaScript 版）第 6 章介紹 Matter.js 與 toxiclibs.js 兩種物理函式庫，後半段以 Verlet 物理實作彈簧、弦、布料網格與軟體角色，並說明 Euler 與 Verlet 積分的差異。基礎範例自行寫出質點與彈簧 class，本章則展示同樣的概念如何交給現成物理引擎，並比較不同積分方法的穩定性。",
   "variations": [
    {
     "name": "由一條弦開始",
     "how": "先只做一排質點（string），兩端固定，看它在重力下形成懸鏈線，再擴充到二維網格（blanket）。",
     "effect": "從懸鏈線一路推到懸垂曲面，觀念循序漸進。"
    },
    {
     "name": "加上吸引／排斥行為",
     "how": "對所有質點加上指向吸引點的力，或質點之間的短距離排斥力。",
     "effect": "網面會被局部拉起或撐開，可得到非純重力的形態。"
    },
    {
     "name": "比較 Euler 與 Verlet",
     "how": "同一組參數分別用兩種積分方法跑，記錄最大速度曲線。",
     "effect": "看出 Verlet 在較大時間步長下仍然穩定，理解數值爆炸的原因。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "creative coding",
    "p5.js",
    "toxiclibs.js",
    "Matter.js",
    "教學"
   ],
   "tools": [
    "p5.js",
    "toxiclibs.js",
    "Matter.js"
   ],
   "url": "https://natureofcode.com/physics-libraries/",
   "image": {
    "file": "img/cases/E04-52.jpg",
    "w": 900,
    "h": 438,
    "source": "The Nature of Code",
    "author": "Daniel Shiffman",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://natureofcode.com/physics-libraries/",
    "note": "書中圖 6.13：弦、布、骨架、軟體角色四種彈簧結構設計"
   }
  },
  {
   "id": "E04-53",
   "algo": "E04",
   "title": "three.js webgpu - compute cloth",
   "creator": "holtsetio（three.js 官方範例）",
   "year": "2025",
   "category": "modeling",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "three.js 的官方範例，以 WebGPU compute shader 執行 Verlet 布料模擬：由彈簧相連的頂點網格組成布料，在 GPU 上即時計算。與基礎範例在 CPU 上逐一計算彈簧力不同，它把彈簧力與頂點力分成兩個 compute pass 平行計算，再以即時算繪的布料材質呈現。",
   "variations": [
    {
     "name": "拆成兩個計算階段",
     "how": "先迴圈所有 Spring 算出力並存入 springForce 陣列，再迴圈所有質點彙總與自己相連的彈簧力，避免多執行緒同時寫入。",
     "effect": "邏輯與 GPU 版一致，也方便改成 Parallel.For 加速。"
    },
    {
     "name": "固定邊改成固定一整排",
     "how": "把固定條件從四個角點改成最上面一整排質點。",
     "effect": "得到像布簾、旗幟的懸掛形，而非四點支撐的殼。"
    },
    {
     "name": "加入球體碰撞",
     "how": "每步之後檢查質點是否進入球體內，若是則把它推回球面。",
     "effect": "網面會包覆障礙物，可做充氣膜或覆蓋地形的形態研究。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "creative coding",
    "three.js",
    "WebGPU",
    "GPU",
    "布料模擬"
   ],
   "tools": [
    "three.js",
    "WebGPU"
   ],
   "url": "https://threejs.org/examples/webgpu_compute_cloth.html",
   "image": {
    "file": "img/cases/E04-53.jpg",
    "w": 400,
    "h": 250,
    "source": "three.js 官方範例",
    "author": "holtsetio／three.js authors",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://threejs.org/examples/webgpu_compute_cloth.html",
    "note": "範例截圖：飄動的 Verlet 布料"
   }
  },
  {
   "id": "E04-54",
   "algo": "E04",
   "title": "MSAPhysics（openFrameworks／Cinder 粒子彈簧物理庫）",
   "creator": "Memo Akten",
   "year": "2008",
   "category": "art-installation",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "Memo Akten 開發的開源 C++ 物理函式庫，供 openFrameworks 與 Cinder 使用，以粒子與約束為基礎，提供彈簧、吸引子與碰撞；API 刻意仿照 Processing 的 Traer.physics，方便移植。與基礎範例只有彈簧加重力相比，它把吸引子與碰撞也納入同一個粒子系統，常用於即時互動與視覺作品。",
   "variations": [
    {
     "name": "加入吸引子",
     "how": "在 Particle 以外新增 Attractor class，對每個質點施加與距離平方成反比的力。",
     "effect": "網面被局部拉起或凹陷，形成多峰的膜形。"
    },
    {
     "name": "質點間碰撞",
     "how": "每一步檢查質點之間的距離，小於兩倍半徑就互相推開（與 E01 圓填充相同的規則）。",
     "effect": "網面不會自我穿透，適合模擬堆疊與皺褶。"
    },
    {
     "name": "2D／3D 共用程式",
     "how": "把 Particle 的位置型別抽象化（例如只用 X、Y 或 X、Y、Z），讓同一套彈簧程式跑在平面或空間。",
     "effect": "一套程式同時做平面網格張拉與立體找形。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "openFrameworks",
    "Cinder",
    "C++",
    "物理模擬",
    "開源"
   ],
   "tools": [
    "openFrameworks",
    "Cinder"
   ],
   "url": "https://www.memo.tv/msaphysics",
   "image": {
    "file": "img/cases/E04-54.jpg",
    "w": 900,
    "h": 568,
    "source": "Memo Akten 個人網站",
    "author": "Memo Akten",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://www.memo.tv/msaphysics",
    "note": "作品圖：以彈簧相連的 3D 粒子網絡"
   }
  },
  {
   "id": "E04-55",
   "algo": "E04",
   "title": "Houdini 17 Is Here – A Quickstart to Vellum",
   "creator": "Moritz Schwind（Entagma）",
   "year": "2018",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "Entagma 的五集快速入門，介紹 Houdini 17 新推出的 Vellum：以 XPBD（擴展式位置基礎動力學）穩定且快速地模擬布料、線材與軟體，內容包含撕裂布料與軟體的基本設定，並附場景檔。基礎範例以彈簧力、速度、阻尼逐步積分，Vellum 則直接以位置約束迭代修正，較不容易數值爆炸。",
   "variations": [
    {
     "name": "力改成位置約束",
     "how": "不計算彈簧力，而是每步直接把每條彈簧兩端點沿連線各移動一半誤差（目前長度－原長），重複數次。",
     "effect": "即使 stiffness 很大也不會爆炸，收斂更穩定。"
    },
    {
     "name": "加入壓力約束",
     "how": "對封閉網格計算體積，體積小於目標值時沿頂點法向量往外推。",
     "effect": "得到充氣膜或氣球般的形態，可研究充氣結構。"
    },
    {
     "name": "彈簧斷裂",
     "how": "當彈簧伸長超過原長的某個倍數時，把它從清單中移除。",
     "effect": "網面會撕裂開孔，可做破壞或開口的形態實驗。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "creative coding",
    "Houdini",
    "Vellum",
    "XPBD",
    "布料模擬"
   ],
   "tools": [
    "Houdini"
   ],
   "url": "https://entagma.com/houdini-17-is-here-a-quickstart-to-vellum/",
   "image": {
    "file": "img/cases/E04-55.jpg",
    "w": 640,
    "h": 360,
    "source": "Vimeo（Entagma）",
    "author": "Moritz Schwind",
    "license": "網頁預覽圖，教學引用",
    "license_url": "",
    "page": "https://vimeo.com/294379827",
    "note": "影片縮圖：Vellum 軟體模擬"
   }
  },
  {
   "id": "F01-01",
   "algo": "F01",
   "title": "Mémoire sur les combinaisons（Truchet 原始論文）",
   "creator": "Sébastien Truchet",
   "year": "1704",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "構件",
   "summary": "法國神父兼數學家 Truchet 研究一片沿對角線切成雙色三角形的方磚，以四種方向組合出大量圖樣，是組合學與色彩對稱的早期表述。基礎範例的「每格選方向」正是這個想法。",
   "variations": [
    {
     "name": "三角形四方向",
     "how": "把弧改成對角三角形，random.Next(4) 選 0/90/180/270°。",
     "effect": "重現原始黑白三角拼花。"
    },
    {
     "name": "規則排列取代隨機",
     "how": "方向改由 (row % 2) * 2 + (column % 2) 等公式決定，而非 Random。",
     "effect": "得到鑽石、鋸齒、風車等週期性對稱圖樣。"
    },
    {
     "name": "2×2 母題重複",
     "how": "先隨機產生 2×2 或 4×4 的方向表，再以鏡射或旋轉複製到整片網格。",
     "effect": "兼具隨機趣味與可控的大尺度對稱。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "拼貼",
    "對稱"
   ],
   "tools": [
    "手繪／紙本"
   ],
   "url": "https://en.wikipedia.org/wiki/Truchet_tile"
  },
  {
   "id": "F01-02",
   "algo": "F01",
   "title": "Smith 圓弧 Truchet 與結構層級拓樸",
   "creator": "Cyril Stanley Smith、Pauline Boucher",
   "year": "1987",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "構件",
   "summary": "Smith 在 Leonardo 期刊翻譯 Truchet 論文並提出「兩段四分之一圓」的變體，弧線連成連續曲線且把平面分成可兩色著色的區域。基礎範例 F01 就是 Smith 版本。",
   "variations": [
    {
     "name": "兩色分區",
     "how": "每格依 (row + column + rotated) % 2 決定弧內外區域的顏色，輸出填色 Hatch 或 Brep。",
     "effect": "黑白交錯的有機色塊。"
    },
    {
     "name": "弧線加粗",
     "how": "每段弧 Offset 成帶狀，並在格邊處與鄰格帶子對齊。",
     "effect": "變成可切割的連續曲線帶。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "拼貼",
    "隨機"
   ],
   "tools": [],
   "url": "https://www.jstor.org/stable/1578535"
  },
  {
   "id": "F01-03",
   "algo": "F01",
   "title": "Multi-Scale Truchet Patterns（多尺度 Truchet）",
   "creator": "Christopher Carlson",
   "year": "2018",
   "category": "2d-pattern",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "構件",
   "summary": "Carlson 把 Smith 磁磚推廣到以 1/2 縮放的無限組，並加入「翼」使小磚能疊在大磚上接續；邊界在邊長 1/3、2/3 處相接，顏色逐層反轉，產生豐富的湧現形。發表於 Bridges 2018，並附 Wolfram Language 套件。",
   "variations": [
    {
     "name": "遞迴四分",
     "how": "新增遞迴函式，每格以機率 p 切成四個半尺寸子格，depth 控制最大層數。",
     "effect": "大小尺度混合的圖樣。"
    },
    {
     "name": "帶翼磁磚",
     "how": "弧的接點從邊中點改為 1/3 與 2/3 點，並在四角加小圓翼以便接上子磚。",
     "effect": "不同尺度之間的線條可以連續。"
    },
    {
     "name": "雜訊決定細分",
     "how": "用 Perlin noise 的值取代 random 決定是否細分。",
     "effect": "細碎區與粗大區呈有機分布。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "遞迴",
    "分形",
    "拼貼"
   ],
   "tools": [
    "Wolfram Language"
   ],
   "url": "https://christophercarlson.com/portfolio/multi-scale-truchet-patterns/"
  },
  {
   "id": "F01-04",
   "algo": "F01",
   "title": "10 PRINT CHR$(205.5+RND(1)); : GOTO 10",
   "creator": "Nick Montfort 等 10 位作者（MIT Press）",
   "year": "2012",
   "category": "drawing",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "構件",
   "summary": "一整本書探討一行 Commodore 64 BASIC 程式：每次隨機印出「╱」或「╲」就生成無盡迷宮。這是對角線版 Truchet，也是生成藝術與隨機性的經典教材。",
   "variations": [
    {
     "name": "對角線版",
     "how": "TileArcs 改為回傳一條對角線 Line，方向由 random.Next(2) 決定。",
     "effect": "經典迷宮紋。"
    },
    {
     "name": "偏置機率",
     "how": "把 random.Next(2)==1 改成 random.NextDouble() < bias，bias 接滑桿。",
     "effect": "迷宮變成有方向性的斜紋，bias 越極端越像條紋。"
    },
    {
     "name": "迷宮區域上色",
     "how": "以線段切割外框後找出所有封閉區域，依面積上色。",
     "effect": "看見隱藏在迷宮裡的島與大陸。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "隨機",
    "拼貼"
   ],
   "tools": [
    "BASIC"
   ],
   "url": "https://10print.org/"
  },
  {
   "id": "F01-05",
   "algo": "F01",
   "title": "雷射切割 Truchet 拼圖（Museum of Mathematics）",
   "creator": "George Hart",
   "year": "2012",
   "category": "fabrication",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "兩種帶四分之一圓弧的雷射切割小磚，上層弧形片黏在底層方塊上，規則是「高接高、低接低」，可以拼出圓島或圓湖等圖樣，表面凸起還能拓印。",
   "variations": [
    {
     "name": "兩層板輸出",
     "how": "把兩色區域分別輸出為上層（切穿）與下層（整片）封閉曲線，加上板厚後 Extrude。",
     "effect": "可直接送雷射切割的雙層磁磚。"
    },
    {
     "name": "高低差浮雕",
     "how": "依區域顏色給不同 Extrude 高度，或以弧為路徑 Sweep 半圓斷面。",
     "effect": "可觸摸、可拓印的浮雕磁磚。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "拼貼"
   ],
   "tools": [
    "雷射切割"
   ],
   "url": "https://makezine.com/article/home/fun-games/math-monday-truchet-tiles/"
  },
  {
   "id": "F01-06",
   "algo": "F01",
   "title": "Truchet 吸音磚",
   "creator": "Steelcase",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "以 Truchet 命名的吸音牆面／天花模組，54 × 54 cm、五種形狀（平面方塊、曲面方塊、雙曲面方塊、平面四分之一圓、曲面四分之一圓），靠組合方式拼出無限多種牆面。示範 Truchet 在室內聲學產品上的模組化思維。",
   "variations": [
    {
     "name": "多種磁磚庫",
     "how": "把 bool rotated 改成 int tileType，從 5 種磁磚（含不同曲面高度）的清單中挑選。",
     "effect": "更豐富的紋理與深度。"
    },
    {
     "name": "依聲學需求分布",
     "how": "輸入噪音熱點或座位位置，距離越近越偏向吸音量大的曲面磚。",
     "effect": "外觀即性能分布圖的吸音牆。"
    },
    {
     "name": "數量統計",
     "how": "Print 每種磁磚與方向的數量，輸出 BOM 表。",
     "effect": "可直接下單的材料清單。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "拼貼",
    "吸引子控制"
   ],
   "tools": [],
   "url": "https://www.steelcase.com/eu-en/products/acoustic-solutions/truchet-acoustic-tiles/"
  },
  {
   "id": "F01-07",
   "algo": "F01",
   "title": "Truchet 作為立面的計算式視覺編碼",
   "creator": "Deena El-Mahdy",
   "year": "2025",
   "category": "3d-architecture",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "立面／表皮",
   "summary": "研究以 Truchet 磁磚作為模組化參數立面的視覺編碼方法，流程分為探索鋪排、測試連續性、製造與組裝四階段，並結合 shape grammar 回應氣候條件。",
   "variations": [
    {
     "name": "日照決定方向",
     "how": "以每格中心的日照輻射值（Ladybug 輸出）作為機率，決定面板方向或開孔大小。",
     "effect": "外觀紋理同時是遮陽策略。"
    },
    {
     "name": "連續性檢查",
     "how": "Join 所有弧後統計封閉圈數與最長曲線長度，作為評估指標。",
     "effect": "可量化比較不同 seed 的立面。"
    },
    {
     "name": "Shape grammar 規則",
     "how": "把方向選擇改成讀取上方與左方鄰格的狀態（例如禁止形成過小封閉圈）。",
     "effect": "由純隨機進化為有設計意圖的立面語法。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "拼貼",
    "鄰居搜尋"
   ],
   "tools": [],
   "url": "https://journals.sagepub.com/doi/abs/10.1177/14780771241270265"
  },
  {
   "id": "F01-08",
   "algo": "F01",
   "title": "以 Truchet 鋪排的織物模板預鑄面板",
   "creator": "Nexus Network Journal 論文",
   "year": "2023",
   "category": "fabrication",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "結合軟質織物模板、計算式形態找尋與 Truchet 鋪排概念的預鑄面板設計方法，織物模板成本低、製作快且易運輸，少量模板就能組出多變牆面。",
   "variations": [
    {
     "name": "弧線轉模板縫線",
     "how": "把每格的弧當成織物模板的縫線或拉索位置，灌漿後形成凹凸。",
     "effect": "每片面板有柔軟的起伏，拼接處曲線連續。"
    },
    {
     "name": "只用兩種模具",
     "how": "確認 0° 與 90° 面板旋轉後可互換，以 Transform.Rotation 產生實際擺放。",
     "effect": "最少模具數、最大變化量。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "拼貼",
    "物理模擬"
   ],
   "tools": [],
   "url": "https://link.springer.com/article/10.1007/s00004-023-00657-9"
  },
  {
   "id": "F01-09",
   "algo": "F01",
   "title": "Truchet Tile Parametric Facade（曲面上的參數化立面模型）",
   "creator": "dchant design",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "立面／表皮",
   "summary": "公開於 Sketchfab 的 3D 模型，把 Truchet 圖樣以可變參數鋪在曲面立面上，並融入伊斯蘭圖樣語彙，示範從平面圖樣到曲面立面的轉換。",
   "variations": [
    {
     "name": "UV 映射",
     "how": "新增 Surface 輸入，將弧取樣點以 surface.PointAt(u, v) 映射到曲面。",
     "effect": "圖樣順著曲面連續包覆。"
    },
    {
     "name": "沿法向量長出深度",
     "how": "在每個映射點取 surface.NormalAt 並偏移，Loft 成立體肋條。",
     "effect": "有陰影深度的立面紋理。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "曲面上",
    "拼貼",
    "3D"
   ],
   "tools": [
    "Rhino",
    "Grasshopper"
   ],
   "url": "https://sketchfab.com/3d-models/truchet-tile-parametric-facade-cd2d6d5dbea04e2f8dbbd44dbc979fd3"
  },
  {
   "id": "F01-10",
   "algo": "F01",
   "title": "Truchet Tiles Grasshopper 教學",
   "creator": "Parametric House",
   "year": "2019",
   "category": "modeling",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "構件",
   "summary": "以原生 Grasshopper 元件用 Dispatch 把方格分成兩組，再從邊中點畫圓弧形成 Truchet 圖樣；另有 Advanced Truchet Tiles 版本可依順時針、逆時針或隨機序列旋轉底磚。可和 C# 版本對照比較。",
   "variations": [
    {
     "name": "C# 對照原生元件",
     "how": "讓學習者把 random.Next(2) 換成外部輸入的 bool 清單，接 GH 的 Random + Dispatch。",
     "effect": "理解 C# 與元件式寫法的對應。"
    },
    {
     "name": "旋轉序列",
     "how": "方向改由 (row * columns + column) % 4 依序旋轉，或讀入使用者提供的整數序列。",
     "effect": "規律的順時針／逆時針漩渦紋。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "拼貼"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://www.grasshopper3d.com/video/truchet-tiles-grasshopper-tutorial"
  },
  {
   "id": "F01-11",
   "algo": "F01",
   "title": "C# 多尺度 Truchet 圖樣產生器",
   "creator": "mostlynobody（GitHub）",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "構件",
   "summary": "以 C# 實作 Carlson 多尺度 Truchet 的命令列工具，預設用 Perlin noise 決定細分與方向，支援色盤、細分層數與種子控制。語言與基礎範例相同，適合學習者直接參考演算法結構。",
   "variations": [
    {
     "name": "Perlin noise 取代 Random",
     "how": "以 noise(column * scale, row * scale) > 0 決定方向。",
     "effect": "方向成片出現，紋理呈大區塊流動感。"
    },
    {
     "name": "色盤輸出",
     "how": "依層級與區域顏色輸出 Hatch 或帶顏色的 Mesh。",
     "effect": "可直接做海報或印刷的彩色圖樣。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "遞迴",
    "可重現種子",
    "隨機"
   ],
   "tools": [
    "C#"
   ],
   "url": "https://github.com/mostlynobody/truchet"
  },
  {
   "id": "F01-12",
   "algo": "F01",
   "title": "Truchet blocks 數學互動教具",
   "creator": "MathsCity（Leeds）",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "Leeds 的 MathsCity 探索中心以每一面都印有 Truchet 圖案的立方塊作為互動教具，讓觀眾以堆疊與旋轉方塊來拼出圖樣，是 3D Truchet 的實體化。",
   "variations": [
    {
     "name": "立方塊六面圖案",
     "how": "改三層迴圈，對每個立方體的 6 個面各自套 TileArcs，面方向由 Plane 決定。",
     "effect": "可堆疊的 3D Truchet 方塊。"
    },
    {
     "name": "面與面連續檢查",
     "how": "檢查相鄰方塊接觸面上的弧端點是否對齊，不對齊就旋轉方塊。",
     "effect": "跨方塊連續的空間線條。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "3D",
    "拼貼"
   ],
   "tools": [],
   "url": "https://www.newsroom.hlf-foundation.org/blog/article/truchet-tilings/"
  },
  {
   "id": "F01-13",
   "algo": "F01",
   "title": "Truchet 密碼卡片（以磁磚編碼訊息）",
   "creator": "Ayliean MacDonald",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "數學藝術家以帶折線的 Truchet 磁磚設計賀卡，磁磚方向編碼秘密訊息；同篇文章也提到以 Truchet 編碼點字。說明方向不一定要隨機，也可以承載資料。",
   "variations": [
    {
     "name": "文字轉位元",
     "how": "把輸入字串轉成 ASCII 二進位，逐格讀取 bit 決定 rotated。",
     "effect": "看似隨機、其實可解碼的圖樣。"
    },
    {
     "name": "資料視覺化",
     "how": "把一組數據（如每月雨量）正規化後，以門檻值決定方向或磁磚種類。",
     "effect": "把環境數據刻印在立面紋理上。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "拼貼"
   ],
   "tools": [],
   "url": "https://www.newsroom.hlf-foundation.org/blog/article/truchet-tilings/"
  },
  {
   "id": "F01-14",
   "algo": "F01",
   "title": "可 3D 列印的磁吸 Truchet 磁磚",
   "creator": "moebio（Printables）",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "以 OpenSCAD 撰寫的可客製化 Truchet 磁磚，可預留圓形或矩形磁鐵孔，列印後可在桌面或磁板上自由重新排列。",
   "variations": [
    {
     "name": "參數化單元",
     "how": "只輸出單一格的實體（弧 Sweep + 底板 + 磁鐵孔），列印 N 片後由人排列。",
     "effect": "由使用者當演算法的互動裝置。"
    },
    {
     "name": "程式排列圖",
     "how": "C# 輸出每格方向的編號表，作為現場組裝說明。",
     "effect": "數位設計 → 手工組裝的完整流程。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "拼貼"
   ],
   "tools": [
    "OpenSCAD",
    "3D 列印"
   ],
   "url": "https://www.printables.com/model/220630-truchet-tiles"
  },
  {
   "id": "F02-01",
   "algo": "F02",
   "title": "Hankin 的 polygons in contact 法",
   "creator": "Ernest Hanbury Hankin",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "構件",
   "summary": "Hankin 在 20 世紀初研究印度等地伊斯蘭建築時提出：幾何圖樣是在「彼此接觸的多邊形」構造線上畫出來的，例如八角形網格留下正方形空隙。基礎範例的底圖就是這個八角形＋正方形組合。",
   "variations": [
    {
     "name": "改變構造線",
     "how": "BuildTiling 換成其他多邊形接觸組合（如 12 邊形＋三角形＋正方形）。",
     "effect": "得到十二角星家族。"
    },
    {
     "name": "顯示構造過程",
     "how": "額外輸出射線與交點，並以 Iteration 或滑桿逐步顯示。",
     "effect": "可教學用的構造動畫。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "拼貼",
    "對稱"
   ],
   "tools": [
    "手繪／紙本"
   ],
   "url": "https://en.wikipedia.org/wiki/Islamic_geometric_patterns"
  },
  {
   "id": "F02-02",
   "algo": "F02",
   "title": "Islamic star patterns from polygons in contact",
   "creator": "Craig S. Kaplan",
   "year": "2005",
   "category": "modeling",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "構件",
   "summary": "把 Hankin 法形式化成電腦演算法：輸入任意平面鋪面與少數直覺參數（接觸角、接觸位置偏移）即可生成星形圖樣，並能做出類 parquet deformation 的漸變與新的鋪面轉換。基礎範例 F02 是此論文的最簡版本。",
   "variations": [
    {
     "name": "接觸偏移 delta",
     "how": "射線起點改為邊中點沿邊 ±delta 兩點。",
     "effect": "星形出現雙線與中央小多邊形。"
    },
    {
     "name": "Parquet deformation",
     "how": "讓 contactAngle 隨多邊形中心的 x 座標線性變化。",
     "effect": "從一端到另一端連續變形的圖樣帶。"
    },
    {
     "name": "任意底圖",
     "how": "BuildTiling 改為輸入外部 Polyline 清單（需為凸、逆時針）。",
     "effect": "同一程式處理任意鋪面。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "拼貼",
    "對稱",
    "幾何轉換"
   ],
   "tools": [
    "C++"
   ],
   "url": "https://graphicsinterface.org/proceedings/gi2005/gi2005-22/"
  },
  {
   "id": "F02-03",
   "algo": "F02",
   "title": "Alhambra 宮殿的 zellij 幾何磁磚",
   "creator": "Nasrid 王朝",
   "year": "",
   "category": "3d-architecture",
   "categories_extra": [
    "2d-pattern",
    "urban-landscape"
   ],
   "scale": "建築",
   "summary": "西班牙格拉納達的 Alhambra 於 1238 年起由 Nasrid 王朝興建，14 世紀達到高峰；牆裙與地面以 zellij（alicatado）馬賽克磁磚拼出繁複幾何圖樣，並與灰泥雕刻、阿拉伯書法結合。",
   "variations": [
    {
     "name": "牆裙帶狀圖樣",
     "how": "rows 固定為 1–2，columns 放大，並用 Clip 外框切出牆裙帶。",
     "effect": "連續的牆裙飾帶。"
    },
    {
     "name": "色塊 zellij",
     "how": "把 Hankin 線切出的封閉區域依形狀類型（星／多邊形／菱形）分配顏色。",
     "effect": "多色馬賽克拼花。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "拼貼",
    "對稱"
   ],
   "tools": [],
   "url": "https://en.wikipedia.org/wiki/Alhambra"
  },
  {
   "id": "F02-04",
   "algo": "F02",
   "title": "Darb-e Imam 聖祠的準週期 girih 圖樣",
   "creator": "Qara Qoyunlu 時期工匠",
   "year": "1453",
   "category": "2d-pattern",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "立面／表皮",
   "summary": "伊朗 Isfahan 的 Darb-e Imam 建於 1453 年，其磁磚被 Peter Lu 發現與 Penrose 鋪面相似，是 girih 磁磚加自相似細分的代表作。",
   "variations": [
    {
     "name": "girih 五磚底圖",
     "how": "BuildTiling 改成十邊形、五邊形、細長六邊形、蝴蝶結、菱形五種等邊磚，接觸角設 54°。",
     "effect": "十角星圖樣。"
    },
    {
     "name": "兩層級自相似",
     "how": "大尺度 girih 圖樣切出的區域再以縮小的 girih 磚細分一次。",
     "effect": "大圖樣內含小圖樣的兩層級構成。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "拼貼",
    "對稱",
    "遞迴"
   ],
   "tools": [],
   "url": "https://en.wikipedia.org/wiki/Darb-e_Imam"
  },
  {
   "id": "F02-05",
   "algo": "F02",
   "title": "中世紀伊斯蘭建築中的十重與準晶鋪面",
   "creator": "Peter J. Lu、Paul J. Steinhardt",
   "year": "2007",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "立面／表皮",
   "summary": "發表於 Science 的研究指出約 1200 年後 girih 圖樣被重新理解為五種等邊 girih 磁磚的鋪面，15 世紀更結合自相似轉換，做出接近完美的準週期 Penrose 圖樣。說明「底圖＋線條規則」的構造法本身就是演算法。",
   "variations": [
    {
     "name": "Penrose deflation 底圖",
     "how": "寫遞迴函式把胖、瘦菱形依黃金比細分 n 次，再把結果交給 HankinLines。",
     "effect": "不重複的準週期星形圖樣。"
    },
    {
     "name": "girih 磚上的線條",
     "how": "只在每片 girih 磚的邊中點以 54° 射線，並比對與底圖的一致性。",
     "effect": "驗證 girih 磚本身就是 Hankin 構造線。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "遞迴",
    "分形",
    "拼貼"
   ],
   "tools": [],
   "url": "https://www.science.org/doi/10.1126/science.1135491"
  },
  {
   "id": "F02-06",
   "algo": "F02",
   "title": "Topkapı 卷軸（Topkapı Scroll）",
   "creator": "帖木兒／薩法維時期伊朗工匠",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "構件",
   "summary": "寬 33 cm、長 29.5 m 的卷軸，收錄 114 個以墨與顏料繪製的幾何圖樣（含 girih 與 muqarnas），並以格線與配色標示對稱，是古代工匠的「圖樣函式庫」，現藏伊斯坦堡 Topkapı 宮。",
   "variations": [
    {
     "name": "單元格＋鏡射",
     "how": "只在一個基本單元（fundamental region）內產生線條，再用 Transform.Mirror 與 Rotation 複製。",
     "effect": "與卷軸相同的「最小單元＋對稱複製」工作流程。"
    },
    {
     "name": "同時輸出構造線",
     "how": "以不同圖層或顏色輸出底圖多邊形（虛線）與圖樣線（實線）。",
     "effect": "像卷軸一樣可讀的施工圖。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "對稱",
    "拼貼"
   ],
   "tools": [
    "手繪／紙本"
   ],
   "url": "https://en.wikipedia.org/wiki/Topkapı_Scroll"
  },
  {
   "id": "F02-07",
   "algo": "F02",
   "title": "Akbar 陵墓的八角形網格圖樣",
   "creator": "蒙兀兒帝國",
   "year": "1605–1613",
   "category": "3d-architecture",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "建築",
   "summary": "Hankin 用來說明 polygons in contact 的例子：八角形排成網格、留下正方形空隙，再在上面畫出星形。與基礎範例的底圖幾乎一致。",
   "variations": [
    {
     "name": "接觸角變化",
     "how": "contactAngle 從 45° 拉到 80°，比較星芒尖銳度。",
     "effect": "同一底圖的不同風格。"
    },
    {
     "name": "石材鑲嵌分件",
     "how": "把線網切成封閉區域，依區域面積分群、統計數量。",
     "effect": "可估算石材鑲嵌的零件種類與數量。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "拼貼",
    "對稱"
   ],
   "tools": [],
   "url": "https://en.wikipedia.org/wiki/Islamic_geometric_patterns"
  },
  {
   "id": "F02-08",
   "algo": "F02",
   "title": "Louvre Abu Dhabi 多層星形穹頂",
   "creator": "Jean Nouvel（結構：BuroHappold Engineering）",
   "year": "2017",
   "category": "art-installation",
   "categories_extra": [
    "performance",
    "fabrication"
   ],
   "scale": "建築",
   "summary": "穹頂由 7,850 顆不同尺寸的鋁製星形在 8 層中鋪排而成，形成穿孔屋頂，讓光線如穿過椰棗葉般灑落。是「多層星形圖樣＋光影」的大尺度實例。",
   "variations": [
    {
     "name": "多層疊合",
     "how": "同一底圖以不同 tileSize 與旋轉產生 8 層，各層沿 Z 偏移。",
     "effect": "層層交錯的穿孔效果。"
    },
    {
     "name": "光斑模擬",
     "how": "以太陽向量把各層封閉區域投影到地面，做 Region Intersection 求穿透區。",
     "effect": "預測地面的「光之雨」圖樣。"
    },
    {
     "name": "穹頂映射",
     "how": "在球面上以極座標網格生成底圖，或把平面圖樣投影到穹頂曲面。",
     "effect": "連續覆蓋整個穹頂的星形格柵。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "曲面上",
    "3D",
    "對稱"
   ],
   "tools": [],
   "url": "https://en.wikipedia.org/wiki/Louvre_Abu_Dhabi"
  },
  {
   "id": "F02-09",
   "algo": "F02",
   "title": "Institut du Monde Arabe 南向機械光圈立面",
   "creator": "Jean Nouvel、Architecture-Studio",
   "year": "1987",
   "category": "performance",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "立面／表皮",
   "summary": "巴黎阿拉伯世界研究中心的玻璃帷幕後方有 240 組感光、馬達驅動的光圈，依日照自動開合，轉譯自伊斯蘭 mashrabiya 的遮陽傳統，形成會動的幾何圖樣。",
   "variations": [
    {
     "name": "開合度參數",
     "how": "每個星形以中心為基點 Scale，縮放係數 = f(太陽高度角)；或讓 contactAngle 隨日照變化。",
     "effect": "星形光圈隨時間開合。"
    },
    {
     "name": "Timer 動畫",
     "how": "接 Timer，以時間參數驅動整片立面的開合，輸出每幀的開孔率。",
     "effect": "一天之中的立面動畫與性能曲線。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "動畫",
    "Timer",
    "吸引子控制"
   ],
   "tools": [],
   "url": "https://en.wikipedia.org/wiki/Arab_World_Institute"
  },
  {
   "id": "F02-10",
   "algo": "F02",
   "title": "Al Bahr Towers 動態 mashrabiya 遮陽",
   "creator": "Aedas（現 AHR）",
   "year": "2012",
   "category": "performance",
   "categories_extra": [
    "3d-architecture",
    "fabrication"
   ],
   "scale": "立面／表皮",
   "summary": "阿布達比雙塔外覆約 2,000 個傘狀遮陽單元，依日照強度自動開合，靈感來自傳統 mashrabiya，可減少約 50% 日射得熱。立面以三角形幾何模組重複排列。",
   "variations": [
    {
     "name": "三角形底圖",
     "how": "BuildTiling 改成三角形網格，每個三角形套 HankinLines，接觸角即為開合程度。",
     "effect": "可開合的三角星形遮陽單元。"
    },
    {
     "name": "依日照分區",
     "how": "把立面每個單元的日照輻射值映射到 contactAngle 範圍（例如 30°–80°）。",
     "effect": "受曬越強處遮得越密。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "曲面上",
    "吸引子控制",
    "動畫"
   ],
   "tools": [],
   "url": "https://en.wikipedia.org/wiki/Al_Bahr_Towers"
  },
  {
   "id": "F02-11",
   "algo": "F02",
   "title": "杜哈伊斯蘭藝術博物館",
   "creator": "I. M. Pei（貝聿銘）",
   "year": "2008",
   "category": "3d-architecture",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "建築",
   "summary": "以抽象化的伊斯蘭幾何為語彙，外牆石灰岩的開孔與燈具呈現幾何圖樣，中庭天花採伊斯蘭圖樣，靈感來自開羅伊本圖倫清真寺的淨水亭。示範圖樣如何從平面轉為量體與天花的語言。",
   "variations": [
    {
     "name": "天花放射圖樣",
     "how": "底圖改為以中心為原點的同心多邊形環（極座標），每環邊數倍增。",
     "effect": "由中心向外放射的穹頂天花。"
    },
    {
     "name": "圖樣轉開口",
     "how": "只保留星形中心區域作為開孔，其餘為實牆，輸出 Brep 差集。",
     "effect": "石牆上的抽象星形開窗。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "對稱",
    "3D"
   ],
   "tools": [],
   "url": "https://en.wikipedia.org/wiki/Museum_of_Islamic_Art,_Doha"
  },
  {
   "id": "F02-12",
   "algo": "F02",
   "title": "Freeform Islamic Geometric Patterns（自由形伊斯蘭圖樣）",
   "creator": "Rebecca Lin、Craig S. Kaplan",
   "year": "2023",
   "category": "modeling",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "構件",
   "summary": "以圓堆積（circle packing）為骨架，生成大小不一的 rosette 並填入多邊形區塊，再以傳統構造法填滿，讓伊斯蘭圖樣能脫離週期網格、自由布局又保有傳統美感。",
   "variations": [
    {
     "name": "Circle packing 底圖",
     "how": "先用 E01 圓堆積得到圓心，以其 Delaunay／Voronoi 多邊形當底圖。",
     "effect": "大小星形混雜的自由圖樣。"
    },
    {
     "name": "依邊數自動定角度",
     "how": "contactAngle = 90° - 180°/n 之類的公式，讓每個 n 邊形得到合適星芒。",
     "effect": "不規則底圖上也有漂亮星形。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "拼貼",
    "鄰居搜尋",
    "最佳化"
   ],
   "tools": [],
   "url": "https://arxiv.org/abs/2301.01471"
  },
  {
   "id": "F02-13",
   "algo": "F02",
   "title": "Next Generation of Star Patterns（同心圓參數化星形）",
   "creator": "Hadi Mansourifar、Weidong Shi",
   "year": "2018",
   "category": "2d-pattern",
   "categories_extra": [
    "modeling"
   ],
   "scale": "構件",
   "summary": "以同心圓為基礎的參數化方法，只改 9 個參數就能讓不同星形與 rosette 互相轉換；並以三個相切圓與其間隙作為磁磚單元，生成新的星形圖樣，另做成 Android App。",
   "variations": [
    {
     "name": "參數滑桿化",
     "how": "把 contactAngle、delta、tileSize 等都拉成輸入，並加入 rosette 花瓣層數。",
     "effect": "一組滑桿探索整個星形家族。"
    },
    {
     "name": "相切圓底圖",
     "how": "以六角密堆積的圓與其間隙三角形作為多邊形底圖。",
     "effect": "六角對稱的新星形圖樣。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "對稱",
    "拼貼"
   ],
   "tools": [
    "Android App"
   ],
   "url": "https://arxiv.org/abs/1809.09270"
  },
  {
   "id": "F03-01",
   "algo": "F03",
   "title": "Gyroid 的發現：NASA 技術報告與實體模型",
   "creator": "Alan H. Schoen（NASA 電子研究中心）",
   "year": "1970",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Schoen 在 1970 年 NASA 技術報告〈Infinite Periodic Minimal Surfaces Without Self-Intersections〉中描述了 Gyroid 等 12 種新的 TPMS，並以塑膠模型與電腦動畫展示；嚴格證明要到 1996 年才完成。基礎範例用的 sin·cos 三角函數式則是後來常用的近似公式。",
   "variations": [
    {
     "name": "Bonnet 變形動畫",
     "how": "以參數 t 在 Schwarz P、D 與 Gyroid 公式之間線性插值並動畫化（近似展示，非精確的 Bonnet 變換）",
     "effect": "看出三種曲面同屬一家族的直覺"
    },
    {
     "name": "單元模型",
     "how": "periods 設 1，只輸出一個單元並做成 sheet 版本",
     "effect": "可 3D 列印的教學用單元模型"
    },
    {
     "name": "骨架圖",
     "how": "只取 f < isoValue 的格點中心連線（圖：點＋連線）",
     "effect": "看出曲面兩側的迷宮通道骨架"
    }
   ],
   "difficulty": 2,
   "tags": [
    "等值面",
    "對稱",
    "3D"
   ],
   "tools": [],
   "url": "https://schoengeometry.com/e-tpms.html"
  },
  {
   "id": "F03-02",
   "algo": "F03",
   "title": "Gyroid 金屬雕塑",
   "creator": "Bathsheba Grossman",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "數學雕塑家 Bathsheba Grossman 以 Mathematica 與 Kenneth Brakke 的 Surface Evolver 計算 Gyroid 的一段，再以鋼材 3D 列印成約 3 吋的立方雕塑；她自述自己的創作貢獻是「開的洞」。",
   "variations": [
    {
     "name": "sheet 加厚",
     "how": "場值改為 |f| − t，t 為壁厚",
     "effect": "有實體厚度、可金屬列印的雙面殼"
    },
    {
     "name": "外形裁切",
     "how": "與球或立方體的 SDF 取交集 max(f, d)",
     "effect": "邊界乾淨的雕塑外形"
    },
    {
     "name": "表面開孔",
     "how": "在 sheet 上再疊一個低頻 TPMS 或點狀場做差集",
     "effect": "類似作者加上的孔洞，增加穿透感"
    }
   ],
   "difficulty": 3,
   "tags": [
    "等值面",
    "3D",
    "對稱"
   ],
   "tools": [
    "Mathematica",
    "Surface Evolver",
    "金屬 3D 列印"
   ],
   "url": "https://www.bathsheba.com/math/gyroid/"
  },
  {
   "id": "F03-03",
   "algo": "F03",
   "title": "3D 列印的 Gyroid 填充（Infill）",
   "creator": "Prusa Research（PrusaSlicer）等切片軟體",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "構件",
   "summary": "FDM 切片軟體普遍提供 Gyroid 填充樣式：各方向強度接近、同一層內不自我交叉、列印快、重量強度比佳。每一層列印路徑正是 Gyroid 在該高度的 2D 切片等值線。",
   "variations": [
    {
     "name": "逐層切片 = C05",
     "how": "固定 z，把 Gyroid 公式當 C05 的場，描出等值線當列印路徑",
     "effect": "自己產生 Gyroid 填充刀具路徑"
    },
    {
     "name": "漸變填充率",
     "how": "periods 或 isoValue 隨到外殼的距離變化",
     "effect": "外緣密、中心疏的省料填充"
    },
    {
     "name": "改 Schwarz P／D",
     "how": "切換公式比較切片路徑",
     "effect": "不同強度與列印時間的填充樣式"
    }
   ],
   "difficulty": 2,
   "tags": [
    "等值面",
    "3D"
   ],
   "tools": [
    "PrusaSlicer",
    "FDM 3D 列印"
   ],
   "url": "https://help.prusa3d.com/article/infill-patterns_177130"
  },
  {
   "id": "F03-04",
   "algo": "F03",
   "title": "徑向漸變 TPMS 骨骼支架",
   "creator": "骨組織工程研究（綜述論文）",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "近年以 3D 列印的徑向漸變 TPMS 多孔支架修復骨缺損，常見 Gyroid、Diamond、Schwarz P；材料有 PLA、PCL、PEEK、鈦合金等，製程涵蓋 FDM、光固化、擠出與 SLM。孔隙率、孔徑與連通性直接由公式與 isoValue 控制。",
   "variations": [
    {
     "name": "徑向漸變",
     "how": "isoValue 依到中心軸的距離 r 變化，例如 iso = a + b·r",
     "effect": "外圍緻密承重、中心多孔利於長骨"
    },
    {
     "name": "Sheet 型 vs Skeletal 型",
     "how": "分別用 |f| − t 與 f − t 兩種場",
     "effect": "比較兩種晶格的孔隙率與表面積"
    },
    {
     "name": "外形來自掃描",
     "how": "以骨缺損 Mesh 的 SDF 與 TPMS 取交集",
     "effect": "客製化形狀的植入物"
    }
   ],
   "difficulty": 4,
   "tags": [
    "等值面",
    "3D",
    "最佳化"
   ],
   "tools": [
    "3D 列印"
   ],
   "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11283664"
  },
  {
   "id": "F03-05",
   "algo": "F03",
   "title": "Gyroid 積層製造熱交換器",
   "creator": "熱流研究（International Journal of Thermal Sciences 論文）",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "Gyroid 把空間分成兩個互不相通、卻彼此緊貼的通道，正好讓冷熱兩股流體各走一邊；金屬 3D 列印可一體成形，不需傳統熱交換器的墊片與組件。研究以 CFD 與實驗分析其流動與傳熱。",
   "variations": [
    {
     "name": "兩側通道分色輸出",
     "how": "分別輸出 f < 0 與 f > 0 兩側的封閉體",
     "effect": "清楚看見兩個互鎖的流道"
    },
    {
     "name": "入口漸變",
     "how": "periods 沿流向漸變，入口大孔、中段小孔",
     "effect": "兼顧壓損與換熱面積"
    },
    {
     "name": "表面積量測",
     "how": "用 AreaMassProperties 計算 Mesh 面積與體積比",
     "effect": "比較不同 isoValue 的換熱面積"
    }
   ],
   "difficulty": 4,
   "tags": [
    "等值面",
    "3D",
    "最佳化"
   ],
   "tools": [
    "CFD",
    "金屬 3D 列印"
   ],
   "url": "https://www.sciencedirect.com/science/article/abs/pii/S1290072925001589"
  },
  {
   "id": "F03-06",
   "algo": "F03",
   "title": "3D 石墨烯 Gyroid：超輕高強材料",
   "creator": "Markus Buehler 團隊（MIT）",
   "year": "2017",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "MIT 研究以 Gyroid 幾何把石墨烯壓成多孔 3D 結構，密度僅鋼的 5% 卻有其 10 倍強度；團隊並把放大數千倍的 Gyroid 模型 3D 列印出來做力學測試，結論是「幾何才是主要因素」。",
   "variations": [
    {
     "name": "壁厚參數化",
     "how": "sheet 版本的 thickness 作為滑桿",
     "effect": "觀察相對密度與形態的關係"
    },
    {
     "name": "列印縮尺試體",
     "how": "輸出 2×2×2 單元的水密 Mesh",
     "effect": "可做簡易壓縮測試的教學試體"
    },
    {
     "name": "與桿件晶格比較",
     "how": "另做一組立方桿件晶格（圖：點＋連線），同重量比較",
     "effect": "體會曲面晶格與桿件晶格差異"
    }
   ],
   "difficulty": 3,
   "tags": [
    "等值面",
    "3D"
   ],
   "tools": [
    "3D 列印",
    "分子模擬"
   ],
   "url": "https://news.mit.edu/2017/3-d-graphene-strongest-lightest-materials-0106"
  },
  {
   "id": "F03-07",
   "algo": "F03",
   "title": "蝴蝶鱗片的 Gyroid 光子晶體（結構色）",
   "creator": "自然界（蝴蝶鱗片、鳥類羽毛）",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "部分蝴蝶翅膀鱗片與鳥類羽毛含有單一 Gyroid 網路的奈米光子晶體，靠光的干涉產生結構色，而不是色素。這說明 TPMS 不只是數學，也是自然界的材料組織方式。",
   "variations": [
    {
     "name": "切片圖樣",
     "how": "取不同 z 的 2D 切片並以 C05 描線",
     "effect": "隨切片高度變化的迷宮花紋，可做一系列表皮圖樣"
    },
    {
     "name": "單側 Gyroid",
     "how": "只保留 f < isoValue 的一側（single network）",
     "effect": "對應自然界中的單一網路結構"
    },
    {
     "name": "色彩映射",
     "how": "依 Mesh 法線方向著色",
     "effect": "模擬隨視角變化的結構色效果"
    }
   ],
   "difficulty": 2,
   "tags": [
    "等值面",
    "對稱"
   ],
   "tools": [],
   "url": "https://en.wikipedia.org/wiki/Gyroid"
  },
  {
   "id": "F03-08",
   "algo": "F03",
   "title": "Axolotl 的 TPMS 晶格元件",
   "creator": "Mathias Bernhard、Benjamin Dillenburger（ETH Zurich DBT）",
   "year": "2019",
   "category": "modeling",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "Axolotl 把 Gyroid、Schwarz 等 TPMS 當作 SDF 物件，可與任意外形做布林並以 Marching Cubes 輸出 Mesh。開發團隊 DBT 長期研究 3D 砂印與建築構件，是基礎範例延伸成「裁進建築構件的晶格」的直接參考。",
   "variations": [
    {
     "name": "晶格裁進構件外形",
     "how": "加入構件 Mesh 的有號距離 d，場值 = max(f, d)",
     "effect": "柱、梁或節點內部的 TPMS 晶格"
    },
    {
     "name": "外殼＋內部晶格",
     "how": "外殼 = |d| − t1，晶格 = max(|f| − t2, d)，兩者取聯集",
     "effect": "外觀完整、內部輕量化的構件"
    },
    {
     "name": "密度依距離漸變",
     "how": "晶格壁厚隨到外殼的距離變化",
     "effect": "表面附近較實、核心較空"
    }
   ],
   "difficulty": 3,
   "tags": [
    "等值面",
    "3D"
   ],
   "tools": [
    "Grasshopper",
    "Python"
   ],
   "url": "https://github.com/GuoyingDong/Axolotl"
  },
  {
   "id": "F03-09",
   "algo": "F03",
   "title": "Digital Grotesque：全尺度 3D 砂印洞窟（製造路徑參考）",
   "creator": "Michael Hansmeyer、Benjamin Dillenburger",
   "year": "2013",
   "category": "fabrication",
   "categories_extra": [
    "3d-architecture",
    "art-installation"
   ],
   "scale": "建築",
   "summary": "首件可進入、全尺度、完全以砂 3D 列印的封閉空間（約 16 平方公尺，2013 年 Archilab 展出）；續作 Digital Grotesque II 以 7 噸砂岩列印。注意：此作品的形體來自細分（subdivision）演算法而非 TPMS，列在此處是作為「複雜多孔幾何可用砂印做到建築尺度」的製造參考。",
   "variations": [
    {
     "name": "以 TPMS 取代細分形",
     "how": "用 sheet 型 Gyroid 填滿洞窟牆體的 SDF 範圍",
     "effect": "同樣多孔、可穿透的砂印牆體，但由公式控制"
    },
    {
     "name": "多尺度疊加",
     "how": "場 = f(大週期) + 0.3·f(小週期)",
     "effect": "大孔中有小孔的多層次紋理"
    },
    {
     "name": "分塊列印",
     "how": "依印表機成型尺寸把 Mesh 切成模組並加上對位榫",
     "effect": "可分件列印、現場組裝的構件"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "多元件"
   ],
   "tools": [
    "砂印（binder jetting）"
   ],
   "url": "https://michael-hansmeyer.com/digital-grotesque-I"
  },
  {
   "id": "F03-10",
   "algo": "F03",
   "title": "Smart Slab：3D 砂印模板澆置混凝土樓板（製造路徑參考）",
   "creator": "Benjamin Dillenburger、Robert Flatt、Joseph Schwartz 等（ETH Zurich，DFAB HOUSE）",
   "year": "2018",
   "category": "fabrication",
   "categories_extra": [
    "performance",
    "3d-architecture"
   ],
   "scale": "構件",
   "summary": "在 Empa NEST 的 DFAB HOUSE 中，以黏著劑噴印（binder jetting）的砂模當模板澆置混凝土，做出肋梁分級的輕量樓板，比一般實心樓板輕約 70%。此案本身不是 TPMS，但示範了把演算法生成的複雜多孔幾何變成建築構件的製造路徑。",
   "variations": [
    {
     "name": "TPMS 砂模",
     "how": "輸出 Gyroid solid 一側作為模具，另一側即為混凝土",
     "effect": "內含雙連通空腔的輕量混凝土構件"
    },
    {
     "name": "依彎矩漸變",
     "how": "isoValue 沿跨度依彎矩大小變化",
     "effect": "支承處密、跨中疏（或相反）的樓板晶格"
    },
    {
     "name": "只做下半部",
     "how": "上半為實心板，下半 z 範圍內才套 TPMS",
     "effect": "平整樓面、下方呈現晶格天花"
    }
   ],
   "difficulty": 5,
   "tags": [
    "3D",
    "最佳化",
    "多元件"
   ],
   "tools": [
    "砂印（binder jetting）",
    "混凝土"
   ],
   "url": "https://dbt.arch.ethz.ch/project/smart-slab/"
  },
  {
   "id": "F03-11",
   "algo": "F03",
   "title": "Minimal Complexity 極小曲面裝置",
   "creator": "Vlad Tenu",
   "year": "2010",
   "category": "art-installation",
   "categories_extra": [
    "3d-architecture",
    "fabrication"
   ],
   "scale": "構件",
   "summary": "以 Schwarz 系列極小曲面單元重複組成的可穿越金屬裝置，是 TEX-FAB 競賽的得獎作品，常被引為 TPMS 進入建築裝置尺度的早期案例。（本條細節未能於本次搜尋中取得網頁佐證，年份與材料請再查證。）",
   "variations": [
    {
     "name": "單元化與展開",
     "how": "只取一個週期的 Mesh，沿對稱面切成可展開的片",
     "effect": "可用金屬板雷切彎折組裝的單元"
    },
    {
     "name": "有限重複",
     "how": "periods 設為非整數並以外形 SDF 裁切",
     "effect": "邊界處自然開口的裝置外形"
    },
    {
     "name": "改成 Schwarz D",
     "how": "切換公式",
     "effect": "更扭轉、更具動感的單元"
    }
   ],
   "difficulty": 4,
   "tags": [
    "3D",
    "對稱"
   ],
   "tools": [],
   "url": ""
  },
  {
   "id": "F03-12",
   "algo": "F03",
   "title": "Gyroid 水凝膠支架：軟組織工程",
   "creator": "Nature Communications 論文作者群",
   "year": "2026",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "以 DLP 生物列印製作含細胞的 Gyroid 水凝膠支架，連續曲面與高連通性支持微血管網路在整個構造中形成。展示了 TPMS 從硬材料（骨、金屬）擴展到軟材料的製造挑戰。",
   "variations": [
    {
     "name": "孔徑控制",
     "how": "由 size ÷ periods 反推單元尺寸，輸出孔徑數值",
     "effect": "依製程解析度選出可列印的單元大小"
    },
    {
     "name": "連通性檢查",
     "how": "對 f < iso 的格點做 flood fill，確認是否一側完全連通",
     "effect": "避免出現封閉死腔"
    },
    {
     "name": "曲率著色",
     "how": "計算 Mesh 頂點曲率並上色",
     "effect": "觀察哪些區域彎曲最大"
    }
   ],
   "difficulty": 4,
   "tags": [
    "等值面",
    "3D"
   ],
   "tools": [
    "DLP 3D 列印"
   ],
   "url": "https://www.nature.com/articles/s41467-026-73452-y"
  },
  {
   "id": "F03-13",
   "algo": "F03",
   "title": "依最佳化壁厚設計的 TPMS 支架",
   "creator": "積層製造研究（PMC 論文）",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "研究以最佳化方法決定 TPMS 支架各處的壁厚，在剛度、滲透率與孔隙率之間取得平衡，並以積層製造實作驗證。對應到基礎範例，就是讓 isoValue／thickness 從常數變成一個空間場。",
   "variations": [
    {
     "name": "壁厚場",
     "how": "thickness(x,y,z) 由外部數值（例如點雲＋插值）提供",
     "effect": "任意分布的漸變壁厚"
    },
    {
     "name": "參數掃描",
     "how": "用迴圈掃過多組 isoValue，記錄體積比（孔隙率）",
     "effect": "得到 isoValue 與孔隙率的對照曲線"
    },
    {
     "name": "搭配 Galapagos",
     "how": "以體積與表面積為目標讓 GH 最佳化器調 periods、isoValue",
     "effect": "自動找出符合目標的晶格參數"
    }
   ],
   "difficulty": 4,
   "tags": [
    "最佳化",
    "3D",
    "等值面"
   ],
   "tools": [
    "積層製造"
   ],
   "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9605549"
  },
  {
   "id": "F04-01",
   "algo": "F04",
   "title": "Autodesk MaRS 多倫多辦公室生成式設計",
   "creator": "The Living（Autodesk Research）",
   "year": "2017",
   "category": "3d-architecture",
   "categories_extra": [
    "performance"
   ],
   "scale": "建築",
   "summary": "為 Autodesk 多倫多辦公室建立可產生上萬種平面配置的幾何系統，以工作型態偏好、鄰接偏好、低干擾、連通性、日光、視野六個目標評分，再用多目標基因演算法 (MOGA) 演化出高分配置，是第一個大規模生成式設計的辦公空間。",
   "variations": [
    {
     "name": "基因改成空間配置參數",
     "how": "把 Candidate 的點陣列換成「每個工作區的位置、方向、大小」參數，評分先生成量塊再算指標。",
     "effect": "從點分散問題變成真正的平面配置最佳化。"
    },
    {
     "name": "六目標改成加權總分",
     "how": "ScoreOf 中各指標正規化到 0–1 後加權相加，權重做成滑桿輸入。",
     "effect": "可以現場調權重，展示不同利害關係人偏好下的最佳方案。"
    },
    {
     "name": "保留整代做散佈圖",
     "how": "每代把所有 Candidate 的兩個指標輸出成點（x = 指標一、y = 指標二）。",
     "effect": "看出方案之間的取捨前緣，對應 Project Discover 的視覺化工具。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "最佳化",
    "多元件",
    "3D"
   ],
   "tools": [
    "Dynamo",
    "Project Refinery",
    "MOGA"
   ],
   "url": "https://www.research.autodesk.com/projects/autodesk-mars"
  },
  {
   "id": "F04-02",
   "algo": "F04",
   "title": "Autodesk University 拉斯維加斯展場配置",
   "creator": "The Living（Autodesk）",
   "year": "",
   "category": "3d-architecture",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "建築",
   "summary": "延續 MaRS 辦公室的流程，將展場攤位與動線配置拆成「建立設計空間、以目標評估、以演化計算迭代」三步驟，用遺傳演算法搜尋同時滿足人流、曝光與實際限制的展場平面。",
   "variations": [
    {
     "name": "攤位中心點當基因",
     "how": "把範例的點直接當攤位中心，評分加入「攤位間距 ≥ 走道寬」懲罰項。",
     "effect": "自動排出不擋走道、又平均分散的攤位。"
    },
    {
     "name": "串接最短路評分",
     "how": "評分時以 F05 計算入口到每個攤位的步行距離，取平均或最大值。",
     "effect": "兼顧可及性，避免偏遠死角攤位。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "最佳化",
    "約束滿足"
   ],
   "tools": [
    "Dynamo",
    "Project Refinery"
   ],
   "url": "https://www.autodesk.com/autodesk-university/article/Generative-Design-Architectural-Space-Planning"
  },
  {
   "id": "F04-03",
   "algo": "F04",
   "title": "An Evolutionary Architecture（演化建築）",
   "creator": "John Frazer",
   "year": "1995",
   "category": "3d-architecture",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "建築",
   "summary": "Frazer 在 AA 的研究與同名展覽／出版品，將建築視為人工生命，以遺傳編碼描述形態規則並透過演化機制產生建築形式，是建築界使用基因演算法的奠基性論述。",
   "variations": [
    {
     "name": "基因控制生成規則而非座標",
     "how": "Candidate 改存規則參數（如 L-System 的角度與代數），評分讀取生成後幾何的特性。",
     "effect": "演化的是「生長規則」，對應 Frazer 基因型／表現型的概念。"
    },
    {
     "name": "環境回饋評分",
     "how": "新增環境輸入（風向或日照向量），評分依形體面對環境的表現決定。",
     "effect": "形體隨環境條件不同而演化出不同結果。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "最佳化",
    "開放生長"
   ],
   "tools": [
    "自製程式"
   ],
   "url": "https://www.aaschool.ac.uk/public/whats-on/an-evolutionary-architecture"
  },
  {
   "id": "F04-04",
   "algo": "F04",
   "title": "Galapagos 演化求解器",
   "creator": "David Rutten",
   "year": "",
   "category": "modeling",
   "categories_extra": [],
   "scale": "物件",
   "summary": "Grasshopper 內建的通用演化求解器：把滑桿或 Gene Pool 當基因、任一數值當適應度，自動搜尋參數空間。Rutten 並撰文討論通用求解器的邏輯與限制，是學習者最常接觸的 GA 工具。",
   "variations": [
    {
     "name": "用 C# 重現 Gene Pool",
     "how": "把 Candidate 改成 double[] genes，範圍與步進對應滑桿設定，評分由另一段程式計算。",
     "effect": "理解 Galapagos 背後在做什麼，並能客製選擇、交配方式。"
    },
    {
     "name": "目標值逼近型適應度",
     "how": "ScoreOf 回傳 −|體積 − 目標體積|，其他步驟不變。",
     "effect": "重現 CMU 講義中「旋轉曲面體積接近 40000」的經典練習。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "最佳化",
    "隨機"
   ],
   "tools": [
    "Grasshopper",
    "Galapagos"
   ],
   "url": "https://www.researchgate.net/publication/264299633_Galapagos_On_the_Logic_and_Limitations_of_Generic_Solvers"
  },
  {
   "id": "F04-05",
   "algo": "F04",
   "title": "Octopus 多目標演化最佳化",
   "creator": "Robert Vierlinger",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "Grasshopper 外掛，操作方式類似 Galapagos，但引入 Pareto 原則同時追求多個目標，輸出一整組互相取捨的最佳解，而非單一答案。",
   "variations": [
    {
     "name": "非支配排序取代單一分數",
     "how": "Candidate 改存 Score1、Score2，排序時先比「被幾個解支配」，再比擁擠距離。",
     "effect": "得到一條 Pareto 前緣，而不是只有一個冠軍。"
    },
    {
     "name": "前緣視覺化",
     "how": "輸出每代非支配解的兩個分數作為點，並連成折線。",
     "effect": "觀察前緣如何隨代數往外推進。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "最佳化",
    "多元件"
   ],
   "tools": [
    "Grasshopper",
    "Octopus"
   ],
   "url": "https://grasshopperdocs.com/addons/octopus.html"
  },
  {
   "id": "F04-06",
   "algo": "F04",
   "title": "Wallacei 多目標演化與都市形態研究",
   "creator": "Mohammed Makki、Milad Showkatbakhsh 等",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "modeling"
   ],
   "scale": "群體／都市",
   "summary": "Wallacei 是 Grasshopper 的多目標演化引擎，附分析與分群工具協助挑選方案；其研究頁收錄以規則式多尺度程序建模結合 MOEA、探討相衝突條件下都市形態變化的研究。",
   "variations": [
    {
     "name": "街廓量體基因",
     "how": "每棟量體的高度與退縮當基因，評分同時算容積率與街道日照。",
     "effect": "得到一系列在密度與日照間取捨的街廓形態。"
    },
    {
     "name": "結果分群",
     "how": "把最後一代的基因向量用 k-means 分成幾群，每群挑一個代表輸出。",
     "effect": "避免挑到一堆長得很像的解，對應 Wallacei 的分群挑選。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "最佳化",
    "3D"
   ],
   "tools": [
    "Grasshopper",
    "Wallacei"
   ],
   "url": "https://www.wallacei.com/research"
  },
  {
   "id": "F04-07",
   "algo": "F04",
   "title": "醫院建築日光與能耗多目標最佳化（阿爾及利亞）",
   "creator": "",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "立面／表皮",
   "summary": "以 Grasshopper 參數模型、Ladybug／Honeybee 模擬日光與能耗、Octopus 基因演算法組成閉迴路，最佳化開窗率、玻璃與遮陽等參數，是性能導向立面設計的典型流程。",
   "variations": [
    {
     "name": "遮陽板角度當基因",
     "how": "每片遮陽板的旋轉角度存成 genes，評分讀取模擬的日光自主率與冷房負荷。",
     "effect": "演化出上下不同角度的遮陽排列。"
    },
    {
     "name": "C# 內簡化日照評分",
     "how": "不接 Honeybee，改在 ScoreOf 內用 Ray 與太陽向量估算被遮蔽比例。",
     "effect": "速度大增，適合基礎範例快速迭代。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "最佳化",
    "多元件"
   ],
   "tools": [
    "Grasshopper",
    "Ladybug",
    "Honeybee",
    "Octopus"
   ],
   "url": "https://www.academia.edu/105936985/Parametric_Based_Multi_Objective_Optimization_Workflow_Daylight_and_Energy_Performance_Study_of_Hospital_Building_in_Algeria"
  },
  {
   "id": "F04-08",
   "algo": "F04",
   "title": "殼體多目標最佳化基準測試（Karamba＋Octopus）",
   "creator": "Alberto Pugnale",
   "year": "2013",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "以 Grasshopper 建立殼體參數模型、Karamba 做有限元素分析、Octopus 進行多目標演化，作為結構形態最佳化的簡單基準範例。",
   "variations": [
    {
     "name": "控制點高度當基因",
     "how": "Candidate 存殼體控制點的 Z 值，評分為 Karamba 回傳的最大位移（取負號）。",
     "effect": "殼體逐代長出拱形以減少變形。"
    },
    {
     "name": "位移與表面積雙目標",
     "how": "同時最小化位移與面積（材料量），用 Pareto 挑選。",
     "effect": "在結構效率與用料間找取捨。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "最佳化",
    "物理模擬",
    "多元件"
   ],
   "tools": [
    "Grasshopper",
    "Karamba3D",
    "Octopus"
   ],
   "url": "https://www.albertopugnale.com/2013/03/30/multi-objective-optimization-of-shells-a-simple-benckmark-with-grasshopper-karamba-and-octopus/"
  },
  {
   "id": "F04-09",
   "algo": "F04",
   "title": "IAAC 結構形態基因最佳化（Karamba＋Galapagos）",
   "creator": "IAAC 學習者專案",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "IAAC 課程將 Karamba 結構分析結果（位移）作為 Galapagos 的適應度，最佳化塔樓斜格構或屋頂的幾何參數，展示教學場景中 GA 與結構分析的整合。",
   "variations": [
    {
     "name": "斜格構密度基因",
     "how": "基因為各樓層斜撐的分割數，評分 = 位移 × 用料量。",
     "effect": "下密上疏的斜格構分布自然浮現。"
    },
    {
     "name": "即時收斂曲線",
     "how": "把 bestScores 接 Quick Graph，比較不同 mutationRate 的收斂速度。",
     "effect": "學習者能判斷何時該停止演化。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "最佳化",
    "物理模擬"
   ],
   "tools": [
    "Grasshopper",
    "Karamba3D",
    "Galapagos"
   ],
   "url": "https://www.iaacblog.com/programs/genetic-optimization-karamba-galapagos/"
  },
  {
   "id": "F04-10",
   "algo": "F04",
   "title": "NASA ST5 演化天線",
   "creator": "NASA",
   "year": "2006",
   "category": "fabrication",
   "categories_extra": [
    "performance"
   ],
   "scale": "物件",
   "summary": "為 Space Technology 5 衛星設計的 X 波段天線，由演化演算法在超級電腦上跑數天找出，形狀怪異到人類設計師不會想到，卻滿足任務要求並實際製造上太空。",
   "variations": [
    {
     "name": "基因改成一串折線段",
     "how": "Candidate 存每段的長度與轉角，生成折線後以限制條件（總長、範圍）加上懲罰。",
     "effect": "演化出扭曲、不直覺的線形構件。"
    },
    {
     "name": "輸出成可彎折線材",
     "how": "最佳折線輸出每段長度與角度表，給手工或 CNC 彎線。",
     "effect": "把演化結果直接變成可製造物件。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "最佳化",
    "3D"
   ],
   "tools": [
    "演化演算法"
   ],
   "url": "https://www.jpl.nasa.gov/nmp/st5/TECHNOLOGY/antenna.html"
  },
  {
   "id": "F04-11",
   "algo": "F04",
   "title": "Evolved Virtual Creatures（演化虛擬生物）",
   "creator": "Karl Sims",
   "year": "1994",
   "category": "art-installation",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以基因演算法同時演化積木生物的形態與神經控制，讓牠們在物理模擬中比賽游泳、行走、跳躍，最成功的個體被複製、交配、突變，是演化計算在圖學與藝術中的經典作品。",
   "variations": [
    {
     "name": "基因是結構圖",
     "how": "Candidate 改存「節點＋連線」的有向圖，交配時交換子圖。",
     "effect": "演化出分支、重複的構件組合。"
    },
    {
     "name": "用模擬結果當分數",
     "how": "每個候選丟進 Kangaroo 模擬一段時間，以移動距離或穩定度評分。",
     "effect": "演化出會站穩或會滾動的形體。"
    }
   ],
   "difficulty": 5,
   "tags": [
    "最佳化",
    "物理模擬",
    "動畫"
   ],
   "tools": [
    "自製程式"
   ],
   "url": "https://www.karlsims.com/evolved-virtual-creatures.html"
  },
  {
   "id": "F04-12",
   "algo": "F04",
   "title": "Genetic Images（互動式影像演化）",
   "creator": "Karl Sims",
   "year": "1993",
   "category": "2d-pattern",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "觀眾在展場中挑選喜歡的抽象影像，被選中的影像基因被複製、組合與突變產生下一代，由人的審美當適應度；曾在龐畢度中心與 Ars Electronica 展出。",
   "variations": [
    {
     "name": "人工選擇取代 ScoreOf",
     "how": "每代輸出 9 組圖樣排成九宮格，用 Value List 選兩個父母。",
     "effect": "以美感而非數值驅動的演化。"
    },
    {
     "name": "基因是公式參數",
     "how": "基因存 F06 吸子的 a、b、c、d 係數，每組畫出一張吸子圖讓人挑。",
     "effect": "互動式演化出喜歡的混沌圖樣。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "隨機",
    "影像輸入"
   ],
   "tools": [
    "自製程式"
   ],
   "url": "https://karlsims.com/"
  },
  {
   "id": "F05-01",
   "algo": "F05",
   "title": "SpiderWeb 圖論與 Space Syntax 外掛",
   "creator": "Richard Schaffranek",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "在 Grasshopper 中由幾何建立圖、計算單源最短路與點對點最短路，並能把 Space Syntax 指標當成設計約束放進參數流程。",
   "variations": [
    {
     "name": "格點改成真正的圖",
     "how": "把 isBlocked 網格換成節點清單＋鄰接表，節點由走廊中心線交點產生。",
     "effect": "可處理不規則平面與多樓層連通。"
    },
    {
     "name": "單源最短路全輸出",
     "how": "拿掉「到終點就 break」，輸出每個節點的距離值。",
     "effect": "得到平均深度（integration）等 Space Syntax 類指標。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "鄰居搜尋"
   ],
   "tools": [
    "Grasshopper",
    "SpiderWeb"
   ],
   "url": "https://grasshopperdocs.com/addons/spiderweb.html"
  },
  {
   "id": "F05-02",
   "algo": "F05",
   "title": "ShortestWalk 曲線網路最短路元件",
   "creator": "Giulio Piacentino（McNeel）",
   "year": "",
   "category": "modeling",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "給一組曲線網路與起終點線段，以拓撲計算加上 A* 搜尋找出網路上的最短路線，是 Grasshopper 最早普及的最短路工具之一。",
   "variations": [
    {
     "name": "改用 A*",
     "how": "選下一格時比較 distance + 到終點直線距離。",
     "effect": "結果相同但展開節點大幅減少。"
    },
    {
     "name": "邊長換成成本",
     "how": "每條曲線可帶一個權重（坡度、寬度），stepDistance 乘上權重。",
     "effect": "找的是「最好走」而非「最短」的路。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "鄰居搜尋"
   ],
   "tools": [
    "Grasshopper",
    "ShortestWalk"
   ],
   "url": "https://www.food4rhino.com/en/app/shortest-walk-gh"
  },
  {
   "id": "F05-03",
   "algo": "F05",
   "title": "LunchBox Shortest Walk 地形步道選線",
   "creator": "Proving Ground",
   "year": "2025",
   "category": "urban-landscape",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "地景",
   "summary": "先把起伏地形細分成含斜撐的網格曲線網路，再以 Shortest Walk 找點與點之間最短步道，用於景觀設計中減少材料、整地與施工成本。",
   "variations": [
    {
     "name": "網格投影到地形",
     "how": "GridPoint 回傳前用 Surface.ClosestPoint 投影到地形，stepDistance 改用 3D 距離。",
     "effect": "路徑會避開陡坡、繞過山丘。"
    },
    {
     "name": "坡度門檻",
     "how": "若相鄰格高差／水平距離大於 1/12 就視為不能走。",
     "effect": "得到符合無障礙規範的步道。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "鄰居搜尋",
    "曲面上"
   ],
   "tools": [
    "Grasshopper",
    "LunchBox"
   ],
   "url": "https://provingground.io/2025/05/06/weekly-workflow-map-the-shortest-walk-between-points-with-lunchbox/"
  },
  {
   "id": "F05-04",
   "algo": "F05",
   "title": "Urban Network Analysis 工具箱",
   "creator": "Andres Sevtsuk（MIT City Form Lab）",
   "year": "2012",
   "category": "urban-landscape",
   "categories_extra": [],
   "scale": "群體／都市",
   "summary": "以街道網路上的最短路為基礎，計算 Reach、Gravity、Betweenness、Closeness、Straightness 等可及性指標，並把建築物當成網路的第三種元素；有 ArcGIS 與 Rhino 版本。",
   "variations": [
    {
     "name": "Reach：半徑內可達數",
     "how": "從每棟建築入口跑 Dijkstra 直到距離超過 radius 就停，數可達的目的地數量。",
     "effect": "得到每棟建築 10 分鐘步行可達的商店數。"
    },
    {
     "name": "Betweenness：路徑疊加",
     "how": "所有建築兩兩求最短路，每條路經過的街段計數加一。",
     "effect": "找出最常被穿越、適合商業的街段。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "鄰居搜尋",
    "最佳化"
   ],
   "tools": [
    "Rhino",
    "ArcGIS"
   ],
   "url": "https://cityform.mit.edu/projects/urban-network-analysis"
  },
  {
   "id": "F05-05",
   "algo": "F05",
   "title": "Urbano 都市步行與設施可及性工具",
   "creator": "Timur Dogan 等",
   "year": "2018",
   "category": "urban-landscape",
   "categories_extra": [
    "performance"
   ],
   "scale": "群體／都市",
   "summary": "Rhino／Grasshopper 的都市移動模擬外掛，可從 GIS 與 OpenStreetMap 載入資料，計算步行至設施與大眾運輸的可及性，協助以移動性為導向的都市設計。",
   "variations": [
    {
     "name": "多起點距離場",
     "how": "把所有捷運站都設成距離 0，輸出每格到最近站的步行距離。",
     "effect": "得到車站步行圈熱圖。"
    },
    {
     "name": "設施吸引力加權",
     "how": "目的地分數 = 設施權重 / 距離，對每個起點加總。",
     "effect": "類似重力模型的可及性指標。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "鄰居搜尋"
   ],
   "tools": [
    "Rhino",
    "Grasshopper",
    "Urbano"
   ],
   "url": "https://www.researchgate.net/publication/325538685_Urbano-_A_New_Tool_to_Promote_Mobility-Aware_Urban_Design_Active_Transportation_Modeling_and_Access_Analysis_for_Amenities_and_Public_Transport"
  },
  {
   "id": "F05-06",
   "algo": "F05",
   "title": "depthmapX 空間網路分析軟體",
   "creator": "Space Group, UCL",
   "year": "",
   "category": "3d-architecture",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "建築",
   "summary": "Space Syntax 研究常用的開源軟體，源自 Alasdair Turner，做可視圖（visibility graph）、軸線與圖分析；其核心是在空間圖上計算步數或角度的最短路深度。",
   "variations": [
    {
     "name": "步數深度取代距離",
     "how": "stepDistance 全部改成 1，輸出每格到起點的步數。",
     "effect": "得到拓撲深度圖，對應 Space Syntax 的 depth。"
    },
    {
     "name": "轉角成本",
     "how": "狀態多記錄「進入方向」，轉向時額外加成本。",
     "effect": "偏好直線少轉彎的路徑，接近角度分析。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "鄰居搜尋",
    "網格擴散"
   ],
   "tools": [
    "depthmapX"
   ],
   "url": "https://github.com/SpaceGroupUCL/depthmapX"
  },
  {
   "id": "F05-07",
   "algo": "F05",
   "title": "cityseer 行人尺度網路分析套件",
   "creator": "Gareth Simons",
   "year": "2021",
   "category": "urban-landscape",
   "categories_extra": [],
   "scale": "群體／都市",
   "summary": "Python 套件，以網路上的最短路距離計算行人尺度的中心性、土地使用可及性與混合度，強調在細緻街道網路上的局部分析。",
   "variations": [
    {
     "name": "距離衰減",
     "how": "把可及性計算成 Σ exp(−β × 距離)，β 做成滑桿。",
     "effect": "距離越遠影響越小的平滑可及性地圖。"
    },
    {
     "name": "只算半徑內",
     "how": "Dijkstra 在 shortest 超過 radius 時直接 break。",
     "effect": "大幅加速，也符合行人步行範圍。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "鄰居搜尋"
   ],
   "tools": [
    "Python"
   ],
   "url": "https://arxiv.org/pdf/2106.15314"
  },
  {
   "id": "F05-08",
   "algo": "F05",
   "title": "Grasshopper 空間可及性分析（圖＋重力模型）",
   "creator": "",
   "year": "",
   "category": "urban-landscape",
   "categories_extra": [
    "performance"
   ],
   "scale": "群體／都市",
   "summary": "在 Grasshopper 中實作的圖—重力整合可及性模型，針對資料稀缺地區，示範改善可及性如何影響多模式交通、就業可達性與行人頻率潛力。",
   "variations": [
    {
     "name": "重力權重",
     "how": "每個目的地有吸引力 w，起點可及性 = Σ w / 距離²。",
     "effect": "可比較方案改造前後的可及性差異。"
    },
    {
     "name": "設計前後比較",
     "how": "同一組起終點在兩組障礙配置下跑兩次，輸出差值熱圖。",
     "effect": "直觀看出新開道路帶來的改善範圍。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "鄰居搜尋"
   ],
   "tools": [
    "Grasshopper"
   ],
   "url": "https://www.researchgate.net/publication/335827215_Applied_Spatial_Accessibility_Analysis_for_Urban_Design_An_integrated_graph-gravity_model_implemented_in_Grasshopper"
  },
  {
   "id": "F05-09",
   "algo": "F05",
   "title": "Pathfinder 人流與避難模擬",
   "creator": "Thunderhead Engineering",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "商用人員移動模擬軟體，處理入場排隊、動線、緊急避難與法規逃生檢討；每個人依門是否可用、標示與警報等調整路線，路線選擇建立在空間中的路徑搜尋上。",
   "variations": [
    {
     "name": "多出口距離場",
     "how": "所有出口設為起點（距離 0），輸出每格到最近出口距離並標出超過法規值的格子。",
     "effect": "快速檢討逃生步行距離是否合規。"
    },
    {
     "name": "關閉一個出口",
     "how": "新增 closedExits 輸入，把該出口的格點設為障礙後重算。",
     "effect": "看出單一出口失效時的最不利位置。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "鄰居搜尋",
    "網格擴散"
   ],
   "tools": [
    "Pathfinder"
   ],
   "url": "https://www.thunderheadeng.com/pathfinder"
  },
  {
   "id": "F05-10",
   "algo": "F05",
   "title": "MEP 管線 A* 自動路由",
   "creator": "josephrewald（GitHub）",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "構件",
   "summary": "以 A* 路徑搜尋求解機電管線（MEP）路由的開源專案，示範把建築設備空間離散化後，自動找出避開障礙的管線路線。",
   "variations": [
    {
     "name": "3D 體素 A*",
     "how": "陣列加一維 z、鄰居改 6 或 26 方向，並用 A* 啟發式加速。",
     "effect": "在梁與樓板之間自動繞行的立體管路。"
    },
    {
     "name": "彎頭懲罰",
     "how": "方向改變時成本加 elbowCost。",
     "effect": "減少彎頭數量，更接近實際施工邏輯。"
    },
    {
     "name": "依序佈多條管",
     "how": "每條管完成後把經過的格子設為障礙，再路由下一條。",
     "effect": "多條管線互不衝突。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "鄰居搜尋",
    "3D"
   ],
   "tools": [
    "Python"
   ],
   "url": "https://github.com/josephrewald/pipe-route-solver"
  },
  {
   "id": "F05-11",
   "algo": "F05",
   "title": "Frei Otto 羊毛線最小路徑系統的數位重現",
   "creator": "Frei Otto（原型實驗）；Grasshopper 社群討論",
   "year": "",
   "category": "fabrication",
   "categories_extra": [
    "urban-landscape"
   ],
   "scale": "群體／都市",
   "summary": "Frei Otto 以浸水羊毛線讓路徑自我聚合成「最小路徑系統」的類比實驗；Grasshopper 論壇上討論以 ShortestWalk 求網路最短路、以 Kangaroo 物理模擬重現羊毛線聚合的做法。",
   "variations": [
    {
     "name": "最短路疊加再合併",
     "how": "所有點兩兩求最短路並疊加流量，流量高的格子成本降低後再跑一輪，反覆數次。",
     "effect": "路徑逐漸合併成少數主幹，接近羊毛線效果。"
    },
    {
     "name": "直線路網對照",
     "how": "同時輸出兩兩直線與最短路疊加結果，計算總長比較。",
     "effect": "展示「總長最短」與「各自最短」的差別。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "鄰居搜尋",
    "物理模擬"
   ],
   "tools": [
    "Grasshopper",
    "ShortestWalk",
    "Kangaroo"
   ],
   "url": "https://www.grasshopper3d.com/forum/topics/minimal-path-system?commentId=2985220%3AComment%3A146627"
  },
  {
   "id": "F06-01",
   "algo": "F06",
   "title": "Clifford Attractors 圖像",
   "creator": "Paul Bourke（公式出自 Clifford Pickover）",
   "year": "2004",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Bourke 以本範例相同的 Clifford 公式產生八組不同係數的吸子，並用 32 位元格子累計每格被點落入的次數（二維直方圖），再後製映射成漸層色，得到細膩的明暗圖像。",
   "variations": [
    {
     "name": "直方圖著色",
     "how": "建立 int[,] 格子累計落點次數，以 log(次數) 映射到 Mesh 頂點色。",
     "effect": "從一堆點變成有光影層次的影像。"
    },
    {
     "name": "係數網格圖鑑",
     "how": "外層雙迴圈掃 a、b 兩個係數，每組吸子平移排成矩陣。",
     "effect": "一次看出係數空間中哪裡最好看。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "混沌"
   ],
   "tools": [
    "C"
   ],
   "url": "https://paulbourke.net/fractals/clifford/"
  },
  {
   "id": "F06-02",
   "algo": "F06",
   "title": "Peter de Jong Attractors 圖像",
   "creator": "Paul Bourke",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以 x' = sin(a·y) − cos(b·x)、y' = sin(c·x) − cos(d·y) 迭代的 de Jong 吸子（出自 1987 年《Scientific American》），同樣以佔有密度直方圖再上色，並可額外編碼曲率等性質。",
   "variations": [
    {
     "name": "新增 de Jong 分支",
     "how": "attractorType == 2 時呼叫 DeJongNext，公式如上。",
     "effect": "只改一行公式就得到完全不同的圖樣族。"
    },
    {
     "name": "匯出灰階圖",
     "how": "直方圖正規化後寫成 Bitmap 存 PNG。",
     "effect": "可拿到 Photoshop 或雷雕機使用。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "混沌"
   ],
   "tools": [
    "C"
   ],
   "url": "https://paulbourke.net/fractals/peterdejong/"
  },
  {
   "id": "F06-03",
   "algo": "F06",
   "title": "Lorenz 水車（混沌的實體模型）",
   "creator": "Willem Malkus、Lou Howard（原型）",
   "year": "",
   "category": "performance",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "Bourke 的 Lorenz 頁面介紹一種會漏水的杯子水車，其轉動方向會混沌地反覆切換，行為與 Lorenz 方程等價；並記錄有人為物理教師研討會實際製作水車。",
   "variations": [
    {
     "name": "以 x 值驅動旋轉",
     "how": "把 Lorenz 的 x 當成轉速，每一步累加角度並旋轉一組物件，接 Timer 播放。",
     "effect": "看到物件忽左忽右不規則地轉動。"
    },
    {
     "name": "時間序列圖",
     "how": "輸出 (step, x) 點畫成折線圖。",
     "effect": "看出兩翼之間無規則跳躍的時間訊號。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "混沌",
    "動畫",
    "物理模擬"
   ],
   "tools": [
    "實體模型"
   ],
   "url": "https://paulbourke.net/fractals/lorenz/"
  },
  {
   "id": "F06-04",
   "algo": "F06",
   "title": "鉤織 Lorenz 流形",
   "creator": "Hinke M. Osinga、Bernd Krauskopf",
   "year": "2004",
   "category": "fabrication",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "兩位數學家以電腦計算出 Lorenz 系統的穩定流形曲面，轉成逐圈的鉤織指示，共 25,511 針、約 85 小時手工完成，讓混沌系統的幾何變成可觸摸的實體。",
   "variations": [
    {
     "name": "多條軌跡成面",
     "how": "從一條短線段上的 N 個起點同時積分，把同一步的點連成截面曲線，再 Loft。",
     "effect": "得到扭轉、捲曲的混沌曲面。"
    },
    {
     "name": "展開成製造指示",
     "how": "每一圈截面曲線依固定弧長等分，輸出每圈的點數表。",
     "effect": "可轉成鉤織、編織或板條組裝的施工表。"
    }
   ],
   "difficulty": 4,
   "tags": [
    "混沌",
    "3D",
    "曲面上"
   ],
   "tools": [
    "自製程式",
    "手工鉤織"
   ],
   "url": "https://www.math.auckland.ac.nz/~hinke/crochet/"
  },
  {
   "id": "F06-05",
   "algo": "F06",
   "title": "Strange Attractors: Creating Patterns in Chaos",
   "creator": "Julien C. Sprott",
   "year": "1993",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以電腦自動挑選二次映射與微分方程的係數，篩出會產生混沌吸子的組合，產生超過 350 個範例圖樣，並附原始碼與 3D 立體、聲音化等延伸。",
   "variations": [
    {
     "name": "隨機係數＋篩選",
     "how": "迴圈隨機產生 a–d，跑 2000 步後若發散或點雲範圍太小就丟掉，否則輸出。",
     "effect": "自動產出一大批合格吸子。"
    },
    {
     "name": "Lyapunov 指數判斷",
     "how": "同時追蹤相距 1e-8 的兩點，累加 log(距離成長比) 平均，正值才算混沌。",
     "effect": "用數值標準而非肉眼判斷好壞。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "混沌",
    "隨機",
    "可重現種子"
   ],
   "tools": [
    "BASIC",
    "自製程式"
   ],
   "url": "https://sprott.physics.wisc.edu/sa.htm"
  },
  {
   "id": "F06-06",
   "algo": "F06",
   "title": "Chimpanzee 碎形與混沌外掛",
   "creator": "Matous Stieber",
   "year": "2019",
   "category": "modeling",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "Grasshopper 外掛，提供約 70 個碎形與混沌元件，包含 Lorenz、Rössler、Chen、Halvorsen、Burke-Shaw 等吸子系統，可直接在參數流程中產生吸子軌跡。",
   "variations": [
    {
     "name": "自己寫更多系統",
     "how": "照 LorenzNext 的格式新增 Halvorsen 或 Chen 的速度公式。",
     "effect": "理解外掛元件背後只是換一組速度方程。"
    },
    {
     "name": "軌跡接 Pipe",
     "how": "curve 輸出接 Rebuild 再接 Pipe，半徑依點序變化。",
     "effect": "快速得到可渲染的吸子雕塑。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "混沌",
    "3D"
   ],
   "tools": [
    "Grasshopper",
    "Chimpanzee"
   ],
   "url": "https://grasshopperdocs.com/addons/chimpanzee.html"
  },
  {
   "id": "F06-07",
   "algo": "F06",
   "title": "Coding Challenge #12：Lorenz Attractor",
   "creator": "The Coding Train（Daniel Shiffman）",
   "year": "2016",
   "category": "drawing",
   "categories_extra": [
    "art-installation"
   ],
   "scale": "物件",
   "summary": "在 Processing 中逐步推進 Lorenz 方程並即時畫出軌跡，加上顏色漸變與 PeasyCam 3D 旋轉，是最常被引用的吸子入門教學，有 p5.js 版本。",
   "variations": [
    {
     "name": "Timer 逐步生長",
     "how": "把 current 與 path 改成類別欄位，接 Timer 每次加 10 步。",
     "effect": "看見蝴蝶曲線一筆一筆畫出來。"
    },
    {
     "name": "依速度上色",
     "how": "每段線依速度大小映射 HSV 色相輸出成彩色線段。",
     "effect": "快慢區段一目了然。"
    }
   ],
   "difficulty": 1,
   "tags": [
    "混沌",
    "動畫",
    "3D"
   ],
   "tools": [
    "Processing",
    "p5.js"
   ],
   "url": "https://thecodingtrain.com/challenges/12-lorenz-attractor"
  },
  {
   "id": "F06-08",
   "algo": "F06",
   "title": "Strange Attractor（堪薩斯市國際機場公共藝術）",
   "creator": "Alice Aycock",
   "year": "",
   "category": "art-installation",
   "categories_extra": [
    "3d-architecture"
   ],
   "scale": "建築",
   "summary": "Aycock 以旋風、亂流為題的大型金屬公共雕塑之一，設置於堪薩斯市國際機場；她的同系列作品以 3D 建模後切割、滾彎金屬板製作，可作為「以混沌意象轉成大尺度雕塑」的參照。",
   "variations": [
    {
     "name": "軌跡轉帶狀面",
     "how": "沿 Lorenz 曲線每一點取切線與法向，兩側偏移後 Loft 成扭轉帶。",
     "effect": "像緞帶般扭轉的空間雕塑。"
    },
    {
     "name": "展開成可滾彎板件",
     "how": "帶狀面分段後用 Unroll 展開輸出板件外框。",
     "effect": "可用金屬板切割、滾彎組裝。"
    }
   ],
   "difficulty": 3,
   "tags": [
    "混沌",
    "3D"
   ],
   "tools": [
    "3D 建模",
    "金屬加工"
   ],
   "url": "https://en.wikipedia.org/wiki/Alice_Aycock"
  },
  {
   "id": "F06-09",
   "algo": "F06",
   "title": "vpype-fractal 筆繪機碎形與吸子外掛",
   "creator": "mreierson（GitHub）",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "fabrication"
   ],
   "scale": "物件",
   "summary": "vpype 的外掛，產生 L-System、IFS、奇異吸子等碎形並輸出成 pen plotter 可繪製的向量線條，是吸子轉成實體繪圖的典型流程。",
   "variations": [
    {
     "name": "點雲轉短筆畫",
     "how": "Clifford 每個點輸出成極短線段（或把相鄰落點連成小段），避免筆繪機只打點。",
     "effect": "點描風格的筆繪作品。"
    },
    {
     "name": "單線化輸出",
     "how": "Lorenz 投影到 XY，Polyline.ReduceSegments 後匯出 SVG／DXF。",
     "effect": "一筆畫到底、筆繪機效率高。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "混沌"
   ],
   "tools": [
    "Python",
    "vpype",
    "Pen plotter"
   ],
   "url": "https://github.com/mreierson/vpype-fractal"
  },
  {
   "id": "F06-10",
   "algo": "F06",
   "title": "Strange Attractors WebGL 互動繪圖",
   "creator": "piellardj（GitHub）",
   "year": "",
   "category": "2d-pattern",
   "categories_extra": [
    "drawing"
   ],
   "scale": "物件",
   "summary": "以 WebGL 在瀏覽器中高速繪製二維奇異吸子，圖像由大量隨機起點的軌跡疊加而成，可即時調整公式與係數。",
   "variations": [
    {
     "name": "多隨機起點疊加",
     "how": "外層迴圈用 Random(seed) 產生 N 個起點，各跑固定步數後合併點雲。",
     "effect": "更快得到均勻、飽滿的吸子影像。"
    },
    {
     "name": "即時滑桿探索",
     "how": "把 a–d 接滑桿並限制 steps，讓 GH 即時重算。",
     "effect": "親身體驗係數敏感度。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "混沌",
    "隨機"
   ],
   "tools": [
    "WebGL",
    "TypeScript"
   ],
   "url": "https://github.com/piellardj/strange-attractors-webgl"
  },
  {
   "id": "F06-11",
   "algo": "F06",
   "title": "Visions of Chaos 混沌探索軟體",
   "creator": "Softology",
   "year": "",
   "category": "drawing",
   "categories_extra": [
    "2d-pattern"
   ],
   "scale": "物件",
   "summary": "涵蓋大量混沌與生成系統的免費軟體，內含 2D 與 3D 奇異吸子模式，讓使用者不必處理方程式就能調參探索，也是找靈感與係數的資料庫。",
   "variations": [
    {
     "name": "3D 點雲體積渲染",
     "how": "3D 吸子點落入 3D 體素格累計密度，再以密度門檻輸出 Mesh（接 Marching Cubes）。",
     "effect": "得到雲霧狀、可 3D 列印的吸子體積。"
    },
    {
     "name": "預設係數庫",
     "how": "把好看的係數組存成 List，用 Value List 切換。",
     "effect": "快速展示不同吸子。"
    }
   ],
   "difficulty": 2,
   "tags": [
    "混沌",
    "3D"
   ],
   "tools": [
    "Visions of Chaos"
   ],
   "url": "https://softology.pro/voc.htm"
  }
 ]
};
