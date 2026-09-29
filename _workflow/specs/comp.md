# COMP｜每個演算法一個 Grasshopper C# 元件檔（撰寫與修正）

gh-comp 工作流程的撰寫 agent（Sonnet）規格。審查規格見 `compreview.md`（Opus，照同一份清單檢查）。

## 目標
- 每個演算法一個檔：`comp_codes/<家族>/<id>_<英文名>.cs`（例如 `comp_codes/A/A01_LSystem.cs`；檔名就是資料的 `file` 欄位，路徑由 `python tools/cs_plan.py show <id>` 的 `target` 給）。
- Rhino 8 Grasshopper **C# Script 元件**（新 Script Editor、SDK 模式 `Script_Instance : GH_ScriptInstance`）的完整程式：放一顆 C# Script 元件、照檔頭設定輸入輸出、整段貼上，接上 slider 就有畫面。
- 讀者是建築系的演算法設計學習者：程式要照網站上的 `pseudo_code` 結構走，一眼對得上。

## 先讀
1. `python tools/cs_plan.py show <id>`：`how_it_works`、`pseudo_code`、`key_params`、`csharp_concepts`、`teaching_note`，以及 `target`、`template`、`legacy`、`course`。
2. 範本 `template`（`115-1_演算法設計/04_程式碼/C#_gh_comp_base_template.cs`）。
3. 風格範本（完成版），至少讀一個：`115-1_演算法設計/04_程式碼/W3_實作/L3_CirclePacking_step5.cs`（迭代）、`L2_遞迴分割_step5.cs`（遞迴＋外部類別）、`L1_葉序_step4.cs`（直接公式）。
4. `legacy` 不是空的（`cs/` 下的舊版，已能編譯）：以它的演算法實作為起點，改成本格式、補齊缺的部分。`course` 不是空的：以課堂完成版為起點，只改檔頭（不要出現課程週次、Step 字樣）並補齊 `key_params` 裡還沒有的輸入。

## 檔案格式（依序）
1. 第一行 `// Grasshopper Script Instance`
2. 檔頭區塊：
```
// ==================================================================
// A01 L-System｜L 系統
// 家族：A 規則與語法　邏輯：改寫／遞迴　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   startString   string  Item   起始字串（axiom）             例：F
//   generations   int     Item   改寫幾代                      例：4
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   lines                        樹枝線段（Line）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. …（對應 how_it_works，3–6 條）
// ------------------------------------------------------------------
// 你應該看到：用預設值時畫面長什麼樣子（一句話）
// 由 gh-comp 工作流程產生；已通過 tools/cs_check.py 編譯檢查，尚未在 Rhino 中實測
// ==================================================================
```
3. `#region Usings` … `#endregion`：範本的 11 行 using **全部保留**（可再加 `System.Text` 等）。
4. `public class Script_Instance : GH_ScriptInstance`，範本的 `#region Notes` 區塊**原樣保留**。
5. `private void RunScript(輸入…, ref object 輸出…)`，內部依序用段落標記：
   `// ===== 0. 防呆 =====`、`// ===== 1. DATA 資料 =====`、`// ===== 2. INIT 初始 =====`、`// ===== 3. LOOP 迭代 =====`、`// ===== 4. OUTPUT 輸出 =====`
   標記後可加「：一句話」（例如 `// ===== 3. LOOP 迭代：收斂就停 =====`）。直接公式類若 `pseudo_code` 沒有 INIT／LOOP 可以省略。最後用 `Print(...)` 印一行摘要（數量、迭代次數、是否碰到上限）。
6. RunScript 下方依序：`// ----- Fields 欄位 -----`（常數與上限）、`// ----- RULE 規則：… -----`（核心規則方法）、`// ----- Helpers 工具 -----`。
7. `Script_Instance` 外面（`pseudo_code` 的「Script_Instance 外面」）：先放分隔區塊
```
// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================
```
   再放自訂 class／struct，每個前面一行註解說明它是什麼。

