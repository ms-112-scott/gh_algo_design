/* A02 Koch 雪花：變形與無照片案例的獨立畫法
   每張卡畫的是該變形／案例的「內容」（視角、輸入、輸出、應用場景），不是同一朵雪花換亂數 */
(function(){
const ART = window.ART, U = window.GENUTIL;
const TAU = Math.PI*2, S3 = Math.sqrt(3);

/* ---------- 共用幾何工具 ---------- */
// 一段線的 Koch 細分（不含終點）。opt.s：+1 尖角朝外、-1 朝內；opt.f(p,q,d) 可逐段回傳 {a,b,h,s} 或 false（停止細分）
function kseg(p, q, d, opt, out){
  if(d <= 0){ out.push(p); return; }
  let a = 1/3, b = 2/3, h = S3/6, s = opt.s ?? 1;
  if(opt.f){ const o = opt.f(p, q, d); if(o === false){ out.push(p); return; } if(o){ a = o.a ?? a; b = o.b ?? b; h = o.h ?? h; s = o.s ?? s; } }
  const dx = q[0]-p[0], dy = q[1]-p[1];
  const A = [p[0]+dx*a, p[1]+dy*a], B = [p[0]+dx*b, p[1]+dy*b], m = (a+b)/2;
  const P = [p[0]+dx*m + dy*h*s, p[1]+dy*m - dx*h*s];
  kseg(p, A, d-1, opt, out); kseg(A, P, d-1, opt, out); kseg(P, B, d-1, opt, out); kseg(B, q, d-1, opt, out);
}
function koch(poly, d, opt = {}, closed = true){
  const out = [], n = closed ? poly.length : poly.length - 1;
  for(let i = 0; i < n; i++) kseg(poly[i], poly[(i+1) % poly.length], d, opt, out);
  if(!closed) out.push(poly[poly.length-1]);
  return out;
}
// 方形 Koch：type 5＝_|‾|_ 五段；type 8＝Minkowski sausage 八段
function qseg(p, q, d, type, s, out){
  if(d <= 0){ out.push(p); return; }
  const dx = q[0]-p[0], dy = q[1]-p[1], nx = dy*s, ny = -dx*s;
  const at = (t, u) => [p[0] + dx*t + nx*u, p[1] + dy*t + ny*u];
  const k = type === 5 ? [at(0,0), at(1/3,0), at(1/3,1/3), at(2/3,1/3), at(2/3,0), q]
                       : [at(0,0), at(.25,0), at(.25,.25), at(.5,.25), at(.5,0), at(.5,-.25), at(.75,-.25), at(.75,0), q];
  for(let i = 0; i < k.length-1; i++) qseg(k[i], k[i+1], d-1, type, s, out);
}
function qkoch(poly, d, type = 5, s = 1){ const out = []; for(let i = 0; i < poly.length; i++) qseg(poly[i], poly[(i+1)%poly.length], d, type, s, out); return out; }
// 正三角形（螢幕座標順時針，尖角朝外＝正法向）
function tri(cx, cy, R, rot = 0){ return [0,1,2].map(k => [cx + R*Math.cos(-Math.PI/2 + rot + k*TAU/3), cy + R*Math.sin(-Math.PI/2 + rot + k*TAU/3)]); }
function flake(cx, cy, R, d, s = 1, rot = 0){ return koch(tri(cx, cy, R, rot), d, {s}); }
function path(g, pts, close = true){ U.poly(g, pts, close); }
function lenOf(pts, close = true){ let L = 0; for(let i = 0; i < pts.length - (close?0:1); i++){ const a = pts[i], b = pts[(i+1)%pts.length]; L += Math.hypot(b[0]-a[0], b[1]-a[1]); } return L; }
// 等角投影
function iso(cx, cy, s){ return (x, y, z) => [cx + (x - y)*s*.866, cy + (x + y)*s*.5 - z*s]; }
function inPoly(x, y, P){ let c = false; for(let i = 0, j = P.length-1; i < P.length; j = i++){ const a = P[i], b = P[j]; if((a[1] > y) !== (b[1] > y) && x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; }
function segDist(x, y, a, b){ const dx = b[0]-a[0], dy = b[1]-a[1], t = Math.max(0, Math.min(1, ((x-a[0])*dx + (y-a[1])*dy)/(dx*dx+dy*dy || 1))); return Math.hypot(x - a[0] - dx*t, y - a[1] - dy*t); }
function glow(g, x, y, R, col, a){ const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, U.rgba(col, a)); gr.addColorStop(1, U.rgba(col, 0)); g.fillStyle = gr; g.fillRect(x-R, y-R, R*2, R*2); }
function node(g, x, y, w, h, c, hi){ g.fillStyle = hi ? U.rgba(c,.35) : "#2A2A34"; g.strokeStyle = hi ? c : "#5A5A68"; g.lineWidth = 1; g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, 3) : g.rect(x, y, w, h); g.fill(); g.stroke(); }
function wire(g, x1, y1, x2, y2, vertical){ g.beginPath(); g.moveTo(x1, y1); if(vertical){ const m = (y1+y2)/2; g.bezierCurveTo(x1, m, x2, m, x2, y2); } else { const m = (x1+x2)/2; g.bezierCurveTo(m, y1, m, y2, x2, y2); } g.stroke(); }

/* ================================================================
   變形
   ================================================================ */
ART.var["A02"] = [
  // V01 尖角朝內（反雪花）：冰晶的負形——實心板上挖出反雪花孔，旁邊以虛線對照正雪花
  function(g, W, H, r, c, U){
    const R = Math.min(W,H)*.34, cx = W/2, cy = H/2 + R*.08;
    g.fillStyle = U.rgba(c, .85); g.beginPath(); g.rect(W*.08, H*.08, W*.84, H*.84);
    const hole = flake(cx, cy, R, 4, -1); hole.forEach((p,i) => i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1])); g.closePath();
    // 角落小反雪花孔
    [[.2,.2],[.8,.2],[.2,.8],[.8,.8]].forEach(([u,v]) => { const h = flake(W*u, H*v, Math.min(W,H)*.07, 2, -1); h.forEach((p,i) => i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1])); g.closePath(); });
    g.fill("evenodd");
    g.setLineDash([3,3]); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; path(g, flake(cx, cy, R, 3, 1)); g.stroke(); g.setLineDash([]);
    g.strokeStyle = "#fff"; g.lineWidth = 1.2; path(g, hole); g.stroke();
  },
  // V02 Cesàro／可調角度：同一段 Koch 曲線在 60°→85° 由雪花邊變成針狀，逐列堆疊
  function(g, W, H, r, c, U){
    const angs = [60, 67, 74, 79, 83], n = angs.length, x0 = W*.06, x1 = W*.94;
    angs.forEach((deg, i) => {
      const th = deg*Math.PI/180, a = 1/(2 + 2*Math.cos(th)), h = a*Math.sin(th), y = H*(.18 + i*.17);
      const seg = 4, base = []; for(let k = 0; k <= seg; k++) base.push([x0 + (x1-x0)*k/seg, y]);
      const pts = koch(base, 3, {f: () => ({a, b: 1-a, h})}, false);
      g.fillStyle = U.rgba(c, .08 + i*.05); path(g, [...pts, [x1, y+H*.03], [x0, y+H*.03]]); g.fill();
      g.strokeStyle = i === n-1 ? "#fff" : U.rgba(c, .5 + i*.12); g.lineWidth = 1.1; path(g, pts, false); g.stroke();
      // 左側角度刻度：小扇形
      g.strokeStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.moveTo(W*.02, y); g.arc(W*.02, y, W*.025, -th, 0); g.stroke();
    });
  },
  // V03 方形 Koch（Minkowski sausage）：直角鋸齒島＋正交格柵，像平面格柵
  function(g, W, H, r, c, U){
    const s = Math.min(W,H)*.44, cx = W/2, cy = H/2;
    g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1; const st = s/8;
    for(let x = cx - st*20; x < W; x += st){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); }
    for(let y = cy - st*20; y < H; y += st){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
    const sq = [[cx-s/2, cy-s/2],[cx+s/2, cy-s/2],[cx+s/2, cy+s/2],[cx-s/2, cy+s/2]];
    const p2 = qkoch(sq, 2, 8, 1);
    g.fillStyle = U.rgba(c, .22); path(g, p2); g.fill(); g.strokeStyle = c; g.lineWidth = 1.4; path(g, p2); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.35)"; g.setLineDash([2,3]); path(g, qkoch(sq, 1, 8, 1)); g.stroke(); path(g, sq); g.stroke(); g.setLineDash([]);
  },
  // V04 隨機方向與不等分：地圖式島嶼——陸地、海面等深線、種子控制的海岸
  function(g, W, H, r, c, U){
    const cx = W/2, cy = H/2, R = Math.min(W,H)*.36, base = [];
    for(let i = 0; i < 6; i++){ const a = i/6*TAU + r()*.4; base.push([cx + Math.cos(a)*R*(.75 + r()*.35), cy + Math.sin(a)*R*(.75 + r()*.35)]); }
    const coast = koch(base, 4, {f: () => { const a = .3 + r()*.1; return {a, b: a + .33 + r()*.05, s: r() < .5 ? 1 : -1}; }});
    // 海面等深線（放大的海岸線）
    for(let k = 4; k >= 1; k--){ const sc = 1 + k*.12; g.strokeStyle = U.rgba("#6FA8DC", .1 + (4-k)*.06); g.lineWidth = 1; path(g, coast.map(p => [cx + (p[0]-cx)*sc, cy + (p[1]-cy)*sc])); g.stroke(); }
    g.fillStyle = U.rgba(c, .3); path(g, coast); g.fill(); g.strokeStyle = "#F5F2EC"; g.lineWidth = 1.1; path(g, coast); g.stroke();
    // 陸地內部斜線
    g.save(); path(g, coast); g.clip(); g.strokeStyle = U.rgba(c, .35); for(let x = -H; x < W; x += 6){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x + H, H); g.stroke(); } g.restore();
  },
  // V05 吸引子控制細分深度：立面水平帶，靠近吸引點越細碎
  function(g, W, H, r, c, U){
    const ax = W*(.3 + r()*.4), ay = H*(.35 + r()*.3), D = Math.hypot(W,H)*.45;
    glow(g, ax, ay, D*.6, c, .35);
    const rows = 7;
    for(let i = 0; i < rows; i++){
      const y = H*(.1 + i*.8/(rows-1));
      const pts = koch([[W*.04, y],[W*.96, y]], 5, {s: -1, f: (p,q,d) => { const mx = (p[0]+q[0])/2, my = (p[1]+q[1])/2, t = 1 - Math.min(1, Math.hypot(mx-ax, my-ay)/D); return (5 - d) < 1 + t*4.5 ? {} : false; }}, false);
      g.strokeStyle = U.rgba(c, .5 + .5*(1 - Math.abs(y-ay)/H)); g.lineWidth = 1.2; path(g, pts, false); g.stroke();
    }
    g.fillStyle = "#fff"; g.beginPath(); g.arc(ax, ay, 3.5, 0, TAU); g.fill();
    g.strokeStyle = "rgba(255,255,255,.5)"; [10,18].forEach(rr => { g.beginPath(); g.arc(ax, ay, rr, 0, TAU); g.stroke(); });
  },
  // V06 任意曲線邊界：使用者畫的基地 L 形輪廓（虛線）逐段長出分形邊
  function(g, W, H, r, c, U){
    const u = Math.min(W,H)*.8, ox = (W-u)/2, oy = (H-u)/2;
    const site = [[.08,.1],[.62,.06],[.7,.45],[.92,.52],[.86,.92],[.3,.88],[.12,.6]].map(([x,y]) => [ox + x*u, oy + y*u]);
    const edge = koch(site, 3, {s: 1});
    g.fillStyle = U.rgba(c, .16); path(g, edge); g.fill();
    g.strokeStyle = c; g.lineWidth = 1.2; path(g, edge); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.7)"; g.setLineDash([4,3]); path(g, site); g.stroke(); g.setLineDash([]);
    g.fillStyle = "#fff"; site.forEach(p => { g.fillRect(p[0]-2.5, p[1]-2.5, 5, 5); });
  },
  // V07 3D 化 Koch 曲面：等角視角的刺狀四面體曲面（三角面切四、中間推出四面體）
  function(g, W, H, r, c, U){
    const P = iso(W/2, H*.6, Math.min(W,H)*.32);
    const v = [[1,0,0],[-.5,.866,0],[-.5,-.866,0],[0,0,1.633]].map(p => [p[0], p[1], p[2] - .4]);
    let F = [[v[0],v[2],v[1]],[v[0],v[1],v[3]],[v[1],v[2],v[3]],[v[2],v[0],v[3]]];
    const sub = (a,b) => [a[0]-b[0],a[1]-b[1],a[2]-b[2]], mid = (a,b) => [(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
    const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
    for(let d = 0; d < 3; d++){ const nf = [];
      F.forEach(([a,b,cc]) => { const ab = mid(a,b), bc = mid(b,cc), ca = mid(cc,a), n = cross(sub(b,a), sub(cc,a)), nl = Math.hypot(...n), e = Math.hypot(...sub(ab,bc));
        const m = [(ab[0]+bc[0]+ca[0])/3, (ab[1]+bc[1]+ca[1])/3, (ab[2]+bc[2]+ca[2])/3], hh = e*Math.sqrt(2/3), ap = [m[0]+n[0]/nl*hh, m[1]+n[1]/nl*hh, m[2]+n[2]/nl*hh];
        nf.push([a,ab,ca],[ab,b,bc],[ca,bc,cc],[ab,bc,ap],[bc,ca,ap],[ca,ab,ap]); });
      F = nf; }
    const L = [.3,.5,.8], ll = Math.hypot(...L), view = [.577,.577,.577], [R0,G0,B0] = U.rgb(c);
    const T = F.map(f => { const n = cross(sub(f[1],f[0]), sub(f[2],f[0])), nl = Math.hypot(...n) || 1;
      return {f, k: f.reduce((s,p) => s + p[0]+p[1]+p[2], 0), vis: (n[0]*view[0]+n[1]*view[1]+n[2]*view[2]), sh: Math.max(0, (n[0]*L[0]+n[1]*L[1]+n[2]*L[2])/nl/ll)}; });
    T.sort((a,b) => a.k - b.k);
    T.forEach(t => { const s = .25 + .75*t.sh; g.fillStyle = `rgb(${R0*s+30|0},${G0*s+20|0},${B0*s+20|0})`; path(g, t.f.map(p => P(...p))); g.fill(); g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = .5; g.stroke(); });
  },
  // V08 逐層高度堆疊：深度 0→5 的雪花逐層升高成塔
  function(g, W, H, r, c, U){
    const s = W*.3, P = iso(W/2, H*.8, s), lv = 6, dz = .36;
    const base = [0,1,2].map(k => [Math.cos(k*TAU/3 + .3), Math.sin(k*TAU/3 + .3)]);
    for(let i = 0; i < lv; i++){
      const pts = koch(base, Math.min(i, 4), {s: 1}).map(p => P(p[0], p[1], i*dz));
      g.fillStyle = U.rgba(c, .08 + i*.05); path(g, pts); g.fill();
      g.strokeStyle = i === lv-1 ? "#fff" : U.rgba(c, .45 + i*.1); g.lineWidth = 1; path(g, pts); g.stroke();
      if(i < lv-1) base.forEach(b => { const a1 = P(b[0], b[1], i*dz), a2 = P(b[0], b[1], (i+1)*dz); g.strokeStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.moveTo(...a1); g.lineTo(...a2); g.stroke(); });
    }
  },
  // V09 可製造輪廓：板材排版，每朵雪花有外偏移（切割線）與內孔，含定位十字
  function(g, W, H, r, c, U){
    const x0 = W*.06, y0 = H*.08, w = W*.88, h = H*.84;
    g.fillStyle = "rgba(245,242,236,.07)"; g.fillRect(x0, y0, w, h); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.strokeRect(x0, y0, w, h);
    const cols = 3, rows = Math.max(2, Math.round(3*h/w)), cw = w/cols, ch = h/rows;
    for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
      const cx = x0 + cw*(i+.5), cy = y0 + ch*(j+.52), R = Math.min(cw, ch)*.4, d = 1 + (i + j) % 3;
      const out = flake(cx, cy, R, d, 1, (i+j)%2 ? Math.PI/3 : 0), inn = flake(cx, cy, R*.45, Math.max(1, d-1), 1, (i+j)%2 ? 0 : Math.PI/3);
      g.fillStyle = U.rgba(c, .3); g.beginPath(); [out, inn].forEach(P => { P.forEach((p,k) => k ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1])); g.closePath(); }); g.fill("evenodd");
      g.strokeStyle = c; g.lineWidth = 1; path(g, out); g.stroke(); path(g, inn); g.stroke();
    }
    g.strokeStyle = "#fff"; [[x0,y0],[x0+w,y0],[x0,y0+h],[x0+w,y0+h]].forEach(([x,y]) => { g.beginPath(); g.moveTo(x-5,y); g.lineTo(x+5,y); g.moveTo(x,y-5); g.lineTo(x,y+5); g.stroke(); });
  },
  // V10 天線式周長最大化：固定外框下深度 0–4 的比較＋周長長條圖
  function(g, W, H, r, c, U){
    const n = 5, bw = W*.9/n, x0 = W*.05, by = H*.08, bh = bw;
    const lens = [];
    for(let d = 0; d < n; d++){
      const cx = x0 + bw*(d+.5), cy = by + bh*.55, R = bw*.36, pts = flake(cx, cy, R, d);
      g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(x0 + bw*d + 2, by, bw - 4, bh);
      g.strokeStyle = d === 3 ? "#fff" : c; g.lineWidth = 1; path(g, pts); g.stroke();
      lens.push(lenOf(pts));
    }
    // 長條圖（周長 ∝ (4/3)^n），虛線＝最小加工寬度限制
    const gy = H*.92, top = by + bh + H*.08, mx = lens[n-1];
    g.strokeStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.moveTo(x0, top); g.lineTo(x0, gy); g.lineTo(W*.95, gy); g.stroke();
    lens.forEach((L, d) => { const hh = (gy - top)*L/mx; g.fillStyle = d === 3 ? "#fff" : U.rgba(c, .4 + d*.12); g.fillRect(x0 + bw*(d+.25), gy - hh, bw*.5, hh); });
    g.setLineDash([3,3]); g.strokeStyle = U.rgba(c, .9); const ly = gy - (gy - top)*lens[3]/mx; g.beginPath(); g.moveTo(x0, ly); g.lineTo(W*.95, ly); g.stroke(); g.setLineDash([]);
  },
  // V11 深度漸進動畫：動畫影格像一疊卡片由後往前斜向攤開，每格多一層遞迴；前方為播放中影格＋播放鍵與進度條
  function(g, W, H, r, c, U){
    const n = 5, fw = W*.44, fh = H*.36;
    for(let i = 0; i < n; i++){
      const k = i/(n-1), x = W*.06 + k*W*.44, y = H*.06 + k*H*.4, s = .62 + k*.38, w = fw*s, h = fh*s;
      // 影格底板與陰影
      g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(x + 4, y + 5, w, h);
      g.fillStyle = i === n-1 ? "#23232D" : "#1E1E27"; g.fillRect(x, y, w, h);
      g.strokeStyle = i === n-1 ? U.rgba(c, .95) : "rgba(255,255,255,.22)"; g.lineWidth = 1; g.strokeRect(x, y, w, h);
      // 底片齒孔
      g.fillStyle = "rgba(255,255,255,.14)";
      for(let j = 0; j < 7; j++){ g.fillRect(x + w*(.06 + j*.14), y + 2, w*.06, 3); g.fillRect(x + w*(.06 + j*.14), y + h - 5, w*.06, 3); }
      const pts = flake(x + w/2, y + h*.55, Math.min(w, h)*.34, i);
      g.fillStyle = U.rgba(c, .1 + k*.25); path(g, pts); g.fill();
      g.strokeStyle = i === n-1 ? "#fff" : U.rgba(c, .5 + k*.4); g.lineWidth = i === n-1 ? 1.3 : 1; g.stroke();
    }
    // 播放鍵與進度條
    const py = H*.92, x0 = W*.2, x1 = W*.92;
    g.fillStyle = c; g.beginPath(); g.moveTo(W*.06, py - 7); g.lineTo(W*.06 + 11, py); g.lineTo(W*.06, py + 7); g.closePath(); g.fill();
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, py); g.lineTo(x1, py); g.stroke();
    g.strokeStyle = c; g.beginPath(); g.moveTo(x0, py); g.lineTo(x0 + (x1-x0)*.8, py); g.stroke();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x0 + (x1-x0)*.8, py, 4.5, 0, TAU); g.fill();
  },
  // V12 混合 L-System：上方為改寫字串（F／+／- 色塊），下方為烏龜走出的 Koch 曲線與方向箭頭
  function(g, W, H, r, c, U){
    let s = "F"; for(let i = 0; i < 2; i++) s = s.replace(/F/g, "F+F--F+F");
    const bs = Math.max(3, (W*.88)/s.length*1.9), per = Math.floor(W*.88/bs);
    for(let i = 0; i < s.length; i++){ const x = W*.06 + (i%per)*bs, y = H*.08 + Math.floor(i/per)*bs*1.2, ch = s[i];
      g.fillStyle = ch === "F" ? c : ch === "+" ? "#F5F2EC" : "#6FA8DC"; if(ch === "F") g.fillRect(x, y, bs*.8, bs*.8); else { g.beginPath(); g.arc(x + bs*.4, y + bs*.4, bs*.3, 0, TAU); g.fill(); } }
    // 烏龜繪圖
    let s3 = "F"; for(let i = 0; i < 3; i++) s3 = s3.replace(/F/g, "F+F--F+F");
    const step = W*.88/27; let x = W*.06, y = H*.8, a = 0; const pts = [[x,y]], heads = [];
    for(const ch of s3){ if(ch === "F"){ x += Math.cos(a)*step; y -= Math.sin(a)*step; pts.push([x,y]); heads.push([x,y,a]); } else if(ch === "+") a += Math.PI/3; else a -= Math.PI/3; }
    g.strokeStyle = "rgba(255,255,255,.25)"; g.setLineDash([2,3]); g.beginPath(); g.moveTo(W*.06, H*.8); g.lineTo(W*.94, H*.8); g.stroke(); g.setLineDash([]);
    g.strokeStyle = c; g.lineWidth = 1.4; path(g, pts, false); g.stroke();
    heads.forEach(([hx,hy,ha], i) => { if(i % 4) return; g.save(); g.translate(hx, hy); g.rotate(-ha); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(4,0); g.lineTo(-3,-2.5); g.lineTo(-3,2.5); g.closePath(); g.fill(); g.restore(); });
  },
];

