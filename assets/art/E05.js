/* E05 圖解靜力學（索多邊形與力圖）：基本生成器（變形與案例的獨立畫法由 gh-enrich 的 ART 單元補上） */
(function(){
const ART = window.ART, U = window.GENUTIL;
// 真實作圖：載重線 → 試算極點 → 閉合線定 K → 由矢高反推極距 → 平行射線畫索多邊形
U.GEN["E05"] = function(g, W, H, r, v, c){
  const n = 5 + (v % 5), arch = v % 2 === 1, span = 1;
  const xs = [], P = []; let tot = 0;
  for(let i = 0; i < n; i++){ xs.push(span*(i+.5)/n); const p = Math.max(.15, 1 + .7*(r()*2-1)); P.push(p); tot += p; }
  const fs = .8/tot, ox = 1.35, L = [[ox, 0]];
  for(let i = 0; i < n; i++) L.push([ox, L[i][1] - P[i]*fs]);
  const side = arch ? -1 : 1;
  const fun = (O) => { const pts = [[0,0]]; let cx = 0, cy = 0;
    for(let j = 0; j <= n; j++){ let dx = O[0]-L[j][0], dy = O[1]-L[j][1]; if(dx < 0){ dx = -dx; dy = -dy; }
      const nx = j < n ? xs[j] : span; cy += (nx - cx)/dx*dy; cx = nx; pts.push([cx, cy]); }
    return pts; };
  const tH = .35, tO = [ox + side*tH, L[n][1]/2], tr = fun(tO), s = tr[n+1][1]/span;
  const kY = tO[1] + s*(ox - tO[0]);
  let md = 0; for(let k = 1; k <= n; k++) md = Math.max(md, Math.abs(tr[k][1] - s*tr[k][0]));
  const sag = .28 + .1*((v >> 1) % 3), Hp = tH*md/sag, O = [ox + side*Hp, kY], F = fun(O);
  // 版面：左形狀圖、右力圖（拱的極點在載重線左側，整張力圖往右平移避免重疊）
  const sh = Math.max(0, span + .22 - O[0]);
  const minX = -.08, maxX = Math.max(ox, O[0]) + sh + .08, minY = Math.min(-.85, arch ? -.1 : -sag) - .12, maxY = (arch ? sag : .1) + .22;
  const sc = Math.min(W/(maxX-minX), H/(maxY-minY))*.92, offX = (W - (maxX-minX)*sc)/2, offY = (H - (maxY-minY)*sc)/2;
  const X = x => offX + (x - minX)*sc, Y = y => offY + (maxY - y)*sc;
  const hues = [...Array(n+1)].map((_,j) => j/n);
  const col = t => `hsla(${(190 + t*150) % 360},70%,${62 - t*8}%,0.95)`;
  // 支承連線與地面
  g.strokeStyle = U.rgba("#ffffff", .25); g.lineWidth = 1; g.setLineDash([3,4]);
  g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(span), Y(0)); g.stroke();
  // 試算索多邊形（淡）
  g.strokeStyle = U.rgba(c, .25); g.beginPath(); tr.forEach((p,i) => i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))); g.stroke();
  g.setLineDash([]);
  // 載重箭頭
  g.strokeStyle = U.rgba("#ffffff", .7); g.fillStyle = U.rgba("#ffffff", .7); g.lineWidth = 1.2;
  for(let i = 0; i < n; i++){ const tx = X(F[i+1][0]), ty = Y(F[i+1][1]), len = P[i]*fs*sc*.55;
    g.beginPath(); g.moveTo(tx, ty - len - 4); g.lineTo(tx, ty - 4); g.stroke();
    g.beginPath(); g.moveTo(tx, ty - 1); g.lineTo(tx - 3, ty - 7); g.lineTo(tx + 3, ty - 7); g.closePath(); g.fill(); }
  // 索多邊形：顏色與力圖射線一一對應，線寬代表內力
  const forces = L.map(l => Math.hypot(O[0]-l[0], O[1]-l[1])), fMax = Math.max(...forces);
  for(let j = 0; j <= n; j++){ g.strokeStyle = col(hues[j]); g.lineWidth = 1 + 5*forces[j]/fMax; g.lineCap = "round";
    g.beginPath(); g.moveTo(X(F[j][0]), Y(F[j][1])); g.lineTo(X(F[j+1][0]), Y(F[j+1][1])); g.stroke(); }
  // 支承三角
  g.fillStyle = c; [[0,0],[span,0]].forEach(([x,y]) => { g.beginPath(); g.moveTo(X(x), Y(y)); g.lineTo(X(x)-6, Y(y)+(arch?9:-9)); g.lineTo(X(x)+6, Y(y)+(arch?9:-9)); g.closePath(); g.fill(); });
  const FX = x => X(x + sh);
  // 力圖：載重線、射線、極點
  g.lineWidth = 1.2;
  for(let j = 0; j <= n; j++){ g.strokeStyle = col(hues[j]); g.beginPath(); g.moveTo(FX(O[0]), Y(O[1])); g.lineTo(FX(L[j][0]), Y(L[j][1])); g.stroke(); }
  g.strokeStyle = "#ffffff"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(FX(L[0][0]), Y(L[0][1])); g.lineTo(FX(L[n][0]), Y(L[n][1])); g.stroke();
  g.fillStyle = "#ffffff"; L.forEach(l => { g.beginPath(); g.arc(FX(l[0]), Y(l[1]), 2, 0, U.TAU); g.fill(); });
  g.strokeStyle = U.rgba(c, .5); g.setLineDash([2,3]); g.lineWidth = 1; g.beginPath(); g.moveTo(FX(O[0]), Y(kY)); g.lineTo(FX(ox), Y(kY)); g.stroke(); g.setLineDash([]);
  g.fillStyle = c; g.beginPath(); g.arc(FX(O[0]), Y(O[1]), 4, 0, U.TAU); g.fill();
};
ART.var["E05"] = ART.var["E05"] || [];
})();

/* E05 圖解靜力學：變形與無照片案例的獨立畫法（gh-enrich ART 單元補上） */
(function(){
const ART = window.ART, U = window.GENUTIL;
ART.var["E05"] = ART.var["E05"] || [];

/* ---------------- 共用：索多邊形核心構造 ----------------
   與基本生成器同一套「載重線→試算極點→K 點→反推真極距→平行射線畫索多邊形」的方法，
   拆成可重用的函式，讓各張變形／案例卡都能用真的圖解靜力學幾何，只是設定不同。 */
function genLoads(r, n, span){
  const xs = [], P = []; let tot = 0;
  for(let i = 0; i < n; i++){ xs.push(span*(i+.5)/n); const p = Math.max(.15, 1 + .7*(r()*2-1)); P.push(p); tot += p; }
  return {xs, P, tot};
}
function funFromLoads(xs, P, tot, o){
  o = o || {};
  const n = xs.length, span = o.span != null ? o.span : 1, arch = !!o.arch, sagK = o.sag != null ? o.sag : .28;
  const fs = .8/tot, ox = o.ox != null ? o.ox : 1.35, L = [[ox, 0]];
  for(let i = 0; i < n; i++) L.push([ox, L[i][1] - P[i]*fs]);
  const side = arch ? -1 : 1;
  const fun = (O) => { const pts = [[0, 0]]; let cx = 0, cy = 0;
    for(let j = 0; j <= n; j++){ let dx = O[0]-L[j][0], dy = O[1]-L[j][1]; if(dx < 0){ dx = -dx; dy = -dy; }
      const nx = j < n ? xs[j] : span; cy += (nx - cx)/dx*dy; cx = nx; pts.push([cx, cy]); }
    return pts; };
  const tH = .35, tO = [ox + side*tH, L[n][1]/2], tr = fun(tO), s = tr[n+1][1]/span;
  const kY = tO[1] + s*(ox - tO[0]);
  let md = 0; for(let k = 1; k <= n; k++) md = Math.max(md, Math.abs(tr[k][1] - s*tr[k][0]));
  const Hp = tH*md/sagK, O = [ox + side*Hp, kY], F = fun(O);
  const forces = L.map(l => Math.hypot(O[0]-l[0], O[1]-l[1]));
  return {xs, P, L, O, F, forces, fs, span, n};
}
function core(r, n, o){ const g = genLoads(r, n, (o && o.span) || 1); return funFromLoads(g.xs, g.P, g.tot, o); }

function fitXY(W, H, minX, maxX, minY, maxY, pad, zoom){
  pad = pad || 0; zoom = zoom || .92;
  const sc = Math.min(W/(maxX-minX+2*pad), H/(maxY-minY+2*pad))*zoom;
  const offX = W/2 - (minX+maxX)/2*sc, offY = H/2 + (minY+maxY)/2*sc;
  return { X: x => offX + x*sc, Y: y => offY - y*sc, sc };
}
function strokePoly(g, pts, X, Y, color, lw, dash){
  g.setLineDash(dash || []); g.strokeStyle = color; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))); g.stroke(); g.setLineDash([]);
}
function loadArrow(g, x, y, len, ang, color){ // ang：0 = 垂直向下
  const dx = Math.sin(ang)*len, dy = Math.cos(ang)*len;
  g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 1.3;
  g.beginPath(); g.moveTo(x - dx, y - dy); g.lineTo(x - dx*.14, y - dy*.14); g.stroke();
  const hx = x - dx*.14, hy = y - dy*.14, px = -dy, py = dx, pl = Math.hypot(px, py) || 1;
  g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - dx*.24 + px/pl*3, hy - dy*.24 + py/pl*3); g.lineTo(hx - dx*.24 - px/pl*3, hy - dy*.24 - py/pl*3); g.closePath(); g.fill();
}
function supportTri(g, x, y, flip, color){ g.fillStyle = color; g.beginPath(); g.moveTo(x, y); g.lineTo(x-6, y+(flip?-9:9)); g.lineTo(x+6, y+(flip?-9:9)); g.closePath(); g.fill(); }
function dot(g, x, y, rad, color){ g.fillStyle = color; g.beginPath(); g.arc(x, y, rad, 0, U.TAU); g.fill(); }
function hueCol(t, l){ return `hsla(${(190 + t*150) % 360},70%,${l || (62 - t*8)}%,0.95)`; }

/* ---------------- 共用：繪圖小工具（imgfix 重畫：每張卡用不同版面與填色量體） ---------------- */
function pth(g, pts){ g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); }
function fillP(g, pts, col){ pth(g, pts); g.closePath(); g.fillStyle = col; g.fill(); }
function lineP(g, pts, col, lw, close, dash){ pth(g, pts); if(close) g.closePath(); g.setLineDash(dash || []); g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = "round"; g.lineCap = "round"; g.stroke(); g.setLineDash([]); }
function seg(g, x0, y0, x1, y1, col, lw, dash){ lineP(g, [[x0, y0], [x1, y1]], col, lw, false, dash); }
function glow(g, x, y, rad, col, a){ const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, U.rgba(col, a)); gr.addColorStop(1, U.rgba(col, 0)); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad*2, rad*2); }
function hatchIn(g, pts, gap, ang, col, lw){ // 在多邊形內畫平行斜線（剖面線）
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  pts.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
  g.save(); pth(g, pts); g.closePath(); g.clip();
  const cx = (x0 + x1)/2, cy = (y0 + y1)/2, R = Math.hypot(x1 - x0, y1 - y0)/2 + 2, ca = Math.cos(ang), sa = Math.sin(ang);
  g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
  for(let s = -R; s <= R; s += gap){ g.moveTo(cx - sa*s - ca*R, cy + ca*s - sa*R); g.lineTo(cx - sa*s + ca*R, cy + ca*s + sa*R); }
  g.stroke(); g.restore();
}
function arrow(g, x0, y0, x1, y1, col, lw, hd){
  hd = hd || 5; seg(g, x0, y0, x1, y1, col, lw); const a = Math.atan2(y1 - y0, x1 - x0);
  g.fillStyle = col; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - Math.cos(a - .45)*hd, y1 - Math.sin(a - .45)*hd); g.lineTo(x1 - Math.cos(a + .45)*hd, y1 - Math.sin(a + .45)*hd); g.closePath(); g.fill();
}
function tone(hex, k, a){ // k < 1 變暗、k > 1 往白色混
  const [R, G, B] = U.rgb(hex), f = v => Math.round(k <= 1 ? v*k : v + (255 - v)*(k - 1));
  return `rgba(${f(R)},${f(G)},${f(B)},${a == null ? 1 : a})`;
}
function solve(A, b){ // 高斯消去（部分主元）
  const n = b.length, M = A.map((row, i) => row.concat([b[i]]));
  for(let k = 0; k < n; k++){
    let p = k; for(let i = k + 1; i < n; i++) if(Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    const tmp = M[k]; M[k] = M[p]; M[p] = tmp; const d = M[k][k] || 1e-12;
    for(let i = k + 1; i < n; i++){ const f = M[i][k]/d; if(f) for(let j = k; j <= n; j++) M[i][j] -= f*M[k][j]; }
  }
  const x = new Array(n).fill(0);
  for(let i = n - 1; i >= 0; i--){ let s = M[i][n]; for(let j = i + 1; j < n; j++) s -= M[i][j]*x[j]; x[i] = s/(M[i][i] || 1e-12); }
  return x;
}
// 簡支梁彎矩：索多邊形離閉合線的縱距 = M / 水平推力
function moments(xs, P){
  const RA = P.reduce((s, p, i) => s + p*(1 - xs[i]), 0);
  const M = x => RA*x - P.reduce((s, p, i) => s + (xs[i] < x ? p*(x - xs[i]) : 0), 0);
  return {RA, M};
}
const cross3 = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const nrm3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };

// =================== 變形（索引對應 variations，0 起算） ===================

// V01 不等高支承與三點通過：坡地步道橋的地形剖面（左岸低、右岸高），索通過指定的第三點；左上角附閉合線斜向的力圖
ART.var["E05"][0] = function(g, W, H, r, c, U){
  const n = 6, xs = [], P = [];
  for(let i = 0; i < n; i++){ xs.push((i + .5)/n); P.push(.6 + .8*r()); }
  const tot = P.reduce((a, b) => a + b, 0), {RA, M} = moments(xs, P);
  const A = [W*.2, H*.6], B = [W*.86, H*.3], span = B[0] - A[0], slope = (B[1] - A[1])/span;
  const k = 2 + Math.floor(r()*2), depth = H*(.3 + .05*r());
  const Hh = M(xs[k])*span/depth;                        // 由通過點的縱距反推水平推力
  const pts = [A].concat(xs.map(x => [A[0] + x*span, A[1] + slope*x*span + M(x)*span/Hh]), [B]);
  // 地形剖面（剖面線填滿）
  const low = Math.max(...pts.map(p => p[1])) + H*.07;
  const ground = [[0, A[1]], [A[0] + 3, A[1]], [A[0] + span*.1, A[1] + H*.1], [A[0] + span*.28, low], [A[0] + span*.5, low + H*.03],
    [A[0] + span*.7, low - H*.08], [A[0] + span*.84, B[1] + H*.18], [B[0] - 3, B[1]], [W, B[1]], [W, H], [0, H]];
  const gg = g.createLinearGradient(0, B[1], 0, H); gg.addColorStop(0, U.rgba(c, .3)); gg.addColorStop(1, U.rgba(c, .1));
  fillP(g, ground, gg); hatchIn(g, ground, 5, Math.PI/4, U.rgba(c, .22), .8);
  lineP(g, ground.slice(0, 10), U.rgba(c, .9), 1.4);
  // 閉合線 A→B 與通過點縱距
  seg(g, A[0], A[1], B[0], B[1], U.rgba("#ffffff", .35), 1, [3, 3]);
  const pk = pts[k + 1], ck = A[1] + slope*(pk[0] - A[0]);
  seg(g, pk[0], ck, pk[0], pk[1], U.rgba("#ffffff", .6), 1, [2, 2]);
  // 步道：索＝橋面，上方欄杆
  lineP(g, pts.map(p => [p[0], p[1] - 7]), U.rgba("#ffffff", .45), 1);
  pts.forEach(p => seg(g, p[0], p[1], p[0], p[1] - 7, U.rgba("#ffffff", .35), 1));
  lineP(g, pts, c, 3.2);
  pts.slice(1, -1).forEach((p, i) => arrow(g, p[0], p[1] - 20 - P[i]*6, p[0], p[1] - 9, U.rgba("#ffffff", .7), 1, 4));
  g.strokeStyle = "#ffffff"; g.lineWidth = 1.4; g.beginPath(); g.arc(pk[0], pk[1], 6, 0, U.TAU); g.stroke();
  seg(g, pk[0] - 10, pk[1], pk[0] + 10, pk[1], "#ffffff", 1.1); seg(g, pk[0], pk[1] - 10, pk[0], pk[1] + 10, "#ffffff", 1.1);
  supportTri(g, A[0], A[1], false, c); supportTri(g, B[0], B[1], false, c);
  // 力圖：載重線、極點、平行於 A→B 的閉合線
  const fsc = H*.4/tot, lx = W*.06, ly0 = H*.05, hp = Hh*fsc;
  const O = [lx + hp, ly0 + slope*hp + RA*fsc], L = [[lx, ly0]]; P.forEach(p => L.push([lx, L[L.length - 1][1] + p*fsc]));
  L.forEach(l => seg(g, O[0], O[1], l[0], l[1], U.rgba("#ffffff", .45), .9));
  seg(g, lx, L[0][1], lx, L[n][1], "#ffffff", 2);
  seg(g, O[0], O[1], lx, ly0 + RA*fsc, c, 1.2, [2, 2]);
  dot(g, O[0], O[1], 2.6, c);
};

// V02 斜向與任意方向載重：左側是隨高度增大的風壓剖面，拱的推力線偏向下風側（虛線為無風時）；右上是折線載重線的力圖
ART.var["E05"][1] = function(g, W, H, r, c, U){
  const gy = H*.9, n = 6;
  const prof = []; for(let i = 0; i <= 12; i++){ const t = i/12; prof.push([W*.04 + W*.27*Math.pow(t, .4), gy - t*(gy - H*.08)]); }
  const wedge = [[W*.04, gy]].concat(prof, [[W*.04, H*.08]]);
  const wg = g.createLinearGradient(W*.04, 0, W*.32, 0); wg.addColorStop(0, "rgba(120,190,255,.42)"); wg.addColorStop(1, "rgba(120,190,255,.07)");
  fillP(g, wedge, wg); lineP(g, prof, "rgba(150,210,255,.85)", 1.2);
  for(let i = 2; i <= 12; i += 2){ const p = prof[i]; arrow(g, W*.04, p[1], p[0] - 1, p[1], "rgba(150,210,255,.75)", 1, 4); }
  g.fillStyle = U.rgba("#ffffff", .06); g.fillRect(0, gy, W, H - gy); seg(g, 0, gy, W, gy, U.rgba("#ffffff", .35), 1);
  // 一般方向載重的索多邊形：站位固定，射線方向取自極點到載重線各點
  const xs = [0]; for(let i = 0; i < n; i++) xs.push((i + .5)/n); xs.push(1);
  const Pg = []; for(let i = 0; i < n; i++) Pg.push(.7 + .5*r());
  const FvW = Pg.map((p, i) => [p*(i < n/2 ? .5 : .18), -p]), Fv0 = Pg.map(p => [0, -p]);
  const run = (Fv, Ox, Oy) => { let Lx = 0, Ly = 0; const pts = [[0, 0]];
    for(let j = 0; j <= n; j++){ const rx = Lx - Ox, ry = Ly - Oy; pts.push([xs[j + 1], pts[j][1] + (xs[j + 1] - xs[j])*ry/rx]); if(j < n){ Lx += Fv[j][0]; Ly += Fv[j][1]; } }
    return pts; };
  const solveArch = (Fv, rise) => {
    const close = Ox => { const e0 = run(Fv, Ox, 0)[n + 1][1], e1 = run(Fv, Ox, -1)[n + 1][1]; return -e0/(e0 - e1); };
    let lo = -10, hi = -.05;
    for(let it = 0; it < 28; it++){ const m = (lo + hi)/2; if(Math.max(...run(Fv, m, close(m)).map(p => p[1])) > rise) hi = m; else lo = m; }
    const Ox = (lo + hi)/2, Oy = close(Ox); return {Ox, Oy, F: run(Fv, Ox, Oy)};
  };
  const aw = solveArch(FvW, .72), a0 = solveArch(Fv0, .72);
  const sx = W*.36, sw = W*.56, X = x => sx + x*sw, Y = y => gy - y*sw;
  lineP(g, a0.F.map(p => [X(p[0]), Y(p[1])]), U.rgba("#ffffff", .35), 1.2, false, [3, 3]);
  const ap = aw.F.map(p => [X(p[0]), Y(p[1])]);
  lineP(g, ap, U.rgba(c, .3), 9); lineP(g, ap, c, 2.6);
  ap.slice(1, -1).forEach((p, i) => { arrow(g, p[0], p[1] - 16, p[0], p[1] - 4, U.rgba("#ffffff", .75), 1, 3.5); arrow(g, p[0] - 6 - FvW[i][0]*14, p[1], p[0] - 4, p[1], "rgba(150,210,255,.9)", 1, 3.5); dot(g, p[0], p[1], 1.8, "#ffffff"); });
  supportTri(g, X(0), gy, false, c); supportTri(g, X(1), gy, false, c);
  // 力圖：折線載重線
  const Lp = [[0, 0]]; FvW.forEach(f => Lp.push([Lp[Lp.length - 1][0] + f[0], Lp[Lp.length - 1][1] + f[1]]));
  const all = Lp.concat([[aw.Ox, aw.Oy]]); let mx0 = 1e9, mx1 = -1e9, my0 = 1e9, my1 = -1e9;
  all.forEach(p => { mx0 = Math.min(mx0, p[0]); mx1 = Math.max(mx1, p[0]); my0 = Math.min(my0, p[1]); my1 = Math.max(my1, p[1]); });
  const fs = Math.min(W*.3/(mx1 - mx0 || 1), H*.34/(my1 - my0 || 1)), FX = x => W*.66 + (x - mx0)*fs, FY = y => H*.05 + (my1 - y)*fs;
  Lp.forEach(l => seg(g, FX(aw.Ox), FY(aw.Oy), FX(l[0]), FY(l[1]), U.rgba(c, .6), .9));
  lineP(g, Lp.map(l => [FX(l[0]), FY(l[1])]), "#ffffff", 2);
  Lp.forEach(l => dot(g, FX(l[0]), FY(l[1]), 1.6, "#ffffff")); dot(g, FX(aw.Ox), FY(aw.Oy), 2.8, c);
};

