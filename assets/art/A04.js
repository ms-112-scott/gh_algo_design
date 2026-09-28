/* A04 遞迴分割：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
const TAU = Math.PI * 2;

/* ---------- 共用小工具 ---------- */
// 矩形遞迴分割：回傳葉子 [x,y,w,h,depth]；stop(x,y,w,h,d) 為真就停
function bsp(x, y, w, h, r, stop, lo, hi){
  lo = lo ?? .3; hi = hi ?? .7;
  const out = [];
  const rec = (x, y, w, h, d) => {
    if(stop(x, y, w, h, d)){ out.push([x, y, w, h, d]); return; }
    const t = lo + r()*(hi - lo);
    if(w > h ? r() < .82 : r() < .18){ const s = w*t; rec(x, y, s, h, d+1); rec(x+s, y, w-s, h, d+1); }
    else { const s = h*t; rec(x, y, w, s, d+1); rec(x, y+s, w, h-s, d+1); }
  };
  rec(x, y, w, h, 0);
  return out;
}
// 多邊形被直線（點 p、方向 d）切成兩半
function cutPoly(P, p, d){
  const nx = -d[1], ny = d[0], side = q => (q[0]-p[0])*nx + (q[1]-p[1])*ny, A = [], B = [];
  for(let i = 0; i < P.length; i++){
    const a = P[i], b = P[(i+1)%P.length], sa = side(a), sb = side(b);
    if(sa >= 0) A.push(a); if(sa <= 0) B.push(a);
    if((sa > 0 && sb < 0) || (sa < 0 && sb > 0)){ const t = sa/(sa - sb), q = [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t]; A.push(q); B.push(q); }
  }
  return [A, B];
}
function area(P){ let s = 0; for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1)%P.length]; s += a[0]*b[1] - b[0]*a[1]; } return Math.abs(s)/2; }
function centroid(P){ let x = 0, y = 0; P.forEach(q => { x += q[0]; y += q[1]; }); return [x/P.length, y/P.length]; }
// 長軸方向（以最長邊近似 OBB 長軸）
function longAxis(P){
  let best = 0, dir = [1, 0];
  for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1)%P.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]); if(L > best){ best = L; dir = [(b[0]-a[0])/L, (b[1]-a[1])/L]; } }
  // 沿該方向的投影長度與垂直向投影長度比較，取較長者
  const ext = d => { let mn = 1e9, mx = -1e9; P.forEach(q => { const t = q[0]*d[0] + q[1]*d[1]; mn = Math.min(mn, t); mx = Math.max(mx, t); }); return [mn, mx]; };
  const e1 = ext(dir), n = [-dir[1], dir[0]], e2 = ext(n);
  return (e1[1]-e1[0]) >= (e2[1]-e2[0]) ? {d: dir, e: e1} : {d: n, e: e2};
}
// OBB 遞迴分割多邊形：沿長軸在比例 t 處用垂直線切
function obbSplit(P, r, minA, maxD, jitter){
  const out = [];
  const rec = (Q, d) => {
    if(Q.length < 3) return;
    if(area(Q) < minA || d >= maxD){ out.push([Q, d]); return; }
    const {d: dir, e} = longAxis(Q), t = e[0] + (e[1]-e[0])*(.38 + r()*.24);
    const ang = (r() - .5)*(jitter || 0), cd = [dir[0]*Math.cos(ang) - dir[1]*Math.sin(ang), dir[0]*Math.sin(ang) + dir[1]*Math.cos(ang)];
    const p = [dir[0]*t, dir[1]*t], [A, B] = cutPoly(Q, p, [-cd[1], cd[0]]);
    if(A.length < 3 || B.length < 3){ out.push([Q, d]); return; }
    rec(A, d+1); rec(B, d+1);
  };
  rec(P, 0);
  return out;
}
// 多邊形往內縮（以重心縮放近似 offset）
function shrink(P, k){ const [cx, cy] = centroid(P); return P.map(q => [cx + (q[0]-cx)*k, cy + (q[1]-cy)*k]); }
function shrinkBy(P, dist){ const [cx, cy] = centroid(P); return P.map(q => { const dx = q[0]-cx, dy = q[1]-cy, L = Math.hypot(dx, dy) || 1; const k = Math.max(0, (L - dist)/L); return [cx + dx*k, cy + dy*k]; }); }
// 等角投影
const iso = (ox, oy, s) => (x, y, z) => [ox + (x - y)*s*.866, oy + (x + y)*s*.5 - z*s];
// 顏色：家族色與白色混合
function mix(hex, t, to){ const a = U.rgb(hex), b = to ? U.rgb(to) : [255, 255, 255]; return `rgb(${a.map((v,i) => Math.round(v + (b[i]-v)*t)).join(",")})`; }
function shade(hex, k){ const a = U.rgb(hex); return `rgb(${a.map(v => Math.round(Math.min(255, v*k))).join(",")})`; }

// 以 Catmull-Clark 細分四邊形網格；disp 為每代新面點沿法向擾動量
function catmull(V, F, levels, r, disp){
  for(let L = 0; L < levels; L++){
    const fp = F.map(f => { const p = [0,0,0]; f.forEach(i => { p[0] += V[i][0]; p[1] += V[i][1]; p[2] += V[i][2]; }); return p.map(v => v/f.length); });
    if(disp){ F.forEach((f, k) => { const a = V[f[0]], b = V[f[1]], c = V[f[2]], u = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], w = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
      let n = [u[1]*w[2]-u[2]*w[1], u[2]*w[0]-u[0]*w[2], u[0]*w[1]-u[1]*w[0]]; const l = Math.hypot(...n) || 1; const s = disp(L, r)*Math.sqrt(l); fp[k] = fp[k].map((v, i) => v + n[i]/l*s); }); }
    const E = new Map(), key = (a, b) => a < b ? a + "_" + b : b + "_" + a;
    F.forEach((f, k) => f.forEach((a, i) => { const b = f[(i+1)%f.length], kk = key(a, b); if(!E.has(kk)) E.set(kk, {a, b, f: []}); E.get(kk).f.push(k); }));
    const NV = V.map(v => v.slice()), eIdx = new Map();
    const fIdx = fp.map(p => NV.push(p) - 1);
    E.forEach((e, kk) => { const a = V[e.a], b = V[e.b]; let p;
      if(e.f.length === 2){ const f1 = fp[e.f[0]], f2 = fp[e.f[1]]; p = [0,1,2].map(i => (a[i] + b[i] + f1[i] + f2[i])/4); } else p = [0,1,2].map(i => (a[i] + b[i])/2);
      eIdx.set(kk, NV.push(p) - 1); });
    // 更新原頂點
    const adjF = V.map(() => []), adjE = V.map(() => []);
    F.forEach((f, k) => f.forEach(i => adjF[i].push(k)));
    E.forEach(e => { adjE[e.a].push(e); adjE[e.b].push(e); });
    V.forEach((P, i) => { const n = adjF[i].length; if(n < 3 || adjE[i].some(e => e.f.length < 2)) return;
      const Fa = [0,0,0], Ra = [0,0,0];
      adjF[i].forEach(k => { for(let t = 0; t < 3; t++) Fa[t] += fp[k][t]/n; });
      adjE[i].forEach(e => { for(let t = 0; t < 3; t++) Ra[t] += (V[e.a][t] + V[e.b][t])/2/adjE[i].length; });
      NV[i] = [0,1,2].map(t => (Fa[t] + 2*Ra[t] + (n-3)*P[t])/n); });
    const NF = [];
    F.forEach((f, k) => f.forEach((a, i) => { const b = f[(i+1)%f.length], z = f[(i-1+f.length)%f.length]; NF.push([a, eIdx.get(key(a, b)), fIdx[k], eIdx.get(key(z, a))]); }));
    V = NV; F = NF;
  }
  return [V, F];
}
function cube(){ return [[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]], [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]]; }
// 把網格以旋轉＋正交投影畫出（面依深度排序、依法向上色）
function drawMesh(g, V, F, cx, cy, s, yaw, pitch, c, opt){
  opt = opt || {};
  const cy_ = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const T = V.map(([x, y, z]) => { const x1 = x*cy_ - y*sy, y1 = x*sy + y*cy_; const y2 = y1*cp - z*sp, z2 = y1*sp + z*cp; return [cx + x1*s, cy - z2*s, y2]; });
  const light = [-.4, -.6, .7], ll = Math.hypot(...light);
  const faces = F.map(f => { const P = f.map(i => T[i]); let z = 0; P.forEach(p => z += p[2]);
    const a = P[0], b = P[1], d = P[2], u = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], w = [d[0]-a[0], d[1]-a[1], d[2]-a[2]];
    const n = [u[1]*w[2]-u[2]*w[1], u[2]*w[0]-u[0]*w[2], u[0]*w[1]-u[1]*w[0]], nl = Math.hypot(...n) || 1;
    return {P, z: z/P.length, cz: n[2]/nl, lam: Math.abs((n[0]*light[0] + n[1]*light[1] + n[2]*light[2])/nl/ll)}; });
  faces.sort((a, b) => b.z - a.z);
  faces.forEach(f => {
    if(!opt.wire){ g.fillStyle = opt.fill ? opt.fill(f.lam) : shade(c, .25 + f.lam*.95); U.poly(g, f.P, true); g.fill(); }
    if(opt.stroke !== false){ g.strokeStyle = opt.wire ? U.rgba(c, .55) : "rgba(0,0,0,.35)"; g.lineWidth = opt.lw || .5; U.poly(g, f.P, true); g.stroke(); }
  });
  return T;
}
// 合成灰階「影像」：幾個高斯亮塊＋雜訊，回傳 (x,y)->0..1（x,y 為 0..1）
function fakeImage(r){
  const nz = U.vnoise((r()*1e9)|0), bl = [...Array(4)].map(() => [r(), r(), .08 + r()*.18, r() < .5 ? 1 : -.7]);
  return (x, y) => { let v = .35 + nz(x*4, y*4)*.25; bl.forEach(([bx, by, s, k]) => { v += k*.6*Math.exp(-((x-bx)**2 + (y-by)**2)/(2*s*s)); }); return Math.max(0, Math.min(1, v)); };
}
// 在矩形內取樣，回傳平均與變異數
function stat(f, x, y, w, h, n){
  let s = 0, s2 = 0; n = n || 4;
  for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){ const v = f(x + (i+.5)/n*w, y + (j+.5)/n*h); s += v; s2 += v*v; }
  const m = s/(n*n); return [m, s2/(n*n) - m*m];
}
// squarified treemap
function squarify(vals, x, y, w, h){
  const out = [], tot = vals.reduce((a, b) => a + b, 0), items = vals.map((v, i) => [v/tot*w*h, i]).sort((a, b) => b[0]-a[0]);
  let rx = x, ry = y, rw = w, rh = h, row = [];
  const worst = (row, s) => { const sum = row.reduce((a, b) => a + b[0], 0); let mx = 0, mn = 1e18; row.forEach(q => { mx = Math.max(mx, q[0]); mn = Math.min(mn, q[0]); }); return Math.max(s*s*mx/(sum*sum), sum*sum/(s*s*mn)); };
  const lay = row => { const sum = row.reduce((a, b) => a + b[0], 0);
    if(rw >= rh){ const cw = sum/rh; let yy = ry; row.forEach(q => { const hh = q[0]/cw; out.push([rx, yy, cw, hh, q[1]]); yy += hh; }); rx += cw; rw -= cw; }
    else { const ch = sum/rw; let xx = rx; row.forEach(q => { const ww = q[0]/ch; out.push([xx, ry, ww, ch, q[1]]); xx += ww; }); ry += ch; rh -= ch; } };
  items.forEach(it => { const s = Math.min(rw, rh); if(!row.length || worst(row.concat([it]), s) <= worst(row, s)) row.push(it); else { lay(row); row = [it]; } });
  if(row.length) lay(row);
  return out;
}
// 小人剪影（尺度參考）
function person(g, x, y, h, col){ g.fillStyle = col; g.beginPath(); g.arc(x, y - h*.9, h*.1, 0, TAU); g.fill(); g.fillRect(x - h*.1, y - h*.78, h*.2, h*.42); g.fillRect(x - h*.09, y - h*.38, h*.07, h*.38); g.fillRect(x + h*.02, y - h*.38, h*.07, h*.38); }

