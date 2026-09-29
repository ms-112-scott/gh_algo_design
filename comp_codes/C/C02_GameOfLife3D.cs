// Grasshopper Script Instance
// ==================================================================
// C02 Game of Life 3D (Stacked Generations)｜生命遊戲疊層
// 家族：C 場與擴散　邏輯：迭代模擬　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   width         int     Item   棋盤寬（格數）                例：20
//   depth         int     Item   棋盤深（格數）                例：20
//   generations   int     Item   世代數＝樓層數                例：20
//   density       double  Item   初始活細胞比例                例：0.3
//   seed          int     Item   隨機種子                      例：1
//   cellSize      double  Item   每格邊長兼層高                例：1.0
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   boxes                        每一代活格疊出的方塊（Box）
//   aliveCounts                  每一層的活格數
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 建立 width × depth 的活死網格，用固定 seed 依 density 撒下初始活細胞。
//   2. 每一代先把目前活著的格子轉成 Box 放在第 layer 層（z = layer × cellSize），記下活格數。
//   3. 對每一格數周圍 8 格（Moore 鄰域，邊界用 % 左右上下相接，形成環面）有幾個活鄰居。
//   4. 套 B3/S23 規則：活的有 2 或 3 個鄰居才存活；死的剛好 3 個鄰居就復活；寫進新陣列（雙緩衝），避免同一代互相干擾。
//   5. 新陣列取代舊陣列，重複 generations 次，最後輸出所有方塊與每層活格數。
// ------------------------------------------------------------------
// 你應該看到：用預設值（20×20，density 0.3）會長出一棟由生命遊戲規則堆疊出的量體，越往上通常趨於穩定或閃爍的重複柱狀
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
        int width, int depth, int generations, double density, int seed, double cellSize,
        ref object boxes, ref object aliveCounts)
    {
        // ===== 0. 防呆 =====
        if (width <= 0) width = 20;                              // 沒接：用檔頭「例」預設值
        if (depth <= 0) depth = 20;
        generations = generations <= 0 ? 20 : generations;
        bool hitLimit = width > MaxSide || depth > MaxSide || generations > MaxGenerations;  // 先記是否超過上限，再夾
        width = Math.Max(3, Math.Min(width, MaxSide));
        depth = Math.Max(3, Math.Min(depth, MaxSide));
        generations = Math.Min(generations, MaxGenerations);
        if (density <= 0) density = 0.3;                         // 沒接（0）：用預設密度，而不是原樣保留變成沒有活細胞
        if (density > 1) density = 1;                            // 超過 1：夾到 1，不回退成 0.3
        if (cellSize <= 0) cellSize = 1.0;

        // ===== 1. DATA 資料：活死網格（雙緩衝用）、方塊清單、每層活數清單 =====
        var random = new Random(seed);
        bool[,] grid = new bool[width, depth];
        var allBoxes = new List<Box>();
        var layerAliveCounts = new List<int>();

        // ===== 2. INIT 初始：每格依 density 擲骰，決定活或死 =====
        for (int x = 0; x < width; x++)
        {
            for (int y = 0; y < depth; y++)
                grid[x, y] = random.NextDouble() < density;
        }

        // ===== 3. LOOP 迭代：每一代先疊方塊、記活數，再算下一代往上疊 =====
        for (int layer = 0; layer < generations; layer++)
        {
            int aliveCount = AddLayerBoxes(grid, layer, cellSize, allBoxes);
            layerAliveCounts.Add(aliveCount);
            if (allBoxes.Count >= MaxBoxes)
            {
                hitLimit = true;   // 方塊數已經夠多，提早停止避免 GH 預覽卡住
                break;
            }
            grid = NextGeneration(grid);
        }

        // ===== 4. OUTPUT 輸出 =====
        int layersBuilt = layerAliveCounts.Count;
        int lastAlive = layerAliveCounts.Count > 0 ? layerAliveCounts[layerAliveCounts.Count - 1] : 0;
        Print("疊了 {0} 層，共 {1} 個方塊，最後一層活格數 {2}{3}",
            layersBuilt, allBoxes.Count, lastAlive, hitLimit ? "（已達上限）" : "");
        boxes = allBoxes;
        aliveCounts = layerAliveCounts;
    }

    // ----- Fields 欄位 -----
    const int MaxSide = 120;              // 平面格數上限：避免方塊數爆量
    const int MaxGenerations = 200;       // 世代（樓層）數上限
    const int MaxBoxes = 100000;          // 方塊總數上限：上限組合最壞可達數十萬個，避免 GH 預覽卡住

    // ----- RULE 規則：算下一代，全格同時更新（B3/S23，邊界環面相接）-----
    bool[,] NextGeneration(bool[,] grid)
    {
        int width = grid.GetLength(0);
        int depth = grid.GetLength(1);
        bool[,] next = new bool[width, depth];   // 雙緩衝：寫進新陣列，不動舊陣列，避免同代互相干擾

        for (int x = 0; x < width; x++)
        {
            for (int y = 0; y < depth; y++)
            {
                int neighborCount = CountNeighbors(grid, x, y);
                bool alive = grid[x, y];
                if (alive)
                    next[x, y] = neighborCount == 2 || neighborCount == 3;   // 活的：2 或 3 個鄰居才存活
                else
                    next[x, y] = neighborCount == 3;                        // 死的：剛好 3 個鄰居復活
            }
        }
        return next;
    }

    // 數周圍 8 格（Moore 鄰域），邊界用 % 左右上下相接成環面
    int CountNeighbors(bool[,] grid, int x, int y)
    {
        int width = grid.GetLength(0);
        int depth = grid.GetLength(1);
        int count = 0;
        for (int dx = -1; dx <= 1; dx++)
        {
            for (int dy = -1; dy <= 1; dy++)
            {
                if (dx == 0 && dy == 0) continue;                       // 自己不算鄰居
                int nx = (x + dx + width) % width;                      // % 先加一輪寬度，避免負數
                int ny = (y + dy + depth) % depth;
                if (grid[nx, ny]) count++;
            }
        }
        return count;
    }

    // ----- Helpers 工具 -----
    // 把這一層活著的格子變成 Box，放進第 layer 層（z = layer * cellSize），回傳這一層活格數
    int AddLayerBoxes(bool[,] grid, int layer, double cellSize, List<Box> allBoxes)
    {
        int width = grid.GetLength(0);
        int depth = grid.GetLength(1);
        double z0 = layer * cellSize;
        int aliveCount = 0;

        for (int x = 0; x < width; x++)
        {
            for (int y = 0; y < depth; y++)
            {
                if (!grid[x, y]) continue;
                aliveCount++;
                // 直接用格子座標建 Interval，方塊邊界與格線的對應一目了然（不靠 Plane 自動推算軸向）
                Box box = new Box(Plane.WorldXY,
                    new Interval(x * cellSize, (x + 1) * cellSize),
                    new Interval(y * cellSize, (y + 1) * cellSize),
                    new Interval(z0, z0 + cellSize));
                allBoxes.Add(box);
            }
        }
        return aliveCount;
    }
}
