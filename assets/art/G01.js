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

/* G01 Isovist 可視域與可見性圖分析：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = U.TAU;

/* ---------- 共用小工具（獨立於基本生成器，互不影響） ---------- */
function raySeg(px, py, dx, dy, s){
  const ex = s[2]-s[0], ey = s[3]-s[1], den = dx*ey - dy*ex; if(Math.abs(den) < 1e-12) return -1;
  const wx = s[0]-px, wy = s[1]-py, t = (wx*ey - wy*ex)/den, u = (wx*dy - wy*dx)/den;
  return (t < 0 || u < 0 || u > 1) ? -1 : t;
}
function isovist(px, py, segs, n, maxD, a0, a1){
  a0 = a0 == null ? 0 : a0; a1 = a1 == null ? TAU : a1;
  const pts = [], dist = [];
  for(let i = 0; i <= n; i++){ const a = a0 + (a1-a0)*i/n, dx = Math.cos(a), dy = Math.sin(a); let best = maxD;
    for(const s of segs){ const t = raySeg(px, py, dx, dy, s); if(t > 1e-6 && t < best) best = t; }
    dist.push(best); pts.push([px+dx*best, py+dy*best]); }
  return {pts, dist};
}
function isoArea(P){ let A = 0; for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1)%P.length]; A += a[0]*b[1]-b[0]*a[1]; } return Math.abs(A)/2; }
function centroid(P){ let cx = 0, cy = 0; P.forEach(p => { cx += p[0]; cy += p[1]; }); return [cx/P.length, cy/P.length]; }
function boxSegs(b){ return [[b[0],b[1],b[0]+b[2],b[1]],[b[0]+b[2],b[1],b[0]+b[2],b[1]+b[3]],[b[0]+b[2],b[1]+b[3],b[0],b[1]+b[3]],[b[0],b[1]+b[3],b[0],b[1]]]; }
const inside = (x, y, B) => B.some(b => x > b[0] && x < b[0]+b[2] && y > b[1] && y < b[1]+b[3]);
// 常用房間：外框 + n 個矩形障礙物（柱子／家具／量體）
function roomBox(W, H, r, margin, nObs, sizeMin, sizeMax){
  const m = Math.min(W,H)*margin, x0 = m, y0 = m, x1 = W-m, y1 = H-m;
  const segs = [[x0,y0,x1,y0],[x1,y0,x1,y1],[x1,y1,x0,y1],[x0,y1,x0,y0]], solids = [];
  for(let k = 0; k < nObs; k++){ const sw = Math.min(W,H)*(sizeMin + r()*(sizeMax-sizeMin)), sh = sw*(.6+r()*.9);
    solids.push([x0+(x1-x0)*(.12+r()*.72), y0+(y1-y0)*(.12+r()*.72), sw, sh]); }
  solids.forEach(b => segs.push(...boxSegs(b)));
  return {x0,y0,x1,y1,segs,solids};
}
function pickViewer(x0,y0,x1,y1,solids,r){ let vx,vy,k=0; do{ vx = x0+(x1-x0)*(.15+r()*.7); vy = y0+(y1-y0)*(.15+r()*.7); k++; }while(inside(vx,vy,solids) && k<40); return [vx,vy]; }
function drawWalls(g, segs, solids, wcol, ww){
  g.fillStyle = "#15151c"; solids.forEach(b => g.fillRect(b[0], b[1], b[2], b[3]));
  g.strokeStyle = wcol || U.rgba("#ffffff", .85); g.lineWidth = ww || 2; g.lineCap = "round";
  segs.forEach(s => { g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); g.stroke(); });
}
function eyeDot(g, vx, vy, c, R){ g.fillStyle = c; g.beginPath(); g.arc(vx, vy, R||4, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.stroke(); }

/* ================= 變形（0 起算，對應 variations 陣列順序） ================= */
const V = [];

// V01 端點射線：精確可視域多邊形——射線只打向牆角（±微偏），多邊形頂點剛好落在轉角
V[0] = function(g, W, H, r, c){
  const {x0,y0,x1,y1,segs,solids} = roomBox(W,H,r,.1, 3+((r()*3)|0), .05,.13);
  const [vx,vy] = pickViewer(x0,y0,x1,y1,solids,r), maxD = Math.hypot(W,H), eps = 3e-3, angs = [];
  segs.forEach(s => { [[s[0],s[1]],[s[2],s[3]]].forEach(p => { const a = Math.atan2(p[1]-vy, p[0]-vx); angs.push(a-eps, a, a+eps); }); });
  angs.sort((a,b) => a-b);
  const pts = angs.map(a => { const dx = Math.cos(a), dy = Math.sin(a); let best = maxD;
    for(const s of segs){ const t = raySeg(vx,vy,dx,dy,s); if(t>1e-6 && t<best) best = t; } return [vx+dx*best, vy+dy*best]; });
  g.strokeStyle = U.rgba("#ffffff", .13); g.lineWidth = .6;
  for(let i = 1; i < pts.length; i += 3){ g.beginPath(); g.moveTo(vx,vy); g.lineTo(pts[i][0],pts[i][1]); g.stroke(); }
  g.fillStyle = U.rgba(c, .24); U.poly(g, pts, true); g.fill();
  g.strokeStyle = c; g.lineWidth = 1.6; U.poly(g, pts, true); g.stroke();
  drawWalls(g, segs, solids);
  g.fillStyle = c; for(let i = 1; i < pts.length; i += 3){ g.beginPath(); g.arc(pts[i][0], pts[i][1], 2.4, 0, TAU); g.fill(); }
  eyeDot(g, vx, vy, "#fff", 4);
};

// V02 視錐 isovist：限制視角與朝向——扇形視野＋朝向箭頭，外圍虛線圓標出被排除的範圍
V[1] = function(g, W, H, r, c){
  const {x0,y0,x1,y1,segs,solids} = roomBox(W,H,r,.1, 3+((r()*2)|0), .05,.09);
  const vx = x0+(x1-x0)*(.18+r()*.12), vy = y0+(y1-y0)*(.3+r()*.4), maxD = Math.hypot(W,H);
  const dirA = (-.5+r())*.6, fov = (55+r()*70)*Math.PI/180;
  const iso = isovist(vx,vy,segs,54,maxD, dirA-fov/2, dirA+fov/2);
  g.strokeStyle = U.rgba("#ffffff", .1); g.setLineDash([2,4]); g.lineWidth = 1;
  g.beginPath(); g.arc(vx,vy, Math.min(x1-x0,y1-y0)*.42, 0, TAU); g.stroke(); g.setLineDash([]);
  const pts = [[vx,vy], ...iso.pts];
  g.fillStyle = U.rgba(c, .3); U.poly(g, pts, true); g.fill();
  g.strokeStyle = c; g.lineWidth = 1.5; U.poly(g, pts, true); g.stroke();
  g.strokeStyle = U.rgba("#ffffff", .12); g.lineWidth = .6;
  for(let i = 0; i < iso.pts.length; i += 5){ g.beginPath(); g.moveTo(vx,vy); g.lineTo(iso.pts[i][0], iso.pts[i][1]); g.stroke(); }
  drawWalls(g, segs, solids);
  g.strokeStyle = "#fff"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(vx,vy); g.lineTo(vx+Math.cos(dirA)*26, vy+Math.sin(dirA)*26); g.stroke();
  eyeDot(g, vx, vy, c, 4.2);
};

// V03 完整形狀指標：徑向統計與 drift——射線依長度上色，重心偏移箭頭，角落一個誤差棒示意統計
V[2] = function(g, W, H, r, c){
  const {x0,y0,x1,y1,segs,solids} = roomBox(W,H,r,.11, 4+((r()*3)|0), .04,.1);
  const [vx,vy] = pickViewer(x0,y0,x1,y1,solids,r), maxD = Math.hypot(W,H), n = 90;
  const iso = isovist(vx,vy,segs,n,maxD);
  let mean = 0; iso.dist.forEach(d => mean += d); mean /= iso.dist.length;
  let sd = 0; iso.dist.forEach(d => sd += (d-mean)**2); sd = Math.sqrt(sd/iso.dist.length);
  const mx = Math.max(...iso.dist);
  for(let i = 0; i < n; i++){ const t = iso.dist[i]/mx;
    g.strokeStyle = `rgba(${255},${255},${255},${.06+.22*t})`; g.lineWidth = 1;
    g.beginPath(); g.moveTo(vx,vy); g.lineTo(iso.pts[i][0], iso.pts[i][1]); g.stroke(); }
  g.fillStyle = U.rgba(c, .22); U.poly(g, iso.pts, true); g.fill();
  g.strokeStyle = c; g.lineWidth = 1.4; U.poly(g, iso.pts, true); g.stroke();
  drawWalls(g, segs, solids);
  const cg = centroid(iso.pts), dx = cg[0]-vx, dy = cg[1]-vy, dl = Math.hypot(dx,dy)||1;
  g.strokeStyle = "#FFD873"; g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(vx,vy); g.lineTo(cg[0],cg[1]); g.stroke();
  const ah = 7, aA = Math.atan2(dy,dx);
  g.beginPath(); g.moveTo(cg[0],cg[1]); g.lineTo(cg[0]-ah*Math.cos(aA-.4), cg[1]-ah*Math.sin(aA-.4)); g.lineTo(cg[0]-ah*Math.cos(aA+.4), cg[1]-ah*Math.sin(aA+.4)); g.closePath(); g.fillStyle = "#FFD873"; g.fill();
  eyeDot(g, vx, vy, "#fff", 4);
  // 徑向統計誤差棒（角落小圖形，無文字）
  const bx = x1-16, by = y1-14, bs = Math.min(W,H)*.12;
  g.strokeStyle = U.rgba("#ffffff", .5); g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by-bs*(mean/mx)); g.stroke();
  g.beginPath(); g.moveTo(bx-4, by-bs*((mean-sd)/mx)); g.lineTo(bx+4, by-bs*((mean-sd)/mx)); g.moveTo(bx-4, by-bs*Math.min(1,(mean+sd)/mx)); g.lineTo(bx+4, by-bs*Math.min(1,(mean+sd)/mx)); g.stroke();
};

