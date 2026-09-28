/* D02 黏菌（Physarum）：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
const TAU = Math.PI*2;
const ACC = "#3FD0C9";   // 第二物種／水系的青綠點綴
const GOLD = "#F2C14E";  // 燕麥片、食物點

/* ---------- 共用小工具 ---------- */
// 家族色明暗：k<1 變暗、k>1 往白色推
function sh(c, k, a){ const [R,G,B] = U.rgb(c), f = v => Math.round(k >= 1 ? v + (255-v)*Math.min(1,k-1) : v*k); return `rgba(${f(R)},${f(G)},${f(B)},${a == null ? 1 : a})`; }
// 深底 → 家族色 → 白 的色階
function ramp(c){ const [R,G,B] = U.rgb(c);
  return t => { t = t < 0 ? 0 : t > 1 ? 1 : t; const a = Math.min(1, t/.72), w = Math.max(0, (t-.72)/.28);
    return [21 + (R-21)*a + (255-R)*w, 21 + (G-21)*a + (255-G)*w, 27 + (B-27)*a + (255-B)*w]; }; }
// 把 n×m 的像素函式畫到畫面上的 (x,y,w,h)；f 回傳 [R,G,B,A] 或 null（透明）
function paint(g, n, m, f, x, y, w, h, smooth){
  const off = document.createElement("canvas"); off.width = n; off.height = m;
  const o = off.getContext("2d"), im = o.createImageData(n, m), d = im.data;
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const p = f(i, j); if(!p) continue; const k = (j*n+i)*4;
    d[k] = p[0]; d[k+1] = p[1]; d[k+2] = p[2]; d[k+3] = p.length > 3 ? p[3] : 255; }
  o.putImageData(im, 0, 0); g.imageSmoothingEnabled = smooth !== false; g.drawImage(off, x, y, w, h); g.imageSmoothingEnabled = true;
  return off;
}
// 在 n×m 小畫布上畫向量圖形（多邊形、線），讀回 alpha 當遮罩或權重
function raster(n, m, draw){
  const off = document.createElement("canvas"); off.width = n; off.height = m;
  const o = off.getContext("2d", {willReadFrequently: true}); draw(o, n, m);
  const d = o.getImageData(0, 0, n, m).data, a = new Float32Array(n*m); for(let k = 0; k < n*m; k++) a[k] = d[k*4+3]/255; return a;
}
// 取高百分位當正規化上限（避免食物點的極大值把整張圖壓暗）
function pct(T, q){ const s = []; for(let k = 0; k < T.length; k += 3) if(T[k] > 0) s.push(T[k]); if(!s.length) return 1; s.sort((a,b) => a-b); return s[Math.min(s.length-1, (s.length*q)|0)] || 1; }
function pip(x, y, P){ let ins = false; for(let i = 0, j = P.length-1; i < P.length; j = i++){ const [xi,yi] = P[i], [xj,yj] = P[j]; if((yi > y) !== (yj > y) && x < (xj-xi)*(y-yi)/(yj-yi) + xi) ins = !ins; } return ins; }
function arrow(g, x1, y1, x2, y2, col, lw){ g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw || 1.4; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
  const a = Math.atan2(y2-y1, x2-x1); g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-7*Math.cos(a-.4), y2-7*Math.sin(a-.4)); g.lineTo(x2-7*Math.cos(a+.4), y2-7*Math.sin(a+.4)); g.closePath(); g.fill(); }
function rrect(g, x, y, w, h, rad){ g.beginPath(); g.moveTo(x+rad,y); g.arcTo(x+w,y,x+w,y+h,rad); g.arcTo(x+w,y+h,x,y+h,rad); g.arcTo(x,y+h,x,y,rad); g.arcTo(x,y,x+w,y,rad); g.closePath(); }
function glow(g, x, y, R, col, a){ const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, U.rgba(col, a)); gr.addColorStop(1, U.rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill(); }

// 3×3 可分離平均擴散＋衰減；wrap 為環面邊界，否則邊界夾住
function blur(T, t, n, m, dec, wrap, blk){
  for(let j = 0; j < m; j++){ const o = j*n; for(let i = 0; i < n; i++){ const l = i ? i-1 : (wrap ? n-1 : 0), rr = i < n-1 ? i+1 : (wrap ? 0 : n-1); t[o+i] = (T[o+l] + T[o+i] + T[o+rr]) / 3; } }
  for(let j = 0; j < m; j++){ const u = (j ? j-1 : (wrap ? m-1 : 0))*n, d = (j < m-1 ? j+1 : (wrap ? 0 : m-1))*n, o = j*n; for(let i = 0; i < n; i++) T[o+i] = (t[u+i] + t[o+i] + t[d+i]) / 3 * dec; }
  if(blk) for(let k = 0; k < T.length; k++) if(blk[k]) T[k] = 0;
}
/* 2D 黏菌模擬（Jones 模型）：感測 → 轉向 → 前進 → 沉積 → 擴散衰減
   o: n,m 格數；A 代理人數；it 步數；sa 感測角；sd 感測距離；ra 轉向角；dec 衰減；wrap 環面
      blk 障礙（Uint8Array）；bias 額外感測權重（Float32Array）；food [[x,y,量]]
      sp=2 兩物種互斥；par(x,y)→[sa,sd] 逐代理人參數；init(r,q)→[x,y,角,物種]
      rec 記錄前幾個代理人的軌跡；recFrom 從第幾步開始記；snap 要存快照的步數陣列 */
function sim(o, r){
  const n = o.n, m = o.m, N = n*m, S = o.sp || 1, wrap = o.wrap !== false, blk = o.blk || null, bias = o.bias || null;
  const T = []; for(let s = 0; s < S; s++) T.push(new Float32Array(N)); const tmp = new Float32Array(N);
  const A = o.A || 2000, it = o.it || 80, SA0 = o.sa ?? .5, SD0 = o.sd ?? 5, RA = o.ra ?? .45, DEC = o.dec ?? .88, rep = o.rep ?? 1, food = o.food || [];
  const ax = new Float32Array(A), ay = new Float32Array(A), aa = new Float32Array(A), as = new Uint8Array(A);
  for(let q = 0; q < A; q++){
    if(o.init){ const p = o.init(r, q); ax[q] = p[0]; ay[q] = p[1]; aa[q] = p[2]; as[q] = p[3] || 0; continue; }
    let x, y, t = 0; do { x = r()*n; y = r()*m; t++; } while(blk && blk[(y|0)*n + (x|0)] && t < 40);
    ax[q] = x; ay[q] = y; aa[q] = r()*TAU; as[q] = S === 2 ? q & 1 : 0;
  }
  const sense = (s, x, y) => {
    let xi = Math.floor(x), yi = Math.floor(y);
    if(wrap){ xi = ((xi % n) + n) % n; yi = ((yi % m) + m) % m; } else if(xi < 0 || yi < 0 || xi >= n || yi >= m) return -1e9;
    const k = yi*n + xi; if(blk && blk[k]) return -1e9;
    let v = T[s][k]; if(S === 2) v -= T[1-s][k]*rep; if(bias) v += bias[k]; return v;
  };
  const paths = o.rec ? [...Array(o.rec)].map(() => [[]]) : null, snaps = [];
  for(let step = 0; step < it; step++){
    for(let q = 0; q < A; q++){
      const x = ax[q], y = ay[q], a = aa[q], s = as[q];
      let SA = SA0, SD = SD0; if(o.par){ const p = o.par(x, y); SA = p[0]; SD = p[1]; }
      const F = sense(s, x + Math.cos(a)*SD, y + Math.sin(a)*SD), L = sense(s, x + Math.cos(a-SA)*SD, y + Math.sin(a-SA)*SD), R = sense(s, x + Math.cos(a+SA)*SD, y + Math.sin(a+SA)*SD);
      let na = a;
      if(F >= L && F >= R){} else if(F < L && F < R) na += (r() < .5 ? -1 : 1)*RA; else if(L > R) na -= RA; else na += RA;
      let nx = x + Math.cos(na), ny = y + Math.sin(na);
      if(wrap){ if(nx < 0 || nx >= n || ny < 0 || ny >= m){ if(paths && q < o.rec) paths[q].push([]); } nx = (nx + n) % n; ny = (ny + m) % m; }
      else if(nx < 0 || ny < 0 || nx >= n || ny >= m){ aa[q] = r()*TAU; continue; }
      const k = (ny|0)*n + (nx|0);
      if(blk && blk[k]){ aa[q] = r()*TAU; continue; }
      ax[q] = nx; ay[q] = ny; aa[q] = na; T[s][k] += 1;
      if(paths && q < o.rec && step >= (o.recFrom || 0)) paths[q][paths[q].length-1].push([nx, ny]);
    }
    for(const [fx, fy, amt] of food){ const k = (fy|0)*n + (fx|0); for(let s = 0; s < S; s++){ T[s][k] += amt; if(fx >= 1 && fx < n-1){ T[s][k-1] += amt*.5; T[s][k+1] += amt*.5; } } }
    for(let s = 0; s < S; s++) blur(T[s], tmp, n, m, DEC, wrap, blk);
    if(o.snap && o.snap.includes(step+1)) snaps.push(T[0].slice());
  }
  return {T, n, m, ax, ay, as, paths, snaps, mx: T.map(t => pct(t, .985))};
}
/* 3D 黏菌：體素痕跡場＋帶方向向量的代理人（前方 1 個＋周圍 4 個感測器） */
function sim3(o, r){
  const n = o.n, N = n*n*n, T = new Float32Array(N), t = new Float32Array(N), A = o.A || 1500, it = o.it || 50, SD = o.sd ?? 3, SA = o.sa ?? .6, DEC = o.dec ?? .86;
  const blk = new Uint8Array(N); if(o.inside) for(let z = 0; z < n; z++) for(let y = 0; y < n; y++) for(let x = 0; x < n; x++) blk[(z*n+y)*n+x] = o.inside(x+.5, y+.5, z+.5) ? 0 : 1;
  const P = new Float32Array(A*3), D = new Float32Array(A*3);
  const rnd = () => { let x, y, z, l; do { x = r()*2-1; y = r()*2-1; z = r()*2-1; l = x*x+y*y+z*z; } while(l > 1 || l < .01); l = Math.sqrt(l); return [x/l, y/l, z/l]; };
  for(let q = 0; q < A; q++){ let x, y, z, k = 0; do { x = r()*n; y = r()*n; z = r()*n; k++; } while(blk[((z|0)*n + (y|0))*n + (x|0)] && k < 60);
    P[q*3] = x; P[q*3+1] = y; P[q*3+2] = z; const d = rnd(); D[q*3] = d[0]; D[q*3+1] = d[1]; D[q*3+2] = d[2]; }
  const wr = !!o.wrap, md = v => ((v % n) + n) % n;
  const at = (x, y, z) => { if(wr){ x = md(x); y = md(y); z = md(z); } const xi = x|0, yi = y|0, zi = z|0; if(x < 0 || y < 0 || z < 0 || xi >= n || yi >= n || zi >= n) return -1; const k = (zi*n+yi)*n+xi; return blk[k] ? -1 : T[k]; };
  const food = o.food || [];
  for(let s = 0; s < it; s++){
    for(let q = 0; q < A; q++){
      const i3 = q*3, px = P[i3], py = P[i3+1], pz = P[i3+2]; let dx = D[i3], dy = D[i3+1], dz = D[i3+2];
      // 垂直基底 u、v
      let ux = dy, uy = -dx, uz = 0; if(Math.abs(dz) > .9){ ux = 0; uy = dz; uz = -dy; } let ul = Math.hypot(ux,uy,uz) || 1; ux /= ul; uy /= ul; uz /= ul;
      const vx = dy*uz - dz*uy, vy = dz*ux - dx*uz, vz = dx*uy - dy*ux;
      let best = at(px + dx*SD, py + dy*SD, pz + dz*SD), bx = dx, by = dy, bz = dz; const ph = r()*TAU, ca = Math.cos(SA), sa = Math.sin(SA);
      for(let k = 0; k < 4; k++){ const f = ph + k*TAU/4, cf = Math.cos(f)*sa, sf = Math.sin(f)*sa;
        const ex = dx*ca + ux*cf + vx*sf, ey = dy*ca + uy*cf + vy*sf, ez = dz*ca + uz*cf + vz*sf, val = at(px + ex*SD, py + ey*SD, pz + ez*SD);
        if(val > best){ best = val; bx = ex; by = ey; bz = ez; } }
      dx += (bx - dx)*.6 + (r()-.5)*.15; dy += (by - dy)*.6 + (r()-.5)*.15; dz += (bz - dz)*.6 + (r()-.5)*.15; const l = Math.hypot(dx,dy,dz) || 1; dx /= l; dy /= l; dz /= l;
      let nx = px + dx, ny = py + dy, nz = pz + dz; if(wr){ nx = md(nx); ny = md(ny); nz = md(nz); }
      if(at(nx, ny, nz) < 0){ const d = rnd(); D[i3] = d[0]; D[i3+1] = d[1]; D[i3+2] = d[2]; continue; }
      P[i3] = nx; P[i3+1] = ny; P[i3+2] = nz; D[i3] = dx; D[i3+1] = dy; D[i3+2] = dz; T[((nz|0)*n + (ny|0))*n + (nx|0)] += 1;
    }
    for(const [fx, fy, fz, amt] of food) T[((fz|0)*n + (fy|0))*n + (fx|0)] += amt;
    // 三軸可分離擴散
    const nn = n*n;
    for(let k = 0; k < N; k++){ const x = k % n; t[k] = (T[x ? k-1 : k] + T[k] + T[x < n-1 ? k+1 : k]) / 3; }
    for(let k = 0; k < N; k++){ const y = ((k/n)|0) % n; T[k] = (t[y ? k-n : k] + t[k] + t[y < n-1 ? k+n : k]) / 3; }
    for(let k = 0; k < N; k++){ const z = (k/nn)|0; t[k] = (T[z ? k-nn : k] + T[k] + T[z < n-1 ? k+nn : k]) / 3 * DEC; }
    for(let k = 0; k < N; k++) T[k] = blk[k] ? 0 : t[k];
  }
  return {T, n, mx: pct(T, .99)};
}
// 3D 痕跡場取門檻以上的體素，投影後依深度排序畫成小方塊
function voxpts(g, s, proj, thr, c, size, alpha){
  const {T, n, mx} = s, L = [];
  for(let z = 0; z < n; z++) for(let y = 0; y < n; y++) for(let x = 0; x < n; x++){ const v = T[(z*n+y)*n+x]/mx; if(v > thr){ const p = proj(x+.5, y+.5, z+.5); L.push([p[0], p[1], p[2], v]); } }
  L.sort((a,b) => a[2] - b[2]); let dmin = 1e9, dmax = -1e9; L.forEach(p => { dmin = Math.min(dmin, p[2]); dmax = Math.max(dmax, p[2]); });
  L.forEach(([x, y, d, v]) => { const k = (d - dmin)/((dmax - dmin) || 1); g.fillStyle = sh(c, .45 + k*.95, (alpha || .9)*(.5 + .5*Math.min(1,v))); const q = size*(.6 + .6*Math.min(1, v)); g.fillRect(x - q/2, y - q/2, q, q); });
  return L.length;
}
function box3(g, proj, n, col, dash){ const E = [[0,0,0,1,0,0],[0,0,0,0,1,0],[1,0,0,1,1,0],[0,1,0,1,1,0],[0,0,1,1,0,1],[0,0,1,0,1,1],[1,0,1,1,1,1],[0,1,1,1,1,1],[0,0,0,0,0,1],[1,0,0,1,0,1],[0,1,0,0,1,1],[1,1,0,1,1,1]];
  g.strokeStyle = col; g.lineWidth = 1; if(dash) g.setLineDash(dash);
  E.forEach(e => { const a = proj(e[0]*n, e[1]*n, e[2]*n), b = proj(e[3]*n, e[4]*n, e[5]*n); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }); g.setLineDash([]); }
