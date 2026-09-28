/* C02 生命遊戲（細胞自動機）：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
const TAU = Math.PI*2;

/* ---------- 共用小工具 ---------- */
// 家族色明暗：k<1 變暗、k>1 往白色推
function sh(c, k, a){ const [R,G,B] = U.rgb(c), f = v => Math.round(k >= 1 ? v + (255-v)*Math.min(1,k-1) : v*k); return `rgba(${f(R)},${f(G)},${f(B)},${a == null ? 1 : a})`; }
// "36" → 查表陣列（0–8 個鄰居）
function rule(str){ const a = new Uint8Array(27); for(const ch of str) a[+ch] = 1; return a; }
function seed(n, m, r, d){ const s = new Uint8Array(n*m); for(let i = 0; i < n*m; i++) s[i] = r() < d ? 1 : 0; return s; }
// 一代：B/S 規則，wrap 為環面邊界，mask 為可活格（null＝全部可活）
function step(s, n, m, B, S, wrap, mask){
  const t = new Uint8Array(n*m);
  for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){
    const i = y*n + x; if(mask && !mask[i]) continue;
    let k = 0;
    for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){
      if(!dx && !dy) continue; let xx = x+dx, yy = y+dy;
      if(wrap){ xx = (xx+n)%n; yy = (yy+m)%m; } else if(xx < 0 || yy < 0 || xx >= n || yy >= m) continue;
      k += s[yy*n+xx];
    }
    t[i] = s[i] ? S[k] : B[k];
  }
  return t;
}
function run(s, n, m, B, S, k, wrap = true, mask = null){ for(let i = 0; i < k; i++) s = step(s, n, m, B, S, wrap, mask); return s; }
const LIFE_B = rule("3"), LIFE_S = rule("23");
// 一維 Wolfram 規則：回傳 rows 列、寬 w 的 0/1 陣列（從中央單格開始）
function wolfram(rn, w, rows, r){
  const out = []; let row = new Uint8Array(w);
  if(r) for(let i = 0; i < w; i++) row[i] = r() < .5 ? 1 : 0; else row[w>>1] = 1;
  for(let t = 0; t < rows; t++){ out.push(row); const nx = new Uint8Array(w);
    for(let i = 0; i < w; i++){ const idx = (row[(i-1+w)%w]<<2) | (row[i]<<1) | row[(i+1)%w]; nx[i] = (rn >> idx) & 1; }
    row = nx; }
  return out;
}
// 投影：a、b 為 x、y 軸在畫面上的方向，z 往上
function proj(ox, oy, u, ax, ay, bx, by, zk){ return (x,y,z) => [ox + (x*ax + y*bx)*u, oy + (x*ay + y*by)*u - z*u*(zk||1)]; }
const ISO = [.866, .5, -.866, .5];
// 單位方塊（畫頂面與兩個朝向觀者的側面）
function box(g, P, x, y, z, c, a, dz, line){
  dz = dz || 1; a = a == null ? 1 : a;
  const q = (...p) => { g.beginPath(); p.forEach((v,i) => i ? g.lineTo(v[0],v[1]) : g.moveTo(v[0],v[1])); g.closePath(); };
  q(P(x+1,y,z), P(x+1,y+1,z), P(x+1,y+1,z+dz), P(x+1,y,z+dz)); g.fillStyle = sh(c,.62,a); g.fill(); if(line){ g.strokeStyle = line; g.stroke(); }
  q(P(x,y+1,z), P(x+1,y+1,z), P(x+1,y+1,z+dz), P(x,y+1,z+dz)); g.fillStyle = sh(c,.42,a); g.fill(); if(line){ g.strokeStyle = line; g.stroke(); }
  q(P(x,y,z+dz), P(x+1,y,z+dz), P(x+1,y+1,z+dz), P(x,y+1,z+dz)); g.fillStyle = sh(c,1.3,a); g.fill(); if(line){ g.strokeStyle = line; g.stroke(); }
}
// 依深度（x+y+z）排序後畫一堆體素
function voxels(g, P, list, c, a, line){ list.sort((p,q) => (p[0]+p[1]+p[2]) - (q[0]+q[1]+q[2])); list.forEach(v => box(g, P, v[0], v[1], v[2], v[3] || c, a, 1, line)); }
function arrow(g, x1, y1, x2, y2, col){ g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
  const a = Math.atan2(y2-y1, x2-x1); g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2-7*Math.cos(a-.4), y2-7*Math.sin(a-.4)); g.lineTo(x2-7*Math.cos(a+.4), y2-7*Math.sin(a+.4)); g.closePath(); g.fill(); }
function rrect(g, x, y, w, h, rad){ g.beginPath(); g.moveTo(x+rad,y); g.arcTo(x+w,y,x+w,y+h,rad); g.arcTo(x+w,y+h,x,y+h,rad); g.arcTo(x,y+h,x,y,rad); g.arcTo(x,y,x+w,y,rad); g.closePath(); }
// 3×3 鄰域小圖示（規則徽章）
function glyph(g, x, y, s, bits, c){ for(let j = 0; j < 3; j++) for(let i = 0; i < 3; i++){ g.fillStyle = bits[j*3+i] ? c : "rgba(255,255,255,.12)"; g.fillRect(x+i*s, y+j*s, s-1, s-1); } }
const ACC = "#E8553F"; // 少量第二色點綴

