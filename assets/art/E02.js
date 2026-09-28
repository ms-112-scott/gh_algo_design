/* E02 Poisson 圓盤取樣：變形與無照片案例的獨立畫法
   每張卡都真的跑一次 Bridson（或對應的取樣法），再依變形／案例的內容取景：
   吸引子立面開孔、基地邊界、3D 點雲桁架、屋面取樣、植栽平面、石板鋪面、穿孔板、
   Lloyd 軌跡、繪圖機單線、生長波前、沿路燈柱、網格示意、點描紙本、Egg-Bot、兔子毛髮、
   三種取樣比較、球面、p5 編輯器、程序化地圖、抖動格點比較、Blender 散佈、GH 節點、纖維字體…… */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = Math.PI*2;
const cl = x => x < 0 ? 0 : x > 1 ? 1 : x;
const sm = (a, b, x) => { const t = cl((x-a)/(b-a)); return t*t*(3-2*t); };
const mix = (a, b, t) => a + (b-a)*t;

/* ---------- 共用：Bridson Poisson 圓盤取樣 ----------
   rad：常數或 (x,y)=>半徑（變密度，需給 rmin、rmax）
   inside(x,y)：邊界判斷；seeds：起始點；tries：每個活躍點試幾次；max：點數上限
   stop：接受幾點後就停（看生長過程用），回傳 {P, act}；P 的每一點 [x, y, 半徑, 順序] */
function pds(W, H, r, o){
  const rf = typeof o.rad === "function" ? o.rad : null, R0 = rf ? o.rmin : o.rad, RM = rf ? o.rmax : o.rad;
  const cs = R0/Math.SQRT2, gw = Math.ceil(W/cs)+1, gh = Math.ceil(H/cs)+1, grid = new Int32Array(gw*gh).fill(-1);
  const P = [], act = [], ins = o.inside || (() => true), reach = Math.ceil(RM/cs) + 1, tries = o.tries || 30, max = o.max || 5000, stop = o.stop || 1e9;
  const radAt = (x, y) => rf ? rf(x, y) : R0;
  const ok = (x, y, rq) => {
    if(x < 0 || y < 0 || x >= W || y >= H || !ins(x, y)) return false;
    const gx = (x/cs)|0, gy = (y/cs)|0;
    for(let j = Math.max(0, gy-reach); j <= Math.min(gh-1, gy+reach); j++) for(let i = Math.max(0, gx-reach); i <= Math.min(gw-1, gx+reach); i++){
      const k = grid[j*gw+i]; if(k < 0) continue; const p = P[k];
      if(Math.hypot(p[0]-x, p[1]-y) < Math.max(p[2], rq)) return false; }
    return true; };
  const add = (x, y, rq) => { P.push([x, y, rq, P.length]); act.push(P.length-1); grid[((y/cs)|0)*gw + ((x/cs)|0)] = P.length-1; };
  const seeds = o.seeds || [[W/2, H/2]];
  for(const s of seeds){ let x = s[0], y = s[1], t = 0;
    while(!ok(x, y, radAt(x, y)) && t++ < 200){ x = r()*W; y = r()*H; }
    if(t < 200) add(x, y, radAt(x, y)); }
  while(act.length && P.length < max && P.length < stop){
    const k = (r()*act.length)|0, p = P[act[k]]; let found = false;
    for(let t = 0; t < tries; t++){ const a = r()*TAU, d = p[2]*(1 + r()), x = p[0] + Math.cos(a)*d, y = p[1] + Math.sin(a)*d, rq = radAt(x, y);
      if(ok(x, y, rq)){ add(x, y, rq); found = true; break; } }
    if(!found) act.splice(k, 1); }
  return {P, act: act.map(i => P[i])};
}
// 3D 版：單位立方體內，候選點在球殼 r–2r
function pds3(r, rad, max = 600){
  const cs = rad/Math.sqrt(3), n = Math.ceil(1/cs)+1, grid = new Int32Array(n*n*n).fill(-1), P = [], act = [];
  const add = q => { P.push(q); act.push(P.length-1); grid[(((q[2]/cs)|0)*n + ((q[1]/cs)|0))*n + ((q[0]/cs)|0)] = P.length-1; };
  add([.5, .5, .5]);
  while(act.length && P.length < max){ const k = (r()*act.length)|0, p = P[act[k]]; let found = false;
    for(let t = 0; t < 30 && !found; t++){ const th = r()*TAU, z = r()*2-1, s = Math.sqrt(1-z*z), d = rad*(1 + r());
      const q = [p[0] + s*Math.cos(th)*d, p[1] + s*Math.sin(th)*d, p[2] + z*d];
      if(q.some(v => v < 0 || v >= 1)) continue;
      const gx = (q[0]/cs)|0, gy = (q[1]/cs)|0, gz = (q[2]/cs)|0; let far = true;
      for(let c = Math.max(0,gz-2); c <= Math.min(n-1,gz+2) && far; c++) for(let b = Math.max(0,gy-2); b <= Math.min(n-1,gy+2) && far; b++) for(let a = Math.max(0,gx-2); a <= Math.min(n-1,gx+2); a++){
        const i = grid[(c*n+b)*n+a]; if(i >= 0 && Math.hypot(P[i][0]-q[0], P[i][1]-q[1], P[i][2]-q[2]) < rad){ far = false; break; } }
      if(far){ add(q); found = true; } }
    if(!found) act.splice(k, 1); }
  return P;
}
// 像素法 Voronoi：lab[j*n+i] = 最近點索引；h 約等於點間距
function vor(P, W, H, s, h){
  const n = Math.ceil(W/s), m = Math.ceil(H/s), bw = Math.ceil(W/h)+1, bh = Math.ceil(H/h)+1, B = [...Array(bw*bh)].map(() => []);
  P.forEach((p, k) => B[Math.min(bh-1, Math.max(0, (p[1]/h)|0))*bw + Math.min(bw-1, Math.max(0, (p[0]/h)|0))].push(k));
  const lab = new Int32Array(n*m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const x = (i+.5)*s, y = (j+.5)*s, gx = (x/h)|0, gy = (y/h)|0; let best = -1, bd = 1e18;
    for(let R = 2; best < 0 || R === 2; R += 2){
      for(let b = Math.max(0,gy-R); b <= Math.min(bh-1,gy+R); b++) for(let a = Math.max(0,gx-R); a <= Math.min(bw-1,gx+R); a++) for(const k of B[b*bw+a]){ const d = (P[k][0]-x)**2 + (P[k][1]-y)**2; if(d < bd){ bd = d; best = k; } }
      if(R > 40) break; }
    lab[j*n+i] = best; }
  return {lab, n, m, s};
}
// 從 Voronoi 標籤取相鄰關係（= Delaunay 邊）
function adjOf(V){ const S = new Set(), {lab, n, m} = V;
  for(let j = 0; j < m-1; j++) for(let i = 0; i < n-1; i++){ const a = lab[j*n+i], b = lab[j*n+i+1], d = lab[(j+1)*n+i];
    if(a !== b) S.add(a < b ? a*65536+b : b*65536+a); if(a !== d) S.add(a < d ? a*65536+d : d*65536+a); }
  return [...S].map(k => [(k/65536)|0, k%65536]); }