// 等角投影（繞 z 軸轉 rot），回傳 [螢幕x, 螢幕y, 深度]
function isoP(cx, cy, u, rot, tilt){ const cr = Math.cos(rot), sr = Math.sin(rot), tl = tilt ?? .5;
  return (x, y, z) => { const X = x*cr - y*sr, Y = x*sr + y*cr; return [cx + X*u, cy + Y*u*tl - z*u*.95, Y*tl + z*.3]; }; }
// 在不重疊的前提下撒點（食物點、城市）
function spread(r, k, x0, y0, w, h, dmin){ const F = []; for(let i = 0; i < k; i++){ let p; for(let t = 0; t < 40; t++){ p = [x0 + r()*w, y0 + r()*h]; if(F.every(q => Math.hypot(q[0]-p[0], q[1]-p[1]) > dmin)) break; } F.push(p); } return F; }
// 最小生成樹（Prim）
function mst(P){ const inT = [0], E = [], rest = P.map((_, i) => i).slice(1);
  while(rest.length){ let b = null, bd = 1e9; for(const i of inT) for(const j of rest){ const d = Math.hypot(P[i][0]-P[j][0], P[i][1]-P[j][1]); if(d < bd){ bd = d; b = [i, j]; } }
    E.push(b); inT.push(b[1]); rest.splice(rest.indexOf(b[1]), 1); } return E; }

