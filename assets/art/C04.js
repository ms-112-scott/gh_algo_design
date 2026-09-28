/* C04 Perlin 雜訊地形：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
const TAU = Math.PI*2;
const ACC = "#F2A007"; // 少量第二色點綴

/* ---------- 共用小工具 ---------- */
// 家族色明暗：k<1 變暗、k>1 往白色推
function sh(c, k, a){ const [R,G,B] = U.rgb(c), f = v => Math.round(k >= 1 ? v + (255-v)*Math.min(1,k-1) : v*k); return `rgba(${f(R)},${f(G)},${f(B)},${a == null ? 1 : a})`; }
const sd = r => (r()*1e6)|0;
const cl = t => t < 0 ? 0 : t > 1 ? 1 : t;
const lerp = (a, b, t) => a + (b-a)*t;
// 疊層雜訊（fBm），回傳約 0–1
function fbm(nz, x, y, oct){ let s = 0, a = 1, f = 1, t = 0; for(let o = 0; o < (oct||4); o++){ s += nz(x*f + o*17.3, y*f - o*9.1)*a; t += a; a *= .5; f *= 2; } return s/t; }
// 把 0–1 拉開對比
const stretch = (v, lo, hi) => cl((v-lo)/(hi-lo));
// 格點高度場
function grid(n, m, f){ const h = new Float32Array(n*m); for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) h[j*n+i] = f(i, j); return h; }
// 逐像素畫到離屏 canvas，fn 回傳 [r,g,b,a?]
function cvs(n, m, fn){
  const off = document.createElement("canvas"); off.width = n; off.height = m; const x = off.getContext("2d"), img = x.createImageData(n, m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const col = fn(i, j), k = (j*n+i)*4; if(!col) continue; img.data[k] = col[0]; img.data[k+1] = col[1]; img.data[k+2] = col[2]; img.data[k+3] = col.length > 3 ? col[3] : 255; }
  x.putImageData(img, 0, 0); return off;
}
function pix(g, x0, y0, w, h, n, m, fn){ g.imageSmoothingEnabled = true; g.drawImage(cvs(n, m, fn), x0, y0, w, h); }
// 多段色帶：stops = [[t,[r,g,b]], ...]
function ramp(stops){ return t => { t = cl(t); for(let i = 1; i < stops.length; i++) if(t <= stops[i][0]){ const [t0,a] = stops[i-1], [t1,b] = stops[i], k = (t-t0)/((t1-t0)||1); return [lerp(a[0],b[0],k), lerp(a[1],b[1],k), lerp(a[2],b[2],k)]; } return stops[stops.length-1][1]; }; }
function mixc(a, b, t){ return [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)]; }
const DARK = [21,21,27], WHITE = [255,255,255], ACCR = U.rgb(ACC);
// 山影（hillshade）：由鄰格高差求法線，光從左上來
function shade(h, n, m, i, j, k){
  const a = h[j*n + Math.max(0,i-1)], b = h[j*n + Math.min(n-1,i+1)], c = h[Math.max(0,j-1)*n + i], d = h[Math.min(m-1,j+1)*n + i];
  const nx = (a-b)*k, ny = (c-d)*k, l = Math.hypot(nx, ny, 1);
  return cl((nx*-.6 + ny*-.6 + 1*.55)/l + .25);
}
// 等值線
function iso(g, n, m, h, v, sx, sy, ox, oy){ g.beginPath(); U.contour(n, m, (i,j) => h[j*n+i], v).forEach(([a,b]) => { g.moveTo((ox||0) + a[0]*sx, (oy||0) + a[1]*sy); g.lineTo((ox||0) + b[0]*sx, (oy||0) + b[1]*sy); }); g.stroke(); }
function q4(g, a, b, c, d){ g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.lineTo(c[0],c[1]); g.lineTo(d[0],d[1]); g.closePath(); }
function rrect(g, x, y, w, h, rad){ g.beginPath(); g.moveTo(x+rad,y); g.arcTo(x+w,y,x+w,y+h,rad); g.arcTo(x+w,y+h,x,y+h,rad); g.arcTo(x,y+h,x,y,rad); g.arcTo(x,y,x+w,y,rad); g.closePath(); }
function arrow(g, x, y, a, len, head){ const x2 = x + Math.cos(a)*len, y2 = y + Math.sin(a)*len; g.beginPath(); g.moveTo(x,y); g.lineTo(x2,y2);
  g.moveTo(x2,y2); g.lineTo(x2 - Math.cos(a-.5)*head, y2 - Math.sin(a-.5)*head); g.moveTo(x2,y2); g.lineTo(x2 - Math.cos(a+.5)*head, y2 - Math.sin(a+.5)*head); g.stroke(); }
// 等角方塊（頂面＋兩個朝向觀者的側面）
function box(g, P, x, y, z, dz, top, left, right, line){
  q4(g, P(x+1,y,z), P(x+1,y+1,z), P(x+1,y+1,z+dz), P(x+1,y,z+dz)); g.fillStyle = right; g.fill(); if(line){ g.strokeStyle = line; g.stroke(); }
  q4(g, P(x,y+1,z), P(x+1,y+1,z), P(x+1,y+1,z+dz), P(x,y+1,z+dz)); g.fillStyle = left; g.fill(); if(line){ g.strokeStyle = line; g.stroke(); }
  q4(g, P(x,y,z+dz), P(x+1,y,z+dz), P(x+1,y+1,z+dz), P(x,y+1,z+dz)); g.fillStyle = top; g.fill(); if(line){ g.strokeStyle = line; g.stroke(); }
}
function proj(ox, oy, u){ return (x,y,z) => [ox + (x - y)*u*.866, oy + (x + y)*u*.5 - z*u]; }