function edgesOf(g, V, col){ const {lab, n, m, s} = V; g.fillStyle = col;
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const k = lab[j*n+i]; if((i < n-1 && lab[j*n+i+1] !== k) || (j < m-1 && lab[(j+1)*n+i] !== k)) g.fillRect(i*s, j*s, s, s); } }
function inPoly(x, y, pts){ let c = false; for(let i = 0, j = pts.length-1; i < pts.length; j = i++){ const a = pts[i], b = pts[j];
  if((a[1] > y) !== (b[1] > y) && x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; }
const dot = (g, x, y, R) => { g.beginPath(); g.arc(x, y, Math.max(.3, R), 0, TAU); g.fill(); };
const ring = (g, x, y, R) => { g.beginPath(); g.arc(x, y, Math.max(.3, R), 0, TAU); g.stroke(); };
const glow = (g, x, y, R, col, a) => { const q = g.createRadialGradient(x, y, 0, x, y, R); q.addColorStop(0, U.rgba(col, a)); q.addColorStop(1, U.rgba(col, 0)); g.fillStyle = q; g.fillRect(x-R, y-R, 2*R, 2*R); };
// 取一個子亂數源（讓兩次取樣用相同序列）
function mk2(r){ if(!r._seed) r._seed = (r()*4294967296)>>>0 || 7; return U.mk(r._seed); }
// 最近鄰居＋2-opt 的 TSP 路徑
function tsp(P, passes = 2){
  const n = P.length; if(n < 3) return P.slice(); const used = new Uint8Array(n), path = [0]; used[0] = 1;
  for(let s = 1; s < n; s++){ const p = P[path[s-1]]; let b = -1, bd = 1e18;
    for(let k = 0; k < n; k++) if(!used[k]){ const d = (P[k][0]-p[0])**2 + (P[k][1]-p[1])**2; if(d < bd){ bd = d; b = k; } }
    used[b] = 1; path.push(b); }
  const D = (a, b) => Math.hypot(P[a][0]-P[b][0], P[a][1]-P[b][1]);
  for(let ps = 0; ps < passes; ps++) for(let i = 0; i < n-2; i++) for(let j = i+2; j < Math.min(n-1, i+60); j++){
    const a = path[i], b = path[i+1], c = path[j], d = path[j+1];
    if(D(a,c) + D(b,d) < D(a,b) + D(c,d) - 1e-9){ for(let lo = i+1, hi = j; lo < hi; lo++, hi--){ const t = path[lo]; path[lo] = path[hi]; path[hi] = t; } } }
  return path.map(k => P[k]);
}
function pathLine(g, pts){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); }

const V = [];
/* V01 變密度取樣：兩個吸引子讓立面板的開孔變密 */
V[0] = function(g, W, H, r, c){
  const mg = W*.08, pw = W - 2*mg, ph = H - 2*mg, A = [[mg + pw*(.25 + r()*.15), mg + ph*(.3 + r()*.1)], [mg + pw*(.7 + r()*.1), mg + ph*(.72 + r()*.1)]];
  const rmin = Math.min(W,H)*.02, rmax = Math.min(W,H)*.075;
  const rad = (x, y) => { let d = 1e9; for(const a of A) d = Math.min(d, Math.hypot(x-a[0], y-a[1])); return mix(rmin, rmax, sm(0, Math.min(W,H)*.5, d)); };
  g.fillStyle = "#2A2A34"; g.fillRect(mg, mg, pw, ph);
  const {P} = pds(pw, ph, r, {rad: (x, y) => rad(x+mg, y+mg), rmin, rmax, seeds: [[A[0][0]-mg, A[0][1]-mg]]});
  A.forEach(a => glow(g, a[0], a[1], Math.min(W,H)*.35, c, .35));
  P.forEach(p => { const x = p[0]+mg, y = p[1]+mg; g.fillStyle = "#101014"; dot(g, x, y, p[2]*.36); g.strokeStyle = U.rgba(c, .55); g.lineWidth = .8; ring(g, x, y, p[2]*.36); });
  // 豎框與吸引子標記
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 2; g.strokeRect(mg, mg, pw, ph);
  for(let k = 1; k < 3; k++){ g.beginPath(); g.moveTo(mg + pw*k/3, mg); g.lineTo(mg + pw*k/3, mg+ph); g.stroke(); }
  A.forEach(a => { g.strokeStyle = "#fff"; g.lineWidth = 1.2; ring(g, a[0], a[1], 5); g.beginPath(); g.moveTo(a[0]-9, a[1]); g.lineTo(a[0]+9, a[1]); g.moveTo(a[0], a[1]-9); g.lineTo(a[0], a[1]+9); g.stroke(); });
};
V[0].ratio = 1.25;

/* V02 任意曲線邊界：基地輪廓內撒點，避開中庭與既有建物 */
V[1] = function(g, W, H, r, c){
  const nz = U.vnoise((r()*1e9)|0), cx = W*.5, cy = H*.5, R = Math.min(W,H)*.42, out = [];
  for(let k = 0; k < 90; k++){ const a = k/90*TAU, rr = R*(.72 + .35*nz(Math.cos(a)*1.6+3, Math.sin(a)*1.6+3)); out.push([cx + Math.cos(a)*rr*1.1, cy + Math.sin(a)*rr]); }
  const hole = [], hx = cx - R*.18, hy = cy - R*.05, hr = R*.24;
  for(let k = 0; k < 40; k++){ const a = k/40*TAU; hole.push([hx + Math.cos(a)*hr*1.3, hy + Math.sin(a)*hr]); }
  const bx = [cx + R*.25, cy + R*.12, R*.32, R*.26];
  const inside = (x, y) => inPoly(x, y, out) && !inPoly(x, y, hole) && !(x > bx[0] && x < bx[0]+bx[2] && y > bx[1] && y < bx[1]+bx[3]);
  // 基地外斜線
  g.save(); g.beginPath(); g.rect(0, 0, W, H); out.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip("evenodd");
  g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1; for(let t = -H; t < W; t += 7){ g.beginPath(); g.moveTo(t, 0); g.lineTo(t+H, H); g.stroke(); } g.restore();
  g.fillStyle = U.rgba(c, .07); U.poly(g, out, true); g.fill();
  const {P} = pds(W, H, r, {rad: Math.min(W,H)*.045, inside, seeds: [[cx + R*.2, cy - R*.4]]});
  g.strokeStyle = c; g.lineWidth = 1.3;
  P.forEach(p => { const s = p[2]*.22; g.beginPath(); g.moveTo(p[0]-s, p[1]); g.lineTo(p[0]+s, p[1]); g.moveTo(p[0], p[1]-s); g.lineTo(p[0], p[1]+s); g.stroke(); });
  g.strokeStyle = "#fff"; g.lineWidth = 2; U.poly(g, out, true); g.stroke();
  g.setLineDash([4, 3]); g.lineWidth = 1.2; U.poly(g, hole, true); g.stroke(); g.setLineDash([]);
  g.fillStyle = "#3A3A46"; g.fillRect(...bx); g.strokeStyle = "rgba(255,255,255,.5)"; g.strokeRect(...bx);
};

/* V03 3D Poisson：立方體內的點雲，近鄰連成空間桁架 */
V[2] = function(g, W, H, r, c){
  const rad = .17, P = pds3(r, rad), a = .5 + r()*.4, ca = Math.cos(a), sa = Math.sin(a), S = Math.min(W,H)*.52;
  const prj = p => { const x = p[0]-.5, y = p[1]-.5, z = p[2]-.5, X = x*ca - y*sa, Y = x*sa + y*ca; return [W/2 + X*S, H*.52 + Y*S*.5 - z*S*.85, Y]; };
  const Q = P.map(prj);
  // 立方體線框
  const C = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]].map(prj);
  g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1;
  [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([i,j]) => { g.beginPath(); g.moveTo(C[i][0], C[i][1]); g.lineTo(C[j][0], C[j][1]); g.stroke(); });
  const E = []; for(let i = 0; i < P.length; i++) for(let j = i+1; j < P.length; j++){ const d = Math.hypot(P[i][0]-P[j][0], P[i][1]-P[j][1], P[i][2]-P[j][2]); if(d < rad*1.35) E.push([i, j, (Q[i][2]+Q[j][2])/2]); }
  E.sort((a, b) => a[2]-b[2]);
  E.forEach(([i, j, z]) => { g.strokeStyle = U.rgba(c, .25 + (z+.7)*.35); g.lineWidth = .8 + (z+.7)*.6; g.beginPath(); g.moveTo(Q[i][0], Q[i][1]); g.lineTo(Q[j][0], Q[j][1]); g.stroke(); });
  Q.map((q, i) => i).sort((a, b) => Q[a][2]-Q[b][2]).forEach(i => { const [x, y, z] = Q[i], R = 1.8 + (z+.7)*2.2;
    const q = g.createRadialGradient(x-R*.3, y-R*.3, 0, x, y, R); q.addColorStop(0, "#fff"); q.addColorStop(1, U.rgba(c, .9)); g.fillStyle = q; dot(g, x, y, R); });
};
V[2].ratio = 1.05;

