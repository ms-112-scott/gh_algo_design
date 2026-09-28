/* C05 Marching Squares（等值線）：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
const TAU = Math.PI*2;
const COOL = "#8FB6FF";   // 第二色：負電荷、冷鋒、內部等少量點綴

/* ---------- 共用小工具 ---------- */
// 家族色明暗：k<1 變暗、k>1 往白色推
function sh(c, k, a){ const [R,G,B] = U.rgb(c), f = v => Math.round(k >= 1 ? v + (255-v)*Math.min(1,k-1) : v*k); return `rgba(${f(R)},${f(G)},${f(B)},${a == null ? 1 : a})`; }
function mixc(p, q, t){ t = Math.max(0, Math.min(1, t)); return [p[0]+(q[0]-p[0])*t, p[1]+(q[1]-p[1])*t, p[2]+(q[2]-p[2])*t]; }
// 分形雜訊（0–1）
function fbm(nz, x, y, o){ let s = 0, a = .5, f = 1, t = 0; for(let i = 0; i < (o||4); i++){ s += nz(x*f, y*f)*a; t += a; a *= .5; f *= 2; } return s/t; }
// metaball 場：B = [[x, y, R, 權重]]
function meta(B){ return (x,y) => { let s = 0; for(const b of B){ const dx = x-b[0], dy = y-b[1]; s += (b[3] == null ? 1 : b[3])*b[2]*b[2]/(dx*dx + dy*dy + .5); } return s; }; }
// 把函式預先取樣成格點，回傳 f(i,j)
function grid(n, m, fn){ const a = new Float32Array(n*m); for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) a[j*n+i] = fn(i,j); return (i,j) => a[j*n+i]; }
// 畫一條等值線：T 把格點座標轉成畫面座標
function iso(g, n, m, f, lv, T){ const s = U.contour(n, m, f, lv); g.beginPath(); for(const [a,b] of s){ const p = T(a[0],a[1]), q = T(b[0],b[1]); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); } g.stroke(); return s; }
// 逐像素上色：fn(u,v) 回傳 [r,g,b,a] 或 null（u,v 為 0–1）
function tex(n, m, fn){ const off = document.createElement("canvas"); off.width = n; off.height = m; const x = off.getContext("2d"), img = x.createImageData(n, m), d = img.data;
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const col = fn((i+.5)/n, (j+.5)/m); if(!col) continue; const k = (j*n+i)*4; d[k] = col[0]; d[k+1] = col[1]; d[k+2] = col[2]; d[k+3] = col[3] == null ? 255 : col[3]; }
  x.putImageData(img, 0, 0); return off; }
function paint(g, x, y, w, h, res, fn){ const off = tex(Math.max(2, Math.round(w/res)), Math.max(2, Math.round(h/res)), fn); g.imageSmoothingEnabled = true; g.drawImage(off, x, y, w, h); }
function inPoly(x, y, P){ let o = false; for(let i = 0, j = P.length-1; i < P.length; j = i++){ const [xi,yi] = P[i], [xj,yj] = P[j]; if((yi > y) !== (yj > y) && x < (xj-xi)*(y-yi)/(yj-yi) + xi) o = !o; } return o; }
function pl(g, pts, close){ U.poly(g, pts, close); }
// 等角投影（z 往上）
function isoP(ox, oy, u){ return (x,y,z) => [ox + (x-y)*u*.866, oy + (x+y)*u*.5 - z*u]; }
function cube(g, P, x, y, z, s, top, left, right, line){
  const q = (...p) => { g.beginPath(); p.forEach((v,i) => i ? g.lineTo(v[0],v[1]) : g.moveTo(v[0],v[1])); g.closePath(); };
  q(P(x+s,y,z), P(x+s,y+s,z), P(x+s,y+s,z+s), P(x+s,y,z+s)); g.fillStyle = right; g.fill(); if(line){ g.strokeStyle = line; g.stroke(); }
  q(P(x,y+s,z), P(x+s,y+s,z), P(x+s,y+s,z+s), P(x,y+s,z+s)); g.fillStyle = left; g.fill(); if(line){ g.strokeStyle = line; g.stroke(); }
  q(P(x,y,z+s), P(x+s,y,z+s), P(x+s,y+s,z+s), P(x,y+s,z+s)); g.fillStyle = top; g.fill(); if(line){ g.strokeStyle = line; g.stroke(); }
}
// 3D metaball 光線步進：hit(sx,sy) → {n:[法向量], k:最近球序號} 或 null；proj(p) → 畫面座標（單位長）
function blob3(B, lv, yaw, pit){
  const ca = Math.cos(yaw), sa = Math.sin(yaw), cb = Math.cos(pit), sb = Math.sin(pit);
  const R = [-sa, ca, 0], D = [cb*ca, cb*sa, -sb], Up = [D[1]*R[2]-D[2]*R[1], D[2]*R[0]-D[0]*R[2], D[0]*R[1]-D[1]*R[0]];
  const F = (x,y,z) => { let s = 0; for(const b of B){ const dx = x-b[0], dy = y-b[1], dz = z-b[2]; s += b[3]*b[3]/(dx*dx+dy*dy+dz*dz+1e-4); } return s; };
  const proj = p => [p[0]*R[0]+p[1]*R[1]+p[2]*R[2], p[0]*Up[0]+p[1]*Up[1]+p[2]*Up[2]];
  const PB = B.map(b => proj(b));
  const hit = (sx, sy) => {
    let near = false; for(let i = 0; i < B.length; i++){ const dx = sx-PB[i][0], dy = sy-PB[i][1]; if(dx*dx+dy*dy < B[i][3]*B[i][3]*12){ near = true; break; } }
    if(!near) return null;
    const o = [sx*R[0]+sy*Up[0], sx*R[1]+sy*Up[1], sx*R[2]+sy*Up[2]], st = .06;
    for(let t = -3; t < 3; t += st){
      if(F(o[0]+D[0]*t, o[1]+D[1]*t, o[2]+D[2]*t) > lv){
        let a = t-st, b = t; for(let k = 0; k < 5; k++){ const m = (a+b)/2; if(F(o[0]+D[0]*m, o[1]+D[1]*m, o[2]+D[2]*m) > lv) b = m; else a = m; }
        const p = [o[0]+D[0]*b, o[1]+D[1]*b, o[2]+D[2]*b]; let nx = 0, ny = 0, nz = 0, best = 0, bk = 0;
        B.forEach((q,i) => { const dx = p[0]-q[0], dy = p[1]-q[1], dz = p[2]-q[2], d2 = dx*dx+dy*dy+dz*dz+1e-4, w = q[3]*q[3]/(d2*d2); nx += w*dx; ny += w*dy; nz += w*dz; if(w*d2 > best){ best = w*d2; bk = i; } });
        const l = Math.hypot(nx,ny,nz) || 1; return {n:[nx/l, ny/l, nz/l], k:bk, p};
      }
    }
    return null;
  };
  return {hit, proj, D};
}

