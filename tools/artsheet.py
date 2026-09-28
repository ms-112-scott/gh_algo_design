"""把某個演算法的所有變形卡、無照片案例卡畫成一張總覽圖，檢查每張是否都有獨立畫法。

python tools/artsheet.py C01            → _shots/art_C01.png ＋ 列出缺漏、過慢、錯誤
python tools/artsheet.py all            → 29 個演算法都跑，只印摘要
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
JS = r"""
(algo) => {
  const a = ALG[algo], out = {missingVar:[], missingCase:[], slow:[], items:0};
  const wrap = document.createElement('div');
  wrap.id = 'sheet-' + algo;
  wrap.style.cssText = 'position:absolute;left:0;top:0;z-index:9999;background:#fff;display:grid;grid-template-columns:repeat(6,220px);gap:8px;padding:8px;font:11px monospace;width:1392px';
  document.body.appendChild(wrap);
  const add = (kind, n, label) => {
    const d = document.createElement('div'), cv = document.createElement('canvas');
    cv.style.width = '220px'; cv.style.display = 'block'; d.appendChild(cv);
    const t = document.createElement('div'); t.textContent = label; t.style.cssText = 'height:30px;overflow:hidden'; d.appendChild(t); wrap.appendChild(d);
    const vis = visual(algo, kind, n), t0 = performance.now(); vis.draw(cv); const ms = performance.now() - t0;
    if(ms > 400) out.slow.push(label + ' ' + Math.round(ms) + 'ms');
    out.items++;
  };
  a.variations.forEach((v, i) => { if(!(ART.var[algo] && ART.var[algo][i])) out.missingVar.push(i); add('var', i, `V${String(i+1).padStart(2,'0')} ${v.title}`); });
  CASES_OF(algo).filter(c => !c.image).forEach(c => { if(!ART.case[c.id]) out.missingCase.push(c.id); add('case', num(c.id), `${c.id} ${c.title}`); });
  return out;
}
"""


def run(algos, shots=True):
    (ROOT / '_shots').mkdir(exist_ok=True)
    res = {}
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome')
        for algo in algos:
            pg = b.new_page(viewport={'width': 1410, 'height': 900})
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
            pg.goto((ROOT / 'index.html').as_uri())
            pg.wait_for_timeout(400)
            out = pg.evaluate(JS, algo)
            out['errors'] = errs
            if shots:
                pg.locator(f'#sheet-{algo}').screenshot(path=str(ROOT / '_shots' / f'art_{algo}.png'))
            res[algo] = out
            pg.close()
        b.close()
    return res


if __name__ == '__main__':
    arg = sys.argv[1]
    if arg == 'all':
        cat = json.loads((ROOT / 'data.js').read_text(encoding='utf-8')[len('window.CATALOG = '):-2])
        res = run([a['id'] for a in cat['algorithms']], shots=False)
        for k, v in res.items():
            print(k, 'items', v['items'], 'missingVar', len(v['missingVar']), 'missingCase', len(v['missingCase']), 'slow', len(v['slow']), 'errors', len(v['errors']))
    else:
        r = run([arg])[arg]
        print(json.dumps(r, ensure_ascii=False, indent=1))
        print('sheet:', ROOT / '_shots' / f'art_{arg}.png')
