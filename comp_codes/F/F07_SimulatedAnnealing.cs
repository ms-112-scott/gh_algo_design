// Grasshopper Script Instance
// ==================================================================
// F07 Simulated Annealing (with Quadratic-Assignment Room Layout)｜模擬退火（以房間鄰接配置為例）
// 家族：F 圖樣與最佳化　邏輯：搜尋／求解／迭代模擬　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   roomNames    string  List   房間名稱，每行一個房間              例：客廳,餐廳,廚房,臥室,浴室,書房
//   adjacency    string  List   鄰接需求「房間A,房間B,權重」        例：客廳,餐廳,5
//   startTemp    double  Item   起始溫度 T0                       例：10
//   coolingRate  double  Item   冷卻率 α（0～1，越接近 1 降得越慢） 例：0.995
//   iterations   int     Item   總共嘗試幾次交換                   例：50000
//   seed         int     Item   亂數種子（同一個 seed 可重現）      例：0
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   rooms                        最佳配置的房間矩形（Rectangle3d）
//   labels                       房間名稱標籤（TextDot）
//   links                        有鄰接需求的連線（Line），權重越大越該短
//   costCurve                    成本下降曲線（Polyline，畫在平面右側）
//   log                          起始成本、最佳成本、接受變差的次數
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 把鄰接需求讀成對稱矩陣，格位排成接近正方形（可以比房間多，多的是空格）。
//   2. 用洗牌產生一個隨機配置當起點，算出它的成本（二次指派 QAP：Σ 權重 × 曼哈頓距離）。
//   3. 每一步隨機挑兩個格位交換內容；變好（Δ ≤ 0）直接收，變差則以機率 e^(−Δ/T) 收，否則換回來。
//   4. 每 StepsPerTemp 步把溫度乘上冷卻率；溫度越低，接受變差的機會越小，逐漸收斂。
//   5. 全程記住看過的最佳配置；跑完或溫度低於門檻就停，輸出最佳配置與成本曲線。
// ------------------------------------------------------------------
// 你應該看到：用預設值時，6 個房間自動排成 3 欄 × 2 列的格位，退火跑完後權重大的房間彼此靠近，右側的成本曲線先上下抖動、隨溫度降低逐漸走平。
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
        List<string> roomNames, List<string> adjacency,
        double startTemp, double coolingRate, int iterations, int seed,
        ref object rooms, ref object labels, ref object links, ref object costCurve, ref object log)
    {
        // ===== 0. 防呆 =====
        bool usedDefaultRooms = roomNames == null || roomNames.Count < 2;
        if (usedDefaultRooms)
        {
            roomNames = new List<string> { "客廳", "餐廳", "廚房", "臥室", "浴室", "書房" };
            Print("roomNames 沒接或少於 2 間，改用預設的 6 個房間。");
        }
        if (roomNames.Count > MaxRooms)
        {
            roomNames = roomNames.GetRange(0, MaxRooms);
            Print("房間數超過上限 {0}，只取前 {0} 間。", MaxRooms);
        }
        // 只有房間名稱也是預設值時，才套用同樣以預設名稱寫的鄰接表；
        // 使用者自己接了 roomNames 卻沒接 adjacency 時，名稱對不上預設表，寧可留空、之後提醒，也不要套錯資料
        if (usedDefaultRooms && (adjacency == null || adjacency.Count == 0))
            adjacency = new List<string> { "客廳,餐廳,5", "餐廳,廚房,4", "臥室,浴室,3", "客廳,書房,2" };
        if (coolingRate <= 0 || coolingRate >= 1) coolingRate = 0.995;
        if (startTemp <= 0) startTemp = 10;
        if (iterations <= 0) iterations = DefaultIterations;
        bool hitIterationLimit = iterations > MaxIterations;      // 先記下來，才能在最後提醒使用者
        iterations = Math.Min(iterations, MaxIterations);

        // ===== 1. DATA 資料：房間、格位、鄰接矩陣 weights[i,j] =====
        int roomCount = roomNames.Count;
        double[,] weights = ReadAdjacency(adjacency, roomNames);
        if (IsAllZero(weights))
            Print("沒有任何有效的鄰接需求（房間名稱對不上？）");
        int columnCount = (int)Math.Ceiling(Math.Sqrt(roomCount));
        int rowCount = (int)Math.Ceiling(roomCount / (double)columnCount);
        int slotCount = columnCount * rowCount;                  // 格位可以比房間多，多出來的是空格

        // ===== 2. INIT 初始：隨機把房間放進格位（一個排列），當作退火的起點 =====
        var random = new Random(seed);
        int[] slotOfRoom = RandomPlacement(roomCount, slotCount, random);   // slotOfRoom[房間] = 格位
        int[] roomInSlot = new int[slotCount];                              // roomInSlot[格位] = 房間，-1 = 空格
        for (int slot = 0; slot < slotCount; slot++) roomInSlot[slot] = -1;
        for (int room = 0; room < roomCount; room++) roomInSlot[slotOfRoom[room]] = room;

        double currentCost = Cost(slotOfRoom, weights, columnCount);
        double startingCost = currentCost;
        double bestCost = currentCost;
        int[] bestSlotOfRoom = (int[])slotOfRoom.Clone();
        double temperature = startTemp;
        int worseAcceptedCount = 0;
        var costHistory = new List<double> { currentCost };
        Print("起始成本 {0:F1}，起始溫度 {1:F2}", currentCost, temperature);

        // ===== 3. LOOP 迭代：交換兩個格位 → 算 Δ → Metropolis 準則決定接不接受 → 降溫 =====
        int sampleEvery = Math.Max(1, iterations / CurveSamples);
        int usedIterations = 0;
        for (int step = 1; step <= iterations; step++)
        {
            usedIterations = step;
            int slotA, slotB;
            do
            {
                slotA = random.Next(slotCount);
                slotB = random.Next(slotCount);
            }
            while (slotA == slotB || (roomInSlot[slotA] < 0 && roomInSlot[slotB] < 0));   // 兩個空格交換沒有意義

            SwapSlots(slotA, slotB, roomInSlot, slotOfRoom);
            double newCost = Cost(slotOfRoom, weights, columnCount);
            double delta = newCost - currentCost;

            bool accept = delta <= 0 || random.NextDouble() < Math.Exp(-delta / temperature);
            if (accept)
            {
                if (delta > 0) worseAcceptedCount++;      // 接受變差：這就是能跳出小山谷的關鍵
                currentCost = newCost;
                if (currentCost < bestCost)
                {
                    bestCost = currentCost;
                    bestSlotOfRoom = (int[])slotOfRoom.Clone();   // 一定要 Clone，否則之後會被改掉
                }
            }
            else
            {
                SwapSlots(slotA, slotB, roomInSlot, slotOfRoom);   // 不接受：換回來
            }

            if (step % StepsPerTemp == 0) temperature *= coolingRate;   // 幾何降溫
            if (step % sampleEvery == 0) costHistory.Add(currentCost);
            if (temperature < MinTemp) break;                          // 溫度夠低，接受變差的機會趨近 0，可以停了
        }
        // 提早 break 或最後一步剛好沒取樣時，把真正的最後狀態補進曲線，確保至少有頭尾兩點
        if (usedIterations % sampleEvery != 0 || costHistory.Count < 2)
            costHistory.Add(currentCost);

        // ===== 4. OUTPUT 輸出 =====
        var roomRectangles = new List<Rectangle3d>();
        var roomLabels = new List<TextDot>();
        for (int room = 0; room < roomCount; room++)
        {
            Point3d center = SlotCenter(bestSlotOfRoom[room], columnCount);
            double half = CellSize * 0.5 - Gap;
            roomRectangles.Add(new Rectangle3d(Plane.WorldXY,
                new Point3d(center.X - half, center.Y - half, 0),
                new Point3d(center.X + half, center.Y + half, 0)));
            roomLabels.Add(new TextDot(roomNames[room], center));
        }

        var adjacencyLines = new List<Line>();
        for (int first = 0; first < roomCount; first++)
            for (int second = first + 1; second < roomCount; second++)
                if (weights[first, second] > 0)
                    adjacencyLines.Add(new Line(
                        SlotCenter(bestSlotOfRoom[first], columnCount),
                        SlotCenter(bestSlotOfRoom[second], columnCount)));

        Print("用了 {0} 次交換，接受變差 {1} 次，最後溫度 {2:F4}", usedIterations, worseAcceptedCount, temperature);
        Print("最佳成本 {0:F1}（起始 {1:F1}）", bestCost, startingCost);
        if (hitIterationLimit) Print("（已達交換次數上限 {0}）", MaxIterations);

        rooms = roomRectangles;
        labels = roomLabels;
        links = adjacencyLines;
        costCurve = DrawCurve(costHistory, columnCount * CellSize + CellSize, rowCount * CellSize);
        log = string.Format("房間 {0}、格位 {1}（{2}×{3}）\n起始成本 {4:F1} → 最佳成本 {5:F1}\n接受變差 {6} 次，最後溫度 {7:F4}",
            roomCount, slotCount, columnCount, rowCount, startingCost, bestCost, worseAcceptedCount, temperature);
    }

    // ----- Fields 欄位 -----
    const int MaxRooms = 60;             // 房間數上限：每步都要重算 O(n²) 成本，房間太多會太慢
    const int DefaultIterations = 50000; // 沒接時的預設交換次數：配合 coolingRate 0.995、每 50 步降溫一次，跑完 T 會降到約 0.067，曲線才走得平
    const int MaxIterations = 100000;    // 總交換次數上限；60 房間每步約 1770 對比較，總量約 1.8 億次運算仍在 1 秒內
    const double CellSize = 4.0;         // 每個格位 4 m
    const double Gap = 0.15;             // 房間矩形內縮，讓格線看得見
    const int StepsPerTemp = 50;         // 每個溫度嘗試幾次交換
    const double MinTemp = 1e-4;         // 溫度低於此值就停
    const int CurveSamples = 200;        // 成本曲線最多取幾個點

    // ----- RULE 規則：成本（二次指派 QAP）＝ Σ 權重 × 兩房間格位的曼哈頓距離 -----
    double Cost(int[] slotOfRoom, double[,] weights, int columnCount)
    {
        int roomCount = slotOfRoom.Length;
        double sum = 0;
        for (int first = 0; first < roomCount; first++)
        {
            for (int second = first + 1; second < roomCount; second++)
            {
                if (weights[first, second] == 0) continue;   // 沒有鄰接需求，跳過
                int columnDistance = Math.Abs(slotOfRoom[first] % columnCount - slotOfRoom[second] % columnCount);
                int rowDistance = Math.Abs(slotOfRoom[first] / columnCount - slotOfRoom[second] / columnCount);
                sum += weights[first, second] * (columnDistance + rowDistance);
            }
        }
        return sum;
    }

    // ----- RULE 規則：鄰域（交換兩個格位的內容，空格也可以交換）-----
    void SwapSlots(int slotA, int slotB, int[] roomInSlot, int[] slotOfRoom)
    {
        int roomA = roomInSlot[slotA];
        int roomB = roomInSlot[slotB];
        roomInSlot[slotA] = roomB;
        roomInSlot[slotB] = roomA;
        if (roomA >= 0) slotOfRoom[roomA] = slotB;   // 兩個索引要同步更新，不然下一步就對不上
        if (roomB >= 0) slotOfRoom[roomB] = slotA;
    }

    // ----- Helpers 工具 -----
    // 格位洗牌，取前 roomCount 個當初始配置（Fisher–Yates）
    int[] RandomPlacement(int roomCount, int slotCount, Random random)
    {
        int[] order = Enumerable.Range(0, slotCount).ToArray();
        for (int k = slotCount - 1; k > 0; k--)
        {
            int m = random.Next(k + 1);
            int temp = order[k];
            order[k] = order[m];
            order[m] = temp;
        }
        return order.Take(roomCount).ToArray();
    }

    // 格位編號 → 世界座標的中心點
    Point3d SlotCenter(int slot, int columnCount)
    {
        return new Point3d((slot % columnCount + 0.5) * CellSize, (slot / columnCount + 0.5) * CellSize, 0);
    }

    // 把 "客廳,餐廳,5" 或 "0,1,5" 讀進對稱矩陣，名稱或編號都可以；全形、半形逗號都可以（中文輸入法常打出全形「，」）
    double[,] ReadAdjacency(List<string> lines, List<string> names)
    {
        int roomCount = names.Count;
        var weights = new double[roomCount, roomCount];
        if (lines == null) return weights;
        foreach (string line in lines)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            string[] parts = line.Split(',', '，');
            if (parts.Length < 3) continue;
            int first = IndexOf(parts[0].Trim(), names);
            int second = IndexOf(parts[1].Trim(), names);
            double value;
            if (first < 0 || second < 0 || first == second || !double.TryParse(parts[2].Trim(), out value)) continue;
            weights[first, second] = value;
            weights[second, first] = value;
        }
        return weights;
    }

    // 鄰接矩陣是否全為 0（代表沒有任何一行 adjacency 對得上房間名稱）
    bool IsAllZero(double[,] weights)
    {
        foreach (double value in weights)
            if (value != 0) return false;
        return true;
    }

    // 名稱或編號（字串）→ 房間編號；找不到回傳 -1
    int IndexOf(string token, List<string> names)
    {
        int index;
        if (int.TryParse(token, out index) && index >= 0 && index < names.Count) return index;
        return names.IndexOf(token);
    }

    // 成本歷程 → 折線（畫在平面圖右側，x = 進度、y = 成本正規化後的高度）
    Polyline DrawCurve(List<double> history, double startX, double height)
    {
        var curve = new Polyline();
        double maxCost = history.Max();
        double minCost = history.Min();
        double span = Math.Max(1e-9, maxCost - minCost);
        double width = height * 1.5;
        for (int k = 0; k < history.Count; k++)
        {
            double x = startX + width * k / Math.Max(1, history.Count - 1);
            double y = height * (history[k] - minCost) / span;
            curve.Add(x, y, 0);
        }
        return curve;
    }
}