/* ================= 變形 ================= */
ART.var["C02"] = [
  // V01 改規則字串：三種 B/S 規則並排的平面圖（HighLife／Day & Night／迷宮）
  function(g, W, H, r, c){
    const rules = [["36","23"],["3678","34678"],["3","12345"]], pad = W*.05, pw = (W - pad*4)/3, n = 16, cs = pw/n, m = Math.floor((H - pad*2 - 26)/cs);
    rules.forEach(([b,s], k) => {
      const d = k === 1 ? .5 : k === 2 ? .12 : .35; let st = seed(n, m, r, d);
      if(k === 2){ st = new Uint8Array(n*m); for(let i = 0; i < 6; i++) st[((m/2 + (r()*6-3))|0)*n + ((n/2 + r()*6-3)|0)] = 1; }
      st = run(st, n, m, rule(b), rule(s), k === 2 ? 40 : 30);
      const x0 = pad + k*(pw+pad), y0 = pad;
      g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.strokeRect(x0-.5, y0-.5, pw+1, m*cs+1);
      for(let y = 0; y < m; y++) for(let x = 0; x < n; x++) if(st[y*n+x]){ g.fillStyle = k === 1 ? sh(c,1.35) : k === 2 ? sh(c,.9) : c; g.fillRect(x0 + x*cs, y0 + y*cs, cs-.6, cs-.6); }
      // 規則刻度：上排 B、下排 S（0–8）
      const ty = y0 + m*cs + 8, tw = pw/9;
      for(let i = 0; i < 9; i++){ g.fillStyle = b.includes(i) ? ACC : "rgba(255,255,255,.12)"; g.fillRect(x0 + i*tw, ty, tw-1.5, 5);
        g.fillStyle = s.includes(i) ? "#fff" : "rgba(255,255,255,.12)"; g.fillRect(x0 + i*tw, ty+8, tw-1.5, 5); }
    });
  },
  // V02 一維 Wolfram 規則：Rule 30 立面穿孔板（立面圖）
  function(g, W, H, r, c){
    const fx = W*.1, fw = W*.8, fy = H*.1, fh = H*.76, cols = 37, cs = fw/cols, rows = Math.floor(fh/cs), rn = [30, 90, 110][(r()*3)|0];
    const P = wolfram(rn, cols, rows);
    g.fillStyle = sh(c,.55); g.fillRect(fx, fy, fw, rows*cs);
    for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
      const on = P[j][i]; g.fillStyle = on ? "#0F0F14" : sh(c,1.15,.9);
      g.beginPath(); g.arc(fx + (i+.5)*cs, fy + (j+.5)*cs, on ? cs*.42 : cs*.12, 0, TAU); g.fill();
    }
    // 樓板線與屋頂、地面
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1;
    for(let f = 1; f < 4; f++){ const y = fy + rows*cs*f/4; g.beginPath(); g.moveTo(fx-4, y); g.lineTo(fx+fw+4, y); g.stroke(); }
    g.lineWidth = 3; g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(fx-10, fy); g.lineTo(fx+fw+10, fy); g.stroke();
    const gy = fy + rows*cs; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();
    g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(0, gy, W, H-gy);
    g.fillStyle = "#0F0F14"; g.fillRect(fx + fw*.44, gy - cs*5, fw*.12, cs*5);
  },
  // V03 真 3D 生命遊戲：線框立方空間中的體素團塊
  function(g, W, H, r, c){
    const N = 12, idx = (x,y,z) => (z*N+y)*N+x; let s = new Uint8Array(N*N*N);
    for(let z = 3; z < 9; z++) for(let y = 3; y < 9; y++) for(let x = 3; x < 9; x++) if(r() < .42) s[idx(x,y,z)] = 1;
    const B = rule("5"), S = [0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    for(let it = 0; it < 2; it++){ const t = new Uint8Array(N*N*N); let cnt = 0;
      for(let z = 0; z < N; z++) for(let y = 0; y < N; y++) for(let x = 0; x < N; x++){ let k = 0;
        for(let dz = -1; dz <= 1; dz++) for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){ if(!dx&&!dy&&!dz) continue; const xx = x+dx, yy = y+dy, zz = z+dz; if(xx<0||yy<0||zz<0||xx>=N||yy>=N||zz>=N) continue; k += s[idx(xx,yy,zz)]; }
        const v = s[idx(x,y,z)] ? S[k] : B[k]; t[idx(x,y,z)] = v; cnt += v; }
      if(cnt > 20) s = t; }
    const u = Math.min(W/(N*1.95), H/(N*2.05)), P = proj(W/2, H/2 - N*u*.5, u, ...ISO);
    // 外框立方體
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.setLineDash([3,3]);
    const E = [[0,0,0,N,0,0],[0,0,0,0,N,0],[N,0,0,N,N,0],[0,N,0,N,N,0],[0,0,N,N,0,N],[0,0,N,0,N,N],[N,0,N,N,N,N],[0,N,N,N,N,N],[0,0,0,0,0,N],[N,0,0,N,0,N],[0,N,0,0,N,N],[N,N,0,N,N,N]];
    E.forEach(e => { const a = P(e[0],e[1],e[2]), b = P(e[3],e[4],e[5]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); });
    g.setLineDash([]);
    const L = []; for(let z = 0; z < N; z++) for(let y = 0; y < N; y++) for(let x = 0; x < N; x++) if(s[idx(x,y,z)]) L.push([x,y,z]);
    voxels(g, P, L, c, 1, "rgba(0,0,0,.35)");
  },
  // V04 年齡累積：斜投影的浮雕板，柱高＝存活世代數
  function(g, W, H, r, c){
    const n = 22; let s = seed(n, n, r, .35); const age = new Float32Array(n*n);
    for(let k = 0; k < 30; k++){ s = step(s, n, n, LIFE_B, LIFE_S, true); for(let i = 0; i < n*n; i++) age[i] = s[i] ? age[i] + 1 : age[i]*.6; }
    let mx = 1; for(const a of age) mx = Math.max(mx, a);
    const u = W/(n*1.25), P = proj(W*.08, H*.42, u, 1, 0, .38, .32, 1);
    // 底板
    g.fillStyle = "rgba(255,255,255,.06)"; U.poly(g, [P(0,0,0),P(n,0,0),P(n,n,0),P(0,n,0)], true); g.fill();
    for(let y = 0; y < n; y++) for(let x = n-1; x >= 0; x--){
      const h = age[y*n+x]/mx*5; if(h < .15) continue; const t = h/5;
      const q = (...p) => { g.beginPath(); p.forEach((v,i) => i ? g.lineTo(v[0],v[1]) : g.moveTo(v[0],v[1])); g.closePath(); };
      q(P(x,y+.9,0),P(x+.9,y+.9,0),P(x+.9,y+.9,h),P(x,y+.9,h)); g.fillStyle = sh(c,.35+t*.3); g.fill();
      q(P(x,y,0),P(x,y+.9,0),P(x,y+.9,h),P(x,y,h)); g.fillStyle = sh(c,.5+t*.3); g.fill();
      q(P(x,y,h),P(x+.9,y,h),P(x+.9,y+.9,h),P(x,y+.9,h)); g.fillStyle = sh(c,.9+t*.6); g.fill();
    }
  },
  // V05 影像當初始狀態：左為灰階影像，右為從影像亮度長出的活格
  function(g, W, H, r, c){
    const n = 30, m = Math.round(n*H/(W*.45)), nz = U.vnoise((r()*1e6)|0), cx = n*.5, cy = m*.45;
    const img = (x,y) => { const d = Math.hypot((x-cx)/n, (y-cy)/m); return Math.max(0, Math.min(1, 1 - d*2.2 + (nz(x*.18,y*.18)-.5)*.7)); };
    const pw = W*.44, cs = pw/n, y0 = (H - m*cs)/2;
    for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){ const v = img(x,y); g.fillStyle = `rgba(255,255,255,${.05 + v*.8})`; g.fillRect(W*.04 + x*cs, y0 + y*cs, cs+.3, cs+.3); }
    let s = new Uint8Array(n*m); for(let y = 0; y < m; y++) for(let x = 0; x < n; x++) s[y*n+x] = img(x,y) > .45 ? (r() < .7 ? 1 : 0) : 0;
    const s0 = s.slice(); s = run(s, n, m, LIFE_B, LIFE_S, 6, false);
    const x1 = W*.52;
    for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){
      if(s0[y*n+x]){ g.fillStyle = sh(c,.5,.5); g.fillRect(x1 + x*cs, y0 + y*cs, cs-.5, cs-.5); }
      if(s[y*n+x]){ g.fillStyle = sh(c,1.2); g.fillRect(x1 + x*cs + cs*.15, y0 + y*cs + cs*.15, cs*.7, cs*.7); }
    }
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(W*.04, y0, pw, m*cs); g.strokeRect(x1, y0, pw, m*cs);
    arrow(g, W*.44, H*.06 + 4, W*.56, H*.06 + 4, ACC);
  },
  // V06 曲線邊界遮罩：不規則基地紅線內才可生長（平面圖）
  function(g, W, H, r, c){
    const n = 44, m = Math.round(n*H/W), cs = W/n, nz = U.vnoise((r()*1e6)|0), cx = n/2, cy = m/2;
    const R = a => Math.min(n,m)*(.28 + .2*nz(Math.cos(a)*1.3+5, Math.sin(a)*1.3+5));
    const mask = new Uint8Array(n*m); for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){ const a = Math.atan2(y+.5-cy, x+.5-cx); mask[y*n+x] = Math.hypot(x+.5-cx, y+.5-cy) < R(a) ? 1 : 0; }
    let s = seed(n, m, r, .4); for(let i = 0; i < n*m; i++) s[i] &= mask[i];
    s = run(s, n, m, LIFE_B, LIFE_S, 18, false, mask);
    // 外部格點
    g.fillStyle = "rgba(255,255,255,.14)"; for(let y = 0; y < m; y++) for(let x = 0; x < n; x++) if(!mask[y*n+x]) g.fillRect(x*cs + cs/2 - .7, y*cs + cs/2 - .7, 1.4, 1.4);
    g.fillStyle = U.rgba(c,.12); for(let i = 0; i < n*m; i++) if(mask[i]) g.fillRect((i%n)*cs, ((i/n)|0)*cs, cs, cs);
    g.fillStyle = c; for(let i = 0; i < n*m; i++) if(s[i]) g.fillRect((i%n)*cs + .6, ((i/n)|0)*cs + .6, cs - 1.2, cs - 1.2);
    // 基地紅線
    g.strokeStyle = ACC; g.lineWidth = 1.8; g.setLineDash([7,3,2,3]); g.beginPath();
    for(let k = 0; k <= 90; k++){ const a = k/90*TAU, rr = R(a); const px = (cx + Math.cos(a)*rr)*cs, py = (cy + Math.sin(a)*rr)*cs; k ? g.lineTo(px,py) : g.moveTo(px,py); }
    g.stroke(); g.setLineDash([]);
  },
  // V07 結構支撐約束：層層退縮的剖立面（沒有懸挑）
  function(g, W, H, r, c){
    const n = 34, d = 10, layers = 16; let s = seed(n, d, r, .85); for(let x = 0; x < n; x++) if(x < 3 || x > n-4) for(let y = 0; y < d; y++) s[y*n+x] = 0;
    const cnt = [];
    for(let z = 0; z < layers; z++){
      const col = new Array(n).fill(0); for(let y = 0; y < d; y++) for(let x = 0; x < n; x++) col[x] += s[y*n+x]; cnt.push(col);
      // 上一層要有支撐：本格與左右鄰都活著才可能留下，再以生命遊戲存活規則或機率篩掉一部分
      const t = step(s, n, d, LIFE_B, rule("2345678"), false);
      for(let i = 0; i < n*d; i++){ const x = i%n; t[i] = (t[i] | (r() < .75 ? 1 : 0)) & s[i] & (x > 0 ? s[i-1] : 0) & (x < n-1 ? s[i+1] : 0); }
      s = t;
    }
    const cs = W*.84/n, ch = Math.min(cs*1.1, H*.78/layers), x0 = W*.08, gy = H*.88;
    g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(0, gy, W, H-gy);
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; for(let k = -20; k < W/6; k++){ g.beginPath(); g.moveTo(k*8, H); g.lineTo(k*8 + (H-gy), gy); g.stroke(); }
    for(let z = 0; z < layers; z++) for(let x = 0; x < n; x++){ const v = cnt[z][x]; if(!v) continue;
      g.fillStyle = sh(c, .45 + v/d*.95); g.fillRect(x0 + x*cs, gy - (z+1)*ch, cs + .4, ch - 1); }
    g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();
    // 重力箭頭
    for(let k = 0; k < 3; k++) arrow(g, W*(.2 + k*.3), H*.05, W*(.2 + k*.3), H*.13, "rgba(255,255,255,.4)");
  },
  // V08 吸引子調整規則：靠近吸引點密實、遠處稀疏的立面開孔
  function(g, W, H, r, c){
    const n = 30, m = Math.round(n*H/W), cs = W/n, ax = n*(.3 + r()*.4), ay = m*(.3 + r()*.4), D = Math.hypot(n, m)*.55;
    const glow = g.createRadialGradient(ax*cs, ay*cs, 0, ax*cs, ay*cs, D*cs*.8); glow.addColorStop(0, U.rgba(c,.45)); glow.addColorStop(1, U.rgba(c,0)); g.fillStyle = glow; g.fillRect(0,0,W,H);
    let s = new Uint8Array(n*m); const dist = new Float32Array(n*m);
    for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){ const t = Math.min(1, Math.hypot(x-ax, y-ay)/D); dist[y*n+x] = t; s[y*n+x] = r() < .6 - t*.5 ? 1 : 0; }
    const Bn = rule("3"), Sn = rule("12345"), Bf = rule("36"), Sf = rule("2");
    for(let k = 0; k < 8; k++){ const a = step(s, n, m, Bn, Sn, false), b = step(s, n, m, Bf, Sf, false); for(let i = 0; i < n*m; i++) s[i] = dist[i] < .45 ? a[i] : b[i]; }
    for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){ const t = dist[y*n+x], rad = cs*(.46 - t*.3);
      g.fillStyle = s[y*n+x] ? sh(c, 1.5 - t*.7) : "rgba(255,255,255,.08)"; g.beginPath(); g.arc((x+.5)*cs, (y+.5)*cs, s[y*n+x] ? rad : 1.2, 0, TAU); g.fill(); }
    g.strokeStyle = "rgba(255,255,255,.35)"; g.setLineDash([2,4]); g.lineWidth = 1;
    for(let k = 1; k <= 4; k++){ g.beginPath(); g.arc(ax*cs, ay*cs, k*D*cs*.2, 0, TAU); g.stroke(); }
    g.setLineDash([]); g.fillStyle = ACC; g.beginPath(); g.arc(ax*cs, ay*cs, 4, 0, TAU); g.fill();
    g.strokeStyle = ACC; g.beginPath(); g.arc(ax*cs, ay*cs, 8, 0, TAU); g.stroke();
  },
  // V09 體素合併與可製造輸出：逐層輪廓排版在雷切板上
  function(g, W, H, r, c){
    const n = 14; let s = seed(n, n, r, .45); for(let i = 0; i < n*n; i++){ const x = i%n, y = (i/n)|0; if(x < 2 || y < 2 || x > n-3 || y > n-3) s[i] = 0; }
    s = run(s, n, n, LIFE_B, rule("2345"), 2, false);
    const bx = W*.05, by = H*.06, bw = W*.9, bh = H*.88;
    g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(bx, by, bw, bh); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.strokeRect(bx, by, bw, bh);
    const cols = 3, rows = 3, cw = bw/cols, chh = bh/rows, cs = Math.min(cw, chh)*.8/n;
    for(let k = 0; k < cols*rows; k++){
      const ox = bx + (k%cols)*cw + (cw - n*cs)/2, oy = by + ((k/cols)|0)*chh + (chh - n*cs)/2;
      g.strokeStyle = k === 0 ? "#fff" : c; g.lineWidth = 1.2; g.beginPath();
      const at = (x,y) => x >= 0 && y >= 0 && x < n && y < n && s[y*n+x];
      for(let y = 0; y <= n; y++) for(let x = 0; x <= n; x++){
        if(at(x,y) !== at(x,y-1)){ g.moveTo(ox + x*cs, oy + y*cs); g.lineTo(ox + (x+1)*cs, oy + y*cs); }
        if(at(x,y) !== at(x-1,y)){ g.moveTo(ox + x*cs, oy + y*cs); g.lineTo(ox + x*cs, oy + (y+1)*cs); }
      }
      g.stroke();
      // 定位孔與層號刻點
      g.strokeStyle = ACC; g.lineWidth = 1; g.beginPath(); g.arc(ox - 5, oy - 5, 2.2, 0, TAU); g.stroke(); g.beginPath(); g.arc(ox + n*cs + 5, oy + n*cs + 5, 2.2, 0, TAU); g.stroke();
      g.fillStyle = "rgba(255,255,255,.6)"; for(let t = 0; t <= k; t++) g.fillRect(ox + t*4, oy + n*cs + 4, 2, 2);
      s = step(s, n, n, LIFE_B, rule("2345"), false);
    }
  },
  // V10 曲面上的生命遊戲：包覆在圓柱塔上的立面圖樣
  function(g, W, H, r, c){
    const n = 56, m = 26; let s = run(seed(n, m, r, .35), n, m, LIFE_B, LIFE_S, 12, true);
    const cx = W/2, R = W*.3, top = H*.12, bot = H*.86, e = R*.28, rowH = (bot-top)/m;
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(cx + R*.3, bot + e*.3, R*1.3, e*1.1, 0, 0, TAU); g.fill();
    for(let i = 0; i < n; i++){
      const a0 = i/n*TAU - Math.PI/2, a1 = (i+1)/n*TAU - Math.PI/2, am = (a0+a1)/2;
      const vis = Math.sin(am); if(vis < 0) continue;
      const x0 = cx + Math.cos(a0)*R, x1 = cx + Math.cos(a1)*R, y0o = Math.sin(a0)*e, y1o = Math.sin(a1)*e, lit = .45 + .75*Math.max(0, Math.cos(am - 1.1));
      for(let j = 0; j < m; j++){
        const yA = top + j*rowH, on = s[j*n+i];
        g.beginPath(); g.moveTo(x0, yA + y0o); g.lineTo(x1, yA + y1o); g.lineTo(x1, yA + rowH + y1o); g.lineTo(x0, yA + rowH + y0o); g.closePath();
        g.fillStyle = on ? sh(c, lit + .2) : `rgba(255,255,255,${.03 + lit*.05})`; g.fill();
        g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = .5; g.stroke();
      }
    }
    g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.3;
    g.beginPath(); g.ellipse(cx, top, R, e, 0, 0, TAU); g.stroke();
    g.beginPath(); g.ellipse(cx, bot, R, e, 0, 0, Math.PI); g.stroke();
    g.beginPath(); g.moveTo(cx-R, top); g.lineTo(cx-R, bot); g.moveTo(cx+R, top); g.lineTo(cx+R, bot); g.stroke();
  },
  // V11 Timer 動畫化：六格影格＋時間軸，看滑翔機移動
  function(g, W, H, r, c){
    const n = 10; let s = new Uint8Array(n*n); [[1,0],[2,1],[0,2],[1,2],[2,2]].forEach(([x,y]) => s[(y+1)*n + x+1] = 1); [[6,7],[7,7],[8,7]].forEach(([x,y]) => s[y*n+x] = 1);
    const cols = 3, rows = 2, pad = W*.05, fw = (W - pad*(cols+1))/cols, cs = fw/n, fh = n*cs, y0 = (H - rows*fh - pad*(rows-1) - 30)/2;
    for(let k = 0; k < cols*rows; k++){
      const ox = pad + (k%cols)*(fw+pad), oy = y0 + ((k/cols)|0)*(fh+pad), cur = k === 4;
      g.fillStyle = cur ? U.rgba(c,.18) : "rgba(255,255,255,.04)"; g.fillRect(ox, oy, fw, fh);
      g.strokeStyle = cur ? "#fff" : "rgba(255,255,255,.2)"; g.lineWidth = cur ? 2 : 1; g.strokeRect(ox, oy, fw, fh);
      for(let i = 0; i < n*n; i++) if(s[i]){ g.fillStyle = cur ? "#fff" : c; g.fillRect(ox + (i%n)*cs + 1, oy + ((i/n)|0)*cs + 1, cs-2, cs-2); }
      s = step(s, n, n, LIFE_B, LIFE_S, true);
    }
    const ty = y0 + rows*fh + pad*(rows-1) + 18, tx0 = pad + 20, tx1 = W - pad;
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(pad, ty-7); g.lineTo(pad+12, ty); g.lineTo(pad, ty+7); g.closePath(); g.fill();
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 3; g.beginPath(); g.moveTo(tx0, ty); g.lineTo(tx1, ty); g.stroke();
    const px = tx0 + (tx1-tx0)*.72; g.strokeStyle = c; g.beginPath(); g.moveTo(tx0, ty); g.lineTo(px, ty); g.stroke();
    for(let k = 0; k <= 10; k++){ g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(tx0 + (tx1-tx0)*k/10, ty + 5, 1, 4); }
    g.fillStyle = ACC; g.beginPath(); g.arc(px, ty, 5, 0, TAU); g.fill();
  },
  // V12 連續狀態（Lenia）：平滑的環狀「生物」場與等值線
  function(g, W, H, r, c){
    const n = 110, m = Math.round(n*H/W), bl = [];
    for(let k = 0; k < 3; k++) bl.push({x: n*(.2 + r()*.6), y: m*(.2 + r()*.6), R: 7 + r()*6, d: r()*TAU});
    const f = (i,j) => { let v = 0; for(const b of bl){ for(let t = 0; t < 3; t++){ // 本體與兩個殘影
        const bx = b.x - Math.cos(b.d)*t*b.R*.9, by = b.y - Math.sin(b.d)*t*b.R*.9, w = t ? .25/t : 1;
        const dx = i-bx, dy = j-by, d = Math.hypot(dx,dy), a = Math.atan2(dy,dx);
        v += w*(Math.exp(-((d - b.R*.7)**2)/(b.R*b.R*.08))*(.55 + .45*Math.cos(a - b.d)) + .6*Math.exp(-(d*d)/(b.R*b.R*.06))); } }
      return v; };
    const F = new Float32Array(n*m); for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) F[j*n+i] = f(i,j);
    U.field(g, W, H, n, m, (i,j) => F[j*n+i]*.9, c, .9);
    const S = W/(n-1), look = (i,j) => F[j*n+i];
    [.25,.5,.8].forEach((iso,k) => { g.strokeStyle = `rgba(255,255,255,${.2 + k*.2})`; g.lineWidth = .9; g.beginPath(); U.contour(n, m, look, iso).forEach(([a,b]) => { g.moveTo(a[0]*S, a[1]*S); g.lineTo(b[0]*S, b[1]*S); }); g.stroke(); });
  },
];

