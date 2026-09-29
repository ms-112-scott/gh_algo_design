"""gh-comp 工作流程的規劃工具：每個演算法一個 Grasshopper C# 元件檔（comp_codes/<家族>/<id>_<英文名>.cs）。

python tools/cs_plan.py list RUN [--redo A01,B02] [--all]
    → 最後一行印出 JSON：{"units": [...], "done": [...], "total": N}
      units：還要處理的演算法（write=true 表示要撰寫；已寫好但未通過審查的只審查）
      done：已通過 Opus 審查的演算法（_workflow/stage/RUN/CSR_<id>.json 的 pass 為 true 且檔案存在）
      --redo：指定的演算法即使已通過也重做；--all：全部重做
python tools/cs_plan.py show ID
    → 印出撰寫與審查需要的演算法資料（JSON）：名稱、家族、邏輯、how_it_works、pseudo_code、key_params …
      以及目標路徑 target、既有範例 legacy（cs/ 下的舊版，可能沒有）、課堂完成版 course（B04、A04、E01）
python tools/cs_plan.py status RUN
    → 最後一行印出 JSON：各演算法的狀態（missing／written／reviewed_fail／pass）
"""
import json
import pathlib
import sys

from wf_common import ROOT, WF, load_data, load_json

OUT = ROOT / "comp_codes"
LEGACY = ROOT / "cs"
COURSE_DIR = ROOT.parent / "115-1_演算法設計" / "04_程式碼"
TEMPLATE = COURSE_DIR / "C#_gh_comp_base_template.cs"
COURSE = {  # 課堂 W3 實作的完成版（風格範本，也可直接當起點）
    "B04": COURSE_DIR / "W3_實作" / "L1_葉序_step4.cs",
    "A04": COURSE_DIR / "W3_實作" / "L2_遞迴分割_step5.cs",
    "E01": COURSE_DIR / "W3_實作" / "L3_CirclePacking_step5.cs",
}
FIELDS = ["id", "name_zh", "name_en", "family", "family_name", "logic", "data_structure", "difficulty",
          "one_liner", "how_it_works", "pseudo_code", "key_params", "csharp_concepts", "prerequisites",
          "teaching_note"]


def target(a):
    fam = a.get("family") or a["id"][0]
    name = a.get("file") or f"{a['id']}.cs"
    return OUT / fam / name


def rel(p):
    try:
        return p.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return str(p)


def state(run, a):
    t = target(a)
    stage = WF / "stage" / run
    w = load_json(stage / f"CSW_{a['id']}.json")
    r = load_json(stage / f"CSR_{a['id']}.json")
    if not t.exists():
        return "missing"
    if r and r.get("pass") is True:
        return "pass"
    if r:
        return "reviewed_fail"
    return "written" if w else "missing"


def unit(run, a):
    legacy = LEGACY / (a.get("file") or "")
    course = COURSE.get(a["id"])
    st = state(run, a)
    return {
        "id": a["id"], "family": a.get("family") or a["id"][0], "name": f"{a.get('name_en', '')}｜{a.get('name_zh', '')}",
        "target": rel(target(a)), "write": st == "missing",
        "legacy": rel(legacy) if a.get("file") and legacy.exists() else "",
        "course": str(course) if course and course.exists() else "",
        "state": st,
    }


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    cmd = sys.argv[1]
    algos, _, _ = load_data()
    if cmd == "show":
        a = algos.get(sys.argv[2]) if len(sys.argv) > 2 else None
        if not a:
            print(f"FAIL 找不到演算法 {sys.argv[2:]}")
            return 1
        out = {k: a.get(k) for k in FIELDS if k in a}
        out["target"] = rel(target(a))
        out["template"] = str(TEMPLATE)
        legacy = LEGACY / (a.get("file") or "")
        out["legacy"] = rel(legacy) if a.get("file") and legacy.exists() else ""
        c = COURSE.get(a["id"])
        out["course"] = str(c) if c and c.exists() else ""
        print(json.dumps(out, ensure_ascii=False, indent=1))
        return 0
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    run = sys.argv[2]
    redo = set()
    if "--redo" in sys.argv:
        i = sys.argv.index("--redo")
        redo = {s.strip() for s in sys.argv[i + 1].split(",") if s.strip()} if i + 1 < len(sys.argv) else set()
    if "--all" in sys.argv:
        redo = set(algos)
    if cmd == "list":
        units, done = [], []
        for k in sorted(algos):
            u = unit(run, algos[k])
            if k in redo:
                u["write"], u["state"] = True, "redo"
            if u["state"] == "pass":
                done.append(k)
            else:
                units.append(u)
        (WF / "stage" / run).mkdir(parents=True, exist_ok=True)
        print(json.dumps({"units": units, "done": done, "total": len(algos)}, ensure_ascii=False))
        return 0
    if cmd == "status":
        s = {k: state(run, algos[k]) for k in sorted(algos)}
        counts = {}
        for v in s.values():
            counts[v] = counts.get(v, 0) + 1
        print(json.dumps({"counts": counts, "algos": s}, ensure_ascii=False))
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main())