// V04 動線上的 isovist 序列——走道 + 多個採樣點的小可視域疊影 + 下方開合折線圖
V[3] = function(g, W, H, r, c){
  const m = Math.min(W,H)*.08, x0 = m, y0 = m, x1 = W-m, y1 = H*.68, ph = y1-y0;
  const rooms = 3+((r()*3)|0), rw = (x1-x0)/rooms, segs = [[x0,y0,x1,y0],[x1,y0,x1,y1],[x1,y1,x0,y1],[x0,y1,x0,y0]];
  const gapY = y0+ph*(.42+r()*.16);
  for(let k = 1; k < rooms; k++){ const x = x0+k*rw, gw = rw*(.16+r()*.12);
    segs.push([x, y0, x, gapY-gw/2],[x, gapY+gw/2, x, y1]); }
  segs.forEach((s,i) => {});
  const path = []; for(let k = 0; k <= rooms; k++) path.push([x0+k*rw, gapY + Math.sin(k*1.7+r()*3)*ph*.12]);
  const samples = 6, pts = [], areas = [];
  for(let i = 0; i < samples; i++){ const t = i/(samples-1)*rooms, k = Math.min(rooms-1, t|0), lt = t-k;
    const px = path[k][0]+(path[k+1][0]-path[k][0])*lt, py = path[k][1]+(path[k+1][1]-path[k][1])*lt;
    pts.push([px,py]); const iso = isovist(px,py,segs,40,Math.hypot(x1-x0,y1-y0)); areas.push(isoArea(iso.pts)); }
  const mxA = Math.max(...areas);
  pts.forEach((p,i) => { const iso = isovist(p[0],p[1],segs,40,Math.hypot(x1-x0,y1-y0));
    g.fillStyle = U.rgba(c, .12+.1*(areas[i]/mxA)); U.poly(g, iso.pts, true); g.fill(); });
  drawWalls(g, segs, [], U.rgba("#ffffff", .8), 1.8);
  g.strokeStyle = U.rgba("#ffffff", .55); g.lineWidth = 1.6; g.setLineDash([1,4]);
  U.poly(g, path); g.stroke(); g.setLineDash([]);
  pts.forEach((p,i) => { g.fillStyle = i===0||i===samples-1 ? "#fff" : c; g.beginPath(); g.arc(p[0],p[1], 3+2*(areas[i]/mxA), 0, TAU); g.fill(); });
  // 折線圖
  const cy0 = H*.78, cy1 = H-m*.6, cw = x1-x0;
  g.strokeStyle = U.rgba("#ffffff", .12); g.lineWidth = 1; g.beginPath(); g.moveTo(x0,cy1); g.lineTo(x1,cy1); g.stroke();
  g.beginPath(); areas.forEach((a,i) => { const px = x0+cw*i/(samples-1), py = cy1-(cy1-cy0)*(a/mxA); i? g.lineTo(px,py) : g.moveTo(px,py); });
  g.strokeStyle = c; g.lineWidth = 2; g.stroke();
  areas.forEach((a,i) => { const px = x0+cw*i/(samples-1), py = cy1-(cy1-cy0)*(a/mxA); g.fillStyle = "#fff"; g.beginPath(); g.arc(px,py,2.4,0,TAU); g.fill(); });
};
V[3].ratio = .95;

// V05 可見性圖 VGA：格點互看得見就連邊，依鄰居數決定節點大小
V[4] = function(g, W, H, r, c){
  const {x0,y0,x1,y1,segs,solids} = roomBox(W,H,r,.1, 3+((r()*3)|0), .06,.12);
  const nx = 8, ny = 6, nodes = [];
  for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++){ const px = x0+(x1-x0)*(i+.5)/nx, py = y0+(y1-y0)*(j+.5)/ny; if(!inside(px,py,solids)) nodes.push([px,py]); }
  const N = nodes.length, adj = Array.from({length:N}, () => []);
  for(let a = 0; a < N; a++) for(let b = a+1; b < N; b++){ const [ax,ay] = nodes[a], [bx,by] = nodes[b], d = Math.hypot(bx-ax,by-ay);
    let vis = true; for(const s of segs){ const t = raySeg(ax,ay,(bx-ax)/d,(by-ay)/d,s); if(t>1e-6 && t<d-1e-6){ vis=false; break; } }
    if(vis){ adj[a].push(b); adj[b].push(a); } }
  drawWalls(g, segs, solids, U.rgba("#ffffff", .5), 1.6);
  let mxk = 1; adj.forEach(l => mxk = Math.max(mxk, l.length));
  g.lineWidth = .5;
  for(let a = 0; a < N; a++) adj[a].forEach(b => { if(b>a){ g.strokeStyle = U.rgba(c, .08+.1*Math.min(adj[a].length,adj[b].length)/mxk); g.beginPath(); g.moveTo(nodes[a][0],nodes[a][1]); g.lineTo(nodes[b][0],nodes[b][1]); g.stroke(); } });
  let lo = -1, lov = 1e9; nodes.forEach((p,i) => { if(adj[i].length < lov){ lov = adj[i].length; lo = i; } });
  nodes.forEach((p,i) => { const t = adj[i].length/mxk; g.fillStyle = i===lo ? "#fff" : U.rgba(c, .5+.5*t); g.beginPath(); g.arc(p[0],p[1], 2.4+t*4, 0, TAU); g.fill();
    if(i===lo){ g.strokeStyle = "#fff"; g.lineWidth = 1.4; g.beginPath(); g.arc(p[0],p[1], 8, 0, TAU); g.stroke(); } });
};

