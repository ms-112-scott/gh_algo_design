// =====================================================================
// E06 力密度法（Force Density Method, FDM）找形
// ---------------------------------------------------------------------
// 輸入
//   baseMesh        (Mesh)          初始網格：只取它的「拓樸」（誰連誰），座標只當固定點位置與初始猜測
//   anchors         (List<Point3d>) 固定點；空的時候自動把網格裸邊上的頂點全部固定
//   forceDensity    (double)        每條內部邊的力密度 q = 內力 ÷ 長度（正值＝受拉）
//   edgeCableFactor (double)        裸邊（邊索）的 q 倍率；大於 1 邊索拉得較直，小於 1 邊界往內彎
//   load            (double)        每個自由節點的 Z 向外力；負值往下得到懸垂網，正值往上得到受壓殼
//   cgIterations    (int)           共軛梯度法（Conjugate Gradient）最多迭代次數
// 輸出
//   lines     每條邊的平衡線段
//   formMesh  平衡後的網格（面沿用 baseMesh）
//   forces    每條邊的內力 = q × 長度
//   colors    依內力由藍（小）到紅（大）的顏色，可接 Custom Preview
//   residual  x、y、z 三次求解後的殘差（越接近 0 越準）
// 說明：由 gh-new-algos 工作流程產生，尚未在 Rhino 中實測。
//       只用 RhinoCommon，不需外掛；建議自由節點在 1,000 個以內。
// =====================================================================
using System;
using System.Collections.Generic;
using System.Drawing;
using Rhino;
using Rhino.Geometry;
using Grasshopper.Kernel;

public class Script_Instance : GH_ScriptInstance
{
  private void RunScript(Mesh baseMesh, List<Point3d> anchors, double forceDensity,
    double edgeCableFactor, double load, int cgIterations,
    ref object lines, ref object formMesh, ref object forces, ref object colors, ref object residual)
  {
    // 0. 防呆
    if (baseMesh == null || !baseMesh.IsValid) return;
    if (forceDensity <= 0) { Print("forceDensity 必須大於 0（負值會讓矩陣不再正定，CG 求解會失敗）"); return; }
    if (cgIterations < 1) cgIterations = 200;

    // 1. 圖：節點＝拓樸頂點，邊＝拓樸邊
    var tv = baseMesh.TopologyVertices;
    var te = baseMesh.TopologyEdges;
    int n = tv.Count;
    var xyz = new Point3d[n];
    for (int i = 0; i < n; i++) xyz[i] = tv[i];

    var edges = new List<Edge>();
    for (int e = 0; e < te.Count; e++)
    {
      IndexPair ab = te.GetTopologyVertices(e);
      bool naked = te.GetConnectedFaces(e).Length == 1;          // 只接一個面＝裸邊（邊索）
      double q = forceDensity * (naked ? edgeCableFactor : 1.0);
      edges.Add(new Edge(ab.I, ab.J, q));
    }

    // 2. 固定點：指定錨點取最近頂點，否則取裸邊頂點
    bool[] isFixed = FindFixed(baseMesh, anchors);
    int nf = 0;
    int[] row = new int[n];                                     // 節點 → 未知數編號（固定點為 -1）
    for (int i = 0; i < n; i++) row[i] = isFixed[i] ? -1 : nf++;
    if (nf == 0 || nf == n) { Print("至少要有一個固定點與一個自由點"); return; }

    // 3. 組出稀疏矩陣 D = Cnᵀ·Q·Cn（只存對角線＋自由—自由的邊）
    var diag = new double[nf];
    foreach (var ed in edges)
    {
      if (row[ed.A] >= 0) diag[row[ed.A]] += ed.Q;
      if (row[ed.B] >= 0) diag[row[ed.B]] += ed.Q;
    }

    // 4. 對 x、y、z 各解一次 D·u = p − Cnᵀ·Q·Cf·uf
    var res = new List<double>();
    for (int axis = 0; axis < 3; axis++)
    {
      var rhs = new double[nf];
      var u = new double[nf];
      for (int i = 0; i < n; i++)
        if (row[i] >= 0) { u[row[i]] = Coord(xyz[i], axis); if (axis == 2) rhs[row[i]] = load; }
      foreach (var ed in edges)                                  // 固定點的貢獻移到右邊
      {
        if (row[ed.A] >= 0 && row[ed.B] < 0) rhs[row[ed.A]] += ed.Q * Coord(xyz[ed.B], axis);
        if (row[ed.B] >= 0 && row[ed.A] < 0) rhs[row[ed.B]] += ed.Q * Coord(xyz[ed.A], axis);
      }
      res.Add(SolveCG(diag, edges, row, rhs, u, cgIterations));
      for (int i = 0; i < n; i++)
        if (row[i] >= 0) xyz[i] = SetCoord(xyz[i], axis, u[row[i]]);
    }

    // 5. 輸出：線段、內力、顏色、網格
    var outLines = new List<Line>();
    var outForces = new List<double>();
    double fMin = double.MaxValue, fMax = double.MinValue;
    foreach (var ed in edges)
    {
      var ln = new Line(xyz[ed.A], xyz[ed.B]);
      double f = ed.Q * ln.Length;                               // 內力 = 力密度 × 長度
      outLines.Add(ln); outForces.Add(f);
      fMin = Math.Min(fMin, f); fMax = Math.Max(fMax, f);
    }
    var outColors = new List<Color>();
    foreach (double f in outForces) outColors.Add(Ramp((f - fMin) / Math.Max(1e-12, fMax - fMin)));

    var m = baseMesh.DuplicateMesh();
    for (int i = 0; i < n; i++)
      foreach (int mv in tv.MeshVertexIndices(i)) m.Vertices.SetVertex(mv, xyz[i]);
    m.Normals.ComputeNormals();

    lines = outLines; formMesh = m; forces = outForces; colors = outColors; residual = res;
  }