/* ================= 變形 ================= */
ART.var["C04"] = [
  // V01 脊狀雜訊：俯視山影圖，1 − |n| 的尖銳山脊以白線標出
  function(g, W, H, r, c, U){
    const nz = U.vnoise(sd(r)), n = Math.round(W/2), m = Math.round(H/2), C = U.rgb(c), sc = 3.2/n;
    const h = grid(n, m, (i,j) => { let s = 0, a = 1, f = 1, t = 0; for(let o = 0; o < 5; o++){ let q = 1 - Math.abs(2*nz(i*sc*f + o*7, j*sc*f - o*3) - 1); q *= q; s += q*a; t += a; a *= .5; f *= 2; } return s/t; });
    pix(g, 0, 0, W, H, n, m, (i,j) => { const v = h[j*n+i], l = shade(h, n, m, i, j, 9); return mixc(mixc(DARK, C, stretch(v,.15,.75)*l), WHITE, Math.max(0, l-.85)*1.8); });
    g.lineWidth = 1; g.strokeStyle = "rgba(255,255,255,.75)"; iso(g, n, m, h, .72, W/(n-1), H/(m-1));
    g.strokeStyle = "rgba(255,255,255,.25)"; iso(g, n, m, h, .6, W/(n-1), H/(m-1));
  },
  // V02 Domain warping：大理石流紋，上面疊一張被扭曲的座標格網
  function(g, W, H, r, c, U){
    const nz = U.vnoise(sd(r)), n = Math.round(W/2), m = Math.round(H/2), C = U.rgb(c), sc = 3/n, k = 4;
    const warp = (x, y) => [fbm(nz, x, y, 3), fbm(nz, x + 5.2, y + 1.3, 3)];
    pix(g, 0, 0, W, H, n, m, (i,j) => { const x = i*sc, y = j*sc, [qx,qy] = warp(x,y), v = fbm(nz, x + k*qx, y + k*qy, 4);
      const band = .5 + .5*Math.sin(v*22 + qx*6); return mixc(mixc(DARK, C, stretch(v,.3,.7)), WHITE, Math.pow(band, 6)*.7); });
    // 被扭曲的格網：原本筆直的經緯線
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8; const step = W/9;
    for(let d = 0; d < 2; d++) for(let t = step/2; t < (d ? H : W); t += step){ g.beginPath();
      for(let s = 0; s <= (d ? W : H); s += 4){ const px = d ? s : t, py = d ? t : s, [qx,qy] = warp(px/2*sc, py/2*sc), X = px + (qx-.5)*step*2.2, Y = py + (qy-.5)*step*2.2; s ? g.lineTo(X,Y) : g.moveTo(X,Y); } g.stroke(); }
  },
  // V03 階梯化梯田：平面色階＋下方剖面條（切線以虛線標示）
  function(g, W, H, r, c, U){
    const nz = U.vnoise(sd(r)), ph = H*.7, n = Math.round(W/2.2), m = Math.round(ph/2.2), L = 7, sc = 2.6/n;
    const hr = grid(n, m, (i,j) => stretch(fbm(nz, i*sc, j*sc, 4), .25, .75));
    const hq = hr.map(v => Math.min(L-1, Math.floor(v*L))/(L-1));
    pix(g, 0, 0, W, ph, n, m, (i,j) => { const v = hq[j*n+i]; return mixc(DARK, mixc(U.rgb(c), WHITE, v*.5), .25 + v*.75); });
    // 台地邊緣：先畫陰影再畫亮邊
    for(let l = 1; l < L; l++){ const v = l/L - .001;
      g.lineWidth = 2.2; g.strokeStyle = "rgba(0,0,0,.45)"; iso(g, n, m, hr, v, W/(n-1), ph/(m-1), 1.5, 1.5);
      g.lineWidth = 1; g.strokeStyle = "rgba(255,255,255,.7)"; iso(g, n, m, hr, v, W/(n-1), ph/(m-1)); }
    // 剖切線
    const cj = Math.round(m*.55), cy = cj*ph/(m-1); g.setLineDash([5,4]); g.strokeStyle = ACC; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0,cy); g.lineTo(W,cy); g.stroke(); g.setLineDash([]);
    // 剖面：階梯輪廓
    const y0 = H*.97, sh0 = H*.22; g.fillStyle = "#0E0E12"; g.fillRect(0, ph, W, H-ph);
    g.beginPath(); g.moveTo(0, y0);
    for(let i = 0; i < n; i++){ const x = i*W/(n-1), v = hq[cj*n+i]; g.lineTo(x, y0 - (.15 + v*.85)*sh0); }
    g.lineTo(W, y0); g.closePath(); g.fillStyle = sh(c,.55); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.3; g.stroke();
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; for(let l = 0; l < L; l++){ const y = y0 - (.15 + l/(L-1)*.85)*sh0; g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
  },
  // V04 吸引點遮罩：透視線框地形，一個吸引點抬起島嶼、另一個壓出盆地；海平面以下是水面，地面上標出衰減半徑
  function(g, W, H, r, c, U){
    const nz = U.vnoise(sd(r)), G = 44, A = [(r()-.5)*.4 - .25, .42], B = [.55 + (r()-.5)*.2, .62], RA = .8, RB = .45, SEA = .1;
    const ss = t => t*t*(3 - 2*t);
    const mask = (X, Y) => { const dA = cl(1 - Math.hypot(X - A[0], (Y - A[1])*2)/RA), dB = cl(1 - Math.hypot(X - B[0], (Y - B[1])*2)/RB); return ss(dA)*1.25 - ss(dB)*.6; };
    const hf = (X, Y) => (fbm(nz, X*3.5 + 5, Y*7, 4)*.7 + .3)*mask(X, Y);
    const P = (X, Y, h) => { const d = 1 + Y*2.2; return [W/2 + X*W*.62/d, H*.22 + H*.72/d - h*H*.4/d]; };
    const ring = (C, R, col, dash) => { g.setLineDash(dash); g.strokeStyle = col; g.lineWidth = 1.2; g.beginPath();
      for(let k = 0; k <= 72; k++){ const a = k/72*TAU, p = P(C[0] + Math.cos(a)*R, C[1] + Math.sin(a)*R/2, 0); k ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); } g.stroke(); g.setLineDash([]); };
    // 吸引點在地面的光暈
    const gp = P(A[0], A[1], 0), glow = g.createRadialGradient(gp[0], gp[1], 0, gp[0], gp[1], W*.5); glow.addColorStop(0, U.rgba(c,.35)); glow.addColorStop(1, U.rgba(c,0));
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    const pts = []; for(let j = 0; j <= G; j++){ const row = []; for(let i = 0; i <= G; i++){ const X = -1 + 2*i/G, Y = j/G, h = hf(X,Y); row.push([P(X, Y, Math.max(h, SEA*.6)), h]); } pts.push(row); }
    // 由遠到近畫網格面
    for(let j = G-1; j >= 0; j--) for(let i = 0; i < G; i++){
      const a = pts[j][i], b = pts[j][i+1], cc = pts[j+1][i+1], d = pts[j+1][i], hh = (a[1]+b[1]+cc[1]+d[1])/4, sl = cl((d[1] - a[1])*5 + .5);
      q4(g, a[0], b[0], cc[0], d[0]);
      if(hh < SEA){ g.fillStyle = hh < 0 ? "rgba(10,14,30,.95)" : "rgba(20,26,44,.9)"; g.fill(); g.lineWidth = .5; g.strokeStyle = hh < 0 ? "rgba(242,160,7,.35)" : "rgba(255,255,255,.1)"; g.stroke(); }
      else { g.fillStyle = sh(c, .35 + sl*.9 + hh*.4); g.fill(); g.lineWidth = .6; g.strokeStyle = "rgba(255,255,255,.35)"; g.stroke(); }
    }
    // 衰減半徑：島嶼（主色實線）、盆地（點綴色虛線）
    ring(A, RA, "rgba(255,255,255,.7)", [5,4]); ring(B, RB, ACC, [3,3]);
    const top = P(A[0], A[1], hf(A[0], A[1])); g.strokeStyle = "#fff"; g.lineWidth = 1; g.beginPath(); g.moveTo(top[0], top[1]); g.lineTo(top[0], top[1] - H*.1); g.stroke();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(top[0], top[1] - H*.1, 4, 0, TAU); g.fill();
    const bp = P(B[0], B[1], 0); g.strokeStyle = ACC; g.beginPath(); g.moveTo(bp[0], bp[1] - H*.12); g.lineTo(bp[0], bp[1] - 4); g.stroke();
    g.beginPath(); g.moveTo(bp[0]-4, bp[1]-9); g.lineTo(bp[0], bp[1]-3); g.lineTo(bp[0]+4, bp[1]-9); g.stroke();
    g.fillStyle = ACC; g.beginPath(); g.arc(bp[0], bp[1] - H*.12, 3.5, 0, TAU); g.fill();
  },
  // V05 影像混合高度：灰階影像 ＋ 雜訊細節 ＝ 混合地形（兩小一大）
  function(g, W, H, r, c, U){
    const nz = U.vnoise(sd(r)), C = U.rgb(c), pad = W*.05, sw = (W - pad*3)/2, shh = sw*.8, bigY = pad*2 + shh, bh = H - bigY - pad, n = 70, m = Math.round(n*bh/W);
    const img = (u, v) => { const d = Math.hypot(u-.5, (v-.5)*1.1); return cl(1 - Math.abs(d - .28)*4.2) + cl(.5 - Math.abs(u - v)*3)*.6; };
    const nsv = (u, v) => fbm(nz, u*9, v*9, 4);
    const tn = 40, tm = Math.round(tn*.8);
    pix(g, pad, pad, sw, shh, tn, tm, (i,j) => { const t = img(i/(tn-1), j/(tm-1)); return mixc(DARK, WHITE, cl(t)*.9); });
    pix(g, pad*2 + sw, pad, sw, shh, tn, tm, (i,j) => mixc(DARK, C, stretch(nsv(i/(tn-1), j/(tm-1)), .25, .75)));
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(pad, pad, sw, shh); g.strokeRect(pad*2 + sw, pad, sw, shh);
    // ＋ 與 ＝ 符號
    g.strokeStyle = "#fff"; g.lineWidth = 2; const mx = pad*1.5 + sw, my = pad + shh/2; g.beginPath(); g.moveTo(mx-4,my); g.lineTo(mx+4,my); g.moveTo(mx,my-4); g.lineTo(mx,my+4); g.stroke();
    g.beginPath(); g.moveTo(W/2-6, bigY - pad*.65); g.lineTo(W/2+6, bigY - pad*.65); g.moveTo(W/2-6, bigY - pad*.35); g.lineTo(W/2+6, bigY - pad*.35); g.stroke();
    const h = grid(n, m, (i,j) => { const u = i/(n-1), v = j/(m-1); return cl(img(u, v)*.72 + nsv(u, v)*.4 - .08); });
    pix(g, pad, bigY, W - pad*2, bh, n, m, (i,j) => { const l = shade(h, n, m, i, j, 7); return mixc(mixc(DARK, C, h[j*n+i]*1.1), WHITE, Math.max(0, l-.8)*1.5); });
    g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = .8; for(let k = 1; k < 6; k++) iso(g, n, m, h, k/6*.9, (W-pad*2)/(n-1), bh/(m-1), pad, bigY);
    g.strokeStyle = ACC; g.lineWidth = 1.2; g.strokeRect(pad, bigY, W - pad*2, bh);
  },
  // V06 noise 驅動立面面板：立面圖，每片板的開孔半徑與百葉角度都來自雜訊
  function(g, W, H, r, c, U){
    const nz = U.vnoise(sd(r)), fx = W*.1, fw = W*.8, fy = H*.1, cols = 10, cw = fw/cols, rows = Math.floor(H*.75/cw), fh = rows*cw;
    g.fillStyle = "#0E0E13"; g.fillRect(fx, fy, fw, fh);
    for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
      const v = fbm(nz, i*.28, j*.28, 3), t = stretch(v, .3, .7), x = fx + i*cw, y = fy + j*cw;
      g.fillStyle = sh(c, .35 + t*.35); g.fillRect(x + 1, y + 1, cw - 2, cw - 2);
      // 開孔：半徑隨雜訊
      g.fillStyle = sh(c, 1.2 + t*.3); g.beginPath(); g.arc(x + cw/2, y + cw/2, cw*(.08 + t*.34), 0, TAU); g.fill();
      // 百葉：旋轉角隨雜訊
      const a = (t - .5)*Math.PI*.9; g.strokeStyle = "rgba(0,0,0,.55)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + cw/2 - Math.cos(a)*cw*.45, y + cw/2 - Math.sin(a)*cw*.45); g.lineTo(x + cw/2 + Math.cos(a)*cw*.45, y + cw/2 + Math.sin(a)*cw*.45); g.stroke();
    }
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; for(let f = 1; f < 4; f++){ const y = fy + Math.round(rows*f/4)*cw; g.beginPath(); g.moveTo(fx-5,y); g.lineTo(fx+fw+5,y); g.stroke(); }
    g.lineWidth = 3; g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(fx-8, fy); g.lineTo(fx+fw+8, fy); g.stroke();
    const gy = fy + fh; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();
    g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(0, gy, W, H - gy);
    // 人形比例尺
    const px = fx + fw + W*.03, pH = cw*1.4; g.fillStyle = "#fff"; g.beginPath(); g.arc(px, gy - pH, pH*.12, 0, TAU); g.fill(); g.fillRect(px - pH*.08, gy - pH*.86, pH*.16, pH*.86);
  },
  // V07 曲面上取樣：3D 雜訊沿法線位移的球殼（經緯線框）
  function(g, W, H, r, c, U){
    const nz = U.vnoise(sd(r)), n3 = (x,y,z) => (nz(x + 3.1*z + 10, y + 10) + nz(y*1.1 + 20, z + x*.9 + 20) + nz(z + 30, x*1.2 - y*.4 + 30))/3;
    const R = Math.min(W, H)*.36, cx = W/2, cy = H/2, tilt = .45, ry = r()*TAU;
    const pt = (ph, th) => { let x = Math.cos(ph)*Math.cos(th + ry), y = Math.sin(ph), z = Math.cos(ph)*Math.sin(th + ry);
      const d = 1 + (n3(x*2.4, y*2.4, z*2.4) - .5)*.9; x *= d; y *= d; z *= d;
      const y2 = y*Math.cos(tilt) - z*Math.sin(tilt), z2 = y*Math.sin(tilt) + z*Math.cos(tilt); return [cx + x*R, cy - y2*R, z2, d]; };
    const glow = g.createRadialGradient(cx - R*.3, cy - R*.3, 0, cx, cy, R*1.3); glow.addColorStop(0, U.rgba(c,.35)); glow.addColorStop(1, U.rgba(c,0)); g.fillStyle = glow; g.fillRect(0,0,W,H);
    const seg = (a, b) => { const front = a[2] + b[2] > 0; g.strokeStyle = front ? (a[3] > 1.08 ? "#fff" : sh(c, 1.1 + (a[3]-1)*2)) : U.rgba(c, .18); g.lineWidth = front ? 1.1 : .6; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); };
    for(let k = 1; k < 22; k++){ const ph = -Math.PI/2 + k/22*Math.PI; let prev = pt(ph, 0); for(let s = 1; s <= 80; s++){ const p = pt(ph, s/80*TAU); seg(prev, p); prev = p; } }
    for(let k = 0; k < 24; k++){ const th = k/24*TAU; let prev = pt(-Math.PI/2, th); for(let s = 1; s <= 40; s++){ const p = pt(-Math.PI/2 + s/40*Math.PI, th); seg(prev, p); prev = p; } }
  },
  // V08 時間當第三維：三格底片，同一片地形隨時間平移、變形
  function(g, W, H, r, c, U){
    const nz = U.vnoise(sd(r)), C = U.rgb(c), sx = W*.2, sw = W*.6, pad = 8, fh = (H - pad*4)/3, n = 56, m = Math.round(n*fh/sw);
    g.fillStyle = "#0A0A0D"; g.fillRect(sx - W*.07, 0, sw + W*.14, H);
    for(let y = 4; y < H; y += 12){ g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(sx - W*.055, y, W*.03, 6); g.fillRect(sx + sw + W*.025, y, W*.03, 6); }
    for(let f = 0; f < 3; f++){ const y0 = pad + f*(fh + pad), t = f*.55;
      const h = grid(n, m, (i,j) => fbm(nz, i*.06 + t, j*.06 + t*.35, 4));
      pix(g, sx, y0, sw, fh, n, m, (i,j) => mixc(DARK, C, stretch(h[j*n+i], .25, .75)));
      g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1; iso(g, n, m, h, .5, sw/(n-1), fh/(m-1), sx, y0);
      g.strokeStyle = "rgba(255,255,255,.25)"; iso(g, n, m, h, .6, sw/(n-1), fh/(m-1), sx, y0);
      g.fillStyle = f === 2 ? ACC : "rgba(255,255,255,.5)"; g.beginPath(); g.arc(W - W*.06, y0 + fh/2, 3.5, 0, TAU); g.fill(); }
    // 時間軸
    g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; arrow(g, W - W*.06, pad, Math.PI/2, H - pad*2.5, 6);
  },
  // V09 等高線輸出：分層爆炸圖，雷切板一片片往上抽離
  function(g, W, H, r, c, U){
    const nz = U.vnoise(sd(r)), n = 80, sc = 3/n, L = 6;
    const h = grid(n, n, (i,j) => { const d = Math.hypot(i/n - .5, j/n - .5)*2; return fbm(nz, i*sc, j*sc, 4)*.7 + cl(1 - d)*.5; });
    const s = Math.min(W*.5, H*.5), gap = Math.min(H*.075, (H - s - H*.08)/(L-1)), ox = W/2, oy = H - s - H*.04 - 0;
    const C = U.rgb(c);
    // 定位銷虛線
    const corner = (u, v, z) => [ox + (u - v)*s*.866, oy + (u + v)*s*.5 - z];
    g.setLineDash([2,3]); g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1;
    [[0,0],[1,0],[0,1],[1,1]].forEach(([u,v]) => { const a = corner(u,v,0), b = corner(u,v,(L-1)*gap); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }); g.setLineDash([]);
    for(let l = 0; l < L; l++){ const lv = .32 + l*.075, z = l*gap, t = l/(L-1);
      const top = cvs(n, n, (i,j) => h[j*n+i] > lv ? [...mixc(C, WHITE, t*.55)].concat(255) : null);
      const side = cvs(n, n, (i,j) => h[j*n+i] > lv ? [...mixc(DARK, C, .35)].concat(255) : null);
      g.save(); g.imageSmoothingEnabled = true;
      g.transform(s*.866/n, s*.5/n, -s*.866/n, s*.5/n, ox, oy - z + 3); g.drawImage(side, 0, 0); g.restore();
      g.save(); g.transform(s*.866/n, s*.5/n, -s*.866/n, s*.5/n, ox, oy - z); g.drawImage(top, 0, 0); g.restore();
      // 板材外框
      const a = corner(0,0,z), b = corner(1,0,z), cc = corner(1,1,z), d = corner(0,1,z); q4(g, a, b, cc, d); g.strokeStyle = l === L-1 ? ACC : "rgba(255,255,255,.2)"; g.lineWidth = 1; g.stroke();
    }
  },
  // V10 水力侵蝕：數千顆水滴沿坡度流下，刻出沖溝與扇狀堆積
  function(g, W, H, r, c, U){
    const nz = U.vnoise(sd(r)), n = Math.round(W/2.5), m = Math.round(H/2.5), sc = 3/n, C = U.rgb(c);
    const h = grid(n, m, (i,j) => fbm(nz, i*sc, j*sc, 5) + j/m*.35);
    pix(g, 0, 0, W, H, n, m, (i,j) => mixc(DARK, C, stretch(h[j*n+i], .3, 1)*shade(h, n, m, i, j, 12)*.55));
    const at = (x, y) => h[Math.min(m-1, Math.max(0, y|0))*n + Math.min(n-1, Math.max(0, x|0))], sx = W/n, sy = H/m;
    g.globalCompositeOperation = "lighter"; g.lineWidth = 1; g.strokeStyle = "rgba(160,200,255,.07)"; const ends = [];
    for(let k = 0; k < 900; k++){ let x = r()*n, y = r()*m*.8, vx = 0, vy = 0; g.beginPath(); g.moveTo(x*sx, y*sy);
      for(let s = 0; s < 90; s++){ const gx = at(x+1,y) - at(x-1,y), gy = at(x,y+1) - at(x,y-1); vx = vx*.85 - gx*4; vy = vy*.85 - gy*4; const l = Math.hypot(vx,vy) || 1; x += vx/l*.8; y += vy/l*.8;
        if(x < 1 || y < 1 || x > n-2 || y > m-2) break; g.lineTo(x*sx, y*sy); }
      g.stroke(); ends.push([x*sx, y*sy]); }
    g.globalCompositeOperation = "source-over";
    // 堆積點
    g.fillStyle = U.rgba(ACC, .35); ends.forEach(([x,y], i) => { if(i % 3) return; g.beginPath(); g.arc(x, y, 1.3, 0, TAU); g.fill(); });
  },
  // V11 noise 當向量場角度：格點上的箭頭，少數流線以白線追蹤
  function(g, W, H, r, c, U){
    const nz = U.vnoise(sd(r)), sc = .012, ang = (x, y) => fbm(nz, x*sc, y*sc, 3)*TAU*2;
    pix(g, 0, 0, W, H, 40, Math.round(40*H/W), (i,j) => mixc(DARK, U.rgb(c), fbm(nz, i*W/40*sc, j*W/40*sc, 3)*.35));
    const st = 15; g.lineWidth = 1;
    for(let y = st/2; y < H; y += st) for(let x = st/2; x < W; x += st){ const a = ang(x, y), v = .5 + .5*Math.sin(a); g.strokeStyle = sh(c, .8 + v*.6, .85); arrow(g, x - Math.cos(a)*5, y - Math.sin(a)*5, a, 10, 3); }
    g.lineWidth = 2.2; g.lineCap = "round";
    for(let k = 0; k < 7; k++){ let x = W*(.1 + r()*.8), y = H*(.1 + r()*.8); g.fillStyle = ACC; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
      g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(x, y); for(let s = 0; s < 160; s++){ const a = ang(x, y); x += Math.cos(a)*2; y += Math.sin(a)*2; if(x < 0 || y < 0 || x > W || y > H) break; g.lineTo(x, y); } g.stroke(); }
  },
  // V12 閾值分區：高度 × 濕度查表的景觀配置平面圖（水域斜線、林地樹圈、草地點、建地方塊）
  function(g, W, H, r, c, U){
    const nz = U.vnoise(sd(r)), nm = U.vnoise(sd(r)), sc = .011;
    const ht = (x, y) => fbm(nz, x*sc, y*sc, 4), mo = (x, y) => fbm(nm, x*sc*.8 + 30, y*sc*.8, 3);
    const zone = (x, y) => { const e = ht(x, y); if(e < .42) return 0; if(e > .64) return 3; return mo(x, y) > .5 ? 2 : 1; };
    const n = Math.round(W/3), m = Math.round(H/3), Z = grid(n, m, (i,j) => zone(i*3, j*3));
    const cols = [[25,35,60],[28,32,36],[30,40,62],[40,40,48]];
    pix(g, 0, 0, W, H, n, m, (i,j) => cols[Z[j*n+i]]);
    // 水域斜線
    g.strokeStyle = U.rgba(c, .8); g.lineWidth = 1; g.beginPath();
    for(let y = 3; y < H; y += 5) for(let x = 0; x < W; x += 3) if(zone(x, y) === 0){ g.moveTo(x, y); g.lineTo(x + 3, y); } g.stroke();
    // 林地、草地、建地
    for(let y = 5; y < H; y += 10) for(let x = 5; x < W; x += 10){ const jx = x + (r()-.5)*4, jy = y + (r()-.5)*4, z = zone(jx, jy);
      if(z === 2){ g.strokeStyle = sh(c, 1.3); g.lineWidth = 1; g.beginPath(); g.arc(jx, jy, 3 + r()*1.8, 0, TAU); g.stroke(); g.fillStyle = sh(c,1.3); g.fillRect(jx-.6, jy-.6, 1.2, 1.2); }
      else if(z === 1){ g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(jx, jy, 1.2, 1.2); g.fillRect(jx + 4, jy + 3, 1.2, 1.2); }
      else if(z === 3 && (x/10 + y/10) % 3 === 0){ g.fillStyle = "rgba(255,255,255,.75)"; g.fillRect(x - 3, y - 3, 6, 6); } }
    // 分區邊界
    const hh = grid(n, m, (i,j) => ht(i*3, j*3)); g.strokeStyle = "#fff"; g.lineWidth = 1.2; iso(g, n, m, hh, .42, W/(n-1), H/(m-1));
    g.strokeStyle = ACC; g.setLineDash([3,3]); iso(g, n, m, hh, .64, W/(n-1), H/(m-1)); g.setLineDash([]);
  },
];

