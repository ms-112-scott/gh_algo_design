// #! csharp
// =====================================================================
// E05 圖解靜力學：索多邊形與力圖（Graphic Statics: Funicular Polygon & Force Diagram）
// ---------------------------------------------------------------------
// 做法：不列方程式，全部用「平行線＋交點」作圖。
//   1. 沿跨度放一串垂直載重，在力圖上把載重首尾相接成「載重線」。
//   2. 先隨便選一個試算極點 O'，畫出試算索多邊形，連出閉合線。
//   3. 從 O' 畫閉合線的平行線，交載重線於 K：K 把總載重分成兩端的支承反力。
//   4. 真極點放在 K 的水平線上，極距 H 由「指定矢高 sag」反推（縱距與 H 成反比）。
//   5. 從左支承開始，每一段都平行於對應射線，交到下一條載重作用線，連成索多邊形；
//      射線長度就是該段內力。asArch = true 時極點放到另一側，得到純受壓的拱。
//
// 輸入：
//   span          (double) 跨度，兩支承點之間的水平距離
//   loadCount     (int)    載重數量（沿跨度等距）
//   loadVariation (double) 載重大小的隨機變化比例 0–1（0 = 全部相等）
//   seed          (int)    亂數種子，同一種子得到同一組載重
//   sag           (double) 指定矢高：索（或拱）離兩支承連線的最大垂直距離
//   asArch        (bool)   false = 下垂受拉的索；true = 上拱受壓的拱
// 輸出：
//   formLines  形狀圖：索多邊形各段（List<Line>）
//   loadLines  形狀圖：載重箭頭（長度依載重大小）
//   forceLines 力圖：載重線各段＋極點射線
//   trialLines 教學用：試算索多邊形與閉合線
//   forces     各段內力（與 formLines 一一對應；拉力為正，壓力為負）
//
// 由 gh-new-algos 工作流程產生，尚未在 Rhino 中實測。
// =====================================================================
using System;
using System.Collections;
using System.Collections.Generic;

using Rhino;
using Rhino.Geometry;
using Rhino.Geometry.Intersect;

using Grasshopper;
using Grasshopper.Kernel;
using Grasshopper.Kernel.Data;
using Grasshopper.Kernel.Types;