/* V04 曲面上取樣：波浪屋面上以 3D 距離撒點，角落小圖為 UV 空間 */
V[3] = function(g, W, H, r, c){
  const z = (u, v) => .22*Math.sin(u*TAU*.9 + .6)*(.55 + .45*Math.cos(v*Math.PI)) + .1*v, S = W*.78;
  const P3 = (u, v) => [u*1.4, v*.8, z(u, v)];
  const prj = p => [W*.1 + (p[0] + p[1]*.35)*S*.62, H*.72 - p[1]*S*.35 - p[2]*S*.9];
  // 大量隨機點 → 以 3D 距離丟鏢
  const rad = .075, K = [], UV = [];
  for(let t = 0; t < 2200; t++){ const u = r(), v = r(), q = P3(u, v); let ok = true;
    for(const k of K) if((k[0]-q[0])**2 + (k[1]-q[1])**2 + (k[2]-q[2])**2 < rad*rad){ ok = false; break; }
    if(ok){ K.push(q); UV.push([u, v]); } }
  // 屋面 UV 線
  g.lineWidth = .8; g.strokeStyle = "rgba(255,255,255,.14)";
  for(let i = 0; i <= 14; i++){ g.beginPath(); for(let j = 0; j <= 30; j++){ const p = prj(P3(i/14, j/30)); j ? g.lineTo(...p) : g.moveTo(...p); } g.stroke(); }
  for(let j = 0; j <= 8; j++){ g.beginPath(); for(let i = 0; i <= 50; i++){ const p = prj(P3(i/50, j/8)); i ? g.lineTo(...p) : g.moveTo(...p); } g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1.4; g.beginPath(); for(let i = 0; i <= 50; i++){ const p = prj(P3(i/50, 0)); i ? g.lineTo(...p) : g.moveTo(...p); } g.stroke();
  K.map((q, i) => i).sort((a, b) => K[b][1]-K[a][1]).forEach(i => { const q = K[i], [x, y] = prj(q), ny = cl(.5 + (z(UV[i][0]+.01, UV[i][1]) - z(UV[i][0], UV[i][1]))*20);
    g.fillStyle = U.rgba(c, .5 + ny*.5); g.beginPath(); g.ellipse(x, y, 2.6, 1.6, 0, 0, TAU); g.fill(); });
  // UV 空間小圖：同一批點在 UV 中並不均勻
  const bw = W*.26, bx = W - bw - 8, by = 8; g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(bx, by, bw, bw*.6); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(bx, by, bw, bw*.6);
  g.fillStyle = "#fff"; UV.forEach(([u, v]) => g.fillRect(bx + u*bw - .7, by + (1-v)*bw*.6 - .7, 1.4, 1.4));
};
V[3].ratio = .8;

/* V05 多類別 Poisson：大樹、小樹、灌木的植栽平面 */
V[4] = function(g, W, H, r, c){
  const M = Math.min(W,H), cls = [[M*.11, 60], [M*.055, 200], [M*.022, 900]], T = [], cnt = [0, 0, 0];
  const bz = t => { const u = 1-t; return [u*u*u*-10 + 3*u*u*t*W*.3 + 3*u*t*t*W*.6 + t*t*t*(W+10), u*u*u*H*.8 + 3*u*u*t*H*.55 + 3*u*t*t*H*.95 + t*t*t*H*.35]; };
  const path = []; for(let t = 0; t <= 1.0001; t += .02) path.push(bz(t));
  // 步道
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = M*.08; g.lineCap = "round"; pathLine(g, path); g.stroke();
  const onPath = (x, y) => path.some(p => Math.hypot(p[0]-x, p[1]-y) < M*.05);
  cls.forEach(([R, n], ci) => { for(let t = 0; t < n*6 && cnt[ci] < n; t++){ const x = r()*W, y = r()*H;
    if(onPath(x, y)) continue; let ok = true; for(const q of T) if(Math.hypot(q[0]-x, q[1]-y) < q[2] + R + 1){ ok = false; break; }
    if(ok){ T.push([x, y, R, ci]); cnt[ci]++; } } });
  T.forEach(([x, y, R, ci]) => {
    if(ci === 0){ g.fillStyle = U.rgba(c, .18); dot(g, x, y, R); g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1.2; ring(g, x, y, R);
      g.strokeStyle = U.rgba(c, .45); g.lineWidth = .8; for(let k = 0; k < 7; k++){ const a = k/7*TAU + x; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a)*R*.8, y + Math.sin(a)*R*.8); g.stroke(); }
      g.fillStyle = "#fff"; dot(g, x, y, 1.6); }
    else if(ci === 1){ g.fillStyle = "rgba(160,220,150,.22)"; g.strokeStyle = "rgba(170,230,160,.75)"; g.lineWidth = 1; g.beginPath();
      for(let k = 0; k <= 24; k++){ const a = k/24*TAU, rr = R*(.85 + .15*Math.cos(a*6)); k ? g.lineTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr) : g.moveTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr); } g.closePath(); g.fill(); g.stroke(); }
    else { g.fillStyle = "rgba(255,255,255,.55)"; for(let k = 0; k < 3; k++){ const a = k/3*TAU; dot(g, x + Math.cos(a)*R*.4, y + Math.sin(a)*R*.4, R*.4); } }
  });
};
V[4].ratio = .95;

/* V06 Poisson → Voronoi／Delaunay：左上 Delaunay 三角網，右下 Voronoi 石板鋪面 */
V[5] = function(g, W, H, r, c){
  const rad = Math.min(W,H)*.075, {P} = pds(W, H, r, {rad}), Vn = vor(P, W, H, 2, rad), {lab, n, m} = Vn, [R0, G0, B0] = U.rgb(c);
  const tone = P.map(() => .55 + r()*.4);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const x = i*2, y = j*2; if(x/W + y/H < 1.05) continue; const t = tone[lab[j*n+i]];
    g.fillStyle = `rgb(${(90 + (R0-90)*.35)*t|0},${(90 + (G0-90)*.35)*t|0},${(96 + (B0-96)*.35)*t|0})`; g.fillRect(x, y, 2, 2); }
  g.save(); g.beginPath(); g.moveTo(W*1.05, 0); g.lineTo(0, H*1.05); g.lineTo(W*1.1, H*1.1); g.closePath(); g.clip(); edgesOf(g, Vn, "#101014"); g.restore();
  g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(W*1.05, 0); g.lineTo(0, H*1.05); g.closePath(); g.clip();
  g.strokeStyle = U.rgba(c, .8); g.lineWidth = 1; adjOf(Vn).forEach(([a, b]) => { g.beginPath(); g.moveTo(P[a][0], P[a][1]); g.lineTo(P[b][0], P[b][1]); g.stroke(); });
  g.fillStyle = "#fff"; P.forEach(p => dot(g, p[0], p[1], 1.8)); g.restore();
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(W*1.05, 0); g.lineTo(0, H*1.05); g.stroke(); g.setLineDash([]);
};

