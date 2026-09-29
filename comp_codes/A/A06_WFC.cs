// Grasshopper Script Instance
// ==================================================================
// A06 Wave Function Collapse (WFC)｜波函數塌縮
// 家族：A 規則與語法　邏輯：搜尋／求解　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   width       int     Item   橫向格數                      例：8
//   height      int     Item   縱向格數                      例：8
//   cellSize    double  Item   每格邊長                      例：10.0
//   seed        int     Item   隨機種子                      例：0
// 輸出
//   out                        Print 的文字（元件預設就有，不要刪）
//   pipes                      每格中心到開口邊中點的水管線段（Line）
//   tileNumbers                每格塌縮出的 tile 編號（MakeTileSet 內 tileCodes 陣列的索引，0–11）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 先列出 12 種水管 tile（北東南西四邊各自開或關，扣掉只開一邊的死路）
//   2. 每格一開始把 12 種都當候選；邊界格先刪掉開口會朝外的 tile，往內傳播一次
//   3. 找候選數最少（但大於 1）的格子，同分隨機選一格，再從候選中隨機塌縮成一個 tile
//   4. 傳播：塌縮過的格子推進 Stack，逐一通知鄰居刪掉「接不起來」的候選，鄰居有刪除就再推進去
//   5. 某格候選被刪到 0 就是矛盾，整張重來（最多 20 次）；全部格子都只剩 1 個候選就完成
// ------------------------------------------------------------------
// 你應該看到：8×8 格的水管網路，每一段管子都跟鄰居的開口對得起來，沒有斷頭的管子
// 由 gh-comp 工作流程產生；已通過 tools/cs_check.py 編譯檢查，尚未在 Rhino 中實測
// ==================================================================
#region Usings
using System;
using System.Linq;
using System.Collections;
using System.Collections.Generic;
using System.Drawing;

using Rhino;
using Rhino.Geometry;

using Grasshopper;
using Grasshopper.Kernel;
using Grasshopper.Kernel.Data;
using Grasshopper.Kernel.Types;
#endregion

public class Script_Instance : GH_ScriptInstance
{
    #region Notes
    /*
      Members:
        RhinoDoc RhinoDocument
        GH_Document GrasshopperDocument
        IGH_Component Component
        int Iteration

      Methods (Virtual & overridable):
        Print(string text)
        Print(string format, params object[] args)
        Reflect(object obj)
        Reflect(object obj, string method_name)
    */
    #endregion

    private void RunScript(
        int width, int height, double cellSize, int seed,
        ref object pipes, ref object tileNumbers)
    {
        // ===== 0. 防呆 =====
        if (width <= 0) width = 8;                                   // 沒接 → 預設 8×8
        if (height <= 0) height = 8;
        if (cellSize <= 0) cellSize = 10.0;
        bool gridClamped = width > MaxGridSize || height > MaxGridSize;
        width = Math.Max(1, Math.Min(width, MaxGridSize));            // 格數太多矛盾機率暴增，夾住
        height = Math.Max(1, Math.Min(height, MaxGridSize));

        // ===== 1. DATA 資料 =====
        List<PipeTile> tileSet = MakeTileSet();                       // 12 種水管（見 Helpers）
        var candidates = new List<int>[width * height];               // 每格的候選 tile 索引清單

        // ===== 2. INIT 初始：隨機數（seed）；每次嘗試在 TrySolve 內重新灌滿候選 =====
        var random = new Random(seed);

        // ===== 3. LOOP 迭代：解不出來就整張重來 =====
        bool solved = false;
        int attemptsUsed = 0;
        for (int attempt = 0; attempt < MaxAttempts; attempt++)
        {
            attemptsUsed = attempt + 1;
            if (TrySolve(width, height, tileSet, random, candidates))
            {
                solved = true;
                break;
            }
        }

        // ===== 4. OUTPUT 輸出 =====
        if (!solved)
        {
            Print("重試 {0} 次仍然矛盾，換個 seed 再試試看", MaxAttempts);
            pipes = new List<Line>();
            tileNumbers = new List<int>();
            return;
        }
        var numbers = new List<int>();
        List<Line> lines = DrawPipes(candidates, tileSet, width, height, cellSize, numbers);
        Print("{0} x {1} 格，第 {2} 次嘗試成功，共 {3} 段水管{4}", width, height, attemptsUsed, lines.Count,
            gridClamped ? "（格數已夾到 " + MaxGridSize + "）" : "");
        pipes = lines;
        tileNumbers = numbers;
    }

