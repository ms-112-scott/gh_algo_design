/* D01 Boids 群聚：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = Math.PI*2;
const rgba = (h, a) => U.rgba(h, a);

/* ---------------- 共用：2D Boids 模擬 ----------------
   o.W,o.H 範圍；o.n 隻數；o.steps 步數；o.sp 速度；o.R 鄰居半徑；o.Rs 分離半徑；o.w [分離,對齊,凝聚]
   o.force(b,st) 額外力；o.speed(b) 個別速度；o.wrap 邊界環繞（軌跡以 null 斷開）；o.mg 反彈邊距
   o.fov 視野 cos 門檻；o.init(i) 初始位置；o.a0 初始方向 */
function sim2(r, o){
  const W = o.W, H = o.H, n = o.n || 60, sp = o.sp || 2, R = o.R || 40, Rs = o.Rs || 14, w = o.w || [1.5,1,1], mg = o.mg ?? 30;
  const B = [...Array(n)].map((_, i) => { const p = o.init ? o.init(i) : [r()*W, r()*H], a = o.a0 != null ? o.a0 + (r()-.5)*.6 : r()*TAU;
    return {x:p[0], y:p[1], vx:Math.cos(a), vy:Math.sin(a), t:[[p[0],p[1]]], i, k:(r()*9)|0, wj:.7 + r()*.6}; });
  for(let st = 0; st < (o.steps || 160); st++){
    for(const b of B){ let sx=0,sy=0,ax=0,ay=0,cx=0,cy=0,k=0;
      const vl = Math.hypot(b.vx,b.vy) || 1;
      for(const q of B){ if(q === b) continue; const dx = q.x-b.x, dy = q.y-b.y, d = Math.hypot(dx,dy);
        if(d < R){ if(o.fov != null && (dx*b.vx + dy*b.vy)/(d*vl + 1e-9) < o.fov) continue;
          k++; ax += q.vx; ay += q.vy; cx += dx; cy += dy; if(d < Rs){ sx -= dx/(d||1); sy -= dy/(d||1); } } }
      b.nb = k; const wj = o.fov != null ? b.wj : 1;
      if(k){ b.nvx = b.vx + (sx*w[0] + (ax/k - b.vx)*w[1]*.3*wj + cx/k*w[2]*.004*wj); b.nvy = b.vy + (sy*w[0] + (ay/k - b.vy)*w[1]*.3*wj + cy/k*w[2]*.004*wj); }
      else { b.nvx = b.vx; b.nvy = b.vy; }
      if(o.force){ const f = o.force(b, st); b.nvx += f[0]; b.nvy += f[1]; }
      if(!o.wrap){ if(b.x < mg) b.nvx += .25; if(b.x > W-mg) b.nvx -= .25; if(b.y < mg) b.nvy += .25; if(b.y > H-mg) b.nvy -= .25; }
    }
    for(const b of B){ const s = Math.hypot(b.nvx,b.nvy) || 1, v = o.speed ? o.speed(b) : sp; b.vx = b.nvx/s*v; b.vy = b.nvy/s*v; b.x += b.vx; b.y += b.vy;
      if(o.wrap){ let j = false; if(b.x < 0){ b.x += W; j = true; } if(b.x > W){ b.x -= W; j = true; } if(b.y < 0){ b.y += H; j = true; } if(b.y > H){ b.y -= H; j = true; } if(j) b.t.push(null); }
      b.t.push([b.x,b.y]); }
  }
  return B;
}
/* ---------------- 共用：3D Boids 模擬（單位空間，o.bound(b,st,B) 回傳邊界力） ---------------- */
function sim3(r, o){
  const n = o.n || 30, sp = o.sp || .03, R = o.R || .5, Rs = o.Rs || .18, w = o.w || [1,1,1];
  const B = [...Array(n)].map((_, i) => { const p = o.init ? o.init(i) : [r()*2-1, r()*2-1, r()*2-1];
    return {x:p[0], y:p[1], z:p[2], vx:r()-.5, vy:r()-.5, vz:r()-.5, t:[[p[0],p[1],p[2]]], i}; });
  for(let st = 0; st < (o.steps || 120); st++){
    for(const b of B){ const s = [0,0,0], a = [0,0,0], c = [0,0,0]; let k = 0;
      for(const q of B){ if(q === b) continue; const dx = q.x-b.x, dy = q.y-b.y, dz = q.z-b.z, d = Math.hypot(dx,dy,dz);
        if(d < R){ k++; a[0] += q.vx; a[1] += q.vy; a[2] += q.vz; c[0] += dx; c[1] += dy; c[2] += dz; if(d < Rs){ s[0] -= dx/(d||1e-3); s[1] -= dy/(d||1e-3); s[2] -= dz/(d||1e-3); } } }
      b.nb = k; const f = o.bound ? o.bound(b, st, B) : [-b.x*.05, -b.y*.05, -b.z*.05];
      b.nv = [b.vx + f[0], b.vy + f[1], b.vz + f[2]];
      if(k){ const vv = [b.vx,b.vy,b.vz]; for(let e = 0; e < 3; e++) b.nv[e] += s[e]*w[0]*.02 + (a[e]/k - vv[e])*w[1]*.3 + c[e]/k*w[2]*.05; }
    }
    for(const b of B){ const l = Math.hypot(...b.nv) || 1; b.vx = b.nv[0]/l*sp; b.vy = b.nv[1]/l*sp; b.vz = b.nv[2]/l*sp; b.x += b.vx; b.y += b.vy; b.z += b.vz; b.t.push([b.x,b.y,b.z]); }
  }
  return B;
}
// 畫軌跡（null 為斷點），from 為起始索引
function trail(g, t, from){
  g.beginPath(); let pen = false;
  for(let i = Math.max(0, from || 0); i < t.length; i++){ const p = t[i]; if(!p){ pen = false; continue; } pen ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); pen = true; }
  g.stroke();
}
// 鳥頭三角形
function head(g, x, y, a, s, col){
  g.fillStyle = col; g.beginPath(); g.moveTo(x+Math.cos(a)*s, y+Math.sin(a)*s); g.lineTo(x+Math.cos(a+2.5)*s*.8, y+Math.sin(a+2.5)*s*.8); g.lineTo(x+Math.cos(a-2.5)*s*.8, y+Math.sin(a-2.5)*s*.8); g.fill();
}
const last = t => { for(let i = t.length-1; i >= 0; i--) if(t[i]) return t[i]; return [0,0]; };
// 等角投影
const isoP = (W, H, s, ox, oy) => (x, y, z) => [W*ox + (x - y)*.866*s, H*oy + (x + y)*.5*s - z*s];