/* ================= 變形 ================= */
ART.var["D02"] = [
  // V01 食物點吸引（Tero 式網絡）：米色培養基上，燕麥片之間收斂成交通網
  function(g, W, H, r, c){
    const n = 96, m = Math.round(n*H/W), F = spread(r, 9, 8, 8, n-16, m-16, 16);
    const s = sim({n, m, A: 2400, it: 60, wrap: false, sd: 4, sa: .5, dec: .86, food: F.map(p => [p[0], p[1], 6])}, r), T = s.T[0], mx = s.mx[0];
    g.fillStyle = "#E7DFCB"; g.fillRect(0, 0, W, H);
    const [R,G,B] = U.rgb(c);
    paint(g, n, m, (i,j) => { const t = Math.min(1, Math.pow(T[j*n+i]/mx*1.3, 1.2)); return t < .06 ? null : [R*.62, G*.55, B*.7, t*240]; }, 0, 0, W, H);
    const sx = W/n, sy = H/m;
    F.forEach(([x,y], i) => { const px = x*sx, py = y*sy, a = r()*TAU;
      g.strokeStyle = sh(c, .6, .5); g.lineWidth = 1; g.setLineDash([2,2]); g.beginPath(); g.arc(px, py, 11, 0, TAU); g.stroke(); g.setLineDash([]);
      g.save(); g.translate(px, py); g.rotate(a); g.fillStyle = "#F6EBCB"; g.strokeStyle = "#A8864F"; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, 0, 6, 3.6, 0, 0, TAU); g.fill(); g.stroke();
      g.strokeStyle = "rgba(168,134,79,.6)"; g.beginPath(); g.moveTo(-4, 0); g.lineTo(4, 0); g.stroke(); g.restore(); });
  },
  // V02 障礙與邊界遮罩：基地平面圖，網絡只在紅線內生長並繞過既有建物
  function(g, W, H, r, c){
    const n = 96, m = Math.round(n*H/W), nz = U.vnoise((r()*1e6)|0), cx = n/2, cy = m/2;
    const bd = [...Array(26)].map((_, k) => { const a = k/26*TAU, rr = (.36 + nz(Math.cos(a)*1.5+3, Math.sin(a)*1.5+3)*.14); return [cx + Math.cos(a)*n*rr*1.05, cy + Math.sin(a)*m*rr]; });
    const bl = []; for(let k = 0; k < 5; k++){ const w = 8 + r()*12, h = 6 + r()*12; for(let t = 0; t < 30; t++){ const x = cx - n*.3 + r()*n*.6 - w/2, y = cy - m*.3 + r()*m*.6 - h/2;
      if(bl.every(b => x > b[0]+b[2]+4 || x+w+4 < b[0] || y > b[1]+b[3]+4 || y+h+4 < b[1])){ bl.push([x, y, w, h]); break; } } }
    const blk = new Uint8Array(n*m); for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const x = i+.5, y = j+.5; blk[j*n+i] = !pip(x, y, bd) || bl.some(b => x > b[0] && x < b[0]+b[2] && y > b[1] && y < b[1]+b[3]) ? 1 : 0; }
    const s = sim({n, m, A: 2200, it: 45, wrap: false, blk, sd: 3.5, dec: .86}, r), T = s.T[0], mx = s.mx[0], f = ramp(c);
    const sx = W/n, sy = H/m;
    // 基地外：斜線填充
    g.save(); g.beginPath(); g.rect(0, 0, W, H); U.poly(g, bd.map(p => [p[0]*sx, p[1]*sy]), true); g.clip("evenodd");
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; for(let k = -H; k < W; k += 7){ g.beginPath(); g.moveTo(k, H); g.lineTo(k+H, 0); g.stroke(); } g.restore();
    paint(g, n, m, (i,j) => { if(blk[j*n+i]) return null; const t = Math.pow(T[j*n+i]/mx, .8); const p = f(t); p.push(255*Math.min(1, t*1.6)); return p; }, 0, 0, W, H);
    bl.forEach(b => { g.fillStyle = "rgba(200,200,212,.35)"; g.fillRect(b[0]*sx, b[1]*sy, b[2]*sx, b[3]*sy); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1; g.strokeRect(b[0]*sx, b[1]*sy, b[2]*sx, b[3]*sy);
      g.beginPath(); g.moveTo(b[0]*sx, b[1]*sy); g.lineTo((b[0]+b[2])*sx, (b[1]+b[3])*sy); g.moveTo((b[0]+b[2])*sx, b[1]*sy); g.lineTo(b[0]*sx, (b[1]+b[3])*sy); g.strokeStyle = "rgba(255,255,255,.25)"; g.stroke(); });
    g.strokeStyle = "#E8553F"; g.lineWidth = 1.6; g.setLineDash([7,3,2,3]); U.poly(g, bd.map(p => [p[0]*sx, p[1]*sy]), true); g.stroke(); g.setLineDash([]);
    // 指北針與比例尺
    const nx = W - 18, ny = 20; g.fillStyle = "#fff"; g.beginPath(); g.moveTo(nx, ny-10); g.lineTo(nx+5, ny+6); g.lineTo(nx, ny+3); g.closePath(); g.fill();
    g.strokeStyle = "#fff"; g.beginPath(); g.arc(nx, ny, 11, 0, TAU); g.stroke();
    for(let k = 0; k < 4; k++){ g.fillStyle = k % 2 ? "#fff" : "rgba(255,255,255,.3)"; g.fillRect(10 + k*12, H - 14, 12, 4); }
  },
  // V03 影像引導的濃度場：左半是灰階來源影像，右半是被亮處吸引的網絡
  function(g, W, H, r, c){
    const n = 100, m = Math.round(n*H/W), nz = U.vnoise((r()*1e6)|0), br = new Float32Array(n*m);
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const v = nz(i*.06, j*.06)*.6 + nz(i*.15+9, j*.15)*.4; br[j*n+i] = Math.pow(Math.max(0, (v - .35)/.5), 1.6); }
    const bias = br.map(v => v*2.5), s = sim({n, m, A: 2400, it: 45, bias, sd: 3.5, dec: .86}, r), T = s.T[0], mx = s.mx[0], f = ramp(c), half = n*.44;
    paint(g, n, m, (i,j) => { if(i < half){ const v = 30 + br[j*n+i]*200; return [v, v, v*1.03]; } const t = Math.pow(T[j*n+i]/mx, .75); return f(t*1.1); }, 0, 0, W, H);
    // 右側疊上來源影像亮區的等值線，看出網絡往亮處聚集
    const seg = U.contour(n, m, (i,j) => br[j*n+i], .35), sx = W/n, sy = H/m;
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8; g.beginPath(); seg.forEach(([a,b]) => { if(a[0] < half) return; g.moveTo(a[0]*sx, a[1]*sy); g.lineTo(b[0]*sx, b[1]*sy); }); g.stroke();
    const x = half*sx; g.fillStyle = "#121217"; g.fillRect(x-2, 0, 4, H); g.strokeStyle = "#fff"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(x-6, H/2-7); g.lineTo(x+7, H/2); g.lineTo(x-6, H/2+7); g.closePath(); g.fill();
  },
  // V04 多物種互斥：左右兩群從各自一側出發，交錯成領域分明的雙色斑紋
  function(g, W, H, r, c){
    const n = 100, m = Math.round(n*H/W);
    const s = sim({n, m, A: 3000, it: 50, sp: 2, rep: 1.2, sd: 4, sa: .55, dec: .88, init: (r, q) => { const sp = q & 1; return [sp ? n*.5 + r()*n*.5 : r()*n*.5, r()*m, r()*TAU, sp]; }}, r);
    const [A, B] = s.T, ma = s.mx[0], mb = s.mx[1], [R1,G1,B1] = U.rgb(c), [R2,G2,B2] = U.rgb(ACC);
    paint(g, n, m, (i,j) => { const k = j*n+i, a = Math.min(1.2, A[k]/ma), b = Math.min(1.2, B[k]/mb), w = Math.max(0, Math.min(a,b) - .3)*1.2;
      return [18 + R1*a*.9 + R2*b*.8 + 120*w, 18 + G1*a*.9 + G2*b*.8 + 120*w, 24 + B1*a*.9 + B2*b*.8 + 120*w]; }, 0, 0, W, H);
    // 兩物種圖例
    [[c, 14], [ACC, 30]].forEach(([col, x]) => { g.fillStyle = col; g.beginPath(); g.arc(x, H-14, 5, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1; g.stroke(); });
  },
  // V05 3D 體素黏菌：等角視角的立方空間中長出海綿／骨架網絡
  function(g, W, H, r, c){
    const n = 28, s = sim3({n, A: 4000, it: 40, sd: 2, sa: .55, wrap: true}, r), u = Math.min(W, H)/(n*1.75), P = isoP(W/2, H*.5 - n*u*.1, u, Math.PI/4 + (r()-.5)*.3, .55);
    const Pc = (x,y,z) => P(x - n/2, y - n/2, z - n/2);
    const B = (x,y,z) => Pc(x*n/n, y*n/n, z*n/n);
    // 外框立方體（後側虛線）
    g.strokeStyle = "rgba(255,255,255,.2)"; g.setLineDash([3,3]); g.lineWidth = 1;
    [[0,0,0,n,0,0],[0,0,0,0,n,0],[0,0,0,0,0,n]].forEach(e => { const a = B(e[0],e[1],e[2]), b = B(e[3],e[4],e[5]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }); g.setLineDash([]);
    voxpts(g, s, Pc, .42, c, Math.max(1.8, u*.9), .95);
    g.strokeStyle = "rgba(255,255,255,.45)";
    [[n,0,0,n,n,0],[0,n,0,n,n,0],[0,0,n,n,0,n],[0,0,n,0,n,n],[n,0,n,n,n,n],[0,n,n,n,n,n],[n,0,0,n,0,n],[0,n,0,0,n,n],[n,n,0,n,n,n]].forEach(e => { const a = B(e[0],e[1],e[2]), b = B(e[3],e[4],e[5]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); });
  },
  // V06 曲面上的黏菌：網紋貼附在雙曲殼屋頂上（透視）
  function(g, W, H, r, c){
    const n = 90, m = 60, s = sim({n, m, A: 2600, it: 45, sd: 3, dec: .85}, r), T = s.T[0], mx = s.mx[0], [R,G,B] = U.rgb(c);
    const cx = W/2, cy = H*.55, sc = Math.min(W, H)*.85, rot = -.5;
    const S = (u, v) => { const x = (u-.5)*1.3, y = (v-.5)*.9, z = .28*(1 - (2*u-1)**2) + .18*(2*v-1)**2 - .05; return [x, y, z]; };
    const pr = (x, y, z) => { const X = x*Math.cos(rot) - y*Math.sin(rot), Y = x*Math.sin(rot) + y*Math.cos(rot), d = 1/(1.9 + Y*.9); return [cx + X*sc*d*1.2, cy + (Y*.45 - z)*sc*d*1.5, Y]; };
    // 地面陰影與柱子
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(cx, cy + H*.18, W*.38, H*.08, 0, 0, TAU); g.fill();
    g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.5;
    [[0,0],[1,0],[0,1],[1,1]].forEach(([u,v]) => { const p = S(u,v), a = pr(p[0], p[1], p[2]), b = pr(p[0], p[1], -.32); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
    const NU = 54, NV = 36, Q = [];
    for(let j = 0; j < NV; j++) for(let i = 0; i < NU; i++){ const u0 = i/NU, u1 = (i+1)/NU, v0 = j/NV, v1 = (j+1)/NV;
      const p = [S(u0,v0), S(u1,v0), S(u1,v1), S(u0,v1)].map(q => pr(q[0], q[1], q[2])), d = (p[0][2] + p[2][2])/2;
      const t = Math.min(1, Math.pow(T[((v0+v1)/2*m|0)*n + ((u0+u1)/2*n|0)]/mx, .7)), nrm = .55 + .45*Math.cos((u0 - .5)*2.2 + .6);
      Q.push([d, p, t, nrm]); }
    Q.sort((a, b) => a[0] - b[0]);
    Q.forEach(([d, p, t, k]) => { const w = Math.max(0, t - .7)*2;
      g.fillStyle = `rgb(${(40 + (R-40)*t)*k + 200*w},${(40 + (G-40)*t)*k + 200*w},${(50 + (B-50)*t)*k + 200*w})`;
      g.beginPath(); g.moveTo(p[0][0], p[0][1]); for(let q = 1; q < 4; q++) g.lineTo(p[q][0], p[q][1]); g.closePath(); g.fill(); g.strokeStyle = g.fillStyle; g.lineWidth = .6; g.stroke(); });
    // 殼緣
    g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.2;
    [[t => [t,0]], [t => [1,t]], [t => [t,1]], [t => [0,t]]].forEach(([fn]) => { g.beginPath(); for(let k = 0; k <= 30; k++){ const [u,v] = fn(k/30), q = S(u,v), p = pr(q[0], q[1], q[2]); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); });
  },
  // V07 痕跡場轉等高線：木色雷切板，網絡是實料、網眼切空，紅線為切割路徑
  function(g, W, H, r, c){
    const n = 80, m = Math.round(n*H/W), s = sim({n, m, A: 2000, it: 50, sd: 3.5, dec: .88}, r), T0 = s.T[0], mx = s.mx[0];
    const T = new Float32Array(n*m), t = new Float32Array(n*m); T.set(T0); blur(T, t, n, m, 1, true, null); blur(T, t, n, m, 1, true, null);
    const px = W*.1, py = H*.1, pw = W*.8, ph = H*.8, mg = 5, iso = .32;
    const val = (i,j) => (i < mg || j < mg || i >= n-mg || j >= m-mg) ? 1 : Math.min(1, T[j*n+i]/mx*1.4);
    // 後方第二片板（示意堆疊）
    g.fillStyle = "rgba(217,194,154,.25)"; g.fillRect(px + 10, py - 8, pw, ph);
    g.fillStyle = "#D9C29A"; g.fillRect(px, py, pw, ph);
    paint(g, n, m, (i,j) => val(i,j) < iso ? [20, 20, 26] : null, px, py, pw, ph);
    const seg = U.contour(n, m, val, iso), sx = pw/(n-1), sy = ph/(m-1);
    g.strokeStyle = "#E8553F"; g.lineWidth = .9; g.beginPath(); seg.forEach(([a,b]) => { g.moveTo(px + a[0]*sx, py + a[1]*sy); g.lineTo(px + b[0]*sx, py + b[1]*sy); }); g.stroke();
    g.strokeStyle = "#E8553F"; g.lineWidth = 1; g.strokeRect(px, py, pw, ph);
    [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a,b]) => { g.fillStyle = "#121217"; g.beginPath(); g.arc(a > 0 ? px + 8 : px + pw - 8, b > 0 ? py + 8 : py + ph - 8, 2.4, 0, TAU); g.fill(); });
    // 家族色木紋細線
    g.strokeStyle = sh(c, .9, .18); g.lineWidth = .7; for(let k = 0; k < 6; k++){ const y = py + ph*(k+.5)/6; g.beginPath(); g.moveTo(px, y); g.bezierCurveTo(px + pw*.3, y - 4, px + pw*.6, y + 4, px + pw, y); g.stroke(); }
  },
  // V08 軌跡轉粗細管線：斜俯視的樹枝狀管網，主幹粗、支線細，帶陰影
  function(g, W, H, r, c){
    const n = 80, m = Math.round(n*H/W), s = sim({n, m, A: 2400, it: 55, wrap: false, sd: 3.5, dec: .86, rec: 700, recFrom: 38}, r), T = s.T[0], mx = s.mx[0];
    const sx = W/n, sy = H/m, segs = [];
    s.paths.forEach(pp => pp.forEach(p => { for(let k = 3; k < p.length; k += 3){ const a = p[k-3], b = p[k], v = Math.min(1.3, T[(b[1]|0)*n + (b[0]|0)]/mx); if(v > .25) segs.push([a, b, v]); } }));
    segs.sort((a, b) => a[2] - b[2]);
    g.lineCap = "round";
    const draw = (dx, dy, col, wk, add) => { segs.forEach(([a, b, v]) => { g.strokeStyle = typeof col === "function" ? col(v) : col; g.lineWidth = (1 + v*v*6)*wk + add; g.beginPath(); g.moveTo(a[0]*sx + dx, a[1]*sy + dy); g.lineTo(b[0]*sx + dx, b[1]*sy + dy); g.stroke(); }); };
    draw(4, 5, "rgba(0,0,0,.45)", 1, 1);
    draw(0, 0, v => sh(c, .45 + v*.3), 1, 0);
    draw(-.8*(1), -.8, v => sh(c, 1.05 + v*.2), .45, 0);
    draw(-1.2, -1.2, "rgba(255,255,255,.55)", .12, 0);
  },
  // V09 動畫化（Timer 逐步顯示）：2×2 影格＋底部時間軸與播放頭
  function(g, W, H, r, c){
    const n = 64, m = Math.round(n*(H*.82)/W), st = [4, 18, 45, 110], s = sim({n, m, A: 1600, it: 110, sd: 3.5, dec: .86, snap: st}, r), f = ramp(c);
    const pad = 6, fw = (W - pad*3)/2, fh = (H*.82 - pad*3)/2;
    s.snaps.forEach((T, k) => { const mx = pct(T, .985), x = pad + (k % 2)*(fw + pad), y = pad + ((k/2)|0)*(fh + pad);
      paint(g, n, m, (i,j) => f(Math.pow(T[j*n+i]/mx, .8)), x, y, fw, fh);
      g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.strokeRect(x+.5, y+.5, fw-1, fh-1);
      for(let q = 0; q <= k; q++){ g.fillStyle = "#fff"; g.fillRect(x + 5 + q*6, y + 5, 4, 4); } });
    // 時間軸
    const ty = H*.82 + (H*.18)/2, x0 = W*.08, x1 = W*.92;
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, ty); g.lineTo(x1, ty); g.stroke();
    g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, ty); g.lineTo(x0 + (x1-x0)*.78, ty); g.stroke();
    st.forEach(v => { const x = x0 + (x1-x0)*v/140; g.fillStyle = "#fff"; g.fillRect(x-1, ty-6, 2, 12); });
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x0 + (x1-x0)*.78, ty, 5, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(10, ty-6); g.lineTo(19, ty); g.lineTo(10, ty+6); g.closePath(); g.fill();
  },
  // V10 吸引子調變參數：立面圖，吸引點附近網紋細密、遠處粗疏（透光率漸變）
  function(g, W, H, r, c){
    const fx = W*.08, fy = H*.12, fw = W*.84, fh = H*.72, n = 90, m = Math.round(n*fh/fw), axp = n*(.25 + r()*.5), ayp = m*(.3 + r()*.4), md = Math.hypot(n, m)*.6;
    const s = sim({n, m, A: 2600, it: 50, wrap: false, dec: .86, par: (x, y) => { const d = Math.min(1, Math.hypot(x-axp, y-ayp)/md); return [.35 + d*.7, 1.8 + d*7]; }}, r), T = s.T[0], mx = s.mx[0];
    g.fillStyle = sh(c, .28); g.fillRect(fx, fy, fw, fh);
    paint(g, n, m, (i,j) => { const t = Math.min(1, Math.pow(T[j*n+i]/mx, .7)); return [235, 228, 250, t*255]; }, fx, fy, fw, fh);
    // 樓板與豎框
    g.strokeStyle = "rgba(20,20,26,.9)"; g.lineWidth = 2;
    for(let k = 1; k < 5; k++){ const y = fy + fh*k/5; g.beginPath(); g.moveTo(fx, y); g.lineTo(fx+fw, y); g.stroke(); }
    g.lineWidth = 1; for(let k = 1; k < 6; k++){ const x = fx + fw*k/6; g.beginPath(); g.moveTo(x, fy); g.lineTo(x, fy+fh); g.stroke(); }
    g.strokeStyle = "#fff"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(fx-8, fy); g.lineTo(fx+fw+8, fy); g.stroke();
    const gy = fy + fh; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke(); g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(0, gy, W, H-gy);
    // 吸引點與同心圓
    const ax = fx + axp/n*fw, ay = fy + ayp/m*fh; g.strokeStyle = "#E8553F"; g.lineWidth = 1; g.setLineDash([3,3]);
    for(let k = 1; k <= 3; k++){ g.beginPath(); g.arc(ax, ay, k*fw*.13, 0, TAU); g.stroke(); } g.setLineDash([]);
    g.lineWidth = 1.5; g.beginPath(); g.moveTo(ax-7, ay); g.lineTo(ax+7, ay); g.moveTo(ax, ay-7); g.lineTo(ax, ay+7); g.stroke();
    // 人尺度
    const hx = fx + fw*.8; g.fillStyle = "#fff"; g.beginPath(); g.arc(hx, gy - 11, 2, 0, TAU); g.fill(); g.fillRect(hx-1.5, gy-9, 3, 9);
  },
  // V11 混合 Delaunay／MST 比較：網絡疊上最小生成樹與鄰接圖，底部為長度長條圖
  function(g, W, H, r, c){
    const top = H*.74, n = 90, m = Math.round(n*top/W), F = spread(r, 10, 8, 6, n-16, m-12, 14);
    const s = sim({n, m, A: 2200, it: 60, wrap: false, sd: 4, dec: .86, food: F.map(p => [p[0], p[1], 6])}, r), T = s.T[0], mx = s.mx[0], f = ramp(c);
    paint(g, n, m, (i,j) => { const t = Math.pow(T[j*n+i]/mx, .8); const p = f(t*.9); return p; }, 0, 0, W, top);
    const sx = W/n, sy = top/m, P = F.map(p => [p[0]*sx, p[1]*sy]);
    // Gabriel 圖（Delaunay 的子圖）當作鄰接比較
    let dl = 0; g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8; g.setLineDash([2,3]);
    for(let i = 0; i < P.length; i++) for(let j = i+1; j < P.length; j++){ const mxp = (P[i][0]+P[j][0])/2, myp = (P[i][1]+P[j][1])/2, rr = Math.hypot(P[i][0]-P[j][0], P[i][1]-P[j][1])/2;
      if(P.every((p, k) => k === i || k === j || Math.hypot(p[0]-mxp, p[1]-myp) >= rr)){ dl += rr*2; g.beginPath(); g.moveTo(P[i][0], P[i][1]); g.lineTo(P[j][0], P[j][1]); g.stroke(); } }
    g.setLineDash([]); let ml = 0; g.strokeStyle = "#fff"; g.lineWidth = 1.6;
    mst(P).forEach(([i, j]) => { ml += Math.hypot(P[i][0]-P[j][0], P[i][1]-P[j][1]); g.beginPath(); g.moveTo(P[i][0], P[i][1]); g.lineTo(P[j][0], P[j][1]); g.stroke(); });
    P.forEach(p => { g.fillStyle = GOLD; g.beginPath(); g.arc(p[0], p[1], 3.5, 0, TAU); g.fill(); });
    let cnt = 0; for(let k = 0; k < n*m; k++) if(T[k]/mx > .45) cnt++; const pl = cnt*sx*.9;
    // 長條圖：黏菌、鄰接圖、MST
    g.fillStyle = "#15151B"; g.fillRect(0, top, W, H-top); g.strokeStyle = "rgba(255,255,255,.3)"; g.beginPath(); g.moveTo(0, top+.5); g.lineTo(W, top+.5); g.stroke();
    const vals = [[pl, c], [dl, "rgba(255,255,255,.55)"], [ml, "#fff"]], vm = Math.max(pl, dl, ml), bh = (H-top-16)/3 - 3;
    vals.forEach(([v, col], k) => { const y = top + 8 + k*(bh+3); g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(W*.08, y, W*.84, bh); g.fillStyle = col; g.fillRect(W*.08, y, W*.84*v/vm, bh); });
  },
  // V12 痕跡高度場地形：由後往前的剖面線（山脊線）呈現有溝渠的景觀
  function(g, W, H, r, c){
    const n = 80, m = 50, s = sim({n, m, A: 2200, it: 45, sd: 3.5, dec: .86}, r), T0 = s.T[0], mx = s.mx[0];
    const T = new Float32Array(n*m), t = new Float32Array(n*m); T.set(T0); blur(T, t, n, m, 1, true, null);
    const rows = m, top = H*.14, bot = H*.94, amp = H*.12;
    for(let j = 0; j < rows; j++){ const k = j/(rows-1), yb = top + (bot-top)*Math.pow(k, 1.15), wk = .62 + .38*k, x0 = W/2 - W*.5*wk, x1 = W/2 + W*.5*wk;
      const pts = []; for(let i = 0; i < n; i++){ const h = Math.min(1.4, T[j*n+i]/mx); pts.push([x0 + (x1-x0)*i/(n-1), yb - h*amp*(.6 + .4*k)]); }
      g.fillStyle = "#15151B"; g.beginPath(); g.moveTo(x0, yb + 4); pts.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(x1, yb + 4); g.closePath(); g.fill();
      g.strokeStyle = sh(c, .6 + k*.7, .5 + .5*k); g.lineWidth = .7 + k*.8; U.poly(g, pts); g.stroke(); }
  },
];

