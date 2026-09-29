// Grasshopper Script Instance
// ==================================================================
// F02 Islamic Star Pattern｜伊斯蘭幾何圖樣（Hankin 法）
// 家族：F 圖樣與最佳化　邏輯：直接公式／幾何轉換　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   columns       int     Item   八角形的欄數（東西向格數）            例：4
//   rows          int     Item   八角形的列數（南北向格數）            例：4
//   tileSize      double  Item   每格邊長（八角形＋正方形的基準尺寸）   例：10.0
//   contactAngle  double  Item   射線與邊的夾角，0–90°                例：67.5
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   patternLines                 伊斯蘭星形圖樣線段（Line）
//   tiles                        底圖多邊形外框（八角形＋小正方形，Polyline）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. BuildTiling：每格中心放一個平邊朝上下左右的正八角形，格線交點補一個轉 45° 的小正方形，組成 4.8.8 半正鋪面
//   2. 對每個多邊形的每一對相鄰邊 A→B、B→C，取兩邊中點
//   3. 以外積 Z × 邊方向求得內側法向量，把邊方向與法向量按 cos/sin(contactAngle) 混合，得到朝角點 B 往內偏的兩條射線
//   4. RaysMeet 用 2D 行列式解兩射線交點；只保留兩者都往前（距離 > 0）的交點
//   5. 從兩個中點各連一條線到交點；相鄰多邊形共用邊中點，所有星形因此自動連成一張連續網
// ------------------------------------------------------------------
// 你應該看到：4×4 格的八角形＋小正方形底圖上，長出交織的八角星圖樣，像經典的伊斯蘭窗花
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
        int columns, int rows, double tileSize, double contactAngle,
        ref object patternLines, ref object tiles)
    {
        // ===== 0. 防呆 =====
        if (columns < 1) columns = DefaultColumns;                          // 沒接或不合理 → 用預設格數
        if (rows < 1) rows = DefaultRows;
        columns = Math.Min(columns, MaxColumns);                            // 上限：避免格數暴增當機
        rows = Math.Min(rows, MaxRows);
        if (tileSize <= 0) tileSize = DefaultTileSize;
        if (contactAngle <= 0 || contactAngle >= 90) contactAngle = DefaultContactAngle;   // 不在 0～90 → 改成經典值

        // ===== 1. DATA 資料：八角形邊長與四角要切掉的量 =====
        double edgeLength = tileSize / (1.0 + Math.Sqrt(2.0));               // 邊長相等的正八邊形，內接在 tileSize 見方的格子裡
        double cornerOffset = edgeLength / Math.Sqrt(2.0);                   // 格子四角切掉的直角三角形兩股長
        double contactAngleRadians = RhinoMath.ToRadians(contactAngle);

        // ===== 2. INIT 初始：鋪出 4.8.8 底圖（八角形＋格線交點的小正方形） =====
        List<List<Point3d>> tilingPolygons = BuildTiling(columns, rows, tileSize, cornerOffset);

        // ===== 3. LOOP 迭代：每個多邊形各自跑 Hankin 法，長出星形線 =====
        var starLines = new List<Line>();
        var outlines = new List<Polyline>();
        foreach (List<Point3d> polygon in tilingPolygons)
        {
            starLines.AddRange(HankinLines(polygon, contactAngleRadians));
            var outline = new Polyline(polygon);
            outline.Add(polygon[0]);                                        // 外框首尾相連，收成封閉線
            outlines.Add(outline);
        }

        // ===== 4. OUTPUT 輸出 =====
        Print("底圖 {0} 個多邊形，星形線 {1} 段", tilingPolygons.Count, starLines.Count);
        patternLines = starLines;
        tiles = outlines;
    }

    // ----- Fields 欄位 -----
    const int DefaultColumns = 4;
    const int DefaultRows = 4;
    const double DefaultTileSize = 10.0;
    const double DefaultContactAngle = 67.5;                    // 八角星的經典角度
    const int MaxColumns = 30;                                  // 格數上限：30×30 個八角形＋31×31 個正方形仍在 1 秒內算完
    const int MaxRows = 30;
    const double MinCrossProduct = 1e-9;                        // 兩射線方向的外積接近 0 視為平行，避免除以 0

    // ----- BuildTiling：每格中心放正八角形，格線交點放轉 45 度的小正方形 -----
    List<List<Point3d>> BuildTiling(int columns, int rows, double tileSize, double cornerOffset)
    {
        var polygons = new List<List<Point3d>>();

        // 每一格中心一個正八邊形
        for (int col = 0; col < columns; col++)
        {
            for (int row = 0; row < rows; row++)
            {
                double x0 = col * tileSize;
                double y0 = row * tileSize;
                polygons.Add(BuildOctagon(x0, y0, tileSize, cornerOffset));
            }
        }

        // 格線交點（比格數多一圈：columns+1 × rows+1）各補一個小正方形
        for (int col = 0; col <= columns; col++)
        {
            for (int row = 0; row <= rows; row++)
            {
                double gx = col * tileSize;
                double gy = row * tileSize;
                polygons.Add(BuildDiamond(gx, gy, cornerOffset));
            }
        }

        return polygons;
    }

    // ----- HankinLines：邊中點斜射（contactAngle），兩線交會就連線 -----
    List<Line> HankinLines(List<Point3d> vertices, double contactAngleRadians)
    {
        var lines = new List<Line>();
        int vertexCount = vertices.Count;
        double cosAngle = Math.Cos(contactAngleRadians);
        double sinAngle = Math.Sin(contactAngleRadians);

        for (int i = 0; i < vertexCount; i++)
        {
            Point3d previous = vertices[(i - 1 + vertexCount) % vertexCount];
            Point3d current = vertices[i];
            Point3d next = vertices[(i + 1) % vertexCount];

            Point3d midIncoming = previous + (current - previous) * 0.5;    // 邊 previous→current 的中點
            Point3d midOutgoing = current + (next - current) * 0.5;        // 邊 current→next 的中點

            Vector3d incomingDirection = current - previous;
            incomingDirection.Unitize();
            Vector3d outgoingDirection = next - current;
            outgoingDirection.Unitize();

            // 外積 Z × 邊方向 → 逆時針多邊形的內側法向量
            Vector3d incomingNormal = Vector3d.CrossProduct(Vector3d.ZAxis, incomingDirection);
            incomingNormal.Unitize();
            Vector3d outgoingNormal = Vector3d.CrossProduct(Vector3d.ZAxis, outgoingDirection);
            outgoingNormal.Unitize();

            // 兩條射線都朝角點 current 前進，同時依 contactAngle 往內側法向量偏
            Vector3d rayFromIncoming = incomingDirection * cosAngle + incomingNormal * sinAngle;
            Vector3d rayFromOutgoing = (-outgoingDirection) * cosAngle + outgoingNormal * sinAngle;

            Point3d meetPoint;
            bool found = RaysMeet(midIncoming, rayFromIncoming, midOutgoing, rayFromOutgoing, out meetPoint);
            if (!found) continue;                                          // 平行或交在射線背後 → 這個角點沒有星線

            lines.Add(new Line(midIncoming, meetPoint));
            lines.Add(new Line(midOutgoing, meetPoint));
        }

        return lines;
    }

    // ----- Helpers 工具 -----
    // RaysMeet：兩射線的交點；平行，或交點在任一射線起點背後 → 沒有
    bool RaysMeet(Point3d originA, Vector3d directionA, Point3d originB, Vector3d directionB, out Point3d meetPoint)
    {
        meetPoint = Point3d.Origin;
        double crossDirections = directionA.X * directionB.Y - directionA.Y * directionB.X;
        if (Math.Abs(crossDirections) < MinCrossProduct) return false;     // 兩射線平行，沒有交點

        double deltaX = originB.X - originA.X;
        double deltaY = originB.Y - originA.Y;
        double distanceAlongA = (deltaX * directionB.Y - deltaY * directionB.X) / crossDirections;
        double distanceAlongB = (deltaX * directionA.Y - deltaY * directionA.X) / crossDirections;
        if (distanceAlongA <= 0 || distanceAlongB <= 0) return false;      // 交點在射線起點背後，不算

        meetPoint = originA + directionA * distanceAlongA;
        return true;
    }

    // BuildOctagon：平邊朝上下左右的正八邊形，四角各切掉一個直角三角形（CCW，從下邊左端點開始）
    List<Point3d> BuildOctagon(double x0, double y0, double tileSize, double o)
    {
        return new List<Point3d>
        {
            new Point3d(x0 + o, y0, 0),
            new Point3d(x0 + tileSize - o, y0, 0),
            new Point3d(x0 + tileSize, y0 + o, 0),
            new Point3d(x0 + tileSize, y0 + tileSize - o, 0),
            new Point3d(x0 + tileSize - o, y0 + tileSize, 0),
            new Point3d(x0 + o, y0 + tileSize, 0),
            new Point3d(x0, y0 + tileSize - o, 0),
            new Point3d(x0, y0 + o, 0),
        };
    }

    // BuildDiamond：轉 45 度的小正方形，四個頂點剛好是相鄰八角形被切掉的角（CCW，從右頂點開始）
    List<Point3d> BuildDiamond(double gx, double gy, double o)
    {
        return new List<Point3d>
        {
            new Point3d(gx + o, gy, 0),
            new Point3d(gx, gy + o, 0),
            new Point3d(gx - o, gy, 0),
            new Point3d(gx, gy - o, 0),
        };
    }
}
