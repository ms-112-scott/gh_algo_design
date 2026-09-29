/* E06 力密度法（FDM）：基本生成器（變形與案例的獨立畫法由 gh-enrich 的 ART 單元補上） */
(function(){
const ART = window.ART, U = window.GENUTIL;
// 方形索網：固定點＋每條邊一個力密度 q，組出 D = Cnᵀ·Q·Cn，用共軛梯度對 x、y、z 各解一次
U.GEN["E06"] = function(g, W, H, r, v, c){
  const n = 9 + (v % 4) * 2, N = n*n, id = (i,j) => j*n + i;
  const P = []; for(let j = 0; j < n; j++) for(let i = 0; i < n; i++) P.push([i/(n-1) - .5, j/(n-1) - .5, 0]);
  // 固定點：四角／整圈邊界／四角＋中央柱，依 v 切換
  const mode = v % 3, fix = new Uint8Array(N);
  for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){
    const edge = i === 0 || j === 0 || i === n-1 || j === n-1, corner = (i === 0 || i === n-1) && (j === 0 || j === n-1);
    if(mode === 0 ? corner : mode === 1 ? edge : corner || (i === (n>>1) && j === (n>>1))) fix[id(i,j)] = 1;
  }
  // 邊與力密度：中央到外圈漸變（v 改變梯度方向），裸邊當邊索
  const ax = r()*6.283, gradK = .5 + r()*1.5, E = [];
  const qOf = (a,b) => { const mx = (P[a][0]+P[b][0])/2, my = (P[a][1]+P[b][1])/2, d = Math.hypot(mx,my)*1.4;
    const s = .5 + .5*Math.cos(ax)*mx*2 + .5*Math.sin(ax)*my*2; return 1 + gradK*(v % 2 ? d : s); };
  for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){
    if(i < n-1){ const a = id(i,j), b = id(i+1,j), bd = (j === 0 || j === n-1) ? 2.2 : 1; E.push([a, b, qOf(a,b)*bd]); }
    if(j < n-1){ const a = id(i,j), b = id(i,j+1), bd = (i === 0 || i === n-1) ? 2.2 : 1; E.push([a, b, qOf(a,b)*bd]); }
  }
  const row = new Int32Array(N); let nf = 0; for(let k = 0; k < N; k++) row[k] = fix[k] ? -1 : nf++;
  const diag = new Float64Array(nf); for(const [a,b,q] of E){ if(row[a] >= 0) diag[row[a]] += q; if(row[b] >= 0) diag[row[b]] += q; }
  const mv = (x, y) => { for(let i = 0; i < nf; i++) y[i] = diag[i]*x[i]; for(const [a,b,q] of E){ const A = row[a], B = row[b]; if(A >= 0 && B >= 0){ y[A] -= q*x[B]; y[B] -= q*x[A]; } } };
  const load = -.045 - (v % 5)*.008;
  for(let axis = 0; axis < 3; axis++){
    const rhs = new Float64Array(nf), x = new Float64Array(nf);
    for(let k = 0; k < N; k++) if(row[k] >= 0){ x[row[k]] = P[k][axis]; if(axis === 2) rhs[row[k]] = load; }
    for(const [a,b,q] of E){ if(row[a] >= 0 && row[b] < 0) rhs[row[a]] += q*P[b][axis]; if(row[b] >= 0 && row[a] < 0) rhs[row[b]] += q*P[a][axis]; }
    // 共軛梯度
    const R = new Float64Array(nf), p = new Float64Array(nf), Ap = new Float64Array(nf); mv(x, Ap);
    for(let i = 0; i < nf; i++){ R[i] = rhs[i] - Ap[i]; p[i] = R[i]; }
    let rr = 0; for(let i = 0; i < nf; i++) rr += R[i]*R[i];
    for(let it = 0; it < 300 && rr > 1e-14; it++){ mv(p, Ap); let pAp = 0; for(let i = 0; i < nf; i++) pAp += p[i]*Ap[i]; const al = rr/pAp;
      let rn = 0; for(let i = 0; i < nf; i++){ x[i] += al*p[i]; R[i] -= al*Ap[i]; rn += R[i]*R[i]; } const be = rn/rr; for(let i = 0; i < nf; i++) p[i] = R[i] + be*p[i]; rr = rn; }
    for(let k = 0; k < N; k++) if(row[k] >= 0) P[k][axis] = x[row[k]];
  }
  // 內力 = q × 長度，藍→家族色→紅
  const F = E.map(([a,b,q]) => q*Math.hypot(P[b][0]-P[a][0], P[b][1]-P[a][1], P[b][2]-P[a][2]));
  const fmin = Math.min(...F), fmax = Math.max(...F), col = t => t < .5 ? mix([90,150,255], U.rgb(c), t*2) : mix(U.rgb(c), [255,80,70], (t-.5)*2);
  function mix(A, B, t){ return `rgb(${A.map((x,i) => Math.round(x + (B[i]-x)*t)).join(",")})`; }
  // 等角投影（倒過來看成殼：z 取負）
  const zs = P.map(p => p[2]), zmin = Math.min(...zs), zmax = Math.max(...zs), hs = H*.36/((zmax - zmin) || 1);
  const sx = Math.min(W*.4, H*.62), cx = W*.47, cy = H*.6;
  const prj = p => [cx + (p[0]-p[1])*sx, cy + (p[0]+p[1])*sx*.48 - (zmax - p[2])*hs]; // 高度正規化到畫面內
  const order = E.map((e,k) => k).sort((a,b) => (P[E[a][0]][0]+P[E[a][0]][1]) - (P[E[b][0]][0]+P[E[b][0]][1]));
  g.lineCap = "round";
  for(const k of order){ const [a,b] = E[k], t = (F[k]-fmin)/((fmax-fmin) || 1), A = prj(P[a]), B = prj(P[b]);
    g.strokeStyle = col(t); g.globalAlpha = .55 + .45*t; g.lineWidth = .7 + t*2; g.beginPath(); g.moveTo(...A); g.lineTo(...B); g.stroke(); }
  g.globalAlpha = 1; g.fillStyle = "#fff";
  for(let k = 0; k < N; k++) if(fix[k]){ const [x,y] = prj(P[k]); g.beginPath(); g.arc(x, y, 2.6, 0, 6.283); g.fill(); }
  // 右下角：稀疏矩陣 D 的非零樣式（自由節點 × 自由節點）
  const box = Math.min(W, H)*.22, bx = W - box - 10, by = H - box - 10, cell = box/nf;
  g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(bx, by, box, box); g.strokeStyle = U.rgba(c, .5); g.lineWidth = 1; g.strokeRect(bx, by, box, box);
  g.fillStyle = U.rgba(c, .95); for(let i = 0; i < nf; i++) g.fillRect(bx + i*cell, by + i*cell, Math.max(1, cell), Math.max(1, cell));
  g.fillStyle = "rgba(255,255,255,.7)";
  for(const [a,b] of E){ const A = row[a], B = row[b]; if(A >= 0 && B >= 0){ g.fillRect(bx + A*cell, by + B*cell, Math.max(1, cell), Math.max(1, cell)); g.fillRect(bx + B*cell, by + A*cell, Math.max(1, cell), Math.max(1, cell)); } }
};
ART.var["E06"] = ART.var["E06"] || [];
})();

/* ================================================================
   E06 力密度法（FDM）：12 個變形＋11 個無照片案例的獨立畫法
   共用一套通用力密度求解器（任意拓樸），依變形／案例內容各自決定
   拓樸、固定點、力密度分布、載重與取景方式，讓每張卡都是「真的解一次」。
   ================================================================ */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = U.TAU;
const V = ART.var["E06"], C = ART.case;

