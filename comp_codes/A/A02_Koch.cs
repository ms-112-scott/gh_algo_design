// Grasshopper Script Instance
// ==================================================================
// A02 Koch Curve / Koch Snowflake｜Koch 曲線／雪花
// 家族：A 規則與語法　邏輯：改寫／遞迴　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   sides   int     Item   起始多邊形邊數（3=雪花，1–2=單條 Koch 曲線，上限 24）   例：3
//   size    double  Item   起始邊長                                      例：30.0
//   depth   int     Item   細分層數（最少 1，沒接或 0 都視為沒接）        例：4
// 輸出
//   out                    Print 的文字（元件預設就有，不要刪）
//   curve                  細分後的封閉／開放輪廓（Polyline）
//   pointCount             輪廓的點數
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 依 sides 建立起始正多邊形（或一條直線）的角點清單
//   2. 每條邊交給遞迴 SplitEdge：切成三等分，中段用旋轉 -60° 的向量推出尖點，得到四段
//   3. 四段各自再呼叫 SplitEdge、深度減 1；深度為 0 時只記起點，交給下一段收尾
//   4. 所有點依序串成 Polyline 輸出，點數 = 邊數 × 4^depth + 1
// ------------------------------------------------------------------
// 你應該看到：用預設值（sides=3、depth=4）時，一個三角形的三邊都長出細碎尖角，形成雪花狀輪廓
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

    private void RunScript(int sides, double size, int depth, ref object curve, ref object pointCount)
    {
        // ===== 0. 防呆 =====
        if (size <= 0) size = 30.0;                                // 沒接時比照檔頭例子，邊長 30

        int requestedSides = sides;                                // 記錄原始要求值，供上限提示用
        sides = sides <= 0 ? 3 : sides;                             // 沒接（或 0）沒有意義，比照檔頭例子畫三角形雪花
        bool hitSidesLimit = sides > MaxSides;
        sides = Math.Min(sides, MaxSides);                          // 邊數再多，外觀已趨近圓形，無須更多（key_params 建議）

        int requestedDepth = depth <= 0 ? 4 : depth;                // 沒接（或 0）比照檔頭例子，畫 4 層雪花；depth 最少為 1
        depth = Math.Min(requestedDepth, MaxDepth);                 // 深度太高點數會爆炸，先夾在 1–7（MaxDepth）
        bool hitDepthLimit = requestedDepth > depth;

        int edgeCount = sides < 3 ? 1 : sides;                      // 單條線只有 1 條邊，正多邊形有 sides 條邊
        while (depth > 0 && edgeCount * Math.Pow(4, depth) + 1 > MaxPoints)
        {
            depth--;                                                // 總點數逼近上限就自動降層，避免 Rhino 卡死／爆記憶體
            hitDepthLimit = true;
        }

        // ===== 1. DATA 資料 =====
        List<Point3d> corners = MakeStartShape(sides, size);      // 起始多邊形（或兩端點）的角點

        // ===== 2. INIT 初始 =====
        var points = new List<Point3d>();                        // 累積輸出的所有點

        // ===== 3. LOOP 迭代：遞迴切分每一條邊 =====
        for (int i = 0; i < edgeCount; i++)
        {
            SplitEdge(corners[i], corners[i + 1], depth, points);
        }
        points.Add(corners[corners.Count - 1]);                  // 補上最後一段的終點（多邊形時就是回到起點而閉合）

        // ===== 4. OUTPUT 輸出 =====
        var polyline = new Polyline(points);
        string limitNote = "";
        if (hitDepthLimit) limitNote += string.Format("；depth 已從 {0} 降為 {1}", requestedDepth, depth);
        if (hitSidesLimit) limitNote += string.Format("；sides 已從 {0} 限為 {1}", requestedSides, sides);
        Print("邊數 {0}，深度 {1}，共 {2} 個點{3}", edgeCount, depth, points.Count, limitNote);
        curve = polyline;
        pointCount = points.Count;
    }

    // ----- Fields 欄位 -----
    const int MaxDepth = 7;                                       // 每加一層點數 ×4，7 層已數萬點
    const int MaxSides = 24;                                      // 邊數再多，外觀已趨近圓形，不需要更多（key_params）
    const int MaxPoints = 200000;                                 // 點數上限：sides × MaxSides 疊加 depth 時避免記憶體爆炸

    // ----- RULE 規則：切三段、中段推一個尖角，兩端交給下一層 -----
    void SplitEdge(Point3d start, Point3d end, int depth, List<Point3d> points)
    {
        if (depth <= 0)
        {
            points.Add(start);                                    // 到底了，只記起點；終點由下一段記
            return;
        }

        // --- 三等分點 ---
        Vector3d full = end - start;
        Point3d a = start + full / 3.0;
        Point3d b = start + full * 2.0 / 3.0;

        // --- 中段向外推出尖點：以 a→b 為底邊，往外轉 -60° 找第三頂點 ---
        // 角點逆時針排列 → 順時針轉（-60°）落在 a→b 向量的右手邊，也就是多邊形外側；改成 +60° 尖角會朝內。
        // sides < 3 的單條直線是特例：只有兩個端點沒有「逆時針」方向，此時 -60° 會讓尖角朝 -Y（往下凸），
        // 和多邊形雪花凸向外側的方向相反，但曲線本身形狀仍正確，只是視覺上朝下。
        Vector3d baseVector = b - a;
        Vector3d turned = TurnVector(baseVector, -60.0);
        Point3d peak = a + turned;

        // --- 四段各自遞迴，深度減 1 ---
        SplitEdge(start, a, depth - 1, points);
        SplitEdge(a, peak, depth - 1, points);
        SplitEdge(peak, b, depth - 1, points);
        SplitEdge(b, end, depth - 1, points);
    }

    // ----- Helpers 工具 -----
    // 依 sides 建立起始正多邊形角點（首尾相接，sides < 3 時退化成一條線的兩端點）
    List<Point3d> MakeStartShape(int sides, double size)
    {
        var corners = new List<Point3d>();
        if (sides < 3)
        {
            corners.Add(new Point3d(-size / 2.0, 0, 0));
            corners.Add(new Point3d(size / 2.0, 0, 0));
            return corners;
        }

        double radius = size / (2.0 * Math.Sin(Math.PI / sides));  // 由邊長反推外接圓半徑
        for (int i = 0; i < sides; i++)
        {
            double angle = 2.0 * Math.PI * i / sides;
            corners.Add(new Point3d(radius * Math.Cos(angle), radius * Math.Sin(angle), 0));
        }
        corners.Add(corners[0]);                                    // 首尾用同一個點收尾，避免 sin(2π) 浮點誤差造成沒有真正閉合
        return corners;
    }

    // 向量繞 Z 軸轉角度（度）
    Vector3d TurnVector(Vector3d vector, double angleDegrees)
    {
        double angle = angleDegrees * Math.PI / 180.0;
        double cosAngle = Math.Cos(angle);
        double sinAngle = Math.Sin(angle);
        return new Vector3d(
            vector.X * cosAngle - vector.Y * sinAngle,
            vector.X * sinAngle + vector.Y * cosAngle,
            0);
    }
}
