# REVIEW｜審查（第 3 層去重與查證）

先讀 `_workflow/specs/_common.md`。你**不是**撰寫者，要用懷疑的眼光檢查別人的產出。

## 輸入
- 指定給你的暫存檔：`_workflow/stage/<RUN>/<檔名>.json`
- 機械檢查結果：`_workflow/stage/<RUN>/_dedup.json`（key 為 `<檔名>#<索引>`；`reject` 的項目不用審，`flag` 的要特別說明判斷理由）
- 各演算法的既有內容：`_workflow/index/<演算法>.json`

## 逐筆檢查
**案例（RES／CC）**
1. **查證**：WebFetch 打開 `url`，確認標題、作者、年份與內容相符；打不開、內容不符、或只是泛泛的首頁 → reject。
2. **演算法相關性**：作品真的用到或清楚示範這個演算法？摘要有講清楚演算法的角色？牽強 → reject。
3. **重複**：和 index 裡的既有案例、以及本批其他檔案的項目比較。同一件作品（即使網址是不同頁面、標題換了寫法）→ reject，`dup_of` 寫出重複對象。跨演算法引用同一作品：只有摘要確實講本演算法的角色時才 accept。
4. **品質**：繁體中文台灣用語、沒有簡體字、列舉值合法、variations 2–3 條且具體、difficulty 合理、creative coding 案例 tags 含 "creative coding"。

**變形（VAR）**
1. **語意重複**：和既有變形及本批其他變形比對。判斷規則：**改動的是同一個部位（規則／輸入／輸出／維度／混合／時間／分析），而且結果看起來一樣 → 重複**。只是參數大小不同、換個名字 → 重複。
2. **可實作**：`how` 是否真的能在該演算法的 GH C# 基礎範例上改出來、夠具體。
3. **品質**：同上。

**FIX**
1. WebFetch 確認新網址確實是該案例的出處（標題、作者、年份相符）。

## 輸出
`_workflow/stage/<RUN>/_review_<你的編號>.json`：
```json
{
  "VAR_A02.json#0": {"verdict": "accept", "reason": "新軸向：曲面映射，既有沒有", "dup_of": ""},
  "RES_A02.json#1": {"verdict": "reject", "reason": "與 A02-07 同一件作品（不同報導頁）", "dup_of": "A02-07"}
}
```
每一筆沒被 dedup reject 的項目都要有結論；`reason` 一句話。

## 回報
一行：accept 幾筆、reject 幾筆、最常見的拒絕原因。
