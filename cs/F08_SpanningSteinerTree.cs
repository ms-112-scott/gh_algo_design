// #! csharp
// =====================================================================
// F08 最小生成樹與 Steiner 樹（Minimum Spanning Tree & Steiner Tree）
// ---------------------------------------------------------------------
// 做法：
//   1. 撒點（或讀入 pts），把所有點兩兩連成候選邊，依長度由短到長排序。
//   2. Kruskal：由短到長檢查每條邊，用並查集（union-find）判斷兩端是否已同群；
//      不同群才加入並合併，加滿 n − 1 條邊就是最小生成樹（MST）。
//   3. Steiner 改良（steiner = true）：找出某節點上夾角小於 120° 的兩條邊，
//      在三點之間插入 Fermat 點（Weiszfeld 迭代求到三點距離和最小的點），改接成三叉。
//   4. 鬆弛：反覆把每個 Steiner 點移到三個鄰點的 Fermat 點；退化（度數 ≤ 2
//      或貼到鄰點上）的 Steiner 點刪除。
//   5. 輸出 MST、Steiner 網路、Steiner 點與兩者總長；Steiner 部分是啟發式，
//      不保證得到精確的最小 Steiner 樹（精確解是 NP-hard）。
//
// 輸入：
//   pts             (List<Point3d>) 要連接的點（端點）；留空就用 pointCount 隨機撒點
//   pointCount      (int)    隨機撒點數量（pts 留空時才用）
//   seed            (int)    亂數種子，同一種子得到同一組點
//   size            (double) 隨機撒點的正方形邊長
//   steiner         (bool)   false = 只算 MST；true = 再加入 Steiner 點改良
//   relaxIterations (int)    Steiner 點位置鬆弛的次數
// 輸出：
//   mstLines      最小生成樹的線段（List<Line>）
//   steinerLines  Steiner 網路的線段（steiner = false 時與 MST 相同）
//   steinerPoints 新加入的 Steiner 點
//   info          文字：MST 總長、Steiner 總長、節省比例
//
// 由 gh-new-algos 工作流程產生，尚未在 Rhino 中實測。
// =====================================================================
using System;
using System.Collections;
using System.Collections.Generic;

using Rhino;
using Rhino.Geometry;

using Grasshopper;
using Grasshopper.Kernel;
using Grasshopper.Kernel.Data;
using Grasshopper.Kernel.Types;

public class Script_Instance : GH_ScriptInstance
{
  private void RunScript(
    List<Point3d> pts, int pointCount, int seed, double size, bool steiner, int relaxIterations,
    ref object mstLines, ref object steinerLines, ref object steinerPoints, ref object info)
  {
    // 0. 防呆：沒有輸入點就隨機撒點
    List<Point3d> terminals = new List<Point3d>();
    if (pts != null && pts.Count > 0) terminals.AddRange(pts);
    else
    {
      Random rnd = new Random(seed);
      for (int i = 0; i < Math.Max(2, pointCount); i++)
        terminals.Add(new Point3d(rnd.NextDouble() * size, rnd.NextDouble() * size, 0));
    }
    int n = terminals.Count;
    if (n < 2) { Print("至少要 2 個點"); return; }

    // 1. DATA：所有候選邊（i < j），依長度排序
    List<Edge> edges = new List<Edge>();
    for (int i = 0; i < n; i++)
      for (int j = i + 1; j < n; j++)
        edges.Add(new Edge(i, j, terminals[i].DistanceTo(terminals[j])));
    edges.Sort((a, b) => a.Length.CompareTo(b.Length));

    // 2. Kruskal＋並查集
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    List<Line> mst = new List<Line>();
    nodes = new List<Point3d>(terminals);
    adj = new List<List<int>>();
    alive = new List<bool>();
    for (int i = 0; i < n; i++) { adj.Add(new List<int>()); alive.Add(true); }

    foreach (Edge e in edges)
    {
      int ra = Find(parent, e.A), rb = Find(parent, e.B);
      if (ra == rb) continue;              // 同一群：加了會成環，跳過
      parent[ra] = rb;                     // 合併兩群
      mst.Add(new Line(terminals[e.A], terminals[e.B]));
      adj[e.A].Add(e.B); adj[e.B].Add(e.A);
      if (mst.Count == n - 1) break;       // n − 1 條邊就完成
    }
    double mstLength = TotalLength();

    // 3. Steiner 改良：在小於 120° 的夾角插入 Fermat 點
    if (steiner)
    {
      int guard = 0;
      while (InsertOneSteinerPoint(n) && guard++ < 4 * n) { }

      // 4. 鬆弛 Steiner 點並刪除退化點
      for (int it = 0; it < relaxIterations; it++)
      {
        for (int s = n; s < nodes.Count; s++)
        {
          if (!alive[s]) continue;
          if (adj[s].Count == 3)
            nodes[s] = Fermat(nodes[adj[s][0]], nodes[adj[s][1]], nodes[adj[s][2]]);
        }
        RemoveDegenerate(n, size * 1e-4 + 1e-9);
      }
    }

    // 5. OUTPUT
    List<Line> net = new List<Line>();
    List<Point3d> sp = new List<Point3d>();
    for (int i = 0; i < nodes.Count; i++)
    {
      if (!alive[i]) continue;
      if (i >= n) sp.Add(nodes[i]);
      foreach (int j in adj[i]) if (i < j) net.Add(new Line(nodes[i], nodes[j]));
    }
    double stLength = TotalLength();
    mstLines = mst;
    steinerLines = net;
    steinerPoints = sp;
    info = string.Format("MST 總長 {0:F2}｜Steiner 總長 {1:F2}｜節省 {2:F1}%｜Steiner 點 {3} 個",
      mstLength, stLength, 100.0 * (1 - stLength / mstLength), sp.Count);
  }

