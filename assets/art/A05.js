/* A05 形狀文法：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
const TAU = Math.PI*2, D2R = Math.PI/180;
const AMB = "#F2A007", SKY = "#6FB8FF", LEAF = "#7FC77F";

/* ---------- 共用小工具 ---------- */
const add = (a,b) => [a[0]+b[0], a[1]+b[1]], sub = (a,b) => [a[0]-b[0], a[1]-b[1]], mul = (a,k) => [a[0]*k, a[1]*k];
const lerp = (a,b,t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t];
const rot = (v,t) => [v[0]*Math.cos(t) - v[1]*Math.sin(t), v[0]*Math.sin(t) + v[1]*Math.cos(t)];
function area(P){ let s = 0; for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i+1)%P.length]; s += a[0]*b[1] - b[0]*a[1]; } return Math.abs(s)/2; }
function inside(p, P){ let c = false; for(let i = 0, j = P.length-1; i < P.length; j = i++){ const a = P[i], b = P[j]; if((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; }

// 帶標籤的正方形：p0 底邊左點、v 底邊向量（螢幕座標 y 向下，法向量朝上）
function sqr(p0, v, d){ const n = [v[1], -v[0]], p1 = add(p0,v), p2 = add(p1,n), p3 = add(p0,n);
  return {pts:[p0,p1,p2,p3], v, n, d, s:Math.hypot(v[0],v[1])}; }
// 規則 A → 正方形 ＋ 兩個直角三角形斜邊上的正方形（畢氏樹）
function pythKids(q, th){ const p2 = q.pts[2], p3 = q.pts[3], c = Math.cos(th), s = Math.sin(th);
  const apex = add(p3, add(mul(q.v, c*c), mul(q.n, c*s)));
  return [sqr(p3, sub(apex,p3), q.d+1), sqr(apex, sub(p2,apex), q.d+1)]; }
// 其他規則：只長一枝／扇形三枝
function oneKid(q, t){ const b = add(q.pts[3], mul(q.v, .12)); return [sqr(b, rot(mul(q.v,.76), t), q.d+1)]; }
function fanKids(q, k, spread){ const out = [];
  for(let i = 0; i < k; i++){ const t = k === 1 ? 0 : -spread + 2*spread*i/(k-1), L = 1.25/k, m = add(q.pts[3], mul(q.v, (i+.5)/k)), vv = rot(mul(q.v, L), t);
    out.push(sqr(sub(m, mul(vv,.5)), vv, q.d+1)); }
  return out; }
// 通用改寫：rule(q) 回傳子形狀陣列（空陣列＝終止）
function grow(start, rule, maxN = 4000){ const out = [], st = [start];
  while(st.length && out.length < maxN){ const q = st.pop(); out.push(q); const k = rule(q); if(k && k.length){ q.kids = k; st.push(...k); } else q.leaf = true; }
  return out; }
// 把形狀集合縮放置入方框
function fit(list, x, y, w, h, bottom){
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9; list.forEach(q => q.pts.forEach(p => { a = Math.min(a,p[0]); b = Math.min(b,p[1]); c = Math.max(c,p[0]); d = Math.max(d,p[1]); }));
  const k = Math.min(w/(c-a||1), h/(d-b||1)), ox = x + (w-(c-a)*k)/2 - a*k, oy = bottom ? y + h - d*k : y + (h-(d-b)*k)/2 - b*k;
  const m = p => [ox + p[0]*k, oy + p[1]*k];
  list.forEach(q => { q.pts = q.pts.map(m); q.s *= k; }); return m; }
const ctr = q => [(q.pts[0][0]+q.pts[2][0])/2, (q.pts[0][1]+q.pts[2][1])/2];

/* ---------- 簡易 3D：面清單＋畫家演算法 ---------- */
function box(F, x, y, z, w, d, h, col, ex){ const P = (i,j,k) => [x+i*w, y+j*d, z+k*h];
  [[P(0,0,0),P(1,0,0),P(1,1,0),P(0,1,0)],[P(0,0,1),P(1,0,1),P(1,1,1),P(0,1,1)],[P(0,0,0),P(1,0,0),P(1,0,1),P(0,0,1)],
   [P(0,1,0),P(1,1,0),P(1,1,1),P(0,1,1)],[P(0,0,0),P(0,1,0),P(0,1,1),P(0,0,1)],[P(1,0,0),P(1,1,0),P(1,1,1),P(1,0,1)]]
   .forEach(p => F.push(Object.assign({p, col}, ex))); }
// 雙坡屋頂（屋脊沿 x 或 y）
function gable(F, x, y, z, w, d, rh, alongX, col, ex){
  if(alongX){ const a = [x,y,z], b = [x+w,y,z], c = [x+w,y+d,z], e = [x,y+d,z], r1 = [x,y+d/2,z+rh], r2 = [x+w,y+d/2,z+rh];
    F.push(Object.assign({p:[a,b,r2,r1], col}, ex), Object.assign({p:[e,c,r2,r1], col}, ex), Object.assign({p:[a,e,r1], col:"#DDD6CC"}, ex), Object.assign({p:[b,c,r2], col:"#DDD6CC"}, ex)); }
  else { const a = [x,y,z], b = [x,y+d,z], c = [x+w,y+d,z], e = [x+w,y,z], r1 = [x+w/2,y,z+rh], r2 = [x+w/2,y+d,z+rh];
    F.push(Object.assign({p:[a,b,r2,r1], col}, ex), Object.assign({p:[e,c,r2,r1], col}, ex), Object.assign({p:[a,e,r1], col:"#DDD6CC"}, ex), Object.assign({p:[b,c,r2], col:"#DDD6CC"}, ex)); }
}
const ISO = p => [(p[0]-p[1])*.866, (p[0]+p[1])*.5 - p[2], p[0]+p[1]+p[2]*.9];
function persp(yaw, tilt, dist){ const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
  return p => { const x1 = p[0]*cy - p[1]*sy, y1 = p[0]*sy + p[1]*cy, up = p[2]*ct + y1*st, dep = dist + y1*ct - p[2]*st; return [x1/dep, -up/dep, -dep]; }; }
function render(g, F, proj, bx, by, bw, bh, o = {}){
  const L = o.L || [.35,.6,.9], Ln = Math.hypot(...L);
  const Q = F.map(f => { const s = f.p.map(proj); return {f, s, k:(f.k ?? 0) + s.reduce((a,q) => a+q[2], 0)/s.length}; });
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; Q.forEach(q => q.s.forEach(p => { x0 = Math.min(x0,p[0]); y0 = Math.min(y0,p[1]); x1 = Math.max(x1,p[0]); y1 = Math.max(y1,p[1]); }));
  const k = Math.min(bw/(x1-x0||1), bh/(y1-y0||1)), ox = bx + (bw-(x1-x0)*k)/2 - x0*k, oy = o.bottom ? by + bh - y1*k : by + (bh-(y1-y0)*k)/2 - y0*k;
  const map = p => { const s = proj(p); return [ox + s[0]*k, oy + s[1]*k]; };
  if(o.under) o.under(map, k);
  Q.sort((a,b) => a.k - b.k);
  Q.forEach(q => { const f = q.f, pts = q.s.map(p => [ox + p[0]*k, oy + p[1]*k]);
    U.poly(g, pts, !f.open);
    if(f.col){ let sh = 1;
      if(f.p.length > 2 && !f.flat){ const a = f.p[0], b = f.p[1], c = f.p[2], u = [b[0]-a[0],b[1]-a[1],b[2]-a[2]], v = [c[0]-a[0],c[1]-a[1],c[2]-a[2]];
        const n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]], nl = Math.hypot(...n) || 1;
        sh = .32 + .68*Math.abs((n[0]*L[0] + n[1]*L[1] + n[2]*L[2])/(nl*Ln)); }
      const [R,G,B] = typeof f.col === "string" ? U.rgb(f.col) : f.col;
      g.fillStyle = `rgba(${R*sh|0},${G*sh|0},${B*sh|0},${f.a ?? 1})`; g.fill(); }
    if(f.line !== null){ g.strokeStyle = f.line || o.line || "rgba(0,0,0,.35)"; g.lineWidth = f.lw || o.lw || .7; if(f.dash) g.setLineDash(f.dash); g.stroke(); g.setLineDash([]); }
  });
  return map;
}
function glow(g, x, y, R, c, a = .5){ const gr = g.createRadialGradient(x,y,0,x,y,R); gr.addColorStop(0, U.rgba(c,a)); gr.addColorStop(1, U.rgba(c,0)); g.fillStyle = gr; g.fillRect(x-R,y-R,2*R,2*R); }
function isoGrid(g, map, n, s, z = 0, col = "rgba(255,255,255,.06)"){ g.strokeStyle = col; g.lineWidth = .6;
  for(let i = 0; i <= n; i++){ const a = map([i*s - n*s/2,-n*s/2,z]), b = map([i*s - n*s/2,n*s/2,z]), c2 = map([-n*s/2,i*s - n*s/2,z]), d = map([n*s/2,i*s - n*s/2,z]);
    g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.moveTo(c2[0],c2[1]); g.lineTo(d[0],d[1]); g.stroke(); } }
// 冰裂紋：以一條線把凸多邊形切成兩個
function iceRay(P0, r, minA, maxN = 400){ const out = [], st = [P0];
  while(st.length){ const P = st.pop();
    if(area(P) < minA || out.length + st.length > maxN){ out.push(P); continue; }
    // 從（略帶隨機的）最長邊切到大致對面的邊，避免細長碎片
    const n = P.length; let i = 0, best = -1; for(let k = 0; k < n; k++){ const e = Math.hypot(P[(k+1)%n][0]-P[k][0], P[(k+1)%n][1]-P[k][1]) * (.7 + r()*.6); if(e > best){ best = e; i = k; } }
    let j = (i + Math.floor(n/2) + (n > 3 ? ((r()*3)|0) - 1 : 0) + n) % n; if(j === i) j = (i+1)%n; if(i > j) [i,j] = [j,i];
    const t1 = .25 + r()*.5, t2 = .25 + r()*.5, a = lerp(P[i], P[(i+1)%n], t1), b = lerp(P[j], P[(j+1)%n], t2);
    const A = [a]; for(let k = i+1; k <= j; k++) A.push(P[k]); A.push(b);
    const B = [b]; for(let k = j+1; k <= i+n; k++) B.push(P[k%n]); B.push(a);
    st.push(A, B); }
  return out; }
function strokePoly(g, P, col, lw){ U.poly(g, P, true); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); }

