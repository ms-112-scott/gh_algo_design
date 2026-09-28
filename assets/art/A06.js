/* A06 波函數塌縮（WFC）：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = Math.PI*2;
const DX = [0,1,0,-1], DY = [-1,0,1,0], OPP = [2,3,0,1];

/* ================= 共用工具 ================= */
// 簡化 WFC：n×m 格、T 種 tile
// compat(a,b,s)：a 的 s 邊能否接 b；allow(i,j,t)：格子候選限制；border(t,s)：邊界外側規則
// fixed {格索引:tile}：預先塌縮；weight(i,j,t)：加權；steps：只跑幾步（動畫／過程用）
function wfc(o){
  const n = o.n, m = o.m, T = o.T, r = o.r, N = n*m;
  // L[s][t2]：本格放哪些 t1 時，s 方向的鄰格可以是 t2
  const L = [0,1,2,3].map(s => [...Array(T)].map((_, t2) => { const a = []; for(let t1 = 0; t1 < T; t1++) if(o.compat(t1, t2, s)) a.push(t1); return a; }));
  let res = null;
  for(let at = 0; at < (o.tries || 5); at++){
    const C = new Uint8Array(N*T).fill(1), cnt = new Int16Array(N).fill(T), st = [], order = []; let bad = false;
    const ban = (k, t) => { if(!C[k*T+t]) return; C[k*T+t] = 0; cnt[k]--; st.push(k); if(cnt[k] <= 0) bad = true; };
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) for(let t = 0; t < T; t++){
      const k = j*n+i;
      if(o.allow && !o.allow(i, j, t)){ ban(k, t); continue; }
      if(o.border) for(let s = 0; s < 4; s++){ const x = i+DX[s], y = j+DY[s]; if((x < 0 || y < 0 || x >= n || y >= m) && !o.border(t, s)){ ban(k, t); break; } }
    }
    if(o.fixed) for(const k in o.fixed) for(let t = 0; t < T; t++) if(t !== o.fixed[k]) ban(+k, t);
    // 約束傳播
    const prop = () => { while(st.length && !bad){ const k = st.pop(), i = k % n, j = (k/n)|0;
      for(let s = 0; s < 4; s++){ const x = i+DX[s], y = j+DY[s]; if(x < 0 || y < 0 || x >= n || y >= m) continue; const nk = y*n+x;
        for(let t2 = 0; t2 < T; t2++){ if(!C[nk*T+t2]) continue; const l = L[s][t2]; let ok = false;
          for(let q = 0; q < l.length; q++) if(C[k*T+l[q]]){ ok = true; break; }
          if(!ok) ban(nk, t2); } } } };
    prop();
    let steps = 0;
    while(!bad && !(o.steps != null && steps >= o.steps)){
      // 挑候選最少（熵最低）的格子
      let best = -1, be = 1e9;
      for(let k = 0; k < N; k++) if(cnt[k] > 1){ const e = cnt[k] + r()*.9; if(e < be){ be = e; best = k; } }
      if(best < 0) break;
      const i = best % n, j = (best/n)|0; let tot = 0; const ws = [];
      for(let t = 0; t < T; t++){ const w = C[best*T+t] ? (o.weight ? Math.max(0, o.weight(i, j, t)) : 1) : 0; ws.push(w); tot += w; }
      let pick = -1;
      if(tot > 0){ let x = r()*tot; for(let t = 0; t < T; t++) if(ws[t] > 0){ pick = t; x -= ws[t]; if(x <= 0) break; } }
      else for(let t = 0; t < T; t++) if(C[best*T+t]){ pick = t; break; }
      for(let t = 0; t < T; t++) if(t !== pick) ban(best, t);
      order.push(best); prop(); steps++;
    }
    const grid = new Int16Array(N).fill(-1);
    for(let k = 0; k < N; k++) if(cnt[k] === 1) for(let t = 0; t < T; t++) if(C[k*T+t]) grid[k] = t;
    res = {grid, C, cnt, order, bad, n, m, T};
    if(!bad) return res;
  }
  return res;
}
// 管線 tile：4 位元開口（N=1 E=2 S=4 W=8），16 種，邊界不得開口
const deg = t => t < 0 ? 0 : (t&1)+(t>>1&1)+(t>>2&1)+(t>>3&1);
const pipeCompat = (a, b, s) => ((a>>s)&1) === ((b>>OPP[s])&1);
function pipeSolve(o){ return wfc(Object.assign({T:16, compat:pipeCompat, border:(t, s) => !((t>>s)&1)}, o)); }
// 依度數加權：w = [空, 端點, 二通, 三通, 十字]；straight 另給直管權重
const byDeg = (w, straight) => (i, j, t) => (straight != null && (t === 5 || t === 10)) ? straight : w[deg(t)];
// 把管線結果畫成線段（呼叫前先設好筆觸）
function pipeLines(g, R, ox, oy, s, sy){
  sy = sy || s; g.beginPath();
  for(let j = 0; j < R.m; j++) for(let i = 0; i < R.n; i++){
    const t = R.grid[j*R.n+i]; if(t <= 0) continue; const cx = ox + (i+.5)*s, cy = oy + (j+.5)*sy;
    for(let q = 0; q < 4; q++) if(t>>q&1){ g.moveTo(cx, cy); g.lineTo(cx + DX[q]*s/2, cy + DY[q]*sy/2); }
  }
  g.stroke();
}
function shade(hex, k){ const [R,G,B] = U.rgb(hex); return `rgb(${Math.min(255,R*k|0)},${Math.min(255,G*k|0)},${Math.min(255,B*k|0)})`; }
function mix(h1, h2, t){ const a = U.rgb(h1), b = U.rgb(h2); return `rgb(${a.map((v,i) => Math.round(v + (b[i]-v)*t)).join(",")})`; }
// 等角投影
function isoMap(ox, oy, s, zk){ zk = zk || 1; return (x, y, z) => [ox + (x-y)*s*.866, oy + (x+y)*s*.5 - z*s*zk]; }
function isoBox(g, P, x, y, z, w, d, h, top, lf, rt, st){
  const A = P(x,y,z+h), B = P(x+w,y,z+h), C = P(x+w,y+d,z+h), D = P(x,y+d,z+h), B0 = P(x+w,y,z), C0 = P(x+w,y+d,z), D0 = P(x,y+d,z);
  [[rt,[B,C,C0,B0]],[lf,[D,C,C0,D0]],[top,[A,B,C,D]]].forEach(([f, pts]) => { U.poly(g, pts, true); if(f){ g.fillStyle = f; g.fill(); } if(st) g.stroke(); });
}
// 高度 tile（相鄰高差 ≤ 1）
function heightSolve(n, m, T, r, weight){ return wfc({n, m, T, r, compat:(a, b) => Math.abs(a-b) <= 1, weight}); }
function frame(g, x, y, w, h, col){ g.strokeStyle = col || "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(x+.5, y+.5, w, h); }
const isoOrder = n => { const a = []; for(let j = 0; j < n; j++) for(let i = 0; i < n; i++) a.push([i, j]); return a.sort((p, q) => (p[0]+p[1]) - (q[0]+q[1])); };

/* ================= 變形 ================= */
ART.var["A06"] = [
  // V01 換 tile 組：同一程式三種 tile 組 → 迷宮／電路板／長直線，三段並列
  Object.assign(function(g, W, H, r, c){
    const bh = H/3, sets = [
      {s: W/15, w: byDeg([.05,.3,1.6,1,.4])},
      {s: W/11, w: byDeg([3,.7,1,.35,.05])},
      {s: W/22, w: byDeg([1.2,.05,.15,.08,.02], 7)}];
    sets.forEach((q, b) => {
      const n = Math.ceil(W/q.s), m = Math.max(2, Math.floor(bh/q.s)), ox = (W - n*q.s)/2, oy = b*bh + (bh - m*q.s)/2;
      const R = pipeSolve({n, m, r, weight: q.w});
      g.save(); g.beginPath(); g.rect(0, b*bh, W, bh); g.clip();
      if(b === 0){ g.strokeStyle = U.rgba(c, .9); g.lineWidth = q.s*.6; g.lineCap = "square"; pipeLines(g, R, ox, oy, q.s); }
      else if(b === 1){
        g.fillStyle = U.rgba(c, .06); g.fillRect(0, b*bh, W, bh);
        g.strokeStyle = c; g.lineWidth = 1.6; g.lineCap = "round"; g.beginPath();
        for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const t = R.grid[j*n+i]; if(t <= 0) continue;
          const cx = ox + (i+.5)*q.s, cy = oy + (j+.5)*q.s, open = [0,1,2,3].filter(k => t>>k&1);
          if(open.length === 2 && open[1]-open[0] !== 2){ // 彎管 → 45° 斜切走線
            const [a0, a1] = open; g.moveTo(cx + DX[a0]*q.s/2, cy + DY[a0]*q.s/2); g.lineTo(cx + DX[a0]*q.s*.15, cy + DY[a0]*q.s*.15);
            g.lineTo(cx + DX[a1]*q.s*.15, cy + DY[a1]*q.s*.15); g.lineTo(cx + DX[a1]*q.s/2, cy + DY[a1]*q.s/2);
          } else open.forEach(k => { g.moveTo(cx, cy); g.lineTo(cx + DX[k]*q.s/2, cy + DY[k]*q.s/2); });
        }
        g.stroke();
        for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const t = R.grid[j*n+i], d = deg(t), cx = ox + (i+.5)*q.s, cy = oy + (j+.5)*q.s;
          if(d === 1){ g.fillStyle = "#15151B"; g.beginPath(); g.arc(cx, cy, q.s*.17, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.4; g.stroke(); }
          if(d >= 3){ g.fillStyle = c; g.fillRect(cx - q.s*.12, cy - q.s*.12, q.s*.24, q.s*.24); } }
      } else { g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1.2; g.lineCap = "butt"; pipeLines(g, R, ox, oy, q.s); }
      g.restore();
      if(b){ g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, b*bh); g.lineTo(W, b*bh); g.stroke(); }
    });
  }, {ratio: 1.25}),

  // V02 多種接頭：道路／細管／牆三種 socket，材料只能接同材料
  Object.assign(function(g, W, H, r, c){
    const TL = [[0,0,0,0]];
    for(let k = 1; k <= 3; k++) for(let mk = 1; mk < 16; mk++){ if(deg(mk) < 2) continue; TL.push([0,1,2,3].map(q => mk>>q&1 ? k : 0)); }
    TL.push([2,1,2,1],[1,2,1,2],[2,3,2,3],[3,2,3,2]); // 道路穿越管線、道路穿越牆（大門）
    const n = 11, m = Math.round(n*H/W), s = Math.min(W/n, H/m), ox = (W - n*s)/2, oy = (H - m*s)/2;
    const R = wfc({n, m, T: TL.length, r, compat:(a, b, q) => TL[a][q] === TL[b][OPP[q]], border:(t, q) => TL[t][q] === 0 || TL[t][q] === 2,
      weight:(i, j, t) => t === 0 ? 2.2 : t >= TL.length-4 ? 1.2 : [0,.9,1,.7][Math.max(...TL[t])] * (TL[t].filter(v => v).length === 4 ? .3 : 1)});
    const seg = (k, fn) => { for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const t = R.grid[j*n+i]; if(t < 0) continue;
      for(let q = 0; q < 4; q++) if(TL[t][q] === k) fn(ox + (i+.5)*s, oy + (j+.5)*s, q); } };
    const arm = (x, y, q) => { g.moveTo(x, y); g.lineTo(x + DX[q]*s/2, y + DY[q]*s/2); };
    // 道路：深灰寬帶＋虛線中線
    g.lineCap = "square"; g.strokeStyle = "#3B3B46"; g.lineWidth = s*.5; g.beginPath(); seg(2, arm); g.stroke();
    g.lineCap = "butt"; g.setLineDash([s*.12, s*.12]); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.beginPath(); seg(2, arm); g.stroke(); g.setLineDash([]);
    // 牆：白色雙線
    g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 1.3; g.beginPath();
    seg(3, (x, y, q) => { const px = -DY[q]*s*.09, py = DX[q]*s*.09; [1,-1].forEach(k => { g.moveTo(x + px*k, y + py*k); g.lineTo(x + DX[q]*s/2 + px*k, y + DY[q]*s/2 + py*k); }); }); g.stroke();
    // 細管：家族色
    g.lineCap = "round"; g.strokeStyle = c; g.lineWidth = s*.12; g.beginPath(); seg(1, arm); g.stroke();
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const t = R.grid[j*n+i]; if(t > 0 && TL[t].filter(v => v === 1).length >= 3){ g.fillStyle = "#fff"; g.beginPath(); g.arc(ox + (i+.5)*s, oy + (j+.5)*s, s*.1, 0, TAU); g.fill(); } }
  }, {ratio: 1}),

  // V03 tile 換成幾何模組：透視下的鋪面模組
  Object.assign(function(g, W, H, r, c){
    const n = 10, m = 12, R = pipeSolve({n, m, r, weight: byDeg([.8,.2,2,1,.4])});
    const P = (u, v) => { const z = 1 + (1-v)*3.2; return [W/2 + (u-.5)*W*1.9/z, H*.05 + H*1.0/z]; };
    const sky = g.createLinearGradient(0, 0, 0, H*.32); sky.addColorStop(0, U.rgba(c, .14)); sky.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = sky; g.fillRect(0, 0, W, H*.32);
    const L = (i, j, pts) => pts.map(([x, y]) => P((i+x)/n, (j+y)/m));
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){
      const t = R.grid[j*n+i], a = .25 + .65*(j/m);
      // 角落鋪石
      g.strokeStyle = `rgba(255,255,255,${a*.35})`; g.lineWidth = .8;
      [[0,0],[.72,0],[0,.72],[.72,.72]].forEach(([x, y]) => { U.poly(g, L(i, j, [[x+.04,y+.04],[x+.24,y+.04],[x+.24,y+.24],[x+.04,y+.24]]), true); g.stroke(); });
      if(t <= 0) continue;
      g.fillStyle = U.rgba(c, a); const open = [0,1,2,3].filter(k => t>>k&1);
      if(open.length === 2 && open[1]-open[0] !== 2){ // 彎：四分之一環形模組
        const cx = open.includes(1) ? 1 : 0, cy = open.includes(2) ? 1 : 0, base = cx ? (cy ? Math.PI : Math.PI/2) : (cy ? -Math.PI/2 : 0), ring = [];
        for(let k = 0; k <= 8; k++){ const th = base + k/8*Math.PI/2; ring.push([cx + Math.cos(th)*.7, cy + Math.sin(th)*.7]); }
        for(let k = 8; k >= 0; k--){ const th = base + k/8*Math.PI/2; ring.push([cx + Math.cos(th)*.3, cy + Math.sin(th)*.3]); }
        U.poly(g, L(i, j, ring), true); g.fill();
      } else {
        U.poly(g, L(i, j, [[.3,.3],[.7,.3],[.7,.7],[.3,.7]]), true); g.fill();
        open.forEach(k => { const rc = [[.3,0,.7,.3],[.7,.3,1,.7],[.3,.7,.7,1],[0,.3,.3,.7]][k]; U.poly(g, L(i, j, [[rc[0],rc[1]],[rc[2],rc[1]],[rc[2],rc[3]],[rc[0],rc[3]]]), true); g.fill(); });
        if(open.length >= 3){ g.fillStyle = `rgba(255,255,255,${a*.8})`; U.poly(g, L(i, j, [[.42,.42],[.58,.42],[.58,.58],[.42,.58]]), true); g.fill(); }
      }
    }
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, H*.05 + H/4.2); g.lineTo(W, H*.05 + H/4.2); g.stroke();
  }, {ratio: .8}),

  // V04 2D → 3D 體素：等角的模組化量體
  Object.assign(function(g, W, H, r, c){
    const n = 7, R = heightSolve(n, n, 5, r, (i, j, t) => t === 0 ? 1.3 : 1), zk = .8;
    const s = Math.min(W*.92/(2*n*.866), H*.88/(n + 4*zk)), P = isoMap(W/2, H/2 - n*s*.5 + 2*zk*s + s*.2, s, zk);
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1;
    for(let k = 0; k <= n; k++){ U.poly(g, [P(k,0,0), P(k,n,0)]); g.stroke(); U.poly(g, [P(0,k,0), P(n,k,0)]); g.stroke(); }
    g.strokeStyle = "rgba(0,0,0,.35)";
    isoOrder(n).forEach(([i, j]) => { const h = Math.max(0, R.grid[j*n+i]);
      for(let z = 0; z < h; z++){
        isoBox(g, P, i+.04, j+.04, z, .92, .92, .96, z === h-1 ? mix(c, "#ffffff", .25) : c, shade(c, .55), shade(c, .75), true);
        // 立面開口
        if((i*7 + j*3 + z) % 3 === 0){ g.fillStyle = "rgba(255,255,255,.55)"; U.poly(g, [P(i+.96, j+.35, z+.3), P(i+.96, j+.65, z+.3), P(i+.96, j+.65, z+.65), P(i+.96, j+.35, z+.65)], true); g.fill(); }
      } });
  }, {ratio: .9}),

  // V05 指定格子預先塌縮：設計者放的入口與中庭 + 影響範圍
  Object.assign(function(g, W, H, r, c){
    const n = 11, m = Math.round(n*H/W), s = Math.min(W/n, H/m)*.9, ox = (W - n*s)/2, oy = (H - m*s)/2;
    const mid = n>>1, fx = [[mid, m-1, 5], [mid, m>>1, 15], [2, 2, 6], [n-3, 2, 12]], fixed = {};
    fx.forEach(([i, j, t]) => fixed[j*n+i] = t);
    const allow = (i, j, t) => { for(let q = 0; q < 4; q++){ const x = i+DX[q], y = j+DY[q]; if((x < 0 || y < 0 || x >= n || y >= m) && (t>>q&1) && !(i === mid && j === m-1 && q === 2)) return false; } return true; };
    const R = pipeSolve({n, m, r, fixed, allow, border: null, weight: byDeg([.6,.2,1.4,1,.5])});
    fx.forEach(([i, j]) => { const x = ox + (i+.5)*s, y = oy + (j+.5)*s, gr = g.createRadialGradient(x, y, 0, x, y, s*3.2); gr.addColorStop(0, U.rgba(c, .35)); gr.addColorStop(1, U.rgba(c, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
    g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1; for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) g.strokeRect(ox + i*s, oy + j*s, s, s);
    g.strokeStyle = "rgba(255,255,255,.78)"; g.lineWidth = s*.15; g.lineCap = "round"; pipeLines(g, R, ox, oy, s);
    fx.forEach(([i, j]) => { const x = ox + i*s, y = oy + j*s;
      g.fillStyle = U.rgba(c, .9); g.fillRect(x + s*.12, y + s*.12, s*.76, s*.76); g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.strokeRect(x + s*.12, y + s*.12, s*.76, s*.76);
      // 圖釘
      g.fillStyle = "#fff"; g.beginPath(); g.arc(x + s*.5, y - s*.2, s*.16, 0, TAU); g.fill(); U.poly(g, [[x + s*.38, y - s*.14],[x + s*.62, y - s*.14],[x + s*.5, y + s*.12]], true); g.fill(); });
    // 入口箭頭
    const ex = ox + (mid+.5)*s, ey = oy + m*s; g.fillStyle = "#fff"; U.poly(g, [[ex, ey + 1],[ex - s*.25, Math.min(H-1, ey + s*.35)],[ex + s*.25, Math.min(H-1, ey + s*.35)]], true); g.fill();
  }, {ratio: 1.1}),

  // V06 曲線邊界：不規則基地內的管線，基地外強制空 tile
  Object.assign(function(g, W, H, r, c){
    const n = 18, m = Math.round(n*H/W), s = Math.min(W/n, H/m), ox = (W - n*s)/2, oy = (H - m*s)/2, nz = U.vnoise((r()*1e9)|0);
    const cx = W/2, cy = H/2, R0 = Math.min(W, H)*.44, rad = th => R0*(.62 + .5*nz(Math.cos(th)*1.3 + 5, Math.sin(th)*1.3 + 5));
    const inside = (x, y) => Math.hypot(x - cx, y - cy) < rad(Math.atan2(y - cy, x - cx));
    const inC = (i, j) => inside(ox + (i+.5)*s, oy + (j+.5)*s);
    const R = pipeSolve({n, m, r, allow:(i, j, t) => inC(i, j) || t === 0, weight: byDeg([.3,.25,1.5,1.1,.5])});
    const pts = []; for(let k = 0; k < 90; k++){ const th = k/90*TAU, rr = rad(th); pts.push([cx + Math.cos(th)*rr, cy + Math.sin(th)*rr]); }
    g.fillStyle = U.rgba(c, .1); U.poly(g, pts, true); g.fill();
    g.fillStyle = "rgba(255,255,255,.15)"; for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) if(!inC(i, j)) g.fillRect(ox + (i+.5)*s - 1, oy + (j+.5)*s - 1, 2, 2);
    g.strokeStyle = c; g.lineWidth = s*.2; g.lineCap = "round"; pipeLines(g, R, ox, oy, s);
    g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.setLineDash([5, 4]); U.poly(g, pts, true); g.stroke(); g.setLineDash([]);
  }, {ratio: 1}),

  // V07 吸引子控制機率：中心密集交織、外圍稀疏
  Object.assign(function(g, W, H, r, c){
    const n = 16, m = Math.round(n*H/W), s = Math.min(W/n, H/m), ox = (W - n*s)/2, oy = (H - m*s)/2;
    const ax = n*(.3 + r()*.4), ay = m*(.3 + r()*.4), D = Math.hypot(n, m)*.55, dn = (i, j) => Math.min(1, Math.hypot(i+.5-ax, j+.5-ay)/D);
    const R = pipeSolve({n, m, r, weight:(i, j, t) => { const d = dn(i, j); return [d*d*9, .25, 1, (1-d)*3, (1-d)*(1-d)*7][deg(t)]; }});
    const X = ox + ax*s, Y = oy + ay*s, gr = g.createRadialGradient(X, Y, 0, X, Y, D*s); gr.addColorStop(0, U.rgba(c, .45)); gr.addColorStop(1, U.rgba(c, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,255,255,.2)"; g.setLineDash([2, 4]); g.lineWidth = 1; [1,2,3,4].forEach(k => { g.beginPath(); g.arc(X, Y, k*D*s*.24, 0, TAU); g.stroke(); }); g.setLineDash([]);
    g.lineCap = "round";
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const t = R.grid[j*n+i]; if(t <= 0) continue; const d = dn(i, j), x = ox + (i+.5)*s, y = oy + (j+.5)*s;
      g.strokeStyle = mix(c, "#ffffff", Math.max(0, .6 - d)); g.lineWidth = s*(.08 + .3*(1-d)); g.beginPath();
      for(let q = 0; q < 4; q++) if(t>>q&1){ g.moveTo(x, y); g.lineTo(x + DX[q]*s/2, y + DY[q]*s/2); } g.stroke(); }
    g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X - 10, Y); g.lineTo(X + 10, Y); g.moveTo(X, Y - 10); g.lineTo(X, Y + 10); g.stroke();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(X, Y, 3.5, 0, TAU); g.fill();
  }, {ratio: 1}),

  // V08 回溯：歷史快照堆疊，最上層出現矛盾後退回上一層
  Object.assign(function(g, W, H, r, c){
    const n = 7, R = pipeSolve({n, m: n, r, weight: byDeg([.6,.3,1.5,1,.4])}), Lo = R.order.length;
    const cw = Math.min(W*.62, H*.56), dx = W*.075, dy = -H*.065, bx = W*.08, by = H - cw - H*.08, s = cw/n;
    const K = Math.floor(Lo*.7), idx = new Map(R.order.map((k, q) => [k, q]));
    let red = null;
    for(let lay = 0; lay < 4; lay++){
      const x0 = bx + lay*dx, y0 = by + lay*dy, top = lay === 3;
      g.fillStyle = top ? "#20202A" : "#1A1A22"; g.fillRect(x0, y0, cw, cw); frame(g, x0, y0, cw, cw, top ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.22)");
      // 下層只露出一條邊緣上的已塌縮格
      if(!top){ g.fillStyle = U.rgba(c, .35); for(let i = 0; i < n; i++) if(r() < .3 + lay*.2) g.fillRect(x0 + i*s + 2, y0 + 2, s - 4, Math.min(s, -dy) - 4); continue; }
      for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){ const k = j*n+i, q = idx.has(k) ? idx.get(k) : -1, x = x0 + (i+.5)*s, y = y0 + (j+.5)*s;
        if(q >= 0 && q < K){ const t = R.grid[k]; g.strokeStyle = c; g.lineWidth = s*.18; g.lineCap = "round"; g.beginPath(); for(let d = 0; d < 4; d++) if(t>>d&1){ g.moveTo(x, y); g.lineTo(x + DX[d]*s/2, y + DY[d]*s/2); } g.stroke(); }
        else { g.fillStyle = "rgba(255,255,255,.3)"; for(let d = 0; d < 4; d++) g.fillRect(x + (d%2 - .5)*s*.3 - 1, y + ((d>>1) - .5)*s*.3 - 1, 2, 2); if(q === K) red = [x, y]; }
      }
      if(!red) red = [x0 + cw*.72, y0 + cw*.72];
    }
    // 矛盾格
    g.fillStyle = "rgba(230,80,80,.3)"; g.fillRect(red[0] - s/2, red[1] - s/2, s, s);
    g.strokeStyle = "#E65050"; g.lineWidth = 2; g.beginPath(); g.moveTo(red[0] - s*.25, red[1] - s*.25); g.lineTo(red[0] + s*.25, red[1] + s*.25); g.moveTo(red[0] + s*.25, red[1] - s*.25); g.lineTo(red[0] - s*.25, red[1] + s*.25); g.stroke();
    // 退回箭頭（pop 回上一層）
    const x3 = bx + 3*dx, y3 = by + 3*dy, sx = x3 + cw + 3, sy = y3 + cw*.3, tx = bx + 2*dx + cw + 4, ty = by + 2*dy + cw*.95;
    g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(Math.min(W - 4, sx + W*.12), (sy + ty)/2, tx + 8, ty); g.stroke(); g.setLineDash([]);
    g.fillStyle = "#fff"; U.poly(g, [[tx + 1, ty],[tx + 10, ty - 5],[tx + 10, ty + 5]], true); g.fill();
  }, {ratio: 1.1}),

  // V09 連通性約束：單一連通網路，顏色＝從根部 BFS 的距離
  Object.assign(function(g, W, H, r, c){
    const n = 12, m = Math.round(n*H/W), s = Math.min(W/n, H/m)*.94, ox = (W - n*s)/2, oy = (H - m*s)/2, N = n*m, t = new Uint8Array(N);
    // 隨機 DFS 生成樹 → 保證連通，再加少量迴圈
    const root = (m>>1)*n + (n>>1), seen = new Uint8Array(N), st = [root]; seen[root] = 1;
    while(st.length){ const k = st[st.length-1], i = k % n, j = (k/n)|0, nb = [];
      for(let q = 0; q < 4; q++){ const x = i+DX[q], y = j+DY[q]; if(x >= 0 && y >= 0 && x < n && y < m && !seen[y*n+x]) nb.push(q); }
      if(!nb.length){ st.pop(); continue; } const q = nb[(r()*nb.length)|0], nk = (j+DY[q])*n + i+DX[q]; t[k] |= 1<<q; t[nk] |= 1<<OPP[q]; seen[nk] = 1; st.push(nk); }
    for(let e = 0; e < N*.08; e++){ const i = 1 + ((r()*(n-2))|0), j = 1 + ((r()*(m-2))|0), q = (r()*4)|0, nk = (j+DY[q])*n + i+DX[q]; t[j*n+i] |= 1<<q; t[nk] |= 1<<OPP[q]; }
    const dist = new Int16Array(N).fill(-1), qu = [root]; dist[root] = 0; let mx = 1;
    while(qu.length){ const k = qu.shift(), i = k % n, j = (k/n)|0; for(let q = 0; q < 4; q++) if(t[k]>>q&1){ const nk = (j+DY[q])*n + i+DX[q]; if(dist[nk] < 0){ dist[nk] = dist[k]+1; mx = Math.max(mx, dist[nk]); qu.push(nk); } } }
    g.lineCap = "round";
    for(let k = 0; k < N; k++){ const i = k % n, j = (k/n)|0, x = ox + (i+.5)*s, y = oy + (j+.5)*s, f = Math.max(0, dist[k])/mx;
      g.strokeStyle = mix("#ffffff", c, Math.min(1, f*1.3)); g.globalAlpha = 1 - f*.45; g.lineWidth = s*(.32 - .22*f); g.beginPath();
      for(let q = 0; q < 4; q++) if(t[k]>>q&1){ g.moveTo(x, y); g.lineTo(x + DX[q]*s/2, y + DY[q]*s/2); } g.stroke(); }
    g.globalAlpha = 1; const RX = ox + ((n>>1) + .5)*s, RY = oy + ((m>>1) + .5)*s;
    g.fillStyle = "#fff"; g.beginPath(); g.arc(RX, RY, s*.3, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.arc(RX, RY, s*.55, 0, TAU); g.stroke();
  }, {ratio: 1}),

  // V10 Timer 動畫：一部分已塌縮，未決定格依候選數畫成大小不同的圓；下方是時間軸影格
  Object.assign(function(g, W, H, r, c){
    const n = 11, top = H*.74, s = Math.min(W*.92/n, top*.92/n), ox = (W - n*s)/2, oy = (top - n*s)/2 + 4, wf = byDeg([.5,.3,1.4,1,.4]);
    const full = pipeSolve({n, m: n, r, weight: wf}), P = pipeSolve({n, m: n, r, steps: Math.floor(n*n*.28), weight: wf});
    for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){ const k = j*n+i, x = ox + (i+.5)*s, y = oy + (j+.5)*s;
      if(P.cnt[k] === 1){ const t = P.grid[k]; g.fillStyle = U.rgba(c, .1); g.fillRect(x - s/2 + 1, y - s/2 + 1, s - 2, s - 2);
        g.strokeStyle = c; g.lineWidth = s*.18; g.lineCap = "round"; g.beginPath(); for(let q = 0; q < 4; q++) if(t>>q&1){ g.moveTo(x, y); g.lineTo(x + DX[q]*s/2, y + DY[q]*s/2); } g.stroke(); }
      else { const f = P.cnt[k]/16; g.fillStyle = `rgba(255,255,255,${.08 + .25*f})`; g.beginPath(); g.arc(x, y, s*(.1 + .3*f), 0, TAU); g.fill(); } }
    const last = P.order[P.order.length-1]; if(last != null){ g.strokeStyle = "#fff"; g.lineWidth = 2; g.strokeRect(ox + (last % n)*s, oy + ((last/n)|0)*s, s, s); }
    // 時間軸
    const fw = (W - 6*8)/5, fy = top + 8, fs = Math.min(fw, H - fy - 14), Lo = full.order.length;
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(8, H - 6); g.lineTo(W - 8, H - 6); g.stroke();
    for(let f = 0; f < 5; f++){ const x0 = 8 + f*(fw + 8) + (fw - fs)/2, cs = fs/n, set = new Set(full.order.slice(0, Math.floor(Lo*f/4)));
      frame(g, x0, fy, fs, fs, f === 1 ? "#fff" : "rgba(255,255,255,.25)");
      for(let k = 0; k < n*n; k++){ const on = f === 4 || set.has(k); g.fillStyle = on ? (deg(full.grid[k]) ? c : U.rgba(c, .3)) : "rgba(255,255,255,.08)"; g.fillRect(x0 + (k % n)*cs + .5, fy + ((k/n)|0)*cs + .5, cs - 1, cs - 1); }
      if(f === 1){ g.fillStyle = "#fff"; g.beginPath(); g.arc(x0 + fs/2, H - 6, 3.5, 0, TAU); g.fill(); } }
  }, {ratio: 1.2}),

  // V11 從範例學規則：左上手排範例 → 學到的相鄰組合 → 大面積輸出
  Object.assign(function(g, W, H, r, c){
    const ex = [[3,3,0,0,2,2],[3,0,0,1,2,2],[0,0,1,1,1,1],[0,2,1,0,0,0],[0,2,1,0,3,3],[0,0,1,0,3,3]], T = 4;
    const col = [U.rgba(c, .22), "#E9E4D8", c, "#3F6E98"], A = new Uint8Array(4*T*T);
    for(let t = 0; t < T; t++) for(let q = 0; q < 4; q++) A[q*T*T + t*T + t] = 1;
    for(let j = 0; j < 6; j++) for(let i = 0; i < 6; i++) for(let q = 0; q < 4; q++){ const x = i+DX[q], y = j+DY[q]; if(x >= 0 && y >= 0 && x < 6 && y < 6) A[q*T*T + ex[j][i]*T + ex[y][x]] = 1; }
    const es = Math.min(W*.3, H*.26)/6, ex0 = W*.06, ey0 = H*.05;
    for(let j = 0; j < 6; j++) for(let i = 0; i < 6; i++){ g.fillStyle = col[ex[j][i]]; g.fillRect(ex0 + i*es, ey0 + j*es, es - 1, es - 1); }
    frame(g, ex0 - 3, ey0 - 3, es*6 + 5, es*6 + 5, "rgba(255,255,255,.7)");
    // 學到的相鄰組合（成對色塊）
    const pairs = []; for(let a = 0; a < T; a++) for(let b = a+1; b < T; b++) if([0,1,2,3].some(q => A[q*T*T + a*T + b])) pairs.push([a, b]);
    const px = ex0 + es*6 + W*.1, ps = es*.9; pairs.slice(0, 6).forEach(([a, b], k) => { const x = px + (k % 2)*ps*3.2, y = ey0 + ((k/2)|0)*ps*1.8 + es*.3; g.fillStyle = col[a]; g.fillRect(x, y, ps, ps); g.fillStyle = col[b]; g.fillRect(x + ps, y, ps, ps); frame(g, x - 1, y - 1, ps*2 + 1, ps + 1, "rgba(255,255,255,.3)"); });
    const oy = ey0 + es*6 + H*.07; g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ex0 + es*3, ey0 + es*6 + 5); g.lineTo(ex0 + es*3, oy - 6); g.stroke();
    g.fillStyle = "#fff"; U.poly(g, [[ex0 + es*3, oy - 2],[ex0 + es*3 - 5, oy - 9],[ex0 + es*3 + 5, oy - 9]], true); g.fill();
    const n = 18, s = (W*.88)/n, m = Math.max(4, Math.floor((H - oy - H*.04)/s)), ox = (W - n*s)/2;
    const R = wfc({n, m, T, r, compat:(a, b, q) => !!A[q*T*T + a*T + b], weight:(i, j, t) => [1.4, 1, .9, .7][t]});
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const t = R.grid[j*n+i]; g.fillStyle = t < 0 ? "#101014" : col[t]; g.fillRect(ox + i*s, oy + j*s, s - 1, s - 1); }
  }, {ratio: 1.2}),

  // V12 轉成可製造管件：等角管線實體＋接頭料件表
  Object.assign(function(g, W, H, r, c){
    const n = 5, R = pipeSolve({n, m: n, r, weight: byDeg([.2,.3,1.4,1.1,.5])}), aw = W*.72;
    const s = Math.min(aw*.98/(2*n*.866), H*.9/(n + .6)), P = isoMap(aw/2 + 4, H/2 - n*s*.5 + s*.2, s, 1);
    g.fillStyle = "rgba(255,255,255,.05)"; U.poly(g, [P(0,0,0), P(n,0,0), P(n,n,0), P(0,n,0)], true); g.fill(); g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1; g.stroke();
    const cnt = {L:0, T:0, X:0, o:0, I:0}, z = .45, tw = s*.22; g.lineCap = "round";
    isoOrder(n).forEach(([i, j]) => { const t = R.grid[j*n+i], d = deg(t); if(t <= 0) return;
      const cp = P(i+.5, j+.5, z), straight = t === 5 || t === 10;
      for(let q = 0; q < 4; q++) if(t>>q&1){ const e = P(i+.5+DX[q]*.5, j+.5+DY[q]*.5, z);
        g.strokeStyle = "#0E0E12"; g.lineWidth = tw + 3; g.beginPath(); g.moveTo(cp[0], cp[1]); g.lineTo(e[0], e[1]); g.stroke();
        g.strokeStyle = shade(c, .8); g.lineWidth = tw; g.stroke(); g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = tw*.25; g.beginPath(); g.moveTo(cp[0], cp[1] - tw*.25); g.lineTo(e[0], e[1] - tw*.25); g.stroke(); }
      // 接頭
      if(d === 1){ cnt.o++; g.fillStyle = "#fff"; g.beginPath(); g.ellipse(cp[0], cp[1], tw*.7, tw*.5, 0, 0, TAU); g.fill(); }
      else if(straight) cnt.I++;
      else if(d === 2){ cnt.L++; g.fillStyle = c; g.strokeStyle = "#0E0E12"; g.lineWidth = 1.5; g.beginPath(); g.arc(cp[0], cp[1], tw*.8, 0, TAU); g.fill(); g.stroke(); }
      else { cnt[d === 4 ? "X" : "T"]++; const k = d === 4 ? .22 : .16; g.strokeStyle = "#0E0E12"; g.lineWidth = 1; isoBox(g, P, i+.5-k, j+.5-k, z-k, 2*k, 2*k, 2*k, "#fff", shade(c, .6), shade(c, .9), true); } });
    // 料件表：彎頭、三通、十字、端蓋、直管（圖示＋長條）
    const items = ["L", "T", "X", "o", "I"], mx = Math.max(1, ...items.map(k => cnt[k])), bx = aw + 6, bw = W - bx - 10, rh = H*.1;
    items.forEach((k, q) => { const v = cnt[k], y = H*.18 + q*rh*1.35, ix = bx + 8, iy = y + rh/2;
      g.strokeStyle = "#fff"; g.lineWidth = 2; g.beginPath();
      if(k === "L"){ g.moveTo(ix - 3, iy - 7); g.lineTo(ix - 3, iy + 3); g.lineTo(ix + 7, iy + 3); }
      if(k === "T"){ g.moveTo(ix - 6, iy - 4); g.lineTo(ix + 6, iy - 4); g.moveTo(ix, iy - 4); g.lineTo(ix, iy + 6); }
      if(k === "X"){ g.moveTo(ix - 6, iy); g.lineTo(ix + 6, iy); g.moveTo(ix, iy - 6); g.lineTo(ix, iy + 6); }
      if(k === "o"){ g.arc(ix, iy, 4, 0, TAU); }
      if(k === "I"){ g.moveTo(ix, iy - 7); g.lineTo(ix, iy + 7); }
      g.stroke(); const Lw = (bw - 22)*v/mx; g.fillStyle = U.rgba(c, .85); g.fillRect(bx + 20, y + rh*.2, Math.max(2, Lw), rh*.6);
      for(let u = 1; u < v; u++){ g.fillStyle = "#15151B"; g.fillRect(bx + 20 + (bw - 22)*u/mx, y + rh*.2, 1, rh*.6); } });
  }, {ratio: .8}),
];