/* ================= 變形 ================= */
ART.var["C05"] = [
  // V01 換場函數：三聯畫——雜訊斑紋｜到曲線的距離｜正弦波干涉
  function(g, W, H, r, c){
    const pw = (W-24)/3, nz = U.vnoise((r()*1e9)|0), ph = H-24, y0 = 12;
    for(let p = 0; p < 3; p++){
      const x0 = 6 + p*(pw+6), n = 28, S = pw/(n-1), m = Math.floor(ph/S)+1, T = (i,j) => [x0 + i*S, y0 + j*S];
      g.save(); g.beginPath(); g.rect(x0, y0, pw, ph); g.clip();
      if(p === 0){ // 雜訊：有機斑紋
        const ox = r()*40, f = grid(n, m, (i,j) => fbm(nz, ox + i*.16, j*.16, 3));
        paint(g, x0, y0, pw, ph, 3, (u,v) => fbm(nz, ox + u*(pw/S)*.16, v*(ph/S)*.16, 3) > .55 ? [...U.rgb(c), 70] : null);
        g.lineWidth = 1.1; [.4,.48,.55,.62].forEach((lv,k) => { g.strokeStyle = sh(c, .6 + k*.25, .9); iso(g, n, m, f, lv, T); });
      } else if(p === 1){ // 到曲線的距離：等距偏移
        const ph0 = r()*6, cv = [...Array(40)].map((_,k) => [n/2 + (n*.28)*Math.sin(k/39*Math.PI*2.4 + ph0), k/39*(m-1)]);
        const f = grid(n, m, (i,j) => { let d = 1e9; for(let k = 1; k < cv.length; k++){ const [ax,ay] = cv[k-1], [bx,by] = cv[k], vx = bx-ax, vy = by-ay, t = Math.max(0, Math.min(1, ((i-ax)*vx + (j-ay)*vy)/(vx*vx+vy*vy))); d = Math.min(d, Math.hypot(i-ax-vx*t, j-ay-vy*t)); } return d; });
        g.lineWidth = 1; for(let k = 1; k < 9; k++){ g.strokeStyle = sh(c, 1.3 - k*.08, 1 - k*.09); iso(g, n, m, f, k*1.6, T); }
        g.strokeStyle = "#fff"; g.lineWidth = 2; pl(g, cv.map(p => T(p[0], p[1]))); g.stroke();
      } else { // 正弦波疊加：干涉波紋
        const a = [n*.25, m*.3], b = [n*.8, m*.72], f = grid(n, m, (i,j) => Math.sin(Math.hypot(i-a[0], j-a[1])*.9) + Math.sin(Math.hypot(i-b[0], j-b[1])*.9));
        g.lineWidth = 1; g.strokeStyle = sh(c, 1.2, .95); iso(g, n, m, f, .8, T); g.strokeStyle = sh(c, .7, .8); iso(g, n, m, f, -.8, T);
        g.fillStyle = "#fff"; [a, b].forEach(q => { const t = T(q[0], q[1]); g.beginPath(); g.arc(t[0], t[1], 2.5, 0, TAU); g.fill(); });
      }
      g.restore(); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(x0+.5, y0+.5, pw-1, ph-1);
    }
  },
  // V02 多條等值線：地形圖（計曲線加粗、方格網、高程點）
  function(g, W, H, r, c){
    const n = 96, S = W/(n-1), m = Math.floor(H/S)+1, nz = U.vnoise((r()*1e9)|0), ox = r()*30;
    const pk = [[n*(.25+r()*.2), m*(.3+r()*.2)], [n*(.6+r()*.2), m*(.55+r()*.2)]];
    const f = grid(n, m, (i,j) => fbm(nz, ox + i*.05, j*.05, 4)*.9 + pk.reduce((s,[x,y],k) => s + (.7 - k*.2)*Math.exp(-((i-x)**2 + (j-y)**2)/(260 + k*120)), 0));
    const T = (i,j) => [i*S, j*S];
    g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1; for(let x = 0; x < W; x += W/5){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); } for(let y = 0; y < H; y += W/5){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
    for(let k = 0; k < 26; k++){ const lv = .3 + k*.045, idx = k % 5 === 0; g.lineWidth = idx ? 1.6 : .7; g.strokeStyle = idx ? sh(c, 1.25, 1) : sh(c, .85, .55); iso(g, n, m, f, lv, T); }
    g.strokeStyle = "#fff"; g.lineWidth = 1.2; pk.forEach(([x,y]) => { const [a,b] = T(x,y); g.beginPath(); g.moveTo(a-4,b); g.lineTo(a+4,b); g.moveTo(a,b-4); g.lineTo(a,b+4); g.stroke(); });
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(W-16, 10); g.lineTo(W-11, 24); g.lineTo(W-16, 21); g.lineTo(W-21, 24); g.closePath(); g.fill();
  },
  // V03 影像輸入：對角切開——左上是灰階像素，右下是向量等值線
  function(g, W, H, r, c){
    const nz = U.vnoise((r()*1e9)|0), cx = .35 + r()*.2, cy = .3 + r()*.15;
    const I = (u,v) => Math.max(0, Math.min(1, .25 + .6*Math.exp(-((u-cx)**2 + ((v-cy)*H/W)**2)/.04) - .35*Math.exp(-((u-.68)**2 + (v-.72)**2)/.02) + .25*(fbm(nz, u*5, v*5, 3) - .5) + .2*v));
    const cell = W/16, cols = Math.ceil(W/cell), rows = Math.ceil(H/cell), cut = (x,y) => x/W + y/H < 1;
    for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){ const x = i*cell, y = j*cell; if(!cut(x+cell/2, y+cell/2)) continue; const b = Math.round(30 + I((i+.5)*cell/W, (j+.5)*cell/H)*200); g.fillStyle = `rgb(${b},${b},${b+4})`; g.fillRect(x, y, cell-1, cell-1); }
    const n = 70, S = W/(n-1), m = Math.floor(H/S)+1, f = grid(n, m, (i,j) => I(i*S/W, j*S/H));
    g.save(); g.beginPath(); g.moveTo(W,0); g.lineTo(W,H); g.lineTo(0,H); g.closePath(); g.clip();
    g.lineWidth = 1.2; for(let k = 0; k < 7; k++){ g.strokeStyle = sh(c, .6 + k*.12, .95); iso(g, n, m, f, .2 + k*.09, (i,j) => [i*S, j*S]); }
    g.restore();
    g.setLineDash([5,4]); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(W,0); g.lineTo(0,H); g.stroke(); g.setLineDash([]);
  },
  // V04 曲面上的等值線：波浪屋頂（四根柱）上的等值線
  function(g, W, H, r, c){
    const A = W*.54, ox = W/2, oy = (H - A*1.1)/2 + A*.45, amp = .3 + r()*.1, ph = r()*TAU;
    const Z = (u,v) => .28 + amp*Math.sin(Math.PI*u)*(.75 + .25*Math.cos(TAU*v*1.2 + ph));
    const P = (u,v,z) => [ox + (u-v)*A*.866, oy + (u+v)*A*.5 - z*A];
    const S3 = (u,v) => P(u, v, Z(u,v));
    // 地面陰影與柱子
    g.fillStyle = "rgba(0,0,0,.35)"; pl(g, [P(0,0,0), P(1,0,0), P(1,1,0), P(0,1,0)], true); g.fill();
    g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1.5; [[0,0],[1,0],[1,1],[0,1]].forEach(([u,v]) => { const a = P(u,v,0), b = S3(u,v); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); });
    // 曲面外框與線框
    const edge = []; for(let k = 0; k <= 30; k++) edge.push(S3(k/30, 0)); for(let k = 0; k <= 30; k++) edge.push(S3(1, k/30)); for(let k = 30; k >= 0; k--) edge.push(S3(k/30, 1)); for(let k = 30; k >= 0; k--) edge.push(S3(0, k/30));
    g.fillStyle = sh(c, .35, .5); pl(g, edge, true); g.fill();
    g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = .7; for(let k = 0; k <= 10; k++){ pl(g, [...Array(31)].map((_,q) => S3(k/10, q/30))); g.stroke(); pl(g, [...Array(31)].map((_,q) => S3(q/30, k/10))); g.stroke(); }
    // uv 參數空間上的 metaball 等值線，再映射回曲面
    const n = 44, B = [...Array(5)].map(() => [4 + r()*(n-8), 4 + r()*(n-8), 5 + r()*5]), f = grid(n, n, meta(B)), T = (i,j) => S3(i/(n-1), j/(n-1));
    g.lineWidth = 1.3; [.8,1.3,2,3.2].forEach((lv,k) => { g.strokeStyle = sh(c, .9 + k*.15, 1); iso(g, n, n, f, lv, T); });
    g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; pl(g, edge, true); g.stroke();
  },
  // V05 Isoband 填色：分層色帶＋投影陰影，像疊層板材
  function(g, W, H, r, c){
    const B = [...Array(6)].map(() => [r()*W, r()*H, W*(.08 + r()*.1)]), F = meta(B), lv = [.5,.85,1.3,2,3.2,5];
    const C0 = [26,26,34], C1 = U.rgb(c), C2 = [250,246,240];
    paint(g, 0, 0, W, H, 2, (u,v) => { const s = F(u*W, v*H); let k = 0; while(k < lv.length && s > lv[k]) k++; const t = k/lv.length; return t < .7 ? mixc(C0, C1, t/.7) : mixc(C1, C2, (t-.7)/.3); });
    const n = 80, S = W/(n-1), m = Math.floor(H/S)+1, f = grid(n, m, (i,j) => F(i*S, j*S));
    lv.forEach(L => { g.lineWidth = 2.5; g.strokeStyle = "rgba(0,0,0,.45)"; iso(g, n, m, f, L, (i,j) => [i*S+2, j*S+2.5]); g.lineWidth = .9; g.strokeStyle = "rgba(255,255,255,.6)"; iso(g, n, m, f, L, (i,j) => [i*S, j*S]); });
  },
  // V06 升維成 Marching Cubes：3D metaball 的三角面網格（等角視角）
  function(g, W, H, r, c){
    const B = [...Array(6)].map((_,k) => { const a = k/6*TAU + r()*.4; return [Math.cos(a)*.6, Math.sin(a)*.6, (r()-.5)*1.1, .2 + r()*.1]; });
    const bl = blob3(B, 1, .8, .6), sc = Math.min(W,H)*.46, cx = W/2, cy = H/2, L = [.4,-.5,.75];
    // 體素外框
    const pc = p => { const q = bl.proj(p); return [cx + q[0]*sc, cy - q[1]*sc]; }, V = [-1,1];
    g.strokeStyle = "rgba(255,255,255,.18)"; g.setLineDash([3,3]); g.lineWidth = 1;
    for(const a of V) for(const b of V){ [[[-1,a,b],[1,a,b]], [[a,-1,b],[a,1,b]], [[a,b,-1],[a,b,1]]].forEach(([p,q]) => { const s = pc(p), t = pc(q); g.beginPath(); g.moveTo(s[0],s[1]); g.lineTo(t[0],t[1]); g.stroke(); }); }
    g.setLineDash([]);
    const s = W/30, h = s*.866, cols = Math.ceil(W/s)+2, rows = Math.ceil(H/h)+1, pts = [];
    for(let j = 0; j < rows; j++){ const row = []; for(let i = 0; i < cols; i++){ const x = i*s - s + (j%2)*s/2, y = j*h; row.push({x, y, h: bl.hit((x-cx)/sc, -(y-cy)/sc)}); } pts.push(row); }
    g.lineWidth = .6; g.strokeStyle = "rgba(255,255,255,.22)";
    const tri = (a,b,d) => { if(!a.h || !b.h || !d.h) return; const nx = a.h.n[0]+b.h.n[0]+d.h.n[0], ny = a.h.n[1]+b.h.n[1]+d.h.n[1], nz = a.h.n[2]+b.h.n[2]+d.h.n[2], l = Math.hypot(nx,ny,nz)||1;
      const lam = Math.max(0, (nx*L[0]+ny*L[1]+nz*L[2])/l/Math.hypot(...L)); g.fillStyle = sh(c, .28 + lam*1.05); g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.lineTo(d.x,d.y); g.closePath(); g.fill(); g.stroke(); };
    for(let j = 0; j < rows-1; j++) for(let i = 0; i < cols-1; i++){ const A = pts[j], Bq = pts[j+1];
      if(j%2 === 0){ tri(A[i], A[i+1], Bq[i]); tri(A[i+1], Bq[i+1], Bq[i]); } else { tri(A[i], A[i+1], Bq[i+1]); tri(A[i], Bq[i+1], Bq[i]); } }
  },
  // V07 吸引子加權與負電荷：正電荷光暈、負電荷挖出凹洞的水池平面
  function(g, W, H, r, c){
    const B = [...Array(4)].map(() => [W*(.2 + r()*.6), H*(.2 + r()*.6), W*(.1 + r()*.06), 1]);
    for(let k = 0; k < 2; k++){ const a = B[k], t = r()*TAU; B.push([a[0] + Math.cos(t)*W*.1, a[1] + Math.sin(t)*W*.1, W*(.06 + r()*.03), -1.4]); }
    const F = meta(B);
    B.forEach(b => { if(b[3] < 0) return; const gr = g.createRadialGradient(b[0],b[1],0,b[0],b[1],b[2]*2.2); gr.addColorStop(0, sh(c,1,.35)); gr.addColorStop(1, sh(c,1,0)); g.fillStyle = gr; g.fillRect(0,0,W,H); });
    paint(g, 0, 0, W, H, 2, (u,v) => F(u*W, v*H) > 1.2 ? [...U.rgb(c), 60] : null);
    const n = 80, S = W/(n-1), m = Math.floor(H/S)+1, f = grid(n, m, (i,j) => F(i*S, j*S)), T = (i,j) => [i*S, j*S];
    [.6,1.2,1.9,3].forEach((lv,k) => { g.lineWidth = k === 1 ? 2 : 1; g.strokeStyle = k === 1 ? "#fff" : sh(c, 1 + k*.1, .75); iso(g, n, m, f, lv, T); });
    B.forEach(b => { const [x,y] = b; g.lineWidth = 1.6;
      if(b[3] > 0){ g.fillStyle = c; g.beginPath(); g.arc(x,y,7,0,TAU); g.fill(); g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(x-4,y); g.lineTo(x+4,y); g.moveTo(x,y-4); g.lineTo(x,y+4); g.stroke(); }
      else { g.strokeStyle = COOL; g.beginPath(); g.arc(x,y,7,0,TAU); g.stroke(); g.beginPath(); g.moveTo(x-4,y); g.lineTo(x+4,y); g.stroke(); g.setLineDash([2,3]); g.globalAlpha = .6; g.beginPath(); g.arc(x,y,b[2],0,TAU); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; } });
  },
  // V08 曲線邊界裁切：不規則基地線內的等值線，界外斜線
  function(g, W, H, r, c){
    const n = 80, S = W/(n-1), m = Math.floor(H/S)+1, k = 9, P = [];
    for(let i = 0; i < k; i++){ const a = i/k*TAU + r()*.3, rr = .32 + r()*.14; P.push([W/2 + Math.cos(a)*W*rr, H/2 + Math.sin(a)*H*rr*.95]); }
    const nz = U.vnoise((r()*1e9)|0), B = [...Array(5)].map(() => [r()*W, r()*H, W*(.1 + r()*.1)]), M = meta(B);
    const f = grid(n, m, (i,j) => { const x = i*S, y = j*S; return inPoly(x, y, P) ? M(x,y)*.6 + fbm(nz, x*.02, y*.02, 3)*1.6 : 0; });
    g.save(); g.beginPath(); g.rect(0,0,W,H); pl(g, P, true); g.clip("evenodd");
    g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1; for(let x = -H; x < W; x += 7){ g.beginPath(); g.moveTo(x, H); g.lineTo(x+H, 0); g.stroke(); }
    g.restore();
    g.fillStyle = sh(c, .4, .25); pl(g, P, true); g.fill();
    for(let q = 0; q < 8; q++){ g.lineWidth = 1.3; g.strokeStyle = sh(c, 1 + q*.06, 1); iso(g, n, m, f, .5 + q*.22, (i,j) => [i*S, j*S]); }
    g.strokeStyle = "#fff"; g.lineWidth = 2.2; g.setLineDash([8,3,2,3]); pl(g, P, true); g.stroke(); g.setLineDash([]);
    g.fillStyle = "#fff"; P.forEach(([x,y]) => g.fillRect(x-2.5, y-2.5, 5, 5));
  },
  // V09 混合反應擴散：像素鋸齒斑紋，放大鏡內變成平滑向量輪廓
  function(g, W, H, r, c){
    const nz = U.vnoise((r()*1e9)|0), ox = r()*20, P = (x,y) => Math.sin(fbm(nz, ox + x*.012, y*.012, 3)*26);
    const cell = 7; for(let y = 0; y < H; y += cell) for(let x = 0; x < W; x += cell) if(P(x+cell/2, y+cell/2) > 0){ g.fillStyle = sh(c, .55, .7); g.fillRect(x, y, cell-1, cell-1); }
    const lx = W*(.45 + r()*.1), ly = H*(.42 + r()*.1), R = Math.min(W,H)*.32;
    g.save(); g.beginPath(); g.arc(lx, ly, R, 0, TAU); g.clip();
    g.fillStyle = "#15151B"; g.fillRect(lx-R, ly-R, 2*R, 2*R);
    paint(g, lx-R, ly-R, 2*R, 2*R, 1.5, (u,v) => P(lx-R+u*2*R, ly-R+v*2*R) > 0 ? [...U.rgb(c), 190] : null);
    const n = 70, S = 2*R/(n-1), f = grid(n, n, (i,j) => P(lx-R+i*S, ly-R+j*S));
    g.strokeStyle = "#fff"; g.lineWidth = 1.3; iso(g, n, n, f, 0, (i,j) => [lx-R+i*S, ly-R+j*S]);
    g.restore();
    g.strokeStyle = "#fff"; g.lineWidth = 3; g.beginPath(); g.arc(lx, ly, R, 0, TAU); g.stroke();
    g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.moveTo(lx + R*.72, ly + R*.72); g.lineTo(lx + R*1.15, ly + R*1.15); g.stroke(); g.lineCap = "butt";
  },
  // V10 動畫化：底片條上的四格，metaball 融合又分離
  function(g, W, H, r, c){
    const x0 = W*.14, x1 = W*.86, fw = x1-x0, K = 4, gap = 6, fh = (H - 20 - gap*(K-1))/K, ph = r()*TAU;
    g.fillStyle = "#0B0B0F"; g.fillRect(x0-18, 0, fw+36, H);
    g.fillStyle = "#2A2A33"; for(let y = 4; y < H; y += 12){ g.fillRect(x0-13, y, 7, 6); g.fillRect(x1+6, y, 7, 6); }
    for(let k = 0; k < K; k++){
      const y0 = 10 + k*(fh+gap), t = k/(K-1), n = 50, S = fw/(n-1), m = Math.floor(fh/S)+1, cx = n/2, cy = m/2, d = Math.cos(t*Math.PI)*n*.26;
      const B = [[cx - d*Math.cos(ph), cy - d*.1, 5], [cx + d, cy + d*Math.sin(ph)*.1, 4.5], [cx + Math.sin(t*TAU)*n*.14, cy + Math.cos(t*Math.PI)*m*.18, 3.5]];
      const f = grid(n, m, meta(B)), T = (i,j) => [x0 + i*S, y0 + j*S];
      g.fillStyle = "#1A1A22"; g.fillRect(x0, y0, fw, fh);
      g.save(); g.beginPath(); g.rect(x0, y0, fw, fh); g.clip();
      [.9,1.3,2.2].forEach((lv,q) => { g.lineWidth = q === 1 ? 1.8 : 1; g.strokeStyle = sh(c, .8 + q*.2, .6 + q*.2); iso(g, n, m, f, lv, T); });
      g.fillStyle = "rgba(255,255,255,.7)"; B.forEach(b => { const p = T(b[0], b[1]); g.beginPath(); g.arc(p[0], p[1], 1.6, 0, TAU); g.fill(); });
      g.restore();
      g.fillStyle = "rgba(255,255,255,.5)"; for(let q = 0; q <= k; q++) g.fillRect(x1 - 6 - q*5, y0 + 4, 3, 3);
    }
  },
  // V11 堆疊成 3D：每個門檻值一層，等角視角疊成地形切片
  function(g, W, H, r, c){
    const n = 40, nz = U.vnoise((r()*1e9)|0), ox0 = r()*20;
    const f = grid(n, n, (i,j) => { const e = Math.min(i, j, n-1-i, n-1-j)/(n*.18); return fbm(nz, ox0 + i*.07, j*.07, 3)*Math.min(1, e) + Math.exp(-((i-n/2)**2 + (j-n/2)**2)/140)*.5; });
    const a = W*.88/(1.732*(n-1)), K = 10, dz = H*.045, oy = (H - (n-1)*a - K*dz)/2 + K*dz, P = (i,j,z) => [W/2 + (i-j)*a*.866, oy + (i+j)*a*.5 - z];
    g.fillStyle = "rgba(255,255,255,.05)"; pl(g, [P(0,0,0), P(n-1,0,0), P(n-1,n-1,0), P(0,n-1,0)], true); g.fill(); g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.stroke();
    for(let k = 0; k < K; k++){ const z = k*dz; g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 2.4; iso(g, n, n, f, .25 + k*.07, (i,j) => P(i,j,z-1));
      g.strokeStyle = sh(c, .6 + k*.08, .55 + k*.045); g.lineWidth = 1.2; iso(g, n, n, f, .25 + k*.07, (i,j) => P(i,j,z)); }
    g.strokeStyle = "rgba(255,255,255,.2)"; g.setLineDash([2,3]); [[0,0],[n-1,0],[n-1,n-1],[0,n-1]].forEach(([i,j]) => { const p = P(i,j,0), q = P(i,j,(K-1)*dz); g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); }); g.setLineDash([]);
  },
  // V12 可製造的肋條：雷切板排版——白色切割線、虛線刻痕、定位孔與編號點
  function(g, W, H, r, c){
    const cols = 2, rows = 3, pad = 8, sw = (W - pad*(cols+1))/cols, shh = (H - pad*(rows+1))/rows;
    const n = 36, m = Math.round(n*shh/sw), B = [...Array(3)].map(() => [n*(.3 + r()*.4), m*(.3 + r()*.4), n*(.11 + r()*.04)]);
    const f = grid(n, m, (i,j) => B.reduce((s,[x,y,sg]) => s + Math.exp(-((i-x)**2 + (j-y)**2)/(2*sg*sg)), 0));
    const hole = [B[0][0], B[0][1]];
    for(let k = 0; k < cols*rows; k++){
      const x0 = pad + (k % cols)*(sw+pad), y0 = pad + Math.floor(k/cols)*(shh+pad), S = sw/(n-1), T = (i,j) => [x0 + i*S, y0 + j*S], lv = .15 + k*.15;
      g.fillStyle = "#26262F"; g.fillRect(x0, y0, sw, shh); g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1; g.strokeRect(x0+.5, y0+.5, sw-1, shh-1);
      g.strokeStyle = sh(c, .9, .8); g.lineWidth = 1; g.setLineDash([3,2]); iso(g, n, m, f, lv + .15, T); g.setLineDash([]);
      g.strokeStyle = sh(c, .5, .5); g.lineWidth = 3.5; iso(g, n, m, f, lv, T);
      g.strokeStyle = "#fff"; g.lineWidth = 1.1; iso(g, n, m, f, lv, T);
      const h = T(hole[0], hole[1]); g.strokeStyle = "#fff"; g.beginPath(); g.arc(h[0]-6, h[1], 2, 0, TAU); g.moveTo(h[0]+8, h[1]); g.arc(h[0]+6, h[1], 2, 0, TAU); g.stroke();
      g.fillStyle = c; for(let q = 0; q <= k; q++) g.fillRect(x0 + 4 + q*4, y0 + shh - 7, 2.5, 2.5);
    }
  },
];

