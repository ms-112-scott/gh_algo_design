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

// =================== 變形（索引對應 variations，0 起算） ===================

// V01 不等高支承與三點通過：只畫形狀圖，貼合斜向地形並保證通過指定第三點
ART.var["E05"][0] = function(g, W, H, r, c, U){
  const n = 6, d = core(r, n, {sag: .3});
  const rise = .16 + .16*r();
  const F = d.F.map(p => [p[0], p[1] + (p[0]/d.span)*rise]);
  const passIdx = 1 + Math.floor(r()*(n-1)), pass = F[passIdx];
  let yMin = 0, yMax = rise; F.forEach(p => { if(p[1] < yMin) yMin = p[1]; if(p[1] > yMax) yMax = p[1]; });
  const {X, Y} = fitXY(W, H, -.05, d.span + .28, yMin - .1, yMax + .18, 0, .88);
  g.setLineDash([3,4]); g.strokeStyle = U.rgba("#ffffff", .3); g.lineWidth = 1;
  g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(d.span), Y(rise)); g.stroke(); g.setLineDash([]);
  strokePoly(g, F, X, Y, c, 2.6);
  F.forEach((p, i) => { if(i > 0 && i < F.length-1) dot(g, X(p[0]), Y(p[1]), 2, U.rgba(c, .8)); });
  supportTri(g, X(0), Y(0), false, c); supportTri(g, X(d.span), Y(rise), false, c);
  const px = X(pass[0]), py = Y(pass[1]);
  g.strokeStyle = "#ffffff"; g.lineWidth = 1.4;
  g.beginPath(); g.arc(px, py, 6, 0, U.TAU); g.stroke();
  dot(g, px, py, 2.2, "#ffffff");
  g.beginPath(); g.moveTo(px-9, py); g.lineTo(px+9, py); g.moveTo(px, py-9); g.lineTo(px, py+9); g.stroke();
  const tx = X(d.span) + 16;
  g.strokeStyle = U.rgba("#ffffff", .5); g.lineWidth = 1;
  g.beginPath(); g.moveTo(tx, Y(0)); g.lineTo(tx, Y(rise)); g.moveTo(tx-3, Y(0)); g.lineTo(tx+3, Y(0)); g.moveTo(tx-3, Y(rise)); g.lineTo(tx+3, Y(rise)); g.stroke();
};

// V02 斜向與任意方向載重：風力讓索偏向下風側，力圖的載重線也變成折線
ART.var["E05"][1] = function(g, W, H, r, c, U){
  const n = 5, d = core(r, n, {sag: .34});
  const windK = .22 + .2*r(), dir = r() < .5 ? -1 : 1;
  const F = d.F.map(p => [p[0] + dir*windK*Math.max(0, -p[1]), p[1]]);
  let minY = 0; F.forEach(p => { if(p[1] < minY) minY = p[1]; });
  let minX = 0, maxX = d.span; F.forEach(p => { if(p[0] < minX) minX = p[0]; if(p[0] > maxX) maxX = p[0]; });
  const {X, Y} = fitXY(W, H, minX - .08, maxX + .55, minY - .1, .18, 0, .9);
  g.setLineDash([3,4]); g.strokeStyle = U.rgba("#ffffff", .25); g.lineWidth = 1;
  g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(d.span), Y(0)); g.stroke(); g.setLineDash([]);
  strokePoly(g, F, X, Y, c, 2.3);
  supportTri(g, X(0), Y(0), false, c); supportTri(g, X(d.span), Y(0), false, c);
  for(let i = 0; i < n; i++){
    const p = F[i+1], px = X(p[0]), py = Y(p[1]);
    loadArrow(g, px, py, 15, 0, U.rgba("#ffffff", .78));
    loadArrow(g, px, py, 9 + windK*20, dir*Math.PI/2, U.rgba("#ffd27a", .85));
  }
  // 風向大箭頭
  loadArrow(g, W*.1, H*.14, 20, dir*Math.PI/2, U.rgba("#ffd27a", .9));
  // 力圖：折線載重線（風力使原本垂直的載重線變成鋸齒）
  const fx = W*.85, fy0 = H*.1, segH = H*.6/n;
  g.strokeStyle = "#ffffff"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(fx, fy0);
  let cy = fy0;
  for(let i = 0; i < n; i++){ cy += segH; const zig = dir*(8 + windK*14)*((i%2)?1:.4); g.lineTo(fx + zig, cy); }
  g.stroke();
  for(let i = 0; i <= n; i++) dot(g, fx + (i>0&&i<=n?dir*(8+windK*14)*(((i-1)%2)?1:.4):0), fy0 + i*segH, 2, "#ffffff");
};

