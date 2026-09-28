/* B01 差異生長：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = Math.PI*2;

/* ---------------- 共用：差異生長模擬（正規化座標，與畫布大小無關） ----------------
   o.curves：[{p:[[x,y,z]…], closed, fix}]；fix＝開放曲線端點固定
   o.d 目標邊長、o.R 斥力半徑、o.sc(x,y,z) 局部倍率（吸引子／影像／噪聲）、o.scMax 倍率上限
   o.cons(p) 位移後的約束（邊界、曲面）、o.force(p) 額外力、o.d3 是否 3D
   o.mode：'all' 全部超長邊插點、'rand' 隨機插點、'longest' 只切最長邊、'mask' 由 o.canGrow 決定
   o.snap：要記錄的步數陣列，回傳各代曲線副本 */
function grow(o, r){
  const C = o.curves, d = o.d || .012, R = o.R || d*2.4, steps = o.steps || 150, maxN = o.maxN || 1200;
  const sc = o.sc, cell = R*(o.scMax || 1), d3 = !!o.d3, kr = o.kr || .5, ka = o.ka || .45, mode = o.mode || "all";
  const key = (x,y,z) => ((x+2048)*4096 + (y+2048))*4096 + (z+2048), snaps = [];
  for(let s = 0; s < steps; s++){
    // 格子雜湊：只比同格與相鄰格
    const hash = new Map(); let N = 0;
    for(const cv of C) for(const p of cv.p){ N++; const k = key(Math.floor(p[0]/cell), Math.floor(p[1]/cell), d3 ? Math.floor(p[2]/cell) : 0); let b = hash.get(k); if(!b){ b = []; hash.set(k,b); } b.push(p); }
    for(const cv of C){
      const P = cv.p, n = P.length, D = new Float64Array(n*3);
      for(let i = 0; i < n; i++){
        const p = P[i]; if(!cv.closed && cv.fix && (i === 0 || i === n-1)) continue;
        const m = sc ? sc(p[0],p[1],p[2]) : 1, rr = R*m, r2 = rr*rr;
        const ix = Math.floor(p[0]/cell), iy = Math.floor(p[1]/cell), iz = d3 ? Math.floor(p[2]/cell) : 0, zr = d3 ? 1 : 0;
        let fx = 0, fy = 0, fz = 0;
        for(let a = -1; a <= 1; a++) for(let b = -1; b <= 1; b++) for(let e = -zr; e <= zr; e++){
          const bk = hash.get(key(ix+a, iy+b, iz+e)); if(!bk) continue;
          for(const q of bk){ if(q === p) continue; const dx = p[0]-q[0], dy = p[1]-q[1], dz = d3 ? p[2]-q[2] : 0, dd = dx*dx+dy*dy+dz*dz;
            if(dd < r2 && dd > 1e-14){ const l = Math.sqrt(dd), f = (1 - l/rr)/l; fx += dx*f; fy += dy*f; fz += dz*f; } }
        }
        // 鄰居吸引：往前後兩點的中點
        const A = cv.closed ? P[(i-1+n)%n] : P[i-1], B = cv.closed ? P[(i+1)%n] : P[i+1];
        let vx = fx*kr*d*m, vy = fy*kr*d*m, vz = fz*kr*d*m;
        if(A && B){ vx += ((A[0]+B[0])/2 - p[0])*ka; vy += ((A[1]+B[1])/2 - p[1])*ka; if(d3) vz += ((A[2]+B[2])/2 - p[2])*ka; }
        if(o.force){ const e = o.force(p); vx += e[0]; vy += e[1]; vz += e[2] || 0; }
        const L = Math.hypot(vx,vy,vz), cap = d*.6*m; if(L > cap){ vx *= cap/L; vy *= cap/L; vz *= cap/L; }
        D[i*3] = vx; D[i*3+1] = vy; D[i*3+2] = vz;
      }
      for(let i = 0; i < n; i++){ const p = P[i]; p[0] += D[i*3]; p[1] += D[i*3+1]; if(d3) p[2] += D[i*3+2]; if(o.cons) o.cons(p); }
    }
    // 插點
    if(N < maxN) for(const cv of C){
      const P = cv.p, n = P.length, lim = cv.closed ? n : n-1, Q = [];
      let thr = 0;
      if(mode === "longest"){ const ls = []; for(let i = 0; i < lim; i++){ const q = P[(i+1)%n]; ls.push(Math.hypot(P[i][0]-q[0], P[i][1]-q[1], (P[i][2]||0)-(q[2]||0))); } ls.sort((a,b) => b-a); thr = ls[Math.min(ls.length-1, o.k || 3)]; }
      for(let i = 0; i < n; i++){
        const p = P[i]; Q.push(p); if(i >= lim) continue;
        const q = P[(i+1)%n], mx = (p[0]+q[0])/2, my = (p[1]+q[1])/2, mz = ((p[2]||0)+(q[2]||0))/2, m = sc ? sc(mx,my,mz) : 1;
        const len = Math.hypot(p[0]-q[0], p[1]-q[1], (p[2]||0)-(q[2]||0));
        if(len <= d*m || N >= maxN) continue;
        if(mode === "rand" && r() > (o.pIns || .3)) continue;
        if(mode === "longest" && len < thr) continue;
        if(mode === "mask" && !o.canGrow(i, n, cv)) continue;
        const j = d*.05; Q.push([mx + (r()-.5)*j, my + (r()-.5)*j, mz + (d3 ? (r()-.5)*j : 0)]); N++;
      }
      cv.p = Q;
    }
    if(o.snap && o.snap.includes(s)) snaps.push(C.map(cv => ({closed:cv.closed, p:cv.p.map(q => q.slice())})));
  }
  return snaps;
}
// 起始圓環
function ring(cx, cy, rad, d, zj, r){ const n = Math.max(8, Math.round(TAU*rad/d)), P = []; for(let i = 0; i < n; i++){ const a = i/n*TAU; P.push([cx + rad*Math.cos(a), cy + rad*Math.sin(a), zj ? (r()-.5)*zj : 0]); } return P; }
// 起始直線（開放）
function segLine(x1, y1, x2, y2, d){ const n = Math.max(2, Math.round(Math.hypot(x2-x1,y2-y1)/d)), P = []; for(let i = 0; i <= n; i++){ const t = i/n; P.push([x1+(x2-x1)*t, y1+(y2-y1)*t, 0]); } return P; }
// 盒子約束
const box = (x0,y0,x1,y1) => p => { p[0] = Math.max(x0, Math.min(x1, p[0])); p[1] = Math.max(y0, Math.min(y1, p[1])); };
// 畫一條曲線，map 把模擬座標轉成畫面座標
function stroke(g, P, closed, map){ g.beginPath(); for(let i = 0; i < P.length; i++){ const q = map(P[i]); i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } if(closed) g.closePath(); }
// 點在多邊形內
function inPoly(x, y, poly){ let c = false; for(let i = 0, j = poly.length-1; i < poly.length; j = i++){ const [xi,yi] = poly[i], [xj,yj] = poly[j]; if((yi > y) !== (yj > y) && x < (xj-xi)*(y-yi)/(yj-yi) + xi) c = !c; } return c; }
// 多邊形上最近點
function closestOnPoly(x, y, poly){ let best = null, bd = 1e9; for(let i = 0; i < poly.length; i++){ const a = poly[i], b = poly[(i+1)%poly.length], ex = b[0]-a[0], ey = b[1]-a[1], t = Math.max(0, Math.min(1, ((x-a[0])*ex + (y-a[1])*ey)/(ex*ex+ey*ey))), px = a[0]+ex*t, py = a[1]+ey*t, dd = (px-x)**2 + (py-y)**2; if(dd < bd){ bd = dd; best = [px,py]; } } return best; }
// 多邊形約束（跑出去就拉回、稍微往內）
const polyCons = (poly, cx, cy) => p => { if(!inPoly(p[0], p[1], poly)){ const q = closestOnPoly(p[0], p[1], poly); p[0] = q[0] + (cx - q[0])*.01; p[1] = q[1] + (cy - q[1])*.01; } };
// 單位區域 [0,aw]×[0,ah] 映射到畫面矩形
const fitMap = (x0, y0, w, h, aw, ah) => { const s = Math.min(w/aw, h/ah), ox = x0 + (w - aw*s)/2, oy = y0 + (h - ah*s)/2; return p => [ox + p[0]*s, oy + p[1]*s]; };
// 等角投影
const iso = (X, Y, Z) => [(X - Y)*.866, (X + Y)*.5 - Z];

