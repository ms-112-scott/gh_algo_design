// Grasshopper Script Instance
// ==================================================================
// A01 L-System｜L 系統
// 家族：A 規則與語法　邏輯：改寫／遞迴　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   startString   string  Item   起始字串（axiom）                      例：F
//   rules         string  Item   改寫規則，用逗號分隔多條               例：F=F[+F]F[-F]F
//   generations   int     Item   改寫幾代                               例：4
//   stepLength    double  Item   每一步前進的長度                       例：2.0
//   turnAngle     double  Item   轉彎角度（度）                         例：25.0
//   branchScale   double  Item   每進一層分枝長度的縮放（<1 越畫越短）  例：0.9
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   lines                        樹枝線段（Line）
//   finalString                  改寫完的最終字串（截斷後）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 把 rules 文字（如 F=F[+F]F[-F]F）拆成 Dictionary<char,string> 對照表。
//   2. 從 startString 開始，每一代把每個字元「同時」換成對照表右邊的字串，沒規則的字元原樣保留；重複 generations 次。
//   3. 字串長度一超過上限就停止改寫，避免代數設太高時當機。
//   4. 畫筆（Pen＝Plane＋步長）逐字讀最終字串：F 前進畫線、f 前進不畫、+ - 在畫面上轉彎。
//   5. 遇到 [ 把目前畫筆壓進 Stack 並把步長乘上 branchScale；遇到 ] 從 Stack 取回，回到分岔點繼續畫。
// ------------------------------------------------------------------
// 你應該看到：用預設值時長出一叢左右分岔、末梢漸細的樹枝（4 代）。
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
        string startString, string rules, int generations, double stepLength, double turnAngle, double branchScale,
        ref object lines, ref object finalString)
    {
        // ===== 0. 防呆 =====
        if (string.IsNullOrEmpty(startString)) startString = "F";                 // 沒接起始字串 → 用預設 axiom
        if (string.IsNullOrEmpty(rules)) rules = "F=F[+F]F[-F]F";                 // 沒接規則 → 用預設規則
        generations = Math.Max(0, Math.Min(generations <= 0 ? 4 : generations, MaxGenerations));
        if (stepLength <= 0) stepLength = 2.0;
        if (turnAngle <= 0) turnAngle = 25.0;
        if (branchScale <= 0) branchScale = 0.9;

        // ===== 1. DATA 資料 =====
        Dictionary<char, string> ruleTable = ReadRules(rules);                    // 規則文字 → 對照表

        // ===== 2. INIT 初始 =====
        string current = startString;

        // ===== 3. LOOP 迭代：字串太長就提早停 =====
        bool hitLimit = false;
        for (int generation = 0; generation < generations; generation++)
        {
            string next = ApplyRules(current, ruleTable);
            if (next.Length > MaxStringLength)                                    // 超過上限 → 停在改寫前的字串
            {
                hitLimit = true;
                break;
            }
            current = next;
        }

        // ===== 4. OUTPUT 輸出 =====
        List<Line> segments = DrawLines(current, stepLength, turnAngle, branchScale);
        string printedString = current.Length > MaxPrintLength
            ? current.Substring(0, MaxPrintLength) + "..."
            : current;
        Print(hitLimit
            ? string.Format("字串超過上限（{0} 字），提早停在第 {1} 代；線段 {2} 條", MaxStringLength, generations, segments.Count)
            : string.Format("改寫 {0} 代，字串長度 {1}，線段 {2} 條", generations, current.Length, segments.Count));
        lines = segments;
        finalString = printedString;
    }

    // ----- Fields 欄位 -----
    const int MaxGenerations = 8;          // 代數上限：字串長度指數成長，避免設太高當機
    const int MaxStringLength = 500000;    // 字串長度上限（對應 how_it_works：超過 50 萬字就停）
    const int MaxPrintLength = 200;        // finalString 輸出時只截前 200 字，避免文字爆量

    // ----- RULE 規則：照表把每個字元同時換成規則右邊的字串 -----
    string ApplyRules(string text, Dictionary<char, string> ruleTable)
    {
        var builder = new System.Text.StringBuilder();
        foreach (char symbol in text)
        {
            string replacement;
            if (ruleTable.TryGetValue(symbol, out replacement))
                builder.Append(replacement);           // 有規則 → 換成右邊的字串
            else
                builder.Append(symbol);                 // 沒規則（例如 + - [ ]）→ 原樣保留
        }
        return builder.ToString();
    }

    // ----- RULE 規則：畫筆逐字讀字串，F 畫線、+ - 轉彎、[ ] 記錄與回復分岔點 -----
    List<Line> DrawLines(string text, double stepLength, double turnAngle, double branchScale)
    {
        var segments = new List<Line>();
        var stack = new Stack<Pen>();
        var pen = new Pen(Plane.WorldXY, stepLength);   // 起筆：世界座標原點，朝 Y 軸前進

        foreach (char symbol in text)
        {
            switch (symbol)
            {
                case 'F':                                            // 前進並畫線
                    {
                        Point3d start = pen.Position;
                        pen.MoveForward();
                        segments.Add(new Line(start, pen.Position));
                        break;
                    }
                case 'f':                                             // 前進但不畫線（移動筆）
                    pen.MoveForward();
                    break;
                case '+':                                             // 繞 Z 軸左轉
                    pen.Turn(Vector3d.ZAxis, turnAngle);
                    break;
                case '-':                                             // 繞 Z 軸右轉
                    pen.Turn(Vector3d.ZAxis, -turnAngle);
                    break;
                case '&':                                             // 繞 X 軸低頭
                    pen.Turn(Vector3d.XAxis, turnAngle);
                    break;
                case '^':                                             // 繞 X 軸抬頭
                    pen.Turn(Vector3d.XAxis, -turnAngle);
                    break;
                case '\\':                                            // 繞 Y 軸翻滾
                    pen.Turn(Vector3d.YAxis, turnAngle);
                    break;
                case '/':                                             // 繞 Y 軸反向翻滾
                    pen.Turn(Vector3d.YAxis, -turnAngle);
                    break;
                case '[':                                             // 進分岔：存目前畫筆，步長縮短
                    stack.Push(pen);                                  // struct 值型別 → Push 進去的是副本
                    pen.StepLength *= branchScale;
                    if (stack.Count > MaxBranchDepth)
                        return segments;                              // 分岔深度爆掉 → 直接結束，避免卡死
                    break;
                case ']':                                             // 出分岔：回到存起來的畫筆狀態
                    if (stack.Count > 0)
                        pen = stack.Pop();
                    break;
            }
        }
        return segments;
    }
    const int MaxBranchDepth = 200;        // 分岔巢狀層數上限（對應 [ 的堆疊深度）

    // ----- Helpers 工具：規則文字（用逗號分隔多條 A=B）拆成對照表 -----
    Dictionary<char, string> ReadRules(string rulesText)
    {
        var ruleTable = new Dictionary<char, string>();
        string[] entries = rulesText.Split(',');
        foreach (string entry in entries)
        {
            string trimmed = entry.Trim();
            int equalIndex = trimmed.IndexOf('=');
            if (equalIndex <= 0) continue;                            // 格式不對（沒有 =）→ 跳過
            char symbol = trimmed[0];
            string replacement = trimmed.Substring(equalIndex + 1);
            ruleTable[symbol] = replacement;
        }
        return ruleTable;
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================
// 畫筆：目前位置、朝向（Plane）與步長；F 前進畫線、[ ] 靠 Stack<Pen> 存副本與回復
struct Pen
{
    public Plane Frame;
    public double StepLength;

    public Pen(Plane frame, double stepLength)
    {
        Frame = frame;
        StepLength = stepLength;
    }

    public Point3d Position { get { return Frame.Origin; } }

    // 沿目前朝向的 Y 軸（前進方向）移動一步
    public void MoveForward()
    {
        Frame.Origin = Frame.Origin + Frame.YAxis * StepLength;
    }

    // 繞指定的局部軸旋轉畫筆朝向（角度轉成弧度）
    public void Turn(Vector3d localAxis, double angleDegrees)
    {
        Vector3d worldAxis = Frame.XAxis * localAxis.X + Frame.YAxis * localAxis.Y + Frame.ZAxis * localAxis.Z;
        Frame.Rotate(RhinoMath.ToRadians(angleDegrees), worldAxis, Frame.Origin);
    }
}
