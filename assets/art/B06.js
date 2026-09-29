/* B06 離散聚合（連接點規則生長）：基本生成器（變形與案例的獨立畫法由 gh-enrich 的 ART 單元補上） */
(function(){
const ART = window.ART, U = window.GENUTIL;

// 向量小工具（整數格點上的 3D）
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const neg = a => [-a[0], -a[1], -a[2]];
const mul = (M, p) => [0,1,2].map(i => M[i][0]*p[0] + M[i][1]*p[1] + M[i][2]*p[2]);
// 繞單位軸 n 轉 90°×k（Rodrigues，軸為座標軸，所以結果仍是整數）
const rot90 = (v, n, k) => { let r = v; for(let i = 0; i < k; i++){ const c = cross(n, r), d = n[0]*r[0]+n[1]*r[1]+n[2]*r[2]; r = c.map((x, j) => x + n[j]*d); } return r; };   // r' = n×r + n(n·r)

// 零件庫：與 C# 範例相同，I＝三格直條、L＝三格 L 形；接頭＝[面中心, 朝外法線, 面內 X 軸]
const LIB = [
  {cells:[[0,0,0],[1,0,0],[2,0,0]], conns:[[[-.5,0,0],[-1,0,0],[0,1,0]], [[2.5,0,0],[1,0,0],[0,1,0]], [[1,0,.5],[0,0,1],[0,1,0]], [[1,0,-.5],[0,0,-1],[0,1,0]]]},
  {cells:[[0,0,0],[1,0,0],[1,0,1]], conns:[[[-.5,0,0],[-1,0,0],[0,1,0]], [[1,0,1.5],[0,0,1],[0,1,0]], [[1.5,0,1],[1,0,0],[0,1,0]], [[0,-.5,0],[0,-1,0],[0,0,1]]]}
];

// 平面到平面：子接頭翻 180°（法線反向）、繞法線轉 rot×90°，再對齊到母接頭 → 回傳 (p)=>世界座標
function align(cc, tgt, rot){
  const zc = neg(cc[1]), xc = rot90(cc[2], zc, rot), yc = cross(zc, xc);   // 子框架（翻轉後）
  const zt = tgt[1], xt = tgt[2], yt = cross(zt, xt);                      // 母框架
  const R = [0,1,2].map(i => [0,1,2].map(j => xt[i]*xc[j] + yt[i]*yc[j] + zt[i]*zc[j]));
  const rp = mul(R, cc[0]), t = [tgt[0][0]-rp[0], tgt[0][1]-rp[1], tgt[0][2]-rp[2]];
  return { pt: p => { const q = mul(R, p); return [q[0]+t[0], q[1]+t[1], q[2]+t[2]]; }, dir: d => mul(R, d) };
}

U.GEN["B06"] = function(g, W, H, r, v, c){
  // 1. 參數：v 改變規則組、零件上限、邊界與吸引點
  const mode = v % 4, maxParts = 34 + (v % 3)*14, B = mode === 2 ? 3 : 5;
  const Zmax = mode === 1 ? 12 : 7;
  const attr = mode === 1 ? [0, 0, 12] : mode === 3 ? [5, -4, 1] : null;
  const typeOK = mode === 2 ? [0] : [0, 1];            // mode 2：只用直條 I，長成格架
  const occ = new Map(), key = p => p.map(Math.round).join(",");
  const parts = [], open = [], edges = [];
  const inBox = p => Math.abs(p[0]) <= B && Math.abs(p[1]) <= B && p[2] >= -0.1 && p[2] <= Zmax;
  const add = (type, X, used, parent) => {
    const id = parts.length, cells = LIB[type].cells.map(X.pt);
    cells.forEach(q => occ.set(key(q), id));
    const cen = cells.reduce((s, q) => [s[0]+q[0]/3, s[1]+q[1]/3, s[2]+q[2]/3], [0,0,0]);
    parts.push({type, cells, cen, parent});
    LIB[type].conns.forEach((cn, k) => { if(k !== used) open.push({part:id, conn:k, pl:[X.pt(cn[0]), X.dir(cn[1]), X.dir(cn[2])]}); });
  };
  // 2. 種子零件
  add(0, {pt: p => p.slice(), dir: d => d.slice()}, -1, -1);
  // 3. 迴圈：挑開放接頭 → 打亂可用規則 → 對齊 → 碰撞檢查
  let tries = 0;
  while(parts.length < maxParts && open.length && tries < 3000){
    let oi = Math.floor(r()*open.length);
    if(attr){ let bd = 1e9; for(let s = 0; s < 4; s++){ const i = Math.floor(r()*open.length), o = open[i].pl[0], d = Math.hypot(o[0]-attr[0], o[1]-attr[1], o[2]-attr[2]); if(d < bd){ bd = d; oi = i; } } }
    const o = open.splice(oi, 1)[0];
    const cand = [];
    for(const t of typeOK) LIB[t].conns.forEach((_, j) => [0,1,2,3].forEach(rot => cand.push([t, j, rot])));
    for(let i = cand.length-1; i > 0; i--){ const j = Math.floor(r()*(i+1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
    for(const [t, j, rot] of cand){
      tries++;
      const X = align(LIB[t].conns[j], o.pl, rot), cells = LIB[t].cells.map(X.pt);
      if(cells.every(q => inBox(q) && !occ.has(key(q)))){ add(t, X, j, o.part); edges.push([o.part, parts.length-1]); break; }
    }
  }
  // 4. 等角投影繪製：遠的立方體先畫；顏色依加入順序由深到淺
  const all = [];
  parts.forEach((p, i) => p.cells.forEach(q => all.push({q, i, t:p.type})));
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  const P = (x, y, z) => [(x - y)*0.866, (x + y)*0.5 - z];
  all.forEach(({q}) => { const s = P(q[0], q[1], q[2]); x0 = Math.min(x0, s[0]-1); x1 = Math.max(x1, s[0]+1); y0 = Math.min(y0, s[1]-1.2); y1 = Math.max(y1, s[1]+1.2); });
  const S = Math.min(W*.86/(x1-x0), H*.86/(y1-y0)), ox = W/2 - (x0+x1)/2*S, oy = H/2 - (y0+y1)/2*S;
  const T = (x, y, z) => { const s = P(x, y, z); return [ox + s[0]*S, oy + s[1]*S]; };
  // 地面陰影格
  g.strokeStyle = U.rgba(c, .10); g.lineWidth = 1;
  for(let k = -B; k <= B; k += 1){ g.beginPath(); g.moveTo(...T(k, -B-.5, -.5)); g.lineTo(...T(k, B+.5, -.5)); g.moveTo(...T(-B-.5, k, -.5)); g.lineTo(...T(B+.5, k, -.5)); g.stroke(); }
  all.sort((a, b) => (a.q[0]+a.q[1]+a.q[2]) - (b.q[0]+b.q[1]+b.q[2]) || a.q[2] - b.q[2]);
  const [cr, cg, cb] = U.rgb(c), n = parts.length;
  // 早加入的零件深、晚加入的淺；L 形零件混一點暖白，和直條 I 區分
  const shade = (i, f) => { const k = 0.25 + 0.75*(i/Math.max(1, n-1)), w = parts[i].type ? .28 : 0;
    const m = (x, tint) => Math.round(Math.min(255, ((x*(1-w) + tint*w)*k + 40*(1-k))*f)); return `rgb(${m(cr,255)},${m(cg,236)},${m(cb,200)})`; };
  const h = .47;
  for(const {q:[x,y,z], i} of all){  // 每格畫三個看得見的面
    const face = (pts, f) => { g.fillStyle = shade(i, f); U.poly(g, pts.map(p => T(...p)), true); g.fill(); g.strokeStyle = "rgba(10,10,14,.55)"; g.lineWidth = .8; g.stroke(); };
    face([[x-h,y-h,z+h],[x+h,y-h,z+h],[x+h,y+h,z+h],[x-h,y+h,z+h]], 1.15);   // 頂面
    face([[x+h,y-h,z+h],[x+h,y+h,z+h],[x+h,y+h,z-h],[x+h,y-h,z-h]], .8);     // +X 面
    face([[x-h,y+h,z+h],[x+h,y+h,z+h],[x+h,y+h,z-h],[x-h,y+h,z-h]], .6);     // +Y 面
  }
  // 連接圖（誰接誰）與剩餘開放接頭
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1;
  for(const [a, b] of edges){ g.beginPath(); g.moveTo(...T(...parts[a].cen)); g.lineTo(...T(...parts[b].cen)); g.stroke(); }
  g.fillStyle = "rgba(255,255,255,.9)";
  for(const p of parts){ const s = T(...p.cen); g.beginPath(); g.arc(s[0], s[1], 1.6, 0, U.TAU); g.fill(); }
  g.fillStyle = U.rgba("#FFD27A", .8);
  for(const o of open.slice(0, 60)){ const s = T(...o.pl[0]); g.beginPath(); g.arc(s[0], s[1], 1.4, 0, U.TAU); g.fill(); }
  if(attr){ const s = T(...attr); const gr = g.createRadialGradient(s[0], s[1], 0, s[0], s[1], S*3); gr.addColorStop(0, "rgba(255,210,122,.35)"); gr.addColorStop(1, "rgba(255,210,122,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
};

ART.var["B06"] = ART.var["B06"] || [];

/* ---------- 共用：簡化體素聚合＋等角繪製（給下面每張變形／案例共用，各自再疊加不同重點，構圖仍彼此不同） ---------- */
// 簡化聚合：由種子沿六方向生長；o.score 讓「挑最佳候選」取代單純隨機、o.blocked／o.accept 可排除格點
function growVox(r, o){
  const B = o.B ?? 4, Zmin = o.Zmin ?? 0, Zmax = o.Zmax ?? 6, n = o.n ?? 30;
  const key = p => p.join(","), idx = new Map(), cells = [], open = [], edges = [], seed = o.seed || [0, 0, 0];
  const dirs = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const ok = p => Math.abs(p[0]) <= B && Math.abs(p[1]) <= B && p[2] >= Zmin && p[2] <= Zmax && !idx.has(key(p)) && (!o.blocked || !o.blocked(p)) && (!o.accept || o.accept(p));
  cells.push(seed); idx.set(key(seed), 0);
  dirs.forEach(d => open.push([0, d]));
  let tries = 0;
  while(cells.length < n && open.length && tries < 6000){
    tries++;
    let oi = (r()*open.length)|0;
    if(o.score){ let best = -1e18;
      for(let t = 0; t < Math.min(6, open.length); t++){ const i = (r()*open.length)|0, [pi, d] = open[i], f = cells[pi], p = [f[0]+d[0], f[1]+d[1], f[2]+d[2]], s = o.score(p); if(s > best){ best = s; oi = i; } }
    }
    const [pi, d] = open.splice(oi, 1)[0], f = cells[pi], p = [f[0]+d[0], f[1]+d[1], f[2]+d[2]];
    if(!ok(p)) continue;
    const ci = cells.length; idx.set(key(p), ci); cells.push(p); edges.push([pi, ci]);
    dirs.forEach(d2 => { const q = [p[0]+d2[0], p[1]+d2[1], p[2]+d2[2]]; if(ok(q)) open.push([ci, d2]); });
  }
  return { cells, edges, open, idx };
}
// 等角投影：依所有給定格點自動置中縮放，回傳 T(x,y,z)→畫布座標
function isoFit(pts, W, H, mgn){
  const Pj = (x, y, z) => [(x - y)*0.866, (x + y)*0.5 - z];
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  pts.forEach(([x,y,z]) => { const s = Pj(x,y,z); x0 = Math.min(x0, s[0]-1); x1 = Math.max(x1, s[0]+1); y0 = Math.min(y0, s[1]-1.3); y1 = Math.max(y1, s[1]+1.3); });
  const S = Math.min(W*(mgn||.84)/Math.max(1e-6, x1-x0), H*(mgn||.84)/Math.max(1e-6, y1-y0)), ox = W/2 - (x0+x1)/2*S, oy = H/2 - (y0+y1)/2*S;
  return (x, y, z) => { const s = Pj(x, y, z); return [ox + s[0]*S, oy + s[1]*S]; };
}
// 一顆等角立方體（頂／+X／+Y 三面）
function isoCube(g, T, x, y, z, hx, hy, hz, rgb, f, a){
  const [cr,cg,cb] = rgb, m = (k, ff) => Math.min(255, Math.round(k*ff*(f??1)));
  const face = (pts, ff) => { g.fillStyle = `rgba(${m(cr,ff)},${m(cg,ff)},${m(cb,ff)},${a??1})`; U.poly(g, pts.map(p => T(...p)), true); g.fill(); g.strokeStyle = "rgba(8,8,12,.5)"; g.lineWidth = .8; g.stroke(); };
  face([[x-hx,y-hy,z+hz],[x+hx,y-hy,z+hz],[x+hx,y+hy,z+hz],[x-hx,y+hy,z+hz]], 1.15);
  face([[x+hx,y-hy,z+hz],[x+hx,y+hy,z+hz],[x+hx,y+hy,z-hz],[x+hx,y-hy,z-hz]], .78);
  face([[x-hx,y+hy,z+hz],[x+hx,y+hy,z+hz],[x+hx,y+hy,z-hz],[x-hx,y+hy,z-hz]], .58);
}
// 地面格線
function isoGround(g, T, B, c, a){
  g.strokeStyle = U.rgba(c, a??.09); g.lineWidth = 1;
  for(let k = -B; k <= B; k++){ g.beginPath(); g.moveTo(...T(k,-B-.5,-.5)); g.lineTo(...T(k,B+.5,-.5)); g.moveTo(...T(-B-.5,k,-.5)); g.lineTo(...T(B+.5,k,-.5)); g.stroke(); }
}

/* ============ 變形 V1–V12（索引 0–11） ============ */

// V1｜自訂 Rhino 幾何零件：同一次聚合裡混用三種不同外形的零件（不再只有方塊），左上角另附零件庫樣本
ART.var["B06"][0] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), { cells } = growVox(r, { B:3, Zmax:5, n:24 });
  const shapes = [[.47,.47,.47],[.62,.28,.3],[.3,.3,.6]];
  const T = isoFit(cells.concat([[-3,-3,-1],[3,3,6]]), W, H*.9);
  isoGround(g, T, 3, c);
  cells.forEach((p,i) => { const sh = shapes[i%3]; isoCube(g, T, p[0],p[1],p[2], sh[0],sh[1],sh[2], rgb, .55+.45*i/cells.length); });
  const T2 = isoFit([[-.3,-.3,-.3],[3.6,1.2,1.6]], W*.34, H*.24, .88);
  shapes.forEach((sh,i) => isoCube(g, T2, i*1.3, 0, sh[2], sh[0],sh[1],sh[2], rgb, .95));
};

// V2｜任意 Brep 邊界與障礙物：不規則邊界輪廓內生長，繞開兩根障礙柱
ART.var["B06"][1] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), nz = U.vnoise(5), B = 4;
  const rad = a => 3.1 + nz(Math.cos(a)*2+3, Math.sin(a)*2+3)*1.4;
  const inBoundary = (x,y) => Math.hypot(x,y) < rad(Math.atan2(y,x));
  const cols = [[-1.6,1.2],[1.8,-1.4]];
  const blocked = p => !inBoundary(p[0],p[1]) || cols.some(([cx,cy]) => Math.hypot(p[0]-cx,p[1]-cy) < .6);
  const { cells } = growVox(r, { B, Zmax:6, n:26, blocked });
  const T = isoFit(cells.concat([[-B,-B,-1],[B,B,7]]), W, H*.9);
  g.strokeStyle = U.rgba(c,.4); g.lineWidth = 1.4; g.beginPath();
  let started = false;
  for(let a=0;a<=U.TAU+.01;a+=U.TAU/48){ const rr=rad(a), p=T(Math.cos(a)*rr, Math.sin(a)*rr, -.5); started?g.lineTo(...p):g.moveTo(...p); started=true; }
  g.stroke();
  cols.forEach(([cx,cy]) => { for(let z=0;z<6;z++) isoCube(g,T,cx,cy,z,.32,.32,.5,[150,150,158], .55+.03*z, .85); });
  cells.forEach((p,i) => isoCube(g, T, p[0],p[1],p[2], .46,.46,.46, rgb, .5+.5*i/cells.length));
};

// V3｜接頭型別與相容表：開放接頭依公（三角）／母（圓環）／封口（方塊）三種型別標記，右上角附小圖例
ART.var["B06"][2] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), { cells, open } = growVox(r, { B:3, Zmax:5, n:20 });
  const T = isoFit(cells.concat([[-3,-3,-1],[3,3,6]]), W, H*.9);
  isoGround(g, T, 3, c);
  cells.forEach((p,i) => isoCube(g, T, p[0],p[1],p[2], .46,.46,.46, rgb, .5+.5*i/cells.length));
  const iconAt = (P, ty, s) => {
    if(ty===0){ g.fillStyle="#7EC8FF"; g.beginPath(); g.moveTo(P[0],P[1]-s); g.lineTo(P[0]+s,P[1]+s*.6); g.lineTo(P[0]-s,P[1]+s*.6); g.closePath(); g.fill(); }
    else if(ty===1){ g.strokeStyle="#FFA35C"; g.lineWidth=1.4; g.beginPath(); g.arc(P[0],P[1],s,0,U.TAU); g.stroke(); }
    else { g.fillStyle="rgba(220,220,228,.85)"; g.fillRect(P[0]-s*.8,P[1]-s*.8,s*1.6,s*1.6); }
  };
  open.slice(0,40).forEach((o,i) => { const f=cells[o[0]], wp=[f[0]+o[1][0]*.5, f[1]+o[1][1]*.5, f[2]+o[1][2]*.5]; iconAt(T(...wp), i%3, 3.2); });
  [0,1,2].forEach((ty,i) => iconAt([16, 16+i*14], ty, 3.4));
};

// V4｜45° 斜接零件庫：正立面。四種梁段（直線／45°／90°／135°）在 8 方向格網上聚合，
// 每次從開放端點挑一種零件接上，碰到已用過的桿件、交叉斜撐或出界就拒絕，長成柱＋梁＋斜撐混合的連續構架；
// 後方淡色一層是錯縫的第二層板，底部一列是零件庫
ART.var["B06"][3] = function(g, W, H, r, c, U){
  const nx = 8, ny = 8, D8 = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  const LIB = [[0], [0, 1], [0, 2], [0, 3]];          // 零件＝相對轉角序列：直線、45°、90°、135°
  function grow(seedR){
    const rr = U.mk(seedR), edges = [], used = new Set(), deg = new Map(), open = [];
    const ek = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? a + "|" + b : b + "|" + a;
    const nk = p => p[0] + "," + p[1];
    [[0, 0], [3, 0], [5, 0], [nx, 0]].forEach(p => open.push({ p, d: 2 }));
    for(let t = 0; t < 2400 && edges.length < 40 && open.length; t++){
      const oi = (rr()*open.length)|0, o = open[oi], type = (rr()*4)|0, sgn = rr() < .5 ? 1 : -1;
      let p = o.p, d = o.d, seg = [], ok = true;
      for(const turn of LIB[type].map((v, i) => i ? v*sgn : 0)){
        d = (d + turn + 8) % 8; const q = [p[0] + D8[d][0], p[1] + D8[d][1]];
        if(q[0] < 0 || q[0] > nx || q[1] < 0 || q[1] > ny || D8[d][1] < 0){ ok = false; break; }   // 出界或往下長
        const e = ek(p, q); if(used.has(e)){ ok = false; break; }
        if(D8[d][0] && D8[d][1] && used.has(ek([p[0], q[1]], [q[0], p[1]]))){ ok = false; break; } // 同一格的交叉斜撐
        if((deg.get(nk(q)) || 0) >= 3){ ok = false; break; }
        seg.push([p, q]); p = q;
      }
      if(!ok || !seg.length){ if(rr() < .06) open.splice(oi, 1); continue; }
      seg.forEach(([a, b]) => { used.add(ek(a, b)); deg.set(nk(a), (deg.get(nk(a)) || 0) + 1); deg.set(nk(b), (deg.get(nk(b)) || 0) + 1); });
      edges.push({ seg, type });
      open.push({ p, d }); if(rr() < .5) open.push({ p, d: (d + (rr() < .5 ? 2 : 6)) % 8 });
    }
    return edges;
  }
  const L = Math.min(W*.86/nx, H*.7/ny), ox = (W - nx*L)/2 - L*.15, oy = H*.8;
  const Pt = (p, dx, dy) => [ox + p[0]*L + (dx||0), oy - p[1]*L + (dy||0)];
  const tint = [1, .82, .66, 1.2], rgb = U.rgb(c);
  const col = (k, a) => `rgba(${Math.min(255, rgb[0]*tint[k]|0)},${Math.min(255, rgb[1]*tint[k]|0)},${Math.min(255, rgb[2]*tint[k]|0)},${a})`;
  const drawLayer = (edges, dx, dy, alpha, wid) => {
    g.lineCap = "square";
    edges.forEach(({ seg, type }) => seg.forEach(([a, b]) => {
      g.strokeStyle = col(type, alpha); g.lineWidth = wid; g.beginPath(); g.moveTo(...Pt(a, dx, dy)); g.lineTo(...Pt(b, dx, dy)); g.stroke();
      g.strokeStyle = `rgba(10,10,14,${alpha*.6})`; g.lineWidth = 1; g.beginPath(); g.moveTo(...Pt(a, dx, dy)); g.lineTo(...Pt(b, dx, dy)); g.stroke(); }));
  };
  // 地面
  g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(0, oy + L*.12, W, H - oy); g.strokeStyle = U.rgba(c, .4); g.lineWidth = 1; g.beginPath(); g.moveTo(0, oy + L*.12); g.lineTo(W, oy + L*.12); g.stroke();
  // 後層（錯縫）與前層
  const seed = (r()*1e6)|0, back = grow(seed + 7), front = grow(seed);
  drawLayer(back, L*.34, -L*.24, .34, L*.26);
  drawLayer(front, 0, 0, .95, L*.3);
  // 節點螺栓
  const nodes = new Set(); front.forEach(({ seg }) => seg.forEach(([a, b]) => { nodes.add(a + ""); nodes.add(b + ""); }));
  nodes.forEach(s => { const p = s.split(",").map(Number), q = Pt(p); g.fillStyle = "rgba(18,18,24,.95)"; g.beginPath(); g.arc(q[0], q[1], L*.09, 0, U.TAU); g.fill(); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1; g.stroke(); });
  // 零件庫：四種梁段縮圖
  const s = L*.42, ly = H - s*1.1;
  LIB.forEach((turns, k) => { let p = [W*.14 + k*W*.2, ly], d = 0;
    g.strokeStyle = col(k, 1); g.lineWidth = s*.34; g.lineCap = "square"; g.beginPath(); g.moveTo(...p);
    turns.forEach((tv, i) => { d = (d + (i ? tv : 0)) % 8; p = [p[0] + D8[d][0]*s*(D8[d][0] && D8[d][1] ? .72 : 1), p[1] - D8[d][1]*s*(D8[d][0] && D8[d][1] ? .72 : 1)]; g.lineTo(...p); });
    if(turns.length === 1){ p = [p[0] + s, p[1]]; g.lineTo(...p); }
    g.stroke(); });
};
ART.var["B06"][3].ratio = 1.1;

// V5｜場驅動聚合：每步從候選中挑場值最高者，地面疊上場的強弱格
ART.var["B06"][4] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), nz = U.vnoise(21), B=4;
  const score = p => nz(p[0]*.35+10, p[1]*.35+4) + p[2]*.02;
  const { cells } = growVox(r, { B, Zmax:6, n:26, score });
  const T = isoFit(cells.concat([[-B,-B,-1],[B,B,7]]), W, H*.9);
  for(let x=-B;x<=B;x++) for(let y=-B;y<=B;y++){ const s=nz(x*.35+10,y*.35+4); g.fillStyle=U.rgba(c, s*.25);
    U.poly(g, [T(x-.5,y-.5,-.5),T(x+.5,y-.5,-.5),T(x+.5,y+.5,-.5),T(x-.5,y+.5,-.5)], true); g.fill(); }
  cells.forEach((p,i) => { const s = nz(p[0]*.35+10, p[1]*.35+4); isoCube(g, T, p[0],p[1],p[2], .46,.46,.46, rgb, .4+s*1.1); });
};