// V03 自重迭代逼近懸鏈線：多輪疊圖，從拋物線收斂到懸鏈線
ART.var["E05"][2] = function(g, W, H, r, c, U){
  const n = 7, span = 1;
  const {xs, P, tot} = genLoads(r, n, span);
  const iters = 5, curves = [];
  for(let it = 0; it < iters; it++){
    const jitter = .16*(1 - it/(iters-1));
    const P2 = P.map((p, i) => Math.max(.1, p*(1 + (it===0?0:1)) + (r()*2-1)*jitter));
    curves.push(funFromLoads(xs, P2, P2.reduce((a,b)=>a+b,0), {span, sag: .3}).F);
  }
  const {X, Y} = fitXY(W, H, -.06, span+.06, -.85, .1, 0, .9);
  g.setLineDash([3,4]); g.strokeStyle = U.rgba("#ffffff", .25); g.lineWidth = 1;
  g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(span), Y(0)); g.stroke(); g.setLineDash([]);
  curves.forEach((F, it) => {
    const t = it/(iters-1);
    strokePoly(g, F, X, Y, U.rgba(c, .25 + .65*t), 1 + t*1.8);
  });
  supportTri(g, X(0), Y(0), false, c); supportTri(g, X(span), Y(0), false, c);
  // 左側輪次序列小圓點（由小漸大代表收斂順序）
  for(let it = 0; it < iters; it++){ const t = it/(iters-1); dot(g, 16 + it*10, H - 16, 2 + t*3, U.rgba(c, .35 + .6*t)); }
};

// V04 推力線放進拱厚：拱的內外弧帶＋最小/最大推力線，觸線處標鉸點
ART.var["E05"][3] = function(g, W, H, r, c, U){
  const n = 8, dLo = core(r, n, {arch: true, sag: .22});
  const g2 = genLoads(r, n, 1); // 不使用；保持索引一致
  const dHi = funFromLoads(dLo.xs, dLo.P, dLo.P.reduce((a,b)=>a+b,0), {arch: true, sag: .42});
  const F = dLo.F;
  const {X, Y} = fitXY(W, H, -.08, 1.08, -.05, .55, 0, .9);
  const band = t => .045 + .05*Math.sin(Math.PI*t)*.9 + .02;
  const inner = [], outer = [];
  F.forEach((p, i) => { const t = p[0]; const b = band(t); inner.push([p[0], p[1]-b]); outer.push([p[0], p[1]+b]); });
  g.fillStyle = U.rgba(c, .12);
  g.beginPath(); outer.forEach((p,i)=> i? g.lineTo(X(p[0]),Y(p[1])) : g.moveTo(X(p[0]),Y(p[1])));
  for(let i = inner.length-1; i >= 0; i--) g.lineTo(X(inner[i][0]), Y(inner[i][1]));
  g.closePath(); g.fill();
  strokePoly(g, outer, X, Y, U.rgba("#ffffff", .5), 1.2);
  strokePoly(g, inner, X, Y, U.rgba("#ffffff", .5), 1.2);
  strokePoly(g, dHi.F, X, Y, U.rgba(c, .55), 1.6, [2,3]);
  strokePoly(g, dLo.F, X, Y, "#ffffff", 2.4);
  // 觸到內外弧的節點標紅（可能形成鉸的位置）
  F.forEach((p, i) => { const t = p[0], b = band(t);
    if(Math.abs(p[1]-inner[i][1]) < .012 || Math.abs(outer[i][1]-p[1]) < .012) dot(g, X(p[0]), Y(p[1]), 3.2, "#ff5a52"); });
  supportTri(g, X(0), Y(0), false, c); supportTri(g, X(1), Y(0), false, c);
};

