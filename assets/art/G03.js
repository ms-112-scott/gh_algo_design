/* G03 地表逕流與集水區（D8 流向累積）：基本生成器（變形與案例的獨立畫法由 gh-enrich 的 ART 單元補上） */
(function(){
const ART = window.ART, U = window.GENUTIL;

// 共用：雜訊地形 → Priority-Flood 填窪 → D8 流向 → 依高程排序累積 → 出口編號（集水區）
function d8(n, m, hf){
  const N = n*m, z = new Float64Array(N), down = new Int32Array(N).fill(-1), acc = new Float64Array(N).fill(1), lab = new Int32Array(N);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) z[j*n+i] = hf(i, j);
  // Priority-Flood：二元堆積從邊界往內淹，窪地抬到溢流高度 +ε
  const hk = [], hi = [], done = new Uint8Array(N), eps = 1e-5;
  const push = (k) => { hk.push(z[k]); hi.push(k); let c = hk.length-1;
    while(c > 0){ const p = (c-1) >> 1; if(hk[p] <= hk[c]) break; [hk[p],hk[c]] = [hk[c],hk[p]]; [hi[p],hi[c]] = [hi[c],hi[p]]; c = p; } };
  const pop = () => { const top = hi[0], lk = hk.pop(), li = hi.pop();
    if(hk.length){ hk[0] = lk; hi[0] = li; let c = 0;
      for(;;){ const l = 2*c+1, r = l+1; let s = c; if(l < hk.length && hk[l] < hk[s]) s = l; if(r < hk.length && hk[r] < hk[s]) s = r; if(s === c) break;
        [hk[s],hk[c]] = [hk[c],hk[s]]; [hi[s],hi[c]] = [hi[c],hi[s]]; c = s; } }
    return top; };
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) if(i === 0 || j === 0 || i === n-1 || j === m-1){ done[j*n+i] = 1; push(j*n+i); }
  const DI = [1,1,0,-1,-1,-1,0,1], DJ = [0,1,1,1,0,-1,-1,-1], DD = [1,Math.SQRT2,1,Math.SQRT2,1,Math.SQRT2,1,Math.SQRT2];
  while(hk.length){ const c = pop(), ci = c % n, cj = (c / n) | 0;
    for(let d = 0; d < 8; d++){ const a = ci+DI[d], b = cj+DJ[d]; if(a < 0 || b < 0 || a >= n || b >= m) continue; const k = b*n+a;
      if(done[k]) continue; done[k] = 1; if(z[k] <= z[c]) z[k] = z[c] + eps; push(k); } }
  // D8：高差 ÷ 距離 最大的下坡鄰居
  for(let k = 0; k < N; k++){ const i = k % n, j = (k / n) | 0; let best = 0;
    for(let d = 0; d < 8; d++){ const a = i+DI[d], b = j+DJ[d]; if(a < 0 || b < 0 || a >= n || b >= m) continue;
      const s = (z[k] - z[b*n+a]) / DD[d]; if(s > best){ best = s; down[k] = b*n+a; } } }
  // 由高到低累積；由低到高繼承出口編號
  const ord = Array.from({length: N}, (_, k) => k).sort((a, b) => z[b] - z[a]);
  for(const k of ord) if(down[k] >= 0) acc[down[k]] += acc[k];
  for(let t = N-1; t >= 0; t--){ const k = ord[t]; lab[k] = down[k] < 0 ? k : lab[down[k]]; }
  return {z, down, acc, lab};
}

U.GEN["G03"] = function(g, W, H, r, v, c){
  const n = 96, m = Math.max(40, Math.round(n*H/W)), sx = W/n, sy = H/m;
  const nz = U.vnoise(v*53 + 11), nz2 = U.vnoise(v*17 + 5), f0 = 2.2 + (v % 3)*.8, tilt = (v % 4)*Math.PI/2 + r()*.6;
  // 地形：多層雜訊＋整體傾斜（讓水往某一側流出）
  const hf = (i, j) => { const x = i/n, y = j/m; let h = 0, a = 1, f = f0;
    for(let o = 0; o < 4; o++){ h += nz(x*f + 3, y*f*m/n + 7)*a; a *= .5; f *= 2.1; }
    const w = nz2(x*1.5, y*1.5)*.35;
    return h*.55 + w + ((x-.5)*Math.cos(tilt) + (y-.5)*Math.sin(tilt))*.5; };
  const {z, down, acc, lab} = d8(n, m, hf);
  // 集水區大小排序，前幾名上色
  const size = new Map(); for(let k = 0; k < n*m; k++) size.set(lab[k], (size.get(lab[k]) || 0) + 1);
  const ranked = [...size.keys()].sort((a, b) => size.get(b) - size.get(a)), tint = new Map();
  const [R,G,B] = U.rgb(c), pal = [[R,G,B],[248,225,238],[150,36,102],[240,160,200],[110,70,150],[230,120,150],[190,90,170],[255,200,215]];
  ranked.forEach((lb, q) => tint.set(lb, q < 8 ? pal[(q + v) % pal.length] : [70,70,82]));
  let zmin = Infinity, zmax = -Infinity; for(let k = 0; k < n*m; k++){ zmin = Math.min(zmin, z[k]); zmax = Math.max(zmax, z[k]); }
  // 底圖：集水區色 × 山體陰影
  const img = g.createImageData(n, m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const k = j*n+i;
    const zx = z[j*n + Math.min(n-1, i+1)] - z[j*n + Math.max(0, i-1)], zy = z[Math.min(m-1, j+1)*n + i] - z[Math.max(0, j-1)*n + i];
    const shade = Math.max(0, Math.min(1, .55 - (zx + zy)*6)), elev = (z[k] - zmin)/((zmax - zmin) || 1);
    const t = .16 + .22*shade + .1*elev, col = tint.get(lab[k]);
    img.data[k*4] = 20 + col[0]*t; img.data[k*4+1] = 20 + col[1]*t; img.data[k*4+2] = 26 + col[2]*t; img.data[k*4+3] = 255; }
  const off = document.createElement("canvas"); off.width = n; off.height = m; off.getContext("2d").putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, W, H);
  // 集水區邊界（相鄰格出口不同就畫短邊）
  g.strokeStyle = "rgba(255,255,255,.28)"; g.lineWidth = .8; g.beginPath();
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const k = j*n+i;
    if(i < n-1 && lab[k] !== lab[k+1]){ g.moveTo((i+1)*sx, j*sy); g.lineTo((i+1)*sx, (j+1)*sy); }
    if(j < m-1 && lab[k] !== lab[k+n]){ g.moveTo(i*sx, (j+1)*sy); g.lineTo((i+1)*sx, (j+1)*sy); } }
  g.stroke();
  // 河網：累積量超過門檻的格子連到下游，線寬依 √累積量
  const thr = 14 + (v % 5)*6; g.lineCap = "round";
  const P = (k) => [((k % n) + .5)*sx, (((k / n) | 0) + .5)*sy];
  for(let k = 0; k < n*m; k++){ if(acc[k] < thr || down[k] < 0) continue;
    const [x1,y1] = P(k), [x2,y2] = P(down[k]), a = Math.sqrt(acc[k]);
    g.strokeStyle = a > 20 ? "#FFFFFF" : U.rgba(c, .55 + Math.min(.45, a/40)); g.lineWidth = Math.min(5.5, .5 + a*.16);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
  // 出口：流出邊界的主要集水區
  ranked.slice(0, 6).forEach(lb => { const [x,y] = P(lb); g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x, y, 2.6, 0, U.TAU); g.fill(); });
};

ART.var["G03"] = ART.var["G03"] || [];
})();

/* ================================================================
   以下為變形（V01–V12）與無照片案例的獨立畫法。
   共用一組小型地形／流向工具（獨立於上面 U.GEN["G03"] 的 d8()，
   讓每張卡可以用不同的流向規則／輸入／輸出組裝出不同構圖）。
   ================================================================ */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = U.TAU;
const rgba = U.rgba, rgb = U.rgb, poly = U.poly;

