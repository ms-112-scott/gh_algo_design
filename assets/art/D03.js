/* D03 行人模擬（社會力模型）：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = Math.PI*2;
const ACC = "#F2C46D";   // 少量第二色點綴（出口、合力、壓力高點）

/* ---------------- 共用核心 ---------------- */
// 點到線段：回傳 [dx, dy, 距離]（由線段最近點指向點）
function segD(px, py, s){
  const [ax,ay,bx,by] = s, dx = bx-ax, dy = by-ay, L = dx*dx + dy*dy || 1e-9;
  let t = ((px-ax)*dx + (py-ay)*dy)/L; t = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = ax + dx*t, qy = ay + dy*t; return [px-qx, py-qy, Math.hypot(px-qx, py-qy)];
}
// 線段 (x1,y1)-(x2,y2) 是否與牆線相交
function cross(x1, y1, x2, y2, s){ const [ax,ay,bx,by] = s, d = (x2-x1)*(by-ay) - (y2-y1)*(bx-ax); if(Math.abs(d) < 1e-12) return false;
  const t = ((ax-x1)*(by-ay) - (ay-y1)*(bx-ax))/d, u = ((ax-x1)*(y2-y1) - (ay-y1)*(x2-x1))/d; return t >= 0 && t <= 1 && u >= 0 && u <= 1; }
// 建立一個行人
function A(x, y, o){ return Object.assign({x, y, vx:0, vy:0, t:[[x,y]]}, o || {}); }
// 社會力模擬（領域單位，不是像素）
// o.dir(p,st)→期望方向；walls 線段；obs 圓 [x,y,R]；rad 個人半徑；speed 期望速度；kP 人推人；kW 牆推人
// o.force(p,st) 額外力；o.done(p) 抵達判定；o.each(P,st) 每步後呼叫；p.start 延遲出發
function sim(P, o){
  const walls = o.walls || [], obs = o.obs || [], rad = o.rad || 1.4, sp = o.speed || .55, steps = o.steps || 220, rec = o.rec || 2;
  const cs = rad*2, kP = o.kP ?? .3, kW = o.kW ?? .5, key = (i,j) => (i+1000)*10000 + j + 1000;
  for(let st = 0; st < steps; st++){
    const HM = new Map();
    for(const p of P){ if(p.done || p.start > st) continue; const k = key(Math.floor(p.x/cs), Math.floor(p.y/cs)); let L = HM.get(k); if(!L) HM.set(k, L = []); L.push(p); }
    for(const p of P){
      if(p.done || p.start > st) continue;
      const d = o.dir(p, st), s0 = p.sp || sp; let fx = (d[0]*s0 - p.vx)*.5, fy = (d[1]*s0 - p.vy)*.5;
      const ix = Math.floor(p.x/cs), iy = Math.floor(p.y/cs);
      for(let a = -1; a <= 1; a++) for(let b = -1; b <= 1; b++){ const L = HM.get(key(ix+a, iy+b)); if(!L) continue;
        for(const q of L){ if(q === p) continue; const dx = p.x-q.x, dy = p.y-q.y, dd = Math.hypot(dx,dy); if(dd < cs && dd > 1e-6){ const f = kP*(cs-dd)/dd; fx += dx*f; fy += dy*f; } } }
      for(const s of walls){ const [dx,dy,dd] = segD(p.x, p.y, s); if(dd < rad*1.6 && dd > 1e-6){ const f = kW*(rad*1.6-dd)/dd; fx += dx*f; fy += dy*f; } }
      for(const [ox,oy,R] of obs){ const dx = p.x-ox, dy = p.y-oy, dd = Math.hypot(dx,dy), e = R + rad*1.4; if(dd < e && dd > 1e-6){ const f = kW*(e-dd)/dd; fx += dx*f; fy += dy*f; } }
      if(o.force){ const e = o.force(p, st); fx += e[0]; fy += e[1]; }
      p.vx += fx; p.vy += fy; const v = Math.hypot(p.vx, p.vy), vm = s0*1.8; if(v > vm){ p.vx *= vm/v; p.vy *= vm/v; }
      const ox0 = p.x, oy0 = p.y; p.x += p.vx; p.y += p.vy;
      // 硬性不穿牆：這一步若跨過牆線就退回
      for(const s of walls) if(cross(ox0, oy0, p.x, p.y, s)){ p.x = ox0; p.y = oy0; p.vx *= -.2; p.vy *= -.2; break; }
      for(const s of walls){ const [dx,dy,dd] = segD(p.x, p.y, s); if(dd < .55 && dd > 1e-6){ p.x += dx/dd*(.55-dd); p.y += dy/dd*(.55-dd); } }
      if(st % rec === 0) p.t.push([p.x, p.y]);
      if(o.done && o.done(p)){ p.done = true; p.end = st; p.t.push([p.x, p.y]); }
    }
    if(o.each) o.each(P, st);
  }
  return P;
}
// 導航場：網格上從目標往外算距離（8 鄰居），回傳 {D, dir(x,y)}
function nav(n, m, cs, blocked, targets){
  const B = new Uint8Array(n*m), D = new Float32Array(n*m).fill(1e9), Q = [];
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) B[j*n+i] = blocked(i,j) ? 1 : 0;
  targets.forEach(([i,j]) => { const k = j*n+i; if(!B[k] && D[k] > 0){ D[k] = 0; Q.push(k); } });
  const N8 = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  let h = 0;
  while(h < Q.length){ const k = Q[h++], i = k % n, j = (k/n)|0;
    for(const [a,b,w] of N8){ const x = i+a, y = j+b; if(x < 0 || y < 0 || x >= n || y >= m) continue; const nk = y*n+x; if(B[nk]) continue;
      if(a && b && (B[j*n+x] || B[y*n+i])) continue;
      if(D[k] + w < D[nk] - 1e-6){ D[nk] = D[k] + w; Q.push(nk); } } }
  const dir = (x, y) => {
    let i = Math.max(0, Math.min(n-1, Math.floor(x/cs))), j = Math.max(0, Math.min(m-1, Math.floor(y/cs)));
    let best = D[j*n+i], bi = i, bj = j;
    for(const [a,b] of N8){ const xx = i+a, yy = j+b; if(xx < 0 || yy < 0 || xx >= n || yy >= m) continue; const v = D[yy*n+xx]; if(v < best){ best = v; bi = xx; bj = yy; } }
    if(bi === i && bj === j) return null;
    const tx = (bi+.5)*cs - x, ty = (bj+.5)*cs - y, l = Math.hypot(tx,ty) || 1; return [tx/l, ty/l];
  };
  return {D, B, dir};
}
// 把線段集合柵格化成阻擋判定
const blockBy = (walls, cs, th) => (i,j) => { const x = (i+.5)*cs, y = (j+.5)*cs; for(const s of walls) if(segD(x,y,s)[2] < th) return true; return false; };
const unit = (x, y) => { const l = Math.hypot(x,y) || 1; return [x/l, y/l]; };
function arrow(g, x1, y1, x2, y2, hs){
  const a = Math.atan2(y2-y1, x2-x1); g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
  g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2 - hs*Math.cos(a-.45), y2 - hs*Math.sin(a-.45)); g.lineTo(x2 - hs*Math.cos(a+.45), y2 - hs*Math.sin(a+.45)); g.closePath(); g.fill();
}
function trail(g, t, s, jump){ g.beginPath(); let px = null, py = null; t.forEach(([x,y],i) => { if(i === 0 || (jump && Math.abs(x-px) > jump)) g.moveTo(x*s, y*s); else g.lineTo(x*s, y*s); px = x; py = y; }); g.stroke(); }
function wallsDraw(g, walls, s, lw, col){ g.strokeStyle = col || "rgba(255,255,255,.85)"; g.lineWidth = lw; g.lineCap = "square"; walls.forEach(w => { g.beginPath(); g.moveTo(w[0]*s, w[1]*s); g.lineTo(w[2]*s, w[3]*s); g.stroke(); }); g.lineCap = "butt"; }
function rectW(x0, y0, x1, y1){ return [[x0,y0,x1,y0],[x1,y0,x1,y1],[x1,y1,x0,y1],[x0,y1,x0,y0]]; }
// 模糊一個網格
function blur(G, n, m, k){ let a = G, b = new Float32Array(n*m); for(let t = 0; t < k; t++){ for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ let s = 0, c = 0; for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){ const x = i+dx, y = j+dy; if(x < 0 || y < 0 || x >= n || y >= m) continue; s += a[y*n+x]; c++; } b[j*n+i] = s/c; } [a,b] = [b,a]; } return a; }
// 計數網格上的熱圖模擬：從左側入口走到右側兩個出口，柱子與中央櫃台阻擋
function heatRun(r, h, n){
  const cw = 100/n, m = Math.round(h/cw), G = new Float32Array(n*m), obs = [[50, h*.5, h*.14]];
  for(let a = 0; a < 3; a++) for(let b = 0; b < 2; b++) obs.push([25 + a*25, h*(.2 + b*.6), 1.8]);
  const ex = [[100, h*.2], [100, h*.8]], P = [];
  for(let i = 0; i < 150; i++){ const top = r() < .5; P.push(A(-2 - r()*6, h*(top ? .3 : .7) + (r()-.5)*h*.2, {e: ex[r() < .5 ? 0 : 1], start: (r()*120)|0})); }
  sim(P, {obs, steps: 300, rec: 4, speed: .7, dir: p => unit(p.e[0]-p.x, p.e[1]-p.y), done: p => p.x > 99,
    each: Q => { for(const p of Q){ if(p.done || p.start > 0 && p.t.length < 2) continue; const i = Math.floor(p.x/cw), j = Math.floor(p.y/cw); if(i >= 0 && j >= 0 && i < n && j < m) G[j*n+i]++; } } });
  const B = blur(G, n, m, 2); let mx = 0; for(const v of B) mx = Math.max(mx, v);
  for(let i = 0; i < B.length; i++) B[i] /= mx || 1;
  return {n, m, cw, G: B, obs, P};
}