/* ================= 沒有照片的案例 ================= */
// A06-01 原始實作：knots 風格的像素輸出＋角落小範例（輸入圖）
ART.case["A06-01"] = function(g, W, H, r, c){
  const px = W/57, n = Math.ceil(W/(3*px)), m = Math.ceil(H/(3*px)), R = pipeSolve({n, m, r, weight: byDeg([.3,.1,1.5,1,.6])});
  const dot = (x, y, col) => { g.fillStyle = col; g.fillRect(x*px, y*px, px + .3, px + .3); };
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const t = R.grid[j*n+i], bx = i*3, by = j*3;
    if((i + j) % 2){ g.fillStyle = "rgba(255,255,255,.025)"; g.fillRect(bx*px, by*px, 3*px, 3*px); }
    if(t <= 0) continue; dot(bx+1, by+1, deg(t) >= 3 ? "#fff" : c);
    for(let q = 0; q < 4; q++) if(t>>q&1) dot(bx+1+DX[q], by+1+DY[q], c); }
  const S = pipeSolve({n: 4, m: 4, r, weight: byDeg([.1,.1,1.5,1,.8])}), ip = px*1.6, iw = 12*ip, ix = W - iw - 10, iy = H - iw - 10;
  g.fillStyle = "#111116"; g.fillRect(ix - 4, iy - 4, iw + 8, iw + 8); frame(g, ix - 4, iy - 4, iw + 8, iw + 8, "#fff");
  for(let j = 0; j < 4; j++) for(let i = 0; i < 4; i++){ const t = S.grid[j*4+i]; if(t <= 0) continue; g.fillStyle = c;
    g.fillRect(ix + (i*3+1)*ip, iy + (j*3+1)*ip, ip, ip); for(let q = 0; q < 4; q++) if(t>>q&1) g.fillRect(ix + (i*3+1+DX[q])*ip, iy + (j*3+1+DY[q])*ip, ip, ip); }
};
ART.case["A06-01"].ratio = 1;

