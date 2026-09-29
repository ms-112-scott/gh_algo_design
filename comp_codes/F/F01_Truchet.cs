// Grasshopper Script Instance
// ==================================================================
// F01 Truchet Tiles｜Truchet 磁磚
// 家族：F 圖樣與最佳化　邏輯：直接公式　難度：1
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   columns      int     Item   網格的欄數                    例：10
//   rows         int     Item   網格的列數                    例：10
//   tileSize     double  Item   每格邊長                      例：10.0
//   seed         int     Item   隨機種子                      例：1
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   arcs                         每格兩段四分之一圓弧（Arc）
//   tiles                        每格外框（Polyline）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 以 columns × rows 建立正方形網格，每格左下角 = (column × tileSize, row × tileSize)。
//   2. 每格用 Random(seed) 擲一次硬幣：決定這格是否要把圓弧的對角組合換邊（等於轉 90°）。
//   3. 不換邊：以「左下、右上」兩個對角為圓心各畫一段四分之一圓弧；換邊：改用「右下、左上」。
//   4. 半徑固定為半格邊長，弧的兩端點永遠落在格子邊的中點上。
//   5. 因為所有弧都停在邊中點，相鄰格的弧端點會對齊、首尾相接，於是局部的硬幣決定湧現出全域連續的蜿蜒曲線。
//   6. 每格同時記錄外框，方便對照弧線與格線的關係。
// ------------------------------------------------------------------
// 你應該看到：一片由圓弧拼接出的方格棋盤，弧線彼此連成好幾條蜿蜒的曲線與封閉圈，換 seed 就換一種走法
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

    private void RunScript(int columns, int rows, double tileSize, int seed, ref object arcs, ref object tiles)
    {
        // ===== 0. 防呆 =====
        if (columns < 1) columns = 10;                             // 沒接 columns → 預設 10 欄
        if (rows < 1) rows = 10;                                   // 沒接 rows → 預設 10 列
        if (tileSize <= 0) tileSize = 10.0;                        // 沒接 tileSize → 預設邊長 10
        columns = Math.Min(columns, MaxGridSize);                  // 上限：避免格數暴衝算太久
        rows = Math.Min(rows, MaxGridSize);

        // ===== 1. DATA 資料 =====
        var random = new Random(seed);
        var allArcs = new List<Arc>();
        var allTiles = new List<Polyline>();

        // ===== 4. OUTPUT 輸出 =====
        for (int row = 0; row < rows; row++)
        {
            for (int column = 0; column < columns; column++)
            {
                Point3d origin = new Point3d(column * tileSize, row * tileSize, 0);
                bool flipped = random.NextDouble() < 0.5;          // 擲硬幣：這格要不要換對角組合（＝轉 90°）
                allArcs.AddRange(TileArcs(origin, tileSize, flipped));
                allTiles.Add(TileOutline(origin, tileSize));
            }
        }

        arcs = allArcs;
        tiles = allTiles;
        Print(string.Format("{0} x {1} 格，共 {2} 段圓弧，seed = {3}", columns, rows, allArcs.Count, seed));
    }

    // ----- Fields 欄位 -----
    const int MaxGridSize = 80;                                    // 單邊最多 80 格，避免格數過多拖慢畫面

    // ----- RULE 規則：一格要畫的兩段圓弧 -----
    List<Arc> TileArcs(Point3d origin, double size, bool flipped)
    {
        double radius = size * 0.5;                                // 半徑固定＝半格邊長 → 弧一定停在邊中點
        Point3d bottomLeft = origin;
        Point3d bottomRight = origin + new Vector3d(size, 0, 0);
        Point3d topLeft = origin + new Vector3d(0, size, 0);
        Point3d topRight = origin + new Vector3d(size, size, 0);

        var tileArcs = new List<Arc>();
        if (!flipped)
        {
            // 左下＋右上：兩段弧分別把左下角、右上角「削圓」
            tileArcs.Add(QuarterArc(bottomLeft, Vector3d.XAxis, Vector3d.YAxis, radius));
            tileArcs.Add(QuarterArc(topRight, -Vector3d.XAxis, -Vector3d.YAxis, radius));
        }
        else
        {
            // 右下＋左上：等於把上面那組整個轉 90 度
            tileArcs.Add(QuarterArc(bottomRight, -Vector3d.XAxis, Vector3d.YAxis, radius));
            tileArcs.Add(QuarterArc(topLeft, -Vector3d.YAxis, Vector3d.XAxis, radius));
        }
        return tileArcs;
    }

    // ----- Helpers 工具 -----
    // 以角落為圓心，從 startDirection 轉 90 度到 endDirection 的四分之一圓弧
    Arc QuarterArc(Point3d corner, Vector3d startDirection, Vector3d endDirection, double radius)
    {
        Plane arcPlane = new Plane(corner, startDirection, endDirection);
        return new Arc(arcPlane, radius, Math.PI / 2.0);           // 平面的 X 軸＝弧起點方向，Y 軸＝弧終點方向
    }

    // 格子的四個角連成封閉外框，方便對照弧線位置
    Polyline TileOutline(Point3d origin, double size)
    {
        var corners = new List<Point3d>
        {
            origin,
            origin + new Vector3d(size, 0, 0),
            origin + new Vector3d(size, size, 0),
            origin + new Vector3d(0, size, 0),
            origin
        };
        return new Polyline(corners);
    }
}
