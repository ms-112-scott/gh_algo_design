// =====================================================================
// G02 太陽包絡（Solar Envelope）｜Grasshopper C# Script（Rhino 8）
// ---------------------------------------------------------------------
// 做什麼：給一塊基地與要保護日照的鄰地邊界（遮陰線 shadow fence），
//         算出「在指定日期的指定時段內，影子都不會越過遮陰線」的最大可建高度場，
//         也就是 Knowles 的「日照權包絡」（solar rights envelope）。
// 輸入：
//   site        Curve         基地邊界（封閉、平放在 XY 平面，世界座標 +Y = 北、+X = 東）
//   fences      List<Curve>   要保護日照的鄰地邊界線（遮陰線），通常在基地北側
//   latitude    double        緯度（度，北半球為正，例如台北 25.0）
//   dayOfYear   int           一年中的第幾天（1–365，冬至約 355）
//   startHour   double        開始時刻（真太陽時，例如 9.0）
//   endHour     double        結束時刻（真太陽時，例如 15.0）
//   hourStep    double        取樣間隔（小時，例如 1.0）
//   cellSize    double        格點間距（模型單位）
//   fenceHeight double        遮陰線高度（0 = 地面；可設成鄰房一樓窗台高度）
//   maxHeight   double        法規或設計的高度上限（沒有受約束的格點就用這個高度）
// 輸出：
//   envelope    Mesh          包絡頂面（高度場網格）
//   sunRays     List<Line>    從基地中心指向各時刻太陽的線（視覺檢查用）
//   heights     List<double>  基地內每個格點的允許高度
//   info        string        太陽高度角、方位角與包絡體積估計
// 由 gh-new-algos 工作流程產生，尚未在 Rhino 中實測。
// =====================================================================
#region Usings
using System;
using System.Collections.Generic;
using System.Linq;
using Rhino;
using Rhino.Geometry;
using Rhino.Geometry.Intersect;
using Grasshopper;
using Grasshopper.Kernel;
#endregion

public class Script_Instance : GH_ScriptInstance
{
  private void RunScript(
    Curve site, List<Curve> fences, double latitude, int dayOfYear,
    double startHour, double endHour, double hourStep,
    double cellSize, double fenceHeight, double maxHeight,
    ref object envelope, ref object sunRays, ref object heights, ref object info)
  {
    // 0. 防呆
    if (site == null || !site.IsClosed || fences == null || fences.Count == 0) return;
    if (cellSize <= 0 || hourStep <= 0 || endHour < startHour) return;
    double tol = RhinoDoc.ActiveDoc != null ? RhinoDoc.ActiveDoc.ModelAbsoluteTolerance : 0.001;

    // 1. 太陽方向：依緯度、日期、時刻算出一組「指向太陽」的單位向量
    List<Vector3d> suns = SunVectors(latitude, dayOfYear, startHour, endHour, hourStep);
    if (suns.Count == 0) { info = "這段時間太陽都在地平線下"; return; }

    // 2. 基地格點：在外框內布格點，用 Contains 判斷是否在基地內
    BoundingBox box = site.GetBoundingBox(true);
    int nx = Math.Max(1, (int)Math.Ceiling((box.Max.X - box.Min.X) / cellSize));
    int ny = Math.Max(1, (int)Math.Ceiling((box.Max.Y - box.Min.Y) / cellSize));
    BoundingBox all = box;
    foreach (Curve f in fences) if (f != null) all.Union(f.GetBoundingBox(true));
    double rayLength = all.Diagonal.Length * 2.0;   // 射線要夠長才碰得到遮陰線

    double[,] h = new double[nx + 1, ny + 1];
    bool[,] inside = new bool[nx + 1, ny + 1];
    var heightList = new List<double>();

    // 3. 逐點、逐時刻：沿影子方向找遮陰線，求這一刻允許的高度，取最小值（下包絡）
    for (int i = 0; i <= nx; i++)
    {
      for (int j = 0; j <= ny; j++)
      {
        var p = new Point3d(box.Min.X + i * cellSize, box.Min.Y + j * cellSize, 0);
        inside[i, j] = site.Contains(p, Plane.WorldXY, tol) != PointContainment.Outside;
        if (!inside[i, j]) continue;

        double best = maxHeight;
        foreach (Vector3d s in suns)
        {
          double limit = HeightLimit(p, s, fences, fenceHeight, rayLength, tol);
          if (limit < best) best = limit;
        }
        h[i, j] = Math.Max(0, best);
        heightList.Add(h[i, j]);
      }
    }

    // 4. 高度場 → Mesh：四個角都在基地內的格子才建面
    Mesh mesh = BuildMesh(box, nx, ny, cellSize, h, inside, out double volume);

    // 5. 輸出
    AreaMassProperties amp = AreaMassProperties.Compute(site);
    Point3d center = amp != null ? amp.Centroid : box.Center;
    var rays = suns.Select(s => new Line(center, center + s * rayLength * 0.3)).ToList();

    envelope = mesh;
    sunRays = rays;
    heights = heightList;
    info = Report(suns, volume);
  }