// A06-02 Model Synthesis：從小範例模型（左上）推出大型線框模型
ART.case["A06-02"] = function(g, W, H, r, c){
  const n = 9, R = heightSolve(n, n, 4, r, (i, j, t) => [1.2, 1, 1, .8][t]), zk = .7;
  const s = Math.min(W*.9/(2*n*.866), H*.8/(n + 3*zk)), P = isoMap(W*.52, H*.2 + 3*zk*s*.6, s, zk);
  g.strokeStyle = U.rgba(c, .18); g.lineWidth = 1; for(let k = 0; k <= n; k++){ U.poly(g, [P(k,0,0), P(k,n,0)]); g.stroke(); U.poly(g, [P(0,k,0), P(n,k,0)]); g.stroke(); }
  isoOrder(n).forEach(([i, j]) => { const h = Math.max(0, R.grid[j*n+i]); if(!h) return;
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = .9; isoBox(g, P, i, j, 0, 1, 1, h, "rgba(21,21,27,.9)", "rgba(21,21,27,.9)", "rgba(21,21,27,.9)", true);
    const tp = [P(i,j,h), P(i+1,j,h), P(i+1,j+1,h), P(i,j+1,h)]; g.strokeStyle = c; g.lineWidth = 1.4; U.poly(g, tp, true); g.stroke();
    g.fillStyle = "#fff"; tp.forEach(p => g.fillRect(p[0] - 1.2, p[1] - 1.2, 2.4, 2.4)); });
  // 範例模型
  const es = s*.8, Q = isoMap(W*.16, H*.1, es, zk), ex = [[0,0,2],[1,0,1],[0,1,1],[1,1,0]];
  g.fillStyle = "#15151B"; g.fillRect(W*.16 - es*2.2, H*.1 - es*2.4, es*4.4, es*4.4); frame(g, W*.16 - es*2.2, H*.1 - es*2.4, es*4.4, es*4.4, "rgba(255,255,255,.5)");
  g.strokeStyle = "#fff"; g.lineWidth = 1; ex.forEach(([i, j, h]) => { for(let z = 0; z <= h; z++) isoBox(g, Q, i, j, z, 1, 1, 1, U.rgba(c, .9), shade(c, .5), shade(c, .7), true); });
  g.strokeStyle = "rgba(255,255,255,.6)"; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(W*.16 + es*2.3, H*.1); g.quadraticCurveTo(W*.42, H*.1, W*.5, H*.24); g.stroke(); g.setLineDash([]);
};
ART.case["A06-02"].ratio = .9;

