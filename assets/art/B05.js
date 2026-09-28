/* B05 Substrate：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
const P = Math.PI, TAU = Math.PI*2, GOLD = "#E0AE4E";

/* ---------- 共用：Substrate 生長引擎（格點座標） ----------
   o = {n, m, r, maxC, step, inside(x,y), angle(la,R,gen,x,y), accept(x,y), curv(R,gen), nb}
   回傳物件：add() 放種子、line() 寫入既有線、branch() 從既有裂紋分岔、run(iters, bp) 生長 */
function grow(o){
  const n = o.n, m = o.m, R = o.r, occ = new Int32Array(n*m).fill(-1), cr = [], alive = [], pool = [], st = o.step || .7;
  let T = 0, cnt = 0; // cnt：有效裂紋數（一出生就撞停的短裂紋不計入上限）
  const G = {n, m, occ, cr, o, get T(){ return T; }};
  G.add = (x, y, a, gen, par) => {
    if(cnt >= o.maxC || cr.length >= o.maxC*4) return null; cnt++;
    const c = {x, y, a, gen, par, id:cr.length, pts:[[x,y,T]], age:0, k:o.curv ? o.curv(R, gen) : 0, end:-1, hit:false};
    cr.push(c); alive.push(c); return c;
  };
  // 既有線（例如路網）：直接寫入佔用格，視為已停止的第 0 代裂紋
  G.line = pts => {
    const c = {gen:0, par:-1, id:cr.length, pts:[], fixed:true, end:0}; cr.push(c);
    for(let i = 0; i < pts.length-1; i++){
      const [x1,y1] = pts[i], [x2,y2] = pts[i+1], s = Math.max(1, Math.ceil(Math.hypot(x2-x1, y2-y1)/.5));
      for(let j = 0; j < s; j++){ const x = x1 + (x2-x1)*j/s, y = y1 + (y2-y1)*j/s, ix = Math.floor(x), iy = Math.floor(y);
        if(ix >= 0 && iy >= 0 && ix < n && iy < m) occ[iy*n+ix] = c.id; c.pts.push([x,y,0]); if(j % 2) pool.push(c, c.pts.length-1); }
    }
    c.pts.push([pts[pts.length-1][0], pts[pts.length-1][1], 0]);
    return c;
  };
  // 從既有裂紋上隨機一點垂直（或依規則）分岔
  G.branch = () => {
    for(let t = 0; t < 40; t++){
      // 從所有裂紋點中均勻抽一點（依長度加權，不會集中在短裂紋上）
      if(pool.length < 2) return null;
      const h = ((R()*pool.length/2)|0)*2, p0 = pool[h], k = pool[h+1]; if(k < 1) continue;
      const p = p0.pts[k], q = p0.pts[k-1];
      if(o.accept && R() > o.accept(p[0], p[1])) continue;
      const la = Math.atan2(p[1]-q[1], p[0]-q[0]);
      const a = o.angle ? o.angle(la, R, p0.gen+1, p[0], p[1]) : la + (R() < .5 ? 1 : -1)*P/2;
      return G.add(p[0], p[1], a, p0.gen+1, p0.id);
    }
    return null;
  };
  G.run = (iters, bp) => {
    for(let it = 0; it < iters && alive.length; it++){
      T++;
      for(let i = alive.length-1; i >= 0; i--){
        const c = alive[i]; c.a += c.k;
        const nx = c.x + Math.cos(c.a)*st, ny = c.y + Math.sin(c.a)*st, ix = Math.floor(nx), iy = Math.floor(ny);
        let stop = ix < 0 || iy < 0 || ix >= n || iy >= m || (o.inside && !o.inside(nx, ny));
        if(!stop){ const w = occ[iy*n+ix]; if(w >= 0 && w !== c.id && !(w === c.par && c.age < 5)){ stop = true; c.hit = true; } }
        if(stop){
          c.pts.push([Math.max(0, Math.min(n, nx)), Math.max(0, Math.min(m, ny)), T]); c.end = T; alive.splice(i, 1);
          if(c.age < 3) cnt--;
          for(let b = 0; b < (o.nb || 1); b++) G.branch();
          continue;
        }
        occ[iy*n+ix] = c.id; c.x = nx; c.y = ny; c.age++;
        if(c.age % 2 === 0){ c.pts.push([nx, ny, T]); if(c.age > 3) pool.push(c, c.pts.length-1); }
        if(bp && R() < bp) G.branch();
      }
    }
    alive.forEach(c => { c.pts.push([c.x, c.y, T]); c.end = T; });
    alive.length = 0;
    return G;
  };
  return G;
}
// 把一條裂紋畫成折線；map 把格點座標轉成畫面座標（回傳 null 代表不可見）；tmax 只畫到某個時間
function stroke(g, c, map, tmax){
  g.beginPath(); let first = true;
  for(const p of c.pts){ if(tmax !== undefined && p[2] > tmax) break; const q = map(p[0], p[1]); if(!q){ first = true; continue; } if(first){ g.moveTo(q[0], q[1]); first = false; } else g.lineTo(q[0], q[1]); }
  g.stroke();
}
// 找封閉區域（4 連通洪水填充；裂紋格為牆）
function regions(G, mask){
  const {n, m, occ} = G, lab = new Int32Array(n*m).fill(-1), info = [], stack = new Int32Array(n*m);
  for(let s = 0; s < n*m; s++){
    if(occ[s] >= 0 || lab[s] >= 0 || (mask && !mask[s])) continue;
    const id = info.length, f = {size:0, sx:0, sy:0, x0:n, y0:m, x1:0, y1:0}; let sp = 0; stack[sp++] = s; lab[s] = id;
    while(sp){
      const q = stack[--sp], x = q % n, y = (q/n)|0; f.size++; f.sx += x; f.sy += y;
      if(x < f.x0) f.x0 = x; if(x > f.x1) f.x1 = x; if(y < f.y0) f.y0 = y; if(y > f.y1) f.y1 = y;
      const nb = [x > 0 ? q-1 : -1, x < n-1 ? q+1 : -1, y > 0 ? q-n : -1, y < m-1 ? q+n : -1];
      for(const t of nb) if(t >= 0 && lab[t] < 0 && occ[t] < 0 && (!mask || mask[t])){ lab[t] = id; stack[sp++] = t; }
    }
    f.cx = f.sx/f.size; f.cy = f.sy/f.size; info.push(f);
  }
  return {lab, info};
}
// 凸多邊形半平面裁切：保留 a*x + b*y <= d
function clip(poly, a, b, d){
  const out = [];
  for(let i = 0; i < poly.length; i++){
    const p = poly[i], q = poly[(i+1)%poly.length], fp = a*p[0] + b*p[1] - d, fq = a*q[0] + b*q[1] - d;
    if(fp <= 0) out.push(p);
    if(fp*fq < 0){ const t = fp/(fp-fq); out.push([p[0] + (q[0]-p[0])*t, p[1] + (q[1]-p[1])*t]); }
  }
  return out;
}
// Voronoi：每個站點把外框依其他站點的中垂線逐一裁切
function voronoi(sites, box){
  return sites.map((s, i) => { let poly = box.map(p => p.slice());
    sites.forEach((t, j) => { if(i === j) return; poly = clip(poly, t[0]-s[0], t[1]-s[1], (t[0]*t[0] + t[1]*t[1] - s[0]*s[0] - s[1]*s[1])/2); });
    return poly; });
}
const area = p => { let a = 0; for(let i = 0; i < p.length; i++){ const q = p[(i+1)%p.length]; a += p[i][0]*q[1] - q[0]*p[i][1]; } return Math.abs(a)/2; };
const mix = (a, b, t) => [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t, a[2] + (b[2]-a[2])*t];
const css = (v, a = 1) => `rgba(${v[0]|0},${v[1]|0},${v[2]|0},${a})`;
const perp = (la, R) => la + (R() < .5 ? 1 : -1)*P/2;
const wob = w => (la, R) => la + (R() < .5 ? 1 : -1)*(P/2 + (R()-.5)*w);
function seeds(G, k, r, ang){ for(let i = 0; i < k; i++){ let x, y, t = 0; do { x = r()*G.n; y = r()*G.m; t++; } while(G.o.inside && !G.o.inside(x, y) && t < 50); G.add(x, y, ang ? ang() : r()*TAU, 0, -1); } }
// 格點值畫成小影像再放大
function raster(g, n, m, fn, X, Y, Wd, Hd, smooth){
  const img = new ImageData(n, m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const v = fn(i, j), k = (j*n+i)*4; if(!v) continue; img.data[k] = v[0]; img.data[k+1] = v[1]; img.data[k+2] = v[2]; img.data[k+3] = v[3] ?? 255; }
  const off = document.createElement("canvas"); off.width = n; off.height = m; off.getContext("2d").putImageData(img, 0, 0);
  g.imageSmoothingEnabled = !!smooth; g.drawImage(off, X, Y, Wd, Hd); g.imageSmoothingEnabled = true;
}
// 沙畫筆觸：沿裂紋一側撒顆粒，透明度往外遞減（Tarbell sand painter）
function sand(g, G, map, S, pal, R, grains, maxw, alpha = .3){
  G.cr.forEach(c => {
    const col = pal[(R()*pal.length)|0]; let gw = R()*maxw*.5;
    for(let i = 1; i < c.pts.length; i++){
      const p = c.pts[i], q = c.pts[i-1], a = Math.atan2(p[1]-q[1], p[0]-q[0]) + P/2;
      gw = Math.max(0, Math.min(maxw, gw + (R()-.5)*maxw*.18));
      const [x0, y0] = map(q[0], q[1]), [x1, y1] = map(p[0], p[1]);
      for(let j = 0; j < grains; j++){ const t = R(), d = gw*S*t, f = R(), x = x0 + (x1-x0)*f, y = y0 + (y1-y0)*f;
        g.fillStyle = css(col, alpha*(1-t)); g.fillRect(x + Math.cos(a)*d, y + Math.sin(a)*d, 1.2, 1.2); }
    }
  });
}