const MON = ["#E4572E", "#F2C230", "#2F5FD0", "#F4F1EA"];

/* ================================================================
   變形
   ================================================================ */
ART.var["A04"] = [
  // V01 四分樹：正方形一次切四塊，右側附樹狀圖
  function(g, W, H, r, c){
    const nz = U.vnoise((r()*1e9)|0), S = Math.min(W*.62, H*.86), ox = W*.05, oy = (H - S)/2, leaves = [];
    const rec = (x, y, s, d, path) => {
      const n = nz((x + s/2)/S*3, (y + s/2)/S*3);
      if(d >= 6 || (d >= 1 && n < .25 + d*.1)){ leaves.push([x, y, s, d]); return; }
      const h = s/2; rec(x, y, h, d+1); rec(x+h, y, h, d+1); rec(x, y+h, h, d+1); rec(x+h, y+h, h, d+1);
    };
    rec(ox, oy, S, 0);
    leaves.forEach(([x, y, s, d]) => { g.fillStyle = U.rgba(c, .1 + d*.13); g.fillRect(x+.5, y+.5, s-1, s-1); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = .7; g.strokeRect(x+.5, y+.5, s-1, s-1); });
    // 右側：四分樹深度分佈（每層節點數長條）
    const cnt = [0,0,0,0,0,0,0]; leaves.forEach(l => cnt[l[3]]++);
    const bx = ox + S + W*.05, bw = W - bx - W*.04, mx = Math.max(...cnt);
    for(let d = 0; d < 7; d++){ const y = oy + d/7*S, h = S/7*.6; g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(bx, y, bw, h); g.fillStyle = U.rgba(c, .3 + d*.1); g.fillRect(bx, y, bw*cnt[d]/mx, h);
      for(let k = 0; k < Math.min(4**d, 16); k++){ g.fillStyle = "rgba(255,255,255,.6)"; g.fillRect(bx + k*(bw/16), y + h + 2, bw/16 - 1, 2); } }
  },
  // V02 吸引子控制細緻度
  function(g, W, H, r, c){
    const ax = W*(.3 + r()*.4), ay = H*(.3 + r()*.4), D = Math.hypot(W, H);
    const gl = g.createRadialGradient(ax, ay, 0, ax, ay, D*.35); gl.addColorStop(0, U.rgba(c, .55)); gl.addColorStop(1, U.rgba(c, 0)); g.fillStyle = gl; g.fillRect(0, 0, W, H);
    const L = bsp(W*.04, H*.04, W*.92, H*.92, r, (x, y, w, h, d) => { const dd = Math.hypot(x + w/2 - ax, y + h/2 - ay)/D; const m = 4 + dd*D*.35; return (w < m && h < m) || d > 12; });
    L.forEach(([x, y, w, h]) => { const dd = Math.hypot(x + w/2 - ax, y + h/2 - ay)/D; g.strokeStyle = `rgba(255,255,255,${.85 - dd})`; g.lineWidth = .8; g.strokeRect(x+.5, y+.5, w-1, h-1); });
    for(let k = 1; k <= 3; k++){ g.strokeStyle = U.rgba(c, .5/k); g.setLineDash([3, 4]); g.beginPath(); g.arc(ax, ay, k*D*.1, 0, TAU); g.stroke(); }
    g.setLineDash([]); g.fillStyle = "#fff"; g.beginPath(); g.arc(ax, ay, 5, 0, TAU); g.fill(); g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.arc(ax, ay, 9, 0, TAU); g.stroke();
  },
  // V03 影像驅動：灰階影像的變異數決定是否續切，填平均灰
  function(g, W, H, r, c){
    const f = fakeImage(r), S = Math.min(W, H)*.92, ox = (W - S)/2, oy = (H - S)/2;
    const rec = (x, y, s, d) => { const [m, v] = stat(f, x, y, s, s); if(d >= 7 || (d >= 2 && v < .0015)){ const k = Math.round(m*230);
      g.fillStyle = `rgb(${k},${k},${Math.min(255, k + 8)})`; g.fillRect(ox + x*S, oy + y*S, s*S, s*S); g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = .5; g.strokeRect(ox + x*S, oy + y*S, s*S, s*S);
      if(v > .0008){ g.fillStyle = U.rgba(c, .5); g.fillRect(ox + x*S, oy + y*S, 2, 2); } return; }
      const h = s/2; rec(x, y, h, d+1); rec(x+h, y, h, d+1); rec(x, y+h, h, d+1); rec(x+h, y+h, h, d+1); };
    rec(0, 0, 1, 0);
    g.strokeStyle = c; g.lineWidth = 2; g.strokeRect(ox, oy, S, S);
  },
  // V04 任意多邊形基地（OBB 分割）：一塊不規則基地＋虛線 OBB
  function(g, W, H, r, c){
    const cx = W/2, cy = H/2, R = Math.min(W, H)*.42, n = 7, P = [];
    for(let i = 0; i < n; i++){ const a = i/n*TAU + r()*.4; const rr = R*(.7 + r()*.3); P.push([cx + Math.cos(a)*rr*W/Math.min(W,H)*.9, cy + Math.sin(a)*rr]); }
    const parts = obbSplit(P, r, area(P)/22, 8, .05);
    parts.forEach(([Q, d]) => { g.fillStyle = U.rgba(c, .08 + (d%4)*.06); U.poly(g, Q, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = .9; g.stroke();
      const [qx, qy] = centroid(Q); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(qx-1, qy-1, 2, 2); });
    // 第一刀的 OBB 虛線框
    const {d: dir, e} = longAxis(P), nrm = [-dir[1], dir[0]]; let mn = 1e9, mx = -1e9; P.forEach(q => { const t = q[0]*nrm[0] + q[1]*nrm[1]; mn = Math.min(mn, t); mx = Math.max(mx, t); });
    const corner = (a, b) => [dir[0]*a + nrm[0]*b, dir[1]*a + nrm[1]*b];
    g.setLineDash([4, 4]); g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1.2; U.poly(g, [corner(e[0], mn), corner(e[1], mn), corner(e[1], mx), corner(e[0], mx)], true); g.stroke(); g.setLineDash([]);
    g.strokeStyle = c; g.lineWidth = 2.5; U.poly(g, P, true); g.stroke();
  },
  // V05 3D 量體切分（BSP 盒子）：等角盒子堆疊
  function(g, W, H, r, c){
    const boxes = [];
    const rec = (x, y, z, a, b, h, d) => {
      if(d >= 5 || (d > 1 && r() < .2) || Math.max(a, b, h) < 1.4){ boxes.push([x, y, z, a, b, h]); return; }
      const m = Math.max(a, b, h), t = .35 + r()*.3;
      if(m === a){ rec(x, y, z, a*t, b, h, d+1); rec(x + a*t, y, z, a*(1-t), b, h, d+1); }
      else if(m === b){ rec(x, y, z, a, b*t, h, d+1); rec(x, y + b*t, z, a, b*(1-t), h, d+1); }
      else { rec(x, y, z, a, b, h*t, d+1); rec(x, y, z + h*t, a, b, h*(1-t), d+1); }
    };
    rec(0, 0, 0, 6, 5, 7, 0);
    const s = Math.min(W, H)/13, P = iso(W/2 - s*.5, H*.5, s);
    boxes.sort((A, B) => (A[0] + A[1] + A[2]) - (B[0] + B[1] + B[2]));
    const gap = .12;
    boxes.forEach(([x, y, z, a, b, h], i) => { if(r() < .1) return;
      x += gap; y += gap; z += gap; a -= gap*2; b -= gap*2; h -= gap*2;
      const col = r() < .2 ? c : "#9AA0AE", top = [P(x,y,z+h), P(x+a,y,z+h), P(x+a,y+b,z+h), P(x,y+b,z+h)], L = [P(x,y+b,z), P(x+a,y+b,z), P(x+a,y+b,z+h), P(x,y+b,z+h)], R = [P(x+a,y,z), P(x+a,y+b,z), P(x+a,y+b,z+h), P(x+a,y,z+h)];
      [[top, 1.05], [L, .65], [R, .42]].forEach(([q, k]) => { g.fillStyle = shade(col, k); U.poly(g, q, true); g.fill(); g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = .6; g.stroke(); }); });
  },
  // V06 面積比例驅動 Treemap：住宅平面（牆、門、面積條）
  function(g, W, H, r, c){
    const areas = [28, 16, 12, 10, 9, 6, 5, 4].map(a => a*(.8 + r()*.4));
    const ox = W*.08, oy = H*.08, w = W*.84, h = H*.66, rooms = [];
    const rec = (list, x, y, w, h) => { if(list.length === 1){ rooms.push([x, y, w, h, list[0]]); return; }
      const tot = list.reduce((a, b) => a + b[0], 0); let k = 1, acc = list[0][0]; while(k < list.length - 1 && acc + list[k][0] < tot/2){ acc += list[k][0]; k++; }
      const t = acc/tot; if(w >= h){ rec(list.slice(0, k), x, y, w*t, h); rec(list.slice(k), x + w*t, y, w*(1-t), h); } else { rec(list.slice(0, k), x, y, w, h*t); rec(list.slice(k), x, y + h*t, w, h*(1-t)); } };
    rec(areas.map((a, i) => [a, i]), ox, oy, w, h);
    rooms.forEach(([x, y, w, h, [a, i]]) => { g.fillStyle = i === 0 ? U.rgba(c, .35) : `rgba(255,255,255,${.04 + (i%3)*.04})`; g.fillRect(x, y, w, h);
      g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = .5; for(let k = 1; k < 3; k++){ g.beginPath(); g.moveTo(x + w*k/3, y + h/2 - 3); g.lineTo(x + w*k/3, y + h/2 + 3); g.stroke(); } });
    // 牆（粗）＋門洞
    g.strokeStyle = "#EDEDED"; g.lineWidth = 3; g.lineCap = "square";
    rooms.forEach(([x, y, w, h]) => { g.strokeRect(x, y, w, h); });
    g.strokeStyle = "#1A1A21"; g.lineWidth = 4;
    rooms.forEach(([x, y, w, h]) => { const dw = Math.min(10, w*.3); g.beginPath(); g.moveTo(x + w*.2, y + h); g.lineTo(x + w*.2 + dw, y + h); g.stroke();
      g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = .7; g.beginPath(); g.arc(x + w*.2, y + h, dw, -Math.PI/2, 0); g.stroke(); g.strokeStyle = "#1A1A21"; g.lineWidth = 4; });
    // 面積需求條
    const by = oy + h + H*.06, tot = areas.reduce((a, b) => a + b, 0); let bx = ox;
    areas.forEach((a, i) => { const bw = a/tot*w; g.fillStyle = i === 0 ? c : `rgba(255,255,255,${.25 + (i%3)*.15})`; g.fillRect(bx, by, bw - 2, H*.06); bx += bw; });
  },
  // V07 立面開窗分割：樓層 → 開間 → 窗框
  function(g, W, H, r, c){
    const gx = W*.12, gw = W*.76, top = H*.08, base = H*.92, floors = 6 + ((r()*3)|0), fh = (base - top)/floors;
    g.fillStyle = "#2A2A33"; g.fillRect(gx, top, gw, base - top);
    for(let f = 0; f < floors; f++){
      const y = top + f*fh, ground = f === floors - 1;
      const bays = bsp(gx, y, gw, fh, r, (x, yy, w, h, d) => d >= 1 && (w < gw*.22 || d >= 3), .3, .7).filter(b => b[3] === fh || true);
      bays.forEach(([x, yy, w, h], k) => { const kind = ground ? 0 : (k + f) % 3;
        const ix = x + w*.12, iy = yy + h*.18, iw = w*.76, ih = h*.64;
        if(kind === 2){ g.fillStyle = "#3A3A45"; g.fillRect(ix, iy, iw, ih); return; }
        const gl = g.createLinearGradient(ix, iy, ix + iw, iy + ih); gl.addColorStop(0, ground ? U.rgba(c, .75) : "rgba(140,170,210,.55)"); gl.addColorStop(1, "rgba(40,50,70,.8)");
        g.fillStyle = gl; g.fillRect(ix, iy, iw, ih); g.strokeStyle = "#D8D8D8"; g.lineWidth = 1.4; g.strokeRect(ix, iy, iw, ih);
        g.lineWidth = .7; g.beginPath(); g.moveTo(ix + iw/2, iy); g.lineTo(ix + iw/2, iy + ih); if(!ground){ g.moveTo(ix, iy + ih*.35); g.lineTo(ix + iw, iy + ih*.35); } g.stroke(); });
      g.fillStyle = "#4A4A56"; g.fillRect(gx - 3, y + fh - 2, gw + 6, 3);
    }
    g.fillStyle = c; g.fillRect(gx - 6, top - 5, gw + 12, 5);
    g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, base); g.lineTo(W, base); g.stroke();
    person(g, gx + gw*.85, base, fh*.7, "rgba(255,255,255,.7)");
  },
  // V08 Mondrian 上色與線寬：米白畫布、深度決定黑線粗細
  function(g, W, H, r, c){
    const ox = W*.08, oy = H*.08, w = W*.84, h = H*.84, lines = [];
    const rec = (x, y, w, h, d) => {
      if(d >= 7 || (d >= 3 && r() < .22) || Math.min(w, h) < 14){ const col = r() < .6 ? MON[3] : MON[(r()*3)|0]; g.fillStyle = col; g.fillRect(x, y, w, h); return; }
      const t = .25 + r()*.5;
      if(w > h ? r() < .8 : r() < .2){ rec(x, y, w*t, h, d+1); rec(x + w*t, y, w*(1-t), h, d+1); lines.push([x + w*t, y, x + w*t, y + h, d]); }
      else { rec(x, y, w, h*t, d+1); rec(x, y + h*t, w, h*(1-t), d+1); lines.push([x, y + h*t, x + w, y + h*t, d]); }
    };
    rec(ox, oy, w, h, 0);
    g.strokeStyle = "#111"; g.lineCap = "square";
    lines.forEach(([a, b, x2, y2, d]) => { g.lineWidth = Math.max(1.2, 7 - d*1.3); g.beginPath(); g.moveTo(a, b); g.lineTo(x2, y2); g.stroke(); });
    g.lineWidth = 7; g.strokeRect(ox, oy, w, h);
  },
  // V09 曲面上分割：UV 分割映射到起伏屋面
  function(g, W, H, r, c){
    const L = bsp(0, 0, 1, 1, r, (x, y, w, h, d) => (w < .07 && h < .07) || d > 9 || (d > 3 && r() < .12));
    const amp = .25 + r()*.1, S = (u, v) => { const x = (u - .5)*2.2, y = (v - .5)*2.2, z = amp*Math.sin(u*Math.PI*1.3 + 1)*Math.cos(v*Math.PI*.8) + .3*Math.sin(u*Math.PI);
      return [W/2 + (x - y)*W*.23, H*.55 + (x + y)*H*.11 - z*H*.35, z]; };
    const panels = L.map(([x, y, w, h, d]) => { const pad = .006, pts = []; const sub = 4;
      for(let k = 0; k <= sub; k++) pts.push(S(x + pad + (w - 2*pad)*k/sub, y + pad));
      for(let k = 0; k <= sub; k++) pts.push(S(x + w - pad, y + pad + (h - 2*pad)*k/sub));
      for(let k = 0; k <= sub; k++) pts.push(S(x + w - pad - (w - 2*pad)*k/sub, y + h - pad));
      for(let k = 0; k <= sub; k++) pts.push(S(x + pad, y + h - pad - (h - 2*pad)*k/sub));
      return {pts, key: x + y + w/2 + h/2, d, z: S(x + w/2, y + h/2)[2]}; });
    panels.sort((a, b) => a.key - b.key);
    panels.forEach(p => { g.fillStyle = mix(c, .15 + (p.z + .3)*.6, "#20202A"); U.poly(g, p.pts, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = .6; g.stroke(); });
    // 地面陰影線
    g.strokeStyle = "rgba(255,255,255,.12)"; for(let k = 0; k < 8; k++){ g.beginPath(); g.moveTo(0, H*.88 + k*3); g.lineTo(W, H*.88 + k*3); g.stroke(); }
  },
  // V10 可製造的面板與框料：雷切排版＋料單長條
  function(g, W, H, r, c){
    const sx = W*.06, sy = H*.06, sw = W*.88, sh = H*.62;
    g.fillStyle = "#26262E"; g.fillRect(sx, sy, sw, sh);
    const L = bsp(sx + 6, sy + 6, sw - 12, sh - 12, r, (x, y, w, h, d) => (w < sw*.14 && h < sh*.14) || d > 6 || (d > 2 && r() < .15));
    const bins = {};
    L.forEach(([x, y, w, h]) => { const fw = Math.max(2, Math.min(w, h)*.12);
      g.strokeStyle = c; g.lineWidth = 1; g.strokeRect(x + 1, y + 1, w - 2, h - 2);
      g.strokeStyle = "#fff"; g.lineWidth = .8; g.setLineDash([]); g.strokeRect(x + 1 + fw, y + 1 + fw, w - 2 - fw*2, h - 2 - fw*2);
      g.fillStyle = "rgba(255,255,255,.7)"; [[x+1+fw/2, y+1+fw/2], [x+w-1-fw/2, y+1+fw/2], [x+1+fw/2, y+h-1-fw/2], [x+w-1-fw/2, y+h-1-fw/2]].forEach(([a, b]) => { g.beginPath(); g.arc(a, b, .9, 0, TAU); g.fill(); });
      const k = Math.round(Math.log2(w*h)); bins[k] = (bins[k] || 0) + 1; });
    // 料單：依尺寸分群的數量
    const keys = Object.keys(bins).map(Number).sort((a, b) => a - b), mx = Math.max(...Object.values(bins)), by = sy + sh + H*.07, bh = H - by - H*.06, bw = sw/keys.length;
    keys.forEach((k, i) => { const hh = bins[k]/mx*bh; g.fillStyle = i%2 ? U.rgba(c, .8) : "rgba(255,255,255,.75)"; g.fillRect(sx + i*bw + 2, by + bh - hh, bw - 4, hh);
      const s = Math.min(bw*.5, 3 + i*1.2); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = .6; g.strokeRect(sx + i*bw + bw/2 - s/2, by + bh + 3, s, s*.6); });
  },
  // V11 逐層動畫化：同一分割在 maxDepth = 0..5 的連續格
  function(g, W, H, r, c){
    const seq = [...Array(64)].map(() => [.3 + r()*.4, r()]), cols = 2, rows = 3, pad = 6, cw = (W - pad*(cols+1))/cols, ch = (H - pad*(rows+1))/rows;
    for(let k = 0; k < 6; k++){
      const ox = pad + (k%cols)*(cw + pad), oy = pad + ((k/cols)|0)*(ch + pad); let idx = 0;
      g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(ox, oy, cw, ch);
      const rec = (x, y, w, h, d, id) => {
        if(d >= k || id >= 64){ g.fillStyle = d === k && k > 0 ? U.rgba(c, .25 + ((id*7)%5)*.1) : "rgba(255,255,255,.07)"; g.fillRect(x + 1, y + 1, w - 2, h - 2); return; }
        const [t, q] = seq[id % 64];
        if(w > h ? q < .85 : q < .15){ const s = w*t; rec(x, y, s, h, d+1, id*2+1); rec(x+s, y, w-s, h, d+1, id*2+2); g.strokeStyle = d === k-1 ? "#fff" : "rgba(255,255,255,.45)"; g.lineWidth = d === k-1 ? 1.4 : .7; g.beginPath(); g.moveTo(x+s, y); g.lineTo(x+s, y+h); g.stroke(); }
        else { const s = h*t; rec(x, y, w, s, d+1, id*2+1); rec(x, y+s, w, h-s, d+1, id*2+2); g.strokeStyle = d === k-1 ? "#fff" : "rgba(255,255,255,.45)"; g.lineWidth = d === k-1 ? 1.4 : .7; g.beginPath(); g.moveTo(x, y+s); g.lineTo(x+w, y+s); g.stroke(); }
      };
      rec(ox + 4, oy + 4, cw - 8, ch - 8, 0, 0);
      // 格號點
      for(let q = 0; q <= k; q++){ g.fillStyle = q === k ? c : "rgba(255,255,255,.5)"; g.beginPath(); g.arc(ox + 8 + q*6, oy + ch - 7, 2, 0, TAU); g.fill(); }
    }
  },
  // V12 網格細分：立方體 → Catmull-Clark 平滑 + 擾動
  function(g, W, H, r, c){
    let [V, F] = cube();
    const s = Math.min(W, H)*.24;
    // 左上小：控制籠
    drawMesh(g, V, F, W*.2, H*.2, s*.35, .6, .5, c, {wire: true, lw: 1});
    [V, F] = catmull(V, F, 4, r, (L) => (L < 2 ? (r() - .35)*.9 : (r() - .5)*.25));
    drawMesh(g, V, F, W*.55, H*.58, s*1.25, .6, .5, c, {lw: .3});
    g.strokeStyle = "rgba(255,255,255,.4)"; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(W*.3, H*.28); g.lineTo(W*.42, H*.38); g.stroke(); g.setLineDash([]);
  },
];

/* ================================================================
   沒有照片的案例
   ================================================================ */
// A04-01 Subdivided Columns：以 1mm 紙板層疊成的細分柱
ART.case["A04-01"] = function(g, W, H, r, c){
  const cx = W/2, top = H*.05, bot = H*.95, R0 = W*.2, N = 150, tilt = .28, ph = [...Array(6)].map(() => r()*TAU);
  const prof = t => { // t: 0 底 → 1 頂
    if(t < .08) return 1.35 - t*2;
    if(t > .86) return 1 + (t - .86)*3.2;
    return 1 - (t - .08)*.18 + .06*Math.sin(t*40);
  };
  for(let k = 0; k < N; k++){
    const t = k/(N-1), y = bot - t*(bot - top), pts = [];
    for(let i = 0; i < 64; i++){ const a = i/64*TAU;
      let rr = prof(t)*(1 + .09*Math.abs(Math.sin(a*8 + ph[0]))); // 多立克溝槽
      rr += .06*Math.sin(a*24 + t*60 + ph[1])*Math.sin(t*22 + ph[2]) + .04*Math.sin(a*48 + t*140 + ph[3]);
      pts.push([cx + Math.cos(a)*R0*rr, y + Math.sin(a)*R0*rr*tilt]); }
    g.fillStyle = mix("#C9B79A", .1 + t*.15, "#1B1B22"); U.poly(g, pts, true); g.fill();
    g.strokeStyle = k%10 === 0 ? U.rgba(c, .9) : "rgba(255,255,255,.35)"; g.lineWidth = k%10 === 0 ? 1 : .45; g.stroke();
  }
  person(g, W*.12, bot, H*.3, "rgba(255,255,255,.55)");
};
ART.case["A04-01"].ratio = 1.35;

// A04-02 Platonic Solids 細分研究：四種控制變數的四個物件
ART.case["A04-02"] = function(g, W, H, r, c){
  const cells = [[W*.27, H*.27], [W*.73, H*.27], [W*.27, H*.73], [W*.73, H*.73]], s = Math.min(W, H)*.14;
  const ds = [L => 0, L => (L === 0 ? .6 : 0), L => (L < 2 ? -.5 : .1), L => (r() - .3)*(L < 2 ? 1.2 : .3)];
  cells.forEach(([x, y], k) => {
    let [V, F] = cube(); [V, F] = catmull(V, F, [1, 3, 3, 4][k], r, ds[k]);
    g.strokeStyle = "rgba(255,255,255,.1)"; g.strokeRect(x - W*.23, y - H*.23, W*.46, H*.46);
    drawMesh(g, V, F, x, y, s*(k === 2 ? 1.9 : k === 0 ? .8 : 1), .5 + k*.3, .55, c, {lw: .25, fill: lam => mix("#D8D4CC", 1 - (.2 + lam*.8), "#15151B")});
  });
};

// A04-03 Digital Grotesque I：一點透視的洞窟室內，四壁布滿遞迴細分紋理
ART.case["A04-03"] = function(g, W, H, r, c){
  const vx = W*.5, vy = H*.48, sand = "#CDB894";
  for(let layer = 0; layer < 9; layer++){
    const k = 1 - layer/9, k2 = 1 - (layer + 1)/9;
    const R1 = [vx - W*.5*k, vy - H*.5*k, W*k, H*k], R2 = [vx - W*.5*k2, vy - H*.5*k2, W*k2, H*k2];
    const lum = .9 - layer*.08;
    // 四面牆的梯形：逐一在其上做遞迴分割，並以透視映射
    const walls = [
      (u, v) => [R1[0] + u*R1[2] + (R2[0] + u*R2[2] - R1[0] - u*R1[2])*v, R1[1] + (R2[1] - R1[1])*v],
      (u, v) => [R1[0] + u*R1[2] + (R2[0] + u*R2[2] - R1[0] - u*R1[2])*v, R1[1] + R1[3] + (R2[1] + R2[3] - R1[1] - R1[3])*v],
      (u, v) => [R1[0] + (R2[0] - R1[0])*v, R1[1] + u*R1[3] + (R2[1] + u*R2[3] - R1[1] - u*R1[3])*v],
      (u, v) => [R1[0] + R1[2] + (R2[0] + R2[2] - R1[0] - R1[2])*v, R1[1] + u*R1[3] + (R2[1] + u*R2[3] - R1[1] - u*R1[3])*v],
    ];
    walls.forEach((M, wi) => {
      const L = bsp(0, 0, 1, 1, r, (x, y, w, h, d) => d >= 3 + ((layer < 4) ? 2 : 1) || (d > 1 && r() < .15), .3, .7);
      L.forEach(([x, y, w, h, d]) => { const q = [M(x, y), M(x + w, y), M(x + w, y + h), M(x, y + h)];
        const l = lum*(.55 + ((d*3 + wi)%4)*.12) * (wi === 0 ? .8 : wi === 1 ? 1.05 : .9);
        g.fillStyle = shade(sand, l); U.poly(g, q, true); g.fill();
        const q2 = [M(x + w*.2, y + h*.2), M(x + w*.8, y + h*.2), M(x + w*.8, y + h*.8), M(x + w*.2, y + h*.8)];
        g.fillStyle = shade(sand, l*.6); U.poly(g, q2, true); g.fill(); g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = .4; U.poly(g, q, true); g.stroke(); });
    });
  }
  const gl = g.createRadialGradient(vx, vy, 0, vx, vy, W*.12); gl.addColorStop(0, U.rgba(c, .9)); gl.addColorStop(1, U.rgba(c, 0)); g.fillStyle = gl; g.fillRect(vx - W*.12, vy - W*.12, W*.24, W*.24);
  person(g, W*.5, H*.8, H*.2, "rgba(10,10,14,.85)");
};
ART.case["A04-03"].ratio = .8;

// A04-04 Digital Grotesque II：左右對稱的拱形多孔屏，層層孔洞
ART.case["A04-04"] = function(g, W, H, r, c){
  const cx = W/2, base = H*.94, top = H*.06, R = W*.44;
  // 拱形外框路徑
  const arch = () => { g.beginPath(); g.moveTo(cx - R, base); g.lineTo(cx - R, top + R*.9); g.quadraticCurveTo(cx - R, top, cx, top); g.quadraticCurveTo(cx + R, top, cx + R, top + R*.9); g.lineTo(cx + R, base); g.closePath(); };
  g.save(); arch(); g.clip();
  g.fillStyle = "#3B3226"; g.fillRect(0, 0, W, H);
  const L = bsp(0, top, R, base - top, r, (x, y, w, h, d) => (w < 5 && h < 5) || d > 9 || (d > 3 && r() < .1), .3, .7);
  L.forEach(([x, y, w, h, d]) => {
    const glow = 1 - Math.hypot(x/R, (y - H*.55)/H)*.9;
    for(let s = 0; s < 3; s++){ const k = 1 - s*.3, col = shade("#D8C39C", Math.max(.2, glow*(.95 - s*.28)));
      g.fillStyle = col; const ww = w*k, hh = h*k, xx = x + (w - ww)/2, yy = y + (h - hh)/2;
      g.beginPath(); g.ellipse(cx - xx - ww/2, yy + hh/2, ww/2, hh/2, 0, 0, TAU); g.ellipse(cx + xx + ww/2, yy + hh/2, ww/2, hh/2, 0, 0, TAU); g.fill(); }
    g.fillStyle = "rgba(15,12,10,.8)"; g.beginPath(); g.ellipse(cx - x - w/2, y + h/2, w*.12, h*.12, 0, 0, TAU); g.ellipse(cx + x + w/2, y + h/2, w*.12, h*.12, 0, 0, TAU); g.fill();
  });
  // 中央通道
  const gl = g.createLinearGradient(0, H*.5, 0, base); gl.addColorStop(0, "rgba(10,10,12,0)"); gl.addColorStop(1, "rgba(10,10,12,.9)"); g.fillStyle = gl;
  g.beginPath(); g.moveTo(cx - W*.1, base); g.lineTo(cx - W*.1, H*.6); g.quadraticCurveTo(cx, H*.5, cx + W*.1, H*.6); g.lineTo(cx + W*.1, base); g.fill();
  g.restore();
  arch(); g.strokeStyle = U.rgba(c, .9); g.lineWidth = 2; g.stroke();
  person(g, cx + W*.02, base, H*.14, "rgba(0,0,0,.9)");
};
ART.case["A04-04"].ratio = 1.3;

// A04-05 Mondrian 生成藝術（p5.js）：3×3 輸出縮圖牆
ART.case["A04-05"] = function(g, W, H, r, c){
  const n = 3, pad = W*.035, cw = (W - pad*(n+1))/n, ch = (H - pad*(n+1))/n;
  for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){
    const ox = pad + i*(cw + pad), oy = pad + j*(ch + pad);
    g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(ox + 3, oy + 3, cw, ch);
    // 格線式（Mondrian 後期）：先隨機選幾條橫豎線
    const xs = [0, 1], ys = [0, 1], nx = 2 + ((r()*3)|0), ny = 2 + ((r()*3)|0);
    for(let k = 0; k < nx; k++) xs.push(.1 + r()*.8); for(let k = 0; k < ny; k++) ys.push(.1 + r()*.8);
    xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
    g.fillStyle = MON[3]; g.fillRect(ox, oy, cw, ch);
    for(let a = 0; a < xs.length - 1; a++) for(let b = 0; b < ys.length - 1; b++) if(r() < .22){ g.fillStyle = MON[(r()*3)|0]; g.fillRect(ox + xs[a]*cw, oy + ys[b]*ch, (xs[a+1] - xs[a])*cw, (ys[b+1] - ys[b])*ch); }
    g.strokeStyle = "#111"; g.lineWidth = 2.2;
    xs.slice(1, -1).forEach(x => { const y0 = r() < .3 ? ys[1] : 0; g.beginPath(); g.moveTo(ox + x*cw, oy + y0*ch); g.lineTo(ox + x*cw, oy + ch); g.stroke(); });
    ys.slice(1, -1).forEach(y => { g.beginPath(); g.moveTo(ox, oy + y*ch); g.lineTo(ox + cw, oy + y*ch); g.stroke(); });
  }
};
ART.case["A04-05"].ratio = 1;

