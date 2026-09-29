// Grasshopper Script Instance
// ==================================================================
// B02 Diffusion-Limited Aggregation｜DLA 擴散限制聚集
// 家族：B 生長　邏輯：迭代模擬　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   particleCount   int     Item   要黏住的粒子總數（不含種子）    例：300
//   stickDistance   double  Item   黏住距離，也是枝段長度與格子大小 例：1.0
//   stepSize        double  Item   每一步隨機走的距離              例：1.0
//   seed            int     Item   隨機種子                        例：0
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   points                       黏住的粒子位置（含原點種子）
//   lines                        每點連到它黏住的父點，形成樹枝
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 原點放一顆種子點，當作群集的起點。
//   2. 新粒子從比群集稍大的圓上出發，每一步往隨機方向走 stepSize；離群集越遠就走越大步以加速。
//   3. 靠近群集時用格子空間索引找 stickDistance 內最近的已黏點，找到就黏住，並把位置對齊到剛好 stickDistance，讓枝段等長。
//   4. 走出逃逸圓就回到出發圓重來；單顆粒子超過步數上限就整個模擬提前停止。
//   5. 每顆黏住的粒子記錄它黏在哪一顆上（stuckToIndex），最後輸出點與父子連線形成樹。
// ------------------------------------------------------------------
// 你應該看到：用預設值時，從原點開始往外長出像珊瑚或閃電一樣的分岔樹枝狀結構。
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
        int particleCount, double stickDistance, double stepSize, int seed,
        ref object points, ref object lines)
    {
        // ===== 0. 防呆 =====
        if (particleCount < 1) particleCount = 300;                       // 沒接：預設長 300 顆
        bool hitCountLimit = particleCount > MaxParticleCount;            // 記下有沒有被上限夾住，最後要提醒
        particleCount = Math.Min(particleCount, MaxParticleCount);        // 上限：避免格子索引也扛不住的量
        if (stickDistance <= 0) stickDistance = 1.0;
        if (stepSize <= 0) stepSize = 1.0;                                // 沒接步長：用檔頭寫的例，不是跟著 stickDistance 變

        // ===== 1. DATA 資料：黏住的點、每點黏在誰身上、格子空間索引 =====
        var random = new Random(seed);
        var stuckPoints = new List<Point3d>();
        var stuckToIndex = new List<int>();
        var finder = new NearbyPointFinder(stickDistance);

        // ===== 2. INIT 初始：原點放一顆種子 =====
        stuckPoints.Add(Point3d.Origin);
        stuckToIndex.Add(-1);                                             // -1＝種子，沒有父點
        finder.Add(Point3d.Origin);
        double clusterRadius = 0;                                         // 目前群集離原點最遠的距離

        // ===== 3. LOOP 迭代 =====
        bool stoppedEarly = false;                                        // 單顆粒子走滿 MaxWalkSteps 仍沒黏住
        bool stoppedByBudget = false;                                     // 全部粒子累計走滿 MaxTotalSteps
        long totalStepsUsed = 0;                                          // 所有粒子累計走過幾小段，避免整體卡住
        for (int particleIndex = 0; particleIndex < particleCount; particleIndex++)
        {
            Point3d stuckPosition;
            int parentIndex;
            bool ranOutOfBudget;
            bool didStick = WalkUntilStuck(finder, clusterRadius, stickDistance, stepSize, random,
                ref totalStepsUsed, MaxTotalSteps, out stuckPosition, out parentIndex, out ranOutOfBudget);
            if (!didStick)
            {
                if (ranOutOfBudget) stoppedByBudget = true;               // 累計步數用完 → 停整個模擬
                else stoppedEarly = true;                                 // 這一顆走太久沒黏住 → 停整個模擬
                break;
            }

            stuckPoints.Add(stuckPosition);
            stuckToIndex.Add(parentIndex);
            finder.Add(stuckPosition);
            clusterRadius = Math.Max(clusterRadius, stuckPosition.DistanceTo(Point3d.Origin));
        }

        // ===== 4. OUTPUT 輸出 =====
        var branchLines = new List<Line>();
        for (int index = 1; index < stuckPoints.Count; index++)
            branchLines.Add(new Line(stuckPoints[stuckToIndex[index]], stuckPoints[index]));

        int stuckCount = stuckPoints.Count - 1;                           // 不算種子
        string countLimitNote = hitCountLimit ? string.Format("（particleCount 已達上限 {0}）", MaxParticleCount) : "";
        if (stoppedByBudget)
            Print("黏住 {0} / {1} 顆後，全部粒子累計走滿 {2} 小段，提前結束{3}", stuckCount, particleCount, MaxTotalSteps, countLimitNote);
        else if (stoppedEarly)
            Print("黏住 {0} / {1} 顆後，單顆粒子走滿 {2} 步仍未黏住，提前結束{3}", stuckCount, particleCount, MaxWalkSteps, countLimitNote);
        else
            Print("黏住 {0} 顆粒子，群集半徑 {1:F2}{2}", stuckCount, clusterRadius, countLimitNote);
        points = stuckPoints;
        lines = branchLines;
    }

    // ----- Fields 欄位 -----
    // 一顆粒子最多走幾步；走這麼久還黏不上，多半是參數讓它跳過群集，整個模擬就停，避免 GH 卡住
    const int MaxWalkSteps = 100000;
    const int MaxParticleCount = 2000;         // 粒子總數上限，避免 GH 卡住
    const long MaxTotalSteps = 5000000;        // 所有粒子累計最多走幾小段；stepSize 很小、粒子很多時也不會卡住 GH
    const double SpawnMarginCells = 5.0;       // 出發圓比目前群集半徑多幾個 stickDistance
    const double EscapeMultiplier = 3.0;       // 逃逸圓 = 出發圓半徑 × 這個倍數

    // ----- RULE 規則：一顆粒子從出發圓亂走，碰到群集就黏住 -----
    bool WalkUntilStuck(NearbyPointFinder finder, double clusterRadius, double stickDistance, double stepSize,
        Random random, ref long totalStepsUsed, long maxTotalSteps,
        out Point3d stuckPosition, out int parentIndex, out bool ranOutOfBudget)
    {
        ranOutOfBudget = false;
        double spawnRadius = clusterRadius + stickDistance * SpawnMarginCells;
        double escapeRadius = spawnRadius * EscapeMultiplier;
        Point3d particle = PointOnCircle(spawnRadius, random);

        for (int step = 0; step < MaxWalkSteps; step++)
        {
            double distanceFromOrigin = particle.DistanceTo(Point3d.Origin);
            if (distanceFromOrigin > escapeRadius)
            {
                particle = PointOnCircle(spawnRadius, random);            // 走出逃逸圓 → 回到出發圓重來
                continue;
            }

            double gapToCluster = Math.Max(0, distanceFromOrigin - clusterRadius);
            double angle = random.NextDouble() * Math.PI * 2;
            Vector3d direction = new Vector3d(Math.Cos(angle), Math.Sin(angle), 0);
            bool isFarFromCluster = gapToCluster > stickDistance * 2;

            // 離群集還很遠：步長只看幾何上的安全距離（半個間隙），不受 stepSize 拖累也不會跳過群集
            // 靠近群集：用使用者設定的 stepSize（越大越粗鈍），但切成不超過 stickDistance 的小段，
            // 每段都查一次最近點，步長再大也不會整段跳過群集，只會因為一次跨得遠而略過細枝（粗鈍的來源）
            double moveStep = isFarFromCluster ? gapToCluster * 0.5 : stepSize;
            double remaining = moveStep;
            while (remaining > 1e-9)
            {
                if (totalStepsUsed >= maxTotalSteps)
                {
                    ranOutOfBudget = true;
                    stuckPosition = Point3d.Origin;
                    parentIndex = -1;
                    return false;                                         // 累計步數用完 → 整個模擬停止
                }
                totalStepsUsed++;

                double segmentLength = isFarFromCluster ? remaining : Math.Min(remaining, stickDistance);
                particle = particle + direction * segmentLength;
                remaining -= segmentLength;

                int nearestIndex;
                double nearestDistance;
                if (finder.FindNearest(particle, stickDistance, out nearestIndex, out nearestDistance))
                {
                    Vector3d fromParent = particle - finder.PointAt(nearestIndex);
                    if (fromParent.Length < 1e-9) fromParent = new Vector3d(1, 0, 0);
                    fromParent.Unitize();
                    stuckPosition = finder.PointAt(nearestIndex) + fromParent * stickDistance;   // 對齊到剛好 stickDistance，枝段等長
                    parentIndex = nearestIndex;
                    return true;
                }
            }
        }

        stuckPosition = Point3d.Origin;
        parentIndex = -1;
        return false;                                                     // 走滿步數還沒黏住
    }

    // ----- Helpers 工具 -----
    // 圓上隨機一點（z = 0，平面內生長）
    Point3d PointOnCircle(double radius, Random random)
    {
        double angle = random.NextDouble() * Math.PI * 2;
        return new Point3d(Math.Cos(angle) * radius, Math.Sin(angle) * radius, 0);
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================
// 空間索引：把點依座標分格存放，只需查詢附近幾格就能找到最近點，不必比對全部點（避免 O(n²)）
class NearbyPointFinder
{
    List<Point3d> points = new List<Point3d>();
    double cellSize;
    Dictionary<long, List<int>> grid = new Dictionary<long, List<int>>();

    public NearbyPointFinder(double cellSize)
    {
        this.cellSize = Math.Max(cellSize, 1e-6);
    }

    public Point3d PointAt(int index)
    {
        return points[index];
    }

    public void Add(Point3d point)
    {
        points.Add(point);
        long key = CellKey(point);
        List<int> bucket;
        if (!grid.TryGetValue(key, out bucket))
        {
            bucket = new List<int>();
            grid[key] = bucket;
        }
        bucket.Add(points.Count - 1);
    }

    // 找 maxDistance 內最近的已加入點；只查詢周圍 3×3 格
    public bool FindNearest(Point3d query, double maxDistance, out int nearestIndex, out double nearestDistance)
    {
        nearestIndex = -1;
        nearestDistance = double.MaxValue;
        int centerX = (int)Math.Floor(query.X / cellSize);
        int centerY = (int)Math.Floor(query.Y / cellSize);

        for (int offsetX = -1; offsetX <= 1; offsetX++)
        {
            for (int offsetY = -1; offsetY <= 1; offsetY++)
            {
                long key = CellKey(centerX + offsetX, centerY + offsetY);
                List<int> bucket;
                if (!grid.TryGetValue(key, out bucket)) continue;

                foreach (int index in bucket)
                {
                    double distance = points[index].DistanceTo(query);
                    if (distance < nearestDistance)
                    {
                        nearestDistance = distance;
                        nearestIndex = index;
                    }
                }
            }
        }

        return nearestIndex >= 0 && nearestDistance <= maxDistance;
    }

    long CellKey(Point3d point)
    {
        return CellKey((int)Math.Floor(point.X / cellSize), (int)Math.Floor(point.Y / cellSize));
    }

    long CellKey(int cellX, int cellY)
    {
        return ((long)cellX << 32) ^ (uint)cellY;                        // 兩個格子座標併成一個 key
    }
}