/* ---------- 共用：地形、填窪、D8／MFD 流向、累積 ---------- */
// 多層雜訊高程場＋整體傾斜
function noiseHF(nz, nz2, n, m, f0, tilt){
  return (i, j) => { const x = i/n, y = j/m; let h = 0, a = 1, f = f0;
    for(let o = 0; o < 4; o++){ h += nz(x*f + 3, y*f*m/n + 7)*a; a *= .5; f *= 2.1; }
    const w = nz2(x*1.5, y*1.5)*.35;
    return h*.55 + w + ((x-.5)*Math.cos(tilt) + (y-.5)*Math.sin(tilt))*.5; };
}
// Priority-Flood 填窪，回傳新的高程陣列
function flood(n, m, hf){
  const N = n*m, z = new Float64Array(N);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) z[j*n+i] = hf(i, j);
  const hk = [], hi = [], done = new Uint8Array(N), eps = 1e-5;
  const push = (k) => { hk.push(z[k]); hi.push(k); let c = hk.length-1;
    while(c > 0){ const p = (c-1) >> 1; if(hk[p] <= hk[c]) break; [hk[p],hk[c]] = [hk[c],hk[p]]; [hi[p],hi[c]] = [hi[c],hi[p]]; c = p; } };
  const pop = () => { const top = hi[0], lk = hk.pop(), li = hi.pop();
    if(hk.length){ hk[0] = lk; hi[0] = li; let c = 0;
      for(;;){ const l = 2*c+1, r = l+1; let s = c; if(l < hk.length && hk[l] < hk[s]) s = l; if(r < hk.length && hk[r] < hk[s]) s = r; if(s === c) break;
        [hk[s],hk[c]] = [hk[c],hk[s]]; [hi[s],hi[c]] = [hi[c],hi[s]]; c = s; } }
    return top; };
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) if(i === 0 || j === 0 || i === n-1 || j === m-1){ done[j*n+i] = 1; push(j*n+i); }
  const DI = [1,1,0,-1,-1,-1,0,1], DJ = [0,1,1,1,0,-1,-1,-1];
  while(hk.length){ const c = pop(), ci = c % n, cj = (c / n) | 0;
    for(let d = 0; d < 8; d++){ const a = ci+DI[d], b = cj+DJ[d]; if(a < 0 || b < 0 || a >= n || b >= m) continue; const k = b*n+a;
      if(done[k]) continue; done[k] = 1; if(z[k] <= z[c]) z[k] = z[c] + eps; push(k); } }
  return z;
}
// D8：每格的下坡鄰居與坡度
function d8dir(z, n, m){
  const N = n*m, down = new Int32Array(N).fill(-1), slope = new Float64Array(N);
  const DI = [1,1,0,-1,-1,-1,0,1], DJ = [0,1,1,1,0,-1,-1,-1], DD = [1,Math.SQRT2,1,Math.SQRT2,1,Math.SQRT2,1,Math.SQRT2];
  for(let k = 0; k < N; k++){ const i = k % n, j = (k / n) | 0; let best = 0;
    for(let d = 0; d < 8; d++){ const a = i+DI[d], b = j+DJ[d]; if(a < 0 || b < 0 || a >= n || b >= m) continue;
      const s = (z[k] - z[b*n+a]) / DD[d]; if(s > best){ best = s; down[k] = b*n+a; } }
    slope[k] = best; }
  return {down, slope};
}
// 依高程由高到低累積（單一流向）；w0 可指定每格初始水量（降雨權重）
function accum(down, z, n, m, w0){
  const N = n*m, acc = w0 ? Float64Array.from(w0) : new Float64Array(N).fill(1);
  const ord = Array.from({length: N}, (_, k) => k).sort((a, b) => z[b] - z[a]);
  for(const k of ord) if(down[k] >= 0) acc[down[k]] += acc[k];
  return acc;
}
// 多流向（MFD）：依 slope^p 分給所有下坡鄰居，回傳擴散開的累積場
function mfdAcc(z, n, m, p){
  const N = n*m, acc = new Float64Array(N).fill(1);
  const DI = [1,1,0,-1,-1,-1,0,1], DJ = [0,1,1,1,0,-1,-1,-1], DD = [1,Math.SQRT2,1,Math.SQRT2,1,Math.SQRT2,1,Math.SQRT2];
  const ord = Array.from({length: N}, (_, k) => k).sort((a, b) => z[b] - z[a]);
  for(const k of ord){ const i = k % n, j = (k / n) | 0, ns = []; let tot = 0;
    for(let d = 0; d < 8; d++){ const a = i+DI[d], b = j+DJ[d]; if(a < 0 || b < 0 || a >= n || b >= m) continue; const q = b*n+a;
      const s = (z[k] - z[q]) / DD[d]; if(s > 0){ const w = Math.pow(s, p); ns.push([q, w]); tot += w; } }
    if(!tot) continue;
    for(const [q, w] of ns) acc[q] += acc[k]*w/tot; }
  return acc;
}
// 山體陰影（0–1）
function shadeAt(z, n, m, i, j){
  const zx = z[j*n + Math.min(n-1, i+1)] - z[j*n + Math.max(0, i-1)], zy = z[Math.min(m-1, j+1)*n + i] - z[Math.max(0, j-1)*n + i];
  return Math.max(0, Math.min(1, .55 - (zx + zy)*6));
}
// 雙線性內插高程（x,y 為格子座標，0..n-1／0..m-1）
function zAt(z, n, m, x, y){
  const i0 = Math.max(0, Math.min(n-2, Math.floor(x))), j0 = Math.max(0, Math.min(m-2, Math.floor(y))), fx = x-i0, fy = y-j0;
  const z00 = z[j0*n+i0], z10 = z[j0*n+i0+1], z01 = z[(j0+1)*n+i0], z11 = z[(j0+1)*n+i0+1];
  return z00*(1-fx)*(1-fy) + z10*fx*(1-fy) + z01*(1-fx)*fy + z11*fx*fy;
}
function gradAt(z, n, m, x, y){
  const e = .6, xa = Math.max(.01, Math.min(n-1.01, x)), ya = Math.max(.01, Math.min(m-1.01, y));
  return [(zAt(z,n,m,Math.min(n-1,xa+e),ya) - zAt(z,n,m,Math.max(0,xa-e),ya))/(2*e),
          (zAt(z,n,m,xa,Math.min(m-1,ya+e)) - zAt(z,n,m,xa,Math.max(0,ya-e)))/(2*e)];
}
// 把 n×m 格點資料畫成像素底圖（fn(i,j) 回傳 [r,g,b]）
function rasterPaint(g, W, H, n, m, fn){
  const off = document.createElement("canvas"); off.width = n; off.height = m; const og = off.getContext("2d"), img = og.createImageData(n, m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const col = fn(i, j), k = (j*n+i)*4;
    img.data[k] = Math.max(0, Math.min(255, col[0])); img.data[k+1] = Math.max(0, Math.min(255, col[1])); img.data[k+2] = Math.max(0, Math.min(255, col[2])); img.data[k+3] = 255; }
  og.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, W, H);
}
function hsv2rgb(h, s, v){
  const i = Math.floor(h*6), f = h*6-i, p = v*(1-s), q = v*(1-f*s), t = v*(1-(1-f)*s); let r1,g1,b1;
  switch(i % 6){ case 0: r1=v; g1=t; b1=p; break; case 1: r1=q; g1=v; b1=p; break; case 2: r1=p; g1=v; b1=t; break;
    case 3: r1=p; g1=q; b1=v; break; case 4: r1=t; g1=p; b1=v; break; default: r1=v; g1=p; b1=q; }
  return [Math.round(r1*255), Math.round(g1*255), Math.round(b1*255)];
}

ART.var["G03"] = ART.var["G03"] || [];