ART.var["B01"] = [
  // V01 空間索引加速：上萬點的腦紋，疊上格子雜湊與 3×3 查詢範圍
  function(g, W, H, r, c, U){
    const ah = H/W, d = .0075, R = d*2.4, C = [{p:ring(.5, ah/2, .05, d), closed:true}];
    C.push({p:ring(.22, ah*.25, .03, d), closed:true}, {p:ring(.78, ah*.75, .03, d), closed:true});
    grow({curves:C, d, R, steps:170, maxN:1750, cons:box(.02, .02, .98, ah-.02)}, r);
    const M = p => [p[0]*W, p[1]*W];
    // 格子
    const cs = R*W*1.6; g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1;
    for(let x = 0; x < W; x += cs){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); }
    for(let y = 0; y < H; y += cs){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
    g.strokeStyle = c; g.lineWidth = .8; g.lineJoin = "round"; C.forEach(cv => { stroke(g, cv.p, true, M); g.stroke(); });
    // 查詢點與相鄰 3×3 格
    const q = C[0].p[(C[0].p.length*.3)|0], qx = Math.floor(q[0]*W/cs), qy = Math.floor(q[1]*W/cs);
    g.fillStyle = "rgba(255,255,255,.10)"; g.fillRect((qx-1)*cs, (qy-1)*cs, cs*3, cs*3);
    g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.2; g.strokeRect((qx-1)*cs, (qy-1)*cs, cs*3, cs*3);
    g.fillStyle = "#fff"; g.beginPath(); g.arc(q[0]*W, q[1]*W, 3, 0, TAU); g.fill();
  },
  // V02 吸引子：立面分格中，吸引點附近皺褶特別密
  function(g, W, H, r, c, U){
    const ah = H/W, ax = .3 + r()*.1, ay = ah*(.3 + r()*.1), d = .009;
    const sc = (x,y) => .45 + 1.4*Math.min(1, Math.hypot(x-ax, y-ay)/.55);
    const C = [{p:ring(ax, ay, .05, d*.5), closed:true}];
    grow({curves:C, d, R:d*2.4, sc, scMax:1.85, steps:180, maxN:1300, cons:box(.08, .06, .92, ah-.06)}, r);
    const M = p => [p[0]*W, p[1]*W];
    // 立面框與分格
    g.fillStyle = "rgba(255,255,255,.03)"; g.fillRect(W*.06, W*.04, W*.88, H - W*.08);
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.strokeRect(W*.06, W*.04, W*.88, H - W*.08);
    g.lineWidth = 1; g.strokeStyle = "rgba(255,255,255,.12)";
    for(let i = 1; i < 4; i++){ const x = W*(.06 + .22*i); g.beginPath(); g.moveTo(x, W*.04); g.lineTo(x, H - W*.04); g.stroke(); }
    for(let j = 1; j < 3; j++){ const y = W*.04 + (H - W*.08)*j/3; g.beginPath(); g.moveTo(W*.06, y); g.lineTo(W*.94, y); g.stroke(); }
    const gr = g.createRadialGradient(ax*W, ay*W, 0, ax*W, ay*W, W*.35); gr.addColorStop(0, "rgba(242,160,7,.35)"); gr.addColorStop(1, "rgba(242,160,7,0)");
    g.fillStyle = gr; g.fillRect(0,0,W,H);
    g.strokeStyle = c; g.lineWidth = 1; stroke(g, C[0].p, true, M); g.stroke();
    g.strokeStyle = "#F2A007"; g.lineWidth = 1.5; g.beginPath(); g.arc(ax*W, ay*W, 6, 0, TAU); g.moveTo(ax*W-11, ay*W); g.lineTo(ax*W+11, ay*W); g.moveTo(ax*W, ay*W-11); g.lineTo(ax*W, ay*W+11); g.stroke();
  },
  // V03 影像控制密度：單線迷宮重現明暗，角落放原始灰階圖
  function(g, W, H, r, c, U){
    const ah = H/W, nz = U.vnoise(r()*1e6|0);
    const tone = (x,y) => { const dx = (x-.5)/.34, dy = (y-ah*.45)/.4, dd = dx*dx + dy*dy; const lit = dd < 1 ? .25 + .75*Math.max(0, (1-dd)) * (.6 + .4*(-(dx+dy)*.5+.5)) : .9; return Math.max(0, Math.min(1, lit*.85 + nz(x*8,y*8)*.15)); };
    const d = .009, sc = (x,y) => .5 + 1.3*tone(x,y);
    const C = [];
    for(let k = 0; k < 6; k++) C.push({p:ring(.15 + (k%3)*.35, ah*(.28 + (k>>1&1 ? .45 : 0)) + (k%2)*.05, .03, d), closed:true});
    grow({curves:C, d, R:d*2.4, sc, scMax:1.8, steps:160, maxN:1900, cons:box(.02, .02, .98, ah-.02)}, r);
    g.strokeStyle = "rgba(255,255,255,.88)"; g.lineWidth = .8; C.forEach(cv => { stroke(g, cv.p, true, p => [p[0]*W, p[1]*W]); g.stroke(); });
    // 原始圖縮圖
    const iw = W*.26, ih = iw*1.1, ix = W - iw - 8, iy = H - ih - 8;
    g.save(); g.translate(ix, iy); U.field(g, iw, ih, 32, 35, (i,j) => 1 - tone(i/31, j/34*ah), "#EDEDED"); g.restore();
    g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.strokeRect(ix, iy, iw, ih);
    g.strokeStyle = c; g.beginPath(); g.moveTo(ix - 4, iy + ih/2); g.lineTo(ix - 16, iy + ih/2); g.stroke();
  },
  // V04 邊界曲線約束：填滿不規則基地輪廓，外面是街廓陰影
  function(g, W, H, r, c, U){
    const ah = H/W, poly = [[.1,.12*ah],[.62,.08*ah],[.9,.3*ah],[.86,.62*ah],[.55,.58*ah],[.5,.9*ah],[.14,.88*ah],[.2,.5*ah]];
    const d = .0085, C = [{p:ring(.35, .35*ah, .05, d), closed:true}, {p:ring(.3, .75*ah, .03, d), closed:true}];
    grow({curves:C, d, R:d*2.4, steps:170, maxN:1550, cons:polyCons(poly, .4, .45*ah)}, r);
    const M = p => [p[0]*W, p[1]*W];
    // 基地外斜線
    g.save(); g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1; for(let k = -H; k < W; k += 7){ g.beginPath(); g.moveTo(k,0); g.lineTo(k+H,H); g.stroke(); } g.restore();
    g.fillStyle = "#17171D"; stroke(g, poly, true, M); g.fill();
    g.strokeStyle = c; g.lineWidth = 1; C.forEach(cv => { stroke(g, cv.p, true, M); g.stroke(); });
    g.strokeStyle = "#fff"; g.lineWidth = 2.5; g.lineJoin = "round"; stroke(g, poly, true, M); g.stroke();
    g.fillStyle = "#fff"; poly.forEach(q => { const s = M(q); g.fillRect(s[0]-3, s[1]-3, 6, 6); });
  },
  // V05 開放曲線與多條：三條直線端點固定，蜿蜒成河道並互相擠壓
  function(g, W, H, r, c, U){
    const ah = H/W, d = .009, cols = [c, "#F5F2EC", "#F2A007"], C = [];
    for(let k = 0; k < 3; k++){ const y = ah*(.22 + k*.28); C.push({p:segLine(.04, y, .96, y + (r()-.5)*.05, d), closed:false, fix:true}); }
    grow({curves:C, d, R:d*2.6, steps:190, maxN:1550, cons:box(.04, .03, .96, ah-.03)}, r);
    const M = p => [p[0]*W, p[1]*W];
    g.lineWidth = 1.4; g.lineJoin = "round";
    C.forEach((cv,k) => { g.strokeStyle = cols[k]; stroke(g, cv.p, false, M); g.stroke(); });
    C.forEach((cv,k) => [cv.p[0], cv.p[cv.p.length-1]].forEach(q => { const s = M(q); g.fillStyle = "#15151B"; g.fillRect(s[0]-5, s[1]-5, 10, 10); g.strokeStyle = cols[k]; g.lineWidth = 2; g.strokeRect(s[0]-5, s[1]-5, 10, 10); }));
  },
  // V06 曲面上生長：UV 平面長好後貼到雙曲拋物面（等角）
  function(g, W, H, r, c, U){
    const d = .017, C = [{p:ring(.5, .5, .06, d), closed:true}, {p:ring(.2, .25, .04, d), closed:true}, {p:ring(.78, .75, .04, d), closed:true}];
    grow({curves:C, d, R:d*2.4, steps:190, maxN:1300, cons:box(.02, .02, .98, .98)}, r);
    const S = (u,v) => { const X = u - .5, Y = v - .5; return [X, Y, (X*X - Y*Y)*.7]; };
    const sz = Math.min(W/1.95, H/1.45), P = (u,v) => { const [X,Y,Z] = S(u,v), q = iso(X, Y, Z); return [W/2 + q[0]*sz, H*.5 + q[1]*sz]; };
    // 曲面網格
    g.lineWidth = 1;
    for(let k = 0; k <= 12; k++){ const t = k/12; g.strokeStyle = "rgba(255,255,255,.14)"; g.beginPath(); for(let s = 0; s <= 30; s++){ const q = P(t, s/30); s ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } g.stroke(); g.beginPath(); for(let s = 0; s <= 30; s++){ const q = P(s/30, t); s ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } g.stroke(); }
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.6; g.beginPath(); [[0,0],[1,0],[1,1],[0,1]].forEach(([u,v],i) => { for(let s = 0; s <= 30; s++){ const t = s/30, a = [[t,0],[1,t],[1-t,1],[0,1-t]][i], q = P(a[0], a[1]); (i||s) ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } }); g.closePath(); g.stroke();
    // 曲線：依高度明暗
    C.forEach(cv => { const n = cv.p.length; for(let i = 0; i < n; i++){ const a = cv.p[i], b = cv.p[(i+1)%n], z = S((a[0]+b[0])/2, (a[1]+b[1])/2)[2]; g.strokeStyle = z > 0 ? c : U.rgba(c, .55); g.lineWidth = z > 0 ? 1.3 : .9; const p = P(a[0],a[1]), q = P(b[0],b[1]); g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); } });
  },
  // V07 3D 空間曲線：盤繞成線團，當成管件依深度畫粗細
  function(g, W, H, r, c, U){
    const d = .02, C = [{p:ring(0, 0, .12, d, .04, r), closed:true}];
    grow({curves:C, d3:true, d, R:d*2.2, steps:150, maxN:700, force:p => { const l = Math.hypot(p[0],p[1],p[2]) || 1; return l > .42 ? [-p[0]/l*d*.5, -p[1]/l*d*.5, -p[2]/l*d*.5] : [0, 0, d*.02]; }}, r);
    const ay = .6, ax = .5, sz = Math.min(W,H)*1.55, pr = p => { const x = p[0]*Math.cos(ay) - p[2]*Math.sin(ay), z1 = p[0]*Math.sin(ay) + p[2]*Math.cos(ay), y = p[1]*Math.cos(ax) - z1*Math.sin(ax), z = p[1]*Math.sin(ax) + z1*Math.cos(ax), k = 1.6/(1.6 + z); return [W/2 + x*sz*k, H/2 + y*sz*k, z]; };
    const P = C[0].p.map(pr), n = P.length, segs = [];
    for(let i = 0; i < n; i++){ const a = P[i], b = P[(i+1)%n]; segs.push([a, b, (a[2]+b[2])/2]); }
    segs.sort((s,t) => t[2] - s[2]);
    g.lineCap = "round"; const w = Math.min(W,H)*.022;
    segs.forEach(([a,b,z]) => { const t = Math.max(0, Math.min(1, .5 - z*1.2)); g.strokeStyle = "#0E0E12"; g.lineWidth = w*(.7 + t*.8) + 2; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke();
      g.strokeStyle = U.rgba(c, .35 + t*.65); g.lineWidth = w*(.7 + t*.8); g.stroke(); g.strokeStyle = `rgba(255,255,255,${.1 + t*.35})`; g.lineWidth = w*.25; g.stroke(); });
  },
  // V08 3D 網格差異生長：圓盤邊緣長出荷葉邊（透視、面著色）
  function(g, W, H, r, c, U){
    const K = 140, J = 14, ph = [r()*TAU, r()*TAU, r()*TAU], rc = U.rgb(c);
    const S = (j,k) => { const t = j/J, a = k/K*TAU, rad = .15 + t*.85, z = t*t*t*(.2*Math.sin(7*a + ph[0]) + .07*Math.sin(15*a + ph[1]) + .025*Math.sin(27*a + ph[2])); return [rad*Math.cos(a)*(1 + .1*t*Math.sin(5*a)), rad*Math.sin(a), z]; };
    const tilt = 1.0, sz = Math.min(W,H)*.46, pr = ([x,y,z]) => { const yy = y*Math.cos(tilt) - z*Math.sin(tilt), zz = y*Math.sin(tilt) + z*Math.cos(tilt), k = 3/(3 - zz); return [W/2 + x*sz*k, H*.52 + yy*sz*k, zz]; };
    const V = []; for(let j = 0; j <= J; j++){ V.push([]); for(let k = 0; k < K; k++) V[j].push(S(j,k)); }
    const F = [];
    for(let j = 0; j < J; j++) for(let k = 0; k < K; k++){ const a = V[j][k], b = V[j][(k+1)%K], cc = V[j+1][(k+1)%K], e = V[j+1][k];
      const ux = cc[0]-a[0], uy = cc[1]-a[1], uz = cc[2]-a[2], vx = e[0]-b[0], vy = e[1]-b[1], vz = e[2]-b[2], nx = uy*vz-uz*vy, ny = uz*vx-ux*vz, nz = ux*vy-uy*vx, nl = Math.hypot(nx,ny,nz) || 1;
      const pts = [a,b,cc,e].map(pr); F.push([pts, (pts[0][2]+pts[2][2])/2, Math.abs((nx*.3 - ny*.5 + nz*.8)/nl), j/J]); }
    F.sort((s,t) => s[1] - t[1]);
    F.forEach(([pts,, l, t]) => { const k = .25 + .75*l; g.fillStyle = `rgb(${rc[0]*k|0},${rc[1]*k|0},${rc[2]*k|0})`; g.beginPath(); pts.forEach((q,i) => i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1])); g.closePath(); g.fill(); g.strokeStyle = `rgba(255,255,255,${.05 + t*.12})`; g.lineWidth = .5; g.stroke(); });
  },
  // V09 動畫化逐步生長：洋蔥皮疊影，各代曲線由舊（暗藍）到新（主色）疊成等高線，下方播放列
  function(g, W, H, r, c, U){
    const d = .016, C = [{p:ring(.5, .5, .05, d), closed:true}], at = []; for(let s = 6; s < 170; s += 12) at.push(s); at.push(169);
    const sn = grow({curves:C, d, R:d*2.4, steps:170, maxN:800, cons:box(.03, .03, .97, .97), snap:at}, r);
    const tb = 34, M = fitMap(6, 6, W - 12, H - tb - 12, 1, 1), rc = U.rgb(c), n = sn.length;
    g.lineJoin = "round";
    sn.forEach((fr, k) => { const t = k/(n-1);
      // 舊的一代偏藍、半透明；越新越接近主色
      const col = `rgba(${47 + (rc[0]-47)*t|0},${111 + (rc[1]-111)*t|0},${228 + (rc[2]-228)*t|0},${.25 + .75*t})`;
      g.strokeStyle = k === n-1 ? "#fff" : col; g.lineWidth = k === n-1 ? 1.4 : .7 + t*.6; stroke(g, fr[0].p, true, M); g.stroke(); });
    // 播放列：播放鍵＋各代刻度＋播放頭
    g.fillStyle = "#101014"; g.fillRect(0, H - tb, W, tb);
    const y = H - tb/2, x0 = 30, x1 = W - 10;
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(10, y - 7); g.lineTo(21, y); g.lineTo(10, y + 7); g.fill();
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    at.forEach((s, k) => { const x = x0 + (x1 - x0)*s/169, t = k/(n-1); g.fillStyle = `rgba(${47 + (rc[0]-47)*t|0},${111 + (rc[1]-111)*t|0},${228 + (rc[2]-228)*t|0},1)`; g.fillRect(x - 1.5, y - 6, 3, 12); });
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x1 - 2, y, 5, 0, TAU); g.fill();
  },
  // V10 生長時間轉高度：各代曲線依步數升高，堆成地層般的花器
  function(g, W, H, r, c, U){
    const d = .02, C = [{p:ring(0, 0, .1, d), closed:true}], at = []; for(let s = 4; s < 150; s += 7) at.push(s);
    const L = grow({curves:C, d, R:d*2.4, steps:150, maxN:600, snap:at, cons:p => { const l = Math.hypot(p[0],p[1]); if(l > .5){ p[0] *= .5/l; p[1] *= .5/l; } }}, r);
    const sz = Math.min(W, H*1.1)*.9, hz = H*.62/L.length, rc = U.rgb(c);
    L.forEach((fr, k) => { const t = k/(L.length-1), z = k*hz, M = p => { const q = iso(p[0], p[1], 0); return [W/2 + q[0]*sz, H*.8 + q[1]*sz - z]; };
      g.fillStyle = `rgba(${rc[0]*(.25+.5*t)|0},${rc[1]*(.25+.5*t)|0},${rc[2]*(.25+.5*t)|0},.9)`; stroke(g, fr[0].p, true, M); g.fill();
      g.strokeStyle = k === L.length-1 ? "#fff" : U.rgba(c, .5 + .5*t); g.lineWidth = k === L.length-1 ? 1.4 : .9; g.stroke(); });
  },
  // V11 混合噪聲場：底下是 Perlin 色階，疏密跟著噪聲起伏
  function(g, W, H, r, c, U){
    const ah = H/W, nz = U.vnoise(r()*1e6|0), nf = (x,y) => nz(x*3.2, y*3.2), d = .0085, sc = (x,y) => .45 + 1.5*nf(x,y);
    g.save(); g.globalAlpha = .55; U.field(g, W, H, 48, Math.round(48*ah), (i,j) => nf(i/47, j/47), "#2F6FE4", 1.2); g.restore();
    const C = []; for(let k = 0; k < 4; k++) C.push({p:ring(.25 + (k%2)*.5, ah*(.28 + (k>>1)*.44), .03, d), closed:true});
    grow({curves:C, d, R:d*2.4, sc, scMax:1.95, steps:160, maxN:1400, cons:box(.02, .02, .98, ah-.02)}, r);
    g.strokeStyle = "#fff"; g.lineWidth = .9; C.forEach(cv => { stroke(g, cv.p, true, p => [p[0]*W, p[1]*W]); g.stroke(); });
    g.strokeStyle = U.rgba(c, .9); g.lineWidth = .6; U.contour(24, Math.round(24*ah), (i,j) => nf(i/23, j/23), .5).forEach(([a,b]) => { const s = W/23; g.beginPath(); g.moveTo(a[0]*s, a[1]*s); g.lineTo(b[0]*s, b[1]*s); g.stroke(); });
  },
  // V12 插點策略三聯：隨機（不對稱）｜最長邊優先（規律）｜局部生長（舌狀）
  function(g, W, H, r, c, U){
    const pw = W/3, d = .032, cols = [c, "#F5F2EC", "#F2A007"];
    const opts = [{mode:"rand", pIns:.25}, {mode:"longest", k:4}, {mode:"mask", canGrow:(i,n) => i < n*.12}];
    opts.forEach((op, k) => { const C = [{p:ring(.5, 1, .1, d), closed:true}];
      grow(Object.assign({curves:C, d, R:d*2.4, steps:200, maxN:420, cons:box(.04, .04, .96, 1.96)}, op), r);
      const M = fitMap(k*pw + 4, 10, pw - 8, H - 20, 1, 2); g.fillStyle = U.rgba(cols[k], .12); stroke(g, C[0].p, true, M); g.fill(); g.strokeStyle = cols[k]; g.lineWidth = 1.2; g.stroke();
      if(k){ g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.setLineDash([3,4]); g.beginPath(); g.moveTo(k*pw, 8); g.lineTo(k*pw, H-8); g.stroke(); g.setLineDash([]); } });
  },
];
ART.var["B01"][11].ratio = .8;
ART.var["B01"][8].ratio = 1.1;
ART.var["B01"][9].ratio = 1.2;
ART.var["B01"][4].ratio = .85;

