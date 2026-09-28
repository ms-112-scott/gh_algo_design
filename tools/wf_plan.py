"""計算每個演算法的缺口、產生待辦清單與索引，並挑選本次執行的工作單元。

python tools/wf_plan.py                 現況表（含缺圖；加 --no-art 略過瀏覽器）
python tools/wf_plan.py --index         只重建 _workflow/index/（每個演算法的既有內容摘要＋_catalog.md）
python tools/wf_plan.py --select RUN    產生 backlog、index，挑選本次單元 → _workflow/runs/RUN.plan.json（stdout 印同一份 JSON）
python tools/wf_plan.py --art RUN       合併後重新計算缺圖，更新 plan 的 stage3
可加 --stage1 N、--stage3 N 覆寫名額（預設讀 _workflow/config.json）。
全部完成時印出 ALL_DONE 並以 exit code 3 結束。
"""
import argparse
import collections
import json
import sys

from wf_common import (ROOT, WF, config, load_data, load_json, save_json, case_num, is_cc, has_image,
                       families, now_tpe)

TYPE_ORDER = {"VAR": 0, "RES": 1, "CC": 2, "FIX": 3}
ORIGINAL_FAMILIES = set("ABCDEF")   # 圖鑑最初的六大家族；其他字母視為 gh-new-algos 新增的家族

ART_JS = r"""
() => {
  const out = {};
  for (const a of ALGOS) {
    const id = a.id, vs = a.variations || [];
    out[id] = {
      hasGen: !!(window.GEN && window.GEN[id]) || id === 'A01',   // A01 由 lsystem.js 繪製
      missingVar: vs.map((v, i) => i).filter(i => !(ART.var[id] && ART.var[id][i])),
      missingCase: CASES_OF(id).filter(c => !c.image && !ART.case[c.id]).map(c => c.id),
    };
  }
  return out;
}
"""


def art_coverage():
    """用 Playwright 開 index.html，取得每個演算法的缺圖清單。"""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        try:
            b = p.chromium.launch(channel="chrome")
        except Exception:
            b = p.chromium.launch()
        pg = b.new_page()
        pg.goto((ROOT / "index.html").as_uri())
        pg.wait_for_timeout(600)
        res = pg.evaluate(ART_JS)
        b.close()
    return res


def targets_for(cfg, ledger, uid, kind):
    return ledger.get("target_override", {}).get(uid, cfg["targets"][kind])


def analyse(with_art=True):
    cfg = config()
    ledger = load_json(WF / "ledger.json", {"units": {}, "target_override": {}, "runs": [], "fix_attempts": {}})
    redo = load_json(WF / "redo_art.json", [])
    algos, cases, where = load_data()
    by = collections.defaultdict(list)
    for c in cases:
        by[c["algo"]].append(c)
    art = art_coverage() if with_art else {}

    rows, units = {}, []
    for aid in sorted(algos):
        a, cs = algos[aid], by[aid]
        res = [c for c in cs if not is_cc(c)]
        cc = [c for c in cs if is_cc(c)]
        ac = art.get(aid, {})
        # 由 gh-new-algos 新增的演算法（資料檔 ag_<編號>.json，或不屬於原本 A–F 的新家族）
        is_new = where.get("algo:" + aid, "").startswith("ag_") or a["family"] not in ORIGINAL_FAMILIES
        row = {
            "family": a["family"], "name": a.get("name_zh", ""), "new": is_new,
            "var": len(a.get("variations", [])), "res": len(res), "cc": len(cc),
            "no_url": sum(1 for c in cs if not c.get("url")),
            "img": sum(1 for c in cs if has_image(c["id"])),
            "missing_var": len(ac.get("missingVar", [])) if ac else None,
            "missing_case": len(ac.get("missingCase", [])) if ac else None,
            "has_gen": ac.get("hasGen") if ac else None,
            "t_var": targets_for(cfg, ledger, f"VAR:{aid}", "var"),
            "t_res": targets_for(cfg, ledger, f"RES:{aid}", "res"),
            "t_cc": targets_for(cfg, ledger, f"CC:{aid}", "cc"),
        }
        rows[aid] = row
        U = ledger.get("units", {})

        def add(kind, have, target, p0):
            uid = f"{kind}:{aid}"
            if U.get(uid, {}).get("exhausted") or have >= target:
                return
            need = min(cfg["unit_max"][kind], target - have)
            units.append({"id": uid, "type": kind, "algo": aid, "family": a["family"], "need": need, "new": is_new,
                          "priority": "P0" if p0 else "P1", "have": have, "target": target,
                          "last_status": U.get(uid, {}).get("last_status")})

        add("VAR", row["var"], row["t_var"], row["var"] < cfg["targets"]["var_min"])
        add("RES", row["res"], row["t_res"], row["res"] < 5)
        add("CC", row["cc"], row["t_cc"], row["cc"] == 0)
        redo_here = [r for r in redo if r.get("algo") == aid]
        if ac and (ac.get("missingVar") or ac.get("missingCase") or not ac.get("hasGen") or redo_here):
            units.append({"id": f"ART:{aid}", "type": "ART", "algo": aid, "family": a["family"], "new": is_new,
                          "priority": "P0", "no_gen": not ac.get("hasGen"),
                          "missing_var": ac.get("missingVar", []), "missing_case": ac.get("missingCase", []),
                          "redo": redo_here})

    # 空白網址：全部集中後每 10 筆一個 FIX 單元；同一筆嘗試 2 次仍查不到就不再排（留給人工）
    fa = ledger.get("fix_attempts", {})
    empty = [c for c in sorted(cases, key=lambda c: c["id"]) if not c.get("url") and fa.get(c["id"], 0) < 2]
    size = cfg["unit_max"]["FIX"]
    for k in range(0, len(empty), size):
        chunk = empty[k:k + size]
        units.append({"id": f"FIX:{k // size + 1}", "type": "FIX", "priority": "P0",
                      "family": chunk[0]["id"][0], "need": len(chunk),
                      "cases": [{"id": c["id"], "algo": c["algo"], "title": c["title"], "creator": c.get("creator", ""),
                                 "year": c.get("year", ""), "summary": c.get("summary", "")[:160]} for c in chunk]})
    return cfg, ledger, algos, cases, rows, units