/* ================= 變形 ================= */
// V01 D∞ 無限方向流向（Tarboton）：背景淡淡畫出 D8 的鋸齒短箭頭當對照，前景是沿連續梯度場步進的平滑曲線
ART.var["G03"][0] = function(g, W, H, r, c){
  const n = 56, m = Math.max(30, Math.round(n*H/W));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0), tilt = r()*TAU;
  const z = flood(n, m, noiseHF(nz, nz2, n, m, 2.6, tilt)), sx = W/n, sy = H/m;
  rasterPaint(g, W, H, n, m, (i,j) => { const s = shadeAt(z,n,m,i,j); const t = .10 + .12*s; return [22+t*40, 22+t*40, 30+t*50]; });
  const {down} = d8dir(z, n, m);
  g.strokeStyle = "rgba(255,255,255,.16)"; g.lineWidth = .7;
  for(let j = 1; j < m-1; j += 2) for(let i = 1; i < n-1; i += 2){ const k = j*n+i; if(down[k] < 0) continue;
    const x1 = (i+.5)*sx, y1 = (j+.5)*sy, x2 = ((down[k]%n)+.5)*sx, y2 = (((down[k]/n)|0)+.5)*sy;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1+(x2-x1)*.55, y1+(y2-y1)*.55); g.stroke(); }
  g.lineCap = "round";
  for(let s = 0; s < 70; s++){ let x = 1+r()*(n-2), y = 1+r()*(m-2); const pts = [[x*sx,y*sy]];
    for(let t = 0; t < 70; t++){ const [gx,gy] = gradAt(z,n,m,x,y), l = Math.hypot(gx,gy); if(l < 1e-4) break;
      x -= gx/l*.55; y -= gy/l*.55; if(x < 0 || y < 0 || x >= n-1 || y >= m-1) break; pts.push([x*sx,y*sy]); }
    if(pts.length < 4) continue;
    g.strokeStyle = rgba(c, .16+Math.min(.55, pts.length/140)); g.lineWidth = .9+Math.min(2.4, pts.length*.02);
    poly(g, pts); g.stroke(); }
};

// V02 多流向分流（FD8／MFD）：連續擴散場（坡面上扇形散開），疊上單一流向河道對照收斂成線
ART.var["G03"][1] = function(g, W, H, r, c){
  const n = 64, m = Math.max(34, Math.round(n*H/W));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0), tilt = r()*TAU;
  const z = flood(n, m, noiseHF(nz, nz2, n, m, 2.4, tilt)), p = 1.1 + r()*.7;
  const acc = mfdAcc(z, n, m, p), sorted = Float64Array.from(acc).sort(), mx = sorted[Math.floor(sorted.length*.94)] || 1;
  const base = [16,16,22], mid = rgb(c), hi = [255,246,235];
  rasterPaint(g, W, H, n, m, (i,j) => { const k = j*n+i, t = Math.pow(Math.min(1, acc[k]/mx), .32);
    if(t < .6){ const u = t/.6; return [base[0]+(mid[0]-base[0])*u, base[1]+(mid[1]-base[1])*u, base[2]+(mid[2]-base[2])*u]; }
    const u = (t-.6)/.4; return [mid[0]+(hi[0]-mid[0])*u, mid[1]+(hi[1]-mid[1])*u, mid[2]+(hi[2]-mid[2])*u]; });
  const {down} = d8dir(z, n, m), accD = accum(down, z, n, m), sx = W/n, sy = H/m; g.lineCap = "round";
  for(let k = 0; k < n*m; k++){ if(accD[k] < 18 || down[k] < 0) continue;
    const x1 = ((k%n)+.5)*sx, y1 = (((k/n)|0)+.5)*sy, x2 = ((down[k]%n)+.5)*sx, y2 = (((down[k]/n)|0)+.5)*sy;
    g.strokeStyle = "rgba(255,255,255,.82)"; g.lineWidth = Math.min(4, .6+Math.sqrt(accD[k])*.15);
    g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); }
};

// V03 降雨與不透水面權重：基地分區（屋頂／鋪面／綠地）＋依逕流係數加權的累積量
ART.var["G03"][2] = function(g, W, H, r, c){
  const n = 60, m = Math.max(32, Math.round(n*H/W));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0), tilt = (r()-.5)*.6;
  const z = flood(n, m, noiseHF(nz, nz2, n, m, 2.2, tilt)), sx = W/n, sy = H/m;
  const pav = [W*.08, H*.55, W*.5, H*.33], roofs = [...Array(4)].map(() => [W*(.55+r()*.3), H*(.12+r()*.35), W*(.09+r()*.05), H*(.09+r()*.05)]);
  const zone = new Uint8Array(n*m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const x = (i+.5)*sx, y = (j+.5)*sy; let zn = 0;
    if(x > pav[0] && x < pav[0]+pav[2] && y > pav[1] && y < pav[1]+pav[3]) zn = 1;
    for(const rf of roofs) if(x > rf[0] && x < rf[0]+rf[2] && y > rf[1] && y < rf[1]+rf[3]) zn = 2;
    zone[j*n+i] = zn; }
  const coef = [.2, .85, .9], w0 = new Float64Array(n*m); for(let k = 0; k < n*m; k++) w0[k] = coef[zone[k]];
  const {down} = d8dir(z, n, m), acc = accum(down, z, n, m, w0);
  rasterPaint(g, W, H, n, m, (i,j) => { const s = shadeAt(z,n,m,i,j); return [24+s*30, 24+s*30, 30+s*36]; });
  g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(pav[0], pav[1], pav[2], pav[3]);
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(pav[0]+.5, pav[1]+.5, pav[2]-1, pav[3]-1);
  roofs.forEach(rf => { g.fillStyle = rgba(c, .28); g.fillRect(rf[0], rf[1], rf[2], rf[3]); g.strokeStyle = rgba(c, .8); g.lineWidth = 1; g.strokeRect(rf[0]+.5, rf[1]+.5, rf[2]-1, rf[3]-1); });
  let mx = 0; for(let k = 0; k < n*m; k++) mx = Math.max(mx, acc[k]); g.lineCap = "round";
  for(let k = 0; k < n*m; k++){ if(acc[k] < 3 || down[k] < 0) continue;
    const x1 = ((k%n)+.5)*sx, y1 = (((k/n)|0)+.5)*sy, x2 = ((down[k]%n)+.5)*sx, y2 = (((down[k]/n)|0)+.5)*sy;
    g.strokeStyle = acc[k] > mx*.5 ? "#fff" : rgba(c, .6); g.lineWidth = Math.min(5, .5+Math.sqrt(acc[k])*.5);
    g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); }
};

// V04 建築與道路燒入地形：量體投下陰影、道路化為低窪帶，河網繞開建築、沿路集中
ART.var["G03"][3] = function(g, W, H, r, c){
  const n = 64, m = Math.max(34, Math.round(n*H/W));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0), tilt = (r()-.5)*.4;
  const hf0 = noiseHF(nz, nz2, n, m, 2.3, tilt), sx = W/n, sy = H/m;
  const bld = [...Array(3+((r()*3)|0))].map(() => [2+r()*(n-14), 2+r()*(m-10), 4+r()*5, 3+r()*4]);
  const road = [[0, m*(.3+r()*.4)], [n, m*(.3+r()*.4)+(r()-.5)*m*.3]];
  const hf = (i,j) => { let h = hf0(i,j);
    for(const b of bld) if(i > b[0] && i < b[0]+b[2] && j > b[1] && j < b[1]+b[3]) h += 2.5;
    const t = (i-road[0][0])/((road[1][0]-road[0][0])||1), ry = road[0][1]+(road[1][1]-road[0][1])*Math.max(0,Math.min(1,t)), d = Math.abs(j-ry);
    if(d < 1.6) h -= .4*(1-d/1.6);
    return h; };
  const z = flood(n, m, hf), {down} = d8dir(z, n, m), acc = accum(down, z, n, m);
  rasterPaint(g, W, H, n, m, (i,j) => { const s = shadeAt(z,n,m,i,j); return [22+s*34, 22+s*34, 28+s*40]; });
  g.strokeStyle = "rgba(255,255,255,.10)"; g.lineWidth = 1.6*sy; g.beginPath(); g.moveTo(road[0][0]*sx, road[0][1]*sy); g.lineTo(road[1][0]*sx, road[1][1]*sy); g.stroke();
  bld.forEach(b => { const x = b[0]*sx, y = b[1]*sy, w = b[2]*sx, h = b[3]*sy;
    g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(x+3, y+3, w, h);
    g.fillStyle = "#1B1B22"; g.fillRect(x, y, w, h);
    g.strokeStyle = rgba(c, .7); g.lineWidth = 1; g.strokeRect(x+.5, y+.5, w-1, h-1); });
  let mx = 0; for(let k = 0; k < n*m; k++) mx = Math.max(mx, acc[k]); g.lineCap = "round";
  for(let k = 0; k < n*m; k++){ if(acc[k] < 10 || down[k] < 0) continue;
    const x1 = ((k%n)+.5)*sx, y1 = (((k/n)|0)+.5)*sy, x2 = ((down[k]%n)+.5)*sx, y2 = (((down[k]/n)|0)+.5)*sy;
    g.strokeStyle = acc[k] > mx*.4 ? "#fff" : rgba(c, .6); g.lineWidth = Math.min(4.5, .5+Math.sqrt(acc[k])*.32);
    g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); }
};

