"""把非 Commons 的圖片（論文圖、官網預覽圖）登記進案例圖庫。

python tools/addimg.py <案例編號> <本機圖檔> <來源名稱> <授權> <出處網址> [備註]
"""
import json
import pathlib
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
CREDITS = ROOT / "img" / "credits.json"

cid, src, source, lic, page = sys.argv[1:6]
note = sys.argv[6] if len(sys.argv) > 6 else ""
im = Image.open(src).convert("RGB")
# 論文圖常有大片白邊，裁到內容
bg = Image.new("RGB", im.size, (255, 255, 255))
from PIL import ImageChops
box = ImageChops.difference(im, bg).getbbox()
if box:
    pad = 12
    im = im.crop((max(0, box[0]-pad), max(0, box[1]-pad), min(im.width, box[2]+pad), min(im.height, box[3]+pad)))
im.thumbnail((900, 900))
im.save(ROOT / "img" / "cases" / f"{cid}.jpg", quality=84)
credits = json.loads(CREDITS.read_text(encoding="utf-8")) if CREDITS.exists() else {}
credits[cid] = {"source": source, "author": "", "license": lic, "license_url": "", "page": page, "note": note}
CREDITS.write_text(json.dumps(credits, ensure_ascii=False, indent=2), encoding="utf-8")
print(cid, im.size, lic)