/* ================= 變形 ================= */
ART.var["B05"] = [
  // V01 角度規則：正交 → 三角格 → ±30° 有機，三欄並列成光譜
  function(g, W, H, r, c, U){
    const pw = W/3;
    const rules = [perp, (la, R) => la + (R() < .5 ? 1 : -1)*(R() < .5 ? P/3 : 2*P/3), wob(1.05)];
    const a0 = [() => ((r()*4)|0)*P/2, () => ((r()*6)|0)*P/3, () => r()*TAU];
    for(let k = 0; k < 3; k++){
      const n = 44, S = pw/n, m = Math.floor((H-26)/S);
      const G = grow({n, m, r, maxC:55, angle:rules[k]}); seeds(G, 3, r, a0[k]); G.run(1400, .014);
      g.save(); g.beginPath(); g.rect(k*pw, 0, pw, H-26); g.clip();
      G.cr.forEach(q => { g.strokeStyle = q.gen === 0 ? "rgba(255,255,255,.9)" : U.rgba(c, .5 + .5*Math.max(0, 1 - q.gen*.12)); g.lineWidth = q.gen === 0 ? 1.5 : .9; stroke(g, q, (x, y) => [k*pw + x*S, y*S]); });
      g.restore();
      // 底部角度圖示
      const cx = k*pw + pw/2, cy = H-9, L = 12, ang = [P/2, P/3, P/2 + .5][k];
      g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx - L, cy); g.lineTo(cx + L, cy); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(-ang)*L, cy + Math.sin(-ang)*L); g.stroke();
      g.strokeStyle = U.rgba(c, .9); g.beginPath(); g.arc(cx, cy, 5, -ang, 0); g.stroke();
      if(k === 2){ g.setLineDash([2,2]); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(-P/2 + .5)*L, cy + Math.sin(-P/2 + .5)*L); g.stroke(); g.setLineDash([]); }
    }
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1;
    for(let k = 1; k < 3; k++){ g.beginPath(); g.moveTo(k*pw, 0); g.lineTo(k*pw, H); g.stroke(); }
    g.beginPath(); g.moveTo(0, H-26); g.lineTo(W, H-26); g.stroke();
  },
  // V02 彎曲裂紋：每步轉一點點，形成弧線釉裂
  function(g, W, H, r, c, U){
    const n = 110, S = W/n, m = Math.ceil(H/S);
    const G = grow({n, m, r, maxC:90, curv:(R, gen) => (R()-.5)*(gen === 0 ? .03 : .07), angle:wob(.4)}); seeds(G, 4, r); G.run(2200, .01);
    g.lineCap = "round";
    G.cr.forEach(q => { const t = Math.min(1, q.gen/5); g.strokeStyle = t < .01 ? "rgba(255,255,255,.95)" : U.rgba(c, .95 - t*.4); g.lineWidth = 2.4 - t*1.7; stroke(g, q, (x, y) => [x*S, y*S]); });
    // 曲率示意：幾條細弧
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1;
    for(let i = 0; i < 3; i++){ g.beginPath(); g.arc(W*(.2 + .3*i), H*1.1, H*(.35 + .1*i), P*1.1, P*1.9); g.stroke(); }
  },
  // V03 曲線邊界：只在任意基地輪廓內生長
  function(g, W, H, r, c, U){
    const n = 100, S = W/n, m = Math.ceil(H/S), nz = U.vnoise((r()*1e6)|0), ph = r()*10;
    const cx = n*.5, cy = m*.5, bnd = [];
    for(let i = 0; i < 72; i++){ const a = i/72*TAU, rr = Math.min(n, m)*.42*(.72 + .55*nz(Math.cos(a)*1.4 + ph, Math.sin(a)*1.4 + ph)); bnd.push([cx + Math.cos(a)*rr*(n > m ? 1.15 : 1), cy + Math.sin(a)*rr*(m > n ? 1.15 : 1)]); }
    const pip = (x, y) => { let ins = false; for(let i = 0, j = bnd.length-1; i < bnd.length; j = i++){ const [xi,yi] = bnd[i], [xj,yj] = bnd[j]; if((yi > y) !== (yj > y) && x < (xj-xi)*(y-yi)/(yj-yi) + xi) ins = !ins; } return ins; };
    const mask = new Uint8Array(n*m); for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) mask[j*n+i] = pip(i+.5, j+.5) ? 1 : 0;
    const G = grow({n, m, r, maxC:110, inside:(x, y) => mask[Math.floor(y)*n + Math.floor(x)] === 1, angle:wob(.15)}); seeds(G, 3, r); G.run(2000, .012);
    // 基地外：淡點格
    g.fillStyle = "rgba(255,255,255,.14)";
    for(let y = 6; y < H; y += 10) for(let x = 6; x < W; x += 10) g.fillRect(x, y, 1, 1);
    g.fillStyle = U.rgba(c, .07); U.poly(g, bnd.map(p => [p[0]*S, p[1]*S]), true); g.fill();
    G.cr.forEach(q => { g.strokeStyle = q.gen < 2 ? U.rgba(c, 1) : U.rgba(c, .6); g.lineWidth = q.gen < 2 ? 1.4 : .8; stroke(g, q, (x, y) => [x*S, y*S]); });
    g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 2.2; U.poly(g, bnd.map(p => [p[0]*S, p[1]*S]), true); g.stroke();
    g.setLineDash([3,4]); g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1;
    U.poly(g, bnd.map(p => [cx*S + (p[0]-cx)*S*1.08, cy*S + (p[1]-cy)*S*1.08]), true); g.stroke(); g.setLineDash([]);
  },
  // V04 既有路網當初始裂紋：粗白主路，次級巷道只從主路分岔
  function(g, W, H, r, c, U){
    const n = 110, S = W/n, m = Math.ceil(H/S), ph = r()*TAU;
    const G = grow({n, m, r, maxC:170, angle:wob(.08)});
    const road1 = [], road3 = [];
    for(let x = -2; x <= n+2; x += 3) road1.push([x, m*.58 + m*.16*Math.sin(x/n*P*1.4 + ph)]);
    G.line(road1);
    G.line([[n*(.15 + r()*.15), -1], [n*(.62 + r()*.2), m+1]]);
    const ox = n*(.65 + r()*.15), oy = m*(.22 + r()*.08), rr = Math.min(n, m)*.16;
    for(let a = 0; a <= TAU + .01; a += .2) road3.push([ox + Math.cos(a)*rr, oy + Math.sin(a)*rr]);
    G.line(road3);
    for(let i = 0; i < 8; i++) G.branch();
    G.run(2200, .01);
    G.cr.forEach(q => { if(q.fixed) return; g.strokeStyle = U.rgba(c, Math.max(.35, .95 - q.gen*.12)); g.lineWidth = q.gen <= 1 ? 1.2 : .7; stroke(g, q, (x, y) => [x*S, y*S]); });
    G.cr.filter(q => q.fixed).forEach(q => {
      g.strokeStyle = U.rgba(c, .35); g.lineWidth = 7; stroke(g, q, (x, y) => [x*S, y*S]);
      g.strokeStyle = "rgba(255,255,255,.95)"; g.lineWidth = 3; stroke(g, q, (x, y) => [x*S, y*S]);
      g.strokeStyle = "rgba(20,20,26,.9)"; g.lineWidth = .8; g.setLineDash([4,4]); stroke(g, q, (x, y) => [x*S, y*S]); g.setLineDash([]);
    });
  },
  // V05 吸引子控制密度：靠近吸引點切得更碎
  function(g, W, H, r, c, U){
    const n = 120, S = W/n, m = Math.ceil(H/S);
    const at = [[n*(.25 + r()*.2), m*(.25 + r()*.2)], [n*(.6 + r()*.2), m*(.6 + r()*.2)]], sg = Math.min(n, m)*.2;
    const acc = (x, y) => .03 + .97*Math.max(...at.map(a => Math.exp(-((x-a[0])**2 + (y-a[1])**2)/(sg*sg))));
    at.forEach(a => { const gr = g.createRadialGradient(a[0]*S, a[1]*S, 0, a[0]*S, a[1]*S, sg*S*1.8); gr.addColorStop(0, U.rgba(c, .35)); gr.addColorStop(1, U.rgba(c, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
    const G = grow({n, m, r, maxC:420, accept:acc, nb:2}); seeds(G, 3, r, () => ((r()*4)|0)*P/2 + (r()-.5)*.3); G.run(2600, 0);
    G.cr.forEach(q => { g.strokeStyle = q.gen === 0 ? "rgba(255,255,255,.9)" : U.rgba(c, .85); g.lineWidth = q.gen === 0 ? 1.4 : .75; stroke(g, q, (x, y) => [x*S, y*S]); });
    at.forEach(a => { g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 1.3;
      [4, 9].forEach(rr => { g.beginPath(); g.arc(a[0]*S, a[1]*S, rr, 0, TAU); g.stroke(); });
      g.setLineDash([2,3]); g.strokeStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.arc(a[0]*S, a[1]*S, sg*S, 0, TAU); g.stroke(); g.setLineDash([]); });
  },
  // V06 影像控制分岔：灰階圖驅動建築立面分割（立面圖＋輸入縮圖），暗處分得更碎、面板填灰階
  function(g, W, H, r, c, U){
    const fx = W*.1, fw = W*.8, fy = H*.2, fh = H*.7, n = 90, S = fw/n, m = Math.max(10, Math.floor(fh/S)), nz = U.vnoise((r()*1e6)|0);
    const sx = n*(.35 + r()*.3), sy = m*(.35 + r()*.2), sr = Math.min(n, m)*.32;
    const dark = (x, y) => { const d = Math.hypot(x-sx, (y-sy)*1.1)/sr, disk = d < 1 ? 1 - d*d*.5 : Math.max(0, .5 - (d-1)*1.2); return Math.max(0, Math.min(1, disk*.9 + (nz(x*.07, y*.07)-.5)*.45 + .05)); };
    // 天空與地面
    const sky = g.createLinearGradient(0, 0, 0, fy + fh); sky.addColorStop(0, "#15151c"); sky.addColorStop(1, U.rgba(c, .12)); g.fillStyle = sky; g.fillRect(0, 0, W, fy + fh);
    g.fillStyle = "#0e0e12"; g.fillRect(0, fy + fh, W, H - fy - fh);
    // 立面內生長：只允許水平／垂直（窗框），分岔機率跟影像暗度走
    const G = grow({n, m, r, maxC:300, accept:(x, y) => .04 + .96*Math.pow(dark(x, y), 1.5), nb:2});
    G.line([[0, m*.2], [n, m*.2]]); G.line([[n*.5, 0], [n*.5, m]]);
    for(let k = 0; k < 8; k++) G.branch();
    G.run(2600, .002);
    // 面板依區域中心的暗度填色（像素化影像）
    const {lab, info} = regions(G);
    const tone = info.map(f => { const v = dark(f.cx, f.cy); return mix([225, 228, 232], [40, 44, 52], v); });
    raster(g, n, m, (i, j) => { const l = lab[j*n+i]; if(l < 0) return [18, 18, 22, 255]; const t = tone[l]; return [t[0], t[1], t[2], 255]; }, fx, fy, fw, m*S);
    g.strokeStyle = "rgba(20,20,26,1)"; g.lineWidth = 1.1; G.cr.forEach(q => stroke(g, q, (x, y) => [fx + x*S, fy + y*S]));
    // 主色玻璃反光：最暗的幾片面板
    info.forEach((f, k) => { if(f.size > 6 && dark(f.cx, f.cy) > .75 && r() < .5){ g.fillStyle = U.rgba(c, .55); g.fillRect(fx + (f.x0 + .6)*S, fy + (f.y0 + .6)*S, Math.max(1, (f.x1 - f.x0 - .2)*S), Math.max(1, (f.y1 - f.y0 - .2)*S)); } });
    // 立面外框、屋頂線、地面線與人形比例尺
    g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 1.6; g.strokeRect(fx, fy, fw, m*S);
    g.fillStyle = "rgba(255,255,255,.85)"; g.fillRect(fx - 4, fy - 4, fw + 8, 3);
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, fy + m*S + .5); g.lineTo(W, fy + m*S + .5); g.stroke();
    [[.2, 1], [.72, .9]].forEach(([u, k]) => { const px = W*u, py = fy + m*S, h = 14*k; g.fillStyle = "rgba(255,255,255,.75)";
      g.beginPath(); g.arc(px, py - h - 2, 2, 0, TAU); g.fill(); g.fillRect(px - 1.5, py - h, 3, h); });
    // 左上：輸入灰階圖縮圖＋箭頭
    const tw = W*.2, th = fy - 16, tx = 8, ty = 6;
    raster(g, 30, 20, (i, j) => { const v = 240 - dark(i*n/30, j*m/20)*215; return [v, v, v, 255]; }, tx, ty, tw, th, true);
    g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1; g.strokeRect(tx, ty, tw, th);
    g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1.3; g.beginPath(); g.moveTo(tx + tw + 4, ty + th/2); g.quadraticCurveTo(fx + fw*.35, ty + th/2, fx + fw*.35, fy - 8); g.lineTo(fx + fw*.35 - 3, fy - 12); g.moveTo(fx + fw*.35, fy - 8); g.lineTo(fx + fw*.35 + 3, fy - 12); g.stroke();
  },
  // V07 輸出街廓多邊形：封閉面分色鋪面＋退縮
  function(g, W, H, r, c, U){
    const n = 84, S = W/n, m = Math.ceil(H/S);
    const G = grow({n, m, r, maxC:70, angle:wob(.1)}); seeds(G, 3, r, () => ((r()*4)|0)*P/2 + (r()-.5)*.6); G.run(2000, .012);
    const {lab, info} = regions(G), base = [26, 26, 33], cc = U.rgb(c), tone = info.map(f => { const k = r(); return k < .15 && f.size < 60 ? [235, 235, 230] : mix(base, cc, .3 + r()*.65); });
    // 退縮：鄰接裂紋的格子不上色
    raster(g, n, m, (i, j) => { const q = j*n+i, l = lab[q]; if(l < 0) return null;
      for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){ const x = i+dx, y = j+dy; if(x < 0 || y < 0 || x >= n || y >= m || lab[y*n+x] !== l) return null; }
      return [...tone[l], 255]; }, 0, 0, n*S, m*S, false);
    g.strokeStyle = "rgba(255,255,255,.28)"; g.lineWidth = .7; g.setLineDash([2,2]);
    G.cr.forEach(q => stroke(g, q, (x, y) => [x*S, y*S])); g.setLineDash([]);
    // 面心標記
    g.fillStyle = "rgba(15,15,20,.75)";
    info.forEach(f => { if(f.size > 40){ g.beginPath(); g.arc((f.cx+.5)*S, (f.cy+.5)*S, 1.6, 0, TAU); g.fill(); } });
  },
  // V08 曲面上的裂紋：UV 空間生長，映射到起伏殼體
  function(g, W, H, r, c, U){
    const n = 100, m = 70, ph = r()*3;
    const G = grow({n, m, r, maxC:110, angle:wob(.2)}); seeds(G, 3, r); G.run(2000, .012);
    const yaw = .6 + r()*.3, pit = .55, sc = W*.36, cx = W/2, cy = H*.55;
    const P3 = (u, v) => { const X = (u-.5)*2.2, Y = (v-.5)*1.6, Z = .42*Math.sin(u*P*1.7 + ph)*Math.cos((v-.4)*P*1.3);
      const x = X*Math.cos(yaw) - Y*Math.sin(yaw), d = X*Math.sin(yaw) + Y*Math.cos(yaw);
      return [cx + x*sc, cy + (d*Math.sin(pit) - Z*Math.cos(pit))*sc, d]; };
    g.strokeStyle = "rgba(255,255,255,.13)"; g.lineWidth = .8;
    for(let i = 0; i <= 12; i++){ g.beginPath(); for(let j = 0; j <= 30; j++){ const p = P3(i/12, j/30); j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); }
    for(let j = 0; j <= 10; j++){ g.beginPath(); for(let i = 0; i <= 40; i++){ const p = P3(i/40, j/10); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); }
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.3; g.beginPath();
    [[0,0],[1,0],[1,1],[0,1],[0,0]].forEach(([a, b], k, arr) => { if(!k) return; const [a0, b0] = arr[k-1]; for(let t = 0; t <= 20; t++){ const p = P3(a0 + (a-a0)*t/20, b0 + (b-b0)*t/20); (k === 1 && t === 0) ? g.moveTo(p[0], p[1]) : g.lineTo(p[0], p[1]); } }); g.stroke();
    G.cr.forEach(q => { g.strokeStyle = q.gen === 0 ? "rgba(255,255,255,.9)" : U.rgba(c, .9); g.lineWidth = q.gen < 2 ? 1.3 : .8; stroke(g, q, (x, y) => P3(x/n, y/m)); });
  },
  // V09 裂紋寬度與沙畫渲染：放大局部，世代決定線寬，一側撒沙
  function(g, W, H, r, c, U){
    const n = 34, S = W/n, m = Math.ceil(H/S);
    const G = grow({n, m, r, maxC:26, angle:wob(.06), step:.35}); seeds(G, 2, r); G.run(1600, .02);
    const map = (x, y) => [x*S, y*S];
    sand(g, G, map, S, [U.rgb(c), [255, 255, 255], mix(U.rgb(c), [242, 160, 7], .6)], r, 40, 5, .35);
    g.lineCap = "round";
    G.cr.forEach(q => { const w = Math.max(.8, 4 - q.gen*1.2);
      g.strokeStyle = "rgba(255,255,255,.92)"; g.lineWidth = w; stroke(g, q, map);
      if(q.gen === 0){ g.strokeStyle = "rgba(20,20,26,1)"; g.lineWidth = w*.4; stroke(g, q, map); } });
  },
  // V10 逐輪動畫：同一次生長的 4 個時間切片（影格）
  function(g, W, H, r, c, U){
    const pad = 6, fw = (W - pad*3)/2, fh = (H - 22 - pad*3)/2, n = 60, S = fw/n, m = Math.floor(fh/S);
    const G = grow({n, m, r, maxC:90}); seeds(G, 3, r); G.run(1500, .012);
    const Tm = G.T, ts = [.12, .3, .55, 1];
    ts.forEach((f, k) => {
      const X = pad + (k % 2)*(fw + pad), Y = pad + ((k/2)|0)*(fh + pad), tm = Tm*f;
      g.fillStyle = "#0E0E12"; g.fillRect(X, Y, fw, fh);
      g.save(); g.beginPath(); g.rect(X, Y, fw, fh); g.clip();
      G.cr.forEach(q => { if(q.pts[0][2] > tm) return; g.strokeStyle = U.rgba(c, .9); g.lineWidth = .9; stroke(g, q, (x, y) => [X + x*S, Y + y*S], tm);
        if(q.end > tm){ let p = q.pts[0]; for(const t of q.pts){ if(t[2] > tm) break; p = t; } g.fillStyle = "#fff"; g.beginPath(); g.arc(X + p[0]*S, Y + p[1]*S, 1.8, 0, TAU); g.fill(); } });
      g.restore();
      g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(X + .5, Y + .5, fw - 1, fh - 1);
      g.fillStyle = "rgba(255,255,255,.6)"; for(let i = 0; i <= k; i++) g.fillRect(X + 4 + i*5, Y + 4, 3, 3);
    });
    // 時間軸
    const ty = H - 12; g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 2; g.beginPath(); g.moveTo(pad, ty); g.lineTo(W - pad, ty); g.stroke();
    g.strokeStyle = U.rgba(c, 1); g.beginPath(); g.moveTo(pad, ty); g.lineTo(pad + (W - pad*2)*.62, ty); g.stroke();
    ts.forEach(f => { g.fillStyle = "#fff"; g.fillRect(pad + (W - pad*2)*f - 1, ty - 4, 2, 8); });
  },
  // V11 Voronoi（同時分割、Y 接頭）對照 Substrate（依序生長、T 接頭）
  function(g, W, H, r, c, U){
    const pw = W/2, ph = H*.74;
    // 左：Voronoi
    const sites = []; for(let i = 0; i < 14; i++) sites.push([r()*pw, r()*ph]);
    const cells = voronoi(sites, [[0,0],[pw,0],[pw,ph],[0,ph]]);
    g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 1.1; cells.forEach(p => { U.poly(g, p, true); g.stroke(); });
    g.strokeStyle = U.rgba(c, 1); g.lineWidth = 1.2;
    cells.forEach(p => p.forEach(v => { if(v[0] > 1 && v[0] < pw-1 && v[1] > 1 && v[1] < ph-1){ g.beginPath(); g.arc(v[0], v[1], 2.6, 0, TAU); g.stroke(); } }));
    // 右：Substrate
    const n = 60, S = pw/n, m = Math.floor(ph/S);
    const G = grow({n, m, r, maxC:40}); seeds(G, 2, r, () => ((r()*4)|0)*P/2 + .2); G.run(1500, .01);
    G.cr.forEach(q => { g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 1.1; stroke(g, q, (x, y) => [pw + x*S, y*S]); });
    g.fillStyle = U.rgba(c, 1);
    G.cr.forEach(q => { if(q.hit){ const p = q.pts[q.pts.length-1]; g.fillRect(pw + p[0]*S - 2.2, p[1]*S - 2.2, 4.4, 4.4); } });
    // 下方：碎片面積分佈
    const A1 = cells.map(area).sort((a, b) => b - a), A2 = regions(G).info.map(f => f.size*S*S).sort((a, b) => b - a).slice(0, 22);
    const bar = (A, X, col) => { const mx = A[0] || 1, bw = (pw - 16)/Math.max(A.length, 1);
      A.forEach((a, i) => { const h = (H - ph - 14)*a/mx; g.fillStyle = col; g.fillRect(X + 8 + i*bw, H - 6 - h, Math.max(1, bw - 1.5), h); }); };
    bar(A1, 0, "rgba(255,255,255,.55)"); bar(A2, pw, U.rgba(c, .75));
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(pw, 0); g.lineTo(pw, H); g.moveTo(0, ph); g.lineTo(W, ph); g.stroke();
  },
  // V12 輸出為雷射切割拼板：封閉碎片退縮、爆開、排在板材上
  function(g, W, H, r, c, U){
    const n = 56, bx = W*.07, by = H*.08, bw = W*.86, bh = H*.84, S = bw/n/1.14, m = Math.floor(bh/1.14/S);
    const G = grow({n, m, r, maxC:30}); seeds(G, 2, r, () => ((r()*4)|0)*P/2); G.run(1500, .012);
    const {lab, info} = regions(G);
    g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(bx, by, bw, bh);
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(bx, by, bw, bh);
    const ox = bx + (bw - n*S)/2, oy = by + (bh - m*S)/2, ex = 1.14 - 1;
    info.forEach((f, id) => {
      if(f.size < 6) return;
      const dx = (f.cx - n/2)*S*ex*1.4, dy = (f.cy - m/2)*S*ex*1.4;
      g.beginPath();
      for(let y = f.y0; y <= f.y1; y++) for(let x = f.x0; x <= f.x1; x++){
        if(lab[y*n+x] !== id) continue; const X = ox + x*S + dx, Y = oy + y*S + dy;
        if(x === 0 || lab[y*n+x-1] !== id){ g.moveTo(X, Y); g.lineTo(X, Y + S); }
        if(x === n-1 || lab[y*n+x+1] !== id){ g.moveTo(X + S, Y); g.lineTo(X + S, Y + S); }
        if(y === 0 || lab[(y-1)*n+x] !== id){ g.moveTo(X, Y); g.lineTo(X + S, Y); }
        if(y === m-1 || lab[(y+1)*n+x] !== id){ g.moveTo(X, Y + S); g.lineTo(X + S, Y + S); }
      }
      g.strokeStyle = U.rgba(c, 1); g.lineWidth = 1; g.stroke();
      // 編號刻印：小點數目
      const k = 1 + id % 4, X = ox + (f.cx + .5)*S + dx, Y = oy + (f.cy + .5)*S + dy;
      g.fillStyle = "rgba(255,255,255,.75)"; for(let i = 0; i < k; i++) g.fillRect(X - k*2 + i*4, Y - 1, 2, 2);
    });
    // 板材定位孔
    g.strokeStyle = "rgba(255,255,255,.5)"; [[bx + 5, by + 5], [bx + bw - 5, by + 5], [bx + 5, by + bh - 5], [bx + bw - 5, by + bh - 5]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 2, 0, TAU); g.stroke(); });
  },
];