// V05 Cremona 交互力圖：吊拱式桁架，上弦為壓力索多邊形，下弦為拉力繫桿，斜撐相連
ART.var["E05"][4] = function(g, W, H, r, c, U){
  const n = 6, d = core(r, n, {arch: true, sag: .3});
  const top = d.F, bot = d.xs.map(x => [x, 0]); bot.unshift([0,0]); bot.push([1,0]);
  const {X, Y} = fitXY(W, H, -.06, 1.06, -.05, .5, 0, .88);
  // 斜撐（腹桿）
  g.strokeStyle = U.rgba("#ffffff", .45); g.lineWidth = 1.1;
  for(let i = 0; i <= n; i++){
    g.beginPath(); g.moveTo(X(top[i][0]), Y(top[i][1])); g.lineTo(X(bot[i][0]), Y(bot[i][1])); g.stroke();
    if(i < n){ g.beginPath(); g.moveTo(X(top[i][0]), Y(top[i][1])); g.lineTo(X(bot[i+1][0]), Y(bot[i+1][1])); g.stroke(); }
  }
  // 上弦（壓，色階＋粗細依內力）與下弦（拉，白色細線＋等張力）
  const fMax = Math.max(...d.forces);
  for(let j = 0; j <= n; j++){ g.strokeStyle = hueCol(j/n); g.lineWidth = 1 + 5*d.forces[j]/fMax;
    g.beginPath(); g.moveTo(X(top[j][0]), Y(top[j][1])); g.lineTo(X(top[j+1][0]), Y(top[j+1][1])); g.stroke(); }
  strokePoly(g, bot, X, Y, "#ffffff", 2.2);
  supportTri(g, X(0), Y(0), false, c); supportTri(g, X(1), Y(0), false, c);
  // 右側：交互力圖（力多邊形網），節點以 Bow 記號式色點標出
  const fx = W*.86, fy = H*.5, fs2 = Math.min(W,H)*.16;
  for(let j = 0; j <= n; j++){ const a = -Math.PI/2 + (j/n - .5)*1.5;
    g.strokeStyle = hueCol(j/n); g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(a)*fs2*.5, fy + Math.sin(a)*fs2*.5); g.stroke();
    dot(g, fx + Math.cos(a)*fs2*.5, fy + Math.sin(a)*fs2*.5, 2, "#ffffff"); }
  dot(g, fx, fy, 2.6, "#ffffff");
};

// V06 切片法分析拱頂：3D 殼體沿一方向切成平行拱片，每片各自跑一次索多邊形
ART.var["E05"][5] = function(g, W, H, r, c, U){
  const slices = 5, n = 5, curves = [], bases = [];
  for(let k = 0; k < slices; k++){
    const d = core(r, n, {arch: true, sag: .22 + .06*Math.sin(k*1.7)});
    const dxm = k*.14, dym = k*.08;
    curves.push(d.F.map(p => [p[0]+dxm, p[1]+dym]));
    bases.push([[dxm,dym],[1+dxm,dym]]);
  }
  let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
  curves.forEach(pts => pts.forEach(p => { if(p[0]<minX)minX=p[0]; if(p[0]>maxX)maxX=p[0]; if(p[1]<minY)minY=p[1]; if(p[1]>maxY)maxY=p[1]; }));
  const {X, Y} = fitXY(W, H, minX-.04, maxX+.04, Math.min(0,minY)-.04, maxY+.06, 0, .92);
  for(let k = slices - 1; k >= 0; k--){
    const pts = curves[k], base = bases[k], shade = .35 + .5*(k/(slices-1));
    g.fillStyle = U.rgba(c, .05); g.beginPath(); g.moveTo(X(base[0][0]), Y(base[0][1]));
    pts.forEach(p => g.lineTo(X(p[0]), Y(p[1]))); g.lineTo(X(base[1][0]), Y(base[1][1])); g.closePath(); g.fill();
    g.strokeStyle = U.rgba("#ffffff", .18 + .12*(k/(slices-1))); g.lineWidth = 1;
    g.beginPath(); g.moveTo(X(base[0][0]), Y(base[0][1])); g.lineTo(X(base[1][0]), Y(base[1][1])); g.stroke();
    // 每片的推力線，超出安全帶（示意）的以警示色標出
    strokePoly(g, pts, X, Y, k === slices-1 ? "#ff5a52" : U.rgba(c, shade), k === slices-1 ? 2.2 : 1.6);
  }
};