// A06-03 Bad North：等角小島（海、沙灘、崖壁、階梯、房屋）
ART.case["A06-03"] = function(g, W, H, r, c){
  const n = 11, nz = U.vnoise((r()*1e9)|0), tgt = (i, j) => { const d = Math.hypot(i - n/2 + .5, j - n/2 + .5)/(n*.5); return Math.max(0, (1 - d*1.1)*4.2 + (nz(i*.45, j*.45) - .5)*2.2); };
  const R = heightSolve(n, n, 5, r, (i, j, t) => Math.exp(-Math.pow(t - tgt(i, j), 2)*1.5) + .01), zk = .55;
  const s = Math.min(W*.96/(2*n*.866), H*.9/(n + 4*zk)), P = isoMap(W/2, H/2 - n*s*.5 + 2*zk*s*.7, s, zk);
  g.fillStyle = "#1B2A38"; U.poly(g, [P(-3,-3,0), P(n+3,-3,0), P(n+3,n+3,0), P(-3,n+3,0)], true); g.fill();
  g.strokeStyle = "rgba(160,200,230,.25)"; g.lineWidth = 1; for(let k = 0; k < 26; k++){ const p = P(r()*(n+3) - 1.5, r()*(n+3) - 1.5, 0); g.beginPath(); g.moveTo(p[0] - 5, p[1]); g.quadraticCurveTo(p[0], p[1] - 2, p[0] + 5, p[1]); g.stroke(); }
  const hg = (i, j) => (i < 0 || j < 0 || i >= n || j >= n) ? 0 : Math.max(0, R.grid[j*n+i]);
  isoOrder(n).forEach(([i, j]) => { const h = hg(i, j); if(!h) return;
    const top = h === 1 ? "#D9C9A0" : h === 2 ? mix(c, "#6E8B5A", .5) : mix(c, "#ffffff", (h-3)*.2);
    g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = .7; isoBox(g, P, i, j, 0, 1, 1, h, top, "#6B6460", "#857D77", true);
    // 階梯：往下一階處畫踏步
    if(h > 1 && hg(i+1, j) === h-1 && (i + j) % 2 === 0){ g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1; for(let k = 1; k < 4; k++){ const a = P(i+1+k*.08, j+.3, h - k/4), b = P(i+1+k*.08, j+.7, h - k/4); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
    // 房屋
    if(h >= 3 && r() < .4){ g.strokeStyle = "rgba(0,0,0,.2)"; isoBox(g, P, i+.3, j+.3, h, .4, .4, .5, "#fff", "#C9C4BC", "#E6E1D9", false);
      const a = P(i+.3, j+.5, h+.85), b = P(i+.7, j+.5, h+.85); g.fillStyle = "#B8584A"; U.poly(g, [P(i+.3, j+.3, h+.5), a, b, P(i+.7, j+.3, h+.5)], true); g.fill(); g.fillStyle = "#9A4639"; U.poly(g, [a, b, P(i+.7, j+.7, h+.5), P(i+.3, j+.7, h+.5)], true); g.fill(); }
  });
};
ART.case["A06-03"].ratio = .85;

// A06-04 Townscaper：不規則四邊形網格上的水岸小鎮（俯視略帶高度）
ART.case["A06-04"] = function(g, W, H, r, c){
  const n = 10, m = Math.round(n*H/W) + 1, s = W/(n-1.4), nz = U.vnoise((r()*1e9)|0);
  g.fillStyle = "#1B3440"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(170,220,230,.18)"; g.lineWidth = 1; for(let k = 0; k < 30; k++){ const x = r()*W, y = r()*H; g.beginPath(); g.arc(x, y, 4 + r()*8, Math.PI*1.1, Math.PI*1.9); g.stroke(); }
  // 擾動後再鬆弛的網格點
  let V = []; for(let j = 0; j <= m; j++) for(let i = 0; i <= n; i++) V.push([(i - .7)*s + (r()-.5)*s*.75, (j - .5)*s + (r()-.5)*s*.75]);
  for(let it = 0; it < 3; it++) V = V.map((p, k) => { const i = k % (n+1), j = (k/(n+1))|0; if(!i || !j || i === n || j === m) return p;
    const a = V[k-1], b = V[k+1], u = V[k-n-1], d = V[k+n+1]; return [(p[0] + (a[0]+b[0]+u[0]+d[0])/4)/2, (p[1] + (a[1]+b[1]+u[1]+d[1])/4)/2]; });
  const pal = [c, "#F1E6D2", "#E7A47E", "#9CC7BA", "#F1E6D2"];
  const quads = []; for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const v = nz(i*.35, j*.35); if(v < .42) continue; const k = j*(n+1)+i;
    quads.push({q: [V[k], V[k+1], V[k+n+2], V[k+n+1]], h: 1 + Math.min(3, (v - .42)*10|0), col: pal[(i*3 + j*5 + ((r()*2)|0)) % pal.length]}); }
  quads.sort((a, b) => (a.q[0][1] + a.q[2][1]) - (b.q[0][1] + b.q[2][1]));
  quads.forEach(({q, h, col}) => { const up = h*s*.09;
    g.fillStyle = "rgba(0,0,0,.35)"; U.poly(g, q.map(p => [p[0] + up*.5, p[1] + up*.3]), true); g.fill();
    g.fillStyle = shade(col, .62); U.poly(g, [q[3], q[2], [q[2][0], q[2][1] - up], [q[3][0], q[3][1] - up]], true); g.fill();
    // 雙坡屋頂：沿屋脊分成亮暗兩半
    const top = q.map(p => [p[0], p[1] - up]), ra = [(top[0][0] + top[3][0])/2, (top[0][1] + top[3][1])/2 - s*.06], rb = [(top[1][0] + top[2][0])/2, (top[1][1] + top[2][1])/2 - s*.06];
    g.fillStyle = col; U.poly(g, [top[0], top[1], rb, ra], true); g.fill(); g.fillStyle = shade(col, .8); U.poly(g, [ra, rb, top[2], top[3]], true); g.fill();
    g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(ra[0], ra[1]); g.lineTo(rb[0], rb[1]); g.stroke();
    g.fillStyle = "rgba(20,20,30,.7)"; const wx = (q[3][0] + q[2][0])/2, wy = (q[3][1] + q[2][1])/2 - up*.55; g.fillRect(wx - 2, wy - 3, 4, 5); });
};
ART.case["A06-04"].ratio = 1;

// A06-05 無限城市：一點透視街景，近處已生成、遠處還是線框
ART.case["A06-05"] = function(g, W, H, r, c){
  const vx = W/2, vy = H*.42, f = W*.55, pr = (X, Y, Z) => [vx + X/Z*f, vy + Y/Z*f];
  const glow = g.createRadialGradient(vx, vy, 0, vx, vy, W*.4); glow.addColorStop(0, U.rgba(c, .3)); glow.addColorStop(1, U.rgba(c, 0)); g.fillStyle = glow; g.fillRect(0, 0, W, H);
  g.fillStyle = "#18181F"; U.poly(g, [pr(-1.6, 1.2, .5), pr(1.6, 1.2, .5), pr(1.6, 1.2, 40), pr(-1.6, 1.2, 40)], true); g.fill();
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.setLineDash([6, 8]); g.beginPath(); const a = pr(0, 1.2, .6), b = pr(0, 1.2, 40); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.setLineDash([]);
  const blocks = []; [-1, 1].forEach(sd => { let z = 1.05; while(z < 22){ const d = .8 + r()*1.6, h = 1.2 + r()*3.2; blocks.push({sd, z0: z, z1: z + d, h}); z += d + (r() < .3 ? .4 : .05); } });
  blocks.sort((p, q) => q.z0 - p.z0);
  blocks.forEach(({sd, z0, z1, h}) => { const X = sd*1.6, Y0 = 1.2, Y1 = 1.2 - h, near = z0 < 7, fade = Math.max(.15, 1 - z0/20);
    const face = [pr(X, Y0, z0), pr(X, Y0, z1), pr(X, Y1, z1), pr(X, Y1, z0)], topf = [pr(X, Y1, z0), pr(X, Y1, z1), pr(X + sd*2.5, Y1, z1), pr(X + sd*2.5, Y1, z0)], front = [pr(X, Y0, z0), pr(X + sd*2.5, Y0, z0), pr(X + sd*2.5, Y1, z0), pr(X, Y1, z0)];
    if(near){ g.fillStyle = shade(c, .45); U.poly(g, front, true); g.fill(); g.fillStyle = shade(c, .7); U.poly(g, face, true); g.fill(); g.fillStyle = c; U.poly(g, topf, true); g.fill();
      // 窗格
      g.fillStyle = "rgba(255,240,210,.55)"; for(let zz = z0 + .15; zz < z1 - .1; zz += .3) for(let yy = Y0 - .4; yy > Y1 + .2; yy -= .5){ if(r() < .45) continue; const p = pr(X, yy, zz), q = pr(X, yy - .25, zz + .15); g.fillRect(Math.min(p[0], q[0]), q[1], Math.max(1, Math.abs(q[0] - p[0])), Math.max(1, p[1] - q[1])); } }
    else { g.strokeStyle = U.rgba(c, fade); g.lineWidth = 1; g.setLineDash([3, 3]); U.poly(g, face, true); g.stroke(); U.poly(g, front, true); g.stroke(); g.setLineDash([]); } });
  // 行人
  g.fillStyle = "#fff"; const wp = pr(.3, 1.2, 1.6); g.beginPath(); g.arc(wp[0], wp[1] - 22, 3.5, 0, TAU); g.fill(); g.fillRect(wp[0] - 2, wp[1] - 18, 4, 14);
};
ART.case["A06-05"].ratio = .8;

// A06-06 Caves of Qud：洞穴像素地圖中段嵌入 WFC 遺跡房間
ART.case["A06-06"] = function(g, W, H, r, c){
  const cols = 44, rows = Math.round(cols*H/W), p = W/cols, nz = U.vnoise((r()*1e9)|0), M = [];
  for(let y = 0; y < rows; y++) for(let x = 0; x < cols; x++) M.push(nz(x*.16, y*.16) + nz(x*.4, y*.4)*.3 > .72 ? 1 : 0); // 1 = 岩壁
  const rn = 6, rm = Math.max(3, Math.floor((rows - 6)/5)), R = pipeSolve({n: rn, m: rm, r, weight: byDeg([.4,.4,1.2,1,.6])}), x0 = ((cols - rn*5)/2)|0, y0 = ((rows - rm*5)/2)|0;
  for(let j = 0; j < rm; j++) for(let i = 0; i < rn; i++){ const t = R.grid[j*rn+i];
    for(let v = 0; v < 5; v++) for(let u = 0; u < 5; u++){ const x = x0 + i*5 + u, y = y0 + j*5 + v, edge = u === 0 || v === 0 || u === 4 || v === 4;
      let w = edge ? 2 : 0; // 2 = 遺跡牆
      if(t > 0 && edge){ if(v === 0 && u === 2 && (t&1)) w = 0; if(u === 4 && v === 2 && (t&2)) w = 0; if(v === 4 && u === 2 && (t&4)) w = 0; if(u === 0 && v === 2 && (t&8)) w = 0; }
      if(t <= 0 && r() < .45) w = 3; // 3 = 瓦礫（空 tile 表示坍塌）
      M[y*cols + x] = w; } }
  for(let y = 0; y < rows; y++) for(let x = 0; x < cols; x++){ const v = M[y*cols + x], X = x*p, Y = y*p;
    if(v === 1){ g.fillStyle = `rgba(160,140,120,${.25 + .15*nz(x, y)})`; g.fillRect(X, Y, p - .5, p - .5); }
    else if(v === 2){ g.fillStyle = c; g.fillRect(X, Y, p - .5, p - .5); }
    else if(v === 3){ g.fillStyle = U.rgba(c, .4); g.fillRect(X + p*.2, Y + p*.2, p*.6, p*.6); }
    else { g.fillStyle = "rgba(255,255,255,.14)"; g.fillRect(X + p*.42, Y + p*.42, p*.16, p*.16); } }
  for(let k = 0; k < 12; k++){ const x = (r()*cols)|0, y = (r()*rows)|0; if(M[y*cols + x]) continue; g.fillStyle = k % 2 ? "#E8C267" : "#D8604F"; g.fillRect(x*p + p*.15, y*p + p*.15, p*.7, p*.7); }
};
ART.case["A06-06"].ratio = .8;

// A06-07 Monoceros：Grasshopper 元件畫布＋包絡 Slot 被模組填滿
ART.case["A06-07"] = function(g, W, H, r, c){
  g.fillStyle = "rgba(255,255,255,.07)"; for(let y = 8; y < H; y += 12) for(let x = 8; x < W; x += 12) g.fillRect(x, y, 1, 1);
  const bw = W*.17, bh = H*.13, nodes = [[W*.03, H*.1], [W*.03, H*.42], [W*.03, H*.74], [W*.27, H*.36]], outs = [];
  nodes.forEach(([x, y], k) => { const h = k === 3 ? bh*2 : bh; g.fillStyle = k === 3 ? U.rgba(c, .9) : "#3A3A46"; g.beginPath(); g.rect(x, y, bw, h); g.fill();
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.stroke(); g.fillStyle = "rgba(255,255,255,.6)"; g.fillRect(x + bw*.2, y + h/2 - 1, bw*.6, 2);
    outs.push([x + bw, y + h/2]); });
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.5;
  const wire = (a, b) => { g.beginPath(); g.moveTo(a[0], a[1]); g.bezierCurveTo(a[0] + 30, a[1], b[0] - 30, b[1], b[0], b[1]); g.stroke(); g.fillStyle = "#fff"; [a, b].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 2.5, 0, TAU); g.fill(); }); };
  [0, 1, 2].forEach(k => wire(outs[k], [nodes[3][0], nodes[3][1] + bh*2*(.2 + .3*k)]));
  // 包絡：4×4×3 slot
  const n = 4, zl = 3, s = Math.min(W*.42/(2*n*.866), H*.8/(n + zl)), P = isoMap(W*.74, H*.5 - n*s*.5 + zl*s*.45, s, 1);
  wire(outs[3], P(0, n, 1));
  g.strokeStyle = "rgba(255,255,255,.22)"; g.setLineDash([2, 3]); g.lineWidth = 1;
  for(let z = 0; z <= zl; z++) for(let k = 0; k <= n; k++){ U.poly(g, [P(k,0,z), P(k,n,z)]); g.stroke(); U.poly(g, [P(0,k,z), P(n,k,z)]); g.stroke(); }
  for(let i = 0; i <= n; i += n) for(let j = 0; j <= n; j += n){ U.poly(g, [P(i,j,0), P(i,j,zl)]); g.stroke(); }
  g.setLineDash([]);
  const hs = heightSolve(n, n, zl + 1, r, (i, j, t) => t ? 1 : .5);
  g.strokeStyle = "#0E0E12"; g.lineWidth = 1;
  isoOrder(n).forEach(([i, j]) => { const h = Math.max(0, hs.grid[j*n+i]); for(let z = 0; z < h; z++){ isoBox(g, P, i+.12, j+.12, z+.12, .76, .76, .76, mix(c, "#ffffff", .3), shade(c, .55), shade(c, .8), true);
    const q = P(i+.88, j+.5, z+.5); g.fillStyle = "#fff"; g.fillRect(q[0] - 2, q[1] - 2, 4, 4); } });
};
ART.case["A06-07"].ratio = .8;

