// Grasshopper Script Instance
// ==================================================================
// E01 Circle Packing｜圓填充
// 家族：E 排列與鬆弛　邏輯：迭代模擬　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   circleCount     int     Item   圓的數量                例：80
//   minRadius       double  Item   最小半徑                例：0.5
//   maxRadius       double  Item   最大半徑                例：2.0
//   boundaryRadius  double  Item   外圍邊界圓的半徑        例：15
//   iterations      int     Item   最多推幾次              例：500
//   seed            int     Item   隨機種子（沒接時為 0）      例：1
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   circles                      所有圓
//   totalOverlap                 最後剩下的總重疊量（越接近 0 越好）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 隨機產生 circleCount 個圓：圓心散在邊界中心附近，半徑介於 minRadius 與 maxRadius 之間（一開始一定大量重疊）。
//   2. 每一輪檢查所有圓的配對：兩圓重疊量＝r1+r2−距離，若大於 0，兩個圓沿連線各往反方向退一半重疊量。
//   3. 檢查每個圓是否超出外圍邊界圓，超出多少就往圓心拉回多少。
//   4. 把這一輪累積的位移一次套用（先算完再移動，避免順序影響結果）。
//   5. 重複直到總重疊量小於收斂門檻或迭代次數用完，輸出圓與剩餘重疊量。
// ------------------------------------------------------------------
// 你應該看到：半徑 15 的邊界內，80 個大小不一的圓緊密排成一團、彼此不重疊；out 顯示幾百次內收斂、剩下重疊量 < 0.001。
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
        int circleCount, double minRadius, double maxRadius,
        double boundaryRadius, int iterations, int seed,
        ref object circles, ref object totalOverlap)
    {
        // ===== 0. 防呆 =====
        if (circleCount < 1) circleCount = 80;
        if (minRadius <= 0) minRadius = 0.5;
        if (maxRadius <= 0) maxRadius = 2.0;                // 沒接時用例值，避免被下一行夾成 minRadius
        if (maxRadius < minRadius) maxRadius = minRadius;
        if (boundaryRadius <= 0) boundaryRadius = 15;
        if (iterations < 1) iterations = 500;
        bool countLimited = circleCount > MaxCircleCount;
        bool iterationLimited = iterations > MaxIterations;
        circleCount = Math.Min(circleCount, MaxCircleCount);
        iterations = Math.Min(iterations, MaxIterations);

        // ===== 1. DATA 資料：兩條平行清單，第 number 個圓＝centers[number] + radii[number] =====
        var random = new Random(seed);
        var centers = new List<Point3d>();                 // 圓心
        var radii = new List<double>();                    // 半徑

        // ===== 2. INIT 初始：圓心隨機散在中心附近，一開始一定大量重疊 =====
        for (int number = 0; number < circleCount; number++)
        {
            double angle = random.NextDouble() * Math.PI * 2;
            double distance = random.NextDouble() * boundaryRadius * 0.5;
            centers.Add(new Point3d(Math.Cos(angle) * distance, Math.Sin(angle) * distance, 0));
            radii.Add(minRadius + random.NextDouble() * (maxRadius - minRadius));
        }

        // ===== 3. LOOP 迭代：收斂就停 =====
        int usedIterations = 0;
        bool converged = false;
        for (int iteration = 1; iteration <= iterations; iteration++)
        {
            usedIterations = iteration;
            double overlapThisRound = PushApart(centers, radii, boundaryRadius);
            if (overlapThisRound < StopOverlap) { converged = true; break; }   // 收斂：幾乎沒有重疊就停
        }

        // ===== 4. OUTPUT 輸出 =====
        double finalOverlap = MeasureOverlap(centers, radii, boundaryRadius);
        string state = converged ? "已收斂" : "次數用完仍未收斂";
        Print("圓數 {0}，用了 {1} 次（{2}），剩下重疊量 {3:F4}", circleCount, usedIterations, state, finalOverlap);
        if (countLimited) Print("圓數已達上限 {0} 個", MaxCircleCount);
        if (iterationLimited) Print("迭代次數已達上限 {0} 次", MaxIterations);
        circles = MakeCircles(centers, radii);
        totalOverlap = finalOverlap;
    }

    // ----- Fields 欄位 -----
    const double StopOverlap = 0.001;                      // 總重疊量小於這個值就算收斂
    const int MaxCircleCount = 400;                        // 圓數量上限：這裡用 N² 兩兩比對示範原理，數量再多要用 E02 的網格分桶
    const int MaxIterations = 2000;                        // 推擠次數上限：避免永遠不收斂時當機

    // ----- RULE 規則：推一次，回傳這一輪量到的總重疊量 -----
    double PushApart(List<Point3d> centers, List<double> radii, double boundaryRadius)
    {
        int circleCount = centers.Count;
        var moves = new Vector3d[circleCount];             // 每個圓這一輪要移動多少，預設 (0,0,0)
        double overlapThisRound = 0;

        // --- 規則 1：兩兩互推 ---
        for (int first = 0; first < circleCount; first++)
        {
            for (int second = first + 1; second < circleCount; second++)  // 從 first+1 開始：每一對只算一次
            {
                Vector3d firstToSecond = centers[second] - centers[first];
                double distance = firstToSecond.Length;
                double overlap = radii[first] + radii[second] - distance;
                if (overlap <= 0) continue;                                // 沒重疊，跳過

                if (distance < 1e-9) firstToSecond = Vector3d.XAxis;       // 圓心重合，方向無法定義，指定固定方向照常推開
                else firstToSecond.Unitize();
                moves[first] -= firstToSecond * overlap * 0.5;            // first 往後退一半
                moves[second] += firstToSecond * overlap * 0.5;           // second 往前推一半
                overlapThisRound += overlap;
            }
        }

        // --- 規則 2：邊界拉回 ---
        for (int number = 0; number < circleCount; number++)
        {
            Vector3d fromCenter = new Vector3d(centers[number]);          // 世界原點 → 圓心
            double outside = fromCenter.Length + radii[number] - boundaryRadius;
            if (outside <= 0) continue;

            fromCenter.Unitize();
            moves[number] -= fromCenter * outside;
            overlapThisRound += outside;
        }

        // --- 套用位移：先累積、再一起移動 ---
        // Point3d 是 struct：centers[number].X += 1 會編譯錯誤，必須算出新的點再整個寫回 List
        for (int number = 0; number < circleCount; number++)
            centers[number] = centers[number] + moves[number];

        return overlapThisRound;
    }

    // ----- Helpers 工具 -----
    // 量總重疊量：圓與圓的重疊 + 圓超出邊界的量
    double MeasureOverlap(List<Point3d> centers, List<double> radii, double boundaryRadius)
    {
        double total = 0;
        for (int first = 0; first < centers.Count; first++)
        {
            for (int second = first + 1; second < centers.Count; second++)
            {
                double overlap = radii[first] + radii[second] - centers[first].DistanceTo(centers[second]);
                if (overlap > 0) total += overlap;
            }
            double outside = centers[first].DistanceTo(Point3d.Origin) + radii[first] - boundaryRadius;
            if (outside > 0) total += outside;
        }
        return total;
    }

    // 把圓心＋半徑組成 Circle 清單
    List<Circle> MakeCircles(List<Point3d> centers, List<double> radii)
    {
        var allCircles = new List<Circle>();
        for (int number = 0; number < centers.Count; number++)
            allCircles.Add(new Circle(centers[number], radii[number]));
        return allCircles;
    }
}
