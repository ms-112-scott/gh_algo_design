/* C01 反應擴散：變形與無照片案例的獨立畫法
   每張卡都先跑一次真的 Gray-Scott（或對應模型）模擬，再依變形／案例的內容取景：
   立面開孔、曲面、體素、雷切線稿、浮雕、動畫格、珠寶、燈具、瓷杯、球鞋、參數圖…… */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = Math.PI*2;
const cl = x => x < 0 ? 0 : x > 1 ? 1 : x;
const sm = (a, b, x) => { const t = cl((x-a)/(b-a)); return t*t*(3-2*t); };
const mix = (a, b, t) => a + (b-a)*t;

/* ---------- 共用：Gray-Scott 模擬 ----------
   o.n, o.m 格數；o.f, o.k 常數或 o.F, o.K 每格陣列；o.mask 每格 1=內部；
   o.wt 每格 4 個擴散權重（左右、上下、兩條斜向）做各向異性；o.s 等向權重；
   o.wrapX / o.wrapY 週期邊界；o.init(A,B,n,m) 自訂初始；o.snaps + o.onSnap 取中間格；o.poke(it,A,B) 途中干擾 */
function sim(o, r){
  // 隨機撒點偶爾會整片消失：沒長出花紋就換一組種子重跑（最多 3 次）
  let R; for(let t = 0; t < 3; t++){ R = sim1(o, r); if(o.init || o.snaps) return R; let mx = 0; for(let i = 0; i < R.B.length; i++) if(R.B[i] > mx) mx = R.B[i]; if(mx > .15) return R; }
  return R;
}
function sim1(o, r){
  const n = o.n, m = o.m, N = n*m, s = o.s ?? .2;
  let A = new Float32Array(N).fill(1), B = new Float32Array(N), A2 = new Float32Array(N), B2 = new Float32Array(N);
  if(o.init) o.init(A, B, n, m);
  else { const cnt = o.seedN ?? Math.max(3, Math.round(N/160)), sz = o.seedR ?? 4;
    for(let q = 0; q < cnt; q++){ const x = (r()*n)|0, y = (r()*m)|0;
      for(let j = 0; j < sz; j++) for(let i = 0; i < sz; i++){ const k = ((y+j)%m)*n + (x+i)%n; B[k] = .25 + .25*r(); A[k] = .5; } } }
  const wx = o.wrapX ?? true, wy = o.wrapY ?? true;
  const XM = new Int32Array(n), XP = new Int32Array(n), YM = new Int32Array(m), YP = new Int32Array(m);
  for(let x = 0; x < n; x++){ XM[x] = x ? x-1 : (wx ? n-1 : 0); XP[x] = x < n-1 ? x+1 : (wx ? 0 : n-1); }
  for(let y = 0; y < m; y++){ YM[y] = y ? y-1 : (wy ? m-1 : 0); YP[y] = y < m-1 ? y+1 : (wy ? 0 : m-1); }
  const F = o.F, K = o.K, f0 = o.f ?? .037, k0 = o.k ?? .06, wt = o.wt, mask = o.mask, steps = o.steps ?? 900;
  const snaps = o.snaps || [];
  for(let it = 0; it < steps; it++){
    for(let y = 0; y < m; y++){ const yc = y*n, yu = YM[y]*n, yd = YP[y]*n;
      for(let x = 0; x < n; x++){ const i = yc + x, xl = XM[x], xr = XP[x], a = A[i], b = B[i];
        let la, lb;
        if(wt){ const q = i*4, h = wt[q], v = wt[q+1], d1 = wt[q+2], d2 = wt[q+3];
          la = h*(A[yc+xl]+A[yc+xr]-2*a) + v*(A[yu+x]+A[yd+x]-2*a) + d1*(A[yu+xr]+A[yd+xl]-2*a) + d2*(A[yu+xl]+A[yd+xr]-2*a);
          lb = h*(B[yc+xl]+B[yc+xr]-2*b) + v*(B[yu+x]+B[yd+x]-2*b) + d1*(B[yu+xr]+B[yd+xl]-2*b) + d2*(B[yu+xl]+B[yd+xr]-2*b);
        } else { la = s*(A[yc+xl]+A[yc+xr]+A[yu+x]+A[yd+x]-4*a); lb = s*(B[yc+xl]+B[yc+xr]+B[yu+x]+B[yd+x]-4*b); }
        const abb = a*b*b, f = F ? F[i] : f0, k = K ? K[i] : k0;
        let na = a + la - abb + f*(1-a), nb = b + .5*lb + abb - (k+f)*b;
        if(mask && !mask[i]){ na = 1; nb = 0; }
        A2[i] = na < 0 ? 0 : na > 1 ? 1 : na; B2[i] = nb < 0 ? 0 : nb > 1 ? 1 : nb;
      } }
    let t = A; A = A2; A2 = t; t = B; B = B2; B2 = t;
    if(o.poke) o.poke(it, A, B);
    if(snaps.includes(it+1)) o.onSnap(it+1, B.slice());
  }
  return {A, B, n, m};
}
// 各向異性權重：方向角 th(i,j)、強度 an（0 等向，1 完全單向），總和固定維持穩定
function aniso(n, m, th, an, tot = .4){
  const wt = new Float32Array(n*m*4), dirs = [0, Math.PI/2, -Math.PI/4, Math.PI/4];
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const a = th(i, j), q = (j*n+i)*4; let sum = 0; const w = [];
    for(let d = 0; d < 4; d++){ const cs = Math.cos(dirs[d] - a); w[d] = (1-an) + an*cs*cs*cs*cs; sum += w[d]; }
    for(let d = 0; d < 4; d++) wt[q+d] = w[d]/sum*tot; }
  return wt;
}
// 取樣：雙線性、可環繞
function sampler(R, wrap = true){
  const {B, n, m} = R;
  return (u, v) => { let x = u*n - .5, y = v*m - .5;
    if(wrap){ x = ((x % n) + n) % n; y = ((y % m) + m) % m; } else { x = Math.max(0, Math.min(n-1.001, x)); y = Math.max(0, Math.min(m-1.001, y)); }
    const x0 = x|0, y0 = y|0, x1 = (x0+1) % n, y1 = (y0+1) % m, fx = x-x0, fy = y-y0;
    return (B[y0*n+x0]*(1-fx) + B[y0*n+x1]*fx)*(1-fy) + (B[y1*n+x0]*(1-fx) + B[y1*n+x1]*fx)*fy; };
}
// 把純量場轉成離屏 canvas（pal(t) → [r,g,b,a]）
function tex(n, m, val, pal){
  const cv = document.createElement("canvas"); cv.width = n; cv.height = m; const x = cv.getContext("2d"), img = x.createImageData(n, m), d = img.data;
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const p = pal(val(i, j)), k = (j*n+i)*4; d[k] = p[0]; d[k+1] = p[1]; d[k+2] = p[2]; d[k+3] = p[3] ?? 255; }
  x.putImageData(img, 0, 0); return cv;
}
// 家族色漸層：暗底 → 主色 → 白
function ramp(c){ const [R,G,Bc] = U.rgb(c);
  return t => { t = cl(t); const w = Math.max(0, t-.75)*4; return [21+(R-21)*t+(255-R)*w*.7, 21+(G-21)*t+(255-G)*w*.7, 27+(Bc-27)*t+(255-Bc)*w*.7]; }; }
// 像素畫布（逐像素算，最後貼回）
function pix(W, H, fn){
  const w = Math.max(1, Math.round(W)), h = Math.max(1, Math.round(H)), cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const x = cv.getContext("2d"), img = x.createImageData(w, h), d = img.data;
  for(let j = 0; j < h; j++) for(let i = 0; i < w; i++){ const p = fn(i, j); if(!p) continue; const k = (j*w+i)*4; d[k] = p[0]; d[k+1] = p[1]; d[k+2] = p[2]; d[k+3] = p[3] ?? 255; }
  x.putImageData(img, 0, 0); return cv;
}
function drawTex(g, cv, x, y, w, h, smooth = true){ g.imageSmoothingEnabled = smooth; g.drawImage(cv, x, y, w, h); }
function segs(g, S, ox, oy, sx, sy){ g.beginPath(); S.forEach(([a,b]) => { g.moveTo(ox + a[0]*sx, oy + a[1]*sy); g.lineTo(ox + b[0]*sx, oy + b[1]*sy); }); g.stroke(); }
const lerpC = (p, q, t) => [mix(p[0],q[0],t), mix(p[1],q[1],t), mix(p[2],q[2],t)];

/* ================================================================
   變形
   ================================================================ */
const V = [];

// V01 空間變化的 feed／kill：立面上從吸引點的斑點開孔漸變成遠處的迷宮
V[0] = function(g, W, H, r, c){
  const fx = W*.1, fy = H*.1, fw = W*.8, fh = H*.8, n = 64, m = Math.round(n*fh/fw);
  const ax = .2 + r()*.2, ay = .2 + r()*.25, F = new Float32Array(n*m), K = new Float32Array(n*m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const d = cl(Math.hypot(i/n - ax, (j/m - ay)*m/n)/.75), k = j*n+i;
    F[k] = mix(.0367, .029, d); K[k] = mix(.0649, .057, d); }
  const R = sim({n, m, F, K, wrapX:false, wrapY:false, steps:1100}, r);
  const panel = [52,50,60], light = lerpC(U.rgb(c), [255,244,220], .45);
  // 立面板：開孔（B 高處）透光
  const cv = tex(n, m, (i,j) => sm(.12, .28, R.B[j*n+i]), t => lerpC(panel, light, t));
  g.fillStyle = "#0e0e12"; g.fillRect(fx-4, fy-4, fw+8, fh+8);
  drawTex(g, cv, fx, fy, fw, fh);
  // 樓板線與豎框
  g.strokeStyle = "rgba(20,20,26,.9)"; g.lineWidth = 3;
  for(let q = 1; q < 6; q++){ const y = fy + fh*q/6; g.beginPath(); g.moveTo(fx, y); g.lineTo(fx+fw, y); g.stroke(); }
  g.lineWidth = 1.2; for(let q = 1; q < 4; q++){ const x = fx + fw*q/4; g.beginPath(); g.moveTo(x, fy); g.lineTo(x, fy+fh); g.stroke(); }
  // 吸引點光暈
  const px = fx + ax*fw, py = fy + ay*fh, gr = g.createRadialGradient(px, py, 0, px, py, fw*.45);
  gr.addColorStop(0, "rgba(255,255,255,.25)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(fx, fy, fw, fh);
  g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.arc(px, py, 6, 0, TAU); g.stroke();
  g.beginPath(); g.moveTo(px-11, py); g.lineTo(px+11, py); g.moveTo(px, py-11); g.lineTo(px, py+11); g.stroke();
  g.setLineDash([2,4]); g.strokeStyle = "rgba(255,255,255,.35)"; [.25,.5].forEach(q => { g.beginPath(); g.arc(px, py, fw*q, 0, TAU); g.stroke(); }); g.setLineDash([]);
  // 地面線
  g.strokeStyle = U.rgba(c,.8); g.lineWidth = 2; g.beginPath(); g.moveTo(W*.03, fy+fh+5); g.lineTo(W*.97, fy+fh+5); g.stroke();
};
V[0].ratio = 1.2;

// V02 各向異性擴散：條紋沿著漩渦方向場排列，疊上方向箭頭
V[1] = function(g, W, H, r, c){
  const n = 76, m = Math.round(n*H/W), cx = n*(.35 + r()*.3), cy = m*(.35 + r()*.3), sw = r() < .5 ? 1 : -1;
  const th = (i, j) => Math.atan2(j - cy, i - cx) + sw*Math.PI/2*.85;
  const R = sim({n, m, f:.03, k:.057, wt: aniso(n, m, th, .85), steps:1000}, r);
  const cv = tex(n, m, (i,j) => sm(.1, .3, R.B[j*n+i]), ramp(c)); drawTex(g, cv, 0, 0, W, H);
  g.fillStyle = "rgba(10,10,14,.35)"; g.fillRect(0, 0, W, H);
  // 方向場箭頭
  const gx = 7, gy = Math.round(gx*H/W);
  g.strokeStyle = "rgba(255,255,255,.85)"; g.fillStyle = "#fff"; g.lineWidth = 1.3;
  for(let b = 0; b < gy; b++) for(let a = 0; a < gx; a++){ const x = (a+.5)/gx*W, y = (b+.5)/gy*H, t = th(x/W*n, y/H*m), L = W/gx*.32;
    const x1 = x - Math.cos(t)*L, y1 = y - Math.sin(t)*L, x2 = x + Math.cos(t)*L, y2 = y + Math.sin(t)*L;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - Math.cos(t-.5)*5, y2 - Math.sin(t-.5)*5); g.lineTo(x2 - Math.cos(t+.5)*5, y2 - Math.sin(t+.5)*5); g.closePath(); g.fill(); }
  g.beginPath(); g.arc(cx/n*W, cy/m*H, 4, 0, TAU); g.fill();
};