/* ================= 無照片案例 ================= */
// D02-01 東京鐵路網實驗：圓形培養皿、東京灣遮罩、燕麥片城市，右下為效率／容錯／成本比較
ART.case["D02-01"] = function(g, W, H, r, c){
  const D = Math.min(W, H*.82), cx = W/2, cy = D/2 + H*.02, R = D*.46, n = 90, m = 90;
  const bay = [[.44,1],[.42,.8],[.46,.7],[.5,.62],[.56,.64],[.6,.72],[.58,.82],[.62,1]];
  const mask = raster(n, m, (o) => { o.fillStyle = "#000"; o.beginPath(); o.arc(n/2, m/2, n*.49, 0, TAU); o.fill(); o.globalCompositeOperation = "destination-out"; o.beginPath(); bay.forEach(([x,y], i) => i ? o.lineTo(x*n, y*m) : o.moveTo(x*n, y*m)); o.closePath(); o.fill(); });
  const blk = new Uint8Array(n*m); for(let k = 0; k < n*m; k++) blk[k] = mask[k] < .5 ? 1 : 0;
  const city = [[.52,.56]]; for(let k = 0; k < 14; k++){ const a = -Math.PI*.95 + r()*Math.PI*1.9 - Math.PI/2, d = .12 + r()*.3; const p = [.52 + Math.cos(a)*d, .56 + Math.sin(a)*d*.9]; if(!blk[((p[1]*m)|0)*n + ((p[0]*n)|0)]) city.push(p); }
  const s = sim({n, m, A: 2200, it: 60, wrap: false, blk, sd: 3.5, dec: .86, food: city.map(p => [p[0]*n, p[1]*m, 7])}, r), T = s.T[0], mx = s.mx[0];
  // 培養皿
  g.fillStyle = "rgba(255,255,255,.05)"; g.beginPath(); g.arc(cx, cy, R*1.04, 0, TAU); g.fill();
  g.fillStyle = "#2A2530"; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  const x0 = cx - R/.98, y0 = cy - R/.98, sz = 2*R/.98;
  paint(g, n, m, (i,j) => { if(blk[j*n+i]) return null; const t = Math.min(1, Math.pow(T[j*n+i]/mx, .9)); return [242, 193 + 30*t, 78 + 120*t, t*255]; }, x0, y0, sz, sz);
  g.fillStyle = U.rgba(c, .35); g.beginPath(); bay.forEach(([x,y], i) => { const px = x0 + x*sz, py = y0 + y*sz; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath();
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip(); g.fill(); g.restore();
  city.forEach(([x,y], i) => { g.fillStyle = i ? "#F6EBCB" : "#fff"; g.beginPath(); g.ellipse(x0 + x*sz, y0 + y*sz, i ? 3.2 : 4.5, i ? 2.2 : 3.2, r()*3, 0, TAU); g.fill(); });
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R*1.04, 0, TAU); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R*.97, -2.6, -1.7); g.stroke();
  // 三組比較長條（黏菌 vs 鐵路）
  const by = H - H*.13, bw = W*.08;
  [[.9,.85],[.95,.8],[.7,.75]].forEach(([a, b], k) => { const x = W*.22 + k*W*.22, hh = H*.1;
    g.fillStyle = GOLD; g.fillRect(x, by + hh*(1-a), bw, hh*a); g.fillStyle = sh(c, 1.1); g.fillRect(x + bw + 2, by + hh*(1-b), bw, hh*b); });
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(W*.16, by + H*.1 + .5); g.lineTo(W*.86, by + H*.1 + .5); g.stroke();
};
ART.case["D02-01"].ratio = 1.2;

