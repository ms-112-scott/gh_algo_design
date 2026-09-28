"""The Coding Train 範例「輸出畫面」索引：藝術設計案例找演算法生成畫面用。

python tools/ct_index.py                 建立（或沿用）快取並印出索引檔路徑
python tools/ct_index.py 關鍵字 [關鍵字…]  搜尋影片標題／範例標題（不分大小寫，全部關鍵字都要符合）
python tools/ct_index.py --refresh       重新抓取快取

The Coding Train 網站的 GitHub repo（CodingTrain/thecodingtrain.com）在每支影片資料夾的 images/ 放了
每個程式範例的**執行畫面**（不是影片縮圖 index.jpg），可以直接當藝術設計案例的圖片來源：
  圖片網址：https://raw.githubusercontent.com/CodingTrain/thecodingtrain.com/main/content/videos/<路徑>/images/<檔名>
  作品頁：  https://thecodingtrain.com/<路徑>
快取放在 ~/.cache/gh_algo_design/ct（repo 外，避免同步到雲端硬碟）；只 sparse checkout 各影片的 index.json 與 images/。
"""
import json
import pathlib
import shutil
import subprocess
import sys

REPO = "https://github.com/CodingTrain/thecodingtrain.com"
RAW = "https://raw.githubusercontent.com/CodingTrain/thecodingtrain.com/main/"
CACHE = pathlib.Path.home() / ".cache" / "gh_algo_design" / "ct"
INDEX = CACHE / "INDEX.json"
TSV = CACHE / "INDEX.tsv"


def git(*args, cwd=None):
    r = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} 失敗：{r.stderr.strip()[:300]}")
    return r.stdout


def fetch(refresh=False):
    if refresh and CACHE.exists():
        shutil.rmtree(CACHE, ignore_errors=True)
    if not (CACHE / ".git").exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        git("clone", "--depth", "1", "--filter=blob:none", "--sparse", REPO, str(CACHE))
        git("sparse-checkout", "set", "--no-cone", "content/videos/**/index.json", "content/videos/**/images/*", cwd=CACHE)


def build():
    rows = []
    vids = CACHE / "content" / "videos"
    for p in sorted(vids.rglob("index.json")):
        d = p.parent
        try:
            j = json.loads(p.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        rel = d.relative_to(vids).as_posix()
        for ce in j.get("codeExamples") or []:
            im = ce.get("image")
            f = d / "images" / im if im else None
            ok = bool(f and f.exists())
            urls = ce.get("urls") or {}
            rows.append({
                "video": rel, "title": j.get("title", ""), "example": ce.get("title", ""),
                "description": ce.get("description", ""),
                "image": (RAW + f.relative_to(CACHE).as_posix()) if ok else "",
                "local": str(f) if ok else "",
                "page": "https://thecodingtrain.com/" + rel,
                "p5": urls.get("p5", ""), "processing": urls.get("processing", ""),
                "other": {k: v for k, v in urls.items() if k not in ("p5", "processing")},
            })
    INDEX.write_text(json.dumps(rows, ensure_ascii=False, indent=0), encoding="utf-8")
    with TSV.open("w", encoding="utf-8") as fh:
        for r in rows:
            fh.write("\t".join([r["video"], r["title"], r["example"], r["image"], r["p5"], r["processing"]]) + "\n")
    return rows


def main():
    argv = [a for a in sys.argv[1:] if a != "--refresh"]
    fetch(refresh="--refresh" in sys.argv)
    rows = json.loads(INDEX.read_text(encoding="utf-8")) if INDEX.exists() and "--refresh" not in sys.argv else build()
    if not argv:
        print(f"{len(rows)} 個範例、{sum(1 for r in rows if r['image'])} 張輸出圖")
        print(f"索引：{INDEX}")
        print(f"      {TSV}")
        return
    kws = [k.lower() for k in argv]
    hits = [r for r in rows if all(k in (r["video"] + " " + r["title"] + " " + r["example"] + " " + r["description"]).lower() for k in kws)]
    for r in hits:
        print(json.dumps({k: r[k] for k in ("video", "title", "example", "image", "page", "p5", "processing")}, ensure_ascii=False))
    print(f"共 {len(hits)} 筆")


if __name__ == "__main__":
    main()