// V03 自重迭代逼近懸鏈線：懸吊模型（木梁＋鏈條＋依段長配重的小袋），淡線是前幾輪；下方長條是每輪形狀差的收斂
ART.var["E05"][2] = function(g, W, H, r, c, U){
  const n = 10, xs = []; for(let i = 0; i < n; i++) xs.push((i + .5)/n);
  const its = [], diffs = []; let P = xs.map(() => 1);
  for(let it = 0; it < 6; it++){
    const d = funFromLoads(xs, P, P.reduce((a, b) => a + b, 0), {sag: .78});
    if(it) diffs.push(Math.max(...d.F.map((p, i) => Math.abs(p[1] - its[it - 1][i][1]))) + 1e-6);
    its.push(d.F);
    const len = []; for(let j = 0; j <= n; j++) len.push(Math.hypot(d.F[j + 1][0] - d.F[j][0], d.F[j + 1][1] - d.F[j][1]));
    P = xs.map((x, i) => (len[i] + len[i + 1])/2);   // 每段一半分給兩端節點
  }
  const by = H*.09, sx = W*.13, sw = W*.74, X = x => sx + x*sw, Y = y => by + 6 - y*sw;
  // 木梁與掛鉤
  fillP(g, [[W*.04, by - 6], [W*.96, by - 6], [W*.96, by + 3], [W*.04, by + 3]], "rgba(200,168,120,.55)");
  hatchIn(g, [[W*.04, by - 6], [W*.96, by - 6], [W*.96, by + 3], [W*.04, by + 3]], 3, 0, "rgba(120,90,50,.5)", .6);
  its.forEach((F, it) => { if(it < its.length - 1) lineP(g, F.map(p => [X(p[0]), Y(p[1])]), U.rgba("#ffffff", .12 + .08*it), 1); });
  const F = its[its.length - 1], pts = F.map(p => [X(p[0]), Y(p[1])]);
  lineP(g, pts, c, 2.4);
  pts.slice(1, -1).forEach((p, i) => { const h = 4 + P[i]*40; seg(g, p[0], p[1], p[0], p[1] + 4, U.rgba("#ffffff", .5), .8);
    fillP(g, [[p[0] - 2.5, p[1] + 4], [p[0] + 2.5, p[1] + 4], [p[0] + 3.2, p[1] + 4 + h*.18], [p[0] - 3.2, p[1] + 4 + h*.18]], "rgba(230,215,180,.75)");
    dot(g, p[0], p[1], 1.8, "#ffffff"); });
  dot(g, pts[0][0], pts[0][1], 2.6, "#ffffff"); dot(g, pts[n + 1][0], pts[n + 1][1], 2.6, "#ffffff");
  // 收斂長條圖（每輪最大形狀差，對數尺度）
  const bx0 = W*.08, bx1 = W*.92, bb = H*.95, bh = H*.2, bw = (bx1 - bx0)/diffs.length;
  const lg = diffs.map(d => Math.log10(d)), lmax = Math.max(...lg), lmin = Math.min(...lg) - .6;
  diffs.forEach((d, i) => { const h = bh*(lg[i] - lmin)/(lmax - lmin || 1);
    g.fillStyle = U.rgba(c, .75 - .1*i); g.fillRect(bx0 + i*bw + 2, bb - h, bw - 4, h); });
  seg(g, bx0, bb, bx1, bb, U.rgba("#ffffff", .5), 1);
  seg(g, bx0, bb - bh*.12, bx1, bb - bh*.12, U.rgba("#ffffff", .45), 1, [2, 3]);
};

// V04 推力線放進拱厚：石砌牆面上的弧拱立面，最小／最大推力兩條推力線，紅點為可能形成鉸的位置
ART.var["E05"][3] = function(g, W, H, r, c, U){
  const xL = W*.2, xR = W*.8, ys = H*.66, s = xR - xL, f = s*(.3 + .05*r()), th = s*.13;
  const Ri = (s*s/4 + f*f)/(2*f), cx = (xL + xR)/2, cy = ys - f + Ri, Ro = Ri + th, Rm = Ri + th/2, a0 = Math.asin((s/2)/Ri);
  const top = H*.12, wl = W*.03, wr = W*.97, gnd = H*.95;
  const arcP = (R, m) => { const o = []; for(let i = 0; i <= m; i++){ const a = -a0 + 2*a0*i/m; o.push([cx + R*Math.sin(a), cy - R*Math.cos(a)]); } return o; };
  const intr = arcP(Ri, 24), extr = arcP(Ro, 24);
  const wall = [[wl, top], [wr, top], [wr, gnd], [xR, gnd], [xR, ys]].concat(intr.slice().reverse(), [[xL, ys], [xL, gnd], [wl, gnd]]);
  fillP(g, wall, "rgba(222,204,168,.2)");
  hatchIn(g, wall, 9, 0, "rgba(255,240,210,.12)", 1);
  const ring = extr.concat(intr.slice().reverse()); fillP(g, ring, "rgba(240,224,190,.34)");
  for(let i = 0; i <= 12; i++){ const a = -a0 + 2*a0*i/12; seg(g, cx + Ri*Math.sin(a), cy - Ri*Math.cos(a), cx + Ro*Math.sin(a), cy - Ro*Math.cos(a), "rgba(255,245,225,.55)", 1); }
  lineP(g, intr, "rgba(255,245,225,.8)", 1.2); lineP(g, extr, "rgba(255,245,225,.8)", 1.2);
  seg(g, 0, gnd, W, gnd, U.rgba("#ffffff", .4), 1);
  // 載重：每條站位上方的填充＋拱石重量
  const E0 = [cx - Rm*Math.sin(a0), cy - Rm*Math.cos(a0)], E1 = [cx + Rm*Math.sin(a0), E0[1]], sp = E1[0] - E0[0], m = 10;
  const xsn = [], Pn = []; for(let i = 0; i < m; i++){ const u = (i + .5)/m, x = E0[0] + u*sp, ye = cy - Math.sqrt(Math.max(0, Ro*Ro - (x - cx)*(x - cx))); xsn.push(u); Pn.push((ye - top) + th); }
  const {M} = moments(xsn, Pn), yc = cy - Rm;
  const line = (crown) => { const Hh = M(.5)*sp/(E0[1] - crown); return [E0].concat(xsn.map(u => [E0[0] + u*sp, E0[1] - M(u)*sp/Hh]), [E1]); };
  const tMin = line(yc - th*.42), tMax = line(yc + th*.36);
  lineP(g, tMax, U.rgba(c, .9), 1.6, false, [3, 2]); lineP(g, tMin, "#ffffff", 2.2);
  // 鉸點：推力線最貼近內外弧處
  [[tMin, yc - th*.42], [tMax, yc + th*.36]].forEach(([tl, cyv]) => { const sg = cyv < yc ? 1 : -1, rho = tl.map(p => sg*(Math.hypot(p[0] - cx, p[1] - cy) - Rm)), mid = tl.length/2;
    let iL = 1, iR = tl.length - 2;
    rho.forEach((v, i) => { if(i > 0 && i < mid && v < rho[iL]) iL = i; if(i >= mid && i < tl.length - 1 && v < rho[iR]) iR = i; });
    [[cx, cyv], tl[iL], tl[iR]].forEach(q => { g.strokeStyle = "#ff5a52"; g.lineWidth = 1.4; g.beginPath(); g.arc(q[0], q[1], 3.4, 0, U.TAU); g.stroke(); }); });
};

// V05 Cremona 交互力圖：上半是屋架桁架（Bow 記號的每個面各一色），下半是真的由節點平衡解出的交互力圖，面↔點同色
ART.var["E05"][4] = function(g, W, H, r, c, U){
  const h = 2, N = []; for(let i = 0; i < 7; i++) N.push([i, 0]);
  for(let i = 1; i <= 5; i++) N.push([i, h*(1 - Math.abs(i - 3)/3)]);
  const t = i => 6 + i, E = [];
  for(let i = 0; i < 6; i++) E.push([i, i + 1]);
  E.push([0, t(1)]); for(let i = 1; i < 5; i++) E.push([t(i), t(i + 1)]); E.push([t(5), 6]);
  for(let i = 1; i <= 5; i++) E.push([i, t(i)]);
  E.push([t(1), 2], [t(2), 3], [t(4), 3], [t(5), 4]);
  const faces = [[0, 1, t(1)], [1, 2, t(1)], [t(1), 2, t(2)], [2, 3, t(2)], [t(2), 3, t(3)], [t(3), 3, t(4)], [3, 4, t(4)], [t(4), 4, t(5)], [4, 5, t(5)], [5, 6, t(5)]];
  const p = [1, 2, 3, 4, 5].map(() => .7 + .6*r());
  // 節點平衡：21 根桿件＋3 個反力，24 條方程
  const nU = E.length + 3, A = [], b = [];
  for(let i = 0; i < 2*N.length; i++){ A.push(new Array(nU).fill(0)); b.push(0); }
  const u = E.map(([a, bb]) => { const dx = N[bb][0] - N[a][0], dy = N[bb][1] - N[a][1], l = Math.hypot(dx, dy); return [dx/l, dy/l]; });
  E.forEach(([a, bb], e) => { A[2*a][e] += u[e][0]; A[2*a + 1][e] += u[e][1]; A[2*bb][e] -= u[e][0]; A[2*bb + 1][e] -= u[e][1]; });
  A[0][E.length] = 1; A[1][E.length + 1] = 1; A[13][E.length + 2] = 1;
  p.forEach((pk, k) => { b[2*t(k + 1) + 1] = pk; });
  const x = solve(A, b), Fm = x.slice(0, E.length), R0 = [x[E.length], x[E.length + 1]];
  // 面（空間）對應力圖上的點：外部空間 s0..s5 在載重線上，z 在下弦下方
  const pt = {}; pt.s0 = [0, 0]; for(let k = 1; k <= 5; k++) pt["s" + k] = [0, pt["s" + (k - 1)][1] - p[k - 1]];
  pt.z = [-R0[0], -R0[1]];
  const key = (a, bb) => a < bb ? a + "_" + bb : bb + "_" + a, eIdx = {}; E.forEach(([a, bb], e) => eIdx[key(a, bb)] = e);
  const side = E.map(() => ({}));
  faces.forEach((f, fi) => { const cxy = [(N[f[0]][0] + N[f[1]][0] + N[f[2]][0])/3, (N[f[0]][1] + N[f[1]][1] + N[f[2]][1])/3];
    for(let j = 0; j < 3; j++){ const a = f[j], bb = f[(j + 1)%3], e = eIdx[key(a, bb)], [ea, eb] = E[e];
      const cr = (N[eb][0] - N[ea][0])*(cxy[1] - N[ea][1]) - (N[eb][1] - N[ea][1])*(cxy[0] - N[ea][0]);
      side[e][cr > 0 ? "L" : "R"] = "f" + fi; } });
  for(let e = 0; e < 6; e++) side[e].R = "z";
  for(let k = 0; k < 6; k++) side[6 + k].L = "s" + k;
  for(let pass = 0; pass < 12; pass++) E.forEach((_, e) => { const {L, R} = side[e];
    if(pt[L] && !pt[R]) pt[R] = [pt[L][0] + Fm[e]*u[e][0], pt[L][1] + Fm[e]*u[e][1]];
    else if(pt[R] && !pt[L]) pt[L] = [pt[R][0] - Fm[e]*u[e][0], pt[R][1] - Fm[e]*u[e][1]]; });
  const fcol = (fi, a) => `hsla(${(200 + fi*33) % 360},70%,60%,${a})`;
  // 上半：桁架
  const sT = Math.min(W*.88/6, H*.34/h), TX = xx => W/2 + (xx - 3)*sT, TY = yy => H*.44 - yy*sT;
  faces.forEach((f, fi) => fillP(g, f.map(k => [TX(N[k][0]), TY(N[k][1])]), fcol(fi, .3)));
  const fMax = Math.max(...Fm.map(Math.abs)) || 1;
  E.forEach(([a, bb], e) => seg(g, TX(N[a][0]), TY(N[a][1]), TX(N[bb][0]), TY(N[bb][1]), Fm[e] < 0 ? c : "#6cc4ff", 1 + 2.6*Math.abs(Fm[e])/fMax));
  p.forEach((pk, k) => { const q = N[t(k + 1)]; arrow(g, TX(q[0]), TY(q[1]) - 8 - pk*8, TX(q[0]), TY(q[1]) - 3, U.rgba("#ffffff", .8), 1, 3.5); });
  supportTri(g, TX(0), TY(0) + 1, false, "#ffffff"); supportTri(g, TX(6), TY(0) + 1, false, "#ffffff");
  // 下半：交互力圖
  const ks = Object.keys(pt); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  ks.forEach(k2 => { x0 = Math.min(x0, pt[k2][0]); x1 = Math.max(x1, pt[k2][0]); y0 = Math.min(y0, pt[k2][1]); y1 = Math.max(y1, pt[k2][1]); });
  const fs = Math.min(W*.84/(x1 - x0 || 1), H*.4/(y1 - y0 || 1)), FX = xx => W/2 + (xx - (x0 + x1)/2)*fs, FY = yy => H*.75 - (yy - (y0 + y1)/2)*fs;
  E.forEach((_, e) => { const a = pt[side[e].L], bb = pt[side[e].R]; if(a && bb) seg(g, FX(a[0]), FY(a[1]), FX(bb[0]), FY(bb[1]), Fm[e] < 0 ? c : "#6cc4ff", 1.4); });
  seg(g, FX(0), FY(0), FX(0), FY(pt.s5[1]), "#ffffff", 2.4);
  faces.forEach((f, fi) => { const q = pt["f" + fi]; if(q) dot(g, FX(q[0]), FY(q[1]), 3, fcol(fi, 1)); });
  ["s0", "s1", "s2", "s3", "s4", "s5", "z"].forEach(k2 => dot(g, FX(pt[k2][0]), FY(pt[k2][1]), 2, "#ffffff"));
};
ART.var["E05"][4].ratio = 1.25;