// ---------- 共用：力密度法求解 ----------
// 共軛梯度（q 全為正、矩陣正定時用）
function solveCG(P, E, fix, loadZ){
  const N = P.length, row = new Int32Array(N); let nf = 0;
  for(let k = 0; k < N; k++) row[k] = fix[k] ? -1 : nf++;
  if(nf === 0) return;
  const diag = new Float64Array(nf);
  for(const [a,b,q] of E){ if(row[a] >= 0) diag[row[a]] += q; if(row[b] >= 0) diag[row[b]] += q; }
  const mv = (x, y) => { for(let i = 0; i < nf; i++) y[i] = diag[i]*x[i];
    for(const [a,b,q] of E){ const A = row[a], B = row[b]; if(A >= 0 && B >= 0){ y[A] -= q*x[B]; y[B] -= q*x[A]; } } };
  for(let axis = 0; axis < 3; axis++){
    const rhs = new Float64Array(nf), x = new Float64Array(nf);
    for(let k = 0; k < N; k++) if(row[k] >= 0){ x[row[k]] = P[k][axis]; if(axis === 2) rhs[row[k]] = typeof loadZ === "function" ? loadZ(k) : (loadZ || 0); }
    for(const [a,b,q] of E){ if(row[a] >= 0 && row[b] < 0) rhs[row[a]] += q*P[b][axis]; if(row[b] >= 0 && row[a] < 0) rhs[row[b]] += q*P[a][axis]; }
    const R = new Float64Array(nf), p = new Float64Array(nf), Ap = new Float64Array(nf); mv(x, Ap);
    for(let i = 0; i < nf; i++){ R[i] = rhs[i] - Ap[i]; p[i] = R[i]; }
    let rr = 0; for(let i = 0; i < nf; i++) rr += R[i]*R[i];
    for(let it = 0; it < 250 && rr > 1e-13; it++){ mv(p, Ap); let pAp = 0; for(let i = 0; i < nf; i++) pAp += p[i]*Ap[i]; if(Math.abs(pAp) < 1e-12) break;
      const al = rr/pAp; let rn = 0; for(let i = 0; i < nf; i++){ x[i] += al*p[i]; R[i] -= al*Ap[i]; rn += R[i]*R[i]; }
      const be = rn/rr; for(let i = 0; i < nf; i++) p[i] = R[i] + be*p[i]; rr = rn; }
    for(let k = 0; k < N; k++) if(row[k] >= 0) P[k][axis] = x[row[k]];
  }
}
// 帶樞軸高斯消去（q 可為負，矩陣不再正定時用，例如張拉整體）
function solveGE(P, E, fix, loadZ){
  const N = P.length, row = new Int32Array(N); let nf = 0;
  for(let k = 0; k < N; k++) row[k] = fix[k] ? -1 : nf++;
  if(nf === 0) return;
  const D0 = []; for(let i = 0; i < nf; i++) D0.push(new Float64Array(nf));
  for(const [a,b,q] of E){ const A = row[a], B = row[b]; if(A >= 0) D0[A][A] += q; if(B >= 0) D0[B][B] += q; if(A >= 0 && B >= 0){ D0[A][B] -= q; D0[B][A] -= q; } }
  for(let axis = 0; axis < 3; axis++){
    const rhs = new Float64Array(nf);
    for(let k = 0; k < N; k++) if(row[k] >= 0 && axis === 2) rhs[row[k]] = typeof loadZ === "function" ? loadZ(k) : (loadZ || 0);
    for(const [a,b,q] of E){ if(row[a] >= 0 && row[b] < 0) rhs[row[a]] += q*P[b][axis]; if(row[b] >= 0 && row[a] < 0) rhs[row[b]] += q*P[a][axis]; }
    const M = D0.map(rr => Float64Array.from(rr)), rv = Float64Array.from(rhs);
    for(let col = 0; col < nf; col++){
      let piv = col, best = Math.abs(M[col][col]);
      for(let ri = col+1; ri < nf; ri++){ const v2 = Math.abs(M[ri][col]); if(v2 > best){ best = v2; piv = ri; } }
      if(piv !== col){ const tm = M[col]; M[col] = M[piv]; M[piv] = tm; const tv = rv[col]; rv[col] = rv[piv]; rv[piv] = tv; }
      const pv = M[col][col] || 1e-9;
      for(let ri = col+1; ri < nf; ri++){ const f = M[ri][col]/pv; if(!f) continue; for(let cj = col; cj < nf; cj++) M[ri][cj] -= f*M[col][cj]; rv[ri] -= f*rv[col]; }
    }
    const xr = new Float64Array(nf);
    for(let ri = nf-1; ri >= 0; ri--){ let s = rv[ri]; for(let cj = ri+1; cj < nf; cj++) s -= M[ri][cj]*xr[cj]; xr[ri] = s/(M[ri][ri] || 1e-9); }
    for(let k = 0; k < N; k++) if(row[k] >= 0) P[k][axis] = xr[row[k]];
  }
}
function forcesOf(P, E){ return E.map(([a,b,q]) => q*Math.hypot(P[b][0]-P[a][0], P[b][1]-P[a][1], P[b][2]-P[a][2])); }
function mixRGB(A, B, t){ return `rgb(${A.map((x,i) => Math.round(x + (B[i]-x)*t)).join(",")})`; }
function forceCol(fmin, fmax, c, neg){ return t => t < .5 ? mixRGB([90,150,255], U.rgb(c), t*2) : mixRGB(U.rgb(c), neg || [255,80,70], (t-.5)*2); }
// 投影：iso 等角、front 立面、plan 平面圖（可帶微量高度做斜俯視）
function projector(P, W, H, mode, opt){
  opt = opt || {};
  const zs = P.map(p => p[2]), zmin = Math.min(...zs), zmax = Math.max(...zs);
  const hs = H*(opt.hs || .34)/((zmax - zmin) || 1), sx = Math.min(W*(opt.sxr || .4), H*(opt.syr || .6)), cx = W*(opt.cx || .47), cy = H*(opt.cy || .58);
  if(mode === "front") return { prj: p => [cx + p[0]*sx*(opt.k || 1.7), cy - (p[2]-zmin)*hs*(opt.kz || 1.6) - p[1]*sx*(opt.ky || .22)], zmin, zmax };
  if(mode === "plan") return { prj: p => [cx + p[0]*sx*(opt.k || 1.6), cy + p[1]*sx*(opt.k || 1.6)*(opt.sq || .82) - (p[2]-zmin)*hs*(opt.kz || .55)], zmin, zmax };
  return { prj: p => [cx + (p[0]-p[1])*sx, cy + (p[0]+p[1])*sx*.48 - (zmax-p[2])*hs], zmin, zmax };
}
function drawNet(g, P, E, F, prj, c, opt){
  opt = opt || {};
  const fmin = Math.min(...F), fmax = Math.max(...F), col = forceCol(fmin, fmax, c, opt.neg);
  const order = E.map((e,k) => k).sort((a,b) => (P[E[a][0]][0]+P[E[a][0]][1]) - (P[E[b][0]][0]+P[E[b][0]][1]));
  g.lineCap = "round";
  for(const k of order){ const [a,b] = E[k], t = (F[k]-fmin)/((fmax-fmin)||1), A = prj(P[a]), B = prj(P[b]);
    g.strokeStyle = col(t); g.globalAlpha = (opt.aMin ?? .55) + (opt.aRange ?? .45)*t; g.lineWidth = (opt.wMin ?? .7) + t*(opt.wRange ?? 2);
    g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); }
  g.globalAlpha = 1;
}
function markFix(g, P, fix, prj, rad){ g.fillStyle = "#fff"; for(let k = 0; k < P.length; k++) if(fix[k]){ const p = prj(P[k]); g.beginPath(); g.arc(p[0], p[1], rad || 2.6, 0, TAU); g.fill(); } }
function quadGrid(n){ const N = n*n, P = [], id = (i,j) => j*n+i; for(let j = 0; j < n; j++) for(let i = 0; i < n; i++) P.push([i/(n-1)-.5, j/(n-1)-.5, 0]); return { n, N, P, id }; }
function quadEdges(n, id, qOf, edgeK){ const E = [];
  for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){
    if(i < n-1){ const a = id(i,j), b = id(i+1,j), bd = (edgeK && (j===0||j===n-1)) ? edgeK : 1; E.push([a,b,qOf(a,b)*bd]); }
    if(j < n-1){ const a = id(i,j), b = id(i,j+1), bd = (edgeK && (i===0||i===n-1)) ? edgeK : 1; E.push([a,b,qOf(a,b)*bd]); } }
  return E; }
function tenseGuard(P, idxs, targetZ){ let avg = 0; for(const k of idxs) avg += P[k][2]; avg /= idxs.length;
  if(avg < targetZ*.4){ const off = targetZ - avg; for(const k of idxs) P[k][2] += off; } }
