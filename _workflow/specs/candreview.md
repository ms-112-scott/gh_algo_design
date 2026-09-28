# CANDREVIEW｜新演算法候選的審查

先讀 `_workflow/specs/_common.md`。你**不是**提出候選的人，要用懷疑的眼光檢查。

## 輸入
- `_workflow/explore/<RUN>/_candidates.json`（彙整後的候選，每筆有 `key`）
- 協調流程指定給你的 key 清單
- `_workflow/index/_catalog.md`（既有演算法、全部變形、專案種子）

## 逐筆檢查
1. **是否真的是新演算法**：和 _catalog.md 的每個既有演算法與變形比對。判斷規則：
   - 核心機制、主要資料結構、產出類型三者中，至少有一項和最接近的既有演算法本質不同 → 可以是新演算法
   - 只是既有演算法換規則、換輸入、換輸出、加維度 → 應該是變形（寫出併入哪個演算法）
   - 和其他候選其實是同一個東西 → 標出重複的 key
2. **查證**：WebFetch 打開每個 `architecture_cases`、`cc_refs`、`references` 的 url，確認標題、作者、年份相符；記下失敗的網址。
3. **可行性**：能不能在單一 GH C# Script 元件內、100–400 行、只用 RhinoCommon 做出來？需要外部函式庫或 GPU 的要扣分或淘汰。
4. **建築相關性**：案例是否真實且和建築／設計相關，不是硬湊。

## 輸出
`_workflow/explore/<RUN>/_review_<你的編號>.json`：
```json
{"K03": {"verdict": "accept|reject|variation", "merge_into": "", "dup_of": "", "failed_urls": ["…"],
         "score_adjust": 0, "reason": "一句話"}}
```
`score_adjust` 可以是 −3 到 +1（例如案例牽強、可行性被高估就扣分）。

## 回報
一行：accept／reject／variation 各幾筆、主要原因。
