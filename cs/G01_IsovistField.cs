// #! csharp
// =====================================================================
// G01 Isovist 可視域與可見性場（Isovist & Isovist Field）
// ---------------------------------------------------------------------
// 做法：站在一點向四周等角度打出 rayCount 條射線，每條射線和所有牆線段求交，
//       取最近的交點當作「看得到的最遠處」；依角度順序把交點連起來就是可視域
//       多邊形（isovist）。再把平面切成格點，每個格點都算一次 isovist 並取一個
//       形狀指標（面積、周長、緊湊度、遮蔽邊長度），就得到可見性場（isovist field）。
//   1. 把牆曲線拆成直線段（折線直接取邊；曲線先等分成小段）。
//   2. 射線與線段求交：解 p + t·d = a + u·(b − a)，要求 t > 0、0 ≤ u ≤ 1，取最小 t。
//   3. 依角度順序連接交點成封閉 Polyline，算面積（鞋帶公式）、周長、緊湊度與遮蔽邊。
//   4. 在牆的外框範圍內布格點，逐點重複 2–3，得到指標陣列。
//   5. 把指標正規化成 0–1，塗在網格頂點上輸出彩色 Mesh。
//
// 輸入：
//   walls    (List<Curve>) 牆線或障礙物輪廓（平面圖，放在 XY 平面上）
//   viewer   (Point3d)     單一觀察點，輸出它的 isovist 與射線
//   rayCount (int)         每個點發射的射線數（角度解析度），建議 90–360
//   maxDist  (double)      視線最遠距離；沒打到牆的射線停在這裡（戶外開口）
//   cellSize (double)      可見性場的格點間距；越小越細、越慢
//   metric   (int)         場要顯示的指標：0 面積、1 周長、2 緊湊度、3 遮蔽邊長度
// 輸出：
//   isovist  觀察點的可視域多邊形（Polyline）
//   rays     觀察點發出的射線（Line，停在交點）
//   field    依指標上色的格點網格（Mesh，頂點色）
//   values   每個格點的指標值（與 Mesh 頂點順序相同）
//   info     觀察點的四個指標文字
//
// 由 gh-new-algos 工作流程產生，尚未在 Rhino 中實測。
// =====================================================================
using System;
using System.Collections;
using System.Collections.Generic;
using System.Drawing;

using Rhino;
using Rhino.Geometry;

using Grasshopper;
using Grasshopper.Kernel;
using Grasshopper.Kernel.Data;
using Grasshopper.Kernel.Types;

public class Script_Instance : GH_ScriptInstance
{
  private void RunScript(
    List<Curve> walls, Point3d viewer, int rayCount, double maxDist, double cellSize, int metric,
    ref object isovist, ref object rays, ref object field, ref object values, ref object info)
  {
    // 0. 防呆
    if (walls == null || walls.Count == 0) { Print("請輸入牆線 walls"); return; }
    if (rayCount < 8) rayCount = 8;
    if (maxDist <= 0) maxDist = 100;
    if (cellSize <= 0) { Print("cellSize 要大於 0"); return; }

    // 1. 牆曲線 → 直線段
    List<Line> segs = new List<Line>();
    foreach (Curve c in walls)
    {
      if (c == null) continue;
      Polyline pl;
      if (c.TryGetPolyline(out pl))
      {
        for (int i = 0; i < pl.Count - 1; i++) segs.Add(new Line(pl[i], pl[i + 1]));
      }
      else
      {
        double[] ts = c.DivideByCount(32, true);          // 曲線牆：等分成 32 段近似
        for (int i = 0; i < ts.Length - 1; i++) segs.Add(new Line(c.PointAt(ts[i]), c.PointAt(ts[i + 1])));
        if (c.IsClosed) segs.Add(new Line(c.PointAt(ts[ts.Length - 1]), c.PointAt(ts[0])));
      }
    }

    // 2. 單一觀察點的 isovist
    double[] dist;
    int[] hitSeg;
    Polyline iso = CastIsovist(viewer, segs, rayCount, maxDist, out dist, out hitSeg);
    List<Line> rayLines = new List<Line>();
    for (int i = 0; i < rayCount; i++) rayLines.Add(new Line(viewer, iso[i]));
    double[] m0 = Measures(iso, dist, hitSeg);

    // 3. 可見性場：在牆的外框內布格點
    BoundingBox bb = BoundingBox.Empty;
    foreach (Line s in segs) { bb.Union(s.From); bb.Union(s.To); }
    int nx = (int)Math.Floor((bb.Max.X - bb.Min.X) / cellSize) + 1;
    int ny = (int)Math.Floor((bb.Max.Y - bb.Min.Y) / cellSize) + 1;
    if ((long)nx * ny > 40000) { Print("格點太多（" + nx * ny + "），請加大 cellSize"); return; }

    Mesh mesh = new Mesh();
    List<double> vals = new List<double>();
    for (int j = 0; j < ny; j++)
    {
      for (int i = 0; i < nx; i++)
      {
        Point3d p = new Point3d(bb.Min.X + i * cellSize, bb.Min.Y + j * cellSize, viewer.Z);
        double[] d; int[] h;
        Polyline pIso = CastIsovist(p, segs, rayCount, maxDist, out d, out h);
        double[] m = Measures(pIso, d, h);
        vals.Add(m[Math.Max(0, Math.Min(3, metric))]);
        mesh.Vertices.Add(p);
      }
    }
    for (int j = 0; j < ny - 1; j++)
      for (int i = 0; i < nx - 1; i++)
        mesh.Faces.AddFace(j * nx + i, j * nx + i + 1, (j + 1) * nx + i + 1, (j + 1) * nx + i);

    // 4. 正規化並上色（深藍 → 洋紅 → 淡粉）
    double lo = double.MaxValue, hi = double.MinValue;
    foreach (double v in vals) { lo = Math.Min(lo, v); hi = Math.Max(hi, v); }
    foreach (double v in vals)
    {
      double t = (hi - lo) < 1e-9 ? 0 : (v - lo) / (hi - lo);
      mesh.VertexColors.Add(Ramp(t));
    }
    mesh.Normals.ComputeNormals();

    // 5. 輸出
    isovist = iso;
    rays = rayLines;
    field = mesh;
    values = vals;
    info = string.Format("面積 {0:F2}\n周長 {1:F2}\n緊湊度 {2:F3}\n遮蔽邊長度 {3:F2}\n線段數 {4}，格點 {5}×{6}",
      m0[0], m0[1], m0[2], m0[3], segs.Count, nx, ny);
  }