// V05 保留窪地：積水點與滯洪池——比較原始與填窪後高程，找出相連的積水群並畫成有機藍色斑塊（不畫河網）
ART.var["G03"][4] = function(g, W, H, r, c){
  const n = 60, m = Math.max(32, Math.round(n*H/W));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0), tilt = r()*TAU, hf = noiseHF(nz, nz2, n, m, 2.0, tilt);
  const z0 = new Float64Array(n*m); for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) z0[j*n+i] = hf(i,j);
  const zf = flood(n, m, hf), depth = new Float64Array(n*m); for(let k = 0; k < n*m; k++) depth[k] = Math.max(0, zf[k]-z0[k]);
  const sx = W/n, sy = H/m;
  rasterPaint(g, W, H, n, m, (i,j) => { const s = shadeAt(zf,n,m,i,j); return [20+s*26, 20+s*26, 26+s*30]; });
  const vis = new Uint8Array(n*m), groups = [];
  for(let s0 = 0; s0 < n*m; s0++){ if(vis[s0] || depth[s0] <= 1e-4) continue;
    const q = [s0]; vis[s0] = 1; const cells = [];
    while(q.length){ const k = q.pop(); cells.push(k); const i = k%n, j = (k/n)|0;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([di,dj]) => { const a = i+di, b = j+dj; if(a < 0 || b < 0 || a >= n || b >= m) return; const kk = b*n+a;
        if(!vis[kk] && depth[kk] > 1e-4){ vis[kk] = 1; q.push(kk); } }); }
    if(cells.length >= 2) groups.push(cells); }
  groups.forEach(cells => { let cx = 0, cy = 0; cells.forEach(k => { cx += k%n; cy += (k/n)|0; }); cx /= cells.length; cy /= cells.length;
    const R = Math.sqrt(cells.length/Math.PI)*Math.min(sx,sy)*1.15, pts = [], nn = 16;
    for(let k = 0; k < nn; k++){ const a = k/nn*TAU; pts.push([cx*sx+Math.cos(a)*R*(.75+.3*Math.sin(a*3+cx)), cy*sy+Math.sin(a)*R*(.75+.3*Math.cos(a*3+cy))]); }
    g.fillStyle = "rgba(102,200,255,.5)"; poly(g, pts, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.stroke(); });
};

// V06 河序決定管徑與草溝寬度：把河道畫成有粗細漸變的管件（管壁＋高光＋節點球）
ART.var["G03"][5] = function(g, W, H, r, c){
  const n = 48, m = Math.max(26, Math.round(n*H/W));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0), tilt = r()*TAU;
  const z = flood(n, m, noiseHF(nz, nz2, n, m, 2.4, tilt)), {down} = d8dir(z, n, m), acc = accum(down, z, n, m), sx = W/n, sy = H/m;
  const ord = k => Math.log2(1+acc[k]); let maxo = 0; for(let k = 0; k < n*m; k++) maxo = Math.max(maxo, ord(k));
  rasterPaint(g, W, H, n, m, (i,j) => { const s = shadeAt(z,n,m,i,j); return [20+s*20, 20+s*20, 26+s*24]; });
  const order = Array.from({length: n*m}, (_,k) => k).filter(k => acc[k] >= 6 && down[k] >= 0).sort((a,b) => acc[a]-acc[b]);
  g.lineCap = "round"; g.lineJoin = "round";
  for(const k of order){ const o = ord(k), rW = Math.max(1.1, o/maxo*10);
    const x1 = ((k%n)+.5)*sx, y1 = (((k/n)|0)+.5)*sy, x2 = ((down[k]%n)+.5)*sx, y2 = (((down[k]/n)|0)+.5)*sy;
    g.strokeStyle = "rgba(10,10,14,.9)"; g.lineWidth = rW+1.6; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
    g.strokeStyle = rgba(c, .85); g.lineWidth = rW; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
    const nx = -(y2-y1), ny = (x2-x1), l = Math.hypot(nx,ny)||1, off = rW*.22;
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = Math.max(.6, rW*.28);
    g.beginPath(); g.moveTo(x1+nx/l*off, y1+ny/l*off); g.lineTo(x2+nx/l*off, y2+ny/l*off); g.stroke(); }
  const junc = new Map(); for(let k = 0; k < n*m; k++){ if(down[k] >= 0 && acc[k] >= 6) junc.set(down[k], Math.max(junc.get(down[k])||0, acc[k])); }
  junc.forEach((v,k) => { const o = ord(k), rW = Math.max(1.4, o/maxo*10), x = ((k%n)+.5)*sx, y = (((k/n)|0)+.5)*sy;
    g.fillStyle = rgba(c, .9); g.beginPath(); g.arc(x, y, rW*.6, 0, TAU); g.fill();
    g.fillStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.arc(x-rW*.15, y-rW*.15, rW*.22, 0, TAU); g.fill(); });
};

// V07 畫一條溝，比較改造前後：Δacc 紅（減少）藍（增加）差異圖，疊上截水溝線
ART.var["G03"][6] = function(g, W, H, r, c){
  const n = 56, m = Math.max(30, Math.round(n*H/W));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0), tilt = r()*TAU, hf0 = noiseHF(nz, nz2, n, m, 2.2, tilt);
  const z1 = flood(n, m, hf0), {down: d1} = d8dir(z1, n, m), acc1 = accum(d1, z1, n, m);
  const swale = [...Array(9)].map((_,k) => [2+(n-4)*k/8+(r()-.5)*3, m*(.3+r()*.4)+Math.sin(k*.8+r()*5)*m*.12]);
  const hf = (i,j) => { let h = hf0(i,j), dmin = 1e9;
    for(let k = 1; k < swale.length; k++){ const a = swale[k-1], b = swale[k], vx = b[0]-a[0], vy = b[1]-a[1];
      const t = Math.max(0, Math.min(1, ((i-a[0])*vx+(j-a[1])*vy)/(vx*vx+vy*vy||1))), dx = i-(a[0]+vx*t), dy = j-(a[1]+vy*t);
      dmin = Math.min(dmin, Math.hypot(dx,dy)); }
    if(dmin < 1.8) h -= .6*(1-dmin/1.8);
    return h; };
  const z2 = flood(n, m, hf), {down: d2} = d8dir(z2, n, m), acc2 = accum(d2, z2, n, m), sx = W/n, sy = H/m;
  let mxd = 1e-6; for(let k = 0; k < n*m; k++) mxd = Math.max(mxd, Math.abs(acc2[k]-acc1[k]));
  rasterPaint(g, W, H, n, m, (i,j) => { const k = j*n+i, raw = (acc2[k]-acc1[k])/mxd, d = Math.max(-1, Math.min(1, raw));
    const base = [18,18,26], pos = [80,190,255], neg = [235,70,70], t = Math.abs(d), tgt = d >= 0 ? pos : neg;
    return [base[0]+(tgt[0]-base[0])*t, base[1]+(tgt[1]-base[1])*t, base[2]+(tgt[2]-base[2])*t]; });
  g.lineCap = "round";
  for(let k = 0; k < n*m; k++){ if(acc1[k] < 14 || d1[k] < 0) continue;
    const x1 = ((k%n)+.5)*sx, y1 = (((k/n)|0)+.5)*sy, x2 = ((d1[k]%n)+.5)*sx, y2 = (((d1[k]/n)|0)+.5)*sy;
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = .8; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); }
  g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.setLineDash([5,4]); g.beginPath();
  swale.forEach((p,k) => { const x = p[0]*sx, y = p[1]*sy; k ? g.lineTo(x,y) : g.moveTo(x,y); }); g.stroke(); g.setLineDash([]);
};

