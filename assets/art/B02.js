/* B02 擴散限制聚集（DLA）：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = Math.PI * 2;

/* ---------------- 共用核心 ---------------- */
// 2D 格點 DLA：回傳黏住的點 {x,y,p(父點索引),g(群組)}，父點索引一定比自己小
// o: n,m 格數；seeds [[x,y,群組]]；N 目標顆數；launch() 自訂出發點（沒給就用圓周出發）
//    cx,cy 圓周中心；arc [a0,a1] 出發角度範圍；bias 偏移機率；bx,by 固定偏移；drift(x,y)→[dx,dy] 動態偏移
//    stick(x,y)→黏著機率；inside(x,y)→是否可走；onStick(x,y)；wrapX 左右循環；budget 總步數上限
function dla(r, o){
  const n = o.n, m = o.m || o.n, G = new Int32Array(n*m), P = [];
  const add = (x,y,p,gp) => { G[y*n+x] = P.length + 1; P.push({x, y, p, g:gp}); if(o.onStick) o.onStick(x,y); };
  o.seeds.forEach(s => { if(!G[s[1]*n+s[0]]) add(s[0], s[1], -1, s[2] || 0); });
  const cx = o.cx ?? n/2, cy = o.cy ?? m/2, radial = !o.launch, inside = o.inside || (() => true);
  const a0 = o.arc ? o.arc[0] : 0, a1 = o.arc ? o.arc[1] : TAU;
  let rad = 2; if(radial) for(const q of P) rad = Math.max(rad, Math.hypot(q.x-cx, q.y-cy));
  const bias = o.bias || 0, stick = o.stick, maxSteps = o.maxSteps || 4000, maxRad = o.maxRad || n*.46;
  const DX = [1,-1,0,0], DY = [0,0,1,-1];
  let budget = o.budget || 1500000;
  while(P.length < o.N && budget > 0){
    let x, y; budget--;
    if(radial){ const a = a0 + r()*(a1-a0), R = rad + 4; x = Math.round(cx + Math.cos(a)*R); y = Math.round(cy + Math.sin(a)*R); }
    else [x, y] = o.launch();
    if(x < 1 || y < 1 || x > n-2 || y > m-2 || G[y*n+x] || !inside(x,y)) continue;
    const kill = rad + Math.max(12, rad*.6);
    for(let st = 0; st < maxSteps; st++){
      budget--;
      let nx, ny;
      if(bias && r() < bias){ if(o.drift){ const d = o.drift(x,y); nx = x + d[0]; ny = y + d[1]; } else { nx = x + o.bx; ny = y + o.by; } }
      else { const d = (r()*4) | 0; nx = x + DX[d]; ny = y + DY[d]; }
      if(o.wrapX){ if(nx < 1) nx = n-2; else if(nx > n-2) nx = 1; }
      if(nx < 1 || ny < 1 || nx > n-2 || ny > m-2) break;
      if(G[ny*n+nx] || !inside(nx,ny)) continue;
      x = nx; y = ny;
      if(radial && Math.hypot(x-cx, y-cy) > kill) break;
      const i = y*n + x, k = G[i-1] || G[i+1] || G[i-n] || G[i+n];
      if(k){
        if(stick && r() > stick(x,y)) continue;
        add(x, y, k-1, P[k-1].g);
        if(radial) rad = Math.max(rad, Math.hypot(x-cx, y-cy));
        break;
      }
    }
    if(radial && rad > maxRad) break;
  }
  return P;
}
// 3D 格點 DLA（6 鄰居）：回傳 {x,y,z,p,g}，y 軸朝上
function dla3(r, o){
  const n = o.n, n2 = n*n, G = new Int32Array(n*n*n), P = [], id = (x,y,z) => (z*n + y)*n + x;
  const add = (x,y,z,p,gp) => { G[id(x,y,z)] = P.length + 1; P.push({x, y, z, p, g:gp}); if(o.onStick) o.onStick(x,y,z); };
  o.seeds.forEach(s => { if(!G[id(s[0],s[1],s[2])]) add(s[0], s[1], s[2], -1, s[3] || 0); });
  const c = o.c || [n/2, n/2, n/2], radial = !o.launch, inside = o.inside || (() => true), bias = o.bias || 0, b = o.b;
  let rad = 2; if(radial) for(const q of P) rad = Math.max(rad, Math.hypot(q.x-c[0], q.y-c[1], q.z-c[2]));
  const D = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], maxSteps = o.maxSteps || 3000, maxRad = o.maxRad || n*.44;
  let budget = o.budget || 1500000;
  while(P.length < o.N && budget > 0){
    let x, y, z; budget--;
    if(radial){ const u = r()*2 - 1, a = r()*TAU, s = Math.sqrt(1 - u*u), R = rad + 3; x = Math.round(c[0] + s*Math.cos(a)*R); y = Math.round(c[1] + u*R); z = Math.round(c[2] + s*Math.sin(a)*R); }
    else [x, y, z] = o.launch();
    if(x < 1 || y < 1 || z < 1 || x > n-2 || y > n-2 || z > n-2 || G[id(x,y,z)] || !inside(x,y,z)) continue;
    const kill = rad + Math.max(8, rad*.5);
    for(let st = 0; st < maxSteps; st++){
      budget--;
      const d = (bias && r() < bias) ? b : D[(r()*6) | 0], nx = x + d[0], ny = y + d[1], nz = z + d[2];
      if(nx < 1 || ny < 1 || nz < 1 || nx > n-2 || ny > n-2 || nz > n-2) break;
      if(G[id(nx,ny,nz)] || !inside(nx,ny,nz)) continue;
      x = nx; y = ny; z = nz;
      if(radial && Math.hypot(x-c[0], y-c[1], z-c[2]) > kill) break;
      const i = id(x,y,z), k = G[i-1] || G[i+1] || G[i-n] || G[i+n] || G[i-n2] || G[i+n2];
      if(k){ add(x, y, z, k-1, P[k-1].g); if(radial) rad = Math.max(rad, Math.hypot(x-c[0], y-c[1], z-c[2])); break; }
    }
    if(radial && rad > maxRad) break;
  }
  return P;
}
// 介電崩潰模型（DBM）：Laplace 電位場，依 φ^η 機率選黏著位置
// o: n,m；seeds [[x,y]]；fix(x,y)→固定電位（-1 表示自由）；eta；steps；iters
function dbm(r, o){
  const n = o.n, m = o.m, N = n*m, C = new Int32Array(N), FV = new Float32Array(N), phi = new Float32Array(N), P = [];
  for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){ const i = y*n + x, f = o.fix(x,y); FV[i] = f; phi[i] = f >= 0 ? f : .5; }
  const add = (x,y,p) => { const i = y*n + x; C[i] = P.length + 1; phi[i] = 0; P.push({x, y, p, g:0}); };
  o.seeds.forEach(s => add(s[0], s[1], -1));
  const relax = k => { for(let it = 0; it < k; it++) for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){
    const i = y*n + x; if(C[i] || FV[i] >= 0) continue;
    const v = (phi[x > 0 ? i-1 : i+1] + phi[x < n-1 ? i+1 : i-1] + phi[y > 0 ? i-n : i+n] + phi[y < m-1 ? i+n : i-n]) / 4;
    phi[i] += 1.7*(v - phi[i]); } };
  relax(o.init || 60);
  const cand = new Int32Array(N), wt = new Float32Array(N);
  for(let s = 0; s < o.steps; s++){
    let k = 0, tot = 0;
    for(let y = 1; y < m-1; y++) for(let x = 1; x < n-1; x++){
      const i = y*n + x; if(C[i] || FV[i] >= 0) continue;
      if(C[i-1] || C[i+1] || C[i-n] || C[i+n]){ const w = Math.pow(Math.max(0, phi[i]), o.eta); cand[k] = i; wt[k] = w; tot += w; k++; }
    }
    if(!k || tot <= 0) break;
    let t = r()*tot, j = 0; while(j < k-1 && (t -= wt[j]) > 0) j++;
    const i = cand[j], x = i % n, y = (i/n) | 0, par = (C[i-1] || C[i+1] || C[i-n] || C[i+n]) - 1;
    add(x, y, par);
    if(o.stop && o.stop(x,y)) break;
    relax(o.iters || 4);
  }
  return {P, phi};
}
// 子孫數（從葉往根累加），決定管徑或線寬
function desc(P){ const d = new Float32Array(P.length).fill(1); for(let i = P.length-1; i >= 0; i--) if(P[i].p >= 0) d[P[i].p] += d[i]; return d; }
// 依父子關係畫線：f(點)→[X,Y]；w(i)→線寬；col(i)→顏色
function tree(g, P, f, w, col){
  g.lineCap = "round";
  for(let i = 0; i < P.length; i++){ const q = P[i]; if(q.p < 0) continue; const a = f(P[q.p]), b = f(q);
    g.strokeStyle = col(i); g.lineWidth = w(i); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
}
const C30 = Math.cos(Math.PI/6), S30 = .5;
const iso = (x,y,z) => [(x - z)*C30, (x + z)*S30 - y];
const ACC = "#F2A007";
const mix = (h1, h2, t) => { const a = U.rgb(h1), b = U.rgb(h2); return `rgb(${a.map((v,i) => Math.round(v + (b[i]-v)*t)).join(",")})`; };

ART.var["B02"] = [
  // V01 黏著機率：三格並排，stickiness 1 → 0.25 → 0.05，下方畫滑桿刻度
  function(g, W, H, r, c, U){
    const S = [1, .25, .05], pw = W/3, n = 44, s = (pw - 10)/n, top = (H - n*s)/2 - 10;
    S.forEach((st, k) => {
      const P = dla(r, {n, seeds:[[22,22]], N:300, stick:() => st, maxRad:20, budget:500000}), ox = k*pw + 5;
      g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; g.strokeRect(ox, top, n*s, n*s);
      P.forEach((q, i) => { g.fillStyle = i === 0 ? "#fff" : U.rgba(c, .45 + .55*(1 - i/P.length)); g.fillRect(ox + q.x*s, top + q.y*s, s*.95, s*.95); });
      const sy = top + n*s + 14, x0 = ox + 6, x1 = ox + n*s - 6;
      g.strokeStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.moveTo(x0, sy); g.lineTo(x1, sy); g.stroke();
      g.strokeStyle = U.rgba(c,.9); g.lineWidth = 2.5; g.beginPath(); g.moveTo(x0, sy); g.lineTo(x0 + (x1-x0)*st, sy); g.stroke();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(x0 + (x1-x0)*st, sy, 3.5, 0, TAU); g.fill();
    });
  },
  // V02 方向偏移：從天花板往下垂的鐘乳石，粒子由下往上漂
  function(g, W, H, r, c, U){
    const n = 90, m = Math.round(n*H/W), s = W/n; let front = 2;
    const seeds = []; for(let x = 1; x < n-1; x++) seeds.push([x, 1]);
    const P = dla(r, {n, m, seeds, N:2100, launch:() => [1 + ((r()*(n-2)) | 0), Math.min(m-2, front + 6)], bias:.22, bx:0, by:-1, wrapX:true, onStick:(x,y) => { front = Math.max(front, y); }, budget:900000});
    const d = desc(P);
    g.fillStyle = "#2A2A33"; g.fillRect(0, 0, W, s*2.2);
    g.strokeStyle = "rgba(255,255,255,.12)"; for(let x = -20; x < W; x += 8){ g.beginPath(); g.moveTo(x, s*2.2); g.lineTo(x + 10, 0); g.stroke(); }
    tree(g, P, q => [(q.x + .5)*s, (q.y + .5)*s], i => Math.min(s*2.4, s*(.45 + Math.sqrt(d[i])*.18)), i => mix(c, "#E2F2E4", Math.min(1, P[i].y/front)));
    g.fillStyle = "rgba(226,242,228,.75)";
    for(let i = 0; i < P.length; i++) if(d[i] === 1 && P[i].y > front*.8 && r() < .25){ const x = (P[i].x + .5)*s, y = (P[i].y + 1.6)*s + r()*s*4; g.beginPath(); g.arc(x, y, 1.4, 0, TAU); g.fill(); }
  },
  // V03 線種子：左側牆面曲線 DivideByCount 放種子，霜花往右長
  function(g, W, H, r, c, U){
    const n = 90, m = Math.round(n*H/W), s = W/n, cx = y => 7 + 4*Math.sin(y/m*TAU*1.2 + .6);
    const seeds = []; for(let k = 0; k < 18; k++){ const y = Math.round(2 + (m-5)*k/17); seeds.push([Math.round(cx(y)), y]); }
    let front = 12;
    const P = dla(r, {n, m, seeds, N:1000, launch:() => [Math.min(n-2, front + 6), 1 + ((r()*(m-2)) | 0)], bias:.15, bx:-1, by:0, inside:(x,y) => x > cx(y), onStick:x => { front = Math.max(front, x); }, budget:900000});
    g.fillStyle = "#26262F"; g.beginPath(); g.moveTo(0,0); for(let y = 0; y <= m; y++) g.lineTo(cx(y)*s, y*s); g.lineTo(0, H); g.fill();
    g.strokeStyle = "rgba(255,255,255,.1)"; for(let y = -W; y < H; y += 7){ g.beginPath(); g.moveTo(0, y + 14); g.lineTo(14*s, y); g.stroke(); }
    tree(g, P, q => [(q.x + .5)*s, (q.y + .5)*s], () => s*.55, i => U.rgba("#E2F2E4", .35 + .6*(1 - i/P.length)));
    g.strokeStyle = "#fff"; g.lineWidth = 2; g.beginPath(); for(let y = 0; y <= m; y++) y ? g.lineTo(cx(y)*s + s*.5, y*s) : g.moveTo(cx(y)*s + s*.5, 0); g.stroke();
    g.fillStyle = ACC; seeds.forEach(([x,y]) => { g.beginPath(); g.arc((x + .5)*s, (y + .5)*s, 3, 0, TAU); g.fill(); });
  },
  // V04 2D → 3D：球殼出發的立體珊瑚群集（等角球體渲染＋出發球殼線框）
  function(g, W, H, r, c, U){
    const n = 48, P = dla3(r, {n, seeds:[[24,24,24]], N:1100, budget:1100000});
    const S = Math.min(W,H)*.9/(n*1.25), cx = W/2, cy = H/2 + S*4;
    const pr = q => { const [a,b] = iso(q.x - 24, q.y - 24, q.z - 24); return [cx + a*S, cy + b*S]; };
    let R = 0; P.forEach(q => R = Math.max(R, Math.hypot(q.x-24, q.y-24, q.z-24)));
    g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 1; g.setLineDash([3,4]);
    const o = pr({x:24, y:24, z:24}); g.beginPath(); g.arc(o[0], o[1], (R + 3)*S, 0, TAU); g.stroke();
    g.beginPath(); g.ellipse(o[0], o[1], (R + 3)*S, (R + 3)*S*.5, 0, 0, TAU); g.stroke(); g.setLineDash([]);
    const idx = P.map((q,i) => i).sort((a,b) => (P[a].x + P[a].z - P[a].y*.01) - (P[b].x + P[b].z - P[b].y*.01));
    for(const i of idx){ const q = P[i], [x,y] = pr(q), t = (q.x + q.z - 24)/(n*1.1) + .5;
      g.fillStyle = mix("#12361A", c, Math.max(0, Math.min(1, t))); g.beginPath(); g.arc(x, y, S*.75, 0, TAU); g.fill();
      g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.arc(x - S*.22, y - S*.25, S*.25, 0, TAU); g.fill(); }
  },
  // V05 曲面上的 DLA：UV 平面生長，貼到拱殼曲面（左上角附 UV 平面小圖）
  function(g, W, H, r, c, U){
    const n = 80, P = dla(r, {n, seeds:[[40,40]], N:1700, maxRad:38, budget:1400000});
    const yaw = .65, pit = .5, S = Math.min(W,H)*.38, cx = W/2, cy = H*.58;
    const surf = (u,v) => { const X = (u - .5)*2.2, Z = (v - .5)*2.2, Y = .75*Math.cos((u - .5)*Math.PI*.95) - .15*Math.pow((v - .5)*2, 2);
      const x1 = X*Math.cos(yaw) - Z*Math.sin(yaw), z1 = X*Math.sin(yaw) + Z*Math.cos(yaw), y2 = Y*Math.cos(pit) - z1*Math.sin(pit);
      return [cx + x1*S, cy - y2*S]; };
    const K = 14;
    for(let j = 0; j < K; j++) for(let i = 0; i < K; i++){ const p = [surf(i/K,j/K), surf((i+1)/K,j/K), surf((i+1)/K,(j+1)/K), surf(i/K,(j+1)/K)];
      g.fillStyle = `rgba(255,255,255,${.03 + .05*Math.cos((i/K - .5)*3)})`; U.poly(g, p, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.09)"; g.lineWidth = .7; g.stroke(); }
    const d = desc(P);
    tree(g, P, q => surf(q.x/n, q.y/n), i => Math.min(4, 1.1 + Math.sqrt(d[i])*.2), () => c);
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.2; const e = []; for(let k = 0; k <= 20; k++) e.push(surf(k/20, 0)); for(let k = 0; k <= 20; k++) e.push(surf(1, k/20)); for(let k = 20; k >= 0; k--) e.push(surf(k/20, 1)); for(let k = 20; k >= 0; k--) e.push(surf(0, k/20)); U.poly(g, e, true); g.stroke();
    const iw = W*.26, ix = 8, iy = 8, is = iw/n;
    g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(ix, iy, iw, iw); g.strokeStyle = "rgba(255,255,255,.35)"; g.strokeRect(ix, iy, iw, iw);
    g.fillStyle = U.rgba(c, .9); P.forEach(q => g.fillRect(ix + q.x*is, iy + q.y*is, is + .3, is + .3));
  },
  // V06 邊界約束：種子在輪廓上，粒子在輪廓內走，枝條往內填滿
  function(g, W, H, r, c, U){
    const n = 90, m = Math.round(n*H/W), s = W/n, cx = n/2, cy = m/2, ph = r()*TAU;
    const rad = a => Math.min(n, m)*(.4 + .07*Math.sin(3*a + ph) + .04*Math.sin(5*a + 1));
    const inside = (x,y) => Math.hypot(x-cx, y-cy) < rad(Math.atan2(y-cy, x-cx));
    const seeds = []; for(let k = 0; k < 16; k++){ const a = k/16*TAU, R = rad(a) - 1.5; seeds.push([Math.round(cx + Math.cos(a)*R), Math.round(cy + Math.sin(a)*R)]); }
    const P = dla(r, {n, m, seeds, N:950, inside, launch:() => [(cx + (r() - .5)*n*.9) | 0, (cy + (r() - .5)*m*.9) | 0], budget:900000});
    const out = []; for(let k = 0; k <= 120; k++){ const a = k/120*TAU, R = rad(a); out.push([(cx + Math.cos(a)*R)*s, (cy + Math.sin(a)*R)*s]); }
    g.fillStyle = "rgba(255,255,255,.04)"; U.poly(g, out, true); g.fill();
    const d = desc(P);
    tree(g, P, q => [(q.x + .5)*s, (q.y + .5)*s], i => Math.min(3.5, .8 + Math.sqrt(d[i])*.2), i => U.rgba(c, .5 + .5*Math.min(1, d[i]/6)));
    g.strokeStyle = "#fff"; g.lineWidth = 1.8; U.poly(g, out, true); g.stroke();
    const out2 = []; for(let k = 0; k <= 120; k++){ const a = k/120*TAU, R = rad(a) + 3; out2.push([(cx + Math.cos(a)*R)*s, (cy + Math.sin(a)*R)*s]); }
    g.setLineDash([4,4]); g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; U.poly(g, out2, true); g.stroke(); g.setLineDash([]);
    g.fillStyle = ACC; seeds.forEach(([x,y]) => { g.beginPath(); g.arc((x + .5)*s, (y + .5)*s, 2.6, 0, TAU); g.fill(); });
  },
  // V07 吸引子控制黏著：離吸引點越近越黏，枝條朝光暈集中
  function(g, W, H, r, c, U){
    const n = 90, m = Math.round(n*H/W), s = W/n, sx = n/2, sy = m - 3;
    const A = [[n*(.15 + r()*.15), m*(.12 + r()*.15)], [n*(.7 + r()*.15), m*(.15 + r()*.15)], [n*(.35 + r()*.3), m*(.35 + r()*.1)]];
    const stick = (x,y) => { let b = 1e9; A.forEach(a => b = Math.min(b, Math.hypot(x-a[0], y-a[1]))); return .04 + .96*Math.exp(-Math.pow(b/(n*.28), 2)); };
    const P = dla(r, {n, m, seeds:[[sx|0, sy]], cx:sx, cy:sy, arc:[Math.PI, TAU], N:900, stick, maxRad:m*.95, budget:1300000});
    A.forEach(([x,y]) => { const X = x*s, Y = y*s, gr = g.createRadialGradient(X, Y, 0, X, Y, n*s*.2);
      gr.addColorStop(0, "rgba(242,160,7,.55)"); gr.addColorStop(1, "rgba(242,160,7,0)"); g.fillStyle = gr; g.fillRect(X - n*s*.2, Y - n*s*.2, n*s*.4, n*s*.4); });
    g.strokeStyle = "rgba(242,160,7,.35)"; g.setLineDash([2,4]); A.forEach(([x,y]) => { g.beginPath(); g.arc(x*s, y*s, n*s*.1, 0, TAU); g.stroke(); }); g.setLineDash([]);
    const d = desc(P);
    tree(g, P, q => [(q.x + .5)*s, (q.y + .5)*s], i => Math.min(4, .8 + Math.sqrt(d[i])*.2), () => c);
    g.fillStyle = "#fff"; A.forEach(([x,y]) => { g.beginPath(); g.arc(x*s, y*s, 3.5, 0, TAU); g.fill(); });
    g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(0, (sy + 1)*s, W, H);
  },
  // V08 影像控制密度：灰階肖像（頭、頸、肩）決定黏著機率，種子撒在暗部，枝在暗部密、亮部疏
  function(g, W, H, r, c, U){
    const n = 110, m = Math.round(n*H/W), s = W/n;
    // 灰階影像：0 亮、1 暗；頭部橢圓＋頸＋寬肩，臉部略亮做出層次
    const dark = (u,v) => {
      const head = 1 - Math.hypot((u - .5)/.17, (v - .34)/.2);
      const neck = (Math.abs(u - .5) < .08 && v > .45 && v < .66) ? .6 : 0;
      const sh = 1 - Math.hypot((u - .5)/.46, (v - 1.05)/.34);
      const face = 1 - Math.hypot((u - .53)/.09, (v - .36)/.12);
      let d = Math.max(head*3, neck, sh*2.2); d = Math.min(1, Math.max(0, d)); if(face > 0) d -= Math.min(.45, face*1.2);
      return Math.max(0, d); };
    const seeds = []; let t = 0;
    while(seeds.length < 14 && t++ < 4000){ const x = 3 + ((r()*(n-6)) | 0), y = 3 + ((r()*(m-6)) | 0); if(dark(x/n, y/m) > .85) seeds.push([x, y]); }
    const P = dla(r, {n, m, seeds, N:2700, launch:() => [1 + ((r()*(n-2)) | 0), 1 + ((r()*(m-2)) | 0)], stick:(x,y) => .015 + .985*Math.pow(dark(x/n, y/m), 2.2), maxSteps:1200, budget:1500000});
    const d = desc(P);
    tree(g, P, q => [(q.x + .5)*s, (q.y + .5)*s], i => Math.min(s*1.6, s*(.35 + Math.sqrt(d[i])*.12)), i => U.rgba("#E2F2E4", .3 + .7*dark(P[i].x/n, P[i].y/m)));
    const iw = W*.22, ih = iw*m/n, ix = W - iw - 8, iy = 8, img = g.createImageData(40, Math.round(40*m/n));
    for(let j = 0; j < img.height; j++) for(let i = 0; i < 40; i++){ const v = 235 - 210*dark(i/40, j/img.height), k = (j*40 + i)*4; img.data[k] = img.data[k+1] = img.data[k+2] = v; img.data[k+3] = 255; }
    const off = document.createElement("canvas"); off.width = 40; off.height = img.height; off.getContext("2d").putImageData(img, 0, 0);
    g.drawImage(off, ix, iy, iw, ih); g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1.5; g.strokeRect(ix, iy, iw, ih);
    g.strokeStyle = U.rgba(c, .5); g.setLineDash([3,3]); g.beginPath(); g.moveTo(ix, iy + ih); g.lineTo(ix - 18, iy + ih + 18); g.stroke(); g.setLineDash([]);
  },
  // V09 多種子競爭：六棵樹搶空間，依群組上色，界線留空隙
  function(g, W, H, r, c, U){
    const n = 90, m = Math.round(n*H/W), s = W/n, cols = [c, ACC, "#2F6FE4", "#E4572E", "#E2F2E4", "#9B5DE5"];
    const seeds = []; for(let k = 0; k < 6; k++) seeds.push([8 + ((r()*(n-16)) | 0), 8 + ((r()*(m-16)) | 0), k]);
    const P = dla(r, {n, m, seeds, N:1300, launch:() => [1 + ((r()*(n-2)) | 0), 1 + ((r()*(m-2)) | 0)], maxSteps:2500, budget:1600000});
    P.forEach(q => { g.fillStyle = cols[q.g]; g.fillRect(q.x*s, q.y*s, s*.9, s*.9); });
    seeds.forEach(([x,y,k]) => { g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.arc((x + .5)*s, (y + .5)*s, s*2.6, 0, TAU); g.stroke(); });
  },
  // V10 輸出成可製造管材：根粗梢細的管件，做成吊燈
  function(g, W, H, r, c, U){
    const n = 80, P = dla(r, {n, seeds:[[40,40]], N:800, maxRad:36, budget:900000}), d = desc(P);
    const S = Math.min(W, H*.8)*.95/n, cx = W/2, cy = H*.58, f = q => [cx + (q.x - 40)*S, cy + (q.y - 40)*S];
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, n*S*.5); gr.addColorStop(0, "rgba(255,210,120,.35)"); gr.addColorStop(1, "rgba(255,210,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = "#3A3A44"; g.fillRect(cx - 14, 0, 28, 5); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, 5); g.lineTo(cx, cy - 4); g.stroke();
    const w = i => Math.min(S*4, S*(.7 + Math.sqrt(d[i])*.35));
    tree(g, P, f, i => w(i) + 2, () => "#0E2A13");
    tree(g, P, f, w, () => c);
    g.save(); g.translate(-S*.25, -S*.25); tree(g, P, f, i => w(i)*.35, () => "rgba(255,255,255,.4)"); g.restore();
    g.fillStyle = "#FFE7B0"; g.beginPath(); g.arc(cx, cy, S*1.5, 0, TAU); g.fill();
  },
  // V11 動畫化逐步生長：2×2 影格＋時間軸
  function(g, W, H, r, c, U){
    const n = 64, P = dla(r, {n, seeds:[[32,32]], N:800, maxRad:29, budget:900000}), fr = [.08, .25, .55, 1];
    const pad = 8, bh = 22, cw = (W - pad*3)/2, ch = (H - bh - pad*3)/2, sz = Math.min(cw, ch), s = sz/n;
    fr.forEach((t, k) => { const ox = pad + (k%2)*(cw + pad) + (cw - sz)/2, oy = pad + ((k/2) | 0)*(ch + pad) + (ch - sz)/2, K = Math.max(2, Math.round(P.length*t));
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(ox, oy, sz, sz); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(ox, oy, sz, sz);
      for(let i = 0; i < K; i++){ g.fillStyle = i > K*.85 && k < 3 ? "#fff" : U.rgba(c, .9); g.fillRect(ox + P[i].x*s, oy + P[i].y*s, s + .2, s + .2); }
      g.fillStyle = "rgba(255,255,255,.5)"; for(let j = 0; j <= k; j++) g.fillRect(ox + 4 + j*5, oy + 4, 3, 3); });
    const ty = H - bh/2 - 4, x0 = 24, x1 = W - 10;
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(8, ty - 5); g.lineTo(16, ty); g.lineTo(8, ty + 5); g.fill();
    g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, ty); g.lineTo(x1, ty); g.stroke();
    g.strokeStyle = c; g.beginPath(); g.moveTo(x0, ty); g.lineTo(x0 + (x1-x0)*.72, ty); g.stroke();
    g.fillStyle = "rgba(255,255,255,.6)"; fr.forEach(t => g.fillRect(x0 + (x1-x0)*t - 1, ty - 6, 2, 12));
  },
  // V12 場驅動 DLA（DBM）：電位場色階底圖＋閃電狀分枝
  function(g, W, H, r, c, U){
    const n = 60, m = Math.round(n*H/W), s = W/n;
    const {P, phi} = dbm(r, {n, m, seeds:[[n/2 | 0, 1]], fix:(x,y) => y === m-1 ? 1 : -1, eta:1.6, steps:420, iters:4, stop:(x,y) => y >= m-3});
    U.field(g, W, H, n, m, (i,j) => phi[j*n + i]*.55, c, 1.3);
    const d = desc(P), f = q => [(q.x + .5)*s, (q.y + .5)*s];
    tree(g, P, f, i => Math.min(7, 2 + Math.sqrt(d[i])*.5), () => "rgba(242,160,7,.35)");
    tree(g, P, f, i => Math.min(3, .8 + Math.sqrt(d[i])*.2), () => "#FFF6DD");
    g.fillStyle = "#fff"; g.fillRect(0, H - s, W, s);
    g.fillStyle = ACC; g.beginPath(); g.arc(f(P[0])[0], f(P[0])[1], 4, 0, TAU); g.fill();
  },
];

/* ---------------- 無照片案例 ---------------- */
// B02-01 Andy Lomas Aggregation：種子環上沉積的白色珊瑚雕塑，立於展台，投射燈
ART.case["B02-01"] = function(g, W, H, r, c, U){
  const n = 52, h = n/2, seeds = []; for(let k = 0; k < 40; k++){ const a = k/40*TAU; seeds.push([Math.round(h + Math.cos(a)*n*.14), h, Math.round(h + Math.sin(a)*n*.14)]); }
  const P = dla3(r, {n, seeds, N:1300, c:[h,h,h], budget:1300000});
  const fl = H*.78; g.fillStyle = "#18181E"; g.fillRect(0, fl, W, H - fl);
  const sp = g.createLinearGradient(W/2, 0, W/2, fl); sp.addColorStop(0, "rgba(255,248,230,.16)"); sp.addColorStop(1, "rgba(255,248,230,.02)");
  g.fillStyle = sp; g.beginPath(); g.moveTo(W*.45, 0); g.lineTo(W*.55, 0); g.lineTo(W*.9, fl); g.lineTo(W*.1, fl); g.fill();
  const pw = W*.34, ph = H*.2, px = W/2 - pw/2, py = fl - ph;
  g.fillStyle = "#3A3A42"; g.fillRect(px, py, pw, ph); g.fillStyle = "#4A4A54"; g.beginPath(); g.moveTo(px, py); g.lineTo(px + pw, py); g.lineTo(px + pw - 8, py - 7); g.lineTo(px + 8, py - 7); g.fill();
  const S = Math.min(W*.8, H*.6)/(n*1.1), cx = W/2, cy = py - n*.33*S;
  const idx = P.map((q,i) => i).sort((a,b) => (P[a].x + P[a].z) - (P[b].x + P[b].z));
  for(const i of idx){ const q = P[i], [a,b] = iso(q.x - h, q.y - h, q.z - h), x = cx + a*S, y = cy + b*S, t = Math.max(0, Math.min(1, (q.x + q.z)/(n*1.2) + (q.y - h)/n));
    g.fillStyle = mix("#6E6A60", "#F4EFE4", t); g.beginPath(); g.arc(x, y, S*.72, 0, TAU); g.fill(); }
  g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(W/2, fl + 6, pw*.7, 5, 0, 0, TAU); g.fill();
};
ART.case["B02-01"].ratio = 1.25;

// B02-02 Jason Webb 2D 實驗：2×2 向量畫板（圓粒徑、方向偏移、星形種子、方形粒子＋圓形邊界）
ART.case["B02-02"] = function(g, W, H, r, c, U){
  const pad = 8, pw = (W - pad*3)/2, ph = (H - pad*3)/2, n = 44, s = Math.min(pw, ph)/n;
  const boards = [
    () => dla(r, {n, seeds:[[22,22]], N:260, maxRad:20, budget:300000}),
    () => { let f = n; const sd = []; for(let x = 1; x < n-1; x++) sd.push([x, n-2]); return dla(r, {n, seeds:sd, N:320, launch:() => [1 + ((r()*(n-2)) | 0), Math.max(1, f - 5)], bias:.3, bx:0, by:1, wrapX:true, onStick:(x,y) => { f = Math.min(f, y); }, budget:300000}); },
    () => { const sd = []; for(let k = 0; k < 40; k++){ const a = k/40*TAU, R = (k % 8 < 4 ? 5 + (k % 4)*1.6 : 11.4 - (k % 4)*1.6); sd.push([Math.round(22 + Math.cos(a)*R), Math.round(22 + Math.sin(a)*R)]); } return dla(r, {n, seeds:sd, N:320, maxRad:20, budget:300000}); },
    () => dla(r, {n, seeds:[[22,22]], N:360, inside:(x,y) => Math.hypot(x-22, y-22) < 19, launch:() => { const a = r()*TAU; return [Math.round(22 + Math.cos(a)*18), Math.round(22 + Math.sin(a)*18)]; }, budget:300000})
  ];
  boards.forEach((mkP, k) => {
    const ox = pad + (k%2)*(pw + pad) + (pw - n*s)/2, oy = pad + ((k/2) | 0)*(ph + pad) + (ph - n*s)/2, P = mkP();
    g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(ox, oy, n*s, n*s); g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1; g.strokeRect(ox, oy, n*s, n*s);
    g.strokeStyle = k % 2 ? U.rgba(c, .95) : "#E2F2E4"; g.lineWidth = .8;
    P.forEach((q, i) => { const x = ox + (q.x + .5)*s, y = oy + (q.y + .5)*s;
      if(k === 3){ g.strokeRect(x - s*.4, y - s*.4, s*.8, s*.8); return; }
      const rr = k === 0 ? s*(.25 + .9*(1 - i/P.length)) : s*.45; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.stroke(); });
    if(k === 3){ g.setLineDash([3,3]); g.strokeStyle = ACC; g.beginPath(); g.arc(ox + 22.5*s, oy + 22.5*s, 19*s, 0, TAU); g.stroke(); g.setLineDash([]); }
    if(k === 2){ g.strokeStyle = ACC; g.lineWidth = 1.2; const st = []; for(let j = 0; j <= 10; j++){ const a = j/10*TAU - Math.PI/2, R = j % 2 ? 5 : 11.5; st.push([ox + (22.5 + Math.cos(a)*R)*s, oy + (22.5 + Math.sin(a)*R)*s]); } U.poly(g, st, true); g.stroke(); }
  });
};
ART.case["B02-02"].ratio = 1;

// B02-03 Coding Train 布朗樹雪花：30° 楔形內生長，鏡射 12 份，p5 風格白圈
ART.case["B02-03"] = function(g, W, H, r, c, U){
  const n = 70, m = 42, tn = Math.tan(Math.PI/6);
  const inside = (x,y) => (y - 1) <= (x - 1)*tn + .5;
  const P = dla(r, {n, m, seeds:[[1,1]], N:420, inside, launch:() => { const x = n - 3; return [x, 1 + ((r()*((x - 1)*tn)) | 0)]; }, bias:.35, bx:-1, by:0, maxSteps:3000, budget:900000});
  let R = 1; P.forEach(q => R = Math.max(R, Math.hypot(q.x - 1, q.y - 1)));
  const S = Math.min(W,H)*.46/R, cx = W/2, cy = H/2;
  g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = .8;
  for(let k = 0; k < 6; k++) for(const fl of [1, -1]){
    g.save(); g.translate(cx, cy); g.rotate(k*Math.PI/3); g.scale(1, fl);
    P.forEach((q, i) => { g.strokeStyle = i < P.length*.3 ? U.rgba(c, .95) : "rgba(255,255,255,.8)"; g.beginPath(); g.arc((q.x - 1)*S, (q.y - 1)*S, S*.45, 0, TAU); g.stroke(); });
    g.restore(); }
  g.strokeStyle = "rgba(255,255,255,.12)"; g.setLineDash([2,5]); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R*S*1.05, cy); g.moveTo(cx, cy); g.lineTo(cx + R*S*1.05*Math.cos(Math.PI/6), cy + R*S*1.05*Math.sin(Math.PI/6)); g.stroke(); g.setLineDash([]);
};
ART.case["B02-03"].ratio = 1;

