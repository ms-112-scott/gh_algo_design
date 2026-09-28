// =====================================================================
// F07 模擬退火（以房間鄰接配置為例）Simulated Annealing – Room Layout (QAP)
// Rhino 8 Grasshopper C# Script 元件
//
// 輸入
//   roomNames   (List<string>) 房間名稱，例如 客廳、餐廳、廚房…（數量 = n）
//   adjacency   (List<string>) 鄰接需求，每行 "房間A,房間B,權重"，可用名稱或 0 起算的編號
//   startTemp   (double)       起始溫度 T0，建議約為「一次交換的平均成本差」的 1–3 倍
//   coolingRate (double)       冷卻率 α（0.90–0.999），每 StepsPerTemp 步 T ← T × α
//   iterations  (int)          總共嘗試幾次交換
//   seed        (int)          亂數種子，同一個 seed 可重現同一次退火
// 輸出
//   rooms       最佳配置的房間矩形（Rectangle3d）
//   labels      房間名稱（TextDot）
//   links       有鄰接需求的連線（Line），權重越大越該短
//   costCurve   成本下降曲線（Polyline，畫在平面右側）
//   log         起始成本、最佳成本、接受變差的次數
//
// 由 gh-new-algos 工作流程產生，尚未在 Rhino 中實測。
// =====================================================================
#region Usings
using System;
using System.Collections.Generic;
using System.Linq;
using Rhino;
using Rhino.Geometry;
using Grasshopper;
using Grasshopper.Kernel;
#endregion

public class Script_Instance : GH_ScriptInstance
{
  private void RunScript(
    List<string> roomNames, List<string> adjacency,
    double startTemp, double coolingRate, int iterations, int seed,
    ref object rooms, ref object labels, ref object links, ref object costCurve, ref object log)
  {
    // 0. 防呆
    if (roomNames == null || roomNames.Count < 2) return;
    if (coolingRate <= 0 || coolingRate >= 1) coolingRate = 0.995;
    if (startTemp <= 0) startTemp = 10;
    iterations = Math.Max(1, iterations);

    // 1. DATA：房間、格位、鄰接矩陣 w[i,j]
    int n = roomNames.Count;
    double[,] w = ReadAdjacency(adjacency, roomNames);
    int cols = (int)Math.Ceiling(Math.Sqrt(n));
    int rows = (int)Math.Ceiling(n / (double)cols);
    int slotCount = cols * rows;               // 格位可以比房間多，多出來的是空格

    // 2. INIT：隨機把房間放進格位（一個排列）
    var rnd = new Random(seed);
    int[] slotOf = RandomPlacement(n, slotCount, rnd);   // slotOf[房間] = 格位
    int[] roomAt = new int[slotCount];                   // roomAt[格位] = 房間，-1 = 空格
    for (int s = 0; s < slotCount; s++) roomAt[s] = -1;
    for (int i = 0; i < n; i++) roomAt[slotOf[i]] = i;

    double cost = Cost(slotOf, w, cols);
    double firstCost = cost, bestCost = cost;
    int[] best = (int[])slotOf.Clone();
    double T = startTemp;
    int worseAccepted = 0;
    var history = new List<double> { cost };

    // 3. LOOP：交換兩個格位 → 算 Δ → Metropolis 準則 → 降溫
    for (int step = 1; step <= iterations; step++)
    {
      int a, b;
      do { a = rnd.Next(slotCount); b = rnd.Next(slotCount); }
      while (a == b || (roomAt[a] < 0 && roomAt[b] < 0));        // 兩個空格交換沒有意義

      SwapSlots(a, b, roomAt, slotOf);
      double newCost = Cost(slotOf, w, cols);
      double delta = newCost - cost;

      if (delta <= 0 || rnd.NextDouble() < Math.Exp(-delta / T))
      {
        if (delta > 0) worseAccepted++;       // 接受變差：這就是能跳出小山谷的關鍵
        cost = newCost;
        if (cost < bestCost) { bestCost = cost; best = (int[])slotOf.Clone(); }
      }
      else
      {
        SwapSlots(a, b, roomAt, slotOf);       // 不接受：換回來
      }

      if (step % StepsPerTemp == 0) T *= coolingRate;      // 冷卻排程（幾何降溫）
      if (step % Math.Max(1, iterations / CurveSamples) == 0) history.Add(cost);
      if (T < MinTemp) break;
    }

    // 4. OUTPUT
    var rects = new List<Rectangle3d>();
    var dots = new List<TextDot>();
    for (int i = 0; i < n; i++)
    {
      Point3d c = SlotCenter(best[i], cols);
      double h = CellSize * 0.5 - Gap;
      rects.Add(new Rectangle3d(Plane.WorldXY, new Point3d(c.X - h, c.Y - h, 0), new Point3d(c.X + h, c.Y + h, 0)));
      dots.Add(new TextDot(roomNames[i], c));
    }

    var lines = new List<Line>();
    for (int i = 0; i < n; i++)
      for (int j = i + 1; j < n; j++)
        if (w[i, j] > 0) lines.Add(new Line(SlotCenter(best[i], cols), SlotCenter(best[j], cols)));

    rooms = rects;
    labels = dots;
    links = lines;
    costCurve = DrawCurve(history, cols * CellSize + CellSize, rows * CellSize);
    log = string.Format("房間 {0}、格位 {1}（{2}×{3}）\n起始成本 {4:F1} → 最佳成本 {5:F1}\n接受變差 {6} 次，最後溫度 {7:F3}",
      n, slotCount, cols, rows, firstCost, bestCost, worseAccepted, T);
  }