/* ---------------- 沒有照片的案例 ---------------- */
// B01-01 Differential Line：繪圖機紙上的黑色細線
ART.case["B01-01"] = function(g, W, H, r, c, U){
  const pw = W*.8, ph = H*.84, px = (W - pw)/2, py = (H - ph)/2;
  g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(px + 5, py + 6, pw, ph);
  g.fillStyle = "#EFEAE0"; g.fillRect(px, py, pw, ph);
  const aw = 1, ah = (ph - pw*.16)/(pw*.84), d = .0085, C = [{p:ring(.5, ah/2, .05, d), closed:true}];
  grow({curves:C, d, R:d*2.5, steps:190, maxN:1900, cons:box(.02, .02, .98, ah-.02)}, r);
  const M = fitMap(px + pw*.08, py + pw*.08, pw*.84, ph - pw*.16, aw, ah);
  g.strokeStyle = "#1A1A1F"; g.lineWidth = .7; g.lineJoin = "round"; stroke(g, C[0].p, true, M); g.stroke();
  g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 1; [[px+6,py+6,1,1],[px+pw-6,py+6,-1,1],[px+6,py+ph-6,1,-1],[px+pw-6,py+ph-6,-1,-1]].forEach(([x,y,sx,sy]) => { g.beginPath(); g.moveTo(x, y + sy*8); g.lineTo(x, y); g.lineTo(x + sx*8, y); g.stroke(); });
};
ART.case["B01-01"].ratio = 1.3;

