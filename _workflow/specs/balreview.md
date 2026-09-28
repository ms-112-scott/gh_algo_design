# BALREVIEW｜審查「數位研究／藝術設計」分類與替換

先讀 `_workflow/specs/_common.md` 與 `_workflow/specs/balance.md`（撰寫者的規格）。你**不是撰寫者**，要獨立檢查。

## 你負責的檔案
協調流程會給你幾個演算法；每個演算法讀：
- `_workflow/stage/<RUN>/BAL_<演算法>.json`（撰寫者的分類、移除順序、新增藝術案例）
- `_workflow/stage/<RUN>/in_<演算法>.json`（既有案例）

## 檢查項目
1. **新增藝術案例**（`new_art`，每一個都要看）：
   - 用 WebFetch 打開 `url`：作品存在、標題／作者／年份相符、本演算法是作品核心。
   - 圖片：`python tools/setimg.py <演算法>-R<索引> "<image.url>" --preview`，用 Read 打開 `_shots/cand/…jpg` 親眼確認是**作品本身的演算法生成畫面**。影片縮圖、影片標題卡、講者人像、教學封面、logo、編輯器截圖、空白、和作品無關的圖 → 不合格。
     圖不合格但作品本身好：自己找一張合格的圖（同樣先預覽確認），寫進 `image_fix`；找不到才 reject。
   - 重複：和既有案例（`_workflow/index/_catalog.md`、本演算法的 in 檔）是同一件作品 → reject。
   - 是否真的屬於藝術設計（見 balance.md 分類準則）。
   - 文字：繁體中文、summary 講清楚演算法在作品中的角色、variations 具體。
2. **分類**：抽查所有分類，明顯錯的寫進 `fix_class`（例如建成建築被標 art、Coding Train 生成畫面被標 research）。
3. **移除順序**：前 `need + must_remove_extra` 個如果包含不該刪的（經典代表作、有好照片、唯一的某類型、和演算法關係很強），寫進 `protect`；被保護後，合併工具會往後取下一個。

## 輸出
`<協調流程指定的檔案>`（例如 `_workflow/stage/<RUN>/BALREV_A01.json`）：
```json
{
  "reviewer": "BALREV",
  "algos": {
    "A01": {
      "reject_new": [{"index": 2, "reason": "圖片是 YouTube 縮圖，找不到作品畫面"}],
      "image_fix": [{"index": 0, "image": {"url": "…", "page": "…", "verified": true, "checked": "…", "source": "…", "author": "…", "license": "…", "license_url": "", "note": "…"}}],
      "fix_class": [{"id": "A01-07", "source": "research", "why": "…"}],
      "protect": [{"id": "A01-03", "why": "經典代表作且有實景照片"}],
      "notes": "一句話總評"
    }
  }
}
```
- `index` 是 `new_art` 陣列的索引（0 起算）。
- 每個負責的演算法都要有一個鍵，即使四個清單都是空的。
- 寫完驗證 JSON 可解析。只能寫這一個檔案（與 `_shots/cand/` 預覽圖）。

## 回報
一行：審了幾個新案例、reject 幾個（主因）、image_fix 幾個、fix_class 幾個、protect 幾個。