/* ================= 無照片案例 ================= */
// B05-01 Tarbell 原作：淺色紙面上的細線裂紋與彩色沙畫
ART.case["B05-01"] = function(g, W, H, r, c, U){
  g.fillStyle = "#ECE7DC"; g.fillRect(0, 0, W, H);
  const n = 120, S = W/n, m = Math.ceil(H/S);
  const G = grow({n, m, r, maxC:150, angle:wob(.05)}); seeds(G, 4, r); G.run(2200, .012);
  const map = (x, y) => [x*S, y*S], cc = U.rgb(c);
  sand(g, G, map, S, [cc, mix(cc, [0,0,0], .4), [214, 132, 84], [92, 128, 170], [226, 178, 74]], r, 12, 5, .3);
  g.strokeStyle = "rgba(25,25,28,.85)"; g.lineWidth = .7; G.cr.forEach(q => stroke(g, q, map));
};
ART.case["B05-01"].ratio = 1.2;

// B05-02 CLI → A0 SVG → 繪圖機：透視板面，龍門架畫到一半
ART.case["B05-02"] = function(g, W, H, r, c, U){
  const q = [[W*.2, H*.1], [W*.8, H*.1], [W*.96, H*.88], [W*.04, H*.88]];
  const map = (u, v) => { const a = [q[0][0] + (q[1][0]-q[0][0])*u, q[0][1] + (q[1][1]-q[0][1])*u], b = [q[3][0] + (q[2][0]-q[3][0])*u, q[3][1] + (q[2][1]-q[3][1])*u]; return [a[0] + (b[0]-a[0])*v, a[1] + (b[1]-a[1])*v]; };
  g.fillStyle = "#2A2A33"; g.fillRect(0, H*.05, W, H*.9);
  g.fillStyle = "#E7E3D8"; U.poly(g, q, true); g.fill();
  const n = 90, m = 127, vg = .58;
  const G = grow({n, m, r, maxC:120, angle:wob(.3)}); seeds(G, 3, r); G.run(2200, .012);
  g.strokeStyle = "rgba(25,25,30,.9)"; g.lineWidth = .75;
  G.cr.forEach(k => { if(k.pts.length < 6) return; // 最短線長過濾
    g.beginPath(); let on = false; for(const p of k.pts){ const v = p[1]/m; if(v > vg){ on = false; continue; } const s = map(p[0]/n, v); on ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); on = true; } g.stroke(); });
  // 龍門架與筆頭
  const L0 = map(-.08, vg), L1 = map(1.08, vg), pu = .3 + r()*.4, ph = map(pu, vg);
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; [-.06, 1.06].forEach(u => { const a = map(u, -.02), b = map(u, 1.02); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
  g.strokeStyle = "#55555F"; g.lineWidth = 7; g.beginPath(); g.moveTo(L0[0], L0[1]); g.lineTo(L1[0], L1[1]); g.stroke();
  g.strokeStyle = U.rgba(c, 1); g.lineWidth = 2; g.beginPath(); g.moveTo(L0[0], L0[1]); g.lineTo(L1[0], L1[1]); g.stroke();
  g.fillStyle = "#1A1A20"; g.fillRect(ph[0] - 6, ph[1] - 10, 12, 14); g.strokeStyle = U.rgba(c, 1); g.lineWidth = 1; g.strokeRect(ph[0] - 6, ph[1] - 10, 12, 14);
  g.fillStyle = "#fff"; g.beginPath(); g.arc(ph[0], ph[1] + 5, 1.6, 0, TAU); g.fill();
  // 底邊公釐刻度
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = .8;
  for(let i = 0; i <= 40; i++){ const a = map(i/40, 1), l = i % 10 === 0 ? 6 : i % 5 === 0 ? 4 : 2; g.beginPath(); g.moveTo(a[0], a[1] + 3); g.lineTo(a[0], a[1] + 3 + l); g.stroke(); }
};
ART.case["B05-02"].ratio = 1.3;

// B05-03 建築課程研究：跑久了浮現都市格網，夜間鳥瞰透視
ART.case["B05-03"] = function(g, W, H, r, c, U){
  const hy = H*.26, sky = g.createLinearGradient(0, 0, 0, hy + 10); sky.addColorStop(0, "#121218"); sky.addColorStop(1, U.rgba(c, .3));
  g.fillStyle = sky; g.fillRect(0, 0, W, hy + 2);
  const n = 110, m = 110;
  const G = grow({n, m, r, maxC:230, angle:wob(.12), nb:2}); seeds(G, 3, r, () => ((r()*4)|0)*P/2 + .05); G.run(2400, .004);
  const prj = (x, y) => { const u = x/n, v = y/m, d = 1 + (1 - v)*6; return [W/2 + (u - .5)*W*2.2/d, hy + (H - hy)*1.02/d, d]; };
  g.globalCompositeOperation = "lighter";
  G.cr.forEach(q => { const p = q.pts[(q.pts.length/2)|0], d = prj(p[0], p[1])[2];
    g.strokeStyle = q.gen < 2 ? "rgba(255,240,215,.75)" : U.rgba(c, .6*Math.min(1, 2.5/d)); g.lineWidth = Math.max(.4, (q.gen < 2 ? 2.4 : 1.2)/d*1.5); stroke(g, q, prj); });
  // 地塊燈點
  for(let i = 0; i < 260; i++){ const p = prj(r()*n, r()*m); g.fillStyle = U.rgba(c, .15 + r()*.35*Math.min(1, 3/p[2])); g.fillRect(p[0], p[1], 1, 1); }
  g.globalCompositeOperation = "source-over";
  const fog = g.createLinearGradient(0, hy, 0, hy + H*.18); fog.addColorStop(0, "rgba(28,28,36,.95)"); fog.addColorStop(1, "rgba(28,28,36,0)"); g.fillStyle = fog; g.fillRect(0, hy, W, H*.18);
};
ART.case["B05-03"].ratio = .8;

// B05-04 CodePen 移植：瀏覽器視窗，左邊程式碼、右邊正在生長的預覽
ART.case["B05-04"] = function(g, W, H, r, c, U){
  const X = 6, Y = 6, bw = W - 12, bh = H - 12;
  g.fillStyle = "#24242C"; g.fillRect(X, Y, bw, bh);
  g.fillStyle = "#30303A"; g.fillRect(X, Y, bw, 16);
  ["#E5655B", "#E8B64B", "#5FBF6A"].forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(X + 9 + i*9, Y + 8, 3, 0, TAU); g.fill(); });
  g.fillStyle = "#1B1B21"; g.fillRect(X + 40, Y + 4, bw*.5, 9);
  const ew = bw*.36, py = Y + 18;
  g.fillStyle = "#1A1A20"; g.fillRect(X, py, ew, bh - 18);
  const cols = ["rgba(255,255,255,.45)", U.rgba(c, .8), "rgba(242,160,7,.7)", "rgba(120,170,230,.7)"];
  for(let y = py + 7; y < Y + bh - 8; y += 7){
    g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(X + 3, y, 5, 2);
    let x = X + 12 + (((r()*4)|0) % 3)*6; const k = 1 + ((r()*3)|0);
    for(let j = 0; j < k && x < X + ew - 6; j++){ const w = 6 + r()*22; g.fillStyle = cols[(r()*cols.length)|0]; g.fillRect(x, y, Math.min(w, X + ew - 4 - x), 2.4); x += w + 3; }
  }
  // 預覽：生長中的裂紋，生長尖端發亮
  const vx = X + ew + 2, vw = bw - ew - 2, vh = bh - 20, n = 70, S = vw/n, m = Math.floor(vh/S);
  g.fillStyle = "#F1EEE7"; g.fillRect(vx, py, vw, vh);
  const G = grow({n, m, r, maxC:120}); seeds(G, 3, r); G.run(1600, .012);
  const tm = G.T*.65;
  g.save(); g.beginPath(); g.rect(vx, py, vw, vh); g.clip();
  g.strokeStyle = "rgba(30,30,34,.85)"; g.lineWidth = .8;
  G.cr.forEach(q => { if(q.pts[0][2] <= tm) stroke(g, q, (x, y) => [vx + x*S, py + y*S], tm); });
  G.cr.forEach(q => { if(q.pts[0][2] > tm || q.end <= tm) return; let p = q.pts[0]; for(const t of q.pts){ if(t[2] > tm) break; p = t; }
    g.fillStyle = U.rgba(c, .35); g.beginPath(); g.arc(vx + p[0]*S, py + p[1]*S, 4, 0, TAU); g.fill();
    g.fillStyle = U.rgba(c, 1); g.beginPath(); g.arc(vx + p[0]*S, py + p[1]*S, 1.6, 0, TAU); g.fill(); });
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1; g.strokeRect(X + .5, Y + .5, bw - 1, bh - 1);
};
ART.case["B05-04"].ratio = .8;