/* V07 點描開孔：背光穿孔板，孔徑依影像亮度，最大不超過 r/2 − 肋寬 */
V[6] = function(g, W, H, r, c){
  const mg = W*.07, pw = W-2*mg, ph = H-2*mg, rad = Math.min(W,H)*.042, rib = rad*.12;
  const fx = pw*(.3 + r()*.4), fy = ph*(.3 + r()*.3);
  const img = (x, y) => { const d = Math.hypot(x-fx, y-fy)/Math.min(pw,ph); return cl(.5 + .5*Math.cos(d*18)*Math.exp(-d*1.6) + (y/ph - .5)*.3); };
  const mt = g.createLinearGradient(mg, mg, mg+pw, mg+ph); mt.addColorStop(0, "#4A4A56"); mt.addColorStop(1, "#2C2C35"); g.fillStyle = mt; g.fillRect(mg, mg, pw, ph);
  const {P} = pds(pw, ph, r, {rad});
  P.forEach(p => { const b = img(p[0], p[1]), R = (rad/2 - rib)*(.15 + .85*b), x = p[0]+mg, y = p[1]+mg;
    const q = g.createRadialGradient(x, y, 0, x, y, R); q.addColorStop(0, "#fff"); q.addColorStop(.5, U.rgba(c, 1)); q.addColorStop(1, U.rgba(c, .6)); g.fillStyle = q; dot(g, x, y, R); });
  g.fillStyle = "#8A8A96"; [[mg+6, mg+6], [mg+pw-6, mg+6], [mg+6, mg+ph-6], [mg+pw-6, mg+ph-6]].forEach(([x, y]) => dot(g, x, y, 2.4));
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(mg, mg, pw, ph);
};
V[6].ratio = 1.3;

/* V08 Lloyd 鬆弛：點沿軌跡移向單元重心，單元趨近六邊形 */
V[7] = function(g, W, H, r, c){
  const rad = Math.min(W,H)*.1; let {P} = pds(W, H, r, {rad, tries: 2});
  P = P.map(p => [p[0] + (r()-.5)*rad*.5, p[1] + (r()-.5)*rad*.5]).map(p => [Math.min(W-1, Math.max(1, p[0])), Math.min(H-1, Math.max(1, p[1]))]);
  const trail = P.map(p => [p.slice()]); let Vn;
  for(let it = 0; it < 5; it++){ Vn = vor(P, W, H, 3, rad); const acc = P.map(() => [0, 0, 0]);
    for(let j = 0; j < Vn.m; j++) for(let i = 0; i < Vn.n; i++){ const a = acc[Vn.lab[j*Vn.n+i]]; a[0] += (i+.5)*3; a[1] += (j+.5)*3; a[2]++; }
    P = acc.map((a, k) => a[2] ? [a[0]/a[2], a[1]/a[2]] : P[k]); P.forEach((p, k) => trail[k].push(p.slice())); }
  Vn = vor(P, W, H, 2, rad);
  edgesOf(g, Vn, U.rgba(c, .35));
  trail.forEach(t => { g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.2; pathLine(g, t); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = .9; ring(g, t[0][0], t[0][1], 2.6); });
  g.fillStyle = c; P.forEach(p => dot(g, p[0], p[1], 3));
};

/* V09 TSP 單筆路徑：繪圖機紙上的一條連續線 */
V[8] = function(g, W, H, r, c){
  const mg = W*.08, pw = W-2*mg, ph = H-2*mg;
  g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(mg+4, mg+5, pw, ph); g.fillStyle = "#ECE8DE"; g.fillRect(mg, mg, pw, ph);
  const cx = pw*.5, cy = ph*.5, sp = r()*TAU;
  const dark = (x, y) => { const dx = x-cx, dy = y-cy, d = Math.hypot(dx, dy)/Math.min(pw, ph), a = Math.atan2(dy, dx); return cl((.5 + .5*Math.sin(a*2 + d*22 + sp))*(1 - d*1.4)); };
  const rmin = Math.min(W,H)*.018, rmax = Math.min(W,H)*.07;
  const {P} = pds(pw, ph, r, {rad: (x, y) => mix(rmax, rmin, dark(x, y)), rmin, rmax, max: 700});
  const path = tsp(P.map(p => [p[0]+mg, p[1]+mg]));
  g.strokeStyle = "#23222A"; g.lineWidth = 1; g.lineJoin = "round"; pathLine(g, path); g.stroke();
  // 繪圖機橫桿與筆頭
  const e = path[path.length-1]; g.fillStyle = "#555562"; g.fillRect(0, e[1]-3, W, 6); g.fillStyle = c; g.fillRect(e[0]-7, e[1]-9, 14, 18); g.fillStyle = "#fff"; dot(g, e[0], e[1], 2);
};
V[8].ratio = 1.1;