// V6｜閉合迴圈：前緣接頭對接後從樹變成網，額外的迴圈邊以粗橘線標出
ART.var["B06"][5] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), B=2, { cells, edges, idx } = growVox(r, { B, Zmax:3, n:28 });
  const T = isoFit(cells.concat([[-B,-B,-1],[B,B,4]]), W, H*.9);
  isoGround(g, T, B, c);
  cells.forEach((p,i) => isoCube(g, T, p[0],p[1],p[2], .44,.44,.44, rgb, .5+.5*i/cells.length, .92));
  const treeSet = new Set(edges.map(([a,b])=>a+"-"+b));
  const dirs=[[1,0,0],[0,1,0],[0,0,1]], loops=[];
  cells.forEach((p,i) => dirs.forEach(d => { const q=[p[0]+d[0],p[1]+d[1],p[2]+d[2]], j=idx.get(q.join(",")); if(j!==undefined && !treeSet.has(i+"-"+j) && !treeSet.has(j+"-"+i)) loops.push([i,j]); }));
  g.strokeStyle="rgba(255,255,255,.5)"; g.lineWidth=1;
  edges.forEach(([a,b]) => { g.beginPath(); g.moveTo(...T(...cells[a])); g.lineTo(...T(...cells[b])); g.stroke(); });
  g.strokeStyle="#FF9A4D"; g.lineWidth=2.4;
  loops.forEach(([a,b]) => { g.beginPath(); g.moveTo(...T(...cells[a])); g.lineTo(...T(...cells[b])); g.stroke(); });
  g.fillStyle="rgba(255,255,255,.9)";
  cells.forEach(p => { const s=T(...p); g.beginPath(); g.arc(s[0],s[1],1.6,0,U.TAU); g.fill(); });
};