// A06-08 Subdigital：雷切板材上的模組零件（單線）＋下方組裝後的聚合體
ART.case["A06-08"] = function(g, W, H, r, c){
  const sx = W*.06, sy = H*.04, sw = W*.88, sh = H*.44;
  g.fillStyle = "rgba(216,181,140,.08)"; g.fillRect(sx, sy, sw, sh); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(sx, sy, sw, sh);
  g.strokeStyle = c; g.lineWidth = 1.1;
  const cols = 5, rows = 3, pw = sw/cols, ph = sh/rows;
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){ const x = sx + i*pw + pw*.1, y = sy + j*ph + ph*.12, w = pw*.8, h = ph*.76, k = (i + j*2) % 3;
    if(k === 2){ g.beginPath(); g.arc(x + w/2, y + h/2, Math.min(w, h)*.45, 0, TAU); g.stroke(); g.beginPath(); g.arc(x + w/2, y + h/2, Math.min(w, h)*.18, 0, TAU); g.stroke(); continue; }
    // 帶榫槽的板片
    const nt = 3, pts = [[x, y]]; for(let q = 0; q < nt; q++){ const a = x + w*(q + .3)/nt, b = x + w*(q + .7)/nt; pts.push([a, y], [a, y + h*.2], [b, y + h*.2], [b, y]); } pts.push([x + w, y], [x + w, y + h], [x, y + h]);
    U.poly(g, pts, true); g.stroke(); if(k === 1) g.strokeRect(x + w*.35, y + h*.45, w*.3, h*.3); }
  // 組裝：模組依面對面規則長出來
  const s = Math.min(W*.075, H*.058), P = isoMap(W/2, H*.66, s, 1), vox = new Set(["0,0,0"]), list = [[0,0,0]];
  for(let tries = 0; list.length < 14 && tries < 400; tries++){ const b = list[(r()*list.length)|0], d = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1]][(r()*5)|0], p = [b[0]+d[0], b[1]+d[1], b[2]+d[2]], key = p.join(",");
    if(!vox.has(key) && Math.abs(p[0]) < 3 && Math.abs(p[1]) < 3 && p[2] < 3){ vox.add(key); list.push(p); } }
  list.sort((a, b) => (a[0]+a[1]) - (b[0]+b[1]) || a[2] - b[2]);
  list.forEach(([x, y, z]) => { g.strokeStyle = "#3A2A1E"; g.lineWidth = 1; isoBox(g, P, x, y, z, 1, 1, 1, "#D8B58C", "#9C7A56", "#BA9670", true);
    g.strokeStyle = "rgba(60,40,20,.7)"; U.poly(g, [P(x+.25, y+1, z+.25), P(x+.75, y+1, z+.25), P(x+.75, y+1, z+.75), P(x+.25, y+1, z+.75)], true); g.stroke(); });
};
ART.case["A06-08"].ratio = 1.2;