// D02-02 參數掃描圖樣地圖：感測角（橫）× 感測距離（縱）的 4×3 對照表
ART.case["D02-02"] = function(g, W, H, r, c){
  const cols = 4, rows = 3, pad = 5, lx = 16, ty = 16, cw = (W - lx - pad*(cols+1))/cols, ch = (H - ty - pad*(rows+1))/rows, f = ramp(c);
  const SA = [.2, .45, .8, 1.3], SD = [2.5, 5, 9];
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const n = 40, m = Math.max(20, Math.round(n*ch/cw)), s = sim({n, m, A: 420, it: 45, sa: SA[i], sd: SD[j], ra: SA[i]*.8, dec: .86}, r), T = s.T[0], mx = s.mx[0];
    const x = lx + pad + i*(cw + pad), y = ty + pad + j*(ch + pad);
    paint(g, n, m, (a,b) => f(Math.pow(T[b*n+a]/mx, .8)), x, y, cw, ch);
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(x+.5, y+.5, cw-1, ch-1);
  }
  // 軸：上方感測角遞增、左側感測距離遞增（以刻度大小表示）
  arrow(g, lx + pad, 7, W - 6, 7, "rgba(255,255,255,.7)", 1);
  arrow(g, 7, ty + pad, 7, H - 6, "rgba(255,255,255,.7)", 1);
  for(let i = 0; i < cols; i++){ const x = lx + pad + i*(cw+pad) + cw/2; g.fillStyle = c; g.beginPath(); g.moveTo(x, 12); g.arc(x, 12, 6, -Math.PI/2 - SA[i]*.6, -Math.PI/2 + SA[i]*.6); g.closePath(); g.fill(); }
  for(let j = 0; j < rows; j++){ const y = ty + pad + j*(ch+pad) + ch/2; g.fillStyle = "#fff"; g.fillRect(11, y - SD[j]*.8, 3, SD[j]*1.6); }
};
ART.case["D02-02"].ratio = .85;

// D02-03 發光網紋藝術裝置：暗房一點透視，網紋投影在正面牆並映在地面
ART.case["D02-03"] = function(g, W, H, r, c){
  const n = 100, m = Math.round(n*.62), s = sim({n, m, A: 3200, it: 50, sp: 2, rep: .9, sd: 4.5, sa: .6, dec: .9}, r), [A, B] = s.T, ma = s.mx[0], mb = s.mx[1];
  const PINK = "#E86FB5", [R1,G1,B1] = U.rgb(c), [R2,G2,B2] = U.rgb(PINK);
  const wx = W*.16, wy = H*.18, ww = W*.68, wh = ww*.62, fy = wy + wh;
  // 房間：地板、天花、側牆
  g.fillStyle = "#0B0B0F"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#16161C"; U.poly(g, [[0, H], [wx, fy], [wx+ww, fy], [W, H]], true); g.fill();
  g.fillStyle = "#101015"; U.poly(g, [[0, 0], [wx, wy], [wx, fy], [0, H]], true); g.fill(); U.poly(g, [[W, 0], [wx+ww, wy], [wx+ww, fy], [W, H]], true); g.fill();
  const img = paint(g, n, m, (i,j) => { const k = j*n+i, a = Math.min(1.3, A[k]/ma), b = Math.min(1.3, B[k]/mb), w = Math.max(0, a + b - 1.2)*80;
    return [8 + R1*a*.9 + R2*b*.9 + w, 8 + G1*a*.9 + G2*b*.9 + w, 12 + B1*a*.9 + B2*b*.9 + w]; }, wx, wy, ww, wh);
  // 光暈外溢
  g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = .25; g.filter = "blur(6px)"; g.drawImage(img, wx - 6, wy - 6, ww + 12, wh + 12); g.restore();
  // 地面倒影
  g.save(); U.poly(g, [[0, H], [wx, fy], [wx+ww, fy], [W, H]], true); g.clip(); g.globalAlpha = .28; g.translate(0, fy*2); g.scale(1, -1);
  g.drawImage(img, wx - W*.1, fy - wh*.9, ww + W*.2, wh*.9); g.restore();
  const fg = g.createLinearGradient(0, fy, 0, H); fg.addColorStop(0, "rgba(11,11,15,0)"); fg.addColorStop(1, "rgba(11,11,15,.9)"); g.fillStyle = fg; g.fillRect(0, fy, W, H-fy);
  // 觀眾剪影
  [[.32, 1], [.66, .82]].forEach(([x, k]) => { const px = W*x, py = H*.97 - (H - fy)*.15*(1-k), h = H*.3*k;
    g.fillStyle = "#050507"; g.beginPath(); g.arc(px, py - h, h*.1, 0, TAU); g.fill(); rrect(g, px - h*.13, py - h*.88, h*.26, h*.88, h*.08); g.fill(); });
};
ART.case["D02-03"].ratio = .8;

// D02-04 3D 黏菌青銅燭台：圓柱網狀燭台柱（前後兩層）、頂端蠟燭、底座
ART.case["D02-04"] = function(g, W, H, r, c){
  const n = 60, m = 90, s = sim({n, m, A: 2200, it: 30, sd: 2.5, sa: .6, dec: .86}, r), T = s.T[0], mx = s.mx[0];
  const cx = W/2, top = H*.24, bot = H*.86, R0 = W*.2, dy = (bot - top)/m;
  const rad = j => R0*(.72 + .28*Math.pow(Math.sin(j/m*Math.PI*.9 + .3), 2)) + (j > m*.9 ? (j - m*.9)*1.2 : 0);
  // 背景柔光
  glow(g, cx, top - H*.08, W*.5, "#F2C14E", .18);
  // 後層（內壁）先畫，再畫前層
  for(const back of [1, 0]) for(let j = 0; j < m; j++){ const R = rad(j);
    for(let i = 0; i < n; i++){ const v = T[j*n+i]/mx; if(v < .32) continue; const th = i/n*TAU, cz = Math.cos(th); if(back ? cz > 0 : cz <= 0) continue;
      const x = cx + Math.sin(th)*R, w = Math.max(1, Math.abs(cz)*R*TAU/n + 1), lt = back ? .25 : .45 + .55*Math.max(0, -Math.sin(th)*.5 - cz*.6);
      const k = Math.min(1, v);
      g.fillStyle = `rgb(${(90 + 120*lt)*(.8+.2*k)|0},${(62 + 90*lt)*(.8+.2*k)|0},${(40 + 50*lt)|0})`; g.fillRect(x - w/2, top + j*dy, w, dy + .6); } }
  // 家族色的反光點綴
  g.strokeStyle = U.rgba(c, .5); g.lineWidth = 1; g.beginPath(); g.ellipse(cx, top, rad(0), rad(0)*.18, 0, 0, TAU); g.stroke();
  // 底座
  g.fillStyle = "#6E5334"; g.beginPath(); g.ellipse(cx, bot + 6, R0*1.5, R0*.3, 0, 0, TAU); g.fill(); g.fillRect(cx - R0*1.5, bot - 2, R0*3, 8);
  g.fillStyle = "#A07C4E"; g.beginPath(); g.ellipse(cx, bot - 2, R0*1.5, R0*.3, 0, 0, TAU); g.fill();
  // 蠟燭與火焰
  const cw = R0*.7, chh = H*.1; g.fillStyle = "#EDE6D6"; g.fillRect(cx - cw/2, top - chh, cw, chh); g.fillStyle = "#fff"; g.beginPath(); g.ellipse(cx, top - chh, cw/2, cw*.12, 0, 0, TAU); g.fill();
  g.strokeStyle = "#333"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, top - chh); g.lineTo(cx, top - chh - 5); g.stroke();
  glow(g, cx, top - chh - 12, 22, "#F2C14E", .6);
  g.fillStyle = "#FFE3A0"; g.beginPath(); g.moveTo(cx, top - chh - 24); g.quadraticCurveTo(cx + 6, top - chh - 8, cx, top - chh - 4); g.quadraticCurveTo(cx - 6, top - chh - 8, cx, top - chh - 24); g.fill();
};
ART.case["D02-04"].ratio = 1.3;

