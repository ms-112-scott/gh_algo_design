// Grasshopper Script Instance
// ==================================================================
// F03 Triply Periodic Minimal Surface (TPMS)｜TPMS 三週期極小曲面
// 家族：F 圖樣與最佳化　邏輯：直接公式／幾何轉換　難度：4
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   surfaceType   int     Item   0＝Gyroid、1＝Schwarz P            例：0
//   cellCount     int     Item   立方體每邊切幾格（解析度）          例：20
//   size          double  Item   立方體邊長                         例：10.0
//   periods       double  Item   每邊重複幾個單元                    例：2.0
//   isoValue      double  Item   等值面偏移（0＝標準極小曲面）        例：0.0
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   mesh                         TPMS 曲面（Mesh）
//   triangleCount                三角形數量
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 把 size 邊長的立方體切成 cellCount³ 個小格，每個格點只算一次公式值存起來。
//   2. periods 決定座標換算成角度時轉幾圈，也就是公式在每邊重複幾個單元。
//   3. 逐一掃過每個小立方體，取出 8 個角的座標與數值，切成 6 個共用主對角線的四面體。
//   4. 每個四面體依「內側角（f < isoValue）」的數量產生 0、1 或 2 個三角形，交點在邊上線性內插。
//   5. 三角形依內外側方向統一法線，最後合併重複頂點、算頂點法線，組成 Mesh。
// ------------------------------------------------------------------
// 你應該看到：一塊螺旋迷宮狀、無接縫、三個方向各重複兩次的 Gyroid 曲面立方體
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

    private void RunScript(int surfaceType, int cellCount, double size, double periods, double isoValue, ref object mesh, ref object triangleCount)
    {
        // ===== 0. 防呆 =====
        if (surfaceType != 0 && surfaceType != 1) surfaceType = 0;      // 只認 0／1，其他值當 Gyroid
        if (cellCount <= 0) cellCount = DefaultCellCount;                // 沒接 → 預設 20
        bool clampedToMax = cellCount > MaxCellCount;                     // 記錄使用者是否真的超過上限（原始值剛好等於上限不算碰到上限）
        cellCount = Math.Max(MinCellCount, Math.Min(cellCount, MaxCellCount));
        if (size <= 0) size = DefaultSize;
        if (periods <= 0) periods = DefaultPeriods;                      // 用 2 而不是 pseudo_code 寫的 1：畫面要看得出重複才教得動

        // ===== 1. DATA 資料 =====
        double cellSize = size / cellCount;                              // 每格大小
        double angularFrequency = periods * 2.0 * Math.PI / size;        // 座標換算角度：每 size 距離轉 periods 圈
        int pointsPerSide = cellCount + 1;
        var values = new double[pointsPerSide, pointsPerSide, pointsPerSide];
        var triangleVertices = new List<Point3d>();

        // ===== 2. INIT 初始：每個格點算一次公式 =====
        for (int i = 0; i < pointsPerSide; i++)
        {
            for (int j = 0; j < pointsPerSide; j++)
            {
                for (int k = 0; k < pointsPerSide; k++)
                {
                    double x = i * cellSize * angularFrequency;
                    double y = j * cellSize * angularFrequency;
                    double z = k * cellSize * angularFrequency;
                    values[i, j, k] = SurfaceFormula(surfaceType, x, y, z);
                }
            }
        }

        // ===== 3. LOOP 迭代：逐一掃過每個小立方體 =====
        for (int i = 0; i < cellCount; i++)
        {
            for (int j = 0; j < cellCount; j++)
            {
                for (int k = 0; k < cellCount; k++)
                {
                    Point3d[] cornerPositions = new Point3d[8];
                    double[] cornerValues = new double[8];
                    for (int c = 0; c < 8; c++)
                    {
                        int cx = i + CornerOffsets[c, 0];
                        int cy = j + CornerOffsets[c, 1];
                        int cz = k + CornerOffsets[c, 2];
                        cornerPositions[c] = new Point3d(cx * cellSize, cy * cellSize, cz * cellSize);
                        cornerValues[c] = values[cx, cy, cz];
                    }

                    for (int t = 0; t < 6; t++)                          // 切 6 個共用主對角線 0–6 的四面體
                    {
                        Point3d[] tetraPositions = new Point3d[4];
                        double[] tetraValues = new double[4];
                        for (int v = 0; v < 4; v++)
                        {
                            int cornerIndex = TetrahedraCorners[t, v];
                            tetraPositions[v] = cornerPositions[cornerIndex];
                            tetraValues[v] = cornerValues[cornerIndex];
                        }
                        AddTetrahedronTriangles(tetraPositions, tetraValues, isoValue, triangleVertices);
                    }
                }
            }
        }

        // ===== 4. OUTPUT 輸出 =====
        Mesh resultMesh = BuildMesh(triangleVertices);
        int faceCount = resultMesh.Faces.Count;

        if (faceCount == 0)
        {
            mesh = null;                                                  // 曲面根本沒切到立方體，輸出空 Mesh 只會讓人以為程式壞了
            Print("isoValue 超出公式範圍（Gyroid 約 ±1.5、Schwarz P 約 ±3），曲面不在立方體內");
        }
        else
        {
            if (clampedToMax)
                Print(string.Format("格數 {0}³，三角形 {1} 個（已碰到解析度上限）", cellCount, faceCount));
            else
                Print(string.Format("格數 {0}³，三角形 {1} 個", cellCount, faceCount));
            if (cellCount < 6 * periods)
                Print("每個週期不到 6 格，曲面可能破洞，請提高 cellCount");
            mesh = resultMesh;
        }
        triangleCount = faceCount;
    }

    // ----- Fields 欄位 -----
    const int DefaultCellCount = 20;
    const int MinCellCount = 2;
    const int MaxCellCount = 60;                                        // 60 已約 22.7 萬格點（61³），避免再往上讓計算暴增
    const double DefaultSize = 10.0;
    const double DefaultPeriods = 2.0;
    const double MinValueDifference = 1e-9;                             // 邊兩端數值幾乎相等時避免除以 0
    const double MinTriangleSize = 1e-12;                               // 交點擠在同一角點時的零面積三角形沒有方向，丟掉

    // CornerOffsets：立方體 8 角相對 (i, j, k) 的位移（0＝該軸取格子起點，1＝取終點）
    static readonly int[,] CornerOffsets = new int[,]
    {
        { 0, 0, 0 }, { 1, 0, 0 }, { 1, 1, 0 }, { 0, 1, 0 },
        { 0, 0, 1 }, { 1, 0, 1 }, { 1, 1, 1 }, { 0, 1, 1 },
    };

    // TetrahedraCorners：立方體切成 6 個四面體，每個都包含主對角線的兩端角 0 與 6
    static readonly int[,] TetrahedraCorners = new int[,]
    {
        { 0, 6, 1, 2 },
        { 0, 6, 2, 3 },
        { 0, 6, 3, 7 },
        { 0, 6, 7, 4 },
        { 0, 6, 4, 5 },
        { 0, 6, 5, 1 },
    };

    // ----- RULE 規則：TPMS 公式與四面體切三角形 -----
    // SurfaceFormula：Gyroid 或 Schwarz P 公式，算出來等於 isoValue 的地方就是曲面
    double SurfaceFormula(int surfaceType, double x, double y, double z)
    {
        if (surfaceType == 1)
        {
            return Math.Cos(x) + Math.Cos(y) + Math.Cos(z);                       // Schwarz P：三軸各自獨立，交點呈十字管狀
        }
        return Math.Sin(x) * Math.Cos(y) + Math.Sin(y) * Math.Cos(z) + Math.Sin(z) * Math.Cos(x);  // Gyroid：三項互相耦合，呈螺旋迷宮狀
    }

    // AddTetrahedronTriangles：看四個角有幾個在 isoValue 內側（f < isoValue），畫 0～2 個三角形
    void AddTetrahedronTriangles(Point3d[] corners, double[] values, double isoValue, List<Point3d> triangleVertices)
    {
        var insideIndices = new List<int>();
        var outsideIndices = new List<int>();
        for (int c = 0; c < 4; c++)
        {
            if (values[c] < isoValue) insideIndices.Add(c); else outsideIndices.Add(c);
        }
        if (insideIndices.Count == 0 || insideIndices.Count == 4) return;   // 四角同側，這個四面體沒有交到曲面

        if (insideIndices.Count == 1 || insideIndices.Count == 3)
        {
            // 少數側只有一個角（孤角）：孤角到其餘三角各連一條邊，內插出三點 → 一個三角形
            List<int> loneSide = insideIndices.Count == 1 ? insideIndices : outsideIndices;
            List<int> otherSide = insideIndices.Count == 1 ? outsideIndices : insideIndices;
            int lone = loneSide[0];
            Point3d pointA = PointOnEdge(corners[lone], values[lone], corners[otherSide[0]], values[otherSide[0]], isoValue);
            Point3d pointB = PointOnEdge(corners[lone], values[lone], corners[otherSide[1]], values[otherSide[1]], isoValue);
            Point3d pointC = PointOnEdge(corners[lone], values[lone], corners[otherSide[2]], values[otherSide[2]], isoValue);
            AddTriangle(pointA, pointB, pointC, corners, insideIndices, outsideIndices, triangleVertices);
        }
        else
        {
            // 2 內 2 外：內外各兩角互相連線，4 個交點圍成四邊形，切對角成 2 個三角形
            int in0 = insideIndices[0], in1 = insideIndices[1];
            int out0 = outsideIndices[0], out1 = outsideIndices[1];
            Point3d p00 = PointOnEdge(corners[in0], values[in0], corners[out0], values[out0], isoValue);
            Point3d p01 = PointOnEdge(corners[in0], values[in0], corners[out1], values[out1], isoValue);
            Point3d p10 = PointOnEdge(corners[in1], values[in1], corners[out0], values[out0], isoValue);
            Point3d p11 = PointOnEdge(corners[in1], values[in1], corners[out1], values[out1], isoValue);
            AddTriangle(p00, p01, p11, corners, insideIndices, outsideIndices, triangleVertices);
            AddTriangle(p00, p11, p10, corners, insideIndices, outsideIndices, triangleVertices);
        }
    }

    // ----- Helpers 工具 -----
    // PointOnEdge：邊上數值剛好等於 isoValue 的位置，線性內插求
    Point3d PointOnEdge(Point3d fromPoint, double fromValue, Point3d toPoint, double toValue, double isoValue)
    {
        if (fromValue >= isoValue)                             // 統一方向：永遠由內側角（f < isoValue）算到外側角
        {
            Point3d swapPoint = fromPoint; fromPoint = toPoint; toPoint = swapPoint;
            double swapValue = fromValue; fromValue = toValue; toValue = swapValue;
        }
        double denominator = toValue - fromValue;
        double ratio = (Math.Abs(denominator) < MinValueDifference) ? 0.5 : (isoValue - fromValue) / denominator;
        ratio = Math.Max(0, Math.Min(1, ratio));               // 防呆：數值誤差時夾在邊的兩端之間
        return fromPoint + (toPoint - fromPoint) * ratio;
    }

    // AveragePoint：幾個角的平均位置，用來取內側或外側的代表點
    Point3d AveragePoint(List<int> indices, Point3d[] corners)
    {
        Point3d sum = Point3d.Origin;
        for (int i = 0; i < indices.Count; i++) sum += corners[indices[i]];
        return sum / indices.Count;
    }

    // AddTriangle：把三角形加進清單，法線方向統一朝內側指向外側（f 值變大的方向）
    void AddTriangle(Point3d a, Point3d b, Point3d c, Point3d[] corners, List<int> insideIndices, List<int> outsideIndices, List<Point3d> triangleVertices)
    {
        Point3d insideCenter = AveragePoint(insideIndices, corners);
        Point3d outsideCenter = AveragePoint(outsideIndices, corners);
        Vector3d outwardDirection = outsideCenter - insideCenter;   // 內側指向外側，作為法線該朝的方向
        Vector3d normal = Vector3d.CrossProduct(b - a, c - a);
        if (normal.Length < MinTriangleSize) return;                // 零面積三角形（交點擠在同一角點）沒有方向，丟掉
        if (normal * outwardDirection < 0)                          // 法線背對外側 → 交換兩點翻面
        {
            triangleVertices.Add(a);
            triangleVertices.Add(c);
            triangleVertices.Add(b);
        }
        else
        {
            triangleVertices.Add(a);
            triangleVertices.Add(b);
            triangleVertices.Add(c);
        }
    }

    // BuildMesh：三角形頂點每三個一組組成 Mesh，合併重複頂點並算頂點法線
    Mesh BuildMesh(List<Point3d> triangleVertices)
    {
        var resultMesh = new Mesh();
        for (int i = 0; i + 2 < triangleVertices.Count; i += 3)
        {
            int baseIndex = resultMesh.Vertices.Count;
            resultMesh.Vertices.Add(triangleVertices[i]);
            resultMesh.Vertices.Add(triangleVertices[i + 1]);
            resultMesh.Vertices.Add(triangleVertices[i + 2]);
            resultMesh.Faces.AddFace(baseIndex, baseIndex + 1, baseIndex + 2);
        }
        resultMesh.Vertices.CombineIdentical(true, true);     // 合併重複頂點，讓相鄰四面體的三角形接合成連續曲面
        resultMesh.Faces.CullDegenerateFaces();                // 保險：清掉合併後仍殘留的退化（零面積）面
        resultMesh.Normals.ComputeNormals();
        resultMesh.Compact();
        return resultMesh;
    }
}
