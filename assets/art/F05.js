/* F05 最短路徑（Dijkstra／A*）：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = U.TAU;
const ACC = "#5FD6C9";   // 第二點綴色：都市資料、流量、數位量測
const WARM = "#F2C14E";  // 強調色：最佳解、出口、重點節點

/* ---------- 共用小工具 ---------- */
function rgba(c, a){ return U.rgba(c, a); }
function mixHex(a, b, t){ const [ar,ag,ab] = U.rgb(a), [br,bg,bb] = U.rgb(b);
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`; }
function glow(g, x, y, R, col, a){ const gr = g.createRadialGradient(x,y,0,x,y,R); gr.addColorStop(0, rgba(col,a)); gr.addColorStop(1, rgba(col,0)); g.fillStyle = gr; g.beginPath(); g.arc(x,y,R,0,TAU); g.fill(); }
function dot(g, x, y, R, col){ g.fillStyle = col; g.beginPath(); g.arc(x,y,R,0,TAU); g.fill(); }
function smooth(g, pts){ // Catmull-Rom 平滑折線
  if(pts.length < 3){ U.poly(g, pts); return; }
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for(let i = 0; i < pts.length-1; i++){
    const p0 = pts[Math.max(0,i-1)], p1 = pts[i], p2 = pts[i+1], p3 = pts[Math.min(pts.length-1,i+2)];
    const c1 = [p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6], c2 = [p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6];
    g.bezierCurveTo(c1[0],c1[1],c2[0],c2[1],p2[0],p2[1]);
  }
}

/* 格點 Dijkstra／多起點：cost(x,y) 回傳步進成本，<0 視為障礙；diag 是否走 8 鄰 */
function gridDijkstra(n, m, cost, sources, diag){
  const N = n*m, dist = new Float32Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), from = new Int32Array(N).fill(-1), vis = new Uint8Array(N), Q = [];
  sources.forEach((s,si) => { dist[s] = 0; from[s] = si; Q.push(s); });
  const nb = diag ? [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]] : [[1,0],[-1,0],[0,1],[0,-1]];
  while(Q.length){ let bi = 0; for(let k = 1; k < Q.length; k++) if(dist[Q[k]] < dist[Q[bi]]) bi = k; const u = Q.splice(bi,1)[0]; if(vis[u]) continue; vis[u] = 1;
    const x = u%n, y = (u/n)|0;
    for(const [dx,dy] of nb){ const nx = x+dx, ny = y+dy; if(nx < 0 || ny < 0 || nx >= n || ny >= m) continue; const q = ny*n+nx; const w = cost(nx,ny); if(w < 0) continue;
      const nd = dist[u] + ((dx && dy) ? 1.41421356 : 1)*w; if(nd < dist[q]){ dist[q] = nd; prev[q] = u; from[q] = from[u]; Q.push(q); } } }
  return {dist, prev, from};
}
/* A*：回傳 dist/prev，並記錄實際展開（彈出）的格點順序 explored */
function astar(n, m, cost, S, T){
  const N = n*m, tx = T%n, ty = (T/n)|0, dist = new Float32Array(N).fill(Infinity), f = new Float32Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), vis = new Uint8Array(N), explored = [], Q = [];
  const h = (x,y) => Math.hypot(x-tx, y-ty);
  dist[S] = 0; f[S] = h(S%n, (S/n)|0); Q.push(S);
  const nb = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  while(Q.length){ let bi = 0; for(let k = 1; k < Q.length; k++) if(f[Q[k]] < f[Q[bi]]) bi = k; const u = Q.splice(bi,1)[0]; if(vis[u]) continue; vis[u] = 1; explored.push(u); if(u === T) break;
    const x = u%n, y = (u/n)|0;
    for(const [dx,dy] of nb){ const nx = x+dx, ny = y+dy; if(nx < 0 || ny < 0 || nx >= n || ny >= m) continue; const q = ny*n+nx; const w = cost(nx,ny); if(w < 0) continue;
      const nd = dist[u] + ((dx && dy) ? 1.41421356 : 1)*w; if(nd < dist[q]){ dist[q] = nd; prev[q] = u; f[q] = nd + h(nx,ny); Q.push(q); } } }
  return {dist, prev, explored};
}
function pathTo(prev, T){ const p = []; for(let u = T; u >= 0; u = prev[u]) p.push(u); return p; }
function mkWalls(n, m, r, density){ const w = new Uint8Array(n*m); for(let i = 0; i < n*m; i++) w[i] = r() < density ? 1 : 0; return w; }

/* 平面點圖：撒點＋鄰近連邊（近似規劃圖／街道網路），保證每點至少連 2～3 邊 */
function buildGraph(r, n, x0, y0, w, h, k){
  const P = []; for(let i = 0; i < n; i++) P.push([x0 + r()*w, y0 + r()*h]);
  const adj = P.map(() => []);
  for(let i = 0; i < n; i++){
    const near = P.map((p,j) => [j, Math.hypot(p[0]-P[i][0], p[1]-P[i][1])]).filter(([j]) => j !== i).sort((a,b) => a[1]-b[1]);
    for(const [j,d] of near.slice(0, k)){ if(!adj[i].some(e => e[0] === j)){ adj[i].push([j,d]); adj[j].push([i,d]); } }
  }
  return {P, adj};
}
function graphDijkstra(adj, S){
  const n = adj.length, dist = new Float32Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), vis = new Uint8Array(n), Q = [S]; dist[S] = 0;
  while(Q.length){ let bi = 0; for(let k = 1; k < Q.length; k++) if(dist[Q[k]] < dist[Q[bi]]) bi = k; const u = Q.splice(bi,1)[0]; if(vis[u]) continue; vis[u] = 1;
    for(const [v,w] of adj[u]){ const nd = dist[u]+w; if(nd < dist[v]){ dist[v] = nd; prev[v] = u; Q.push(v); } } }
  return {dist, prev};
}
// 等角投影：繞 z 軸轉 rot、垂直壓縮 tilt
function isoP(cx, cy, u, rot, tilt){ const cr = Math.cos(rot), sr = Math.sin(rot), tl = tilt ?? .55;
  return (x,y,z) => { const X = x*cr - y*sr, Y = x*sr + y*cr; return [cx + X*u, cy + Y*u*tl - z*u, Y*tl*.4 + z*.25]; }; }
function box(g, proj, x, y, z, sx, sy, sz, fillC, strokeC){
  const p = (a,b,c) => proj(x+a, y+b, z+c);
  const top = [p(0,0,sz), p(sx,0,sz), p(sx,sy,sz), p(0,sy,sz)], L = [p(0,0,0), p(0,sy,0), p(0,sy,sz), p(0,0,sz)], R = [p(sx,0,0), p(sx,sy,0), p(sx,sy,sz), p(sx,0,sz)];
  [[top,1],[R,.78],[L,.6]].forEach(([pts,k]) => { g.fillStyle = fillC(k); U.poly(g, pts, true); g.fill(); if(strokeC){ g.strokeStyle = strokeC; g.lineWidth = .8; g.stroke(); } });
}

/* ================= 變形 V01–V12 ================= */
ART.var["F05"] = [
// V01 A* 啟發式搜尋：只展開一小片朝目標偏的區域，虛線圈標出「若用 Dijkstra 要展開這麼大」
function(g, W, H, r, c){
  const n = 40, m = Math.round(n*H/W), s = W/n, wall = mkWalls(n, m, r, .26);
  const S = ((m/2)|0)*n + 1, T = ((m/2)|0)*n + n-2; wall[S] = wall[T] = 0;
  const {dist, prev, explored} = astar(n, m, (x,y) => wall[y*n+x] ? -1 : 1, S, T);
  g.fillStyle = "#1A1A22"; g.fillRect(0,0,W,H);
  for(let i = 0; i < n*m; i++) if(wall[i]){ const x = (i%n)*s, y = ((i/n)|0)*s; g.fillStyle = "#33333E"; g.fillRect(x+1,y+1,s-2,s-2); }
  let mx = 0; dist.forEach(d => { if(d < Infinity) mx = Math.max(mx,d); });
  explored.forEach(i => { const x = (i%n)*s, y = ((i/n)|0)*s; g.fillStyle = rgba(c, .1 + (1 - dist[i]/mx)*.3); g.fillRect(x+1,y+1,s-2,s-2); });
  g.strokeStyle = rgba("#ffffff", .35); g.setLineDash([4,4]); g.lineWidth = 1.2;
  g.beginPath(); g.arc((S%n+.5)*s, (((S/n)|0)+.5)*s, Math.sqrt(n*m/Math.PI)*s*.92, 0, TAU); g.stroke(); g.setLineDash([]);
  const path = pathTo(prev, T).map(u => [(u%n+.5)*s, (((u/n)|0)+.5)*s]);
  g.strokeStyle = "#fff"; g.lineWidth = s*.28; g.lineCap = "round"; g.lineJoin = "round"; smooth(g, path); g.stroke();
  dot(g, (S%n+.5)*s, (((S/n)|0)+.5)*s, s*.42, "#fff"); dot(g, (T%n+.5)*s, (((T/n)|0)+.5)*s, s*.42, c);
},
// V02 地形坡度成本：等角地形＋沿等高線蜿蜒的步道
function(g, W, H, r, c){
  const nf = U.vnoise((r()*1e6)|0), proj = isoP(W*.5, H*.06, Math.min(W,H)*.027, .5, .55), n = 26;
  const sky = g.createLinearGradient(0,0,0,H); sky.addColorStop(0, "#1B222B"); sky.addColorStop(1, "#15151B"); g.fillStyle = sky; g.fillRect(0,0,W,H);
  const hgt = (i,j) => (nf(i*.14, j*.14)*.7 + nf(i*.35+9,j*.35+9)*.3) * 7;
  for(let j = 0; j < n-1; j++) for(let i = 0; i < n-1; i++){
    const h00 = hgt(i,j), h10 = hgt(i+1,j), h11 = hgt(i+1,j+1), h01 = hgt(i,j+1), avg = (h00+h10+h11+h01)/4;
    const pts = [proj(i,j,h00), proj(i+1,j,h10), proj(i+1,j+1,h11), proj(i,j+1,h01)];
    g.fillStyle = mixHex("#26262F", c, .12 + avg/8); U.poly(g, pts, true); g.fill();
  }
  // 沿坡度最小方向從高到低走出步道
  let ci = n*.22, cj = n*.24, trail = [[ci,cj]];
  for(let k = 0; k < 60; k++){ let best = null, bd = 1e9; for(const [dx,dy] of [[1,0],[0,1],[1,1],[.6,1],[1,.6]]){ const ni = ci+dx*.5, nj = cj+dy*.5; if(ni >= n-1 || nj >= n-1) continue;
      const slope = Math.abs(hgt(ni,nj) - hgt(ci,cj)); if(slope < bd){ bd = slope; best = [ni,nj]; } } if(!best) break; ci = best[0]; cj = best[1]; trail.push([ci,cj]); if(ci > n-2 && cj > n-2) break; }
  const path = trail.map(([i,j]) => proj(i,j,hgt(i,j)+.15));
  g.strokeStyle = "#fff"; g.lineWidth = 2.4; g.lineCap = "round"; g.lineJoin = "round"; smooth(g, path); g.stroke();
  const sP = proj(trail[0][0],trail[0][1],hgt(trail[0][0],trail[0][1])+.4), eP = proj(...trail[trail.length-1],hgt(...trail[trail.length-1])+.4);
  dot(g, sP[0], sP[1], 4.5, "#fff"); dot(g, eP[0], eP[1], 4.5, c);
},
// V03 影像當成本地圖：灰階成本場，路徑穿過亮處避開暗處
function(g, W, H, r, c){
  const n = 90, m = Math.round(n*H/W), nf = U.vnoise((r()*1e6)|0), off = document.createElement("canvas"); off.width = n; off.height = m;
  const og = off.getContext("2d"), im = og.createImageData(n,m);
  const grey = (i,j) => Math.max(0, Math.min(1, nf(i*.09,j*.09)*.8 + nf(i*.22+40,j*.22+40)*.35));
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const v = Math.round(grey(i,j)*210 + 18), k = (j*n+i)*4; im.data[k]=v; im.data[k+1]=v; im.data[k+2]=v+4; im.data[k+3]=255; }
  og.putImageData(im,0,0); g.imageSmoothingEnabled = true; g.drawImage(off,0,0,W,H); g.imageSmoothingEnabled = true;
  const S = 1, T = n-2, wall = new Uint8Array(n*m); for(let i=0;i<n*m;i++) if(grey(i%n,(i/n)|0) < .12) wall[i]=1;
  const sIdx = ((m/2)|0)*n+1, tIdx = ((m/2)|0)*n+n-2; wall[sIdx]=wall[tIdx]=0;
  const {prev} = gridDijkstra(n, m, (x,y) => wall[y*n+x] ? -1 : 1 + grey(x,y)*3, [sIdx], true);
  const s = W/n, path = pathTo(prev, tIdx).map(u => [(u%n+.5)*s, (((u/n)|0)+.5)*s]);
  g.strokeStyle = c; g.lineWidth = s*.9; g.lineCap = "round"; g.lineJoin = "round"; g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 4; smooth(g, path); g.stroke(); g.shadowBlur = 0;
  dot(g, path[0][0], path[0][1], s*.9, "#fff"); dot(g, path[path.length-1][0], path[path.length-1][1], s*.9, c);
},
// V04 多起點距離場：多個出口同時擴散，等距線像同心漣漪
function(g, W, H, r, c){
  const n = 60, m = Math.round(n*H/W), s = W/n, wall = mkWalls(n, m, r, .18);
  const srcXY = [[2,2],[n-3,2],[2,m-3],[n-3,m-3]].filter(() => r() < 1).slice(0, 3 + (r()*2|0));
  const sources = srcXY.map(([x,y]) => { wall[y*n+x] = 0; return y*n+x; });
  const {dist} = gridDijkstra(n, m, (x,y) => wall[y*n+x] ? -1 : 1, sources, true);
  let mx = 0; dist.forEach(d => { if(d < Infinity) mx = Math.max(mx,d); });
  U.field(g, W, H, n, m, (i,j) => wall[j*n+i] ? 0 : 1 - dist[j*n+i]/mx, c, .85);
  for(let i = 0; i < n*m; i++) if(wall[i]){ const x = (i%n)*s, y = ((i/n)|0)*s; g.fillStyle = "#2B2B34"; g.fillRect(x+1,y+1,s-2,s-2); }
  const S = W/n; g.strokeStyle = rgba("#ffffff", .5); g.lineWidth = 1;
  for(let k = 1; k < 6; k++){ g.beginPath(); U.contour(n, m, (i,j) => wall[j*n+i] ? -1 : 1 - dist[j*n+i]/mx, k/6).forEach(([a,b]) => { g.moveTo(a[0]*S,a[1]*S); g.lineTo(b[0]*S,b[1]*S); }); g.stroke(); }
  sources.forEach(sIdx => dot(g, (sIdx%n+.5)*s, (((sIdx/n)|0)+.5)*s, s*.6, "#fff"));
},
// V05 在曲線網路上走（真正的圖）：街道節點與彎曲邊，高亮一條最短路
function(g, W, H, r, c){
  g.fillStyle = "#15151B"; g.fillRect(0,0,W,H);
  const {P, adj} = buildGraph(r, 22, W*.08, H*.1, W*.84, H*.8, 3);
  g.strokeStyle = rgba("#8E8EA0", .35); g.lineWidth = 1.1;
  const seen = new Set();
  adj.forEach((es,i) => es.forEach(([j]) => { const k = i<j?`${i}-${j}`:`${j}-${i}`; if(seen.has(k)) return; seen.add(k);
    const a = P[i], b = P[j], mx = (a[0]+b[0])/2 + (r()-.5)*18, my = (a[1]+b[1])/2 + (r()-.5)*18;
    g.beginPath(); g.moveTo(a[0],a[1]); g.quadraticCurveTo(mx,my,b[0],b[1]); g.stroke(); }));
  P.forEach(p => dot(g, p[0], p[1], 2.4, rgba("#B7B7C6", .8)));
  const S = 0, T = P.length-1, {dist, prev} = graphDijkstra(adj, S); let u = T, chain = [T];
  while(prev[u] >= 0){ u = prev[u]; chain.push(u); }
  chain.reverse();
  g.strokeStyle = "#fff"; g.lineWidth = 3; g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath(); chain.forEach((idx,k) => { const p = P[idx]; k ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); }); g.stroke();
  dot(g, P[S][0], P[S][1], 5, "#fff"); dot(g, P[T][0], P[T][1], 5, c);
},
// V06 3D 體素路徑：樓板梁柱之間，管路以體素格繞行
function(g, W, H, r, c){
  g.fillStyle = "#101015"; g.fillRect(0,0,W,H);
  const n = 7, proj = isoP(W*.5, H*.3, Math.min(W,H)*.075, .78, .5);
  g.strokeStyle = rgba("#2A2A34", .8); g.lineWidth = 1; for(let k = 0; k <= n; k++){ const a = proj(0,k,0), b = proj(n,k,0), cc = proj(k,0,0), d = proj(k,n,0);
    g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); g.beginPath(); g.moveTo(cc[0],cc[1]); g.lineTo(d[0],d[1]); g.stroke(); }
  const occ = new Uint8Array(n*n*n); for(let i = 0; i < n*n*n; i++) occ[i] = r() < .16 ? 1 : 0;
  const S = 0, T = n*n*n-1; occ[S] = occ[T] = 0;
  const idx = (x,y,z) => (z*n+y)*n+x;
  const cost = (x,y,z) => occ[idx(x,y,z)] ? -1 : 1;
  // 3D BFS（簡化：6 方向等權重）
  const dist = new Float32Array(n*n*n).fill(Infinity), prev = new Int32Array(n*n*n).fill(-1); dist[S] = 0; const Q = [S];
  const dirs = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  while(Q.length){ let bi = 0; for(let k = 1; k < Q.length; k++) if(dist[Q[k]] < dist[Q[bi]]) bi = k; const u = Q.splice(bi,1)[0];
    const x = u%n, y = ((u/n)|0)%n, z = (u/(n*n))|0;
    for(const [dx,dy,dz] of dirs){ const nx=x+dx,ny=y+dy,nz=z+dz; if(nx<0||ny<0||nz<0||nx>=n||ny>=n||nz>=n) continue; const q = idx(nx,ny,nz); if(cost(nx,ny,nz) < 0) continue;
      if(dist[u]+1 < dist[q]){ dist[q] = dist[u]+1; prev[q] = u; Q.push(q); } } }
  for(let z = 0; z < n; z++) for(let y = 0; y < n; y++) for(let x = 0; x < n; x++) if(occ[idx(x,y,z)])
    box(g, proj, x, y, z, .82, .82, .82, k => mixHex("#2C2C36", "#0C0C10", 1-k), "#000");
  const path = pathTo(prev, T).map(u => { const x = u%n, y = ((u/n)|0)%n, z = (u/(n*n))|0; return proj(x+.5,y+.5,z+.5); });
  g.strokeStyle = c; g.lineWidth = 4; g.lineCap = "round"; g.lineJoin = "round"; g.shadowColor = rgba(c,.6); g.shadowBlur = 6; smooth(g, path); g.stroke(); g.shadowBlur = 0;
  const sp = path[0], ep = path[path.length-1]; dot(g, sp[0], sp[1], 5, "#fff"); dot(g, ep[0], ep[1], 5, c);
},
// V07 多組起終點＋流量疊加：多條最短路重疊處變粗變亮，像人流熱點
function(g, W, H, r, c){
  const n = 42, m = Math.round(n*H/W), s = W/n, wall = mkWalls(n, m, r, .22);
  g.fillStyle = "#17171F"; g.fillRect(0,0,W,H);
  const use = new Float32Array(n*m), pairs = 5;
  for(let p = 0; p < pairs; p++){ let S,T; do { S = ((r()*m)|0)*n + ((r()*n*.2)|0)+1; } while(wall[S]); do { T = ((r()*m)|0)*n + n-2-((r()*n*.2)|0); } while(wall[T]);
    const {prev} = gridDijkstra(n, m, (x,y) => wall[y*n+x] ? -1 : 1, [S], true); for(const i of pathTo(prev, T)) use[i]++;
  }
  for(let i = 0; i < n*m; i++){ const x = (i%n)*s, y = ((i/n)|0)*s; if(wall[i]){ g.fillStyle = "#2E2E38"; g.fillRect(x+1,y+1,s-2,s-2); }
    else if(use[i] > 0){ g.fillStyle = rgba(c, .1 + Math.min(1,use[i]/pairs)*.55); g.fillRect(x,y,s,s); } }
  g.strokeStyle = rgba("#ffffff", .8); g.lineWidth = 1;
  for(let i = 0; i < n*m; i++) if(use[i] >= pairs*.6){ const x=(i%n)*s, y=((i/n)|0)*s; g.strokeRect(x+s*.15,y+s*.15,s*.7,s*.7); }
},
// V08 路徑轉成可製造幾何：折線變平滑管件，雙線＋環肋的施工圖感
function(g, W, H, r, c){
  const n = 30, m = Math.round(n*H/W), s = W/n, wall = mkWalls(n, m, r, .3);
  g.fillStyle = "#15151B"; g.fillRect(0,0,W,H);
  g.strokeStyle = rgba("#4A4A56", .35); g.lineWidth = .6; for(let i=0;i<=n;i++){ g.beginPath(); g.moveTo(i*s,0); g.lineTo(i*s,H); g.stroke(); } for(let j=0;j<=m;j++){ g.beginPath(); g.moveTo(0,j*s); g.lineTo(W,j*s); g.stroke(); }
  const S = ((m/2)|0)*n+1, T = ((m/2)|0)*n+n-2; wall[S]=wall[T]=0;
  const {prev} = gridDijkstra(n, m, (x,y) => wall[y*n+x] ? -1 : 1, [S], true);
  const raw = pathTo(prev, T).map(u => [(u%n+.5)*s, (((u/n)|0)+.5)*s]).reverse();
  const pipeR = s*.62;
  // 雙線外框（法線位移）
  const off1 = [], off2 = [];
  for(let i = 0; i < raw.length; i++){ const p = raw[i], q = raw[Math.min(raw.length-1,i+1)], dx=q[0]-p[0], dy=q[1]-p[1], l=Math.hypot(dx,dy)||1, nx=-dy/l, ny=dx/l;
    off1.push([p[0]+nx*pipeR, p[1]+ny*pipeR]); off2.push([p[0]-nx*pipeR, p[1]-ny*pipeR]); }
  g.fillStyle = rgba(c, .18); g.beginPath(); smooth(g, off1); off2.slice().reverse().forEach(p => g.lineTo(p[0],p[1])); g.closePath(); g.fill();
  g.strokeStyle = c; g.lineWidth = 1.6; g.beginPath(); smooth(g, off1); g.stroke(); g.beginPath(); smooth(g, off2); g.stroke();
  g.strokeStyle = rgba("#ffffff", .5); g.lineWidth = 1;
  for(let i = 2; i < raw.length-2; i += 4){ const p = raw[i], q = raw[i+1]||raw[i], dx=q[0]-p[0], dy=q[1]-p[1], l=Math.hypot(dx,dy)||1, nx=-dy/l, ny=dx/l;
    g.beginPath(); g.moveTo(p[0]+nx*pipeR,p[1]+ny*pipeR); g.lineTo(p[0]-nx*pipeR,p[1]-ny*pipeR); g.stroke(); }
  dot(g, raw[0][0], raw[0][1], pipeR*.5, "#fff"); dot(g, raw[raw.length-1][0], raw[raw.length-1][1], pipeR*.5, c);
},
// V09 動畫化擴散波前：多個時間片的等距線疊加，像頻閃拍到的擴散過程
function(g, W, H, r, c){
  const n = 56, m = Math.round(n*H/W), s = W/n, wall = mkWalls(n, m, r, .22);
  const S = ((m/2)|0)*n + (n*.5|0); wall[S] = 0;
  const {dist} = gridDijkstra(n, m, (x,y) => wall[y*n+x] ? -1 : 1, [S], true);
  g.fillStyle = "#121218"; g.fillRect(0,0,W,H);
  for(let i = 0; i < n*m; i++) if(wall[i]){ const x=(i%n)*s, y=((i/n)|0)*s; g.fillStyle = "#2A2A33"; g.fillRect(x+1,y+1,s-2,s-2); }
  let mx = 0; dist.forEach(d => { if(d < Infinity) mx = Math.max(mx,d); });
  const S2 = W/n, frames = 7;
  for(let k = 1; k <= frames; k++){ const iso = k/frames, a = .18 + (k/frames)*.7;
    g.fillStyle = rgba(c, a*.12);
    U.contour(n, m, (i,j) => wall[j*n+i] ? -1 : 1 - dist[j*n+i]/mx, iso).forEach(() => {});
    g.strokeStyle = rgba(k === frames ? "#ffffff" : c, a); g.lineWidth = k === frames ? 2.2 : 1.2;
    g.beginPath(); U.contour(n, m, (i,j) => wall[j*n+i] ? -1 : 1 - dist[j*n+i]/mx, iso).forEach(([a2,b2]) => { g.moveTo(a2[0]*S2,a2[1]*S2); g.lineTo(b2[0]*S2,b2[1]*S2); }); g.stroke();
  }
  dot(g, (S%n+.5)*s, (((S/n)|0)+.5)*s, s*.55, "#fff");
},
// V10 混合 GA：最佳化出入口位置——多個候選出口，最佳一個發亮，殘影是演化過程
function(g, W, H, r, c){
  g.fillStyle = "#15151B"; g.fillRect(0,0,W,H);
  const rx = W*.14, ry = H*.14, rw = W*.72, rh = H*.72, cols = 5, rows = 4;
  g.strokeStyle = rgba("#6A6A78", .55); g.lineWidth = 1.2;
  for(let i = 0; i <= cols; i++){ g.beginPath(); g.moveTo(rx+i*rw/cols, ry); g.lineTo(rx+i*rw/cols, ry+rh); g.stroke(); }
  for(let j = 0; j <= rows; j++){ g.beginPath(); g.moveTo(rx, ry+j*rh/rows); g.lineTo(rx+rw, ry+j*rh/rows); g.stroke(); }
  const rooms = []; for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++) rooms.push([rx+(i+.5)*rw/cols, ry+(j+.5)*rh/rows]);
  const cands = [...Array(6)].map(() => { const side = (r()*4)|0; return side===0?[rx+r()*rw,ry]:side===1?[rx+r()*rw,ry+rh]:side===2?[rx,ry+r()*rh]:[rx+rw,ry+r()*rh]; });
  const score = p => Math.max(...rooms.map(q => Math.hypot(p[0]-q[0],p[1]-q[1])));
  let best = 0; cands.forEach((p,i) => { if(score(p) < score(cands[best])) best = i; });
  cands.forEach((p,i) => { if(i === best) return; g.strokeStyle = rgba("#8A8A98", .3); g.lineWidth = .8;
    rooms.forEach(q => { g.beginPath(); g.moveTo(q[0],q[1]); g.lineTo(p[0],p[1]); g.stroke(); }); dot(g, p[0], p[1], 3.5, rgba("#8A8A98", .6)); });
  const bp = cands[best]; g.strokeStyle = rgba(WARM, .55); g.lineWidth = 1.4;
  rooms.forEach(q => { g.beginPath(); g.moveTo(q[0],q[1]); g.lineTo(bp[0],bp[1]); g.stroke(); });
  glow(g, bp[0], bp[1], 24, WARM, .8); dot(g, bp[0], bp[1], 6, WARM);
  rooms.forEach(q => dot(g, q[0], q[1], 2.4, rgba(c,.7)));
},
// V11 Fast Marching：平滑圓弧等距線，路徑可任意角度切過格線
function(g, W, H, r, c){
  const n = 46, m = Math.round(n*H/W), s = W/n, wall = mkWalls(n, m, r, .16);
  const S = ((m/2)|0)*n + 2; wall[S] = 0;
  // 16 方向近似歐氏距離，等距線更接近圓弧
  const nb16 = []; for(let k = 0; k < 16; k++){ const a = k/16*TAU; nb16.push([Math.round(Math.cos(a)*2)/2, Math.round(Math.sin(a)*2)/2]); }
  const N = n*m, dist = new Float32Array(N).fill(Infinity), vis = new Uint8Array(N); dist[S] = 0; const Q = [S];
  while(Q.length){ let bi=0; for(let k=1;k<Q.length;k++) if(dist[Q[k]]<dist[Q[bi]]) bi=k; const u=Q.splice(bi,1)[0]; if(vis[u]) continue; vis[u]=1;
    const x=u%n, y=(u/n)|0;
    for(const [dx,dy] of nb16){ if(!dx && !dy) continue; const nx=Math.round(x+dx), ny=Math.round(y+dy); if(nx<0||ny<0||nx>=n||ny>=m) continue; const q=ny*n+nx; if(wall[q]) continue;
      const w = Math.hypot(dx,dy), nd = dist[u]+w; if(nd < dist[q]){ dist[q]=nd; Q.push(q); } } }
  g.fillStyle = "#121218"; g.fillRect(0,0,W,H);
  for(let i = 0; i < n*m; i++) if(wall[i]){ const x=(i%n)*s, y=((i/n)|0)*s; g.fillStyle = "#2A2A33"; g.fillRect(x+1,y+1,s-2,s-2); }
  let mx = 0; dist.forEach(d => { if(d<Infinity) mx = Math.max(mx,d); });
  const S2 = W/n;
  for(let k = 1; k <= 9; k++){ g.strokeStyle = rgba(c, .16 + k*.06); g.lineWidth = 1.1; g.beginPath();
    U.contour(n, m, (i,j) => wall[j*n+i] ? -1 : 1 - dist[j*n+i]/mx, k/9).forEach(([a,b]) => { g.moveTo(a[0]*S2,a[1]*S2); g.lineTo(b[0]*S2,b[1]*S2); }); g.stroke(); }
  // 沿距離場梯度、以連續步伐從終點走回起點（平滑曲線）
  let px = (n-3)*s, py = ((m/2)|0+.5)*s;
  const sample = (x,y) => { const i = Math.max(0,Math.min(n-1,Math.round(x/s))), j = Math.max(0,Math.min(m-1,Math.round(y/s))); return wall[j*n+i] ? mx*2 : dist[j*n+i]; };
  const path = [[px,py]];
  for(let step = 0; step < 140; step++){ const d0 = sample(px,py), gx = sample(px+s*.5,py)-sample(px-s*.5,py), gy = sample(px,py+s*.5)-sample(px,py-s*.5), l = Math.hypot(gx,gy)||1;
    px -= gx/l*s*.4; py -= gy/l*s*.4; path.push([px,py]); if(d0 < .6) break; }
  g.strokeStyle = "#fff"; g.lineWidth = 2.6; g.lineCap = "round"; g.lineJoin = "round"; smooth(g, path); g.stroke();
  dot(g, (S%n+.5)*s, (((S/n)|0)+.5)*s, s*.5, "#fff"); dot(g, path[0][0], path[0][1], s*.5, c);
},
// V12 網路中心性：closeness／整合度——依到其他所有節點的平均距離替每條邊上色
function(g, W, H, r, c){
  g.fillStyle = "#121218"; g.fillRect(0,0,W,H);
  const {P, adj} = buildGraph(r, 26, W*.08, H*.08, W*.84, H*.84, 3);
  const close = P.map((_,i) => { const {dist} = graphDijkstra(adj, i); let s = 0, n2 = 0; dist.forEach(d => { if(d < Infinity){ s += d; n2++; } }); return n2 > 1 ? (n2-1)/s : 0; });
  let mn = Math.min(...close), mx = Math.max(...close);
  const seen = new Set();
  adj.forEach((es,i) => es.forEach(([j]) => { const k = i<j?`${i}-${j}`:`${j}-${i}`; if(seen.has(k)) return; seen.add(k);
    const t = ((close[i]+close[j])/2 - mn) / ((mx-mn)||1), col = mixHex("#3A5CC9", WARM, t);
    g.strokeStyle = col; g.lineWidth = .8 + t*2.6; g.globalAlpha = .35 + t*.55;
    g.beginPath(); g.moveTo(P[i][0],P[i][1]); g.lineTo(P[j][0],P[j][1]); g.stroke(); }));
  g.globalAlpha = 1;
  P.forEach((p,i) => { const t = (close[i]-mn)/((mx-mn)||1); dot(g, p[0], p[1], 2 + t*3.4, mixHex("#3A5CC9", WARM, t)); });
},
];

/* ================= 沒有照片的案例 ================= */
// F05-01 SpiderWeb：平面上以房間節點＋門連通邊建圖，標出兩房間間最短路
ART.case["F05-01"] = function(g, W, H, r, c){
  g.fillStyle = "#15151B"; g.fillRect(0,0,W,H);
  const rx = W*.1, ry = H*.12, cols = 4, rows = 3, cw = W*.8/cols, ch = H*.72/rows;
  const rooms = []; for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){ const x=rx+i*cw, y=ry+j*ch, pad=4; rooms.push({x,y,cx:x+cw/2,cy:y+ch/2});
    g.strokeStyle = rgba("#8E8EA0", .5); g.lineWidth = 1.1; g.strokeRect(x+pad,y+pad,cw-pad*2,ch-pad*2); }
  const adj = rooms.map(() => []);
  for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){ const a=j*cols+i; if(i<cols-1 && r()<.85){ const b=a+1; adj[a].push([b,cw]); adj[b].push([a,cw]); }
    if(j<rows-1 && r()<.85){ const b=a+cols; adj[a].push([b,ch]); adj[b].push([a,ch]); } }
  g.strokeStyle = rgba(c, .4); g.lineWidth = 1;
  adj.forEach((es,i) => es.forEach(([j2]) => { if(j2>i) return; g.beginPath(); g.moveTo(rooms[i].cx,rooms[i].cy); g.lineTo(rooms[j2].cx,rooms[j2].cy); g.stroke(); }));
  const S = 0, T = rooms.length-1, {prev} = graphDijkstra(adj, S); let u=T, chain=[T]; while(prev[u]>=0){ u=prev[u]; chain.push(u); }
  g.strokeStyle = "#fff"; g.lineWidth = 3; g.lineCap="round"; g.beginPath(); chain.reverse().forEach((idx,k) => { const p=rooms[idx]; k?g.lineTo(p.cx,p.cy):g.moveTo(p.cx,p.cy); }); g.stroke();
  rooms.forEach(p => dot(g, p.cx, p.cy, 2.6, rgba("#C9C9D6", .8)));
  dot(g, rooms[S].cx, rooms[S].cy, 5, "#fff"); dot(g, rooms[T].cx, rooms[T].cy, 5, c);
  const px = W*.82, py = H*.86; g.fillStyle = "#1F1F28"; g.strokeStyle = rgba(c,.6); g.lineWidth=1; g.beginPath(); g.roundRect ? g.roundRect(px,py,W*.14,H*.08,4) : g.rect(px,py,W*.14,H*.08); g.fill(); g.stroke();
  dot(g, px+W*.03, py+H*.04, 2.6, "#fff"); dot(g, px+W*.11, py+H*.04, 2.6, c);
};
ART.case["F05-01"].ratio = .95;
// F05-02 ShortestWalk：彎曲曲線網路，起終點是線段
ART.case["F05-02"] = function(g, W, H, r, c){
  g.fillStyle = "#15151B"; g.fillRect(0,0,W,H);
  const {P, adj} = buildGraph(r, 18, W*.1, H*.15, W*.8, H*.7, 3);
  const seen = new Set();
  adj.forEach((es,i) => es.forEach(([j]) => { const k=i<j?`${i}-${j}`:`${j}-${i}`; if(seen.has(k)) return; seen.add(k);
    const a=P[i], b=P[j], mx=(a[0]+b[0])/2+(r()-.5)*26, my=(a[1]+b[1])/2+(r()-.5)*26;
    g.strokeStyle = rgba("#8E8EA0", .3); g.lineWidth = 1; g.beginPath(); g.moveTo(a[0],a[1]); g.quadraticCurveTo(mx,my,b[0],b[1]); g.stroke(); }));
  const S=0, T=P.length-1, {prev} = graphDijkstra(adj, S); let u=T, chain=[T]; while(prev[u]>=0){ u=prev[u]; chain.push(u); } chain.reverse();
  g.strokeStyle = c; g.lineWidth = 3; g.lineCap="round"; g.lineJoin="round"; smooth(g, chain.map(i=>P[i])); g.stroke();
  [S,T].forEach((idx,k) => { const p=P[idx], nb=adj[idx][0]?P[adj[idx][0][0]]:[p[0]+10,p[1]]; const dx=nb[0]-p[0], dy=nb[1]-p[1], l=Math.hypot(dx,dy)||1, nx=-dy/l*14, ny=dx/l*14;
    g.strokeStyle = k?c:"#fff"; g.lineWidth = 4; g.beginPath(); g.moveTo(p[0]+nx,p[1]+ny); g.lineTo(p[0]-nx,p[1]-ny); g.stroke(); });
};
// F05-03 LunchBox 地形步道：等高線地圖上以之字路徑選線
ART.case["F05-03"] = function(g, W, H, r, c){
  g.fillStyle = "#15151B"; g.fillRect(0,0,W,H);
  const n=90, m=Math.round(n*H/W), nf = U.vnoise((r()*1e6)|0), f = (i,j) => nf(i*.06,j*.06)*.7 + nf(i*.15+30,j*.15+30)*.35;
  U.field(g, W, H, n, m, (i,j) => f(i,j), c, 1.1);
  const S2 = W/n; for(let k=1;k<9;k++){ g.strokeStyle = rgba("#1A1A20", .55); g.lineWidth = 1; g.beginPath();
    U.contour(n,m,f,k/9).forEach(([a,b]) => { g.moveTo(a[0]*S2,a[1]*S2); g.lineTo(b[0]*S2,b[1]*S2); }); g.stroke(); }
  let ci=8, cj=m-8, trail=[[ci,cj]];
  for(let k=0;k<70;k++){ let best=null, bd=1e9; for(const [dx,dy] of [[1,0],[1,-.4],[1,-1],[.4,-1],[0,-1]]){ const ni=ci+dx*1.4, nj=cj+dy*1.4; if(ni>=n-2||nj<2) continue;
    const slope = Math.abs(f(ni,nj)-f(ci,cj)); if(slope<bd){ bd=slope; best=[ni,nj]; } } if(!best) break; ci=best[0]; cj=best[1]; trail.push([ci,cj]); if(ci>n-10 && cj<10) break; }
  const path = trail.map(([i,j]) => [i*S2, j*S2]);
  g.strokeStyle = "#fff"; g.lineWidth = 2.4; g.lineCap="round"; g.lineJoin="round"; smooth(g, path); g.stroke();
  dot(g, path[0][0], path[0][1], 4.5, "#fff"); dot(g, path[path.length-1][0], path[path.length-1][1], 4.5, c);
};
ART.case["F05-03"].ratio = 1.2;
// F05-04 Urban Network Analysis：街廓路網，依可及性指標為街道上色
ART.case["F05-04"] = function(g, W, H, r, c){
  g.fillStyle = "#15151B"; g.fillRect(0,0,W,H);
  const cols=6, rows=5, x0=W*.06, y0=H*.08, cw=W*.88/cols, ch=H*.84/rows, nodes=[];
  for(let j=0;j<=rows;j++) for(let i=0;i<=cols;i++) nodes.push([x0+i*cw+(r()-.5)*cw*.15, y0+j*ch+(r()-.5)*ch*.15]);
  const idx=(i,j)=>j*(cols+1)+i, adj = nodes.map(()=>[]);
  for(let j=0;j<=rows;j++) for(let i=0;i<=cols;i++){ if(i<cols){ const a=idx(i,j),b=idx(i+1,j),d=Math.hypot(...nodes[a].map((v,k)=>nodes[b][k]-v)); adj[a].push([b,d]); adj[b].push([a,d]); }
    if(j<rows){ const a=idx(i,j),b=idx(i,j+1),d=Math.hypot(...nodes[a].map((v,k)=>nodes[b][k]-v)); adj[a].push([b,d]); adj[b].push([a,d]); } }
  const cx = idx((cols/2)|0,(rows/2)|0), {dist} = graphDijkstra(adj, cx); let mx=0; dist.forEach(d=>{ if(d<Infinity) mx=Math.max(mx,d); });
  g.fillStyle = "#1C1C24"; for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){ const p=nodes[idx(i,j)]; g.fillRect(p[0]+cw*.18,p[1]+ch*.18,cw*.64,ch*.64); }
  const seen=new Set();
  adj.forEach((es,i)=>es.forEach(([j2])=>{ const k=i<j2?`${i}-${j2}`:`${j2}-${i}`; if(seen.has(k)) return; seen.add(k);
    const t = 1-Math.min(dist[i],dist[j2])/mx; g.strokeStyle = mixHex("#3A5CC9", c, t); g.lineWidth = .8+t*3.2; g.globalAlpha=.4+t*.6;
    g.beginPath(); g.moveTo(nodes[i][0],nodes[i][1]); g.lineTo(nodes[j2][0],nodes[j2][1]); g.stroke(); }));
  g.globalAlpha=1; dot(g, nodes[cx][0], nodes[cx][1], 4, "#fff");
};
// F05-05 Urbano：街道網路＋公車站步行可及圈
ART.case["F05-05"] = function(g, W, H, r, c){
  g.fillStyle = "#15151B"; g.fillRect(0,0,W,H);
  const {P, adj} = buildGraph(r, 30, W*.06, H*.06, W*.88, H*.88, 3);
  g.strokeStyle = rgba("#6A6A78", .4); g.lineWidth = 1; const seen=new Set();
  adj.forEach((es,i)=>es.forEach(([j])=>{ const k=i<j?`${i}-${j}`:`${j}-${i}`; if(seen.has(k)) return; seen.add(k); g.beginPath(); g.moveTo(P[i][0],P[i][1]); g.lineTo(P[j][0],P[j][1]); g.stroke(); }));
  const stops = [0, 6, 13, 21].filter(i => i < P.length);
  stops.forEach(i => { glow(g, P[i][0], P[i][1], 46, ACC, .3); g.strokeStyle = rgba(ACC,.55); g.lineWidth=1.2; g.beginPath(); g.arc(P[i][0],P[i][1],46,0,TAU); g.stroke(); dot(g, P[i][0], P[i][1], 4.5, ACC); });
  P.forEach((p,i) => { if(!stops.includes(i)) dot(g, p[0], p[1], 1.8, rgba("#8E8EA0",.7)); });
  g.fillStyle = rgba(c, .5); for(let k=0;k<10;k++){ const x = W*.1+r()*W*.8, y = H*.1+r()*H*.8; g.fillRect(x,y,W*.02,H*.02); }
};
// F05-06 depthmapX：不規則房間內細密可視性網格，依整合度上色（紅核心藍邊緣）
ART.case["F05-06"] = function(g, W, H, r, c){
  g.fillStyle = "#15151B"; g.fillRect(0,0,W,H);
  const poly = [[W*.18,H*.15],[W*.82,H*.1],[W*.88,H*.55],[W*.62,H*.9],[W*.14,H*.82]];
  g.strokeStyle = rgba("#9A9AA8", .7); g.lineWidth = 1.4; U.poly(g, poly, true); g.stroke();
  const n=26, m=Math.round(n*H/W), s=Math.min(W/n,H/m), pip=(x,y)=>{ let ins=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const [xi,yi]=poly[i], [xj,yj]=poly[j]; if((yi>y)!==(yj>y) && x < (xj-xi)*(y-yi)/(yj-yi)+xi) ins=!ins; } return ins; };
  const cx = poly.reduce((s,p)=>s+p[0],0)/poly.length, cy = poly.reduce((s,p)=>s+p[1],0)/poly.length, R = Math.max(W,H)*.5;
  for(let j=0;j<m;j++) for(let i=0;i<n;i++){ const x=i*s+s/2, y=j*s+s/2; if(!pip(x,y)) continue; const d = Math.hypot(x-cx,y-cy)/R, t = 1-Math.min(1,d*1.6);
    g.fillStyle = mixHex("#3A5CC9", "#E05C4B", t); g.globalAlpha=.55+t*.35; g.fillRect(x-s*.42,y-s*.42,s*.84,s*.84); }
  g.globalAlpha=1;
};
ART.case["F05-06"].ratio = 1.15;
// F05-07 cityseer：局部尺度的細密街道網（比 F05-04 更密、更小範圍）
ART.case["F05-07"] = function(g, W, H, r, c){
  g.fillStyle = "#121218"; g.fillRect(0,0,W,H);
  const {P, adj} = buildGraph(r, 46, W*.05, H*.05, W*.9, H*.9, 4);
  const cx = (P.length/2)|0, {dist} = graphDijkstra(adj, cx); let mx=0; dist.forEach(d=>{ if(d<Infinity) mx=Math.max(mx,d); });
  const seen=new Set();
  adj.forEach((es,i)=>es.forEach(([j])=>{ const k=i<j?`${i}-${j}`:`${j}-${i}`; if(seen.has(k)) return; seen.add(k);
    const t = 1-Math.min(dist[i],dist[j])/mx; g.strokeStyle = mixHex("#22323E", ACC, t); g.lineWidth = .6+t*1.6; g.globalAlpha=.35+t*.65;
    g.beginPath(); g.moveTo(P[i][0],P[i][1]); g.lineTo(P[j][0],P[j][1]); g.stroke(); }));
  g.globalAlpha=1; P.forEach((p,i) => dot(g, p[0], p[1], 1.3, rgba(ACC,.6)));
  dot(g, P[cx][0], P[cx][1], 3.6, "#fff");
};
// F05-08 GH 圖＋重力模型：節點大小＝可及性分數（重力模型），稀疏圖
ART.case["F05-08"] = function(g, W, H, r, c){
  g.fillStyle = "#15151B"; g.fillRect(0,0,W,H);
  const {P, adj} = buildGraph(r, 16, W*.12, H*.12, W*.76, H*.76, 2);
  const score = P.map((p,i) => adj[i].reduce((s,[j,d]) => s + 1/(1+d*d*3e-4), 0));
  const mx = Math.max(...score);
  g.strokeStyle = rgba("#6A6A78", .4); g.lineWidth = 1; const seen=new Set();
  adj.forEach((es,i)=>es.forEach(([j])=>{ const k=i<j?`${i}-${j}`:`${j}-${i}`; if(seen.has(k)) return; seen.add(k); g.beginPath(); g.moveTo(P[i][0],P[i][1]); g.lineTo(P[j][0],P[j][1]); g.stroke(); }));
  P.forEach((p,i) => { const t = score[i]/mx, R = 4 + t*22; glow(g, p[0], p[1], R*1.6, c, .25+t*.3); g.fillStyle = rgba(c, .35+t*.55); g.beginPath(); g.arc(p[0],p[1],R,0,TAU); g.fill();
    g.strokeStyle = rgba("#fff",.5); g.lineWidth=1; g.stroke(); });
};
// F05-09 Pathfinder 人流避難：多個小點沿走廊流向兩個出口
ART.case["F05-09"] = function(g, W, H, r, c){
  g.fillStyle = "#15151B"; g.fillRect(0,0,W,H);
  const bx=W*.08, by=H*.1, bw=W*.84, bh=H*.8; g.strokeStyle = rgba("#8E8EA0",.6); g.lineWidth=1.4; g.strokeRect(bx,by,bw,bh);
  const exits = [[bx,by+bh*.5],[bx+bw,by+bh*.3]];
  exits.forEach(e => { glow(g, e[0], e[1], 40, "#E05C4B", .45); dot(g, e[0], e[1], 6, "#E05C4B"); });
  for(let k=0;k<70;k++){ const px = bx+bw*.15+r()*bw*.7, py = by+bh*.15+r()*bh*.7; const e = exits[r()<.5?0:1];
    const dx=e[0]-px, dy=e[1]-py, l=Math.hypot(dx,dy)||1, ang=Math.atan2(dy,dx)+(r()-.5)*.5;
    g.strokeStyle = rgba(c, .3); g.lineWidth=1; g.beginPath(); g.moveTo(px,py); g.lineTo(px+Math.cos(ang)*14,py+Math.sin(ang)*14); g.stroke();
    dot(g, px, py, 2, rgba(c,.85)); }
  g.strokeStyle = rgba("#4A4A56", .5); g.lineWidth=1; [.33,.66].forEach(t => { g.beginPath(); g.moveTo(bx+bw*t,by); g.lineTo(bx+bw*t,by+bh); g.stroke(); });
};
// F05-10 MEP 管線 A*：天花夾層梁之間繞行的管路
ART.case["F05-10"] = function(g, W, H, r, c){
  g.fillStyle = "#121218"; g.fillRect(0,0,W,H);
  g.strokeStyle = rgba("#26262F", .6); g.lineWidth = 1; for(let x = 0; x < W; x += 14){ g.beginPath(); g.moveTo(x,0); g.lineTo(x+H*.35,H); g.stroke(); }
  const proj = isoP(W*.5, H*.3, Math.min(W,H)*.11, .9, .42), beams = [];
  for(let i=0;i<5;i++) beams.push([i*1.4-2.8, -.4, 0]);
  beams.forEach(([x,y,z]) => box(g, proj, x, y, z, .3, 4.2, .5, k => mixHex("#2E2E38","#0C0C10",1-k), "#000"));
  const wp = beams.map(([x]) => x+.15);
  const path = []; let side = 0;
  for(let i=0;i<wp.length-1;i++){ path.push(proj(wp[i], side? 3.4:-.2, .95)); side = 1-side; path.push(proj(wp[i]+.6, side? 3.4:-.2, .95)); }
  g.strokeStyle = c; g.lineWidth = 5; g.lineCap="round"; g.lineJoin="round"; g.shadowColor=rgba(c,.6); g.shadowBlur=8; smooth(g, path); g.stroke(); g.shadowBlur=0;
  dot(g, path[0][0], path[0][1], 6, "#fff"); dot(g, path[path.length-1][0], path[path.length-1][1], 6, c);
};
ART.case["F05-10"].ratio = 1.1;
// F05-11 Frei Otto 羊毛線：多個釘點的絲線在水中聚合成最小路徑分岔網
ART.case["F05-11"] = function(g, W, H, r, c){
  g.fillStyle = "#101014"; g.fillRect(0,0,W,H);
  const root = [W*.5, H*.88], pins = []; for(let i=0;i<7;i++) pins.push([W*(.12+r()*.76), H*(.08+r()*.28)]);
  const trunk = [W*.5, H*.5];
  g.strokeStyle = rgba("#5A5A66", .5); g.lineWidth=1; pins.forEach(p => { g.beginPath(); g.arc(p[0],p[1],3.4,0,TAU); g.stroke(); });
  pins.forEach((p,i) => { const jitter = 6 + (i%3)*3, pts = [p]; const steps=10;
    for(let k=1;k<=steps;k++){ const t=k/steps, bx=p[0]+(trunk[0]-p[0])*t, by=p[1]+(trunk[1]-p[1])*t; pts.push([bx+(r()-.5)*jitter*(1-t), by+(r()-.5)*jitter*(1-t)]); }
    g.strokeStyle = rgba(c, .55); g.lineWidth = 1.1; smooth(g, pts); g.stroke(); });
  const pts2 = [trunk]; for(let k=1;k<=8;k++){ const t=k/8; pts2.push([trunk[0]+(root[0]-trunk[0])*t+(r()-.5)*4, trunk[1]+(root[1]-trunk[1])*t]); }
  g.strokeStyle = "#fff"; g.lineWidth = 2.6; g.lineCap="round"; smooth(g, pts2); g.stroke();
  glow(g, trunk[0], trunk[1], 20, c, .35); dot(g, root[0], root[1], 4.5, "#fff");
};
ART.case["F05-11"].ratio = 1.2;
})();