// V7｜階層聚合：小單元先組成一個群組零件（半透明外框），群組零件再彼此接起來
ART.var["B06"][6] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c);
  const unit = growVox(r, { B:1, Zmax:1, n:5 }).cells;
  const ux0=Math.min(...unit.map(p=>p[0])), ux1=Math.max(...unit.map(p=>p[0]));
  const uy0=Math.min(...unit.map(p=>p[1])), uy1=Math.max(...unit.map(p=>p[1]));
  const uz0=Math.min(...unit.map(p=>p[2])), uz1=Math.max(...unit.map(p=>p[2]));
  const hx=(ux1-ux0)/2+.5, hy=(uy1-uy0)/2+.5, hz=(uz1-uz0)/2+.5, cxu=(ux0+ux1)/2, cyu=(uy0+uy1)/2, czu=(uz0+uz1)/2;
  const step = Math.max(hx,hy,hz)*2+.8;
  const { cells: rooms, edges } = growVox(r, { B:3, Zmax:4, n:6 });
  const scaled = rooms.map(p => [p[0]*step, p[1]*step, p[2]*step]);
  const bpts = scaled.flatMap(p => [[p[0]-hx-1,p[1]-hy-1,p[2]-hz-1],[p[0]+hx+1,p[1]+hy+1,p[2]+hz+1]]);
  const T = isoFit(bpts, W, H*.9);
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.4;
  edges.forEach(([a,b]) => { g.beginPath(); g.moveTo(...T(...scaled[a])); g.lineTo(...T(...scaled[b])); g.stroke(); });
  scaled.forEach((cp,ri) => {
    isoCube(g, T, cp[0],cp[1],cp[2], hx+.4, hy+.4, hz+.4, rgb, .3, .14);
    unit.forEach(u => isoCube(g, T, cp[0]+u[0]-cxu, cp[1]+u[1]-cyu, cp[2]+u[2]-czu, .42,.42,.42, rgb, .55+.4*ri/scaled.length));
  });
};