// 平面點集的凸包（單調鏈），用來把散點線網的外圍節點當固定點，避免只有一兩個端點時整片收縮成一點
function hull2(pts){
  const idx = pts.map((_,i) => i).sort((a,b) => pts[a][0]-pts[b][0] || pts[a][1]-pts[b][1]);
  const cross = (o,a,b) => (pts[a][0]-pts[o][0])*(pts[b][1]-pts[o][1]) - (pts[a][1]-pts[o][1])*(pts[b][0]-pts[o][0]);
  const lower = []; for(const i of idx){ while(lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], i) <= 0) lower.pop(); lower.push(i); }
  const upper = []; for(let k = idx.length-1; k >= 0; k--){ const i = idx[k]; while(upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], i) <= 0) upper.pop(); upper.push(i); }
  lower.pop(); upper.pop();
  return lower.concat(upper);
}
// 以法向量明暗填滿四邊形面（讓曲面有體積感）；depth 決定由遠而近的繪製順序
function quadsOf(n, m, id){ const Q = []; for(let j = 0; j < m-1; j++) for(let i = 0; i < n-1; i++) Q.push([id(i,j), id(i+1,j), id(i+1,j+1), id(i,j+1)]); return Q; }
function shadeQuads(g, P, Q, prj, col, aMin, aMax, depth){
  const L = [-.35, -.55, .76], [R0,G0,B0] = Array.isArray(col) ? col : U.rgb(col);
  const fs = Q.map(q => { const a = P[q[0]], b = P[q[1]], cc = P[q[2]], d = P[q[3]];
    const u = [cc[0]-a[0], cc[1]-a[1], cc[2]-a[2]], v = [d[0]-b[0], d[1]-b[1], d[2]-b[2]];
    const nx = u[1]*v[2]-u[2]*v[1], ny = u[2]*v[0]-u[0]*v[2], nz = u[0]*v[1]-u[1]*v[0], nl = Math.hypot(nx,ny,nz) || 1;
    return { q, s: Math.abs(nx*L[0] + ny*L[1] + nz*L[2])/nl, dp: depth ? depth(a, cc) : 0 }; });
  fs.sort((x,y) => x.dp - y.dp);
  for(const f of fs){ const t = f.s, k = .55 + .45*t;
    g.fillStyle = `rgba(${Math.round(R0*k)},${Math.round(G0*k)},${Math.round(B0*k)},${aMin + (aMax-aMin)*t})`;
    g.beginPath(); f.q.forEach((kk, i) => { const p = prj(P[kk]); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); g.fill(); }
}

// ================= 變形 V01–V12 =================

// V01 吸引子漸變力密度：改用平面圖取景。底圖是 q 的熱度場（吸引子附近 q 高、偏亮），
// 疊上求解後節點高度的等高線與網線，看出吸引子附近被拉平、遠處垂得較深
V[0] = function(g, W, H, r, c){
  const { n, N, P, id } = quadGrid(15), fix = new Uint8Array(N);
  for(let j = 0; j < n; j++) for(let i = 0; i < n; i++) if(i===0||j===0||i===n-1||j===n-1) fix[id(i,j)] = 1;
  const att = [[-.24 + r()*.08, -.2 + r()*.08], [.2 + r()*.06, -.02 + r()*.08], [-.12 + r()*.08, .24 + r()*.06]], sig = .15;
  const qAt = (x, y) => { let dmin = 1; for(const [ax,ay] of att) dmin = Math.min(dmin, Math.hypot(x-ax, y-ay)); return .5 + 5*Math.exp(-dmin*dmin/(sig*sig)); };
  const E = quadEdges(n, id, (a,b) => qAt((P[a][0]+P[b][0])/2, (P[a][1]+P[b][1])/2));
  solveCG(P, E, fix, -.05);
  const S = Math.min(W, H)*.86, x0 = (W - S)/2, y0 = (H - S)/2, toS = (x, y) => [x0 + (x + .5)*S, y0 + (y + .5)*S];
  // q 熱度場：小解析度離屏圖放大
  const res = 40, off = document.createElement("canvas"); off.width = res; off.height = res;
  const og = off.getContext("2d"), img = og.createImageData(res, res), [R0,G0,B0] = U.rgb(c);
  for(let j = 0; j < res; j++) for(let i = 0; i < res; i++){
    const t = Math.min(1, (qAt(i/(res-1) - .5, j/(res-1) - .5) - .5)/5), k = (j*res + i)*4, w = Math.max(0, t - .7)*2.2;
    img.data[k] = 30 + (R0-30)*t + (255-R0)*w; img.data[k+1] = 34 + (G0-34)*t + (255-G0)*w; img.data[k+2] = 60 + (B0-60)*t + (255-B0)*w; img.data[k+3] = 255; }
  og.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(off, x0, y0, S, S);
  // 等高線：節點高度（z）的等值線
  const zf = (i, j) => P[id(i, j)][2], zmin = Math.min(...P.map(p => p[2]));
  g.lineWidth = 1;
  for(let l = 1; l <= 6; l++){ const iso = zmin*l/7;
    g.strokeStyle = `rgba(255,255,255,${.25 + .08*l})`;
    for(const [A, B] of U.contour(n, n, zf, iso)){ const pa = toS(A[0]/(n-1) - .5, A[1]/(n-1) - .5), pb = toS(B[0]/(n-1) - .5, B[1]/(n-1) - .5);
      g.beginPath(); g.moveTo(pa[0], pa[1]); g.lineTo(pb[0], pb[1]); g.stroke(); } }
  // 網線（平面投影）：粗細隨 q
  g.strokeStyle = "rgba(10,10,16,.55)";
  for(const [a,b,q] of E){ const A = toS(P[a][0], P[a][1]), B = toS(P[b][0], P[b][1]); g.lineWidth = .4 + q*.16; g.beginPath(); g.moveTo(A[0],A[1]); g.lineTo(B[0],B[1]); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.5; g.strokeRect(x0, y0, S, S);
  for(const [ax, ay] of att){ const p = toS(ax, ay);
    g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.beginPath(); g.arc(p[0], p[1], 6, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(p[0]-10, p[1]); g.lineTo(p[0]+10, p[1]); g.moveTo(p[0], p[1]-10); g.lineTo(p[0], p[1]+10); g.stroke(); }
};

// V02 零載重預力網：四角高低錯落，load 設 0，一次解出馬鞍面（立面視角看扭轉）
V[1] = function(g, W, H, r, c){
  const { n, N, P, id } = quadGrid(9), fix = new Uint8Array(N);
  const corners = [id(0,0), id(n-1,0), id(0,n-1), id(n-1,n-1)], hs = [.2, -.2, -.2, .2];
  corners.forEach((k, i) => { fix[k] = 1; P[k][2] = hs[i]; });
  const E = quadEdges(n, id, () => .9 + r()*.3);
  solveCG(P, E, fix, 0);
  const { prj } = projector(P, W, H, "front", { k: 1.9, kz: 1.5, ky: .3 });
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1;
  for(let i = 0; i <= 4; i++){ const t = i/4-.5, a = prj([-.5, t, 0]), b = prj([.5, t, 0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
  shadeQuads(g, P, quadsOf(n, n, id), prj, c, .1, .55, (a, b) => -(a[1] + b[1]));   // 雙曲拋物面的明暗
  drawNet(g, P, E, forcesOf(P, E), prj, c, {});
  g.fillStyle = "#fff"; corners.forEach(k => { const p = prj(P[k]); g.beginPath(); g.rect(p[0]-3, p[1]-3, 6, 6); g.fill(); });
};

// V03 從線段網路建圖：任意散點各接最近的幾點形成線段網路，不受四邊形格網限制
V[2] = function(g, W, H, r, c){
  const M = 26, P = []; for(let i = 0; i < M; i++) P.push([r()*.86-.43, r()*.86-.43, 0]);
  const E = [], deg = new Uint8Array(M);
  for(let i = 0; i < M; i++){
    const ds = []; for(let j = 0; j < M; j++) if(j !== i) ds.push([Math.hypot(P[i][0]-P[j][0], P[i][1]-P[j][1]), j]);
    ds.sort((a,b) => a[0]-b[0]);
    for(let k = 0; k < 3 && k < ds.length; k++){ const j = ds[k][1];
      if(deg[i] < 4 && deg[j] < 4 && !E.some(([a,b]) => (a===i&&b===j)||(a===j&&b===i))){ E.push([i, j, .7+r()*.6]); deg[i]++; deg[j]++; } }
  }
  const fix = new Uint8Array(M); hull2(P).forEach(i => fix[i] = 1);
  for(let i = 0; i < M; i++) if(deg[i] <= 1) fix[i] = 1;
  const P2 = P.map(p => p.slice());
  solveCG(P2, E, fix, -.05);
  const ins = (x,y) => [W*.06 + (x+.5)*W*.24, H*.06 + (y+.5)*H*.24];
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1;
  for(const [a,b] of E){ const A = ins(P[a][0],P[a][1]), B = ins(P[b][0],P[b][1]); g.beginPath(); g.moveTo(A[0],A[1]); g.lineTo(B[0],B[1]); g.stroke(); }
  g.fillStyle = "rgba(255,255,255,.5)"; for(let i=0;i<M;i++){ const p = ins(P[i][0],P[i][1]); g.beginPath(); g.arc(p[0],p[1],1.6,0,TAU); g.fill(); }
  g.strokeStyle = "rgba(255,255,255,.15)"; g.strokeRect(W*.06, H*.06, W*.24, H*.24);
  const { prj } = projector(P2, W, H, "iso", { cx: .55, cy: .62, sxr: .46 });
  drawNet(g, P2, E, forcesOf(P2, E), prj, c, {});
  markFix(g, P2, fix, prj, 2.2);
};

// V04 內力決定索徑：管件粗細隨內力變化（√力），右側排出依長度排序的索料清單
V[3] = function(g, W, H, r, c){
  const { n, N, P, id } = quadGrid(8), fix = new Uint8Array(N);
  [id(0,0), id(n-1,0), id(0,n-1), id(n-1,n-1)].forEach(k => fix[k] = 1);
  const E = quadEdges(n, id, (a,b) => { const mx = (P[a][0]+P[b][0])/2; return 1 + 1.6*Math.abs(mx); });
  solveCG(P, E, fix, -.05);
  const F = forcesOf(P, E), fmax = Math.max(...F);
  const { prj } = projector(P, W, H, "iso", { cy: .52, sxr: .34 });
  const col = forceCol(Math.min(...F), fmax, c);
  const order = E.map((e,k) => k).sort((a,b) => (P[E[a][0]][0]+P[E[a][0]][1]) - (P[E[b][0]][0]+P[E[b][0]][1]));
  for(const k of order){ const [a,b] = E[k], t = F[k]/fmax, A = prj(P[a]), B = prj(P[b]);
    g.strokeStyle = col(t*.9+.05); g.lineWidth = 1.4 + Math.sqrt(t)*7; g.lineCap = "round"; g.beginPath(); g.moveTo(A[0],A[1]); g.lineTo(B[0],B[1]); g.stroke(); }
  markFix(g, P, fix, prj, 3);
  const L = E.map(([a,b]) => Math.hypot(P[b][0]-P[a][0], P[b][1]-P[a][1], P[b][2]-P[a][2]));
  const idxs = E.map((e,k) => k).sort((a,b) => L[a]-L[b]);
  const bx = W*.72, bw = W*.24, by = H*.08, bh = H*.84, rows = Math.min(18, idxs.length), rh = bh/rows, lmax = Math.max(...L);
  g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(bx-6, by-4, bw+12, bh+8);
  for(let i = 0; i < rows; i++){ const k = idxs[Math.round(i*(idxs.length-1)/(rows-1))], t = F[k]/fmax;
    g.fillStyle = col(t*.9+.05); g.fillRect(bx, by + i*rh + rh*.2, bw*(L[k]/lmax), rh*.6); }
};

// V05 自重依負擔面積迭代更新：每輪依相鄰邊長估計面積，重算 z 方向載重再重解
V[4] = function(g, W, H, r, c){
  const { n, N, P, id } = quadGrid(9), fix = new Uint8Array(N);
  for(let j = 0; j < n; j++) for(let i = 0; i < n; i++) if(i===0||j===0||i===n-1||j===n-1) fix[id(i,j)] = 1;
  const E = quadEdges(n, id, () => .9 + r()*.4);
  const nb = Array.from({length:N}, () => []); for(const [a,b] of E){ nb[a].push(b); nb[b].push(a); }
  const P0 = P.map(p => p.slice());
  solveCG(P0, E, fix, -.03);
  let Pi = P0.map(p => p.slice());
  for(let iter = 0; iter < 4; iter++){
    const area = new Float64Array(N); let asum = 0;
    for(let k = 0; k < N; k++){ let s = 0; for(const j of nb[k]) s += Math.hypot(Pi[j][0]-Pi[k][0], Pi[j][1]-Pi[k][1]); const a = Math.pow(s/(nb[k].length||1), 2); area[k] = a; asum += a; }
    const aavg = asum/N || 1;
    Pi = P.map(p => p.slice());
    solveCG(Pi, E, fix, k => -.02 - .09*(area[k]/aavg));
  }
  const { prj } = projector(P, W, H, "iso", { cy: .66, sxr: .42, hs: .3 });
  g.globalAlpha = .3;
  for(const [a,b] of E){ const A = prj(P0[a]), B = prj(P0[b]); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = .6; g.beginPath(); g.moveTo(A[0],A[1]); g.lineTo(B[0],B[1]); g.stroke(); }
  g.globalAlpha = 1;
  // 每個面依投影面積（負擔面積）上色：面越大、載重越重、越亮
  const Qf = quadsOf(n, n, id), qa = Qf.map(q => { const [a,b,cc,d] = q.map(k => Pi[k]); return Math.abs((cc[0]-a[0])*(d[1]-b[1]) - (cc[1]-a[1])*(d[0]-b[0]))/2; });
  const amin = Math.min(...qa), amax = Math.max(...qa);
  Qf.map((q, i) => [q, i]).sort((x, y) => (Pi[x[0][0]][0] + Pi[x[0][0]][1]) - (Pi[y[0][0]][0] + Pi[y[0][0]][1])).forEach(([q, i]) => {
    const t = (qa[i] - amin)/((amax - amin) || 1); g.fillStyle = t > .5 ? `rgba(255,${Math.round(210 - 110*t)},90,${.25 + .4*t})` : U.rgba(c, .12 + .3*t);
    g.beginPath(); q.forEach((k, m) => { const p = prj(Pi[k]); m ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); g.fill(); });
  drawNet(g, Pi, E, forcesOf(Pi, E), prj, c, {});
  markFix(g, Pi, fix, prj);
};

// V06 輪輻索網：外圈固定為壓環，最內圈以高 q 環索相連成拉環，徑向索另給力密度
V[5] = function(g, W, H, r, c){
  const rings = 6, spokes = 18, N = rings*spokes + 1, P = [], id = (ri, si) => ri*spokes + si, center = N-1;
  for(let ri = 0; ri < rings; ri++){ const rad = .44*(ri+1)/rings; for(let si = 0; si < spokes; si++){ const a = si/spokes*TAU; P.push([rad*Math.cos(a), rad*Math.sin(a), 0]); } }
  P.push([0,0,0]);
  const fix = new Uint8Array(N); for(let si = 0; si < spokes; si++) fix[id(rings-1, si)] = 1;
  const E = [];
  for(let ri = 0; ri < rings; ri++) for(let si = 0; si < spokes; si++){
    const a = id(ri, si), b = id(ri, (si+1)%spokes);
    E.push([a, b, ri === 0 ? 3.2 : .5 + .1*ri]);
    if(ri === 0) E.push([a, center, 2.6]);
    if(ri < rings-1) E.push([a, id(ri+1, si), 1 + .15*(rings-1-ri)]);
  }
  solveCG(P, E, fix, -.045);
  const { prj } = projector(P, W, H, "plan", { k: 1.55, sq: .86, kz: .5, cy: .55 });
  drawNet(g, P, E, forcesOf(P, E), prj, c, { wMin: .5, wRange: 1.6 });
  markFix(g, P, fix, prj, 2);
  g.strokeStyle = U.rgba(c, .6); g.lineWidth = 1.4; g.beginPath();
  for(let si = 0; si <= spokes; si++){ const p = prj(P[id(0, si%spokes)]); si ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); } g.stroke();
};

// V07 支承反力：對每個固定點算 R = -Σ q(x_j-x_i)，畫成依大小縮放的箭頭
V[6] = function(g, W, H, r, c){
  const { n, N, P, id } = quadGrid(9), fix = new Uint8Array(N);
  [id(0,0), id(n-1,0), id(0,n-1), id(n-1,n-1)].forEach(k => fix[k] = 1);
  const nb = Array.from({length:N}, () => []);
  const E = quadEdges(n, id, () => .8 + r()*.5);
  for(const e of E){ nb[e[0]].push(e); nb[e[1]].push(e); }
  solveCG(P, E, fix, -.05);
  const { prj } = projector(P, W, H, "front", { k: 1.6, kz: 1.7, ky: .25, cy: .68 });
  drawNet(g, P, E, forcesOf(P, E), prj, c, {});
  const reax = [];
  for(let k = 0; k < N; k++) if(fix[k]){
    let Rx=0, Ry=0, Rz=0;
    for(const [a,b,q] of nb[k]){ const j = a===k?b:a, dx=P[j][0]-P[k][0], dy=P[j][1]-P[k][1], dz=P[j][2]-P[k][2]; Rx-=q*dx; Ry-=q*dy; Rz-=q*dz; }
    reax.push([k, Rx, Ry, Rz, Math.hypot(Rx,Ry,Rz)]);
  }
  const magMax = Math.max(...reax.map(e => e[4])) || 1;
  for(const [k, Rx, Ry, Rz, mag] of reax){
    const t = mag/magMax, ux0 = Rx/mag, uy0 = Ry/mag, uz0 = Rz/mag, L = .1 + .22*t;
    const p0 = prj(P[k]), p1 = prj([P[k][0]-ux0*L, P[k][1]-uy0*L, P[k][2]-uz0*L]);
    const dx = p1[0]-p0[0], dy = p1[1]-p0[1], len = Math.hypot(dx,dy)||1, ux=dx/len, uy=dy/len;
    g.strokeStyle = U.rgba(c, .5 + .4*t); g.lineWidth = 1 + 2.4*t; g.beginPath(); g.moveTo(p0[0],p0[1]); g.lineTo(p1[0],p1[1]); g.stroke();
    g.fillStyle = g.strokeStyle; g.beginPath(); g.moveTo(p1[0],p1[1]); g.lineTo(p1[0]-ux*6-uy*3, p1[1]-uy*6+ux*3); g.lineTo(p1[0]-ux*6+uy*3, p1[1]-uy*6-ux*3); g.closePath(); g.fill();
  }
};

// V08 拖曳錨點即時重解：畫成 2×2 分格影格，錨點一格一格被拖高，每一格都是從頭組 D 重新求解的平衡形
V[7] = function(g, W, H, r, c){
  const { n, N, P, id } = quadGrid(8), fix = new Uint8Array(N);
  const corners = [id(0,0), id(n-1,0), id(0,n-1), id(n-1,n-1)];
  corners.forEach(k => fix[k] = 1);
  const dragK = corners[3], from = [P[dragK][0], P[dragK][1], 0], to = [P[dragK][0] - .1, P[dragK][1] - .08, .42];
  const E = quadEdges(n, id, () => 1), Q = quadsOf(n, n, id);
  const pad = W*.05, gap = W*.04, pw = (W - 2*pad - gap)/2, ph = (H - 2*pad - gap)/2;
  for(let s = 0; s < 4; s++){
    const t = s/3, Pt = P.map(p => p.slice());
    for(let a = 0; a < 3; a++) Pt[dragK][a] = from[a] + (to[a] - from[a])*t;
    solveCG(Pt, E, fix, -.045);
    const ox = pad + (s % 2)*(pw + gap), oy = pad + (s >> 1)*(ph + gap);
    g.fillStyle = s === 3 ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.05)"; g.fillRect(ox, oy, pw, ph);
    g.strokeStyle = s === 3 ? U.rgba(c, .9) : "rgba(255,255,255,.18)"; g.lineWidth = s === 3 ? 1.6 : 1; g.strokeRect(ox, oy, pw, ph);
    g.save(); g.beginPath(); g.rect(ox, oy, pw, ph); g.clip();
    const prj = p => [ox + pw*.5 + (p[0] - p[1])*pw*.44, oy + ph*.36 + (p[0] + p[1])*pw*.21 - p[2]*ph*.75];
    shadeQuads(g, Pt, Q, prj, c, .18, .6, (a, b) => a[0] + a[1] + b[0] + b[1]);
    drawNet(g, Pt, E, forcesOf(Pt, E), prj, c, { aMin: .35, wMin: .5, wRange: 1.2 });
    markFix(g, Pt, fix, prj, 2);
    const pA = prj(Pt[dragK]), p0 = prj(from);
    g.strokeStyle = "rgba(255,255,255,.6)"; g.setLineDash([2,3]); g.lineWidth = 1; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(pA[0], pA[1]); g.stroke(); g.setLineDash([]);
    g.fillStyle = "#fff"; g.beginPath(); g.arc(pA[0], pA[1], 3.6, 0, TAU); g.fill();
    if(s === 3){ // 滑鼠游標：正在拖曳
      const cx0 = pA[0] + 3, cy0 = pA[1] + 2; g.fillStyle = "#fff"; g.strokeStyle = "#121217"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(cx0, cy0); g.lineTo(cx0, cy0 + 14); g.lineTo(cx0 + 4, cy0 + 10); g.lineTo(cx0 + 7, cy0 + 16); g.lineTo(cx0 + 9, cy0 + 15); g.lineTo(cx0 + 6, cy0 + 9); g.lineTo(cx0 + 10, cy0 + 9); g.closePath(); g.fill(); g.stroke(); }
    g.restore();
    // 影格下緣的時間軸
    g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(ox + 6, oy + ph - 7, pw - 12, 2.5);
    g.fillStyle = U.rgba(c, .95); g.fillRect(ox + 6, oy + ph - 7, (pw - 12)*(s + 1)/4, 2.5);
  }
};

// V09 等力網：迭代把每條邊的 q 設為「目標力 ÷ 長度」，收斂到內力全部相等的最小網
V[8] = function(g, W, H, r, c){
  const { n, N, P, id } = quadGrid(9), fix = new Uint8Array(N);
  for(let j = 0; j < n; j++) for(let i = 0; i < n; i++) if(i===0||j===0||i===n-1||j===n-1) fix[id(i,j)] = 1;
  fix[id((n-1)>>1,(n-1)>>1)] = 1;
  P[id((n-1)>>1,(n-1)>>1)][2] = -.28;
  let E = quadEdges(n, id, () => 1);
  const target = .05;
  for(let iter = 0; iter < 5; iter++){
    solveCG(P, E, fix, 0);
    E = E.map(([a,b]) => { const len = Math.hypot(P[b][0]-P[a][0], P[b][1]-P[a][1], P[b][2]-P[a][2]) || .01; return [a, b, target/len]; });
  }
  const { prj } = projector(P, W, H, "iso", { cy: .56, sxr: .4 });
  shadeQuads(g, P, quadsOf(n, n, id), prj, [235, 240, 255], .06, .4, (a, b) => a[0] + a[1] + b[0] + b[1]);
  g.lineCap = "round";
  for(const [a,b] of E){ const A = prj(P[a]), B = prj(P[b]); g.strokeStyle = U.rgba(c, .8); g.lineWidth = 1.3; g.beginPath(); g.moveTo(A[0],A[1]); g.lineTo(B[0],B[1]); g.stroke(); }
  markFix(g, P, fix, prj);
  // 每根索的內力 q·L：收斂後全部等於目標力，長條一樣高
  const F = forcesOf(P, E), fmax = Math.max(...F), bw = W*.84/E.length, by = H*.95;
  F.forEach((f, i) => { g.fillStyle = U.rgba(c, .85); g.fillRect(W*.08 + i*bw, by - H*.08*f/fmax, Math.max(.6, bw - .3), H*.08*f/fmax); });
};

// V10 張拉整體：三座三桿單元並排（立面斜視），受壓桿的負 q 由小到大；
// 以帶樞軸高斯消去解出頂環位置，看出正負力密度比例如何改變扭轉角與頂環大小
V[9] = function(g, W, H, r, c){
  const cfg = [[-.6, .24], [-1.0, .34], [-1.4, .44]], gy = H*.8, sx = W*.36;
  g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1; g.beginPath(); g.moveTo(W*.04, gy); g.lineTo(W*.96, gy); g.stroke();
  cfg.forEach(([qs, hz], k) => {
    const m = 3, P = [], id = (top, i) => (top ? m : 0) + i, rb = .2, cx = W*(.19 + .31*k);
    for(let i = 0; i < m; i++){ const a = i/m*TAU + .3; P.push([rb*Math.cos(a), rb*Math.sin(a), 0]); }
    for(let i = 0; i < m; i++){ const a = (i + .5)/m*TAU + .3; P.push([rb*.8*Math.cos(a), rb*.8*Math.sin(a), hz]); }
    const fix = new Uint8Array(2*m); for(let i = 0; i < m; i++) fix[id(0,i)] = 1;
    const E = [];
    for(let i = 0; i < m; i++){ E.push([id(0,i), id(0,(i+1)%m), 2]); E.push([id(1,i), id(1,(i+1)%m), .7]); }
    for(let i = 0; i < m; i++){ E.push([id(0,(i+1)%m), id(1,i), qs]); E.push([id(0,i), id(1,i), 1]); }
    solveGE(P, E, fix, 0);
    for(let i = 0; i < m; i++) P[id(1,i)][2] = hz;   // 高度：受壓比例越大越高（示意指定）
    const prj = p => [cx + p[0]*sx, gy - p[2]*H*1.25 + p[1]*sx*.32];
    g.fillStyle = "rgba(255,255,255,.07)"; g.beginPath(); g.ellipse(cx, gy, rb*sx*1.15, rb*sx*.4, 0, 0, TAU); g.fill();
    // 先畫受拉索，再畫受壓桿
    for(const [a,b,q] of E) if(q > 0){ const A = prj(P[a]), B = prj(P[b]);
      g.strokeStyle = U.rgba(c, .85); g.lineWidth = 1.1; g.beginPath(); g.moveTo(A[0],A[1]); g.lineTo(B[0],B[1]); g.stroke(); }
    const top = [0,1,2].map(i => prj(P[id(1,i)]));
    g.fillStyle = U.rgba(c, .14); g.beginPath(); top.forEach((p,i) => i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1])); g.closePath(); g.fill();
    g.lineCap = "round";
    for(const [a,b,q] of E) if(q < 0){ const A = prj(P[a]), B = prj(P[b]);
      g.strokeStyle = `rgba(255,${Math.round(170 - 40*k)},70,.95)`; g.lineWidth = 3.2 + k*.9; g.beginPath(); g.moveTo(A[0],A[1]); g.lineTo(B[0],B[1]); g.stroke(); }
    g.fillStyle = "#fff"; for(let i = 0; i < 2*m; i++){ const p = prj(P[i]); g.beginPath(); g.arc(p[0], p[1], fix[i] ? 2.6 : 1.8, 0, TAU); g.fill(); }
    // 底下的刻度：受壓桿 |q| 長條
    g.fillStyle = "rgba(255,150,70,.85)"; g.fillRect(cx - W*.1, gy + H*.06, W*.2*(-qs/1.4), 3);
  });
};

// V11 逆向找形：沿中線剖面看。指定三個目標高度（白圈），q 以三個參數 α 控制（q = exp(Σ α·高斯權重)，恆為正），
// 用有限差分估計 ∂z/∂α、高斯—牛頓更新 α，每步都重解一次 FDM；淡色剖面線是前幾輪、白線是收斂結果，下方長條是中線 q（對數刻度）
V[10] = function(g, W, H, r, c){
  const { n, N, P, id } = quadGrid(13), fix = new Uint8Array(N);
  for(let j = 0; j < n; j++) for(let i = 0; i < n; i++) if(i===0||j===0||i===n-1||j===n-1) fix[id(i,j)] = 1;
  const mid = (n-1) >> 1, targets = [[id(3,mid), .2], [id(6,mid), .3], [id(9,mid), .14]], m = targets.length, sig = .14;
  const base = quadEdges(n, id, () => 1);
  const wts = base.map(([a,b]) => { const mx = (P[a][0]+P[b][0])/2, my = (P[a][1]+P[b][1])/2;
    return targets.map(([k]) => Math.exp(-((mx-P[k][0])**2 + (my-P[k][1])**2)/(sig*sig))); });
  const edgesOf = al => base.map(([a,b], e) => [a, b, Math.exp(wts[e].reduce((s, w, t) => s + w*al[t], 0))]);
  const solveAt = al => { const Pi = P.map(p => p.slice()); solveCG(Pi, edgesOf(al), fix, -.035); return Pi; };
  const alpha = new Array(m).fill(0), profiles = [];
  for(let iter = 0; iter < 6; iter++){
    const Pi = solveAt(alpha), s0 = targets.map(([k]) => -Pi[k][2]);
    profiles.push(Array.from({length:n}, (_, i) => [Pi[id(i,mid)][0], -Pi[id(i,mid)][2]]));
    if(iter === 5) break;
    const h = .05, M = targets.map(() => new Array(m + 1).fill(0));
    for(let t = 0; t < m; t++){ const a2 = alpha.slice(); a2[t] += h; const P2 = solveAt(a2);
      targets.forEach(([k], u) => { M[u][t] = (-P2[k][2] - s0[u])/h; }); }
    targets.forEach(([, tz], u) => { M[u][m] = tz - s0[u]; });
    for(let cc = 0; cc < m; cc++){ let p = cc; for(let rr = cc+1; rr < m; rr++) if(Math.abs(M[rr][cc]) > Math.abs(M[p][cc])) p = rr;
      const tmp = M[cc]; M[cc] = M[p]; M[p] = tmp;
      for(let rr = cc+1; rr < m; rr++){ const f = M[rr][cc]/(M[cc][cc] || 1e-9); for(let k = cc; k <= m; k++) M[rr][k] -= f*M[cc][k]; } }
    const d = new Array(m).fill(0);
    for(let rr = m-1; rr >= 0; rr--){ let s = M[rr][m]; for(let k = rr+1; k < m; k++) s -= M[rr][k]*d[k]; d[rr] = s/(M[rr][rr] || 1e-9); }
    for(let t = 0; t < m; t++) alpha[t] += Math.max(-1.5, Math.min(1.5, d[t]));
  }
  const E = edgesOf(alpha);
  const gx0 = W*.08, gw = W*.84, gy = H*.62, hsc = H*1.25, X = x => gx0 + (x + .5)*gw, Y = z => gy - z*hsc;
  const last = profiles[profiles.length - 1];
  const grd = g.createLinearGradient(0, Y(.3), 0, gy); grd.addColorStop(0, U.rgba(c, .5)); grd.addColorStop(1, U.rgba(c, .05));
  g.fillStyle = grd; g.beginPath(); g.moveTo(X(-.5), gy); last.forEach(([x,z]) => g.lineTo(X(x), Y(z))); g.lineTo(X(.5), gy); g.closePath(); g.fill();
  profiles.forEach((pr, t) => { const lastOne = t === profiles.length - 1;
    g.strokeStyle = lastOne ? "#fff" : U.rgba(c, .25 + .08*t); g.lineWidth = lastOne ? 2.2 : 1; g.beginPath();
    pr.forEach(([x,z], i) => i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z))); g.stroke(); });
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(gx0 - 6, gy); g.lineTo(gx0 + gw + 6, gy); g.stroke();
  for(const [k, tz] of targets){ const x = X(P[k][0]), y = Y(tz);
    g.setLineDash([2,3]); g.strokeStyle = "rgba(255,255,255,.45)"; g.beginPath(); g.moveTo(x, gy); g.lineTo(x, y); g.stroke(); g.setLineDash([]);
    g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.stroke(); }
  // 中線上水平邊的 q
  const qs = []; for(let i = 0; i < n-1; i++){ const a = id(i,mid), b = id(i+1,mid), e = E.find(e => e[0] === a && e[1] === b); qs.push(Math.log(e ? e[2] : 1)); }
  const qmin = Math.min(...qs), qmax = Math.max(...qs), by = H*.95, bh = H*.22, bw = gw/qs.length;
  qs.forEach((q, i) => { const t = (q - qmin)/((qmax - qmin) || 1), h = bh*(.12 + .88*t);
    g.fillStyle = t > .6 ? `rgba(255,${Math.round(200 - 120*t)},80,.9)` : U.rgba(c, .5 + .4*t); g.fillRect(gx0 + i*bw + 1, by - h, bw - 2, h); });
};

// V12 混合 E03 Voronoi：以蜂巢狀三價網格模擬不規則多邊形索網（每節點三叉），並淡淡填色像面板
V[11] = function(g, W, H, r, c){
  const nx = 9, ny = 11, P = [], id = (i,j) => j*nx+i, N = nx*ny;
  const dx = .8/(nx-1), dy = .8/(ny-1);
  for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++){
    const jitter = (r()-.5)*dx*.5, jitterY = (r()-.5)*dy*.35;
    P.push([-.4 + i*dx + (j%2)*dx*.5 + jitter, -.4 + j*dy*.87 + jitterY, 0]);
  }
  const E = [], fix = new Uint8Array(N);
  for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++){
    const k = id(i,j);
    if(j < ny-1) E.push([k, id(i,j+1), .9 + r()*.4]);
    if((i+j)%2 === 0 && i < nx-1) E.push([k, id(i+1,j), .9 + r()*.4]);
    if(i===0||i===nx-1||j===0||j===ny-1) fix[k] = 1;
  }
  solveCG(P, E, fix, -.055);
  const { prj } = projector(P, W, H, "iso", { cy: .6, sxr: .44 });
  g.fillStyle = U.rgba(c, .07);
  for(let j = 0; j < ny-1; j++) for(let i = 0; i < nx-1; i += 2){
    if((i+j)%2 !== 0) continue;
    const ks = [id(i,j), id(i+1,j), id(i+1,j+1), id(i,j+1)];
    g.beginPath(); ks.forEach((k,q) => { const p = prj(P[k]); q ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); }); g.closePath(); g.fill();
  }
  drawNet(g, P, E, forcesOf(P, E), prj, c, { wMin: .9, wRange: 1.6 });
  markFix(g, P, fix, prj, 2);
};

