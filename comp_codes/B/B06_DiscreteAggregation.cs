// Grasshopper Script Instance
// ==================================================================
// B06 Discrete Aggregation (Connection-based Stochastic Aggregation)｜離散聚合（連接點規則生長）
// 家族：B 生長　邏輯：迭代模擬／幾何轉換　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   maxParts     int              Item   零件數上限（含種子零件）          例：40
//   rules        string           Item   連接規則「母|接頭>子|接頭」，分號分隔  例：（空字串＝全部互接）
//   seed         int              Item   亂數種子，同種子得到同一個聚合    例：0
//   boundSize    double           Item   邊界盒大小（Z 從 0 開始）         例：12
//   attractors   List<Point3d>    List   吸引點；有接時優先朝這裡長        例：（空清單）
//   maxTries     int              Item   對齊嘗試次數上限                  例：5000
// 輸出
//   out                                  Print 的文字（元件預設就有，不要刪）
//   parts                                每個零件的 Mesh，順序＝加入順序（組裝順序）
//   graph                                連接圖：母零件中心→子零件中心的線段
//   frontier                             結束時還開放的接頭平面（Z 軸朝外）
//   info                                 統計文字（零件數、嘗試次數、失敗接頭數、剩餘開放接頭、停止原因）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 零件庫先定義好：每種零件＝幾個邊長 1 的小立方體（碰撞用）＋數個接頭平面（Z 軸朝外）。
//   2. 放入種子零件，把它所有的接頭都列入「開放接頭」清單（生長前緣）。
//   3. 每一步從前緣挑一個接頭並移除，找出這個接頭能用的規則，打亂順序後逐一嘗試。
//   4. 每條規則試 0／90／180／270 度四種轉角：子零件接頭先翻 180 度再轉，對齊到母接頭。
//   5. 用 RTree 查新零件立方體會不會撞到既有零件、會不會出界；通過就加入零件、記一條連接圖的邊、把子零件其餘接頭併入前緣；全部失敗就算這個接頭失敗。
//   6. 重複到零件數上限、前緣清空或嘗試次數用完為止；碰到嘗試次數上限時，正在試的接頭放回前緣，不算失敗。
// ------------------------------------------------------------------
// 你應該看到：用預設值時，一顆種子零件從中心開始，反覆黏上新的直條與 L 形零件，長成一團可拆解的積木量體。
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
        int maxParts, string rules, int seed, double boundSize,
        List<Point3d> attractors, int maxTries,
        ref object parts, ref object graph, ref object frontier, ref object info)
    {
        // ===== 0. 防呆 =====
        if (maxParts < 1) maxParts = 40; maxParts = Math.Min(maxParts, MaxParts);        // 夾住上限，避免卡住 GH
        if (boundSize <= 1) boundSize = 12; boundSize = Math.Min(boundSize, MaxBoundSize);
        if (maxTries < 1) maxTries = 5000; maxTries = Math.Min(maxTries, MaxTries);
        if (attractors == null) attractors = new List<Point3d>();

        // ===== 1. DATA 資料：零件庫與規則表 =====
        List<PartType> types = BuildLibrary();
        List<Rule> ruleList = ParseRules(rules, types);
        if (ruleList.Count == 0)
        {
            Print("規則表是空的：檢查零件名稱（I、L）與接頭編號");
            parts = new List<Mesh>(); graph = new List<Line>(); frontier = new List<Plane>(); info = "";
            return;
        }
        var bounds = new BoundingBox(-boundSize / 2, -boundSize / 2, 0, boundSize / 2, boundSize / 2, boundSize);

        // ===== 2. INIT 初始：放入種子零件（第 0 種、不移動），接頭全部列入開放清單 =====
        var random = new Random(seed);
        var placed = new List<Placed>();
        var cellTree = new RTree();                    // 空間索引：所有已放立方體中心，查碰撞用
        var openConns = new List<OpenConn>();           // 生長前緣：還空著的接頭
        var edges = new List<Line>();
        AddPart(types, 0, Transform.Identity, placed, cellTree, openConns, -1);

        // ===== 3. LOOP 迭代：挑接頭→找規則→對齊→碰撞檢查，直到上限或前緣清空 =====
        int tries = 0; int fails = 0; bool triesExhausted = false;
        while (placed.Count < maxParts && openConns.Count > 0 && tries < maxTries)
        {
            int pickIndex = PickOpen(openConns, attractors, random);
            OpenConn openConn = openConns[pickIndex];
            openConns.RemoveAt(pickIndex);              // 先移出前緣；只有碰到嘗試上限中斷時才會放回去
            int parentType = placed[openConn.Part].Type;

            var candidates = new List<Rule>();
            foreach (var rule in ruleList)
                if (rule.ParentType == parentType && rule.ParentConn == openConn.Conn) candidates.Add(rule);
            Shuffle(candidates, random);

            bool success = false; bool hitLimit = false;
            foreach (var rule in candidates)
            {
                int[] rotations = { 0, 1, 2, 3 };       // 子零件可繞接頭法線轉 0/90/180/270 度
                Shuffle(rotations, random);
                foreach (int rotation in rotations)
                {
                    if (tries >= maxTries) { hitLimit = true; break; }   // 上限到了，這個接頭還沒試完
                    tries++;

                    Transform alignment = Align(types[rule.ChildType].Conns[rule.ChildConn], openConn.Frame, rotation);
                    if (!Fits(types[rule.ChildType], alignment, bounds, cellTree)) continue;    // 撞到或出界，換下一種

                    AddPart(types, rule.ChildType, alignment, placed, cellTree, openConns, rule.ChildConn);
                    edges.Add(new Line(placed[openConn.Part].Center, placed[placed.Count - 1].Center));
                    success = true;
                    break;
                }
                if (success || hitLimit) break;
            }

            if (hitLimit) { openConns.Add(openConn); triesExhausted = true; }   // 接頭沒試完，放回前緣，不算失敗
            else if (!success) fails++;
        }

        // ===== 4. OUTPUT 輸出 =====
        var meshes = new List<Mesh>();
        foreach (var one in placed) meshes.Add(one.Geometry);
        var openPlanes = new List<Plane>();
        foreach (var one in openConns) openPlanes.Add(one.Frame);

        string stopReason = placed.Count >= maxParts ? "達零件數上限" : triesExhausted ? "嘗試次數用完" : openConns.Count == 0 ? "前緣清空" : "提前結束";
        string summary = string.Format("零件 {0} 個｜嘗試 {1} 次｜失敗接頭 {2} 個｜剩餘開放接頭 {3} 個｜停止原因：{4}",
            placed.Count, tries, fails, openConns.Count, stopReason);

        parts = meshes;
        graph = edges;
        frontier = openPlanes;
        info = summary;
        Print(summary);
    }

    // ----- Fields 欄位 -----
    const double CollisionRadius = 0.45;   // 兩個立方體中心距離小於這個值就算撞到
    const int MaxParts = 2000;             // 零件數上限的上限，避免 slider 拉太大讓元件算太久
    const int MaxTries = 200000;           // 對齊嘗試次數上限的上限
    const double MaxBoundSize = 60;        // 邊界盒大小的上限

    // ----- RULE 規則：零件庫、對齊、碰撞判斷、加入零件、挑開放接頭 -----
    // 零件庫：I＝三格直條、L＝三格 L 形，各帶 4 個接頭（Z 軸朝外）
    List<PartType> BuildLibrary()
    {
        var list = new List<PartType>();

        var partI = new PartType { Name = "I" };
        partI.Cells.AddRange(new[] { new Point3d(0, 0, 0), new Point3d(1, 0, 0), new Point3d(2, 0, 0) });
        partI.Conns.Add(Face(new Point3d(-0.5, 0, 0), -Vector3d.XAxis, Vector3d.YAxis));   // I|0 左端
        partI.Conns.Add(Face(new Point3d(2.5, 0, 0), Vector3d.XAxis, Vector3d.YAxis));     // I|1 右端
        partI.Conns.Add(Face(new Point3d(1, 0, 0.5), Vector3d.ZAxis, Vector3d.YAxis));     // I|2 上方中央
        partI.Conns.Add(Face(new Point3d(1, 0, -0.5), -Vector3d.ZAxis, Vector3d.YAxis));   // I|3 下方中央
        list.Add(partI);

        var partL = new PartType { Name = "L" };
        partL.Cells.AddRange(new[] { new Point3d(0, 0, 0), new Point3d(1, 0, 0), new Point3d(1, 0, 1) });
        partL.Conns.Add(Face(new Point3d(-0.5, 0, 0), -Vector3d.XAxis, Vector3d.YAxis));   // L|0 底端
        partL.Conns.Add(Face(new Point3d(1, 0, 1.5), Vector3d.ZAxis, Vector3d.YAxis));     // L|1 頂端
        partL.Conns.Add(Face(new Point3d(1.5, 0, 1), Vector3d.XAxis, Vector3d.YAxis));     // L|2 彎角外側
        partL.Conns.Add(Face(new Point3d(0, -0.5, 0), -Vector3d.YAxis, Vector3d.ZAxis));   // L|3 側面
        list.Add(partL);

        foreach (var type in list) type.Mesh = CellsToMesh(type.Cells);
        return list;
    }

    // 對齊轉換：子接頭先繞自己的 X 軸翻 180°（讓法線反過來朝內，新零件才會長在母零件外側），
    // 再繞法線轉 rotation×90°，最後用 PlaneToPlane 對齊到母接頭
    Transform Align(Plane childConn, Plane target, int rotation)
    {
        Plane flipped = childConn;                      // Plane 是 struct，Rotate 要接回同一個變數
        flipped.Rotate(Math.PI, flipped.XAxis);
        flipped.Rotate(rotation * Math.PI / 2, flipped.ZAxis);
        return Transform.PlaneToPlane(flipped, target);
    }

    // 碰撞與邊界：新零件每個立方體中心都要在邊界內，且附近沒有別的立方體中心
    bool Fits(PartType type, Transform transform, BoundingBox bounds, RTree cellTree)
    {
        foreach (var cell in type.Cells)
        {
            Point3d point = cell;
            point.Transform(transform);
            if (!bounds.Contains(point)) return false;

            bool hit = false;
            cellTree.Search(new Sphere(point, CollisionRadius), (sender, e) => { hit = true; e.Cancel = true; });
            if (hit) return false;
        }
        return true;
    }

    // 加入零件：寫入空間索引與零件清單，把「沒用到的接頭」補進開放清單（前緣往外擴一圈）
    void AddPart(List<PartType> types, int type, Transform transform, List<Placed> placed,
        RTree cellTree, List<OpenConn> openConns, int usedConn)
    {
        PartType partType = types[type];
        int id = placed.Count;
        Mesh mesh = partType.Mesh.DuplicateMesh();
        mesh.Transform(transform);

        var center = Point3d.Origin;
        foreach (var cell in partType.Cells)
        {
            Point3d point = cell;
            point.Transform(transform);
            cellTree.Insert(point, id);
            center += point;
        }
        placed.Add(new Placed { Type = type, Geometry = mesh, Center = center / partType.Cells.Count });

        for (int connIndex = 0; connIndex < partType.Conns.Count; connIndex++)
        {
            if (connIndex == usedConn) continue;         // 用來接母零件的接頭已經被佔用，不再開放
            Plane plane = partType.Conns[connIndex];
            plane.Transform(transform);
            openConns.Add(new OpenConn { Part = id, Conn = connIndex, Frame = plane });
        }
    }

    // 挑開放接頭：沒有吸引點就純隨機；有吸引點就抽 4 個候選、取離吸引點最近的（競賽選擇，讓生長偏向吸引點又保留隨機性）
    int PickOpen(List<OpenConn> openConns, List<Point3d> attractors, Random random)
    {
        if (attractors.Count == 0) return random.Next(openConns.Count);

        int best = 0;
        double bestDistance = double.MaxValue;
        for (int sample = 0; sample < 4; sample++)
        {
            int index = random.Next(openConns.Count);
            double distance = double.MaxValue;
            foreach (var attractor in attractors)
                distance = Math.Min(distance, attractor.DistanceTo(openConns[index].Frame.Origin));
            if (distance < bestDistance) { bestDistance = distance; best = index; }
        }
        return best;
    }

    // ----- Helpers 工具 -----
    // 面中心＋法線＋面內 X 方向 → 接頭平面（Y 軸由 normal × xDir 算出，維持右手系）
    Plane Face(Point3d origin, Vector3d normal, Vector3d xDir)
    {
        return new Plane(origin, xDir, Vector3d.CrossProduct(normal, xDir));
    }

    // 規則字串「母|接頭>子|接頭」（分號分隔）→ 規則表；空字串代表所有接頭都能互接
    List<Rule> ParseRules(string text, List<PartType> types)
    {
        var list = new List<Rule>();
        if (string.IsNullOrWhiteSpace(text))
        {
            for (int a = 0; a < types.Count; a++)
                for (int connA = 0; connA < types[a].Conns.Count; connA++)
                    for (int b = 0; b < types.Count; b++)
                        for (int connB = 0; connB < types[b].Conns.Count; connB++)
                            list.Add(new Rule { ParentType = a, ParentConn = connA, ChildType = b, ChildConn = connB });
            return list;
        }

        foreach (string raw in text.Split(new[] { ';', '\n' }, StringSplitOptions.RemoveEmptyEntries))
        {
            string[] side = raw.Trim().Split('>');
            if (side.Length != 2) continue;

            int parentType, parentConn, childType, childConn;
            if (!ReadEnd(side[0], types, out parentType, out parentConn)) continue;
            if (!ReadEnd(side[1], types, out childType, out childConn)) continue;
            list.Add(new Rule { ParentType = parentType, ParentConn = parentConn, ChildType = childType, ChildConn = childConn });
        }
        return list;
    }

    // 「I|1」這種一端的寫法 → 零件編號、接頭編號
    bool ReadEnd(string text, List<PartType> types, out int type, out int conn)
    {
        type = -1; conn = -1;
        string[] pieces = text.Trim().Split('|');
        if (pieces.Length != 2) return false;

        type = types.FindIndex(t => t.Name == pieces[0].Trim());
        if (type < 0 || !int.TryParse(pieces[1].Trim(), out conn)) return false;
        return conn >= 0 && conn < types[type].Conns.Count;
    }

    // 立方體清單 → Mesh；每格稍微縮小一點，讓零件之間看得出接縫
    Mesh CellsToMesh(List<Point3d> cells)
    {
        var mesh = new Mesh();
        foreach (var cell in cells)
            mesh.Append(Mesh.CreateFromBox(new BoundingBox(
                cell - new Vector3d(0.46, 0.46, 0.46), cell + new Vector3d(0.46, 0.46, 0.46)), 1, 1, 1));
        mesh.Normals.ComputeNormals();
        return mesh;
    }

    // 陣列／清單洗牌（Fisher-Yates），讓規則與轉角的嘗試順序每次不同
    void Shuffle<T>(IList<T> list, Random random)
    {
        for (int i = list.Count - 1; i > 0; i--)
        {
            int j = random.Next(i + 1);
            T temp = list[i]; list[i] = list[j]; list[j] = temp;
        }
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================

// 一種零件的定義：名稱、碰撞用的立方體中心（區域座標）、接頭平面（區域座標，Z 軸朝外）、對應的 Mesh
class PartType
{
    public string Name; public List<Point3d> Cells = new List<Point3d>(); public List<Plane> Conns = new List<Plane>(); public Mesh Mesh;
}

// 已經放進聚合體的一個零件：種類、世界座標下的 Mesh 與中心點
class Placed
{
    public int Type; public Mesh Geometry; public Point3d Center;
}

// 生長前緣上的一個開放接頭：屬於哪個零件、第幾個接頭、世界座標下的平面
class OpenConn
{
    public int Part; public int Conn; public Plane Frame;
}

// 一條連接規則：母零件種類與接頭編號 → 子零件種類與接頭編號
class Rule
{
    public int ParentType; public int ParentConn; public int ChildType; public int ChildConn;
}
