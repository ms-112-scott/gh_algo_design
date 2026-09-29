// Grasshopper Script Instance
// ==================================================================
// B03 Space Colonization｜空間殖民
// 家族：B 生長　邏輯：迭代模擬　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   influenceRadius   double        Item   枝端能感應到吸引點的距離        例：15.0
//   killDistance      double        Item   枝端多近就把吸引點吃掉          例：3.0
//   segmentLength     double        Item   每一步生長的長度                例：1.5
//   attractorCount    int           Item   沒接 attractors 時隨機撒幾個    例：250
//   boxSize           double        Item   隨機撒點方塊的邊長              例：40.0
//   maxSteps          int           Item   最多長幾步                      例：150
//   seed              int           Item   隨機種子                        例：1
//   attractors        Point3d       List   養分點；不接就在根部上方隨機撒  例：(空＝隨機)
//   rootPoint         Point3d       Item   樹的根節點                      例：原點 (0,0,0)
// 輸出
//   out                                    Print 的文字（元件預設就有，不要刪）
//   branches                               每個節點連回母節點的線段
//   remainingAttractors                    跑完後還沒被吃掉的吸引點
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 沒接吸引點就在 rootPoint 正上方的方塊內隨機撒 attractorCount 個養分點。
//   2. 每一步：每個吸引點找離它最近的枝端；距離 < killDistance 就吃掉它，距離 < influenceRadius 就對那個枝端加一個單位拉力。
//   3. 每個被拉的枝端把這一步收到的拉力加總取單位方向，往該方向長出一節 segmentLength、記住自己的母節點索引。
//   4. 這一步完全沒有枝端被拉（還沒進入任何吸引點的感應範圍）→ 讓最新一個枝端直接朝最近的吸引點長一節，當作樹幹階段。
//   5. 重複到吸引點吃光、長不出來（方向算不出來，或枝端卡住、新節點跟舊節點疊在一起＝長不動）或到 maxSteps 為止；只讓這一步開始前就存在的枝端參與生長，避免同一步無限連鎖生長。
// ------------------------------------------------------------------
// 你應該看到：根部一根樹幹先朝點雲區摸過去，進入範圍後開始分岔，最後在方塊裡長成一叢分枝均勻的樹狀結構。
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
        double influenceRadius, double killDistance, double segmentLength,
        int attractorCount, double boxSize, int maxSteps, int seed,
        List<Point3d> attractors, Point3d rootPoint,
        ref object branches, ref object remainingAttractors)
    {
        // ===== 0. 防呆 =====
        var adjustmentNotes = new List<string>();                                       // 記錄哪些參數被自動調整過，最後印出來讓使用者知道
        if (influenceRadius <= 0) influenceRadius = 15.0;
        if (killDistance <= 0) killDistance = 3.0;
        if (segmentLength <= 0) segmentLength = 1.5;
        if (killDistance >= influenceRadius)
        {
            killDistance = influenceRadius * 0.5;                                       // 感應範圍要包住吃掉範圍，否則枝端永遠碰不到就被吃掉
            adjustmentNotes.Add("killDistance 已縮成 influenceRadius 的一半");
        }
        if (segmentLength >= killDistance)
        {
            segmentLength = killDistance * 0.5;                                         // 一步跨太大會跳過吸引點、來回抖動
            adjustmentNotes.Add("segmentLength 已縮成 killDistance 的一半");
        }
        if (attractorCount > MaxAttractorCount) adjustmentNotes.Add("attractorCount 已截到上限 " + MaxAttractorCount);
        attractorCount = attractorCount <= 0 ? 250 : Math.Min(attractorCount, MaxAttractorCount);
        if (boxSize <= 0) boxSize = 40.0;
        if (maxSteps > MaxStepCount) adjustmentNotes.Add("maxSteps 已截到上限 " + MaxStepCount);
        maxSteps = maxSteps <= 0 ? 150 : Math.Min(maxSteps, MaxStepCount);
        if (seed == 0) seed = 1;                                                         // 沒接時跟檔頭「例：1」一致，避免看起來像沒設種子

        // ===== 1. DATA 資料 =====
        var random = new Random(seed);
        List<Point3d> activeAttractors;
        if (attractors == null || attractors.Count == 0)
        {
            activeAttractors = RandomPointsAboveRoot(rootPoint, attractorCount, boxSize, random);   // 沒接 → 根部上方方塊內隨機撒點
        }
        else
        {
            activeAttractors = new List<Point3d>(attractors);                                       // 有接 → 直接用使用者給的養分點
            if (activeAttractors.Count > MaxAttractorCount)
            {
                activeAttractors = activeAttractors.GetRange(0, MaxAttractorCount);                  // 吸引點太多時每步要跟全部節點配對，成本爆炸，只取前面的點
                adjustmentNotes.Add("attractors 已截到前 " + MaxAttractorCount + " 個");
            }
        }
        var nodes = new List<TreeNode>();

        // ===== 2. INIT 初始：樹一開始只有一個根節點 =====
        nodes.Add(new TreeNode(rootPoint, -1));                                          // 母節點索引 -1＝根，沒有母節點

        // ===== 3. LOOP 迭代：吸引點吃光、長不出來或到上限就停 =====
        int usedSteps = 0;
        bool hitNodeLimit = false;
        bool stoppedGrowing = false;
        for (int step = 1; step <= maxSteps; step++)
        {
            if (activeAttractors.Count == 0) break;                                      // 吸引點吃光 → 停
            if (nodes.Count >= MaxNodeCount) { hitNodeLimit = true; break; }              // 節點數到上限 → 停，避免長到當機
            usedSteps = step;
            bool grew = GrowOneStep(nodes, activeAttractors, influenceRadius, killDistance, segmentLength);
            if (!grew) { stoppedGrowing = true; break; }                                 // 長不出來（方向算不出來，或枝端卡住）→ 停
        }
        bool hitStepLimit = usedSteps == maxSteps && activeAttractors.Count > 0 && !hitNodeLimit && !stoppedGrowing;

        // ===== 4. OUTPUT 輸出：每個節點連回母節點 =====
        var allBranches = new List<Line>();
        for (int index = 0; index < nodes.Count; index++)
        {
            if (nodes[index].ParentIndex < 0) continue;                                  // 根節點沒有母節點，不連線
            allBranches.Add(new Line(nodes[nodes[index].ParentIndex].Position, nodes[index].Position));
        }
        string adjustmentText = adjustmentNotes.Count > 0 ? "；" + string.Join("、", adjustmentNotes) : "";
        Print("長了 {0} 步，節點 {1} 個，剩下吸引點 {2} 個{3}{4}{5}",
            usedSteps, nodes.Count, activeAttractors.Count,
            hitNodeLimit ? "（已達節點數上限）" : "",
            hitStepLimit ? "（已達 maxSteps 上限）" : "",
            adjustmentText);
        branches = allBranches;
        remainingAttractors = activeAttractors;
    }

    // ----- Fields 欄位 -----
    const int MaxAttractorCount = 600;     // 吸引點上限：隨機撒點數與使用者接進來的 attractors 清單都用這個上限，吸引點越多每步配對越貴
    const int MaxStepCount = 300;          // maxSteps 上限
    const int MaxNodeCount = 4000;         // 節點總數上限，避免分枝多到讓 GH 卡住

    // ----- RULE 規則：吸引點拉最近枝端，太近就吃掉；被拉的枝端往平均方向長一節 -----
    bool GrowOneStep(List<TreeNode> nodes, List<Point3d> activeAttractors,
        double influenceRadius, double killDistance, double segmentLength)
    {
        int nodeCountBeforeGrowth = nodes.Count;              // 只讓這一步開始前就存在的枝端生長，新長出來的節點這一步不再被拉
        var pulls = new Dictionary<int, Vector3d>();          // 枝端索引 → 這一步收到的拉力總和

        for (int attractorIndex = activeAttractors.Count - 1; attractorIndex >= 0; attractorIndex--)   // 倒序：中途要 RemoveAt
        {
            Point3d attractor = activeAttractors[attractorIndex];
            int nearestIndex = NearestNode(attractor, nodes, nodeCountBeforeGrowth);
            if (nearestIndex < 0) continue;

            double distance = attractor.DistanceTo(nodes[nearestIndex].Position);
            if (distance < killDistance)
            {
                activeAttractors.RemoveAt(attractorIndex);    // 吃掉：這顆養分已經被吸收
                continue;
            }
            if (distance < influenceRadius)
            {
                Vector3d pull = attractor - nodes[nearestIndex].Position;
                pull.Unitize();
                if (pulls.ContainsKey(nearestIndex))
                    pulls[nearestIndex] = pulls[nearestIndex] + pull;
                else
                    pulls[nearestIndex] = pull;
            }
        }

        if (pulls.Count > 0)
        {
            var pulledIndices = new List<int>(pulls.Keys);
            pulledIndices.Sort();                              // 固定順序：同一個 seed 每次跑出一樣的樹
            bool grewAny = false;
            double duplicateDistance = segmentLength * 0.01;   // 新節點跟既有節點幾乎疊在一起，視為卡住重複
            foreach (int nodeIndex in pulledIndices)
            {
                Vector3d direction = pulls[nodeIndex];
                if (!direction.Unitize()) continue;             // 拉力剛好互相抵消（極少見）→ 這個枝端這一步先不長
                Point3d newPosition = nodes[nodeIndex].Position + direction * segmentLength;
                int nearestExisting = NearestNode(newPosition, nodes, nodes.Count);
                if (nearestExisting >= 0 && newPosition.DistanceTo(nodes[nearestExisting].Position) < duplicateDistance)
                    continue;                                    // 枝端被方向幾乎相反的吸引點拉住，新位置跟舊節點重疊 → 不要重複長出同一個點
                nodes.Add(new TreeNode(newPosition, nodeIndex));
                grewAny = true;
            }
            return grewAny;                                      // 只要有枝端被拉，就不進入樹幹階段；一個新節點都沒長出來＝這一步長不動
        }
        if (activeAttractors.Count == 0) return true;            // 剛好在這一步把所有吸引點都吃光，沒有東西可以再長，這一步算做完

        // 樹幹階段：還沒有枝端進入任何吸引點的感應範圍，讓最新的枝端直接朝最近的吸引點長一節
        Point3d tipPosition = nodes[nodeCountBeforeGrowth - 1].Position;
        Point3d nearestAttractor = activeAttractors.OrderBy(point => tipPosition.DistanceTo(point)).First();
        Vector3d stemDirection = nearestAttractor - tipPosition;
        if (!stemDirection.Unitize()) return false;             // 枝端剛好疊在吸引點上，方向算不出來 → 這一步長不出來
        Point3d stemNewPosition = tipPosition + stemDirection * segmentLength;
        nodes.Add(new TreeNode(stemNewPosition, nodeCountBeforeGrowth - 1));
        return true;
    }

    // ----- Helpers 工具 -----
    // 找 nodes[0..nodeCount) 裡離 fromPoint 最近的枝端索引（用平方距離比較，省開根號）
    int NearestNode(Point3d fromPoint, List<TreeNode> nodes, int nodeCount)
    {
        int bestIndex = -1;
        double bestDistanceSquared = double.MaxValue;
        for (int index = 0; index < nodeCount; index++)
        {
            double distanceSquared = (fromPoint - nodes[index].Position).SquareLength;
            if (distanceSquared < bestDistanceSquared)
            {
                bestDistanceSquared = distanceSquared;
                bestIndex = index;
            }
        }
        return bestIndex;
    }

    // 根部（rootPoint）正上方的方塊內隨機撒點，當作沒接 attractors 時的預設養分點雲
    List<Point3d> RandomPointsAboveRoot(Point3d rootPoint, int count, double boxSize, Random random)
    {
        var points = new List<Point3d>();
        for (int index = 0; index < count; index++)
        {
            double x = rootPoint.X + (random.NextDouble() - 0.5) * boxSize;
            double y = rootPoint.Y + (random.NextDouble() - 0.5) * boxSize;
            double z = rootPoint.Z + boxSize * (0.5 + random.NextDouble());       // 離根部拉開一段距離再撒，才看得到樹幹階段先摸過去
            points.Add(new Point3d(x, y, z));
        }
        return points;
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================
// 樹節點：自己的位置 + 母節點索引（-1＝根節點，沒有母節點）
class TreeNode
{
    public Point3d Position;
    public int ParentIndex;

    public TreeNode(Point3d position, int parentIndex)
    {
        Position = position;
        ParentIndex = parentIndex;
    }
}