// V08 河流侵蝕地形演化（stream power）：三格時間切片，地形逐漸被切出更深的谷
ART.var["G03"][7] = function(g, W, H, r, c){
  const n = 44, m = Math.max(24, Math.round(n*H/W));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0), tilt = r()*TAU;
  let z = flood(n, m, noiseHF(nz, nz2, n, m, 2.0, tilt));
  const N = n*m, steps = 40, K = .03, uplift = .004, snaps = [];
  for(let s = 1; s <= steps; s++){
    z = flood(n, m, (i,j) => z[j*n+i]);
    const {down, slope} = d8dir(z, n, m), acc = accum(down, z, n, m), nzz = new Float64Array(N);
    for(let k = 0; k < N; k++) nzz[k] = z[k] - K*Math.pow(acc[k], .5)*slope[k]*1.4 + uplift;
    z = nzz;
    if(s === Math.round(steps*.25) || s === Math.round(steps*.6) || s === steps) snaps.push(Float64Array.from(z));
  }
  const pw = (W-16)/3, ph = H-16, y0 = 8;
  snaps.forEach((zz, p) => {
    const x0 = 8+p*(pw+4), sx = pw/n, sy = ph/m;
    g.save(); g.translate(x0, y0); g.beginPath(); g.rect(0, 0, pw, ph); g.clip();
    rasterPaint(g, pw, ph, n, m, (i,j) => { const s = shadeAt(zz,n,m,i,j); return [18+s*40, 18+s*40, 24+s*46]; });
    const {down} = d8dir(zz, n, m), acc = accum(down, zz, n, m); let mx = 0; for(let k = 0; k < N; k++) mx = Math.max(mx, acc[k]);
    g.lineCap = "round";
    for(let k = 0; k < N; k++){ if(acc[k] < 8 || down[k] < 0) continue;
      const x1 = ((k%n)+.5)*sx, y1 = (((k/n)|0)+.5)*sy, x2 = ((down[k]%n)+.5)*sx, y2 = (((down[k]/n)|0)+.5)*sy;
      g.strokeStyle = acc[k] > mx*.35 ? "#fff" : rgba(c, .65); g.lineWidth = Math.min(3, .4+Math.sqrt(acc[k])*.22);
      g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); }
    g.restore();
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(x0+.5, y0+.5, pw-1, ph-1);
  });
};

// V09 三角網格（TIN）上的流向：不規則點雲＋近似三角網的邊，流線沿邊蜿蜒（不再是格子的 45°）
ART.var["G03"][8] = function(g, W, H, r, c){
  const rad = Math.min(W,H)*.06, cs = rad/Math.SQRT2, gw = Math.ceil(W/cs), gh = Math.ceil(H/cs), grid = new Int32Array(gw*gh).fill(-1), P = [], act = [];
  const add = p => { P.push(p); act.push(P.length-1); grid[((p[1]/cs)|0)*gw + ((p[0]/cs)|0)] = P.length-1; };
  add([W/2, H/2]);
  while(act.length && P.length < 300){ const k = (r()*act.length)|0, p = P[act[k]]; let ok = false;
    for(let t = 0; t < 24; t++){ const a = r()*TAU, d = rad*(1+r()), q = [p[0]+Math.cos(a)*d, p[1]+Math.sin(a)*d];
      if(q[0] < 0 || q[1] < 0 || q[0] >= W || q[1] >= H) continue; const gx = (q[0]/cs)|0, gy = (q[1]/cs)|0; let far = true;
      for(let y = Math.max(0,gy-2); y <= Math.min(gh-1,gy+2) && far; y++) for(let x = Math.max(0,gx-2); x <= Math.min(gw-1,gx+2); x++){ const ii = grid[y*gw+x]; if(ii >= 0 && Math.hypot(P[ii][0]-q[0], P[ii][1]-q[1]) < rad){ far = false; break; } }
      if(far){ add(q); ok = true; break; } }
    if(!ok) act.splice(k,1); }
  const N = P.length, nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0), tilt = r()*TAU;
  const zp = P.map(p => { const x = p[0]/W, y = p[1]/H; return nz(x*3+3,y*3+7)*.6+nz2(x*1.3,y*1.3)*.4 + ((x-.5)*Math.cos(tilt)+(y-.5)*Math.sin(tilt))*.5; });
  const kNN = 6, edges = new Map();
  for(let i = 0; i < N; i++){ const ds = []; for(let j = 0; j < N; j++) if(j !== i) ds.push([Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1]), j]);
    ds.sort((a,b) => a[0]-b[0]); for(let t = 0; t < Math.min(kNN, ds.length); t++){ const j = ds[t][1]; edges.set(Math.min(i,j)*100000+Math.max(i,j), [Math.min(i,j),Math.max(i,j)]); } }
  const E = [...edges.values()], nbr = Array.from({length: N}, () => []);
  E.forEach(([a,b]) => { nbr[a].push(b); nbr[b].push(a); });
  const down = new Int32Array(N).fill(-1);
  for(let i = 0; i < N; i++){ let best = 0; for(const j of nbr[i]){ const d = Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1]), s = (zp[i]-zp[j])/(d||1); if(s > best){ best = s; down[i] = j; } } }
  const acc = new Float64Array(N).fill(1), ord = Array.from({length: N}, (_,k) => k).sort((a,b) => zp[b]-zp[a]);
  for(const k of ord) if(down[k] >= 0) acc[down[k]] += acc[k];
  g.strokeStyle = "rgba(255,255,255,.09)"; g.lineWidth = .7;
  E.forEach(([a,b]) => { g.beginPath(); g.moveTo(P[a][0],P[a][1]); g.lineTo(P[b][0],P[b][1]); g.stroke(); });
  let mx = 0; for(let k = 0; k < N; k++) mx = Math.max(mx, acc[k]); g.lineCap = "round";
  for(let i = 0; i < N; i++){ if(down[i] < 0 || acc[i] < 2) continue; const j = down[i];
    const mxp = (P[i][0]+P[j][0])/2 + (P[j][1]-P[i][1])*.12, myp = (P[i][1]+P[j][1])/2 - (P[j][0]-P[i][0])*.12;
    g.strokeStyle = acc[i] > mx*.4 ? "#fff" : rgba(c, .7); g.lineWidth = Math.min(4, .6+Math.sqrt(acc[i])*.5);
    g.beginPath(); g.moveTo(P[i][0],P[i][1]); g.quadraticCurveTo(mxp,myp,P[j][0],P[j][1]); g.stroke(); }
  g.fillStyle = rgba(c, .6); P.forEach(p => { g.beginPath(); g.arc(p[0],p[1],1.6,0,TAU); g.fill(); });
};

// V10 自由曲面屋頂排水：等角波浪屋面，uv 網格上算 D8，流線收斂到簷邊落水頭
ART.var["G03"][9] = function(g, W, H, r, c){
  const nu = 34, nv = 22, amp = .28+r()*.14, ph1 = r()*TAU, ph2 = r()*TAU, freq = 1+((r()*2)|0);
  const Z = (u,v) => .22 + amp*Math.sin(Math.PI*u*freq+ph1)*(.6+.4*Math.cos(TAU*v*1.1+ph2));
  const A = Math.min(W,H)*.5, ox = W/2, oy = H*.42;
  const P = (u,v,z) => [ox+(u-v)*A*.86, oy+(u+v)*A*.48 - z*A*.9], S = (u,v) => P(u,v,Z(u,v));
  g.fillStyle = "rgba(0,0,0,.3)"; poly(g, [P(0,0,0),P(1,0,0),P(1,1,0),P(0,1,0)], true); g.fill();
  const zg = new Float64Array(nu*nv); for(let j = 0; j < nv; j++) for(let i = 0; i < nu; i++) zg[j*nu+i] = Z(i/(nu-1), j/(nv-1));
  const {down} = d8dir(zg, nu, nv), acc = accum(down, zg, nu, nv);
  for(let j = 0; j < nv-1; j++) for(let i = 0; i < nu-1; i++){ const a = S(i/(nu-1),j/(nv-1)), b = S((i+1)/(nu-1),j/(nv-1)), cc = S((i+1)/(nu-1),(j+1)/(nv-1)), d = S(i/(nu-1),(j+1)/(nv-1));
    g.fillStyle = rgba(c, .10); poly(g, [a,b,cc,d], true); g.fill(); g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = .6; g.stroke(); }
  let mx = 0; for(let k = 0; k < nu*nv; k++) mx = Math.max(mx, acc[k]); g.lineCap = "round";
  for(let k = 0; k < nu*nv; k++){ if(acc[k] < 3 || down[k] < 0) continue; const i = k%nu, j = (k/nu)|0, di = down[k]%nu, dj = (down[k]/nu)|0;
    const p = S(i/(nu-1),j/(nv-1)), q = S(di/(nu-1),dj/(nv-1));
    g.strokeStyle = acc[k] > mx*.5 ? "#fff" : rgba(c, .75); g.lineWidth = Math.min(3.4, .5+Math.sqrt(acc[k])*.4);
    g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); }
  for(let k = 0; k < nu*nv; k++){ if(down[k] >= 0 || acc[k] <= 2) continue; const i = k%nu, j = (k/nu)|0, p = S(i/(nu-1),j/(nv-1));
    g.fillStyle = "#fff"; g.beginPath(); g.arc(p[0],p[1], 2+Math.min(3,Math.sqrt(acc[k])*.5), 0, TAU); g.fill(); }
};