  // ----- RunScript 下方、class 裡面 -----
  const double AnchorTolerance = 1e-3;

  // 共軛梯度法：D 對稱正定（q > 0 且每個自由點都連得到固定點）時保證收斂
  double SolveCG(double[] diag, List<Edge> edges, int[] row, double[] b, double[] x, int maxIter)
  {
    int m = b.Length;
    var r = new double[m]; var p = new double[m]; var Ap = new double[m];
    MatVec(diag, edges, row, x, Ap);
    for (int i = 0; i < m; i++) { r[i] = b[i] - Ap[i]; p[i] = r[i]; }
    double rr = Dot(r, r), bb = Math.Max(1e-24, Dot(b, b));
    for (int k = 0; k < maxIter && rr / bb > 1e-20; k++)
    {
      MatVec(diag, edges, row, p, Ap);
      double alpha = rr / Dot(p, Ap);
      for (int i = 0; i < m; i++) { x[i] += alpha * p[i]; r[i] -= alpha * Ap[i]; }
      double rrNew = Dot(r, r);
      double beta = rrNew / rr;
      for (int i = 0; i < m; i++) p[i] = r[i] + beta * p[i];
      rr = rrNew;
    }
    return Math.Sqrt(rr);
  }

  // y = D·v，直接沿邊累加，不必真的存 nf × nf 的矩陣
  void MatVec(double[] diag, List<Edge> edges, int[] row, double[] v, double[] y)
  {
    for (int i = 0; i < v.Length; i++) y[i] = diag[i] * v[i];
    foreach (var ed in edges)
    {
      int a = row[ed.A], b = row[ed.B];
      if (a >= 0 && b >= 0) { y[a] -= ed.Q * v[b]; y[b] -= ed.Q * v[a]; }
    }
  }

  bool[] FindFixed(Mesh mesh, List<Point3d> anchors)
  {
    var tv = mesh.TopologyVertices;
    var fixedFlag = new bool[tv.Count];
    if (anchors != null && anchors.Count > 0)
    {
      foreach (var a in anchors)
      {
        int best = -1; double bd = double.MaxValue;
        for (int i = 0; i < tv.Count; i++)
        {
          double d = a.DistanceTo(tv[i]);
          if (d < bd) { bd = d; best = i; }
        }
        if (best >= 0) fixedFlag[best] = true;
        if (bd > AnchorTolerance) Print("錨點不在頂點上，已吸附到最近頂點（距離 " + bd.ToString("0.###") + "）");
      }
    }
    else
    {
      bool[] naked = mesh.GetNakedEdgePointStatus();
      for (int mv = 0; mv < naked.Length; mv++)
        if (naked[mv]) fixedFlag[tv.TopologyVertexIndex(mv)] = true;
    }
    return fixedFlag;
  }

  static double Dot(double[] a, double[] b) { double s = 0; for (int i = 0; i < a.Length; i++) s += a[i] * b[i]; return s; }
  static double Coord(Point3d p, int axis) { return axis == 0 ? p.X : axis == 1 ? p.Y : p.Z; }
  static Point3d SetCoord(Point3d p, int axis, double v)
  {
    if (axis == 0) p.X = v; else if (axis == 1) p.Y = v; else p.Z = v;
    return p;
  }
  static Color Ramp(double t)
  {
    t = Math.Max(0, Math.Min(1, t));
    return Color.FromArgb((int)(40 + 215 * t), (int)(90 + 60 * (1 - Math.Abs(2 * t - 1))), (int)(255 - 215 * t));
  }
}

// ----- Script_Instance 外面 -----
// 一條邊：兩端節點編號與力密度 q
public struct Edge
{
  public int A, B; public double Q;
  public Edge(int a, int b, double q) { A = a; B = b; Q = q; }
}
