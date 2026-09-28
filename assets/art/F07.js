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
