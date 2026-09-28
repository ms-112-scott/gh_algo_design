"""檢查卡片圖片是否重複：每個變形、每個案例都要有自己的圖。

python tools/imgdup.py            全部演算法
python tools/imgdup.py C01 E03    只檢查指定演算法
python tools/imgdup.py --json     輸出完整 JSON（也會寫進 _workflow/imgdup.json）

檢查四種問題：
1. fallback：變形或無照片案例沒有自己的畫法，只是演算法生成器換亂數（看起來和演算法卡幾乎一樣）
2. like_algo：畫出來的圖和該演算法本身的卡片圖近乎相同（dHash 距離 ≤ 門檻）
3. near_dup：同一演算法底下兩張卡片圖近乎相同
4. photo_dup：兩個案例用了同一張（或幾乎相同的）實景照片
門檻用 dHash 的漢明距離：畫出來的圖（64 位元）≤ 8、照片（256 位元）≤ 20。
"""
import collections
import hashlib
import json
import sys

from wf_common import ROOT, WF, save_json, now_tpe

T_ART, T_PHOTO = 8, 20   # 畫出來的圖：64 位元 dHash；照片：256 位元 dHash

JS = r"""
async (ids) => {
  const hashOf = cv => {
    const s = document.createElement('canvas'); s.width = 9; s.height = 8;
    const g = s.getContext('2d'); g.drawImage(cv, 0, 0, 9, 8);
    const d = g.getImageData(0, 0, 9, 8).data, gray = [];
    for(let i = 0; i < 72; i++) gray.push(d[i*4]*.299 + d[i*4+1]*.587 + d[i*4+2]*.114);
    let bits = '';
    for(let y = 0; y < 8; y++) for(let x = 0; x < 8; x++) bits += gray[y*9+x] > gray[y*9+x+1] ? '1' : '0';
    return BigInt('0b' + bits).toString(16).padStart(16, '0');
  };
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;left:0;top:0;width:200px;z-index:99999';
  document.body.appendChild(wrap);
  const render = (algo, kind, n) => {
    const cv = document.createElement('canvas'); cv.style.width = '180px'; cv.style.display = 'block';
    wrap.appendChild(cv);
    let h = null;
    try { visual(algo, kind, n).draw(cv); h = hashOf(cv); } catch(e) { h = 'ERR ' + e.message; }
    cv.remove();
    return h;
  };
  const out = {};
  for(const id of ids){
    const a = ALG[id]; if(!a) continue;
    const r = {algo: render(id, 'algo', 0), items: []};
    (a.variations || []).forEach((v, i) => r.items.push({key: `${id}·V${String(i+1).padStart(2,'0')}`, kind: 'var', index: i, title: v.title,
      own: !!(ART.var[id] && ART.var[id][i]) || id === 'A01', hash: render(id, 'var', i)}));
    CASES_OF(id).forEach(c => {
      if(c.image) { r.items.push({key: c.id, kind: 'case', title: c.title, photo: c.image.file, own: true}); return; }
      r.items.push({key: c.id, kind: 'case', title: c.title, own: !!ART.case[c.id] || (id === 'A01' && typeof CASE_PRESET !== 'undefined' && !!CASE_PRESET[c.id]),
        hash: render(id, 'case', num(c.id))});
    });
    out[id] = r;
  }
  wrap.remove();
  return out;
}
"""


def ham(a, b):
    return bin(int(a, 16) ^ int(b, 16)).count("1")


def dhash_file(path, n=16):
    """照片用 256 位元 dHash（比 64 位元更能分辨構圖相近但內容不同的照片）。"""
    from PIL import Image
    im = Image.open(path).convert("L").resize((n + 1, n), Image.LANCZOS)
    px = list(im.tobytes())
    bits = "".join("1" if px[y * (n + 1) + x] > px[y * (n + 1) + x + 1] else "0" for y in range(n) for x in range(n))
    return format(int(bits, 2), f"0{n * n // 4}x")


def main():
    from playwright.sync_api import sync_playwright
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    cat = json.loads((ROOT / "data.js").read_text(encoding="utf-8")[len("window.CATALOG = "):-2])
    ids = args or [a["id"] for a in cat["algorithms"]]
    with sync_playwright() as p:
        try:
            b = p.chromium.launch(channel="chrome")
        except Exception:
            b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1200, "height": 900})
        pg.goto((ROOT / "index.html").as_uri())
        pg.wait_for_timeout(800)
        res = pg.evaluate(JS, ids)
        b.close()

    report = {"generated": now_tpe().isoformat(timespec="minutes"), "algos": {}, "photo_dup": []}
    tot = collections.Counter()
    for aid, r in res.items():
        items = r["items"]
        fb = [it["key"] for it in items if not it.get("photo") and not it["own"]]
        like = [it["key"] for it in items if it.get("hash") and not it["hash"].startswith("ERR") and not r["algo"].startswith("ERR")
                and ham(it["hash"], r["algo"]) <= T_ART]
        drawn = [it for it in items if it.get("hash") and not it["hash"].startswith("ERR")]
        pairs = [[x["key"], y["key"], ham(x["hash"], y["hash"])] for i, x in enumerate(drawn) for y in drawn[i + 1:]
                 if ham(x["hash"], y["hash"]) <= T_ART]
        errs = [it["key"] for it in items if str(it.get("hash", "")).startswith("ERR")]
        report["algos"][aid] = {"cards": len(items), "fallback": fb, "like_algo": like, "near_dup": pairs, "errors": errs}
        tot["cards"] += len(items)
        tot["fallback"] += len(fb)
        tot["like_algo"] += len(like)
        tot["near_dup"] += len(pairs)
        tot["errors"] += len(errs)

    # 實景照片：完全相同或幾乎相同
    imgs = sorted((ROOT / "img" / "cases").glob("*.jpg"))
    md5 = collections.defaultdict(list)
    dh = {}
    for f in imgs:
        md5[hashlib.md5(f.read_bytes()).hexdigest()].append(f.stem)
        dh[f.stem] = dhash_file(f)
    seen = set()
    for g in md5.values():
        if len(g) > 1:
            report["photo_dup"].append({"cases": g, "why": "同一個檔案內容"})
            seen.update(g)
    keys = sorted(dh)
    for i, a in enumerate(keys):
        for b2 in keys[i + 1:]:
            if a in seen and b2 in seen:
                continue
            d = ham(dh[a], dh[b2])
            if d <= T_PHOTO:
                report["photo_dup"].append({"cases": [a, b2], "why": f"dHash 距離 {d}"})
    tot["photo_dup"] = len(report["photo_dup"])
    report["summary"] = dict(tot)
    save_json(WF / "imgdup.json", report, indent=1)

    if "--json" in sys.argv:
        print(json.dumps(report, ensure_ascii=False, indent=1))
        return
    print(f"{'演算法':6}{'卡片':>5}{'沒有自己的圖':>8}{'像演算法卡':>7}{'互相相似':>7}{'錯誤':>5}")
    for aid, r in report["algos"].items():
        print(f"{aid:6}{r['cards']:>5}{len(r['fallback']):>10}{len(r['like_algo']):>10}{len(r['near_dup']):>9}{len(r['errors']):>6}")
    print("合計：", "、".join(f"{k} {v}" for k, v in tot.items()))
    for d in report["photo_dup"]:
        print("照片重複：", "、".join(d["cases"]), d["why"])
    print("明細：_workflow/imgdup.json")


if __name__ == "__main__":
    main()