/* ================= 無照片案例 ================= */
// C05-01 Marching Cubes 醫學影像：CT 斷層切片＋等值輪廓，右下角一個立方體單元
ART.case["C05-01"] = function(g, W, H, r, c){
  const cx = W/2, cy = H*.46, R = Math.min(W,H)*.4, nz = U.vnoise((r()*1e9)|0);
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, R+10, 0, TAU); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; for(let k = 0; k < 48; k++){ const a = k/48*TAU; g.beginPath(); g.moveTo(cx + Math.cos(a)*(R+15), cy + Math.sin(a)*(R+15)); g.lineTo(cx + Math.cos(a)*(R+19), cy + Math.sin(a)*(R+19)); g.stroke(); }
  const D = (x,y) => { const e = Math.hypot(x/.78, y/.92); let v = 0;
    if(e < 1) v = .08; if(e < .95) v = e > .84 ? .95 : .38 + (fbm(nz, x*4+5, y*4, 3)-.5)*.3;
    if(e < .84){ const vl = Math.hypot((x+.14)/.08, (y+.05)/.2), vr = Math.hypot((x-.14)/.08, (y+.05)/.2); if(vl < 1 || vr < 1) v = .12; }
    return v; };
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
  paint(g, cx-R, cy-R, 2*R, 2*R, 1.5, (u,v) => { const b = Math.round(D(u*2-1, v*2-1)*220 + 10); return [b, b, b+6]; });
  const n = 70, S = 2*R/(n-1), f = grid(n, n, (i,j) => D(i/(n-1)*2-1, j/(n-1)*2-1)), T = (i,j) => [cx-R+i*S, cy-R+j*S];
  g.strokeStyle = c; g.lineWidth = 1.6; iso(g, n, n, f, .7, T); g.strokeStyle = sh(c, 1.4, .8); g.lineWidth = 1; iso(g, n, n, f, .25, T);
  g.restore();
  // 立方體單元：8 角、只有一角在內，切出一個三角形
  const u = Math.min(W,H)*.1, P = isoP(W - u*1.7, H - u*.6, u), V = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]], inside = [0,0,0,0,0,1,0,0];
  g.fillStyle = sh(c, 1, .8); pl(g, [P(.5,0,1), P(1,.5,1), P(1,0,.5)], true); g.fill();
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([a,b]) => { const p = P(...V[a]), q = P(...V[b]); g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); });
  V.forEach((v,i) => { const p = P(...v); g.beginPath(); g.arc(p[0], p[1], 2.6, 0, TAU); if(inside[i]){ g.fillStyle = "#fff"; g.fill(); } else { g.fillStyle = "#15151B"; g.fill(); g.stroke(); } });
};
ART.case["C05-01"].ratio = 1.05;

