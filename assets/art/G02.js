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
