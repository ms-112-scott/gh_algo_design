/* G02 太陽包絡：基本生成器（變形與案例的獨立畫法由 gh-enrich 的 ART 單元補上） */
(function(){
const ART = window.ART, U = window.GENUTIL;

// 太陽方向（X 東、Y 北、Z 上）：赤緯＋時角的簡化公式，和 C# 範例的 SunVectors 相同
function sunVectors(lat, day, t0, t1, step){
  const phi = lat*Math.PI/180, dec = 23.44*Math.PI/180*Math.sin(2*Math.PI*(284 + day)/365), out = [];
  for(let t = t0; t <= t1 + 1e-9; t += step){
    const w = 15*(t - 12)*Math.PI/180;
    const x = -Math.cos(dec)*Math.sin(w), y = Math.sin(dec)*Math.cos(phi) - Math.cos(dec)*Math.cos(w)*Math.sin(phi), z = Math.sin(dec)*Math.sin(phi) + Math.cos(dec)*Math.cos(w)*Math.cos(phi);
    if(z > .02) out.push([x, y, z]);
  }
  return out;
}
// 射線（p + t·d）與線段 ab 的交點距離；沒交到回傳 Infinity
function rayHit(px, py, dx, dy, a, b){
  const ex = b[0] - a[0], ey = b[1] - a[1], den = dx*ey - dy*ex;
  if(Math.abs(den) < 1e-12) return Infinity;
  const qx = a[0] - px, qy = a[1] - py, t = (qx*ey - qy*ex)/den, u = (qx*dy - qy*dx)/den;
  return (t > 0 && u >= 0 && u <= 1) ? t : Infinity;
}

U.GEN["G02"] = function(g, W, H, r, v, c){
  const TAU = U.TAU, rgba = U.rgba;
  // 基地：nx × ny 格（1 格 = 1 單位），北側隔一條街是要保護日照的鄰地
  const nx = 14 + (v % 3)*2, ny = 10 + (v % 2)*2, gap = 2 + r()*2;
  const lat = [25, 35, 45, 23.5, 40, 30][v % 6], day = 355;   // 冬至
  const t0 = [9, 8, 10, 9.5][v % 4], t1 = 24 - t0;
  const suns = sunVectors(lat, day, t0, t1, (t1 - t0)/6);
  // 遮陰線（shadow fence）：依 v 換不同的鄰地配置
  const fences = [];
  const jag = k => ny + gap + (r() - .5)*2.2*k;
  if(v % 3 === 0) fences.push([[-20, ny + gap], [nx + 20, ny + gap]]);
  else if(v % 3 === 1){ fences.push([[-20, ny + gap], [nx*.55, ny + gap]]); fences.push([[nx*.55, ny + gap], [nx*.55, ny + gap + 3]]); fences.push([[nx*.55, ny + gap + 3], [nx + 20, ny + gap + 3]]); fences.push([[nx + gap, -4], [nx + gap, ny + gap]]); }
  else { let px = -20, py = jag(1); for(let k = 0; k < 7; k++){ const qx = px + (nx + 40)/7, qy = jag(1); fences.push([[px, py], [qx, qy]]); px = qx; py = qy; } fences.push([[-gap, -4], [-gap, ny*.7]]); }
  const fenceH = v % 4 === 3 ? 1.2 : 0, maxH = 7 + (v % 5);

  // 逐點、逐時刻：沿影子方向找最近的遮陰線，允許高度 = fenceH + D·tan(高度角)，取最小值
  const h = [];
  for(let i = 0; i <= nx; i++){ h[i] = [];
    for(let j = 0; j <= ny; j++){ let best = maxH;
      for(const [sx, sy, sz] of suns){ const hz = Math.hypot(sx, sy), dx = -sx/hz, dy = -sy/hz;
        let D = Infinity; for(const [a, b] of fences) D = Math.min(D, rayHit(i, j, dx, dy, a, b));
        if(D < Infinity) best = Math.min(best, fenceH + D*sz/hz); }
      h[i][j] = Math.max(0, best); } }

  // 軸測投影：東 → 右下、北 → 右上，再把整體縮放進畫面
  const P0 = (x, y, z) => [(x + y)*.866, (x - y)*.5 - z*.62];
  const pts = [];
  for(let i = 0; i <= nx; i++) for(let j = 0; j <= ny; j++){ pts.push(P0(i, j, 0), P0(i, j, h[i][j])); }
  fences.forEach(([a, b]) => { pts.push(P0(Math.max(-3, Math.min(nx + 4, a[0])), Math.max(-3, Math.min(a[1], ny + 7)), 0)); });
  let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
  pts.forEach(([x, y]) => { mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y); });
  const k = Math.min(W*.84/(mxx - mnx), H*.66/(mxy - mny)), ox = W/2 - (mnx + mxx)/2*k, oy = H*.56 - (mny + mxy)/2*k;
  const P = (x, y, z) => { const q = P0(x, y, z); return [ox + q[0]*k, oy + q[1]*k]; };

  g.save();
  g.beginPath(); g.rect(0, 0, W, H); g.clip();
  // 地面格線
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1;
  for(let x = -4; x <= nx + 4; x += 2){ U.poly(g, [P(x, -3, 0), P(x, ny + gap + 5, 0)]); g.stroke(); }
  for(let y = -3; y <= ny + gap + 5; y += 2){ U.poly(g, [P(-4, y, 0), P(nx + 4, y, 0)]); g.stroke(); }
  // 遮陰線：畫在地面（fenceH > 0 時多畫一道立起來的線）
  g.lineWidth = 2; g.strokeStyle = "#fff";
  fences.forEach(([a, b]) => { U.poly(g, [P(a[0], a[1], 0), P(b[0], b[1], 0)]); g.stroke();
    if(fenceH > 0){ g.strokeStyle = "rgba(255,255,255,.5)"; U.poly(g, [P(a[0], a[1], fenceH), P(b[0], b[1], fenceH)]); g.stroke(); g.strokeStyle = "#fff"; } });
  // 地面上的影子方向（虛線扇形）
  const cx = nx/2, cy = ny/2;
  g.setLineDash([3, 4]); g.lineWidth = 1; g.strokeStyle = rgba(c, .45);
  suns.forEach(([sx, sy]) => { const hz = Math.hypot(sx, sy); U.poly(g, [P(cx, cy, 0), P(cx - sx/hz*(ny*.9), cy - sy/hz*(ny*.9), 0)]); g.stroke(); });
  g.setLineDash([]);

  // 包絡頂面：由遠到近（y − x 大的先畫）畫每一格的四角高度
  const cells = [];
  for(let i = 0; i < nx; i++) for(let j = 0; j < ny; j++) cells.push([i, j]);
  cells.sort((A, B) => (B[1] - B[0]) - (A[1] - A[0]));
  let hmax = 0; for(let i = 0; i <= nx; i++) for(let j = 0; j <= ny; j++) hmax = Math.max(hmax, h[i][j]);
  for(const [i, j] of cells){
    const a = h[i][j], b = h[i+1][j], cc = h[i+1][j+1], d = h[i][j+1], t = (a + b + cc + d)/4/(hmax || 1);
    const slope = Math.max(0, Math.min(1, ((d + cc) - (a + b))*.5 + .5));   // 北高南低的面較亮
    U.poly(g, [P(i, j, a), P(i+1, j, b), P(i+1, j+1, cc), P(i, j+1, d)], true);
    g.fillStyle = rgba(c, .18 + t*.55 + slope*.12); g.fill();
    g.strokeStyle = t > .985 ? "rgba(255,255,255,.28)" : rgba(c, .9); g.lineWidth = .7; g.stroke();
  }
  // 前方兩道立面（南、東），看得出量體厚度
  g.fillStyle = "rgba(20,20,26,.78)"; g.strokeStyle = rgba(c, .7); g.lineWidth = .8;
  for(let i = 0; i < nx; i++){ U.poly(g, [P(i, 0, 0), P(i+1, 0, 0), P(i+1, 0, h[i+1][0]), P(i, 0, h[i][0])], true); g.fill(); g.stroke(); }
  for(let j = 0; j < ny; j++){ U.poly(g, [P(nx, j, 0), P(nx, j+1, 0), P(nx, j+1, h[nx][j+1]), P(nx, j, h[nx][j])], true); g.fill(); g.stroke(); }

  // 太陽光線：每個時刻從遮陰線上取一點朝太陽拉線（包絡的斜面就是由這些光線削出來的）
  suns.forEach(([sx, sy, sz], n) => {
    const x = nx*(.92 - .84*n/Math.max(1, suns.length - 1)), hz = Math.hypot(sx, sy);
    let D = Infinity; for(const [a, b] of fences) D = Math.min(D, rayHit(x, ny*.5, 0, 1, a, b));
    if(D === Infinity) return;
    const F = [x, ny*.5 + D, fenceH], tau = (D + ny*.6)/hz;
    const p = P(F[0], F[1], F[2]), q = P(F[0] + sx*tau, F[1] + sy*tau, F[2] + sz*tau);
    const gr = g.createLinearGradient(q[0], q[1], p[0], p[1]); gr.addColorStop(0, "rgba(255,236,170,0)"); gr.addColorStop(1, "rgba(255,236,170,.85)");
    g.strokeStyle = gr; g.lineWidth = 1.1; U.poly(g, [q, p]); g.stroke();
    g.fillStyle = "#FFECAA"; g.beginPath(); g.arc(p[0], p[1], 1.8, 0, TAU); g.fill();
  });
  g.restore();
};
ART.var["G02"] = ART.var["G02"] || [];
})();