// A06-09 編碼建築 tile：平面斜投影量體＋每格的二進位編碼
ART.case["A06-09"] = function(g, W, H, r, c){
  const n = 6, m = 5, R = heightSolve(n, m, 4, r, (i, j, t) => [.8, 1, 1, .8][t]), s = W*.8/n, ox = W*.1, oy = H*.08 + 3*s*.55, k = s*.55, dh = s*.62;
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const x = ox + i*s, y = oy + j*dh; g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; g.strokeRect(x, y, s, dh); }
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const h = Math.max(0, R.grid[j*n+i]), x = ox + i*s, y = oy + j*dh; if(!h) continue; const up = h*k;
    g.fillStyle = shade(c, .65); g.fillRect(x, y + dh - up, s, up);
    g.fillStyle = "#EEEAE2"; g.fillRect(x, y - up, s, dh); g.strokeStyle = shade(c, .4); g.lineWidth = 1; g.strokeRect(x, y - up, s, dh); g.strokeRect(x, y + dh - up, s, up); }
  // 編碼矩陣：每格 6 位元
  const by = oy + m*dh + H*.05, bs = Math.min(s/7, (H - by - 8)/(m*1.3));
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const h = Math.max(0, R.grid[j*n+i]), code = (h*11 + i*3 + j*5) & 63;
    for(let b = 0; b < 6; b++){ const x = ox + i*s + b*bs*1.05, y = by + j*bs*1.3; if(code>>b&1){ g.fillStyle = c; g.fillRect(x, y, bs*.9, bs*.9); } else { g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8; g.strokeRect(x + .5, y + .5, bs*.9 - 1, bs*.9 - 1); } } }
};
ART.case["A06-09"].ratio = 1.1;

// A06-10 社會住宅平面＋BIM：房間配置平面圖與右側整數矩陣 → IFC 區塊
ART.case["A06-10"] = function(g, W, H, r, c){
  const n = 6, m = 4, T = 5, bad = {"4,4": 1, "3,1": 1, "1,3": 1};
  const R = wfc({n, m, T, r, compat:(a, b) => !bad[a + "," + b], allow:(i, j, t) => (j === 1 ? t === 0 : t !== 0), weight:(i, j, t) => [1, 1.2, .9, .6, .5][t]});
  const col = ["rgba(255,255,255,.06)", U.rgba(c, .35), U.rgba(c, .7), "#E7C58A", "#8FB9C9"], pw = W*.62, s = Math.min(pw/n, H*.8/m), ox = W*.05, oy = (H - m*s)/2;
  const tt = (i, j) => (i < 0 || j < 0 || i >= n || j >= m) ? -9 : R.grid[j*n+i];
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ g.fillStyle = col[Math.max(0, tt(i, j))]; g.fillRect(ox + i*s, oy + j*s, s, s); }
  g.strokeStyle = "#fff"; g.lineCap = "square";
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const t = tt(i, j), x = ox + i*s, y = oy + j*s;
    [[1, 0, x + s, y, x + s, y + s], [0, 1, x, y + s, x + s, y + s]].forEach(([dx, dy, x1, y1, x2, y2]) => { const u = tt(i+dx, j+dy); if(u === t || u === -9) return;
      g.lineWidth = 2; g.beginPath();
      if(t === 0 || u === 0){ // 門：開口＋開門弧
        const mx = (x1 + x2)/2, my = (y1 + y2)/2, d = s*.18; if(dx){ g.moveTo(x1, y1); g.lineTo(mx, my - d); g.moveTo(mx, my + d); g.lineTo(x2, y2); } else { g.moveTo(x1, y1); g.lineTo(mx - d, my); g.moveTo(mx + d, my); g.lineTo(x2, y2); }
        g.stroke(); g.lineWidth = .8; g.beginPath(); if(dx){ g.moveTo(mx, my - d); g.arc(mx, my - d, d*2, Math.PI/2, Math.PI); } else { g.moveTo(mx - d, my); g.arc(mx - d, my, d*2, 0, Math.PI/2); } g.stroke();
      } else { g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); } }); }
  g.lineWidth = 4; g.strokeRect(ox, oy, n*s, m*s);
  // 整數矩陣 → IFC 區塊
  const mx0 = ox + n*s + W*.06, ms = Math.min((W - mx0 - 8)/n, H*.06);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ g.fillStyle = col[Math.max(0, R.grid[j*n+i])]; g.fillRect(mx0 + i*ms, H*.18 + j*ms, ms - 1.5, ms - 1.5); }
  frame(g, mx0 - 3, H*.18 - 3, n*ms + 4, m*ms + 4);
  for(let k = 0; k < 4; k++){ const y = H*.52 + k*H*.09; g.fillStyle = col[k+1]; g.fillRect(mx0 + k*4, y, n*ms*.8, H*.06); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.strokeRect(mx0 + k*4, y, n*ms*.8, H*.06);
    g.beginPath(); g.moveTo(mx0 + n*ms/2, H*.18 + m*ms + 3); g.lineTo(mx0 + k*4 + 4, y); g.stroke(); }
};
ART.case["A06-10"].ratio = .8;