// ================= 無照片案例 =================

// E06-01 慕尼黑奧林匹克屋頂：z 朝上的鳥瞰。三個桅杆吊點（固定且抬高）＋邊緣少數錨點，
// 零載重、邊索給高 q 收出扇貝邊，一次解出多片相連的馬鞍面；屋面以半透明壓克力板的明暗填色，前方是湖面
C["E06-01"] = function(g, W, H, r, c){
  const nx = 25, ny = 11, P = [], id = (i,j) => j*nx + i, N = nx*ny;
  for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++) P.push([i/(nx-1) - .5, (j/(ny-1) - .5)*.44, 0]);
  const fix = new Uint8Array(N);
  [0, 6, 12, 18, 24].forEach(i => { fix[id(i,0)] = 1; fix[id(i,ny-1)] = 1; });
  for(let j = 0; j < ny; j += 5){ fix[id(0,j)] = 1; fix[id(nx-1,j)] = 1; }
  const masts = [[id(4,5), .26], [id(12,4), .34], [id(20,6), .24]];
  masts.forEach(([k, h]) => { fix[k] = 1; P[k][2] = h; });
  const E = [];
  for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++){
    if(i < nx-1) E.push([id(i,j), id(i+1,j), (j===0 || j===ny-1) ? 4.5 : .9 + r()*.2]);
    if(j < ny-1) E.push([id(i,j), id(i,j+1), (i===0 || i===nx-1) ? 4.5 : .9 + r()*.2]); }
  solveCG(P, E, fix, 0);
  const S = W*.9, cx = W*.5, cy = H*.6;
  const prj = p => [cx + (p[0] - p[1]*.45)*S, cy + (p[1]*.7 + p[0]*.1)*S - p[2]*S*.75];
  // 湖面與地面
  g.fillStyle = "rgba(90,150,255,.14)"; g.beginPath(); g.ellipse(W*.36, H*.86, W*.3, H*.06, -.05, 0, TAU); g.fill();
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1;
  for(let k = 0; k < 5; k++){ const y = H*(.7 + .06*k); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y - W*.05); g.stroke(); }
  // 桅杆：由地面斜立、頂端高於吊點，再以吊索拉住網面
  masts.forEach(([k, h]) => { const base = prj([P[k][0] + .05, P[k][1] + .14, 0]), top = prj([P[k][0] + .03, P[k][1] + .06, h + .16]), hang = prj(P[k]);
    g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(base[0], base[1]); g.lineTo(top[0], top[1]); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(top[0], top[1]); g.lineTo(hang[0], hang[1]); g.stroke(); });
  shadeQuads(g, P, quadsOf(nx, ny, id), prj, [200, 225, 255], .08, .42, (a, b) => -(a[1] + b[1]));
  drawNet(g, P, E, forcesOf(P, E), prj, c, { aMin: .4, aRange: .5, wMin: .5, wRange: 1.4 });
  markFix(g, P, fix, prj, 1.8);
  masts.forEach(([k]) => { const p = prj(P[k]); g.fillStyle = "#fff"; g.beginPath(); g.arc(p[0], p[1], 3, 0, TAU); g.fill(); });
};
C["E06-01"].ratio = .8;

