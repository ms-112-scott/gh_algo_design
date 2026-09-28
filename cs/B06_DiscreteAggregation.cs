// =====================================================================
// B06 離散聚合（連接點規則生長，Discrete Aggregation）
// ---------------------------------------------------------------------
// 輸入
//   maxParts   (int)            零件數上限（含種子零件）
//   rules      (string)         連接規則，格式「母零件|接頭>子零件|接頭」，用分號分隔
//                               例如 "I|1>L|0; L|2>I|0; I|2>I|3"；空字串＝所有接頭都能互接
//   seed       (int)            亂數種子；同一個種子得到同一個聚合（可重現）
//   boundSize  (double)         邊界盒大小：X、Y 為 −b/2～b/2，Z 為 0～b（地面以下不長）
//   attractors (List<Point3d>)  吸引點（可不接）；有接時優先挑離吸引點近的開放接頭
//   maxTries   (int)            嘗試對齊的總次數上限（避免卡死）
// 輸出
//   parts      每個零件的 Mesh，順序＝加入順序（也就是組裝順序）
//   graph      連接圖：母零件中心 → 子零件中心的線段
//   frontier   結束時還開放的接頭平面（Z 軸朝外），可接 GH 的 Plane 預覽
//   info       零件數、嘗試次數、失敗次數、剩餘開放接頭數
// 說明：由 gh-new-algos 工作流程產生，尚未在 Rhino 中實測。
//       只用 RhinoCommon，不需外掛。零件由邊長 1 的小立方體組成，
//       所以碰撞只要檢查「新零件的立方體中心附近有沒有別的立方體中心」。
// =====================================================================
using System;
using System.Collections.Generic;
using Rhino.Geometry;
using Grasshopper.Kernel;

public class Script_Instance : GH_ScriptInstance
{
  private void RunScript(int maxParts, string rules, int seed, double boundSize,
    List<Point3d> attractors, int maxTries,
    ref object parts, ref object graph, ref object frontier, ref object info)
  {
    // 0. 防呆
    if (maxParts < 1) maxParts = 1;
    if (boundSize <= 1) boundSize = 12;
    if (maxTries < 1) maxTries = 5000;
    if (attractors == null) attractors = new List<Point3d>();

    // 1. DATA 零件庫與規則表
    List<PartType> types = BuildLibrary();
    List<Rule> ruleList = ParseRules(rules, types);
    if (ruleList.Count == 0) { Print("規則表是空的：檢查零件名稱（I、L）與接頭編號"); return; }
    var bounds = new BoundingBox(-boundSize / 2, -boundSize / 2, 0, boundSize / 2, boundSize / 2, boundSize);

    // 2. INIT 放入種子零件（第 0 種零件、不移動），把它的接頭全部放進開放清單
    var rnd = new Random(seed);
    var placed = new List<Placed>();
    var cellTree = new RTree();                 // 空間索引：所有已放立方體中心
    var open = new List<OpenConn>();            // 生長前緣：還空著的接頭
    var edges = new List<Line>();
    AddPart(types, 0, Transform.Identity, placed, cellTree, open, -1);

    // 3. LOOP 反覆挑一個開放接頭 → 找可用規則 → 對齊 → 檢查碰撞
    int tries = 0, fails = 0;
    while (placed.Count < maxParts && open.Count > 0 && tries < maxTries)
    {
      int oi = PickOpen(open, attractors, rnd);
      OpenConn o = open[oi];
      open.RemoveAt(oi);                        // 不論成功與否，這個接頭都不再開放
      int parentType = placed[o.Part].Type;

      // 3a. 這個接頭能用的規則，打亂順序
      var cand = new List<Rule>();
      foreach (var ru in ruleList)
        if (ru.ParentType == parentType && ru.ParentConn == o.Conn) cand.Add(ru);
      Shuffle(cand, rnd);

      bool ok = false;
      foreach (var ru in cand)
      {
        int[] rots = { 0, 1, 2, 3 };            // 子零件可繞接頭軸轉 0/90/180/270°
        Shuffle(rots, rnd);
        foreach (int rot in rots)
        {
          if (++tries > maxTries) break;
          Transform x = Align(types[ru.ChildType].Conns[ru.ChildConn], o.Pl, rot);
          if (!Fits(types[ru.ChildType], x, bounds, cellTree)) continue;   // 撞到或出界：放棄這個組合

          // 3b. 成功：加入零件、記錄連接圖
          AddPart(types, ru.ChildType, x, placed, cellTree, open, ru.ChildConn);
          edges.Add(new Line(placed[o.Part].Center, placed[placed.Count - 1].Center));
          ok = true;
          break;
        }
        if (ok || tries > maxTries) break;
      }
      if (!ok) fails++;
    }

    // 4. OUTPUT
    var meshes = new List<Mesh>();
    foreach (var p in placed) meshes.Add(p.Geometry);
    var planes = new List<Plane>();
    foreach (var o in open) planes.Add(o.Pl);
    parts = meshes;
    graph = edges;
    frontier = planes;
    info = string.Format("零件 {0} 個｜嘗試 {1} 次｜失敗接頭 {2} 個｜剩餘開放接頭 {3} 個",
      placed.Count, tries, fails, open.Count);
  }