ART.var["A02"][7].ratio = 1.3;

/* ================================================================
   沒有照片的案例
   ================================================================ */
// A02-01 分形天線貼在玻璃上：窗框透視＋透明貼片＋多頻段反射係數曲線
ART.case["A02-01"] = function(g, W, H, r, c, U){
  const q = [[W*.12, H*.06],[W*.9, H*.12],[W*.9, H*.66],[W*.12, H*.72]];
  const gr = g.createLinearGradient(q[0][0], q[0][1], q[2][0], q[2][1]); gr.addColorStop(0, "rgba(111,168,220,.18)"); gr.addColorStop(1, "rgba(111,168,220,.04)");
  g.fillStyle = gr; path(g, q); g.fill(); g.strokeStyle = "#8A8A98"; g.lineWidth = 4; path(g, q); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 6; g.beginPath(); g.moveTo(W*.2, H*.5); g.lineTo(W*.42, H*.14); g.stroke();
  const cx = W*.52, cy = H*.39, R = Math.min(W, H)*.2;
  const pts = flake(cx, cy, R, 3).map(([x,y]) => [x, y + (x - W*.5)*.05]);
  g.fillStyle = U.rgba(c, .25); path(g, pts); g.fill(); g.strokeStyle = c; g.lineWidth = 1.2; path(g, pts); g.stroke();
  g.strokeStyle = "#F2A007"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy + R*.95); g.lineTo(cx, H*.68); g.stroke();
  // S11 曲線：四個頻段凹谷
  const y0 = H*.78, y1 = H*.96, x0 = W*.08, x1 = W*.94;
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y1); g.lineTo(x1, y1); g.stroke();
  g.strokeStyle = "#fff"; g.beginPath();
  for(let i = 0; i <= 80; i++){ const t = i/80; let v = 0; [.18,.4,.62,.84].forEach(f => v += Math.exp(-Math.pow((t-f)/.035, 2))); g.lineTo(x0 + (x1-x0)*t, y0 + (y1-y0)*(.1 + .8*Math.min(1, v))); }
  g.stroke();
};
ART.case["A02-01"].ratio = 1.2;

