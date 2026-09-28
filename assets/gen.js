/* ================================================================
   各演算法的網頁版小型生成器（A01 另有完整的 L-System 引擎）
   GEN[id](g, W, H, r, v, c)
     g 已鋪好深色底的 2D context；W,H 畫布尺寸；r() 0–1 亂數；
     v 變體編號（變形、案例會用不同的 v，讓每張圖都不一樣）；c 家族色
   每個生成器都是該演算法的簡化實作，不是裝飾圖。
   ================================================================ */
(function(){
const TAU = Math.PI * 2;
function vnoise(seed){ // 2D value noise
  const p = new Uint8Array(512), r = mk(seed); for(let i = 0; i < 256; i++) p[i] = i;
  for(let i = 255; i > 0; i--){ const j = (r()*(i+1))|0; [p[i],p[j]] = [p[j],p[i]]; }
  for(let i = 0; i < 256; i++) p[i+256] = p[i];
  const f = t => t*t*(3-2*t), h = (x,y) => p[p[x&255]+(y&255)]/255;
  return (x,y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = f(x-xi), yf = f(y-yi);
    const a = h(xi,yi), b = h(xi+1,yi), c = h(xi,yi+1), d = h(xi+1,yi+1);
    return a + (b-a)*xf + (c-a)*yf + (a-b-c+d)*xf*yf; };
}
function mk(seed){ let s = (seed >>> 0) || 1; return () => (s = (s*1664525 + 1013904223) >>> 0) / 4294967296; }
function rgba(hex, a){ const n = parseInt(hex.slice(1),16); return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`; }
function rgb(hex){ const n = parseInt(hex.slice(1),16); return [n>>16,(n>>8)&255,n&255]; }
function poly(g, pts, close){ g.beginPath(); pts.forEach((p,i) => i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1])); if(close) g.closePath(); }
// 把 0–1 的純量場畫成像素（family 色漸層）
function field(g, W, H, n, m, val, c, gamma = 1){
  const img = g.createImageData(n, m), [R,G,B] = rgb(c);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){
    const t = Math.pow(Math.max(0, Math.min(1, val(i,j))), gamma), k = (j*n+i)*4;
    img.data[k] = 21 + (R-21)*t + (255-R)*Math.max(0,t-.8)*2.5; img.data[k+1] = 21 + (G-21)*t + (255-G)*Math.max(0,t-.8)*2.5; img.data[k+2] = 27 + (B-27)*t + (255-B)*Math.max(0,t-.8)*2.5; img.data[k+3] = 255;
  }
  const off = document.createElement("canvas"); off.width = n; off.height = m; off.getContext("2d").putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, W, H);
}
// Marching squares：回傳等值線段
function contour(n, m, f, iso){
  const out = [], L = (a,b) => (iso-a)/((b-a)||1e-9);
  for(let j = 0; j < m-1; j++) for(let i = 0; i < n-1; i++){
    const a = f(i,j), b = f(i+1,j), cc = f(i+1,j+1), d = f(i,j+1);
    const k = (a>iso?8:0)|(b>iso?4:0)|(cc>iso?2:0)|(d>iso?1:0); if(k === 0 || k === 15) continue;
    const T = [i+L(a,b), j], R = [i+1, j+L(b,cc)], B = [i+L(d,cc), j+1], Lf = [i, j+L(a,d)];
    const S = {1:[[Lf,B]],2:[[B,R]],3:[[Lf,R]],4:[[T,R]],5:[[Lf,T],[B,R]],6:[[T,B]],7:[[Lf,T]],8:[[Lf,T]],9:[[T,B]],10:[[Lf,B],[T,R]],11:[[T,R]],12:[[Lf,R]],13:[[B,R]],14:[[Lf,B]]}[k];
    S.forEach(s => out.push(s));
  }
  return out;
}

const GEN = {
  // ---------- A 規則與語法 ----------
  A02(g, W, H, r, v, c){ // Koch 雪花（奇數變體：向內的反雪花）
    const depth = 3 + v % 3, inward = v % 2 ? -1 : 1, R = Math.min(W,H)*.36, cx = W/2, cy = H/2 + R*.1;
    let pts = [0,1,2].map(k => [cx + R*Math.cos(-Math.PI/2 + k*TAU/3), cy + R*Math.sin(-Math.PI/2 + k*TAU/3)]);
    for(let d = 0; d < depth; d++){ const np = [];
      for(let i = 0; i < pts.length; i++){ const [x1,y1] = pts[i], [x2,y2] = pts[(i+1)%pts.length], dx = (x2-x1)/3, dy = (y2-y1)/3;
        const a = [x1+dx,y1+dy], b = [x1+2*dx,y1+2*dy], ang = -Math.PI/3*inward;
        np.push([x1,y1], a, [a[0] + dx*Math.cos(ang) - dy*Math.sin(ang), a[1] + dx*Math.sin(ang) + dy*Math.cos(ang)], b); }
      pts = np; }
    g.fillStyle = rgba(c,.12); poly(g, pts, true); g.fill(); g.strokeStyle = c; g.lineWidth = 1.3; g.stroke();
  },
  A03(g, W, H, r, v, c){ // Hilbert 曲線，依順序漸層
    const order = 3 + v % 4, N = 1 << order, pts = [];
    for(let d = 0; d < N*N; d++){ let x = 0, y = 0, t = d;
      for(let s = 1; s < N; s *= 2){ const rx = 1 & (t/2), ry = 1 & (t ^ rx); if(ry === 0){ if(rx === 1){ x = s-1-x; y = s-1-y; } [x,y] = [y,x]; } x += s*rx; y += s*ry; t = Math.floor(t/4); }
      pts.push([x,y]); }
    const S = Math.min(W,H)*.8/(N-1||1), ox = (W - S*(N-1))/2, oy = (H - S*(N-1))/2;
    g.lineWidth = Math.max(1, S*.28); g.lineCap = "round"; g.lineJoin = "round";
    for(let i = 1; i < pts.length; i++){ const t = i/pts.length; g.strokeStyle = `hsl(${(12 + t*40)},${70 + t*10}%,${45 + t*25}%)`; g.beginPath(); g.moveTo(ox+pts[i-1][0]*S, oy+pts[i-1][1]*S); g.lineTo(ox+pts[i][0]*S, oy+pts[i][1]*S); g.stroke(); }
  },
  A04(g, W, H, r, v, c){ // 遞迴分割（Mondrian 式）
    const min = Math.min(W,H) * (.08 + (v%3)*.03), cols = [c, "#F5F2EC", "#F2A007", "#2F6FE4", "#15151B"];
    const split = (x,y,w,h,d) => {
      if((w < min*2 && h < min*2) || d > 7 || (d > 2 && r() < .18)){ g.fillStyle = r() < .72 ? "#1E1E26" : cols[(r()*cols.length)|0]; g.fillRect(x+2,y+2,w-4,h-4); return; }
      if(w > h ? r() < .8 : r() < .2){ const s = w*(.3 + r()*.4); split(x,y,s,h,d+1); split(x+s,y,w-s,h,d+1); }
      else { const s = h*(.3 + r()*.4); split(x,y,w,s,d+1); split(x,y+s,w,h-s,d+1); }
    };
    split(W*.06, H*.06, W*.88, H*.88, 0);
  },
  A05(g, W, H, r, v, c){ // 形狀文法：正方形 → 正方形 ＋ 兩個縮小旋轉的正方形
    const ang = (20 + (v%5)*8) * Math.PI/180, sc = .62 + (v%3)*.04;
    const sq = (x,y,s,a,d) => { const p = [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([u,w]) => [x + (u*Math.cos(a) - w*Math.sin(a))*s, y + (u*Math.sin(a) + w*Math.cos(a))*s]);
      g.strokeStyle = rgba(c, .35 + .65*(1 - d/8)); g.lineWidth = 1.2; poly(g, p, true); g.stroke();
      if(d >= 7 || s < 4) return;
      const tx = x + (-Math.sin(a))*(-s*.5), ty = y + Math.cos(a)*(-s*.5);
      const ns = s*sc; [[-1],[1]].forEach(([k]) => { const na = a + k*ang; sq(tx + Math.cos(a)*k*s*.28 + Math.sin(na)*ns*.5, ty + Math.sin(a)*k*s*.28 - Math.cos(na)*ns*.5, ns, na, d+1); }); };
    sq(W/2, H*.8, Math.min(W,H)*.2, 0, 0);
  },
  A06(g, W, H, r, v, c){ // WFC 管線拼磚（邊狀態一致，拼起來一定接得上）
    const n = 7 + v % 5, s = Math.min(W,H)*.9/n, ox = (W - s*n)/2, oy = (H - s*n)/2, p = .45 + (v%3)*.1;
    const hE = [...Array(n+1)].map(() => [...Array(n)].map(() => r() < p)), vE = [...Array(n)].map(() => [...Array(n+1)].map(() => r() < p));
    for(let i = 0; i < n; i++){ hE[0][i] = hE[n][i] = false; vE[i][0] = vE[i][n] = false; }
    g.lineCap = "round"; g.lineWidth = s*.22;
    for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){
      const cx = ox + (i+.5)*s, cy = oy + (j+.5)*s, e = [hE[j][i], vE[j][i+1], hE[j+1][i], vE[j][i]];
      g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1; g.strokeRect(ox+i*s, oy+j*s, s, s); g.lineWidth = s*.22;
      g.strokeStyle = c; [[0,-1],[1,0],[0,1],[-1,0]].forEach(([dx,dy],k) => { if(e[k]){ g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+dx*s/2, cy+dy*s/2); g.stroke(); } });
      if(e.filter(Boolean).length === 1){ g.fillStyle = "#fff"; g.beginPath(); g.arc(cx,cy,s*.16,0,TAU); g.fill(); }
    }
  },

  // ---------- B 生長 ----------
  B01(g, W, H, r, v, c){ // 差異生長：斥力＋吸引＋插點
    let P = []; const R0 = Math.min(W,H)*.08, cx = W/2, cy = H/2, maxN = 300 + (v%3)*60, dmax = Math.min(W,H)*.018;
    for(let i = 0; i < 24; i++){ const a = i/24*TAU; P.push([cx + R0*Math.cos(a), cy + R0*Math.sin(a)]); }
    for(let it = 0; it < 220; it++){
      const F = P.map(() => [0,0]), rr = dmax*2.6;
      for(let i = 0; i < P.length; i++) for(let j = i+1; j < P.length; j++){ const dx = P[i][0]-P[j][0], dy = P[i][1]-P[j][1], d = Math.hypot(dx,dy); if(d < rr && d > 1e-6){ const f = (rr-d)/rr*.9; F[i][0] += dx/d*f; F[i][1] += dy/d*f; F[j][0] -= dx/d*f; F[j][1] -= dy/d*f; } }
      for(let i = 0; i < P.length; i++){ const a = P[(i-1+P.length)%P.length], b = P[(i+1)%P.length]; F[i][0] += ((a[0]+b[0])/2 - P[i][0])*.15; F[i][1] += ((a[1]+b[1])/2 - P[i][1])*.15; }
      P = P.map((p,i) => [Math.max(8, Math.min(W-8, p[0]+F[i][0])), Math.max(8, Math.min(H-8, p[1]+F[i][1]))]);
      if(P.length < maxN){ const Q = []; for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1)%P.length]; Q.push(a); if(Math.hypot(a[0]-b[0],a[1]-b[1]) > dmax*.9) Q.push([(a[0]+b[0])/2 + (r()-.5), (a[1]+b[1])/2 + (r()-.5)]); } P = Q; }
    }
    g.fillStyle = rgba(c,.15); poly(g, P, true); g.fill(); g.strokeStyle = c; g.lineWidth = 1.6; g.stroke();
  },
  B02(g, W, H, r, v, c){ // DLA：隨機行走、碰到就黏住
    const n = 120, s = Math.min(W,H)/n, grid = new Uint16Array(n*n), cx = n>>1, cy = v % 2 ? n-2 : n>>1;
    if(v % 2) for(let i = 0; i < n; i++) grid[(n-1)*n+i] = 1; else grid[cy*n+cx] = 1;
    let rad = 4, count = 1;
    for(let p = 0; p < 1700; p++){
      let x, y; if(v % 2){ x = (r()*n)|0; y = Math.max(1, n - 2 - rad - 4); } else { const a = r()*TAU; x = (cx + Math.cos(a)*(rad+4))|0; y = (cy + Math.sin(a)*(rad+4))|0; }
      for(let st = 0; st < 3000; st++){
        x += (r()*3|0) - 1; y += (r()*3|0) - 1; if(x < 1 || y < 1 || x > n-2 || y > n-2) break;
        if(grid[(y-1)*n+x] || grid[(y+1)*n+x] || grid[y*n+x-1] || grid[y*n+x+1]){ grid[y*n+x] = ++count; rad = Math.max(rad, v % 2 ? n-2-y : Math.hypot(x-cx,y-cy)); break; }
      }
      if(rad > n*.45) break;
    }
    const ox = (W - s*n)/2, oy = (H - s*n)/2;
    for(let i = 0; i < n*n; i++) if(grid[i]){ const t = grid[i]/count; g.fillStyle = t < .5 ? c : rgba(c, 1 - (t-.5)); g.fillRect(ox + (i%n)*s, oy + ((i/n)|0)*s, s+.3, s+.3); }
  },
  B03(g, W, H, r, v, c){ // 空間殖民：枝端朝吸引點生長
    const A = [], seg = Math.min(W,H)*.022, inf = seg*7, kill = seg*1.6, cx = W/2, cy = H*.38, rx = W*.36, ry = H*.26;
    for(let i = 0; i < 360; i++){ const a = r()*TAU, d = Math.sqrt(r()); A.push([cx + Math.cos(a)*d*rx, cy + Math.sin(a)*d*ry]); }
    const N = [[W/2, H*.95, -1]];
    for(let y = H*.95; y > cy + ry*.6; y -= seg) N.push([W/2, y - seg, N.length-1]);
    for(let it = 0; it < 90 && A.length; it++){
      const dir = new Map();
      for(const a of A){ let best = -1, bd = inf; for(let i = 0; i < N.length; i++){ const d = Math.hypot(a[0]-N[i][0], a[1]-N[i][1]); if(d < bd){ bd = d; best = i; } } if(best >= 0){ const e = dir.get(best) || [0,0,0]; e[0] += (a[0]-N[best][0])/bd; e[1] += (a[1]-N[best][1])/bd; e[2]++; dir.set(best, e); } }
      if(!dir.size) break;
      for(const [i,[dx,dy]] of dir){ const l = Math.hypot(dx,dy) || 1; N.push([N[i][0] + dx/l*seg, N[i][1] + dy/l*seg, i]); }
      for(let k = A.length-1; k >= 0; k--) if(N.some(nd => Math.hypot(A[k][0]-nd[0], A[k][1]-nd[1]) < kill)) A.splice(k,1);
    }
    const depth = N.map(() => 1); for(let i = N.length-1; i > 0; i--) if(N[i][2] >= 0) depth[N[i][2]] += depth[i];
    g.lineCap = "round"; g.strokeStyle = c;
    for(let i = 1; i < N.length; i++){ const p = N[N[i][2]]; if(!p) continue; g.lineWidth = Math.min(7, .6 + Math.sqrt(depth[i])*.35); g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(N[i][0],N[i][1]); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,.35)"; A.forEach(a => g.fillRect(a[0],a[1],1.5,1.5));
  },
  B04(g, W, H, r, v, c){ // 葉序：黃金角
    const ang = [137.508, 137.3, 137.6, 138.2, 136.8, 137.508][v % 6] * Math.PI/180, n = 700, s = Math.min(W,H)*.45/Math.sqrt(n);
    for(let i = 0; i < n; i++){ const a = i*ang, rr = s*Math.sqrt(i), t = i/n; g.fillStyle = t < .15 ? "#F2A007" : rgba(c, .5 + t*.5); g.beginPath(); g.arc(W/2 + rr*Math.cos(a), H/2 + rr*Math.sin(a), 1 + t*s*.45, 0, TAU); g.fill(); }
  },
  B05(g, W, H, r, v, c){ // Substrate：裂紋直走，撞到就停，從側邊分岔
    const n = 220, S = W/n, m = Math.round(H/S), grid = new Float32Array(n*m).fill(-1), cracks = [];
    const add = (x,y,a) => { if(cracks.length < 120) cracks.push({x,y,a}); };
    for(let k = 0; k < 6 + v%4; k++) add(r()*n, r()*m, r()*TAU);
    g.lineWidth = 1; g.strokeStyle = c;
    for(let step = 0; step < 1600 && cracks.length; step++){
      for(let k = cracks.length-1; k >= 0; k--){ const q = cracks[k], nx = q.x + Math.cos(q.a)*.6, ny = q.y + Math.sin(q.a)*.6, ix = nx|0, iy = ny|0;
        if(ix < 0 || iy < 0 || ix >= n || iy >= m){ cracks.splice(k,1); continue; }
        const o = grid[iy*n+ix];
        if(o >= 0 && Math.abs(o - q.a) > .05 && (ix !== (q.x|0) || iy !== (q.y|0))){ cracks.splice(k,1); if(r() < .9){ const px = (r()*n)|0, py = (r()*m)|0, pa = grid[py*n+px]; if(pa >= 0) add(px, py, pa + (r() < .5 ? 1 : -1)*Math.PI/2 + (r()-.5)*.1); } continue; }
        grid[iy*n+ix] = q.a; g.beginPath(); g.moveTo(q.x*S, q.y*S); g.lineTo(nx*S, ny*S); g.stroke();
        g.fillStyle = rgba(c,.05); g.fillRect(nx*S + Math.cos(q.a+Math.PI/2)*S*3*r(), ny*S + Math.sin(q.a+Math.PI/2)*S*3*r(), S*2, S*2);
        q.x = nx; q.y = ny;
        if(r() < .012) add(q.x, q.y, q.a + (r()<.5?1:-1)*Math.PI/2);
      }
    }
  },

  // ---------- C 場與擴散 ----------
  C01(g, W, H, r, v, c){ // Gray-Scott 反應擴散
    const n = 84, m = Math.round(n*H/W), P = [[.037,.06],[.029,.057],[.055,.062],[.025,.06],[.039,.058],[.0545,.062]][v % 6];
    let A = new Float32Array(n*m).fill(1), B = new Float32Array(n*m), A2 = new Float32Array(n*m), B2 = new Float32Array(n*m);
    for(let k = 0; k < 10; k++){ const x = (r()*(n-10)+5)|0, y = (r()*(m-10)+5)|0; for(let j = -3; j <= 3; j++) for(let i = -3; i <= 3; i++) B[(y+j)*n+x+i] = 1; }
    const [f,kk] = P;
    for(let it = 0; it < 1400; it++){
      for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){
        const i = y*n+x, xm = y*n + (x-1+n)%n, xp = y*n + (x+1)%n, ym = ((y-1+m)%m)*n + x, yp = ((y+1)%m)*n + x;
        const la = A[xm]+A[xp]+A[ym]+A[yp] - 4*A[i], lb = B[xm]+B[xp]+B[ym]+B[yp] - 4*B[i], abb = A[i]*B[i]*B[i];
        A2[i] = A[i] + (1.0*la*.2 - abb + f*(1-A[i])); B2[i] = B[i] + (.5*lb*.2 + abb - (kk+f)*B[i]);
      }
      [A,A2] = [A2,A]; [B,B2] = [B2,B];
    }
    field(g, W, H, n, m, (i,j) => (B[j*n+i])*3, c, .9);
  },
  C02(g, W, H, r, v, c){ // 生命遊戲：每一代往上疊一層（等角視角）
    const n = 22, gens = 10 + v % 5; let s = new Uint8Array(n*n); for(let i = 0; i < n*n; i++) s[i] = r() < .32 ? 1 : 0;
    const u = Math.min(W/(n*1.9), H/(n + gens*1.6)), ox = W/2, oy = H - u*n*.55 - u;
    const cube = (x,y,z,t) => { const px = ox + (x-y)*u*.87, py = oy + (x+y)*u*.5 - z*u*1.05;
      g.fillStyle = rgba(c, .35 + t*.65); g.beginPath(); g.moveTo(px,py-u*.5); g.lineTo(px+u*.87,py); g.lineTo(px,py+u*.5); g.lineTo(px-u*.87,py); g.closePath(); g.fill(); };
    for(let z = 0; z < gens; z++){
      for(let y = 0; y < n; y++) for(let x = 0; x < n; x++) if(s[y*n+x]) cube(x,y,z,z/gens);
      const t = new Uint8Array(n*n);
      for(let y = 0; y < n; y++) for(let x = 0; x < n; x++){ let k = 0; for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++) if(dx||dy) k += s[((y+dy+n)%n)*n + (x+dx+n)%n]; t[y*n+x] = k === 3 || (k === 2 && s[y*n+x]) ? 1 : 0; }
      s = t;
    }
  },
  C03(g, W, H, r, v, c){ // 向量場流線
    const nz = vnoise(v*17+3), sc = .004 + (v%4)*.0015; g.lineWidth = 1.1;
    for(let k = 0; k < 420; k++){ let x = r()*W, y = r()*H; g.strokeStyle = rgba(c, .25 + r()*.6); g.beginPath(); g.moveTo(x,y);
      for(let i = 0; i < 70; i++){ const a = nz(x*sc, y*sc)*TAU*1.6; x += Math.cos(a)*2.2; y += Math.sin(a)*2.2; if(x < 0 || y < 0 || x > W || y > H) break; g.lineTo(x,y); } g.stroke(); }
  },
  C04(g, W, H, r, v, c){ // Perlin 地形：疊層雜訊，脊線剖面
    const nz = vnoise(v*31+7), rows = 38; g.lineWidth = 1.2;
    for(let j = 0; j < rows; j++){ const base = H*.22 + j*(H*.7/rows); g.beginPath();
      for(let i = 0; i <= 80; i++){ const x = i/80*W, q = x/W; let h = 0, a = 1, f = 3;
        for(let o = 0; o < 4; o++){ h += nz(q*f + 10, j*.09*f)*a; a *= .5; f *= 2; }
        const y = base - Math.pow(Math.sin(q*Math.PI), 1.5)*h*H*.22; i ? g.lineTo(x,y) : g.moveTo(x,y); }
      g.fillStyle = "#15151B"; g.lineTo(W,H); g.lineTo(0,H); g.closePath(); g.fill(); g.strokeStyle = rgba(c, .4 + j/rows*.6); g.stroke(); }
  },
  C05(g, W, H, r, v, c){ // Marching Squares：metaball 場的多層等值線
    const n = 90, m = Math.round(n*H/W), balls = [...Array(5 + v%4)].map(() => [r()*n, r()*m, 6 + r()*9]);
    const f = (i,j) => balls.reduce((s,[x,y,rr]) => s + rr*rr/((i-x)**2 + (j-y)**2 + 1), 0), S = W/(n-1);
    g.lineWidth = 1.3;
    [.6,1,1.6,2.6,4].forEach((iso,k) => { g.strokeStyle = rgba(c, .3 + k*.17); g.beginPath(); contour(n, m, f, iso).forEach(([a,b]) => { g.moveTo(a[0]*S,a[1]*S); g.lineTo(b[0]*S,b[1]*S); }); g.stroke(); });
  },

  // ---------- D 代理人 ----------
  D01(g, W, H, r, v, c){ // Boids：分離、對齊、凝聚，畫軌跡
    const n = 70, B = [...Array(n)].map(() => ({x:r()*W, y:r()*H, vx:r()-.5, vy:r()-.5, t:[]}));
    const ws = [[1.5,1,1],[2,1.4,.6],[1,2,1],[1.2,.6,1.8]][v%4];
    for(let st = 0; st < 180; st++){
      for(const b of B){ let sx=0,sy=0,ax=0,ay=0,cx=0,cy=0,k=0;
        for(const o of B){ if(o===b) continue; const dx = o.x-b.x, dy = o.y-b.y, d = Math.hypot(dx,dy); if(d < 40){ k++; ax += o.vx; ay += o.vy; cx += dx; cy += dy; if(d < 14){ sx -= dx/(d||1); sy -= dy/(d||1); } } }
        if(k){ b.nvx = b.vx + (sx*ws[0] + (ax/k - b.vx)*ws[1]*.3 + cx/k*ws[2]*.004); b.nvy = b.vy + (sy*ws[0] + (ay/k - b.vy)*ws[1]*.3 + cy/k*ws[2]*.004); } else { b.nvx = b.vx; b.nvy = b.vy; }
        const mg = 40; if(b.x < mg) b.nvx += .25; if(b.x > W-mg) b.nvx -= .25; if(b.y < mg) b.nvy += .25; if(b.y > H-mg) b.nvy -= .25; }
      for(const b of B){ const s = Math.hypot(b.nvx,b.nvy) || 1, sp = 2.2; b.vx = b.nvx/s*sp; b.vy = b.nvy/s*sp; b.x += b.vx; b.y += b.vy; b.t.push([b.x,b.y]); }
    }
    g.lineWidth = 1; B.forEach(b => { g.strokeStyle = rgba(c,.45); poly(g, b.t.slice(-90)); g.stroke(); const p = b.t[b.t.length-1], a = Math.atan2(b.vy,b.vx);
      g.fillStyle = "#fff"; g.beginPath(); g.moveTo(p[0]+Math.cos(a)*5, p[1]+Math.sin(a)*5); g.lineTo(p[0]+Math.cos(a+2.5)*4, p[1]+Math.sin(a+2.5)*4); g.lineTo(p[0]+Math.cos(a-2.5)*4, p[1]+Math.sin(a-2.5)*4); g.fill(); });
  },
  D02(g, W, H, r, v, c){ // Physarum：感測、轉向、留痕、擴散、衰減
    const n = 150, m = Math.round(n*H/W); let T = new Float32Array(n*m), T2 = new Float32Array(n*m);
    const sa = [.45,.7,.3,.9][v%4], sd = 7 + (v%3)*2, ag = [...Array(4000)].map(() => [r()*n, r()*m, r()*TAU]);
    const at = (x,y) => T[((y|0)+m)%m*n + ((x|0)+n)%n];
    for(let it = 0; it < 170; it++){
      for(const q of ag){ const f = at(q[0]+Math.cos(q[2])*sd, q[1]+Math.sin(q[2])*sd), L = at(q[0]+Math.cos(q[2]-sa)*sd, q[1]+Math.sin(q[2]-sa)*sd), R = at(q[0]+Math.cos(q[2]+sa)*sd, q[1]+Math.sin(q[2]+sa)*sd);
        if(f < L && f < R) q[2] += (r() < .5 ? -1 : 1)*.4; else if(L > R) q[2] -= .4; else if(R > L) q[2] += .4;
        q[0] = (q[0] + Math.cos(q[2]) + n) % n; q[1] = (q[1] + Math.sin(q[2]) + m) % m; T[(q[1]|0)*n + (q[0]|0)] += 1; }
      for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){ let s = 0; for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++) s += T[((y+dy+m)%m)*n + (x+dx+n)%n]; T2[y*n+x] = s/9*.9; }
      [T,T2] = [T2,T];
    }
    let mx = 0; for(const t of T) mx = Math.max(mx,t);
    field(g, W, H, n, m, (i,j) => T[j*n+i]/mx*1.8, c, .7);
  },
  D03(g, W, H, r, v, c){ // 人流：朝出口的目標力＋彼此排斥＋繞過障礙
    const doorY = H*(.35 + (v%3)*.15), obs = [[W*.5, H*.5, Math.min(W,H)*.12]], P = [...Array(90)].map(() => ({x:r()*W*.25, y:r()*H, vx:0, vy:0, t:[]}));
    g.fillStyle = "rgba(255,255,255,.08)"; obs.forEach(([x,y,rr]) => { g.beginPath(); g.arc(x,y,rr,0,TAU); g.fill(); });
    for(let st = 0; st < 260; st++){
      for(const p of P){ if(p.done) continue; let fx = W - p.x, fy = doorY - p.y; const d = Math.hypot(fx,fy) || 1; fx = fx/d*1.4 - p.vx; fy = fy/d*1.4 - p.vy;
        for(const o of P){ if(o === p || o.done) continue; const dx = p.x-o.x, dy = p.y-o.y, dd = Math.hypot(dx,dy); if(dd < 14 && dd > 0){ fx += dx/dd*(14-dd)*.15; fy += dy/dd*(14-dd)*.15; } }
        for(const [x,y,rr] of obs){ const dx = p.x-x, dy = p.y-y, dd = Math.hypot(dx,dy); if(dd < rr+18){ fx += dx/dd*(rr+18-dd)*.2; fy += dy/dd*(rr+18-dd)*.2; } }
        p.vx += fx*.2; p.vy += fy*.2; p.x += p.vx; p.y += p.vy; p.t.push([p.x,p.y]); if(p.x > W-4) p.done = true; }
    }
    g.lineWidth = 1; P.forEach(p => { g.strokeStyle = rgba(c,.5); poly(g, p.t); g.stroke(); });
    g.fillStyle = "#fff"; g.fillRect(W-4, doorY-14, 4, 28);
  },

  // ---------- E 排列與鬆弛 ----------
  E01(g, W, H, r, v, c){ // Circle Packing：隨機放圓、長到碰到為止
    const C = [], maxR = Math.min(W,H)*(.12 + (v%3)*.04);
    for(let t = 0; t < 4000 && C.length < 420; t++){ const x = r()*W, y = r()*H; let R = maxR;
      for(const q of C){ R = Math.min(R, Math.hypot(q[0]-x,q[1]-y) - q[2] - 1.5); if(R < 1.5) break; }
      R = Math.min(R, x, y, W-x, H-y); if(R >= 1.5) C.push([x,y,R]); }
    C.forEach(([x,y,R]) => { g.fillStyle = rgba(c, .15 + (R/maxR)*.5); g.strokeStyle = c; g.lineWidth = 1; g.beginPath(); g.arc(x,y,R,0,TAU); g.fill(); g.stroke(); });
  },
  E02(g, W, H, r, v, c){ // Poisson 圓盤取樣（Bridson）
    const rad = Math.min(W,H)*(.035 + (v%3)*.012), cs = rad/Math.SQRT2, gw = Math.ceil(W/cs), gh = Math.ceil(H/cs), grid = new Int32Array(gw*gh).fill(-1), P = [], act = [];
    const add = p => { P.push(p); act.push(P.length-1); grid[((p[1]/cs)|0)*gw + ((p[0]/cs)|0)] = P.length-1; };
    add([W/2, H/2]);
    while(act.length){ const k = (r()*act.length)|0, p = P[act[k]]; let ok = false;
      for(let t = 0; t < 30; t++){ const a = r()*TAU, d = rad*(1 + r()), q = [p[0] + Math.cos(a)*d, p[1] + Math.sin(a)*d];
        if(q[0] < 0 || q[1] < 0 || q[0] >= W || q[1] >= H) continue; const gx = (q[0]/cs)|0, gy = (q[1]/cs)|0; let far = true;
        for(let y = Math.max(0,gy-2); y <= Math.min(gh-1,gy+2) && far; y++) for(let x = Math.max(0,gx-2); x <= Math.min(gw-1,gx+2); x++){ const i = grid[y*gw+x]; if(i >= 0 && Math.hypot(P[i][0]-q[0], P[i][1]-q[1]) < rad){ far = false; break; } }
        if(far){ add(q); ok = true; break; } }
      if(!ok) act.splice(k,1); }
    P.forEach((p,i) => { g.fillStyle = rgba(c, .5 + (i/P.length)*.5); g.beginPath(); g.arc(p[0],p[1], rad*.22, 0, TAU); g.fill(); g.strokeStyle = rgba(c,.12); g.beginPath(); g.arc(p[0],p[1], rad*.5, 0, TAU); g.stroke(); });
  },
  E03(g, W, H, r, v, c){ // Voronoi ＋ Lloyd 鬆弛（像素法）
    const s = 3, n = Math.ceil(W/s), m = Math.ceil(H/s), K = 40 + (v%4)*25, lab = new Int32Array(n*m);
    let S = [...Array(K)].map(() => [r()*n, r()*m]);
    const assign = () => { for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ let b = 0, bd = 1e9; for(let k = 0; k < K; k++){ const d = (S[k][0]-i)**2 + (S[k][1]-j)**2; if(d < bd){ bd = d; b = k; } } lab[j*n+i] = b; } };
    for(let it = 0; it < 1 + (v%3)*2; it++){ assign(); const acc = S.map(() => [0,0,0]); for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const a = acc[lab[j*n+i]]; a[0] += i; a[1] += j; a[2]++; } S = acc.map((a,k) => a[2] ? [a[0]/a[2], a[1]/a[2]] : S[k]); }
    assign();
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const k = lab[j*n+i]; if((i < n-1 && lab[j*n+i+1] !== k) || (j < m-1 && lab[(j+1)*n+i] !== k)){ g.fillStyle = c; g.fillRect(i*s, j*s, s, s); } else if((k*7)%5 === 0){ g.fillStyle = rgba(c,.12); g.fillRect(i*s, j*s, s, s); } }
    g.fillStyle = "#fff"; S.forEach(p => g.fillRect(p[0]*s-1, p[1]*s-1, 2.5, 2.5));
  },
  E04(g, W, H, r, v, c){ // 動態鬆弛：四角固定的網在重力下找形（倒過來就是殼）
    const n = 14, P = [], V = []; for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){ P.push([i/(n-1)-.5, j/(n-1)-.5, 0]); V.push([0,0,0]); }
    const pin = new Set(v % 2 ? [0, n-1, n*(n-1), n*n-1] : [...Array(n)].flatMap((_,i) => [i, n*(n-1)+i])), E = [];
    for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){ if(i < n-1) E.push([j*n+i, j*n+i+1]); if(j < n-1) E.push([j*n+i, (j+1)*n+i]); }
    const L0 = 1/(n-1)*.9;
    for(let it = 0; it < 500; it++){ const F = P.map(() => [0,0,-.0009]);
      for(const [a,b] of E){ const d = [0,1,2].map(k => P[b][k]-P[a][k]), l = Math.hypot(...d), f = (l - L0)*.5; for(let k = 0; k < 3; k++){ F[a][k] += d[k]/l*f; F[b][k] -= d[k]/l*f; } }
      P.forEach((p,i) => { if(pin.has(i)) return; for(let k = 0; k < 3; k++){ V[i][k] = (V[i][k] + F[i][k])*.9; p[k] += V[i][k]; } }); }
    const sc = Math.min(W,H)*.75, prj = p => [W/2 + (p[0]-p[1])*sc*.8, H*.42 + (p[0]+p[1])*sc*.4 + p[2]*sc*-1.1];
    g.lineWidth = 1; E.forEach(([a,b]) => { const za = -P[a][2]; g.strokeStyle = rgba(c, .4 + Math.min(.6, za*3)); const A = prj([P[a][0],P[a][1],-P[a][2]]), B = prj([P[b][0],P[b][1],-P[b][2]]); g.beginPath(); g.moveTo(...A); g.lineTo(...B); g.stroke(); });
  },

  // ---------- F 圖樣與最佳化 ----------
  F01(g, W, H, r, v, c){ // Truchet（Smith 四分之一圓）
    const s = Math.min(W,H)/(6 + v%5), cols = Math.ceil(W/s), rows = Math.ceil(H/s); g.lineWidth = s*.16; g.strokeStyle = c; g.lineCap = "butt";
    for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){ const x = i*s, y = j*s; g.beginPath();
      if(r() < .5){ g.arc(x,y,s/2,0,Math.PI/2); g.moveTo(x+s,y+s/2); g.arc(x+s,y+s,s/2,-Math.PI/2,-Math.PI,true); } else { g.arc(x+s,y,s/2,Math.PI/2,Math.PI); g.moveTo(x+s/2,y+s); g.arc(x,y+s,s/2,0,-Math.PI/2,true); } g.stroke(); }
  },
  F02(g, W, H, r, v, c){ // Hankin 法：每條邊中點射出兩條射線，與鄰邊射線相交成星
    const th = (45 + (v%5)*8) * Math.PI/180, s = Math.min(W,H)/(3 + v%3), polys = [];
    if(v % 2){ // 正方形格
      for(let y = -s; y < H+s; y += s) for(let x = -s; x < W+s; x += s) polys.push([[x,y],[x+s,y],[x+s,y+s],[x,y+s]]);
    } else { // 六角形格
      const R = s*.6, hw = R*Math.sqrt(3); for(let row = -1; row*R*1.5 < H+R; row++) for(let col = -1; col*hw < W+hw; col++){ const cx = col*hw + (row%2 ? hw/2 : 0), cy = row*R*1.5; polys.push([...Array(6)].map((_,k) => [cx + R*Math.cos(Math.PI/6 + k*TAU/6), cy + R*Math.sin(Math.PI/6 + k*TAU/6)])); }
    }
    g.strokeStyle = c; g.lineWidth = 1.6;
    for(const P of polys){ const n = P.length, mids = [], dirs = [];
      for(let i = 0; i < n; i++){ const a = P[i], b = P[(i+1)%n], mx = (a[0]+b[0])/2, my = (a[1]+b[1])/2, ex = (b[0]-a[0]), ey = (b[1]-a[1]), l = Math.hypot(ex,ey), ux = ex/l, uy = ey/l, nx = -uy, ny = ux;
        mids.push([mx,my]); dirs.push([[Math.cos(th)*ux + Math.sin(th)*nx, Math.cos(th)*uy + Math.sin(th)*ny], [-Math.cos(th)*ux + Math.sin(th)*nx, -Math.cos(th)*uy + Math.sin(th)*ny]]); }
      for(let i = 0; i < n; i++){ const j = (i+1)%n, p = mids[i], d1 = dirs[i][0], q = mids[j], d2 = dirs[j][1], den = d1[0]*d2[1] - d1[1]*d2[0]; if(Math.abs(den) < 1e-6) continue;
        const t = ((q[0]-p[0])*d2[1] - (q[1]-p[1])*d2[0]) / den, X = [p[0] + d1[0]*t, p[1] + d1[1]*t]; g.beginPath(); g.moveTo(...p); g.lineTo(...X); g.lineTo(...q); g.stroke(); }
    }
  },
  F03(g, W, H, r, v, c){ // TPMS：Gyroid／Schwarz 截面場＋等值線
    const n = 120, m = Math.round(n*H/W), per = 2.5 + (v%3), z = v*.7;
    const fns = [(x,y) => Math.sin(x)*Math.cos(y) + Math.sin(y)*Math.cos(z) + Math.sin(z)*Math.cos(x), (x,y) => Math.cos(x) + Math.cos(y) + Math.cos(z), (x,y) => Math.sin(x)*Math.sin(y)*Math.sin(z) + Math.sin(x)*Math.cos(y)*Math.cos(z) + Math.cos(x)*Math.sin(y)*Math.cos(z) + Math.cos(x)*Math.cos(y)*Math.sin(z)];
    const F = fns[v%3], f = (i,j) => F(i/n*per*TAU, j/n*per*TAU);
    field(g, W, H, n, m, (i,j) => f(i,j) > 0 ? .35 + f(i,j)*.2 : .05, c);
    const S = W/(n-1); g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.beginPath(); contour(n, m, f, 0).forEach(([a,b]) => { g.moveTo(a[0]*S,a[1]*S); g.lineTo(b[0]*S,b[1]*S); }); g.stroke();
  },
  F04(g, W, H, r, v, c){ // 基因演算法：一列一代，形狀逐代逼近目標（圓／星形）
    const G = 7, pop = 8, genes = 16, target = k => v % 2 ? .6 + .35*Math.cos(k/genes*TAU*5) : .85;
    let P = [...Array(pop)].map(() => [...Array(genes)].map(() => .2 + r()*.8));
    const fit = x => -x.reduce((s,gv,k) => s + (gv - target(k))**2, 0), cell = Math.min(W/pop, H/G);
    for(let gen = 0; gen < G; gen++){
      P.sort((a,b) => fit(b) - fit(a));
      P.forEach((x,i) => { const cx = (i+.5)*W/pop, cy = (gen+.5)*H/G, R = cell*.42; g.strokeStyle = i === 0 ? "#fff" : rgba(c, .35 + (1 - i/pop)*.5); g.lineWidth = i === 0 ? 1.6 : 1;
        poly(g, x.map((gv,k) => [cx + Math.cos(k/genes*TAU)*R*gv, cy + Math.sin(k/genes*TAU)*R*gv]), true); g.stroke(); });
      const par = P.slice(0, 3); P = [par[0], ...[...Array(pop-1)].map(() => { const a = par[(r()*3)|0], b = par[(r()*3)|0], cut = (r()*genes)|0; return a.map((gv,k) => (k < cut ? gv : b[k]) + (r() < .25 ? (r()-.5)*.2 : 0)); })];
    }
  },
  F05(g, W, H, r, v, c){ // Dijkstra：格點障礙中的最短路徑（距離場＋路徑）
    const n = 34, m = Math.round(n*H/W), s = W/n, wall = new Uint8Array(n*m), dist = new Float32Array(n*m).fill(Infinity), prev = new Int32Array(n*m).fill(-1);
    for(let i = 0; i < n*m; i++) wall[i] = r() < .3 + (v%3)*.04 ? 1 : 0;
    const S = ((m/2)|0)*n + 1, T = ((m/2)|0)*n + n-2; wall[S] = wall[T] = 0; dist[S] = 0; const Q = [S];
    while(Q.length){ let bi = 0; for(let k = 1; k < Q.length; k++) if(dist[Q[k]] < dist[Q[bi]]) bi = k; const u = Q.splice(bi,1)[0], x = u%n, y = (u/n)|0;
      for(const [dx,dy,w] of [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[-1,1,1.414],[1,-1,1.414],[-1,-1,1.414]]){ const nx = x+dx, ny = y+dy; if(nx < 0 || ny < 0 || nx >= n || ny >= m) continue; const q = ny*n+nx; if(wall[q]) continue; if(dist[u] + w < dist[q]){ if(dist[q] === Infinity) Q.push(q); dist[q] = dist[u] + w; prev[q] = u; } } }
    let mx = 0; dist.forEach(d => { if(d < Infinity) mx = Math.max(mx,d); });
    for(let i = 0; i < n*m; i++){ const x = (i%n)*s, y = ((i/n)|0)*s; if(wall[i]){ g.fillStyle = "#3A3A46"; g.fillRect(x+1,y+1,s-2,s-2); } else if(dist[i] < Infinity){ g.fillStyle = rgba(c, .12 + (1 - dist[i]/mx)*.6); g.fillRect(x+1,y+1,s-2,s-2); } }
    if(prev[T] >= 0){ const path = []; for(let u = T; u >= 0; u = prev[u]) path.push([(u%n + .5)*s, (((u/n)|0) + .5)*s]); g.strokeStyle = "#fff"; g.lineWidth = s*.3; g.lineCap = "round"; g.lineJoin = "round"; poly(g, path); g.stroke(); }
    [[S,"#fff"],[T,c]].forEach(([u,col]) => { g.fillStyle = col; g.beginPath(); g.arc((u%n+.5)*s, (((u/n)|0)+.5)*s, s*.45, 0, TAU); g.fill(); });
  },
  F06(g, W, H, r, v, c){ // 奇異吸子（Clifford），點密度累積
    const Pm = [[-1.4,1.6,1,.7],[1.7,1.7,.6,1.2],[-1.8,-2,-.5,-.9],[1.5,-1.8,1.6,.9],[-1.7,1.3,-.1,-1.21],[-1.3,-1.3,-1.8,-1.9]][v%6], [a,b,cc,d] = Pm;
    const n = Math.ceil(W), m = Math.ceil(H), acc = new Float32Array(n*m); let x = .1, y = .1, mx = 0;
    for(let i = 0; i < 180000; i++){ const nx = Math.sin(a*y) + cc*Math.cos(a*x), ny = Math.sin(b*x) + d*Math.cos(b*y); x = nx; y = ny;
      const px = ((x/(1+Math.abs(cc)) + 1)/2*n*.9 + n*.05)|0, py = ((y/(1+Math.abs(d)) + 1)/2*m*.9 + m*.05)|0; if(px >= 0 && py >= 0 && px < n && py < m){ const k = py*n+px; acc[k]++; if(acc[k] > mx) mx = acc[k]; } }
    field(g, W, H, n, m, (i,j) => Math.log(1 + acc[j*n+i])/Math.log(1 + mx)*1.2, c, .8);
  },
};

// 畫一張：固定比例、深色漸層底、DPR 適配；結果快取成 dataURL，避免重算
const cache = new Map();
window.GEN = GEN;
// 給 assets/art/*.js 用的共用工具
// base(id, v, W, H, c, transparent)：把某個演算法的基本圖畫到離屏 canvas，可再變形、裁切、貼到立面或曲面上
function base(id, v, W, H, c, transparent){
  const off = document.createElement("canvas"); off.width = W; off.height = H; const g = off.getContext("2d");
  if(!transparent){ g.fillStyle = "#15151B"; g.fillRect(0,0,W,H); }
  try { GEN[id] && GEN[id](g, W, H, mk(v*7919 + 17), v, c); } catch(e){ console.warn(id, e); }
  return off;
}
window.GENUTIL = {TAU, mk, vnoise, rgba, rgb, poly, field, contour, GEN, base};
// 每個變形、每個沒有照片的案例的獨立畫法：ART.var[演算法][變形序號]、ART.case[案例編號]
window.ART = window.ART || {var:{}, case:{}};
window.artDraw = function(cv, key, fn, color, ratio, seed){
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.max(120, Math.round(cv.clientWidth || 300)), H = Math.round(W*ratio);
  cv.width = W*dpr; cv.height = H*dpr; cv.style.height = H + "px";
  const g = cv.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0);
  const ck = `art|${key}|${seed||0}|${W}|${H}`;
  if(cache.has(ck)){ g.drawImage(cache.get(ck), 0, 0, W, H); return; }
  const bg = g.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#1C1C24"); bg.addColorStop(1,"#121217"); g.fillStyle = bg; g.fillRect(0,0,W,H);
  let h = 0; for(const ch of key) h = (h*31 + ch.charCodeAt(0)) >>> 0;
  try { g.save(); fn(g, W, H, mk(h + (seed||0)*7919), color, window.GENUTIL); g.restore(); } catch(e){ console.warn("art", key, e); }
  const snap = document.createElement("canvas"); snap.width = cv.width; snap.height = cv.height; snap.getContext("2d").drawImage(cv, 0, 0); cache.set(ck, snap);
};
window.genDraw = function(cv, id, v, fam, color, ratio){
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.max(120, Math.round(cv.clientWidth || 300)), H = Math.round(W*ratio);
  cv.width = W*dpr; cv.height = H*dpr; cv.style.height = H + "px";
  const g = cv.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0);
  const key = `${id}|${v}|${W}|${H}`;
  if(cache.has(key)){ g.drawImage(cache.get(key), 0, 0, W, H); return; }
  const bg = g.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#1C1C24"); bg.addColorStop(1,"#121217"); g.fillStyle = bg; g.fillRect(0,0,W,H);
  try { GEN[id] && GEN[id](g, W, H, mk(v*7919 + id.charCodeAt(0)*31 + +id.slice(1)), v, color); } catch(e){ console.warn(id, e); }
  const snap = document.createElement("canvas"); snap.width = cv.width; snap.height = cv.height; snap.getContext("2d").drawImage(cv, 0, 0); cache.set(key, snap);
};
})();