  // ----- RunScript 下方、class 裡面 -----

  // 零件庫：I＝三格直條，L＝三格 L 形（在 XZ 平面折起來）
  // 接頭平面：原點在立方體面中心，Z 軸朝外；X 軸任選一條面內方向
  List<PartType> BuildLibrary()
  {
    var list = new List<PartType>();

    var I = new PartType { Name = "I" };
    I.Cells.AddRange(new[] { new Point3d(0, 0, 0), new Point3d(1, 0, 0), new Point3d(2, 0, 0) });
    I.Conns.Add(Face(new Point3d(-0.5, 0, 0), -Vector3d.XAxis, Vector3d.YAxis));   // I|0 左端
    I.Conns.Add(Face(new Point3d(2.5, 0, 0), Vector3d.XAxis, Vector3d.YAxis));     // I|1 右端
    I.Conns.Add(Face(new Point3d(1, 0, 0.5), Vector3d.ZAxis, Vector3d.YAxis));     // I|2 上方中央
    I.Conns.Add(Face(new Point3d(1, 0, -0.5), -Vector3d.ZAxis, Vector3d.YAxis));   // I|3 下方中央
    list.Add(I);

    var L = new PartType { Name = "L" };
    L.Cells.AddRange(new[] { new Point3d(0, 0, 0), new Point3d(1, 0, 0), new Point3d(1, 0, 1) });
    L.Conns.Add(Face(new Point3d(-0.5, 0, 0), -Vector3d.XAxis, Vector3d.YAxis));   // L|0 底端
    L.Conns.Add(Face(new Point3d(1, 0, 1.5), Vector3d.ZAxis, Vector3d.YAxis));     // L|1 頂端
    L.Conns.Add(Face(new Point3d(1.5, 0, 1), Vector3d.XAxis, Vector3d.YAxis));     // L|2 彎角外側
    L.Conns.Add(Face(new Point3d(0, -0.5, 0), -Vector3d.YAxis, Vector3d.ZAxis));   // L|3 側面
    list.Add(L);

    foreach (var t in list) t.Mesh = CellsToMesh(t.Cells);
    return list;
  }

  Plane Face(Point3d origin, Vector3d normal, Vector3d xDir)
  {
    return new Plane(origin, xDir, Vector3d.CrossProduct(normal, xDir));   // X × Y = normal
  }

  // 平面到平面：子接頭先繞自己的 X 軸翻 180°（Z 改朝內），再繞法線轉 rot×90°，最後對齊到母接頭
  Transform Align(Plane childConn, Plane target, int rot)
  {
    Plane f = childConn;
    f.Rotate(Math.PI, f.XAxis);
    f.Rotate(rot * Math.PI / 2, f.ZAxis);
    return Transform.PlaneToPlane(f, target);
  }

  // 碰撞與邊界：每個新立方體中心都要在邊界內，且 0.45 內沒有別的立方體中心
  bool Fits(PartType t, Transform x, BoundingBox bounds, RTree tree)
  {
    foreach (var c in t.Cells)
    {
      Point3d p = c; p.Transform(x);
      if (!bounds.Contains(p)) return false;
      bool hit = false;
      tree.Search(new Sphere(p, 0.45), (s, e) => { hit = true; e.Cancel = true; });
      if (hit) return false;
    }
    return true;
  }