def family_completion(rows):
    done, tot = collections.Counter(), collections.Counter()
    for r in rows.values():
        f = r["family"]
        for k in ("var", "res", "cc"):
            done[f] += min(r[k], r["t_" + k])
            tot[f] += r["t_" + k]
    return {f: (done[f] / tot[f] if tot[f] else 1.0) for f in tot}


def write_index(algos, cases):
    """每個演算法一份既有內容摘要，給 agent 去重用；另寫一份全目錄 _catalog.md。"""
    rej = load_json(WF / "rejected.json", [])
    by = collections.defaultdict(list)
    for c in cases:
        by[c["algo"]].append(c)
    (WF / "index").mkdir(parents=True, exist_ok=True)
    cat = ["# 既有演算法、變形與專案種子（去重用，由 wf_plan.py 產生）", ""]
    for aid in sorted(algos):
        a, cs = algos[aid], sorted(by[aid], key=lambda c: c["id"])
        dist = {k: collections.Counter() for k in ("category", "scale", "tools")}
        for c in cs:
            dist["category"][c.get("category")] += 1
            dist["scale"][c.get("scale")] += 1
            for t in c.get("tools", []):
                dist["tools"][t] += 1
        idx = {
            "id": aid, "name_zh": a.get("name_zh"), "name_en": a.get("name_en"), "family": a["family"],
            "one_liner": a.get("one_liner"), "how_it_works": a.get("how_it_works"),
            "variations": [{"index": i, "code": f"V{i + 1:02d}", "title": v.get("title"), "level": v.get("level"),
                            "what_changes": v.get("what_changes"), "how": v.get("how"), "result": v.get("result")}
                           for i, v in enumerate(a.get("variations", []))],
            "project_seeds": [p.get("title") for p in a.get("project_seeds", [])],
            "cases": [{"id": c["id"], "cc": is_cc(c), "title": c.get("title"), "creator": c.get("creator"),
                       "year": c.get("year"), "url": c.get("url", ""), "category": c.get("category"),
                       "scale": c.get("scale"), "tools": c.get("tools", []), "has_image": has_image(c["id"])}
                      for c in cs],
            "distribution": {k: dict(v.most_common()) for k, v in dist.items()},
            "rejected": [r for r in rej if r.get("algo") == aid],
        }
        save_json(WF / "index" / f"{aid}.json", idx, indent=1)
        cat.append(f"## {aid} {a.get('name_zh')}（{a.get('name_en')}）｜家族 {a['family']} {a.get('family_name', '')}"
                   f"｜難度 {a.get('difficulty')}｜邏輯 {'、'.join(a.get('logic', []))}")
        cat.append(f"- 一句話：{a.get('one_liner', '')}")
        cat.append("- 變形：" + "；".join(v.get("title", "") for v in a.get("variations", [])))
        cat.append("- 專案種子：" + "；".join(p.get("title", "") for p in a.get("project_seeds", [])))
        cat.append("")
    (WF / "index" / "_catalog.md").write_text("\n".join(cat), encoding="utf-8")


