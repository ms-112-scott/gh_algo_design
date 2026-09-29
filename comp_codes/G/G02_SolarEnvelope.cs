// Grasshopper Script Instance
// ==================================================================
// G02 Solar Envelope｜太陽包絡
// 家族：G 空間分析　邏輯：直接公式／幾何轉換　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   latitude      double        Item  緯度（度，北半球為正；0＝赤道，沒接時就是 0） 例：25.0
//   dayOfYear     int           Item  一年中的第幾天（1–366，冬至約 355）     例：355
//   startHour     double        Item  保護日照的開始時刻（真太陽時）          例：9.0
//   endHour       double        Item  保護日照的結束時刻（真太陽時）          例：15.0
//   cellSize      double        Item  格點間距（模型單位）                    例：2.0
//   fenceHeight   double        Item  遮陰線高度（0＝地面）                    例：0.0
//   maxHeight     double        Item  高度上限（沒受約束的格點用這個值）      例：30.0
//   site          Curve         Item  基地邊界（封閉、平放 XY，+Y＝北 +X＝東） 例：無（用內建 20×20 矩形）
//   fences        List<Curve>   List  要保護日照的鄰地邊界（遮陰線）           例：無（用內建北側一條線）
//   hourStep      double        Item  時刻取樣間隔（小時）                    例：1.0
// 輸出
//   out                                Print 的文字（元件預設就有，不要刪）
//   envelope                           包絡頂面（高度場網格）
//   sunRays                            從基地中心指向各時刻太陽的線（檢查用）
//   heights                            基地內每個格點的允許高度
//   info                               時刻高度角、方位角與體積的完整文字報告
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 依緯度、日期算出赤緯，配合 startHour～endHour（每 hourStep）的時角，算出一組指向太陽的單位向量；地平線下的時刻略過。
//   2. 在 site 外框內以 cellSize 布格點，用 Curve.Contains 只留下基地內的點。
//   3. 每個格點對每個太陽向量：沿「背離太陽」的影子方向射線找最近的遮陰線，距離 D，允許高度＝fenceHeight ＋ D × tan(高度角)；射線沒碰到遮陰線就不受限（用 maxHeight）。
//   4. 每個格點對所有時刻取最小值（下包絡），再夾在 0～maxHeight 之間，得到高度場。
//   5. 高度場轉成 Mesh（四角都在基地內的格子才建面），並輸出各時刻的太陽射線與逐點高度。
// ------------------------------------------------------------------
// 你應該看到：20×20 基地上一片南高北低的斜屋頂，越靠近北側遮陰線越矮（南緣約 20、北緣約 3），東北、西北角被清晨與傍晚的斜射再削低一些。
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
        double latitude, int dayOfYear, double startHour, double endHour,
        double cellSize, double fenceHeight, double maxHeight,
        Curve site, List<Curve> fences, double hourStep,
        ref object envelope, ref object sunRays, ref object heights, ref object info)
    {
        // ===== 0. 防呆 =====
        latitude = Math.Max(-89, Math.Min(89, latitude));                           // 真正夾範圍；0＝赤道，沒接時就是 0
        if (dayOfYear < 1 || dayOfYear > 366) dayOfYear = 355;                      // 沒接 → 冬至；366 給閏年
        if (startHour == 0 && endHour == 0) { startHour = 9.0; endHour = 15.0; }    // 兩者皆為 0 視為沒接，套用保護時段預設
        if (endHour < startHour) { double swap = startHour; startHour = endHour; endHour = swap; }
        if (fenceHeight < 0) fenceHeight = 0.0;
        if (maxHeight <= 0) maxHeight = 30.0;
        if (hourStep <= 0) hourStep = 1.0;

        if (site == null)
        {
            site = DefaultSite();                                                  // 沒接基地 → 用內建 20×20 矩形
        }
        else if (!site.IsClosed)
        {
            Print("site 沒有封閉，改用內建 20×20 矩形");
            site = DefaultSite();
        }
        site = Curve.ProjectToPlane(site, Plane.WorldXY);                          // 投影到 XY，避免標高讓求交失敗

        bool fencesHadOnlyNulls = false;
        if (fences != null && fences.Count > 0)
        {
            fences.RemoveAll(fence => fence == null);
            if (fences.Count == 0) fencesHadOnlyNulls = true;
        }
        if (fences == null || fences.Count == 0)
        {
            if (fencesHadOnlyNulls) Print("fences 都是空的，改用內建北側一條遮陰線");
            fences = DefaultFences(site);                                          // 沒接遮陰線 → 用內建北側一條線
        }
        else
        {
            fences = fences.Select(fence => Curve.ProjectToPlane(fence, Plane.WorldXY)).ToList();
        }
        double tolerance = RhinoDoc.ActiveDoc != null ? RhinoDoc.ActiveDoc.ModelAbsoluteTolerance : 0.001;

        BoundingBox siteBox = site.GetBoundingBox(true);
        double minCellSize = Math.Max(siteBox.Max.X - siteBox.Min.X, siteBox.Max.Y - siteBox.Min.Y) / MaxGridCount;
        bool hitGridLimit = false;
        if (cellSize <= 0) cellSize = 2.0;
        if (cellSize < minCellSize)
        {
            cellSize = minCellSize;                                                // 讓格點永遠覆蓋整個基地，不會被上限截斷
            hitGridLimit = true;
            Print(string.Format("格點數達上限，cellSize 放大為 {0:F3}", cellSize));
        }

        // ===== 1. DATA 資料 =====
        List<Vector3d> sunVectors = SunVectors(latitude, dayOfYear, startHour, endHour, hourStep, out bool hitSampleLimit);
        if (sunVectors.Count == 0)
        {
            Print("這段時間太陽都在地平線下，沒有包絡限制");
            envelope = null;
            sunRays = new List<Line>();
            heights = new List<double>();
            info = "";
            return;
        }
        BoundingBox allBox = siteBox;
        foreach (Curve fence in fences) if (fence != null) allBox.Union(fence.GetBoundingBox(true));
        double rayLength = allBox.Diagonal.Length * 2.0;                            // 射線要夠長才碰得到遮陰線

        // ===== 2. INIT 初始 =====
        int gridCountX = Math.Max(1, Math.Min(MaxGridCount, (int)Math.Ceiling((siteBox.Max.X - siteBox.Min.X) / cellSize)));
        int gridCountY = Math.Max(1, Math.Min(MaxGridCount, (int)Math.Ceiling((siteBox.Max.Y - siteBox.Min.Y) / cellSize)));
        double[,] heightField = new double[gridCountX + 1, gridCountY + 1];
        bool[,] insideSite = new bool[gridCountX + 1, gridCountY + 1];
        var heightList = new List<double>();

        // ===== 3. LOOP 迭代：逐格點、逐時刻找允許高度的下包絡 =====
        for (int i = 0; i <= gridCountX; i++)
        {
            for (int j = 0; j <= gridCountY; j++)
            {
                var gridPoint = new Point3d(siteBox.Min.X + i * cellSize, siteBox.Min.Y + j * cellSize, 0);
                insideSite[i, j] = site.Contains(gridPoint, Plane.WorldXY, tolerance) != PointContainment.Outside;
                if (!insideSite[i, j]) continue;

                double allowedHeight = maxHeight;
                foreach (Vector3d sunVector in sunVectors)
                {
                    double limit = HeightLimit(gridPoint, sunVector, fences, fenceHeight, rayLength, tolerance);
                    if (limit < allowedHeight) allowedHeight = limit;                // 下包絡：所有時刻都不能超過
                }
                heightField[i, j] = Math.Max(0, allowedHeight);
                heightList.Add(heightField[i, j]);
            }
        }

        // ===== 4. OUTPUT 輸出 =====
        double volume;
        Mesh envelopeMesh = BuildMesh(siteBox, gridCountX, gridCountY, cellSize, heightField, insideSite, out volume);
        AreaMassProperties massProperties = AreaMassProperties.Compute(site);
        Point3d siteCenter = massProperties != null ? massProperties.Centroid : siteBox.Center;
        var rays = sunVectors.Select(sunVector => new Line(siteCenter, siteCenter + sunVector * rayLength * 0.3)).ToList();

        string report = Report(sunVectors, volume, gridCountX, gridCountY, hitSampleLimit, hitGridLimit);
        Print(string.Format("時刻 {0} 個，格點 {1}×{2}，體積約 {3:F1}{4}", sunVectors.Count, gridCountX + 1, gridCountY + 1, volume,
            (hitSampleLimit || hitGridLimit) ? "（已自動調整取樣上限）" : ""));
        envelope = envelopeMesh;
        sunRays = rays;
        heights = heightList;
        info = report;
    }

    // ----- Fields 欄位 -----
    const int MaxGridCount = 120;           // 單軸格點數上限：格點數 × 時刻數 × 遮陰線數是主要計算量來源，cellSize 太小會自動放大以符合這個上限
    const int MaxSunSamples = 96;           // 時刻取樣上限：hourStep 太小時自動放大成等分整段時間，保證迴圈次數有界

    // ----- RULE 規則：赤緯＋時角算出一組指向太陽的單位向量，太低的時刻不算 -----
    List<Vector3d> SunVectors(double latitude, int dayOfYear, double startHour, double endHour, double hourStep, out bool hitSampleLimit)
    {
        var sunVectors = new List<Vector3d>();
        hitSampleLimit = false;
        double latitudeRadians = latitude * Math.PI / 180.0;
        // Cooper 公式：赤緯隨日期在 ±23.44° 之間變化
        double declination = 23.44 * Math.PI / 180.0 * Math.Sin(2 * Math.PI * (284 + dayOfYear) / 365.0);

        double rawSampleCount = (endHour - startHour) / hourStep;                  // 用 double 算，避免極小 hourStep 讓 (int) 轉型溢位或卡死
        int sampleCount;
        if (double.IsNaN(rawSampleCount) || double.IsInfinity(rawSampleCount) || rawSampleCount > MaxSunSamples - 1)
        {
            hourStep = (endHour - startHour) / (MaxSunSamples - 1);                // 放大間隔，讓整段時間仍平均取樣，不會被默默截斷
            sampleCount = MaxSunSamples;
            hitSampleLimit = true;
            Print(string.Format("時刻取樣達上限，hourStep 放大為 {0:F4} 小時", hourStep));
        }
        else
        {
            sampleCount = (int)Math.Floor(rawSampleCount) + 1;
        }

        for (int k = 0; k < sampleCount; k++)                                      // 整數迴圈，次數固定，不會卡死
        {
            double hour = startHour + k * hourStep;
            double hourAngle = 15.0 * (hour - 12.0) * Math.PI / 180.0;             // 時角：正午為 0，下午為正
            // 地平座標：X = 東、Y = 北、Z = 上
            double x = -Math.Cos(declination) * Math.Sin(hourAngle);
            double y = Math.Sin(declination) * Math.Cos(latitudeRadians) - Math.Cos(declination) * Math.Cos(hourAngle) * Math.Sin(latitudeRadians);
            double z = Math.Sin(declination) * Math.Sin(latitudeRadians) + Math.Cos(declination) * Math.Cos(hourAngle) * Math.Cos(latitudeRadians);
            if (z <= 0.02) continue;                                               // 高度角小於約 1° 視為在地平線下，不當約束
            var sunVector = new Vector3d(x, y, z);
            sunVector.Unitize();
            sunVectors.Add(sunVector);
        }
        return sunVectors;
    }

    // ----- RULE 規則：沿影子方向找最近的遮陰線，換算這一刻允許的高度 -----
    double HeightLimit(Point3d point, Vector3d sunVector, List<Curve> fences, double fenceHeight, double rayLength, double tolerance)
    {
        var shadowDirection = new Vector3d(-sunVector.X, -sunVector.Y, 0);          // 影子方向＝陽光行進方向的水平分量
        double horizontalLength = shadowDirection.Length;
        if (horizontalLength < 1e-9) return double.MaxValue;                       // 太陽在正上方，影子長度為 0，不受限
        shadowDirection /= horizontalLength;
        double tanAltitude = sunVector.Z / horizontalLength;

        var shadowRay = new LineCurve(point, point + shadowDirection * rayLength);
        double nearestDistance = double.MaxValue;                                  // 哨兵值：先當作沒有遮陰線擋到
        foreach (Curve fence in fences)
        {
            if (fence == null) continue;
            CurveIntersections intersections = Intersection.CurveCurve(shadowRay, fence, tolerance, tolerance);
            if (intersections == null) continue;
            foreach (IntersectionEvent hit in intersections)
            {
                double distance = hit.PointA.DistanceTo(point);
                if (distance < nearestDistance) nearestDistance = distance;
            }
        }
        if (nearestDistance == double.MaxValue) return double.MaxValue;            // 影子方向上沒有要保護的鄰地
        return fenceHeight + nearestDistance * tanAltitude;                        // 影子尖端不能越過遮陰線
    }

    // ----- Helpers 工具：格點高度轉成 Mesh，四角都在基地內才建面，順便用四角平均高度估體積 -----
    Mesh BuildMesh(BoundingBox siteBox, int gridCountX, int gridCountY, double cellSize, double[,] heightField, bool[,] insideSite, out double volume)
    {
        var mesh = new Mesh();
        var vertexIndex = new int[gridCountX + 1, gridCountY + 1];
        for (int i = 0; i <= gridCountX; i++)
            for (int j = 0; j <= gridCountY; j++)
            {
                vertexIndex[i, j] = mesh.Vertices.Count;
                double z = insideSite[i, j] ? heightField[i, j] : 0;
                mesh.Vertices.Add(siteBox.Min.X + i * cellSize, siteBox.Min.Y + j * cellSize, z);
            }

        volume = 0;
        for (int i = 0; i < gridCountX; i++)
            for (int j = 0; j < gridCountY; j++)
            {
                bool allCornersInside = insideSite[i, j] && insideSite[i + 1, j] && insideSite[i + 1, j + 1] && insideSite[i, j + 1];
                if (!allCornersInside) continue;                                   // 只有四角都在基地內的格子才建面
                mesh.Faces.AddFace(vertexIndex[i, j], vertexIndex[i + 1, j], vertexIndex[i + 1, j + 1], vertexIndex[i, j + 1]);
                double averageHeight = (heightField[i, j] + heightField[i + 1, j] + heightField[i + 1, j + 1] + heightField[i, j + 1]) / 4.0;
                volume += averageHeight * cellSize * cellSize;
            }
        mesh.Compact();
        mesh.Normals.ComputeNormals();
        return mesh;
    }

    // ----- Helpers 工具：沒接基地時的內建 20×20 矩形 -----
    Curve DefaultSite()
    {
        var rectangle = new Rectangle3d(Plane.WorldXY, new Interval(0, 20), new Interval(0, 20));
        return rectangle.ToNurbsCurve();
    }

    // ----- Helpers 工具：沒接遮陰線時的內建北側一條線 -----
    List<Curve> DefaultFences(Curve site)
    {
        BoundingBox box = site.GetBoundingBox(true);
        var northLine = new LineCurve(new Point3d(box.Min.X - 5, box.Max.Y + 5, 0), new Point3d(box.Max.X + 5, box.Max.Y + 5, 0));
        return new List<Curve> { northLine };
    }

    // ----- Helpers 工具：文字報告，各時刻的高度角、方位角（由北順時針）、格點數與包絡體積估計 -----
    string Report(List<Vector3d> sunVectors, double volume, int gridCountX, int gridCountY, bool hitSampleLimit, bool hitGridLimit)
    {
        var lines = new List<string>();
        foreach (Vector3d sunVector in sunVectors)
        {
            double altitude = Math.Asin(sunVector.Z) * 180.0 / Math.PI;
            double azimuth = Math.Atan2(sunVector.X, sunVector.Y) * 180.0 / Math.PI;
            if (azimuth < 0) azimuth += 360.0;
            lines.Add(string.Format("高度角 {0:F1}°  方位角 {1:F1}°", altitude, azimuth));
        }
        lines.Add(string.Format("太陽向量 {0} 個，格點 {1}×{2}，包絡體積約 {3:F1}", sunVectors.Count, gridCountX + 1, gridCountY + 1, volume));
        if (hitSampleLimit) lines.Add("時刻取樣達上限，hourStep 已自動放大");
        if (hitGridLimit) lines.Add("格點數達上限，cellSize 已自動放大");
        return string.Join("\n", lines);
    }
}
