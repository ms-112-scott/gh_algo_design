/* A01 L-System：變形與無照片案例的獨立畫法
   每張卡用不同的構圖或視角：透視林地、3D 參數樹、管件與零件表、垂柳倒影、
   平面吸引子、量體修剪、拱頂曲面、生長時間軸、影像驅動立面、吊燈、樹狀柱剖面、
   3D 列印分層；案例：Houdini 建模介面、TouchDesigner 即時演出。 */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = U.TAU;

/* ---------- 共用小工具 ---------- */
// 字串改寫（可帶機率規則，用 r() 決定）
function rewrite(axiom, rules, gens, r, max = 40000){
  let s = axiom;
  for(let k = 0; k < gens; k++){
    let o = "";
    for(const ch of s){
      const R = rules[ch];
      if(!R) o += ch;
      else if(Array.isArray(R)){ let x = r(), acc = 0, pick = R[R.length-1][0]; for(const [t,p] of R){ acc += p; if(x < acc){ pick = t; break; } } o += pick; }
      else o += R;
      if(o.length > max) return o;
    }
    s = o;
  }
  return s;
}
// 2D 畫筆：回傳線段 [x0,y0,x1,y1,深度,離根距離] 與枝端
function walk(str, o, r){
  const segs = [], tips = [], st = [];
  let x = 0, y = 0, h = o.heading ?? -Math.PI/2, len = o.step ?? 1, d = 0, dist = 0, prevF = false;
  const ang = (o.angle ?? 25) * Math.PI/180;
  for(const ch of str){
    if(ch === "F" || ch === "G"){
      const nx = x + Math.cos(h)*len, ny = y + Math.sin(h)*len;
      segs.push([x,y,nx,ny,d,dist]); dist += len; x = nx; y = ny; prevF = true;
    }
    else if(ch === "+") h -= ang*(o.av ? 1 + (r()-.5)*o.av : 1);
    else if(ch === "-") h += ang*(o.av ? 1 + (r()-.5)*o.av : 1);
    else if(ch === "["){ st.push({x,y,h,len,d,dist}); len *= (o.scale ?? 1); d++; prevF = false; }
    else if(ch === "]"){ if(prevF) tips.push([x,y,d]); ({x,y,h,len,d,dist} = st.pop()); prevF = false; }
  }
  if(prevF) tips.push([x,y,d]);
  return {segs, tips};
}
function bbox(pts){ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const p of pts){ if(p[0]<x0)x0=p[0]; if(p[0]>x1)x1=p[0]; if(p[1]<y0)y0=p[1]; if(p[1]>y1)y1=p[1]; } return {x0,y0,x1,y1}; }
function segPts(segs){ const a = []; for(const s of segs){ a.push([s[0],s[1]],[s[2],s[3]]); } return a; }
// 把 bbox 等比例放進矩形（置中，或貼齊底邊）
function fitTo(b, rx, ry, rw, rh, alignBottom){
  const s = Math.min(rw/Math.max(1e-6,b.x1-b.x0), rh/Math.max(1e-6,b.y1-b.y0));
  const ox = rx + (rw - (b.x1-b.x0)*s)/2 - b.x0*s;
  const oy = alignBottom ? ry + rh - b.y1*s : ry + (rh - (b.y1-b.y0)*s)/2 - b.y0*s;
  return {s, X: x => x*s + ox, Y: y => y*s + oy};
}
function ln(g, a, b, c, d){ g.beginPath(); g.moveTo(a,b); g.lineTo(c,d); g.stroke(); }
function mixc(a, b, t){ const A = U.rgb(a), B = U.rgb(b); return `rgb(${A.map((v,i) => Math.round(v + (B[i]-v)*t)).join(",")})`; }
// 3D 向量
const add = (a,b) => [a[0]+b[0],a[1]+b[1],a[2]+b[2]], mul = (a,k) => [a[0]*k,a[1]*k,a[2]*k];
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const norm = a => { const l = Math.hypot(a[0],a[1],a[2]) || 1; return [a[0]/l,a[1]/l,a[2]/l]; };
function rot(v, k, a){ // Rodrigues：v 繞單位軸 k 轉 a
  const c = Math.cos(a), s = Math.sin(a), d = v[0]*k[0]+v[1]*k[1]+v[2]*k[2], x = cross(k, v);
  return [v[0]*c + x[0]*s + k[0]*d*(1-c), v[1]*c + x[1]*s + k[1]*d*(1-c), v[2]*c + x[2]*s + k[2]*d*(1-c)];
}
// 3D 分枝（等同 3D 畫筆 & ^ / 符號的結果）：回傳 segs=[p, q, 階層]
function tree3(r, o){
  const segs = [], tips = [];
  (function br(p, d, len, k){
    const q = add(p, mul(d, len));
    if(o.clip && !o.clip(q)) return;
    segs.push([p, q, k]);
    if(k >= o.depth){ tips.push(q); return; }
    const perp = norm(cross(d, Math.abs(d[1]) < .9 ? [0,1,0] : [1,0,0])), ph = r()*TAU;
    for(let i = 0; i < o.n; i++){
      const ax = rot(perp, d, ph + i*TAU/o.n + (r()-.5)*.5);
      const nd = norm(rot(d, ax, o.tilt*(.75 + .5*r())));
      br(q, nd, len*o.decay*(.85 + .3*r()), k+1);
    }
    if(o.leader) br(q, norm(add(d, [(r()-.5)*.2, 0, (r()-.5)*.2])), len*o.decay, k+1);
  })(o.root || [0,0,0], [0,1,0], o.len, 0);
  return {segs, tips};
}
// 旋轉＋俯角投影：回傳 [螢幕x, 螢幕y(向下), 深度]
function view(yaw, pitch){
  const ca = Math.cos(yaw), sa = Math.sin(yaw), cb = Math.cos(pitch), sb = Math.sin(pitch);
  return p => { const x = p[0]*ca + p[2]*sa, z = -p[0]*sa + p[2]*ca; return [x, -(p[1]*cb) + z*sb, z*cb + p[1]*sb]; };
}

