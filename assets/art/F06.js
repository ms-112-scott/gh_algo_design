/* F06 奇異吸子：變形與無照片案例的獨立畫法（gh-imgfix 補上；基本生成器已在 assets/gen.js 的 GEN.F06） */
(function(){
const ART = window.ART, U = window.GENUTIL;
ART.var["F06"] = ART.var["F06"] || [];

/* ---------- 共用小工具（純函式，不用 Math.random） ---------- */
// 把一群點依比例縮放、置中到 W×H（留 pad 邊界）
function fitPts(pts, W, H, pad){
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  for(const p of pts){ if(p[0] < minx) minx = p[0]; if(p[0] > maxx) maxx = p[0]; if(p[1] < miny) miny = p[1]; if(p[1] > maxy) maxy = p[1]; }
  const w = (maxx - minx) || 1, h = (maxy - miny) || 1, s = Math.min((W-2*pad)/w, (H-2*pad)/h);
  const ox = (W - w*s)/2 - minx*s, oy = (H - h*s)/2 - miny*s;
  return pts.map(p => [p[0]*s + ox, p[1]*s + oy]);
}
function cornerTicks(g, W, H, pad, len, color){
  g.strokeStyle = color; g.lineWidth = 1;
  [[pad,pad],[W-pad,pad],[pad,H-pad],[W-pad,H-pad]].forEach(([x,y]) => {
    g.beginPath(); g.moveTo(x-len,y); g.lineTo(x+len,y); g.moveTo(x,y-len); g.lineTo(x,y+len); g.stroke();
  });
}
// Clifford：x' = sin(a·y) + c·cos(a·x)、y' = sin(b·x) + d·cos(b·y)（恆定有界，不會發散）
function cliffordPts(a, b, cc, d, n){
  let x = .1, y = .1; const P = new Array(n);
  for(let i = 0; i < n; i++){ const nx = Math.sin(a*y) + cc*Math.cos(a*x), ny = Math.sin(b*x) + d*Math.cos(b*y); x = nx; y = ny; P[i] = [x,y]; }
  return P;
}
// Peter de Jong：x' = sin(a·y) − cos(b·x)、y' = sin(c·x) − cos(d·y)
function dejongPts(a, b, cc, d, n){
  let x = .1, y = .1; const P = new Array(n);
  for(let i = 0; i < n; i++){ const nx = Math.sin(a*y) - Math.cos(b*x), ny = Math.sin(cc*x) - Math.cos(d*y); x = nx; y = ny; P[i] = [x,y]; }
  return P;
}
// Rössler（連續系統，取 XY）：dx=-y-z、dy=x+a·y、dz=b+z(x-c)
function rosslerPts(n, dt){
  let x = 1, y = 1, z = 1; const a = .2, b = .2, cc = 5.7, P = [];
  for(let i = 0; i < n; i++){ const dx = -y-z, dy = x+a*y, dz = b+z*(x-cc); x += dx*dt; y += dy*dt; z += dz*dt; if(i > 200) P.push([x,y]); }
  return P;
}
// Aizawa（連續系統，取 XY）
function aizawaPts(n, dt){
  let x = .1, y = 0, z = 0; const a = .95, b = .7, cc = .6, d = 3.5, e = .25, f = .1, P = [];
  for(let i = 0; i < n; i++){ const dx = (z-b)*x - d*y, dy = d*x + (z-b)*y, dz = cc + a*z - z*z*z/3 - (x*x+y*y)*(1+e*z) + f*z*x*x*x;
    x += dx*dt; y += dy*dt; z += dz*dt; if(i > 300) P.push([x,y]); }
  return P;
}
// Lorenz：dx=σ(y-x)、dy=x(ρ-z)-y、dz=xy-βz；method 'euler' 或 'rk4'
function lorenzTraj(steps, dt, method){
  const sig = 10, rho = 28, beta = 8/3; let x = .1, y = 0, z = 0; const P = new Array(steps);
  const deriv = (x,y,z) => [sig*(y-x), x*(rho-z)-y, x*y-beta*z];
  for(let i = 0; i < steps; i++){
    if(method === 'rk4'){
      const k1 = deriv(x,y,z), k2 = deriv(x+k1[0]*dt/2,y+k1[1]*dt/2,z+k1[2]*dt/2), k3 = deriv(x+k2[0]*dt/2,y+k2[1]*dt/2,z+k2[2]*dt/2), k4 = deriv(x+k3[0]*dt,y+k3[1]*dt,z+k3[2]*dt);
      x += dt/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]); y += dt/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]); z += dt/6*(k1[2]+2*k2[2]+2*k3[2]+k4[2]);
    } else { const d0 = deriv(x,y,z); x += d0[0]*dt; y += d0[1]*dt; z += d0[2]*dt; }
    P[i] = [x,y,z];
  }
  return P;
}
function iso3(p){ const [x,y,z] = p; return [(x-z)*.866, (x+z)*.5 - y]; } // 簡化等角投影
// Barnsley 蕨（IFS 仿射變換組，依機率抽選）
function fernPts(n, r){
  const rows = [[0,0,0,.16,0,0,.01],[.85,.04,-.04,.85,0,1.6,.85],[.2,-.26,.23,.22,0,1.6,.07],[-.15,.28,.26,.24,0,.44,.07]];
  let x = 0, y = 0; const P = [];
  for(let i = 0; i < n; i++){
    const u = r(); let acc = 0, row = rows[3];
    for(const rr of rows){ acc += rr[6]; if(u <= acc){ row = rr; break; } }
    const [a,b,cc,d,e,f] = row, nx = a*x+b*y+e, ny = cc*x+d*y+f; x = nx; y = ny;
    if(i > 19) P.push([x,y]);
  }
  return P;
}

