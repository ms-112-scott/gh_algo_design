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
})();