// V11 沿稜線的步道：集水區分水嶺（亮線）當低成本路徑，Dijkstra 找一條貼著稜線、避開河道的步道
ART.var["G03"][10] = function(g, W, H, r, c){
  const n = 50, m = Math.max(28, Math.round(n*H/W));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0), tilt = r()*TAU;
  const z = flood(n, m, noiseHF(nz, nz2, n, m, 2.3, tilt)), {down} = d8dir(z, n, m), acc = accum(down, z, n, m), sx = W/n, sy = H/m;
  const lab = new Int32Array(n*m), ordDesc = Array.from({length: n*m}, (_,k) => k).sort((a,b) => z[b]-z[a]);
  for(let t = n*m-1; t >= 0; t--){ const k = ordDesc[t]; lab[k] = down[k] < 0 ? k : lab[down[k]]; }
  const divide = new Uint8Array(n*m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const k = j*n+i;
    if(i < n-1 && lab[k] !== lab[k+1]){ divide[k] = 1; divide[k+1] = 1; }
    if(j < m-1 && lab[k] !== lab[k+n]){ divide[k] = 1; divide[k+n] = 1; } }
  const cost = new Float64Array(n*m); for(let k = 0; k < n*m; k++) cost[k] = divide[k] ? .3 : 1+Math.log(1+acc[k])*.9;
  rasterPaint(g, W, H, n, m, (i,j) => { const s = shadeAt(z,n,m,i,j); return [18+s*28, 18+s*28, 24+s*32]; });
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1;
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const k = j*n+i;
    if(i < n-1 && lab[k] !== lab[k+1]){ g.beginPath(); g.moveTo((i+1)*sx, j*sy); g.lineTo((i+1)*sx, (j+1)*sy); g.stroke(); }
    if(j < m-1 && lab[k] !== lab[k+n]){ g.beginPath(); g.moveTo(i*sx, (j+1)*sy); g.lineTo((i+1)*sx, (j+1)*sy); g.stroke(); } }
  g.lineCap = "round";
  for(let k = 0; k < n*m; k++){ if(acc[k] < 14 || down[k] < 0) continue;
    const x1 = ((k%n)+.5)*sx, y1 = (((k/n)|0)+.5)*sy, x2 = ((down[k]%n)+.5)*sx, y2 = (((down[k]/n)|0)+.5)*sy;
    g.strokeStyle = rgba(c, .35); g.lineWidth = 1; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); }
  const dist = new Float64Array(n*m).fill(Infinity), prev = new Int32Array(n*m).fill(-1);
  let S0 = 0, best = -1; for(let j = 0; j < m; j++){ const k = j*n; if(divide[k] && z[k] > best){ best = z[k]; S0 = k; } }
  let T0 = n-1; best = -1; for(let j = 0; j < m; j++){ const k = j*n+n-1; if(divide[k] && z[k] > best){ best = z[k]; T0 = k; } }
  dist[S0] = 0; const Q = [S0];
  while(Q.length){ let bi = 0; for(let t = 1; t < Q.length; t++) if(dist[Q[t]] < dist[Q[bi]]) bi = t; const u = Q.splice(bi,1)[0], x = u%n, y = (u/n)|0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){ const nx = x+dx, ny = y+dy; if(nx < 0 || ny < 0 || nx >= n || ny >= m) continue; const q = ny*n+nx, w = (cost[u]+cost[q])/2*Math.hypot(dx,dy);
      if(dist[u]+w < dist[q]){ if(dist[q] === Infinity) Q.push(q); dist[q] = dist[u]+w; prev[q] = u; } } }
  if(T0 === S0 || prev[T0] >= 0){ const path = []; for(let u = T0; u >= 0; u = prev[u]){ path.push([(u%n+.5)*sx, ((u/n|0)+.5)*sy]); if(u === S0) break; }
    g.strokeStyle = "rgba(20,16,10,.55)"; g.lineWidth = 3.4; g.lineCap = "round"; g.lineJoin = "round"; poly(g, path); g.stroke();
    g.strokeStyle = "#FFD24D"; g.lineWidth = 2; poly(g, path); g.stroke(); }
};

// V12 濕度指數 TWI 植栽分區：由乾（稜線）到濕（谷底）分 5 段上色，各段撒幾個植栽符號
ART.var["G03"][11] = function(g, W, H, r, c){
  const n = 60, m = Math.max(32, Math.round(n*H/W));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0), tilt = r()*TAU;
  const z = flood(n, m, noiseHF(nz, nz2, n, m, 2.2, tilt)), {down, slope} = d8dir(z, n, m), acc = accum(down, z, n, m);
  const twi = new Float64Array(n*m); for(let k = 0; k < n*m; k++) twi[k] = Math.log(acc[k]/Math.max(.001, slope[k]));
  let lo = Infinity, hi = -Infinity; for(let k = 0; k < n*m; k++){ lo = Math.min(lo, twi[k]); hi = Math.max(hi, twi[k]); }
  const bands = 5, pal = [[214,196,140],[176,190,120],[120,176,120],[70,150,150],[60,110,190]], sx = W/n, sy = H/m;
  const bandOf = k => Math.min(bands-1, Math.max(0, ((twi[k]-lo)/((hi-lo)||1)*bands)|0));
  rasterPaint(g, W, H, n, m, (i,j) => { const k = j*n+i, col = pal[bandOf(k)], s = shadeAt(z,n,m,i,j);
    return [col[0]*(.55+.35*s), col[1]*(.55+.35*s), col[2]*(.55+.35*s)]; });
  g.strokeStyle = "rgba(20,20,26,.55)"; g.lineWidth = .8;
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const k = j*n+i;
    if(i < n-1 && bandOf(k) !== bandOf(k+1)){ g.beginPath(); g.moveTo((i+1)*sx, j*sy); g.lineTo((i+1)*sx, (j+1)*sy); g.stroke(); }
    if(j < m-1 && bandOf(k) !== bandOf(k+n)){ g.beginPath(); g.moveTo(i*sx, (j+1)*sy); g.lineTo((i+1)*sx, (j+1)*sy); g.stroke(); } }
  for(let b = 0; b < bands; b++){ const cells = []; for(let k = 0; k < n*m; k++) if(bandOf(k) === b) cells.push(k);
    if(!cells.length) continue;
    for(let t = 0; t < Math.min(6, Math.ceil(cells.length/60)); t++){ const k = cells[(r()*cells.length)|0], x = ((k%n)+.3+r()*.4)*sx, y = (((k/n)|0)+.3+r()*.4)*sy;
      g.strokeStyle = "rgba(20,20,26,.8)"; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 2.4, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(x, y-3.2); g.lineTo(x, y+3.2); g.moveTo(x-3.2, y); g.lineTo(x+3.2, y); g.stroke(); } }
};