/* ---------- 12 個變形 ---------- */
ART.var["A01"] = [
  // V01 隨機 L-System：透視林地，近大遠小、遠處起霧，每株都不同
  function(g, W, H, r, c){
    const hz = H*.4;
    const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, "rgba(0,0,0,0)"); sky.addColorStop(1, U.rgba(c, .12)); g.fillStyle = sky; g.fillRect(0, 0, W, hz);
    g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1;
    for(let i = -8; i <= 8; i++) ln(g, W/2, hz, W/2 + i*W*.22, H);
    for(let k = 1; k <= 9; k++){ const y = hz + (H-hz)*Math.pow(k/9, 2.2); ln(g, 0, y, W, y); }
    g.strokeStyle = "rgba(255,255,255,.25)"; ln(g, 0, hz, W, hz);
    const trees = []; for(let k = 0; k < 16; k++) trees.push({z: 1 + Math.pow(r(), 1.6)*5, x: r()*1.2 - .1});
    trees.sort((a,b) => b.z - a.z);
    g.lineCap = "round";
    for(const t of trees){
      const str = rewrite("X", {X:[["F[+X][-X]FX",.34],["F[+X]FX",.33],["F[-X]FX",.33]], F:"FF"}, 4 + (r() < .5 ? 1 : 0), r);
      const {segs} = walk(str, {angle: 20 + r()*10, av: .6}, r);
      const b = bbox(segPts(segs)), by0 = hz + (H - hz)*.92/t.z, th = Math.min(H*.95/t.z, by0 - H*.12), s = th/Math.max(1, b.y1 - b.y0);
      const bx = t.x*W, by = hz + (H - hz)*.92/t.z, fog = Math.min(1, .2 + .9/t.z);
      g.fillStyle = `rgba(0,0,0,${.35*fog})`; g.beginPath(); g.ellipse(bx, by, th*.18, th*.025, 0, 0, TAU); g.fill();
      g.strokeStyle = mixc(c, "#1C1C24", 1 - fog); g.lineWidth = Math.max(.5, 1.6/t.z);
      g.beginPath(); for(const q of segs){ g.moveTo(bx + q[0]*s, by + q[1]*s); g.lineTo(bx + q[2]*s, by + q[3]*s); } g.stroke();
    }
  },
  // V02 參數化 L-System：3D 樹依階層上色、長度與粗細遞減，右側是每階長度的衰減圖
  function(g, W, H, r, c){
    const decay = .7, t = tree3(r, {depth: 6, n: 2, leader: true, tilt: .55, decay, len: 1});
    const P = view(.6, .35), pr = t.segs.map(s => [P(s[0]), P(s[1]), s[2]]);
    const pts = []; pr.forEach(s => pts.push(s[0], s[1]));
    const f = fitTo(bbox(pts), W*.05, H*.08, W*.66, H*.84, true);
    pr.sort((a,b) => (a[0][2] + a[1][2]) - (b[0][2] + b[1][2]));
    g.lineCap = "round";
    g.fillStyle = "rgba(255,255,255,.06)"; g.beginPath(); g.ellipse(f.X(0), f.Y(0), W*.2, W*.05, 0, 0, TAU); g.fill();
    for(const [a, b, k] of pr){
      g.strokeStyle = mixc(c, "#FFFFFF", k/6*.75); g.lineWidth = Math.max(.6, 6*Math.pow(decay, k*1.2)*W/300);
      ln(g, f.X(a[0]), f.Y(a[1]), f.X(b[0]), f.Y(b[1]));
    }
    // 參數圖：每一階的長度 l·0.7^k（橫條）與粗細（圓點）
    const x0 = W*.76, x1 = W*.95, y0 = H*.2, y1 = H*.8, bh = (y1 - y0)/7;
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; ln(g, x0, y0 - 6, x0, y1);
    for(let k = 0; k <= 6; k++){
      const w = (x1 - x0)*Math.pow(decay, k), y = y0 + k*bh;
      g.fillStyle = mixc(c, "#FFFFFF", k/6*.75); g.fillRect(x0 + 2, y + bh*.2, w, bh*.55);
      g.beginPath(); g.arc(x0 - 7, y + bh*.47, Math.max(1, 3.2*Math.pow(decay, k)), 0, TAU); g.fill();
    }
    g.strokeStyle = "rgba(255,255,255,.55)"; g.setLineDash([2,3]); g.beginPath();
    for(let i = 0; i <= 30; i++){ const k = i/30*6, px = x0 + 2 + (x1 - x0)*Math.pow(decay, k), py = y0 + k*bh + bh*.47; i ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.stroke(); g.setLineDash([]);
  },
  // V03 線段轉管件：立體圓管＋球形節點＋底座，下方是切好的管件零件表
  function(g, W, H, r, c){
    const t = tree3(r, {depth: 4, n: 2, leader: true, tilt: .6, decay: .72, len: 1});
    const P = view(.4 + r()*.4, .3), pr = t.segs.map(s => [P(s[0]), P(s[1]), s[2], Math.hypot(s[1][0]-s[0][0], s[1][1]-s[0][1], s[1][2]-s[0][2])]);
    const pts = []; pr.forEach(s => pts.push(s[0], s[1]));
    const f = fitTo(bbox(pts), W*.1, H*.05, W*.8, H*.62, true);
    g.fillStyle = "rgba(255,255,255,.1)"; g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1;
    g.beginPath(); g.ellipse(f.X(0), f.Y(0), W*.17, W*.045, 0, 0, TAU); g.fill(); g.stroke();
    pr.sort((a,b) => (a[0][2] + a[1][2]) - (b[0][2] + b[1][2]));
    g.lineCap = "round";
    for(const [a, b, k] of pr){
      const w = Math.max(2, 11*Math.pow(.68, k)*W/300), x0 = f.X(a[0]), y0 = f.Y(a[1]), x1 = f.X(b[0]), y1 = f.Y(b[1]);
      const nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny) || 1, ox = nx/L*w*.22, oy = ny/L*w*.22;
      g.strokeStyle = "#6E6E78"; g.lineWidth = w; ln(g, x0, y0, x1, y1);
      g.strokeStyle = "#D8D8DE"; g.lineWidth = w*.45; ln(g, x0 - ox, y0 - oy, x1 - ox, y1 - oy);
      g.strokeStyle = "#FFFFFF"; g.lineWidth = w*.12; ln(g, x0 - ox*1.6, y0 - oy*1.6, x1 - ox*1.6, y1 - oy*1.6);
      const R = w*.75, gr = g.createRadialGradient(x1 - R*.3, y1 - R*.3, 0, x1, y1, R);
      gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(1, c); g.fillStyle = gr; g.beginPath(); g.arc(x1, y1, R, 0, TAU); g.fill();
    }
    // 零件表：依長度排序的管件，右側小方塊＝階層
    const parts = pr.map(p => [p[3], p[2]]).sort((a,b) => b[0] - a[0]).filter((_, i) => i % 2 === 0).slice(0, 7);
    const top = H*.74, rowH = (H*.23)/parts.length, mx = parts[0][0];
    g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1; ln(g, W*.06, top - 6, W*.94, top - 6);
    parts.forEach(([L, k], i) => {
      const y = top + i*rowH + rowH/2, w = Math.max(2, Math.min(rowH*.7, 9*Math.pow(.68, k)*W/300)), len = (W*.62)*L/mx;
      g.fillStyle = "#8C8C96"; g.fillRect(W*.1, y - w/2, len, w); g.fillStyle = "#E4E4EA"; g.fillRect(W*.1, y - w/2, len, w*.3);
      g.fillStyle = c; g.beginPath(); g.arc(W*.1 + len, y, w*.6, 0, TAU); g.fill();
      g.fillStyle = "rgba(255,255,255,.4)"; for(let j = 0; j <= k; j++) g.fillRect(W*.86 + j*4, y - 1.5, 2.5, 3);
    });
  },
  // V04 向性：重力讓枝條下垂成垂柳，倒映在水面
  function(g, W, H, r, c){
    const wl = H*.8, segs = [];
    (function br(x, y, a, len, k){
      const steps = k < 2 ? 5 : 16, sl = len/steps;
      for(let i = 0; i < steps; i++){
        const pull = k === 0 ? 0 : k === 1 ? .06 : .22 + k*.05;   // 越細的枝，重力越明顯
        const dx = Math.cos(a), dy = Math.sin(a) + pull; a = Math.atan2(dy, dx) + (r()-.5)*.05;
        const nx = x + Math.cos(a)*sl, ny = y + Math.sin(a)*sl;
        segs.push([x, y, nx, ny, k]); x = nx; y = ny;
        if(y > wl - 4) return;
      }
      if(k >= 3) return;
      const n = k === 0 ? 6 : k === 1 ? 4 : 3;
      for(let i = 0; i < n; i++){
        const out = (i/(n-1) - .5)*(k === 0 ? 2.6 : 1.8) + (r()-.5)*.3;
        br(x, y, (k === 0 ? -Math.PI/2 : a) + out, k === 0 ? H*.2 : k === 1 ? H*.36 : H*.3*(.7 + r()*.5), k + 1);
      }
    })(W*.5, wl, -Math.PI/2, H*.3, 0);
    const wg = g.createLinearGradient(0, wl, 0, H); wg.addColorStop(0, U.rgba(c, .1)); wg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = wg; g.fillRect(0, wl, W, H - wl);
    g.lineCap = "round";
    for(const pass of [1, 0]){
      g.save();
      if(!pass){ g.translate(0, 2*wl); g.scale(1, -1); g.globalAlpha = .22; }
      for(const [x0, y0, x1, y1, k] of segs){ g.strokeStyle = mixc(c, "#FFFFFF", k*.12); g.lineWidth = Math.max(.6, [5, 2.6, 1.2, .8][k]*W/300); ln(g, x0, y0, x1, y1); }
      g.restore();
    }
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; ln(g, 0, wl, W, wl);
    g.strokeStyle = "rgba(255,255,255,.08)"; for(let k = 1; k < 7; k++){ const y = wl + k*(H - wl)/7, o = r()*W*.3; ln(g, o, y, o + W*(.2 + r()*.4), y); }
    // 重力方向箭頭
    g.strokeStyle = "rgba(255,255,255,.5)"; g.fillStyle = "rgba(255,255,255,.5)"; const ax = W*.9; ln(g, ax, H*.1, ax, H*.24);
    g.beginPath(); g.moveTo(ax - 4, H*.23); g.lineTo(ax + 4, H*.23); g.lineTo(ax, H*.27); g.fill();
  },
  // V05 吸引子控制：平面鳥瞰，從中央廣場向外分枝，靠近吸引點越密、越長
  function(g, W, H, r, c){
    const S = Math.min(W, H), cx = W/2, cy = H/2, att = [];
    for(let k = 0; k < 3; k++){ const a = k/3*TAU + r(); att.push([cx + Math.cos(a)*S*.33, cy + Math.sin(a)*S*.3, S*.16]); }
    for(const [ax, ay, s] of att){ const gr = g.createRadialGradient(ax, ay, 0, ax, ay, s*1.6); gr.addColorStop(0, "rgba(242,160,7,.35)"); gr.addColorStop(1, "rgba(242,160,7,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1;
    for(let k = 1; k <= 5; k++){ g.beginPath(); g.arc(cx, cy, k*S*.1, 0, TAU); g.stroke(); }
    const w = (x, y) => { let m = 0; for(const [ax, ay, s] of att) m = Math.max(m, Math.exp(-((x-ax)**2 + (y-ay)**2)/(s*s))); return m; };
    const segs = [];
    const go = (x, y, a, k) => {
      const m = w(x, y), L = S*(.035 + .075*m), nx = x + Math.cos(a)*L, ny = y + Math.sin(a)*L;
      if(nx < 0 || ny < 0 || nx > W || ny > H) return;
      segs.push([x, y, nx, ny, k, m]); if(k >= 8) return;
      if(m > .45 || r() < .3 + m){ go(nx, ny, a + .42 + (r()-.5)*.2, k + 1); go(nx, ny, a - .42 + (r()-.5)*.2, k + 1); }
      else go(nx, ny, a + (r()-.5)*.5, k + 1);
    };
    const n0 = 7;
    for(let i = 0; i < n0; i++) go(cx + Math.cos(i/n0*TAU)*S*.06, cy + Math.sin(i/n0*TAU)*S*.06, i/n0*TAU + (r()-.5)*.3, 0);
    g.lineCap = "round";
    for(const [x0, y0, x1, y1, k, m] of segs){ g.strokeStyle = mixc(c, "#FFFFFF", m*.7); g.lineWidth = Math.max(.6, (3.2 - k*.3)*W/300); ln(g, x0, y0, x1, y1); }
    g.fillStyle = "#1C1C24"; g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, S*.06, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = "#F2A007"; for(const [ax, ay] of att){ g.beginPath(); g.arc(ax, ay, 3.5, 0, TAU); g.fill(); }
  },
  // V06 邊界／體積約束：分枝只能長在 L 形建築量體內，等角視圖
  function(g, W, H, r, c){
    const boxes = [[-1.2, 0, -1, 1, 3.4, 1], [1, 0, -1, 2.8, 1.8, 1]];
    const inside = p => boxes.some(b => p[0] > b[0] && p[0] < b[3] && p[1] > b[1] && p[1] < b[4] && p[2] > b[2] && p[2] < b[5]);
    const segs = [];
    for(const root of [[-.1, 0, 0], [1.9, 0, 0]]) segs.push(...tree3(r, {root, depth: 7, n: 2, leader: true, tilt: .7, decay: .8, len: .75, clip: inside}).segs);
    const P = view(-.65, .5), pts = [], edges = [];
    for(const [x0, y0, z0, x1, y1, z1] of boxes){
      const v = [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]].map(P);
      v.forEach(p => pts.push(p));
      [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([a,b]) => edges.push([v[a], v[b]]));
    }
    const f = fitTo(bbox(pts), W*.08, H*.1, W*.84, H*.8);
    g.fillStyle = "rgba(255,255,255,.04)";
    for(const [x0, y0, z0, x1, y1, z1] of boxes){
      const top = [[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]].map(P); U.poly(g, top.map(p => [f.X(p[0]), f.Y(p[1])]), true); g.fill();
    }
    const pr = segs.map(s => [P(s[0]), P(s[1]), s[2]]).sort((a,b) => a[0][2] - b[0][2]);
    g.lineCap = "round";
    for(const [a, b, k] of pr){ g.strokeStyle = mixc(c, "#FFFFFF", Math.min(1, k/7)*.7); g.lineWidth = Math.max(.6, (3.5 - k*.4)*W/300); ln(g, f.X(a[0]), f.Y(a[1]), f.X(b[0]), f.Y(b[1])); }
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.setLineDash([4,3]);
    for(const [a, b] of edges) ln(g, f.X(a[0]), f.Y(a[1]), f.X(b[0]), f.Y(b[1]));
    g.setLineDash([]);
  },
  // V07 在曲面上生長：分枝圖樣在 (u,v) 平面長出，再貼到筒形拱屋頂上成為肋條
  function(g, W, H, r, c){
    const segs = [];
    const go = (u, v, a, len, k) => {
      const nu = u + Math.cos(a)*len, nv = v + Math.sin(a)*len;
      if(nu < 0 || nu > 1 || nv < 0 || nv > 1) return;
      segs.push([u, v, nu, nv, k]); if(k >= 6) return;
      go(nu, nv, a + .5 + (r()-.5)*.3, len*.78, k + 1); go(nu, nv, a - .5 + (r()-.5)*.3, len*.78, k + 1);
    };
    for(let i = 0; i < 4; i++){ go((i + .5)/4, 0, Math.PI/2 + (r()-.5)*.2, .16, 0); go((i + .5)/4, 1, -Math.PI/2 + (r()-.5)*.2, .16, 0); }
    const Lx = 3.2, R = 1, P = view(.55, .42);
    const S = (u, v) => { const th = v*Math.PI; return P([u*Lx - Lx/2, Math.sin(th)*R, Math.cos(th)*R]); };
    const pts = []; for(let i = 0; i <= 8; i++) for(let j = 0; j <= 8; j++) pts.push(S(i/8, j/8));
    const f = fitTo(bbox(pts), W*.06, H*.12, W*.88, H*.76);
    const M = p => [f.X(p[0]), f.Y(p[1])];
    for(let j = 0; j < 24; j++){ // 拱面條帶：明暗表示曲率
      const v0 = j/24, v1 = (j + 1)/24, sh = .04 + .1*Math.sin((v0 + .02)*Math.PI);
      g.fillStyle = `rgba(255,255,255,${sh})`; U.poly(g, [M(S(0, v0)), M(S(1, v0)), M(S(1, v1)), M(S(0, v1))], true); g.fill();
    }
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1;
    for(const u of [0, 1]){ g.beginPath(); for(let j = 0; j <= 30; j++){ const p = M(S(u, j/30)); j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); }
    g.lineCap = "round";
    for(const [u0, v0, u1, v1, k] of segs){
      const a = M(S(u0, v0)), b = M(S(u1, v1));
      g.strokeStyle = mixc(c, "#FFFFFF", k*.1); g.lineWidth = Math.max(.7, (3.4 - k*.45)*W/300); ln(g, a[0], a[1], b[0], b[1]);
    }
    g.strokeStyle = "rgba(255,255,255,.3)"; const e0 = M(S(0, 0)), e1 = M(S(1, 0)), e2 = M(S(0, 1)), e3 = M(S(1, 1));
    ln(g, e0[0], e0[1], e1[0], e1[1]); ln(g, e2[0], e2[1], e3[0], e3[1]);
  },
  // V08 生長動畫：同一株樹逐代長大，由左到右沿時間軸排開，下方是影格刻度與播放頭
  function(g, W, H, r, c){
    const n = 5, base = H*.7, rule = {X:"F[+X][-X]FX", F:"FF"}, ang = 22 + r()*6;
    const trees = []; for(let k = 1; k <= n; k++) trees.push(walk(rewrite("X", rule, k + 1, r), {angle: ang}, r).segs);
    const hs = trees.map(s => { const b = bbox(segPts(s)); return b.y1 - b.y0; }), maxH = hs[n-1];
    const colW = W/n;
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; ln(g, 0, base, W, base);
    g.lineCap = "round";
    trees.forEach((segs, i) => {
      const hTarget = H*.58*(.3 + .7*(i + 1)/n), b = bbox(segPts(segs)), cx = colW*(i + .5);
      const sc = Math.min(hTarget/Math.max(1e-6, b.y1 - b.y0), colW*.95/Math.max(1e-6, b.x1 - b.x0));
      g.strokeStyle = i === n - 1 ? "#FFFFFF" : mixc(c, "#FFFFFF", i*.12); g.globalAlpha = .45 + .55*(i + 1)/n; g.lineWidth = Math.max(.6, 1.3*W/300);
      g.beginPath(); for(const q of segs){ g.moveTo(cx + q[0]*sc, base + q[1]*sc); g.lineTo(cx + q[2]*sc, base + q[3]*sc); } g.stroke();
    });
    g.globalAlpha = 1;
    const ty = H*.84, tx0 = W*.06, tx1 = W*.94;
    g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 3; ln(g, tx0, ty, tx1, ty);
    g.strokeStyle = c; ln(g, tx0, ty, tx0 + (tx1 - tx0)*.86, ty);
    g.fillStyle = "rgba(255,255,255,.5)"; for(let k = 0; k <= 20; k++){ const x = tx0 + (tx1 - tx0)*k/20; g.fillRect(x - .5, ty + 5, 1, k % 4 ? 3 : 6); }
    for(let i = 0; i < n; i++){ const x = colW*(i + .5); g.fillStyle = mixc(c, "#FFFFFF", .3); g.beginPath(); g.moveTo(x, ty - 5); g.lineTo(x + 4, ty); g.lineTo(x, ty + 5); g.lineTo(x - 4, ty); g.fill(); }
    const px = tx0 + (tx1 - tx0)*.86; g.fillStyle = "#FFFFFF"; g.beginPath(); g.moveTo(px - 5, ty - 11); g.lineTo(px + 5, ty - 11); g.lineTo(px, ty - 5); g.fill(); g.fillRect(px - .75, ty - 6, 1.5, 12);
  },
  // V09 影像控制參數：來源灰階影像（右上小圖）→ 立面板片，亮處代數高、分枝密，暗處稀疏
  function(g, W, H, r, c){
    const nz = U.vnoise((r()*1e6)|0), cxI = .3 + r()*.4, cyI = .35 + r()*.3;
    const img = (u, v) => Math.max(0, Math.min(1, 1.25*Math.exp(-((u - cxI)**2*6 + (v - cyI)**2*4.5)) + .25*nz(u*3, v*3) - .12));
    const cols = 5, rows = 6, fx = W*.06, fy = H*.25, fw = W*.88, fh = H*.7, pw = fw/cols, ph = fh/rows;
    g.fillStyle = "#26262F"; g.fillRect(fx, fy, fw, fh);
    const memo = {};
    g.lineCap = "round";
    for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
      const u = (i + .5)/cols, v = (j + .5)/rows, b = img(u, v), gens = 1 + Math.min(3, Math.floor(b*4));
      const x = fx + i*pw, y = fy + j*ph;
      g.fillStyle = U.rgba(c, .03 + b*.4); g.fillRect(x + 1.5, y + 1.5, pw - 3, ph - 3);
      if(!memo[gens]) memo[gens] = walk(rewrite("F", {F:"F[+F]F[-F]F"}, gens, r), {angle: 25.7}, r).segs;
      const segs = memo[gens], bb = bbox(segPts(segs)), s = Math.min((pw - 6)/(bb.x1 - bb.x0 || 1), (ph - 6)/(bb.y1 - bb.y0 || 1));
      const ox = x + pw/2 - (bb.x0 + bb.x1)/2*s, oy = y + ph - 3 - bb.y1*s;
      g.strokeStyle = mixc(c, "#FFFFFF", b*.5); g.globalAlpha = .3 + b*.7; g.lineWidth = Math.max(.5, (.8 + b*.5)*W/300);
      g.beginPath(); for(const q of segs){ g.moveTo(ox + q[0]*s, oy + q[1]*s); g.lineTo(ox + q[2]*s, oy + q[3]*s); } g.stroke(); g.globalAlpha = 1;
    }
    g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1.2;
    for(let j = 0; j <= rows; j++) ln(g, fx, fy + j*ph, fx + fw, fy + j*ph);
    g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1;
    for(let i = 0; i <= cols; i++) ln(g, fx + i*pw, fy, fx + i*pw, fy + fh);
    const iw = W*.2, ih = iw*fh/fw, ix = W*.06, iy = H*.04, n = 15, m = 12;
    g.fillStyle = "#000"; g.fillRect(ix - 2, iy - 2, iw + 4, ih + 4);
    for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const t = img((i + .5)/n, (j + .5)/m), l = Math.round(30 + t*215); g.fillStyle = `rgb(${l},${l},${l})`; g.fillRect(ix + i*iw/n, iy + j*ih/m, iw/n + .5, ih/m + .5); }
    g.strokeStyle = "#FFFFFF"; g.lineWidth = 1; g.strokeRect(ix - 2, iy - 2, iw + 4, ih + 4);
    // 對應箭頭：影像 → 立面
    g.strokeStyle = "rgba(255,255,255,.5)"; g.setLineDash([3,3]); ln(g, ix + iw + 6, iy + ih/2, W*.5, iy + ih/2); ln(g, W*.5, iy + ih/2, W*.5, fy - 6); g.setLineDash([]);
    g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.moveTo(W*.5 - 4, fy - 9); g.lineTo(W*.5 + 4, fy - 9); g.lineTo(W*.5, fy - 3); g.fill();
  },
  // V10 混合 Circle Packing：吊燈，向下分枝的燈架末端掛著互不重疊的發光圓片
  function(g, W, H, r, c){
    const hub = [W/2, H*.2], segs = [], tips = [];
    const go = (x, y, a, len, k) => {
      const nx = x + Math.cos(a)*len, ny = y + Math.sin(a)*len;
      segs.push([x, y, nx, ny, k]);
      if(k >= 5){ tips.push([nx, ny]); return; }
      const sp = .55 - k*.04;
      go(nx, ny, a - sp + (r()-.5)*.25, len*.74, k + 1); go(nx, ny, a + sp + (r()-.5)*.25, len*.74, k + 1);
    };
    for(let i = 0; i < 3; i++) go(hub[0], hub[1], Math.PI/2 + (i - 1)*.95, Math.min(W, H)*.16, 0);
    const halo = g.createRadialGradient(W/2, H*.5, 0, W/2, H*.5, W*.65); halo.addColorStop(0, "rgba(255,200,120,.16)"); halo.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = halo; g.fillRect(0, 0, W, H);
    const ty = H*.9; g.fillStyle = "rgba(255,210,140,.13)"; g.beginPath(); g.ellipse(W/2, ty, W*.38, H*.035, 0, 0, TAU); g.fill();
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; ln(g, W*.08, ty, W*.92, ty);
    g.strokeStyle = "rgba(255,255,255,.6)"; ln(g, W/2, 0, hub[0], hub[1]);
    g.fillStyle = "#DDD"; g.fillRect(W/2 - 5, hub[1] - 4, 10, 6);
    g.lineCap = "round";
    for(const [x0, y0, x1, y1, k] of segs){ g.strokeStyle = mixc(c, "#FFFFFF", .15 + k*.08); g.lineWidth = Math.max(.7, (2.6 - k*.35)*W/300); ln(g, x0, y0, x1, y1); }
    const placed = [];
    for(const [x, y] of tips){
      let R = W*.055; for(const q of placed) R = Math.min(R, Math.hypot(q[0] - x, q[1] - y) - q[2] - 1);
      if(R < 2.5) continue; placed.push([x, y, R]);
      const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, "#FFF4DC"); gr.addColorStop(.7, "#F7C873"); gr.addColorStop(1, "rgba(242,160,7,.55)");
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
    }
  },
  // V11 分枝柱結構：剖面上三支樹狀柱撐起屋頂，構件粗細與顏色＝承受的載重
  function(g, W, H, r, c){
    const roofY = H*.2, gy = H*.86, nCol = 3, lv = 3, span = W*.84/nCol;
    g.strokeStyle = "rgba(255,255,255,.4)"; g.fillStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1;
    for(let k = 0; k <= 16; k++){ const x = W*.08 + k*W*.84/16; ln(g, x, H*.07, x, roofY - 9); g.beginPath(); g.moveTo(x - 2.5, roofY - 10); g.lineTo(x + 2.5, roofY - 10); g.lineTo(x, roofY - 5); g.fill(); }
    g.fillStyle = "#E8E8EE"; g.fillRect(W*.05, roofY - 4, W*.9, 5);
    g.strokeStyle = "rgba(255,255,255,.5)"; ln(g, 0, gy, W, gy);
    g.strokeStyle = "rgba(255,255,255,.18)"; for(let x = -12; x < W; x += 7) ln(g, x, gy + 12, x + 12, gy);
    const lvY = [.18, .36, .58];                         // 各階分岔點離屋頂的比例
    g.lineCap = "round";
    for(let ci = 0; ci < nCol; ci++){
      const x0 = W*.08 + ci*span, m = 2**lv, draw = [];
      let level = []; for(let i = 0; i < m; i++) level.push([x0 + (i + .5)*span/m, roofY + 1, 1]);
      let li = 0;
      while(level.length > 1){
        const up = [];
        for(let i = 0; i < level.length; i += 2){
          const a = level[i], b = level[i + 1];
          const p = [(a[0] + b[0])/2 + (r()-.5)*span*.04, roofY + (gy - roofY)*lvY[li], a[2] + b[2]];
          draw.push([p, a], [p, b]); up.push(p);
        }
        level = up; li++;
      }
      draw.push([[level[0][0], gy, m], level[0]]);
      for(const [a, b] of draw){
        const t = Math.log2(b[2])/lv;
        g.strokeStyle = mixc("#FFFFFF", c, t); g.lineWidth = (1.2 + t*7)*W/300; ln(g, a[0], a[1], b[0], b[1]);
      }
      g.fillStyle = "#FFFFFF"; g.fillRect(level[0][0] - 8, gy - 3, 16, 3);
    }
    const lx = W*.08, ly = H*.93, lw = W*.3, lg = g.createLinearGradient(lx, 0, lx + lw, 0); lg.addColorStop(0, "#FFFFFF"); lg.addColorStop(1, c); g.fillStyle = lg; g.fillRect(lx, ly, lw, 4);
  },
  // V12 空間填充曲線：Hilbert 路徑逐層堆疊成 3D 列印物件，頂層列印中
  function(g, W, H, r, c){
    const str = rewrite("A", {A:"+BF-AFA-FB+", B:"-AF+BFB+FA-"}, 4, r), path = [[0, 0]];
    let x = 0, y = 0, d = 0; for(const ch of str){ if(ch === "+") d = (d + 3) % 4; else if(ch === "-") d = (d + 1) % 4; else if(ch === "F"){ x += [1,0,-1,0][d]; y += [0,1,0,-1][d]; path.push([x, y]); } }
    const pb = bbox(path); path.forEach(p => { p[0] -= pb.x0; p[1] -= pb.y0; });
    const N = 15, layers = 9, a = W*.028, lh = H*.03;
    const iso = (u, v, l) => { const sc = 1 - l*.035, uu = (u - N/2)*sc, vv = (v - N/2)*sc; return [W/2 + (uu - vv)*a, H*.55 + (uu + vv)*a*.5 - l*lh]; };
    g.fillStyle = "rgba(255,255,255,.06)"; g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1;
    U.poly(g, [iso(-2, -2, -.4), iso(N + 2, -2, -.4), iso(N + 2, N + 2, -.4), iso(-2, N + 2, -.4)], true); g.fill(); g.stroke();
    g.lineJoin = "round"; g.lineCap = "round";
    let tip;
    for(let l = 0; l < layers; l++){
      const last = l === layers - 1, end = last ? Math.floor(path.length*.62) : path.length;
      g.strokeStyle = last ? "#FFFFFF" : mixc(c, "#FFFFFF", l/layers*.5); g.globalAlpha = .35 + .65*(l + 1)/layers; g.lineWidth = Math.max(.8, 1.4*W/300);
      g.beginPath(); for(let i = 0; i < end; i++){ const p = iso(path[i][0], path[i][1], l); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke();
      if(last) tip = iso(path[end - 1][0], path[end - 1][1], l);
    }
    g.globalAlpha = 1;
    const [nx, ny] = tip; g.fillStyle = "#C8C8D0"; g.beginPath(); g.moveTo(nx, ny - 2); g.lineTo(nx - 6, ny - 12); g.lineTo(nx + 6, ny - 12); g.fill();
    g.fillRect(nx - 10, ny - 24, 20, 12); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; ln(g, 0, ny - 18, W, ny - 18);
    g.fillStyle = c; g.beginPath(); g.arc(nx, ny, 2.5, 0, TAU); g.fill();
  },
];
[.8, 1.0, 1.25, 1.1, 1.0, .9, .8, .8, 1.3, 1.2, .85, 1.0].forEach((q, i) => ART.var["A01"][i].ratio = q);