// V8｜重心與懸挑檢查：從支撐塊向外懸挑，超出穩定範圍的候選以紅色鬼影標出並回退，中心以紅十字標記重心
ART.var["B06"][7] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), base = [];
  for(let x=-2;x<=0;x++) for(let y=-1;y<=1;y++) base.push([x,y,0]);
  let cells = base.slice(), rejected = [];
  const centroid = arr => arr.reduce((s,p)=>[s[0]+p[0]/arr.length,s[1]+p[1]/arr.length,s[2]+p[2]/arr.length],[0,0,0]);
  let x = 1, z = 0;
  for(let i=0;i<9;i++){
    const cand = [x, 0, z], test = cells.concat([cand]), cg = centroid(test);
    if(cg[0] < .9){ cells.push(cand); } else { rejected.push(cand); if(rejected.length>2) break; }
    x++; if(i===5){ z=1; x=3; }
  }
  const T = isoFit(cells.concat(rejected).concat([[-2.6,-1.6,-.6],[6,1.6,2]]), W, H*.86);
  isoGround(g, T, 3, c);
  cells.forEach((p,i) => isoCube(g, T, p[0],p[1],p[2], .46,.46,.46, rgb, p[0]<=0? .55 : .5+.45*(i/cells.length), .95));
  rejected.forEach(p => isoCube(g, T, p[0],p[1],p[2], .46,.46,.46, [220,70,70], .8, .3));
  const cg = centroid(cells), s = T(...cg);
  g.strokeStyle = "#FF5C5C"; g.lineWidth = 1; g.beginPath(); g.moveTo(s[0]-6,s[1]); g.lineTo(s[0]+6,s[1]); g.moveTo(s[0],s[1]-6); g.lineTo(s[0],s[1]+6); g.stroke();
  g.fillStyle = "rgba(255,92,92,.9)"; g.beginPath(); g.arc(s[0],s[1],2.2,0,U.TAU); g.fill();
  const pv = T(0, 0, -.5); g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.moveTo(pv[0]-6,pv[1]+8); g.lineTo(pv[0]+6,pv[1]+8); g.lineTo(pv[0],pv[1]-2); g.closePath(); g.fill();
};
ART.var["B06"][7].ratio = .85;