// E06-02 NEST HiLo：索網加織物模板，比較灌漿前（輕載重）與灌漿後（混凝土自重）的預力差異
C["E06-02"] = function(g, W, H, r, c){
  const { n, N, P, id } = quadGrid(9), fix = new Uint8Array(N);
  for(let j = 0; j < n; j++) for(let i = 0; i < n; i++) if(i===0||j===0||i===n-1||j===n-1) fix[id(i,j)] = 1;
  const E = quadEdges(n, id, () => 1);
  solveCG(P, E, fix, -.02);
  const wet = P.map(p => p.slice());
  const nb = Array.from({length:N}, () => []); for(const [a,b] of E){ nb[a].push(b); nb[b].push(a); }
  solveCG(wet, E, fix, k => -.02 - .05*(nb[k].length/4));
  const { prj } = projector(P.concat(wet), W, H, "front", { k: 1.75, kz: 1.7, ky: .25, cy: .62 });
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 2;
  const f0 = prj([-.5,-.5,.05]), f1 = prj([.5,-.5,.05]); g.beginPath(); g.moveTo(f0[0],f0[1]); g.lineTo(f1[0],f1[1]); g.stroke();
  g.fillStyle = U.rgba(c, .1);
  const mid = (n-1)>>1;
  for(let i = 0; i < n-1; i++){ const A = prj(wet[id(i,mid)]), B = prj(wet[id(i+1,mid)]), A0 = prj(P[id(i,mid)]), B0 = prj(P[id(i+1,mid)]);
    g.beginPath(); g.moveTo(A0[0],A0[1]); g.lineTo(B0[0],B0[1]); g.lineTo(B[0],B[1]); g.lineTo(A[0],A[1]); g.closePath(); g.fill(); }
  g.globalAlpha = .35; drawNet(g, P, E, forcesOf(P, E), prj, c, {}); g.globalAlpha = 1;
  drawNet(g, wet, E, forcesOf(wet, E), prj, c, {});
  markFix(g, wet, fix, prj);
};
C["E06-02"].ratio = .85;