// B05-05 Procedural Modeling of Cities：街道分割出街廓，擠出等角建築量體
ART.case["B05-05"] = function(g, W, H, r, c, U){
  const n = 36, m = 36;
  const G = grow({n, m, r, maxC:46}); seeds(G, 2, r, () => ((r()*4)|0)*P/2); G.run(800, .03);
  const {info} = regions(G);
  const u = Math.min(W/(n*1.85), H/(n*1.45)), ox = W/2, oy = H*.62 - n*u*.5;
  const iso = (x, y, z) => [ox + (x - y)*u*.87, oy + (x + y)*u*.5 - z*u];
  // 地面與街道
  g.fillStyle = "rgba(255,255,255,.04)"; U.poly(g, [iso(0,0,0), iso(n,0,0), iso(n,m,0), iso(0,m,0)], true); g.fill();
  g.strokeStyle = U.rgba(c, .7); g.lineWidth = 1; G.cr.forEach(q => stroke(g, q, (x, y) => iso(x, y, 0)));
  const cc = U.rgb(c);
  info.filter(f => f.size > 3).sort((a, b) => (a.x1 + a.y1) - (b.x1 + b.y1)).forEach(f => {
    const x0 = f.x0 + .35, y0 = f.y0 + .35, x1 = f.x1 + .65, y1 = f.y1 + .65;
    const dc = Math.hypot((x0 + x1)/2 - n/2, (y0 + y1)/2 - m/2)/(n*.7), h = (1 - dc)*(4 + r()*12)*(f.size < 30 ? 1.3 : .7) + 1;
    const t = [iso(x0,y0,h), iso(x1,y0,h), iso(x1,y1,h), iso(x0,y1,h)];
    g.fillStyle = css(mix([30,30,38], cc, .45)); U.poly(g, [iso(x1,y0,0), iso(x1,y1,0), iso(x1,y1,h), iso(x1,y0,h)], true); g.fill();
    g.fillStyle = css(mix([30,30,38], cc, .25)); U.poly(g, [iso(x0,y1,0), iso(x1,y1,0), iso(x1,y1,h), iso(x0,y1,h)], true); g.fill();
    g.fillStyle = css(mix(cc, [255,255,255], .35)); U.poly(g, t, true); g.fill();
    g.strokeStyle = "rgba(15,15,20,.5)"; g.lineWidth = .6; g.stroke();
  });
};
ART.case["B05-05"].ratio = 1.0;

