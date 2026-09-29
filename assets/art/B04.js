/* B04 葉序：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
const TAU = Math.PI * 2, GA = 137.508 * Math.PI / 180;

// ---------- 共用小工具 ----------
// 平面 Vogel 葉序點：回傳 [x, y, i, t]，半徑以 1 為外緣
function vogel(n, ang = GA, k = .5){
  const out = [];
  for(let i = 0; i < n; i++){ const a = i*ang, rr = Math.pow(i/n, k); out.push([rr*Math.cos(a), rr*Math.sin(a), i, i/n]); }
  return out;
}
// Fibonacci 球面點：回傳 [x, y, z]
function fibSphere(n){
  const out = [];
  for(let i = 0; i < n; i++){ const z = 1 - 2*(i + .5)/n, rr = Math.sqrt(1 - z*z), a = i*GA; out.push([rr*Math.cos(a), rr*Math.sin(a), z, i]); }
  return out;
}
// 繞 X 軸、Z 軸旋轉後正投影
function rot(p, ax, az){
  const ca = Math.cos(az), sa = Math.sin(az), x = p[0]*ca - p[1]*sa, y = p[0]*sa + p[1]*ca, z = p[2];
  const cb = Math.cos(ax), sb = Math.sin(ax);
  return [x, y*cb - z*sb, y*sb + z*cb];
}
function dot(g, x, y, rad, col){ g.fillStyle = col; g.beginPath(); g.arc(x, y, Math.max(.3, rad), 0, TAU); g.fill(); }
function glow(g, x, y, rad, col){
  const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad*2, rad*2);
}
// 鉛筆草圖般的細格線（圖紙背景）
function paperGrid(g, W, H, step, col){
  g.strokeStyle = col; g.lineWidth = .5; g.beginPath();
  for(let x = step; x < W; x += step){ g.moveTo(x, 0); g.lineTo(x, H); }
  for(let y = step; y < H; y += step){ g.moveTo(0, y); g.lineTo(W, y); }
  g.stroke();
}
// 以低解析度網格求最近種子點，畫出 Voronoi 色塊與邊界
function voronoi(g, W, H, seeds, fill, edge, step){
  const nx = Math.ceil(W/step), ny = Math.ceil(H/step), id = new Int32Array(nx*ny);
  // 以桶格加速最近點搜尋
  const B = 12, bw = W/B, bh = H/B, bucket = Array.from({length: B*B}, () => []);
  seeds.forEach((s, k) => { const bx = Math.min(B-1, Math.max(0, (s[0]/bw)|0)), by = Math.min(B-1, Math.max(0, (s[1]/bh)|0)); bucket[by*B+bx].push(k); });
  for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++){
    const x = (i+.5)*step, y = (j+.5)*step, bx = Math.min(B-1, (x/bw)|0), by = Math.min(B-1, (y/bh)|0);
    let best = -1, bd = 1e18;
    for(let rad = 0; rad < B; rad++){
      for(let yy = by-rad; yy <= by+rad; yy++) for(let xx = bx-rad; xx <= bx+rad; xx++){
        if(yy < 0 || xx < 0 || yy >= B || xx >= B) continue;
        if(Math.max(Math.abs(yy-by), Math.abs(xx-bx)) !== rad) continue;
        for(const k of bucket[yy*B+xx]){ const dx = seeds[k][0]-x, dy = seeds[k][1]-y, d = dx*dx+dy*dy; if(d < bd){ bd = d; best = k; } }
      }
      if(best >= 0 && rad*Math.min(bw, bh) > Math.sqrt(bd) + Math.max(bw, bh)) break;
    }
    id[j*nx+i] = best;
  }
  for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++){
    const k = id[j*nx+i]; if(k < 0) continue;
    const f = fill(k); if(f){ g.fillStyle = f; g.fillRect(i*step, j*step, step+.4, step+.4); }
    if(edge && ((i < nx-1 && id[j*nx+i+1] !== k) || (j < ny-1 && id[(j+1)*nx+i] !== k))){ g.fillStyle = edge; g.fillRect(i*step, j*step, step, step); }
  }
  return id;
}

// ---------- 變形 ----------
ART.var["B04"] = [
  // V01 發散角掃描：3×3 小圖對照有理角、黃金角與偏離值
  function(g, W, H, r, c){
    const angs = [360*1/3, 360*3/8, 360*5/13, 137.3, 137.508, 137.7, 360*8/21, 139, 135];
    const cols = 3, rows = 3, cw = W/cols, ch = H/rows, n = 260;
    angs.forEach((deg, k) => {
      const cx = (k%cols + .5)*cw, cy = ((k/cols|0) + .5)*ch, R = Math.min(cw, ch)*.42, gold = k === 4;
      g.strokeStyle = gold ? "rgba(242,160,7,.7)" : "rgba(255,255,255,.12)"; g.lineWidth = gold ? 1.2 : .6;
      g.strokeRect(cx - cw/2 + 3, cy - ch/2 + 3, cw - 6, ch - 6);
      vogel(n, deg*Math.PI/180).forEach(p => dot(g, cx + p[0]*R, cy + p[1]*R, .6 + p[3]*1.3, gold ? "#F2A007" : U.rgba(c, .45 + p[3]*.5)));
    });
  },
  // V02 半徑函數：左側三種 k 的半圓扇區，右下角 r(n) 曲線
  function(g, W, H, r, c){
    const cx = W*.42, cy = H*.5, R = Math.min(W, H)*.44, ks = [.5, 1, .3], n = 520;
    ks.forEach((k, s) => {
      const a0 = s*TAU/3 - Math.PI/2, a1 = a0 + TAU/3;
      g.save(); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath(); g.clip();
      vogel(n, GA, k).forEach(p => dot(g, cx + p[0]*R, cy + p[1]*R, 1.1, s === 0 ? U.rgba(c, .9) : s === 1 ? "rgba(255,255,255,.75)" : "#F2A007"));
      g.restore();
      g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a0)*R, cy + Math.sin(a0)*R); g.stroke();
    });
    // 小圖表：r = n^k
    const gx = W*.72, gy = H*.62, gw = W*.25, gh = H*.3;
    g.fillStyle = "rgba(18,18,23,.85)"; g.fillRect(gx - 4, gy - 4, gw + 8, gh + 8);
    g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = .8; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy + gh); g.lineTo(gx + gw, gy + gh); g.stroke();
    ks.forEach((k, s) => { g.strokeStyle = s === 0 ? c : s === 1 ? "#fff" : "#F2A007"; g.lineWidth = 1.4; g.beginPath();
      for(let t = 0; t <= 1.001; t += .05){ const x = gx + t*gw, y = gy + gh - Math.pow(t, k)*gh; t ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); });
  },
  // V03 圓柱葉序：等角視的柱身，點陣沿柱面盤旋（塔樓立面開口）
  function(g, W, H, r, c){
    const cx = W/2, R = W*.24, top = H*.1, bot = H*.9, n = 380, ey = R*.32;
    const pts = [];
    for(let i = 0; i < n; i++){ const a = i*GA, z = i/n; pts.push([Math.cos(a), Math.sin(a), z, i]); }
    // 柱體輪廓
    g.fillStyle = U.rgba(c, .08); g.fillRect(cx - R, top, 2*R, bot - top);
    g.strokeStyle = U.rgba(c, .5); g.lineWidth = 1;
    g.beginPath(); g.moveTo(cx - R, top); g.lineTo(cx - R, bot); g.moveTo(cx + R, top); g.lineTo(cx + R, bot); g.stroke();
    g.beginPath(); g.ellipse(cx, top, R, ey, 0, 0, TAU); g.stroke();
    g.beginPath(); g.ellipse(cx, bot, R, ey, 0, 0, Math.PI); g.stroke();
    // 背面先、正面後
    pts.sort((a, b) => a[1] - b[1]).forEach(p => {
      const x = cx + p[0]*R, y = bot - p[2]*(bot - top) + p[1]*ey, front = p[1] > 0;
      const w = 1.2 + 2.2*Math.max(0, p[1]);
      if(front){ g.fillStyle = U.rgba(c, .5 + .5*p[1]); g.fillRect(x - w*Math.abs(p[1])*.6 - .6, y - 2.2, w*Math.abs(p[1])*1.2 + 1.2, 4.4); }
      else dot(g, x, y, .9, "rgba(255,255,255,.18)");
    });
    // 地面陰影
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(cx + R*.4, bot + ey*.6, R*1.4, ey*.8, 0, 0, TAU); g.fill();
  },
  // V04 Fibonacci Sphere：球面均佈點，前亮後暗，附經緯線
  function(g, W, H, r, c){
    const cx = W/2, cy = H/2, R = Math.min(W, H)*.4, ax = .5, az = r()*TAU;
    glow(g, cx, cy, R*1.3, U.rgba(c, .15));
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = .7;
    for(let la = -2; la <= 2; la++){ const z = la/3, rr = Math.sqrt(1 - z*z); g.beginPath();
      for(let k = 0; k <= 48; k++){ const q = rot([rr*Math.cos(k/48*TAU), rr*Math.sin(k/48*TAU), z], ax, 0); k ? g.lineTo(cx + q[0]*R, cy - q[2]*R) : g.moveTo(cx + q[0]*R, cy - q[2]*R); } g.stroke(); }
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
    fibSphere(420).map(p => rot(p, ax, az)).sort((a, b) => b[1] - a[1]).forEach(q => {
      const front = -q[1]; dot(g, cx + q[0]*R, cy - q[2]*R, front > 0 ? 1 + front*1.8 : .8, front > 0 ? U.rgba(c, .45 + front*.55) : "rgba(255,255,255,.12)");
    });
  },
  // V05 UV 映射：透視的波浪殼屋頂（寬跨），點陣包覆其上並沿法向長出鰭片，四角落柱
  function(g, W, H, r, c){
    const ph = r()*6;
    const S = (u, v) => [(u - .5)*2.4, v*2.2, .55*Math.pow(Math.sin(u*Math.PI), .7)*(.75 + .25*Math.sin(v*4 + ph)) + .12*Math.sin(u*9 + v*3)];
    const P = q => { const d = 1 + q[1]*.32; return [W/2 + q[0]*W*.42/d, H*.9 - q[1]*H*.2/d - q[2]*H*.5/d, d]; };
    const Q = (u, v) => P(S(u, v));
    // 落柱與地面線
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1;
    [[0,0],[1,0],[0,1],[1,1]].forEach(([u, v]) => { const a = Q(u, v), b = P([(u-.5)*2.4, v*2.2, 0]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
    g.beginPath(); [[0,0],[1,0],[1,1],[0,1],[0,0]].forEach(([u, v], k) => { const b = P([(u-.5)*2.4, v*2.2, 0]); k ? g.lineTo(b[0], b[1]) : g.moveTo(b[0], b[1]); }); g.stroke();
    // 殼面填色與 UV 格線
    g.fillStyle = U.rgba(c, .1); g.beginPath();
    for(let s2 = 0; s2 <= 30; s2++){ const p = Q(s2/30, 0); s2 ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
    for(let s2 = 30; s2 >= 0; s2--){ const p = Q(s2/30, 1); g.lineTo(p[0], p[1]); } g.closePath(); g.fill();
    g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = .6;
    for(let k = 0; k <= 14; k++){ g.beginPath(); for(let s2 = 0; s2 <= 30; s2++){ const p = Q(k/14, s2/30); s2 ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke();
      g.beginPath(); for(let s2 = 0; s2 <= 30; s2++){ const p = Q(s2/30, k/14); s2 ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); }
    // 葉序 UV 點 → 曲面，沿近似法向伸出鰭片（由遠到近畫）
    const pts = vogel(900).map(p => [(p[0] + 1)/2, (p[1] + 1)/2, p[3]]);
    pts.sort((a, b) => b[1] - a[1]).forEach(p => {
      const e = .01, A = S(p[0], p[1]), du = S(p[0] + e, p[1]), dv = S(p[0], p[1] + e);
      const tu = [du[0]-A[0], du[1]-A[1], du[2]-A[2]], tv = [dv[0]-A[0], dv[1]-A[1], dv[2]-A[2]];
      let n = [tu[1]*tv[2]-tu[2]*tv[1], tu[2]*tv[0]-tu[0]*tv[2], tu[0]*tv[1]-tu[1]*tv[0]]; const L = Math.hypot(...n) || 1; n = n.map(x => x/L*.13);
      const a = P(A), b = P([A[0]+n[0], A[1]+n[1], A[2]+n[2]]);
      g.strokeStyle = U.rgba(c, .95 - p[1]*.45); g.lineWidth = 1.6/a[2];
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
      dot(g, b[0], b[1], 1/a[2], "rgba(255,255,255,.75)");
    });
  },
  // V06 吸引子：方形穿孔板，開孔依吸引子距離放大
  function(g, W, H, r, c){
    const m = W*.08, x0 = m, y0 = m, pw = W - 2*m, ph = H - 2*m, ax = x0 + pw*(.25 + r()*.5), ay = y0 + ph*(.25 + r()*.3);
    g.fillStyle = "#4A4A55"; g.fillRect(x0, y0, pw, ph);
    g.strokeStyle = "rgba(255,255,255,.3)"; g.strokeRect(x0, y0, pw, ph);
    const R = Math.hypot(pw, ph)*.62, n = 700, s = R/Math.sqrt(n), dmax = Math.hypot(pw, ph)*.7;
    g.save(); g.beginPath(); g.rect(x0, y0, pw, ph); g.clip();
    glow(g, ax, ay, pw*.45, U.rgba(c, .35));
    vogel(n).forEach(p => { const x = x0 + pw/2 + p[0]*R, y = y0 + ph/2 + p[1]*R;
      const d = Math.hypot(x - ax, y - ay)/dmax, rad = s*(.52 - .44*Math.min(1, d));
      dot(g, x, y, rad, d < .35 ? U.rgba(c, .95) : "#121217"); });
    g.restore();
    g.strokeStyle = "#F2A007"; g.lineWidth = 1.2; g.beginPath(); g.arc(ax, ay, 4, 0, TAU); g.moveTo(ax - 9, ay); g.lineTo(ax + 9, ay); g.moveTo(ax, ay - 9); g.lineTo(ax, ay + 9); g.stroke();
  },
  // V07 影像灰階：穿孔金屬板上的側臉半色調，孔徑由假影像亮度決定
  function(g, W, H, r, c){
    const m = W*.06, x0 = m, y0 = m, pw = W - 2*m, ph = H - 2*m;
    g.fillStyle = "#34343D"; g.fillRect(x0, y0, pw, ph);
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(x0, y0, pw, ph);
    // 側臉剪影（面向右）：額頭、鼻、唇、下巴、頸、後腦
    const face = new Path2D(), X = t => x0 + pw*t, Y = t => y0 + ph*t;
    face.moveTo(X(.3), Y(1)); face.lineTo(X(.34), Y(.78));
    face.bezierCurveTo(X(.2), Y(.7), X(.12), Y(.45), X(.2), Y(.25));
    face.bezierCurveTo(X(.3), Y(.05), X(.58), Y(.06), X(.64), Y(.22));
    face.bezierCurveTo(X(.66), Y(.3), X(.68), Y(.36), X(.8), Y(.46));
    face.lineTo(X(.68), Y(.5)); face.lineTo(X(.72), Y(.55)); face.lineTo(X(.67), Y(.58)); face.lineTo(X(.7), Y(.63));
    face.bezierCurveTo(X(.64), Y(.68), X(.58), Y(.7), X(.52), Y(.69));
    face.lineTo(X(.54), Y(.8)); face.lineTo(X(.62), Y(1)); face.closePath();
    const lx = X(.8), ly = Y(.2);
    const img = (x, y) => { if(!g.isPointInPath(face, x*dpr, y*dpr)) return .1;
      const d = Math.hypot(x - lx, y - ly)/Math.hypot(pw, ph); return Math.max(.25, Math.min(1, 1.25 - d*1.3)); };
    const dpr = g.getTransform().a || 1;
    const cx = x0 + pw/2, cy = y0 + ph/2, R = Math.hypot(pw, ph)*.52, n = 2400, s = R/Math.sqrt(n);
    g.save(); g.beginPath(); g.rect(x0, y0, pw, ph); g.clip();
    vogel(n).forEach(p => { const x = cx + p[0]*R, y = cy + p[1]*R; if(x < x0 || y < y0 || x > x0 + pw || y > y0 + ph) return;
      const b = img(x, y); dot(g, x, y, s*.62*b, b > .2 ? "rgba(246,236,210,.95)" : "rgba(0,0,0,.6)"); });
    g.restore();
    // 板角螺栓
    [[x0+6, y0+6], [x0+pw-6, y0+6], [x0+6, y0+ph-6], [x0+pw-6, y0+ph-6]].forEach(([x, y]) => dot(g, x, y, 2, "rgba(255,255,255,.55)"));
  },
  // V08 曲線邊界裁切：不規則基地輪廓內均佈
  function(g, W, H, r, c){
    const nz = U.vnoise((r()*1e6)|0), cx = W/2, cy = H/2, R0 = Math.min(W, H)*.36, M = 90;
    const rad = a => R0*(.72 + .55*nz(Math.cos(a)*1.3 + 5, Math.sin(a)*1.3 + 5)) * (1 + .18*Math.cos(2*a));
    const bnd = []; for(let k = 0; k < M; k++){ const a = k/M*TAU; bnd.push([cx + Math.cos(a)*rad(a)*1.15, cy + Math.sin(a)*rad(a)*.95]); }
    paperGrid(g, W, H, W/12, "rgba(255,255,255,.05)");
    g.fillStyle = U.rgba(c, .07); U.poly(g, bnd, true); g.fill();
    g.save(); U.poly(g, bnd, true); g.clip();
    const RR = Math.min(W, H)*.62, n = 1100, s = RR/Math.sqrt(n);
    vogel(n).forEach(p => dot(g, cx + p[0]*RR, cy + p[1]*RR, s*.28, U.rgba(c, .9)));
    g.restore();
    // 外面淡淡的被剔除點
    const RR2 = Math.min(W, H)*.62; g.globalAlpha = .12; vogel(1100).forEach(p => dot(g, cx + p[0]*RR2, cy + p[1]*RR2, .8, "#fff")); g.globalAlpha = 1;
    g.strokeStyle = "#F2A007"; g.lineWidth = 1.6; g.setLineDash([5, 3]); U.poly(g, bnd, true); g.stroke(); g.setLineDash([]);
  },
  // V09 Voronoi 鑲板：矩形屋頂格柵，每片內縮留縫（雷切片）
  function(g, W, H, r, c){
    const R = Math.hypot(W, H)*.52, n = 260, seeds = vogel(n).map(p => [W/2 + p[0]*R, H/2 + p[1]*R, p[3]]);
    const [cr, cg, cb] = U.rgb(c);
    voronoi(g, W, H, seeds, k => { const t = .35 + .5*(1 - seeds[k][2]) + .15*((k*7)%5)/5; return `rgb(${cr*t|0},${cg*t|0},${cb*t|0})`; }, "#121217", 1);
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);
  },
  // V10 Parastichy：21 與 34 兩組相反螺旋的放射 diagrid
  function(g, W, H, r, c){
    const cx = W/2, cy = H/2, R = Math.min(W, H)*.46, n = 500, P = vogel(n).map(p => [cx + p[0]*R, cy + p[1]*R, p[3]]);
    [[21, U.rgba(c, .85)], [34, "rgba(242,160,7,.75)"]].forEach(([F, col]) => {
      g.strokeStyle = col; g.lineWidth = 1.1;
      for(let s = 0; s < F; s++){ g.beginPath(); let first = true;
        for(let i = s; i < n; i += F){ if(i < 20) continue; first ? g.moveTo(P[i][0], P[i][1]) : g.lineTo(P[i][0], P[i][1]); first = false; } g.stroke(); }
    });
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R*1.01, 0, TAU); g.stroke();
    g.beginPath(); g.arc(cx, cy, R*.2, 0, TAU); g.stroke();
  },
  // V11 Blooms 3D 花苞：側視，球面葉序每點伸出長度遞增的錐體
  function(g, W, H, r, c){
    const cx = W/2, cy = H*.56, R = Math.min(W, H)*.2, ax = 1.05, az = r()*TAU, n = 240;
    const items = [];
    fibSphere(n*2).forEach(p => { if(p[2] < -.2) return; const L = 1 + 1.3*(1 - p[2]);
      const a = rot(p, ax, az), b = rot([p[0]*L, p[1]*L, p[2]*L], ax, az); items.push([a, b, p[3]/(n*2)]); });
    items.sort((u, v) => v[0][1] - u[0][1]);
    glow(g, cx, cy, R*3, U.rgba(c, .14));
    items.forEach(([a, b, t]) => {
      const f = Math.max(0, -a[1]), x1 = cx + a[0]*R, y1 = cy - a[2]*R, x2 = cx + b[0]*R, y2 = cy - b[2]*R;
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, w = 1.5 + 3*t, nx = -dy/L*w, ny = dx/L*w;
      g.fillStyle = f > 0 ? U.rgba(c, .35 + .6*f) : "rgba(255,255,255,.12)";
      g.beginPath(); g.moveTo(x1 + nx, y1 + ny); g.lineTo(x2, y2); g.lineTo(x1 - nx, y1 - ny); g.closePath(); g.fill();
    });
    // 轉台
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, H*.9, W*.3, H*.04, 0, 0, TAU); g.stroke();
  },
  // V12 可製造開孔板：等角爆炸圖，上板開孔、下方一排傾斜鱗片
  function(g, W, H, r, c){
    const iso = (x, y, z) => [W*.5 + (x - y)*W*.36, H*.44 + (x + y)*W*.18 - z*H*.5];
    const quad = (pts, fill, stroke) => { U.poly(g, pts, true); if(fill){ g.fillStyle = fill; g.fill(); } if(stroke){ g.strokeStyle = stroke; g.stroke(); } };
    // 板厚
    const z0 = .32, t = .03;
    quad([iso(-.6, .6, z0), iso(.6, .6, z0), iso(.6, .6, z0 - t), iso(-.6, .6, z0 - t)], "#3A3A44");
    quad([iso(.6, -.6, z0), iso(.6, .6, z0), iso(.6, .6, z0 - t), iso(.6, -.6, z0 - t)], "#2E2E37");
    quad([iso(-.6, -.6, z0), iso(.6, -.6, z0), iso(.6, .6, z0), iso(-.6, .6, z0)], "#5A5A66", "rgba(255,255,255,.4)");
    vogel(300).forEach(p => { const x = p[0]*.78, y = p[1]*.78; if(Math.abs(x) > .56 || Math.abs(y) > .56) return;
      const rad = .012 + .022*p[3], [sx, sy] = iso(x, y, z0);
      g.fillStyle = "#121217"; g.beginPath(); g.ellipse(sx, sy, rad*W*.5, rad*W*.25, 0, 0, TAU); g.fill(); });
    // 雷切路徑示意
    g.strokeStyle = "#F2A007"; g.lineWidth = .8; g.setLineDash([3, 3]);
    g.beginPath(); const a = iso(.6, .6, z0 - t), b = iso(.6, .6, -.02); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.setLineDash([]);
    // 鱗片列：沿法向傾斜的矩形板
    for(let k = 0; k < 9; k++){ const u = -.55 + k*.14, tilt = .15 + .1*Math.sin(k*GA);
      quad([iso(u, .75, 0), iso(u + .1, .75, 0), iso(u + .1, .75 - tilt, .12), iso(u, .75 - tilt, .12)], U.rgba(c, .55 + .04*k), "rgba(255,255,255,.35)"); }
  },
];

// V13 對數螺線掃掠成殼（Raup 貝殼）：截面沿 3D 對數螺線纏繞，形成鸚鵡螺般的平旋殼
ART.var["B04"][12] = function(g, W, H, r, c){
  const mixc = (h1, h2, t) => { const a = U.rgb(h1), b2 = U.rgb(h2); return `rgb(${a.map((v,i) => Math.round(v + (b2[i]-v)*t)).join(",")})`; };
  const cx = W/2, cy = H*.55, tilt = .55 + r()*.12;
  const EXP = 1.7 + r()*1.3, Dw = 1.05 + r()*.35, turns = 2.3 + r()*.9, segN = 14;
  const b = Math.log(EXP)/TAU, N = Math.round(turns*30);
  const rings = []; let maxD = 0;
  for(let k = 0; k <= N; k++){
    const th = k/N*turns*TAU, rr = Math.exp(b*th), dx0 = Math.cos(th), dy0 = Math.sin(th);
    const ccx = Dw*rr*dx0, ccy = Dw*rr*dy0;
    const pts3 = []; for(let s = 0; s <= segN; s++){ const ph = s/segN*TAU;
      pts3.push([ccx + rr*Math.cos(ph)*dx0, ccy + rr*Math.cos(ph)*dy0, rr*Math.sin(ph)]); }
    pts3.forEach(p => { maxD = Math.max(maxD, Math.hypot(p[0], p[1], p[2])); });
    rings.push(pts3);
  }
  const scale = Math.min(W, H)*.42/maxD;
  const proj = (x, y, z) => { const y2 = y*Math.cos(tilt) - z*Math.sin(tilt), z2 = y*Math.sin(tilt) + z*Math.cos(tilt); return [cx + x*scale, cy - y2*scale, z2]; };
  g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(cx, cy + maxD*scale*.62, maxD*scale*.72, maxD*scale*.16, 0, 0, TAU); g.fill();
  const drawn = rings.map((pts3, k) => { const pts = pts3.map(p => proj(p[0], p[1], p[2])); const depth = pts.reduce((s, p) => s+p[2], 0)/pts.length; return {pts, depth, k}; });
  drawn.sort((a, b2) => a.depth - b2.depth);
  drawn.forEach(({pts, k}) => {
    const t = k/N, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const grad = g.createLinearGradient(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
    const base = mixc(c, "#ffffff", .08 + .3*t);
    grad.addColorStop(0, mixc(base, "#ffffff", .55));
    grad.addColorStop(.55, base);
    grad.addColorStop(1, mixc(base, "#000000", .55));
    U.poly(g, pts.map(p => [p[0], p[1]]), true); g.fillStyle = grad; g.fill();
    if(k % 4 === 0){ g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = .6; g.stroke(); }
  });
  const mouth = drawn.find(d => d.k === N);
  if(mouth){ U.poly(g, mouth.pts.map(p => [p[0], p[1]]), true); g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 1.4; g.stroke(); }
};
ART.var["B04"][12].ratio = 1.05;

// ---------- 無照片案例 ----------
// B04-01 Blooms 頻閃：底片條上的連續影格，每格雕塑轉 137.5°、閃光燈標記節拍
ART.case["B04-01"] = function(g, W, H, r, c){
  const n = 4, fh = H/n, fw = W*.78, fx = (W - fw)/2 + W*.05;
  // 底片條與齒孔
  g.fillStyle = "#08080A"; g.fillRect(fx - W*.1, 0, fw + W*.2, H);
  g.fillStyle = "#2A2A33";
  for(let y = 4; y < H; y += 10){ g.fillRect(fx - W*.075, y, W*.035, 5); g.fillRect(fx + fw + W*.04, y, W*.035, 5); }
  for(let f = 0; f < n; f++){
    const y0 = f*fh + 4, h = fh - 8, cx = fx + fw/2, cy = y0 + h*.55, R = Math.min(fw*.4, h*.62);
    g.fillStyle = "#16161C"; g.fillRect(fx, y0, fw, h);
    // 閃光：每格左上一顆亮點
    glow(g, fx + 10, y0 + 10, 14, "rgba(255,255,255,.55)");
    // 轉台
    g.fillStyle = "#2E2E37"; g.beginPath(); g.ellipse(cx, cy + R*.28, R*1.05, R*.22, 0, 0, TAU); g.fill();
    // 俯角雕塑：每格旋轉 f×137.5°、新長出的外圈亮起
    const off = f*GA, grow = .7 + f*.1;
    const pts = vogel(220).map(p => { const a = Math.atan2(p[1], p[0]) + off, rr = Math.hypot(p[0], p[1]);
      return [cx + Math.cos(a)*rr*R, cy + Math.sin(a)*rr*R*.4 - Math.cos(rr*Math.PI/2)*R*.35, p[3], Math.sin(a)]; })
      .filter(p => p[2] < grow);
    pts.sort((a, b) => a[3] - b[3]).forEach(p => { const fresh = p[2] > grow - .1;
      g.fillStyle = fresh ? "#F2A007" : U.rgba(c, .45 + .55*(1 - p[2]));
      g.beginPath(); g.ellipse(p[0], p[1], 1.2 + p[2]*2.6, .8 + p[2]*1.5, 0, 0, TAU); g.fill(); });
    // 旋轉角弧
    g.strokeStyle = "rgba(242,160,7,.8)"; g.lineWidth = 1; g.beginPath(); g.arc(fx + fw - 14, y0 + 12, 7, -Math.PI/2, -Math.PI/2 + GA*(f + 1)/(n)); g.stroke();
  }
};
ART.case["B04-01"].ratio = 1.3;

// B04-02 Eden Project The Core：俯角屋頂，21／34 木梁螺旋與八角外牆
ART.case["B04-02"] = function(g, W, H, r, c){
  const cx = W/2, cy = H*.5, R = W*.44, sq = .62, n = 34*21;
  const P = vogel(n).map(p => { const rr = Math.hypot(p[0], p[1]), h = Math.sqrt(Math.max(0, 1 - rr*rr))*.35; return [cx + p[0]*R, cy + p[1]*R*sq - h*R, rr]; });
  // 外牆
  g.fillStyle = "#1E1E26"; g.beginPath(); g.ellipse(cx, cy + R*.08, R*1.02, R*sq*1.02, 0, 0, Math.PI); g.lineTo(cx - R*1.02, cy); g.fill();
  g.fillStyle = "#26262F"; g.fillRect(cx - R*1.02, cy, R*2.04, R*.1);
  [[21, "#C98B4A", 2.2], [34, "#E7B77A", 1.3]].forEach(([F, col, lw]) => { g.strokeStyle = col; g.lineWidth = lw;
    for(let s = 0; s < F; s++){ g.beginPath(); let st = true; for(let i = s; i < n; i += F){ if(i < 30) continue; st ? g.moveTo(P[i][0], P[i][1]) : g.lineTo(P[i][0], P[i][1]); st = false; } g.stroke(); } });
  // 中央天窗
  g.fillStyle = U.rgba(c, .8); g.beginPath(); g.ellipse(cx, cy - R*.35, R*.1, R*.06, 0, 0, TAU); g.fill();
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, cy, R, R*sq, 0, 0, TAU); g.stroke();
};
ART.case["B04-02"].ratio = .8;

// B04-03 太陽能鏡場：北半邊的 Fermat 螺旋定日鏡 + 效率色階
ART.case["B04-03"] = function(g, W, H, r, c){
  const tx = W/2, ty = H*.82, R = Math.min(W*.95, H*1.5)*.72, n = 1100;
  // 地面效率色階
  U.field(g, W, H, 60, Math.round(60*H/W), (i, j) => { const x = i/59*W, y = j/(Math.round(60*H/W)-1)*H, d = Math.hypot(x - tx, y - ty)/R; return y > ty ? .05 : Math.max(0, .75 - d*.6)*(1 - .4*Math.abs(x - tx)/W); }, c, 1.2);
  vogel(n).forEach(p => { const x = tx + p[0]*R, y = ty + p[1]*R; if(y > ty - 10 || x < 0 || x > W || y < 0) return;
    const a = Math.atan2(ty - y, tx - x), s = 2.6 + p[3]*1.2;
    g.save(); g.translate(x, y); g.rotate(a + Math.PI/2); g.fillStyle = "rgba(235,240,255,.85)"; g.fillRect(-s, -.9, 2*s, 1.8); g.restore(); });
  // 吸熱塔與反射光
  g.strokeStyle = "rgba(242,160,7,.25)"; g.lineWidth = .6;
  for(let k = 0; k < 14; k++){ const a = Math.PI + (k + .5)/14*Math.PI; g.beginPath(); g.moveTo(tx, ty - 6); g.lineTo(tx + Math.cos(a)*R*.5, ty + Math.sin(a)*R*.5); g.stroke(); }
  glow(g, tx, ty - 6, 18, "rgba(242,160,7,.9)");
  g.fillStyle = "#fff"; g.fillRect(tx - 2, ty - 8, 4, 12);
  // 北向箭頭
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(W - 14, 26); g.lineTo(W - 14, 10); g.lineTo(W - 18, 15); g.moveTo(W - 14, 10); g.lineTo(W - 10, 15); g.stroke();
};
ART.case["B04-03"].ratio = .78;

// B04-04 葉序塔樓：堆疊樓板，每層五片葉旋轉黃金角並外折遮陽
ART.case["B04-04"] = function(g, W, H, r, c){
  const cx = W/2, floors = 26, base = H*.93, fh = H*.82/floors, R = W*.2;
  g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(cx, base + 3, R*1.9, R*.35, 0, 0, TAU); g.fill();
  for(let f = 0; f < floors; f++){
    const y = base - f*fh, taper = 1 - .35*Math.pow(f/floors, 1.5), rot0 = f*GA;
    // 核心
    g.fillStyle = "#2B2B34"; g.fillRect(cx - R*.35*taper, y - fh, R*.7*taper, fh);
    // 五片葉：以側視（x = cos, 深度 = sin）
    const leaves = [];
    for(let k = 0; k < 5; k++){ const a = rot0 + k*TAU/5; leaves.push([Math.cos(a), Math.sin(a)]); }
    leaves.sort((a, b) => a[1] - b[1]).forEach(([co, si]) => {
      const x = cx + co*R*taper*1.1, w = R*taper*(.35 + .25*Math.abs(si)), front = si > 0;
      g.fillStyle = front ? U.rgba(c, .55 + .45*si) : "rgba(255,255,255,.12)";
      g.beginPath(); g.moveTo(x - w/2, y); g.lineTo(x + w/2, y); g.lineTo(x + w/2 + co*4, y - fh*.55); g.lineTo(x - w/2 + co*4, y - fh*.55); g.closePath(); g.fill();
    });
    g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(cx - R*1.3*taper, y - .5, R*2.6*taper, 1);
  }
};
ART.case["B04-04"].ratio = 1.35;

// B04-05 Phyllo Pavilion：半透空的殼亭子，葉片面板 + 人物比例
ART.case["B04-05"] = function(g, W, H, r, c){
  const cx = W/2, gy = H*.8, R = W*.42, n = 34*6, pts = [];
  // 地面
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();
  g.fillStyle = "rgba(255,255,255,.03)"; g.fillRect(0, gy, W, H - gy);
  for(let i = 0; i < n; i++){ const t = (i + .5)/n, el = Math.asin(t)*.95, az = i*GA;
    const x = Math.cos(el)*Math.cos(az), y = Math.cos(el)*Math.sin(az), z = Math.sin(el);
    const q = rot([x, y, z], -.25, .3); if(Math.cos(az) > .55 && z < .55) continue; // 開口
    pts.push([cx + q[0]*R, gy - q[2]*R*.9 + q[1]*R*.25, q[1], t, az]); }
  pts.sort((a, b) => b[2] - a[2]).forEach(p => {
    const s = 3 + 7*(1 - p[3]), front = p[2] < 0, ang = p[4] + .6;
    g.save(); g.translate(p[0], p[1]); g.rotate(ang); g.fillStyle = front ? U.rgba(c, .5 + .4*(1 - p[3])) : "rgba(255,255,255,.1)";
    g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s*.55, s, 0); g.quadraticCurveTo(0, s*.55, -s, 0); g.fill();
    if(front){ g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .5; g.stroke(); } g.restore(); });
  // 人
  const hx = W*.8, hh = H*.14; g.fillStyle = "rgba(255,255,255,.75)"; g.beginPath(); g.arc(hx, gy - hh, hh*.09, 0, TAU); g.fill(); g.fillRect(hx - hh*.07, gy - hh*.9, hh*.14, hh*.9);
};
ART.case["B04-05"].ratio = .85;

// B04-06 Estufa Fria：溫室剖面（拱形玻璃屋頂）中紅色摺面沿螺旋蔓生
ART.case["B04-06"] = function(g, W, H, r, c){
  const gy = H*.88;
  // 溫室屋架：一排拱與垂直柱
  g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1;
  for(let k = 0; k <= 8; k++){ const x = W*k/8; g.beginPath(); g.moveTo(x, gy); g.lineTo(x, H*.28); g.stroke(); }
  g.beginPath(); g.moveTo(0, H*.28); for(let k = 0; k <= 40; k++){ const x = W*k/40; g.lineTo(x, H*.28 - Math.sin(k/40*Math.PI)*H*.16); } g.stroke();
  for(let k = 1; k < 16; k++){ const x = W*k/16; g.beginPath(); g.moveTo(x, H*.28); g.lineTo(x, H*.28 - Math.sin(k/16*Math.PI)*H*.16); g.stroke(); }
  // 植物剪影
  const nz = U.vnoise(7); g.fillStyle = "rgba(90,140,90,.28)"; g.beginPath(); g.moveTo(0, gy);
  for(let x = 0; x <= W; x += 4) g.lineTo(x, gy - H*.12 - nz(x*.04, 1)*H*.18); g.lineTo(W, gy); g.fill();
  // 紅色摺面：沿 Fibonacci 螺旋的三角面片
  const cx = W*.5, cy = H*.46, R = W*.55, n = 240;
  const P = vogel(n).map(p => [cx + p[0]*R, cy + p[1]*R*.55]);
  for(let i = 8; i < n - 13; i++){ const a = P[i], b = P[i + 8], d = P[i + 13];
    const sh = .45 + .45*Math.abs(Math.sin(i*1.7));
    g.fillStyle = `rgba(${200*sh + 40|0},${40*sh|0},${45*sh|0},.55)`; U.poly(g, [a, b, d], true); g.fill(); }
  g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(0, gy, W, 1.5);
  // 人
  const hx = W*.22, hh = H*.11; g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.arc(hx, gy - hh, hh*.1, 0, TAU); g.fill(); g.fillRect(hx - hh*.07, gy - hh*.88, hh*.14, hh*.88);
};
ART.case["B04-06"].ratio = .9;

// B04-07 Fibonacci Lattice：左側單位方格上的格點 → 等面積投影 → 右側線框球
ART.case["B04-07"] = function(g, W, H, r, c){
  const n = 144, PHI = (1 + Math.sqrt(5))/2;
  const sx = W*.07, sy = H*.2, sw = W*.36, sh = H*.6;
  paperGrid(g, W, H, W/16, "rgba(255,255,255,.04)");
  g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1; g.strokeRect(sx, sy, sw, sh);
  for(let i = 0; i < n; i++){ const u = (i/PHI)%1, v = (i + .5)/n; dot(g, sx + u*sw, sy + v*sh, 1.4, U.rgba(c, .9)); }
  // 箭頭
  const ax = W*.47, ay = H*.5; g.strokeStyle = "#F2A007"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + W*.08, ay); g.lineTo(ax + W*.06, ay - 4); g.moveTo(ax + W*.08, ay); g.lineTo(ax + W*.06, ay + 4); g.stroke();
  // 線框球
  const cx = W*.76, cy = H*.5, R = W*.2, ax2 = .45;
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = .6;
  for(let m = 0; m < 6; m++){ const lon = m/6*Math.PI; g.beginPath(); for(let k = 0; k <= 40; k++){ const la = k/40*TAU; const q = rot([Math.cos(la)*Math.cos(lon), Math.cos(la)*Math.sin(lon), Math.sin(la)], ax2, 0); k ? g.lineTo(cx + q[0]*R, cy - q[2]*R) : g.moveTo(cx + q[0]*R, cy - q[2]*R); } g.stroke(); }
  g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
  fibSphere(n).map(p => rot(p, ax2, .3)).forEach(q => { const f = -q[1]; if(f < 0) return; g.strokeStyle = U.rgba(c, .5 + .5*f); g.lineWidth = 1; g.beginPath(); g.rect(cx + q[0]*R - 1.6, cy - q[2]*R - 1.6, 3.2, 3.2); g.stroke(); });
};
ART.case["B04-07"].ratio = .75;

// B04-08 Coding Challenge：p5 視窗，逐幀畫出的點，依編號變色，尚未畫完
ART.case["B04-08"] = function(g, W, H, r, c){
  const m = 10, top = 22;
  g.fillStyle = "#2C2C35"; g.fillRect(m, m, W - 2*m, top);
  ["#E5534B", "#F2A007", "#57AB5A"].forEach((col, k) => dot(g, m + 10 + k*10, m + top/2, 3, col));
  g.fillStyle = "#0B0B0E"; g.fillRect(m, m + top, W - 2*m, H - 2*m - top);
  const cx = W/2, cy = (H + top)/2, R = Math.min(W - 2*m, H - 2*m - top)*.46, n = 900, drawn = 620, s = R/Math.sqrt(n);
  vogel(n).forEach(p => { if(p[2] > drawn) return; const hue = (p[2]*.35) % 360;
    dot(g, cx + p[0]*R, cy + p[1]*R, s*.42, p[2] === drawn ? "#fff" : `hsl(${hue},70%,60%)`); });
  // 目前幀的游標
  const last = vogel(n)[drawn]; g.strokeStyle = "#fff"; g.lineWidth = 1; g.beginPath(); g.arc(cx + last[0]*R, cy + last[1]*R, s*1.3, 0, TAU); g.stroke();
  // 進度列
  g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(m + 8, H - m - 8, W - 2*m - 16, 3); g.fillStyle = U.rgba(c, .9); g.fillRect(m + 8, H - m - 8, (W - 2*m - 16)*drawn/n, 3);
};
ART.case["B04-08"].ratio = 1;

// B04-09 Voronoi Phyllotaxis：圓形花盤，細胞依編號漸層、中心放大
ART.case["B04-09"] = function(g, W, H, r, c){
  const cx = W/2, cy = H/2, R = Math.min(W, H)*.47, n = 170, seeds = vogel(n).map(p => [cx + p[0]*R, cy + p[1]*R, p[3]]);
  // 外圈加一圈種子，讓邊緣細胞閉合
  for(let k = 0; k < 40; k++){ const a = k/40*TAU; seeds.push([cx + Math.cos(a)*R*1.12, cy + Math.sin(a)*R*1.12, -1]); }
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
  voronoi(g, W, H, seeds, k => { const t = seeds[k][2]; if(t < 0) return null; return `hsl(${35 + t*25},${80 - t*30}%,${62 - t*38}%)`; }, "rgba(18,18,23,.9)", 1);
  g.restore();
  seeds.forEach(s => { if(s[2] >= 0) dot(g, s[0], s[1], 1, "rgba(20,20,25,.8)"); });
  g.strokeStyle = U.rgba(c, .9); g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
};
ART.case["B04-09"].ratio = 1;

// B04-10 立面面板：高樓立面圖，菱形面板以葉序散佈取代格線
ART.case["B04-10"] = function(g, W, H, r, c){
  const x0 = W*.12, x1 = W*.88, y0 = H*.06, y1 = H*.94, fl = 16;
  g.fillStyle = "#23232B"; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = .6;
  for(let k = 1; k < fl; k++){ const y = y0 + (y1 - y0)*k/fl; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
  g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  const cx = (x0 + x1)/2, cy = y0 + (y1 - y0)*.62, R = Math.hypot(x1 - x0, y1 - y0)*.62, n = 650, s = R/Math.sqrt(n);
  vogel(n).forEach(p => { const x = cx + p[0]*R, y = cy + p[1]*R, sz = s*.7, a = Math.atan2(p[1], p[0]);
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = U.rgba(c, .35 + .55*(1 - p[3]));
    g.beginPath(); g.moveTo(-sz, 0); g.lineTo(0, -sz*.6); g.lineTo(sz, 0); g.lineTo(0, sz*.6); g.closePath(); g.fill(); g.restore(); });
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.2; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
  g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(0, y1, W, 1.5);
};
ART.case["B04-10"].ratio = 1.3;

// B04-11 高爾夫球凹洞：打光的白球、葉序凹洞、球座
ART.case["B04-11"] = function(g, W, H, r, c){
  const cx = W/2, cy = H*.44, R = Math.min(W, H)*.34;
  // 球座
  g.fillStyle = U.rgba(c, .85); g.beginPath(); g.moveTo(cx - R*.35, cy + R*.95); g.lineTo(cx + R*.35, cy + R*.95); g.lineTo(cx + R*.06, cy + R*1.25); g.lineTo(cx + R*.05, H*.95); g.lineTo(cx - R*.05, H*.95); g.lineTo(cx - R*.06, cy + R*1.25); g.closePath(); g.fill();
  const sh = g.createRadialGradient(cx - R*.35, cy - R*.4, R*.1, cx, cy, R);
  sh.addColorStop(0, "#FFFFFF"); sh.addColorStop(.7, "#C9CAD2"); sh.addColorStop(1, "#6A6B75");
  g.fillStyle = sh; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  fibSphere(330).map(p => rot(p, .4, 0)).forEach(q => { const f = -q[1]; if(f < .05) return;
    const x = cx + q[0]*R, y = cy - q[2]*R, rad = R*.075;
    const lit = .75 - .35*(q[0]*-.5 + q[2]*.6);
    g.fillStyle = `rgba(60,62,72,${.25*f + .1})`; g.beginPath(); g.ellipse(x, y, rad*Math.sqrt(1 - q[0]*q[0])*1 + .3, rad*Math.sqrt(1 - q[2]*q[2]) + .3, Math.atan2(-q[2], q[0]), 0, TAU); g.fill();
    g.fillStyle = `rgba(255,255,255,${.2*f*lit})`; g.beginPath(); g.arc(x + rad*.25, y + rad*.25, rad*.45, 0, TAU); g.fill(); });
  g.strokeStyle = "rgba(0,0,0,.3)"; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
};
ART.case["B04-11"].ratio = 1.15;

// B04-12 研磨片：略傾斜的砂盤，中心孔、葉序集塵孔、砂粒質感
ART.case["B04-12"] = function(g, W, H, r, c){
  const cx = W/2, cy = H/2, R = Math.min(W, H)*.44, sq = .78;
  g.fillStyle = "rgba(0,0,0,.4)"; g.beginPath(); g.ellipse(cx + 4, cy + 8, R, R*sq, 0, 0, TAU); g.fill();
  g.fillStyle = "#4A3A2C"; g.beginPath(); g.ellipse(cx, cy + 4, R, R*sq, 0, 0, TAU); g.fill();
  g.fillStyle = "#7A5E42"; g.beginPath(); g.ellipse(cx, cy, R, R*sq, 0, 0, TAU); g.fill();
  // 砂粒
  g.save(); g.beginPath(); g.ellipse(cx, cy, R, R*sq, 0, 0, TAU); g.clip();
  for(let k = 0; k < 1800; k++){ const x = cx + (r()*2 - 1)*R, y = cy + (r()*2 - 1)*R*sq; g.fillStyle = r() < .5 ? "rgba(255,230,190,.18)" : "rgba(30,20,10,.25)"; g.fillRect(x, y, 1, 1); }
  g.restore();
  // 集塵孔
  vogel(90).forEach(p => { const rr = Math.hypot(p[0], p[1]); if(rr < .2 || rr > .93) return;
    dot(g, cx + p[0]*R*.95, cy + p[1]*R*.95*sq, 0, "#000"); g.fillStyle = "#121217"; g.beginPath(); g.ellipse(cx + p[0]*R*.95, cy + p[1]*R*.95*sq, R*.04, R*.04*sq, 0, 0, TAU); g.fill(); });
  // 中心孔與背膠圈
  g.fillStyle = "#121217"; g.beginPath(); g.ellipse(cx, cy, R*.1, R*.1*sq, 0, 0, TAU); g.fill();
  g.strokeStyle = U.rgba(c, .8); g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, cy, R*.17, R*.17*sq, 0, 0, TAU); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, cy, R, R*sq, 0, 0, TAU); g.stroke();
};
ART.case["B04-12"].ratio = .9;

// B04-13 Flourish 展品：暗房展場，台座上的雕塑、聚光燈與觀眾
ART.case["B04-13"] = function(g, W, H, r, c){
  const fy = H*.72, cx = W*.5;
  // 牆與地板透視
  g.fillStyle = "#0E0E12"; g.fillRect(0, fy, W, H - fy);
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = .6;
  for(let k = -6; k <= 6; k++){ g.beginPath(); g.moveTo(cx + k*W*.04, fy); g.lineTo(cx + k*W*.25, H); g.stroke(); }
  // 聚光燈
  const sg = g.createLinearGradient(0, 0, 0, fy); sg.addColorStop(0, "rgba(255,255,255,.18)"); sg.addColorStop(1, "rgba(255,255,255,.02)");
  g.fillStyle = sg; g.beginPath(); g.moveTo(cx - 5, 0); g.lineTo(cx + 5, 0); g.lineTo(cx + W*.22, fy); g.lineTo(cx - W*.22, fy); g.closePath(); g.fill();
  // 台座
  const pw = W*.22, py = fy - H*.08; g.fillStyle = "#2E2E37"; g.fillRect(cx - pw/2, py, pw, H*.08 + 4); g.fillStyle = "#3A3A45"; g.beginPath(); g.ellipse(cx, py, pw/2, pw*.12, 0, 0, TAU); g.fill();
  // 小雕塑（側視的葉序圓丘）
  const R = pw*.42;
  fibSphere(260).filter(p => p[2] > 0).map(p => rot(p, 1.2, .5)).sort((a, b) => b[1] - a[1]).forEach(q => {
    const f = Math.max(0, -q[1]); dot(g, cx + q[0]*R, py - pw*.05 - q[2]*R*.9, 1 + f*1.4, f > 0 ? U.rgba(c, .5 + .5*f) : "rgba(255,255,255,.1)"); });
  glow(g, cx, py - R*.5, R*1.6, "rgba(242,160,7,.18)");
  // 觀眾剪影
  [[.16, 1], [.8, .9], [.9, .75]].forEach(([x, s]) => { const hx = W*x, hh = H*.3*s, by = H*.97;
    g.fillStyle = "#050507"; g.beginPath(); g.arc(hx, by - hh, hh*.12, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(hx - hh*.16, by); g.lineTo(hx - hh*.13, by - hh*.82); g.quadraticCurveTo(hx, by - hh*.92, hx + hh*.13, by - hh*.82); g.lineTo(hx + hh*.16, by); g.fill(); });
};
ART.case["B04-13"].ratio = .8;

// B04-14 GH 教學：左側元件節點與連線，右側 Fibonacci Dome 線框
ART.case["B04-14"] = function(g, W, H, r, c){
  paperGrid(g, W, H, W/20, "rgba(255,255,255,.04)");
  // 節點
  const nodes = [[.06, .18], [.06, .42], [.06, .66], [.26, .3], [.26, .58]];
  const nw = W*.14, nh = H*.1;
  const wire = (a, b) => { const x1 = W*a[0] + nw, y1 = H*a[1] + nh/2, x2 = W*b[0], y2 = H*b[1] + nh/2; g.beginPath(); g.moveTo(x1, y1); g.bezierCurveTo(x1 + 20, y1, x2 - 20, y2, x2, y2); g.stroke(); };
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.2;
  wire(nodes[0], nodes[3]); wire(nodes[1], nodes[3]); wire(nodes[2], nodes[4]); wire(nodes[3], nodes[4]);
  g.strokeStyle = U.rgba(c, .9); wire(nodes[4], [.5, .44]);
  nodes.forEach(([x, y], k) => { g.fillStyle = k > 2 ? "#3A3A45" : "#2C2C35"; g.fillRect(W*x, H*y, nw, nh); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8; g.strokeRect(W*x, H*y, nw, nh);
    g.fillStyle = k > 2 ? U.rgba(c, .9) : "rgba(255,255,255,.3)"; g.fillRect(W*x + 3, H*y + nh/2 - 1.5, nw - 6, 3); });
  // 穹頂線框：上半球 Fibonacci 點 + 相鄰連線（i 到 i+8、i+13）
  const cx = W*.74, cy = H*.66, R = W*.24, n = 220, ax = .35;
  const pts = []; for(let i = 0; i < n; i++){ const z = 1 - (i + .5)/n, rr = Math.sqrt(1 - z*z), a = i*GA; pts.push(rot([rr*Math.cos(a), rr*Math.sin(a), z], ax, 0)); }
  const S = q => [cx + q[0]*R, cy - q[2]*R];
  g.lineWidth = .7;
  for(let i = 0; i < n; i++) [8, 13, 21].forEach(F => { if(i + F >= n) return; const a = pts[i], b = pts[i + F], f = -(a[1] + b[1])/2;
    g.strokeStyle = f > 0 ? U.rgba(c, .3 + .5*f) : "rgba(255,255,255,.08)"; const p1 = S(a), p2 = S(b); g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.stroke(); });
  pts.forEach(q => { if(-q[1] > 0){ const p = S(q); dot(g, p[0], p[1], 1.3, "#fff"); } });
  g.strokeStyle = "rgba(255,255,255,.3)"; g.beginPath(); g.ellipse(cx, cy, R, R*Math.sin(ax), 0, 0, TAU); g.stroke();
};
ART.case["B04-14"].ratio = .85;
})();