// V03 隨機種子與多點起始：生長到一半的花紋，從幾個種子向外擴張、交會出接縫
V[2] = function(g, W, H, r, c){
  const n = 80, m = Math.round(n*H/W), seeds = [...Array(5)].map(() => [8 + r()*(n-16), 8 + r()*(m-16)]);
  const R = sim({n, m, f:.0367, k:.0649, steps:1500, wrapX:false, wrapY:false, init:(A,B) => seeds.forEach(([x,y]) => {
    for(let j = -2; j <= 2; j++) for(let i = -2; i <= 2; i++){ const k = ((y|0)+j)*n + (x|0)+i; B[k] = 1; A[k] = .5; } })}, r);
  const cv = tex(n, m, (i,j) => R.B[j*n+i]*3.2, ramp(c)); drawTex(g, cv, 0, 0, W, H);
  // 種子位置與交會接縫（Voronoi 邊界）
  g.setLineDash([3,4]); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1;
  const S = [];
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ let a = 1e9, b = 1e9; seeds.forEach(([x,y]) => { const d = Math.hypot(i-x, j-y); if(d < a){ b = a; a = d; } else if(d < b) b = d; }); S.push(b - a); }
  segs(g, U.contour(n, m, (i,j) => S[j*n+i], 1), W/n*.5, H/m*.5, W/n, H/m); g.setLineDash([]);
  seeds.forEach(([x,y], q) => { const px = x/n*W, py = y/m*H; g.strokeStyle = "#fff"; g.lineWidth = 1.4;
    g.beginPath(); g.arc(px, py, 7, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(px-12, py); g.lineTo(px-4, py); g.moveTo(px+4, py); g.lineTo(px+12, py); g.moveTo(px, py-12); g.lineTo(px, py-4); g.moveTo(px, py+4); g.lineTo(px, py+12); g.stroke();
    g.fillStyle = "#fff"; for(let d = 0; d <= q; d++) g.fillRect(px + 10 + d*4, py + 9, 2, 2); });
};