/* G02 太陽包絡：變形（V01–V12）與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = U.TAU, rgba = U.rgba, poly = U.poly;
ART.var["G02"] = ART.var["G02"] || [];

// ---------- 共用小工具（和 GEN.G02 的實作邏輯一致，但簡化、可重用於多張圖）----------
// 太陽的「影子方向」單位向量與該時刻高度角的正切值
function sunSet(lat, day, t0, t1, n){
  const phi = lat*Math.PI/180, dec = 23.44*Math.PI/180*Math.sin(2*Math.PI*(284 + day)/365), out = [];
  for(let i = 0; i <= n; i++){ const t = t0 + (t1 - t0)*i/n, w = 15*(t - 12)*Math.PI/180;
    const x = -Math.cos(dec)*Math.sin(w), y = Math.sin(dec)*Math.cos(phi) - Math.cos(dec)*Math.cos(w)*Math.sin(phi), z = Math.sin(dec)*Math.sin(phi) + Math.cos(dec)*Math.cos(w)*Math.cos(phi);
    if(z > .02){ const hz = Math.hypot(x, y) || 1e-6; out.push({dx: -x/hz, dy: -y/hz, tanAlt: z/hz}); } }
  return out;
}
function rayHit2(px, py, dx, dy, a, b){
  const ex = b[0] - a[0], ey = b[1] - a[1], den = dx*ey - dy*ex;
  if(Math.abs(den) < 1e-12) return Infinity;
  const qx = a[0] - px, qy = a[1] - py, t = (qx*ey - qy*ex)/den, u = (qx*dy - qy*dx)/den;
  return (t > 0 && u >= 0 && u <= 1) ? t : Infinity;
}
// 高度場：對每個格點、每個太陽向量找最近遮陰線，取（第 kth 小）值當下包絡
function envField(nx, ny, fences, suns, fenceH, maxH, kth){
  const h = [];
  for(let i = 0; i <= nx; i++){ h[i] = [];
    for(let j = 0; j <= ny; j++){
      const vals = [];
      for(const s of suns){ let D = Infinity; for(const [a, b] of fences) D = Math.min(D, rayHit2(i, j, s.dx, s.dy, a, b));
        vals.push(D < Infinity ? fenceH + D*s.tanAlt : maxH); }
      vals.sort((a, b) => a - b);
      h[i][j] = Math.max(0, Math.min(maxH, vals[Math.min(vals.length - 1, kth || 0)]));
    } }
  return h;
}
function autoFit(pts, W, H, mx, my, yFrac){
  let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
  pts.forEach(([x, y]) => { mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y); });
  const k = Math.min(W*mx/((mxx - mnx) || 1), H*my/((mxy - mny) || 1));
  return { k, ox: W/2 - (mnx + mxx)/2*k, oy: H*yFrac - (mny + mxy)/2*k };
}
function iso0(x, y, z){ return [(x + y)*.866, (x - y)*.5 - z*.62]; }
// 用高度場畫一塊等角量體（供多個變形共用）：nx,ny 格數、h 高度場、frame 視窗參數
function isoMass(g, W, H, nx, ny, h, c, opt){
  opt = opt || {};
  const pts = []; for(let i = 0; i <= nx; i++) for(let j = 0; j <= ny; j++) pts.push(iso0(i, j, 0), iso0(i, j, h[i][j]));
  const fr = autoFit(pts, W, H, opt.mx || .8, opt.my || .62, opt.yFrac || .58);
  const P = (x, y, z) => { const q = iso0(x, y, z); return [fr.ox + q[0]*fr.k, fr.oy + q[1]*fr.k]; };
  let hmax = 0; for(let i = 0; i <= nx; i++) for(let j = 0; j <= ny; j++) hmax = Math.max(hmax, h[i][j]);
  const cells = []; for(let i = 0; i < nx; i++) for(let j = 0; j < ny; j++) cells.push([i, j]);
  cells.sort((A, B) => (B[1] - B[0]) - (A[1] - A[0]));
  for(const [i, j] of cells){
    const a = h[i][j], b = h[i+1][j], cc = h[i+1][j+1], d = h[i][j+1], t = (a + b + cc + d)/4/(hmax || 1);
    poly(g, [P(i, j, a), P(i+1, j, b), P(i+1, j+1, cc), P(i, j+1, d)], true);
    g.fillStyle = rgba(c, .16 + t*.58); g.fill(); g.strokeStyle = rgba(c, .85); g.lineWidth = .6; g.stroke();
  }
  g.fillStyle = "rgba(18,18,24,.8)"; g.strokeStyle = rgba(c, .7); g.lineWidth = .7;
  for(let i = 0; i < nx; i++){ poly(g, [P(i, 0, 0), P(i+1, 0, 0), P(i+1, 0, h[i+1][0]), P(i, 0, h[i][0])], true); g.fill(); g.stroke(); }
  for(let j = 0; j < ny; j++){ poly(g, [P(nx, j, 0), P(nx, j+1, 0), P(nx, j+1, h[nx][j+1]), P(nx, j, h[nx][j])], true); g.fill(); g.stroke(); }
  return P;
}
function heat(t){ // 藍→青→黃→紅 色階（供日照時數估計圖使用）
  const S = [[46,90,200],[64,190,200],[240,205,70],[224,70,40]], u = Math.max(0, Math.min(.999, t))*(S.length - 1), i = u|0, f = u - i;
  const cc = S[i].map((v, k) => Math.round(v + (S[i+1][k] - v)*f)); return `rgb(${cc[0]},${cc[1]},${cc[2]})`;
}

/* ===================== 變形 0–11 ===================== */