  // ----- RunScript 下方、class 裡面 -----

  // 太陽位置簡化公式（Cooper 赤緯＋時角；時間用真太陽時，不處理時區與均時差）
  List<Vector3d> SunVectors(double lat, int day, double t0, double t1, double step)
  {
    var list = new List<Vector3d>();
    double phi = lat * Math.PI / 180.0;
    double decl = 23.44 * Math.PI / 180.0 * Math.Sin(2 * Math.PI * (284 + day) / 365.0);
    for (double t = t0; t <= t1 + 1e-9; t += step)
    {
      double omega = 15.0 * (t - 12.0) * Math.PI / 180.0;   // 時角：下午為正
      // 地平座標：X = 東、Y = 北、Z = 上
      double x = -Math.Cos(decl) * Math.Sin(omega);
      double y = Math.Sin(decl) * Math.Cos(phi) - Math.Cos(decl) * Math.Cos(omega) * Math.Sin(phi);
      double z = Math.Sin(decl) * Math.Sin(phi) + Math.Cos(decl) * Math.Cos(omega) * Math.Cos(phi);
      if (z <= 0.02) continue;   // 太陽太低（高度角 < 約 1°）就不當約束
      var v = new Vector3d(x, y, z);
      v.Unitize();
      list.Add(v);
    }
    return list;
  }

  // 某一格點在某一個太陽方向下的允許高度
  // 高度 h 的點會把影子往「背離太陽」的方向投出 h / tan(高度角) 那麼長；
  // 影子尖端不能越過遮陰線 → h ≤ fenceHeight + D × tan(高度角)，D 是沿影子方向到遮陰線的水平距離
  double HeightLimit(Point3d p, Vector3d sun, List<Curve> fences, double fenceHeight, double rayLength, double tol)
  {
    var shadowDir = new Vector3d(-sun.X, -sun.Y, 0);   // 影子方向 = 陽光行進方向的水平分量
    double horiz = shadowDir.Length;
    if (horiz < 1e-9) return double.MaxValue;           // 太陽在正上方，影子長度為 0
    shadowDir /= horiz;
    double tanAlt = sun.Z / horiz;

    var ray = new LineCurve(p, p + shadowDir * rayLength);
    double nearest = double.MaxValue;
    foreach (Curve f in fences)
    {
      if (f == null) continue;
      CurveIntersections hits = Intersection.CurveCurve(ray, f, tol, tol);
      if (hits == null) continue;
      foreach (IntersectionEvent e in hits)
      {
        double d = e.PointA.DistanceTo(p);
        if (d < nearest) nearest = d;
      }
    }
    if (nearest == double.MaxValue) return double.MaxValue; // 影子方向上沒有要保護的鄰地
    return fenceHeight + nearest * tanAlt;
  }

  // 把格點高度轉成 Mesh，並用每格四角平均高度估計體積
  Mesh BuildMesh(BoundingBox box, int nx, int ny, double cell, double[,] h, bool[,] inside, out double volume)
  {
    var mesh = new Mesh();
    var index = new int[nx + 1, ny + 1];
    for (int i = 0; i <= nx; i++)
      for (int j = 0; j <= ny; j++)
      {
        index[i, j] = mesh.Vertices.Count;
        mesh.Vertices.Add(box.Min.X + i * cell, box.Min.Y + j * cell, inside[i, j] ? h[i, j] : 0);
      }

    volume = 0;
    for (int i = 0; i < nx; i++)
      for (int j = 0; j < ny; j++)
      {
        if (!(inside[i, j] && inside[i + 1, j] && inside[i + 1, j + 1] && inside[i, j + 1])) continue;
        mesh.Faces.AddFace(index[i, j], index[i + 1, j], index[i + 1, j + 1], index[i, j + 1]);
        volume += (h[i, j] + h[i + 1, j] + h[i + 1, j + 1] + h[i, j + 1]) / 4.0 * cell * cell;
      }
    mesh.Compact();
    mesh.Normals.ComputeNormals();
    return mesh;
  }

  // 文字報告：每個時刻的高度角與方位角（由北順時針），以及體積
  string Report(List<Vector3d> suns, double volume)
  {
    var lines = new List<string>();
    foreach (Vector3d s in suns)
    {
      double alt = Math.Asin(s.Z) * 180.0 / Math.PI;
      double az = Math.Atan2(s.X, s.Y) * 180.0 / Math.PI;
      if (az < 0) az += 360.0;
      lines.Add(string.Format("高度角 {0:F1}°  方位角 {1:F1}°", alt, az));
    }
    lines.Add(string.Format("太陽向量 {0} 個，包絡體積約 {1:F1}", suns.Count, volume));
    return string.Join("\n", lines);
  }
}
