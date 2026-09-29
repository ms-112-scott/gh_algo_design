// Grasshopper Script Instance
// ==================================================================
// E03 Voronoi + Lloyd Relaxation｜Voronoi 圖＋Lloyd 鬆弛
// 家族：E 排列與鬆弛　邏輯：幾何轉換／迭代模擬　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   pointCount   int     Item   細胞（種子點）數量           例：40
//   width        double  Item   外框矩形寬                    例：100
//   height       double  Item   外框矩形高                    例：100
//   iterations   int     Item   Lloyd 鬆弛重複幾次            例：0（0＝純 Voronoi；slider 建議 0–20，約 8 次就明顯均勻）
//   seed         int     Item   隨機種子                      例：0
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   cells                        每個點的 Voronoi 細胞（封閉 Polyline）
//   points                       鬆弛後的最終點位
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 用種子在矩形內隨機撒 pointCount 個點，當作每個細胞的起始種子。
//   2. 每個點從整個矩形開始，輪流被其他每一個點切一刀：算兩點間的垂直平分線，用內積判斷目前多邊形每個角點在哪一側，只留下靠近自己的那半（半平面切割）。
//   3. 全部點都切完一輪，就得到當下的 Voronoi 圖（大小可能很不平均）。
//   4. Lloyd 鬆弛：用鞋帶公式算出每個細胞的面積重心，把點搬到重心，再用新的點重新切一次，重複 iterations 次；細胞會越來越接近大小一致的六角形。
//   5. 角點少於 3 個的退化細胞捨棄，其餘細胞首尾相接成封閉線，並印出細胞總面積（應接近矩形面積）。
// ------------------------------------------------------------------
// 你應該看到：iterations = 0 時細胞大小懸殊，拉到 8 左右變成均勻、接近蜂巢的鑲嵌。
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
        int pointCount, double width, double height, int iterations, int seed,
        ref object cells, ref object points)
    {
        // ===== 0. 防呆：沒接的輸入用檔頭的建議預設值 =====
        if (pointCount < 1) pointCount = 40;
        if (width <= 0) width = 100;
        if (height <= 0) height = 100;
        bool countLimited = pointCount > MaxPointCount;
        bool iterationLimited = iterations > MaxIterations;
        pointCount = Math.Min(pointCount, MaxPointCount);          // 上限：避免 n² 切割太慢
        iterations = Math.Max(0, Math.Min(iterations, MaxIterations));   // 沒接時為 0（純 Voronoi），負值也夾到 0；上限避免鬆弛太久

        // ===== 1. DATA 資料 =====
        var random = new Random(seed);
        var boundary = new List<Point3d>                           // 外框矩形四個角點（起始多邊形）
        {
            new Point3d(0, 0, 0),
            new Point3d(width, 0, 0),
            new Point3d(width, height, 0),
            new Point3d(0, height, 0),
        };

        // ===== 2. INIT 初始：矩形內隨機撒點，切出第一輪細胞 =====
        var seeds = new List<Point3d>();
        for (int number = 0; number < pointCount; number++)
        {
            double x = random.NextDouble() * width;
            double y = random.NextDouble() * height;
            seeds.Add(new Point3d(x, y, 0));
        }
        var polygons = BuildCells(seeds, boundary);

        // ===== 3. LOOP 迭代：每次把點搬到自己細胞的重心，再重新切一次 =====
        for (int iteration = 0; iteration < iterations; iteration++)
        {
            for (int number = 0; number < seeds.Count; number++)
            {
                if (polygons[number].Count >= 3)
                    seeds[number] = AreaCenter(polygons[number]);   // 搬到重心（角點太少的退化細胞維持原位）
            }
            polygons = BuildCells(seeds, boundary);
        }

        // ===== 4. OUTPUT 輸出 =====
        var outlines = new List<Polyline>();
        double totalArea = 0;
        for (int number = 0; number < polygons.Count; number++)
        {
            if (polygons[number].Count < 3) continue;               // 退化細胞（少於 3 個角點）不要
            outlines.Add(ToClosedPolyline(polygons[number]));
            totalArea += PolygonArea(polygons[number]);
        }
        string limitNote = (countLimited ? "（點數已達上限 " + MaxPointCount + "）" : "") + (iterationLimited ? "（次數已達上限 " + MaxIterations + "）" : "");
        Print("細胞 {0} 個，鬆弛 {1} 次，總面積 {2:F1}（矩形面積 {3:F1}）{4}", outlines.Count, iterations, totalArea, width * height, limitNote);
        cells = outlines;
        points = seeds;
    }

    // ----- Fields 欄位 -----
    const int MaxPointCount = 200;                                  // n² 切割：點數上限，超過會很慢
    const int MaxIterations = 100;                                  // Lloyd 鬆弛次數上限

    // ----- RULE 規則：每個點各自從矩形開始，被其他每個點切一刀 -----
    List<List<Point3d>> BuildCells(List<Point3d> seedPoints, List<Point3d> boundary)
    {
        var cellPolygons = new List<List<Point3d>>();
        for (int self = 0; self < seedPoints.Count; self++)
        {
            var polygon = boundary;                                 // 從整個矩形開始
            for (int other = 0; other < seedPoints.Count; other++)
            {
                if (other == self) continue;
                polygon = KeepCloserSide(polygon, seedPoints[self], seedPoints[other]);
                if (polygon.Count < 3) break;                       // 已經切到退化，不用再切
            }
            cellPolygons.Add(polygon);
        }
        return cellPolygons;
    }

    // ----- RULE 規則：用 self 與 other 的垂直平分線切多邊形，只留靠近 self 的那半 -----
    List<Point3d> KeepCloserSide(List<Point3d> polygon, Point3d self, Point3d other)
    {
        Vector3d selfToOther = other - self;                        // self → other，也是平分線的法向量
        Point3d midPoint = self + selfToOther * 0.5;                // 垂直平分線通過的中點

        var kept = new List<Point3d>();
        int cornerCount = polygon.Count;
        for (int index = 0; index < cornerCount; index++)
        {
            Point3d current = polygon[index];
            Point3d next = polygon[(index + 1) % cornerCount];
            double currentSide = Vector3d.Multiply(current - midPoint, selfToOther);   // >0 代表靠近 other 那一側
            double nextSide = Vector3d.Multiply(next - midPoint, selfToOther);

            if (currentSide <= 0) kept.Add(current);                // 靠近 self（或剛好在線上）→ 留下

            bool crossesLine = (currentSide < 0 && nextSide > 0) || (currentSide > 0 && nextSide < 0);
            if (crossesLine)
            {
                double t = currentSide / (currentSide - nextSide);  // 線性內插交點
                kept.Add(current + (next - current) * t);
            }
        }
        return kept;
    }

    // ----- Helpers 工具 -----
    // 多邊形面積重心（鞋帶公式的重心版本）：CVT 每一步都往這裡搬
    Point3d AreaCenter(List<Point3d> polygon)
    {
        double signedArea = 0, centerX = 0, centerY = 0;
        int cornerCount = polygon.Count;
        for (int index = 0; index < cornerCount; index++)
        {
            Point3d current = polygon[index];
            Point3d next = polygon[(index + 1) % cornerCount];
            double cross = current.X * next.Y - next.X * current.Y;
            signedArea += cross;
            centerX += (current.X + next.X) * cross;
            centerY += (current.Y + next.Y) * cross;
        }
        signedArea *= 0.5;
        if (Math.Abs(signedArea) < 1e-9) return polygon[0];         // 面積太小（退化），避免除以 0
        centerX /= (6 * signedArea);
        centerY /= (6 * signedArea);
        return new Point3d(centerX, centerY, 0);
    }

    // 鞋帶公式：多邊形面積（取絕對值，不管繞行方向）
    double PolygonArea(List<Point3d> polygon)
    {
        double signedArea = 0;
        int cornerCount = polygon.Count;
        for (int index = 0; index < cornerCount; index++)
        {
            Point3d current = polygon[index];
            Point3d next = polygon[(index + 1) % cornerCount];
            signedArea += current.X * next.Y - next.X * current.Y;
        }
        return Math.Abs(signedArea) * 0.5;
    }

    // 角點清單首尾相接，變成封閉線
    Polyline ToClosedPolyline(List<Point3d> polygon)
    {
        var outline = new Polyline();
        foreach (Point3d corner in polygon) outline.Add(corner);
        outline.Add(polygon[0]);                                    // 回到起點 → 封閉
        return outline;
    }
}