// C05-02 Blinn 的 blobby 原子模型：太空中發光、平滑融合的原子球
ART.case["C05-02"] = function(g, W, H, r, c){
  for(let k = 0; k < 70; k++){ g.fillStyle = `rgba(255,255,255,${.15 + r()*.5})`; const s = r() < .1 ? 1.6 : .9; g.fillRect(r()*W, r()*H, s, s); }
  const B = [[0,0,0,.5]]; for(let k = 0; k < 4; k++){ const a = k/4*TAU + r()*.5, e = (r()-.5)*1.2; B.push([Math.cos(a)*.78*Math.cos(e), Math.sin(a)*.78*Math.cos(e), Math.sin(e)*.78, .26 + r()*.04]); }
  const bl = blob3(B, 1, .5 + r(), .35), sc = Math.min(W,H)*.42, cx = W/2, cy = H/2, L = [.3,-.6,.75], ll = Math.hypot(...L);
  g.strokeStyle = sh(c, 1.2, .25); g.lineWidth = 1; for(let k = 0; k < 3; k++){ g.save(); g.translate(cx, cy); g.rotate(k*1.05 + .3); g.beginPath(); g.ellipse(0, 0, sc*1.1, sc*.32, 0, 0, TAU); g.stroke(); g.restore(); }
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, sc*1.3); gr.addColorStop(0, sh(c, 1, .25)); gr.addColorStop(1, sh(c, 1, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const C1 = U.rgb(c), CW = [236,238,248];
  const x0 = cx - sc*1.25, y0 = cy - sc*1.25, sz = sc*2.5;
  paint(g, x0, y0, sz, sz, 2, (u,v) => { const h = bl.hit((x0 + u*sz - cx)/sc, -(y0 + v*sz - cy)/sc); if(!h) return null;
    const n = h.n, lam = Math.max(0, (n[0]*L[0]+n[1]*L[1]+n[2]*L[2])/ll), vd = -(n[0]*bl.D[0]+n[1]*bl.D[1]+n[2]*bl.D[2]);
    const hx = L[0]/ll - bl.D[0], hy = L[1]/ll - bl.D[1], hz = L[2]/ll - bl.D[2], hl = Math.hypot(hx,hy,hz), sp = Math.pow(Math.max(0, (n[0]*hx+n[1]*hy+n[2]*hz)/hl), 30);
    const base = h.k === 0 ? C1 : CW, s = .18 + lam*.8, rim = Math.pow(1 - Math.max(0, vd), 3)*.6;
    return [Math.min(255, base[0]*s + 255*sp + C1[0]*rim), Math.min(255, base[1]*s + 255*sp + C1[1]*rim), Math.min(255, base[2]*s + 255*sp + C1[2]*rim)]; });
};
ART.case["C05-02"].ratio = .9;

// C05-03 Blob Architecture：泡泡建築的剖立面——融合量體、樓板、人與樹
ART.case["C05-03"] = function(g, W, H, r, c){
  const gy = H*.8, B = [...Array(5)].map((_,k) => [W*(.2 + k*.15 + (r()-.5)*.08), gy - H*(.12 + r()*.3), W*(.1 + r()*.07)]), F = meta(B);
  const inside = (x,y) => y < gy && F(x,y) > 1;
  g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(0, gy, W, H-gy);
  const gr = g.createLinearGradient(0, H*.1, 0, gy); gr.addColorStop(0, sh(c, 1.2, .9)); gr.addColorStop(1, sh(c, .45, .9));
  // 先在離屏畫出量體遮罩，再用漸層上色
  const mk = tex(Math.round(W/2), Math.round(H/2), (u,v) => inside(u*W, v*H) ? [255,255,255,255] : null);
  const off = document.createElement("canvas"); off.width = mk.width; off.height = mk.height; const ox = off.getContext("2d");
  ox.drawImage(mk, 0, 0); ox.globalCompositeOperation = "source-in"; const g2 = ox.createLinearGradient(0, mk.height*.1, 0, mk.height*.8); g2.addColorStop(0, sh(c, 1.2, .9)); g2.addColorStop(1, sh(c, .45, .9)); ox.fillStyle = g2; ox.fillRect(0, 0, mk.width, mk.height);
  g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, W, H);
  // 樓板：每 11px 一層，只畫在量體內
  g.strokeStyle = "rgba(20,20,26,.75)"; g.lineWidth = 1.4;
  for(let y = gy - 11; y > 0; y -= 11){ let run = null; for(let x = 0; x <= W; x += 2){ const inn = x < W && inside(x, y); if(inn && run === null) run = x; if(!inn && run !== null){ if(x - run > 12){ g.beginPath(); g.moveTo(run+3, y); g.lineTo(x-3, y); g.stroke(); } run = null; } } }
  const n = 90, S = W/(n-1), m = Math.floor(gy/S)+1, f = grid(n, m, (i,j) => F(i*S, j*S));
  g.save(); g.beginPath(); g.rect(0, 0, W, gy); g.clip(); g.strokeStyle = "#fff"; g.lineWidth = 1.6; iso(g, n, m, f, 1, (i,j) => [i*S, j*S]); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = .8; iso(g, n, m, f, 1.6, (i,j) => [i*S, j*S]); g.restore();
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1;
  for(let k = 0; k < 4; k++){ const x = W*(.08 + r()*.84), h = 9; g.beginPath(); g.arc(x, gy - h - 2, 1.6, 0, TAU); g.moveTo(x, gy - h); g.lineTo(x, gy - 4); g.lineTo(x-2, gy); g.moveTo(x, gy-4); g.lineTo(x+2, gy); g.stroke(); }
  [W*.04, W*.95].forEach(x => { g.beginPath(); g.moveTo(x, gy); g.lineTo(x, gy - 14); g.stroke(); g.beginPath(); g.arc(x, gy - 20, 7, 0, TAU); g.stroke(); });
};
ART.case["C05-03"].ratio = .8;