def select(run, cfg, ledger, rows, units, n1, n3):
    content = [u for u in units if u["type"] != "ART"]
    comp = family_completion(rows)
    failed_first = lambda u: 0 if u.get("last_status") == "failed" else 1
    p0 = sorted([u for u in content if u["priority"] == "P0"],
                key=lambda u: (failed_first(u), u.get("family", ""), u.get("algo", ""), TYPE_ORDER[u["type"]], u["id"]))
    # P1：新演算法優先（config 的 priority_new_algos），其次完成度最低的家族
    boost = cfg.get("priority_new_algos", True)
    new_first = lambda u: 0 if (boost and u.get("new")) else 1
    p1 = sorted([u for u in content if u["priority"] == "P1"],
                key=lambda u: (failed_first(u), new_first(u), comp.get(u["family"], 1), u["family"], u["algo"],
                               TYPE_ORDER[u["type"]]))
    stage1 = (p0 + p1)[:n1]
    chosen_algos = {u.get("algo") for u in stage1 if u["type"] in ("VAR", "RES", "CC")}
    arts = [u for u in units if u["type"] == "ART"]
    arts.sort(key=lambda u: (0 if u["redo"] else 1, 0 if u["no_gen"] else 1,
                             0 if u["algo"] in chosen_algos else 1, 0 if u.get("new") else 1,
                             -(len(u["missing_var"]) + len(u["missing_case"])), u["algo"]))
    stage3 = [{"id": u["id"], "algo": u["algo"], "no_gen": u["no_gen"], "missing_var": u["missing_var"],
               "missing_case": u["missing_case"], "redo": u["redo"]} for u in arts[:n3]]
    # 本次選到內容單元、但目前還沒缺圖的演算法：合併後才會缺圖，由 --art 重新計算
    plan = {"run": run, "created": now_tpe().isoformat(timespec="minutes"),
            "all_done": not units, "family_completion": {k: round(v, 3) for k, v in sorted(comp.items())},
            "stage1": stage1, "stage3": stage3,
            "backlog_left": {"P0": sum(1 for u in units if u["priority"] == "P0"),
                             "P1": sum(1 for u in units if u["priority"] == "P1")}}
    return plan


def print_table(rows, units):
    print(f"{'id':4} {'家':2} {'變形':>5} {'研究':>5} {'CC':>4} {'無網址':>4} {'有圖':>4} {'缺變形圖':>6} {'缺案例圖':>6} GEN")
    for aid, r in rows.items():
        mv = "-" if r["missing_var"] is None else r["missing_var"]
        mc = "-" if r["missing_case"] is None else r["missing_case"]
        gen = "-" if r["has_gen"] is None else ("有" if r["has_gen"] else "無")
        print(f"{aid:4}{'*' if r.get('new') else ' '}{r['family']:2} {r['var']:>2}/{r['t_var']:<2} {r['res']:>2}/{r['t_res']:<2} {r['cc']:>2}/{r['t_cc']:<1}"
              f" {r['no_url']:>5} {r['img']:>5} {mv:>8} {mc:>8} {gen}")
    c = collections.Counter((u["type"], u["priority"]) for u in units)
    if any(r.get("new") for r in rows.values()):
        print("＊＝gh-new-algos 新增的演算法（P1 優先處理）")
    print("待辦單元：", "、".join(f"{t}{p}×{n}" for (t, p), n in sorted(c.items())) or "無")
    comp = family_completion(rows)
    print("家族完成度：", "  ".join(f"{f} {v:.0%}" for f, v in sorted(comp.items())))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--select")
    ap.add_argument("--art")
    ap.add_argument("--index", action="store_true")
    ap.add_argument("--no-art", action="store_true")
    ap.add_argument("--stage1", type=int)
    ap.add_argument("--stage3", type=int)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    if a.index:
        algos, cases, _ = load_data()
        write_index(algos, cases)
        print(f"index：{len(algos)} 個演算法 → _workflow/index/")
        return

    cfg, ledger, algos, cases, rows, units = analyse(with_art=not a.no_art)
    n1 = a.stage1 if a.stage1 is not None else cfg["budget"]["stage1"]
    n3 = a.stage3 if a.stage3 is not None else cfg["budget"]["stage3"]

    if a.select:
        write_index(algos, cases)
        save_json(WF / "backlog.json", {"generated": now_tpe().isoformat(timespec="minutes"), "units": units}, indent=1)
        plan = select(a.select, cfg, ledger, rows, units, n1, n3)
        save_json(WF / "runs" / f"{a.select}.plan.json", plan, indent=1)
        print(json.dumps(plan, ensure_ascii=False))
        if plan["all_done"]:
            print("ALL_DONE")
            sys.exit(3)
        return

    if a.art:
        path = WF / "runs" / f"{a.art}.plan.json"
        plan = load_json(path, {"run": a.art, "stage1": []})
        touched = {u.get("algo") for u in plan.get("stage1", []) if u.get("type") in ("VAR", "RES", "CC")}
        arts = [u for u in units if u["type"] == "ART"]
        arts.sort(key=lambda u: (0 if u["redo"] else 1, 0 if u["no_gen"] else 1, 0 if u["algo"] in touched else 1,
                                 0 if u.get("new") else 1,
                                 -(len(u["missing_var"]) + len(u["missing_case"])), u["algo"]))
        plan["stage3"] = [{"id": u["id"], "algo": u["algo"], "no_gen": u["no_gen"], "missing_var": u["missing_var"],
                           "missing_case": u["missing_case"], "redo": u["redo"]} for u in arts[:n3]]
        save_json(path, plan, indent=1)
        print(json.dumps({"run": a.art, "stage3": plan["stage3"]}, ensure_ascii=False))
        return

    if a.json:
        print(json.dumps({"rows": rows, "units": units}, ensure_ascii=False, indent=1))
    else:
        print_table(rows, units)
        if not units:
            print("ALL_DONE")


if __name__ == "__main__":
    main()