// V06 3D isovist：室內量體＋球面射線點雲，軸測投影
V[5] = function(g, W, H, r, c){
  const P0 = (x,y,z) => [(x-y)*.87, (x+y)*.5-z*.72];
  const ax = 5+r()*2, ay = 4+r()*2, az = 2.4+r()*2.2;
  const pts3 = []; const golden = Math.PI*(3-Math.sqrt(5));
  const n = 340;
  for(let i = 0; i < n; i++){ const yv = 1-2*(i+.5)/n, rad = Math.sqrt(Math.max(0,1-yv*yv)), th = golden*i;
    let dx = Math.cos(th)*rad, dz = yv, dy = Math.sin(th)*rad;
    if(dz < 0) dz *= .35; // 樓板附近射線較少往下穿
    const tx = dx>0 ? (ax/2)/Math.max(1e-6,dx) : dx<0 ? (-ax/2)/dx : 1e9;
    const ty = dy>0 ? (ay/2)/Math.max(1e-6,dy) : dy<0 ? (-ay/2)/dy : 1e9;
    const tz = dz>0 ? (az-1.6)/Math.max(1e-6,dz) : dz<0 ? (-1.6)/dz : 1e9;
    const t = Math.min(tx,ty,tz);
    pts3.push([dx*t, dy*t, dz*t]); }
  let mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9; const proj = pts3.map(p => P0(p[0],p[1],p[2]));
  const wire = [[-ax/2,-ay/2,-1.6],[ax/2,-ay/2,-1.6],[ax/2,ay/2,-1.6],[-ax/2,ay/2,-1.6]];
  const top = wire.map(p => [p[0],p[1],az-1.6]);
  [...wire,...top].forEach(p => { const q = P0(p[0],p[1],p[2]); mnx=Math.min(mnx,q[0]);mxx=Math.max(mxx,q[0]);mny=Math.min(mny,q[1]);mxy=Math.max(mxy,q[1]); });
  const k = Math.min(W*.7/(mxx-mnx), H*.62/(mxy-mny)), ox = W/2-(mnx+mxx)/2*k, oy = H*.56-(mny+mxy)/2*k;
  const P = (x,y,z) => { const q = P0(x,y,z); return [ox+q[0]*k, oy+q[1]*k]; };
  g.strokeStyle = U.rgba("#ffffff", .3); g.lineWidth = 1;
  for(let i = 0; i < 4; i++){ U.poly(g, [P(...wire[i]), P(...wire[(i+1)%4])]); g.stroke(); U.poly(g, [P(...wire[i]), P(...top[i])]); g.stroke(); }
  g.setLineDash([2,3]); for(let i = 0; i < 4; i++){ U.poly(g, [P(...top[i]), P(...top[(i+1)%4])]); g.stroke(); } g.setLineDash([]);
  let far = 0; pts3.forEach(p => far = Math.max(far, Math.hypot(p[0],p[1],p[2])));
  pts3.forEach((p,i) => { const d = Math.hypot(p[0],p[1],p[2])/far, q = P(p[0],p[1],p[2]);
    g.fillStyle = U.rgba(c, .25+.55*d); g.beginPath(); g.arc(q[0],q[1], 1+1.6*d, 0, TAU); g.fill(); });
  eyeDot(g, ox, oy, "#fff", 4);
};

// V07 地形上的可視域（viewshed）：等高線地形 + 可見／不可見二值場
V[6] = function(g, W, H, r, c){
  const nz = U.vnoise((r()*1e9)|0), n = 60, m = 44, mgn = Math.min(W,H)*.06, S = Math.min((W-2*mgn)/n, (H-2*mgn)/m);
  const x0 = (W-n*S)/2, y0 = (H-m*S)/2, elev = new Float32Array(n*m);
  let pk = [n*(.3+r()*.2), m*(.3+r()*.2)];
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ let e = 0, a=.5,f=1; for(let o=0;o<4;o++){ e += nz(i*.08*f, j*.08*f)*a; a*=.5; f*=2; }
    e += .65*Math.exp(-((i-pk[0])**2+(j-pk[1])**2)/300); elev[j*n+i] = e; }
  const vi = Math.round(pk[0]), vj = Math.round(pk[1]), vz = elev[vj*n+vi]+.08;
  const vis = new Uint8Array(n*m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const dx = i-vi, dy = j-vj, d = Math.hypot(dx,dy)||1; let ok = true;
    for(let s = 1; s < d; s += Math.max(1,d/12)){ const ix = Math.round(vi+dx*s/d), iy = Math.round(vj+dy*s/d);
      if(ix<0||iy<0||ix>=n||iy>=m) continue; const eh = elev[iy*n+ix], expect = vz + (elev[j*n+i]-vz)*(s/d);
      if(eh > expect+.02){ ok = false; break; } }
    vis[j*n+i] = ok?1:0; }
  const off = document.createElement("canvas"); off.width = n; off.height = m; const og = off.getContext("2d"), img = og.createImageData(n,m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const k=(j*n+i)*4, [R,G,B] = U.rgb(c), vv = vis[j*n+i];
    if(vv){ img.data[k]=R;img.data[k+1]=G;img.data[k+2]=B;img.data[k+3]=110; } else { img.data[k]=40;img.data[k+1]=40;img.data[k+2]=46;img.data[k+3]=160; } }
  og.putImageData(img,0,0); g.imageSmoothingEnabled = true; g.drawImage(off, x0,y0, n*S, m*S);
  const f = (i,j) => elev[j*n+i]; const T = (i,j) => [x0+i*S, y0+j*S];
  for(let lv = .2; lv < 1.3; lv += .12){ const segs2 = U.contour(n,m,f,lv); g.strokeStyle = U.rgba("#ffffff", .22); g.lineWidth = .8;
    g.beginPath(); segs2.forEach(([a,b]) => { const p=T(a[0],a[1]), q=T(b[0],b[1]); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); }); g.stroke(); }
  const vp = T(vi,vj); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(vp[0],vp[1]-6); g.lineTo(vp[0]+5,vp[1]+4); g.lineTo(vp[0]-5,vp[1]+4); g.closePath(); g.fill();
};

// V08 Monte Carlo 天空可視率：街廓地面 SVF 場 + 半球取樣示意
V[7] = function(g, W, H, r, c){
  const m = Math.min(W,H)*.08, x0 = m, y0 = m, x1 = W-m, y1 = H-m;
  const cols = 4+((r()*2)|0), rows = 3+((r()*2)|0), cw = (x1-x0)/cols, rh = (y1-y0)/rows, unit = Math.min(cw,rh), bld = [];
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){ if(r() < .25) continue;
    const st = .3+r()*.18, h = .4+r()*1.4; bld.push({x:x0+i*cw+cw*st/2, y:y0+j*rh+rh*st/2, w:cw*(1-st), h:rh*(1-st), z:h}); }
  const n = 60, mm = Math.max(6, Math.round(n*(y1-y0)/(x1-x0)));
  const off = document.createElement("canvas"); off.width = n; off.height = mm; const og = off.getContext("2d"), img = og.createImageData(n,mm);
  const [R,G,B] = U.rgb(c);
  for(let j = 0; j < mm; j++) for(let i = 0; i < n; i++){ const px = x0+(x1-x0)*(i+.5)/n, py = y0+(y1-y0)*(j+.5)/mm;
    let nd = 1e9, nh = 0; bld.forEach(b => { const cx = Math.max(b.x,Math.min(px,b.x+b.w)), cy = Math.max(b.y,Math.min(py,b.y+b.h)); const d = Math.hypot(px-cx,py-cy);
      if(px>b.x&&px<b.x+b.w&&py>b.y&&py<b.y+b.h) nd = -1; else if(d<nd){ nd=d; nh=b.z; } });
    const svf = nd<0 ? 0 : Math.max(0, Math.min(1, 1 - (nh*unit*.55)/(2*Math.max(unit*.12,nd))));
    const k = (j*n+i)*4, t = svf; img.data[k]=21+(R-21)*t; img.data[k+1]=21+(G-21)*t; img.data[k+2]=27+(B-27)*t; img.data[k+3]=nd<0?0:230; }
  og.putImageData(img,0,0); g.imageSmoothingEnabled = true; g.drawImage(off, x0,y0, x1-x0, y1-y0);
  g.fillStyle = "#15151c"; bld.forEach(b => g.fillRect(b.x,b.y,b.w,b.h));
  g.strokeStyle = U.rgba("#ffffff", .55); g.lineWidth = 1; bld.forEach(b => g.strokeRect(b.x,b.y,b.w,b.h));
  // 半球取樣示意：找一塊夠大的空地畫小圓頂與隨機方向點
  let sx = x0+(x1-x0)*.5, sy = y0+(y1-y0)*.5, k=0, domeR = Math.min(unit*.4, Math.min(W,H)*.09);
  while(bld.some(b=>sx>b.x-domeR&&sx<b.x+b.w+domeR&&sy>b.y-domeR&&sy<b.y+b.h+domeR) && k++<40){ sx = x0+(x1-x0)*(.1+r()*.8); sy = y0+(y1-y0)*(.1+r()*.8); }
  g.strokeStyle = U.rgba("#ffffff", .45); g.lineWidth = 1; g.beginPath(); g.arc(sx,sy,domeR, Math.PI, 0); g.stroke();
  for(let i = 0; i < 26; i++){ const a = r()*Math.PI, rr = r()*domeR, blocked = r() < .3;
    g.fillStyle = blocked ? "rgba(255,120,120,.7)" : "rgba(255,255,255,.7)"; const px = sx-Math.cos(a)*rr, py = sy-Math.sin(a)*rr; g.beginPath(); g.arc(px,py,1.3,0,TAU); g.fill(); }
  g.fillStyle = c; g.beginPath(); g.arc(sx,sy,3,0,TAU); g.fill();
};