// V04 遮罩邊界：花紋只長在任意平面輪廓（樓板）內，外面是平面圖網格
V[3] = function(g, W, H, r, c){
  const n = 80, m = Math.round(n*H/W), cx = n/2, cy = m/2, ph = r()*TAU, R0 = Math.min(n, m)*.4;
  const rad = a => R0*(1 + .22*Math.sin(3*a + ph) + .1*Math.sin(5*a - ph*2));
  const mask = new Uint8Array(n*m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const a = Math.atan2(j-cy, i-cx); mask[j*n+i] = Math.hypot(i-cx, j-cy) < rad(a) ? 1 : 0; }
  // 平面圖網格
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1;
  for(let x = 0; x < W; x += W/16){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for(let y = 0; y < H; y += W/16){ g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const R = sim({n, m, f:.029, k:.057, mask, wrapX:false, wrapY:false, steps:1000}, r);
  const P = ramp(c), cv = tex(n, m, (i,j) => mask[j*n+i] ? R.B[j*n+i]*3 : -1, t => t < 0 ? [0,0,0,0] : P(t)); drawTex(g, cv, 0, 0, W, H);
  // 輪廓曲線
  const pts = []; for(let q = 0; q <= 120; q++){ const a = q/120*TAU, rr = rad(a); pts.push([(cx + Math.cos(a)*rr)/n*W, (cy + Math.sin(a)*rr)/m*H]); }
  g.strokeStyle = "#fff"; g.lineWidth = 2; U.poly(g, pts, true); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.setLineDash([5,4]);
  g.beginPath(); pts.forEach((p,i) => { const q = [cx/n*W + (p[0]-cx/n*W)*1.08, cy/m*H + (p[1]-cy/m*H)*1.08]; i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); }); g.closePath(); g.stroke(); g.setLineDash([]);
  // 控制點
  g.fillStyle = U.rgba(c,1); for(let q = 0; q < 120; q += 15){ g.fillRect(pts[q][0]-3, pts[q][1]-3, 6, 6); }
};

// 共用：icosphere
function icosphere(lv){
  const t = (1 + Math.sqrt(5))/2; let P = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
  let F = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  P = P.map(p => { const l = Math.hypot(...p); return p.map(x => x/l); });
  for(let s = 0; s < lv; s++){ const cache = new Map(), NF = [];
    const mid = (a, b) => { const key = a < b ? a*1e6+b : b*1e6+a; if(cache.has(key)) return cache.get(key);
      const p = [0,1,2].map(k => (P[a][k]+P[b][k])/2), l = Math.hypot(...p); P.push(p.map(x => x/l)); cache.set(key, P.length-1); return P.length-1; };
    F.forEach(([a,b,cc]) => { const ab = mid(a,b), bc = mid(b,cc), ca = mid(cc,a); NF.push([a,ab,ca],[b,bc,ab],[cc,ca,bc],[ab,bc,ca]); });
    F = NF; }
  return {P, F};
}
// 共用：在任意圖（頂點鄰居表）上跑 Gray-Scott
function simGraph(nb, N, r, o){
  let A = new Float32Array(N).fill(1), B = new Float32Array(N), A2 = new Float32Array(N), B2 = new Float32Array(N);
  for(let q = 0; q < N/40; q++){ const i = (r()*N)|0; [i, ...nb[i]].forEach(j => nb[j].forEach(k => { B[k] = .25 + .25*r(); A[k] = .5; })); }
  const f = o.f, k = o.k, da = o.da ?? .8;
  for(let it = 0; it < (o.steps ?? 1200); it++){
    for(let i = 0; i < N; i++){ const L = nb[i]; let sa = 0, sb = 0; for(let q = 0; q < L.length; q++){ sa += A[L[q]]; sb += B[L[q]]; }
      const a = A[i], b = B[i], la = (sa/L.length - a)*da, lb = (sb/L.length - b)*da, abb = a*b*b;
      A2[i] = cl(a + la - abb + f*(1-a)); B2[i] = cl(b + .5*lb + abb - (k+f)*b); }
    let t = A; A = A2; A2 = t; t = B; B = B2; B2 = t; }
  return B;
}

// V05 Mesh 上的反應擴散：直接在三角網格頂點上模擬，畫成有光影的殼體
V[4] = function(g, W, H, r, c){
  const {P, F} = icosphere(4), N = P.length, nb = [...Array(N)].map(() => new Set());
  F.forEach(([a,b,cc]) => { nb[a].add(b).add(cc); nb[b].add(a).add(cc); nb[cc].add(a).add(b); });
  const B = simGraph(nb.map(s => [...s]), N, r, {f:.029, k:.057, steps:1300, da:.2});
  // 形狀：蛋形殼體（下窄上寬）
  const ry = .6 + r()*.6, rx = .45, S = Math.min(W, H)*.36;
  const X = P.map(([x,y,z]) => { const w = 1 + .28*y; x *= w; z *= w; y *= 1.2;
    const x1 = x*Math.cos(ry) + z*Math.sin(ry), z1 = -x*Math.sin(ry) + z*Math.cos(ry);
    const y2 = y*Math.cos(rx) - z1*Math.sin(rx), z2 = y*Math.sin(rx) + z1*Math.cos(rx); return [x1, y2, z2]; });
  const tris = F.map(f => { const [a,b,cc] = f.map(i => X[i]); const ux = b[0]-a[0], uy = b[1]-a[1], uz = b[2]-a[2], vx = cc[0]-a[0], vy = cc[1]-a[1], vz = cc[2]-a[2];
    let nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx; const l = Math.hypot(nx,ny,nz) || 1; nx /= l; ny /= l; nz /= l;
    return {f, z:(a[2]+b[2]+cc[2])/3, nx, ny, nz}; }).filter(t => t.nz < 0.05).sort((p,q) => q.z - p.z);
  const [R0,G0,B0] = U.rgb(c), cx = W/2, cy = H*.5;
  // 地面陰影
  g.fillStyle = "rgba(0,0,0,.45)"; g.beginPath(); g.ellipse(cx, cy + S*1.35, S*.9, S*.18, 0, 0, TAU); g.fill();
  tris.forEach(t => { const bv = (B[t.f[0]] + B[t.f[1]] + B[t.f[2]])/3, on = sm(.12, .25, bv);
    const lt = cl(.25 + .75*Math.max(0, -t.nx*.4 - t.ny*.5 - t.nz*.75));
    const col = lerpC([60,60,72], [R0,G0,B0], on).map(v => Math.round(v*(.35 + .75*lt)));
    g.fillStyle = `rgb(${col})`; g.strokeStyle = `rgba(${col},1)`; g.lineWidth = .6; g.beginPath();
    t.f.forEach((i,q) => { const p = X[i]; q ? g.lineTo(cx + p[0]*S, cy - p[1]*S) : g.moveTo(cx + p[0]*S, cy - p[1]*S); }); g.closePath(); g.fill(); g.stroke(); });
  // 網格線（看得出是 Mesh）
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = .5;
  tris.forEach(t => { if(t.nz > -.35) return; g.beginPath(); t.f.forEach((i,q) => { const p = X[i]; q ? g.lineTo(cx + p[0]*S, cy - p[1]*S) : g.moveTo(cx + p[0]*S, cy - p[1]*S); }); g.closePath(); g.stroke(); });
};
V[4].ratio = 1.15;

// V06 3D 體素反應擴散：6 鄰居 3D 模擬，等角體素畫出多孔珊瑚實體
V[5] = function(g, W, H, r, c){
  const n = 20, N = n*n*n, id = (x,y,z) => (z*n + y)*n + x;
  let A = new Float32Array(N).fill(1), B = new Float32Array(N), A2 = new Float32Array(N), B2 = new Float32Array(N);
  for(let q = 0; q < N/200; q++){ const x = r()*(n-2)|0, y = r()*(n-2)|0, z = r()*(n-2)|0;
    for(let a = 0; a < 27; a++){ const i = id(x + a%3, y + (a/3|0)%3, z + (a/9|0)); B[i] = .25 + .25*r(); A[i] = .5; } }
  const f = .039, k = .058, da = .12;
  for(let it = 0; it < 400; it++){
    for(let z = 0; z < n; z++) for(let y = 0; y < n; y++) for(let x = 0; x < n; x++){
      const i = id(x,y,z), xm = id((x+n-1)%n,y,z), xp = id((x+1)%n,y,z), ym = id(x,(y+n-1)%n,z), yp = id(x,(y+1)%n,z), zm = id(x,y,(z+n-1)%n), zp = id(x,y,(z+1)%n);
      const a = A[i], b = B[i], abb = a*b*b;
      A2[i] = cl(a + da*(A[xm]+A[xp]+A[ym]+A[yp]+A[zm]+A[zp]-6*a) - abb + f*(1-a));
      B2[i] = cl(b + da*.5*(B[xm]+B[xp]+B[ym]+B[yp]+B[zm]+B[zp]-6*b) + abb - (k+f)*b); }
    let t = A; A = A2; A2 = t; t = B; B = B2; B2 = t; }
  // 只保留球形範圍內的實體（B > 門檻）
  // 門檻取 B 的第 55 百分位，實體約佔一半，留下海綿狀孔洞
  const on = new Uint8Array(N), h = (n-1)/2, thr = Float32Array.from(B).sort()[Math.floor(N*.55)];
  for(let z = 0; z < n; z++) for(let y = 0; y < n; y++) for(let x = 0; x < n; x++){ const i = id(x,y,z); on[i] = B[i] > thr && Math.hypot(x-h, y-h, (z-h)*1.1) < h*1.02 ? 1 : 0; }
  const u = Math.min(W/(n*1.85), H/(n*2.05)), ox = W/2, oy = H*.5 - n*u*.1;
  const [R0,G0,B0] = U.rgb(c), sh = (t) => `rgb(${Math.min(255, R0*t)|0},${Math.min(255, G0*t)|0},${Math.min(255, B0*t)|0})`;
  const top = sh(1.05), left = sh(.62), right = sh(.38);
  for(let s = 0; s < 3*n; s++) for(let z = 0; z < n; z++) for(let y = 0; y < n; y++){ const x = s - z - y; if(x < 0 || x >= n) continue;
    if(!on[id(x,y,z)]) continue;
    const vis = (x+1 >= n || !on[id(x+1,y,z)]) || (y+1 >= n || !on[id(x,y+1,z)]) || (z+1 >= n || !on[id(x,y,z+1)]); if(!vis) continue;
    const px = ox + (x - y)*u*.87, py = oy + (x + y)*u*.5 - (z - n/2)*u, a = u*.87, b = u*.5;
    g.fillStyle = top; g.beginPath(); g.moveTo(px, py-u); g.lineTo(px+a, py-u+b); g.lineTo(px, py-u+2*b); g.lineTo(px-a, py-u+b); g.closePath(); g.fill();
    g.fillStyle = left; g.beginPath(); g.moveTo(px-a, py-u+b); g.lineTo(px, py-u+2*b); g.lineTo(px, py+2*b); g.lineTo(px-a, py+b); g.closePath(); g.fill();
    g.fillStyle = right; g.beginPath(); g.moveTo(px+a, py-u+b); g.lineTo(px, py-u+2*b); g.lineTo(px, py+2*b); g.lineTo(px+a, py+b); g.closePath(); g.fill(); }
};
V[5].ratio = 1.1;

// V07 等值線輸出：B=0.2 輪廓變成雷切遮陽板，板上只剩切割線與開孔
V[6] = function(g, W, H, r, c){
  const px = W*.12, py = H*.1, pw = W*.76, ph = H*.8, n = 58, m = Math.round(n*ph/pw);
  const R = sim({n, m, f:.039, k:.058, steps:1100, wrapX:false, wrapY:false}, r);
  // 板材（淺色）＋開孔（深色）
  g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(px+6, py+8, pw, ph);
  g.fillStyle = "#D8D2C6"; g.fillRect(px, py, pw, ph);
  const cv = tex(n, m, (i,j) => R.B[j*n+i], t => t > .2 ? [24,24,30,255] : [0,0,0,0]);
  g.save(); g.beginPath(); g.rect(px+pw*.06, py+ph*.05, pw*.88, ph*.9); g.clip(); drawTex(g, cv, px, py, pw, ph); g.restore();
  // 切割路徑（家族色）
  g.save(); g.beginPath(); g.rect(px+pw*.06, py+ph*.05, pw*.88, ph*.9); g.clip();
  g.strokeStyle = c; g.lineWidth = 1.1; segs(g, U.contour(n, m, (i,j) => R.B[j*n+i], .2), px + pw/n*.5, py + ph/m*.5, pw/n, ph/m); g.restore();
  g.strokeStyle = c; g.lineWidth = 1.4; g.strokeRect(px, py, pw, ph);
  // 固定孔
  g.fillStyle = "#18181D"; [[.03,.025],[.97,.025],[.03,.975],[.97,.975]].forEach(([a,b]) => { g.beginPath(); g.arc(px+pw*a, py+ph*b, 2.6, 0, TAU); g.fill(); });
  // 比例尺
  g.fillStyle = "#fff"; for(let q = 0; q < 4; q++) if(q % 2 === 0) g.fillRect(px + q*10, py+ph+10, 10, 3);
  g.strokeStyle = "#fff"; g.lineWidth = 1; g.strokeRect(px, py+ph+10, 40, 3);
};

// V08 高度場浮雕：B 當 Z 高度，等角隱藏線剖面畫成凹凸磚
V[7] = function(g, W, H, r, c){
  const n = 48, m = 48, R = sim({n, m, f:.029, k:.057, steps:1000}, r);
  const u = W/(n*1.95), ox = W/2, oy = H*.18, dep = u*16;
  const P = (i, j, h) => [ox + (i - j)*u*.95, oy + (i + j)*u*.55 - h*dep];
  const hv = (i, j) => sm(.05, .35, R.B[Math.min(m-1,j)*n + Math.min(n-1,i)]);
  // 側面厚度
  const [R0,G0,B0] = U.rgb(c);
  g.fillStyle = `rgb(${R0*.35|0},${G0*.35|0},${B0*.35|0})`; g.beginPath(); { const a = P(0, m-1, 0), b = P(n-1, m-1, 0), d = P(n-1, 0, 0); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(d[0], d[1]); g.lineTo(d[0], d[1]+u*5); g.lineTo(b[0], b[1]+u*5); g.lineTo(a[0], a[1]+u*5); g.closePath(); g.fill(); }
  // 從後往前一列一列畫（沿 i 方向的剖面線）
  for(let j = 0; j < m; j++){ g.beginPath(); for(let i = 0; i < n; i++){ const p = P(i, j, hv(i, j)); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
    const e = P(n-1, j, 0), s0 = P(0, j, 0); g.lineTo(e[0], e[1]+1); g.lineTo(s0[0], s0[1]+1); g.closePath();
    const t = j/m; g.fillStyle = `rgb(${24+t*14|0},${24+t*14|0},${30+t*16|0})`; g.fill();
    g.beginPath(); for(let i = 0; i < n; i++){ const p = P(i, j, hv(i, j)); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
    g.strokeStyle = U.rgba(c, .45 + .55*t); g.lineWidth = 1.1; g.stroke(); }
};
V[7].ratio = .85;

// V09 動畫化：同一次模擬的四個時間點排成影格，下方是時間軸
V[8] = function(g, W, H, r, c){
  const n = 60, m = 60, frames = [], at = [120, 450, 1000, 2000];
  sim({n, m, f:.0367, k:.0649, steps:2000, snaps:at, onSnap:(s, B) => frames.push(B), init:(A,B) => {
    for(let q = 0; q < 3; q++){ const x = 24 + (r()*12|0), y = 24 + (r()*12|0); for(let j = -2; j <= 2; j++) for(let i = -2; i <= 2; i++){ const k = (y+j)*n + x+i; B[k] = 1; A[k] = .5; } } }}, r);
  const pad = W*.07, gap = W*.04, fw = (W - pad*2 - gap)/2, fh = fw, top = (H - (fh*2 + gap + 34))/2;
  frames.forEach((Bf, q) => { const x = pad + (q%2)*(fw+gap), y = top + (q/2|0)*(fh+gap);
    g.fillStyle = "#0b0b0e"; g.fillRect(x-3, y-3, fw+6, fh+6);
    drawTex(g, tex(n, m, (i,j) => Bf[j*n+i]*3.2, ramp(c)), x, y, fw, fh);
    g.fillStyle = "#fff"; for(let d = 0; d <= q; d++) g.fillRect(x + 5 + d*5, y + 5, 3, 3); });
  // 時間軸與播放鍵
  const ty = top + fh*2 + gap + 20; g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 2; g.beginPath(); g.moveTo(pad + 20, ty); g.lineTo(W - pad, ty); g.stroke();
  g.strokeStyle = c; g.beginPath(); g.moveTo(pad + 20, ty); g.lineTo(pad + 20 + (W - pad*2 - 20)*.72, ty); g.stroke();
  g.fillStyle = "#fff"; at.forEach((s, q) => { const x = pad + 20 + (W - pad*2 - 20)*(q+1)/4.4; g.fillRect(x-1, ty-5, 2, 10); });
  g.beginPath(); g.arc(pad + 20 + (W - pad*2 - 20)*.72, ty, 4.5, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(pad, ty-6); g.lineTo(pad+10, ty); g.lineTo(pad, ty+6); g.closePath(); g.fill();
};
V[8].ratio = 1.2;

// V10 多尺度疊層：粗尺度的大斑（虛線）當 kill 地圖，細尺度在周圍長成玫瑰斑
V[9] = function(g, W, H, r, c){
  const cn = 40, cm = Math.round(cn*H/W), C = sim({n:cn, m:cm, f:.0367, k:.0649, steps:1400}, r), cs = sampler(C);
  const n = 84, m = Math.round(n*H/W), F = new Float32Array(n*m), K = new Float32Array(n*m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const b = sm(.08, .3, cs(i/n, j/m)), k = j*n+i; F[k] = mix(.029, .0367, b); K[k] = mix(.057, .0649, b) + (b > .8 ? .006 : 0); }
  const R = sim({n, m, F, K, steps:1100}, r);
  const P = ramp(c);
  drawTex(g, tex(n, m, (i,j) => { const b = sm(.08, .3, cs(i/n, j/m)); return b*.28 + R.B[j*n+i]*3*(1 - b*.3); }, t => { const p = P(t); return [p[0], p[1]*.92, p[2]*.85]; }), 0, 0, W, H);
  // 粗尺度輪廓
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1.3; g.setLineDash([4,3]);
  segs(g, U.contour(cn, cm, (i,j) => C.B[j*cn+i], .18), W/cn*.5, H/cm*.5, W/cn, H/cm); g.setLineDash([]);
  // 左上角的尺度對照小圖
  const s = W*.28; g.fillStyle = "#0b0b0e"; g.fillRect(8, 8, s+4, s*cm/cn+4);
  drawTex(g, tex(cn, cm, (i,j) => C.B[j*cn+i]*3, t => [255*cl(t), 255*cl(t), 255*cl(t)]), 10, 10, s, s*cm/cn);
};

// V11 與 Circle Packing 混合：每個圓是一個分區，各用不同參數；圓外保持空白
V[10] = function(g, W, H, r, c){
  const cir = []; for(let t = 0; t < 1500 && cir.length < 26; t++){ const x = r()*W, y = r()*H, rr = Math.min(W,H)*(.06 + r()*.2);
    if(x - rr < 4 || y - rr < 4 || x + rr > W-4 || y + rr > H-4) continue; if(cir.some(q => Math.hypot(q[0]-x, q[1]-y) < q[2] + rr + 3)) continue; cir.push([x, y, rr]); }
  const n = 84, m = Math.round(n*H/W), F = new Float32Array(n*m), K = new Float32Array(n*m), mask = new Uint8Array(n*m);
  const PR = [[.0367,.0649],[.029,.057],[.055,.062],[.039,.058]];
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const x = (i+.5)/n*W, y = (j+.5)/m*H, k = j*n+i;
    const q = cir.findIndex(([a,b,rr]) => Math.hypot(x-a, y-b) < rr); if(q < 0) continue; mask[k] = 1; F[k] = PR[q%4][0]; K[k] = PR[q%4][1]; }
  const R = sim({n, m, F, K, mask, steps:1000, wrapX:false, wrapY:false}, r);
  const P = ramp(c); drawTex(g, tex(n, m, (i,j) => mask[j*n+i] ? R.B[j*n+i]*3 : -1, t => t < 0 ? [0,0,0,0] : P(t)), 0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 1.4; cir.forEach(([x,y,rr]) => { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.stroke(); });
  g.fillStyle = "#fff"; cir.forEach(([x,y]) => { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); });
};
V[10].ratio = .9;

// V12 其他反應模型：Barkley（FitzHugh-Nagumo 類的可激發介質），斷裂波前捲成螺旋波；u 激發為白、v 恢復為雙色
V[11] = function(g, W, H, r, c){
  const n = 100, m = Math.round(n*H/W), N = n*m, a = .75, b = .02, eps = .02, dt = .02, Dh = 1/(.4*.4);
  let u = new Float32Array(N), v = new Float32Array(N), u2 = new Float32Array(N);
  // 初始：上半激發、左半已恢復中，交界處的斷點變成螺旋中心（位置隨機）
  const cx = n*(.35 + r()*.3), cy = m*(.35 + r()*.3), rot = r() < .5;
  for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){ const i = y*n+x; if(rot ? y < cy : y > cy) u[i] = 1; if(x < cx) v[i] = a/2; }
  for(let it = 0; it < 1100; it++){
    for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){ const i = y*n+x, xl = x ? i-1 : i, xr = x < n-1 ? i+1 : i, yu = y ? i-n : i, yd = y < m-1 ? i+n : i;
      const uu = u[i], lap = (u[xl]+u[xr]+u[yu]+u[yd]-4*uu)*Dh, nu = uu + dt*(uu*(1-uu)*(uu - (v[i]+b)/a)/eps + lap);
      u2[i] = nu < 0 ? 0 : nu > 1 ? 1 : nu; v[i] += dt*(uu - v[i]); }
    const t = u; u = u2; u2 = t; }
  const [R0,G0,B0] = U.rgb(c), C2 = [70,190,210];
  const cv = tex(n, m, (i,j) => j*n+i, k => { const vv = cl(v[k]/.75); if(u[k] > .5) return [250,250,255];
    return lerpC([18,18,24], lerpC([R0,G0,B0], C2, vv), Math.pow(vv, .6)); });
  drawTex(g, cv, 0, 0, W, H, true);
  g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1; g.beginPath(); g.arc(cx/n*W, cy/m*H, 6, 0, TAU); g.stroke();
};

ART.var["C01"] = V;

/* ================================================================
   沒有照片的案例
   ================================================================ */
const C = ART.case;

// 共用：參數曲面的四邊形網格（排序後填色）
function drawSurface(g, nu, nv, pos, col, cam){
  const Q = [];
  const pts = []; for(let j = 0; j <= nv; j++) for(let i = 0; i <= nu; i++) pts.push(cam(pos(i/nu, j/nv)));
  for(let j = 0; j < nv; j++) for(let i = 0; i < nu; i++){ const a = pts[j*(nu+1)+i], b = pts[j*(nu+1)+i+1], d = pts[(j+1)*(nu+1)+i+1], e = pts[(j+1)*(nu+1)+i];
    Q.push({a, b, d, e, z:(a[2]+b[2]+d[2]+e[2])/4, u:(i+.5)/nu, v:(j+.5)/nv}); }
  Q.sort((p,q) => q.z - p.z);
  Q.forEach(q => { const cc = col(q.u, q.v, q); if(!cc) return; g.fillStyle = cc; g.strokeStyle = cc; g.lineWidth = .7;
    g.beginPath(); g.moveTo(q.a[0], q.a[1]); g.lineTo(q.b[0], q.b[1]); g.lineTo(q.d[0], q.d[1]); g.lineTo(q.e[0], q.e[1]); g.closePath(); g.fill(); g.stroke(); });
  return Q;
}
function camera(W, H, S, ry, rx, oy = 0){
  return ([x,y,z]) => { const x1 = x*Math.cos(ry) + z*Math.sin(ry), z1 = -x*Math.sin(ry) + z*Math.cos(ry);
    const y2 = y*Math.cos(rx) - z1*Math.sin(rx), z2 = y*Math.sin(rx) + z1*Math.cos(rx); return [W/2 + x1*S, H/2 + oy - y2*S, z2]; };
}

// C01-01 反應擴散珠寶：凹凸脊谷包覆在戒指（環面）上，金屬光澤；旁邊一個莫比烏斯環線稿
C["C01-01"] = function(g, W, H, r, c){
  const R = sim({n:96, m:24, f:.029, k:.057, steps:1600, s:.1}, r), smp = sampler(R);
  const S = Math.min(W, H)*.3, cam = camera(W, H, S, .3, 1.05, -H*.02);
  const pos = (u, v) => { const a = u*TAU, b = v*TAU, rr = .34*(1 + .25*sm(.1,.3,smp(u, v))), R0 = 1.1; return [(R0 + rr*Math.cos(b))*Math.cos(a), rr*Math.sin(b)*.75, (R0 + rr*Math.cos(b))*Math.sin(a)]; };
  const [R0,G0,B0] = U.rgb(c), gold = lerpC([R0,G0,B0], [240,236,228], .5);
  g.fillStyle = "rgba(0,0,0,.5)"; g.beginPath(); g.ellipse(W/2, H/2 + S*.55, S*1.35, S*.4, 0, 0, TAU); g.fill();
  drawSurface(g, 110, 26, pos, (u, v) => { const h = sm(.1, .3, smp(u, v)), l = cl(.1 + .35*Math.cos((v - .2)*TAU) + .6*h);
    const col = lerpC([40,36,34], gold, l); const sp = Math.pow(cl(Math.cos((v-.15)*TAU)*Math.cos((u-.62)*TAU)), 12)*120;
    return `rgb(${Math.min(255,col[0]+sp)|0},${Math.min(255,col[1]+sp)|0},${Math.min(255,col[2]+sp)|0})`; }, cam);
  const cam2 = camera(W, H, S*.32, 1.1, .7, H*.36);
  g.strokeStyle = U.rgba(c,.8); g.lineWidth = 1;
  for(let s = -1; s <= 1; s += .5){ g.beginPath(); for(let q = 0; q <= 90; q++){ const a = q/90*TAU, w = s*.35, x = (1 + w*Math.cos(a/2))*Math.cos(a), y = w*Math.sin(a/2), z = (1 + w*Math.cos(a/2))*Math.sin(a);
    const p = cam2([x + 3.2, y, z]); q ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); }
};
C["C01-01"].ratio = 1.05;

// C01-02 反應擴散燈具：吊燈球，大小兩層花紋疊加，薄處透光形成細胞紋理
C["C01-02"] = function(g, W, H, r, c){
  const big = sim({n:40, m:20, f:.0367, k:.0649, steps:700}, r), fine = sim({n:120, m:60, f:.039, k:.058, steps:1000}, r);
  const sb = sampler(big), sf = sampler(fine), cx = W/2, cy = H*.56, Rr = Math.min(W, H*.8)*.36, rot = r()*TAU;
  // 光暈
  const gr = g.createRadialGradient(cx, cy, Rr*.3, cx, cy, Rr*2.2); gr.addColorStop(0, "rgba(255,200,120,.35)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // 吊線與燈座
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, cy - Rr - 6); g.stroke();
  g.fillStyle = "#3a3a44"; g.fillRect(cx - 7, cy - Rr - 10, 14, 10);
  const [R0,G0,B0] = U.rgb(c), sc = 2, w = Math.round(Rr*2/sc)+2;
  const cv = pix(w, w, (i, j) => { const x = (i*sc - Rr)/Rr, y = (j*sc - Rr)/Rr, d = x*x + y*y; if(d > 1) return null;
    const z = Math.sqrt(1 - d), lon = Math.atan2(x, z) + rot, lat = Math.asin(y);
    const u = lon/TAU, v = lat/Math.PI + .5, b = sm(.1, .3, sb(u, v))*.5 + sm(.12, .28, sf(u, v));
    const thin = cl(1 - b), glow = thin*(.55 + .45*z);
    const p = lerpC([R0*.5, G0*.5, B0*.5], [255, 214, 150], glow); return [p[0], p[1], p[2], 255*sm(1, .96, d)]; });
  g.imageSmoothingEnabled = true; g.drawImage(cv, cx - Rr, cy - Rr, w*sc, w*sc);
};
C["C01-02"].ratio = 1.3;

// C01-03 珊瑚杯：瓷杯側面，腦珊瑚迷宮紋，含把手、碟子與分模線
C["C01-03"] = function(g, W, H, r, c){
  const R = sim({n:110, m:44, f:.029, k:.057, steps:1100, wrapY:false}, r), smp = sampler(R);
  const cx = W*.46, top = H*.3, bot = H*.74, rt = W*.3, rb = W*.2, prof = y => mix(rt, rb, Math.pow((y - top)/(bot - top), 1.6));
  // 碟子
  g.fillStyle = "#cfcac0"; g.beginPath(); g.ellipse(cx, bot + 4, W*.42, H*.07, 0, 0, TAU); g.fill();
  g.fillStyle = "#b5b0a6"; g.beginPath(); g.ellipse(cx, bot + 2, W*.3, H*.045, 0, 0, TAU); g.fill();
  // 把手
  g.strokeStyle = "#e8e4dc"; g.lineWidth = W*.045; g.beginPath(); g.ellipse(cx + rt*.95, (top + bot)/2 - H*.02, W*.12, H*.12, 0, -Math.PI*.5, Math.PI*.5); g.stroke();
  const [R0,G0,B0] = U.rgb(c);
  const cv = pix(W, H, (i, j) => { if(j < top || j > bot) return null; const rr = prof(j), x = (i - cx)/rr; if(Math.abs(x) > 1) return null;
    const th = Math.asin(x), u = th/TAU + .5, v = (j - top)/(bot - top), h = sm(.1, .3, smp(u*1.4, v)), h2 = sm(.1, .3, smp(u*1.4 + .006, v));
    const lt = cl(.55 + .45*Math.cos(th + .5)) * (1 - .3*(h2 - h)*8);
    const base = lerpC([238,234,226], [R0,G0,B0], h*.75); return base.map(q => q*(.35 + .65*lt)); });
  g.drawImage(cv, 0, 0, W, H);
  // 杯口
  g.fillStyle = "#2a2a30"; g.beginPath(); g.ellipse(cx, top, rt, H*.045, 0, 0, TAU); g.fill();
  g.strokeStyle = "#f2efe8"; g.lineWidth = 2; g.stroke();
  // 分模線
  g.strokeStyle = "rgba(255,255,255,.5)"; g.setLineDash([2,3]); g.lineWidth = 1; g.beginPath(); g.moveTo(cx, top + 3); g.lineTo(cx, bot); g.stroke(); g.setLineDash([]);
};
C["C01-03"].ratio = .9;

// C01-04 球鞋 RD 花紋：側面剪影，鞋面填入方向性條紋，白色中底
C["C01-04"] = function(g, W, H, r, c){
  const n = 90, m = Math.round(n*H/W), R = sim({n, m, f:.03, k:.057, wt:aniso(n, m, (i,j) => -.25 + .5*i/n, .8), steps:1000}, r);
  const X = x => W*.05 + x*W*.9, Y = y => H*.2 + y*H*.62;
  const upper = () => { g.beginPath(); g.moveTo(X(.02), Y(.78)); g.bezierCurveTo(X(0), Y(.45), X(.08), Y(.12), X(.2), Y(.05)); g.lineTo(X(.33), Y(.06));
    g.bezierCurveTo(X(.36), Y(.22), X(.46), Y(.28), X(.55), Y(.35)); g.bezierCurveTo(X(.72), Y(.45), X(.9), Y(.5), X(.98), Y(.7)); g.lineTo(X(.98), Y(.8)); g.closePath(); };
  g.save(); upper(); g.clip(); drawTex(g, tex(n, m, (i,j) => sm(.1, .3, R.B[j*n+i]), ramp(c)), 0, 0, W, H); g.restore();
  upper(); g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.stroke();
  // 中底與大底
  g.fillStyle = "#EDEAE4"; g.beginPath(); g.moveTo(X(.01), Y(.76)); g.lineTo(X(.99), Y(.76)); g.bezierCurveTo(X(1.02), Y(.9), X(.97), Y(.98), X(.9), Y(.98)); g.lineTo(X(.06), Y(.98)); g.bezierCurveTo(X(0), Y(.98), X(-.01), Y(.86), X(.01), Y(.76)); g.fill();
  g.fillStyle = U.rgba(c,.9); g.fillRect(X(.02), Y(.97), X(.96) - X(.02), H*.025);
  g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 1; for(let q = 0; q < 22; q++){ const x = X(.04 + q*.042); g.beginPath(); g.moveTo(x, Y(.9)); g.lineTo(x + 3, Y(.97)); g.stroke(); }
  // 鞋帶
  g.strokeStyle = "#fff"; g.lineWidth = 2; for(let q = 0; q < 5; q++){ const t = .36 + q*.055, x = X(t), y = Y(.2 + q*.06); g.beginPath(); g.moveTo(x - 5, y - 3); g.lineTo(x + 7, y + 4); g.stroke(); }
};
C["C01-04"].ratio = .75;

// C01-05 RD 圖解教學：A、B 兩張濃度圖，下方 3×3 卷積核（中心 −1、上下左右 0.2、斜角 0.05）
C["C01-05"] = function(g, W, H, r, c){
  const n = 50, R = sim({n, m:n, f:.055, k:.062, steps:1400, init:(A,B) => { for(let j = 20; j < 30; j++) for(let i = 20; i < 30; i++){ B[j*n+i] = 1; A[j*n+i] = .5; } }}, r);
  const pad = W*.07, s = (W - pad*3)/2, y0 = H*.08;
  drawTex(g, tex(n, n, (i,j) => R.A[j*n+i], t => [255*t, 255*t, 255*t]), pad, y0, s, s);
  drawTex(g, tex(n, n, (i,j) => R.B[j*n+i]*3, ramp(c)), pad*2 + s, y0, s, s);
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.strokeRect(pad, y0, s, s); g.strokeRect(pad*2+s, y0, s, s);
  const ay = y0 + s/2; g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(pad + s + 3, ay); g.lineTo(pad*2 + s - 3, ay); g.stroke();
  // 卷積核：格子亮度代表權重，中心為負
  const kw = [[.05,.2,.05],[.2,-1,.2],[.05,.2,.05]], ks = Math.min(W*.13, (H - y0 - s - 30)/3.4), kx = W/2 - ks*1.5, ky = y0 + s + (H - y0 - s - ks*3)/2;
  kw.forEach((row, j) => row.forEach((w, i) => { const x = kx + i*ks, y = ky + j*ks;
    g.fillStyle = w < 0 ? "#fff" : U.rgba(c, .15 + w*3.5); g.fillRect(x + 2, y + 2, ks - 4, ks - 4);
    g.fillStyle = w < 0 ? "#15151b" : "#fff"; const d = Math.max(2, Math.abs(w)*ks*.35); g.fillRect(x + ks/2 - d/2, y + ks/2 - 1, d, 2); if(w > 0){ g.fillRect(x + ks/2 - 1, y + ks/2 - d/2, 2, d); } }));
  g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1; g.setLineDash([3,3]); const bx = pad*2 + s + s*.3, by = y0 + s*.7;
  g.strokeRect(bx - 4, by - 4, 8, 8); g.beginPath(); g.moveTo(bx, by + 4); g.lineTo(kx + ks*3, ky); g.stroke(); g.setLineDash([]);
};
C["C01-05"].ratio = 1.1;

// C01-06 Pearson 參數圖：(F, k) 平面上一格一個小模擬，看出不同區域的圖樣類型
C["C01-06"] = function(g, W, H, r, c){
  const cols = 5, rows = 6, ax = W*.1, ay = H*.05, gw = W*.86, gh = H*.86, cw = gw/cols, ch = gh/rows, n = 22, P = ramp(c);
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const f = .062 - j*.0095, k = Math.sqrt(f)/2 - f + [-.005,-.0025,0,.0015,.003][i];
    const R = sim({n, m:n, f, k, steps:700, s:.1}, r);
    drawTex(g, tex(n, n, (x,y) => R.B[y*n+x]*3, P), ax + i*cw + 1, ay + j*ch + 1, cw - 2, ch - 2); }
  g.strokeStyle = "#fff"; g.lineWidth = 1.3; g.beginPath(); g.moveTo(ax - 3, ay); g.lineTo(ax - 3, ay + gh + 3); g.lineTo(ax + gw, ay + gh + 3); g.stroke();
  g.fillStyle = "#fff"; for(let i = 0; i <= cols; i++) g.fillRect(ax + i*cw - .5, ay + gh + 3, 1, 4); for(let j = 0; j <= rows; j++) g.fillRect(ax - 7, ay + j*ch - .5, 4, 1);
  g.strokeStyle = "rgba(255,255,255,.7)"; g.setLineDash([4,3]); g.lineWidth = 1.2; g.beginPath();
  for(let q = 0; q <= 40; q++){ const t = q/40, x = ax + t*gw, y = ay + gh*(.1 + .85*Math.pow(t, 1.8)); q ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.setLineDash([]);
};
C["C01-06"].ratio = 1.2;

// C01-07 任意曲面上的紋理（SIGGRAPH 91）：長頸鹿網紋貼在自由曲面上，半邊露出線框，建模視窗地面格線
C["C01-07"] = function(g, W, H, r, c){
  const R = sim({n:100, m:50, f:.039, k:.058, steps:1000, seedN:60}, r), smp = sampler(R);
  const S = Math.min(W, H)*.33, cam = camera(W, H, S, .5 + r(), .35, H*.02), ph = r()*TAU;
  const pos = (u, v) => { const a = u*TAU, b = (v - .5)*Math.PI, rr = 1 + .18*Math.sin(2*a + ph)*Math.cos(b) + .12*Math.sin(3*b);
    return [rr*Math.cos(b)*Math.cos(a)*1.25, rr*Math.sin(b)*.95, rr*Math.cos(b)*Math.sin(a)*.9]; };
  g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1; for(let q = -6; q <= 6; q++){ g.beginPath(); g.moveTo(W/2 + q*W*.05, H*.62); g.lineTo(W/2 + q*W*.2, H); g.stroke(); }
  for(let q = 0; q < 6; q++){ const y = H*.62 + Math.pow(q/5, 1.6)*H*.38; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const spot = [150, 92, 50], [R0,G0,B0] = U.rgb(c), line = lerpC([235,215,170], [R0,G0,B0], .25);
  drawSurface(g, 80, 40, pos, (u, v) => { const b = 1 - sm(.14, .2, smp(u, v)), lt = cl(.35 + .65*Math.sin(v*Math.PI)*(.6 + .4*Math.cos((u - .3)*TAU)));
    const p = lerpC(line, spot, b).map(x => x*lt); return `rgb(${p[0]|0},${p[1]|0},${p[2]|0})`; }, cam);
  g.strokeStyle = U.rgba(c,.75); g.lineWidth = .6;
  for(let i = 20; i <= 40; i++){ const u = i/40; g.beginPath(); let pen = false; for(let j = 0; j <= 30; j++){ const p = cam(pos(u, j/30)); if(p[2] > .1){ pen = false; continue; } pen ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); pen = true; } g.stroke(); }
  g.lineWidth = 2; [[1,0,"#e05050"],[0,-1,"#50c060"],[-.6,.5,"#5080e0"]].forEach(([x,y,col]) => { g.strokeStyle = col; g.beginPath(); g.moveTo(18, H - 18); g.lineTo(18 + x*14, H - 18 + y*14); g.stroke(); });
};
C["C01-07"].ratio = .95;

// C01-08 三角網格上的反應擴散（花瓶）：建模視窗裡的旋轉體三角網格線框，頂點依 B 著色
C["C01-08"] = function(g, W, H, r, c){
  const nu = 72, nv = 40, R = sim({n:nu, m:nv, f:.0367, k:.0649, steps:1200, wrapY:false, s:.2}, r);
  const prof = v => .45 + .35*Math.sin(v*Math.PI*1.15 + .2) - .18*v + (v > .9 ? (v - .9)*2.2 : 0);
  const S = Math.min(W, H)*.3, cam = camera(W, H, S, .2, .42, H*.02);
  const pos = (u, v) => { const a = u*TAU, rr = prof(v); return [rr*Math.cos(a), (v - .5)*2.4, rr*Math.sin(a)]; };
  g.fillStyle = "#23262e"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1;
  for(let q = -8; q <= 8; q++){ const a = cam([q*.25, -1.2, -2]), b = cam([q*.25, -1.2, 2]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    const d = cam([-2, -1.2, q*.25]), e = cam([2, -1.2, q*.25]); g.beginPath(); g.moveTo(d[0], d[1]); g.lineTo(e[0], e[1]); g.stroke(); }
  const P = []; for(let j = 0; j < nv; j++) for(let i = 0; i < nu; i++) P.push(cam(pos(i/nu, (j+.5)/nv)));
  const at = (i, j) => P[j*nu + (i % nu)];
  for(let j = 0; j < nv - 1; j++) for(let i = 0; i < nu; i++){ const a = at(i, j), b = at(i+1, j), d = at(i, j+1), e = at(i+1, j+1), front = a[2] < 0;
    g.strokeStyle = front ? "rgba(200,210,230,.35)" : "rgba(200,210,230,.08)"; g.lineWidth = .5;
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(d[0], d[1]); g.closePath(); g.moveTo(b[0], b[1]); g.lineTo(e[0], e[1]); g.lineTo(d[0], d[1]); g.stroke(); }
  const [R0,G0,B0] = U.rgb(c);
  for(let j = 0; j < nv; j++) for(let i = 0; i < nu; i++){ const p = at(i, j), b = sm(.1, .3, R.B[j*nu+i]); if(p[2] > .05 || b < .2) continue;
    g.fillStyle = `rgba(${R0},${G0},${B0},${.4 + .6*b})`; g.beginPath(); g.arc(p[0], p[1], 1.2 + b*1.6, 0, TAU); g.fill(); }
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(4, 4, W-8, H-8);
  g.lineWidth = 2; [[1,0,"#e05050"],[0,-1,"#50c060"]].forEach(([x,y,col]) => { g.strokeStyle = col; g.beginPath(); g.moveTo(16, H - 16); g.lineTo(16 + x*14, H - 16 + y*14); g.stroke(); });
};
C["C01-08"].ratio = 1.25;

// C01-09 把 RD 變成曲線：米白紙上的繪圖機單線稿，三層等值線
C["C01-09"] = function(g, W, H, r, c){
  const px = W*.08, py = H*.07, pw = W*.84, ph = H*.86, n = 60, m = Math.round(n*ph/pw);
  const R = sim({n, m, f:.039, k:.058, steps:1100}, r);
  g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(px + 5, py + 6, pw, ph);
  g.fillStyle = "#EFEBE2"; g.fillRect(px, py, pw, ph);
  g.save(); g.beginPath(); g.rect(px + pw*.07, py + ph*.06, pw*.86, ph*.88); g.clip();
  const [R0,G0,B0] = U.rgb(c);
  [[.08, "rgba(40,40,50,.55)", .7], [.18, "rgba(30,30,38,.9)", 1], [.28, `rgb(${R0*.8|0},${G0*.8|0},${B0*.8|0})`, 1.3]].forEach(([iso, col, lw]) => {
    g.strokeStyle = col; g.lineWidth = lw; segs(g, U.contour(n, m, (i,j) => R.B[j*n+i], iso), px + pw/n*.5, py + ph/m*.5, pw/n, ph/m); });
  g.restore();
  const qx = px + pw*.72, qy = py + ph*.35; g.fillStyle = "#555"; g.fillRect(qx - 3, qy - 34, 6, 30);
  g.fillStyle = c; g.beginPath(); g.moveTo(qx - 3, qy - 4); g.lineTo(qx + 3, qy - 4); g.lineTo(qx, qy + 2); g.closePath(); g.fill();
  g.strokeStyle = "rgba(90,90,100,.6)"; g.lineWidth = 3; g.beginPath(); g.moveTo(px - 2, qy - 30); g.lineTo(px + pw + 2, qy - 30); g.stroke();
};
C["C01-09"].ratio = 1.15;

// C01-10 等應力肋板樓板：柱位與應力色階，各向異性 RD 條紋沿主應力方向變成肋
C["C01-10"] = function(g, W, H, r, c){
  const n = 80, m = Math.round(n*H/W), cols = [];
  for(let j = 0; j < 2; j++) for(let i = 0; i < 2; i++) cols.push([n*(.25 + i*.5), m*(.25 + j*.5)]);
  const phi = (i, j) => cols.reduce((s, [x, y]) => s + Math.log(Math.hypot(i-x, j-y) + 1.5), 0);
  const th = (i, j) => { const gx = phi(i+1, j) - phi(i-1, j), gy = phi(i, j+1) - phi(i, j-1); return Math.atan2(gy, gx); };
  const R = sim({n, m, f:.03, k:.057, wt:aniso(n, m, th, .9), steps:1000, wrapX:false, wrapY:false}, r);
  let lo = 1e9, hi = -1e9; const V2 = new Float32Array(n*m); for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const v = -phi(i, j); V2[j*n+i] = v; lo = Math.min(lo, v); hi = Math.max(hi, v); }
  const [R0,G0,B0] = U.rgb(c), heat = t => t < .5 ? lerpC([40,70,150], [R0,G0,B0], t*2) : lerpC([R0,G0,B0], [250,220,90], t*2-1);
  drawTex(g, tex(n, m, (i,j) => (V2[j*n+i] - lo)/(hi - lo), t => heat(Math.pow(t, 1.5)).map(v => v*.55)), 0, 0, W, H);
  drawTex(g, tex(n, m, (i,j) => sm(.15, .28, R.B[j*n+i]), t => [240, 240, 236, 255*t]), 0, 0, W, H);
  g.fillStyle = "#15151b"; g.strokeStyle = "#fff"; g.lineWidth = 1.5; cols.forEach(([x, y]) => { const s = 9; g.fillRect(x/n*W - s/2, y/m*H - s/2, s, s); g.strokeRect(x/n*W - s/2, y/m*H - s/2, s, s); });
  for(let q = 0; q < 40; q++){ const p = heat(q/40); g.fillStyle = `rgb(${p.map(v => v|0)})`; g.fillRect(W - 14, H*.9 - q*H*.02, 7, H*.02 + .5); }
};

// C01-11 Turing 圖樣充氣結構：上方是雙材料的平面圖樣，下方是充氣後拱起的剖面
C["C01-11"] = function(g, W, H, r, c){
  const n = 60, R = sim({n, m:n, f:.03, k:.057, steps:1000, wt:aniso(n, n, (i,j) => Math.atan2(j - n/2, i - n/2), .7)}, r);
  const [R0,G0,B0] = U.rgb(c), bin = (i,j) => { const d = Math.hypot(i - n/2 + .5, j - n/2 + .5)/(n/2); return d > 1 ? -1 : R.B[j*n+i] > .2 ? 1 : 0; };
  const cv = tex(n, n, bin, t => t < 0 ? [0,0,0,0] : t ? [R0, G0, B0] : [228,226,220]);
  const s = Math.min(W*.62, H*.4), dx = W/2 - s/2, dy = H*.06; drawTex(g, cv, dx, dy, s, s, false);
  g.strokeStyle = "#fff"; g.lineWidth = 1; g.beginPath(); g.arc(W/2, dy + s/2, s/2, 0, TAU); g.stroke();
  const ay = dy + s + H*.05; g.strokeStyle = "#fff"; g.lineWidth = 2; g.beginPath(); g.moveTo(W/2, ay); g.lineTo(W/2, ay + H*.07); g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); g.moveTo(W/2 - 6, ay + H*.07); g.lineTo(W/2 + 6, ay + H*.07); g.lineTo(W/2, ay + H*.07 + 8); g.closePath(); g.fill();
  const by = H*.93, hw = W*.4, hh = H*.25;
  for(let q = 0; q < n; q++){ const t0 = q/n, t1 = (q+1)/n, x0 = W/2 + (t0*2-1)*hw, x1 = W/2 + (t1*2-1)*hw;
    const y0 = by - Math.sin(t0*Math.PI)*hh*(1 + .15*Math.sin(t0*TAU*2)), y1 = by - Math.sin(t1*Math.PI)*hh*(1 + .15*Math.sin(t1*TAU*2));
    const hard = R.B[(n/2|0)*n + q] > .2; g.strokeStyle = hard ? c : "#e4e2dc"; g.lineWidth = hard ? 5 : 3; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(W*.05, by); g.lineTo(W*.95, by); g.stroke();
  g.strokeStyle = U.rgba(c,.6); for(let q = 1; q < 6; q++){ const x = W/2 + (q/6*2-1)*hw*.8; g.beginPath(); g.moveTo(x, by - 3); g.lineTo(x, by - hh*.5*Math.sin(q/6*Math.PI)); g.stroke(); }
};
C["C01-11"].ratio = 1.3;

// C01-12 Turing 紋理織物致動器：C 形與 S 形彎曲的布管，表面是方向性條紋與刺繡虛線
C["C01-12"] = function(g, W, H, r, c){
  const n = 90, m = 18, R = sim({n, m, f:.03, k:.057, wt:aniso(n, m, () => Math.PI/2 + .35, .9), steps:1000}, r), smp = sampler(R);
  const [R0,G0,B0] = U.rgb(c);
  const band = (path, wd) => { const L = 90; for(let q = 0; q < L; q++){ const a = path(q/L), b = path((q+1)/L), tx = b[0]-a[0], ty = b[1]-a[1], l = Math.hypot(tx, ty) || 1, nx = -ty/l, ny = tx/l;
      for(let k = 0; k < 6; k++){ const s0 = (k/6 - .5)*wd, s1 = ((k+1)/6 - .5)*wd, v = smp(q/L, (k + .5)/6), on = v > .18, lt = .55 + .45*Math.cos((k + .5)/6*Math.PI - Math.PI/2);
        const col = (on ? [R0, G0, B0] : [210, 214, 222]).map(x => x*lt|0);
        g.fillStyle = `rgb(${col})`; g.strokeStyle = g.fillStyle; g.lineWidth = .6; g.beginPath();
        g.moveTo(a[0] + nx*s0, a[1] + ny*s0); g.lineTo(b[0] + nx*s0, b[1] + ny*s0); g.lineTo(b[0] + nx*s1, b[1] + ny*s1); g.lineTo(a[0] + nx*s1, a[1] + ny*s1); g.closePath(); g.fill(); g.stroke(); } }
    g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1; g.setLineDash([2,3]); [-.5, .5].forEach(s => { g.beginPath(); for(let q = 0; q <= L; q++){ const a = path(Math.min(q, L-1)/L), b = path(Math.min(q+1, L)/L), tx = b[0]-a[0], ty = b[1]-a[1], l = Math.hypot(tx, ty) || 1;
      const pp = path(q/L), x = pp[0] - ty/l*s*wd, y = pp[1] + tx/l*s*wd; q ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }); g.setLineDash([]);
    const p0 = path(0); g.fillStyle = "#888"; g.beginPath(); g.arc(p0[0], p0[1], wd*.35, 0, TAU); g.fill(); };
  const w = Math.min(W, H)*.12;
  band(t => { const a = Math.PI*(.15 + 1.1*t); return [W*.5 + Math.cos(a)*W*.3, H*.3 - Math.sin(a)*H*.2 + H*.02]; }, w);
  band(t => [W*.12 + t*W*.76, H*.72 + Math.sin(t*TAU)*H*.12], w);
};
C["C01-12"].ratio = 1.05;

// C01-13 形態發生超表面：透視面板上排著依方向場自組織的橢圓單元，上方畫出偏折的波束
C["C01-13"] = function(g, W, H, r, c){
  const n = 44, th = (i, j) => .7*Math.sin(i/n*Math.PI*1.5) + 1.2*j/n;
  const R = sim({n, m:n, f:.03, k:.057, wt:aniso(n, n, th, .8), steps:900}, r);
  // 透視：v=0 在遠處、v=1 在近處
  const hz = H*.3, P = (u, v) => { const z = 2.4 - v*1.4; return [W/2 + (u - .5)*1.9/z*W*.62, hz + H*.66/z]; };
  const [R0,G0,B0] = U.rgb(c);
  const cn = [P(0,0), P(1,0), P(1,1), P(0,1)]; g.fillStyle = "#26262e"; U.poly(g, cn, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.stroke();
  for(let j = 0; j < n; j += 2) for(let i = 0; i < n; i += 2){ const b = R.B[j*n+i]; if(b < .1) continue;
    const u = (i+1)/n, v = (j+1)/n, p = P(u, v), q = P(u + .01, v), k = Math.hypot(q[0]-p[0], q[1]-p[1])/.01, t = th(i, j), sz = .5 + b*2;
    g.fillStyle = `rgba(${R0},${G0},${B0},${Math.min(1, .45 + b*1.6)})`; g.beginPath();
    g.ellipse(p[0], p[1], k*.02*sz, k*.006*sz, t*.5, 0, TAU); g.fill(); }
  // 波束：從面板中央往右上偏折
  const o = P(.5, .55), tip = [W*.82, H*.02], L = Math.hypot(tip[0]-o[0], tip[1]-o[1]), ang = Math.atan2(tip[1]-o[1], tip[0]-o[0]);
  const gr = g.createLinearGradient(o[0], o[1], tip[0], tip[1]); gr.addColorStop(0, "rgba(255,255,255,.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr;
  g.beginPath(); g.moveTo(o[0], o[1]); g.arc(o[0], o[1], L, ang - .16, ang + .16); g.closePath(); g.fill();
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; for(let q = 1; q < 6; q++){ g.beginPath(); g.arc(o[0], o[1], L*q/6, ang - .3, ang + .3); g.stroke(); }
  g.fillStyle = "#fff"; g.beginPath(); g.arc(o[0], o[1], 3, 0, TAU); g.fill();
};
C["C01-13"].ratio = 1.1;

// C01-14 影像風格化：左半是灰階原圖，右半是依亮度與邊緣方向長出的 RD 剪紙效果
C["C01-14"] = function(g, W, H, r, c){
  const n = 90, m = Math.round(n*H/W), sx = .6 + r()*.2, sy = .3 + r()*.1;
  const img = (x, y) => { const sun = cl(1.3 - Math.hypot(x - sx, (y - sy)*m/n)*5), hill = y > .62 + .12*Math.sin(x*7 + 1) ? .15 : 0, hill2 = y > .75 + .06*Math.sin(x*11) ? .08 : 0;
    const sky = .35 + .4*(1 - y); return hill2 || hill || Math.max(sky, sun); };
  const F = new Float32Array(n*m), K = new Float32Array(n*m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const l = img(i/n, j/m), k = j*n+i; F[k] = mix(.029, .0367, l); K[k] = mix(.057, .0649, l); }
  const th = (i, j) => { const gx = img((i+1)/n, j/m) - img((i-1)/n, j/m), gy = img(i/n, (j+1)/m) - img(i/n, (j-1)/m); return Math.abs(gx) + Math.abs(gy) > .01 ? Math.atan2(gy, gx) + Math.PI/2 : .3; };
  const R = sim({n, m, F, K, wt:aniso(n, m, th, .6), steps:1100}, r), smp = sampler(R, false);
  const [R0,G0,B0] = U.rgb(c), paper = [240,232,214];
  const cv = pix(W, H, (i, j) => { const x = i/W, y = j/H, split = .42 + (y - .5)*.2;
    if(x < split){ const l = img(x, y)*255; return [l, l, l]; }
    const b = sm(.16, .2, smp(x, y)); return lerpC(paper, [R0*.7, G0*.7, B0*.7], b); });
  g.drawImage(cv, 0, 0, W, H);
  g.strokeStyle = "#fff"; g.lineWidth = 2; g.beginPath(); g.moveTo((.42 - .1)*W, 0); g.lineTo((.42 + .1)*W, H); g.stroke();
};
C["C01-14"].ratio = .8;

// C01-15 互動網頁：平板螢幕上手指塗抹，筆跡處花紋被打散重長，下方兩條滑桿
C["C01-15"] = function(g, W, H, r, c){
  const bx = W*.06, by = H*.05, bw = W*.88, bh = H*.9, sx = bx + bw*.05, sy = by + bh*.05, sw = bw*.9, sh = bh*.72;
  const n = 80, m = Math.round(n*sh/sw), path = t => [n*(.15 + .7*t), m*(.5 + .3*Math.sin(t*TAU*1.2 + .5))];
  const R = sim({n, m, f:.03, k:.062, steps:1100, poke:(it, A, B) => { if(it < 500 || it > 700) return; const [x, y] = path((it - 500)/200);
    for(let j = -2; j <= 2; j++) for(let i = -2; i <= 2; i++){ const k = (((y|0)+j+m)%m)*n + ((x|0)+i+n)%n; B[k] = .9; A[k] = .1; } }}, r);
  g.fillStyle = "#0a0a0d"; g.beginPath(); if(g.roundRect) g.roundRect(bx, by, bw, bh, 12); else g.rect(bx, by, bw, bh); g.fill();
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1.5; g.stroke();
  drawTex(g, tex(n, m, (i,j) => R.B[j*n+i]*3, ramp(c)), sx, sy, sw, sh);
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 7; g.lineCap = "round"; g.beginPath();
  for(let q = 0; q <= 40; q++){ const [x, y] = path(q/40); const X = sx + x/n*sw, Y = sy + y/m*sh; q ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.stroke();
  const [ex, ey] = path(1), EX = sx + ex/n*sw, EY = sy + ey/m*sh; g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.arc(EX, EY, 11, 0, TAU); g.stroke();
  g.fillStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.arc(EX, EY, 11, 0, TAU); g.fill();
  [.35, .62].forEach((v, q) => { const y = sy + sh + bh*.07 + q*bh*.08, x0 = sx + 4, x1 = sx + sw - 4;
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    g.strokeStyle = c; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + (x1 - x0)*v, y); g.stroke();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x0 + (x1 - x0)*v, y, 5, 0, TAU); g.fill(); });
};
C["C01-15"].ratio = 1.2;

// C01-54 WebGL 實驗：瀏覽器視窗、五段色漸層的畫面、右側色階與預設按鈕
C["C01-54"] = function(g, W, H, r, c){
  const tb = 16, vx = 4, vy = tb + 4, vw = W*.8, vh = H - tb - 8, n = 80, m = Math.round(n*vh/vw);
  const R = sim({n, m, f:.022, k:.051, steps:1200}, r);
  g.fillStyle = "#2b2b33"; g.fillRect(0, 0, W, tb); ["#e0625a","#e3b341","#5bbf6a"].forEach((col, q) => { g.fillStyle = col; g.beginPath(); g.arc(8 + q*10, tb/2, 3, 0, TAU); g.fill(); });
  g.fillStyle = "#1a1a20"; g.fillRect(40, 4, W - 50, tb - 8);
  const [R0,G0,B0] = U.rgb(c), stops = [[0,0,0],[40,60,140],[R0,G0,B0],[255,240,200],[255,255,255]];
  const pal = t => { t = cl(t)*4; const k = Math.min(3, t|0); return lerpC(stops[k], stops[k+1], t - k); };
  drawTex(g, tex(n, m, (i,j) => R.B[j*n+i]*2.6, pal), vx, vy, vw, vh);
  const cx = vw + 12, ch = vh*.6; for(let q = 0; q < 50; q++){ g.fillStyle = `rgb(${pal(1 - q/50).map(v => v|0)})`; g.fillRect(cx, vy + 6 + q*ch/50, 10, ch/50 + .5); }
  g.fillStyle = "#fff"; for(let q = 0; q < 5; q++){ const y = vy + 6 + q/4*ch; g.beginPath(); g.moveTo(cx + 12, y); g.lineTo(cx + 18, y - 3); g.lineTo(cx + 18, y + 3); g.closePath(); g.fill(); }
  for(let q = 0; q < 5; q++){ g.fillStyle = q === 2 ? c : "rgba(255,255,255,.2)"; g.fillRect(cx, vy + ch + 18 + q*9, W - cx - 6, 6); }
};
C["C01-54"].ratio = .95;
})();

/* ================================================================
   新增變形（append，不動上面既有畫法）：
   V13 純擴散穩態：多材料熱傳導與冷橋 —— 拿掉反應項，只解穩態熱傳導，
   畫成牆身剖面的連續溫度色階＋等溫線＋熱流箭頭技術圖，和其餘 Gray-Scott
   斑點／條紋卡片在構圖上完全不同。
   V14 守恆型相分離（Cahn–Hilliard）—— 單一守恆濃度場的四階方程演化，
   畫成「粗化後大圖＋淬火初期插圖＋c0 偏移小圖」的左右比例圖，並用比例尺
   量出兩相面積比，呼應「總量固定、只重新分配」。
   ================================================================ */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = Math.PI*2;
const cl = x => x < 0 ? 0 : x > 1 ? 1 : x;
const sm = (a, b, x) => { const t = cl((x-a)/(b-a)); return t*t*(3-2*t); };
const mix = (a, b, t) => a + (b-a)*t;
const lerpC = (p, q, t) => [mix(p[0],q[0],t), mix(p[1],q[1],t), mix(p[2],q[2],t)];
function tex(n, m, val, pal){
  const cv = document.createElement("canvas"); cv.width = n; cv.height = m; const x = cv.getContext("2d"), img = x.createImageData(n, m), d = img.data;
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const p = pal(val(i, j)), k = (j*n+i)*4; d[k] = p[0]; d[k+1] = p[1]; d[k+2] = p[2]; d[k+3] = p[3] ?? 255; }
  x.putImageData(img, 0, 0); return cv;
}
function drawTex(g, cv, x, y, w, h, smooth = true){ g.imageSmoothingEnabled = smooth; g.drawImage(cv, x, y, w, h); }
function segs(g, S, ox, oy, sx, sy){ g.beginPath(); S.forEach(([a,b]) => { g.moveTo(ox + a[0]*sx, oy + a[1]*sy); g.lineTo(ox + b[0]*sx, oy + b[1]*sy); }); g.stroke(); }