// V07 多面體 3D 圖解靜力學：力多面體（八面體線框）＋方向對應的分枝受壓柱
ART.var["E05"][6] = function(g, W, H, r, c, U){
  const iso = (x,y,z,cx,cy,sc) => [cx + (x-y)*sc, cy + (x+y)*sc*.5 - z*sc*.82];
  const cx = W*.28, cy = H*.36, sc = Math.min(W,H)*.16;
  const V = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const faces = [[0,2,4],[2,1,4],[1,3,4],[3,0,4],[0,2,5],[2,1,5],[1,3,5],[3,0,5]];
  const P2 = V.map(p => iso(p[0],p[1],p[2],cx,cy,sc));
  faces.forEach((f, i) => { g.fillStyle = hueCol(i/faces.length).replace('0.95', '0.28');
    g.beginPath(); f.forEach((k,j)=> j? g.lineTo(P2[k][0],P2[k][1]) : g.moveTo(P2[k][0],P2[k][1])); g.closePath(); g.fill();
    g.strokeStyle = hueCol(i/faces.length); g.lineWidth = 1.2; g.stroke(); });
  // 分枝受壓柱：方向取自面法向量投影，從基座往上分岔到共同節點
  const baseY = H*.86, apex = [W*.7, H*.18];
  const dirs = [[-.85,0],[-.3,0],[.3,0],[.85,0]];
  dirs.forEach((dv, i) => { const bx = W*.55 + dv[0]*W*.14, by = baseY;
    const mx = (bx + apex[0])/2 + dv[0]*10, my = (by + apex[1])/2;
    g.strokeStyle = hueCol((i+1)/(dirs.length+1)); g.lineWidth = 2 + (dirs.length-i)*.4;
    g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(mx, my, apex[0], apex[1]); g.stroke();
    dot(g, bx, by, 2.6, "#ffffff"); });
  dot(g, apex[0], apex[1], 3.4, "#ffffff");
  g.strokeStyle = U.rgba("#ffffff", .3); g.lineWidth = 1; g.beginPath(); g.moveTo(W*.4, baseY); g.lineTo(W*.98, baseY); g.stroke();
};

// V08 沿推力線切楔形石塊：拱厚帶切成楔形拱石，右下角附展開輪廓
ART.var["E05"][7] = function(g, W, H, r, c, U){
  const n = 9, d = core(r, n, {arch: true, sag: .26});
  const {X, Y} = fitXY(W, H, -.08, 1.08, -.05, .5, 0, .86);
  const F = d.F, half = .04;
  const norm = i => { const a = F[Math.max(0,i-1)], b = F[Math.min(F.length-1,i+1)]; const dx = b[0]-a[0], dy = b[1]-a[1], l = Math.hypot(dx,dy)||1; return [-dy/l, dx/l]; };
  for(let i = 0; i < F.length-1; i++){
    const n0 = norm(i), n1 = norm(i+1);
    const a0 = [F[i][0]+n0[0]*half, F[i][1]+n0[1]*half], a1 = [F[i][0]-n0[0]*half, F[i][1]-n0[1]*half];
    const b0 = [F[i+1][0]+n1[0]*half, F[i+1][1]+n1[1]*half], b1 = [F[i+1][0]-n1[0]*half, F[i+1][1]-n1[1]*half];
    g.fillStyle = i % 2 ? U.rgba(c, .3) : U.rgba(c, .17);
    g.beginPath(); g.moveTo(X(a0[0]),Y(a0[1])); g.lineTo(X(b0[0]),Y(b0[1])); g.lineTo(X(b1[0]),Y(b1[1])); g.lineTo(X(a1[0]),Y(a1[1])); g.closePath();
    g.fill(); g.strokeStyle = "#ffffff"; g.lineWidth = 1; g.stroke();
  }
  supportTri(g, X(0), Y(0), false, c); supportTri(g, X(1), Y(0), false, c);
  // 右下角：單塊拱石的展開輪廓（雷切／CNC 用）
  const bx = W*.78, by = H*.78, bw = W*.16, bh = H*.12;
  g.fillStyle = "rgba(18,18,23,.85)"; g.fillRect(bx-6, by-bh-6, bw+12, bh+12);
  g.strokeStyle = U.rgba("#ffffff", .6); g.lineWidth = 1;
  g.beginPath(); g.moveTo(bx, by-bh); g.lineTo(bx+bw*.15, by); g.lineTo(bx+bw*.85, by); g.lineTo(bx+bw, by-bh); g.closePath(); g.stroke();
  g.fillStyle = U.rgba(c, .3); g.fill();
  for(let i=1;i<4;i++){ g.beginPath(); g.moveTo(bx+bw*i/4, by-bh); g.lineTo(bx+bw*i/4, by); g.strokeStyle = U.rgba("#ffffff",.25); g.stroke(); }
};