/* ---------- 無照片案例 ---------- */
// A01-05 Houdini L-System SOP 與 LsystemBuilding：左側節點網路，右側視窗裡由 L-system 平面長出帶窗的建築量體
ART.case["A01-05"] = function(g, W, H, r, c){
  const pw = W*.24; g.fillStyle = "#1A1A20"; g.fillRect(0, 0, pw, H); g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; ln(g, pw, 0, pw, H);
  const nodes = 5, nh = H*.06, nwid = pw*.7;
  for(let i = 0; i < nodes; i++){
    const y = H*.12 + i*H*.17, x = pw*.15;
    if(i){ g.strokeStyle = "rgba(255,255,255,.4)"; ln(g, x + nwid/2, y - H*.17 + nh, x + nwid/2, y); }
    g.fillStyle = i === 2 ? c : "#3A3A46"; g.fillRect(x, y, nwid, nh);
    g.fillStyle = i === nodes - 1 ? "#4FA3FF" : "rgba(255,255,255,.25)"; g.fillRect(x + nwid - 6, y, 6, nh);
    g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(x + 4, y + nh*.4, nwid*.4, 2);
  }
  // L-system 在格網上長出建築平面，每格依分枝階層擠出樓層
  const str = rewrite("F", {F:[["F[+F]F",.4],["F[-F]F",.4],["FF",.2]]}, 3, r);
  const cells = new Map(), st = []; let x = 0, y = 0, d = 0, k = 0;
  cells.set("0,0", 0);
  for(const ch of str){
    if(ch === "F"){ x += [1,0,-1,0][d]; y += [0,1,0,-1][d]; const key = x + "," + y; if(!cells.has(key) || cells.get(key) > k) cells.set(key, k); }
    else if(ch === "+") d = (d + 1) % 4; else if(ch === "-") d = (d + 3) % 4;
    else if(ch === "["){ st.push([x, y, d, k]); k++; } else if(ch === "]") [x, y, d, k] = st.pop();
  }
  const blocks = [...cells].map(([key, kk]) => { const [bx, by] = key.split(",").map(Number); return [bx, by, Math.max(1, Math.round(7 - kk*1.8 + r()*2))]; });
  blocks.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  const vx = pw, vw = W - pw, pts = [];
  blocks.forEach(([bx, by, h]) => pts.push([bx - by, (bx + by)*.5 - h*.9], [bx + 1 - by, (bx + 1 + by)*.5], [bx - by - 1, (bx + by + 1)*.5], [bx - by, (bx + by + 2)*.5]));
  const f = fitTo(bbox(pts), vx + vw*.08, H*.1, vw*.84, H*.8);
  const P = (u, v, z) => [f.X(u - v), f.Y((u + v)*.5 - z*.9)];
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1;
  const b0 = bbox(blocks.map(b => [b[0], b[1]]));
  for(let i = b0.x0 - 2; i <= b0.x1 + 3; i++){ const a = P(i, b0.y0 - 2, 0), b = P(i, b0.y1 + 3, 0); ln(g, a[0], a[1], b[0], b[1]); }
  for(let j = b0.y0 - 2; j <= b0.y1 + 3; j++){ const a = P(b0.x0 - 2, j, 0), b = P(b0.x1 + 3, j, 0); ln(g, a[0], a[1], b[0], b[1]); }
  const win = (p1, p2, a) => { g.fillStyle = `rgba(255,225,160,${a})`; g.fillRect(Math.min(p1[0], p2[0]), Math.min(p1[1], p2[1]), Math.max(1, Math.abs(p2[0] - p1[0])), Math.max(1, Math.abs(p2[1] - p1[1])*.5)); };
  for(const [bx, by, h] of blocks){
    const faceR = [P(bx + 1, by, 0), P(bx + 1, by + 1, 0), P(bx + 1, by + 1, h), P(bx + 1, by, h)];
    const faceL = [P(bx, by + 1, 0), P(bx + 1, by + 1, 0), P(bx + 1, by + 1, h), P(bx, by + 1, h)];
    const top = [P(bx, by, h), P(bx + 1, by, h), P(bx + 1, by + 1, h), P(bx, by + 1, h)];
    g.fillStyle = "#3B3B47"; U.poly(g, faceR, true); g.fill();
    g.fillStyle = "#2C2C36"; U.poly(g, faceL, true); g.fill();
    g.fillStyle = U.rgba(c, .85); U.poly(g, top, true); g.fill();
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = .8; [faceR, faceL, top].forEach(q => { U.poly(g, q, true); g.stroke(); });
    for(let z = 0; z < h; z++) for(const s of [.25, .6]){
      win(P(bx + 1, by + s, z + .35), P(bx + 1, by + s + .18, z + .7), .75);
      win(P(bx + s, by + 1, z + .35), P(bx + s + .18, by + 1, z + .7), .45);
    }
  }
  const o = [vx + 14, H - 14]; g.lineWidth = 1.5;
  g.strokeStyle = "#E4572E"; ln(g, o[0], o[1], o[0] + 12, o[1] + 6); g.strokeStyle = "#3FA34D"; ln(g, o[0], o[1], o[0], o[1] - 13); g.strokeStyle = "#2F6FE4"; ln(g, o[0], o[1], o[0] - 10, o[1] + 6);
};
ART.case["A01-05"].ratio = .8;

