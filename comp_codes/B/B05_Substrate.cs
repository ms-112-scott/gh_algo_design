// Grasshopper Script Instance
// ==================================================================
// B05 Substrate 裂紋｜Substrate (Tarbell Crack Growth)
// 家族：B 生長　邏輯：迭代模擬　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   size         double  Item   正方形範圍邊長                 例：100
//   crackCount   int     Item   裂紋總數上限                   例：150
//   seed         int     Item   隨機種子                       例：0
// 輸出
//   out                         Print 的文字（元件預設就有，不要刪）
//   lines                       每條裂紋從起點到終點的線段（Line）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 把正方形範圍切成 400×400 的佔用格，每格記錄被哪條裂紋佔用（-1 表示空）
//   2. 隨機放 3 條起始裂紋，各有起點與方向
//   3. 每一輪讓所有還在走的裂紋前進半格，走過的空格記上自己的編號
//   4. 撞到邊界或別條裂紋（自己的母裂紋除外）就停下，從清單移除
//   5. 每停一條，就隨機挑一條既有裂紋，在其上隨機一點垂直分岔（±5 度抖動）出最多 2 條新裂紋，直到總數達 crackCount
//   6. 最後把每條走過的裂紋，起點連到目前終點輸出成 Line
// ------------------------------------------------------------------
// 你應該看到：size=100、crackCount=150、seed=0 時，3 條起始裂紋先各自筆直長開，
// 撞牆或互撞後不斷從既有裂紋垂直分岔，長成佈滿整個正方形、接近直角交叉的街道狀裂紋網。
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

    private void RunScript(double size, int crackCount, int seed, ref object lines)
    {
        // ===== 0. 防呆 =====
        if (size <= 0) size = 100;                                    // 沒接或不合理 → 用建議預設值
        if (crackCount < 1) crackCount = 150;                         // 同上
        bool crackCountClamped = crackCount > MaxCrackCount;          // 太多裂紋會拖慢速度，夾住上限前先記下有沒有超過
        crackCount = Math.Min(crackCount, MaxCrackCount);

        // ===== 1. DATA 資料：allCracks 是所有裂紋（陣列索引＝佔用格記的編號），movingIndices 是還在走的那些 =====
        var random = new Random(seed);
        var allCracks = new List<Crack>();
        var movingIndices = new List<int>();
        int[,] occupied = new int[GridResolution, GridResolution];    // -1＝空，其餘＝佔用它的裂紋編號
        double cellSize = size / GridResolution;

        // ===== 2. INIT 初始：格子全設為空，隨機放起始裂紋 =====
        for (int column = 0; column < GridResolution; column++)
            for (int row = 0; row < GridResolution; row++)
                occupied[column, row] = -1;

        int startingCount = Math.Min(StartingCrackCount, crackCount); // crackCount 太小時不要超過上限
        for (int number = 0; number < startingCount; number++)
        {
            Point3d startPoint = new Point3d(random.NextDouble() * size, random.NextDouble() * size, 0);
            double angle = random.NextDouble() * Math.PI * 2;
            Vector3d direction = new Vector3d(Math.Cos(angle), Math.Sin(angle), 0);
            var crack = new Crack(startPoint, direction, -1);         // -1：一開始就存在，沒有母裂紋
            allCracks.Add(crack);
            MarkCell(occupied, startPoint, cellSize, allCracks.Count - 1);
            movingIndices.Add(allCracks.Count - 1);
        }

        // ===== 3. LOOP 迭代：走到沒有裂紋在動或輪數用完 =====
        int round = 0;
        while (movingIndices.Count > 0 && round < MaxRounds)
        {
            round++;
            for (int m = movingIndices.Count - 1; m >= 0; m--)        // 倒序刪除，安全
            {
                int index = movingIndices[m];
                Crack crack = allCracks[index];
                bool stillMoving = MoveOneStep(crack, index, occupied, cellSize);
                if (!stillMoving)
                {
                    movingIndices.RemoveAt(m);                        // 撞到了：停下、移出清單
                    if (allCracks.Count < crackCount)
                        BranchFrom(allCracks, movingIndices, occupied, random, cellSize, crackCount);
                }
            }
        }

        // ===== 4. OUTPUT 輸出：每條走過（起點到終點有長度）的裂紋輸出成 Line =====
        var crackLines = new List<Line>();
        foreach (Crack crack in allCracks)
        {
            if (crack.StartPoint.DistanceTo(crack.Position) > cellSize * 0.1)  // 濾掉一出生就撞到、零長度的裂紋
                crackLines.Add(new Line(crack.StartPoint, crack.Position));
        }
        Print("裂紋 {0} 條，畫出線段 {1} 條，走了 {2} 輪{3}{4}", allCracks.Count, crackLines.Count, round,
            round >= MaxRounds ? "（達輪數上限）" : "",
            crackCountClamped ? "（crackCount 已夾到 " + MaxCrackCount + "）" : "");
        lines = crackLines;
    }

    // ----- Fields 欄位 -----
    const int GridResolution = 400;        // 佔用格解析度：越高碰撞越精準、越不會穿越，但記憶體與時間增加
    const int StartingCrackCount = 3;      // 一開始就存在的裂紋數
    const int MaxRounds = 100000;          // 安全上限：避免極端參數造成無窮迴圈
    const int MaxCrackCount = 800;         // 裂紋總數上限，避免使用者輸入超大值時卡頓
    const double BranchWobbleDegrees = 5;  // 分岔方向的抖動量：設 0 得到正交格狀，放大則趨向有機裂紋

    // ----- RULE 規則：一條裂紋前進半格，出界或撞到別條（母裂紋除外）就回傳 false -----
    bool MoveOneStep(Crack crack, int index, int[,] occupied, double cellSize)
    {
        Point3d nextPosition = crack.Position + crack.Direction * (cellSize * 0.5);
        int column, row;
        if (!TryGetCell(nextPosition, cellSize, out column, out row)) return false;   // 出界＝撞到邊界

        int occupant = occupied[column, row];
        // 忽略自己母裂紋的格子：剛分岔出來時起點就疊在母裂紋上，不忽略的話一出生就會誤判撞到
        if (occupant != -1 && occupant != crack.ParentIndex && occupant != index) return false;

        occupied[column, row] = index;
        crack.Position = nextPosition;
        return true;
    }

    // ----- RULE 規則：從既有裂紋上隨機一點，垂直分岔出最多 2 條新裂紋 -----
    void BranchFrom(List<Crack> allCracks, List<int> movingIndices, int[,] occupied, Random random,
        double cellSize, int crackCount)
    {
        int parentIndex = random.Next(allCracks.Count);
        Crack parent = allCracks[parentIndex];
        double t = random.NextDouble();                                       // 母裂紋上隨機一個比例位置
        Point3d branchPoint = parent.StartPoint + (parent.Position - parent.StartPoint) * t;

        for (int side = -1; side <= 1; side += 2)                             // 垂直兩側各試一次
        {
            if (allCracks.Count >= crackCount) break;

            double jitter = random.NextDouble() * BranchWobbleDegrees * 2 - BranchWobbleDegrees;  // ±5 度
            double angleRadians = RhinoMath.ToRadians(side * 90.0 + jitter);
            Vector3d newDirection = RotateFlat(parent.Direction, angleRadians);

            // 分岔前先看前方淨不淨空：不淨空就代表新裂紋一出生就會撞到，乾脆不生出來
            if (!IsClearAhead(branchPoint, newDirection, occupied, cellSize, parentIndex)) continue;

            // 出生格本來就是母裂紋佔用的格子，子裂紋忽略母裂紋、不需要也不該在這裡改記成自己：
            // 兩側分岔若都在這裡 MarkCell，會互相覆寫彼此的出生格，導致其中一條第一步就誤判撞到自己而死掉；
            // 第一步 MoveOneStep 前進後自然會記上自己，不需要提前標記
            var child = new Crack(branchPoint, newDirection, parentIndex);
            allCracks.Add(child);
            movingIndices.Add(allCracks.Count - 1);
        }
    }

    // ----- Helpers 工具 -----
    // 前方 2 格是空的嗎（忽略母裂紋），用來判斷分岔會不會一出生就撞到
    bool IsClearAhead(Point3d position, Vector3d direction, int[,] occupied, double cellSize, int ignoreIndex)
    {
        for (int step = 1; step <= 2; step++)
        {
            Point3d checkPoint = position + direction * (cellSize * 0.5 * step);
            int column, row;
            if (!TryGetCell(checkPoint, cellSize, out column, out row)) return false;

            int occupant = occupied[column, row];
            if (occupant != -1 && occupant != ignoreIndex) return false;
        }
        return true;
    }

    // 平面向量轉角度：2D 旋轉矩陣，Z 分量固定 0
    Vector3d RotateFlat(Vector3d vector, double angleRadians)
    {
        double cosAngle = Math.Cos(angleRadians);
        double sinAngle = Math.Sin(angleRadians);
        return new Vector3d(vector.X * cosAngle - vector.Y * sinAngle, vector.X * sinAngle + vector.Y * cosAngle, 0);
    }

    // 世界座標轉佔用格的格子座標；超出範圍回傳 false
    bool TryGetCell(Point3d point, double cellSize, out int column, out int row)
    {
        column = (int)Math.Floor(point.X / cellSize);
        row = (int)Math.Floor(point.Y / cellSize);
        return column >= 0 && column < GridResolution && row >= 0 && row < GridResolution;
    }

    // 把某個世界座標點所在的格子標記成某條裂紋佔用（點落在範圍外就不標記）
    void MarkCell(int[,] occupied, Point3d point, double cellSize, int index)
    {
        int column, row;
        if (TryGetCell(point, cellSize, out column, out row))
            occupied[column, row] = index;
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================
// 裂紋：起點（分岔或初始位置）、目前走到的位置、前進方向（建立後不再改變）、母裂紋編號（-1＝一開始就存在）
class Crack
{
    public Point3d StartPoint;
    public Point3d Position;
    public Vector3d Direction;
    public int ParentIndex;

    public Crack(Point3d startPoint, Vector3d direction, int parentIndex)
    {
        StartPoint = startPoint;
        Position = startPoint;
        Direction = direction;
        ParentIndex = parentIndex;
    }
}