  // ----- RunScript 下方、class 裡面 -----
  // Fields：樹的節點（前 n 個是端點，之後是 Steiner 點）、鄰接表、是否仍存在
  List<Point3d> nodes;
  List<List<int>> adj;
  List<bool> alive;
  const double MaxAngle = 120.0 * Math.PI / 180.0 - 1e-3;

  // RULE：並查集「找代表」，順便做路徑壓縮
  int Find(int[] parent, int x)
  {
    while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  }

  // RULE：找「夾角最小且小於 120°」的一對邊，插入 Fermat 點；有插入就回傳 true
  bool InsertOneSteinerPoint(int n)
  {
    int bestV = -1, bestA = -1, bestB = -1;
    double bestAngle = MaxAngle;
    for (int v = 0; v < nodes.Count; v++)
    {
      if (!alive[v]) continue;
      List<int> nb = adj[v];
      for (int p = 0; p < nb.Count; p++)
        for (int q = p + 1; q < nb.Count; q++)
        {
          double ang = Vector3d.VectorAngle(nodes[nb[p]] - nodes[v], nodes[nb[q]] - nodes[v]);
          if (ang < bestAngle) { bestAngle = ang; bestV = v; bestA = nb[p]; bestB = nb[q]; }
        }
    }
    if (bestV < 0) return false;

    Point3d s = Fermat(nodes[bestV], nodes[bestA], nodes[bestB]);
    double before = nodes[bestV].DistanceTo(nodes[bestA]) + nodes[bestV].DistanceTo(nodes[bestB]);
    double after = s.DistanceTo(nodes[bestV]) + s.DistanceTo(nodes[bestA]) + s.DistanceTo(nodes[bestB]);
    if (after >= before - 1e-9) return false;   // 沒有變短就停

    // 改接：拆掉 v–a、v–b，改成 s–v、s–a、s–b
    int si = nodes.Count;
    nodes.Add(s); alive.Add(true); adj.Add(new List<int> { bestV, bestA, bestB });
    adj[bestV].Remove(bestA); adj[bestA].Remove(bestV);
    adj[bestV].Remove(bestB); adj[bestB].Remove(bestV);
    adj[bestV].Add(si); adj[bestA].Add(si); adj[bestB].Add(si);
    return true;
  }

  // RULE：Weiszfeld 迭代，求到三點距離和最小的 Fermat 點
  Point3d Fermat(Point3d a, Point3d b, Point3d c)
  {
    Point3d x = (a + b + c) / 3.0;
    Point3d[] p = { a, b, c };
    for (int k = 0; k < 60; k++)
    {
      Vector3d sum = Vector3d.Zero; double wsum = 0;
      foreach (Point3d q in p)
      {
        double d = x.DistanceTo(q);
        if (d < 1e-9) return q;              // 落在頂點上：該頂點夾角 ≥ 120°
        sum += (Vector3d)q / d; wsum += 1.0 / d;
      }
      Point3d nx = (Point3d)(sum / wsum);
      if (nx.DistanceTo(x) < 1e-9) break;
      x = nx;
    }
    return x;
  }

  // RULE：刪除度數 ≤ 2 或貼到鄰點上的 Steiner 點，把鄰點直接接起來
  void RemoveDegenerate(int n, double tol)
  {
    for (int s = n; s < nodes.Count; s++)
    {
      if (!alive[s]) continue;
      int hub = -1;                         // 貼上的那個鄰點（沒有就是 -1）
      foreach (int j in adj[s]) if (nodes[s].DistanceTo(nodes[j]) < tol) hub = j;
      if (adj[s].Count > 2 && hub < 0) continue;

      List<int> nb = new List<int>(adj[s]);
      foreach (int j in nb) adj[j].Remove(s);
      adj[s].Clear(); alive[s] = false;
      // 貼到鄰點：其他鄰點都改接到它；度數 2：兩個鄰點直接相連。樹仍然連通
      if (hub < 0 && nb.Count > 0) hub = nb[0];
      foreach (int j in nb)
        if (j != hub) { adj[hub].Add(j); adj[j].Add(hub); }
    }
  }

  // Helpers：目前這棵樹的總長
  double TotalLength()
  {
    double sum = 0;
    for (int i = 0; i < nodes.Count; i++)
      if (alive[i]) foreach (int j in adj[i]) if (i < j) sum += nodes[i].DistanceTo(nodes[j]);
    return sum;
  }

  // ----- 候選邊：兩端點索引與長度 -----
  struct Edge
  {
    public int A, B; public double Length;
    public Edge(int a, int b, double len) { A = a; B = b; Length = len; }
  }
}
