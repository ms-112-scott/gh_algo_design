// Grasshopper Script Instance
// ==================================================================
// D03 Pedestrian Simulation (Social Force Model)｜Pedestrian 人流模擬
// 家族：D 代理人　邏輯：迭代模擬　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   startPoints      Point3d  List   出發點（每點周圍站一群人）        例：（空＝左側兩群）
//   peoplePerStart   int      Item   每個出發點站幾個人                例：15
//   goal             Point3d  Item   大家想走到的目的地                例：原點 (0,0,0)
//   obstacleCenters  Point3d  List   圓形障礙物的中心                  例：（空＝中間放一個）
//   obstacleRadius   double   Item   障礙物半徑                        例：5.0
//   personRadius     double   Item   每個人的身體半徑                  例：0.3
//   walkSpeed        double   Item   想走的速度（公尺／秒）            例：1.3
//   steps            int      Item   最多模擬幾步（每步 0.1 秒）       例：400
//   seed             int      Item   隨機種子                          例：1
// 輸出
//   out                              Print 的文字（元件預設就有，不要刪）
//   trails                           每個人的移動軌跡（Polyline）
//   finalPoints                      模擬結束時每個人的位置
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 每個出發點周圍隨機站 peoplePerStart 個人，全部投影到 XY 平面；goal 與障礙物中心也一併壓平。
//   2. 目標力：想要的速度（朝 goal、大小 walkSpeed）減去現在的速度，除以反應時間，人會逐漸加速轉向。
//   3. 人推人：兩人身體間的空隙越小，推開的力越大（隨空隙指數上升），只看 6 倍身體半徑內的人。
//   4. 障礙力：靠近圓形障礙就被推開，同時加上一個垂直分量，往 goal 那一側繞過去，而不是卡在正前方。
//   5. 每一步先把所有人的三種力都算完，再一起更新速度與位置（同步更新），並限制最高速度。
//   6. 走到 goal 附近的人視為抵達、停止受力；全部抵達或跑完 steps 就結束，輸出每個人的軌跡與最終位置。
// ------------------------------------------------------------------
// 你應該看到：兩群人從左側出發，繞開中間的圓形障礙物，分成兩股弧線匯向中央的 goal。
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
        List<Point3d> startPoints, int peoplePerStart, Point3d goal,
        List<Point3d> obstacleCenters, double obstacleRadius,
        double personRadius, double walkSpeed, int steps, int seed,
        ref object trails, ref object finalPoints)
    {
        // ===== 0. 防呆 =====
        if (startPoints == null || startPoints.Count == 0)
        {
            startPoints = new List<Point3d> { new Point3d(-30, -10, 0), new Point3d(-30, 10, 0) };
        }
        if (obstacleCenters == null || obstacleCenters.Count == 0)
        {
            obstacleCenters = new List<Point3d> { new Point3d(-10, 0, 0) };   // 預設在出發點與 goal 之間放一個障礙
        }
        bool hitLimit = false;                                                // 有沒有碰到任何上限，最後 Print 要提醒
        if (startPoints.Count > MaxTotalPeople)                               // 出發點本身就超過總人數上限
        {
            startPoints = startPoints.Take(MaxTotalPeople).ToList();
            hitLimit = true;
        }
        if (peoplePerStart <= 0) peoplePerStart = 15;
        if (peoplePerStart > MaxPeoplePerStart) { peoplePerStart = MaxPeoplePerStart; hitLimit = true; }
        if (obstacleRadius <= 0) obstacleRadius = 5.0;
        if (personRadius <= 0) personRadius = 0.3;
        if (walkSpeed <= 0) walkSpeed = 1.3;
        if (steps <= 0) steps = 400;
        if (steps > MaxSteps) { steps = MaxSteps; hitLimit = true; }
        if (seed == 0) seed = 1;

        int totalPeople = startPoints.Count * peoplePerStart;
        if (totalPeople > MaxTotalPeople)                                    // 效能保險絲：人數上限，避免逐對互推算不完
        {
            peoplePerStart = Math.Max(1, MaxTotalPeople / startPoints.Count);
            hitLimit = true;
        }

        // ===== 1. DATA 資料 =====
        var random = new Random(seed);
        var people = new List<Person>();

        // ===== 2. INIT 初始：出發點周圍隨機站人，goal 與障礙壓到 XY 平面 =====
        Point3d goalXY = new Point3d(goal.X, goal.Y, 0);
        var obstaclesXY = new List<Point3d>();
        foreach (Point3d center in obstacleCenters) obstaclesXY.Add(new Point3d(center.X, center.Y, 0));

        foreach (Point3d start in startPoints)
        {
            Point3d startXY = new Point3d(start.X, start.Y, 0);
            for (int index = 0; index < peoplePerStart; index++)
            {
                double angle = random.NextDouble() * Math.PI * 2;
                double scatter = random.NextDouble() * StartScatterRadius;
                Point3d position = startXY + new Vector3d(Math.Cos(angle) * scatter, Math.Sin(angle) * scatter, 0);
                double speedFactor = 0.85 + random.NextDouble() * 0.3;        // 每人快慢略有不同，走位才不會整齊劃一
                people.Add(new Person(position, speedFactor));
            }
        }
        double arriveRadius = personRadius + 0.2;

        // ===== 3. LOOP 迭代：先算完所有人的力，再一起移動 =====
        int usedSteps = 0;
        for (int step = 1; step <= steps; step++)
        {
            if (people.All(person => person.Arrived)) break;                 // 全部抵達，提早結束
            usedSteps = step;

            var forces = new List<Vector3d>();
            for (int index = 0; index < people.Count; index++) forces.Add(Vector3d.Zero);

            for (int index = 0; index < people.Count; index++)
            {
                if (people[index].Arrived) continue;
                forces[index] += GoalForce(people[index], goalXY, walkSpeed);
                forces[index] += ObstacleForce(people[index].Position, obstaclesXY, obstacleRadius, personRadius, goalXY);
            }
            PeopleForce(people, personRadius, forces);

            for (int index = 0; index < people.Count; index++)
            {
                Person person = people[index];
                if (person.Arrived) continue;
                person.Move(forces[index], TimeStep, walkSpeed * MaxSpeedFactor);
                if (person.Position.DistanceTo(goalXY) < arriveRadius) person.Arrived = true;
            }
        }

        // ===== 4. OUTPUT 輸出 =====
        int arrivedCount = people.Count(person => person.Arrived);
        var outputTrails = new List<Polyline>();
        var outputPoints = new List<Point3d>();
        foreach (Person person in people)
        {
            outputTrails.Add(person.Trail);
            outputPoints.Add(person.Position);
        }
        Print("共 {0} 人，跑了 {1} 步，{2} 人抵達 goal{3}", people.Count, usedSteps, arrivedCount,
            hitLimit ? "（部分輸入已被上限截斷）" : "");
        trails = outputTrails;
        finalPoints = outputPoints;
    }

    // ----- Fields 欄位 -----
    const double TimeStep = 0.1;              // 每步代表的時間（秒）
    const double ReactionTime = 0.5;          // 從現在速度調整到想要速度所需時間，越小轉向越快
    const double PushStrength = 3.0;          // 人推人的力道基準
    const double PushRange = 0.2;             // 身體空隙的衰減尺度：空隙每縮小 PushRange，推力放大約 e 倍
    const double InteractionRangeFactor = 6.0;// 只看 6 倍身體半徑內的人，太遠不用管
    const double ObstaclePushStrength = 8.0;  // 必須大於目標力（約 walkSpeed / ReactionTime），否則人會被目標力推穿障礙
    const double ObstacleRange = 0.3;         // 障礙推力的衰減尺度
    const double ObstacleCutoff = 2.0;        // 空隙超過這個距離就不管障礙
    const double ExpArgumentLimit = 20.0;     // Math.Exp 的指數上限，避免 personRadius／障礙太大時算出 Infinity
    const double TangentWeight = 0.6;         // 繞行（切線）分量相對推開（法線）分量的比例
    const double MaxSpeedFactor = 1.3;        // 擁擠時允許暫時超過 walkSpeed 一些，避免卡死不動
    const double StartScatterRadius = 2.0;    // 出發點周圍隨機散開的範圍
    const int MaxPeoplePerStart = 100;
    const int MaxTotalPeople = 300;           // 人數上限：逐對互推是 O(n²)，太多人會算不完
    const int MaxSteps = 2000;

    // ----- RULE 規則：想要的速度（朝 goal、大小 walkSpeed）減現在速度，除以反應時間 -----
    Vector3d GoalForce(Person person, Point3d goalXY, double walkSpeed)
    {
        Vector3d towardGoal = goalXY - person.Position;
        double distance = towardGoal.Length;
        Vector3d desiredDirection = distance > 1e-6 ? towardGoal / distance : Vector3d.Zero;
        Vector3d desiredVelocity = desiredDirection * walkSpeed * person.SpeedFactor;
        return (desiredVelocity - person.Velocity) / ReactionTime;
    }

    // ----- RULE 規則：人推人，身體空隙越小推力越大，只在 6 倍半徑內生效 -----
    // 用格子分桶，一次算完所有人並累加進 forces，避免逐對比對造成 O(n²)
    void PeopleForce(List<Person> people, double personRadius, List<Vector3d> forces)
    {
        double interactionRange = personRadius * InteractionRangeFactor;
        var grid = BuildGrid(people, interactionRange);

        for (int first = 0; first < people.Count; first++)
        {
            if (people[first].Arrived) continue;                            // 抵達的人視為離場，不再推人
            var cell = CellKey(people[first].Position, interactionRange);
            for (int dx = -1; dx <= 1; dx++)
            {
                for (int dy = -1; dy <= 1; dy++)
                {
                    List<int> bucket;
                    if (!grid.TryGetValue((cell.Item1 + dx, cell.Item2 + dy), out bucket)) continue;

                    foreach (int second in bucket)
                    {
                        if (second <= first) continue;                        // 每一對只算一次
                        if (people[second].Arrived) continue;                 // 抵達的人視為離場，不再被推人影響
                        Vector3d firstToSecond = people[second].Position - people[first].Position;
                        double distance = firstToSecond.Length;
                        if (distance >= interactionRange || distance < 1e-9) continue;

                        double gap = distance - personRadius * 2;             // 身體間的空隙，可能是負值（已重疊）
                        double magnitude = PushStrength * Math.Exp(Math.Min(-gap / PushRange, ExpArgumentLimit));
                        Vector3d away = firstToSecond / distance;             // 從 first 指向 second 的單位向量
                        forces[first] -= away * magnitude;
                        forces[second] += away * magnitude;
                    }
                }
            }
        }
    }

    // ----- RULE 規則：靠近圓形障礙就推開，再加一個切線分量往 goal 那一側繞過去 -----
    Vector3d ObstacleForce(Point3d position, List<Point3d> obstaclesXY, double obstacleRadius, double personRadius, Point3d goalXY)
    {
        Vector3d total = Vector3d.Zero;
        foreach (Point3d obstacleCenter in obstaclesXY)
        {
            Vector3d fromObstacle = position - obstacleCenter;
            double distance = fromObstacle.Length;
            double gap = distance - obstacleRadius - personRadius;
            if (gap > ObstacleCutoff) continue;                              // 太遠，這個障礙先不管

            Vector3d radial = distance > 1e-6 ? fromObstacle / distance : Vector3d.XAxis;
            double magnitude = ObstaclePushStrength * Math.Exp(Math.Min(-gap / ObstacleRange, ExpArgumentLimit));

            Vector3d tangent = new Vector3d(-radial.Y, radial.X, 0);          // 垂直於 radial，先隨意選一個轉向
            Vector3d towardGoalFromObstacle = goalXY - obstacleCenter;
            Vector3d cross = Vector3d.CrossProduct(fromObstacle, towardGoalFromObstacle);
            if (cross.Z < 0) tangent = -tangent;                             // 翻到 goal 那一側，繞過去比較快

            total += radial * magnitude + tangent * magnitude * TangentWeight;
        }
        return total;
    }

    // ----- Helpers 工具 -----
    // 把人依 XY 座標分裝進邊長 cellSize 的格子，AddPeopleForces 只需要比對鄰近 3x3 格
    Dictionary<(int, int), List<int>> BuildGrid(List<Person> people, double cellSize)
    {
        var grid = new Dictionary<(int, int), List<int>>();
        for (int index = 0; index < people.Count; index++)
        {
            var key = CellKey(people[index].Position, cellSize);
            List<int> bucket;
            if (!grid.TryGetValue(key, out bucket))
            {
                bucket = new List<int>();
                grid[key] = bucket;
            }
            bucket.Add(index);
        }
        return grid;
    }

    (int, int) CellKey(Point3d point, double cellSize)
    {
        return ((int)Math.Floor(point.X / cellSize), (int)Math.Floor(point.Y / cellSize));
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================
// 一個行人：位置、速度、走路快慢係數、移動軌跡、是否已抵達 goal
class Person
{
    public Point3d Position;
    public Vector3d Velocity;
    public double SpeedFactor;
    public Polyline Trail;
    public bool Arrived;

    public Person(Point3d position, double speedFactor)
    {
        Position = position;
        Velocity = Vector3d.Zero;
        SpeedFactor = speedFactor;
        Trail = new Polyline();
        Trail.Add(position);
        Arrived = false;
    }

    // 力 → 速度 → 位置：先把力累積進速度、限速，再移動一步並記軌跡
    public void Move(Vector3d force, double timeStep, double maxSpeed)
    {
        Velocity += force * timeStep;
        double speed = Velocity.Length;
        if (speed > maxSpeed && speed > 1e-9) Velocity *= maxSpeed / speed;
        Position += Velocity * timeStep;
        Trail.Add(Position);
    }
}
