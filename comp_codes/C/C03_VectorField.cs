// Grasshopper Script Instance
// ==================================================================
// C03 Vector Field Streamlines｜向量場流線
// 家族：C 場與擴散　邏輯：直接公式／迭代模擬　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   pullStrength     double         Item   吸引力；正值被吸進吸引點，負值被推開成放射狀；0 視為沒接改用 1.0（要純拉力為 0 請填 0.001）   例：1.0
//   swirlStrength    double         Item   繞圈力；正值繞吸引點順時針、負值逆時針；0 視為沒接改用 0.6（要純漩渦請填 0.001）              例：0.6
//   seedsPerSide     int            Item   起點格子每邊幾個（共 seedsPerSide² 條流線）     例：8
//   streamlineSteps  int            Item   流線最多走幾步                                 例：60
//   stepSize         double         Item   每步前進的距離                                 例：1.0
//   fieldSize        double         Item   場的範圍（正方形邊長，也是停止邊界）           例：40
//   attractors       List<Point3d>  List   吸引點位置；可多個，疊加出鞍點與分流           例：（空清單，沒接時用內建兩點）
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   streamlines                  每個起點走出來的流線（Polyline），少於 2 點的不輸出
//   arrows                       每個起點的場方向短線，方便對照場與流線
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 在 fieldSize 範圍內排出 seedsPerSide × seedsPerSide 個格子起點，當作流線出發點。
//   2. FieldDirection：對每個吸引點算「指向它的方向 × pullStrength」加「轉 90 度的方向 × swirlStrength」，
//      乘上 1/(1+距離) 的衰減，全部吸引點疊加起來就是該點的場方向。
//   3. TraceStreamline：從起點取場方向、單位化、往前走 stepSize，重複 streamlineSteps 次；
//      出了 fieldSize 範圍、場方向變成零、或太靠近某個吸引點就提早停止。
//   4. 每個起點另外輸出一小段箭頭線，方向就是該點當下的場方向，用來對照「場」和「流線」的關係。
// ------------------------------------------------------------------
// 你應該看到：流線從格子起點順時針旋進兩個吸引點，形成兩個漩渦；箭頭方向與流線起點的切線一致。
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
        double pullStrength, double swirlStrength, int seedsPerSide,
        int streamlineSteps, double stepSize, double fieldSize, List<Point3d> attractors,
        ref object streamlines, ref object arrows)
    {
        // ===== 0. 防呆 =====
        if (attractors == null || attractors.Count == 0)
            attractors = new List<Point3d> { new Point3d(12, 10, 0), new Point3d(-14, -8, 0) };  // 沒接 → 用內建兩點，才看得到場
        bool attractorsHitLimit = attractors.Count > MaxAttractors;      // 記錄是否被截斷，摘要要提醒
        if (attractorsHitLimit)
            attractors = attractors.GetRange(0, MaxAttractors);          // 吸引點太多會拖慢每一步的場計算，先截斷

        if (pullStrength == 0) pullStrength = 1.0;                       // 沒接（讀到 0）→ 用建議值；真的要 0 拉力可改極小值代替
        if (swirlStrength == 0) swirlStrength = 0.6;
        if (fieldSize <= 0) fieldSize = 40;
        if (stepSize <= 0) stepSize = 1.0;

        if (seedsPerSide < 1) seedsPerSide = 8;
        bool seedsHitLimit = seedsPerSide > MaxSeedsPerSide;             // 記錄是否被截斷，摘要要提醒
        seedsPerSide = Math.Min(seedsPerSide, MaxSeedsPerSide);          // 起點數 = seedsPerSide²，太大會卡住 GH
        if (streamlineSteps <= 0) streamlineSteps = 60;
        bool stepsHitLimit = streamlineSteps > MaxStreamlineSteps;       // 記錄是否被截斷，摘要要提醒
        streamlineSteps = Math.Min(streamlineSteps, MaxStreamlineSteps);

        double arrowLength = stepSize * 1.5;                             // 箭頭比一步稍長，畫面上比較看得出方向
        double arriveRadius = Math.Max(AttractorRadius, stepSize);       // 到達半徑要跟著步長：一步跨得比半徑大，就永遠踩不進固定的 0.5 半徑

        // ===== 1. DATA 資料 =====
        var allStreamlines = new List<Polyline>();
        var allArrows = new List<Line>();

        // ===== 2. INIT 初始：起點排成格子，鋪滿 fieldSize =====
        List<Point3d> seedPoints = BuildSeedGrid(fieldSize, seedsPerSide);

        // ===== 3. LOOP 迭代 =====
        int keptCount = 0;
        int stoppedAtAttractor = 0;                                      // 統計停止原因，方便摘要與除錯
        int stoppedOutside = 0;
        int stoppedZeroField = 0;
        int usedAllSteps = 0;
        foreach (Point3d seedPoint in seedPoints)
        {
            string stopReason;
            Polyline streamline = TraceStreamline(
                seedPoint, attractors, pullStrength, swirlStrength, fieldSize, streamlineSteps, stepSize,
                arriveRadius, out stopReason);
            if (streamline.Count > 1)
            {
                allStreamlines.Add(streamline);
                keptCount++;
            }
            switch (stopReason)
            {
                case "attractor": stoppedAtAttractor++; break;
                case "outside": stoppedOutside++; break;
                case "zero": stoppedZeroField++; break;
                default: usedAllSteps++; break;                          // 步數用完仍未觸發任何停止條件
            }

            Vector3d fieldDirection = FieldDirection(seedPoint, attractors, pullStrength, swirlStrength);
            if (!fieldDirection.Unitize())                               // Unitize 改自己並回傳成功與否：場為零時失敗 → 傳回值仍是零向量
                fieldDirection = Vector3d.Zero;                          // 箭頭退化成一個點，畫面上看得出「這裡沒有方向」
            allArrows.Add(new Line(seedPoint, seedPoint + fieldDirection * arrowLength));
        }

        // ===== 4. OUTPUT 輸出 =====
        string limitNote = "";                                           // 防呆截斷過任何上限，就在摘要提醒
        if (attractorsHitLimit) limitNote += "，吸引點數超過上限已截斷";
        if (seedsHitLimit) limitNote += "，seedsPerSide 超過上限已截斷";
        if (stepsHitLimit) limitNote += "，streamlineSteps 超過上限已截斷";
        Print(string.Format(
            "{0} 個起點，{1} 條流線畫出來了（停在吸引點 {2}、出界 {3}、場為零 {4}、步數用完 {5}）{6}",
            seedPoints.Count, keptCount, stoppedAtAttractor, stoppedOutside, stoppedZeroField, usedAllSteps, limitNote));
        streamlines = allStreamlines;
        arrows = allArrows;
    }

    // ----- Fields 欄位 -----
    const int MaxSeedsPerSide = 25;         // 起點數 = seedsPerSide²，超過就很密、也很慢
    const int MaxStreamlineSteps = 300;     // 每條流線最多走的步數上限
    const int MaxAttractors = 100;          // 場計算是每步都掃過全部吸引點，太多會拖慢
    const double AttractorRadius = 0.5;     // 離吸引點多近算「到達」的下限；實際到達半徑見 arriveRadius（RunScript 內算）
    const double Epsilon = 1e-9;            // 判斷向量長度是否視為零

    // ----- RULE 規則：每個吸引點「拉」＋「轉」，越遠越弱，全部相加 -----
    Vector3d FieldDirection(Point3d point, List<Point3d> attractors, double pullStrength, double swirlStrength)
    {
        Vector3d total = Vector3d.Zero;
        foreach (Point3d attractor in attractors)
        {
            Vector3d towardAttractor = attractor - point;
            double distance = towardAttractor.Length;
            if (distance < Epsilon) continue;                           // 就站在吸引點上：方向無意義，跳過

            towardAttractor.Unitize();
            // 指向吸引點的方向逆時針轉 90 度 → swirlStrength 正值時，流線繞吸引點是「順時針」轉（別搞反）
            Vector3d swirlDirection = Vector3d.CrossProduct(Vector3d.ZAxis, towardAttractor);

            double falloff = 1.0 / (1.0 + distance);                    // 越遠影響越小，但不會真的變成 0
            total += (towardAttractor * pullStrength + swirlDirection * swirlStrength) * falloff;
        }
        return total;
    }

    // ----- RULE 規則：順著場走 streamlineSteps 步；出界或到吸引點 → 停 -----
    Polyline TraceStreamline(
        Point3d start, List<Point3d> attractors, double pullStrength, double swirlStrength,
        double fieldSize, int streamlineSteps, double stepSize, double arriveRadius, out string stopReason)
    {
        var streamPoints = new List<Point3d>();
        Point3d current = start;
        streamPoints.Add(current);
        stopReason = "steps";                                           // 預設：迴圈跑完沒被下面任何 break 打斷 → 步數用完

        for (int step = 0; step < streamlineSteps; step++)
        {
            if (IsNearAttractor(current, attractors, arriveRadius))     // 到吸引點附近：停在這裡，不再往前衝
            {
                stopReason = "attractor";
                break;
            }

            Vector3d direction = FieldDirection(current, attractors, pullStrength, swirlStrength);
            if (!direction.Unitize())                                   // Unitize 改自己並回傳成功與否：場為零時失敗 → 停
            {
                stopReason = "zero";
                break;
            }

            current = current + direction * stepSize;
            if (IsOutside(current, fieldSize))                          // 走出範圍：流線到此為止
            {
                stopReason = "outside";
                break;
            }
            streamPoints.Add(current);
        }

        return new Polyline(streamPoints);
    }

    // ----- Helpers 工具 -----
    // 起點排成正方形格子：seedsPerSide 個點鋪滿 -fieldSize/2 ～ +fieldSize/2
    List<Point3d> BuildSeedGrid(double fieldSize, int seedsPerSide)
    {
        var seedPoints = new List<Point3d>();
        double half = fieldSize * 0.5;
        double spacing = seedsPerSide > 1 ? fieldSize / (seedsPerSide - 1) : 0;

        for (int row = 0; row < seedsPerSide; row++)
        {
            for (int col = 0; col < seedsPerSide; col++)
            {
                double x = seedsPerSide > 1 ? -half + col * spacing : 0;
                double y = seedsPerSide > 1 ? -half + row * spacing : 0;
                seedPoints.Add(new Point3d(x, y, 0));
            }
        }
        return seedPoints;
    }

    // 出了 fieldSize 的方框嗎
    bool IsOutside(Point3d point, double fieldSize)
    {
        double half = fieldSize * 0.5;
        return Math.Abs(point.X) > half || Math.Abs(point.Y) > half;
    }

    // 離任一吸引點太近嗎；radius 由呼叫端算好傳入（要跟著 stepSize 走，見 RunScript 的 arriveRadius）
    bool IsNearAttractor(Point3d point, List<Point3d> attractors, double radius)
    {
        foreach (Point3d attractor in attractors)
            if (point.DistanceTo(attractor) < radius) return true;
        return false;
    }
}