    // ----- Fields 欄位 -----
    const int MaxGridSize = 40;                                       // 每邊格數上限
    const int MaxAttempts = 20;                                       // 矛盾重來次數上限
    // 方向順序固定：北 0、東 1、南 2、西 3
    static readonly int[] RowOffset = { -1, 0, 1, 0 };
    static readonly int[] ColumnOffset = { 0, 1, 0, -1 };

    // ----- RULE 規則：挑最確定的格子隨機塌縮 → 傳播，直到全部定案或矛盾 -----
    bool TrySolve(int width, int height, List<PipeTile> tileSet, Random random, List<int>[] candidates)
    {
        int cellCount = width * height;
        for (int cell = 0; cell < cellCount; cell++)
            candidates[cell] = Enumerable.Range(0, tileSet.Count).ToList();   // 一開始全部 tile 都是候選

        // --- 邊界先刪掉開口朝外的 tile，再往內傳播一次 ---
        var stack = new Stack<int>();
        for (int row = 0; row < height; row++)
        {
            for (int column = 0; column < width; column++)
            {
                int cell = row * width + column;
                candidates[cell].RemoveAll(t => OpensToOutside(tileSet[t], row, column, width, height));
                if (candidates[cell].Count == 0) return false;                // 理論上不會，防呆
                stack.Push(cell);
            }
        }
        if (!Propagate(stack, candidates, tileSet, width, height)) return false;

        // --- 逐步塌縮 ---
        while (true)
        {
            int cell = FindMostCertainCell(candidates, random);
            if (cell == -1) return true;                                      // 每格都只剩 1 個候選 → 完成

            List<int> options = candidates[cell];
            int chosen = options[random.Next(options.Count)];                 // 從候選中隨機塌縮
            candidates[cell] = new List<int> { chosen };

            var pushed = new Stack<int>();
            pushed.Push(cell);
            if (!Propagate(pushed, candidates, tileSet, width, height)) return false;   // 傳播出矛盾 → 這次重來
        }
    }

    // 傳播：Stack 記錄有變動的格子，通知四個鄰居刪掉接不起來的候選
    bool Propagate(Stack<int> stack, List<int>[] candidates, List<PipeTile> tileSet, int width, int height)
    {
        while (stack.Count > 0)
        {
            int cell = stack.Pop();
            int row = cell / width;
            int column = cell % width;
            List<int> here = candidates[cell];

            for (int direction = 0; direction < 4; direction++)
            {
                int neighborRow = row + RowOffset[direction];
                int neighborColumn = column + ColumnOffset[direction];
                if (neighborRow < 0 || neighborRow >= height || neighborColumn < 0 || neighborColumn >= width)
                    continue;                                                 // 這個方向沒有鄰居

                int neighbor = neighborRow * width + neighborColumn;
                List<int> there = candidates[neighbor];
                int removed = there.RemoveAll(neighborTile =>
                    !here.Any(cellTile => CanConnect(tileSet[cellTile], direction, tileSet[neighborTile])));

                if (removed > 0)
                {
                    if (there.Count == 0) return false;                       // 鄰居被刪光 → 矛盾
                    stack.Push(neighbor);                                     // 鄰居也變了，繼續往外傳
                }
            }
        }
        return true;
    }

    // 找可能性最少（但還大於 1）的格子；同分隨機挑一個；全部都定案回傳 -1
    int FindMostCertainCell(List<int>[] candidates, Random random)
    {
        int bestCount = int.MaxValue;
        var tied = new List<int>();
        for (int cell = 0; cell < candidates.Length; cell++)
        {
            int count = candidates[cell].Count;
            if (count <= 1) continue;                                        // 已經定案，跳過
            if (count < bestCount)
            {
                bestCount = count;
                tied.Clear();
                tied.Add(cell);
            }
            else if (count == bestCount)
            {
                tied.Add(cell);
            }
        }
        if (tied.Count == 0) return -1;
        return tied[random.Next(tied.Count)];
    }

