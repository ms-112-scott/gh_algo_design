/* F08 最小生成樹與 Steiner 樹：基本生成器（變形與案例的獨立畫法由 gh-enrich 的 ART 單元補上） */
(function(){
const ART = window.ART, U = window.GENUTIL;

// Weiszfeld：三點的 Fermat 點（到三點距離和最小）
function fermat(a, b, c){
  let x = (a[0]+b[0]+c[0])/3, y = (a[1]+b[1]+c[1])/3;
  for(let k = 0; k < 40; k++){
    let sx = 0, sy = 0, w = 0;
    for(const p of [a,b,c]){ const d = Math.hypot(x-p[0], y-p[1]); if(d < 1e-6) return [p[0], p[1]]; sx += p[0]/d; sy += p[1]/d; w += 1/d; }
    x = sx/w; y = sy/w;
  }
  return [x, y];
}

U.GEN["F08"] = function(g, W, H, r, v, c){
  // 1. 撒點：v 決定點數與分布（均勻／成群／環狀）
  const n = 16 + (v % 4)*6, mode = v % 3, P = [], pad = Math.min(W,H)*.08;
  const cl = [[.25,.3],[.72,.35],[.45,.75]].map(([x,y]) => [W*(x + (r()-.5)*.12), H*(y + (r()-.5)*.12)]);
  for(let i = 0; i < n; i++){
    if(mode === 1){ const k = cl[i%3], a = r()*U.TAU, d = Math.sqrt(r())*Math.min(W,H)*.17; P.push([Math.min(W-pad, Math.max(pad, k[0] + Math.cos(a)*d)), Math.min(H-pad, Math.max(pad, k[1] + Math.sin(a)*d))]); }
    else if(mode === 2){ const a = i/n*U.TAU + r()*.25, R = Math.min(W,H)*(.2 + r()*.24); P.push([W/2 + Math.cos(a)*R, H/2 + Math.sin(a)*R]); }
    else P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  }
  // 2. Kruskal：全部候選邊排序＋並查集
  const E = [];
  for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) E.push([i, j, Math.hypot(P[i][0]-P[j][0], P[i][1]-P[j][1])]);
  E.sort((a,b) => a[2] - b[2]);
  const par = P.map((_,i) => i), find = x => { while(par[x] !== x){ par[x] = par[par[x]]; x = par[x]; } return x; };
  const mst = [], N = P.map(p => p.slice()), adj = P.map(() => []), alive = P.map(() => true);
  for(const [a,b] of E){ const ra = find(a), rb = find(b); if(ra === rb) continue; par[ra] = rb; mst.push([a,b]); adj[a].push(b); adj[b].push(a); if(mst.length === n-1) break; }
  const total = () => { let s = 0; N.forEach((p,i) => { if(alive[i]) adj[i].forEach(j => { if(i < j) s += Math.hypot(p[0]-N[j][0], p[1]-N[j][1]); }); }); return s; };
  const Lm = total();
  // 3. Steiner：夾角 < 120° 處插入 Fermat 點
  const ang = (o, a, b) => { const ux = a[0]-o[0], uy = a[1]-o[1], vx = b[0]-o[0], vy = b[1]-o[1]; return Math.acos(Math.max(-1, Math.min(1, (ux*vx+uy*vy)/(Math.hypot(ux,uy)*Math.hypot(vx,vy)+1e-9)))); };
  for(let guard = 0; guard < 4*n; guard++){
    let best = null, bA = 2*Math.PI/3 - 1e-3;
    for(let v0 = 0; v0 < N.length; v0++){ if(!alive[v0]) continue; const nb = adj[v0];
      for(let p = 0; p < nb.length; p++) for(let q = p+1; q < nb.length; q++){ const t = ang(N[v0], N[nb[p]], N[nb[q]]); if(t < bA){ bA = t; best = [v0, nb[p], nb[q]]; } } }
    if(!best) break;
    const [o,a,b] = best, s = fermat(N[o], N[a], N[b]), si = N.length;
    N.push(s); alive.push(true); adj.push([o,a,b]);
    const rm = (x, y) => { adj[x] = adj[x].filter(z => z !== y); };
    rm(o,a); rm(a,o); rm(o,b); rm(b,o); adj[o].push(si); adj[a].push(si); adj[b].push(si);
  }
  // 4. 鬆弛 Steiner 點並刪除退化點
  for(let it = 0; it < 12; it++){
    for(let s = n; s < N.length; s++) if(alive[s] && adj[s].length === 3) N[s] = fermat(N[adj[s][0]], N[adj[s][1]], N[adj[s][2]]);
    for(let s = n; s < N.length; s++){ if(!alive[s]) continue;
      let hub = -1; adj[s].forEach(j => { if(Math.hypot(N[s][0]-N[j][0], N[s][1]-N[j][1]) < .5) hub = j; });
      if(adj[s].length > 2 && hub < 0) continue;
      const nb = adj[s].slice(); nb.forEach(j => { adj[j] = adj[j].filter(z => z !== s); }); adj[s] = []; alive[s] = false;
      if(hub < 0 && nb.length) hub = nb[0]; nb.forEach(j => { if(j !== hub){ adj[hub].push(j); adj[j].push(hub); } });
    }
  }
  const Ls = total();
  // 5. 畫：細灰 MST、粗主色 Steiner 網路、白色端點、主色 Steiner 點
  g.lineCap = "round";
  g.strokeStyle = "rgba(220,220,230,.35)"; g.lineWidth = 1; g.setLineDash([3,3]);
  mst.forEach(([a,b]) => { g.beginPath(); g.moveTo(P[a][0], P[a][1]); g.lineTo(P[b][0], P[b][1]); g.stroke(); });
  g.setLineDash([]);
  g.strokeStyle = U.rgba(c, .95); g.lineWidth = 2.6;
  N.forEach((p,i) => { if(alive[i]) adj[i].forEach(j => { if(i < j){ g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(N[j][0], N[j][1]); g.stroke(); } }); });
  for(let s = n; s < N.length; s++) if(alive[s]){ g.fillStyle = c; g.beginPath(); g.arc(N[s][0], N[s][1], 3, 0, U.TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1; g.stroke(); }
  P.forEach(p => { g.fillStyle = "#fff"; g.beginPath(); g.arc(p[0], p[1], 3.2, 0, U.TAU); g.fill(); });
  // 角落：兩條長度比例條（上：MST、下：Steiner）
  const bw = W*.22, bx = W - bw - 10, by = H - 18;
  g.fillStyle = "rgba(220,220,230,.35)"; g.fillRect(bx, by - 7, bw, 3);
  g.fillStyle = U.rgba(c, .95); g.fillRect(bx, by, bw*Ls/Lm, 3);
};

ART.var["F08"] = ART.var["F08"] || [];
})();