// E06-03 COMPAS FD：求解與「拉回曲線」交替，邊界節點沿指定曲線滑動；右下角畫 CSR 三陣列示意
C["E06-03"] = function(g, W, H, r, c){
  const { n, N, P, id } = quadGrid(9), fix = new Uint8Array(N);
  [id(0,0), id(n-1,0), id(0,n-1), id(n-1,n-1)].forEach(k => fix[k] = 1);
  const curve = t => [ -.5 + t, -.12*Math.sin(t*Math.PI) ];
  const onCurve = []; for(let i = 0; i < n; i++){ const k = id(i, 0); onCurve.push(k); fix[k] = 1; }
  const E = quadEdges(n, id, () => 1);
  for(let iter = 0; iter < 4; iter++){
    solveCG(P, E, fix, -.03);
    for(const k of onCurve){ const t = Math.max(0, Math.min(1, P[k][0]+.5)), [cx0, cy0] = curve(t); P[k][0] = cx0; P[k][1] = cy0; }
  }
  const { prj } = projector(P, W, H, "iso", { cy: .58, sxr: .42 });
  g.strokeStyle = U.rgba(c, .8); g.setLineDash([4,3]); g.lineWidth = 1.4; g.beginPath();
  for(let i = 0; i <= 40; i++){ const [cx0,cy0] = curve(i/40), p = prj([cx0,cy0,P[onCurve[0]][2]]); i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); } g.stroke(); g.setLineDash([]);
  drawNet(g, P, E, forcesOf(P, E), prj, c, {});
  markFix(g, P, fix, prj);
  const by = H - 30, bx = W*.08, bw = W*.84, rowsN = Math.min(30, E.length);
  ["rgba(255,255,255,.35)", U.rgba(c,.7), "rgba(255,255,255,.6)"].forEach((col, ri) => {
    g.fillStyle = col; for(let i = 0; i < rowsN; i++) g.fillRect(bx + i*bw/rowsN, by + ri*8, bw/rowsN - 1, 5);
  });
};
C["E06-03"].ratio = 1.05;

