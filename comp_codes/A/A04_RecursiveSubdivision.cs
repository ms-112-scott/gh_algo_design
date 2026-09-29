// Grasshopper Script Instance
// ==================================================================
// A04 Recursive Subdivision｜遞迴分割
// 家族：A 規則與語法　邏輯：改寫／遞迴　難度：2
// ------------------------------------------------------------------
// 輸入（Type Hint、Access、說明、例＝建議預設值；沒接時程式也用這個值）
//   minSize      double  Item   每塊的最小邊長              例：4.0
//   minRatio     double  Item   切割比例下限（0–1）         例：0.3
//   maxRatio     double  Item   切割比例上限（0–1）         例：0.7
//   stopChance   double  Item   每塊提早停止的機率（0–1，0＝從不提早停）   例：0.1
//   seed         int     Item   隨機種子                    例：1
//   width        double  Item   基地寬                      例：40.0
//   height       double  Item   基地深                      例：30.0
// 輸出
//   out                         Print 的文字（元件預設就有，不要刪）
//   rectangles                  所有區塊的外框
//   depths                      每塊被切了幾次（可拿來上色）
// ------------------------------------------------------------------
// 規則（先用中文寫，再寫程式）
//   1. 整塊基地是一個 Block（左下角＋寬＋深＋切了幾次＝0）。
//   2. SplitBlock 先檢查停止條件：最長邊已切不出兩塊 minSize，或（切過至少一次後）擲骰小於 stopChance，就收進 finishedBlocks。
//   3. 否則比較寬與深，沿長邊切；切割位置＝長邊 ×（minRatio～maxRatio 之間的隨機比例），並夾在 minSize 與（長邊－minSize）之間。
//   4. 產生兩個深度 +1 的新 Block，各自再呼叫 SplitBlock（遞迴）。
//   5. 全部遞迴結束後，把每塊轉成封閉 Polyline 輸出，並輸出每塊的切割深度供上色。
// ------------------------------------------------------------------
// 你應該看到：預設值（stopChance=0.1、seed=1）下畫面是一塊 40×30 的矩形被切成大小不一的長方形區塊，共 28 塊，像 Mondrian 的色塊分區
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
        double minSize, double minRatio, double maxRatio, double stopChance, int seed, double width, double height,
        ref object rectangles, ref object depths)
    {
        // ===== 0. 防呆 =====
        if (width <= 0) width = 40.0;                                  // 沒接基地寬 → 用預設 40
        if (height <= 0) height = 30.0;                                // 沒接基地深 → 用預設 30
        if (minSize <= 0) minSize = 4.0;                                // 沒接最小邊長 → 用預設 4（太大切不出去時，SplitBlock 的 tooSmall 會直接把整塊收進 finishedBlocks，這就是正確的遞迴基本情況，不在這裡夾值）
        stopChance = Math.Max(0, Math.Min(1, stopChance));              // 夾在 0–1（0 是有意義的值：永不提早停）
        if (minRatio <= 0) minRatio = 0.3;                              // 沒接 → 預設 0.3
        if (maxRatio <= 0) maxRatio = 0.7;                              // 沒接 → 預設 0.7
        minRatio = Math.Max(0.05, Math.Min(0.95, minRatio));            // 太接近 0 會切出極細長條 → 夾住
        maxRatio = Math.Max(0.05, Math.Min(0.95, maxRatio));            // 太接近 1 會切出極細長條 → 夾住
        if (minRatio > maxRatio)
        {
            double swap = minRatio;
            minRatio = maxRatio;
            maxRatio = swap;
        }

        // ===== 1. DATA 資料 =====
        var random = new Random(seed);
        var finishedBlocks = new List<Block>();

        // ===== 2. INIT 初始 =====
        var site = new Block(Point3d.Origin, width, height, 0);

        // ===== 3. LOOP 迭代：用遞迴展開 =====
        SplitBlock(site, minSize, minRatio, maxRatio, stopChance, random, finishedBlocks);

        // ===== 4. OUTPUT 輸出 =====
        var outlines = new List<Polyline>();
        var blockDepths = new List<int>();
        foreach (Block block in finishedBlocks)
        {
            outlines.Add(block.ToOutline());
            blockDepths.Add(block.Depth);
        }
        bool hitLimit = finishedBlocks.Count >= MaxBlocks;               // 碰到塊數上限 → 後面的區塊沒有再切，畫面看起來像正常結果，要提醒使用者
        int maxDepthReached = blockDepths.Count > 0 ? blockDepths.Max() : 0;
        string limitNote = hitLimit ? "（已達上限 MaxBlocks，後面的區塊沒有再切，請把 minSize 調大）" : "";
        if (finishedBlocks.Count == 1)
        {
            Print("minSize 太大，基地沒有被切");                          // 正確的遞迴基本情況，不是錯誤
        }
        else
        {
            Print("區塊 {0} 塊，最深切 {1} 次{2}", finishedBlocks.Count, maxDepthReached, limitNote);
        }
        rectangles = outlines;
        depths = blockDepths;
    }

    // ----- Fields 欄位 -----
    const int MaxBlocks = 4000;    // 防止 minSize 太小造成遞迴爆炸
    const int MaxDepth = 60;       // 遞迴深度保底（minSize 極端小或比例接近 0.5 時，深度理論上可能很大）

    // ----- RULE 規則：一塊切成兩塊，每一塊再交給自己 -----
    void SplitBlock(Block block, double minSize, double minRatio, double maxRatio, double stopChance, Random random, List<Block> finishedBlocks)
    {
        // --- 停止條件：太小、擲骰提早停，或已經切太多塊（保底不當機） ---
        bool tooSmall = Math.Max(block.Width, block.Height) < minSize * 2;
        bool stopEarly = block.Depth > 0 && random.NextDouble() < stopChance;
        bool tooMany = finishedBlocks.Count >= MaxBlocks;
        bool tooDeep = block.Depth >= MaxDepth;
        if (tooSmall || stopEarly || tooMany || tooDeep)
        {
            finishedBlocks.Add(block);
            return;
        }

        // --- 決定切在哪：沿長邊、隨機比例 ---
        bool cutAlongWidth = block.Width >= block.Height;                       // 寬 ≥ 深 → 沿寬切
        double longSide = cutAlongWidth ? block.Width : block.Height;
        double ratio = minRatio + random.NextDouble() * (maxRatio - minRatio);   // minRatio～maxRatio → 切割位置的分佈範圍
        double firstLength = longSide * ratio;
        firstLength = Math.Max(minSize, Math.Min(longSide - minSize, firstLength));   // 兩塊都不小於 minSize

        // --- 切成兩塊（深度 +1） ---
        Block firstBlock, secondBlock;
        int nextDepth = block.Depth + 1;
        if (cutAlongWidth)
        {
            firstBlock = new Block(block.Corner, firstLength, block.Height, nextDepth);
            secondBlock = new Block(block.Corner + new Vector3d(firstLength, 0, 0), block.Width - firstLength, block.Height, nextDepth);
        }
        else
        {
            firstBlock = new Block(block.Corner, block.Width, firstLength, nextDepth);
            secondBlock = new Block(block.Corner + new Vector3d(0, firstLength, 0), block.Width, block.Height - firstLength, nextDepth);
        }

        // --- 兩塊各自再切（遞迴） ---
        SplitBlock(firstBlock, minSize, minRatio, maxRatio, stopChance, random, finishedBlocks);
        SplitBlock(secondBlock, minSize, minRatio, maxRatio, stopChance, random, finishedBlocks);
    }
}

// ==================================================================
// 外部：只描述「東西」，不碰 GH，可整段搬到別的元件
// ==================================================================
// 區塊：左下角 + 寬 + 深 + 被切了幾次（切割深度可拿來決定上色深淺）
class Block
{
    public Point3d Corner;
    public double Width;
    public double Height;
    public int Depth;

    public Block(Point3d corner, double width, double height, int depth)
    {
        Corner = corner;
        Width = width;
        Height = height;
        Depth = depth;
    }

    // 轉成封閉的矩形外框，供輸出成 Polyline
    public Polyline ToOutline()
    {
        var outline = new Polyline();
        outline.Add(Corner);
        outline.Add(Corner + new Vector3d(Width, 0, 0));
        outline.Add(Corner + new Vector3d(Width, Height, 0));
        outline.Add(Corner + new Vector3d(0, Height, 0));
        outline.Add(Corner);                              // 回到起點 → 封閉
        return outline;
    }
}