## 程式規則
- **介面與 pseudo_code 一致**：輸入名稱＝`key_params` 的 `name`，順序照 `key_params`；`pseudo_code` 列出的其他輸入（seed、boundary…）接在後面。方法與類別名稱照 `pseudo_code`（例如 ApplyRules、DrawLines、Pen）。檔頭輸入表、RunScript 簽章、`pseudo_code` 三者名稱與順序完全相同。
- **Type Hint** 只用：`int`、`double`、`bool`、`string`、`Point3d`、`Vector3d`、`Plane`、`Curve`、`Polyline`、`Brep`、`Mesh`，清單用 `List<…>`（Access 寫 List）。
- **只接 slider 就要有畫面**：沒接的數值輸入是 0、沒接的幾何是 null、沒接的清單是空的 → 在 0. 防呆 給預設值（就是檔頭的「例」），不合理的值夾到合理範圍（例：`generations = Math.Max(0, Math.Min(generations, MaxGenerations));`）。幾何輸入沒接時用程式內的預設幾何（例如 100×100 的矩形邊界）。
- **不當機**：預設值 1 秒內算完。迭代次數、點數、遞迴深度、字串長度、格子數都要有上限常數（放 Fields），碰到上限就停並 Print 提醒。n 可能上千時避免 O(n²) 全配對（用格子分桶）。所有 while 迴圈都要有保證結束的條件。
- **隨機可重現**：`var random = new Random(seed);` 傳進需要的方法；不用 static Random、不用時間或 Guid 當種子。
- **只輸出，不動文件**：輸出 Point3d、Line、Polyline、Curve、Circle、Rectangle3d、Mesh、Brep、TextDot、數值或它們的 List；分組資料可用 `DataTree<T>`。不可 bake（`RhinoDocument.Objects.Add…`）、不開視窗、不讀寫檔案、不用 Thread。
- **語法**：C# 7.3 ＋ .NET Framework 4.8 的 API（`cs_check.py` 就是這樣編譯）；不用 record、switch 運算式、`new()`、`Math.Clamp`、`System.Text.Json` 等較新功能。只用 RhinoCommon，不依賴外掛。
- **好讀**：4 空白縮排、大括號換行（照課堂檔）；變數用完整英文字（`number`、`allPoints`、`neighborCount`），迴圈索引以外不用縮寫；不做過度設計（泛型框架、介面繼承、長串 LINQ）。行數 120–300 為宜，上限 350。
- **註解**：繁體中文（台灣用語），寫「為什麼」與「這一步在演算法裡的角色」，不要重述程式字面；關鍵公式旁註明來源概念（例如「√number → 每圈面積相同，密度均勻」）。不寫課程週次或「學生」「課堂」。

## 自我檢查（完成前一定要做）
1. `python tools/cs_check.py <target>`：必須印出 `OK`（錯誤 0）；警告盡量清掉（直接公式類「沒有 INIT／LOOP」可留）。
2. 用 Read 從頭到尾重看一次：用預設值在腦中跑一次小例子（例如 generations = 1、count = 3），確認結果對、迴圈會結束、索引不越界。
3. 檔頭輸入表與 RunScript 簽章逐一比對（名稱、型別、Access、順序）。

## 只能修改
- `<target>` 這一個 .cs
- `_workflow/stage/<RUN>/CSW_<id>.json`
不要改 data、`cs/`、`assets/`、其他演算法的檔案；不要 commit、不要 push。

## 輸出紀錄 `CSW_<id>.json`
```json
{"id": "A01", "target": "comp_codes/A/A01_LSystem.cs", "lines": 182,
 "inputs": ["startString", "rules", "generations", "stepLength", "turnAngle", "branchScale"],
 "outputs": ["lines", "finalString"], "based_on": "new|legacy|course", "check": "OK",
 "fix_round": 0, "note": "一句話"}
```
寫完確認 JSON 可解析。

## 修正模式
協調流程給你 Opus 審查的 `issues`（`_workflow/stage/<RUN>/CSR_<id>.json` 也有）時：
- 每個 blocker、major 都要修；minor 順手能修就修。審查說錯的（你確認程式其實正確）可以不改，但要在 note 寫理由。
- 修完重跑自我檢查，更新 `CSW_<id>.json`（`fix_round` 設成協調流程給的輪次，`note` 列出改了什麼）。不要修改 CSR 檔。