// V06 切片法分析拱頂：斜軸測的殼體，沿長向切成平行拱片，每片各跑一次推力線；跑出殼厚的那片標紅
ART.var["E05"][5] = function(g, W, H, r, c, U){
  const S = 7, m = 12, ph = r()*3, sc = W*.56, ox = W*.1, oy = H*.9;
  const pr = (x, y, z) => [ox + x*sc + y*sc*.44, oy - z*sc - y*sc*.4];
  const hOf = y => .3 + .12*Math.sin(y*4 + ph), zOf = (x, y) => hOf(y)*4*x*(1 - x);
  // 平面輪廓
  fillP(g, [pr(0, 0, 0), pr(1, 0, 0), pr(1, 1, 0), pr(0, 1, 0)], U.rgba("#ffffff", .05));
  const Lg = nrm3([-.5, -.4, .8]), bad = 1 + Math.floor(r()*(S - 2));
  for(let k = S - 1; k >= 0; k--){
    const y = k/(S - 1);
    if(k < S - 1){ const y2 = (k + 1)/(S - 1);
      for(let i = 0; i < m; i++){ const xa = i/m, xb = (i + 1)/m;
        const p00 = [xa, y, zOf(xa, y)], p10 = [xb, y, zOf(xb, y)], p01 = [xa, y2, zOf(xa, y2)];
        const nn = nrm3(cross3(sub3(p10, p00), sub3(p01, p00))), l = Math.max(0, Math.abs(dot3(nn, Lg)));
        const v = .35 + .65*l;
        fillP(g, [pr(xa, y, zOf(xa, y)), pr(xb, y, zOf(xb, y)), pr(xb, y2, zOf(xb, y2)), pr(xa, y2, zOf(xa, y2))], `rgba(${Math.round(120*v + 40)},${Math.round(105*v + 35)},${Math.round(80*v + 30)},.9)`); } }
    // 切片剖面（殼厚）
    const sec = []; for(let i = 0; i <= m; i++){ const xx = i/m; sec.push(pr(xx, y, zOf(xx, y))); }
    lineP(g, sec, U.rgba("#ffffff", .55), 1.2);
    // 本片推力線：依片寬與隨機附加載重
    const xs = [], P = []; for(let i = 0; i < 7; i++){ xs.push((i + .5)/7); P.push(.8 + .4*r()); }
    const d = funFromLoads(xs, P, P.reduce((a, b) => a + b, 0), {arch: true, sag: hOf(y)*(k === bad ? 1.45 : 1)});
    lineP(g, d.F.map(p => pr(p[0], y, p[1])), k === bad ? "#ff5a52" : c, k === bad ? 2.2 : 1.6);
  }
  seg(g, ...pr(0, 0, 0), ...pr(0, 1, 0), U.rgba("#ffffff", .4), 1.4); seg(g, ...pr(1, 0, 0), ...pr(1, 1, 0), U.rgba("#ffffff", .4), 1.4);
};

// V07 多面體 3D 圖解靜力學：左邊是三腳受壓節點（形狀圖），右邊是四面體力多面體；每根腳垂直於同色的面，粗細＝面積，底面對應垂直載重
ART.var["E05"][6] = function(g, W, H, r, c, U){
  // 形狀圖用等角；力多面體用較俯視的視角（繞 z 轉 az、仰角 el），扁四面體的三個側面才都看得到
  const iso = (p, cx, cy, s) => [cx + (p[0] - p[1])*s*.87, cy + (p[0] + p[1])*s*.5 - p[2]*s];
  const az = .5, el = .98, ca = Math.cos(az), sa = Math.sin(az), se = Math.sin(el), ce = Math.cos(el), VD = [ce*sa, ce*ca, se];
  const isoP = (p, cx, cy, s) => { const x1 = p[0]*ca - p[1]*sa, y1 = p[0]*sa + p[1]*ca; return [cx + x1*s, cy + y1*s*se - p[2]*s*ce]; };
  // 力多面體：水平底面三角形（對應垂直載重）＋上方頂點
  const q = [0, 1, 2].map(i => { const a = .3 + i*U.TAU/3 + (r() - .5)*.4, R = 1 + .25*r(); return [Math.cos(a)*R, Math.sin(a)*R, 0]; });
  q.push([(r() - .5)*.3, (r() - .5)*.3, .42 + .12*r()]);   // 力多面體越扁，腳越陡
  const faces = [[0, 1, 2], [0, 1, 3], [1, 2, 3], [2, 0, 3]], cen = [0, 1, 2].reduce((a, i) => [a[0] + q[i][0]/4, a[1] + q[i][1]/4, a[2] + q[i][2]/4], [q[3][0]/4, q[3][1]/4, q[3][2]/4]);
  const info = faces.map(f => { let nn = cross3(sub3(q[f[1]], q[f[0]]), sub3(q[f[2]], q[f[0]])); const area = Math.hypot(...nn)/2; nn = nrm3(nn);
    const fc = [(q[f[0]][0] + q[f[1]][0] + q[f[2]][0])/3, (q[f[0]][1] + q[f[1]][1] + q[f[2]][1])/3, (q[f[0]][2] + q[f[1]][2] + q[f[2]][2])/3];
    if(dot3(nn, sub3(fc, cen)) < 0) nn = [-nn[0], -nn[1], -nn[2]]; return {f, nn, area}; });
  const aMax = Math.max(...info.map(o => o.area)), hue = i => (20 + i*95) % 360, Lg = nrm3([-.3, -.5, .8]);
  // 形狀圖：節點在上，三支腳沿側面的內法向量（-n）往下落到地面
  const cF = [W*.3, H*.26], sF = W*.15, gz = -1.25;
  const gp = [[-1.3, -1.3, gz], [1.3, -1.3, gz], [1.3, 1.3, gz], [-1.3, 1.3, gz]].map(p => iso(p, cF[0], cF[1], sF));
  fillP(g, gp, U.rgba("#ffffff", .08));
  for(let i = -1.3; i <= 1.31; i += .65){ seg(g, ...iso([i, -1.3, gz], cF[0], cF[1], sF), ...iso([i, 1.3, gz], cF[0], cF[1], sF), U.rgba("#ffffff", .12), .8); seg(g, ...iso([-1.3, i, gz], cF[0], cF[1], sF), ...iso([1.3, i, gz], cF[0], cF[1], sF), U.rgba("#ffffff", .12), .8); }
  const nodeP = iso([0, 0, 0], cF[0], cF[1], sF);
  info.forEach((o, i) => { if(i === 0) return; const dv = [-o.nn[0], -o.nn[1], -o.nn[2]], tt = gz/dv[2], end = [dv[0]*tt, dv[1]*tt, gz], ep = iso(end, cF[0], cF[1], sF);
    const sh = iso([end[0], end[1], gz], cF[0], cF[1], sF); seg(g, nodeP[0], nodeP[1] + (gz*-sF), sh[0], sh[1], U.rgba("#000000", .25), 2);
    seg(g, nodeP[0], nodeP[1], ep[0], ep[1], `hsla(${hue(i)},75%,62%,1)`, 1.5 + 5*o.area/aMax); dot(g, ep[0], ep[1], 2.4, "#ffffff"); });
  arrow(g, nodeP[0], nodeP[1] - 30, nodeP[0], nodeP[1] - 5, "#ffffff", 1.6 + 3*info[0].area/aMax, 6);
  dot(g, nodeP[0], nodeP[1], 3.4, "#ffffff");
  // 力多面體（隱藏邊虛線、可見面依光照上色）
  const cP = [W*.72, H*.7], sP = W*.23, Q = q.map(p => isoP(p, cP[0], cP[1], sP));
  [[0, 1], [1, 2], [2, 0], [0, 3], [1, 3], [2, 3]].forEach(([a, bb]) => seg(g, Q[a][0], Q[a][1], Q[bb][0], Q[bb][1], U.rgba("#ffffff", .3), .8, [2, 2]));
  // 先畫背面（半透明），再畫正面，三個側面的顏色都看得到
  [false, true].forEach(front => info.forEach((o, i) => { if((dot3(o.nn, VD) > 0) !== front) return; const l = .35 + .65*Math.max(0, dot3(o.nn, Lg));
    fillP(g, o.f.map(k => Q[k]), i === 0 ? `rgba(255,255,255,${front ? .25 + .45*l : .1})` : `hsla(${hue(i)},70%,${24 + 40*l}%,${front ? .8 : .45})`);
    lineP(g, o.f.map(k => Q[k]), U.rgba("#ffffff", front ? .85 : .35), front ? 1.1 : .8, true, front ? [] : [2, 2]); }));
};

// V08 沿推力線切楔形石塊：上方是組好的拱，下方是攤在板材上的每塊拱石展開輪廓（雷切／CNC 排版）
ART.var["E05"][7] = function(g, W, H, r, c, U){
  const n = 7, d = core(r, n, {arch: true, sag: .4}), F = d.F, hf = .06;
  const ax = W*.24, aw = W*.52, ay = H*.44, X = x => ax + x*aw, Y = y => ay - y*aw;
  const nrm = i => { const a = F[Math.max(0, i - 1)], bb = F[Math.min(F.length - 1, i + 1)], dx = bb[0] - a[0], dy = bb[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy/l, dx/l]; };
  const blocks = [];
  for(let i = 0; i < F.length - 1; i++){ const n0 = nrm(i), n1 = nrm(i + 1);
    blocks.push([[F[i][0] + n0[0]*hf, F[i][1] + n0[1]*hf], [F[i + 1][0] + n1[0]*hf, F[i + 1][1] + n1[1]*hf], [F[i + 1][0] - n1[0]*hf, F[i + 1][1] - n1[1]*hf], [F[i][0] - n0[0]*hf, F[i][1] - n0[1]*hf]]); }
  blocks.forEach((bk, i) => { fillP(g, bk.map(p => [X(p[0]), Y(p[1])]), U.rgba(c, i % 2 ? .55 : .35)); lineP(g, bk.map(p => [X(p[0]), Y(p[1])]), U.rgba("#ffffff", .8), .9, true); });
  lineP(g, F.map(p => [X(p[0]), Y(p[1])]), U.rgba("#ffffff", .6), 1, false, [2, 2]);
  seg(g, W*.14, ay, W*.86, ay, U.rgba("#ffffff", .3), 1);
  // 板材
  const sh = [[W*.04, H*.52], [W*.96, H*.52], [W*.96, H*.97], [W*.04, H*.97]];
  fillP(g, sh, "rgba(230,210,165,.24)"); hatchIn(g, sh, 4, .03, "rgba(255,235,190,.07)", 1); lineP(g, sh, "rgba(240,220,180,.6)", 1, true);
  const k = 1.5, cols = 4;
  blocks.forEach((bk, i) => {
    const dx = (bk[1][0] + bk[2][0] - bk[0][0] - bk[3][0])/2, dy = (bk[1][1] + bk[2][1] - bk[0][1] - bk[3][1])/2, ang = Math.atan2(dy, dx) + (i % 2 ? Math.PI : 0);
    const cxy = bk.reduce((a, p) => [a[0] + p[0]/4, a[1] + p[1]/4], [0, 0]);
    const px = W*.16 + (i % cols)*W*.225, py = H*(.63 + .2*Math.floor(i/cols));
    const loc = bk.map(p => { const ux = p[0] - cxy[0], uy = p[1] - cxy[1], ca = Math.cos(-ang), sa = Math.sin(-ang); return [px + (ux*ca - uy*sa)*aw*k, py - (ux*sa + uy*ca)*aw*k]; });
    fillP(g, loc, U.rgba(c, .16)); lineP(g, loc, c, 1.3, true);
    for(let j = 0; j <= i; j++) dot(g, px - 6 + j*2.6, py, .9, U.rgba("#ffffff", .75));
  });
};