/* ================= 沒有照片的案例 ================= */
// C04-01 Perlin 1985：solid texture 大理石花瓶與木紋球
ART.case["C04-01"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(sd(r)), C = U.rgb(c), turb = (x, y) => { let s = 0, f = 1; for(let o = 0; o < 5; o++){ s += Math.abs(nz(x*f, y*f) - .5)/f; f *= 2; } return s; };
  const cx = W*.42, top = H*.1, bot = H*.9, vh = bot - top;
  const prof = t => (.18 + .22*Math.sin(t*Math.PI*.95 + .2) + (t < .12 ? .05 : 0) - (t > .2 && t < .3 ? .06*Math.sin((t-.2)/.1*Math.PI) : 0))*W*.9;
  g.save(); g.beginPath();
  for(let k = 0; k <= 60; k++){ const t = k/60; g.lineTo(cx + prof(t), top + t*vh); } for(let k = 60; k >= 0; k--){ const t = k/60; g.lineTo(cx - prof(t), top + t*vh); } g.closePath(); g.clip();
  const n = Math.round(W/2), m = Math.round(H/2);
  pix(g, 0, 0, W, H, n, m, (i,j) => { const v = .5 + .5*Math.sin(i*.09 + j*.03 + turb(i*.03, j*.03)*9); return mixc(mixc(DARK, C, .35 + v*.4), WHITE, Math.pow(v, 8)*.8); });
  const sgr = g.createLinearGradient(cx - W*.4, 0, cx + W*.4, 0); sgr.addColorStop(0, "rgba(0,0,0,.6)"); sgr.addColorStop(.35, "rgba(255,255,255,.12)"); sgr.addColorStop(1, "rgba(0,0,0,.7)"); g.fillStyle = sgr; g.fillRect(0, 0, W, H);
  g.restore();
  // 木紋球
  const bx = W*.8, by = H*.78, br = W*.13; g.save(); g.beginPath(); g.arc(bx, by, br, 0, TAU); g.clip();
  pix(g, bx - br, by - br, br*2, br*2, 50, 50, (i,j) => { const d = Math.hypot(i - 18, j - 40)*.35 + nz(i*.15 + 40, j*.15)*3, v = d % 1; return mixc([60,40,20], ACCR, .3 + v*.6); });
  const rg = g.createRadialGradient(bx - br*.4, by - br*.4, 0, bx, by, br); rg.addColorStop(0, "rgba(255,255,255,.25)"); rg.addColorStop(1, "rgba(0,0,0,.6)"); g.fillStyle = rg; g.fillRect(bx - br, by - br, br*2, br*2); g.restore();
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, bot + 1); g.lineTo(W, bot + 1); g.stroke();
};
ART.case["C04-01"].ratio = 1.25;

