"""把通過去重與審查的暫存內容寫進 data（只新增、不改舊內容、不重排）。

python tools/wf_merge.py RUN [--dry-run]
通過條件：_dedup.json 不是 reject，且某個 _review_*.json 的 verdict 是 accept。
- 變形 → 該演算法所在 data/*.json 的 variations 尾端
- 研究案例 → 該演算法所在 data/*.json 的 cases 尾端（編號接在 < 51 的最大號之後）
- creative coding 案例 → data/cc_<家族小寫>.json（編號接在 ≥ 51 的最大號之後）
- FIX → 只在該案例 url 還是空的時候補上
- 圖片：放在 GitHub 的直接下載；其他排進 _workflow/image_queue.json（在本機跑 tools/fetch_images.py）
- 被拒的寫進 _workflow/rejected.json；各單元結果寫進 _workflow/ledger.json
結果寫進 _workflow/stage/RUN/_merge.json，stdout 印摘要 JSON。
"""
import collections
import io
import json
import re
import sys
import urllib.request

from wf_common import (ROOT, DATA, WF, CC_START, config, load_data, load_json, save_json, norm_url, case_num,
                       now_tpe)

CASE_KEYS = ["id", "algo", "title", "creator", "year", "category", "categories_extra", "scale", "summary",
             "variations", "difficulty", "tags", "tools", "url"]
VAR_KEYS = ["title", "level", "what_changes", "how", "result"]
GH_HOSTS = re.compile(r"^https?://(raw\.githubusercontent\.com|user-images\.githubusercontent\.com|"
                      r"private-user-images\.githubusercontent\.com|github\.com/.+/raw/|[\w-]+\.github\.io)/", re.I)


def download_image(url, cid):
    """下載 GitHub 上的圖片並轉成 img/cases/<cid>.jpg；失敗回傳錯誤字串。"""
    try:
        from PIL import Image
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 gh-algo-atlas"})
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        im.thumbnail((900, 900))
        im.save(ROOT / "img" / "cases" / f"{cid}.jpg", quality=84)
        return None
    except Exception as e:  # noqa: BLE001
        return str(e)[:120]