/* ================= 沒有照片的案例 ================= */

// C02-01 Cambridge North：Rule 30 旋轉 45° 的穿孔鋁板立面（透視）
ART.case["C02-01"] = function(g, W, H, r, c){
  const T = 90, P = wolfram(30, 2*T+1, T);
  const val = (u,v) => { const t = u + v, x = v - u; if(t < 0 || t >= T) return 0; const i = T + x - T/2 + 20; return i >= 0 && i < 2*T+1 ? P[t|0][i|0] : 0; };
  const L = [W*.04, H*.2, H*.86], Rr = [W*.97, H*.36, H*.7]; // 近端與遠端的上下緣
  const cols = 60, rows = 24, pers = u => u/(u + (1-u)*2.1);
  const pt = (u,v) => { const k = pers(u), x = L[0] + (Rr[0]-L[0])*k, yt = L[1] + (Rr[1]-L[1])*k, yb = L[2] + (Rr[2]-L[2])*k; return [x, yt + (yb-yt)*v]; };
  g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(0, H*.78, W, H*.22);
  for(let i = 0; i < cols; i++) for(let j = 0; j < rows; j++){
    const a = pt(i/cols, j/rows), b = pt((i+1)/cols, (j+1)/rows), on = val(i*.8, j*.8 + 6);
    g.fillStyle = sh(c, .6 + (1 - i/cols)*.35); g.fillRect(a[0], a[1], b[0]-a[0] + .3, b[1]-a[1] + .3);
    if(on){ g.fillStyle = "rgba(255,245,215,.9)"; g.beginPath(); g.arc((a[0]+b[0])/2, (a[1]+b[1])/2, Math.max(.6, (b[0]-a[0])*.38), 0, TAU); g.fill(); }
  }
  // 屋頂挑簷與底部玻璃帶
  const t0 = pt(0,0), t1 = pt(1,0), b0 = pt(0,1), b1 = pt(1,1);
  g.strokeStyle = "#fff"; g.lineWidth = 3; g.beginPath(); g.moveTo(t0[0]-6, t0[1]-4); g.lineTo(t1[0], t1[1]-1); g.stroke();
  g.fillStyle = "rgba(20,20,26,.9)"; g.beginPath(); g.moveTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1]); g.lineTo(b1[0], b1[1] + H*.04); g.lineTo(b0[0], b0[1] + H*.1); g.closePath(); g.fill();
  g.strokeStyle = U.rgba(c,.8); g.lineWidth = 1; for(let k = 0; k < 14; k++){ const u = k/14, p = pt(u,1), q = pers(u); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0], p[1] + H*(.1 - .06*q)); g.stroke(); }
};
ART.case["C02-01"].ratio = .75;