// V01 日照收集包絡：南側鄰棟遮擋，求「高於這條線才保證有日照」的下限（剖面）
ART.var["G02"][0] = function(g, W, H, r, c){
  const nx = 46, obsH = 7 + r()*3, siteStart = 2.5 + r()*2, siteLen = 24;
  const suns = sunSet(26 + r()*16, 355, 8.5 + r(), 15.5 - r(), 6);
  const z = []; for(let i = 0; i <= nx; i++){ const d = siteStart + i/nx*siteLen; let need = 0;
    for(const s of suns) need = Math.max(need, obsH - d*s.tanAlt);
    z.push(Math.max(0, need)); }
  const total = siteStart + siteLen + 3, sx = (W - 60)/total, y0 = H*.8, sz = (H*.5)/(obsH + 2);
  g.save(); g.translate(30, 0);
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1;
  for(let gx = 0; gx <= total; gx += 3){ g.beginPath(); g.moveTo(gx*sx, y0); g.lineTo(gx*sx, y0 - (obsH+2)*sz); g.stroke(); }
  g.beginPath(); g.moveTo(0, y0); g.lineTo(total*sx, y0); g.strokeStyle = "rgba(255,255,255,.25)"; g.stroke();
  g.fillStyle = "rgba(20,20,26,.9)"; g.strokeStyle = rgba(c, .7); g.lineWidth = 1;
  g.fillRect(0, y0 - obsH*sz, 1.6*sx, obsH*sz); g.strokeRect(0, y0 - obsH*sz, 1.6*sx, obsH*sz);
  const pts = [[0, y0]]; for(let i = 0; i <= nx; i++){ const d = siteStart + i/nx*siteLen; pts.push([d*sx, y0 - z[i]*sz]); } pts.push([total*sx, y0]);
  poly(g, pts, true); g.fillStyle = rgba(c, .3); g.fill(); g.strokeStyle = c; g.lineWidth = 1.6;
  poly(g, pts.slice(1, -1), false); g.stroke();
  suns.forEach((s, n) => { if(n % 2) return; const d = siteStart + siteLen*(.15 + .7*n/suns.length);
    const zt = z[Math.round((d - siteStart)/siteLen*nx)] + 1.5;
    const gr = g.createLinearGradient((d - 4)*sx, y0 - (zt + 4*s.tanAlt)*sz, d*sx, y0 - zt*sz);
    gr.addColorStop(0, "rgba(255,224,150,0)"); gr.addColorStop(1, "rgba(255,224,150,.85)");
    g.strokeStyle = gr; g.lineWidth = 1; g.beginPath(); g.moveTo((d - 4)*sx, y0 - (zt + 4*s.tanAlt)*sz); g.lineTo(d*sx, y0 - zt*sz); g.stroke(); });
  g.restore();
};

// V02 允許遮蔽 N 個時刻（第 k 小值）：平面色階圖，虛線畫出嚴格版的等值線
ART.var["G02"][1] = function(g, W, H, r, c){
  const nx = 40, ny = 26, gap = 3 + r()*2, maxH = 9, norm = maxH*1.3;
  const suns = sunSet(30 + r()*14, 355, 8.5, 15.5, 7);
  const fences = [[[-6, ny + gap], [nx + 6, ny + gap]]];
  const N = 1 + (r()*2|0);
  const hS = envField(nx, ny, fences, suns, 0, maxH, 0), hR = envField(nx, ny, fences, suns, 0, maxH, N);
  U.field(g, W, H, nx + 1, ny + 1, (i, j) => hR[i][j]/norm, c, 1.1);
  const sx = W/nx, sy = H/ny;
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.4; g.strokeRect(0, 0, W, H*.98);
  g.setLineDash([3, 3]); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1;
  [.25, .45, .65].forEach(iso => { U.contour(nx + 1, ny + 1, (i, j) => hS[i][j]/norm, iso).forEach(([p, q]) => { g.beginPath(); g.moveTo(p[0]*sx, p[1]*sy); g.lineTo(q[0]*sx, q[1]*sy); g.stroke(); }); });
  g.setLineDash([]);
};

// V03 多日期整季取樣：頂端一排太陽軌跡弧線，下方是整季包絡（邊緣較平滑）
ART.var["G02"][2] = function(g, W, H, r, c){
  const nx = 42, ny = 22, gap = 2 + r()*2, maxH = 9, lat = 28 + r()*16;
  const days = [305, 335, 355, 20, 50];
  let suns = []; days.forEach(d => suns = suns.concat(sunSet(lat, d, 9, 15, 4)));
  const fences = [[[-6, ny + gap], [nx + 6, ny + gap]]];
  const hM = envField(nx, ny, fences, suns, 0, maxH, 0), norm = maxH*1.3;
  const bandH = H*.24;
  g.save(); g.translate(0, bandH);
  U.field(g, W, H - bandH, nx + 1, ny + 1, (i, j) => hM[i][j]/norm, c, 1.1);
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.2; g.strokeRect(0, 0, W, H - bandH - 2);
  g.restore();
  // 頂端太陽軌跡：每個取樣日一條弧
  const cx = W/2, cy = bandH*1.02, R = Math.min(W*.42, bandH*1.7);
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.stroke();
  days.forEach((d, k) => { const s = sunSet(lat, d, 6.5, 17.5, 40);
    g.beginPath(); s.forEach((sn, i) => { const az = Math.atan2(-sn.dx, -sn.dy), alt = Math.atan(sn.tanAlt);
      const px = cx + Math.sin(az)*R*.92, py = cy - Math.sin(alt)*R*.92*(1 - Math.abs(Math.sin(az))*.15);
      i ? g.lineTo(px, py) : g.moveTo(px, py); });
    g.strokeStyle = k === 2 ? c : `rgba(255,220,150,${.25 + k*.06})`; g.lineWidth = k === 2 ? 1.6 : 1; g.stroke(); });
};

// V04 分段遮陰線高度：不同段落的遮陰線用不同高度（線粗與刻度表示），平面圖
ART.var["G02"][3] = function(g, W, H, r, c){
  const nx = 40, ny = 24, gap = 2 + r()*2, maxH = 9;
  const suns = sunSet(30 + r()*12, 355, 9, 15, 6);
  const segH = [0, 1 + r()*2, 3 + r()*2];
  const bx = [-6, nx*.32, nx*.68, nx + 6];
  const fences = [{ a: [bx[0], ny + gap], b: [bx[1], ny + gap], h: segH[0] },
                   { a: [bx[1], ny + gap], b: [bx[2], ny + gap], h: segH[1] },
                   { a: [bx[2], ny + gap], b: [bx[3], ny + gap], h: segH[2] }];
  const h = []; for(let i = 0; i <= nx; i++){ h[i] = [];
    for(let j = 0; j <= ny; j++){ let best = maxH;
      for(const s of suns){ let Dm = Infinity, Hm = 0;
        for(const f of fences){ const D = rayHit2(i, j, s.dx, s.dy, f.a, f.b); if(D < Dm){ Dm = D; Hm = f.h; } }
        if(Dm < Infinity) best = Math.min(best, Hm + Dm*s.tanAlt); }
      h[i][j] = Math.max(0, best); } }
  U.field(g, W, H, nx + 1, ny + 1, (i, j) => h[i][j]/maxH, c, .9);
  const sx = W/(nx + 12), sy = H/(ny + gap + 6), ox = sx*6, oy = sy*3;
  fences.forEach(f => { const lw = 1.5 + f.h*1.8;
    g.strokeStyle = "#fff"; g.lineWidth = lw; g.beginPath(); g.moveTo(ox + f.a[0]*sx, oy + f.a[1]*sy); g.lineTo(ox + f.b[0]*sx, oy + f.b[1]*sy); g.stroke();
    const midx = ox + (f.a[0]+f.b[0])/2*sx, midy = oy + (f.a[1]+f.b[1])/2*sy;
    for(let t = 0; t < 1 + f.h; t++){ g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1; g.beginPath(); g.moveTo(midx, midy - t*3); g.lineTo(midx, midy - t*3 - 2); g.stroke(); } });
};