// V9｜密度場導引：只在密度高於門檻處生長，地面疊上密度條紋，形體像沿受力路徑集中的骨架
ART.var["B06"][8] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), nz = U.vnoise(44), B=4;
  const density = p => Math.max(0, nz(p[0]*.3+2, p[2]*.3+8) * (1 - Math.abs(p[1])/(B+1)));
  const accept = p => density(p) > .32, score = p => density(p) + p[0]*.01;
  const { cells } = growVox(r, { B, Zmax:7, n:34, accept, score, seed:[-B,0,1] });
  const T = isoFit(cells.concat([[-B,-2,-1],[B,2,8]]), W, H*.9);
  for(let x=-B;x<=B;x++) for(let z=0;z<=7;z++){ const d=density([x,0,z]); if(d<.05) continue; g.fillStyle=U.rgba(c, d*.35);
    U.poly(g,[T(x-.5,-2,z-.5),T(x+.5,-2,z-.5),T(x+.5,-2,z+.5),T(x-.5,-2,z+.5)],true); g.fill(); }
  cells.forEach(p => isoCube(g, T, p[0],p[1],p[2], .44,.44,.44, rgb, .4+density(p)*.9));
};

// V10｜Timer 逐件生長動畫：立方體依加入順序由深轉暖，尚未接上的前緣接頭以箭頭標出
ART.var["B06"][9] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), B=3, { cells, open } = growVox(r, { B, Zmax:5, n:24 });
  const T = isoFit(cells.concat([[-B,-B,-1],[B,B,6]]), W, H*.9);
  isoGround(g, T, B, c, .06);
  cells.forEach((p,i) => { const t=cells.length>1?i/(cells.length-1):0, col=[rgb[0]*(1-t)+255*t*.3, rgb[1]*(.6+t*.3), rgb[2]*(1-t)+255*t];
    isoCube(g, T, p[0],p[1],p[2], .45,.45,.45, col, .55+.4*t, .95); });
  g.fillStyle="#FFD27A";
  open.slice(0,30).forEach(o => { const f=cells[o[0]], p=[f[0]+o[1][0]*.55,f[1]+o[1][1]*.55,f[2]+o[1][2]*.55], s=T(...p), s0=T(...f), ang=Math.atan2(s[1]-s0[1], s[0]-s0[0]);
    g.save(); g.translate(s[0],s[1]); g.rotate(ang); g.beginPath(); g.moveTo(5,0); g.lineTo(-3,2.6); g.lineTo(-3,-2.6); g.closePath(); g.fill(); g.restore(); });
};