/* ================= 變形 ================= */
ART.var["A05"] = [
  // V01 隨機分叉角：同一條地平線上三棵不同 seed 的樹，角度抖動由小到大，右側風線
  function(g, W, H, r, c){
    const gy = H*.84;
    g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(0, gy, W, H-gy);
    g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1;
    for(let i = 0; i < 9; i++){ const y = H*(.06 + i*.035), x = W*(.55 + r()*.3); g.beginPath(); g.moveTo(x,y); g.bezierCurveTo(x-W*.12,y-5,x-W*.25,y+5,x-W*.42,y-2); g.stroke(); }
    const spec = [[.2, .2, 8, .82], [.52, .55, 9, 1], [.82, 1, 8, .78]];   // [x 位置, 抖動量, 代數, 大小]
    spec.forEach(([fx, jit, dep, sz], ti) => {
      const T = grow(sqr([0,0],[1,0],0), q => q.d >= dep ? [] : pythKids(q, Math.max(15, Math.min(75, 45 - 12*jit + (r()-.5)*70*jit))*D2R));
      const w = W*.56*sz, h = H*.78*sz; fit(T, W*fx - w/2, gy - h, w, h, true);
      T.forEach(q => { U.poly(g, q.pts, true); const t = q.d/dep;
        g.fillStyle = q.leaf ? U.rgba(ti === 1 ? "#FFD2B8" : ti === 0 ? "#FFFFFF" : AMB, .8) : U.rgba(c, .92 - t*.5); g.fill(); g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = .5; g.stroke(); });
      // 樹下的 seed 刻度（抖動量）
      for(let k = 0; k < 3; k++){ g.fillStyle = k <= ti ? U.rgba(c, .9) : "rgba(255,255,255,.18)"; g.fillRect(W*fx - 10 + k*7, gy + H*.05, 5, 5); }
    });
    g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(0, gy, W, 1.5);
  },
  // V02 機率文法：3×3 同一家族的小樹，顏色標示套用的規則
  function(g, W, H, r, c){
    const n = 3, cw = W/n, ch = H/n, cols = [c, AMB, "#FFFFFF"];
    for(let j = 0; j < n; j++) for(let i = 0; i < n; i++){
      g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1; g.strokeRect(i*cw+3, j*ch+3, cw-6, ch-6);
      const T = grow(sqr([0,0],[1,0],0), q => { if(q.d >= 6) return [];
        const p = r(), k = p < .5 ? pythKids(q, (35 + r()*20)*D2R) : p < .75 ? fanKids(q, 3, .6) : oneKid(q, (r()-.5)*.6); q.rule = k.length === 2 ? 0 : k.length === 3 ? 1 : 2; return k; });
      fit(T, i*cw + cw*.12, j*ch + ch*.1, cw*.76, ch*.8, true);
      T.forEach(q => { U.poly(g, q.pts, true); g.fillStyle = q.leaf ? "rgba(255,255,255,.55)" : U.rgba(cols[q.rule], .75); g.fill(); });
    }
  },
  // V03 分割文法：立面 樓層→開間→窗牆，左側與上方畫出分割層級
  function(g, W, H, r, c){
    const x0 = W*.2, y0 = H*.1, w = W*.66, h = H*.8, fl = 5 + ((r()*4)|0), gh = h*.16, fh = (h-gh-h*.05)/fl, bays = 4 + ((r()*3)|0), bw = w/bays;
    g.fillStyle = U.rgba(c,.13); g.fillRect(x0, y0, w, h); g.strokeStyle = c; g.lineWidth = 1.6; g.strokeRect(x0, y0, w, h);
    g.fillStyle = U.rgba(c,.5); g.fillRect(x0-4, y0, w+8, h*.05);  // 簷口
    for(let f = 0; f <= fl; f++){ const y = y0 + h*.05 + f*fh;
      g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.setLineDash([3,3]); g.beginPath(); g.moveTo(x0,y); g.lineTo(x0+w,y); g.stroke(); g.setLineDash([]);
      g.fillStyle = AMB; g.fillRect(x0 - W*.08, y-1, W*.05, 2); }
    for(let b = 0; b <= bays; b++){ const x = x0 + b*bw; g.fillStyle = "#FFFFFF"; g.fillRect(x-1, y0 - H*.05, 2, H*.03);
      if(b > 0 && b < bays){ g.strokeStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.moveTo(x,y0); g.lineTo(x,y0+h); g.stroke(); } }
    g.strokeStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.moveTo(x0 - W*.055, y0 + h*.05); g.lineTo(x0 - W*.055, y0 + h); g.stroke();
    for(let f = 0; f < fl; f++) for(let b = 0; b < bays; b++){ const x = x0 + b*bw, y = y0 + h*.05 + f*fh, ww = bw*(.45 + (f%2)*.1), wh = fh*.55;
      g.fillStyle = "#15151B"; g.fillRect(x + (bw-ww)/2, y + fh*.22, ww, wh); g.strokeStyle = "#FFFFFF"; g.lineWidth = 1; g.strokeRect(x + (bw-ww)/2, y + fh*.22, ww, wh);
      g.beginPath(); g.moveTo(x + bw/2, y + fh*.22); g.lineTo(x + bw/2, y + fh*.22 + wh); g.stroke();
      if(r() < .2){ g.fillStyle = U.rgba(c,.8); g.fillRect(x + bw*.12, y + fh*.8, bw*.76, 2.5); } }
    const gy = y0 + h - gh;  // 底層：店面＋大門
    for(let b = 0; b < bays; b++){ const x = x0 + b*bw; g.fillStyle = b === (bays>>1) ? U.rgba(c,.8) : "rgba(111,184,255,.28)"; g.fillRect(x + bw*.1, gy + gh*.18, bw*.8, gh*.82); }
    g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(0, y0 + h, W, 1.5);
  },
  // V04 冰裂紋窗格：木框內的白色格柵，面積越小越細
  function(g, W, H, r, c){
    const x0 = W*.12, y0 = H*.1, w = W*.76, h = H*.8;
    g.fillStyle = "#3A2A22"; g.fillRect(x0-8, y0-8, w+16, h+16); g.fillStyle = "#1A1410"; g.fillRect(x0, y0, w, h);
    glow(g, x0 + w*.6, y0 + h*.35, Math.max(w,h)*.8, "#FFE3C4", .35);
    const cells = iceRay([[x0,y0],[x0+w,y0],[x0+w,y0+h],[x0,y0+h]], r, w*h/90);
    g.lineJoin = "round"; cells.forEach(P => strokePoly(g, P, "#F3E6D6", 2.2));
    g.strokeStyle = U.rgba(c,.9); g.lineWidth = 3; g.strokeRect(x0-4, y0-4, w+8, h+8);
  },
  // V05 3D 立方體畢氏樹：等角投影的方塊分枝
  function(g, W, H, r, c){
    const F = []; let cnt = 0;
    const node = (p, dir, s, d) => { cnt++; box(F, p[0]-s/2, p[1]-s/2, p[2]-s/2, s, s, s, d > 4 ? "#FFD2B8" : c);
      if(d >= 6 || cnt > 700) return; const k = 2 + ((r()*3)|0), ph = r()*TAU;
      for(let i = 0; i < k; i++){ const az = ph + i*TAU/k, t = .55 + r()*.3, perp = [Math.cos(az), Math.sin(az), 0];
        const nd = [dir[0]*Math.cos(t) + perp[0]*Math.sin(t), dir[1]*Math.cos(t) + perp[1]*Math.sin(t), dir[2]*Math.cos(t)], L = Math.hypot(...nd), u = nd.map(x => x/L), ns = s*.62;
        node([p[0] + u[0]*(s+ns)*.55, p[1] + u[1]*(s+ns)*.55, p[2] + u[2]*(s+ns)*.55], u, ns, d+1); } };
    node([0,0,0], [0,0,1], 1, 0);
    render(g, F, ISO, W*.08, H*.06, W*.84, H*.82, {bottom:true, line:"rgba(0,0,0,.4)", lw:.5,
      under:(map,k) => { g.fillStyle = "rgba(0,0,0,.35)"; const p = map([0,0,-.5]); g.beginPath(); g.ellipse(p[0], p[1], k*2.2, k*1.1, 0, 0, TAU); g.fill(); }});
  },
  // V06 曲面上的形狀文法：UV 中的畢氏樹映射到波浪曲面
  function(g, W, H, r, c){
    const T = grow(sqr([0,0],[1,0],0), q => q.d >= 8 ? [] : pythKids(q, (40 + r()*10)*D2R)); fit(T, .03, .02, .94, .96, true);
    const amp = .35 + r()*.2, S = (u,v) => [(u-.5)*2.4, (v-.5)*2.4, amp*Math.sin(u*Math.PI*1.6 + .4)*Math.cos((v-.5)*Math.PI*1.2)];
    const pr = persp(.6, .8, 4.2), F = [], n = 16;
    for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){ const u = i/n, v = j/n, e = 1/n;
      F.push({p:[S(u,v),S(u+e,v),S(u+e,v+e),S(u,v+e)], col:"#2A2530", line:"rgba(255,255,255,.12)", k:-.02}); }
    T.forEach(q => { const P = q.pts.map(([u,v]) => S(u, 1-v)); F.push({p:P, col:q.leaf ? "#FFD2B8" : c, a:.9, line:"rgba(0,0,0,.35)", k:.01}); });
    render(g, F, pr, W*.04, H*.1, W*.92, H*.8, {L:[.2,-.5,1]});
  },
  // V07 吸引子控制終止：正方形 → 四個正方形，越靠近吸引子越細
  function(g, W, H, r, c){
    const ax = W*(.25 + r()*.5), ay = H*(.25 + r()*.5), S = Math.min(W,H)*.9, x0 = (W-S)/2, y0 = (H-S)/2;
    glow(g, ax, ay, S*.45, c, .55);
    const rec = (x,y,s,d) => { const dd = Math.hypot(x+s/2-ax, y+s/2-ay), min = 4 + dd*.22;
      if(s/2 > min && d < 7){ const h = s/2; rec(x,y,h,d+1); rec(x+h,y,h,d+1); rec(x,y+h,h,d+1); rec(x+h,y+h,h,d+1); return; }
      g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8; g.strokeRect(x+1, y+1, s-2, s-2);
      const m = s/2, cx = x+m, cy = y+m; U.poly(g, [[cx,y+2],[x+s-2,cy],[cx,y+s-2],[x+2,cy]], true); g.fillStyle = U.rgba(c, .25 + .5*d/7); g.fill(); g.strokeStyle = U.rgba(c,.9); g.stroke(); };
    rec(x0, y0, S, 0);
    g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(ax, ay, 4, 0, TAU); g.fill(); g.strokeStyle = "#FFFFFF"; g.lineWidth = 1; g.beginPath(); g.arc(ax, ay, 9, 0, TAU); g.stroke();
  },
  // V08 邊界約束：L 形基地（虛線）內多棵樹填滿，出界的新形狀改標為 C（灰點）
  function(g, W, H, r, c){
    g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 1; for(let x = 0; x < W; x += 14){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); } for(let y = 0; y < H; y += 14){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
    const j = () => (r()-.5)*W*.05;
    const B = [[W*.06, H*.93], [W*.94, H*.93], [W*.94 + j(), H*.52], [W*.6 + j(), H*.42], [W*.52, H*.06], [W*.08 + j(), H*.1]];
    g.fillStyle = U.rgba(c,.08); U.poly(g, B, true); g.fill(); g.setLineDash([6,4]); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.4; g.stroke(); g.setLineDash([]);
    const roots = [[.2, .15], [.46, .13], [.74, .12]];
    roots.forEach(([fx, fs]) => { const s0 = W*fs, x = W*fx - s0/2;
      const T = grow(sqr([x, H*.93 - 1], [s0, 0], 0), q => { if(q.bad || q.d >= 10) return [];
        const k = pythKids(q, (35 + r()*20)*D2R); k.forEach(z => { if(!z.pts.every(p => inside(p, B))) z.bad = true; }); return k; });
      T.forEach(q => { if(q.bad){ const [x,y] = ctr(q); g.fillStyle = "rgba(255,255,255,.45)"; g.beginPath(); g.arc(x, y, Math.max(1.5, Math.min(4, q.s*.15)), 0, TAU); g.fill(); return; }
        U.poly(g, q.pts, true); g.fillStyle = U.rgba(c, .9 - q.d*.055); g.fill(); g.strokeStyle = "rgba(0,0,0,.3)"; g.lineWidth = .5; g.stroke(); });
    });
  },
  // V09 標籤驅動構件：平面文法 → 2.5D 虛實模型（B 牆、C 植栽、A 留空）
  function(g, W, H, r, c){
    const F = [], cells = [];
    const rec = (x,y,s,d) => { if(d < 3 && (d < 2 || r() < .6)){ const h = s/2; rec(x,y,h,d+1); rec(x+h,y,h,d+1); rec(x,y+h,h,d+1); rec(x+h,y+h,h,d+1); } else cells.push([x,y,s]); };
    rec(0,0,8,0);
    box(F, -.2, -.2, -.3, 8.4, 8.4, .3, "#2E2A33");
    cells.forEach(([x,y,s]) => { const p = r(), m = .08;
      if(p < .42) box(F, x+m, y+m, 0, s-2*m, s-2*m, s*(.5 + r()*.9), c);
      else if(p < .7){ box(F, x+m, y+m, 0, s-2*m, s-2*m, .08, "#3E6B45"); const t = s*.18; box(F, x+s/2-t, y+s/2-t, .08, 2*t, 2*t, 2*t, LEAF); }
      else box(F, x+m, y+m, 0, s-2*m, s-2*m, .04, "#5A5560"); });
    render(g, F, ISO, W*.03, H*.04, W*.94, H*.92, {line:"rgba(0,0,0,.45)", lw:.5});
  },
  // V10 逐代動畫：2×3 小圖顯示第 0–5 代，新長出的是白色
  function(g, W, H, r, c){
    const angs = []; for(let i = 0; i < 64; i++) angs.push((36 + r()*18)*D2R);
    const cw = W/2, ch = H/3;
    for(let gen = 0; gen < 6; gen++){ const i = gen%2, j = (gen/2)|0, x = i*cw, y = j*ch;
      g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; g.strokeRect(x+3, y+3, cw-6, ch-6);
      let id = 0; const T = grow(sqr([0,0],[1,0],0), q => { const a = angs[(q.d*7 + id++) % 64]; return q.d >= gen ? [] : pythKids(q, a); });
      const ref = grow(sqr([0,0],[1,0],0), q => q.d >= 5 ? [] : pythKids(q, 45*D2R)); const all = T.concat([{pts:ref.flatMap(z => z.pts), s:1}]);
      fit(all, x + cw*.1, y + ch*.12, cw*.8, ch*.72, true);
      T.forEach(q => { U.poly(g, q.pts, true); g.fillStyle = q.d === gen ? "#FFFFFF" : U.rgba(c, .35 + .5*q.d/6); g.fill(); });
      for(let k = 0; k <= gen; k++){ g.fillStyle = k === gen ? c : "rgba(255,255,255,.3)"; g.fillRect(x + 9 + k*6, y + 9, 4, 4); }
    }
  },
  // V11 混合 L-System：上層是字串逐代改寫的推導樹（A01 語彙），左下是「字元→形狀規則」對照，右下是照字串長出的形狀
  function(g, W, H, r, c){
    const R = {B:"BLR", L:"LB", R:"RSB", S:"S"}, col = {B:c, L:AMB, R:SKY, S:"rgba(255,255,255,.6)"};
    const gens = ["B"]; for(let i = 0; i < 5; i++) gens.push(gens[i].split("").map(ch => R[ch] || ch).join(""));
    const glyph = (ch, x, y, s) => { g.fillStyle = col[ch];
      if(ch === "L"){ U.poly(g, [[x+s*.85,y+s*.08],[x+s*.85,y+s*.92],[x+s*.12,y+s*.5]], true); g.fill(); }
      else if(ch === "R"){ U.poly(g, [[x+s*.15,y+s*.08],[x+s*.15,y+s*.92],[x+s*.88,y+s*.5]], true); g.fill(); }
      else if(ch === "S"){ g.beginPath(); g.arc(x+s*.5, y+s*.5, s*.28, 0, TAU); g.fill(); }
      else g.fillRect(x+s*.1, y+s*.1, s*.8, s*.8); };
    // 上層：第 0–3 代字串（1、3、8、20 個字元），每個字元連到它改寫出的子字串
    const tx = W*.05, tw = W*.9, n3 = gens[3].length, bw = tw/n3, rowY = k => H*(.04 + k*.085);
    const pos = gens.slice(0, 4).map(s => { const x0 = tx + (tw - s.length*bw)/2; return s.split("").map((ch, i) => x0 + (i+.5)*bw); });
    g.lineWidth = .8;
    for(let k = 0; k < 3; k++){ let j = 0; gens[k].split("").forEach((ch, i) => { const m = (R[ch] || ch).length;
      for(let t = 0; t < m; t++){ g.strokeStyle = U.rgba(col[ch] === col.S ? "#FFFFFF" : col[ch], .45); g.beginPath(); g.moveTo(pos[k][i], rowY(k) + bw*.9); g.lineTo(pos[k+1][j+t], rowY(k+1) + bw*.1); g.stroke(); }
      j += m; }); }
    gens.slice(0, 4).forEach((s, k) => s.split("").forEach((ch, i) => glyph(ch, pos[k][i] - bw/2, rowY(k), bw)));
    const sep = rowY(3) + bw + H*.03; g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(W*.04, sep, W*.92, 1);
    // 左下：規則對照（字元 → 套用的形狀規則）
    const ly = sep + H*.04, lh = (H*.96 - ly)/4, ls = Math.min(lh*.42, W*.06);
    ["B","L","R","S"].forEach((ch, k) => { const y = ly + k*lh; glyph(ch, W*.05, y + lh*.2, ls);
      g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.beginPath(); g.moveTo(W*.05 + ls*1.2, y + lh*.2 + ls/2); g.lineTo(W*.05 + ls*1.9, y + lh*.2 + ls/2); g.stroke();
      const q = sqr([0,0],[1,0],0), kids = ch === "S" ? [] : pythKids(q, (ch === "L" ? 30 : ch === "R" ? 60 : 45)*D2R), use = ch === "L" ? [kids[0]] : ch === "R" ? [kids[1]] : kids, all = [q].concat(use);
      fit(all, W*.05 + ls*2.1, y + lh*.05, lh*.85, lh*.8, true);
      all.forEach((z, i) => { U.poly(g, z.pts, true); g.fillStyle = i ? U.rgba(col[ch] === col.S ? "#FFFFFF" : col[ch], .9) : "rgba(255,255,255,.18)"; g.fill(); });
      if(ch === "S"){ const [x, yy] = ctr(q); g.strokeStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.moveTo(x-3, yy-3); g.lineTo(x+3, yy+3); g.moveTo(x+3, yy-3); g.lineTo(x-3, yy+3); g.stroke(); } });
    g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(W*.34, sep + H*.03, 1, H*.93 - sep);
    // 右下：依第 5 代字串逐字元決定每個 A 的規則
    const s = gens[5]; let idx = 1;
    const T = grow(sqr([0,0],[1,0],0), q => { const ch = q.d === 0 ? "B" : s[idx++ % s.length]; q.ch = ch; if(q.d >= 9 || ch === "S") return [];
      const k = pythKids(q, (ch === "L" ? 30 : ch === "R" ? 60 : 45)*D2R); return ch === "L" ? [k[0]] : ch === "R" ? [k[1]] : k; });
    fit(T, W*.38, sep + H*.03, W*.58, H*.95 - sep - H*.03, true);
    T.forEach(q => { U.poly(g, q.pts, true); g.fillStyle = col[q.ch]; g.globalAlpha = .88; g.fill(); g.globalAlpha = 1; });
  },
  // V12 雷切片材：每個正方形內縮並加卡榫，排版在板材上
  function(g, W, H, r, c){
    const T = grow(sqr([0,0],[1,0],0), q => q.d >= 5 ? [] : pythKids(q, 45*D2R)), sizes = T.map(q => q.s).sort((a,b) => b-a);
    const sx = W*.06, sy = H*.1, sw = W*.88, sh = H*.8;
    g.fillStyle = "#C9A77C"; g.fillRect(sx, sy, sw, sh); g.fillStyle = "rgba(0,0,0,.08)"; for(let i = 0; i < 30; i++) g.fillRect(sx, sy + r()*sh, sw, .8);
    const k = sw*.3/sizes[0]; let x = sx + 8, y = sy + 8, rowH = 0, num = 0;
    sizes.forEach(s0 => { const s = s0*k; if(x + s > sx + sw - 6){ x = sx + 8; y += rowH + 6; rowH = 0; } if(y + s > sy + sh - 6) return;
      const nt = Math.max(3, s*.12), P = [];  // 上、下邊中央各一個卡榫缺口
      P.push([x,y],[x+s/2-nt,y],[x+s/2-nt,y+nt],[x+s/2+nt,y+nt],[x+s/2+nt,y],[x+s,y],[x+s,y+s],[x+s/2+nt,y+s],[x+s/2+nt,y+s-nt],[x+s/2-nt,y+s-nt],[x+s/2-nt,y+s],[x,y+s]);
      strokePoly(g, P, "#D0231B", 1); num++;
      g.fillStyle = "rgba(60,30,10,.7)"; for(let d = 0; d < Math.min(num,6); d++) g.fillRect(x + 4 + d*3.2, y + s - nt - 5, 2, 2);
      x += s + 6; rowH = Math.max(rowH, s); });
    g.strokeStyle = "#FFFFFF"; g.lineWidth = 1; [[sx,sy],[sx+sw,sy],[sx,sy+sh],[sx+sw,sy+sh]].forEach(([a,b]) => { g.beginPath(); g.moveTo(a-6,b); g.lineTo(a+6,b); g.moveTo(a,b-6); g.lineTo(a,b+6); g.stroke(); });
  },
];

