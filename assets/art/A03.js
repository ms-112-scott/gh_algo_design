/* A03 Hilbert 曲線：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = Math.PI*2;

/* ---------------- 共用工具 ---------------- */
// 2D Hilbert：序號 d → 格座標 (x,y)
function d2xy(order, d){ const N = 1 << order; let x = 0, y = 0, t = d;
  for(let s = 1; s < N; s *= 2){ const rx = 1 & (t/2), ry = 1 & (t ^ rx);
    if(ry === 0){ if(rx === 1){ x = s-1-x; y = s-1-y; } const q = x; x = y; y = q; }
    x += s*rx; y += s*ry; t = Math.floor(t/4); }
  return [x, y]; }
// 反過來：格座標 → Hilbert 序號
function xy2d(order, x, y){ const N = 1 << order; let d = 0;
  for(let s = N >> 1; s > 0; s >>= 1){ const rx = (x & s) > 0 ? 1 : 0, ry = (y & s) > 0 ? 1 : 0;
    d += s*s*((3*rx) ^ ry);
    if(ry === 0){ if(rx === 1){ x = N-1-x; y = N-1-y; } const q = x; x = y; y = q; } }
  return d; }
function hil(order){ const n = 1 << (2*order), out = new Array(n); for(let d = 0; d < n; d++) out[d] = d2xy(order, d); return out; }
// Morton（Z 字）順序，用來和 Hilbert 比較
function morton(order, d){ let x = 0, y = 0; for(let b = 0; b < order; b++){ x |= ((d >> (2*b)) & 1) << b; y |= ((d >> (2*b+1)) & 1) << b; } return [x, y]; }
// 3D Hilbert（Skilling 轉置法）：回傳 8^b 個 [x,y,z]
function hil3(b){ const tot = 1 << (3*b), out = [];
  for(let h = 0; h < tot; h++){ const X = [0,0,0];
    for(let k = 0; k < 3*b; k++){ const bit = (h >> (3*b-1-k)) & 1; X[k%3] |= bit << (b-1-Math.floor(k/3)); }
    const N = 2 << (b-1); let t = X[2] >> 1;
    for(let i = 2; i > 0; i--) X[i] ^= X[i-1]; X[0] ^= t;
    for(let Q = 2; Q !== N; Q <<= 1){ const P = Q-1;
      for(let i = 2; i >= 0; i--){ if(X[i] & Q) X[0] ^= P; else { t = (X[0]^X[i]) & P; X[0] ^= t; X[i] ^= t; } } }
    out.push(X); }
  return out; }
// L-System 展開與烏龜繪圖
function lsys(ax, rules, n){ let s = ax; for(let k = 0; k < n; k++){ let o = ""; for(const ch of s) o += rules[ch] ?? ch; s = o; } return s; }
function turtle(s, deg, draw, a0){ let x = 0, y = 0, a = a0 || 0; const da = deg*Math.PI/180, pts = [[0,0]];
  for(const ch of s){ if(draw.includes(ch)){ x += Math.cos(a); y += Math.sin(a); pts.push([x,y]); } else if(ch === "+") a += da; else if(ch === "-") a -= da; }
  return pts; }
// 把點集等比例塞進矩形
function fit(pts, x0, y0, w, h){ let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for(const p of pts){ if(p[0] < a) a = p[0]; if(p[0] > c) c = p[0]; if(p[1] < b) b = p[1]; if(p[1] > d) d = p[1]; }
  const s = Math.min(w/((c-a)||1), h/((d-b)||1)), ox = x0 + (w-(c-a)*s)/2 - a*s, oy = y0 + (h-(d-b)*s)/2 - b*s;
  return {pts: pts.map(p => [ox + p[0]*s, oy + p[1]*s]), s}; }
// 顏色：暗底 → 家族色 → 白
function rampRGB(c, t){ const [R,G,B] = U.rgb(c); t = Math.max(0, Math.min(1, t));
  if(t < .6){ const k = t/.6; return [21+(R-21)*k, 21+(G-21)*k, 27+(B-27)*k]; }
  const k = (t-.6)/.4; return [R+(255-R)*k, G+(255-G)*k, B+(255-B)*k]; }
function ramp(c, t){ const v = rampRGB(c, t); return `rgb(${v[0]|0},${v[1]|0},${v[2]|0})`; }
function mixc(a, b, t){ const A = U.rgb(a), B = U.rgb(b); return `rgb(${A.map((v,i) => Math.round(v+(B[i]-v)*t)).join(",")})`; }
// 分段漸層折線（切成數段，每段一色，比逐段畫快）
function gradLine(g, pts, colorAt, lw, chunks){ chunks = chunks || 40; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round";
  const n = pts.length;
  for(let k = 0; k < chunks; k++){ const a = Math.floor(k*(n-1)/chunks), b = Math.floor((k+1)*(n-1)/chunks); if(b <= a) continue;
    g.strokeStyle = colorAt(k/(chunks-1)); g.beginPath(); g.moveTo(pts[a][0], pts[a][1]); for(let i = a+1; i <= b; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); } }
// 3D 投影：繞垂直軸轉 a、仰角 e；回傳 [sx, sy, 深度(大=近)]
function mkProj(a, e, s, cx, cy){ const ca = Math.cos(a), sa = Math.sin(a), se = Math.sin(e), ce = Math.cos(e);
  return p => { const X = p[0]*ca - p[1]*sa, Y = p[0]*sa + p[1]*ca; return [cx + X*s, cy + (Y*se - p[2]*ce)*s, Y*ce + p[2]*se]; }; }
// 管件：依深度由遠到近畫，每段有暗邊、主色與高光
function tube(g, P, lw, col, skip){ const segs = []; let dmin = Infinity, dmax = -Infinity;
  for(let i = 1; i < P.length; i++){ if(skip && skip(i)) continue; const d = (P[i-1][2]+P[i][2])/2; segs.push([i,d]); if(d < dmin) dmin = d; if(d > dmax) dmax = d; }
  segs.sort((a,b) => a[1]-b[1]); g.lineCap = "round";
  for(const [i,d] of segs){ const t = (d-dmin)/((dmax-dmin)||1), a = P[i-1], b = P[i];
    g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]);
    g.strokeStyle = "rgba(8,8,12,.85)"; g.lineWidth = lw + 1.6; g.stroke();
    g.strokeStyle = col(t, i/P.length); g.lineWidth = lw; g.stroke();
    g.strokeStyle = `rgba(255,255,255,${.12 + .4*t})`; g.lineWidth = Math.max(.5, lw*.28);
    g.beginPath(); g.moveTo(a[0]-lw*.18, a[1]-lw*.18); g.lineTo(b[0]-lw*.18, b[1]-lw*.18); g.stroke(); } }
function glow(g, x, y, R, c, a){ const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, U.rgba(c, a)); gr.addColorStop(1, U.rgba(c, 0)); g.fillStyle = gr; g.fillRect(x-R, y-R, 2*R, 2*R); }
function dot(g, x, y, R, fill){ g.fillStyle = fill; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill(); }
function jline(g, r, x1, y1, x2, y2, j){ g.beginPath(); g.moveTo(x1 + (r()-.5)*j, y1 + (r()-.5)*j);
  g.quadraticCurveTo((x1+x2)/2 + (r()-.5)*j*1.6, (y1+y2)/2 + (r()-.5)*j*1.6, x2 + (r()-.5)*j, y2 + (r()-.5)*j); g.stroke(); }
function rrect(g, x, y, w, h, rad){ g.beginPath(); g.moveTo(x+rad, y); g.arcTo(x+w, y, x+w, y+h, rad); g.arcTo(x+w, y+h, x, y+h, rad); g.arcTo(x, y+h, x, y, rad); g.arcTo(x, y, x+w, y, rad); g.closePath(); }
const hash = (d, s) => { let h = (Math.imul(d, 2654435761) ^ Math.imul(s, 40503)) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0)/4294967296; };
// 格座標 → 畫面
const place = (pts, N, x0, y0, L) => { const S = L/N; return pts.map(([x,y]) => [x0 + (x+.5)*S, y0 + (y+.5)*S]); };

