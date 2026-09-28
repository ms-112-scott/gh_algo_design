"""gh-balance 工作流程的計畫工具：數位研究／藝術設計 1:1、每張卡片都有自己的圖。

python tools/bal_plan.py prep RUN [--cap 12]     產生每個演算法的輸入檔與目標數，分組成「分類與替換」單元
python tools/bal_plan.py review RUN [--cap 30]  把已完成的 BAL_*.json 分成審查批次
python tools/bal_plan.py images RUN [--per 18]  合併後：列出每個案例要找圖／檢查圖的單元
python tools/bal_plan.py art RUN                跑 imgdup，列出要補畫或重畫的卡片圖單元
python tools/bal_plan.py artvar RUN             只列「完全沒有變形畫法」的演算法（不跑 imgdup，可和分類同時進行）
python tools/bal_plan.py status [RUN]           目前兩類案例數與各演算法分布

每個子指令的 stdout 最後一行是一個 JSON（給工作流程讀），前面可能有說明文字。
已完成的單元（輸出檔已存在）會自動略過，所以同一個 RUN 可以重複執行來續跑。
"""
import json
import re
import subprocess
import sys

from wf_common import ROOT, DATA, WF, load_data, load_json, save_json

SOURCES = ("research", "art")
# 藝術設計作品較少的演算法：目標取下整（其餘取上整），總數再自動調到剛好一半
HARD_ART = {"B06", "D03", "E05", "E06", "F03", "F04", "F05", "F07", "F08", "G01", "G02", "G03"}
# 總數是奇數時，從這些演算法（依序、案例數為奇數者）多移除 1 個研究案例、不補，讓兩類能剛好相等
EXTRA_REMOVE_PREF = ["E05", "E06", "G02", "F05", "F06", "F02", "F03", "G01"]
# 使用者指定要整張重新檢查、重畫相似圖的後段家族
REVIEW_ALL = {"E03", "E04", "E05", "E06", "F01", "F02", "F03", "F04", "F05", "F06", "F07", "F08", "G01", "G02", "G03"}
VIDEO_HINT = re.compile(r"youtu|vimeo|ytimg|影片縮圖|thumbnail|縮圖", re.I)


def source_of(c):
    if c.get("source") in SOURCES:
        return c["source"]
    return "art" if any("creative coding" in str(t).lower() for t in c.get("tags", [])) else "research"


def credits():
    cr = {}
    for p in sorted((ROOT / "img").glob("credits*.json")):
        cr.update(load_json(p, {}))
    return cr


def has_photo(cid):
    return (ROOT / "img" / "cases" / f"{cid}.jpg").exists()


def stage(run):
    d = WF / "stage" / run
    d.mkdir(parents=True, exist_ok=True)
    return d


def ok_json(p):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def emit(obj):
    print(json.dumps(obj, ensure_ascii=False))