ART.var["A05"][8].ratio = .78;   // V09 模型扁平，改用寬卡避免上方大片空白
ART.var["A05"][7].ratio = 1.1;
ART.var["A05"][0].ratio = .78;  // V01 三棵樹並排，用寬卡

/* ================= 沒有照片的案例 ================= */
// 小工具：畫一幅 Stiny 式「正方形內接正方形」抽象畫
function stinyPainting(g, x, y, s, r, c, depth){
  const rec = (P, d) => { U.poly(g, P, true); g.strokeStyle = d%2 ? "#FFFFFF" : c; g.lineWidth = 1; g.stroke();
    if(d%3 === 1 && r() < .6){ g.fillStyle = U.rgba(d%2 ? c : AMB, .35); g.fill(); }
    if(d >= depth) return; const t = .3 + r()*.4; rec(P.map((p,i) => lerp(p, P[(i+1)%4], t)), d+1);
    if(d < 2 && r() < .5) rec(P.map((p,i) => lerp(p, P[(i+2)%4], .25)), d+2); };
  rec([[x,y],[x+s,y],[x+s,y+s],[x,y+s]], 0);
}

// A05-01 Stiny & Gips：展間透視，牆上三幅文法畫＋台座上的雕塑
ART.case["A05-01"] = function(g, W, H, r, c){
  const hz = H*.62, vx = W*.5;
  g.fillStyle = "#26222A"; g.fillRect(W*.1, H*.08, W*.8, hz - H*.08);
  g.fillStyle = "#1A171D"; U.poly(g, [[W*.1,hz],[W*.9,hz],[W,H],[0,H]], true); g.fill();
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; U.poly(g, [[0,0],[W*.1,H*.08],[W*.1,hz],[0,H]], false); g.stroke(); U.poly(g, [[W,0],[W*.9,H*.08],[W*.9,hz],[W,H]], false); g.stroke();
  for(let i = 0; i < 6; i++){ const t = i/5; g.beginPath(); g.moveTo(W*(.1+.8*t), hz); g.lineTo(W*t, H); g.stroke(); }
  const s = W*.19; [0,1,2].forEach(i => { const x = W*.16 + i*(s + W*.05), y = H*.2; g.fillStyle = "#0F0D12"; g.fillRect(x-3, y-3, s+6, s+6);
    glow(g, x+s/2, y - H*.06, s*.7, "#FFE3C4", .12); stinyPainting(g, x+3, y+3, s-6, r, c, 5 + i); });
  g.fillStyle = "#DDD6CC"; g.fillRect(vx - W*.07, H*.74, W*.14, H*.16); g.fillStyle = "#B7AFA4"; g.fillRect(vx - W*.07, H*.74, W*.14, H*.02);
  const F = []; let z = 0, sz = 1; for(let i = 0; i < 4; i++){ const a = i%2 ? .15 : 0; box(F, -sz/2 + a, -sz/2 + a, z, sz, sz, sz*.6, i%2 ? "#FFFFFF" : c); z += sz*.6; sz *= .72; }
  render(g, F, ISO, vx - W*.07, H*.56, W*.14, H*.18, {bottom:true});
};
ART.case["A05-01"].ratio = .85;