// C02-02 Metallic Lace：依造訪次數換成圓、方、菱、八角、十字、星的四向對稱裝飾
ART.case["C02-02"] = function(g, W, H, r, c){
  const q = 8; let s = seed(q, q, r, .45); const vis = new Float32Array(q*q);
  for(let k = 0; k < 14; k++){ s = step(s, q, q, LIFE_B, LIFE_S, true); for(let i = 0; i < q*q; i++) vis[i] += s[i]; }
  let mx = 1; for(const v of vis) mx = Math.max(mx, v);
  const N = q*2, cs = Math.min(W,H)*.9/N, ox = (W - N*cs)/2, oy = (H - N*cs)/2;
  const shape = (x, y, s2, kind) => { g.beginPath();
    if(kind === 0) g.arc(x, y, s2, 0, TAU);
    else if(kind === 1) g.rect(x-s2, y-s2, s2*2, s2*2);
    else if(kind === 2){ g.moveTo(x, y-s2); g.lineTo(x+s2, y); g.lineTo(x, y+s2); g.lineTo(x-s2, y); g.closePath(); }
    else if(kind === 3){ for(let k = 0; k < 8; k++){ const a = k/8*TAU + Math.PI/8; g.lineTo(x + Math.cos(a)*s2, y + Math.sin(a)*s2); } g.closePath(); }
    else if(kind === 4){ const w = s2*.38; g.rect(x-s2, y-w, s2*2, w*2); g.rect(x-w, y-s2, w*2, s2*2); }
    else { for(let k = 0; k < 16; k++){ const a = k/16*TAU, rr = k%2 ? s2*.5 : s2; g.lineTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr); } g.closePath(); }
  };
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(ox - 4, oy - 4, N*cs + 8, N*cs + 8); g.strokeRect(ox - 8, oy - 8, N*cs + 16, N*cs + 16);
  for(let y = 0; y < N; y++) for(let x = 0; x < N; x++){
    const qx = x < q ? x : N-1-x, qy = y < q ? y : N-1-y, v = vis[qy*q+qx]/mx; if(v < .05) continue;
    const kind = Math.min(5, (v*6)|0), px = ox + (x+.5)*cs, py = oy + (y+.5)*cs, sz = cs*(.2 + v*.3);
    const gr = g.createLinearGradient(px-sz, py-sz, px+sz, py+sz); gr.addColorStop(0, "#F2F4F8"); gr.addColorStop(1, sh(c,.8));
    shape(px, py, sz, kind); g.fillStyle = gr; g.fill("evenodd"); g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = .6; g.stroke();
  }
};
ART.case["C02-02"].ratio = 1;