/* ---------------- 變形 ---------------- */
ART.var["D03"] = [

  // V01 牆面與走廊：平面圖牆線（有門與門弧），人從房間經走廊流向出口
  function(g, W, H, r, c){
    const s = W/100, h = H/s, a = h*.42, b = h*.58, dw = 5, walls = [];
    const doorsT = [16 + r()*10, 64 + r()*10], doorsB = [26 + r()*10, 74 + r()*8];
    const cut = (y, doors) => { let x0 = 3; doors.forEach(d => { walls.push([x0,y,d,y]); x0 = d + dw; }); walls.push([x0,y,97,y]); };
    cut(a, doorsT); cut(b, doorsB);
    walls.push([3,3,97,3], [3,h-3,97,h-3], [3,3,3,h-3], [97,3,97,a], [97,b,97,h-3], [48,3,48,a], [55,b,55,h-3]);
    const cs = 2, n = 50, m = Math.ceil(h/cs), NV = nav(n, m, cs, blockBy(walls, cs, 1.3), [...Array(m)].map((_,j) => [n-1, j]).filter(([i,j]) => (j+.5)*cs > a && (j+.5)*cs < b));
    const P = []; while(P.length < 110){ const top = r() < .5, x = 6 + r()*88, y = top ? 6 + r()*(a-10) : b + 4 + r()*(h-b-10); if(Math.abs(x - (top ? 48 : 55)) < 3) continue; P.push(A(x, y)); }
    sim(P, {walls, steps: 320, rec: 3, dir: p => NV.dir(p.x, p.y) || [1,0], done: p => p.x > 99});
    g.fillStyle = "rgba(255,255,255,.035)"; g.fillRect(3*s, a*s, 94*s, (b-a)*s);
    g.lineWidth = 1; g.strokeStyle = U.rgba(c, .42); P.forEach(p => trail(g, p.t, s));
    g.fillStyle = "rgba(255,255,255,.7)"; P.forEach(p => { g.fillRect(p.t[0][0]*s-1, p.t[0][1]*s-1, 2, 2); });
    wallsDraw(g, walls, s, s*1.2);
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8;
    doorsT.forEach(d => { g.beginPath(); g.moveTo(d*s, a*s); g.lineTo(d*s, (a-dw)*s); g.arc(d*s, a*s, dw*s, -Math.PI/2, 0); g.stroke(); });
    doorsB.forEach(d => { g.beginPath(); g.moveTo(d*s, b*s); g.lineTo(d*s, (b+dw)*s); g.arc(d*s, b*s, dw*s, Math.PI/2, 0, true); g.stroke(); });
    g.fillStyle = ACC; g.strokeStyle = ACC; g.lineWidth = 1.5; arrow(g, 92*s, h*.5*s, 99.5*s, h*.5*s, 5);
  },

  // V02 多出口疏散：方形大廳三個出口，依選擇的出口分色，出口外的刻度條表示負荷
  function(g, W, H, r, c){
    const s = W/100, h = H/s, x0 = 10, x1 = 90, y0 = 10, y1 = h-10, ew = 7;
    const E = [{x:x0, y:h*(.35 + r()*.3), nx:-1, ny:0}, {x:62 + r()*14, y:y0, nx:0, ny:-1}, {x:22 + r()*14, y:y1, nx:0, ny:1}];
    const walls = [];
    // 左牆
    walls.push([x0,y0,x0,E[0].y-ew/2], [x0,E[0].y+ew/2,x0,y1]);
    walls.push([x0,y0,E[1].x-ew/2,y0], [E[1].x+ew/2,y0,x1,y0]);
    walls.push([x0,y1,E[2].x-ew/2,y1], [E[2].x+ew/2,y1,x1,y1]);
    walls.push([x1,y0,x1,y1]);
    const obs = []; for(let i = 0; i < 3; i++) for(let j = 0; j < 2; j++) obs.push([x0 + (x1-x0)*(i+1)/4, y0 + (y1-y0)*(j+1)/3, 1.6]);
    const cnt = [0,0,0], P = [];
    for(let k = 0; k < 150; k++){ const x = x0 + 3 + r()*(x1-x0-6), y = y0 + 3 + r()*(y1-y0-6);
      let bi = 0, bc = 1e9; E.forEach((e,i) => { const cost = Math.hypot(e.x-x, e.y-y) + cnt[i]*.35; if(cost < bc){ bc = cost; bi = i; } }); cnt[bi]++; P.push(A(x, y, {e: bi})); }
    sim(P, {walls, obs, steps: 300, rec: 3, speed: .6, dir: p => { const e = E[p.e], dx = e.x - p.x, dy = e.y - p.y; return Math.hypot(dx,dy) < 3 ? [e.nx, e.ny] : unit(dx, dy); },
      done: p => p.x < x0-4 || p.y < y0-4 || p.y > y1+4 || p.x > x1+4});
    const col = [c, "#FFFFFF", ACC];
    g.lineWidth = 1; P.forEach(p => { g.strokeStyle = U.rgba(col[p.e] === "#FFFFFF" ? "#FFFFFF" : col[p.e], .38); trail(g, p.t, s); });
    g.fillStyle = "rgba(255,255,255,.25)"; obs.forEach(([x,y,R]) => { g.beginPath(); g.arc(x*s, y*s, R*s, 0, TAU); g.fill(); });
    wallsDraw(g, walls, s, s*1.3);
    // 各出口的負荷刻度（每 5 人一格）
    E.forEach((e,i) => { const k = Math.ceil(cnt[i]/5); g.fillStyle = col[i];
      for(let t = 0; t < k; t++){ const d = 3 + t*1.6; if(e.nx) g.fillRect((e.x + e.nx*d)*s - (e.nx < 0 ? 1.2*s : 0), (e.y - ew/2)*s, 1.2*s*.8, ew*s); else g.fillRect((e.x - ew/2)*s, (e.y + e.ny*d)*s - (e.ny < 0 ? 1.2*s : 0), ew*s, 1.2*s*.8); } });
  },

  // V03 雙向對流：長走廊的快照，兩組人（紫／白）自然排成車道
  function(g, W, H, r, c){
    const s = W/100, h = H/s, yA = h*.12, yB = h*.88, walls = [[0,yA,100,yA],[0,yB,100,yB]], P = [];
    for(let k = 0; k < 230; k++) P.push(A(r()*100, yA + 2 + r()*(yB-yA-4), {d: k % 2 ? 1 : -1}));
    sim(P, {walls, steps: 260, rec: 1, rad: 1.3, speed: .6, kP: .35, dir: p => [p.d, (r()-.5)*.25],
      each: Q => { for(const p of Q){ if(p.x > 100){ p.x -= 100; p.t.push(null); } else if(p.x < 0){ p.x += 100; p.t.push(null); } } } });
    g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(0, yA*s, W, (yB-yA)*s);
    wallsDraw(g, walls, s, 2);
    // 牆外的斜線
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; for(let x = -20; x < W+20; x += 7){ g.beginPath(); g.moveTo(x, yA*s-2); g.lineTo(x+6, yA*s-9); g.moveTo(x, yB*s+2); g.lineTo(x-6, yB*s+9); g.stroke(); }
    P.forEach(p => { const col = p.d > 0 ? c : "#FFFFFF", T = p.t.slice(-14);
      g.strokeStyle = U.rgba(col, .45); g.lineWidth = 1.2; g.beginPath(); let pen = false;
      T.forEach(q => { if(!q){ pen = false; return; } if(!pen){ g.moveTo(q[0]*s, q[1]*s); pen = true; } else g.lineTo(q[0]*s, q[1]*s); }); g.stroke();
      g.fillStyle = col; g.beginPath(); g.arc(p.x*s, p.y*s, 1.15*s, 0, TAU); g.fill(); });
    g.fillStyle = c; g.strokeStyle = c; g.lineWidth = 1.5; arrow(g, 4*s, yA*s*.5, 16*s, yA*s*.5, 4);
    g.fillStyle = "#fff"; g.strokeStyle = "#fff"; arrow(g, 96*s, (yB + (h-yB)*.5)*s, 84*s, (yB + (h-yB)*.5)*s, 4);
  },

  // V04 導航場：S 型平面上的距離場（等距色帶＋格點梯度箭頭），人沿梯度繞路
  function(g, W, H, r, c){
    const s = W/100, h = H/s, cs = 3, n = Math.ceil(100/cs), m = Math.ceil(h/cs);
    const w1 = h*(.3 + r()*.06), w2 = h*(.64 + r()*.06);
    const walls = [[1,1,99,1],[1,h-1,99,h-1],[1,1,1,h-1],[99,1,99,h-1],[1,w1,70,w1],[30,w2,99,w2],[48,w1,48,w1+ (w2-w1)*.45]];
    const tg = []; for(let i = n-4; i < n; i++) for(let j = m-4; j < m; j++) tg.push([i,j]);
    const NV = nav(n, m, cs, blockBy(walls, cs, cs*.75), tg);
    let mx = 0; NV.D.forEach(v => { if(v < 1e8) mx = Math.max(mx, v); });
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const v = NV.D[j*n+i]; if(v > 1e8) continue; const t = v/mx, band = Math.floor(v/3) % 2;
      g.fillStyle = U.rgba(c, .1 + .5*(1-t) + band*.07); g.fillRect(i*cs*s+.5, j*cs*s+.5, cs*s-1, cs*s-1); }
    g.strokeStyle = "rgba(255,255,255,.35)"; g.fillStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8;
    for(let j = 0; j < m; j += 2) for(let i = 0; i < n; i += 2){ if(NV.B[j*n+i]) continue; const x = (i+.5)*cs, y = (j+.5)*cs, d = NV.dir(x, y); if(!d) continue; arrow(g, x*s - d[0]*cs*s*.35, y*s - d[1]*cs*s*.35, x*s + d[0]*cs*s*.4, y*s + d[1]*cs*s*.4, 2.2); }
    const P = []; for(let k = 0; k < 26; k++) P.push(A(4 + r()*20, 4 + r()*(w1-8)));
    sim(P, {walls, steps: 420, rec: 3, speed: .7, dir: p => NV.dir(p.x, p.y) || [1,1], done: p => p.x > 90 && p.y > h-10});
    g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.2; P.forEach(p => trail(g, p.t, s));
    wallsDraw(g, walls, s, s*1.4);
    g.strokeStyle = ACC; g.lineWidth = 1.5; g.beginPath(); g.arc((100-cs*2)*s, (h-cs*2)*s, cs*1.6*s, 0, TAU); g.stroke();
  },

  // V05 空間格網加速：大量人群疊上雜湊格，只查選定者周圍 3×3 格
  function(g, W, H, r, c){
    const s = W/100, h = H/s, P = [], nz = U.vnoise(((r()*1e6)|0) + 3);
    for(let k = 0; k < 420; k++){ let x, y; do { x = r()*100; y = r()*h; } while(nz(x*.05, y*.05) < .35); P.push(A(x, y)); }
    sim(P, {steps: 25, rad: 1.1, speed: .3, dir: p => unit(60 - p.x, h*.5 - p.y)});
    const cs = 1.1*6*1.2, n = Math.ceil(100/cs), m = Math.ceil(h/cs), cnt = new Int32Array(n*m);
    P.forEach(p => { const i = Math.floor(p.x/cs), j = Math.floor(p.y/cs); if(i >= 0 && j >= 0 && i < n && j < m) cnt[j*n+i]++; });
    let mx = 1; cnt.forEach(v => mx = Math.max(mx, v));
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ if(!cnt[j*n+i]) continue; g.fillStyle = U.rgba(c, .06 + cnt[j*n+i]/mx*.28); g.fillRect(i*cs*s, j*cs*s, cs*s, cs*s); }
    g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 1; g.beginPath();
    for(let i = 0; i <= n; i++){ g.moveTo(i*cs*s, 0); g.lineTo(i*cs*s, H); } for(let j = 0; j <= m; j++){ g.moveTo(0, j*cs*s); g.lineTo(W, j*cs*s); } g.stroke();
    // 選一個格子最擠的人
    let bi = 0, bc = -1; for(let j = 1; j < m-1; j++) for(let i = 1; i < n-1; i++) if(cnt[j*n+i] > bc){ bc = cnt[j*n+i]; bi = j*n+i; }
    const ci = bi % n, cj = (bi/n)|0, me = P.find(p => Math.floor(p.x/cs) === ci && Math.floor(p.y/cs) === cj) || P[0];
    g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.strokeRect((ci-1)*cs*s, (cj-1)*cs*s, cs*3*s, cs*3*s);
    g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect((ci-1)*cs*s, (cj-1)*cs*s, cs*3*s, cs*3*s);
    const near = P.filter(p => p !== me && Math.abs(Math.floor(p.x/cs) - ci) <= 1 && Math.abs(Math.floor(p.y/cs) - cj) <= 1);
    g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = .7; near.forEach(p => { g.beginPath(); g.moveTo(me.x*s, me.y*s); g.lineTo(p.x*s, p.y*s); g.stroke(); });
    P.forEach(p => { const inn = near.includes(p); g.fillStyle = inn ? "#fff" : U.rgba(c, .85); g.beginPath(); g.arc(p.x*s, p.y*s, inn ? 1.6 : 1.3, 0, TAU); g.fill(); });
    g.fillStyle = ACC; g.beginPath(); g.arc(me.x*s, me.y*s, 3, 0, TAU); g.fill();
  },

  // V06 人流熱圖：柱列與中央櫃台的平面，停留計數做成滿版熱圖＋等值線
  function(g, W, H, r, c){
    const s = W/100, h = H/s, R = heatRun(r, h, 64);
    U.field(g, W, H, R.n, R.m, (i,j) => R.G[j*R.n+i]*1.25, c, .55);
    const seg = U.contour(R.n, R.m, (i,j) => R.G[j*R.n+i], .35).concat(U.contour(R.n, R.m, (i,j) => R.G[j*R.n+i], .65));
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8; g.beginPath(); seg.forEach(([a,b]) => { g.moveTo((a[0]+.5)*R.cw*s, (a[1]+.5)*R.cw*s); g.lineTo((b[0]+.5)*R.cw*s, (b[1]+.5)*R.cw*s); }); g.stroke();
    R.obs.forEach(([x,y,Rr]) => { g.fillStyle = "#15151B"; g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.2; g.beginPath(); g.arc(x*s, y*s, Rr*s, 0, TAU); g.fill(); g.stroke(); });
    g.fillStyle = "#fff"; g.fillRect(0, h*.2*s, 3, h*.6*s); g.fillStyle = ACC; g.fillRect(W-3, h*.12*s, 3, h*.16*s); g.fillRect(W-3, h*.72*s, 3, h*.16*s);
  },

  // V07 熱圖轉屋頂：把熱圖值當高度，等角視角的起伏頂棚＋落柱
  function(g, W, H, r, c){
    const h = 70, R = heatRun(r, h, 40), n = R.n, m = R.m;
    const P3 = (x, y, z) => { const u = x/100 - .5, v = (y/h - .5)*.7; return [W*.5 + (u - v)*W*.62, H*.64 + (u + v)*W*.3 - z*H*.32]; };
    const Z = (i,j) => .18 + R.G[Math.min(m-1,j)*n + Math.min(n-1,i)]*.85;
    // 地面平面與人流軌跡（投影在地上）
    g.fillStyle = "rgba(255,255,255,.04)"; U.poly(g, [P3(0,0,0), P3(100,0,0), P3(100,h,0), P3(0,h,0)], true); g.fill();
    g.strokeStyle = U.rgba(c, .25); g.lineWidth = .7; R.P.slice(0, 70).forEach(p => { U.poly(g, p.t.filter(q => q[0] >= 0 && q[0] <= 100).map(q => P3(q[0], q[1], 0))); g.stroke(); });
    // 落柱
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1;
    for(let i = 4; i < n; i += 9) for(let j = 3; j < m; j += 8){ const x = i*R.cw, y = j*R.cw, a = P3(x, y, 0), b = P3(x, y, Z(i,j)); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
    // 屋頂格線
    const line = (pts) => { for(let k = 1; k < pts.length; k++){ const [i0,j0] = pts[k-1], [i1,j1] = pts[k], z = (Z(i0,j0) + Z(i1,j1))/2;
      g.strokeStyle = U.rgba(z > .7 ? "#FFFFFF" : c, .35 + z*.6); g.beginPath(); g.moveTo(...P3(i0*R.cw, j0*R.cw, Z(i0,j0))); g.lineTo(...P3(i1*R.cw, j1*R.cw, Z(i1,j1))); g.stroke(); } };
    g.lineWidth = .9;
    for(let j = 0; j < m; j += 2) line([...Array(n)].map((_,i) => [i,j]));
    for(let i = 0; i < n; i += 2) line([...Array(m)].map((_,j) => [i,j]));
  },

  // V08 曲面／多樓層：三層樓板疊成等角視圖，各層人流走向樓梯，樓梯連接上下層
  function(g, W, H, r, c){
    const D = 60, zg = H*.25, P3 = (x, y, k) => { const u = x/100 - .5, v = y/D - .5; return [W*.5 + (u - v*.9)*W*.56, H*.8 + (u*.32 + v*.42)*W*.56 - k*zg]; };
    const stairs = [[88, 50], [12, 10]];   // 第 k 層（k≥1）往下的樓梯位置
    for(let k = 2; k >= 0; k--){
      const obs = []; for(let a = 0; a < 3; a++) obs.push([25 + a*25, 30 + (r()-.5)*10, 2.2]);
      const goal = k === 0 ? [100, 30] : stairs[k-1], P = [];
      for(let q = 0; q < 34; q++) P.push(A(5 + r()*90, 5 + r()*50));
      sim(P, {obs, steps: 200, rec: 3, speed: .7, dir: p => unit(goal[0]-p.x, goal[1]-p.y), done: p => Math.hypot(goal[0]-p.x, goal[1]-p.y) < 2.5 || p.x > 100});
      // 樓板
      const slab = [P3(0,0,k), P3(100,0,k), P3(100,D,k), P3(0,D,k)];
      g.fillStyle = "rgba(24,24,31,.88)"; U.poly(g, slab, true); g.fill();
      g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.stroke();
      g.fillStyle = "rgba(255,255,255,.3)"; obs.forEach(([x,y]) => { const [X,Y] = P3(x,y,k); g.fillRect(X-1.5, Y-1.5, 3, 3); });
      g.strokeStyle = U.rgba(k === 2 ? "#FFFFFF" : c, .55); g.lineWidth = .8; P.forEach(p => { U.poly(g, p.t.map(q => P3(q[0], q[1], k))); g.stroke(); });
      // 往下的樓梯：鋸齒踏步
      if(k > 0){ const [sx, sy] = stairs[k-1], a = P3(sx, sy, k), b = P3(sx + (k === 2 ? -14 : 14), sy + (k === 2 ? -8 : 8), k-1), N = 9;
        g.strokeStyle = ACC; g.lineWidth = 1.2; g.beginPath(); g.moveTo(...a);
        for(let t = 1; t <= N; t++){ const x = a[0] + (b[0]-a[0])*t/N, y = a[1] + (b[1]-a[1])*t/N; g.lineTo(a[0] + (b[0]-a[0])*(t-1)/N, y); g.lineTo(x, y); } g.stroke(); }
    }
    g.fillStyle = ACC; const e = P3(100, 30, 0); g.fillRect(e[0]-2, e[1]-6, 4, 12);
  },

  // V09 吸引點：展場攤位的光暈與停留點（圓越大停越久），動線被吸引而繞行
  function(g, W, H, r, c){
    const s = W/100, h = H/s, B = [];
    while(B.length < 6){ const x = 18 + r()*64, y = 10 + r()*(h-20); if(B.every(q => Math.hypot(q[0]-x, q[1]-y) > 20)) B.push([x, y]); }
    const walls = [[2,2,98,2],[2,h-2,98,h-2],[2,2,2,h*.42],[2,h*.58,2,h-2],[98,2,98,h*.42],[98,h*.58,98,h-2]];
    const obs = B.map(([x,y]) => [x, y, 2.6]), P = [];
    for(let k = 0; k < 110; k++) P.push(A(-1, h*.5 + (r()-.5)*h*.12, {start: k*2.6, tg: null, dw: 0, vis: new Set(), stops: []}));
    sim(P, {walls, obs, steps: 420, rec: 3, speed: .6, dir: p => {
        if(p.dw > 0){ p.dw--; if(p.dw === 0) p.tg = null; return [0,0]; }
        if(p.tg === null){ for(let i = 0; i < B.length; i++){ if(p.vis.has(i)) continue; if(Math.hypot(B[i][0]-p.x, B[i][1]-p.y) < 16){ p.vis.add(i); if(r() < .55){ p.tg = i; break; } } } }
        if(p.tg !== null){ const [bx,by] = B[p.tg]; if(Math.hypot(bx-p.x, by-p.y) < 5.5){ p.dw = 20 + (r()*60)|0; p.stops.push([p.x, p.y, p.dw]); return [0,0]; } return unit(bx-p.x, by-p.y); }
        return unit(101-p.x, h*.5-p.y); }, done: p => p.x > 100});
    B.forEach(([x,y]) => { const gr = g.createRadialGradient(x*s, y*s, 0, x*s, y*s, 16*s); gr.addColorStop(0, U.rgba(c, .38)); gr.addColorStop(1, U.rgba(c, 0)); g.fillStyle = gr; g.fillRect(x*s-16*s, y*s-16*s, 32*s, 32*s); });
    g.strokeStyle = U.rgba(c, .5); g.lineWidth = .8; P.forEach(p => trail(g, p.t, s));
    g.fillStyle = "rgba(255,255,255,.22)"; g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = .7;
    P.forEach(p => p.stops.forEach(([x,y,d]) => { g.beginPath(); g.arc(x*s, y*s, Math.sqrt(d)*.35*s, 0, TAU); g.fill(); g.stroke(); }));
    B.forEach(([x,y]) => { g.fillStyle = ACC; g.fillRect((x-2.6)*s, (y-1.8)*s, 5.2*s, 3.6*s); });
    wallsDraw(g, walls, s, s*1.1);
  },

  // V10 動畫化與即時調整：洋蔥皮疊影（時間越晚越亮），障礙被拖動，下方是時間軸
  function(g, W, H, r, c){
    const s = W/100, h = H/s, yA = 6, yB = h - 16, obs = [[42, (yA+yB)*.5 + (r()-.5)*6, 7]], from = obs[0].slice(), to = [62, yA + (yB-yA)*(.3 + r()*.4), 7];
    const walls = [[0,yA,100,yA],[0,yB,100,yB]], P = [], shots = [], T = [50, 100, 150, 200, 250];
    for(let k = 0; k < 140; k++) P.push(A(-2 - r()*4, yA + 2 + r()*(yB-yA-4), {start: (k*1.8)|0}));
    sim(P, {walls, obs, steps: 260, rec: 4, speed: .65, dir: p => [1, 0], done: p => p.x > 101,
      each: (Q, st) => { if(st === 120){ obs[0][0] = to[0]; obs[0][1] = to[1]; } if(T.includes(st)) shots.push(Q.filter(p => !p.done && p.start <= st).map(p => [p.x, p.y])); } });
    shots.forEach((S, k) => { const last = k === shots.length-1; g.fillStyle = last ? "#fff" : U.rgba(c, .18 + k*.16); S.forEach(([x,y]) => { g.beginPath(); g.arc(x*s, y*s, last ? 1.2*s : 1*s, 0, TAU); g.fill(); }); });
    g.setLineDash([3,3]); g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1; g.beginPath(); g.arc(from[0]*s, from[1]*s, from[2]*s, 0, TAU); g.stroke(); g.setLineDash([]);
    g.fillStyle = "rgba(255,255,255,.12)"; g.strokeStyle = "#fff"; g.lineWidth = 1.4; g.beginPath(); g.arc(to[0]*s, to[1]*s, to[2]*s, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = ACC; g.fillStyle = ACC; g.lineWidth = 1.4; arrow(g, from[0]*s, from[1]*s, (to[0] - (to[0]-from[0])*.25)*s, (to[1] - (to[1]-from[1])*.25)*s, 5);
    g.fillRect(to[0]*s-3, to[1]*s-3, 6, 6);
    wallsDraw(g, walls, s, 1.5, "rgba(255,255,255,.6)");
    // 時間軸
    const ty = (h - 7)*s; g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(14*s, ty); g.lineTo(94*s, ty); g.stroke();
    g.strokeStyle = c; g.beginPath(); g.moveTo(14*s, ty); g.lineTo(80*s, ty); g.stroke();
    g.fillStyle = "rgba(255,255,255,.5)"; for(let k = 0; k <= 10; k++) g.fillRect((14 + k*8)*s - .5, ty + 4, 1, 3);
    g.fillStyle = "#fff"; g.beginPath(); g.arc(80*s, ty, 3.5, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(4*s, ty - 4); g.lineTo(4*s + 7, ty); g.lineTo(4*s, ty + 4); g.closePath(); g.fill();
  },

  // V11 軌跡轉成地景：慾望路徑的疊加量做成分層切割的等角模型板
  function(g, W, H, r, c){
    const D = 70, n = 56, cw = 100/n, m = Math.round(D/cw), G = new Float32Array(n*m);
    const gates = [[0, D*.3], [0, D*.8], [40, 0], [85, 0], [100, D*.55], [55, D]], trees = [];
    for(let k = 0; k < 7; k++) trees.push([15 + r()*70, 12 + r()*46, 2.5]);
    const P = []; for(let k = 0; k < 120; k++){ const a = (r()*gates.length)|0; let b = (r()*gates.length)|0; if(b === a) b = (a+2) % gates.length; P.push(A(gates[a][0], gates[a][1], {e: gates[b], start: (r()*120)|0})); }
    sim(P, {obs: trees, steps: 360, rec: 3, speed: .75, dir: p => unit(p.e[0]-p.x, p.e[1]-p.y), done: p => Math.hypot(p.e[0]-p.x, p.e[1]-p.y) < 2,
      each: Q => { for(const p of Q){ if(p.done || p.t.length < 2) continue; const i = Math.floor(p.x/cw), j = Math.floor(p.y/cw); if(i >= 0 && j >= 0 && i < n && j < m) G[j*n+i]++; } } });
    const B = blur(G, n, m, 1); let mx = 0; B.forEach(v => mx = Math.max(mx, v)); for(let i = 0; i < B.length; i++) B[i] = Math.min(1, B[i]/mx*2.2);
    const P3 = (x, y, z) => { const u = x/100 - .5, v = y/D - .5; return [W*.5 + (u - v*.8)*W*.66, H*.56 + (u*.34 + v*.44)*W*.66 - z]; };
    // 底板（有厚度）
    const th = H*.05, base = [P3(0,0,0), P3(100,0,0), P3(100,D,0), P3(0,D,0)];
    g.fillStyle = "rgba(255,255,255,.05)"; U.poly(g, [base[1], base[2], [base[2][0], base[2][1]+th], [base[1][0], base[1][1]+th]], true); g.fill();
    U.poly(g, [base[2], base[3], [base[3][0], base[3][1]+th], [base[2][0], base[2][1]+th]], true); g.fill();
    g.fillStyle = "rgba(255,255,255,.08)"; U.poly(g, base, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "rgba(255,255,255,.3)"; trees.forEach(([x,y,R]) => { const [X,Y] = P3(x,y,0); g.beginPath(); g.ellipse(X, Y, R*W*.0066, R*W*.0035, 0, 0, TAU); g.fill(); });
    // 三層切割線，每層往上抬
    [.12, .35, .65].forEach((iso, k) => { const z = (k+1)*H*.035, seg = U.contour(n, m, (i,j) => B[j*n+i], iso);
      g.strokeStyle = k === 2 ? ACC : k === 1 ? "#fff" : c; g.lineWidth = k === 0 ? 1.4 : 1; g.beginPath();
      seg.forEach(([a,b]) => { const A1 = P3((a[0]+.5)*cw, (a[1]+.5)*cw, z), B1 = P3((b[0]+.5)*cw, (b[1]+.5)*cw, z); g.moveTo(...A1); g.lineTo(...B1); }); g.stroke();
      if(k === 0){ g.strokeStyle = U.rgba(c, .35); g.beginPath(); seg.forEach(([a,b]) => { const A1 = P3((a[0]+.5)*cw, (a[1]+.5)*cw, 0), B1 = P3((b[0]+.5)*cw, (b[1]+.5)*cw, 0); g.moveTo(...A1); g.lineTo(...B1); }); g.stroke(); } });
  },

  // V12 Space syntax 可見度：可見度半色調點＋最佳點的 isovist 多邊形，人流集中在開闊主軸
  function(g, W, H, r, c){
    const s = W/100, h = H/s, cs = 2.5, n = Math.ceil(100/cs), m = Math.ceil(h/cs), occ = new Uint8Array(n*m), blocks = [];
    const axisY = h*(.4 + r()*.2);
    while(blocks.length < 9){ const w = 10 + r()*18, hh = 8 + r()*14, x = r()*(100-w), y = r()*(h-hh);
      if(y < axisY + 5 && y + hh > axisY - 5) continue; if(blocks.some(b => x < b[2]+4 && x+w > b[0]-4 && y < b[3]+4 && y+hh > b[1]-4)) continue; blocks.push([x, y, x+w, y+hh]); }
    blocks.forEach(([x0,y0,x1,y1]) => { for(let j = Math.floor(y0/cs); j < Math.ceil(y1/cs); j++) for(let i = Math.floor(x0/cs); i < Math.ceil(x1/cs); i++) if(i >= 0 && j >= 0 && i < n && j < m) occ[j*n+i] = 1; });
    const free = (x, y) => { const i = Math.floor(x/cs), j = Math.floor(y/cs); return i >= 0 && j >= 0 && i < n && j < m && !occ[j*n+i]; };
    const ray = (x, y, a, st) => { const dx = Math.cos(a)*st, dy = Math.sin(a)*st; let d = 0; while(free(x, y) && d < 140){ x += dx; y += dy; d += st; } return [d, x, y]; };
    const V = new Float32Array(n*m); let mx = 0, best = 0;
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ if(occ[j*n+i]) continue; let t = 0; for(let k = 0; k < 16; k++) t += ray((i+.5)*cs, (j+.5)*cs, k*TAU/16 + .1, 1.6)[0]; V[j*n+i] = t; if(t > mx){ mx = t; best = j*n+i; } }
    // 半色調
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ if(occ[j*n+i]) continue; const t = V[j*n+i]/mx; g.fillStyle = U.rgba(c, .35 + t*.6); g.beginPath(); g.arc((i+.5)*cs*s, (j+.5)*cs*s, Math.max(.3, t*cs*.48*s), 0, TAU); g.fill(); }
    g.fillStyle = "rgba(255,255,255,.07)"; g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; blocks.forEach(([x0,y0,x1,y1]) => { g.fillRect(x0*s, y0*s, (x1-x0)*s, (y1-y0)*s); g.strokeRect(x0*s, y0*s, (x1-x0)*s, (y1-y0)*s); });
    // isovist
    const bx = (best % n + .5)*cs, by = (((best/n)|0) + .5)*cs, iso = [];
    for(let k = 0; k < 120; k++){ const [, x, y] = ray(bx, by, k*TAU/120, .6); iso.push([x*s, y*s]); }
    g.fillStyle = "rgba(255,255,255,.1)"; U.poly(g, iso, true); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = ACC; g.beginPath(); g.arc(bx*s, by*s, 3.5, 0, TAU); g.fill();
  },
];
ART.var["D03"][4].ratio = .8;
ART.var["D03"][2].ratio = .78;
ART.var["D03"][7].ratio = 1.3;
ART.var["D03"][9].ratio = .85;
ART.var["D03"][10].ratio = 1.0;

/* ---------------- 案例 ---------------- */

// D03-01 社會力模型：單一行人的受力圖（目標驅動力、他人與牆的指數排斥、合力）
ART.case["D03-01"] = function(g, W, H, r, c){
  const R = W*.065, cx = W*(.46 + (r()-.5)*.06), cy = H*.58, gx = W*.86, gy = H*.12;
  // 牆（左側，斜線填）
  const wx = W*.1; g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 2; g.beginPath(); g.moveTo(wx, H*.08); g.lineTo(wx, H*.95); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; for(let y = H*.08; y < H*.95; y += 8){ g.beginPath(); g.moveTo(wx, y); g.lineTo(wx - 8, y + 8); g.stroke(); }
  // 走過的軌跡
  g.setLineDash([2,4]); g.strokeStyle = U.rgba(c, .6); g.lineWidth = 1.3; g.beginPath(); g.moveTo(cx - W*.15, H*.98); g.quadraticCurveTo(cx - W*.12, cy + H*.1, cx, cy); g.stroke(); g.setLineDash([]);
  // 鄰人與指數衰減環
  const nb = []; for(let k = 0; k < 4; k++){ const a = -Math.PI*.1 + k*TAU/4 + r()*.6, d = R*(2.6 + r()*1.4); nb.push([cx + Math.cos(a)*d, cy + Math.sin(a)*d]); }
  nb.forEach(([x,y]) => { for(let q = 1; q <= 3; q++){ g.strokeStyle = `rgba(255,255,255,${.28/q})`; g.setLineDash([2,3]); g.beginPath(); g.arc(x, y, R*(1 + q*.7), 0, TAU); g.stroke(); } g.setLineDash([]);
    g.fillStyle = "rgba(255,255,255,.15)"; g.strokeStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill(); g.stroke(); });
  // 力
  let sx = 0, sy = 0; const L = W*.2;
  const [ux, uy] = unit(gx - cx, gy - cy); sx += ux*L; sy += uy*L;
  g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 2.4; arrow(g, cx, cy, cx + ux*L, cy + uy*L, 8);
  g.strokeStyle = "#fff"; g.fillStyle = "#fff"; g.lineWidth = 1.5;
  nb.forEach(([x,y]) => { const d = Math.hypot(cx-x, cy-y), f = L*1.6*Math.exp(-(d - 2*R)/(R*1.2)), [ex,ey] = unit(cx-x, cy-y); sx += ex*f*.6; sy += ey*f*.6; arrow(g, cx + ex*R, cy + ey*R, cx + ex*(R + f*.6), cy + ey*(R + f*.6), 5); });
  const fw = L*1.2*Math.exp(-(cx - wx)/(W*.2)); sx += fw; arrow(g, cx - R, cy, cx - R + fw, cy, 5);
  g.strokeStyle = "rgba(255,255,255,.3)"; g.setLineDash([2,2]); g.beginPath(); g.moveTo(wx, cy); g.lineTo(cx - R, cy); g.stroke(); g.setLineDash([]);
  g.fillStyle = U.rgba(c, .85); g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill(); g.stroke();
  g.strokeStyle = ACC; g.fillStyle = ACC; g.lineWidth = 3; arrow(g, cx, cy, cx + sx, cy + sy, 10);
  // 目標旗
  g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(gx, gy + 22); g.lineTo(gx, gy - 6); g.stroke();
  g.fillStyle = c; g.beginPath(); g.moveTo(gx, gy - 6); g.lineTo(gx + 14, gy - 1); g.lineTo(gx, gy + 4); g.closePath(); g.fill();
};
ART.case["D03-01"].ratio = 1.1;

// D03-02 逃生恐慌：出口前的拱形堵塞（上：無柱；下：出口前放柱子），圓盤顏色表示擠壓程度
ART.case["D03-02"] = function(g, W, H, r, c){
  const s = W/100, h = H/s, ph = h/2;
  [0, 1].forEach(k => {
    const oy = k*ph, cy = oy + ph/2, dx = 78, dw = 4.2;
    const walls = [[dx, oy+2, dx, cy - dw/2], [dx, cy + dw/2, dx, oy+ph-2], [2, oy+2, dx, oy+2], [2, oy+ph-2, dx, oy+ph-2], [2, oy+2, 2, oy+ph-2]];
    const obs = k ? [[dx - 5.5, cy, 1.8]] : [], P = [];
    for(let q = 0; q < 200; q++) P.push(A(8 + r()*66, oy + 4 + r()*(ph-8)));
    sim(P, {walls, obs, steps: 62, rec: 6, rad: 1.25, speed: .8, kP: .45, kW: .8, dir: p => p.x > dx ? [1,0] : unit(dx + 3 - p.x, cy - p.y), done: p => p.x > 120});
    // 平面
    wallsDraw(g, walls, s, s*1.1);
    const inside = P.filter(p => !p.done && p.x < dx);
    inside.forEach(p => { let k2 = 0; for(const q of inside) if(q !== p && Math.hypot(q.x-p.x, q.y-p.y) < 2.5) k2++; p.k = k2; });
    inside.forEach(p => { const t = Math.min(1, p.k/6); g.fillStyle = t > .75 ? ACC : U.rgba(c, .25 + t*.7); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .6; g.beginPath(); g.arc(p.x*s, p.y*s, 1.2*s, 0, TAU); g.fill(); g.stroke(); });
    g.fillStyle = "rgba(255,255,255,.75)"; P.filter(p => p.done || p.x >= dx).forEach(p => { g.beginPath(); g.arc(Math.min(98, p.x)*s, p.y*s, .8*s, 0, TAU); g.fill(); });
    if(k){ g.fillStyle = "#fff"; g.beginPath(); g.arc((dx-5.5)*s, cy*s, 1.8*s, 0, TAU); g.fill(); }
    // 出去的人數條
    const out = P.filter(p => p.x >= dx).length; g.fillStyle = k ? ACC : "rgba(255,255,255,.6)"; g.fillRect(84*s, (oy + ph - 5)*s, out/200*14*s, 1.6*s);
  });
  g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, ph*s); g.lineTo(W, ph*s); g.stroke();
};
ART.case["D03-02"].ratio = 1.25;