// V05 坡地與地形上的太陽包絡：等角視圖，地面沿北向抬升，包絡疊在起伏地形上
ART.var["G02"][4] = function(g, W, H, r, c){
  const nx = 14, ny = 14, gap = .6 + r()*.8, maxH = 5.5;
  const suns = sunSet(36 + r()*10, 355, 9, 15, 6);
  const fences = [[[-4, ny + gap], [nx + 4, ny + gap]]];
  const slope = 3 + r()*2, vn = U.vnoise((r()*1e6)|0);
  const terr = []; for(let i = 0; i <= nx; i++){ terr[i] = []; for(let j = 0; j <= ny; j++) terr[i][j] = j/ny*slope + vn(i*.4, j*.4)*.7; }
  const hEnv = envField(nx, ny, fences, suns, 0, maxH, 0);
  const h = []; for(let i = 0; i <= nx; i++){ h[i] = []; for(let j = 0; j <= ny; j++) h[i][j] = terr[i][j] + hEnv[i][j]; }
  const pts = []; for(let i = 0; i <= nx; i++) for(let j = 0; j <= ny; j++) pts.push(iso0(i, j, terr[i][j]), iso0(i, j, h[i][j]));
  const fr = autoFit(pts, W, H, .82, .64, .6);
  const P = (x, y, z) => { const q = iso0(x, y, z); return [fr.ox + q[0]*fr.k, fr.oy + q[1]*fr.k]; };
  const cells = []; for(let i = 0; i < nx; i++) for(let j = 0; j < ny; j++) cells.push([i, j]);
  cells.sort((A, B) => (B[1] - B[0]) - (A[1] - A[0]));
  for(const [i, j] of cells){ // 地形面：綠棕色
    poly(g, [P(i, j, terr[i][j]), P(i+1, j, terr[i+1][j]), P(i+1, j+1, terr[i+1][j+1]), P(i, j+1, terr[i][j+1])], true);
    g.fillStyle = "rgba(90,84,58,.65)"; g.fill(); g.strokeStyle = "rgba(150,140,100,.35)"; g.lineWidth = .5; g.stroke(); }
  // 四個轉角的支柱：連接地形與包絡面，強調兩者之間的體量
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = .8; g.setLineDash([2, 2]);
  [[0,0],[nx,0],[nx,ny],[0,ny]].forEach(([i, j]) => { g.beginPath(); g.moveTo(...P(i, j, terr[i][j])); g.lineTo(...P(i, j, h[i][j])); g.stroke(); });
  g.setLineDash([]);
  let hmax = 0; for(let i = 0; i <= nx; i++) for(let j = 0; j <= ny; j++) hmax = Math.max(hmax, h[i][j]);
  for(const [i, j] of cells){ const a = h[i][j], b = h[i+1][j], cc = h[i+1][j+1], d = h[i][j+1], t = (a+b+cc+d)/4/(hmax||1);
    poly(g, [P(i, j, a), P(i+1, j, b), P(i+1, j+1, cc), P(i, j+1, d)], true);
    g.fillStyle = rgba(c, .18 + t*.55); g.fill(); g.strokeStyle = rgba(c, .85); g.lineWidth = .6; g.stroke(); }
};

// V06 反向體素削減：離散體素、允許懸挑與內部孔洞（不是單純由地面往上長的高度場）
ART.var["G02"][5] = function(g, W, H, r, c){
  const nx = 7, ny = 7, nz = 9, gap = 2;
  const suns = sunSet(32 + r()*10, 355, 9, 15, 6);
  const fences = [[[-3, ny + gap], [nx + 3, ny + gap]]];
  const hEnv = envField(nx, ny, fences, suns, 0, nz - 1, 0);
  const keep = []; for(let i = 0; i < nx; i++){ keep[i] = []; for(let j = 0; j < ny; j++){ keep[i][j] = [];
    for(let k = 0; k < nz; k++){ let v = k <= hEnv[i][j];
      if(v && r() < .08 && k > 0 && k < hEnv[i][j] - .5) v = false; // 內部挖洞
      if(!v && k > hEnv[i][j] && k < hEnv[i][j] + 1.4 && r() < .35) v = true; // 局部懸挑
      keep[i][j][k] = v; } } }
  const pts = []; for(let i = 0; i <= nx; i++) for(let j = 0; j <= ny; j++) pts.push(iso0(i, j, 0), iso0(i, j, nz));
  const fr = autoFit(pts, W, H, .78, .68, .62);
  const P = (x, y, z) => { const q = iso0(x, y, z); return [fr.ox + q[0]*fr.k, fr.oy + q[1]*fr.k]; };
  const cubes = []; for(let i = 0; i < nx; i++) for(let j = 0; j < ny; j++) for(let k = 0; k < nz; k++) if(keep[i][j][k]) cubes.push([i, j, k]);
  cubes.sort((A, B) => (B[1] - A[1]) || (B[0] - A[0]) || (A[2] - B[2]));
  const shade = { top: 1, left: .68, right: .46 };
  cubes.forEach(([i, j, k]) => {
    const top = [P(i, j, k+1), P(i+1, j, k+1), P(i+1, j+1, k+1), P(i, j+1, k+1)];
    const left = [P(i, j+1, k), P(i, j+1, k+1), P(i+1, j+1, k+1), P(i+1, j+1, k)];
    const right = [P(i+1, j, k), P(i+1, j, k+1), P(i+1, j+1, k+1), P(i+1, j+1, k)];
    [[top, shade.top], [left, shade.left], [right, shade.right]].forEach(([face, sh]) => {
      poly(g, face, true); g.fillStyle = rgba(c, .22 + sh*.62); g.fill(); g.strokeStyle = "rgba(10,10,14,.55)"; g.lineWidth = .5; g.stroke(); });
  });
};

// V07 樓板切片與容積檢查：剖面曲線＋一層層樓板，超出包絡的樓板打斜線表示不合格
ART.var["G02"][6] = function(g, W, H, r, c){
  const nx = 34; const suns = sunSet(30 + r()*12, 355, 9, 15, 6);
  const obsH = 6 + r()*2, siteStart = 2, siteLen = 20;
  const z = []; for(let i = 0; i <= nx; i++){ const d = siteStart + i/nx*siteLen; let best = 12;
    for(const s of suns) best = Math.min(best, obsH + d*s.tanAlt); z.push(Math.max(0, best)); }
  const total = siteStart + siteLen + 2, sx = (W - 50)/total, y0 = H*.86, floorH = 1 + r()*.3, sz = (H*.68)/12;
  g.save(); g.translate(28, 0);
  const pts = [[0, y0]]; for(let i = 0; i <= nx; i++){ const d = siteStart + i/nx*siteLen; pts.push([d*sx, y0 - z[i]*sz]); } pts.push([total*sx, y0]);
  poly(g, pts, true); g.fillStyle = rgba(c, .16); g.fill(); g.strokeStyle = c; g.lineWidth = 1.6; poly(g, pts.slice(1, -1)); g.stroke();
  const nFloors = Math.floor(12/floorH);
  for(let f = 0; f < nFloors; f++){ const zLo = f*floorH, zHi = zLo + floorH*.86, yLo = y0 - zLo*sz, yHi = y0 - zHi*sz;
    // 找這層樓板在包絡內的左右範圍（簡化：取整層都要在曲線之下才算合格）
    let ok = true; for(let i = 0; i <= nx; i += 4) if(z[i] < zHi) ok = false;
    g.fillStyle = ok ? rgba(c, .35) : "rgba(255,255,255,.06)";
    g.fillRect(siteStart*sx, yHi, siteLen*sx, yLo - yHi);
    g.strokeStyle = ok ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.15)"; g.lineWidth = .6; g.strokeRect(siteStart*sx, yHi, siteLen*sx, yLo - yHi);
    if(!ok){ g.save(); g.beginPath(); g.rect(siteStart*sx, yHi, siteLen*sx, yLo - yHi); g.clip();
      g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; for(let x = 0; x < W; x += 8){ g.beginPath(); g.moveTo(x, yHi); g.lineTo(x - (yLo-yHi), yLo); g.stroke(); } g.restore(); }
  }
  g.restore();
};

// V08 封閉實體與 3D 列印模型：等角視圖，畫成一層層堆疊的等高片層（像列印分層）
ART.var["G02"][7] = function(g, W, H, r, c){
  const nx = 24, ny = 18, gap = 2 + r()*2, maxH = 9;
  const suns = sunSet(30 + r()*14, 355, 9, 15, 6);
  const fences = [[[-4, ny + gap], [nx + 4, ny + gap]]];
  const h = envField(nx, ny, fences, suns, 0, maxH, 0);
  const layers = 10, pts = []; for(let i = 0; i <= nx; i++) for(let j = 0; j <= ny; j++) pts.push(iso0(i, j, 0), iso0(i, j, maxH));
  const fr = autoFit(pts, W, H, .78, .66, .6);
  const P = (x, y, z) => { const q = iso0(x, y, z); return [fr.ox + q[0]*fr.k, fr.oy + q[1]*fr.k]; };
  // 底座
  g.fillStyle = "rgba(30,30,38,.9)"; poly(g, [P(0,0,-.6), P(nx,0,-.6), P(nx,ny,-.6), P(0,ny,-.6)], true); g.fill();
  for(let L = 0; L < layers; L++){ const z0 = L/layers*maxH, z1 = (L+.86)/layers*maxH;
    const segs = U.contour(nx + 1, ny + 1, (i, j) => h[i][j], z0);
    g.strokeStyle = rgba(c, .25 + L/layers*.5); g.fillStyle = rgba(c, .05 + L/layers*.05); g.lineWidth = 1;
    segs.forEach(([a, b]) => { g.beginPath(); g.moveTo(...P(a[0], a[1], z1)); g.lineTo(...P(b[0], b[1], z1)); g.stroke(); });
    // 外圈輪廓略偏白，強調分層
    if(L % 2 === 0){ g.strokeStyle = "rgba(255,255,255,.35)"; segs.forEach(([a, b]) => { g.beginPath(); g.moveTo(...P(a[0], a[1], z1)); g.lineTo(...P(b[0], b[1], z1)); g.stroke(); }); }
  }
  isoMassOutline(g, P, nx, ny, h, c);
  function isoMassOutline(g, P, nx, ny, h, c){
    g.strokeStyle = rgba(c, .9); g.lineWidth = .8;
    for(let i = 0; i < nx; i++){ g.beginPath(); g.moveTo(...P(i, 0, 0)); g.lineTo(...P(i, 0, h[i][0])); g.stroke(); }
    for(let j = 0; j < ny; j++){ g.beginPath(); g.moveTo(...P(nx, j, 0)); g.lineTo(...P(nx, j, h[nx][j])); g.stroke(); }
  }
};