// V09 牆面被看見程度回映：多點取樣累計每段牆命中次數，依比例加粗上色
V[8] = function(g, W, H, r, c){
  const {x0,y0,x1,y1,segs,solids} = roomBox(W,H,r,.11, 3+((r()*3)|0), .05,.11);
  const cnt = new Array(segs.length).fill(0); const maxD = Math.hypot(W,H);
  const nx = 10, ny = 8;
  for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++){ const px = x0+(x1-x0)*(i+.5)/nx, py = y0+(y1-y0)*(j+.5)/ny; if(inside(px,py,solids)) continue;
    for(let a = 0; a < 48; a++){ const th = a/48*TAU, dx = Math.cos(th), dy = Math.sin(th); let best = maxD, bi = -1;
      segs.forEach((s,si) => { const t = raySeg(px,py,dx,dy,s); if(t>1e-6 && t<best){ best=t; bi=si; } });
      if(bi>=0) cnt[bi]++; } }
  const mxc = Math.max(...cnt, 1);
  g.fillStyle = "#101015"; g.fillRect(x0,y0,x1-x0,y1-y0);
  g.fillStyle = "#15151c"; solids.forEach(b => g.fillRect(b[0],b[1],b[2],b[3]));
  segs.forEach((s,i) => { const t = cnt[i]/mxc; g.strokeStyle = U.rgba(c, .25+.75*t); g.lineWidth = 1.4+t*7; g.lineCap = "round";
    g.beginPath(); g.moveTo(s[0],s[1]); g.lineTo(s[2],s[3]); g.stroke(); });
  segs.forEach((s,i) => { const t = cnt[i]/mxc; if(t>.75){ g.strokeStyle = "#fff"; g.lineWidth = 1; g.beginPath(); g.moveTo(s[0],s[1]); g.lineTo(s[2],s[3]); g.stroke(); } });
};

// V10 從 3D 量體切出視線高度的牆線：軸測量體 + 半透明剖切面 + 切出的可視域
V[9] = function(g, W, H, r, c){
  const P0 = (x,y,z) => [(x-y)*.87, (x+y)*.5-z*.62];
  const nB = 3+((r()*3)|0), blds = [];
  for(let i = 0; i < nB; i++){ blds.push({x:-3+r()*6-1, y:-2.5+r()*5-1, w:1+r()*1.6, d:1+r()*1.6, h:1.6+r()*3.6}); }
  const eye = 1.6;
  let mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;
  blds.forEach(b => { [[b.x,b.y,0],[b.x+b.w,b.y,0],[b.x,b.y+b.d,0],[b.x+b.w,b.y+b.d,0],[b.x,b.y,b.h],[b.x+b.w,b.y,b.h],[b.x,b.y+b.d,b.h],[b.x+b.w,b.y+b.d,b.h]].forEach(p => { const q = P0(...p); mnx=Math.min(mnx,q[0]);mxx=Math.max(mxx,q[0]);mny=Math.min(mny,q[1]);mxy=Math.max(mxy,q[1]); }); });
  const k = Math.min(W*.78/(mxx-mnx), H*.68/(mxy-mny)), ox = W/2-(mnx+mxx)/2*k, oy = H*.58-(mny+mxy)/2*k;
  const P = (x,y,z) => { const q = P0(x,y,z); return [ox+q[0]*k, oy+q[1]*k]; };
  blds.sort((a,b) => (b.x+b.y)-(a.x+a.y));
  const wallSegs = [];
  blds.forEach(b => {
    const top = h => [[b.x,b.y,h],[b.x+b.w,b.y,h],[b.x+b.w,b.y+b.d,h],[b.x,b.y+b.d,h]];
    const tb = top(b.h), bb = top(0);
    g.fillStyle = "rgba(28,28,36,.92)"; g.strokeStyle = U.rgba(c,.55); g.lineWidth = 1;
    [[0,1],[1,2],[2,3],[3,0]].forEach(([i,j]) => { U.poly(g, [P(...bb[i]),P(...bb[j]),P(...tb[j]),P(...tb[i])], true); g.fill(); g.stroke(); });
    U.poly(g, tb.map(p=>P(...p)), true); g.fillStyle = "rgba(40,40,50,.9)"; g.fill(); g.stroke();
    if(b.h > eye){ wallSegs.push([[b.x,b.y],[b.x+b.w,b.y]],[[b.x+b.w,b.y],[b.x+b.w,b.y+b.d]],[[b.x+b.w,b.y+b.d],[b.x,b.y+b.d]],[[b.x,b.y+b.d],[b.x,b.y]]); }
  });
  // 剖切面（半透明）
  let sx = -3.6, sy = -2.6, ex = 3.6, ey = 2.8;
  g.fillStyle = U.rgba(c, .1); U.poly(g, [P(sx,sy,eye),P(ex,sy,eye),P(ex,ey,eye),P(sx,ey,eye)], true); g.fill();
  g.strokeStyle = U.rgba(c, .5); g.lineWidth = 1; g.stroke();
  // 切出的牆線（畫在剖切高度）
  g.strokeStyle = "#fff"; g.lineWidth = 2;
  wallSegs.forEach(([a,b2]) => { g.beginPath(); g.moveTo(...P(a[0],a[1],eye)); g.lineTo(...P(b2[0],b2[1],eye)); g.stroke(); });
  // 觀察點與幾條可視射線（在切平面上簡化示意）
  const flat = []; wallSegs.forEach(([a,b2]) => flat.push([a[0],a[1],b2[0],b2[1]]));
  const vx = 0, vy = -2.2, maxD = 14; const iso = isovist(vx,vy, [...flat, [sx,sy,ex,sy],[ex,sy,ex,ey],[ex,ey,sx,ey],[sx,ey,sx,sy]], 60, maxD);
  g.strokeStyle = U.rgba("#FFD873", .5); g.lineWidth = 1; iso.pts.forEach((p,i) => { if(i%4) return; g.beginPath(); g.moveTo(...P(vx,vy,eye)); g.lineTo(...P(p[0],p[1],eye)); g.stroke(); });
  g.fillStyle = "#FFD873"; const vp = P(vx,vy,eye); g.beginPath(); g.arc(vp[0],vp[1],3.4,0,TAU); g.fill();
};

// V11 美術館問題：最少觀察點覆蓋——多個守衛的可視域疊加，不同記號標示各守衛
V[10] = function(g, W, H, r, c){
  const {x0,y0,x1,y1,segs,solids} = roomBox(W,H,r,.1, 4+((r()*3)|0), .05,.1);
  const nG = 3+((r()*2)|0), guards = []; const maxD = Math.hypot(W,H);
  for(let k = 0; k < nG; k++){ const [vx,vy] = pickViewer(x0,y0,x1,y1,solids,r); guards.push([vx,vy]); }
  g.fillStyle = "#101015"; g.fillRect(x0,y0,x1-x0,y1-y0);
  const shapes = ["circle","square","tri"];
  guards.forEach((p,gi) => { const iso = isovist(p[0],p[1],segs,72,maxD);
    g.fillStyle = U.rgba(c, .16); U.poly(g, iso.pts, true); g.fill();
    g.strokeStyle = U.rgba(c, .55); g.lineWidth = 1; U.poly(g, iso.pts, true); g.stroke(); });
  drawWalls(g, segs, solids);
  guards.forEach((p,gi) => { const sh = shapes[gi%3]; g.fillStyle = "#fff"; g.strokeStyle = c; g.lineWidth = 1.4;
    if(sh==="circle"){ g.beginPath(); g.arc(p[0],p[1],4.2,0,TAU); g.fill(); g.stroke(); }
    else if(sh==="square"){ g.fillRect(p[0]-4,p[1]-4,8,8); g.strokeRect(p[0]-4,p[1]-4,8,8); }
    else { g.beginPath(); g.moveTo(p[0],p[1]-5); g.lineTo(p[0]+5,p[1]+4); g.lineTo(p[0]-5,p[1]+4); g.closePath(); g.fill(); g.stroke(); } });
};