// V11｜組裝順序與機械手臂取放平面：立方體旁標出加入序號，簡化機械手臂正取放最後一個零件
ART.var["B06"][10] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), B=3, { cells } = growVox(r, { B, Zmax:5, n:14 });
  const T = isoFit(cells.concat([[-B,-B,-1],[B,B,6]]), W, H*.9);
  isoGround(g, T, B, c, .06);
  cells.forEach((p,i) => isoCube(g, T, p[0],p[1],p[2], .44,.44,.44, rgb, .4+.5*i/cells.length, .95));
  g.fillStyle="rgba(255,255,255,.55)"; g.font="9px sans-serif"; g.textAlign="center"; g.textBaseline="middle";
  cells.forEach((p,i) => { const s=T(...p); g.fillText(String(i+1), s[0], s[1]-9); });
  const last = cells[cells.length-1], s = T(...last), baseP = T(B+1.2, 0, 0);
  g.strokeStyle = "rgba(230,230,236,.85)"; g.lineWidth = 3; g.lineCap="round";
  const mid = [(baseP[0]+s[0])/2, Math.min(baseP[1], s[1]) - 26];
  g.beginPath(); g.moveTo(...baseP); g.lineTo(...mid); g.lineTo(...s); g.stroke();
  g.fillStyle="rgba(230,230,236,.9)"; g.beginPath(); g.arc(baseP[0],baseP[1],5,0,U.TAU); g.fill();
  g.fillStyle="#FFD27A"; g.beginPath(); g.arc(s[0],s[1],3,0,U.TAU); g.fill();
  g.setLineDash([3,3]); g.strokeStyle=U.rgba(c,.5); g.lineWidth=1; g.beginPath(); g.moveTo(...mid); g.lineTo(s[0], s[1]-18); g.stroke(); g.setLineDash([]);
};

// V12｜板材化：立方體零件攤平成合板裁切件，排版於 XY 平面並標出螺栓孔與數量統計
ART.var["B06"][11] = function(g, W, H, r, c, U){
  const cols=5, rows=4, pw=Math.min(W,H)*.14, gap=pw*.22, ox=(W-(cols*(pw+gap)-gap))/2, oy=(H-(rows*(pw+gap)-gap))/2;
  let k=0;
  for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){
    const x=ox+i*(pw+gap), y=oy+j*(pw+gap), isL = (i+j)%3===0, w=isL?pw*.6:pw, h=pw;
    g.fillStyle = U.rgba(c, .18 + (k%7)*.02); g.strokeStyle = U.rgba(c,.85); g.lineWidth=1.4;
    g.beginPath(); g.rect(x,y,w,h); g.fill(); g.stroke();
    g.fillStyle="rgba(18,18,22,.9)";
    [[x+6,y+6],[x+w-6,y+6],[x+6,y+h-6],[x+w-6,y+h-6]].forEach(([hx,hy]) => { g.beginPath(); g.arc(hx,hy,2,0,U.TAU); g.fill(); });
    k++;
  }
  g.fillStyle=U.rgba(c,.5); for(let i=0;i<14;i++) g.fillRect(ox+i*7, H*.94, 4,4);
  g.fillStyle="rgba(220,220,228,.5)"; for(let i=0;i<6;i++) g.fillRect(ox+i*7, H*.97, 4,4);
};
ART.var["B06"][11].ratio = .8;

/* ============ 沒有照片的案例 ============ */

// B06-01｜Wasp：地面疊場、線框零件＋節點，強調外掛的「連接圖」與建模介面感
ART.case["B06-01"] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), nz = U.vnoise(63), B=3;
  const score = p => nz(p[0]*.4+6,p[1]*.4+2);
  const { cells, edges } = growVox(r, { B, Zmax:5, n:20, score });
  const T = isoFit(cells.concat([[-B,-B,-1],[B,B,6]]), W, H*.9);
  for(let x=-B;x<=B;x++) for(let y=-B;y<=B;y++){ const s=nz(x*.4+6,y*.4+2); g.fillStyle=U.rgba(c, s*.22);
    U.poly(g,[T(x-.5,y-.5,-.5),T(x+.5,y-.5,-.5),T(x+.5,y+.5,-.5),T(x-.5,y+.5,-.5)],true); g.fill(); }
  g.strokeStyle="rgba(255,255,255,.55)"; g.lineWidth=1;
  edges.forEach(([a,b]) => { g.beginPath(); g.moveTo(...T(...cells[a])); g.lineTo(...T(...cells[b])); g.stroke(); });
  cells.forEach((p,i) => {
    const hx=.4+(i%3)*.06, hy=.4, hz=.4-(i%2)*.1;
    g.strokeStyle = U.rgba(c, .5+.5*i/cells.length); g.lineWidth=1.2;
    U.poly(g, [[p[0]-hx,p[1]-hy,p[2]+hz],[p[0]+hx,p[1]-hy,p[2]+hz],[p[0]+hx,p[1]+hy,p[2]+hz],[p[0]-hx,p[1]+hy,p[2]+hz]].map(q=>T(...q)), true); g.stroke();
    const s=T(...p); g.fillStyle="rgba(255,255,255,.85)"; g.beginPath(); g.arc(s[0],s[1],1.6,0,U.TAU); g.fill();
  });
};

// B06-02｜Tallinn Architecture Biennale Pavilion：合板色斜接梁段組出弧形懸挑量體
ART.case["B06-02"] = function(g, W, H, r, c, U){
  const tan = "#C9A467", L = Math.min(W,H)*.1, cx=W*.28, cy=H*.78;
  const angles=[0,-Math.PI/4,-Math.PI/2,-Math.PI/2-Math.PI/4,-Math.PI, Math.PI/2+Math.PI/4, Math.PI/2, Math.PI/4];
  let pos=[cx,cy], segs=[], ang=-Math.PI/2;
  for(let i=0;i<22;i++){
    const opts = angles.slice().sort((a,b)=>Math.abs(((a-ang+Math.PI*3)%(Math.PI*2))-Math.PI)-Math.abs(((b-ang+Math.PI*3)%(Math.PI*2))-Math.PI));
    let a = opts[(r()*3)|0];
    if(i > 14) a = a - Math.PI*.12*(i-14);
    const np=[pos[0]+Math.cos(a)*L, pos[1]+Math.sin(a)*L];
    segs.push([pos.slice(), np.slice()]); pos=np; ang=a;
    if(np[1] > H*.92 || np[0] > W*.94) break;
  }
  const gr=g.createRadialGradient(cx,H*.86,10,cx,H*.86,L*6); gr.addColorStop(0,U.rgba(c,.12)); gr.addColorStop(1,U.rgba(c,0)); g.fillStyle=gr; g.fillRect(0,0,W,H);
  g.strokeStyle = "rgba(140,170,120,.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0,H*.9); g.lineTo(W,H*.9); g.stroke();
  g.lineCap="round";
  segs.forEach(([a,b],i) => { g.strokeStyle = i%2? tan : "#B08A52"; g.lineWidth = L*.32; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
    g.strokeStyle="rgba(20,16,10,.5)"; g.lineWidth=1.2; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); });
  g.fillStyle="rgba(30,24,16,.7)"; segs.forEach(([,b]) => { g.beginPath(); g.arc(b[0],b[1], L*.09, 0, U.TAU); g.fill(); });
};
ART.case["B06-02"].ratio = 1.15;