  // 加入零件：寫入空間索引、把「沒用到的接頭」放進開放清單
  void AddPart(List<PartType> types, int type, Transform x, List<Placed> placed,
    RTree tree, List<OpenConn> open, int usedConn)
  {
    PartType t = types[type];
    int id = placed.Count;
    Mesh m = t.Mesh.DuplicateMesh(); m.Transform(x);
    var center = Point3d.Origin;
    foreach (var c in t.Cells)
    {
      Point3d p = c; p.Transform(x);
      tree.Insert(p, id);
      center += p;
    }
    placed.Add(new Placed { Type = type, Geometry = m, Center = center / t.Cells.Count });
    for (int k = 0; k < t.Conns.Count; k++)
    {
      if (k == usedConn) continue;               // 用來接母零件的那個接頭已經被佔用
      Plane pl = t.Conns[k]; pl.Transform(x);
      open.Add(new OpenConn { Part = id, Conn = k, Pl = pl });
    }
  }

  // 挑開放接頭：沒有吸引點就純隨機；有吸引點就抽 4 個、取最靠近吸引點的（競賽選擇）
  int PickOpen(List<OpenConn> open, List<Point3d> attractors, Random rnd)
  {
    if (attractors.Count == 0) return rnd.Next(open.Count);
    int best = -1; double bestD = double.MaxValue;
    for (int s = 0; s < 4; s++)
    {
      int i = rnd.Next(open.Count);
      double d = double.MaxValue;
      foreach (var a in attractors) d = Math.Min(d, a.DistanceTo(open[i].Pl.Origin));
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  // 規則字串 → 規則表；空字串時產生「所有接頭 × 所有接頭」
  List<Rule> ParseRules(string text, List<PartType> types)
  {
    var list = new List<Rule>();
    if (string.IsNullOrWhiteSpace(text))
    {
      for (int a = 0; a < types.Count; a++) for (int i = 0; i < types[a].Conns.Count; i++)
          for (int b = 0; b < types.Count; b++) for (int j = 0; j < types[b].Conns.Count; j++)
              list.Add(new Rule { ParentType = a, ParentConn = i, ChildType = b, ChildConn = j });
      return list;
    }
    foreach (string raw in text.Split(new[] { ';', '\n' }, StringSplitOptions.RemoveEmptyEntries))
    {
      string[] side = raw.Trim().Split('>');
      if (side.Length != 2) continue;
      int a, i, b, j;
      if (!ReadEnd(side[0], types, out a, out i) || !ReadEnd(side[1], types, out b, out j)) continue;
      list.Add(new Rule { ParentType = a, ParentConn = i, ChildType = b, ChildConn = j });
    }
    return list;
  }

  bool ReadEnd(string s, List<PartType> types, out int type, out int conn)
  {
    type = -1; conn = -1;
    string[] p = s.Trim().Split('|');
    if (p.Length != 2) return false;
    type = types.FindIndex(t => t.Name == p[0].Trim());
    if (type < 0 || !int.TryParse(p[1].Trim(), out conn)) return false;
    return conn >= 0 && conn < types[type].Conns.Count;
  }

  Mesh CellsToMesh(List<Point3d> cells)
  {
    var m = new Mesh();
    foreach (var c in cells)                    // 每格縮小一點，看得出零件之間的接縫
      m.Append(Mesh.CreateFromBox(new BoundingBox(c - new Vector3d(0.46, 0.46, 0.46),
        c + new Vector3d(0.46, 0.46, 0.46)), 1, 1, 1));
    m.Normals.ComputeNormals();
    return m;
  }

  void Shuffle<T>(IList<T> a, Random rnd)
  {
    for (int i = a.Count - 1; i > 0; i--) { int j = rnd.Next(i + 1); T t = a[i]; a[i] = a[j]; a[j] = t; }
  }
}

// ----- Script_Instance 外面 -----
class PartType
{
  public string Name;
  public List<Point3d> Cells = new List<Point3d>();   // 碰撞用的立方體中心（區域座標）
  public List<Plane> Conns = new List<Plane>();       // 接頭平面（區域座標，Z 朝外）
  public Mesh Mesh;
}
class Placed { public int Type; public Mesh Geometry; public Point3d Center; }
class OpenConn { public int Part; public int Conn; public Plane Pl; }
class Rule { public int ParentType, ParentConn, ChildType, ChildConn; }