# ------------------------------------------------------------------ prep
def compute_targets(algos, cases):
    n = {k: 0 for k in algos}
    for c in cases:
        n[c["algo"]] = n.get(c["algo"], 0) + 1
    final = dict(n)
    extra = None
    if sum(n.values()) % 2:
        extra = next((k for k in EXTRA_REMOVE_PREF if n.get(k, 0) % 2), None) or \
            next(k for k in sorted(n) if n[k] % 2)
        final[extra] -= 1
    half = sum(final.values()) // 2
    tgt = {k: (final[k] // 2 if k in HARD_ART else (final[k] + 1) // 2) for k in final}
    odd = [k for k in sorted(final) if final[k] % 2]
    for k in [x for x in odd if x not in HARD_ART] + [x for x in odd if x in HARD_ART]:   # 太多：上整改下整
        if sum(tgt.values()) <= half:
            break
        if tgt[k] * 2 > final[k]:
            tgt[k] -= 1
    for k in [x for x in odd if x in HARD_ART] + [x for x in odd if x not in HARD_ART]:   # 太少：下整改上整
        if sum(tgt.values()) >= half:
            break
        if tgt[k] * 2 < final[k]:
            tgt[k] += 1
    return {k: {"n": n[k], "final": final[k], "target_art": tgt[k], "target_research": final[k] - tgt[k],
                "must_remove_extra": 1 if k == extra else 0} for k in sorted(final)}


def cmd_prep(run, cap):
    algos, cases, _ = load_data()
    sd = stage(run)
    tpath = sd / "targets.json"
    targets = load_json(tpath)
    cr = credits()
    if not targets:
        targets = compute_targets(algos, cases)
        save_json(tpath, targets, indent=1)
        for k, a in algos.items():
            items = []
            for c in (c for c in cases if c["algo"] == k):
                ph = None
                if has_photo(c["id"]):
                    x = cr.get(c["id"], {})
                    ph = {"source": x.get("source", ""), "page": x.get("page", ""), "note": x.get("note", "")}
                items.append({"id": c["id"], "title": c.get("title"), "creator": c.get("creator"), "year": c.get("year"),
                              "category": c.get("category"), "scale": c.get("scale", ""), "tags": c.get("tags", []),
                              "tools": c.get("tools", []), "url": c.get("url", ""), "summary": c.get("summary", ""),
                              "currently_cc": source_of(c) == "art", "photo": ph})
            t = targets[k]
            save_json(sd / f"in_{k}.json", {
                "run": run, "algo": {"id": k, "name_zh": a.get("name_zh"), "name_en": a.get("name_en"),
                                     "one_liner": a.get("one_liner"), "how_it_works": a.get("how_it_works", [])},
                "final_total": t["final"], "target_art": t["target_art"], "target_research": t["target_research"],
                "must_remove_extra": t["must_remove_extra"], "cases": items}, indent=1)
    done, pending = [], []
    for k in sorted(targets):
        b = ok_json(sd / f"BAL_{k}.json")
        if b and isinstance(b.get("classification"), list) and b["classification"]:
            done.append(k)
            continue
        art_now = sum(1 for c in cases if c["algo"] == k and source_of(c) == "art")
        need = max(0, targets[k]["target_art"] - art_now)
        pending.append({"algo": k, "w": need + 3 + targets[k]["n"] / 6})
    # first-fit decreasing：工作量小的演算法兩三個合給同一個 agent
    units = []
    for p in sorted(pending, key=lambda x: -x["w"]):
        u = next((u for u in units if u["w"] + p["w"] <= cap), None)
        if u:
            u["algos"].append(p["algo"])
            u["w"] += p["w"]
        else:
            units.append({"algos": [p["algo"]], "w": p["w"]})
    out = [{"id": "BAL:" + "+".join(sorted(u["algos"])), "algos": sorted(u["algos"]), "weight": round(u["w"], 1)} for u in units]
    tot = {"cases": sum(t["n"] for t in targets.values()), "final": sum(t["final"] for t in targets.values()),
           "art_target": sum(t["target_art"] for t in targets.values()),
           "art_now": sum(1 for c in cases if source_of(c) == "art")}
    print(f"目標：總數 {tot['final']}、藝術設計 {tot['art_target']}（目前 {tot['art_now']}）；待分類 {len(pending)} 個演算法 → {len(out)} 個單元；已完成 {len(done)}")
    emit({"run": run, "units": out, "done": done, "totals": tot})


# ------------------------------------------------------------------ review
def cmd_review(run, cap):
    sd = stage(run)
    reviewed = set()
    for p in sd.glob("BALREV_*.json"):
        r = ok_json(p)
        if r:
            reviewed |= set((r.get("algos") or {}).keys())
    todo = []
    for p in sorted(sd.glob("BAL_*.json")):
        b = ok_json(p)
        k = p.stem[4:]
        if b and k not in reviewed:
            todo.append({"algo": k, "w": len(b.get("new_art") or []) + 1})
    units = []
    for t in todo:   # 依演算法順序裝箱，讓同家族進同一批
        if units and units[-1]["w"] + t["w"] <= cap:
            units[-1]["algos"].append(t["algo"])
            units[-1]["w"] += t["w"]
        else:
            units.append({"algos": [t["algo"]], "w": t["w"]})
    out = [{"id": "REV:" + u["algos"][0] + ("…" + u["algos"][-1] if len(u["algos"]) > 1 else ""), "algos": u["algos"],
            "file": f"_workflow/stage/{run}/BALREV_{u['algos'][0]}.json", "items": u["w"]} for u in units]
    print(f"待審查 {len(todo)} 個演算法 → {len(out)} 批；已審查 {len(reviewed)}")
    emit({"run": run, "units": out})


# ------------------------------------------------------------------ images
def cmd_images(run, per):
    algos, cases, _ = load_data()
    sd = stage(run)
    handled = {}
    for p in sd.glob("IMG_*.json"):
        r = ok_json(p) or {}
        for x in r.get("results", []):
            if x.get("status") in ("new", "replaced", "kept", "removed", "none"):
                handled[x.get("id")] = x["status"]
    cr = credits()
    units = []
    for k in sorted(algos):
        todo, check = [], []
        for c in sorted((c for c in cases if c["algo"] == k), key=lambda c: c["id"]):
            cid = c["id"]
            if cid in handled:
                continue
            if not has_photo(cid):
                todo.append(cid)
            else:
                x = cr.get(cid, {})
                suspect = bool(VIDEO_HINT.search(" ".join(str(x.get(f, "")) for f in ("source", "page", "note"))))
                if suspect or source_of(c) == "art":
                    check.append(cid)
        items = [("todo", i) for i in todo] + [("check", i) for i in check]
        for j in range(0, len(items), per):
            chunk = items[j:j + per]
            suffix = "" if len(items) <= per else "abcdefgh"[j // per]
            uid = f"{k}{suffix}"
            units.append({"id": f"IMG:{uid}", "algo": k, "file": f"_workflow/stage/{run}/IMG_{uid}.json",
                          "todo": [i for t, i in chunk if t == "todo"], "check": [i for t, i in chunk if t == "check"]})
    n_todo = sum(len(u["todo"]) for u in units)
    n_check = sum(len(u["check"]) for u in units)
    print(f"找圖 {n_todo} 個案例、檢查既有照片 {n_check} 張 → {len(units)} 個單元；本 RUN 已處理 {len(handled)}")
    emit({"run": run, "units": units})


# ------------------------------------------------------------------ art
def var_art_counts():
    """在瀏覽器載入網站，回傳 {演算法: 已有獨立畫法的變形數}（畫法有多種寫法，靜態掃描不可靠）。"""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        pg.goto((ROOT / "index.html").resolve().as_uri())
        pg.wait_for_function("typeof ART !== 'undefined' && typeof ALGOS !== 'undefined'")
        out = pg.evaluate("() => Object.fromEntries(ALGOS.map(a => [a.id, a.id === 'A01' ? 99 : (ART.var[a.id] || []).filter(Boolean).length]))")
        b.close()
    return out


def cmd_art(run, var_only=False):
    """var_only：只列「完全沒有變形畫法」的演算法（不跑 imgdup，可在分類階段同時進行）。"""
    algos, cases, _ = load_data()
    sd = stage(run)
    marks = {p.stem[4:]: ok_json(p) or {} for p in sd.glob("ART_*.json")}
    if var_only:
        counts = var_art_counts()
        units = [{"id": f"ARTV:{k}", "algo": k, "missing_var": list(range(len(algos[k].get("variations", [])))),
                  "missing_case": [], "redo": [], "review_all": True, "hard": True, "var_only": True}
                 for k in sorted(algos) if counts.get(k, 0) == 0 and "var" not in (marks.get(k) or {}).get("phases", [])]
        print(f"沒有任何變形畫法的演算法：{', '.join(u['algo'] for u in units) or '無'}")
        emit({"run": run, "units": units})
        return
    r = subprocess.run([sys.executable, str(ROOT / "tools" / "imgdup.py")], cwd=ROOT, capture_output=True,
                       text=True, encoding="utf-8", errors="replace")
    print("\n".join(r.stdout.strip().splitlines()[-3:]))
    dup = load_json(WF / "imgdup.json", {}) or {}
    redo_file = load_json(WF / "redo_art.json", []) or []
    units = []
    for k in sorted(algos):
        d = (dup.get("algos") or {}).get(k, {})
        fb = d.get("fallback", [])
        mv = sorted(int(x.split("·V")[1]) - 1 for x in fb if "·V" in x)
        mc = [x for x in fb if "·V" not in x]
        redo = [{"key": x, "reason": "和演算法卡太像（like_algo）"} for x in d.get("like_algo", [])]
        seen = set(x["key"] for x in redo)
        for pair in d.get("near_dup", []):
            a_, b_ = pair[0], pair[1]
            if a_ in seen or b_ in seen:
                continue
            seen.add(b_)
            redo.append({"key": b_, "reason": f"和 {a_} 太像（near_dup，距離 {pair[2] if len(pair) > 2 else '?'}）"})
        redo += [{"key": x.get("key"), "reason": x.get("reason", "")} for x in redo_file if x.get("algo") == k]
        mark = marks.get(k) or {}
        review_all = k in REVIEW_ALL and not mark.get("reviewed_all")
        if not (mv or mc or redo or review_all):
            continue
        units.append({"id": f"ART:{k}", "algo": k, "missing_var": mv, "missing_case": mc, "redo": redo,
                      "review_all": review_all, "hard": bool(review_all or len(mv) >= 6 or len(redo) >= 6), "var_only": False})
    print(f"卡片圖單元 {len(units)} 個：" + "、".join(f"{u['algo']}(缺變形{len(u['missing_var'])}/缺案例{len(u['missing_case'])}/重畫{len(u['redo'])})" for u in units))
    emit({"run": run, "units": units})


# ------------------------------------------------------------------ status
def cmd_status(run=None):
    algos, cases, _ = load_data()
    tot = {s: sum(1 for c in cases if source_of(c) == s) for s in SOURCES}
    miss = sum(1 for c in cases if c.get("source") not in SOURCES)
    rows = []
    for k in sorted(algos):
        cs = [c for c in cases if c["algo"] == k]
        a = sum(1 for c in cs if source_of(c) == "art")
        rows.append(f"{k} 研究 {len(cs) - a:>2}／藝術 {a:>2}　照片 {sum(1 for c in cs if has_photo(c['id'])):>2}/{len(cs)}")
    print("\n".join(rows))
    print(f"合計：數位研究 {tot['research']}、藝術設計 {tot['art']}（{'相等' if tot['research'] == tot['art'] else '不相等'}）；缺 source 欄位 {miss}")
    emit({"research": tot["research"], "art": tot["art"], "balanced": tot["research"] == tot["art"], "missing_source": miss,
          "photos": sum(1 for c in cases if has_photo(c["id"])), "cases": len(cases)})


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("prep", "review", "images", "art", "artvar", "status"):
        print(__doc__)
        sys.exit(2)
    cmd = sys.argv[1]
    run = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith("--") else None
    opt = lambda name, d: int(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else d  # noqa: E731
    if cmd == "status":
        return cmd_status(run)
    if not run or not re.match(r"^R\d{8}-\d{4}$", run):
        print("RUN 格式：RYYYYMMDD-HHMM")
        sys.exit(2)
    if cmd == "prep":
        cmd_prep(run, opt("--cap", 12))
    elif cmd == "review":
        cmd_review(run, opt("--cap", 30))
    elif cmd == "images":
        cmd_images(run, opt("--per", 18))
    elif cmd == "art":
        cmd_art(run)
    elif cmd == "artvar":
        cmd_art(run, var_only=True)


if __name__ == "__main__":
    main()