// A02-02 MATLAB fractalSnowflake：座標軸方盒＋地平面上的雪花貼片，以電流密度著色
ART.case["A02-02"] = function(g, W, H, r, c, U){
  const P = iso(W/2, H*.52, Math.min(W,H)*.34);
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1;
  for(let i = -1; i <= 1.001; i += .25){ [[[i,-1,0],[i,1,0]],[[-1,i,0],[1,i,0]],[[-1,i,0],[-1,i,1.1]],[[i,-1,0],[i,-1,1.1]]].forEach(([a,b]) => { g.beginPath(); g.moveTo(...P(...a)); g.lineTo(...P(...b)); g.stroke(); }); }
  g.strokeStyle = "rgba(255,255,255,.45)"; [[[-1,-1,0],[1,-1,0]],[[-1,-1,0],[-1,1,0]],[[-1,-1,0],[-1,-1,1.1]]].forEach(([a,b]) => { g.beginPath(); g.moveTo(...P(...a)); g.lineTo(...P(...b)); g.stroke(); });
  // 貼片以同心層上色（中心電流大）
  for(let k = 6; k >= 1; k--){ const s = k/6, pts = flake(0, 0, .8*s, 3).map(([x,y]) => P(x, y, .02));
    g.fillStyle = `hsl(${(1-s)*50 + 5},85%,${40 + (1-s)*25}%)`; path(g, pts); g.fill(); }
  g.strokeStyle = "#fff"; g.lineWidth = 1; path(g, flake(0, 0, .8, 3).map(([x,y]) => P(x, y, .02))); g.stroke();
  // 饋入點與色條
  g.strokeStyle = "#fff"; g.lineWidth = 2; g.beginPath(); g.moveTo(...P(0,0,.02)); g.lineTo(...P(0,0,-.25)); g.stroke();
  for(let i = 0; i < 20; i++){ g.fillStyle = `hsl(${(i/19)*50 + 5},85%,${40 + (i/19)*25}%)`; g.fillRect(W*.9, H*.15 + i*H*.6/20, W*.04, H*.6/20 + .5); }
};