// C04-02 Improving Noise：上方 12 個固定梯度方向（立方體邊中點），下方三次 vs 五次平滑曲線
ART.case["C04-02"] = function(g, W, H, r, c, U){
  g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 1; for(let x = 0; x < W; x += 12){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); } for(let y = 0; y < H; y += 12){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
  const u = Math.min(W, H)*.2, a0 = r()*.4, P = (x, y, z) => { const ca = Math.cos(a0 + .6), sa = Math.sin(a0 + .6), X = x*ca - z*sa, Z = x*sa + z*ca, Y = y*Math.cos(.45) - Z*Math.sin(.45); return [W/2 + X*u, H*.3 - Y*u]; };
  // 立方體線框
  g.strokeStyle = "rgba(255,255,255,.3)"; const V = [-1,1];
  V.forEach(a => V.forEach(b => { [[[-1,a,b],[1,a,b]],[[a,-1,b],[a,1,b]],[[a,b,-1],[a,b,1]]].forEach(([p,q]) => { const A = P(...p), B = P(...q); g.beginPath(); g.moveTo(A[0],A[1]); g.lineTo(B[0],B[1]); g.stroke(); }); }));
  const dirs = []; V.forEach(a => V.forEach(b => { dirs.push([a,b,0],[a,0,b],[0,a,b]); }));
  const o = P(0,0,0); g.lineWidth = 1.6;
  dirs.forEach(d => { const e = P(d[0], d[1], d[2]), ang = Math.atan2(e[1]-o[1], e[0]-o[0]), len = Math.hypot(e[0]-o[0], e[1]-o[1]); g.strokeStyle = sh(c, 1.25); arrow(g, o[0], o[1], ang, len, 5); g.fillStyle = "#fff"; g.beginPath(); g.arc(e[0], e[1], 2.2, 0, TAU); g.fill(); });
  g.fillStyle = ACC; g.beginPath(); g.arc(o[0], o[1], 3, 0, TAU); g.fill();
  // 曲線圖
  const gx = W*.12, gy = H*.58, gw = W*.76, gh = H*.34; g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy + gh); g.lineTo(gx + gw, gy + gh); g.stroke();
  const plot = (f, col, w, dash) => { g.strokeStyle = col; g.lineWidth = w; g.setLineDash(dash || []); g.beginPath(); for(let k = 0; k <= 60; k++){ const t = k/60, x = gx + t*gw, y = gy + gh - f(t)*gh; k ? g.lineTo(x,y) : g.moveTo(x,y); } g.stroke(); g.setLineDash([]); };
  plot(t => t, "rgba(255,255,255,.2)", 1, [2,3]);
  plot(t => t*t*(3 - 2*t), "rgba(255,255,255,.55)", 1.3, [4,3]);
  plot(t => t*t*t*(t*(t*6 - 15) + 10), c, 2.4);
  // 二階導數（小）：三次在端點不為零，五次為零
  plot(t => .5 + (6 - 12*t)/24, "rgba(255,255,255,.3)", 1);
  plot(t => .5 + (60*t - 180*t*t + 120*t*t*t)/24, ACC, 1.3);
};
ART.case["C04-02"].ratio = 1.2;