ART.var["C01"] = ART.var["C01"] || [];

// V13（索引 12）純擴散穩態：多材料熱傳導與冷橋
// 中段保溫層裡有一段貫穿的懸挑樓板（高導熱），左邊固定室內溫度、右邊固定室外溫度，
// 用 Gauss–Seidel 鬆弛解到穩態；畫出溫度色階、結構材料斜線、等溫線、熱流箭頭，
// 右側量尺比較「有冷橋」與「均勻保溫」兩種做法在同一斷面的熱損失。
ART.var["C01"][12] = function(g, W, H, r, c){
  const px = W*.06, py = H*.08, pw = W*.72, ph = H*.8;
  const n = 74, m = Math.max(28, Math.round(n*ph/pw));
  const K_INS = .045, K_CON = 1.1, K_BR = 1.55;
  const wallL = Math.round(n*.26), wallR = Math.round(n*.68);
  const slabY0 = Math.round(m*(.4 + (r()-.5)*.1)), slabTh = Math.max(2, Math.round(m*.11));
  function conduct(bridge){
    const k = new Float32Array(n*m);
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){
      let kv = (i < wallL || i >= wallR) ? K_CON : K_INS;
      if(bridge && j >= slabY0 && j < slabY0+slabTh) kv = K_BR;
      k[j*n+i] = kv;
    }
    return k;
  }
  function solve(k){
    const T = new Float32Array(n*m), fixed = new Uint8Array(n*m);
    for(let j = 0; j < m; j++){ T[j*n] = 1; fixed[j*n] = 1; T[j*n+n-1] = 0; fixed[j*n+n-1] = 1; }
    for(let j = 0; j < m; j++) for(let i = 1; i < n-1; i++) T[j*n+i] = 1 - i/(n-1);
    for(let it = 0; it < 300; it++){
      for(let j = 0; j < m; j++){ const jn = j ? j-1 : 0, js = j < m-1 ? j+1 : m-1;
        for(let i = 1; i < n-1; i++){ const idx = j*n+i;
          const kW = (k[idx]+k[idx-1])*.5, kE = (k[idx]+k[idx+1])*.5, kN = (k[idx]+k[jn*n+i])*.5, kS = (k[idx]+k[js*n+i])*.5;
          T[idx] = (kW*T[idx-1] + kE*T[idx+1] + kN*T[jn*n+i] + kS*T[js*n+i]) / (kW+kE+kN+kS);
        } }
    }
    return T;
  }
  const kB = conduct(true), TB = solve(kB), kN0 = conduct(false), TN0 = solve(kN0);
  const flux = (T, k) => { let s = 0; for(let j = 0; j < m; j++){ const i = n-2; s += Math.abs(k[j*n+i]*(T[j*n+i-1]-T[j*n+i+1])*.5); } return s; };
  const fB = flux(TB, kB), fN = flux(TN0, kN0);
  // 溫度色階：冷藍 → 家族色 → 暖白
  const [R0,G0,B0] = U.rgb(c), COLD = [46,74,150], WARM = [255,232,190];
  const pal = t => t < .5 ? lerpC(COLD, [R0,G0,B0], t*2) : lerpC([R0,G0,B0], WARM, (t-.5)*2);
  drawTex(g, tex(n, m, (i,j) => TB[j*n+i], pal), px, py, pw, ph);
  // 結構材料（混凝土／冷橋）以斜線陰影標示，保溫層維持素色
  g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
  const cw = pw/n, ch = ph/m;
  g.strokeStyle = "rgba(10,10,14,.45)"; g.lineWidth = 1; g.beginPath();
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ if(kB[j*n+i] < K_CON*.9 || (i+j)%3) continue;
    const x = px+i*cw, y = py+j*ch; g.moveTo(x, y+ch); g.lineTo(x+cw, y); }
  g.stroke();
  // 等溫線
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1;
  [.2,.4,.6,.8].forEach(iso => segs(g, U.contour(n, m, (i,j) => TB[j*n+i], iso), px+cw*.5, py+ch*.5, cw, ch));
  g.restore();
  // 保溫層與冷橋輪廓
  g.strokeStyle = U.rgba(c,.9); g.lineWidth = 2; g.strokeRect(px+wallL*cw, py, (wallR-wallL)*cw, ph);
  g.fillStyle = U.rgba(c,.16); g.fillRect(px+wallL*cw, py+slabY0*ch, (wallR-wallL)*cw, slabTh*ch);
  g.strokeStyle = "#fff"; g.lineWidth = 1.4; g.strokeRect(px+wallL*cw, py+slabY0*ch, (wallR-wallL)*cw, slabTh*ch);
  // 熱流箭頭：沿 -grad T 方向，長度與亮度依大小，在冷橋附近自然變密集
  const gx = 12, gy = Math.max(5, Math.round(gx*ph/pw));
  for(let b = 0; b < gy; b++) for(let a = 0; a < gx; a++){
    const fi = Math.min(n-2, Math.max(1, Math.round((a+.5)/gx*n))), fj = Math.min(m-2, Math.max(1, Math.round((b+.5)/gy*m)));
    const dTx = TB[fj*n+fi+1]-TB[fj*n+fi-1], dTy = TB[(fj+1)*n+fi]-TB[(fj-1)*n+fi], mag = Math.hypot(dTx, dTy);
    if(mag < .003) continue;
    const kx = kB[fj*n+fi], L = Math.min(cw*gx*.4/gx*4, 6 + mag*kx*900), ang = Math.atan2(-dTy, -dTx);
    const x0 = px+(fi+.5)*cw, y0 = py+(fj+.5)*ch, x1 = x0+Math.cos(ang)*L, y1 = y0+Math.sin(ang)*L;
    g.globalAlpha = Math.min(1, .3 + mag*kx*30); g.strokeStyle = "#fff"; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1-Math.cos(ang-.45)*3.4, y1-Math.sin(ang-.45)*3.4); g.lineTo(x1-Math.cos(ang+.45)*3.4, y1-Math.sin(ang+.45)*3.4); g.closePath(); g.fill();
  }
  g.globalAlpha = 1;
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.4; g.strokeRect(px, py, pw, ph);
  // 右側量尺：有冷橋 vs 均勻保溫的熱損失比較（圖形量尺，不寫文字）
  const bx = px+pw+W*.04, bw = W*.055, gap = W*.02, maxF = Math.max(fB, fN)*1.15, bh = ph*.7, by0 = py+ph-bh;
  [[fN, "rgba(255,255,255,.55)"], [fB, U.rgba(c,.95)]].forEach(([f, col], q) => {
    const hh = bh*Math.min(1, f/maxF), xx = bx + q*(bw+gap);
    g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.strokeRect(xx, by0, bw, bh);
    g.fillStyle = col; g.fillRect(xx, by0+bh-hh, bw, hh);
  });
};