// C02-03 CA 量體詮釋：地面上的塔狀體素量體＋樓板線＋陰影（二等角）
ART.case["C02-03"] = function(g, W, H, r, c){
  const n = 9, floors = 11; let s = seed(n, n, r, .55); const L = [];
  for(let z = 0; z < floors; z++){ for(let i = 0; i < n*n; i++) if(s[i]) L.push([i%n, (i/n)|0, z]); const t = step(s, n, n, LIFE_B, rule("2345"), false); for(let i = 0; i < n*n; i++) t[i] &= s[i] | (r() < .1 ? 1 : 0); s = t; }
  const u = Math.min(W/(n*1.6), H/(n*.9 + floors*1.05)), P = proj(W*.42, H*.88 - n*u*.75, u, .94, .34, -.5, .87, 1);
  // 地面網格與陰影
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1;
  for(let k = -3; k <= n+3; k++){ let a = P(k,-3,0), b = P(k,n+3,0); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); a = P(-3,k,0); b = P(n+3,k,0); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
  g.fillStyle = "rgba(0,0,0,.4)"; L.forEach(([x,y,z]) => { if(z) return; U.poly(g, [P(x+1,y,0),P(x+3,y+1,0),P(x+3,y+2,0),P(x+1,y+1,0)], true); g.fill(); });
  voxels(g, P, L, c, 1, "rgba(255,255,255,.18)");
  // 人尺度
  const hp = P(-1.5, n*.5, 0); g.fillStyle = "#fff"; g.fillRect(hp[0]-1, hp[1] - u*.6, 2, u*.6); g.beginPath(); g.arc(hp[0], hp[1] - u*.7, 1.8, 0, TAU); g.fill();
};
ART.case["C02-03"].ratio = 1.3;

// C02-04 荷蘭高密度住宅：單元立面，採光狀態（光線追到的單元較亮），空格是陽台
ART.case["C02-04"] = function(g, W, H, r, c){
  const n = 14, m = 16; let s = seed(n, m, r, .7); s = run(s, n, m, rule("3"), rule("2345678"), 3, false);
  for(let x = 0; x < n; x++) s[(m-1)*n + x] = 1;
  const x0 = W*.12, cw = W*.8/n, chh = H*.72/m, y0 = H*.2;
  // 太陽與光線
  const sx = W*.06, sy = H*.06; g.fillStyle = "#FFD27A"; g.beginPath(); g.arc(sx, sy, 9, 0, TAU); g.fill();
  g.strokeStyle = "rgba(255,210,122,.18)"; g.lineWidth = 1; for(let k = 0; k < 9; k++){ g.beginPath(); g.moveTo(sx, sy); g.lineTo(W, sy + (k+1)*H*.12); g.stroke(); }
  for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){
    const px = x0 + x*cw, py = y0 + y*chh;
    if(!s[y*n+x]){ g.strokeStyle = "rgba(255,255,255,.18)"; g.strokeRect(px + .5, py + .5, cw - 1, chh - 1); continue; }
    // 往太陽方向追：遇到上方的實體單元就被遮
    let lit = 1; for(let k = 1; k < 8; k++){ const xx = x - k, yy = y - k; if(xx < 0 || yy < 0) break; if(s[yy*n+xx]) lit -= .22; }
    lit = Math.max(.15, lit);
    g.fillStyle = sh(c, .35 + lit*.6); g.fillRect(px, py, cw - 1, chh - 1);
    g.fillStyle = `rgba(255,236,190,${.15 + lit*.7})`; g.fillRect(px + cw*.2, py + chh*.25, cw*.25, chh*.5); g.fillRect(px + cw*.55, py + chh*.25, cw*.25, chh*.5);
  }
  g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, y0 + m*chh); g.lineTo(W, y0 + m*chh); g.stroke();
};
ART.case["C02-04"].ratio = 1.15;

// C02-05 自動化圖解：把 CA 聚落讀成泡泡圖（手繪筆觸）
ART.case["C02-05"] = function(g, W, H, r, c){
  const n = 36, m = Math.round(n*H/W), cs = W/n; let s = run(seed(n, m, r, .3), n, m, LIFE_B, LIFE_S, 14, false);
  g.fillStyle = "rgba(255,255,255,.12)"; for(let i = 0; i < n*m; i++) if(s[i]) g.fillRect((i%n)*cs + cs*.3, ((i/n)|0)*cs + cs*.3, cs*.4, cs*.4);
  // 連通群組（8 鄰）
  const lab = new Int32Array(n*m).fill(-1), groups = [];
  for(let i = 0; i < n*m; i++){ if(!s[i] || lab[i] >= 0) continue; const st = [i], G = {x:0, y:0, k:0}; lab[i] = groups.length;
    while(st.length){ const p = st.pop(), x = p%n, y = (p/n)|0; G.x += x; G.y += y; G.k++;
      for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++){ const xx = x+dx, yy = y+dy; if(xx<0||yy<0||xx>=n||yy>=m) continue; const q = yy*n+xx; if(s[q] && lab[q] < 0){ lab[q] = groups.length; st.push(q); } } }
    groups.push({x:(G.x/G.k + .5)*cs, y:(G.y/G.k + .5)*cs, R: Math.sqrt(G.k)*cs*.55 + 4}); }
  const bub = groups.filter(b => b.R > 7);
  const wob = (x, y, R) => { g.beginPath(); const o = r()*TAU; for(let k = 0; k <= 40; k++){ const a = o + k/40*TAU*1.08, rr = R*(1 + (r()-.5)*.06); k ? g.lineTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr) : g.moveTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr); } g.stroke(); };
  g.lineCap = "round";
  for(let i = 0; i < bub.length; i++) for(let j = i+1; j < bub.length; j++){ const a = bub[i], b = bub[j], d = Math.hypot(a.x-b.x, a.y-b.y); if(d > W*.35) continue;
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.setLineDash(d > W*.22 ? [4,4] : []); g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo((a.x+b.x)/2 + (r()-.5)*12, (a.y+b.y)/2 + (r()-.5)*12, b.x, b.y); g.stroke(); }
  g.setLineDash([]);
  bub.forEach((b, i) => { g.fillStyle = U.rgba(i % 4 === 0 ? ACC : c, .22); g.beginPath(); g.arc(b.x, b.y, b.R, 0, TAU); g.fill(); g.strokeStyle = i % 4 === 0 ? ACC : sh(c,1.4); g.lineWidth = 1.6; wob(b.x, b.y, b.R); wob(b.x, b.y, b.R*1.04); });
};
ART.case["C02-05"].ratio = .85;