// C05-04 AR Sandbox：透視沙盤上的高程色帶與等高線，上方投影機光錐
ART.case["C05-04"] = function(g, W, H, r, c){
  const nz = U.vnoise((r()*1e9)|0), ox = r()*20, TL = [W*.2, H*.34], TR = [W*.8, H*.34], BR = [W*.97, H*.9], BL = [W*.03, H*.9];
  const M = (u,v) => { const a = [TL[0]+(TR[0]-TL[0])*u, TL[1]+(TR[1]-TL[1])*u], b = [BL[0]+(BR[0]-BL[0])*u, BL[1]+(BR[1]-BL[1])*u]; return [a[0]+(b[0]-a[0])*v, a[1]+(b[1]-a[1])*v]; };
  const pj = [W/2, H*.07];
  g.fillStyle = "rgba(255,255,255,.05)"; pl(g, [pj, TL, BL, BR, TR], true); g.fill();
  g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1; [TL, TR, BL, BR].forEach(p => { g.beginPath(); g.moveTo(pj[0], pj[1]); g.lineTo(p[0], p[1]); g.stroke(); });
  g.fillStyle = "#3A3A44"; g.fillRect(pj[0]-14, pj[1]-9, 28, 12); g.fillStyle = "#fff"; g.beginPath(); g.arc(pj[0], pj[1]+3, 3, 0, TAU); g.fill();
  const n = 40, m = 30, f = grid(n, m, (i,j) => fbm(nz, ox + i*.09, j*.09, 4)), ramp = [[40,80,150],[60,140,170],[80,150,90],[200,190,90],[210,120,60],[190,70,60],[240,236,230]];
  const col = h => { const t = Math.max(0, Math.min(.999, (h - .3)/.45))*(ramp.length-1), k = Math.floor(t); return mixc(ramp[k], ramp[k+1], t-k); };
  g.fillStyle = "#4A4038"; pl(g, [M(0,1), M(1,1), [BR[0], BR[1]+8], [BL[0], BL[1]+8]], true); g.fill();
  for(let j = 0; j < m-1; j++) for(let i = 0; i < n-1; i++){ const q = col((f(i,j)+f(i+1,j)+f(i,j+1)+f(i+1,j+1))/4); g.fillStyle = `rgb(${q[0]|0},${q[1]|0},${q[2]|0})`; pl(g, [M(i/(n-1), j/(m-1)), M((i+1)/(n-1), j/(m-1)), M((i+1)/(n-1), (j+1)/(m-1)), M(i/(n-1), (j+1)/(m-1))], true); g.fill(); g.strokeStyle = g.fillStyle; g.lineWidth = .5; g.stroke(); }
  g.strokeStyle = "rgba(10,10,14,.7)"; g.lineWidth = 1; for(let k = 0; k < 10; k++) iso(g, n, m, f, .3 + k*.045, (i,j) => M(i/(n-1), j/(m-1)));
  g.strokeStyle = "#8A7A68"; g.lineWidth = 2.5; pl(g, [TL, TR, BR, BL], true); g.stroke();
};
ART.case["C05-04"].ratio = .8;