ART.var["D01"] = [
  /* V01 吸引子：三個吸引點的光暈，鳥群輪流飛向吸引點、拉出束狀軌跡 */
  function(g, W, H, r, c){
    const A = [[W*.24,H*.28],[W*.76,H*.38],[W*.42,H*.78]];
    A.forEach(([x,y]) => { const gr = g.createRadialGradient(x,y,0,x,y,W*.28); gr.addColorStop(0, rgba(c,.35)); gr.addColorStop(1, rgba(c,0)); g.fillStyle = gr; g.fillRect(0,0,W,H); });
    const B = sim2(r, {W, H, n:55, steps:230, sp:2.3, R:28, w:[1.2,.9,.1], force:b => { const a = A[b.k%3], dx = a[0]-b.x, dy = a[1]-b.y, d = Math.hypot(dx,dy)||1; if(d < W*.1) b.k++; return [dx/d*.3, dy/d*.3]; }});
    g.lineWidth = .9; B.forEach(b => { g.strokeStyle = rgba(c,.5); trail(g, b.t, 60); const p = last(b.t); head(g, p[0], p[1], Math.atan2(b.vy,b.vx), 4, "#fff"); });
    A.forEach(([x,y]) => { g.strokeStyle = "#fff"; g.lineWidth = 1.4; g.beginPath(); g.arc(x,y,6,0,TAU); g.stroke(); g.beginPath(); g.moveTo(x-11,y); g.lineTo(x+11,y); g.moveTo(x,y-11); g.lineTo(x,y+11); g.stroke(); });
  },
  /* V02 障礙物迴避：平面上的量體（柱、長方塊），由左往右的流線在量體周圍分流 */
  function(g, W, H, r, c){
    const O = [{x:W*.3,y:H*.35,R:W*.09},{x:W*.62,y:H*.66,R:W*.11},{x:W*.72,y:H*.22,R:W*.06}], Rc = {x0:W*.18,y0:H*.62,x1:W*.36,y1:H*.82};
    const cp = (b) => { let best = null, bd = 1e9;
      O.forEach(o => { const dx = b.x-o.x, dy = b.y-o.y, d = Math.hypot(dx,dy) - o.R; if(d < bd){ bd = d; const l = Math.hypot(dx,dy)||1; best = [dx/l, dy/l]; } });
      const qx = Math.max(Rc.x0, Math.min(Rc.x1, b.x)), qy = Math.max(Rc.y0, Math.min(Rc.y1, b.y)), dx = b.x-qx, dy = b.y-qy, d = Math.hypot(dx,dy);
      if(d < bd){ bd = d; best = [dx/(d||1), dy/(d||1)]; } return [bd, best]; };
    const B = sim2(r, {W, H, n:70, steps:190, sp:2.1, wrap:true, w:[1.2,1.2,.4], a0:0,
      init:() => { for(let k = 0; k < 50; k++){ const p = [r()*W, r()*H]; if(cp({x:p[0],y:p[1]})[0] > 8) return p; } return [2, r()*H]; },
      force:b => { const [d, n] = cp(b), f = d < 30 ? 1.4/Math.max(d, 2) : 0; return [.07 + n[0]*f, n[1]*f + (H*.5-b.y)*.0004]; }});
    g.fillStyle = "#2E2E3A"; g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.2;
    O.forEach(o => { g.beginPath(); g.arc(o.x,o.y,o.R,0,TAU); g.fill(); g.stroke(); });
    g.fillRect(Rc.x0,Rc.y0,Rc.x1-Rc.x0,Rc.y1-Rc.y0); g.strokeRect(Rc.x0,Rc.y0,Rc.x1-Rc.x0,Rc.y1-Rc.y0);
    g.save(); g.beginPath(); g.rect(Rc.x0,Rc.y0,Rc.x1-Rc.x0,Rc.y1-Rc.y0); g.clip(); g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1;
    for(let k = -H; k < W; k += 6){ g.beginPath(); g.moveTo(k,Rc.y1); g.lineTo(k+H*.3,Rc.y1-H*.3); g.stroke(); } g.restore();
    g.lineWidth = 1; B.forEach(b => { g.strokeStyle = rgba(c,.55); trail(g, b.t, 40); });
  },
  /* V03 曲面上的 Boids：UV 空間的群聚，貼到起伏屋面上，軌跡成為表皮流線 */
  function(g, W, H, r, c){
    const S = 100, B = sim2(r, {W:S, H:S, n:50, steps:170, sp:.9, R:14, Rs:5, mg:8, w:[1.3,1.2,.6]});
    const P = (u, v) => { const X = u-.5, Y = v-.5, Z = .18*Math.sin(u*Math.PI)*Math.cos(Y*2.6) + .08*Math.sin(v*6 + u*2);
      return [W*.5 + (X - Y)*W*.46, H*.52 + (X + Y)*W*.2 - Z*H*1.1]; };
    // 曲面網格
    g.lineWidth = .7;
    for(let k = 0; k <= 12; k++){ g.strokeStyle = "rgba(255,255,255,.14)"; g.beginPath(); for(let j = 0; j <= 30; j++){ const p = P(k/12, j/30); j ? g.lineTo(...p) : g.moveTo(...p); } g.stroke();
      g.beginPath(); for(let j = 0; j <= 30; j++){ const p = P(j/30, k/12); j ? g.lineTo(...p) : g.moveTo(...p); } g.stroke(); }
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.3; g.beginPath();
    [[0,0,1,0],[1,0,1,1],[1,1,0,1],[0,1,0,0]].forEach(([a,b,cc,d],e) => { for(let j = 0; j <= 30; j++){ const t = j/30, p = P(a+(cc-a)*t, b+(d-b)*t); (e||j) ? g.lineTo(...p) : g.moveTo(...p); } }); g.stroke();
    g.lineWidth = 1.1; B.forEach(b => { g.strokeStyle = rgba(c,.7); g.beginPath(); b.t.forEach((q,i) => { const p = P(q[0]/S, q[1]/S); i ? g.lineTo(...p) : g.moveTo(...p); }); g.stroke(); });
  },
  /* V04 2D 平面繪圖：米白紙面上的鐵砂紋筆觸，線寬漸層 */
  function(g, W, H, r, c){
    const m = W*.07; g.fillStyle = "#ECE7DC"; g.fillRect(m, m, W-2*m, H-2*m);
    const B = sim2(r, {W:W-2*m, H:H-2*m, n:80, steps:200, sp:1.7, R:24, Rs:10, mg:20, w:[1.6,1.3,.15]});
    g.save(); g.translate(m, m); g.lineCap = "round";
    B.forEach((b, i) => { const t = b.t;
      for(let s = 0; s < t.length-10; s += 10){ g.strokeStyle = i%9 === 0 ? rgba(c,.85) : "rgba(29,27,34,.55)"; g.lineWidth = .3 + 1.6*Math.sin(Math.PI*s/t.length); g.beginPath(); g.moveTo(...t[s]); for(let q = s+1; q <= s+10; q++) g.lineTo(...t[q]); g.stroke(); } });
    g.restore();
  },
  /* V05 向量場引導：背景是噪聲方向的箭頭格，群聚順著整體流向前進 */
  function(g, W, H, r, c){
    const nz = U.vnoise(((r()*1e6)|0) + 3), ang = (x, y) => nz(x*.012, y*.012)*TAU*1.3;
    const s = W/11; g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1;
    for(let y = s/2; y < H; y += s) for(let x = s/2; x < W; x += s){ const a = ang(x,y), dx = Math.cos(a)*s*.35, dy = Math.sin(a)*s*.35;
      g.beginPath(); g.moveTo(x-dx, y-dy); g.lineTo(x+dx, y+dy); g.lineTo(x+dx - Math.cos(a-.5)*4, y+dy - Math.sin(a-.5)*4); g.moveTo(x+dx, y+dy); g.lineTo(x+dx - Math.cos(a+.5)*4, y+dy - Math.sin(a+.5)*4); g.stroke(); }
    const B = sim2(r, {W, H, n:60, steps:200, sp:2, wrap:true, w:[1.3,1,.8], force:b => { const a = ang(b.x,b.y); return [Math.cos(a)*.35, Math.sin(a)*.35]; }});
    g.lineWidth = 1.2; B.forEach(b => { g.strokeStyle = rgba(c,.6); trail(g, b.t, 80); const p = last(b.t); head(g, p[0], p[1], Math.atan2(b.vy,b.vx), 4, "#fff"); });
  },
  /* V06 影像控制：灰階肖像決定速度，鳥在暗處變慢、點變密，用點描畫出人像；左下角是原圖 */
  function(g, W, H, r, c){
    const img = (x, y) => { const u = x/W, v = y/H;
      const face = Math.hypot((u-.5)/.2, (v-.4)/.26), sh = Math.hypot((u-.5)/.42, (v-1.05)/.3);
      let d = Math.min(face, sh); d = d < 1 ? .1 + .25*d : Math.min(1, .6 + (d-1)*.8);
      if(Math.hypot((u-.42)/.04,(v-.37)/.025) < 1 || Math.hypot((u-.58)/.04,(v-.37)/.025) < 1) d = .9; return d; };
    const B = sim2(r, {W, H, n:170, steps:120, R:18, Rs:6, wrap:true, w:[1,.4,0], speed:b => .25 + 4.5*Math.pow(img(b.x,b.y), 2)});
    g.fillStyle = rgba(c,.5); B.forEach(b => b.t.forEach(p => { if(p) g.fillRect(p[0], p[1], 1.2, 1.2); }));
    const iw = W*.26, ih = iw*H/W, ix = 8, iy = H - ih - 8; g.save(); g.translate(ix, iy);
    const n = 26, m = Math.round(n*H/W), cell = iw/n;
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const v = img((i+.5)*W/n, (j+.5)*H/m)*220|0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(i*cell, j*cell, cell+.3, cell+.3); }
    g.strokeStyle = "#fff"; g.lineWidth = 1; g.strokeRect(0,0,iw,ih); g.restore();
  },
  /* V07 空間索引：網格分桶的熱度，一隻查詢鳥只看周圍 3×3 格 */
  function(g, W, H, r, c){
    const n = 8, s = W/n, m = Math.ceil(H/s), P = [], C = [...Array(5)].map(() => [W*.15 + r()*W*.7, H*.15 + r()*H*.7, 20 + r()*40]);
    for(let i = 0; i < 520; i++){ const q = C[i%5], a = r()*TAU, d = Math.sqrt(-2*Math.log(r()+1e-6))*q[2]*.6; P.push([q[0]+Math.cos(a)*d, q[1]+Math.sin(a)*d]); }
    const cnt = new Array(n*m).fill(0); P.forEach(([x,y]) => { const i = Math.floor(x/s), j = Math.floor(y/s); if(i >= 0 && i < n && j >= 0 && j < m) cnt[j*n+i]++; });
    const mx = Math.max(...cnt); for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ g.fillStyle = rgba(c, .04 + .4*cnt[j*n+i]/mx); g.fillRect(i*s+1, j*s+1, s-2, s-2); }
    g.fillStyle = "rgba(255,255,255,.55)"; P.forEach(([x,y]) => g.fillRect(x-.8, y-.8, 1.6, 1.6));
    const q = P[3], qi = Math.floor(q[0]/s), qj = Math.floor(q[1]/s);
    g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.strokeRect((qi-1)*s, (qj-1)*s, 3*s, 3*s);
    g.lineWidth = .7; g.strokeStyle = "rgba(255,255,255,.7)"; P.forEach(p => { if(Math.abs(Math.floor(p[0]/s)-qi) <= 1 && Math.abs(Math.floor(p[1]/s)-qj) <= 1 && Math.hypot(p[0]-q[0],p[1]-q[1]) < s*1.2){ g.beginPath(); g.moveTo(...q); g.lineTo(...p); g.stroke(); } });
    g.fillStyle = "#F2A007"; g.beginPath(); g.arc(q[0], q[1], 4, 0, TAU); g.fill();
    g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; for(let i = 0; i <= n; i++){ g.beginPath(); g.moveTo(i*s,0); g.lineTo(i*s,H); g.stroke(); } for(let j = 0; j <= m; j++){ g.beginPath(); g.moveTo(0,j*s); g.lineTo(W,j*s); g.stroke(); }
  },
  /* V08 Stigmergy：格子上的費洛蒙方塊（大小＝濃度），代理人自我強化出粗壯主幹 */
  function(g, W, H, r, c){
    const n = 44, s = W/n, m = Math.ceil(H/s), T = new Float32Array(n*m), at = (x, y) => { const i = Math.floor(x/s), j = Math.floor(y/s); return i < 0 || j < 0 || i >= n || j >= m ? -1 : T[j*n+i]; };
    const B = sim2(r, {W, H, n:60, steps:260, sp:2, R:30, Rs:8, mg:12, w:[1,.6,.2], force:(b, st) => {
      if(b.i === 0){ for(let k = 0; k < T.length; k++) T[k] *= .985; }
      const i = Math.floor(b.x/s), j = Math.floor(b.y/s); if(i >= 0 && j >= 0 && i < n && j < m) T[j*n+i] += 1;
      const a = Math.atan2(b.vy, b.vx), L = at(b.x+Math.cos(a-.6)*s*3, b.y+Math.sin(a-.6)*s*3), F = at(b.x+Math.cos(a)*s*3, b.y+Math.sin(a)*s*3), R = at(b.x+Math.cos(a+.6)*s*3, b.y+Math.sin(a+.6)*s*3);
      const t = L > F && L > R ? a-.6 : R > F && R > L ? a+.6 : a; return [Math.cos(t)*.8, Math.sin(t)*.8]; }});
    let mx = 1e-6; for(let k = 0; k < T.length; k++) if(T[k] > mx) mx = T[k];
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const v = Math.sqrt(T[j*n+i]/mx); if(v < .03) continue; const q = s*.9*v; g.fillStyle = rgba(c, .3 + .7*v); g.fillRect(i*s + (s-q)/2, j*s + (s-q)/2, q, q); }
    g.fillStyle = "rgba(255,255,255,.08)"; for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) g.fillRect(i*s+s/2-.5, j*s+s/2-.5, 1, 1);
    g.lineWidth = .8; g.strokeStyle = "rgba(255,255,255,.45)"; B.slice(0, 12).forEach(b => trail(g, b.t, 200));
  },
  /* V09 纖維／管件：3D 軌跡變成粗細不一的管件，立在列印底板上（等角） */
  function(g, W, H, r, c){
    const B = sim3(r, {n:26, steps:110, sp:.045, R:.6, Rs:.2, w:[1,1.1,.9], init:() => [r()*1.4-.7, r()*1.4-.7, -.9 + r()*.2],
      bound:b => [-b.x*.04, -b.y*.04, .03 - (b.z > .9 ? .2 : 0)]});
    const pr = isoP(W, H, W*.3, .5, .62);
    const base = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1]].map(p => pr(...p));
    g.fillStyle = "#2A2A34"; U.poly(g, base, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#1E1E26"; U.poly(g, [base[1], base[2], [base[2][0], base[2][1]+6], [base[1][0], base[1][1]+6]], true); g.fill(); U.poly(g, [base[2], base[3], [base[3][0], base[3][1]+6], [base[2][0], base[2][1]+6]], true); g.fill();
    B.forEach(b => b.d = b.t.reduce((s,p) => s + p[0] + p[1], 0)/b.t.length); B.sort((a,b) => a.d - b.d);
    g.lineCap = "round"; g.lineJoin = "round";
    B.forEach(b => { const pts = b.t.filter((_,i) => i%3 === 0).map(p => pr(...p)), w = 1.5 + Math.min(5, b.nb*.8);
      [["#0D0D12", w+2], [c, w], ["rgba(255,255,255,.45)", Math.max(.6, w*.25)]].forEach(([col, lw], k) => { g.strokeStyle = col; g.lineWidth = lw; g.save(); if(k === 2) g.translate(-w*.2, -w*.2); U.poly(g, pts); g.stroke(); g.restore(); }); });
  },
  /* V10 Timer 動畫：底片格依序顯示第 40、90、140 步，下方時間軸與播放鍵 */
  function(g, W, H, r, c){
    const fw = W*.8, fh = (H - 46)/3 - 8, fx = (W - fw)/2, B = sim2(r, {W:fw, H:fh, n:34, steps:140, sp:1.6, R:26, Rs:8, mg:10, w:[1.4,1.2,.9]});
    g.fillStyle = "#0B0B0F"; g.fillRect(fx-12, 4, fw+24, 3*(fh+8)+4);
    for(let y = 10; y < 3*(fh+8); y += 9){ g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(fx-9, y, 5, 4); g.fillRect(fx+fw+4, y, 5, 4); }
    [40, 90, 139].forEach((st, k) => { const y0 = 8 + k*(fh+8); g.save(); g.translate(fx, y0); g.fillStyle = "#1B1B23"; g.fillRect(0,0,fw,fh); g.beginPath(); g.rect(0,0,fw,fh); g.clip();
      g.lineWidth = 1; B.forEach(b => { g.strokeStyle = rgba(c,.6); g.beginPath(); for(let i = Math.max(0, st-14); i <= st; i++) i > Math.max(0, st-14) ? g.lineTo(...b.t[i]) : g.moveTo(...b.t[i]); g.stroke();
        const p = b.t[st], q = b.t[Math.max(0, st-1)]; head(g, p[0], p[1], Math.atan2(p[1]-q[1], p[0]-q[0]), 3.5, "#fff"); });
      g.restore(); });
    const ty = H - 22; g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(W*.2, ty-2, W*.72, 4); g.fillStyle = c; g.fillRect(W*.2, ty-2, W*.72*.62, 4);
    for(let i = 0; i <= 20; i++){ g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(W*.2 + i*W*.72/20, ty+5, 1, i%5 ? 3 : 6); }
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(W*.07, ty-8); g.lineTo(W*.07+13, ty); g.lineTo(W*.07, ty+8); g.fill();
    g.beginPath(); g.arc(W*.2 + W*.72*.62, ty, 5, 0, TAU); g.fill();
  },
  /* V11 視野角：少數大鳥畫出前方視野扇形，有領頭（白）與追隨者，分裂成兩群 */
  function(g, W, H, r, c){
    const fovA = 1.1, B = sim2(r, {W, H, n:22, steps:90, sp:1.6, R:W*.22, Rs:18, mg:W*.25, force:b => [(W/2-b.x)*.0015, (H/2-b.y)*.0015], fov:Math.cos(fovA), w:[1.3,1.1,1]});
    B.forEach(b => { const p = last(b.t), a = Math.atan2(b.vy,b.vx), R = W*.13;
      g.fillStyle = b.nb ? rgba(c,.12) : "rgba(255,255,255,.1)"; g.beginPath(); g.moveTo(p[0],p[1]); g.arc(p[0],p[1],R,a-fovA,a+fovA); g.closePath(); g.fill();
      g.strokeStyle = rgba(c,.35); g.lineWidth = .8; g.stroke(); });
    g.lineWidth = 1; B.forEach(b => { g.strokeStyle = "rgba(255,255,255,.18)"; trail(g, b.t, 80); });
    B.forEach(b => { const p = last(b.t), a = Math.atan2(b.vy,b.vx);
      B.forEach(q => { if(q === b) return; const o = last(q.t), dx = o[0]-p[0], dy = o[1]-p[1], d = Math.hypot(dx,dy); if(d < W*.13 && (dx*Math.cos(a)+dy*Math.sin(a))/d > Math.cos(fovA)){ g.strokeStyle = rgba(c,.7); g.setLineDash([2,3]); g.beginPath(); g.moveTo(...p); g.lineTo(...o); g.stroke(); g.setLineDash([]); } });
      head(g, p[0], p[1], a, 8, b.nb ? c : "#fff"); });
  },
  /* V12 軌跡連成網：圓柱範圍內的 3D 群聚，每隔幾步把相近的鳥連線，累積成纖維塔 */
  function(g, W, H, r, c){
    const L = [], B = sim3(r, {n:34, steps:160, sp:.04, R:.45, Rs:.25, w:[1.5,1,.05], init:() => { const a = r()*TAU, d = r()*.6; return [Math.cos(a)*d, Math.sin(a)*d, r()*2.4-1.2]; },
      bound:(b, st, A) => { if(b.i === 0 && st%5 === 0) for(let i = 0; i < A.length; i++) for(let j = i+1; j < A.length; j++){ const p = A[i], q = A[j]; if(Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z) < .45) L.push([p.x,p.y,p.z,q.x,q.y,q.z]); }
        const rr = Math.hypot(b.x,b.y), f = rr > .7 ? -.08 : 0; return [b.x*f - b.y*.015, b.y*f + b.x*.015, (Math.sin(st*.035 + b.i*1.9)*1.25 - b.z)*.06]; }});
    const pr = (x, y, z) => [W*.5 + (x*.9 - y*.4)*W*.36, H*.52 - z*H*.33 + (x*.2 + y*.3)*W*.1];
    g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1; g.beginPath(); g.ellipse(W*.5, H*.52 + 1.3*H*.33, W*.36, W*.08, 0, 0, TAU); g.stroke();
    L.forEach(l => { const a = pr(l[0],l[1],l[2]), b = pr(l[3],l[4],l[5]), dp = (l[1]+l[4])*.5; g.strokeStyle = rgba(c, .25 + .5*(1-(dp+1)/2)); g.lineWidth = .7; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); });
    g.fillStyle = "#fff"; B.forEach(b => { const p = pr(b.x,b.y,b.z); g.fillRect(p[0]-1.2, p[1]-1.2, 2.4, 2.4); });
  },
];
ART.var["D01"][2].ratio = .8; ART.var["D01"][3].ratio = 1.3; ART.var["D01"][5].ratio = 1.25; ART.var["D01"][9].ratio = 1.35; ART.var["D01"][11].ratio = 1.35; ART.var["D01"][8].ratio = 1;