// V09 逐時削切動畫：三個並排的縮小量體，隨太陽時刻增加逐步被削出斜面
ART.var["G02"][8] = function(g, W, H, r, c){
  const nx = 10, ny = 8, gap = 2, maxH = 9, lat = 30 + r()*12;
  const allSuns = sunSet(lat, 355, 9, 15, 7);
  const stages = [allSuns.slice(0, 2), allSuns.slice(0, 4), allSuns];
  const fences = [[[-3, ny + gap], [nx + 3, ny + gap]]];
  const cellW = W/stages.length;
  stages.forEach((suns, si) => {
    const h = suns.length ? envField(nx, ny, fences, suns, 0, maxH, 0) : [...Array(nx+1)].map(() => Array(ny+1).fill(maxH));
    const pts = []; for(let i = 0; i <= nx; i++) for(let j = 0; j <= ny; j++) pts.push(iso0(i, j, 0), iso0(i, j, h[i][j]));
    const fr = autoFit(pts, cellW, H, .78, .58, .58);
    const P = (x, y, z) => { const q = iso0(x, y, z); return [si*cellW + fr.ox + q[0]*fr.k, fr.oy + q[1]*fr.k]; };
    const cells = []; for(let i = 0; i < nx; i++) for(let j = 0; j < ny; j++) cells.push([i, j]);
    cells.sort((A, B) => (B[1] - B[0]) - (A[1] - A[0]));
    const op = .35 + si*.25;
    for(const [i, j] of cells){ const a = h[i][j], b = h[i+1][j], cc = h[i+1][j+1], d = h[i][j+1];
      poly(g, [P(i, j, a), P(i+1, j, b), P(i+1, j+1, cc), P(i, j+1, d)], true);
      g.fillStyle = rgba(c, op); g.fill(); g.strokeStyle = rgba(c, .8); g.lineWidth = .5; g.stroke(); }
    if(si < stages.length - 1){ g.strokeStyle = "rgba(255,255,255,.1)"; g.beginPath(); g.moveTo((si+1)*cellW, H*.1); g.lineTo((si+1)*cellW, H*.9); g.stroke(); }
  });
};

// V10 Monte Carlo 日照時數估計：南側量體（依包絡算出的高度）固定，北側鄰地灑點依受光時數上色
ART.var["G02"][9] = function(g, W, H, r, c){
  const nx = 34, ny = 22, lat = 30 + r()*14, obsH = 7 + r()*3;
  const wx0 = nx*.32, wx1 = nx*.62, wy1 = 1.6; // 南側固定量體的平面範圍
  const suns = sunSet(lat, 355, 7, 17, 36);
  const sx = W/nx, sy = (H*.86)/(ny + wy1 + 1), oy = H*.05;
  // 南側固定量體（俯視深色量體）
  g.fillStyle = "rgba(24,24,30,.95)"; g.strokeStyle = rgba(c, .8); g.lineWidth = 1.2;
  g.fillRect(wx0*sx, oy, (wx1 - wx0)*sx, wy1*sy); g.strokeRect(wx0*sx, oy, (wx1 - wx0)*sx, wy1*sy);
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1;
  for(let gxp = 0; gxp <= nx; gxp += 4){ g.beginPath(); g.moveTo(gxp*sx, oy); g.lineTo(gxp*sx, H*.96); g.stroke(); }
  const N = 340;
  for(let n = 0; n < N; n++){
    const x = r()*nx, y = wy1 + .3 + r()*ny;
    let lit = 0;
    for(const s of suns){ const t = obsH/(s.tanAlt || 1e-6), bx = x - t*s.dx, by = y - t*s.dy;
      const shaded = bx >= wx0 && bx <= wx1 && by >= 0 && by <= wy1;
      if(!shaded) lit++; }
    const hrs = lit/suns.length;
    g.fillStyle = heat(hrs); g.beginPath(); g.arc(x*sx, oy + y*sy, 2.1, 0, TAU); g.fill();
  }
};

// V11 多地塊街廓包絡（接 A04）：以遞迴分割切出多個地塊，各地塊獨立算包絡，南低北高
ART.var["G02"][10] = function(g, W, H, r, c){
  const nx = 22, ny = 16, lat = 30 + r()*12, maxH = 9;
  const suns = sunSet(lat, 355, 9, 15, 6);
  // 遞迴分割街廓成 4–6 塊（沿南北向切）
  const rows = []; let y0 = 0, remain = ny;
  while(remain > 2.2){ const s = remain*(.28 + r()*.24); rows.push([y0, y0 + s]); y0 += s; remain -= s; }
  rows.push([y0, ny]);
  const fences = [[[-4, -2], [nx + 4, -2]]]; // 保護南側鄰地（公園）
  const h = envField(nx, ny, fences, suns, 0, maxH, 0);
  const P = isoMass(g, W, H, nx, ny, h, c, { mx: .8, my: .62, yFrac: .58 });
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1;
  rows.forEach(([a, b]) => { g.beginPath(); g.moveTo(...P(0, b, 0)); g.lineTo(...P(nx, b, 0)); g.stroke(); });
};

// V12 手錶時間換算真太陽時：同一場景比較「手錶時刻」與換算後「真太陽時」的影子扇形
ART.var["G02"][11] = function(g, W, H, r, c){
  const lat = 28 + r()*16, eqShift = (-6 + r()*22)/60; // 均時差＋經度時區近似換算（小時）
  const cx = W/2, cy = H*.56, R = Math.min(W, H)*.4;
  const sunsClock = sunSet(lat, 355, 9, 15, 6);
  const sunsTrue = sunSet(lat, 355, 9 + eqShift, 15 + eqShift, 6);
  U.field(g, W, H, 2, 2, () => .04, c, 1);
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
  const draw = (suns, col) => { suns.forEach(s => { const hz = Math.hypot(s.dx, s.dy) || 1;
    g.strokeStyle = col; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - s.dx/hz*R, cy - s.dy/hz*R); g.stroke();
    g.fillStyle = col; g.beginPath(); g.arc(cx - s.dx/hz*R, cy - s.dy/hz*R, 2.4, 0, TAU); g.fill(); }); };
  g.setLineDash([4, 3]); draw(sunsClock, "rgba(255,255,255,.55)"); g.setLineDash([]); draw(sunsTrue, "#FFECAA");
  g.fillStyle = c; g.beginPath(); g.arc(cx, cy, 3.5, 0, TAU); g.fill();
  // 小小的日行跡八字型，暗示均時差
  g.strokeStyle = rgba(c, .8); g.lineWidth = 1.3; g.beginPath();
  for(let t = 0; t <= 40; t++){ const u = t/40*TAU, x = cx + R*.16*Math.sin(u), y = cy - R*.62 - R*.06*Math.sin(2*u); t ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke();
};

/* ===================== 沒有照片的案例 ===================== */

