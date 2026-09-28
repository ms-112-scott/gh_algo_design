# gh-new-algos 探索報告｜R20260928-2216（propose）

> 本報告由協調流程依 `selected.json` 產生（挑選與收尾的子代理無法寫入 .md，內容與 selected.json 一致）。

## 總覽

- 5 個探索方向（x1 A/F、x2 B/C、x3 D/E、x4 全新家族、x5 外部稽核）共提出 43 個新候選，跨方向去重後剩 30 個（K01–K30）。
- 3 個審查代理查證後：通過 25、改判為既有演算法變形 5、淘汰 0。
- 挑選規則：總分下限 14、同家族上限 3、最多 8 個；本次入選線為審查後 **17 分**。
- **入選 8 個**，其中 3 個組成新家族 **G 空間分析**；另有 28 筆建議併入既有演算法當變形。

## 入選清單

| 編號 | 名稱 | 家族 | 審查後分數 | 提出方向 | 難度 | 預估行數 | 代表案例 |
|---|---|---|---|---|---|---|---|
| G01 | Isovist 可視域與可見性圖分析<br>Isovist & Visibility Graph Analysis (VGA) | G 空間分析 | 19 | x4_family、x5_audit | 2 | 150–250 | Exploring Isovist Fields: Space and Shape in Architectural and Urban Morphology（Michael Batty，2001） |
| G02 | 太陽包絡（Solar Envelope）<br>Solar Envelope | G 空間分析 | 18 | x4_family、x5_audit | 3 | 200–300 | Solar Carve（40 Tenth Ave）（Studio Gang，2019） |
| G03 | 地表逕流與集水區（D8 流向累積）<br>Flow Accumulation & Watershed Delineation (D8) | G 空間分析 | 18 | x2_BC | 3 | 150–260 行 | Groundhog（Philip Belesky（RMIT 景觀建築），2018） |
| F07 | 模擬退火（以房間鄰接配置為例）<br>Simulated Annealing (with Quadratic-Assignment Room Layout) | F 圖樣與最佳化 | 18 | x1_AF、x4_family、x5_audit | 3 | 150–250 行 | Architectural Layout Design through Simulated Annealing Algorithm（以模擬退火做建築配置設計）（Hao Zheng、Yue Ren，2020） |
| F08 | 最小生成樹與 Steiner 樹<br>Minimum Spanning Tree & Steiner Tree | F 圖樣與最佳化 | 18 | x1_AF、x4_family | 3 | 120–220 行（MST 約 60 行，Steiner 改良另加 80–150 行） | Occupying and Connecting（佔據與連結：以最少路徑連接聚落的研究）（Frei Otto（與 Berthold Burkhardt），2009） |
| E05 | 圖解靜力學（索多邊形與力圖）<br>Graphic Statics (Funicular Polygon & Force Diagram) | E 排列與鬆弛 | 18 | x5_audit | 2 | 120–220 行（索多邊形與三點求極點；Cremona 力圖另加約 150 行） | Eiffel Tower（艾菲爾鐵塔）（Maurice Koechlin（Gustave Eiffel 公司），1889） |
| E06 | 力密度法（FDM）<br>Force Density Method (FDM) | E 排列與鬆弛 | 17 | x5_audit、x3_DE | 4 | 150–250 行 | Design process for prototype concrete shells using a hybrid cable-net and fabric formwork（NEST HiLo 原型殼）（Diederik Veenendaal、Philippe Block（ETH Zürich BLOCK Research Group），2014） |
| B06 | 離散聚合（連接點規則生長）<br>Discrete Aggregation (Connection-based Stochastic Aggregation) | B 生長 | 17 | x2_BC | 3 | 220–320 行 | Wasp：Combinatorial Design with Grasshopper（Andrea Rossi（TU Darmstadt DDU），2017） |

### G01 Isovist 可視域與可見性圖分析（Isovist & Visibility Graph Analysis (VGA)）

