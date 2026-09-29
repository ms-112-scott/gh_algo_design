/* F07 模擬退火（以房間鄰接配置為例）：基本生成器（變形與案例的獨立畫法由 gh-enrich 的 ART 單元補上） */
(function(){
const ART = window.ART, U = window.GENUTIL;
// 真的跑一次二次指派（QAP）退火：交換兩格 → Δ → Metropolis 準則 → 幾何降溫；畫出最佳配置、鄰接連線與成本曲線
U.GEN["F07"] = function(g, W, H, r, v, c){
  const cols = 3 + (v % 2), rows = 3, slots = cols*rows, n = slots - 1 - (v % 3 === 2 ? 1 : 0);
  // 鄰接需求：一條主動線（i 與 i+1）＋幾條隨機需求，權重 1–5
  const w = [...Array(n)].map(() => new Float32Array(n));
  const link = (i, j, x) => { w[i][j] = w[j][i] = Math.max(w[i][j], x); };
  for(let i = 0; i < n-1; i++) link(i, i+1, 2 + ((r()*4)|0));
  for(let k = 0; k < n; k++){ const i = (r()*n)|0, j = (r()*n)|0; if(i !== j) link(i, j, 1 + ((r()*3)|0)); }
  // 初始：隨機排列
  const order = [...Array(slots).keys()];
  for(let k = slots-1; k > 0; k--){ const m = (r()*(k+1))|0; [order[k], order[m]] = [order[m], order[k]]; }
  const slotOf = order.slice(0, n), roomAt = new Int16Array(slots).fill(-1); slotOf.forEach((s,i) => roomAt[s] = i);
  const cost = () => { let s = 0; for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) if(w[i][j]) s += w[i][j]*(Math.abs(slotOf[i]%cols - slotOf[j]%cols) + Math.abs(((slotOf[i]/cols)|0) - ((slotOf[j]/cols)|0))); return s; };
  const swap = (a, b) => { const ra = roomAt[a], rb = roomAt[b]; roomAt[a] = rb; roomAt[b] = ra; if(ra >= 0) slotOf[ra] = b; if(rb >= 0) slotOf[rb] = a; };
  let E = cost(), best = E, bestSlot = slotOf.slice(), T = 6 + (v % 4)*2; const hist = [E], steps = 2400, alpha = .9 + (v % 3)*.02;
  for(let s = 1; s <= steps; s++){
    let a, b; do { a = (r()*slots)|0; b = (r()*slots)|0; } while(a === b || (roomAt[a] < 0 && roomAt[b] < 0));
    swap(a, b); const E2 = cost(), d = E2 - E;
    if(d <= 0 || r() < Math.exp(-d/T)){ E = E2; if(E < best){ best = E; bestSlot = slotOf.slice(); } } else swap(a, b);
    if(s % 40 === 0) T *= alpha;
    if(s % 16 === 0) hist.push(E);
  }
  // 平面：左側格位與房間
  const pad = Math.min(W,H)*.08, planH = H - pad*2, cell = Math.min((W*.66 - pad)/cols, planH/rows), ox = pad, oy = (H - cell*rows)/2;
  const ctr = s => [ox + (s%cols + .5)*cell, oy + (((s/cols)|0) + .5)*cell];
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1;
  for(let s = 0; s < slots; s++){ g.strokeRect(ox + (s%cols)*cell + .5, oy + ((s/cols)|0)*cell + .5, cell - 1, cell - 1); }
  for(let i = 0; i < n; i++){ const [x,y] = ctr(bestSlot[i]), h = cell*.42;
    g.fillStyle = U.rgba(c, .18 + .5*((i*37 % n)/n)); g.fillRect(x-h, y-h, h*2, h*2);
    g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1.2; g.strokeRect(x-h, y-h, h*2, h*2); }
  // 鄰接連線：權重越大越粗；最佳配置裡大多是相鄰短線
  g.lineCap = "round";
  for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) if(w[i][j]){ const p = ctr(bestSlot[i]), q = ctr(bestSlot[j]);
    g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = .6 + w[i][j]*.8; g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); }
  for(let i = 0; i < n; i++){ const [x,y] = ctr(bestSlot[i]); g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, Math.max(2, cell*.06), 0, U.TAU); g.fill(); }
  // 右側：成本曲線（高溫時抖動，降溫後收斂）
  const gx = W*.7, gw = W - gx - pad*.6, gy = pad*1.4, gh = H - pad*2.8, mx = Math.max(...hist), mn = Math.min(...hist), sp = Math.max(1e-6, mx - mn);
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy+gh); g.lineTo(gx+gw, gy+gh); g.stroke();
  U.poly(g, hist.map((e,k) => [gx + gw*k/(hist.length-1), gy + gh*(1 - (e - mn)/sp)])); g.strokeStyle = c; g.lineWidth = 1.3; g.stroke();
  const by = gy + gh*(1 - (best - mn)/sp); g.setLineDash([3,3]); g.strokeStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.moveTo(gx, by); g.lineTo(gx+gw, by); g.stroke(); g.setLineDash([]);
};
ART.var["F07"] = ART.var["F07"] || [];
})();