// A05-02 帕拉底歐別墅平面：對稱格線 → 房間、牆、柱廊
ART.case["A05-02"] = function(g, W, H, r, c){
  const a = 1 + r()*.4, b = 1.4 + r()*.5, cx = [a, b, 2.2, b, a], ry = [1.2 + r()*.4, 1.8 + r()*.5, 1.2 + r()*.4], tw = cx.reduce((p,q) => p+q), th = ry.reduce((p,q) => p+q) + 1.1;
  const k = Math.min(W*.84/tw, H*.84/th), ox = (W - tw*k)/2, oy = (H - th*k)/2;
  const X = [0]; cx.forEach(v => X.push(X[X.length-1] + v)); const Y = [0]; ry.forEach(v => Y.push(Y[Y.length-1] + v));
  const px = v => ox + v*k, py = v => oy + v*k;
  g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(px(0), py(0), tw*k, Y[3]*k);
  g.fillStyle = U.rgba(c,.3); g.fillRect(px(X[2]), py(Y[0]), cx[2]*k, (Y[2])*k);  // 中央大廳
  g.fillStyle = U.rgba(c,.16); g.fillRect(px(X[1]), py(Y[1]), (X[4]-X[1])*k, ry[1]*k);
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = .6;
  X.forEach(x => { g.beginPath(); g.moveTo(px(x), py(-.3)); g.lineTo(px(x), py(th - .2)); g.stroke(); }); Y.forEach(y => { g.beginPath(); g.moveTo(px(-.2), py(y)); g.lineTo(px(tw+.2), py(y)); g.stroke(); });
  g.strokeStyle = "#F3E6D6"; g.lineWidth = Math.max(2.5, k*.14); g.strokeRect(px(0), py(0), tw*k, Y[3]*k);
  const merge = [r() < .5, r() < .5];  // 對稱合併房間
  g.lineWidth = Math.max(1.6, k*.08);
  [1,2,3,4].forEach(i => { const x = px(X[i]); for(let j = 0; j < 3; j++){ if(j === 1 && (i === 2 || i === 3)) continue; if(merge[0] && j === 2 && (i === 1 || i === 4)) continue;
    const y1 = py(Y[j]), y2 = py(Y[j+1]), m = (y1+y2)/2, dw = k*.28; g.beginPath(); g.moveTo(x, y1); g.lineTo(x, m - dw); g.moveTo(x, m + dw); g.lineTo(x, y2); g.stroke(); } });
  [1,2].forEach(j => { const y = py(Y[j]); for(let i = 0; i < 5; i++){ if(i === 2) continue; if(merge[1] && j === 1 && (i === 0 || i === 4)) continue;
    const x1 = px(X[i]), x2 = px(X[i+1]), m = (x1+x2)/2, dw = k*.25; g.beginPath(); g.moveTo(x1, y); g.lineTo(m - dw, y); g.moveTo(m + dw, y); g.lineTo(x2, y); g.stroke(); } });
  // 柱廊與台階
  const pl = X[1], pr = X[4], py0 = Y[3], pd = .9; g.fillStyle = U.rgba(c,.12); g.fillRect(px(pl), py(py0), (pr-pl)*k, pd*k);
  const nc = 6; for(let i = 0; i < nc; i++){ const x = px(pl + .25 + i*(pr-pl-.5)/(nc-1)); g.fillStyle = "#F3E6D6"; g.beginPath(); g.arc(x, py(py0 + .3), Math.max(2, k*.13), 0, TAU); g.fill(); }
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = .8; for(let i = 0; i < 4; i++){ const y = py(py0 + pd*.55 + i*.12); g.beginPath(); g.moveTo(px(X[2] - .2), y); g.lineTo(px(X[3] + .2), y); g.stroke(); }
  g.setLineDash([6,3,1,3]); g.strokeStyle = U.rgba(AMB,.7); g.beginPath(); g.moveTo(W/2, py(-.4)); g.lineTo(W/2, py(th)); g.stroke(); g.setLineDash([]);
};
ART.case["A05-02"].ratio = 1.1;

// A05-03 萊特草原住宅：壁爐核心＋十字翼＋深出簷的低矮量體（等角）
ART.case["A05-03"] = function(g, W, H, r, c){
  const F = [], arm = [2.5 + r()*2, 1.5 + r()*1.5, 2.5 + r()*2.5, 1 + r()*1.5];
  box(F, -1.4, -1.4, 0, 2.8, 2.8, 1.1, "#E9E2D6");
  const wings = [[-1.2, -1.2 - arm[1], 2.4, arm[1]], [1.2, -1.1, arm[0], 2.2], [-1.1, 1.2, 2.2, arm[3]], [-1.2 - arm[2], -1, arm[2], 2]];
  wings.forEach(([x,y,w,d]) => { box(F, x, y, 0, w, d, .9, "#E9E2D6"); box(F, x+.05, y+.05, .45, w-.1, d-.1, .22, "#2A2F3A", {line:null}); box(F, x - .45, y - .45, .9, w + .9, d + .9, .12, c); });
  box(F, -1.9, -1.9, 1.1, 3.8, 3.8, .14, c); box(F, -1.3, -1.3, 1.24, 2.6, 2.6, .5, "#E9E2D6"); box(F, -1.7, -1.7, 1.74, 3.4, 3.4, .12, c);
  box(F, -.4, -.4, 0, .8, .8, 2.6, "#B8836A");  // 壁爐煙囪
  box(F, -1.2 - arm[2] - 1.2, 1.2, 0, 2.5, 1.6, .15, "#3E6B45", {line:"rgba(0,0,0,.2)"});
  render(g, F, ISO, W*.04, H*.12, W*.92, H*.76, {line:"rgba(0,0,0,.35)", lw:.5,
    under:map => isoGrid(g, map, 16, 1, 0, "rgba(255,255,255,.04)")});
};
ART.case["A05-03"].ratio = .8;