// B05-06 表面應力驅動裂紋：球面網格＋應力色階，裂紋沿主應力方向
ART.case["B05-06"] = function(g, W, H, r, c, U){
  const cx = W*.46, cy = H*.5, R0 = Math.min(W, H)*.4, nz = U.vnoise((r()*1e6)|0), tx = .35, ty = .25;
  const rot = (x, y, z) => { const y1 = y*Math.cos(tx) - z*Math.sin(tx), z1 = y*Math.sin(tx) + z*Math.cos(tx); const x2 = x*Math.cos(ty) + z1*Math.sin(ty), z2 = -x*Math.sin(ty) + z1*Math.cos(ty); return [x2, y1, z2]; };
  const sph = (lo, la) => rot(Math.cos(la)*Math.sin(lo), Math.sin(la), Math.cos(la)*Math.cos(lo));
  // 應力色階（像素）
  const N = 64, cc = U.rgb(c);
  raster(g, N, N, (i, j) => { const x = (i/N - .5)*2.2, y = (j/N - .5)*2.2, d = x*x + y*y; if(d > 1.2) return null;
    const s = nz(i*.09, j*.09), t = Math.max(0, Math.min(1, s*1.3 - .15)); const col = t < .5 ? mix([40, 60, 110], cc, t*2) : mix(cc, [255, 245, 220], (t - .5)*2); return [col[0], col[1], col[2], d > 1 ? 0 : 150]; }, cx - R0*1.1, cy - R0*1.1, R0*2.2, R0*2.2, true);
  const shade = g.createRadialGradient(cx - R0*.3, cy - R0*.35, R0*.1, cx, cy, R0); shade.addColorStop(0, "rgba(255,255,255,.06)"); shade.addColorStop(1, "rgba(0,0,0,.45)");
  g.fillStyle = shade; g.beginPath(); g.arc(cx, cy, R0, 0, TAU); g.fill();
  // 經緯網格
  g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = .7;
  const curve = f => { g.beginPath(); let on = false; for(let t = 0; t <= 48; t++){ const p = f(t/48); if(p[2] < 0){ on = false; continue; } const X = cx + p[0]*R0, Y = cy + p[1]*R0; on ? g.lineTo(X, Y) : g.moveTo(X, Y); on = true; } g.stroke(); };
  for(let i = 0; i < 12; i++) curve(t => sph(i/12*TAU, (t - .5)*P));
  for(let j = 1; j < 8; j++) curve(t => sph(t*TAU, (j/8 - .5)*P));
  // 裂紋：UV 在正面半球，分岔方向受應力場偏轉
  const n = 90, m = 70;
  const G = grow({n, m, r, maxC:120, angle:(la, R, gen, x, y) => la + (R() < .5 ? 1 : -1)*P/2 + (nz(x*.08, y*.08) - .5)*1.2, curv:R => (R() - .5)*.03}); seeds(G, 3, r); G.run(2000, .012);
  const mp = (x, y) => { const p = sph((x/n - .5)*P*1.25 - ty, (y/m - .5)*P*.9 - tx*.6); return p[2] < .02 ? null : [cx + p[0]*R0, cy + p[1]*R0]; };
  G.cr.forEach(q => { g.strokeStyle = q.gen < 2 ? "rgba(15,15,20,.95)" : "rgba(15,15,20,.7)"; g.lineWidth = q.gen < 2 ? 1.6 : .9; stroke(g, q, mp); });
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R0, 0, TAU); g.stroke();
  // 右側色階條
  const bx = W - 14, gr = g.createLinearGradient(0, H*.2, 0, H*.8); gr.addColorStop(0, "#FFF5DC"); gr.addColorStop(.5, c); gr.addColorStop(1, "#283C6E");
  g.fillStyle = gr; g.fillRect(bx, H*.2, 5, H*.6); g.strokeStyle = "rgba(255,255,255,.4)"; g.strokeRect(bx, H*.2, 5, H*.6);
};
ART.case["B05-06"].ratio = 1.0;

