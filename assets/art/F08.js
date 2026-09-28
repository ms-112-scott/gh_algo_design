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