// A06-11 階層式 WFC 平面：粗分區 → 房間 → 家具，三層放大（單線稿）
ART.case["A06-11"] = function(g, W, H, r, c){
  const split = (x, y, w, h, d, out) => { if(d === 0 || (w < 30 && h < 30)){ out.push([x, y, w, h]); return; } const t = .35 + r()*.3;
    if(w > h){ split(x, y, w*t, h, d-1, out); split(x + w*t, y, w*(1-t), h, d-1, out); } else { split(x, y, w, h*t, d-1, out); split(x, y + h*t, w, h*(1-t), d-1, out); } };
  const big = a => a.reduce((p, q) => p[2]*p[3] > q[2]*q[3] ? p : q);
  const zoom = (a, b) => { g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.setLineDash([]); };
  // 第一層：粗分區
  const A = [W*.06, H*.04, W*.88, H*.36], z1 = []; split(...A, 2, z1);
  g.strokeStyle = "#fff"; g.lineWidth = 2; g.strokeRect(...A); g.lineWidth = 1; z1.forEach(q => g.strokeRect(...q));
  const pick = big(z1); g.fillStyle = U.rgba(c, .25); g.fillRect(...pick);
  // 第二層：房間（含門洞）
  const B = [W*.06, H*.48, W*.52, H*.48], z2 = []; split(...B, 3, z2);
  zoom([pick[0], pick[1] + pick[3]], [B[0], B[1]]); zoom([pick[0] + pick[2], pick[1] + pick[3]], [B[0] + B[2], B[1]]);
  const room = big(z2); g.fillStyle = U.rgba(c, .2); g.fillRect(...room);
  g.strokeStyle = c; g.lineWidth = 1.8; g.strokeRect(...B); g.lineWidth = 1; z2.forEach(q => g.strokeRect(...q));
  z2.forEach(q => { const dx = q[0] + q[2]*.5; if(q[1] + q[3] < B[1] + B[3] - 1){ g.strokeStyle = "#16161C"; g.lineWidth = 3; g.beginPath(); g.moveTo(dx - 4, q[1] + q[3]); g.lineTo(dx + 4, q[1] + q[3]); g.stroke(); } });
  // 第三層：家具
  const Cx = W*.64, Cy = H*.56, Cw = W*.3, Ch = H*.34;
  zoom([room[0] + room[2], room[1]], [Cx, Cy]); zoom([room[0] + room[2], room[1] + room[3]], [Cx, Cy + Ch]);
  g.strokeStyle = "#fff"; g.lineWidth = 1.8; g.strokeRect(Cx, Cy, Cw, Ch); g.lineWidth = 1;
  g.strokeRect(Cx + Cw*.08, Cy + Ch*.08, Cw*.4, Ch*.5); g.strokeRect(Cx + Cw*.08, Cy + Ch*.08, Cw*.4, Ch*.12); // 床
  g.beginPath(); g.arc(Cx + Cw*.72, Cy + Ch*.68, Cw*.12, 0, TAU); g.stroke(); // 桌
  [0, 1, 2, 3].forEach(k => { const a = k*TAU/4 + .4; g.strokeRect(Cx + Cw*.72 + Math.cos(a)*Cw*.19 - 3, Cy + Ch*.68 + Math.sin(a)*Cw*.19 - 3, 6, 6); });
  g.strokeRect(Cx + Cw*.6, Cy + Ch*.06, Cw*.34, Ch*.12); // 衣櫃
};
ART.case["A06-11"].ratio = 1.2;

// A06-12 WFC 路網＋CNN 配置機能：鳥瞰街廓與角落的卷積層示意
ART.case["A06-12"] = function(g, W, H, r, c){
  const n = 9, m = Math.round(n*H/W), s = Math.min(W/n, H/m), ox = (W - n*s)/2, oy = (H - m*s)/2;
  const R = pipeSolve({n, m, r, weight: byDeg([.6,.05,1,1.3,1.4], 1.6)}), nz = U.vnoise((r()*1e9)|0);
  const fcol = [U.rgba(c, .75), "#E9E4D8", "#6E9A64", "#D98E6B"];
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const x = ox + i*s, y = oy + j*s;
    [[0,0],[1,0],[0,1],[1,1]].forEach(([a, b]) => { const v = nz((i*2+a)*.5, (j*2+b)*.5), k = Math.min(3, (v*4)|0), px = x + a*s*.55 + s*.08, py = y + b*s*.55 + s*.08, w = s*.34;
      g.fillStyle = fcol[k]; g.globalAlpha = .85; g.fillRect(px, py, w, w); g.globalAlpha = 1;
      if(k === 2){ g.fillStyle = "rgba(20,50,20,.6)"; for(let q = 0; q < 3; q++){ g.beginPath(); g.arc(px + w*(.25 + .25*q), py + w*(.3 + .3*(q%2)), w*.1, 0, TAU); g.fill(); } } }); }
  g.lineCap = "square"; g.strokeStyle = "#44444F"; g.lineWidth = s*.2; pipeLines(g, R, ox, oy, s);
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.setLineDash([3, 3]); pipeLines(g, R, ox, oy, s); g.setLineDash([]);
  // CNN 卷積層
  const bx = W*.66, by = H*.8; g.fillStyle = "rgba(15,15,20,.88)"; g.fillRect(bx - 6, by - 8, W*.34, H*.2);
  [1, .75, .55, .4].forEach((k, q) => { const x = bx + q*W*.07, h = H*.14*k, y = by + (H*.14 - h)/2; g.fillStyle = U.rgba(c, .3 + q*.15); g.strokeStyle = "#fff"; g.lineWidth = 1;
    U.poly(g, [[x, y + 4], [x + 8, y], [x + 8, y + h - 4], [x, y + h]], true); g.fill(); g.stroke(); });
};
ART.case["A06-12"].ratio = 1;