/* V13 捕食者－獵物雙物種群聚：獵物分離群又重新合攏，掠食者留下刀痕般的軌跡，下方是族群數量振盪曲線 */
ART.var["D01"][12] = function(g, W, H, r, c){
  const ACC2 = "#E65050", PH = H*.76, steps = 190, fearR = 66, predictT = 6, catchR = 9, breedEvery = 32;
  let prey = [...Array(46)].map(() => { const a = r()*TAU; return {x:r()*W, y:r()*PH, vx:Math.cos(a), vy:Math.sin(a), t:[], alive:true}; });
  let pred = [...Array(4)].map(() => { const a = r()*TAU; return {x:r()*W, y:r()*PH, vx:Math.cos(a), vy:Math.sin(a), t:[], energy:60}; });
  const hist = [], deadTrails = [];
  for(let st = 0; st < steps; st++){
    prey.forEach(b => { if(!b.alive) return;
      let sx=0,sy=0,ax=0,ay=0,cx=0,cy=0,k=0;
      prey.forEach(q => { if(q===b || !q.alive) return; const dx=q.x-b.x, dy=q.y-b.y, d=Math.hypot(dx,dy);
        if(d<32){ k++; ax+=q.vx; ay+=q.vy; cx+=dx; cy+=dy; if(d<12){ sx-=dx/(d||1); sy-=dy/(d||1); } } });
      let evx=0, evy=0;
      pred.forEach(p => { const px=p.x+p.vx*predictT, py=p.y+p.vy*predictT, dx=b.x-px, dy=b.y-py, d=Math.hypot(dx,dy);
        if(d<fearR){ const f=(fearR-d)/fearR; evx+=dx/(d||1)*f; evy+=dy/(d||1)*f; } });
      let nvx = b.vx + sx*1.3 + (k?(ax/k-b.vx)*.25:0) + (k?cx/k*.003:0) + evx*1.6;
      let nvy = b.vy + sy*1.3 + (k?(ay/k-b.vy)*.25:0) + (k?cy/k*.003:0) + evy*1.6;
      if(b.x<18) nvx+=.3; if(b.x>W-18) nvx-=.3; if(b.y<18) nvy+=.3; if(b.y>PH-18) nvy-=.3;
      const s=Math.hypot(nvx,nvy)||1; b.vx=nvx/s*1.8; b.vy=nvy/s*1.8; b.x+=b.vx; b.y+=b.vy; b.t.push([b.x,b.y]);
    });
    pred.forEach(p => {
      let best=null, bd=1e9; prey.forEach(q => { if(!q.alive) return; const d=Math.hypot(q.x-p.x,q.y-p.y); if(d<bd){ bd=d; best=q; } });
      let nvx=p.vx, nvy=p.vy;
      if(best){ const tx=best.x+best.vx*predictT, ty=best.y+best.vy*predictT, dx=tx-p.x, dy=ty-p.y, d=Math.hypot(dx,dy)||1; nvx+=dx/d*.5; nvy+=dy/d*.5; }
      if(p.x<18) nvx+=.3; if(p.x>W-18) nvx-=.3; if(p.y<18) nvy+=.3; if(p.y>PH-18) nvy-=.3;
      const s=Math.hypot(nvx,nvy)||1; p.vx=nvx/s*2.15; p.vy=nvy/s*2.15; p.x+=p.vx; p.y+=p.vy; p.t.push([p.x,p.y]); p.energy-=.12;
    });
    prey.forEach(b => { if(!b.alive) return; pred.forEach(p => { if(b.alive && Math.hypot(b.x-p.x,b.y-p.y)<catchR){ b.alive=false; p.energy+=18; deadTrails.push(b.t); } }); });
    pred = pred.filter(p => p.energy > 0);
    if(st>0 && st%breedEvery===0){ const alive = prey.filter(b=>b.alive);
      if(alive.length && alive.length<58) for(let i=0;i<3 && i<alive.length;i++){ const par=alive[(r()*alive.length)|0];
        prey.push({x:par.x+(r()-.5)*6, y:par.y+(r()-.5)*6, vx:par.vx, vy:par.vy, t:[[par.x,par.y]], alive:true}); } }
    hist.push([prey.filter(b=>b.alive).length, pred.length]);
  }
  g.save(); g.beginPath(); g.rect(0,0,W,PH); g.clip();
  g.lineWidth = .8; deadTrails.forEach(t => { g.strokeStyle = "rgba(255,255,255,.12)"; trail(g, t, 0); });
  g.lineWidth = 1; prey.forEach(b => { g.strokeStyle = rgba(c, b.alive ? .55 : .12); trail(g, b.t, 30);
    if(b.alive){ const p = last(b.t); head(g, p[0], p[1], Math.atan2(b.vy,b.vx), 3.2, "#fff"); } });
  pred.forEach(p => { g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 3.2; trail(g, p.t, 0);
    g.strokeStyle = ACC2; g.lineWidth = 1.6; trail(g, p.t, 0); const q = last(p.t); head(g, q[0], q[1], Math.atan2(p.vy,p.vx), 5, ACC2); });
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0,PH); g.lineTo(W,PH); g.stroke();
  // 族群數量曲線
  const cy0 = PH + 6, ch = H - PH - 10, mxPrey = Math.max(1, ...hist.map(h2=>h2[0])), mxPred = Math.max(1, ...hist.map(h2=>h2[1]));
  const plot = (idx, mx, col) => { g.strokeStyle = col; g.lineWidth = 1.4; g.beginPath();
    hist.forEach((h2,i) => { const x=i/(hist.length-1)*W, y=cy0+ch-(h2[idx]/mx)*ch; i? g.lineTo(x,y): g.moveTo(x,y); }); g.stroke(); };
  plot(0, mxPrey, rgba(c, .9)); plot(1, mxPred, ACC2);
  g.fillStyle = rgba(c,.9); g.beginPath(); g.arc(4, cy0+ch-(hist[0][0]/mxPrey)*ch, 2.4, 0, TAU); g.fill();
  g.fillStyle = ACC2; g.beginPath(); g.arc(4, cy0+ch-(hist[0][1]/mxPred)*ch, 2.4, 0, TAU); g.fill();
};
ART.var["D01"][12].ratio = 1.05;

