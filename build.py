"""合併 data/*.json → data.js（網頁用）＋ 演算法總表.md（整理用）。

用法：python build.py
"""
import json
import pathlib
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).parent
DATA = ROOT / "data"

FAMILIES = {
    "A": "規則與語法", "B": "生長", "C": "場與擴散",
    "D": "代理人", "E": "排列與鬆弛", "F": "圖樣與最佳化",
    "G": "空間分析",
}
CATEGORIES = {
    "2d-pattern": "平面圖像／圖樣",
    "3d-architecture": "3D 建築／空間",
    "modeling": "建模技巧",
    "drawing": "繪圖／視覺表現",
    "urban-landscape": "都市／景觀",
    "fabrication": "材料／數位製造",
    "performance": "結構／環境性能",
    "art-installation": "藝術／裝置",
}
LOGICS = ["直接公式", "改寫／遞迴", "迭代模擬", "搜尋／求解", "幾何轉換"]
DIFFICULTY = {1: "入門", 2: "基礎", 3: "中階", 4: "進階", 5: "研究級"}
SOURCES = {"research": "數位研究", "art": "藝術設計"}   # 案例來源；兩類數量要相等（使用者 2026-09-29 決定）


def source_of(c):
    """案例來源；舊資料沒有 source 時，creative coding 標籤視為藝術設計。"""
    if c.get("source") in SOURCES:
        return c["source"]
    return "art" if any("creative coding" in str(t).lower() for t in c.get("tags", [])) else "research"


def clamp_level(v, default=3):
    try:
        v = int(v)
    except (TypeError, ValueError):
        return default
    return min(5, max(1, v))


def main():
    algos, cases, warnings = {}, [], []
    for path in sorted(DATA.glob("*.json")):
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            warnings.append(f"{path.name}: JSON 解析失敗 {e}")
            continue
        for a in doc.get("algorithms", []):
            a["difficulty"] = clamp_level(a.get("difficulty"))
            a["family_name"] = FAMILIES.get(a.get("family"), a.get("family_name", ""))
            for v in a.get("variations", []):
                v["level"] = clamp_level(v.get("level"))
            for p in a.get("project_seeds", []):
                p["difficulty"] = clamp_level(p.get("difficulty"))
            bad = [l for l in a.get("logic", []) if l not in LOGICS]
            if bad:
                warnings.append(f"{a['id']}: 未知 logic {bad}")
            algos[a["id"]] = a
        for c in doc.get("cases", []):
            c["difficulty"] = clamp_level(c.get("difficulty"))
            if c.get("category") not in CATEGORIES:
                warnings.append(f"{c.get('id')}: 未知 category {c.get('category')}")
                c["category"] = "modeling"
            c["categories_extra"] = [x for x in c.get("categories_extra", []) if x in CATEGORIES]
            if c.get("source") is not None and c["source"] not in SOURCES:
                warnings.append(f"{c.get('id')}: 未知 source {c.get('source')}")
            cases.append(c)

    # 案例圖片：img/cases/<案例編號>.jpg ＋ img/credits*.json 的出處與授權
    credits = {}
    for cp in sorted((ROOT / "img").glob("credits*.json")):  # credits.json 與各批次的 credits_*.json
        credits.update(json.loads(cp.read_text(encoding="utf-8")))
    for c in cases:
        f = ROOT / "img" / "cases" / f"{c.get('id')}.jpg"
        if f.exists():
            w, h = Image.open(f).size
            c["image"] = {"file": f"img/cases/{f.name}", "w": w, "h": h, **credits.get(c["id"], {})}
            if c["id"] not in credits:
                warnings.append(f"{c['id']}: 有圖片但 credits*.json 沒有出處")

    cases.sort(key=lambda c: c.get("id", ""))
    if any("source" in c for c in cases):
        for c in cases:
            if c.get("source") not in SOURCES:
                warnings.append(f"{c.get('id')}: 缺少 source（research／art）")
    n_src = {k: sum(1 for c in cases if source_of(c) == k) for k in SOURCES}
    known = set(algos)
    for c in cases:
        if c.get("algo") not in known:
            warnings.append(f"{c.get('id')}: algo {c.get('algo')} 不在演算法清單")

    catalog = {
        "families": FAMILIES,
        "categories": CATEGORIES,
        "logics": LOGICS,
        "difficulty": DIFFICULTY,
        "sources": SOURCES,
        "algorithms": [algos[k] for k in sorted(algos)],
        "cases": cases,
    }
    js = "window.CATALOG = " + json.dumps(catalog, ensure_ascii=False, indent=1) + ";\n"
    (ROOT / "data.js").write_text(js, encoding="utf-8")

    # 整理用總表
    lines = ["# GH 演算法設計圖鑑｜總表", "",
             f"演算法 {len(algos)} 個、案例 {len(cases)} 個、"
             f"變形食譜 {sum(len(a.get('variations', [])) for a in algos.values())} 條、"
             f"專案種子 {sum(len(a.get('project_seeds', [])) for a in algos.values())} 個；"
             f"案例來源：數位研究 {n_src['research']}、藝術設計 {n_src['art']}", "",
             "| ID | 演算法 | 家族 | 邏輯 | 資料結構 | 難度 | 行數 | Tags | 案例數 | 研究／藝術 |",
             "|---|---|---|---|---|---|---|---|---|---|"]
    for k in sorted(algos):
        a = algos[k]
        n = sum(1 for c in cases if c.get("algo") == k)
        na = sum(1 for c in cases if c.get("algo") == k and source_of(c) == "art")
        lines.append(
            f"| {k} | {a.get('name_zh','')} | {a['family']} {a['family_name']} | "
            f"{'、'.join(a.get('logic', []))} | {'、'.join(a.get('data_structure', []))} | "
            f"{'★' * a['difficulty']} {DIFFICULTY[a['difficulty']]} | {a.get('loc','')} | "
            f"{' '.join('`'+t+'`' for t in a.get('tags', []))} | {n} | {n - na}／{na} |")
    lines += ["", "## 難度理由", ""]
    for k in sorted(algos):
        lines.append(f"- **{k} {algos[k].get('name_zh','')}**：{algos[k].get('difficulty_reason','')}")
    (ROOT / "演算法總表.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"algorithms={len(algos)} cases={len(cases)} "
          f"empty_url={sum(1 for c in cases if not c.get('url'))} "
          f"images={sum(1 for c in cases if c.get('image'))} "
          f"research={n_src['research']} art={n_src['art']}")
    for w in warnings:
        print("WARN", w)
    return 0


if __name__ == "__main__":
    sys.exit(main())