// V12 可視度地景：isovist 面積場轉成起伏實體（3D 列印分層外觀）
V[11] = function(g, W, H, r, c){
  const {x0,y0,x1,y1,segs,solids} = roomBox(W,H,r,.14, 3+((r()*2)|0), .05,.1);
  const n = 26, mm = Math.round(n*(y1-y0)/(x1-x0)), maxD = Math.hypot(W,H), val = new Float32Array(n*mm);
  let lo=1e18,hi=-1e18;
  for(let j = 0; j < mm; j++) for(let i = 0; i < n; i++){ const px = x0+(x1-x0)*(i+.5)/n, py = y0+(y1-y0)*(j+.5)/mm;
    if(inside(px,py,solids)){ val[j*n+i]=NaN; continue; } const iso = isovist(px,py,segs,36,maxD), a2 = isoArea(iso.pts); val[j*n+i]=a2; lo=Math.min(lo,a2); hi=Math.max(hi,a2); }
  const P0 = (u,v,h) => [(u-v)*.6, (u+v)*.34 - h*.52];
  let mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;
  for(let j=0;j<=mm;j++) for(let i=0;i<=n;i++){ const q=P0(i,j,1.4); mnx=Math.min(mnx,q[0]);mxx=Math.max(mxx,q[0]);mny=Math.min(mny,q[1]);mxy=Math.max(mxy,q[1]); }
  const k = Math.min(W*.76/(mxx-mnx), H*.64/(mxy-mny)), ox = W/2-(mnx+mxx)/2*k, oy = H*.58-(mny+mxy)/2*k;
  const P = (u,v,h) => { const q = P0(u,v,h); return [ox+q[0]*k, oy+q[1]*k]; };
  const hv = (i,j) => { const q = val[Math.max(0,Math.min(mm-1,j))*n+Math.max(0,Math.min(n-1,i))]; return isNaN(q) ? .04 : .1+.85*(q-lo)/((hi-lo)||1); };
  const cells = []; for(let i=0;i<n;i++) for(let j=0;j<mm;j++) cells.push([i,j]); cells.sort((A,B) => (B[1]-B[0])-(A[1]-A[0]));
  // 側裙（底座）
  g.fillStyle = "rgba(20,20,26,.95)";
  U.poly(g, [P(0,0,0),P(n,0,0),P(n,0,hv(n-1,0)*1.4),P(0,0,hv(0,0)*1.4)], true); g.fill();
  U.poly(g, [P(0,0,0),P(0,mm,0),P(0,mm,hv(0,mm-1)*1.4),P(0,0,hv(0,0)*1.4)], true); g.fill();
  for(const [i,j] of cells){ const a=hv(i,j)*1.4,b=hv(i+1,j)*1.4,cc=hv(i+1,j+1)*1.4,d=hv(i,j+1)*1.4, t=(a+b+cc+d)/4/1.4;
    U.poly(g, [P(i,j,a),P(i+1,j,b),P(i+1,j+1,cc),P(i,j+1,d)], true); g.fillStyle = U.rgba(c, .2+t*.7); g.fill();
    g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = .5; g.stroke(); }
  // 列印分層等高線
  for(let lv = .2; lv < 1.3; lv += .18){ const f = (i,j) => hv(i,j); const cs = U.contour(n,mm,f,lv);
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .7; g.beginPath();
    cs.forEach(([a,b]) => { const pa = P(a[0],a[1],f(Math.round(a[0]),Math.round(a[1]))*1.4+.4), pb = P(b[0],b[1],f(Math.round(b[0]),Math.round(b[1]))*1.4+.4); g.moveTo(pa[0],pa[1]); g.lineTo(pb[0],pb[1]); }); g.stroke(); }
};

ART.var["G01"] = V;

/* ================= 沒有照片的案例 ================= */

// G01-01 Batty：多指標並列比較（四宮格：面積／周長／緊湊度／最遠距離場）
ART.case["G01-01"] = function(g, W, H, r, c){
  const {x0:X0,y0:Y0,x1:X1,y1:Y1,segs,solids} = roomBox(W,H,r,.06, 6+((r()*3)|0), .035,.07);
  const gx = X0+(X1-X0)/2, gy = Y0+(Y1-Y0)/2, n = 26, mm = 20, maxD = Math.hypot(X1-X0,Y1-Y0);
  const metrics = [0,1,2,3]; // area, perimeter, compactness, maxdist
  const cellW = (X1-X0)/2-2, cellH = (Y1-Y0)/2-2;
  metrics.forEach((mi, idx) => {
    const cx0 = X0 + (idx%2)*(cellW+4), cy0 = Y0 + (idx<2?0:1)*(cellH+4);
    const off = document.createElement("canvas"); off.width = n; off.height = mm; const og = off.getContext("2d"), img = og.createImageData(n,mm);
    const vals = new Float32Array(n*mm); let lo=1e18,hi=-1e18;
    for(let j=0;j<mm;j++) for(let i=0;i<n;i++){ const px = cx0+cellW*(i+.5)/n, py = cy0+cellH*(j+.5)/mm;
      if(inside(px,py,solids)){ vals[j*n+i]=NaN; continue; }
      const iso = isovist(px,py,segs,48,maxD); let v;
      if(mi===0) v = isoArea(iso.pts);
      else if(mi===1){ v=0; for(let q=0;q<iso.pts.length;q++){ const a=iso.pts[q], b=iso.pts[(q+1)%iso.pts.length]; v+=Math.hypot(b[0]-a[0],b[1]-a[1]); } }
      else if(mi===2){ let per=0; for(let q=0;q<iso.pts.length;q++){ const a=iso.pts[q], b=iso.pts[(q+1)%iso.pts.length]; per+=Math.hypot(b[0]-a[0],b[1]-a[1]); } const ar=isoArea(iso.pts); v = per>0 ? 4*Math.PI*ar/(per*per) : 0; }
      else { v = Math.max(...iso.dist); }
      vals[j*n+i]=v; if(!isNaN(v)){ lo=Math.min(lo,v); hi=Math.max(hi,v); } }
    const [R,G,B] = U.rgb(c);
    for(let j=0;j<mm;j++) for(let i=0;i<n;i++){ const v=vals[j*n+i], k=(j*n+i)*4; if(isNaN(v)){ img.data[k+3]=0; continue; }
      const t = (v-lo)/((hi-lo)||1); img.data[k]=21+(R-21)*t; img.data[k+1]=21+(G-21)*t; img.data[k+2]=27+(B-27)*t; img.data[k+3]=235; }
    og.putImageData(img,0,0); g.imageSmoothingEnabled = true; g.drawImage(off, cx0,cy0, cellW,cellH);
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(cx0+.5,cy0+.5,cellW-1,cellH-1);
  });
  g.fillStyle = "#15151c"; solids.forEach(b => {}); // 建築量體已含在各宮格計算中，畫面保持乾淨不重複描邊
};
ART.case["G01-01"].ratio = 1;