// A04-06 Squarified Treemaps：階層資料的巢狀近正方形矩形（單線稿）
ART.case["A04-06"] = function(g, W, H, r, c){
  const ox = W*.05, oy = H*.05, w = W*.9, h = H*.9;
  const top = [...Array(6)].map(() => 1 + r()*r()*8);
  squarify(top, ox, oy, w, h).forEach(([x, y, ww, hh, i]) => {
    const kids = [...Array(3 + ((r()*8)|0))].map(() => .3 + r()*r()*4);
    squarify(kids, x + 4, y + 4, ww - 8, hh - 8).forEach(([a, b, cw, chh, j]) => {
      const gk = [...Array(2 + ((r()*5)|0))].map(() => .2 + r()*2);
      squarify(gk, a + 2, b + 2, cw - 4, chh - 4).forEach(([p, q, pw, ph]) => { g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = .5; g.strokeRect(p + 1, q + 1, pw - 2, ph - 2); });
      g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1; g.strokeRect(a + .5, b + .5, cw - 1, chh - 1);
      if(i === 0 && j === 0){ g.fillStyle = U.rgba(c, .5); g.fillRect(a + 1, b + 1, cw - 2, chh - 2); }
    });
    g.strokeStyle = c; g.lineWidth = 2.2; g.strokeRect(x + 1, y + 1, ww - 2, hh - 2);
  });
};
ART.case["A04-06"].ratio = .8;