// G02-01 Solar Carve（40 Tenth Avenue，Studio Gang）：削切出的瘦高塔樓＋鑽石玻璃帷幕，緊鄰 High Line 公園
ART.case["G02-01"] = function(g, W, H, r, c){
  const nx = 4, ny = 4, gap = 3.2 + r()*1.4, maxH = 24 + r()*4;
  const suns = sunSet(40.7, 355, 9, 15, 6);
  const fences = [[[-3, ny + gap], [nx + 3, ny + gap]]];
  const h = envField(nx, ny, fences, suns, 0, maxH, 0);
  const pts = []; for(let i = 0; i <= nx; i++) for(let j = 0; j <= ny; j++) pts.push(iso0(i, j, 0), iso0(i, j, h[i][j]));
  pts.push(iso0(-3, ny + gap, 0), iso0(nx + 3, ny + gap + 1.1, 0));
  const fr = autoFit(pts, W, H, .5, .82, .78);
  const P = (x, y, z) => { const q = iso0(x, y, z); return [fr.ox + q[0]*fr.k, fr.oy + q[1]*fr.k]; };
  const cells = []; for(let i = 0; i < nx; i++) for(let j = 0; j < ny; j++) cells.push([i, j]);
  cells.sort((A, B) => (B[1] - B[0]) - (A[1] - A[0]));
  let hmax = 0; for(let i = 0; i <= nx; i++) for(let j = 0; j <= ny; j++) hmax = Math.max(hmax, h[i][j]);
  for(const [i, j] of cells){ const a = h[i][j], b = h[i+1][j], cc = h[i+1][j+1], d = h[i][j+1], t = (a+b+cc+d)/4/(hmax||1);
    poly(g, [P(i, j, a), P(i+1, j, b), P(i+1, j+1, cc), P(i, j+1, d)], true);
    g.fillStyle = rgba(c, .2 + t*.55); g.fill(); g.strokeStyle = rgba(c, .9); g.lineWidth = .6; g.stroke(); }
  g.fillStyle = "rgba(18,18,24,.85)"; g.strokeStyle = rgba(c, .7); g.lineWidth = .7;
  for(let i = 0; i < nx; i++){ poly(g, [P(i,0,0),P(i+1,0,0),P(i+1,0,h[i+1][0]),P(i,0,h[i][0])], true); g.fill(); g.stroke();
    // 鑽石玻璃帷幕：南向立面加對角紋理
    const m = (h[i][0]+h[i+1][0])/2; g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = .5;
    for(let k = 0; k < m; k += 1.4){ g.beginPath(); g.moveTo(...P(i, 0, k)); g.lineTo(...P(i+1, 0, k+1.4)); g.stroke();
      g.beginPath(); g.moveTo(...P(i+1, 0, k)); g.lineTo(...P(i, 0, k+1.4)); g.stroke(); } }
  for(let j = 0; j < ny; j++){ poly(g, [P(nx,j,0),P(nx,j+1,0),P(nx,j+1,h[nx][j+1]),P(nx,j,h[nx][j])], true); g.fill(); g.stroke(); }
  // 南側 High Line 綠帶
  const gy = ny + gap;
  g.fillStyle = "rgba(110,185,110,.42)"; g.strokeStyle = "rgba(195,230,175,.65)"; g.lineWidth = 1;
  poly(g, [P(-3, gy, 0), P(nx + 3, gy, 0), P(nx + 3, gy + 1.1, 0), P(-3, gy + 1.1, 0)], true); g.fill(); g.stroke();
};
ART.case["G02-01"].ratio = 1.15;

// G02-02 SolCAD：任意形狀基地上的太陽包絡設計工具，線框＋控制點的 CAD 介面感
ART.case["G02-02"] = function(g, W, H, r, c){
  const n = 8, cx = 0, cy = 0, R0 = 9;
  const site = []; for(let i = 0; i < n; i++){ const a = i/n*TAU, rr = R0*(.72 + r()*.5); site.push([cx + Math.cos(a)*rr, cy + Math.sin(a)*rr]); }
  const nx = 24, ny = 24, maxH = 8;
  function pip(P, x, y){ let s = false; for(let i = 0, j = P.length-1; i < P.length; j = i++){ const a = P[i], b = P[j];
    if((a[1] > y) !== (b[1] > y) && x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1]) + a[0]) s = !s; } return s; }
  const suns = sunSet(32 + r()*10, 355, 9, 15, 5);
  const fences = [[[-R0*1.6, R0*.9], [R0*1.6, R0*.9]]];
  const hEnv = envField(nx, ny, fences, suns, 0, maxH, 0);
  const pts = site.map(p => [p[0] - (-R0), p[1] - (-R0)]);
  const fr = autoFit(pts.map(p => iso0(p[0], p[1], 0)), W, H, .66, .58, .58);
  const toXY = (x, y) => [x - R0, y - R0];
  const P = (x, y, z) => { const [sx, sy] = toXY(x, y); const q = iso0(sx, sy, z); return [fr.ox + q[0]*fr.k, fr.oy + q[1]*fr.k]; };
  // 線框網格：只畫基地內的格子
  g.strokeStyle = rgba(c, .55); g.lineWidth = .7;
  for(let i = 0; i < nx; i++) for(let j = 0; j < ny; j++){ const x = i/nx*2*R0, y = j/ny*2*R0;
    if(!pip(site, x - R0, y - R0)) continue;
    const h0 = hEnv[Math.min(nx, Math.round(x))] ? hEnv[Math.min(nx, Math.round(x))][Math.min(ny, Math.round(y))] || 0 : 0;
    const hh = Math.min(maxH, 2 + h0*.5);
    poly(g, [P(x, y, 0), P(x + 2*R0/nx, y, 0), P(x + 2*R0/nx, y + 2*R0/ny, 0), P(x, y + 2*R0/ny, 0)], true); g.stroke();
    if((i + j) % 3 === 0){ g.beginPath(); g.moveTo(...P(x, y, 0)); g.lineTo(...P(x, y, hh)); g.strokeStyle = rgba(c, .3); g.stroke(); g.strokeStyle = rgba(c, .55); }
  }
  // 基地輪廓
  g.strokeStyle = "#fff"; g.lineWidth = 1.4; poly(g, site.map(p => P(p[0] - cx + R0, p[1] - cy + R0, 0)), true); g.stroke();
  // 控制點（CAD 操作把手）
  site.forEach(p => { const [px, py] = P(p[0] - cx + R0, p[1] - cy + R0, 0);
    g.fillStyle = "#fff"; g.fillRect(px - 2.5, py - 2.5, 5, 5); g.strokeStyle = c; g.lineWidth = 1; g.strokeRect(px - 2.5, py - 2.5, 5, 5); });
};
ART.case["G02-02"].ratio = 1.05;