// A05-04 Siza Malagueira：連棟合院街廓鳥瞰，L／U 型量體＋空中水道
ART.case["A05-04"] = function(g, W, H, r, c){
  g.save(); g.translate(W/2, H/2); g.rotate(-.18); const rows = 4, lots = 9, lw = W*1.2/lots, rh = H*.2, x0 = -W*.6, y0 = -rows*(rh + H*.04)/2;
  for(let j = 0; j < rows; j++){ const y = y0 + j*(rh + H*.04);
    g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(x0, y + rh, W*1.2, H*.04);  // 街道
    for(let i = 0; i < lots; i++){ const x = x0 + i*lw, flip = j%2, t = r();
      g.fillStyle = U.rgba(c,.22); g.fillRect(x+1, y+1, lw-2, rh-2);
      g.fillStyle = "#F1ECE3"; const bd = rh*.45;
      const by = flip ? y + rh - bd : y; g.fillRect(x+1, by, lw-2, bd);                    // 臨街主量體
      if(t < .66) g.fillRect(x+1, y+1, lw*.35, rh-2);                                     // L 型側翼
      if(t < .33) g.fillRect(x + lw*.65, flip ? y + 1 : y + rh*.5, lw*.35 - 1, rh*.5 - 1); // U 型
      g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = .6; g.strokeRect(x+1, y+1, lw-2, rh-2); }
    if(j%2 === 0){ const yy = y + rh + H*.02; g.strokeStyle = "#C9C2B6"; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 + W*1.2, yy); g.stroke();
      g.fillStyle = "#C9C2B6"; for(let x = x0; x < x0 + W*1.2; x += lw*1.5) g.fillRect(x, yy - 4, 3, 8); }
  }
  g.restore();
};
ART.case["A05-04"].ratio = 1;

// A05-05 CGA／龐貝：等角鳥瞰的程序化古城，街廓內大量小屋與瓦屋頂
ART.case["A05-05"] = function(g, W, H, r, c){
  const F = [], B = 4, bs = 5, st = 1;
  for(let bi = 0; bi < B; bi++) for(let bj = 0; bj < B; bj++){ const X = bi*(bs+st), Y = bj*(bs+st);
    box(F, X, Y, -.1, bs, bs, .1, "#3A3540", {line:null, k:-100});
    for(let i = 0; i < bs; i++) for(let j = 0; j < bs; j++){ if(i > 0 && i < bs-1 && j > 0 && j < bs-1 && r() < .7) continue;  // 中庭留空
      const h = .6 + r()*1.1; box(F, X+i+.05, Y+j+.05, 0, .9, .9, h, "#E6D9C3");
      gable(F, X+i+.02, Y+j+.02, h, .96, .96, .35, r() < .5, c, {line:"rgba(0,0,0,.3)"}); } }
  render(g, F, ISO, W*.02, H*.06, W*.96, H*.88, {line:"rgba(0,0,0,.35)", lw:.4});
};
ART.case["A05-05"].ratio = .8;

// A05-06 CityEngine 立面建模：透視線框，分割線、選取樓層、節點與軸向小工具
ART.case["A05-06"] = function(g, W, H, r, c){
  const F = [], w = 4, d = 3, h = 7, fl = 7, bays = 5, gh = 1.4, fh = (h - gh - .3)/fl;
  box(F, 0, 0, 0, w, d, h, "#2B2A33", {line:"rgba(255,255,255,.7)", lw:1});
  const pr = persp(-.55, .18, 16);
  const map = render(g, F, pr, W*.12, H*.08, W*.76, H*.8, {bottom:true,
    under:(m) => { g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = .6; for(let i = -6; i <= 10; i++){ const a = m([i,-6,0]), b = m([i,10,0]), c2 = m([-6,i,0]), e = m([10,i,0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.moveTo(c2[0],c2[1]); g.lineTo(e[0],e[1]); g.stroke(); } }});
  const L = (a,b,col,lw) => { const p = map(a), q = map(b); g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); };
  const sel = 2 + ((r()*(fl-3))|0);
  for(let f = 0; f <= fl; f++){ const z = gh + f*fh; L([0,d,z],[w,d,z], "rgba(255,255,255,.45)", .8); L([w,0,z],[w,d,z], "rgba(255,255,255,.45)", .8); }
  const qz = gh + sel*fh; U.poly(g, [map([0,d,qz]), map([w,d,qz]), map([w,d,qz+fh]), map([0,d,qz+fh])], true); g.fillStyle = U.rgba(c,.45); g.fill(); g.strokeStyle = c; g.lineWidth = 1.5; g.stroke();
  for(let f = 0; f < fl; f++) for(let b = 0; b < bays; b++){ const z = gh + f*fh + fh*.25, x = b*w/bays + w/bays*.25, ww = w/bays*.5, wh = fh*.5;
    U.poly(g, [map([x,d,z]), map([x+ww,d,z]), map([x+ww,d,z+wh]), map([x,d,z+wh])], true); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = .7; g.stroke(); }
  for(let f = 0; f < fl; f++) for(let b = 0; b < 3; b++){ const z = gh + f*fh + fh*.25, y = b*d/3 + d/3*.25, ww = d/3*.5, wh = fh*.5;
    U.poly(g, [map([w,y,z]), map([w,y+ww,z]), map([w,y+ww,z+wh]), map([w,y,z+wh])], true); g.strokeStyle = "rgba(255,255,255,.3)"; g.stroke(); }
  [[0,d,0],[w,d,0],[w,0,0],[0,d,h],[w,d,h],[w,0,h],[0,0,h]].forEach(p => { const q = map(p); g.fillStyle = "#FFFFFF"; g.fillRect(q[0]-2.5, q[1]-2.5, 5, 5); });
  const o = [W*.1, H*.93]; [["#E4572E",[18,4]],["#3FA34D",[-12,6]],["#2F6FE4",[0,-18]]].forEach(([col,v]) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(o[0],o[1]); g.lineTo(o[0]+v[0], o[1]+v[1]); g.stroke(); });
};
ART.case["A05-06"].ratio = 1.3;

// A05-07 冰裂紋：圓形月洞窗，格片依面積填色
ART.case["A05-07"] = function(g, W, H, r, c){
  const cx = W/2, cy = H/2, R = Math.min(W,H)*.4, P0 = [];
  g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 1; for(let y = 0; y < H; y += 9){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); for(let x = ((y/9)%2)*14; x < W; x += 28){ g.beginPath(); g.moveTo(x,y); g.lineTo(x,y+9); g.stroke(); } }
  for(let i = 0; i < 28; i++){ const a = i/28*TAU; P0.push([cx + Math.cos(a)*R, cy + Math.sin(a)*R]); }
  g.fillStyle = "#16121A"; U.poly(g, P0, true); g.fill();
  const cells = iceRay(P0, r, R*R/34), maxA = Math.max(...cells.map(area));
  cells.forEach(P => { U.poly(g, P, true); g.fillStyle = U.rgba(c, .08 + .6*(1 - Math.sqrt(area(P)/maxA))); g.fill(); g.strokeStyle = "#F3E6D6"; g.lineWidth = 1.6; g.stroke(); });
  g.strokeStyle = "#8C7A6B"; g.lineWidth = R*.12; g.beginPath(); g.arc(cx, cy, R + R*.06, 0, TAU); g.stroke();
};
ART.case["A05-07"].ratio = 1;