/* ================= 沒有照片的案例 ================= */
// G03-01 Groundhog：左側地形＋流路縮圖，右側 GH 元件方塊與導線，代表外掛的節點介面
ART.case["G03-01"] = function(g, W, H, r, c){
  const pw = W*.42;
  g.save(); g.beginPath(); g.rect(0, 0, pw, H); g.clip();
  const n = 40, m = Math.max(22, Math.round(n*H/pw));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0);
  const z = flood(n, m, noiseHF(nz, nz2, n, m, 2.4, r()*TAU)), {down} = d8dir(z, n, m), acc = accum(down, z, n, m);
  rasterPaint(g, pw, H, n, m, (i,j) => { const s = shadeAt(z,n,m,i,j); return [18+s*30, 18+s*30, 24+s*36]; });
  const sx = pw/n, sy = H/m; let mx = 0; for(let k = 0; k < n*m; k++) mx = Math.max(mx, acc[k]); g.lineCap = "round";
  for(let k = 0; k < n*m; k++){ if(acc[k] < 8 || down[k] < 0) continue;
    const x1 = ((k%n)+.5)*sx, y1 = (((k/n)|0)+.5)*sy, x2 = ((down[k]%n)+.5)*sx, y2 = (((down[k]/n)|0)+.5)*sy;
    g.strokeStyle = acc[k] > mx*.4 ? "#fff" : rgba(c, .7); g.lineWidth = Math.min(3, .4+Math.sqrt(acc[k])*.28);
    g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); }
  g.restore();
  const nodes = [[.55,.14],[.55,.4],[.78,.27],[.55,.66],[.8,.66],[.62,.9]].map(([u,v]) => [W*u,H*v]);
  const links = [[0,2],[1,2],[2,4],[3,4],[4,5]];
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.4;
  links.forEach(([a,b]) => { const A = nodes[a], B = nodes[b]; g.beginPath(); g.moveTo(A[0],A[1]); g.bezierCurveTo(A[0]+18,A[1],B[0]-18,B[1],B[0],B[1]); g.stroke(); });
  nodes.forEach((p,idx) => { const w = W*.15, h = H*.09;
    g.fillStyle = idx%2 ? rgba(c, .85) : "#1D1D25"; g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1;
    g.beginPath(); if(g.roundRect) g.roundRect(p[0]-w/2, p[1]-h/2, w, h, 3); else g.rect(p[0]-w/2, p[1]-h/2, w, h); g.fill(); g.stroke();
    g.fillStyle = "#fff"; [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([sxn,syn]) => { g.beginPath(); g.arc(p[0]+sxn*w/2, p[1]+syn*h*.22, 1.6, 0, TAU); g.fill(); }); });
};

// G03-02 MAX IV 實驗室地景：鳥瞰有機同心波紋土丘，丘間帶淡淡排水示意線
ART.case["G03-02"] = function(g, W, H, r, c){
  g.fillStyle = "rgba(60,80,50,.15)"; g.fillRect(0, 0, W, H);
  const cx = W*.46, cy = H*.52, R = Math.min(W,H)*.42, rings = 7, ph = r()*TAU;
  g.save(); g.translate(cx, cy);
  for(let k = rings; k >= 1; k--){ const rr = R*k/rings, wob = R*.05, pts = [];
    for(let a = 0; a <= 64; a++){ const t = a/64*TAU, rad = rr + Math.sin(t*3+ph+k)*wob*(k/rings);
      pts.push([Math.cos(t)*rad*1.15, Math.sin(t)*rad*.7]); }
    g.beginPath(); pts.forEach((p,i) => i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1])); g.closePath();
    const t = k/rings; g.fillStyle = rgba(c, .10+(1-t)*.16); g.fill(); g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1; g.stroke(); }
  g.restore();
  g.strokeStyle = rgba(c, .5); g.lineWidth = 1;
  for(let a = 0; a < 8; a++){ const t = a/8*TAU + ph*.3;
    g.beginPath(); g.moveTo(cx+Math.cos(t)*R*1.15, cy+Math.sin(t)*R*.75); g.lineTo(cx+Math.cos(t)*R*1.5, cy+Math.sin(t)*R*.95); g.stroke(); }
};

// G03-03 Rainwater+：都市街廓的逕流表現色階＋排水管線串到出口
ART.case["G03-03"] = function(g, W, H, r, c){
  const cols = 5+((r()*2)|0), rows = 4+((r()*2)|0), cw = W/cols, rh = H/rows, nz = U.vnoise((r()*1e9)|0);
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){ const t = nz(i*.6,j*.6), [R,G,B] = rgb(c);
    g.fillStyle = `rgb(${(18+R*t)|0},${(18+G*t)|0},${(26+B*t)|0})`; g.fillRect(i*cw+1, j*rh+1, cw-2, rh-2); }
  g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1;
  for(let i = 1; i < cols; i++){ g.beginPath(); g.moveTo(i*cw, 0); g.lineTo(i*cw, H); g.stroke(); }
  for(let j = 1; j < rows; j++){ g.beginPath(); g.moveTo(0, j*rh); g.lineTo(W, j*rh); g.stroke(); }
  g.strokeStyle = "#fff"; g.lineWidth = 1.8; g.lineCap = "round"; g.beginPath();
  let x = cw*.5, y = rh*.5; g.moveTo(x,y);
  for(let s = 0; s < 6; s++){ if(r() < .5) x = Math.min(W-cw*.5, x+cw); else y = Math.min(H-rh*.5, y+rh); g.lineTo(x,y); }
  g.stroke(); g.fillStyle = c; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
};

// G03-04 支援永續都市綠地設計的整合雨水分析模型：粒子沿梯度下滑留下拖尾，量化綠地上的逕流
ART.case["G03-04"] = function(g, W, H, r, c){
  const n = 52, m = Math.max(28, Math.round(n*H/W));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0);
  const z = flood(n, m, noiseHF(nz, nz2, n, m, 2.1, r()*TAU)), sx = W/n, sy = H/m;
  rasterPaint(g, W, H, n, m, (i,j) => { const s = shadeAt(z,n,m,i,j); return [16+s*22, 18+s*24, 22+s*28]; });
  g.lineCap = "round";
  for(let p = 0; p < 220; p++){ let x = 1+r()*(n-2), y = 1+r()*(m-2); const trail = [[x*sx,y*sy]];
    for(let t = 0; t < 10; t++){ const [gx,gy] = gradAt(z,n,m,x,y), l = Math.hypot(gx,gy)||1e-4;
      x -= gx/l*.5; y -= gy/l*.5; if(x < 0 || y < 0 || x >= n-1 || y >= m-1) break; trail.push([x*sx,y*sy]); }
    const tt = trail.length/11;
    g.strokeStyle = rgba(c, .12+tt*.35); g.lineWidth = 1; poly(g, trail); g.stroke();
    const last = trail[trail.length-1]; g.fillStyle = `rgba(191,231,255,${.5+tt*.4})`; g.beginPath(); g.arc(last[0],last[1],1,0,TAU); g.fill(); }
};

// G03-05 水文與土方成本效益的地形改造多目標最佳化：多個候選地形的河網疊圖（漸淡→最終方案），角落 Pareto 前緣散點
ART.case["G03-05"] = function(g, W, H, r, c){
  const n = 44, m = Math.max(24, Math.round(n*H/W)), nzBase = U.vnoise((r()*1e9)|0), cands = 5, sx = W/n, sy = H/m;
  for(let ci = 0; ci < cands; ci++){ const tilt = r()*TAU, hf = noiseHF(nzBase, U.vnoise((r()*1e9)|0), n, m, 2+ci*.2, tilt);
    const z = flood(n, m, hf), {down} = d8dir(z, n, m), acc = accum(down, z, n, m); let mx = 0; for(let k = 0; k < n*m; k++) mx = Math.max(mx, acc[k]);
    const alpha = ci === cands-1 ? .9 : .12+ci*.05; g.lineCap = "round";
    for(let k = 0; k < n*m; k++){ if(acc[k] < 10 || down[k] < 0) continue;
      const x1 = ((k%n)+.5)*sx, y1 = (((k/n)|0)+.5)*sy, x2 = ((down[k]%n)+.5)*sx, y2 = (((down[k]/n)|0)+.5)*sy;
      g.strokeStyle = ci === cands-1 ? "#fff" : rgba(c, alpha); g.lineWidth = ci === cands-1 ? Math.min(3, .6+Math.sqrt(acc[k])*.3) : .8;
      g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); } }
  const px = W-W*.28, py = H*.06, pw = W*.24, ph = H*.22;
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(px, py, pw, ph);
  const pts = [...Array(14)].map(() => [r(), r()]).sort((a,b) => a[0]-b[0]);
  let front = [], besty = 1e9; pts.forEach(p => { if(p[1] < besty){ besty = p[1]; front.push(p); } });
  g.fillStyle = "rgba(255,255,255,.35)"; pts.forEach(p => { g.beginPath(); g.arc(px+p[0]*pw, py+ph-p[1]*ph, 1.6, 0, TAU); g.fill(); });
  g.strokeStyle = c; g.lineWidth = 1.4; g.beginPath();
  front.forEach((p,idx) => { const x = px+p[0]*pw, y = py+ph-p[1]*ph; idx ? g.lineTo(x,y) : g.moveTo(x,y); }); g.stroke();
  g.fillStyle = c; front.forEach(p => { g.beginPath(); g.arc(px+p[0]*pw, py+ph-p[1]*ph, 2, 0, TAU); g.fill(); });
};

