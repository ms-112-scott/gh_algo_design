// Grasshopper Script Instance
// ==================================================================
// B04 Phyllotaxis｜葉序
// 家族：B 生長　邏輯：直接公式　難度：1
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   count     int     Item   點的數量                       例：500、沒接時程式也用這個值
//   spacing   double  Item   整體縮放（第 n 點離中心 spacing × √n）  例：1.0
//   angle     double  Item   每個點多轉幾度                 例：137.508（黃金角；0 視為沒接，改用黃金角）
// 輸出
//   out                      Print 的文字（元件預設就有，不要刪）
//   points                   所有點
//   circles                  由內到外漸大的圓
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 給每個點一個編號 number = 1…count。
//   2. 角度 = number × angle（預設黃金角 137.508°），轉成弧度。
//   3. 半徑 = spacing × √number；開根號讓每一圈的面積相同，點的密度因此均勻（Vogel 1979 的 Fermat 螺旋）。
//   4. 用極座標 (cos, sin) × 半徑得到 Point3d，並依編號由內到外放大圓的半徑作為視覺輸出。
// ------------------------------------------------------------------
// 你應該看到：向日葵狀、由內到外漸大的圓點陣，外圈可數出 Fibonacci 條左右螺旋
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

    private void RunScript(int count, double spacing, double angle, ref object points, ref object circles)
    {
        // ===== 0. 防呆 =====
        if (count <= 0) count = DefaultCount;                   // 沒接 count → 用檔頭預設值 500
        bool hitLimit = count > MaxCount;
        count = Math.Min(count, MaxCount);                      // 上限避免點數失控、拖慢畫面
        if (spacing <= 0) spacing = 1.0;
        if (angle == 0) angle = GoldenAngle;                    // 沒接 angle → 用黃金角

        // ===== 1. DATA 資料 =====
        var allPoints = new List<Point3d>();
        var allCircles = new List<Circle>();
        double angleRadians = RhinoMath.ToRadians(angle);

        // ===== 4. OUTPUT 輸出 =====
        for (int number = 1; number <= count; number++)
        {
            Point3d point = PointAt(number, spacing, angleRadians);
            double radius = spacing * (0.1 + 0.4 * number / count);   // 越外圈越大：0.1 → 0.5 倍 spacing
            allPoints.Add(point);
            allCircles.Add(new Circle(point, radius));
        }

        points = allPoints;
        circles = allCircles;
        string limitNote = hitLimit ? "（已達上限，只畫 20000 個點）" : "";
        Print(string.Format("點數 {0}{1}，角度 {2:0.###}°", count, limitNote, angle));
    }

    // ----- Fields 欄位 -----
    const double GoldenAngle = 137.508;                         // 360 × (1 − 1/黃金比例)
    const int DefaultCount = 500;                               // count 沒接時的預設值（檔頭「例」）
    const int MaxCount = 20000;                                 // 點數上限：兩萬個點＋圓仍能在 1 秒內算完與預覽

    // ----- RULE 規則：編號 → 位置 -----
    Point3d PointAt(int number, double spacing, double angleRadians)
    {
        double turn = number * angleRadians;
        double distance = spacing * Math.Sqrt(number);          // √number → 每一圈面積相同，密度均勻
        return new Point3d(Math.Cos(turn) * distance, Math.Sin(turn) * distance, 0);
    }
}