// A05-08 冰裂紋 GH 實作：透視視窗中的格柵面板、頂點節點、下方電池連線
ART.case["A05-08"] = function(g, W, H, r, c){
  const cells = iceRay([[0,0],[1,0],[1,1.4],[0,1.4]], r, 1.4/40), F = [], pr = persp(.5, .95, 4.2);
  F.push({p:[[0,0,0],[1,0,0],[1,1.4,0],[0,1.4,0]].map(p => [p[0]-.5, p[1]-.7, 0]), col:"#2A2530", line:"rgba(255,255,255,.3)", k:-1});
  const map = render(g, F, pr, W*.1, H*.06, W*.8, H*.56, {under:(m) => { g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = .6;
    for(let i = -8; i <= 8; i++){ const a = m([i*.2,-1.6,0]), b = m([i*.2,1.6,0]), c2 = m([-1.6,i*.2,0]), e = m([1.6,i*.2,0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.moveTo(c2[0],c2[1]); g.lineTo(e[0],e[1]); g.stroke(); } }});
  const M = p => map([p[0]-.5, p[1]-.7, 0]);
  cells.forEach((P,i) => { U.poly(g, P.map(M), true); if(i%7 === 0){ g.fillStyle = U.rgba(c,.35); g.fill(); } g.strokeStyle = "#7CD67C"; g.lineWidth = 1; g.stroke(); });
  g.fillStyle = "#FFFFFF"; cells.forEach(P => P.forEach(p => { const q = M(p); g.fillRect(q[0]-1.2, q[1]-1.2, 2.4, 2.4); }));
  // 下方：Grasshopper 電池與連線
  const y0 = H*.72, bx = [W*.04, W*.29, W*.54, W*.79], bh = H*.13, bw = W*.17;
  g.fillStyle = "#2C2C35"; g.fillRect(0, y0 - H*.04, W, H*.32);
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.2;
  for(let i = 0; i < 3; i++){ const a = [bx[i]+bw, y0 + bh*.5], b = [bx[i+1], y0 + bh*(.3 + .4*(i%2))]; g.beginPath(); g.moveTo(a[0],a[1]); g.bezierCurveTo(a[0]+20,a[1],b[0]-20,b[1],b[0],b[1]); g.stroke(); }
  bx.forEach((x,i) => { g.fillStyle = i === 2 ? U.rgba(c,.9) : "#D7D3CC"; g.fillRect(x, y0, bw, bh);
    g.fillStyle = "#1C1C24"; for(let k = 0; k < 2; k++) g.fillRect(x + bw*.2, y0 + bh*(.3 + k*.3), bw*.6, 2); });
  g.fillStyle = "#9A968F"; g.fillRect(W*.29, y0 + bh + 8, W*.22, 3); g.fillStyle = c; g.beginPath(); g.arc(W*.29 + W*.22*r(), y0 + bh + 9.5, 4, 0, TAU); g.fill();
};
ART.case["A05-08"].ratio = 1.2;

// A05-09 蒙兀兒四分花園：水道十字分割、象限遞迴細分、中央水池、北端陵墓
ART.case["A05-09"] = function(g, W, H, r, c){
  const S = Math.min(W, H*.8)*.9, x0 = (W-S)/2, y0 = H - S - H*.04;
  g.fillStyle = "#1F2A22"; g.fillRect(x0, y0, S, S); g.strokeStyle = "#D9CDBB"; g.lineWidth = 4; g.strokeRect(x0, y0, S, S);
  const quad = (x,y,s,d) => { if(d > 2){ g.fillStyle = "#2D4A33"; g.fillRect(x+2, y+2, s-4, s-4); const n = r() < .5 ? 1 : 2;
      for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){ g.fillStyle = LEAF; g.beginPath(); g.arc(x + s*(i+.5)/n, y + s*(j+.5)/n, s*.12/n + 1, 0, TAU); g.fill(); } return; }
    const h = s/2, pw = s*.05; quad(x,y,h,d+1); quad(x+h,y,h,d+1); quad(x,y+h,h,d+1); quad(x+h,y+h,h,d+1);
    g.fillStyle = d === 0 ? "#5FA8D8" : "#CBBFA9"; g.fillRect(x + h - pw/2, y, pw, s); g.fillRect(x, y + h - pw/2, s, pw); };
  quad(x0 + 6, y0 + 6, S - 12, 0);
  const cx = x0 + S/2, cy = y0 + S/2, pr = S*.08; g.fillStyle = "#D9CDBB"; g.fillRect(cx - pr*1.3, cy - pr*1.3, pr*2.6, pr*2.6); g.fillStyle = "#5FA8D8"; g.fillRect(cx - pr, cy - pr, pr*2, pr*2);
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(cx, cy, pr*.3, 0, TAU); g.fill();
  const mw = S*.34, my = y0 - H*.05; g.fillStyle = "#EDE7DC"; g.fillRect(cx - mw/2, my - S*.07, mw, S*.1);
  g.beginPath(); g.arc(cx, my - S*.07, S*.075, Math.PI, 0); g.fill(); [-1,1].forEach(k => { g.fillRect(cx + k*mw*.62 - 2, my - S*.14, 4, S*.17); });
  g.fillStyle = U.rgba(c,.8); g.fillRect(cx - mw/2, my + S*.03, mw, 3);
};
ART.case["A05-09"].ratio = 1.15;

// A05-10 Queen Anne：多重山牆、門廊、圓塔與圓錐屋頂的量體組合
ART.case["A05-10"] = function(g, W, H, r, c){
  const F = [], wall = "#E9DCC6", roof = c;
  box(F, 0, 0, 0, 4, 3, 2.2, wall); gable(F, -.15, -.15, 2.2, 4.3, 3.3, 1.5, true, roof);
  box(F, 2.2, 3, 0, 1.8, 1.4, 2, wall); gable(F, 2.1, 3, 2, 2, 1.55, 1.2, false, roof);
  box(F, -1.6, .5, 0, 1.6, 1.8, 1.5, wall); gable(F, -1.7, .4, 1.5, 1.8, 2, .9, true, roof);
  box(F, 0, 3, 0, 2.2, 1.1, .12, "#CFC3AD"); for(let i = 0; i < 4; i++) box(F, .1 + i*.65, 3.95, .12, .08, .08, 1, "#FFFFFF"); box(F, 0, 3, 1.1, 2.2, 1.1, .1, roof);
  // 圓塔：多邊形柱＋圓錐
  const tx = 4, ty = 3.2, tr = .75, n = 14, th = 3.4;
  for(let i = 0; i < n; i++){ const a = i/n*TAU, b = (i+1)/n*TAU, p = [tx + Math.cos(a)*tr, ty + Math.sin(a)*tr], q = [tx + Math.cos(b)*tr, ty + Math.sin(b)*tr];
    F.push({p:[[...p,0],[...q,0],[...q,th],[...p,th]], col:wall, line:null});
    F.push({p:[[tx + Math.cos(a)*tr*1.15, ty + Math.sin(a)*tr*1.15, th],[tx + Math.cos(b)*tr*1.15, ty + Math.sin(b)*tr*1.15, th],[tx, ty, th + 1.8]], col:roof, line:"rgba(0,0,0,.2)", k:.3}); }
  box(F, 1.2, 1, 2.5, .4, .4, 1.6, "#9C6B57");
  render(g, F, ISO, W*.06, H*.06, W*.88, H*.86, {line:"rgba(0,0,0,.35)", lw:.5, bottom:true});
};
ART.case["A05-10"].ratio = 1.05;

// A05-11 帕拉底歐構築文法：爆炸軸測的構件（基座、牆片、柱列、屋頂）與組裝虛線
ART.case["A05-11"] = function(g, W, H, r, c){
  const F = [], lift = 1.6 + r()*.6, w = 6, d = 4;
  box(F, 0, 0, 0, w, d, .35, "#8C8590");
  [[0,0,w,.2],[0,d-.2,w,.2],[0,0,.2,d],[w-.2,0,.2,d],[2,0,.2,d],[w-2.2,0,.2,d]].forEach(([x,y,ww,dd]) => box(F, x, y, .35 + lift, ww, dd, 1.8, "#EFE7DA"));
  for(let i = 0; i < 6; i++) box(F, 1 + i*.8, d + .9, .35 + lift*.5, .22, .22, 1.8, "#FFFFFF");
  box(F, .8, d + .6, .35 + lift*.5 + 1.8, 4.4, .8, .15, "#EFE7DA");
  const rz = .35 + lift*2 + 1.8, ap = [w/2, d/2, rz + 1.3]; [[0,0],[w,0],[w,d],[0,d]].forEach((p,i,A) => { const q = A[(i+1)%4]; F.push({p:[[p[0],p[1],rz],[q[0],q[1],rz],ap], col:c}); });
  [[0,0],[w,0],[w,d],[0,d]].forEach(([x,y]) => F.push({p:[[x,y,.35],[x,y,rz]], open:true, line:"rgba(255,255,255,.35)", dash:[3,3], k:-50}));
  render(g, F, ISO, W*.1, H*.05, W*.8, H*.9, {line:"rgba(0,0,0,.4)", lw:.5});
};
ART.case["A05-11"].ratio = 1.3;

// A05-12 eifForm：形狀退火後的平面桁架，桿件色與粗細＝內力，支承與載重箭頭
ART.case["A05-12"] = function(g, W, H, r, c){
  const n = 8 + ((r()*3)|0), x0 = W*.08, x1 = W*.92, yb = H*.62, span = x1 - x0, hmax = H*.34;
  const bot = [], top = []; for(let i = 0; i <= n; i++){ const t = i/n; bot.push([x0 + t*span, yb + (r()-.5)*4]); }
  for(let i = 0; i < n; i++){ const t = (i+.5)/n; top.push([x0 + t*span + (r()-.5)*span/n*.4, yb - hmax*(.35 + .65*Math.sin(t*Math.PI))*(.85 + r()*.3)]); }
  const M = [];  // [a, b, 力（正拉負壓）]
  for(let i = 0; i < n; i++){ const t = (i+.5)/n; M.push([bot[i], bot[i+1], t*(1-t)*4]); M.push([bot[i], top[i], -(1 - 2*t)*.9]); M.push([top[i], bot[i+1], (1 - 2*t)*.9]); }
  for(let i = 0; i < n-1; i++){ const t = (i+1)/n; M.push([top[i], top[i+1], -t*(1-t)*4]); }
  const col = f => f > 0 ? c : SKY;
  g.lineCap = "round";
  M.sort((a,b) => Math.abs(a[2]) - Math.abs(b[2])).forEach(([a,b,f]) => { g.strokeStyle = U.rgba(col(f), .35 + .65*Math.min(1,Math.abs(f))); g.lineWidth = 1 + Math.abs(f)*4; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); });
  top.concat(bot).forEach(p => { g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(p[0], p[1], 2.2, 0, TAU); g.fill(); });
  [bot[0], bot[n]].forEach(p => { g.fillStyle = "rgba(255,255,255,.7)"; U.poly(g, [[p[0],p[1]+3],[p[0]-8,p[1]+15],[p[0]+8,p[1]+15]], true); g.fill(); });
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; top.forEach(p => { g.beginPath(); g.moveTo(p[0], p[1] - 22); g.lineTo(p[0], p[1] - 6); g.moveTo(p[0]-3, p[1]-10); g.lineTo(p[0], p[1]-6); g.lineTo(p[0]+3, p[1]-10); g.stroke(); });
  const gr = g.createLinearGradient(W*.25, 0, W*.75, 0); gr.addColorStop(0, SKY); gr.addColorStop(.5, "#3A3A44"); gr.addColorStop(1, c); g.fillStyle = gr; g.fillRect(W*.25, H*.86, W*.5, 6);
  g.fillStyle = "rgba(255,255,255,.5)"; [0,.5,1].forEach(t => g.fillRect(W*.25 + t*W*.5 - .5, H*.86 + 8, 1, 4));
};
ART.case["A05-12"].ratio = .8;