// V09 拖曳極點即時互動：只畫力圖——載重線與極點射線圍出的扇形，淡色殘影是拖曳經過的舊極點；右上小框是跟著變的索形
ART.var["E05"][8] = function(g, W, H, r, c, U){
  const n = 6, P = []; for(let i = 0; i < n; i++) P.push(.5 + r());
  const tot = P.reduce((a, b) => a + b, 0), lx = W*.14, y0 = H*.1, fh = H*.8;
  const L = [[lx, y0]]; P.forEach(p => L.push([lx, L[L.length - 1][1] + p/tot*fh]));
  const poles = [[W*.36, H*.3], [W*.48, H*.38], [W*.6, H*.46], [W*.76, H*.52]], O = poles[3];
  poles.slice(0, 3).forEach((po, pi) => L.forEach(l => seg(g, po[0], po[1], l[0], l[1], U.rgba("#ffffff", .08 + .05*pi), .8, [2, 3])));
  for(let j = 0; j < n; j++) fillP(g, [O, L[j], L[j + 1]], `hsla(${(190 + j*28) % 360},70%,60%,${j % 2 ? .34 : .2})`);
  L.forEach((l, j) => seg(g, O[0], O[1], l[0], l[1], hueCol(j/n), 1.3));
  seg(g, lx, L[0][1], lx, L[n][1], "#ffffff", 2.6); L.forEach(l => dot(g, l[0], l[1], 2, "#ffffff"));
  lineP(g, poles, U.rgba("#ffffff", .5), 1, false, [3, 3]); poles.slice(0, 3).forEach(po => dot(g, po[0], po[1], 2, U.rgba("#ffffff", .5)));
  dot(g, O[0], O[1], 5, c); g.strokeStyle = "#ffffff"; g.lineWidth = 1.2; g.beginPath(); g.arc(O[0], O[1], 8, 0, U.TAU); g.stroke();
  // 游標
  const mx = O[0] + 5, my = O[1] + 5; fillP(g, [[mx, my], [mx, my + 13], [mx + 3.5, my + 9.5], [mx + 7, my + 15], [mx + 9, my + 14], [mx + 5.5, my + 8.5], [mx + 10, my + 8]], "#ffffff");
  // 極距（水平推力）標註
  seg(g, lx, H*.95, O[0], H*.95, U.rgba(c, .8), 1.2); seg(g, lx, H*.92, lx, H*.98, U.rgba(c, .8), 1); seg(g, O[0], H*.92, O[0], H*.98, U.rgba(c, .8), 1);
  // 右上小框：同一極點畫出的索多邊形
  const bx = W*.66, bw = W*.3, byy = H*.06, bh = H*.22; g.strokeStyle = U.rgba("#ffffff", .3); g.lineWidth = 1; g.strokeRect(bx, byy, bw, bh);
  const raw = [[0, 0]]; for(let j = 0; j <= n; j++){ const sl = (O[1] - L[j][1])/(O[0] - L[j][0]); raw.push([j + 1, raw[j][1] + sl]); }
  const ymax = Math.max(...raw.map(p => p[1])), ymin = Math.min(...raw.map(p => p[1])), ks = Math.min((bw - 10)/(n + 1), (bh - 10)/((ymax - ymin) || 1));
  const pts = raw.map(p => [bx + bw/2 + (p[0] - (n + 1)/2)*ks, byy + 5 + (p[1] - ymin)*ks]);
  seg(g, pts[0][0], pts[0][1], pts[n + 1][0], pts[n + 1][1], U.rgba("#ffffff", .3), 1, [2, 2]); lineP(g, pts, c, 1.6);
};

// V10 內力決定截面與載重路徑：兩榀平行的拱以管件表現（管徑＝內力），下方是矢高–材料量面積圖，最低點為最省材料的矢高
ART.var["E05"][9] = function(g, W, H, r, c, U){
  const n = 6, {xs, P, tot} = genLoads(r, n, 1);
  const samples = []; for(let s = 0; s < 24; s++){ const sg = .08 + s*.03, dd = funFromLoads(xs, P, tot, {arch: true, sag: sg}); let m = 0;
    for(let j = 0; j <= n; j++) m += dd.forces[j]*Math.hypot(dd.F[j + 1][0] - dd.F[j][0], dd.F[j + 1][1] - dd.F[j][1]); samples.push([sg, m]); }
  let bi = 0; samples.forEach((s, i) => { if(s[1] < samples[bi][1]) bi = i; });
  const d = funFromLoads(xs, P, tot, {arch: true, sag: samples[bi][0]}), fMax = Math.max(...d.forces);
  const sx = W*.12, sw = W*.66, by = H*.6, X = x => sx + x*sw, Y = y => by - y*sw, bk = [W*.14, -H*.1];
  // 後榀＋橫向連桿
  lineP(g, d.F.map(p => [X(p[0]) + bk[0], Y(p[1]) + bk[1]]), U.rgba(c, .35), 3);
  d.F.forEach(p => seg(g, X(p[0]), Y(p[1]), X(p[0]) + bk[0], Y(p[1]) + bk[1], U.rgba("#ffffff", .25), 1));
  // 前榀：管件（暗邊＋本色＋高光）
  for(let j = 0; j <= n; j++){ const a = d.F[j], bb = d.F[j + 1], w = 3 + 8*d.forces[j]/fMax;
    seg(g, X(a[0]), Y(a[1]), X(bb[0]), Y(bb[1]), tone(c, .45), w + 2);
    seg(g, X(a[0]), Y(a[1]), X(bb[0]), Y(bb[1]), c, w);
    seg(g, X(a[0]), Y(a[1]) - w*.22, X(bb[0]), Y(bb[1]) - w*.22, "rgba(255,245,220,.7)", Math.max(1, w*.2)); }
  [0, 1].forEach(x => { g.fillStyle = U.rgba("#ffffff", .5); g.fillRect(X(x) - 6, by, 12 + bk[0], 6); });
  // 面積圖
  const gx = W*.08, gw = W*.84, gb = H*.96, gh = H*.24;
  const mMin = Math.min(...samples.map(s => s[1])), mMax = Math.max(...samples.map(s => s[1]));
  const cp = samples.map((s, i) => [gx + gw*i/(samples.length - 1), gb - gh*(.12 + .88*(s[1] - mMin)/((mMax - mMin) || 1))]);
  const ag = g.createLinearGradient(0, gb - gh, 0, gb); ag.addColorStop(0, U.rgba(c, .55)); ag.addColorStop(1, U.rgba(c, .06));
  fillP(g, [[gx, gb]].concat(cp, [[gx + gw, gb]]), ag); lineP(g, cp, c, 1.6);
  seg(g, gx, gb, gx + gw, gb, U.rgba("#ffffff", .5), 1); seg(g, gx, gb, gx, gb - gh, U.rgba("#ffffff", .5), 1);
  seg(g, cp[bi][0], cp[bi][1], cp[bi][0], gb, "#ffffff", 1, [2, 2]); dot(g, cp[bi][0], cp[bi][1], 3, "#ffffff");
};

// V11 接 E06 力密度法對照：上方是由力密度 q 組成的三對角矩陣（熱度圖）與解向量，下方是索多邊形與 FDM 解的疊合（淡虛線為 q 不相等時）
ART.var["E05"][10] = function(g, W, H, r, c, U){
  const n = 8, {xs, P, tot} = genLoads(r, n, 1), d = funFromLoads(xs, P, tot, {sag: .3});
  const len = []; for(let j = 0; j <= n; j++) len.push(Math.hypot(d.F[j + 1][0] - d.F[j][0], d.F[j + 1][1] - d.F[j][1]));
  const q = d.forces.map((f, j) => f/(len[j] || 1e-6));
  const fdm = qq => { const K = [], rhs = []; for(let i = 0; i < n; i++){ const row = new Array(n).fill(0); row[i] = qq[i] + qq[i + 1]; if(i > 0) row[i - 1] = -qq[i]; if(i < n - 1) row[i + 1] = -qq[i + 1]; K.push(row); rhs.push(-P[i]*d.fs); }
    const y = solve(K, rhs); return {K, y, pts: [[0, 0]].concat(xs.map((x, i) => [x, y[i]]), [[1, 0]])}; };
  const s1 = fdm(q), q2 = q.map((v, i) => v*(i < n/2 ? .7 : 1.35)), s2 = fdm(q2);
  // 矩陣熱度圖
  const mx = W*.06, my = H*.05, cs = W*.56/n, kMax = Math.max(...s1.K.map(row => Math.max(...row.map(Math.abs))));
  for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){ const v = Math.abs(s1.K[i][j])/kMax;
    g.fillStyle = v ? (i === j ? U.rgba(c, .35 + .6*v) : U.rgba("#ffffff", .2 + .5*v)) : U.rgba("#ffffff", .04); g.fillRect(mx + j*cs + .5, my + i*cs + .5, cs - 1, cs - 1); }
  [[mx - 3, 1], [mx + n*cs + 3, -1]].forEach(([bx, s]) => lineP(g, [[bx + 3*s, my - 1], [bx, my - 1], [bx, my + n*cs + 1], [bx + 3*s, my + n*cs + 1]], U.rgba("#ffffff", .7), 1));
  const yMax = Math.max(...s1.y.map(Math.abs)), pMax = Math.max(...P);
  for(let i = 0; i < n; i++){ g.fillStyle = U.rgba("#6cc4ff", .2 + .7*Math.abs(s1.y[i])/yMax); g.fillRect(W*.7, my + i*cs + .5, cs*.9, cs - 1);
    g.fillStyle = U.rgba("#ffffff", .15 + .6*P[i]/pMax); g.fillRect(W*.86, my + i*cs + .5, cs*.9, cs - 1); }
  // 疊合比較
  const gy0 = H*.66, X = x => W*.08 + x*W*.84, sy = H*.3/Math.max(.001, ...s1.pts.map(p => -p[1]), ...s2.pts.map(p => -p[1])), Y = y => gy0 - y*sy;
  seg(g, X(0), gy0, X(1), gy0, U.rgba("#ffffff", .25), 1, [3, 3]);
  lineP(g, s2.pts.map(p => [X(p[0]), Y(p[1])]), U.rgba("#6cc4ff", .6), 1.2, false, [2, 3]);
  const scale = d.F[4][1]/(s1.pts[4][1] || -1e-6);
  lineP(g, d.F.map(p => [X(p[0]), Y(p[1]/scale)]), c, 3);
  s1.pts.forEach((p, i) => { if(i > 0 && i <= n){ dot(g, X(p[0]), Y(p[1]), 2.2, "#ffffff"); } });
  supportTri(g, X(0), gy0, false, c); supportTri(g, X(1), gy0, false, c);
};
ART.var["E05"][10].ratio = 1.15;