// G02-03 Ladybug SolarEnvelopeAdvanced：同時算出日照權（由上而下）與日照收集（由下而上）兩個包絡，交集才是可建量體
ART.case["G02-03"] = function(g, W, H, r, c){
  const nx = 16, ny = 12, gap = 2 + r(), maxH = 9;
  const suns = sunSet(34 + r()*10, 355, 9, 15, 6);
  const fencesN = [[[-3, ny + gap], [nx + 3, ny + gap]]]; // 日照權（不遮北側鄰居）：由上往下削
  const hUp = envField(nx, ny, fencesN, suns, 0, maxH, 0);
  const hLo = []; for(let i = 0; i <= nx; i++){ hLo[i] = []; for(let j = 0; j <= ny; j++){
    // 收集面：離南側日照來源越遠（越靠北），自己要曬得到所需的最低高度越高，和日照權的上包絡在北側交錯
    hLo[i][j] = Math.min(maxH, .6 + (j/ny)*maxH*.85); } }
  const pts = []; for(let i = 0; i <= nx; i++) for(let j = 0; j <= ny; j++) pts.push(iso0(i, j, 0), iso0(i, j, maxH));
  const fr = autoFit(pts, W, H, .8, .62, .58);
  const P = (x, y, z) => { const q = iso0(x, y, z); return [fr.ox + q[0]*fr.k, fr.oy + q[1]*fr.k]; };
  const cells = []; for(let i = 0; i < nx; i++) for(let j = 0; j < ny; j++) cells.push([i, j]);
  cells.sort((A, B) => (B[1] - B[0]) - (A[1] - A[0]));
  for(const [i, j] of cells){ // 下包絡（日照收集）：實心 family 色量體
    const a=hLo[i][j],b=hLo[i+1][j],cc=hLo[i+1][j+1],d=hLo[i][j+1];
    poly(g, [P(i,j,a), P(i+1,j,b), P(i+1,j+1,cc), P(i,j+1,d)], true);
    g.fillStyle = rgba(c, .5); g.fill(); g.strokeStyle = rgba(c, .95); g.lineWidth = .6; g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = .6;
  for(const [i, j] of cells){ // 上包絡（日照權）：只畫線框，浮在收集面之上，兩者在北側收窄相交
    poly(g, [P(i,j,hUp[i][j]), P(i+1,j,hUp[i+1][j]), P(i+1,j+1,hUp[i+1][j+1]), P(i,j+1,hUp[i][j+1])], true); g.stroke(); }
  // 右上角：EPW 氣象檔小圖示（長條圖）
  g.save(); g.translate(W*.78, H*.08);
  for(let k = 0; k < 8; k++){ const bh = 4 + ((k*37) % 13); g.fillStyle = rgba(c, .8); g.fillRect(k*5, 16 - bh, 3.5, bh); }
  g.restore();
};
ART.case["G02-03"].ratio = 1.1;

// G02-04 太陽體積決定都市紋理：街廓平面圖，多個地塊依各自太陽體積上色（色塊拼貼）
ART.case["G02-04"] = function(g, W, H, r, c){
  const cols = 6, rows = 4, mx = W*.08, my = H*.1, cw = (W - 2*mx)/cols, ch = (H - 2*my)/rows;
  g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1;
  for(let i = 0; i < cols; i++) for(let j = 0; j < rows; j++){
    const vol = .3 + .65*(1 - j/rows) + (r()-.5)*.15; // 越靠南（j 小）太陽體積越大
    g.fillStyle = rgba(c, .15 + Math.max(0, Math.min(1, vol))*.6);
    g.fillRect(mx + i*cw, my + j*ch, cw - 3, ch - 3);
    g.strokeRect(mx + i*cw, my + j*ch, cw - 3, ch - 3);
    if(r() < .5){ const bw = (cw-3)*(.3 + r()*.4), bh = (ch-3)*(.3 + r()*.4);
      g.fillStyle = "rgba(18,18,24,.85)"; g.fillRect(mx + i*cw + (cw-3-bw)/2, my + j*ch + (ch-3-bh)/2, bw, bh); }
  }
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 6; g.strokeRect(mx*.4, my*.5, W - mx*.8, H - my);
};
ART.case["G02-04"].ratio = .82;

// G02-05 Tallinn 街廓多目標最佳化：4 棟朝向各異的住宅立面，右下角是簡化的 Pareto 前緣
ART.case["G02-05"] = function(g, W, H, r, c){
  const mx = W*.1, my = H*.08, gw = W - 2*mx, gh = H*.62;
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1;
  for(let gx = 0; gx <= 6; gx++){ g.beginPath(); g.moveTo(mx + gx/6*gw, my); g.lineTo(mx + gx/6*gw, my + gh); g.stroke(); }
  const blocks = [[.08,.1,.34,.28,-18],[.55,.06,.32,.3,10],[.1,.5,.3,.32,6],[.56,.48,.3,.3,-8]];
  blocks.forEach(([bx,by,bw,bh,rot], k) => { const cx = mx + (bx+bw/2)*gw, cy = my + (by+bh/2)*gh, a = rot*Math.PI/180;
    const pts = [[-bw/2,-bh/2],[bw/2,-bh/2],[bw/2,bh/2],[-bw/2,bh/2]].map(([ux,uy]) => [cx + (ux*Math.cos(a)-uy*Math.sin(a))*gw, cy + (ux*Math.sin(a)+uy*Math.cos(a))*gh]);
    poly(g, pts, true); g.fillStyle = rgba(c, .3 + k*.12); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1; g.stroke();
    const nx0 = Math.sin(a), ny0 = -Math.cos(a);
    g.strokeStyle = "#FFECAA"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + nx0*30, cy + ny0*30); g.stroke();
  });
  // Pareto 前緣小圖
  const px0 = W*.72, py0 = H*.78, pw = W*.22, ph = H*.16;
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(px0, py0, pw, ph);
  g.beginPath(); const N = 10; for(let i = 0; i <= N; i++){ const t = i/N, x = px0 + t*pw, y = py0 + ph*(1 - Math.pow(t, .5)*.85);
    i ? g.lineTo(x, y) : g.moveTo(x, y); } g.strokeStyle = c; g.lineWidth = 1.4; g.stroke();
  for(let i = 0; i <= N; i += 2){ const t = i/N; g.fillStyle = "#fff"; g.beginPath(); g.arc(px0 + t*pw, py0 + ph*(1 - Math.pow(t, .5)*.85), 1.8, 0, TAU); g.fill(); }
};
ART.case["G02-05"].ratio = .82;

// G02-06 Reverse Solar Envelope：從鄰房立面朝太陽反向射線，體素式削減，正立面剖開看內部懸挑與孔洞
ART.case["G02-06"] = function(g, W, H, r, c){
  const nx = 9, ny = 7, nz = 11, gap = 8 + r()*3;
  const suns = sunSet(34 + r()*10, 355, 9, 15, 6);
  const fences = [[[-3, ny + gap], [nx + 3, ny + gap]]];
  const hEnv = envField(nx, ny, fences, suns, 0, nz - 1, 0);
  // 立面剖面：沿基地對角掃過去（南邊高、北邊矮），呈現階梯狀天際線，才看得出懸挑與孔洞
  const hAt = i => hEnv[i][Math.round(i/(nx-1)*ny)];
  const cellW = Math.min(W/(nx+2), H*.72/nz);
  const ox = (W - nx*cellW)/2, oy = H*.9 - nz*cellW;
  for(let i = 0; i < nx; i++){ const hi = hAt(i);
    for(let k = 0; k < nz; k++){
      const solid = k <= hi;
      let show = solid;
      if(solid && r() < .16 && k > 0 && k < hi - 1) show = false; // 內部孔洞
      if(!solid && k > hi && k < hi + 2.2 && r() < .4) show = true; // 懸挑
      const x = ox + i*cellW, y = oy + (nz - 1 - k)*cellW;
      if(show){ g.fillStyle = rgba(c, .22 + (k/nz)*.55); g.fillRect(x, y, cellW, cellW); g.strokeStyle = "rgba(10,10,14,.6)"; g.lineWidth = .6; g.strokeRect(x, y, cellW, cellW); }
      else { g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = .5; g.strokeRect(x, y, cellW, cellW); }
    }
  }
  // 鄰房立面（左側，需要保護日照的窗戶列）
  g.fillStyle = "rgba(18,18,24,.9)"; g.strokeStyle = rgba(c, .6); g.lineWidth = 1;
  g.fillRect(ox - cellW*1.4, oy, cellW*1.1, nz*cellW); g.strokeRect(ox - cellW*1.4, oy, cellW*1.1, nz*cellW);
  g.fillStyle = "rgba(255,236,170,.5)"; for(let k = 1; k < nz; k += 2) g.fillRect(ox - cellW*1.25, oy + k*cellW, cellW*.8, cellW*.5);
  // 太陽射線
  g.strokeStyle = "rgba(255,236,170,.6)"; g.lineWidth = 1; g.setLineDash([3,3]);
  g.beginPath(); g.moveTo(ox - cellW*.9, oy + cellW*2); g.lineTo(ox + nx*cellW*.6, oy - cellW*1.5); g.stroke(); g.setLineDash([]);
};
ART.case["G02-06"].ratio = 1.05;

// G02-07 CAADRIA 2017：先模擬、再生成，鄰棟立面依日照時數上色的合規檢查格
ART.case["G02-07"] = function(g, W, H, r, c){
  const cols = 8, rows = 10, mx = W*.16, my = H*.06, cw = (W - mx*1.3)/cols, ch = (H*.86)/rows;
  const suns = sunSet(32 + r()*10, 355, 9, 15, 8);
  for(let i = 0; i < cols; i++) for(let j = 0; j < rows; j++){
    let hrs = 0; suns.forEach(s => { const req = .5 + j*.07; if(s.tanAlt + (r()-.5)*.15 > req - i*.02) hrs++; });
    const t = hrs/suns.length; g.fillStyle = heat(t);
    g.fillRect(mx + i*cw, my + (rows-1-j)*ch, cw - 2, ch - 2);
  }
  g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.strokeRect(mx, my, cols*cw, rows*ch);
  // 左側：新建量體剖面（造成遮蔭的量體）簡化剪影
  g.fillStyle = "rgba(18,18,24,.92)"; g.strokeStyle = rgba(c, .7); g.lineWidth = 1;
  const sh = [[0,H*.92],[mx*.55,H*.92],[mx*.7,H*.35],[mx*.3,H*.15],[0,H*.15]];
  poly(g, sh, true); g.fill(); g.stroke();
  g.strokeStyle = "rgba(255,236,170,.6)"; g.lineWidth = 1; g.setLineDash([3,3]);
  g.beginPath(); g.moveTo(mx*.5, H*.2); g.lineTo(mx + cw*2, my + ch*2); g.stroke(); g.setLineDash([]);
};
ART.case["G02-07"].ratio = 1.2;