// D03-03 草地上的捷徑：主動行走者模型，踩出的痕跡越走越明顯，斜切過直角鋪面
ART.case["D03-03"] = function(g, W, H, r, c){
  const s = W/100, h = H/s, n = 80, cw = 100/n, m = Math.ceil(h/cw), T = new Float32Array(n*m);
  const x0 = 6, x1 = 94, y0 = 6, y1 = h-6;
  const ent = [[x0,y0],[x1,y0],[x0,y1],[x1,y1],[50,y0],[x0,h*.5],[x1,h*(.4 + r()*.2)],[30 + r()*40, y1]];
  const Wk = []; for(let k = 0; k < 50; k++){ const a = ent[(r()*ent.length)|0]; Wk.push({x: a[0], y: a[1], e: ent[(r()*ent.length)|0]}); }
  const Tv = (x, y) => { const i = Math.floor(x/cw), j = Math.floor(y/cw); return i < 0 || j < 0 || i >= n || j >= m ? 0 : T[j*n+i]; };
  for(let st = 0; st < 700; st++){
    for(const p of Wk){
      let dx = p.e[0]-p.x, dy = p.e[1]-p.y; const d = Math.hypot(dx,dy);
      if(d < 2){ p.e = ent[(r()*ent.length)|0]; continue; }
      dx /= d; dy /= d;
      // 往前方兩側探測既有痕跡
      let gx = 0, gy = 0; for(const a of [-.7, -.35, .35, .7]){ const ca = Math.cos(a), sa = Math.sin(a), vx = dx*ca - dy*sa, vy = dx*sa + dy*ca, t = Tv(p.x + vx*4, p.y + vy*4); gx += vx*t; gy += vy*t; }
      const [ux, uy] = unit(dx + gx*.06, dy + gy*.06); p.x += ux*.8; p.y += uy*.8;
      const i = Math.floor(p.x/cw), j = Math.floor(p.y/cw); if(i >= 0 && j >= 0 && i < n && j < m) T[j*n+i] += 1;
    }
    if(st % 10 === 0) for(let i = 0; i < T.length; i++) T[i] *= .985;
  }
  // 草地筆觸
  g.fillStyle = U.rgba(c, .1); g.fillRect(x0*s, y0*s, (x1-x0)*s, (y1-y0)*s);
  g.strokeStyle = U.rgba(c, .3); g.lineWidth = .8; g.beginPath();
  for(let k = 0; k < 700; k++){ const x = x0 + r()*(x1-x0), y = y0 + r()*(y1-y0); g.moveTo(x*s, y*s); g.lineTo(x*s + (r()-.5)*2, y*s - 3); } g.stroke();
  // 被踩出的土徑
  const Bt = blur(T, n, m, 1); let mx = 0; Bt.forEach(v => mx = Math.max(mx, v));
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const t = Bt[j*n+i]/mx; if(t < .06) continue; g.fillStyle = `rgba(236,222,196,${Math.min(.85, t*1.6)})`; g.fillRect(i*cw*s, j*cw*s, cw*s+.5, cw*s+.5); }
  // 原本的直角鋪面（外環＋十字）
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 2.5*s*.5; g.strokeRect(x0*s, y0*s, (x1-x0)*s, (y1-y0)*s);
  g.beginPath(); g.moveTo(50*s, y0*s); g.lineTo(50*s, h*.5*s); g.lineTo(x0*s, h*.5*s); g.stroke();
  // 樹
  for(let k = 0; k < 6; k++){ const x = 14 + r()*72, y = 14 + r()*(h-28); g.fillStyle = U.rgba(c, .45); g.beginPath(); g.arc(x*s, y*s, 3.2*s, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,.6)"; g.fillRect(x*s-1, y*s-1, 2, 2); }
  g.fillStyle = ACC; ent.forEach(([x,y]) => { g.beginPath(); g.arc(x*s, y*s, 2.4, 0, TAU); g.fill(); });
};
ART.case["D03-03"].ratio = .9;