// B01-02 Differential Mesh 3D：三角網格線框，頂點依生長強度著色，建模視窗感
ART.case["B01-02"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(r()*1e6|0), J = 10, rows = [];
  for(let j = 0; j <= J; j++){ const t = j/J, n = Math.max(1, j*9), row = []; for(let k = 0; k < n; k++){ const a = k/n*TAU + j*.2, st = nz(Math.cos(a)*2 + 5, Math.sin(a)*2 + 5), z = t*t*(.35*Math.sin(6*a + j*.3) + .25*(st - .5)*4*t); row.push([t*Math.cos(a)*.95, t*Math.sin(a)*.95, z, st*t]); } rows.push(row); }
  const ry = .5, tl = .95, sz = Math.min(W,H)*.44, pr = ([x,y,z]) => { const x1 = x*Math.cos(ry) - y*Math.sin(ry), y1 = x*Math.sin(ry) + y*Math.cos(ry), yy = y1*Math.cos(tl) - z*Math.sin(tl); return [W/2 + x1*sz, H*.5 + yy*sz]; };
  // 地面格線
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1;
  for(let k = -6; k <= 6; k++){ let a = pr([k/5, -1.3, -.4]), b = pr([k/5, 1.3, -.4]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); a = pr([-1.3, k/5, -.4]); b = pr([1.3, k/5, -.4]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
  // 三角連線：相鄰兩環
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .6;
  const P = rows.map(row => row.map(pr));
  for(let j = 0; j < J; j++){ const A = P[j], B = P[j+1];
    for(let k = 0; k < B.length; k++){ const b = B[k], b2 = B[(k+1)%B.length], a = A[Math.floor(k*A.length/B.length) % A.length]; g.beginPath(); g.moveTo(b[0],b[1]); g.lineTo(b2[0],b2[1]); g.lineTo(a[0],a[1]); g.closePath(); g.stroke(); } }
  rows.forEach((row,j) => row.forEach((v,k) => { const q = P[j][k], t = Math.min(1, v[3]*1.6); g.fillStyle = t > .55 ? "#F2A007" : U.rgba(c, .5 + t*.5); g.beginPath(); g.arc(q[0], q[1], 1.2 + t*2.2, 0, TAU); g.fill(); }));
  // 座標軸小圖示
  const ox = 18, oy = H - 18; [["#E4572E",[14,-4]],[c,[-6,-8]],["#2F6FE4",[0,-16]]].forEach(([col,[dx,dy]]) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(ox,oy); g.lineTo(ox+dx, oy+dy); g.stroke(); });
  g.strokeStyle = "rgba(255,255,255,.2)"; g.strokeRect(4.5, 4.5, W-9, H-9);
};
ART.case["B01-02"].ratio = .9;

// 花朵形荷葉邊（首飾、吊燈共用）：半徑 R、波數 k、相位 ph
function ruffle(g, cx, cy, R, k, ph, fill, line, sq){ g.beginPath(); for(let s = 0; s <= 120; s++){ const a = s/120*TAU, rr = R*(1 + .16*Math.sin(k*a + ph) + .06*Math.sin(3*k*a + ph*2)); const x = cx + rr*Math.cos(a), y = cy + rr*Math.sin(a)*(sq||1); s ? g.lineTo(x,y) : g.moveTo(x,y); } g.closePath(); if(fill){ g.fillStyle = fill; g.fill(); } if(line){ g.strokeStyle = line; g.stroke(); } }

// B01-03 Floraform 首飾：垂墜項圈上的荷葉邊花瓣珠
ART.case["B01-03"] = function(g, W, H, r, c, U){
  const vg = g.createRadialGradient(W/2, H*.45, 0, W/2, H*.45, W*.7); vg.addColorStop(0, "rgba(255,255,255,.08)"); vg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = vg; g.fillRect(0,0,W,H);
  // 頸部輪廓
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 2; g.beginPath(); g.moveTo(W*.28, 0); g.quadraticCurveTo(W*.3, H*.3, W*.12, H*.5); g.moveTo(W*.72, 0); g.quadraticCurveTo(W*.7, H*.3, W*.88, H*.5); g.stroke();
  const ch = t => [W*(.2 + .6*t), H*(.18 + .5*Math.sin(t*Math.PI))];
  g.strokeStyle = "rgba(230,230,230,.6)"; g.lineWidth = 1; g.beginPath(); for(let s = 0; s <= 40; s++){ const q = ch(s/40); s ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } g.stroke();
  const n = 7, rc = U.rgb(c);
  for(let i = 0; i < n; i++){ const t = .08 + .84*i/(n-1), [x,y] = ch(t), sz = Math.min(W,H)*(.04 + .045*Math.sin(t*Math.PI)**2), k = 5 + (i%3), ph = r()*TAU;
    for(let l = 4; l >= 0; l--){ const s = sz*(1 - l*.17), sh = .45 + .55*(1 - l/4); ruffle(g, x, y + l*1.2, s, k + l, ph + l*.7, `rgb(${rc[0]*sh + 60*(1-l/4)|0},${rc[1]*sh + 60*(1-l/4)|0},${rc[2]*sh + 60*(1-l/4)|0})`, "rgba(255,255,255,.35)"); }
    g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(x, y, sz*.12, 0, TAU); g.fill(); }
};
ART.case["B01-03"].ratio = .8;

// B01-04 Floraform 吊燈：吊線、荷葉邊燈罩、地面上的皺褶陰影
ART.case["B01-04"] = function(g, W, H, r, c, U){
  const cx = W/2, ly = H*.36, R = W*.26;
  // 光暈
  const gl = g.createRadialGradient(cx, ly, 0, cx, ly, W*.7); gl.addColorStop(0, "rgba(255,210,140,.35)"); gl.addColorStop(1, "rgba(255,210,140,0)"); g.fillStyle = gl; g.fillRect(0,0,W,H);
  // 地面光池與陰影紋
  const fy = H*.82; g.fillStyle = "rgba(255,220,170,.12)"; g.beginPath(); g.ellipse(cx, fy, W*.46, H*.1, 0, 0, TAU); g.fill();
  const d = .02, C = [{p:ring(.5, .5, .1, d), closed:true}]; grow({curves:C, d, R:d*2.4, steps:140, maxN:600, cons:box(.03,.03,.97,.97)}, r);
  g.strokeStyle = "rgba(10,10,14,.75)"; g.lineWidth = 1.6; stroke(g, C[0].p, true, p => [cx + (p[0]-.5)*W*.85, fy + (p[1]-.5)*H*.19]); g.stroke();
  // 吊線
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, ly - R*.5); g.stroke();
  // 燈罩：多層荷葉邊由上往下
  const rc = U.rgb(c);
  for(let l = 0; l < 7; l++){ const t = l/6, y = ly - R*.45 + t*R*.9, rr = R*(.35 + .65*Math.sin(Math.PI*(.15 + .75*t))), lit = .5 + .5*Math.sin(Math.PI*t);
    ruffle(g, cx, y, rr, 7 + l*2, l*1.3, `rgb(${Math.min(255, rc[0]*.6 + 150*lit)|0},${Math.min(255, rc[1]*.6 + 120*lit)|0},${Math.min(255, rc[2]*.6 + 80*lit)|0})`, "rgba(40,30,20,.5)", .32); }
  g.fillStyle = "rgba(255,240,210,.95)"; g.beginPath(); g.arc(cx, ly + R*.52, 4, 0, TAU); g.fill();
};
ART.case["B01-04"].ratio = 1.3;

