/* E04 動態鬆弛找形：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
ART.var["E04"] = ART.var["E04"] || [];
const TAU = Math.PI*2;

// ---------- 共用工具 ----------
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const mix = (A, B, t) => { t = clamp(t, 0, 1); return A.map((x,i) => Math.round(x + (B[i]-x)*t)); };
const css = (A, a) => a === undefined ? `rgb(${A[0]},${A[1]},${A[2]})` : `rgba(${A[0]},${A[1]},${A[2]},${a})`;
const DARK = [22,22,29], WHITE = [255,255,255], BLUE = [80,145,255], RED = [240,78,64];
const sub = (a,b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]);
const unit = a => { const l = len(a) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
const dot = (a,b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];

// 方格網：n×m 個質點（x 方向寬 sx、y 方向深 sy），回傳位置 P、彈簧 E、四邊形 Q
function net(n, m, sx, sy){
  const P = [], E = [], Q = [];
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) P.push([(i/(n-1) - .5)*sx, (j/(m-1) - .5)*sy, 0]);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const k = j*n + i;
    if(i < n-1) E.push([k, k+1]);
    if(j < m-1) E.push([k, k+n]);
    if(i < n-1 && j < m-1) Q.push([k, k+1, k+n+1, k+n]); }
  return {P, E, Q};
}
// 動態鬆弛：彈簧力＋外力 → 速度（乘阻尼）→ 位置，pin[i] 為真的質點不動。
// 每個質點的質量取相連彈簧硬度總和，避免 stiffness 大時數值爆炸（平衡形狀與質量無關）。
// o.rest 原長倍率、o.L0 指定原長、o.k 硬度或 o.ke(e)、o.load(i,p) 外力、o.force(P,F) 額外力、o.post(P,V,step) 每步後的約束
function relax(P, E, pin, o = {}){
  const N = P.length, rest = o.rest ?? 1, k = o.k ?? .5, damp = o.damp ?? .9, it = o.it ?? 300;
  const L0 = o.L0 || E.map(([a,b]) => len(sub(P[b], P[a]))*rest), K = E.map((_, e) => o.ke ? o.ke(e) : k);
  const M = new Float64Array(N); E.forEach(([a,b], e) => { M[a] += K[e]; M[b] += K[e]; });
  for(let i = 0; i < N; i++) M[i] = Math.max(1, M[i]*.9);
  const V = P.map(() => [0,0,0]), F = P.map(() => [0,0,0]), load = o.load || (() => [0,0,-.002]);
  for(let s = 0; s < it; s++){
    for(let i = 0; i < N; i++){ const f = load(i, P[i]); F[i][0] = f[0]; F[i][1] = f[1]; F[i][2] = f[2]; }
    if(o.force) o.force(P, F);
    for(let e = 0; e < E.length; e++){ const a = E[e][0], b = E[e][1], dx = P[b][0]-P[a][0], dy = P[b][1]-P[a][1], dz = P[b][2]-P[a][2];
      const l = Math.hypot(dx, dy, dz) || 1e-9, f = (l - L0[e])*K[e]/l;
      F[a][0] += dx*f; F[a][1] += dy*f; F[a][2] += dz*f; F[b][0] -= dx*f; F[b][1] -= dy*f; F[b][2] -= dz*f; }
    for(let i = 0; i < N; i++){ if(pin[i]) continue; const v = V[i], p = P[i], m = M[i];
      v[0] = (v[0] + F[i][0]/m)*damp; v[1] = (v[1] + F[i][1]/m)*damp; v[2] = (v[2] + F[i][2]/m)*damp;
      p[0] += v[0]; p[1] += v[1]; p[2] += v[2]; }
    if(o.post) o.post(P, V, s);
  }
  return L0;
}
// 懸垂網倒過來成受壓殼，並把最高點正規化到 h
function flip(P, h){ let mx = 1e-9; P.forEach(p => { p[2] = -p[2]; mx = Math.max(mx, p[2]); }); if(h) P.forEach(p => { p[2] *= h/mx; }); return P; }
// 平行投影相機：繞 z 軸轉 ang、仰角 el；(cx,cy) 是原點在畫面上的位置，s 是比例，zk 放大高度
function cam(cx, cy, s, ang, el, zk = 1){
  const ca = Math.cos(ang), sa = Math.sin(ang), ce = Math.cos(el), se = Math.sin(el);
  const f = p => { const x = p[0]*ca - p[1]*sa, y = p[0]*sa + p[1]*ca; return [cx + x*s, cy + (y*se - p[2]*zk*ce)*s]; };
  f.depth = p => -((p[0]*sa + p[1]*ca)*ce + p[2]*zk*se);   // 越大越遠
  f.view = [ce*sa, ce*ca, se];                             // 指向觀看者的方向
  return f;
}
// 畫家演算法：由遠到近填面；col(面, 法向量, 深度) 回傳顏色
function faces(g, P, F, prj, col, stroke, lw = .6){
  const items = F.map(f => { let d = 0; for(const k of f) d += prj.depth(P[k]); return [d/f.length, f]; }).sort((a,b) => b[0] - a[0]);
  for(const [d, f] of items){
    const nn = f.length === 4 ? unit(cross(sub(P[f[2]], P[f[0]]), sub(P[f[3]], P[f[1]]))) : unit(cross(sub(P[f[1]], P[f[0]]), sub(P[f[2]], P[f[0]])));
    g.beginPath(); f.forEach((k, i) => { const q = prj(P[k]); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath();
    const fc = col(f, nn, d); g.fillStyle = fc; g.fill();
    g.strokeStyle = stroke || fc; g.lineWidth = stroke ? lw : .5; g.stroke();
  }
}
const lam = (n, L) => Math.max(0, dot(n, L));
const edgeOf = (E, n, m) => E.map(([a,b]) => { const ia = a % n, ja = (a/n)|0, ib = b % n, jb = (b/n)|0;
  return (ja === jb && (ja === 0 || ja === m-1)) || (ia === ib && (ia === 0 || ia === n-1)); });
const ramp = (C, t) => t < .5 ? mix(BLUE, C, t*2) : mix(C, RED, (t - .5)*2);

// ================= 變形 =================

// V01 自訂錨點與邊界：只在兩條長邊每隔 4 格設柱 → 倒過來成有拱形開口的拱廊；一點透視看進拱廊
ART.var["E04"][0] = function(g, W, H, r, c, U){
  const C = U.rgb(c), n = 9, m = 25, {P, E, Q} = net(n, m, 1, 3.4), pin = P.map(() => 0);
  for(let j = 0; j < m; j += 4){ pin[j*n] = 1; pin[j*n + n-1] = 1; }
  relax(P, E, pin, {rest:.9, it:500, load:() => [0,0,-.003]});
  flip(P, .6);
  const ey = -2.4, ez = .2, f = W*.6, hy = H*.6;
  const prj = p => { const d = p[1] - ey; return [W/2 + p[0]/d*f, hy - (p[2] - ez)/d*f]; };
  prj.depth = p => p[1];
  const gr = g.createLinearGradient(0, hy, 0, H); gr.addColorStop(0, css(mix(DARK, C, .3))); gr.addColorStop(1, "#0c0c10");
  g.fillStyle = gr; g.fillRect(0, hy, W, H - hy);
  const vp = prj([0, 1.7, .25]), rg = g.createRadialGradient(vp[0], vp[1], 0, vp[0], vp[1], W*.4);
  rg.addColorStop(0, U.rgba(c, .7)); rg.addColorStop(1, U.rgba(c, 0)); g.fillStyle = rg; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1;
  for(let x = -1.2; x <= 1.21; x += .3){ const a = prj([x, -1.75, 0]), b = prj([x, 1.7, 0]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  const L = unit([.3, 1, -.5]);
  faces(g, P, Q, prj, (fc, nn, d) => css(mix(DARK, C, .12 + .5*Math.abs(dot(nn, L)) + .35*(d + 1.7)/3.4)), "rgba(255,255,255,.14)");
  g.fillStyle = "#fff";
  P.forEach((p, i) => { if(!pin[i]) return; const q = prj(p), s = 2.4*2/(p[1] - ey); g.fillRect(q[0] - s/2, q[1] - s*2.5, s, s*2.5); });
};
ART.var["E04"][0].ratio = .85;

// V02 對角彈簧與三角網：懸臂剪力測試──網的左緣整排釘在牆上、只受重力。
// 虛線＝只有經緯彈簧：四邊形可自由變成平行四邊形，整片網繞牆邊垂下（魚網般剪力變形）；
// 實心三角網＝每格加兩條對角彈簧：抗剪，懸臂幾乎維持原形，只有彈簧彈性造成的小撓度
ART.var["E04"][1] = function(g, W, H, r, c, U){
  const n = 9, m = 5, sx = 1.25, sy = sx*(m-1)/(n-1);
  // 魚網是機構（可自由剪動），重力下會一路轉到貼牆；取它剪動到約 55° 時的畫面
  const run = diag => { const {P, E, Q} = net(n, m, sx, sy), mid = ((m-1)/2)*n; let snap = null;
    P.forEach(p => { p[0] += sx/2; });   // 牆在 x = 0
    if(diag) Q.forEach(q => { E.push([q[0], q[2]]); E.push([q[1], q[3]]); });
    relax(P, E, P.map((_, k) => k % n === 0 ? 1 : 0), {it:diag ? 600 : 900, k:diag ? 14 : 4, damp:.93, load:() => [0,.0016,0], post:Q2 => {
      if(!diag && !snap && Math.atan2(Q2[mid + n-1][1] - Q2[mid][1], Q2[mid + n-1][0] - Q2[mid][0]) > .95) snap = Q2.map(p => p.slice()); }});
    return {P:snap || P, E, Q}; };
  const A = run(false), B = run(true);
  const wx = W*.15, top = H*.1, s = W*.56, q = p => [wx + p[0]*s, top + (p[1] + sy/2)*s];
  // 牆：斜線剖面
  g.fillStyle = "#2f2f3a"; g.fillRect(wx - W*.1, 0, W*.1, H);
  g.save(); g.beginPath(); g.rect(wx - W*.1, 0, W*.1, H); g.clip();
  g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1; g.beginPath();
  for(let y = -W*.1; y < H + W*.1; y += 7){ g.moveTo(wx - W*.1, y + W*.1); g.lineTo(wx, y); } g.stroke(); g.restore();
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(wx, 0); g.lineTo(wx, H); g.stroke();
  // 原本的位置（細框）
  g.strokeStyle = "rgba(255,255,255,.25)"; g.setLineDash([2, 3]); g.lineWidth = 1;
  const o0 = q([0, -sy/2, 0]), o1 = q([sx, sy/2, 0]); g.strokeRect(o0[0], o0[1], o1[0] - o0[0], o1[1] - o0[1]); g.setLineDash([]);
  // 加對角彈簧：三角網懸臂
  B.Q.forEach((f, k) => { [[f[0], f[1], f[2]], [f[0], f[2], f[3]]].forEach((t, h) => {
    U.poly(g, t.map(i => q(B.P[i])), true); g.fillStyle = U.rgba(c, (k + h) % 2 ? .7 : .42); g.fill(); }); });
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = .8; g.beginPath();
  B.E.forEach(([a, b]) => { const p1 = q(B.P[a]), p2 = q(B.P[b]); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); }); g.stroke();
  // 只有經緯彈簧：剪動垂下的魚網（第二色虛線，疊在上面）
  g.strokeStyle = css(BLUE, .95); g.lineWidth = 1.2; g.setLineDash([3.5, 2.5]); g.beginPath();
  A.E.forEach(([a, b]) => { const p1 = q(A.P[a]), p2 = q(A.P[b]); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); }); g.stroke(); g.setLineDash([]);
  g.fillStyle = css(mix(BLUE, WHITE, .4)); A.P.forEach((p, k) => { if(k % n){ const t = q(p); g.fillRect(t[0] - 1.4, t[1] - 1.4, 2.8, 2.8); } });
  // 牆上的固定點
  g.fillStyle = "#fff"; for(let j = 0; j < m; j++){ const t = q(B.P[j*n]); g.beginPath(); g.arc(t[0], t[1], 2.8, 0, TAU); g.fill(); }
  // 重力箭頭
  const ax = W*.9, ay = H*.62; g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax, ay + H*.12); g.stroke();
  U.poly(g, [[ax - 4, ay + H*.12 - 5], [ax + 4, ay + H*.12 - 5], [ax, ay + H*.12 + 2]], true); g.fillStyle = "rgba(255,255,255,.6)"; g.fill();
};
ART.var["E04"][1].ratio = 1.1;

// V03 從任意 Mesh 找形：L 形＋圓洞的平面，裸邊頂點固定 → 長成對應的受壓殼；地面上是原本的平面輪廓
ART.var["E04"][2] = function(g, W, H, r, c, U){
  const C = U.rgb(c), n = 17, {P} = net(n, n, 1, 1), P0 = P.map(p => p.slice());
  const cell = (i, j) => i >= 0 && j >= 0 && i < n-1 && j < n-1 && !(i >= 8 && j < 7) && Math.hypot((i + .5)/(n-1) - .28, (j + .5)/(n-1) - .7) > .13;
  const Q = [], E = [], used = new Uint8Array(n*n), seen = new Set();
  for(let j = 0; j < n-1; j++) for(let i = 0; i < n-1; i++) if(cell(i, j)){ const k = j*n + i, f = [k, k+1, k+n+1, k+n]; Q.push(f);
    for(let s = 0; s < 4; s++){ const a = f[s], b = f[(s+1)%4], key = Math.min(a,b)*4096 + Math.max(a,b); used[a] = 1; if(!seen.has(key)){ seen.add(key); E.push([a, b]); } } }
  const pin = P.map((_, k) => { if(!used[k]) return 1; const i = k % n, j = (k/n)|0; return cell(i,j) && cell(i-1,j) && cell(i,j-1) && cell(i-1,j-1) ? 0 : 1; });
  relax(P, E, pin, {rest:.95, it:450, load:i => used[i] ? [0,0,-.003] : [0,0,0]});
  flip(P, .3);
  const prj = cam(W*.5, H*.52, W*.6, -.65, .75, 1.3);
  g.fillStyle = "rgba(0,0,0,.5)";
  Q.forEach(f => { U.poly(g, f.map(k => prj([P0[k][0] + .05, P0[k][1] + .07, 0])), true); g.fill(); });
  g.strokeStyle = U.rgba(c, .45); g.lineWidth = 1;
  Q.forEach(f => { U.poly(g, f.map(k => prj([P0[k][0], P0[k][1], 0])), true); g.stroke(); });
  const L = unit([-.45, -.55, .7]);
  faces(g, P, Q, prj, (f, nn) => css(mix(DARK, C, .18 + .85*lam(nn, L))), "rgba(255,255,255,.16)");
  g.fillStyle = "#fff"; P.forEach((p, k) => { if(used[k] && pin[k]){ const q = prj(p); g.fillRect(q[0] - 1, q[1] - 1, 2, 2); } });
};
ART.var["E04"][2].ratio = .9;

// V04 張拉膜：原長縮短、重力為 0，高低交錯的四個錨點 → 馬鞍形膜（Frei Otto 帳篷）；低角度看，畫出桅杆與拉索
ART.var["E04"][3] = function(g, W, H, r, c, U){
  const C = U.rgb(c), n = 15, {P, E, Q} = net(n, n, 1.4, 1.4), hi = [0, n*n-1], lo = [n-1, n*(n-1)];
  P.forEach((p, k) => { const u = (k % n)/(n-1), v = ((k/n)|0)/(n-1); p[2] = .1 + .85*((1-u)*(1-v) + u*v); });
  const pin = P.map((_, k) => hi.includes(k) || lo.includes(k) ? 1 : 0), edge = edgeOf(E, n, n);
  const L0 = E.map(([a,b], e) => len(sub(P[b], P[a]))*(edge[e] ? .8 : .3));
  relax(P, E, pin, {L0, it:600, ke:e => edge[e] ? 1.2 : .3, load:() => [0,0,0]});
  const prj = cam(W*.5, H*.74, W*.44, .55, .3);
  const gy = H*.5, gr = g.createLinearGradient(0, gy, 0, H); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, css(mix(DARK, C, .18)));
  g.fillStyle = gr; g.fillRect(0, gy, W, H - gy);
  g.fillStyle = "rgba(0,0,0,.45)"; Q.forEach(f => { U.poly(g, f.map(k => prj([P[k][0], P[k][1], 0])), true); g.fill(); });
  const mast = k => { const p = P[k], top = [p[0]*1.08, p[1]*1.08, p[2] + .25], base = [p[0]*1.08, p[1]*1.08, 0], guy = [p[0]*1.7, p[1]*1.7, 0];
    const a = prj(base), b = prj(top), cc = prj(guy), d = prj(p);
    g.strokeStyle = "#fff"; g.lineWidth = 2.6; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    g.lineWidth = 1; g.strokeStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(cc[0], cc[1]); g.moveTo(b[0], b[1]); g.lineTo(d[0], d[1]); g.stroke(); };
  const far = hi.slice().sort((a, b) => prj.depth(P[b]) - prj.depth(P[a]));
  mast(far[0]);
  const L = unit([-.3, .4, .85]);
  faces(g, P, Q, prj, (f, nn) => css(mix(DARK, C, .3 + .7*Math.abs(dot(nn, L))), .88), "rgba(255,255,255,.1)");
  g.strokeStyle = "#fff"; g.lineWidth = 1.6;
  [[0, 1], [n-1, n], [n*n-1, -1], [n*(n-1), -n]].forEach(([s, d]) => { g.beginPath(); for(let t = 0; t < n; t++){ const q = prj(P[s + d*t]); t ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke(); });
  mast(far[1]);
  lo.forEach(k => { const a = prj(P[k]), b = prj([P[k][0]*1.25, P[k][1]*1.25, 0]); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
};
ART.var["E04"][3].ratio = .8;

// V05 吸引子：離吸引點越近的質點越重 → 倒過來後那一區隆起（天窗、入口拱）；鳥瞰，吸引點畫成光球
ART.var["E04"][4] = function(g, W, H, r, c, U){
  const C = U.rgb(c), n = 19, {P, E, Q} = net(n, n, 1.3, 1), A = [.3, -.1];
  const wt = P.map(p => 1 + 3.5*Math.exp(-((p[0]-A[0])**2 + (p[1]-A[1])**2)/.025));
  const pin = P.map((_, k) => { const i = k % n, j = (k/n)|0; return i === 0 || j === 0 || i === n-1 || j === n-1 ? 1 : 0; });
  relax(P, E, pin, {rest:.97, it:500, load:i => [0,0,-.0012*wt[i]]});
  flip(P, .45);
  const prj = cam(W*.5, H*.6, W*.56, .35, 1.0, 1.2);
  let top = P[0]; P.forEach(p => { if(Math.hypot(p[0]-A[0], p[1]-A[1]) < Math.hypot(top[0]-A[0], top[1]-A[1])) top = p; });
  const orb = prj([A[0], A[1], top[2] + .38]), rg = g.createRadialGradient(orb[0], orb[1], 0, orb[0], orb[1], W*.6);
  rg.addColorStop(0, U.rgba(c, .45)); rg.addColorStop(1, U.rgba(c, 0)); g.fillStyle = rg; g.fillRect(0, 0, W, H);
  const L = unit([.5, -.35, .8]);
  faces(g, P, Q, prj, (f, nn) => { const w = ((wt[f[0]] + wt[f[2]])/2 - 1)/3.5; return css(mix(mix(DARK, C, .1 + .75*lam(nn, L)), WHITE, w*.75)); }, "rgba(0,0,0,.3)");
  const sp = prj(top); g.setLineDash([3, 3]); g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1;
  g.beginPath(); g.moveTo(orb[0], orb[1]); g.lineTo(sp[0], sp[1]); g.stroke(); g.setLineDash([]);
  const og = g.createRadialGradient(orb[0], orb[1], 0, orb[0], orb[1], W*.07); og.addColorStop(0, "#fff"); og.addColorStop(.35, U.rgba(c, .9)); og.addColorStop(1, U.rgba(c, 0));
  g.fillStyle = og; g.beginPath(); g.arc(orb[0], orb[1], W*.07, 0, TAU); g.fill();
};
ART.var["E04"][4].ratio = .9;

// V06 Kinetic Damping：動能一開始下降就把所有速度歸零（Barnes）→ 少很多步就收斂；和一般黏滯阻尼的動能曲線並排
ART.var["E04"][5] = function(g, W, H, r, c, U){
  const n = 22;
  const run = kd => { const P = [...Array(n)].map((_, i) => [i/(n-1) - .5, 0, 0]), E = [...Array(n-1)].map((_, i) => [i, i+1]), ke = []; let prev = 0;
    relax(P, E, P.map((_, i) => i === 0 || i === n-1 ? 1 : 0), {it:200, rest:1.12, damp:kd ? 1 : .985, load:() => [0,0,-.004], post:(Q, V) => {
      let e = 0; V.forEach(v => { e += v[0]*v[0] + v[1]*v[1] + v[2]*v[2]; }); const drop = kd && e < prev;
      if(drop) V.forEach(v => { v[0] = v[1] = v[2] = 0; }); ke.push(e); prev = drop ? 0 : e; }});
    return {P, ke}; };
  const A = run(false), B = run(true), mx = Math.max(...A.ke, ...B.ke) || 1;
  const x0 = W*.1, x1 = W*.95, y0 = H*.1, y1 = H*.88, X = s => x0 + s/(A.ke.length - 1)*(x1 - x0), Y = e => y1 - Math.sqrt(e/mx)*(y1 - y0);
  g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1;
  for(let k = 0; k <= 5; k++){ const y = y0 + (y1 - y0)*k/5; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
  for(let k = 0; k <= 8; k++){ const x = x0 + (x1 - x0)*k/8; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x0, y0 - 4); g.lineTo(x0, y1); g.lineTo(x1 + 4, y1); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.2; g.beginPath(); A.ke.forEach((e, s) => s ? g.lineTo(X(s), Y(e)) : g.moveTo(X(s), Y(e))); g.stroke();
  g.beginPath(); g.moveTo(X(0), y1); B.ke.forEach((e, s) => g.lineTo(X(s), Y(e))); g.lineTo(X(B.ke.length - 1), y1); g.closePath(); g.fillStyle = U.rgba(c, .45); g.fill();
  g.strokeStyle = c; g.lineWidth = 1.8; g.beginPath(); B.ke.forEach((e, s) => s ? g.lineTo(X(s), Y(e)) : g.moveTo(X(s), Y(e))); g.stroke();
  let done = B.ke.findIndex((e, s) => s > 5 && B.ke.slice(s).every(v => v < mx*2e-4)); if(done < 0) done = B.ke.length - 1;
  g.setLineDash([4, 3]); g.strokeStyle = "#fff"; g.lineWidth = 1; g.beginPath(); g.moveTo(X(done), y0); g.lineTo(X(done), y1); g.stroke(); g.setLineDash([]);
  g.fillStyle = "#fff"; g.beginPath(); g.arc(X(done), y1, 3, 0, TAU); g.fill();
  // 右上小圖：收斂後的懸垂鏈倒過來＝拱
  const bx = W*.6, by = H*.14, bw = W*.32, bh = H*.26; g.fillStyle = "rgba(15,15,20,.85)"; g.fillRect(bx, by, bw, bh); g.strokeStyle = U.rgba(c, .6); g.strokeRect(bx, by, bw, bh);
  const zmin = Math.min(...B.P.map(p => p[2])) || -1;
  g.strokeStyle = c; g.lineWidth = 1.6; g.beginPath(); B.P.forEach((p, i) => { const x = bx + bw*.1 + (p[0] + .5)*bw*.8, y = by + bh*.85 - p[2]/zmin*bh*.65; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  g.fillStyle = "#fff"; B.P.forEach(p => { g.fillRect(bx + bw*.1 + (p[0] + .5)*bw*.8 - 1, by + bh*.85 - p[2]/zmin*bh*.65 - 1, 2, 2); });
};
ART.var["E04"][5].ratio = .8;

// V07 Timer 動畫化：每次觸發只跑幾步，把不同時間點的網排成底片格，最後一格倒過來成殼
ART.var["E04"][6] = function(g, W, H, r, c, U){
  const n = 11, {P, E} = net(n, n, 1, 1), pin = P.map((_, k) => [0, n-1, n*(n-1), n*n-1].includes(k) ? 1 : 0), at = [1, 6, 16, 40, 200], shots = [];
  relax(P, E, pin, {rest:.92, it:201, load:() => [0,0,-.0025], post:(Q, V, s) => { if(at.includes(s)) shots.push(Q.map(p => p.slice())); }});
  shots.push(shots[shots.length - 1].map(p => [p[0], p[1], -p[2]]));
  const zm = Math.max(...shots[shots.length - 1].map(p => p[2])) || 1;
  g.fillStyle = "#08080b"; g.fillRect(0, 0, W*.09, H); g.fillRect(W*.91, 0, W*.09, H);
  g.fillStyle = "#34343f";
  for(let y = H*.02; y < H; y += H*.055){ g.fillRect(W*.025, y, W*.04, H*.028); g.fillRect(W*.935, y, W*.04, H*.028); }
  const fw = W*.39, fh = H*.3, gx = W*.02, gy = H*.025;
  shots.forEach((S, k) => { const col = k % 2, row = (k/2)|0, fx = W*.1 + col*(fw + gx), fy = H*.03 + row*(fh + gy);
    g.fillStyle = k === 5 ? "#3a3326" : "#2a2a33"; g.fillRect(fx, fy, fw, fh);
    const prj = cam(fx + fw/2, fy + fh*(k === 5 ? .66 : .4), fw*.5, .6, .45, .36/zm);
    g.strokeStyle = k === 5 ? c : U.rgba(c, .5 + k*.08); g.lineWidth = k === 5 ? 1.1 : .8; g.beginPath();
    E.forEach(([a, b]) => { const p = prj(S[a]), q = prj(S[b]); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }); g.stroke();
    g.fillStyle = U.rgba(c, .9); g.fillRect(fx + fw*.06, fy + fh*.9, fw*.88*(k + 1)/6, fh*.035);
  });
};
ART.var["E04"][6].ratio = 1.3;

// V08 受壓殼 → 可製造構件：上＝懸垂鏈倒過來的拱沿法向加厚、切成楔形石塊；下＝殼的每一格四邊形展開成平板，排在板材上
ART.var["E04"][7] = function(g, W, H, r, c, U){
  const C = U.rgb(c), m = 13, ch = [...Array(m+1)].map((_, i) => [i/m - .5, 0, 0]), ce = [...Array(m)].map((_, i) => [i, i+1]);
  relax(ch, ce, ch.map((_, i) => i === 0 || i === m ? 1 : 0), {rest:1.3, it:600, load:() => [0,0,-.003]});
  flip(ch, .6);
  const ax = x => W*.5 + x*W*.78, ay = z => H*.4 - z*H*.5, th = .06, IN = [], OUT = [];
  ch.forEach((p, i) => { const a = ch[Math.max(0, i-1)], b = ch[Math.min(m, i+1)], t = [b[0]-a[0], b[2]-a[2]], l = Math.hypot(t[0], t[1]), nx = -t[1]/l, nz = t[0]/l;
    IN.push([ax(p[0] - nx*th/2), ay(p[2] - nz*th/2)]); OUT.push([ax(p[0] + nx*th/2), ay(p[2] + nz*th/2)]); });
  g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(0, ay(0), W, H*.03);
  for(let i = 0; i < m; i++){ U.poly(g, [IN[i], OUT[i], OUT[i+1], IN[i+1]], true); g.fillStyle = css(mix(DARK, C, i % 2 ? .95 : .6)); g.fill(); g.strokeStyle = "#121217"; g.lineWidth = 1.5; g.stroke(); }
  // 殼的面板：找形後把每格四邊形依邊長展開成平面
  const n = 7, {P, E, Q} = net(n, n, 1, 1);
  relax(P, E, P.map((_, k) => [0, n-1, n*(n-1), n*n-1].includes(k) ? 1 : 0), {rest:.95, it:400, load:() => [0,0,-.003]});
  flip(P, .35);
  const D = (a, b) => len(sub(a, b));
  const flat = f => { const [A, B, Cc, Dd] = f.map(k => P[k]), ab = D(A,B), ac = D(A,Cc), bc = D(B,Cc), ad = D(A,Dd), cd = D(Cc,Dd);
    const cx = (ab*ab + ac*ac - bc*bc)/(2*ab), cy = Math.sqrt(Math.max(0, ac*ac - cx*cx)), ux = cx/ac, uy = cy/ac;
    const dx = (ac*ac + ad*ad - cd*cd)/(2*ac), dy = Math.sqrt(Math.max(0, ad*ad - dx*dx));
    return [[0, 0], [ab, 0], [cx, cy], [ux*dx - uy*dy, uy*dx + ux*dy]]; };
  const pan = Q.map(flat); let big = 0; pan.forEach(p => p.forEach(q => { big = Math.max(big, Math.abs(q[0]), Math.abs(q[1])); }));
  const sx0 = W*.05, sy0 = H*.5, sw = W*.9, sh = H*.46; g.fillStyle = "#2c2c36"; g.fillRect(sx0, sy0, sw, sh); g.strokeStyle = "rgba(255,255,255,.25)"; g.strokeRect(sx0, sy0, sw, sh);
  const cw = sw/6, chh = sh/6, sc = Math.min(cw, chh)*.78/big;
  pan.forEach((p, k) => { const col = k % 6, row = (k/6)|0; let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
    p.forEach(q => { mnx = Math.min(mnx, q[0]); mny = Math.min(mny, q[1]); mxx = Math.max(mxx, q[0]); mxy = Math.max(mxy, q[1]); });
    const ox = sx0 + (col + .5)*cw - (mnx + mxx)/2*sc, oy = sy0 + (row + .5)*chh - (mny + mxy)/2*sc, pts = p.map(q => [ox + q[0]*sc, oy + q[1]*sc]);
    U.poly(g, pts, true); g.fillStyle = U.rgba(c, .22); g.fill(); g.strokeStyle = c; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#fff"; pts.forEach(q => { g.fillRect(q[0] - .8 + (ox + (mnx + mxx)/2*sc - q[0])*.12, q[1] - .8 + (oy + (mny + mxy)/2*sc - q[1])*.12, 1.6, 1.6); });
  });
};
ART.var["E04"][7].ratio = 1.2;

// V09 應力視覺化：由下往上仰看六點支撐的圓形網殼（魚眼投影），桿件依伸長量上色（紅＝拉、藍＝壓），粗細代表大小
ART.var["E04"][8] = function(g, W, H, r, c, U){
  const R = 8, S = 18, P = [[0, 0, 0]], E = [], id = (k, s) => 1 + (k-1)*S + ((s % S) + S) % S;
  for(let k = 1; k <= R; k++) for(let s = 0; s < S; s++){ const a = s/S*TAU, rr = k/R*.5; P.push([Math.cos(a)*rr, Math.sin(a)*rr, 0]); }
  for(let s = 0; s < S; s++){ E.push([0, id(1, s)]); for(let k = 1; k <= R; k++){ E.push([id(k, s), id(k, s+1)]); if(k < R) E.push([id(k, s), id(k+1, s)]); } }
  const pin = P.map((_, i) => i >= id(R, 0) && (i - id(R, 0)) % 3 === 0 ? 1 : 0);
  const L0 = relax(P, E, pin, {rest:.96, it:600, k:.45, load:(i, p) => [0, 0, -.0016*(1 + .8*Math.max(0, p[0]))]});
  const st = E.map(([a, b], e) => (len(sub(P[b], P[a])) - L0[e])/L0[e]), srt = st.slice().sort((a, b) => a - b), med = srt[srt.length >> 1], lo = srt[0], hi = srt[srt.length - 1];
  flip(P, .5);
  const Rm = Math.min(W, H)*.47, cx = W/2, cy = H/2, pr = p => { const rho = Math.hypot(p[0], p[1]), th = Math.atan2(rho, p[2] + .03), a = Math.atan2(p[1], p[0]), s = th/(Math.PI/2)*Rm; return [cx + Math.cos(a)*s, cy + Math.sin(a)*s]; };
  const bg = g.createRadialGradient(cx, cy, 0, cx, cy, Rm); bg.addColorStop(0, U.rgba(c, .32)); bg.addColorStop(.7, U.rgba(c, .1)); bg.addColorStop(1, "rgba(0,0,0,.4)");
  g.fillStyle = bg; g.beginPath(); g.arc(cx, cy, Rm, 0, TAU); g.fill();
  g.lineCap = "round";
  E.map((e, k) => k).sort((a, b) => Math.abs(st[a] - med) - Math.abs(st[b] - med)).forEach(k => { const [a, b] = E[k], t = st[k] >= med ? (st[k] - med)/((hi - med) || 1) : (med - st[k])/((med - lo) || 1);
    const A = pr(P[a]), B = pr(P[b]); g.strokeStyle = css(mix([120, 120, 135], st[k] >= med ? RED : BLUE, .35 + .65*t)); g.lineWidth = .8 + 3.6*t;
    g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); });
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, Rm, 0, TAU); g.stroke();
  g.fillStyle = "#fff"; P.forEach((p, i) => { if(pin[i]){ const q = pr(p); g.beginPath(); g.arc(q[0], q[1], 3.2, 0, TAU); g.fill(); } });
};
ART.var["E04"][8].ratio = 1;

// V10 混合 E01：先在平面上做圓堆積，相接的圓心連成彈簧網，再鬆弛找形 → 不規則三角網的自由形殼（上＝堆積、下＝網殼側視）
ART.var["E04"][9] = function(g, W, H, r, c, U){
  const K = 48, rx = .5, ry = .3, pts = [];
  for(let i = 0; i < K; i++){ const a = r()*TAU, d = Math.sqrt(r()); pts.push({x:Math.cos(a)*d*rx*.9, y:Math.sin(a)*d*ry*.9, r:.034 + r()*.028}); }
  for(let it = 0; it < 140; it++){
    for(let i = 0; i < K; i++) for(let j = i+1; j < K; j++){ const a = pts[i], b = pts[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6, o = a.r + b.r - d;
      if(o > 0){ const f = o/d*.5; a.x -= dx*f; a.y -= dy*f; b.x += dx*f; b.y += dy*f; } }
    pts.forEach(p => { const e = (p.x/(rx - p.r))**2 + (p.y/(ry - p.r))**2; if(e > 1){ const s = 1/Math.sqrt(e); p.x *= s; p.y *= s; } }); }
  const E = []; for(let i = 0; i < K; i++) for(let j = i+1; j < K; j++){ const a = pts[i], b = pts[j]; if(Math.hypot(b.x - a.x, b.y - a.y) < (a.r + b.r)*1.22) E.push([i, j]); }
  const tx = x => W/2 + x*W*.86, ty = y => H*.26 + y*W*.86;
  pts.forEach(p => { g.beginPath(); g.arc(tx(p.x), ty(p.y), p.r*W*.86, 0, TAU); g.fillStyle = U.rgba(c, .28); g.fill(); g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1; g.stroke(); });
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = .8; g.beginPath(); E.forEach(([a, b]) => { g.moveTo(tx(pts[a].x), ty(pts[a].y)); g.lineTo(tx(pts[b].x), ty(pts[b].y)); }); g.stroke();
  g.fillStyle = U.rgba(c, .8); const ay = H*.53; U.poly(g, [[W/2 - 9, ay - 5], [W/2 + 9, ay - 5], [W/2, ay + 6]], true); g.fill();
  // 網殼：靠近外緣的點固定，其餘受重力；和固定點不相連的點也固定
  const P = pts.map(p => [p.x, p.y, 0]), pin = pts.map(p => (p.x/rx)**2 + (p.y/ry)**2 > .6 ? 1 : 0), adj = pts.map(() => []);
  E.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
  const ok = pin.slice(), st = pin.map((v, i) => v ? i : -1).filter(i => i >= 0);
  while(st.length){ const i = st.pop(); adj[i].forEach(j => { if(!ok[j]){ ok[j] = 1; st.push(j); } }); }
  ok.forEach((v, i) => { if(!v || !adj[i].length) pin[i] = 1; });
  relax(P, E, pin, {rest:1, it:500, load:() => [0,0,-.002]});
  flip(P, .4);
  const prj = cam(W/2, H*.9, W*.84, 0, .38, 1.1);
  g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(W/2, H*.9, rx*W*.84, ry*W*.84*Math.sin(.38), 0, 0, TAU); g.fill();
  const ord = E.map((e, k) => k).sort((a, b) => prj.depth(P[E[b][0]]) - prj.depth(P[E[a][0]]));
  ord.forEach(k => { const [a, b] = E[k], A = prj(P[a]), B = prj(P[b]), d = (prj.depth(P[a]) + .6)/1.2; g.strokeStyle = U.rgba(c, .95 - .5*clamp(d, 0, 1)); g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); });
  g.fillStyle = "#fff"; P.forEach(p => { const q = prj(p); g.fillRect(q[0] - 1.2, q[1] - 1.2, 2.4, 2.4); });
};
ART.var["E04"][9].ratio = 1.2;

// V11 充氣結構：三角網每步對每個面加「法向量 × 面積 × 壓力」，四邊固定 → 像氣枕一樣鼓起
ART.var["E04"][10] = function(g, W, H, r, c, U){
  const C = U.rgb(c), n = 15, {P, E, Q} = net(n, n, 1.2, .8), T = [];
  Q.forEach(([a, b, cc, d]) => { T.push([a, b, cc], [a, cc, d]); E.push([a, cc]); });
  P.forEach(p => { p[2] = .03*(1 - (p[0]/.6)**2)*(1 - (p[1]/.4)**2); });
  const pin = P.map((_, k) => { const i = k % n, j = (k/n)|0; return i === 0 || j === 0 || i === n-1 || j === n-1 ? 1 : 0; }), pr = .09;
  relax(P, E, pin, {it:500, k:.5, load:() => [0,0,0], force:(Q2, F) => { T.forEach(t => { const a = Q2[t[0]], nn = cross(sub(Q2[t[1]], a), sub(Q2[t[2]], a));
    for(const k of t){ F[k][0] += nn[0]*pr/6; F[k][1] += nn[1]*pr/6; F[k][2] += nn[2]*pr/6; } }); }});
  const zm = Math.max(...P.map(p => p[2])) || 1; P.forEach(p => { p[2] *= .3/zm; });
  const prj = cam(W*.5, H*.64, W*.72, .12, .42);
  const sh = g.createRadialGradient(W*.52, H*.8, 0, W*.52, H*.8, W*.5); sh.addColorStop(0, "rgba(0,0,0,.55)"); sh.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = sh; g.beginPath(); g.ellipse(W*.52, H*.8, W*.5, H*.14, 0, 0, TAU); g.fill();
  const L = unit([-.4, .5, .75]), Hv = unit([L[0] + prj.view[0], L[1] + prj.view[1], L[2] + prj.view[2]]);
  faces(g, P, T, prj, (f, nn) => { const sp = Math.pow(lam(nn, Hv), 30); return css(mix(mix(DARK, C, .12 + .85*lam(nn, L)), WHITE, sp*.9)); });
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1.5;
  const ring = []; for(let i = 0; i < n; i++) ring.push(i); for(let j = 1; j < n; j++) ring.push(j*n + n-1); for(let i = n-2; i >= 0; i--) ring.push((n-1)*n + i); for(let j = n-2; j > 0; j--) ring.push(j*n);
  U.poly(g, ring.map(k => prj(P[k])), true); g.stroke();
};
ART.var["E04"][10].ratio = .8;

// V12 曲面上的網：每步把質點拉回波浪形立面（最近點），重力為 0、只留彈簧 → 立面上均勻的分割網格
ART.var["E04"][11] = function(g, W, H, r, c, U){
  const C = U.rgb(c), n = 13, m = 16, Hh = 1.5, f = x => .2*Math.sin(x*3.3 + .4), df = x => .66*Math.cos(x*3.3 + .4), P = [], E = [], id = (i, j) => j*n + i;
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const x = -1 + 2*Math.pow(i/(n-1), 1.8); P.push([x, f(x), Hh*Math.pow(j/(m-1), 1.6)]); }
  let arc = 0; for(let k = 0; k < 200; k++){ const a = -1 + k/100, b = a + .01; arc += Math.hypot(.01, f(b) - f(a)); }
  const L0 = [];
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ if(i < n-1){ E.push([id(i, j), id(i+1, j)]); L0.push(arc/(n-1)); } if(j < m-1){ E.push([id(i, j), id(i, j+1)]); L0.push(Hh/(m-1)); } }
  relax(P, E, P.map(() => 0), {L0, it:400, load:() => [0,0,0], post:Q => Q.forEach((p, k) => { const i = k % n, j = (k/n)|0;
    p[0] = i === 0 ? -1 : i === n-1 ? 1 : clamp(p[0], -1, 1); p[1] = f(p[0]); p[2] = j === 0 ? 0 : j === m-1 ? Hh : clamp(p[2], 0, Hh); })});
  const an = -.5, ca = Math.cos(an), sa = Math.sin(an), ey = -3.1, ez = .6, fo = W*1.25;
  const prj = p => { const x = p[0]*ca - p[1]*sa, y = p[0]*sa + p[1]*ca, d = y - ey; return [W*.5 + x/d*fo, H*.5 - (p[2] - ez)/d*fo]; };
  const gh = prj([0, 0, 0])[1], gr = g.createLinearGradient(0, H*.45, 0, H); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, css(mix(DARK, C, .2)));
  g.fillStyle = gr; g.fillRect(0, H*.45, W, H*.55);
  const L = unit([-.7, -.8, .2]), strips = [];
  for(let k = 0; k < 90; k++){ const a = -1 + k/45, b = a + 1/45, xm = (a + b)/2, nn = unit([-df(xm), 1, 0]); strips.push([xm*sa + f(xm)*ca, a, b, Math.abs(dot(nn, L))]); }
  strips.sort((u, v) => v[0] - u[0]).forEach(([d, a, b, l]) => { U.poly(g, [prj([a, f(a), 0]), prj([b, f(b), 0]), prj([b, f(b), Hh]), prj([a, f(a), Hh])], true);
    g.fillStyle = css(mix(DARK, C, .12 + .55*l)); g.fill(); g.strokeStyle = g.fillStyle; g.lineWidth = .6; g.stroke(); });
  g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 1; g.beginPath();
  E.forEach(([a, b]) => { const A = prj(P[a]), B = prj(P[b]); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); }); g.stroke();
  g.fillStyle = "#fff"; P.forEach(p => { const q = prj(p); g.fillRect(q[0] - 1.1, q[1] - 1.1, 2.2, 2.2); });
  g.fillStyle = "rgba(0,0,0,.35)"; U.poly(g, [...Array(41)].map((_, k) => prj([-1 + k/20, f(-1 + k/20), 0])).concat([...Array(41)].map((_, k) => prj([1 - k/20, f(1 - k/20) - .12, 0]))), true); g.fill();
};
ART.var["E04"][11].ratio = 1.3;

// V13 四邊形平面化（PQ Mesh）：找形後每格投影到自己的擬合平面、和彈簧目標一起取平均（Shape-Up）；面依平面度上色，紅＝翹、綠＝平
ART.var["E04"][12] = function(g, W, H, r, c, U){
  const n = 12, {P, E, Q} = net(n, n, 1, 1), pin = P.map((_, k) => [0, n-1, n*(n-1), n*n-1].includes(k) ? 1 : 0);
  relax(P, E, pin, {rest:.95, it:450, load:() => [0,0,-.003]});
  flip(P, .42);
  const plan = f => { const a = P[f[0]], u = sub(P[f[2]], a), v = sub(P[f[3]], P[f[1]]), w = cross(u, v), wl = len(w) || 1e-9; return Math.abs(dot(sub(P[f[1]], a), w))/wl/((len(u) + len(v))/2); };
  const pmax = Math.max(...Q.map(plan)) || 1, L0 = E.map(([a, b]) => len(sub(P[b], P[a])));
  for(let it = 0; it < 3; it++){ const S = P.map(() => [0,0,0]), cnt = new Float64Array(P.length);
    Q.forEach(f => { const cen = [0,0,0]; f.forEach(k => { for(let x = 0; x < 3; x++) cen[x] += P[k][x]/4; }); const nn = unit(cross(sub(P[f[2]], P[f[0]]), sub(P[f[3]], P[f[1]])));
      f.forEach(k => { const d = dot(sub(P[k], cen), nn); for(let x = 0; x < 3; x++) S[k][x] -= nn[x]*d; cnt[k]++; }); });
    E.forEach(([a, b], e) => { const d = sub(P[b], P[a]), l = len(d) || 1e-9, h = (l - L0[e])/l/2; for(let x = 0; x < 3; x++){ S[a][x] += d[x]*h; S[b][x] -= d[x]*h; } cnt[a]++; cnt[b]++; });
    P.forEach((p, k) => { if(pin[k]) return; for(let x = 0; x < 3; x++) p[x] += S[k][x]/cnt[k]; }); }
  const prj = cam(W*.44, H*.62, W*.62, .5, .78, 1.2), L = unit([-.3, -.5, .8]);
  faces(g, P, Q, prj, (f, nn) => { const t = clamp(plan(f)/pmax*2.2, 0, 1); return `hsl(${Math.round(120*(1 - t))},72%,${Math.round(30 + 26*lam(nn, L))}%)`; }, "rgba(0,0,0,.45)", .8);
  const bx = W*.9, by = H*.14, bh = H*.66, lg = g.createLinearGradient(0, by, 0, by + bh); lg.addColorStop(0, "hsl(0,72%,50%)"); lg.addColorStop(.5, "hsl(60,72%,50%)"); lg.addColorStop(1, "hsl(120,72%,45%)");
  g.fillStyle = lg; g.fillRect(bx, by, W*.035, bh); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; g.strokeRect(bx, by, W*.035, bh);
  for(let k = 0; k <= 4; k++){ const y = by + bh*k/4; g.beginPath(); g.moveTo(bx - 4, y); g.lineTo(bx, y); g.stroke(); }
};
ART.var["E04"][12].ratio = .9;

// V14 彎曲桿件與編織網殼：平直細桿被彎成拱，經緯兩組斜桿在交叉點沿法向上下交錯（±r），畫成圓管
ART.var["E04"][13] = function(g, W, H, r, c, U){
  const C = U.rgb(c), D = 1/7, R = .03, Ly = .85;
  const S = (u, v, off) => { const t = Math.PI*(.05 + .9*u), nx = -Math.cos(t)/.55, nz = Math.sin(t)/.62, nl = Math.hypot(nx, nz);
    return [[-Math.cos(t)*.55 + nx/nl*off, (v - .5)*2*Ly, Math.sin(t)*.62 + nz/nl*off], [nx/nl, 0, nz/nl]]; };
  const prj = cam(W*.5, H*.72, W*.5, -.6, .42), segs = [];
  const rod = (fam, cst, sgn) => { const pts = [];
    for(let v = 0; v <= 1.0001; v += .012){ const u = fam ? cst - v : v + cst; if(u < 0 || u > 1) continue;
      const s = fam ? u - v : u + v, off = fam ? -R*Math.cos(Math.PI*s/D)*sgn : R*Math.cos(Math.PI*s/D)*sgn; pts.push(S(u, v, off)); }
    for(let k = 1; k < pts.length; k++) segs.push([pts[k-1][0], pts[k][0], pts[k][1]]); };
  for(let i = -6; i <= 6; i++) rod(0, i*D, i % 2 ? -1 : 1);
  for(let j = 1; j <= 13; j++) rod(1, j*D, j % 2 ? -1 : 1);
  g.fillStyle = "rgba(0,0,0,.4)"; const sp = [[-.6, -Ly - .05], [.6, -Ly - .05], [.6, Ly + .05], [-.6, Ly + .05]].map(q => prj([q[0], q[1], 0])); U.poly(g, sp, true); g.fill();
  const w = W*.028, L = unit([-.4, -.3, .85]);
  segs.map(s => [prj.depth([(s[0][0] + s[1][0])/2, (s[0][1] + s[1][1])/2, (s[0][2] + s[1][2])/2]), s]).sort((a, b) => b[0] - a[0]).forEach(([d, [a, b, nn]]) => {
    const A = prj(a), B = prj(b), front = dot(nn, prj.view), l = .25 + .6*lam(nn, L);
    g.lineCap = "round"; g.strokeStyle = "rgba(10,8,5,.85)"; g.lineWidth = w + 2; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
    g.strokeStyle = css(mix(DARK, C, front > 0 ? l + .15 : l*.5)); g.lineWidth = w; g.stroke();
    if(front > 0){ g.strokeStyle = "rgba(255,240,210,.45)"; g.lineWidth = w*.28; g.stroke(); } });
};
ART.var["E04"][13].ratio = .85;

// V15 布料下垂與碰撞：平布從上方落下，碰到量體就推回表面外、法向速度歸零，另加跨一格的彎曲彈簧 → 披覆在方塊上的皺褶
ART.var["E04"][14] = function(g, W, H, r, c, U){
  const C = U.rgb(c), n = 21, {P, E, Q} = net(n, n, 1.5, 1.5), ns = E.length, bx = .36, bz = .55;
  P.forEach(p => { p[2] = .9; p[0] += .04; p[1] -= .03; });
  for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){ const k = j*n + i; if(i < n-2) E.push([k, k+2]); if(j < n-2) E.push([k, k + 2*n]); }
  relax(P, E, P.map(() => 0), {it:450, ke:e => e < ns ? .5 : .1, load:() => [0,0,-.0025], post:(Q2, V) => Q2.forEach((p, i) => {
    if(Math.abs(p[0]) < bx && Math.abs(p[1]) < bx && p[2] < bz){ const dx = bx - Math.abs(p[0]), dy = bx - Math.abs(p[1]), dz = bz - p[2];
      if(dz <= dx && dz <= dy){ p[2] = bz + 1e-4; V[i][2] = 0; V[i][0] *= .5; V[i][1] *= .5; }
      else if(dx < dy){ p[0] = Math.sign(p[0])*(bx + 1e-4); V[i][0] = 0; V[i][1] *= .7; V[i][2] *= .7; }
      else { p[1] = Math.sign(p[1])*(bx + 1e-4); V[i][1] = 0; V[i][0] *= .7; V[i][2] *= .7; } }
    if(p[2] < 0){ p[2] = 0; V[i][2] = 0; V[i][0] *= .5; V[i][1] *= .5; } })});
  const prj = cam(W*.5, H*.72, W*.5, .6, .5, 1.1);
  g.fillStyle = "rgba(0,0,0,.45)"; U.poly(g, [[-.8, -.8], [.8, -.8], [.8, .8], [-.8, .8]].map(q => prj([q[0] + .1, q[1] + .1, 0])), true); g.fill();
  const cen = f => { const s = [0,0,0]; f.forEach(k => { s[0] += P[k][0]/4; s[1] += P[k][1]/4; s[2] += P[k][2]/4; }); return s; };
  const back = [], front = []; Q.forEach(f => { const q = cen(f); (q[2] < bz - .02 && (q[0] < -bx + .03 || q[1] < -bx + .03) ? back : front).push(f); });
  const L = unit([-.2, .6, .8]), col = (f, nn) => css(mix(DARK, C, .15 + .85*Math.abs(dot(nn, L))));
  faces(g, P, back, prj, col, "rgba(0,0,0,.25)");
  [[[bx, -bx, 0], [bx, bx, 0], [bx, bx, bz], [bx, -bx, bz], "#3b3b46"], [[-bx, bx, 0], [bx, bx, 0], [bx, bx, bz], [-bx, bx, bz], "#2c2c35"]].forEach(q => { U.poly(g, q.slice(0, 4).map(prj), true); g.fillStyle = q[4]; g.fill(); });
  faces(g, P, front, prj, col, "rgba(0,0,0,.25)");
};
ART.var["E04"][14].ratio = .9;

// V16 位置式動力學（PBD）：預測位置 → 對每條彈簧做距離約束投影 → 由位置差回推速度；各種目標（Goal）接進同一個求解器，像一個自寫的迷你 Kangaroo
ART.var["E04"][15] = function(g, W, H, r, c, U){
  const C = U.rgb(c), n = 9, {P, E} = net(n, n, 1, 1), pin = P.map((_, k) => [0, n-1, n*(n-1), n*n-1].includes(k) ? 1 : 0), L0 = E.map(([a, b]) => len(sub(P[b], P[a]))*1.06), V = P.map(() => [0,0,0]);
  for(let s = 0; s < 40; s++){ const q = P.map((p, i) => pin[i] ? p.slice() : [p[0] + V[i][0], p[1] + V[i][1], p[2] + V[i][2] - .012]);
    for(let it = 0; it < 10; it++) E.forEach(([a, b], e) => { if(pin[a] && pin[b]) return; const d = sub(q[b], q[a]), l = len(d) || 1e-9, w = (l - L0[e])/l, fa = pin[a] ? 0 : pin[b] ? 1 : .5, fb = pin[b] ? 0 : pin[a] ? 1 : .5;
      for(let x = 0; x < 3; x++){ q[a][x] += d[x]*w*fa; q[b][x] -= d[x]*w*fb; } });
    P.forEach((p, i) => { for(let x = 0; x < 3; x++){ V[i][x] = (q[i][x] - p[x])*.9; p[x] = q[i][x]; } }); }
  flip(P, .4);
  g.fillStyle = "rgba(255,255,255,.07)"; for(let y = 8; y < H; y += 14) for(let x = 8; x < W; x += 14) g.fillRect(x, y, 1.2, 1.2);
  const box = (x, y, w, h, hot) => { g.fillStyle = hot ? U.rgba(c, .28) : "#2a2a34"; g.fillRect(x, y, w, h); g.fillStyle = hot ? U.rgba(c, .7) : "#3a3a46"; g.fillRect(x, y, w, h*.16);
    g.strokeStyle = hot ? c : U.rgba(c, .55); g.lineWidth = 1.2; g.strokeRect(x, y, w, h); };
  const wire = (a, b) => { g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(a[0], a[1]); g.bezierCurveTo(a[0] + W*.08, a[1], b[0] - W*.08, b[1], b[0], b[1]); g.stroke();
    g.fillStyle = "#fff"; [a, b].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 2.6, 0, TAU); g.fill(); }); };
  const gx = W*.05, gw = W*.2, gh = H*.15, sx = W*.38, sy = H*.28, sw = W*.2, sh = H*.44, px = W*.66, py = H*.2, pw = W*.3, ph = H*.6;
  [0, 1, 2, 3].forEach(k => { const y = H*(.08 + k*.225); box(gx, y, gw, gh, false); wire([gx + gw, y + gh*.58], [sx, sy + sh*(.25 + k*.17)]);
    const cx = gx + gw*.5, cy = y + gh*.6, s = gh*.28; g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 1.5; g.beginPath();
    if(k === 0){ g.moveTo(cx - s*1.3, cy); g.lineTo(cx + s*1.3, cy); g.stroke(); [-1, 1].forEach(t => { g.beginPath(); g.arc(cx + t*s*1.3, cy, 2.5, 0, TAU); g.fill(); }); }
    else if(k === 1){ g.moveTo(cx, cy - s); g.lineTo(cx - s, cy + s); g.lineTo(cx + s, cy + s); g.closePath(); g.fill(); }
    else if(k === 2){ g.arc(cx, cy + s*1.6, s*2, Math.PI*1.2, Math.PI*1.8); g.stroke(); [-.6, 0, .6].forEach(t => { g.beginPath(); g.arc(cx + t*s*1.5, cy + s*1.6 - Math.sqrt(4 - (t*1.5)**2)*s, 2, 0, TAU); g.fill(); }); }
    else { g.moveTo(cx, cy - s); g.lineTo(cx, cy + s*.6); g.stroke(); U.poly(g, [[cx - s*.6, cy + s*.3], [cx + s*.6, cy + s*.3], [cx, cy + s*1.1]], true); g.fill(); } });
  box(sx, sy, sw, sh, true);
  g.strokeStyle = "#fff"; g.lineWidth = 2; const scx = sx + sw/2, scy = sy + sh*.58, rr = sw*.25; g.beginPath(); g.arc(scx, scy, rr, -.3, Math.PI*1.6); g.stroke();
  const ea = Math.PI*1.6, ex = scx + Math.cos(ea)*rr, ey2 = scy + Math.sin(ea)*rr; U.poly(g, [[ex + 6, ey2 - 2], [ex - 3, ey2 - 6], [ex - 1, ey2 + 5]], true); g.fillStyle = "#fff"; g.fill();
  box(px, py, pw, ph, false); wire([sx + sw, sy + sh*.5], [px, py + ph*.5]);
  const prj = cam(px + pw/2, py + ph*.68, pw*.5, .6, .55, 1.2);
  g.strokeStyle = c; g.lineWidth = 1; g.beginPath(); E.forEach(([a, b]) => { const A = prj(P[a]), B = prj(P[b]); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); }); g.stroke();
};
ART.var["E04"][15].ratio = .8;

// ================= 無照片案例 =================

// E04-10 Barnes 動態鬆弛（kinetic damping）做預力膜的找形與分析：平面圖以色階顯示每格應力，邊索向內彎，兩支桅杆頂是高點，白線是等高線
ART.case["E04-10"] = function(g, W, H, r, c, U){
  const C = U.rgb(c), n = 23, m = 15, {P, E, Q} = net(n, m, 1.5, 1), id = (i, j) => j*n + i;
  const hiP = [id(6, 7), id(16, 7)], loP = [id(0, 0), id(n-1, 0), id(0, m-1), id(n-1, m-1), id(11, 0), id(11, m-1)], pin = P.map(() => 0);
  hiP.forEach(k => { pin[k] = 1; }); loP.forEach(k => { pin[k] = 1; });
  P.forEach(p => { p[2] = .5*Math.max(...hiP.map(h => Math.exp(-((p[0] - P[h][0])**2 + (p[1] - P[h][1])**2)/.06))); });
  hiP.forEach(k => { P[k][2] = .5; }); loP.forEach(k => { P[k][2] = 0; });
  const edge = edgeOf(E, n, m), L0 = E.map(([a, b], e) => len(sub(P[b], P[a]))*(edge[e] ? .85 : .55));
  let prev = 0;
  relax(P, E, pin, {L0, it:600, damp:1, ke:e => edge[e] ? 1 : .35, load:() => [0,0,0], post:(Q2, V) => {
    let e = 0; V.forEach(v => { e += v[0]*v[0] + v[1]*v[1] + v[2]*v[2]; }); const drop = e < prev; if(drop) V.forEach(v => { v[0] = v[1] = v[2] = 0; }); prev = drop ? 0 : e; }});
  const st = E.map(([a, b], e) => (len(sub(P[b], P[a])) - L0[e])/L0[e]), qs = Q.map(f => { const j = (f[0]/n)|0, i = f[0] % n, es = [];
    E.forEach(([a, b], e) => { if(f.includes(a) && f.includes(b)) es.push(st[e]); }); return es.reduce((s, x) => s + x, 0)/es.length; });
  const lo = Math.min(...qs), hi = Math.max(...qs), s = W*.6, tx = p => [W/2 + p[0]*s, H/2 + p[1]*s];
  Q.forEach((f, k) => { U.poly(g, f.map(i => tx(P[i])), true); g.fillStyle = css(ramp(C, Math.pow((qs[k] - lo)/((hi - lo) || 1), .8))); g.fill(); g.strokeStyle = g.fillStyle; g.lineWidth = .6; g.stroke(); });
  const at = (x, y) => { const i = clamp(Math.floor(x), 0, n-2), j = clamp(Math.floor(y), 0, m-2), u = x - i, v = y - j, a = P[id(i, j)], b = P[id(i+1, j)], cc = P[id(i+1, j+1)], d = P[id(i, j+1)];
    return [(a[0]*(1-u) + b[0]*u)*(1-v) + (d[0]*(1-u) + cc[0]*u)*v, (a[1]*(1-u) + b[1]*u)*(1-v) + (d[1]*(1-u) + cc[1]*u)*v, 0]; };
  g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = .8; g.beginPath();
  for(let z = .06; z < .5; z += .07) U.contour(n, m, (i, j) => P[id(i, j)][2], z).forEach(([a, b]) => { const A = tx(at(a[0], a[1])), B = tx(at(b[0], b[1])); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); });
  g.stroke();
  g.strokeStyle = "#fff"; g.lineWidth = 2.2; const ring = [];
  for(let i = 0; i < n; i++) ring.push(id(i, 0)); for(let j = 1; j < m; j++) ring.push(id(n-1, j)); for(let i = n-2; i >= 0; i--) ring.push(id(i, m-1)); for(let j = m-2; j > 0; j--) ring.push(id(0, j));
  U.poly(g, ring.map(k => tx(P[k])), true); g.stroke();
  hiP.forEach(k => { const q = tx(P[k]); g.lineWidth = 2; g.beginPath(); g.arc(q[0], q[1], 5, 0, TAU); g.stroke(); g.fillStyle = "#fff"; g.beginPath(); g.arc(q[0], q[1], 1.8, 0, TAU); g.fill(); });
  g.fillStyle = "#fff"; loP.forEach(k => { const q = tx(P[k]); g.fillRect(q[0] - 3, q[1] - 3, 6, 6); });
};
ART.case["E04-10"].ratio = .8;

// E04-12 大型懸浮漁網雕塑：纖維網外圈掛在周圍建築頂上的六個點，中央受重力垂成漏斗；夜間從廣場仰視
ART.case["E04-12"] = function(g, W, H, r, c, U){
  const C = U.rgb(c), PINK = [255, 95, 160], R = 10, S = 24, cy0 = .35, P = [[0, cy0, .55]], E = [], ring = [0], id = (k, s) => 1 + (k-1)*S + ((s % S) + S) % S;
  for(let k = 1; k <= R; k++) for(let s = 0; s < S; s++){ const a = s/S*TAU, rr = k/R*.55*(1 + .08*Math.sin(3*a)); P.push([Math.cos(a)*rr, cy0 + Math.sin(a)*rr, .55]); ring.push(k); }
  for(let s = 0; s < S; s++){ E.push([0, id(1, s)]); for(let k = 1; k <= R; k++){ E.push([id(k, s), id(k, s+1)]); if(k < R) E.push([id(k, s), id(k+1, s)]); } }
  const anc = [0, 4, 8, 11, 14, 20], pin = P.map(() => 0), hts = [.62, .78, .56, .9, .68, .6];
  anc.forEach((s, k) => { const i = id(R, s); pin[i] = 1; P[i][2] = hts[k]; });
  relax(P, E, pin, {rest:.92, it:600, k:.45, load:() => [0,0,-.0016]});
  const zl = Math.min(...P.map(p => p[2])), zt = .6; P.forEach((p, i) => { if(!pin[i]) p[2] = zt - (zt - p[2])/(zt - zl)*.62; });
  const ex = 0, ey = -1.25, ez = -.45, pt = .42, cp = Math.cos(pt), spn = Math.sin(pt), fo = W*.95;
  const prj = p => { const dx = p[0] - ex, dy = p[1] - ey, dz = p[2] - ez, y = dy*cp + dz*spn, z = -dy*spn + dz*cp; return [W/2 + dx/y*fo, H*.62 - z/y*fo]; };
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#1d2046"); sky.addColorStop(.7, "#15152a"); sky.addColorStop(1, "#0e0e14"); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // 建築：錨點在屋頂角上，往外延伸成方塊
  const blds = anc.map((s, k) => { const a = s/S*TAU, p = P[id(R, s)], ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux, w = .22, dep = .45;
    const c0 = [p[0] - vx*w, p[1] - vy*w], c1 = [p[0] + vx*w, p[1] + vy*w], c2 = [c1[0] + ux*dep, c1[1] + uy*dep], c3 = [c0[0] + ux*dep, c0[1] + uy*dep];
    return {q:[c0, c1, c2, c3], z:p[2] + .04, d:Math.hypot(p[0] - ex, p[1] - ey)}; }).sort((a, b) => b.d - a.d);
  const zb = -1.2;
  blds.forEach(b => { for(let e = 0; e < 4; e++){ const a = b.q[e], d = b.q[(e+1)%4], mx = (a[0] + d[0])/2 - ex, my = (a[1] + d[1])/2 - ey, nx = d[1] - a[1], ny = -(d[0] - a[0]);
      if(nx*mx + ny*my > 0) continue;
      const quad = [[a[0], a[1], zb], [d[0], d[1], zb], [d[0], d[1], b.z], [a[0], a[1], b.z]].map(prj); U.poly(g, quad, true); g.fillStyle = e % 2 ? "#101019" : "#15151f"; g.fill();
      for(let u = .12; u < .9; u += .19) for(let v = .08; v < .95; v += .09){ if(r() < .45) continue; const P3 = [a[0] + (d[0] - a[0])*u, a[1] + (d[1] - a[1])*u, zb + (b.z - zb)*v], q = prj(P3);
        g.fillStyle = r() < .5 ? U.rgba(c, .55) : "rgba(255,236,200,.35)"; g.fillRect(q[0] - 1.2, q[1] - 1, 2.4, 2); } }
    U.poly(g, b.q.map(q => prj([q[0], q[1], b.z])), true); g.fillStyle = "#1c1c28"; g.fill(); });
  const glow = (lw, al) => E.forEach(([a, b]) => { const A = prj(P[a]), B = prj(P[b]), t = (ring[a] + ring[b])/2/R; g.strokeStyle = css(mix(PINK, C, t), al); g.lineWidth = lw; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); });
  g.lineCap = "round"; glow(4, .1); glow(1.1, .9);
  g.fillStyle = "#fff"; anc.forEach(s => { const q = prj(P[id(R, s)]); g.beginPath(); g.arc(q[0], q[1], 2.4, 0, TAU); g.fill(); });
};
ART.case["E04-12"].ratio = 1.25;

// E04-09 Kangaroo Physics 早期示範的示意：Rhino 透視視窗（灰階漸層底、工作平面格線、紅綠軸），
// 四個錨點各用一條彈簧（鋸齒線）吊住一片質點網的四角，網在重力下垂成兜狀；虛線是幾個質點在求解過程中上下擺盪的軌跡
ART.case["E04-09"] = function(g, W, H, r, c, U){
  const C = U.rgb(c), n = 8, {P, E} = net(n, n, 1, 1), N0 = P.length, sp = [];
  P.forEach(p => { p[2] = .62; });
  const corner = [0, n-1, n*n-1, n*(n-1)], dir = [[-1,-1], [1,-1], [1,1], [-1,1]];
  corner.forEach((k, a) => { P.push([dir[a][0]*.68, dir[a][1]*.68, 1.2]); sp.push(E.length); E.push([N0 + a, k]); });
  const pin = P.map((_, i) => i >= N0 ? 1 : 0), isSp = E.map((_, e) => sp.includes(e));
  const L0 = E.map(([a, b], e) => len(sub(P[b], P[a]))*(isSp[e] ? .5 : 1));
  const track = [(n>>1)*n + (n>>1), (n>>1)*n + 1, 2*n + (n>>1)], trail = track.map(() => []);
  relax(P, E, pin, {L0, it:400, damp:.97, ke:e => isSp[e] ? .35 : 2.4, load:(i) => i < N0 ? [0,0,-.0026] : [0,0,0],
    post:(Q, V, s) => { if(s % 3 === 0 && s < 240) track.forEach((k, t) => trail[t].push(Q[k].slice())); }});
  // 視窗外框：上方工具列、左側工具列、下方狀態列
  g.fillStyle = "#24242c"; g.fillRect(0, 0, W, H);
  const tb = H*.075, lb = W*.06, vx0 = lb + 2, vy0 = tb + 2, vx1 = W - 3, vy1 = H - H*.07;
  const ico = ["#c9c9d1", "#8fa3c9", "#c9c9d1", "#d7a64a", "#c9c9d1", "#7fb07f", "#c9c9d1", "#b98ad0", "#c9c9d1", "#c9c9d1"];
  ico.forEach((col, k) => { g.fillStyle = col; g.globalAlpha = .55; g.fillRect(lb + 4 + k*(tb*.95), tb*.22, tb*.62, tb*.56); });
  for(let k = 0; k < 9; k++){ g.fillStyle = ico[(k*3) % ico.length]; g.fillRect(lb*.2, vy0 + 4 + k*(lb*.95), lb*.6, lb*.6); }
  g.globalAlpha = 1;
  g.fillStyle = "#1b1b21"; g.fillRect(0, vy1 + 2, W, H - vy1 - 2);
  for(let k = 0; k < 6; k++){ g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(W*.05 + k*W*.13, vy1 + (H - vy1)*.35, 5, 5); g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(W*.05 + k*W*.13 + 8, vy1 + (H - vy1)*.42, W*.07, 2); }
  // 透視視窗：灰階漸層底
  const bg = g.createLinearGradient(0, vy0, 0, vy1); bg.addColorStop(0, "#9a9ca3"); bg.addColorStop(1, "#5c5e66");
  g.fillStyle = bg; g.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
  g.save(); g.beginPath(); g.rect(vx0, vy0, vx1 - vx0, vy1 - vy0); g.clip();
  const prj = cam((vx0 + vx1)/2, vy0 + (vy1 - vy0)*.8, (vx1 - vx0)*.36, .3, .5, 1.05);
  // 工作平面格線
  for(let k = -10; k <= 10; k++){ const t = k/10*1.2, major = k % 5 === 0;
    g.strokeStyle = major ? "rgba(60,62,70,.55)" : "rgba(80,82,90,.35)"; g.lineWidth = major ? 1 : .7;
    let a = prj([t, -1.2, 0]), b = prj([t, 1.2, 0]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    a = prj([-1.2, t, 0]); b = prj([1.2, t, 0]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  const o = prj([0, 0, 0]), ex = prj([1.2, 0, 0]), ey = prj([0, 1.2, 0]);
  g.lineWidth = 1.4; g.strokeStyle = "#b3322c"; g.beginPath(); g.moveTo(o[0], o[1]); g.lineTo(ex[0], ex[1]); g.stroke();
  g.strokeStyle = "#2f8f3a"; g.beginPath(); g.moveTo(o[0], o[1]); g.lineTo(ey[0], ey[1]); g.stroke();
  // 網在地面的投影（淡影）
  g.fillStyle = "rgba(40,40,48,.18)";
  const ring = []; for(let i = 0; i < n; i++) ring.push(i); for(let j = 1; j < n; j++) ring.push(j*n + n-1); for(let i = n-2; i >= 0; i--) ring.push((n-1)*n + i); for(let j = n-2; j > 0; j--) ring.push(j*n);
  U.poly(g, ring.map(k => prj([P[k][0], P[k][1], 0])), true); g.fill();
  // 錨點的垂直參考線
  g.setLineDash([2, 3]); g.strokeStyle = "rgba(40,40,48,.45)"; g.lineWidth = .8;
  for(let a = 0; a < 4; a++){ const t = prj(P[N0 + a]), b = prj([P[N0 + a][0], P[N0 + a][1], 0]); g.beginPath(); g.moveTo(t[0], t[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  g.setLineDash([]);
  // 求解過程的擺盪軌跡
  g.strokeStyle = css(mix(C, WHITE, .2), .85); g.lineWidth = 1; g.setLineDash([2, 2]);
  trail.forEach(tr => { U.poly(g, tr.map(p => prj(p))); g.stroke(); }); g.setLineDash([]);
  // 質點網（線框）：由遠到近
  E.map((e, k) => k).filter(k => !isSp[k]).sort((a, b) => prj.depth(P[E[b][0]]) - prj.depth(P[E[a][0]])).forEach(k => {
    const A = prj(P[E[k][0]]), B = prj(P[E[k][1]]); g.strokeStyle = "#202027"; g.lineWidth = 1.1; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); });
  // 吊住四角的彈簧：鋸齒線
  sp.forEach(e => { const A = prj(P[E[e][0]]), B = prj(P[E[e][1]]), dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, nx = -dy/l, ny = dx/l, turns = 9, w = W*.013;
    g.strokeStyle = css(mix(C, DARK, .15)); g.lineWidth = 1.2; g.beginPath(); g.moveTo(A[0], A[1]);
    for(let t = 1; t < turns*2; t++){ const u = .1 + .8*t/(turns*2), s2 = t % 2 ? 1 : -1; g.lineTo(A[0] + dx*u + nx*w*s2, A[1] + dy*u + ny*w*s2); }
    g.lineTo(B[0], B[1]); g.stroke(); });
  // 質點（Rhino 點的小方塊）與錨點（選取中的黃色）
  P.forEach((p, i) => { const q = prj(p); if(i < N0){ g.fillStyle = "#15151a"; g.fillRect(q[0] - 1.6, q[1] - 1.6, 3.2, 3.2); }
    else { g.fillStyle = css(mix(C, WHITE, .35)); g.fillRect(q[0] - 3, q[1] - 3, 6, 6); g.strokeStyle = "#15151a"; g.lineWidth = 1; g.strokeRect(q[0] - 3, q[1] - 3, 6, 6); } });
  // 視窗左下角的座標軸圖示
  const ax = vx0 + W*.06, ay = vy1 - H*.07, axl = W*.045;
  [["#c0392b", [1, 0, 0]], ["#2e9a3e", [0, 1, 0]], ["#2f5fc4", [0, 0, 1]]].forEach(([col, v]) => { const a = prj([0, 0, 0]), b = prj(v);
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + dx/l*axl, ay + dy/l*axl); g.stroke(); });
  g.restore();
  // 視窗名稱頁籤（不寫字，只畫出頁籤形狀）
  g.fillStyle = "rgba(255,255,255,.28)"; g.fillRect(vx0 + 4, vy0 + 4, W*.2, H*.045);
  g.fillStyle = "rgba(20,20,26,.6)"; g.fillRect(vx0 + 8, vy0 + 4 + H*.018, W*.12, 2);
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.strokeRect(vx0 + .5, vy0 + .5, vx1 - vx0 - 1, vy1 - vy0 - 1);
};
ART.case["E04-09"].ratio = .85;
})();