// V09 拖曳極點即時互動：多個極點位置的殘影索多邊形＋游標與極距小圖
ART.var["E05"][8] = function(g, W, H, r, c, U){
  const n = 5, {xs, P, tot} = genLoads(r, n, 1);
  const sags = [.6, .45, .34, .26, .2];
  const {X, Y} = fitXY(W, H, -.08, 1.08, -.9, .15, 0, .86);
  g.setLineDash([3,4]); g.strokeStyle = U.rgba("#ffffff", .25); g.lineWidth = 1;
  g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(1), Y(0)); g.stroke(); g.setLineDash([]);
  let lastO = null;
  sags.forEach((sagK, i) => { const d = funFromLoads(xs, P, tot, {sag: sagK});
    const t = i/(sags.length-1);
    strokePoly(g, d.F, X, Y, U.rgba(c, .2 + .7*t), 1 + t*2);
    if(i === sags.length-1) lastO = d.O; });
  supportTri(g, X(0), Y(0), false, c); supportTri(g, X(1), Y(0), false, c);
  // 拖曳游標：手指圖示＋弧形拖曳路徑
  const cx0 = X(lastO[0] - .3), cy0 = Y(0);
  g.strokeStyle = U.rgba("#ffffff", .4); g.setLineDash([2,3]); g.lineWidth = 1;
  g.beginPath(); g.arc(cx0, cy0 - 30, 34, Math.PI*.15, Math.PI*.75); g.stroke(); g.setLineDash([]);
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(cx0, cy0 - 30, 5, 0, U.TAU); g.fill();
  g.strokeStyle = "#ffffff"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx0, cy0-30); g.lineTo(cx0+9, cy0-46); g.stroke();
  // 小推力量表
  const gx = W*.82, gy = H*.85, gw = W*.14;
  g.strokeStyle = U.rgba("#ffffff", .5); g.lineWidth = 1; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx+gw, gy); g.stroke();
  dot(g, gx + gw*.7, gy, 3, c);
};

// V10 內力決定截面與載重路徑：索多邊形畫成粗細對應內力的桿件＋矢高–材料量曲線
ART.var["E05"][9] = function(g, W, H, r, c, U){
  const n = 6, {xs, P, tot} = genLoads(r, n, 1);
  const d = funFromLoads(xs, P, tot, {sag: .3});
  const {X, Y} = fitXY(W, H, -.08, 1.08, -.75, .12, 0, .8);
  const fMax = Math.max(...d.forces);
  for(let j = 0; j <= n; j++){ const a = d.F[j], b = d.F[j+1], ax = X(a[0]), ay = Y(a[1]), bx = X(b[0]), by = Y(b[1]);
    const w = 2 + 9*d.forces[j]/fMax;
    g.strokeStyle = hueCol(j/n); g.lineWidth = w; g.lineCap = "round";
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
  }
  supportTri(g, X(0), Y(0), false, c); supportTri(g, X(1), Y(0), false, c);
  // 下方：矢高（sag）掃描 → 材料量（Σ|F|·L）曲線，標出最省材料的最低點
  const samples = []; for(let s = 0; s < 16; s++){ const sagV = .1 + s*.03;
    const dd = funFromLoads(xs, P, tot, {sag: sagV}); let m = 0;
    for(let j = 0; j <= n; j++) m += dd.forces[j]*Math.hypot(dd.F[j+1][0]-dd.F[j][0], dd.F[j+1][1]-dd.F[j][1]);
    samples.push([sagV, m]); }
  const gx = W*.08, gy = H*.9, gw = W*.4, gh = H*.14;
  const mMin = Math.min(...samples.map(s=>s[1])), mMax = Math.max(...samples.map(s=>s[1]));
  g.strokeStyle = U.rgba("#ffffff", .5); g.lineWidth = 1;
  g.beginPath(); g.moveTo(gx, gy-gh); g.lineTo(gx, gy); g.lineTo(gx+gw, gy); g.stroke();
  g.strokeStyle = c; g.lineWidth = 1.6; g.beginPath();
  samples.forEach((s,i) => { const px = gx + gw*i/(samples.length-1), py = gy - gh*(s[1]-mMin)/((mMax-mMin)||1); i? g.lineTo(px,py) : g.moveTo(px,py); }); g.stroke();
  let bi = 0; samples.forEach((s,i) => { if(s[1] < samples[bi][1]) bi = i; });
  const bx = gx + gw*bi/(samples.length-1), by = gy - gh*(samples[bi][1]-mMin)/((mMax-mMin)||1);
  dot(g, bx, by, 3, "#ffffff");
};