// B01-05 2D 實驗系列：六格拼貼，每格一種變化（圓、方框、星形輸入、半邊生長、開放線、多顆種子）
ART.case["B01-05"] = function(g, W, H, r, c, U){
  const cols = 2, rows = 3, m = 6, cw = (W - m*(cols+1))/cols, ch = (H - m*(rows+1))/rows, d = .03;
  const star = []; for(let i = 0; i < 40; i++){ const a = i/40*TAU, rr = i%8 < 4 ? .22 : .12; star.push([.5 + rr*Math.cos(a), .5 + rr*Math.sin(a), 0]); }
  const sq = [[.12,.12],[.88,.12],[.88,.88],[.12,.88]];
  const set = [
    () => [{curves:[{p:ring(.5,.5,.08,d), closed:true}]}, null],
    () => [{curves:[{p:ring(.5,.5,.08,d), closed:true}], cons:polyCons(sq,.5,.5)}, sq],
    () => [{curves:[{p:star, closed:true}]}, null],
    () => [{curves:[{p:ring(.5,.5,.1,d), closed:true}], mode:"mask", canGrow:(i,n) => i < n/2}, null],
    () => [{curves:[{p:segLine(.08,.5,.92,.5,d), closed:false, fix:true}]}, null],
    () => [{curves:[{p:ring(.3,.3,.05,d), closed:true},{p:ring(.7,.35,.05,d), closed:true},{p:ring(.5,.72,.05,d), closed:true}]}, null],
  ];
  set.forEach((f, k) => { const [o, frame] = f(), x = m + (k%cols)*(cw + m), y = m + ((k/cols)|0)*(ch + m);
    grow(Object.assign({d, R:d*2.3, steps:90, maxN:260, cons:o.cons || box(.05,.05,.95,.95)}, o), r);
    g.fillStyle = k%3 === 1 ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.035)"; g.fillRect(x, y, cw, ch);
    const M = fitMap(x + 3, y + 3, cw - 6, ch - 6, 1, 1);
    if(frame){ g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.5; stroke(g, frame, true, M); g.stroke(); }
    g.strokeStyle = k%2 ? "#F5F2EC" : c; g.lineWidth = 1.1; g.lineJoin = "round";
    o.curves.forEach(cv => { if(cv.closed){ g.fillStyle = U.rgba(c, .15); stroke(g, cv.p, true, M); g.fill(); } stroke(g, cv.p, cv.closed, M); g.stroke(); }); });
};
ART.case["B01-05"].ratio = 1.35;

