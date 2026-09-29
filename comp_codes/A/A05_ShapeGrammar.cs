// Grasshopper Script Instance
// ==================================================================
// A05 Shape Grammar｜形狀文法
// 家族：A 規則與語法　邏輯：改寫／遞迴　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   generations   int     Item   套用幾代規則                  例：6
//   size          double  Item   起始正方形邊長                例：20.0
//   angle         double  Item   分叉角度（度，1～89）         例：45.0
//   minSize       double  Item   終止邊長：小於它就變葉子 C    例：1.0
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   outlines                     每個形狀的封閉 Polyline
//   labels                       每個形狀的標籤字串（A／B／C）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 起始只有一個標籤為 A 的正方形（左下角在原點、底邊沿 X 軸、邊長 size）。
//   2. 每一代把清單裡「所有」形狀同時丟進 ApplyRules：B、C 原樣保留（不再改寫）。
//   3. A 太小（邊長 < minSize）就把標籤改成 C（當作葉子，不再分叉）。
//   4. A 夠大就變成 B，並在它的頂邊架出兩個新的 A：邊長分別是 size·cos(angle)、size·sin(angle)，
//      方向分別由頂邊方向轉 angle 與 angle−90 度，兩者與頂邊剛好圍成一個直角三角形。
//   5. 新清單整批取代舊清單（雙緩衝，不是就地修改）；清單裡已經沒有 A 就提早停止。
// ------------------------------------------------------------------
// 你應該看到：用預設值（角度 45 度）會長出一棵左右對稱、逐代變小的畢氏樹。
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
        int generations, double size, double angle, double minSize,
        ref object outlines, ref object labels)
    {
        // ===== 0. 防呆 =====
        generations = Math.Min(generations <= 0 ? 6 : generations, MaxGenerations);   // 沒接 → 用例的 6 代
        if (size == 0) size = 20.0;                                        // 沒接 → 用例的邊長
        else if (size < 0) { Print("size 必須大於 0"); return; }
        if (angle <= 0) angle = 45.0;                                      // 沒接 → 用例的 45 度
        angle = Math.Max(1, Math.Min(89, angle));                          // 角度夾在 1～89 度，避免退化
        if (minSize <= 0) minSize = 1.0;                                   // 沒接（或太小）→ 用例的 1.0

        // ===== 1. DATA 資料 =====
        var shapes = new List<LabeledSquare>();

        // ===== 2. INIT 初始 =====
        var startSquare = new LabeledSquare('A', Point3d.Origin, Vector3d.XAxis, size);
        shapes.Add(startSquare);

        // ===== 3. LOOP 迭代：每代整批改寫，沒有 A 就提早停 =====
        int actualGenerations = 0;
        string stopReason = "";
        for (int generation = 0; generation < generations; generation++)
        {
            if (!shapes.Any(shape => shape.Label == 'A'))                  // 提早停止：全都定住了，沒有 A 可以再分叉
            {
                stopReason = "，沒有 A 提早停止";
                break;
            }
            int aCount = shapes.Count(shape => shape.Label == 'A');        // 套下一代前先估算，形狀數會失控就先停
            if (shapes.Count + 2 * aCount > MaxShapeCount)
            {
                stopReason = string.Format("，形狀數即將超過上限 {0}，提前停止", MaxShapeCount);
                break;
            }
            shapes = ApplyRules(shapes, angle, minSize);
            actualGenerations++;
        }

        // ===== 4. OUTPUT 輸出 =====
        var outlineList = new List<Polyline>();
        var labelList = new List<string>();
        foreach (LabeledSquare shape in shapes)
        {
            outlineList.Add(shape.ToOutline());
            labelList.Add(shape.Label.ToString());
        }
        int countA = shapes.Count(shape => shape.Label == 'A');
        int countB = shapes.Count(shape => shape.Label == 'B');
        int countC = shapes.Count(shape => shape.Label == 'C');
        Print("形狀 {0} 個（A {1}／B {2}／C {3}），跑了 {4}/{5} 代{6}",
            shapes.Count, countA, countB, countC, actualGenerations, generations, stopReason);
        outlines = outlineList;
        labels = labelList;
    }

    // ----- Fields 欄位 -----
    const int MaxGenerations = 14;      // 世代上限：14 代時 A 有 2^14 個，總形狀數最多 2^15－1（約 3.3 萬）
    const int MaxShapeCount = 20000;    // 形狀數保底上限，避免記憶體暴衝（套下一代前先估算，不會真的衝過去）

    // ----- RULE 規則：B、C 不變；A 太小 → C；A 夠大 → B ＋ 兩個轉 angle 的小 A -----
    List<LabeledSquare> ApplyRules(List<LabeledSquare> shapes, double angle, double minSize)
    {
        var nextShapes = new List<LabeledSquare>();                        // 雙緩衝：新清單取代舊清單
        foreach (LabeledSquare shape in shapes)
        {
            if (shape.Label != 'A')
            {
                nextShapes.Add(shape);                                     // B、C 原樣保留，不再改寫
                continue;
            }
            if (shape.Size < minSize)
            {
                nextShapes.Add(new LabeledSquare('C', shape.Corner, shape.Direction, shape.Size));   // 太小 → 葉子 C
                continue;
            }

            // --- A 夠大：本身定住變 B，頂邊架兩個新 A ---
            nextShapes.Add(new LabeledSquare('B', shape.Corner, shape.Direction, shape.Size));

            Vector3d normal = TurnVector(shape.Direction, 90);
            Point3d topLeft = shape.Corner + normal * shape.Size;                   // 頂邊左端（正方形左上角）

            double radians = RhinoMath.ToRadians(angle);
            double firstSize = shape.Size * Math.Cos(radians);                      // 兩個新 A 邊長，圍成直角三角形
            double secondSize = shape.Size * Math.Sin(radians);

            Vector3d firstDirection = TurnVector(shape.Direction, angle);
            Vector3d secondDirection = TurnVector(shape.Direction, angle - 90);

            Point3d apex = topLeft + firstDirection * firstSize;                    // 兩個新 A 共用的直角頂點

            nextShapes.Add(new LabeledSquare('A', topLeft, firstDirection, firstSize));
            nextShapes.Add(new LabeledSquare('A', apex, secondDirection, secondSize));
        }
        return nextShapes;
    }

    // ----- Helpers 工具 -----
    // 向量繞 Z 軸轉 degrees 度（正方形都畫在 XY 平面上，用 2D 旋轉矩陣就夠）
    Vector3d TurnVector(Vector3d direction, double degrees)
    {
        double radians = RhinoMath.ToRadians(degrees);
        double cosine = Math.Cos(radians);
        double sine = Math.Sin(radians);
        return new Vector3d(
            direction.X * cosine - direction.Y * sine,
            direction.X * sine + direction.Y * cosine,
            0);
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================
// 帶標籤的正方形：標籤（A 可再分叉／B 已定住／C 葉子）、左下角、底邊方向（單位向量）、邊長
class LabeledSquare
{
    public char Label;
    public Point3d Corner;
    public Vector3d Direction;
    public double Size;

    public LabeledSquare(char label, Point3d corner, Vector3d direction, double size)
    {
        Label = label;
        Corner = corner;
        Direction = direction;
        Direction.Unitize();
        Size = size;
    }

    public Polyline ToOutline()
    {
        Vector3d normal = new Vector3d(-Direction.Y, Direction.X, 0);      // 底邊方向轉 90 度 → 側邊方向
        var outline = new Polyline();
        outline.Add(Corner);
        outline.Add(Corner + Direction * Size);
        outline.Add(Corner + Direction * Size + normal * Size);
        outline.Add(Corner + normal * Size);
        outline.Add(Corner);                                              // 回到起點 → 封閉
        return outline;
    }
}