// B05-07 乾裂泥土：一塊塊翹起的泥片，粗裂縫，T 字接頭
ART.case["B05-07"] = function(g, W, H, r, c, U){
  const n = 90, S = W/n, m = Math.ceil(H/S);
  const G = grow({n, m, r, maxC:110, angle:wob(.5), curv:R => (R() - .5)*.025}); seeds(G, 3, r); G.run(2200, .01);
  const {lab, info} = regions(G), cc = U.rgb(c), mud = mix([150, 118, 86], cc, .35);
  const tone = info.map(() => .55 + r()*.4);
  raster(g, n, m, (i, j) => { const l = lab[j*n+i]; if(l < 0) return [14, 12, 12, 255];
    let e = 0; for(let d = 1; d <= 2; d++){ if(i >= d && lab[j*n+i-d] !== l) e++; if(j >= d && lab[(j-d)*n+i] !== l) e++; if(i < n-d && lab[j*n+i+d] !== l) e += .5; if(j < m-d && lab[(j+d)*n+i] !== l) e += .5; }
    const k = tone[l]*(1 + e*.07) + (r() - .5)*.06; return [mud[0]*k, mud[1]*k, mud[2]*k, 255]; }, 0, 0, n*S, m*S, true);
  g.lineCap = "round"; g.lineJoin = "round";
  G.cr.forEach(q => { const w = Math.max(1.2, 4.2 - q.gen*.8); g.strokeStyle = "#0E0C0C"; g.lineWidth = w; stroke(g, q, (x, y) => [x*S, y*S]); });
  g.strokeStyle = "rgba(255,240,220,.18)"; g.lineWidth = .6;
  G.cr.forEach(q => { const w = Math.max(1.2, 4.2 - q.gen*.8); stroke(g, q, (x, y) => [x*S - w*.5, y*S - w*.5]); });
};
ART.case["B05-07"].ratio = 1.1;

