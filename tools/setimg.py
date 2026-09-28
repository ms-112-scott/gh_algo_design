"""下載並登記案例圖片（gh-balance 用；多個 agent 同時執行也安全）。

先預覽（只下載、不登記），用 Read 打開確認內容：
  python tools/setimg.py <案例編號> <圖片網址或本機檔> --preview
    → 存成 _shots/cand/<案例編號>.jpg，印出尺寸
確認後登記（會覆蓋既有圖片）：
  python tools/setimg.py <案例編號> <圖片網址或本機檔> --page <出處頁> --source <來源名稱>
      [--author 作者] [--license 授權] [--license-url 網址] [--note 一句話說明] [--no-trim] [--min 240]
    → 存成 img/cases/<案例編號>.jpg，出處寫進 img/credits_bal.json，並從其他 credits*.json 移除舊出處
移除圖片（例如影片縮圖、講者人像，又找不到替代圖）：
  python tools/setimg.py <案例編號> --remove

下載用系統的 curl（Windows 10 以上內建）。授權沒有明確標示時寫「網頁預覽圖，教學引用」。
成功時最後一行印出 OK <編號> <寬>x<高>；失敗印出 FAIL <原因> 並以 exit 1 結束。
"""
import argparse
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import time

from PIL import Image, ImageChops

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "img"
CASES = IMG / "cases"
CAND = ROOT / "_shots" / "cand"
TARGET = IMG / "credits_bal.json"
LOCK = IMG / ".credits.lock"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


class Locked:
    """用 O_EXCL 建立鎖檔，讓同時執行的 agent 輪流寫 credits*.json。"""
    def __enter__(self):
        t0 = time.time()
        while True:
            try:
                self.fd = os.open(LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                return self
            except FileExistsError:
                if time.time() - t0 > 60:   # 超過 60 秒視為前一個程式當掉留下的鎖
                    try:
                        LOCK.unlink()
                    except FileNotFoundError:
                        pass
                    t0 = time.time()
                time.sleep(0.2)

    def __exit__(self, *a):
        os.close(self.fd)
        try:
            LOCK.unlink()
        except FileNotFoundError:
            pass


def load(p):
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def save(p, obj):
    ind = 1
    if p.exists():   # 沿用原檔縮排，避免無意義的差異
        import re
        m = re.search(r"\n( +)\S", p.read_text(encoding="utf-8"))
        ind = len(m.group(1)) if m else 1
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=ind) + "\n", encoding="utf-8")


def fail(msg):
    print(f"FAIL {msg}")
    sys.exit(1)


def fetch(src, tmpdir):
    if not src.lower().startswith(("http://", "https://")):
        p = pathlib.Path(src)
        if not p.exists():
            fail(f"找不到檔案 {src}")
        return p
    out = pathlib.Path(tmpdir) / "img.bin"
    r = subprocess.run(["curl", "-sSL", "--fail", "-A", UA, "-m", "40", "-o", str(out), src],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0 or not out.exists():
        fail(f"下載失敗：{(r.stderr or '').strip()[:160] or 'curl exit ' + str(r.returncode)}")
    return out


def open_image(path, min_side, trim):
    try:
        im = Image.open(path)
        im.seek(0)                  # GIF／動態圖取第一格
        im = im.convert("RGB")
    except Exception as e:  # noqa: BLE001
        fail(f"不是圖片或無法開啟：{str(e)[:120]}")
    if trim:  # 論文圖、白底截圖常有大片白邊：裁到內容
        box = ImageChops.difference(im, Image.new("RGB", im.size, (255, 255, 255))).getbbox()
        if box and (box[2] - box[0]) * (box[3] - box[1]) < im.width * im.height * 0.9:
            pad = 12
            im = im.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad)))
    if min(im.size) < min_side:
        fail(f"圖片太小 {im.size}（需要短邊 ≥ {min_side}），可能是 logo、圖示或縮圖")
    lo, hi = im.convert("L").getextrema()
    if hi - lo < 12:
        fail("圖片幾乎是單一顏色（空白或載入失敗的佔位圖）")
    im.thumbnail((900, 900))
    return im


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("case_id")
    ap.add_argument("src", nargs="?")
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--remove", action="store_true")
    ap.add_argument("--page", default="")
    ap.add_argument("--source", default="")
    ap.add_argument("--author", default="")
    ap.add_argument("--license", default="網頁預覽圖，教學引用")
    ap.add_argument("--license-url", default="")
    ap.add_argument("--note", default="")
    ap.add_argument("--no-trim", action="store_true")
    ap.add_argument("--min", type=int, default=240)
    a = ap.parse_args()
    cid = a.case_id

    if a.remove:
        with Locked():
            (CASES / f"{cid}.jpg").unlink(missing_ok=True)
            for cp in sorted(IMG.glob("credits*.json")):
                cr = load(cp)
                if cid in cr:
                    cr.pop(cid)
                    save(cp, cr)
        print(f"OK {cid} 已移除圖片")
        return
    if not a.src:
        fail("缺少圖片網址或檔案")

    with tempfile.TemporaryDirectory() as td:
        im = open_image(fetch(a.src, td), a.min, not a.no_trim)
    if a.preview:
        CAND.mkdir(parents=True, exist_ok=True)
        out = CAND / f"{cid}.jpg"
        im.save(out, quality=86)
        print(f"預覽：{out}（用 Read 打開確認內容後再登記）")
        print(f"OK {cid} {im.width}x{im.height}")
        return
    if not a.page or not a.source:
        fail("登記時一定要給 --page（出處頁）與 --source（來源名稱）")
    CASES.mkdir(parents=True, exist_ok=True)
    im.save(CASES / f"{cid}.jpg", quality=84)
    entry = {"source": a.source, "author": a.author, "license": a.license, "license_url": a.license_url,
             "page": a.page, "note": a.note}
    with Locked():
        for cp in sorted(IMG.glob("credits*.json")):
            if cp == TARGET:
                continue
            cr = load(cp)
            if cid in cr:
                cr.pop(cid)
                save(cp, cr)
        cr = load(TARGET)
        cr[cid] = entry
        save(TARGET, dict(sorted(cr.items())))
    print(f"OK {cid} {im.width}x{im.height}")


if __name__ == "__main__":
    main()
