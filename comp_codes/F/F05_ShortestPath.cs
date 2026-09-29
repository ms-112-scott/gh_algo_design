// Grasshopper Script Instance
// ==================================================================
// F05 Shortest Path (Dijkstra)｜最短路徑（Dijkstra）
// 家族：F 圖樣與最佳化　邏輯：搜尋／求解　難度：3
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   cellSize        double        Item   格點間距（越小越精細）            例：2.0
//   obstacleRadius  double        Item   障礙物擋住的半徑                  例：4.0
//   obstaclePoints  Point3d       List   障礙物中心                        例：（空＝中間放 3 個錯落障礙）
//   startPoint      Point3d       Item   起點                              例：原點 (0,0,0)
//   endPoint        Point3d       Item   終點（與 startPoint 相同時視為未接）例：對角 (areaWidth, areaHeight, 0)
//   areaWidth       double        Item   搜尋範圍寬度（X 方向）            例：60
//   areaHeight      double        Item   搜尋範圍高度（Y 方向）            例：60
// 輸出
//   out                                  Print 的文字（元件預設就有，不要刪）
//   path                                 起點到終點的最短路線（Polyline）
//   blockedPoints                        被障礙物擋住、不能走的格點
//   pathLength                           路線總長度（走不到時為 -1）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 把範圍切成 cellSize 大小的格點，離任一 obstaclePoints 中心小於 obstacleRadius 的格點標為不能走。
//   2. 所有格點的「離起點距離」先設為無限大，起點對齊的格點距離設為 0。
//   3. 每一輪掃描全部格點，挑出「還沒確定、距離最小」的格點，標為已確定；找不到或已到終點就停。
//   4. 更新它 8 個鄰居：直走加 1 格、斜走加 √2 格，比原本記錄的距離更短就改寫，並記下「從哪一格走過來」。
//   5. 從終點沿著「從哪一格走過來」倒推回起點，反轉後輸出 Polyline；走不到就結束並提醒。
// ------------------------------------------------------------------
// 你應該看到：預設值下，一條路線從左下角的起點繞過對角線上錯落的 3 個圓形障礙，偏出直線折向右上角的終點。
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
        double cellSize, double obstacleRadius, List<Point3d> obstaclePoints,
        Point3d startPoint, Point3d endPoint, double areaWidth, double areaHeight,
        ref object path, ref object blockedPoints, ref object pathLength)
    {
        // ===== 0. 防呆 =====
        if (cellSize <= 0) cellSize = 2.0;
        if (obstacleRadius <= 0) obstacleRadius = 4.0;
        if (areaWidth <= 0) areaWidth = 60.0;
        if (areaHeight <= 0) areaHeight = 60.0;
        if (obstaclePoints == null || obstaclePoints.Count == 0)
        {
            // 沒接障礙物 → 沿對角線（起點到終點的路徑上）錯落放 3 個，逼路線繞開才看得出效果
            obstaclePoints = new List<Point3d>
            {
                new Point3d(areaWidth * 0.30, areaHeight * 0.35, 0),
                new Point3d(areaWidth * 0.50, areaHeight * 0.50, 0),
                new Point3d(areaWidth * 0.70, areaHeight * 0.65, 0),
            };
        }
        if (endPoint == startPoint)                                       // 兩點沒接時都會是 (0,0,0)，視為「未指定終點」
        {
            endPoint = new Point3d(areaWidth, areaHeight, 0);              // 預設走對角線，畫面看得出繞路
        }

        double columnCount = Math.Ceiling(areaWidth / cellSize);            // 先用 double 算，避免 cellSize 極小時 int 相乘溢位
        double rowCount = Math.Ceiling(areaHeight / cellSize);
        if (columnCount < 1) columnCount = 1;
        if (rowCount < 1) rowCount = 1;
        if (columnCount * rowCount > MaxCells)                             // 格子太多 → 停下來，避免算不完或記憶體爆掉
        {
            Print("格點數 {0} 超過上限 {1}，請把 cellSize 調大", columnCount * rowCount, MaxCells);
            return;
        }
        int numCols = (int)columnCount;
        int numRows = (int)rowCount;

        // ===== 1. DATA 資料：每格記錄被擋、已確定、離起點距離、從哪一格來 =====
        bool[,] blocked = new bool[numCols, numRows];
        bool[,] settled = new bool[numCols, numRows];
        double[,] distance = new double[numCols, numRows];
        int[,] cameFromCol = new int[numCols, numRows];
        int[,] cameFromRow = new int[numCols, numRows];
        var blockedCells = new List<Point3d>();

        // ===== 2. INIT 初始：標障礙、對齊起終點、距離全設無限大 =====
        for (int col = 0; col < numCols; col++)
        {
            for (int row = 0; row < numRows; row++)
            {
                Point3d cellCenter = GridPoint(col, row, cellSize);
                bool isBlocked = false;
                for (int obstacleIndex = 0; obstacleIndex < obstaclePoints.Count; obstacleIndex++)
                {
                    double deltaX = cellCenter.X - obstaclePoints[obstacleIndex].X;    // 只比平面 X、Y
                    double deltaY = cellCenter.Y - obstaclePoints[obstacleIndex].Y;    // 障礙點若不在 z=0 也不影響格網判斷
                    double planarDistance = Math.Sqrt(deltaX * deltaX + deltaY * deltaY);
                    if (planarDistance < obstacleRadius)
                    {
                        isBlocked = true;
                        break;
                    }
                }
                blocked[col, row] = isBlocked;
                if (isBlocked) blockedCells.Add(cellCenter);

                distance[col, row] = double.MaxValue;                      // 無限大：一開始每格都當作到不了
                cameFromCol[col, row] = -1;
                cameFromRow[col, row] = -1;
            }
        }

        int startCol = NearestIndex(startPoint.X, cellSize, numCols);
        int startRow = NearestIndex(startPoint.Y, cellSize, numRows);
        int endCol = NearestIndex(endPoint.X, cellSize, numCols);
        int endRow = NearestIndex(endPoint.Y, cellSize, numRows);

        if (blocked[startCol, startRow] || blocked[endCol, endRow])
        {
            Print("起點或終點落在障礙物裡，找不到路線");
            blockedPoints = blockedCells;                                  // 讓使用者看到是哪些格子擋住了起終點
            return;
        }
        distance[startCol, startRow] = 0;

        // ===== 3. LOOP 迭代：確定到終點為止 =====
        int settledCount = 0;
        int maxSteps = numCols * numRows;                                  // 最多把每一格都確定一次，保證結束
        for (int step = 0; step < maxSteps; step++)
        {
            int nearestCol, nearestRow;
            bool found = FindNearestUnsettled(distance, settled, numCols, numRows, out nearestCol, out nearestRow);
            if (!found) break;                                             // 剩下的格子都到不了，提早停止

            settled[nearestCol, nearestRow] = true;
            settledCount++;
            if (nearestCol == endCol && nearestRow == endRow) break;       // 終點確定了，不用再算下去

            RelaxNeighbors(distance, settled, blocked, cameFromCol, cameFromRow,
                nearestCol, nearestRow, numCols, numRows);
        }

        // ===== 4. OUTPUT 輸出：倒推路徑、量長度 =====
        if (distance[endCol, endRow] >= double.MaxValue)
        {
            Print("掃了 {0} 個格點，仍然走不到終點（可能被障礙物封死）", settledCount);
            blockedPoints = blockedCells;
            pathLength = -1.0;
            return;
        }

        Polyline route = BuildPath(cameFromCol, cameFromRow, startCol, startRow, endCol, endRow, cellSize, numCols, numRows);
        blockedPoints = blockedCells;
        if (route.Count < 2)                                               // 起終點落在同一格 → 沒有有效曲線可輸出
        {
            Print("起點與終點落在同一格，沒有路線可畫");
            pathLength = 0.0;
            return;
        }
        Print("找到路線：經過 {0} 格，長度 {1:F2}", route.Count, distance[endCol, endRow] * cellSize);
        path = route;
        pathLength = distance[endCol, endRow] * cellSize;
    }

    // ----- Fields 欄位 -----
    const int MaxCells = 10000;                                            // 格點數上限（欄數 × 列數）
    // 8 個方向的一步：{欄的位移, 列的位移}；先 4 個直走、再 4 個斜走
    // 可以刪成只留前 4 個直走（4 鄰居），也可以擴充成 16 個方向（例如再加 (2,1)、(1,2) 這種騎士步）；
    // RelaxNeighbors 用 GetLength(0) 讀方向數、步長用實際位移算距離，改這個陣列不用改邏輯
    static readonly int[,] NeighborSteps = new int[,]
    {
        { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 },
        { 1, 1 }, { 1, -1 }, { -1, 1 }, { -1, -1 },
    };

    // ----- RULE 規則：Dijkstra 的兩個核心步驟 -----
    // 在還沒確定的格點裡，挑離起點最近的一個（O(n²) 全掃描，刻意不用優先佇列，方便對照教學）
    bool FindNearestUnsettled(double[,] distance, bool[,] settled, int numCols, int numRows,
        out int bestCol, out int bestRow)
    {
        bestCol = -1;
        bestRow = -1;
        double bestDistance = double.MaxValue;
        for (int col = 0; col < numCols; col++)
        {
            for (int row = 0; row < numRows; row++)
            {
                if (settled[col, row]) continue;
                if (distance[col, row] >= bestDistance) continue;          // 已經找到更近的，跳過
                bestDistance = distance[col, row];
                bestCol = col;
                bestRow = row;
            }
        }
        return bestCol >= 0 && bestDistance < double.MaxValue;             // 找不到「到得了、還沒確定」的格點就算失敗
    }

    // 用剛確定的格點，去更新它 8 個鄰居的距離
    void RelaxNeighbors(double[,] distance, bool[,] settled, bool[,] blocked,
        int[,] cameFromCol, int[,] cameFromRow, int fromCol, int fromRow, int numCols, int numRows)
    {
        for (int direction = 0; direction < NeighborSteps.GetLength(0); direction++)    // 方向數改陣列長度就跟著變
        {
            int deltaCol = NeighborSteps[direction, 0];
            int deltaRow = NeighborSteps[direction, 1];
            int neighborCol = fromCol + deltaCol;
            int neighborRow = fromRow + deltaRow;
            if (neighborCol < 0 || neighborCol >= numCols) continue;
            if (neighborRow < 0 || neighborRow >= numRows) continue;
            if (blocked[neighborCol, neighborRow] || settled[neighborCol, neighborRow]) continue;

            double stepCost = Math.Sqrt(deltaCol * deltaCol + deltaRow * deltaRow);     // 依實際位移算距離，(2,1) 這類步也對
            double newDistance = distance[fromCol, fromRow] + stepCost;

            if (newDistance < distance[neighborCol, neighborRow])
            {
                distance[neighborCol, neighborRow] = newDistance;
                cameFromCol[neighborCol, neighborRow] = fromCol;
                cameFromRow[neighborCol, neighborRow] = fromRow;
            }
        }
    }

    // ----- Helpers 工具 -----
    // 欄列編號 → 格點中心座標
    Point3d GridPoint(int col, int row, double cellSize)
    {
        return new Point3d(col * cellSize + cellSize * 0.5, row * cellSize + cellSize * 0.5, 0);
    }

    // 座標 → 最近的格號，超出範圍就夾在邊上
    int NearestIndex(double coordinate, double cellSize, int count)
    {
        int index = (int)Math.Floor(coordinate / cellSize);
        if (index < 0) index = 0;
        if (index > count - 1) index = count - 1;
        return index;
    }

    // 從終點沿著「從哪一格來」倒推回起點，反轉後變成起點到終點的 Polyline
    Polyline BuildPath(int[,] cameFromCol, int[,] cameFromRow, int startCol, int startRow,
        int endCol, int endRow, double cellSize, int numCols, int numRows)
    {
        var cellsBackward = new List<Point3d>();
        int col = endCol;
        int row = endRow;
        int maxSteps = numCols * numRows;                                  // 步數上限：不只靠 cameFrom 一定通到起點這個假設
        for (int step = 0; step <= maxSteps; step++)
        {
            cellsBackward.Add(GridPoint(col, row, cellSize));
            if (col == startCol && row == startRow) break;                 // 走回起點就停
            int previousCol = cameFromCol[col, row];
            int previousRow = cameFromRow[col, row];
            if (previousCol < 0 || previousRow < 0)                        // 沒有記錄來源，避免用 -1 當索引
            {
                Print("倒推路徑時中斷（第 {0} 格沒有來源紀錄）", cellsBackward.Count);
                break;
            }
            col = previousCol;
            row = previousRow;
        }
        cellsBackward.Reverse();                                           // 原本是終點→起點，反轉成起點→終點
        return new Polyline(cellsBackward);
    }
}