  // ----- Fields：常數 -----
  const double CellSize = 4.0;     // 每個格位 4 m
  const double Gap = 0.15;         // 房間矩形內縮，讓格線看得見
  const int StepsPerTemp = 50;     // 每個溫度嘗試幾次交換
  const double MinTemp = 1e-4;     // 溫度低於此值就停
  const int CurveSamples = 200;    // 成本曲線取樣點數

  // ----- RULE：成本函數（二次指派 QAP）-----
  // cost = Σ w[i,j] × 兩房間格位的曼哈頓距離
  double Cost(int[] slotOf, double[,] w, int cols)
  {
    int n = slotOf.Length;
    double sum = 0;
    for (int i = 0; i < n; i++)
      for (int j = i + 1; j < n; j++)
      {
        if (w[i, j] == 0) continue;
        int dx = Math.Abs(slotOf[i] % cols - slotOf[j] % cols);
        int dy = Math.Abs(slotOf[i] / cols - slotOf[j] / cols);
        sum += w[i, j] * (dx + dy);
      }
    return sum;
  }

  // ----- RULE：鄰域（交換兩個格位的內容，空格也可以交換）-----
  void SwapSlots(int a, int b, int[] roomAt, int[] slotOf)
  {
    int ra = roomAt[a], rb = roomAt[b];
    roomAt[a] = rb; roomAt[b] = ra;
    if (ra >= 0) slotOf[ra] = b;
    if (rb >= 0) slotOf[rb] = a;
  }

  // ----- Helpers -----
  int[] RandomPlacement(int n, int slotCount, Random rnd)
  {
    int[] order = Enumerable.Range(0, slotCount).ToArray();
    for (int k = slotCount - 1; k > 0; k--)          // Fisher–Yates 洗牌
    {
      int m = rnd.Next(k + 1);
      int t = order[k]; order[k] = order[m]; order[m] = t;
    }
    return order.Take(n).ToArray();
  }

  Point3d SlotCenter(int slot, int cols)
  {
    return new Point3d((slot % cols + 0.5) * CellSize, (slot / cols + 0.5) * CellSize, 0);
  }

  // 把 "客廳,餐廳,5" 或 "0,1,5" 讀進對稱矩陣
  double[,] ReadAdjacency(List<string> lines, List<string> names)
  {
    int n = names.Count;
    var w = new double[n, n];
    if (lines == null) return w;
    foreach (string line in lines)
    {
      if (string.IsNullOrWhiteSpace(line)) continue;
      string[] p = line.Split(',');
      if (p.Length < 3) continue;
      int i = IndexOf(p[0].Trim(), names), j = IndexOf(p[1].Trim(), names);
      double v;
      if (i < 0 || j < 0 || i == j || !double.TryParse(p[2].Trim(), out v)) continue;
      w[i, j] = v; w[j, i] = v;
    }
    return w;
  }

  int IndexOf(string token, List<string> names)
  {
    int k;
    if (int.TryParse(token, out k) && k >= 0 && k < names.Count) return k;
    return names.IndexOf(token);
  }

  // 成本曲線：x = 進度、y = 成本（正規化到平面高度）
  Polyline DrawCurve(List<double> history, double x0, double height)
  {
    var pl = new Polyline();
    double max = history.Max(), min = history.Min();
    double span = Math.Max(1e-9, max - min), width = height * 1.5;
    for (int k = 0; k < history.Count; k++)
    {
      double x = x0 + width * k / Math.Max(1, history.Count - 1);
      double y = height * (history[k] - min) / span;
      pl.Add(x, y, 0);
    }
    return pl;
  }
}
