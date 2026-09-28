"""合併 data/*.json → data.js（網頁用）＋ 演算法總表.md（整理用）。

用法：python build.py
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent
DATA = ROOT / "data"

FAMILIES = {
    "A": "規則與語法", "B": "生長", "C": "場與擴散",
    "D": "代理人", "E": "排列與鬆弛", "F": "圖樣與最佳化",
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
            cases.append(c)

    cases.sort(key=lambda c: c.get("id", ""))
    known = set(algos)
    for c in cases:
        if c.get("algo") not in known:
            warnings.append(f"{c.get('id')}: algo {c.get('algo')} 不在演算法清單")

    catalog = {
        "families": FAMILIES,
        "categories": CATEGORIES,
        "logics": LOGICS,
        "difficulty": DIFFICULTY,
        "algorithms": [algos[k] for k in sorted(algos)],
        "cases": cases,
    }
    js = "window.CATALOG = " + json.dumps(catalog, ensure_ascii=False, indent=1) + ";\n"
    (ROOT / "data.js").write_text(js, encoding="utf-8")

    # 整理用總表
    lines = ["# GH 演算法設計圖鑑｜總表", "",
             f"演算法 {len(algos)} 個、案例 {len(cases)} 個、"
             f"變形食譜 {sum(len(a.get('variations', [])) for a in algos.values())} 條、"
             f"專案種子 {sum(len(a.get('project_seeds', [])) for a in algos.values())} 個", "",
             "| ID | 演算法 | 家族 | 邏輯 | 資料結構 | 難度 | 行數 | Tags | 案例數 |",
             "|---|---|---|---|---|---|---|---|---|"]
    for k in sorted(algos):
        a = algos[k]
        n = sum(1 for c in cases if c.get("algo") == k)
        lines.append(
            f"| {k} | {a.get('name_zh','')} | {a['family']} {a['family_name']} | "
            f"{'、'.join(a.get('logic', []))} | {'、'.join(a.get('data_structure', []))} | "
            f"{'★' * a['difficulty']} {DIFFICULTY[a['difficulty']]} | {a.get('loc','')} | "
            f"{' '.join('`'+t+'`' for t in a.get('tags', []))} | {n} |")
    lines += ["", "## 難度理由", ""]
    for k in sorted(algos):
        lines.append(f"- **{k} {algos[k].get('name_zh','')}**：{algos[k].get('difficulty_reason','')}")
    (ROOT / "演算法總表.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"algorithms={len(algos)} cases={len(cases)} "
          f"empty_url={sum(1 for c in cases if not c.get('url'))}")
    for w in warnings:
        print("WARN", w)
    return 0


if __name__ == "__main__":
    sys.exit(main())
