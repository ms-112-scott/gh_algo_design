/* C03 向量場流線：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
const TAU = Math.PI * 2;

// ---------- 共用小工具 ----------
function nrm(x, y){ const d = Math.hypot(x, y) || 1e-9; return [x/d, y/d]; }
// 流線追蹤：f(x,y)→[vx,vy]；sg 為方向（+1 順流、-1 逆流）；ok(x,y) 為 false 時停止
function trace(f, x, y, n, h, ok, sg = 1, rk4 = false){
  const pts = [[x, y]];
  for(let i = 0; i < n; i++){
    let d;
    if(rk4){
      const k1 = nrm(...f(x, y)), k2 = nrm(...f(x + k1[0]*h*sg/2, y + k1[1]*h*sg/2)),
            k3 = nrm(...f(x + k2[0]*h*sg/2, y + k2[1]*h*sg/2)), k4 = nrm(...f(x + k3[0]*h*sg, y + k3[1]*h*sg));
      d = [(k1[0] + 2*k2[0] + 2*k3[0] + k4[0])/6, (k1[1] + 2*k2[1] + 2*k3[1] + k4[1])/6];
    } else d = nrm(...f(x, y));
    x += d[0]*h*sg; y += d[1]*h*sg;
    if(!ok(x, y)) break;
    pts.push([x, y]);
  }
  return pts;
}
// 雙向追蹤後接成一條
function trace2(f, x, y, n, h, ok){ const a = trace(f, x, y, n, h, ok, -1).reverse(); a.pop(); return a.concat(trace(f, x, y, n, h, ok, 1)); }
function line(g, pts){ if(pts.length < 2) return; U.poly(g, pts); g.stroke(); }
function inRect(x0, y0, x1, y1){ return (x, y) => x > x0 && y > y0 && x < x1 && y < y1; }
function glow(g, x, y, rad, col){
  const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad*2, rad*2);
}
function arrow(g, x, y, a, len, head){
  const ex = x + Math.cos(a)*len, ey = y + Math.sin(a)*len;
  g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey);
  g.moveTo(ex, ey); g.lineTo(ex - Math.cos(a - .5)*head, ey - Math.sin(a - .5)*head);
  g.moveTo(ex, ey); g.lineTo(ex - Math.cos(a + .5)*head, ey - Math.sin(a + .5)*head); g.stroke();
}
function inPoly(pts, x, y){
  let c = false;
  for(let i = 0, j = pts.length - 1; i < pts.length; j = i++){
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if((yi > y) !== (yj > y) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) c = !c;
  }
  return c;
}
// 分層雜訊
function fbm(nz, x, y){ return nz(x, y)*.65 + nz(x*2.1 + 9, y*2.1 + 3)*.35; }

// 等間距流線（Jobard–Lefer 簡化版）：回傳流線陣列
function evenly(f, x0, y0, x1, y1, dsep, h, r, maxLines = 260, maxSteps = 500){
  const cs = dsep, nx = Math.ceil((x1 - x0)/cs) + 2, ny = Math.ceil((y1 - y0)/cs) + 2, cells = [...Array(nx*ny)].map(() => []);
  const gap = Math.ceil(dsep*2.2/h), dtest = dsep*.5, lines = [];
  const cellOf = (x, y) => (((y - y0)/cs)|0) * nx + (((x - x0)/cs)|0);
  const near = (x, y, d, id, idx) => {
    const ci = ((x - x0)/cs)|0, cj = ((y - y0)/cs)|0;
    for(let j = cj - 1; j <= cj + 1; j++) for(let i = ci - 1; i <= ci + 1; i++){
      if(i < 0 || j < 0 || i >= nx || j >= ny) continue;
      for(const p of cells[j*nx + i]){
        if(p[2] === id && Math.abs(p[3] - idx) < gap) continue;
        if((p[0] - x)**2 + (p[1] - y)**2 < d*d) return true;
      }
    }
    return false;
  };
  const inb = inRect(x0, y0, x1, y1);
  const one = (sx, sy, id) => {
    if(!inb(sx, sy) || near(sx, sy, dsep, -1, 0)) return null;
    const half = sg => { const out = []; let x = sx, y = sy;
      for(let i = 1; i < maxSteps; i++){ const d = nrm(...f(x, y)); x += d[0]*h*sg; y += d[1]*h*sg;
        if(!inb(x, y) || near(x, y, dtest, id, i*sg)) break;
        out.push([x, y]); cells[cellOf(x, y)].push([x, y, id, i*sg]); }
      return out; };
    cells[cellOf(sx, sy)].push([sx, sy, id, 0]);
    const b = half(1), a = half(-1).reverse(), pts = a.concat([[sx, sy]], b);
    return pts.length > 4 ? pts : null;
  };
  const first = one(x0 + (x1 - x0)*(.4 + r()*.2), y0 + (y1 - y0)*(.4 + r()*.2), 0);
  if(first) lines.push(first);
  let q = 0, tries = 0;
  while(lines.length < maxLines && tries < 60){
    if(q >= lines.length){ // 佇列用完：隨機補種
      tries++; const L = one(x0 + r()*(x1 - x0), y0 + r()*(y1 - y0), lines.length); if(L) lines.push(L); continue;
    }
    const L = lines[q++], step = Math.max(1, Math.round(dsep/h));
    for(let i = 1; i < L.length - 1 && lines.length < maxLines; i += step){
      const [dx, dy] = nrm(L[i+1][0] - L[i-1][0], L[i+1][1] - L[i-1][1]);
      for(const s of [1, -1]){ const N = one(L[i][0] - dy*dsep*s, L[i][1] + dx*dsep*s, lines.length); if(N) lines.push(N); }
    }
  }
  return lines;
}

// ---------- 變形 ----------
ART.var["C03"] = [
  // V01 Perlin 角度場：木紋／髮絲般由上往下流動的細線，紙框構圖
  function(g, W, H, r, c, U){
    const nz = U.vnoise((r()*1e6)|0), sc = 2.4/W, m = W*.07;
    g.fillStyle = "#101015"; g.fillRect(m, m, W - 2*m, H - 2*m);
    g.save(); g.beginPath(); g.rect(m, m, W - 2*m, H - 2*m); g.clip();
    const f = (x, y) => { const a = Math.PI/2 + (fbm(nz, x*sc, y*sc) - .5)*Math.PI*1.9; return [Math.cos(a), Math.sin(a)]; };
    const ok = inRect(m - 4, m - 20, W - m + 4, H - m + 4);
    for(let k = 0; k < 230; k++){
      const x = m + r()*(W - 2*m), y = m - 10 + r()*H*.12;
      const white = r() < .12;
      g.strokeStyle = white ? "rgba(255,255,255,.55)" : U.rgba(c, .25 + r()*.55);
      g.lineWidth = .4 + r()*1.4;
      line(g, trace(f, x, y, 320, 1.4, ok));
    }
    g.restore();
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(m, m, W - 2*m, H - 2*m);
  },
  // V02 電荷場：正電荷發散、負電荷收束的電力線
  function(g, W, H, r, c, U){
    const k = W/300, n = 4 + ((r()*2)|0), Q = [];
    for(let i = 0; i < n; i++){
      let x, y, t = 0;
      do { x = W*(.18 + r()*.64); y = H*(.18 + r()*.64); t++; } while(t < 40 && Q.some(q => Math.hypot(q.x - x, q.y - y) < W*.22));
      Q.push({x, y, q: i === 0 ? 1 : i === 1 ? -1 : (r() < .5 ? 1 : -1)});
    }
    const f = (x, y) => { let ex = 0, ey = 0; for(const q of Q){ const dx = x - q.x, dy = y - q.y, d3 = Math.pow(dx*dx + dy*dy + 1, 1.5); ex += q.q*dx/d3; ey += q.q*dy/d3; } return [ex, ey]; };
    const ok = (x, y) => x > -20 && y > -20 && x < W + 20 && y < H + 20 && !Q.some(q => q.q < 0 && Math.hypot(x - q.x, y - q.y) < 6*k);
    g.lineWidth = 1;
    Q.forEach(q => {
      if(q.q < 0) return;
      for(let i = 0; i < 20; i++){ const a = i/20*TAU + .1;
        g.strokeStyle = U.rgba(c, .7); line(g, trace(f, q.x + Math.cos(a)*6*k, q.y + Math.sin(a)*6*k, 520, 1.6*k, ok)); }
    });
    Q.forEach(q => {
      glow(g, q.x, q.y, 22*k, q.q > 0 ? "rgba(255,255,255,.35)" : U.rgba(c, .6));
      g.fillStyle = q.q > 0 ? "#fff" : c; g.beginPath(); g.arc(q.x, q.y, 7*k, 0, TAU); g.fill();
      g.strokeStyle = q.q > 0 ? c : "#fff"; g.lineWidth = 1.8*k; g.beginPath();
      g.moveTo(q.x - 3.5*k, q.y); g.lineTo(q.x + 3.5*k, q.y);
      if(q.q > 0){ g.moveTo(q.x, q.y - 3.5*k); g.lineTo(q.x, q.y + 3.5*k); }
      g.stroke();
    });
  },
  // V03 Curl noise：底圖是純量場 ψ，流線沿 ψ 的等值方向繞行
  function(g, W, H, r, c, U){
    const nz = U.vnoise((r()*1e6)|0), sc = 3/W, psi = (x, y) => fbm(nz, x*sc, y*sc);
    const n = 60, m = Math.round(n*H/W);
    U.field(g, W, H, n, m, (i, j) => (psi(i/(n - 1)*W, j/(m - 1)*H) - .2)*.75, c, 1.4);
    const e = 1, f = (x, y) => [(psi(x, y + e) - psi(x, y - e)), -(psi(x + e, y) - psi(x - e, y))];
    const ok = inRect(0, 0, W, H), G = 13, s = W/G;
    g.lineWidth = .9;
    for(let j = 0; j < Math.ceil(H/s); j++) for(let i = 0; i < G; i++){
      const x = (i + .2 + r()*.6)*s, y = (j + .2 + r()*.6)*s;
      g.strokeStyle = "rgba(255,255,255," + (.35 + r()*.4) + ")";
      line(g, trace2(f, x, y, 34, 1.5, ok));
    }
  },
  // V04 RK4：左 Euler 漩渦外洩、右 RK4 維持同心圓（對照圖）
  function(g, W, H, r, c, U){
    const k = W/300, cy = H/2, h = 15*k;
    g.strokeStyle = "rgba(255,255,255,.18)"; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(W/2, 8); g.lineTo(W/2, H - 8); g.stroke(); g.setLineDash([]);
    const panel = (cx, rk, col) => {
      const f = (x, y) => [-(y - cy), x - cx], ok = inRect(cx - W/4 + 4, 6, cx + W/4 - 4, H - 6);
      g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath();
      g.moveTo(cx - 4*k, cy); g.lineTo(cx + 4*k, cy); g.moveTo(cx, cy - 4*k); g.lineTo(cx, cy + 4*k); g.stroke();
      const radii = rk ? [14, 30, 46, 62] : [14];
      radii.forEach((R, ri) => {
        const pts = trace(f, cx + R*k, cy, rk ? Math.ceil(TAU*R*k/h) : 60, h, ok, 1, rk);
        if(rk) pts.push(pts[0]);
        g.strokeStyle = col; g.lineWidth = 1.4; line(g, pts);
        g.fillStyle = rk ? "#fff" : col; pts.forEach(p => { g.beginPath(); g.arc(p[0], p[1], 1.8*k, 0, TAU); g.fill(); });
      });
    };
    panel(W/4, false, "rgba(255,255,255,.55)");
    panel(3*W/4, true, c);
    // 右側示意 k1..k4 四次取樣
    const px = 3*W/4 + 62*k, py = cy;
    g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1.2;
    [-.25, -.05, .1, .3].forEach((da, i) => arrow(g, px, py, -Math.PI/2 + da, (12 + i*3)*k, 3*k));
  },
  // V05 等間距流線：雕版畫般均勻、不重疊的白色細線
  function(g, W, H, r, c, U){
    const nz = U.vnoise((r()*1e6)|0), sc = 2/W, vx = [[W*(.3 + r()*.4), H*(.3 + r()*.4), r() < .5 ? 1 : -1]];
    const f = (x, y) => { const a = (nz(x*sc, y*sc) - .5)*TAU*1.2; let fx = Math.cos(a)*.6, fy = Math.sin(a)*.6;
      for(const [ax, ay, s] of vx){ const dx = x - ax, dy = y - ay, d = Math.hypot(dx, dy) + 20; fx += -dy/d*s*1.2*W/(d + W*.2); fy += dx/d*s*1.2*W/(d + W*.2); }
      return [fx, fy]; };
    const L = evenly(f, 0, 0, W, H, W/42, 1.2, r, 300, 600);
    g.lineCap = "round";
    L.forEach((p, i) => { g.strokeStyle = i % 7 === 0 ? U.rgba(c, .95) : "rgba(255,255,255,.82)"; g.lineWidth = i % 7 === 0 ? 1.3 : .8; line(g, p); });
  },
  // V06 雙向追蹤：少數長流線，起點往上游（虛線）與下游（實線）各走一次
  function(g, W, H, r, c, U){
    const k = W/300, nz = U.vnoise((r()*1e6)|0), sc = 2.2/W;
    const f = (x, y) => { const a = Math.sin(y/H*Math.PI*2)*.35 + (nz(x*sc, y*sc) - .5)*1.6; return [Math.cos(a), Math.sin(a)]; };
    const ok = inRect(-2, -2, W + 2, H + 2), n = 11;
    g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(W*.4, 0, W*.2, H);
    for(let i = 0; i < n; i++){
      const sx = W*(.42 + r()*.16), sy = H*(i + .5)/n;
      const fw = trace(f, sx, sy, 400, 1.5*k, ok, 1), bw = trace(f, sx, sy, 400, 1.5*k, ok, -1);
      g.lineWidth = 2*k; g.strokeStyle = c; line(g, fw);
      g.setLineDash([4*k, 3*k]); g.strokeStyle = "rgba(255,255,255,.6)"; line(g, bw); g.setLineDash([]);
      const e = fw[fw.length - 1], e0 = fw[Math.max(0, fw.length - 4)];
      g.strokeStyle = c; g.lineWidth = 1.5*k; arrow(g, e0[0], e0[1], Math.atan2(e[1] - e0[1], e[0] - e0[0]), Math.hypot(e[0] - e0[0], e[1] - e0[1]), 6*k);
      g.fillStyle = "#fff"; g.beginPath(); g.arc(sx, sy, 3*k, 0, TAU); g.fill();
      g.strokeStyle = c; g.lineWidth = 1.2; g.beginPath(); g.arc(sx, sy, 5.5*k, 0, TAU); g.stroke();
    }
  },
  // V07 曲面上的流線：雙曲拋物面屋頂，在 (u,v) 參數空間追蹤後映射回 3D
  function(g, W, H, r, c, U){
    const s = W*.27, hz = .55, cx = W/2, cy = H*.56;
    const P = (u, v) => { const X = (u - .5)*2, Y = (v - .5)*2, Z = hz*((u - .5)**2 - (v - .5)**2)*4 + .35;
      return [cx + (X - Y)*.866*s, cy + (X + Y)*.5*s - Z*s]; };
    const G = [cx, cy + .1*s];
    // 地面陰影與柱子
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(G[0], G[1] + s*.2, s*1.8, s*.9, 0, 0, TAU); g.fill();
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1.2;
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([u, v]) => { const p = P(u, v), X = (u - .5)*2, Y = (v - .5)*2;
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(cx + (X - Y)*.866*s, cy + (X + Y)*.5*s + s*.35); g.stroke(); });
    const N = 16;
    for(let t = 0; t <= 2*(N - 1); t++) for(let i = 0; i < N; i++){ const j = t - i; if(j < 0 || j >= N) continue;
      const u0 = i/N, v0 = j/N, u1 = (i + 1)/N, v1 = (j + 1)/N, sh = .05 + .1*(1 - ((u0 - .5)**2 + (v0 - .5)**2)*2) + .06*(u0 - v0);
      g.fillStyle = `rgba(200,210,235,${Math.max(.03, sh)})`; g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = .6;
      U.poly(g, [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], true); g.fill(); g.stroke(); }
    const nz = U.vnoise((r()*1e6)|0), f = (u, v) => { const a = (nz(u*3, v*3) - .5)*TAU*1.3 + .6; return [Math.cos(a), Math.sin(a)]; };
    const ok = inRect(0, 0, 1, 1);
    g.lineWidth = 1.3; g.lineCap = "round";
    for(let k = 0; k < 46; k++){
      const uv = trace2(f, r(), r(), 90, .009, ok);
      g.strokeStyle = U.rgba(c, .55 + r()*.4); line(g, uv.map(([u, v]) => P(u, v)));
    }
    g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.2;
    U.poly(g, [0, .25, .5, .75, 1].map(u => P(u, 0)).concat([.25, .5, .75, 1].map(v => P(1, v)), [.75, .5, .25, 0].map(u => P(u, 1)), [.75, .5, .25].map(v => P(0, v))), true); g.stroke();
  },
  // V08 3D 場：立方體邊界內繞軸盤旋的空間流線（等角投影、依深度明暗）
  function(g, W, H, r, c, U){
    const s = Math.min(W, H)*.3, cx = W/2, cy = H/2, az = .6 + r()*.3, el = .5;
    const pr = ([x, y, z]) => { const ca = Math.cos(az), sa = Math.sin(az), X = x*ca - y*sa, Y = x*sa + y*ca, ce = Math.cos(el), se = Math.sin(el);
      return [cx + X*s, cy - (z*ce - Y*se)*s, Y*ce + z*se]; };
    const E = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]], V = [...Array(8)].map((_, i) => [i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1]);
    g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1; g.beginPath();
    E.forEach(([a, b]) => { const p = pr(V[a]), q = pr(V[b]); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }); g.stroke();
    const ax = nrm(r()*.4 - .2, r()*.4 - .2), A = [ax[0]*.3, ax[1]*.3, 1];
    const a0 = pr([-A[0]*1.2, -A[1]*1.2, -1.2]), a1 = pr([A[0]*1.2, A[1]*1.2, 1.2]);
    g.setLineDash([4, 4]); g.strokeStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.moveTo(a0[0], a0[1]); g.lineTo(a1[0], a1[1]); g.stroke(); g.setLineDash([]);
    const f = ([x, y, z]) => { const rr = Math.hypot(x, y) || 1e-6, pull = (rr - .55)*.9;
      return [-(y) - x/rr*pull + A[0]*.4, x - y/rr*pull + A[1]*.4, .32]; };
    for(let i = 0; i < 20; i++){
      const a = i/20*TAU, rr = .2 + r()*.8; let p = [Math.cos(a)*rr, Math.sin(a)*rr, -1 + r()*.3];
      const pts = [pr(p)];
      for(let t = 0; t < 260; t++){ const v = f(p), d = Math.hypot(...v); p = [p[0] + v[0]/d*.035, p[1] + v[1]/d*.035, p[2] + v[2]/d*.035];
        if(Math.abs(p[0]) > 1 || Math.abs(p[1]) > 1 || p[2] > 1) break; pts.push(pr(p)); }
      g.lineWidth = 1.6;
      for(let t = 1; t < pts.length; t++){ const dz = pts[t][2]; g.strokeStyle = dz > 0 ? U.rgba(c, .5 + dz*.5) : `rgba(255,255,255,${.18 + (1 + dz)*.2})`;
        g.beginPath(); g.moveTo(pts[t-1][0], pts[t-1][1]); g.lineTo(pts[t][0], pts[t][1]); g.stroke(); }
    }
  },
  // V09 曲線當場的輸入：流線沿建築外框繞行（基地平面）
  function(g, W, H, r, c, U){
    const k = W/300, bx = W*(.38 + r()*.1), by = H*(.35 + r()*.1), a = W*.18, b = H*.16;
    const B = [[bx - a, by - b], [bx + a*.4, by - b], [bx + a*.4, by], [bx + a, by + b*.2], [bx + a*.7, by + b*1.5], [bx - a*.3, by + b*1.2], [bx - a, by + b*.4]];
    const wind = nrm(1, .18 + r()*.2);
    const f = (x, y) => {
      let bd = 1e9, t = [1, 0], nn = [0, 1];
      for(let i = 0; i < B.length; i++){ const p = B[i], q = B[(i + 1) % B.length], ex = q[0] - p[0], ey = q[1] - p[1], L2 = ex*ex + ey*ey;
        const u = Math.max(0, Math.min(1, ((x - p[0])*ex + (y - p[1])*ey)/L2)), px = p[0] + ex*u, py = p[1] + ey*u, d = Math.hypot(x - px, y - py);
        if(d < bd){ bd = d; t = nrm(ex, ey); nn = nrm(x - px, y - py); } }
      if(t[0]*wind[0] + t[1]*wind[1] < 0) t = [-t[0], -t[1]];
      const w = Math.exp(-bd/(W*.07));
      return [wind[0]*(1 - w) + t[0]*w*1.3 + nn[0]*w*.25, wind[1]*(1 - w) + t[1]*w*1.3 + nn[1]*w*.25];
    };
    const ok = (x, y) => x > -2 && y > -2 && x < W + 2 && y < H + 2 && !inPoly(B, x, y);
    g.strokeStyle = "rgba(255,255,255,.2)"; g.setLineDash([6, 4]); g.strokeRect(W*.05, H*.06, W*.9, H*.88); g.setLineDash([]);
    g.lineWidth = 1.1;
    for(let i = 0; i < 40; i++){ const y = -H*.2 + H*1.2*(i + .5)/40; g.strokeStyle = U.rgba(c, .45 + .45*(i % 3 === 0)); line(g, trace(f, 0, y, 500, 1.6*k, ok)); }
    // 建築量體：斜線填充
    g.save(); U.poly(g, B, true); g.fillStyle = "#1A1A22"; g.fill(); g.clip();
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.beginPath();
    for(let x = -H; x < W; x += 6*k){ g.moveTo(x, 0); g.lineTo(x + H, H); } g.stroke(); g.restore();
    g.strokeStyle = "#fff"; g.lineWidth = 1.5; U.poly(g, B, true); g.stroke();
    // 指北針
    const nx = W - 18*k, ny = 20*k; g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.moveTo(nx, ny - 9*k); g.lineTo(nx + 4*k, ny + 5*k); g.lineTo(nx, ny + 2*k); g.lineTo(nx - 4*k, ny + 5*k); g.closePath(); g.fill();
  },
  // V10 可製造幾何：流線偏移成寬度隨場強變化的帶狀，雷切板材
  function(g, W, H, r, c, U){
    const k = W/300, nz = U.vnoise((r()*1e6)|0), sc = 2/W, m = W*.08;
    const f = (x, y) => { const a = (nz(x*sc, y*sc) - .5)*1.6; return [Math.cos(a), Math.sin(a)]; };
    const str = (x, y) => nz(x*sc + 30, y*sc + 30);
    g.fillStyle = "#1E1E27"; g.fillRect(m, m, W - 2*m, H - 2*m);
    g.save(); g.beginPath(); g.rect(m, m, W - 2*m, H - 2*m); g.clip();
    const ok = inRect(m - 30, -H, W - m + 30, 2*H), n = 11;
    for(let i = 0; i < n; i++){
      const pts = trace(f, m - 20, m + (H - 2*m)*(i + .5)/n, 400, 3*k, ok);
      if(pts.length < 3) continue;
      const Lf = [], Rt = [];
      for(let j = 0; j < pts.length; j++){ const a = pts[Math.max(0, j - 1)], b = pts[Math.min(pts.length - 1, j + 1)], [dx, dy] = nrm(b[0] - a[0], b[1] - a[1]);
        const w = (.8 + 10*Math.min(1, Math.max(0, str(pts[j][0], pts[j][1]) - .25)/.5))*k; Lf.push([pts[j][0] - dy*w, pts[j][1] + dx*w]); Rt.push([pts[j][0] + dy*w, pts[j][1] - dx*w]); }
      U.poly(g, Lf.concat(Rt.reverse()), true); g.fillStyle = U.rgba(c, .8); g.fill();
      g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = .7; g.stroke();
    }
    g.restore();
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.strokeRect(m, m, W - 2*m, H - 2*m);
    [[m + 6*k, m + 6*k], [W - m - 6*k, m + 6*k], [m + 6*k, H - m - 6*k], [W - m - 6*k, H - m - 6*k]].forEach(([x, y]) => {
      g.fillStyle = "#121217"; g.beginPath(); g.arc(x, y, 3*k, 0, TAU); g.fill(); g.strokeStyle = "rgba(255,255,255,.6)"; g.stroke(); });
  },
  // V11 粒子動畫：風場地圖般的短尾粒子＋移動的吸引點軌跡＋時間軸
  function(g, W, H, r, c, U){
    const k = W/300, path = t => [W*(.5 + .3*Math.sin(t*TAU*.8 + .5)), H*(.45 + .25*Math.sin(t*TAU*1.6))];
    g.strokeStyle = "rgba(255,255,255,.25)"; g.setLineDash([2, 4]); U.poly(g, [...Array(61)].map((_, i) => path(i/60*.72))); g.stroke(); g.setLineDash([]);
    [.12, .27, .42, .57].forEach((t, i) => { const [x, y] = path(t); g.strokeStyle = `rgba(255,255,255,${.12 + i*.08})`; g.beginPath(); g.arc(x, y, 6*k, 0, TAU); g.stroke(); });
    const [ax, ay] = path(.72);
    const f = (x, y) => { const dx = x - ax, dy = y - ay, d = Math.hypot(dx, dy) + 10; return [.6 - dy/d*W*.25/(d*.6 + 20) - dx/d*.25, dx/d*W*.25/(d*.6 + 20) - dy/d*.25]; };
    const ok = inRect(0, 0, W, H*.88);
    g.lineCap = "round";
    for(let i = 0; i < 420; i++){
      const pts = trace(f, r()*W, r()*H*.88, 12, 1.8*k, ok);
      for(let j = 1; j < pts.length; j++){ g.strokeStyle = U.rgba(c, j/pts.length*.85); g.lineWidth = .4 + j/pts.length*1.2;
        g.beginPath(); g.moveTo(pts[j-1][0], pts[j-1][1]); g.lineTo(pts[j][0], pts[j][1]); g.stroke(); }
      const e = pts[pts.length - 1]; g.fillStyle = "rgba(255,255,255,.85)"; g.fillRect(e[0] - .7, e[1] - .7, 1.4, 1.4);
    }
    glow(g, ax, ay, 20*k, "rgba(255,255,255,.6)"); g.fillStyle = "#fff"; g.beginPath(); g.arc(ax, ay, 3.5*k, 0, TAU); g.fill();
    // 時間軸
    const ty = H*.94; g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(W*.08, ty); g.lineTo(W*.92, ty);
    for(let i = 0; i <= 10; i++){ const x = W*.08 + W*.84*i/10; g.moveTo(x, ty - 3); g.lineTo(x, ty + 3); } g.stroke();
    g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.moveTo(W*.08, ty); g.lineTo(W*(.08 + .84*.72), ty); g.stroke();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(W*(.08 + .84*.72), ty, 3.5*k, 0, TAU); g.fill();
  },
  // V12 與 Boids 混合：河道平面圖，流線沿河道蜿蜒，魚群一邊互相避讓一邊順流；標出一隻魚的感知半徑與三個轉向力
  function(g, W, H, r, c, U){
    const k = W/300, ph = r()*TAU, hw = H*.3;
    const cy = x => H*(.5 + .16*Math.sin(x/W*TAU*1.1 + ph));            // 河道中心線
    const dcy = x => H*.16*Math.cos(x/W*TAU*1.1 + ph)*TAU*1.1/W;          // 中心線斜率
    const ang = (x, y) => Math.atan(dcy(x)) + (y - cy(x))/hw*.12;          // 場方向：順河道
    // 河岸：上下兩側以較亮的灰階填滿＋岸線
    g.fillStyle = "#26262F";
    for(const s of [-1, 1]){ g.beginPath(); g.moveTo(0, s < 0 ? 0 : H);
      for(let i = 0; i <= 60; i++){ const x = i/60*W; g.lineTo(x, cy(x) + s*(hw + 4*k*Math.sin(i*.3 + ph))); }
      g.lineTo(W, s < 0 ? 0 : H); g.closePath(); g.fill(); }
    g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1.2;
    for(const s of [-1, 1]){ g.beginPath(); for(let i = 0; i <= 60; i++){ const x = i/60*W, y = cy(x) + s*(hw + 4*k*Math.sin(i*.3 + ph)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    // 河道內的流線（細、淡）
    g.lineWidth = .8;
    for(let o = -.85; o <= .86; o += .17){ g.strokeStyle = U.rgba(c, .28); g.beginPath();
      for(let i = 0; i <= 80; i++){ const x = i/80*W, y = cy(x) + o*hw*(1 - .08*Math.cos(i*.2)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    // 魚群：三群，Boids（分離、對齊、凝聚）＋場轉向力
    const B = [];
    [[.15, -.3], [.45, .35], [.72, -.05]].forEach(([fx, fo]) => { const x0 = W*fx;
      for(let i = 0; i < 20; i++){ const x = x0 + (r() - .5)*70*k, y = cy(x0) + fo*hw + (r() - .5)*45*k, a = ang(x, y) + (r() - .5)*1.2;
        B.push({x, y, vx: Math.cos(a), vy: Math.sin(a)}); } });
    const sp = 1.3*k;
    for(let st = 0; st < 45; st++){
      for(const b of B){ let sx = 0, sy = 0, ax = 0, ay = 0, mx = 0, my = 0, n = 0;
        for(const o of B){ if(o === b) continue; const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
          if(d < 30*k){ n++; ax += o.vx; ay += o.vy; mx += dx; my += dy; if(d < 12*k){ sx -= dx/(d || 1); sy -= dy/(d || 1); } } }
        const a = ang(b.x, b.y), off = (b.y - cy(b.x))/hw;
        b.nx = b.vx + Math.cos(a)*.35 + sx*.6 + (n ? (ax/n - b.vx)*.25 + mx/n*.01/k : 0);
        b.ny = b.vy + Math.sin(a)*.35 + sy*.6 + (n ? (ay/n - b.vy)*.25 + my/n*.01/k : 0) - (Math.abs(off) > .8 ? off*.6 : 0); }
      for(const b of B){ const [ux, uy] = nrm(b.nx, b.ny); b.vx = ux; b.vy = uy; b.x += ux*sp; b.y += uy*sp; if(b.x > W + 10) b.x -= W + 20; }
    }
    // 畫魚：身體（橢圓）＋尾鰭
    const fish = (b, col, s) => { const a = Math.atan2(b.vy, b.vx); g.save(); g.translate(b.x, b.y); g.rotate(a); g.fillStyle = col;
      g.beginPath(); g.ellipse(0, 0, 6*s, 2.3*s, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(-4.5*s, 0); g.lineTo(-9*s, -3*s); g.lineTo(-8*s, 0); g.lineTo(-9*s, 3*s); g.closePath(); g.fill(); g.restore(); };
    B.forEach((b, i) => fish(b, i % 5 ? "rgba(255,255,255,.88)" : c, k));
    // 標示一隻魚：感知半徑（虛線圓）＋場轉向（主色）、對齊（白）、分離（灰）三個力
    const h = B[20]; g.setLineDash([3*k, 3*k]); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1;
    g.beginPath(); g.arc(h.x, h.y, 30*k, 0, TAU); g.stroke(); g.setLineDash([]);
    const fa = ang(h.x, h.y), va = Math.atan2(h.vy, h.vx);
    g.lineWidth = 1.8*k; g.strokeStyle = c; arrow(g, h.x, h.y, fa, 24*k, 5*k);
    g.lineWidth = 1.2*k; g.strokeStyle = "#fff"; arrow(g, h.x, h.y, va - .5, 16*k, 4*k);
    g.strokeStyle = "rgba(255,255,255,.45)"; arrow(g, h.x, h.y, va + 2.2, 12*k, 3.5*k);
    fish(h, c, k*1.3);
  },
];

// ---------- 沒有照片的案例 ----------

// C03-01 Hobbs 教學文章：三步驟示意（角度格網 → 幾條曲線 → 完整作品）
ART.case["C03-01"] = function(g, W, H, r, c, U){
  const k = W/300, nz = U.vnoise((r()*1e6)|0), ph = H/3, sc = 2.5/W;
  const ang = (x, y) => (fbm(nz, x*sc, y*sc*1.4) - .5)*TAU*1.4;
  const f = (x, y) => [Math.cos(ang(x, y)), Math.sin(ang(x, y))];
  for(let p = 0; p < 3; p++){
    const y0 = p*ph, pad = 8*k;
    g.save(); g.translate(0, y0); g.beginPath(); g.rect(pad, pad, W - 2*pad, ph - 2*pad); g.clip();
    g.fillStyle = "rgba(255,255,255,.03)"; g.fillRect(pad, pad, W - 2*pad, ph - 2*pad);
    const S = 14*k;
    if(p < 2){ g.strokeStyle = p === 0 ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.14)"; g.lineWidth = 1;
      for(let y = pad + S/2; y < ph; y += S) for(let x = pad + S/2; x < W; x += S){ const a = ang(x, y*1.4); g.beginPath(); g.moveTo(x - Math.cos(a)*S*.35, y - Math.sin(a)*S*.35); g.lineTo(x + Math.cos(a)*S*.35, y + Math.sin(a)*S*.35); g.stroke();
        if(p === 0){ g.fillStyle = c; g.fillRect(x + Math.cos(a)*S*.35 - 1, y + Math.sin(a)*S*.35 - 1, 2, 2); } } }
    const fy = (x, y) => f(x, y*1.4), ok = inRect(-10, -10, W + 10, ph + 10);
    if(p === 1){ g.lineWidth = 2*k; g.strokeStyle = c;
      for(let i = 0; i < 4; i++){ const sx = W*(.1 + r()*.3), sy = ph*(.2 + i*.2); line(g, trace(fy, sx, sy, 150, 1.5*k, ok));
        g.fillStyle = "#fff"; g.beginPath(); g.arc(sx, sy, 2.5*k, 0, TAU); g.fill(); } }
    if(p === 2){ for(let i = 0; i < 170; i++){ g.strokeStyle = r() < .2 ? "rgba(255,255,255,.7)" : U.rgba(c, .4 + r()*.5); g.lineWidth = .5 + r()*2*k;
      line(g, trace(fy, r()*W, r()*ph, 90, 1.5*k, ok)); } }
    g.restore();
    // 步驟編號：圓點數量
    for(let d = 0; d <= p; d++){ g.fillStyle = c; g.beginPath(); g.arc(W - pad - 6*k - d*7*k, y0 + pad + 6*k, 2.5*k, 0, TAU); g.fill(); }
  }
};
ART.case["C03-01"].ratio = 1.3;

// C03-02 Fidenza：藝廊牆上的裱框作品，粗帶狀流線互不重疊
ART.case["C03-02"] = function(g, W, H, r, c, U){
  const k = W/300, fx = W*.19, fy = H*.1, fw = W*.62, fh = H*.6;
  g.fillStyle = "#0E0E12"; g.fillRect(0, H*.8, W, H*.2);
  g.strokeStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.moveTo(0, H*.8); g.lineTo(W, H*.8); g.stroke();
  glow(g, W/2, fy + fh*.3, W*.55, "rgba(255,245,225,.12)");
  g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(fx + 4*k, fy + 5*k, fw, fh);
  g.fillStyle = "#2A2520"; g.fillRect(fx - 5*k, fy - 5*k, fw + 10*k, fh + 10*k);
  g.fillStyle = "#ECE5D5"; g.fillRect(fx, fy, fw, fh);
  g.save(); g.beginPath(); g.rect(fx, fy, fw, fh); g.clip();
  const nz = U.vnoise((r()*1e6)|0), sc = 1.6/fw, base = r()*TAU;
  const f = (x, y) => { const a = base + (nz(x*sc, y*sc) - .5)*2.2; return [Math.cos(a), Math.sin(a)]; };
  const cs = 2*k, nx = Math.ceil(fw/cs) + 1, ny = Math.ceil(fh/cs) + 1, occ = new Uint8Array(nx*ny);
  const pal = [c, c, "#1C2B4A", "#E8563F", "#F2C14E", "#E9E2D0", "#8FB8B5", "#1C1C24"];
  const hit = (x, y, w) => { const R = Math.ceil(w/cs); const ci = ((x - fx)/cs)|0, cj = ((y - fy)/cs)|0;
    for(let j = cj - R; j <= cj + R; j++) for(let i = ci - R; i <= ci + R; i++){ if(i < 0 || j < 0 || i >= nx || j >= ny) continue; if(occ[j*nx + i]) return true; } return false; };
  const mark = (x, y, w) => { const R = Math.ceil(w/cs); const ci = ((x - fx)/cs)|0, cj = ((y - fy)/cs)|0;
    for(let j = cj - R; j <= cj + R; j++) for(let i = ci - R; i <= ci + R; i++){ if(i < 0 || j < 0 || i >= nx || j >= ny) continue; occ[j*nx + i] = 1; } };
  g.lineCap = "round"; g.lineJoin = "round";
  for(let t = 0; t < 260; t++){
    const w = [1.2, 2, 3.5, 6][(r()*4)|0]*k; let x = fx + r()*fw, y = fy + r()*fh;
    if(hit(x, y, w + 2*k)) continue;
    const pts = [[x, y]];
    for(let s = 0; s < 45; s++){ const d = f(x, y); x += d[0]*1.6*k; y += d[1]*1.6*k; if(x < fx || y < fy || x > fx + fw || y > fy + fh || hit(x, y, w + 1.5*k)) break; pts.push([x, y]); }
    if(pts.length < 6) continue;
    pts.forEach(p => mark(p[0], p[1], w));
    g.strokeStyle = pal[(r()*pal.length)|0]; g.lineWidth = w*2; line(g, pts);
  }
  g.restore();
  // 長椅剪影
  g.fillStyle = "#08080B"; g.fillRect(W*.32, H*.86, W*.36, H*.03); g.fillRect(W*.34, H*.89, W*.02, H*.05); g.fillRect(W*.64, H*.89, W*.02, H*.05);
};
ART.case["C03-02"].ratio = .95;

// C03-03 Wind Map：全美輪廓內的實測風場粒子
ART.case["C03-03"] = function(g, W, H, r, c, U){
  const k = W/300, O = [[.04,.2],[.12,.1],[.35,.09],[.55,.12],[.62,.2],[.7,.17],[.8,.1],[.92,.08],[.97,.18],[.9,.32],[.86,.48],[.79,.6],[.82,.82],[.77,.88],[.71,.72],[.6,.68],[.52,.8],[.46,.93],[.39,.77],[.29,.73],[.2,.67],[.1,.6],[.05,.44]];
  const P = O.map(([x, y]) => [W*(.03 + x*.94), H*(.06 + y*.86)]);
  g.fillStyle = "#0C0C10"; U.poly(g, P, true); g.fill();
  g.save(); U.poly(g, P, true); g.clip();
  const nz = U.vnoise((r()*1e6)|0), sc = 2.4/W;
  const f = (x, y) => { const a = (nz(x*sc, y*sc) - .5)*TAU*.9 - .15; return [Math.cos(a), Math.sin(a)]; };
  const sp = (x, y) => Math.pow(nz(x*sc*.8 + 40, y*sc*.8 + 40), 1.6);
  const ok = () => true;
  g.lineCap = "round";
  for(let i = 0; i < 1100; i++){
    const x = r()*W, y = r()*H, v = sp(x, y);
    const pts = trace(f, x, y, 8, (.8 + v*3.2)*k, ok);
    g.strokeStyle = v > .45 ? `rgba(255,255,255,${.4 + v*.5})` : U.rgba(c, .35 + v*.8); g.lineWidth = .6 + v*.8; line(g, pts);
  }
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1; U.poly(g, P, true); g.stroke();
};
ART.case["C03-03"].ratio = .75;

// C03-04 Wind of Boston：大廳室內透視，牆上 1.8 m × 4 m 的四章節資料繪畫
ART.case["C03-04"] = function(g, W, H, r, c, U){
  const k = W/300, vx = W/2, vy = H*.42, bx0 = W*.14, bx1 = W*.86, by0 = H*.12, by1 = H*.7;
  // 房間輪廓
  g.fillStyle = "#17171E"; g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
  g.fillStyle = "#101014"; U.poly(g, [[0, H], [bx0, by1], [bx1, by1], [W, H]], true); g.fill();
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.beginPath();
  [[0, 0, bx0, by0], [W, 0, bx1, by0], [0, H, bx0, by1], [W, H, bx1, by1]].forEach(([a, b, x, y]) => { g.moveTo(a, b); g.lineTo(x, y); });
  g.rect(bx0, by0, bx1 - bx0, by1 - by0); g.stroke();
  // 地磚透視線
  g.strokeStyle = "rgba(255,255,255,.06)"; g.beginPath();
  for(let i = -6; i <= 6; i++){ const x = vx + i*(bx1 - bx0)/12; g.moveTo(x, by1); g.lineTo(vx + (x - vx)*(H - vy)/(by1 - vy), H); }
  for(let t = 1; t < 5; t++){ const y = by1 + (H - by1)*Math.pow(t/5, 1.6); g.moveTo(0, y); g.lineTo(W, y); } g.stroke();
  // 螢幕：寬高比 4:1.8
  const sw = (bx1 - bx0)*.82, sh = sw*1.8/4, sx = vx - sw/2, sy = by0 + (by1 - by0)*.14;
  glow(g, vx, sy + sh/2, sw*.7, U.rgba(c, .25));
  g.fillStyle = "#07070A"; g.fillRect(sx - 2, sy - 2, sw + 4, sh + 4);
  for(let ch = 0; ch < 4; ch++){
    const x0 = sx + ch*sw/4, nz = U.vnoise((r()*1e6)|0), sc = 3/sw, bias = [-.2, .8, 2.4, -1.6][ch];
    g.save(); g.beginPath(); g.rect(x0, sy, sw/4, sh); g.clip();
    const f = (x, y) => { const a = bias + (nz(x*sc, y*sc) - .5)*TAU*(.3 + ch*.25); return [Math.cos(a), Math.sin(a)]; };
    for(let i = 0; i < 70; i++){ g.strokeStyle = r() < .2 ? "rgba(255,255,255,.6)" : U.rgba(c, .5 + r()*.5); g.lineWidth = .5 + r()*.7;
      line(g, trace(f, x0 + r()*sw/4, sy + r()*sh, 22, 1.2*k, () => true)); }
    g.restore();
    if(ch){ g.strokeStyle = "#07070A"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0, sy); g.lineTo(x0, sy + sh); g.stroke(); }
  }
  // 螢幕在地面的反光
  g.fillStyle = U.rgba(c, .06); U.poly(g, [[sx, by1 + 2], [sx + sw, by1 + 2], [sx + sw + sw*.2, by1 + (H - by1)*.5], [sx - sw*.2, by1 + (H - by1)*.5]], true); g.fill();
  // 人物剪影
  [[.3, .92, 1], [.62, .8, .7], [.74, .76, .55]].forEach(([px, py, s]) => { const hh = H*.24*s, x = W*px, y = H*py;
    g.fillStyle = "#050507"; g.beginPath(); g.arc(x, y - hh + hh*.09, hh*.09, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x - hh*.12, y); g.lineTo(x - hh*.14, y - hh*.75); g.quadraticCurveTo(x, y - hh*.86, x + hh*.14, y - hh*.75); g.lineTo(x + hh*.12, y); g.closePath(); g.fill(); });
  // 天花燈
  g.fillStyle = "rgba(255,255,255,.5)"; [.25, .5, .75].forEach(t => { g.beginPath(); g.ellipse(W*t, H*.05, 10*k, 2*k, 0, 0, TAU); g.fill(); });
};
ART.case["C03-04"].ratio = .8;

// C03-05 Butterfly CFD：都市街廓平面的風速色階＋流線＋色階圖例
ART.case["C03-05"] = function(g, W, H, r, c, U){
  const k = W/300, blocks = [];
  for(let t = 0; t < 80 && blocks.length < 6; t++){
    const hw = W*(.04 + r()*.05), hh = H*(.04 + r()*.06), x = W*(.22 + r()*.58), y = H*(.18 + r()*.64);
    if(blocks.every(b => Math.abs(b[0] - x) > b[2] + hw + W*.05 || Math.abs(b[1] - y) > b[3] + hh + H*.05)) blocks.push([x, y, hw, hh, Math.max(hw, hh)*1.25]);
  }
  const vel = (x, y) => { let u = 1, v = 0;
    for(const [bx, by, , , R] of blocks){ const dx = x - bx, dy = y - by, r2 = dx*dx + dy*dy + 1, r4 = r2*r2; u -= R*R*(dx*dx - dy*dy)/r4; v -= 2*R*R*dx*dy/r4; }
    return [u, v]; };
  const inB = (x, y) => blocks.some(([bx, by, hw, hh]) => Math.abs(x - bx) < hw && Math.abs(y - by) < hh);
  const n = 64, m = Math.round(n*H/W);
  U.field(g, W, H, n, m, (i, j) => { const x = i/(n - 1)*W, y = j/(m - 1)*H; if(inB(x, y)) return 0; const [u, v] = vel(x, y); return Math.hypot(u, v)*.55; }, c, 1.1);
  const ok = (x, y) => x > -2 && y > -2 && x < W*.9 && y < H + 2 && !inB(x, y);
  g.strokeStyle = "rgba(255,255,255,.65)"; g.lineWidth = .8;
  for(let i = 0; i < 30; i++) line(g, trace(vel, 0, H*(i + .5)/30, 400, 2*k, ok));
  blocks.forEach(([x, y, hw, hh]) => { g.fillStyle = "#26262F"; g.fillRect(x - hw, y - hh, hw*2, hh*2); g.strokeStyle = "rgba(255,255,255,.5)"; g.strokeRect(x - hw, y - hh, hw*2, hh*2); });
  // 色階圖例
  const lx = W*.93, ly0 = H*.15, ly1 = H*.85, gr = g.createLinearGradient(0, ly1, 0, ly0);
  gr.addColorStop(0, "#15151B"); gr.addColorStop(.7, c); gr.addColorStop(1, "#fff");
  g.fillStyle = gr; g.fillRect(lx, ly0, 6*k, ly1 - ly0); g.strokeStyle = "rgba(255,255,255,.4)"; g.strokeRect(lx, ly0, 6*k, ly1 - ly0);
  g.beginPath(); for(let i = 0; i <= 5; i++){ const y = ly0 + (ly1 - ly0)*i/5; g.moveTo(lx + 6*k, y); g.lineTo(lx + 9*k, y); } g.stroke();
  g.strokeStyle = "#fff"; g.lineWidth = 1.5; arrow(g, 6*k, 12*k, 0, 18*k, 4*k);
};
ART.case["C03-05"].ratio = .85;

// C03-06 Rheotomic Surfaces：位勢流的流線與正交等位線網格（建模視窗）
ART.case["C03-06"] = function(g, W, H, r, c, U){
  const k = W/300, src = [[W*(.25 + r()*.1), H*(.35 + r()*.3), W*.35], [W*(.65 + r()*.1), H*(.35 + r()*.3), -W*.35]], vtx = [[W*(.45 + r()*.1), H*(.2 + r()*.6), (r() < .5 ? 1 : -1)*W*.3]];
  const vel = (x, y) => { let u = .5, v = 0;
    for(const [ax, ay, q] of src){ const dx = x - ax, dy = y - ay, r2 = dx*dx + dy*dy + 1; u += q*dx/r2/6; v += q*dy/r2/6; }
    for(const [ax, ay, q] of vtx){ const dx = x - ax, dy = y - ay, r2 = dx*dx + dy*dy + 1; u += q*dy/r2/6; v -= q*dx/r2/6; }
    return [u, v]; };
  const perp = (x, y) => { const [u, v] = vel(x, y); return [-v, u]; };
  const sing = src.concat(vtx), ok = (x, y) => x > 0 && y > 0 && x < W && y < H && sing.every(([ax, ay]) => Math.hypot(x - ax, y - ay) > 5*k);
  // 建模格線
  g.strokeStyle = "rgba(255,255,255,.05)"; g.lineWidth = 1; g.beginPath();
  for(let x = 0; x < W; x += 15*k){ g.moveTo(x, 0); g.lineTo(x, H); } for(let y = 0; y < H; y += 15*k){ g.moveTo(0, y); g.lineTo(W, y); } g.stroke();
  g.lineWidth = 1.1; g.strokeStyle = U.rgba(c, .85);
  for(let i = 0; i < 22; i++){ const a = i/22*TAU; line(g, trace(vel, src[0][0] + Math.cos(a)*6*k, src[0][1] + Math.sin(a)*6*k, 500, 1.6*k, ok)); }
  for(let i = 0; i < 12; i++) line(g, trace2(vel, 2*k, H*(i + .5)/12, 300, 1.6*k, ok));
  g.lineWidth = .8; g.strokeStyle = "rgba(255,255,255,.4)";
  for(let i = 0; i < 16; i++) line(g, trace2(perp, W*(i + .5)/16, H*(.3 + r()*.4), 300, 1.6*k, ok));
  // 控制點：源／匯為方塊，渦旋為圓＋旋轉箭頭
  src.forEach(([x, y, q]) => { g.fillStyle = q > 0 ? "#fff" : c; g.fillRect(x - 4*k, y - 4*k, 8*k, 8*k); g.strokeStyle = "#fff"; g.strokeRect(x - 4*k, y - 4*k, 8*k, 8*k); });
  vtx.forEach(([x, y, q]) => { g.strokeStyle = "#fff"; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, 4*k, 0, TAU); g.stroke();
    g.beginPath(); g.arc(x, y, 11*k, 0, 4.5, q < 0); g.stroke(); });
  // 視窗框與座標軸
  g.strokeStyle = U.rgba(c, .9); g.lineWidth = 2; g.strokeRect(1, 1, W - 2, H - 2);
  const ox = 14*k, oy = H - 14*k; g.lineWidth = 1.6;
  g.strokeStyle = "#E4572E"; g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + 16*k, oy); g.stroke();
  g.strokeStyle = "#3FA34D"; g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox, oy - 16*k); g.stroke();
};
ART.case["C03-06"].ratio = 1.05;

// C03-07 Jobard–Lefer 論文圖：紙本兩格對照（格子起點雜亂 vs 等間距）
ART.case["C03-07"] = function(g, W, H, r, c, U){
  const k = W/300, ink = "#23232B";
  g.fillStyle = "#E9E5DB"; g.fillRect(0, 0, W, H);
  const nz = U.vnoise((r()*1e6)|0), pw = W*.44, ph = H*.72, py = H*.1, sc = 2.4/pw;
  const make = x0 => (x, y) => { const a = (nz((x - x0)*sc, (y - py)*sc) - .5)*TAU*1.3; return [Math.cos(a), Math.sin(a)]; };
  [W*.04, W*.52].forEach((x0, p) => {
    g.strokeStyle = ink; g.lineWidth = 1; g.strokeRect(x0, py, pw, ph);
    g.save(); g.beginPath(); g.rect(x0, py, pw, ph); g.clip();
    const f = make(x0); g.strokeStyle = ink;
    if(p === 0){ g.lineWidth = .7; const G = 9;
      for(let j = 0; j < G*ph/pw; j++) for(let i = 0; i < G; i++){ const sx = x0 + (i + .5)*pw/G, sy = py + (j + .5)*pw/G; line(g, trace(f, sx, sy, 30, 1.3*k, () => true));
        g.fillStyle = ink; g.fillRect(sx - 1, sy - 1, 2, 2); } }
    else { g.lineWidth = .8; evenly(f, x0, py, x0 + pw, py + ph, pw/20, 1.1*k, r, 200, 400).forEach(L => line(g, L)); }
    g.restore();
    // 圖說位置（灰條）
    g.fillStyle = "rgba(35,35,43,.25)"; g.fillRect(x0, py + ph + 8*k, pw*.7, 3*k); g.fillRect(x0, py + ph + 14*k, pw*.45, 3*k);
  });
  // dsep 示意圓
  const cx = W*.52 + pw*.85, cy = py + ph*.12;
  g.strokeStyle = c; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, 9*k, 0, TAU); g.stroke();
  g.setLineDash([2, 2]); g.beginPath(); g.arc(cx, cy, 4.5*k, 0, TAU); g.stroke(); g.setLineDash([]);
};
ART.case["C03-07"].ratio = .75;

// C03-08 MATLAB 實作：座標軸、刻度、quiver 箭頭與等間距流線的繪圖視窗
ART.case["C03-08"] = function(g, W, H, r, c, U){
  const k = W/300, x0 = W*.13, y0 = H*.08, x1 = W*.84, y1 = H*.86;
  g.fillStyle = "#1A1A21"; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const cx = (x0 + x1)/2, cy = (y0 + y1)/2, s = (x1 - x0)/2, a1 = .4 + r()*.4;
  // 鞍點＋渦旋的解析場
  const f = (x, y) => { const X = (x - cx)/s, Y = (y - cy)/s; return [X*a1 - Y + .3*Math.sin(3*Y), -Y*a1 - X*.4 + .3*Math.cos(3*X)]; };
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1; g.beginPath();
  for(let i = 1; i < 8; i++){ const x = x0 + (x1 - x0)*i/8, y = y0 + (y1 - y0)*i/8; g.moveTo(x, y0); g.lineTo(x, y1); g.moveTo(x0, y); g.lineTo(x1, y); } g.stroke();
  g.strokeStyle = "rgba(255,255,255,.25)";
  for(let j = 0; j < 12; j++) for(let i = 0; i < 12; i++){ const x = x0 + (x1 - x0)*(i + .5)/12, y = y0 + (y1 - y0)*(j + .5)/12, v = f(x, y), m = Math.hypot(...v); arrow(g, x, y, Math.atan2(v[1], v[0]), Math.min(1, m)*8*k, 2*k); }
  const L = evenly(f, x0, y0, x1, y1, (x1 - x0)/24, 1.2*k, r, 200, 500);
  L.forEach(p => { const v = f(...p[(p.length/2)|0]), m = Math.min(1, Math.hypot(...v)/1.4); g.strokeStyle = m > .7 ? "rgba(255,255,255,.9)" : U.rgba(c, .5 + m*.5); g.lineWidth = 1.1; line(g, p); });
  // 座標軸與刻度
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1; g.strokeRect(x0, y0, x1 - x0, y1 - y0); g.beginPath();
  for(let i = 0; i <= 8; i++){ const x = x0 + (x1 - x0)*i/8, y = y0 + (y1 - y0)*i/8; g.moveTo(x, y1); g.lineTo(x, y1 + 4*k); g.moveTo(x0, y); g.lineTo(x0 - 4*k, y); } g.stroke();
  // 色條
  const bx = W*.88, gr = g.createLinearGradient(0, y1, 0, y0); gr.addColorStop(0, "#15151B"); gr.addColorStop(.7, c); gr.addColorStop(1, "#fff");
  g.fillStyle = gr; g.fillRect(bx, y0, 7*k, y1 - y0); g.strokeStyle = "rgba(255,255,255,.5)"; g.strokeRect(bx, y0, 7*k, y1 - y0);
};
ART.case["C03-08"].ratio = .9;

// C03-09 Curl-Noise 論文：煙柱由噴口上升、被球體障礙分開並逐漸紊亂
ART.case["C03-09"] = function(g, W, H, r, c, U){
  const k = W/300, nz = U.vnoise((r()*1e6)|0), cx = W/2, sx = cx + (r() - .5)*W*.08, sy = H*.5, R = W*.11, sc = 3/W;
  const psi = (x, y) => { const d = Math.hypot(x - sx, y - sy) - R, ramp = d <= 0 ? 0 : Math.min(1, d/(W*.12)), turb = Math.pow(Math.max(0, 1 - y/H), 1.3);
    const p = ramp*(ramp*(1.875 - 1.25*ramp*ramp) );
    return p*((x - cx) + (nz(x*sc, y*sc*.8) - .5)*W*.45*turb); };
  const f = (x, y) => [(psi(x, y + 1) - psi(x, y - 1)), -(psi(x + 1, y) - psi(x - 1, y))];
  const ok = (x, y) => x > -5 && x < W + 5 && y > -5 && Math.hypot(x - sx, y - sy) > R;
  g.lineWidth = .8;
  for(let i = 0; i < 150; i++){
    const x = cx + (r() - .5)*W*.2, y = H*.93;
    g.strokeStyle = r() < .5 ? `rgba(255,255,255,${.12 + r()*.2})` : U.rgba(c, .25 + r()*.35);
    line(g, trace(f, x, y, 380, 1.6*k, ok));
  }
  const gr = g.createRadialGradient(sx - R*.35, sy - R*.35, R*.1, sx, sy, R);
  gr.addColorStop(0, "#5A5A68"); gr.addColorStop(1, "#1A1A21"); g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.fill();
  g.strokeStyle = "rgba(255,255,255,.3)"; g.stroke();
  g.fillStyle = "#2A2A33"; g.fillRect(cx - W*.12, H*.93, W*.24, H*.04); g.fillStyle = c; g.fillRect(cx - W*.11, H*.93, W*.22, 2*k);
};
ART.case["C03-09"].ratio = 1.3;

// C03-10 Kartal-Pendik：軟格網都市鳥瞰，街廓順著場變形、塔樓高度漸變，下方臨海
ART.case["C03-10"] = function(g, W, H, r, c, U){
  const k = W/300, nz = U.vnoise((r()*1e6)|0), N = 14, M = Math.round(N*H/W), sc = 2.6;
  const coast = x => H*(.8 + .08*Math.sin(x/W*Math.PI*1.4 + 1));
  const P = (i, j) => { const u = i/N, v = j/M, dx = (nz(u*sc, v*sc) - .5)*W*.32, dy = (nz(u*sc + 7, v*sc + 7) - .5)*H*.24 + Math.sin(u*Math.PI)*H*.06;
    return [u*W*1.1 - W*.05 + dx, v*H*1.05 - H*.05 + dy]; };
  // 海
  g.fillStyle = "#0D1422"; g.beginPath(); g.moveTo(0, H); for(let x = 0; x <= W; x += 6) g.lineTo(x, coast(x)); g.lineTo(W, H); g.closePath(); g.fill();
  g.strokeStyle = "rgba(255,255,255,.3)"; g.beginPath(); for(let x = 0; x <= W; x += 6) x ? g.lineTo(x, coast(x)) : g.moveTo(x, coast(x)); g.stroke();
  const hx = r()*W, hy = H*(.3 + r()*.2);
  for(let j = 0; j < M; j++) for(let i = 0; i < N; i++){
    const q = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], mx = (q[0][0] + q[2][0])/2, my = (q[0][1] + q[2][1])/2;
    if(my > coast(mx) - 4*k) continue;
    const ins = q.map(p => [mx + (p[0] - mx)*.78, my + (p[1] - my)*.78]);
    const ht = Math.max(0, 1 - Math.hypot(mx - hx, my - hy)/(W*.55)), lift = ht*ht*14*k;
    if(lift > 1){ const top = ins.map(p => [p[0] - lift*.35, p[1] - lift]);
      g.fillStyle = "rgba(0,0,0,.35)"; U.poly(g, ins.map(p => [p[0] + lift*.6, p[1] + lift*.2]), true); g.fill();
      for(let e = 0; e < 4; e++){ const a = ins[e], b = ins[(e + 1) % 4]; g.fillStyle = U.rgba(c, .18 + .1*(e % 2)); U.poly(g, [a, b, top[(e + 1) % 4], top[e]], true); g.fill(); }
      g.fillStyle = U.rgba(c, .35 + ht*.55); U.poly(g, top, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .6; g.stroke();
    } else { g.fillStyle = "rgba(255,255,255,.08)"; U.poly(g, ins, true); g.fill(); g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = .5; g.stroke(); }
  }
  // 主軸道路
  const jr = (M*.45)|0; g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 2*k; U.poly(g, [...Array(N + 1)].map((_, i) => { const a = P(i, jr), b = P(i, jr + 1); return [(a[0] + b[0])/2, (a[1] + b[1])/2]; })); g.stroke();
};
ART.case["C03-10"].ratio = 1;

// C03-11 StreamLines3D：四視窗（上、前、右、透視）同時顯示 RK4 追蹤的 ABC 流
ART.case["C03-11"] = function(g, W, H, r, c, U){
  const k = W/300, A = 1, B = .7 + r()*.2, C = .45 + r()*.1;
  const v3 = p => [A*Math.sin(p[2]) + C*Math.cos(p[1]), B*Math.sin(p[0]) + A*Math.cos(p[2]), C*Math.sin(p[1]) + B*Math.cos(p[0])];
  const add = (p, d, s) => [p[0] + d[0]*s, p[1] + d[1]*s, p[2] + d[2]*s];
  const lines = [];
  // 週期邊界：流線跑出盒子就從對面接續，另起一段
  for(let i = 0; i < 7; i++){ let p = [r()*TAU, r()*TAU, r()*TAU], pts = [p];
    for(let t = 0; t < 320; t++){ const h = .06, k1 = v3(p), k2 = v3(add(p, k1, h/2)), k3 = v3(add(p, k2, h/2)), k4 = v3(add(p, k3, h));
      p = [0, 1, 2].map(a => p[a] + h/6*(k1[a] + 2*k2[a] + 2*k3[a] + k4[a]));
      if(p.some(x => x < 0 || x > TAU)){ p = p.map(x => (x + TAU) % TAU); if(pts.length > 1) lines.push(pts); pts = []; }
      pts.push(p); }
    if(pts.length > 1) lines.push(pts); }
  const pw = W/2, ph = H/2, s = Math.min(pw, ph)*.78/TAU;
  const views = [p => [p[0], p[1]], p => [p[0], TAU - p[2]], p => [p[1], TAU - p[2]],
    p => { const x = p[0] - Math.PI, y = p[1] - Math.PI, z = p[2] - Math.PI; return [(x - y)*.72 + Math.PI, (x + y)*.4 - z*.8 + Math.PI]; }];
  views.forEach((V, vi) => {
    const ox = (vi % 2)*pw, oy = ((vi/2)|0)*ph, cx = ox + pw/2 - Math.PI*s, cy = oy + ph/2 - Math.PI*s, pr = p => { const q = V(p); return [cx + q[0]*s, cy + q[1]*s]; };
    g.fillStyle = vi === 3 ? "#1B1B24" : "#16161C"; g.fillRect(ox + 2, oy + 2, pw - 4, ph - 4);
    g.save(); g.beginPath(); g.rect(ox + 2, oy + 2, pw - 4, ph - 4); g.clip();
    g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1; g.beginPath();
    if(vi < 3){ for(let t = 0; t <= 8; t++){ const a = t/8*TAU; g.moveTo(cx + a*s, cy); g.lineTo(cx + a*s, cy + TAU*s); g.moveTo(cx, cy + a*s); g.lineTo(cx + TAU*s, cy + a*s); } }
    else { for(let t = 0; t <= 8; t++){ const a = t/8*TAU, p1 = pr([a, 0, 0]), p2 = pr([a, TAU, 0]), p3 = pr([0, a, 0]), p4 = pr([TAU, a, 0]); g.moveTo(...p1); g.lineTo(...p2); g.moveTo(...p3); g.lineTo(...p4); } }
    g.stroke();
    g.lineWidth = 1.1;
    lines.forEach((L, li) => { g.strokeStyle = li % 3 === 0 ? "rgba(255,255,255,.8)" : U.rgba(c, .85); line(g, L.map(pr));
      if(vi === 3){ g.fillStyle = "#fff"; for(let t = 0; t < L.length; t += 12){ const q = pr(L[t]); g.fillRect(q[0] - 1, q[1] - 1, 2, 2); } } });
    if(vi === 3){ const q = pr([0, 0, 0]); g.lineWidth = 1.6;
      [[[1.4, 0, 0], "#E4572E"], [[0, 1.4, 0], "#3FA34D"], [[0, 0, 1.4], c]].forEach(([d, col]) => { const e = pr(d); g.strokeStyle = col; g.beginPath(); g.moveTo(...q); g.lineTo(...e); g.stroke(); }); }
    g.restore();
    g.strokeStyle = vi === 3 ? c : "rgba(255,255,255,.2)"; g.lineWidth = vi === 3 ? 1.6 : 1; g.strokeRect(ox + 2, oy + 2, pw - 4, ph - 4);
  });
};
ART.case["C03-11"].ratio = 1;

// C03-12 參數化鋪面：廣場平面被流線切成彎曲條帶，條帶內再分磚縫
ART.case["C03-12"] = function(g, W, H, r, c, U){
  const k = W/300, nz = U.vnoise((r()*1e6)|0), sc = 1.8/W;
  const f = (x, y) => { const a = (nz(x*sc, y*sc) - .5)*1.3 + Math.sin(x/W*Math.PI*2)*.2; return [Math.cos(a), Math.sin(a)]; };
  const plaza = [[W*.08, H*.18], [W*.5, H*.08], [W*.92, H*.2], [W*.95, H*.62], [W*.7, H*.9], [W*.25, H*.88], [W*.05, H*.6]];
  // 周邊建築
  g.fillStyle = "#23232C"; [[0, 0, W*.35, H*.1], [W*.6, 0, W*.4, H*.12], [W*.8, H*.72, W*.2, H*.28], [0, H*.75, W*.15, H*.25]].forEach(b => g.fillRect(...b));
  g.save(); U.poly(g, plaza, true); g.clip();
  const n = 22, ok = inRect(-40, -H, W + 40, 2*H), L = [];
  for(let i = 0; i <= n; i++) L.push(trace(f, -30, -H*.2 + H*1.4*i/n, 500, 2*k, ok));
  for(let i = 0; i < n; i++){ U.poly(g, L[i].concat(L[i + 1].slice().reverse()), true); g.fillStyle = i % 2 ? U.rgba(c, .45) : "#3A3A46"; g.fill(); }
  // 磚縫：沿每條流線畫垂直短線
  g.strokeStyle = "rgba(10,10,14,.7)"; g.lineWidth = .7; g.beginPath();
  L.forEach((P, i) => { const w = H*1.4/n; for(let j = 1 + (i % 2)*2; j < P.length - 1; j += 5){ const [dx, dy] = nrm(P[j+1][0] - P[j-1][0], P[j+1][1] - P[j-1][1]); g.moveTo(P[j][0], P[j][1]); g.lineTo(P[j][0] - dy*w*.9, P[j][1] + dx*w*.9); } });
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1; L.forEach(P => line(g, P));
  g.restore();
  g.strokeStyle = "#fff"; g.lineWidth = 1.6; U.poly(g, plaza, true); g.stroke();
  // 樹
  [[.18, .3], [.82, .35], [.6, .75], [.35, .7]].forEach(([x, y]) => { const R = (8 + r()*4)*k; g.fillStyle = "rgba(63,163,77,.35)"; g.beginPath(); g.arc(W*x, H*y, R, 0, TAU); g.fill();
    g.strokeStyle = "rgba(160,220,170,.6)"; g.lineWidth = 1; g.stroke(); g.fillStyle = "#fff"; g.fillRect(W*x - 1, H*y - 1, 2, 2); });
};
ART.case["C03-12"].ratio = .9;

// C03-13 論壇討論：上半 Grasshopper 畫布節點與連線，下半預覽出流線聚成一團的問題
ART.case["C03-13"] = function(g, W, H, r, c, U){
  const k = W/300, split = H*.44;
  g.fillStyle = "#24242D"; g.fillRect(0, 0, W, split);
  g.fillStyle = "rgba(255,255,255,.08)"; for(let y = 6*k; y < split; y += 12*k) for(let x = 6*k; x < W; x += 12*k) g.fillRect(x, y, 1.2, 1.2);
  const comps = [[.06, .15, .2, .22, 1, 1], [.06, .55, .2, .22, 1, 1], [.38, .3, .26, .42, 3, 2], [.74, .18, .2, .2, 1, 1], [.74, .58, .2, .2, 1, 1]];
  const port = (b, side, i, n) => [W*(b[0] + (side ? b[2] : 0)), split*(b[1] + b[3]*(i + 1)/(n + 1))];
  const wire = (a, b, col) => { g.strokeStyle = col; g.lineWidth = 1.4*k; g.beginPath(); g.moveTo(...a); const dx = (b[0] - a[0])*.5; g.bezierCurveTo(a[0] + dx, a[1], b[0] - dx, b[1], b[0], b[1]); g.stroke(); };
  wire(port(comps[0], 1, 0, 1), port(comps[2], 0, 0, 3), "rgba(255,255,255,.55)");
  wire(port(comps[1], 1, 0, 1), port(comps[2], 0, 2, 3), "rgba(255,255,255,.55)");
  wire(port(comps[2], 1, 0, 2), port(comps[3], 0, 0, 1), c);
  wire(port(comps[2], 1, 1, 2), port(comps[4], 0, 0, 1), "rgba(255,255,255,.55)");
  comps.forEach((b, i) => { const x = W*b[0], y = split*b[1], w = W*b[2], h = split*b[3];
    g.fillStyle = i === 2 ? "#3B3B48" : "#34343F"; g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, 4*k) : g.rect(x, y, w, h); g.fill();
    g.strokeStyle = i === 2 ? c : "rgba(255,255,255,.35)"; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(x + w*.2, y + h*.4, w*.6, h*.2);
    for(let p = 0; p < b[4]; p++){ const q = port(b, 0, p, b[4]); g.fillStyle = "#ddd"; g.beginPath(); g.arc(q[0], q[1], 2.2*k, 0, TAU); g.fill(); }
    for(let p = 0; p < b[5]; p++){ const q = port(b, 1, p, b[5]); g.fillStyle = "#ddd"; g.beginPath(); g.arc(q[0], q[1], 2.2*k, 0, TAU); g.fill(); } });
  // 下半：Rhino 預覽，流線擠向匯點
  g.fillStyle = "#121217"; g.fillRect(0, split, W, H - split);
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, split); g.lineTo(W, split); g.stroke();
  const sinks = [[W*(.25 + r()*.15), split + (H - split)*(.35 + r()*.3)], [W*(.62 + r()*.15), split + (H - split)*(.35 + r()*.3)]];
  const f = (x, y) => { let u = .15, v = 0; for(const [sx, sy] of sinks){ const dx = sx - x, dy = sy - y, d = Math.hypot(dx, dy) + 8; u += dx/d*40/d*W/300 - dy/d*.3*30/d; v += dy/d*40/d*W/300 + dx/d*.3*30/d; } return [u, v]; };
  const ok = (x, y) => x > 0 && x < W && y > split + 2 && y < H && sinks.every(([sx, sy]) => Math.hypot(x - sx, y - sy) > 2*k);
  g.lineWidth = .9;
  for(let i = 0; i < 90; i++){ g.strokeStyle = U.rgba(c, .35 + r()*.5); line(g, trace(f, r()*W, split + r()*(H - split), 120, 1.6*k, ok)); }
  g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 1.2; g.setLineDash([3, 3]);
  sinks.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 14*k, 0, TAU); g.stroke(); }); g.setLineDash([]);
};
ART.case["C03-13"].ratio = 1.1;
})();