/* F07 模擬退火：變形與無照片案例的獨立畫法（gh-enrich 補上） */
(function(){
const ART = window.ART, U = window.GENUTIL;
ART.var["F07"] = ART.var["F07"] || [];
const GOLD = "#F2B84B";

/* ---------- 共用引擎 ---------- */
// 房間鄰接（QAP）退火：在 slots 個格位中安排 n 個房間，distFn 決定兩格位的距離
// opts: steps, T0, alpha, fixed{房間:格位}（釘住不動）, blocked(Set 不可用格位), extraCost(i,slot)->額外成本
function qapAnneal(r, n, slots, distFn, w, opts){
  opts = opts || {};
  const order = [...Array(slots).keys()];
  for(let k = slots-1; k > 0; k--){ const m = (r()*(k+1))|0; [order[k], order[m]] = [order[m], order[k]]; }
  const fixed = opts.fixed || {};
  Object.keys(fixed).forEach(ri => { ri = +ri; const want = fixed[ri], cur = order.indexOf(ri);
    if(cur >= 0 && cur !== want){ const t = order[want]; order[want] = order[cur]; order[cur] = t; } });
  const slotOf = order.slice(0, n), roomAt = new Int16Array(slots).fill(-1); slotOf.forEach((s,i) => roomAt[s] = i);
  const blocked = opts.blocked || new Set(), extra = opts.extraCost || (() => 0);
  const cost = () => { let s = 0; for(let i = 0; i < n; i++){ s += extra(i, slotOf[i]);
    for(let j = i+1; j < n; j++) if(w[i][j]) s += w[i][j]*distFn(slotOf[i], slotOf[j]); } return s; };
  const swap = (a, b) => { const ra = roomAt[a], rb = roomAt[b]; roomAt[a] = rb; roomAt[b] = ra; if(ra >= 0) slotOf[ra] = b; if(rb >= 0) slotOf[rb] = a; };
  let E = cost(), best = E, bestSlot = slotOf.slice();
  const steps = opts.steps || 2200, alpha = opts.alpha || .92; let T = opts.T0 || 7;
  for(let s = 1; s <= steps; s++){
    let a, b, tries = 0;
    do { a = (r()*slots)|0; b = (r()*slots)|0; tries++; }
    while(tries < 40 && (a === b || blocked.has(a) || blocked.has(b) || (roomAt[a] >= 0 && fixed[roomAt[a]] !== undefined) || (roomAt[b] >= 0 && fixed[roomAt[b]] !== undefined) || (roomAt[a] < 0 && roomAt[b] < 0)));
    if(tries >= 40) continue;
    swap(a, b); const E2 = cost(), d = E2 - E;
    if(d <= 0 || r() < Math.exp(-d/T)){ E = E2; if(E < best){ best = E; bestSlot = slotOf.slice(); } } else swap(a, b);
    if(s % 40 === 0) T *= alpha;
  }
  return {bestSlot, best};
}
// 走訪順序退火（2-opt）：反轉一段路徑，Metropolis 準則決定是否接受
function tspAnneal(r, pts, opts){
  opts = opts || {};
  const n = pts.length, o = [...Array(n).keys()];
  for(let k = n-1; k > 0; k--){ const m = (r()*(k+1))|0; [o[k], o[m]] = [o[m], o[k]]; }
  const d = (i,j) => Math.hypot(pts[i][0]-pts[j][0], pts[i][1]-pts[j][1]);
  let E = 0; for(let i = 0; i < n; i++) E += d(o[i], o[(i+1)%n]);
  let best = E, bestO = o.slice();
  const steps = opts.steps || 2000, alpha = opts.alpha || .965; let T = opts.T0 || (E/n)*1.5;
  const hist = [E];
  for(let s = 1; s <= steps; s++){
    let i = 1 + ((r()*(n-2))|0), j = 1 + ((r()*(n-2))|0);
    if(i === j) continue; if(i > j){ const t = i; i = j; j = t; }
    const a = o[i-1], b = o[i], cc = o[j], dd = o[(j+1)%n];
    const delta = (d(a,cc)+d(b,dd)) - (d(a,b)+d(cc,dd));
    if(delta <= 0 || r() < Math.exp(-delta/T)){
      let lo = i, hi = j; while(lo < hi){ const t = o[lo]; o[lo] = o[hi]; o[hi] = t; lo++; hi--; }
      E += delta; if(E < best){ best = E; bestO = o.slice(); }
    }
    if(s % 30 === 0) T *= alpha;
    if(s % 20 === 0) hist.push(E);
  }
  return {order: bestO, hist, best};
}
// 連續鄰域退火：物件在房間內隨機平移＋旋轉，避免重疊／貼牆
function placeAnneal(r, objs, room, opts){
  opts = opts || {};
  const n = objs.length;
  const mk = () => objs.map(o => ({x: o.w/2 + r()*(room.w-o.w), y: o.h/2 + r()*(room.h-o.h), a: ((r()*4)|0)*Math.PI/2, w: o.w, h: o.h}));
  const st = mk(), init = st.map(s => ({...s}));
  const dims = p => (Math.round(p.a/(Math.PI/2))%2) ? [p.h,p.w] : [p.w,p.h];
  const overlap = (p,q) => { const [pw,ph]=dims(p), [qw,qh]=dims(q);
    const ox = Math.max(0, Math.min(p.x+pw/2,q.x+qw/2) - Math.max(p.x-pw/2,q.x-qw/2));
    const oy = Math.max(0, Math.min(p.y+ph/2,q.y+qh/2) - Math.max(p.y-ph/2,q.y-qh/2));
    return ox*oy; };
  const cost = () => { let s = 0; for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) s += overlap(st[i], st[j])*4; return s; };
  let E = cost(), best = E, bestSt = st.map(s => ({...s}));
  const steps = opts.steps || 1500, alpha = opts.alpha || .93; let T = opts.T0 || 40;
  for(let s = 1; s <= steps; s++){
    const i = (r()*n)|0, old = {...st[i]};
    const [pw,ph] = dims(st[i]);
    st[i].x = Math.max(pw/2, Math.min(room.w-pw/2, st[i].x + (r()-.5)*room.w*.35));
    st[i].y = Math.max(ph/2, Math.min(room.h-ph/2, st[i].y + (r()-.5)*room.h*.35));
    if(r() < .25) st[i].a = ((r()*4)|0)*Math.PI/2;
    const E2 = cost(), d = E2 - E;
    if(d <= 0 || r() < Math.exp(-d/T)){ E = E2; if(E < best){ best = E; bestSt = st.map(x => ({...x})); } } else st[i] = old;
    if(s % 25 === 0) T *= alpha;
  }
  return {init, best: bestSt};
}
// 不規則基地的走行距離（BFS）
function bfsDist(cols, rows, free){
  const N = cols*rows, dist = Array.from({length:N}, () => new Int16Array(N).fill(-1));
  const nbrs = k => { const x = k%cols, y = (k/cols)|0, out = [];
    if(x > 0 && free[k-1]) out.push(k-1); if(x < cols-1 && free[k+1]) out.push(k+1);
    if(y > 0 && free[k-cols]) out.push(k-cols); if(y < rows-1 && free[k+cols]) out.push(k+cols); return out; };
  for(let s = 0; s < N; s++){ if(!free[s]) continue; const dS = dist[s]; dS[s] = 0; const q = [s]; let h = 0;
    while(h < q.length){ const u = q[h++]; for(const v of nbrs(u)) if(dS[v] < 0){ dS[v] = dS[u]+1; q.push(v); } } }
  return dist;
}
// 簡易旋轉投影（等角風格），回傳 [x,y,深度]
function proj3(x,y,z,W,H,scale,rotY,rotX){
  const cy = Math.cos(rotY), sy = Math.sin(rotY);
  let X = x*cy + z*sy, Z = -x*sy + z*cy;
  const cx2 = Math.cos(rotX), sx2 = Math.sin(rotX);
  const Y = y*cx2 - Z*sx2; Z = y*sx2 + Z*cx2;
  return [W/2 + X*scale, H/2 - Y*scale, Z];
}
function heat(t){ const st=[[63,120,208],[63,208,201],[242,193,78],[232,85,63]], x=Math.min(.999,Math.max(0,t))*3, i=x|0, k=x-i, A=st[i], B=st[i+1];
  return `rgb(${(A[0]+(B[0]-A[0])*k)|0},${(A[1]+(B[1]-A[1])*k)|0},${(A[2]+(B[2]-A[2])*k)|0})`; }

/* ================= 變形 V01–V12 ================= */
// V01 不等面積房間：條帶式平面──依 SA 排出的順序切成寬度不一的條帶，鄰接量體用弧線標示在上方
ART.var["F07"][0] = function(g, W, H, r, c, U){
  const n = 6 + ((r()*2)|0), areas = [...Array(n)].map(() => .6 + r()*1.4);
  const w = [...Array(n)].map(() => new Float32Array(n));
  const link = (i,j,x) => { w[i][j] = w[j][i] = Math.max(w[i][j], x); };
  for(let i = 0; i < n-1; i++) link(i, i+1, 2 + ((r()*4)|0));
  for(let k = 0; k < n; k++){ const i = (r()*n)|0, j = (r()*n)|0; if(i !== j) link(i, j, 1 + ((r()*3)|0)); }
  let order = [...Array(n).keys()];
  for(let k = n-1; k > 0; k--){ const m = (r()*(k+1))|0; [order[k],order[m]] = [order[m],order[k]]; }
  const pos = new Int16Array(n); order.forEach((room,idx) => pos[room] = idx);
  const cost = () => { let s = 0; for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) if(w[i][j]) s += w[i][j]*Math.abs(pos[i]-pos[j]); return s; };
  let E = cost(), best = E, bestOrder = order.slice(), T = 5;
  for(let s = 1; s <= 1600; s++){
    const a = (r()*n)|0, b = (r()*n)|0; if(a === b) continue;
    const ra = order[a], rb = order[b]; order[a] = rb; order[b] = ra; pos[ra] = b; pos[rb] = a;
    const E2 = cost(), d = E2 - E;
    if(d <= 0 || r() < Math.exp(-d/T)){ E = E2; if(E < best){ best = E; bestOrder = order.slice(); } }
    else { order[a] = ra; order[b] = rb; pos[ra] = a; pos[rb] = b; }
    if(s % 30 === 0) T *= .93;
  }
  const pad = Math.min(W,H)*.09, pw = W-pad*2, ph = H-pad*2, totalArea = areas.reduce((a,b) => a+b, 0);
  const centerOf = new Array(n); let x = pad;
  bestOrder.forEach(room => {
    const wPix = pw*areas[room]/totalArea;
    g.fillStyle = U.rgba(c, .16+.55*((room*37)%n)/n); g.fillRect(x, pad, wPix, ph);
    g.strokeStyle = U.rgba(c, .9); g.lineWidth = 1.3; g.strokeRect(x+.5, pad+.5, wPix-1, ph-1);
    centerOf[room] = [x+wPix/2, pad]; x += wPix;
  });
  g.lineCap = "round";
  for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) if(w[i][j]){
    const [x1,y1] = centerOf[i], [x2] = centerOf[j], midY = pad - 6 - w[i][j]*3;
    g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = .6+w[i][j]*.7;
    g.beginPath(); g.moveTo(x1,y1); g.quadraticCurveTo((x1+x2)/2, midY, x2, y1); g.stroke();
  }
};
// V02 連續鄰域：家具與構件擺放──虛線是隨機起點，實色是退火後貼牆、留出走道的結果
ART.var["F07"][1] = function(g, W, H, r, c, U){
  const pad = Math.min(W,H)*.08, rw = W-pad*2, rh = H-pad*2;
  const objs = [{w:rw*.34,h:rh*.16},{w:rw*.16,h:rh*.16},{w:rw*.22,h:rh*.1},{w:rw*.12,h:rh*.2},{w:rw*.1,h:rh*.1}];
  const {init, best} = placeAnneal(r, objs, {w:rw,h:rh}, {steps:1500, T0:rw*.25});
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.strokeRect(pad, pad, rw, rh);
  g.save(); g.translate(pad, pad);
  g.setLineDash([3,3]); g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1;
  init.forEach(o => { g.save(); g.translate(o.x,o.y); g.rotate(o.a); g.strokeRect(-o.w/2,-o.h/2,o.w,o.h); g.restore(); });
  g.setLineDash([]);
  best.forEach((o,i) => { g.save(); g.translate(o.x,o.y); g.rotate(o.a);
    g.fillStyle = U.rgba(c, .22+.5*(i/best.length)); g.fillRect(-o.w/2,-o.h/2,o.w,o.h);
    g.strokeStyle = U.rgba(c, .95); g.lineWidth = 1.2; g.strokeRect(-o.w/2,-o.h/2,o.w,o.h); g.restore(); });
  g.restore();
};
// V03 2-opt 反轉路段：單線繪圖──一筆畫完的封閉路徑，交叉線段在退火中被反轉解開
ART.var["F07"][2] = function(g, W, H, r, c, U){
  const pad = Math.min(W,H)*.1, n = 22 + ((r()*8)|0), pts = [];
  for(let i = 0; i < n; i++) pts.push([pad+r()*(W-pad*2), pad+r()*(H-pad*2)]);
  const {order} = tspAnneal(r, pts, {steps:2600});
  g.lineJoin = "round"; g.lineCap = "round"; g.strokeStyle = U.rgba(c, .95); g.lineWidth = 1.6;
  g.beginPath(); order.forEach((idx,k) => { const [x,y] = pts[idx]; k ? g.lineTo(x,y) : g.moveTo(x,y); }); g.closePath(); g.stroke();
  pts.forEach(([x,y]) => { g.fillStyle = "#fff"; g.beginPath(); g.arc(x,y,2,0,U.TAU); g.fill(); });
};
// V04 冷卻排程比較與重新加熱──四條成本曲線：降太快早早卡住、對數最穩、指數＋重新加熱能再跳出
ART.var["F07"][3] = function(g, W, H, r, c, U){
  const n = 10, pts = []; for(let i = 0; i < n; i++) pts.push([r(), r()]);
  const d = (i,j) => Math.hypot(pts[i][0]-pts[j][0], pts[i][1]-pts[j][1]);
  function run(alpha, reheat){
    const o = [...Array(n).keys()];
    for(let k = n-1; k > 0; k--){ const m = (r()*(k+1))|0; [o[k],o[m]] = [o[m],o[k]]; }
    let E = 0; for(let i = 0; i < n; i++) E += d(o[i], o[(i+1)%n]);
    let T = 1.2; const steps = 900, hist = [E];
    for(let s = 1; s <= steps; s++){
      let i = 1+((r()*(n-2))|0), j = 1+((r()*(n-2))|0); if(i === j) continue; if(i > j){ const t=i;i=j;j=t; }
      const a=o[i-1], b=o[i], cc=o[j], dd=o[(j+1)%n], delta = (d(a,cc)+d(b,dd))-(d(a,b)+d(cc,dd));
      if(delta <= 0 || r() < Math.exp(-delta/T)){ let lo=i,hi=j; while(lo<hi){const t=o[lo];o[lo]=o[hi];o[hi]=t;lo++;hi--;} E += delta; }
      if(s % 12 === 0) T *= alpha;
      if(reheat && s === Math.floor(steps*.55)) T = .6;
      hist.push(E);
    }
    return hist;
  }
  const curves = [run(.80,false), run(.995,false), run(.93,false), run(.93,true)];
  const pad = Math.min(W,H)*.12, gx = pad, gy = pad, gw = W-pad*2, gh = H-pad*2;
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.beginPath(); g.moveTo(gx,gy); g.lineTo(gx,gy+gh); g.lineTo(gx+gw,gy+gh); g.stroke();
  const allMax = Math.max(...curves.flat()), allMin = Math.min(...curves.flat()), sp = Math.max(1e-6, allMax-allMin);
  const cols = [U.rgba(c,.9), "rgba(255,255,255,.55)", U.rgba(c,.5), GOLD];
  curves.forEach((h,ci) => { U.poly(g, h.map((e,k) => [gx+gw*k/(h.length-1), gy+gh*(1-(e-allMin)/sp)]));
    g.strokeStyle = cols[ci]; g.lineWidth = ci === 3 ? 1.6 : 1.1; g.stroke(); });
  cols.forEach((col,i) => { g.fillStyle = col; g.beginPath(); g.arc(gx+gw-8, gy+8+i*10, 3, 0, U.TAU); g.fill(); });
};
// V05 固定房間與不可用格位──金色為釘住的入口／樓梯，斜線格為結構不可用，其餘房間繞著它們重排
ART.var["F07"][4] = function(g, W, H, r, c, U){
  const cols = 4, rows = 3, slots = cols*rows, n = slots-3;
  const w = [...Array(n)].map(() => new Float32Array(n));
  const link = (i,j,x) => { w[i][j] = w[j][i] = Math.max(w[i][j], x); };
  for(let i = 0; i < n-1; i++) link(i, i+1, 2+((r()*4)|0));
  for(let k = 0; k < n; k++){ const i=(r()*n)|0, j=(r()*n)|0; if(i!==j) link(i,j,1+((r()*3)|0)); }
  const blocked = new Set([cols-1]), fixed = {0: (rows-1)*cols, 1: cols-2};
  const dist = (sa,sb) => Math.abs(sa%cols-sb%cols)+Math.abs(((sa/cols)|0)-((sb/cols)|0));
  const {bestSlot} = qapAnneal(r, n, slots, dist, w, {fixed, blocked, steps:2200, T0:6, alpha:.92});
  const pad = Math.min(W,H)*.09, cell = Math.min((W-pad*2)/cols, (H-pad*2)/rows), ox = (W-cell*cols)/2, oy = (H-cell*rows)/2;
  const ctr = s => [ox+(s%cols+.5)*cell, oy+(((s/cols)|0)+.5)*cell];
  for(let s = 0; s < slots; s++){
    if(blocked.has(s)){ g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(ox+(s%cols)*cell, oy+((s/cols)|0)*cell, cell, cell);
      g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.beginPath();
      g.moveTo(ox+(s%cols)*cell, oy+((s/cols)|0)*cell); g.lineTo(ox+(s%cols)*cell+cell, oy+((s/cols)|0)*cell+cell); g.stroke(); }
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; g.strokeRect(ox+(s%cols)*cell+.5, oy+((s/cols)|0)*cell+.5, cell-1, cell-1);
  }
  for(let i = 0; i < n; i++){ const [x,y] = ctr(bestSlot[i]), h = cell*.42, pin = i===0||i===1;
    g.fillStyle = U.rgba(c, .18+.5*((i*37%n)/n)); g.fillRect(x-h,y-h,h*2,h*2);
    g.strokeStyle = pin ? GOLD : U.rgba(c,.9); g.lineWidth = pin ? 2 : 1.2; g.strokeRect(x-h,y-h,h*2,h*2);
    if(pin){ g.fillStyle = GOLD; g.beginPath(); g.arc(x,y,3,0,U.TAU); g.fill(); }
  }
  g.lineCap = "round";
  for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) if(w[i][j]){ const p = ctr(bestSlot[i]), q = ctr(bestSlot[j]);
    g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = .6+w[i][j]*.7; g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); }
};
// V06 不規則基地＋走廊距離──L 形基地（缺角為挖空的中庭／構造），連線改走 BFS 走行距離的折線
ART.var["F07"][5] = function(g, W, H, r, c, U){
  const cols = 7, rows = 6, N = cols*rows, free = new Uint8Array(N).fill(1);
  for(let y = 0; y < Math.floor(rows*.45); y++) for(let x = Math.floor(cols*.55); x < cols; x++) free[y*cols+x] = 0;
  const D = bfsDist(cols, rows, free), freeCells = [...Array(N).keys()].filter(k => free[k]);
  const n = Math.min(8, freeCells.length-1);
  const w = [...Array(n)].map(() => new Float32Array(n));
  const link = (i,j,x) => { w[i][j] = w[j][i] = Math.max(w[i][j], x); };
  for(let i = 0; i < n-1; i++) link(i, i+1, 2+((r()*4)|0));
  for(let k = 0; k < n; k++){ const i=(r()*n)|0, j=(r()*n)|0; if(i!==j) link(i,j,1+((r()*3)|0)); }
  let pool = freeCells.slice();
  for(let k = pool.length-1; k > 0; k--){ const m = (r()*(k+1))|0; [pool[k],pool[m]] = [pool[m],pool[k]]; }
  let assign = pool.slice(0, n);
  const cost = a => { let s = 0; for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) if(w[i][j]){ const dd = D[a[i]][a[j]]; s += w[i][j]*(dd<0?99:dd); } return s; };
  let E = cost(assign), best = E, bestAssign = assign.slice(), T = 6;
  for(let s = 1; s <= 1400; s++){
    const ii = (r()*n)|0, cell = freeCells[(r()*freeCells.length)|0];
    if(assign.includes(cell)) continue;
    const old = assign[ii]; assign[ii] = cell;
    const E2 = cost(assign), d = E2 - E;
    if(d <= 0 || r() < Math.exp(-d/T)){ E = E2; if(E < best){ best = E; bestAssign = assign.slice(); } } else assign[ii] = old;
    if(s % 40 === 0) T *= .93;
  }
  const pad = Math.min(W,H)*.08, cw = (W-pad*2)/cols, ch = (H-pad*2)/rows, ox = pad, oy = pad;
  for(let k = 0; k < N; k++){ const x = k%cols, y = (k/cols)|0;
    g.fillStyle = free[k] ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.35)"; g.fillRect(ox+x*cw, oy+y*ch, cw, ch);
    g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1; g.strokeRect(ox+x*cw+.5, oy+y*ch+.5, cw-1, ch-1); }
  const ctr = k => [ox+(k%cols+.5)*cw, oy+(((k/cols)|0)+.5)*ch];
  for(let i = 0; i < n; i++){ const [x,y] = ctr(bestAssign[i]), h = Math.min(cw,ch)*.38;
    g.fillStyle = U.rgba(c, .18+.5*((i*37%n)/n)); g.fillRect(x-h,y-h,h*2,h*2);
    g.strokeStyle = U.rgba(c,.9); g.lineWidth = 1.2; g.strokeRect(x-h,y-h,h*2,h*2); }
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1;
  for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) if(w[i][j] >= 3){ const [x1,y1] = ctr(bestAssign[i]), [x2,y2] = ctr(bestAssign[j]);
    g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y1); g.lineTo(x2,y2); g.stroke(); }
};
// V07 多樓層配置：垂直移動成本──三片等角疊放的樓板，跨層連線用虛線，垂直移動的權重比同層平移重
ART.var["F07"][6] = function(g, W, H, r, c, U){
  const cols = 3, rows = 3, layers = 3, slots = cols*rows*layers, n = 9;
  const w = [...Array(n)].map(() => new Float32Array(n));
  const link = (i,j,x) => { w[i][j] = w[j][i] = Math.max(w[i][j], x); };
  for(let i = 0; i < n-1; i++) link(i, i+1, 2+((r()*4)|0));
  for(let k = 0; k < n; k++){ const i=(r()*n)|0, j=(r()*n)|0; if(i!==j) link(i,j,1+((r()*3)|0)); }
  const order = [...Array(slots).keys()];
  for(let k = slots-1; k > 0; k--){ const m = (r()*(k+1))|0; [order[k],order[m]] = [order[m],order[k]]; }
  const slotOf = order.slice(0,n), roomAt = new Int16Array(slots).fill(-1); slotOf.forEach((s,i) => roomAt[s] = i);
  const decode = s => { const layer = (s/(cols*rows))|0, rem = s%(cols*rows); return [rem%cols, (rem/cols)|0, layer]; };
  const dist = (sa,sb) => { const [xa,ya,la]=decode(sa), [xb,yb,lb]=decode(sb); return Math.abs(xa-xb)+Math.abs(ya-yb)+Math.abs(la-lb)*3; };
  const cost = () => { let s = 0; for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) if(w[i][j]) s += w[i][j]*dist(slotOf[i],slotOf[j]); return s; };
  const swap = (a,b) => { const ra=roomAt[a], rb=roomAt[b]; roomAt[a]=rb; roomAt[b]=ra; if(ra>=0) slotOf[ra]=b; if(rb>=0) slotOf[rb]=a; };
  let E = cost(), best = E, bestSlot = slotOf.slice(), T = 8;
  for(let s = 1; s <= 2200; s++){ let a,b; do{ a=(r()*slots)|0; b=(r()*slots)|0; }while(a===b||(roomAt[a]<0&&roomAt[b]<0));
    swap(a,b); const E2 = cost(), d = E2-E; if(d<=0||r()<Math.exp(-d/T)){ E=E2; if(E<best){best=E;bestSlot=slotOf.slice();} } else swap(a,b);
    if(s%40===0) T*=.92; }
  const cellPix = Math.min(W,H)*.12, X = [cellPix*.86,-cellPix*.5], Y = [cellPix*.86,cellPix*.5];
  const baseX = W*.5, baseY = H*.82, gap = H*.24;
  const ptOf = s => { const [xx,yy,layer] = decode(s), oy = baseY-layer*gap, ox = baseX-(X[0]*cols+Y[0]*rows)/2;
    return [ox+X[0]*(xx+.5)+Y[0]*(yy+.5), oy+X[1]*(xx+.5)+Y[1]*(yy+.5)]; };
  for(let layer = 0; layer < layers; layer++){ const oy = baseY-layer*gap, ox = baseX-(X[0]*cols+Y[0]*rows)/2;
    for(let yy = 0; yy < rows; yy++) for(let xx = 0; xx < cols; xx++){
      const x0 = ox+X[0]*xx+Y[0]*yy, y0 = oy+X[1]*xx+Y[1]*yy;
      g.beginPath(); g.moveTo(x0,y0); g.lineTo(x0+X[0],y0+X[1]); g.lineTo(x0+X[0]+Y[0],y0+X[1]+Y[1]); g.lineTo(x0+Y[0],y0+Y[1]); g.closePath();
      g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.stroke(); } }
  for(let i = 0; i < n; i++){ const [x,y] = ptOf(bestSlot[i]);
    g.fillStyle = U.rgba(c, .25+.5*((i*37%n)/n)); g.beginPath(); g.arc(x,y,cellPix*.22,0,U.TAU); g.fill();
    g.strokeStyle = U.rgba(c,.95); g.lineWidth = 1.2; g.stroke(); }
  g.lineCap = "round";
  for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) if(w[i][j]){
    const [,,la] = decode(bestSlot[i]), [,,lb] = decode(bestSlot[j]), p = ptOf(bestSlot[i]), q = ptOf(bestSlot[j]);
    g.strokeStyle = la===lb ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)"; g.lineWidth = .6+w[i][j]*.6;
    g.setLineDash(la===lb ? [] : [2,3]); g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); g.setLineDash([]); }
};
// V08 多目標懲罰：外牆、日照與面積──底色由上到下漸暖代表南向採光，每個房間旁的三瓣圖示是外牆／採光／需求分數
ART.var["F07"][7] = function(g, W, H, r, c, U){
  const cols = 4, rows = 4, slots = cols*rows, n = 8;
  const w = [...Array(n)].map(() => new Float32Array(n));
  const link = (i,j,x) => { w[i][j] = w[j][i] = Math.max(w[i][j], x); };
  for(let i = 0; i < n-1; i++) link(i, i+1, 2+((r()*3)|0));
  const desire = [...Array(n)].map(() => r());
  const extCell = s => { const x=s%cols, y=(s/cols)|0; return x===0||x===cols-1||y===0||y===rows-1; };
  const southScore = s => ((s/cols)|0)/(rows-1);
  const extra = (i,slot) => { const want = desire[i], ext = extCell(slot)?1:0, sun = southScore(slot); return (1-(ext*.6+sun*.4))*want*6; };
  const order = [...Array(slots).keys()];
  for(let k = slots-1; k > 0; k--){ const m = (r()*(k+1))|0; [order[k],order[m]] = [order[m],order[k]]; }
  const slotOf = order.slice(0,n), roomAt = new Int16Array(slots).fill(-1); slotOf.forEach((s,i) => roomAt[s] = i);
  const dist = (sa,sb) => Math.abs(sa%cols-sb%cols)+Math.abs(((sa/cols)|0)-((sb/cols)|0));
  const cost = () => { let s = 0; for(let i = 0; i < n; i++){ s += extra(i, slotOf[i]); for(let j = i+1; j < n; j++) if(w[i][j]) s += w[i][j]*dist(slotOf[i],slotOf[j])*.5; } return s; };
  const swap = (a,b) => { const ra=roomAt[a], rb=roomAt[b]; roomAt[a]=rb; roomAt[b]=ra; if(ra>=0) slotOf[ra]=b; if(rb>=0) slotOf[rb]=a; };
  let E = cost(), best = E, bestSlot = slotOf.slice(), T = 6;
  for(let s = 1; s <= 2200; s++){ let a,b; do{ a=(r()*slots)|0; b=(r()*slots)|0; }while(a===b||(roomAt[a]<0&&roomAt[b]<0));
    swap(a,b); const E2 = cost(), d = E2-E; if(d<=0||r()<Math.exp(-d/T)){ E=E2; if(E<best){best=E;bestSlot=slotOf.slice();} } else swap(a,b);
    if(s%40===0) T*=.92; }
  const pad = Math.min(W,H)*.09, cell = Math.min((W-pad*2)/cols,(H-pad*2)/rows), ox=(W-cell*cols)/2, oy=(H-cell*rows)/2;
  const ctr = s => [ox+(s%cols+.5)*cell, oy+(((s/cols)|0)+.5)*cell];
  const grad = g.createLinearGradient(0,oy,0,oy+cell*rows); grad.addColorStop(0,"rgba(255,255,255,.02)"); grad.addColorStop(1,"rgba(242,184,75,.12)");
  g.fillStyle = grad; g.fillRect(ox,oy,cell*cols,cell*rows);
  for(let s = 0; s < slots; s++) g.strokeRect(ox+(s%cols)*cell+.5, oy+((s/cols)|0)*cell+.5, cell-1, cell-1);
  g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1;
  for(let i = 0; i < n; i++){ const [x,y] = ctr(bestSlot[i]), h = cell*.4;
    g.fillStyle = U.rgba(c, .15+.55*desire[i]); g.fillRect(x-h,y-h,h*2,h*2);
    g.strokeStyle = U.rgba(c,.9); g.lineWidth = 1.1; g.strokeRect(x-h,y-h,h*2,h*2);
    const ext = extCell(bestSlot[i])?1:0, sun = southScore(bestSlot[i]);
    [ext, sun, desire[i]].forEach((v,k) => { const ang = -Math.PI/2 + k*U.TAU/3, rr = h*.3+h*.5*v;
      g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(ang)*rr, y+Math.sin(ang)*rr); g.stroke(); });
  }
  g.lineCap = "round";
  for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) if(w[i][j]){ const p = ctr(bestSlot[i]), q = ctr(bestSlot[j]);
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = .5+w[i][j]*.5; g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); }
};
// V09 Timer 動畫：看見降溫過程──早期幾格半透明疊影，最後一格不透明凍結，下方溫度條從金到冷色
ART.var["F07"][8] = function(g, W, H, r, c, U){
  const cols = 4, rows = 3, slots = cols*rows, n = 7;
  const w = [...Array(n)].map(() => new Float32Array(n));
  const link = (i,j,x) => { w[i][j] = w[j][i] = Math.max(w[i][j], x); };
  for(let i = 0; i < n-1; i++) link(i, i+1, 2+((r()*4)|0));
  const order = [...Array(slots).keys()];
  for(let k = slots-1; k > 0; k--){ const m = (r()*(k+1))|0; [order[k],order[m]] = [order[m],order[k]]; }
  const slotOf = order.slice(0,n), roomAt = new Int16Array(slots).fill(-1); slotOf.forEach((s,i) => roomAt[s] = i);
  const dist = (sa,sb) => Math.abs(sa%cols-sb%cols)+Math.abs(((sa/cols)|0)-((sb/cols)|0));
  const cost = () => { let s = 0; for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) if(w[i][j]) s += w[i][j]*dist(slotOf[i],slotOf[j]); return s; };
  const swap = (a,b) => { const ra=roomAt[a], rb=roomAt[b]; roomAt[a]=rb; roomAt[b]=ra; if(ra>=0) slotOf[ra]=b; if(rb>=0) slotOf[rb]=a; };
  let E = cost(), T = 8, steps = 2000, snapAt = [0,300,700,1300,2000], frames = [];
  frames.push(slotOf.slice());
  for(let s = 1; s <= steps; s++){ let a,b; do{ a=(r()*slots)|0; b=(r()*slots)|0; }while(a===b||(roomAt[a]<0&&roomAt[b]<0));
    swap(a,b); const E2 = cost(), d = E2-E; if(d<=0||r()<Math.exp(-d/T)) E=E2; else swap(a,b);
    if(s%40===0) T*=.92;
    if(snapAt.includes(s)) frames.push(slotOf.slice()); }
  const pad = Math.min(W,H)*.1, cell = Math.min((W-pad*2)/cols,(H-pad*2)/rows), ox=(W-cell*cols)/2, oy=(H-cell*rows)*.42;
  const ctr = s => [ox+(s%cols+.5)*cell, oy+(((s/cols)|0)+.5)*cell];
  frames.forEach((slot,fi) => { const alpha = .12+.22*fi/(frames.length-1), last = fi===frames.length-1;
    for(let i = 0; i < n; i++){ const [x,y] = ctr(slot[i]), h = cell*.4;
      g.fillStyle = U.rgba(c, last ? .5 : alpha); g.fillRect(x-h,y-h,h*2,h*2);
      if(last){ g.strokeStyle = U.rgba(c,.95); g.lineWidth = 1.3; g.strokeRect(x-h,y-h,h*2,h*2); } } });
  const by = oy+cell*rows+pad*.6, bw = W-pad*2;
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(pad,by,bw,10);
  const gr = g.createLinearGradient(pad,0,pad+bw,0); gr.addColorStop(0,GOLD); gr.addColorStop(1,U.rgba(c,.3));
  g.fillStyle = gr; g.fillRect(pad,by,bw,10);
  frames.forEach((f,k) => { g.fillStyle = "#fff"; g.beginPath(); g.arc(pad+bw*k/(frames.length-1), by+5, 2, 0, U.TAU); g.fill(); });
};
// V10 單點、族群、群體：對照 F04──三欄各畫收斂曲線＋搜尋樣式：單點軌跡、族群散布方塊、群體收斂放射
ART.var["F07"][9] = function(g, W, H, r, c, U){
  const pad = Math.min(W,H)*.08, colW = (W-pad*2)/3;
  function curve(kind){ const steps = 60, h = []; let v = 1;
    for(let i = 0; i < steps; i++){
      if(kind===0){ v += (r()-.55)*.12*Math.max(.1,1-i/steps); v = Math.max(.05,v); }
      else if(kind===1){ if(i%6===0) v *= .82+r()*.05; }
      else v = v*.94 + .02*r();
      h.push(v); }
    return h; }
  for(let k = 0; k < 3; k++){
    const x0 = pad+k*colW, gx = x0+colW*.1, gw = colW*.8, gy = H*.1, gh = H*.42;
    const h = curve(k), mx = Math.max(...h), mn = Math.min(...h), sp = Math.max(1e-6,mx-mn);
    g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1; g.beginPath(); g.moveTo(gx,gy); g.lineTo(gx,gy+gh); g.lineTo(gx+gw,gy+gh); g.stroke();
    U.poly(g, h.map((v,i) => [gx+gw*i/(h.length-1), gy+gh*(1-(v-mn)/sp)]));
    g.strokeStyle = U.rgba(c,.9); g.lineWidth = 1.3; g.stroke();
    const by = H*.62, bh = H*.3, cx = x0+colW/2, cy = by+bh/2;
    if(k===0){ g.fillStyle = U.rgba(c,.9); g.beginPath(); g.arc(cx,cy,4,0,U.TAU); g.fill(); }
    else if(k===1){ for(let i = 0; i < 10; i++){ const a = r()*U.TAU, d = r()*bh*.4;
      g.fillStyle = U.rgba(c, .5+r()*.4); g.fillRect(cx+Math.cos(a)*d-2, cy+Math.sin(a)*d-2, 4, 4); } }
    else { for(let i = 0; i < 14; i++){ const a = i/14*U.TAU, d = bh*.35*(1-(i%3)*.1);
      g.strokeStyle = U.rgba(c,.55); g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+Math.cos(a)*d, cy+Math.sin(a)*d); g.stroke();
      g.fillStyle = U.rgba(c,.9); g.beginPath(); g.arc(cx+Math.cos(a)*d, cy+Math.sin(a)*d, 2, 0, U.TAU); g.fill(); } }
    if(k>0){ g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x0,0); g.lineTo(x0,H); g.stroke(); }
  }
};
// V11 泡泡圖轉牆線與門洞──底層是半透明泡泡圖鬼影，上層是實牆線，鄰接處留出門洞缺口
ART.var["F07"][10] = function(g, W, H, r, c, U){
  const cols = 3, rows = 3, slots = cols*rows, n = 7;
  const w = [...Array(n)].map(() => new Float32Array(n));
  const link = (i,j,x) => { w[i][j] = w[j][i] = Math.max(w[i][j], x); };
  for(let i = 0; i < n-1; i++) link(i, i+1, 2+((r()*4)|0));
  for(let k = 0; k < n; k++){ const i=(r()*n)|0, j=(r()*n)|0; if(i!==j) link(i,j,1+((r()*3)|0)); }
  const order = [...Array(slots).keys()];
  for(let k = slots-1; k > 0; k--){ const m = (r()*(k+1))|0; [order[k],order[m]] = [order[m],order[k]]; }
  const slotOf = order.slice(0,n), roomAt = new Int16Array(slots).fill(-1); slotOf.forEach((s,i) => roomAt[s] = i);
  const dist = (sa,sb) => Math.abs(sa%cols-sb%cols)+Math.abs(((sa/cols)|0)-((sb/cols)|0));
  const cost = () => { let s = 0; for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) if(w[i][j]) s += w[i][j]*dist(slotOf[i],slotOf[j]); return s; };
  const swap = (a,b) => { const ra=roomAt[a], rb=roomAt[b]; roomAt[a]=rb; roomAt[b]=ra; if(ra>=0) slotOf[ra]=b; if(rb>=0) slotOf[rb]=a; };
  let E = cost(), best = E, bestSlot = slotOf.slice(), T = 6;
  for(let s = 1; s <= 1800; s++){ let a,b; do{ a=(r()*slots)|0; b=(r()*slots)|0; }while(a===b||(roomAt[a]<0&&roomAt[b]<0));
    swap(a,b); const E2 = cost(), d = E2-E; if(d<=0||r()<Math.exp(-d/T)){ E=E2; if(E<best){best=E;bestSlot=slotOf.slice();} } else swap(a,b);
    if(s%40===0) T*=.92; }
  const pad = Math.min(W,H)*.09, cell = Math.min((W-pad*2)/cols,(H-pad*2)/rows), ox=(W-cell*cols)/2, oy=(H-cell*rows)/2;
  const ctr = s => [ox+(s%cols+.5)*cell, oy+(((s/cols)|0)+.5)*cell];
  g.globalAlpha = .35;
  for(let i = 0; i < n; i++){ const [x,y] = ctr(bestSlot[i]); g.fillStyle = U.rgba(c,.25); g.beginPath(); g.arc(x,y,cell*.32,0,U.TAU); g.fill(); }
  for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++) if(w[i][j]){ const p = ctr(bestSlot[i]), q = ctr(bestSlot[j]);
    g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = .5+w[i][j]*.4; g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); }
  g.globalAlpha = 1;
  g.strokeStyle = "#fff"; g.lineWidth = 1.6;
  for(let i = 0; i < n; i++){ const s = bestSlot[i], sx = s%cols, sy = (s/cols)|0, x0 = ox+sx*cell, y0 = oy+sy*cell;
    const edges = [[x0,y0,x0+cell,y0],[x0+cell,y0,x0+cell,y0+cell],[x0+cell,y0+cell,x0,y0+cell],[x0,y0+cell,x0,y0]];
    edges.forEach(([ax,ay,bx,by]) => {
      let door = false;
      for(let j = 0; j < n; j++) if(j !== i && w[i][j]){ const s2 = bestSlot[j]; if(Math.abs(s2-s)===1 || Math.abs(s2-s)===cols) door = true; }
      if(door && r() < .5){ const mx=(ax+bx)/2, my=(ay+by)/2, dx=(bx-ax)*.18, dy=(by-ay)*.18;
        g.beginPath(); g.moveTo(ax,ay); g.lineTo(mx-dx,my-dy); g.stroke();
        g.beginPath(); g.moveTo(mx+dx,my+dy); g.lineTo(bx,by); g.stroke(); }
      else { g.beginPath(); g.moveTo(ax,ay); g.lineTo(bx,by); g.stroke(); }
    });
  }
};
// V12 形狀退火：用 A05 規則當鄰域──從三角形反覆長出新節點（淡入的早期世代），最後一代實線＋修剪
ART.var["F07"][11] = function(g, W, H, r, c, U){
  const pad = Math.min(W,H)*.12;
  let nodes = [[W*.5-70,H*.72],[W*.5+70,H*.72],[W*.5,H*.72-100]];
  let edges = [[0,1],[1,2],[2,0]];
  const gens = [edges.map(e => e.slice())], steps = 6+((r()*3)|0);
  for(let s = 0; s < steps; s++){
    const ei = (r()*edges.length)|0, [a,b] = edges[ei], [ax,ay] = nodes[a], [bx,by] = nodes[b];
    const mx = (ax+bx)/2, my = (ay+by)/2, dx = bx-ax, dy = by-ay, len = Math.hypot(dx,dy)||1;
    const nx = -dy/len, ny = dx/len, sign = my < H*.55 ? -1 : (r()<.5?-1:1), h = len*(.5+r()*.4);
    nodes.push([mx+nx*h*sign, my+ny*h*sign]); const ni = nodes.length-1;
    edges.push([a,ni],[b,ni]); gens.push(edges.map(e => e.slice()));
  }
  const finalEdges = edges.filter(([a,b]) => Math.hypot(nodes[a][0]-nodes[b][0], nodes[a][1]-nodes[b][1]) < Math.min(W,H)*.5);
  gens.forEach((es,gi) => { const alpha = gi===gens.length-1 ? .95 : .1+.12*gi/(gens.length-1);
    g.strokeStyle = U.rgba(c, alpha); g.lineWidth = gi===gens.length-1 ? 1.6 : 1;
    es.forEach(([a,b]) => { g.beginPath(); g.moveTo(nodes[a][0],nodes[a][1]); g.lineTo(nodes[b][0],nodes[b][1]); g.stroke(); }); });
  finalEdges.forEach(([a,b]) => { g.strokeStyle = "#fff"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(nodes[a][0],nodes[a][1]); g.lineTo(nodes[b][0],nodes[b][1]); g.stroke(); });
  nodes.forEach(([x,y]) => { g.fillStyle = U.rgba(c,.9); g.beginPath(); g.arc(x,y,2.4,0,U.TAU); g.fill(); });
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(pad*.4,H*.74); g.lineTo(W-pad*.4,H*.74); g.stroke();
};