public class Script_Instance : GH_ScriptInstance
{
  private void RunScript(
    double span, int loadCount, double loadVariation, int seed, double sag, bool asArch,
    ref object formLines, ref object loadLines, ref object forceLines, ref object trialLines, ref object forces)
  {
    // 0. 防呆
    if (span <= 0 || loadCount < 1 || sag <= 0) { Print("span、sag 要大於 0，loadCount 至少 1"); return; }

    // 1. DATA：載重位置 x 與大小 P
    Random rnd = new Random(seed);
    double[] xs = new double[loadCount];
    double[] P = new double[loadCount];
    double total = 0;
    for (int i = 0; i < loadCount; i++)
    {
      xs[i] = span * (i + 0.5) / loadCount;
      P[i] = Math.Max(0.05, 1.0 + loadVariation * (rnd.NextDouble() * 2 - 1));
      total += P[i];
    }

    // 2. 力圖：載重線（首尾相接），放在形狀圖右邊
    double forceScale = span * 0.6 / total;          // 力 → 圖面長度的比例
    double ox = span * 1.4;                           // 力圖的 x 位置
    List<Point3d> loadLine = new List<Point3d>();
    loadLine.Add(new Point3d(ox, 0, 0));
    for (int i = 0; i < loadCount; i++)
      loadLine.Add(loadLine[i] + new Vector3d(0, -P[i] * forceScale, 0));

    // 極點在哪一側決定受拉或受壓：索 → 右側，拱 → 左側
    double side = asArch ? -1 : 1;
    Point3d A = new Point3d(0, 0, 0), B = new Point3d(span, 0, 0);

    // 3. 試算極點 O'：極距隨便取，高度取載重線中點
    double trialH = span * 0.4;
    Point3d trialPole = new Point3d(ox + side * trialH, loadLine[loadCount].Y / 2, 0);
    List<Point3d> trial = DrawFunicular(A, trialPole, loadLine, xs, span);
    Point3d trialEnd = trial[trial.Count - 1];        // 試算索多邊形落在右支承垂直線上的點

    // 4. 閉合線 A → trialEnd；從 O' 畫平行線交載重線於 K（分出兩端反力）
    double closingSlope = (trialEnd.Y - A.Y) / span;
    double kY = trialPole.Y + closingSlope * (ox - trialPole.X);

    // 5. 三點條件：縱距（離閉合線的垂直距離）與極距成反比 → 反推真極距 H
    double maxDepth = 0;
    for (int k = 1; k <= loadCount; k++)
    {
      double closingY = A.Y + closingSlope * trial[k].X;
      maxDepth = Math.Max(maxDepth, Math.Abs(trial[k].Y - closingY));
    }
    double H = trialH * maxDepth / sag;
    Point3d pole = new Point3d(ox + side * H, kY, 0);

    // 6. 用真極點畫出索多邊形（此時應剛好通過兩個支承）
    List<Point3d> funicular = DrawFunicular(A, pole, loadLine, xs, span);
    Print("右端誤差 = " + funicular[funicular.Count - 1].DistanceTo(B).ToString("0.0000"));
    Print("水平推力 H = " + (H / forceScale).ToString("0.000") + "（載重單位）");

    // 7. OUTPUT：形狀圖、載重箭頭、力圖、試算線、內力
    List<Line> form = new List<Line>();
    List<double> segForces = new List<double>();
    List<Line> rays = new List<Line>();
    for (int j = 0; j <= loadCount; j++)
    {
      form.Add(new Line(funicular[j], funicular[j + 1]));
      double f = pole.DistanceTo(loadLine[j]) / forceScale;   // 射線長度 = 內力
      segForces.Add(asArch ? -f : f);
      rays.Add(new Line(pole, loadLine[j]));
    }

    List<Line> arrows = new List<Line>();
    for (int i = 0; i < loadCount; i++)
    {
      Point3d tip = funicular[i + 1];
      arrows.Add(new Line(tip + new Vector3d(0, P[i] * forceScale * 0.5, 0), tip));
    }

    List<Line> forceDiagram = new List<Line>();
    for (int i = 0; i < loadCount; i++) forceDiagram.Add(new Line(loadLine[i], loadLine[i + 1]));
    forceDiagram.AddRange(rays);

    List<Line> trialDiagram = new List<Line>();
    for (int j = 0; j + 1 < trial.Count; j++) trialDiagram.Add(new Line(trial[j], trial[j + 1]));
    trialDiagram.Add(new Line(A, trialEnd));          // 閉合線
    trialDiagram.Add(new Line(trialPole, new Point3d(ox, kY, 0)));  // 閉合線的平行射線 → K

    formLines = form;
    loadLines = arrows;
    forceLines = forceDiagram;
    trialLines = trialDiagram;
    forces = segForces;
  }

  // ----- RULE：從 start 出發，每段平行於「極點 → 載重線分點」的射線 -----
  private List<Point3d> DrawFunicular(Point3d start, Point3d pole, List<Point3d> loadLine, double[] xs, double span)
  {
    List<Point3d> pts = new List<Point3d>();
    pts.Add(start);
    Point3d current = start;
    for (int j = 0; j < loadLine.Count; j++)
    {
      Vector3d dir = pole - loadLine[j];
      if (dir.X < 0) dir = -dir;                      // 一律往右畫
      double nextX = (j < xs.Length) ? xs[j] : span;  // 下一條載重作用線（最後一段交右支承線）
      current = IntersectVertical(current, dir, nextX);
      pts.Add(current);
    }
    return pts;
  }

  // ----- Helper：從 p 沿 dir 的直線，與垂直線 x = x0 的交點 -----
  private Point3d IntersectVertical(Point3d p, Vector3d dir, double x0)
  {
    Line ray = new Line(p, p + dir);
    Line vertical = new Line(new Point3d(x0, -1, 0), new Point3d(x0, 1, 0));
    double a, b;
    if (Intersection.LineLine(ray, vertical, out a, out b)) return ray.PointAt(a);
    return p;                                          // 平行（dir 垂直）時不移動
  }
}