/* F08 最小生成樹與 Steiner 樹：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART;

// ---------- 共用小工具 ----------
function UF(n){ const p = [...Array(n).keys()]; const find = x => { while(p[x] !== x){ p[x] = p[p[x]]; x = p[x]; } return x; };
  const uni = (a, b) => { const ra = find(a), rb = find(b); if(ra === rb) return false; p[ra] = rb; return true; }; return {find, uni}; }
function allEdges(P){ const E = []; for(let i = 0; i < P.length; i++) for(let j = i+1; j < P.length; j++) E.push([i, j, Math.hypot(P[i][0]-P[j][0], P[i][1]-P[j][1])]); return E; }
// Kruskal：候選邊 [i,j,cost] 由短到長排序＋並查集，回傳 [i,j] 邊列表
function mst(P, edges){ const E = edges.slice().sort((a,b) => a[2]-b[2]); const uf = UF(P.length), out = [];
  for(const [i, j] of E){ if(uf.uni(i, j)){ out.push([i, j]); if(out.length === P.length - 1) break; } } return out; }
// 等角相機：yaw 繞 Z、pitch 俯角，回傳 [螢幕x, 螢幕y, 深度]
function cam3(yaw, pitch, sc, cx, cy, persp){ const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  return p => { const x = p[0]*cyw - p[1]*syw, y = p[0]*syw + p[1]*cyw, z = p[2], d = -y*cp + z*sp, s = -(y*sp + z*cp), f = persp ? persp/(persp-d) : 1; return [cx + x*sc*f, cy + s*sc*f, d]; }; }
// 格網迷宮：以格子鄰接當邊，跑生成樹演算法決定哪些牆打通
function mzNbrs(idx, nx, ny){ const x = idx % nx, y = (idx / nx) | 0, out = []; if(x > 0) out.push(idx-1); if(x < nx-1) out.push(idx+1); if(y > 0) out.push(idx-nx); if(y < ny-1) out.push(idx+nx); return out; }
function kruskalMaze(nx, ny, r){ const N = nx*ny, idx = (x,y) => y*nx+x, edges = [];
  for(let y = 0; y < ny; y++) for(let x = 0; x < nx; x++){ if(x < nx-1) edges.push([idx(x,y), idx(x+1,y), r()]); if(y < ny-1) edges.push([idx(x,y), idx(x,y+1), r()]); }
  edges.sort((a,b) => a[2]-b[2]); const uf = UF(N), open = new Set();
  for(const [a,b] of edges) if(uf.uni(a,b)) open.add(Math.min(a,b)+','+Math.max(a,b));
  return {open}; }
function primMaze(nx, ny, r){ const N = nx*ny, inMaze = new Array(N).fill(false); inMaze[0] = true; const open = new Set();
  let frontier = mzNbrs(0, nx, ny).map(nb => [0, nb]);
  while(frontier.length){ const i = (r()*frontier.length)|0; const [a,b] = frontier.splice(i,1)[0]; if(inMaze[b]) continue;
    inMaze[b] = true; open.add(Math.min(a,b)+','+Math.max(a,b)); mzNbrs(b, nx, ny).forEach(nb => { if(!inMaze[nb]) frontier.push([b, nb]); }); }
  return {open}; }
// Wilson：loop-erased random walk，讓每棵生成樹的機率均等
function wilsonMaze(nx, ny, r){ const N = nx*ny, inMaze = new Array(N).fill(false); inMaze[0] = true; const open = new Set();
  for(let start = 0; start < N; start++){ if(inMaze[start]) continue; const next = {}; let cur = start;
    while(!inMaze[cur]){ const nb = mzNbrs(cur, nx, ny); next[cur] = nb[(r()*nb.length)|0]; cur = next[cur]; }
    let c2 = start; while(!inMaze[c2]){ inMaze[c2] = true; const n2 = next[c2]; open.add(Math.min(c2,n2)+','+Math.max(c2,n2)); c2 = n2; } }
  return {open}; }
function drawMaze(g, ox, oy, cw, ch, nx, ny, mz, col, lw){ const idx = (x,y) => y*nx+x;
  g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "square"; g.beginPath(); g.rect(ox, oy, cw*nx, ch*ny);
  for(let y = 0; y < ny; y++) for(let x = 0; x < nx; x++){
    if(x < nx-1 && !mz.open.has(Math.min(idx(x,y),idx(x+1,y))+','+Math.max(idx(x,y),idx(x+1,y)))){ g.moveTo(ox+(x+1)*cw, oy+y*ch); g.lineTo(ox+(x+1)*cw, oy+(y+1)*ch); }
    if(y < ny-1 && !mz.open.has(Math.min(idx(x,y),idx(x,y+1))+','+Math.max(idx(x,y),idx(x,y+1)))){ g.moveTo(ox+x*cw, oy+(y+1)*ch); g.lineTo(ox+(x+1)*cw, oy+(y+1)*ch); } }
  g.stroke(); }
const PAL = ["#F2A007", "#2F6FE4", "#28C76F", "#E4572E", "#9B5DE5", "#00BBF9"];

// =================== 變形 ===================
ART.var["F08"] = ART.var["F08"] || [];

// V01 Prim：從根點往外長，邊依加入順序上色，根點有同心圈標記＋底部生長時間軸
ART.var["F08"][0] = function(g, W, H, r, c, U){
  const n = 22, pad = Math.min(W,H)*.1, P = [];
  for(let i = 0; i < n; i++) P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  const root = 0, inTree = new Array(n).fill(false); inTree[root] = true;
  const best = P.map(p => Math.hypot(p[0]-P[root][0], p[1]-P[root][1])), from = new Array(n).fill(root);
  const order = [root], edges = [];
  for(let k = 1; k < n; k++){
    let bi = -1, bd = Infinity;
    for(let i = 0; i < n; i++) if(!inTree[i] && best[i] < bd){ bd = best[i]; bi = i; }
    inTree[bi] = true; edges.push([from[bi], bi]); order.push(bi);
    for(let i = 0; i < n; i++) if(!inTree[i]){ const d = Math.hypot(P[i][0]-P[bi][0], P[i][1]-P[bi][1]); if(d < best[i]){ best[i] = d; from[i] = bi; } }
  }
  g.strokeStyle = "rgba(255,255,255,.06)"; for(let k = 1; k < 5; k++){ g.beginPath(); g.arc(P[root][0], P[root][1], Math.min(W,H)*.09*k, 0, U.TAU); g.stroke(); }
  edges.forEach(([a,b],idx) => { const t = idx/((edges.length-1)||1); g.strokeStyle = U.rgba(c, .35+.6*t); g.lineWidth = 1.2+t*2.2; g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  order.forEach((idx,k) => { const t = k/((order.length-1)||1); g.fillStyle = k === 0 ? "#fff" : U.rgba(c, .5+.5*t); g.beginPath(); g.arc(P[idx][0], P[idx][1], k===0?5:2.6, 0, U.TAU); g.fill(); if(k===0){ g.strokeStyle="#fff"; g.lineWidth=1.4; g.stroke(); } });
  const bw = W*.5, bx = (W-bw)/2, by = H-14;
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(bx,by); g.lineTo(bx+bw,by); g.stroke();
  order.forEach((idx,k) => { const t = k/((order.length-1)||1); g.fillStyle = U.rgba(c, .4+.6*t); g.beginPath(); g.arc(bx+bw*t, by, 2, 0, U.TAU); g.fill(); });
};

// V02 只用近鄰候選邊（模擬 Delaunay 網）：密集點下先畫稀疏候選網，再疊上 MST
ART.var["F08"][1] = function(g, W, H, r, c, U){
  const n = 70, pad = Math.min(W,H)*.06, P = [];
  for(let i = 0; i < n; i++) P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  const k = 5, cand = [];
  for(let i = 0; i < n; i++){ const d = []; for(let j = 0; j < n; j++) if(j !== i) d.push([j, Math.hypot(P[i][0]-P[j][0], P[i][1]-P[j][1])]);
    d.sort((a,b) => a[1]-b[1]); for(let t = 0; t < k; t++) cand.push([i, d[t][0], d[t][1]]); }
  const edges = mst(P, cand);
  g.strokeStyle = "rgba(255,255,255,.09)"; g.lineWidth = .6;
  cand.forEach(([a,b]) => { g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  g.strokeStyle = U.rgba(c, .95); g.lineWidth = 1.6; g.lineCap = "round";
  edges.forEach(([a,b]) => { g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  P.forEach(p => { g.fillStyle = "#fff"; g.beginPath(); g.arc(p[0], p[1], 1.6, 0, U.TAU); g.fill(); });
};

// V03 障礙物與邊界：候選邊需在界內且不穿過障礙，結果可能斷成幾棵樹（依連通元件上色）
ART.var["F08"][2] = function(g, W, H, r, c, U){
  const cx = W/2, cy = H/2;
  const blob = (bx,by,rx,ry,amp,nn) => { const ph = [r()*U.TAU, r()*U.TAU]; const P = [];
    for(let i = 0; i < nn; i++){ const a = i/nn*U.TAU, k = 1 + amp*(.5*Math.sin(2*a+ph[0]) + .3*Math.sin(3*a+ph[1])); P.push([bx+Math.cos(a)*rx*k, by+Math.sin(a)*ry*k]); } return P; };
  const boundary = blob(cx, cy, W*.42, H*.4, .16, 40);
  const obst = [blob(W*.32, H*.36, W*.11, H*.09, .25, 20), blob(W*.62, H*.62, W*.09, H*.1, .3, 20)];
  const pip = (P,x,y) => { let s = false; for(let i = 0, j = P.length-1; i < P.length; j = i++){ const a = P[i], b = P[j]; if((a[1] > y) !== (b[1] > y) && x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) s = !s; } return s; };
  const n = 26, P = []; let tries = 0;
  while(P.length < n && tries < 3000){ tries++; const x = W*.1+r()*W*.8, y = H*.1+r()*H*.8; if(pip(boundary,x,y) && !obst.some(o => pip(o,x,y))) P.push([x,y]); }
  const crosses = (a,b) => { for(const o of obst){ for(let t = 0; t <= 10; t++){ const u = t/10, x = a[0]+(b[0]-a[0])*u, y = a[1]+(b[1]-a[1])*u; if(pip(o,x,y)) return true; } } return false; };
  const E = []; for(let i = 0; i < P.length; i++) for(let j = i+1; j < P.length; j++) if(!crosses(P[i],P[j])) E.push([i,j,Math.hypot(P[i][0]-P[j][0], P[i][1]-P[j][1])]);
  const edges = mst(P, E), uf = UF(P.length); edges.forEach(([a,b]) => uf.uni(a,b));
  const compCol = {}, colOf = i => { const rt = uf.find(i); if(!(rt in compCol)) compCol[rt] = PAL[Object.keys(compCol).length % PAL.length]; return compCol[rt]; };
  g.fillStyle = "rgba(255,255,255,.04)"; U.poly(g, boundary, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.4; g.stroke();
  obst.forEach(o => { g.fillStyle = "rgba(80,140,220,.22)"; U.poly(g,o,true); g.fill(); g.strokeStyle = "rgba(140,180,240,.6)"; g.lineWidth = 1; g.stroke(); });
  edges.forEach(([a,b]) => { g.strokeStyle = U.rgba(colOf(a), .95); g.lineWidth = 2; g.lineCap = "round"; g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  P.forEach((p,i) => { g.fillStyle = colOf(i); g.beginPath(); g.arc(p[0], p[1], 3, 0, U.TAU); g.fill(); });
};

// V04 吸引子加權的邊成本：離吸引子越近，成本越低，樹會繞過去靠攏（邊粗細標示靠近程度）
ART.var["F08"][3] = function(g, W, H, r, c, U){
  const n = 20, pad = Math.min(W,H)*.1, P = [];
  for(let i = 0; i < n; i++) P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  const att = [W*(.3+r()*.3), H*(.35+r()*.3)];
  const glow = (x,y,R,col) => { const gr = g.createRadialGradient(x,y,0,x,y,R); gr.addColorStop(0,col); gr.addColorStop(1,"rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x-R,y-R,2*R,2*R); };
  glow(att[0], att[1], Math.min(W,H)*.5, U.rgba(c, .28));
  const D = Math.min(W,H)*.55;
  const midCost = (a,b) => { const mx=(P[a][0]+P[b][0])/2, my=(P[a][1]+P[b][1])/2, dA=Math.hypot(mx-att[0],my-att[1])/D, len=Math.hypot(P[a][0]-P[b][0],P[a][1]-P[b][1]); return len*(1+1.4*Math.max(0,1-dA)); };
  const E = []; for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) E.push([i,j,midCost(i,j)]);
  const edges = mst(P, E);
  edges.forEach(([a,b]) => { const mx=(P[a][0]+P[b][0])/2, my=(P[a][1]+P[b][1])/2, dA=Math.hypot(mx-att[0],my-att[1])/D, t=Math.max(0,1-dA);
    g.strokeStyle = U.rgba(c, .5+.45*t); g.lineWidth = 1.4+t*2.2; g.lineCap = "round"; g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  P.forEach(p => { g.fillStyle = "#fff"; g.beginPath(); g.arc(p[0], p[1], 2.8, 0, U.TAU); g.fill(); });
  g.strokeStyle = "#fff"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(att[0]-7,att[1]); g.lineTo(att[0]+7,att[1]); g.moveTo(att[0],att[1]-7); g.lineTo(att[0],att[1]+7); g.stroke();
  g.beginPath(); g.arc(att[0],att[1],3,0,U.TAU); g.fillStyle = "#fff"; g.fill();
};

// V05 接上既有道路：既有路網先預先合併，新點以最短支路接上（虛線是接駁支路，實線是點與點之間的樹）
ART.var["F08"][4] = function(g, W, H, r, c, U){
  const road1 = [[0,H*.3],[W*.35,H*.28],[W*.6,H*.42],[W,H*.38]], road2 = [[W*.15,0],[W*.22,H*.55],[W*.1,H]], roads = [road1, road2];
  const n = 16, pad = Math.min(W,H)*.08, P = [];
  for(let i = 0; i < n; i++) P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  const closestOnPoly = (pts,x,y) => { let bd = 1e9, bp = null;
    for(let i = 0; i < pts.length-1; i++){ const a=pts[i], b=pts[i+1], dx=b[0]-a[0], dy=b[1]-a[1], L=dx*dx+dy*dy||1, t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/L)), px=a[0]+dx*t, py=a[1]+dy*t, d=Math.hypot(px-x,py-y); if(d<bd){bd=d;bp=[px,py];} } return [bp,bd]; };
  const roadPt = P.map(p => { let bd = 1e9, bp = null; roads.forEach(rd => { const [q,d] = closestOnPoly(rd,p[0],p[1]); if(d<bd){bd=d;bp=q;} }); return [bp,bd]; });
  const ROAD = n, E = [];
  for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) E.push([i,j,Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1])]);
  for(let i = 0; i < n; i++) E.push([i, ROAD, roadPt[i][1]]);
  const uf = UF(n+1); E.sort((a,b) => a[2]-b[2]); const edges = [];
  for(const [a,b] of E) if(uf.uni(a,b)) edges.push([a,b]);
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 4; g.lineCap = "round"; g.lineJoin = "round";
  roads.forEach(rd => { g.beginPath(); rd.forEach((p,i) => i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1])); g.stroke(); });
  edges.forEach(([a,b]) => {
    if(a === ROAD || b === ROAD){ const bi = a === ROAD ? b : a, rp = roadPt[bi][0];
      g.strokeStyle = U.rgba(c, .8); g.lineWidth = 1.4; g.setLineDash([2,2]); g.beginPath(); g.moveTo(P[bi][0],P[bi][1]); g.lineTo(rp[0],rp[1]); g.stroke(); g.setLineDash([]);
    } else { g.strokeStyle = U.rgba(c, .95); g.lineWidth = 2; g.lineCap = "round"; g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); }
  });
  P.forEach(p => { g.fillStyle = "#fff"; g.beginPath(); g.arc(p[0], p[1], 2.8, 0, U.TAU); g.fill(); });
};

// V06 度數上限：Kruskal 加邊前檢查兩端度數，超過上限就跳過；節點周圍的小圓弧刻度＝目前度數
ART.var["F08"][5] = function(g, W, H, r, c, U){
  const n = 22, pad = Math.min(W,H)*.1, P = [], maxDeg = 3;
  for(let i = 0; i < n; i++) P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  const E = allEdges(P).sort((a,b) => a[2]-b[2]);
  const uf = UF(n), deg = new Array(n).fill(0), edges = [];
  for(const [a,b] of E){ if(deg[a] >= maxDeg || deg[b] >= maxDeg) continue; if(uf.uni(a,b)){ edges.push([a,b]); deg[a]++; deg[b]++; } }
  for(const [a,b] of E){ if(uf.find(a) !== uf.find(b) && deg[a] < maxDeg && deg[b] < maxDeg){ if(uf.uni(a,b)){ edges.push([a,b]); deg[a]++; deg[b]++; } } }
  g.lineCap = "round";
  edges.forEach(([a,b]) => { g.strokeStyle = "rgba(20,20,26,.9)"; g.lineWidth = 4.2; g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke();
    g.strokeStyle = U.rgba(c, .95); g.lineWidth = 2.2; g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  P.forEach((p,i) => { g.fillStyle = "#fff"; g.beginPath(); g.arc(p[0], p[1], 3.6, 0, U.TAU); g.fill();
    for(let k = 0; k < deg[i]; k++){ const a0 = k/maxDeg*U.TAU - Math.PI/2; g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1.6; g.beginPath(); g.arc(p[0], p[1], 7, a0, a0 + U.TAU/maxDeg*.55); g.stroke(); } });
};

// V07 刪掉最長邊分群：MST 完成後剪掉最長 k-1 條邊，各群凸包上色、被剪掉的邊虛線標紅
ART.var["F08"][6] = function(g, W, H, r, c, U){
  const n = 34, pad = Math.min(W,H)*.08, P = [];
  for(let i = 0; i < n; i++) P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  const edges = mst(P, allEdges(P));
  const withLen = edges.map(([a,b]) => [a,b,Math.hypot(P[a][0]-P[b][0],P[a][1]-P[b][1])]).sort((x,y) => y[2]-x[2]);
  const k = 4, cut = withLen.slice(0,k-1), keep = withLen.slice(k-1);
  const uf = UF(n); keep.forEach(([a,b]) => uf.uni(a,b));
  const groups = {}; for(let i = 0; i < n; i++){ const rt = uf.find(i); (groups[rt] = groups[rt] || []).push(i); }
  const hullFn = pts => { const S = pts.slice().sort((a,b) => a[0]-b[0] || a[1]-b[1]); if(S.length < 3) return S;
    const cross = (o,a,b) => (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
    const lo = []; for(const p of S){ while(lo.length >= 2 && cross(lo[lo.length-2],lo[lo.length-1],p) <= 0) lo.pop(); lo.push(p); }
    const up = []; for(let i = S.length-1; i >= 0; i--){ const p = S[i]; while(up.length >= 2 && cross(up[up.length-2],up[up.length-1],p) <= 0) up.pop(); up.push(p); }
    lo.pop(); up.pop(); return lo.concat(up); };
  const keys = Object.keys(groups);
  keys.forEach((rt,gi) => { const col = PAL[gi % PAL.length], pts = groups[rt].map(i => P[i]);
    if(pts.length >= 3){ const hp = hullFn(pts).map(p => [p[0]+(p[0]-W/2)*.06, p[1]+(p[1]-H/2)*.06]); g.fillStyle = U.rgba(col, .14); U.poly(g,hp,true); g.fill(); g.strokeStyle = U.rgba(col, .45); g.lineWidth = 1; g.stroke(); } });
  keep.forEach(([a,b]) => { const col = PAL[keys.indexOf(String(uf.find(a))) % PAL.length]; g.strokeStyle = U.rgba(col, .95); g.lineWidth = 1.8; g.lineCap = "round"; g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  cut.forEach(([a,b]) => { g.strokeStyle = "rgba(230,70,70,.75)"; g.lineWidth = 1.2; g.setLineDash([3,3]); g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); g.setLineDash([]); });
  keys.forEach((rt,gi) => { const col = PAL[gi % PAL.length]; groups[rt].forEach(i => { g.fillStyle = col; g.beginPath(); g.arc(P[i][0], P[i][1], 3, 0, U.TAU); g.fill(); }); });
};

// V08 3D 生成樹 → 管件與節點：等角投影，管件粗細依長度分組，節點球依度數放大
ART.var["F08"][7] = function(g, W, H, r, c, U){
  const n = 14, P3 = [];
  for(let i = 0; i < n; i++) P3.push([(r()-.5)*2, (r()-.5)*2, (r()-.2)*1.6]);
  const E = []; for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) E.push([i,j,Math.hypot(P3[i][0]-P3[j][0],P3[i][1]-P3[j][1],P3[i][2]-P3[j][2])]);
  const edges = mst(P3, E);
  const proj = cam3(-.55, .5, Math.min(W,H)*.34, W*.5, H*.56, 6), S = P3.map(proj);
  g.strokeStyle = "rgba(255,255,255,.06)";
  for(let i = -2; i <= 2; i++){ const a=proj([i,-2,-1]), b=proj([i,2,-1]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke();
    const a2=proj([-2,i,-1]), b2=proj([2,i,-1]); g.beginPath(); g.moveTo(a2[0],a2[1]); g.lineTo(b2[0],b2[1]); g.stroke(); }
  const lens = edges.map(([a,b]) => Math.hypot(P3[a][0]-P3[b][0],P3[a][1]-P3[b][1],P3[a][2]-P3[b][2])), mn = Math.min(...lens), mx = Math.max(...lens);
  const order2 = edges.map((e,i) => i).sort((i,j) => (S[edges[i][0]][2]+S[edges[i][1]][2]) - (S[edges[j][0]][2]+S[edges[j][1]][2]));
  order2.forEach(i => { const [a,b] = edges[i], t = (lens[i]-mn)/((mx-mn)||1);
    g.strokeStyle = U.rgba(c, .85); g.lineWidth = 1.6+(1-t)*3.2; g.lineCap = "round"; g.beginPath(); g.moveTo(S[a][0],S[a][1]); g.lineTo(S[b][0],S[b][1]); g.stroke(); });
  const deg = new Array(n).fill(0); edges.forEach(([a,b]) => { deg[a]++; deg[b]++; });
  const zorder = S.map((p,i) => i).sort((i,j) => S[i][2]-S[j][2]);
  zorder.forEach(i => { const rad = 3+deg[i]*1.4, grd = g.createRadialGradient(S[i][0]-rad*.3,S[i][1]-rad*.3,.3,S[i][0],S[i][1],rad);
    grd.addColorStop(0,"#fff"); grd.addColorStop(1,U.rgba(c,.9)); g.fillStyle = grd; g.beginPath(); g.arc(S[i][0], S[i][1], rad, 0, U.TAU); g.fill(); });
};

// V09 3D Steiner 樹狀柱：一個柱腳向多個屋頂支承點分岔，接近 120° 三叉，管徑依下游支承數變粗
ART.var["F08"][8] = function(g, W, H, r, c, U){
  const nsup = 5, sup = [];
  for(let i = 0; i < nsup; i++){ const a = i/nsup*U.TAU + r()*.4, rr = .5+r()*.5; sup.push([Math.cos(a)*rr, Math.sin(a)*rr, 1.1+r()*.15]); }
  const P3 = [[0,0,-1.1], ...sup];
  const E = []; for(let i = 0; i < P3.length; i++) for(let j = i+1; j < P3.length; j++) E.push([i,j,Math.hypot(P3[i][0]-P3[j][0],P3[i][1]-P3[j][1],P3[i][2]-P3[j][2])]);
  const edges = mst(P3, E);
  const N = P3.map(p => p.slice()), adj = P3.map(() => []), alive = P3.map(() => true);
  edges.forEach(([a,b]) => { adj[a].push(b); adj[b].push(a); });
  const ang3 = (o,a,b) => { const ux=a[0]-o[0],uy=a[1]-o[1],uz=a[2]-o[2],vx=b[0]-o[0],vy=b[1]-o[1],vz=b[2]-o[2], dot=ux*vx+uy*vy+uz*vz, lu=Math.hypot(ux,uy,uz), lv=Math.hypot(vx,vy,vz); return Math.acos(Math.max(-1,Math.min(1, dot/(lu*lv+1e-9)))); };
  const fermat3 = (a,b,cc) => { let x=(a[0]+b[0]+cc[0])/3, y=(a[1]+b[1]+cc[1])/3, z=(a[2]+b[2]+cc[2])/3;
    for(let k = 0; k < 25; k++){ let sx=0,sy=0,sz=0,w=0; for(const p of [a,b,cc]){ const d=Math.hypot(x-p[0],y-p[1],z-p[2])||1e-6; sx+=p[0]/d; sy+=p[1]/d; sz+=p[2]/d; w+=1/d; } x=sx/w; y=sy/w; z=sz/w; } return [x,y,z]; };
  for(let guard = 0; guard < 3*P3.length; guard++){
    let best = null, bA = 2*Math.PI/3 - 1e-3;
    for(let v0 = 0; v0 < N.length; v0++){ if(!alive[v0]) continue; const nb = adj[v0];
      for(let p = 0; p < nb.length; p++) for(let q = p+1; q < nb.length; q++){ const t = ang3(N[v0], N[nb[p]], N[nb[q]]); if(t < bA){ bA = t; best = [v0, nb[p], nb[q]]; } } }
    if(!best) break;
    const [o,a,b] = best, s = fermat3(N[o],N[a],N[b]), si = N.length;
    N.push(s); alive.push(true); adj.push([o,a,b]);
    const rm = (x,y) => { adj[x] = adj[x].filter(z => z !== y); };
    rm(o,a); rm(a,o); rm(o,b); rm(b,o); adj[o].push(si); adj[a].push(si); adj[b].push(si);
  }
  for(let it = 0; it < 8; it++) for(let s = P3.length; s < N.length; s++) if(alive[s] && adj[s].length === 3) N[s] = fermat3(N[adj[s][0]], N[adj[s][1]], N[adj[s][2]]);
  const cnt = new Array(N.length).fill(0), leafSet = new Set(Array.from({length: nsup}, (_,i) => i+1));
  const countBelow = (node, parent) => { let sN = leafSet.has(node) ? 1 : 0; adj[node].forEach(nb => { if(nb !== parent && alive[nb]) sN += countBelow(nb, node); }); cnt[node] = sN; return sN; };
  countBelow(0, -1);
  const proj = cam3(.6, .45, Math.min(W,H)*.3, W*.5, H*.6, 6), S = N.map(proj);
  g.strokeStyle = "rgba(255,255,255,.06)"; for(let i = -2; i <= 2; i++){ const a = proj([i,-2,-1.2]), b = proj([i,2,-1.2]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
  const drawn = new Set();
  for(let i = 0; i < N.length; i++) if(alive[i]) adj[i].forEach(j => { if(!alive[j]) return; const key = Math.min(i,j)+','+Math.max(i,j); if(drawn.has(key)) return; drawn.add(key);
    const w = 1.2 + Math.min(cnt[i], cnt[j])*1.5; g.strokeStyle = U.rgba(c, .9); g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(S[i][0],S[i][1]); g.lineTo(S[j][0],S[j][1]); g.stroke(); });
  for(let i = 1; i <= nsup; i++){ const [x,y] = S[i]; g.fillStyle = "#fff"; g.fillRect(x-3.4, y-3.4, 6.8, 6.8); }
  for(let s = P3.length; s < N.length; s++) if(alive[s]){ g.fillStyle = c; g.beginPath(); g.arc(S[s][0], S[s][1], 3, 0, U.TAU); g.fill(); }
  g.fillStyle = "#fff"; g.beginPath(); g.arc(S[0][0], S[0][1], 5, 0, U.TAU); g.fill(); g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1.4; g.stroke();
};

// V10 曲面上的測地生成樹：正弦起伏曲面（等高網格暗示彎曲），邊沿曲面取樣呈現自然弧度
ART.var["F08"][9] = function(g, W, H, r, c, U){
  const n = 15, pad = .12, pts = [];
  for(let i = 0; i < n; i++) pts.push([pad + r()*(1-2*pad), pad + r()*(1-2*pad)]);
  const amp = .34, freq = 1.6, hgt = (u,v) => Math.sin(u*Math.PI*freq)*Math.cos(v*Math.PI*(freq*.7))*amp;
  const proj = (u,v) => { const h = hgt(u,v); return [(u-.5)*W*.82 + W/2, (v-.5)*H*.78 + H/2 - h*Math.min(W,H)*.5, h]; };
  const gN = 14; g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1;
  for(let i = 0; i <= gN; i++){ g.beginPath(); for(let j = 0; j <= gN; j++){ const u=i/gN, v=j/gN, p=proj(u,v); j ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); } g.stroke();
    g.beginPath(); for(let j = 0; j <= gN; j++){ const u=j/gN, v=i/gN, p=proj(u,v); j ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); } g.stroke(); }
  const geo = (a,b) => { const K = 10; let s = 0, prev = proj(a[0],a[1]);
    for(let k = 1; k <= K; k++){ const t=k/K, u=a[0]+(b[0]-a[0])*t, v=a[1]+(b[1]-a[1])*t, p=proj(u,v);
      const h1 = hgt(a[0]+(b[0]-a[0])*(k-1)/K, a[1]+(b[1]-a[1])*(k-1)/K), h2 = hgt(u,v);
      s += Math.hypot(p[0]-prev[0], p[1]-prev[1], (h2-h1)*Math.min(W,H)*.5); prev = p; } return s; };
  const E = []; for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) E.push([i,j,geo(pts[i],pts[j])]);
  const edges = mst(pts, E);
  edges.forEach(([a,b]) => { const A = pts[a], B = pts[b], K = 10; g.strokeStyle = U.rgba(c, .95); g.lineWidth = 2.4; g.lineCap = "round"; g.beginPath();
    for(let k = 0; k <= K; k++){ const t=k/K, u=A[0]+(B[0]-A[0])*t, v=A[1]+(B[1]-A[1])*t, p=proj(u,v); k ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); } g.stroke(); });
  pts.forEach(p => { const P = proj(p[0],p[1]); g.fillStyle = "#fff"; g.beginPath(); g.arc(P[0], P[1], 3, 0, U.TAU); g.fill(); });
};

// V11 繞行率評估與補邊：細灰 MST 加白色補邊，右上角折線圖顯示最大繞行率隨補邊次數下降
ART.var["F08"][10] = function(g, W, H, r, c, U){
  const n = 17, pad = Math.min(W,H)*.1, P = [];
  for(let i = 0; i < n; i++) P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  const edges = mst(P, allEdges(P)), adj = P.map(() => []); edges.forEach(([a,b]) => { adj[a].push(b); adj[b].push(a); });
  const treeDist = s => { const d = new Array(n).fill(Infinity); d[s] = 0; const q = [s];
    while(q.length){ const u = q.shift(); adj[u].forEach(v => { const nd = d[u]+Math.hypot(P[u][0]-P[v][0],P[u][1]-P[v][1]); if(nd < d[v]){ d[v]=nd; q.push(v); } }); } return d; };
  const hist = [], extra = [], limit = 1.35;
  for(let it = 0; it < 5; it++){ let mx = 0, pr = null;
    for(let s = 0; s < n; s++){ const d = treeDist(s); for(let t = s+1; t < n; t++){ const eu = Math.hypot(P[s][0]-P[t][0],P[s][1]-P[t][1])||1e-6, rat = d[t]/eu; if(rat > mx){ mx = rat; pr = [s,t]; } } }
    hist.push(mx); if(mx <= limit || !pr) break; extra.push(pr); adj[pr[0]].push(pr[1]); adj[pr[1]].push(pr[0]); }
  g.strokeStyle = "rgba(220,220,230,.4)"; g.lineWidth = 1.3; g.lineCap = "round";
  edges.forEach(([a,b]) => { g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  g.strokeStyle = "#fff"; g.lineWidth = 2; g.setLineDash([1,3]);
  extra.forEach(([a,b]) => { g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  g.setLineDash([]);
  P.forEach(p => { g.fillStyle = c; g.beginPath(); g.arc(p[0], p[1], 2.8, 0, U.TAU); g.fill(); });
  if(hist.length > 1){ const gx = W*.66, gw = W-gx-10, gy = 10, gh = H*.22, mx = Math.max(...hist), mn = Math.min(...hist), sp = Math.max(1e-6, mx-mn);
    g.fillStyle = "rgba(18,18,23,.75)"; g.fillRect(gx-4, gy-4, gw+8, gh+8);
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(gx,gy); g.lineTo(gx,gy+gh); g.lineTo(gx+gw,gy+gh); g.stroke();
    g.strokeStyle = U.rgba(c, .95); g.lineWidth = 1.6; U.poly(g, hist.map((v,i) => [gx+gw*i/(hist.length-1), gy+gh*(1-(v-mn)/sp)])); g.stroke(); }
};

// V12 Kruskal 逐邊動畫：目前各連通元件依代表上色，虛線白框是正在檢查的邊，紅色叉是被拒絕的成環邊
ART.var["F08"][11] = function(g, W, H, r, c, U){
  const n = 20, pad = Math.min(W,H)*.1, P = [];
  for(let i = 0; i < n; i++) P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  const E = allEdges(P).sort((a,b) => a[2]-b[2]);
  const uf = UF(n), done = []; let stop = Math.floor(E.length*.42), rejected = null, testing = null;
  for(let k = 0; k < E.length; k++){ const [a,b] = E[k];
    if(k === stop){ testing = [a,b]; break; }
    if(uf.uni(a,b)) done.push([a,b]); else if(!rejected) rejected = [a,b];
  }
  const compCol = {}, colOf = i => { const rt = uf.find(i); if(!(rt in compCol)) compCol[rt] = PAL[Object.keys(compCol).length % PAL.length]; return compCol[rt]; };
  done.forEach(([a,b]) => { g.strokeStyle = U.rgba(colOf(a), .9); g.lineWidth = 2; g.lineCap = "round"; g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  P.forEach((p,i) => { g.fillStyle = colOf(i); g.beginPath(); g.arc(p[0], p[1], 3.2, 0, U.TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = .8; g.stroke(); });
  if(rejected){ const [a,b] = rejected; g.strokeStyle = "rgba(230,70,70,.85)"; g.lineWidth = 1.6; g.setLineDash([2,2]); g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); g.setLineDash([]);
    const mx = (P[a][0]+P[b][0])/2, my = (P[a][1]+P[b][1])/2; g.strokeStyle = "rgba(230,70,70,.9)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(mx-4,my-4); g.lineTo(mx+4,my+4); g.moveTo(mx-4,my+4); g.lineTo(mx+4,my-4); g.stroke(); }
  if(testing){ const [a,b] = testing; g.strokeStyle = "#fff"; g.lineWidth = 2.2; g.setLineDash([5,3]); g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); g.setLineDash([]); }
};

// =================== 無照片案例 ===================

// F08-01 Candilis-Josic-Woods：mat-building 網格中留出中庭節點，生成樹穿過中庭串連
ART.case["F08-01"] = function(g, W, H, r, c, U){
  const cols = 6, rows = 5, pad = Math.min(W,H)*.08, cw = (W-2*pad)/cols, ch = (H-2*pad)/rows;
  const voidSet = new Set(); while(voidSet.size < 5) voidSet.add(((r()*cols)|0)+','+((r()*rows)|0));
  const nodes = [];
  for(let y = 0; y < rows; y++) for(let x = 0; x < cols; x++){ const key = x+','+y;
    if(voidSet.has(key)){ const cx = pad+(x+.5)*cw, cy = pad+(y+.5)*ch;
      g.strokeStyle = "rgba(255,255,255,.12)"; g.setLineDash([2,2]); g.strokeRect(pad+x*cw+2, pad+y*ch+2, cw-4, ch-4); g.setLineDash([]);
      nodes.push([cx, cy]);
    } else { g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(pad+x*cw+2, pad+y*ch+2, cw-4, ch-4); g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1; g.strokeRect(pad+x*cw+2, pad+y*ch+2, cw-4, ch-4); }
  }
  const E = []; for(let i = 0; i < nodes.length; i++) for(let j = i+1; j < nodes.length; j++) E.push([i,j,Math.hypot(nodes[i][0]-nodes[j][0],nodes[i][1]-nodes[j][1])]);
  const edges = mst(nodes, E);
  g.strokeStyle = U.rgba(c, .95); g.lineWidth = 2.4; g.lineCap = "round";
  edges.forEach(([a,b]) => { g.beginPath(); g.moveTo(nodes[a][0],nodes[a][1]); g.lineTo(nodes[b][0],nodes[b][1]); g.stroke(); });
  nodes.forEach(p => { g.fillStyle = "#fff"; g.beginPath(); g.arc(p[0], p[1], 3.4, 0, U.TAU); g.fill(); });
};
ART.case["F08-01"].ratio = .85;

// F08-02 Ivy：把網格轉成面的對偶圖，MST 分割區塊上色，右下是攤平後的色塊示意
ART.case["F08-02"] = function(g, W, H, r, c, U){
  const cols = 7, rows = 6, pad = Math.min(W,H)*.1, cw = (W-2*pad)/cols, ch = (H-2*pad)*.62/rows, oy = pad;
  const V = []; for(let y = 0; y <= rows; y++) for(let x = 0; x <= cols; x++) V.push([pad+x*cw+(r()-.5)*cw*.25, oy+y*ch+(r()-.5)*ch*.25]);
  const vi = (x,y) => y*(cols+1)+x, tris = [];
  for(let y = 0; y < rows; y++) for(let x = 0; x < cols; x++){ const flip = (x+y)%2 === 0;
    if(flip){ tris.push([vi(x,y),vi(x+1,y),vi(x,y+1)]); tris.push([vi(x+1,y),vi(x+1,y+1),vi(x,y+1)]); }
    else { tris.push([vi(x,y),vi(x+1,y),vi(x+1,y+1)]); tris.push([vi(x,y),vi(x+1,y+1),vi(x,y+1)]); } }
  const ctr = t => [(V[t[0]][0]+V[t[1]][0]+V[t[2]][0])/3, (V[t[0]][1]+V[t[1]][1]+V[t[2]][1])/3], C = tris.map(ctr);
  const edgeKey = (a,b) => a < b ? a+'_'+b : b+'_'+a, em = {};
  tris.forEach((t,ti) => { [[0,1],[1,2],[2,0]].forEach(([p,q]) => { const k = edgeKey(t[p],t[q]); (em[k] = em[k] || []).push(ti); }); });
  const E = []; Object.values(em).forEach(list => { if(list.length === 2){ const [i,j] = list; E.push([i,j,Math.hypot(C[i][0]-C[j][0],C[i][1]-C[j][1])*(.6+r()*.8)]); } });
  const edges = mst(C, E), uf = UF(C.length); edges.forEach(([a,b]) => uf.uni(a,b));
  const compCol = {}, colOf = i => { const rt = uf.find(i); if(!(rt in compCol)) compCol[rt] = PAL[Object.keys(compCol).length % PAL.length]; return compCol[rt]; };
  tris.forEach((t,ti) => { g.fillStyle = U.rgba(colOf(ti), .35); U.poly(g,[V[t[0]],V[t[1]],V[t[2]]],true); g.fill(); g.strokeStyle = "rgba(10,10,14,.6)"; g.lineWidth = .6; g.stroke(); });
  g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.4;
  edges.forEach(([a,b]) => { g.beginPath(); g.moveTo(C[a][0],C[a][1]); g.lineTo(C[b][0],C[b][1]); g.stroke(); });
  const bx = pad, by = H-pad-H*.16, bh = H*.16, bw = W-2*pad, cols2 = 6, sw = bw/cols2;
  for(let i = 0; i < cols2; i++){ g.fillStyle = U.rgba(PAL[i%PAL.length], .4); g.fillRect(bx+i*sw+1, by, sw-2, bh); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.strokeRect(bx+i*sw+1, by, sw-2, bh); }
};
ART.case["F08-02"].ratio = 1.05;

// F08-03 建築物footprint的延伸MST：不規則量體＋MST，邊的粗細依長度暗示局部形態差異
ART.case["F08-03"] = function(g, W, H, r, c, U){
  const n = 24, pad = Math.min(W,H)*.08, P = [], rects = [];
  for(let i = 0; i < n; i++){ const x = pad+r()*(W-2*pad), y = pad+r()*(H-2*pad), w = 8+r()*22, h = 8+r()*22, a = (r()-.5)*.6; P.push([x,y]); rects.push([x,y,w,h,a]); }
  const edges = mst(P, allEdges(P)), lens = edges.map(([a,b]) => Math.hypot(P[a][0]-P[b][0],P[a][1]-P[b][1])), mn = Math.min(...lens), mx = Math.max(...lens);
  edges.forEach(([a,b],i) => { const t = (lens[i]-mn)/((mx-mn)||1); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = .8+t*1.6; g.setLineDash([1,3]); g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); g.setLineDash([]); });
  rects.forEach(([x,y,w,h,a]) => { g.save(); g.translate(x,y); g.rotate(a); g.fillStyle = U.rgba(c, .5); g.fillRect(-w/2,-h/2,w,h); g.strokeStyle = "#fff"; g.lineWidth = .8; g.strokeRect(-w/2,-h/2,w,h); g.restore(); });
};
ART.case["F08-03"].ratio = .95;

// F08-04 反向刪除：由最長邊開始測試移除，仍相通就真的刪掉（紅色叉是目前正在刪的邊），留下的樹以主色標出
ART.case["F08-04"] = function(g, W, H, r, c, U){
  const n = 13, pad = Math.min(W,H)*.12, P = [];
  for(let i = 0; i < n; i++) P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  let edges = allEdges(P).filter(() => r() < .45);
  const seen = new Set(edges.map(([a,b]) => Math.min(a,b)+'_'+Math.max(a,b)));
  mst(P, allEdges(P)).forEach(([a,b]) => { const k = Math.min(a,b)+'_'+Math.max(a,b); if(!seen.has(k)){ edges.push([a,b,Math.hypot(P[a][0]-P[b][0],P[a][1]-P[b][1])]); seen.add(k); } });
  const order = edges.slice().sort((x,y) => y[2]-x[2]);
  const stillConnected = list => { const u = UF(n); list.forEach(([a,b]) => u.uni(a,b)); const r0 = u.find(0); for(let i = 1; i < n; i++) if(u.find(i) !== r0) return false; return true; };
  let removedOne = null, cur = edges.slice();
  for(const e of order){ const rest = cur.filter(x => x !== e); if(stillConnected(rest)){ removedOne = e; cur = rest; break; } }
  const finalSet = new Set(mst(P, allEdges(P)).map(([a,b]) => Math.min(a,b)+'_'+Math.max(a,b)));
  cur.forEach(([a,b]) => { const isFinal = finalSet.has(Math.min(a,b)+'_'+Math.max(a,b));
    g.strokeStyle = isFinal ? U.rgba(c, .9) : "rgba(255,255,255,.16)"; g.lineWidth = isFinal ? 2 : 1; g.lineCap = "round"; g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  if(removedOne){ const [a,b] = removedOne; g.strokeStyle = "rgba(230,70,70,.85)"; g.lineWidth = 1.6; g.setLineDash([3,3]); g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); g.setLineDash([]);
    const mx = (P[a][0]+P[b][0])/2, my = (P[a][1]+P[b][1])/2; g.strokeStyle = "rgba(230,70,70,.95)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(mx-5,my-5); g.lineTo(mx+5,my+5); g.moveTo(mx-5,my+5); g.lineTo(mx+5,my-5); g.stroke(); }
  P.forEach(p => { g.fillStyle = "#fff"; g.beginPath(); g.arc(p[0], p[1], 2.6, 0, U.TAU); g.fill(); });
};

// F08-05 街道網路生成模型：生成樹當骨幹（白），再補幾條讓繞行率下降的迴路邊（主色），畫滿整個基地
ART.case["F08-05"] = function(g, W, H, r, c, U){
  const n = 30, pad = Math.min(W,H)*.04, P = [];
  for(let i = 0; i < n; i++) P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  const edges = mst(P, allEdges(P)), adj = P.map(() => []); edges.forEach(([a,b]) => { adj[a].push(b); adj[b].push(a); });
  const treeDist = s => { const d = new Array(n).fill(Infinity); d[s] = 0; const q = [s];
    while(q.length){ const u = q.shift(); adj[u].forEach(v => { const nd = d[u]+Math.hypot(P[u][0]-P[v][0],P[u][1]-P[v][1]); if(nd < d[v]){ d[v]=nd; q.push(v); } }); } return d; };
  const extra = [];
  for(let iter = 0; iter < 8; iter++){ let best = null, bd = 1;
    for(let s = 0; s < n; s++){ const d = treeDist(s); for(let t = s+1; t < n; t++){ const eu = Math.hypot(P[s][0]-P[t][0],P[s][1]-P[t][1])||1e-6, rat = d[t]/eu; if(rat > bd){ bd = rat; best = [s,t]; } } }
    if(!best) break; extra.push(best); adj[best[0]].push(best[1]); adj[best[1]].push(best[0]); }
  g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 1.6; g.lineCap = "round";
  edges.forEach(([a,b]) => { g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  g.strokeStyle = U.rgba(c, .85); g.lineWidth = 2;
  extra.forEach(([a,b]) => { g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  P.forEach(p => { g.fillStyle = "#fff"; g.beginPath(); g.arc(p[0], p[1], 2, 0, U.TAU); g.fill(); });
};
ART.case["F08-05"].ratio = .8;

// F08-06 LeafVein：MST 上疊最短路徑（白粗線）與一個度數較高的割點（紅圈），呈現「工具箱」多演算法並存的感覺
ART.case["F08-06"] = function(g, W, H, r, c, U){
  const n = 20, pad = Math.min(W,H)*.1, P = [];
  for(let i = 0; i < n; i++) P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  const edges = mst(P, allEdges(P)), adj = P.map(() => []); edges.forEach(([a,b]) => { adj[a].push(b); adj[b].push(a); });
  const s = 0, t = Math.floor(n*.7), parent = new Array(n).fill(-1), vis = new Array(n).fill(false); vis[s] = true; const q = [s];
  while(q.length){ const u = q.shift(); adj[u].forEach(v => { if(!vis[v]){ vis[v] = true; parent[v] = u; q.push(v); } }); }
  const path = []; let cur = t; while(cur !== -1){ path.push(cur); cur = parent[cur]; }
  const pathSet = new Set(); for(let i = 0; i < path.length-1; i++) pathSet.add(Math.min(path[i],path[i+1])+'_'+Math.max(path[i],path[i+1]));
  let cutV = -1; const deg = new Array(n).fill(0); edges.forEach(([a,b]) => { deg[a]++; deg[b]++; }); for(let i = 0; i < n; i++) if(deg[i] >= 3){ cutV = i; break; }
  edges.forEach(([a,b]) => { const on = pathSet.has(Math.min(a,b)+'_'+Math.max(a,b));
    g.strokeStyle = on ? "#fff" : U.rgba(c, .55); g.lineWidth = on ? 2.6 : 1.4; g.lineCap = "round"; g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  P.forEach((p,i) => { g.fillStyle = (i===s||i===t) ? "#fff" : U.rgba(c, .9); g.beginPath(); g.arc(p[0], p[1], (i===s||i===t)?4:2.6, 0, U.TAU); g.fill(); });
  if(cutV >= 0){ g.strokeStyle = "rgba(230,70,70,.9)"; g.lineWidth = 1.6; g.beginPath(); g.arc(P[cutV][0], P[cutV][1], 7, 0, U.TAU); g.stroke(); }
};
ART.case["F08-06"].ratio = .85;

// F08-51 Kruskal 迷宮：格子鄰接跑生成樹，未打通的牆保留，主色畫出從左上到右下的唯一路徑
ART.case["F08-51"] = function(g, W, H, r, c, U){
  const nx = 12, ny = 12, pad = Math.min(W,H)*.06, cw = (W-2*pad)/nx, ch = (H-2*pad)/ny;
  const mz = kruskalMaze(nx, ny, r);
  drawMaze(g, pad, pad, cw, ch, nx, ny, mz, "rgba(255,255,255,.85)", 2);
  const idx = (x,y) => y*nx+x, adjOpen = (a,b) => mz.open.has(Math.min(a,b)+','+Math.max(a,b));
  const s = idx(0,0), t = idx(nx-1,ny-1), parent = new Array(nx*ny).fill(-1), vis = new Array(nx*ny).fill(false); vis[s] = true; const q = [s];
  while(q.length){ const u = q.shift(); mzNbrs(u,nx,ny).forEach(v => { if(!vis[v] && adjOpen(u,v)){ vis[v] = true; parent[v] = u; q.push(v); } }); }
  const path = []; let cur = t; while(cur !== -1){ path.push(cur); cur = parent[cur]; }
  g.strokeStyle = U.rgba(c, .95); g.lineWidth = Math.min(cw,ch)*.3; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath();
  path.forEach((cIdx,i) => { const x = cIdx%nx, y = (cIdx/nx)|0, cx = pad+(x+.5)*cw, cy = pad+(y+.5)*ch; i ? g.lineTo(cx,cy) : g.moveTo(cx,cy); });
  g.stroke();
};
ART.case["F08-51"].ratio = 1;

// F08-52 隨機 Prim vs Wilson：左右各跑一次生成樹迷宮，比較短枝盲端（Prim）與均勻長廊（Wilson）的紋理差異
ART.case["F08-52"] = function(g, W, H, r, c, U){
  const nx = 8, ny = 10, gap = W*.04, pw = (W-gap*3)/2, pad = Math.min(pw,H)*.08, cw = (pw-2*pad)/nx, ch = (H-2*pad)/ny;
  const mzP = primMaze(nx, ny, r), mzW = wilsonMaze(nx, ny, r);
  drawMaze(g, gap, pad, cw, ch, nx, ny, mzP, "rgba(255,255,255,.85)", 1.6);
  drawMaze(g, gap*2+pw, pad, cw, ch, nx, ny, mzW, U.rgba(c, .95), 1.6);
  g.strokeStyle = "rgba(255,255,255,.25)"; g.setLineDash([3,3]); g.beginPath(); g.moveTo(W/2,pad*.4); g.lineTo(W/2,H-pad*.4); g.stroke(); g.setLineDash([]);
};
ART.case["F08-52"].ratio = .9;

// F08-53 p5.js Prim 教學：畫布上的點分「已連接」（實心）與「未連接」（空心），淡淡候選線示意逐一比較的過程
ART.case["F08-53"] = function(g, W, H, r, c, U){
  const step = Math.min(W,H)/22; g.fillStyle = "rgba(255,255,255,.06)";
  for(let x = step/2; x < W; x += step) for(let y = step/2; y < H; y += step){ g.beginPath(); g.arc(x, y, 1, 0, U.TAU); g.fill(); }
  const n = 18, pad = Math.min(W,H)*.12, P = [];
  for(let i = 0; i < n; i++) P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  const inTree = new Array(n).fill(false); inTree[0] = true; const edges = [], stopAt = Math.floor(n*.6); let nextEdge = null;
  for(let k = 1; k < n; k++){ let ba = -1, bb = -1, bd = Infinity;
    for(let i = 0; i < n; i++) if(inTree[i]) for(let j = 0; j < n; j++) if(!inTree[j]){ const d = Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1]); if(d < bd){ bd = d; ba = i; bb = j; } }
    if(k === stopAt+1){ nextEdge = [ba,bb]; break; }
    inTree[bb] = true; edges.push([ba,bb]);
  }
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = .6;
  for(let i = 0; i < n; i++) if(inTree[i]) for(let j = 0; j < n; j++) if(!inTree[j]){ g.beginPath(); g.moveTo(P[i][0],P[i][1]); g.lineTo(P[j][0],P[j][1]); g.stroke(); }
  g.strokeStyle = U.rgba(c, .95); g.lineWidth = 1.8; g.lineCap = "round";
  edges.forEach(([a,b]) => { g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  if(nextEdge){ g.strokeStyle = "#fff"; g.lineWidth = 2; g.setLineDash([4,3]); g.beginPath(); g.moveTo(P[nextEdge[0]][0],P[nextEdge[0]][1]); g.lineTo(P[nextEdge[1]][0],P[nextEdge[1]][1]); g.stroke(); g.setLineDash([]); }
  P.forEach((p,i) => { if(inTree[i]){ g.fillStyle = c; g.beginPath(); g.arc(p[0], p[1], 3.4, 0, U.TAU); g.fill(); }
    else { g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.4; g.beginPath(); g.arc(p[0], p[1], 3, 0, U.TAU); g.stroke(); } });
};

// F08-54 Houdini VEX：點屬性依到根點的樹上距離做色階漸層，左上角幾個小方塊示意節點式運算，右下是攤平後的色條
ART.case["F08-54"] = function(g, W, H, r, c, U){
  const n = 17, pad = Math.min(W,H)*.12, P = [];
  for(let i = 0; i < n; i++) P.push([pad + r()*(W-2*pad), pad + r()*(H-2*pad)]);
  const edges = mst(P, allEdges(P)), adj = P.map(() => []); edges.forEach(([a,b]) => { adj[a].push(b); adj[b].push(a); });
  const d0 = new Array(n).fill(Infinity); d0[0] = 0; const q = [0];
  while(q.length){ const u = q.shift(); adj[u].forEach(v => { if(d0[u]+1 < d0[v]){ d0[v] = d0[u]+1; q.push(v); } }); }
  const maxD = Math.max(...d0.filter(x => isFinite(x)));
  const ramp = t => { const S = [[60,70,90],[80,160,190],[230,200,90]], u = Math.max(0,Math.min(.999,t))*(S.length-1), i = u|0, f = u-i, a = S[i], b = S[Math.min(i+1,S.length-1)];
    return `rgb(${Math.round(a[0]+(b[0]-a[0])*f)},${Math.round(a[1]+(b[1]-a[1])*f)},${Math.round(a[2]+(b[2]-a[2])*f)})`; };
  edges.forEach(([a,b]) => { g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  P.forEach((p,i) => { const t = maxD ? d0[i]/maxD : 0; g.fillStyle = ramp(t); g.beginPath(); g.arc(p[0], p[1], 4, 0, U.TAU); g.fill(); g.strokeStyle = "rgba(20,20,26,.6)"; g.lineWidth = .8; g.stroke(); });
  const nn = [[W*.14,H*.12],[W*.32,H*.09],[W*.14,H*.28]];
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(nn[0][0]+8,nn[0][1]); g.lineTo(nn[1][0]-8,nn[1][1]); g.moveTo(nn[0][0],nn[0][1]+8); g.lineTo(nn[2][0],nn[2][1]-8); g.stroke();
  nn.forEach(([x,y]) => { g.fillStyle = "rgba(28,28,34,.9)"; g.fillRect(x-8,y-6,16,12); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.strokeRect(x-8,y-6,16,12); });
  const bx = W-pad-W*.3, by = H-pad-H*.08, bw = W*.3, bh = H*.08, seg = 5;
  for(let i = 0; i < seg; i++){ g.fillStyle = ramp(i/seg); g.fillRect(bx+i*bw/seg+1, by, bw/seg-2, bh); }
};
ART.case["F08-54"].ratio = .95;
})();