// A04-07 Squarified Treemap 住宅平面 → 3D：等角牆體模型
ART.case["A04-07"] = function(g, W, H, r, c){
  const areas = [30, 18, 14, 12, 9, 7, 5].map(a => a*(.8 + r()*.4)), rooms = squarify(areas, 0, 0, 10, 7.5);
  const s = Math.min(W/12, H/10), P = iso(W*.5, H*.18, s), wh = 1.6;
  // 地板
  rooms.forEach(([x, y, w, h, i]) => { g.fillStyle = i === 0 ? U.rgba(c, .5) : `rgba(255,255,255,${.08 + (i%3)*.05})`; U.poly(g, [P(x,y,0), P(x+w,y,0), P(x+w,y+h,0), P(x,y+h,0)], true); g.fill(); });
  // 牆：收集每間房四邊，依深度排序後畫成立起的板片
  const walls = [];
  rooms.forEach(([x, y, w, h]) => { walls.push([x, y, x+w, y], [x+w, y, x+w, y+h], [x, y+h, x+w, y+h], [x, y, x, y+h]); });
  walls.sort((a, b) => (a[0] + a[1] + a[2] + a[3]) - (b[0] + b[1] + b[2] + b[3]));
  walls.forEach(([x1, y1, x2, y2]) => { const len = Math.hypot(x2 - x1, y2 - y1); if(len < .01) return;
    // 門洞：在牆中段留缺口
    const segs = len > 2 ? [[0, .35], [.35 + 1/len*.9, 1]] : [[0, 1]];
    segs.forEach(([a, b]) => { const ax = x1 + (x2-x1)*a, ay = y1 + (y2-y1)*a, bx = x1 + (x2-x1)*b, by = y1 + (y2-y1)*b;
      g.fillStyle = x1 === x2 ? "rgba(225,225,230,.82)" : "rgba(180,180,190,.82)"; U.poly(g, [P(ax,ay,0), P(bx,by,0), P(bx,by,wh), P(ax,ay,wh)], true); g.fill();
      g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = .6; g.stroke(); g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(...P(ax,ay,wh)); g.lineTo(...P(bx,by,wh)); g.stroke(); }); });
};
ART.case["A04-07"].ratio = .85;