/* ================= 變形 V01–V11 ================= */
// V01 換公式圖鑑：2×3 小格分別畫 Clifford、de Jong、Rössler、Aizawa 等經典吸子
ART.var["F06"][0] = function(g, W, H, r, c, U){
  const cols = 3, rows = 2, gap = W*.025, pw = (W-gap*(cols+1))/cols, ph = (H-gap*(rows+1))/rows;
  const panels = [
    cliffordPts(-1.7,1.3,-.1,-1.2,1500), dejongPts(2.01,-2.53,1.61,-.33,1500),
    rosslerPts(3600,.02), aizawaPts(3600,.012),
    cliffordPts(1.5,-1.8,1.6,.9,1500), dejongPts(-2.24,.43,-.65,-2.43,1500),
  ];
  panels.forEach((pts, idx) => {
    const cx = idx % cols, cy = (idx/cols)|0, x0 = gap + cx*(pw+gap), y0 = gap + cy*(ph+gap);
    const P = fitPts(pts, pw-6, ph-6, 2).map(p => [p[0]+x0+3, p[1]+y0+3]);
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.strokeRect(x0+.5,y0+.5,pw-1,ph-1);
    g.fillStyle = idx % 2 ? "#ffffff" : c; const sz = idx < 2 ? 1.1 : 1;
    P.forEach(p => g.fillRect(p[0],p[1],sz,sz));
  });
};
// V02 密度直方圖著色：柔和漸層場上疊等值線與側邊色階條
ART.var["F06"][1] = function(g, W, H, r, c, U){
  const n = 90, m = Math.max(30, Math.round(n*H/W)), acc = new Float32Array(n*m);
  let x = .1, y = .1; const a = -1.9, b = 1.1, cc = .9, d = -1.4; let mx = 0;
  for(let i = 0; i < 200000; i++){ const nx = Math.sin(a*y)+cc*Math.cos(a*x), ny = Math.sin(b*x)+d*Math.cos(b*y); x = nx; y = ny;
    const px = ((x/(1+Math.abs(cc))+1)/2*n*.92+n*.04)|0, py = ((y/(1+Math.abs(d))+1)/2*m*.92+m*.04)|0;
    if(px >= 0 && py >= 0 && px < n && py < m){ const k = py*n+px; acc[k]++; if(acc[k] > mx) mx = acc[k]; } }
  U.field(g, W, H, n, m, (i,j) => Math.pow(Math.log(1+acc[j*n+i])/Math.log(1+mx), 1.5), c, 1.6);
  const f = (i,j) => Math.log(1+acc[Math.min(m-1,j)*n+Math.min(n-1,i)])/Math.log(1+mx);
  [.15,.32,.5,.7].forEach((lv,k) => { const segs = U.contour(n,m,f,lv);
    g.strokeStyle = U.rgba("#ffffff", .1+k*.08); g.lineWidth = 1; g.beginPath();
    segs.forEach(([p,q]) => { g.moveTo(p[0]*W/n,p[1]*H/m); g.lineTo(q[0]*W/n,q[1]*H/m); }); g.stroke(); });
  const lw = 8, lx = W-18, ly = H*.15, lh = H*.7, grad = g.createLinearGradient(0,ly+lh,0,ly);
  grad.addColorStop(0, U.rgba(c,.15)); grad.addColorStop(1,"#ffffff");
  g.fillStyle = grad; g.fillRect(lx,ly,lw,lh); g.strokeStyle = "rgba(255,255,255,.3)"; g.strokeRect(lx+.5,ly+.5,lw-1,lh-1);
  [0,.33,.66,1].forEach(t => { const ty = ly+lh*(1-t); g.strokeStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.moveTo(lx-3,ty); g.lineTo(lx,ty); g.stroke(); });
};
// V03 軌跡轉管狀雕塑：Lorenz 等角投影，沿速度變化線寬並加高光描邊，模擬管件
ART.var["F06"][2] = function(g, W, H, r, c, U){
  const traj = lorenzTraj(2600,.012,'rk4').map(iso3);
  const pts = fitPts(traj, W*.86, H*.86, 0).map(p => [p[0]+W*.07, p[1]+H*.07]);
  g.lineCap = "round"; g.lineJoin = "round";
  for(let i = 1; i < pts.length; i++){ const t = i/pts.length, wgt = 1.6+1.8*Math.abs(Math.sin(t*9));
    g.strokeStyle = U.rgba(c,.85); g.lineWidth = wgt; g.beginPath(); g.moveTo(pts[i-1][0],pts[i-1][1]); g.lineTo(pts[i][0],pts[i][1]); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath();
  pts.forEach((p,i) => i ? g.lineTo(p[0]-1,p[1]-1) : g.moveTo(p[0]-1,p[1]-1)); g.stroke();
};
// V04 Clifford 點雲升到 3D：以步數扭轉、堆疊成螺旋點雲塔
ART.var["F06"][3] = function(g, W, H, r, c, U){
  const n = 9000, a = 1.4, b = -1.7, cc = 1.0, d = -1.3; let x = .1, y = .1; const raw = new Array(n);
  for(let i = 0; i < n; i++){ const nx = Math.sin(a*y)+cc*Math.cos(a*x), ny = Math.sin(b*x)+d*Math.cos(b*y); x = nx; y = ny; raw[i] = [x,y]; }
  let maxr = 0; raw.forEach(([px,py]) => { const rr = Math.hypot(px,py); if(rr > maxr) maxr = rr; });
  const pts2 = raw.map(([px,py], i) => { const t = i/n, ang = Math.atan2(py,px) + t*U.TAU*4.5, rad = Math.hypot(px,py)/maxr;
    return [Math.cos(ang)*rad, Math.sin(ang)*rad*.55 - t*1.9]; });
  const P = fitPts(pts2, W*.7, H*.92, 4).map(p => [p[0]+(W-W*.7)/2, p[1]+H*.04]);
  g.fillStyle = U.rgba(c,.55); P.forEach(p => g.fillRect(p[0],p[1],1,1));
  g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1; g.beginPath(); g.ellipse(W/2,H*.92,W*.32,H*.05,0,0,U.TAU); g.stroke();
};
// V05 係數沿參數漸變：exploded 軸測堆疊 6 片，每片係數線性內插，形狀逐片不同
ART.var["F06"][4] = function(g, W, H, r, c, U){
  const nL = 6, pw = W*.62, ph = H*.13, gap = (H*.9-ph)/(nL-1), stepX = W*.05;
  for(let k = 0; k < nL; k++){ const t = k/(nL-1), a = -1.6+2.8*t;
    const pts = cliffordPts(a, 1.3, -.9, 1.1, 900);
    const x0 = W*.06 + k*stepX, y0 = H*.05 + k*gap;
    const P = fitPts(pts, pw-8, ph-8, 2).map(p => [p[0]+x0+4,p[1]+y0+4]);
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.strokeRect(x0+.5,y0+.5,pw-1,ph-1);
    g.fillStyle = U.rgba(c, .32+.4*t); P.forEach(p => g.fillRect(p[0],p[1],1,1));
  }
};
// V06 自動搜尋好看的係數：多個候選散落在畫面上，命中的用光環標出（模擬篩選過程）
ART.var["F06"][5] = function(g, W, H, r, c, U){
  const N = 12, selected = new Set([2,6,9]);
  for(let k = 0; k < N; k++){
    const a = (r()-.5)*4, b = (r()-.5)*4, cc = (r()-.5)*3, d = (r()-.5)*3;
    const pts = cliffordPts(a,b,cc,d,450);
    const cx = W*(.12+r()*.76), cy = H*(.12+r()*.76), rad = Math.min(W,H)*(selected.has(k) ? .16 : .08+r()*.05), rot = r()*U.TAU;
    const P = fitPts(pts, rad*2, rad*2, rad*.15);
    g.save(); g.translate(cx,cy); g.rotate(rot);
    g.fillStyle = U.rgba(c, selected.has(k) ? .85 : .22+r()*.2);
    P.forEach(p => g.fillRect(p[0]-rad,p[1]-rad,1.1,1.1));
    g.restore();
    if(selected.has(k)){ g.strokeStyle = "#ffffff"; g.lineWidth = 1.4; g.beginPath(); g.arc(cx,cy,rad*1.15,0,U.TAU); g.stroke(); }
  }
};
// V07 吸子映射到曲面上：把點雲以魚眼極座標投影到圓頂網格，模擬曲面上的浮雕
ART.var["F06"][6] = function(g, W, H, r, c, U){
  const R = Math.min(W,H)*.42, cx = W/2, cy = H/2;
  g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1;
  for(let k = 1; k <= 4; k++){ g.beginPath(); g.arc(cx,cy,R*k/4,0,U.TAU); g.stroke(); }
  for(let k = 0; k < 12; k++){ const ang = k/12*U.TAU; g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+Math.cos(ang)*R,cy+Math.sin(ang)*R); g.stroke(); }
  const rg = g.createRadialGradient(cx,cy,0,cx,cy,R); rg.addColorStop(0, U.rgba(c,.12)); rg.addColorStop(1,"rgba(0,0,0,0)");
  g.fillStyle = rg; g.beginPath(); g.arc(cx,cy,R,0,U.TAU); g.fill();
  const pts = cliffordPts(1.6,-1.9,-1.1,-1.3,4200); let maxr = 0;
  pts.forEach(([px,py]) => { const rr = Math.hypot(px,py); if(rr > maxr) maxr = rr; });
  pts.forEach(([px,py]) => { const ang = Math.atan2(py,px), rn = Math.hypot(px,py)/maxr, rf = Math.sin(rn*Math.PI/2);
    const qx = cx+Math.cos(ang)*rf*R*.94, qy = cy+Math.sin(ang)*rf*R*.94;
    g.fillStyle = U.rgba(c, .5+.4*(1-rf)); g.beginPath(); g.arc(qx,qy,1.1,0,U.TAU); g.fill(); });
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.4; g.beginPath(); g.arc(cx,cy,R,0,U.TAU); g.stroke();
};
// V08 多起點粒子動畫：多條短尾跡由淡到濃、頭端一個實心點，呈現定格畫面
ART.var["F06"][7] = function(g, W, H, r, c, U){
  const N = 6, steps = 1500, dt = .012, trajs = [];
  for(let k = 0; k < N; k++){ let x = .12+(k-N/2)*.0015, y = 0, z = 0; const pts = new Array(steps);
    for(let i = 0; i < steps; i++){ const dx = 10*(y-x), dy = x*(28-z)-y, dz = x*y-(8/3)*z; x += dx*dt; y += dy*dt; z += dz*dt; pts[i] = iso3([x,y,z]); }
    trajs.push(pts); }
  const all = trajs.flat();
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  all.forEach(p => { if(p[0]<minx)minx=p[0]; if(p[0]>maxx)maxx=p[0]; if(p[1]<miny)miny=p[1]; if(p[1]>maxy)maxy=p[1]; });
  const pad = W*.06, s = Math.min((W-2*pad)/((maxx-minx)||1), (H-2*pad)/((maxy-miny)||1));
  const ox = (W-(maxx-minx)*s)/2-minx*s, oy = (H-(maxy-miny)*s)/2-miny*s, tf = p => [p[0]*s+ox, p[1]*s+oy];
  trajs.forEach((pts,k) => { const tail = pts.slice(Math.max(0,pts.length-260));
    for(let i = 1; i < tail.length; i++){ const alpha = .05+.55*(i/tail.length), p = tf(tail[i-1]), q = tf(tail[i]);
      g.strokeStyle = U.rgba(c,alpha); g.lineWidth = 1; g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); }
    const head = tf(pts[pts.length-1]); g.fillStyle = k%2 ? "#ffffff" : c; g.beginPath(); g.arc(head[0],head[1],2.2,0,U.TAU); g.fill(); });
};
// V09 筆繪機輸出：單線簡化折線＋繪圖機邊界與裁切標記，單色無填色
ART.var["F06"][8] = function(g, W, H, r, c, U){
  const steps = 2200, dt = .012; let x = .12, y = 0, z = 0; const raw = new Array(steps);
  for(let i = 0; i < steps; i++){ const dx = 10*(y-x), dy = x*(28-z)-y, dz = x*y-(8/3)*z; x += dx*dt; y += dy*dt; z += dz*dt; raw[i] = [x,z]; }
  const F = fitPts(raw, W*.84, H*.84, 0);
  const thresh = Math.min(W,H)*.018, simp = [F[0]];
  for(let i = 1; i < F.length; i++){ const last = simp[simp.length-1]; if(Math.hypot(F[i][0]-last[0],F[i][1]-last[1]) > thresh) simp.push(F[i]); }
  const padx = W*.08, pady = H*.08, pts2 = simp.map(p => [p[0]+padx,p[1]+pady]);
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(W*.06+.5,H*.06+.5,W*.88-1,H*.88-1);
  cornerTicks(g, W, H, W*.06, 6, "rgba(255,255,255,.4)");
  g.strokeStyle = "#ffffff"; g.lineWidth = 1; g.lineJoin = "miter"; g.beginPath();
  pts2.forEach((p,i) => i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1])); g.stroke();
};
// V10 改用 RK4 積分：Euler（虛線、淡）與 RK4（實線、家族色）同起點疊圖，後段明顯分歧
ART.var["F06"][9] = function(g, W, H, r, c, U){
  const steps = 1400, dt = .016;
  let x = .12, y = 0, z = 0; const A = new Array(steps);
  for(let i = 0; i < steps; i++){ const dx = 10*(y-x), dy = x*(28-z)-y, dz = x*y-(8/3)*z; x += dx*dt; y += dy*dt; z += dz*dt; A[i] = iso3([x,y,z]); }
  const B = lorenzTraj(steps,dt,'rk4').map(iso3);
  const all = A.concat(B);
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  all.forEach(p => { if(p[0]<minx)minx=p[0]; if(p[0]>maxx)maxx=p[0]; if(p[1]<miny)miny=p[1]; if(p[1]>maxy)maxy=p[1]; });
  const pad = W*.08, s = Math.min((W-2*pad)/((maxx-minx)||1), (H-2*pad)/((maxy-miny)||1));
  const ox = (W-(maxx-minx)*s)/2-minx*s, oy = (H-(maxy-miny)*s)/2-miny*s, tf = p => [p[0]*s+ox, p[1]*s+oy];
  g.setLineDash([4,3]); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.beginPath();
  A.forEach((p,i) => { const q = tf(p); i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); }); g.stroke(); g.setLineDash([]);
  g.strokeStyle = c; g.lineWidth = 1.4; g.beginPath();
  B.forEach((p,i) => { const q = tf(p); i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); }); g.stroke();
  const s0 = tf(A[0]); g.fillStyle = "#fff"; g.beginPath(); g.arc(s0[0],s0[1],2.4,0,U.TAU); g.fill();
};
// V11 IFS 仿射變換組（Barnsley 蕨）：真的以機率抽選四條仿射變換跑 chaos game
ART.var["F06"][10] = function(g, W, H, r, c, U){
  const pts = fernPts(22000, r), P = fitPts(pts, W*.86, H*.9, 0), ox = W*.07, oy = H*.05;
  g.fillStyle = U.rgba(c,.75); P.forEach(p => g.fillRect(p[0]+ox,p[1]+oy,1,1.4));
};

