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
