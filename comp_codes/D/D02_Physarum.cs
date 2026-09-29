// Grasshopper Script Instance
// ==================================================================
// D02 Physarum Transport Network｜Physarum 黏菌
// 家族：D 代理人　邏輯：迭代模擬　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   gridSize        int     Item   痕跡場的邊長（gridSize × gridSize）   例：60
//   agentCount      int     Item   代理人數量                            例：800
//   steps           int     Item   模擬幾步                              例：150
//   sensorAngle     double  Item   感測器左右張開的角度（度）            例：45
//   sensorDistance  double  Item   感測器離身體多遠（格）                例：6
//   turnAngle       double  Item   一次轉彎的角度（度）                  例：22.5
//   decay           double  Item   痕跡每步淡去的比例（0～1）            例：0.1
//   seed            int     Item   隨機種子                              例：0
// 輸出
//   out                            Print 的文字（元件預設就有，不要刪）
//   gridPoints                     每一格的中心點
//   trailValues                    每一格的痕跡濃度（已正規化 0～1，接 Gradient 上色）
//   agentPoints                    最後一步所有代理人的位置
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 代理人一開始散在網格中央的圓內，面向隨機。
//   2. 聞：讀左、前、右三個感測點（離身體 sensorDistance 格、張開 sensorAngle）的痕跡濃度。
//   3. 轉：前面最濃就直走；前面最淡就隨機左轉或右轉；否則轉向較濃的一側 turnAngle。
//   4. 走與留：往面向的方向走一格（超出邊界從對面出來），在腳下的格子留下痕跡。
//   5. 散：整張痕跡場先跟周圍 8 格平均（擴散），再乘上 (1 − decay)（變淡），重複 steps 次。
// ------------------------------------------------------------------
// 你應該看到：預設值下，一開始像雜訊的痕跡逐漸收斂成幾條會分岔、穿過邊界的粗線網（不是密如葉脈的網），
// 代理人點沿著濃的路徑聚集移動；要把 trailValues 接 Gradient、gridPoints 接 Custom Preview 才看得到濃淡。
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
        int gridSize, int agentCount, int steps,
        double sensorAngle, double sensorDistance, double turnAngle, double decay, int seed,
        ref object gridPoints, ref object trailValues, ref object agentPoints)
    {
        // ===== 0. 防呆：沒接就用預設值，超出範圍就夾到合理範圍，避免卡死 =====
        if (gridSize <= 0) gridSize = 60;
        if (agentCount <= 0) agentCount = 800;
        if (steps <= 0) steps = 150;
        bool hitLimit = gridSize > MaxGridSize || agentCount > MaxAgentCount || steps > MaxSteps;
        gridSize = Math.Max(3, Math.Min(gridSize, MaxGridSize));
        agentCount = Math.Max(1, Math.Min(agentCount, MaxAgentCount));
        steps = Math.Max(1, Math.Min(steps, MaxSteps));

        if (sensorAngle <= 0) sensorAngle = 45;
        if (sensorDistance <= 0) sensorDistance = 6;
        if (turnAngle <= 0) turnAngle = 22.5;
        if (decay <= 0) decay = 0.1;
        decay = Math.Max(0.0, Math.Min(decay, 1.0));           // decay 是比例，限在 0～1

        // ===== 1. DATA 資料：痕跡場（雙緩衝用）與代理人清單 =====
        var random = new Random(seed);
        double[,] trail = new double[gridSize, gridSize];      // trail[x,y]：這一格的氣味濃度
        var agents = new List<Agent>();

        double sensorAngleRad = RhinoMath.ToRadians(sensorAngle);
        double turnAngleRad = RhinoMath.ToRadians(turnAngle);

        // ===== 2. INIT 初始：代理人散在網格中央的圓內，面向隨機 =====
        double centerX = gridSize / 2.0;
        double centerY = gridSize / 2.0;
        double spawnRadius = gridSize * 0.15;                  // 中央圓半徑：約網格的 15%
        for (int number = 0; number < agentCount; number++)
        {
            double spawnAngle = random.NextDouble() * Math.PI * 2;
            double spawnDistance = random.NextDouble() * spawnRadius;
            var agent = new Agent();
            agent.X = centerX + Math.Cos(spawnAngle) * spawnDistance;
            agent.Y = centerY + Math.Sin(spawnAngle) * spawnDistance;
            agent.Heading = random.NextDouble() * Math.PI * 2;
            agents.Add(agent);
        }

        // ===== 3. LOOP 迭代：每步先讓所有代理人聞、轉、走、留，再讓整張痕跡場擴散變淡 =====
        for (int step = 0; step < steps; step++)
        {
            for (int number = 0; number < agents.Count; number++)
            {
                Agent agent = agents[number];
                SmellAndTurn(agent, trail, gridSize, sensorAngleRad, sensorDistance, turnAngleRad, random);
                agent.MoveForward();
                agent.X = WrapCoordinate(agent.X, gridSize);   // 超出邊界從對面出來
                agent.Y = WrapCoordinate(agent.Y, gridSize);

                int footX = WrapIndex((int)Math.Floor(agent.X), gridSize);
                int footY = WrapIndex((int)Math.Floor(agent.Y), gridSize);
                trail[footX, footY] += DepositAmount;          // 腳下留下痕跡
            }
            trail = SpreadAndFade(trail, gridSize, decay);
        }

        // ===== 4. OUTPUT 輸出：把痕跡正規化成 0～1，整理成點與清單 =====
        double maxTrail = 1e-9;
        for (int x = 0; x < gridSize; x++)
            for (int y = 0; y < gridSize; y++)
                if (trail[x, y] > maxTrail) maxTrail = trail[x, y];

        var pointList = new List<Point3d>();
        var valueList = new List<double>();
        for (int x = 0; x < gridSize; x++)
        {
            for (int y = 0; y < gridSize; y++)
            {
                pointList.Add(new Point3d(x + 0.5, y + 0.5, 0));   // 每格中心點
                valueList.Add(trail[x, y] / maxTrail);             // 正規化到 0～1
            }
        }

        var agentPointList = new List<Point3d>();
        for (int number = 0; number < agents.Count; number++)
            agentPointList.Add(new Point3d(agents[number].X, agents[number].Y, 0));

        Print("模擬 {0} 步，{1} 隻代理人，網格 {2}×{2}，最濃 {3:F1}", steps, agents.Count, gridSize, maxTrail);
        if (hitLimit)
            Print("（已達上限，gridSize/agentCount/steps 被夾到 {0}/{1}/{2}）", gridSize, agentCount, steps);
        gridPoints = pointList;
        trailValues = valueList;
        agentPoints = agentPointList;
    }

    // ----- Fields 欄位 -----
    const double DepositAmount = 5.0;      // 每步每隻代理人在腳下留下的痕跡量
    const int MaxGridSize = 150;           // 網格邊長上限：太大擴散會很慢
    const int MaxAgentCount = 4000;        // 代理人數量上限
    const int MaxSteps = 500;              // 模擬步數上限

    // ----- RULE 規則：聞左、前、右三點，往濃的方向轉 -----
    void SmellAndTurn(Agent agent, double[,] trail, int gridSize,
        double sensorAngleRad, double sensorDistance, double turnAngleRad, Random random)
    {
        double front = ReadTrail(trail, gridSize, agent.X, agent.Y, agent.Heading, sensorDistance);
        // 俯視角度逆時針為正，所以 Heading + sensorAngleRad 是代理人的左邊、Heading - sensorAngleRad 是右邊
        double left = ReadTrail(trail, gridSize, agent.X, agent.Y, agent.Heading + sensorAngleRad, sensorDistance);
        double right = ReadTrail(trail, gridSize, agent.X, agent.Y, agent.Heading - sensorAngleRad, sensorDistance);

        if (front >= left && front >= right)
        {
            // 前面最濃：不轉，直走
        }
        else if (front < left && front < right)
        {
            // 前面最淡：隨機左轉或右轉，讓痕跡長出分岔支線，不會全部縮成一條主幹
            agent.Heading += (random.NextDouble() < 0.5 ? -turnAngleRad : turnAngleRad);
        }
        else if (left > right)
        {
            agent.Heading += turnAngleRad;                     // 左邊比較濃，往左轉
        }
        else
        {
            agent.Heading -= turnAngleRad;                     // 右邊比較濃，往右轉（走到這裡 left、right 必不相等）
        }
    }

    // ----- RULE 規則：整張痕跡場跟周圍 8 格平均（擴散），再乘 (1 − decay)（變淡） -----
    double[,] SpreadAndFade(double[,] trail, int gridSize, double decay)
    {
        var newTrail = new double[gridSize, gridSize];
        for (int x = 0; x < gridSize; x++)
        {
            for (int y = 0; y < gridSize; y++)
            {
                double sum = 0;
                for (int dx = -1; dx <= 1; dx++)
                {
                    for (int dy = -1; dy <= 1; dy++)
                    {
                        int neighborX = WrapIndex(x + dx, gridSize);
                        int neighborY = WrapIndex(y + dy, gridSize);
                        sum += trail[neighborX, neighborY];
                    }
                }
                double average = sum / 9.0;                    // 3×3（含自己）平均＝擴散
                newTrail[x, y] = average * (1.0 - decay);       // 乘上 (1 − decay)＝舊痕跡變淡
            }
        }
        return newTrail;
    }

    // ----- Helpers 工具 -----
    // 讀某個方向、某個距離那一格的痕跡濃度（sensor 用）
    double ReadTrail(double[,] trail, int gridSize, double x, double y, double angle, double distance)
    {
        double sampleX = x + Math.Cos(angle) * distance;
        double sampleY = y + Math.Sin(angle) * distance;
        int ix = WrapIndex((int)Math.Floor(sampleX), gridSize);
        int iy = WrapIndex((int)Math.Floor(sampleY), gridSize);
        return trail[ix, iy];
    }

    // 整數索引超出邊界時，從對面繞回來（環狀網格）
    int WrapIndex(int index, int size)
    {
        int wrapped = index % size;
        if (wrapped < 0) wrapped += size;
        return wrapped;
    }

    // 小數座標超出邊界時，從對面繞回來（代理人走出格子外用）
    double WrapCoordinate(double value, int size)
    {
        double wrapped = value % size;
        if (wrapped < 0) wrapped += size;
        return wrapped;
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================
// 代理人：目前位置（格子座標，可以是小數）與面向角度（弧度）
public class Agent
{
    public double X;
    public double Y;
    public double Heading;

    // 往面向的方向走一格（座標系裡一格＝1 單位長）
    public void MoveForward()
    {
        X += Math.Cos(Heading);
        Y += Math.Sin(Heading);
    }
}