- **一句話**：從一點向四周打出射線，碰到牆就停，連起來就是「站在這裡看得到的範圍」；把平面上每一格都算一次，就得到顯示開闊、隱蔽與視覺連通程度的可視域地圖。
- **為什麼收**：審查後全場最高分（19），兩個探索方向都提出；射線與牆求交、依極角排序組成可視多邊形是圖鑑完全沒有的機制，Benedikt、Batty、Turner 等 isovist／VGA 研究都是真實的建築與都市空間分析。
- **分數**：新穎 4、建築相關 5、可教性 4、可行性 5，自評 18，審查調整 +1
- **邏輯**：幾何轉換、直接公式
- **建築／研究案例**：
  - [Exploring Isovist Fields: Space and Shape in Architectural and Urban Morphology](https://econpapers.repec.org/RePEc:sae:envirb:v:28:y:2001:i:1:p:123-150)｜Michael Batty｜2001
  - [From Isovists to Visibility Graphs: A Methodology for the Analysis of Architectural Space](https://econpapers.repec.org/RePEc:sae:envirb:v:28:y:2001:i:1:p:103-121)｜Alasdair Turner、Maria Doxa、David O'Sullivan、Alan Penn｜2001
  - [DeCodingSpaces：2D 與 3D isovist 可視性分析教學](https://toolbox.decodingspaces.net/tutorial-2d-and-3d-isovists-for-visibility-analysis/)｜Martin Bielik、Ekaterina Fuchkina、Sven Schneider、Reinhard Koenig｜2019
  - [Spatio-visual experience of movement through the Yuyuan Garden: A computational analysis based on isovists and visibility graphs](https://api.crossref.org/works/10.1016/j.foar.2018.08.003)｜Rongrong Yu、Michael J. Ostwald｜2018
  - [Prospect-Refuge theory and the textile-block houses of Frank Lloyd Wright: An analysis of spatio-visual characteristics using isovists](https://api.crossref.org/works/10.1016/j.buildenv.2014.05.026)｜Michael J. Dawes、Michael J. Ostwald｜2014
- **creative coding 參考**：
  - [2D Visibility（2D 可視範圍演算法互動解說）](https://www.redblobgames.com/articles/visibility/)｜Amit J. Patel（Red Blob Games）
  - [Sight & Light：2D 視線與光影效果教學](https://ncase.me/sight-and-light/)｜Nicky Case
- **建立時注意**：
  - DeCodingSpaces 同站首頁已是 D03 案例，本案例摘要要寫 isovist 場在其中的角色。
  - VGA 平均深度延伸要和 to_variation 的 F05「網路中心性」變形劃清界線：本演算法的圖由「互相看得到」建邊。
  - ncase.me〈Sight & Light〉頁面未署名，作者依網域判定為 Nicky Case，引用時要再確認。
  - 只有 1 筆文獻（Benedikt 1979），建立時補 1–2 筆，並把研究案例補到 5 個以上。

### G02 太陽包絡（Solar Envelope）（Solar Envelope）

- **一句話**：先用天文公式算出冬季關鍵時段的太陽方向，再從鄰地要保護的邊界沿陽光反推，得到一個在這些時段都不會遮到鄰居的最大可建量體。
- **為什麼收**：審查加 1 分（18），兩個方向提出，建築相關性 5；用太陽位置公式加遮陰線約束直接求出可建高度場，Knowles 的太陽包絡與 Studio Gang 的 Solar Carve 是代表作，200 行內可完成。
- **分數**：新穎 4、建築相關 5、可教性 4、可行性 4，自評 17，審查調整 +1
- **邏輯**：直接公式、幾何轉換
- **建築／研究案例**：
  - [Solar Carve（40 Tenth Ave）](https://studiogang.com/projects/40-tenth-ave)｜Studio Gang｜2019
  - [SolCAD: 3D Spatial Design Tool to Generate Solar Envelope](https://papers.cumincad.org/data/works/att/acadia03_052.content.pdf)｜Manu Juyal、Karen Kensek、Ralph Knowles｜2003
  - [Ladybug Solar Envelope 元件](https://grasshopperdocs.com/components/ladybug/solarEnvelope.html)｜Ladybug Tools｜
  - [On the use of 'solar volume' for determining the urban fabric](https://api.crossref.org/works/10.1016/s0038-092x(00)00088-8)｜Isaac G. Capeluto、Edna Shaviv｜2001
- **creative coding 參考**：
  - [SunCalc：計算太陽位置與日出日落的 JavaScript 函式庫](https://github.com/mourner/suncalc)｜mourner（Vladimir Agafonkin）
- **建立時注意**：
  - 機制要區分方向：沿陽光行進方向（影子方向）量到鄰地遮陰線得到的是「日照權包絡」（不遮鄰居）；朝太陽方向追溯得到的是「日照收集包絡」，可以當變形。
  - Ladybug Solar Envelope 元件是外掛，只能當對照說明，C# 範例要自寫太陽位置公式（赤緯、時角、高度角、方位角）。

### G03 地表逕流與集水區（D8 流向累積）（Flow Accumulation & Watershed Delineation (D8)）

- **一句話**：讓地形上的每一格把雨水交給八個鄰居中最陡的下坡那格，再從高到低把水量一路累加，累積量大的格子連起來就是河網，流向同一出口的格子就是一個集水區。
- **為什麼收**：18 分、建築相關性 5；每格一個下游指標的流向樹、依高程排序累加、Priority-Flood 填窪與反向追溯切集水區，把景觀水文分析帶進圖鑑，和 C04 的水滴粒子侵蝕、C03 的單條流線在機制與產出上都不同。
- **分數**：新穎 4、建築相關 5、可教性 4、可行性 5，自評 18，審查調整 +0
- **邏輯**：搜尋／求解
- **建築／研究案例**：
  - [Groundhog](https://philipbelesky.com/projects/groundhog)｜Philip Belesky（RMIT 景觀建築）｜2018
  - [Integrated Stormwater Analysis Model to Support Sustainable Urban Green Space Design](https://isprs-annals.copernicus.org/articles/X-4-W2-2022/153/2022/isprs-annals-X-4-W2-2022-153-2022.pdf)｜J. Jia, S. Zlatanova, K. Zhang, H. Liu｜2022
  - [A multi-objective optimization framework for terrain modification based on a combined hydrological and earthwork cost-benefit](https://arxiv.org/abs/2401.02698)｜Hanwen Xu, Mark Randall, Lei Li, Yuyi Tan, Thomas Balstrøm｜2024
- **creative coding 參考**：
  - [Mapgen4 Procedural Map Generator](https://www.redblobgames.com/maps/mapgen4/)｜Amit J. Patel（Red Blob Games）
- **建立時注意**：
  - ISPRS 2022 論文本身用 Grasshopper 粒子系統，D8 只在背景段落提到：摘要寫成「把逕流分析整合進都市綠地設計」，不可寫成 D8 實作。
  - Mapgen4 已是 E02 案例，跨演算法引用時摘要要寫它以流量累積長出河網的角色。
  - Priority-Flood 需要優先佇列：Rhino 8 可用 .NET 的 PriorityQueue，Rhino 7 要自寫二元堆積，範例註解要說明。
  - 研究案例目前 3 個，建立時要補到 5 個以上（Groundhog 是最貼切的 GH 實作）。

### F07 模擬退火（以房間鄰接配置為例）（Simulated Annealing (with Quadratic-Assignment Room Layout)）

- **一句話**：只拿一個方案反覆小改：變好就收，變差也有機會收，但「溫度」越降越低、越來越不肯接受變差，於是能跳出小山谷找到更好的配置。
- **為什麼收**：三個探索方向都提出（18）；只維持一個方案、以溫度與 Metropolis 準則接受變差解，和 F04 基因演算法的族群搜尋形成「單點 vs 族群」對照，QAP 房間鄰接配置直接對應建築平面問題。
- **分數**：新穎 4、建築相關 4、可教性 5、可行性 5，自評 18，審查調整 +0
- **邏輯**：搜尋／求解
- **建築／研究案例**：
  - [Architectural Layout Design through Simulated Annealing Algorithm（以模擬退火做建築配置設計）](https://papers.cumincad.org/data/works/att/caadria2020_024.pdf)｜Hao Zheng、Yue Ren｜2020
  - [Galapagos 的模擬退火求解器（論壇說明）](https://www.grasshopper3d.com/forum/topics/about-simulated-annealing-solver-in-galapagos)｜David Rutten（McNeel）｜2016
  - [Optimally Directed Shape Generation by Shape Annealing（形狀退火）](https://doi.org/10.1068/b200005)｜Jonathan Cagan、William J. Mitchell｜1993
  - [Make it Home: Automatic Optimization of Furniture Arrangement](https://www.saikit.org/static/projects/furniture/index.html)｜Lap-Fai Yu、Sai-Kit Yeung、Chi-Keung Tang、Demetri Terzopoulos、Tony F. Chan、Stanley J. Osher｜2011
  - [Interactive furniture layout using interior design guidelines](https://history.siggraph.org/learning/interactive-furniture-layout-using-interior-design-guidelines-by-merrell-schkufza-li-agrawala-and-koltun/)｜Paul Merrell、Eric Schkufza、Zeyang Li、Maneesh Agrawala、Vladlen Koltun｜2011
  - [eifForm: A Generative Structural Design System](https://www.acsa-arch.org/proceedings/Technology%20Proceedings/ACSA.Tech.2000/ACSA.Tech.2000.13.pdf)｜Kristina Shea（University of Cambridge）｜2000
  - [Innovative dome design: Applying geodesic patterns with shape annealing](https://api.crossref.org/works/10.1017/s0890060400003310)｜Kristina Shea、Jonathan Cagan｜1997
- **creative coding 參考**：
  - [The Traveling Salesman with Simulated Annealing, R, and Shiny](https://toddwschneider.com/posts/traveling-salesman-with-simulated-annealing-r-and-shiny/)｜Todd W. Schneider
- **建立時注意**：
  - eifForm（與 A05-12 同網址）與 Rutten 2013〈Galapagos: On the Logic and Limitations of Generic Solvers〉（與 F04-04 同一作品）是跨演算法引用，摘要必須寫模擬退火在其中的角色。
  - Merrell 等 2011 用的是 Monte Carlo 取樣（MCMC），不算嚴格的模擬退火，列為次要或不收。
  - 可在變形中和 to_variation 的 F04「粒子群最佳化」一起做成單點、族群、群體三種搜尋的對照。
  - creative coding 案例目前只有 1 個，建立時要補到 3 個以上。

### F08 最小生成樹與 Steiner 樹（Minimum Spanning Tree & Steiner Tree）

- **一句話**：用最少的總長度把所有點連成一張不繞圈的網：先按長度由短到長挑邊、會成環就跳過；再在分岔處加入 120° 的 Steiner 點，讓網路更短。
- **為什麼收**：18 分、兩個方向提出；排序加並查集的 Kruskal 貪婪法與 Steiner 點的 120° 條件，和 F05 的兩點最短路互補（連起全部點 vs 兩點之間），產出樹狀網路，適合放在 F05 旁邊對照。
- **分數**：新穎 4、建築相關 4、可教性 5、可行性 5，自評 18，審查調整 +0
- **邏輯**：搜尋／求解、幾何轉換
- **建築／研究案例**：
  - [Occupying and Connecting（佔據與連結：以最少路徑連接聚落的研究）](https://evolutionaryurbanism.com/2018/11/14/occupying-and-connecting-frei-otto/)｜Frei Otto（與 Berthold Burkhardt）｜2009
  - [Universal Model of Urban Street Networks（以生成樹為骨幹的都市街道網路模型）](https://arxiv.org/abs/2509.21931)｜Marc Barthelemy、Geoff Boeing｜2025
  - [Euclidean Steiner tree algorithm applied to street networks?（Grasshopper 以 Steiner 樹生成街網）](https://discourse.mcneel.com/t/euclidean-steiner-tree-algorithm-applied-to-street-networks/72892)｜McNeel 論壇（mcfjoshua 發問，Laurent Delrieu 等回覆）｜2018
  - [An Extended Minimum Spanning Tree method for characterizing local urban patterns](https://doi.org/10.1080/13658816.2017.1384830)｜Bin Wu、Bailang Yu、Qiusheng Wu、Zuoqi Chen、S. Yao、Yan Huang、Jianping Wu｜2018
  - [Rules for Biologically Inspired Adaptive Network Design（黏菌網路與東京鐵路網）](https://doi.org/10.1126/science.1177894)｜Atsushi Tero、中垣俊之等｜2010
- **creative coding 參考**：
  - [Maze Generation: Kruskal's Algorithm（以 Kruskal 生成迷宮）](https://weblog.jamisbuck.org/2011/1/3/maze-generation-kruskal-s-algorithm)｜Jamis Buck
- **建立時注意**：
  - Tero 等 2010（黏菌與東京鐵路網）已是 D02-01（同 DOI），跨演算法引用要寫生成樹在其中的角色，或改用其他案例。
  - Frei Otto〈Occupying and Connecting〉和 F05-11 羊毛線最小路徑屬同一研究脈絡，而且頁面只談較短路徑，沒有直接提到生成樹或 Steiner，摘要不可過度宣稱。
  - McNeel 論壇串的回覆主要是 Shortest Walk 與邊束化，不是 Steiner 演算法本身，只能當討論脈絡。
  - 建立時務必補一件直接使用最小生成樹或 Steiner 樹的設計案例；Steiner 部分以啟發式（插入 Fermat 點＋Weiszfeld 鬆弛）實作，並在文字註明不是精確解。

### E05 圖解靜力學（索多邊形與力圖）（Graphic Statics (Funicular Polygon & Force Diagram)）

- **一句話**：不列方程式而是作圖：把載重依序接成一條力的折線，從一個極點拉出射線，再平行畫回形狀圖，就得到剛好只受拉的索或只受壓的拱，每段內力直接用線段長度讀出來。
- **為什麼收**：18 分、難度 2；形狀圖與力圖互為對偶的幾何作圖一次求出索多邊形與內力，是結構找形最直觀的入門，和 E04 動態鬆弛、E06 力密度法組成「迭代模擬／線性求解／幾何作圖」三種找形的對照。
- **分數**：新穎 4、建築相關 4、可教性 5、可行性 5，自評 18，審查調整 +0
- **邏輯**：幾何轉換、直接公式
- **建築／研究案例**：
  - [Eiffel Tower（艾菲爾鐵塔）](https://trako.arch.rwth-aachen.de/cms/trako/forschung/bautechnikgeschichte/~mmso/maurice-koechlin-der-eigentliche-erfin/?lidx=1)｜Maurice Koechlin（Gustave Eiffel 公司）｜1889
  - [As Hangs the Flexible Line: Equilibrium of Masonry Arches](https://api.crossref.org/works/10.1007/s00004-006-0015-9)｜Philippe Block、Matt DeJong、John Ochsendorf｜2006
- **creative coding 參考**：
  - [Active Statics](http://acg.media.mit.edu/people/simong/statics/data/)｜Simon Greenwold、Edward Allen（MIT）
  - [i3DGS: interactive 3D/Polyhedral Graphic Statics](https://psl.design.upenn.edu/i3dgs/)｜Hua Chai、Wenxi Chen、Masoud Akbarzadeh（UPenn Polyhedral Structures Lab）
- **建立時注意**：
  - 和 E06 力密度法互相連結：兩者同屬平衡找形，差在一個幾何作圖、一個解矩陣。
  - 目前只有 2 個建築案例與 1 筆文獻，建立時要補到研究案例 5 個以上（例如推力線分析的石拱與薄殼研究），每一筆都要重新查證。

### E06 力密度法（FDM）（Force Density Method (FDM)）

- **一句話**：替索網裡每一根索指定「拉力 ÷ 長度」的力密度，整張網的平衡形狀就變成一組線性方程式，一次解出來，不必像動態鬆弛那樣慢慢晃到靜止。
- **為什麼收**：17 分、兩個方向提出、建築相關性 5；以連接矩陣加力密度把平衡方程一次線性求解，是慕尼黑奧林匹克屋頂以來的標準找形法，和 E04 顯式時間積分的機制與資料結構都不同。
- **分數**：新穎 4、建築相關 5、可教性 4、可行性 4，自評 17，審查調整 +0
- **邏輯**：搜尋／求解
- **建築／研究案例**：
  - [Design process for prototype concrete shells using a hybrid cable-net and fabric formwork（NEST HiLo 原型殼）](https://block.arch.ethz.ch/brg/files/2014-veendendaal-engstruct-design-process-for-prototype-concrete-shells-using-a-hybrid-cable-net-and-fabric-formwork_1402752074.pdf)｜Diederik Veenendaal、Philippe Block（ETH Zürich BLOCK Research Group）｜2014
  - [JAX FDM: A differentiable solver for inverse form-finding](https://arxiv.org/abs/2307.12407)｜Rafael Pastrana、Deniz Oktay、Ryan P. Adams、Sigrid Adriaenssens｜2023
  - [慕尼黑奧林匹克屋頂索網的找形計算（FDM 的誕生場景）](https://blockresearchgroup.gitbook.io/compas-fofin/theoretical-background/force-densities-method)｜H.-J. Schek（FDM）；屋頂設計 Frei Otto、Günter Behnisch｜1972
  - [COMPAS FD：以力密度法做約束找形](https://github.com/blockresearchgroup/compas_fd)｜Block Research Group（ETH Zurich）｜
- **creative coding 參考**：
  - [Force_Density_Method（Python 實作）](https://github.com/sevamoo/Force_Density_Method)｜Vahid Moosavi
- **建立時注意**：
  - Kurilpa Bridge 條目完全沒提到力密度法或任何找形方法，審查建議刪除（已移到 dropped_cases）。
  - COMPAS FoFin 頁談的慕尼黑奧林匹克屋頂和 E04-01 是同一座建築，摘要要限定在「FDM 因此案而生」。
  - Veenendaal & Block 2014 的 PDF 無法直接開啟，是以搜尋結果確認標題、作者與期刊卷期，建立時再確認一次。
  - 自寫高斯消去或共軛梯度，範例限定 1,000 個自由點以內；和 E04 V06 Kinetic Damping 不同層次，文字要交代。

### B06 離散聚合（連接點規則生長）（Discrete Aggregation (Connection-based Stochastic Aggregation)）

- **一句話**：每個模組身上有幾個「接頭平面」，電腦反覆挑一個還空著的接頭、依規則把新模組對齊接上，撞到既有模組就放棄，於是一顆顆零件自己長成可拆裝的量體。
- **為什麼收**：17 分、建築相關性 5；開放接頭前緣清單、平面到平面對齊與碰撞拒絕，是 Wasp 與離散建築（Retsin、Sanchez）的核心機制，在自由 3D 空間逐件做加法，和 A05 形狀文法、A06 WFC、B02 DLA 都不同。
- **分數**：新穎 4、建築相關 5、可教性 4、可行性 4，自評 17，審查調整 +0
- **邏輯**：迭代模擬、幾何轉換
- **建築／研究案例**：
  - [Wasp：Combinatorial Design with Grasshopper](https://github.com/ar0551/Wasp)｜Andrea Rossi（TU Darmstadt DDU）｜2017
  - [Tallinn Architecture Biennale Pavilion](https://www.designboom.com/architecture/gilles-retsin-pavilion-tallin-architecture-biennale-12-04-2017/)｜Gilles Retsin Architecture｜2017
  - [Combinatorial Nest（Combo-nest）](https://www.plethora-project.com/combinatorial-nest)｜Jose Sanchez／Plethora Project（主設計 Brendan Ho）｜2019
- **creative coding 參考**：
  - [Jigsaw Block（程序化結構拼接）](https://minecraft.wiki/w/Jigsaw_Block)｜Mojang Studios（Minecraft）
- **建立時注意**：
  - 和 A05 變形 V02（機率文法）、V05（3D 方塊）、V08（不可重疊）的組合有部分重疊，教學重點要放在開放接頭前緣與零件連接圖。
  - Gilles Retsin 的塔林雙年展館是手動組合的離散構件，不是隨機聚合生成，摘要要寫清楚它在本演算法中的角色（離散構件思維的代表）。
  - 研究案例目前 3 個、creative coding 1 個，建立時要補齊到 5＋3。

## 新家族

### G 空間分析（Spatial Analysis）

- **定義**：以基地既有條件（牆與障礙物、太陽軌跡、地形）為輸入，用射線投射、光線約束、下坡流向等空間關係逐點計算，產出分析場（可視域、河網、集水區），或由這些關係反推可建的形體；重點在「讀懂基地」：看得到什麼、曬得到多少、水往哪裡流，而不是從無到有生成形體。
- **和既有家族的界線**：C 場與擴散的場由公式、雜訊或擴散等局部規則「生成」；G 的場來自對既有幾何的查詢（射線與牆求交、太陽方向約束、每格指向最陡下坡），答案由基地條件決定。D03 只把可見度當人流權重、F04 只把日照或視野當適應度評分、F05 解兩點之間的最短路，都沒有教這些分析本身怎麼算。
- **配色**：主色 `#C8378B`、淺色 `#F8E1EE`、深色 `#962466`。洋紅色系：和 A 橘紅（色相約 14°）、D 紫（約 267°）都相差約 50° 以上，也和 B 綠、C 藍、E 琥珀、F 青綠明顯不同。
- **本次成員**：G01、G02、G03
- **之後的候選**：K17 格子波茲曼風場（風環境）；K04 以外的網路分析（例如 VGA 平均深度，需與 F05 的網路中心性變形劃清界線）；K22 Schelling 隔離模型（社會空間分布）
- **不開 G 的替代方案**：K03→C06、K05→C07、K12→C08（放進 C 場與擴散）。

### 各家族提案的決定

| 提案 | 決定 | 理由 |
|---|---|---|
| G 空間分析（x4 原提案 H「空間分析與圖論」） | 新增（字母依序用 G） | 通過的候選有 K03、K05、K12、K04 四個；K03 可視域與 K05 太陽包絡在 A–F 都沒有合適歸屬（C 的場由公式、雜訊或擴散生成，D03、F04 只把可見度或日照當權重或評分），K12 雖可放 C，但它是對既有地形做水文分析，和 K03、K05 同屬「讀懂基地」。K04 最小生成樹與 F05 最短路同屬圖論，放 F 更一致，所以家族改名為「空間分析」、不含圖論。 |
| 幾何處理與網格（x4 提案 G） | 本次不新增，建議下一次優先 | K02、K24、K25 放進 A–F 都明顯勉強，已符合新家族條件，但三者審查後都是 16 分，低於本次入選線；本次若開這個家族會擠掉 18 分的候選。建議下一次以同一個 run 集中收 K02、K24、K25（字母屆時為 H），K10、K30 為後備。 |
| 機器學習與資料驅動（x4 提案 I） | 本次不新增 | K09、K19、K26 共三個通過，但建築相關性都只有 3、建築案例偏少（K19、K26 審查各扣 1 分），SOM 與 Q-learning 也各有可行的既有歸屬；等補足建築案例後再評估。 |
| 機率與隨機過程（x4 提案 J） | 不新增 | x4 自己建議分散併入；唯一新演算法模擬退火收為 F07。 |
| 物理與動力（x4 提案 K） | 不新增 | 可做的部分幾乎都被 E04 涵蓋，改為 E04 的變形建議（布料、PBD）。 |
| 結構與性能（x5 稽核提及） | 不新增 | K14 圖解靜力學、K07 力密度法和 E04 動態鬆弛同屬找形，放在 E 可形成三種找形的對照；K08 拓樸最佳化本次未入選；E04 已在 E，另開家族反而會把找形拆散。 |

## 未入選（通過審查但低於入選線，或改判為變形）

| 候選 | 名稱 | 審查結果 | 審查後分數 | 原因 |
|---|---|---|---|---|
| K02 | 剛性摺紙鑲嵌（三浦摺） | accept | 16 | 三個方向都提出，但審查後 16 分，低於本次入選線（17）；它和 K24、K25 放進 A–F 都明顯勉強，已符合新家族「幾何處理與網格」的條件，建議下一次集中收這三個（屆時字母依序為 H）。Al Bahr Towers 與 St-Loup 教堂只是摺紙啟發，摘要要改寫。 |
| K06 | 矩形裝箱排版（MaxRects 板材排料） | accept | 16 | 審查扣 1 分（16）：OpenNest、SVGnest、WikiHouse fork 都是不規則零件的 NFP＋GA 排料而非 MaxRects，Flemming LOOS 關聯偏弱，CLT 剩料章節的 evidence 需更正；補到真正使用 MaxRects／guillotine 裝箱的案例後，可再以 E 家族候選提出。 |
| K08 | 拓樸最佳化（BESO／SIMP） | accept | 16 | 建築相關性 5、新穎度 5，但難度 5、可行性 3（需自寫有限元素與共軛梯度，SIMP 與 BESO 只能擇一），審查後 16 分，低於入選線；列為下一次 F 家族（或未來「結構與性能」家族）的優先候選。 |
| K09 | 類神經網路（感知器與多層感知器） | accept | 16 | 16 分；機器學習家族（K09、K19、K26）三個候選建築相關性都只有 3、建築案例偏少，而且 SOM 與 Q-learning 都各有較勉強但可行的既有歸屬，本次不開家族；ArchiGAN 只能當應用脈絡。 |
| K10 | 測地線距離與測地線網（熱方法） | accept | 15 | 15 分；需餘切拉普拉斯與兩次稀疏線性求解，可行性 3、難度 4；未來「幾何處理與網格」家族的候選（也可歸 C）。 |
| K11 | 波動方程與干涉（FDTD 水波／聲波） | accept | 17 | 審查扣 1 分（17）：計算骨架（格子拉普拉斯、多緩衝輪替）與 C01 高度重疊，案例都是聲學研究與論壇討論，沒有以此方法設計的建築作品；同分候選中排在 E06、B06 之後。 |
| K13 | 測地線圓頂（二十面體細分） | accept | 17 | 審查扣 1 分（17）：演算法核心偏向直接幾何構造，和 A04 V12「網格細分」、B04 專案種子「Fibonacci 圓頂分割與構件化」相當接近，新穎度是邊界案例，只有一個方向提出；同分候選中排在 E06、B06 之後。 |
| K15 | 準週期鋪磚（Penrose 鋪磚／de Bruijn 五格線法） | accept | 16 | 審查扣 1 分（16）：F02 V06 已用 deflation 產生 Penrose 底圖、F02 也已收 Lu & Steinhardt 準晶 girih；主體改聚焦五格線法後可再提，F 本次已收 2 個。 |
| K17 | 格子波茲曼風場（LBM） | accept | 17 | 17 分，和 B06 同分同建築相關性；但可教性 3、難度 4，D2Q9 只能模擬低雷諾數、結果僅供示意，Urban Wind Lab（2026-09-15 發布、1 顆星）不宜當案例，剩 2 個建築案例；未來可歸 G 空間分析（風環境）或 C，列為下一次優先候選。 |
| K18 | 白蟻式群體建造（晶格群體／Stigmergy 建造） | variation | 16 | 審查判為 B02 的變形（16 分），已列入 to_variation。 |
| K19 | 自組織映射（SOM） | accept | 16 | 審查扣 1 分（16）：兩件案例一件是一般工程設計空間探索、一件是外掛示範影片，沒有建築專案；機器學習家族本次不成立。 |
| K20 | 穩態熱傳導與 Laplace 場（鬆弛法） | variation | 15 | 審查判為 C01 的變形（15 分），已列入 to_variation。 |
| K21 | 蟻群最佳化（ACO） | accept | 15 | 審查扣 1 分（15）：留痕跡加蒸發的概念 D01 V08 與 D02 已教過，兩個案例偏結構工程與營建管理；本次最佳化類只取 F07 模擬退火。 |
| K22 | Schelling 隔離模型（鄰里偏好與遷居） | accept | 15 | 審查扣 1 分（15）：產出是社會分布圖而不是形體，兩件案例都是都市社會學／GIS 研究，沒有設計專案；未來可當 D 家族或 G 空間分析的候選。 |
| K23 | 四邊形網格平面化（PQ Mesh 投影求解） | variation | 15 | 審查判為 E04 的變形（15 分），已列入 to_variation。 |
| K24 | 網格展開（展開圖） | accept | 16 | 16 分，低於入選線；和 K02、K25 同屬未來「幾何處理與網格」家族的核心候選，建議下一次一起收；n|Strip 展開的是可展長條而不是多面體展開圖，摘要要寫清楚。 |
| K25 | 直骨架屋頂（Straight Skeleton） | accept | 16 | 16 分，低於入選線；建築相關性 5，但一般多邊形的 split event 與同時事件數值上容易出錯（可行性 3），建立時要先限定無洞、一般位置的多邊形；CityEngine roofHip 文件沒提到直骨架；未來「幾何處理與網格」家族的核心候選。 |
| K26 | 強化學習（Q-learning） | accept | 15 | 審查扣 1 分（15）：兩個案例都是深度強化學習，和表格式 Q-learning 距離很遠，格子世界學出的價值場幾乎就是 F05 的多起點距離場；機器學習家族本次不成立。 |
| K27 | 等面鋪磚與 Escher 化（Heesch 型鑲嵌） | accept | 15 | 15 分；建築案例偏少（Metamorphosis III 放大壁畫、FoAR 2024 的 3D 紋理鑲嵌），F 本次已收 2 個；可在之後的 F 家族擴充中再評估。 |
| K28 | 粒子群最佳化（PSO） | variation | 14 | 審查判為 F04 的變形（14 分），已列入 to_variation。 |
| K29 | 迭代函數系統（IFS／混沌遊戲） | variation | 13 | 審查判為 F06 的變形（13 分），已列入 to_variation。 |
| K30 | 等向性重新網格（Isotropic Remeshing） | accept | 14 | 審查扣 1 分（14，剛好達門檻）：RhinoCommon 沒有拓樸編輯 API，需自寫邊–面鄰接與 link condition 檢查，300–400 行頂到上限，且和 B01 V08 共用 split、flip 操作；未來「幾何處理與網格」家族的候選。 |

## 建議併入既有演算法當變形（可交給 gh-enrich 的 VAR 單元）

| 變形 | 併入 | 來源 | 理由 |
|---|---|---|---|
| 白蟻式群體建造（晶格群體／Stigmergy 建造） | B02 | 審查改判（候選 K18，自評 17、審查後 16） | 在晶格上隨機行走、貼著結構時依 26 鄰域構形查表決定是否放磚，本質是 B02 DLA 的「換黏著規則＋3D 晶格」（DLA 等於「任何非空構形都黏」的特例），產出同為體素聚合體，依判斷規則應併為 B02 變形（並和 D01 V08 Stigmergy 互相連結）；另外 FIBERBOTS 是纏繞纖維管的機器人群，不是晶格放磚，案例牽強，TERMES 頁面寫明機器人遵守預先決定的交通規則（由使用者指定的目標結構編譯而來），和 one_liner「沒有藍圖」不符需改寫；和 K16 離散聚合（接頭平面對齊）不是同一件事。 |
| 穩態熱傳導與 Laplace 場（鬆弛法） | C01 | 審查改判（候選 K20，自評 16、審查後 15） | Jacobi 鬆弛解 Laplace 就等於把 C01 的擴散項跑到穩態，再加固定邊界與材料導熱係數，核心機制、資料結構（double[,] 格子）與產出（純量場＋等值線）都沒有超出 C01（B02 V12 的 DBM 也已經用 Laplace 疊代），屬換規則／換輸出；5 個網址查證相符，冷橋分析很適合寫成 C01 變形「純擴散穩態：多材料熱傳導與冷橋（Gauss–Seidel／SOR）」。 |
| 四邊形網格平面化（PQ Mesh 投影求解） | E04 | 審查改判（候選 K23，自評 16、審查後 15） | 逐面投影到擬合平面再在頂點取平均，是 Kangaroo／ShapeOp 式的投影約束求解，與 E04 V12「約束在基底曲面」、專案種子「自寫迷你 Kangaroo」以及本次 to_variation 的「位置式動力學（PBD）」同一套機制，只是換成平面性約束，資料結構與產出（網格）都不變；5 個網址查證相符（Shape-Up 的 EG 頁擋爬蟲，改以 CrossRef 確認），但柏林河馬館是用平移曲面直接得到平面四邊形，並沒有使用這個求解法，不宜當本法案例。 |
| 粒子群最佳化（PSO） | F04 | 審查改判（候選 K28，自評 15、審查後 14） | PSO 與 F04 同樣是一群參數向量的黑盒子最佳化，資料結構（double[] 參數，和 F04 V05「基因改成滑桿參數」相同）與產出（最佳參數＋收斂曲線）都一樣，只把選擇／交配／突變換成速度與 pbest／gbest 的更新規則，候選自己也承認是邊界案例；兩件建築案例（Silvereye、Wortmann 2019）都是最佳化工具基準測試，沒有建築專案；4 個網址都查證相符（Silvereye 的 Springer 頁擋爬，改由 Crossref 確認）；建議當 F04 變形「換搜尋機制：粒子群最佳化」，和 K01 模擬退火一起做成單點、族群、群體三種搜尋的對照。 |
| 迭代函數系統（IFS／混沌遊戲） | F06 | 審查改判（候選 K29，自評 15、審查後 13） | 混沌遊戲產出和 F06 一樣是反覆代入映射得到的吸子點雲，只把單一非線性公式換成依機率抽選的仿射變換組，確定性版本又與 A05 畢氏樹重疊；4 個網址查證相符，但建築案例只有兩篇冷門論文，建築相關性弱，建議當 F06 變形「換公式：IFS 仿射變換組（Barnsley 蕨）」。 |
| 鄰接圖彈簧：泡泡圖配置（力導向 Fruchterman–Reingold） | E01 | 彙整改判（原 x3_DE 候選「力導向泡泡圖配置（鄰接圖 → 平面）」，自評 18） | 房間圓依需求面積定半徑、兩兩互斥推開是 E01 的核心，鄰接房間以彈簧相吸是 E04 的彈簧；核心機制、資料結構與產出（圓的配置）都沒有超出 E01／E04，只是多了鄰接圖輸入。可作為 E01 變形，並銜接 E03 變形「Power diagram（加權 Voronoi）」與 E03 專案種子「面積指定的泡泡平面生成器」。x1、x4、x5 三個方向也各自判為變形。 |
| 非支配排序多目標（NSGA-II／Pareto 前緣） | F04 | 探索方向 rejected 的建議 | 在 GA 上加非支配排序與擁擠距離；F04 目前只有「多目標加權」變形與專案種子「迷你 Octopus：兩目標 Pareto 前緣」，建議補成正式變形。 |
| 逃逸時間分形場（Mandelbrot／Julia） | C05 | 探索方向 rejected 的建議 | 逐點迭代得到逃逸步數當場值，再取等值線，是 C05「換場函數」的一種；x5 補充查不到以此為核心的建築案例，所以只當變形。 |
| 疊紋（Moiré）：雙層週期圖樣的干涉紋 | F02 | 探索方向 rejected 的建議 | 兩層週期圖樣相對旋轉或縮放產生的視覺現象，不是獨立演算法；與 F02 V11「多層疊合（穹頂光影）」相近但重點在干涉紋，也可放 F01（雙層穿孔板的疊紋立面）。 |
| 鏡曲線：Kolam 與凱爾特結 | F01 | 探索方向 rejected 的建議 | 鏡曲線可化約為三種磚（交叉、兩種反射）的 Truchet 鋪排再加上下交織。 |
| 圖文法：改寫規則作用在房間鄰接圖上 | A05 | 探索方向 rejected 的建議 | 核心仍是改寫規則，只是對象換成鄰接圖；子圖比對在單一元件內負擔重、建築案例多停留在學術工具。 |
| 周界隨機生長（Eden 模型） | B02 | 探索方向 rejected 的建議 | Eden 模型等同 DBM 取 η=0（周界格等機率長出），是 B02 群集生長換一條黏附規則。 |
| 對數螺線掃掠成殼（Raup 貝殼模型） | B04 | 探索方向 rejected 的建議 | 截面沿對數螺線掃掠並等比放大，是 B04 螺線公式的 3D 曲面版；參考 Fowler, Meinhardt & Prusinkiewicz〈Modeling seashells〉（SIGGRAPH 1992）與 Gene Kogan SeashellGenerator（x2 已開啟確認）。 |
| 六角格連續 CA（Reiter 雪花） | C02 | 探索方向 rejected 的建議 | 六角鄰域＋連續狀態＋鄰居平均擴散，是 C02 連續狀態 CA 換成六角格；查不到建築案例，只當變形。 |
| Fast Marching：Eikonal 距離場 | F05 | 探索方向 rejected 的建議 | 同樣是優先佇列的波前擴散，只把 Dijkstra 的邊權更新換成 Eikonal 局部更新公式，可減少格子方向造成的距離誤差；補在 F05 V04「多起點距離場」旁。 |
| 守恆型相分離（Cahn–Hilliard／spinodal 雙連續結構） | C01 | 探索方向 rejected 的建議 | 計算骨架同 C01（格子拉普拉斯更新），差在守恆型方程；產出迷宮狀雙相圖樣。 |
| 中點位移／Diamond-square 地形 | C04 | 探索方向 rejected 的建議 | 另一種分形高程生成法，產出與用途同 C04。 |
| 追逐與逃離的雙物種群聚（捕食者–獵物） | D01 | 探索方向 rejected 的建議 | 核心是 Reynolds 的 pursue／evade 轉向，再加出生與死亡規則；建築案例薄弱，只當變形。 |
| Lévy flight 步長 | B02 | 探索方向 rejected 的建議 | 只把隨機行走的步長換成冪次律分布，機制與資料結構不變（x3 也提到可放 D01）。 |
| 交通 CA 時空圖（Rule 184／Nagel–Schreckenberg） | C02 | 探索方向 rejected 的建議 | NaSch 在最高速 1、無隨機減速時就是 Wolfram Rule 184，本質是一維 CA 換規則與狀態。 |
| 彎曲桿件與編織網殼 | E04 | 探索方向 rejected 的建議 | 核心是彈簧＋彎曲鬆弛，再加上下交錯的標記（E04 已收 KnitCandela 案例）。 |
| 布料下垂與碰撞 | E04 | 探索方向 rejected 的建議 | 質點＋彈簧＋重力＋阻尼與 E04 機制相同；x4 評估「物理與動力」家族後建議改為替 E04 補此變形。 |
| 位置式動力學（PBD／投影約束求解器） | E04 | 探索方向 rejected 的建議 | Kangaroo 2 本身就是投影式約束求解，屬 E04 的求解器變形（呼應 E04 專案種子「自寫迷你 Kangaroo」）。 |
| 複數共形映射（e^z、Möbius 變換、Droste 效果） | F01 | 探索方向 rejected 的建議 | 本質是對既有圖樣做座標轉換；查不到足量建築案例，適合當 F 家族圖樣的映射變形（也可放 F02）。 |
| 網路中心性：closeness／Space syntax 整合度（平均深度） | F05 | 探索方向 rejected 的建議 | F05 V07「多組起終點＋流量疊加」已接近 betweenness；這裡補的是全點對最短路徑的平均深度（closeness、integration）與正規化指標。 |
| k-means 面板分群（自由曲面面板歸成少數模具類型） | E03 | 探索方向 rejected 的建議 | k-means 就是在資料空間做 Lloyd 迭代。 |
| Markov 鏈序列生成（n-gram，一維範例驅動） | A06 | 探索方向 rejected 的建議 | 由範例統計轉移機率再抽樣，與 A06「從範例學規則（範例驅動）」的教學重點重疊，可當一維版本。 |
| Superformula（Gielis 超公式）形狀場 | C05 | 探索方向 rejected 的建議 | 只是一條極座標公式、查無真實建築案例；可作為 C05「換場函數」或 E01／B04 的形狀輸入。 |

## 下一步

1. 確認是否新增 G「空間分析」家族（不開的話，G01–G03 改為 C06–C08）。
2. 確認後執行 `/gh-new-algos`，args 為 `{"run": "<新的台北時間>", "mode": "add", "from": "R20260928-2216"}`。
3. 建立時依各演算法的「建立時注意」補足案例：F08 要補一件直接使用 MST／Steiner 樹的設計案例；E05、G03、B06 的研究案例要補到 5 個以上；F07、B06 的 creative coding 案例要補到 3 個以上。
4. 下一次 propose 建議優先評估「幾何處理與網格」家族（K02、K24、K25，後備 K10、K30）與 K08 拓樸最佳化、K17 格子波茲曼風場。