// D02-05 GAN-Physarum 巴黎：塞納河、放射狀大道與環城道路上的藍綠步道網絡
ART.case["D02-05"] = function(g, W, H, r, c){
  const n = 100, m = Math.round(n*H/W), cx = .5, cy = .5;
  const seine = [[0,.42],[.2,.5],[.36,.62],[.5,.6],[.62,.5],[.78,.56],[1,.7]];
  const et = [.3, .35], av = [...Array(12)].map((_, k) => k/12*TAU + .1);
  const drawStreets = (o, sx, sy, lw) => { o.lineWidth = lw; o.beginPath(); o.ellipse(cx*sx, cy*sy, .44*sx, .4*sy, 0, 0, TAU); o.stroke();
    av.forEach(a => { o.beginPath(); o.moveTo(et[0]*sx, et[1]*sy); o.lineTo((et[0] + Math.cos(a))*sx, (et[1] + Math.sin(a))*sy); o.stroke(); });
    [[.1,.8,.9,.25],[.2,.1,.7,.95],[.05,.2,.95,.75],[.5,.05,.55,.95]].forEach(([a,b,c2,d]) => { o.beginPath(); o.moveTo(a*sx, b*sy); o.lineTo(c2*sx, d*sy); o.stroke(); }); };
  const st = raster(n, m, o => { o.strokeStyle = "#000"; drawStreets(o, n, m, 2.2); });
  const river = raster(n, m, o => { o.strokeStyle = "#000"; o.lineWidth = 3.5; o.beginPath(); seine.forEach(([x,y], i) => i ? o.lineTo(x*n, y*m) : o.moveTo(x*n, y*m)); o.stroke(); });
  const blk = new Uint8Array(n*m), bias = new Float32Array(n*m); for(let k = 0; k < n*m; k++){ blk[k] = river[k] > .5 ? 1 : 0; bias[k] = st[k]*2; }
  const parks = spread(r, 7, 10, 10, n-20, m-20, 18);
  const s = sim({n, m, A: 2400, it: 50, wrap: false, blk, bias, sd: 3.5, dec: .86, food: parks.map(p => [p[0], p[1], 5])}, r), T = s.T[0], mx = s.mx[0];
  const [R,G,B] = U.rgb(ACC);
  g.strokeStyle = U.rgba(c, .5); drawStreets(g, W, H, 1);
  g.strokeStyle = "rgba(90,130,220,.55)"; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); seine.forEach(([x,y], i) => i ? g.lineTo(x*W, y*H) : g.moveTo(x*W, y*H)); g.stroke();
  paint(g, n, m, (i,j) => { const t = Math.min(1, Math.pow(T[j*n+i]/mx, .9)); return t < .1 ? null : [R*.6 + 100*t, G*.8 + 60*t, B*.7 + 60*t, t*255]; }, 0, 0, W, H);
  parks.forEach(([x,y]) => { g.fillStyle = "rgba(90,200,120,.35)"; g.beginPath(); g.arc(x*W/n, y*H/m, 7, 0, TAU); g.fill(); g.fillStyle = "#7FE0A0"; g.beginPath(); g.arc(x*W/n, y*H/m, 2.2, 0, TAU); g.fill(); });
  g.fillStyle = "#fff"; g.beginPath(); g.arc(et[0]*W, et[1]*H, 3, 0, TAU); g.fill();
};
ART.case["D02-05"].ratio = .9;

