"""合併前的機械去重與欄位檢查（第 2 層去重）。

python tools/wf_dedup.py RUN
讀 _workflow/stage/RUN/*.json（底線開頭的檔案略過），逐筆標記 pass／flag／reject，
結果寫進 _workflow/stage/RUN/_dedup.json，stdout 印出統計與需要審查的檔案清單（JSON）。
flag = 需要審查 agent 特別判斷；reject = 直接擋下（合併時一定不收）。
"""
import collections
import json
import sys

from wf_common import (WF, CATEGORIES, SCALES, config, load_data, load_json, save_json, norm_url, title_sim,
                       jaccard, is_cc)

CASE_REQ = ["title", "creator", "year", "category", "scale", "summary", "variations", "difficulty", "tags", "tools", "url"]
VAR_REQ = ["title", "level", "what_changes", "how", "result"]


def unit_type(fname, doc):
    u = doc.get("unit", "")
    return (u.split(":")[0] if ":" in u else fname.split("_")[0]).upper()


def check_case(it, algo, kind, existing, others_url, rejected_urls, cfg):
    st, why = "pass", []

    def bad(msg):
        nonlocal st
        st = "reject"
        why.append(msg)

    def flag(msg):
        nonlocal st
        if st != "reject":
            st = "flag"
        why.append(msg)

    miss = [k for k in CASE_REQ if not it.get(k)]
    if miss:
        bad("缺欄位：" + "、".join(miss))
    if it.get("category") not in CATEGORIES:
        bad(f"category 不合法：{it.get('category')}")
    if it.get("scale") not in SCALES:
        bad(f"scale 不合法：{it.get('scale')}")
    if [x for x in it.get("categories_extra", []) if x not in CATEGORIES]:
        bad("categories_extra 有不合法值")
    try:
        if not 1 <= int(it.get("difficulty")) <= 5:
            bad("difficulty 不在 1–5")
    except (TypeError, ValueError):
        bad("difficulty 不是數字")
    tags = it.get("tags", [])
    if kind == "CC" and "creative coding" not in tags:
        bad("creative coding 案例的 tags 沒有 \"creative coding\"")
    if kind == "RES" and "creative coding" in tags:
        flag("研究案例卻標了 creative coding")
    if not 2 <= len(it.get("variations", [])) <= 4:
        flag("variations 應為 2–3 條")

    nu = norm_url(it.get("url"))
    if nu:
        if nu in rejected_urls:
            bad(f"網址曾被拒絕（{rejected_urls[nu]}）")
        for c in existing:
            if norm_url(c.get("url")) == nu:
                (bad if c["algo"] == algo else flag)(
                    f"網址與既有案例 {c['id']}「{c['title']}」相同" + ("" if c["algo"] == algo else "（跨演算法，需確認角度不同）"))
        if nu in others_url:
            bad(f"本批次內網址重複（{others_url[nu]}）")
    for c in existing:
        if c["algo"] != algo:
            continue
        s = title_sim(it.get("title"), c.get("title"))
        if s >= cfg["dedup"]["title_sim"]:
            flag(f"標題與 {c['id']}「{c['title']}」相似 {s:.2f}")
        if it.get("creator") and it.get("creator") == c.get("creator") and str(it.get("year")) == str(c.get("year")):
            flag(f"作者＋年份與 {c['id']} 相同")
    return st, why


def check_var(it, algo_obj, batch_vars, cfg):
    st, why = "pass", []
    miss = [k for k in VAR_REQ if not it.get(k)]
    if miss:
        return "reject", ["缺欄位：" + "、".join(miss)]
    try:
        if not 1 <= int(it["level"]) <= 5:
            return "reject", ["level 不在 1–5"]
    except (TypeError, ValueError):
        return "reject", ["level 不是數字"]
    text = it["title"] + " " + it["how"]
    for i, v in enumerate(algo_obj.get("variations", [])):
        if v.get("title", "").strip() == it["title"].strip():
            return "reject", [f"標題與既有 V{i + 1:02d} 完全相同"]
        j = jaccard(text, v.get("title", "") + " " + v.get("how", ""))
        if j >= cfg["dedup"]["var_jaccard"]:
            st = "flag"
            why.append(f"與既有 V{i + 1:02d}「{v['title']}」字詞相似 {j:.2f}")
    for key, t in batch_vars:
        j = jaccard(text, t)
        if j >= cfg["dedup"]["var_jaccard"]:
            st = "flag"
            why.append(f"與本批 {key} 字詞相似 {j:.2f}")
    return st, why


def main():
    run = sys.argv[1]
    cfg = config()
    stage = WF / "stage" / run
    algos, cases, _ = load_data()
    rej = load_json(WF / "rejected.json", [])
    rejected_urls = {r["url_norm"]: r.get("reason", "") for r in rej if r.get("url_norm")}
    out, stats = {}, collections.Counter()
    batch_url, batch_vars = {}, collections.defaultdict(list)
    files = sorted(p for p in stage.glob("*.json") if not p.name.startswith("_"))
    for p in files:
        try:
            doc = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            out[p.name] = {"status": "reject", "reasons": [f"JSON 解析失敗：{e}"]}
            stats["reject"] += 1
            continue
        kind = unit_type(p.name, doc)
        algo = doc.get("algo")
        for i, it in enumerate(doc.get("items", [])):
            key = f"{p.name}#{i}"
            if kind in ("RES", "CC"):
                if algo not in algos:
                    st, why = "reject", [f"未知演算法 {algo}"]
                else:
                    st, why = check_case(it, algo, kind, cases, batch_url, rejected_urls, cfg)
                    nu = norm_url(it.get("url"))
                    if nu and nu not in batch_url:
                        batch_url[nu] = key
            elif kind == "VAR":
                if algo not in algos:
                    st, why = "reject", [f"未知演算法 {algo}"]
                else:
                    st, why = check_var(it, algos[algo], batch_vars[algo], cfg)
                    batch_vars[algo].append((key, it.get("title", "") + " " + it.get("how", "")))
            elif kind == "FIX":
                c = next((c for c in cases if c["id"] == it.get("case_id")), None)
                st, why = "pass", []
                if not c:
                    st, why = "reject", [f"找不到案例 {it.get('case_id')}"]
                elif c.get("url"):
                    st, why = "reject", ["該案例已有網址"]
                elif not it.get("url"):
                    st, why = "reject", ["沒有查到網址：" + it.get("note", "")]
                else:
                    nu = norm_url(it["url"])
                    dup = [x["id"] for x in cases if norm_url(x.get("url")) == nu]
                    if dup:
                        st, why = "flag", [f"網址與 {','.join(dup)} 相同"]
            else:
                st, why = "reject", [f"未知單元類型 {kind}"]
            out[key] = {"status": st, "reasons": why}
            stats[st] += 1
    save_json(stage / "_dedup.json", out, indent=1)
    need_review = sorted({k.split("#")[0] for k, v in out.items() if v["status"] != "reject"})
    print(json.dumps({"stats": dict(stats), "files": [p.name for p in files], "need_review": need_review,
                      "flags": {k: v["reasons"] for k, v in out.items() if v["status"] == "flag"}},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