// A02-03 CubeSat：等角立方衛星，頂面貼 Koch 雪花天線，側面太陽能板，星空背景
ART.case["A02-03"] = function(g, W, H, r, c, U){
  for(let i = 0; i < 60; i++){ g.fillStyle = `rgba(255,255,255,${.2 + r()*.6})`; g.fillRect(r()*W, r()*H, 1.2, 1.2); }
  const P = iso(W/2, H*.46, Math.min(W,H)*.26);
  const face = (pts, col) => { g.fillStyle = col; path(g, pts.map(p => P(...p))); g.fill(); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.stroke(); };
  face([[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]], "#1E2A4A"); face([[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]], "#26345A");
  face([[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]], "#8A8A98");
  // 太陽能電池格線
  g.strokeStyle = "rgba(111,168,220,.45)";
  for(let t = -1; t <= 1.001; t += .5){ [[[1,t,-1],[1,t,1]],[[1,-1,t],[1,1,t]],[[t,1,-1],[t,1,1]],[[-1,1,t],[1,1,t]]].forEach(([a,b]) => { g.beginPath(); g.moveTo(...P(...a)); g.lineTo(...P(...b)); g.stroke(); }); }
  // 展開的側翼太陽能板
  face([[1,1,1],[1,2.6,1.3],[1,2.6,-.7],[1,1,-1]].map(p => p), "rgba(38,52,90,.9)");
  const ant = flake(0, 0, .75, 3).map(([x,y]) => P(x, y, 1.01));
  g.fillStyle = "#F2C14E"; path(g, ant); g.fill(); g.strokeStyle = c; g.lineWidth = 1; g.stroke();
  glow(g, ...P(0,0,1.6), W*.35, c, .15);
};
ART.case["A02-03"].ratio = .9;