// B05-08 哥窯開片：瓶身剪影，粗黑「鐵線」＋細金「金絲」兩層裂紋
ART.case["B05-08"] = function(g, W, H, r, c, U){
  const cx = W/2, y0 = H*.07, y1 = H*.93;
  const rad = t => W*(t < .1 ? .1 + t*.2 : .1 + .3*Math.pow(Math.sin(P*Math.min(1, (t - .1)/.9)), .75) + .02);
  const out = []; for(let i = 0; i <= 60; i++){ const t = i/60; out.push([cx + rad(t), y0 + (y1 - y0)*t]); }
  for(let i = 60; i >= 0; i--){ const t = i/60; out.push([cx - rad(t), y0 + (y1 - y0)*t]); }
  const body = g.createLinearGradient(cx - W*.42, 0, cx + W*.42, 0), cc = U.rgb(c), gl = mix([205, 208, 196], cc, .22);
  body.addColorStop(0, css(mix(gl, [0,0,0], .55))); body.addColorStop(.4, css(gl)); body.addColorStop(.55, css(mix(gl, [255,255,255], .3))); body.addColorStop(1, css(mix(gl, [0,0,0], .6)));
  g.fillStyle = body; U.poly(g, out, true); g.fill();
  g.save(); U.poly(g, out, true); g.clip();
  const n = 70, m = 96;
  const G = grow({n, m, r, maxC:28, curv:R => (R() - .5)*.05, angle:wob(.5)}); seeds(G, 2, r); G.run(1500, .01);
  const first = G.cr.length; G.o.maxC = 170; for(let i = 0; i < 6; i++) G.branch(); G.run(1800, .015);
  const map = (x, y) => { const t = y/m, a = (x/n - .5)*P*.94; return [cx + rad(t)*Math.sin(a), y0 + (y1 - y0)*t + Math.cos(a)*2]; };
  g.strokeStyle = "rgba(190,150,70,.85)"; g.lineWidth = .6; G.cr.forEach((q, i) => { if(i >= first) stroke(g, q, map); });
  g.strokeStyle = "rgba(25,22,20,.9)"; g.lineWidth = 1.5; G.cr.forEach((q, i) => { if(i < first) stroke(g, q, map); });
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; U.poly(g, out, true); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.2)"; g.beginPath(); g.moveTo(cx - W*.35, y1 + 1); g.lineTo(cx + W*.35, y1 + 1); g.stroke();
};
ART.case["B05-08"].ratio = 1.35;

// B05-09 Voronoi 碎裂：立方體三個面各自 Voronoi 分割，碎片向外爆開（建模線框感）
ART.case["B05-09"] = function(g, W, H, r, c, U){
  const s = Math.min(W, H)*.3, cx = W/2, cy = H*.55;
  const V = (x, y, z) => [cx + (x - y)*s*.87, cy + (x + y)*s*.5 - z*s];
  // 原始立方體虛線框
  g.setLineDash([3,3]); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1;
  [[[0,0,0],[1,0,0]],[[1,0,0],[1,1,0]],[[1,1,0],[0,1,0]],[[0,1,0],[0,0,0]],[[0,0,1],[1,0,1]],[[1,0,1],[1,1,1]],[[1,1,1],[0,1,1]],[[0,1,1],[0,0,1]],[[0,0,0],[0,0,1]],[[1,0,0],[1,0,1]],[[1,1,0],[1,1,1]],[[0,1,0],[0,1,1]]]
    .forEach(([a, b]) => { const p = V(...a), q = V(...b); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); });
  g.setLineDash([]);
  const cc = U.rgb(c);
  const faces = [
    {f:(u, v) => V(1, u, 1 - v), nrm:[.87, .5], col:.35},
    {f:(u, v) => V(u, 1, 1 - v), nrm:[-.87, .5], col:.55},
    {f:(u, v) => V(u, v, 1), nrm:[0, -1], col:.9},
  ];
  faces.forEach(F => {
    const sites = []; for(let i = 0; i < 9; i++) sites.push([r(), r()]);
    voronoi(sites, [[0,0],[1,0],[1,1],[0,1]]).forEach((poly, i) => {
      const sc = sites[i][0] - .5, sd = sites[i][1] - .5, k = 4 + r()*16;
      const off = [F.nrm[0]*k + sc*8, F.nrm[1]*k + sd*8];
      const pts = poly.map(p => { const q = F.f(p[0], p[1]); return [q[0] + off[0], q[1] + off[1]]; });
      g.fillStyle = css(mix([30,30,38], cc, F.col*(.8 + r()*.3)), .92); U.poly(g, pts, true); g.fill();
      g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = .9; g.stroke();
      g.fillStyle = "#fff"; pts.forEach(p => g.fillRect(p[0] - 1, p[1] - 1, 2, 2));
    });
  });
  // 飛散碎屑
  for(let i = 0; i < 26; i++){ const a = r()*TAU, d = s*(1.1 + r()*.5); g.fillStyle = U.rgba(c, .6); g.fillRect(cx + Math.cos(a)*d, cy - s*.5 + Math.sin(a)*d*.7, 2, 2); }
};
ART.case["B05-09"].ratio = 1.0;

// B05-10 金繼：俯視的碗，少數粗裂紋以金線修補
ART.case["B05-10"] = function(g, W, H, r, c, U){
  const cx = W/2, cy = H/2, R0 = Math.min(W, H)*.43, cc = U.rgb(c);
  g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(cx + 4, cy + 6, R0, R0, 0, 0, TAU); g.fill();
  const body = g.createRadialGradient(cx - R0*.25, cy - R0*.3, R0*.05, cx, cy, R0);
  body.addColorStop(0, css(mix(cc, [255,255,255], .25))); body.addColorStop(.7, css(mix(cc, [20,20,26], .45))); body.addColorStop(1, css(mix(cc, [10,10,14], .7)));
  g.fillStyle = body; g.beginPath(); g.arc(cx, cy, R0, 0, TAU); g.fill();
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R0*.93, 0, TAU); g.stroke();
  g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, R0*.42, 0, TAU); g.stroke();
  const n = 80, S = 2*R0/n, m = n;
  const G = grow({n, m, r, maxC:13, curv:R => (R() - .5)*.04, angle:wob(1.2), inside:(x, y) => (x - n/2)**2 + (y - m/2)**2 < (n/2 - .5)**2}); seeds(G, 2, r); G.run(1500, .006);
  const map = (x, y) => [cx - R0 + x*S, cy - R0 + y*S];
  g.lineCap = "round"; g.lineJoin = "round";
  g.shadowColor = "rgba(240,190,90,.8)"; g.shadowBlur = 6;
  G.cr.forEach(q => { g.strokeStyle = GOLD; g.lineWidth = q.gen === 0 ? 3 : 2.2; stroke(g, q, map); });
  g.shadowBlur = 0;
  g.strokeStyle = "rgba(255,236,180,.9)"; g.lineWidth = .7; G.cr.forEach(q => stroke(g, q, (x, y) => { const p = map(x, y); return [p[0] - .6, p[1] - .6]; }));
};
ART.case["B05-10"].ratio = .95;

