// Grasshopper Script Instance
// ==================================================================
// C05 Marching Squares｜Marching Squares 等值線
// 家族：C 場與擴散　邏輯：幾何轉換／直接公式　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   centers      Point3d  List   metaball 中心點                 例：三顆 (0,0,0)(8,0,0)(4,7,0)
//   radii        double   List   各中心的影響半徑（只給一個值時，所有中心都用這個半徑） 例：5.0
//   cellSize     double   Item   格子邊長，越小線越平滑           例：1.0
//   threshold    double   Item   等值線取在哪個場值               例：1.0
//   margin       double   Item   邊界外多留的範圍                 例：5.0
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   contourLines                 等值線線段（Line）
//   gridPoints                   取樣格點（Point3d）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 依中心與半徑決定取樣範圍，往外留 margin，切成 cellSize 大小的方格網
//   2. 每個格點用 metaball 公式 Σ(半徑²÷距離²) 算出場值
//   3. 每一格檢查 4 個角是否 ≥ threshold，組成 0–15 的情況編號
//   4. 情況 5、10 是對角鞍點，用 4 角平均值決定要接哪一組對角
//   5. 查表得知要連哪兩條邊，在邊上線性內插出端點，輸出 Line
// ------------------------------------------------------------------
// 你應該看到：三顆金屬球場融合成一圈圓角三角形的封閉等值線，格點鋪滿整個取樣範圍
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
        List<Point3d> centers, List<double> radii, double cellSize, double threshold, double margin,
        ref object contourLines, ref object gridPoints)
    {
        // ===== 0. 防呆 =====
        if (centers == null || centers.Count == 0)                    // 沒接 centers → 用預設的三顆 metaball
        {
            centers = new List<Point3d> { new Point3d(0, 0, 0), new Point3d(8, 0, 0), new Point3d(4, 7, 0) };
        }
        if (centers.Count > MaxCenters)                                // 中心數太多時「格點數×中心數」會爆炸，只取前 MaxCenters 個
        {
            centers = centers.GetRange(0, MaxCenters);
            Print("中心點超過上限 {0} 個，只使用前 {0} 個", MaxCenters);
        }
        if (radii == null) radii = new List<double>();
        var pointRadii = new List<double>();                          // 每個中心配一個半徑：接的值不夠時沿用清單最後一個（GH 的 longest list 慣例）
        for (int i = 0; i < centers.Count; i++)
        {
            double radius = DefaultRadius;
            if (radii.Count > 0)
            {
                double candidate = radii[Math.Min(i, radii.Count - 1)];
                if (candidate > 0) radius = candidate;
            }
            pointRadii.Add(radius);
        }
        if (cellSize <= 0) cellSize = DefaultCellSize;
        if (threshold <= 0) threshold = DefaultThreshold;
        if (margin <= 0) margin = DefaultMargin;

        // ===== 1. DATA 資料：取樣範圍＝包住所有圓再往外留 margin =====
        double minX = double.MaxValue, maxX = double.MinValue;
        double minY = double.MaxValue, maxY = double.MinValue;
        for (int i = 0; i < centers.Count; i++)
        {
            minX = Math.Min(minX, centers[i].X - pointRadii[i]);
            maxX = Math.Max(maxX, centers[i].X + pointRadii[i]);
            minY = Math.Min(minY, centers[i].Y - pointRadii[i]);
            maxY = Math.Max(maxY, centers[i].Y + pointRadii[i]);
        }
        minX -= margin; maxX += margin;
        minY -= margin; maxY += margin;

        double rawColumns = Math.Ceiling((maxX - minX) / cellSize);    // 先在 double 裡算，避免 cellSize 極小時轉 int 溢位
        double rawRows = Math.Ceiling((maxY - minY) / cellSize);
        bool hitResolutionLimit = rawColumns > MaxGridResolution || rawRows > MaxGridResolution;
        int columns = (int)Math.Max(1, Math.Min(rawColumns, MaxGridResolution));
        int rows = (int)Math.Max(1, Math.Min(rawRows, MaxGridResolution));
        double stepX = (maxX - minX) / columns;                       // 被上限夾到時，改用夾過的欄列數反推實際格寬
        double stepY = (maxY - minY) / rows;

        // ===== 2. INIT 初始：每個格點的場值 =====
        var gridPositions = new Point3d[columns + 1, rows + 1];
        var gridValues = new double[columns + 1, rows + 1];
        for (int col = 0; col <= columns; col++)
        {
            for (int row = 0; row <= rows; row++)
            {
                Point3d position = new Point3d(minX + col * stepX, minY + row * stepY, 0);
                gridPositions[col, row] = position;
                gridValues[col, row] = FieldValue(position, centers, pointRadii);
            }
        }

        // ===== 3. LOOP 掃描：每一格看一次 =====
        var lines = new List<Line>();
        for (int col = 0; col < columns; col++)
        {
            for (int row = 0; row < rows; row++)
            {
                AddCellLines(col, row, gridPositions, gridValues, threshold, lines);
            }
        }

        // ===== 4. OUTPUT 輸出 =====
        var allPoints = new List<Point3d>();
        for (int col = 0; col <= columns; col++)
            for (int row = 0; row <= rows; row++)
                allPoints.Add(gridPositions[col, row]);

        if (hitResolutionLimit)
            Print("格點 {0}×{1}，等值線 {2} 段（已碰到格數上限，cellSize 被迫放大）", columns + 1, rows + 1, lines.Count);
        else
            Print("格點 {0}×{1}，等值線 {2} 段", columns + 1, rows + 1, lines.Count);
        contourLines = lines;
        gridPoints = allPoints;
    }

    // ----- Fields 欄位 -----
    const double DefaultRadius = 5.0;                  // centers 有接但 radii 沒接（或該項 ≤ 0）時的半徑
    const double DefaultCellSize = 1.0;
    const double DefaultThreshold = 1.0;
    const double DefaultMargin = 5.0;
    const int MaxGridResolution = 200;                 // 每邊最多幾格，避免 cellSize 太小時格點暴增當機
    const int MaxCenters = 500;                        // metaball 中心數上限：計算量＝格點數×中心數，接太多點會超過 1 秒
    const double MinDistanceSquared = 1e-6;            // 距離平方下限：格點剛好落在中心上時避免除以 0

    // EdgePairs：case 0–15（4 角 ≥ threshold 各記 1、2、4、8 相加）各要連哪些邊
    // 邊編號 0＝下 1＝右 2＝上 3＝左；鞍點 5、10 另外用 SaddleCase5Alternate／SaddleCase10Alternate 判斷
    static readonly int[][][] EdgePairs = new int[][][]
    {
        new int[][] { },                                   // 0：四角都在門檻外，這一格沒有線
        new int[][] { new int[] { 3, 0 } },                 // 1：只有左下角在內
        new int[][] { new int[] { 0, 1 } },                 // 2：只有右下角在內
        new int[][] { new int[] { 3, 1 } },                 // 3：下面兩角在內
        new int[][] { new int[] { 1, 2 } },                 // 4：只有右上角在內
        new int[][] { new int[] { 3, 0 }, new int[] { 1, 2 } }, // 5：對角鞍點（左下＋右上）
        new int[][] { new int[] { 0, 2 } },                 // 6：右邊兩角在內
        new int[][] { new int[] { 3, 2 } },                 // 7：只有左上角在外
        new int[][] { new int[] { 2, 3 } },                 // 8：只有左上角在內
        new int[][] { new int[] { 0, 2 } },                 // 9：左邊兩角在內
        new int[][] { new int[] { 0, 1 }, new int[] { 2, 3 } }, // 10：對角鞍點（右下＋左上）
        new int[][] { new int[] { 1, 2 } },                 // 11：只有右上角在外
        new int[][] { new int[] { 3, 1 } },                 // 12：上面兩角在內
        new int[][] { new int[] { 0, 1 } },                 // 13：只有右下角在外
        new int[][] { new int[] { 3, 0 } },                 // 14：只有左下角在外
        new int[][] { },                                   // 15：四角都在門檻內，這一格沒有線
    };
    static readonly int[][] SaddleCase5Alternate = new int[][] { new int[] { 0, 1 }, new int[] { 2, 3 } };
    static readonly int[][] SaddleCase10Alternate = new int[][] { new int[] { 3, 0 }, new int[] { 1, 2 } };

    // ----- RULE 規則：metaball 場值與逐格查表連線 -----
    // FieldValue：metaball 公式，各中心 半徑²÷距離² 加總
    double FieldValue(Point3d point, List<Point3d> centers, List<double> radii)
    {
        double value = 0;
        for (int i = 0; i < centers.Count; i++)
        {
            double distanceSquared = point.DistanceToSquared(centers[i]);
            if (distanceSquared < MinDistanceSquared) distanceSquared = MinDistanceSquared;
            value += (radii[i] * radii[i]) / distanceSquared;
        }
        return value;
    }

    // AddCellLines：四角在線內外組成情況編號，查表連線
    void AddCellLines(int col, int row, Point3d[,] positions, double[,] values, double threshold, List<Line> lines)
    {
        // 四個角：0＝左下 1＝右下 2＝右上 3＝左上
        Point3d[] cornerPositions = new Point3d[]
        {
            positions[col, row], positions[col + 1, row], positions[col + 1, row + 1], positions[col, row + 1]
        };
        double[] cornerValues = new double[]
        {
            values[col, row], values[col + 1, row], values[col + 1, row + 1], values[col, row + 1]
        };

        int caseIndex = 0;
        if (cornerValues[0] >= threshold) caseIndex += 1;
        if (cornerValues[1] >= threshold) caseIndex += 2;
        if (cornerValues[2] >= threshold) caseIndex += 4;
        if (cornerValues[3] >= threshold) caseIndex += 8;
        if (caseIndex == 0 || caseIndex == 15) return;         // 全在門檻內或全在門檻外 → 這一格沒有等值線

        int[][] pairs = EdgePairs[caseIndex];
        if (caseIndex == 5 || caseIndex == 10)                 // 鞍點：四角平均值決定連哪一組對角，避免等值線斷開或打叉
        {
            double average = (cornerValues[0] + cornerValues[1] + cornerValues[2] + cornerValues[3]) * 0.25;
            bool useAlternate = average >= threshold;
            pairs = caseIndex == 5
                ? (useAlternate ? SaddleCase5Alternate : EdgePairs[5])
                : (useAlternate ? SaddleCase10Alternate : EdgePairs[10]);
        }

        foreach (int[] pair in pairs)
        {
            Point3d start = EdgePoint(pair[0], cornerPositions, cornerValues, threshold);
            Point3d end = EdgePoint(pair[1], cornerPositions, cornerValues, threshold);
            lines.Add(new Line(start, end));
        }
    }

    // ----- Helpers 工具 -----
    // EdgePoint：邊 edgeIndex（0 下／1 右／2 上／3 左）上場值剛好等於 threshold 的位置，用線性內插求
    Point3d EdgePoint(int edgeIndex, Point3d[] cornerPositions, double[] cornerValues, double threshold)
    {
        int fromCorner, toCorner;
        switch (edgeIndex)
        {
            case 0: fromCorner = 0; toCorner = 1; break;       // 下邊：左下→右下
            case 1: fromCorner = 1; toCorner = 2; break;       // 右邊：右下→右上
            case 2: fromCorner = 3; toCorner = 2; break;       // 上邊：左上→右上
            default: fromCorner = 0; toCorner = 3; break;      // 左邊：左下→左上
        }

        double fromValue = cornerValues[fromCorner];
        double toValue = cornerValues[toCorner];
        double ratio = (toValue == fromValue) ? 0.5 : (threshold - fromValue) / (toValue - fromValue);
        ratio = Math.Max(0, Math.Min(1, ratio));               // 防呆：數值誤差時夾在邊的兩端之間
        return cornerPositions[fromCorner] + (cornerPositions[toCorner] - cornerPositions[fromCorner]) * ratio;
    }
}