/* V10 逐步生長動畫：已接受的點依順序漸亮，活躍名單標環，一個點的 r–2r 候選環 */
V[9] = function(g, W, H, r, c){
  const rad = Math.min(W,H)*.06, full = pds(W, H, mk2(r), {rad, seeds: [[W*.18, H*.8]]}).P.length;
  const {P, act} = pds(W, H, mk2(r), {rad, seeds: [[W*.18, H*.8]], stop: Math.round(full*.5)});
  g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 1; const cs = rad/Math.SQRT2;
  for(let x = 0; x < W; x += cs){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for(let y = 0; y < H; y += cs){ g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  P.forEach(p => { const t = p[3]/P.length; g.fillStyle = U.rgba(c, .15 + t*.6); dot(g, p[0], p[1], 2.2); });
  g.strokeStyle = "#fff"; g.lineWidth = 1.2; act.forEach(p => ring(g, p[0], p[1], 4));
  if(act.length){ const p = act[(act.length/2)|0]; g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.arc(p[0], p[1], 2*rad, 0, TAU); g.arc(p[0], p[1], rad, 0, TAU, true); g.fill();
    g.setLineDash([3, 3]); g.strokeStyle = "rgba(255,255,255,.6)"; ring(g, p[0], p[1], rad); ring(g, p[0], p[1], 2*rad); g.setLineDash([]);
    g.strokeStyle = "#ff7a7a"; g.lineWidth = 1.2; for(let k = 0; k < 6; k++){ const a = r()*TAU, d = rad*(1 + r()), x = p[0] + Math.cos(a)*d, y = p[1] + Math.sin(a)*d; g.beginPath(); g.moveTo(x-3, y-3); g.lineTo(x+3, y+3); g.moveTo(x+3, y-3); g.lineTo(x-3, y+3); g.stroke(); } }
};

/* V11 沿曲線的 1D Poisson：步道一側的路燈、另一側的矮柱，下方是拉直的立面 */
V[10] = function(g, W, H, r, c){
  const ph = H*.72, bez = t => { const u = 1-t; return [u*u*u*W*.05 + 3*u*u*t*W*.2 + 3*u*t*t*W*.9 + t*t*t*W*.95, u*u*u*ph*.15 + 3*u*u*t*ph*1.05 + 3*u*t*t*ph*-.1 + t*t*t*ph*.85]; };
  const N = 200, C = [], L = [0]; for(let i = 0; i <= N; i++){ C.push(bez(i/N)); if(i) L.push(L[i-1] + Math.hypot(C[i][0]-C[i-1][0], C[i][1]-C[i-1][1])); }
  const at = (s, off) => { let i = 1; while(i < N && L[i] < s) i++; const t = (s - L[i-1])/(L[i]-L[i-1] || 1), a = C[i-1], b = C[i], x = mix(a[0], b[0], t), y = mix(a[1], b[1], t), dx = b[0]-a[0], dy = b[1]-a[1], l = Math.hypot(dx, dy) || 1; return [x - dy/l*off, y + dx/l*off]; };
  const w = W*.05, tot = L[N];
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = w*2; g.lineCap = "round"; pathLine(g, C); g.stroke();
  g.lineWidth = 1; g.strokeStyle = "rgba(255,255,255,.35)"; [-w, w].forEach(o => { pathLine(g, C.map((_, i) => at(L[i], o))); g.stroke(); });
  const dMin = tot*.07, lamps = [], bol = [];
  for(let s = r()*dMin*.5; s < tot; s += dMin*(1 + r())) lamps.push(s);
  for(let s = r()*dMin*.2; s < tot; s += dMin*.35*(1 + r())) bol.push(s);
  lamps.forEach(s => { const [x, y] = at(s, -w*1.5); glow(g, x, y, w*2.4, c, .45); g.fillStyle = "#fff"; dot(g, x, y, 2.4); });
  g.fillStyle = U.rgba(c, .9); bol.forEach(s => { const [x, y] = at(s, w*1.4); g.fillRect(x-1.5, y-1.5, 3, 3); });
  // 拉直的立面：燈柱與矮柱
  const y0 = H*.95, sx = (W*.9)/tot; g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.beginPath(); g.moveTo(W*.05, y0); g.lineTo(W*.95, y0); g.stroke();
  lamps.forEach(s => { const x = W*.05 + s*sx; g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 - H*.16); g.lineTo(x+5, y0 - H*.16); g.stroke(); glow(g, x+5, y0 - H*.155, 8, c, .6); });
  g.fillStyle = U.rgba(c, .8); bol.forEach(s => { const x = W*.05 + s*sx; g.fillRect(x-1, y0 - H*.035, 2, H*.035); });
};
V[10].ratio = 1.1;

ART.var["E02"] = V;

/* ================= 無照片案例 ================= */
const CS = {};
/* E02-01 原始論文：背景格子 cell = r/√2、5×5 鄰格檢查、r–2r 環 */
CS["E02-01"] = function(g, W, H, r, c){
  const rad = Math.min(W,H)*.15, cs = rad/Math.SQRT2, {P} = pds(W, H, r, {rad}), gx = Math.ceil(W/cs), gy = Math.ceil(H/cs);
  g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 1;
  for(let i = 0; i <= gx; i++){ g.beginPath(); g.moveTo(i*cs, 0); g.lineTo(i*cs, H); g.stroke(); } for(let j = 0; j <= gy; j++){ g.beginPath(); g.moveTo(0, j*cs); g.lineTo(W, j*cs); g.stroke(); }
  let p = P[0]; P.forEach(q => { if(Math.hypot(q[0]-W/2, q[1]-H/2) < Math.hypot(p[0]-W/2, p[1]-H/2)) p = q; });
  const ci = (p[0]/cs)|0, cj = (p[1]/cs)|0;
  g.fillStyle = U.rgba(c, .12); g.fillRect((ci-2)*cs, (cj-2)*cs, 5*cs, 5*cs); g.fillStyle = U.rgba(c, .4); g.fillRect(ci*cs, cj*cs, cs, cs);
  g.strokeStyle = U.rgba(c, .7); g.lineWidth = 1.5; g.strokeRect((ci-2)*cs, (cj-2)*cs, 5*cs, 5*cs);
  P.forEach(q => { g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; ring(g, q[0], q[1], rad/2); });
  g.fillStyle = "rgba(255,255,255,.07)"; g.beginPath(); g.arc(p[0], p[1], 2*rad, 0, TAU); g.arc(p[0], p[1], rad, 0, TAU, true); g.fill();
  g.setLineDash([4, 3]); g.strokeStyle = "#fff"; g.lineWidth = 1; ring(g, p[0], p[1], rad); ring(g, p[0], p[1], 2*rad); g.setLineDash([]);
  g.fillStyle = "#fff"; P.forEach(q => dot(g, q[0], q[1], 2.6)); g.fillStyle = c; dot(g, p[0], p[1], 4.5);
  // r 的量尺
  g.strokeStyle = "#fff"; g.lineWidth = 1; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0]+rad, p[1]); g.stroke();
};

/* E02-02 加權 Voronoi 點描：白紙上的球與投影 */
CS["E02-02"] = function(g, W, H, r, c){
  g.fillStyle = "#EFECE4"; g.fillRect(0, 0, W, H);
  const sx = W*.5, sy = H*.42, sr = Math.min(W,H)*.3, lx = -.55, ly = -.6, lz = .58;
  const dark = (x, y) => { const dx = (x-sx)/sr, dy = (y-sy)/sr, d2 = dx*dx + dy*dy;
    if(d2 < 1){ const nz = Math.sqrt(1-d2), L = cl(dx*lx + dy*ly + nz*lz); return cl(.95 - L*1.05); }
    const ex = (x - sx - sr*.35)/(sr*1.25), ey = (y - sy - sr*1.05)/(sr*.32), e = ex*ex + ey*ey;
    return e < 1 ? .75*(1-e*.7) : .03 + (y/H)*.08; };
  const rmin = Math.min(W,H)*.011, rmax = Math.min(W,H)*.06;
  const {P} = pds(W, H, r, {rad: (x, y) => mix(rmax, rmin, Math.pow(dark(x, y), .8)), rmin, rmax, max: 3500, tries: 12});
  g.fillStyle = "#1E1D24"; P.forEach(p => dot(g, p[0], p[1], .7 + dark(p[0], p[1])*1.1));
  g.fillStyle = U.rgba(c, .9); g.fillRect(W*.06, H*.93, W*.12, 2);
};
CS["E02-02"].ratio = 1.2;

/* E02-03 StippleGen＋Egg-Bot：蛋殼上的 TSP 單線 */
CS["E02-03"] = function(g, W, H, r, c){
  const cx = W*.5, cy = H*.55, a = W*.3, b = H*.3, egg = [];
  for(let k = 0; k < 80; k++){ const t = k/80*TAU; egg.push([cx + a*Math.cos(t), cy + b*Math.sin(t)*(1 - .16*Math.cos(t))]); }
  // 夾頭與轉軸
  g.fillStyle = "#3C3C48"; g.fillRect(W*.02, cy - b*.25, cx - a - W*.02 + 4, b*.5); g.fillRect(cx + a - 4, cy - b*.18, W*.98 - cx - a + 4, b*.36);
  g.fillStyle = "#2A2A33"; g.fillRect(W*.02, cy + b*1.15, W*.96, H*.05);
  const sh = g.createRadialGradient(cx - a*.35, cy - b*.4, 0, cx, cy, a*1.1); sh.addColorStop(0, "#F4F1EA"); sh.addColorStop(1, "#9C988F"); g.fillStyle = sh; U.poly(g, egg, true); g.fill();
  // 蛋面上的點描圖樣
  const dark = (x, y) => { const u = (x-cx)/a, v = (y-cy)/b; return cl(.5 + .5*Math.sin(u*9 + Math.cos(v*5)*2)) * cl(1 - (u*u + v*v)*.6); };
  const rmin = Math.min(W,H)*.012, rmax = Math.min(W,H)*.05;
  const {P} = pds(W, H, r, {rad: (x, y) => mix(rmax, rmin, dark(x, y)), rmin, rmax, inside: (x, y) => inPoly(x, y, egg), seeds: [[cx, cy]], max: 650});
  const path = tsp(P); g.save(); U.poly(g, egg, true); g.clip();
  g.strokeStyle = U.rgba(c, 1); g.lineWidth = 1; g.lineJoin = "round"; pathLine(g, path); g.stroke(); g.restore();
  // 筆臂
  const e = path[path.length-1] || [cx, cy]; g.strokeStyle = "#8A8A96"; g.lineWidth = 3; g.beginPath(); g.moveTo(W*.9, H*.06); g.lineTo(e[0], e[1] - 12); g.stroke();
  g.fillStyle = "#fff"; g.fillRect(e[0]-3, e[1]-14, 6, 12); g.fillStyle = c; dot(g, e[0], e[1], 2);
};
CS["E02-03"].ratio = .78;