/* ---------------- 變形 ---------------- */
ART.var["A03"] = [
  // V01 Moore 曲線：旋轉 45° 的封閉菱形迴路，頭尾接點發光
  function(g, W, H, r, c, U){
    const s = lsys("LFL+F+LFL", {L:"-RF+LFL+FR-", R:"+LF-RFR-FL+"}, 3);
    const raw = turtle(s, 90, "F").map(([x,y]) => [x-y, x+y]);
    const {pts:P, s:k} = fit(raw, W*.08, H*.08, W*.84, H*.84);
    g.fillStyle = U.rgba(c, .14); U.poly(g, P, true); g.fill("evenodd");
    g.lineJoin = "round"; g.lineCap = "round";
    g.strokeStyle = U.rgba(c, .55); g.lineWidth = k*.75; U.poly(g, P, true); g.stroke();
    g.strokeStyle = "#F5EDE6"; g.lineWidth = 1; U.poly(g, P, true); g.stroke();
    const a = P[0], b = P[P.length-1], mx = (a[0]+b[0])/2, my = (a[1]+b[1])/2;
    glow(g, mx, my, k*5, "#FFFFFF", .5); dot(g, a[0], a[1], 2.6, "#fff"); dot(g, b[0], b[1], 2.6, "#fff");
  },
  // V02 Peano 曲線：3×3 格網、九宮格交替色、蛇形順序編號點
  function(g, W, H, r, c, U){
    // 遞迴 3×3 蛇形：奇數行上下鏡射、奇數列左右鏡射，讓子曲線頭尾相接
    const raw = [], rec = (X, Y, s, fx, fy, k) => { if(k === 0){ raw.push([X, Y]); return; } const t = s/3;
      for(let i = 0; i < 3; i++) for(let jj = 0; jj < 3; jj++){ const j = i % 2 ? 2-jj : jj;
        rec(X + (fx ? 2-i : i)*t, Y + (fy ? 2-j : j)*t, t, fx !== (j % 2 === 1), fy !== (i % 2 === 1), k-1); } };
    rec(0, 0, 27, false, true, 3);
    const L = Math.min(W, H)*.8, x0 = (W-L)/2, y0 = (H-L)/2, P = place(raw, 27, x0, y0, L);
    for(let i = 0; i <= 9; i++){ const t = x0 + L*i/9, u = y0 + L*i/9; g.strokeStyle = i % 3 ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.28)"; g.lineWidth = i % 3 ? .6 : 1.2;
      g.beginPath(); g.moveTo(t, y0); g.lineTo(t, y0+L); g.moveTo(x0, u); g.lineTo(x0+L, u); g.stroke(); }
    g.lineJoin = "round"; g.lineCap = "round"; const cen = [];
    for(let b = 0; b < 9; b++){ const seg = P.slice(b*81, b*81+82); g.strokeStyle = b % 2 ? "#F3E4DC" : c; g.lineWidth = 1.6; U.poly(g, seg, false); g.stroke();
      let mx = 0, my = 0; seg.forEach(p => { mx += p[0]; my += p[1]; }); cen.push([mx/seg.length, my/seg.length]); }
    g.setLineDash([3,3]); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; U.poly(g, cen, false); g.stroke(); g.setLineDash([]);
    cen.forEach(([x,y], i) => { dot(g, x, y, 4.2, "#15151B"); dot(g, x, y, 2.6, i % 2 ? c : "#fff"); });
  },
  // V03 Gosper 六角變體：雪花海岸輪廓，背景六角格
  function(g, W, H, r, c, U){
    const Rh = Math.min(W,H)*.05;
    g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = .8;
    for(let j = -1; j*Rh*1.5 < H+Rh; j++) for(let i = -1; i*Rh*1.732 < W+Rh; i++){ const cx = i*Rh*1.732 + (j%2 ? Rh*.866 : 0), cy = j*Rh*1.5;
      g.beginPath(); for(let k = 0; k < 6; k++){ const a = Math.PI/6 + k*TAU/6; k ? g.lineTo(cx+Rh*Math.cos(a), cy+Rh*Math.sin(a)) : g.moveTo(cx+Rh*Math.cos(a), cy+Rh*Math.sin(a)); } g.closePath(); g.stroke(); }
    const s = lsys("A", {A:"A-B--B+A++AA+B-", B:"+A-BB--B-A++A+B"}, 4);
    const {pts:P} = fit(turtle(s, 60, "AB", r()*TAU), W*.08, H*.08, W*.84, H*.84);
    g.strokeStyle = U.rgba(c, .25); g.lineWidth = 3.5; g.lineJoin = "round"; U.poly(g, P, false); g.stroke();
    gradLine(g, P, t => mixc(c, "#FFF3EA", t), 1.1, 30);
  },
  // V04 3D Hilbert 立方體：等角線框＋4×4×4 格點＋依深度著色的管線
  function(g, W, H, r, c, U){
    const pts = hil3(2).map(p => [p[0]-1.5, p[1]-1.5, p[2]-1.5]), s = Math.min(W,H)*.15, pr = mkProj(.62, .58, s, W/2, H*.5);
    const C = [[-2,-2,-2],[2,-2,-2],[2,2,-2],[-2,2,-2],[-2,-2,2],[2,-2,2],[2,2,2],[-2,2,2]].map(pr);
    g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1;
    [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([a,b]) => { g.beginPath(); g.moveTo(C[a][0],C[a][1]); g.lineTo(C[b][0],C[b][1]); g.stroke(); });
    for(let x = 0; x < 4; x++) for(let y = 0; y < 4; y++) for(let z = 0; z < 4; z++){ const p = pr([x-1.5, y-1.5, z-1.5]); dot(g, p[0], p[1], .9, "rgba(255,255,255,.25)"); }
    tube(g, pts.map(pr), s*.3, (t) => ramp(c, .3 + .55*t));
  },
  // V05 非均勻細分：吸引點附近才繼續切，疏密漸變的空間填充線
  function(g, W, H, r, c, U){
    const L = Math.min(W,H)*.86, x0 = (W-L)/2, y0 = (H-L)/2, ax = x0 + L*(.2 + .6*r()), ay = y0 + L*(.2 + .6*r()), out = [];
    const rec = (X, Y, xi, xj, yi, yj, n) => { const cx = X + (xi+yi)/2, cy = Y + (xj+yj)/2, side = Math.hypot(xi, xj);
      if(n === 0 || side < Math.max(L/40, .3*Math.hypot(cx-ax, cy-ay))){ out.push([cx, cy, side]); return; }
      rec(X, Y, yi/2, yj/2, xi/2, xj/2, n-1); rec(X+xi/2, Y+xj/2, xi/2, xj/2, yi/2, yj/2, n-1);
      rec(X+xi/2+yi/2, Y+xj/2+yj/2, xi/2, xj/2, yi/2, yj/2, n-1); rec(X+xi/2+yi, Y+xj/2+yj, -yi/2, -yj/2, -xi/2, -xj/2, n-1); };
    rec(x0, y0, L, 0, 0, L, 6);
    glow(g, ax, ay, L*.45, c, .35);
    g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = .6; out.forEach(([x,y,s]) => g.strokeRect(x-s/2, y-s/2, s, s));
    g.lineCap = "round"; g.lineJoin = "round";
    for(let i = 1; i < out.length; i++){ const a = out[i-1], b = out[i], s = Math.min(a[2], b[2]);
      g.strokeStyle = ramp(c, .45 + .5*(1 - s/(L/2))); g.lineWidth = Math.max(.7, Math.min(3, s*.12)); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
    dot(g, ax, ay, 3, "#fff");
  },
  // V06 曲面上的 Hilbert：UV 空間的曲線映射到馬鞍面，透視下看
  function(g, W, H, r, c, U){
    const s = Math.min(W,H)*.34, pr = mkProj(.7, .62, s, W/2, H*.55), k = .55 + r()*.2;
    const S = (u, v) => { const X = (u-.5)*2, Y = (v-.5)*2; return pr([X, Y, k*(X*X - Y*Y) + .12*Math.sin(3*X)]); };
    g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = .7;
    for(let i = 0; i <= 10; i++){ g.beginPath(); for(let j = 0; j <= 20; j++){ const p = S(i/10, j/20); j ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); } g.stroke();
      g.beginPath(); for(let j = 0; j <= 20; j++){ const p = S(j/20, i/10); j ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); } g.stroke(); }
    const edge = []; for(let j = 0; j <= 20; j++) edge.push(S(j/20, 0)); for(let j = 0; j <= 20; j++) edge.push(S(1, j/20)); for(let j = 20; j >= 0; j--) edge.push(S(j/20, 1)); for(let j = 20; j >= 0; j--) edge.push(S(0, j/20));
    g.fillStyle = U.rgba(c, .06); U.poly(g, edge, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.2; g.stroke();
    const P = hil(5).map(([x,y]) => S((x+.5)/32, (y+.5)/32)); let dmin = Infinity, dmax = -Infinity; P.forEach(p => { dmin = Math.min(dmin, p[2]); dmax = Math.max(dmax, p[2]); });
    g.lineCap = "round"; g.lineWidth = 1.3;
    for(let i = 1; i < P.length; i++){ const t = (P[i][2]-dmin)/((dmax-dmin)||1); g.strokeStyle = ramp(c, .35 + .6*t); g.beginPath(); g.moveTo(P[i-1][0], P[i-1][1]); g.lineTo(P[i][0], P[i][1]); g.stroke(); }
  },
  // V07 任意邊界裁切與重連：不規則基地內保留格心，斷處以虛線重接
  function(g, W, H, r, c, U){
    const cx = W/2, cy = H/2, Rb = Math.min(W,H)*.44, nz = U.vnoise((r()*1e6)|0), ph = r()*TAU;
    const R = a => Rb*(.62 + .42*nz(2 + 1.3*Math.cos(a+ph), 2 + 1.3*Math.sin(a+ph)));
    const inside = (x, y) => Math.hypot(x-cx, y-cy) < R(Math.atan2(y-cy, x-cx));
    const L = Rb*2.1, N = 32, P = place(hil(5), N, cx-L/2, cy-L/2, L);
    const bd = []; for(let i = 0; i < 160; i++){ const a = i/160*TAU, rr = R(a); bd.push([cx + rr*Math.cos(a), cy + rr*Math.sin(a)]); }
    g.fillStyle = U.rgba(c, .08); U.poly(g, bd, true); g.fill();
    P.forEach(([x,y]) => { if(!inside(x,y)) dot(g, x, y, .7, "rgba(255,255,255,.14)"); });
    g.lineCap = "round"; g.lineJoin = "round"; let prev = null, gap = false;
    for(const p of P){ if(!inside(p[0], p[1])){ if(prev) gap = true; continue; }
      if(prev){ g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(p[0], p[1]);
        if(gap){ g.setLineDash([2,2]); g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = .9; } else { g.setLineDash([]); g.strokeStyle = c; g.lineWidth = 1.6; }
        g.stroke(); }
      prev = p; gap = false; }
    g.setLineDash([]); g.strokeStyle = "#F4EEE8"; g.lineWidth = 1.6; U.poly(g, bd, true); g.stroke();
  },
  // V08 依序號上色的資料地圖：上方一維資料條切成四段，各段摺進方格的四個象限（⊓ 形順序）
  function(g, W, H, r, c, U){
    const L = Math.min(W*.8, H*.66), x0 = (W-L)/2, sy = H*.06, sh = H*.07, y0 = H - L - H*.05, N = 32, S = L/N, nz = U.vnoise((r()*1e6)|0);
    const val = i => { const t = i/1024; return Math.max(0, Math.min(1, .15 + .75*nz(t*14, .5) + (hash(i >> 4, 7) < .08 ? .4 : 0) - (hash(i >> 6, 3) < .12 ? .5 : 0))); };
    const qc = ["#FFFFFF", "#F2C14E", "#6FC3DF", "#B58CF0"];
    // 方格：依 Hilbert 序號上色
    for(let d = 0; d < 1024; d++){ const [x,y] = d2xy(5, d); g.fillStyle = ramp(c, val(d)); g.fillRect(x0 + x*S + .4, y0 + y*S + .4, S - .8, S - .8); }
    // 一維資料條（完整寬度，四段以不同色框標示）
    const sx = W*.06, sw = W*.88;
    for(let k = 0; k < 256; k++){ g.fillStyle = ramp(c, val(k*4)); g.fillRect(sx + k*sw/256, sy, sw/256 + .5, sh); }
    // 四段 → 四象限的連線與色框
    const qpos = [0,1,2,3].map(q => d2xy(1, q));
    qpos.forEach(([qx,qy], q) => { const ax = sx + (q + .5)*sw/4, ay = sy + sh, bx = x0 + (qx + .5)*L/2, by = y0 + (qy + .5)*L/2;
      g.strokeStyle = qc[q]; g.lineWidth = 1.4; g.strokeRect(sx + q*sw/4 + 1, sy - 1, sw/4 - 2, sh + 2);
      g.strokeRect(x0 + qx*L/2 + 1.5, y0 + qy*L/2 + 1.5, L/2 - 3, L/2 - 3);
      g.setLineDash([2,3]); g.globalAlpha = .7; g.beginPath(); g.moveTo(ax, ay + 2); g.bezierCurveTo(ax, ay + (by-ay)*.45, bx, ay + (by-ay)*.3, bx, Math.min(by, y0 - 3)); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      dot(g, bx, Math.min(by, y0 - 3), 2.2, qc[q]); });
    // 一階 ⊓ 形順序箭頭
    const C = qpos.map(([x,y]) => [x0 + (x + .5)*L/2, y0 + (y + .5)*L/2]);
    g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 2; g.lineJoin = "round"; U.poly(g, C, false); g.stroke();
    C.forEach(([x,y], q) => { dot(g, x, y, 4, "#15151B"); dot(g, x, y, 2.6, qc[q]); });
    const e = C[3], f = C[2], ang = Math.atan2(e[1]-f[1], e[0]-f[0]); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(e[0] - 5*Math.cos(ang), e[1] - 5*Math.sin(ang));
    g.lineTo(e[0] - 12*Math.cos(ang) + 4*Math.sin(ang), e[1] - 12*Math.sin(ang) - 4*Math.cos(ang)); g.lineTo(e[0] - 12*Math.cos(ang) - 4*Math.sin(ang), e[1] - 12*Math.sin(ang) + 4*Math.cos(ang)); g.closePath(); g.fill();
  },
  // V09 Hilbert 排序：散亂點雲（淡灰亂序連線）→ 依 Hilbert 索引排序後的路徑
  function(g, W, H, r, c, U){
    const L = Math.min(W,H)*.86, x0 = (W-L)/2, y0 = (H-L)/2, pts = [], cl = [[r(),r()],[r(),r()],[r(),r()]];
    for(let i = 0; i < 120; i++){ let x, y; if(i < 80){ const k = cl[i%3], a = r()*TAU, d = r()*.18; x = k[0]*.7+.15 + d*Math.cos(a); y = k[1]*.7+.15 + d*Math.sin(a); } else { x = r(); y = r(); }
      x = Math.min(.999, Math.max(0, x)); y = Math.min(.999, Math.max(0, y)); pts.push({x, y, d: xy2d(6, (x*64)|0, (y*64)|0)}); }
    g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = .8;
    for(let k = 1; k < 4; k++){ g.beginPath(); g.moveTo(x0 + k*L/4, y0); g.lineTo(x0 + k*L/4, y0+L); g.moveTo(x0, y0 + k*L/4); g.lineTo(x0+L, y0 + k*L/4); g.stroke(); }
    g.strokeRect(x0, y0, L, L);
    g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = .6; g.beginPath(); pts.forEach((p,i) => i ? g.lineTo(x0+p.x*L, y0+p.y*L) : g.moveTo(x0+p.x*L, y0+p.y*L)); g.stroke();
    const sp = pts.slice().sort((a,b) => a.d - b.d).map(p => [x0+p.x*L, y0+p.y*L]);
    gradLine(g, sp, t => ramp(c, .4 + .55*t), 1.5, 119);
    sp.forEach(([x,y], i) => { dot(g, x, y, 2.3, "#15151B"); dot(g, x, y, 1.6, ramp(c, .4 + .6*i/sp.length)); });
    dot(g, sp[0][0], sp[0][1], 3.5, "#fff"); g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.beginPath(); g.arc(sp[sp.length-1][0], sp[sp.length-1][1], 4, 0, TAU); g.stroke();
  },
  // V10 列印／刀具路徑：圓角路徑逐層旋轉 90° 堆疊，頂層接噴頭
  function(g, W, H, r, c, U){
    const s = Math.min(W,H)*.3, pr = mkProj(Math.PI/4, .55, s, W/2, H*.6), base = hil(3).map(([x,y]) => [(x-3.5)/3.5, (y-3.5)/3.5]), nL = 6, dz = .16;
    const bed = [[-1.3,-1.3,-.05],[1.3,-1.3,-.05],[1.3,1.3,-.05],[-1.3,1.3,-.05]].map(pr);
    g.fillStyle = "rgba(255,255,255,.05)"; U.poly(g, bed, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.stroke();
    let last = null, head = null;
    for(let k = 0; k < nL; k++){ const P = base.map(([x,y]) => pr(k % 2 ? [-y, x, k*dz] : [x, y, k*dz])), t = k/(nL-1);
      if(last){ g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(P[0][0], P[0][1]); g.stroke(); }
      const path = () => { g.beginPath(); g.moveTo(P[0][0], P[0][1]);
        for(let i = 1; i < P.length-1; i++){ const m = [(P[i][0]+P[i+1][0])/2, (P[i][1]+P[i+1][1])/2]; g.quadraticCurveTo(P[i][0], P[i][1], m[0], m[1]); }
        g.lineTo(P[P.length-1][0], P[P.length-1][1]); };
      g.lineCap = "round"; g.lineJoin = "round";
      path(); g.strokeStyle = "rgba(10,10,14,.9)"; g.lineWidth = 3.6; g.stroke();
      path(); g.strokeStyle = ramp(c, .35 + .55*t); g.lineWidth = 2.4; g.stroke();
      path(); g.strokeStyle = `rgba(255,255,255,${.1 + .25*t})`; g.lineWidth = .6; g.stroke();
      last = P[P.length-1]; head = last; }
    const hx = head[0], hy = head[1]; glow(g, hx, hy, 10, "#FFFFFF", .6);
    g.fillStyle = "#B9B4AE"; g.beginPath(); g.moveTo(hx, hy-2); g.lineTo(hx-5, hy-11); g.lineTo(hx+5, hy-11); g.closePath(); g.fill();
    g.fillStyle = "#6F6A66"; g.fillRect(hx-9, hy-26, 18, 15); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = .8; g.strokeRect(hx-9, hy-26, 18, 15);
  },
  // V11 迷宮與通道：曲線 Offset 成雙牆通道，綠籬填空隙，少數打通口
  function(g, W, H, r, c, U){
    const L = Math.min(W,H)*.84, x0 = (W-L)/2, y0 = (H-L)/2, N = 16, S = L/N, P = place(hil(4), N, x0, y0, L), cw = S*.64;
    g.fillStyle = U.rgba(c, .28); g.fillRect(x0 - S*.2, y0 - S*.2, L + S*.4, L + S*.4);
    for(let i = 0; i < 90; i++) dot(g, x0 + r()*L, y0 + r()*L, .8 + r()*1.4, U.rgba(c, .5));
    const full = [[P[0][0], y0 + L + S*.6], ...P, [P[P.length-1][0], y0 + L + S*.6]];
    const walls = (pts, w) => { g.lineCap = "butt"; g.lineJoin = "miter"; g.strokeStyle = "#F1E9E0"; g.lineWidth = w; U.poly(g, pts, false); g.stroke(); g.strokeStyle = "#17171E"; g.lineWidth = w - 2.4; U.poly(g, pts, false); g.stroke(); };
    walls(full, cw);
    const pos = new Map(); hil(4).forEach(([x,y], d) => pos.set(x*N+y, d));
    let made = 0; for(let tries = 0; tries < 200 && made < 6; tries++){ const x = (r()*(N-1))|0, y = (r()*N)|0, d1 = pos.get(x*N+y), d2 = pos.get((x+1)*N+y);
      if(Math.abs(d1-d2) > 3){ const a = P[d1], b = P[d2]; g.fillStyle = "#17171E"; g.fillRect(Math.min(a[0],b[0]), a[1] - (cw-2.4)/2, Math.abs(b[0]-a[0]), cw-2.4); made++; } }
    g.setLineDash([1.5, 3]); g.strokeStyle = U.rgba(c, .95); g.lineWidth = 1.1; g.lineCap = "round"; U.poly(g, full, false); g.stroke(); g.setLineDash([]);
    const e = full[0], f = full[full.length-1]; dot(g, e[0], e[1] - 2, 3, "#fff"); dot(g, f[0], f[1] - 2, 3, c);
  },
  // V12 逐點生長動畫：四格分鏡，曲線如蛇一格一格填滿
  function(g, W, H, r, c, U){
    const fr = [.1, .35, .65, 1], m = W*.05, pw = (W - 3*m)/2, ph = (H - 3*m)/2, L = Math.min(pw, ph)*.8, H4 = hil(4);
    fr.forEach((f, k) => { const px = m + (k%2)*(pw+m), py = m + (k>>1)*(ph+m);
      g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 1; rrect(g, px, py, pw, ph, 5); g.stroke();
      const x0 = px + (pw-L)/2, y0 = py + (ph-L)/2 - ph*.04, P = place(H4, 16, x0, y0, L);
      P.forEach(([x,y]) => dot(g, x, y, .6, "rgba(255,255,255,.18)"));
      const n = Math.max(2, Math.round(f*P.length)), part = P.slice(0, n);
      gradLine(g, part, t => ramp(c, .35 + .5*t*f), 1.4, Math.max(4, Math.round(30*f)));
      const hd = part[n-1]; glow(g, hd[0], hd[1], 9, "#FFFFFF", .55); dot(g, hd[0], hd[1], 2.2, "#fff");
      const by = py + ph - ph*.08; g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(px + pw*.12, by, pw*.76, 2.5); g.fillStyle = c; g.fillRect(px + pw*.12, by, pw*.76*f, 2.5); });
  },
];