// G03-51 Fantasy map generator（terrain.js）：不規則點雲＋高地 hachure 交叉短線，單線河流，泛黃地圖感
ART.case["G03-51"] = function(g, W, H, r, c){
  const N = 140, P = [...Array(N)].map(() => [r()*W, r()*H]);
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0);
  const zp = P.map(p => { const x = p[0]/W, y = p[1]/H; return nz(x*3,y*3)*.7+nz2(x*1.4,y*1.4)*.3 - Math.hypot(x-.5,y-.5)*.6; });
  const kNN = 5, edges = new Map();
  for(let i = 0; i < N; i++){ const ds = []; for(let j = 0; j < N; j++) if(j !== i) ds.push([Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1]), j]);
    ds.sort((a,b) => a[0]-b[0]); for(let t = 0; t < kNN; t++) edges.set(Math.min(i,ds[t][1])*1000+Math.max(i,ds[t][1]), [i,ds[t][1]]); }
  const down = new Int32Array(N).fill(-1), nbr = Array.from({length: N}, () => []);
  edges.forEach(([a,b]) => { nbr[a].push(b); nbr[b].push(a); });
  for(let i = 0; i < N; i++){ let best = 0; for(const j of nbr[i]){ const d = Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1]), s = (zp[i]-zp[j])/(d||1); if(s > best){ best = s; down[i] = j; } } }
  const acc = new Float64Array(N).fill(1), ord = Array.from({length: N}, (_,k) => k).sort((a,b) => zp[b]-zp[a]);
  for(const k of ord) if(down[k] >= 0) acc[down[k]] += acc[k];
  g.fillStyle = "rgba(210,190,150,.06)"; g.fillRect(0, 0, W, H);
  const INK = "rgba(235,222,195,.55)";
  P.forEach((p,i) => { if(zp[i] < .28) return; const s = (zp[i]-.28)*10, n2 = 2+((s)|0);
    for(let k = 0; k < n2; k++){ const a = r()*TAU, l = 2+r()*4;
      g.strokeStyle = INK; g.lineWidth = .7; g.beginPath(); g.moveTo(p[0]-Math.cos(a)*l, p[1]-Math.sin(a)*l); g.lineTo(p[0]+Math.cos(a)*l, p[1]+Math.sin(a)*l); g.stroke(); } });
  g.strokeStyle = rgba(c, .85); g.lineCap = "round";
  for(let i = 0; i < N; i++){ if(down[i] < 0 || acc[i] < 3) continue; const j = down[i];
    g.lineWidth = Math.min(3, .5+Math.sqrt(acc[i])*.4); g.beginPath(); g.moveTo(P[i][0],P[i][1]); g.lineTo(P[j][0],P[j][1]); g.stroke(); }
};

// G03-52 Fantasy Map Generator（C++ 實作）：規則格線＋流向箭頭場（flow map），主河道加粗
ART.case["G03-52"] = function(g, W, H, r, c){
  const n = 40, m = Math.max(22, Math.round(n*H/W));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0);
  const z = flood(n, m, noiseHF(nz, nz2, n, m, 2.3, r()*TAU)), {down} = d8dir(z, n, m), acc = accum(down, z, n, m), sx = W/n, sy = H/m;
  g.fillStyle = "rgba(210,190,150,.05)"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(235,222,195,.18)"; g.lineWidth = .6;
  for(let i = 0; i <= n; i += 4){ g.beginPath(); g.moveTo(i*sx, 0); g.lineTo(i*sx, H); g.stroke(); }
  for(let j = 0; j <= m; j += 4){ g.beginPath(); g.moveTo(0, j*sy); g.lineTo(W, j*sy); g.stroke(); }
  g.strokeStyle = rgba(c, .55); g.fillStyle = rgba(c, .55); g.lineWidth = 1;
  for(let j = 1; j < m-1; j += 2) for(let i = 1; i < n-1; i += 2){ const k = j*n+i; if(down[k] < 0) continue;
    const x1 = (i+.5)*sx, y1 = (j+.5)*sy, dx = (down[k]%n)-i, dy = ((down[k]/n)|0)-j, l = Math.hypot(dx,dy)||1;
    const x2 = x1+dx/l*sx*.9, y2 = y1+dy/l*sy*.9;
    g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
    const a = Math.atan2(y2-y1,x2-x1); g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-Math.cos(a-.4)*3,y2-Math.sin(a-.4)*3); g.lineTo(x2-Math.cos(a+.4)*3,y2-Math.sin(a+.4)*3); g.closePath(); g.fill(); }
  let mx = 0; for(let k = 0; k < n*m; k++) mx = Math.max(mx, acc[k]); g.strokeStyle = "#EEE7D2"; g.lineCap = "round";
  for(let k = 0; k < n*m; k++){ if(acc[k] < mx*.3 || down[k] < 0) continue;
    const x1 = ((k%n)+.5)*sx, y1 = (((k/n)|0)+.5)*sy, x2 = ((down[k]%n)+.5)*sx, y2 = (((down[k]/n)|0)+.5)*sy;
    g.lineWidth = Math.min(3.2, .6+Math.sqrt(acc[k])*.3); g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); }
};

// G03-53 Houdini HeightField Flow Field：左右分割，灰階 flow 層＋色相 flow dir 層，右下角節點小圖示
ART.case["G03-53"] = function(g, W, H, r, c){
  const n = 44, m = Math.max(24, Math.round(n*H/(W/2)));
  const nz = U.vnoise((r()*1e9)|0), nz2 = U.vnoise((r()*1e9)|0);
  const z = flood(n, m, noiseHF(nz, nz2, n, m, 2.2, r()*TAU)), {down, slope} = d8dir(z, n, m), acc = accum(down, z, n, m);
  let mx = 0; for(let k = 0; k < n*m; k++) mx = Math.max(mx, acc[k]);
  const pw = W/2-3;
  g.save(); g.beginPath(); g.rect(0, 0, pw, H); g.clip();
  rasterPaint(g, pw, H, n, m, (i,j) => { const k = j*n+i, t = Math.pow(Math.min(1, acc[k]/mx), .4)*255; return [t,t,t]; });
  g.restore();
  g.save(); g.translate(W/2+3, 0); g.beginPath(); g.rect(0, 0, pw, H); g.clip();
  const off = document.createElement("canvas"); off.width = n; off.height = m; const og = off.getContext("2d"), img = og.createImageData(n, m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const k = j*n+i, dk = down[k]; let h = 0, s2 = 0, v = 25;
    if(dk >= 0){ const dx = (dk%n)-i, dy = ((dk/n)|0)-j; h = (Math.atan2(dy,dx)+Math.PI)/TAU; s2 = .75; v = 40+Math.min(60, slope[k]*180); }
    const [R,G,B] = hsv2rgb(h, s2, v/100), idx = k*4; img.data[idx] = R; img.data[idx+1] = G; img.data[idx+2] = B; img.data[idx+3] = 255; }
  og.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, pw, H);
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(W/2, 0); g.lineTo(W/2, H); g.stroke();
  const nx = W-16, ny = H-14;
  g.fillStyle = "#2A2A32"; g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1;
  g.beginPath(); if(g.roundRect) g.roundRect(nx-12, ny-7, 24, 14, 3); else g.rect(nx-12, ny-7, 24, 14); g.fill(); g.stroke();
  g.fillStyle = rgba(c, .9); g.beginPath(); g.arc(nx, ny, 3, 0, TAU); g.fill();
};
ART.case["G03-53"].ratio = .8;
})();
