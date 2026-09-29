// Grasshopper Script Instance
// ==================================================================
// B01 Differential Growth｜差異生長
// 家族：B 生長　邏輯：迭代模擬　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   steps            int     Item   迭代次數                          例：150
//   startRadius      double  Item   起始圓半徑                        例：20
//   maxEdgeLength    double  Item   邊長超過這個值就插新點            例：2
//   repelRadius      double  Item   互斥半徑（多近算太近）            例：4
//   repelStrength    double  Item   互推力道                          例：0.5
//   attractStrength  double  Item   往前後鄰居中點靠的力道            例：0.3
//   maxPoints        int     Item   點數上限（效能保險絲，≤1500）     例：400
//   seed             int     Item   隨機種子                          例：1
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   curve                        生長後的封閉曲線
//   points                       曲線上的所有點
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 在半徑 startRadius 的圓上依 maxEdgeLength 間距排一圈點，加一點隨機擾動打破完美對稱。
//   2. 每一步：點與點距離小於 repelRadius 就互相推開，越近推越多；同一個點若被多個鄰居推，取平均位移，避免單步暴衝（規則 1）。
//   3. 每個點同時往前後鄰居的中點靠，讓曲線保持平滑連續（規則 2）。
//   4. 把這一步累積的位移一次加回所有點（同步更新，不是動一個立刻影響下一個）。
//   5. 邊長超過 maxEdgeLength 就在中點插入新點（規則 3），曲線因此越長越皺；點數到 maxPoints 就不再插點。
//   6. 重複 steps 次後，把所有點串成封閉曲線輸出。
// ------------------------------------------------------------------
// 你應該看到：預設值下逐步長出平滑的珊瑚指狀封閉曲線，過程中不會自我交叉，約 143 次後點數到上限、之後只鬆弛不再變長。
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
        int steps, double startRadius, double maxEdgeLength,
        double repelRadius, double repelStrength, double attractStrength,
        int maxPoints, int seed,
        ref object curve, ref object points)
    {
        // ===== 0. 防呆 =====
        // 沒接的數值輸入會是 0：先補成檔頭的建議預設值，再檢查真的不合理（例如接了負值）才中止
        if (startRadius == 0) startRadius = 20;
        if (maxEdgeLength == 0) maxEdgeLength = 2;
        if (repelRadius == 0) repelRadius = 4;
        if (startRadius <= 0 || maxEdgeLength <= 0 || repelRadius <= 0)
        {
            Print("startRadius、maxEdgeLength、repelRadius 必須大於 0");
            return;
        }
        if (steps <= 0) steps = 150;
        bool stepsCapped = steps > MaxSteps;
        steps = Math.Min(steps, MaxSteps);                                 // 上限常數保險絲，slider 拉太高也不會卡住
        if (repelStrength <= 0) repelStrength = 0.5;
        repelStrength = Math.Max(0, Math.Min(repelStrength, 1));           // 力道過大時互推位移會遠超過 repelRadius
        if (attractStrength <= 0) attractStrength = 0.3;
        attractStrength = Math.Max(0, Math.Min(attractStrength, 1));       // >1 會越過中點，>2 鋸齒模式每步放大、最終發散成 NaN
        if (maxPoints <= 0) maxPoints = 400;
        if (seed == 0) seed = 1;
        maxPoints = Math.Max(8, Math.Min(maxPoints, AbsoluteMaxPoints));    // 8～1500，避免 O(n²) 互推爆掉

        // ===== 1. DATA 資料 =====
        var random = new Random(seed);
        var growthPoints = new List<Point3d>();                            // 曲線上的所有點，依順序連成封閉多邊形

        // ===== 2. INIT 初始：圓周排點（每 maxEdgeLength 一點，至少 8 個），加小擾動打破完美對稱 =====
        double circumference = 2 * Math.PI * startRadius;
        int startCount = Math.Max(8, (int)(circumference / maxEdgeLength));
        bool startCountCapped = startCount > maxPoints;
        startCount = Math.Min(startCount, maxPoints);                      // 起始點數不能超過點數上限，否則直接繞過 maxPoints 保險絲
        if (startCountCapped) Print("起始圓周點數超過 maxPoints，已收斂到 {0} 個點", startCount);
        double jitterAmount = maxEdgeLength * 0.1;
        for (int index = 0; index < startCount; index++)
        {
            double angle = (Math.PI * 2 * index) / startCount;
            double jitterX = (random.NextDouble() - 0.5) * jitterAmount;
            double jitterY = (random.NextDouble() - 0.5) * jitterAmount;
            growthPoints.Add(new Point3d(
                Math.Cos(angle) * startRadius + jitterX,
                Math.Sin(angle) * startRadius + jitterY,
                0));
        }

        // ===== 3. LOOP 迭代：每一步先算位移、同步套用，再看邊長要不要插點 =====
        int usedSteps = 0;
        bool hitPointCap = false;
        for (int step = 1; step <= steps; step++)
        {
            usedSteps = step;
            var moves = new Vector3d[growthPoints.Count];                  // 這一步每個點要移動多少，預設 (0,0,0)
            AddRepelMoves(growthPoints, repelRadius, repelStrength, moves);
            AddAttractMoves(growthPoints, attractStrength, moves);

            // 位移先全部算好、再一起套用：避免先動的點影響同一步裡還沒算的點
            for (int index = 0; index < growthPoints.Count; index++)
                growthPoints[index] = growthPoints[index] + moves[index];

            InsertPoints(growthPoints, maxEdgeLength, maxPoints);
            if (growthPoints.Count >= maxPoints) hitPointCap = true;
        }

        // ===== 4. OUTPUT 輸出 =====
        var polyline = new Polyline(growthPoints);
        polyline.Add(growthPoints[0]);                                     // 頭尾相接，收成封閉曲線
        Print("跑了 {0} 次，{1} 個點{2}{3}", usedSteps, growthPoints.Count,
            hitPointCap ? "（已到點數上限，之後只鬆弛）" : "",
            stepsCapped ? "；steps 超過上限，已夾到 " + MaxSteps : "");
        curve = polyline;
        points = growthPoints;
    }

    // ----- Fields 欄位 -----
    const int AbsoluteMaxPoints = 1500;    // 點數硬上限：互推是 O(n²)（分桶後平均近似 O(n)），太多點還是會變慢
    const int MaxSteps = 2000;             // 迭代次數上限：每步都要重建格子＋互推，slider 拉到數萬會長時間卡住

    // ----- RULE 規則：repelRadius 內的兩點互推，越近推越多 -----
    void AddRepelMoves(List<Point3d> growthPoints, double repelRadius, double repelStrength, Vector3d[] moves)
    {
        // 點數可能上千，逐對比較是 O(n²)；用格子分桶只比較鄰近格子，平均近似 O(n)
        double repelRadiusSquared = repelRadius * repelRadius;
        var grid = BuildGrid(growthPoints, repelRadius);
        var collisionCounts = new int[growthPoints.Count];                 // 每個點被推的次數，用來把推力平均，避免鄰居一多位移就暴衝

        for (int first = 0; first < growthPoints.Count; first++)
        {
            var cell = CellKey(growthPoints[first], repelRadius);
            for (int dx = -1; dx <= 1; dx++)
            {
                for (int dy = -1; dy <= 1; dy++)
                {
                    List<int> bucket;
                    if (!grid.TryGetValue((cell.Item1 + dx, cell.Item2 + dy), out bucket)) continue;

                    foreach (int second in bucket)
                    {
                        if (second <= first) continue;                     // 每一對只算一次（含跳過自己）
                        Vector3d firstToSecond = growthPoints[second] - growthPoints[first];
                        double distanceSquared = firstToSecond.SquareLength;   // 先比平方，省開根號
                        if (distanceSquared >= repelRadiusSquared || distanceSquared < 1e-12) continue;

                        double distance = Math.Sqrt(distanceSquared);
                        double push = (repelRadius - distance) * repelStrength;   // 越近，push 越大
                        firstToSecond.Unitize();
                        moves[first] -= firstToSecond * push;
                        moves[second] += firstToSecond * push;
                        collisionCounts[first] += 1;
                        collisionCounts[second] += 1;
                    }
                }
            }
        }

        for (int index = 0; index < moves.Length; index++)                 // 被多個鄰居同時推時取平均，單步位移才不會遠超過 repelRadius
        {
            if (collisionCounts[index] > 0) moves[index] /= collisionCounts[index];
        }
    }

    // ----- RULE 規則：往前後兩個鄰居的中點靠，維持曲線平滑（頭尾相接，用取餘數環繞） -----
    void AddAttractMoves(List<Point3d> growthPoints, double attractStrength, Vector3d[] moves)
    {
        int count = growthPoints.Count;
        for (int index = 0; index < count; index++)
        {
            Point3d previous = growthPoints[(index - 1 + count) % count];
            Point3d next = growthPoints[(index + 1) % count];
            Point3d midpoint = new Point3d(
                (previous.X + next.X) * 0.5,
                (previous.Y + next.Y) * 0.5,
                (previous.Z + next.Z) * 0.5);
            moves[index] += (midpoint - growthPoints[index]) * attractStrength;
        }
    }

    // ----- RULE 規則：邊長超過 maxEdgeLength 就在中點插入新點，最多插到 maxPoints -----
    void InsertPoints(List<Point3d> growthPoints, double maxEdgeLength, int maxPoints)
    {
        int index = 0;
        while (index < growthPoints.Count)                                 // Count 會邊插邊變大，保證會結束
        {
            if (growthPoints.Count >= maxPoints) break;                    // 點數保險絲

            Point3d current = growthPoints[index];
            Point3d next = growthPoints[(index + 1) % growthPoints.Count]; // 最後一點的下一個繞回第一點
            if (current.DistanceTo(next) > maxEdgeLength)
            {
                Point3d newPoint = new Point3d(
                    (current.X + next.X) * 0.5,
                    (current.Y + next.Y) * 0.5,
                    (current.Z + next.Z) * 0.5);
                growthPoints.Insert(index + 1, newPoint);
                index += 2;                                                // 跳過剛插入的新點，這一輪不再檢查它
            }
            else
            {
                index += 1;
            }
        }
    }

    // ----- Helpers 工具 -----
    // 把點依 XY 座標分裝進邊長 cellSize 的格子，AddRepelMoves 只需要比對鄰近 3x3 格
    Dictionary<(int, int), List<int>> BuildGrid(List<Point3d> growthPoints, double cellSize)
    {
        var grid = new Dictionary<(int, int), List<int>>();
        for (int index = 0; index < growthPoints.Count; index++)
        {
            var key = CellKey(growthPoints[index], cellSize);
            List<int> bucket;
            if (!grid.TryGetValue(key, out bucket))
            {
                bucket = new List<int>();
                grid[key] = bucket;
            }
            bucket.Add(index);
        }
        return grid;
    }

    (int, int) CellKey(Point3d point, double cellSize)
    {
        return ((int)Math.Floor(point.X / cellSize), (int)Math.Floor(point.Y / cellSize));
    }
}