// C04-03 Minecraft 地形：等角體素地形，含水面與樹
ART.case["C04-03"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(sd(r)), N = 16, hm = [], WL = 3;
  for(let y = 0; y < N; y++) for(let x = 0; x < N; x++) hm.push(1 + Math.floor(stretch(fbm(nz, x*.13, y*.13, 3), .25, .75)*8));
  const u = Math.min(W/(N*1.8), H/(N*1.35)), P = proj(W/2, H*.3, u);
  const list = [];
  for(let y = 0; y < N; y++) for(let x = 0; x < N; x++) list.push([x, y]);
  list.sort((a,b) => (a[0]+a[1]) - (b[0]+b[1]));
  list.forEach(([x, y]) => { const h = hm[y*N+x];
    // 石層、土層、頂層
    box(g, P, x, y, 0, Math.max(0, h-2), "#55555E", "#303038", "#3E3E48");
    box(g, P, x, y, Math.max(0, h-2), Math.min(h, 1), sh(c,.6), sh(c,.3), sh(c,.4));
    if(h > 1) box(g, P, x, y, h-1, 1, h > 7 ? "#EDEDF2" : sh(c, 1.15), sh(c, .5), sh(c, .65), "rgba(0,0,0,.25)");
    if(h < WL) box(g, P, x, y, h, WL - h, U.rgba(c,.55), U.rgba(c,.35), U.rgba(c,.45));
    // 樹
    if(h >= 4 && h <= 6 && ((x*7 + y*13) % 11 === 0)){ box(g, P, x+.35, y+.35, h, 1.6, "#6B4A2A", "#4A3320", "#57402A"); box(g, P, x-.1, y-.1, h+1.6, 1, ACC, "#9A6A10", "#B87F10", "rgba(0,0,0,.3)"); }
  });
};
ART.case["C04-03"].ratio = .9;

// C04-04 Minecraft 風格渲染：側面切片，草／土／石分層與洞穴
ART.case["C04-04"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(sd(r)), cv = U.vnoise(sd(r)), n = 32, s = W/n, m = Math.ceil(H/s), sea = Math.floor(m*.5);
  for(let i = 0; i < n; i++){ const top = Math.floor(m*.12 + stretch(fbm(nz, i*.07, 3.3, 4), .3, .7)*m*.55);
    for(let j = 0; j < m; j++){ let col = null;
      const cave = j > top + 3 && fbm(cv, i*.16, j*.2, 3) > .6;
      if(j < top){ if(j >= sea) col = U.rgba(c, .45); }
      else if(cave) col = "#0B0B0F";
      else if(j === top) col = j >= sea ? "#C9B98A" : sh(c, 1.1);
      else if(j < top + 3) col = sh(c, .45);
      else col = (i*31 + j*17) % 13 === 0 ? ACC : ((i + j) % 2 ? "#4A4A54" : "#44444E");
      if(col){ g.fillStyle = col; g.fillRect(i*s, j*s, s, s); if(!cave && j >= top){ g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(i*s, j*s, s, 1.2); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(i*s, j*s + s - 1.2, s, 1.2); } }
    }
  }
  // 雲
  g.fillStyle = "rgba(255,255,255,.8)"; [[.15,.08,4],[.62,.12,5]].forEach(([x,y,k]) => g.fillRect(W*x, H*y, s*k, s*.8));
};
ART.case["C04-04"].ratio = .8;