// D03-04 軸線圖：街廓輪廓的單線稿，穿過開放空間的最長軸線依長度加粗
ART.case["D03-04"] = function(g, W, H, r, c){
  const s = W/100, h = H/s, occ = new Uint8Array(100*Math.ceil(h)), mh = Math.ceil(h), blocks = [];
  const xs = [0], ys = [0]; while(xs[xs.length-1] < 100) xs.push(xs[xs.length-1] + 12 + r()*16); while(ys[ys.length-1] < h) ys.push(ys[ys.length-1] + 10 + r()*16);
  for(let a = 0; a < xs.length-1; a++) for(let b = 0; b < ys.length-1; b++){
    if(r() < .12) continue;   // 廣場
    const st = 1.6 + r()*2.2, j = () => (r()-.5)*2.4;
    const q = [[xs[a]+st+j(), ys[b]+st+j()], [xs[a+1]-st+j(), ys[b]+st+j()], [xs[a+1]-st+j(), ys[b+1]-st+j()], [xs[a]+st+j(), ys[b+1]-st+j()]];
    blocks.push(q);
  }
  // 柵格化（點在凸四邊形內）
  const inQ = (q, x, y) => { for(let k = 0; k < 4; k++){ const [ax,ay] = q[k], [bx,by] = q[(k+1)%4]; if((bx-ax)*(y-ay) - (by-ay)*(x-ax) < 0) return false; } return true; };
  blocks.forEach(q => { const minx = Math.max(0, Math.floor(Math.min(...q.map(p => p[0])))), maxx = Math.min(99, Math.ceil(Math.max(...q.map(p => p[0])))), miny = Math.max(0, Math.floor(Math.min(...q.map(p => p[1])))), maxy = Math.min(mh-1, Math.ceil(Math.max(...q.map(p => p[1]))));
    for(let y = miny; y <= maxy; y++) for(let x = minx; x <= maxx; x++) if(inQ(q, x+.5, y+.5)) occ[y*100+x] = 1; });
  const free = (x, y) => x >= 0 && y >= 0 && x < 100 && y < h && !occ[Math.floor(y)*100 + Math.floor(x)];
  const L = [];
  for(let k = 0; k < 500; k++){ const x = r()*100, y = r()*h; if(!free(x,y)) continue; const a = (r() < .7 ? ((r()*2)|0)*Math.PI/2 : 0) + (r()-.5)*.5, dx = Math.cos(a)*.5, dy = Math.sin(a)*.5;
    let x1 = x, y1 = y, x2 = x, y2 = y; while(free(x1+dx, y1+dy)){ x1 += dx; y1 += dy; } while(free(x2-dx, y2-dy)){ x2 -= dx; y2 -= dy; }
    L.push([x1, y1, x2, y2, Math.hypot(x2-x1, y2-y1), a]); }
  L.sort((p,q) => q[4]-p[4]);
  const keep = []; for(const l of L){ if(keep.length >= 38) break; const mx = (l[0]+l[2])/2, my = (l[1]+l[3])/2;
    if(keep.some(k => Math.abs(Math.sin(k[5]-l[5])) < .12 && Math.abs((mx-(k[0]+k[2])/2)*Math.sin(k[5]) - (my-(k[1]+k[3])/2)*Math.cos(k[5])) < 2.5)) continue; keep.push(l); }
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = .8; blocks.forEach(q => { U.poly(g, q.map(([x,y]) => [x*s, y*s]), true); g.stroke(); });
  const top = keep[0] ? keep[0][4] : 1;
  keep.slice().reverse().forEach((l, i) => { const t = l[4]/top; g.strokeStyle = t > .75 ? ACC : t > .45 ? c : "rgba(255,255,255,.55)"; g.lineWidth = .6 + t*t*3; g.beginPath(); g.moveTo(l[0]*s, l[1]*s); g.lineTo(l[2]*s, l[3]*s); g.stroke(); });
};
ART.case["D03-04"].ratio = 1.05;