// C05-05 等壓線天氣圖：等壓線、高低壓中心、冷暖鋒符號、經緯網
ART.case["C05-05"] = function(g, W, H, r, c){
  const nz = U.vnoise((r()*1e9)|0);
  g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1;
  for(let k = 1; k < 6; k++){ g.beginPath(); g.ellipse(W/2, H*2.2, W*1.4, H*(1.3 + k*.18), 0, Math.PI*1.2, Math.PI*1.8); g.stroke(); }
  for(let k = -3; k <= 3; k++){ g.beginPath(); g.moveTo(W/2 + k*W*.18, H); g.lineTo(W/2 + k*W*.12, 0); g.stroke(); }
  paint(g, 0, 0, W, H, 3, (u,v) => fbm(nz, u*3 + 7, v*3, 3) > .55 ? [255,255,255,14] : null);
  const P = [[.3,.35,1],[.72,.65,-1],[.8,.2,.6],[.15,.8,-.6]].map(([x,y,s]) => [W*(x + (r()-.5)*.1), H*(y + (r()-.5)*.1), s]);
  const F = (x,y) => P.reduce((s,[px,py,w]) => s + w*Math.exp(-((x-px)**2 + (y-py)**2)/(W*W*.07)), 0) + (fbm(nz, x*.01, y*.01, 2)-.5)*.3;
  const n = 70, S = W/(n-1), m = Math.floor(H/S)+1, f = grid(n, m, (i,j) => F(i*S, j*S)), T = (i,j) => [i*S, j*S];
  for(let k = -8; k <= 8; k++){ g.lineWidth = k % 4 === 0 ? 1.6 : .9; g.strokeStyle = k % 4 === 0 ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.45)"; iso(g, n, m, f, k*.11 + .001, T); }
  P.forEach(([x,y,w]) => { if(Math.abs(w) < .9) return; g.lineWidth = 1.8; g.strokeStyle = w > 0 ? c : COOL; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.stroke();
    g.beginPath(); if(w > 0){ g.moveTo(x-4, y); g.lineTo(x+4, y); g.moveTo(x, y-4); g.lineTo(x, y+4); } else { g.moveTo(x-4, y); g.lineTo(x+4, y); } g.stroke(); });
  // 鋒面：從低壓中心延伸出去（冷鋒三角、暖鋒半圓）
  const lo = P[1];
  const front = (pts, cold) => { g.strokeStyle = cold ? COOL : c; g.fillStyle = g.strokeStyle; g.lineWidth = 2; pl(g, pts); g.stroke();
    for(let k = 1; k < pts.length-1; k += 3){ const [x,y] = pts[k], [x2,y2] = pts[k+1], a = Math.atan2(y2-y, x2-x), nx = Math.sin(a), ny = -Math.cos(a);
      g.beginPath(); if(cold){ g.moveTo(x - Math.cos(a)*5, y - Math.sin(a)*5); g.lineTo(x + Math.cos(a)*5, y + Math.sin(a)*5); g.lineTo(x + nx*7, y + ny*7); } else g.arc(x, y, 5, a + Math.PI, a); g.closePath(); g.fill(); } };
  front([...Array(13)].map((_,k) => { const t = k/23; return [lo[0] - t*W*.55, lo[1] + Math.sin(t*3 + 1)*H*.12 - t*H*.05]; }), true);
  front([...Array(12)].map((_,k) => { const t = k/11; return [lo[0] + t*W*.06, lo[1] - t*H*.45]; }), false);
};
ART.case["C05-05"].ratio = .85;

// C05-06 d3-contour：散點＋密度等值多邊形的資料圖表（座標軸與刻度）
ART.case["C05-06"] = function(g, W, H, r, c){
  const L = 26, Bm = 22, T0 = 10, R0 = 10, pw = W - L - R0, ph = H - Bm - T0;
  const cl = [...Array(3)].map(() => [.2 + r()*.6, .2 + r()*.6, .06 + r()*.08]), pts = [];
  const gauss = () => { let s = 0; for(let k = 0; k < 4; k++) s += r(); return (s - 2)*1.7; };
  for(let k = 0; k < 260; k++){ const q = cl[k % 3]; pts.push([q[0] + gauss()*q[2], q[1] + gauss()*q[2]*.8]); }
  const n = 50, m = Math.round(n*ph/pw), sg = .06, d = grid(n, m, (i,j) => { const x = i/(n-1), y = j/(m-1); let s = 0; for(const p of pts){ const dx = x - p[0], dy = y - p[1]; s += Math.exp(-(dx*dx + dy*dy)/(2*sg*sg)); } return s; });
  let mx = 0; for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) mx = Math.max(mx, d(i,j));
  const Tm = (i,j) => [L + i/(n-1)*pw, T0 + j/(m-1)*ph];
  g.save(); g.beginPath(); g.rect(L, T0, pw, ph); g.clip();
  paint(g, L, T0, pw, ph, 2, (u,v) => { const x = u*(n-1), y = v*(m-1), i = Math.min(n-2, x|0), j = Math.min(m-2, y|0), fx = x-i, fy = y-j;
    const s = (d(i,j)*(1-fx) + d(i+1,j)*fx)*(1-fy) + (d(i,j+1)*(1-fx) + d(i+1,j+1)*fx)*fy, k = Math.floor(s/mx*9); return k > 0 ? [...U.rgb(c), Math.min(230, k*26)] : null; });
  g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = .8; for(let k = 1; k < 9; k++) iso(g, n, m, d, mx*k/9, Tm);
  g.fillStyle = "rgba(255,255,255,.75)"; pts.forEach(([x,y]) => { g.beginPath(); g.arc(L + x*pw, T0 + y*ph, 1.1, 0, TAU); g.fill(); });
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; g.beginPath(); g.moveTo(L, T0); g.lineTo(L, T0+ph); g.lineTo(L+pw, T0+ph); g.stroke();
  for(let k = 0; k <= 5; k++){ const x = L + k/5*pw, y = T0 + k/5*ph; g.beginPath(); g.moveTo(x, T0+ph); g.lineTo(x, T0+ph+4); g.moveTo(L, y); g.lineTo(L-4, y); g.stroke(); }
};
ART.case["C05-06"].ratio = .85;

// C05-07 Coding Train 教學圖：粗格網角點黑白點＋中點連線（最原始版本）
ART.case["C05-07"] = function(g, W, H, r, c){
  const nz = U.vnoise((r()*1e9)|0), ox = r()*20, cols = 15, s = W/(cols+1), rows = Math.floor(H/s) - 1, x0 = s, y0 = (H - (rows-1)*s)/2;
  const f = grid(cols, rows, (i,j) => fbm(nz, ox + i*.22, j*.22, 3)), T = (i,j) => [x0 + i*s, y0 + j*s];
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1;
  for(let i = 0; i < cols; i++){ g.beginPath(); g.moveTo(x0 + i*s, y0); g.lineTo(x0 + i*s, y0 + (rows-1)*s); g.stroke(); }
  for(let j = 0; j < rows; j++){ g.beginPath(); g.moveTo(x0, y0 + j*s); g.lineTo(x0 + (cols-1)*s, y0 + j*s); g.stroke(); }
  const bin = (i,j) => f(i,j) > .5 ? 1 : 0;
  g.strokeStyle = c; g.lineWidth = 2.2; g.lineCap = "round"; iso(g, cols, rows, bin, .5, T); g.lineCap = "butt";
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){ const [x,y] = T(i,j), v = f(i,j); g.fillStyle = v > .5 ? "#fff" : "#4A4A55"; g.beginPath(); g.arc(x, y, 1.5 + v*3, 0, TAU); g.fill(); }
};
ART.case["C05-07"].ratio = 1;

