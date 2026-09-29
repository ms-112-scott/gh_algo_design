// Grasshopper Script Instance
// ==================================================================
// F06 Strange Attractor｜奇異吸子
// 家族：F 圖樣與最佳化　邏輯：迭代模擬／直接公式　難度：1
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   a               double    Item   吸子係數 a（Lorenz 的 σ）         例：Lorenz 10／Clifford −1.4
//   b               double    Item   吸子係數 b（Lorenz 的 ρ）         例：Lorenz 28／Clifford 1.6
//   c               double    Item   吸子係數 c（Lorenz 的 β）         例：Lorenz 2.667／Clifford 1.0
//   d               double    Item   吸子係數 d（只有 Clifford 用到）  例：0.7
//   steps           int       Item   迭代步數                          例：3000（沒接或 ≤0 一律用這個值）
//   stepTime        double    Item   Lorenz 的時間步長                 例：0.01
//   startPoint      Point3d   Item   起點                              例：(0.1, 0, 0)
//   attractorType   int       Item   0＝Lorenz，1＝Clifford            例：0
// 輸出
//   out                                Print 的文字（元件預設就有，不要刪）
//   curve                              軌跡連成的線（看 Lorenz 用）
//   points                             每一步的點（看 Clifford 用）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 從 startPoint 出發，把目前位置放進路徑清單。
//   2. Lorenz（attractorType＝0）：用 a(y−x)、x(b−z)−y、xy−cz 算出速度向量，乘上 stepTime 往前走一步（歐拉法積分），只看「上一步」的位置。
//   3. Clifford（attractorType＝1）：直接用 sin／cos 公式把 (x, y) 映射成下一個點，沒有時間概念，Z 固定為 0。
//   4. 每算出一個新點就檢查是否發散（座標無效，或離原點超過 10⁶）；一旦發散就停止並用 Print 提醒係數不合理。
//   5. 重複到 steps 步或發散為止，把所有點依序連成 Polyline 當作 curve，同時輸出點清單 points。
// ------------------------------------------------------------------
// 你應該看到：用預設值（Lorenz，attractorType＝0）畫出一條左右兩團、永不重複纏繞的蝴蝶形曲線；
//            attractorType＝1 時改用 Clifford 點雲（建議 steps 調到 2 萬以上才會濃密）
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

    private void RunScript(double a, double b, double c, double d, int steps, double stepTime, Point3d startPoint, int attractorType, ref object curve, ref object points)
    {
        // ===== 0. 防呆 =====
        bool useClifford = (attractorType == 1);                            // 先判斷吸子種類，係數與起點的預設都要看這個給
        if (a == 0 && b == 0 && c == 0 && d == 0)                           // 四個係數同時沒接才視為「沒接」，整組換成對應吸子的預設；
        {                                                                    // 只調其中一個（例如只接 b）就照使用者給的值算，不硬套預設
            if (useClifford) { a = -1.4; b = 1.6; c = 1.0; d = 0.7; }       // Clifford 常見的捲曲參數
            else { a = 10.0; b = 28.0; c = 2.667; d = 0.7; }                // 經典 Lorenz 參數（σ、ρ、β），d 先給 Clifford 備用
        }
        if (!startPoint.IsValid || startPoint.DistanceTo(Point3d.Origin) < 0.0001)
            startPoint = new Point3d(0.1, 0, 0);                            // 沒接或落在原點 → Lorenz 原點是固定點，要偏移一點才會動
        if (stepTime <= 0) stepTime = 0.01;                                 // 沒接 stepTime → 預設步長
        if (steps <= 0) steps = DefaultSteps;                               // 0＝沒接（負數沒有意義，一併視為沒接）→ 一律用例值 3000
        bool hitLimit = steps > MaxSteps;                                   // 先記下是否碰到上限，摘要要說明
        steps = Math.Min(steps, MaxSteps);                                  // 最多 MaxSteps 步，避免點數暴衝拖慢畫面

        // ===== 1. DATA 資料 =====
        var path = new List<Point3d>();

        // ===== 2. INIT 初始 =====
        Point3d current = useClifford ? new Point3d(startPoint.X, startPoint.Y, 0) : startPoint;  // Clifford 只在 XY 平面上跑，Z 固定為 0
        path.Add(current);

        // ===== 3. LOOP 迭代：只看上一步 =====
        bool diverged = false;
        int stepsDone = 0;
        for (int i = 0; i < steps; i++)
        {
            Point3d next = useClifford
                ? CliffordNext(current, a, b, c, d)
                : LorenzNext(current, a, b, c, stepTime);

            if (!next.IsValid || next.DistanceTo(Point3d.Origin) > DivergeLimit)
            {
                diverged = true;                                           // 發散：係數讓軌跡飛走了，停在最後一個有效點
                break;
            }

            path.Add(next);
            current = next;
            stepsDone = i + 1;
        }

        // ===== 4. OUTPUT 輸出 =====
        bool firstStepDiverged = diverged && path.Count < 2;                // 連第一步都沒走成，Polyline 至少要 2 點才有效
        curve = path.Count >= 2 ? new Polyline(path) : null;
        points = path;
        Print(string.Format("{0}，共 {1} 點（走了 {2} 步）{3}{4}",
            useClifford ? "Clifford" : "Lorenz", path.Count, stepsDone,
            diverged
                ? (firstStepDiverged ? "，第一步就發散，stepTime 太大或係數不對" : "，中途發散，係數可能不合理")
                : "",
            hitLimit ? string.Format("（已達上限 {0} 步）", MaxSteps) : ""));
    }

    // ----- Fields 欄位 -----
    const int DefaultSteps = 3000;            // steps 沒接時的預設步數（對應檔頭「例：3000」）
    const int MaxSteps = 200000;              // 步數上限，避免點數暴衝拖慢畫面
    const double DivergeLimit = 1000000.0;    // 離原點超過這個距離視為發散（10 的 6 次方）

    // ----- RULE 規則：Lorenz 下一步（微分方程，用速度往前走一小步） -----
    Point3d LorenzNext(Point3d p, double a, double b, double c, double stepTime)
    {
        Vector3d velocity = new Vector3d(
            a * (p.Y - p.X),          // x 方向：被拉向 y，速度正比於 y 與 x 的差
            p.X * (b - p.Z) - p.Y,    // y 方向：z 越大，y 的成長越被壓抑
            p.X * p.Y - c * p.Z);     // z 方向：xy 讓 z 上升，c 讓 z 衰減
        return p + velocity * stepTime;
    }

    // ----- RULE 規則：Clifford 下一步（沒有時間概念，直接映射到新座標） -----
    Point3d CliffordNext(Point3d p, double a, double b, double c, double d)
    {
        double nextX = Math.Sin(a * p.Y) + c * Math.Cos(a * p.X);
        double nextY = Math.Sin(b * p.X) + d * Math.Cos(b * p.Y);
        return new Point3d(nextX, nextY, 0);
    }
}