// V12 接 A05 形狀文法的分枝平衡：樹狀柱撐起屋頂板的剖面；每個分叉點旁是封閉的力三角形，下方小圖示是「一桿拆兩支」的規則
ART.var["E05"][11] = function(g, W, H, r, c, U){
  const roofY = H*.2, gy = H*.86;
  g.fillStyle = U.rgba("#ffffff", .06); g.fillRect(0, gy, W, H - gy); seg(g, 0, gy, W, gy, U.rgba("#ffffff", .35), 1);
  const slab = [[W*.02, roofY - 8], [W*.98, roofY - 8], [W*.98, roofY], [W*.02, roofY]];
  fillP(g, slab, U.rgba("#ffffff", .26)); hatchIn(g, slab, 4, Math.PI/4, U.rgba("#ffffff", .2), .7);
  const lv1 = H*.6, lv2 = H*.4;
  [W*.28, W*.72].forEach((tx, ti) => {
    const tops = [-.2, -.07, .07, .2].map(o => [tx + o*W + (r() - .5)*8, roofY]), wts = tops.map(() => .7 + .6*r());
    const cen = idx => { let sx = 0, sw = 0; idx.forEach(i => { sx += tops[i][0]*wts[i]; sw += wts[i]; }); return [sx/sw, sw]; };
    const [cA, wA] = cen([0, 1, 2, 3]), [cL, wL] = cen([0, 1]), [cR, wR] = cen([2, 3]);
    const root = [cA, gy], n1 = [cA, lv1];
    const nL = [n1[0] + (cL - n1[0])*(lv1 - lv2)/(lv1 - roofY), lv2], nR = [n1[0] + (cR - n1[0])*(lv1 - lv2)/(lv1 - roofY), lv2];
    const bars = [[root, n1, wA], [n1, nL, wL], [n1, nR, wR], [nL, tops[0], wts[0]], [nL, tops[1], wts[1]], [nR, tops[2], wts[2]], [nR, tops[3], wts[3]]];
    bars.forEach(([a, bb, w], i) => { const f = w*Math.hypot(bb[0] - a[0], bb[1] - a[1])/Math.abs(a[1] - bb[1]); seg(g, a[0], a[1], bb[0], bb[1], i === 0 ? c : i < 3 ? tone(c, 1.25) : tone(c, 1.5), 1.2 + f*1.6); });
    [n1, nL, nR].forEach(p => dot(g, p[0], p[1], 2.4, "#ffffff"));
    tops.forEach((p, i) => arrow(g, p[0], roofY - 22 - wts[i]*6, p[0], roofY - 10, U.rgba("#ffffff", .7), 1, 3.5));
    // 分叉點的力三角形：兩支子桿的力向量首尾相接＝母桿
    const fsc = H*.07, vL = [(nL[0] - n1[0])/(lv1 - lv2)*wL*fsc, -wL*fsc], vR = [(nR[0] - n1[0])/(lv1 - lv2)*wR*fsc, -wR*fsc];
    const s0 = [n1[0] + (ti ? -W*.13 : W*.07), lv1 + H*.12];
    seg(g, s0[0], s0[1], s0[0] + vL[0], s0[1] + vL[1], tone(c, 1.25), 1.4);
    seg(g, s0[0] + vL[0], s0[1] + vL[1], s0[0] + vL[0] + vR[0], s0[1] + vL[1] + vR[1], "#6cc4ff", 1.4);
    seg(g, s0[0], s0[1], s0[0] + vL[0] + vR[0], s0[1] + vL[1] + vR[1], "#ffffff", 1.4, [2, 2]);
  });
  // 規則圖示：| → Y → Ψ
  const gyc = (gy + H)/2 + 1, ic = (x, k) => { seg(g, x, gyc + 5, x, gyc, "#ffffff", 1.2); if(k > 0){ seg(g, x, gyc, x - 4, gyc - 5, "#ffffff", 1.2); seg(g, x, gyc, x + 4, gyc - 5, "#ffffff", 1.2); }
    if(k > 1){ seg(g, x - 4, gyc - 5, x - 6, gyc - 8, "#ffffff", 1); seg(g, x - 4, gyc - 5, x - 2, gyc - 8, "#ffffff", 1); seg(g, x + 4, gyc - 5, x + 2, gyc - 8, "#ffffff", 1); seg(g, x + 4, gyc - 5, x + 6, gyc - 8, "#ffffff", 1); } };
  ic(W*.08, 0); arrow(g, W*.12, gyc, W*.17, gyc, U.rgba("#ffffff", .6), 1, 3); ic(W*.22, 1); arrow(g, W*.27, gyc, W*.32, gyc, U.rgba("#ffffff", .6), 1, 3); ic(W*.38, 2);
};

// =================== 沒有照片的案例 ===================

// E05-01 艾菲爾鐵塔：以圖解靜力學決定塔身輪廓（3D 建築量體，立面）
ART.case["E05-01"] = function(g, W, H, r, c, U){
  const n = 7, d = core(r, n, {arch: true, sag: .5, ox: .55});
  const cx = W*.5, baseY = H*.9, topY = H*.06, scaleX = W*.32;
  const prof = d.F.map(p => [p[0], p[1]]);
  const outer = []; prof.forEach(p => outer.push([cx - p[1]*scaleX*.9, baseY - p[0]*(baseY-topY)]));
  const inner = []; prof.forEach(p => inner.push([cx + p[1]*scaleX*.9, baseY - p[0]*(baseY-topY)]));
  g.fillStyle = U.rgba(c, .08);
  g.beginPath(); outer.forEach((p,i)=> i? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]));
  for(let i = inner.length-1; i>=0; i--) g.lineTo(inner[i][0], inner[i][1]);
  g.closePath(); g.fill();
  strokePoly(g, outer, x=>x, y=>y, "#ffffff", 2.2); strokePoly(g, inner, x=>x, y=>y, "#ffffff", 2.2);
  // 內部格構
  g.strokeStyle = U.rgba(c, .5); g.lineWidth = .8;
  for(let i = 0; i < outer.length-1; i++){
    g.beginPath(); g.moveTo(outer[i][0], outer[i][1]); g.lineTo(inner[i+1][0], inner[i+1][1]); g.stroke();
    g.beginPath(); g.moveTo(inner[i][0], inner[i][1]); g.lineTo(outer[i+1][0], outer[i+1][1]); g.stroke();
  }
  // 底部風力箭頭與基座內的推力三角
  loadArrow(g, W*.16, H*.5, 26, Math.PI/2, U.rgba("#ffd27a", .9));
  g.strokeStyle = "#ffffff"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx-scaleX*.9, baseY); g.lineTo(cx+scaleX*.9, baseY); g.stroke();
  dot(g, cx - scaleX*.25, baseY, 3, c);
};
ART.case["E05-01"].ratio = 1.3;

// E05-02 Maillart Salginatobel 橋設計方法：峽谷中的三鉸拱橋立面，拱與橋面合成鐮刀形；三種活載重下的推力線都通過三個鉸
ART.case["E05-02"] = function(g, W, H, r, c, U){
  const deckY = H*.25, A = [W*.21, H*.7], B = [W*.79, H*.68], C = [W*.5, deckY + 6];
  const rockL = [[0, deckY + 3], [W*.13, deckY + 3], [W*.15, H*.36], [W*.12, H*.46], [W*.17, H*.56], [W*.15, H*.64], [A[0], A[1] + 2], [W*.25, H*.8], [W*.31, H*.9], [W*.37, H], [0, H]];
  const rockR = [[W, deckY + 3], [W*.87, deckY + 3], [W*.86, H*.38], [W*.89, H*.47], [W*.84, H*.57], [W*.86, H*.63], [B[0], B[1] + 2], [W*.75, H*.8], [W*.69, H*.9], [W*.63, H], [W, H]];
  [rockL, rockR].forEach(rk => { const rg = g.createLinearGradient(0, deckY, 0, H); rg.addColorStop(0, "rgba(190,170,140,.42)"); rg.addColorStop(1, "rgba(120,105,90,.2)");
    fillP(g, rk, rg); hatchIn(g, rk, 7, -.25, "rgba(255,240,215,.13)", 1); });
  lineP(g, [[W*.37, H*.985], [W*.5, H*.96], [W*.63, H*.985]], "rgba(120,190,255,.5)", 1.2);
  // 鐮刀形拱：下緣拋物線（頂點在拱頂鉸），上緣先斜到橋面再沿橋面到拱頂
  const half = (S, dir) => { const low = [], m = 14; for(let i = 0; i <= m; i++){ const x = S[0] + (C[0] - S[0])*i/m; low.push([x, C[1] + (S[1] - C[1])*Math.pow(Math.abs((x - C[0])/(S[0] - C[0])), 1.55)]); }
    const Q = [S[0] + (C[0] - S[0])*.42, deckY + 3]; return {poly: low.concat([[C[0], deckY + 3], Q]), Q, low}; };
  const hl = half(A, 1), hr = half(B, -1);
  [hl, hr].forEach(hh => { fillP(g, hh.poly, U.rgba(c, .5)); lineP(g, hh.poly, tone(c, 1.3), 1.1, true);
    const S = hh.low[0]; for(let i = 1; i <= 3; i++){ const x = S[0] + (hh.Q[0] - S[0])*i/4, yA = S[1] + (hh.Q[1] - S[1])*i/4; seg(g, x, yA, x, deckY + 3, U.rgba("#ffffff", .55), 1.2); } });
  fillP(g, [[0, deckY - 4], [W, deckY - 4], [W, deckY + 3], [0, deckY + 3]], "rgba(235,225,205,.75)");
  // 推力線：三鉸拱的索多邊形必定通過 A、C、B；三種載重（全跨、左半、右半活載）
  const n = 12, xs = []; for(let i = 0; i < n; i++) xs.push((i + .5)/n);
  const sp = B[0] - A[0], chord = x => A[1] + (B[1] - A[1])*(x - A[0])/sp;
  [[1, 1, "#ffffff"], [1.8, 1, "#6cc4ff"], [1, 1.8, "#ff8a6a"]].forEach(([kl, kr, col]) => {
    const P = xs.map(u => u < .5 ? kl : kr), {M} = moments(xs, P), Hh = M(.5)*sp/(chord(C[0]) - C[1]);
    const pts = [A].concat(xs.map(u => [A[0] + u*sp, chord(A[0] + u*sp) - M(u)*sp/Hh]), [B]);
    lineP(g, pts, U.rgba(col, .9), 1.1, false, col === "#ffffff" ? [] : [3, 2]); });
  [A, B, C].forEach(p => { g.fillStyle = "#15151b"; g.beginPath(); g.arc(p[0], p[1], 3.4, 0, U.TAU); g.fill(); g.strokeStyle = "#ffffff"; g.lineWidth = 1.4; g.stroke(); });
};
ART.case["E05-02"].ratio = 1.15;

// E05-03 As Hangs the Flexible Line：懸吊曲線與倒置後的砌體拱並列
ART.case["E05-03"] = function(g, W, H, r, c, U){
  const n = 7, d = core(r, n, {sag: .34});
  const {X, Y} = fitXY(W, H, -.06, 1.06, -1.3, .55, 0, .86);
  const hang = d.F, arch = d.F.map(p => [p[0], -p[1] + .55]);
  g.strokeStyle = U.rgba("#ffffff", .25); g.setLineDash([2,3]); g.lineWidth = 1;
  hang.forEach((p,i)=>{ if(i>0 && i<hang.length-1){ g.beginPath(); g.moveTo(X(p[0]),Y(p[1])); g.lineTo(X(arch[i][0]),Y(arch[i][1])); g.stroke(); } });
  g.setLineDash([]);
  strokePoly(g, hang, X, Y, U.rgba("#ffffff", .8), 1.8);
  hang.forEach((p,i)=>{ if(i>0 && i<hang.length-1) dot(g, X(p[0]), Y(p[1]), 2, "#ffffff"); });
  // 掛在鏈上的小重物
  hang.forEach((p,i)=>{ if(i>0 && i<hang.length-1){ g.fillStyle = U.rgba("#ffd27a", .8); g.fillRect(X(p[0])-2, Y(p[1]), 4, 6); } });
  strokePoly(g, arch, X, Y, c, 2.6);
  // 拱石接縫
  const half=.035, norm = i => { const a = arch[Math.max(0,i-1)], b = arch[Math.min(arch.length-1,i+1)]; const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1; return [-dy/l,dx/l]; };
  arch.forEach((p,i)=>{ const nv = norm(i); g.strokeStyle = U.rgba("#ffffff", .5); g.lineWidth = 1;
    g.beginPath(); g.moveTo(X(p[0]-nv[0]*half), Y(p[1]-nv[1]*half)); g.lineTo(X(p[0]+nv[0]*half), Y(p[1]+nv[1]*half)); g.stroke(); });
  supportTri(g, X(0), Y(-.55+.55), false, c); supportTri(g, X(1), Y(-.55+.55), false, c);
};
ART.case["E05-03"].ratio = 1.25;