/* E02-04 Sample Elimination：兔子輪廓內大量隨機點，刪到剩 Poisson 點，再長出毛髮 */
CS["E02-04"] = function(g, W, H, r, c){
  const M = Math.min(W,H), E = [[W*.55, H*.66, M*.3, M*.22], [W*.3, H*.47, M*.15, M*.14], [W*.24, H*.22, M*.05, M*.17], [W*.36, H*.2, M*.05, M*.17], [W*.84, H*.6, M*.06, M*.06]];
  const inside = (x, y) => E.some(([ex, ey, rx, ry]) => ((x-ex)/rx)**2 + ((y-ey)/ry)**2 < 1);
  const S = []; for(let t = 0; t < 3000 && S.length < 1500; t++){ const x = r()*W, y = r()*H; if(inside(x, y)) S.push([x, y]); }
  const rad = M*.045, K = [], Del = [];
  S.forEach(p => { let ok = true; for(const k of K) if((k[0]-p[0])**2 + (k[1]-p[1])**2 < rad*rad){ ok = false; break; } (ok ? K : Del).push(p); });
  g.fillStyle = "rgba(255,255,255,.05)"; E.forEach(([ex, ey, rx, ry]) => { g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, TAU); g.fill(); });
  g.fillStyle = "rgba(255,120,120,.35)"; Del.forEach(p => g.fillRect(p[0]-.6, p[1]-.6, 1.2, 1.2));
  // 毛髮：由各點沿「離最近橢圓中心」方向長出
  K.forEach(p => { let best = E[0], bd = 1e9; E.forEach(e => { const d = ((p[0]-e[0])/e[2])**2 + ((p[1]-e[1])/e[3])**2; if(d < bd){ bd = d; best = e; } });
    const dx = p[0]-best[0], dy = p[1]-best[1], l = Math.hypot(dx, dy) || 1, len = rad*(.4 + .5*Math.sqrt(bd));
    g.strokeStyle = U.rgba(c, .75); g.lineWidth = 1; g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + dx/l*len*.6, p[1] + dy/l*len*.6 - len*.2, p[0] + dx/l*len, p[1] + dy/l*len - len*.1); g.stroke();
    g.fillStyle = "#fff"; dot(g, p[0], p[1], 1.5); });
  g.fillStyle = "#15151B"; dot(g, W*.24, H*.45, 3);
};
CS["E02-04"].ratio = .9;

/* E02-05 Visualizing Algorithms：純隨機／最佳候選／Bridson 三欄比較 */
CS["E02-05"] = function(g, W, H, r, c){
  const cw = W/3, rad = Math.min(cw, H)*.14, {P} = pds(cw, H, r, {rad}), N = P.length;
  const cols = ["rgba(255,255,255,.75)", "rgba(255,255,255,.85)", c];
  const rnd = [...Array(N)].map(() => [r()*cw, r()*H]);
  const best = [[r()*cw, r()*H]]; while(best.length < N){ let bp = null, bd = -1; for(let k = 0; k < 10; k++){ const q = [r()*cw, r()*H]; let d = 1e9; for(const b of best) d = Math.min(d, Math.hypot(b[0]-q[0], b[1]-q[1])); if(d > bd){ bd = d; bp = q; } } best.push(bp); }
  [rnd, best, P].forEach((S, k) => { const ox = k*cw; g.fillStyle = k === 2 ? U.rgba(c, .07) : "rgba(255,255,255,.02)"; g.fillRect(ox+3, 3, cw-6, H-6);
    S.forEach(p => { g.strokeStyle = k === 2 ? U.rgba(c, .25) : "rgba(255,255,255,.1)"; g.lineWidth = 1; ring(g, ox + p[0], p[1], rad/2); g.fillStyle = cols[k]; dot(g, ox + p[0], p[1], 2); });
    // 欄頂的小圖示：候選數多寡
    for(let t = 0; t < [1, 3, 6][k]; t++){ g.fillStyle = k === 2 ? c : "rgba(255,255,255,.6)"; g.fillRect(ox + 8 + t*5, 7, 3, 3); } });
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; [1, 2].forEach(k => { g.beginPath(); g.moveTo(k*cw, 6); g.lineTo(k*cw, H-6); g.stroke(); });
};
CS["E02-05"].ratio = .8;

/* E02-06 互動視覺化：球面上的 Poisson 取樣 */
CS["E02-06"] = function(g, W, H, r, c){
  const cx = W/2, cy = H/2, R = Math.min(W,H)*.4, rad = .22, K = [];
  for(let t = 0; t < 4000 && K.length < 400; t++){ const z = r()*2-1, a = r()*TAU, s = Math.sqrt(1-z*z), q = [s*Math.cos(a), s*Math.sin(a), z];
    let ok = true; for(const k of K) if((k[0]-q[0])**2 + (k[1]-q[1])**2 + (k[2]-q[2])**2 < rad*rad){ ok = false; break; } if(ok) K.push(q); }
  const tl = .45, ct = Math.cos(tl), st = Math.sin(tl), rot = q => [q[0], q[1]*ct - q[2]*st, q[1]*st + q[2]*ct];
  const q = g.createRadialGradient(cx - R*.3, cy - R*.3, 0, cx, cy, R); q.addColorStop(0, U.rgba(c, .22)); q.addColorStop(1, U.rgba(c, .03)); g.fillStyle = q; dot(g, cx, cy, R);
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1;
  for(let la = -60; la <= 60; la += 30){ g.beginPath(); for(let k = 0; k <= 60; k++){ const a = k/60*TAU, z = Math.sin(la*Math.PI/180), s = Math.cos(la*Math.PI/180), p = rot([s*Math.cos(a), z, s*Math.sin(a)]); if(p[2] < 0){ g.moveTo(cx + p[0]*R, cy + p[1]*R); continue; } g.lineTo(cx + p[0]*R, cy + p[1]*R); } g.stroke(); }
  K.map(rot).sort((a, b) => a[2]-b[2]).forEach(p => { const x = cx + p[0]*R, y = cy + p[1]*R, f = p[2] > 0;
    const ang = Math.atan2(p[1], p[0]), rr = Math.min(1, Math.hypot(p[0], p[1]));
    g.strokeStyle = f ? U.rgba(c, .5) : "rgba(255,255,255,.06)"; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, R*rad*.5*Math.max(.05, Math.sqrt(1-rr*rr)), R*rad*.5, ang, 0, TAU); g.stroke();
    g.fillStyle = f ? "#fff" : "rgba(255,255,255,.15)"; dot(g, x, y, f ? 2 : 1.2); });
  g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1.2; ring(g, cx, cy, R);
};

