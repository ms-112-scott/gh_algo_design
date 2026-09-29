// Grasshopper Script Instance
// ==================================================================
// F08 Minimum Spanning Tree & Steiner Tree｜最小生成樹與 Steiner 樹
// 家族：F 圖樣與最佳化　邏輯：搜尋／求解、幾何轉換　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   pts             Point3d  List   要連接的端點；留空就用 seed 撒點        例：（留空）
//   pointCount      int      Item   隨機撒點數量（pts 留空時才用）          例：40
//   seed            int      Item   隨機種子，同一種子得到同一組點          例：0（沒接時就是 0）
//   size            double   Item   撒點正方形邊長                         例：100.0
//   steiner         bool     Item   是否加入 Steiner 點改良（120° 三叉）    例：false
//   relaxIterations int      Item   Steiner 點鬆弛次數                     例：0（沒接時就是 0；鬆弛 0 次時三叉角度較不準，建議接 slider 設 10）
// 輸出
//   out                             Print 的文字（元件預設就有，不要刪）
//   mstLines                        最小生成樹的線段
//   steinerLines                    Steiner 網路的線段（steiner=false 時與 MST 相同）
//   steinerPoints                   新加入的 Steiner 點
//   info                            MST／Steiner 總長與節省比例文字
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 讀入端點 pts（留空就用 seed 在 size × size 內撒 pointCount 個點），所有點兩兩連成候選邊，依長度由短到長排序
//   2. Kruskal＋並查集：由短到長檢查每條邊，兩端已同群（會成環）就跳過，不同群才加入並合併，滿 n − 1 條邊完成
//   3. steiner = true 時：找夾角小於 120° 的一對邊，用 Weiszfeld 迭代求三點的 Fermat 點，拆掉兩條邊改接成三叉
//   4. 鬆弛 relaxIterations 次：每個 Steiner 點移到三個鄰點的 Fermat 點；退化的點（度數 ≤ 2 或貼到鄰點上）刪除、鄰點重新接好
//   5. 輸出 MST 線段、Steiner 網路、Steiner 點，並印出兩者總長與節省比例
// ------------------------------------------------------------------
// 你應該看到：40 個隨機點連成的最小生成樹；打開 steiner 後，夾角較尖的分岔會撐開成 120° 三叉，總長略為縮短
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
        List<Point3d> pts, int pointCount, int seed, double size, bool steiner, int relaxIterations,
        ref object mstLines, ref object steinerLines, ref object steinerPoints, ref object info)
    {
        // ===== 0. 防呆：沒接點就撒點，數值夾到合理範圍 =====
        if (pointCount <= 0) pointCount = 40;                          // 沒接 → 預設 40 個點
        if (pointCount > MaxPointCount)
        {
            Print(string.Format("撒點數量已達上限 {0} 個", MaxPointCount));
            pointCount = MaxPointCount;
        }
        if (size <= 0) size = 100.0;                                   // 沒接 → 預設邊長 100
        relaxIterations = Math.Max(0, Math.Min(relaxIterations, MaxRelaxIterations));

        List<Point3d> terminals = new List<Point3d>();
        if (pts != null && pts.Count > 0)
        {
            List<Point3d> inputPoints = pts;
            if (inputPoints.Count > MaxPointCount)
            {
                Print(string.Format("端點數量已達上限 {0} 個，只取前 {0} 個", MaxPointCount));
                inputPoints = inputPoints.GetRange(0, MaxPointCount);
            }
            double duplicateTolerance = size * 1e-6 + 1e-9;            // 依撒點範圍縮放的相對容許值
            Point3d[] culledPoints = Point3d.CullDuplicates(inputPoints, duplicateTolerance);
            int duplicateCount = inputPoints.Count - culledPoints.Length;
            if (duplicateCount > 0)
                Print(string.Format("端點有 {0} 個重複，已移除（重複點會讓長度 0 的邊使夾角計算失效）", duplicateCount));
            terminals.AddRange(culledPoints);
        }
        else
        {
            var random = new Random(seed);
            for (int i = 0; i < pointCount; i++)
                terminals.Add(new Point3d(random.NextDouble() * size, random.NextDouble() * size, 0));
        }
        int pointTotal = terminals.Count;
        if (pointTotal < 2) { Print("至少要 2 個點才能連成樹"); return; }

        // ===== 1. DATA 資料：所有候選邊（i < j），依長度由短到長排序 =====
        List<Edge> candidateEdges = new List<Edge>();
        for (int i = 0; i < pointTotal; i++)
            for (int j = i + 1; j < pointTotal; j++)
                candidateEdges.Add(new Edge(i, j, terminals[i].DistanceTo(terminals[j])));
        candidateEdges.Sort((a, b) => a.Length.CompareTo(b.Length));

        // ===== 2. INIT 初始：並查集每個點自成一群，節點與鄰接表先放原本的點 =====
        int[] parent = new int[pointTotal];
        for (int i = 0; i < pointTotal; i++) parent[i] = i;

        nodes = new List<Point3d>(terminals);
        adjacency = new List<List<int>>();
        alive = new List<bool>();
        for (int i = 0; i < pointTotal; i++) { adjacency.Add(new List<int>()); alive.Add(true); }

        // ===== 3. LOOP 迭代：Kruskal 貪婪選邊，再視需要插入 Steiner 點 =====
        List<Line> mstLineList = new List<Line>();
        int edgesUsed = 0;
        foreach (Edge candidate in candidateEdges)
        {
            int rootA = Find(parent, candidate.A);
            int rootB = Find(parent, candidate.B);
            if (rootA == rootB) continue;                   // 同一群：加了會成環，跳過

            parent[rootA] = rootB;                           // 合併兩群
            mstLineList.Add(new Line(terminals[candidate.A], terminals[candidate.B]));
            adjacency[candidate.A].Add(candidate.B);
            adjacency[candidate.B].Add(candidate.A);
            edgesUsed++;
            if (edgesUsed == pointTotal - 1) break;          // n − 1 條邊就是完整的樹
        }
        double mstLength = TotalLength();

        if (steiner)
        {
            double removeTolerance = size * 1e-4 + 1e-9;

            // 反覆插入夾角最小的三叉，直到插不出更短的為止（guard 保證一定會停）
            int insertGuard = 0;
            while (InsertOneSteinerPoint() && insertGuard++ < 4 * pointTotal) { }
            if (insertGuard >= 4 * pointTotal) Print("Steiner 插點已達上限，停止插入");

            RemoveDegenerate(pointTotal, removeTolerance);   // 插點結束先清一次，0 次鬆弛也只留下真正的三叉點

            // 鬆弛：Steiner 點移到三鄰點的 Fermat 點，收斂到接近 120° 三叉
            for (int round = 0; round < relaxIterations; round++)
            {
                for (int nodeIndex = pointTotal; nodeIndex < nodes.Count; nodeIndex++)
                {
                    if (!alive[nodeIndex]) continue;
                    if (adjacency[nodeIndex].Count == 3)
                        nodes[nodeIndex] = Fermat(nodes[adjacency[nodeIndex][0]], nodes[adjacency[nodeIndex][1]], nodes[adjacency[nodeIndex][2]]);
                }
                RemoveDegenerate(pointTotal, removeTolerance);
            }
        }

        // ===== 4. OUTPUT 輸出：整理成線段與點，並印出總長與節省比例 =====
        List<Line> steinerLineList = new List<Line>();
        List<Point3d> steinerPointList = new List<Point3d>();
        for (int i = 0; i < nodes.Count; i++)
        {
            if (!alive[i]) continue;
            if (i >= pointTotal) steinerPointList.Add(nodes[i]);
            foreach (int j in adjacency[i]) if (i < j) steinerLineList.Add(new Line(nodes[i], nodes[j]));
        }
        double steinerLength = TotalLength();
        double savingPercent = mstLength > 1e-9 ? 100.0 * (1 - steinerLength / mstLength) : 0.0;

        string summary = string.Format("MST 總長 {0:F2}｜Steiner 總長 {1:F2}｜節省 {2:F1}%｜Steiner 點 {3} 個",
            mstLength, steinerLength, savingPercent, steinerPointList.Count);
        Print(summary);
        mstLines = mstLineList;
        steinerLines = steinerLineList;
        steinerPoints = steinerPointList;
        info = summary;
    }

    // ----- Fields 欄位 -----
    const int MaxPointCount = 800;                                      // 撒點上限：候選邊 ~n²/2，避免排序過久
    const int MaxRelaxIterations = 200;                                 // 鬆弛次數上限
    const double MaxAngleRadians = 120.0 * Math.PI / 180.0 - 1e-3;      // 夾角小於 120° 才插 Steiner 點
    const int MaxFermatSteps = 60;                                      // Weiszfeld 線性收斂、容許誤差 1e-9，60 步足夠收斂

    List<Point3d> nodes;          // 樹的節點：前 pointTotal 個是原本的端點，之後是新增的 Steiner 點
    List<List<int>> adjacency;    // 鄰接表：每個節點目前接到哪些節點
    List<bool> alive;             // 節點是否還在樹上（被移除的退化 Steiner 點設為 false）

    // ----- RULE 規則：並查集「找代表」，順便壓縮路徑 -----
    int Find(int[] parent, int x)
    {
        while (parent[x] != x)
        {
            parent[x] = parent[parent[x]];   // 路徑壓縮：往上指兩層，之後查詢更快
            x = parent[x];
        }
        return x;
    }

    // ----- RULE 規則：找全樹夾角最小且小於 120° 的一對邊，插入 Fermat 點改接三叉 -----
    bool InsertOneSteinerPoint()
    {
        int bestNode = -1, bestNeighborA = -1, bestNeighborB = -1;
        double bestAngle = MaxAngleRadians;
        for (int v = 0; v < nodes.Count; v++)
        {
            if (!alive[v]) continue;
            List<int> neighbors = adjacency[v];
            for (int p = 0; p < neighbors.Count; p++)
                for (int q = p + 1; q < neighbors.Count; q++)
                {
                    double angle = Vector3d.VectorAngle(nodes[neighbors[p]] - nodes[v], nodes[neighbors[q]] - nodes[v]);
                    if (angle < 0) continue;   // 退化邊（長度 0）：VectorAngle 對零向量回傳 UnsetValue，跳過避免誤判成最小夾角
                    if (angle < bestAngle) { bestAngle = angle; bestNode = v; bestNeighborA = neighbors[p]; bestNeighborB = neighbors[q]; }
                }
        }
        if (bestNode < 0) return false;                       // 沒有夾角小於 120° 的分岔，不用再插

        Point3d steinerPoint = Fermat(nodes[bestNode], nodes[bestNeighborA], nodes[bestNeighborB]);
        double lengthBefore = nodes[bestNode].DistanceTo(nodes[bestNeighborA]) + nodes[bestNode].DistanceTo(nodes[bestNeighborB]);
        double lengthAfter = steinerPoint.DistanceTo(nodes[bestNode]) + steinerPoint.DistanceTo(nodes[bestNeighborA]) + steinerPoint.DistanceTo(nodes[bestNeighborB]);
        if (lengthAfter >= lengthBefore - 1e-9) return false;  // 插了也沒有變短，停止

        // 拆掉 v–a、v–b 這兩條邊，改接成 s–v、s–a、s–b 的三叉
        int newIndex = nodes.Count;
        nodes.Add(steinerPoint);
        alive.Add(true);
        adjacency.Add(new List<int> { bestNode, bestNeighborA, bestNeighborB });
        adjacency[bestNode].Remove(bestNeighborA); adjacency[bestNeighborA].Remove(bestNode);
        adjacency[bestNode].Remove(bestNeighborB); adjacency[bestNeighborB].Remove(bestNode);
        adjacency[bestNode].Add(newIndex); adjacency[bestNeighborA].Add(newIndex); adjacency[bestNeighborB].Add(newIndex);
        return true;
    }

    // ----- RULE 規則：Weiszfeld 迭代，求到三點距離總和最小的 Fermat 點 -----
    Point3d Fermat(Point3d a, Point3d b, Point3d c)
    {
        Point3d guessPoint = (a + b + c) / 3.0;               // 初始猜測：三角形重心
        Point3d[] corners = { a, b, c };
        for (int step = 0; step < MaxFermatSteps; step++)
        {
            Vector3d weightedSum = Vector3d.Zero;
            double weightTotal = 0;
            foreach (Point3d corner in corners)
            {
                double distance = guessPoint.DistanceTo(corner);
                if (distance < 1e-9) return corner;           // 落在某個頂點上：該頂點夾角已 ≥ 120°
                weightedSum += (Vector3d)corner / distance;    // 距離越近權重越大 → 加權移動
                weightTotal += 1.0 / distance;
            }
            Point3d nextGuess = (Point3d)(weightedSum / weightTotal);
            if (nextGuess.DistanceTo(guessPoint) < 1e-9) break;   // 收斂就提早停
            guessPoint = nextGuess;
        }
        return guessPoint;
    }

    // ----- RULE 規則：刪除退化的 Steiner 點（度數 ≤ 2，或貼到鄰點上），鄰點直接接起來 -----
    void RemoveDegenerate(int pointTotal, double tolerance)
    {
        for (int s = pointTotal; s < nodes.Count; s++)
        {
            if (!alive[s]) continue;
            int overlapHub = -1;                              // 貼在同一個位置上的鄰點（沒有就是 -1）
            foreach (int j in adjacency[s]) if (nodes[s].DistanceTo(nodes[j]) < tolerance) overlapHub = j;
            if (adjacency[s].Count > 2 && overlapHub < 0) continue;   // 三叉且沒貼點：保留

            List<int> neighbors = new List<int>(adjacency[s]);
            foreach (int j in neighbors) adjacency[j].Remove(s);
            adjacency[s].Clear();
            alive[s] = false;

            // 貼到鄰點：其餘鄰點都改接到那個鄰點；只是度數 2：兩個鄰點直接相連 → 樹仍然連通
            int hub = overlapHub >= 0 ? overlapHub : (neighbors.Count > 0 ? neighbors[0] : -1);
            if (hub < 0) continue;
            foreach (int j in neighbors)
                if (j != hub) { adjacency[hub].Add(j); adjacency[j].Add(hub); }
        }
    }

    // ----- Helpers 工具：目前這棵樹（或網路）的總長 -----
    double TotalLength()
    {
        double sum = 0;
        for (int i = 0; i < nodes.Count; i++)
            if (alive[i]) foreach (int j in adjacency[i]) if (i < j) sum += nodes[i].DistanceTo(nodes[j]);
        return sum;
    }

    // 候選邊：兩端點在 nodes 裡的索引與長度
    struct Edge
    {
        public int A, B;
        public double Length;
        public Edge(int a, int b, double length) { A = a; B = b; Length = length; }
    }
}