// A05-13 Diebenkorn《Ocean Park》：水平／垂直分割的色塊畫面，筆觸與炭筆線
ART.case["A05-13"] = function(g, W, H, r, c){
  const x0 = W*.08, y0 = H*.06, w = W*.84, h = H*.88, pal = ["#A8C6D8","#D9CFB0","#7FA6BF","#E8E1D0","#C7B27A","#9DB7A0", U.rgba(c,.8)];
  g.fillStyle = "#0E0D11"; g.fillRect(x0-4, y0-4, w+8, h+8);
  const R = []; const split = (x,y,ww,hh,d) => { if(d > 3 || (d > 1 && r() < .3)){ R.push([x,y,ww,hh]); return; }
    if(d === 0){ const s = hh*(.18 + r()*.12); split(x,y,ww,s,d+1); split(x,y+s,ww,hh-s,d+1); return; }
    if(r() < .55){ const s = ww*(.25 + r()*.5); split(x,y,s,hh,d+1); split(x+s,y,ww-s,hh,d+1); } else { const s = hh*(.3 + r()*.4); split(x,y,ww,s,d+1); split(x,y+s,ww,hh-s,d+1); } };
  split(x0, y0, w, h, 0);
  R.forEach(([x,y,ww,hh]) => { g.fillStyle = pal[(r()*pal.length)|0]; g.fillRect(x, y, ww, hh);
    g.globalAlpha = .18; for(let k = 0; k < 14; k++){ g.fillStyle = k%2 ? "#FFFFFF" : "#000"; const bx = x + r()*ww, by = y + r()*hh; g.fillRect(bx, by, Math.min(ww*(.2 + r()*.5), x+ww-bx), Math.min(2 + r()*4, y+hh-by)); } g.globalAlpha = 1; });
  g.strokeStyle = "rgba(20,20,26,.7)"; g.lineWidth = 1.2; R.forEach(([x,y,ww,hh]) => { g.beginPath(); g.moveTo(x + (r()-.5)*2, y); g.lineTo(x + ww, y + (r()-.5)*2); g.lineTo(x + ww + (r()-.5)*2, y + hh); g.stroke(); });
  g.beginPath(); g.moveTo(x0 + w*.55, y0); g.lineTo(x0 + w*.9, y0 + h*.22); g.stroke();
};
ART.case["A05-13"].ratio = 1.3;

// A05-14 《營造法式》：殿堂橫剖面（台基、柱、鋪作、疊梁、凹曲屋面），背景為材分格
ART.case["A05-14"] = function(g, W, H, r, c){
  const cx = W/2, base = H*.82, u = W/34;
  g.strokeStyle = "rgba(255,255,255,.04)"; g.lineWidth = .6; for(let x = cx % u; x < W; x += u){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); } for(let y = base % u; y < H; y += u){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
  g.fillStyle = "#6B6470"; g.fillRect(cx - u*15, base, u*30, u*1.6);
  const cols = [-12, -6, 6, 12], ch = u*(9 + r()*2); g.lineWidth = 1.2; g.strokeStyle = "#F3E6D6";
  cols.forEach(k => { const x = cx + k*u; g.fillStyle = U.rgba(c,.8); g.fillRect(x - u*.5, base - ch, u, ch);
    for(let t = 0; t < 4; t++){ const y = base - ch - t*u*.7, wd = u*(1 + t*1.1); g.fillStyle = t%2 ? "#D9CDBB" : "#B89F7F"; g.fillRect(x - wd/2, y - u*.6, wd, u*.6); g.strokeRect(x - wd/2, y - u*.6, wd, u*.6); } });
  const top = base - ch - u*2.8; let span = 24, y = top;
  for(let i = 0; i < 4; i++){ g.fillStyle = "#CDBB9F"; g.fillRect(cx - span*u/2, y - u*.9, span*u, u*.9); g.strokeRect(cx - span*u/2, y - u*.9, span*u, u*.9);
    if(i < 3){ [-1,1].forEach(s => { g.fillStyle = "#8E7A63"; g.fillRect(cx + s*(span*u/2 - u*2) - u*.3, y - u*2.2, u*.6, u*1.3); }); }
    y -= u*2.2; span -= 6; }
  const ridge = y + u*.4, eave = base - ch - u*1.8, ex = u*17.5, pts = [];
  for(let i = 0; i <= 20; i++){ const t = i/20; pts.push([t*ex, ridge + (eave - ridge)*(1 - Math.pow(1 - t, 2)) - Math.sin(t*Math.PI)*u*.2]); }
  g.strokeStyle = c; g.lineWidth = 3; [-1,1].forEach(s => { g.beginPath(); pts.forEach(([x,yy],i) => i ? g.lineTo(cx + s*x, yy) : g.moveTo(cx + s*x, yy)); g.lineTo(cx + s*(ex + u*.8), eave - u*.8); g.stroke();
    g.fillStyle = "#FFFFFF"; for(let i = 2; i < 20; i += 3){ const [x,yy] = pts[i]; g.beginPath(); g.arc(cx + s*x, yy + 4, 2.2, 0, TAU); g.fill(); } });
  g.fillStyle = c; g.fillRect(cx - u*1.5, ridge - u*.8, u*3, u*.9);
};
ART.case["A05-14"].ratio = .85;

// A05-15 Shape Machine：CAD 線稿中搜尋左側形狀並取代，命中處以主色標示
ART.case["A05-15"] = function(g, W, H, r, c){
  const n = 5, s = Math.min(W, H*.74)*.86/n, x0 = (W - s*n)/2, y0 = H*.22;
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1;
  for(let i = 0; i <= n; i++){ g.beginPath(); g.moveTo(x0 + i*s, y0); g.lineTo(x0 + i*s, y0 + n*s); g.moveTo(x0, y0 + i*s); g.lineTo(x0 + n*s, y0 + i*s); g.stroke(); }
  g.beginPath(); g.moveTo(x0,y0); g.lineTo(x0+n*s, y0+n*s); g.moveTo(x0+n*s,y0); g.lineTo(x0,y0+n*s); g.stroke();
  // 被找到的子形狀（跨格正方形）→ 取代成內接旋轉正方形
  for(let k = 0; k < 5; k++){ const m = 1 + ((r()*2)|0), i = (r()*(n-m+1))|0, j = (r()*(n-m+1))|0, x = x0 + i*s, y = y0 + j*s, L = m*s;
    g.strokeStyle = c; g.lineWidth = 2.4; g.strokeRect(x, y, L, L);
    U.poly(g, [[x+L/2,y],[x+L,y+L/2],[x+L/2,y+L],[x,y+L/2]], true); g.strokeStyle = AMB; g.lineWidth = 1.6; g.stroke(); }
  // 上方規則框：左形 → 右形
  const bs = H*.1, by = H*.05, bx = W/2 - bs*1.8;
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(bx - 6, by - 4, bs*3.6 + 12, bs + 8);
  g.strokeStyle = c; g.lineWidth = 1.6; g.strokeRect(bx, by, bs, bs);
  g.strokeStyle = "#FFFFFF"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(bx + bs*1.3, by + bs/2); g.lineTo(bx + bs*2.2, by + bs/2); g.lineTo(bx + bs*2.05, by + bs*.38); g.moveTo(bx + bs*2.2, by + bs/2); g.lineTo(bx + bs*2.05, by + bs*.62); g.stroke();
  const rx = bx + bs*2.6; g.strokeStyle = c; g.strokeRect(rx, by, bs, bs); U.poly(g, [[rx+bs/2,by],[rx+bs,by+bs/2],[rx+bs/2,by+bs],[rx,by+bs/2]], true); g.strokeStyle = AMB; g.stroke();
  const cx = x0 + s*n*.7, cy = y0 + s*n*.35; g.strokeStyle = "#FFFFFF"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx-8,cy); g.lineTo(cx+8,cy); g.moveTo(cx,cy-8); g.lineTo(cx,cy+8); g.stroke(); g.strokeRect(cx-3, cy-3, 6, 6);
};
ART.case["A05-15"].ratio = 1.1;

// A05-51 Context Free：加權規則的螺旋，偶爾分岔出反向的小螺旋
ART.case["A05-51"] = function(g, W, H, r, c){
  let cnt = 0; const cir = [];
  const spiral = (x, y, a, s, d, hand) => { while(s > .6 && cnt < 2600){ cnt++; cir.push([x, y, s, d]);
      x += Math.cos(a)*s*1.1; y += Math.sin(a)*s*1.1; a += hand*.19; s *= .975;
      if(d < 3 && r() < .04) spiral(x, y, a + hand*1.2, s*.6, d+1, -hand); } };
  spiral(0, 0, -.6, 10, 0, 1);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; cir.forEach(([x,y,s]) => { x0 = Math.min(x0,x-s); y0 = Math.min(y0,y-s); x1 = Math.max(x1,x+s); y1 = Math.max(y1,y+s); });
  const k = Math.min(W*.9/(x1-x0), H*.9/(y1-y0)), ox = (W - (x1-x0)*k)/2 - x0*k, oy = (H - (y1-y0)*k)/2 - y0*k;
  cir.forEach(([x,y,s,d]) => { g.fillStyle = d === 0 ? U.rgba(c, .9) : d === 1 ? "rgba(255,255,255,.85)" : U.rgba(AMB,.85); g.beginPath(); g.arc(ox + x*k, oy + y*k, s*k*.5, 0, TAU); g.fill(); });
};
ART.case["A05-51"].ratio = .9;

// A05-52 Structure Synth：淺灰算圖畫面（Sunflow／光線追蹤感）中的 3D 設計文法巨構——
// 規則 tower 逐層疊方塊並繞 z 轉、縮小，每隔幾層向四方伸出懸臂，懸臂末端再呼叫 tower（maxdepth 2）
ART.case["A05-52"] = function(g, W, H, r, c){
  const px = W*.04, py = H*.04, pw = W*.92, ph = H*.92;
  const bg = g.createLinearGradient(0, py, 0, py + ph); bg.addColorStop(0, "#AFAAA4"); bg.addColorStop(.55, "#D4D0CA"); bg.addColorStop(1, "#ECE9E4");
  g.fillStyle = bg; g.fillRect(px, py, pw, ph);
  const F = []; let cnt = 0;
  // 繞 z 旋轉的方塊（中心 x,y、底 z、長 s、寬 w、高 h、角度 a）
  const rbox = (x, y, z, s, h, a, col, w = s) => { const C = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v]) => [x + (u*s*Math.cos(a) - v*w*Math.sin(a))/2, y + (u*s*Math.sin(a) + v*w*Math.cos(a))/2]);
    const B = C.map(p => [p[0], p[1], z]), T = C.map(p => [p[0], p[1], z + h]);
    F.push({p:T, col}); for(let i = 0; i < 4; i++){ const j = (i+1)%4; F.push({p:[B[i], B[j], T[j], T[i]], col}); } };
  const tower = (x, y, z, s, a, d) => {
    const lv = d === 0 ? 22 : 10 - d*2;
    for(let i = 0; i < lv && s > .08 && cnt < 420; i++){ cnt++;
      const accent = d === 0 && i%6 === 5;
      rbox(x, y, z, s, s*.45, a, accent ? c : "#F1EEE9"); z += s*.45; a += .09; s *= .955;
      if(d < 2 && i%6 === 3){ const arms = d === 0 ? 4 : 2;
        for(let k = 0; k < arms; k++){ const t = a + k*TAU/arms + (d ? Math.PI/4 : 0), L = s*(2.2 - d*.5);
          cnt++; rbox(x + Math.cos(t)*L/2, y + Math.sin(t)*L/2, z - s*.3, L, s*.22, t, "#E2DED8", s*.3);   // 懸臂梁
          if(r() < .85) tower(x + Math.cos(t)*L, y + Math.sin(t)*L, z - s*.25, s*.5, t, d+1); } } } };
  tower(0, 0, 0, 1.4, r()*TAU, 0);
  g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
  render(g, F, persp(.55, .5, 34), px + pw*.06, py + ph*.05, pw*.88, ph*.86, {bottom:true, L:[.55,-.45,.75], line:"rgba(60,55,50,.35)", lw:.4,
    under:(m, k) => { const o = m([0,0,0]); const sh = g.createRadialGradient(o[0], o[1], 0, o[0], o[1], k*6); sh.addColorStop(0, "rgba(40,36,32,.45)"); sh.addColorStop(1, "rgba(40,36,32,0)"); g.fillStyle = sh; g.beginPath(); g.ellipse(o[0], o[1], k*6, k*2.2, 0, 0, TAU); g.fill(); }});
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
};
ART.case["A05-52"].ratio = 1.15;

