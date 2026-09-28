"""gh-balance 合併：套用分類、以藝術設計案例替換最弱的研究案例，讓兩類數量剛好相等。

python tools/bal_merge.py RUN [--dry-run] [--force] [--no-images]

讀：_workflow/stage/RUN/targets.json、BAL_<演算法>.json（分類與替換）、BALREV_*.json（審查）
做：
1. 每個案例的 source（research／art）＝分類結果，再套用審查的修正（fix_class）
2. 決定每個演算法替換幾個：先補到各演算法的 target_art，再用備援案例與移除清單把全站調成剛好一半
   （找不到足量時，從藝術比例最低的演算法優先補）；總數為奇數時依 targets 的 must_remove_extra 多移除 1 個研究案例
3. 用 tools/wf_remove.py 移除被替換的研究案例（連同圖片、出處、卡片畫法；記進 removed.json、rejected.json）
4. 新的藝術設計案例寫進 data/bal_art.json（編號接在該演算法既有的 51 號以後），source＝art
5. 新案例的圖片直接用 tools/setimg.py 下載登記；下載失敗的排進 _workflow/image_queue.json（之後的找圖步驟會再處理）
6. 報告寫在 _workflow/stage/RUN/_merge.json；stdout 最後一行是摘要 JSON
同一個 RUN 只會合併一次（_merge.json 已存在就直接印出；--force 重做）。
"""
import argparse
import json
import subprocess
import sys

from wf_common import ROOT, DATA, WF, CATEGORIES, SCALES, load_data, load_json, save_json, norm_url, now_tpe

SOURCES = ("research", "art")
SITE_FIELDS = ["id", "algo", "title", "creator", "year", "category", "categories_extra", "source", "scale",
               "summary", "variations", "difficulty", "tags", "tools", "url"]


def source_of(c):
    if c.get("source") in SOURCES:
        return c["source"]
    return "art" if any("creative coding" in str(t).lower() for t in c.get("tags", [])) else "research"


def norm_title(t):
    return "".join(ch for ch in str(t or "").lower() if ch.isalnum())


def with_source(c, src):
    """在 categories_extra 後面插入 source（保持欄位順序好讀）。"""
    out = {}
    for k, v in c.items():
        if k == "source":
            continue
        out[k] = v
        if k == "categories_extra":
            out["source"] = src
    if "source" not in out:
        out["source"] = src
    return out


