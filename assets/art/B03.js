/* B03 空間殖民：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = Math.PI*2;

/* ---------------- 共用工具 ---------------- */
// 空間殖民核心（2D／3D 通用，用均勻網格加速最近點查詢）
// o.A 吸引點、o.roots 起始節點 [x,y,z,父索引]、o.seg 步長、o.inf 影響半徑、o.kill 刪除半徑
// o.trop 向性向量、o.ok(x,y,z) 可生長判斷、o.snap(x,y,z) 拉回曲面、o.is3 是否 3D
function grow(o){
  const seg = o.seg, inf = o.inf, kill = o.kill, cell = inf, is3 = !!o.is3, maxN = o.maxN || 4000, iters = o.iters || 140;
  const N = [], P = [], G = [], grid = new Map(), A = o.A.map(a => [a[0], a[1], a[2] || 0]), dead = [];
  const kc = (i,j,k) => ((i + 1000)*10000 + (j + 1000))*10000 + (k + 1000);
  const add = (x,y,z,p,gen) => { const i = N.length; N.push([x,y,z]); P.push(p); G.push(gen);
    const k = kc(Math.floor(x/cell), Math.floor(y/cell), is3 ? Math.floor(z/cell) : 0); let b = grid.get(k); if(!b) grid.set(k, b = []); b.push(i); return i; };
  const near = (x,y,z,rad) => { // 回傳 [最近節點, 距離平方]
    const ci = Math.floor(x/cell), cj = Math.floor(y/cell), ck = is3 ? Math.floor(z/cell) : 0; let best = -1, bd = rad*rad;
    for(let di = -1; di <= 1; di++) for(let dj = -1; dj <= 1; dj++) for(let dk = is3 ? -1 : 0; dk <= (is3 ? 1 : 0); dk++){
      const b = grid.get(kc(ci+di, cj+dj, ck+dk)); if(!b) continue;
      for(const i of b){ const n = N[i], dx = n[0]-x, dy = n[1]-y, dz = n[2]-z, d2 = dx*dx + dy*dy + dz*dz; if(d2 < bd){ bd = d2; best = i; } }
    }
    return [best, bd];
  };
  o.roots.forEach(q => add(q[0], q[1], q[2] || 0, q[3] === undefined ? -1 : q[3], 0));
  const tr = o.trop || [0,0,0];
  let it = 1;
  for(; it <= iters && A.length && N.length < maxN; it++){
    const dir = new Map();
    for(const a of A){ const [b, d2] = near(a[0], a[1], a[2], inf); if(b < 0) continue; const d = Math.sqrt(d2) || 1;
      let e = dir.get(b); if(!e) dir.set(b, e = [0,0,0]); e[0] += (a[0]-N[b][0])/d; e[1] += (a[1]-N[b][1])/d; e[2] += (a[2]-N[b][2])/d; }
    if(!dir.size) break;
    const start = N.length;
    for(const [i, e] of dir){ let l = Math.hypot(e[0], e[1], e[2]) || 1;
      let dx = e[0]/l + tr[0], dy = e[1]/l + tr[1], dz = e[2]/l + tr[2]; l = Math.hypot(dx, dy, dz) || 1;
      let x = N[i][0] + dx/l*seg, y = N[i][1] + dy/l*seg, z = N[i][2] + dz/l*seg;
      if(o.snap){ const s = o.snap(x,y,z); x = s[0]; y = s[1]; z = s[2]; }
      if(o.ok && !o.ok(x,y,z)) continue;
      if(near(x, y, z, seg*.3)[0] >= 0) continue; // 避免在同一位置來回震盪重複加點
      add(x, y, z, i, it);
    }
    if(N.length === start) break;
    for(let k = A.length-1; k >= 0; k--){ const a = A[k]; if(near(a[0], a[1], a[2], kill)[0] >= 0){ dead.push([a[0], a[1], a[2], it]); A.splice(k,1); } }
  }
  // 葉端數（管道模型用）與子節點數
  const lc = new Float32Array(N.length), kids = new Uint16Array(N.length);
  for(let i = N.length-1; i >= 0; i--){ if(lc[i] === 0) lc[i] = 1; if(P[i] >= 0){ lc[P[i]] += lc[i]; kids[P[i]]++; } }
  return {N, P, G, A, dead, lc, kids, it, near};
}
// 在範圍內撒點（2D）
function scatter(r, n, x0, y0, x1, y1, test){
  const out = []; let t = 0;
  while(out.length < n && t++ < n*40){ const x = x0 + r()*(x1-x0), y = y0 + r()*(y1-y0); if(!test || test(x,y)) out.push([x,y,0]); }
  return out;
}
// 在範圍內撒點（3D）
function scatter3(r, n, b, test){
  const out = []; let t = 0;
  while(out.length < n && t++ < n*40){ const x = b[0] + r()*(b[3]-b[0]), y = b[1] + r()*(b[4]-b[1]), z = b[2] + r()*(b[5]-b[2]); if(!test || test(x,y,z)) out.push([x,y,z]); }
  return out;
}
// 直線節點鏈（當樹幹／主脈），base 是這條鏈在節點陣列中的起始索引
function stem(a, b, seg, base, parent){
  const L = Math.hypot(b[0]-a[0], b[1]-a[1], (b[2]||0)-(a[2]||0)), n = Math.max(1, Math.round(L/seg)), out = [];
  for(let i = 0; i <= n; i++){ const t = i/n; out.push([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, (a[2]||0)+((b[2]||0)-(a[2]||0))*t, i ? base+i-1 : (parent === undefined ? -1 : parent)]); }
  return out;
}
// 畫樹：proj 把節點轉成畫面座標；wf(i) 線寬；sf(i) 顏色
function drawTree(g, T, proj, wf, sf){
  g.lineCap = "round"; g.lineJoin = "round";
  for(let i = 0; i < T.N.length; i++){ const p = T.P[i]; if(p < 0) continue;
    const w = wf(i); if(w <= 0) continue;
    const a = proj(T.N[p]), b = proj(T.N[i]); g.lineWidth = w; if(sf) g.strokeStyle = sf(i, a, b);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
}
const id2 = p => p;
// 等角投影：依包圍盒自動縮放置中
function isoFit(W, H, box, pad){
  const q = p => [(p[0]-p[1])*.866, (p[0]+p[1])*.5 - p[2]];
  let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
  for(const x of [box[0],box[3]]) for(const y of [box[1],box[4]]) for(const z of [box[2],box[5]]){ const s = q([x,y,z]); mnx = Math.min(mnx,s[0]); mxx = Math.max(mxx,s[0]); mny = Math.min(mny,s[1]); mxy = Math.max(mxy,s[1]); }
  const k = Math.min(W*(1-2*pad)/(mxx-mnx), H*(1-2*pad)/(mxy-mny)), cx = (mnx+mxx)/2, cy = (mny+mxy)/2;
  return p => { const s = q(p); return [W/2 + (s[0]-cx)*k, H/2 + (s[1]-cy)*k, p[0]+p[1]+p[2]*.8]; };
}
// 透視投影：yaw 水平旋轉、el 俯角、dist 視距、F 焦距、(cx,cy) 畫面中心、tz 目標高度
function persp(yaw, el, dist, F, cx, cy, tz){
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), ce = Math.cos(el), se = Math.sin(el);
  return p => { const x = p[0]*cyw - p[1]*syw, y = p[0]*syw + p[1]*cyw, z = p[2] - tz;
    const Y = z*ce + y*se, D = y*ce - z*se + dist, f = F/D; return [cx + x*f, cy - Y*f, D]; };
}
function box3(g, proj, b){ // 立方體線框
  const v = [[b[0],b[1],b[2]],[b[3],b[1],b[2]],[b[3],b[4],b[2]],[b[0],b[4],b[2]],[b[0],b[1],b[5]],[b[3],b[1],b[5]],[b[3],b[4],b[5]],[b[0],b[4],b[5]]].map(proj);
  [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([a,c]) => { g.beginPath(); g.moveTo(v[a][0],v[a][1]); g.lineTo(v[c][0],v[c][1]); g.stroke(); });
}
function inPoly(x, y, pts){ let o = false; for(let i = 0, j = pts.length-1; i < pts.length; j = i++){ const [xi,yi] = pts[i], [xj,yj] = pts[j]; if((yi > y) !== (yj > y) && x < (xj-xi)*(y-yi)/(yj-yi) + xi) o = !o; } return o; }
// 把枝端接到鄰近別的枝上，形成封閉迴圈（回傳額外線段）
function loops(T, dist, prob, r){
  const out = [];
  for(let i = 0; i < T.N.length; i++){
    if(T.kids[i] !== 0 && !(prob && T.kids[i] === 1 && r() < prob)) continue;
    const anc = new Set(); let a = i; for(let k = 0; k < 10 && a >= 0; k++){ anc.add(a); a = T.P[a]; }
    let best = -1, bd = dist*dist; const n = T.N[i];
    for(let j = 0; j < T.N.length; j++){ if(anc.has(j) || T.P[j] === i) continue; const m = T.N[j], d2 = (m[0]-n[0])**2 + (m[1]-n[1])**2 + (m[2]-n[2])**2; if(d2 < bd){ bd = d2; best = j; } }
    if(best >= 0) out.push([i, best]);
  }
  return out;
}
const AMB = "#F2A007";