// B06-03｜Combinatorial Nest：A 字形單元排列成起伏的展館剖影，右上附遊戲骰子意象
ART.case["B06-03"] = function(g, W, H, r, c, U){
  const n=7, baseW=Math.min(W,H)*.16, apex=baseW*1.1, cx0 = W*.5-(n*baseW*.62)/2, gy = H*.82;
  for(let i=0;i<n;i++){
    const x = cx0 + i*baseW*.62, sway = Math.sin(i*1.3)*baseW*.12, h = apex*(.75 + .05*Math.sin(i*.9+1));
    g.fillStyle = U.rgba(c, .35 + .45*(i/n));
    const tri = [[x, gy],[x+baseW*.5+sway, gy-h],[x+baseW, gy]];
    U.poly(g, tri, true); g.fill();
    g.strokeStyle="rgba(10,10,14,.55)"; g.lineWidth=1.2; U.poly(g, tri, true); g.stroke();
    g.strokeStyle="rgba(255,255,255,.3)"; g.lineWidth=1; g.beginPath(); g.moveTo(x+baseW*.5+sway, gy-h); g.lineTo(x+baseW*.5+sway, gy-h*.15); g.stroke();
  }
  g.strokeStyle=U.rgba(c,.3); g.lineWidth=1.4; g.beginPath(); g.moveTo(0,gy); g.lineTo(W,gy); g.stroke();
  const dx=W*.86, dy=H*.16, ds=Math.min(W,H)*.075;
  g.fillStyle="rgba(235,235,240,.92)"; g.strokeStyle="rgba(10,10,14,.5)"; g.lineWidth=1.2;
  g.beginPath(); g.rect(dx-ds/2, dy-ds/2, ds, ds); g.fill(); g.stroke();
  g.fillStyle="rgba(20,20,24,.85)";
  [[dx,dy],[dx-ds*.25,dy-ds*.25],[dx+ds*.25,dy+ds*.25],[dx-ds*.25,dy+ds*.25],[dx+ds*.25,dy-ds*.25]].forEach(([px,py]) => { g.beginPath(); g.arc(px,py, ds*.07,0,U.TAU); g.fill(); });
};
ART.case["B06-03"].ratio = .95;

// B06-04｜Assembler：確定性評分聚合，落選候選以半透明灰標出，被遮擋接頭加灰蓋
ART.case["B06-04"] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), B=3, nz = U.vnoise(81);
  const score = p => p[2]*.5 + nz(p[0]*.3+9, p[1]*.3+1)*.6;
  const { cells, open } = growVox(r, { B, Zmax:5, n:20, score });
  const T = isoFit(cells.concat([[-B,-B,-1],[B,B,6]]), W, H*.9);
  isoGround(g, T, B, c, .06);
  cells.forEach((p,i) => isoCube(g, T, p[0],p[1],p[2], .45,.45,.45, rgb, .45+.5*i/cells.length, .95));
  cells.forEach((p,i) => { if(i===0) return; const gp=[p[0]+(r()<.5?1:-1), p[1], p[2]]; isoCube(g, T, gp[0],gp[1],gp[2], .4,.4,.4, [160,160,168], .4, .16); });
  g.fillStyle="rgba(170,170,178,.8)";
  open.slice(0,10).forEach(o => { const f=cells[o[0]], p=[f[0]+o[1][0],f[1]+o[1][1],f[2]+o[1][2]], s=T(...p); g.beginPath(); g.arc(s[0],s[1],2,0,U.TAU); g.fill(); });
};

// B06-05｜Aggregated Structures：密度場門檻導引成兩端支撐的橋形，以完整色階（藍→黃→紅）表示材料密度／應力
ART.case["B06-05"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(97), B=5;
  const density = p => { const span = Math.max(0, 1 - Math.abs(p[0])/(B+1)), dip = Math.abs(p[1]) < 1 ? 1 : .4; return Math.max(0, (nz(p[0]*.25+3, p[2]*.25+5)*.6 + span*.5)) * dip; };
  const accept = p => density(p) > .35, score = p => density(p);
  const { cells } = growVox(r, { B, Zmin:0, Zmax:3, n:34, accept, score, seed:[-B,0,0] });
  const T = isoFit(cells.concat([[-B,-2,-1],[B,2,4]]), W, H*.86);
  const heat = t => { const stops=[[40,70,180],[40,170,170],[210,200,60],[220,90,40]], k=t*(stops.length-1), i=Math.min(stops.length-2, Math.floor(k)), f=k-i, a=stops[i], b=stops[i+1]; return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f]; };
  cells.forEach(p => { const t=Math.min(1, density(p)); isoCube(g, T, p[0],p[1],p[2], .44,.44,.44, heat(t), 1, .95); });
  [[-B,0,-.6],[B,0,-.6]].forEach(sp => { const s=T(...sp); g.fillStyle="rgba(200,200,206,.85)"; g.beginPath(); g.moveTo(s[0]-9,s[1]+10); g.lineTo(s[0]+9,s[1]+10); g.lineTo(s[0],s[1]-4); g.closePath(); g.fill(); });
  const bx=W*.06, by0=H*.18, by1=H*.7;
  for(let i=0;i<20;i++){ const t=i/19, col=heat(t); g.fillStyle=`rgb(${col[0]|0},${col[1]|0},${col[2]|0})`; g.fillRect(bx, by1-(by1-by0)*t, 8, (by1-by0)/19+1); }
};
ART.case["B06-05"].ratio = .85;

// B06-06｜Collaborative Assembly of Digital Materials：機械手臂取放，扇形可達範圍與虛線路徑
ART.case["B06-06"] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), B=3, { cells } = growVox(r, { B, Zmax:5, n:16 });
  const T = isoFit(cells.concat([[-B,-B,-1],[B,B,6]]), W*.82, H*.9);
  g.save(); g.translate(W*.06, 0);
  isoGround(g, T, B, c, .06);
  cells.forEach((p,i) => { isoCube(g, T, p[0],p[1],p[2], .44,.44,.44, rgb, .45+.5*i/cells.length, .95);
    const s=T(...p); g.strokeStyle="rgba(255,255,255,.18)"; g.lineWidth=.8; g.beginPath(); g.moveTo(s[0]-6,s[1]+2); g.lineTo(s[0]+6,s[1]-2); g.stroke(); });
  const last = cells[cells.length-1], s = T(...last), track = T(B+1.4, 0, -.4);
  g.fillStyle = U.rgba(c,.08); g.beginPath(); g.moveTo(...track); g.arc(track[0],track[1], Math.hypot(s[0]-track[0],s[1]-track[1])*1.15, Math.PI*1.15, Math.PI*1.85); g.closePath(); g.fill();
  g.strokeStyle="rgba(230,230,236,.85)"; g.lineWidth=3; g.lineCap="round";
  const mid=[(track[0]+s[0])/2, Math.min(track[1],s[1])-30];
  g.beginPath(); g.moveTo(...track); g.lineTo(...mid); g.lineTo(...s); g.stroke();
  g.fillStyle="rgba(230,230,236,.9)"; g.beginPath(); g.rect(track[0]-10, track[1]-4, 20, 8); g.fill();
  g.setLineDash([3,3]); g.strokeStyle=U.rgba(c,.6); g.lineWidth=1; g.beginPath(); g.moveTo(...mid); g.lineTo(s[0], s[1]-16); g.stroke(); g.setLineDash([]);
  g.restore();
};
ART.case["B06-06"].ratio = 1.05;