// C02-06 實務中的 CA 改造：左為原始 CA，右為詮釋後的房間平面（牆線＋控制點）
ART.case["C02-06"] = function(g, W, H, r, c){
  const n = 12, m = 16; let s = run(seed(n, m, r, .5), n, m, rule("3"), rule("2345"), 4, false);
  const pw = W*.4, cs = pw/n, y0 = (H - m*cs)/2, xa = W*.05, xb = W*.55;
  for(let i = 0; i < n*m; i++) if(s[i]){ g.fillStyle = sh(c,.9); g.fillRect(xa + (i%n)*cs, y0 + ((i/n)|0)*cs, cs-1, cs-1); }
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(xa, y0, pw, m*cs);
  // 詮釋：2×2 粗化成房間，牆沿著房間邊界
  const N = n/2, M = m/2, room = new Uint8Array(N*M);
  for(let y = 0; y < M; y++) for(let x = 0; x < N; x++){ let k = 0; for(let dy = 0; dy < 2; dy++) for(let dx = 0; dx < 2; dx++) k += s[(y*2+dy)*n + x*2+dx]; room[y*N+x] = k >= 2 ? 1 : 0; }
  const rs = cs*2, at = (x,y) => x >= 0 && y >= 0 && x < N && y < M && room[y*N+x];
  for(let y = 0; y < M; y++) for(let x = 0; x < N; x++) if(at(x,y)){ g.fillStyle = U.rgba(c,.2); g.fillRect(xb + x*rs, y0 + y*rs, rs, rs); }
  g.strokeStyle = "#fff"; g.lineWidth = 2.2; g.beginPath();
  for(let y = 0; y <= M; y++) for(let x = 0; x <= N; x++){
    if(at(x,y) !== at(x,y-1)){ const d = (x+y) % 3 === 0; g.moveTo(xb + x*rs, y0 + y*rs); g.lineTo(xb + (x + (d ? .3 : 1))*rs, y0 + y*rs); if(d){ g.moveTo(xb + (x+.7)*rs, y0 + y*rs); g.lineTo(xb + (x+1)*rs, y0 + y*rs); } }
    if(at(x,y) !== at(x-1,y)){ g.moveTo(xb + x*rs, y0 + y*rs); g.lineTo(xb + x*rs, y0 + (y+1)*rs); }
  }
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; for(let y = 0; y <= M; y++) for(let x = 0; x <= N; x++) if(at(x,y) || at(x-1,y) || at(x,y-1) || at(x-1,y-1)){ g.strokeStyle = sh(c,1.5); g.strokeRect(xb + x*rs - 2, y0 + y*rs - 2, 4, 4); }
  arrow(g, W*.46, H/2, W*.53, H/2, ACC);
};
ART.case["C02-06"].ratio = .8;

// C02-07 Les Folies Cellulaires：公園點格上的一群小型 CA 點景建築（鳥瞰等角）
ART.case["C02-07"] = function(g, W, H, r, c){
  const G = 4, sp = 7, S = G*sp, u = Math.min(W/(S*1.8), H/(S*1.15)), P = proj(W/2, H*.14, u, ...ISO);
  g.fillStyle = "rgba(90,140,90,.12)"; U.poly(g, [P(0,0,0),P(S,0,0),P(S,S,0),P(0,S,0)], true); g.fill();
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; for(let k = 0; k <= G; k++){ let a = P(k*sp,0,0), b = P(k*sp,S,0); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); a = P(0,k*sp,0); b = P(S,k*sp,0); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
  // 蜿蜒步道
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.beginPath(); for(let k = 0; k <= 40; k++){ const t = k/40, p = P(t*S, S*(.5 + .3*Math.sin(t*TAU*1.3)), 0); k ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); } g.stroke();
  const L = [];
  for(let j = 0; j < G; j++) for(let i = 0; i < G; i++){
    const ox = i*sp + sp/2 - 1.5, oy = j*sp + sp/2 - 1.5; let s = seed(3, 3, r, .6); s[4] = 1;
    for(let z = 0; z < 3; z++){ for(let k = 0; k < 9; k++) if(s[k]) L.push([ox + k%3, oy + ((k/3)|0), z, (i+j)%3 ? ACC : sh(c,1.3)]); const t = step(s, 3, 3, rule("123"), rule("1234"), false); for(let k = 0; k < 9; k++) t[k] &= s[k] | (r() < .3 ? 1 : 0); s = t; }
  }
  voxels(g, P, L, ACC, 1, "rgba(0,0,0,.3)");
};
ART.case["C02-07"].ratio = .8;

// C02-08 KnitYak：Rule 110 針織圍巾（一列一針，兩端流蘇）
ART.case["C02-08"] = function(g, W, H, r, c){
  const cols = 26, rows = 44, sw = W*.46, cs = sw/cols, rh = H*.78/rows, x0 = (W - sw)/2, y0 = H*.11, P = wolfram([110,73,30][(r()*3)|0], cols, rows, r);
  const off = y => Math.sin(y/rows*TAU*1.2)*W*.06;
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const x = x0 + i*cs + off(j), y = y0 + j*rh, on = P[j][i];
    g.strokeStyle = on ? sh(c,1.2) : "rgba(240,236,228,.85)"; g.lineWidth = Math.max(1.2, cs*.3); g.lineCap = "round";
    g.beginPath(); g.moveTo(x + cs*.1, y); g.lineTo(x + cs*.5, y + rh*.95); g.lineTo(x + cs*.9, y); g.stroke();
  }
  // 流蘇
  g.strokeStyle = "rgba(240,236,228,.6)"; g.lineWidth = 1;
  for(let i = 0; i < cols; i += 2){ const xt = x0 + (i+.5)*cs + off(0), xb = x0 + (i+.5)*cs + off(rows); g.beginPath(); g.moveTo(xt, y0); g.lineTo(xt + (r()-.5)*4, y0 - H*.07); g.stroke();
    g.beginPath(); g.moveTo(xb, y0 + rows*rh); g.lineTo(xb + (r()-.5)*4, y0 + rows*rh + H*.07); g.stroke(); }
};
ART.case["C02-08"].ratio = 1.35;

// C02-09 都市土地使用 CA：鳥瞰地圖（住宅／商業／工業／綠地＋河流）
ART.case["C02-09"] = function(g, W, H, r, c){
  const n = 80, m = Math.round(n*H/W), cs = W/n, nz = U.vnoise((r()*1e6)|0), st = new Uint8Array(n*m);
  const river = x => m*(.62 + .15*Math.sin(x/n*TAU*.9 + 1));
  const suit = (x,y) => nz(x*.12, y*.12)*(Math.abs(y - river(x)) < 1.6 ? 0 : 1);
  const cx = n*.45, cy = m*.4; for(let k = 0; k < 6; k++) st[((cy + (r()-.5)*4)|0)*n + ((cx + (r()-.5)*4)|0)] = 1;
  for(let it = 0; it < 40; it++){ const t = st.slice();
    for(let y = 1; y < m-1; y++) for(let x = 1; x < n-1; x++){ const i = y*n+x; if(st[i]) continue; let k = 0; for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++) k += st[i + dy*n + dx] ? 1 : 0;
      if(k && r() < k*.13*suit(x,y)*1.6) t[i] = 1; }
    st.set(t); }
  for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){ const i = y*n+x, d = Math.hypot(x-cx, y-cy); let col;
    if(Math.abs(y - river(x)) < 1.6) col = "rgba(110,150,200,.55)";
    else if(st[i]) col = d < 3.5 ? ACC : Math.abs(y - river(x)) < 6 && d > 16 ? "rgba(200,200,210,.75)" : sh(c, .8 + nz(x*.3,y*.3)*.6);
    else col = nz(x*.08+9, y*.08) > .6 ? "rgba(90,150,90,.35)" : "rgba(255,255,255,.04)";
    g.fillStyle = col; g.fillRect(x*cs, y*cs, cs + .3, cs + .3); }
  // 主要道路
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.2;
  for(let k = 0; k < 5; k++){ const a = k/5*TAU + r()*.4; g.beginPath(); g.moveTo(cx*cs, cy*cs); g.lineTo((cx + Math.cos(a)*n)*cs, (cy + Math.sin(a)*n)*cs); g.stroke(); }
};
ART.case["C02-09"].ratio = .9;