// V11 接 E06 力密度法對照：同一組載重，索多邊形與一維 FDM 鏈解出來的形狀疊合比較
ART.var["E05"][10] = function(g, W, H, r, c, U){
  const n = 8, {xs, P, tot} = genLoads(r, n, 1);
  const d = funFromLoads(xs, P, tot, {sag: .3});
  // 用索多邊形各段的力密度 q = F / 長度，組一維 FDM 鏈（Jacobi 迭代解 y）
  const L = []; for(let j = 0; j <= n; j++) L.push(Math.hypot(d.F[j+1][0]-d.F[j][0], d.F[j+1][1]-d.F[j][1]));
  const q = d.forces.map((f,j) => f/(L[j]||1e-6));
  const y = new Array(n+2).fill(0); y[0] = 0; y[n+1] = 0;
  const loadOf = i => -P[i-1]*d.fs*30;
  for(let it = 0; it < 200; it++){ const ny = y.slice();
    for(let i = 1; i <= n; i++){ const a = q[i-1], b = q[i]; ny[i] = (a*y[i-1] + b*y[i+1] + loadOf(i))/(a+b); }
    for(let i = 1; i <= n; i++) y[i] = ny[i]; }
  const fdmPts = [[0,0]]; for(let i = 1; i <= n; i++) fdmPts.push([xs[i-1], y[i]]); fdmPts.push([1,0]);
  const scaleFix = d.F[Math.floor((n+1)/2)][1] / (fdmPts[Math.floor((n+1)/2)][1] || -1e-6);
  const fdmScaled = fdmPts.map(p => [p[0], p[1]*scaleFix]);
  const {X, Y} = fitXY(W, H, -.06, 1.06, -.8, .1, 0, .86);
  g.setLineDash([3,4]); g.strokeStyle = U.rgba("#ffffff", .25); g.lineWidth = 1;
  g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(1), Y(0)); g.stroke(); g.setLineDash([]);
  strokePoly(g, d.F, X, Y, c, 2.6);
  strokePoly(g, fdmScaled, X, Y, "#ffffff", 1.4, [2,3]);
  supportTri(g, X(0), Y(0), false, c); supportTri(g, X(1), Y(0), false, c);
  fdmScaled.forEach((p,i) => { if(i>0 && i<fdmScaled.length-1) dot(g, X(p[0]), Y(p[1]), 1.8, "#ffffff"); });
};

// V12 接 A05 形狀文法的分枝平衡：遞迴把一個受壓力向量拆成兩支，向量和永遠封閉
ART.var["E05"][11] = function(g, W, H, r, c, U){
  const root = [W*.5, H*.86], vec0 = [0, -H*.62];
  const cx = W*.5, cy = H*.14;
  const branches = [];
  function split(p, v, depth){
    branches.push([p, v, depth]);
    if(depth >= 3 || Math.hypot(v[0],v[1]) < 14) return;
    const t = .38 + r()*.24, k = (r()*2-1)*.28;
    const perp = [-v[1], v[0]];
    const A = [v[0]*t + perp[0]*k, v[1]*t + perp[1]*k];
    const B = [v[0]*(1-t) - perp[0]*k, v[1]*(1-t) - perp[1]*k];
    const mid = [p[0]+A[0], p[1]+A[1]];
    split(p, A, depth+1); split(mid, B, depth+1);
  }
  split(root, vec0, 0);
  const maxLen = Math.max(...branches.map(b => Math.hypot(b[1][0], b[1][1])));
  branches.forEach(([p, v, depth]) => { const len = Math.hypot(v[0], v[1]);
    g.strokeStyle = hueCol(1 - depth/3); g.lineWidth = 1.5 + 5*len/maxLen; g.lineCap = "round";
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0]+v[0], p[1]+v[1]); g.stroke();
    dot(g, p[0]+v[0], p[1]+v[1], 2, "#ffffff"); });
  g.fillStyle = c; g.beginPath(); g.moveTo(root[0], root[1]); g.lineTo(root[0]-7, root[1]+10); g.lineTo(root[0]+7, root[1]+10); g.closePath(); g.fill();
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