// E06-04 張拉整體力密度：受壓桿給負 q；右側畫出邊力密度排序譜，接近 0 者以亮色標出（象徵秩缺陷檢查）
C["E06-04"] = function(g, W, H, r, c){
  const rings = 5, N = rings*2, P = [], id = (top,i) => (top?rings:0)+i;
  for(let i = 0; i < rings; i++){ const a = i/rings*TAU; P.push([.34*Math.cos(a), .34*Math.sin(a), 0]); }
  for(let i = 0; i < rings; i++){ const a = (i+.5)/rings*TAU; P.push([.18*Math.cos(a), .18*Math.sin(a), .1]); }
  const fix = new Uint8Array(N); fix[id(0,0)] = 1; fix[id(0, rings>>1)] = 1;
  const E = [];
  for(let i = 0; i < rings; i++){ E.push([id(0,i), id(0,(i+1)%rings), 2.6]); E.push([id(1,i), id(1,(i+1)%rings), 1.8]); }
  for(let i = 0; i < rings; i++){ E.push([id(0,i), id(1,i), -1.1]); E.push([id(0,i), id(1,(i+rings-1)%rings), .9]); }
  solveGE(P, E, fix, -.01);
  tenseGuard(P, Array.from({length:rings}, (_,i) => id(1,i)), .28);
  const { prj } = projector(P, W, H, "iso", { cx: .38, cy: .58, sxr: .32 });
  for(const [a,b,q] of E){ const A = prj(P[a]), B = prj(P[b]);
    g.strokeStyle = q < 0 ? "rgba(255,140,60,.9)" : U.rgba(c, .6); g.lineWidth = q < 0 ? 4 : 1; g.lineCap = "round";
    g.beginPath(); g.moveTo(A[0],A[1]); g.lineTo(B[0],B[1]); g.stroke(); }
  markFix(g, P, fix, prj);
  const vals = E.map(([,,q]) => q).sort((a,b) => a-b), bx = W*.72, bw = W*.24, by = H*.15, bh = H*.7, vmax = Math.max(...vals.map(Math.abs));
  vals.forEach((v, i) => { const hh = Math.abs(v)/vmax*bh*.9, x = bx + i*bw/vals.length;
    g.fillStyle = Math.abs(v) < vmax*.12 ? "#ff4d4d" : (v < 0 ? "rgba(255,140,60,.8)" : U.rgba(c,.75));
    g.fillRect(x, by + bh - hh, bw/vals.length - 1, hh); });
  g.strokeStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.moveTo(bx, by+bh); g.lineTo(bx+bw, by+bh); g.stroke();
};
C["E06-04"].ratio = 1.1;

// E06-05 Ariadne：以最佳化迴圈包住 FDM 求解，逼近目標索長；面板外框＋右上角收斂曲線暗示即時串流預覽
C["E06-05"] = function(g, W, H, r, c){
  const { n, N, P, id } = quadGrid(8), fix = new Uint8Array(N);
  [id(0,0), id(n-1,0), id(0,n-1), id(n-1,n-1)].forEach(k => fix[k] = 1);
  let E = quadEdges(n, id, () => 1);
  const targetLen = .11, losses = [];
  for(let iter = 0; iter < 8; iter++){
    solveCG(P, E, fix, -.04);
    let loss = 0;
    E = E.map(([a,b,q]) => { const len = Math.hypot(P[b][0]-P[a][0], P[b][1]-P[a][1], P[b][2]-P[a][2]);
      loss += (len-targetLen)*(len-targetLen); const nq = Math.max(.1, q + (len-targetLen)*4); return [a,b,nq]; });
    losses.push(loss);
  }
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1.5;
  if(g.roundRect){ g.beginPath(); g.roundRect(W*.04, H*.04, W*.92, H*.92, 10); g.stroke(); }
  const { prj } = projector(P, W, H, "iso", { cx: .42, cy: .6, sxr: .34 });
  shadeQuads(g, P, quadsOf(n, n, id), prj, [120, 190, 255], .08, .45, (a, b) => a[0] + a[1] + b[0] + b[1]);   // 即時串流預覽的著色網格
  drawNet(g, P, E, forcesOf(P, E), prj, c, {});
  markFix(g, P, fix, prj);
  const gx = W*.62, gy = H*.08, gw = W*.32, gh = H*.16, lmax = Math.max(...losses);
  g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1.6; g.beginPath();
  losses.forEach((l, i) => { const x = gx + i/(losses.length-1)*gw, y = gy + gh - l/lmax*gh; i ? g.lineTo(x,y) : g.moveTo(x,y); }); g.stroke();
  g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(gx, gy+gh, gw, 1);
};
C["E06-05"].ratio = 1.1;

// E06-06 Grasshopper 元件：畫成元件外框＋輸入輸出端子，內部是求解後的索網小預覽
C["E06-06"] = function(g, W, H, r, c){
  const bx = W*.14, by = H*.22, bw = W*.72, bh = H*.56;
  g.fillStyle = "rgba(255,255,255,.06)"; g.strokeStyle = U.rgba(c, .8); g.lineWidth = 2;
  g.beginPath(); if(g.roundRect) g.roundRect(bx, by, bw, bh, 14); else g.rect(bx,by,bw,bh); g.fill(); g.stroke();
  const inputs = 4, outputs = 2;
  for(let i = 0; i < inputs; i++){ const y = by + (i+1)*bh/(inputs+1); g.fillStyle = "#fff"; g.beginPath(); g.arc(bx, y, 4, 0, TAU); g.fill();
    g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.beginPath(); g.moveTo(bx-18,y); g.lineTo(bx,y); g.stroke(); }
  for(let i = 0; i < outputs; i++){ const y = by + (i+1)*bh/(outputs+1); g.fillStyle = c; g.beginPath(); g.arc(bx+bw, y, 4, 0, TAU); g.fill();
    g.strokeStyle = U.rgba(c,.5); g.lineWidth = 1; g.beginPath(); g.moveTo(bx+bw,y); g.lineTo(bx+bw+18,y); g.stroke(); }
  const { n, N, P, id } = quadGrid(7), fix = new Uint8Array(N);
  [id(0,0), id(n-1,0), id(0,n-1), id(n-1,n-1)].forEach(k => fix[k] = 1);
  const ratios = Array.from({length:N}, () => .6 + r()*1.2);
  const E = quadEdges(n, id, (a,b) => ratios[a]*ratios[b]);
  solveCG(P, E, fix, -.05);
  const { prj } = projector(P, W, H, "iso", { cx: .5, cy: .5, sxr: .26, hs: .22 });
  drawNet(g, P, E, forcesOf(P, E), prj, c, { wMin: .5, wRange: 1.3 });
};
C["E06-06"].ratio = .9;

// E06-07 FDMremote：左為 Grasshopper 節點圖，中間虛線與伺服器圖示代表傳給本機 Julia，右為求解結果
C["E06-07"] = function(g, W, H, r, c){
  const midx = W*.46;
  const nodes = [[.1,.2],[.1,.55],[.1,.85],[.3,.35],[.3,.7]];
  const links = [[0,3],[1,3],[1,4],[2,4],[3,4]];
  const np = nodes.map(([x,y]) => [midx*x/.4, H*y]);
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.2;
  links.forEach(([a,b]) => { g.beginPath(); g.moveTo(np[a][0],np[a][1]); g.lineTo(np[b][0],np[b][1]); g.stroke(); });
  nodes.forEach((n2,i) => { g.fillStyle = i>=3 ? U.rgba(c,.8) : "rgba(255,255,255,.7)"; g.fillRect(np[i][0]-8, np[i][1]-6, 16, 12); });
  g.strokeStyle = "rgba(255,255,255,.3)"; g.setLineDash([3,4]); g.lineWidth = 1.4; g.beginPath(); g.moveTo(midx, H*.15); g.lineTo(midx, H*.85); g.stroke(); g.setLineDash([]);
  g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(midx-10, H*.46, 20, 22); g.strokeStyle = "rgba(255,255,255,.4)"; g.strokeRect(midx-10, H*.46, 20, 22);
  for(let i=0;i<3;i++){ g.fillStyle="rgba(255,255,255,.5)"; g.beginPath(); g.arc(midx, H*.5+i*6, 1.4, 0, TAU); g.fill(); }
  const { n, N, P, id } = quadGrid(8), fix = new Uint8Array(N);
  [id(0,0), id(n-1,0), id(0,n-1), id(n-1,n-1)].forEach(k => fix[k] = 1);
  const E = quadEdges(n, id, () => .8 + r()*.6);
  solveCG(P, E, fix, -.05);
  const { prj } = projector(P, W, H, "iso", { cx: .74, cy: .55, sxr: .24, hs: .3 });
  drawNet(g, P, E, forcesOf(P, E), prj, c, {});
};
C["E06-07"].ratio = 1.05;