// G01-02 Turner et al：可見性圖，標出決策點（低群聚係數）
ART.case["G01-02"] = function(g, W, H, r, c){
  const {x0,y0,x1,y1,segs,solids} = roomBox(W,H,r,.1, 4+((r()*3)|0), .05,.1);
  const nx = 9, ny = 7, nodes = [];
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){ const px = x0+(x1-x0)*(i+.5)/nx, py = y0+(y1-y0)*(j+.5)/ny; if(!inside(px,py,solids)) nodes.push([px,py]); }
  const N = nodes.length, adj = Array.from({length:N}, () => []);
  for(let a=0;a<N;a++) for(let b=a+1;b<N;b++){ const [ax,ay]=nodes[a], [bx,by]=nodes[b], d=Math.hypot(bx-ax,by-ay); let vis=true;
    for(const s of segs){ const t = raySeg(ax,ay,(bx-ax)/d,(by-ay)/d,s); if(t>1e-6 && t<d-1e-6){ vis=false; break; } } if(vis){ adj[a].push(b); adj[b].push(a); } }
  const clus = adj.map((nb,i) => { if(nb.length<2) return 1; let e=0; for(let x=0;x<nb.length;x++) for(let y=x+1;y<nb.length;y++) if(adj[nb[x]].includes(nb[y])) e++; return e/(nb.length*(nb.length-1)/2); });
  drawWalls(g, segs, solids, U.rgba("#ffffff", .5), 1.6);
  g.lineWidth = .6;
  for(let a=0;a<N;a++) adj[a].forEach(b => { if(b>a){ g.strokeStyle = U.rgba(c, .18); g.beginPath(); g.moveTo(...nodes[a]); g.lineTo(...nodes[b]); g.stroke(); } });
  let mind = 0; for(let i=1;i<N;i++) if(clus[i]<clus[mind]) mind = i;
  nodes.forEach((p,i) => { g.fillStyle = i===mind ? "#FFD873" : U.rgba(c, .4+.5*clus[i]); g.beginPath(); g.arc(p[0],p[1], i===mind?6:3, 0, TAU); g.fill();
    if(i===mind){ g.strokeStyle="#fff"; g.lineWidth=1.4; g.stroke(); } });
};
ART.case["G01-02"].ratio = .95;

// G01-03 DeCodingSpaces：場（左）＋立面回映（右）兩欄
ART.case["G01-03"] = function(g, W, H, r, c){
  const half = W*.52;
  // 左：庭園式場
  const segsL = [], solidsL = [], mL = Math.min(half,H)*.12, x0 = mL, y0 = mL, x1 = half-mL, y1 = H-mL;
  segsL.push([x0,y0,x1,y0],[x1,y0,x1,y1],[x1,y1,x0,y1],[x0,y1,x0,y0]);
  for(let k=0;k<7;k++){ const cx=x0+(x1-x0)*r(), cy=y0+(y1-y0)*r(), a=r()*Math.PI, L=Math.min(half,H)*(.08+r()*.14);
    segsL.push([cx-Math.cos(a)*L/2, cy-Math.sin(a)*L/2, cx+Math.cos(a)*L/2, cy+Math.sin(a)*L/2]); }
  const n=30, mm=Math.round(n*(y1-y0)/(x1-x0)), maxD=Math.hypot(x1-x0,y1-y0), off=document.createElement("canvas"); off.width=n;off.height=mm; const og=off.getContext("2d"), img=og.createImageData(n,mm);
  const [R,G,B]=U.rgb(c); let lo=1e18,hi=-1e18; const vv=new Float32Array(n*mm);
  for(let j=0;j<mm;j++) for(let i=0;i<n;i++){ const px=x0+(x1-x0)*(i+.5)/n, py=y0+(y1-y0)*(j+.5)/mm; const iso=isovist(px,py,segsL,40,maxD); const a2=isoArea(iso.pts); vv[j*n+i]=a2; lo=Math.min(lo,a2);hi=Math.max(hi,a2); }
  for(let j=0;j<mm;j++) for(let i=0;i<n;i++){ const t=(vv[j*n+i]-lo)/((hi-lo)||1), k=(j*n+i)*4; img.data[k]=21+(R-21)*t;img.data[k+1]=21+(G-21)*t;img.data[k+2]=27+(B-27)*t;img.data[k+3]=230; }
  og.putImageData(img,0,0); g.imageSmoothingEnabled=true; g.drawImage(off,x0,y0,x1-x0,y1-y0);
  g.strokeStyle="#fff"; g.lineWidth=1.6; segsL.slice(4).forEach(s => { g.beginPath(); g.moveTo(s[0],s[1]); g.lineTo(s[2],s[3]); g.stroke(); });
  g.strokeStyle=U.rgba("#ffffff",.7); g.lineWidth=1.4; segsL.slice(0,4).forEach(s => { g.beginPath(); g.moveTo(s[0],s[1]); g.lineTo(s[2],s[3]); g.stroke(); });
  // 右：立面被看見程度（長條）
  const bx0 = half+8, bx1 = W-mL, by0 = mL, by1 = H-mL, nBars = 9;
  g.strokeStyle = U.rgba("#ffffff",.15); g.strokeRect(bx0+.5,by0+.5,bx1-bx0-1,by1-by0-1);
  for(let k=0;k<nBars;k++){ const t = .15+.8*Math.abs(Math.sin(k*1.3+r()*3)); const bw=(bx1-bx0-8)/nBars;
    g.fillStyle = U.rgba(c, .25+.65*t); g.fillRect(bx0+4+k*bw, by1-4-(by1-by0-10)*t, bw*.72, (by1-by0-10)*t); }
};
ART.case["G01-03"].ratio = .85;

// G01-04 豫園：曲折園路 + 開合節奏折線圖
ART.case["G01-04"] = function(g, W, H, r, c){
  const m = Math.min(W,H)*.08, x0=m,y0=m,x1=W-m,y1=H*.66;
  const walls = []; const rocks = [];
  for(let k=0;k<10;k++){ const cx=x0+(x1-x0)*r(), cy=y0+(y1-y0)*r(), a=r()*Math.PI, L=Math.min(W,H)*(.06+r()*.13);
    walls.push([cx-Math.cos(a)*L/2, cy-Math.sin(a)*L/2, cx+Math.cos(a)*L/2, cy+Math.sin(a)*L/2]); }
  for(let k=0;k<4;k++) rocks.push([x0+(x1-x0)*(.1+r()*.8), y0+(y1-y0)*(.1+r()*.8), Math.min(W,H)*(.02+r()*.03)]);
  const N = 9, path = []; for(let i=0;i<N;i++){ const t=i/(N-1); path.push([x0+(x1-x0)*t, y0+(y1-y0)*(.5+.32*Math.sin(t*Math.PI*2.3+r()))]); }
  const areas = path.map(p => isoArea(isovist(p[0],p[1], walls.concat([[x0,y0,x1,y0],[x1,y0,x1,y1],[x1,y1,x0,y1],[x0,y1,x0,y0]]), 36, Math.hypot(x1-x0,y1-y0)).pts));
  const mxA = Math.max(...areas);
  g.strokeStyle = U.rgba("#ffffff",.4); g.lineWidth = 1.6; walls.forEach(s => { g.beginPath(); g.moveTo(s[0],s[1]); g.lineTo(s[2],s[3]); g.stroke(); });
  g.fillStyle = "#2b2b34"; rocks.forEach(([rx,ry,rr]) => { g.beginPath(); g.arc(rx,ry,rr,0,TAU); g.fill(); });
  g.strokeStyle = U.rgba(c,.7); g.lineWidth = 1.8; g.setLineDash([1,5]); U.poly(g, path); g.stroke(); g.setLineDash([]);
  path.forEach((p,i) => { g.fillStyle = i===0||i===N-1 ? "#fff" : c; g.beginPath(); g.arc(p[0],p[1], 2.6+3*(areas[i]/mxA), 0, TAU); g.fill(); });
  const cy0 = H*.76, cy1 = H-m*.6;
  g.strokeStyle = U.rgba("#ffffff",.12); g.beginPath(); g.moveTo(x0,cy1); g.lineTo(x1,cy1); g.stroke();
  g.beginPath(); areas.forEach((a,i) => { const px=x0+(x1-x0)*i/(N-1), py=cy1-(cy1-cy0)*(a/mxA); i?g.lineTo(px,py):g.moveTo(px,py); });
  g.strokeStyle = c; g.lineWidth = 2; g.stroke();
};
ART.case["G01-04"].ratio = .95;

