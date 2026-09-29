// Grasshopper Script Instance
// ==================================================================
// D01 Boids (Flocking)｜Boids 群聚
// 家族：D 代理人　邏輯：迭代模擬　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   birdCount          int     Item   鳥的數量                          例：40
//   steps              int     Item   模擬步數                          例：100
//   boxSize            double  Item   活動範圍（立方體邊長）            例：40.0
//   separationRadius   double  Item   分離：偵測鄰居的半徑              例：3.0
//   separationWeight   double  Item   分離：權重（0＝關掉這條規則）     例：1.5
//   alignmentRadius    double  Item   對齊：偵測鄰居的半徑              例：8.0
//   alignmentWeight    double  Item   對齊：權重（0＝關掉這條規則）     例：1.0
//   cohesionRadius     double  Item   聚集：偵測鄰居的半徑              例：10.0
//   cohesionWeight     double  Item   聚集：權重（0＝關掉這條規則）     例：1.0
//   maxSpeed           double  Item   每步移動的最大距離                例：0.5
//   seed               int     Item   隨機種子（0 也是合法種子）        例：0
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   trails                       每隻鳥的飛行軌跡（Polyline）
//   finalPoints                  模擬結束時每隻鳥的位置（Point3d）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 在邊長 boxSize 的立方體內隨機放 birdCount 隻鳥，給隨機方向、速度 maxSpeed。
//   2. 每一步每隻鳥先掃過其他鳥：分離半徑內累加遠離向量（越近權重越大，除以距離平方）、對齊半徑內累加鄰居速度、聚集半徑內累加鄰居位置。
//   3. 三個方向各自單位化、乘上各自權重相加成轉向量，只允許轉一小步，再把速度限制在 maxSpeed 以內。
//   4. 全部鳥的新速度都算完才一起移動（同步更新），撞到邊界就把該軸速度反向並夾回範圍內。
//   5. 每步把位置記進該鳥的軌跡，結束後輸出所有軌跡與最終位置。
// ------------------------------------------------------------------
// 你應該看到：一開始四散亂飛的線條，幾十步後收攏成一到兩群、朝相近方向繞行的軌跡束
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
        int birdCount, int steps, double boxSize,
        double separationRadius, double separationWeight,
        double alignmentRadius, double alignmentWeight,
        double cohesionRadius, double cohesionWeight,
        double maxSpeed, int seed,
        ref object trails, ref object finalPoints)
    {
        // ===== 0. 防呆 =====
        int requestedBirds = birdCount;                                // 記下夾之前的原始值，供之後判斷是否碰到上限
        int requestedSteps = steps;
        if (birdCount <= 0) birdCount = 40;                            // 沒接線時數值輸入是 0，0 隻鳥沒意義 → 換成檔頭的例
        birdCount = Math.Min(birdCount, MaxBirds);                     // 數量上限，計算量是 n²，避免拖慢畫面
        if (steps <= 0) steps = 100;
        steps = Math.Min(steps, MaxSteps);
        bool birdsClamped = requestedBirds > MaxBirds;
        bool stepsClamped = requestedSteps > MaxSteps;
        if (boxSize <= 0) boxSize = 40.0;
        if (maxSpeed <= 0) maxSpeed = 0.5;
        // 半徑是 0 也沒意義（範圍內找不到任何鄰居，規則等於關掉），一律換成檔頭的例；
        // 真的想關掉某條規則，把「權重」設成 0 即可，不需要靠半徑
        if (separationRadius <= 0) separationRadius = 3.0;
        if (alignmentRadius <= 0) alignmentRadius = 8.0;
        if (cohesionRadius <= 0) cohesionRadius = 10.0;
        // 權重的 0 是合法設定（＝關掉這條規則），不可以一律換掉；
        // 只在「這個輸入完全沒接線」時才換成檔頭的例，接了 slider、真的拉到 0 要保留
        if (Component != null && Component.Params.Input[4].SourceCount == 0) separationWeight = 1.5;
        if (Component != null && Component.Params.Input[6].SourceCount == 0) alignmentWeight = 1.0;
        if (Component != null && Component.Params.Input[8].SourceCount == 0) cohesionWeight = 1.0;
        separationWeight = Math.Max(0, separationWeight);
        alignmentWeight = Math.Max(0, alignmentWeight);
        cohesionWeight = Math.Max(0, cohesionWeight);

        // ===== 1. DATA 資料 =====
        var random = new Random(seed);
        var birds = new List<Bird>();

        // ===== 2. INIT 初始：範圍內隨機位置、隨機方向，速度都是 maxSpeed =====
        double half = boxSize / 2.0;
        for (int i = 0; i < birdCount; i++)
        {
            Point3d position = new Point3d(
                (random.NextDouble() - 0.5) * boxSize,
                (random.NextDouble() - 0.5) * boxSize,
                (random.NextDouble() - 0.5) * boxSize);
            Vector3d direction = UnitOrZero(new Vector3d(
                random.NextDouble() - 0.5,
                random.NextDouble() - 0.5,
                random.NextDouble() - 0.5));
            if (direction.IsZero) direction = Vector3d.XAxis;        // 極小機率三個分量都取到 0
            birds.Add(new Bird(position, direction * maxSpeed));
        }

        // ===== 3. LOOP 迭代：大家看同一時間點，算完新速度才一起移動 =====
        for (int step = 0; step < steps; step++)
        {
            var newVelocities = new Vector3d[birdCount];
            for (int i = 0; i < birdCount; i++)
            {
                newVelocities[i] = Steer(birds, i, separationRadius, separationWeight,
                    alignmentRadius, alignmentWeight, cohesionRadius, cohesionWeight, maxSpeed);
            }
            for (int i = 0; i < birdCount; i++)
            {
                birds[i].Move(newVelocities[i], half);
            }
        }

        // ===== 4. OUTPUT 輸出 =====
        var outputTrails = new List<Polyline>();
        var outputPoints = new List<Point3d>();
        foreach (Bird bird in birds)
        {
            outputTrails.Add(bird.Trail);
            outputPoints.Add(bird.Position);
        }
        string limitNote = (birdsClamped || stepsClamped)
            ? string.Format("（已達上限：鳥最多 {0} 隻／最多 {1} 步，計算量是 n²）", MaxBirds, MaxSteps)
            : "";
        Print("鳥 {0} 隻，模擬 {1} 步{2}", birdCount, steps, limitNote);
        trails = outputTrails;
        finalPoints = outputPoints;
    }

    // ----- Fields 欄位 -----
    const int MaxBirds = 200;          // 計算量是 n²，數量上限避免拖慢畫面
    const int MaxSteps = 500;
    const double TurnStrength = 0.1;   // 每步只允許轉向量影響速度的一小部分，避免瞬間掉頭

    // ----- RULE 規則：分離、對齊、聚集加權混合，限 maxSpeed -----
    Vector3d Steer(List<Bird> birds, int index,
        double separationRadius, double separationWeight,
        double alignmentRadius, double alignmentWeight,
        double cohesionRadius, double cohesionWeight,
        double maxSpeed)
    {
        Bird self = birds[index];
        Vector3d separationSum = Vector3d.Zero;
        Vector3d alignmentSum = Vector3d.Zero;
        Vector3d cohesionSum = Vector3d.Zero;
        int alignmentCount = 0;
        int cohesionCount = 0;

        for (int j = 0; j < birds.Count; j++)
        {
            if (j == index) continue;
            Bird other = birds[j];
            double distance = self.Position.DistanceTo(other.Position);
            if (distance < 1e-6) continue;                            // 幾乎重疊，跳過避免除以 0

            if (distance < separationRadius)
            {
                Vector3d away = self.Position - other.Position;
                separationSum += away / (distance * distance);        // away 長度是 d，除以 d² → 方向不變、大小變 1/d：越近推得越用力
            }
            if (distance < alignmentRadius)
            {
                alignmentSum += other.Velocity;
                alignmentCount++;
            }
            if (distance < cohesionRadius)
            {
                cohesionSum += new Vector3d(other.Position);
                cohesionCount++;
            }
        }

        Vector3d alignmentAverage = alignmentCount > 0 ? alignmentSum / alignmentCount : Vector3d.Zero;
        Vector3d cohesionDirection = Vector3d.Zero;
        if (cohesionCount > 0)
        {
            Point3d centerOfMass = new Point3d(cohesionSum / cohesionCount);
            cohesionDirection = centerOfMass - self.Position;          // 朝鄰居的平均位置靠
        }

        Vector3d steerVector =
            UnitOrZero(separationSum) * separationWeight +
            UnitOrZero(alignmentAverage) * alignmentWeight +
            UnitOrZero(cohesionDirection) * cohesionWeight;

        Vector3d newVelocity = self.Velocity + steerVector * TurnStrength;
        double speed = newVelocity.Length;
        if (speed > maxSpeed && speed > 1e-9)
        {
            newVelocity *= maxSpeed / speed;                            // 限速：不超過 maxSpeed
        }
        return newVelocity;
    }

    // ----- Helpers 工具 -----
    // 長度變 1，長度 0（沒有鄰居可看）→ 回 0，不要除以 0
    Vector3d UnitOrZero(Vector3d vector)
    {
        double length = vector.Length;
        if (length < 1e-9) return Vector3d.Zero;
        return vector / length;
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================
// 鳥：位置、速度、飛行軌跡；Move 前進一步並在撞到邊界時反彈
class Bird
{
    public Point3d Position;
    public Vector3d Velocity;
    public Polyline Trail;

    public Bird(Point3d position, Vector3d velocity)
    {
        Position = position;
        Velocity = velocity;
        Trail = new Polyline();
        Trail.Add(position);
    }

    public void Move(Vector3d newVelocity, double half)
    {
        Velocity = newVelocity;
        double x = Position.X + Velocity.X;
        double y = Position.Y + Velocity.Y;
        double z = Position.Z + Velocity.Z;
        double vx = Velocity.X;
        double vy = Velocity.Y;
        double vz = Velocity.Z;

        BounceAxis(ref x, ref vx, half);
        BounceAxis(ref y, ref vy, half);
        BounceAxis(ref z, ref vz, half);

        Position = new Point3d(x, y, z);
        Velocity = new Vector3d(vx, vy, vz);
        Trail.Add(Position);
    }

    // 單一軸撞到邊界：位置夾回範圍內，速度反向
    static void BounceAxis(ref double position, ref double velocity, double half)
    {
        if (position > half)
        {
            position = half;
            velocity = -velocity;
        }
        else if (position < -half)
        {
            position = -half;
            velocity = -velocity;
        }
    }
}