// D02-06 bioTallinn 半島：海面水平線、半島地形等高線、網絡連接汙水處理節點
ART.case["D02-06"] = function(g, W, H, r, c){
  const n = 90, m = Math.round(n*H/W), nz = U.vnoise((r()*1e6)|0);
  const pen = [[.3,1],[.28,.8],[.2,.66],[.24,.5],[.18,.36],[.28,.22],[.4,.12],[.52,.1],[.6,.18],[.56,.3],[.66,.38],[.7,.52],[.62,.62],[.68,.76],[.72,1]];
  const land = raster(n, m, o => { o.fillStyle = "#000"; o.beginPath(); pen.forEach(([x,y], i) => i ? o.lineTo(x*n, y*m) : o.moveTo(x*n, y*m)); o.closePath(); o.fill(); });
  const blk = new Uint8Array(n*m); for(let k = 0; k < n*m; k++) blk[k] = land[k] < .5 ? 1 : 0;
  const nodes = []; for(let t = 0; t < 60 && nodes.length < 6; t++){ const x = r()*n, y = r()*m; if(!blk[(y|0)*n + (x|0)] && nodes.every(p => Math.hypot(p[0]-x, p[1]-y) > 12)) nodes.push([x, y]); }
  const s = sim({n, m, A: 2000, it: 50, wrap: false, blk, sd: 3, dec: .86, food: nodes.map(p => [p[0], p[1], 6])}, r), T = s.T[0], mx = s.mx[0];
  // 海：水平細線
  g.strokeStyle = "rgba(120,170,230,.22)"; g.lineWidth = 1; for(let y = 4; y < H; y += 5){ g.beginPath(); for(let x = 0; x <= W; x += 6){ const yy = y + Math.sin(x*.08 + y)*1.2; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
  // 陸地與地形等高線
  g.fillStyle = "#1E1D25"; U.poly(g, pen.map(([x,y]) => [x*W, y*H]), true); g.fill();
  g.save(); U.poly(g, pen.map(([x,y]) => [x*W, y*H]), true); g.clip();
  const sx = W/(n-1), sy = H/(m-1); g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = .7;
  for(let lv = .3; lv < .8; lv += .1){ g.beginPath(); U.contour(n, m, (i,j) => nz(i*.05, j*.05), lv).forEach(([a,b]) => { g.moveTo(a[0]*sx, a[1]*sy); g.lineTo(b[0]*sx, b[1]*sy); }); g.stroke(); }
  g.restore();
  const f = ramp(c); paint(g, n, m, (i,j) => { if(blk[j*n+i]) return null; const t = Math.min(1, Math.pow(T[j*n+i]/mx, .85)); return t < .15 ? null : [...f(t), t*255]; }, 0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1.3; U.poly(g, pen.map(([x,y]) => [x*W, y*H]), false); g.stroke();
  nodes.forEach(([x,y]) => { const px = x*W/n, py = y*H/m; g.fillStyle = "#121217"; g.fillRect(px-4, py-4, 8, 8); g.strokeStyle = ACC; g.lineWidth = 1.5; g.strokeRect(px-4, py-4, 8, 8); });
};
ART.case["D02-06"].ratio = 1.25;

// D02-07 英國路網：大不列顛輪廓內的黏菌網絡，對照高速公路（虛線），標出 Newcastle–Glasgow 直連
ART.case["D02-07"] = function(g, W, H, r, c){
  const GB = [[.38,.02],[.52,0],[.56,.06],[.5,.12],[.6,.18],[.6,.24],[.54,.28],[.58,.32],[.62,.38],[.68,.46],[.72,.52],[.8,.6],[.84,.68],[.88,.74],[.86,.8],[.9,.84],[.82,.9],[.7,.92],[.56,.95],[.42,.97],[.3,.99],[.34,.93],[.46,.88],[.38,.85],[.3,.8],[.4,.76],[.44,.7],[.4,.66],[.46,.6],[.46,.54],[.42,.48],[.46,.42],[.38,.36],[.32,.32],[.28,.24],[.3,.16],[.26,.1],[.32,.06]];
  const CT = {gla:[.37,.3], edi:[.48,.29], new:[.6,.42], lds:[.62,.56], man:[.56,.6], liv:[.5,.6], shf:[.62,.63], bir:[.58,.72], bri:[.5,.86], lon:[.76,.85], car:[.44,.86]};
  const MW = [["gla","edi"],["edi","new"],["gla","man"],["new","lds"],["lds","man"],["man","liv"],["lds","shf"],["shf","bir"],["man","bir"],["bir","lon"],["bir","bri"],["bri","car"],["bri","lon"]];
  const n = 70, m = Math.round(n*H/W), land = raster(n, m, o => { o.fillStyle = "#000"; o.beginPath(); GB.forEach(([x,y], i) => i ? o.lineTo(x*n, y*m) : o.moveTo(x*n, y*m)); o.closePath(); o.fill(); });
  const blk = new Uint8Array(n*m); for(let k = 0; k < n*m; k++) blk[k] = land[k] < .4 ? 1 : 0;
  const s = sim({n, m, A: 1400, it: 110, wrap: false, blk, sd: 4, sa: .5, dec: .87, food: Object.values(CT).map(([x,y]) => [x*n, y*m, 7])}, r), T = s.T[0], mx = s.mx[0], f = ramp(c);
  g.fillStyle = "#1F1E27"; U.poly(g, GB.map(([x,y]) => [x*W, y*H]), true); g.fill();
  paint(g, n, m, (i,j) => { if(blk[j*n+i]) return null; const t = Math.min(1, Math.pow(T[j*n+i]/mx, .8)); return t < .12 ? null : [...f(t), t*255]; }, 0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; U.poly(g, GB.map(([x,y]) => [x*W, y*H]), true); g.stroke();
  g.setLineDash([3,3]); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1;
  MW.forEach(([a,b]) => { g.beginPath(); g.moveTo(CT[a][0]*W, CT[a][1]*H); g.lineTo(CT[b][0]*W, CT[b][1]*H); g.stroke(); }); g.setLineDash([]);
  g.strokeStyle = GOLD; g.lineWidth = 2.2; g.beginPath(); g.moveTo(CT.new[0]*W, CT.new[1]*H); g.quadraticCurveTo(.5*W, .33*H, CT.gla[0]*W, CT.gla[1]*H); g.stroke();
  Object.values(CT).forEach(([x,y]) => { g.fillStyle = "#fff"; g.beginPath(); g.arc(x*W, y*H, 2.8, 0, TAU); g.fill(); });
};
ART.case["D02-07"].ratio = 1.35;

// D02-08 宇宙網（MCPM）：星系點與筆觸般的暗物質纖維，單線描繪
ART.case["D02-08"] = function(g, W, H, r, c){
  const n = 90, m = Math.round(n*H/W), cl = spread(r, 7, 6, 6, n-12, m-12, 16), gal = [];
  cl.forEach(([x,y]) => { const k = 8 + r()*18; for(let i = 0; i < k; i++){ const a = r()*TAU, d = Math.pow(r(), 2)*9; gal.push([x + Math.cos(a)*d, y + Math.sin(a)*d]); } });
  for(let i = 0; i < 60; i++) gal.push([r()*n, r()*m]);
  const s = sim({n, m, A: 1500, it: 110, wrap: false, sd: 6, sa: .45, dec: .88, food: gal.filter(p => p[0] > 0 && p[1] > 0 && p[0] < n && p[1] < m).map(p => [p[0], p[1], .8]), rec: 260, recFrom: 60}, r), T = s.T[0], mx = s.mx[0];
  g.fillStyle = "#0A0A12"; g.fillRect(0, 0, W, H);
  const sx = W/n, sy = H/m; g.lineWidth = .6; g.lineJoin = "round";
  s.paths.forEach(pp => pp.forEach(p => { if(p.length < 4) return; g.strokeStyle = "rgba(225,215,255,.2)"; g.beginPath(); p.forEach((q, i) => i ? g.lineTo(q[0]*sx, q[1]*sy) : g.moveTo(q[0]*sx, q[1]*sy)); g.stroke(); }));
  gal.forEach(([x,y]) => { const b = r(); g.fillStyle = b > .85 ? "#fff" : sh(c, 1.3, .9); g.beginPath(); g.arc(x*sx, y*sy, .8 + b*1.6, 0, TAU); g.fill(); });
  cl.forEach(([x,y]) => glow(g, x*sx, y*sy, 14, c, .35));
};
ART.case["D02-08"].ratio = 1;

// D02-09 3D 列印安全帽內部支撐：安全帽剖面，內外殼之間長出黏菌支撐格架
ART.case["D02-09"] = function(g, W, H, r, c){
  const n = 100, m = Math.round(n*H/W), cx = n/2, cy = m*.84, Ro = n*.45, Ri = n*.24;
  const inShell = (x, y) => { if(y > cy) return false; const dx = (x-cx)/Ro, dy = (y-cy)/(Ro*.95), di = Math.hypot((x-cx)/Ri, (y-cy)/(Ri*.95)); return dx*dx + dy*dy < 1 && di > 1; };
  const blk = new Uint8Array(n*m); for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) blk[j*n+i] = inShell(i+.5, j+.5) ? 0 : 1;
  const s = sim({n, m, A: 2600, it: 40, wrap: false, blk, sd: 2, sa: .7, dec: .85}, r), T = s.T[0], mx = s.mx[0];
  const sx = W/n, sy = H/m;
  // 頭型示意（虛線）
  g.strokeStyle = "rgba(255,255,255,.25)"; g.setLineDash([3,3]); g.lineWidth = 1; g.beginPath(); g.ellipse(cx*sx, cy*sy + Ri*sy*.15, Ri*sx*.9, Ri*sy*.95, 0, Math.PI, TAU); g.stroke(); g.setLineDash([]);
  paint(g, n, m, (i,j) => { if(blk[j*n+i]) return null; const t = Math.min(1, T[j*n+i]/mx); return t < .2 ? [40, 38, 50, 255] : [...ramp(c)(.5 + t*.5), 255]; }, 0, 0, W, H, false);
  // 內外殼線
  g.strokeStyle = "#fff"; g.lineWidth = 2.5; g.beginPath(); g.ellipse(cx*sx, cy*sy, Ro*sx, Ro*.95*sy, 0, Math.PI, TAU); g.stroke();
  g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx*sx, cy*sy, Ri*sx, Ri*.95*sy, 0, Math.PI, TAU); g.stroke();
  g.beginPath(); g.moveTo((cx-Ro)*sx, cy*sy); g.lineTo((cx+Ro)*sx, cy*sy); g.strokeStyle = "rgba(255,255,255,.4)"; g.stroke();
  // 衝擊力
  arrow(g, W*.72, H*.04, W*.62, H*.2, "#E8553F", 2);
  for(let k = 0; k < 3; k++){ g.strokeStyle = "rgba(232,85,63,.5)"; g.lineWidth = 1; g.beginPath(); g.arc(W*.6, H*.22, 6 + k*6, -2.6, -1.2); g.stroke(); }
};
ART.case["D02-09"].ratio = .78;

// D02-10 PolyPhy：3D 視窗介面，網格線框物件內部長出黏菌網絡，地面格線與軸向小工具
ART.case["D02-10"] = function(g, W, H, r, c){
  const n = 26, nz = U.vnoise((r()*1e6)|0), rad = (x, y, z) => { const dx = x - n/2, dy = y - n/2, dz = z - n/2, l = Math.hypot(dx, dy, dz) || 1; return n*(.36 + .12*nz(dx/l*1.5 + 3, dz/l*1.5 + dy/l)); };
  const s = sim3({n, A: 2200, it: 30, sd: 2, sa: .7, inside: (x, y, z) => Math.hypot(x - n/2, y - n/2, z - n/2) < rad(x, y, z)}, r);
  // 介面：上方工具列、右側面板
  g.fillStyle = "#23232C"; g.fillRect(0, 0, W, 16); for(let k = 0; k < 6; k++){ g.fillStyle = k === 2 ? c : "rgba(255,255,255,.25)"; g.fillRect(6 + k*14, 4, 9, 8); }
  const pw = W*.22; g.fillStyle = "#1A1A21"; g.fillRect(W - pw, 16, pw, H - 16);
  for(let k = 0; k < 7; k++){ const y = 28 + k*16; g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(W - pw + 6, y, pw - 12, 3); g.fillStyle = c; g.fillRect(W - pw + 6, y, (pw - 12)*(.2 + r()*.7), 3); }
  const vw = W - pw, u = Math.min(vw, H)/(n*1.55), P = isoP(vw/2, H*.55, u, .6, .5), Pc = (x, y, z) => P(x - n/2, y - n/2, z - n/2);
  // 地面格線
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1;
  for(let k = -2; k <= n+2; k += 2){ let a = Pc(k, -2, -1), b = Pc(k, n+2, -1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); a = Pc(-2, k, -1); b = Pc(n+2, k, -1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  // 線框物件（經緯網格）
  g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = .7; const S = (th, ph) => { const x = Math.sin(th)*Math.cos(ph), y = Math.sin(th)*Math.sin(ph), z = Math.cos(th), R = rad(n/2 + x*n*.4, n/2 + y*n*.4, n/2 + z*n*.4); return Pc(n/2 + x*R, n/2 + y*R, n/2 + z*R); };
  for(let a = 1; a < 9; a++){ g.beginPath(); for(let b = 0; b <= 24; b++){ const p = S(a/9*Math.PI, b/24*TAU); b ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); }
  for(let b = 0; b < 12; b++){ g.beginPath(); for(let a = 0; a <= 12; a++){ const p = S(a/12*Math.PI, b/12*TAU); a ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); }
  voxpts(g, s, Pc, .4, c, Math.max(1.6, u*.9), .9);
  // 軸向小工具
  const ox = 16, oy = H - 16; [["#E8553F", [14, 5]], ["#3FA34D", [-10, 6]], ["#2F6FE4", [0, -14]]].forEach(([col, [dx, dy]]) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + dx, oy + dy); g.stroke(); });
};
ART.case["D02-10"].ratio = .85;

// D02-11 Physarealm：上方 Grasshopper 畫布（元件與連線），下方 Rhino 視窗顯示邊界盒內的 3D 網絡
ART.case["D02-11"] = function(g, W, H, r, c){
  const split = H*.4;
  g.fillStyle = "#C9C9C9"; g.fillRect(0, 0, W, split);
  g.strokeStyle = "rgba(0,0,0,.06)"; g.lineWidth = 1; for(let x = 0; x < W; x += 12){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, split); g.stroke(); } for(let y = 0; y < split; y += 12){ g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const comp = (x, y, w, h, hi) => { g.fillStyle = hi ? sh(c, 1.1) : "#8C8C8C"; rrect(g, x, y, w, h, 3); g.fill(); g.strokeStyle = "#222"; g.lineWidth = 1; g.stroke();
    g.fillStyle = hi ? "#fff" : "#E0E0E0"; g.fillRect(x + w*.35, y + 2, w*.3, h - 4); return [[x, y + h*.3], [x, y + h*.7], [x + w, y + h/2]]; };
  const wire = (a, b) => { g.strokeStyle = "#222"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(a[0], a[1]); g.bezierCurveTo(a[0] + 25, a[1], b[0] - 25, b[1], b[0], b[1]); g.stroke(); };
  const A = comp(W*.05, split*.14, W*.2, split*.26), B = comp(W*.05, split*.56, W*.2, split*.26), C = comp(W*.4, split*.3, W*.26, split*.4, true), D = comp(W*.76, split*.35, W*.18, split*.3);
  wire(A[2], C[0]); wire(B[2], C[1]); wire(C[2], D[0]);
  // Rhino 視窗
  g.fillStyle = "#1B1B22"; g.fillRect(0, split, W, H - split); g.strokeStyle = "rgba(255,255,255,.3)"; g.strokeRect(.5, split + .5, W-1, H - split - 1);
  const n = 24, food = [[3, 3, 3, 40], [20, 20, 4, 40], [4, 20, 20, 40], [20, 5, 18, 40], [12, 12, 22, 40]];
  const s = sim3({n, A: 2000, it: 30, sd: 2, sa: .6, food, wrap: true}, r), vh = H - split, u = Math.min(W, vh)/(n*1.7), P = isoP(W/2, split + vh*.56, u, -.5, .5), Pc = (x, y, z) => P(x - n/2, y - n/2, z - n/2);
  box3(g, Pc, n, "rgba(255,255,255,.35)", [3,3]);
  voxpts(g, s, Pc, .35, c, Math.max(1.6, u*.95), .9);
  food.forEach(([x, y, z]) => { const p = Pc(x, y, z); g.fillStyle = GOLD; g.beginPath(); g.arc(p[0], p[1], 3, 0, TAU); g.fill(); });
};
ART.case["D02-11"].ratio = 1.25;

// D02-12 Skeleton Physarum：左半是像素痕跡場，右半為骨架化後的乾淨線網（節點、端點）
ART.case["D02-12"] = function(g, W, H, r, c){
  const n = 64, m = Math.round(n*H/W), s = sim({n, m, A: 1500, it: 45, sd: 3, dec: .86}, r), T = s.T[0], mx = s.mx[0], f = ramp(c), half = n/2;
  // 門檻化 → Zhang–Suen 細化
  const b = new Uint8Array(n*m); for(let k = 0; k < n*m; k++) b[k] = T[k]/mx > .38 ? 1 : 0;
  const at = (i, j) => (i < 0 || j < 0 || i >= n || j >= m) ? 0 : b[j*n+i];
  for(let pass = 0; pass < 20; pass++){ let ch = 0;
    for(const sub of [0, 1]){ const del = [];
      for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ if(!b[j*n+i]) continue;
        const p = [at(i,j-1), at(i+1,j-1), at(i+1,j), at(i+1,j+1), at(i,j+1), at(i-1,j+1), at(i-1,j), at(i-1,j-1)], B = p.reduce((a, v) => a + v, 0);
        if(B < 2 || B > 6) continue; let A = 0; for(let k = 0; k < 8; k++) if(!p[k] && p[(k+1)%8]) A++; if(A !== 1) continue;
        if(sub === 0 ? (p[0]*p[2]*p[4] || p[2]*p[4]*p[6]) : (p[0]*p[2]*p[6] || p[0]*p[4]*p[6])) continue; del.push(j*n+i); }
      del.forEach(k => b[k] = 0); ch += del.length; }
    if(!ch) break; }
  const sx = W/n, sy = H/m;
  paint(g, n, m, (i,j) => i < half ? f(Math.pow(T[j*n+i]/mx, .8)) : null, 0, 0, W, H, false);
  // 像素格線
  g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = .5; for(let i = 0; i <= half; i++){ g.beginPath(); g.moveTo(i*sx, 0); g.lineTo(i*sx, H); g.stroke(); } for(let j = 0; j <= m; j++){ g.beginPath(); g.moveTo(0, j*sy); g.lineTo(half*sx, j*sy); g.stroke(); }
  g.strokeStyle = sh(c, 1.35); g.lineWidth = 1.4; g.lineCap = "round"; g.beginPath();
  for(let j = 0; j < m; j++) for(let i = Math.floor(half) - 1; i < n; i++){ if(!b[j*n+i]) continue; [[1,0],[0,1],[1,1],[-1,1]].forEach(([dx, dy]) => { if(at(i+dx, j+dy) && i + dx >= half && i >= half){ g.moveTo((i+.5)*sx, (j+.5)*sy); g.lineTo((i+dx+.5)*sx, (j+dy+.5)*sy); } }); }
  g.stroke();
  for(let j = 0; j < m; j++) for(let i = Math.ceil(half); i < n; i++){ if(!b[j*n+i]) continue; let k = 0; for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++) if((dx || dy) && at(i+dx, j+dy)) k++;
    if(k >= 3){ g.fillStyle = "#fff"; g.beginPath(); g.arc((i+.5)*sx, (j+.5)*sy, 2.4, 0, TAU); g.fill(); } else if(k === 1){ g.fillStyle = GOLD; g.fillRect((i+.5)*sx - 2, (j+.5)*sy - 2, 4, 4); } }
  g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.setLineDash([5,3]); g.beginPath(); g.moveTo(half*sx, 0); g.lineTo(half*sx, H); g.stroke(); g.setLineDash([]);
};
ART.case["D02-12"].ratio = .9;

