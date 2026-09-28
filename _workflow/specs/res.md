# RES｜新增建築／研究案例

先讀 `_workflow/specs/_common.md`。

## 任務
為指定演算法新增 `need` 個**建築／研究**案例：建成作品、競圖或展館、研究計畫、學術論文、學位論文、數位製造實驗、設計工具。案例必須真的用到（或清楚示範）這個演算法。

## 步驟
1. 讀 `_workflow/index/<演算法>.json`，看既有案例的 `distribution`（category、scale、tools 分布）與曾被拒絕的項目。
2. 寫 `coverage_note`：哪些 category／scale 已經很多、哪些缺，本次往缺的方向找（例如都市尺度、製造、性能分析、非歐美地區的案例、近五年的研究）。
3. 找案例並用 WebFetch 查證。優先來源：事務所或研究室官網、期刊與研討會（CAADRIA、eCAADe、ACADIA、SIGraDi、IJAC、Automation in Construction…）、大學研究頁、ArchDaily／Dezeen 等報導、Food4Rhino 外掛頁。
4. 逐一和既有案例比對：同一件作品不同網址也算重複。

## 每個案例的欄位
```json
{
  "title": "作品或論文名稱（可中英並列）",
  "creator": "作者／事務所／團隊",
  "year": "2019",
  "category": "3d-architecture",
  "categories_extra": ["performance"],
  "scale": "建築",
  "summary": "2–3 句：這是什麼、演算法在其中扮演什麼角色、和基礎範例（Grasshopper C#）有什麼不同",
  "variations": [
    {"name": "變形名稱", "how": "相對於基礎範例要怎麼改（具體）", "effect": "得到什麼效果"}
  ],
  "difficulty": 3,
  "tags": ["特性標籤"],
  "tools": ["Grasshopper", "Kangaroo"],
  "url": "https://…",
  "evidence": "WebFetch 看到的頁面標題或確認句",
  "nearest_existing": "最接近的既有案例編號與標題（沒有就寫「無」）",
  "image_candidate": {"url": "圖片直接網址", "page": "所在頁面", "source": "來源名稱", "author": "作者", "license": "授權（沒有明確標示就寫「網頁預覽圖，教學引用」）", "license_url": "", "note": "一句話說明圖片內容"}
}
```
- `variations` 2–3 條；`tags` **不要**加 "creative coding"。
- `image_candidate` 可省略；有的話優先：Wikimedia Commons 自由授權照片、CC BY 論文圖、GitHub repo 裡的圖、作品頁的 og:image。圖片必須是該作品本身（不是 logo 或通用圖）。
- `evidence`、`nearest_existing`、`image_candidate` 不會進網站。

## 輸出
`_workflow/stage/<RUN>/RES_<演算法>.json`：
```json
{"unit": "RES:<演算法>", "algo": "<演算法>", "coverage_note": "…", "items": [ … ]}
```
查不到足量可查證的案例就只交找得到的數量，並在 `coverage_note` 說明原因。

## 回報
一行：產出幾個、category／scale 分布、有圖片候選的數量。
