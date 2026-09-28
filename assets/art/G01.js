/* G01 Isovist 可視域與可見性圖分析：基本生成器（變形與案例的獨立畫法由 gh-enrich 的 ART 單元補上） */
(function(){
const ART = window.ART, U = window.GENUTIL;

// 射線 p + t·d 與線段 s 求交，回傳 t（沒有交點回傳 -1）
function raySeg(px, py, dx, dy, s){
  const ex = s[2]-s[0], ey = s[3]-s[1], den = dx*ey - dy*ex; if(Math.abs(den) < 1e-12) return -1;
  const wx = s[0]-px, wy = s[1]-py, t = (wx*ey - wy*ex)/den, u = (wx*dy - wy*dx)/den;
  return (t < 0 || u < 0 || u > 1) ? -1 : t;
}
// 從 (px,py) 等角度打 n 條射線，回傳依角度排列的交點與距離
function isovist(px, py, segs, n, maxD){
  const pts = [], dist = [];
  for(let i = 0; i < n; i++){ const a = i/n*U.TAU, dx = Math.cos(a), dy = Math.sin(a); let best = maxD;
    for(const s of segs){ const t = raySeg(px, py, dx, dy, s); if(t > 1e-6 && t < best) best = t; }
    dist.push(best); pts.push([px + dx*best, py + dy*best]); }
  return {pts, dist};
}
function area(P){ let A = 0; for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1)%P.length]; A += a[0]*b[1] - b[0]*a[1]; } return Math.abs(A)/2; }
// 遮蔽邊長度：相鄰射線距離跳動 > 20% 的邊（看不到後面的邊）
function occl(iso){ let L = 0; const d = iso.dist, P = iso.pts;
  for(let i = 0; i < P.length; i++){ const j = (i+1)%P.length; if(Math.abs(d[i]-d[j]) > .2*Math.max(d[i],d[j])) L += Math.hypot(P[j][0]-P[i][0], P[j][1]-P[i][1]); } return L; }
// 點是否在任一實心方塊內（格點落在柱或建築量體裡就不算）
const inside = (x, y, B) => B.some(b => x > b[0] && x < b[0]+b[2] && y > b[1] && y < b[1]+b[3]);
const boxSegs = b => [[b[0],b[1],b[0]+b[2],b[1]],[b[0]+b[2],b[1],b[0]+b[2],b[1]+b[3]],[b[0]+b[2],b[1]+b[3],b[0],b[1]+b[3]],[b[0],b[1]+b[3],b[0],b[1]]];