/* ---------------- 變形 ---------------- */
ART.var["B03"] = [
  // V01 吸引點改用 Brep 內部取樣：等角視圖中的 L 形建築量體，枝網精準填滿量體
  function(g, W, H, r, c){
    const inA = (x,y,z) => x < 7 && y < 2.4 && z < 5.2, inB = (x,y,z) => x < 2.4 && y < 7 && z < 3.2, inC = (x,y,z) => x > 4.6 && x < 7 && y < 2.4 && z < 8;
    const inside = (x,y,z) => x > 0 && y > 0 && z > 0 && (inA(x,y,z) || inB(x,y,z) || inC(x,y,z));
    const T = grow({A: scatter3(r, 700, [0,0,0,7,7,8], inside), roots: stem([1.2,1.2,0],[1.2,1.2,.8],.25,0), seg:.24, inf:1.4, kill:.34, is3:true, ok:(x,y,z) => inside(x,y,z) || z < 1, maxN:2600});
    const pr = isoFit(W, H, [0,0,0,7,7,8], .08);
    // 地面
    g.fillStyle = "rgba(255,255,255,.04)"; U.poly(g, [[-1,-1,0],[8,-1,0],[8,8,0],[-1,8,0]].map(pr), true); g.fill();
    g.strokeStyle = "rgba(255,255,255,.28)"; g.lineWidth = .8; g.setLineDash([3,3]);
    box3(g, pr, [0,0,0,7,2.4,5.2]); box3(g, pr, [0,0,0,2.4,7,3.2]); box3(g, pr, [4.6,0,0,7,2.4,8]); g.setLineDash([]);
    const idx = T.N.map((_,i) => i).sort((a,b) => T.N[a][0]+T.N[a][1]+T.N[a][2]*.8 - (T.N[b][0]+T.N[b][1]+T.N[b][2]*.8));
    g.lineCap = "round";
    for(const i of idx){ const p = T.P[i]; if(p < 0) continue; const a = pr(T.N[p]), b = pr(T.N[i]), t = Math.min(1, (T.N[i][0]+T.N[i][1]+T.N[i][2]*.5)/12);
      g.strokeStyle = U.rgba(c, .45 + t*.55); g.lineWidth = Math.min(4, .5 + Math.sqrt(T.lc[i])*.28); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,.5)"; T.A.forEach(a => { const p = pr(a); g.fillRect(p[0], p[1], 1.2, 1.2); });
  },
  // V02 多根部同時生長：五個根從邊界搶地盤，各自一色
  function(g, W, H, r, c){
    const nz = U.vnoise((r()*1e9)|0), cx = W/2, cy = H/2, rx = W*.45, ry = H*.45;
    const inside = (x,y) => { const a = Math.atan2(y-cy, x-cx), k = .85 + .15*nz(Math.cos(a)*2+5, Math.sin(a)*2+5); return ((x-cx)/rx)**2 + ((y-cy)/ry)**2 < k*k; };
    const s = Math.min(W,H), roots = [], nR = 5, a0 = r()*TAU;
    for(let k = 0; k < nR; k++){ const a = a0 + k*TAU/nR + (r()-.5)*.5; let x = cx, y = cy; for(let t = 1; t > 0; t -= .01){ x = cx + Math.cos(a)*rx*t; y = cy + Math.sin(a)*ry*t; if(inside(x,y)) break; } roots.push([x,y,0,-1]); }
    const T = grow({A: scatter(r, 1000, 0, 0, W, H, inside), roots, seg:s*.017, inf:s*.11, kill:s*.022, ok:inside});
    const rid = new Int16Array(T.N.length); for(let i = 0; i < T.N.length; i++) rid[i] = i < nR ? i : rid[T.P[i]];
    const pal = [c, AMB, "#7FD1C7", "#E8837A", "#C7B8FF"];
    for(let i = 0; i < T.N.length; i++){ g.fillStyle = U.rgba(pal[rid[i]], .05); g.beginPath(); g.arc(T.N[i][0], T.N[i][1], s*.035, 0, TAU); g.fill(); }
    drawTree(g, T, id2, i => Math.min(4.5, .5 + Math.sqrt(T.lc[i])*.3), i => pal[rid[i]]);
    roots.forEach((q,k) => { g.fillStyle = pal[k]; g.beginPath(); g.arc(q[0], q[1], 3.5, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1; g.stroke(); });
  },
  // V03 向性：三聯畫，向光／下垂／受風，各附方向箭頭
  function(g, W, H, r, c){
    const pw = W/3, trops = [[0,-.55],[0,.8],[.75,.05]];
    for(let k = 0; k < 3; k++){
      const x0 = k*pw, cx = x0 + pw/2, gy = H*.9, s = pw, tv = trops[k];
      let test;
      if(k === 0) test = (x,y) => ((x-cx)/(pw*.3))**2 + ((y-H*.36)/(H*.26))**2 < 1;
      else if(k === 1) test = (x,y) => (((x-cx)/(pw*.44))**2 + ((y-H*.42)/(H*.16))**2 < 1 && y < H*.46) || (Math.abs(x-cx) > pw*.1 && Math.abs(x-cx) < pw*.46 && y > H*.36 && y < H*.36 + H*.42*(1 - Math.abs(x-cx)/(pw*.8)));
      else test = (x,y) => ((x-cx-pw*.08)/(pw*.4))**2 + ((y-H*.45)/(H*.2))**2 < 1;
      const top = k === 1 ? H*.42 : k === 0 ? H*.55 : H*.58;
      const T = grow({A: scatter(r, 260, x0, 0, x0+pw, H, test), roots: stem([cx, gy], [cx, top], s*.04, 0), seg:s*.04, inf:s*.3, kill:s*.05, trop:[tv[0], tv[1], 0], ok:(x,y) => x > x0+2 && x < x0+pw-2 && y < gy && y > 2, iters:90});
      g.strokeStyle = c; drawTree(g, T, id2, i => Math.min(4, .5 + Math.sqrt(T.lc[i])*.3));
      g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x0+4, gy); g.lineTo(x0+pw-4, gy); g.stroke();
      if(k){ g.strokeStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.moveTo(x0, H*.05); g.lineTo(x0, H*.95); g.stroke(); }
      // 箭頭
      const ax = x0 + pw*.18, ay = H*.1, l = Math.hypot(tv[0], tv[1]), ux = tv[0]/l, uy = tv[1]/l, L = pw*.12;
      g.strokeStyle = AMB; g.fillStyle = AMB; g.lineWidth = 1.6; g.beginPath(); g.moveTo(ax - ux*L/2, ay - uy*L/2); g.lineTo(ax + ux*L/2, ay + uy*L/2); g.stroke();
      const hx = ax + ux*L/2, hy = ay + uy*L/2; g.beginPath(); g.moveTo(hx + ux*4, hy + uy*4); g.lineTo(hx - uy*3.5, hy + ux*3.5); g.lineTo(hx + uy*3.5, hy - ux*3.5); g.closePath(); g.fill();
    }
  },
  // V04 管道模型：依葉端數倒推枝粗，畫成放在 3D 列印平台上的實心分枝
  function(g, W, H, r, c){
    const inC = (x,y,z) => (x/3.2)**2 + (y/3.2)**2 + ((z-6)/2.6)**2 < 1;
    const T = grow({A: scatter3(r, 260, [-3.2,-3.2,3.4,3.2,3.2,8.6], inC), roots: stem([0,0,0],[0,0,3.4],.3,0), seg:.3, inf:2.4, kill:.5, is3:true, maxN:1400});
    const pr = isoFit(W, H, [-3.8,-3.8,-.4,3.8,3.8,8.8], .05);
    // 列印平台
    const bed = [[-4.5,-4.5,0],[4.5,-4.5,0],[4.5,4.5,0],[-4.5,4.5,0]].map(pr);
    g.fillStyle = "rgba(255,255,255,.05)"; U.poly(g, bed, true); g.fill();
    const side = [[4.5,-4.5,0],[4.5,4.5,0],[4.5,4.5,-.4],[4.5,-4.5,-.4]].map(pr), side2 = [[-4.5,4.5,0],[4.5,4.5,0],[4.5,4.5,-.4],[-4.5,4.5,-.4]].map(pr);
    g.fillStyle = "rgba(255,255,255,.09)"; U.poly(g, side, true); g.fill(); g.fillStyle = "rgba(255,255,255,.06)"; U.poly(g, side2, true); g.fill();
    g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = .7;
    for(let k = -4; k <= 4; k++){ let a = pr([k,-4.5,0]), b = pr([k,4.5,0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); a = pr([-4.5,k,0]); b = pr([4.5,k,0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
    const s = Math.min(W,H)/140, rad = i => s*(.35 + Math.pow(T.lc[i], 1/2.5)*.5);
    // 底座圓盤
    const bc = pr([0,0,0]); g.fillStyle = U.rgba(c,.35); g.beginPath(); g.ellipse(bc[0], bc[1], rad(0)*2.4, rad(0)*1.2, 0, 0, TAU); g.fill();
    const idx = T.N.map((_,i) => i).filter(i => T.P[i] >= 0).sort((a,b) => pr(T.N[a])[2] - pr(T.N[b])[2]);
    g.lineCap = "round";
    // 三層：暗色外輪廓 → 主色管身 → 左上高光，讓管件連續
    const pass = (col, wfn, off) => { g.strokeStyle = col; for(const i of idx){ const a = pr(T.N[T.P[i]]), b = pr(T.N[i]), R = rad(i), o = off ? R*.35 : 0; g.lineWidth = wfn(R); g.beginPath(); g.moveTo(a[0]-o, a[1]-o); g.lineTo(b[0]-o, b[1]-o); g.stroke(); } };
    pass("#0E0E13", R => R*2 + 1.8, false); pass(c, R => R*2, false); pass("rgba(255,255,255,.3)", R => Math.max(.5, R*.5), true);
  },
  // V05 空間索引加速：數千個吸引點的細密葉脈，疊上均勻網格與查詢範圍
  function(g, W, H, r, c){
    const s = Math.min(W,H), inf = s*.06, roots = [];
    for(let k = 0; k < 3; k++){ roots.push([W*(.2 + .3*k + (r()-.5)*.08), H - 1, 0, -1]); }
    const T = grow({A: scatter(r, 2400, 0, 0, W, H), roots, seg:s*.014, inf, kill:s*.016, maxN:5200, iters:200});
    g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = .6;
    for(let x = 0; x < W; x += inf){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); }
    for(let y = 0; y < H; y += inf){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
    // 幾個枝端的 3×3 查詢格
    const tips = []; for(let i = 0; i < T.N.length; i++) if(T.kids[i] === 0) tips.push(i);
    for(let k = 0; k < 3 && tips.length; k++){ const n = T.N[tips[(r()*tips.length)|0]], i0 = Math.floor(n[0]/inf) - 1, j0 = Math.floor(n[1]/inf) - 1;
      g.fillStyle = U.rgba(AMB, .1); g.fillRect(i0*inf, j0*inf, inf*3, inf*3); g.strokeStyle = U.rgba(AMB, .7); g.lineWidth = 1; g.strokeRect(i0*inf, j0*inf, inf*3, inf*3); g.strokeRect((i0+1)*inf, (j0+1)*inf, inf, inf); }
    g.strokeStyle = c; drawTree(g, T, id2, i => Math.min(3.2, .35 + Math.sqrt(T.lc[i])*.16));
    g.fillStyle = "rgba(255,255,255,.4)"; T.A.forEach(a => g.fillRect(a[0], a[1], 1, 1));
  },
  // V06 封閉式葉脈：放大鏡下的網狀葉脈，枝端互連成迴圈
  function(g, W, H, r, c){
    const s = Math.min(W,H), cx = W/2, cy = H/2, R = s*.44, inC = (x,y) => (x-cx)**2 + (y-cy)**2 < R*R;
    const mid = stem([cx - R, cy + R*.1], [cx + R, cy - R*.1], s*.02, 0);
    const T = grow({A: scatter(r, 1100, cx-R, cy-R, cx+R, cy+R, inC), roots: mid, seg:s*.016, inf:s*.09, kill:s*.02, ok:inC});
    const L = loops(T, s*.05, .25, r);
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
    g.fillStyle = U.rgba(c, .07); g.fillRect(0, 0, W, H);
    g.strokeStyle = U.rgba(c, .9); drawTree(g, T, id2, i => i < mid.length ? 3.2 : Math.min(2.4, .5 + Math.sqrt(T.lc[i])*.22));
    g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = .8;
    L.forEach(([a,b]) => { g.beginPath(); g.moveTo(T.N[a][0], T.N[a][1]); g.lineTo(T.N[b][0], T.N[b][1]); g.stroke(); });
    g.restore();
    // 鏡框
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R + 1.5, 0, TAU); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R + 5, Math.PI*1.1, Math.PI*1.6); g.stroke();
    g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.ellipse(cx - R*.45, cy - R*.5, R*.22, R*.1, -.6, 0, TAU); g.fill();
  },
  // V07 生長在曲面上：在圓盤 UV 上長，再映射到圓頂（透視，前後深淺）
  function(g, W, H, r, c){
    const R0 = 100, inD = (x,y) => x*x + y*y < R0*R0*.98, roots = [];
    for(let k = 0; k < 7; k++){ const a = k*TAU/7 + .2; roots.push([Math.cos(a)*R0*.97, Math.sin(a)*R0*.97, 0, -1]); }
    const T = grow({A: scatter(r, 900, -R0, -R0, R0, R0, inD), roots, seg:3, inf:17, kill:3.6, ok:inD, maxN:3000});
    const Rd = 3, map = p => { const rho = Math.min(1, Math.hypot(p[0], p[1])/R0), ph = Math.atan2(p[1], p[0]), th = rho*Math.PI/2; return [Rd*Math.sin(th)*Math.cos(ph), Rd*Math.sin(th)*Math.sin(ph), Rd*Math.cos(th)]; };
    const pj = persp(.4, .42, 10, Math.min(W,H)*1.45, W/2, H*.6, 1.2), P3 = p => pj(map(p)), Dc = pj([0,0,Rd*.5])[2];
    // 地面陰影與基座環
    const base = []; for(let k = 0; k <= 48; k++){ const a = k/48*TAU; base.push(pj([Math.cos(a)*Rd, Math.sin(a)*Rd, 0])); }
    g.fillStyle = "rgba(0,0,0,.35)"; U.poly(g, base, true); g.fill();
    // 圓頂經緯線
    g.lineWidth = .6;
    for(let m = 0; m < 12; m++){ const ph = m/12*TAU; g.beginPath(); for(let k = 0; k <= 16; k++){ const th = k/16*Math.PI/2, q = pj([Rd*Math.sin(th)*Math.cos(ph), Rd*Math.sin(th)*Math.sin(ph), Rd*Math.cos(th)]); k ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } g.strokeStyle = "rgba(255,255,255,.1)"; g.stroke(); }
    for(let l = 1; l <= 4; l++){ const th = l/4*Math.PI/2; g.beginPath(); for(let k = 0; k <= 48; k++){ const ph = k/48*TAU, q = pj([Rd*Math.sin(th)*Math.cos(ph), Rd*Math.sin(th)*Math.sin(ph), Rd*Math.cos(th)]); k ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } g.strokeStyle = "rgba(255,255,255,.1)"; g.stroke(); }
    const order = T.N.map((_,i) => i).filter(i => T.P[i] >= 0).sort((a,b) => P3(T.N[b])[2] - P3(T.N[a])[2]);
    g.lineCap = "round";
    for(const i of order){ const a = P3(T.N[T.P[i]]), b = P3(T.N[i]), front = b[2] < Dc;
      g.strokeStyle = front ? c : U.rgba(c, .22); g.lineWidth = (front ? 1 : .6)*Math.min(3.4, .5 + Math.sqrt(T.lc[i])*.2); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
    g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1.2; U.poly(g, base, true); g.stroke();
  },
  // V08 影像控制密度：以灰階人像當底，亮處吸引點多、枝網密
  function(g, W, H, r, c){
    const nz = U.vnoise((r()*1e9)|0), s = Math.min(W,H), sm = (e,t) => Math.max(0, Math.min(1, (e - t)/(s*.05) + .5));
    const b = (x,y) => { const head = 1 - sm(Math.hypot(x - W*.5, (y - H*.36)/1.2), s*.21), sh = 1 - sm(Math.hypot((x - W*.5)/2.1, (y - H*1.02)/1.05), s*.3);
      return Math.max(0, Math.min(1, Math.max(head, sh)*.8 + (nz(x/W*5, y/H*5) - .5)*.3 + .2)); };
    const fm = Math.round(60*H/W);
    U.field(g, W, H, 60, fm, (i,j) => b(i/60*W, j/fm*H)*.32, "#9A9AA8");
    const A = []; let t = 0; while(A.length < 1300 && t++ < 20000){ const x = r()*W, y = r()*H; if(r() < b(x,y)**1.6) A.push([x,y,0]); }
    const T = grow({A, roots: [[W*.5, H-1, 0, -1], [W*.08, H-1, 0, -1], [W*.92, H-1, 0, -1]], seg:s*.014, inf:s*.09, kill:s*.017, maxN:4000, iters:180});
    g.strokeStyle = "rgba(255,255,255,.88)"; drawTree(g, T, id2, i => Math.min(2.6, .4 + Math.sqrt(T.lc[i])*.13));
    g.strokeStyle = U.rgba(c, .9); drawTree(g, T, id2, i => T.lc[i] > 20 ? 1.2 : 0);
  },
  // V09 障礙物與邊界：立面上的藤蔓繞開窗洞
  function(g, W, H, r, c){
    const fx0 = W*.07, fx1 = W*.93, fy0 = H*.08, gy = H*.93, floors = 5, cols = 3, fh = (gy - fy0)/floors, cw = (fx1 - fx0)/cols, win = [], s = Math.min(W,H);
    for(let f = 0; f < floors; f++) for(let k = 0; k < cols; k++){ if(r() < .12) continue; const w = cw*(.42 + r()*.12), h = fh*.5; win.push([fx0 + k*cw + (cw-w)/2, fy0 + f*fh + fh*.22, w, h]); }
    const m = s*.012, ok = (x,y) => x > fx0 && x < fx1 && y > fy0 && y < gy && !win.some(q => x > q[0]-m && x < q[0]+q[2]+m && y > q[1]-m && y < q[1]+q[3]+m);
    g.fillStyle = "rgba(255,255,255,.035)"; g.fillRect(fx0, fy0, fx1-fx0, gy-fy0);
    g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = .8; for(let f = 1; f < floors; f++){ g.beginPath(); g.moveTo(fx0, fy0 + f*fh); g.lineTo(fx1, fy0 + f*fh); g.stroke(); }
    g.strokeStyle = "rgba(255,255,255,.3)"; g.strokeRect(fx0, fy0, fx1-fx0, gy-fy0);
    win.forEach(q => { g.fillStyle = "#0B0B10"; g.fillRect(q[0], q[1], q[2], q[3]); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(q[0], q[1], q[2], q[3]); g.beginPath(); g.moveTo(q[0]+q[2]/2, q[1]); g.lineTo(q[0]+q[2]/2, q[1]+q[3]); g.stroke(); });
    const roots = []; for(let k = 0; k <= cols; k += 1.5) roots.push([Math.min(fx1 - 2, fx0 + k*cw + 2), gy - 1, 0, -1]);
    const T = grow({A: scatter(r, 1000, fx0, fy0, fx1, gy, ok), roots, seg:s*.017, inf:s*.1, kill:s*.022, ok, iters:160});
    g.strokeStyle = c; drawTree(g, T, id2, i => Math.min(4, .5 + Math.sqrt(T.lc[i])*.25));
    g.fillStyle = U.rgba(c, .75); for(let i = 0; i < T.N.length; i++) if(T.kids[i] === 0 && r() < .6){ const n = T.N[i]; g.beginPath(); g.ellipse(n[0], n[1], 2.4, 1.3, r()*TAU, 0, TAU); g.fill(); }
    g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();
  },
  // V10 反向生長：剖面上的樹狀柱，從柱腳分叉撐住屋頂支撐點
  function(g, W, H, r, c){
    const s = Math.min(W,H), ry = H*.16, th = H*.04, rb = ry + th, gy = H*.88, sup = [], A = [];
    for(let k = 0; k < 12; k++){ const x = W*(.06 + .88*k/11); sup.push([x, rb + 1, 0]); A.push([x, rb + 1, 0]); }
    A.push(...scatter(r, 140, W*.05, rb + 2, W*.95, rb + H*.28));
    const roots = []; [W*.3, W*.7].forEach(x => roots.push(...stem([x, gy], [x, gy - H*.18], s*.025, roots.length)));
    const T = grow({A, roots, seg:s*.022, inf:s*.8, kill:s*.03, ok:(x,y) => y > rb - 1, iters:160});
    // 屋頂板與地面
    g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(W*.02, ry, W*.96, th);
    g.save(); g.beginPath(); g.rect(W*.02, ry, W*.96, th); g.clip(); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .7; for(let x = 0; x < W + th; x += 5){ g.beginPath(); g.moveTo(x, ry); g.lineTo(x - th, ry + th); g.stroke(); } g.restore();
    g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.2; g.strokeRect(W*.02, ry, W*.96, th);
    g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();
    g.save(); g.beginPath(); g.rect(0, gy, W, H - gy); g.clip(); g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = .7; for(let x = -H; x < W; x += 6){ g.beginPath(); g.moveTo(x, gy); g.lineTo(x + 12, gy + 12); g.stroke(); } g.restore();
    g.strokeStyle = c; drawTree(g, T, id2, i => Math.min(s*.05, 1 + Math.pow(T.lc[i], 1/2.3)*1.1));
    g.fillStyle = AMB; sup.forEach(p => { g.beginPath(); g.moveTo(p[0], rb); g.lineTo(p[0]-3, rb+4); g.lineTo(p[0]+3, rb+4); g.closePath(); g.fill(); });
    // 比例人
    const px = W*.5, ph = H*.11; g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.arc(px, gy - ph, ph*.1, 0, TAU); g.fill(); g.fillRect(px - ph*.08, gy - ph*.88, ph*.16, ph*.88);
  },
  // V11 Timer 動畫：同一棵樹的四個時間切片，吸引點逐步消失
  function(g, W, H, r, c){
    const gap = W*.04, fw = (W - gap*3)/2, fh = (H - gap*3)/2, s = Math.min(fw, fh);
    const test = (x,y) => ((x - fw/2)/(fw*.42))**2 + ((y - fh*.4)/(fh*.32))**2 < 1;
    const T = grow({A: scatter(r, 300, 0, 0, fw, fh, test), roots: stem([fw/2, fh*.95], [fw/2, fh*.66], s*.03, 0), seg:s*.03, inf:s*.25, kill:s*.05, iters:120});
    const maxIt = Math.max(1, ...T.G);
    for(let f = 0; f < 4; f++){
      const ox = gap + (f%2)*(fw + gap), oy = gap + ((f/2)|0)*(fh + gap), lim = maxIt*[.2,.45,.7,1][f];
      g.save(); g.translate(ox, oy);
      g.fillStyle = "rgba(255,255,255,.035)"; g.fillRect(0, 0, fw, fh); g.strokeStyle = f === 3 ? U.rgba(c,.8) : "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(0, 0, fw, fh);
      g.beginPath(); g.rect(0, 0, fw, fh); g.clip();
      g.fillStyle = "rgba(255,255,255,.55)"; T.A.forEach(a => g.fillRect(a[0], a[1], 1.3, 1.3)); T.dead.forEach(a => { if(a[3] > lim) g.fillRect(a[0], a[1], 1.3, 1.3); });
      g.strokeStyle = c; g.lineCap = "round";
      for(let i = 0; i < T.N.length; i++){ const p = T.P[i]; if(p < 0 || T.G[i] > lim) continue; g.lineWidth = Math.min(3, .5 + Math.sqrt(T.lc[i])*.2); g.beginPath(); g.moveTo(T.N[p][0], T.N[p][1]); g.lineTo(T.N[i][0], T.N[i][1]); g.stroke(); }
      // 進度條
      g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(4, fh - 5, fw - 8, 2); g.fillStyle = AMB; g.fillRect(4, fh - 5, (fw - 8)*lim/maxIt, 2);
      g.restore();
    }
  },
  // V12 與其他家族混合：吸引點取自葉序螺旋（黃金角）
  function(g, W, H, r, c){
    const s = Math.min(W,H), cx = W/2, cy = H/2, n = 700, k = s*.46/Math.sqrt(n), ang = 137.508*Math.PI/180, A = [];
    for(let i = 1; i <= n; i++){ const a = i*ang, rr = k*Math.sqrt(i); A.push([cx + rr*Math.cos(a), cy + rr*Math.sin(a), 0]); }
    const T = grow({A, roots: [[cx, cy, 0, -1]], seg:s*.016, inf:s*.08, kill:s*.02, iters:120});
    const alive = new Set(T.A.map(a => a[0]*7 + a[1]));
    A.forEach((a,i) => { const t = i/n; g.fillStyle = alive.has(a[0]*7 + a[1]) ? AMB : U.rgba(AMB, .22); g.beginPath(); g.arc(a[0], a[1], .8 + t*1.8, 0, TAU); g.fill(); });
    g.strokeStyle = c; drawTree(g, T, id2, i => Math.min(4, .5 + Math.sqrt(T.lc[i])*.25));
  },
];
[[0,1.1],[2,.78],[3,1.15],[5,1],[6,.85],[7,1.25],[8,1.3],[9,.8],[10,1],[11,1]].forEach(([i,v]) => ART.var["B03"][i].ratio = v);

/* ---------------- 沒有照片的案例 ---------------- */
// 01 葉脈論文：葉片輪廓內的生長素點與開放式葉脈
ART.case["B03-01"] = function(g, W, H, r, c){
  const cx = W/2, top = H*.06, bot = H*.8, L = bot - top, hw = W*.42, s = Math.min(W,H);
  const half = y => { const t = (bot - y)/L; return t < 0 || t > 1 ? 0 : hw*Math.pow(Math.sin(Math.PI*Math.pow(t, .85)), .9)*(1 - t*.15); };
  const inside = (x,y) => Math.abs(x - cx) < half(y) - 1;
  const outline = []; for(let k = 0; k <= 60; k++){ const y = bot - L*k/60; outline.push([cx + half(y), y]); } for(let k = 60; k >= 0; k--){ const y = bot - L*k/60; outline.push([cx - half(y), y]); }
  g.fillStyle = U.rgba(c, .1); U.poly(g, outline, true); g.fill();
  const T = grow({A: scatter(r, 900, 0, top, W, bot, inside), roots: stem([cx, H*.96], [cx, bot - s*.02], s*.02, 0), seg:s*.016, inf:s*.1, kill:s*.02, ok:(x,y) => inside(x,y) || y > bot - 2, maxN:3000});
  g.strokeStyle = c; drawTree(g, T, id2, i => Math.min(5, .45 + Math.sqrt(T.lc[i])*.22));
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.2; U.poly(g, outline, true); g.stroke();
  g.fillStyle = "rgba(255,255,255,.75)"; T.A.forEach(a => { g.beginPath(); g.arc(a[0], a[1], 1.1, 0, TAU); g.fill(); });
};
ART.case["B03-01"].ratio = 1.3;

// 02 以空間殖民建模樹木：透視中的橢球樹冠包絡與地面網格
ART.case["B03-02"] = function(g, W, H, r, c){
  const inE = (x,y,z) => (x/3.4)**2 + (y/3.4)**2 + ((z-6.4)/3)**2 < 1;
  const T = grow({A: scatter3(r, 520, [-3.4,-3.4,3.4,3.4,3.4,9.4], inE), roots: stem([0,0,0],[0,0,3.6],.28,0), seg:.28, inf:2.2, kill:.45, is3:true, maxN:2400});
  const pj = persp(.6, .32, 17, Math.min(W,H)*1.9, W/2, H*.55, 4.7);
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = .7;
  for(let k = -6; k <= 6; k++){ let a = pj([k,-6,0]), b = pj([k,6,0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); a = pj([-6,k,0]); b = pj([6,k,0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
  // 樹冠包絡線框
  g.strokeStyle = "rgba(255,255,255,.18)"; g.setLineDash([2,3]);
  for(let m = 0; m < 6; m++){ const ph = m/6*Math.PI; g.beginPath(); for(let k = 0; k <= 40; k++){ const t = k/40*TAU, q = pj([3.4*Math.sin(t)*Math.cos(ph), 3.4*Math.sin(t)*Math.sin(ph), 6.4 + 3*Math.cos(t)]); k ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } g.stroke(); }
  for(const z of [4.2, 6.4, 8.6]){ const rr = 3.4*Math.sqrt(Math.max(0, 1 - ((z-6.4)/3)**2)); g.beginPath(); for(let k = 0; k <= 40; k++){ const t = k/40*TAU, q = pj([rr*Math.cos(t), rr*Math.sin(t), z]); k ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } g.stroke(); }
  g.setLineDash([]);
  const sh = pj([0,0,0]); g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(sh[0], sh[1], W*.22, H*.03, 0, 0, TAU); g.fill();
  const idx = T.N.map((_,i) => i).filter(i => T.P[i] >= 0).sort((a,b) => pj(T.N[b])[2] - pj(T.N[a])[2]);
  g.lineCap = "round";
  for(const i of idx){ const a = pj(T.N[T.P[i]]), b = pj(T.N[i]), t = Math.max(0, Math.min(1, (18 - b[2])/5));
    g.strokeStyle = U.rgba(c, .3 + t*.7); g.lineWidth = Math.min(6, .5 + Math.pow(T.lc[i], .45)*.35); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
};
ART.case["B03-02"].ratio = 1.2;

// 03 Hyphae 燈具：吊燈球殼上的分枝，中央發光並把枝影投到周圍
ART.case["B03-03"] = function(g, W, H, r, c){
  const R = 3, snap = (x,y,z) => { const l = Math.hypot(x,y,z) || 1; return [x/l*R, y/l*R, z/l*R]; };
  const A = []; while(A.length < 520){ const u = r()*2 - 1, a = r()*TAU, q = Math.sqrt(1 - u*u); if(u < .72) A.push([q*Math.cos(a)*R, q*Math.sin(a)*R, u*R]); }
  const roots = []; for(let k = 0; k < 6; k++){ const a = k/6*TAU, u = .8, q = Math.sqrt(1 - u*u); roots.push([q*Math.cos(a)*R, q*Math.sin(a)*R, u*R, -1]); }
  const T = grow({A, roots, seg:.17, inf:1.5, kill:.24, is3:true, snap, maxN:2600});
  const cx = W/2, cy = H*.55, pj = persp(.3, -.12, 11, Math.min(W,H)*1.35, cx, cy, 0);
  // 光暈
  const gl = g.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W,H)*.6); gl.addColorStop(0, "rgba(255,226,170,.55)"); gl.addColorStop(.25, "rgba(255,200,120,.16)"); gl.addColorStop(1, "rgba(255,200,120,0)");
  g.fillStyle = gl; g.fillRect(0, 0, W, H);
  // 投影到周圍的枝影
  g.strokeStyle = "rgba(255,220,160,.07)"; g.lineWidth = 2;
  for(let i = 0; i < T.N.length; i++){ const p = T.P[i]; if(p < 0) continue; const a = pj(T.N[p]), b = pj(T.N[i]), k = 2.1;
    g.beginPath(); g.moveTo(cx + (a[0]-cx)*k, cy + (a[1]-cy)*k); g.lineTo(cx + (b[0]-cx)*k, cy + (b[1]-cy)*k); g.stroke(); }
  // 吊線
  const tp = pj([0,0,R]); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(tp[0], 0); g.lineTo(tp[0], tp[1]); g.stroke();
  g.fillStyle = "rgba(255,255,255,.6)"; g.fillRect(tp[0]-4, tp[1]-6, 8, 6);
  const Dc = pj([0,0,0])[2], idx = T.N.map((_,i) => i).filter(i => T.P[i] >= 0).sort((a,b) => pj(T.N[b])[2] - pj(T.N[a])[2]);
  g.lineCap = "round";
  for(const i of idx){ const a = pj(T.N[T.P[i]]), b = pj(T.N[i]), front = b[2] < Dc, w = Math.min(5, .8 + Math.pow(T.lc[i], 1/2.5)*.7);
    g.strokeStyle = front ? "#F4E6D0" : U.rgba(c, .45); g.lineWidth = front ? w : w*.7; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
};
ART.case["B03-03"].ratio = 1.25;

// 04 Xylem + Hyphae 草圖：3×3 不同邊界與根部配置的小實驗
ART.case["B03-04"] = function(g, W, H, r, c){
  const n = 3, cw = W/n, ch = H/n;
  const shapes = [
    [(x,y) => x*x + y*y < .9, [[0,.92]]],
    [(x,y) => Math.abs(x) < .88 && Math.abs(y) < .88, [[-.86,-.86],[.86,.86]]],
    [(x,y) => y < .82 && y > -.9 + Math.abs(x)*1.9, [[0,.8]]],
    [(x,y) => { const d = Math.hypot(x,y); return d > .45 && d < .92; }, [[0,.9],[0,-.9]]],
    [(x,y) => { const a = Math.atan2(y,x), d = Math.hypot(x,y); return d < .5 + .38*Math.cos(5*a); }, [[0,0]]],
    [(x,y) => x*x + y*y < .85 && (x-.45)**2 + (y+.2)**2 > .45, [[-.85,.1]]],
    [(x,y) => { const a = Math.abs(x), b = Math.abs(y); return b < .86 && a*.866 + b*.5 < .8; }, [[0,0],[.6,0],[-.6,0]]],
    [(x,y) => y < .4 && x*x + (y-.4)**2 < .85, [[-.6,.38],[0,.38],[.6,.38]]],
    [(x,y) => (x/.9)**2 + (y/.55)**2 < 1, [[-.88,0],[.88,0]]],
  ];
  for(let i = shapes.length - 1; i > 0; i--){ const j = (r()*(i+1))|0; [shapes[i], shapes[j]] = [shapes[j], shapes[i]]; }
  shapes.forEach(([test, rts], k) => {
    const ox = (k%n)*cw, oy = ((k/n)|0)*ch, sc = Math.min(cw, ch)*.44, cx = ox + cw/2, cy = oy + ch/2;
    const tw = (x,y) => test((x-cx)/sc, (y-cy)/sc);
    const T = grow({A: scatter(r, 190, cx-sc, cy-sc, cx+sc, cy+sc, tw), roots: rts.map(q => [cx + q[0]*sc, cy + q[1]*sc, 0, -1]), seg:sc*.06, inf:sc*.45, kill:sc*.08, ok:(x,y) => tw(x,y) || Math.hypot(x - cx, y - cy) < 2, iters:70});
    // 邊界輪廓（marching squares）
    const m = 34, f = q => [cx - sc*1.05 + q[0]/(m-1)*sc*2.1, cy - sc*1.05 + q[1]/(m-1)*sc*2.1];
    const seg = U.contour(m, m, (i,j) => tw(...f([i,j])) ? 1 : 0, .5);
    g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = .7;
    seg.forEach(([a,b]) => { const p = f(a), q2 = f(b); g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q2[0],q2[1]); g.stroke(); });
    g.strokeStyle = c; drawTree(g, T, id2, i => Math.min(2.6, .4 + Math.sqrt(T.lc[i])*.18));
    g.fillStyle = AMB; rts.forEach(q => { g.beginPath(); g.arc(cx + q[0]*sc, cy + q[1]*sc, 1.8, 0, TAU); g.fill(); });
    g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1; g.strokeRect(ox + 2, oy + 2, cw - 4, ch - 4);
  });
};
ART.case["B03-04"].ratio = 1;

// 05 2D 瀏覽器實驗：視窗框內的不規則邊界、圓形障礙與階層線寬
ART.case["B03-05"] = function(g, W, H, r, c){
  const bar = H*.075, s = Math.min(W,H);
  g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(0, 0, W, bar);
  ["#E8837A", AMB, "#7FD1C7"].forEach((col,k) => { g.fillStyle = col; g.beginPath(); g.arc(bar*.6 + k*bar*.55, bar/2, bar*.17, 0, TAU); g.fill(); });
  g.fillStyle = "rgba(255,255,255,.1)"; g.fillRect(W*.3, bar*.28, W*.5, bar*.44);
  const cx = W/2, cy = bar + (H - bar)*.5, poly = [], nP = 9;
  for(let k = 0; k < nP; k++){ const a = -Math.PI/2 + k*TAU/nP, rr = (k%2 ? .62 : .95)*(.9 + r()*.12); poly.push([cx + Math.cos(a)*W*.45*rr, cy + Math.sin(a)*(H - bar)*.45*rr]); }
  const obs = []; for(let k = 0; k < 4; k++){ const a = r()*TAU, d = r()*.35; obs.push([cx + Math.cos(a)*W*d, cy + Math.sin(a)*(H-bar)*d*.8 - H*.05, s*(.05 + r()*.05)]); }
  const ok = (x,y) => inPoly(x, y, poly) && !obs.some(o => Math.hypot(x-o[0], y-o[1]) < o[2]);
  const root = [cx, cy + (H-bar)*.3];
  const T = grow({A: scatter(r, 900, 0, bar, W, H, ok), roots: [[root[0], root[1], 0, -1]], seg:s*.017, inf:s*.14, kill:s*.022, ok:(x,y) => ok(x,y) || Math.hypot(x-root[0], y-root[1]) < s*.08, iters:160});
  g.fillStyle = "rgba(255,255,255,.03)"; U.poly(g, poly, true); g.fill();
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.setLineDash([4,3]); U.poly(g, poly, true); g.stroke(); g.setLineDash([]);
  obs.forEach(o => { g.fillStyle = "rgba(255,255,255,.1)"; g.beginPath(); g.arc(o[0], o[1], o[2], 0, TAU); g.fill(); g.strokeStyle = "rgba(255,255,255,.35)"; g.stroke(); });
  g.strokeStyle = c; drawTree(g, T, id2, i => Math.min(6, .5 + Math.pow(T.lc[i], .5)*.35));
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(.5, .5, W-1, H-1);
};
ART.case["B03-05"].ratio = .95;

// 06 Coding Train：左側程式碼編輯器、右側 p5 畫布上的矩形葉區
ART.case["B03-06"] = function(g, W, H, r, c){
  const ew = W*.34, s = Math.min(W - ew, H);
  g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(0, 0, ew, H);
  for(let y = H*.05, k = 0; y < H*.95; y += H*.035, k++){ const ind = [0,1,1,2,2,1,0,0,1,2,3,2,1][k%13]; if(k%7 === 6) continue;
    g.fillStyle = k%5 === 2 ? U.rgba(c,.55) : k%3 ? "rgba(255,255,255,.22)" : U.rgba(AMB,.5); g.fillRect(ew*.1 + ind*ew*.08, y, ew*(.2 + r()*.5)*(1 - ind*.15), H*.012); }
  const x0 = ew + W*.03, x1 = W - W*.03, y0 = H*.05, y1 = H*.95;
  g.fillStyle = "#08080B"; g.fillRect(x0, y0, x1-x0, y1-y0);
  const lx0 = x0 + (x1-x0)*.08, lx1 = x1 - (x1-x0)*.08, ly0 = y0 + (y1-y0)*.05, ly1 = y0 + (y1-y0)*.55;
  const T = grow({A: scatter(r, 320, lx0, ly0, lx1, ly1), roots: stem([(x0+x1)/2, y1], [(x0+x1)/2, ly1 + (y1-y0)*.05], s*.03, 0), seg:s*.022, inf:s*.35, kill:s*.035, iters:120});
  g.strokeStyle = "rgba(255,255,255,.2)"; g.setLineDash([3,3]); g.lineWidth = .8; g.strokeRect(lx0, ly0, lx1-lx0, ly1-ly0); g.setLineDash([]);
  g.strokeStyle = "#fff"; drawTree(g, T, id2, () => 1);
  g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1; T.A.forEach(a => { g.beginPath(); g.arc(a[0], a[1], 2.2, 0, TAU); g.stroke(); });
  g.fillStyle = U.rgba(c,.8); for(let i = 0; i < T.N.length; i++) if(T.kids[i] === 0){ g.beginPath(); g.arc(T.N[i][0], T.N[i][1], 1.4, 0, TAU); g.fill(); }
};
ART.case["B03-06"].ratio = .8;

// 07 道路網：海岸線、人口城市當吸引點，道路依流量分級
ART.case["B03-07"] = function(g, W, H, r, c){
  const nz = U.vnoise((r()*1e9)|0), s = Math.min(W,H), land = (x,y) => nz(x/W*3, y/H*3)*.55 + x/W*.75 > .52;
  const n = 64, m = Math.round(n*H/W), cs = W/n;
  g.fillStyle = U.rgba("#5B8FD9", .12);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++) if(!land((i+.5)*cs, (j+.5)*cs)) g.fillRect(i*cs, j*cs, cs+.5, cs+.5);
  const seg = U.contour(n+1, m+1, (i,j) => nz(i*cs/W*3, j*cs/H*3)*.55 + i*cs/W*.75, .52);
  g.strokeStyle = "rgba(160,190,240,.45)"; g.lineWidth = 1; seg.forEach(([a,b]) => { g.beginPath(); g.moveTo(a[0]*cs, a[1]*cs); g.lineTo(b[0]*cs, b[1]*cs); g.stroke(); });
  const cities = []; let t = 0; while(cities.length < 7 && t++ < 500){ const x = W*.08 + r()*W*.84, y = H*.08 + r()*H*.84; if(land(x,y) && cities.every(q => Math.hypot(q[0]-x, q[1]-y) > s*.2)) cities.push([x, y, .3 + r()]); }
  if(!cities.length) cities.push([W*.8, H*.5, 1]);
  cities.sort((a,b) => b[2] - a[2]);
  const A = [];
  cities.forEach(q => { const k = Math.round(q[2]*110); for(let i = 0; i < k; i++){ const a = r()*TAU, d = Math.sqrt(-2*Math.log(r() + 1e-6))*s*.05*q[2]; const x = q[0] + Math.cos(a)*d, y = q[1] + Math.sin(a)*d; if(land(x,y)) A.push([x,y,0]); } });
  A.push(...scatter(r, 120, 0, 0, W, H, land));
  const T = grow({A, roots: [[cities[0][0], cities[0][1], 0, -1]], seg:s*.02, inf:s*.4, kill:s*.03, ok:land, iters:160});
  const wide = i => T.lc[i] > 25 ? Math.min(6, 1.5 + Math.sqrt(T.lc[i])*.3) : 0;
  g.strokeStyle = "rgba(255,255,255,.35)"; drawTree(g, T, id2, i => T.lc[i] > 25 ? 0 : .8);
  g.strokeStyle = "#0E0E13"; drawTree(g, T, id2, i => wide(i) ? wide(i) + 1.5 : 0);
  g.strokeStyle = c; drawTree(g, T, id2, wide);
  cities.forEach((q,k) => { g.fillStyle = AMB; g.beginPath(); g.arc(q[0], q[1], 2 + q[2]*4.5, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = k ? 1 : 2; g.stroke(); });
};
ART.case["B03-07"].ratio = .9;

// 08 城市街道沿地形生長：等高線地圖、低地街道與沿街建物
ART.case["B03-08"] = function(g, W, H, r, c){
  const nz = U.vnoise((r()*1e9)|0), s = Math.min(W,H), e = (x,y) => nz(x/W*2.6 + 3, y/H*2.6 + 3)*.8 + nz(x/W*7, y/H*7)*.2;
  const n = 60, m = Math.round(n*H/W), cs = W/(n-1);
  for(let l = 1; l < 10; l++){ const iso = l/10, seg = U.contour(n, m, (i,j) => e(i*cs, j*cs), iso);
    g.strokeStyle = `rgba(255,255,255,${.05 + l*.018})`; g.lineWidth = l%3 === 0 ? 1 : .6; seg.forEach(([a,b]) => { g.beginPath(); g.moveTo(a[0]*cs, a[1]*cs); g.lineTo(b[0]*cs, b[1]*cs); g.stroke(); }); }
  let lo = [W/2, H/2], lv = 9; for(let k = 0; k < 200; k++){ const x = W*.2 + r()*W*.6, y = H*.2 + r()*H*.6, v = e(x,y); if(v < lv){ lv = v; lo = [x,y]; } }
  const lim = Math.min(.62, lv + .22), ok = (x,y) => e(x,y) < lim + .04;
  const T = grow({A: scatter(r, 900, 0, 0, W, H, (x,y) => e(x,y) < lim), roots: [[lo[0], lo[1], 0, -1]], seg:s*.02, inf:s*.12, kill:s*.03, ok, iters:160});
  // 沿街建物
  g.fillStyle = "rgba(255,255,255,.28)";
  for(let i = 0; i < T.N.length; i++){ const p = T.P[i]; if(p < 0 || r() < .35) continue; const a = T.N[p], b = T.N[i], dx = b[0]-a[0], dy = b[1]-a[1], l = Math.hypot(dx,dy) || 1, ux = dx/l, uy = dy/l, sd = r() < .5 ? 1 : -1, off = s*.02, w = s*.012, h = s*.01;
    const mx = (a[0]+b[0])/2 - uy*off*sd, my = (a[1]+b[1])/2 + ux*off*sd;
    U.poly(g, [[mx - ux*w - uy*h, my - uy*w + ux*h], [mx + ux*w - uy*h, my + uy*w + ux*h], [mx + ux*w + uy*h, my + uy*w - ux*h], [mx - ux*w + uy*h, my - uy*w - ux*h]], true); g.fill(); }
  g.strokeStyle = c; drawTree(g, T, id2, i => Math.min(3.5, .7 + Math.sqrt(T.lc[i])*.2));
  g.fillStyle = AMB; g.beginPath(); g.arc(lo[0], lo[1], 3.5, 0, TAU); g.fill();
};
ART.case["B03-08"].ratio = .85;

// 09 建築剖面生成：實（剖面斜線）／虛邊界內的分枝空間網路與次級斜撐迴圈
ART.case["B03-09"] = function(g, W, H, r, c){
  const s = Math.min(W,H), x0 = W*.06, x1 = W*.94, y0 = H*.1, gy = H*.84, solids = [];
  for(let k = 0; k < 5; k++){ const w = W*(.12 + r()*.16), h = H*(.08 + r()*.14); solids.push([x0 + r()*(x1 - x0 - w), y0 + H*.12 + r()*(gy - y0 - h - H*.2), w, h]); }
  const env = [[x0, gy], [x0, y0 + H*.12], [W*.4, y0], [x1, y0 + H*.06], [x1, gy]];
  const ok = (x,y) => inPoly(x, y, env) && !solids.some(q => x > q[0] && x < q[0]+q[2] && y > q[1] && y < q[1]+q[3]);
  const rx = W*(.35 + r()*.3);
  const T = grow({A: scatter(r, 800, x0, y0, x1, gy, ok), roots: [[rx, gy - 1, 0, -1]], seg:s*.02, inf:s*.14, kill:s*.026, trop:[0,-.25,0], ok:(x,y) => ok(x,y) || (y > gy - 3 && y < gy), iters:160});
  const L = loops(T, s*.07, .15, r);
  // 地下
  g.save(); g.beginPath(); g.rect(0, gy, W, H - gy); g.clip(); g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = .7; for(let x = -H; x < W; x += 6){ g.beginPath(); g.moveTo(x, gy); g.lineTo(x + 14, gy + 14); g.stroke(); } g.restore();
  // 實體塊
  solids.forEach(q => { g.fillStyle = "rgba(255,255,255,.1)"; g.fillRect(q[0], q[1], q[2], q[3]);
    g.save(); g.beginPath(); g.rect(q[0], q[1], q[2], q[3]); g.clip(); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = .6; for(let x = q[0] - q[3]; x < q[0] + q[2]; x += 4){ g.beginPath(); g.moveTo(x, q[1] + q[3]); g.lineTo(x + q[3], q[1]); g.stroke(); } g.restore();
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.strokeRect(q[0], q[1], q[2], q[3]); });
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 2.2; U.poly(g, env, false); g.stroke();
  g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();
  g.strokeStyle = U.rgba(AMB, .8); g.lineWidth = .9; g.setLineDash([3,2]);
  L.forEach(([a,b]) => { g.beginPath(); g.moveTo(T.N[a][0], T.N[a][1]); g.lineTo(T.N[b][0], T.N[b][1]); g.stroke(); }); g.setLineDash([]);
  g.strokeStyle = c; drawTree(g, T, id2, i => T.lc[i] > 12 ? Math.min(5, 1.4 + Math.sqrt(T.lc[i])*.3) : .7);
};
ART.case["B03-09"].ratio = .95;

// 10 軟材料血管通道：微流道晶片俯視，入口、虛擬細胞與擴散半徑
ART.case["B03-10"] = function(g, W, H, r, c){
  const s = Math.min(W,H), x0 = W*.08, x1 = W*.92, y0 = H*.12, y1 = H*.88, kill = s*.07;
  const inChip = (x,y) => x > x0 + s*.05 && x < x1 - s*.04 && y > y0 + s*.04 && y < y1 - s*.04;
  const cells = scatter(r, 70, x0, y0, x1, y1, (x,y) => inChip(x,y) && x > x0 + s*.12);
  const inlet = [x0 + s*.05, (y0 + y1)/2];
  const T = grow({A: cells, roots: stem([0, inlet[1]], inlet, s*.03, 0), seg:s*.022, inf:s*.5, kill, iters:160});
  // 晶片本體
  g.fillStyle = "rgba(160,200,230,.07)"; g.beginPath(); g.roundRect(x0, y0, x1-x0, y1-y0, s*.05); g.fill();
  g.strokeStyle = "rgba(200,225,255,.45)"; g.lineWidth = 1.2; g.stroke();
  // 對位記號
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8;
  [[x0 + s*.04, y0 + s*.04],[x1 - s*.04, y0 + s*.04],[x0 + s*.04, y1 - s*.04],[x1 - s*.04, y1 - s*.04]].forEach(([x,y]) => { g.beginPath(); g.moveTo(x-4,y); g.lineTo(x+4,y); g.moveTo(x,y-4); g.lineTo(x,y+4); g.stroke(); });
  // 細胞與擴散範圍
  cells.forEach(q => { g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = .6; g.setLineDash([2,2]); g.beginPath(); g.arc(q[0], q[1], kill, 0, TAU); g.stroke(); g.setLineDash([]);
    g.fillStyle = "rgba(232,131,122,.75)"; g.beginPath(); g.arc(q[0], q[1], 2, 0, TAU); g.fill(); });
  const cw = i => Math.min(8, 1.2 + Math.pow(T.lc[i], 1/2.5)*1.5);
  g.strokeStyle = "rgba(255,255,255,.2)"; drawTree(g, T, id2, i => cw(i) + 2);
  g.strokeStyle = c; drawTree(g, T, id2, cw);
  g.fillStyle = "#0E0E13"; g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.arc(inlet[0], inlet[1], s*.03, 0, TAU); g.fill(); g.stroke();
};
ART.case["B03-10"].ratio = .8;

// 11 血管化組織：到最近血管距離的灌流色階圖，右側色條
ART.case["B03-11"] = function(g, W, H, r, c){
  const s = Math.min(W,H), cw = Math.round(W*.88);
  const T = grow({A: scatter(r, 1000, 0, 0, cw, H), roots: stem([0, H*.5], [cw*.08, H*.5], s*.02, 0), seg:s*.018, inf:s*.12, kill:s*.022, iters:170});
  const n = 56, m = Math.round(n*H/cw), D = s*.13, pts = T.N;
  const val = new Float32Array(n*m);
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){ const x = (i+.5)/n*cw, y = (j+.5)/m*H; let bd = 1e9; for(let k = 0; k < pts.length; k += 2){ const d = (pts[k][0]-x)**2 + (pts[k][1]-y)**2; if(d < bd) bd = d; } val[j*n+i] = Math.max(0, 1 - Math.sqrt(bd)/D); }
  g.save(); g.beginPath(); g.rect(0, 0, cw, H); g.clip();
  U.field(g, cw, H, n, m, (i,j) => val[j*n+i], c, 1.3);
  g.restore();
  // 未灌流區的等值線
  const seg = U.contour(n, m, (i,j) => val[j*n+i], .08);
  g.strokeStyle = "rgba(232,131,122,.8)"; g.lineWidth = 1; seg.forEach(([a,b]) => { g.beginPath(); g.moveTo((a[0]+.5)/n*cw, (a[1]+.5)/m*H); g.lineTo((b[0]+.5)/n*cw, (b[1]+.5)/m*H); g.stroke(); });
  g.strokeStyle = "rgba(255,255,255,.85)"; drawTree(g, T, id2, i => Math.min(3.5, .4 + Math.sqrt(T.lc[i])*.2));
  // 色條
  const bx = cw + W*.035, bw = W*.04, by = H*.1, bh = H*.8, gr = g.createLinearGradient(0, by + bh, 0, by);
  gr.addColorStop(0, "#15151B"); gr.addColorStop(.8, c); gr.addColorStop(1, "#fff");
  g.fillStyle = gr; g.fillRect(bx, by, bw, bh); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = .8; g.strokeRect(bx, by, bw, bh);
  for(let k = 0; k <= 4; k++){ const y = by + bh*k/4; g.beginPath(); g.moveTo(bx + bw, y); g.lineTo(bx + bw + 4, y); g.stroke(); }
};
ART.case["B03-11"].ratio = 1.05;

// 12 spacetree：建築旁的樹，被建築遮蔽的一側吸引點被移除，樹冠偏向陽光
ART.case["B03-12"] = function(g, W, H, r, c){
  const s = Math.min(W,H), gy = H*.88, bx1 = W*.34, btop = H*.2, sun = [-W*.15, -H*.7];
  // 陰影判斷：從點往太陽（左上）看，視線是否被建築擋住
  const shade = (x,y) => { const t = (x - bx1)/(x - sun[0]); if(t <= 0) return false; const yy = y + (sun[1] - y)*t; return yy > btop; };
  const inC = (x,y) => ((x - W*.66)/(W*.32))**2 + ((y - H*.42)/(H*.28))**2 < 1 && x > bx1 + s*.03;
  const T = grow({A: scatter(r, 600, 0, 0, W, gy, (x,y) => inC(x,y) && !shade(x, y)), roots: stem([W*.58, gy], [W*.58, H*.62], s*.025, 0), seg:s*.022, inf:s*.2, kill:s*.03, ok:(x,y) => x > bx1 + 3, iters:140});
  // 光線與陰影區
  const sl = (btop - sun[1])/(bx1 - sun[0]), sx = bx1 + (gy - btop)/sl;
  g.fillStyle = "rgba(0,0,0,.28)"; U.poly(g, [[bx1, btop], [Math.min(W*2, sx), gy], [bx1, gy]], true); g.fill();
  g.strokeStyle = U.rgba(AMB, .14); g.lineWidth = 1; for(let k = 0; k < 6; k++){ const tx = bx1 + W*.08 + k*W*.13; g.beginPath(); g.moveTo(tx - (gy + H*.1)/sl, -H*.1); g.lineTo(tx, gy); g.stroke(); }
  // 建築與窗格
  g.fillStyle = "rgba(255,255,255,.1)"; g.fillRect(0, btop, bx1, gy - btop); g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1; g.strokeRect(-1, btop, bx1 + 1, gy - btop);
  g.fillStyle = "rgba(0,0,0,.35)"; for(let y = btop + H*.04; y < gy - H*.06; y += H*.075) for(let x = W*.04; x < bx1 - W*.05; x += W*.09) g.fillRect(x, y, W*.05, H*.04);
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();
  g.strokeStyle = c; drawTree(g, T, id2, i => Math.min(6, .6 + Math.pow(T.lc[i], .45)*.4));
  g.fillStyle = "rgba(255,255,255,.3)"; T.A.forEach(a => g.fillRect(a[0], a[1], 1.2, 1.2));
};
ART.case["B03-12"].ratio = 1;

// 13 Sverchok 節點：Blender 3D 視窗俯視一棵管狀網格樹（環形截面線框），底部一排節點鏈
ART.case["B03-13"] = function(g, W, H, r, c){
  const s = Math.min(W,H), nh = H*.26, vh = H - nh;
  // 上游節點：吸引點雲（半球殼）＋三個根部
  const inD = (x,y,z) => { const d = Math.hypot(x, y, z); return d < 4.2 && d > 2.2 && z > .6; };
  const roots = []; [[-2.4,-1.2],[2.2,-1.6],[.2,2.4]].forEach(q => roots.push([q[0], q[1], 0, -1]));
  const T = grow({A: scatter3(r, 420, [-4.2,-4.2,.6,4.2,4.2,4.2], inD), roots, seg:.28, inf:1.8, kill:.4, is3:true, trop:[0,0,.15], maxN:1600});
  const pj = persp(.5, .75, 15, s*1.45, W/2, vh*.58, 1.4);
  // 視窗背景與 Blender 風格格線（紅 X、綠 Y 軸）
  g.fillStyle = "#1E1E25"; g.fillRect(0, 0, W, vh);
  g.lineWidth = .7;
  for(let k = -6; k <= 6; k++){ g.strokeStyle = k ? "rgba(255,255,255,.07)" : "rgba(232,110,110,.55)"; let a = pj([-6,k,0]), b = pj([6,k,0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke();
    g.strokeStyle = k ? "rgba(255,255,255,.07)" : "rgba(140,210,110,.55)"; a = pj([k,-6,0]); b = pj([k,6,0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
  // 殘留吸引點（橘色小點）
  g.fillStyle = U.rgba(AMB, .7); T.A.forEach(a => { const q = pj(a); g.fillRect(q[0]-1, q[1]-1, 2, 2); });
  // 管狀網格：沿分枝畫截面環（水平橢圓）＋外輪廓，依深度由遠到近
  const idx = T.N.map((_,i) => i).filter(i => T.P[i] >= 0).sort((a,b) => pj(T.N[b])[2] - pj(T.N[a])[2]);
  g.lineCap = "round";
  for(const i of idx){ const A = pj(T.N[T.P[i]]), B = pj(T.N[i]), rad = Math.min(.22, .02 + Math.pow(T.lc[i], .5)*.016), f = s*1.45/B[2]*rad;
    g.strokeStyle = U.rgba(c, .9); g.lineWidth = Math.max(.8, f*2); g.beginPath(); g.moveTo(A[0],A[1]); g.lineTo(B[0],B[1]); g.stroke();
    if(f > 1.3 && i % 2 === 0){ g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = .6; g.beginPath(); g.ellipse(B[0], B[1], f, f*.45, 0, 0, TAU); g.stroke(); } }
  // 根部標記
  roots.forEach(q => { const p = pj(q); g.strokeStyle = "#7FD1C7"; g.lineWidth = 1.2; g.beginPath(); g.arc(p[0], p[1], 4, 0, TAU); g.stroke(); });
  // 視窗頂部工具列與右上角軸向小工具
  g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(0, 0, W, H*.04);
  const gx = W - s*.1, gy = s*.12; [["#E86E6E",[1,0,0]],["#8CD26E",[0,1,0]],["#6EA8E8",[0,0,1]]].forEach(([col,v]) => { const o = pj([0,0,1.4]), e = pj(v.map((t,k) => t + (k === 2 ? 1.4 : 0))), l = Math.hypot(e[0]-o[0], e[1]-o[1]) || 1;
    g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + (e[0]-o[0])/l*s*.06, gy + (e[1]-o[1])/l*s*.06); g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(gx + (e[0]-o[0])/l*s*.06, gy + (e[1]-o[1])/l*s*.06, 2.5, 0, TAU); g.fill(); });
  // 底部節點編輯器：吸引點 → 根部 → 空間殖民腳本 → 管狀化 → 輸出
  g.fillStyle = "#15151B"; g.fillRect(0, vh, W, nh); g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, vh); g.lineTo(W, vh); g.stroke();
  const cols = [AMB, "#7FD1C7", c, "#C7B8FF", "#6EA8E8"], nw = W*.15, gap = (W - nw*5)/6;
  const bx = k => gap + k*(nw + gap), by = k => vh + nh*(k === 2 ? .18 : k % 2 ? .42 : .28), bh = k => nh*(k === 2 ? .66 : .42);
  for(let k = 0; k < 4; k++){ const a = [bx(k) + nw, by(k) + bh(k)*.5], b = [bx(k+1), by(k+1) + bh(k+1)*.5], dx = (b[0]-a[0])*.6;
    g.strokeStyle = cols[k]; g.lineWidth = 1.4; g.beginPath(); g.moveTo(a[0],a[1]); g.bezierCurveTo(a[0]+dx, a[1], b[0]-dx, b[1], b[0], b[1]); g.stroke(); }
  cols.forEach((col, k) => { const x = bx(k), y = by(k), h = bh(k);
    g.fillStyle = "#2A2A34"; g.beginPath(); g.roundRect(x, y, nw, h, 3); g.fill(); g.fillStyle = U.rgba(col, .8); g.beginPath(); g.roundRect(x, y, nw, nh*.09, [3,3,0,0]); g.fill();
    g.fillStyle = "rgba(255,255,255,.2)"; for(let j = 0; j < (k === 2 ? 4 : 2); j++) g.fillRect(x + nw*.12, y + nh*.15 + j*nh*.11, nw*(.45 + (j%2)*.3), nh*.035);
    g.fillStyle = col; g.beginPath(); g.arc(x + nw, y + h*.5, 2.5, 0, TAU); g.fill(); if(k){ g.beginPath(); g.arc(x, y + h*.5, 2.5, 0, TAU); g.fill(); } });
};
ART.case["B03-13"].ratio = 1.15;

// 14 Houdini 裝置：一點透視展間，分枝從天花板往下垂吊並發光
ART.case["B03-14"] = function(g, W, H, r, c){
  const top = 6, inV = (x,y,z) => { const t = (top - z)/5; return t > 0 && t < 1 && x*x + y*y < (2.6*Math.sin(Math.PI*Math.pow(t,.7)))**2; };
  const roots = []; [[-1.4,0],[1.4,0.3],[0,-1]].forEach(q => roots.push([q[0], q[1], top, -1]));
  const T = grow({A: scatter3(r, 500, [-2.6,-2.6,1,2.6,2.6,top], inV), roots, seg:.2, inf:1.3, kill:.3, is3:true, trop:[0,0,-.25], maxN:2200});
  const pj = persp(0, 0, 12, Math.min(W,H)*1.6, W/2, H*.5, 3.3), Wd = 5.5, Dp = 5;
  // 展間：地板、天花板、後牆
  const C = (x,y,z) => pj([x,y,z]);
  const fl = [C(-Wd,-Dp,0), C(Wd,-Dp,0), C(Wd,Dp,0), C(-Wd,Dp,0)], ce = [C(-Wd,-Dp,top+.4), C(Wd,-Dp,top+.4), C(Wd,Dp,top+.4), C(-Wd,Dp,top+.4)];
  g.fillStyle = "rgba(255,255,255,.04)"; U.poly(g, fl, true); g.fill(); g.fillStyle = "rgba(255,255,255,.025)"; U.poly(g, [fl[2], fl[3], ce[3], ce[2]], true); g.fill();
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = .8; U.poly(g, [fl[3], fl[2], ce[2], ce[3]], true); g.stroke();
  [[0,3],[1,2]].forEach(([a,b]) => { g.beginPath(); g.moveTo(fl[a][0], fl[a][1]); g.lineTo(fl[b][0], fl[b][1]); g.moveTo(ce[a][0], ce[a][1]); g.lineTo(ce[b][0], ce[b][1]); g.stroke(); });
  // 地板光暈
  const fc = C(0,0,0), gl = g.createRadialGradient(fc[0], fc[1], 0, fc[0], fc[1], W*.4); gl.addColorStop(0, U.rgba(c,.28)); gl.addColorStop(1, U.rgba(c,0));
  g.fillStyle = gl; g.beginPath(); g.ellipse(fc[0], fc[1], W*.4, H*.07, 0, 0, TAU); g.fill();
  // 發光分枝（寬淡＋細亮兩層）
  g.strokeStyle = U.rgba(c, .15); drawTree(g, T, pj, i => Math.min(8, 2.5 + Math.sqrt(T.lc[i])*.5));
  g.strokeStyle = "#F4F0FF"; drawTree(g, T, pj, i => Math.min(2.2, .4 + Math.sqrt(T.lc[i])*.12));
  g.fillStyle = c; for(let i = 0; i < T.N.length; i++) if(T.kids[i] === 0){ const p = pj(T.N[i]); g.beginPath(); g.arc(p[0], p[1], 1.3, 0, TAU); g.fill(); }
  // 觀眾剪影
  [[-3.6, -2.2], [3.2, -1.2]].forEach(([x,y]) => { const f = C(x,y,0), h = C(x,y,1.7), hh = f[1] - h[1]; g.fillStyle = "rgba(0,0,0,.7)"; g.fillRect(f[0] - hh*.12, h[1] + hh*.18, hh*.24, hh*.82); g.beginPath(); g.arc(f[0], h[1] + hh*.08, hh*.09, 0, TAU); g.fill(); });
};
ART.case["B03-14"].ratio = .85;

// 15 GH 範例：Rhino 四視圖（上、前、右、透視）同一棵 3D 樹
ART.case["B03-15"] = function(g, W, H, r, c){
  const inS = (x,y,z) => x*x + y*y + (z-6)**2 < 9;
  const T = grow({A: scatter3(r, 360, [-3,-3,3,3,3,9], inS), roots: stem([0,0,0],[0,0,3.2],.3,0), seg:.3, inf:2.2, kill:.5, is3:true, maxN:1500});
  const gap = 3, vw = (W - gap*3)/2, vh = (H - gap*3)/2, views = [p => [p[0], -p[1]], p => [p[0], p[2]], p => [p[1], p[2]], null];
  const pp = persp(.7, .45, 18, 1, 0, 0, 4.5);
  views.forEach((vf, k) => {
    const ox = gap + (k%2)*(vw + gap), oy = gap + ((k/2)|0)*(vh + gap);
    g.save(); g.beginPath(); g.rect(ox, oy, vw, vh); g.clip();
    g.fillStyle = "#24242D"; g.fillRect(ox, oy, vw, vh);
    const sc = Math.min(vw, vh)/(k ? 11 : 8.5), cx = ox + vw/2, cy = k === 0 ? oy + vh/2 : oy + vh*.9;
    let proj;
    if(vf) proj = p => { const q = vf(p); return [cx + q[0]*sc, cy - q[1]*sc]; };
    else { const f = Math.min(vw, vh)*2.6; proj = p => { const q = pp(p); return [ox + vw/2 + q[0]*f, oy + vh*.52 + q[1]*f]; }; }
    // 格線
    g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = .6;
    if(vf){ for(let t = -8; t <= 8; t++){ g.beginPath(); g.moveTo(cx + t*sc, oy); g.lineTo(cx + t*sc, oy + vh); g.stroke(); g.beginPath(); g.moveTo(ox, cy - t*sc); g.lineTo(ox + vw, cy - t*sc); g.stroke(); }
      g.strokeStyle = "rgba(232,131,122,.5)"; g.beginPath(); g.moveTo(ox, cy); g.lineTo(ox + vw, cy); g.stroke(); g.strokeStyle = "rgba(127,209,199,.5)"; g.beginPath(); g.moveTo(cx, oy); g.lineTo(cx, oy + vh); g.stroke(); }
    else { for(let t = -5; t <= 5; t++){ let a = proj([t,-5,0]), b = proj([t,5,0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); a = proj([-5,t,0]); b = proj([5,t,0]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); } }
    if(vf){ g.strokeStyle = "rgba(235,235,245,.8)"; drawTree(g, T, proj, () => .7); }
    else { g.strokeStyle = c; drawTree(g, T, proj, i => Math.min(4, .5 + Math.pow(T.lc[i], .45)*.3)); }
    g.restore();
    g.strokeStyle = k === 3 ? U.rgba(c,.9) : "rgba(255,255,255,.2)"; g.lineWidth = 1; g.strokeRect(ox + .5, oy + .5, vw - 1, vh - 1);
    g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(ox + 4, oy + 4, vw*.18, 3);
  });
};
ART.case["B03-15"].ratio = 1;
})();