    // ----- Helpers 工具 -----
    // 12 種水管 tile：字串 4 碼＝北東南西，1 開 0 關；tileNumbers 輸出的編號就是這個陣列的索引。
    // 想換風格就改這份字串清單：
    //   刪掉 "1111"（十字）→ 不會再有四岔路口
    //   只留 "0000"（空白）、"1010"（南北直管）、"0101"（東西直管）→ 整張圖只剩長直線，沒有轉彎與分岔
    //   刪掉三岔（開口數 3 的四種）→ 只剩直管、彎管、空白，走法更單純
    List<PipeTile> MakeTileSet()
    {
        string[] tileCodes =
        {
            "0000",   // 空白：四邊都關
            "1010",   // 直管：南北貫通
            "0101",   // 直管：東西貫通
            "1100",   // 彎管：北接東
            "0110",   // 彎管：東接南
            "0011",   // 彎管：南接西
            "1001",   // 彎管：西接北
            "1110",   // 三岔：北東南（缺西）
            "0111",   // 三岔：東南西（缺北）
            "1011",   // 三岔：南西北（缺東）
            "1101",   // 三岔：西北東（缺南）
            "1111",   // 十字：四邊全開
        };
        var tiles = new List<PipeTile>();
        foreach (string code in tileCodes)
            tiles.Add(ParseTileCode(code));
        return tiles;
    }

    // 把 4 碼字串（北東南西，1 開 0 關）轉成 PipeTile
    PipeTile ParseTileCode(string code)
    {
        bool north = code[0] == '1';
        bool east = code[1] == '1';
        bool south = code[2] == '1';
        bool west = code[3] == '1';
        return new PipeTile(north, east, south, west);
    }

    // 這個 tile 放在 (row, column) 時，是否有開口朝向棋盤外面
    bool OpensToOutside(PipeTile tile, int row, int column, int width, int height)
    {
        if (tile.Opens[0] && row == 0) return true;                          // 北：最上排開口朝外
        if (tile.Opens[1] && column == width - 1) return true;               // 東：最右列開口朝外
        if (tile.Opens[2] && row == height - 1) return true;                 // 南：最下排開口朝外
        if (tile.Opens[3] && column == 0) return true;                       // 西：最左列開口朝外
        return false;
    }

    // tileA 往 direction 方向能不能跟 tileB 接起來：兩邊的開關要一致（都開或都關）
    bool CanConnect(PipeTile tileA, int direction, PipeTile tileB)
    {
        int opposite = (direction + 2) % 4;
        return tileA.Opens[direction] == tileB.Opens[opposite];
    }

    // 把已經解出來（每格只剩 1 個候選）的網格畫成水管線段：格子中心連到每個開口邊的中點
    List<Line> DrawPipes(List<int>[] candidates, List<PipeTile> tileSet, int width, int height, double cellSize, List<int> tileNumbers)
    {
        var lines = new List<Line>();
        double half = cellSize / 2.0;
        for (int row = 0; row < height; row++)
        {
            for (int column = 0; column < width; column++)
            {
                int cell = row * width + column;
                int tileIndex = candidates[cell][0];
                tileNumbers.Add(tileIndex);
                PipeTile tile = tileSet[tileIndex];

                Point3d center = new Point3d(column * cellSize + half, (height - 1 - row) * cellSize + half, 0);
                if (tile.Opens[0]) lines.Add(new Line(center, center + new Vector3d(0, half, 0)));    // 北
                if (tile.Opens[1]) lines.Add(new Line(center, center + new Vector3d(half, 0, 0)));    // 東
                if (tile.Opens[2]) lines.Add(new Line(center, center + new Vector3d(0, -half, 0)));   // 南
                if (tile.Opens[3]) lines.Add(new Line(center, center + new Vector3d(-half, 0, 0)));   // 西
            }
        }
        return lines;
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================
// 一種水管 tile：北東南西四邊各自開（true）或關（false）
class PipeTile
{
    public bool[] Opens;   // 順序固定：北 0、東 1、南 2、西 3

    public PipeTile(bool north, bool east, bool south, bool west)
    {
        Opens = new bool[] { north, east, south, west };
    }
}