U.GEN["G01"] = function(g, W, H, r, v, c){
  const m = Math.min(W,H)*.06, x0 = m, y0 = m, x1 = W-m, y1 = H-m, segs = [], solids = [], type = v % 3;
  // 外牆
  segs.push([x0,y0,x1,y0],[x1,y0,x1,y1],[x1,y1,x0,y1],[x0,y1,x0,y0]);
  if(type === 0){ // 室內平面：隔間牆留門洞＋幾根柱子
    const nw = 3 + ((r()*3)|0);
    for(let k = 0; k < nw; k++){ const vert = r() < .5;
      if(vert){ const x = x0 + (x1-x0)*(.15 + r()*.7), a = y0 + (y1-y0)*r()*.5, b = a + (y1-y0)*(.3 + r()*.4), gap = (y1-y0)*.08, gm = a + (b-a)*(.2 + r()*.6);
        segs.push([x,a,x,Math.min(gm-gap/2,y1)],[x,gm+gap/2,x,Math.min(b,y1)]); }
      else { const y = y0 + (y1-y0)*(.15 + r()*.7), a = x0 + (x1-x0)*r()*.5, b = a + (x1-x0)*(.3 + r()*.4), gap = (x1-x0)*.08, gm = a + (b-a)*(.2 + r()*.6);
        segs.push([a,y,Math.min(gm-gap/2,x1),y],[gm+gap/2,y,Math.min(b,x1),y]); } }
    for(let k = 0; k < 4; k++){ const s = Math.min(W,H)*.035, b = [x0 + (x1-x0)*(.1+r()*.8), y0 + (y1-y0)*(.1+r()*.8), s, s]; solids.push(b); }
  } else if(type === 1){ // 都市街廓：格狀建築量體，街道寬窄不一
    const cols = 3 + ((r()*2)|0), rows = 2 + ((r()*2)|0), cw = (x1-x0)/cols, rh = (y1-y0)/rows;
    for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){ if(r() < .18) continue; // 空一格當廣場
      const st = .18 + r()*.14; solids.push([x0 + i*cw + cw*st/2, y0 + j*rh + rh*st/2, cw*(1-st), rh*(1-st)]); }
  } else { // 庭園：散置的短牆與亭子（類似園林的漏窗與屏）
    for(let k = 0; k < 9; k++){ const cx = x0 + (x1-x0)*r(), cy = y0 + (y1-y0)*r(), a = r()*Math.PI, L = Math.min(W,H)*(.08 + r()*.16);
      const cl = (x, lo, hi) => Math.max(lo+2, Math.min(hi-2, x));
      segs.push([cl(cx - Math.cos(a)*L/2, x0, x1), cl(cy - Math.sin(a)*L/2, y0, y1), cl(cx + Math.cos(a)*L/2, x0, x1), cl(cy + Math.sin(a)*L/2, y0, y1)]); }
    for(let k = 0; k < 3; k++){ const s = Math.min(W,H)*(.05 + r()*.05); solids.push([x0 + (x1-x0)*(.1+r()*.75), y0 + (y1-y0)*(.1+r()*.75), s, s*.8]); }
  }
  solids.forEach(b => segs.push(...boxSegs(b)));

  // 可見性場：每個格點都算一次 isovist，指標依 v 切換（面積／遮蔽邊長度）
  const n = 44, mm = Math.max(8, Math.round(n*H/W)), rays = 72, maxD = Math.hypot(W,H), useOccl = (v >> 1) % 2 === 1;
  const val = new Float32Array(n*mm); let lo = 1e18, hi = -1e18;
  for(let j = 0; j < mm; j++) for(let i = 0; i < n; i++){ const px = x0 + (x1-x0)*(i+.5)/n, py = y0 + (y1-y0)*(j+.5)/mm;
    if(inside(px, py, solids)){ val[j*n+i] = NaN; continue; }
    const iso = isovist(px, py, segs, rays, maxD), q = useOccl ? occl(iso) : area(iso.pts);
    val[j*n+i] = q; lo = Math.min(lo, q); hi = Math.max(hi, q); }
  const off = document.createElement("canvas"); off.width = n; off.height = mm; const og = off.getContext("2d");
  U.field(og, n, mm, n, mm, (i,j) => { const q = val[j*n+i]; return isNaN(q) ? 0 : .06 + .8*(q-lo)/((hi-lo)||1); }, c, useOccl ? 1.1 : 1.7);
  g.imageSmoothingEnabled = true; g.globalAlpha = .9; g.drawImage(off, x0, y0, x1-x0, y1-y0); g.globalAlpha = 1;

  // 觀察點：選一個場值高的格點，畫出它的可視域多邊形與射線
  let bi = -1, bv = -1; for(let k = 0; k < 40; k++){ const i = 3 + ((r()*(n-6))|0), j = 2 + ((r()*(mm-4))|0), q = val[j*n+i]; if(!isNaN(q) && q > bv){ bv = q; bi = j*n+i; } }
  const vx = x0 + (x1-x0)*((bi % n)+.5)/n, vy = y0 + (y1-y0)*(((bi/n)|0)+.5)/mm, main = isovist(vx, vy, segs, 360, maxD);
  g.strokeStyle = U.rgba("#ffffff", .10); g.lineWidth = .6;
  for(let i = 0; i < 360; i += 6){ g.beginPath(); g.moveTo(vx, vy); g.lineTo(...main.pts[i]); g.stroke(); }
  g.fillStyle = U.rgba("#ffffff", .22); U.poly(g, main.pts, true); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.4; g.setLineDash([4,3]); g.stroke(); g.setLineDash([]);

  // 牆線與實心量體
  g.fillStyle = "#15151c"; solids.forEach(b => g.fillRect(b[0], b[1], b[2], b[3]));
  g.strokeStyle = U.rgba("#ffffff", .85); g.lineWidth = 2; g.lineCap = "round";
  segs.forEach(s => { g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); g.stroke(); });
  g.fillStyle = c; g.beginPath(); g.arc(vx, vy, 4, 0, U.TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.stroke();
};

ART.var["G01"] = ART.var["G01"] || [];
})();
