"""從 Wikimedia Commons 下載圖片縮圖，並記下作者與授權。

python tools/commons.py search "關鍵字"                   列出檔名
python tools/commons.py get <案例編號> "File:xxx.jpg"     下載到 img/cases/<案例編號>.jpg，登記到 img/credits.json
python tools/commons.py peek "File:a.jpg" "File:b.jpg"   下載到 _cand/ 供挑選
"""
import html
import io
import json
import pathlib
import re
import subprocess
import sys
import time
import urllib.parse

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
API = "https://commons.wikimedia.org/w/api.php?"
UA = "gh-algo-design/0.1 (educational atlas)"
CREDITS = ROOT / "img" / "credits.json"


def curl(url):
    # 用 curl（Windows 憑證庫），Python 內建憑證庫在這台機器上驗證失敗
    return subprocess.run(["curl", "-sS", "-L", "-A", UA, url], capture_output=True, check=True).stdout


def api(**q):
    q["format"] = "json"
    for wait in (0, 2, 4, 8, 16):  # 被限流時會回空字串，退避重試
        time.sleep(wait)
        body = curl(API + urllib.parse.urlencode(q))
        if body.strip():
            return json.loads(body)
    raise RuntimeError("Commons API 沒有回應")


def strip(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def clean_author(a):
    # Commons 沒有結構化作者時會寫成「No machine-readable author provided. X assumed (based on copyright claims).」
    m = re.match(r"No machine-readable author provided\.\s*(.+?) assumed", a)
    return m.group(1) if m else a


def info(title):
    d = api(action="query", prop="imageinfo", titles=title, iiprop="url|extmetadata|size", iiurlwidth=1000)
    ii = list(d["query"]["pages"].values())[0]["imageinfo"][0]
    m = ii["extmetadata"]
    return {
        "thumb": ii["thumburl"],
        "page": ii["descriptionurl"],
        "author": clean_author(strip(m.get("Artist", {}).get("value"))),
        "license": strip(m.get("LicenseShortName", {}).get("value")),
        "license_url": strip(m.get("LicenseUrl", {}).get("value")),
        "title": title,
    }


def save(url, path):
    im = Image.open(io.BytesIO(curl(url))).convert("RGB")
    im.thumbnail((900, 900))
    im.save(path, quality=84)
    return im.size


def main():
    cmd = sys.argv[1]
    if cmd == "search":
        d = api(action="query", list="search", srnamespace=6, srlimit=15, srsearch=sys.argv[2])
        for x in d["query"]["search"]:
            print(x["title"])
    elif cmd == "peek":
        out = ROOT / "_cand"
        out.mkdir(exist_ok=True)
        for i, t in enumerate(sys.argv[2:]):
            meta = info(t)
            print(i, save(meta["thumb"], out / f"{i:02d}.jpg"), meta["license"], "|", t)
    elif cmd == "get":
        cid, title = sys.argv[2], sys.argv[3]
        meta = info(title)
        size = save(meta["thumb"], ROOT / "img" / "cases" / f"{cid}.jpg")
        credits = json.loads(CREDITS.read_text(encoding="utf-8")) if CREDITS.exists() else {}
        credits[cid] = {"source": "Wikimedia Commons", "author": meta["author"], "license": meta["license"],
                        "license_url": meta["license_url"], "page": meta["page"], "note": sys.argv[4] if len(sys.argv) > 4 else ""}
        CREDITS.write_text(json.dumps(credits, ensure_ascii=False, indent=2), encoding="utf-8")
        print(cid, size, meta["license"], meta["author"][:40])


if __name__ == "__main__":
    main()