// A06-13 鄉村住宅配置：等高線地形、彎曲道路、沿路的住宅／庭院／農地
ART.case["A06-13"] = function(g, W, H, r, c){
  const nz = U.vnoise((r()*1e9)|0), gn = 40, gm = Math.round(gn*H/W), f = (i, j) => nz(i*.09, j*.09)*.7 + nz(i*.25, j*.25)*.3;
  g.strokeStyle = "rgba(255,255,255,.13)"; g.lineWidth = 1;
  [.35, .42, .5, .58, .65, .72].forEach(iso => { g.beginPath(); U.contour(gn, gm, f, iso).forEach(([a, b]) => { g.moveTo(a[0]*W/(gn-1), a[1]*H/(gm-1)); g.lineTo(b[0]*W/(gn-1), b[1]*H/(gm-1)); }); g.stroke(); });
  const P0 = [-10, H*(.3 + r()*.2)], P1 = [W*.35, H*(.1 + r()*.3)], P2 = [W*.65, H*(.6 + r()*.3)], P3 = [W + 10, H*(.4 + r()*.2)];
  const bz = t => [0, 1].map(k => (1-t)**3*P0[k] + 3*(1-t)**2*t*P1[k] + 3*(1-t)*t*t*P2[k] + t**3*P3[k]);
  // 沿路地塊：WFC 兩列（0 房屋／1 庭院／2 農地），房屋與農地之間要隔庭院
  const lots = 16, R = wfc({n: lots, m: 2, T: 3, r, compat:(a, b) => !((a === 0 && b === 2) || (a === 2 && b === 0)), weight:(i, j, t) => [1.3, .8, 1][t]});
  for(let side = 0; side < 2; side++) for(let i = 0; i < lots; i++){ const t = R.grid[side*lots + i], u = (i + .5)/lots, p = bz(u), q = bz(u + .01), a = Math.atan2(q[1] - p[1], q[0] - p[0]), sg = side ? 1 : -1;
    g.save(); g.translate(p[0] - Math.sin(a)*sg*W*.07, p[1] + Math.cos(a)*sg*W*.07); g.rotate(a); const w = W/lots*.9, h = W*.09;
    if(t === 0){ g.fillStyle = c; g.fillRect(-w*.35, -h*.3, w*.7, h*.6); g.strokeStyle = "#fff"; g.lineWidth = 1; g.beginPath(); g.moveTo(-w*.35, 0); g.lineTo(w*.35, 0); g.stroke(); }
    else if(t === 1){ g.strokeStyle = U.rgba(c, .6); g.lineWidth = 1; g.strokeRect(-w*.4, -h*.4, w*.8, h*.8); g.fillStyle = "rgba(120,170,110,.6)"; g.beginPath(); g.arc(0, 0, w*.15, 0, TAU); g.fill(); }
    else { g.strokeStyle = "rgba(150,190,120,.55)"; g.lineWidth = 1; for(let k = -3; k <= 3; k++){ g.beginPath(); g.moveTo(-w*.45, k*h*.13); g.lineTo(w*.45, k*h*.13); g.stroke(); } }
    g.restore(); }
  g.strokeStyle = "#E9E4D8"; g.lineWidth = 3; g.beginPath(); for(let k = 0; k <= 40; k++){ const p = bz(k/40); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke();
};
ART.case["A06-13"].ratio = .9;

// A06-14 不規則原木＋AR：分岔木料的拱形聚合，桿件以應力著色，外加 AR 取景框
ART.case["A06-14"] = function(g, W, H, r, c){
  const members = [], cx = W/2, base = H*.85, span = W*.36, rise = H*.62;
  for(let k = 0; k < 9; k++){ const a = Math.PI*(1 - k/8), x = cx + Math.cos(a)*span, y = base - Math.sin(a)*rise, b = a - Math.PI/2 + (r() - .5)*.5, L = H*.2;
    const p0 = [x - Math.cos(b)*L*.5, y + Math.sin(b)*L*.5], p1 = [x + Math.cos(b)*L*.5, y - Math.sin(b)*L*.5], fk = [x + Math.cos(b + .7)*L*.35, y - Math.sin(b + .7)*L*.35];
    members.push({pts: [p0, [x + (r()-.5)*6, y + (r()-.5)*6], p1], fork: fk, mid: [x, y], stress: Math.abs(Math.cos(a))}); }
  const ramp = s => s < .5 ? mix("#4C7DB8", c, s*2) : mix(c, "#ffffff", (s - .5)*2);
  g.lineCap = "round"; g.lineJoin = "round";
  members.forEach(M => { g.strokeStyle = "#0E0E12"; g.lineWidth = 11; U.poly(g, M.pts); g.stroke(); g.beginPath(); g.moveTo(...M.mid); g.lineTo(...M.fork); g.stroke();
    g.strokeStyle = ramp(M.stress); g.lineWidth = 8; U.poly(g, M.pts); g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(...M.mid); g.lineTo(...M.fork); g.stroke(); });
  members.forEach(M => { g.fillStyle = "#fff"; g.beginPath(); g.arc(M.pts[2][0], M.pts[2][1], 2.5, 0, TAU); g.fill(); });
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(W*.05, base + 6); g.lineTo(W*.95, base + 6); g.stroke();
  // AR 疊圖
  g.strokeStyle = "#7FE0D0"; g.lineWidth = 1.2; [members[2], members[6]].forEach(M => { const xs = [...M.pts, M.fork].map(p => p[0]), ys = [...M.pts, M.fork].map(p => p[1]); const x0 = Math.min(...xs) - 6, y0 = Math.min(...ys) - 6, x1 = Math.max(...xs) + 6, y1 = Math.max(...ys) + 6;
    g.setLineDash([4, 3]); g.strokeRect(x0, y0, x1 - x0, y1 - y0); g.setLineDash([]); g.beginPath(); g.moveTo(x1, y0); g.lineTo(x1 + 10, y0 - 10); g.lineTo(x1 + 26, y0 - 10); g.stroke(); });
  const L = 14; [[6, 6, 1, 1], [W - 6, 6, -1, 1], [6, H - 6, 1, -1], [W - 6, H - 6, -1, -1]].forEach(([x, y, a, b]) => { g.beginPath(); g.moveTo(x + a*L, y); g.lineTo(x, y); g.lineTo(x, y + b*L); g.stroke(); });
  g.beginPath(); g.arc(cx, H*.5, 9, 0, TAU); g.moveTo(cx - 15, H*.5); g.lineTo(cx - 5, H*.5); g.moveTo(cx + 5, H*.5); g.lineTo(cx + 15, H*.5); g.stroke();
  // 應力色階
  for(let k = 0; k < 30; k++){ g.fillStyle = ramp(k/29); g.fillRect(W*.06 + k*W*.008, H*.94, W*.008 + .5, 4); }
};
ART.case["A06-14"].ratio = 1.1;

// A06-15 材料晶粒方向：多晶晶粒圖（色＝方向），角落極圖
ART.case["A06-15"] = function(g, W, H, r, c){
  const n = 90, m = Math.round(n*H/W), S = [], ns = 42;
  for(let k = 0; k < ns; k++) S.push([r()*n, r()*m, r()]);
  const lab = new Int16Array(n*m); for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ let b = 0, bd = 1e9; for(let k = 0; k < ns; k++){ const d = (S[k][0]-i)**2 + (S[k][1]-j)**2; if(d < bd){ bd = d; b = k; } } lab[j*n+i] = b; }
  const img = g.createImageData(n, m), A = U.rgb(c), B = [90, 140, 200], Wt = [240, 236, 228];
  for(let k = 0; k < n*m; k++){ const o = S[lab[k]][2], i = k % n, j = (k/n)|0, edge = (i < n-1 && lab[k+1] !== lab[k]) || (j < m-1 && lab[k+n] !== lab[k]);
    const col = o < .5 ? B.map((v, q) => v + (A[q] - v)*o*2) : A.map((v, q) => v + (Wt[q] - v)*(o - .5)*2);
    img.data[k*4] = edge ? 15 : col[0]; img.data[k*4+1] = edge ? 15 : col[1]; img.data[k*4+2] = edge ? 20 : col[2]; img.data[k*4+3] = 255; }
  const off = document.createElement("canvas"); off.width = n; off.height = m; off.getContext("2d").putImageData(img, 0, 0);
  g.imageSmoothingEnabled = false; g.drawImage(off, 0, 0, W, H);
  g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 1.2; S.forEach(([x, y, o]) => { const X = x*W/n, Y = y*H/m, a = o*Math.PI, L = W*.025; g.beginPath(); g.moveTo(X - Math.cos(a)*L, Y - Math.sin(a)*L); g.lineTo(X + Math.cos(a)*L, Y + Math.sin(a)*L); g.stroke(); });
  // 極圖
  const px = W*.82, py = H*.18, pr = W*.13; g.fillStyle = "rgba(15,15,20,.88)"; g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1; g.stroke();
  g.beginPath(); g.moveTo(px - pr, py); g.lineTo(px + pr, py); g.moveTo(px, py - pr); g.lineTo(px, py + pr); g.strokeStyle = "rgba(255,255,255,.3)"; g.stroke();
  S.forEach(([, , o], k) => { const a = o*Math.PI*2, d = pr*(.3 + .6*((k*37 % 11)/11)); g.fillStyle = c; g.fillRect(px + Math.cos(a)*d - 1.5, py + Math.sin(a)*d - 1.5, 3, 3); });
};
ART.case["A06-15"].ratio = 1;

// A06-52 JavaScript 移植：瀏覽器視窗，左邊程式碼、右邊 iterate() 逐列生成中的畫布
ART.case["A06-52"] = function(g, W, H, r, c){
  const x0 = W*.04, y0 = H*.06, ww = W*.92, wh = H*.88;
  g.fillStyle = "#24242E"; g.fillRect(x0, y0, ww, wh); g.fillStyle = "#30303C"; g.fillRect(x0, y0, ww, H*.08);
  ["#E06C5C", "#E8C267", "#7CC47F"].forEach((col, k) => { g.fillStyle = col; g.beginPath(); g.arc(x0 + 10 + k*10, y0 + H*.04, 3, 0, TAU); g.fill(); });
  g.fillStyle = "#1A1A22"; g.fillRect(x0 + ww*.25, y0 + H*.02, ww*.6, H*.04);
  // 程式碼
  const cw = ww*.3, cy0 = y0 + H*.12; for(let k = 0; k < 13; k++){ const y = cy0 + k*wh*.062, ind = [0, 1, 2, 2, 1, 1, 2, 3, 3, 2, 1, 0, 1][k];
    g.fillStyle = k % 5 === 1 ? U.rgba(c, .9) : k % 3 === 0 ? "rgba(230,190,120,.7)" : "rgba(255,255,255,.35)"; g.fillRect(x0 + 8 + ind*8, y, (cw - 20 - ind*8)*(.4 + .5*((k*7) % 5)/5), 3); }
  // 畫布：每個 tile 4×4 像素
  const cx0 = x0 + cw + 6, cy = y0 + H*.12, aw = ww - cw - 14, ah = wh - H*.19, n = 12, px = Math.min(aw, ah*1.4)/(n*4), m = Math.floor(ah/(px*4));
  const R = pipeSolve({n, m, r, weight: byDeg([.2,.2,1.5,1,.6])}), done = Math.floor(m*.6);
  g.fillStyle = "#111116"; g.fillRect(cx0, cy, n*4*px, m*4*px);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const t = R.grid[j*n+i], bx = cx0 + i*4*px, by = cy + j*4*px;
    if(j >= done){ for(let v = 0; v < 4; v++) for(let u = 0; u < 4; u++){ const a = .06 + r()*.2*(j === done ? 1.8 : 1); g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(bx + u*px, by + v*px, px, px); } continue; }
    g.fillStyle = c; if(t > 0){ g.fillRect(bx + px, by + px, px*2, px*2); if(t&1) g.fillRect(bx + px, by, px*2, px); if(t&2) g.fillRect(bx + 3*px, by + px, px, px*2); if(t&4) g.fillRect(bx + px, by + 3*px, px*2, px); if(t&8) g.fillRect(bx, by + px, px, px*2); } }
  g.strokeStyle = "#fff"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx0 - 3, cy + done*4*px); g.lineTo(cx0 + n*4*px + 3, cy + done*4*px); g.stroke();
  // 進度條
  const py = y0 + wh - H*.045; g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(cx0, py, aw, 4); g.fillStyle = c; g.fillRect(cx0, py, aw*done/m, 4);
};
ART.case["A06-52"].ratio = .8;

// A06-53 Wave（Stålberg）：tile 鋪在球面上，游標點選發光的格子
ART.case["A06-53"] = function(g, W, H, r, c){
  const n = 24, m = 12, R = pipeSolve({n, m, r, weight: byDeg([.4,.2,1.5,1,.5])}), cx = W/2, cy = H*.5, rad = Math.min(W, H)*.42, rot = r()*TAU, tilt = .35;
  const sp = (u, v) => { const lon = u/n*TAU + rot, lat = (v/m - .5)*Math.PI*.92; const x = Math.cos(lat)*Math.sin(lon), y = Math.sin(lat), z = Math.cos(lat)*Math.cos(lon);
    return [cx + x*rad, cy + (y*Math.cos(tilt) - z*Math.sin(tilt))*rad, y*Math.sin(tilt) + z*Math.cos(tilt)]; };
  const gr = g.createRadialGradient(cx - rad*.35, cy - rad*.4, rad*.1, cx, cy, rad); gr.addColorStop(0, "#34343F"); gr.addColorStop(1, "#15151B"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rad, 0, TAU); g.fill();
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.stroke();
  g.strokeStyle = "rgba(255,255,255,.07)"; for(let i = 0; i < n; i++){ g.beginPath(); let on = false; for(let v = 0; v <= m; v++){ const p = sp(i, v); if(p[2] < 0){ on = false; continue; } on ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); on = true; } g.stroke(); }
  g.lineCap = "round";
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const t = R.grid[j*n+i]; if(t <= 0) continue; const C0 = sp(i+.5, j+.5); if(C0[2] < 0) continue;
    g.strokeStyle = mix("#555566", c, Math.min(1, C0[2]*1.4)); g.lineWidth = 1 + C0[2]*4;
    for(let q = 0; q < 4; q++) if(t>>q&1){ const e = sp(i+.5+DX[q]*.5, j+.5+DY[q]*.5); g.beginPath(); g.moveTo(C0[0], C0[1]); g.lineTo(e[0], e[1]); g.stroke(); } }
  // 游標與被點選的發光格
  let hi = null; for(let j = 3; j < m-3 && !hi; j++) for(let i = 0; i < n; i++){ if(sp(i+.5, j+.5)[2] > .8){ hi = [i, j]; break; } }
  if(hi){ const [i, j] = hi, q = [sp(i, j), sp(i+1, j), sp(i+1, j+1), sp(i, j+1)]; g.fillStyle = "rgba(255,255,255,.25)"; U.poly(g, q, true); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.stroke();
    const p = sp(i+.8, j+.8); g.fillStyle = "#fff"; g.strokeStyle = "#111"; g.lineWidth = 1; U.poly(g, [[p[0], p[1]], [p[0], p[1] + 16], [p[0] + 4, p[1] + 12], [p[0] + 8, p[1] + 18], [p[0] + 10, p[1] + 17], [p[0] + 6, p[1] + 11], [p[0] + 11, p[1] + 11]], true); g.fill(); g.stroke(); }
};
ART.case["A06-53"].ratio = 1;
})();