// A02-04 聲學超穎表面：圓形喇叭網罩上的雪花開孔陣列＋均勻擴散的波前
ART.case["A02-04"] = function(g, W, H, r, c, U){
  const cx = W/2, cy = H/2, R = Math.min(W,H)*.34;
  for(let k = 1; k <= 5; k++){ g.strokeStyle = U.rgba(c, .5 - k*.08); g.lineWidth = 1; g.setLineDash([6 - k, 3 + k]); g.beginPath(); g.arc(cx, cy, R + k*Math.min(W,H)*.045, 0, TAU); g.stroke(); }
  g.setLineDash([]);
  g.fillStyle = "#2A2A34"; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(cx, cy, R*.96, 0, TAU); g.clip();
  const s = R*.3, hs = s*S3/2;
  for(let j = -4; j <= 4; j++) for(let i = -4; i <= 4; i++){ const x = cx + i*s + (j%2 ? s/2 : 0), y = cy + j*hs; if(Math.hypot(x-cx, y-cy) > R*1.05) continue;
    const pts = flake(x, y, s*.42, 2, 1, (i+j)%2 ? Math.PI/3 : 0); g.fillStyle = "#101014"; path(g, pts); g.fill(); g.strokeStyle = U.rgba(c, .8); g.lineWidth = .8; g.stroke(); }
  g.restore();
  g.strokeStyle = "#8A8A98"; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
};

// A02-05 Koch 形聲波導管：剖面上下壁為 Koch 曲線，管內兩種波長的波
ART.case["A02-05"] = function(g, W, H, r, c, U){
  const x0 = W*.04, x1 = W*.96, yt = H*.3, yb = H*.7;
  const top = koch([[x0, yt],[x1, yt]], 4, {s: 1}, false), bot = koch([[x1, yb],[x0, yb]], 4, {s: 1}, false);
  g.fillStyle = "rgba(245,242,236,.1)"; path(g, [...top, [x1, H*.04], [x0, H*.04]]); g.fill(); path(g, [...bot, [x0, H*.96], [x1, H*.96]]); g.fill();
  g.strokeStyle = c; g.lineWidth = 1.4; path(g, top, false); g.stroke(); path(g, bot, false); g.stroke();
  // 快波（長波長）與慢波（短波長）
  const wave = (lam, amp, col, off) => { g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath(); for(let x = x0; x <= x1; x += 2){ const y = H*.5 + off + Math.sin((x - x0)/lam*TAU)*amp; x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); };
  wave(W*.45, H*.05, "#fff", -H*.04); wave(W*.09, H*.03, "#6FA8DC", H*.05);
  g.fillStyle = "#fff"; g.beginPath(); g.moveTo(x0 - 2, H*.44); g.lineTo(x0 + 8, H*.5); g.lineTo(x0 - 2, H*.56); g.fill();
};
ART.case["A02-05"].ratio = .75;

// A02-06 隔音牆頂端分形擴散器：道路剖面、牆頂分形斷面、聲線與陰影區色階
ART.case["A02-06"] = function(g, W, H, r, c, U){
  const gy = H*.82, wx = W*.4, wt = H*.3;
  // 陰影區色階
  const gr = g.createLinearGradient(wx, 0, W, 0); gr.addColorStop(0, "rgba(111,168,220,.35)"); gr.addColorStop(1, "rgba(111,168,220,.02)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(wx, wt); g.lineTo(W, gy - (W - wx)*.2); g.lineTo(W, gy); g.lineTo(wx, gy); g.fill();
  g.fillStyle = "#3A3A46"; g.fillRect(0, gy, W, H - gy);
  // 車輛
  [[W*.06, "#8A8A98"],[W*.22, "#6A6A78"]].forEach(([x, col]) => { g.fillStyle = col; g.fillRect(x, gy - H*.07, W*.12, H*.05); g.fillRect(x + W*.02, gy - H*.1, W*.07, H*.035); });
  // 聲線
  const sx = W*.15, sy = gy - H*.05;
  for(let k = 0; k < 7; k++){ g.strokeStyle = U.rgba(c, .5); g.lineWidth = 1; g.beginPath(); g.moveTo(sx, sy); g.lineTo(wx - W*.04 + k*W*.012, wt - H*.02); g.stroke(); }
  for(let k = 0; k < 6; k++){ const a = -.35 + k*.18; g.strokeStyle = U.rgba("#fff", .35); g.beginPath(); g.moveTo(wx, wt - H*.02); g.lineTo(wx + Math.cos(a)*W*.5, wt - H*.02 + Math.sin(a)*W*.5); g.stroke(); }
  // 牆體與分形頂
  g.fillStyle = "#8A8A98"; g.fillRect(wx - W*.012, wt, W*.024, gy - wt);
  const capTop = []; qseg([wx - W*.09, wt], [wx + W*.09, wt], 2, 5, 1, capTop); capTop.push([wx + W*.09, wt]);
  const cap = [...capTop, [wx + W*.09, wt + H*.025], [wx - W*.09, wt + H*.025]];
  g.fillStyle = c; path(g, cap); g.fill();
  // 受音點房屋
  const hx = W*.8; g.fillStyle = "#2A2A34"; g.strokeStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.moveTo(hx, gy); g.lineTo(hx, gy - H*.14); g.lineTo(hx + W*.07, gy - H*.22); g.lineTo(hx + W*.14, gy - H*.14); g.lineTo(hx + W*.14, gy); g.fill(); g.stroke();
};
ART.case["A02-06"].ratio = .8;

// A02-07 Koch 截面套管熱交換器：斜投影擠出的內管（深度 2 截面）與外管
ART.case["A02-07"] = function(g, W, H, r, c, U){
  const R = Math.min(W,H)*.26, fx = W*.34, fy = H*.64, ox = W*.36, oy = -H*.34, bx = fx + ox, by = fy + oy;
  const inner = flake(0, 0, R*.62, 2, 1, Math.PI/6);
  // 外管
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.arc(bx, by, R, 0, TAU); g.stroke();
  const nx = -oy/Math.hypot(ox,oy), ny = ox/Math.hypot(ox,oy); [1,-1].forEach(s => { g.beginPath(); g.moveTo(fx + nx*R*s, fy + ny*R*s); g.lineTo(bx + nx*R*s, by + ny*R*s); g.stroke(); });
  // 內管擠出稜線
  g.strokeStyle = U.rgba(c, .4); path(g, inner.map(([x,y]) => [bx + x, by + y])); g.stroke();
  inner.forEach(([x,y], i) => { if(i % 4) return; g.beginPath(); g.moveTo(fx + x, fy + y); g.lineTo(bx + x, by + y); g.stroke(); });
  // 前端截面：外環流體（冷）＋內管（熱）
  g.fillStyle = "rgba(111,168,220,.28)"; g.beginPath(); g.arc(fx, fy, R, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.stroke();
  const gr = g.createRadialGradient(fx, fy, 0, fx, fy, R*.7); gr.addColorStop(0, "#F2A007"); gr.addColorStop(1, c);
  g.fillStyle = gr; path(g, inner.map(([x,y]) => [fx + x, fy + y])); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1; g.stroke();
};
ART.case["A02-07"].ratio = 1;

// A02-08 方形 Koch 島熱交換器：截面溫度場＋等溫線
ART.case["A02-08"] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)*.42, cx = W/2, cy = H/2;
  const isl = qkoch([[cx-s/2, cy-s/2],[cx+s/2, cy-s/2],[cx+s/2, cy+s/2],[cx-s/2, cy+s/2]], 2, 5, 1);
  const n = 64, m = Math.round(64*H/W), D = Math.min(W,H)*.35, val = new Float32Array(n*m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const x = (i+.5)/n*W, y = (j+.5)/m*H; let dm = 1e9;
    for(let k = 0; k < isl.length; k++){ const d = segDist(x, y, isl[k], isl[(k+1)%isl.length]); if(d < dm) dm = d; }
    val[j*n+i] = inPoly(x, y, isl) ? 1 : Math.exp(-dm/D*2.2); }
  U.field(g, W, H, n, m, (i,j) => val[j*n+i]*.95, c, 1.2);
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = .8;
  [.25,.45,.65].forEach(iso => { U.contour(n, m, (i,j) => val[j*n+i], iso).forEach(([a,b]) => { g.beginPath(); g.moveTo((a[0]+.5)/n*W, (a[1]+.5)/m*H); g.lineTo((b[0]+.5)/n*W, (b[1]+.5)/m*H); g.stroke(); }); });
  g.strokeStyle = "#fff"; g.lineWidth = 1.3; path(g, isl); g.stroke();
};
ART.case["A02-08"].ratio = 1.1;