// B05-11 油畫龜裂：金色畫框內的風景畫，表面細密龜裂網（水平方向偏好）
ART.case["B05-11"] = function(g, W, H, r, c, U){
  const fw = W*.08, cc = U.rgb(c), gold = [176, 138, 70];
  g.fillStyle = css(mix(gold, [0,0,0], .35)); g.fillRect(0, 0, W, H);
  g.fillStyle = css(gold); g.fillRect(fw*.35, fw*.35, W - fw*.7, H - fw*.7);
  g.fillStyle = css(mix(gold, [0,0,0], .5)); g.fillRect(fw*.8, fw*.8, W - fw*1.6, H - fw*1.6);
  const X = fw, Y = fw, pw = W - fw*2, ph = H - fw*2, nz = U.vnoise((r()*1e6)|0);
  const N = 70, M = Math.ceil(N*ph/pw), hz = .45 + r()*.1;
  raster(g, N, M, (i, j) => { const u = i/N, v = j/M, hill = hz + (nz(u*3, 1.5) - .5)*.25, hill2 = hz + .15 + (nz(u*4 + 7, 3) - .5)*.2;
    let col = v < hill ? mix(mix(cc, [240, 225, 190], .55), [70, 90, 120], v*.8) : v < hill2 ? mix([70, 88, 60], cc, .25) : mix([90, 72, 44], [40, 34, 28], (v - hill2)*2);
    col = mix(col, [0,0,0], (nz(i*.3, j*.3) - .5)*.25 + .1); return [col[0], col[1], col[2], 255]; }, X, Y, pw, ph, true);
  const n = 110, S = pw/n, m = Math.floor(ph/S);
  const G = grow({n, m, r, maxC:420, angle:wob(.5), curv:R => (R() - .5)*.03, nb:2}); seeds(G, 4, r, () => ((r()*2)|0)*P + (r() - .5)*.3); G.run(2400, 0);
  g.save(); g.beginPath(); g.rect(X, Y, pw, ph); g.clip();
  g.strokeStyle = "rgba(255,245,220,.18)"; g.lineWidth = .6; G.cr.forEach(q => stroke(g, q, (x, y) => [X + x*S + .7, Y + y*S + .7]));
  g.strokeStyle = "rgba(12,10,8,.7)"; g.lineWidth = .7; G.cr.forEach(q => stroke(g, q, (x, y) => [X + x*S, Y + y*S]));
  g.restore();
};
ART.case["B05-11"].ratio = 1.2;

// B05-12 生長過程影片：展場投影牆，觀眾剪影與投影光錐
ART.case["B05-12"] = function(g, W, H, r, c, U){
  const L = W*.2, Rr = W*.8, T = H*.14, B = H*.64;
  g.fillStyle = "#101014"; g.beginPath(); g.moveTo(0, H); g.lineTo(L, B); g.lineTo(Rr, B); g.lineTo(W, H); g.fill();
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1;
  [[0,0,L,T],[W,0,Rr,T],[0,H,L,B],[W,H,Rr,B]].forEach(a => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(a[2], a[3]); g.stroke(); });
  // 牆面投影
  g.fillStyle = "#0A0A0D"; g.fillRect(L, T, Rr - L, B - T);
  const n = 90, S = (Rr - L)/n, m = Math.floor((B - T)/S);
  const G = grow({n, m, r, maxC:130}); seeds(G, 3, r); G.run(1800, .012);
  const tm = G.T*.7;
  g.save(); g.beginPath(); g.rect(L, T, Rr - L, B - T); g.clip();
  g.strokeStyle = U.rgba(c, .95); g.lineWidth = .9; G.cr.forEach(q => { if(q.pts[0][2] <= tm) stroke(g, q, (x, y) => [L + x*S, T + y*S], tm); });
  g.restore();
  // 地面反光
  const rf = g.createLinearGradient(0, B, 0, H*.85); rf.addColorStop(0, U.rgba(c, .22)); rf.addColorStop(1, U.rgba(c, 0));
  g.fillStyle = rf; g.beginPath(); g.moveTo(L, B); g.lineTo(Rr, B); g.lineTo(Rr + W*.08, H*.85); g.lineTo(L - W*.08, H*.85); g.fill();
  // 投影光錐
  const px = W*.5, py = H*.98, beam = g.createLinearGradient(0, py, 0, T); beam.addColorStop(0, "rgba(255,255,255,.1)"); beam.addColorStop(1, "rgba(255,255,255,.02)");
  g.fillStyle = beam; g.beginPath(); g.moveTo(px, py); g.lineTo(L, T); g.lineTo(Rr, T); g.closePath(); g.fill();
  // 觀眾剪影
  const person = (x, y, h) => { g.fillStyle = "#07070A"; g.beginPath(); g.arc(x, y - h*.86, h*.11, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x - h*.17, y); g.lineTo(x - h*.2, y - h*.55); g.quadraticCurveTo(x, y - h*.8, x + h*.2, y - h*.55); g.lineTo(x + h*.17, y); g.fill();
    g.strokeStyle = U.rgba(c, .35); g.lineWidth = .8; g.beginPath(); g.arc(x, y - h*.86, h*.11, P*1.1, P*1.9); g.stroke(); };
  person(W*(.25 + r()*.1), H*.92, H*.3); person(W*(.62 + r()*.1), H*.97, H*.36); person(W*(.45 + r()*.06), H*.8, H*.2);
};
ART.case["B05-12"].ratio = .8;

// B05-54 iPad 移植：平板裝置上的裂紋，觸控漣漪與玻璃反光
ART.case["B05-54"] = function(g, W, H, r, c, U){
  g.translate(W/2, H/2); g.rotate(-.07);
  const dw = W*.86, dh = dw*.72, x0 = -dw/2, y0 = -dh/2, rr = 10;
  const rrect = (x, y, w, h, k) => { g.beginPath(); g.moveTo(x + k, y); g.arcTo(x + w, y, x + w, y + h, k); g.arcTo(x + w, y + h, x, y + h, k); g.arcTo(x, y + h, x, y, k); g.arcTo(x, y, x + w, y, k); g.closePath(); };
  g.fillStyle = "rgba(0,0,0,.4)"; rrect(x0 + 4, y0 + 6, dw, dh, rr); g.fill();
  g.fillStyle = "#3A3A44"; rrect(x0, y0, dw, dh, rr); g.fill(); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.stroke();
  const b = 8, sx = x0 + b, sy = y0 + b, sw = dw - b*2, sh = dh - b*2;
  g.fillStyle = "#F3F0EA"; g.fillRect(sx, sy, sw, sh);
  const n = 80, S = sw/n, m = Math.floor(sh/S);
  const G = grow({n, m, r, maxC:140, angle:wob(.1)}); seeds(G, 3, r); G.run(1800, .012);
  const pal = [U.rgba(c, .9), "rgba(40,40,46,.85)", "rgba(200,120,70,.85)"];
  g.save(); g.beginPath(); g.rect(sx, sy, sw, sh); g.clip();
  G.cr.forEach((q, i) => { g.strokeStyle = pal[i % 3]; g.lineWidth = q.gen < 2 ? 1.1 : .7; stroke(g, q, (x, y) => [sx + x*S, sy + y*S]); });
  // 觸控漣漪
  const tx = sx + sw*(.55 + r()*.25), ty = sy + sh*(.35 + r()*.3);
  [5, 10, 16].forEach((k, i) => { g.strokeStyle = U.rgba(c, .7 - i*.2); g.lineWidth = 1.4; g.beginPath(); g.arc(tx, ty, k, 0, TAU); g.stroke(); });
  g.fillStyle = U.rgba(c, .8); g.beginPath(); g.arc(tx, ty, 3, 0, TAU); g.fill();
  // 玻璃反光
  const gl = g.createLinearGradient(sx, sy, sx + sw, sy + sh); gl.addColorStop(0, "rgba(255,255,255,.18)"); gl.addColorStop(.4, "rgba(255,255,255,0)"); g.fillStyle = gl; g.fillRect(sx, sy, sw, sh);
  g.restore();
  g.fillStyle = "#222"; g.beginPath(); g.arc(x0 + dw - 4, 0, 1.6, 0, TAU); g.fill();
};
ART.case["B05-54"].ratio = .78;
})();