  // 從 p 等角度打 n 條射線，回傳依角度排列的封閉可視域多邊形
  // dist[i]：第 i 條射線長度；hit[i]：打到的線段編號（-1 = 沒打到，停在 maxDist）
  Polyline CastIsovist(Point3d p, List<Line> segs, int n, double maxDist, out double[] dist, out int[] hit)
  {
    Polyline poly = new Polyline(n + 1);
    dist = new double[n];
    hit = new int[n];
    for (int i = 0; i < n; i++)
    {
      double ang = 2 * Math.PI * i / n;
      double dx = Math.Cos(ang), dy = Math.Sin(ang);
      double best = maxDist; int bestSeg = -1;
      for (int k = 0; k < segs.Count; k++)
      {
        double t = RaySegment(p.X, p.Y, dx, dy, segs[k]);
        if (t > 1e-9 && t < best) { best = t; bestSeg = k; }
      }
      dist[i] = best; hit[i] = bestSeg;
      poly.Add(new Point3d(p.X + dx * best, p.Y + dy * best, p.Z));
    }
    poly.Add(poly[0]);                                    // 首尾相接封閉
    return poly;
  }

  // 射線 (px,py)+t(dx,dy) 與線段 a→b 的交點參數 t；沒有交點回傳 -1
  double RaySegment(double px, double py, double dx, double dy, Line s)
  {
    double ex = s.To.X - s.From.X, ey = s.To.Y - s.From.Y;
    double den = dx * ey - dy * ex;                       // 2D 外積：平行時為 0
    if (Math.Abs(den) < 1e-12) return -1;
    double wx = s.From.X - px, wy = s.From.Y - py;
    double t = (wx * ey - wy * ex) / den;                 // 射線方向的距離
    double u = (wx * dy - wy * dx) / den;                 // 在線段上的位置 0–1
    if (t < 0 || u < 0 || u > 1) return -1;
    return t;
  }

  // 形狀指標：[0] 面積、[1] 周長、[2] 緊湊度 4πA/P²、[3] 遮蔽邊長度
  double[] Measures(Polyline iso, double[] dist, int[] hit)
  {
    int n = dist.Length;
    double area = 0, perim = 0, occl = 0;
    for (int i = 0; i < n; i++)
    {
      Point3d a = iso[i], b = iso[i + 1];
      area += a.X * b.Y - b.X * a.Y;                      // 鞋帶公式
      double len = a.DistanceTo(b);
      perim += len;
      int j = (i + 1) % n;
      // 相鄰兩條射線打到不同牆、而且距離跳動超過 20%，這條邊就是「看不到後面」的遮蔽邊
      bool jump = Math.Abs(dist[i] - dist[j]) > 0.2 * Math.Max(dist[i], dist[j]);
      if ((hit[i] != hit[j] && jump) || hit[i] < 0 || hit[j] < 0) occl += len;
    }
    area = Math.Abs(area) * 0.5;
    double compact = perim > 0 ? 4 * Math.PI * area / (perim * perim) : 0;
    return new double[] { area, perim, compact, occl };
  }

  // 0–1 → 顏色：深藍灰 → 洋紅 #C8378B → 淡粉 #F8E1EE
  Color Ramp(double t)
  {
    t = Math.Max(0, Math.Min(1, t));
    int[] c0 = { 40, 44, 70 }, c1 = { 200, 55, 139 }, c2 = { 248, 225, 238 };
    int[] a = t < 0.5 ? c0 : c1, b = t < 0.5 ? c1 : c2;
    double s = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    return Color.FromArgb((int)(a[0] + (b[0] - a[0]) * s), (int)(a[1] + (b[1] - a[1]) * s), (int)(a[2] + (b[2] - a[2]) * s));
  }
}