// E05-04 Real-time limit analysis of vaulted masonry buildings：拱頂推力網＋安全係數色階
ART.case["E05-04"] = function(g, W, H, r, c, U){
  const ribs = 5, n = 6, curves = [];
  for(let k = 0; k < ribs; k++){
    const d = core(r, n, {arch: true, sag: .16 + .045*k + .03*Math.sin(k*1.3)});
    curves.push(d);
  }
  let maxY = 0; curves.forEach(d => d.F.forEach(p => { if(p[1] > maxY) maxY = p[1]; }));
  const {X, Y} = fitXY(W, H, -.06, 1.06, -.05, maxY + .06, 0, .9);
  g.strokeStyle = U.rgba("#ffffff", .2); g.lineWidth = 1;
  g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(1), Y(0)); g.stroke();
  curves.forEach(d => { const fMax = Math.max(...d.forces);
    for(let j = 0; j <= n; j++){ const t = d.forces[j]/fMax, a = d.F[j], b = d.F[j+1];
      g.strokeStyle = t > .82 ? "#ff5a52" : hueCol(t); g.lineWidth = 1.3 + 1.6*t;
      g.beginPath(); g.moveTo(X(a[0]), Y(a[1])); g.lineTo(X(b[0]), Y(b[1])); g.stroke(); } });
  supportTri(g, X(0), Y(0), false, c); supportTri(g, X(1), Y(0), false, c);
  // 游標圖示（即時互動感），貼著其中一片拱
  const midF = curves[Math.floor(ribs/2)].F[Math.floor((n+1)/2)];
  const mx = X(midF[0]), my = Y(midF[1]) - 6;
  g.strokeStyle = "#ffffff"; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(mx, my); g.lineTo(mx, my+13); g.lineTo(mx+4, my+9.5); g.lineTo(mx+7,my+15); g.moveTo(mx+4,my+9.5); g.lineTo(mx+9,my+7); g.closePath(); g.stroke();
};

// E05-05 Structural optimization using graphic statics：Michell 型最佳化懸臂（正交拉／壓扇形）
ART.case["E05-05"] = function(g, W, H, r, c, U){
  const sx = W*.14, sy = H*.5, ex = W*.86, ey = H*.5, rings = 9;
  g.strokeStyle = U.rgba(c, .8); g.lineWidth = 2;
  g.beginPath(); g.moveTo(sx-16, sy-40); g.lineTo(sx-16, sy+40); g.stroke();
  for(let i=0;i<6;i++){ const yy = sy-32+i*13; g.beginPath(); g.moveTo(sx-16,yy); g.lineTo(sx-24,yy+8); g.stroke(); }
  // 壓力族（放射直線，紅）
  g.strokeStyle = "#ff6a5a"; g.lineWidth = 1;
  for(let i=0;i<rings;i++){ const a = -.55 + i/(rings-1)*1.1;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, sy + Math.tan(a)*(ex-sx)*.001*0 + a*(ex-sx)*.42); g.stroke(); }
  // 張力族（同心圓弧，藍）
  g.strokeStyle = "#5ac8ff"; g.lineWidth = 1;
  for(let i=1;i<=rings;i++){ const rad = (i/rings)*(ex-sx)*.92;
    g.beginPath(); g.arc(sx, sy, rad, -.6, .6); g.stroke(); }
  dot(g, sx, sy, 3, "#ffffff"); dot(g, ex, ey, 3, "#ffffff");
  loadArrow(g, ex, ey, 28, Math.PI/2, U.rgba("#ffffff", .85));
};

// E05-06 形狀文法自動產生多樣平衡結構：分枝柱小圖拼成目錄
ART.case["E05-06"] = function(g, W, H, r, c, U){
  const cols = 3, rows = 2, cw = W/cols, ch = H/rows;
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const cx0 = i*cw, cy0 = j*ch;
    g.strokeStyle = U.rgba("#ffffff", .12); g.lineWidth = 1; g.strokeRect(cx0+3, cy0+3, cw-6, ch-6);
    const root = [cx0+cw*.5, cy0+ch*.92], v0 = [0, -ch*.72];
    const branches = [];
    (function split(p, v, depth){ branches.push([p,v,depth]); if(depth>=3||Math.hypot(v[0],v[1])<9) return;
      const t=.4+r()*.22, k=(r()*2-1)*.26, perp=[-v[1],v[0]];
      const A=[v[0]*t+perp[0]*k, v[1]*t+perp[1]*k], B=[v[0]*(1-t)-perp[0]*k, v[1]*(1-t)-perp[1]*k];
      const mid=[p[0]+A[0],p[1]+A[1]]; split(p,A,depth+1); split(mid,B,depth+1); })(root, v0, 0);
    const maxLen = Math.max(...branches.map(b=>Math.hypot(b[1][0],b[1][1])));
    branches.forEach(([p,v,depth]) => { const len = Math.hypot(v[0],v[1]);
      g.strokeStyle = hueCol(1-depth/3); g.lineWidth = 1+3*len/maxLen; g.lineCap="round";
      g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(p[0]+v[0],p[1]+v[1]); g.stroke(); });
  }
};

// E05-07 Combinatorial Equilibrium Modeling：混合拉／壓的分支網路（建築尺度）
ART.case["E05-07"] = function(g, W, H, r, c, U){
  const N = 14, nodes = [[W*.5, H*.12]];
  for(let i=1;i<N;i++){
    const ref = nodes[Math.floor(r()*nodes.length)];
    const a = r()*U.TAU, len = 30 + r()*70;
    nodes.push([ref[0]+Math.cos(a)*len, ref[1]+Math.sin(a)*len]); }
  // 邊：每個新節點連回它的參照節點（樹狀），另加少量跨接
  const edges = [];
  for(let i=1;i<N;i++){ let best=0, bd=1e9; for(let j=0;j<i;j++){ const d=Math.hypot(nodes[i][0]-nodes[j][0],nodes[i][1]-nodes[j][1]); if(d<bd){bd=d;best=j;} } edges.push([best,i, r()<.5]); }
  for(let k=0;k<5;k++){ const a=Math.floor(r()*N), b=Math.floor(r()*N); if(a!==b) edges.push([a,b, r()<.5]); }
  edges.forEach(([a,b,tension]) => { g.strokeStyle = tension ? U.rgba("#5ac8ff", .8) : U.rgba("#ff6a5a", .85);
    g.lineWidth = tension ? 1 : 2.2; g.setLineDash(tension ? [3,3] : []);
    g.beginPath(); g.moveTo(nodes[a][0], nodes[a][1]); g.lineTo(nodes[b][0], nodes[b][1]); g.stroke(); });
  g.setLineDash([]);
  nodes.forEach((p,i) => dot(g, p[0], p[1], i===0?3.4:2, i===0? c : "#ffffff"));
};

// E05-08 Prefab Concrete Polyhedral Frame：單一多面體節點的製造圖，附組裝刻度
ART.case["E05-08"] = function(g, W, H, r, c, U){
  const hub = [W*.5, H*.5], legs = 4, len = Math.min(W,H)*.34;
  for(let i=0;i<legs;i++){ const a = -Math.PI/2 + i*(U.TAU/legs) + .3;
    const ex = hub[0] + Math.cos(a)*len, ey = hub[1] + Math.sin(a)*len*.8;
    g.strokeStyle = hueCol(i/legs); g.lineWidth = 4 - i*.3;
    g.beginPath(); g.moveTo(hub[0], hub[1]); g.lineTo(ex, ey); g.stroke();
    // 端部組裝刻度
    const nx = -Math.sin(a), ny = Math.cos(a);
    for(let t=-1;t<=1;t+=2){ g.strokeStyle = U.rgba("#ffffff", .7); g.lineWidth = 1;
      g.beginPath(); g.moveTo(ex+nx*6*t, ey+ny*6*t*.8); g.lineTo(ex-nx*2*t*0+ (ex-hub[0])*.06, ey-ny*2*t*0+(ey-hub[1])*.06+ny*6*t*.8); g.stroke(); }
    dot(g, ex, ey, 3, "#ffffff");
  }
  g.fillStyle = c; g.beginPath(); g.arc(hub[0], hub[1], 9, 0, U.TAU); g.fill();
  g.strokeStyle = "#ffffff"; g.lineWidth = 1.4; g.stroke();
  // 尺寸標註
  g.strokeStyle = U.rgba("#ffffff", .4); g.lineWidth = 1; g.setLineDash([2,3]);
  g.beginPath(); g.arc(hub[0], hub[1], len*.5, 0, U.TAU); g.stroke(); g.setLineDash([]);
};

// E05-09 eQUILIBRIUM 互動式學習平台：網頁介面——上方工具列、主畫面是可拖曳控點的索與力圖、下方是一排由淺入深的課程縮圖
ART.case["E05-09"] = function(g, W, H, r, c, U){
  const fx0 = 6, fy0 = 6, fw = W - 12, fh = H - 12;
  fillP(g, [[fx0, fy0], [fx0 + fw, fy0], [fx0 + fw, fy0 + fh], [fx0, fy0 + fh]], U.rgba("#ffffff", .04));
  g.fillStyle = U.rgba("#ffffff", .16); g.fillRect(fx0, fy0, fw, 15);
  for(let i = 0; i < 3; i++) dot(g, fx0 + 8 + i*8, fy0 + 7.5, 2.2, i ? U.rgba("#ffffff", .5) : U.rgba(c, .9));
  g.fillStyle = U.rgba("#ffffff", .22); g.fillRect(fx0 + fw*.35, fy0 + 4, fw*.4, 7);
  g.strokeStyle = U.rgba("#ffffff", .3); g.lineWidth = 1; g.strokeRect(fx0 + .5, fy0 + .5, fw - 1, fh - 1);
  // 主畫面：索（形狀圖）＋控點
  const n = 5, d = core(r, n, {sag: .32}), mainB = H*.7;
  const X = x => W*.08 + x*W*.5, Y = y => H*.3 - y*W*.5;
  seg(g, X(0), Y(0), X(1), Y(0), U.rgba("#ffffff", .25), 1, [3, 3]);
  lineP(g, d.F.map(p => [X(p[0]), Y(p[1])]), c, 2.4);
  d.F.slice(1, -1).forEach((p, i) => { const len = 6 + d.P[i]*d.fs*40;
    seg(g, X(p[0]), Y(p[1]), X(p[0]), Y(p[1]) + len, U.rgba("#ffffff", .6), 1); dot(g, X(p[0]), Y(p[1]) + len, 2.6, U.rgba("#ffffff", .9)); });
  [[X(0), Y(0)], [X(1), Y(0)]].forEach(p => { g.strokeStyle = "#ffffff"; g.lineWidth = 1.4; g.beginPath(); g.arc(p[0], p[1], 5, 0, U.TAU); g.stroke(); dot(g, p[0], p[1], 2, "#ffffff"); });
  // 力圖（右）
  const hp = Math.abs(d.O[0] - d.L[0][0]), LX = W*.72, fs = Math.min((mainB - H*.24)/.8, (W - 16 - LX)/hp), LY = y => H*.24 - y*fs, OX = LX + hp*fs;
  d.L.forEach(l => seg(g, OX, LY(d.O[1]), LX, LY(l[1]), U.rgba(c, .7), 1));
  seg(g, LX, LY(d.L[0][1]), LX, LY(d.L[n][1]), "#ffffff", 2.2);
  g.strokeStyle = c; g.lineWidth = 1.6; g.beginPath(); g.arc(OX, LY(d.O[1]), 5.5, 0, U.TAU); g.stroke(); dot(g, OX, LY(d.O[1]), 2.2, c);
  seg(g, W*.66, fy0 + 20, W*.66, mainB, U.rgba("#ffffff", .15), 1);
  // 下方課程縮圖列（目前這一課以主色標出）
  const tn = 5, tw = (fw - 8 - (tn - 1)*4)/tn, ty = mainB + 6, th = fy0 + fh - ty - 5, cur = 1 + Math.floor(r()*3);
  g.fillStyle = U.rgba("#ffffff", .07); g.fillRect(fx0, mainB, fw, fy0 + fh - mainB);
  for(let i = 0; i < tn; i++){ const tx = fx0 + 4 + i*(tw + 4);
    g.fillStyle = i === cur ? U.rgba(c, .5) : U.rgba("#ffffff", .14 + .03*i); g.fillRect(tx, ty, tw, th);
    const k = i + 2; g.strokeStyle = i === cur ? "#ffffff" : U.rgba("#ffffff", .55); g.lineWidth = 1; g.beginPath();
    for(let j = 0; j <= k; j++){ const u = j/k, xx = tx + 3 + u*(tw - 6), yy = ty + th*.35 + Math.sin(Math.PI*u)*th*.4*(i % 2 ? -1 : 1) + (i % 2 ? th*.3 : 0); j ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
    g.stroke(); }
};

// E05-51 Active Statics：手繪風單線稿（純白線，無填色）
ART.case["E05-51"] = function(g, W, H, r, c, U){
  const n = 5, d = core(r, n, {sag: .34});
  const {X, Y} = fitXY(W, H, -.1, 1.15, -.8, .15, 0, .7);
  const jit = (p) => [p[0] + (r()*2-1)*.008, p[1] + (r()*2-1)*.008];
  const F = d.F.map(jit);
  g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 1.4;
  strokePoly(g, F, X, Y, "rgba(255,255,255,.85)", 1.4);
  F.forEach((p,i) => { if(i>0 && i<F.length-1){ g.beginPath(); g.arc(X(p[0]),Y(p[1]),1.6,0,U.TAU); g.strokeStyle="rgba(255,255,255,.7)"; g.lineWidth=.8; g.stroke(); } });
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1;
  g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(1), Y(0)); g.stroke();
  supportTri(g, X(0), Y(0), false, "rgba(255,255,255,.6)"); supportTri(g, X(1), Y(0), false, "rgba(255,255,255,.6)");
  // 力圖（同樣純線稿，畫在旁）
  const fx = X(1)+30, fy0 = Y(0)-70;
  g.beginPath(); g.moveTo(fx, fy0); g.lineTo(fx, fy0+70); g.stroke();
  for(let j=0;j<=n;j++){ g.beginPath(); g.moveTo(fx, fy0+35); g.lineTo(fx+18+j*3, fy0+j*70/n); g.stroke(); }
};