// C05-08 Dendro：左側 GH 元件節點，右側曲線包成體素的視窗
ART.case["C05-08"] = function(g, W, H, r, c){
  const nw = W*.3;
  g.fillStyle = "#23232C"; g.fillRect(0, 0, nw, H);
  g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 1; for(let x = 0; x < nw; x += 10){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for(let y = 0; y < H; y += 10){ g.beginPath(); g.moveTo(0, y); g.lineTo(nw, y); g.stroke(); }
  const bw = nw*.42, bh = 16, nodes = [[nw*.08, H*.18], [nw*.5, H*.38], [nw*.08, H*.6], [nw*.5, H*.8]];
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.3; for(let k = 1; k < nodes.length; k++){ const a = nodes[k-1], b = nodes[k]; g.beginPath(); g.moveTo(a[0]+bw, a[1]+bh/2); g.bezierCurveTo(a[0]+bw+20, a[1]+bh/2, b[0]-20, b[1]+bh/2, b[0], b[1]+bh/2); g.stroke(); }
  nodes.forEach(([x,y],k) => { g.fillStyle = k === 1 || k === 2 ? sh(c, .8) : "#9A9AA6"; g.fillRect(x, y, bw, bh); g.fillStyle = "#15151B"; g.fillRect(x+3, y+3, bw*.25, bh-6); g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y+bh/2, 2.2, 0, TAU); g.arc(x+bw, y+bh/2, 2.2, 0, TAU); g.fill(); });
  // 視窗：地面格線＋輸入曲線＋體素
  const vx = nw + 4, vw = W - vx, N = 14, u = vw*.9/(N*1.732), P = isoP(vx + vw/2, H*.5 - N*u*.2, u);
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; for(let k = 0; k <= N; k += 2){ let a = P(k,0,0), b = P(k,N,0); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); a = P(0,k,0); b = P(N,k,0); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
  const ph = r()*TAU, cv = [...Array(40)].map((_,k) => { const t = k/39; return [N/2 + Math.cos(t*TAU*1.1 + ph)*N*.33, N/2 + Math.sin(t*TAU*1.1 + ph)*N*.33, 1 + t*(N*.55)]; });
  const vox = [];
  for(let z = 0; z < N; z++) for(let y = 0; y < N; y++) for(let x = 0; x < N; x++){ let d = 1e9; for(const p of cv){ const q = (x+.5-p[0])**2 + (y+.5-p[1])**2 + (z+.5-p[2])**2; if(q < d) d = q; } if(d < 1.6) vox.push([x,y,z]); }
  vox.sort((a,b) => (a[0]+a[1]+a[2]) - (b[0]+b[1]+b[2]));
  vox.forEach(([x,y,z]) => cube(g, P, x, y, z, 1, sh(c, 1.25, .95), sh(c, .5, .95), sh(c, .75, .95), "rgba(0,0,0,.25)"));
  g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.setLineDash([3,2]); pl(g, cv.map(p => P(p[0]+.5, p[1]+.5, p[2]+.5))); g.stroke(); g.setLineDash([]);
};
ART.case["C05-08"].ratio = .8;

// C05-09 Millipede：懸臂梁的拓樸最佳化密度場色階，等值線把密度變成可建造的形
ART.case["C05-09"] = function(g, W, H, r, c){
  const x0 = W*.1, y0 = H*.1, dw = W*.82, dh = H*.64;
  const nd = [], K = 5; for(let k = 0; k <= K; k++){ const t = k/K; nd.push([t, .08 + t*.42 - Math.sin(t*Math.PI)*.05*(r()+.5)], [t, .92 - t*.42 + Math.sin(t*Math.PI)*.05*(r()+.5)]); }
  const mem = []; for(let k = 0; k < K; k++){ mem.push([nd[2*k], nd[2*k+2]], [nd[2*k+1], nd[2*k+3]], k % 2 ? [nd[2*k], nd[2*k+3]] : [nd[2*k+1], nd[2*k+2]]); }
  const Dn = (x,y) => { let best = 0; mem.forEach(([a,b],k) => { const vx = b[0]-a[0], vy = b[1]-a[1], t = Math.max(0, Math.min(1, ((x-a[0])*vx + (y-a[1])*vy)/(vx*vx+vy*vy))), d = Math.hypot((x-a[0]-vx*t)*dw, (y-a[1]-vy*t)*dh), w = (k % 3 === 2 ? 4 : 7)*(1.2 - x*.5); best = Math.max(best, Math.exp(-((d/w)**2))); }); return best; };
  const C0 = [22,22,30], C1 = U.rgb(c), C2 = [255,250,240], cm = t => t < .6 ? mixc(C0, C1, t/.6) : mixc(C1, C2, (t-.6)/.4);
  paint(g, x0, y0, dw, dh, 2, (u,v) => cm(Dn(u,v)));
  const n = 90, m = Math.round(n*dh/dw), f = grid(n, m, (i,j) => Dn(i/(n-1), j/(m-1)));
  g.strokeStyle = "#fff"; g.lineWidth = 1.2; iso(g, n, m, f, .5, (i,j) => [x0 + i/(n-1)*dw, y0 + j/(m-1)*dh]);
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.strokeRect(x0, y0, dw, dh);
  g.strokeStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.moveTo(x0-2, y0); g.lineTo(x0-2, y0+dh); g.stroke(); for(let y = y0; y < y0+dh; y += 6){ g.beginPath(); g.moveTo(x0-2, y); g.lineTo(x0-8, y+6); g.stroke(); }
  const lx = x0 + dw, ly = y0 + dh*.5; g.strokeStyle = g.fillStyle = COOL; g.lineWidth = 2; g.beginPath(); g.moveTo(lx, ly - 4); g.lineTo(lx, ly + 22); g.stroke(); g.beginPath(); g.moveTo(lx, ly + 28); g.lineTo(lx-4, ly+20); g.lineTo(lx+4, ly+20); g.closePath(); g.fill();
  const by = y0 + dh + 18, bg = g.createLinearGradient(x0, 0, x0 + dw*.6, 0); [0,.3,.6,.8,1].forEach(t => { const q = cm(t); bg.addColorStop(t, `rgb(${q[0]|0},${q[1]|0},${q[2]|0})`); });
  g.fillStyle = bg; g.fillRect(x0, by, dw*.6, 7); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; for(let k = 0; k <= 4; k++){ g.beginPath(); g.moveTo(x0 + k/4*dw*.6, by+7); g.lineTo(x0 + k/4*dw*.6, by+11); g.stroke(); }
};
ART.case["C05-09"].ratio = .78;

// C05-10 Axolotl：SDF／TPMS——被 gyroid 薄殼晶格填滿的立方體（三個可見面）
ART.case["C05-10"] = function(g, W, H, r, c){
  const u = Math.min(W,H)*.5, P = isoP(W/2, H*.5 - u*.5, u), k = TAU*(1.2 + r()*.6), th = .45;
  const gy = (x,y,z) => Math.sin(k*x)*Math.cos(k*y) + Math.sin(k*y)*Math.cos(k*z) + Math.sin(k*z)*Math.cos(k*x);
  const C1 = U.rgb(c);
  const faces = [ {o:[0,0,1], a:[1,0,0], b:[0,1,0], s:1}, {o:[1,0,0], a:[0,1,0], b:[0,0,1], s:.7}, {o:[0,1,0], a:[1,0,0], b:[0,0,1], s:.45} ];
  faces.forEach(F => {
    const at = (s,t) => [F.o[0] + F.a[0]*s + F.b[0]*t, F.o[1] + F.a[1]*s + F.b[1]*t, F.o[2] + F.a[2]*s + F.b[2]*t];
    const off = tex(80, 80, (s,t) => Math.abs(gy(...at(s,t))) < th ? mixc([0,0,0], C1, F.s).concat(255) : [20,20,26,255]);
    const O = P(...F.o), A = P(...at(1,0)), Bp = P(...at(0,1));
    g.save(); g.transform(A[0]-O[0], A[1]-O[1], Bp[0]-O[0], Bp[1]-O[1], O[0], O[1]); g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, 1, 1); g.restore();
    const n = 50, f = grid(n, n, (i,j) => gy(...at(i/(n-1), j/(n-1)))), T = (i,j) => P(...at(i/(n-1), j/(n-1)));
    g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = .9; iso(g, n, n, f, th, T); iso(g, n, n, f, -th, T);
  });
  g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.3;
  [[[0,0,1],[1,0,1]],[[1,0,1],[1,1,1]],[[1,1,1],[0,1,1]],[[0,1,1],[0,0,1]],[[1,0,1],[1,0,0]],[[1,1,1],[1,1,0]],[[0,1,1],[0,1,0]],[[1,0,0],[1,1,0]],[[1,1,0],[0,1,0]]].forEach(([a,b]) => { const p = P(...a), q = P(...b); g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); });
};
ART.case["C05-10"].ratio = 1.05;