/* ---------------- 案例 ---------------- */
/* D01-01 Stanley and Stella：被冰層隔開的球體，上半鳥群、下半魚群（80 年代 CG 掃描線） */
ART.case["D01-01"] = function(g, W, H, r, c){
  const cx = W/2, cy = H/2, R = Math.min(W,H)*.42;
  const gr = g.createRadialGradient(cx-R*.3, cy-R*.4, R*.1, cx, cy, R); gr.addColorStop(0, rgba(c,.35)); gr.addColorStop(1, rgba(c,.05)); g.fillStyle = gr; g.beginPath(); g.arc(cx,cy,R,0,TAU); g.fill();
  const half = (up) => sim2(r, {W, H, n:24, steps:120, sp:1.6, R:30, Rs:9, mg:-999, w:[1.3,1.2,1], init:() => { const a = .3 + r()*2.5, d = R*(.3 + r()*.5); return [cx + Math.cos(a)*d*.8, cy + Math.abs(Math.sin(a))*d*(up ? -.6 : .6) + (up ? -12 : 12)]; },
    force:b => { const dx = b.x-cx, dy = b.y-cy, d = Math.hypot(dx,dy); let fx = 0, fy = 0; if(d > R*.85){ fx -= dx/d*.5; fy -= dy/d*.5; } if(up && b.y > cy-12) fy -= .5; if(!up && b.y < cy+12) fy += .5; return [fx - dy*.001*(up?1:-1), fy + dx*.001*(up?1:-1)]; }});
  const birds = half(true), fish = half(false);
  g.fillStyle = "rgba(220,235,255,.25)"; g.beginPath(); g.moveTo(cx-R, cy); for(let x = -R; x <= R; x += R/10) g.lineTo(cx+x, cy - 6 + r()*4); for(let x = R; x >= -R; x -= R/10) g.lineTo(cx+x, cy + 6 - r()*4); g.fill();
  g.lineWidth = .8; birds.forEach(b => { g.strokeStyle = "rgba(255,255,255,.3)"; trail(g, b.t, 80); const p = last(b.t), a = Math.atan2(b.vy,b.vx);
    g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(p[0]-Math.cos(a+1.3)*5, p[1]-Math.sin(a+1.3)*5); g.lineTo(p[0],p[1]); g.lineTo(p[0]-Math.cos(a-1.3)*5, p[1]-Math.sin(a-1.3)*5); g.stroke(); g.lineWidth = .8; });
  fish.forEach(b => { g.strokeStyle = rgba(c,.5); trail(g, b.t, 80); const p = last(b.t), a = Math.atan2(b.vy,b.vx);
    g.save(); g.translate(p[0],p[1]); g.rotate(a); g.fillStyle = c; g.beginPath(); g.ellipse(0,0,5,2.2,0,0,TAU); g.fill(); g.beginPath(); g.moveTo(-4,0); g.lineTo(-8,-3); g.lineTo(-8,3); g.fill(); g.restore(); });
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.4; g.beginPath(); g.arc(cx,cy,R,0,TAU); g.stroke();
  g.fillStyle = "rgba(0,0,0,.18)"; for(let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
};
/* D01-02 Batman Returns：月夜、哥德式天際線，蝙蝠群從城市竄出 */
ART.case["D01-02"] = function(g, W, H, r, c){
  const sky = g.createLinearGradient(0,0,0,H); sky.addColorStop(0, rgba(c,.28)); sky.addColorStop(1, "rgba(10,10,14,0)"); g.fillStyle = sky; g.fillRect(0,0,W,H);
  const mx = W*.68, my = H*.3, mr = W*.17, mg = g.createRadialGradient(mx,my,mr*.6,mx,my,mr*2.2); mg.addColorStop(0,"rgba(255,245,220,.35)"); mg.addColorStop(1,"rgba(255,245,220,0)"); g.fillStyle = mg; g.fillRect(0,0,W,H);
  g.fillStyle = "#EDE6D2"; g.beginPath(); g.arc(mx,my,mr,0,TAU); g.fill();
  const B = sim2(r, {W, H, n:55, steps:120, sp:2.4, R:36, Rs:10, mg:-999, w:[1.4,.9,.8], init:() => [W*.15 + r()*W*.2, H*.75 + r()*H*.1], a0:-1.2,
    force:b => { const dx = mx-b.x, dy = my-b.y, d = Math.hypot(dx,dy)||1; return [dx/d*.12, dy/d*.12]; }});
  B.forEach(b => { const k = 30 + (b.i*7)%85, p = b.t[k], q = b.t[k-1], s = 3 + (b.i%4), a = Math.atan2(p[1]-q[1], p[0]-q[0]), fl = Math.sin(b.i*1.7)*.5;
    g.save(); g.translate(p[0],p[1]); g.rotate((a + Math.PI/2)*.3); g.fillStyle = "#0A0A0E"; g.strokeStyle = rgba(c,.6); g.lineWidth = .6; g.beginPath();
    g.moveTo(0,0); g.quadraticCurveTo(-s, -s*(1+fl), -s*2.4, -s*.2*fl); g.quadraticCurveTo(-s*1.6, s*.1, -s*1.2, s*.5); g.quadraticCurveTo(-s*.6, s*.2, 0, s*.6);
    g.quadraticCurveTo(s*.6, s*.2, s*1.2, s*.5); g.quadraticCurveTo(s*1.6, s*.1, s*2.4, -s*.2*fl); g.quadraticCurveTo(s, -s*(1+fl), 0, 0); g.fill(); g.stroke(); g.restore(); });
  // 哥德式天際線
  g.fillStyle = "#08080B"; g.beginPath(); g.moveTo(0,H); let x = 0;
  while(x < W){ const w = 10 + r()*22, h = H*(.12 + r()*.2), y = H - h; g.lineTo(x, y); if(r() < .45){ g.lineTo(x + w/2, y - h*(.3 + r()*.5)); } g.lineTo(x + w, y); x += w; }
  g.lineTo(W,H); g.fill();
  g.fillStyle = "rgba(242,160,7,.7)"; for(let i = 0; i < 26; i++) g.fillRect(r()*W, H - r()*H*.14, 1.5, 2.5);
};
ART.case["D01-02"].ratio = .85;
/* D01-03 Swarm Urbanism：代理人軌跡成為路網，建築量體沿最近道路方向排列（鳥瞰） */
ART.case["D01-03"] = function(g, W, H, r, c){
  const cs = 6, n = Math.ceil(W/cs), m = Math.ceil(H/cs), A = new Float32Array(n*m).fill(NaN);
  g.fillStyle = "rgba(90,120,170,.22)"; g.beginPath(); g.moveTo(W,0); for(let y = 0; y <= H; y += 10) g.lineTo(W*.84 + Math.sin(y*.03)*W*.05, y); g.lineTo(W,H); g.fill();
  const B = sim2(r, {W:W*.8, H, n:13, steps:200, sp:2.2, R:70, Rs:30, mg:20, w:[1.2,2,.05]});
  B.forEach(b => b.t.forEach((p, i) => { if(!i) return; const q = b.t[i-1], k = Math.floor(p[1]/cs)*n + Math.floor(p[0]/cs); if(k >= 0 && k < A.length) A[k] = Math.atan2(p[1]-q[1], p[0]-q[0]); }));
  for(let j = 1; j < m; j += 2) for(let i = 1; i < n; i += 2){ if(!isNaN(A[j*n+i])) continue; let a = NaN;
    for(let d = 1; d <= 3 && isNaN(a); d++) for(let dj = -d; dj <= d && isNaN(a); dj++) for(let di = -d; di <= d; di++){ const ii = i+di, jj = j+dj; if(ii >= 0 && jj >= 0 && ii < n && jj < m && !isNaN(A[jj*n+ii])){ a = A[jj*n+ii]; break; } }
    if(isNaN(a) || i*cs > W*.8) continue; const w = 5 + r()*4, h = 3 + r()*4;
    g.save(); g.translate(i*cs, j*cs); g.rotate(a); g.fillStyle = r() < .12 ? rgba(c,.8) : "rgba(255,255,255,.28)"; g.fillRect(-w/2,-h/2,w,h); g.restore(); }
  g.lineCap = "round"; B.forEach(b => { g.strokeStyle = "#3A3A48"; g.lineWidth = 4; trail(g, b.t); }); B.forEach(b => { g.strokeStyle = rgba(c,.8); g.lineWidth = .8; trail(g, b.t); });
  g.fillStyle = "rgba(90,200,120,.25)"; for(let i = 0; i < 3; i++){ g.beginPath(); g.arc(r()*W*.7+W*.05, r()*H*.8+H*.1, 8 + r()*10, 0, TAU); g.fill(); }
};
/* D01-04 Composite Swarm：代理人以身體相連搭成的拱橋構件（立面、節點＋連桿） */
ART.case["D01-04"] = function(g, W, H, r, c){
  const y0 = H*.72, N = []; g.fillStyle = "#2E2E3A"; g.fillRect(0, y0, W*.14, H-y0); g.fillRect(W*.86, y0, W*.14, H-y0);
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0,y0); g.lineTo(W,y0); g.stroke();
  for(let i = 0; i < 150; i++){ const t = r(), x = W*.14 + t*W*.72, arch = Math.sin(t*Math.PI), th = 10 + 22*(1-arch) + 6;
    N.push([x + (r()-.5)*6, y0 - arch*H*.4 - (r()-.5)*th - th*.2, 2 + r()*2.5, r()*TAU]); }
  g.lineWidth = .9; g.strokeStyle = rgba(c, .6); N.forEach(p => { const d = N.map((q, j) => [Math.hypot(q[0]-p[0], q[1]-p[1]), j]).sort((a, b) => a[0]-b[0]).slice(1, 4);
    d.forEach(([dd, j]) => { if(dd < 26){ g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(N[j][0], N[j][1]); g.stroke(); } }); });
  g.fillStyle = "#fff"; N.forEach(p => { g.beginPath(); g.ellipse(p[0], p[1], p[2], p[2]*.6, p[3], 0, TAU); g.fill(); });
  // 裝飾觸鬚
  g.strokeStyle = rgba(c,.9); g.lineWidth = 1.3; for(let k = 0; k < 9; k++){ const p = N[(r()*N.length)|0]; let x = p[0], y = p[1], a = Math.PI/2 + (r()-.5); g.beginPath(); g.moveTo(x,y);
    for(let s = 0; s < 14; s++){ a += (r()-.5)*.6; x += Math.cos(a)*3; y += Math.sin(a)*3; g.lineTo(x,y); } g.stroke(); }
  g.fillStyle = "rgba(255,255,255,.4)"; for(let i = 0; i <= 10; i++) g.fillRect(W*.14 + i*W*.072, H*.92, 1, i%5 ? 4 : 8); g.fillRect(W*.14, H*.92, W*.72, 1);
};
ART.case["D01-04"].ratio = .78;
/* D01-05 AADRL 空中機器人拉線：四根柱子之間由無人機拉出的線網（等角） */
ART.case["D01-05"] = function(g, W, H, r, c){
  const pr = isoP(W, H, W*.3, .5, .72), posts = [[-1,-1],[1,-1],[1,1],[-1,1]];
  g.fillStyle = "rgba(255,255,255,.05)"; U.poly(g, posts.map(p => pr(p[0]*1.2, p[1]*1.2, 0)), true); g.fill();
  const anc = () => { const k = (r()*4)|0; return [posts[k][0], posts[k][1], .2 + r()*1.6]; };
  for(let d = 0; d < 5; d++){ let a = anc(); g.strokeStyle = d === 0 ? "#fff" : rgba(c, .75); g.lineWidth = d === 0 ? 1.1 : .8;
    for(let s = 0; s < 9; s++){ const b = anc(); if(b[0] === a[0] && b[1] === a[1]) continue; g.beginPath(); for(let t = 0; t <= 10; t++){ const u = t/10, p = pr(a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u, a[2]+(b[2]-a[2])*u - Math.sin(u*Math.PI)*.15); t ? g.lineTo(...p) : g.moveTo(...p); } g.stroke(); a = b; } }
  posts.forEach(([x,y]) => { const a = pr(x,y,0), b = pr(x,y,2); g.strokeStyle = "#8A8A98"; g.lineWidth = 3; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); });
  [[-.2,.1,2.5],[.5,-.4,2.2],[-.6,.6,2.0]].forEach(([x,y,z], k) => { const p = pr(x,y,z), s = 7;
    g.strokeStyle = rgba(c,.8); g.setLineDash([2,3]); g.lineWidth = .8; const q = pr(posts[k][0], posts[k][1], 1); g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); g.setLineDash([]);
    g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(p[0]-s,p[1]-s*.5); g.lineTo(p[0]+s,p[1]+s*.5); g.moveTo(p[0]+s,p[1]-s*.5); g.lineTo(p[0]-s,p[1]+s*.5); g.stroke();
    [[-s,-s*.5],[s,s*.5],[s,-s*.5],[-s,s*.5]].forEach(([dx,dy]) => { g.beginPath(); g.ellipse(p[0]+dx, p[1]+dy, 4, 1.8, 0, 0, TAU); g.stroke(); }); });
};
ART.case["D01-05"].ratio = 1.1;
/* D01-06 空中積層製造：無人機在飛行中擠出材料，一層層疊起的曲牆（等角），另一台掃描 */
ART.case["D01-06"] = function(g, W, H, r, c){
  const pr = isoP(W, H, W*.32, .5, .66), L = 26, path = k => { const t = k/40*2 - 1; return [t*1.2, Math.sin(t*3)*.35]; };
  g.fillStyle = "rgba(255,255,255,.04)"; U.poly(g, [[-1.4,-1],[1.4,-1],[1.4,1],[-1.4,1]].map(p => pr(p[0],p[1],0)), true); g.fill();
  for(let l = 0; l < L; l++){ const z = l*.035, top = l === L-1, end = top ? 26 : 40; g.strokeStyle = top ? "#fff" : rgba(c, .35 + .6*l/L); g.lineWidth = 2.2; g.beginPath();
    for(let k = 0; k <= end; k++){ const [x,y] = path(k), p = pr(x, y, z); k ? g.lineTo(...p) : g.moveTo(...p); } g.stroke(); }
  const zt = (L-1)*.035, tip = path(26), tp = pr(tip[0], tip[1], zt), d1 = pr(tip[0], tip[1], zt + .75);
  const drone = (p, col) => { g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath(); g.moveTo(p[0]-9,p[1]); g.lineTo(p[0]+9,p[1]); g.stroke(); [-9,9].forEach(dx => { g.beginPath(); g.ellipse(p[0]+dx, p[1]-2, 6, 1.6, 0, 0, TAU); g.stroke(); }); g.fillStyle = col; g.fillRect(p[0]-3,p[1]-1,6,5); };
  g.strokeStyle = "#F2A007"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(d1[0], d1[1]+4); g.lineTo(...tp); g.stroke(); drone(d1, "#fff");
  const d2 = pr(-.9, -.6, 1.6), sa = pr(-.9, -.15, .5), sb = pr(-.3, -.1, .6); g.fillStyle = rgba(c,.2); U.poly(g, [[d2[0],d2[1]+4], sa, sb], true); g.fill(); drone(d2, c);
  g.strokeStyle = "rgba(255,255,255,.4)"; g.setLineDash([3,4]); g.lineWidth = .8; g.beginPath(); for(let k = 0; k <= 30; k++){ const t = k/30, p = pr(-1.2 + t*2.4, .6 - Math.sin(t*Math.PI)*.8, 1.9 + Math.sin(t*6)*.1); k ? g.lineTo(...p) : g.moveTo(...p); } g.stroke(); g.setLineDash([]);
};
/* D01-07 Behavioural Production：群體軌跡向上生長，穿過樓板構成的塔（等角），旁有人形比例 */
ART.case["D01-07"] = function(g, W, H, r, c){
  const B = sim3(r, {n:30, steps:130, sp:.05, R:.5, Rs:.18, w:[1,1,.8], init:() => [r()*1.2-.6, r()*1.2-.6, -1.6],
    bound:b => { const s = .7 - (b.z+1.6)*.08; return [b.x > s ? -.1 : b.x < -s ? .1 : 0, b.y > s ? -.1 : b.y < -s ? .1 : 0, .05]; }});
  const pr = isoP(W, H, W*.3, .5, .56);
  const slab = (z, s) => { const q = [[-s,-s],[s,-s],[s,s],[-s,s]].map(p => pr(p[0],p[1],z)); g.fillStyle = "rgba(255,255,255,.07)"; U.poly(g, q, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1; g.stroke(); };
  const zs = [-1.6, -.9, -.2, .5, 1.2];
  zs.forEach((z, k) => { slab(z, .8 - k*.07); g.lineWidth = .9;
    B.forEach(b => { g.strokeStyle = rgba(c, .75); g.beginPath(); let pen = false; b.t.forEach(p => { if(p[2] < z || p[2] > (zs[k+1] ?? 9)){ pen = false; return; } const q = pr(...p); pen ? g.lineTo(...q) : g.moveTo(...q); pen = true; }); g.stroke(); }); });
  const f = pr(1.1, 1.1, -1.6); g.fillStyle = "#fff"; g.beginPath(); g.arc(f[0], f[1]-16, 2.2, 0, TAU); g.fill(); g.fillRect(f[0]-1.5, f[1]-13, 3, 13);
};
ART.case["D01-07"].ratio = 1.3;
/* D01-08 Ghost Tectonics：半透明列印外殼（立面），碳纖維沿應力流向布置 */
ART.case["D01-08"] = function(g, W, H, r, c){
  const gy = H*.8, cx = W/2, sw = W*.4, sh = H*.55, prof = x => { const u = (x-cx)/sw; return Math.abs(u) > 1 ? 0 : Math.pow(1 - Math.pow(Math.abs(u), 2.4), .6); };
  const top = x => gy - prof(x)*sh*(1 + .08*Math.sin(x*.05));
  const gr = g.createLinearGradient(0, gy-sh, 0, gy); gr.addColorStop(0, "rgba(255,255,255,.28)"); gr.addColorStop(1, "rgba(255,255,255,.06)"); g.fillStyle = gr;
  g.beginPath(); g.moveTo(cx-sw, gy); for(let x = cx-sw; x <= cx+sw; x += 2) g.lineTo(x, top(x)); g.lineTo(cx+sw, gy); g.fill();
  // 開口
  g.fillStyle = "#15151B"; g.beginPath(); g.ellipse(cx - sw*.3, gy, sw*.18, sh*.32, 0, Math.PI, TAU); g.fill();
  // 碳纖維：由支點匯聚到頂部的應力流線
  for(let k = 0; k < 34; k++){ const x0 = cx - sw + (k/33)*sw*2, x1 = cx + (r()-.5)*sw*.5, bend = (r()-.5)*.4;
    g.strokeStyle = k%4 === 0 ? c : "rgba(10,10,14,.85)"; g.lineWidth = k%4 === 0 ? 1.3 : 1; g.beginPath();
    for(let s = 0; s <= 24; s++){ const t = s/24, x = x0 + (x1-x0)*Math.sin(t*Math.PI/2) + Math.sin(t*Math.PI)*bend*sw*.3, y = gy - (gy - top(x))*Math.pow(t, .8)*.97; s ? g.lineTo(x,y) : g.moveTo(x,y); } g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.3; g.beginPath(); for(let x = cx-sw; x <= cx+sw; x += 2) x === cx-sw ? g.moveTo(x, top(x)) : g.lineTo(x, top(x)); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();
  const px = cx + sw*1.12; g.fillStyle = "#fff"; g.beginPath(); g.arc(px, gy-22, 2.5, 0, TAU); g.fill(); g.fillRect(px-1.8, gy-19, 3.6, 19);
};
ART.case["D01-08"].ratio = .8;
/* D01-09 Franchise Freedom：海邊夜空的發光無人機椋鳥群，亮度隨密度，海面倒影 */
ART.case["D01-09"] = function(g, W, H, r, c){
  const hz = H*.74; g.fillStyle = "#0E0E16"; g.fillRect(0, hz, W, H-hz); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0,hz); g.lineTo(W,hz); g.stroke();
  const nz = U.vnoise(((r()*1e6)|0) + 11), P = [];
  for(let tries = 0; P.length < 700 && tries < 20000; tries++){ const t = r(), x = W*(.12 + .76*t), cy = H*.4 + Math.sin(t*5 + 1)*H*.12, th = H*(.05 + .12*Math.sin(t*Math.PI));
    const y = cy + (r()+r()+r()-1.5)*th, w = nz(x*.03, y*.03); if(w > .35) P.push([x + (w-.5)*14, y]); }
  const cs = 8, cnt = new Map(); P.forEach(([x,y]) => { const k = Math.floor(x/cs) + "," + Math.floor(y/cs); cnt.set(k, (cnt.get(k)||0) + 1); });
  let mx = 1; cnt.forEach(v => { if(v > mx) mx = v; }); g.globalCompositeOperation = "lighter";
  P.forEach(([x,y]) => { const d = cnt.get(Math.floor(x/cs) + "," + Math.floor(y/cs))/mx, col = d > .6 ? "#FFFFFF" : c;
    g.fillStyle = rgba(col, .25 + .6*d); g.beginPath(); g.arc(x, y, .8 + 1.2*d, 0, TAU); g.fill();
    if(r() < .25){ g.fillStyle = rgba(c, .12*d + .03); g.fillRect(x, hz + (hz - y)*.25 + 4, 1, 3 + r()*6); } });
  g.globalCompositeOperation = "source-over";
  g.fillStyle = "#07070A"; for(let x = 0; x < W; x += 3){ const h = 6 + (x > W*.7 ? 18 + (Math.sin(x)*6|0) : 0); g.fillRect(x, hz - h*.3, 3, h*.3); }
};
ART.case["D01-09"].ratio = .8;
/* D01-10 Gossamer Skins：高樓立面，以 stigmergy 密度做四分樹面板，孔徑＝孔隙率；右側性能色條 */
ART.case["D01-10"] = function(g, W, H, r, c){
  const x0 = W*.16, x1 = W*.78, y0 = H*.05, y1 = H*.96, nz = U.vnoise(((r()*1e6)|0) + 5);
  const dens = (x, y) => { const u = (x-x0)/(x1-x0), v = (y-y0)/(y1-y0); return Math.min(1, Math.max(0, .5*nz(u*3, v*6) + .6*Math.exp(-Math.pow((u - .5 - .3*Math.sin(v*5))*4, 2)))); };
  const quad = (x, y, w, h, d) => { const m = dens(x+w/2, y+h/2);
    if(d < 4 && (m > .35 + d*.12 || d < 1)){ quad(x,y,w/2,h/2,d+1); quad(x+w/2,y,w/2,h/2,d+1); quad(x,y+h/2,w/2,h/2,d+1); quad(x+w/2,y+h/2,w/2,h/2,d+1); return; }
    g.fillStyle = rgba(c, .15 + .6*m); g.fillRect(x+.6, y+.6, w-1.2, h-1.2); g.fillStyle = "#15151B"; g.beginPath(); g.arc(x+w/2, y+h/2, Math.min(w,h)*.42*(1-m), 0, TAU); g.fill(); };
  const fh = (y1-y0)/6; for(let k = 0; k < 6; k++) quad(x0, y0 + k*fh, x1-x0, fh, 0);
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.2; g.strokeRect(x0, y0, x1-x0, y1-y0);
  for(let k = 0; k <= 20; k++){ const t = k/20; g.fillStyle = t > .75 ? "#fff" : rgba(c, .2 + t); g.fillRect(W*.86, y0 + (1-t)*(y1-y0)*.95, W*.05, (y1-y0)/20*.95); }
  g.strokeStyle = "rgba(255,255,255,.4)"; g.strokeRect(W*.86, y0, W*.05, (y1-y0)*.998);
  g.fillStyle = "#F2A007"; g.beginPath(); g.arc(W*.06, H*.1, 6, 0, TAU); g.fill(); g.strokeStyle = "rgba(242,160,7,.35)"; g.lineWidth = 1; for(let k = 0; k < 4; k++){ g.beginPath(); g.moveTo(W*.1, H*.12 + k*6); g.lineTo(x0-3, H*.2 + k*14); g.stroke(); }
};
ART.case["D01-10"].ratio = 1.35;
/* D01-11 Culebra：建模視窗感——透視地面格、邊界框線框、3D 代理人軌跡與節點、座標軸 */
ART.case["D01-11"] = function(g, W, H, r, c){
  const cam = (x, y, z) => { const X = x*.8 - y*.6, Y = x*.6 + y*.8, D = 4 + Y; return [W/2 + X/D*W*1.3, H*.5 + (-z + Y*.35 - .2)/D*W*1.3]; };
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; for(let k = -4; k <= 4; k++){ g.beginPath(); g.moveTo(...cam(k*.5,-2,-1)); g.lineTo(...cam(k*.5,2,-1)); g.moveTo(...cam(-2,k*.5,-1)); g.lineTo(...cam(2,k*.5,-1)); g.stroke(); }
  const V = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]], E = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  g.strokeStyle = "rgba(255,255,255,.35)"; g.setLineDash([3,3]); E.forEach(([a,b]) => { g.beginPath(); g.moveTo(...cam(...V[a])); g.lineTo(...cam(...V[b])); g.stroke(); }); g.setLineDash([]);
  const B = sim3(r, {n:26, steps:110, sp:.05, R:.6, Rs:.2, bound:b => [b.x > .9 ? -.12 : b.x < -.9 ? .12 : 0, b.y > .9 ? -.12 : b.y < -.9 ? .12 : 0, b.z > .9 ? -.12 : b.z < -.9 ? .12 : 0]});
  g.lineWidth = 1; B.forEach(b => { g.strokeStyle = rgba(c,.75); U.poly(g, b.t.map(p => cam(...p))); g.stroke(); const p = cam(...b.t[b.t.length-1]); g.fillStyle = "#fff"; g.fillRect(p[0]-2, p[1]-2, 4, 4); });
  const o = [22, H-22]; [["#E4572E",[16,0]],["#3FA34D",[-8,-8]],["#2F6FE4",[0,-16]]].forEach(([col,d]) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(...o); g.lineTo(o[0]+d[0], o[1]+d[1]); g.stroke(); });
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(3,3,W-6,H-6);
};
ART.case["D01-11"].ratio = .9;
/* D01-12 Quelea：GH 畫布上的元件與連線，右側預覽框是路口的行人與車流 */
ART.case["D01-12"] = function(g, W, H, r, c){
  g.fillStyle = "#24242C"; g.fillRect(0,0,W,H); g.fillStyle = "rgba(255,255,255,.1)"; for(let y = 6; y < H; y += 12) for(let x = 6; x < W; x += 12) g.fillRect(x, y, 1, 1);
  const rr = (x, y, w, h, q) => { g.beginPath(); g.moveTo(x+q, y); g.arcTo(x+w, y, x+w, y+h, q); g.arcTo(x+w, y+h, x, y+h, q); g.arcTo(x, y+h, x, y, q); g.arcTo(x, y, x+w, y, q); g.closePath(); };
  const comp = (x, y, w, h, ni, no, hl) => { g.fillStyle = hl ? rgba(c,.9) : "#5A5A68"; g.strokeStyle = "#111"; g.lineWidth = 1; rr(x, y, w, h, 4); g.fill(); g.stroke();
    const I = [...Array(ni)].map((_, k) => [x, y + h*(k+1)/(ni+1)]), O = [...Array(no)].map((_, k) => [x+w, y + h*(k+1)/(no+1)]);
    g.fillStyle = "#ddd"; [...I, ...O].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 2.2, 0, TAU); g.fill(); }); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(x + w*.3, y + 4, w*.4, h - 8); return {I, O}; };
  const a = comp(W*.04, H*.12, W*.14, H*.14, 0, 1), b = comp(W*.04, H*.4, W*.14, H*.14, 0, 1), d = comp(W*.04, H*.68, W*.14, H*.14, 0, 1);
  const e = comp(W*.28, H*.3, W*.16, H*.36, 3, 2, true);
  const wire = (p, q) => { g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.3; g.beginPath(); g.moveTo(...p); g.bezierCurveTo(p[0] + 30, p[1], q[0] - 30, q[1], q[0], q[1]); g.stroke(); };
  wire(a.O[0], e.I[0]); wire(b.O[0], e.I[1]); wire(d.O[0], e.I[2]);
  const px = W*.52, py = H*.1, pw = W*.44, ph = H*.8; wire(e.O[0], [px, py + ph*.3]); wire(e.O[1], [px, py + ph*.6]);
  g.fillStyle = "#15151B"; g.fillRect(px, py, pw, ph); g.strokeStyle = "rgba(255,255,255,.45)"; g.strokeRect(px, py, pw, ph);
  g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip(); g.translate(px, py);
  g.fillStyle = "#2E2E3A"; g.fillRect(pw*.4, 0, pw*.2, ph); g.fillRect(0, ph*.42, pw, ph*.16);
  const B = sim2(r, {W:pw, H:ph, n:40, steps:90, sp:1.1, R:20, Rs:6, mg:6, w:[1.6,.8,.6], init:() => r() < .5 ? [r()*pw*.35, r()*ph] : [pw*.65 + r()*pw*.35, r()*ph]});
  B.forEach(b => { g.strokeStyle = rgba(c,.5); g.lineWidth = .8; trail(g, b.t, 40); const p = last(b.t); g.fillStyle = "#fff"; g.beginPath(); g.arc(p[0], p[1], 1.6, 0, TAU); g.fill(); });
  for(let k = 0; k < 5; k++){ g.fillStyle = "#F2A007"; g.fillRect(pw*.42 + (k%2)*pw*.09, ph*(.08 + k*.2), pw*.06, ph*.07); g.fillRect(pw*(.05 + k*.2), ph*.44 + (k%2)*ph*.07, pw*.08, ph*.045); }
  g.restore();
};
ART.case["D01-12"].ratio = .75;
/* D01-13 Brass Swarm：黃銅色的代理人肋條浮雕物件，立在台座上 */
ART.case["D01-13"] = function(g, W, H, r, c){
  const cx = W/2, cy = H*.44, R = W*.34, brass = "#C9A24E";
  const B = sim2(r, {W, H, n:40, steps:160, sp:1.8, R:30, Rs:9, mg:-999, w:[1.3,1.3,.7], init:() => { const a = r()*TAU, d = r()*R*.7; return [cx + Math.cos(a)*d, cy + Math.sin(a)*d*.8]; },
    force:b => { const dx = (b.x-cx)/R, dy = (b.y-cy)/(R*.8), d = Math.hypot(dx,dy); return d > .9 ? [-dx*.4, -dy*.4] : [-dy*.06, dx*.06]; }});
  g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(cx, H*.82, R*.8, 7, 0, 0, TAU); g.fill();
  g.fillStyle = "#2E2E3A"; g.fillRect(cx - R*.55, H*.82, R*1.1, H*.14); g.fillStyle = "#3C3C4A"; g.fillRect(cx - R*.55, H*.82, R*1.1, 3);
  g.strokeStyle = brass; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy + R*.7); g.lineTo(cx, H*.82); g.stroke();
  g.lineCap = "round"; B.forEach(b => { g.strokeStyle = "rgba(0,0,0,.6)"; g.lineWidth = 3.4; g.save(); g.translate(1.5, 2); trail(g, b.t, 30); g.restore(); });
  B.forEach((b, i) => { g.strokeStyle = i%5 ? brass : "#F4DC9A"; g.lineWidth = 2; trail(g, b.t, 30); });
  B.forEach(b => { g.strokeStyle = "rgba(255,245,210,.6)"; g.lineWidth = .6; g.save(); g.translate(-.6, -.6); trail(g, b.t, 30); g.restore(); });
  const hl = g.createRadialGradient(cx - R*.3, cy - R*.4, 0, cx - R*.3, cy - R*.4, R*.7); hl.addColorStop(0, "rgba(255,240,200,.18)"); hl.addColorStop(1, "rgba(255,240,200,0)"); g.fillStyle = hl; g.fillRect(0,0,W,H);
};
ART.case["D01-13"].ratio = 1.05;
/* D01-14 RMIT Mace：沿垂直軸纏繞的代理人觸鬚，頂部膨大成錘頭（前後深度明暗） */
ART.case["D01-14"] = function(g, W, H, r, c){
  const cx = W/2, y0 = H*.06, y1 = H*.95, prof = v => v < .45 ? .12 + .88*Math.pow(Math.sin(v/.45*Math.PI), .8) : .12;
  g.strokeStyle = "#8A8A98"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, y0 + 4); g.lineTo(cx, y1); g.stroke();
  const S = []; for(let k = 0; k < 46; k++){ let th = r()*TAU, v = r()*.5; const dv = .004 + r()*.004, dth = (r()-.5)*.25, pts = [];
    for(let s = 0; s < 120; s++){ th += dth + Math.sin(s*.1 + k)*.03; v += dv; if(v > 1) break; const rr = W*.36*prof(v)*(.85 + .15*Math.sin(s*.3 + k)); pts.push([cx + Math.cos(th)*rr, y0 + v*(y1-y0), Math.sin(th)]); } S.push(pts); }
  g.lineCap = "round";
  [-1, 1].forEach(side => S.forEach(pts => { for(let i = 1; i < pts.length; i++){ const p = pts[i], q = pts[i-1]; if((p[2] > 0) !== (side > 0)) continue;
    g.strokeStyle = side > 0 ? rgba(c, .5 + .5*p[2]) : rgba(c, .18); g.lineWidth = side > 0 ? 1 + 1.6*p[2] : .8; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(p[0], p[1]); g.stroke(); } }));
  S.forEach(pts => { const p = pts[pts.length-1]; if(p && p[2] > 0){ g.fillStyle = "#fff"; g.beginPath(); g.arc(p[0], p[1], 1.6, 0, TAU); g.fill(); } });
  g.fillStyle = "#8A8A98"; g.beginPath(); g.arc(cx, y0 + 4, 4, 0, TAU); g.fill();
};
ART.case["D01-14"].ratio = 1.35;
})();
