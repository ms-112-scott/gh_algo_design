// #! csharp
// =====================================================================
// G03 地表逕流與集水區（D8 流向累積）
//     Flow Accumulation & Watershed Delineation (D8)
// ---------------------------------------------------------------------
// 做法：把地形取樣成高程格子，讓每一格把雨水交給八個鄰居中「最陡的下坡」那格
//       （D8），所有箭頭構成以出口為根的樹；再依高程由高到低逐格把水量加到下游，
//       累積量大的格子連起來就是河網，流到同一個出口的格子就是一個集水區。
//   1. 取樣：地形轉成 Mesh，從上方往下打射線（Intersection.MeshRay）得到 z[i,j]。
//   2. 填窪：Priority-Flood，用優先佇列從邊界往內「淹水」，把封閉窪地抬到溢流高度。
//   3. 流向：每格找 (z − z鄰) ÷ 距離 最大的鄰居，記成下游指標 down[k]。
//   4. 累積：依高程由高到低排序，把自己的水量加到 down[k]；同時算 Strahler 河序。
//   5. 河網：累積量 ≥ streamThreshold 的格子，從源頭或匯流點沿箭頭追成 Polyline。
//   6. 集水區：依高程由低到高，每格繼承下游格的出口編號，取最大的 basinCount 個上色。
//
// 輸入：
//   terrain         (object) 地形 Surface、Brep 或 Mesh（大致朝上，高度為 Z）
//   cellCount       (int)    長邊的格子數，建議 40–150；格子數平方決定計算量
//   fillSinks       (bool)   true = 先做 Priority-Flood 填窪；false 時窪地會變成內流出口
//   streamThreshold (double) 成為河道所需的最小集水格數（上游有幾格流進來）
//   basinCount      (int)    要上色的最大集水區數量，其餘集水區畫成灰色
// 輸出：
//   streams    河道（Polyline，每段在兩個匯流點之間）
//   orders     每段河道的 Strahler 河序（與 streams 順序相同，可接管徑或線寬）
//   basins     依集水區上色的格子 Mesh
//   flowLines  每格指向下游的短箭頭線（Line）
//   info       統計文字（格子數、填窪格數、最大累積量、河段數、集水區數）
//
// 優先佇列：Rhino 8 的 .NET 可以直接用 PriorityQueue<int, double>；為了在 Rhino 7
// 也能執行，下方自己寫了一個約 30 行的二元堆積（MinHeap）。
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
  // 八個鄰居的偏移量與距離（對角線距離為 √2）
  static readonly int[] DI = { 1, 1, 0, -1, -1, -1, 0, 1 };
  static readonly int[] DJ = { 0, 1, 1, 1, 0, -1, -1, -1 };
  static readonly double[] DD = { 1, Math.Sqrt(2), 1, Math.Sqrt(2), 1, Math.Sqrt(2), 1, Math.Sqrt(2) };

  int nx, ny;
  double cell;
  BoundingBox box;

  private void RunScript(object terrain, int cellCount, bool fillSinks, double streamThreshold, int basinCount,
    ref object streams, ref object orders, ref object basins, ref object flowLines, ref object info)
  {
    // ---------- 0. 防呆 ----------
    Mesh mesh = ToMesh(terrain);
    if (mesh == null) { info = "請輸入 Surface、Brep 或 Mesh 地形"; return; }
    cellCount = Math.Max(4, Math.Min(400, cellCount));
    basinCount = Math.Max(1, basinCount);

    // ---------- 1. 取樣：從上方打射線得到高程格子 ----------
    box = mesh.GetBoundingBox(true);
    double lx = box.Max.X - box.Min.X, ly = box.Max.Y - box.Min.Y;
    cell = Math.Max(lx, ly) / cellCount;
    nx = Math.Max(2, (int) Math.Round(lx / cell));
    ny = Math.Max(2, (int) Math.Round(ly / cell));
    int n = nx * ny;
    double[] z = new double[n];
    for (int j = 0; j < ny; j++)
      for (int i = 0; i < nx; i++)
      {
        Point3d top = new Point3d(box.Min.X + (i + 0.5) * cell, box.Min.Y + (j + 0.5) * cell, box.Max.Z + 1.0);
        double t = Rhino.Geometry.Intersect.Intersection.MeshRay(mesh, new Ray3d(top, -Vector3d.ZAxis));
        z[Id(i, j)] = t >= 0 ? top.Z - t : double.NaN;   // 沒打到 = 地形外（無資料）
      }

    // ---------- 2. 填窪：Priority-Flood（+ε 讓平地也有坡度） ----------
    double[] zf = (double[]) z.Clone();
    int filled = 0;
    if (fillSinks) filled = PriorityFlood(zf, cell * 1e-4);

    // ---------- 3. 流向：D8 最陡下坡 ----------
    int[] down = new int[n];
    for (int k = 0; k < n; k++)
    {
      down[k] = -1;
      if (double.IsNaN(zf[k])) continue;
      int i = k % nx, j = k / nx;
      double best = 0;
      for (int d = 0; d < 8; d++)
      {
        int a = i + DI[d], b = j + DJ[d];
        if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
        int m = Id(a, b);
        if (double.IsNaN(zf[m])) continue;
        double slope = (zf[k] - zf[m]) / (DD[d] * cell);   // 高差 ÷ 距離
        if (slope > best) { best = slope; down[k] = m; }
      }
    }

    // ---------- 4. 累積：依高程由高到低，把水量交給下游 ----------
    int[] order = new int[n];
    for (int k = 0; k < n; k++) order[k] = k;
    double[] key = new double[n];
    for (int k = 0; k < n; k++) key[k] = double.IsNaN(zf[k]) ? double.MinValue : -zf[k];
    Array.Sort(key, order);                        // 由高到低
    double[] acc = new double[n];
    for (int k = 0; k < n; k++) acc[k] = double.IsNaN(zf[k]) ? 0 : 1;   // 每格降雨 1 單位
    int[] inflow = new int[n];                     // 流進來的「河道格」數
    int[] strahler = new int[n], topOrder = new int[n], topCount = new int[n];
    foreach (int k in order)
    {
      if (acc[k] <= 0) continue;
      bool isStream = acc[k] >= streamThreshold;
      if (isStream) strahler[k] = topOrder[k] == 0 ? 1 : (topCount[k] >= 2 ? topOrder[k] + 1 : topOrder[k]);
      int m = down[k];
      if (m < 0) continue;
      acc[m] += acc[k];
      if (!isStream) continue;
      inflow[m]++;
      if (strahler[k] > topOrder[m]) { topOrder[m] = strahler[k]; topCount[m] = 1; }
      else if (strahler[k] == topOrder[m]) topCount[m]++;
    }

    // ---------- 5. 河網：從源頭或匯流點沿箭頭追到下一個匯流點 ----------
    var lines = new List<Polyline>();
    var lineOrders = new List<int>();
    for (int k = 0; k < n; k++)
    {
      if (acc[k] < streamThreshold || inflow[k] == 1 || down[k] < 0) continue;
      var pl = new Polyline { P(k, zf) };
      int cur = k;
      while (down[cur] >= 0)
      {
        cur = down[cur];
        pl.Add(P(cur, zf));
        if (inflow[cur] != 1) break;               // 到達匯流點：新的河段從這裡開始
      }
      lines.Add(pl);
      lineOrders.Add(strahler[k]);
    }

    // ---------- 6. 集水區：由低到高，繼承下游格的出口編號 ----------
    int[] label = new int[n];
    for (int idx = n - 1; idx >= 0; idx--)          // order 反過來 = 由低到高
    {
      int k = order[idx];
      if (double.IsNaN(zf[k])) { label[k] = -1; continue; }
      label[k] = down[k] < 0 ? k : label[down[k]];
    }
    var size = new Dictionary<int, int>();
    foreach (int lb in label) if (lb >= 0) size[lb] = size.ContainsKey(lb) ? size[lb] + 1 : 1;
    var ranked = new List<int>(size.Keys);
    ranked.Sort((a, b) => size[b].CompareTo(size[a]));
    var color = new Dictionary<int, Color>();
    for (int r = 0; r < ranked.Count; r++)
      color[ranked[r]] = r < basinCount ? Hue(r * 0.61803) : Color.FromArgb(90, 90, 90);

    // ---------- 7. 輸出 ----------
    var bm = new Mesh();
    var arrows = new List<Line>();
    for (int k = 0; k < n; k++)
    {
      if (label[k] < 0) continue;
      int i = k % nx, j = k / nx;
      double x0 = box.Min.X + i * cell, y0 = box.Min.Y + j * cell, h = z[k];
      int v = bm.Vertices.Count;
      bm.Vertices.Add(x0, y0, h); bm.Vertices.Add(x0 + cell, y0, h);
      bm.Vertices.Add(x0 + cell, y0 + cell, h); bm.Vertices.Add(x0, y0 + cell, h);
      for (int q = 0; q < 4; q++) bm.VertexColors.Add(color[label[k]]);
      bm.Faces.AddFace(v, v + 1, v + 2, v + 3);
      if (down[k] >= 0)
      {
        Point3d a = P(k, zf), b = P(down[k], zf);
        arrows.Add(new Line(a, a + (b - a) * 0.45));
      }
    }
    bm.Normals.ComputeNormals();

    double maxAcc = 0;
    foreach (double a in acc) maxAcc = Math.Max(maxAcc, a);
    streams = lines;
    orders = lineOrders;
    basins = bm;
    flowLines = arrows;
    info = string.Format("格子 {0}×{1}｜填窪 {2} 格｜最大累積 {3:0} 格｜河段 {4}｜集水區 {5}（上色 {6}）",
      nx, ny, filled, maxAcc, lines.Count, size.Count, Math.Min(basinCount, size.Count));
  }

  // ----- Priority-Flood：從邊界（或無資料旁）往內淹，回傳被抬高的格數 -----
  int PriorityFlood(double[] zf, double eps)
  {
    int n = zf.Length, filled = 0;
    bool[] done = new bool[n];
    var heap = new MinHeap();
    for (int k = 0; k < n; k++)
    {
      if (double.IsNaN(zf[k])) { done[k] = true; continue; }
      if (IsEdge(k, zf)) { heap.Push(k, zf[k]); done[k] = true; }
    }
    while (heap.Count > 0)
    {
      int c = heap.Pop();
      int i = c % nx, j = c / nx;
      for (int d = 0; d < 8; d++)
      {
        int a = i + DI[d], b = j + DJ[d];
        if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
        int m = Id(a, b);
        if (done[m]) continue;
        done[m] = true;
        if (zf[m] <= zf[c]) { zf[m] = zf[c] + eps; filled++; }   // 窪地抬到溢流高度
        heap.Push(m, zf[m]);
      }
    }
    return filled;
  }

  bool IsEdge(int k, double[] zf)
  {
    int i = k % nx, j = k / nx;
    if (i == 0 || j == 0 || i == nx - 1 || j == ny - 1) return true;
    for (int d = 0; d < 8; d++) if (double.IsNaN(zf[Id(i + DI[d], j + DJ[d])])) return true;
    return false;
  }

  // ----- Helpers -----
  int Id(int i, int j) { return j * nx + i; }

  Point3d P(int k, double[] zf)
  {
    return new Point3d(box.Min.X + (k % nx + 0.5) * cell, box.Min.Y + (k / nx + 0.5) * cell, zf[k]);
  }

  static Color Hue(double t)
  {
    return new Rhino.Display.ColorHSL(t - Math.Floor(t), 0.55, 0.62).ToArgbColor();
  }

  static Mesh ToMesh(object g)
  {
    if (g is GH_Mesh) g = ((GH_Mesh) g).Value;
    if (g is GH_Surface) g = ((GH_Surface) g).Value;
    if (g is GH_Brep) g = ((GH_Brep) g).Value;
    if (g is Mesh) return (Mesh) g;
    if (g is Surface) g = ((Surface) g).ToBrep();
    if (g is Brep)
    {
      Mesh[] parts = Mesh.CreateFromBrep((Brep) g, MeshingParameters.QualityRenderMesh);
      if (parts == null || parts.Length == 0) return null;
      var m = new Mesh();
      foreach (var p in parts) m.Append(p);
      return m;
    }
    return null;
  }

  // ----- 二元堆積：Rhino 7 沒有 PriorityQueue 時使用 -----
  class MinHeap
  {
    readonly List<int> ids = new List<int>();
    readonly List<double> keys = new List<double>();
    public int Count { get { return ids.Count; } }

    public void Push(int id, double k)
    {
      ids.Add(id); keys.Add(k);
      int c = ids.Count - 1;
      while (c > 0)
      {
        int p = (c - 1) / 2;
        if (keys[p] <= keys[c]) break;
        Swap(c, p); c = p;
      }
    }

    public int Pop()
    {
      int top = ids[0], last = ids.Count - 1;
      Swap(0, last); ids.RemoveAt(last); keys.RemoveAt(last);
      int c = 0;
      while (true)
      {
        int l = 2 * c + 1, r = l + 1, s = c;
        if (l < ids.Count && keys[l] < keys[s]) s = l;
        if (r < ids.Count && keys[r] < keys[s]) s = r;
        if (s == c) break;
        Swap(c, s); c = s;
      }
      return top;
    }

    void Swap(int a, int b)
    {
      int ti = ids[a]; ids[a] = ids[b]; ids[b] = ti;
      double tk = keys[a]; keys[a] = keys[b]; keys[b] = tk;
    }
  }
}