// C05-11 Inigo Quilez 風格 SDF：距離場條紋視覺化（內外兩色、零等值線為白）
ART.case["C05-11"] = function(g, W, H, r, c){
  const C1 = U.rgb(c), C2 = U.rgb(COOL), a = W/2, b = H/2, s = Math.min(W,H);
  const c1 = [a - s*.15, b - s*.08, s*.2], bx = [a + s*.14, b + s*.1, s*.16, s*.12], c3 = [a + s*(.05 + r()*.1), b - s*.2, s*.09], kk = s*.08;
  const sd = (x,y) => { const d1 = Math.hypot(x-c1[0], y-c1[1]) - c1[2];
    const qx = Math.abs(x-bx[0]) - bx[2] + 8, qy = Math.abs(y-bx[1]) - bx[3] + 8, d2 = Math.hypot(Math.max(qx,0), Math.max(qy,0)) + Math.min(Math.max(qx,qy), 0) - 8;
    const h = Math.max(kk - Math.abs(d1-d2), 0)/kk, un = Math.min(d1,d2) - h*h*kk*.25, d3 = Math.hypot(x-c3[0], y-c3[1]) - c3[2]; return Math.max(un, -d3); };
  paint(g, 0, 0, W, H, 1.5, (u,v) => { const d = sd(u*W, v*H)/s, base = d > 0 ? C1 : C2, k = (1 - Math.exp(-6*Math.abs(d)))*(.75 + .25*Math.cos(120*d)), e = Math.abs(d) < .006 ? 1 : 0;
    return [base[0]*k*.9 + 18 + e*230, base[1]*k*.9 + 18 + e*230, base[2]*k*.9 + 22 + e*230]; });
};
ART.case["C05-11"].ratio = .9;

// C05-12 Marching Cubes 程式化地形：有懸崖與洞穴的地層剖面
ART.case["C05-12"] = function(g, W, H, r, c){
  const nz = U.vnoise((r()*1e9)|0), n2 = U.vnoise((r()*1e9)|0), ox = r()*20;
  const gr = g.createLinearGradient(0, 0, 0, H*.5); gr.addColorStop(0, sh(c, .3, .5)); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H*.5);
  const D = (x,y) => { const gl = H*.3 + (fbm(nz, ox + x*.012, 0, 4) - .5)*H*.45; return (y - gl)/(H*.12) + (fbm(n2, x*.02, y*.02, 3) - .5)*3.4 - (y > H*.45 ? Math.exp(-(((fbm(n2, x*.012 + 40, y*.025, 2) - .5)/.06)**2))*3 : 0); };
  const C1 = U.rgb(c), dk = [40,36,44];
  paint(g, 0, 0, W, H, 2, (u,v) => { const x = u*W, y = v*H, d = D(x,y); if(d < 0) return null; const band = Math.floor((y + fbm(nz, x*.03, 3, 2)*20)/14) % 3, t = [.5,.35,.22][band] + Math.min(.3, d*.05);
    return mixc(dk, C1, t).concat(255); });
  const n = 90, S = W/(n-1), m = Math.floor(H/S)+1, f = grid(n, m, (i,j) => D(i*S, j*S));
  g.strokeStyle = "#fff"; g.lineWidth = 1.1; iso(g, n, m, f, 0, (i,j) => [i*S, j*S]);
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = .8; iso(g, n, m, f, 1.2, (i,j) => [i*S, j*S]);
};
ART.case["C05-12"].ratio = 1.1;

// C05-13 Monolith 多材料體素：列印中的物件，兩種材料以抖動漸變
ART.case["C05-13"] = function(g, W, H, r, c){
  const cx = W/2, top = H*.2, bot = H*.88, a1 = r()*TAU, prog = .82;
  const rad = y => { const t = (bot - y)/(bot - top); return W*(.2 + .1*Math.sin(t*Math.PI*1.6 + a1) + .06*Math.cos(t*Math.PI*4)); };
  const cell = 6, BY = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]], C1 = sh(c, 1), C2 = "#E6E8F2", yl = bot - (bot - top)*prog;
  for(let y = bot - cell; y >= yl; y -= cell){ const rr = rad(y + cell/2), row = Math.round((bot - y)/cell);
    for(let x = cx - Math.ceil(rr/cell)*cell; x < cx + rr; x += cell){ const xm = x + cell/2; if(Math.abs(xm - cx) > rr) continue;
      const t = (bot - y)/(bot - top) + (Math.abs(xm - cx)/rr)*.25 - .1, th = BY[row & 3][Math.round((x - cx)/cell + 64) & 3]/16;
      g.fillStyle = t > th ? C2 : C1; g.fillRect(x, y, cell-1, cell-1); } }
  // 目標形體外框（尚未列印的部分為虛線）
  const side = s => { const pts = []; for(let y = bot; y >= top; y -= 3) pts.push([cx + s*rad(y), y]); return pts; };
  [-1,1].forEach(s => { const pts = side(s), cut = Math.max(1, pts.findIndex(p => p[1] < yl)); g.strokeStyle = "#fff"; g.lineWidth = 1.2; pl(g, pts.slice(0, cut)); g.stroke(); g.setLineDash([3,3]); g.strokeStyle = "rgba(255,255,255,.4)"; pl(g, pts.slice(cut-1)); g.stroke(); g.setLineDash([]); });
  g.strokeStyle = "rgba(255,255,255,.4)"; g.setLineDash([3,3]); g.beginPath(); g.moveTo(cx - rad(top), top); g.lineTo(cx + rad(top), top); g.stroke(); g.setLineDash([]);
  g.fillStyle = "#3A3A44"; g.fillRect(W*.05, bot, W*.9, 6);
  const hx = cx + rad(yl)*.3; g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, yl - 22); g.lineTo(W, yl - 22); g.stroke();
  g.fillStyle = "#6A6A78"; g.fillRect(hx - 14, yl - 30, 28, 14); g.fillStyle = "#C8C8D2"; g.beginPath(); g.moveTo(hx-6, yl-16); g.lineTo(hx+6, yl-16); g.lineTo(hx, yl-5); g.closePath(); g.fill();
  g.fillStyle = C1; g.fillRect(hx - 12, yl - 28, 5, 10); g.fillStyle = C2; g.fillRect(hx + 7, yl - 28, 5, 10);
};
ART.case["C05-13"].ratio = 1.2;

// C05-54 ofxMetaballs：上方 MC（方格），下方 MT（每格切成三角形），同一個場的網格對比
ART.case["C05-54"] = function(g, W, H, r, c){
  const n = 13, m = 7, B = [...Array(3)].map(() => [2 + r()*(n-5), 1.5 + r()*3, 1.6 + r()*1.1]), F = meta(B);
  const pad = 10, pw = W - 2*pad, S = pw/(n-1), ph = (m-1)*S, gap = H - 2*ph - 2*pad;
  const f = grid(n, m, F), lv = 1;
  [0,1].forEach(p => {
    const y0 = pad + p*(ph + gap), T = (i,j) => [pad + i*S, y0 + j*S];
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1;
    for(let i = 0; i < n; i++){ const a = T(i,0), b = T(i,m-1); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
    for(let j = 0; j < m; j++){ const a = T(0,j), b = T(n-1,j); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
    if(p === 0){ g.strokeStyle = c; g.lineWidth = 2; iso(g, n, m, f, lv, T); }
    else {
      g.strokeStyle = "rgba(255,255,255,.18)"; for(let j = 0; j < m-1; j++) for(let i = 0; i < n-1; i++){ const a = T(i,j), b = T(i+1,j+1); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
      // Marching Triangles：每個三角形找穿越等值的兩條邊
      const tris = []; for(let j = 0; j < m-1; j++) for(let i = 0; i < n-1; i++) tris.push([[i,j],[i+1,j],[i+1,j+1]], [[i,j],[i+1,j+1],[i,j+1]]);
      const cut = (p1, p2) => { const a = f(...p1), b = f(...p2); if((a > lv) === (b > lv)) return null; const t = (lv - a)/(b - a); return [p1[0] + (p2[0]-p1[0])*t, p1[1] + (p2[1]-p1[1])*t]; };
      g.fillStyle = sh(c, .6, .35); tris.forEach(tr => { if(tr.every(v => f(...v) > lv)){ pl(g, tr.map(v => T(...v)), true); g.fill(); } });
      g.strokeStyle = sh(c, 1.35); g.lineWidth = 2; g.beginPath();
      tris.forEach(tr => { const q = [cut(tr[0],tr[1]), cut(tr[1],tr[2]), cut(tr[2],tr[0])].filter(Boolean); if(q.length === 2){ const s = T(...q[0]), t = T(...q[1]); g.moveTo(s[0],s[1]); g.lineTo(t[0],t[1]); } });
      g.stroke();
    }
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const [x,y] = T(i,j), inn = f(i,j) > lv; g.fillStyle = inn ? "#fff" : "#55555F"; g.beginPath(); g.arc(x, y, inn ? 2.4 : 1.6, 0, TAU); g.fill(); }
  });
  g.strokeStyle = "rgba(255,255,255,.25)"; g.setLineDash([4,4]); g.beginPath(); g.moveTo(pad, H/2); g.lineTo(W-pad, H/2); g.stroke(); g.setLineDash([]);
};
ART.case["C05-54"].ratio = 1.1;
})();
