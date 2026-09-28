"""在自己的電腦上下載 _workflow/image_queue.json 裡排隊的案例圖片（雲端工作階段連不到這些網站）。

python tools/fetch_images.py            下載全部排隊圖片
python tools/fetch_images.py --list     只列出佇列
下載用系統內建的 curl（Windows 10 以上內建；Python 內建憑證在部分 Windows 電腦上會失敗）。
成功：存成 img/cases/<案例編號>.jpg、出處寫進 img/credits_wf.json、從佇列移除。
失敗：留在佇列並記下原因，下次再試。完成後請執行 python build.py 並 commit。
"""
import pathlib
import subprocess
import sys
import tempfile

from wf_common import ROOT, WF, load_json, save_json

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def main():
    from PIL import Image
    qpath = WF / "image_queue.json"
    queue = load_json(qpath, [])
    if "--list" in sys.argv:
        for q in queue:
            print(q["case_id"], q["url"], q.get("last_error", ""))
        print(f"共 {len(queue)} 筆")
        return
    credits_path = ROOT / "img" / "credits_wf.json"
    credits = load_json(credits_path, {})
    keep, ok = [], 0
    with tempfile.TemporaryDirectory() as td:
        for q in queue:
            cid, tmp = q["case_id"], pathlib.Path(td) / "img.bin"
            r = subprocess.run(["curl", "-sSL", "-A", UA, "-m", "30", "-o", str(tmp), q["url"]],
                               capture_output=True, text=True)
            try:
                if r.returncode != 0:
                    raise RuntimeError(r.stderr.strip()[:120] or f"curl exit {r.returncode}")
                im = Image.open(tmp).convert("RGB")
                if min(im.size) < 120:
                    raise RuntimeError(f"圖片太小 {im.size}，可能是 logo 或佔位圖")
                im.thumbnail((900, 900))
                im.save(ROOT / "img" / "cases" / f"{cid}.jpg", quality=84)
                credits[cid] = {k: q.get(k, "") for k in ("source", "author", "license", "license_url", "page", "note")}
                ok += 1
                print(f"✓ {cid}")
            except Exception as e:  # noqa: BLE001
                q["last_error"] = str(e)[:160]
                q["tries"] = q.get("tries", 0) + 1
                keep.append(q)
                print(f"✗ {cid}：{q['last_error']}")
    save_json(credits_path, credits, indent=1)
    save_json(qpath, keep, indent=1)
    print(f"完成 {ok} 張，剩 {len(keep)} 張在佇列。接著執行：python build.py")


if __name__ == "__main__":
    main()