/* E02-07 p5.js 教學：左邊程式碼區塊、右邊畫布（活躍點洋紅、網格） */
CS["E02-07"] = function(g, W, H, r, c){
  g.fillStyle = "#2B2B33"; g.fillRect(0, 0, W, 14); ["#ff5f57", "#febc2e", "#28c840"].forEach((col, k) => { g.fillStyle = col; dot(g, 8 + k*9, 7, 2.6); });
  const cw = W*.4; g.fillStyle = "#1A1A20"; g.fillRect(0, 14, cw, H-14);
  const pal = ["#c792ea", "#82aaff", "#c3e88d", "#f78c6c", "rgba(255,255,255,.5)"]; let ind = 0;
  for(let y = 24; y < H-6; y += 7){ if(r() < .15) ind = Math.max(0, ind-1); else if(r() < .2) ind = Math.min(3, ind+1);
    g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(3, y, 5, 2); let x = 12 + ind*7; const n = 1 + (r()*4)|0;
    for(let k = 0; k < n && x < cw-6; k++){ const w = 5 + r()*20; g.fillStyle = pal[(r()*pal.length)|0]; g.fillRect(x, y, Math.min(w, cw-6-x), 3); x += w + 3; } }
  const ox = cw + 6, oy = 20, pw = W - ox - 6, ph = H - oy - 6; g.fillStyle = "#000"; g.fillRect(ox, oy, pw, ph);
  const rad = Math.min(pw, ph)*.075, cs = rad/Math.SQRT2; g.save(); g.translate(ox, oy);
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; for(let x = 0; x <= pw; x += cs){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, ph); g.stroke(); } for(let y = 0; y <= ph; y += cs){ g.beginPath(); g.moveTo(0, y); g.lineTo(pw, y); g.stroke(); }
  const full = pds(pw, ph, mk2(r), {rad}).P.length, {P, act} = pds(pw, ph, mk2(r), {rad, stop: Math.round(full*.7)});
  g.fillStyle = "#fff"; P.forEach(p => dot(g, p[0], p[1], 2.2)); g.fillStyle = "#ff3cc7"; act.forEach(p => dot(g, p[0], p[1], 2.8));
  g.restore(); g.fillStyle = c; g.fillRect(ox, oy - 4, pw*.3, 2);
};
CS["E02-07"].ratio = .72;

/* E02-08 mapgen4：Poisson 點 → Voronoi 地形、河流 */
CS["E02-08"] = function(g, W, H, r, c){
  const rad = Math.min(W,H)*.035, {P} = pds(W, H, r, {rad, tries: 12}), nz = U.vnoise((r()*1e9)|0), Vn = vor(P, W, H, 2, rad*1.5), {lab, n, m} = Vn;
  const el = P.map(p => { const dx = p[0]/W - .5, dy = p[1]/H - .5; return nz(p[0]/W*4, p[1]/H*4)*.6 + nz(p[0]/W*9+7, p[1]/H*9)*.25 + .55 - Math.hypot(dx, dy)*1.5; });
  const col = e => { if(e < .3){ const t = cl(e/.3); return [30 + 40*t, 60 + 60*t, 100 + 60*t]; }
    const t = cl((e-.3)/.5); return t < .5 ? [mix(110, 170, t*2), mix(150, 170, t*2), mix(90, 110, t*2)] : [mix(170, 235, t*2-1), mix(170, 230, t*2-1), mix(110, 220, t*2-1)]; };
  const Cc = el.map(col); for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const q = Cc[lab[j*n+i]]; g.fillStyle = `rgb(${q[0]|0},${q[1]|0},${q[2]|0})`; g.fillRect(i*2, j*2, 2, 2); }
  edgesOf(g, Vn, "rgba(0,0,0,.08)");
  // 河流：從高處沿最低鄰居流下
  const adj = P.map(() => []); adjOf(Vn).forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
  const flow = new Float32Array(P.length), down = P.map((_, k) => { let b = -1, be = el[k]; adj[k].forEach(q => { if(el[q] < be){ be = el[q]; b = q; } }); return b; });
  P.map((_, k) => k).sort((a, b) => el[b]-el[a]).forEach(k => { if(el[k] < .3) return; flow[k] += 1; if(down[k] >= 0) flow[down[k]] += flow[k]; });
  g.strokeStyle = "rgb(60,110,170)"; g.lineCap = "round";
  P.forEach((p, k) => { const d = down[k]; if(d < 0 || el[k] < .3 || flow[k] < 5) return; g.lineWidth = Math.min(4, .5 + Math.sqrt(flow[k])*.35); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(P[d][0], P[d][1]); g.stroke(); });
  g.strokeStyle = U.rgba(c, .9); g.lineWidth = 3; g.strokeRect(1.5, 1.5, W-3, H-3);
};
CS["E02-08"].ratio = 1.15;

/* E02-09 抖動格點 vs Poisson：上下對照，最近鄰距離太近的點標紅 */
CS["E02-09"] = function(g, W, H, r, c){
  const h = H/2, s = Math.min(W, h)/7, J = [];
  for(let y = s/2; y < h; y += s) for(let x = s/2; x < W; x += s) J.push([x + (r()-.5)*s*.95, y + (r()-.5)*s*.95]);
  const {P} = pds(W, h, r, {rad: s*.85});
  const draw = (S, oy, grid) => { if(grid){ g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; for(let x = 0; x <= W; x += s){ g.beginPath(); g.moveTo(x, oy); g.lineTo(x, oy+h); g.stroke(); } for(let y = 0; y <= h; y += s){ g.beginPath(); g.moveTo(0, oy+y); g.lineTo(W, oy+y); g.stroke(); } }
    S.forEach((p, i) => { let b = -1, bd = 1e9; S.forEach((q, j) => { if(j !== i){ const d = Math.hypot(p[0]-q[0], p[1]-q[1]); if(d < bd){ bd = d; b = j; } } });
      const bad = bd < s*.5; g.strokeStyle = bad ? "#ff6b6b" : "rgba(255,255,255,.25)"; g.lineWidth = bad ? 1.8 : .8; g.beginPath(); g.moveTo(p[0], oy+p[1]); g.lineTo(S[b][0], oy+S[b][1]); g.stroke();
      g.fillStyle = bad ? "#ff6b6b" : (grid ? "#fff" : c); dot(g, p[0], oy+p[1], 2.4); }); };
  g.save(); g.beginPath(); g.rect(0, 0, W, h-2); g.clip(); draw(J, 0, true); g.restore();
  g.save(); g.beginPath(); g.rect(0, h+2, W, h); g.clip(); g.fillStyle = U.rgba(c, .06); g.fillRect(0, h, W, h); draw(P.map(p => [p[0], p[1]]), h, false); g.restore();
  g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(0, h-1, W, 2);
};
CS["E02-09"].ratio = 1.3;