// E05-52 i3DGS：3D 多面體圖解靜力學（純線框，等角）
ART.case["E05-52"] = function(g, W, H, r, c, U){
  const iso = (x,y,z,cx,cy,sc) => [cx + (x-y)*sc, cy + (x+y)*sc*.5 - z*sc*.82];
  const cx = W*.5, cy = H*.52, sc = Math.min(W,H)*.24;
  const V = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const E = [[0,2],[2,1],[1,3],[3,0],[0,4],[2,4],[1,4],[3,4],[0,5],[2,5],[1,5],[3,5]];
  const P2 = V.map(p => iso(p[0],p[1],p[2],cx,cy,sc));
  E.forEach(([a,b], i) => { g.strokeStyle = U.rgba("#ffffff", .55); g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(P2[a][0],P2[a][1]); g.lineTo(P2[b][0],P2[b][1]); g.stroke(); });
  P2.forEach(p => dot(g, p[0], p[1], 2.4, c));
  // 第二個較小的多面體，錯位漂浮，暗示多節點串接
  const cx2 = W*.24, cy2 = H*.2, sc2 = sc*.5;
  const P3 = V.map(p => iso(p[0],p[1],p[2],cx2,cy2,sc2));
  E.forEach(([a,b]) => { g.strokeStyle = U.rgba(c, .6); g.lineWidth = .9;
    g.beginPath(); g.moveTo(P3[a][0],P3[a][1]); g.lineTo(P3[b][0],P3[b][1]); g.stroke(); });
  g.strokeStyle = U.rgba("#ffffff", .3); g.setLineDash([2,3]); g.lineWidth = 1;
  g.beginPath(); g.moveTo(P3[4][0],P3[4][1]); g.lineTo(P2[5][0],P2[5][1]); g.stroke(); g.setLineDash([]);
};

// E05-53 Parametric Graphic Statics with GeoGebra：動態幾何軟體版面——左側代數區、上方工具列、右側繪圖區的無限平行線與交點作圖
ART.case["E05-53"] = function(g, W, H, r, c, U){
  const tb = 16, pw = W*.3;
  g.fillStyle = U.rgba("#ffffff", .1); g.fillRect(0, 0, W, tb);
  for(let i = 0; i < 8; i++){ const x = pw + 4 + i*((W - pw - 8)/8); g.strokeStyle = U.rgba("#ffffff", i === 2 ? .9 : .4); g.lineWidth = 1; g.strokeRect(x + 1.5, 3.5, 10, 9);
    if(i === 2){ seg(g, x + 3, 11, x + 10, 5, "#ffffff", 1); } else dot(g, x + 6.5, 8, 1.4, U.rgba("#ffffff", .6)); }
  // 代數區
  g.fillStyle = U.rgba("#ffffff", .16); g.fillRect(0, tb, pw, H - tb);
  const cols = ["#5b8def", "#5b8def", "#5b8def", "#9a9a9a", "#9a9a9a", c, c, "#6cc4ff", "#9a9a9a", "#9a9a9a"];
  cols.forEach((col, i) => { const y = tb + 9 + i*((H - tb - 12)/cols.length); if(y > H - 6) return; dot(g, 7, y, 2.6, col);
    g.fillStyle = U.rgba("#ffffff", .3); g.fillRect(13, y - 2, pw*(.35 + .45*((i*37) % 10)/10), 4); });
  seg(g, pw, tb, pw, H, U.rgba("#ffffff", .35), 1);
  // 繪圖區：格線與座標軸
  const gx0 = pw, gw = W - pw, gs = 11;
  g.save(); g.beginPath(); g.rect(gx0, tb, gw, H - tb); g.clip();
  g.strokeStyle = U.rgba("#ffffff", .06); g.lineWidth = 1; g.beginPath();
  for(let x = gx0 + 4; x < W; x += gs){ g.moveTo(x, tb); g.lineTo(x, H); } for(let y = tb + 4; y < H; y += gs){ g.moveTo(gx0, y); g.lineTo(W, y); } g.stroke();
  const n = 4, d = core(r, n, {sag: .3}), X = x => gx0 + 10 + x*gw*.58, Y = y => tb + 22 - y*gw*.58;
  seg(g, gx0, Y(0), W, Y(0), U.rgba("#ffffff", .3), 1); seg(g, X(0), tb, X(0), H, U.rgba("#ffffff", .3), 1);
  // 無限延伸的作用線與平行線（GeoGebra 的直線工具）
  d.xs.forEach(x => seg(g, X(x), tb, X(x), H, U.rgba("#9a9a9a", .45), .8, [3, 2]));
  for(let j = 0; j <= n; j++){ const a = d.F[j], b = d.F[j + 1], dx = X(b[0]) - X(a[0]), dy = Y(b[1]) - Y(a[1]), l = Math.hypot(dx, dy) || 1, ex = dx/l*W*2, ey = dy/l*W*2;
    seg(g, X(a[0]) - ex, Y(a[1]) - ey, X(a[0]) + ex, Y(a[1]) + ey, U.rgba(c, .28), .8); }
  lineP(g, d.F.map(p => [X(p[0]), Y(p[1])]), c, 2.2);
  // 力多邊形（右下）
  const hp = Math.abs(d.O[0] - d.L[0][0]), LX = W*.74, fs = Math.min((H - tb)*.45/.8, (W - 8 - LX)/hp), LY = y => H*.45 - y*fs, OX = LX + hp*fs;
  d.L.forEach(l => seg(g, OX, LY(d.O[1]), LX, LY(l[1]), U.rgba("#6cc4ff", .8), 1));
  seg(g, LX, LY(d.L[0][1]), LX, LY(d.L[n][1]), "#9a9a9a", 1.6);
  g.restore();
  // GeoGebra 式的點：自由點藍色、相依點灰色
  const gp = (x, y, col) => { dot(g, x, y, 3.4, col); g.strokeStyle = "rgba(20,20,30,.9)"; g.lineWidth = .8; g.beginPath(); g.arc(x, y, 3.4, 0, U.TAU); g.stroke(); };
  d.F.forEach((p, i) => gp(X(p[0]), Y(p[1]), i === 0 || i === d.F.length - 1 ? "#5b8def" : "#9a9a9a"));
  d.L.forEach(l => gp(LX, LY(l[1]), "#5b8def")); gp(OX, LY(d.O[1]), "#5b8def");
};
ART.case["E05-53"].ratio = .85;

// E05-54 Disjointed Force Polyhedra：一個八面體力多面體沿三個座標面拆成八塊、往外分離；切面（淡色）兩兩對應，虛線是對應面的連線
ART.case["E05-54"] = function(g, W, H, r, c, U){
  const iso = p => [W*.5 + (p[0] - p[1])*W*.2, H*.52 + (p[0] + p[1])*W*.115 - p[2]*W*.23];
  const ex = [.9 + .35*r(), .9 + .35*r(), 1 + .3*r()], gap = .34, Lg = nrm3([-.4, -.3, .85]);
  const pieces = [];
  for(const sx of [-1, 1]) for(const sy of [-1, 1]) for(const sz of [-1, 1]){
    const off = [sx*gap, sy*gap, sz*gap*.8], Vx = [sx*ex[0], 0, 0], Vy = [0, sy*ex[1], 0], Vz = [0, 0, sz*ex[2]], O = [0, 0, 0];
    const vs = [O, Vx, Vy, Vz].map(v => [v[0] + off[0], v[1] + off[1], v[2] + off[2]]);
    const fs = [[1, 2, 3, true], [0, 1, 2, false], [0, 2, 3, false], [0, 3, 1, false]];
    const cen = vs.reduce((a, v) => [a[0] + v[0]/4, a[1] + v[1]/4, a[2] + v[2]/4], [0, 0, 0]);
    pieces.push({vs, fs, cen, depth: dot3(cen, [1, 1, 1])});
  }
  // 原本完整八面體的外輪廓（虛線）
  const oct = [[ex[0], 0, 0], [0, ex[1], 0], [-ex[0], 0, 0], [0, -ex[1], 0]].map(iso), top = iso([0, 0, ex[2]]), bot = iso([0, 0, -ex[2]]);
  oct.forEach((p, i) => { const q = oct[(i + 1) % 4]; seg(g, p[0], p[1], q[0], q[1], U.rgba("#ffffff", .15), .8, [2, 3]); seg(g, p[0], p[1], top[0], top[1], U.rgba("#ffffff", .1), .8, [2, 3]); seg(g, p[0], p[1], bot[0], bot[1], U.rgba("#ffffff", .1), .8, [2, 3]); });
  pieces.sort((a, b) => a.depth - b.depth).forEach(pc => {
    pc.fs.forEach(([a, b, d2, outer]) => { const A = pc.vs[a], B = pc.vs[b], D = pc.vs[d2];
      let nn = nrm3(cross3(sub3(B, A), sub3(D, A))); const fc = [(A[0] + B[0] + D[0])/3, (A[1] + B[1] + D[1])/3, (A[2] + B[2] + D[2])/3];
      if(dot3(nn, sub3(fc, pc.cen)) < 0) nn = [-nn[0], -nn[1], -nn[2]];
      if(dot3(nn, [1, 1, 1]) <= 0) return;
      const l = .3 + .7*Math.max(0, dot3(nn, Lg)), pts = [A, B, D].map(iso);
      fillP(g, pts, outer ? tone(c, .35 + .75*l, .95) : `rgba(${Math.round(150 + 90*l)},${Math.round(150 + 90*l)},${Math.round(160 + 85*l)},.85)`);
      lineP(g, pts, U.rgba("#ffffff", .7), .9, true); });
  });
  // 對應切面的連線
  const fcen = (s, drop) => { const off = [s[0]*gap, s[1]*gap, s[2]*gap*.8], v = [s[0]*ex[0]/3, s[1]*ex[1]/3, s[2]*ex[2]/3]; v[drop] = 0; return iso([v[0] + off[0], v[1] + off[1], v[2] + off[2]]); };
  [[[1, 1, 1], [1, 1, -1], 2], [[1, 1, 1], [-1, 1, 1], 0], [[1, 1, 1], [1, -1, 1], 1]].forEach(([s1, s2, ax]) => { const a = fcen(s1, ax), b = fcen(s2, ax);
    seg(g, a[0], a[1], b[0], b[1], U.rgba("#6cc4ff", .85), 1, [2, 2]); dot(g, a[0], a[1], 1.8, "#6cc4ff"); dot(g, b[0], b[1], 1.8, "#6cc4ff"); });
};

})();