// C04-05 World Machine：節點管線（Perlin → 侵蝕 → 熱侵蝕 → 輸出），每個節點帶預覽縮圖
ART.case["C04-05"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(sd(r)), C = U.rgb(c), tn = 36, base = grid(tn, tn, (i,j) => fbm(nz, i*.09, j*.09, 5));
  g.fillStyle = "rgba(255,255,255,.04)"; for(let y = 6; y < H; y += 12) for(let x = 6; x < W; x += 12) g.fillRect(x, y, 1.2, 1.2);
  const nw = W*.38, nh = nw*.95, nodes = [[W*.06, H*.06], [W*.56, H*.2], [W*.08, H*.52], [W*.56, H*.66]].map(([x,y]) => [x, Math.min(y, H - nh - 4)]);
  // 連線（貝茲）
  g.strokeStyle = U.rgba(c, .9); g.lineWidth = 2;
  for(let k = 0; k < 3; k++){ const [x1,y1] = nodes[k], [x2,y2] = nodes[k+1], ax = x1 + nw, ay = y1 + nh*.5, bx = x2, by = y2 + nh*.5;
    g.beginPath(); g.moveTo(ax, ay); g.bezierCurveTo(ax + W*.25, ay, bx - W*.25, by, bx, by); g.stroke(); }
  const prev = [
    (i,j) => mixc(DARK, WHITE, base[j*tn+i]),
    (i,j) => { const v = base[j*tn+i], ch = Math.abs(fbm(nz, i*.2 + 9, j*.05, 2) - .5) < .04 ? .35 : 0; return mixc(DARK, WHITE, cl(v - ch)); },
    (i,j) => { let s = 0, k = 0; for(let dj = -2; dj <= 2; dj++) for(let di = -2; di <= 2; di++){ const ii = Math.min(tn-1, Math.max(0, i+di)), jj = Math.min(tn-1, Math.max(0, j+dj)); s += base[jj*tn+ii]; k++; } return mixc(DARK, WHITE, Math.round(s/k*6)/6); },
    (i,j) => mixc(mixc(DARK, C, stretch(base[j*tn+i], .3, .7)), WHITE, Math.max(0, shade(base, tn, tn, i, j, 10) - .8)*2),
  ];
  nodes.forEach(([x, y], k) => {
    rrect(g, x, y, nw, nh, 5); g.fillStyle = "#23232D"; g.fill(); g.strokeStyle = k === 3 ? ACC : "rgba(255,255,255,.35)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = k === 3 ? ACC : c; g.fillRect(x + 1, y + 1, nw - 2, nh*.13);
    pix(g, x + nw*.08, y + nh*.2, nw*.84, nh*.72, tn, tn, prev[k]);
    // 輸入／輸出埠
    g.fillStyle = "#fff"; if(k < 3){ g.beginPath(); g.arc(x + nw, y + nh*.5, 3.5, 0, TAU); g.fill(); } if(k > 0){ g.beginPath(); g.arc(x, y + nh*.5, 3.5, 0, TAU); g.fill(); }
  });
};
ART.case["C04-05"].ratio = 1.15;

// C04-06 Advanced Perlin 參數：上方滑桿，下方各八度（octave）曲線與疊加結果
ART.case["C04-06"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(sd(r)), pad = W*.08, sl = [.35 + r()*.4, .5 + r()*.3, .3 + r()*.4];
  sl.forEach((v, k) => { const y = H*.07 + k*H*.065; g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 3; g.lineCap = "round"; g.beginPath(); g.moveTo(pad, y); g.lineTo(W - pad, y); g.stroke();
    g.strokeStyle = c; g.beginPath(); g.moveTo(pad, y); g.lineTo(pad + (W - pad*2)*v, y); g.stroke(); g.fillStyle = "#fff"; g.beginPath(); g.arc(pad + (W - pad*2)*v, y, 4.5, 0, TAU); g.fill(); });
  g.lineCap = "butt";
  const O = 4, y0 = H*.3, rowH = (H*.44)/O, amp = [1, .5, .25, .125];
  const oct = (o, x) => (nz(x*Math.pow(2, o)*4 + o*13, o*7.7) - .5)*amp[o];
  for(let o = 0; o < O; o++){ const cy = y0 + o*rowH + rowH/2;
    g.fillStyle = U.rgba(c, .5); g.fillRect(W*.03, cy - amp[o]*rowH*.45, W*.025, amp[o]*rowH*.9); // 振幅長條
    g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; g.beginPath(); g.moveTo(pad, cy); g.lineTo(W - pad*.5, cy); g.stroke();
    g.strokeStyle = sh(c, 1.4 - o*.15); g.lineWidth = 1.3; g.beginPath();
    for(let k = 0; k <= 160; k++){ const t = k/160, x = pad + t*(W - pad*1.5), y = cy - oct(o, t)*rowH*1.6; k ? g.lineTo(x,y) : g.moveTo(x,y); } g.stroke(); }
  // 疊加
  const by = H*.94, bh = H*.18; g.beginPath(); g.moveTo(pad, by);
  for(let k = 0; k <= 160; k++){ const t = k/160; let s = 0; for(let o = 0; o < O; o++) s += oct(o, t); g.lineTo(pad + t*(W - pad*1.5), by - bh*.5 - s*bh*.9); }
  g.lineTo(W - pad*.5, by); g.closePath(); const gr = g.createLinearGradient(0, by - bh, 0, by); gr.addColorStop(0, sh(c, 1.2)); gr.addColorStop(1, U.rgba(c, .1)); g.fillStyle = gr; g.fill();
  g.strokeStyle = ACC; g.lineWidth = 1; g.beginPath(); g.moveTo(pad, by - bh*1.02 - 4); g.lineTo(W - pad*.5, by - bh*1.02 - 4); g.stroke();
};
ART.case["C04-06"].ratio = 1.2;

// C04-07 三種侵蝕地形比較：三欄坡度色階圖（原始 fBm／水力沖溝／熱侵蝕平滑）＋ 色帶
ART.case["C04-07"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(sd(r)), pad = W*.035, cw = (W - pad*4)/3, ch = H*.8, n = 36, m = Math.round(n*ch/cw), C = U.rgb(c);
  const RP = ramp([[0,[18,22,40]],[.35,C],[.7,[240,240,250]],[1,ACCR]]);
  const h0 = grid(n, m, (i,j) => fbm(nz, i*.08, j*.08, 5));
  const h1 = h0.map((v, k) => { const i = k % n, j = (k/n)|0, ch2 = Math.abs(fbm(nz, i*.05 + 20, j*.12, 2) - .5); return v - (ch2 < .05 ? (.05 - ch2)*3 : 0); });
  const h2 = h0.map((v, k) => { const i = k % n, j = (k/n)|0; let s = 0, q = 0; for(let d = -2; d <= 2; d++) for(let e = -2; e <= 2; e++){ const ii = Math.min(n-1, Math.max(0, i+d)), jj = Math.min(m-1, Math.max(0, j+e)); s += h0[jj*n+ii]; q++; } return s/q; });
  [h0, h1, h2].forEach((h, k) => { const x0 = pad + k*(cw + pad), y0 = pad;
    pix(g, x0, y0, cw, ch, n, m, (i,j) => { const a = h[j*n + Math.min(n-1,i+1)] - h[j*n + Math.max(0,i-1)], b = h[Math.min(m-1,j+1)*n + i] - h[Math.max(0,j-1)*n + i]; return RP(Math.hypot(a, b)*9); });
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(x0, y0, cw, ch); });
  const by = pad*2 + ch, bw = W - pad*2; for(let k = 0; k < 60; k++){ const t = k/59, col = RP(t); g.fillStyle = `rgb(${col[0]|0},${col[1]|0},${col[2]|0})`; g.fillRect(pad + t*bw*59/60, by, bw/60 + 1, 7); }
  g.fillStyle = "rgba(255,255,255,.5)"; for(let k = 0; k <= 4; k++) g.fillRect(pad + k/4*bw - .5, by + 9, 1, 4);
};
ART.case["C04-07"].ratio = .85;

