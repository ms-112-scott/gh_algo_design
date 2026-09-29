// Grasshopper Script Instance
// ==================================================================
// G03 Flow Accumulation & Watershed Delineation (D8)｜地表逕流與集水區（D8 流向累積）
// 家族：G 空間分析　邏輯：搜尋／求解　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   terrain          Mesh    Item   地形（Surface／Brep 會自動轉成 Mesh）      例：（空＝內建丘陵地形）
//   cellCount        int     Item   長邊的格子數                             例：80
//   fillSinks        bool    Item   是否先做 Priority-Flood 填窪               例：true
//   streamThreshold  double  Item   成為河道所需的最小累積格數                 例：15
//   basinCount       int     Item   要上色的最大集水區數                       例：4
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   streams                      河道線段（Polyline，每段在兩個匯流點之間）
//   orders                       每段河道的 Strahler 河序（與 streams 順序相同）
//   basins                       依集水區上色的格子 Mesh
//   flowLines                    每格指向下游的短箭頭線（Line）
//   info                         統計文字（格子數、填窪格數、最大累積量、河段數、集水區數）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 取樣：地形轉成 Mesh，從每格中心正上方往下打射線量高程；沒打到＝地形外，記成無資料。
//   2. 填窪：Priority-Flood 從邊界往內「淹水」，把封閉窪地抬到剛好能溢流的高度（+ε），確保每格都有下坡路。
//   3. 流向（D8）：每格比較 8 個鄰居的「高差 ÷ 距離」（對角要除以 √2），取最陡的一個當下游；沒有更低鄰居＝出口。
//   4. 累積：依高程由高到低走訪，把每格的水量（各 1 單位）加給下游，同時往上累出 Strahler 河序。
//   5. 河網：累積量達到 streamThreshold 的格子沿著下游箭頭追成一段段 Polyline，在每個匯流點斷開。
//   6. 集水區：依高程由低到高，每格直接繼承下游格的出口編號；面積最大的 basinCount 個上色，其餘灰色。
// ------------------------------------------------------------------
// 你應該看到：不接地形時，一片內建的起伏丘陵上長出好幾條河網，往低處匯流成幾個上色的集水區，箭頭都指向下坡
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
        Mesh terrain, int cellCount, bool fillSinks, double streamThreshold, int basinCount,
        ref object streams, ref object orders, ref object basins, ref object flowLines, ref object info)
    {
        // ===== 0. 防呆 =====
        if (terrain == null || terrain.Vertices.Count == 0) terrain = DefaultTerrain();   // 沒接地形 → 內建丘陵
        if (cellCount <= 0) cellCount = 80; cellCount = Math.Max(MinCellCount, Math.Min(cellCount, MaxCellCount));
        if (streamThreshold <= 0) streamThreshold = 15; if (basinCount <= 0) basinCount = MinBasinCount;

        // ===== 1. DATA 資料：從上方打射線取樣高程格子 =====
        double[] elevation = SampleElevations(terrain, cellCount);
        int cellTotal = gridColumns * gridRows;

        // ===== 2. INIT 初始：填窪、D8 流向、依高程排序 =====
        double[] elevationFilled = (double[]) elevation.Clone();
        int filledCount = fillSinks ? PriorityFlood(elevationFilled, cellSize * 1e-4) : 0;
        int[] downstream = ComputeFlowDirections(elevationFilled);
        int[] order = new int[cellTotal]; for (int k = 0; k < cellTotal; k++) order[k] = k;
        double[] sortKey = new double[cellTotal];
        for (int k = 0; k < cellTotal; k++) sortKey[k] = double.IsNaN(elevationFilled[k]) ? double.MinValue : -elevationFilled[k];
        Array.Sort(sortKey, order);                            // 由高到低，累積時上游一定先處理完

        // ===== 3. LOOP 迭代：累積水量、追河網、標集水區 =====
        double[] accumulation = new double[cellTotal];
        for (int k = 0; k < cellTotal; k++) accumulation[k] = double.IsNaN(elevationFilled[k]) ? 0 : 1;   // 每格降雨 1 單位
        int[] inflowStreamCount = new int[cellTotal];   // 這一格有幾條河道流進來（判斷是不是匯流點）
        int[] strahlerOrder = new int[cellTotal], topStrahler = new int[cellTotal], topStrahlerCount = new int[cellTotal];

        // --- 由高到低：把水量交給下游，順便往上游疊出 Strahler 河序 ---
        foreach (int k in order)
        {
            if (accumulation[k] <= 0) continue;
            bool isStream = accumulation[k] >= streamThreshold;
            if (isStream)
                strahlerOrder[k] = topStrahler[k] == 0 ? 1 : (topStrahlerCount[k] >= 2 ? topStrahler[k] + 1 : topStrahler[k]);
            int downCell = downstream[k];
            if (downCell < 0) continue;
            accumulation[downCell] += accumulation[k];
            if (!isStream) continue;
            inflowStreamCount[downCell]++;
            if (strahlerOrder[k] > topStrahler[downCell]) { topStrahler[downCell] = strahlerOrder[k]; topStrahlerCount[downCell] = 1; }
            else if (strahlerOrder[k] == topStrahler[downCell]) topStrahlerCount[downCell]++;
        }

        // --- 河網：從源頭或匯流點沿著下游箭頭追到下一個匯流點，斷成一段段 ---
        var streamLines = new List<Polyline>(); var streamOrders = new List<int>();
        for (int k = 0; k < cellTotal; k++)
        {
            bool isSourceOrJunction = accumulation[k] >= streamThreshold && inflowStreamCount[k] != 1;
            if (!isSourceOrJunction || downstream[k] < 0) continue;
            var segment = new Polyline();
            segment.Add(CellPoint(k, elevationFilled)); int current = k;
            while (downstream[current] >= 0)
            {
                current = downstream[current];
                segment.Add(CellPoint(current, elevationFilled));
                if (inflowStreamCount[current] != 1) break;   // 到達下一個匯流點：這段河道結束
            }
            streamLines.Add(segment);
            streamOrders.Add(strahlerOrder[k]);
        }

        // --- 集水區：由低到高，每格直接繼承下游格的出口編號 ---
        int[] basinLabel = new int[cellTotal];
        for (int idx = cellTotal - 1; idx >= 0; idx--)         // order 反過來走 = 由低到高
        {
            int k = order[idx];
            if (double.IsNaN(elevationFilled[k])) { basinLabel[k] = -1; continue; }
            basinLabel[k] = downstream[k] < 0 ? k : basinLabel[downstream[k]];
        }

        // ===== 4. OUTPUT 輸出：上色、畫箭頭、統計摘要 =====
        var basinSize = new Dictionary<int, int>();
        foreach (int label in basinLabel) if (label >= 0) basinSize[label] = basinSize.ContainsKey(label) ? basinSize[label] + 1 : 1;
        var rankedBasins = new List<int>(basinSize.Keys);
        rankedBasins.Sort((a, b) => basinSize[b].CompareTo(basinSize[a]));      // 面積大的排前面
        var basinColor = new Dictionary<int, Color>();
        for (int rank = 0; rank < rankedBasins.Count; rank++)
            basinColor[rankedBasins[rank]] = rank < basinCount ? Hue(rank * 0.61803) : Color.FromArgb(90, 90, 90);

        var basinMesh = new Mesh(); var arrows = new List<Line>();
        for (int k = 0; k < cellTotal; k++)
        {
            if (basinLabel[k] < 0) continue;
            int i = k % gridColumns, j = k / gridColumns;
            double x0 = terrainBox.Min.X + i * cellSize, y0 = terrainBox.Min.Y + j * cellSize, h = elevation[k];
            int vertexStart = basinMesh.Vertices.Count;
            basinMesh.Vertices.Add(x0, y0, h);
            basinMesh.Vertices.Add(x0 + cellSize, y0, h);
            basinMesh.Vertices.Add(x0 + cellSize, y0 + cellSize, h);
            basinMesh.Vertices.Add(x0, y0 + cellSize, h);
            Color color = basinColor[basinLabel[k]];
            for (int corner = 0; corner < 4; corner++) basinMesh.VertexColors.Add(color);
            basinMesh.Faces.AddFace(vertexStart, vertexStart + 1, vertexStart + 2, vertexStart + 3);
            if (downstream[k] >= 0)
            {
                Point3d from = CellPoint(k, elevationFilled), to = CellPoint(downstream[k], elevationFilled);
                arrows.Add(new Line(from, from + (to - from) * 0.45));         // 短箭頭：只畫到鄰格中點附近
            }
        }
        basinMesh.Normals.ComputeNormals();

        double maxAccumulation = 0;
        foreach (double value in accumulation) maxAccumulation = Math.Max(maxAccumulation, value);
        string summary = string.Format("格子 {0}×{1}｜填窪 {2} 格｜最大累積 {3:0} 格｜河段 {4}｜集水區 {5}（上色 {6}）",
            gridColumns, gridRows, filledCount, maxAccumulation, streamLines.Count, basinSize.Count, Math.Min(basinCount, basinSize.Count));
        Print(summary);
        streams = streamLines;
        orders = streamOrders;
        basins = basinMesh;
        flowLines = arrows;
        info = summary;
    }

    // ----- Fields 欄位 -----
    const int MinCellCount = 4, MinBasinCount = 1;
    const int MaxCellCount = 400;               // 格數平方成長，上限避免射線太多拖慢畫面
    static readonly int[] NeighborOffsetI = { 1, 1, 0, -1, -1, -1, 0, 1 };
    static readonly int[] NeighborOffsetJ = { 0, 1, 1, 1, 0, -1, -1, -1 };
    static readonly double[] NeighborDistance = { 1, Math.Sqrt(2), 1, Math.Sqrt(2), 1, Math.Sqrt(2), 1, Math.Sqrt(2) };   // 對角距離 √2

    int gridColumns, gridRows;                  // 格子的欄數、列數
    double cellSize;                            // 每格邊長
    BoundingBox terrainBox;                     // 地形的外框，格子座標都以它為基準

    // ----- RULE 規則：每格在 8 個鄰居中找「高差 ÷ 距離」最陡的一個當下游（D8）-----
    int[] ComputeFlowDirections(double[] elevation)
    {
        int cellTotal = gridColumns * gridRows;
        int[] downstream = new int[cellTotal];
        for (int k = 0; k < cellTotal; k++)
        {
            downstream[k] = -1;                 // 預設是出口：找不到更低的鄰居
            if (double.IsNaN(elevation[k])) continue;
            int i = k % gridColumns, j = k / gridColumns;
            double steepestSlope = 0;
            for (int d = 0; d < 8; d++)
            {
                int ni = i + NeighborOffsetI[d], nj = j + NeighborOffsetJ[d];
                if (ni < 0 || nj < 0 || ni >= gridColumns || nj >= gridRows) continue;
                int neighbor = Id(ni, nj);
                if (double.IsNaN(elevation[neighbor])) continue;
                double slope = (elevation[k] - elevation[neighbor]) / (NeighborDistance[d] * cellSize);   // 高差 ÷ 距離
                if (slope > steepestSlope) { steepestSlope = slope; downstream[k] = neighbor; }
            }
        }
        return downstream;
    }

    // ----- Helpers 工具 -----
    // 把地形轉成高程格子：長邊切 cellCount 格，每格中心從正上方往下打射線
    double[] SampleElevations(Mesh mesh, int cellCount)
    {
        terrainBox = mesh.GetBoundingBox(true);
        double lengthX = terrainBox.Max.X - terrainBox.Min.X, lengthY = terrainBox.Max.Y - terrainBox.Min.Y;
        cellSize = Math.Max(lengthX, lengthY) / cellCount;
        gridColumns = Math.Max(2, (int) Math.Round(lengthX / cellSize));
        gridRows = Math.Max(2, (int) Math.Round(lengthY / cellSize));
        double[] elevation = new double[gridColumns * gridRows];
        double rayStartZ = terrainBox.Max.Z + 1.0;              // 從最高點再上方一點開始打，保證穿過地形
        for (int j = 0; j < gridRows; j++)
            for (int i = 0; i < gridColumns; i++)
            {
                Point3d rayStart = new Point3d(terrainBox.Min.X + (i + 0.5) * cellSize, terrainBox.Min.Y + (j + 0.5) * cellSize, rayStartZ);
                double hitDistance = Rhino.Geometry.Intersect.Intersection.MeshRay(mesh, new Ray3d(rayStart, -Vector3d.ZAxis));
                elevation[Id(i, j)] = hitDistance >= 0 ? rayStart.Z - hitDistance : double.NaN;   // 沒打到 = 地形外，無資料
            }
        return elevation;
    }

    // Priority-Flood：從邊界（或緊鄰無資料）的格子往內淹，比周圍低的窪地抬到剛好能溢流的高度
    int PriorityFlood(double[] elevation, double epsilon)
    {
        int cellTotal = elevation.Length, filledCount = 0;
        bool[] settled = new bool[cellTotal];
        var heap = new MinHeap();
        for (int k = 0; k < cellTotal; k++)
        {
            if (double.IsNaN(elevation[k])) { settled[k] = true; continue; }
            if (IsEdge(k, elevation)) { heap.Push(k, elevation[k]); settled[k] = true; }
        }
        while (heap.Count > 0)
        {
            int current = heap.Pop();
            int i = current % gridColumns, j = current / gridColumns;
            for (int d = 0; d < 8; d++)
            {
                int ni = i + NeighborOffsetI[d], nj = j + NeighborOffsetJ[d];
                if (ni < 0 || nj < 0 || ni >= gridColumns || nj >= gridRows) continue;
                int neighbor = Id(ni, nj);
                if (settled[neighbor]) continue;
                settled[neighbor] = true;
                if (elevation[neighbor] <= elevation[current]) { elevation[neighbor] = elevation[current] + epsilon; filledCount++; }   // 窪地抬到溢流高度
                heap.Push(neighbor, elevation[neighbor]);
            }
        }
        return filledCount;
    }

    // 格子是不是在地形邊界上、或緊鄰一格無資料（Priority-Flood 從這些格子開始淹）
    bool IsEdge(int k, double[] elevation)
    {
        int i = k % gridColumns, j = k / gridColumns;
        if (i == 0 || j == 0 || i == gridColumns - 1 || j == gridRows - 1) return true;
        for (int d = 0; d < 8; d++)
            if (double.IsNaN(elevation[Id(i + NeighborOffsetI[d], j + NeighborOffsetJ[d])])) return true;
        return false;
    }

    int Id(int i, int j) { return j * gridColumns + i; }

    Point3d CellPoint(int k, double[] elevation)
    {
        return new Point3d(terrainBox.Min.X + (k % gridColumns + 0.5) * cellSize, terrainBox.Min.Y + (k / gridColumns + 0.5) * cellSize, elevation[k]);
    }

    static Color Hue(double t)
    {
        return new Rhino.Display.ColorHSL(t - Math.Floor(t), 0.55, 0.62).ToArgbColor();
    }

    // 沒接地形時的內建示範地形：兩組正弦波疊出幾座山丘與谷地，保證有河網可看
    static Mesh DefaultTerrain()
    {
        const int gridSize = 40;
        const double sideLength = 100.0;
        var mesh = new Mesh();
        for (int j = 0; j <= gridSize; j++)
            for (int i = 0; i <= gridSize; i++)
            {
                double x = i * sideLength / gridSize, y = j * sideLength / gridSize;
                double z = 18.0 * Math.Sin(x / 22.0) * Math.Cos(y / 26.0) + 10.0 * Math.Sin(x / 9.0 + y / 13.0);
                mesh.Vertices.Add(x, y, z);
            }
        for (int j = 0; j < gridSize; j++)
            for (int i = 0; i < gridSize; i++)
            {
                int a = j * (gridSize + 1) + i, b = a + 1, c = a + gridSize + 1, d = c + 1;
                mesh.Faces.AddFace(a, b, d, c);
            }
        mesh.Normals.ComputeNormals();
        return mesh;
    }

    // ----- 二元堆積：優先佇列，Priority-Flood 每次取出目前最低的一格 -----
    class MinHeap
    {
        readonly List<int> ids = new List<int>();
        readonly List<double> keys = new List<double>();
        public int Count { get { return ids.Count; } }

        public void Push(int id, double key)
        {
            ids.Add(id); keys.Add(key);
            int child = ids.Count - 1;
            while (child > 0)
            {
                int parent = (child - 1) / 2;
                if (keys[parent] <= keys[child]) break;
                Swap(child, parent); child = parent;
            }
        }

        public int Pop()
        {
            int top = ids[0], last = ids.Count - 1;
            Swap(0, last); ids.RemoveAt(last); keys.RemoveAt(last);
            int node = 0;
            while (true)
            {
                int left = 2 * node + 1, right = left + 1, smallest = node;
                if (left < ids.Count && keys[left] < keys[smallest]) smallest = left;
                if (right < ids.Count && keys[right] < keys[smallest]) smallest = right;
                if (smallest == node) break;
                Swap(node, smallest); node = smallest;
            }
            return top;
        }

        void Swap(int a, int b)
        {
            int tempId = ids[a]; ids[a] = ids[b]; ids[b] = tempId;
            double tempKey = keys[a]; keys[a] = keys[b]; keys[b] = tempKey;
        }
    }
}