// A01-54 TouchDesigner LSystem SOP：舞台上隨時間長出的發光雪花，下方時間軸，左上是「代數＝時間函式」的階梯曲線
ART.case["A01-54"] = function(g, W, H, r, c){
  const cx = W/2, cy = H*.46, R = Math.min(W, H)*.36, segs = [];
  const arm = (x, y, a, len, k, dist) => {
    const nx = x + Math.cos(a)*len, ny = y + Math.sin(a)*len; segs.push([x, y, nx, ny, k, dist]);
    if(k >= 3) return;
    for(const t of [.35, .65]){
      const px = x + Math.cos(a)*len*t, py = y + Math.sin(a)*len*t, sl = len*.42*(1.2 - t*.5);
      arm(px, py, a + Math.PI/3, sl, k + 1, dist + len*t); arm(px, py, a - Math.PI/3, sl, k + 1, dist + len*t);
    }
  };
  const rot0 = r()*TAU; for(let i = 0; i < 6; i++) arm(cx, cy, rot0 + i*TAU/6, R, 0, 0);
  const grow = .7 + r()*.15, maxD = R*1.1, cut = grow*maxD;
  const sg = g.createRadialGradient(cx, cy, 0, cx, cy, R*1.5); sg.addColorStop(0, U.rgba(c, .25)); sg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = sg; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
  for(const pass of [0, 1]){
    for(const [x0, y0, x1, y1, k, dist] of segs){
      if(dist > cut) continue;
      const front = Math.max(0, 1 - (cut - dist)/(maxD*.25));   // 生長前緣較亮
      g.strokeStyle = pass ? mixc(c, "#FFFFFF", .5 + front*.5) : U.rgba(c, .18);
      g.lineWidth = pass ? Math.max(.7, (2.2 - k*.4)*W/300) : (8 - k*1.5)*W/300;
      ln(g, x0, y0, x1, y1);
    }
  }
  g.restore();
  const gx = W*.06, gy = H*.05, gw = W*.26, gh = H*.1;
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(gx, gy, gw, gh);
  g.strokeStyle = "#FFFFFF"; g.beginPath(); g.moveTo(gx, gy + gh);
  for(let k = 0; k < 5; k++){ const x = gx + gw*k/5, y = gy + gh - gh*(k + 1)/5*.9; g.lineTo(x, y); g.lineTo(x + gw/5, y); }
  g.stroke();
  g.strokeStyle = c; ln(g, gx + gw*grow, gy, gx + gw*grow, gy + gh);
  const ty = H*.9, t0 = W*.06, t1 = W*.94;
  g.fillStyle = "#26262F"; g.fillRect(t0, ty - 7, t1 - t0, 14);
  g.fillStyle = U.rgba(c, .6); g.fillRect(t0, ty - 7, (t1 - t0)*grow, 14);
  g.fillStyle = "rgba(255,255,255,.4)"; for(let k = 0; k <= 24; k++) g.fillRect(t0 + (t1 - t0)*k/24, ty + 9, 1, k % 6 ? 3 : 6);
  g.fillStyle = "#FFFFFF"; for(const k of [0, .2, .45, .7, 1]){ const x = t0 + (t1 - t0)*k; g.beginPath(); g.moveTo(x, ty - 4); g.lineTo(x + 4, ty); g.lineTo(x, ty + 4); g.lineTo(x - 4, ty); g.fill(); }
  g.fillRect(t0 + (t1 - t0)*grow - 1, ty - 12, 2, 24);
};
ART.case["A01-54"].ratio = 1.15;
})();