/* E02-10 Blender：地形網格上依權重貼圖散佈樹與石頭（透視） */
CS["E02-10"] = function(g, W, H, r, c){
  const nz = U.vnoise((r()*1e9)|0), ht = (u, v) => nz(u*3, v*3)*.25, wgt = (u, v) => cl(nz(u*2.2+5, v*2.2+5)*1.6 - .3);
  const prj = (u, v, z) => { const dep = 1 + v*1.6; return [(u - .5)*W*1.3/dep + W/2, H*.12 + (H*.85)/dep - z*H*.6/dep, dep]; };
  const n = 18;
  // 權重貼圖：藍→紅
  for(let j = n-1; j >= 0; j--) for(let i = 0; i < n; i++){ const u0 = i/n, v0 = j/n, u1 = (i+1)/n, v1 = (j+1)/n, w = wgt((u0+u1)/2, (v0+v1)/2);
    const q = [prj(u0, v0, ht(u0, v0)), prj(u1, v0, ht(u1, v0)), prj(u1, v1, ht(u1, v1)), prj(u0, v1, ht(u0, v1))];
    g.fillStyle = `rgba(${mix(40, 230, w)|0},${mix(70, 90, w)|0},${mix(200, 60, w)|0},.35)`; U.poly(g, q, true); g.fill(); g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = .7; g.stroke(); }
  const rmin = .035, rmax = .14, {P} = pds(1, 1, r, {rad: (u, v) => mix(rmax, rmin, wgt(u, v)), rmin, rmax, tries: 15});
  P.map(p => [p[0], p[1], r()]).sort((a, b) => b[1]-a[1]).forEach(([u, v, k]) => { const [x, y, dep] = prj(u, v, ht(u, v)), s = 18/dep;
    if(k < .8){ g.fillStyle = "#3a2b20"; g.fillRect(x-s*.08, y-s*.35, s*.16, s*.35); g.fillStyle = U.rgba(c, .95); g.beginPath(); g.moveTo(x, y - s*1.4); g.lineTo(x + s*.4, y - s*.3); g.lineTo(x - s*.4, y - s*.3); g.closePath(); g.fill();
      g.fillStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.moveTo(x, y - s*1.4); g.lineTo(x - s*.4, y - s*.3); g.lineTo(x - s*.1, y - s*.3); g.closePath(); g.fill(); }
    else { g.fillStyle = "#9a9aa6"; g.beginPath(); g.ellipse(x, y - s*.1, s*.25, s*.14, 0, 0, TAU); g.fill(); } });
  // 視窗感：左下座標軸
  g.lineWidth = 2; [["#ff5555", 14, 0], ["#66dd66", 0, -14]].forEach(([col, dx, dy]) => { g.strokeStyle = col; g.beginPath(); g.moveTo(14, H-14); g.lineTo(14+dx, H-14+dy); g.stroke(); });
};
CS["E02-10"].ratio = .8;

/* E02-11 Grasshopper 元件：節點＋連線，視窗中上為 2D 圓盤、下為 3D 球體版 */
CS["E02-11"] = function(g, W, H, r, c){
  g.fillStyle = "#2A2A30"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 1; for(let x = 0; x < W; x += 12){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for(let y = 0; y < H; y += 12){ g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const node = (x, y, w, h, hi) => { g.fillStyle = hi ? U.rgba(c, .85) : "#C9C9CF"; g.fillRect(x, y, w, h); g.strokeStyle = "#111"; g.lineWidth = 1; g.strokeRect(x, y, w, h);
    g.fillStyle = "#555"; g.fillRect(x + w*.3, y + 3, w*.4, h-6); g.fillStyle = "#111"; for(let k = 0; k < 2; k++){ dot(g, x, y + h*(k+1)/3, 2); dot(g, x + w, y + h*(k+1)/3, 2); } };
  const wire = (a, b) => { g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(...a); g.bezierCurveTo(a[0]+30, a[1], b[0]-30, b[1], ...b); g.stroke(); };
  const nw = W*.16, nh = H*.13;
  g.fillStyle = "#D8D8DC"; g.fillRect(8, H*.18, W*.2, 10); g.fillStyle = c; g.fillRect(8 + W*.12, H*.18 - 2, 4, 14);
  g.fillStyle = "#D8D8DC"; g.fillRect(8, H*.62, W*.2, 10); g.fillStyle = c; g.fillRect(8 + W*.06, H*.62 - 2, 4, 14);
  node(W*.3, H*.14, nw, nh, false); node(W*.3, H*.58, nw, nh, true);
  wire([8 + W*.2, H*.18 + 5], [W*.3, H*.14 + nh/3]); wire([8 + W*.2, H*.62 + 5], [W*.3, H*.58 + nh/3]);
  // 視窗
  const vx = W*.56, vy = H*.08, vw = W*.41, vh = H*.84; g.fillStyle = "#9FA3A8"; g.fillRect(vx, vy, vw, vh); g.strokeStyle = "#111"; g.strokeRect(vx, vy, vw, vh);
  wire([W*.3 + nw, H*.14 + nh/3], [vx, vy + vh*.2]); wire([W*.3 + nw, H*.58 + nh/3], [vx, vy + vh*.7]);
  g.save(); g.beginPath(); g.rect(vx, vy, vw, vh); g.clip();
  const {P} = pds(vw, vh*.35, r, {rad: vw*.13}); g.strokeStyle = "#333"; g.lineWidth = 1; P.forEach(p => ring(g, vx + p[0], vy + p[1], vw*.065)); g.fillStyle = "#111"; P.forEach(p => dot(g, vx + p[0], vy + p[1], 1.2));
  g.strokeStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.moveTo(vx, vy + vh*.37); g.lineTo(vx + vw, vy + vh*.37); g.stroke();
  const S = pds3(r, .26, 90), sc = vw*.72, a = .6, prj = p => { const x = p[0]-.5, y = p[1]-.5, z = p[2]-.5; return [vx + vw/2 + (x*Math.cos(a) - y*Math.sin(a))*sc, vy + vh*.7 + (x*Math.sin(a) + y*Math.cos(a))*sc*.4 - z*sc*.55, x*Math.sin(a) + y*Math.cos(a)]; };
  S.map(prj).sort((p, q) => p[2]-q[2]).forEach(([x, y, d]) => { const R = vw*.055*(1 + d*.3), q = g.createRadialGradient(x - R*.35, y - R*.35, 0, x, y, R);
    q.addColorStop(0, "#fff"); q.addColorStop(1, U.rgba(c, .95)); g.fillStyle = q; dot(g, x, y, R); });
  g.restore();
};
CS["E02-11"].ratio = .75;

/* E02-12 玻璃纖維立體字：粗環字形內的 Poisson 起點，向外放射的纖維 */
CS["E02-12"] = function(g, W, H, r, c){
  const cx = W/2, cy = H/2, Ro = Math.min(W,H)*.34, Ri = Ro*.55, M = Math.min(W,H);
  const inside = (x, y) => { const d = Math.hypot((x-cx)*.85, y-cy); return (d < Ro && d > Ri) || (x > cx + Ri*.2 && x < cx + Ro*1.05 && Math.abs((y - cy) - (x - cx)*.9 - Ro*.3) < M*.05 && y > cy + Ri*.4 && y < cy + Ro*1.2); };
  const {P} = pds(W, H, r, {rad: M*.028, inside, seeds: [[cx, cy - (Ro+Ri)/2]]});
  g.save(); g.globalCompositeOperation = "lighter";
  P.forEach(p => { const dx = p[0]-cx, dy = p[1]-cy, l = Math.hypot(dx, dy) || 1, len = M*(.08 + r()*.22), ex = p[0] + dx/l*len + (r()-.5)*6, ey = p[1] + dy/l*len + (r()-.5)*6;
    const q = g.createLinearGradient(p[0], p[1], ex, ey); q.addColorStop(0, U.rgba(c, .7)); q.addColorStop(1, U.rgba(c, 0)); g.strokeStyle = q; g.lineWidth = 1.1; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(ex, ey); g.stroke();
    const b = p[0] - dx/l*len*.3, bb = p[1] - dy/l*len*.3; g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = .8; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(b, bb); g.stroke(); });
  g.fillStyle = "rgba(255,255,255,.9)"; P.forEach(p => dot(g, p[0], p[1], 1.3));
  g.restore();
};

Object.keys(CS).forEach(k => { ART.case[k] = CS[k]; });
})();