// B01-06 有機迷宮：圓形迷宮牆，貼圖控制走道寬窄，中心是終點、外圈留入口
ART.case["B01-06"] = function(g, W, H, r, c, U){
  const d = .011, nz = U.vnoise(r()*1e6|0), sc = (x,y) => .7 + 1.1*Math.max(0, Math.min(1, (Math.sin((x+y)*12)*.5 + .5)*.6 + nz(x*5,y*5)*.4));
  const circ = []; for(let i = 0; i < 64; i++){ const a = i/64*TAU; circ.push([.5 + .47*Math.cos(a), .5 + .47*Math.sin(a)]); }
  const C = [{p:ring(.5, .5, .06, d), closed:true}, {p:ring(.3, .3, .03, d), closed:true}, {p:ring(.7, .68, .03, d), closed:true}];
  grow({curves:C, d, R:d*2.6, sc, scMax:1.8, steps:140, maxN:900, cons:polyCons(circ, .5, .5)}, r);
  const M = fitMap(8, 8, W-16, H-16, 1, 1), s0 = M([0,0]), s1 = M([1,1]), cr = (s1[0]-s0[0])*.5;
  g.fillStyle = "#0F0F13"; g.beginPath(); g.arc((s0[0]+s1[0])/2, (s0[1]+s1[1])/2, cr*.97, 0, TAU); g.fill();
  g.lineCap = "round"; g.lineJoin = "round";
  C.forEach(cv => { stroke(g, cv.p, true, M); g.strokeStyle = U.rgba(c, .9); g.lineWidth = Math.max(2.5, W*.013); g.stroke(); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8; g.stroke(); });
  // 外牆（留一個入口）
  g.strokeStyle = "#F5F2EC"; g.lineWidth = 3.5; g.beginPath(); g.arc((s0[0]+s1[0])/2, (s0[1]+s1[1])/2, cr*.97, -1.3, TAU - 1.6); g.stroke();
  g.fillStyle = "#F2A007"; g.beginPath(); g.arc((s0[0]+s1[0])/2, (s0[1]+s1[1])/2, 4, 0, TAU); g.fill();
};
ART.case["B01-06"].ratio = 1;

// B01-07 Deep Facade：透視立面屏風，鑄鋁板上浮著生長紋
ART.case["B01-07"] = function(g, W, H, r, c, U){
  const d = .024, C = [{p:ring(.5, .5, .1, d), closed:true}]; grow({curves:C, d, R:d*2.4, steps:130, maxN:500, cons:box(.06,.06,.94,.94)}, r);
  // 立面四角（兩點透視的一片牆）
  const TL = [W*.08, H*.1], TR = [W*.9, H*.24], BR = [W*.9, H*.8], BL = [W*.08, H*.92];
  const bil = (u,v) => { const tx = TL[0] + (TR[0]-TL[0])*u, ty = TL[1] + (TR[1]-TL[1])*u, bx = BL[0] + (BR[0]-BL[0])*u, by = BL[1] + (BR[1]-BL[1])*u; return [tx + (bx-tx)*v, ty + (by-ty)*v]; };
  // 地面
  g.fillStyle = "rgba(255,255,255,.04)"; g.beginPath(); g.moveTo(0, H); g.lineTo(BL[0], BL[1]); g.lineTo(BR[0], BR[1]); g.lineTo(W, BR[1] + H*.05); g.lineTo(W, H); g.fill();
  const nc = 4, nr = 3, gap = .012;
  for(let j = 0; j < nr; j++) for(let i = 0; i < nc; i++){
    const u0 = i/nc + gap, u1 = (i+1)/nc - gap, v0 = j/nr + gap, v1 = (j+1)/nr - gap, sh = 80 + 40*(i/nc) + 20*((i+j)%2);
    g.fillStyle = `rgb(${sh},${sh+4},${sh+10})`; g.beginPath(); [[u0,v0],[u1,v0],[u1,v1],[u0,v1]].forEach(([u,v],k) => { const q = bil(u,v); k ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); }); g.closePath(); g.fill();
    // 每片板旋轉／鏡射生長紋，讓板片之間有差異
    const rot = (i + j*2)%4, mp = p => { let [x,y] = p; for(let k = 0; k < rot; k++) [x,y] = [1-y, x]; return bil(u0 + (u1-u0)*x, v0 + (v1-v0)*y); };
    g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 2.2; stroke(g, C[0].p, true, p => { const q = mp(p); return [q[0]+1, q[1]+1.2]; }); g.stroke();
    g.strokeStyle = (i+j)%3 ? "#D8DDE3" : c; g.lineWidth = 1.3; stroke(g, C[0].p, true, mp); g.stroke();
  }
  // 人的尺度
  g.fillStyle = "rgba(255,255,255,.55)"; const hx = W*.8, hy = BR[1] + H*.06, hh = H*.14; g.beginPath(); g.arc(hx, hy - hh, hh*.09, 0, TAU); g.fill(); g.fillRect(hx - hh*.07, hy - hh*.9, hh*.14, hh*.9);
};
ART.case["B01-07"].ratio = 1.05;

// B01-08 LSAM 珊瑚模組：工廠內龍門式大型擠出機正在列印「毒菌珊瑚」模組（低角度立面），
// 細柄往上逐層換成生長曲線、層層外擴成傘蓋；最上層正在擠出（橘色熱料），左上小窗是該層平面
ART.case["B01-08"] = function(g, W, H, r, c, U){
  const d = .026, C = [{p:ring(0, 0, .1, d), closed:true}], at = []; for(let s = 3; s < 110; s += 7) at.push(s);
  const sn = grow({curves:C, d, R:d*2.4, steps:110, maxN:420, snap:at, cons:p => { const l = Math.hypot(p[0],p[1]); if(l > .5){ p[0] *= .5/l; p[1] *= .5/l; } }}, r);
  const fy = H*.86, cx = W*.5, S = W*.72, stemN = 7, lh = H*.018, base = ring(0, 0, .1, d);
  // 廠房：地坪、背牆接縫
  g.fillStyle = "rgba(255,255,255,.035)"; g.fillRect(0, fy, W, H - fy);
  g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 1; for(let x = W*.1; x < W; x += W*.2){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, fy); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.moveTo(0, fy); g.lineTo(W, fy); g.stroke();
  // 列印床
  g.fillStyle = "#3A3A44"; g.fillRect(W*.16, fy - 6, W*.68, 6);
  // 各層：柄（固定小圓）＋傘蓋（生長各代），低角度投影
  const layers = []; for(let i = 0; i < stemN; i++) layers.push(base); sn.forEach(fr => layers.push(fr[0].p));
  const Lz = k => fy - 6 - (k + 1)*lh, M = z => p => [cx + p[0]*S, z + p[1]*S*.16];
  layers.forEach((P, k) => { if(k === layers.length - 1) return; const t = k/(layers.length - 1), sh = 95 + 70*t|0;
    stroke(g, P, true, M(Lz(k))); g.fillStyle = `rgb(${sh},${sh+2},${sh+6})`; g.fill(); g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = .8; g.stroke(); });
  // 正在擠出的最上層：前 70% 是熱料
  const top = layers[layers.length - 1], zt = Lz(layers.length - 1), cut = (top.length*.7)|0, TM = M(zt);
  g.strokeStyle = "rgba(242,160,7,.3)"; g.lineWidth = 3; g.lineCap = "round"; g.beginPath(); for(let i = 0; i <= cut; i++){ const q = TM(top[i]); i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } g.stroke();
  g.strokeStyle = "#F2A007"; g.lineWidth = 1.2; g.stroke();
  const nzp = TM(top[cut]);
  // 龍門架：兩柱、橫樑、滑車、擠出頭
  const by = H*.1; g.fillStyle = "#4A4A56"; g.fillRect(W*.05, by, W*.04, fy - by); g.fillRect(W*.91, by, W*.04, fy - by); g.fillRect(W*.05, by, W*.9, H*.03);
  g.fillStyle = "#6A6A78"; g.fillRect(nzp[0] - W*.06, by - 3, W*.12, H*.05);
  g.fillStyle = "#55555F"; g.fillRect(nzp[0] - W*.02, by + H*.05, W*.04, nzp[1] - by - H*.1);
  g.fillStyle = "#E8E8EE"; g.beginPath(); g.moveTo(nzp[0] - W*.035, nzp[1] - H*.05); g.lineTo(nzp[0] + W*.035, nzp[1] - H*.05); g.lineTo(nzp[0] + 3, nzp[1] - 3); g.lineTo(nzp[0] - 3, nzp[1] - 3); g.closePath(); g.fill();
  const gl = g.createRadialGradient(nzp[0], nzp[1], 0, nzp[0], nzp[1], W*.08); gl.addColorStop(0, "rgba(242,160,7,.6)"); gl.addColorStop(1, "rgba(242,160,7,0)"); g.fillStyle = gl; g.fillRect(nzp[0] - W*.1, nzp[1] - W*.1, W*.2, W*.2);
  // 左上小窗：本層刀具路徑平面
  const iw = W*.2, ix = W*.12, iy = H*.16; g.fillStyle = "#101014"; g.fillRect(ix, iy, iw, iw); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.strokeRect(ix, iy, iw, iw);
  g.strokeStyle = c; g.lineWidth = .9; stroke(g, top, true, p => [ix + iw/2 + p[0]*iw*.9, iy + iw/2 + p[1]*iw*.9]); g.stroke();
};
ART.case["B01-08"].ratio = 1.15;