// C04-08 One-North：平滑起伏場決定建物高度的都市鳥瞰（斜投影街廓，天際線像地形）
ART.case["C04-08"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(sd(r)), N = 6, cell = W/N, M = Math.ceil(H/cell) + 1;
  // 地面起伏等高線
  const n = 40, m = Math.round(n*H/W), hf = (x, y) => fbm(nz, x*.005 + 3, y*.005 + 3, 3), hh = grid(n, m, (i,j) => hf(i*W/(n-1), j*H/(m-1)));
  g.strokeStyle = U.rgba(c, .3); g.lineWidth = 1; for(let v = .3; v < .8; v += .05) iso(g, n, m, hh, v, W/(n-1), H/(m-1));
  // 微彎街道（縱橫）
  g.strokeStyle = "rgba(255,255,255,.16)"; g.lineWidth = 4;
  for(let t = 0; t <= N; t++){ g.beginPath(); for(let s = 0; s <= H; s += 6){ const x = t*cell + Math.sin(s*.015 + t)*5; s ? g.lineTo(x, s) : g.moveTo(x, s); } g.stroke(); }
  for(let t = 0; t <= M; t++){ g.beginPath(); for(let s = 0; s <= W; s += 6){ const y = t*cell + Math.sin(s*.015 + t*2)*5; s ? g.lineTo(s, y) : g.moveTo(s, y); } g.stroke(); }
  // 每個街廓切成 2×2 以內的建物，高度由平滑場決定
  const B = [];
  for(let j = 0; j < M; j++) for(let i = 0; i < N; i++){ const sx = r() < .5 ? 2 : 1, sy = r() < .5 ? 2 : 1, bw = cell*.74/sx, bd = cell*.74/sy;
    for(let a = 0; a < sx; a++) for(let b = 0; b < sy; b++){ const x = i*cell + cell*.13 + a*bw, y = j*cell + cell*.13 + b*bd, hv = hf(x + bw/2, y + bd/2);
      B.push([x, y, bw - 3, bd - 3, Math.pow(stretch(hv, .3, .72), 1.8)*cell*.9 + 2]); } }
  const ox = .45, oy = .8; // 斜投影：高度往右上推
  B.sort((a,b) => (a[1] + a[3]) - (b[1] + b[3])).forEach(([x, y, w, d, ht]) => { const t = cl(ht/(cell*.9)), dx = ht*ox, dy = ht*oy;
    g.fillStyle = "rgba(0,0,0,.35)"; q4(g, [x, y + d], [x + w, y + d], [x + w + ht*.6, y + d + ht*.2], [x + ht*.6, y + d + ht*.2]); g.fill();
    q4(g, [x, y + d], [x + w, y + d], [x + w + dx, y + d - dy], [x + dx, y + d - dy]); g.fillStyle = sh(c, .3 + t*.3); g.fill();
    q4(g, [x + w, y + d], [x + w, y], [x + w + dx, y - dy], [x + w + dx, y + d - dy]); g.fillStyle = sh(c, .2 + t*.2); g.fill();
    q4(g, [x + dx, y - dy], [x + w + dx, y - dy], [x + w + dx, y + d - dy], [x + dx, y + d - dy]); g.fillStyle = t > .85 ? "#fff" : sh(c, .7 + t*.7); g.fill(); });
};
ART.case["C04-08"].ratio = 1.1;

// C04-09 Hobbs flow field：不重疊、粗細不一的筆刷曲線（繪圖機／海報感）
ART.case["C04-09"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(sd(r)), sc = .006, ang = (x, y) => (fbm(nz, x*sc, y*sc, 2) - .5)*TAU*1.8 + .6;
  const cs = 4, gn = Math.ceil(W/cs), gm = Math.ceil(H/cs), occ = new Int16Array(gn*gm).fill(-1);
  const free = (x, y, id, d) => { const i = (x/cs)|0, j = (y/cs)|0, k = Math.ceil(d/cs); for(let b = -k; b <= k; b++) for(let a = -k; a <= k; a++){ const ii = i+a, jj = j+b; if(ii < 0 || jj < 0 || ii >= gn || jj >= gm) continue; const o = occ[jj*gn+ii]; if(o >= 0 && o !== id) return false; } return true; };
  const pal = [c, "#fff", sh(c, 1.35), ACC, sh(c, .7)]; g.lineCap = "round"; let id = 0;
  for(let t = 0; t < 700 && id < 400; t++){ const x0 = r()*W, y0 = r()*H, wd = 1.2 + Math.pow(r(), 3)*7, d = wd*.8 + 2; if(!free(x0, y0, -2, d)) continue;
    const pts = [[x0, y0]];
    for(const dir of [1, -1]){ let x = x0, y = y0; for(let s = 0; s < 140; s++){ const a = ang(x, y); x += Math.cos(a)*2*dir; y += Math.sin(a)*2*dir; if(x < 3 || y < 3 || x > W-3 || y > H-3 || !free(x, y, id, d)) break; dir > 0 ? pts.push([x, y]) : pts.unshift([x, y]); } }
    if(pts.length < 8) continue;
    pts.forEach(([x, y]) => { occ[((y/cs)|0)*gn + ((x/cs)|0)] = id; });
    g.strokeStyle = pal[wd > 6 ? 3 : (id % 3 === 0 ? 1 : id % 5 === 0 ? 2 : id % 7 === 0 ? 4 : 0)]; g.lineWidth = wd; U.poly(g, pts); g.stroke(); id++; }
};
ART.case["C04-09"].ratio = 1.3;

// C04-10 Curl noise：展場空間中從台座升起的旋渦煙霧粒子
ART.case["C04-10"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(sd(r));
  // 房間：背牆與地板透視線
  const bw = W*.56, bh = H*.46, bx = W/2 - bw/2, byy = H*.12; g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1; g.strokeRect(bx, byy, bw, bh);
  [[0,0,bx,byy],[W,0,bx+bw,byy],[0,H,bx,byy+bh],[W,H,bx+bw,byy+bh]].forEach(([a,b,c2,d]) => { g.beginPath(); g.moveTo(a,b); g.lineTo(c2,d); g.stroke(); });
  for(let k = 1; k < 6; k++){ const t = k/6, y = byy + bh + (H - byy - bh)*t*t; g.strokeStyle = "rgba(255,255,255,.06)"; g.beginPath(); g.moveTo(bx - bx*t*t, y); g.lineTo(bx + bw + (W - bx - bw)*t*t, y); g.stroke(); }
  // 台座
  const px = W/2, py = H*.8; g.fillStyle = "#2A2A34"; g.fillRect(px - W*.09, py, W*.18, H*.06); g.fillStyle = sh(c, 1.3); g.fillRect(px - W*.09, py - 2, W*.18, 2);
  // curl：ψ 的旋度 → (∂ψ/∂y, −∂ψ/∂x)
  const sc = .012, e = 1, psi = (x, y) => fbm(nz, x*sc, y*sc, 3);
  g.globalCompositeOperation = "lighter"; g.lineWidth = 1;
  for(let k = 0; k < 260; k++){ let x = px + (r()-.5)*W*.14, y = py - 2; g.strokeStyle = k % 17 === 0 ? U.rgba(ACC, .35) : U.rgba(c, .22); g.beginPath(); g.moveTo(x, y);
    for(let s = 0; s < 110; s++){ const ux = (psi(x, y + e) - psi(x, y - e))/(2*e), uy = -(psi(x + e, y) - psi(x - e, y))/(2*e); x += ux*260; y += uy*260 - 1.4; if(y < 0) break; g.lineTo(x, y); } g.stroke(); }
  g.globalCompositeOperation = "source-over";
  // 人形比例
  const hx = W*.18, hH = H*.2, gy = H*.93; g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.arc(hx, gy - hH, hH*.1, 0, TAU); g.fill(); g.fillRect(hx - hH*.07, gy - hH*.88, hH*.14, hH*.88);
};
ART.case["C04-10"].ratio = 1.2;

