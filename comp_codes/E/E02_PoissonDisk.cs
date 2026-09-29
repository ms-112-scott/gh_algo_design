// Grasshopper Script Instance
// ==================================================================
// E02 Poisson Disk Sampling｜Poisson 圓盤取樣
// 家族：E 排列與鬆弛　邏輯：搜尋／求解　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   minDistance    double  Item   點與點的最小間距            例：3.0
//   triesPerPoint  int     Item   每個點往外試幾次            例：30
//   width          double  Item   取樣範圍寬                  例：60.0
//   height         double  Item   取樣範圍深                  例：60.0
//   seed           int     Item   隨機種子                    例：0
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   poissonPoints                均勻但不規則的取樣點
//   randomPoints                 右邊是一樣多的純隨機點（對照組）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 建立邊長 minDistance/√2 的網格，保證每格最多一個點，用 int[,] 記錄格子裡是第幾個點（-1＝空）。
//   2. 隨機放第一個點，收下並列入「還能往外長」的名單。
//   3. 從名單隨機挑一個點，在它外圍 minDistance～2×minDistance 的圓環內隨機試放候選點。
//   4. 候選點只查周圍 5×5 格裡的點：全部都夠遠才收下，登記到網格並列入名單。
//   5. 試了 triesPerPoint 次都失敗，就把這個點移出名單；名單空了代表已經填滿，同時輸出同點數的純隨機點做對照。
// ------------------------------------------------------------------
// 你應該看到：左邊 60×60 範圍內，點與點間距都 ≥ 3 卻排列不規則的藍噪點；右邊並排著一樣多、會擠成一團的純隨機點
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
        double minDistance, int triesPerPoint, double width, double height, int seed,
        ref object poissonPoints, ref object randomPoints)
    {
        // ===== 0. 防呆 =====
        if (width < 0 || height < 0 || minDistance < 0)
        {
            Print("width、height、minDistance 必須大於 0");
            return;
        }
        if (minDistance == 0) minDistance = DefaultMinDistance;     // 沒接時用檔頭「例」的預設值
        if (width == 0) width = DefaultSize;
        if (height == 0) height = DefaultSize;
        if (triesPerPoint < 1) triesPerPoint = 30;
        bool hitTriesLimit = triesPerPoint > MaxTriesPerPoint;      // 每點試放次數太多會拖垮效能，夾住上限
        triesPerPoint = Math.Min(triesPerPoint, MaxTriesPerPoint);

        // minDistance 太小 → 網格格數 (邊長/minDistance)² 會暴增甚至溢位，夾到讓格數 ≤ MaxGridSide²
        double smallestDistance = Math.Max(width, height) * Math.Sqrt(2.0) / MaxGridSide;
        bool hitGridLimit = minDistance < smallestDistance;
        if (hitGridLimit) minDistance = smallestDistance;

        // ===== 1. DATA 資料：格邊 minDistance/√2 → 對角線剛好 minDistance，每格最多一點 =====
        var random = new Random(seed);
        double cellSize = minDistance / Math.Sqrt(2.0);
        int gridColumns = (int)(width / cellSize) + 1;
        int gridRows = (int)(height / cellSize) + 1;
        int[,] grid = new int[gridColumns, gridRows];
        for (int column = 0; column < gridColumns; column++)
            for (int row = 0; row < gridRows; row++)
                grid[column, row] = -1;                        // -1＝這格還沒有點

        var points = new List<Point3d>();                      // 收下的點（依收下順序）
        var activeList = new List<int>();                      // 還能往外長的點，存 points 的索引

        // ===== 2. INIT 初始：範圍內隨機放第一個點 =====
        Point3d firstPoint = new Point3d(random.NextDouble() * width, random.NextDouble() * height, 0);
        AddPoint(firstPoint, points, activeList, grid, cellSize);

        // ===== 3. LOOP 迭代：名單空了代表已經填滿 =====
        // 保證結束：每輪不是多收一點、就是名單少一點，點數有 MaxPoints 上限，迴圈一定會結束
        int stepCount = 0;
        bool hitPointLimit = false;
        while (activeList.Count > 0)
        {
            stepCount++;

            int listIndex = random.Next(activeList.Count);
            int pointIndex = activeList[listIndex];
            Point3d basePoint = points[pointIndex];

            bool foundCandidate = false;
            for (int tryNumber = 0; tryNumber < triesPerPoint; tryNumber++)
            {
                double angle = random.NextDouble() * Math.PI * 2;
                double radius = minDistance + random.NextDouble() * minDistance;   // minDistance ～ 2×minDistance 圓環
                Point3d candidate = new Point3d(
                    basePoint.X + Math.Cos(angle) * radius,
                    basePoint.Y + Math.Sin(angle) * radius, 0);

                if (candidate.X < 0 || candidate.X > width || candidate.Y < 0 || candidate.Y > height) continue;
                if (!IsFarEnough(candidate, points, grid, cellSize, gridColumns, gridRows, minDistance)) continue;

                AddPoint(candidate, points, activeList, grid, cellSize);
                foundCandidate = true;
                if (points.Count >= MaxPoints) { hitPointLimit = true; }
                break;                                          // 夠遠就收下，這一輪不用再試
            }

            if (!foundCandidate) activeList.RemoveAt(listIndex);    // 全失敗 → 移出名單
            if (hitPointLimit) { activeList.Clear(); break; }       // 碰到上限：清空名單直接結束
        }

        // ===== 4. OUTPUT 輸出：同點數的純隨機點做對照 =====
        double offsetX = width * 1.2;                          // 並排放在右邊，才看得出兩種分布的差別
        var randomList = new List<Point3d>();
        for (int number = 0; number < points.Count; number++)
            randomList.Add(new Point3d(offsetX + random.NextDouble() * width, random.NextDouble() * height, 0));

        if (hitGridLimit) Print("minDistance 太小，已調成 {0:0.###}", minDistance);
        if (hitTriesLimit) Print("triesPerPoint 太大，已夾到 {0}", MaxTriesPerPoint);
        if (hitPointLimit) Print("碰到點數上限 {0}，Poisson 取樣提早停止", MaxPoints);
        Print("Poisson 點 {0} 個，用了 {1} 輪", points.Count, stepCount);
        poissonPoints = points;
        randomPoints = randomList;
    }

    // ----- Fields 欄位 -----
    const double DefaultMinDistance = 3.0;          // 檔頭的「例」：minDistance 沒接時使用
    const double DefaultSize = 60.0;                // 檔頭的「例」：width／height 沒接時使用
    const int MaxPoints = 20000;                    // 點數上限：避免 minDistance 太小時無限增生
    const int MaxGridSide = 1000;                   // 網格單邊格數上限：避免 minDistance 太小時格數暴增或溢位
    const int MaxTriesPerPoint = 100;               // 每點試放次數上限：Bridson 建議 30，超過 100 幾乎不再變密

    // ----- RULE 規則：只查候選點周圍 5×5 格，夠遠才收下 -----
    bool IsFarEnough(Point3d candidate, List<Point3d> points, int[,] grid, double cellSize,
        int gridColumns, int gridRows, double minDistance)
    {
        int candidateColumn = (int)(candidate.X / cellSize);
        int candidateRow = (int)(candidate.Y / cellSize);

        int columnStart = Math.Max(0, candidateColumn - 2);    // minDistance 只有 √2 格寬，往外 2 格（5×5）一定涵蓋所有太近的點
        int columnEnd = Math.Min(gridColumns - 1, candidateColumn + 2);
        int rowStart = Math.Max(0, candidateRow - 2);
        int rowEnd = Math.Min(gridRows - 1, candidateRow + 2);

        for (int column = columnStart; column <= columnEnd; column++)
        {
            for (int row = rowStart; row <= rowEnd; row++)
            {
                int neighborIndex = grid[column, row];
                if (neighborIndex < 0) continue;               // 這格是空的
                if (candidate.DistanceTo(points[neighborIndex]) < minDistance) return false;
            }
        }
        return true;
    }

    // ----- Helpers 工具 -----
    // 收下候選點：加進清單、登記到網格、列入還能往外長的名單
    void AddPoint(Point3d point, List<Point3d> points, List<int> activeList, int[,] grid, double cellSize)
    {
        points.Add(point);
        int newIndex = points.Count - 1;
        int column = (int)(point.X / cellSize);
        int row = (int)(point.Y / cellSize);
        grid[column, row] = newIndex;
        activeList.Add(newIndex);
    }
}