// B01-09 Cellular Forms：3D 生長點當細胞，球體堆出皺褶雕塑
// 展間裡三件台座上的細胞雕塑：高聳如植物、扁平如珊瑚、團塊如內臟；每件都是 3D 生長點畫成球體細胞
ART.case["B01-09"] = function(g, W, H, r, c, U){
  const fy = H*.8, rc = U.rgb(c);
  // 牆、地、頂燈光錐
  g.fillStyle = "rgba(255,255,255,.03)"; g.fillRect(0, 0, W, fy); g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(0, fy, W, H - fy);
  const works = [
    {x:.2, pw:.2, ph:.2, sz:.36, lim:p => [Math.hypot(p[0],p[2]) > .12 ? -p[0]*.08 : 0, Math.abs(p[1]) > .55 ? -p[1]*.05 : 0, Math.hypot(p[0],p[2]) > .12 ? -p[2]*.08 : 0]},   // 高聳
    {x:.54, pw:.3, ph:.12, sz:.5, lim:p => [Math.hypot(p[0],p[2]) > .45 ? -p[0]*.05 : 0, Math.abs(p[1]) > .1 ? -p[1]*.12 : 0, Math.hypot(p[0],p[2]) > .45 ? -p[2]*.05 : 0]}, // 扁平珊瑚
    {x:.84, pw:.18, ph:.28, sz:.34, lim:p => { const l = Math.hypot(p[0],p[1],p[2]) || 1; return l > .3 ? [-p[0]/l*.012, -p[1]/l*.012, -p[2]/l*.012] : [0,0,0]; }},             // 團塊
  ];
  works.forEach((w, k) => {
    const cx = W*w.x, pt = fy - H*w.ph;
    const sp = g.createLinearGradient(cx, 0, cx, fy); sp.addColorStop(0, "rgba(255,240,210,.14)"); sp.addColorStop(1, "rgba(255,240,210,0)");
    g.fillStyle = sp; g.beginPath(); g.moveTo(cx - W*.02, 0); g.lineTo(cx + W*.02, 0); g.lineTo(cx + W*w.pw*.8, pt); g.lineTo(cx - W*w.pw*.8, pt); g.fill();
    // 台座
    g.fillStyle = "#D9D6CF"; g.fillRect(cx - W*w.pw/2, pt, W*w.pw, fy - pt); g.fillStyle = "#EDEAE3"; g.fillRect(cx - W*w.pw/2, pt - 3, W*w.pw, 4);
    g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(cx + W*w.pw/2, pt + 4, 4, fy - pt - 4);
    // 生長
    const d = .045, C = [{p:ring(0, 0, .08, d, .06, r), closed:true}, {p:ring(0, 0, .07, d, .06, r).map(p => [p[0], p[2], p[1]]), closed:true}];
    grow({curves:C, d3:true, d, R:d*2.1, steps:90, maxN:220, force:w.lim}, r);
    const ay = .6 + k, ax = .25, sz = W*w.sz, pr = p => { const x = p[0]*Math.cos(ay) - p[2]*Math.sin(ay), z1 = p[0]*Math.sin(ay) + p[2]*Math.cos(ay), y = p[1]*Math.cos(ax) - z1*Math.sin(ax), z = p[1]*Math.sin(ax) + z1*Math.cos(ax); return [x*sz, y*sz, z]; };
    const pts = []; C.forEach(cv => cv.p.forEach(p => pts.push(pr(p)))); pts.sort((a,b) => b[2] - a[2]);
    const rad = d*sz*.75, ymax = Math.max(...pts.map(q => q[1])), oy = pt - 2 - ymax - rad*.6;
    pts.forEach(([x,y,z]) => { x += cx; y += oy; const t = Math.max(0, Math.min(1, .55 - z*1.2)), kk = .35 + .65*t, gr = g.createRadialGradient(x - rad*.35, y - rad*.45, rad*.1, x, y, rad);
      gr.addColorStop(0, `rgb(${Math.min(255, rc[0]*kk + 120*t)|0},${Math.min(255, rc[1]*kk + 110*t)|0},${Math.min(255, rc[2]*kk + 90*t)|0})`); gr.addColorStop(1, `rgb(${rc[0]*kk*.35|0},${rc[1]*kk*.35|0},${rc[2]*kk*.35|0})`);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); });
  });
};
ART.case["B01-09"].ratio = .8;

