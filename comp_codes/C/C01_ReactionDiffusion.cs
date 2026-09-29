// Grasshopper Script Instance
// ==================================================================
// C01 Reaction-Diffusion (Gray-Scott)｜反應擴散
// 家族：C 場與擴散　邏輯：迭代模擬　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   feed        double  Item   A 的補充速度（和 kill 一起決定花紋種類）    例：0.055
//   kill        double  Item   B 被移除的速度                             例：0.062
//   steps       int     Item   模擬迭代步數                               例：3000
//   gridSize    int     Item   網格解析度（gridSize×gridSize 格）         例：80
//   seedSize    int     Item   中央初始 B 種子的邊長（格數）              例：20
//   cellSize    double  Item   每格的邊長（決定輸出點的間距）             例：1.0
//   makeMesh    bool    Item   是否額外算出上色 Mesh                      例：True
// 輸出
//   out                          Print 的文字（元件預設就有，不要刪）
//   centerPoints                 每格的中心點（Point3d）
//   valuesB                      每格的 B 濃度（順序對應 centerPoints）
//   coloredMesh                  makeMesh 打開時才有：B 越濃越黑的上色 Mesh
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 建立兩張 gridSize×gridSize 的濃度表：A 全部設為 1（原料），B 只在正中央一塊 seedSize×seedSize 設為 1（種子）。
//   2. 每一步對每一格算反應量 A·B²（兩個 B 分子吃掉一個 A 分子，變成 B）。
//   3. 用 3×3 卷積（上下左右權重 0.2、斜角 0.05、自己 −1）算擴散量，A 的擴散速度是 B 的兩倍（1.0 對 0.5）。
//   4. A 用 feed·(1−A) 補回被吃掉的原料；B 被 (kill+feed)·B 移除；新值寫進另一張表（不能就地覆寫，否則同一步會讀到剛更新的值），再夾在 0～1 之間。
//   5. 整張算完後把新舊兩張表交換（雙緩衝），重複 steps 次；四周邊界相接（像甜甜圈），不用特別處理邊緣。
//   6. steps 跑完後輸出每格中心點與 B 濃度；makeMesh 打開時再把 B 濃度轉成灰階，做成上色 Mesh。
// ------------------------------------------------------------------
// 你應該看到：用預設值時，中央先長出一塊黑斑並向外擴張，跑完 3000 步後長成布滿整個網格的對稱迷宮狀黑白花紋。
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
        double feed, double kill, int steps, int gridSize, int seedSize, double cellSize, bool makeMesh,
        ref object centerPoints, ref object valuesB, ref object coloredMesh)
    {
        // ===== 0. 防呆 =====
        if (feed <= 0) feed = 0.055;                                          // 沒接 → 迷宮花紋的建議值
        if (kill <= 0) kill = 0.062;
        if (steps <= 0) steps = 3000;
        bool hitStepLimit = steps > MaxSteps;                                 // 先記下是否被步數上限夾住，稍後才能提醒
        steps = Math.Min(steps, MaxSteps);                                    // 步數上限，避免卡死 GH
        if (gridSize <= 0) gridSize = 80;
        bool hitGridLimit = gridSize > MaxGridSize;                           // 先記下是否被網格上限夾住
        gridSize = Math.Max(MinGridSize, Math.Min(gridSize, MaxGridSize));    // 解析度太低沒意義、太高會很慢
        if (seedSize <= 0) seedSize = 20;
        seedSize = Math.Max(1, Math.Min(seedSize, gridSize));                 // 種子不能比網格大
        if (cellSize <= 0) cellSize = 1.0;
        if (Component.Params.Input[6].SourceCount == 0) makeMesh = true;      // bool 沒接時預設是 false，沒辦法跟「接了但設 False」區分，改看有沒有接線

        // ===== 1. DATA 資料：A、B 兩張濃度表，各再備一張存下一步 =====
        double[,] gridA = new double[gridSize, gridSize];
        double[,] gridB = new double[gridSize, gridSize];
        double[,] nextA = new double[gridSize, gridSize];
        double[,] nextB = new double[gridSize, gridSize];

        // ===== 2. INIT 初始：全部是原料 A，正中央放一小塊 B 種子 =====
        for (int x = 0; x < gridSize; x++)
            for (int y = 0; y < gridSize; y++)
                gridA[x, y] = 1.0;

        int seedStart = (gridSize - seedSize) / 2;
        for (int x = seedStart; x < seedStart + seedSize; x++)
            for (int y = seedStart; y < seedStart + seedSize; y++)
                gridB[x, y] = 1.0;

        // ===== 3. LOOP 迭代：每步全網格同時更新，再交換雙緩衝 =====
        for (int step = 0; step < steps; step++)
        {
            for (int x = 0; x < gridSize; x++)
            {
                for (int y = 0; y < gridSize; y++)
                {
                    double a = gridA[x, y];
                    double b = gridB[x, y];
                    double reaction = a * b * b;                              // 兩個 B 吃掉一個 A

                    double diffuseA = DiffusionAmount(gridA, x, y, gridSize);
                    double diffuseB = DiffusionAmount(gridB, x, y, gridSize);

                    double newA = a + DiffusionRateA * diffuseA - reaction + feed * (1.0 - a);
                    double newB = b + DiffusionRateB * diffuseB + reaction - (kill + feed) * b;

                    nextA[x, y] = Clamp(newA);                                 // 夾在 0～1，避免數值爆走
                    nextB[x, y] = Clamp(newB);
                }
            }

            // 雙緩衝交換：把算好的下一步換成目前這一步，next 的舊陣列留給下一輪覆寫
            double[,] swapA = gridA; gridA = nextA; nextA = swapA;
            double[,] swapB = gridB; gridB = nextB; nextB = swapB;
        }

        // ===== 4. OUTPUT 輸出 =====
        var points = new List<Point3d>();
        var values = new List<double>();
        double offset = (gridSize - 1) * cellSize * 0.5;                      // 讓整片網格置中在原點

        for (int y = 0; y < gridSize; y++)
        {
            for (int x = 0; x < gridSize; x++)
            {
                points.Add(new Point3d(x * cellSize - offset, y * cellSize - offset, 0));
                values.Add(gridB[x, y]);
            }
        }

        double maxB = values.Count > 0 ? values.Max() : 0.0;
        string limitNote = "";                                                // 有碰到上限才附加提醒，避免每次都印一堆字
        if (hitStepLimit) limitNote += string.Format("（已達步數上限 {0}）", MaxSteps);
        if (hitGridLimit) limitNote += string.Format("（網格已夾到上限 {0}）", MaxGridSize);
        Print(string.Format("跑了 {0} 步，網格 {1}×{1}，B 最大濃度 {2:F3}{3}", steps, gridSize, maxB, limitNote));
        if (!makeMesh) Print("要看花紋請把 makeMesh 接上 Boolean Toggle 並設為 True");
        centerPoints = points;
        valuesB = values;
        coloredMesh = makeMesh ? BuildColoredMesh(gridB, gridSize, cellSize, maxB) : null;
    }

    // ----- Fields 欄位 -----
    const double DiffusionRateA = 1.0;     // A 的擴散速度
    const double DiffusionRateB = 0.5;     // B 的擴散速度，只有 A 的一半 → 局部 B 聚集、周圍 A 被耗盡，花紋才會自己長出來（圖靈不穩定）
    const int MinGridSize = 10;            // 網格太小看不出花紋
    const int MaxGridSize = 150;           // 運算量是 gridSize²×steps，太大會卡住 GH
    const int MaxSteps = 6000;             // 步數上限，避免步數設太高時當機

    // ----- RULE 規則：3×3 卷積算擴散量（上下左右 0.2、斜角 0.05、自己 −1），邊界四周相接 -----
    double DiffusionAmount(double[,] grid, int x, int y, int gridSize)
    {
        int left = x == 0 ? gridSize - 1 : x - 1;              // 三元運算子處理週期邊界（像甜甜圈接起來）
        int right = x == gridSize - 1 ? 0 : x + 1;
        int up = y == 0 ? gridSize - 1 : y - 1;
        int down = y == gridSize - 1 ? 0 : y + 1;

        double sum = 0;
        sum += grid[left, y] * 0.2;
        sum += grid[right, y] * 0.2;
        sum += grid[x, up] * 0.2;
        sum += grid[x, down] * 0.2;
        sum += grid[left, up] * 0.05;
        sum += grid[right, up] * 0.05;
        sum += grid[left, down] * 0.05;
        sum += grid[right, down] * 0.05;
        sum -= grid[x, y];                                      // 卷積核總和為 0：自己權重 −1
        return sum;
    }

    // ----- Helpers 工具 -----
    // 夾在 0～1：每步直接加上變化量（顯式更新、時間步長固定為 1），濃度在陡峭處可能衝過 0 或 1，夾住讓數值穩定
    double Clamp(double value)
    {
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    // 把 B 濃度表轉成上色 Mesh：B 越濃，頂點顏色越黑；依本次最大濃度 maxB 拉開對比（穩定花紋的 B 通常遠小於 1）
    Mesh BuildColoredMesh(double[,] gridB, int gridSize, double cellSize, double maxB)
    {
        var mesh = new Mesh();
        double offset = (gridSize - 1) * cellSize * 0.5;

        for (int y = 0; y < gridSize; y++)
            for (int x = 0; x < gridSize; x++)
                mesh.Vertices.Add(x * cellSize - offset, y * cellSize - offset, 0);

        for (int y = 0; y < gridSize - 1; y++)
        {
            for (int x = 0; x < gridSize - 1; x++)
            {
                int a = y * gridSize + x;
                int b = y * gridSize + (x + 1);
                int c = (y + 1) * gridSize + (x + 1);
                int d = (y + 1) * gridSize + x;
                mesh.Faces.AddFace(a, b, c, d);
            }
        }

        bool hasContrast = maxB > 1e-9;                                    // maxB 極小代表花紋幾乎消失，避免除以 0，整片留白即可
        for (int y = 0; y < gridSize; y++)
        {
            for (int x = 0; x < gridSize; x++)
            {
                double ratio = hasContrast ? Clamp(gridB[x, y] / maxB) : 0.0;  // 依本次最大濃度拉開對比，而不是固定用 0～1
                int gray = (int)(255.0 * (1.0 - ratio));                       // B 越濃 → gray 越小 → 越黑
                mesh.VertexColors.Add(Color.FromArgb(gray, gray, gray));
            }
        }

        mesh.Normals.ComputeNormals();
        mesh.Compact();
        return mesh;
    }
}