// E05-02 Maillart Salginatobel 橋設計方法：淺拱橋面＋推力熱度分析
ART.case["E05-02"] = function(g, W, H, r, c, U){
  const n = 7, d = core(r, n, {arch: true, sag: .16});
  const {X, Y} = fitXY(W, H, -.06, 1.06, -.05, .3, 0, .82);
  // 橋面
  const deckY = .28;
  g.strokeStyle = U.rgba("#ffffff", .7); g.lineWidth = 3;
  g.beginPath(); g.moveTo(X(0), Y(deckY)); g.lineTo(X(1), Y(deckY)); g.stroke();
  const fMax = Math.max(...d.forces);
  for(let j = 0; j <= n; j++){ const a = d.F[j], b = d.F[j+1], t = d.forces[j]/fMax;
    g.strokeStyle = hueCol(t); g.lineWidth = 1.4 + 3*t;
    g.beginPath(); g.moveTo(X(a[0]), Y(a[1])); g.lineTo(X(b[0]), Y(b[1])); g.stroke(); }
  // 橋面與拱之間的吊柱／墩柱
  g.strokeStyle = U.rgba("#ffffff", .4); g.lineWidth = 1;
  for(let i = 0; i <= n; i++){ const p = d.F[i]; g.beginPath(); g.moveTo(X(p[0]), Y(p[1])); g.lineTo(X(p[0]), Y(deckY)); g.stroke(); }
  supportTri(g, X(0), Y(0), false, c); supportTri(g, X(1), Y(0), false, c);
  // 右側色階圖例
  const bx = W*.9, by0 = H*.15, bh = H*.5;
  const grad = g.createLinearGradient(0, by0, 0, by0+bh); grad.addColorStop(0, hueCol(1)); grad.addColorStop(1, hueCol(0));
  g.fillStyle = grad; g.fillRect(bx, by0, 8, bh);
};

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