// B01-10 Kangaroo 在網格曲面上：Rhino 視窗、圓頂網格、投影上去的生長曲線與錨點
ART.case["B01-10"] = function(g, W, H, r, c, U){
  const d = .014, C = [{p:ring(.5, .5, .08, d), closed:true}]; grow({curves:C, d, R:d*2.4, steps:170, maxN:1100, cons:box(.04,.04,.96,.96)}, r);
  const S = (u,v) => { const x = (u-.5)*2, y = (v-.5)*2; return [x, y, .75*Math.exp(-(x*x + y*y)*1.1) + .12*Math.sin(x*2)]; };
  const cam = [.0, -3.2, 2.0], pr = ([x,y,z]) => { const dy = y - cam[1], dz = z - cam[2], ang = .55, yy = dy*Math.cos(ang) - dz*Math.sin(ang), zz = dy*Math.sin(ang) + dz*Math.cos(ang), k = Math.min(W,H)*1.15/yy; return [W/2 + x*k, H*.5 - zz*k]; };
  // 視窗地面格線
  g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1;
  for(let k = -5; k <= 5; k++){ let a = pr([k*.3, -1.5, 0]), b = pr([k*.3, 1.5, 0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); a = pr([-1.5, k*.3, 0]); b = pr([1.5, k*.3, 0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
  // 網格曲面（四邊形線框）
  g.strokeStyle = "rgba(200,205,215,.4)"; g.lineWidth = .7; const n = 16;
  for(let k = 0; k <= n; k++){ g.beginPath(); for(let s = 0; s <= 40; s++){ const q = pr(S(k/n, s/40)); s ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } g.stroke(); g.beginPath(); for(let s = 0; s <= 40; s++){ const q = pr(S(s/40, k/n)); s ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } g.stroke(); }
  g.strokeStyle = c; g.lineWidth = 1.3; stroke(g, C[0].p, true, p => pr(S(p[0], p[1]))); g.stroke();
  // Kangaroo 錨點
  [[0,0],[1,0],[1,1],[0,1]].forEach(([u,v]) => { const q = pr(S(u,v)); g.fillStyle = "#E4572E"; g.fillRect(q[0]-3.5, q[1]-3.5, 7, 7); });
  g.strokeStyle = "rgba(255,255,255,.25)"; g.strokeRect(4.5, 4.5, W-9, H-9); g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(4.5, 4.5, W-9, 9);
};
ART.case["B01-10"].ratio = .85;

// B01-11 Houdini：左側節點網路、右側視窗，點依噪聲屬性著色
ART.case["B01-11"] = function(g, W, H, r, c, U){
  const nw = W*.36;
  g.fillStyle = "#101014"; g.fillRect(0, 0, nw, H); g.strokeStyle = "rgba(255,255,255,.15)"; g.beginPath(); g.moveTo(nw, 0); g.lineTo(nw, H); g.stroke();
  // 節點鏈
  const nodes = 6, nh = H*.07, nwid = nw*.62; let prev = null;
  for(let i = 0; i < nodes; i++){ const x = nw*.19 + (i === 3 ? nw*.1 : 0), y = H*.08 + i*H*.15;
    if(prev){ g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(prev[0], prev[1]); g.bezierCurveTo(prev[0], prev[1] + 12, x + nwid/2, y - 12, x + nwid/2, y); g.stroke(); }
    g.fillStyle = i === 3 ? U.rgba(c, .85) : i === nodes-1 ? "#2F6FE4" : "#3A3A46"; g.beginPath(); g.roundRect ? g.roundRect(x, y, nwid, nh, 4) : g.rect(x, y, nwid, nh); g.fill();
    g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(x + 5, y + nh*.4, nwid*.45, 2);
    if(i === 2 || i === 4){ g.strokeStyle = "#F2A007"; g.lineWidth = 1; g.beginPath(); g.arc(x + nwid + 8, y + nh/2, 4, 0, TAU); g.stroke(); }
    prev = [x + nwid/2, y + nh]; }
  // 視窗：點依噪聲著色
  const vw = W - nw, ah = H/vw, nz = U.vnoise(r()*1e6|0), nf = (x,y) => nz(x*3.5, y*3.5), d = .011, sc = (x,y) => .55 + 1.2*nf(x,y);
  const C = [{p:ring(.5, ah/2, .06, d), closed:true}]; grow({curves:C, d, R:d*2.4, sc, scMax:1.75, steps:190, maxN:1500, cons:box(.05,.05,.95,ah-.05)}, r);
  const M = p => [nw + p[0]*vw, p[1]*vw], P = C[0].p;
  g.lineWidth = 1;
  for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1)%P.length], t = nf(a[0], a[1]); g.strokeStyle = `hsl(${140 - t*120},70%,${45 + t*20}%)`; const p = M(a), q = M(b); g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); }
};
ART.case["B01-11"].ratio = .8;

// B01-12 互動引導：筆刷沿拖曳路徑讓生長變密，下方滑桿
ART.case["B01-12"] = function(g, W, H, r, c, U){
  const ah = (H - 40)/W, path = []; for(let i = 0; i <= 20; i++){ const t = i/20; path.push([.12 + .76*t, ah*(.5 + .3*Math.sin(t*5 + 1))]); }
  const near = (x,y) => { let b = 1e9; for(const q of path) b = Math.min(b, Math.hypot(x-q[0], y-q[1])); return b; };
  const d = .01, sc = (x,y) => .5 + 1.2*Math.min(1, near(x,y)/.2);
  const C = [{p:ring(.5, ah*.5, .05, d), closed:true}, {p:ring(.2, ah*.3, .03, d), closed:true}];
  grow({curves:C, d, R:d*2.4, sc, scMax:1.75, steps:150, maxN:1100, cons:box(.03,.03,.97,ah-.03)}, r);
  const M = p => [p[0]*W, p[1]*W];
  g.strokeStyle = c; g.lineWidth = 1; C.forEach(cv => { stroke(g, cv.p, true, M); g.stroke(); });
  // 拖曳路徑與筆刷游標
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1.5; g.setLineDash([5,4]); stroke(g, path, false, M); g.stroke(); g.setLineDash([]);
  const e = M(path[path.length-1]); g.fillStyle = "rgba(255,255,255,.1)"; g.beginPath(); g.arc(e[0], e[1], W*.1, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); g.moveTo(e[0], e[1]); g.lineTo(e[0] + 4, e[1] + 14); g.lineTo(e[0] + 7, e[1] + 9); g.lineTo(e[0] + 13, e[1] + 11); g.closePath(); g.fill();
  // 滑桿列
  g.fillStyle = "#101014"; g.fillRect(0, H - 40, W, 40);
  [.3, .65].forEach((v, k) => { const y = H - 28 + k*16; g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 2; g.beginPath(); g.moveTo(W*.1, y); g.lineTo(W*.9, y); g.stroke(); g.strokeStyle = c; g.beginPath(); g.moveTo(W*.1, y); g.lineTo(W*(.1 + .8*v), y); g.stroke(); g.fillStyle = "#fff"; g.beginPath(); g.arc(W*(.1 + .8*v), y, 4.5, 0, TAU); g.fill(); });
};
ART.case["B01-12"].ratio = 1.2;

// B01-13 Cabbage 開放曲面：葉片自由邊長得快而起波，畫等參線與發亮的邊界
ART.case["B01-13"] = function(g, W, H, r, c, U){
  const ph = r()*TAU, S = (u,v) => { const w = (v-.5)*2, half = Math.sin(Math.PI*u)*.45 + .05, e = Math.abs(w)**3; return [ (u-.5)*1.7, w*half, .35*Math.sin(Math.PI*u)*(1 - w*w)*.5 + e*(.08*Math.sin(u*31 + ph + (w > 0 ? 0 : 1.7)) + .05*Math.sin(u*57 + ph*2)) + (u-.5)*.3 ]; };
  const sz = Math.min(W,H)*.5, rot = -.55, pr = ([x,y,z]) => { const X = x*Math.cos(rot) - y*Math.sin(rot), Y = x*Math.sin(rot) + y*Math.cos(rot); return [W/2 + X*sz, H*.52 + Y*sz*.55 - z*sz]; };
  const nu = 40, nv = 14, rc = U.rgb(c), F = [];
  for(let i = 0; i < nu; i++) for(let j = 0; j < nv; j++){ const a = S(i/nu, j/nv), b = S((i+1)/nu, j/nv), e = S((i+1)/nu, (j+1)/nv), f = S(i/nu, (j+1)/nv);
    const ux = e[0]-a[0], uy = e[1]-a[1], uz = e[2]-a[2], vx = f[0]-b[0], vy = f[1]-b[1], vz = f[2]-b[2], nz = ux*vy - uy*vx, nl = Math.hypot(uy*vz-uz*vy, uz*vx-ux*vz, nz) || 1;
    F.push([[a,b,e,f].map(pr), (a[1]+e[1])/2 - (a[2]+e[2])*.3, Math.abs(nz/nl)]); }
  F.sort((s,t) => s[1] - t[1]);
  F.forEach(([P,,l]) => { const k = .3 + .7*l; g.fillStyle = `rgb(${rc[0]*k|0},${rc[1]*k|0},${rc[2]*k|0})`; g.beginPath(); P.forEach((q,i) => i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1])); g.closePath(); g.fill(); g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = .5; g.stroke(); });
  // 中肋與自由邊界
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.2; g.beginPath(); for(let i = 0; i <= 60; i++){ const q = pr(S(i/60, .5)); i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } g.stroke();
  g.strokeStyle = "#F2A007"; g.lineWidth = 1.8; [0, 1].forEach(v => { g.beginPath(); for(let i = 0; i <= 120; i++){ const q = pr(S(i/120, v)); i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } g.stroke(); });
};
ART.case["B01-13"].ratio = .85;
})();