def clean_new(item, cid, algo):
    cat = item.get("category") if item.get("category") in CATEGORIES else "drawing"
    extra = [x for x in (item.get("categories_extra") or []) if x in CATEGORIES and x != cat]
    tags = [t for t in (item.get("tags") or []) if isinstance(t, str) and t.strip()]
    if not any(t.lower() == "creative coding" for t in tags):
        tags.insert(0, "creative coding")
    try:
        diff = min(5, max(1, int(item.get("difficulty", 2))))
    except (TypeError, ValueError):
        diff = 2
    c = {"id": cid, "algo": algo, "title": item.get("title", "").strip(), "creator": item.get("creator", "").strip(),
         "year": str(item.get("year", "")).strip(), "category": cat, "categories_extra": extra, "source": "art",
         "scale": item.get("scale") if item.get("scale") in SCALES else "物件",
         "summary": item.get("summary", "").strip(),
         "variations": [v for v in (item.get("variations") or []) if isinstance(v, dict) and v.get("name")],
         "difficulty": diff, "tags": tags, "tools": [t for t in (item.get("tools") or []) if isinstance(t, str)],
         "url": item.get("url", "").strip()}
    return {k: c[k] for k in SITE_FIELDS}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--no-images", action="store_true")
    a = ap.parse_args()
    run = a.run
    sd = WF / "stage" / run
    report_path = sd / "_merge.json"
    if report_path.exists() and not a.force and not a.dry_run:
        rep = load_json(report_path)
        print("本 RUN 已合併過（--force 可重做）")
        print(json.dumps(rep.get("summary", rep), ensure_ascii=False))
        return
    targets = load_json(sd / "targets.json")
    if not targets:
        print(json.dumps({"ok": False, "error": f"找不到 {sd / 'targets.json'}，請先跑 bal_plan.py prep"}, ensure_ascii=False))
        sys.exit(1)

    algos, cases, where = load_data()
    by_algo = {k: [c for c in cases if c["algo"] == k] for k in algos}
    ids = {c["id"] for c in cases}
    review = {}
    for p in sorted(sd.glob("BALREV_*.json")):
        for k, v in ((load_json(p, {}) or {}).get("algos") or {}).items():
            review[k] = v
    # 既有網址與標題（含曾被拒、被移除的），新案例不可重複
    seen_url = {norm_url(c.get("url")) for c in cases if c.get("url")}
    seen_title = {norm_title(c.get("title")) for c in cases}
    for r in load_json(WF / "rejected.json", []) or []:
        if r.get("url_norm"):
            seen_url.add(r["url_norm"])

    plan, missing, notes = {}, [], []
    for k in sorted(targets):
        t = targets[k]
        bal = load_json(sd / f"BAL_{k}.json")
        rv = review.get(k) or {}
        cls = {c["id"]: source_of(c) for c in by_algo.get(k, [])}
        if not bal:
            missing.append(k)
            bal = {}
        for x in bal.get("classification") or []:
            if x.get("id") in cls and x.get("source") in SOURCES:
                cls[x["id"]] = x["source"]
        for x in rv.get("fix_class") or []:
            if x.get("id") in cls and x.get("source") in SOURCES:
                cls[x["id"]] = x["source"]
        rej = {int(x["index"]) if isinstance(x, dict) else int(x) for x in (rv.get("reject_new") or [])}
        fix_img = {int(x["index"]): x.get("image") for x in (rv.get("image_fix") or []) if isinstance(x, dict) and x.get("image")}
        new = []
        for i, it in enumerate(bal.get("new_art") or []):
            if i in rej or not isinstance(it, dict):
                continue
            it = dict(it)
            if i in fix_img:
                it["image"] = fix_img[i]
            img = it.get("image") or {}
            u, tt = norm_url(it.get("url")), norm_title(it.get("title"))
            if not it.get("title") or not it.get("url") or not img.get("url"):
                notes.append(f"{k} new_art[{i}] 缺標題／網址／圖片，略過")
                continue
            if u in seen_url or tt in seen_title:
                notes.append(f"{k} new_art[{i}]「{it.get('title')}」與既有或其他新案例重複，略過")
                continue
            seen_url.add(u)
            seen_title.add(tt)
            new.append(it)
        protect = {x["id"] if isinstance(x, dict) else x for x in (rv.get("protect") or [])}
        removable = []
        for cid in bal.get("removal_order") or []:
            if cid in cls and cls[cid] == "research" and cid not in protect and cid not in removable:
                removable.append(cid)
        extra = t.get("must_remove_extra", 0)
        if extra and len(removable) < extra:
            # 沒有給移除清單：從沒有照片的研究案例裡取編號最大者
            pool = [c["id"] for c in by_algo[k] if cls[c["id"]] == "research" and c["id"] not in protect and c["id"] not in removable]
            pool.sort(key=lambda i: ((ROOT / "img" / "cases" / f"{i}.jpg").exists(), i), reverse=False)
            removable += pool[:extra - len(removable)]
            notes.append(f"{k} 移除清單不足，額外移除改用 {removable[-extra:]}")
        art_now = sum(1 for v in cls.values() if v == "art")
        plan[k] = {"cls": cls, "new": new, "removable": removable, "extra": extra, "art_now": art_now,
                   "final": t["final"], "target_art": t["target_art"], "k": 0, "why_removed": bal.get("removal_reasons") or {}}

    # ---------------- 配額：先補各自目標，再調到全站剛好一半
    def cap(p):
        return min(len(p["new"]), max(0, len(p["removable"]) - p["extra"]))
    for p in plan.values():
        p["k"] = min(max(0, p["target_art"] - p["art_now"]), cap(p))
    final_total = sum(p["final"] for p in plan.values())
    half = final_total // 2
    art_total = lambda: sum(p["art_now"] + p["k"] for p in plan.values())  # noqa: E731
    while art_total() < half:
        cands = [k for k, p in plan.items() if p["k"] < cap(p)]
        if not cands:
            break
        k = min(cands, key=lambda k: ((plan[k]["art_now"] + plan[k]["k"]) / max(1, plan[k]["final"]), k))
        plan[k]["k"] += 1
    while art_total() > half:
        cands = [k for k, p in plan.items() if p["k"] > 0]
        if not cands:
            break
        k = max(cands, key=lambda k: ((plan[k]["art_now"] + plan[k]["k"]) / max(1, plan[k]["final"]), k))
        plan[k]["k"] -= 1
    shortfall = half - art_total()

    per = {}
    remove_rep, remove_extra, adds = [], [], []
    for k, p in plan.items():
        rm = p["removable"][:p["k"]]
        ex = p["removable"][p["k"]:p["k"] + p["extra"]]
        remove_rep += rm
        remove_extra += ex
        adds += [(k, it) for it in p["new"][:p["k"]]]
        per[k] = {"art_before": p["art_now"], "replace": p["k"], "extra_removed": len(ex),
                  "art_after": p["art_now"] + p["k"], "total_after": len(p["cls"]) - len(ex),
                  "removed": rm + ex, "backups_left": len(p["new"]) - p["k"]}
    art_after = art_total()
    summary = {"ok": art_after * 2 == final_total, "run": run, "research": final_total - art_after, "art": art_after,
               "balanced": art_after * 2 == final_total, "shortfall": shortfall,
               "removed": len(remove_rep) + len(remove_extra), "added": len(adds), "missing_bal": missing}
    if a.dry_run:
        for k, v in per.items():
            print(k, v)
        print("\n".join(notes))
        print(json.dumps(summary, ensure_ascii=False))
        return

    py = sys.executable
    # 1. 移除
    if remove_rep:
        subprocess.run([py, str(ROOT / "tools" / "wf_remove.py"), "--reason",
                        f"gh-balance {run}：數位研究／藝術設計 1:1，替換為藝術設計案例", *remove_rep], cwd=ROOT, check=True)
    if remove_extra:
        subprocess.run([py, str(ROOT / "tools" / "wf_remove.py"), "--reason",
                        f"gh-balance {run}：總數調為偶數，讓兩類案例相等", *remove_extra], cwd=ROOT, check=True)
    gone = set(remove_rep) | set(remove_extra)
    # 2. source 欄位
    cls_all = {cid: v for p in plan.values() for cid, v in p["cls"].items()}
    for path in sorted(DATA.glob("*.json")):
        doc = load_json(path)
        if not doc.get("cases"):
            continue
        doc["cases"] = [with_source(c, cls_all.get(c["id"], source_of(c))) for c in doc["cases"] if c["id"] not in gone]
        save_json(path, doc)
    # 3. 新案例
    removed_ids = {x.get("id") for x in (load_json(WF / "removed.json", []) or [])}
    out_path = DATA / "bal_art.json"
    out = load_json(out_path, {"agent": "gh-balance：數位研究／藝術設計 1:1 替換進來的藝術設計案例", "cases": []})
    used = ids | removed_ids | {c["id"] for c in out["cases"]}
    new_ids, queued, img_ok = [], [], 0
    queue = load_json(WF / "image_queue.json", []) or []
    for k, it in adds:
        n = 51
        while f"{k}-{n:02d}" in used:
            n += 1
        cid = f"{k}-{n:02d}"
        used.add(cid)
        out["cases"].append(clean_new(it, cid, k))
        new_ids.append(cid)
        img = it.get("image") or {}
        ok = False
        if not a.no_images:
            r = subprocess.run([py, str(ROOT / "tools" / "setimg.py"), cid, img["url"], "--page", img.get("page") or it.get("url"),
                                "--source", img.get("source") or "作品頁", "--author", img.get("author") or it.get("creator", ""),
                                "--license", img.get("license") or "網頁預覽圖，教學引用", "--license-url", img.get("license_url") or "",
                                "--note", img.get("note") or ""], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
            ok = r.returncode == 0
            if not ok:
                notes.append(f"{cid} 圖片下載失敗：{(r.stdout + r.stderr).strip().splitlines()[-1][:120] if (r.stdout + r.stderr).strip() else '?'}")
        if ok:
            img_ok += 1
        else:
            queued.append(cid)
            queue.append({"case_id": cid, "url": img.get("url"), "page": img.get("page") or it.get("url"),
                          "source": img.get("source", ""), "author": img.get("author", ""),
                          "license": img.get("license") or "網頁預覽圖，教學引用", "license_url": img.get("license_url", ""),
                          "note": img.get("note", ""), "queued_run": run})
    save_json(out_path, out, indent=1)
    save_json(WF / "image_queue.json", queue, indent=1)
    summary.update({"new_ids": new_ids, "images_ok": img_ok, "images_queued": queued})
    rep = {"at": now_tpe().isoformat(timespec="minutes"), "summary": summary, "per_algo": per, "notes": notes,
           "removal_reasons": {cid: plan[cid.split("-")[0]]["why_removed"].get(cid, "") for cid in gone}}
    save_json(report_path, rep, indent=1)
    print("\n".join(notes[-40:]))
    print(json.dumps({k: v for k, v in summary.items() if k != "new_ids"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
