// Grasshopper Script Instance
// ==================================================================
// E06 Force Density Method (FDM)｜力密度法（FDM）
// 家族：E 排列與鬆弛　邏輯：搜尋／求解　難度：4
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   baseMesh        Mesh            Item   索網初始網格：只取拓樸（誰連誰）決定格子型式，座標當固定點與初始猜測    例：沒接時用內建 6×6 平面網格
//   anchors         List<Point3d>   List   固定點；空清單時自動固定網格裸邊上的所有頂點                          例：空清單
//   forceDensity    double          Item   內部邊的力密度 q＝內力÷長度（必須為正，矩陣才保持正定）              例：1.0
//   edgeCableFactor double          Item   裸邊（邊索）的 q 倍率；大於 1 邊索拉直，小於 1 邊界往內彎              例：1.5
//                                          （只在指定 anchors 時才會改變外形；anchors 空、自動固定所有裸邊頂點時，兩端都是固定點，只影響 forces／colors）
//   load            double          Item   每個自由節點的 Z 向外力；負值往下懸垂、正值往上受壓、0 只受預力       例：-0.5
//   cgIterations    int             Item   共軛梯度法（Conjugate Gradient）最多迭代次數                        例：200
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   lines                        每條邊平衡後的線段
//   formMesh                     平衡後的網格（面沿用 baseMesh／內建網格）
//   forces                       每條邊的內力＝q×長度
//   colors                       依內力由藍（小）到紅（大）上色，可接 Custom Preview
//   residual                     x、y、z 三次求解後的殘差（越接近 0 越準）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 把網格轉成圖：拓樸頂點當節點、拓樸邊當邊；每條邊的力密度 q＝forceDensity，
//      只接一個面的裸邊（邊索）再乘 edgeCableFactor。
//   2. 決定固定點：有指定 anchors 就吸附到最近的頂點，否則把所有裸邊頂點都固定；
//      其餘節點是自由點，依序編號成未知數，供後面組矩陣使用。
//   3. 對自由點組出矩陣 D＝Cnᵀ·Q·Cn：每條邊把 q 累加到兩端自由點的對角線；
//      兩端都是自由點時，在兩者的非對角位置各填 −q（MatVec 裡沿邊扣掉 q×對方的值）；
//      邊只接一端自由點時，另一端固定點的座標乘 q 移到方程式右邊當常數。
//   4. x、y、z 三個方向各自解一次 D·u＝外力＋固定點貢獻（外力只有 z 方向的 load），
//      用共軛梯度法反覆逼近，只沿邊做矩陣乘向量，不必組出完整矩陣。
//   5. 解出的座標寫回節點，內力＝q×長度，依大小由藍到紅上色，輸出平衡後的線段與網格。
// ------------------------------------------------------------------
// 你應該看到：用預設值時，內建的平面網格四周固定、中間往下垂成一個淺淺的盆形，殘差接近 0；
//   接四個角點當 anchors 再調 edgeCableFactor，邊界會變成扇貝形
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
        Mesh baseMesh, List<Point3d> anchors, double forceDensity, double edgeCableFactor, double load, int cgIterations,
        ref object lines, ref object formMesh, ref object forces, ref object colors, ref object residual)
    {
        // ===== 0. 防呆：沒接的輸入用檔頭的建議預設值，才能只接 slider 就有畫面 =====
        if (baseMesh == null) baseMesh = BuildDefaultMesh(DefaultGridCount, DefaultGridSize);
        else if (!baseMesh.IsValid)                              // 接了東西卻看不出原因，先講清楚
        { Print("輸入網格無效，已改用內建平面網格"); baseMesh = BuildDefaultMesh(DefaultGridCount, DefaultGridSize); }
        if (anchors == null) anchors = new List<Point3d>();
        if (forceDensity < 0) { Print("力密度必須為正，已改用 1.0"); forceDensity = 1.0; }  // 負 q 讓 D 不再正定
        else if (forceDensity == 0) forceDensity = 1.0;          // 0＝沒接（double 沒接時預設就是 0），不必提醒
        if (edgeCableFactor < 0) { Print("邊索倍率必須為正，已改用 1.5"); edgeCableFactor = 1.5; }
        else if (edgeCableFactor == 0) edgeCableFactor = 1.5;    // 0＝沒接，不必提醒
        // load 的 0 是合法值（只受預力）；double 沒接時預設也是 0，兩者分不出來，所以看「有沒有接線」而不是看數值
        if (Component != null && Component.Params.Input[4].SourceCount == 0) load = -0.5;
        if (cgIterations < 1) cgIterations = 200;
        cgIterations = Math.Min(cgIterations, MaxCgIterations); // 上限：避免手滑打進超大數字讓 GH 卡住

        // ===== 1. DATA 資料：網格轉圖，算每條邊的力密度，決定固定點與自由點編號 =====
        Rhino.Geometry.Collections.MeshTopologyVertexList tv = baseMesh.TopologyVertices;
        Rhino.Geometry.Collections.MeshTopologyEdgeList te = baseMesh.TopologyEdges;
        int nodeCount = tv.Count;
        if (nodeCount > MaxNodes)
        {
            Print("網格節點數 " + nodeCount + " 超過上限 " + MaxNodes + "，請先 Reduce 網格再試");
            return;
        }
        Point3d[] xyz = new Point3d[nodeCount];
        for (int i = 0; i < nodeCount; i++) xyz[i] = tv[i];

        List<Edge> edges = new List<Edge>();
        for (int e = 0; e < te.Count; e++)
        {
            IndexPair ab = te.GetTopologyVertices(e);
            bool naked = te.GetConnectedFaces(e).Length == 1;                    // 只接一個面＝裸邊（邊索）
            double q = forceDensity * (naked ? edgeCableFactor : 1.0);
            edges.Add(new Edge(ab.I, ab.J, q));
        }

        bool[] isFixed = FindFixed(baseMesh, anchors);
        int freeCount = 0;
        int[] freeIndex = new int[nodeCount];                                   // 節點 → 未知數編號（固定點為 -1）
        for (int i = 0; i < nodeCount; i++) freeIndex[i] = isFixed[i] ? -1 : freeCount++;
        if (freeCount == 0 || freeCount == nodeCount)
        {
            Print("至少要有一個固定點與一個自由點：請指定 anchors，或確認網格有裸邊");
            return;
        }

        // 沿邊從固定點做一次 BFS：連不到固定點的自由點會讓 D 奇異（CG 不收斂、座標可能爆成 NaN），
        // 所以連不到的自由點改成固定（保持原位），不進未知數
        List<int>[] neighbors = new List<int>[nodeCount];
        for (int i = 0; i < nodeCount; i++) neighbors[i] = new List<int>();
        foreach (Edge edge in edges) { neighbors[edge.NodeA].Add(edge.NodeB); neighbors[edge.NodeB].Add(edge.NodeA); }
        bool[] reachable = new bool[nodeCount];
        Queue<int> frontier = new Queue<int>();
        for (int i = 0; i < nodeCount; i++) if (isFixed[i]) { reachable[i] = true; frontier.Enqueue(i); }
        while (frontier.Count > 0)
        {
            int current = frontier.Dequeue();
            foreach (int neighbor in neighbors[current])
                if (!reachable[neighbor]) { reachable[neighbor] = true; frontier.Enqueue(neighbor); }
        }
        int strandedCount = 0;
        for (int i = 0; i < nodeCount; i++) if (!reachable[i]) { isFixed[i] = true; strandedCount++; }
        if (strandedCount > 0)
        {
            Print("有 " + strandedCount + " 個節點連不到固定點，已固定在原位");
            freeCount = 0;
            for (int i = 0; i < nodeCount; i++) freeIndex[i] = isFixed[i] ? -1 : freeCount++;   // 重新編號未知數
            if (freeCount == 0) { Print("固定後已沒有自由點可求解"); return; }
        }

        // ===== 2. INIT 初始：矩陣 D 的對角線＝每個自由點相連各邊的 q 加總 =====
        double[] diagonal = new double[freeCount];
        foreach (Edge edge in edges)
        {
            if (freeIndex[edge.NodeA] >= 0) diagonal[freeIndex[edge.NodeA]] += edge.Q;
            if (freeIndex[edge.NodeB] >= 0) diagonal[freeIndex[edge.NodeB]] += edge.Q;
        }

        // ===== 3. LOOP 迭代：x、y、z 各解一次 D·u＝外力＋固定點貢獻，共軛梯度法逼近 =====
        List<double> residualList = new List<double>();
        for (int axis = 0; axis < 3; axis++)
        {
            double[] rightHandSide = new double[freeCount];
            double[] unknown = new double[freeCount];
            for (int i = 0; i < nodeCount; i++)
            {
                if (freeIndex[i] < 0) continue;
                unknown[freeIndex[i]] = Coord(xyz[i], axis);                    // 起始猜測＝原本座標
                if (axis == 2) rightHandSide[freeIndex[i]] = load;             // 外力只有 z 方向
            }
            foreach (Edge edge in edges)                                        // 固定點的座標乘 q 移到右手邊
            {
                if (freeIndex[edge.NodeA] >= 0 && freeIndex[edge.NodeB] < 0)
                    rightHandSide[freeIndex[edge.NodeA]] += edge.Q * Coord(xyz[edge.NodeB], axis);
                if (freeIndex[edge.NodeB] >= 0 && freeIndex[edge.NodeA] < 0)
                    rightHandSide[freeIndex[edge.NodeB]] += edge.Q * Coord(xyz[edge.NodeA], axis);
            }
            residualList.Add(SolveCG(diagonal, edges, freeIndex, rightHandSide, unknown, cgIterations));
            for (int i = 0; i < nodeCount; i++)
                if (freeIndex[i] >= 0) xyz[i] = SetCoord(xyz[i], axis, unknown[freeIndex[i]]);
        }

        // ===== 4. OUTPUT 輸出：平衡線段、內力、上色、寫回網格 =====
        List<Line> outLines = new List<Line>();
        List<double> outForces = new List<double>();
        double forceMin = double.MaxValue, forceMax = double.MinValue;
        foreach (Edge edge in edges)
        {
            Line segment = new Line(xyz[edge.NodeA], xyz[edge.NodeB]);
            double force = edge.Q * segment.Length;                             // 內力＝力密度 × 長度
            outLines.Add(segment);
            outForces.Add(force);
            forceMin = Math.Min(forceMin, force);
            forceMax = Math.Max(forceMax, force);
        }
        List<Color> outColors = new List<Color>();
        foreach (double force in outForces)
            outColors.Add(Ramp((force - forceMin) / Math.Max(1e-12, forceMax - forceMin)));

        Mesh outMesh = baseMesh.DuplicateMesh();
        for (int i = 0; i < nodeCount; i++)
            foreach (int meshVertex in tv.MeshVertexIndices(i)) outMesh.Vertices.SetVertex(meshVertex, xyz[i]);
        outMesh.Normals.ComputeNormals();

        Print("{0} 個節點、{1} 條邊，{2} 個固定點、{3} 個自由點，殘差 {4:F6}／{5:F6}／{6:F6}",
            nodeCount, edges.Count, nodeCount - freeCount, freeCount, residualList[0], residualList[1], residualList[2]);
        lines = outLines;
        formMesh = outMesh;
        forces = outForces;
        colors = outColors;
        residual = residualList;
    }

    // ----- Fields 欄位 -----
    const double AnchorTolerance = 1e-3;      // anchors 吸附到頂點的容許誤差，超過就提醒
    const int MaxCgIterations = 5000;         // 共軛梯度法最多步數上限，避免打錯數字讓 GH 卡住
    const int MaxNodes = 20000;               // 節點數上限：3 軸 × 上千次 CG 迭代沿全部邊算，超過就先提醒 Reduce 網格
    const int DefaultGridCount = 6;           // 沒接 baseMesh 時，內建平面網格的每邊格數
    const double DefaultGridSize = 20.0;      // 沒接 baseMesh 時，內建平面網格的邊長

    // ----- RULE 規則：SolveCG 解 D·u=b，MatVec 只沿邊做矩陣乘向量（不存整個 D） -----
    // 共軛梯度法：D 對稱正定（q 全為正、每個自由點都連得到固定點）時保證收斂
    double SolveCG(double[] diagonal, List<Edge> edges, int[] freeIndex, double[] b, double[] x, int maxIterations)
    {
        int m = b.Length;
        double[] r = new double[m];
        double[] p = new double[m];
        double[] matrixTimesP = new double[m];
        MatVec(diagonal, edges, freeIndex, x, matrixTimesP);
        for (int i = 0; i < m; i++) { r[i] = b[i] - matrixTimesP[i]; p[i] = r[i]; }
        double residualDot = Dot(r, r);
        double rightHandDot = Math.Max(1e-24, Dot(b, b));
        for (int step = 0; step < maxIterations && residualDot / rightHandDot > 1e-20; step++)
        {
            MatVec(diagonal, edges, freeIndex, p, matrixTimesP);
            double denominator = Dot(p, matrixTimesP);
            if (denominator <= 1e-300) break;                   // 防除以 0：數值上已經收斂或矩陣退化，提早停止比繼續除更安全
            double alpha = residualDot / denominator;
            for (int i = 0; i < m; i++) { x[i] += alpha * p[i]; r[i] -= alpha * matrixTimesP[i]; }
            double residualDotNew = Dot(r, r);
            double beta = residualDotNew / residualDot;
            for (int i = 0; i < m; i++) p[i] = r[i] + beta * p[i];
            residualDot = residualDotNew;
        }
        return Math.Sqrt(residualDot);
    }

    // y＝D·v：每條邊把 q 累加到兩端自由點，不必真的存出 freeCount×freeCount 的矩陣
    void MatVec(double[] diagonal, List<Edge> edges, int[] freeIndex, double[] v, double[] y)
    {
        for (int i = 0; i < v.Length; i++) y[i] = diagonal[i] * v[i];
        foreach (Edge edge in edges)
        {
            int a = freeIndex[edge.NodeA];
            int b = freeIndex[edge.NodeB];
            if (a >= 0 && b >= 0) { y[a] -= edge.Q * v[b]; y[b] -= edge.Q * v[a]; }
        }
    }

    // ----- Helpers 工具 -----
    // 固定點：有指定 anchors 就吸附到最近頂點，否則把所有裸邊頂點都固定
    bool[] FindFixed(Mesh mesh, List<Point3d> anchors)
    {
        Rhino.Geometry.Collections.MeshTopologyVertexList tv = mesh.TopologyVertices;
        bool[] fixedFlag = new bool[tv.Count];
        if (anchors.Count > 0)
        {
            foreach (Point3d anchor in anchors)
            {
                int best = -1;
                double bestDistance = double.MaxValue;
                for (int i = 0; i < tv.Count; i++)
                {
                    double distance = anchor.DistanceTo(tv[i]);
                    if (distance < bestDistance) { bestDistance = distance; best = i; }
                }
                if (best >= 0) fixedFlag[best] = true;
                if (bestDistance > AnchorTolerance)
                    Print("錨點不在頂點上，已吸附到最近頂點（距離 " + bestDistance.ToString("0.###") + "）");
            }
        }
        else
        {
            // 和 DATA 段判斷邊索同一個標準（只接一個面＝裸邊），沿拓樸邊找，不用 GetNakedEdgePointStatus：
            // 它在頂點數過少等情況下會回傳 null，閉合網格（球、盒子）又剛好常落在這個路徑，會直接丟例外
            Rhino.Geometry.Collections.MeshTopologyEdgeList te = mesh.TopologyEdges;
            for (int e = 0; e < te.Count; e++)
            {
                if (te.GetConnectedFaces(e).Length != 1) continue;              // 只接一個面才是裸邊
                IndexPair ab = te.GetTopologyVertices(e);
                fixedFlag[ab.I] = true;
                fixedFlag[ab.J] = true;
            }
        }
        return fixedFlag;
    }

    // 沒接 baseMesh 時的內建平面網格：(gridCount+1)×(gridCount+1) 個頂點，四邊都是裸邊
    Mesh BuildDefaultMesh(int gridCount, double size)
    {
        Mesh mesh = new Mesh();
        int pointsPerSide = gridCount + 1;
        double step = size / gridCount;
        for (int row = 0; row < pointsPerSide; row++)
            for (int col = 0; col < pointsPerSide; col++)
                mesh.Vertices.Add(new Point3d(col * step, row * step, 0));
        for (int row = 0; row < gridCount; row++)
            for (int col = 0; col < gridCount; col++)
            {
                int a = row * pointsPerSide + col;
                int b = a + 1;
                int c = a + pointsPerSide + 1;
                int d = a + pointsPerSide;
                mesh.Faces.AddFace(a, b, c, d);
            }
        return mesh;
    }

    static double Dot(double[] a, double[] b)
    {
        double sum = 0;
        for (int i = 0; i < a.Length; i++) sum += a[i] * b[i];
        return sum;
    }

    static double Coord(Point3d p, int axis) { return axis == 0 ? p.X : axis == 1 ? p.Y : p.Z; }

    static Point3d SetCoord(Point3d p, int axis, double value)
    {
        if (axis == 0) p.X = value; else if (axis == 1) p.Y = value; else p.Z = value;
        return p;
    }

    // 內力比例 0～1 → 藍（小）到紅（大）
    static Color Ramp(double t)
    {
        t = Math.Max(0, Math.Min(1, t));
        return Color.FromArgb((int)(40 + 215 * t), (int)(90 + 60 * (1 - Math.Abs(2 * t - 1))), (int)(255 - 215 * t));
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================

// 一條邊：兩端節點編號（對照 TopologyVertices 的索引）與力密度 q＝內力÷長度
public struct Edge
{
    public int NodeA, NodeB;
    public double Q;

    public Edge(int nodeA, int nodeB, double q) { NodeA = nodeA; NodeB = nodeB; Q = q; }
}