/* ================= 沒有照片的案例 ================= */
// F07-01 Architectural Layout Design SA：等角鳥瞰的住宅基地——建築量體依退火定案的位置擠出成盒子
// （頂面亮、兩側面分深淺），地面上的虛線是從隨機起點搬到定案位置的軌跡，陰影朝向代表日照評估，下緣是基地前的道路
ART.case["F07-01"] = function(g, W, H, r, c, U){
  const S = 100, objs = [...Array(7)].map(() => ({w: S*(.13+r()*.1), h: S*(.1+r()*.08)}));
  const {init, best} = placeAnneal(r, objs, {w:S, h:S}, {steps:1600, T0:S*.2});
  const hts = best.map(() => S*(.07+r()*.2));
  const k = Math.min(W/(S*1.85), H/(S*1.45)), ox = W*.5, oy = H*.26;
  const iso = (x,y,z) => [ox + (x - y)*.866*k, oy + (x + y)*.5*k - z*k];
  const quad = (pts, fill, stroke) => { U.poly(g, pts, true); g.fillStyle = fill; g.fill(); if(stroke){ g.strokeStyle = stroke; g.lineWidth = .8; g.stroke(); } };
  // 道路（基地左下緣外側）與基地地面
  quad([iso(-6,S+4,0), iso(S+6,S+4,0), iso(S+6,S+16,0), iso(-6,S+16,0)], "rgba(190,190,205,.28)");
  g.strokeStyle = "rgba(255,255,255,.5)"; g.setLineDash([4,4]); g.lineWidth = 1; U.poly(g, [iso(-6,S+10,0), iso(S+6,S+10,0)]); g.stroke(); g.setLineDash([]);
  quad([iso(0,0,0), iso(S,0,0), iso(S,S,0), iso(0,S,0)], "rgba(255,255,255,.07)", "rgba(255,255,255,.4)");
  const dims = o => (Math.round(o.a/(Math.PI/2))%2) ? [o.h,o.w] : [o.w,o.h];
  // 搬移軌跡
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.setLineDash([2,3]);
  init.forEach((o,i) => { const a = iso(o.x,o.y,0), b = iso(best[i].x,best[i].y,0); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke();
    g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(a[0]-1.5, a[1]-1.5, 3, 3); });
  g.setLineDash([]);
  // 陰影：太陽在右上（平面 −y 方向），影子往 +y 拖長
  best.forEach((o,i) => { const [w,h] = dims(o), s = hts[i]*.9;
    quad([iso(o.x-w/2,o.y-h/2,0), iso(o.x+w/2,o.y-h/2,0), iso(o.x+w/2,o.y+h/2+s,0), iso(o.x-w/2,o.y+h/2+s,0)], "rgba(0,0,0,.32)"); });
  // 量體：依深度（x+y）由遠到近畫
  best.map((o,i) => i).sort((i,j) => (best[i].x+best[i].y) - (best[j].x+best[j].y)).forEach(i => {
    const o = best[i], [w,h] = dims(o), x0 = o.x-w/2, x1 = o.x+w/2, y0 = o.y-h/2, y1 = o.y+h/2, z = hts[i];
    quad([iso(x0,y1,0), iso(x1,y1,0), iso(x1,y1,z), iso(x0,y1,z)], U.rgba(c,.55), "rgba(15,15,20,.6)");
    quad([iso(x1,y0,0), iso(x1,y1,0), iso(x1,y1,z), iso(x1,y0,z)], U.rgba(c,.28), "rgba(15,15,20,.6)");
    quad([iso(x0,y0,z), iso(x1,y0,z), iso(x1,y1,z), iso(x0,y1,z)], U.rgba(c,.92), "rgba(255,255,255,.7)");
  });
  const sx = W*.88, sy = H*.1; g.fillStyle = GOLD; g.beginPath(); g.arc(sx, sy, 4, 0, U.TAU); g.fill();
  g.strokeStyle = U.rgba(GOLD,.7); g.lineWidth = 1;
  for(let a = 0; a < 8; a++){ const t = a/8*U.TAU; g.beginPath(); g.moveTo(sx+Math.cos(t)*6, sy+Math.sin(t)*6); g.lineTo(sx+Math.cos(t)*9, sy+Math.sin(t)*9); g.stroke(); }
};
ART.case["F07-01"].ratio = 1.1;
// F07-02 Shape Annealing（Cagan）：五個逐步演化的形狀縮圖，箭頭串接，最後一個是被接受的設計
ART.case["F07-02"] = function(g, W, H, r, c, U){
  const n = 5, pad = Math.min(W,H)*.1, gap = (W-pad*2)/(n-1);
  let shape = [[0,-14],[12,10],[-12,10]];
  const shapes = [shape.map(p => p.slice())];
  for(let i = 1; i < n; i++){
    const ei = (r()*shape.length)|0, a = shape[ei], b = shape[(ei+1)%shape.length];
    const mx = (a[0]+b[0])/2, my = (a[1]+b[1])/2, dx = b[0]-a[0], dy = b[1]-a[1], len = Math.hypot(dx,dy)||1;
    const nx = -dy/len, ny = dx/len, h = len*(.4+r()*.3)*(r()<.5?1:-1);
    shape = [...shape.slice(0,ei+1), [mx+nx*h,my+ny*h], ...shape.slice(ei+1)];
    shapes.push(shape.map(p => p.slice()));
  }
  const cy = H*.5, s = Math.min(gap,H)*.34;
  shapes.forEach((sh,i) => { const cx = pad+i*gap;
    if(i>0){ g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(pad+(i-1)*gap+s*.9, cy); g.lineTo(cx-s*.9, cy); g.stroke();
      g.beginPath(); g.moveTo(cx-s*.9,cy); g.lineTo(cx-s*.9-6,cy-4); g.lineTo(cx-s*.9-6,cy+4); g.closePath(); g.fillStyle = "rgba(255,255,255,.4)"; g.fill(); }
    const last = i===shapes.length-1;
    g.fillStyle = last ? U.rgba(c,.4) : U.rgba(c, .12+.06*i);
    g.strokeStyle = last ? U.rgba(c,1) : "rgba(255,255,255,.5)"; g.lineWidth = last ? 1.6 : 1;
    g.beginPath(); sh.forEach(([x,y],k) => { const px = cx+x/16*s, py = cy+y/16*s; k ? g.lineTo(px,py) : g.moveTo(px,py); });
    g.closePath(); g.fill(); g.stroke();
  });
};
ART.case["F07-02"].ratio = .6;
// F07-03 形狀退火圓頂家族：不同目標（最大體積、最小表面、構件種類最少）得到的三個測地圓頂——
// 扁圓頂、半球、高尖頂；三角面片依左上光源上明暗，前排放大的是目前選中的解，
// 上方三個圓是各自的測地分割圖樣（俯視平面）
ART.case["F07-03"] = function(g, W, H, r, c, U){
  const tilt = .32, ct = Math.cos(tilt), st = Math.sin(tilt), [cr,cg,cb] = U.rgb(c);
  const L = (() => { const v = [-.75,-.35,.6], m = Math.hypot(...v); return v.map(x => x/m); })();
  const bb = H*.8, bf = H*.9;
  g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1; g.beginPath(); g.moveTo(W*.03, bb); g.lineTo(W*.97, bb); g.stroke();
  const domes = [{cx:W*.2, R:W*.16, prof:.55, rings:4, base:bb, px:W*.2}, {cx:W*.8, R:W*.14, prof:1.6, rings:5, base:bb, px:W*.8}, {cx:W*.5, R:W*.27, prof:1, rings:6, base:bf, px:W*.5, pick:true}];
  domes.forEach((d, di) => { const base = d.base;
    const seg = 10 + 2*d.rings, V = [];
    for(let i = 0; i <= d.rings; i++){ const phi = i/d.rings*Math.PI/2, row = [], m = i === d.rings ? 1 : seg;
      for(let j = 0; j < m; j++){ const th = (j + (i%2)*.5)/seg*U.TAU + r()*.04;
        const x = d.R*Math.cos(phi)*Math.cos(th), y = d.R*Math.cos(phi)*Math.sin(th), z = d.R*d.prof*Math.pow(Math.sin(phi), d.prof > 1.2 ? .8 : 1);
        row.push([x,y,z]); }
      V.push(row); }
    const F = [];
    for(let i = 0; i < d.rings; i++){ const A = V[i], B = V[i+1];
      for(let j = 0; j < seg; j++){
        if(B.length === 1){ F.push([A[j], A[(j+1)%seg], B[0]]); continue; }
        if(i%2 === 0){ F.push([A[j], A[(j+1)%seg], B[j]]); F.push([A[(j+1)%seg], B[(j+1)%seg], B[j]]); }
        else { F.push([A[j], A[(j+1)%seg], B[(j+1)%seg]]); F.push([A[j], B[(j+1)%seg], B[j]]); } } }
    const P2 = p => [d.cx + p[0], base - p[2]*ct - p[1]*st];
    // 地面影子
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(d.cx + d.R*.25, base + 2, d.R*1.15, d.R*st*1.05, 0, 0, U.TAU); g.fill();
    const faces = F.map(f => { const u = f[1].map((v,k) => v - f[0][k]), w = f[2].map((v,k) => v - f[0][k]);
      let n = [u[1]*w[2]-u[2]*w[1], u[2]*w[0]-u[0]*w[2], u[0]*w[1]-u[1]*w[0]]; const m = Math.hypot(...n) || 1; n = n.map(x => x/m);
      const cen = [0,1,2].map(k => (f[0][k]+f[1][k]+f[2][k])/3); if(n[0]*cen[0] + n[1]*cen[1] + n[2]*cen[2] < 0) n = n.map(x => -x);
      return {f, n, depth: cen[1]}; })
      .filter(o => -o.n[1]*ct + o.n[2]*st > 0).sort((a,b) => b.depth - a.depth);
    const shade = n => { const lam = Math.max(0, n[0]*L[0] + n[1]*L[1] + n[2]*L[2]), k = .15 + .85*lam, wht = lam*lam*.55;
      return `rgb(${Math.round(cr*k*(1-wht) + 255*wht)},${Math.round(cg*k*(1-wht) + 255*wht)},${Math.round(cb*k*(1-wht) + 255*wht)})`; };
    faces.forEach(({f, n}) => { U.poly(g, f.map(P2), true); g.fillStyle = shade(n); g.fill();
      g.strokeStyle = d.pick ? "rgba(255,255,255,.55)" : "rgba(12,12,16,.55)"; g.lineWidth = .7; g.stroke(); });
    // 俯視平面：同一組三角面片往下壓平，看出測地分割的圖樣
    const pr = Math.min(W*.11, H*.16), sc = pr/d.R, py = H*.2;
    F.forEach(f => { U.poly(g, f.map(p => [d.px + p[0]*sc, py + p[1]*sc]), true); g.fillStyle = U.rgba(c, .12 + .5*(f[0][2]+f[1][2]+f[2][2])/(3*d.R*d.prof)); g.fill();
      g.strokeStyle = d.pick ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.3)"; g.lineWidth = .6; g.stroke(); });
    if(d.pick){ g.strokeStyle = "#fff"; g.lineWidth = 1.4; g.beginPath(); g.arc(d.px, py, pr + 4, 0, U.TAU); g.stroke(); }
  });
};
ART.case["F07-03"].ratio = .85;
// F07-04 eifForm：桁架依規則長出後以應力色階上色，藍到紅代表低到高應力，底部支承、頂端載重箭頭
ART.case["F07-04"] = function(g, W, H, r, c, U){
  const pad = Math.min(W,H)*.12;
  let nodes = [[W*.2,H*.75],[W*.8,H*.75],[W*.5,H*.75-100]];
  let edges = [[0,1],[1,2],[2,0]];
  for(let s = 0; s < 8; s++){
    const ei = (r()*edges.length)|0, [a,b] = edges[ei], [ax,ay] = nodes[a], [bx,by] = nodes[b];
    const mx = (ax+bx)/2, my = (ay+by)/2, dx = bx-ax, dy = by-ay, len = Math.hypot(dx,dy)||1;
    const nx = -dy/len, ny = dx/len, sign = my > H*.4 ? -1 : (r()<.5?-1:1), h = len*(.45+r()*.35);
    nodes.push([mx+nx*h*sign, my+ny*h*sign]); const ni = nodes.length-1;
    edges.push([a,ni],[b,ni]);
  }
  edges.forEach(([a,b]) => { const [ax,ay] = nodes[a], [bx,by] = nodes[b], len = Math.hypot(ax-bx,ay-by);
    const stress = Math.min(1, len/(Math.min(W,H)*.28)*(.4+r()*.6));
    g.strokeStyle = heat(stress); g.lineWidth = 1.4+stress*1.6;
    g.beginPath(); g.moveTo(ax,ay); g.lineTo(bx,by); g.stroke(); });
  nodes.forEach(([x,y]) => { g.fillStyle = "#fff"; g.beginPath(); g.arc(x,y,2,0,U.TAU); g.fill(); });
  [0,1].forEach(i => { const [x,y] = nodes[i]; g.fillStyle = "rgba(255,255,255,.7)";
    g.beginPath(); g.moveTo(x,y); g.lineTo(x-7,y+11); g.lineTo(x+7,y+11); g.closePath(); g.fill(); });
  const top = nodes.reduce((m,p) => p[1]<m[1] ? p : m, nodes[0]);
  g.strokeStyle = "#fff"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(top[0],top[1]-26); g.lineTo(top[0],top[1]-4); g.stroke();
  g.beginPath(); g.moveTo(top[0],top[1]-4); g.lineTo(top[0]-4,top[1]-11); g.lineTo(top[0]+4,top[1]-11); g.closePath(); g.fillStyle = "#fff"; g.fill();
};
ART.case["F07-04"].ratio = .85;
// F07-05 Make it Home：客廳家具以連續鄰域退火擺放，金色三角形是沙發到電視的可視範圍，虛線是動線
ART.case["F07-05"] = function(g, W, H, r, c, U){
  const pad = Math.min(W,H)*.08, rw = W-pad*2, rh = H-pad*2;
  const objs = [{w:rw*.32,h:rh*.13},{w:rw*.05,h:rh*.28},{w:rw*.16,h:rh*.1},{w:rw*.1,h:rh*.16},{w:rw*.14,h:rh*.08}];
  const {best} = placeAnneal(r, objs, {w:rw,h:rh}, {steps:1500, T0:rw*.22});
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.strokeRect(pad,pad,rw,rh);
  g.save(); g.translate(pad,pad);
  const sofa = best[0], tv = best[1];
  g.fillStyle = U.rgba(GOLD, .12); g.beginPath(); g.moveTo(sofa.x,sofa.y);
  g.lineTo(tv.x-tv.h/2, tv.y-tv.w/2); g.lineTo(tv.x+tv.h/2, tv.y+tv.w/2); g.closePath(); g.fill();
  best.forEach((o,i) => { g.save(); g.translate(o.x,o.y); g.rotate(o.a);
    g.fillStyle = U.rgba(c, .22+.5*(i/best.length)); g.fillRect(-o.w/2,-o.h/2,o.w,o.h);
    g.strokeStyle = U.rgba(c,.95); g.lineWidth = 1.2; g.strokeRect(-o.w/2,-o.h/2,o.w,o.h); g.restore(); });
  g.strokeStyle = "rgba(255,255,255,.4)"; g.setLineDash([3,3]); g.lineWidth = 1;
  g.beginPath(); g.moveTo(rw*.06, rh*.06); g.quadraticCurveTo(rw*.5, rh*.12, rw*.94, rh*.5); g.stroke(); g.setLineDash([]);
  g.restore();
};
ART.case["F07-05"].ratio = 1.15;
// F07-06 Galapagos 模擬退火求解器：上方簡化元件鏈，下方是對數降溫地貌，一顆球滾落到谷底
ART.case["F07-06"] = function(g, W, H, r, c, U){
  const ny = H*.18, boxes = [[W*.1,60,34],[W*.32,60,34],[W*.54,70,34],[W*.78,60,34]];
  boxes.forEach(([x,bw,bh],i) => { g.fillStyle = "rgba(255,255,255,.08)"; g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1;
    g.fillRect(x-bw/2, ny-bh/2, bw, bh); g.strokeRect(x-bw/2, ny-bh/2, bw, bh);
    if(i < boxes.length-1){ const nx = boxes[i+1][0]; g.strokeStyle = U.rgba(c,.6); g.beginPath(); g.moveTo(x+bw/2,ny); g.lineTo(nx-boxes[i+1][1]/2,ny); g.stroke(); } });
  const gx = W*.1, gy = H*.42, gw = W*.8, gh = H*.46;
  const land = x => 1 - Math.pow(x,.4) + .12*Math.sin(x*18)*Math.pow(1-x,1.4);
  g.beginPath(); for(let i = 0; i <= 100; i++){ const x = i/100, y = land(x), px = gx+gw*x, py = gy+gh*(1-y)*.9+gh*.05; i ? g.lineTo(px,py) : g.moveTo(px,py); }
  g.strokeStyle = U.rgba(c,.9); g.lineWidth = 1.6; g.stroke();
  g.strokeStyle = "rgba(255,255,255,.35)"; g.setLineDash([3,3]); g.beginPath();
  for(let i = 0; i <= 100; i++){ const x = i/100, y = 1-Math.log(1+x*9)/Math.log(10), px = gx+gw*x, py = gy+gh*.92+gh*.06*(1-y); i ? g.lineTo(px,py) : g.moveTo(px,py); }
  g.stroke(); g.setLineDash([]);
  const bx0 = .72, by0 = land(bx0), path = [];
  for(let x = .02; x <= bx0; x += .02) path.push([x, land(x)]);
  path.forEach(([x,y],i) => { const px = gx+gw*x, py = gy+gh*(1-y)*.9+gh*.05; g.fillStyle = U.rgba(c, .15+.5*i/path.length); g.beginPath(); g.arc(px,py,3,0,U.TAU); g.fill(); });
  const fx = gx+gw*bx0, fy = gy+gh*(1-by0)*.9+gh*.05;
  g.fillStyle = GOLD; g.beginPath(); g.arc(fx,fy,5,0,U.TAU); g.fill();
};
ART.case["F07-06"].ratio = 1.2;
// F07-07 幾何背包排版：板面內盡量緊密放入矩形（模擬形狀退火的放置／移動），一個被拒絕的形狀留在板外虛線
ART.case["F07-07"] = function(g, W, H, r, c, U){
  const pad = Math.min(W,H)*.08, bw = W-pad*2, bh = H-pad*2;
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.6; g.strokeRect(pad,pad,bw,bh);
  const shapes = [];
  function tryPlace(w0,h0){ for(let t = 0; t < 200; t++){ const x = pad+r()*(bw-w0), y = pad+r()*(bh-h0);
    if(shapes.every(s => x+w0<s.x||x>s.x+s.w||y+h0<s.y||y>s.y+s.h)) return {x,y,w:w0,h:h0}; } return null; }
  for(let i = 0; i < 16; i++){ const w0 = bw*(.08+r()*.12), h0 = bh*(.08+r()*.12), p = tryPlace(w0,h0); if(p) shapes.push(p); }
  shapes.forEach((s,i) => { g.fillStyle = U.rgba(c, .18+.5*(i/shapes.length)); g.fillRect(s.x,s.y,s.w,s.h);
    g.strokeStyle = U.rgba(c,.9); g.lineWidth = 1; g.strokeRect(s.x,s.y,s.w,s.h); });
  const rw = Math.min(W,H)*.14, rh = Math.min(W,H)*.09, rx = W-pad*.6, ry = pad*.4;
  g.strokeStyle = "rgba(255,255,255,.35)"; g.setLineDash([3,3]); g.strokeRect(rx,ry,rw,rh); g.setLineDash([]);
};
ART.case["F07-07"].ratio = .85;
// F07-51 TSP with R and Shiny：地圖網格上撒城市點，2-opt 退火解出的巡迴路線，下方是成本曲線
ART.case["F07-51"] = function(g, W, H, r, c, U){
  const pad = Math.min(W,H)*.1, mw = W-pad*2, mh = H*.62;
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1;
  for(let i = 0; i <= 6; i++){ const x = pad+mw*i/6; g.beginPath(); g.moveTo(x,pad); g.lineTo(x,pad+mh); g.stroke(); }
  for(let j = 0; j <= 4; j++){ const y = pad+mh*j/4; g.beginPath(); g.moveTo(pad,y); g.lineTo(pad+mw,y); g.stroke(); }
  const n = 16+((r()*6)|0), pts = []; for(let i = 0; i < n; i++) pts.push([pad+r()*mw, pad+r()*mh]);
  const {order, hist} = tspAnneal(r, pts, {steps:2200});
  g.strokeStyle = U.rgba(c,.9); g.lineWidth = 1.5; g.lineJoin = "round";
  g.beginPath(); order.forEach((idx,k) => { const [x,y] = pts[idx]; k ? g.lineTo(x,y) : g.moveTo(x,y); }); g.closePath(); g.stroke();
  pts.forEach(([x,y]) => { g.fillStyle = "#fff"; g.beginPath(); g.arc(x,y,2.4,0,U.TAU); g.fill(); });
  const gy = H*.78, gh = H*.16, mx = Math.max(...hist), mn = Math.min(...hist), sp = Math.max(1e-6,mx-mn);
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.beginPath(); g.moveTo(pad,gy); g.lineTo(pad,gy+gh); g.lineTo(pad+mw,gy+gh); g.stroke();
  U.poly(g, hist.map((e,k) => [pad+mw*k/(hist.length-1), gy+gh*(1-(e-mn)/sp)])); g.strokeStyle = c; g.lineWidth = 1.2; g.stroke();
};
ART.case["F07-51"].ratio = 1.15;
// F07-52 Traveling Pixel：像素箭頭圖案的每個黑點，用退火求最短走訪路徑，畫成單線
ART.case["F07-52"] = function(g, W, H, r, c, U){
  const n = 16, cell = Math.min(W,H)*.85/n, ox = (W-cell*n)/2, oy = (H-cell*n)/2, mask = [];
  for(let y = 0; y < n; y++) for(let x = 0; x < n; x++){
    const cx = n/2, cy = n/2, dx = x-cx, dy = y-cy;
    const inShaft = Math.abs(dx) < n*.08 && dy > -n*.05 && dy < n*.35;
    const inHead = dy < -n*.02 && dy > -n*.32 && Math.abs(dx) < (dy+n*.32)*.9;
    if(inShaft || inHead) mask.push([x,y]);
  }
  const pts = mask.map(([x,y]) => [ox+(x+.5)*cell, oy+(y+.5)*cell]);
  mask.forEach(([x,y]) => { g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(ox+x*cell, oy+y*cell, cell*.92, cell*.92); });
  const {order} = tspAnneal(r, pts, {steps:2000});
  g.strokeStyle = U.rgba(c,.95); g.lineWidth = 1.4; g.lineJoin = "round";
  g.beginPath(); order.forEach((idx,k) => { const [x,y] = pts[idx]; k ? g.lineTo(x,y) : g.moveTo(x,y); }); g.stroke();
};
ART.case["F07-52"].ratio = 1;
// F07-53 Graph Layout：節點以連續退火分散避免重疊與交叉，實心圓漸層代表節點順序
ART.case["F07-53"] = function(g, W, H, r, c, U){
  const pad = Math.min(W,H)*.1, n = 10, edges = [];
  for(let i = 0; i < n-1; i++) edges.push([i,i+1]);
  for(let k = 0; k < 6; k++){ const i = (r()*n)|0, j = (r()*n)|0; if(i!==j) edges.push([i,j]); }
  const pos = [...Array(n)].map(() => [pad+r()*(W-pad*2), pad+r()*(H-pad*2)]);
  const cross = (p1,p2,p3,p4) => { const d = (p2[0]-p1[0])*(p4[1]-p3[1])-(p2[1]-p1[1])*(p4[0]-p3[0]); if(!d) return false;
    const t = ((p3[0]-p1[0])*(p4[1]-p3[1])-(p3[1]-p1[1])*(p4[0]-p3[0]))/d, s = ((p3[0]-p1[0])*(p2[1]-p1[1])-(p3[1]-p1[1])*(p2[0]-p1[0]))/d;
    return t>0 && t<1 && s>0 && s<1; };
  const cost = () => { let s = 0;
    for(let i = 0; i < n; i++) for(let j = i+1; j < n; j++){ const d = Math.hypot(pos[i][0]-pos[j][0],pos[i][1]-pos[j][1]); if(d<40) s += (40-d); }
    for(const [a,b] of edges) s += Math.hypot(pos[a][0]-pos[b][0],pos[a][1]-pos[b][1])*.03;
    for(let i = 0; i < edges.length; i++) for(let j = i+1; j < edges.length; j++){ const [a,b] = edges[i], [cc,dd] = edges[j];
      if(a===cc||a===dd||b===cc||b===dd) continue; if(cross(pos[a],pos[b],pos[cc],pos[dd])) s += 15; }
    return s; };
  let E = cost(), T = 30;
  for(let s = 1; s <= 900; s++){ const i = (r()*n)|0, old = pos[i].slice();
    pos[i][0] = Math.max(pad, Math.min(W-pad, pos[i][0]+(r()-.5)*60));
    pos[i][1] = Math.max(pad, Math.min(H-pad, pos[i][1]+(r()-.5)*60));
    const E2 = cost(), d = E2-E; if(d<=0||r()<Math.exp(-d/T)) E=E2; else pos[i]=old;
    if(s%20===0) T*=.94; }
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1;
  edges.forEach(([a,b]) => { g.beginPath(); g.moveTo(pos[a][0],pos[a][1]); g.lineTo(pos[b][0],pos[b][1]); g.stroke(); });
  pos.forEach(([x,y],i) => { g.fillStyle = U.rgba(c, .3+.6*(i/n)); g.beginPath(); g.arc(x,y,6,0,U.TAU); g.fill();
    g.strokeStyle = U.rgba(c,.95); g.lineWidth = 1.2; g.stroke(); });
};
ART.case["F07-53"].ratio = .95;
// F07-54 TSP Art 單線肖像：以拒絕取樣在橢圓臉與五官附近加密撒點，2-opt 退火求出封閉單線路徑
ART.case["F07-54"] = function(g, W, H, r, c, U){
  const cx = W/2, cy = H*.46, rx = Math.min(W,H)*.32, ry = rx*1.15, pts = [];
  for(let i = 0; i < 220; i++){
    const a = r()*U.TAU, rr = Math.sqrt(r());
    let x = cx+Math.cos(a)*rx*rr, y = cy+Math.sin(a)*ry*rr;
    if(r() < .3){ const eye = r()<.5 ? [-.32,-.1] : [.32,-.1]; x = cx+eye[0]*rx+(r()-.5)*rx*.15; y = cy+eye[1]*ry+(r()-.5)*ry*.12; }
    else if(r() < .15){ x = cx+(r()-.5)*rx*.5; y = cy+ry*.35+(r()-.5)*ry*.08; }
    pts.push([x,y]);
  }
  const {order} = tspAnneal(r, pts, {steps:2400});
  g.strokeStyle = U.rgba(c,.9); g.lineWidth = 1; g.lineJoin = "round";
  g.beginPath(); order.forEach((idx,k) => { const [x,y] = pts[idx]; k ? g.lineTo(x,y) : g.moveTo(x,y); }); g.closePath(); g.stroke();
};
ART.case["F07-54"].ratio = 1.1;
// F07-55 Primitive：用半透明三角形、橢圓、矩形一層層疊出目標橢圓輪廓的近似（爬山／退火都可用同一鄰域）
ART.case["F07-55"] = function(g, W, H, r, c, U){
  const cx = W/2, cy = H/2, R = Math.min(W,H)*.34;
  g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1; g.beginPath(); g.ellipse(cx,cy,R,R*.8,0,0,U.TAU); g.stroke();
  const shapesN = 40;
  for(let i = 0; i < shapesN; i++){
    const t = i/shapesN, a = r()*U.TAU, d = Math.sqrt(r())*R*(.3+t*.7);
    const x = cx+Math.cos(a)*d, y = cy+Math.sin(a)*d*.85, kind = i%3;
    g.fillStyle = U.rgba(c, .12+.1*r());
    if(kind===0){ const s = R*(.15+r()*.2), rot = r()*U.TAU;
      g.beginPath(); for(let k = 0; k < 3; k++){ const ang = rot+k*U.TAU/3, px = x+Math.cos(ang)*s, py = y+Math.sin(ang)*s; k ? g.lineTo(px,py) : g.moveTo(px,py); }
      g.closePath(); g.fill(); }
    else if(kind===1){ g.beginPath(); g.ellipse(x,y, R*(.08+r()*.12), R*(.05+r()*.1), r()*U.TAU, 0, U.TAU); g.fill(); }
    else { const w0 = R*(.1+r()*.18), h0 = R*(.06+r()*.12), rot = r()*U.TAU;
      g.save(); g.translate(x,y); g.rotate(rot); g.fillRect(-w0/2,-h0/2,w0,h0); g.restore(); }
  }
};
ART.case["F07-55"].ratio = 1;
})();