// A05-55 CGAjs：瀏覽器視窗，左側文法程式碼、右側 3D 教堂即時預覽
ART.case["A05-55"] = function(g, W, H, r, c){
  g.fillStyle = "#2A2A33"; g.fillRect(0, 0, W, H*.08); [0,1,2].forEach(i => { g.fillStyle = ["#E4572E","#F2A007","#3FA34D"][i]; g.beginPath(); g.arc(10 + i*10, H*.04, 3, 0, TAU); g.fill(); });
  g.fillStyle = "#18181E"; g.fillRect(0, H*.08, W*.36, H*.92);
  const toks = [c, "#FFFFFF", SKY, AMB, "rgba(255,255,255,.4)"]; let y = H*.13;
  for(let l = 0; l < 20 && y < H*.96; l++){ const ind = [0,1,1,2,1,0][l%6]*8, n = 1 + ((r()*3)|0); let x = 8 + ind;
    g.fillStyle = "rgba(255,255,255,.2)"; g.fillRect(3, y, 2, 3);
    for(let k = 0; k < n; k++){ const w = 6 + r()*W*.08; if(x + w > W*.34) break; g.fillStyle = toks[(k + l)%toks.length]; g.fillRect(x, y, w, 3); x += w + 4; }
    y += H*.04; }
  const F = []; box(F, 0, 0, 0, 5, 2.4, 2.2, "#D8D2C8"); gable(F, -.1, -.1, 2.2, 5.2, 2.6, 1.3, true, c);
  box(F, -1.4, .2, 0, 1.4, 2, 4.2, "#E6E0D6"); const ap = [-.7, 1.2, 5.8]; [[-1.4,.2],[0,.2],[0,2.2],[-1.4,2.2]].forEach((p,i,A) => { const q = A[(i+1)%4]; F.push({p:[[p[0],p[1],4.2],[q[0],q[1],4.2],ap], col:c}); });
  for(let i = 0; i < 5; i++) box(F, .35 + i*.95, 2.4, .7, .4, .02, 1.1, "#2F4E7A", {line:null});
  render(g, F, persp(-.7, .35, 16), W*.4, H*.16, W*.56, H*.72, {bottom:true, line:"rgba(0,0,0,.35)", lw:.5,
    under:(m) => { g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = .6; for(let i = -4; i <= 8; i++){ const a = m([i,-4,0]), b = m([i,6,0]), c2 = m([-4,i*.8,0]), e = m([8,i*.8,0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.moveTo(c2[0],c2[1]); g.lineTo(e[0],e[1]); g.stroke(); } }});
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; g.strokeRect(W*.36, H*.08, W*.64, H*.92);
};
ART.case["A05-55"].ratio = .8;

/* ================= 新變形（V13 起） ================= */
// V13 圖文法：房間鄰接圖的改寫。上方兩格是第 0、1 代（House → Entry–Public–Private），
// 下方是第 2 代（Public → 客廳／廚房／餐廳、Private → 走道＋臥室＋浴室）經力導向排佈的泡泡圖
ART.var["A05"][12] = function(g, W, H, r, c){
  const nb = 2 + ((r()*2)|0);
  const RULE = {
    House:   {nodes:["Entry","Public","Private"], edges:[[0,1],[1,2]], port:1},
    Public:  {nodes:["Living","Kitchen","Dining"], edges:[[0,1],[1,2],[0,2]], port:0},
    Private: {nodes:["Hall"].concat(Array(nb).fill("Bed"), ["Bath"]), edges:Array.from({length:nb+1}, (_, i) => [0, i+1]), port:0}};
  const AREA = {House:2.4, Entry:.45, Public:1.5, Private:1.4, Living:1.25, Kitchen:.7, Dining:.8, Hall:.45, Bed:.8, Bath:.45};
  const ZONE = {House:"#FFFFFF", Entry:AMB, Public:c, Living:c, Kitchen:c, Dining:c, Private:SKY, Hall:SKY, Bed:SKY, Bath:"#9FD8C8"};
  // 逐代改寫：所有非終端節點同時替換，外部連線接到規則指定的接口節點（嵌入規則）
  let N = [{lab:"House", x:0, y:0}], E = []; const gens = [{N, E}];
  while(N.some(n => RULE[n.lab])){ const NN = [], EE = [], map = [];
    N.forEach((nd, i) => { const R = RULE[nd.lab]; if(!R){ map[i] = NN.length; NN.push({...nd}); return; }
      const b = NN.length; R.nodes.forEach((l, k) => { const a = k/R.nodes.length*TAU + r(); NN.push({lab:l, x:nd.x + Math.cos(a)*.6, y:nd.y + Math.sin(a)*.6}); });
      R.edges.forEach(([p, q]) => EE.push([b+p, b+q])); map[i] = b + R.port; });
    E.forEach(([p, q]) => EE.push([map[p], map[q]])); N = NN; E = EE;
    // 力導向：相連節點以彈簧拉近、所有節點兩兩互斥
    for(let it = 0; it < 90; it++){ const fx = N.map(() => 0), fy = N.map(() => 0);
      for(let i = 0; i < N.length; i++) for(let j = i+1; j < N.length; j++){ const dx = N[j].x - N[i].x, dy = N[j].y - N[i].y, d = Math.hypot(dx, dy) || .01, want = AREA[N[i].lab] + AREA[N[j].lab];
        const f = d < want*1.05 ? (want*1.05 - d)*.5 : .02/(d*d); fx[i] -= dx/d*f; fy[i] -= dy/d*f; fx[j] += dx/d*f; fy[j] += dy/d*f; }
      E.forEach(([i, j]) => { const dx = N[j].x - N[i].x, dy = N[j].y - N[i].y, d = Math.hypot(dx, dy) || .01, rest = (AREA[N[i].lab] + AREA[N[j].lab])*1.12, f = (d - rest)*.12;
        fx[i] += dx/d*f; fy[i] += dy/d*f; fx[j] -= dx/d*f; fy[j] -= dy/d*f; });
      N.forEach((n, i) => { n.x += fx[i]; n.y += fy[i]; }); }
    gens.push({N, E}); }
  // 畫一代的泡泡圖到框內
  const draw = (G, bx, by, bw, bh, lw) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    G.N.forEach(n => { const a = AREA[n.lab]; x0 = Math.min(x0, n.x - a); y0 = Math.min(y0, n.y - a); x1 = Math.max(x1, n.x + a); y1 = Math.max(y1, n.y + a); });
    const k = Math.min(bw/(x1 - x0), bh/(y1 - y0)), ox = bx + (bw - (x1-x0)*k)/2 - x0*k, oy = by + (bh - (y1-y0)*k)/2 - y0*k, P = n => [ox + n.x*k, oy + n.y*k];
    g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = lw; g.lineCap = "round";
    G.E.forEach(([i, j]) => { const a = P(G.N[i]), b = P(G.N[j]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
    G.N.forEach(n => { const [x, y] = P(n), rad = AREA[n.lab]*k*.92, col = ZONE[n.lab], term = !RULE[n.lab];
      g.fillStyle = U.rgba(col, term ? .3 : .12); g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
      g.strokeStyle = col; g.lineWidth = term ? 1.6 : 1.2; if(!term) g.setLineDash([4,3]); g.stroke(); g.setLineDash([]);
      g.fillStyle = col; g.fillRect(x - 2.5, y - 2.5, 5, 5); }); };   // 小方點代表房名標記（TextDot）
  const th = H*.26, pw = W*.36;
  [[0, W*.05], [1, W*.59]].forEach(([gi, x]) => { g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.strokeRect(x, H*.04, pw, th); draw(gens[gi], x + 6, H*.04 + 6, pw - 12, th - 12, 1.4);
    for(let k = 0; k <= gi; k++){ g.fillStyle = k === gi ? c : "rgba(255,255,255,.35)"; g.fillRect(x + 5 + k*7, H*.04 + th - 9, 4, 4); } });
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(W*.44, H*.17); g.lineTo(W*.56, H*.17); g.lineTo(W*.53, H*.15); g.moveTo(W*.56, H*.17); g.lineTo(W*.53, H*.19); g.stroke();
  g.beginPath(); g.moveTo(W*.77, H*.32); g.lineTo(W*.77, H*.37); g.lineTo(W*.75, H*.35); g.moveTo(W*.77, H*.37); g.lineTo(W*.79, H*.35); g.stroke();
  // 主圖：第 2 代泡泡圖，底下疊淡淡的平面格線
  g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 1; for(let x = W*.04; x < W*.96; x += W*.06){ g.beginPath(); g.moveTo(x, H*.39); g.lineTo(x, H*.97); g.stroke(); } for(let y = H*.39; y < H*.97; y += W*.06){ g.beginPath(); g.moveTo(W*.04, y); g.lineTo(W*.96, y); g.stroke(); }
  draw(gens[gens.length-1], W*.05, H*.4, W*.9, H*.56, 2.2);
};
ART.var["A05"][12].ratio = 1.15;
})();