// D02-13 分步生長都市樣板：三張等角疊放的平面板，由下而上是生長的三個階段
ART.case["D02-13"] = function(g, W, H, r, c){
  const n = 70, m = 70, city = spread(r, 7, 8, 8, n-16, m-16, 14), st = [12, 40, 110];
  const s = sim({n, m, A: 1800, it: 110, wrap: false, sd: 3.5, dec: .86, food: city.map(p => [p[0], p[1], 6]), snap: st}, r), f = ramp(c);
  const pw = W*.62, cx = W/2, gap = H*.25, base = H*.8;
  const X = [pw*.62, pw*.3], Y = [-pw*.62, pw*.3];   // 板的兩個邊向量（等角菱形）
  s.snaps.forEach((T, k) => {
    const y0 = base - k*gap, ox = cx - (X[0] + Y[0])/2, oy = y0 - (X[1] + Y[1])/2, mx = pct(T, .985);
    const off = document.createElement("canvas"); off.width = n; off.height = m; const o = off.getContext("2d"), im = o.createImageData(n, m);
    for(let q = 0; q < n*m; q++){ const t = Math.min(1, Math.pow(T[q]/mx, .85)), p = f(t); im.data[q*4] = p[0]; im.data[q*4+1] = p[1]; im.data[q*4+2] = p[2]; im.data[q*4+3] = 235; }
    o.putImageData(im, 0, 0);
    g.save(); g.transform(X[0]/n, X[1]/n, Y[0]/m, Y[1]/m, ox, oy); g.drawImage(off, 0, 0, n, m);
    g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = n/pw*1.2; g.strokeRect(0, 0, n, m);
    city.forEach(([x,y]) => { g.fillStyle = "#fff"; g.fillRect(x - 1.2, y - 1.2, 2.4, 2.4); }); g.restore();
    // 板與板之間的垂直虛線
    if(k){ g.strokeStyle = "rgba(255,255,255,.25)"; g.setLineDash([2,3]); g.lineWidth = 1;
      [[0,0],[1,0],[0,1],[1,1]].forEach(([a,b]) => { const x = ox + X[0]*a + Y[0]*b, y = oy + X[1]*a + Y[1]*b; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + gap); g.stroke(); }); g.setLineDash([]); }
    // 階段刻度
    for(let q = 0; q <= k; q++){ g.fillStyle = c; g.beginPath(); g.arc(W*.06 + q*7, y0, 2.6, 0, TAU); g.fill(); }
  });
};
ART.case["D02-13"].ratio = 1.3;

// D02-14 非均質建築材料：六角蜂巢壁厚隨養分網絡變化，應力色階，上方受壓、下方支承
ART.case["D02-14"] = function(g, W, H, r, c){
  const n = 60, m = Math.round(n*H/W), s = sim({n, m, A: 1500, it: 45, sd: 3.5, dec: .86}, r), T = s.T[0], mx = s.mx[0];
  const bx = W*.08, by = H*.16, bw = W*.84, bh = H*.66, hr = Math.max(5, W/28), hw = hr*Math.sqrt(3);
  const heat = t => { const st = [[70,40,140],[145,82,224],[63,208,201],[242,193,78],[232,85,63]], x = Math.min(.999, Math.max(0, t))*4, i = x|0, k = x - i, a = st[i], b = st[i+1]; return `rgb(${a[0]+(b[0]-a[0])*k|0},${a[1]+(b[1]-a[1])*k|0},${a[2]+(b[2]-a[2])*k|0})`; };
  g.save(); g.beginPath(); g.rect(bx, by, bw, bh); g.clip();
  for(let row = 0; row*hr*1.5 < bh + hr*2; row++) for(let col = -1; col*hw < bw + hw; col++){
    const x = bx + col*hw + (row % 2)*hw/2, y = by + row*hr*1.5, v = Math.min(1, T[Math.min(m-1, ((y - by)/bh*m)|0)*n + Math.min(n-1, Math.max(0, ((x - bx)/bw*n)|0))]/mx);
    const stress = Math.min(1, (1 - (y - by)/bh)*.35 + Math.abs((x - bx)/bw - .5)*.3 + v*.5), th = .8 + v*hr*.5;
    g.fillStyle = heat(stress); g.beginPath(); for(let k = 0; k < 6; k++){ const a = Math.PI/6 + k*TAU/6; g.lineTo(x + Math.cos(a)*hr, y + Math.sin(a)*hr); } g.closePath(); g.fill();
    g.fillStyle = "#15151B"; g.beginPath(); const ir = Math.max(0, hr - th); for(let k = 0; k < 6; k++){ const a = Math.PI/6 + k*TAU/6; g.lineTo(x + Math.cos(a)*ir, y + Math.sin(a)*ir); } g.closePath(); g.fill(); }
  g.restore();
  g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.strokeRect(bx, by, bw, bh);
  // 受壓板與力箭頭
  g.fillStyle = "rgba(255,255,255,.8)"; g.fillRect(bx, by - 5, bw, 4);
  for(let k = 0; k < 5; k++){ const x = bx + bw*(k + .5)/5; arrow(g, x, by - H*.12, x, by - 7, "#fff", 1.2); }
  // 支承
  for(let k = 0; k < 2; k++){ const x = k ? bx + bw*.85 : bx + bw*.15, y = by + bh; g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 7, y + 10); g.lineTo(x + 7, y + 10); g.closePath(); g.fill(); }
  // 色階條
  for(let k = 0; k < 40; k++){ g.fillStyle = heat(k/40); g.fillRect(bx + bw*k/40, H - 9, bw/40 + .5, 5); }
};
ART.case["D02-14"].ratio = 1.05;

// D02-15 互動裝置：正面大螢幕顯示網紋與參數滑桿，下方是觀眾操控的遊戲手把
ART.case["D02-15"] = function(g, W, H, r, c){
  const sx0 = W*.06, sy0 = H*.07, sw = W*.88, shh = sw*.56, n = 90, m = Math.round(n*.56);
  const s = sim({n, m, A: 2200, it: 50, sd: 4.5, sa: .8, ra: .6, dec: .87}, r), T = s.T[0], mx = s.mx[0], f = ramp(c);
  rrect(g, sx0 - 4, sy0 - 4, sw + 8, shh + 8, 5); g.fillStyle = "#050507"; g.fill();
  paint(g, n, m, (i,j) => f(Math.pow(T[j*n+i]/mx, .7)*1.05), sx0, sy0, sw, shh);
  // 螢幕角落的參數滑桿（即時改變）
  g.fillStyle = "rgba(10,10,14,.7)"; g.fillRect(sx0 + 6, sy0 + 6, sw*.3, 30);
  for(let k = 0; k < 3; k++){ const y = sy0 + 12 + k*8, v = .25 + r()*.65; g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(sx0 + 10, y, sw*.26, 2); g.fillStyle = k === 1 ? GOLD : "#fff"; g.beginPath(); g.arc(sx0 + 10 + sw*.26*v, y + 1, 2.5, 0, TAU); g.fill(); }
  // 螢幕光照地面
  const gy = sy0 + shh + 8; const lg = g.createLinearGradient(0, gy, 0, H); lg.addColorStop(0, U.rgba(c, .18)); lg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = lg; g.fillRect(0, gy, W, H - gy);
  // 遊戲手把剪影
  const cx = W/2, cy = gy + (H - gy)*.55, pw = W*.46, ph = (H - gy)*.5;
  g.fillStyle = "#2B2B35"; g.beginPath(); g.moveTo(cx - pw*.3, cy - ph*.4); g.lineTo(cx + pw*.3, cy - ph*.4);
  g.bezierCurveTo(cx + pw*.55, cy - ph*.45, cx + pw*.6, cy + ph*.7, cx + pw*.4, cy + ph*.55); g.quadraticCurveTo(cx + pw*.25, cy + ph*.1, cx, cy + ph*.15);
  g.quadraticCurveTo(cx - pw*.25, cy + ph*.1, cx - pw*.4, cy + ph*.55); g.bezierCurveTo(cx - pw*.6, cy + ph*.7, cx - pw*.55, cy - ph*.45, cx - pw*.3, cy - ph*.4); g.closePath(); g.fill();
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.stroke();
  // 左搖桿（偏移代表正在推動）與右側按鍵
  g.fillStyle = "#15151B"; g.beginPath(); g.arc(cx - pw*.22, cy - ph*.05, ph*.2, 0, TAU); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(cx - pw*.22 + ph*.07, cy - ph*.1, ph*.13, 0, TAU); g.fill();
  [[1,0],[0,1],[-1,0],[0,-1]].forEach(([a,b], k) => { g.fillStyle = k === 0 ? GOLD : "rgba(255,255,255,.6)"; g.beginPath(); g.arc(cx + pw*.22 + a*ph*.14, cy - ph*.05 + b*ph*.14, ph*.07, 0, TAU); g.fill(); });
  // 手把連到螢幕的訊號弧線
  g.strokeStyle = U.rgba(c, .6); g.setLineDash([2,3]); g.beginPath(); g.moveTo(cx, cy - ph*.45); g.quadraticCurveTo(cx + W*.1, gy - 2, cx + W*.02, gy - shh*.2); g.stroke(); g.setLineDash([]);
};
ART.case["D02-15"].ratio = 1;
})();