// C02-10 Rabbit 外掛：Grasshopper 畫布上的規則元件、連線與預覽
ART.case["C02-10"] = function(g, W, H, r, c){
  g.fillStyle = "rgba(255,255,255,.05)"; for(let y = 8; y < H; y += 12) for(let x = 8; x < W; x += 12) g.fillRect(x, y, 1, 1);
  const names = 5, bw = W*.26, bh = H*.1, bx = W*.05, gap = (H*.84 - names*bh)/(names-1), by0 = H*.08;
  const hub = [W*.46, H*.42, W*.16, H*.2], out = [];
  for(let k = 0; k < names; k++){ const y = by0 + k*(bh+gap);
    rrect(g, bx, y, bw, bh, 4); g.fillStyle = "rgba(200,200,210,.18)"; g.fill(); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.stroke();
    const bits = []; for(let i = 0; i < 9; i++) bits.push(r() < .45 ? 1 : 0); bits[4] = 1;
    const gs = bh*.22; glyph(g, bx + 6, y + (bh - gs*3)/2, gs, bits, k === 2 ? ACC : c);
    g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(bx + 6 + gs*3 + 6, y + bh*.4, bw*.4, 2); g.fillRect(bx + 6 + gs*3 + 6, y + bh*.6, bw*.25, 2);
    g.fillStyle = "#fff"; g.beginPath(); g.arc(bx + bw, y + bh/2, 3, 0, TAU); g.fill(); out.push([bx + bw, y + bh/2]); }
  // 中央 CA 元件
  rrect(g, hub[0], hub[1], hub[2], hub[3], 5); g.fillStyle = U.rgba(c,.35); g.fill(); g.strokeStyle = c; g.lineWidth = 1.5; g.stroke();
  const inP = [hub[0], hub[1] + hub[3]/2], outP = [hub[0] + hub[2], hub[1] + hub[3]/2];
  g.lineWidth = 1.2; out.forEach((p, k) => { g.strokeStyle = k === 2 ? ACC : "rgba(255,255,255,.35)"; g.setLineDash(k === 2 ? [] : [3,3]); g.beginPath(); g.moveTo(p[0], p[1]); g.bezierCurveTo(p[0] + 40, p[1], inP[0] - 40, inP[1], inP[0], inP[1]); g.stroke(); });
  g.setLineDash([]);
  // 預覽視窗（Rhino 視埠）
  const vx = W*.7, vy = H*.18, vw = W*.27, vh = H*.62; g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(vx, vy, vw, vh); g.strokeStyle = "rgba(255,255,255,.4)"; g.strokeRect(vx, vy, vw, vh);
  g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(outP[0], outP[1]); g.bezierCurveTo(outP[0] + 30, outP[1], vx - 30, vy + vh/2, vx, vy + vh/2); g.stroke();
  const n = 10; let s = seed(n, n, r, .4); const u = vw/(n*2.1), P = proj(vx + vw/2, vy + vh*.3, u, ...ISO), L = [];
  for(let z = 0; z < 6; z++){ for(let i = 0; i < n*n; i++) if(s[i]) L.push([i%n, (i/n)|0, z]); s = step(s, n, n, LIFE_B, LIFE_S, true); }
  g.save(); g.beginPath(); g.rect(vx, vy, vw, vh); g.clip();
  L.forEach(v => { const q = P(v[0]+.5, v[1]+.5, v[2]); g.fillStyle = sh(c, .6 + v[2]*.15); g.fillRect(q[0]-u*.5, q[1]-u*.3, u, u*.6); });
  g.restore();
};
ART.case["C02-10"].ratio = .8;

// C02-11 世代疊層網頁視覺化：八片半透明切片分離疊放，最新一層在上
ART.case["C02-11"] = function(g, W, H, r, c){
  const n = 16, layers = 8; let s = run(seed(n, n, r, .35), n, n, LIFE_B, LIFE_S, 3, true); const st = [];
  for(let k = 0; k < layers; k++){ st.push(s); s = step(s, n, n, LIFE_B, LIFE_S, true); }
  const u = Math.min(W/(n*1.85), H/(n + layers*4.2)), gap = 3.4, P = proj(W/2, H - n*u - u*.6, u, ...ISO);
  for(let k = 0; k < layers; k++){ const z = k*gap, t = k/(layers-1), top = k === layers-1;
    g.fillStyle = `rgba(255,255,255,${.03 + t*.05})`; U.poly(g, [P(0,0,z),P(n,0,z),P(n,n,z),P(0,n,z)], true); g.fill();
    g.strokeStyle = top ? "#fff" : `rgba(255,255,255,${.12 + t*.3})`; g.lineWidth = top ? 1.4 : 1; g.stroke();
    for(let i = 0; i < n*n; i++) if(st[k][i]){ const x = i%n, y = (i/n)|0; U.poly(g, [P(x+.1,y+.1,z),P(x+.9,y+.1,z),P(x+.9,y+.9,z),P(x+.1,y+.9,z)], true); g.fillStyle = top ? "#fff" : sh(c, .5 + t*.7, .25 + t*.6); g.fill(); }
  }
  // 時間軸：右側垂直刻度
  const a = P(n,0,0), b = P(n,0,(layers-1)*gap); g.strokeStyle = ACC; g.lineWidth = 1.2; g.beginPath(); g.moveTo(a[0] + 12, a[1]); g.lineTo(b[0] + 12, b[1]); g.stroke();
  for(let k = 0; k < layers; k++){ const p = P(n,0,k*gap); g.fillStyle = ACC; g.fillRect(p[0] + 9, p[1] - 1, 6, 2); }
};
ART.case["C02-11"].ratio = 1.3;

// C02-12 Lenia 裝置：暗室裡投影在牆上的連續態生物，地面反光與觀者剪影
ART.case["C02-12"] = function(g, W, H, r, c){
  const wx = W*.2, wy = H*.12, ww = W*.6, wh = H*.5;
  // 房間透視線
  g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 1;
  [[0,0,wx,wy],[W,0,wx+ww,wy],[0,H,wx,wy+wh],[W,H,wx+ww,wy+wh]].forEach(([a,b,x,y]) => { g.beginPath(); g.moveTo(a,b); g.lineTo(x,y); g.stroke(); });
  for(let k = 1; k < 5; k++){ const t = k/5, y = wy + wh + (H - wy - wh)*t*t; g.beginPath(); g.moveTo(wx - wx*t*t, y); g.lineTo(wx + ww + (W - wx - ww)*t*t, y); g.stroke(); }
  // 牆上投影（離屏繪製連續場）
  const n = 90, m = Math.round(n*wh/ww), off = document.createElement("canvas"); off.width = n; off.height = m; const og = off.getContext("2d");
  const bl = [0,1,2,3].map(() => ({x: n*(.15 + r()*.7), y: m*(.2 + r()*.6), R: 5 + r()*5, d: r()*TAU}));
  U.field(og, n, m, n, m, (i,j) => { let v = 0; for(const b of bl){ const dx = i-b.x, dy = j-b.y, d = Math.hypot(dx,dy), a = Math.atan2(dy,dx); v += Math.exp(-((d - b.R*.7)**2)/(b.R*b.R*.07))*(.5 + .5*Math.cos(a - b.d)) + .5*Math.exp(-d*d/(b.R*b.R*.05)); } return v; }, c, .8);
  g.drawImage(off, wx, wy, ww, wh);
  const glow = g.createRadialGradient(W/2, wy + wh, 0, W/2, wy + wh, W*.6); glow.addColorStop(0, U.rgba(c,.3)); glow.addColorStop(1, U.rgba(c,0)); g.fillStyle = glow; g.fillRect(0, wy + wh, W, H);
  // 觀者剪影
  g.fillStyle = "#08080B";
  [[.34,.93,1],[.62,.97,1.15],[.5,.9,.9]].forEach(([x,y,k]) => { const px = W*x, py = H*y, s2 = H*.07*k; g.beginPath(); g.arc(px, py - s2*2.2, s2*.35, 0, TAU); g.fill(); rrect(g, px - s2*.45, py - s2*1.8, s2*.9, s2*1.8, s2*.3); g.fill(); });
};
ART.case["C02-12"].ratio = .8;

