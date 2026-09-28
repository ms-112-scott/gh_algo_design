"""逐頁打開所有詳細頁，找出被祖先 overflow 裁切、或超出視窗／面板邊界的元素。"""
import pathlib
import sys
from playwright.sync_api import sync_playwright

d = pathlib.Path(__file__).resolve().parent.parent
URL = (d / 'atlas.html').as_uri()

JS = r"""
() => {
  const out = [];
  const modal = document.getElementById('modal');
  const root = modal.classList.contains('on') ? document.getElementById('sheet') : document.body;
  const els = root.querySelectorAll('.tg,.badge,.step .pict,.step .n,.fact,.glyph,.block,.vchip,.chip,.fchip,.srcbtn,.btn,h2,h3,.kicker,.strip figure,.dots,.close,.legend-btn');
  const clipAnc = el => { const r = []; for(let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement){ const cs = getComputedStyle(p); if(cs.overflowX !== 'visible' || cs.overflowY !== 'visible') r.push(p); } return r; };
  for(const el of els){
    const b = el.getBoundingClientRect(); if(!b.width || !b.height) continue;
    if(getComputedStyle(el).visibility === 'hidden') continue;
    for(const p of clipAnc(el)){
      if(p === modal || p === document.body) continue;
      const cs = getComputedStyle(p), pb = p.getBoundingClientRect();
      // 可捲動的方向只檢查另一個方向
      const sx = cs.overflowX === 'auto' || cs.overflowX === 'scroll', sy = cs.overflowY === 'auto' || cs.overflowY === 'scroll';
      const bad = (b.left < pb.left - 0.5 && (!sx || p.scrollLeft === 0)) || (!sx && b.right > pb.right + 0.5) || (b.top < pb.top - 0.5 && (!sy || p.scrollTop === 0)) || (!sy && b.bottom > pb.bottom + 0.5);
      if(bad){ out.push(`${el.className || el.tagName} ⟂ ${p.className || p.tagName} [${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.right)},${Math.round(b.bottom)}] vs [${Math.round(pb.left)},${Math.round(pb.top)},${Math.round(pb.right)},${Math.round(pb.bottom)}] "${(el.textContent||'').trim().slice(0,20)}"`); break; }
    }
    if(!el.closest('#chips') && b.right > innerWidth + 0.5) out.push(`${el.className} 超出視窗右緣 ${Math.round(b.right)} > ${innerWidth} "${(el.textContent||'').trim().slice(0,20)}"`);
  }
  // 關閉鈕壓到面板內容
  const c = document.getElementById('close').getBoundingClientRect(), sh = document.getElementById('sheet').getBoundingClientRect();
  if(modal.classList.contains('on') && (innerWidth > 600 || modal.scrollTop === 0) && c.left < sh.right && c.bottom > sh.top && c.right > sh.left) out.push(`close 按鈕壓到面板 close=[${Math.round(c.left)},${Math.round(c.top)}] sheet.right=${Math.round(sh.right)} sheet.top=${Math.round(sh.top)}`);
  return [...new Set(out)];
}
"""

keys = ['algo'] + [f'var{i}' for i in range(12)] + [f'seed{i}' for i in range(6)] + [f'A01-{i:02d}' for i in range(1, 16)]
total = 0
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    for w, h in [(1440, 900), (1100, 800), (820, 1000), (390, 844)]:
        pg = b.new_page(viewport={'width': w, 'height': h})
        pg.emulate_media(reduced_motion='reduce')  # 讓進場動畫立刻到定位
        pg.goto(URL); pg.wait_for_timeout(800)
        r = pg.evaluate(JS)
        for x in r: print(f'[{w}] feed: {x}')
        total += len(r)
        for k in keys:
            pg.evaluate(f"open('{k}')"); pg.wait_for_timeout(350)
            # 捲到底，逐段檢查
            H = pg.evaluate("document.getElementById('modal').scrollHeight")
            y = 0
            seen = set()
            while y < H:
                pg.evaluate(f"document.getElementById('modal').scrollTo(0,{y})"); pg.wait_for_timeout(120)
                for x in pg.evaluate(JS):
                    if x not in seen: seen.add(x); print(f'[{w}] {k}: {x}')
                y += h - 100
            total += len(seen)
            pg.evaluate("close()")
        pg.close()
    b.close()
print('TOTAL', total)
sys.exit(1 if total else 0)
