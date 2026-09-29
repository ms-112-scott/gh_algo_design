// Grasshopper Script Instance
// ==================================================================
// G01 Isovist & Visibility Graph Analysis (VGA)｜Isovist 可視域與可見性圖分析
// 家族：G 空間分析　邏輯：幾何轉換／直接公式　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   walls        Curve   List   牆線或障礙物輪廓（平面圖，放在 XY 平面上）   例：無（沒接時用內建 100×100 邊界＋一道隔間牆）
//   viewer       Point3d Item   單一觀察點，輸出它的 isovist 與射線         例：(0,0,0)
//   rayCount     int     Item   每個點發射的射線數（角度解析度）            例：90
//   maxDist      double  Item   視線最遠距離；沒打到牆的射線停在這裡        例：100
//   cellSize     double  Item   可見性場的格點間距                         例：5
//   metric       int     Item   場要顯示的指標：0 面積、1 周長、2 緊湊度、3 遮蔽邊長度  例：0
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   isovist                      觀察點的可視域多邊形（Polyline）
//   rays                         觀察點發出的射線（Line，停在交點）
//   field                        依指標上色的格點網格（Mesh，頂點色）
//   values                       每個格點的指標值（與 Mesh 頂點順序相同）
//   info                         觀察點的四個指標文字
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 把牆曲線拆成直線段：折線直接取每條邊，曲線先等分成小段近似。
//   2. 從觀察點（或格點）等角度打出 rayCount 條射線，每條射線解 p + t·d = a + u·(b − a)，取 t > 0、0 ≤ u ≤ 1 中最小的 t，沒打到就停在 maxDist。
//   3. 依角度順序把交點連成封閉 Polyline，這就是可視域（isovist）多邊形。
//   4. 用鞋帶公式算面積、邊長總和算周長、4πA/P² 算緊湊度、相鄰射線距離跳動大的邊加總算遮蔽邊長度。
//   5. 在牆的外框內以 cellSize 布格點，每個格點重複第 2–4 步，取 metric 指定的指標；
//      落在牆線上的格點另外用 2D 距離排除（記 NaN、塗灰，不參與步驟 6 的正規化）。
//      註：封閉柱體／量體內部的格點目前不額外排除（要正確分辨「外框」與「封閉障礙物」需要額外假設，
//      在沒有柱體的預設場景與現有案例中不影響結果，先不處理，留給往後有柱體案例時再加）。
//   6. 把指標正規化成 0–1，塗在網格頂點上輸出彩色 Mesh（isovist 場）。
// ------------------------------------------------------------------
// 你應該看到：用預設值時，中央觀察點的可視域多邊形被右側隔間牆切出一角，牆內 100×100 範圍布滿依開闊度（深藍到淡粉）上色的網格場。
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
        List<Curve> walls, Point3d viewer, int rayCount, double maxDist, double cellSize, int metric,
        ref object isovist, ref object rays, ref object field, ref object values, ref object info)
    {
        // ===== 0. 防呆 =====
        if (!viewer.IsValid)
        {
            viewer = Point3d.Origin;                                          // 輸入端傳來 Unset 時退回原點，避免算出極端座標
        }
        if (walls == null || walls.Count == 0)
        {
            walls = DefaultWalls();                                           // 沒接牆線 → 用內建邊界＋隔間牆，只接 slider 也能看到畫面
        }
        bool rayCapped = rayCount > MaxRayCount;                              // 記下是否被夾到上限，最後 Print 提醒
        rayCount = rayCount <= 0 ? 90 : Math.Max(MinRayCount, Math.Min(rayCount, MaxRayCount));
        if (maxDist <= 0) maxDist = 100;
        if (cellSize <= 0) cellSize = 5;                                      // 場的格點間距，沒接時用預設密度

        metric = Math.Max(0, Math.Min(3, metric));

        // ===== 1. DATA 資料 =====
        List<Line> segments = WallsToSegments(walls);                         // 牆曲線 → 直線段（折線取邊，曲線等分 32 段）
        if (segments.Count == 0)
        {
            Print("牆線沒有有效線段");
            return;
        }

        // ===== 2. INIT 初始：先算觀察點自己的 isovist，供對照與輸出 =====
        double[] viewerDistances;
        int[] viewerHits;
        Polyline viewerIsovist = CastIsovist(viewer, segments, rayCount, maxDist, out viewerDistances, out viewerHits);
        List<Line> viewerRays = new List<Line>();
        for (int i = 0; i < rayCount; i++) viewerRays.Add(new Line(viewer, viewerIsovist[i]));
        double[] viewerMeasures = Measures(viewerIsovist, viewerDistances, viewerHits);

        // ===== 3. LOOP 迭代：牆的外框內布格點，逐點重算 isovist 取 metric 指定的指標 =====
        BoundingBox box = BoundingBox.Empty;
        foreach (Line segment in segments)
        {
            box.Union(segment.From);
            box.Union(segment.To);
        }
        double boxWidth = box.Max.X - box.Min.X;
        double boxHeight = box.Max.Y - box.Min.Y;
        int columnCount = Math.Max(1, (int)Math.Floor(boxWidth / cellSize));  // 格點數＝格子數，座標見下方＋0.5
        int rowCount = Math.Max(1, (int)Math.Floor(boxHeight / cellSize));
        bool gridCapped = (long)columnCount * rowCount > MaxGridPoints;       // 格點太多 → 場留空，觀察點的輸出照常給

        Mesh grid = new Mesh();
        List<double> gridValues = new List<double>();
        int onWallCount = 0;                                                  // 剛好落在牆線上而略過 isovist 的格點數
        bool gridTooSmall = false;                                            // 格點連不成 2×2 以上的網格（無法組出 Mesh 面）
        if (gridCapped)
        {
            Print(string.Format("格點數（{0}）超過上限 {1}，請加大 cellSize，本次先不算可見性場", (long)columnCount * rowCount, MaxGridPoints));
        }
        else
        {
            for (int row = 0; row < rowCount; row++)
            {
                for (int column = 0; column < columnCount; column++)
                {
                    // 格點放在格子「中心」（+0.5 格）；即使如此，若牆剛好落在半整數倍 cellSize 上，
                    // 仍可能整排格點貼著牆，所以另外用 2D 距離排除真的落在牆線上的格點（見下方 onWall）
                    double gridX = box.Min.X + (column + 0.5) * cellSize;
                    double gridY = box.Min.Y + (row + 0.5) * cellSize;
                    Point3d gridPoint = new Point3d(gridX, gridY, viewer.Z);
                    Point3d flatGridPoint = new Point3d(gridX, gridY, 0);      // 壓到 z = 0 再比距離，viewer.Z 不一定是 0
                    bool onWall = false;
                    for (int k = 0; k < segments.Count; k++)
                    {
                        Line wallSegment = segments[k];
                        Line flatSegment = new Line(new Point3d(wallSegment.From.X, wallSegment.From.Y, 0),
                            new Point3d(wallSegment.To.X, wallSegment.To.Y, 0));
                        if (flatSegment.DistanceTo(flatGridPoint, true) < 1e-6)
                        {
                            onWall = true;
                            break;
                        }
                    }
                    if (onWall)
                    {
                        onWallCount++;
                        gridValues.Add(double.NaN);                           // 牆上的格點不算 isovist，塗中性灰，不參與正規化
                    }
                    else
                    {
                        double[] pointDistances;
                        int[] pointHits;
                        Polyline pointIsovist = CastIsovist(gridPoint, segments, rayCount, maxDist, out pointDistances, out pointHits);
                        double[] pointMeasures = Measures(pointIsovist, pointDistances, pointHits);
                        gridValues.Add(pointMeasures[metric]);
                    }
                    grid.Vertices.Add(gridPoint);                             // 索引不變，牆上的格點照樣加進頂點
                }
            }
            if (columnCount < 2 || rowCount < 2)
            {
                gridTooSmall = true;
                Print(string.Format("格點只有 {0}×{1}，不足以連成網格，請減小 cellSize，本次先不算可見性場的 Mesh", columnCount, rowCount));
            }
            else
            {
                for (int row = 0; row < rowCount - 1; row++)
                {
                    for (int column = 0; column < columnCount - 1; column++)
                    {
                        grid.Faces.AddFace(row * columnCount + column, row * columnCount + column + 1,
                            (row + 1) * columnCount + column + 1, (row + 1) * columnCount + column);
                    }
                }
            }
        }

        // ===== 4. OUTPUT 輸出：指標正規化上色，組合各輸出 =====
        bool fieldValid = !gridCapped && !gridTooSmall;
        if (!gridCapped)
        {
            double lowValue = double.MaxValue, highValue = double.MinValue;
            foreach (double value in gridValues)
            {
                if (double.IsNaN(value)) continue;                           // 牆上的格點不參與正規化範圍
                lowValue = Math.Min(lowValue, value);
                highValue = Math.Max(highValue, value);
            }
            foreach (double value in gridValues)
            {
                if (double.IsNaN(value))
                {
                    grid.VertexColors.Add(Color.FromArgb(160, 160, 160));    // 牆上的格點：中性灰
                    continue;
                }
                double normalized = (highValue - lowValue) < 1e-9 ? 0 : (value - lowValue) / (highValue - lowValue);
                grid.VertexColors.Add(Ramp(normalized));                      // 數值 → 深藍到淡粉的色階
            }
            if (fieldValid) grid.Normals.ComputeNormals();
        }

        isovist = viewerIsovist;
        rays = viewerRays;
        field = fieldValid ? grid : null;
        values = gridCapped ? null : gridValues;
        info = string.Format("面積 {0:F2}\n周長 {1:F2}\n緊湊度 {2:F3}\n遮蔽邊長度 {3:F2}\n牆線段 {4} 條，格點 {5}×{6}",
            viewerMeasures[0], viewerMeasures[1], viewerMeasures[2], viewerMeasures[3], segments.Count, columnCount, rowCount);
        Print(string.Format("觀察點面積 {0:F2}，格點場 {1}×{2}（共 {3} 點，{4} 點在牆上略過）{5}{6}{7}",
            viewerMeasures[0], columnCount, rowCount, (long)columnCount * rowCount, onWallCount,
            gridCapped ? "，場已略過" : "",
            gridTooSmall ? "，格點不足以連成 Mesh" : "",
            rayCapped ? "；射線數已夾到 " + MaxRayCount : ""));
    }

    // ----- Fields 欄位 -----
    const int MinRayCount = 8;             // 射線數下限，太少角度解析度不夠，isovist 會鋸齒
    const int MaxRayCount = 720;           // 射線數上限，避免解析度太高拖慢
    const int MaxGridPoints = 40000;       // 可見性場格點數上限，超過就提醒加大 cellSize

    // ----- RULE 規則：CastIsovist 從一點等角度打射線，取最近的牆交點連成封閉多邊形 -----
    Polyline CastIsovist(Point3d origin, List<Line> segments, int count, double maxDistance, out double[] distances, out int[] hits)
    {
        Polyline polygon = new Polyline(count + 1);
        distances = new double[count];
        hits = new int[count];
        for (int i = 0; i < count; i++)
        {
            double angle = 2 * Math.PI * i / count;
            double directionX = Math.Cos(angle), directionY = Math.Sin(angle);
            double nearest = maxDistance;
            int nearestSegment = -1;
            for (int k = 0; k < segments.Count; k++)
            {
                double t = RaySegment(origin.X, origin.Y, directionX, directionY, segments[k]);
                if (t > 1e-9 && t < nearest)
                {
                    nearest = t;
                    nearestSegment = k;
                }
            }
            distances[i] = nearest;
            hits[i] = nearestSegment;
            polygon.Add(new Point3d(origin.X + directionX * nearest, origin.Y + directionY * nearest, origin.Z));
        }
        polygon.Add(polygon[0]);                                              // 首尾相接封閉
        return polygon;
    }

    // ----- RULE 規則：RaySegment 解射線與線段交點的參數 t（沒有交點回傳 -1） -----
    double RaySegment(double originX, double originY, double directionX, double directionY, Line segment)
    {
        double edgeX = segment.To.X - segment.From.X, edgeY = segment.To.Y - segment.From.Y;
        double denominator = directionX * edgeY - directionY * edgeX;        // 2D 外積：平行時為 0，無交點
        if (Math.Abs(denominator) < 1e-12) return -1;
        double toStartX = segment.From.X - originX, toStartY = segment.From.Y - originY;
        double t = (toStartX * edgeY - toStartY * edgeX) / denominator;      // 沿射線方向的距離
        double u = (toStartX * directionY - toStartY * directionX) / denominator; // 在線段上的位置 0–1
        if (t < 0 || u < 0 || u > 1) return -1;
        return t;
    }

    // ----- RULE 規則：Measures 由多邊形與射線距離算形狀指標 -----
    double[] Measures(Polyline isovistPolygon, double[] distances, int[] hits)
    {
        int count = distances.Length;
        double area = 0, perimeter = 0, occludedLength = 0;
        for (int i = 0; i < count; i++)
        {
            Point3d a = isovistPolygon[i], b = isovistPolygon[i + 1];
            area += a.X * b.Y - b.X * a.Y;                                   // 鞋帶公式
            double edgeLength = a.DistanceTo(b);
            perimeter += edgeLength;
            int next = (i + 1) % count;
            // 相鄰兩條射線打到不同牆（或其中一條沒打到牆），且距離跳動超過 20% → 這條邊是「轉角後方看不到」的遮蔽邊
            bool jumped = Math.Abs(distances[i] - distances[next]) > 0.2 * Math.Max(distances[i], distances[next]);
            bool hitChanged = hits[i] != hits[next] || hits[i] < 0 || hits[next] < 0;
            if (hitChanged && jumped) occludedLength += edgeLength;
        }
        area = Math.Abs(area) * 0.5;
        double compactness = perimeter > 0 ? 4 * Math.PI * area / (perimeter * perimeter) : 0;   // 越接近 1 越像圓
        return new double[] { area, perimeter, compactness, occludedLength };
    }

    // ----- Helpers 工具：牆曲線拆成直線段（折線取邊，曲線等分 32 段近似） -----
    List<Line> WallsToSegments(List<Curve> wallCurves)
    {
        var segments = new List<Line>();
        foreach (Curve wall in wallCurves)
        {
            if (wall == null) continue;
            Polyline polyline;
            if (wall.TryGetPolyline(out polyline))
            {
                for (int i = 0; i < polyline.Count - 1; i++) segments.Add(new Line(polyline[i], polyline[i + 1]));
            }
            else
            {
                double[] parameters = wall.DivideByCount(32, true);
                if (parameters == null || parameters.Length < 2) continue;   // 太短或退化的曲線 → 跳過
                for (int i = 0; i < parameters.Length - 1; i++)
                    segments.Add(new Line(wall.PointAt(parameters[i]), wall.PointAt(parameters[i + 1])));
                if (wall.IsClosed) segments.Add(new Line(wall.PointAt(parameters[parameters.Length - 1]), wall.PointAt(parameters[0])));
            }
        }
        return segments;
    }

    // ----- Helpers 工具：沒接 walls 時的內建幾何（100×100 邊界＋一道隔間牆，示範遮蔽效果） -----
    List<Curve> DefaultWalls()
    {
        Rectangle3d outerBoundary = new Rectangle3d(Plane.WorldXY, new Point3d(-50, -50, 0), new Point3d(50, 50, 0));
        var defaultWalls = new List<Curve>();
        defaultWalls.Add(outerBoundary.ToNurbsCurve());
        defaultWalls.Add(new LineCurve(new Point3d(20, -50, 0), new Point3d(20, 20, 0)));  // 偏右的隔間牆，讓預設觀察點有遮蔽可看
        return defaultWalls;
    }

    // ----- Helpers 工具：Ramp 把 0–1 映成深藍到淡粉的色階 -----
    Color Ramp(double t)
    {
        t = Math.Max(0, Math.Min(1, t));
        int[] darkBlue = { 40, 44, 70 }, magenta = { 200, 55, 139 }, lightPink = { 248, 225, 238 };
        int[] from = t < 0.5 ? darkBlue : magenta, to = t < 0.5 ? magenta : lightPink;
        double localT = t < 0.5 ? t * 2 : (t - 0.5) * 2;
        return Color.FromArgb(
            (int)(from[0] + (to[0] - from[0]) * localT),
            (int)(from[1] + (to[1] - from[1]) * localT),
            (int)(from[2] + (to[2] - from[2]) * localT));
    }
}