// A04-08 CGA shape：一排等角建築，立面被 split 成樓層、開間、窗
ART.case["A04-08"] = function(g, W, H, r, c){
  const s = Math.min(W, H)/15, P = iso(W*.5, H*.3, s);
  const lots = [];
  for(let i = 0; i < 3; i++) for(let j = 0; j < 2; j++) lots.push([i*4.2, j*4.6, 3.4, 3.8, 3 + ((r()*5)|0)]);
  lots.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  g.fillStyle = "rgba(255,255,255,.05)"; U.poly(g, [P(-1,-1,0), P(13,-1,0), P(13,10,0), P(-1,10,0)], true); g.fill();
  lots.forEach(([x, y, a, b, fl]) => {
    const h = fl*1.1, roof = r() < .5;
    const face = (p0, du, dv, len, col) => { // 立面：樓層 split → 開間 repeat → 窗
      const Q = (u, v) => { const q = P(p0[0] + du[0]*u, p0[1] + du[1]*u, v); return q; };
      g.fillStyle = col; U.poly(g, [Q(0,0), Q(len,0), Q(len,h), Q(0,h)], true); g.fill();
      const bays = Math.max(2, Math.round(len/.9));
      for(let f = 0; f < fl; f++) for(let k = 0; k < bays; k++){ const u0 = k*len/bays, u1 = (k+1)*len/bays, v0 = f*1.1, v1 = v0 + 1.1;
        const wu0 = u0 + (u1-u0)*.25, wu1 = u1 - (u1-u0)*.25, wv0 = v0 + (f === 0 ? .05 : .3), wv1 = v1 - .2;
        g.fillStyle = f === 0 ? U.rgba(c, .8) : "rgba(30,34,48,.85)"; U.poly(g, [Q(wu0,wv0), Q(wu1,wv0), Q(wu1,wv1), Q(wu0,wv1)], true); g.fill(); }
      g.strokeStyle = "rgba(0,0,0,.3)"; g.lineWidth = .5; for(let f = 1; f < fl; f++){ g.beginPath(); g.moveTo(...Q(0, f*1.1)); g.lineTo(...Q(len, f*1.1)); g.stroke(); }
    };
    face([x, y + b], [1, 0], null, a, "#CFC8BA");
    face([x + a, y], [0, 1], null, b, "#A39C90");
    // 屋頂
    if(roof){ g.fillStyle = shade(c, .75); U.poly(g, [P(x,y,h), P(x+a,y,h), P(x+a,y+b/2,h+1.2), P(x,y+b/2,h+1.2)], true); g.fill(); g.fillStyle = shade(c, .55); U.poly(g, [P(x,y+b/2,h+1.2), P(x+a,y+b/2,h+1.2), P(x+a,y+b,h), P(x,y+b,h)], true); g.fill(); g.fillStyle = "#8C8578"; U.poly(g, [P(x+a,y,h), P(x+a,y+b/2,h+1.2), P(x+a,y+b,h)], true); g.fill(); }
    else { g.fillStyle = "#E4DED2"; U.poly(g, [P(x,y,h), P(x+a,y,h), P(x+a,y+b,h), P(x,y+b,h)], true); g.fill(); }
  });
};
ART.case["A04-08"].ratio = .9;