/* ================= 沒有照片的案例 ================= */
// F06-01 Paul Bourke 的 Clifford Attractors 圖像：細點散布的海報版式，留白框與裁切角標
ART.case["F06-01"] = function(g, W, H, r, c, U){
  const pts = cliffordPts(-1.24,-1.25,-1.81,-1.9,9000);
  const P = fitPts(pts, W*.72, H*.72, 0), ox = (W-W*.72)/2, oy = (H-H*.72)/2;
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.2; g.strokeRect(W*.08+.5,H*.08+.5,W*.84-1,H*.84-1);
  g.fillStyle = U.rgba("#ffffff",.8); P.forEach(p => g.fillRect(p[0]+ox,p[1]+oy,.9,.9));
  cornerTicks(g, W, H, W*.08, 6, "rgba(255,255,255,.4)");
};
ART.case["F06-01"].ratio = 1.05;
// F06-02 Paul Bourke 的 Peter de Jong Attractors 圖像：de Jong 公式、圓形裁切的霓虹散點
ART.case["F06-02"] = function(g, W, H, r, c, U){
  const pts = dejongPts(-2.24,-.43,-1.21,-1.42,9000), R = Math.min(W,H)*.42, cx = W/2, cy = H/2;
  g.save(); g.beginPath(); g.arc(cx,cy,R,0,U.TAU); g.clip();
  const P = fitPts(pts, R*2.1, R*2.1, 0).map(p => [p[0]+cx-R*1.05, p[1]+cy-R*1.05]);
  g.fillStyle = U.rgba(c,.75); P.forEach(p => g.fillRect(p[0],p[1],1,1));
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.4; g.beginPath(); g.arc(cx,cy,R,0,U.TAU); g.stroke();
};
ART.case["F06-02"].ratio = 1;
// F06-03 Lorenz 水車：混沌實體模型，側視機構圖（輪、桶、水滴）
ART.case["F06-03"] = function(g, W, H, r, c, U){
  const cx = W*.5, cy = H*.46, R = Math.min(W,H)*.32;
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(cx-R*.15,cy); g.lineTo(cx-R*.15,H*.86); g.moveTo(cx+R*.15,cy); g.lineTo(cx+R*.15,H*.86); g.stroke();
  g.beginPath(); g.moveTo(W*.2,H*.86); g.lineTo(W*.8,H*.86); g.stroke();
  g.strokeStyle = U.rgba(c,.9); g.lineWidth = 2; g.beginPath(); g.arc(cx,cy,R,0,U.TAU); g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); g.arc(cx,cy,3,0,U.TAU); g.fill();
  const nB = 8;
  for(let k = 0; k < nB; k++){ const ang = k/nB*U.TAU, x1 = cx+Math.cos(ang)*R, y1 = cy+Math.sin(ang)*R;
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx,cy); g.lineTo(x1,y1); g.stroke();
    const bw = R*.16; g.save(); g.translate(x1,y1); g.rotate(ang+Math.PI/2);
    g.strokeStyle = U.rgba(c,.8); g.lineWidth = 1.2; g.strokeRect(-bw/2,-bw*.3,bw,bw*.6); g.restore(); }
  g.strokeStyle = "rgba(140,190,255,.5)"; g.lineWidth = 1;
  for(let k = 0; k < 5; k++){ const px = cx-R*.6+k*R*.3, py0 = cy+R*.75+(k%2)*4; g.beginPath(); g.moveTo(px,py0); g.lineTo(px,py0+H*.05); g.stroke(); }
};
ART.case["F06-03"].ratio = 1.1;
// F06-04 Osinga／Krauskopf 的鉤織 Lorenz 流形：左下角毛線球＋橫跨畫面的針目弧帶（改變整體明暗分布，與其他斜向構圖區隔）
ART.case["F06-04"] = function(g, W, H, r, c, U){
  const bx = W*.16, by = H*.82, br = Math.min(W,H)*.13;
  const ballGrad = g.createRadialGradient(bx-br*.3,by-br*.3,br*.15,bx,by,br);
  ballGrad.addColorStop(0, U.rgba("#F2B84B",.95)); ballGrad.addColorStop(1, U.rgba("#B8853A",.9));
  g.fillStyle = ballGrad; g.beginPath(); g.arc(bx,by,br,0,U.TAU); g.fill();
  for(let k = 0; k < 5; k++){ g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1;
    g.beginPath(); g.ellipse(bx,by,br*(.5+k*.12),br*(.2+k*.05),k*.6,0,U.TAU); g.stroke(); }
  const steps = 80;
  const wingPath = sign => { const pts = []; for(let i = 0; i <= steps; i++){ const t = i/steps;
    const px = W*.08+t*W*.86, py = H*.14+Math.sin(t*Math.PI*2.2+(sign>0?0:Math.PI))*H*.16*(.4+.6*Math.sin(t*Math.PI))+(sign>0?0:H*.14);
    pts.push([px,py]); } return pts; };
  [1,-1].forEach(sign => { const path = wingPath(sign);
    g.strokeStyle = U.rgba(c,.7); g.lineWidth = 1;
    for(let i = 1; i < path.length; i++){ const [x1,y1] = path[i-1], [x2,y2] = path[i], mx = (x1+x2)/2, my = (y1+y2)/2;
      const dx = x2-x1, dy = y2-y1, len = Math.hypot(dx,dy)||1, nx = -dy/len, ny = dx/len;
      g.beginPath(); g.arc(mx+nx*3, my+ny*3, 3, 0, Math.PI, sign>0); g.stroke(); }
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; U.poly(g, path); g.stroke(); });
  g.strokeStyle = U.rgba("#F2B84B",.6); g.lineWidth = 1; g.beginPath(); g.moveTo(bx,by-br*.9); g.lineTo(W*.08,H*.14); g.stroke();
};
ART.case["F06-04"].ratio = 1.25;
// F06-05 Sprott《Strange Attractors》：攤開書頁版式，中央裝訂線、左右頁各一組手繪吸子線稿
ART.case["F06-05"] = function(g, W, H, r, c, U){
  const gx = W/2;
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(W*.06+.5,H*.1+.5,W*.88-1,H*.8-1);
  const shadow = g.createLinearGradient(gx-10,0,gx+10,0); shadow.addColorStop(0,"rgba(0,0,0,.15)"); shadow.addColorStop(.5,"rgba(0,0,0,.3)"); shadow.addColorStop(1,"rgba(0,0,0,.15)");
  g.fillStyle = shadow; g.fillRect(gx-10,H*.1,20,H*.8);
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(gx,H*.1); g.lineTo(gx,H*.9); g.stroke();
  const L = fitPts(cliffordPts(-1.4,1.6,1,.7,500), W*.3, H*.3, 0), lox = W*.15, loy = H*.32;
  g.strokeStyle = U.rgba(c,.75); g.lineWidth = .9; g.beginPath();
  L.forEach((p,i) => i ? g.lineTo(p[0]+lox,p[1]+loy) : g.moveTo(p[0]+lox,p[1]+loy)); g.stroke();
  const R = fitPts(cliffordPts(1.5,-1.8,1.6,.9,500), W*.3, H*.3, 0), rox = W*.55, roy = H*.32;
  g.strokeStyle = U.rgba(c,.75); g.lineWidth = .9; g.beginPath();
  R.forEach((p,i) => i ? g.lineTo(p[0]+rox,p[1]+roy) : g.moveTo(p[0]+rox,p[1]+roy)); g.stroke();
};
ART.case["F06-05"].ratio = .68;
// F06-06 Chimpanzee 外掛：Grasshopper 典型淺灰畫布上的節點圖，其中一個節點內嵌小型吸子預覽（淺色背景，與其他深色卡明顯不同）
ART.case["F06-06"] = function(g, W, H, r, c, U){
  g.fillStyle = "#D9D9DF"; g.fillRect(0,0,W,H);
  const boxes = [[W*.08,H*.15,W*.22,H*.18],[W*.4,H*.08,W*.24,H*.16],[W*.4,H*.42,W*.24,H*.16],[W*.72,H*.28,W*.22,H*.18]];
  const rr = (x,y,w,h,r2) => { g.beginPath(); g.moveTo(x+r2,y); g.arcTo(x+w,y,x+w,y+h,r2); g.arcTo(x+w,y+h,x,y+h,r2); g.arcTo(x,y+h,x,y,r2); g.arcTo(x,y,x+w,y,r2); g.closePath(); };
  boxes.forEach(([x,y,w,h]) => { g.fillStyle = "rgba(255,255,255,.9)"; g.strokeStyle = "rgba(40,40,48,.55)"; g.lineWidth = 1.2;
    rr(x,y,w,h,4); g.fill(); g.stroke(); g.fillStyle = "rgba(40,40,48,.45)"; g.fillRect(x+4,y+3,w-8,3); });
  const ctr = ([x,y,w,h]) => [x+w,y+h/2], inp = ([x,y,w,h]) => [x,y+h/2];
  const wire = (aBox,bBox) => { const p = ctr(aBox), q = inp(bBox); g.strokeStyle = U.rgba(c,.85); g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(p[0],p[1]); g.bezierCurveTo(p[0]+30,p[1],q[0]-30,q[1],q[0],q[1]); g.stroke(); };
  wire(boxes[0],boxes[1]); wire(boxes[0],boxes[2]); wire(boxes[1],boxes[3]); wire(boxes[2],boxes[3]);
  const [bx,by,bw,bh] = boxes[3], pts = cliffordPts(-1.7,1.3,-.1,-1.2,500);
  const P = fitPts(pts, bw-10, bh-12, 2).map(p => [p[0]+bx+5,p[1]+by+9]);
  g.fillStyle = U.rgba(c,.9); P.forEach(p => g.fillRect(p[0],p[1],.9,.9));
  boxes.forEach(b => { g.fillStyle = "rgba(60,60,66,.8)"; [inp(b),ctr(b)].forEach(([x,y]) => { g.beginPath(); g.arc(x,y,2,0,U.TAU); g.fill(); }); });
};
ART.case["F06-06"].ratio = .85;
// F06-07 The Coding Train 的 Lorenz Attractor 挑戰：手繪抖動雙線描邊＋方形游標頭，畫布格線背景
ART.case["F06-07"] = function(g, W, H, r, c, U){
  const traj = lorenzTraj(1800,.014,'euler').map(iso3);
  const P = fitPts(traj, W*.8, H*.8, 0), ox = W*.1, oy = H*.1, pts = P.map(p => [p[0]+ox,p[1]+oy]);
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1;
  for(let x = 0; x < W; x += W/10){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); }
  for(let y = 0; y < H; y += H/8){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
  [0,1].forEach(pass => { g.strokeStyle = U.rgba(pass ? "#ffffff" : c, pass ? .35 : .85); g.lineWidth = 1; g.beginPath();
    pts.forEach((p,i) => { const jx = (r()-.5)*1.6, jy = (r()-.5)*1.6, px = p[0]+jx, py = p[1]+jy; i ? g.lineTo(px,py) : g.moveTo(px,py); }); g.stroke(); });
  const tip = pts[pts.length-1]; g.fillStyle = "#fff"; g.fillRect(tip[0]-2,tip[1]-2,4,4);
};
ART.case["F06-07"].ratio = .78;
// F06-08 Alice Aycock 的公共藝術《Strange Attractor》：航廈大廳室內透視──玻璃帷幕、天花梁、地面上的人標尺度，
// 挑空中以鋼索吊著一條沿 Lorenz 軌跡掃出、邊走邊扭轉的白色金屬帶（正面白、背面帶家族色），依深度由遠到近排序繪製
ART.case["F06-08"] = function(g, W, H, r, c, U){
  const ey = -6, ez = 1.7, f = W*.6, hy = H*.64, cam = p => { const d = p[1] - ey; return [W/2 + p[0]/d*f, hy - (p[2] - ez)/d*f]; };
  const X0 = -8, X1 = 8, Y1 = 15, Z1 = 8;
  // 背面玻璃帷幕（暮色）與豎框
  const bl = cam([X0, Y1, Z1]), br = cam([X1, Y1, 0]);
  const sky = g.createLinearGradient(0, bl[1], 0, br[1]); sky.addColorStop(0, "#34405f"); sky.addColorStop(.7, "#2a2f45"); sky.addColorStop(1, "#1d2030");
  g.fillStyle = sky; g.fillRect(bl[0], bl[1], br[0] - bl[0], br[1] - bl[1]);
  g.strokeStyle = "rgba(200,210,235,.22)"; g.lineWidth = 1;
  for(let x = X0; x <= X1 + .01; x += 1){ const a = cam([x, Y1, 0]), b = cam([x, Y1, Z1]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  for(const z of [2.8, 5.6]){ const a = cam([X0, Y1, z]), b = cam([X1, Y1, z]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  // 地板、天花、兩側牆（梯形）
  const quad = (pts, fill) => { U.poly(g, pts.map(cam), true); g.fillStyle = fill; g.fill(); };
  quad([[X0, -3, 0], [X1, -3, 0], [X1, Y1, 0], [X0, Y1, 0]], "#16171d");
  quad([[X0, -3, Z1], [X1, -3, Z1], [X1, Y1, Z1], [X0, Y1, Z1]], "#202129");
  quad([[X0, -3, 0], [X0, Y1, 0], [X0, Y1, Z1], [X0, -3, Z1]], "#1b1c23");
  quad([[X1, -3, 0], [X1, Y1, 0], [X1, Y1, Z1], [X1, -3, Z1]], "#191a21");
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1;
  for(let x = X0; x <= X1; x += 1.4){ const a = cam([x, -3, 0]), b = cam([x, Y1, 0]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 1.6;
  for(let y = -1; y <= Y1; y += 2){ const a = cam([X0, y, Z1]), b = cam([X1, y, Z1]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  // 地面的光反射
  const gl = cam([0, 9, 0]), rg = g.createRadialGradient(gl[0], gl[1], 0, gl[0], gl[1], W*.4);
  rg.addColorStop(0, "rgba(255,255,255,.08)"); rg.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = rg; g.fillRect(0, hy, W, H - hy);
  // 雕塑：Lorenz 軌跡（RK4）→ 世界座標，沿切線掃出扭轉的帶
  const T = lorenzTraj(2250, .008, 'rk4').slice(1550).filter((_, i) => i % 2 === 0);   // 這段會繞過左右兩翼
  const Pw = T.map(([x, y, z]) => [x*.15, 2.6 + y*.1, 1.8 + z*.14]), N = Pw.length, up = [0, 0, 1];
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l]; };
  const crs = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const hw = .3, side = [], L = nrm([-.4, -.7, .6]);
  for(let i = 0; i < N; i++){ const t = nrm([0,1,2].map(k => Pw[Math.min(N-1, i+1)][k] - Pw[Math.max(0, i-1)][k])), n1 = nrm(crs(t, up)), n2 = crs(t, n1), th = i*.09;
    side.push({t, w:[0,1,2].map(k => (n1[k]*Math.cos(th) + n2[k]*Math.sin(th))*hw)}); }
  const segs = [];
  for(let i = 0; i < N - 1; i++){ const A = Pw[i], B = Pw[i+1], wa = side[i].w, wb = side[i+1].w;
    const q = [[A[0]-wa[0], A[1]-wa[1], A[2]-wa[2]], [A[0]+wa[0], A[1]+wa[1], A[2]+wa[2]], [B[0]+wb[0], B[1]+wb[1], B[2]+wb[2]], [B[0]-wb[0], B[1]-wb[1], B[2]-wb[2]]];
    const nn = nrm(crs(side[i].t, wa)), mid = [(A[0]+B[0])/2, (A[1]+B[1])/2, (A[2]+B[2])/2], vw = nrm([-mid[0], ey - mid[1], ez - mid[2]]);
    segs.push({q, d:mid[1], nn, front:(nn[0]*vw[0] + nn[1]*vw[1] + nn[2]*vw[2]) > 0}); }
  // 吊索（先畫，雕塑會蓋住下端）
  g.strokeStyle = "rgba(255,255,255,.28)"; g.lineWidth = .7;
  [.08, .3, .52, .74, .93].forEach(u => { const p = Pw[Math.floor(u*(N-1))], a = cam(p), b = cam([p[0], p[1], Z1]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
  // 地面影子
  g.fillStyle = "rgba(0,0,0,.28)"; segs.forEach(s2 => { if(s2.d % 1 > .5) return; U.poly(g, s2.q.map(p => cam([p[0], p[1], 0])), true); g.fill(); });
  segs.sort((a, b) => b.d - a.d).forEach(s2 => { const l = Math.abs(s2.nn[0]*L[0] + s2.nn[1]*L[1] + s2.nn[2]*L[2]);
    U.poly(g, s2.q.map(cam), true);
    if(s2.front){ const v = Math.round(150 + 105*l); g.fillStyle = `rgb(${v},${v},${Math.min(255, v + 6)})`; }
    else { const C = U.rgb(c), k = .45 + .45*l; g.fillStyle = `rgb(${Math.round((C[0]*.6 + 102)*k + 40)},${Math.round((C[1]*.6 + 102)*k + 40)},${Math.round((C[2]*.6 + 102)*k + 40)})`; }
    g.fill(); g.strokeStyle = g.fillStyle; g.lineWidth = .5; g.stroke(); });
  // 人（尺度）
  [[-3.6, 1.5, 1], [-2.8, 2.6, .92], [3.1, 1, 1.02], [4.6, 6.5, .95], [1.4, 9, 1], [-5, 8, .9], [5.8, 2.4, .97]].forEach(([x, y, k]) => {
    const a = cam([x, y, 0]), b = cam([x, y, 1.75*k]), h = a[1] - b[1], w = h*.24;
    g.fillStyle = "rgba(8,8,12,.92)"; g.fillRect(a[0] - w/2, b[1] + h*.2, w, h*.8);
    g.beginPath(); g.arc(a[0], b[1] + h*.1, h*.1, 0, U.TAU); g.fill(); });
};
ART.case["F06-08"].ratio = .9;
// F06-09 vpype-fractal 筆繪機外掛：三色多筆疊繪（XZ 投影，模擬多次分色繪製），右上角筆架標記
ART.case["F06-09"] = function(g, W, H, r, c, U){
  const steps = 1600, dt = .013; let x = .12, y = 0, z = 0; const raw = new Array(steps);
  for(let i = 0; i < steps; i++){ const dx = 10*(y-x), dy = x*(28-z)-y, dz = x*y-(8/3)*z; x += dx*dt; y += dy*dt; z += dz*dt; raw[i] = [x,z]; }
  const P = fitPts(raw, W*.7, H*.66, 0), cols3 = ["rgba(255,255,255,.7)", U.rgba(c,.85), "rgba(120,200,255,.75)"], offs = [[0,0],[3,2],[-2,4]];
  cols3.forEach((col,k) => { const [dx,dy] = offs[k]; g.strokeStyle = col; g.lineWidth = .9; g.beginPath();
    P.forEach((p,i) => { const px = p[0]+W*.15+dx, py = p[1]+H*.17+dy; i ? g.lineTo(px,py) : g.moveTo(px,py); }); g.stroke(); });
  cols3.forEach((col,k) => { g.fillStyle = col; g.beginPath(); g.arc(W*.9,H*.08+k*9,2.6,0,U.TAU); g.fill(); });
};
ART.case["F06-09"].ratio = .82;
// F06-10 Strange Attractors WebGL 互動繪圖：霓虹輝光散點＋右上角互動介面面板
ART.case["F06-10"] = function(g, W, H, r, c, U){
  const pts = cliffordPts(1.7,1.7,.6,1.2,7000), P = fitPts(pts, W*.86, H*.86, 0), ox = W*.07, oy = H*.07;
  [[3,.12],[1.6,.12],[.8,.9]].forEach(([sz,a]) => { g.fillStyle = U.rgba(c,a); P.forEach(p => g.fillRect(p[0]+ox-sz/2,p[1]+oy-sz/2,sz,sz)); });
  const px = W*.66, py = H*.06, pw = W*.28, ph = H*.16;
  g.fillStyle = "rgba(20,20,26,.72)"; g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1;
  g.beginPath(); g.rect(px,py,pw,ph); g.fill(); g.stroke();
  [0,1,2].forEach(k => { const sy = py+ph*(.25+k*.28);
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(px+pw*.1,sy); g.lineTo(px+pw*.9,sy); g.stroke();
    g.fillStyle = U.rgba(c,.9); g.beginPath(); g.arc(px+pw*(.25+k*.2),sy,2.4,0,U.TAU); g.fill(); });
};
ART.case["F06-10"].ratio = .95;
// F06-11 Visions of Chaos 混沌探索軟體：視窗標題列＋2×2 多種吸子縮圖預覽格
ART.case["F06-11"] = function(g, W, H, r, c, U){
  g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(0,0,W,H*.08);
  g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0,H*.08); g.lineTo(W,H*.08); g.stroke();
  ["#FF6B6B","#F2C94C","#6BCB77"].forEach((col,k) => { g.fillStyle = col; g.beginPath(); g.arc(W*.05+k*10,H*.04,2.6,0,U.TAU); g.fill(); });
  const cols4 = [cliffordPts(-1.7,1.3,-.1,-1.2,900), dejongPts(2.01,-2.53,1.61,-.33,900), cliffordPts(1.5,-1.8,1.6,.9,900), dejongPts(-2.24,.43,-.65,-2.43,900)];
  const palette = [c,"#ffffff","#8CD4FF","#F2B84B"], gx0 = W*.05, gy0 = H*.14, gw = (W*.9-W*.03)/2, gh = (H*.82-H*.03)/2, gp = W*.03;
  cols4.forEach((pts,idx) => { const cx = idx%2, cy = (idx/2)|0, x0 = gx0+cx*(gw+gp), y0 = gy0+cy*(gh+gp);
    const P = fitPts(pts, gw-6, gh-6, 2).map(p => [p[0]+x0+3,p[1]+y0+3]);
    g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1; g.strokeRect(x0+.5,y0+.5,gw-1,gh-1);
    g.fillStyle = U.rgba(palette[idx],.75); P.forEach(p => g.fillRect(p[0],p[1],.9,.9)); });
};
ART.case["F06-11"].ratio = .95;
})();
