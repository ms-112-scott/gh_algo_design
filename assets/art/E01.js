/* E01 Circle Packing：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
const TAU = Math.PI * 2, ACC = "#F2C14E", INK = "#23232B", PAPER = "#EFE9DC";

// ---------- 共用小工具 ----------
function circ(g, x, y, R){ g.beginPath(); g.arc(x, y, Math.max(.2, R), 0, TAU); }
function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
// 貪婪試放：隨機位置試放，半徑取「上限、邊界距離、與既有圓的間距」三者最小
function pack(r, o){
  const C = [], n = o.n || 400, tries = o.tries || 4000, minR = o.minR || 1.5, gap = o.gap == null ? 1 : o.gap;
  const x0 = o.x0 || 0, y0 = o.y0 || 0;
  for(let t = 0; t < tries && C.length < n; t++){
    const x = x0 + r()*o.w, y = y0 + r()*o.h;
    let R = o.maxR(x, y, t/tries);
    if(o.edge){ const b = o.edge(x, y); if(b < minR) continue; R = Math.min(R, b); }
    if(R < minR) continue;
    for(const q of C){ const d = Math.hypot(q[0]-x, q[1]-y) - q[2] - gap; if(d < R){ R = d; if(R < minR) break; } }
    if(R >= minR) C.push([x, y, R, t/tries]);
  }
  return C;
}
// 多邊形：點是否在內、點到線段距離、邊界距離函式（外面回傳 -1）
function pip(P, x, y){ let s = false; for(let i = 0, j = P.length-1; i < P.length; j = i++){ const a = P[i], b = P[j]; if((a[1] > y) !== (b[1] > y) && x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1]) + a[0]) s = !s; } return s; }
function segD(px, py, a, b){ const dx = b[0]-a[0], dy = b[1]-a[1], L = dx*dx + dy*dy || 1; const t = clamp(((px-a[0])*dx + (py-a[1])*dy)/L, 0, 1); return Math.hypot(px-a[0]-t*dx, py-a[1]-t*dy); }
function edgeOf(P){ return (x, y) => { if(!pip(P, x, y)) return -1; let m = 1e9; for(let i = 0; i < P.length; i++){ const d = segD(x, y, P[i], P[(i+1) % P.length]); if(d < m) m = d; } return m; }; }
// 平滑不規則輪廓（以數組正弦疊加）
function blob(r, cx, cy, rx, ry, amp, n = 64){
  const ph = [r()*TAU, r()*TAU, r()*TAU], P = [];
  for(let i = 0; i < n; i++){ const a = i/n*TAU, k = 1 + amp*(.6*Math.sin(2*a + ph[0]) + .3*Math.sin(3*a + ph[1]) + .2*Math.sin(5*a + ph[2])); P.push([cx + Math.cos(a)*rx*k, cy + Math.sin(a)*ry*k]); }
  return P;
}
function path(g, P, close = true){ g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if(close) g.closePath(); }
// 凸多邊形以半平面裁切（f(p) <= 0 保留）
function clip(P, f){
  const out = [];
  for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], fa = f(a), fb = f(b);
    if(fa <= 0) out.push(a);
    if((fa < 0 && fb > 0) || (fa > 0 && fb < 0)){ const t = fa/(fa-fb); out.push([a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t]); } }
  return out;
}
// Voronoi／加權（power）Voronoi 多邊形：S = [x, y, 權重半徑]
function cells(S, x0, y0, x1, y1, weighted){
  return S.map((s, i) => { let P = [[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
    for(let j = 0; j < S.length && P.length; j++){ if(j === i) continue; const t = S[j];
      const ws = weighted ? s[2]*s[2] : 0, wt = weighted ? t[2]*t[2] : 0, k = -(t[0]*t[0] + t[1]*t[1]) + s[0]*s[0] + s[1]*s[1] + wt - ws;
      P = clip(P, p => 2*(p[0]*(t[0]-s[0]) + p[1]*(t[1]-s[1])) + k); }
    return P; });
}
// 3D 相機：yaw 繞 Z、pitch 俯角；回傳 [螢幕x, 螢幕y, 深度(越大越近)]
function cam(yaw, pitch, sc, cx, cy, persp){
  const cy_ = Math.cos(yaw), sy_ = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  return p => { const x = p[0]*cy_ - p[1]*sy_, y = p[0]*sy_ + p[1]*cy_, z = p[2], d = -y*cp + z*sp, s = -(y*sp + z*cp), f = persp ? persp/(persp - d) : 1; return [cx + x*sc*f, cy + s*sc*f, d]; };
}
// 色階（藍→青→黃→紅），用於性能分析
function heat(t, a = 1){
  const S = [[30,50,140],[40,170,200],[240,210,80],[220,60,40]], u = clamp(t, 0, .999)*(S.length-1), i = u|0, f = u - i;
  const c = S[i].map((v, k) => Math.round(v + (S[i+1][k]-v)*f)); return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}
function glow(g, x, y, R, col){ const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x-R, y-R, 2*R, 2*R); }
// Apollonian 墊片：圓以 [曲率 k, x, y, 層數] 表示；外圓曲率為負
function apollo(ra, minR){
  const rb = 1 - ra, O = [-1, 0, 0, 0], A = [1/ra, -1 + ra, 0, 0], B = [1/rb, ra, 0, 0];
  const k3 = -1 + A[0] + B[0] + 2*Math.sqrt(Math.max(0, -A[0] - B[0] + A[0]*B[0])), r3 = 1/k3;
  const R1 = 1 - r3, R2 = ra + r3, xA = A[1], x = (R1*R1 - R2*R2 + xA*xA)/(2*xA), y = Math.sqrt(Math.max(0, R1*R1 - x*x));
  const Cc = [k3, x, y, 0], out = [O, A, B, Cc];
  const rec = (a, b, c, old, d) => {
    const k = 2*(a[0] + b[0] + c[0]) - old[0]; if(k <= 0 || 1/k < minR || d > 14) return;
    const n = [k, (2*(a[0]*a[1] + b[0]*b[1] + c[0]*c[1]) - old[0]*old[1])/k, (2*(a[0]*a[2] + b[0]*b[2] + c[0]*c[2]) - old[0]*old[2])/k, d];
    out.push(n); rec(a, b, n, c, d+1); rec(a, c, n, b, d+1); rec(b, c, n, a, d+1);
  };
  rec(A, B, Cc, O, 1); rec(O, A, B, Cc, 1); rec(O, B, Cc, A, 1); rec(O, A, Cc, B, 1);
  return out;
}
function grid(g, W, H, s, col){ g.strokeStyle = col; g.lineWidth = .5; g.beginPath(); for(let x = s; x < W; x += s){ g.moveTo(x, 0); g.lineTo(x, H); } for(let y = s; y < H; y += s){ g.moveTo(0, y); g.lineTo(W, y); } g.stroke(); }

// =================== 變形 ===================
ART.var["E01"] = [
  // V01 任意曲線邊界：建築平面輪廓內填圓（平面圖）
  function(g, W, H, r, c){
    const m = Math.min(W, H);
    grid(g, W, H, m/12, "rgba(255,255,255,.05)");
    let P = blob(r, W*.5, H*.5, W*.4, H*.4, .22);
    // 切掉一角做成 L 形缺口
    const cut = [W*(.55 + r()*.1), H*(.08)];
    P = P.map(p => (p[0] > cut[0] && p[1] < H*.42) ? [Math.max(cut[0], p[0]*.0 + cut[0]), Math.max(p[1], H*.42)] : p);
    const edge = edgeOf(P), C = pack(r, {w: W, h: H, n: 260, tries: 3500, minR: m*.012, gap: 1, maxR: () => m*.1, edge});
    g.fillStyle = "rgba(255,255,255,.04)"; path(g, P); g.fill();
    C.forEach(([x, y, R]) => { circ(g, x, y, R); g.fillStyle = U.rgba(c, .18 + R/(m*.1)*.45); g.fill(); g.strokeStyle = U.rgba(c, .9); g.lineWidth = .8; g.stroke(); });
    // 貼邊的圓畫出 ClosestPoint 的拉回線
    g.strokeStyle = "rgba(255,255,255,.55)"; g.setLineDash([2, 2]); g.lineWidth = .7;
    C.filter(q => edge(q[0], q[1]) < q[2] + 2).slice(0, 14).forEach(([x, y]) => { let best = null, bd = 1e9;
      for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1) % P.length], dx = b[0]-a[0], dy = b[1]-a[1], t = clamp(((x-a[0])*dx + (y-a[1])*dy)/(dx*dx + dy*dy || 1), 0, 1), px = a[0] + dx*t, py = a[1] + dy*t, d = Math.hypot(px-x, py-y); if(d < bd){ bd = d; best = [px, py]; } }
      g.beginPath(); g.moveTo(x, y); g.lineTo(best[0], best[1]); g.stroke(); });
    g.setLineDash([]);
    g.strokeStyle = "#fff"; g.lineWidth = 2.2; path(g, P); g.stroke();
    // 指北針
    const nx = W - m*.09, ny = m*.09; g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1; circ(g, nx, ny, m*.035); g.stroke();
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(nx, ny - m*.035); g.lineTo(nx - m*.012, ny + m*.01); g.lineTo(nx + m*.012, ny + m*.01); g.fill();
  },
  // V02 吸引子控制半徑：立面板＋吸引點光暈＋距離–半徑曲線
  function(g, W, H, r, c){
    const m = Math.min(W, H), pad = m*.06, A = [[W*(.25 + r()*.2), H*(.3 + r()*.2)], [W*(.6 + r()*.2), H*(.62 + r()*.2)]], D = m*.55;
    const f = (x, y) => clamp(Math.min(...A.map(a => Math.hypot(a[0]-x, a[1]-y)))/D, 0, 1);
    A.forEach(a => glow(g, a[0], a[1], m*.35, U.rgba(ACC, .25)));
    const C = pack(r, {x0: pad, y0: pad, w: W - 2*pad, h: H - 2*pad, n: 500, tries: 5000, minR: m*.008, gap: 1.2,
      maxR: (x, y) => m*(.012 + .085*f(x, y)), edge: (x, y) => Math.min(x - pad, y - pad, W - pad - x, H - pad - y)});
    // 帷幕分割線
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1;
    for(let i = 1; i < 3; i++){ g.beginPath(); g.moveTo(pad + (W-2*pad)*i/3, pad); g.lineTo(pad + (W-2*pad)*i/3, H-pad); g.stroke(); }
    for(let j = 1; j < 4; j++){ g.beginPath(); g.moveTo(pad, pad + (H-2*pad)*j/4); g.lineTo(W-pad, pad + (H-2*pad)*j/4); g.stroke(); }
    C.forEach(([x, y, R]) => { const t = f(x, y); circ(g, x, y, R); g.fillStyle = U.rgba(c, .25 + .55*t); g.fill(); });
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.2; g.strokeRect(pad, pad, W - 2*pad, H - 2*pad);
    A.forEach(([x, y]) => { g.strokeStyle = ACC; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.moveTo(x, y - 7); g.lineTo(x, y + 7); g.stroke(); circ(g, x, y, 3); g.fillStyle = ACC; g.fill(); });
    // 小圖：距離 → 半徑
    const bx = W - pad - m*.28, by = H - pad - m*.04, bw = m*.24, bh = m*.16;
    g.fillStyle = "rgba(18,18,23,.85)"; g.fillRect(bx - 4, by - bh - 4, bw + 8, bh + 8);
    g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; g.beginPath(); g.moveTo(bx, by - bh); g.lineTo(bx, by); g.lineTo(bx + bw, by); g.stroke();
    g.strokeStyle = ACC; g.lineWidth = 1.6; g.beginPath(); g.moveTo(bx, by - bh*.12); g.lineTo(bx + bw*.85, by - bh*.9); g.lineTo(bx + bw, by - bh*.9); g.stroke();
  },
  // V03 影像驅動半徑：合成灰階圖（受光球體）→ 亮大暗小的圓；左上角附原圖縮圖
  function(g, W, H, r, c){
    const m = Math.min(W, H), cx = W*.52, cy = H*.55, R0 = m*.36, L = [-.55, -.6, .58];
    const img = (x, y) => { const dx = (x-cx)/R0, dy = (y-cy)/R0, d2 = dx*dx + dy*dy;
      if(d2 < 1){ const z = Math.sqrt(1 - d2); return clamp(.15 + .85*Math.max(0, dx*L[0] + dy*L[1] + z*L[2]), 0, 1); }
      return .12 + .25*(1 - y/H); };
    const C = pack(r, {w: W, h: H, n: 700, tries: 6000, minR: m*.006, gap: .8, maxR: (x, y) => m*(.006 + .032*img(x, y))});
    C.forEach(([x, y, R]) => { circ(g, x, y, R); g.fillStyle = `rgba(255,255,255,${.35 + .6*img(x, y)})`; g.fill(); });
    // 原圖縮圖
    const tw = m*.3, th = tw*H/W, tx = m*.05, ty = m*.05, n = 30;
    for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){ const v = img((i + .5)/n*W, (j + .5)/n*H)*255|0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(tx + i*tw/n, ty + j*th/n, tw/n + .5, th/n + .5); }
    g.strokeStyle = c; g.lineWidth = 1.5; g.strokeRect(tx, ty, tw, th);
    g.strokeStyle = U.rgba(c, .9); g.beginPath(); g.moveTo(tx + tw + 4, ty + th/2); g.lineTo(tx + tw + m*.1, ty + th/2); g.lineTo(tx + tw + m*.08, ty + th/2 - 4); g.moveTo(tx + tw + m*.1, ty + th/2); g.lineTo(tx + tw + m*.08, ty + th/2 + 4); g.stroke();
  },
  // V04 曲面上 circle packing：波浪曲面透視圖，圓貼在曲面上
  function(g, W, H, r, c){
    const m = Math.min(W, H), ph = r()*TAU;
    const S = (u, v) => [(u - .5)*2.2, (v - .5)*2.2, .32*Math.sin(u*4 + ph)*Math.cos(v*2.5 - .6)];
    const P = cam(.55, .62, m*.36, W/2, H*.52, 5);
    // 曲面線框
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = .7;
    for(let i = 0; i <= 14; i++){ g.beginPath(); for(let j = 0; j <= 30; j++){ const q = P(S(i/14, j/30)); j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke();
      g.beginPath(); for(let j = 0; j <= 30; j++){ const q = P(S(j/30, i/14)); j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke(); }
    const C = pack(r, {w: 1, h: 1, n: 180, tries: 2500, minR: .014, gap: .006, maxR: () => .085, edge: (u, v) => Math.min(u, v, 1-u, 1-v)});
    const polys = C.map(([u, v, R]) => { const pts = []; for(let k = 0; k < 20; k++){ const a = k/20*TAU; pts.push(P(S(u + Math.cos(a)*R, v + Math.sin(a)*R))); }
      const s0 = S(u, v), s1 = S(u + .01, v), zslope = (s1[2] - s0[2])/.01; return {pts, d: P(s0)[2], t: .5 + .5*Math.tanh(zslope)}; });
    polys.sort((a, b) => a.d - b.d).forEach(o => { path(g, o.pts); g.fillStyle = U.rgba(c, .25 + .5*o.t); g.fill(); g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = .8; g.stroke(); });
    // 一個法向量示意
    const o = C[0]; if(o){ const b = S(o[0], o[1]), a = P(b), t = P([b[0], b[1], b[2] + .35]); g.strokeStyle = ACC; g.lineWidth = 1.5; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(t[0], t[1]); g.stroke(); circ(g, t[0], t[1], 2.5); g.fillStyle = ACC; g.fill(); }
  },
  // V05 3D 球體堆疊：球形容器內的球，等角視、明暗著色
  function(g, W, H, r, c){
    const m = Math.min(W, H), S = [];
    for(let t = 0; t < 3000 && S.length < 150; t++){ const x = r()*2-1, y = r()*2-1, z = r()*2-1, dc = 1 - Math.hypot(x, y, z); if(dc < .05) continue;
      let R = Math.min(dc, .34*(1 - .8*t/3000)); for(const s of S){ const d = Math.hypot(s[0]-x, s[1]-y, s[2]-z) - s[3] - .01; if(d < R){ R = d; if(R < .045) break; } }
      if(R >= .045) S.push([x, y, z, R]); }
    const P = cam(.7, .45, m*.4, W/2, H*.5, 0), rgb = U.rgb(c);
    // 地面陰影
    g.save(); g.translate(W/2, H*.5 + m*.44); g.scale(1, .22); glow(g, 0, 0, m*.45, "rgba(0,0,0,.6)"); g.restore();
    g.strokeStyle = "rgba(255,255,255,.18)"; g.setLineDash([3, 3]); circ(g, W/2, H*.5, m*.4); g.stroke(); g.setLineDash([]);
    S.map(s => ({s, q: P(s)})).sort((a, b) => a.q[2] - b.q[2]).forEach(({s, q}) => { const R = s[3]*m*.4, gr = g.createRadialGradient(q[0] - R*.35, q[1] - R*.4, R*.05, q[0], q[1], R);
      gr.addColorStop(0, "#fff"); gr.addColorStop(.35, c); gr.addColorStop(1, `rgb(${rgb.map(v => v*.25|0).join(",")})`); g.fillStyle = gr; circ(g, q[0], q[1], R); g.fill(); });
  },
  // V06 網格空間索引：大量小圓，顯示格網與「同格＋鄰 8 格」查詢範圍
  function(g, W, H, r, c){
    const m = Math.min(W, H), mr = m*.045, cs = 2*mr;
    const C = pack(r, {w: W, h: H, n: 900, tries: 7000, minR: m*.006, gap: .8, maxR: () => mr});
    const qx = Math.floor(W*(.4 + r()*.2)/cs), qy = Math.floor(H*(.4 + r()*.2)/cs);
    C.forEach(([x, y, R]) => { const gx = Math.floor(x/cs), gy = Math.floor(y/cs), hit = Math.abs(gx - qx) <= 1 && Math.abs(gy - qy) <= 1, me = gx === qx && gy === qy;
      circ(g, x, y, R); g.fillStyle = me ? ACC : hit ? U.rgba(c, .9) : U.rgba(c, .32); g.fill(); });
    grid(g, W, H, cs, "rgba(255,255,255,.3)");
    g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect((qx-1)*cs, (qy-1)*cs, 3*cs, 3*cs);
    g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.strokeRect((qx-1)*cs, (qy-1)*cs, 3*cs, 3*cs);
    g.strokeStyle = ACC; g.lineWidth = 2; g.strokeRect(qx*cs, qy*cs, cs, cs);
  },
  // V07 貪婪插入（先大後小）：四級尺寸的剪紙拼貼，帶投影
  function(g, W, H, r, c){
    const m = Math.min(W, H), tiers = [.2, .1, .045, .018], col = [c, "#fff", ACC, U.rgba(c, .55)];
    const C = pack(r, {w: W, h: H, n: 700, tries: 8000, minR: m*.012, gap: m*.012, maxR: (x, y, t) => m*tiers[Math.min(3, (t*5)|0)]});
    C.forEach(([x, y, R, t]) => { const k = Math.min(3, (t*5)|0); circ(g, x + 2, y + 2.5, R); g.fillStyle = "rgba(0,0,0,.45)"; g.fill(); circ(g, x, y, R); g.fillStyle = col[k]; g.fill(); });
    // 尺寸級距示意
    g.fillStyle = "rgba(18,18,23,.8)"; g.fillRect(6, H - m*.1, m*.46, m*.08);
    tiers.forEach((s, i) => { circ(g, 12 + m*.03 + i*m*.11, H - m*.06, Math.max(1.5, s*m*.13)); g.fillStyle = col[i]; g.fill(); });
  },
  // V08 成長式填充：三個時間切片（上→下）顯示圓出現並長大
  function(g, W, H, r, c){
    const m = Math.min(W, H), bandH = (H - 16)/3;
    const C = pack(r, {w: W - 12, h: bandH - 8, n: 220, tries: 4000, minR: m*.01, gap: 1, maxR: () => m*.09, edge: (x, y) => Math.min(x, y, W - 12 - x, bandH - 8 - y)});
    const birth = C.map((q, i) => i/C.length*.8);
    [0.3, .6, 1].forEach((s, k) => { const oy = 4 + k*(bandH + 4);
      g.fillStyle = "rgba(255,255,255,.035)"; g.fillRect(6, oy, W - 12, bandH - 4);
      C.forEach(([x, y, R], i) => { if(birth[i] > s) return; const rr = Math.min(R, (s - birth[i])*m*.45); const done = rr >= R;
        circ(g, 6 + x, oy + y, rr); g.fillStyle = done ? U.rgba(c, .6) : "rgba(255,255,255,.2)"; g.fill(); g.strokeStyle = done ? c : "rgba(255,255,255,.8)"; g.lineWidth = .8; g.stroke(); });
      // 時間刻度
      g.fillStyle = ACC; for(let i = 0; i <= k; i++) g.fillRect(W - 14 - i*7, oy + 4, 4, 4);
    });
  },
  // V09 Timer 動畫：初始重疊位置（虛線）→ 每輪互推軌跡 → 收斂位置，下方播放列
  function(g, W, H, r, c){
    const m = Math.min(W, H), cx = W/2, cy = H*.46, N = 36;
    const Q = [...Array(N)].map(() => { const a = r()*TAU, d = r()*m*.12; return {x: cx + Math.cos(a)*d, y: cy + Math.sin(a)*d, R: m*(.03 + r()*.06), tr: []}; });
    Q.forEach(q => { q.x0 = q.x; q.y0 = q.y; });
    for(let it = 0; it < 70; it++){ for(let i = 0; i < N; i++) for(let j = i+1; j < N; j++){ const a = Q[i], b = Q[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01, o = a.R + b.R - d;
        if(o > 0){ const f = o*.5/d; a.x -= dx*f; a.y -= dy*f; b.x += dx*f; b.y += dy*f; } }
      Q.forEach(q => { q.x += (cx - q.x)*.01; q.y += (cy - q.y)*.01; q.tr.push([q.x, q.y]); }); }
    g.setLineDash([2, 3]); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = .8; Q.forEach(q => { circ(g, q.x0, q.y0, q.R); g.stroke(); }); g.setLineDash([]);
    Q.forEach(q => { g.strokeStyle = U.rgba(ACC, .7); g.lineWidth = 1; path(g, [[q.x0, q.y0], ...q.tr], false); g.stroke(); });
    Q.forEach(q => { circ(g, q.x, q.y, q.R); g.fillStyle = U.rgba(c, .3); g.fill(); g.strokeStyle = c; g.lineWidth = 1.3; g.stroke(); });
    // 播放列
    const by = H - m*.08, bx = m*.14, bw = W - m*.22;
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(m*.04, by - 6); g.lineTo(m*.04 + 10, by); g.lineTo(m*.04, by + 6); g.fill();
    g.fillStyle = "rgba(255,255,255,.2)"; g.fillRect(bx, by - 1.5, bw, 3); g.fillStyle = c; g.fillRect(bx, by - 1.5, bw*.72, 3); circ(g, bx + bw*.72, by, 5); g.fillStyle = "#fff"; g.fill();
  },
  // V10 可製造開孔板：等角視的厚板，孔（雷切路徑）＋肋寬放大圖
  function(g, W, H, r, c){
    const m = Math.min(W, H), P = cam(.6, .75, m*.5, W*.5, H*.55, 0), Lx = 1.5, Ly = 1, th = .06;
    const C = pack(r, {w: Lx, h: Ly, n: 160, tries: 2500, minR: .02, gap: .035, maxR: () => .11, edge: (x, y) => Math.min(x, y, Lx-x, Ly-y) - .03});
    const to = (x, y, z = 0) => P([x - Lx/2, y - Ly/2, z]);
    const base = [to(0,0), to(Lx,0), to(Lx,Ly), to(0,Ly)], bot = [to(0,0,-th), to(Lx,0,-th), to(Lx,Ly,-th), to(0,Ly,-th)];
    g.fillStyle = "rgba(0,0,0,.35)"; path(g, bot.map(p => [p[0] + 8, p[1] + 14])); g.fill();
    // 側面
    g.fillStyle = U.rgba(c, .35); path(g, [base[0], base[1], bot[1], bot[0]]); g.fill(); path(g, [base[1], base[2], bot[2], bot[1]]); g.fillStyle = U.rgba(c, .5); g.fill();
    g.fillStyle = U.rgba(c, .75); path(g, base); g.fill();
    C.forEach(([x, y, R]) => { const pts = []; for(let k = 0; k < 18; k++){ const a = k/18*TAU; pts.push(to(x + Math.cos(a)*R, y + Math.sin(a)*R)); }
      path(g, pts); g.fillStyle = "#141419"; g.fill(); g.strokeStyle = "#FF5A4E"; g.lineWidth = .8; g.stroke(); });
    // 放大圖：肋寬
    const zx = W - m*.17, zy = m*.17, zr = m*.14;
    g.fillStyle = U.rgba(c, .75); circ(g, zx, zy, zr); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.stroke();
    g.save(); circ(g, zx, zy, zr); g.clip(); g.fillStyle = "#141419"; circ(g, zx - zr*.62, zy, zr*.5); g.fill(); circ(g, zx + zr*.62, zy + zr*.1, zr*.5); g.fill(); g.restore();
    g.strokeStyle = "#fff"; g.lineWidth = 1; g.beginPath(); g.moveTo(zx - zr*.12, zy - zr*.5); g.lineTo(zx - zr*.12, zy + zr*.5); g.moveTo(zx + zr*.12, zy - zr*.5); g.lineTo(zx + zr*.12, zy + zr*.5); g.stroke();
    g.strokeStyle = ACC; g.beginPath(); g.moveTo(zx - zr*.12, zy - zr*.3); g.lineTo(zx + zr*.12, zy - zr*.3); g.stroke();
  },
  // V11 Circle packing → 加權 Voronoi（power diagram）
  function(g, W, H, r, c){
    const m = Math.min(W, H);
    const C = pack(r, {w: W, h: H, n: 90, tries: 2500, minR: m*.025, gap: m*.01, maxR: () => m*.16});
    const V = cells(C, 0, 0, W, H, true);
    V.forEach((P, i) => { if(P.length < 3) return; const t = C[i][2]/(m*.16); path(g, P); g.fillStyle = U.rgba(c, .1 + .5*t); g.fill(); g.strokeStyle = "#16161C"; g.lineWidth = 3; g.stroke(); g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 1; g.stroke(); });
    g.setLineDash([2, 2]); g.strokeStyle = U.rgba(ACC, .8); g.lineWidth = .8; C.forEach(([x, y, R]) => { circ(g, x, y, R); g.stroke(); }); g.setLineDash([]);
    g.fillStyle = "#fff"; C.forEach(([x, y]) => g.fillRect(x - 1.2, y - 1.2, 2.4, 2.4));
  },
  // V12 Apollonian 遞迴填充：對稱墊片，線寬依層數遞減
  function(g, W, H, r, c){
    const m = Math.min(W, H), R0 = m*.46, A = apollo(.5, .005), rot = r()*TAU, cs = Math.cos(rot), sn = Math.sin(rot);
    A.sort((a, b) => a[3] - b[3]).forEach(([k, x, y, d]) => { const R = Math.abs(1/k)*R0, X = W/2 + (x*cs - y*sn)*R0, Y = H/2 + (x*sn + y*cs)*R0;
      circ(g, X, Y, R); if(k > 0 && d < 4){ g.fillStyle = U.rgba(c, .08 + d*.05); g.fill(); }
      g.strokeStyle = d === 0 ? "#fff" : U.rgba(c, Math.max(.35, 1 - d*.08)); g.lineWidth = Math.max(.5, 2 - d*.25); g.stroke(); });
  },
];

// V13 泡泡圖配置：鄰接圖彈簧（力導向）－ 圓依房間面積定半徑，鄰接彈簧拉近、其餘互推
ART.var["E01"][12] = function(g, W, H, r, c){
  const m = Math.min(W, H), N = 11, areas = [...Array(N)].map(() => 16 + r()*54);
  const rad = areas.map(a => Math.sqrt(a/Math.PI)*m*.017), radMax = Math.max(...rad);
  const P = areas.map((a,i) => ({x: W*.15+r()*W*.7, y: H*.15+r()*H*.6, r: rad[i]}));
  const edges = []; for(let i=1;i<N;i++) edges.push([i, (r()*i)|0]);
  for(let e=0;e<4;e++){ const a=(r()*N)|0, b2=(r()*N)|0; if(a!==b2 && !edges.some(([x,y]) => (x===a&&y===b2)||(x===b2&&y===a))) edges.push([a,b2]); }
  for(let it=0; it<140; it++){ const temp = 3*(1-it/140), disp = P.map(() => [0,0]);
    for(let i=0;i<N;i++) for(let j=i+1;j<N;j++){ const a=P[i], b2=P[j], dx=a.x-b2.x, dy=a.y-b2.y, d=Math.hypot(dx,dy)||.01, gap=d-(a.r+b2.r);
      if(gap<0){ const f=-gap*.55; disp[i][0]+=dx/d*f; disp[i][1]+=dy/d*f; disp[j][0]-=dx/d*f; disp[j][1]-=dy/d*f; } }
    edges.forEach(([i,j]) => { const a=P[i], b2=P[j], dx=b2.x-a.x, dy=b2.y-a.y, d=Math.hypot(dx,dy)||.01, gap=d-(a.r+b2.r);
      if(gap>0){ const f=gap*.09; disp[i][0]+=dx/d*f; disp[i][1]+=dy/d*f; disp[j][0]-=dx/d*f; disp[j][1]-=dy/d*f; } });
    P.forEach((p,i) => { const dl=Math.hypot(disp[i][0],disp[i][1])||1, cl=Math.min(dl,temp+2);
      p.x += disp[i][0]/dl*cl; p.y += disp[i][1]/dl*cl;
      p.x = Math.max(p.r+4, Math.min(W-p.r-4, p.x)); p.y = Math.max(p.r+4, Math.min(H*.86-p.r-4, p.y)); });
  }
  g.lineWidth = 1.4; let touched = 0;
  edges.forEach(([i,j]) => { const a=P[i], b2=P[j], d=Math.hypot(a.x-b2.x,a.y-b2.y), gap=d-(a.r+b2.r), ok = gap < 1.6;
    if(ok) touched++;
    g.strokeStyle = ok ? U.rgba(c,.75) : "rgba(230,90,80,.7)"; g.setLineDash(ok ? [] : [4,3]);
    g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b2.x,b2.y); g.stroke(); });
  g.setLineDash([]);
  P.forEach(p => { circ(g,p.x,p.y,p.r); g.fillStyle = U.rgba(c, .16 + .55*(p.r/radMax)); g.fill(); g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 1.2; g.stroke(); });
  const bx = W*.06, by = H*.93, bw = W*.5, bh = 6;
  g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(bx,by,bw,bh);
  g.fillStyle = ACC; g.fillRect(bx,by,bw*touched/edges.length,bh);
};
ART.var["E01"][12].ratio = 1.05;

// =================== 無照片案例 ===================
// E01-01 CP mesh：自由曲面上的三角網格，每個三角面畫內切圓，下方有支柱
ART.case["E01-01"] = function(g, W, H, r, c){
  const m = Math.min(W, H), n = 9, P = cam(.5 + r()*.3, .5, m*.34, W/2, H*.46, 6);
  const S = (u, v) => { const x = (u - .5)*2.6, y = (v - .5)*2.2; return [x, y, .55 - .22*x*x - .3*y*y + .12*Math.sin(x*2)]; };
  const V = []; for(let j = 0; j <= n; j++) for(let i = 0; i <= n; i++) V.push(S((i + (j % 2)*.5)/(n + .5), j/n));
  const T = []; for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){ const a = j*(n+1) + i, b = a + 1, cc = a + n + 1, d = cc + 1;
    if(j % 2 === 0){ T.push([a, b, cc]); T.push([b, d, cc]); } else { T.push([a, b, d]); T.push([a, d, cc]); } }
  const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]], len = a => Math.hypot(...a), cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]], nrm = a => { const l = len(a) || 1; return a.map(v => v/l); };
  // 支柱
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.5;
  [0, n, n*(n+1), (n+1)*(n+1) - 1].forEach(i => { const a = P(V[i]), b = P([V[i][0], V[i][1], -.9]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
  const tris = T.map(([a, b, cc]) => { const A = V[a], B = V[b], C = V[cc], la = len(sub(B, C)), lb = len(sub(A, C)), lc = len(sub(A, B)), p = la + lb + lc;
    const I = [0,1,2].map(k => (la*A[k] + lb*B[k] + lc*C[k])/p), N = cross(sub(B, A), sub(C, A)), area = len(N)/2, rad = 2*area/p, e1 = nrm(sub(B, A)), e2 = nrm(cross(nrm(N), e1));
    const cp = []; for(let k = 0; k < 20; k++){ const t = k/20*TAU; cp.push(P([0,1,2].map(q => I[q] + rad*(Math.cos(t)*e1[q] + Math.sin(t)*e2[q])))); }
    return {tp: [P(A), P(B), P(C)], cp, d: P(I)[2], sh: Math.abs(nrm(N)[2])}; });
  tris.sort((a, b) => a.d - b.d).forEach(o => { path(g, o.tp); g.fillStyle = `rgba(255,255,255,${.03 + .06*o.sh})`; g.fill(); g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = .6; g.stroke();
    path(g, o.cp); g.fillStyle = U.rgba(c, .2 + .45*o.sh); g.fill(); g.strokeStyle = c; g.lineWidth = 1; g.stroke(); });
  // 地平線
  g.strokeStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.moveTo(0, H*.9); g.lineTo(W, H*.9); g.stroke();
};
ART.case["E01-01"].ratio = .8;

// E01-02 水立方：兩點透視的方盒量體，兩個立面布滿泡泡多邊形
ART.case["E01-02"] = function(g, W, H, r, c){
  const m = Math.min(W, H), hz = H*.62, vl = [-W*.6, hz], vr = [W*1.7, hz], cx = W*.4, top = H*.2, bot = H*.78;
  const at = (vp, t, y) => [cx + (vp[0] - cx)*t, y + (vp[1] - y)*t];
  // 前立面（左）與側立面（右）的四角
  const face = (vp, tt) => (u, v) => { const yT = top, yB = bot, a = at(vp, u*tt, yT), b = at(vp, u*tt, yB); return [a[0], a[1] + (b[1] - a[1])*v]; };
  const FL = face(vl, .42), FR = face(vr, .22);
  g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(0, hz, W, H - hz);
  [[FL, .75], [FR, 1]].forEach(([F, br]) => {
    const S = [...Array(46)].map(() => [r(), r(), 0]); const V = cells(S, 0, 0, 1, 1, false);
    V.forEach((Pp, i) => { if(Pp.length < 3) return; const cxp = Pp.reduce((s, p) => s + p[0], 0)/Pp.length, cyp = Pp.reduce((s, p) => s + p[1], 0)/Pp.length;
      const sh = Pp.map(p => [cxp + (p[0] - cxp)*.86, cyp + (p[1] - cyp)*.86]).map(p => F(p[0], p[1]));
      path(g, Pp.map(p => F(p[0], p[1]))); g.fillStyle = `rgba(90,150,200,${.25*br})`; g.fill();
      path(g, sh); g.fillStyle = U.rgba(c, (.25 + .35*r())*br); g.fill(); g.strokeStyle = `rgba(255,255,255,${.5*br})`; g.lineWidth = .7; g.stroke(); });
    const o = [F(0,0), F(1,0), F(1,1), F(0,1)]; g.strokeStyle = "#fff"; g.lineWidth = 1.4; path(g, o); g.stroke();
  });
  // 水面倒影
  g.save(); g.globalAlpha = .18; g.translate(0, 2*bot); g.scale(1, -1); g.beginPath(); g.rect(0, bot, W, bot - hz); g.clip();
  g.fillStyle = U.rgba(c, .6); path(g, [FL(0,1), FL(1,1), FR(1,1), FR(1,.6), FL(0,.6)]); g.fill(); g.restore();
  g.strokeStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.moveTo(0, bot); g.lineTo(W, bot); g.stroke();
};
ART.case["E01-02"].ratio = .78;

// E01-03 Kangaroo 自由邊界立面：建築立面上的自由形開口，圓在開口內、吸引點控制，下方有人
ART.case["E01-03"] = function(g, W, H, r, c){
  const m = Math.min(W, H), x0 = W*.08, x1 = W*.92, y0 = H*.08, y1 = H*.86, fl = 6;
  g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; for(let i = 1; i < fl; i++){ const y = y0 + (y1 - y0)*i/fl; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
  const B = blob(r, W*.5, H*.45, W*.3, H*.3, .3, 72), edge = edgeOf(B), at = [W*(.35 + r()*.3), H*(.3 + r()*.3)];
  g.fillStyle = "#15151A"; path(g, B); g.fill();
  const C = pack(r, {w: W, h: H, n: 320, tries: 4000, minR: m*.008, gap: m*.006, edge, maxR: (x, y) => m*(.012 + .06*clamp(Math.hypot(x - at[0], y - at[1])/(m*.45), 0, 1))});
  C.forEach(([x, y, R]) => { circ(g, x, y, R); g.fillStyle = U.rgba(c, .8); g.fill(); });
  g.strokeStyle = "#fff"; g.lineWidth = 1.6; path(g, B); g.stroke();
  g.strokeStyle = ACC; g.lineWidth = 1.2; circ(g, at[0], at[1], 5); g.stroke(); circ(g, at[0], at[1], 1.8); g.fillStyle = ACC; g.fill();
  // 地面與人
  g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, y1); g.lineTo(W, y1); g.stroke();
  g.fillStyle = "rgba(255,255,255,.75)"; const ph = m*.07;
  [W*.2, W*.27, W*.72].forEach(px => { circ(g, px, y1 - ph, ph*.13); g.fill(); g.fillRect(px - ph*.1, y1 - ph*.85, ph*.2, ph*.85); });
};
ART.case["E01-03"].ratio = 1.1;

// E01-04 Kangaroo 2 建模：透視視窗、地面格線、圓的線框、接觸圖（Plankton 網格）與軸向小工具
ART.case["E01-04"] = function(g, W, H, r, c){
  const m = Math.min(W, H), P = cam(.45, .95, m*.34, W/2, H*.52, 4);
  g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = .6;
  for(let i = -8; i <= 8; i++){ let a = P([i*.25, -2, 0]), b = P([i*.25, 2, 0]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); a = P([-2, i*.25, 0]); b = P([2, i*.25, 0]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  const C = pack(r, {w: 2.6, h: 2, x0: -1.3, y0: -1, n: 90, tries: 2000, minR: .06, gap: .012, maxR: () => .24, edge: (x, y) => 1.25 - Math.hypot(x/1.3, y)*1.15});
  const Z = (x, y) => .25 + .18*Math.sin(x*1.5)*Math.cos(y*1.7);
  C.forEach(([x, y, R]) => { const pts = []; for(let k = 0; k < 24; k++){ const a = k/24*TAU, px = x + Math.cos(a)*R, py = y + Math.sin(a)*R; pts.push(P([px, py, Z(px, py)])); } path(g, pts); g.strokeStyle = "rgba(220,225,235,.75)"; g.lineWidth = .8; g.stroke(); });
  // 接觸圖
  g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1;
  for(let i = 0; i < C.length; i++) for(let j = i+1; j < C.length; j++){ const a = C[i], b = C[j]; if(Math.hypot(a[0]-b[0], a[1]-b[1]) - a[2] - b[2] < .05){ const A = P([a[0], a[1], Z(a[0], a[1])]), B = P([b[0], b[1], Z(b[0], b[1])]); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); } }
  C.forEach(([x, y]) => { const q = P([x, y, Z(x, y)]); g.fillStyle = c; g.fillRect(q[0] - 2, q[1] - 2, 4, 4); });
  // 選取中的圓
  const s = C[(r()*C.length)|0]; if(s){ const pts = []; for(let k = 0; k < 24; k++){ const a = k/24*TAU, px = s[0] + Math.cos(a)*s[2], py = s[1] + Math.sin(a)*s[2]; pts.push(P([px, py, Z(px, py)])); } path(g, pts); g.strokeStyle = ACC; g.lineWidth = 2; g.stroke(); }
  // 軸向小工具
  const o = [m*.1, H - m*.1], L = m*.07; g.lineWidth = 2;
  [["#E0524A", [1, 0, 0]], ["#5DBB63", [0, 1, 0]], ["#4A8FE0", [0, 0, 1]]].forEach(([col, v]) => { const a = P([0,0,0]), b = P(v); const dx = b[0]-a[0], dy = b[1]-a[1], l = Math.hypot(dx, dy) || 1; g.strokeStyle = col; g.beginPath(); g.moveTo(o[0], o[1]); g.lineTo(o[0] + dx/l*L, o[1] + dy/l*L); g.stroke(); });
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(3, 3, W - 6, H - 6);
};
ART.case["E01-04"].ratio = .85;

// E01-05 T 恤：服裝輪廓內鋪滿圓，領口與縫線
ART.case["E01-05"] = function(g, W, H, r, c){
  const T = [[.36,.1],[.42,.15],[.5,.17],[.58,.15],[.64,.1],[.84,.2],[.96,.38],[.8,.46],[.74,.4],[.75,.93],[.25,.93],[.26,.4],[.2,.46],[.04,.38],[.16,.2]].map(p => [p[0]*W, p[1]*H]);
  const m = Math.min(W, H), edge = edgeOf(T);
  g.fillStyle = "rgba(255,255,255,.06)"; path(g, T); g.fill();
  const C = pack(r, {w: W, h: H, n: 380, tries: 5000, minR: m*.008, gap: 1, edge, maxR: (x, y) => m*(.02 + .05*(y/H))});
  C.forEach(([x, y, R]) => { circ(g, x, y, R); g.fillStyle = U.rgba(c, .55); g.fill(); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = .6; g.stroke(); });
  g.strokeStyle = "#fff"; g.lineWidth = 1.8; path(g, T); g.stroke();
  g.setLineDash([3, 2]); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = .8;
  g.beginPath(); g.moveTo(W*.26, H*.9); g.lineTo(W*.75, H*.9); g.moveTo(W*.26, H*.4); g.lineTo(W*.2, H*.23); g.moveTo(W*.74, H*.4); g.lineTo(W*.8, H*.23); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(W*.36, H*.1); g.quadraticCurveTo(W*.5, H*.24, W*.64, H*.1); g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.stroke();
};
ART.case["E01-05"].ratio = 1;

// E01-06 Tyler Hobbs 隨機試放：展牆上的裱框作品（兩級尺寸、色塊），聚光燈與長椅
ART.case["E01-06"] = function(g, W, H, r, c){
  const m = Math.min(W, H), fy = H*.8;
  glow(g, W/2, H*.05, m*.8, "rgba(255,240,210,.12)");
  g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, fy, W, H - fy);
  const fw = W*.62, fh = fw*1.2 > H*.62 ? H*.62 : fw*1.2, fx = (W - fw)/2, fy0 = H*.1;
  g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(fx + 5, fy0 + 6, fw, fh);
  g.fillStyle = "#2A2520"; g.fillRect(fx - 4, fy0 - 4, fw + 8, fh + 8);
  g.fillStyle = PAPER; g.fillRect(fx, fy0, fw, fh);
  const px = fx + fw*.1, py = fy0 + fh*.1, pw = fw*.8, ph = fh*.8, pal = [c, ACC, INK, "#D9553F"];
  const C = pack(r, {x0: px, y0: py, w: pw, h: ph, n: 320, tries: 5000, minR: 1, gap: 1.2, edge: (x, y) => Math.min(x - px, y - py, px + pw - x, py + ph - y), maxR: (x, y, t) => t < .1 ? pw*.16 : t < .4 ? pw*.05 : pw*.022});
  C.forEach(([x, y, R]) => { circ(g, x, y, R); g.fillStyle = pal[(r()*pal.length)|0]; g.fill(); });
  // 長椅
  g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(W*.3, fy + (H - fy)*.35, W*.4, 4); g.fillRect(W*.33, fy + (H - fy)*.35, 3, (H - fy)*.4); g.fillRect(W*.67 - 3, fy + (H - fy)*.35, 3, (H - fy)*.4);
};
ART.case["E01-06"].ratio = 1.25;

// E01-07 Coding Challenge #50：p5 編輯器視窗；圓在星形圖像內長滿、外部稀疏
ART.case["E01-07"] = function(g, W, H, r, c){
  const m = Math.min(W, H), bar = m*.08;
  g.fillStyle = "#2B2B33"; g.fillRect(0, 0, W, bar); ["#E0524A", "#E8B84A", "#5DBB63"].forEach((col, i) => { circ(g, bar*.5 + i*bar*.45, bar/2, bar*.14); g.fillStyle = col; g.fill(); });
  g.fillStyle = "#ED225D"; g.beginPath(); g.moveTo(W - bar*1.2, bar*.25); g.lineTo(W - bar*.65, bar*.5); g.lineTo(W - bar*1.2, bar*.75); g.fill();
  g.fillStyle = "#0E0E12"; g.fillRect(m*.04, bar + m*.04, W - m*.08, H - bar - m*.08);
  const cx = W/2, cy = bar + (H - bar)/2, Ro = Math.min(W, H - bar)*.44, S = [];
  for(let i = 0; i < 10; i++){ const a = -Math.PI/2 + i/10*TAU, rr = i % 2 ? Ro*.45 : Ro; S.push([cx + Math.cos(a)*rr, cy + Math.sin(a)*rr]); }
  const inS = edgeOf(S), x0 = m*.04, y0 = bar + m*.04, w = W - m*.08, h = H - bar - m*.08;
  const C = pack(r, {x0, y0, w, h, n: 520, tries: 6000, minR: 1.2, gap: .8, edge: (x, y) => Math.min(x - x0, y - y0, x0 + w - x, y0 + h - y), maxR: (x, y) => inS(x, y) > 0 ? m*.035 : m*.012});
  C.forEach(([x, y, R]) => { const inside = inS(x, y) > 0; if(!inside && r() < .6) return; circ(g, x, y, R); g.strokeStyle = inside ? "#fff" : U.rgba(c, .35); g.lineWidth = 1; g.stroke(); if(inside){ g.fillStyle = U.rgba(c, .5); g.fill(); } });
};
ART.case["E01-07"].ratio = .9;

// E01-08 Apollonian 互動草稿：不對稱墊片，依層數上色，下方 0–9 層選擇鍵
ART.case["E01-08"] = function(g, W, H, r, c){
  const m = Math.min(W, H), R0 = Math.min(W*.46, (H - m*.14)*.46), cx = W/2, cy = (H - m*.12)/2 + 2, lv = 5 + ((r()*3)|0);
  const A = apollo(.62 + r()*.1, .004), rot = Math.PI/2 + r()*.6, cs = Math.cos(rot), sn = Math.sin(rot);
  A.filter(a => a[3] <= lv).sort((a, b) => a[3] - b[3]).forEach(([k, x, y, d]) => { const R = Math.abs(1/k)*R0, X = cx + (x*cs - y*sn)*R0, Y = cy + (x*sn + y*cs)*R0;
    circ(g, X, Y, R); g.fillStyle = d === 0 ? "#101014" : d % 2 ? U.rgba(c, .25 + d*.08) : `rgba(255,255,255,${.1 + d*.05})`; g.fill(); if(d < 3){ g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 1; g.stroke(); } });
  // 與墊片正交的虛線圓（示意）
  g.setLineDash([3, 3]); g.strokeStyle = U.rgba(ACC, .8); g.lineWidth = 1; circ(g, cx + R0*.9, cy - R0*.9, R0*.9); g.stroke(); g.setLineDash([]);
  const s = (W - m*.1)/10;
  for(let i = 0; i < 10; i++){ const x = m*.05 + i*s; g.fillStyle = i <= lv ? (i === lv ? ACC : U.rgba(c, .7)) : "rgba(255,255,255,.12)"; g.fillRect(x + 1, H - m*.1, s - 3, m*.06); }
};
ART.case["E01-08"].ratio = 1.05;

// E01-09 單筆線 Apollonian 時裝：洋裝輪廓（布面）上以單線墨跡畫墊片
ART.case["E01-09"] = function(g, W, H, r, c){
  const D = [[.4,.06],[.44,.06],[.47,.14],[.53,.14],[.56,.06],[.6,.06],[.62,.22],[.58,.38],[.86,.95],[.14,.95],[.42,.38],[.38,.22]].map(p => [p[0]*W, p[1]*H]);
  g.fillStyle = PAPER; path(g, D); g.fill();
  g.save(); path(g, D); g.clip();
  const m = Math.min(W, H), R0 = Math.min(W*.3, H*.26), cx = W*.5, cy = H*.7, A = apollo(.5 + r()*.15, .006), rot = r()*TAU, cs = Math.cos(rot), sn = Math.sin(rot);
  g.strokeStyle = INK; g.lineWidth = .8;
  A.forEach(([k, x, y]) => { const R = Math.abs(1/k)*R0; circ(g, cx + (x*cs - y*sn)*R0, cy + (x*sn + y*cs)*R0, R); g.stroke(); });
  // 小墊片點綴上身
  const B = apollo(.5, .02); g.strokeStyle = U.rgba(c, 1); g.lineWidth = .9;
  B.forEach(([k, x, y]) => { const R = Math.abs(1/k)*m*.08; circ(g, W*.5 + x*m*.08, H*.25 + y*m*.08, R); g.stroke(); });
  g.restore();
  g.strokeStyle = "#fff"; g.lineWidth = 1.5; path(g, D); g.stroke();
  // 衣架
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(W*.36, H*.06); g.lineTo(W*.5, H*.015); g.lineTo(W*.64, H*.06); g.stroke();
};
ART.case["E01-09"].ratio = 1.3;

// E01-10 可穿戴 auxetic MRI 超材料：肢體（錐形圓柱）表面上的旋轉方塊單元，色階為性能
ART.case["E01-10"] = function(g, W, H, r, c){
  const m = Math.min(W, H), P = cam(.2, .25, m*.42, W*.46, H*.5, 5);
  const rad = h => .45 + .12*Math.sin(h*Math.PI*1.1) - .08*h, S = (a, h) => { const R = rad(h); return [Math.cos(a)*R, Math.sin(a)*R, (h - .5)*2.2]; };
  // 肢體輪廓陰影
  g.fillStyle = "rgba(255,255,255,.05)"; const left = [], right = [];
  for(let i = 0; i <= 20; i++){ const h = i/20; left.push(P(S(Math.PI, h))); right.push(P(S(0, h))); } path(g, [...left, ...right.reverse()]); g.fill();
  const Lw = TAU*.55, C = pack(r, {w: TAU, h: 1, n: 260, tries: 3500, minR: .03, gap: .01, maxR: (x, y) => .07 + .05*y, edge: (x, y) => Math.min(y, 1 - y)});
  const items = C.map(([a, h, R]) => { const p = S(a, h), q = P(p); return {a, h, R, q}; }).filter(o => o.q[2] > -.05).sort((u, v) => u.q[2] - v.q[2]);
  items.forEach(({a, h, R, q}) => { const face = clamp(q[2]/.5, 0, 1), rr = R*m*.42*rad(h)*(.5 + .5*face), perf = .5 + .5*Math.sin(h*5 + a*1.3);
    g.fillStyle = heat(perf, .35 + .5*face); g.save(); g.translate(q[0], q[1]); g.scale(.4 + .6*face, 1);
    circ(g, 0, 0, rr); g.fill(); g.strokeStyle = heat(perf, .9); g.lineWidth = .8; g.stroke();
    // 旋轉方塊（auxetic）
    const s = rr*.42, th = .35 + perf*.4; g.fillStyle = "rgba(15,15,20,.75)";
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([dx, dy], k) => { g.save(); g.translate(dx*s*.55, dy*s*.55); g.rotate(k % 2 ? th : -th); g.fillRect(-s*.45, -s*.45, s*.9, s*.9); g.restore(); });
    g.restore(); });
  // 色階條
  const bx = W - m*.08, by = H*.15, bh = H*.7; for(let i = 0; i < 40; i++){ g.fillStyle = heat(1 - i/40); g.fillRect(bx, by + i*bh/40, m*.035, bh/40 + .5); }
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.strokeRect(bx, by, m*.035, bh);
};
ART.case["E01-10"].ratio = 1.3;

// E01-11 以 circle packing 微調離散曲面：拱形面板，左半最佳化前（不規則、偏差色大）、右半最佳化後，附偏差分布圖
ART.case["E01-11"] = function(g, W, H, r, c){
  const m = Math.min(W, H), P = cam(-.35, .45, m*.32, W*.5, H*.44, 5), nu = 14, nv = 7;
  const S = (u, v) => { const a = (v - .5)*2.2; return [(u - .5)*3, Math.sin(a)*1.1, Math.cos(a)*1.1 - .6]; };
  const J = []; for(let j = 0; j <= nv; j++) for(let i = 0; i <= nu; i++){ const before = i < nu/2, jit = before && i > 0 && j > 0 && j < nv ? .35 : 0; J.push([(i + (r()-.5)*jit)/nu, (j + (r()-.5)*jit)/nv]); }
  const quads = [];
  for(let j = 0; j < nv; j++) for(let i = 0; i < nu; i++){ const ids = [j*(nu+1)+i, j*(nu+1)+i+1, (j+1)*(nu+1)+i+1, (j+1)*(nu+1)+i], uv = ids.map(k => J[k]), pts = uv.map(p => P(S(p[0], p[1])));
    const cu = uv.reduce((s, p) => s + p[0], 0)/4, cv = uv.reduce((s, p) => s + p[1], 0)/4, dev = i < nu/2 ? .45 + r()*.55 : r()*.2;
    quads.push({pts, cu, cv, dev, d: P(S(cu, cv))[2]}); }
  quads.sort((a, b) => a.d - b.d).forEach(q => { path(g, q.pts); g.fillStyle = heat(q.dev, .75); g.fill(); g.strokeStyle = "rgba(0,0,0,.6)"; g.lineWidth = 1; g.stroke();
    const cc = P(S(q.cu, q.cv)), rr = Math.min(...q.pts.map((p, k) => segD(cc[0], cc[1], p, q.pts[(k+1) % 4])))*.85; circ(g, cc[0], cc[1], rr); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = .7; g.stroke(); });
  const a = P(S(.5, 0)), b = P(S(.5, 1)); g.setLineDash([4, 3]); g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(a[0], a[1] + 10); g.lineTo(b[0], b[1] - 10); g.stroke(); g.setLineDash([]);
  // 偏差直方圖：前寬後窄
  const by = H - m*.06, bw = W*.36;
  [[m*.06, [.2, .5, .8, 1, .7, .9, .6, .4], "#E07A4A"], [W*.56, [.1, 1, .5, .15, 0, 0, 0, 0], "#4AA8D0"]].forEach(([x, hs, col]) => { hs.forEach((h, i) => { g.fillStyle = col; g.fillRect(x + i*bw/8, by - h*m*.14, bw/8 - 2, h*m*.14); }); g.fillStyle = "rgba(255,255,255,.4)"; g.fillRect(x, by, bw, 1); });
};
ART.case["E01-11"].ratio = .85;

// E01-12 可控制的 circle packing（Processing）：米色紙上的同心圓筆觸，圓沿著一條設計曲線變大
ART.case["E01-12"] = function(g, W, H, r, c){
  const m = Math.min(W, H), ph = r()*TAU;
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  const curve = x => H*.5 + Math.sin(x/W*TAU*1.1 + ph)*H*.25;
  const C = pack(r, {w: W, h: H, n: 260, tries: 4000, minR: m*.01, gap: m*.008, edge: (x, y) => Math.min(x, y, W - x, H - y) - m*.03, maxR: (x, y) => m*(.015 + .1*Math.exp(-(((y - curve(x))/(m*.18))**2)))});
  g.strokeStyle = INK; g.lineWidth = .6;
  C.forEach(([x, y, R]) => { for(let rr = R; rr > .8; rr -= 2.4){ circ(g, x, y, rr); g.stroke(); } });
  // 控制曲線
  g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1.4; g.setLineDash([5, 4]); g.beginPath(); for(let x = 0; x <= W; x += 4){ const y = curve(x); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.setLineDash([]);
};
ART.case["E01-12"].ratio = .8;

// E01-13 植物生態系：基地鳥瞰，樹冠圓以競爭決定分布，步道穿越，枯死者打叉
ART.case["E01-13"] = function(g, W, H, r, c){
  const m = Math.min(W, H), nz = U.vnoise((r()*1e6)|0);
  for(let y = 0; y < H; y += 6) for(let x = 0; x < W; x += 6){ const v = nz(x/60, y/60); g.fillStyle = `rgba(${60 + v*30|0},${90 + v*50|0},${55 + v*20|0},.28)`; g.fillRect(x, y, 6, 6); }
  const ph = r()*TAU, pth = x => H*.55 + Math.sin(x/W*4 + ph)*H*.18;
  g.strokeStyle = "rgba(230,215,180,.35)"; g.lineWidth = m*.06; g.lineCap = "round"; g.beginPath(); for(let x = -10; x <= W + 10; x += 6){ const y = pth(x); x > -10 ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  const C = pack(r, {w: W, h: H, n: 170, tries: 2500, minR: m*.018, gap: -m*.012, maxR: (x, y) => m*(.03 + .07*nz(x/80 + 3, y/80)), edge: (x, y) => Math.abs(y - pth(x)) - m*.04});
  const green = "#6FAF5F";
  C.forEach(([x, y, R]) => { circ(g, x + R*.35, y + R*.35, R); g.fillStyle = "rgba(0,0,0,.35)"; g.fill(); });
  C.forEach(([x, y, R], i) => { const sp = i % 3 === 0 ? c : green, gr = g.createRadialGradient(x - R*.3, y - R*.3, R*.1, x, y, R); gr.addColorStop(0, "rgba(255,255,255,.55)"); gr.addColorStop(.4, sp); gr.addColorStop(1, "rgba(20,30,20,.9)"); g.fillStyle = gr; circ(g, x, y, R); g.fill();
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = .6; circ(g, x, y, R*1.35); g.stroke(); });
  // 競爭落敗者
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.2;
  for(let k = 0; k < 14; k++){ const x = r()*W, y = r()*H; if(Math.abs(y - pth(x)) < m*.05) continue; g.beginPath(); g.moveTo(x - 3, y - 3); g.lineTo(x + 3, y + 3); g.moveTo(x + 3, y - 3); g.lineTo(x - 3, y + 3); g.stroke(); }
};
ART.case["E01-13"].ratio = .9;

// E01-14 d3.pack 階層圓：根圓 → 群組 → 葉節點，依深度加深，一個群組被選取
ART.case["E01-14"] = function(g, W, H, r, c){
  const m = Math.min(W, H), cx = W/2, cy = H/2, R0 = m*.46;
  circ(g, cx, cy, R0); g.fillStyle = U.rgba(c, .1); g.fill(); g.strokeStyle = U.rgba(c, .5); g.lineWidth = 1; g.stroke();
  const inCirc = (X, Y, RR) => (x, y) => RR - Math.hypot(x - X, y - Y);
  const G = pack(r, {x0: cx - R0, y0: cy - R0, w: 2*R0, h: 2*R0, n: 7, tries: 1500, minR: R0*.18, gap: R0*.03, maxR: (x, y, t) => R0*(.5 - .25*t), edge: inCirc(cx, cy, R0 - R0*.03)});
  const pick = (r()*G.length)|0;
  G.forEach(([x, y, R], gi) => { circ(g, x, y, R); g.fillStyle = U.rgba(c, .2); g.fill(); g.strokeStyle = gi === pick ? "#fff" : U.rgba(c, .7); g.lineWidth = gi === pick ? 2 : 1; g.stroke();
    const L = pack(r, {x0: x - R, y0: y - R, w: 2*R, h: 2*R, n: 30, tries: 500, minR: R*.08, gap: R*.03, maxR: () => R*.38, edge: inCirc(x, y, R*.95)});
    L.forEach(([lx, ly, lr]) => { circ(g, lx, ly, lr); g.fillStyle = gi === pick ? U.rgba(ACC, .75) : U.rgba(c, .5); g.fill();
      if(lr > R*.22){ const S2 = pack(r, {x0: lx - lr, y0: ly - lr, w: 2*lr, h: 2*lr, n: 8, tries: 150, minR: lr*.12, gap: 1, maxR: () => lr*.4, edge: inCirc(lx, ly, lr*.92)}); S2.forEach(([a, b, q]) => { circ(g, a, b, q); g.fillStyle = "rgba(255,255,255,.55)"; g.fill(); }); } }); });
};
ART.case["E01-14"].ratio = 1;
})();