// B02-04 Batty 都市成長：DLA 格子畫成街廓，最長枝條回溯成幹道，同心圈＋右下 log-log 小圖
ART.case["B02-04"] = function(g, W, H, r, c, U){
  const n = 96, m = Math.round(n*H/W), s = W/n, cx = n/2, cy = m/2;
  const P = dla(r, {n, m, seeds:[[cx | 0, cy | 0]], N:1500, maxRad:Math.min(n,m)*.47, budget:1400000});
  g.strokeStyle = "rgba(255,255,255,.04)"; for(let x = 0; x < W; x += s*6){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for(let y = 0; y < H; y += s*6){ g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  P.forEach(q => { const dd = Math.hypot(q.x - cx, q.y - cy)/(Math.min(n,m)*.47); g.fillStyle = mix("#E2F2E4", c, Math.min(1, dd*1.2)); g.fillRect(q.x*s + .5, q.y*s + .5, s - 1, s - 1); });
  const tips = P.map((q,i) => i).sort((a,b) => Math.hypot(P[b].x - cx, P[b].y - cy) - Math.hypot(P[a].x - cx, P[a].y - cy));
  const used = []; g.strokeStyle = ACC; g.lineWidth = 1.8; g.lineJoin = "round";
  for(const t of tips){ const a = Math.atan2(P[t].y - cy, P[t].x - cx); if(used.some(u => Math.abs(Math.atan2(Math.sin(u - a), Math.cos(u - a))) < .7)) continue; used.push(a);
    g.beginPath(); let i = t; g.moveTo((P[i].x + .5)*s, (P[i].y + .5)*s); while(P[i].p >= 0){ i = P[i].p; g.lineTo((P[i].x + .5)*s, (P[i].y + .5)*s); } g.stroke(); if(used.length >= 6) break; }
  g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1; g.setLineDash([3,4]); [.15, .28, .42].forEach(k => { g.beginPath(); g.arc(cx*s, cy*s, Math.min(n,m)*k*s, 0, TAU); g.stroke(); }); g.setLineDash([]);
  const bw = W*.26, bx = W - bw - 6, by = H - bw - 6;
  g.fillStyle = "rgba(10,10,14,.8)"; g.fillRect(bx, by, bw, bw); g.strokeStyle = "rgba(255,255,255,.3)"; g.strokeRect(bx, by, bw, bw);
  const Rm = Math.min(n,m)*.47; g.fillStyle = ACC;
  for(let k = 1; k <= 8; k++){ const rr = Rm*k/8, cnt = P.filter(q => Math.hypot(q.x - cx, q.y - cy) <= rr).length, lx = Math.log(rr)/Math.log(Rm), ly = Math.log(Math.max(1, cnt))/Math.log(P.length);
    g.beginPath(); g.arc(bx + 6 + lx*(bw - 12), by + bw - 6 - ly*(bw - 12), 2, 0, TAU); g.fill(); }
  g.strokeStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.moveTo(bx + 6, by + bw - 6); g.lineTo(bx + bw - 6, by + 6); g.stroke();
};
ART.case["B02-04"].ratio = 1;

// B02-05 DLA＋隨機重力：三個中心按質量拉粒子，畫成密度熱區＋等值線＋中心圈
ART.case["B02-05"] = function(g, W, H, r, c, U){
  const n = 90, m = Math.round(n*H/W), s = W/n;
  const Cn = [[n*.3, m*.35, 3], [n*.72, m*.3, 1.6], [n*.55, m*.75, 1]].map(([x,y,w]) => [Math.round(x + (r() - .5)*6), Math.round(y + (r() - .5)*6), w]);
  const drift = (x,y) => { let fx = 0, fy = 0; Cn.forEach(([a,b,w]) => { const dx = a - x, dy = b - y, d2 = dx*dx + dy*dy + 20; fx += w*dx/d2; fy += w*dy/d2; });
    return Math.abs(fx) > Math.abs(fy) ? [Math.sign(fx), 0] : [0, Math.sign(fy)]; };
  const P = dla(r, {n, m, seeds:Cn.map(([x,y],k) => [x, y, k]), N:1300, launch:() => [1 + ((r()*(n-2)) | 0), 1 + ((r()*(m-2)) | 0)], bias:.25, drift, maxSteps:2500, budget:1400000});
  const gn = 30, gm = Math.round(gn*m/n), D = new Float32Array(gn*gm);
  P.forEach(q => { const i = Math.min(gn-1, (q.x/n*gn) | 0), j = Math.min(gm-1, (q.y/m*gm) | 0);
    for(let b = -2; b <= 2; b++) for(let a = -2; a <= 2; a++){ const ii = i + a, jj = j + b; if(ii >= 0 && jj >= 0 && ii < gn && jj < gm) D[jj*gn + ii] += Math.exp(-(a*a + b*b)/2.5); } });
  let mx = 0; D.forEach(v => mx = Math.max(mx, v)); const val = (i,j) => D[j*gn + i]/mx;
  U.field(g, W, H, gn, gm, val, c, .8);
  g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1;
  [.15, .35, .6].forEach(iso => U.contour(gn, gm, val, iso).forEach(([a,b]) => { g.beginPath(); g.moveTo((a[0] + .5)*W/gn, (a[1] + .5)*H/gm); g.lineTo((b[0] + .5)*W/gn, (b[1] + .5)*H/gm); g.stroke(); }));
  g.fillStyle = "rgba(255,255,255,.5)"; P.forEach(q => g.fillRect(q.x*s, q.y*s, 1, 1));
  g.strokeStyle = ACC; g.setLineDash([4,3]); g.lineWidth = 1.2; g.beginPath(); Cn.forEach(([x,y],k) => k ? g.lineTo(x*s, y*s) : g.moveTo(x*s, y*s)); g.closePath(); g.stroke(); g.setLineDash([]);
  Cn.forEach(([x,y,w]) => { g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.arc(x*s, y*s, 4 + w*4, 0, TAU); g.stroke(); g.fillStyle = ACC; g.beginPath(); g.arc(x*s, y*s, 3, 0, TAU); g.fill(); });
};
ART.case["B02-05"].ratio = .85;

// B02-06 IaaC DLA 亭：四根柱撐起拱形薄殼，枝狀屋頂從柱頭往外長，等角桿件＋節點＋人
ART.case["B02-06"] = function(g, W, H, r, c, U){
  const n = 44, h = n/2, COL = [[12,12],[32,12],[12,32],[32,32]];
  // 頂蓋是一層拱形薄殼：粒子只在殼內游走，從四根柱頭往外長出枝狀屋頂
  const cap = (x,z) => n*.62 + n*.2*(1 - (Math.pow(x - h, 2) + Math.pow(z - h, 2))/(h*h*2));
  const inShell = (x,y,z) => { const t = cap(x,z); return y <= t && y >= t - 3; };
  const seeds = COL.map(([x,z]) => [x, Math.round(cap(x,z)) - 1, z]);
  const launch = () => { const x = 3 + ((r()*(n-6)) | 0), z = 3 + ((r()*(n-6)) | 0); return [x, Math.round(cap(x,z)) - 1 - ((r()*3) | 0), z]; };
  const P = dla3(r, {n, seeds, N:1700, launch, inside:inShell, maxSteps:2500, budget:1300000});
  const S = Math.min(W/(n*1.9), H/(n*1.95)), cx = W/2, cy = H*.68;
  const pr = (x,y,z) => { const [a,b] = iso(x - h, y, z - h); return [cx + a*S, cy + b*S]; };
  const gp = [pr(0,0,0), pr(n,0,0), pr(n,0,n), pr(0,0,n)];
  g.fillStyle = "rgba(255,255,255,.05)"; U.poly(g, gp, true); g.fill();
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1; for(let k = 0; k <= n; k += 4){ U.poly(g, [pr(k,0,0), pr(k,0,n)]); g.stroke(); U.poly(g, [pr(0,0,k), pr(n,0,k)]); g.stroke(); }
  g.fillStyle = "rgba(0,0,0,.35)"; P.forEach(q => { const [x,y] = pr(q.x, 0, q.z); g.fillRect(x, y, 1.5, 1); });
  const d = desc(P), kids = new Uint8Array(P.length); P.forEach(q => { if(q.p >= 0) kids[q.p]++; });
  const idx = P.map((q,i) => i).sort((a,b) => (P[a].x + P[a].z) - (P[b].x + P[b].z));
  g.lineCap = "round"; g.strokeStyle = "#CFEBD3"; g.lineWidth = 3.2;
  COL.forEach(([x,z]) => { const a = pr(x, 0, z), b = pr(x, cap(x,z) - 1, z); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
  for(const i of idx){ const q = P[i]; if(q.p < 0) continue; const p = P[q.p], a = pr(p.x, p.y, p.z), b = pr(q.x, q.y, q.z);
    g.strokeStyle = mix("#1F5A28", "#CFEBD3", (q.x + q.z)/(2*n)); g.lineWidth = Math.min(4, .8 + Math.sqrt(d[i])*.15); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    if(kids[i] > 1){ g.fillStyle = "#fff"; g.beginPath(); g.arc(b[0], b[1], 1.6, 0, TAU); g.fill(); } }
  const [mx, my] = pr(n*.85, 0, n*.95), hh = 6*S*1.9;
  g.fillStyle = "#D8D8DE"; g.beginPath(); g.arc(mx, my - hh, hh*.12, 0, TAU); g.fill(); g.fillRect(mx - hh*.1, my - hh*.86, hh*.2, hh*.86);
};
ART.case["B02-06"].ratio = .9;

// B02-07 Paul Bourke 體素 DLA：在花瓶輪廓內生長，等角體素方塊＋列印平台
ART.case["B02-07"] = function(g, W, H, r, c, U){
  const n = 36, h = n/2, prof = y => n*(.2 + .1*Math.sin(y/n*Math.PI*1.4 + .4)); let top = 2;
  const seeds = []; for(let x = 1; x < n-1; x++) for(let z = 1; z < n-1; z++) if(Math.hypot(x - h, z - h) < prof(1)*.8) seeds.push([x, 1, z]);
  const P = dla3(r, {n, seeds, N:seeds.length + 750, launch:() => { const a = r()*TAU, R = Math.sqrt(r())*prof(top); return [Math.round(h + Math.cos(a)*R), Math.min(n-2, top + 4), Math.round(h + Math.sin(a)*R)]; },
    bias:.15, b:[0,-1,0], inside:(x,y,z) => Math.hypot(x - h, z - h) <= prof(y), onStick:(x,y) => { top = Math.max(top, y); }, maxSteps:2000, budget:1300000});
  const S = Math.min(W/(n*1.9), H/(n*1.7)), cx = W/2, cy = H*.72, pr = (x,y,z) => { const [a,b] = iso(x - h, y, z - h); return [cx + a*S, cy + b*S]; };
  g.fillStyle = "#2E2E36"; U.poly(g, [pr(-2,0,-2), pr(n+2,0,-2), pr(n+2,0,n+2), pr(-2,0,n+2)], true); g.fill();
  g.fillStyle = "#24242B"; U.poly(g, [pr(-2,0,n+2), pr(n+2,0,n+2), pr(n+2,-2,n+2), pr(-2,-2,n+2)], true); g.fill(); U.poly(g, [pr(n+2,0,-2), pr(n+2,0,n+2), pr(n+2,-2,n+2), pr(n+2,-2,-2)], true); g.fill();
  const idx = P.map((q,i) => i).sort((a,b) => (P[a].x + P[a].z + P[a].y*.001) - (P[b].x + P[b].z + P[b].y*.001) || P[a].y - P[b].y);
  const top3 = mix(c, "#E2F2E4", .45), lf = mix(c, "#000", .3), rt = mix(c, "#000", .55);
  for(const i of idx){ const q = P[i], x = q.x, y = q.y, z = q.z;
    const A = pr(x,y+1,z), B = pr(x+1,y+1,z), C = pr(x+1,y+1,z+1), D = pr(x,y+1,z+1), E = pr(x,y,z+1), F = pr(x+1,y,z+1), G = pr(x+1,y,z);
    g.fillStyle = top3; U.poly(g, [A,B,C,D], true); g.fill();
    g.fillStyle = lf; U.poly(g, [D,C,F,E], true); g.fill();
    g.fillStyle = rt; U.poly(g, [B,G,F,C], true); g.fill(); }
  g.strokeStyle = "rgba(255,255,255,.28)"; g.setLineDash([3,3]); g.lineWidth = 1;
  for(let y = 4; y < n; y += 8){ const R = prof(y), o = pr(h, y, h); g.beginPath(); g.ellipse(o[0], o[1], R*S*C30*Math.SQRT2, R*S*S30*Math.SQRT2, 0, 0, TAU); g.stroke(); } g.setLineDash([]);
};
ART.case["B02-07"].ratio = 1.2;

// B02-08 Houdini VEX：透視視窗、地面格線、依生成順序 Cd 漸層的點雲、工具列與時間軸
ART.case["B02-08"] = function(g, W, H, r, c, U){
  const n = 46, h = n/2, P = dla3(r, {n, seeds:[[h,h,h]], N:1000, budget:1100000});
  const tb = 16, lb = 18, bb = 18, vx = lb, vy = tb, vw = W - lb, vh = H - tb - bb;
  const bg = g.createLinearGradient(0, vy, 0, vy + vh); bg.addColorStop(0, "#4A4E57"); bg.addColorStop(1, "#23252B"); g.fillStyle = bg; g.fillRect(vx, vy, vw, vh);
  const yaw = .7, pit = .42, f = 3.2, sc = vh*.9, cx = vx + vw/2, cy = vy + vh*.5;
  const pr = (X,Y,Z) => { const x1 = X*Math.cos(yaw) - Z*Math.sin(yaw), z1 = X*Math.sin(yaw) + Z*Math.cos(yaw), y2 = Y*Math.cos(pit) - z1*Math.sin(pit), z2 = Y*Math.sin(pit) + z1*Math.cos(pit), k = f/(f + z2); return [cx + x1*k*sc/f, cy - y2*k*sc/f]; };
  g.save(); g.beginPath(); g.rect(vx, vy, vw, vh); g.clip();
  g.strokeStyle = "rgba(255,255,255,.13)"; g.lineWidth = 1; const fy = -.55;
  for(let k = -6; k <= 6; k++){ U.poly(g, [pr(k*.15, fy, -.9), pr(k*.15, fy, .9)]); g.stroke(); U.poly(g, [pr(-.9, fy, k*.15), pr(.9, fy, k*.15)]); g.stroke(); }
  const pts = P.map((q,i) => ({i, p:pr((q.x - h)/n*2.3, (q.y - h)/n*2.3, (q.z - h)/n*2.3), z:(q.x + q.z)}));
  pts.sort((a,b) => a.z - b.z).forEach(o => { const t = o.i/P.length; g.fillStyle = `hsl(${55 - t*55},95%,${60 - t*12}%)`; g.fillRect(o.p[0] - 1.2, o.p[1] - 1.2, 2.4, 2.4); });
  g.restore();
  g.fillStyle = "#2B2B30"; g.fillRect(0, 0, W, tb); g.fillRect(0, 0, lb, H); g.fillRect(0, H - bb, W, bb);
  g.fillStyle = "rgba(255,255,255,.25)"; for(let k = 0; k < 9; k++) g.fillRect(lb + 4 + k*13, 4, 9, 8); for(let k = 0; k < 7; k++) g.fillRect(4, tb + 6 + k*14, 10, 10);
  g.strokeStyle = "rgba(255,255,255,.3)"; for(let x = lb + 8; x < W - 8; x += 8){ g.beginPath(); g.moveTo(x, H - bb + 5); g.lineTo(x, H - bb + (x % 40 < 8 ? 13 : 9)); g.stroke(); }
  g.fillStyle = ACC; g.fillRect(lb + 8 + (W - lb - 16)*.6, H - bb + 2, 2, bb - 4);
  const ax = vx + 18, ay = vy + vh - 16, o = pr(0,0,0); [[1,0,0,"#E4572E"],[0,1,0,"#3FA34D"],[0,0,1,"#2F6FE4"]].forEach(([X,Y,Z,col]) => { const p = pr(X*.12, Y*.12, Z*.12); g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + (p[0] - o[0]), ay + (p[1] - o[1])); g.stroke(); });
};
ART.case["B02-08"].ratio = .8;

// B02-09 Blender Geometry Nodes：上半視窗、下半節點編輯器（模擬區段框＋連線）
ART.case["B02-09"] = function(g, W, H, r, c, U){
  const vh = H*.45; g.fillStyle = "#393939"; g.fillRect(0, 0, W, vh);
  g.strokeStyle = "rgba(255,255,255,.06)"; for(let x = 0; x < W; x += 14){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, vh); g.stroke(); }
  g.strokeStyle = "rgba(200,60,60,.6)"; g.beginPath(); g.moveTo(0, vh*.7); g.lineTo(W, vh*.7); g.stroke();
  const n = 70, P = dla(r, {n, seeds:[[35,35]], N:600, maxRad:32, budget:700000}), s = vh*.92/n, ox = W/2 - 35*s, oy = vh*.04;
  g.fillStyle = "#FFA033"; P.forEach(q => g.fillRect(ox + q.x*s, oy + q.y*s, s*.9, s*.9));
  g.fillStyle = "#1D1D1D"; g.fillRect(0, vh, W, H - vh); g.fillStyle = "#555"; g.fillRect(0, vh, W, 2);
  g.fillStyle = "rgba(255,255,255,.08)"; for(let y = vh + 10; y < H; y += 12) for(let x = 6; x < W; x += 12) g.fillRect(x, y, 1, 1);
  const nh = (H - vh), nodes = [[.03, .3, "#3B3B3B", "#8A2F2F"], [.26, .18, "#3B3B3B", "#5A3F7A"], [.48, .5, "#3B3B3B", "#1F6F5A"], [.7, .18, "#3B3B3B", "#5A3F7A"], [.84, .45, "#3B3B3B", "#8A2F2F"]];
  const bw = W*.15, bhh = nh*.3;
  g.fillStyle = "rgba(90,63,122,.18)"; g.fillRect(W*.24, vh + nh*.1, W*.64 - W*.24 + bw + 6, nh*.8); g.strokeStyle = "rgba(160,120,210,.5)"; g.strokeRect(W*.24, vh + nh*.1, W*.64 - W*.24 + bw + 6, nh*.8);
  const sock = []; nodes.forEach(([x,y,b,hd]) => { const X = x*W, Y = vh + y*nh; g.fillStyle = b; g.fillRect(X, Y, bw, bhh); g.fillStyle = hd; g.fillRect(X, Y, bw, 7);
    g.fillStyle = "rgba(255,255,255,.2)"; g.fillRect(X + 4, Y + 12, bw*.6, 3); g.fillRect(X + 4, Y + 19, bw*.4, 3); sock.push([X, Y + bhh*.6, X + bw, Y + bhh*.6]); });
  for(let k = 0; k < nodes.length - 1; k++){ const [, , x1, y1] = sock[k], [x2, y2] = sock[k+1]; g.strokeStyle = "#00D6A3"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x1, y1); g.bezierCurveTo(x1 + 20, y1, x2 - 20, y2, x2, y2); g.stroke();
    g.fillStyle = "#00D6A3"; g.beginPath(); g.arc(x1, y1, 2.6, 0, TAU); g.arc(x2, y2, 2.6, 0, TAU); g.fill(); }
  const [, , a1, b1] = sock[3], [c1, d1] = sock[1]; g.strokeStyle = "rgba(160,120,210,.8)"; g.setLineDash([3,3]); g.beginPath(); g.moveTo(a1, b1); g.bezierCurveTo(a1 + 10, vh + nh*.95, c1 - 10, vh + nh*.95, c1, d1); g.stroke(); g.setLineDash([]);
};
ART.case["B02-09"].ratio = 1.15;

// B02-10 Lichtenberg 燒紋：木板紋理上，兩電極之間的 DBM 放電燒痕
ART.case["B02-10"] = function(g, W, H, r, c, U){
  const bx = W*.06, by = H*.14, bw = W*.88, bh = H*.72, nz = U.vnoise((r()*1e6) | 0);
  const wg = g.createLinearGradient(0, by, 0, by + bh); wg.addColorStop(0, "#9C6B3E"); wg.addColorStop(1, "#7A4F2A"); g.fillStyle = wg; g.fillRect(bx, by, bw, bh);
  g.strokeStyle = "rgba(60,32,12,.35)"; g.lineWidth = 1;
  for(let k = 0; k < 26; k++){ const y0 = by + bh*k/26; g.beginPath(); for(let x = 0; x <= bw; x += 6){ const y = y0 + (nz(x/60, k*.7) - .5)*14; x ? g.lineTo(bx + x, y) : g.moveTo(bx, y); } g.stroke(); }
  const n = 80, m = Math.round(n*bh/bw), s = bw/n, ey = m/2 | 0, e2 = n - 7;
  const {P} = dbm(r, {n, m, seeds:[[6, ey]], fix:(x,y) => Math.hypot(x - e2, y - ey) < 2 ? 1 : -1, eta:1.3, steps:520, iters:3, init:80, stop:(x,y) => Math.hypot(x - e2, y - ey) < 3.5});
  const d = desc(P), f = q => [bx + (q.x + .5)*s, by + (q.y + .5)*s];
  tree(g, P, f, i => Math.min(6, 1.4 + Math.sqrt(d[i])*.35), () => "rgba(20,10,4,.9)");
  tree(g, P, f, i => Math.min(1.6, .4 + Math.sqrt(d[i])*.08), i => d[i] < 4 ? "rgba(255,140,40,.8)" : "rgba(255,90,20,.35)");
  [[6, ey], [e2, ey]].forEach(([x,y]) => { const X = bx + x*s, Y = by + y*s; g.fillStyle = "#B8BCC6"; g.fillRect(X - 5, Y - 5, 10, 10); g.strokeStyle = "#B8BCC6"; g.lineWidth = 2; g.beginPath(); g.moveTo(X, Y - 5); g.lineTo(X + (x < 40 ? -10 : 10), by - 12); g.stroke(); });
  g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 1; g.strokeRect(bx, by, bw, bh);
};
ART.case["B02-10"].ratio = .75;

// B02-11 鋰電池枝晶：上下電極剖面，枝晶從鋰負極往上長穿過隔離膜，依高度上色＋色階條
ART.case["B02-11"] = function(g, W, H, r, c, U){
  const cb = 16, gw = W - cb - 14, pt = H*.1, pb = H*.1, n = 100, s = gw/n, m = Math.round((H - pt - pb)/s); let front = m;
  const seeds = []; for(let x = 1; x < n-1; x++) seeds.push([x, m-2]);
  const P = dla(r, {n, m, seeds, N:950, launch:() => [1 + ((r()*(n-2)) | 0), Math.max(1, front - 6)], bias:.2, bx:0, by:1, wrapX:true, onStick:(x,y) => { front = Math.min(front, y); }, budget:1000000});
  const ox = 6, oy = pt, col = t => `hsl(${230 - t*230},85%,55%)`;
  g.fillStyle = "#6B6F78"; g.fillRect(ox, 4, gw, pt - 4); g.fillStyle = "#C8CCD4"; g.fillRect(ox, oy + (m - 1.5)*s, gw, H - oy - (m - 1.5)*s - 4);
  g.fillStyle = "rgba(100,140,220,.06)"; g.fillRect(ox, oy, gw, m*s);
  const sepY = oy + m*s*.45; g.strokeStyle = "rgba(255,255,255,.45)"; g.setLineDash([6,3]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(ox, sepY); g.lineTo(ox + gw, sepY); g.stroke(); g.setLineDash([]);
  P.forEach(q => { if(q.y >= m-2) return; const t = (m - q.y)/m; g.fillStyle = col(t); g.fillRect(ox + q.x*s, oy + q.y*s, s*.95, s*.95); });
  const cx = W - cb - 2; for(let k = 0; k < 40; k++){ g.fillStyle = col(k/39); g.fillRect(cx, oy + m*s*(1 - (k + 1)/40), cb*.6, m*s/40 + .5); }
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; for(let k = 0; k <= 4; k++){ const y = oy + m*s*k/4; g.beginPath(); g.moveTo(cx + cb*.6, y); g.lineTo(cx + cb*.9, y); g.stroke(); }
};
ART.case["B02-11"].ratio = .8;

// B02-12 Grasshopper 社群：Rhino 淺灰 Top 視窗，群集是黑色曲線、剛黏上的一顆黃色選取，四周是游走粒子（swarm agent）的軌跡
ART.case["B02-12"] = function(g, W, H, r, c, U){
  const tb = 22, n = 90, m = Math.round(n*(H - tb)/W), s = W/n;
  const P = dla(r, {n, m, seeds:[[n/2 | 0, m/2 | 0]], N:900, maxRad:Math.min(n, m)*.36, budget:900000});
  // 上方 GH 工具列：分頁＋元件圖示
  g.fillStyle = "#3A3A42"; g.fillRect(0, 0, W, tb);
  for(let k = 0; k < 5; k++){ g.fillStyle = k === 2 ? "#5A5A66" : "#44444C"; g.fillRect(4 + k*30, 3, 27, 6); }
  for(let k = 0; k < 12; k++){ const x = 5 + k*15; g.fillStyle = k % 4 === 1 ? U.rgba(c, .9) : "#8A8A94"; g.fillRect(x, 12, 11, 8); }
  // 視窗：Rhino 預設淺灰底＋格線＋紅綠軸
  const oy = tb, cx = W/2, cy = oy + (H - tb)/2;
  g.fillStyle = "#9C9CA2"; g.fillRect(0, oy, W, H - tb);
  g.save(); g.beginPath(); g.rect(0, oy, W, H - tb); g.clip();
  for(let k = -40; k <= 40; k++){ const x = cx + k*s*5, y = cy + k*s*5;
    g.strokeStyle = k % 5 === 0 ? "rgba(70,70,76,.55)" : "rgba(120,120,126,.6)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, oy); g.lineTo(x, H); g.stroke(); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.lineWidth = 1.4; g.strokeStyle = "#B03A2E"; g.beginPath(); g.moveTo(0, cy); g.lineTo(W, cy); g.stroke();
  g.strokeStyle = "#2E8B3E"; g.beginPath(); g.moveTo(cx, oy); g.lineTo(cx, H); g.stroke();
  // 游走粒子：隨機行走的淡色軌跡＋端點
  for(let k = 0; k < 16; k++){
    const a = r()*TAU, R = Math.min(n, m)*(.38 + r()*.12); let x = n/2 + Math.cos(a)*R, y = m/2 + Math.sin(a)*R;
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = .9; g.beginPath(); g.moveTo(x*s, oy + y*s);
    for(let st = 0; st < 40; st++){ const d = (r()*4) | 0; x += [1,-1,0,0][d]; y += [0,0,1,-1][d]; g.lineTo(x*s, oy + y*s); }
    g.stroke(); g.fillStyle = "#fff"; g.beginPath(); g.arc(x*s, oy + y*s, 1.8, 0, TAU); g.fill();
  }
  // 群集：GH 預覽用深色線，最後 40 顆為綠色預覽，最新一顆黃色選取
  const d = desc(P);
  tree(g, P, q => [(q.x + .5)*s, oy + (q.y + .5)*s], i => Math.min(2.6, .8 + Math.sqrt(d[i])*.12), i => i > P.length - 40 ? c : "#1E1E22");
  const L = P[P.length - 1], lx = (L.x + .5)*s, ly = oy + (L.y + .5)*s;
  g.strokeStyle = "#F5E04A"; g.lineWidth = 2; g.strokeRect(lx - 4, ly - 4, 8, 8);
  g.restore();
  // 視窗標籤與外框
  g.fillStyle = "rgba(40,40,46,.8)"; g.fillRect(6, oy + 6, 26, 9);
  g.strokeStyle = "#50505A"; g.lineWidth = 1; g.strokeRect(.5, oy + .5, W - 1, H - tb - 1);
};
ART.case["B02-12"].ratio = 1.05;

// B02-13 OPENFUSE 即時裝置：房間透視，投影到後牆的發光 DLA、投影機光錐、觀眾剪影
ART.case["B02-13"] = function(g, W, H, r, c, U){
  const L = W*.2, R = W*.8, T = H*.14, B = H*.64;
  g.fillStyle = "#0B0B0F"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#14141A"; U.poly(g, [[0,H],[L,B],[R,B],[W,H]], true); g.fill();
  g.fillStyle = "#101015"; U.poly(g, [[0,0],[L,T],[L,B],[0,H]], true); g.fill(); U.poly(g, [[W,0],[R,T],[R,B],[W,H]], true); g.fill();
  g.fillStyle = "#06060A"; g.fillRect(L, T, R - L, B - T);
  const n = 80, m = Math.round(n*(B - T)/(R - L)), s = (R - L)/n, P = dla(r, {n, m, seeds:[[40, m >> 1]], N:850, maxRad:m*.47, budget:900000}), d = desc(P);
  const pj = [W/2, H*.93]; g.fillStyle = "rgba(63,163,77,.05)"; U.poly(g, [pj, [L, T], [R, T]], true); g.fill(); U.poly(g, [pj, [L, B], [L, T]], true); g.fill(); U.poly(g, [pj, [R, T], [R, B]], true); g.fill();
  g.globalCompositeOperation = "lighter";
  tree(g, P, q => [L + (q.x + .5)*s, T + (q.y + .5)*s], i => Math.min(5, 1.5 + Math.sqrt(d[i])*.3), () => U.rgba(c, .35));
  tree(g, P, q => [L + (q.x + .5)*s, T + (q.y + .5)*s], () => .8, () => "rgba(220,255,225,.8)");
  g.fillStyle = "rgba(255,255,255,.5)"; for(let k = 0; k < 120; k++) g.fillRect(L + r()*(R - L), T + r()*(B - T), 1, 1);
  const gr = g.createLinearGradient(0, B, 0, H); gr.addColorStop(0, U.rgba(c, .25)); gr.addColorStop(1, U.rgba(c, 0)); g.fillStyle = gr; U.poly(g, [[L,B],[R,B],[R + (W - R)*.3, B + (H - B)*.4],[L*.7, B + (H - B)*.4]], true); g.fill();
  g.globalCompositeOperation = "source-over";
  g.fillStyle = "#2A2A32"; g.fillRect(pj[0] - 8, pj[1] - 3, 16, 7);
  [[W*.33, H*.86, 1], [W*.62, H*.9, 1.1]].forEach(([x,y,k]) => { const hh = H*.2*k; g.fillStyle = "#000"; g.beginPath(); g.arc(x, y - hh, hh*.1, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x - hh*.17, y); g.lineTo(x - hh*.14, y - hh*.8); g.lineTo(x + hh*.14, y - hh*.8); g.lineTo(x + hh*.17, y); g.fill(); });
};
ART.case["B02-13"].ratio = .8;

// B02-14 自然樹枝狀形態：石板裂縫長出的錳樹枝石（深色蕨紋）＋右下培養皿中的硫酸銅電沉積
ART.case["B02-14"] = function(g, W, H, r, c, U){
  const nz = U.vnoise((r()*1e6) | 0), bx = 8, by = 8, bw = W - 16, bh = H - 16;
  const sg = g.createLinearGradient(0, 0, W, H); sg.addColorStop(0, "#B9AE98"); sg.addColorStop(1, "#8F8470"); g.fillStyle = sg; g.fillRect(bx, by, bw, bh);
  for(let k = 0; k < 700; k++){ const x = bx + r()*bw, y = by + r()*bh; g.fillStyle = `rgba(${nz(x/30, y/30) > .5 ? "255,250,240" : "60,50,40"},.12)`; g.fillRect(x, y, 2, 2); }
  const n = 90, m = Math.round(n*bh/bw), s = bw/n, crack = x => Math.round(m*.18 + x*.55 + (nz(x/12, 3) - .5)*8); let front = 0;
  const seeds = []; for(let x = 1; x < n-1; x += 5){ const y = crack(x); if(y > 1 && y < m-2) seeds.push([x, y]); }
  const below = (x,y) => y >= crack(x) - 1;
  const P = dla(r, {n, m, seeds, N:1100, inside:below, launch:() => { const x = 1 + ((r()*(n-2)) | 0); return [x, Math.min(m-2, crack(x) + front + 5)]; }, bias:.2, drift:() => [0,-1], onStick:(x,y) => { front = Math.max(front, y - crack(x)); }, budget:1200000});
  const d = desc(P);
  g.strokeStyle = "rgba(40,30,20,.6)"; g.lineWidth = 1.5; g.beginPath(); for(let x = 0; x < n; x++){ const y = crack(x); x ? g.lineTo(bx + x*s, by + y*s) : g.moveTo(bx, by + y*s); } g.stroke();
  tree(g, P, q => [bx + (q.x + .5)*s, by + (q.y + .5)*s], i => Math.min(3.5, .6 + Math.sqrt(d[i])*.22), () => "rgba(30,24,18,.85)");
  const pr = Math.min(W, H)*.2, px = W - pr - 14, py = H - pr - 14;
  g.fillStyle = "rgba(30,50,60,.85)"; g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill();
  const cn = 50, cP = dla(r, {n:cn, seeds:[[25,25]], N:420, maxRad:22, budget:400000}), cs = pr*2/cn*.95;
  g.fillStyle = "#D08A4A"; cP.forEach(q => g.fillRect(px + (q.x - 25)*cs, py + (q.y - 25)*cs, cs, cs));
  g.strokeStyle = "rgba(230,245,255,.7)"; g.lineWidth = 2; g.beginPath(); g.arc(px, py, pr, 0, TAU); g.stroke();
  g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1; g.beginPath(); g.arc(px, py, pr + 4, 0, TAU); g.stroke();
};
ART.case["B02-14"].ratio = 1.1;

/* ---------------- V13–V15 新增核心：三種脫離「隨機行走＋黏著」框架的規則 ---------------- */
// 白蟻式晶格建造：整數格子上的代理人隨機走位，走到空格就依「面鄰格磚數＋正下方有無支撐」規則決定放不放磚
// o: nx,ny,nz；seeds [[x,y,z]]；start；steps；maxBricks；minFace,maxFace
function termite(r, o){
  const nx = o.nx, ny = o.ny, nz = o.nz, id = (x,y,z) => (y*nz + z)*nx + x;
  const built = new Uint8Array(nx*ny*nz), P = [];
  const add = (x,y,z) => { built[id(x,y,z)] = 1; P.push({x, y, z}); };
  o.seeds.forEach(s => { if(!built[id(s[0],s[1],s[2])]) add(s[0], s[1], s[2]); });
  let x = o.start[0], y = o.start[1], z = o.start[2], bricks = P.length;
  const D = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  for(let st = 0; st < o.steps && bricks < o.maxBricks; st++){
    // 每隔一段步數，代理人跳回結構上一顆已放的磚旁邊重新出發，避免在空曠處迷路浪費步數
    if(st % 320 === 0 && P.length){ const q = P[(r()*P.length)|0]; x = q.x; y = q.y; z = q.z; }
    const dx = ((r()*3)|0) - 1, dy = ((r()*3)|0) - 1, dz = ((r()*3)|0) - 1, nX = x + dx, nY = y + dy, nZ = z + dz;
    if(nX >= 1 && nY >= 0 && nZ >= 1 && nX < nx-1 && nY < ny && nZ < nz-1 && !built[id(nX,nY,nZ)]){ x = nX; y = nY; z = nZ; }
    if(built[id(x,y,z)]) continue;
    let fn = 0;
    for(const [ddx,ddy,ddz] of D){ const xx = x+ddx, yy = y+ddy, zz = z+ddz;
      if(xx >= 0 && yy >= 0 && zz >= 0 && xx < nx && yy < ny && zz < nz && built[id(xx,yy,zz)]) fn++; }
    const below = y === 0 || built[id(x,y-1,z)], archOK = !below && fn >= 2 && r() < .18;
    if((below || archOK) && fn >= o.minFace && fn <= o.maxFace){ add(x, y, z); bricks++; }
  }
  return P;
}
// Eden 周界隨機生長：不做隨機行走，每輪直接從「周界」（貼著已長區域的空格）等機率挑一格長出
// o: n；seeds [[x,y]]；count
function eden(r, o){
  const n = o.n, built = new Uint8Array(n*n), inFront = new Uint8Array(n*n), front = [], P = [];
  const idx = (x,y) => y*n + x, D = [[1,0],[-1,0],[0,1],[0,-1]];
  const pushFront = (x,y) => { if(x < 1 || y < 1 || x >= n-1 || y >= n-1) return; const i = idx(x,y); if(built[i] || inFront[i]) return; inFront[i] = 1; front.push([x,y]); };
  const add = (x,y) => { built[idx(x,y)] = 1; P.push({x,y}); D.forEach(([dx,dy]) => pushFront(x+dx, y+dy)); };
  o.seeds.forEach(([x,y]) => { if(!built[idx(x,y)]) add(x,y); });
  for(let k = 0; k < o.count && front.length; k++){
    const j = (r()*front.length)|0, [x,y] = front[j];
    front[j] = front[front.length-1]; front.pop(); inFront[idx(x,y)] = 0;
    if(built[idx(x,y)]){ k--; continue; }
    add(x,y);
  }
  return P;
}
// Lévy flight 步長：出發後每一步的位移長度取自冪次律（Pareto），沿路徑逐格檢查是否碰到群集
// o: n,m；seeds [[x,y]]；cx,cy；N；alpha；stepSize；maxJump；maxSteps；maxRad；budget；trails（可選，收集長跳線段做視覺化）
function levy(r, o){
  const n = o.n, m = o.m || n, G = new Int32Array(n*m), P = [];
  const add = (x,y,p) => { G[y*n+x] = P.length + 1; P.push({x, y, p}); };
  o.seeds.forEach(s => { if(!G[s[1]*n+s[0]]) add(s[0], s[1], -1); });
  const cx = o.cx ?? n/2, cy = o.cy ?? m/2;
  let rad = 2; for(const q of P) rad = Math.max(rad, Math.hypot(q.x-cx, q.y-cy));
  let budget = o.budget || 300000;
  while(P.length < o.N && budget > 0){
    budget--;
    const a0 = r()*TAU, R = rad + 4;
    let x = cx + Math.cos(a0)*R, y = cy + Math.sin(a0)*R;
    if(x < 1 || y < 1 || x > n-2 || y > m-2) continue;
    const kill = rad + Math.max(14, rad*.7);
    for(let st = 0; st < o.maxSteps; st++){
      budget--;
      const ang = r()*TAU, len = Math.min(o.maxJump, o.stepSize*Math.pow(Math.max(1e-6, 1-r()), -1/o.alpha));
      const nx = x + Math.cos(ang)*len, ny = y + Math.sin(ang)*len;
      const dist = Math.hypot(nx-x, ny-y), steps = Math.max(1, Math.min(200, Math.ceil(dist)));
      let done = false;
      for(let k = 1; k <= steps; k++){
        const tx = x + (nx-x)*k/steps, ty = y + (ny-y)*k/steps, ix = Math.round(tx), iy = Math.round(ty);
        if(ix < 1 || iy < 1 || ix > n-2 || iy > m-2){ done = true; break; }
        const i = iy*n + ix, nb = G[i-1] || G[i+1] || G[i-n] || G[i+n];
        if(nb){ add(ix, iy, nb-1); rad = Math.max(rad, Math.hypot(ix-cx, iy-cy));
          if(o.trails && dist > o.stepSize*4 && o.trails.length < 60) o.trails.push([x, y, tx, ty, dist]);
          done = true; break; }
      }
      if(done) break;
      x = nx; y = ny;
      if(Math.hypot(x-cx, y-cy) > kill) break;
    }
    if(rad > o.maxRad) break;
  }
  return P;
}

/* ---------------- 新增變形 V13–V15 ---------------- */
// V13 白蟻式晶格建造：建築剖面圖──沿切面剖開，露出牆、柱、拱與內部空腔，左上角附平面圖標示切面位置
ART.var["B02"][12] = function(g, W, H, r, c, U){
  const nx = 26, ny = 16, nz = 26, seeds = [];
  for(let gx = 0; gx < 3; gx++) for(let gz = 0; gz < 3; gz++) seeds.push([8 + gx*5, 0, 8 + gz*5]); // 3×3 柱網種子
  for(let k = 0; k < 10; k++) seeds.push([9 + ((r()*9)|0), 0, 9 + ((r()*9)|0)]); // 地面隨機種子補牆體
  const P = termite(r, {nx, ny, nz, seeds, start:[13,0,13], steps:70000, maxBricks:2200, minFace:0, maxFace:4});
  const built = new Set(); P.forEach(q => built.add(q.x + "," + q.y + "," + q.z));
  const has = (x,y,z) => built.has(x + "," + y + "," + z);
  const zc = 13, S = Math.min(W/(nx*1.05), (H*.78)/ny), ox = W/2 - nx*S/2, gy = H*.86;
  const sx = x => ox + x*S, sy = y => gy - (y+1)*S;
  g.fillStyle = "#3A342C"; g.fillRect(0, gy, W, H - gy);
  g.strokeStyle = "rgba(255,255,255,.06)"; for(let k = 0; k <= nx; k += 2){ g.beginPath(); g.moveTo(sx(k), gy); g.lineTo(sx(k), H); g.stroke(); }
  for(let y = 0; y < ny; y++) for(let x = 0; x < nx; x++){ let behind = false; for(let z = zc+1; z < nz; z++) if(has(x,y,z)){ behind = true; break; }
    if(behind){ g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(sx(x), sy(y), S+.5, S+.5); } }
  for(let y = 0; y < ny; y++) for(let x = 0; x < nx; x++){ if(!has(x,y,zc)) continue;
    const t = y/ny; g.fillStyle = mix("#8A7659", "#D9C79E", t*.6); g.fillRect(sx(x), sy(y), S+.5, S+.5);
    g.save(); g.beginPath(); g.rect(sx(x), sy(y), S+.5, S+.5); g.clip();
    g.strokeStyle = "rgba(60,45,25,.4)"; g.lineWidth = 1; for(let k = -S; k < S*2; k += 4){ g.beginPath(); g.moveTo(sx(x)+k, sy(y)+S); g.lineTo(sx(x)+k+S, sy(y)); g.stroke(); }
    g.restore(); g.strokeStyle = "rgba(20,14,8,.55)"; g.lineWidth = 1; g.strokeRect(sx(x), sy(y), S+.5, S+.5); }
  g.strokeStyle = U.rgba(c, .85); g.lineWidth = 2; g.beginPath(); g.moveTo(0, gy+2); g.lineTo(W, gy+2); g.stroke();
  const iw = W*.22, ih = iw, ix = 10, iy = 10, ps = iw/nx;
  g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(ix, iy, iw, ih); g.strokeStyle = "rgba(255,255,255,.3)"; g.strokeRect(ix, iy, iw, ih);
  g.fillStyle = U.rgba(c, .8);
  for(let z = 0; z < nz; z++) for(let x = 0; x < nx; x++){ let any = false; for(let y = 0; y < ny; y++) if(has(x,y,z)){ any = true; break; }
    if(any) g.fillRect(ix + x*ps, iy + z*ps, ps+.3, ps+.3); }
  g.strokeStyle = ACC; g.lineWidth = 1; g.beginPath(); g.moveTo(ix, iy + zc*ps); g.lineTo(ix + iw, iy + zc*ps); g.stroke();
};
// V14 Eden 周界隨機生長：左右並排兩只培養皿──左邊是有擴散篩選的 DLA 稀疏分枝，右邊是 Eden 生長的實心團塊
ART.var["B02"][13] = function(g, W, H, r, c, U){
  const pad = 10, dw = (W - pad*3)/2;
  const mkDish = ox => { const cx = ox + dw/2, cy = H*.5, R = Math.min(dw, H*.82)/2 - 4;
    g.fillStyle = "#171A16"; g.beginPath(); g.arc(cx, cy, R+6, 0, TAU); g.fill();
    const ag = g.createRadialGradient(cx, cy, 0, cx, cy, R); ag.addColorStop(0, "rgba(120,150,90,.18)"); ag.addColorStop(1, "rgba(80,100,60,.05)");
    g.fillStyle = ag; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill(); return {cx, cy, R}; };
  const L = mkDish(pad), Rd = mkDish(pad*2 + dw);
  const n1 = 70, P1 = dla(r, {n:n1, seeds:[[35,35]], N:500, maxRad:31, budget:700000}), s1 = (L.R*1.8)/n1, d1 = desc(P1);
  tree(g, P1, q => [L.cx + (q.x-35)*s1, L.cy + (q.y-35)*s1], i => Math.min(2, .6 + Math.sqrt(d1[i])*.15), () => "rgba(226,242,228,.75)");
  const n2 = 90, P2 = eden(r, {n:n2, seeds:[[45,45]], count:2300}), s2 = (Rd.R*1.85)/n2;
  P2.forEach((q,i) => { const t = i/P2.length; g.fillStyle = mix(c, "#E2F2E4", t*.7); g.fillRect(Rd.cx + (q.x-45)*s2 - .6, Rd.cy + (q.y-45)*s2 - .6, s2*1.05, s2*1.05); });
  [L, Rd].forEach(({cx, cy, R}) => { g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
    g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.ellipse(cx - R*.4, cy - R*.5, R*.28, R*.14, -.4, 0, TAU); g.fill(); });
  g.strokeStyle = "rgba(255,255,255,.15)"; g.setLineDash([3,4]); g.beginPath(); g.moveTo(W/2, H*.1); g.lineTo(W/2, H*.9); g.stroke(); g.setLineDash([]);
  g.fillStyle = ACC; g.beginPath(); g.arc(L.cx, L.cy, 2.2, 0, TAU); g.fill(); g.beginPath(); g.arc(Rd.cx, Rd.cy, 2.2, 0, TAU); g.fill();
};
// V15 Lévy flight 步長：低 alpha 的厚實團塊，背景是取樣到的長跳彗尾＋跳躍長度直方圖，右上角附高 alpha 的細碎版縮圖對照
ART.var["B02"][14] = function(g, W, H, r, c, U){
  const n = 90, m = Math.round(n*H/W), s = W/n, cx = n/2, cy = m/2, trails = [];
  const P = levy(r, {n, m, seeds:[[cx|0, cy|0]], cx, cy, N:820, alpha:1.1, stepSize:1.3, maxJump:n*.8, maxSteps:60, maxRad:Math.min(n,m)*.46, budget:280000, trails});
  const d = desc(P), f = q => [(q.x+.5)*s, (q.y+.5)*s];
  g.lineCap = "round";
  trails.sort((a,b) => a[4]-b[4]).forEach(([x0,y0,x1,y1,dist]) => {
    const gr = g.createLinearGradient(x0*s, y0*s, x1*s, y1*s); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, U.rgba(c, .55));
    g.strokeStyle = gr; g.lineWidth = Math.min(2.2, .6 + dist*.02); g.beginPath(); g.moveTo(x0*s, y0*s); g.lineTo(x1*s, y1*s); g.stroke(); });
  tree(g, P, f, i => Math.min(6, 1.6 + Math.sqrt(d[i])*.4), i => mix("#123018", c, Math.min(1, d[i]/40)));
  g.fillStyle = "#fff"; g.beginPath(); g.arc(f(P[0])[0], f(P[0])[1], 2.5, 0, TAU); g.fill();
  const iw = W*.24, ih = iw*m/n, ix = W - iw - 8, iy = 8;
  g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(ix, iy, iw, ih); g.strokeStyle = "rgba(255,255,255,.3)"; g.strokeRect(ix, iy, iw, ih);
  const n2 = 60, m2 = Math.round(n2*ih/iw), P2 = levy(r, {n:n2, m:m2, seeds:[[n2/2|0, m2/2|0]], N:260, alpha:2.6, stepSize:1, maxJump:n2*.5, maxSteps:50, maxRad:Math.min(n2,m2)*.44, budget:150000}), is = iw/n2;
  tree(g, P2, q => [ix + (q.x+.5)*is, iy + (q.y+.5)*is], () => .7, () => "rgba(226,242,228,.8)");
  const bw = W*.26, bh = H*.16, bx = 8, by = H - bh - 8;
  g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(bx, by, bw, bh);
  const bins = 10, cnt = new Array(bins).fill(0), maxLen = Math.log(n);
  trails.forEach(([,,,,dist]) => { const k = Math.min(bins-1, Math.max(0, Math.floor(Math.log(Math.max(1,dist))/maxLen*bins))); cnt[k]++; });
  const mxc = Math.max(1, ...cnt);
  g.fillStyle = ACC; cnt.forEach((v,k) => { const bh2 = (v/mxc)*(bh-8); g.fillRect(bx + 4 + k*(bw-8)/bins, by + bh - 4 - bh2, (bw-8)/bins - 1, bh2); });
  g.strokeStyle = "rgba(255,255,255,.3)"; g.strokeRect(bx, by, bw, bh);
};
})();