// G01-05 Wright 織物磚住宅：展望（遠射線）與庇護（近距比例）雙色場
ART.case["G01-05"] = function(g, W, H, r, c){
  const {x0,y0,x1,y1,segs,solids} = roomBox(W,H,r,.1, 5+((r()*3)|0), .04,.09);
  const n=28, mm=Math.round(n*(y1-y0)/(x1-x0)), maxD=Math.hypot(x1-x0,y1-y0);
  const off=document.createElement("canvas"); off.width=n;off.height=mm; const og=off.getContext("2d"), img=og.createImageData(n,mm);
  for(let j=0;j<mm;j++) for(let i=0;i<n;i++){ const px=x0+(x1-x0)*(i+.5)/n, py=y0+(y1-y0)*(j+.5)/mm, k=(j*n+i)*4;
    if(inside(px,py,solids)){ img.data[k+3]=0; continue; }
    const iso = isovist(px,py,segs,48,maxD); const prospect = Math.max(...iso.dist)/maxD; const refuge = iso.dist.filter(d=>d<maxD*.18).length/iso.dist.length;
    img.data[k] = 40+215*refuge; img.data[k+1] = 40+150*prospect*(1-refuge)+40*refuge; img.data[k+2] = 60+140*prospect; img.data[k+3] = 210; }
  og.putImageData(img,0,0); g.imageSmoothingEnabled = true; g.drawImage(off, x0,y0, x1-x0,y1-y0);
  drawWalls(g, segs, solids);
};
ART.case["G01-05"].ratio = .9;

// G01-06 Morello & Ratti：新舊都市量體視野差異場（差值以第二色標出）
ART.case["G01-06"] = function(g, W, H, r, c){
  const m = Math.min(W,H)*.08, x0=m,y0=m,x1=W-m,y1=H-m;
  const cols = 5, rows = 4, cw=(x1-x0)/cols, rh=(y1-y0)/rows, bldA=[], bldB=[];
  for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){ if(r()<.2) continue; const st=.2+r()*.1; bldA.push([x0+i*cw+cw*st/2, y0+j*rh+rh*st/2, cw*(1-st), rh*(1-st)]); }
  bldB.push(...bldA);
  const ni=2+((r()*2)|0); for(let k=0;k<ni;k++){ const st=.15; bldB.push([x0+(x1-x0)*(.2+r()*.5), y0+(y1-y0)*(.2+r()*.5), cw*1.5, rh*1.5]); }
  const segsOf = (B) => { const s=[]; B.forEach(b => s.push(...boxSegs(b))); return s; };
  const sA = segsOf(bldA), sB = segsOf(bldB); const n=26, mm=20, maxD=Math.hypot(x1-x0,y1-y0);
  const off=document.createElement("canvas"); off.width=n;off.height=mm; const og=off.getContext("2d"), img=og.createImageData(n,mm);
  for(let j=0;j<mm;j++) for(let i=0;i<n;i++){ const px=x0+(x1-x0)*(i+.5)/n, py=y0+(y1-y0)*(j+.5)/mm, k=(j*n+i)*4;
    if(inside(px,py,bldB)){ img.data[k+3]=0; continue; }
    const aA = isoArea(isovist(px,py,sA,28,maxD).pts), aB = isoArea(isovist(px,py,sB,28,maxD).pts), diff = Math.max(0,(aA-aB))/(maxD*maxD*.5);
    if(diff>.02){ img.data[k]=255; img.data[k+1]=120-diff*60; img.data[k+2]=90; img.data[k+3]=90+diff*300; } else img.data[k+3]=0; }
  og.putImageData(img,0,0);
  g.fillStyle = "#101015"; g.fillRect(x0,y0,x1-x0,y1-y0);
  g.fillStyle = "rgba(255,255,255,.05)"; bldA.forEach(b => g.fillRect(...b));
  g.imageSmoothingEnabled = true; g.drawImage(off, x0,y0, x1-x0, y1-y0);
  g.fillStyle = "#15151c"; bldA.forEach(b => g.fillRect(...b));
  g.strokeStyle = U.rgba(c,.6); g.lineWidth = 1; bldA.forEach(b => g.strokeRect(...b));
  g.strokeStyle = "#fff"; g.lineWidth = 1.6; bldB.slice(bldA.length).forEach(b => g.strokeRect(...b));
};
ART.case["G01-06"].ratio = .85;

// G01-07 SYNTACTIC Isovist Bubble：虛線原多邊形 → 縮放至固定面積的實心泡泡
ART.case["G01-07"] = function(g, W, H, r, c){
  const {x0,y0,x1,y1,segs,solids} = roomBox(W,H,r,.12, 4+((r()*3)|0), .05,.11);
  const [vx,vy] = pickViewer(x0,y0,x1,y1,solids,r), maxD = Math.hypot(x1-x0,y1-y0);
  const iso = isovist(vx,vy,segs,60,maxD), full = isoArea(iso.pts), target = full*(.32+r()*.18);
  let lo=0, hi=1; for(let it=0; it<24; it++){ const mid=(lo+hi)/2, pts = iso.pts.map(p => [vx+(p[0]-vx)*mid, vy+(p[1]-vy)*mid]); if(isoArea(pts) < target) lo=mid; else hi=mid; }
  const sc = (lo+hi)/2, bubble = iso.pts.map(p => [vx+(p[0]-vx)*sc, vy+(p[1]-vy)*sc]);
  drawWalls(g, segs, solids, U.rgba("#ffffff", .5), 1.4);
  g.strokeStyle = U.rgba("#ffffff", .3); g.lineWidth = 1; g.setLineDash([3,3]); U.poly(g, iso.pts, true); g.stroke(); g.setLineDash([]);
  g.fillStyle = U.rgba(c, .4); U.poly(g, bubble, true); g.fill();
  g.strokeStyle = c; g.lineWidth = 2; U.poly(g, bubble, true); g.stroke();
  eyeDot(g, vx, vy, "#fff", 3.6);
};
ART.case["G01-07"].ratio = 1;

// G01-51 Red Blob Games：掃描線三角扇 + 遊戲角色剪影
ART.case["G01-51"] = function(g, W, H, r, c){
  const {x0,y0,x1,y1,segs,solids} = roomBox(W,H,r,.1, 4+((r()*3)|0), .05,.1);
  const [vx,vy] = pickViewer(x0,y0,x1,y1,solids,r), maxD = Math.hypot(x1-x0,y1-y0), eps=3e-3, angs=[];
  segs.forEach(s => { [[s[0],s[1]],[s[2],s[3]]].forEach(p => { const a=Math.atan2(p[1]-vy,p[0]-vx); angs.push(a-eps,a,a+eps); }); });
  angs.sort((a,b)=>a-b);
  const pts = angs.map(a => { const dx=Math.cos(a), dy=Math.sin(a); let best=maxD; for(const s of segs){ const t=raySeg(vx,vy,dx,dy,s); if(t>1e-6&&t<best) best=t; } return [vx+dx*best, vy+dy*best]; });
  for(let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; g.fillStyle = i%2 ? U.rgba(c,.22) : U.rgba(c,.34);
    g.beginPath(); g.moveTo(vx,vy); g.lineTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.closePath(); g.fill(); g.strokeStyle=U.rgba("#ffffff",.08); g.lineWidth=.5; g.stroke(); }
  drawWalls(g, segs, solids, U.rgba("#ffffff", .8), 1.8);
  // 角色剪影
  g.fillStyle = "#fff"; g.beginPath(); g.arc(vx,vy-7,4,0,TAU); g.fill(); g.beginPath(); g.moveTo(vx-5,vy+8); g.lineTo(vx+5,vy+8); g.lineTo(vx+3.4,vy-3); g.lineTo(vx-3.4,vy-3); g.closePath(); g.fill();
};
ART.case["G01-51"].ratio = .95;

// G01-52 Nicky Case：柔和陰影光影（暖光 + 多重偏移疊影）
ART.case["G01-52"] = function(g, W, H, r, c){
  const {x0,y0,x1,y1,segs,solids} = roomBox(W,H,r,.1, 4+((r()*3)|0), .05,.12);
  const [vx,vy] = pickViewer(x0,y0,x1,y1,solids,r), maxD = Math.hypot(x1-x0,y1-y0);
  g.fillStyle = "#0c0c10"; g.fillRect(x0,y0,x1-x0,y1-y0);
  const K = 9, R2 = 6;
  for(let k = 0; k < K; k++){ const ox2 = (r()-.5)*R2*2, oy2 = (r()-.5)*R2*2, iso = isovist(vx+ox2, vy+oy2, segs, 70, maxD);
    g.fillStyle = "rgba(255,224,160,.05)"; U.poly(g, iso.pts, true); g.fill(); }
  const iso0 = isovist(vx,vy,segs,90,maxD);
  const grd = g.createRadialGradient(vx,vy,4, vx,vy, Math.max(...iso0.dist));
  grd.addColorStop(0,"rgba(255,232,180,.55)"); grd.addColorStop(1,"rgba(255,232,180,0)");
  g.fillStyle = grd; U.poly(g, iso0.pts, true); g.fill();
  g.strokeStyle = U.rgba("#ffffff",.5); g.lineWidth = 1.6;
  segs.forEach(s => { g.beginPath(); g.moveTo(s[0],s[1]); g.lineTo(s[2],s[3]); g.stroke(); });
  g.fillStyle = "#101015"; solids.forEach(b => g.fillRect(b[0],b[1],b[2],b[3]));
  g.fillStyle = "#FFECAA"; g.beginPath(); g.arc(vx,vy,3.6,0,TAU); g.fill();
};
ART.case["G01-52"].ratio = 1;