// A02-09 雪花分形微流道散熱器：晶片底板上的六臂枝狀流道（中心入口→周邊出口）
ART.case["A02-09"] = function(g, W, H, r, c, U){
  const cx = W/2, cy = H/2, S = Math.min(W,H)*.86;
  g.fillStyle = "#2A2A34"; g.fillRect(cx - S/2, cy - S/2, S, S); g.strokeStyle = "rgba(255,255,255,.35)"; g.strokeRect(cx - S/2, cy - S/2, S, S);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b]) => { g.beginPath(); g.arc(cx + a*S*.42, cy + b*S*.42, S*.025, 0, TAU); g.stroke(); });
  g.setLineDash([3,3]); g.strokeRect(cx - S*.3, cy - S*.3, S*.6, S*.6); g.setLineDash([]);
  g.lineCap = "round";
  const br = (x, y, a, L, w, d) => { const x2 = x + Math.cos(a)*L, y2 = y + Math.sin(a)*L, t = d/3;
    g.strokeStyle = `rgb(${111 + (228-111)*t|0},${168 + (87-168)*t|0},${220 + (46-220)*t|0})`; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    if(d >= 3) return;
    [1/3, 2/3].forEach(f => [1,-1].forEach(s => br(x + Math.cos(a)*L*f, y + Math.sin(a)*L*f, a + s*Math.PI/3, L*.36, w*.55, d+1)));
    br(x2, y2, a, L*.36, w*.6, d+1); };
  for(let k = 0; k < 6; k++) br(cx, cy, k*TAU/6 - Math.PI/2, S*.26, S*.03, 0);
  g.fillStyle = "#6FA8DC"; g.beginPath(); g.arc(cx, cy, S*.045, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1; g.stroke();
};

// A02-10 Federation Square：pinwheel 非週期鋪磚立面（每片三角再分成五片）
ART.case["A02-10"] = function(g, W, H, r, c, U){
  const fw = W*.9, fh = fw/2, fx = W*.05, fy = H*.62 - fh;
  const mp = (a,b) => [(a[0]+b[0])/2, (a[1]+b[1])/2];
  const sub = ([P,Q,R]) => { const t = ((P[0]-Q[0])*(R[0]-Q[0]) + (P[1]-Q[1])*(R[1]-Q[1]))/((R[0]-Q[0])**2 + (R[1]-Q[1])**2), F = [Q[0] + (R[0]-Q[0])*t, Q[1] + (R[1]-Q[1])*t];
    const m1 = mp(F,Q), m2 = mp(F,P), m3 = mp(Q,P);
    return [[F,P,R],[F,m1,m2],[m1,Q,m3],[m2,m3,P],[m3,m2,m1]]; };
  let T = [[[0,0],[2,0],[0,1]],[[2,1],[0,1],[2,0]]];
  for(let d = 0; d < 3; d++) T = T.flatMap(sub);
  // 天空、地面
  g.fillStyle = "#2A2A34"; g.fillRect(0, fy + fh, W, H - fy - fh);
  const cols = ["#C9A27A", "#8A8A98", "rgba(111,168,220,.55)", c];
  T.forEach(t => { const pts = t.map(([x,y]) => [fx + x/2*fw, fy + y*fh]); const k = r(); g.fillStyle = k < .45 ? cols[0] : k < .75 ? cols[1] : k < .95 ? cols[2] : cols[3]; path(g, pts); g.fill(); g.strokeStyle = "#15151B"; g.lineWidth = .8; g.stroke(); });
  // 巨型面板邊界（第一層）
  let T1 = [[[0,0],[2,0],[0,1]],[[2,1],[0,1],[2,0]]].flatMap(sub);
  g.strokeStyle = "#fff"; g.lineWidth = 1.4; T1.forEach(t => { path(g, t.map(([x,y]) => [fx + x/2*fw, fy + y*fh])); g.stroke(); });
  // 廣場上的人
  for(let i = 0; i < 7; i++){ const x = W*(.1 + r()*.8), y = fy + fh + H*(.06 + r()*.2); g.fillStyle = "rgba(255,255,255,.6)"; g.fillRect(x, y - 8, 2.4, 8); g.beginPath(); g.arc(x + 1.2, y - 10, 1.8, 0, TAU); g.fill(); }
};
ART.case["A02-10"].ratio = .85;

