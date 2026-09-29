// Grasshopper Script Instance
// ==================================================================
// E04 Dynamic Relaxation Form-Finding｜動態鬆弛找形
// 家族：E 排列與鬆弛　邏輯：迭代模擬　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   gridCount    int     Item   每邊格數                          例：6
//   size         double  Item   網的邊長                          例：20
//   gravity      double  Item   重力（負＝往下懸垂、正＝往上；0 視為沒接，改用例值）  例：-5
//   stiffness    double  Item   彈簧硬度                          例：500
//   damping      double  Item   每步速度保留比例（0~1）           例：0.95
//   iterations   int     Item   跑幾步（固定步數，不會自動提早停）  例：300
// 輸出
//   out                        Print 的文字（元件預設就有，不要刪）
//   lines                      彈簧兩端連成的線段（Line）
//   maxSpeed                   最後一步裡最快的質點速度（收斂時會趨近 0）
//   speedHistory               每一步最快速度的清單，接 Quick Graph 看收斂過程
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 建立 (gridCount+1)×(gridCount+1) 個質點排成方格，四個角點固定；
//      相鄰質點之間各連一條彈簧，原長＝size ÷ gridCount。
//   2. 每一步先算每條彈簧的力：伸長量（目前長度－原長）× stiffness，
//      把兩端質點互相拉近（拉長時）或推開（壓短時）。
//   3. 彈簧力加上重力，更新速度（v = (v + F·dt) × damping）與位置（p += v·dt），
//      固定點跳過不動。
//   4. 記錄這一步所有質點裡最快的速度；速度趨近 0 代表系統已經穩定（收斂）。
//   5. 跑完 iterations 步後，用彈簧兩端點畫線；gravity 設正值等於把懸垂網上下
//      顛倒過來，得到只受壓力的殼形狀。
// ------------------------------------------------------------------
// 你應該看到：用預設值時，四個角固定，方格網往中間下垂成高度約 7 的吊床曲面，
//   自由邊往內縮成弧線；speedHistory 先升到約 1.9 再降，跑完時已接近 0（收斂）
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
        int gridCount, double size, double gravity, double stiffness, double damping, int iterations,
        ref object lines, ref object maxSpeed, ref object speedHistory)
    {
        // ===== 0. 防呆 =====
        if (gridCount < 1) gridCount = 6;
        bool gridLimited = gridCount > MaxGridCount;       // 先記是否碰到上限，再夾值，才能在 Print 提醒
        gridCount = Math.Min(gridCount, MaxGridCount);
        if (size <= 0) size = 20.0;
        if (gravity == 0) gravity = -5.0;                  // 0 視為沒接：給一個看得出下垂的重力
        if (stiffness <= 0) stiffness = 500.0;
        bool stiffnessLimited = stiffness > MaxStiffness;  // TimeStep 固定 0.02 時，stiffness 太大會發散成 NaN
        stiffness = Math.Min(stiffness, MaxStiffness);
        if (damping <= 0 || damping > 1) damping = 0.95;
        // iterations 沒接時是 0：0 步沒有模擬意義，視同沒接一併給例值；接了 0 以上的正整數才照原值跑
        if (iterations <= 0) iterations = 300;
        bool iterationLimited = iterations > MaxIterations;
        iterations = Math.Min(iterations, MaxIterations);

        // ===== 1. DATA 資料：每步最快速度存成清單，之後接 Quick Graph 看收斂 =====
        double restLength = size / gridCount;             // 每條彈簧的原長：格距
        var speedHistoryList = new List<double>();

        // ===== 2. INIT 初始：方格排質點、四個角固定，相鄰質點之間連彈簧 =====
        List<Particle> particles = BuildGrid(gridCount, restLength);
        List<Spring> springs = BuildSprings(gridCount, restLength);

        // ===== 3. LOOP 迭代：彈簧力＋重力 → 速度 → 位置，記下每步最快速度 =====
        double latestMaxSpeed = 0;
        bool exploded = false;
        for (int iteration = 0; iteration < iterations; iteration++)
        {
            Vector3d[] forces = SpringForces(particles, springs, stiffness);
            latestMaxSpeed = MoveParticles(particles, forces, gravity, damping);
            speedHistoryList.Add(latestMaxSpeed);
            if (double.IsNaN(latestMaxSpeed) || double.IsInfinity(latestMaxSpeed))
            {
                exploded = true;                           // 數值爆炸：stiffness 相對 TimeStep 太大，提早停止避免產生無效座標
                break;
            }
        }

        // ===== 4. OUTPUT 輸出 =====
        Print("跑了 {0} 步：{1} 個質點、{2} 條彈簧，最後最快速度 {3:F4}", iterations, particles.Count, springs.Count, latestMaxSpeed);
        if (exploded) Print("數值爆炸：stiffness 相對 TimeStep 太大，請調小 stiffness 或加大 damping");
        else if (latestMaxSpeed > ConvergedSpeed) Print("尚未收斂，請加大 iterations 或調 damping");
        if (gridLimited) Print("已達上限：每邊 {0} 格", MaxGridCount);
        if (iterationLimited) Print("已達上限：{0} 步", MaxIterations);
        if (stiffnessLimited) Print("已達上限：stiffness {0}", MaxStiffness);
        lines = MakeLines(particles, springs);
        maxSpeed = latestMaxSpeed;
        speedHistory = speedHistoryList;
    }

    // ----- Fields 欄位 -----
    const double TimeStep = 0.02;                          // 每步模擬的時間長度；配合 stiffness 太大會爆炸，太小要跑更多步才收斂
    const int MaxGridCount = 40;                           // 每邊最多格數，避免點數（(格數+1)²）爆炸拖慢
    const int MaxIterations = 2000;                         // 步數上限，避免 slider 拉太大拖慢（LOOP 固定跑滿這個步數，不會自動提早停）
    const double MaxStiffness = 2000;                       // stiffness·TimeStep² 要遠小於 1 才穩定；超過約 2500 會發散成 NaN
    const double ConvergedSpeed = 0.01;                     // 最快速度低於這個值，視為已經收斂（吊床形穩定不再變動）

    // ----- RULE 規則：SpringForces 算彈簧力，MoveParticles 把力變成速度與位置 -----
    // 每條彈簧：伸長量 × stiffness，拉長就把兩端互相拉近、壓短就互相推開（虎克定律）
    Vector3d[] SpringForces(List<Particle> particles, List<Spring> springs, double stiffness)
    {
        var forces = new Vector3d[particles.Count];
        foreach (var spring in springs)
        {
            Vector3d aToB = particles[spring.IndexB].Position - particles[spring.IndexA].Position;
            double currentLength = aToB.Length;
            if (currentLength < 1e-9) continue;            // 兩端重合，方向無意義，跳過避免除以 0
            double extension = currentLength - spring.RestLength;   // 正＝拉長、負＝壓短
            aToB.Unitize();
            Vector3d pull = aToB * extension * stiffness;
            forces[spring.IndexA] += pull;                 // 拉長時 A 被拉向 B
            forces[spring.IndexB] -= pull;                 // 作用力反作用力：B 被拉向 A
        }
        return forces;
    }

    // 力 → 速度（乘 damping 模擬能量損耗）→ 位置；固定點（角點）不受影響
    // Particle 是 class：直接改欄位就會生效，不用整個寫回 List
    double MoveParticles(List<Particle> particles, Vector3d[] forces, double gravity, double damping)
    {
        double fastestSpeed = 0;
        var gravityForce = new Vector3d(0, 0, gravity);
        for (int index = 0; index < particles.Count; index++)
        {
            Particle particle = particles[index];
            if (particle.IsFixed) continue;

            particle.Velocity = (particle.Velocity + (forces[index] + gravityForce) * TimeStep) * damping;
            particle.Position = particle.Position + particle.Velocity * TimeStep;
            double speed = particle.Velocity.Length;
            if (speed > fastestSpeed) fastestSpeed = speed;
        }
        return fastestSpeed;
    }

    // ----- Helpers 工具 -----
    // 排出 (gridCount+1)×(gridCount+1) 個質點：方格排列、四個角點固定
    List<Particle> BuildGrid(int gridCount, double restLength)
    {
        var particles = new List<Particle>();
        int pointsPerSide = gridCount + 1;
        for (int row = 0; row < pointsPerSide; row++)
        {
            for (int col = 0; col < pointsPerSide; col++)
            {
                var particle = new Particle();
                particle.Position = new Point3d(col * restLength, row * restLength, 0);
                particle.Velocity = Vector3d.Zero;
                bool isCorner = (row == 0 || row == gridCount) && (col == 0 || col == gridCount);
                particle.IsFixed = isCorner;
                particles.Add(particle);
            }
        }
        return particles;
    }

    // 每個質點往右、往上各接一條彈簧（用索引參照，避免重複列出同一條）
    List<Spring> BuildSprings(int gridCount, double restLength)
    {
        var springs = new List<Spring>();
        int pointsPerSide = gridCount + 1;
        for (int row = 0; row < pointsPerSide; row++)
        {
            for (int col = 0; col < pointsPerSide; col++)
            {
                int index = row * pointsPerSide + col;
                if (col + 1 < pointsPerSide) springs.Add(new Spring(index, index + 1, restLength));            // 往右
                if (row + 1 < pointsPerSide) springs.Add(new Spring(index, index + pointsPerSide, restLength)); // 往上
            }
        }
        return springs;
    }

    // 用模擬完的質點位置，把每條彈簧畫成一條線
    List<Line> MakeLines(List<Particle> particles, List<Spring> springs)
    {
        var lines = new List<Line>();
        foreach (var spring in springs)
            lines.Add(new Line(particles[spring.IndexA].Position, particles[spring.IndexB].Position));
        return lines;
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================

// 一個質點：目前位置、目前速度、是否固定（固定點不受力的影響，模擬時原地不動）
public class Particle
{
    public Point3d Position;
    public Vector3d Velocity;
    public bool IsFixed;
}

// 一條彈簧：連接兩個質點（用 Particle 清單的索引參照）、原長
public class Spring
{
    public int IndexA;
    public int IndexB;
    public double RestLength;

    public Spring(int indexA, int indexB, double restLength)
    {
        IndexA = indexA;
        IndexB = indexB;
        RestLength = restLength;
    }
}