// E05-09 eQUILIBRIUM 互動式學習平台：形狀圖／力圖並列的軟體介面
ART.case["E05-09"] = function(g, W, H, r, c, U){
  g.strokeStyle = U.rgba("#ffffff", .35); g.lineWidth = 1.2; g.strokeRect(6, 6, W-12, H-12);
  g.strokeStyle = U.rgba("#ffffff", .2); g.beginPath(); g.moveTo(6, 26); g.lineTo(W-6, 26); g.stroke();
  for(let i=0;i<4;i++) dot(g, 16+i*12, 16, 2.4, U.rgba("#ffffff", .5));
  const midX = W*.55;
  g.strokeStyle = U.rgba("#ffffff", .2); g.beginPath(); g.moveTo(midX, 30); g.lineTo(midX, H-10); g.stroke();
  const n = 5, d = core(r, n, {sag: .3});
  const {X, Y} = fitXY(midX-16, H-40, -.06, 1.06, -.75, .1, 0, .84);
  strokePoly(g, d.F, x=>X(x)+8, y=>Y(y)+34, c, 2);
  supportTri(g, X(0)+8, Y(0)+34, false, c); supportTri(g, X(1)+8, Y(0)+34, false, c);
  // 右側力圖
  const fx0 = midX+18, fy0 = 40, fh = H-70;
  g.strokeStyle = "#ffffff"; g.lineWidth = 2; g.beginPath(); g.moveTo(fx0, fy0); g.lineTo(fx0, fy0+fh); g.stroke();
  const fMax = Math.max(...d.forces);
  for(let j=0;j<=n;j++){ const t = d.forces[j]/fMax; g.strokeStyle = hueCol(j/n); g.lineWidth = 1+3*t;
    g.beginPath(); g.moveTo(fx0, fy0+fh*.5); g.lineTo(fx0 + 30 + t*30, fy0 + j*fh/n); g.stroke(); }
  // 游標
  g.strokeStyle = "#ffffff"; g.lineWidth = 1.4; const mx=fx0+34, my=fy0+fh*.4;
  g.beginPath(); g.moveTo(mx,my); g.lineTo(mx,my+11); g.lineTo(mx+3.5,my+8); g.lineTo(mx+6,my+13); g.moveTo(mx+3.5,my+8); g.lineTo(mx+7.5,my+6); g.closePath(); g.stroke();
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

// E05-53 Parametric Graphic Statics with GeoGebra：構造線可見的幾何作圖風格
ART.case["E05-53"] = function(g, W, H, r, c, U){
  const n = 4, d = core(r, n, {sag: .3});
  const {X, Y} = fitXY(W, H, -.15, 1.2, -.8, .3, 0, .75);
  // 座標格點
  g.fillStyle = "rgba(255,255,255,.15)";
  for(let i=-1;i<=6;i++) for(let j=-4;j<=1;j++){ g.beginPath(); g.arc(X(i*.2), Y(j*.2), 1, 0, U.TAU); g.fill(); }
  g.strokeStyle = U.rgba("#ffffff", .35); g.lineWidth = 1;
  g.beginPath(); g.moveTo(X(-.15), Y(0)); g.lineTo(X(1.2), Y(0)); g.moveTo(X(0), Y(.3)); g.lineTo(X(0), Y(-.8)); g.stroke();
  // 構造線：試算極點到各射線
  const O = d.O;
  g.strokeStyle = U.rgba(c, .35); g.setLineDash([2,3]); g.lineWidth = 1;
  d.F.forEach((p,i) => { g.beginPath(); g.moveTo(X(O[0]), Y(O[1])); g.lineTo(X(p[0]), Y(p[1])); g.stroke(); });
  g.setLineDash([]);
  strokePoly(g, d.F, X, Y, c, 2);
  d.F.forEach((p,i) => { g.strokeStyle = "#ffffff"; g.lineWidth = 1.2; g.beginPath(); g.arc(X(p[0]), Y(p[1]), 3, 0, U.TAU); g.stroke(); });
  // 角度標記
  g.strokeStyle = U.rgba("#ffffff", .6); g.lineWidth = 1;
  g.beginPath(); g.arc(X(d.F[1][0]), Y(d.F[1][1]), 10, 0, .9); g.stroke();
};

// E05-54 Disjointed Force Polyhedra：多個分開的力多面體＋虛線對應關係
ART.case["E05-54"] = function(g, W, H, r, c, U){
  const iso = (x,y,z,cx,cy,sc) => [cx + (x-y)*sc, cy + (x+y)*sc*.5 - z*sc*.82];
  const V = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,.8]];
  const E = [[0,2],[2,1],[1,3],[3,0],[0,4],[1,4],[2,4],[3,4]];
  const groups = [[W*.28,H*.3,.16],[W*.68,H*.24,.12],[W*.42,H*.72,.14],[W*.78,H*.72,.1]];
  const groupPts = groups.map(([cx,cy,k]) => V.map(p => iso(p[0],p[1],p[2],cx,cy,Math.min(W,H)*k)));
  groupPts.forEach((P2, gi) => { E.forEach(([a,b]) => { g.strokeStyle = hueCol(gi/groups.length); g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(P2[a][0],P2[a][1]); g.lineTo(P2[b][0],P2[b][1]); g.stroke(); });
    P2.forEach(p => dot(g, p[0], p[1], 1.8, "#ffffff")); });
  // 對應頂點的虛線連結（示意「分開後仍對應」）
  g.strokeStyle = U.rgba("#ffffff", .3); g.setLineDash([2,3]); g.lineWidth = .8;
  for(let k=0;k<groups.length-1;k++){ g.beginPath(); g.moveTo(groupPts[k][4][0], groupPts[k][4][1]); g.lineTo(groupPts[k+1][4][0], groupPts[k+1][4][1]); g.stroke(); }
  g.setLineDash([]);
};

})();