// D03-05 Trafalgar Square：廣場鳥瞰（美術館、大階梯、噴泉、紀念柱、道路），步行軌跡
ART.case["D03-05"] = function(g, W, H, r, c){
  const s = W/100, h = H/s, py0 = h*.3, py1 = h*.82, px0 = 14, px1 = 86;
  // 道路
  g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(0, py1*s, W, (h-py1)*s); g.fillRect(0, py0*s, px0*s, (py1-py0)*s); g.fillRect(px1*s, py0*s, (100-px1)*s, (py1-py0)*s);
  g.strokeStyle = "rgba(255,255,255,.3)"; g.setLineDash([5,5]); g.lineWidth = 1; g.beginPath(); g.moveTo(0, (py1 + (h-py1)/2)*s); g.lineTo(W, (py1 + (h-py1)/2)*s); g.moveTo(px0/2*s, py0*s); g.lineTo(px0/2*s, py1*s); g.moveTo((100-px0/2)*s, py0*s); g.lineTo((100-px0/2)*s, py1*s); g.stroke(); g.setLineDash([]);
  // 斑馬線
  g.fillStyle = "rgba(255,255,255,.45)"; for(const cx of [30, 70]) for(let k = 0; k < 6; k++) g.fillRect((cx - 5 + k*2)*s, (py1+1)*s, 1*s, (h-py1-2)*s);
  // 美術館
  g.fillStyle = "rgba(255,255,255,.1)"; g.fillRect(8*s, 2*s, 84*s, (py0-10)*s); g.strokeStyle = "rgba(255,255,255,.5)"; g.strokeRect(8*s, 2*s, 84*s, (py0-10)*s);
  g.fillStyle = "rgba(255,255,255,.55)"; for(let k = 0; k < 8; k++) g.fillRect((40 + k*2.8)*s, (py0-11)*s, 1.2, 1.2);
  // 大階梯（北側、步行化後新增）
  const sx0 = 36, sx1 = 64; g.strokeStyle = ACC; g.lineWidth = 1; for(let k = 0; k < 7; k++){ const y = py0 - 7 + k*1.1; g.beginPath(); g.moveTo(sx0*s, y*s); g.lineTo(sx1*s, y*s); g.stroke(); }
  // 廣場
  g.fillStyle = "rgba(255,255,255,.035)"; g.fillRect(px0*s, py0*s, (px1-px0)*s, (py1-py0)*s); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.2; g.strokeRect(px0*s, py0*s, (px1-px0)*s, (py1-py0)*s);
  const fy = py0 + (py1-py0)*.42, obs = [[34, fy, 7], [66, fy, 7], [50, py0 + (py1-py0)*.78, 3]];
  const P = [], ends = [[50, py0-8], [px0+2, py0+2], [px1-2, py0+2], [30, py1+2], [70, py1+2], [px0+1, py1-4], [px1-1, py1-4]];
  for(let k = 0; k < 140; k++){ const a = ends[(r()*ends.length)|0]; let b = ends[(r()*ends.length)|0]; if(b === a) b = ends[0]; P.push(A(a[0] + (r()-.5)*4, a[1], {e: b, start: (r()*150)|0})); }
  sim(P, {obs, steps: 330, rec: 3, speed: .6, dir: p => unit(p.e[0]-p.x, p.e[1]-p.y), done: p => Math.hypot(p.e[0]-p.x, p.e[1]-p.y) < 2});
  g.strokeStyle = U.rgba(c, .4); g.lineWidth = .8; P.forEach(p => trail(g, p.t, s));
  obs.forEach(([x,y,R], i) => { g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.2; g.beginPath(); g.arc(x*s, y*s, R*s, 0, TAU); g.stroke();
    if(i < 2){ g.fillStyle = U.rgba(c, .3); g.beginPath(); g.arc(x*s, y*s, R*.75*s, 0, TAU); g.fill(); g.beginPath(); g.arc(x*s, y*s, R*.25*s, 0, TAU); g.stroke(); }
    else { g.fillStyle = "#fff"; g.fillRect((x-1)*s, (y-1)*s, 2*s, 2*s); } });
  g.fillStyle = "rgba(255,255,255,.6)"; [[px0+3, py0+3], [px1-3, py0+3], [px0+3, py1-3], [px1-3, py1-3]].forEach(([x,y]) => g.fillRect((x-1.2)*s, (y-1.2)*s, 2.4*s, 2.4*s));
  g.fillStyle = "#fff"; P.forEach(p => { if(!p.done && p.start < 330) { g.beginPath(); g.arc(p.x*s, p.y*s, 1.2, 0, TAU); g.fill(); } });
};
ART.case["D03-05"].ratio = .85;

