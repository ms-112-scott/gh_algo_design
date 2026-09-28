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