// V14（索引 13）守恆型相分離（Cahn–Hilliard）
// 單一濃度場 c 依四階方程演化（mu = c³−c−κ∇²c，∂c/∂t = ∇²mu），週期邊界下總量
// 精確守恆：左邊大圖是 c0=0 粗化後的雙連續迷宮（附淬火初期小插圖與指向箭頭），
// 右邊小圖是 c0 偏移後的圓斑形態；兩張圖下方各有一條比例尺，直接量出兩相面積比
// 都等於各自的 c0，呼應「總量固定、只重新分配」。
ART.var["C01"][13] = function(g, W, H, r, c){
  function chField(n, m, c0, steps, rr){
    const N = n*m, XP = new Int32Array(n), XM = new Int32Array(n), YP = new Int32Array(m), YM = new Int32Array(m);
    for(let x = 0; x < n; x++){ XP[x] = (x+1)%n; XM[x] = (x+n-1)%n; }
    for(let y = 0; y < m; y++){ YP[y] = (y+1)%m; YM[y] = (y+m-1)%m; }
    let cA = new Float32Array(N), cB = new Float32Array(N); const mu = new Float32Array(N);
    for(let i = 0; i < N; i++) cA[i] = c0 + .08*(rr()-.5);
    const kappa = 1.3, dt = .013;
    for(let it = 0; it < steps; it++){
      for(let y = 0; y < m; y++){ const yc = y*n, yu = YM[y]*n, yd = YP[y]*n;
        for(let x = 0; x < n; x++){ const i = yc+x, xl = XM[x], xr = XP[x], cc = cA[i];
          const lap = cA[yc+xl]+cA[yc+xr]+cA[yu+x]+cA[yd+x]-4*cc;
          mu[i] = cc*cc*cc - cc - kappa*lap; } }
      for(let y = 0; y < m; y++){ const yc = y*n, yu = YM[y]*n, yd = YP[y]*n;
        for(let x = 0; x < n; x++){ const i = yc+x, xl = XM[x], xr = XP[x];
          const lapMu = mu[yc+xl]+mu[yc+xr]+mu[yu+x]+mu[yd+x]-4*mu[i];
          const nv = cA[i] + dt*lapMu; cB[i] = nv < -1.4 ? -1.4 : nv > 1.4 ? 1.4 : nv; } }
      const t = cA; cA = cB; cB = t;
    }
    return cA;
  }
  const n1 = 48, m1 = 48, late = chField(n1, m1, 0, 1700, r);
  const n0 = 30, m0 = 30, early = chField(n0, m0, 0, 200, r);
  const c0d = .26 + r()*.16, n2 = 40, m2 = 40, drop = chField(n2, m2, c0d, 4000, r);
  const [R0,G0,B0] = U.rgb(c), phaseA = [26,26,32], phaseB = lerpC([R0,G0,B0], [255,248,236], .35);
  // 相邊界固定在 0（守恆物理上兩相就是以 c=0 為界分裂成 +1／−1），
  // 但平滑帶寬依各自場的標準差調整，讓不同粗化程度的圖都清楚可讀
  function paintOf(arr){
    let s = 0; for(let i = 0; i < arr.length; i++) s += arr[i];
    const mean = s/arr.length; let v2 = 0; for(let i = 0; i < arr.length; i++){ const d = arr[i]-mean; v2 += d*d; }
    const w = Math.max(.02, Math.sqrt(v2/arr.length)*.6);
    return t => lerpC(phaseA, phaseB, sm(-w, w, t));
  }
  const paintLate = paintOf(late), paintEarly = paintOf(early), paintDrop = paintOf(drop);
  // 主圖：c0=0 粗化後的雙連續迷宮
  const pad = W*.06, mw = W*.56, mh0 = Math.min(mw, H*.72), mw2 = mh0, mh = mh0;
  const mx = pad, my = (H*.86 - mh)/2 + H*.02;
  g.fillStyle = "#0b0b0e"; g.fillRect(mx-4, my-4, mw2+8, mh+8);
  drawTex(g, tex(n1, m1, (i,j) => late[j*n1+i], paintLate), mx, my, mw2, mh);
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(mx, my, mw2, mh);
  // 左上角小插圖：淬火初期的細碎雜訊態，虛線箭頭指向主圖，暗示隨步數粗化
  const iw = mw2*.3, ih = iw, ix = mx+8, iy = my+8;
  g.fillStyle = "#0b0b0e"; g.fillRect(ix-3, iy-3, iw+6, ih+6);
  drawTex(g, tex(n0, m0, (i,j) => early[j*n0+i], paintEarly), ix, iy, iw, ih);
  g.strokeStyle = "#fff"; g.lineWidth = 1; g.strokeRect(ix, iy, iw, ih);
  const ax = mx+mw2*.42, ay = my+mh*.3;
  g.setLineDash([3,3]); g.strokeStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.moveTo(ix+iw+4, iy+ih/2); g.lineTo(ax, ay); g.stroke(); g.setLineDash([]);
  const aa = Math.atan2(ay-(iy+ih/2), ax-(ix+iw+4));
  g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax-Math.cos(aa-.4)*7, ay-Math.sin(aa-.4)*7); g.lineTo(ax-Math.cos(aa+.4)*7, ay-Math.sin(aa+.4)*7); g.closePath(); g.fill();
  // 主圖下方比例尺：實測兩相面積比
  let cntB = 0; for(let i = 0; i < late.length; i++) if(late[i] > 0) cntB++;
  const fracB1 = cntB/late.length, gy0 = my+mh+H*.035, gh0 = H*.045;
  g.fillStyle = `rgb(${phaseA.map(v=>v|0)})`; g.fillRect(mx, gy0, mw2, gh0);
  g.fillStyle = `rgb(${phaseB.map(v=>v|0)})`; g.fillRect(mx, gy0, mw2*fracB1, gh0);
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.strokeRect(mx, gy0, mw2, gh0);
  g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(mx+mw2*.5, gy0-3); g.lineTo(mx+mw2*.5, gy0+gh0+3); g.stroke();
  // 右側小圖：c0 偏移後的圓斑形態，兩相面積比不再是一半
  const sx0 = mx+mw2+W*.06, swAvail = Math.max(W*.2, W*.94-sx0), smh = Math.min(swAvail, mh), smw = smh;
  const sy0 = my + (mh-smh)/2;
  g.fillStyle = "#0b0b0e"; g.fillRect(sx0-4, sy0-4, smw+8, smh+8);
  drawTex(g, tex(n2, m2, (i,j) => drop[j*n2+i], paintDrop), sx0, sy0, smw, smh);
  g.strokeStyle = U.rgba(c,.85); g.lineWidth = 1.4; g.strokeRect(sx0, sy0, smw, smh);
  let cntB2 = 0; for(let i = 0; i < drop.length; i++) if(drop[i] > 0) cntB2++;
  const fracB2 = cntB2/drop.length, gy1 = sy0+smh+H*.035;
  g.fillStyle = `rgb(${phaseA.map(v=>v|0)})`; g.fillRect(sx0, gy1, smw, gh0);
  g.fillStyle = `rgb(${phaseB.map(v=>v|0)})`; g.fillRect(sx0, gy1, smw*fracB2, gh0);
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.strokeRect(sx0, gy1, smw, gh0);
};
})();