// D03-06 Jamarat 橋：透視的長橋面上高密度人群，箭頭方向與顏色表示群眾湍流與壓力
ART.case["D03-06"] = function(g, W, H, r, c){
  const hz = H*.3, nz = U.vnoise(((r()*1e5)|0) + 11), nz2 = U.vnoise(((r()*1e5)|0) + 29);
  const pr = (u, v, y) => { const z = 1 + u*7; return [W/2 + v*W*.62/z, hz + (H*.98 - hz)/z - (y || 0)*H*.5/z]; };
  // 上層橋板底面與地坪邊線
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1;
  for(const v of [-1, 1]){ g.beginPath(); g.moveTo(...pr(0, v, 0)); g.lineTo(...pr(1, v, 0)); g.stroke(); g.beginPath(); g.moveTo(...pr(0, v, 1.1)); g.lineTo(...pr(1, v, 1.1)); g.stroke(); }
  for(let k = 0; k <= 12; k++){ const u = k/12; g.strokeStyle = `rgba(255,255,255,${.06 + (1-u)*.12})`; g.beginPath(); g.moveTo(...pr(u, -1, 1.1)); g.lineTo(...pr(u, 1, 1.1)); g.stroke();
    g.beginPath(); g.moveTo(...pr(u, -1, 0)); g.lineTo(...pr(u, -1, 1.1)); g.moveTo(...pr(u, 1, 0)); g.lineTo(...pr(u, 1, 1.1)); g.stroke(); }
  // 三座投石柱（橢圓牆）
  const pil = [.1, .38, .72].map((u,i) => [u, (i % 2 ? .35 : -.3) + (r()-.5)*.15]);
  const inPil = (u, v) => pil.some(([pu, pv]) => ((u-pu)/.045)**2 + ((v-pv)/.28)**2 < 1);
  // 人群：遠到近畫
  const N = 1700, pts = []; for(let k = 0; k < N; k++){ const u = r(), v = (r()*2 - 1)*.95; if(inPil(u, v)) continue; pts.push([u, v]); }
  pts.sort((a,b) => b[0]-a[0]);
  pts.forEach(([u, v]) => { const a = (nz(u*9, v*2.5) - .5)*TAU*1.3, p = nz2(u*6, v*2), [X, Y] = pr(u, v, 0), z = 1 + u*7, l = 7/z + 1;
    g.strokeStyle = p > .62 ? ACC : p > .45 ? "rgba(255,255,255,.75)" : U.rgba(c, .85); g.lineWidth = Math.max(.6, 2.2/z);
    g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Math.sin(a)*l, Y - Math.cos(a)*l*.5); g.stroke(); });
  pil.slice().reverse().forEach(([u, v]) => { const z = 1 + u*7, [X, Y] = pr(u, v, 0), rx = .28*W*.62/z, ry = rx*.18, hh = H*.5/z*.9;
    g.fillStyle = "#1E1E26"; g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(X, Y - hh, rx, ry, 0, Math.PI, 0); g.lineTo(X + rx, Y); g.ellipse(X, Y, rx, ry, 0, 0, Math.PI); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(X, Y - hh, rx, ry, 0, 0, TAU); g.stroke(); });
};
ART.case["D03-06"].ratio = .9;

// D03-07 MassMotion：軟體視窗感的等角車站（兩層＋電扶梯），人以小柱表示並依服務水準上色
ART.case["D03-07"] = function(g, W, H, r, c){
  const P3 = (x, y, z) => [W*.52 + (x - y)*W*.0044, H*.66 + (x + y)*W*.0022 - z*H*.0042];
  const lv = [0, 55];
  // 介面框、工具列
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.strokeRect(4.5, 16.5, W-9, H-21);
  g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(4, 4, W-8, 10); g.fillStyle = "rgba(255,255,255,.35)"; for(let k = 0; k < 7; k++) g.fillRect(8 + k*10, 6.5, 6, 5);
  // 地面格線
  g.strokeStyle = "rgba(255,255,255,.07)"; for(let k = -60; k <= 60; k += 10){ g.beginPath(); g.moveTo(...P3(k, -60, 0)); g.lineTo(...P3(k, 60, 0)); g.moveTo(...P3(-60, k, 0)); g.lineTo(...P3(60, k, 0)); g.stroke(); }
  // 兩層樓板
  lv.forEach((z, k) => { const a = k ? 22 : 45, b = k ? 45 : 50; g.fillStyle = k ? "rgba(34,34,44,.85)" : "rgba(255,255,255,.05)"; U.poly(g, [P3(-a, -b, z), P3(a, -b, z), P3(a, b, z), P3(-a, b, z)], true); g.fill(); g.strokeStyle = "rgba(255,255,255,.55)"; g.stroke(); });
  // 電扶梯
  [[-10, 40], [10, 40]].forEach(([x, y]) => { g.fillStyle = U.rgba(c, .25); U.poly(g, [P3(x-3, y+18, 0), P3(x+3, y+18, 0), P3(x+3, y-5, lv[1]*.98), P3(x-3, y-5, lv[1]*.98)], true); g.fill(); g.strokeStyle = U.rgba(c, .9); g.stroke(); });
  // 人：沿動線取樣
  const routes = [[[-45, -30, 0], [0, 0, 0], [-10, 55, 0]], [[45, -40, 0], [10, 20, 0], [10, 55, 0]], [[-45, 30, 0], [30, 10, 0], [45, -20, 0]], [[-18, -40, 55], [0, 0, 55], [-10, 38, 55]], [[18, -40, 55], [10, 38, 55]]];
  const ppl = [];
  routes.forEach(R => { for(let k = 0; k < 70; k++){ const t = r()*(R.length-1), i = Math.min(R.length-2, Math.floor(t)), f = t - i, a = R[i], b = R[i+1];
    ppl.push([a[0] + (b[0]-a[0])*f + (r()-.5)*9, a[1] + (b[1]-a[1])*f + (r()-.5)*9, a[2]]); } });
  ppl.forEach(p => { let k = 0; for(const q of ppl) if(q[2] === p[2] && Math.abs(q[0]-p[0]) < 5 && Math.abs(q[1]-p[1]) < 5) k++; p.push(k); });
  ppl.sort((a,b) => (a[0]+a[1]) - (b[0]+b[1]));
  ppl.forEach(([x, y, z, k]) => { const t = Math.min(1, k/9), [X, Y] = P3(x, y, z); g.strokeStyle = t > .7 ? "#FF6B5B" : t > .45 ? ACC : t > .25 ? "#FFFFFF" : c; g.lineWidth = 1.6; g.beginPath(); g.moveTo(X, Y); g.lineTo(X, Y - 4.5); g.stroke(); });
  // 服務水準色帶與座標軸
  ["#FF6B5B", ACC, "#FFFFFF", c].forEach((col, i) => { g.fillStyle = col; g.fillRect(W - 12, 24 + i*7, 5, 5); });
  const o = [14, H-12]; g.lineWidth = 1.5; g.strokeStyle = "#FF6B5B"; g.beginPath(); g.moveTo(...o); g.lineTo(o[0]+12, o[1]+ -6); g.stroke();
  g.strokeStyle = "#6BD68B"; g.beginPath(); g.moveTo(...o); g.lineTo(o[0]-2, o[1]-10); g.stroke(); g.strokeStyle = "#6B9BFF"; g.beginPath(); g.moveTo(...o); g.lineTo(o[0]+8, o[1]+2); g.stroke();
};
ART.case["D03-07"].ratio = .95;