def main():
    run = sys.argv[1]
    dry = "--dry-run" in sys.argv
    cfg = config()
    stage = WF / "stage" / run
    dedup = load_json(stage / "_dedup.json", {})
    review = {}
    for p in sorted(stage.glob("_review_*.json")):
        review.update(load_json(p, {}))
    plan = load_json(WF / "runs" / f"{run}.plan.json", {"stage1": []})
    ledger = load_json(WF / "ledger.json", {"units": {}, "target_override": {}, "runs": [], "fix_attempts": {}})
    ledger.setdefault("fix_attempts", {})
    rejected = load_json(WF / "rejected.json", [])
    queue = load_json(WF / "image_queue.json", [])
    credits_path = ROOT / "img" / "credits_wf.json"
    credits = load_json(credits_path, {})

    algos, cases, where = load_data()
    docs = {}  # 檔名 → 已載入的 JSON（最後一次寫回）

    def doc(name):
        if name not in docs:
            p = DATA / name
            docs[name] = load_json(p) if p.exists() else None
        return docs[name]

    def algo_obj(aid):
        d = doc(where["algo:" + aid])
        return next(a for a in d["algorithms"] if a["id"] == aid)

    # 目前每個演算法的最大案例編號（合併過程中會持續更新）
    max_res, max_cc = collections.Counter(), collections.Counter()
    for c in cases:
        n = case_num(c["id"])
        if n >= CC_START:
            max_cc[c["algo"]] = max(max_cc[c["algo"]], n)
        else:
            max_res[c["algo"]] = max(max_res[c["algo"]], n)

    summary = {"merged": collections.Counter(), "rejected": collections.Counter(), "unreviewed": 0,
               "images_downloaded": 0, "images_queued": 0, "new_ids": collections.defaultdict(list),
               "new_var_index": collections.defaultdict(list), "reject_reasons": [], "errors": []}
    unit_accept = collections.Counter()
    unit_files = {}
    fix_tried = set()
    fix_done = set()

    for p in sorted(x for x in stage.glob("*.json") if not x.name.startswith("_")):
        try:
            sd = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            summary["errors"].append(f"{p.name} 無法解析")
            continue
        unit = sd.get("unit") or p.stem.replace("_", ":", 1)
        kind = unit.split(":")[0].upper()
        unit_files[unit] = p.name
        aid = sd.get("algo")
        for i, it in enumerate(sd.get("items", [])):
            key = f"{p.name}#{i}"
            d = dedup.get(key, {"status": "reject", "reasons": ["沒有去重結果"]})
            r = review.get(key)
            if kind == "FIX":
                fix_tried.add(it.get("case_id"))
            if d["status"] == "reject" or (r and r.get("verdict") != "accept"):
                reason = "；".join(d.get("reasons", [])) if d["status"] == "reject" else (r or {}).get("reason", "")
                summary["rejected"][kind] += 1
                summary["reject_reasons"].append(f"{key} {it.get('title', it.get('case_id', ''))}：{reason}")
                if kind != "FIX" and (key in dedup or r):
                    rejected.append({"run": run, "unit": unit, "algo": aid, "kind": kind,
                                     "title": it.get("title", ""), "url_norm": norm_url(it.get("url")),
                                     "reason": reason[:200]})
                continue
            if not r:
                summary["unreviewed"] += 1
                continue

            if kind == "VAR":
                a = algo_obj(aid)
                a.setdefault("variations", []).append({k: it[k] for k in VAR_KEYS if k in it})
                summary["new_var_index"][aid].append(len(a["variations"]) - 1)
            elif kind in ("RES", "CC"):
                fam = algos[aid]["family"]
                if kind == "RES":
                    n = max_res[aid] + 1
                    if n >= CC_START:
                        summary["errors"].append(f"{aid} 研究案例編號已滿 50，{it.get('title')} 未合併")
                        continue
                    max_res[aid] = n
                    target = doc(where["algo:" + aid])
                else:
                    n = max(CC_START - 1, max_cc[aid]) + 1
                    max_cc[aid] = n
                    name = f"cc_{fam.lower()}.json"
                    if doc(name) is None:
                        docs[name] = {"agent": fam.lower(), "algorithms": [], "cases": []}
                    target = doc(name)
                cid = f"{aid}-{n:02d}"
                stray = ROOT / "img" / "cases" / f"{cid}.jpg"
                if stray.exists() and not dry:
                    # 沒有對應案例的舊圖片（例如中斷的 agent 留下的），移開以免被誤配到新案例
                    dest = WF / "orphan_images" / stray.name
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    stray.replace(dest)
                    summary["errors"].append(f"{cid}.jpg 是沒有對應案例的舊圖，已移到 _workflow/orphan_images/")
                case = {"id": cid, "algo": aid}
                case.update({k: it[k] for k in CASE_KEYS if k in it and k not in ("id", "algo")})
                case.setdefault("categories_extra", [])
                target.setdefault("cases", []).append(case)
                summary["new_ids"][aid].append(cid)
                img = it.get("image_candidate") or {}
                if img.get("url"):
                    cred = {k: img.get(k, "") for k in ("source", "author", "license", "license_url", "page", "note")}
                    err = download_image(img["url"], cid) if (GH_HOSTS.match(img["url"]) and not dry) else "非 GitHub 主機"
                    if err is None:
                        credits[cid] = cred
                        summary["images_downloaded"] += 1
                    else:
                        queue.append({"case_id": cid, "url": img["url"], **cred, "queued_run": run})
                        summary["images_queued"] += 1
            elif kind == "FIX":
                cid = it["case_id"]
                name = where.get("case:" + cid)
                c = next(c for c in doc(name)["cases"] if c["id"] == cid)
                if not c.get("url"):
                    c["url"] = it["url"]
                    fix_done.add(cid)
            summary["merged"][kind] += 1
            unit_accept[unit] += 1

    # ledger：每個計畫內的單元記錄結果
    stamp = now_tpe().isoformat(timespec="minutes")
    for u in plan.get("stage1", []):
        uid = u["id"]
        e = ledger["units"].setdefault(uid, {"attempts": 0, "accepted": 0, "shortfalls": 0})
        e["attempts"] += 1
        e["last_run"] = run
        e["need"] = u.get("need")
        if uid not in unit_files:
            e["last_status"] = "failed"
            continue
        got = unit_accept[uid]
        e["accepted"] += got
        if u["type"] == "FIX":
            e["last_status"] = "ok"
            continue
        if got < (u.get("need") or 0):
            e["shortfalls"] += 1
            e["last_status"] = "shortfall"
            if u["type"] in ("RES", "CC") and e["shortfalls"] >= cfg["exhaust_after_shortfalls"]:
                e["exhausted"] = True
                ledger["target_override"][uid] = u.get("have", 0) + got
        else:
            e["last_status"] = "ok"
    for cid in fix_tried - fix_done:
        ledger["fix_attempts"][cid] = ledger["fix_attempts"].get(cid, 0) + 1
    ledger.setdefault("runs", []).append({"run": run, "merged_at": stamp,
                                          "merged": dict(summary["merged"]), "rejected": dict(summary["rejected"])})

    out = {"run": run, "merged": dict(summary["merged"]), "rejected": dict(summary["rejected"]),
           "unreviewed": summary["unreviewed"], "images_downloaded": summary["images_downloaded"],
           "images_queued": summary["images_queued"], "new_ids": dict(summary["new_ids"]),
           "new_var_index": dict(summary["new_var_index"]), "reject_reasons": summary["reject_reasons"],
           "errors": summary["errors"]}
    if not dry:
        for name, d in docs.items():
            if d is not None:
                save_json(DATA / name, d)
        save_json(WF / "rejected.json", rejected, indent=1)
        save_json(WF / "image_queue.json", queue, indent=1)
        save_json(WF / "ledger.json", ledger, indent=1)
        if credits:
            save_json(credits_path, credits, indent=1)
        save_json(stage / "_merge.json", out, indent=1)
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