// B06-07｜Sequential Modular Assembly：後側深色配重零件平衡前側懸挑，標出重心與組裝序號
ART.case["B06-07"] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), light=[], heavy=[[-1,0,0],[-2,0,0],[-1,1,0],[-1,-1,0]];
  for(let x=1;x<=5;x++) light.push([x,0,0]);
  const cells = heavy.concat(light);
  const T = isoFit(cells.concat([[-3,-2,-1],[6,2,2]]), W, H*.86);
  isoGround(g, T, 4, c, .06);
  heavy.forEach((p,i) => isoCube(g, T, p[0],p[1],p[2], .46,.46,.46, [70,66,64], .85+.05*i, .96));
  light.forEach((p,i) => isoCube(g, T, p[0],p[1],p[2], .44,.3,.3, rgb, .5+.5*i/light.length, .95));
  const cg = cells.reduce((s,p)=>[s[0]+p[0]/cells.length,s[1]+p[1]/cells.length,s[2]+p[2]/cells.length],[0,0,0]);
  const pv=T(0,0,-.55); g.fillStyle="rgba(255,255,255,.7)"; g.beginPath(); g.moveTo(pv[0]-6,pv[1]+8); g.lineTo(pv[0]+6,pv[1]+8); g.lineTo(pv[0],pv[1]-2); g.closePath(); g.fill();
  const s=T(...cg); g.strokeStyle="#FF5C5C"; g.lineWidth=1; g.beginPath(); g.moveTo(s[0]-6,s[1]); g.lineTo(s[0]+6,s[1]); g.moveTo(s[0],s[1]-6); g.lineTo(s[0],s[1]+6); g.stroke();
  g.fillStyle="rgba(255,255,255,.6)"; g.font="9px sans-serif"; g.textAlign="center"; g.textBaseline="middle";
  cells.forEach((p,i) => { const sp=T(...p); g.fillText(String(i+1), sp[0], sp[1]-9); });
};
ART.case["B06-07"].ratio = .85;

// B06-51｜Jigsaw Block：Minecraft 式俯視像素村莊，道路（灰）與房屋（家族色）從種子向外拼接
ART.case["B06-51"] = function(g, W, H, r, c, U){
  const rgb = U.rgb(c), cell = Math.min(W,H)/18, cols=Math.floor(W/cell), rows=Math.floor(H/cell), cx=(cols/2)|0, cy=(rows/2)|0;
  const occ = new Map(), key=(x,y)=>x+","+y, palette = { road:[120,110,96], house:rgb };
  let front=[{x:cx,y:cy,depth:0}], placed=[{x:cx,y:cy,type:"road"}];
  occ.set(key(cx,cy),"road");
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  let tries=0;
  while(placed.length<46 && front.length && tries<4000){
    tries++;
    const i=(r()*front.length)|0, f=front[i];
    if(f.depth>6){ front.splice(i,1); continue; }
    const order=[0,1,2,3].sort(()=>r()-.5); let done=false;
    for(const k of order){ const d=dirs[k], nx=f.x+d[0], ny=f.y+d[1];
      if(nx<1||ny<1||nx>=cols-1||ny>=rows-1||occ.has(key(nx,ny))) continue;
      const ty = r()<.35 ? "road" : "house";
      occ.set(key(nx,ny), ty); placed.push({x:nx,y:ny,type:ty}); front.push({x:nx,y:ny,depth:f.depth+1}); done=true; break; }
    if(!done) front.splice(i,1);
  }
  g.strokeStyle="rgba(0,0,0,.25)"; g.lineWidth=1;
  placed.forEach(p => { const col = palette[p.type]; g.fillStyle=`rgb(${col[0]},${col[1]},${col[2]})`; g.fillRect(p.x*cell, p.y*cell, cell-1, cell-1); g.strokeRect(p.x*cell+.5, p.y*cell+.5, cell-2, cell-2); });
  g.fillStyle="rgba(255,255,255,.85)"; g.fillRect(cx*cell+cell*.3, cy*cell+cell*.3, cell*.4, cell*.4);
};

// B06-53｜Dungeon Architect Snap Builder：房間預製件以走廊連接，門（琥珀點）與封閉牆面、起訖房間標記
ART.case["B06-53"] = function(g, W, H, r, c, U){
  const rooms=[], n=6, conns=[]; let pos=[W/2,H/2], ang=-Math.PI/2, prevSize=[W*.12,H*.1];
  for(let i=0;i<n;i++){
    const w = W*(.09+r()*.06), h = H*(.07+r()*.05);
    rooms.push({x:pos[0]-w/2, y:pos[1]-h/2, w, h});
    if(i>0) conns.push([i-1,i]);
    ang += (r()-.5)*1.2;
    const dist = (prevSize[0]+w)/2 + 14;
    pos = [pos[0]+Math.cos(ang)*dist, pos[1]+Math.sin(ang)*dist];
    pos[0]=Math.max(W*.08, Math.min(W*.92, pos[0])); pos[1]=Math.max(H*.1, Math.min(H*.9, pos[1]));
    prevSize=[w,h];
  }
  g.strokeStyle = U.rgba(c,.85); g.lineWidth=1.6;
  rooms.forEach(rm => { g.fillStyle=U.rgba(c,.08); g.fillRect(rm.x, rm.y, rm.w, rm.h); g.strokeRect(rm.x, rm.y, rm.w, rm.h); });
  g.strokeStyle="rgba(255,255,255,.55)"; g.lineWidth=2;
  conns.forEach(([a,b]) => { const A=rooms[a], B=rooms[b], p1=[A.x+A.w/2, A.y+A.h/2], p2=[B.x+B.w/2, B.y+B.h/2];
    g.beginPath(); g.moveTo(...p1); g.lineTo(...p2); g.stroke();
    [p1,p2].forEach(p => { g.fillStyle="#FFD27A"; g.beginPath(); g.arc(p[0],p[1],2.4,0,U.TAU); g.fill(); });
  });
  g.fillStyle="rgba(255,255,255,.9)"; const s0=rooms[0]; g.beginPath(); g.arc(s0.x+s0.w/2, s0.y+s0.h/2, 4,0,U.TAU); g.fill();
  g.strokeStyle="#7EC8FF"; g.lineWidth=2; const sE=rooms[n-1]; g.strokeRect(sE.x-3, sE.y-3, sE.w+6, sE.h+6);
};
ART.case["B06-53"].ratio = 1.05;

})();