// A02-11 街景立面的分形維度：一排建築立面＋盒計數格網（被邊線穿過的格子上色）
ART.case["A02-11"] = function(g, W, H, r, c, U){
  const gy = H*.86, segs = []; let x = W*.02;
  g.fillStyle = "#2A2A34";
  while(x < W*.98){ const w = W*(.1 + r()*.12), h = H*(.25 + r()*.45), x2 = Math.min(W*.98, x + w), top = gy - h;
    g.fillStyle = "#23232C"; g.fillRect(x, top, x2 - x, h);
    const roof = r() < .4 ? [[x, top],[ (x+x2)/2, top - H*.08],[x2, top]] : [[x, top],[x2, top]];
    segs.push(...roof.slice(1).map((p,i) => [roof[i], p]), [[x, gy],[x, top]], [[x2, top],[x2, gy]]);
    if(roof.length === 3){ g.beginPath(); g.moveTo(...roof[0]); g.lineTo(...roof[1]); g.lineTo(...roof[2]); g.fill(); }
    for(let wy = top + H*.04; wy < gy - H*.06; wy += H*.07) for(let wx = x + W*.02; wx < x2 - W*.03; wx += W*.035){ g.fillStyle = r() < .3 ? U.rgba("#F2C14E", .5) : "rgba(255,255,255,.12)"; g.fillRect(wx, wy, W*.018, H*.035); segs.push([[wx, wy],[wx + W*.018, wy]]); }
    x = x2; }
  const bs = Math.min(W,H)/14;
  for(let j = 0; j*bs < H; j++) for(let i = 0; i*bs < W; i++){ const x0 = i*bs, y0 = j*bs;
    const hit = segs.some(([a,b]) => { for(let t = 0; t <= 1; t += .1){ const px = a[0] + (b[0]-a[0])*t, py = a[1] + (b[1]-a[1])*t; if(px >= x0 && px < x0 + bs && py >= y0 && py < y0 + bs) return true; } return false; });
    if(hit){ g.fillStyle = U.rgba(c, .28); g.fillRect(x0, y0, bs, bs); } }
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1;
  for(let i = 0; i*bs <= W; i++){ g.beginPath(); g.moveTo(i*bs, 0); g.lineTo(i*bs, H); g.stroke(); }
  for(let j = 0; j*bs <= H; j++){ g.beginPath(); g.moveTo(0, j*bs); g.lineTo(W, j*bs); g.stroke(); }
  g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();
};
ART.case["A02-11"].ratio = .8;

// A02-12 海岸線有多長：沿海岸以三種量尺步測（尺越短量得越長）＋雙對數小圖
ART.case["A02-12"] = function(g, W, H, r, c, U){
  const coast = koch([[W*.02, H*.45],[W*.35, H*.3],[W*.65, H*.55],[W*.98, H*.38]], 4, {f: () => { const a = .28 + r()*.12; return {a, b: a + .34, s: r() < .55 ? 1 : -1, h: .2 + r()*.12}; }}, false);
  g.fillStyle = U.rgba(c, .16); path(g, [...coast, [W, 0], [0, 0]]); g.fill();
  g.strokeStyle = "rgba(245,242,236,.8)"; g.lineWidth = 1; path(g, coast, false); g.stroke();
  // 分規步測
  const walk = step => { const out = [coast[0]]; let cur = coast[0]; for(const p of coast){ if(Math.hypot(p[0]-cur[0], p[1]-cur[1]) >= step){ cur = p; out.push(p); } } return out; };
  [[W*.2, "#6FA8DC", 12],[W*.09, c, 24],[W*.04, "#fff", 36]].forEach(([st, col, off]) => { const pts = walk(st).map(([x,y]) => [x, y + off*H/300]);
    g.strokeStyle = col; g.lineWidth = 1.2; path(g, pts, false); g.stroke(); g.fillStyle = col; pts.forEach(p => g.fillRect(p[0]-1.5, p[1]-1.5, 3, 3)); });
  // 雙對數：log L 對 log ε 的直線
  const bx = W*.58, by = H*.64, bw = W*.36, bh = H*.3;
  g.fillStyle = "rgba(21,21,27,.85)"; g.fillRect(bx, by, bw, bh); g.strokeStyle = "rgba(255,255,255,.4)"; g.strokeRect(bx, by, bw, bh);
  g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(bx + bw*.1, by + bh*.2); g.lineTo(bx + bw*.9, by + bh*.8); g.stroke();
  [[.2,"#fff"],[.5,c],[.8,"#6FA8DC"]].forEach(([t, col]) => { g.fillStyle = col; g.beginPath(); g.arc(bx + bw*(.1 + .8*t), by + bh*(.2 + .6*t), 3, 0, TAU); g.fill(); });
};
ART.case["A02-12"].ratio = .9;

// A02-13 Grasshopper 教學：電池節點圖（左）接到 Rhino 視窗預覽（右，綠色選取）
ART.case["A02-13"] = function(g, W, H, r, c, U){
  g.fillStyle = "#1A1A20"; g.fillRect(0, 0, W*.52, H);
  g.strokeStyle = "rgba(255,255,255,.05)"; for(let x = 0; x < W*.52; x += 10){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  const nw = W*.13, nh = H*.08, N = [[.03,.12],[.03,.35],[.03,.6],[.2,.24],[.2,.5],[.35,.36],[.35,.72]].map(([x,y], i) => [W*x, H*y, i]);
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.2;
  [[0,3],[1,3],[1,4],[2,4],[3,5],[4,5],[4,6],[6,5]].forEach(([a,b]) => wire(g, N[a][0] + nw, N[a][1] + nh/2, N[b][0], N[b][1] + nh/2));
  N.forEach(([x,y,i]) => node(g, x, y, nw, nh, c, i === 5));
  // 迴圈回授線
  g.strokeStyle = U.rgba(c, .8); g.setLineDash([3,2]); wire(g, N[5][0] + nw, N[5][1] + nh*.8, N[3][0], N[3][1] + nh*.8); g.setLineDash([]);
  // 視窗
  const vx = W*.55, vw = W*.42; g.strokeStyle = "rgba(255,255,255,.3)"; g.strokeRect(vx, H*.08, vw, H*.84);
  g.strokeStyle = "rgba(255,255,255,.08)"; for(let k = 1; k < 8; k++){ g.beginPath(); g.moveTo(vx, H*(.08 + k*.105)); g.lineTo(vx + vw, H*(.08 + k*.105)); g.stroke(); g.beginPath(); g.moveTo(vx + vw*k/8, H*.08); g.lineTo(vx + vw*k/8, H*.92); g.stroke(); }
  const pts = flake(vx + vw/2, H*.52, vw*.38, 3);
  g.fillStyle = "rgba(90,200,90,.15)"; path(g, pts); g.fill(); g.strokeStyle = "#5AC85A"; g.lineWidth = 1.3; g.stroke();
};
ART.case["A02-13"].ratio = .8;

// A02-14 Blender：透視地面格網上排開不同階數的雪花實體（擠出板），選取物件橘色外框
ART.case["A02-14"] = function(g, W, H, r, c, U){
  const hz = H*.2, f = W*.95, cam = 2.4, P = (x, y, z) => { const dd = y + 3; return [W/2 + x*f/dd, hz + (cam - z)*f/dd]; };
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1;
  for(let x = -6; x <= 6; x++){ g.beginPath(); g.moveTo(...P(x*.5, -1.5, 0)); g.lineTo(...P(x*.5, 8, 0)); g.stroke(); }
  for(let y = -1.5; y <= 8; y += .5){ g.beginPath(); g.moveTo(...P(-3, y, 0)); g.lineTo(...P(3, y, 0)); g.stroke(); }
  g.strokeStyle = "rgba(228,87,46,.6)"; g.beginPath(); g.moveTo(...P(-3, 0, 0)); g.lineTo(...P(3, 0, 0)); g.stroke();
  g.strokeStyle = "rgba(111,200,90,.6)"; g.beginPath(); g.moveTo(...P(0, -1.5, 0)); g.lineTo(...P(0, 8, 0)); g.stroke();
  const items = [[-1.6, 2.6, 1],[.1, 3.3, 2],[1.7, 2.4, 3],[0, .9, 4]];
  items.sort((a,b) => b[1] - a[1]).forEach(([ox, oy, d]) => {
    const base = flake(0, 0, .8, d, 1, 0), th = .2;
    const bot = base.map(([x,y]) => P(ox + x, oy - y*.9, 0)), top = base.map(([x,y]) => P(ox + x, oy - y*.9, th));
    g.fillStyle = "#3A3A46"; path(g, bot); g.fill();
    for(let i = 0; i < base.length; i++){ const j = (i+1)%base.length; g.beginPath(); g.moveTo(...bot[i]); g.lineTo(...bot[j]); g.lineTo(...top[j]); g.lineTo(...top[i]); g.closePath(); g.fill(); }
    g.fillStyle = "#8A8A98"; path(g, top); g.fill();
    g.strokeStyle = d === 4 ? "#F2A007" : "rgba(0,0,0,.4)"; g.lineWidth = d === 4 ? 1.8 : .6; path(g, top); g.stroke();
  });
  // 右上角座標軸 gizmo
  const gx = W*.88, gyy = H*.12; [["#E4572E", 12, 4],["#6FC85A", -6, 8],["#6FA8DC", 0, -13]].forEach(([col, dx, dy]) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(gx, gyy); g.lineTo(gx + dx, gyy + dy); g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(gx + dx, gyy + dy, 2.5, 0, TAU); g.fill(); });
};
ART.case["A02-14"].ratio = .85;