// C04-11 用 noise 做地圖：色帶島嶼（深水→沙灘→草地→岩→雪）＋ 高度重新分配曲線小圖
ART.case["C04-11"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(sd(r)), n = Math.round(W/2), m = Math.round(H/2), C = U.rgb(c), ex = 1.6;
  const RP = ramp([[0,[12,20,45]],[.36,mixc(C,DARK,.3)],[.4,[205,190,140]],[.46,[90,150,90]],[.62,[50,100,70]],[.78,[110,110,120]],[.9,[245,245,250]],[1,WHITE]]);
  const h = grid(n, m, (i,j) => { const u = i/(n-1) - .5, v = j/(m-1) - .5, d = Math.hypot(u, v*H/W)*2; return Math.pow(cl(fbm(nz, i*.035, j*.035, 5)*1.15 - d*d*.55 + .05), ex)*1.25; });
  pix(g, 0, 0, W, H, n, m, (i,j) => { const v = h[j*n+i], l = v > .4 ? shade(h, n, m, i, j, 8) : .8; return RP(v).map(x => x*(.55 + l*.55)); });
  g.strokeStyle = "#fff"; g.lineWidth = 1.2; iso(g, n, m, h, .4, W/(n-1), H/(m-1));
  // 重新分配曲線 e^p 小圖
  const s = W*.26, x0 = W - s - 8, y0 = H - s - 8; g.fillStyle = "rgba(10,10,14,.85)"; g.fillRect(x0, y0, s, s); g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(x0, y0, s, s);
  g.setLineDash([2,2]); g.beginPath(); g.moveTo(x0 + 4, y0 + s - 4); g.lineTo(x0 + s - 4, y0 + 4); g.stroke(); g.setLineDash([]);
  g.strokeStyle = ACC; g.lineWidth = 1.6; g.beginPath(); for(let k = 0; k <= 30; k++){ const t = k/30, x = x0 + 4 + t*(s - 8), y = y0 + s - 4 - Math.pow(t, 2.2)*(s - 8); k ? g.lineTo(x,y) : g.moveTo(x,y); } g.stroke();
};
ART.case["C04-11"].ratio = 1;

// C04-12 文獻回顧：斜切比較——未內插的塊狀 value noise／平滑內插／simplex 三角格
ART.case["C04-12"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(sd(r)), C = U.rgb(c), cs = W/7, n = Math.round(W/2), m = Math.round(H/2), k = W/n;
  const lat = (i, j) => nz(i + .5, j + .5); // 每個格點一個值
  pix(g, 0, 0, W, H, n, m, (i,j) => { const x = i*k, y = j*k, gx = x/cs, gy = y/cs, band = (x + y*.8)/(W + H*.8);
    let v; if(band < .36) v = lat(Math.floor(gx), Math.floor(gy)); else v = nz(gx + .5, gy + .5);
    if(band >= .68) v = fbm(nz, gx*.9, gy*.9, 3); return mixc(DARK, C, stretch(v, .1, .9)*.95); });
  // 分界斜線
  g.strokeStyle = "#fff"; g.lineWidth = 2; [.36, .68].forEach(t => { const L = t*(W + H*.8); g.beginPath(); g.moveTo(L, 0); g.lineTo(L - H*.8, H); g.stroke(); });
  // 中段：格點與梯度箭頭
  g.lineWidth = 1.2;
  for(let j = 0; j <= H/cs + 1; j++) for(let i = 0; i <= 7; i++){ const x = i*cs, y = j*cs, band = (x + y*.8)/(W + H*.8); if(band < .38 || band > .66) continue;
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, 2.2, 0, TAU); g.fill(); g.strokeStyle = ACC; arrow(g, x, y, lat(i, j)*TAU*3, cs*.4, 4); }
  // 右下：simplex 三角格
  g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = .8; g.beginPath();
  const ts = cs*.9, th = ts*.866;
  for(let j = 0; j <= H/th + 1; j++) for(let i = -1; i <= W/ts + 1; i++){ const x = i*ts + (j % 2)*ts/2, y = j*th; if((x + y*.8)/(W + H*.8) < .7) continue;
    g.moveTo(x, y); g.lineTo(x + ts, y); g.moveTo(x, y); g.lineTo(x + ts/2, y + th); g.moveTo(x, y); g.lineTo(x - ts/2, y + th); }
  g.stroke();
};
ART.case["C04-12"].ratio = .9;

// C04-55 The Book of Shaders：3×3 著色器圖庫，每格一種 noise 寫法
ART.case["C04-55"] = function(g, W, H, r, c, U){
  const nz = U.vnoise(sd(r)), C = U.rgb(c), pad = W*.04, tw = (W - pad*4)/3, th = (H - pad*4)/3, n = 44, m = Math.round(n*th/tw);
  const pts = [...Array(9)].map(() => [r()*n, r()*m]);
  const F = [
    (x, y) => nz(Math.floor(x*6) + .5, Math.floor(y*6) + .5),                               // 塊狀 value noise
    (x, y) => nz(x*6, y*6),                                                                   // 平滑內插
    (x, y) => fbm(nz, x*4, y*4, 5),                                                           // fBm
    (x, y) => { let s = 0, f = 1; for(let o = 0; o < 5; o++){ s += Math.abs(nz(x*4*f, y*4*f) - .5)*2/f; f *= 2; } return s*.6; }, // 亂流
    (x, y) => { const q = 1 - Math.abs(2*fbm(nz, x*3, y*3, 4) - 1); return q*q; },           // 脊狀
    (x, y) => .5 + .5*Math.sin(x*20 + fbm(nz, x*4, y*4, 4)*14),                               // 大理石
    (x, y) => { const q = fbm(nz, x*3, y*3, 3), p = fbm(nz, x*3 + 5, y*3 + 1, 3); return fbm(nz, x*3 + q*4, y*3 + p*4, 4); }, // 扭曲
    (x, y) => { const v = fbm(nz, x*3, y*3, 3)*10; return Math.abs(v - Math.round(v)) < .12 ? 1 : .15; }, // 等值線
    (x, y) => { let d = 9; pts.forEach(([a, b]) => { d = Math.min(d, Math.hypot(x*n - a, y*m - b)); }); return cl(d/12); }, // cellular
  ];
  F.forEach((f, k) => { const x0 = pad + (k % 3)*(tw + pad), y0 = pad + ((k/3)|0)*(th + pad);
    g.save(); rrect(g, x0, y0, tw, th, 5); g.clip();
    pix(g, x0, y0, tw, th, n, m, (i,j) => { const v = f(i/n, j/m); return k === 4 ? mixc(DARK, WHITE, cl(v)) : mixc(mixc(DARK, C, stretch(v, .15, .85)), WHITE, Math.max(0, v - .85)*3); });
    g.restore(); rrect(g, x0, y0, tw, th, 5); g.strokeStyle = k === 4 ? ACC : "rgba(255,255,255,.25)"; g.lineWidth = 1; g.stroke(); });
};
ART.case["C04-55"].ratio = 1;
})();