// D03-08 Pathfinder：上半是樓層平面與每個人到樓梯的路徑，下半是「剩餘人數－時間」疏散曲線
ART.case["D03-08"] = function(g, W, H, r, c){
  const s = W/100, h = H/s, ph = h*.58, cy = ph*.5, cw = 8, walls = [];
  const rooms = [], xs = [4, 22, 40, 58, 76]; xs.forEach(x => { rooms.push([x, 4, x+18, cy - cw/2]); rooms.push([x, cy + cw/2, x+18, ph-4]); });
  // 牆（房間）
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1.4;
  rooms.forEach(([x0,y0,x1,y1], i) => { g.strokeRect(x0*s, y0*s, (x1-x0)*s, (y1-y0)*s); const dx = x0 + 6 + (i%3)*3, dy = i % 2 ? y0 : y1; g.fillStyle = "#18181F"; g.fillRect(dx*s, dy*s - 2, 3*s, 4); });
  // 兩座樓梯
  const st = [[1, cy], [99, cy]]; g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = .8;
  [[0, cy-4], [96, cy-4]].forEach(([x,y]) => { for(let k = 0; k < 6; k++){ g.beginPath(); g.moveTo((x + k*.7)*s, y*s); g.lineTo((x + k*.7)*s, (y+8)*s); g.stroke(); } });
  // 人與路徑：房內 → 門 → 走廊 → 最近樓梯
  const occ = [];
  rooms.forEach(([x0,y0,x1,y1], i) => { const dx = x0 + 7.5 + (i%3)*3, dy = i % 2 ? y0 : y1, dy2 = i % 2 ? y0 - 2 : y1 + 2;
    for(let k = 0; k < 7; k++){ const px = x0 + 2 + r()*(x1-x0-4), py = y0 + 2 + r()*(y1-y0-4), e = (px < 50) ? 0 : 1; if(r() < .15){}
      const path = [[px,py],[dx,dy],[dx,cy + (r()-.5)*3],[st[e][0], cy]]; let L = 0; for(let q = 1; q < path.length; q++) L += Math.hypot(path[q][0]-path[q-1][0], path[q][1]-path[q-1][1]); occ.push({path, e, L}); } });
  occ.forEach(o => { g.strokeStyle = U.rgba(o.e ? "#FFFFFF" : c, .35); g.lineWidth = .8; U.poly(g, o.path.map(([x,y]) => [x*s, y*s])); g.stroke(); g.fillStyle = o.e ? "#fff" : c; g.beginPath(); g.arc(o.path[0][0]*s, o.path[0][1]*s, 1.8, 0, TAU); g.fill(); });
  // 疏散時間：步行時間＋樓梯口流量限制
  const curves = [0, 1].map(e => { const L = occ.filter(o => o.e === e).map(o => o.L/1.2).sort((a,b) => a-b); let last = 0; return L.map(t => last = Math.max(t, last + 1.6)); });
  const tmax = Math.max(...curves.flat()) * 1.05, n0 = Math.max(...curves.map(q => q.length));
  const cx0 = 12, cx1 = 96, cy0 = ph + 6, cy1 = h - 6, X = t => (cx0 + (cx1-cx0)*t/tmax)*s, Y = k => (cy1 - (cy1-cy0)*k/n0)*s;
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx0*s, cy0*s); g.lineTo(cx0*s, cy1*s); g.lineTo(cx1*s, cy1*s); g.stroke();
  g.fillStyle = "rgba(255,255,255,.4)"; for(let k = 0; k <= 8; k++) g.fillRect((cx0 + (cx1-cx0)*k/8)*s - .5, cy1*s, 1, 3);
  curves.forEach((T, e) => { g.strokeStyle = e ? "#fff" : c; g.lineWidth = 1.6; g.beginPath(); let k = T.length; g.moveTo(X(0), Y(k)); T.forEach(t => { g.lineTo(X(t), Y(k)); k--; g.lineTo(X(t), Y(k)); }); g.stroke(); });
  const tEnd = Math.max(...curves.map(q => q[q.length-1] || 0)); g.strokeStyle = ACC; g.setLineDash([3,3]); g.beginPath(); g.moveTo(X(tEnd), cy0*s); g.lineTo(X(tEnd), cy1*s); g.stroke(); g.setLineDash([]);
};
ART.case["D03-08"].ratio = 1.2;

// D03-09 Arnhem Centraal：地板捲成牆再捲成頂的扭轉曲面線框，白線是沿曲面流動的轉乘動線
ART.case["D03-09"] = function(g, W, H, r, c){
  const yaw = .75 + (r()-.5)*.2, pit = .38, Dc = 5.5, S = W*.23;
  const pr = (x, y, z) => { const x1 = x*Math.cos(yaw) - z*Math.sin(yaw), z1 = x*Math.sin(yaw) + z*Math.cos(yaw), y2 = y*Math.cos(pit) - z1*Math.sin(pit), z2 = y*Math.sin(pit) + z1*Math.cos(pit), f = Dc/(Dc + z2); return [W/2 + x1*f*S, H*.55 - y2*f*S]; };
  const surf = (u, v) => { const x = -1.8 + u*3.6, th = -Math.PI*.5 - .3 + u*Math.PI*1.25 + v*Math.PI*.95, R = .9 + .25*Math.sin(u*Math.PI); return [x, Math.sin(th)*R*.8 + .3, Math.cos(th)*R]; };
  // 地面陰影
  g.fillStyle = "rgba(255,255,255,.04)"; g.beginPath(); const gp = [[-2.2,-1.2],[2.2,-1.2],[2.2,1.2],[-2.2,1.2]].map(([x,z]) => pr(x, -.55, z)); U.poly(g, gp, true); g.fill();
  const NU = 40, NV = 14;
  for(let j = 0; j <= NV; j++){ g.strokeStyle = U.rgba(c, .35 + (j % 7 === 0 ? .4 : 0)); g.lineWidth = j % 7 === 0 ? 1.4 : .8; g.beginPath(); for(let i = 0; i <= NU; i++){ const p = pr(...surf(i/NU, j/NV)); i ? g.lineTo(...p) : g.moveTo(...p); } g.stroke(); }
  for(let i = 0; i <= NU; i += 2){ g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = .8; g.beginPath(); for(let j = 0; j <= NV; j++){ const p = pr(...surf(i/NU, j/NV)); j ? g.lineTo(...p) : g.moveTo(...p); } g.stroke(); }
  // 動線：沿曲面的蛇行流線
  for(let k = 0; k < 7; k++){ const v0 = .1 + k*.12, ph = r()*TAU, amp = .05 + r()*.08; g.strokeStyle = k % 3 === 0 ? ACC : "rgba(255,255,255,.85)"; g.lineWidth = 1.3; g.beginPath();
    for(let i = 0; i <= 60; i++){ const u = i/60, v = Math.min(.98, Math.max(.02, v0 + Math.sin(u*TAU*1.2 + ph)*amp)), p = pr(...surf(u, v)); i ? g.lineTo(...p) : g.moveTo(...p); } g.stroke(); }
  // 月台柱
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; for(let k = 0; k < 5; k++){ const x = -1.6 + k*.8; g.beginPath(); g.moveTo(...pr(x, -.55, 1.15)); g.lineTo(...pr(x, .7, 1.15)); g.stroke(); }
};
ART.case["D03-09"].ratio = .95;

// D03-10 Quelea：Grasshopper 畫布上的元件與連線（發射器→行為→引擎→顯示），右上角是預覽視窗
ART.case["D03-10"] = function(g, W, H, r, c){
  g.fillStyle = "rgba(255,255,255,.09)"; for(let y = 6; y < H; y += 10) for(let x = 6; x < W; x += 10) g.fillRect(x, y, 1, 1);
  const u = W/100, nodes = [
    {x: 5, y: 44, w: 18, h: 16, i: 1, o: 1}, {x: 5, y: 70, w: 16, h: 8, i: 0, o: 1, slider: true},
    {x: 32, y: 34, w: 20, h: 12, i: 2, o: 1}, {x: 32, y: 52, w: 20, h: 12, i: 2, o: 1}, {x: 32, y: 70, w: 20, h: 12, i: 2, o: 1},
    {x: 62, y: 50, w: 18, h: 22, i: 4, o: 2}, {x: 86, y: 58, w: 11, h: 12, i: 1, o: 0}];
  const port = (n, side, k) => { const cnt = side ? n.o : n.i; return [(n.x + (side ? n.w : 0))*u, (n.y + n.h*(k+1)/(cnt+1))*u]; };
  const wire = (a, b, col) => { g.strokeStyle = col; g.lineWidth = 1.3; g.beginPath(); g.moveTo(...a); const dx = Math.max(20, (b[0]-a[0])*.5); g.bezierCurveTo(a[0]+dx, a[1], b[0]-dx, b[1], ...b); g.stroke(); };
  const N = nodes;
  wire(port(N[0],1,0), port(N[5],0,0), "rgba(255,255,255,.55)");
  [2,3,4].forEach((k, i) => wire(port(N[k],1,0), port(N[5],0,i+1), U.rgba(c, .9)));
  wire(port(N[1],1,0), port(N[2],0,1), "rgba(255,255,255,.4)"); wire(port(N[1],1,0), port(N[3],0,1), "rgba(255,255,255,.4)");
  wire(port(N[5],1,0), port(N[6],0,0), ACC);
  N.forEach((n, k) => { g.fillStyle = k >= 2 && k <= 4 ? U.rgba(c, .3) : "rgba(255,255,255,.12)"; g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1;
    g.beginPath(); g.roundRect(n.x*u, n.y*u, n.w*u, n.h*u, 2.5); g.fill(); g.stroke();
    if(n.slider){ g.strokeStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.moveTo((n.x+2)*u, (n.y+n.h/2)*u); g.lineTo((n.x+n.w-2)*u, (n.y+n.h/2)*u); g.stroke(); g.fillStyle = ACC; g.fillRect((n.x + 4 + r()*8)*u - 2, (n.y+n.h/2)*u - 3, 4, 6); }
    else { g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect((n.x + n.w*.3)*u, (n.y + 2)*u, n.w*.4*u, 2); }
    for(let q = 0; q < n.i; q++){ const [x,y] = port(n,0,q); g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, 2, 0, TAU); g.fill(); }
    for(let q = 0; q < n.o; q++){ const [x,y] = port(n,1,q); g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, 2, 0, TAU); g.fill(); } });
  // 預覽視窗：代理人軌跡
  const vx = 52*u, vy = 4*u, vw = 44*u, vh = 26*u;
  g.fillStyle = "#101015"; g.fillRect(vx, vy, vw, vh); g.strokeStyle = "rgba(255,255,255,.4)"; g.strokeRect(vx, vy, vw, vh);
  g.save(); g.beginPath(); g.rect(vx, vy, vw, vh); g.clip();
  const nz = U.vnoise(((r()*1e5)|0) + 5);
  for(let k = 0; k < 26; k++){ let x = vx + r()*vw*.3, y = vy + r()*vh; g.strokeStyle = U.rgba(c, .8); g.lineWidth = .9; g.beginPath(); g.moveTo(x, y);
    for(let t = 0; t < 40; t++){ const a = (nz(x*.03, y*.03) - .5)*2.2; x += Math.cos(a)*1.6; y += Math.sin(a)*1.6; g.lineTo(x, y); } g.stroke(); g.fillStyle = "#fff"; g.fillRect(x-1, y-1, 2, 2); }
  g.restore();
};
ART.case["D03-10"].ratio = .95;

// D03-11 DecodingSpaces：街道網絡的整合度（接近中心性），線越粗越亮越核心，外加步行距離圈
ART.case["D03-11"] = function(g, W, H, r, c){
  const s = W/100, h = H/s, nx = 9, ny = Math.max(6, Math.round(h/13)), V = [], E = [];
  for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++) V.push([4 + i*92/(nx-1) + (r()-.5)*6, 4 + j*(h-8)/(ny-1) + (r()-.5)*6]);
  const id = (i,j) => j*nx + i;
  for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++){ if(i < nx-1 && r() > .12) E.push([id(i,j), id(i+1,j)]); if(j < ny-1 && r() > .12) E.push([id(i,j), id(i,j+1)]); }
  for(let k = 0; k < Math.min(nx, ny)-1; k++) E.push([id(k,k), id(k+1,k+1)]);                 // 斜向大道
  for(let k = 0; k < ny-1 && k < nx-1; k++) E.push([id(nx-1-k, k), id(nx-2-k, k+1)]);
  const nV = V.length, adj = V.map(() => []);
  E.forEach(([a,b]) => { const w = Math.hypot(V[a][0]-V[b][0], V[a][1]-V[b][1]); adj[a].push([b,w]); adj[b].push([a,w]); });
  // 每點到所有點的最短路徑總和（Dijkstra 簡化版）
  const clo = V.map((_, src) => { const D = new Float64Array(nV).fill(1e9), done = new Uint8Array(nV); D[src] = 0;
    for(let it = 0; it < nV; it++){ let u = -1, b = 1e9; for(let k = 0; k < nV; k++) if(!done[k] && D[k] < b){ b = D[k]; u = k; } if(u < 0) break; done[u] = 1; for(const [v,w] of adj[u]) if(D[u] + w < D[v]) D[v] = D[u] + w; }
    let t = 0, cnt = 0; D.forEach(d => { if(d < 1e8){ t += d; cnt++; } }); return cnt > 1 ? (cnt-1)/t : 0; });
  const lo = Math.min(...clo.filter(v => v > 0)), hi = Math.max(...clo), nm = v => Math.max(0, (v - lo)/(hi - lo || 1));
  E.map(([a,b]) => [a, b, (nm(clo[a]) + nm(clo[b]))/2]).sort((p,q) => p[2]-q[2]).forEach(([a,b,t]) => {
    g.strokeStyle = t > .8 ? ACC : t > .45 ? U.rgba(c, .5 + t*.5) : `rgba(255,255,255,${.15 + t*.4})`; g.lineWidth = .7 + t*t*4.5; g.lineCap = "round";
    g.beginPath(); g.moveTo(V[a][0]*s, V[a][1]*s); g.lineTo(V[b][0]*s, V[b][1]*s); g.stroke(); });
  const top = clo.indexOf(hi);
  g.setLineDash([2,3]); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; [14, 26, 38].forEach(R => { g.beginPath(); g.arc(V[top][0]*s, V[top][1]*s, R*s, 0, TAU); g.stroke(); }); g.setLineDash([]);
  g.fillStyle = "#fff"; g.beginPath(); g.arc(V[top][0]*s, V[top][1]*s, 3.5, 0, TAU); g.fill();
  g.fillStyle = "rgba(255,255,255,.6)"; g.fillRect(W - 30*s, H - 5, 20*s, 2); g.fillRect(W - 30*s, H - 8, 1, 5); g.fillRect(W - 10*s, H - 8, 1, 5);
};
ART.case["D03-11"].ratio = 1.1;