// G02-51 ShadeMap：地形起伏的陰影地圖，附時間滑桿
ART.case["G02-51"] = function(g, W, H, r, c){
  const n = 60, m = 44, vn = U.vnoise((r()*1e6)|0), lat = 35 + r()*15;
  const suns = sunSet(lat, 355, 8, 9, 2); // 取清晨低角度時刻，起伏的陰影拉長、地圖上看得清楚
  const s = suns[0] || {dx:.4, dy:.7, tanAlt:.22};
  const hz = Math.hypot(s.dx, s.dy) || 1, lx = -s.dx/hz, ly = -s.dy/hz; // 光源方向（指向太陽）
  const elev = (i, j) => vn(i*.14, j*.14)*3 + vn(i*.46+9, j*.46+4)*1;
  function shadowVal(i, j){ const z0 = elev(i, j); // 沿光源方向逐步檢查是否被更高地形擋住（鑄下陰影）
    for(let t = 1; t <= 20; t++){ const x = i + lx*t*.9, y = j + ly*t*.9; if(x < 0 || y < 0 || x >= n || y >= m) break;
      if(elev(x, y) > z0 + t*.9*s.tanAlt) return 1; }
    return 0; }
  function shade(i, j){ // 坡向暈渲（hillshade）：法向量與光源方向的內積
    const dzx = elev(i+1, j) - elev(i-1, j), dzy = elev(i, j+1) - elev(i, j-1);
    const nlen = Math.hypot(dzx, dzy, .6) || 1, dot = (-dzx*lx - dzy*ly + .6*s.tanAlt)/(nlen*Math.hypot(lx, ly, s.tanAlt));
    return Math.max(0, dot); }
  const off = document.createElement("canvas"); off.width = n; off.height = m; const og = off.getContext("2d");
  const img = og.createImageData(n, m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const k = (j*n+i)*4;
    const base = .32 + elev(i, j)*.1, sh = shade(i, j), cast = shadowVal(i, j);
    const light = cast ? .18 : .35 + sh*.9;
    img.data[k] = 45*base*light*1.1; img.data[k+1] = 110*base*light; img.data[k+2] = 55*base*light; img.data[k+3] = 255; }
  og.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, W, H*.86);
  // 時間滑桿
  const sy = H*.93, sx0 = W*.1, sx1 = W*.9;
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 2; g.beginPath(); g.moveTo(sx0, sy); g.lineTo(sx1, sy); g.stroke();
  const hx = sx0 + (sx1-sx0)*r(); g.fillStyle = c; g.beginPath(); g.arc(hx, sy, 5, 0, TAU); g.fill(); g.strokeStyle="#fff"; g.lineWidth=1; g.stroke();
};
ART.case["G02-51"].ratio = 1.15;

// G02-53 Blender Sun Position：場景中的太陽方向燈＋天空中的日行跡（analemma）
ART.case["G02-53"] = function(g, W, H, r, c){
  const cx = W/2, cy = H*.62, gw = W*.7, gd = H*.16;
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1;
  for(let i = -4; i <= 4; i++){ g.beginPath(); g.moveTo(cx - gw/2, cy + i*gd*.14); g.lineTo(cx + gw/2, cy + i*gd*.14); g.stroke(); }
  for(let i = -4; i <= 4; i++){ g.beginPath(); g.moveTo(cx + i*gw*.11, cy - gd*.6); g.lineTo(cx + i*gw*.11, cy + gd*.6); g.stroke(); }
  // 簡化建築量體
  const bx = cx - gw*.12, by = cy - gd*.5, bw = gw*.22, bh = gd*1.6;
  g.fillStyle = "rgba(20,20,26,.92)"; g.strokeStyle = rgba(c, .8); g.lineWidth = 1; g.fillRect(bx, by - bh, bw, bh); g.strokeRect(bx, by - bh, bw, bh);
  // 太陽與方向光
  const sunA = -.6 + r()*.3, sx = cx + Math.cos(sunA)*W*.34, sy = H*.14 + Math.sin(sunA)*H*.12;
  g.fillStyle = "#FFECAA"; g.beginPath(); g.arc(sx, sy, 8, 0, TAU); g.fill();
  g.strokeStyle = "rgba(255,236,170,.7)"; g.lineWidth = 1; g.setLineDash([3,3]); g.beginPath(); g.moveTo(sx, sy); g.lineTo(bx + bw*.5, by - bh*.7); g.stroke(); g.setLineDash([]);
  // 日行跡八字
  g.strokeStyle = rgba(c, .8); g.lineWidth = 1.4; g.beginPath();
  for(let t = 0; t <= 60; t++){ const u = t/60*TAU, x = cx + W*.1*Math.sin(u), y = H*.14 - H*.04*Math.sin(2*u); t ? g.lineTo(x,y) : g.moveTo(x,y); } g.stroke();
  // 座標軸小圖示
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(W*.08,H*.9); g.lineTo(W*.08+14,H*.9); g.stroke(); g.beginPath(); g.moveTo(W*.08,H*.9); g.lineTo(W*.08,H*.9-14); g.stroke();
};
ART.case["G02-53"].ratio = 1.1;

// G02-54 SunCalc：太陽方位／高度角的極座標日照圖，帶晨昏／白天色帶
ART.case["G02-54"] = function(g, W, H, r, c){
  const cx = W/2, cy = H*.52, R = Math.min(W, H)*.38, lat = 25 + r()*20;
  const bands = [[-18,-12,"rgba(60,60,110,.35)"],[-12,-6,"rgba(90,80,130,.4)"],[-6,0,"rgba(160,120,120,.45)"],[0,90,"rgba(255,224,150,.16)"]];
  bands.forEach(([a0, a1, col]) => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, R*(1 - (90 - a1)/180), 0, TAU); g.fill(); });
  g.fillStyle = "#1C1C24"; g.beginPath(); g.arc(cx, cy, R*.42, 0, TAU); g.fill();
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1;
  [.42, .68, .88, 1].forEach(k => { g.beginPath(); g.arc(cx, cy, R*k, 0, TAU); g.stroke(); });
  for(let i = 0; i < 12; i++){ const a = i/12*TAU; g.beginPath(); g.moveTo(cx + Math.cos(a)*R*.42, cy + Math.sin(a)*R*.42); g.lineTo(cx + Math.cos(a)*R, cy + Math.sin(a)*R); g.stroke(); }
  const suns = sunSet(lat, 355, 5.5, 18.5, 48);
  g.strokeStyle = c; g.lineWidth = 2; g.beginPath();
  suns.forEach((s, i) => { const az = Math.atan2(-s.dx, -s.dy), alt = Math.atan(s.tanAlt), rr = R*(1 - Math.max(0,Math.min(1, alt/(Math.PI/2))));
    const x = cx + Math.sin(az)*rr, y = cy - Math.cos(az)*rr; i ? g.lineTo(x,y) : g.moveTo(x,y); });
  g.stroke();
  const cur = suns[(suns.length*.5)|0]; if(cur){ const az = Math.atan2(-cur.dx,-cur.dy), alt = Math.atan(cur.tanAlt), rr = R*(1 - Math.max(0,Math.min(1, alt/(Math.PI/2))));
    g.fillStyle = "#FFECAA"; g.beginPath(); g.arc(cx + Math.sin(az)*rr, cy - Math.cos(az)*rr, 3.5, 0, TAU); g.fill(); }
};
ART.case["G02-54"].ratio = .95;

})();
