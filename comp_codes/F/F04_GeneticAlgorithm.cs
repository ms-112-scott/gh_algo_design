// Grasshopper Script Instance
// ==================================================================
// F04 Genetic Algorithm｜基因演算法
// 家族：F 圖樣與最佳化　邏輯：搜尋／求解　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   populationSize   int     Item   族群大小（每代幾組方案）        例：60
//   generations      int     Item   演化幾代                        例：80
//   mutationRate     double  Item   每個點的突變機率（0～1）        例：0.05
//   seed             int     Item   隨機種子                        例：1
//   pointCount       int     Item   每組方案的點數（基因長度）      例：12
//   width            double  Item   基地寬（X 方向範圍）            例：40.0
//   height           double  Item   基地深（Y 方向範圍）            例：40.0
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   bestPoints                   目前最佳方案的點
//   bestScores                   每一代最佳分數（收斂曲線）
//   bestScore                    最終最佳分數
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 一組方案（基因）＝一組點的座標；隨機產生 populationSize 組成為第一代。
//   2. 每組用 ScoreOf 打分數：所有點兩兩之間「最近的距離」，越大代表點越分散、分數越高。
//   3. 依分數排序，最好的 EliteCount 組直接晉級下一代（精英，不會被突變破壞）。
//   4. 其餘名額：用比賽制（Tournament）各挑一位父母，逐點隨機繼承其中一方（均勻交配）生出小孩。
//   5. 小孩的每個點再以 mutationRate 的機率小幅隨機移動（突變），但不移出基地範圍。
//   6. 重複 generations 代，每代記錄當時最佳分數；代數用完後，回報最終最佳方案與整條收斂曲線。
// ------------------------------------------------------------------
// 你應該看到：12 個點在 40×40 的基地裡，經過 80 代演化後彼此盡量散開（接近規則網格），收斂曲線先快速上升後趨於平緩
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
        int populationSize, int generations, double mutationRate, int seed,
        int pointCount, double width, double height,
        ref object bestPoints, ref object bestScores, ref object bestScore)
    {
        // ===== 0. 防呆 =====
        if (pointCount <= 0) pointCount = 12;                  // 沒接 → 預設 12 個點
        if (width <= 0) width = 40.0;                          // 沒接 → 預設基地寬 40
        if (height <= 0) height = 40.0;                        // 沒接 → 預設基地深 40
        if (populationSize <= 0) populationSize = 60;          // 沒接 → 預設族群 60
        if (generations <= 0) generations = 80;                // 沒接 → 預設演化 80 代
        pointCount = Math.Max(2, Math.Min(pointCount, MaxPointCount));                    // 至少要 2 個點才算得出距離
        populationSize = Math.Max(EliteCount + 2, Math.Min(populationSize, MaxPopulation)); // 至少要留給精英＋交配的名額
        generations = Math.Max(1, Math.Min(generations, MaxGenerations));
        mutationRate = Math.Max(0.0, Math.Min(1.0, mutationRate));                        // 夾在 0～1，0 也合法（代表不突變）

        // ===== 1. DATA 資料 =====
        var random = new Random(seed);
        var population = new List<Candidate>();
        var bestScoreHistory = new List<double>();             // 每一代最佳分數，畫出來就是收斂曲線

        // ===== 2. INIT 初始：第一代全部隨機亂丟 =====
        for (int number = 0; number < populationSize; number++)
            population.Add(Candidate.CreateRandom(pointCount, width, height, random));

        // ===== 3. LOOP 迭代：評分 → 精英 → 交配突變補滿，重複 generations 次 =====
        for (int generation = 1; generation <= generations; generation++)
        {
            foreach (Candidate candidate in population)
                candidate.Score = ScoreOf(candidate.Points);

            population.Sort((first, second) => second.Score.CompareTo(first.Score));  // 分數高的排前面
            bestScoreHistory.Add(population[0].Score);

            var nextGeneration = new List<Candidate>();
            for (int eliteIndex = 0; eliteIndex < EliteCount; eliteIndex++)
                nextGeneration.Add(population[eliteIndex].Copy());   // 一定要 Copy：陣列是參考型別，直接放同一個會被下面的突變波及

            while (nextGeneration.Count < populationSize)
            {
                Candidate parentA = PickByTournament(population, random);
                Candidate parentB = PickByTournament(population, random);
                Candidate child = Crossover(parentA, parentB, random);
                Mutate(child, mutationRate, width, height, random);
                nextGeneration.Add(child);
            }

            population = nextGeneration;
        }

        // ===== 4. OUTPUT 輸出 =====
        foreach (Candidate candidate in population)
            candidate.Score = ScoreOf(candidate.Points);
        population.Sort((first, second) => second.Score.CompareTo(first.Score));
        Candidate winner = population[0];

        Print(string.Format("演化 {0} 代，族群 {1}，最佳分數 {2:F3}", generations, populationSize, winner.Score));
        bestPoints = new List<Point3d>(winner.Points);
        bestScores = bestScoreHistory;
        bestScore = winner.Score;
    }

    // ----- Fields 欄位 -----
    const int EliteCount = 2;              // 每代直接晉級的精英數量：太多會太保守，太少容易把好基因弄丟
    const int TournamentSize = 3;          // 比賽制抽幾位候選人：越多選擇壓力越大，收斂越快但多樣性越低
    const int MaxPopulation = 200;         // 族群人數上限，避免每代運算量暴衝
    const int MaxGenerations = 300;        // 演化代數上限
    const int MaxPointCount = 50;          // 基因長度（點數）上限：ScoreOf 是兩兩比較，點數平方成長
    const double MutationMoveRatio = 0.15; // 突變一次最多移動「短邊 × 這個比例」的距離

    // ----- RULE 規則：分數＝所有點兩兩之間最近的距離，越分散分數越高 -----
    double ScoreOf(Point3d[] points)
    {
        double nearestDistance = double.MaxValue;
        for (int first = 0; first < points.Length; first++)
        {
            for (int second = first + 1; second < points.Length; second++)
            {
                double distance = points[first].DistanceTo(points[second]);
                if (distance < nearestDistance) nearestDistance = distance;
            }
        }
        return nearestDistance;
    }

    // 比賽制選親代：隨機抽 TournamentSize 組，分數最高的當贏家（用 LINQ 依分數由高到低排，取第一個）
    Candidate PickByTournament(List<Candidate> population, Random random)
    {
        var contenders = new List<Candidate>();
        for (int number = 0; number < TournamentSize; number++)
            contenders.Add(population[random.Next(population.Count)]);
        return contenders.OrderByDescending(candidate => candidate.Score).First();
    }

    // 均勻交配：每個點各自獨立擲硬幣，決定繼承爸爸還是媽媽
    Candidate Crossover(Candidate parentA, Candidate parentB, Random random)
    {
        int pointCount = parentA.Points.Length;
        var childPoints = new Point3d[pointCount];
        for (int number = 0; number < pointCount; number++)
            childPoints[number] = random.NextDouble() < 0.5 ? parentA.Points[number] : parentB.Points[number];
        return new Candidate(childPoints);
    }

    // 突變：少數點依 mutationRate 的機率小幅隨機移動，並夾在基地矩形內（不出界）
    void Mutate(Candidate candidate, double mutationRate, double width, double height, Random random)
    {
        double moveRange = Math.Min(width, height) * MutationMoveRatio;
        for (int number = 0; number < candidate.Points.Length; number++)
        {
            if (random.NextDouble() >= mutationRate) continue;

            double newX = candidate.Points[number].X + (random.NextDouble() * 2 - 1) * moveRange;
            double newY = candidate.Points[number].Y + (random.NextDouble() * 2 - 1) * moveRange;
            newX = Math.Max(0, Math.Min(width, newX));
            newY = Math.Max(0, Math.Min(height, newY));
            candidate.Points[number] = new Point3d(newX, newY, 0);
        }
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================
// 一組方案（一條「基因」）：一組點的座標 + 它的分數
class Candidate
{
    public Point3d[] Points;
    public double Score;

    public Candidate(Point3d[] points)
    {
        Points = points;
        Score = 0;
    }

    // 隨機產生一組方案：每個點落在 width × height 的矩形範圍內
    public static Candidate CreateRandom(int pointCount, double width, double height, Random random)
    {
        var points = new Point3d[pointCount];
        for (int number = 0; number < pointCount; number++)
            points[number] = new Point3d(random.NextDouble() * width, random.NextDouble() * height, 0);
        return new Candidate(points);
    }

    // 深拷貝：陣列（Points）是參考型別，若只複製 Candidate 物件，兩份會共用同一個陣列，
    // 之後對其中一份做 Mutate 會連另一份（例如精英）一起改到，必須用 Clone 出新陣列
    public Candidate Copy()
    {
        var clonedPoints = (Point3d[])Points.Clone();
        var copy = new Candidate(clonedPoints);
        copy.Score = Score;
        return copy;
    }
}