// A02-15 墊片（gasket）構造：大三角形逐層加上小三角，每層不同方向的筆觸排線
ART.case["A02-15"] = function(g, W, H, r, c, U){
  const cx = W/2, cy = H*.54, R = Math.min(W,H)*.38;
  const hatch = (pts, ang, gap, col) => { g.save(); path(g, pts); g.clip(); g.strokeStyle = col; g.lineWidth = .8; const ca = Math.cos(ang), sa = Math.sin(ang), D = Math.hypot(W,H);
    for(let t = -D; t < D; t += gap){ g.beginPath(); g.moveTo(cx + ca*-D - sa*t, cy + sa*-D + ca*t); g.lineTo(cx + ca*D - sa*t, cy + sa*D + ca*t); g.stroke(); } g.restore(); };
  // 每層新增的小三角形
  const T0 = tri(cx, cy, R); hatch(T0, 0, 7, "rgba(255,255,255,.35)");
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; path(g, T0); g.stroke();
  let edges = T0.map((p,i) => [p, T0[(i+1)%3]]);
  const angs = [Math.PI/3, -Math.PI/3, Math.PI/2], cols = [U.rgba(c,.9), U.rgba(c,.6), "rgba(242,193,78,.7)"];
  for(let d = 0; d < 3; d++){ const ne = [];
    edges.forEach(([p,q]) => { const dx = q[0]-p[0], dy = q[1]-p[1], A = [p[0]+dx/3, p[1]+dy/3], B = [p[0]+dx*2/3, p[1]+dy*2/3], Pk = [p[0]+dx/2 + dy*S3/6, p[1]+dy/2 - dx*S3/6];
      hatch([A, Pk, B], angs[d], 4 - d, cols[d]); g.strokeStyle = cols[d]; g.lineWidth = 1; path(g, [A, Pk, B]); g.stroke();
      g.setLineDash([1,2]); g.beginPath(); g.moveTo(...A); g.lineTo(...B); g.stroke(); g.setLineDash([]);
      ne.push([p,A],[A,Pk],[Pk,B],[B,q]); });
    edges = ne; }
  // 構造圓
  g.strokeStyle = "rgba(255,255,255,.2)"; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, R/2, 0, TAU); g.stroke();
};
ART.case["A02-15"].ratio = 1.05;

// A02-54 Houdini VEX：For-Each 的 Fetch Feedback 迴圈——四代幾何沿環形回授箭頭排列，點依點序（ptnum）著色
ART.case["A02-54"] = function(g, W, H, r, c, U){
  const cx = W/2, cy = H/2, RR = Math.min(W, H)*.3;
  // 回授環（虛線圓＋箭頭）
  g.strokeStyle = U.rgba(c, .55); g.lineWidth = 2; g.setLineDash([6,4]);
  g.beginPath(); g.arc(cx, cy, RR, 0, TAU); g.stroke(); g.setLineDash([]);
  for(let k = 0; k < 4; k++){ const a = -Math.PI/4 + k*Math.PI/2, x = cx + RR*Math.cos(a), y = cy + RR*Math.sin(a), t = a + Math.PI/2;
    g.fillStyle = c; g.beginPath(); g.moveTo(x + 7*Math.cos(t), y + 7*Math.sin(t)); g.lineTo(x - 5*Math.cos(t) + 5*Math.cos(a), y - 5*Math.sin(t) + 5*Math.sin(a)); g.lineTo(x - 5*Math.cos(t) - 5*Math.cos(a), y - 5*Math.sin(t) - 5*Math.sin(a)); g.closePath(); g.fill(); }
  // 中央 VEX wrangle 節點（方塊＋程式行）
  const bw = W*.2, bh = H*.14;
  g.fillStyle = "#2A2A34"; g.strokeStyle = "#8FB8E0"; g.lineWidth = 1; g.fillRect(cx - bw/2, cy - bh/2, bw, bh); g.strokeRect(cx - bw/2, cy - bh/2, bw, bh);
  for(let j = 0; j < 4; j++){ g.fillStyle = j % 2 ? U.rgba(c, .7) : "rgba(143,184,224,.7)"; g.fillRect(cx - bw*.4 + (j%2)*bw*.1, cy - bh*.3 + j*bh*.18, bw*(.45 + r()*.3), 2); }
  // 四代幾何置於環的上下左右
  const pos = [[0,-1],[1,0],[0,1],[-1,0]], sz = Math.min(W, H)*.15;
  pos.forEach(([dx, dy], d) => {
    const x = cx + dx*RR, y = cy + dy*RR;
    g.fillStyle = "#17171E"; g.beginPath(); g.arc(x, y, sz*1.15, 0, TAU); g.fill();
    g.strokeStyle = "rgba(255,255,255,.18)"; g.stroke();
    const pts = flake(x, y + sz*.1, sz*.85, d);
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8; path(g, pts); g.stroke();
    const rad = d < 2 ? 2.4 : d < 3 ? 1.6 : 1.1;
    pts.forEach(([px, py], i) => { g.fillStyle = `hsl(${200 - i/pts.length*200},85%,60%)`; g.beginPath(); g.arc(px, py, rad, 0, TAU); g.fill(); });
  });
};
ART.case["A02-54"].ratio = 1;
})();