// G01-53 Coding Train：p5.js 網格風格，光點沿路徑移動、射線細密
ART.case["G01-53"] = function(g, W, H, r, c){
  const m = Math.min(W,H)*.08, x0=m,y0=m,x1=W-m,y1=H-m;
  g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 1;
  for(let x=x0; x<=x1; x+=(x1-x0)/10){ g.beginPath(); g.moveTo(x,y0); g.lineTo(x,y1); g.stroke(); }
  for(let y=y0; y<=y1; y+=(y1-y0)/8){ g.beginPath(); g.moveTo(x0,y); g.lineTo(x1,y); g.stroke(); }
  const nW = 5+((r()*4)|0), segs = [[x0,y0,x1,y0],[x1,y0,x1,y1],[x1,y1,x0,y1],[x0,y1,x0,y0]];
  for(let k=0;k<nW;k++){ const ax=x0+(x1-x0)*r(), ay=y0+(y1-y0)*r(), a=r()*Math.PI, L=Math.min(W,H)*(.08+r()*.14);
    segs.push([ax-Math.cos(a)*L/2, ay-Math.sin(a)*L/2, ax+Math.cos(a)*L/2, ay+Math.sin(a)*L/2]); }
  const vx = x0+(x1-x0)*(.3+r()*.4), vy = y0+(y1-y0)*(.3+r()*.4), maxD = Math.hypot(x1-x0,y1-y0);
  const nR = 110; g.strokeStyle = U.rgba(c,.32); g.lineWidth = .6;
  for(let i=0;i<nR;i++){ const a=i/nR*TAU, dx=Math.cos(a),dy=Math.sin(a); let best=maxD; for(const s of segs){ const t=raySeg(vx,vy,dx,dy,s); if(t>1e-6&&t<best) best=t; }
    g.beginPath(); g.moveTo(vx,vy); g.lineTo(vx+dx*best, vy+dy*best); g.stroke(); }
  g.strokeStyle = "#fff"; g.lineWidth = 1.6; segs.slice(4).forEach(s => { g.beginPath(); g.moveTo(s[0],s[1]); g.lineTo(s[2],s[3]); g.stroke(); });
  g.strokeStyle = U.rgba("#ffffff",.6); segs.slice(0,4).forEach(s => { g.beginPath(); g.moveTo(s[0],s[1]); g.lineTo(s[2],s[3]); g.stroke(); });
  g.fillStyle = "#fff"; g.beginPath(); g.arc(vx,vy,4,0,TAU); g.fill(); g.strokeStyle = c; g.lineWidth = 1.4; g.stroke();
};
ART.case["G01-53"].ratio = .9;

// G01-54 Houdini：等角取樣（灰）vs 端點取樣（家族色）疊圖比較 + 節點格網底
ART.case["G01-54"] = function(g, W, H, r, c){
  const {x0,y0,x1,y1,segs,solids} = roomBox(W,H,r,.11, 4+((r()*3)|0), .05,.1);
  const [vx,vy] = pickViewer(x0,y0,x1,y1,solids,r), maxD = Math.hypot(x1-x0,y1-y0);
  g.strokeStyle = "rgba(255,255,255,.04)"; g.lineWidth = 1;
  for(let i=0;i<=8;i++){ const x=x0+(x1-x0)*i/8; g.beginPath(); g.moveTo(x,y0); g.lineTo(x,y1); g.stroke(); }
  for(let j=0;j<=6;j++){ const y=y0+(y1-y0)*j/6; g.beginPath(); g.moveTo(x0,y); g.lineTo(x1,y); g.stroke(); }
  const isoCirc = isovist(vx,vy,segs,36,maxD);
  g.strokeStyle = U.rgba("#ffffff",.55); g.lineWidth = 1.4; U.poly(g, isoCirc.pts, true); g.stroke();
  const eps=3e-3, angs=[]; segs.forEach(s => { [[s[0],s[1]],[s[2],s[3]]].forEach(p => { const a=Math.atan2(p[1]-vy,p[0]-vx); angs.push(a-eps,a,a+eps); }); }); angs.sort((a,b)=>a-b);
  const pts = angs.map(a => { const dx=Math.cos(a),dy=Math.sin(a); let best=maxD; for(const s of segs){ const t=raySeg(vx,vy,dx,dy,s); if(t>1e-6&&t<best) best=t; } return [vx+dx*best, vy+dy*best]; });
  g.fillStyle = U.rgba(c,.28); U.poly(g, pts, true); g.fill();
  g.strokeStyle = c; g.lineWidth = 1.8; U.poly(g, pts, true); g.stroke();
  drawWalls(g, segs, solids);
  eyeDot(g, vx, vy, "#fff", 3.6);
};
ART.case["G01-54"].ratio = .95;

// G01-55 visibility-polygon-js：交錯線段先打斷（交點標紅點）再求可視多邊形
ART.case["G01-55"] = function(g, W, H, r, c){
  const m = Math.min(W,H)*.11, x0=m,y0=m,x1=W-m,y1=H-m;
  const raw = []; const nL = 6+((r()*4)|0);
  for(let k=0;k<nL;k++){ const ax=x0+(x1-x0)*r(), ay=y0+(y1-y0)*r(), a=r()*Math.PI, L=Math.min(W,H)*(.14+r()*.16);
    raw.push([ax-Math.cos(a)*L/2, ay-Math.sin(a)*L/2, ax+Math.cos(a)*L/2, ay+Math.sin(a)*L/2]); }
  const bnd = [[x0,y0,x1,y0],[x1,y0,x1,y1],[x1,y1,x0,y1],[x0,y1,x0,y0]];
  const inter = [];
  for(let i=0;i<raw.length;i++) for(let j=i+1;j<raw.length;j++){ const a=raw[i], b=raw[j];
    const den = (a[2]-a[0])*(b[3]-b[1]) - (a[3]-a[1])*(b[2]-b[0]); if(Math.abs(den)<1e-9) continue;
    const t = ((b[0]-a[0])*(b[3]-b[1]) - (b[1]-a[1])*(b[2]-b[0]))/den, u = ((b[0]-a[0])*(a[3]-a[1]) - (b[1]-a[1])*(a[2]-a[0]))/den;
    if(t>0&&t<1&&u>0&&u<1) inter.push([a[0]+t*(a[2]-a[0]), a[1]+t*(a[3]-a[1])]); }
  const segs = bnd.concat(raw);
  const vx = x0+(x1-x0)*(.5+(r()-.5)*.3), vy = y0+(y1-y0)*(.5+(r()-.5)*.3), maxD = Math.hypot(x1-x0,y1-y0);
  const iso = isovist(vx,vy,segs,80,maxD);
  g.fillStyle = U.rgba(c,.22); U.poly(g, iso.pts, true); g.fill();
  g.strokeStyle = c; g.lineWidth = 1.6; U.poly(g, iso.pts, true); g.stroke();
  g.strokeStyle = U.rgba("#ffffff",.7); g.lineWidth = 1.4; raw.forEach(s => { g.beginPath(); g.moveTo(s[0],s[1]); g.lineTo(s[2],s[3]); g.stroke(); });
  g.strokeStyle = U.rgba("#ffffff",.85); g.lineWidth = 1.8; bnd.forEach(s => { g.beginPath(); g.moveTo(s[0],s[1]); g.lineTo(s[2],s[3]); g.stroke(); });
  g.fillStyle = "#ff5b5b"; inter.forEach(p => { g.beginPath(); g.arc(p[0],p[1],2.6,0,TAU); g.fill(); });
  eyeDot(g, vx, vy, "#fff", 3.6);
};
ART.case["G01-55"].ratio = 1.05;

})();
