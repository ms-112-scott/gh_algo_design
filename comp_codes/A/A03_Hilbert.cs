// Grasshopper Script Instance
// ==================================================================
// A03 Hilbert Curve｜Hilbert 曲線
// 家族：A 規則與語法　邏輯：改寫／遞迴　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   order   int     Item   階數（正方形切成幾層 2×2）    例：4
//   size    double  Item   正方形邊長                    例：100.0
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   curve                        走訪順序連成的一筆連續線（Polyline）
//   pointCount                   格子中心點數量（int，= 4^order）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 整個正方形用角點 corner 加兩條邊向量 edgeA、edgeB 表示
//   2. 遞迴 VisitSquare 把正方形切成四個小格，依 ㄇ 字順序走過
//   3. 第 1 格把兩邊向量對調（翻轉），第 4 格反向對調，四段頭尾才接得上
//   4. 切到最小格（levelsLeft = 0）就記下格子中心，最後把所有中心串成一條線
// ------------------------------------------------------------------
// 你應該看到：一條不交叉、填滿整個正方形的連續曲折線（order = 4 時 256 個點、255 段，相鄰編號的點在空間上也相鄰）
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
        int order, double size,
        ref object curve, ref object pointCount)
    {
        // ===== 0. 防呆 =====
        if (size == 0) size = 100.0;                              // 沒接 size → 用檔頭預設邊長
        else if (size < 0) { Print("size 必須大於 0"); return; }   // 負值不合理，提醒並結束
        bool hitLimit = order > MaxOrder;                         // 先記下是否碰到上限，供摘要提醒
        order = Math.Min(order <= 0 ? 4 : order, MaxOrder);       // 沒接或非正數 → 用檔頭預設 4 階；超過上限就夾住

        // ===== 1. DATA 資料 =====
        var centers = new List<Point3d>();                      // 依走訪順序收集的格子中心

        // ===== 2. INIT 初始 =====
        Point3d startCorner = Point3d.Origin;                    // 正方形左下角
        Vector3d edgeA = new Vector3d(0, size, 0);               // 第一條邊向量（先往上，沿 Y）
        Vector3d edgeB = new Vector3d(size, 0, 0);               // 第二條邊向量（再往右，沿 X）

        // ===== 3. LOOP 迭代：遞迴切格 =====
        VisitSquare(startCorner, edgeA, edgeB, order, centers);

        // ===== 4. OUTPUT 輸出 =====
        var polyline = new Polyline(centers);                    // 依走訪順序連成一筆線
        Print("Hilbert 曲線：order={0}，共 {1} 個格子中心{2}", order, centers.Count,
            hitLimit ? "（已達上限 8 階＝65536 點）" : "");
        curve = polyline;
        pointCount = centers.Count;
    }

    // ----- Fields 欄位 -----
    const int MaxOrder = 8;                                       // 8 階 = 4^8 = 65536 點，仍在 1 秒內算完

    // ----- RULE 規則：正方形切 2×2，依 ㄇ 字順序走，第 1、4 格翻轉方向 -----
    void VisitSquare(Point3d corner, Vector3d edgeA, Vector3d edgeB, int levelsLeft, List<Point3d> centers)
    {
        if (levelsLeft == 0)
        {
            // 切到最小格：記下這一格的中心（角點 + 兩邊向量各一半）
            Point3d center = corner + (edgeA + edgeB) * 0.5;
            centers.Add(center);
            return;
        }

        Vector3d halfA = edgeA * 0.5;
        Vector3d halfB = edgeB * 0.5;

        // 第 1 格：角點不變，兩邊向量對調（翻轉），讓這一格先往「垂直」方向走
        VisitSquare(corner, halfB, halfA, levelsLeft - 1, centers);
        // 第 2 格：方向不變，沿 edgeA 移半格
        VisitSquare(corner + halfA, halfA, halfB, levelsLeft - 1, centers);
        // 第 3 格：沿 edgeA、edgeB 各移半邊到對角那一格，方向不變
        VisitSquare(corner + halfA + halfB, halfA, halfB, levelsLeft - 1, centers);
        // 第 4 格：角點移到對角，兩邊向量對調且反向，讓走法跟第 1 格鏡射，頭尾才接得上
        VisitSquare(corner + halfA + edgeB, -halfB, -halfA, levelsLeft - 1, centers);
    }
}
