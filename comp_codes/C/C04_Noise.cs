// Grasshopper Script Instance
// ==================================================================
// C04 Perlin Noise Terrain｜Perlin Noise 雜訊地形
// 家族：C 場與擴散　邏輯：直接公式　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   width       int     Item   格線寬（X 方向格數）          例：20
//   depth       int     Item   格線深（Y 方向格數）          例：20
//   cellSize    double  Item   格點間距                      例：2.0
//   scale       double  Item   起伏水平尺度；越大越平緩       例：10.0
//   height      double  Item   垂直放大倍率                  例：8.0
//   octaves     int     Item   疊層數（1–8）                 例：4
//   seed        int     Item   隨機種子                      例：1
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   terrainPoints                所有格點（含高度）
//   terrainMesh                  地形 Mesh
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. PerlinNoise 建構時用 seed 把 0–255 洗牌成查表，再重複兩次成 512 長，同 seed 永遠得到同一片地形。
//   2. ValueAt(x,y)：找出點所在的整數格，四個角各查表決定一個隨機斜坡方向，算角到點的內積，
//      再以 6t⁵−15t⁴+10t³ 平滑混合四角，得到約 -1～1 的單頻雜訊。
//   3. LayeredNoise 疊層：每多一層細節 ×2、強度 ×0.5，共疊 octaves 層後除以總強度，結果仍落在約 -1～1。
//   4. 每個格點的取樣座標除以 scale 並加 0.37 偏移（避開整數點雜訊恆為 0），疊層雜訊 × height 就是高度。
//   5. BuildGridMesh 把相鄰 4 個格點組成一個四邊形面，算好法線後輸出地形 Mesh。
// ------------------------------------------------------------------
// 你應該看到：預設值下一片 20×20 格、起伏自然的丘陵地形，帶粗略山脊也帶細碎起伏
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
        int width, int depth, double cellSize, double scale, double height, int octaves, int seed,
        ref object terrainPoints, ref object terrainMesh)
    {
        // ===== 0. 防呆 =====
        if (width <= 0) width = 20;                                   // 沒接 → 預設 20 格寬
        if (depth <= 0) depth = 20;
        if (cellSize <= 0) cellSize = 2.0;
        if (scale <= 0) scale = 10.0;
        if (height == 0) height = 8.0;
        if (octaves == 0) octaves = 4;
        octaves = Math.Max(MinOctaves, Math.Min(octaves, MaxOctaves));  // 疊層數限 1～8
        if (seed == 0) seed = 1;
        width = Math.Min(width, MaxGridSize);                          // 格數上限，避免格點暴增拖慢畫面
        depth = Math.Min(depth, MaxGridSize);

        // ===== 1. DATA 資料 =====
        var noise = new PerlinNoise(seed);
        var gridPoints = new Point3d[depth + 1, width + 1];

        // ===== 2. INIT 初始：每一點直接用公式算高度 =====
        for (int row = 0; row <= depth; row++)
        {
            for (int col = 0; col <= width; col++)
            {
                double sampleX = col / scale + SampleOffset;
                double sampleY = row / scale + SampleOffset;
                double elevation = LayeredNoise(noise, sampleX, sampleY, octaves) * height;
                gridPoints[row, col] = new Point3d(col * cellSize, row * cellSize, elevation);
            }
        }

        // ===== 4. OUTPUT 輸出 =====
        var allPoints = new List<Point3d>();
        foreach (Point3d point in gridPoints) allPoints.Add(point);    // 逐列展開成一維清單

        Mesh mesh = BuildGridMesh(gridPoints, width, depth);

        Print("地形 {0} × {1} 格點，疊 {2} 層雜訊", width + 1, depth + 1, octaves);
        terrainPoints = allPoints;
        terrainMesh = mesh;
    }

    // ----- Fields 欄位 -----
    const double SampleOffset = 0.37;       // 整數座標的雜訊值恆為 0 → 加偏移避開
    const int MinOctaves = 1;
    const int MaxOctaves = 8;               // 疊太多層對視覺沒幫助，還拖慢速度
    const int MaxGridSize = 300;            // 格數上限，避免格點暴增拖慢畫面

    // ----- RULE 規則：座標 → 疊層雜訊高度（約 -1～1） -----
    double LayeredNoise(PerlinNoise noise, double x, double y, int octaves)
    {
        double total = 0;
        double amplitude = 1;
        double frequency = 1;
        double amplitudeSum = 0;
        for (int layer = 0; layer < octaves; layer++)
        {
            total += noise.ValueAt(x * frequency, y * frequency) * amplitude;
            amplitudeSum += amplitude;
            frequency *= 2;                 // 每層細節加倍 → 出現山脊與碎石感
            amplitude *= 0.5;                // 每層比重減半 → 細節不會蓋過大輪廓
        }
        return total / amplitudeSum;         // 除以總強度 → 結果拉回約 -1～1
    }

    // ----- Helpers 工具 -----
    Mesh BuildGridMesh(Point3d[,] gridPoints, int width, int depth)
    {
        var mesh = new Mesh();
        for (int row = 0; row <= depth; row++)
        {
            for (int col = 0; col <= width; col++)
            {
                mesh.Vertices.Add(gridPoints[row, col]);
            }
        }

        for (int row = 0; row < depth; row++)
        {
            for (int col = 0; col < width; col++)
            {
                int topLeft = row * (width + 1) + col;
                int topRight = topLeft + 1;
                int bottomLeft = topLeft + (width + 1);
                int bottomRight = bottomLeft + 1;
                mesh.Faces.AddFace(topLeft, topRight, bottomRight, bottomLeft);   // 四點組一個四邊形面
            }
        }
        mesh.Normals.ComputeNormals();
        mesh.Compact();
        return mesh;
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================
// Perlin 2D 雜訊：查表決定四角斜坡方向，再平滑混合成連續、可重現的隨機
class PerlinNoise
{
    const int TableSize = 256;
    int[] permutation;                       // 512 長：前 256 是洗牌後的 0–255，後 256 重複一次

    public PerlinNoise(int seed)
    {
        var random = new Random(seed);
        int[] table = new int[TableSize];
        for (int i = 0; i < TableSize; i++) table[i] = i;
        for (int i = TableSize - 1; i > 0; i--)     // Fisher–Yates 洗牌：同 seed 永遠洗出同一份表
        {
            int j = random.Next(i + 1);
            int temp = table[i];
            table[i] = table[j];
            table[j] = temp;
        }
        permutation = new int[TableSize * 2];
        for (int i = 0; i < TableSize * 2; i++) permutation[i] = table[i & (TableSize - 1)];
    }

    // 單一頻率的雜訊值，範圍約 -1～1
    public double ValueAt(double x, double y)
    {
        int cellX = (int)Math.Floor(x) & (TableSize - 1);
        int cellY = (int)Math.Floor(y) & (TableSize - 1);
        double localX = x - Math.Floor(x);
        double localY = y - Math.Floor(y);

        double u = Fade(localX);
        double v = Fade(localY);

        int a = permutation[cellX] + cellY;
        int b = permutation[cellX + 1] + cellY;

        double dotTopLeft = Gradient(permutation[a], localX, localY);
        double dotTopRight = Gradient(permutation[b], localX - 1, localY);
        double dotBottomLeft = Gradient(permutation[a + 1], localX, localY - 1);
        double dotBottomRight = Gradient(permutation[b + 1], localX - 1, localY - 1);

        double top = Blend(dotTopLeft, dotTopRight, u);
        double bottom = Blend(dotBottomLeft, dotBottomRight, u);
        return Blend(top, bottom, v);
    }

    // 平滑曲線：兩端斜率為 0，混合起來不會有硬折角
    static double Fade(double t)
    {
        return t * t * t * (t * (t * 6 - 15) + 10);     // 6t⁵−15t⁴+10t³
    }

    static double Blend(double a, double b, double t)
    {
        return a + t * (b - a);
    }

    // 依雜湊值選 8 個方向之一的斜坡向量，回傳它與 (dx,dy) 的內積
    static double Gradient(int hash, double dx, double dy)
    {
        switch (hash & 7)
        {
            case 0: return dx + dy;
            case 1: return dx - dy;
            case 2: return -dx + dy;
            case 3: return -dx - dy;
            case 4: return dx;
            case 5: return -dx;
            case 6: return dy;
            default: return -dy;
        }
    }
}