/* ---------------- 沒有照片的案例 ---------------- */
// A03-01 xkcd 網路地圖：16×16 的 /8 網段手繪方格，同網段聚成方塊
ART.case["A03-01"] = function(g, W, H, r, c, U){
  const L = Math.min(W,H)*.86, x0 = (W-L)/2, y0 = (H-L)/2, N = 16, S = L/N, grp = new Array(256), look = [];
  let d = 0, gid = 0; while(d < 256){ let sz = [1,4,4,16,16,16][(r()*6)|0]; while(d % sz || d + sz > 256) sz /= 4; for(let k = 0; k < sz; k++) grp[d+k] = gid; look.push(r()); gid++; d += sz; }
  const G = new Array(256); for(let d2 = 0; d2 < 256; d2++){ const [x,y] = d2xy(4, d2); G[x*N+y] = grp[d2]; }
  for(let x = 0; x < N; x++) for(let y = 0; y < N; y++){ const k = look[G[x*N+y]], X = x0 + x*S, Y = y0 + y*S;
    if(k < .3){ g.fillStyle = U.rgba(c, .15 + k*1.2); g.fillRect(X, Y, S, S); }
    else if(k < .5){ g.strokeStyle = "rgba(255,255,255,.28)"; g.lineWidth = .6; g.beginPath(); for(let t = -S; t < S; t += 3){ g.moveTo(X + Math.max(0,t), Y + Math.max(0,-t)); g.lineTo(X + Math.min(S, S+t), Y + Math.min(S, S-t)); } g.stroke(); } }
  for(let x = 0; x < N; x++) for(let y = 0; y < N; y++){ const X = x0 + x*S, Y = y0 + y*S, me = G[x*N+y];
    if(x < N-1){ const diff = G[(x+1)*N+y] !== me; g.strokeStyle = diff ? "#F4EFE8" : "rgba(255,255,255,.12)"; g.lineWidth = diff ? 1.4 : .5; jline(g, r, X+S, Y, X+S, Y+S, diff ? 1.2 : .4); }
    if(y < N-1){ const diff = G[x*N+y+1] !== me; g.strokeStyle = diff ? "#F4EFE8" : "rgba(255,255,255,.12)"; g.lineWidth = diff ? 1.4 : .5; jline(g, r, X, Y+S, X+S, Y+S, diff ? 1.2 : .4); } }
  g.strokeStyle = "#F4EFE8"; g.lineWidth = 2;
  jline(g, r, x0, y0, x0+L, y0, 2); jline(g, r, x0+L, y0, x0+L, y0+L, 2); jline(g, r, x0+L, y0+L, x0, y0+L, 2); jline(g, r, x0, y0+L, x0, y0, 2);
};
// A03-02 IPv4 普查地圖：128×128 像素使用率熱圖＋色階條
ART.case["A03-02"] = function(g, W, H, r, c, U){
  const n = 128, L = Math.min(W*.86, H*.78), x0 = (W-L)/2, y0 = H*.05, nz = U.vnoise((r()*1e6)|0), lvl = [];
  for(let b = 0; b < 256; b++) lvl.push(r() < .13 ? -1 : Math.pow(r(), .7));
  const off = document.createElement("canvas"); off.width = n; off.height = n; const o = off.getContext("2d"), img = o.createImageData(n, n);
  for(let d = 0; d < n*n; d++){ const [x,y] = d2xy(7, d), k = (y*n+x)*4, lv = lvl[d >> 6];
    let col; if(lv < 0) col = [48, 48, 58]; else { const v = lv*(.3 + .8*nz(x/7, y/7)) + (hash(d, 5) < .02 ? .5 : 0); col = rampRGB(c, v); }
    img.data[k] = col[0]; img.data[k+1] = col[1]; img.data[k+2] = col[2]; img.data[k+3] = 255; }
  o.putImageData(img, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(off, x0, y0, L, L); g.imageSmoothingEnabled = true;
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(x0, y0, L, L);
  const by = y0 + L + H*.05, bh = H*.04, bw = L*.7, bx = x0 + (L-bw)/2;
  for(let i = 0; i < 60; i++){ g.fillStyle = ramp(c, i/59); g.fillRect(bx + i*bw/60, by, bw/60 + .5, bh); }
  g.strokeRect(bx, by, bw, bh); for(let k = 0; k <= 4; k++){ g.beginPath(); g.moveTo(bx + k*bw/4, by+bh); g.lineTo(bx + k*bw/4, by+bh+4); g.stroke(); }
};
ART.case["A03-02"].ratio = 1.15;
// A03-03 互動筆記本：總覽圖上框選一格，放大視窗換成更高階
ART.case["A03-03"] = function(g, W, H, r, c, U){
  const nz = U.vnoise((r()*1e6)|0), m = W*.05, L1 = W*.6, bx = m, by = m, S1 = L1/8, pick = 20 + ((r()*24)|0), [px,py] = d2xy(3, pick);
  for(let d = 0; d < 64; d++){ const [x,y] = d2xy(3, d); g.fillStyle = ramp(c, .2 + .65*nz(x*.6, y*.6)); g.fillRect(bx + x*S1 + .5, by + y*S1 + .5, S1-1, S1-1); }
  gradLine(g, place(hil(3), 8, bx, by, L1), () => "rgba(255,255,255,.45)", .8, 4);
  const L2 = W*.56, qx = W - L2 - m, qy = H - L2 - m, hx = bx + px*S1, hy = by + py*S1;
  g.setLineDash([3,3]); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = .9;
  g.beginPath(); g.moveTo(hx + S1, hy); g.lineTo(qx + L2, qy); g.moveTo(hx, hy + S1); g.lineTo(qx, qy + L2); g.stroke(); g.setLineDash([]);
  g.fillStyle = "#16161D"; g.fillRect(qx - 3, qy - 3, L2 + 6, L2 + 6);
  const S2 = L2/16; for(let d = 0; d < 256; d++){ const [x,y] = d2xy(4, d); g.fillStyle = ramp(c, .2 + .7*nz(px*.6 + x*.6/16, py*.6 + y*.6/16) + .15*(hash(d, 9)-.5)); g.fillRect(qx + x*S2 + .3, qy + y*S2 + .3, S2-.6, S2-.6); }
  gradLine(g, place(hil(4), 16, qx, qy, L2), () => "rgba(255,255,255,.5)", .7, 4);
  g.strokeStyle = "#fff"; g.lineWidth = 1.8; g.strokeRect(hx, hy, S1, S1); g.lineWidth = 1.4; g.strokeRect(qx, qy, L2, L2);
  const zx = W - m - 12, zy = m; g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.strokeRect(zx, zy, 12, 12); g.strokeRect(zx, zy + 15, 12, 12);
  g.beginPath(); g.moveTo(zx+3, zy+6); g.lineTo(zx+9, zy+6); g.moveTo(zx+6, zy+3); g.lineTo(zx+6, zy+9); g.moveTo(zx+3, zy+21); g.lineTo(zx+9, zy+21); g.stroke();
};
ART.case["A03-03"].ratio = 1.12;
// A03-04 ggip：上下對照 Hilbert 與 Morton（Z 字）兩種排列
ART.case["A03-04"] = function(g, W, H, r, c, U){
  const nz = U.vnoise((r()*1e6)|0), L = Math.min(W*.74, H*.42), x0 = (W-L)/2, N = 8, S = L/N;
  [[H*.05, (o,d) => d2xy(o,d)], [H*.53, morton]].forEach(([y0, fn], k) => {
    for(let d = 0; d < 64; d++){ const [x,y] = fn(3, d); g.fillStyle = U.rgba(c, .08 + .45*nz(d/9, .3)); g.fillRect(x0 + x*S + .5, y0 + y*S + .5, S-1, S-1); }
    const P = []; for(let d = 0; d < 64; d++){ const [x,y] = fn(3, d); P.push([x0 + (x+.5)*S, y0 + (y+.5)*S]); }
    g.lineCap = "round"; g.lineJoin = "round";
    for(let i = 1; i < P.length; i++){ const jump = Math.hypot(P[i][0]-P[i-1][0], P[i][1]-P[i-1][1]) > S*1.1;
      g.strokeStyle = jump ? "rgba(255,255,255,.55)" : ramp(c, .45 + .5*i/64); g.lineWidth = jump ? .8 : 1.8; g.setLineDash(jump ? [2,2] : []);
      g.beginPath(); g.moveTo(P[i-1][0], P[i-1][1]); g.lineTo(P[i][0], P[i][1]); g.stroke(); }
    g.setLineDash([]); P.forEach(([x,y]) => dot(g, x, y, 1.3, "#fff"));
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(x0, y0, L, L);
    // 左側小圖示：Hilbert 用 ⊓ 形、Morton 用 Z 形
    const ix = x0 - 16, iy = y0 + 4; g.strokeStyle = k ? "rgba(255,255,255,.7)" : c; g.lineWidth = 1.5; g.beginPath();
    if(k){ g.moveTo(ix, iy); g.lineTo(ix+9, iy); g.lineTo(ix, iy+9); g.lineTo(ix+9, iy+9); } else { g.moveTo(ix, iy+9); g.lineTo(ix, iy); g.lineTo(ix+9, iy); g.lineTo(ix+9, iy+9); }
    g.stroke(); });
  g.strokeStyle = "rgba(255,255,255,.15)"; g.beginPath(); g.moveTo(W*.1, H*.5); g.lineTo(W*.9, H*.5); g.stroke();
};
ART.case["A03-04"].ratio = 1.3;
// A03-05 ping 全網際網路：256×256 回應點的星點圖，疊上 /8 網段格線
ART.case["A03-05"] = function(g, W, H, r, c, U){
  const n = 256, L = Math.min(W,H)*.9, x0 = (W-L)/2, y0 = (H-L)/2, pb = [], s = (r()*1e6)|0, [R,G,B] = U.rgb(c);
  for(let b = 0; b < 256; b++) pb.push(r() < .2 ? 0 : Math.pow(r(), 1.6)*.9);
  const off = document.createElement("canvas"); off.width = n; off.height = n; const o = off.getContext("2d"), img = o.createImageData(n, n);
  for(let d = 0; d < n*n; d++){ const [x,y] = d2xy(8, d), k = (y*n+x)*4, p = pb[d >> 8]*(.2 + .8*hash(d >> 5, s));
    const on = hash(d, s+1) < p, hot = on && hash(d, s+2) < .25;
    img.data[k] = on ? (hot ? 255 : R) : 10; img.data[k+1] = on ? (hot ? 245 : G) : 10; img.data[k+2] = on ? (hot ? 230 : B) : 14; img.data[k+3] = 255; }
  o.putImageData(img, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(off, x0, y0, L, L); g.imageSmoothingEnabled = true;
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = .6;
  for(let k = 1; k < 16; k++){ g.beginPath(); g.moveTo(x0 + k*L/16, y0); g.lineTo(x0 + k*L/16, y0+L); g.moveTo(x0, y0 + k*L/16); g.lineTo(x0+L, y0 + k*L/16); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.2; for(let k = 0; k < 3; k++){ const b = (r()*256)|0, [x,y] = d2xy(4, b); g.strokeRect(x0 + x*L/16, y0 + y*L/16, L/16, L/16); }
  g.strokeStyle = "rgba(255,255,255,.4)"; g.strokeRect(x0, y0, L, L);
};
// A03-06 Hilbert Cube 512：三階 3D 曲線的青銅雕塑，立在台座上
ART.case["A03-06"] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)*.075, pr = mkProj(.45 + r()*.25, .6, s, W/2, H*.4), pts = hil3(3).map(p => [p[0]-3.5, p[1]-3.5, p[2]-3.5]);
  const gr = g.createRadialGradient(W/2, H*.35, 0, W/2, H*.35, W*.7); gr.addColorStop(0, "rgba(255,240,225,.10)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const box = (z0, z1, hw) => { const q = (x,y,z) => pr([x,y,z]);
    const top = [q(-hw,-hw,z1), q(hw,-hw,z1), q(hw,hw,z1), q(-hw,hw,z1)], f1 = [q(hw,-hw,z1), q(hw,hw,z1), q(hw,hw,z0), q(hw,-hw,z0)], f2 = [q(-hw,hw,z1), q(hw,hw,z1), q(hw,hw,z0), q(-hw,hw,z0)];
    g.fillStyle = "#2B2A30"; U.poly(g, f1, true); g.fill(); g.fillStyle = "#35343B"; U.poly(g, f2, true); g.fill(); g.fillStyle = "#46454D"; U.poly(g, top, true); g.fill(); };
  const fl = pr([0, 0, -9.5]); g.fillStyle = "rgba(0,0,0,.45)"; g.beginPath(); g.ellipse(fl[0], fl[1], W*.32, H*.05, 0, 0, TAU); g.fill();
  box(-9.5, -4.6, 3);
  // 青銅色：暗褐 → 亮銅（略帶家族色）
  const [R1,G1,B1] = [90,58,30], hi = U.rgb(c).map((v,i) => Math.round([217,160,102][i]*.75 + v*.25));
  tube(g, pts.map(pr), s*.42, t => { const k = .25 + .75*t; return `rgb(${Math.round(R1+(hi[0]-R1)*k)},${Math.round(G1+(hi[1]-G1)*k)},${Math.round(B1+(hi[2]-B1)*k)})`; });
};
ART.case["A03-06"].ratio = 1.2;
// A03-07 SIGGRAPH 展：立方體切成八個子格的爆炸圖，擺在展場地板透視中
ART.case["A03-07"] = function(g, W, H, r, c, U){
  const vy = H*.3; g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = .8;
  for(let k = -6; k <= 6; k++){ g.beginPath(); g.moveTo(W/2 + k*W*.02, vy); g.lineTo(W/2 + k*W*.35, H); g.stroke(); }
  for(let k = 0; k < 6; k++){ const y = vy + (H-vy)*Math.pow(k/6, 1.7) + (H-vy)*.1; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.2)"; g.beginPath(); g.moveTo(0, vy + (H-vy)*.1); g.lineTo(W, vy + (H-vy)*.1); g.stroke();
  const s = Math.min(W,H)*.105, pr = mkProj(.6, .5, s, W/2, H*.45), raw = hil3(2).map(p => [p[0]-1.5, p[1]-1.5, p[2]-1.5]), ex = .9;
  const P3 = raw.map((p, i) => { const o = raw.slice((i>>3)*8, (i>>3)*8+8), m = [0,1,2].map(a => o.reduce((u,q) => u+q[a], 0)/8); return [p[0]+m[0]*ex, p[1]+m[1]*ex, p[2]+m[2]*ex, m]; });
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = .8;
  for(let o = 0; o < 8; o++){ const m = P3[o*8][3], cc = m.map(v => v*(1+ex)), q = (a,b,d) => pr([cc[0]+a, cc[1]+b, cc[2]+d]);
    [[-1,-1,-1,1,-1,-1],[1,-1,-1,1,1,-1],[1,1,-1,-1,1,-1],[-1,1,-1,-1,-1,-1],[-1,-1,1,1,-1,1],[1,-1,1,1,1,1],[1,1,1,-1,1,1],[-1,1,1,-1,-1,1],[-1,-1,-1,-1,-1,1],[1,-1,-1,1,-1,1],[1,1,-1,1,1,1],[-1,1,-1,-1,1,1]]
      .forEach(e => { const a = q(e[0],e[1],e[2]), b = q(e[3],e[4],e[5]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }); }
  const P = P3.map(pr);
  g.setLineDash([2,3]); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1;
  for(let o = 1; o < 8; o++){ const a = P[o*8-1], b = P[o*8]; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); } g.setLineDash([]);
  tube(g, P, s*.2, t => ramp(c, .3 + .6*t), i => i % 8 === 0);
};
ART.case["A03-07"].ratio = 1.05;
// A03-08 數學繪畫：展牆上三幅不同色彩與線寬的 Hilbert 畫作
ART.case["A03-08"] = function(g, W, H, r, c, U){
  const fy = H*.8; g.fillStyle = "#1E1E26"; g.fillRect(0, 0, W, fy); g.fillStyle = "#121216"; g.fillRect(0, fy, W, H-fy);
  g.strokeStyle = "rgba(255,255,255,.15)"; g.beginPath(); g.moveTo(0, fy); g.lineTo(W, fy); g.stroke();
  const frames = [[W*.05, H*.3, W*.2, 2, c, "#fff", 2.4], [W*.32, H*.14, W*.36, 4, "#EFE8DF", c, 2], [W*.75, H*.34, W*.2, 5, "#15151B", null, .7]];
  frames.forEach(([x, y, L, ord, bg, ink, lw]) => {
    glow(g, x + L/2, y - H*.02, L*.9, "#FFF4E0", .12);
    g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(x + 3, y + 4, L, L);
    g.fillStyle = "#3A342E"; g.fillRect(x - 3, y - 3, L + 6, L + 6); g.fillStyle = bg; g.fillRect(x, y, L, L);
    const N = 1 << ord, P = place(hil(ord), N, x + L*.08, y + L*.08, L*.84);
    if(ink){ g.strokeStyle = ink; g.lineWidth = lw; g.lineCap = "square"; g.lineJoin = "miter"; U.poly(g, P, false); g.stroke(); }
    else gradLine(g, P, t => `hsl(${(t*300)|0},75%,62%)`, lw, 36); });
};
ART.case["A03-08"].ratio = .78;
// A03-09 FDM 刀具路徑：列印平台斜俯視，擠出中的單層路徑與噴頭
ART.case["A03-09"] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)*.36, pr = mkProj(.35, .95, s, W/2, H*.53), bed = [[-1.25,-1.25,0],[1.25,-1.25,0],[1.25,1.25,0],[-1.25,1.25,0]].map(pr);
  g.fillStyle = "#23232C"; U.poly(g, bed, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.stroke();
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = .7;
  for(let k = -5; k <= 5; k++){ const a = pr([k*.25, -1.25, 0]), b = pr([k*.25, 1.25, 0]), e = pr([-1.25, k*.25, 0]), f = pr([1.25, k*.25, 0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.moveTo(e[0],e[1]); g.lineTo(f[0],f[1]); g.stroke(); }
  const P = hil(4).map(([x,y]) => pr([(x-7.5)/7.5, (y-7.5)/7.5, 0])), n = Math.round(P.length*(.55 + r()*.3)), step = Math.hypot(P[1][0]-P[0][0], P[1][1]-P[0][1]);
  g.setLineDash([1.5,2.5]); g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = .7; U.poly(g, P.slice(n-1), false); g.stroke(); g.setLineDash([]);
  const done = P.slice(0, n); g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = "rgba(5,5,8,.9)"; g.lineWidth = step*.7 + 1.5; U.poly(g, done, false); g.stroke();
  g.strokeStyle = c; g.lineWidth = step*.7; U.poly(g, done, false); g.stroke();
  g.strokeStyle = "rgba(255,230,210,.55)"; g.lineWidth = step*.18; g.save(); g.translate(-step*.12, -step*.12); U.poly(g, done, false); g.stroke(); g.restore();
  const [hx, hy] = done[n-1]; glow(g, hx, hy, 14, "#FFD9B0", .8);
  g.fillStyle = "#C9C3BC"; g.beginPath(); g.moveTo(hx, hy-1); g.lineTo(hx-6, hy-12); g.lineTo(hx+6, hy-12); g.closePath(); g.fill();
  g.fillStyle = "#5E5955"; g.fillRect(hx-11, hy-34, 22, 22); g.fillStyle = "#77716C"; g.fillRect(hx-11, hy-34, 22, 4);
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = .8; for(let k = 0; k < 4; k++){ g.beginPath(); g.moveTo(hx-9, hy-28 + k*4); g.lineTo(hx+9, hy-28 + k*4); g.stroke(); }
};
// A03-10 自適應密度：斷面逐層縮小，同階曲線在小斷面上自然變密
ART.case["A03-10"] = function(g, W, H, r, c, U){
  const wid = t => .95 - .55*t + .08*Math.sin(t*TAU), lx = W*.24, top = H*.08, bot = H*.92, hw = W*.19, prof = [];
  for(let i = 0; i <= 40; i++){ const t = i/40; prof.push([lx + hw*wid(t), bot - (bot-top)*t]); }
  for(let i = 40; i >= 0; i--){ const t = i/40; prof.push([lx - hw*wid(t), bot - (bot-top)*t]); }
  g.fillStyle = U.rgba(c, .12); U.poly(g, prof, true); g.fill();
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = .6; for(let k = 1; k < 30; k++){ const t = k/30, y = bot - (bot-top)*t; g.beginPath(); g.moveTo(lx - hw*wid(t), y); g.lineTo(lx + hw*wid(t), y); g.stroke(); }
  g.strokeStyle = "#F0E8E0"; g.lineWidth = 1.3; U.poly(g, prof, true); g.stroke();
  const P = hil(3), cx = W*.72;
  [.85, .5, .12].forEach((t, k) => { const y = bot - (bot-top)*t, sz = W*.34*wid(t), py = H*(.06 + k*.32), qx = cx - sz/2, qy = py + (H*.28 - sz)/2;
    g.strokeStyle = c; g.lineWidth = 1.6; g.beginPath(); g.moveTo(lx - hw*wid(t), y); g.lineTo(lx + hw*wid(t), y); g.stroke();
    g.setLineDash([2,3]); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8; g.beginPath(); g.moveTo(lx + hw*wid(t) + 3, y); g.lineTo(qx - 4, qy + sz/2); g.stroke(); g.setLineDash([]);
    g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(qx, qy, sz, sz); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.strokeRect(qx, qy, sz, sz);
    g.strokeStyle = ramp(c, .5 + .35*(1-k/2)); g.lineWidth = 1.2; g.lineJoin = "round"; U.poly(g, place(P, 8, qx, qy, sz), false); g.stroke(); });
};
ART.case["A03-10"].ratio = 1.1;
// A03-11 可調性質構件：L 形列印件等角圖，頂面各區用不同階數填充
ART.case["A03-11"] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)*.3, pr = mkProj(Math.PI/4, .6, s, W/2, H*.52), h = .5, ords = [4, 2, 3];
  [[0,0],[1,0],[0,1]].forEach(([bx, by], k) => { const q = (x,y,z) => pr([bx + x - 1, by + y - 1, z]);
    const fx = [q(1,0,h), q(1,1,h), q(1,1,0), q(1,0,0)], fy = [q(0,1,h), q(1,1,h), q(1,1,0), q(0,1,0)], top = [q(0,0,h), q(1,0,h), q(1,1,h), q(0,1,h)];
    g.fillStyle = "#2A2A33"; U.poly(g, fx, true); g.fill(); g.fillStyle = "#34343E"; U.poly(g, fy, true); g.fill();
    g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = .6;
    for(let z = 1; z < 10; z++){ const zz = h*z/10, a = q(1,0,zz), b = q(1,1,zz), e = q(0,1,zz); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.lineTo(e[0],e[1]); g.stroke(); }
    g.fillStyle = U.rgba(c, .1 + k*.08); U.poly(g, top, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1; g.stroke();
    const o = ords[k], N = 1 << o, P = hil(o).map(([x,y]) => q((x+.5)/N*.92 + .04, (y+.5)/N*.92 + .04, h));
    g.strokeStyle = ramp(c, .45 + o*.1); g.lineWidth = o > 3 ? .9 : 1.6; g.lineJoin = "round"; U.poly(g, P, false); g.stroke(); });
};
ART.case["A03-11"].ratio = .9;
// A03-12 SFCDecomp：正交多邊形以四分樹拆成正方形，各格內以 Hilbert 走訪
ART.case["A03-12"] = function(g, W, H, r, c, U){
  const N = 32, mask = new Uint8Array(N*N), rects = [];
  for(let k = 0; k < 4; k++){ const x = ((r()*5)|0)*4, y = ((r()*5)|0)*4, w = (3 + ((r()*4)|0))*4, h = (3 + ((r()*4)|0))*4; rects.push([x,y,Math.min(w,N-x),Math.min(h,N-y)]); }
  rects.forEach(([x,y,w,h]) => { for(let i = x; i < x+w; i++) for(let j = y; j < y+h; j++) mask[i*N+j] = 1; });
  const L = Math.min(W,H)*.88, x0 = (W-L)/2, y0 = (H-L)/2, S = L/N, leaves = [], pts = [];
  const cover = (X0, Y0, X1, Y1) => { let n = 0; for(let i = X0; i < X1; i++) for(let j = Y0; j < Y1; j++) n += mask[i*N+j]; return n; };
  const rec = (X, Y, xi, xj, yi, yj, n, leaf) => {
    if(leaf === -1){ const xa = Math.round(Math.min(X, X+xi, X+yi, X+xi+yi)), ya = Math.round(Math.min(Y, Y+xj, Y+yj, Y+xj+yj)), sz = Math.round(Math.abs(xi+yi)), cv = cover(xa, ya, xa+sz, ya+sz);
      if(cv === 0) return; if(cv === sz*sz){ leaf = leaves.length; leaves.push([xa, ya, sz]); } }
    if(n === 0){ pts.push([X + (xi+yi)/2, Y + (xj+yj)/2, leaf]); return; }
    rec(X, Y, yi/2, yj/2, xi/2, xj/2, n-1, leaf); rec(X+xi/2, Y+xj/2, xi/2, xj/2, yi/2, yj/2, n-1, leaf);
    rec(X+xi/2+yi/2, Y+xj/2+yj/2, xi/2, xj/2, yi/2, yj/2, n-1, leaf); rec(X+xi/2+yi, Y+xj/2+yj, -yi/2, -yj/2, -xi/2, -xj/2, n-1, leaf); };
  rec(0, 0, N, 0, 0, N, 5, -1);
  const lv = sz => Math.log2(sz)/5;
  leaves.forEach(([x,y,sz]) => { g.fillStyle = U.rgba(c, .06 + .16*lv(sz)); g.fillRect(x0 + x*S, y0 + y*S, sz*S, sz*S); });
  g.lineCap = "round";
  for(let i = 1; i < pts.length; i++){ const a = pts[i-1], b = pts[i], same = a[2] === b[2];
    g.setLineDash(same ? [] : [2,2]); g.strokeStyle = same ? ramp(c, .45 + .45*lv(leaves[a[2]][2])) : "rgba(255,255,255,.7)"; g.lineWidth = same ? 1.3 : .9;
    g.beginPath(); g.moveTo(x0 + a[0]*S, y0 + a[1]*S); g.lineTo(x0 + b[0]*S, y0 + b[1]*S); g.stroke(); }
  g.setLineDash([]); g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1; leaves.forEach(([x,y,sz]) => g.strokeRect(x0 + x*S, y0 + y*S, sz*S, sz*S));
};
// A03-13 Hilbert R-tree：街廓鳥瞰，建物依 Hilbert 值排序後分組成 R-tree 外框
ART.case["A03-13"] = function(g, W, H, r, c, U){
  const L = Math.min(W,H)*.92, x0 = (W-L)/2, y0 = (H-L)/2, road = L*.05, nb = 3, bs = (L - road*(nb+1))/nb, bld = [];
  g.fillStyle = "#26262E"; g.fillRect(x0, y0, L, L);
  for(let bi = 0; bi < nb; bi++) for(let bj = 0; bj < nb; bj++){ const bx = x0 + road + bi*(bs+road), by = y0 + road + bj*(bs+road), nc = 2 + ((r()*2)|0), nr = 2 + ((r()*2)|0);
    g.fillStyle = "#1A1A20"; g.fillRect(bx, by, bs, bs);
    for(let i = 0; i < nc; i++) for(let j = 0; j < nr; j++){ if(r() < .15) continue; const cw = bs/nc, ch = bs/nr, w = cw*(.5 + .4*r()), h = ch*(.5 + .4*r()), x = bx + i*cw + (cw-w)*r(), y = by + j*ch + (ch-h)*r();
      bld.push({x, y, w, h, d: xy2d(8, Math.min(255, ((x + w/2 - x0)/L*256)|0), Math.min(255, ((y + h/2 - y0)/L*256)|0))}); } }
  bld.forEach(b => { g.fillStyle = "#3A3A45"; g.fillRect(b.x, b.y, b.w, b.h); g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = .6; g.strokeRect(b.x, b.y, b.w, b.h); });
  bld.sort((a,b) => a.d - b.d);
  const mbr = arr => { let a = Infinity, b = Infinity, e = -Infinity, f = -Infinity; arr.forEach(q => { a = Math.min(a, q.x); b = Math.min(b, q.y); e = Math.max(e, q.x+q.w); f = Math.max(f, q.y+q.h); }); return [a, b, e-a, f-b]; };
  const leafN = 5, nodes = []; for(let i = 0; i < bld.length; i += leafN) nodes.push(bld.slice(i, i+leafN));
  for(let i = 0; i < nodes.length; i += 3){ const [a,b,w,h] = mbr(nodes.slice(i, i+3).flat()); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.4; g.strokeRect(a-4, b-4, w+8, h+8); }
  nodes.forEach((nd, k) => { const [a,b,w,h] = mbr(nd); g.fillStyle = U.rgba(c, .1); g.fillRect(a-1.5, b-1.5, w+3, h+3); g.setLineDash([3,2]); g.strokeStyle = k % 2 ? c : ramp(c, .85); g.lineWidth = 1; g.strokeRect(a-1.5, b-1.5, w+3, h+3); g.setLineDash([]); });
  const P = bld.map(b => [b.x + b.w/2, b.y + b.h/2]);
  gradLine(g, P, t => `rgba(255,255,255,${.35 + .5*t})`, .9, 10); P.forEach(([x,y]) => dot(g, x, y, 1.6, "#fff"));
};
// A03-14 Google S2：球面上六個立方體面的 Hilbert 格
ART.case["A03-14"] = function(g, W, H, r, c, U){
  const R = Math.min(W,H)*.42, cx = W/2, cy = H/2, yaw = .5 + r()*.6, pit = .45, cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit);
  const rot = ([x,y,z]) => { const X = x*cyw + z*syw, Z = -x*syw + z*cyw, Y2 = y*cp - Z*sp, Z2 = y*sp + Z*cp; return [cx + X*R, cy - Y2*R, Z2]; };
  glow(g, cx, cy, R*1.3, c, .14);
  const gr = g.createRadialGradient(cx - R*.35, cy - R*.35, R*.1, cx, cy, R); gr.addColorStop(0, "#34343E"); gr.addColorStop(1, "#16161C"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  const faces = [[[1,0,0],[0,1,0],[0,0,1]],[[-1,0,0],[0,0,1],[0,1,0]],[[0,1,0],[0,0,1],[1,0,0]],[[0,-1,0],[1,0,0],[0,0,1]],[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[0,1,0],[1,0,0]]];
  const map = (f, a, b) => { const [n,u,v] = f, p = [0,1,2].map(i => n[i] + u[i]*a + v[i]*b), l = Math.hypot(p[0], p[1], p[2]); return rot(p.map(q => q/l)); };
  const H4 = hil(4); g.lineCap = "round";
  faces.forEach((f, k) => {
    const P = H4.map(([x,y]) => map(f, (x+.5)/16*2-1, (y+.5)/16*2-1));
    for(let i = 1; i < P.length; i++){ const z = (P[i][2] + P[i-1][2])/2; if(z < 0) continue;
      g.strokeStyle = k % 2 ? `rgba(255,255,255,${.15 + .6*z})` : U.rgba(c, .25 + .75*z); g.lineWidth = .6 + z; g.beginPath(); g.moveTo(P[i-1][0], P[i-1][1]); g.lineTo(P[i][0], P[i][1]); g.stroke(); }
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.2;
    [[-1,-1,1,-1],[1,-1,1,1],[1,1,-1,1],[-1,1,-1,-1]].forEach(([a0,b0,a1,b1]) => { let prev = null;
      for(let t = 0; t <= 16; t++){ const p = map(f, a0 + (a1-a0)*t/16, b0 + (b1-b0)*t/16); if(prev && p[2] > 0 && prev[2] > 0){ g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(p[0], p[1]); g.stroke(); } prev = p; } }); });
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
};
// A03-15 Grasshopper 實作：上方節點編輯器（Anemone 迴圈），下方 Rhino 視窗中的 Gosper 曲線
ART.case["A03-15"] = function(g, W, H, r, c, U){
  const sh = H*.4; g.fillStyle = "#24242C"; g.fillRect(0, 0, W, sh);
  for(let x = 6; x < W; x += 10) for(let y = 6; y < sh; y += 10) dot(g, x, y, .5, "rgba(255,255,255,.12)");
  const nodes = [[.06,.22,.2,.34],[.32,.12,.18,.26],[.32,.52,.18,.26],[.58,.3,.18,.34],[.82,.3,.13,.3]].map(([x,y,w,h]) => [x*W, y*sh, w*W, h*sh]);
  const wire = (a, b) => { const x1 = a[0]+a[2], y1 = a[1]+a[3]/2, x2 = b[0], y2 = b[1]+b[3]/2; g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x1, y1); g.bezierCurveTo(x1 + 20, y1, x2 - 20, y2, x2, y2); g.stroke(); };
  wire(nodes[0], nodes[1]); wire(nodes[0], nodes[2]); wire(nodes[1], nodes[3]); wire(nodes[2], nodes[3]); wire(nodes[3], nodes[4]);
  const a = nodes[4], b = nodes[0]; g.strokeStyle = c; g.lineWidth = 1.3; g.setLineDash([3,2]); g.beginPath(); g.moveTo(a[0] + a[2]/2, a[1] + a[3]); g.bezierCurveTo(a[0] + a[2]/2, sh*.98, b[0] + b[2]/2, sh*.98, b[0] + b[2]/2, b[1] + b[3]); g.stroke(); g.setLineDash([]);
  nodes.forEach(([x,y,w,h], k) => { g.fillStyle = k === 0 || k === 4 ? U.rgba(c, .55) : "#4A4A55"; rrect(g, x, y, w, h, 3); g.fill(); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = .8; g.stroke();
    g.fillStyle = "rgba(255,255,255,.35)"; for(let i = 0; i < 2; i++) g.fillRect(x + 3, y + 4 + i*5, w*.5, 1.5);
    dot(g, x, y + h/2, 2, "#ddd"); dot(g, x + w, y + h/2, 2, "#ddd"); });
  g.fillStyle = "#1A1A20"; g.fillRect(0, sh, W, H - sh); g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, sh); g.lineTo(W, sh); g.stroke();
  const pr = mkProj(.4, .72, Math.min(W, H-sh)*.42, W/2, sh + (H-sh)*.52);
  g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = .6;
  for(let k = -6; k <= 6; k++){ const p1 = pr([k*.2, -1.2, 0]), p2 = pr([k*.2, 1.2, 0]), p3 = pr([-1.2, k*.2, 0]), p4 = pr([1.2, k*.2, 0]); g.beginPath(); g.moveTo(p1[0],p1[1]); g.lineTo(p2[0],p2[1]); g.moveTo(p3[0],p3[1]); g.lineTo(p4[0],p4[1]); g.stroke(); }
  const s = lsys("A", {A:"A-B--B+A++AA+B-", B:"+A-BB--B-A++A+B"}, 3), f = fit(turtle(s, 60, "AB", r()*TAU), -1, -1, 2, 2).pts;
  const P = f.map(([x,y]) => pr([x, y, 0])); g.strokeStyle = U.rgba(c, .3); g.lineWidth = 3; g.lineJoin = "round"; U.poly(g, P, false); g.stroke(); g.strokeStyle = "#7CFC9A"; g.lineWidth = .9; g.stroke();
  const o = pr([0,0,0]), ax = pr([.35,0,0]), ay = pr([0,.35,0]), az = pr([0,0,.35]);
  [[ax,"#E5484D"],[ay,"#46C26B"],[az,"#3D7BE8"]].forEach(([p, col]) => { g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); g.moveTo(o[0], o[1]); g.lineTo(p[0], p[1]); g.stroke(); });
};
ART.case["A03-15"].ratio = 1.25;
// A03-53 D3 互動展示：瀏覽器視窗內的 Hilbert Tiles（彩虹色塊依曲線順序排列）＋低階曲線疊線＋滑桿
ART.case["A03-53"] = function(g, W, H, r, c, U){
  const m = W*.05, wx = m, wy = m, ww = W - 2*m, wh = H - 2*m, bar = 14;
  g.fillStyle = "#EDEAE5"; rrect(g, wx, wy, ww, wh, 5); g.fill();
  g.fillStyle = "#D6D2CC"; g.fillRect(wx, wy + 5, ww, bar - 5); g.beginPath(); rrect(g, wx, wy, ww, bar, 5); g.fill();
  ["#E5484D", "#F2C14E", "#46C26B"].forEach((col, k) => dot(g, wx + 7 + k*7, wy + bar/2, 2.2, col));
  g.fillStyle = "#F7F5F2"; rrect(g, wx + 30, wy + 3, ww - 36, bar - 6, 4); g.fill();
  // 頁面內容：Hilbert Tiles（order 4 色塊，色相依序號）
  const ord = 3 + ((r()*2)|0), N = 1 << ord, L = Math.min(ww*.8, (wh - bar)*.72), x0 = wx + (ww - L)/2, y0 = wy + bar + (wh - bar)*.06, S = L/N, hue0 = (r()*360)|0;
  hil(ord).forEach(([x,y], d) => { g.fillStyle = `hsl(${(hue0 + d/(N*N)*330) % 360},72%,58%)`; g.fillRect(x0 + x*S, y0 + y*S, S + .3, S + .3); });
  // 疊線：同階曲線（深色細線）
  g.strokeStyle = "rgba(20,20,26,.75)"; g.lineWidth = 1.1; g.lineJoin = "round"; g.lineCap = "round"; U.poly(g, place(hil(ord), N, x0, y0, L), false); g.stroke();
  // 滑桿 n 與顏色開關
  const ty = y0 + L + (wh - bar)*.1, tx = x0, tw = L*.74, steps = 6, kx = tx + tw*(ord - 1)/(steps - 1);
  g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 3; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + tw, ty); g.stroke();
  g.strokeStyle = c; g.beginPath(); g.moveTo(tx, ty); g.lineTo(kx, ty); g.stroke();
  g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1; for(let k = 0; k < steps; k++){ g.beginPath(); g.moveTo(tx + tw*k/(steps-1), ty + 5); g.lineTo(tx + tw*k/(steps-1), ty + 8); g.stroke(); }
  dot(g, kx, ty, 5.5, "#fff"); g.strokeStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.arc(kx, ty, 5.5, 0, TAU); g.stroke(); dot(g, kx, ty, 2.6, c);
  const bx = x0 + L - 11; g.fillStyle = c; rrect(g, bx, ty - 5.5, 11, 11, 2); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(bx + 2.5, ty); g.lineTo(bx + 4.8, ty + 2.5); g.lineTo(bx + 8.5, ty - 2.5); g.stroke();
};
ART.case["A03-53"].ratio = 1.1;
})();
