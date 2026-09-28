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