// E06-08 Programming the Force Density Method：畫出從第一次求解到收斂解的多輪迭代，並疊上模糊的實體模型範圍
C["E06-08"] = function(g, W, H, r, c){
  const { n, N, P, id } = quadGrid(9), fix = new Uint8Array(N);
  [id(0,0), id(n-1,0), id(0,n-1), id(n-1,n-1)].forEach(k => fix[k] = 1);
  let E = quadEdges(n, id, () => 1);
  const { prj } = projector(P, W, H, "iso", { cy: .6, sxr: .4 });
  const blob = g.createRadialGradient(W*.47,H*.55,10, W*.47,H*.55, Math.min(W,H)*.34);
  blob.addColorStop(0, "rgba(255,255,255,.05)"); blob.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = blob; g.beginPath(); g.arc(W*.47,H*.55, Math.min(W,H)*.34, 0, TAU); g.fill();
  const rounds = 4;
  for(let it = 0; it < rounds; it++){
    solveCG(P, E, fix, 0);
    const t = it/(rounds-1), alpha = it === 0 ? .9 : .25 + .2*t;
    g.globalAlpha = alpha; g.lineCap = "round";
    for(const [a,b] of E){ const A = prj(P[a]), B = prj(P[b]); g.strokeStyle = it === 0 ? "#fff" : U.rgba(c, .8); g.lineWidth = it === 0 ? 1.3 : .8;
      if(it === 0) g.setLineDash([3,2]); g.beginPath(); g.moveTo(A[0],A[1]); g.lineTo(B[0],B[1]); g.stroke(); g.setLineDash([]); }
    E = E.map(([a,b]) => { const len = Math.hypot(P[b][0]-P[a][0], P[b][1]-P[a][1], P[b][2]-P[a][2]) || .01; return [a, b, 1/len]; });
  }
  g.globalAlpha = 1; markFix(g, P, fix, prj);
};
C["E06-08"].ratio = .95;

// E06-51 Shell Form Finding：左半 FDM 靜態解，右半動態鬆弛的質點軌跡尾巴，底部為 STL 分層示意
C["E06-51"] = function(g, W, H, r, c){
  const midx = W*.5;
  const { n, N, P, id } = quadGrid(8), fix = new Uint8Array(N);
  [id(0,0), id(n-1,0), id(0,n-1), id(n-1,n-1)].forEach(k => fix[k] = 1);
  const E = quadEdges(n, id, () => 1);
  solveCG(P, E, fix, -.05);
  const { prj: prjL } = projector(P, W, H, "iso", { cx: .27, cy: .5, sxr: .22, hs: .26 });
  drawNet(g, P, E, forcesOf(P, E), prjL, c, {});
  const { prj: prjR } = projector(P, W, H, "iso", { cx: .73, cy: .5, sxr: .22, hs: .26 });
  for(const [a,b] of E){ const A = prjR(P[a]), B = prjR(P[b]); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = .7; g.beginPath(); g.moveTo(A[0],A[1]); g.lineTo(B[0],B[1]); g.stroke(); }
  for(let k = 0; k < N; k++) if(!fix[k]){ const p = prjR(P[k]), tail = prjR([P[k][0]+(r()-.5)*.05, P[k][1]+(r()-.5)*.05, P[k][2]-.03]);
    g.strokeStyle = U.rgba(c, .5); g.lineWidth = 1; g.beginPath(); g.moveTo(tail[0],tail[1]); g.lineTo(p[0],p[1]); g.stroke();
    g.fillStyle = c; g.beginPath(); g.arc(p[0],p[1],1.6,0,TAU); g.fill(); }
  g.strokeStyle = "rgba(255,255,255,.15)"; g.beginPath(); g.moveTo(midx, H*.08); g.lineTo(midx, H*.78); g.stroke();
  const sy = H*.86, sh = H*.1, layers = 10;
  for(let i = 0; i < layers; i++){ g.strokeStyle = U.rgba(c, .25 + .5*(i/layers)); g.lineWidth = 1;
    g.beginPath(); g.moveTo(W*.12, sy + sh - i*sh/layers); g.lineTo(W*.88, sy + sh - i*sh/layers*.6); g.stroke(); }
};
C["E06-51"].ratio = 1.2;

// E06-52 ForceDensityAPI：5×5 小網格對照右上角矩陣，底部排出 25 種力密度比例組合的縮圖（設計空間取樣）
C["E06-52"] = function(g, W, H, r, c){
  const { n, N, P, id } = quadGrid(5), fix = new Uint8Array(N);
  [id(0,0), id(n-1,0), id(0,n-1), id(n-1,n-1)].forEach(k => fix[k] = 1);
  const E = quadEdges(n, id, () => 1 + r()*.6);
  solveCG(P, E, fix, -.06);
  const { prj } = projector(P, W, H, "iso", { cx: .3, cy: .35, sxr: .22, hs: .3 });
  drawNet(g, P, E, forcesOf(P, E), prj, c, { wMin: 1, wRange: 2 });
  markFix(g, P, fix, prj, 3);
  const row = new Int32Array(N); let nf = 0; for(let k=0;k<N;k++) row[k] = fix[k]?-1:nf++;
  const box = Math.min(W,H)*.3, bx = W*.6, by = H*.06;
  g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(bx,by,box,box); g.strokeStyle = U.rgba(c,.5); g.strokeRect(bx,by,box,box);
  const cell = box/nf; g.fillStyle = U.rgba(c,.9); for(let i=0;i<nf;i++) g.fillRect(bx+i*cell, by+i*cell, Math.max(1,cell), Math.max(1,cell));
  g.fillStyle = "rgba(255,255,255,.7)";
  for(const [a,b] of E){ const A=row[a], B=row[b]; if(A>=0&&B>=0){ g.fillRect(bx+A*cell, by+B*cell, Math.max(1,cell), Math.max(1,cell)); g.fillRect(bx+B*cell, by+A*cell, Math.max(1,cell), Math.max(1,cell)); } }
  const gs = 5, gx0 = W*.06, gy0 = H*.62, cw = W*.86/gs, ch2 = H*.32/gs;
  for(let a = 0; a < gs; a++) for(let bq = 0; bq < gs; bq++){
    const { P: P2, N: N2, id: id2, n: n2 } = quadGrid(4), fix2 = new Uint8Array(N2);
    [id2(0,0), id2(n2-1,0), id2(0,n2-1), id2(n2-1,n2-1)].forEach(k => fix2[k] = 1);
    const E2 = quadEdges(n2, id2, () => 1 + a*.3);
    solveCG(P2, E2, fix2, -.02 - bq*.008);
    const { prj: pj2 } = projector(P2, cw, ch2, "iso", { cx: .5, cy: .55, sxr: .32, hs: .3 });
    for(const [p,q2] of E2){ const A = pj2(P2[p]), B = pj2(P2[q2]); g.strokeStyle = U.rgba(c, .5); g.lineWidth = .6;
      g.beginPath(); g.moveTo(gx0+a*cw+A[0], gy0+bq*ch2+A[1]); g.lineTo(gx0+a*cw+B[0], gy0+bq*ch2+B[1]); g.stroke(); }
  }
};
C["E06-52"].ratio = 1.3;

// E06-53 Force_Density_Method：圓形固定邊界＋放射狀網格，依「中心性」把靠近中心的徑向主肋加粗
C["E06-53"] = function(g, W, H, r, c){
  const rings = 7, spokes = 20, N = rings*spokes + 1, P = [], id = (ri,si) => ri*spokes+si, center = N-1;
  for(let ri = 0; ri < rings; ri++){ const rad = .42*(ri+1)/rings; for(let si = 0; si < spokes; si++){ const a = si/spokes*TAU; P.push([rad*Math.cos(a), rad*Math.sin(a), 0]); } }
  P.push([0,0,0]);
  const fix = new Uint8Array(N); for(let si = 0; si < spokes; si++) fix[id(rings-1, si)] = 1;
  const E = [];
  for(let ri = 0; ri < rings; ri++) for(let si = 0; si < spokes; si++){
    const cent = 1 - ri/rings, a = id(ri, si), b = id(ri, (si+1)%spokes);
    E.push([a, b, .5 + .3*cent]);
    if(ri === 0) E.push([a, center, 2 + 2*cent]);
    if(ri < rings-1) E.push([a, id(ri+1, si), .8 + 2.2*cent]);
  }
  solveCG(P, E, fix, -.05);
  const { prj } = projector(P, W, H, "iso", { cy: .68, sxr: .42, hs: .3 });
  drawNet(g, P, E, forcesOf(P, E), prj, c, { wMin: .5, wRange: 2.4 });
  markFix(g, P, fix, prj, 2);
};
C["E06-53"].ratio = 1.05;
})();
