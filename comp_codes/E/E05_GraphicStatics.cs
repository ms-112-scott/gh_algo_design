// Grasshopper Script Instance
// ==================================================================
// E05 Graphic Statics (Funicular Polygon & Force Diagram)｜圖解靜力學（索多邊形與力圖）
// 家族：E 排列與鬆弛　邏輯：幾何轉換／直接公式　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   span           double  Item   跨度（兩支承點之間的水平距離）    例：20
//   loadCount      int     Item   載重數量（沿跨度等距排列）        例：6
//   loadVariation  double  Item   載重大小的隨機變化比例 0–1        例：0.3
//   seed           int     Item   隨機種子，同一種子得到同一組載重  例：1
//   sag            double  Item   指定矢高（索或拱離支承連線的最大距離）例：4
//   asArch         bool    Item   false=下垂受拉的索　true=上拱受壓的拱 例：false
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   formLines                    形狀圖：索多邊形各段
//   loadLines                    形狀圖：載重箭頭
//   forceLines                   力圖：載重線＋極點射線
//   trialLines                   教學用：試算索多邊形與閉合線
//   forces                       各段內力（與 formLines 一一對應；拉力為正，壓力為負）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 沿跨度等距放 loadCount 個垂直載重，大小依 loadVariation 與 seed 隨機變化。
//   2. 力圖：把載重向量首尾相接，排成一條垂直的載重線（放在形狀圖右邊）。
//   3. 先隨便選一個試算極點，畫出試算索多邊形，連出閉合線；從試算極點畫閉合線的平行線交載重線於 K，分出兩端支承反力。
//   4. 縱距與極距成反比：用「試算最大縱距 ÷ 指定矢高 sag」反推真極距，真極點放在 K 的水平線上，重畫索多邊形使其剛好通過兩支承。
//   5. asArch 為真時，極點換到載重線另一側，索多邊形變成純受壓的拱。
//   6. 輸出形狀圖、載重箭頭、力圖、試算線，並以射線長度除以比例得到各段內力。
// ------------------------------------------------------------------
// 你應該看到：預設值下，一條左右對稱、中央下垂的索多邊形（6 段），右邊力圖顯示對應的載重線與極點射線。
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
using Rhino.Geometry.Intersect;

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
      double span, int loadCount, double loadVariation, int seed, double sag, bool asArch,
      ref object formLines, ref object loadLines, ref object forceLines, ref object trialLines, ref object forces)
    {
        // ===== 0. 防呆 =====
        if (span <= 0) span = 20;                                       // 沒接跨度 → 用檔頭建議值
        if (sag <= 0) sag = 4;                                          // 沒接矢高 → 用檔頭建議值
        if (loadCount < 1) loadCount = 6;
        loadCount = Math.Min(loadCount, MaxLoadCount);                  // 上限，避免拖到卡頓
        loadVariation = Math.Max(0, Math.Min(loadVariation, 1));        // 夾到 0–1

        // ===== 1. DATA 資料：沿跨度等距放 loadCount 個垂直載重 =====
        var random = new Random(seed);
        double[] loadPositions = new double[loadCount];
        double[] loadMagnitudes = new double[loadCount];
        double totalLoad = 0;
        for (int i = 0; i < loadCount; i++)
        {
            loadPositions[i] = span * (i + 0.5) / loadCount;                                 // 每個載重的作用線位置
            loadMagnitudes[i] = Math.Max(0.05, 1.0 + loadVariation * (random.NextDouble() * 2 - 1));
            totalLoad += loadMagnitudes[i];
        }

        // ===== 2. INIT 初始：力圖（載重首尾相接成載重線） =====
        double forceScale = span * 0.6 / totalLoad;                     // 力 → 圖面長度的比例，只用在力圖
        double forceDiagramX = span * 1.4;                              // 力圖畫在形狀圖右邊的 x 位置
        List<Point3d> loadLinePoints = new List<Point3d>();
        loadLinePoints.Add(new Point3d(forceDiagramX, 0, 0));
        for (int i = 0; i < loadCount; i++)
            loadLinePoints.Add(loadLinePoints[i] + new Vector3d(0, -loadMagnitudes[i] * forceScale, 0));

        double poleSide = asArch ? -1 : 1;                              // 索 → 極點在右側；拱 → 極點在左側
        Point3d leftSupport = new Point3d(0, 0, 0);
        Point3d rightSupport = new Point3d(span, 0, 0);

        // ===== 3. LOOP 作圖：先試算、再修正 =====
        // 3a. 試算極點：極距隨便取，高度取載重線中點
        double trialPoleDistance = span * 0.4;
        Point3d trialPole = new Point3d(forceDiagramX + poleSide * trialPoleDistance, loadLinePoints[loadCount].Y / 2, 0);
        List<Point3d> trialFunicular = DrawFunicular(leftSupport, trialPole, loadLinePoints, loadPositions, span);
        Point3d trialEnd = trialFunicular[trialFunicular.Count - 1];    // 試算索多邊形落在右支承垂直線上的點

        // 3b. 閉合線 leftSupport → trialEnd；從試算極點畫閉合線的平行線，交載重線於 K（分出兩端反力）
        double closingSlope = (trialEnd.Y - leftSupport.Y) / span;
        double kPointY = trialPole.Y + closingSlope * (forceDiagramX - trialPole.X);

        // 3c. 三點條件：縱距（離閉合線的垂直距離）與極距成反比 → 反推真極距
        double maxDepth = 0;
        for (int k = 1; k <= loadCount; k++)
        {
            double closingLineY = leftSupport.Y + closingSlope * trialFunicular[k].X;
            maxDepth = Math.Max(maxDepth, Math.Abs(trialFunicular[k].Y - closingLineY));
        }
        double poleDistance = trialPoleDistance * maxDepth / sag;       // 縱距 × 極距 = 常數 → 換矢高等於換極距
        Point3d truePole = new Point3d(forceDiagramX + poleSide * poleDistance, kPointY, 0);

        // 3d. 用真極點重畫索多邊形，這次應該剛好通過兩個支承
        List<Point3d> funicular = DrawFunicular(leftSupport, truePole, loadLinePoints, loadPositions, span);
        Print("右端誤差 = " + funicular[funicular.Count - 1].DistanceTo(rightSupport).ToString("0.0000"));
        Print("水平推力 H = " + (poleDistance / forceScale).ToString("0.000") + "（載重單位）");

        // ===== 4. OUTPUT 輸出 =====
        List<Line> formSegments = new List<Line>();
        List<double> segmentForces = new List<double>();
        List<Line> poleRays = new List<Line>();
        for (int j = 0; j <= loadCount; j++)
        {
            formSegments.Add(new Line(funicular[j], funicular[j + 1]));
            double force = truePole.DistanceTo(loadLinePoints[j]) / forceScale;   // 射線長度＝內力大小
            segmentForces.Add(asArch ? -force : force);
            poleRays.Add(new Line(truePole, loadLinePoints[j]));
        }

        List<Line> loadArrows = new List<Line>();
        for (int i = 0; i < loadCount; i++)
        {
            Point3d tip = funicular[i + 1];
            loadArrows.Add(new Line(tip + new Vector3d(0, loadMagnitudes[i] * forceScale * 0.5, 0), tip));
        }

        List<Line> forceDiagram = new List<Line>();
        for (int i = 0; i < loadCount; i++) forceDiagram.Add(new Line(loadLinePoints[i], loadLinePoints[i + 1]));
        forceDiagram.AddRange(poleRays);

        List<Line> trialDiagram = new List<Line>();
        for (int j = 0; j + 1 < trialFunicular.Count; j++) trialDiagram.Add(new Line(trialFunicular[j], trialFunicular[j + 1]));
        trialDiagram.Add(new Line(leftSupport, trialEnd));                                       // 閉合線
        trialDiagram.Add(new Line(trialPole, new Point3d(forceDiagramX, kPointY, 0)));           // 閉合線的平行射線 → K

        formLines = formSegments;
        loadLines = loadArrows;
        forceLines = forceDiagram;
        trialLines = trialDiagram;
        forces = segmentForces;
    }

    // ----- Fields 欄位 -----
    const int MaxLoadCount = 500;                                       // 載重數量上限，避免拖到卡頓

    // ----- RULE 規則：從 start 出發，每段平行於「極點 → 載重線分點」的射線 -----
    List<Point3d> DrawFunicular(Point3d start, Point3d pole, List<Point3d> loadLinePoints, double[] loadPositions, double span)
    {
        List<Point3d> points = new List<Point3d>();
        points.Add(start);
        Point3d current = start;
        for (int j = 0; j < loadLinePoints.Count; j++)
        {
            Vector3d direction = pole - loadLinePoints[j];
            if (direction.X < 0) direction = -direction;                                  // 一律往右畫，方向不影響交點結果
            double nextX = (j < loadPositions.Length) ? loadPositions[j] : span;          // 下一條載重作用線（最後一段交右支承線）
            current = IntersectVertical(current, direction, nextX);
            points.Add(current);
        }
        return points;
    }

    // ----- Helpers 工具 -----
    // 從 point 沿 direction 的直線，與垂直線 x = x0 的交點
    Point3d IntersectVertical(Point3d point, Vector3d direction, double x0)
    {
        Line ray = new Line(point, point + direction);
        Line vertical = new Line(new Point3d(x0, -1, 0), new Point3d(x0, 1, 0));
        double rayParameter, verticalParameter;
        if (Intersection.LineLine(ray, vertical, out rayParameter, out verticalParameter)) return ray.PointAt(rayParameter);
        return point;                                                                     // 平行（極點剛好在同高度）時不移動
    }
}