// C02-13 動態遮陽立面：日照色階底圖＋依 CA 狀態旋轉的百葉＋色階圖例
ART.case["C02-13"] = function(g, W, H, r, c){
  const n = 12, m = 16, fx = W*.08, fw = W*.74, cw = fw/n, ch = cw*.9, fy = (H - m*ch)/2;
  const sunx = n*(.7 + r()*.3), suny = -2, E = (x,y) => Math.max(0, 1 - Math.hypot(x - sunx, y - suny)/(m*1.1));
  let s = new Uint8Array(n*m); for(let i = 0; i < n*m; i++) s[i] = E(i%n, (i/n)|0) + (r()-.5)*.4 > .5 ? 1 : 0;
  s = run(s, n, m, rule("5678"), rule("45678"), 3, false);
  const col = t => { const a = [40,60,140], b = [230,90,60], k = Math.max(0, Math.min(1, t)); return `rgb(${a.map((v,i) => Math.round(v + (b[i]-v)*k)).join(",")})`; };
  for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){
    const px = fx + x*cw, py = fy + y*ch, e = E(x,y), closed = s[y*n+x];
    g.fillStyle = col(e); g.globalAlpha = .45; g.fillRect(px, py, cw, ch); g.globalAlpha = 1;
    // 百葉：關閉＝幾乎水平的粗板，開啟＝傾斜細板
    const ang = closed ? .12 : 1.1, cx = px + cw/2, cy = py + ch/2, L = cw*.46;
    g.strokeStyle = closed ? "#fff" : sh(c,1.3); g.lineWidth = closed ? 3 : 1.4;
    for(let k = -1; k <= 1; k++){ const oy = k*ch*.28; g.beginPath(); g.moveTo(cx - Math.cos(ang)*L*.9, cy + oy + Math.sin(ang)*L*.3); g.lineTo(cx + Math.cos(ang)*L*.9, cy + oy - Math.sin(ang)*L*.3); g.stroke(); }
  }
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(fx, fy, fw, m*ch);
  // 色階圖例
  const lx = W*.88, lh = m*ch; for(let k = 0; k < 40; k++){ g.fillStyle = col(1 - k/40); g.fillRect(lx, fy + k*lh/40, W*.04, lh/40 + .5); }
  g.fillStyle = "rgba(255,255,255,.6)"; for(let k = 0; k <= 4; k++) g.fillRect(lx + W*.04, fy + k*lh/4 - .5, 4, 1);
};
ART.case["C02-13"].ratio = 1.2;

// C02-14 演化建築：演化樹，節點上是逐代變複雜的小量體，淘汰分支打叉
ART.case["C02-14"] = function(g, W, H, r, c){
  const nodes = [], depth = 4;
  const grow = (x, y, lvl, spread) => { const id = nodes.length; nodes.push({x, y, lvl, dead: lvl > 1 && r() < .22}); if(lvl >= depth - 1 || nodes[id].dead) return id;
    const k = lvl < 1 ? 3 : 2; for(let i = 0; i < k; i++){ const nx = x + (i - (k-1)/2)*spread, ny = y - H*.23; const ch = grow(nx, ny, lvl + 1, spread*.5); g.strokeStyle = nodes[ch].dead ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.5)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x, y - H*.1, nx, ny + H*.1, nx, ny); g.stroke(); }
    return id; };
  grow(W/2, H*.9, 0, W*.34);
  nodes.forEach(nd => { // 上層節點較密，量體縮小避免互相重疊
    const u = W*(.018 - nd.lvl*.003), P = proj(nd.x, nd.y - u*1.5, u, ...ISO), n = 3 + (nd.lvl > 1 ? 1 : 0); let s = seed(n, n, r, .5); const L = [];
    for(let z = 0; z <= Math.min(2, nd.lvl + 1); z++){ for(let i = 0; i < n*n; i++) if(s[i]) L.push([i%n - n/2, ((i/n)|0) - n/2, z]); const t = step(s, n, n, LIFE_B, rule("2345"), false); s = t; }
    if(!L.length) L.push([0,0,0]);
    if(nd.dead){ g.globalAlpha = .35; }
    voxels(g, P, L, nd.lvl === depth-1 ? ACC : c, 1, "rgba(0,0,0,.3)"); g.globalAlpha = 1;
    if(nd.dead){ g.strokeStyle = ACC; g.lineWidth = 1.5; const e = 5; g.beginPath(); g.moveTo(nd.x-e, nd.y-e); g.lineTo(nd.x+e, nd.y+e); g.moveTo(nd.x+e, nd.y-e); g.lineTo(nd.x-e, nd.y+e); g.stroke(); }
  });
};
ART.case["C02-14"].ratio = 1;

// C02-15 歷史街區填充：圖地關係平面，新 CA 量體只在空地內沿著既有紋理生長
ART.case["C02-15"] = function(g, W, H, r, c){
  const n = 60, m = Math.round(n*H/W), cs = W/n, nz = U.vnoise((r()*1e6)|0), kind = new Uint8Array(n*m); // 0 街道 1 既有建物 2 空地 3 中庭
  // 不規則街廓：以扭曲的格線切街道
  const warp = (x,y) => [x + (nz(x*.05, y*.05)-.5)*10, y + (nz(x*.05+7, y*.05+3)-.5)*10];
  for(let y = 0; y < m; y++) for(let x = 0; x < n; x++){ const [a,b] = warp(x,y), ba = ((a/11)%1 + 1)%1, bb = ((b/9)%1 + 1)%1;
    const street = ba < .14 || bb < .16, core = ba > .4 && ba < .78 && bb > .42 && bb < .8;
    kind[y*n+x] = street ? 0 : core && nz(x*.3, y*.3) > .45 ? 3 : 1; }
  // 挑幾個空地
  const lots = []; for(let k = 0; k < 4; k++){ const lx = 3 + ((r()*(n-12))|0), ly = 3 + ((r()*(m-12))|0), lw = 5 + ((r()*4)|0), lh = 4 + ((r()*4)|0); lots.push([lx,ly,lw,lh]);
    for(let y = ly; y < ly+lh; y++) for(let x = lx; x < lx+lw; x++) if(kind[y*n+x]) kind[y*n+x] = 2; }
  // 空地內：以周邊既有建物為初始狀態，只在空地生長
  let s = new Uint8Array(n*m), mask = new Uint8Array(n*m);
  for(let i = 0; i < n*m; i++){ s[i] = kind[i] === 1 ? 1 : kind[i] === 2 && r() < .5 ? 1 : 0; mask[i] = kind[i] === 2 ? 1 : 0; }
  let grown = s.slice(); for(let it = 0; it < 3; it++){ const t = step(grown, n, m, rule("3"), rule("2345678"), false, mask); for(let i = 0; i < n*m; i++) if(mask[i]) grown[i] = t[i]; }
  for(let i = 0; i < n*m; i++){ const x = (i%n)*cs, y = ((i/n)|0)*cs;
    if(kind[i] === 1){ g.fillStyle = "rgba(210,210,220,.55)"; g.fillRect(x, y, cs + .3, cs + .3); }
    else if(kind[i] === 2 && grown[i]){ g.fillStyle = c; g.fillRect(x + .4, y + .4, cs - .8, cs - .8); } }
  g.strokeStyle = ACC; g.lineWidth = 1.3; g.setLineDash([4,3]); lots.forEach(([x,y,w,h]) => g.strokeRect(x*cs, y*cs, w*cs, h*cs)); g.setLineDash([]);
};
ART.case["C02-15"].ratio = 1;
})();