// D03-12 視覺啟發式：行人視野扇形的每條視線長度＝到第一個碰撞的距離，選出最快不受阻的方向
ART.case["D03-12"] = function(g, W, H, r, c){
  const ox = W*.5, oy = H*.86, dmax = H*.72, rad = W*.035, gx = W*(.3 + r()*.4), gy = H*.04, O = [];
  while(O.length < 13){ const x = W*(.08 + r()*.84), y = H*(.1 + r()*.6); if(Math.hypot(x-ox, y-oy) < W*.16 || O.some(q => Math.hypot(q[0]-x, q[1]-y) < rad*2.6)) continue; O.push([x, y, (r()-.5)*1.4, r()*.6 + .3]); }
  const a0 = Math.atan2(gy-oy, gx-ox), N = 61, rays = [];
  for(let k = 0; k < N; k++){ const a = -Math.PI/2 - 1.3 + 2.6*k/(N-1), dx = Math.cos(a), dy = Math.sin(a); let f = dmax;
    for(const [x,y] of O){ const px = x-ox, py = y-oy, t = px*dx + py*dy; if(t < 0) continue; const d2 = px*px + py*py - t*t, R2 = (rad*1.9)**2; if(d2 < R2){ const tt = t - Math.sqrt(R2 - d2); if(tt < f) f = Math.max(0, tt); } }
    rays.push([a, f]); }
  // 可走空間多邊形
  g.fillStyle = U.rgba(c, .16); g.beginPath(); g.moveTo(ox, oy); rays.forEach(([a,f]) => g.lineTo(ox + Math.cos(a)*f, oy + Math.sin(a)*f)); g.closePath(); g.fill();
  rays.forEach(([a,f]) => { const t = f/dmax; g.strokeStyle = t > .95 ? U.rgba(c, .7) : t < .35 ? U.rgba(ACC, .8) : "rgba(255,255,255,.45)"; g.lineWidth = .8; g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + Math.cos(a)*f, oy + Math.sin(a)*f); g.stroke(); });
  g.setLineDash([3,4]); g.strokeStyle = "rgba(255,255,255,.3)"; g.beginPath(); g.arc(ox, oy, dmax, -Math.PI/2 - 1.3, -Math.PI/2 + 1.3); g.stroke(); g.setLineDash([]);
  // 選向：到目標的剩餘距離最小
  let best = rays[0], bd = 1e18; rays.forEach(([a,f]) => { const d = dmax*dmax + f*f - 2*dmax*f*Math.cos(a0 - a); if(d < bd){ bd = d; best = [a, f]; } });
  O.forEach(([x,y,va,vs]) => { g.fillStyle = "rgba(255,255,255,.18)"; g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.5)"; g.fillStyle = "rgba(255,255,255,.5)"; arrow(g, x, y, x + Math.sin(va)*rad*2.5*vs, y + Math.cos(va)*rad*2.5*vs, 3.5); });
  g.strokeStyle = "rgba(255,255,255,.35)"; g.setLineDash([2,3]); g.beginPath(); g.moveTo(ox, oy); g.lineTo(gx, gy); g.stroke(); g.setLineDash([]);
  g.strokeStyle = "#fff"; g.fillStyle = "#fff"; g.lineWidth = 2.6; arrow(g, ox, oy, ox + Math.cos(best[0])*Math.min(best[1], dmax*.5), oy + Math.sin(best[0])*Math.min(best[1], dmax*.5), 9);
  g.fillStyle = c; g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.arc(ox, oy, rad*1.1, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = ACC; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + 6, gy + 10); g.lineTo(gx - 6, gy + 10); g.closePath(); g.fill();
};
ART.case["D03-12"].ratio = 1.15;

// D03-13 PEDSIM：座標格上的路徑點（含到達半徑）與障礙線段，三角形代理人依序走訪路徑點
ART.case["D03-13"] = function(g, W, H, r, c){
  const s = W/100, h = H/s;
  // 座標格與軸
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1; g.beginPath(); for(let x = 0; x <= 100; x += 5){ g.moveTo(x*s, 0); g.lineTo(x*s, H); } for(let y = 0; y <= h; y += 5){ g.moveTo(0, y*s); g.lineTo(W, y*s); } g.stroke();
  g.strokeStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.moveTo(6*s, 0); g.lineTo(6*s, (h-6)*s); g.lineTo(W, (h-6)*s); g.stroke();
  g.fillStyle = "rgba(255,255,255,.4)"; for(let x = 6; x <= 100; x += 10) g.fillRect(x*s - .5, (h-6)*s, 1, 4); for(let y = h-6; y >= 0; y -= 10) g.fillRect(6*s - 4, y*s - .5, 4, 1);
  const wp = [[20, h*.2], [80, h*.18], [85, h*.62], [52, h*.5], [18, h*.7]].map(([x,y]) => [x + (r()-.5)*8, y + (r()-.5)*6, 5]);
  const walls = [[40, h*.12, 40, h*.34], [60, h*.72, 60, h*.9], [30, h*.45, 44, h*.52]];
  const routes = [[0,1,2,3,4], [4,3,1,0], [2,4,0,3]];
  // 路線圖
  g.setLineDash([4,3]); g.strokeStyle = "rgba(255,255,255,.3)"; routes.forEach(R => { g.beginPath(); R.forEach((k,i) => i ? g.lineTo(wp[k][0]*s, wp[k][1]*s) : g.moveTo(wp[k][0]*s, wp[k][1]*s)); g.stroke(); }); g.setLineDash([]);
  const P = []; for(let k = 0; k < 36; k++){ const R = routes[k % 3], w = wp[R[0]]; P.push(A(w[0] + (r()-.5)*8, w[1] + (r()-.5)*8, {R, i: 1, start: (k/3|0)*12})); }
  sim(P, {walls, steps: 260, rec: 3, speed: .55, dir: p => { const w = wp[p.R[p.i % p.R.length]]; if(Math.hypot(w[0]-p.x, w[1]-p.y) < w[2]) p.i++; const w2 = wp[p.R[p.i % p.R.length]]; return unit(w2[0]-p.x, w2[1]-p.y); }});
  P.forEach(p => { g.strokeStyle = U.rgba([c, "#FFFFFF", ACC][routes.indexOf(p.R)], .28); g.lineWidth = .8; trail(g, p.t.slice(-40), s); });
  wp.forEach(([x,y,R]) => { g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1; g.beginPath(); g.arc(x*s, y*s, R*s, 0, TAU); g.stroke(); g.fillStyle = U.rgba(c, .15); g.fill();
    g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(x*s-3, y*s); g.lineTo(x*s+3, y*s); g.moveTo(x*s, y*s-3); g.lineTo(x*s, y*s+3); g.stroke(); });
  wallsDraw(g, walls, s, 2.4);
  P.forEach(p => { const a = Math.atan2(p.vy, p.vx), x = p.x*s, y = p.y*s, L = 4.5; g.fillStyle = ["#C9A8F5", "#FFFFFF", ACC][routes.indexOf(p.R)];
    g.beginPath(); g.moveTo(x + Math.cos(a)*L, y + Math.sin(a)*L); g.lineTo(x + Math.cos(a+2.5)*L*.7, y + Math.sin(a+2.5)*L*.7); g.lineTo(x + Math.cos(a-2.5)*L*.7, y + Math.sin(a-2.5)*L*.7); g.closePath(); g.fill(); });
};
ART.case["D03-13"].ratio = .8;

// D03-55 People in a Crowd：Processing 視窗裡只有排斥、沒有預測閃避的人群，互相重疊（亮圈）並被障礙推偏
ART.case["D03-55"] = function(g, W, H, r, c){
  // 視窗外框
  g.fillStyle = "rgba(255,255,255,.1)"; g.fillRect(0, 0, W, 14); ["#FF6B5B", ACC, "#6BD68B"].forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(8 + i*9, 7, 2.6, 0, TAU); g.fill(); });
  g.fillStyle = "#26262F"; g.fillRect(4, 18, W-8, H-22);
  g.save(); g.beginPath(); g.rect(4, 18, W-8, H-22); g.clip(); g.translate(4, 18);
  const Wc = W-8, s = Wc/100, h = (H-22)/s, obs = [];
  for(let k = 0; k < 5; k++) obs.push([25 + r()*55, 8 + r()*(h-16), 4 + r()*3]);
  const P = [], hits = [];
  for(let k = 0; k < 80; k++) P.push(A(-3 - r()*40, 4 + r()*(h-8), {start: 0}));
  sim(P, {obs, steps: 190, rec: 2, rad: 2, speed: .75, kP: .05, kW: .12, dir: p => [1, 0],
    each: (Q, st) => { if(st % 6) return; for(let i = 0; i < Q.length; i++) for(let j = i+1; j < Q.length; j++){ const a = Q[i], b = Q[j]; if(a.x > 0 && Math.abs(a.x-b.x) < 2.4 && Math.hypot(a.x-b.x, a.y-b.y) < 2.4 && hits.length < 60) hits.push([(a.x+b.x)/2, (a.y+b.y)/2]); } } });
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; P.forEach(p => trail(g, p.t, s));
  obs.forEach(([x,y,R]) => { g.fillStyle = "rgba(255,255,255,.14)"; g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.2; g.fillRect((x-R)*s, (y-R)*s, 2*R*s, 2*R*s); g.strokeRect((x-R)*s, (y-R)*s, 2*R*s, 2*R*s); });
  g.strokeStyle = ACC; g.lineWidth = 1; hits.forEach(([x,y]) => { g.beginPath(); g.moveTo(x*s-2.5, y*s-2.5); g.lineTo(x*s+2.5, y*s+2.5); g.moveTo(x*s+2.5, y*s-2.5); g.lineTo(x*s-2.5, y*s+2.5); g.stroke(); });
  P.forEach(p => { if(p.x < -2 || p.x > 102) return; let ov = P.some(q => q !== p && Math.hypot(q.x-p.x, q.y-p.y) < 3.2);
    g.fillStyle = U.rgba(c, .55); g.strokeStyle = ov ? ACC : "#fff"; g.lineWidth = ov ? 1.6 : 1; g.beginPath(); g.arc(p.x*s, p.y*s, 1.8*s, 0, TAU); g.fill(); g.stroke(); });
  g.restore();
};
ART.case["D03-55"].ratio = .8;
})();