// A04-09 影像式立面建模：左半「照片」、右半推導出的階層分割線稿
ART.case["A04-09"] = function(g, W, H, r, c){
  const fx = W*.08, fy = H*.08, fw = W*.84, fh = H*.84, floors = 5, bays = 4, mid = fx + fw/2;
  const nz = U.vnoise((r()*1e9)|0);
  // 照片側：模糊的牆面與窗、帶雜訊
  g.save(); g.beginPath(); g.rect(fx, fy, fw/2, fh); g.clip();
  const img = g.createLinearGradient(fx, fy, fx, fy + fh); img.addColorStop(0, "#8A8378"); img.addColorStop(1, "#5E574D"); g.fillStyle = img; g.fillRect(fx, fy, fw, fh);
  for(let f = 0; f < floors; f++) for(let b = 0; b < bays; b++){ const x = fx + (b + .22)*fw/bays, y = fy + (f + .2)*fh/floors, w = fw/bays*.56, h = fh/floors*.6;
    g.fillStyle = `rgba(20,26,40,${.6 + nz(b, f)*.35})`; g.fillRect(x, y, w, h); g.fillStyle = "rgba(200,210,230,.18)"; g.fillRect(x, y, w*.4, h); }
  for(let k = 0; k < 900; k++){ g.fillStyle = `rgba(${r() < .5 ? "255,255,255" : "0,0,0"},${r()*.12})`; g.fillRect(fx + r()*fw/2, fy + r()*fh, 2, 2); }
  g.restore();
  // 分割側：樓層（粗）→ 開間（中）→ 窗格（細）
  g.fillStyle = "#1B1B22"; g.fillRect(mid, fy, fw/2, fh);
  g.strokeStyle = c; g.lineWidth = 2; for(let f = 0; f <= floors; f++){ const y = fy + f*fh/floors; g.beginPath(); g.moveTo(mid, y); g.lineTo(fx + fw, y); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1; for(let b = 0; b <= bays; b++){ const x = fx + b*fw/bays; if(x < mid - 1) continue; g.beginPath(); g.moveTo(x, fy); g.lineTo(x, fy + fh); g.stroke(); }
  for(let f = 0; f < floors; f++) for(let b = 0; b < bays; b++){ const x = fx + (b + .22)*fw/bays, y = fy + (f + .2)*fh/floors, w = fw/bays*.56, h = fh/floors*.6; if(x + w < mid) continue;
    g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = .7; g.strokeRect(x, y, w, h); g.beginPath(); g.moveTo(x + w/2, y); g.lineTo(x + w/2, y + h); g.stroke(); }
  g.strokeStyle = "#fff"; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(mid, fy - 6); g.lineTo(mid, fy + fh + 6); g.stroke(); g.setLineDash([]);
  // 右側階層樹
  g.fillStyle = c; g.beginPath(); g.moveTo(mid - 8, fy + fh/2 - 6); g.lineTo(mid + 2, fy + fh/2); g.lineTo(mid - 8, fy + fh/2 + 6); g.fill();
};
ART.case["A04-09"].ratio = 1.15;

// A04-10 地籍分割：鳥瞰多個街廓，每塊以 OBB 切成地塊＋建築腳印
ART.case["A04-10"] = function(g, W, H, r, c){
  // 以一組傾斜道路切出街廓
  let blocks = [[[W*.02, H*.02], [W*.98, H*.02], [W*.98, H*.98], [W*.02, H*.98]]];
  const roads = [[[W*.5, H*.4], [Math.cos(.3), Math.sin(.3)]], [[W*.42, H*.5], [Math.cos(1.75), Math.sin(1.75)]], [[W*.5, H*.78], [Math.cos(-.15), Math.sin(-.15)]], [[W*.8, H*.5], [Math.cos(1.45), Math.sin(1.45)]], [[W*.5, H*.15], [1, .08]], [[W*.14, H*.5], [.1, 1]]];
  roads.forEach(([p, d]) => { const nb = []; blocks.forEach(B => cutPoly(B, p, d).forEach(q => { if(q.length > 2) nb.push(q); })); blocks = nb; });
  g.fillStyle = "#2C2C34"; g.fillRect(0, 0, W, H);
  blocks.forEach(B => { const Bk = shrinkBy(B, 5); if(area(Bk) < 200) return;
    g.fillStyle = "#1D1D24"; U.poly(g, Bk, true); g.fill();
    obbSplit(Bk, r, 900 + r()*600, 7, .08).forEach(([Q]) => { g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = .7; U.poly(g, Q, true); g.stroke();
      const F = shrink(Q, .55); g.fillStyle = r() < .15 ? U.rgba(c, .85) : "rgba(220,220,228,.45)"; U.poly(g, F, true); g.fill(); });
    g.strokeStyle = U.rgba(c, .7); g.lineWidth = 1.2; U.poly(g, Bk, true); g.stroke(); });
  // 道路中線
  g.strokeStyle = "rgba(255,255,255,.18)"; g.setLineDash([6, 6]); g.lineWidth = 1;
  roads.forEach(([p, d]) => { g.beginPath(); g.moveTo(p[0] - d[0]*W*2, p[1] - d[1]*W*2); g.lineTo(p[0] + d[0]*W*2, p[1] + d[1]*W*2); g.stroke(); }); g.setLineDash([]);
};
ART.case["A04-10"].ratio = 1;

// A04-11 CityEngine：等角城市，街廓遞迴分割後擠出不同高度量體
ART.case["A04-11"] = function(g, W, H, r, c){
  const s = Math.min(W, H)/19, P = iso(W*.5, H*.22, s), boxes = [];
  const nz = U.vnoise((r()*1e9)|0);
  for(let bi = 0; bi < 3; bi++) for(let bj = 0; bj < 3; bj++){
    const x0 = bi*5, y0 = bj*5;
    g.fillStyle = "rgba(255,255,255,.06)"; U.poly(g, [P(x0,y0,0), P(x0+4,y0,0), P(x0+4,y0+4,0), P(x0,y0+4,0)], true); g.fill();
    bsp(x0, y0, 4, 4, r, (x, y, w, h, d) => (w < 1.4 && h < 1.4) || d > 5).forEach(([x, y, w, h]) => {
      const cen = 1 - Math.hypot(x - 6.5, y - 6.5)/10; boxes.push([x + .12, y + .12, w - .24, h - .24, .4 + Math.max(0, cen)*6*(.4 + nz(x*.6, y*.6)) ]); });
  }
  boxes.sort((a, b) => (a[0] + a[1] + a[2]/2 + a[3]/2) - (b[0] + b[1] + b[2]/2 + b[3]/2));
  boxes.forEach(([x, y, a, b, h]) => { const hi = h > 3.5, col = hi ? "#B7BCC8" : "#8E919C";
    g.fillStyle = shade(col, .6); U.poly(g, [P(x,y+b,0), P(x+a,y+b,0), P(x+a,y+b,h), P(x,y+b,h)], true); g.fill();
    g.fillStyle = shade(col, .42); U.poly(g, [P(x+a,y,0), P(x+a,y+b,0), P(x+a,y+b,h), P(x+a,y,h)], true); g.fill();
    g.fillStyle = h > 4.5 ? c : shade(col, 1.1); U.poly(g, [P(x,y,h), P(x+a,y,h), P(x+a,y+b,h), P(x,y+b,h)], true); g.fill();
    if(hi){ g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = .5; for(let z = .5; z < h; z += .5){ g.beginPath(); g.moveTo(...P(x,y+b,z)); g.lineTo(...P(x+a,y+b,z)); g.lineTo(...P(x+a,y,z)); g.stroke(); } } });
};
ART.case["A04-11"].ratio = .9;

// A04-12 Quads：彩色影像四分樹，誤差大者優先再切；底部三格展示過程
ART.case["A04-12"] = function(g, W, H, r, c){
  // 合成一張彩色影像：夕陽天空＋山＋太陽
  const sunX = .3 + r()*.4, nz = U.vnoise((r()*1e9)|0);
  const col = (x, y) => { const hz = .55 + nz(x*3, 0)*.15;
    if(Math.hypot(x - sunX, y - .38) < .1) return [255, 214, 120];
    if(y < hz){ const t = y/hz; return [40 + t*200, 40 + t*80, 110 - t*40]; }
    const t = (y - hz)/(1 - hz); return [60 - t*40 + nz(x*8, y*8)*30, 40 - t*20, 60 - t*30]; };
  const run = (ox, oy, S, iters, rounded) => {
    const leaves = [[0, 0, 1]], errOf = ([x, y, s]) => { let e = 0, m = [0,0,0]; const n = 3, sm = [];
      for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){ const v = col(x + (i+.5)/n*s, y + (j+.5)/n*s); sm.push(v); m = m.map((a, k) => a + v[k]/9); }
      sm.forEach(v => e += (v[0]-m[0])**2 + (v[1]-m[1])**2 + (v[2]-m[2])**2); return [e*s*s, m]; };
    const E = [errOf(leaves[0])];
    for(let it = 0; it < iters; it++){ let bi = 0; for(let k = 1; k < leaves.length; k++) if(E[k][0] > E[bi][0]) bi = k;
      const [x, y, s] = leaves[bi], h = s/2; leaves.splice(bi, 1); E.splice(bi, 1);
      [[x, y], [x+h, y], [x, y+h], [x+h, y+h]].forEach(([a, b]) => { leaves.push([a, b, h]); E.push(errOf([a, b, h])); }); }
    leaves.forEach(([x, y, s], k) => { const m = E[k][1]; g.fillStyle = `rgb(${m.map(v => Math.round(Math.max(0, Math.min(255, v)))).join(",")})`;
      const px = ox + x*S, py = oy + y*S, ps = s*S, p = Math.min(1.2, ps*.08);
      if(rounded && g.roundRect){ g.beginPath(); g.roundRect(px + p, py + p, ps - 2*p, ps - 2*p, ps*.25); g.fill(); } else g.fillRect(px + p, py + p, ps - 2*p, ps - 2*p); });
  };
  const S = W*.9, ox = W*.05, oy = W*.05;
  run(ox, oy, S, 260, true);
  const ts = (S - 2*W*.03)/3, ty = oy + S + W*.04;
  [6, 25, 80].forEach((n, i) => { run(ox + i*(ts + W*.03), ty, ts, n, false); g.strokeStyle = i === 2 ? c : "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(ox + i*(ts + W*.03), ty, ts, ts); });
};
ART.case["A04-12"].ratio = 1.35;

// A04-13 Weaverbird：建模介面感——控制籠、平滑網格、節點連線
ART.case["A04-13"] = function(g, W, H, r, c){
  // 背景格
  g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 1; for(let x = 0; x < W; x += 12){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for(let y = 0; y < H; y += 12){ g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // 控制籠：拉長的 L 形（兩個方塊）
  let V = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v => [v[0]*.8, v[1]*.8, v[2]*.8 + (v[2] > 0 ? .5 : 0)]);
  V.forEach(v => { if(v[2] > 0 && v[0] > 0) v[0] += .6; });
  let F = [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
  const cx = W*.5, cy = H*.4, s = Math.min(W, H)*.26;
  const [V2, F2] = catmull(V, F, 3, r, null);
  drawMesh(g, V2, F2, cx, cy, s, .7, .45, c, {lw: .3, fill: lam => `rgba(${Math.round(90 + lam*140)},${Math.round(95 + lam*140)},${Math.round(110 + lam*140)},.9)`});
  const T = drawMesh(g, V, F, cx, cy, s, .7, .45, c, {wire: true, lw: 1.2});
  T.forEach(p => { g.fillStyle = c; g.beginPath(); g.arc(p[0], p[1], 3, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1; g.stroke(); });
  // 節點：Mesh → wbCatmullClark → Preview
  const ny = H*.82, nodes = [[W*.1, ny, W*.2], [W*.4, ny - 8, W*.24], [W*.74, ny + 4, W*.18]];
  for(let i = 0; i < 2; i++){ const [x1, y1, w1] = nodes[i], [x2, y2] = nodes[i+1]; g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x1 + w1, y1 + 9); g.bezierCurveTo(x1 + w1 + 20, y1 + 9, x2 - 20, y2 + 9, x2, y2 + 9); g.stroke(); }
  nodes.forEach(([x, y, w], i) => { g.fillStyle = i === 1 ? c : "#C8C8CE"; if(g.roundRect){ g.beginPath(); g.roundRect(x, y, w, 18, 4); g.fill(); } else g.fillRect(x, y, w, 18);
    g.fillStyle = "#1A1A20"; g.fillRect(x + 5, y + 7, w*.5, 4); [[x, y + 9], [x + w, y + 9]].forEach(([a, b]) => { g.beginPath(); g.arc(a, b, 3, 0, TAU); g.fillStyle = "#fff"; g.fill(); }); });
};
ART.case["A04-13"].ratio = 1;

// A04-14 影像遞迴分割：繪圖機單線稿，暗處切細並加排線
ART.case["A04-14"] = function(g, W, H, r, c){
  const f = fakeImage(r), ox = W*.06, oy = H*.05, w = W*.88, h = H*.9;
  g.fillStyle = "#EDE8DC"; g.fillRect(0, 0, W, H);
  const rec = (x, y, ww, hh, d) => { const [m, v] = stat(f, x, y, ww, hh, 3);
    if(d >= 10 || ww*w < 4 || (d >= 2 && v < .0012)){
      const X = ox + x*w, Y = oy + y*h, PW = ww*w, PH = hh*h; g.strokeStyle = "#1B1B22"; g.lineWidth = .7; g.strokeRect(X, Y, PW, PH);
      const dark = 1 - m; if(dark > .45){ const step = Math.max(1.6, 6 - dark*6); g.lineWidth = .45; g.beginPath(); for(let t = step; t < PW + PH; t += step){ const a = Math.min(t, PW), b = t - a, a2 = Math.max(0, t - PH), b2 = t - a2; g.moveTo(X + a, Y + b); g.lineTo(X + a2, Y + b2); } g.stroke(); }
      return; }
    if(ww*w > hh*h){ rec(x, y, ww/2, hh, d+1); rec(x + ww/2, y, ww/2, hh, d+1); } else { rec(x, y, ww, hh/2, d+1); rec(x, y + hh/2, ww, hh/2, d+1); } };
  rec(0, 0, 1, 1, 0);
  g.strokeStyle = c; g.lineWidth = 2; g.strokeRect(ox, oy, w, h);
};
ART.case["A04-14"].ratio = 1.25;

// A04-54 Houdini Lot Subdivision：科幻走廊側牆（兩點透視），牆面在自身 UV 上做 lot 切割再投影，接縫發光、地面反光、人形尺度
ART.case["A04-54"] = function(g, W, H, r, c){
  // 背景：天花與地板
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0B0B10"); gr.addColorStop(.5, "#15161C"); gr.addColorStop(1, "#08080B");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // 牆面投影：u 0..1（左近右遠），v 0..1（上到下）
  const xL = W*.03, xR = W*.97, tL = H*.07, bL = H*.8, tR = H*.33, bR = H*.6, S = 2.4;
  const pj = (u, v) => { const t = u*S/(u*S + 1 - u); const top = tL + (tR - tL)*t, bot = bL + (bR - bL)*t; return [xL + (xR - xL)*t, top + (bot - top)*v]; };
  const LW = 1000, LH = 420, map = Q => Q.map(q => pj(q[0]/LW, q[1]/LH));
  // 地板反光帶
  g.fillStyle = "rgba(255,255,255,.03)"; U.poly(g, [pj(0,1), pj(1,1), [xR, H], [xL, H]], true); g.fill();
  for(let k = 1; k < 7; k++){ const u = k/7, a = pj(u, 1); g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 1; g.beginPath(); g.moveTo(...a); g.lineTo(a[0] - (a[0] - W*.5)*.1, H); g.stroke(); }
  // lot 切割（在牆面自身座標）
  const lots = obbSplit([[0,0],[LW,0],[LW,LH],[0,LH]], r, LW*LH/60, 8, .7);
  lots.forEach(([Q, d]) => {
    const Qi = shrinkBy(Q, 5), A = area(Qi), l = .3 + r()*.35, hot = r() < .1;
    g.fillStyle = shade(hot ? c : "#8A909C", hot ? .75 : l); U.poly(g, map(Qi), true); g.fill();
    // 斜角：內縮一圈的暗框
    if(A > 2500){ g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 1; U.poly(g, map(shrinkBy(Qi, 14)), true); g.stroke(); }
    const P = map(Qi);
    g.strokeStyle = "rgba(255,255,255,.28)"; g.lineWidth = 1; g.beginPath(); g.moveTo(...P[P.length-1]); g.lineTo(...P[0]); g.lineTo(...P[1]); g.stroke();
    // 小零件：通風格柵或圓形螺栓
    const [cx, cy] = centroid(Qi);
    if(A > 5000 && r() < .45){ for(let k = -2; k <= 2; k++){ const a = pj((cx - 30)/LW, (cy + k*7)/LH), b = pj((cx + 30)/LW, (cy + k*7)/LH); g.strokeStyle = "rgba(0,0,0,.6)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); } }
    else if(A > 1500 && r() < .3){ const p = pj(cx/LW, cy/LH); g.fillStyle = "rgba(0,0,0,.55)"; g.beginPath(); g.arc(p[0], p[1], 2.2*(1 - cx/LW*.6), 0, TAU); g.fill(); }
  });
  // 發光接縫：水平燈條
  [.18, .72].forEach(v => { g.strokeStyle = U.rgba(c, .95); g.lineWidth = 2; g.shadowColor = c; g.shadowBlur = 10; g.beginPath(); g.moveTo(...pj(0, v)); g.lineTo(...pj(1, v)); g.stroke(); });
  g.shadowBlur = 0;
  // 牆頂與牆腳邊線
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(...pj(0,0)); g.lineTo(...pj(1,0)); g.moveTo(...pj(0,1)); g.lineTo(...pj(1,1)); g.stroke();
  // 地板上的燈條倒影
  const f = pj(0, .72), f2 = pj(1, .72), b0 = pj(0, 1), b1 = pj(1, 1);
  g.strokeStyle = U.rgba(c, .25); g.lineWidth = 3; g.beginPath(); g.moveTo(b0[0], b0[1] + (b0[1] - f[1])*.35); g.lineTo(b1[0], b1[1] + (b1[1] - f2[1])*.35); g.stroke();
  // 人形尺度
  const pp = pj(.12, 1); person(g, pp[0], pp[1] + H*.06, H*.24, "#0A0A0D");
};
ART.case["A04-54"].ratio = 1.1;
})();
