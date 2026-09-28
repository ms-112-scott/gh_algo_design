"""移除指定的案例（使用者明確要求時才用，例如超出教學難度的內容）。

python tools/wf_remove.py --reason "神經網路相關，超出教學難度" A06-12 D02-05 [--dry-run]

每個案例會：
- 從所在的 data/*.json 刪除
- 刪除 img/cases/<編號>.jpg 與 img/credits*.json 裡的出處
- 刪除 assets/art/<演算法>.js 裡的 ART.case["<編號>"] 畫法（含 .ratio 那一行）
- 記錄到 _workflow/removed.json，並把網址與標題加進 _workflow/rejected.json（之後的排程不會再收）
案例編號不會重用（留空號），既有網址 #<編號> 會失效。
"""
import argparse
import re

from wf_common import ROOT, DATA, WF, load_json, save_json, norm_url, now_tpe


def cut_art_case(js, cid):
    """刪除 ART.case["cid"] = function(...){...}; 與其 .ratio 設定，回傳 (新內容, 是否找到)。"""
    key = f'ART.case["{cid}"]'
    start = js.find(key + " = function")
    if start < 0:
        start = js.find(key + "=function")
    if start < 0:
        return js, False
    i = js.index("{", js.index(")", start))
    depth, j = 0, i
    in_str = None
    while j < len(js):
        ch = js[j]
        if in_str:
            if ch == "\\":
                j += 2
                continue
            if ch == in_str:
                in_str = None
        elif ch in "\"'`":
            in_str = ch
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                break
        j += 1
    end = j + 1
    if end < len(js) and js[end] == ";":
        end += 1
    # 連同行尾換行
    if end < len(js) and js[end] == "\n":
        end += 1
    # 緊接在上方、提到這個編號的註解行也一併刪除
    line_start = js.rfind("\n", 0, start) + 1
    prev_start = js.rfind("\n", 0, max(line_start - 1, 0)) + 1
    if line_start > 0 and js[prev_start:line_start].lstrip().startswith("//") and cid in js[prev_start:line_start]:
        start = prev_start
    js = js[:start] + js[end:]
    js = re.sub(r'^[ \t]*' + re.escape(key) + r'\.ratio\s*=\s*[^;\n]*;?[ \t]*\n?', "", js, flags=re.M)
    return js, True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="+")
    ap.add_argument("--reason", required=True)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    removed = load_json(WF / "removed.json", [])
    rejected = load_json(WF / "rejected.json", [])
    credit_files = sorted((ROOT / "img").glob("credits*.json"))
    for cid in a.ids:
        found = None
        for p in sorted(DATA.glob("*.json")):
            doc = load_json(p)
            for k, c in enumerate(doc.get("cases", [])):
                if c["id"] == cid:
                    found = (p, doc, k, c)
                    break
            if found:
                break
        if not found:
            print(f"✗ 找不到 {cid}")
            continue
        p, doc, k, c = found
        algo = c["algo"]
        notes = [f"data/{p.name}"]
        if not a.dry_run:
            doc["cases"].pop(k)
            save_json(p, doc)
        img = ROOT / "img" / "cases" / f"{cid}.jpg"
        if img.exists():
            notes.append("圖片")
            if not a.dry_run:
                img.unlink()
        for cp in credit_files:
            cr = load_json(cp, {})
            if cid in cr:
                notes.append(cp.name)
                if not a.dry_run:
                    cr.pop(cid)
                    save_json(cp, cr)
        art = ROOT / "assets" / "art" / f"{algo}.js"
        if art.exists():
            js = art.read_text(encoding="utf-8")
            js2, ok = cut_art_case(js, cid)
            if ok:
                notes.append(f"art/{algo}.js")
                if not a.dry_run:
                    art.write_text(js2, encoding="utf-8")
        if not a.dry_run:
            removed.append({"id": cid, "algo": algo, "title": c.get("title"), "url": c.get("url", ""),
                            "reason": a.reason, "at": now_tpe().isoformat(timespec="minutes")})
            rejected.append({"run": "removed", "unit": f"REMOVE:{cid}", "algo": algo,
                             "kind": "CC" if int(cid.split("-")[1]) >= 51 else "RES",
                             "title": c.get("title", ""), "url_norm": norm_url(c.get("url")), "reason": a.reason})
        print(f"✓ {cid}「{c.get('title')}」：{'、'.join(notes)}{'（dry run）' if a.dry_run else ''}")
    if not a.dry_run:
        save_json(WF / "removed.json", removed, indent=1)
        save_json(WF / "rejected.json", rejected, indent=1)


if __name__ == "__main__":
    main()
