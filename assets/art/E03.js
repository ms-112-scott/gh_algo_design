/* E03 Voronoi＋Lloyd 鬆弛：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
ART.var["E03"] = ART.var["E03"] || [];
const TAU = U.TAU, ACC = "#F2A45E"; // 少量第二色點綴：吸引點、流線、位移箭頭

// ---------- 共用幾何工具 ----------
function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
function path(g, P, close){ g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if(close) g.closePath(); }
function norm2(x, y){ const l = Math.hypot(x, y) || 1; return [x / l, y / l]; }
function pip(P, x, y){ let s = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) s = !s; } return s; }
// 半平面裁切：保留 f(p) <= 0 的一側
function clip(P, f){
  const out = [];
  for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], fa = f(a), fb = f(b);
    if(fa <= 0) out.push(a);
    if((fa < 0 && fb > 0) || (fa > 0 && fb < 0)){ const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } }
  return out;
}
// Voronoi／Power diagram 多邊形：S = [x, y, 半徑]（weighted 時才用半徑）
function cells(S, x0, y0, x1, y1, weighted){
  return S.map((s, i) => { let P = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    for(let j = 0; j < S.length && P.length; j++){ if(j === i) continue; const t = S[j];
      const ws = weighted ? (s[2] || 0) ** 2 : 0, wt = weighted ? (t[2] || 0) ** 2 : 0;
      const k = -(t[0] * t[0] + t[1] * t[1]) + s[0] * s[0] + s[1] * s[1] + wt - ws;
      P = clip(P, p => 2 * (p[0] * (t[0] - s[0]) + p[1] * (t[1] - s[1])) + k); }
    return P; });
}
function centroid(P){
  if(P.length < 3) return P[0] || [0, 0];
  let A = 0, cx = 0, cy = 0;
  for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], cr = a[0] * b[1] - b[0] * a[1]; A += cr; cx += (a[0] + b[0]) * cr; cy += (a[1] + b[1]) * cr; }
  A *= .5; if(Math.abs(A) < 1e-6) return P[0];
  return [cx / (6 * A), cy / (6 * A)];
}
// 解析式 Lloyd 鬆弛：每輪用精確多邊形重心更新站點位置（可選 power diagram 權重）
function lloyd(r, K, x0, y0, x1, y1, iters, opt){
  opt = opt || {}; const weighted = !!opt.weighted;
  let S = opt.sites || [...Array(K)].map(() => [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 0]);
  let P;
  for(let it = 0; it < iters; it++){ P = cells(S, x0, y0, x1, y1, weighted);
    S = P.map((poly, i) => { if(poly.length < 3) return S[i]; const c0 = centroid(poly); return [c0[0], c0[1], S[i][2]]; }); }
  P = cells(S, x0, y0, x1, y1, weighted);
  return { S, P };
}
// 像素法 Lloyd（大量點時效能較好，可帶密度權重）：回傳站點座標
function rasterLloyd(r, W, H, K, iters, density){
  const s = 3, n = Math.max(1, Math.ceil(W / s)), m = Math.max(1, Math.ceil(H / s));
  let S = [...Array(K)].map(() => [r() * n, r() * m]);
  const lab = new Int32Array(n * m);
  const assign = () => { for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ let b = 0, bd = 1e18;
    for(let k = 0; k < K; k++){ const d = (S[k][0] - i) ** 2 + (S[k][1] - j) ** 2; if(d < bd){ bd = d; b = k; } } lab[j * n + i] = b; } };
  for(let it = 0; it < iters; it++){ assign(); const acc = S.map(() => [0, 0, 0]);
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const w = density ? density(i * s, j * s) : 1, a = acc[lab[j * n + i]]; a[0] += i * w; a[1] += j * w; a[2] += w; }
    S = acc.map((a, k) => a[2] > 1e-6 ? [a[0] / a[2], a[1] / a[2]] : S[k]); }
  return { S: S.map(p => [p[0] * s, p[1] * s]) };
}
// Gabriel 圖近似 Delaunay 對偶邊（中點離第三點都不更近，判定 i–j 相鄰）
function dual(S){
  const E = [];
  for(let i = 0; i < S.length; i++) for(let j = i + 1; j < S.length; j++){
    const mx = (S[i][0] + S[j][0]) / 2, my = (S[i][1] + S[j][1]) / 2, d1 = Math.hypot(mx - S[i][0], my - S[i][1]);
    let ok = true;
    for(let k = 0; k < S.length; k++){ if(k === i || k === j) continue; if(Math.hypot(mx - S[k][0], my - S[k][1]) < d1 - .5){ ok = false; break; } }
    if(ok) E.push([i, j]);
  }
  return E;
}
// 等角投影
function iso(x, y, z, cx, cy, s){ return [cx + (x - y) * s * .87, cy + (x + y) * s * .5 - z * s]; }
// 凸多邊形向內縮（近似 offset，角度平分線方向）
function insetPoly(P, d){
  const n = P.length, C = centroid(P), out = [];
  for(let i = 0; i < n; i++){ const a = P[(i - 1 + n) % n], b = P[i], cc = P[(i + 1) % n];
    const e1 = norm2(b[0] - a[0], b[1] - a[1]), e2 = norm2(cc[0] - b[0], cc[1] - b[1]);
    let nx = e1[1] + e2[1], ny = -(e1[0] + e2[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    if((C[0] - b[0]) * nx + (C[1] - b[1]) * ny < 0){ nx = -nx; ny = -ny; }
    const cosH = Math.max(.35, Math.sqrt(Math.max(0, (1 + (e1[0] * e2[0] + e1[1] * e2[1])) / 2)));
    out.push([b[0] + nx * d / cosH, b[1] + ny * d / cosH]); }
  return out;
}
// 圓角多邊形路徑（未 fill／stroke，呼叫端自行決定）
function roundPath(g, P, rad){
  const n = P.length; g.beginPath();
  for(let i = 0; i < n; i++){ const cur = P[i], prev = P[(i - 1 + n) % n], next = P[(i + 1) % n];
    const d1 = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]) || 1, d2 = Math.hypot(next[0] - cur[0], next[1] - cur[1]) || 1, rr = Math.min(rad, d1 * .4, d2 * .4);
    const p1 = [cur[0] + (prev[0] - cur[0]) / d1 * rr, cur[1] + (prev[1] - cur[1]) / d1 * rr], p2 = [cur[0] + (next[0] - cur[0]) / d2 * rr, cur[1] + (next[1] - cur[1]) / d2 * rr];
    if(i === 0) g.moveTo(p1[0], p1[1]); else g.lineTo(p1[0], p1[1]);
    g.quadraticCurveTo(cur[0], cur[1], p2[0], p2[1]); }
  g.closePath();
}
// 不規則封閉輪廓（正弦疊加）
function blob(r, cx, cy, rx, ry, amp, n){
  n = n || 64; const ph = [r() * TAU, r() * TAU, r() * TAU], P = [];
  for(let i = 0; i < n; i++){ const a = i / n * TAU, k = 1 + amp * (.6 * Math.sin(2 * a + ph[0]) + .3 * Math.sin(3 * a + ph[1]) + .2 * Math.sin(5 * a + ph[2])); P.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return P;
}
// 色階（藍→青→黃→紅），性能／分析類卡片用
function heat(t){
  const S2 = [[40, 60, 140], [60, 170, 190], [240, 210, 80], [230, 70, 40]], u = Math.max(0, Math.min(.999, t)) * 3, i = u | 0, f = u - i;
  const cc = S2[i].map((v, k) => Math.round(v + (S2[i + 1][k] - v) * f)); return `rgb(${cc[0]},${cc[1]},${cc[2]})`;
}

// =================== 變形 ===================
// V01 密度圖加權 Lloyd：合成受光球體的明暗場 → 點描畫，暗處點密、亮處點疏
ART.var["E03"][0] = function(g, W, H, r, c){
  const m = Math.min(W, H), cx = W * .52, cy = H * .5, R0 = m * .42, L = norm2(-.5, -.6);
  const dens = (x, y) => { const dx = (x - cx) / R0, dy = (y - cy) / R0, d2 = dx * dx + dy * dy;
    if(d2 > 1.05) return .04; const z = Math.sqrt(Math.max(0, 1 - d2)), br = Math.max(0, dx * L[0] + dy * L[1] + z * .62); return 1 - clamp(br, 0, 1) * .85 + .06; };
  const { S } = rasterLloyd(r, W, H, 220, 3, dens);
  g.fillStyle = "rgba(255,255,255,.03)"; g.beginPath(); g.arc(cx, cy, R0, 0, TAU); g.fill();
  g.fillStyle = "#fff";
  S.forEach(([x, y]) => { const d = dens(x, y); g.globalAlpha = .55 + .45 * Math.min(1, d); g.beginPath(); g.arc(x, y, 1 + d * 1.6, 0, TAU); g.fill(); });
  g.globalAlpha = 1;
  g.strokeStyle = U.rgba(c, .5); g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R0, 0, TAU); g.stroke();
};
// V02 吸引子控制細胞大小：吸引點附近撒點較密 → Lloyd 鬆弛後細胞漸變大小
ART.var["E03"][1] = function(g, W, H, r, c){
  const m = Math.min(W, H), K = 44, A = [[W * (.3 + r() * .2), H * (.3 + r() * .2)]];
  if(r() > .4) A.push([W * (.65 + r() * .2), H * (.6 + r() * .2)]);
  const wF = (x, y) => 1 / (1 + Math.min(...A.map(a => Math.hypot(a[0] - x, a[1] - y))) / (m * .18));
  const S = []; for(let i = 0; i < K; i++){ let x = r() * W, y = r() * H; for(let t = 0; t < 12; t++){ x = r() * W; y = r() * H; if(r() < wF(x, y) * .9 + .1) break; } S.push([x, y, 0]); }
  const { S: S2, P } = lloyd(r, K, 0, 0, W, H, 4, { sites: S });
  const areas = P.map(p => { let a = 0; for(let i = 0; i < p.length; i++){ const q = p[i], n = p[(i + 1) % p.length]; a += q[0] * n[1] - n[0] * q[1]; } return Math.abs(a) / 2; });
  const maxA = Math.max(...areas, 1);
  P.forEach((poly, i) => { if(poly.length < 3) return; path(g, poly, true); g.fillStyle = U.rgba(c, .15 + .55 * (areas[i] / maxA)); g.fill(); g.strokeStyle = "rgba(255,255,255,.65)"; g.lineWidth = 1; g.stroke(); });
  A.forEach(a => { const R = m * .16, gr = g.createRadialGradient(a[0], a[1], 0, a[0], a[1], R); gr.addColorStop(0, U.rgba(ACC, .5)); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(a[0] - R, a[1] - R, 2 * R, 2 * R); g.beginPath(); g.arc(a[0], a[1], 3, 0, TAU); g.fillStyle = ACC; g.fill(); });
};
// V03 任意曲線邊界：Voronoi 只填滿基地輪廓（自由凹凸曲線）
ART.var["E03"][2] = function(g, W, H, r, c){
  const B = blob(r, W * .5, H * .52, W * .42, H * .4, .32, 80);
  const K = 36, { P } = lloyd(r, K, W * .05, H * .05, W * .95, H * .95, 4);
  g.save(); path(g, B, true); g.clip();
  g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(0, 0, W, H);
  P.forEach((poly, i) => { if(poly.length < 3) return; path(g, poly, true); g.fillStyle = U.rgba(c, .12 + (i * 37 % 10) / 10 * .4); g.fill(); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.stroke(); });
  g.restore();
  g.strokeStyle = "#fff"; g.lineWidth = 2; path(g, B, true); g.stroke();
};
// V04 Power diagram（加權 Voronoi）：每個站點帶半徑，分界線往小圓一側偏移
ART.var["E03"][3] = function(g, W, H, r, c){
  const K = 13, m = Math.min(W, H);
  const S = [...Array(K)].map(() => [W * .1 + r() * W * .8, H * .1 + r() * H * .8, m * (.04 + r() * .11)]);
  const { S: S2, P } = lloyd(r, K, 0, 0, W, H, 3, { weighted: true, sites: S });
  P.forEach((poly, i) => { if(poly.length < 3) return; path(g, poly, true); g.fillStyle = U.rgba(c, .1 + .5 * (S2[i][2] / (m * .15))); g.fill(); g.strokeStyle = "#16161C"; g.lineWidth = 2.4; g.stroke(); g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1; g.stroke(); });
  g.setLineDash([2, 2]); g.strokeStyle = U.rgba(ACC, .8); g.lineWidth = .8;
  S2.forEach(([x, y, rad]) => { g.beginPath(); g.arc(x, y, rad, 0, TAU); g.stroke(); }); g.setLineDash([]);
  g.fillStyle = "#fff"; S2.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); });
};
// V05 3D Voronoi（半空間切割）：等角視角的多面體泡沫堆疊
ART.var["E03"][4] = function(g, W, H, r, c){
  const K = 22, { S, P } = lloyd(r, K, 0, 0, 1, 1, 3), s = Math.min(W, H) * .62, cx = W * .5, cy = H * .3;
  const cellsD = P.map((poly, i) => { if(poly.length < 3) return null; return { poly, h: .12 + r() * .34, cx: S[i][0], cy: S[i][1] }; }).filter(Boolean);
  cellsD.sort((a, b) => (a.cy + a.cx) - (b.cy + b.cx));
  cellsD.forEach(o => { const top = o.poly.map(p => iso(p[0] - .5, p[1] - .5, o.h, cx, cy, s)), bot = o.poly.map(p => iso(p[0] - .5, p[1] - .5, 0, cx, cy, s));
    for(let i = 0; i < o.poly.length; i++){ const j = (i + 1) % o.poly.length, shade = .25 + .35 * (i % 3 / 3);
      path(g, [bot[i], bot[j], top[j], top[i]], true); g.fillStyle = U.rgba(c, shade); g.fill(); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = .6; g.stroke(); }
    path(g, top, true); g.fillStyle = U.rgba(c, .55 + o.h * .5); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = .8; g.stroke(); });
};
// V06 曲面上的 Voronoi：uv 參數面做 Lloyd，再映射到自由曲面殼體
ART.var["E03"][5] = function(g, W, H, r, c){
  const K = 30, { P } = lloyd(r, K, 0, 0, 1, 1, 3), ph = r() * TAU, m = Math.min(W, H);
  const surf = (u, v) => { const x = (u - .5) * 2.2, y = (v - .5) * 2.2; return [x, y, .34 * Math.sin(x * 2.4 + ph) * Math.cos(y * 1.8 - ph * .5)]; };
  const yaw = .5, pitch = .6, cy_ = Math.cos(yaw), sy_ = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const camP = p => { const x = p[0] * cy_ - p[1] * sy_, y = p[0] * sy_ + p[1] * cy_, z = p[2], d = -y * cp + z * sp, ss = -(y * sp + z * cp), f = 5 / (5 - d);
    return [W / 2 + x * m * .36 * f, H * .55 + ss * m * .36 * f, d]; };
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = .6;
  for(let i = 0; i <= 10; i++) { path(g, [...Array(21)].map((_, j) => camP(surf(i / 10, j / 20))), false); g.stroke(); }
  const cellsD = P.map(poly => { if(poly.length < 3) return null; const pts = poly.map(p => camP(surf(p[0], p[1]))); const d = pts.reduce((s, p) => s + p[2], 0) / pts.length; return { pts, d }; }).filter(Boolean);
  cellsD.sort((a, b) => a.d - b.d).forEach(o => { path(g, o.pts, true); g.fillStyle = U.rgba(c, .2 + .5 * ((o.d + 1) / 2)); g.fill(); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = .8; g.stroke(); });
};
// V07 收斂判斷與停止條件：逐輪移動量下降曲線，收斂後停止（下方小圖為最終格局）
ART.var["E03"][6] = function(g, W, H, r, c){
  const K = 26, iters = 9; let S = [...Array(K)].map(() => [r(), r(), 0]); const moves = [];
  for(let it = 0; it < iters; it++){ const P = cells(S, 0, 0, 1, 1, false); let mv = 0;
    const S2 = P.map((poly, i) => { if(poly.length < 3) return S[i]; const c0 = centroid(poly); mv += Math.hypot(c0[0] - S[i][0], c0[1] - S[i][1]); return [c0[0], c0[1], 0]; });
    moves.push(mv); S = S2; }
  const m = Math.min(W, H), cx0 = m * .1, cy0 = H * .12, cw = W * .8, ch = H * .42, maxMv = Math.max(...moves);
  const stopIt = moves.findIndex(v => v < maxMv * .06);
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx0, cy0); g.lineTo(cx0, cy0 + ch); g.lineTo(cx0 + cw, cy0 + ch); g.stroke();
  g.strokeStyle = c; g.lineWidth = 2; path(g, moves.map((v, i) => [cx0 + cw * i / (iters - 1), cy0 + ch * (1 - v / maxMv)]), false); g.stroke();
  moves.forEach((v, i) => { const x = cx0 + cw * i / (iters - 1), y = cy0 + ch * (1 - v / maxMv); g.beginPath(); g.arc(x, y, 2.2, 0, TAU); g.fillStyle = (stopIt >= 0 && i >= stopIt) ? ACC : c; g.fill(); });
  if(stopIt >= 0){ const x = cx0 + cw * stopIt / (iters - 1); g.strokeStyle = U.rgba(ACC, .7); g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x, cy0); g.lineTo(x, cy0 + ch); g.stroke(); g.setLineDash([]); }
  const by = cy0 + ch + H * .1, bs = Math.min(cw, H * .32), P2 = cells(S, 0, 0, 1, 1, false);
  P2.forEach(poly => { if(poly.length < 3) return; path(g, poly.map(p => [cx0 + p[0] * bs, by + p[1] * bs]), true); g.fillStyle = U.rgba(c, .18); g.fill(); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = .8; g.stroke(); });
};
// V08 Timer 動畫化鬆弛過程：疊出多個影格的殘影，從亂到穩定
ART.var["E03"][7] = function(g, W, H, r, c){
  const K = 24; let S = [...Array(K)].map(() => [r(), r(), 0]); const frames = [];
  for(let it = 0; it < 6; it++){ const P = cells(S, 0, 0, 1, 1, false); frames.push(P); S = P.map((poly, i) => poly.length >= 3 ? [...centroid(poly), 0] : S[i]); }
  const m = Math.min(W, H);
  frames.forEach((P, fi) => { const a = (fi + 1) / frames.length, last = fi === frames.length - 1;
    P.forEach(poly => { if(poly.length < 3) return; path(g, poly.map(p => [p[0] * W, p[1] * H]), true); g.strokeStyle = last ? U.rgba("#ffffff", .15 + .55 * a) : U.rgba(c, .15 + .55 * a); g.lineWidth = last ? 1.6 : .8; g.stroke(); }); });
  const by = H - m * .08, bx = m * .12, bw = W - m * .24;
  g.fillStyle = "rgba(255,255,255,.2)"; g.fillRect(bx, by - 1.5, bw, 3); g.fillStyle = ACC; g.fillRect(bx, by - 1.5, bw * .8, 3);
  g.beginPath(); g.arc(bx + bw * .8, by, 4, 0, TAU); g.fillStyle = "#fff"; g.fill();
};
// V09 細胞縮孔與圓角：可雷切／CNC 的穿孔板圖樣
ART.var["E03"][8] = function(g, W, H, r, c){
  const K = 30, { P } = lloyd(r, K, W * .06, H * .06, W * .94, H * .94, 4), m = Math.min(W, H), gap = m * .018, rad = m * .02;
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2; g.strokeRect(W * .04, H * .04, W * .92, H * .92);
  P.forEach(poly => { if(poly.length < 4) return; const ins = insetPoly(poly, gap);
    roundPath(g, ins, rad); g.fillStyle = "#15151A"; g.fill(); g.strokeStyle = c; g.lineWidth = 1.2; g.stroke(); });
  g.setLineDash([3, 3]); g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(W * .02, H * .02, W * .96, H * .96); g.setLineDash([]);
};
// V10 Delaunay 對偶網路：切割時記錄的鄰接關係連成三角網，與細胞邊並列
ART.var["E03"][9] = function(g, W, H, r, c){
  const K = 22, { S, P } = lloyd(r, K, W * .08, H * .08, W * .92, H * .92, 3);
  P.forEach(poly => { if(poly.length < 3) return; path(g, poly, true); g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1; g.stroke(); });
  const E = dual(S);
  g.strokeStyle = U.rgba(ACC, .85); g.lineWidth = 1.6;
  E.forEach(([i, j]) => { g.beginPath(); g.moveTo(S[i][0], S[i][1]); g.lineTo(S[j][0], S[j][1]); g.stroke(); });
  g.fillStyle = c; S.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); });
};
// V11 細胞長高成 3D 量體：依到吸引點距離擠出高度的蜂巢城市量體（留出街道縫隙）
ART.var["E03"][10] = function(g, W, H, r, c){
  const K = 24, { S, P } = lloyd(r, K, 0, 0, 1, 1, 3), s = Math.min(W, H) * .6, cx = W * .5, cy = H * .18;
  const at = [.5 + (r() - .5) * .3, .5 + (r() - .5) * .3];
  const gp = [[0, 0], [1, 0], [1, 1], [0, 1]].map(p => iso(p[0] - .5, p[1] - .5, 0, cx, cy, s));
  path(g, gp, true); g.fillStyle = "rgba(255,255,255,.03)"; g.fill(); g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = .6; g.stroke();
  const cellsD = P.map((poly, i) => { if(poly.length < 3) return null; const ins = insetPoly(poly, .012); const d = Math.hypot(S[i][0] - at[0], S[i][1] - at[1]);
    return { poly: ins, h: .05 + (1 - Math.min(1, d / .6)) * .42, cx: S[i][0], cy: S[i][1] }; }).filter(Boolean);
  cellsD.sort((a, b) => (a.cy + a.cx) - (b.cy + b.cx));
  cellsD.forEach(o => { const top = o.poly.map(p => iso(p[0] - .5, p[1] - .5, o.h, cx, cy, s)), bot = o.poly.map(p => iso(p[0] - .5, p[1] - .5, 0, cx, cy, s));
    for(let i = 0; i < o.poly.length; i++){ const j = (i + 1) % o.poly.length; path(g, [bot[i], bot[j], top[j], top[i]], true); g.fillStyle = U.rgba(c, .3); g.fill(); g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = .5; g.stroke(); }
    path(g, top, true); g.fillStyle = U.rgba(c, .75); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = .8; g.stroke(); });
};
// V12 與 Circle Packing／Boids 混合：細胞依流場方向拉長，疏密仍由鬆弛控制
ART.var["E03"][11] = function(g, W, H, r, c){
  const K = 30, { S, P } = lloyd(r, K, 0, 0, W, H, 3), nz = U.vnoise((r() * 1e6) | 0), sc = .006;
  P.forEach((poly, i) => { if(poly.length < 3) return; const cx0 = S[i][0], cy0 = S[i][1], ang = nz(cx0 * sc, cy0 * sc) * TAU * 1.4, ex = 1.55, ey = .65, ca = Math.cos(ang), sa = Math.sin(ang);
    const warped = poly.map(p => { const dx = p[0] - cx0, dy = p[1] - cy0, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca; return [cx0 + lx * ex * ca - ly * ey * sa, cy0 + lx * ex * sa + ly * ey * ca]; });
    path(g, warped, true); g.fillStyle = U.rgba(c, .16 + (i * 53 % 10) / 10 * .35); g.fill(); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.stroke(); });
  g.strokeStyle = U.rgba(ACC, .55); g.lineWidth = 1;
  for(let k = 0; k < 8; k++){ let x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); for(let t = 0; t < 24; t++){ const a = nz(x * sc, y * sc) * TAU * 1.4; x += Math.cos(a) * 6; y += Math.sin(a) * 6; g.lineTo(x, y); } g.stroke(); }
};
// V13 k-means 面板分群：曲面網格依四邊形特徵（邊長、翹曲）分成少數群組（模具類型）
ART.var["E03"][12] = function(g, W, H, r, c){
  const nu = 9, nv = 7, ph = r() * TAU, m = Math.min(W, H);
  const surf = (u, v) => { const x = (u - .5) * 2.3, y = (v - .5) * 1.7; return [x, y, .3 * Math.sin(x * 1.8 + ph) + .15 * Math.cos(y * 2.4)]; };
  const yaw = .5, pitch = .55, cy_ = Math.cos(yaw), sy_ = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const camP = p => { const x = p[0] * cy_ - p[1] * sy_, y = p[0] * sy_ + p[1] * cy_, z = p[2], d = -y * cp + z * sp, ss = -(y * sp + z * cp), f = 5 / (5 - d); return [W / 2 + x * m * .34 * f, H * .5 + ss * m * .34 * f]; };
  const V = []; for(let j = 0; j <= nv; j++) for(let i = 0; i <= nu; i++) V.push(surf(i / nu, j / nv));
  const quads = [];
  for(let j = 0; j < nv; j++) for(let i = 0; i < nu; i++){ const a = j * (nu + 1) + i, b = a + 1, cc = a + nu + 1, d = cc + 1;
    const A = V[a], B = V[b], C = V[d], D = V[cc], len = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    const feat = [len(A, B), len(B, C), len(C, D), len(D, A)], avg = feat.reduce((s, v) => s + v, 0) / 4, warp = Math.max(...feat) - Math.min(...feat);
    quads.push({ pts: [A, B, C, D], avg, warp }); }
  const K = 4; let cen = [...Array(K)].map((_, i) => quads[Math.floor(i * quads.length / K)]).map(q => [q.avg, q.warp]);
  let assign = quads.map(() => 0);
  for(let it = 0; it < 5; it++){ assign = quads.map(q => { let b = 0, bd = 1e9; cen.forEach((cc, k) => { const d = (q.avg - cc[0]) ** 2 + (q.warp - cc[1]) ** 2 * 4; if(d < bd){ bd = d; b = k; } }); return b; });
    cen = cen.map((cc, k) => { const grp = quads.filter((q, i) => assign[i] === k); if(!grp.length) return cc; return [grp.reduce((s, q) => s + q.avg, 0) / grp.length, grp.reduce((s, q) => s + q.warp, 0) / grp.length]; }); }
  const palette = [c, "#ffffff", ACC, "#5b6472"];
  quads.map((q, i) => ({ ...q, i })).sort((a, b) => (a.pts[0][2] + a.pts[2][2]) - (b.pts[0][2] + b.pts[2][2])).forEach(q => {
    const pts = q.pts.map(camP); path(g, pts, true); g.fillStyle = U.rgba(palette[assign[q.i]], .6); g.fill(); g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = .5; g.stroke(); });
};

// =================== 無照片案例 ===================
// E03-01 北京國家游泳中心（水立方）：兩點透視量體，立面貼滿不規則多面體氣枕
ART.case["E03-01"] = function(g, W, H, r, c){
  const hz = H * .6, vl = [-W * .6, hz], vr = [W * 1.7, hz], cx = W * .4, top = H * .16, bot = H * .8;
  const at = (vp, t, y) => [cx + (vp[0] - cx) * t, y + (vp[1] - y) * t];
  const face = (vp, tt) => (u, v) => { const a = at(vp, u * tt, top), b = at(vp, u * tt, bot); return [a[0], a[1] + (b[1] - a[1]) * v]; };
  const FL = face(vl, .42), FR = face(vr, .22);
  g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(0, hz, W, H - hz);
  [[FL, .8], [FR, 1]].forEach(([F, br]) => {
    const K = 40, { P } = lloyd(r, K, 0, 0, 1, 1, 3);
    P.forEach(poly => { if(poly.length < 3) return; const pts = poly.map(p => F(p[0], p[1]));
      path(g, pts, true); g.fillStyle = `rgba(140,180,210,${.2 * br})`; g.fill();
      const cxy = centroid(poly), shr = poly.map(p => [cxy[0] + (p[0] - cxy[0]) * .82, cxy[1] + (p[1] - cxy[1]) * .82]).map(p => F(p[0], p[1]));
      path(g, shr, true); g.fillStyle = U.rgba(c, (.2 + .35 * r()) * br); g.fill(); g.strokeStyle = `rgba(255,255,255,${.55 * br})`; g.lineWidth = .7; g.stroke(); });
    const o = [F(0, 0), F(1, 0), F(1, 1), F(0, 1)]; g.strokeStyle = "#fff"; g.lineWidth = 1.4; path(g, o, true); g.stroke();
  });
  g.strokeStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.moveTo(0, bot); g.lineTo(W, bot); g.stroke();
};
ART.case["E03-01"].ratio = .82;

// E03-02 On the Disappearance of Clouds：懸浮的泡沫多面體叢集雕塑（威尼斯雙年展）
ART.case["E03-02"] = function(g, W, H, r, c){
  const K = 20, { S, P } = lloyd(r, K, 0, 0, 1, 1, 3), s = Math.min(W, H) * .5, cx = W * .5, cy = H * .4;
  const cellsD = P.map((poly, i) => { if(poly.length < 3) return null; return { poly, h: .1 + r() * .3, cx: S[i][0], cy: S[i][1] }; }).filter(Boolean);
  cellsD.sort((a, b) => (a.cy + a.cx) - (b.cy + b.cx));
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = .7;
  [[.15, .1], [.85, .15], [.5, .05]].forEach(([u, v]) => { const p = iso(u - .5, v - .5, .5, cx, cy, s); g.beginPath(); g.moveTo(p[0], H * .02); g.lineTo(p[0], p[1]); g.stroke(); });
  cellsD.forEach(o => { const top = o.poly.map(p => iso(p[0] - .5, p[1] - .5, o.h, cx, cy, s)), bot = o.poly.map(p => iso(p[0] - .5, p[1] - .5, 0, cx, cy, s));
    for(let i = 0; i < o.poly.length; i++){ const j = (i + 1) % o.poly.length; path(g, [bot[i], bot[j], top[j], top[i]], true); g.fillStyle = U.rgba(c, .28); g.fill(); g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = .5; g.stroke(); }
    path(g, top, true); g.fillStyle = U.rgba(c, .6); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = .7; g.stroke(); });
  g.save(); g.translate(0, H * 1.5); g.scale(1, -1); g.globalAlpha = .15;
  cellsD.forEach(o => { const top = o.poly.map(p => iso(p[0] - .5, p[1] - .5, o.h, cx, cy, s)); path(g, top, true); g.fillStyle = c; g.fill(); });
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.15)"; g.beginPath(); g.moveTo(0, H * .86); g.lineTo(W, H * .86); g.stroke();
};
ART.case["E03-02"].ratio = 1.1;

// E03-03 Let's Join：Weaire-Phelan 空間鑲嵌展亭，平面多面體近似的半球殼體
ART.case["E03-03"] = function(g, W, H, r, c){
  const K = 28, { P } = lloyd(r, K, 0, 0, 1, 1, 3), m = Math.min(W, H);
  const dome = (u, v) => { const th = u * TAU, ph = v * (Math.PI / 2) * .92; return [Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)]; };
  const camP = p => [W * .5 + p[0] * m * .4, H * .62 - p[2] * m * .4 + p[1] * m * .12];
  g.strokeStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.moveTo(0, H * .86); g.lineTo(W, H * .86); g.stroke();
  const cellsD = P.map(poly => { if(poly.length < 3) return null; const P3 = poly.map(p => dome(p[0], p[1])); const pts = P3.map(camP); const dep = P3.reduce((s, p) => s + p[1], 0); return { pts, dep }; }).filter(Boolean);
  cellsD.sort((a, b) => a.dep - b.dep).forEach(o => { path(g, o.pts, true); g.fillStyle = U.rgba(c, .22 + .35 * (o.dep / K + .5)); g.fill(); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; g.stroke(); });
  g.fillStyle = "#0e0e12"; g.beginPath(); g.moveTo(W * .42, H * .86); g.lineTo(W * .42, H * .64); g.lineTo(W * .58, H * .64); g.lineTo(W * .58, H * .86); g.fill();
};
ART.case["E03-03"].ratio = 1.05;

// E03-04 Voronoi Shelf：大理石層架，CNC 銑削出的 Voronoi 格架（正面物件圖）
ART.case["E03-04"] = function(g, W, H, r, c){
  const ox = W * .12, oy = H * .15, ow = W * .76, oh = H * .7;
  const grad = g.createLinearGradient(ox, oy, ox + ow, oy + oh); grad.addColorStop(0, "#EDEAE4"); grad.addColorStop(1, "#C9C4BC");
  g.fillStyle = grad; g.fillRect(ox, oy, ow, oh);
  g.strokeStyle = "rgba(120,120,120,.25)"; g.lineWidth = .6;
  for(let i = 0; i < 6; i++){ let x = ox + r() * ow, y = oy; g.beginPath(); g.moveTo(x, y); for(let t = 0; t < 20; t++){ x += (r() - .5) * ow * .08; y += oh / 20; g.lineTo(x, y); } g.stroke(); }
  const K = 20, { P } = lloyd(r, K, ox + ow * .05, oy + oh * .05, ox + ow * .95, oy + oh * .95, 4);
  P.forEach(poly => { if(poly.length < 4) return; const cxy = centroid(poly), hole = poly.map(p => [cxy[0] + (p[0] - cxy[0]) * .78, cxy[1] + (p[1] - cxy[1]) * .78]);
    roundPath(g, hole, Math.min(W, H) * .012); g.fillStyle = "#141419"; g.fill(); });
  g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 2; g.strokeRect(ox, oy, ow, oh);
  g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(ox, oy + oh, ow, H * .02);
};
ART.case["E03-04"].ratio = .9;

// E03-05 Radiolaria 首飾：圓形墜飾，細胞圖樣沿半徑漸變（放射蟲靈感）
ART.case["E03-05"] = function(g, W, H, r, c){
  const m = Math.min(W, H), cx = W * .5, cy = H * .55, R0 = m * .36;
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.4; g.beginPath(); g.arc(cx, cy - R0 - m * .06, m * .035, 0, TAU); g.stroke();
  g.beginPath(); g.moveTo(cx, cy - R0 - m * .024); g.lineTo(cx, cy - R0); g.stroke();
  g.save(); g.beginPath(); g.arc(cx, cy, R0, 0, TAU); g.clip();
  g.fillStyle = "#171720"; g.fillRect(cx - R0, cy - R0, 2 * R0, 2 * R0);
  const K = 80, { S, P } = lloyd(r, K, cx - R0, cy - R0, cx + R0, cy + R0, 3);
  P.forEach((poly, i) => { if(poly.length < 3) return; const d = Math.hypot(S[i][0] - cx, S[i][1] - cy) / R0, ins = insetPoly(poly, m * .006 * (1 - d * .5));
    path(g, ins, true); g.fillStyle = U.rgba(c, .25 + .5 * (1 - d)); g.fill(); g.strokeStyle = `rgba(255,255,255,${.3 + .4 * (1 - d)})`; g.lineWidth = .8; g.stroke(); });
  g.restore();
  g.strokeStyle = "#fff"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R0, 0, TAU); g.stroke();
};
ART.case["E03-05"].ratio = 1.15;

// E03-06 Voronoi Wall：3D 列印混凝土構件牆，每塊形狀各不相同、留有植栽孔
ART.case["E03-06"] = function(g, W, H, r, c){
  const K = 18, { P } = lloyd(r, K, W * .05, H * .08, W * .95, H * .92, 4), m = Math.min(W, H);
  P.forEach(poly => { if(poly.length < 4) return; const ins = insetPoly(poly, m * .012);
    roundPath(g, ins, m * .01); g.fillStyle = "#B9B2A6"; g.fill(); g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 1; g.stroke();
    const cxy = centroid(ins); g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = .6;
    for(let k = 1; k < 4; k++){ const sc = k / 4; path(g, ins.map(p => [cxy[0] + (p[0] - cxy[0]) * sc, cxy[1] + (p[1] - cxy[1]) * sc]), true); g.stroke(); }
    if(r() < .6){ g.beginPath(); g.arc(cxy[0], cxy[1], m * .018 + r() * m * .012, 0, TAU); g.fillStyle = "#1c2a1c"; g.fill(); g.strokeStyle = U.rgba(c, .7); g.lineWidth = 1; g.stroke(); } });
};
ART.case["E03-06"].ratio = 1.2;

// E03-07 Adaptive Voronoi Facade：立面開孔依光線強度分析著色，構件會動態調整
ART.case["E03-07"] = function(g, W, H, r, c){
  const K = 34, { S, P } = lloyd(r, K, W * .06, H * .06, W * .94, H * .94, 4), m = Math.min(W, H), sun = [W * .85, H * .1];
  P.forEach((poly, i) => { if(poly.length < 3) return; const t = 1 - Math.min(1, Math.hypot(S[i][0] - sun[0], S[i][1] - sun[1]) / (m * .9));
    path(g, poly, true); g.fillStyle = heat(t); g.globalAlpha = .85; g.fill(); g.globalAlpha = 1; g.strokeStyle = "#16161C"; g.lineWidth = 1.4; g.stroke();
    const cxy = centroid(poly), ang = t * Math.PI * .4; g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(cxy[0], cxy[1]); g.lineTo(cxy[0] + Math.cos(ang) * m * .025, cxy[1] + Math.sin(ang) * m * .025); g.stroke(); });
  g.beginPath(); g.arc(sun[0], sun[1], m * .03, 0, TAU); g.fillStyle = "#FFD86B"; g.fill();
};
ART.case["E03-07"].ratio = 1.15;

// E03-08 Upsilon Pavilion：Voronoi 細胞邊作為木梁的殼體展亭（結構線稿）
ART.case["E03-08"] = function(g, W, H, r, c){
  const K = 30, { P } = lloyd(r, K, 0, 0, 1, 1, 3), m = Math.min(W, H);
  const dome = (u, v) => { const th = u * TAU, ph = v * (Math.PI / 2) * .9; return [Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)]; };
  const camP = p => [W * .5 + p[0] * m * .42, H * .68 - p[2] * m * .42 + p[1] * m * .1];
  g.strokeStyle = "rgba(255,255,255,.15)"; g.beginPath(); g.moveTo(0, H * .9); g.lineTo(W, H * .9); g.stroke();
  const edgesD = [];
  P.forEach(poly => { if(poly.length < 3) return; const P3 = poly.map(p => dome(p[0], p[1]));
    for(let i = 0; i < P3.length; i++){ const a = P3[i], b = P3[(i + 1) % P3.length]; edgesD.push({ a: camP(a), b: camP(b), dep: a[1] + b[1] }); } });
  edgesD.sort((x, y) => x.dep - y.dep).forEach(e => { g.strokeStyle = `rgba(180,130,80,${.5 + .4 * (e.dep / 2 + .5)})`; g.lineWidth = 2.2; g.beginPath(); g.moveTo(e.a[0], e.a[1]); g.lineTo(e.b[0], e.b[1]); g.stroke(); });
};
ART.case["E03-08"].ratio = 1.1;

// E03-09 Weighted Voronoi Stippling：灰階影像密度驅動的點描畫（經典論文示範）
ART.case["E03-09"] = function(g, W, H, r, c){
  const B = blob(r, W * .5, H * .48, W * .32, H * .36, .18, 60);
  const dens = (x, y) => { if(!pip(B, x, y)) return .03; const t = (y - (H * .48 - H * .36)) / (H * .72); return .12 + .85 * clamp(t, 0, 1); };
  const { S } = rasterLloyd(r, W, H, 240, 3, dens);
  g.fillStyle = "#fff";
  S.forEach(([x, y]) => { if(!pip(B, x, y)) return; const d = dens(x, y); g.globalAlpha = .5 + .5 * d; g.beginPath(); g.arc(x, y, .8 + d * 1.4, 0, TAU); g.fill(); });
  g.globalAlpha = 1; g.strokeStyle = U.rgba(c, .4); g.lineWidth = 1; path(g, B, true); g.stroke();
};
ART.case["E03-09"].ratio = 1.05;

// E03-10 多層級 Voronoi 晶格骨支架：積層製造的仿骨晶格柱狀構件（剖面透視）
ART.case["E03-10"] = function(g, W, H, r, c){
  const m = Math.min(W, H), cx = W * .5, cyTop = H * .12, cyBot = H * .86, rx = m * .28;
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.6;
  g.beginPath(); g.ellipse(cx, cyBot, rx, rx * .28, 0, 0, TAU); g.stroke();
  g.beginPath(); g.moveTo(cx - rx, cyTop); g.lineTo(cx - rx, cyBot); g.moveTo(cx + rx, cyTop); g.lineTo(cx + rx, cyBot); g.stroke();
  g.beginPath(); g.ellipse(cx, cyTop, rx, rx * .28, 0, 0, TAU); g.fillStyle = "#1a1a22"; g.fill(); g.stroke();
  g.save(); g.beginPath(); g.moveTo(cx - rx, cyTop); g.ellipse(cx, cyTop, rx, rx * .28, 0, Math.PI, 0, true); g.lineTo(cx + rx, cyBot); g.ellipse(cx, cyBot, rx, rx * .28, 0, 0, Math.PI); g.closePath(); g.clip();
  g.fillStyle = "#232330"; g.fillRect(cx - rx, cyTop, 2 * rx, cyBot - cyTop);
  const K = 60, { S, P } = lloyd(r, K, cx - rx, cyTop, cx + rx, cyBot, 3);
  P.forEach((poly, i) => { if(poly.length < 3) return; const edgeD = Math.min(S[i][0] - (cx - rx), (cx + rx) - S[i][0]) / rx, ins = insetPoly(poly, m * .004 * (.4 + edgeD));
    path(g, ins, true); g.fillStyle = U.rgba(c, .2 + .4 * (1 - edgeD)); g.fill(); g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = .7; g.stroke(); });
  g.restore();
};
ART.case["E03-10"].ratio = 1.3;

// E03-11 Voronoi 多孔晶格參數化設計：可調孔隙率的建模介面感（線框＋控制節點）
ART.case["E03-11"] = function(g, W, H, r, c){
  const K = 26, { S, P } = lloyd(r, K, W * .08, H * .08, W * .92, H * .92, 4), m = Math.min(W, H);
  P.forEach(poly => { if(poly.length < 3) return; path(g, poly, true); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.stroke();
    const ins = insetPoly(poly, m * .03); path(g, ins, true); g.strokeStyle = U.rgba(c, .6); g.lineWidth = .8; g.stroke(); });
  [[.25, .2], [.7, .75]].forEach(([u, v]) => { const x = W * u, y = H * v, rr = m * .045;
    g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fillStyle = "rgba(20,20,26,.9)"; g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.4; g.stroke();
    const a = -Math.PI / 2 + r() * 1.3; g.strokeStyle = U.rgba(c, .9); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * rr * .7, y + Math.sin(a) * rr * .7); g.stroke();
    g.beginPath(); g.arc(x, y, rr * 1.35, -Math.PI / 2, a, false); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.4; g.stroke(); });
  g.fillStyle = "#fff"; S.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 1.5, 0, TAU); g.fill(); });
};
ART.case["E03-11"].ratio = 1;

// E03-12 Differentiable Voronoi 拓樸最佳化：懸臂構件內以應力色階呈現細胞分布，箭頭示意點位移動方向
ART.case["E03-12"] = function(g, W, H, r, c){
  const m = Math.min(W, H), x0 = W * .08, y0 = H * .35, x1 = W * .92, y1 = H * .65;
  g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const K = 44, { S, P } = lloyd(r, K, x0, y0, x1, y1, 3);
  P.forEach((poly, i) => { if(poly.length < 3) return; const t = 1 - Math.min(1, (S[i][0] - x0) / (x1 - x0));
    path(g, poly, true); g.fillStyle = heat(t * .9 + .05); g.fill(); g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = .8; g.stroke(); });
  g.restore();
  g.strokeStyle = "#fff"; g.lineWidth = 2; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
  g.fillStyle = "rgba(255,255,255,.6)"; for(let i = 0; i < 5; i++){ const yy = y0 + (y1 - y0) * i / 4; g.beginPath(); g.moveTo(x0 - 6, yy); g.lineTo(x0, yy - (y1 - y0) / 8); g.lineTo(x0, yy + (y1 - y0) / 8); g.fill(); }
  g.strokeStyle = U.rgba(ACC, .9); g.lineWidth = 1.3;
  S.slice(0, 10).forEach(([x, y]) => { const dx = (x1 - x) * .03; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y); g.lineTo(x + dx - 3, y - 2); g.moveTo(x + dx, y); g.lineTo(x + dx - 3, y + 2); g.stroke(); });
};
ART.case["E03-12"].ratio = .78;

// E03-13 PowerDiagrams：GH 加權 Voronoi 外掛，元件方塊＋輸出圖形（含最小生成樹）
ART.case["E03-13"] = function(g, W, H, r, c){
  const m = Math.min(W, H), bx = W * .06, by = H * .38, bw = W * .24, bh = H * .24;
  g.fillStyle = "#2a2a34"; g.fillRect(bx, by, bw, bh); g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.strokeRect(bx, by, bw, bh);
  [.25, .5, .75].forEach(t => { g.beginPath(); g.arc(bx, by + bh * t, 4, 0, TAU); g.fillStyle = c; g.fill(); g.beginPath(); g.arc(bx + bw, by + bh * t, 4, 0, TAU); g.fillStyle = U.rgba(c, .6); g.fill(); });
  const ox = W * .42, oy = H * .1, ow = W * .5, oh = H * .8;
  const K = 16, S = [...Array(K)].map(() => [ox + r() * ow, oy + r() * oh, m * (.02 + r() * .05)]);
  const { S: S2, P } = lloyd(r, K, ox, oy, ox + ow, oy + oh, 3, { weighted: true, sites: S });
  P.forEach((poly, i) => { if(poly.length < 3) return; path(g, poly, true); g.fillStyle = U.rgba(c, .15 + .4 * (S2[i][2] / (m * .07))); g.fill(); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; g.stroke(); });
  const E = dual(S2); g.setLineDash([2, 2]); g.strokeStyle = U.rgba(ACC, .8); g.lineWidth = 1;
  E.forEach(([i, j]) => { g.beginPath(); g.moveTo(S2[i][0], S2[i][1]); g.lineTo(S2[j][0], S2[j][1]); g.stroke(); }); g.setLineDash([]);
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.beginPath(); g.moveTo(bx + bw, by + bh * .5); g.lineTo(ox, oy + oh * .5); g.stroke();
};
ART.case["E03-13"].ratio = .85;

// E03-14 Qena 市公共服務空間規劃：城市街廓上以 Voronoi 劃分設施服務範圍，標出覆蓋不足區
ART.case["E03-14"] = function(g, W, H, r, c){
  const m = Math.min(W, H);
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1;
  for(let i = 1; i < 9; i++){ g.beginPath(); g.moveTo(W * i / 9, 0); g.lineTo(W * i / 9, H); g.stroke(); }
  for(let j = 1; j < 7; j++){ g.beginPath(); g.moveTo(0, H * j / 7); g.lineTo(W, H * j / 7); g.stroke(); }
  const K = 9, { S, P } = lloyd(r, K, W * .06, H * .06, W * .94, H * .94, 3), gapIdx = (r() * K) | 0;
  P.forEach((poly, i) => { if(poly.length < 3) return; path(g, poly, true); g.fillStyle = i === gapIdx ? "rgba(230,80,60,.18)" : U.rgba(c, .12 + (i * 29 % 10) / 10 * .18); g.fill();
    g.strokeStyle = i === gapIdx ? "rgba(230,80,60,.9)" : "rgba(255,255,255,.35)"; g.lineWidth = i === gapIdx ? 1.8 : 1; g.stroke(); });
  S.forEach(([x, y], i) => { g.beginPath(); g.arc(x, y, i === gapIdx ? 3 : 4.5, 0, TAU); g.fillStyle = i === gapIdx ? "rgba(255,255,255,.35)" : "#fff"; g.fill(); });
  const gp = S[gapIdx]; g.strokeStyle = "rgba(230,80,60,.9)"; g.setLineDash([3, 3]); g.lineWidth = 1.4;
  g.beginPath(); g.arc(gp[0], gp[1], m * .16, 0, TAU); g.stroke(); g.setLineDash([]);
};
ART.case["E03-14"].ratio = 1;

// E03-15 景觀生成式設計：廣場鋪面以 Voronoi 分割，部分細胞轉為植栽分區
ART.case["E03-15"] = function(g, W, H, r, c){
  const B = blob(r, W * .5, H * .5, W * .44, H * .42, .26, 70), K = 40, { P } = lloyd(r, K, W * .04, H * .04, W * .96, H * .96, 4);
  g.save(); path(g, B, true); g.clip();
  g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(0, 0, W, H);
  P.forEach((poly, i) => { if(poly.length < 3) return; const planting = i % 3 === 0;
    path(g, poly, true); g.fillStyle = planting ? "rgba(70,140,80,.5)" : U.rgba(c, .12 + (i * 41 % 10) / 10 * .16); g.fill();
    g.strokeStyle = planting ? "rgba(140,200,120,.6)" : "rgba(255,255,255,.35)"; g.lineWidth = 1; g.stroke(); });
  g.restore();
  g.strokeStyle = "#fff"; g.lineWidth = 1.8; path(g, B, true); g.stroke();
};
ART.case["E03-15"].ratio = 1.15;
})();
