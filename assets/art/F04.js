/* F04 基因演算法：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
ART.var["F04"] = ART.var["F04"] || [];

/* V01 換適應度：最大化日照或視野──基地內量體投影陰影，點群避開陰影往光照處聚集 */
ART.var["F04"][0] = function(g, W, H, r, c, U){
  const pad = W*.08, x0 = pad, y0 = pad, x1 = W-pad, y1 = H-pad*1.6;
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1.2; g.strokeRect(x0,y0,x1-x0,y1-y0);
  const mw = (x1-x0)*.28, mh = (y1-y0)*.34, mx = x0+(x1-x0)*.6, my = y0+(y1-y0)*.5;
  g.fillStyle = "rgba(20,20,26,.9)"; g.fillRect(mx,my,mw,mh);
  g.strokeStyle = "rgba(255,255,255,.35)"; g.strokeRect(mx,my,mw,mh);
  const sunA = -Math.PI*.32, sl = Math.max(W,H)*.6, shx = Math.cos(sunA)*sl, shy = Math.sin(sunA)*sl;
  g.fillStyle = "rgba(0,0,0,.35)";
  U.poly(g, [[mx,my],[mx+mw,my],[mx+mw+shx,my+shy],[mx+shx,my+shy]], true); g.fill();
  U.poly(g, [[mx,my+mh],[mx+mw,my+mh],[mx+mw+shx,my+mh+shy],[mx+shx,my+mh+shy]], true); g.fill();
  const sx = x1-pad*.4, sy = y0+pad*.2;
  g.strokeStyle = U.rgba(c,.5); g.lineWidth = 1;
  for(let k = 0; k < 8; k++){ const a = k/8*U.TAU; g.beginPath(); g.moveTo(sx+Math.cos(a)*6,sy+Math.sin(a)*6); g.lineTo(sx+Math.cos(a)*13,sy+Math.sin(a)*13); g.stroke(); }
  g.fillStyle = "#fff"; g.beginPath(); g.arc(sx,sy,5,0,U.TAU); g.fill();
  function blocked(px,py){
    if(px>mx && px<mx+mw && py>my && py<my+mh) return true;
    for(let s = 1; s <= 12; s++){ const t = s/12*.9, qx = px-shx*t*.15, qy = py-shy*t*.15;
      if(qx>mx && qx<mx+mw && qy>my && qy<my+mh) return true; }
    return false;
  }
  for(let i = 0; i < 70; i++){
    let px, py, tries = 0;
    do { px = x0+r()*(x1-x0); py = y0+r()*(y1-y0); tries++; } while(blocked(px,py) && tries < 6 && r() < .8);
    const lit = !blocked(px,py);
    g.fillStyle = lit ? U.rgba(c,.85) : "rgba(255,255,255,.15)";
    g.beginPath(); g.arc(px,py, lit?2.6:1.6, 0, U.TAU); g.fill();
  }
};

/* V02 多目標加權：分散又靠近邊界──左右兩種分布對照＋底部權重滑桿 */
ART.var["F04"][1] = function(g, W, H, r, c, U){
  const pad = W*.1, x0 = pad, y0 = H*.12, x1 = W-pad, y1 = H*.72, cx = (x0+x1)/2;
  g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1;
  g.strokeRect(x0,y0,(x1-x0)/2-6,y1-y0); g.strokeRect(cx+6,y0,(x1-x0)/2-6,y1-y0);
  const L = [];
  for(let i = 0; i < 24; i++){ let best = null, bd = -1;
    for(let k = 0; k < 6; k++){ const px = x0+8+r()*((x1-x0)/2-22), py = y0+8+r()*(y1-y0-16);
      let md = 1e9; for(const p of L) md = Math.min(md, Math.hypot(p[0]-px,p[1]-py));
      if(md > bd){ bd = md; best = [px,py]; } }
    L.push(best);
  }
  L.forEach(p => { g.fillStyle = U.rgba(c,.85); g.beginPath(); g.arc(p[0],p[1],3,0,U.TAU); g.fill(); });
  const rx0 = cx+6, rw = (x1-x0)/2-6;
  for(let i = 0; i < 24; i++){ const edge = (r()*4)|0; let px, py;
    if(edge === 0){ px = rx0+6+r()*(rw-12); py = y0+6+r()*10; }
    else if(edge === 1){ px = rx0+6+r()*(rw-12); py = y1-6-r()*10; }
    else if(edge === 2){ px = rx0+6+r()*10; py = y0+6+r()*(y1-y0-12); }
    else { px = rx0+rw-6-r()*10; py = y0+6+r()*(y1-y0-12); }
    g.fillStyle = "#fff"; g.beginPath(); g.arc(px,py,3,0,U.TAU); g.fill();
  }
  const sy = y1+pad*.55;
  const grad = g.createLinearGradient(x0,0,x1,0); grad.addColorStop(0,U.rgba(c,.9)); grad.addColorStop(1,"#ffffff");
  g.strokeStyle = grad; g.lineWidth = 3; g.beginPath(); g.moveTo(x0,sy); g.lineTo(x1,sy); g.stroke();
  const hx = x0+(x1-x0)*.5;
  g.fillStyle = "#1C1C24"; g.beginPath(); g.arc(hx,sy,6,0,U.TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.stroke();
};

/* V03 曲線邊界內配置：不規則封閉輪廓，點分散於內部，貼邊的點被拉回 */
ART.var["F04"][2] = function(g, W, H, r, c, U){
  const cx = W*.42, cy = H*.4, R = Math.min(W,H)*.36, N = 10, pts = [];
  const nz = U.vnoise((r()*9999)|0);
  for(let i = 0; i < N; i++){ const a = i/N*U.TAU, rad = R*(.72+.3*nz(Math.cos(a)*2+2,Math.sin(a)*2+2)); pts.push([cx+Math.cos(a)*rad, cy+Math.sin(a)*rad]); }
  g.fillStyle = U.rgba(c,.18); U.poly(g,pts,true); g.fill();
  g.strokeStyle = U.rgba(c,.9); g.lineWidth = 1.6; U.poly(g,pts,true); g.stroke();
  function inside(px,py){ let s = 0;
    for(let i = 0; i < N; i++){ const a = pts[i], b = pts[(i+1)%N];
      if((a[1]>py) !== (b[1]>py)){ const xi = a[0]+(py-a[1])/(b[1]-a[1])*(b[0]-a[0]); if(xi>px) s++; } }
    return s%2 === 1;
  }
  for(let i = 0; i < 55; i++){ let px = cx+(r()-.5)*R*2.1, py = cy+(r()-.5)*R*2.1, tries = 0;
    while(!inside(px,py) && tries < 20){ px = cx+(r()-.5)*R*2.1; py = cy+(r()-.5)*R*2.1; tries++; }
    if(!inside(px,py)) continue;
    g.fillStyle = tries>10 ? "#fff" : U.rgba(c,.85);
    g.beginPath(); g.arc(px,py,2.4,0,U.TAU); g.fill();
    if(tries>10){ g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.beginPath(); g.moveTo(px,py); g.lineTo(cx+(px-cx)*.85, cy+(py-cy)*.85); g.stroke(); }
  }
};

/* V04 升到 3D／曲面：彎曲屋面 UV 網格，點分布在曲面上（天窗） */
ART.var["F04"][3] = function(g, W, H, r, c, U){
  const cols = 14, rows = 8, ox = W*.12, oy = H*.28, sw = W*.76, sh = H*.5;
  function surf(u,v){ const bow = Math.sin(u*Math.PI)*sh*.22 + Math.sin(v*Math.PI*.5)*sh*.06;
    return [ox+u*sw, oy+v*sh*.6-bow]; }
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1;
  for(let j = 0; j <= rows; j++){ g.beginPath(); for(let i = 0; i <= cols; i++){ const [x,y] = surf(i/cols,j/rows); i?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); }
  for(let i = 0; i <= cols; i++){ g.beginPath(); for(let j = 0; j <= rows; j++){ const [x,y] = surf(i/cols,j/rows); j?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); }
  for(let i = 0; i < 32; i++){ const u = r(), v = r(), [x,y] = surf(u,v);
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.arc(x,y,5.5,0,U.TAU); g.stroke();
    g.fillStyle = U.rgba(c,.9); g.beginPath(); g.arc(x,y,3,0,U.TAU); g.fill();
  }
};

/* V05 基因改成滑桿參數：迷你 Galapagos──每個個體三條基因滑桿，對應生成的量體 */
ART.var["F04"][4] = function(g, W, H, r, c, U){
  const n = 6, pad = W*.08, sw = (W-pad*2)/n;
  const genes = [...Array(n)].map(() => [r(), r(), r()]);
  genes.forEach((gv,i) => { const x = pad+i*sw+sw*.2, bw = sw*.6;
    gv.forEach((val,k) => { const y = H*.14+k*10;
      g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x,y); g.lineTo(x+bw,y); g.stroke();
      g.fillStyle = k===0 ? U.rgba(c,.9) : (k===1 ? "#fff" : U.rgba(c,.5));
      g.beginPath(); g.arc(x+bw*val,y,3,0,U.TAU); g.fill();
    });
  });
  const by = H*.62, bh = H*.3;
  genes.forEach((gv,i) => { const cx = pad+i*sw+sw/2, w = sw*.5*(.5+gv[2]*.5), h = bh*(.3+gv[0]*.8);
    g.save(); g.translate(cx,by); g.rotate((gv[1]-.5)*.5);
    g.fillStyle = U.rgba(c,.25+(i/n)*.15); g.fillRect(-w/2,-h,w,h);
    g.strokeStyle = U.rgba(c,.9); g.lineWidth = 1.2; g.strokeRect(-w/2,-h,w,h);
    g.restore();
  });
  g.strokeStyle = "rgba(255,255,255,.15)"; g.beginPath(); g.moveTo(pad*.6,by); g.lineTo(W-pad*.6,by); g.stroke();
};

/* V06 吸子加權的評分：吸子光暈周圍點雲密、遠處疏 */
ART.var["F04"][5] = function(g, W, H, r, c, U){
  const attr = [[W*.18,H*.22],[W*.82,H*.78],[W*.5,H*.48]];
  attr.forEach(([ax,ay]) => { const gr = g.createRadialGradient(ax,ay,0,ax,ay,W*.22);
    gr.addColorStop(0,U.rgba(c,.35)); gr.addColorStop(1,U.rgba(c,0)); g.fillStyle = gr; g.beginPath(); g.arc(ax,ay,W*.22,0,U.TAU); g.fill(); });
  for(let i = 0; i < 160; i++){ const px = r()*W, py = r()*H*.9+H*.05;
    let md = 1e9; attr.forEach(([ax,ay]) => md = Math.min(md, Math.hypot(px-ax,py-ay)));
    const near = md < W*.16;
    if(!near && r() < .55) continue;
    g.fillStyle = near ? "#fff" : U.rgba(c,.5);
    g.beginPath(); g.arc(px,py, near?2.6:1.6, 0, U.TAU); g.fill();
  }
  attr.forEach(([ax,ay]) => { g.fillStyle = "#fff"; g.beginPath(); g.arc(ax,ay,3.5,0,U.TAU); g.fill(); });
};

/* V07 動畫化演化過程：底片格──每格一代，逐格從散亂到分散良好，播放頭停在最後一代 */
ART.var["F04"][6] = function(g, W, H, r, c, U){
  const frames = 6, pad = W*.05, fw = (W-pad*2)/frames, fh = H*.6, fy = H*.18;
  for(let i = 0; i < frames; i++){ const fx = pad+i*fw;
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(fx+3,fy,fw-6,fh);
    const n = 14, spread = .15+i/(frames-1)*.75;
    for(let k = 0; k < n; k++){ const a = k/n*U.TAU, rad = (fw*.32)*spread*(.6+.4*r());
      const px = fx+fw/2+Math.cos(a)*rad, py = fy+fh/2+Math.sin(a)*rad*(fh/fw);
      g.fillStyle = i===frames-1 ? "#fff" : U.rgba(c,.7); g.beginPath(); g.arc(px,py,2,0,U.TAU); g.fill(); }
  }
  g.fillStyle = "rgba(255,255,255,.25)";
  for(let i = 0; i < frames*3; i++){ const x = pad+i*(W-pad*2)/(frames*3)+4;
    g.beginPath(); g.arc(x, fy-6, 2, 0, U.TAU); g.fill();
    g.beginPath(); g.arc(x, fy+fh+6, 2, 0, U.TAU); g.fill(); }
  const hx = pad+(frames-1)*fw+fw/2;
  g.fillStyle = U.rgba(c,.9); g.beginPath(); g.moveTo(hx-6,fy+fh+14); g.lineTo(hx+6,fy+fh+14); g.lineTo(hx,fy+fh+6); g.closePath(); g.fill();
};

/* V08 混合 Voronoi 產生可製造圖樣：近似等面積蜂巢，單線分割可雷切 */
ART.var["F04"][7] = function(g, W, H, r, c, U){
  const n = 54, seeds = [...Array(n)].map(() => [r()*W, r()*H]);
  const gx = 64, gy = Math.round(gx*H/W), cw = W/gx, ch = H/gy, idx = new Int16Array(gx*gy);
  for(let j = 0; j < gy; j++) for(let i = 0; i < gx; i++){ const px = (i+.5)*cw, py = (j+.5)*ch; let bi = 0, bd = 1e9;
    for(let s = 0; s < n; s++){ const d = (seeds[s][0]-px)**2+(seeds[s][1]-py)**2; if(d<bd){ bd = d; bi = s; } }
    idx[j*gx+i] = bi;
  }
  const area = new Int32Array(n); idx.forEach(v => area[v]++);
  const target = (gx*gy)/n, mx = Math.max(...Array.from(area, a => Math.abs(a-target)));
  for(let j = 0; j < gy; j++) for(let i = 0; i < gx; i++){ const v = idx[j*gx+i], diff = Math.abs(area[v]-target)/(mx||1);
    g.fillStyle = U.rgba(c, .12+(1-diff)*.4); g.fillRect(i*cw,j*ch,cw+1,ch+1); }
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1;
  for(let j = 0; j < gy; j++) for(let i = 0; i < gx; i++){ const v = idx[j*gx+i];
    if(i<gx-1 && idx[j*gx+i+1]!==v){ g.beginPath(); g.moveTo((i+1)*cw,j*ch); g.lineTo((i+1)*cw,(j+1)*ch); g.stroke(); }
    if(j<gy-1 && idx[(j+1)*gx+i]!==v){ g.beginPath(); g.moveTo(i*cw,(j+1)*ch); g.lineTo((i+1)*cw,(j+1)*ch); g.stroke(); }
  }
};

/* V09 結構或性能外掛評分：多元件管線流程圖，中央節點掛結構位移色階 */
ART.var["F04"][8] = function(g, W, H, r, c, U){
  const nodes = [[W*.12,H*.5],[W*.36,H*.24],[W*.36,H*.76],[W*.62,H*.5],[W*.86,H*.5]];
  const edges = [[0,1],[0,2],[1,3],[2,3],[3,4]];
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.3;
  edges.forEach(([a,b]) => { g.beginPath(); g.moveTo(nodes[a][0],nodes[a][1]); g.lineTo(nodes[b][0],nodes[b][1]); g.stroke(); });
  g.strokeStyle = U.rgba(c,.5); g.setLineDash([4,3]);
  g.beginPath(); g.moveTo(nodes[4][0],nodes[4][1]); g.bezierCurveTo(nodes[4][0],H*.94,nodes[0][0],H*.94,nodes[0][0],nodes[0][1]); g.stroke(); g.setLineDash([]);
  nodes.forEach(([x,y],i) => { const s = i===3 ? 9 : 7;
    g.fillStyle = i===3 ? U.rgba(c,.85) : "rgba(255,255,255,.85)";
    g.fillRect(x-s,y-s,s*2,s*2);
    g.strokeStyle = "rgba(20,20,26,.6)"; g.lineWidth = 1; g.strokeRect(x-s,y-s,s*2,s*2);
  });
  const hx = nodes[3][0]-26, hy = nodes[3][1]+16;
  for(let i = 0; i < 10; i++){ const t = i/9; g.fillStyle = `hsl(${220-200*t},70%,${35+25*t}%)`; g.fillRect(hx+i*5.2,hy,5,10); }
};

/* V10 互動式演化：九宮格候選影像，使用者選出兩組當父母 */
ART.var["F04"][9] = function(g, W, H, r, c, U){
  const pad = W*.1, gx0 = pad, gy0 = H*.08, gw = W-pad*2, gh = H*.8, cell = gw/3;
  const nz = U.vnoise((r()*9999)|0);
  const sel = [((r()*3)|0)+((r()*3)|0)*3];
  while(sel.length < 2){ const k = (r()*9)|0; if(!sel.includes(k)) sel.push(k); }
  for(let k = 0; k < 9; k++){ const i = k%3, j = (k/3)|0, x = gx0+i*cell, y = gy0+j*cell;
    for(let px = 0; px < 10; px++) for(let py = 0; py < 10; py++){ const u = (px+.5)/10, v = (py+.5)/10;
      const n = nz(u*3+k*1.7, v*3+k*2.3);
      g.fillStyle = n>.55 ? U.rgba(c,.25+n*.5) : `rgba(255,255,255,${(0.08+n*0.15).toFixed(2)})`;
      g.fillRect(x+u*cell-cell/20, y+v*cell-cell/20, cell/9, cell/9);
    }
    g.strokeStyle = "rgba(255,255,255,.15)"; g.strokeRect(x+2,y+2,cell-4,cell-4);
    if(sel.includes(k)){ g.strokeStyle = "#fff"; g.lineWidth = 2.4; g.strokeRect(x+5,y+5,cell-10,cell-10);
      g.fillStyle = "#fff"; g.beginPath(); g.arc(x+cell-12,y+12,5,0,U.TAU); g.fill(); }
  }
};

/* V11 換搜尋機制：粒子群最佳化──多條粒子軌跡朝全域最佳解飛去 */
ART.var["F04"][10] = function(g, W, H, r, c, U){
  const gbest = [W*.22,H*.78], n = 22;
  const bgGrad = g.createLinearGradient(W,0,0,H);
  bgGrad.addColorStop(0,"rgba(0,0,0,0)"); bgGrad.addColorStop(1,U.rgba(c,.22));
  g.fillStyle = bgGrad; g.fillRect(0,0,W,H);
  for(let i = 0; i < n; i++){ let x = r()*W, y = r()*H*.7;
    const dx0 = gbest[0]-x, dy0 = gbest[1]-y, tail = [[x,y]];
    for(let s = 0; s < 5; s++){ x += dx0*(.14+r()*.08)+(r()-.5)*14; y += dy0*(.14+r()*.08)+(r()-.5)*14; tail.push([x,y]); }
    g.beginPath(); tail.forEach((p,k) => k ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]));
    g.strokeStyle = U.rgba(c,.4); g.lineWidth = 1; g.stroke();
    const [lx,ly] = tail[tail.length-1], [px,py] = tail[tail.length-2], ang = Math.atan2(ly-py,lx-px);
    g.save(); g.translate(lx,ly); g.rotate(ang); g.fillStyle = U.rgba(c,.9);
    g.beginPath(); g.moveTo(6,0); g.lineTo(-4,3); g.lineTo(-4,-3); g.closePath(); g.fill(); g.restore();
  }
  const gr = g.createRadialGradient(gbest[0],gbest[1],0,gbest[0],gbest[1],30);
  gr.addColorStop(0,"rgba(255,255,255,.9)"); gr.addColorStop(1,"rgba(255,255,255,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(gbest[0],gbest[1],30,0,U.TAU); g.fill();
  g.fillStyle = "#fff"; g.beginPath(); g.arc(gbest[0],gbest[1],4,0,U.TAU); g.fill();
};

/* V12 非支配排序多目標（NSGA-II／Pareto 前緣）：目標空間散佈圖（兩個目標都取越小越好）。
   真的做一次非支配排序：第 1 前緣白色連成階梯線，第 2、3… 前緣顏色漸淡；虛線框是某點的擁擠距離（左右鄰居圍出的長方形）；
   右側三個小框是前緣兩端與中間方案的點陣配置（最分散／折衷／最貼邊） */
ART.var["F04"][11] = function(g, W, H, r, c, U){
  const x0 = W*.12, x1 = W*.64, y0 = H*.08, y1 = H*.88, N = 64, pts = [];
  for(let i = 0; i < N; i++){ const a = r(), b = .05 + .55*Math.pow(1 - a, 2) + Math.pow(r(), 1.8)*.4; pts.push({f1:a, f2:b}); }
  // 快速非支配排序
  const dom = (p, q) => p.f1 <= q.f1 && p.f2 <= q.f2 && (p.f1 < q.f1 || p.f2 < q.f2);
  const cnt = pts.map(p => pts.filter(q => dom(q, p)).length), fronts = []; let left = pts.map((p, i) => i), done = new Set();
  while(left.length){ const F = left.filter(i => pts.filter((q, j) => !done.has(j) && dom(q, pts[i])).length === 0);
    F.forEach(i => { pts[i].rank = fronts.length; done.add(i); }); fronts.push(F.sort((i, j) => pts[i].f1 - pts[j].f1)); left = left.filter(i => !done.has(i)); }
  const X = v => x0 + v*(x1 - x0), Y = v => y1 - v*(y1 - y0);
  // 軸與格線
  g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1;
  for(let k = 1; k < 5; k++){ g.beginPath(); g.moveTo(X(k/5), y0); g.lineTo(X(k/5), y1); g.moveTo(x0, Y(k/5)); g.lineTo(x1, Y(k/5)); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x0, y0 - 4); g.lineTo(x0, y1); g.lineTo(x1 + 4, y1); g.stroke();
  // 各層前緣的階梯線
  fronts.slice(0, 4).forEach((F, k) => { if(F.length < 2) return; g.strokeStyle = k ? U.rgba(c, .55 - k*.12) : "#fff"; g.lineWidth = k ? 1 : 1.6; g.beginPath();
    F.forEach((i, t) => { const p = pts[i]; if(!t) g.moveTo(X(p.f1), Y(p.f2)); else { g.lineTo(X(p.f1), Y(pts[F[t-1]].f2)); g.lineTo(X(p.f1), Y(p.f2)); } }); g.stroke(); });
  // 擁擠距離：第 1 前緣中間一點，左右鄰居圍出的長方形
  const F0 = fronts[0], mid = F0[F0.length >> 1]; let mi = 0, best = -1;   // 取前緣中段擁擠距離最大的點
  for(let t = Math.min(2, F0.length - 2); t < F0.length - 2; t++){ const d = pts[F0[t+1]].f1 - pts[F0[t-1]].f1 + pts[F0[t-1]].f2 - pts[F0[t+1]].f2; if(d > best){ best = d; mi = t; } }
  if(mi > 0){ const a = pts[F0[mi-1]], b = pts[F0[mi+1]]; g.setLineDash([3, 2]); g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1;
    g.strokeRect(X(a.f1), Y(a.f2), X(b.f1) - X(a.f1), Y(b.f2) - Y(a.f2)); g.setLineDash([]); }
  // 點：依前緣層級上色
  pts.forEach(p => { const k = p.rank; g.fillStyle = k === 0 ? "#fff" : k < 4 ? U.rgba(c, .95 - k*.2) : "rgba(255,255,255,.18)";
    g.beginPath(); g.arc(X(p.f1), Y(p.f2), k === 0 ? 3.2 : 2.3, 0, U.TAU); g.fill(); });
  // 右側：前緣上三個方案回看點陣配置
  const pick = [F0[0], mid, F0[F0.length - 1]], bx = W*.72, bw = W*.23, bh = (y1 - y0 - 2*H*.04)/3;
  pick.forEach((i, k) => { const by = y0 + k*(bh + H*.04), p = pts[i];
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = .8; g.beginPath(); g.moveTo(X(p.f1) + 4, Y(p.f2)); g.lineTo(bx, by + bh/2); g.stroke();
    g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(bx, by, bw, bh); g.strokeStyle = U.rgba(c, .8); g.lineWidth = 1; g.strokeRect(bx, by, bw, bh);
    const ix = bx + bw*.1, iy = by + bh*.12, iw = bw*.8, ih = bh*.76; g.strokeStyle = "rgba(255,255,255,.45)"; g.strokeRect(ix, iy, iw, ih);
    const e = k/2;   // 0 最分散、1 最貼邊
    for(let q = 0; q < 12; q++){ let u, v; const gx = (q % 4 + .5)/4, gy = (((q/4)|0) + .5)/3;
      if(r() < e){ const t = r()*4, s = t % 1; [u, v] = t < 1 ? [s, 0] : t < 2 ? [1, s] : t < 3 ? [s, 1] : [0, s]; u = .04 + u*.92; v = .06 + v*.88; }
      else { u = gx + (r() - .5)*.12; v = gy + (r() - .5)*.14; }
      g.fillStyle = U.rgba(c, .95); g.beginPath(); g.arc(ix + u*iw, iy + v*ih, 1.9, 0, U.TAU); g.fill(); }
    g.fillStyle = "#fff"; g.beginPath(); g.arc(X(p.f1), Y(p.f2), 4.2, 0, U.TAU); g.fill(); g.strokeStyle = U.rgba(c, 1); g.lineWidth = 1.4; g.stroke(); });
};
ART.var["F04"][11].ratio = 1;

/* ---------- 沒有照片的案例（依 summary／category 取景） ---------- */

/* F04-01 Autodesk MaRS 多倫多辦公室：平面分區＋六項目標分數條 */
ART.case["F04-01"] = function(g, W, H, r, c, U){
  const pad = W*.08, x0 = pad, y0 = H*.1, x1 = W-pad, y1 = H*.72, cols = 8, rows = 5, cw = (x1-x0)/cols, ch = (y1-y0)/rows;
  const palette = [U.rgba(c,.55), "rgba(255,255,255,.4)", U.rgba(c,.22)];
  const nz = U.vnoise((r()*9999)|0);
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){ const n = nz(i*.5,j*.5), t = n<.33?0:(n<.66?1:2);
    g.fillStyle = palette[t]; g.fillRect(x0+i*cw+1,y0+j*ch+1,cw-2,ch-2); }
  g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1;
  for(let i = 0; i <= cols; i++){ g.beginPath(); g.moveTo(x0+i*cw,y0); g.lineTo(x0+i*cw,y1); g.stroke(); }
  for(let j = 0; j <= rows; j++){ g.beginPath(); g.moveTo(x0,y0+j*ch); g.lineTo(x1,y0+j*ch); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.5; g.strokeRect(x0,y0,x1-x0,y1-y0);
  const N = 6, bw = (x1-x0)/N-6, by = y1+H*.08;
  for(let k = 0; k < N; k++){ const v = .35+r()*.6, bx = x0+k*((x1-x0)/N);
    g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(bx,by,bw,H*.14);
    g.fillStyle = U.rgba(c,.8); g.fillRect(bx,by+H*.14*(1-v),bw,H*.14*v);
  }
};

/* F04-02 Autodesk University 拉斯維加斯展場配置：走道＋攤位＋人流路徑 */
ART.case["F04-02"] = function(g, W, H, r, c, U){
  const pad = W*.07, x0 = pad, y0 = H*.12, x1 = W-pad, y1 = H*.9, aisles = 5, booths = 4;
  g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1; g.strokeRect(x0,y0,x1-x0,y1-y0);
  const aw = (x1-x0)/aisles;
  for(let a = 0; a < aisles; a++){ const ax = x0+a*aw+aw*.1, bw = aw*.8, bh = (y1-y0)/booths*.62;
    for(let b = 0; b < booths; b++){ const by = y0+b*(y1-y0)/booths+(y1-y0)/booths*.15, hot = r() < .35;
      g.fillStyle = hot ? U.rgba(c,.7) : "rgba(255,255,255,.28)";
      g.fillRect(ax,by,bw,bh);
      g.strokeStyle = "rgba(20,20,26,.5)"; g.strokeRect(ax,by,bw,bh);
    }
  }
  g.strokeStyle = "#fff"; g.lineWidth = 1.4; g.globalAlpha = .55;
  for(let p = 0; p < 3; p++){ g.beginPath(); g.moveTo(x0+8, y0+10);
    for(let a = 0; a < aisles; a++){ const ax = x0+a*aw+aw*.5+(r()-.5)*aw*.3, ny = a%2 ? y1-10 : y0+10; g.lineTo(ax,ny); }
    g.stroke();
  }
  g.globalAlpha = 1;
};

/* F04-03 An Evolutionary Architecture：基因序列（左）透過規則遞迴生長出建築形態（右） */
ART.case["F04-03"] = function(g, W, H, r, c, U){
  const n = 16, x0 = W*.08, x1 = W*.42, y0 = H*.5;
  for(let i = 0; i < n; i++){ const x = x0+(x1-x0)*i/(n-1), h = H*(.08+(i%3)*.05+r()*.03);
    g.fillStyle = i%2 ? U.rgba(c,.8) : "rgba(255,255,255,.75)";
    g.fillRect(x-3, y0-h/2, 6, h);
  }
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x0-6,y0); g.lineTo(x1+6,y0); g.stroke();
  g.strokeStyle = U.rgba(c,.6); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x1+10,y0); g.lineTo(W*.56,y0); g.stroke();
  g.beginPath(); g.moveTo(W*.56,y0); g.lineTo(W*.56-8,y0-5); g.lineTo(W*.56-8,y0+5); g.closePath(); g.fillStyle = U.rgba(c,.6); g.fill();
  function branch(x,y,ang,len,depth){
    if(depth <= 0 || len < 4) return;
    const x2 = x+Math.cos(ang)*len, y2 = y+Math.sin(ang)*len;
    g.strokeStyle = U.rgba(c, .3+depth*.12); g.lineWidth = Math.max(.6,depth*.8);
    g.beginPath(); g.moveTo(x,y); g.lineTo(x2,y2); g.stroke();
    branch(x2,y2,ang-.45+r()*.15,len*.72,depth-1);
    branch(x2,y2,ang+.45+r()*.15,len*.72,depth-1);
  }
  branch(W*.62, H*.86, -Math.PI/2, H*.24, 6);
};

/* F04-04 Galapagos 演化求解器：收斂曲線＋一排滑桿，通用求解器介面 */
ART.case["F04-04"] = function(g, W, H, r, c, U){
  const pad = W*.1, x0 = pad, y0 = H*.1, x1 = W-pad, y1 = H*.6;
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x0,y1); g.lineTo(x1,y1); g.stroke();
  const N = 60, pts = []; let best = .15;
  for(let i = 0; i < N; i++){ best = Math.min(1, best+Math.max(0,(r()-.4))*.06);
    const jitter = (1-i/N)*.25*r();
    pts.push([x0+(x1-x0)*i/(N-1), y1-(y1-y0)*Math.min(1,best-jitter)]);
  }
  g.strokeStyle = U.rgba(c,.85); g.lineWidth = 1.6; U.poly(g,pts); g.stroke();
  g.fillStyle = "rgba(255,255,255,.12)"; U.poly(g,[...pts,[x1,y1],[x0,y1]],true); g.fill();
  const sN = 5, sw = (x1-x0-(sN-1)*8)/sN;
  for(let k = 0; k < sN; k++){ const sx = x0+k*(sw+8), sy = y1+H*.14, v = r();
    g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 3; g.beginPath(); g.moveTo(sx,sy); g.lineTo(sx+sw,sy); g.stroke();
    g.fillStyle = U.rgba(c,.9); g.beginPath(); g.arc(sx+sw*v,sy,3.6,0,U.TAU); g.fill();
  }
};

/* F04-05 Octopus 多目標演化最佳化：仿 Octopus 的三目標空間（牆角視角，三個目標都取越小越好）。
   每個解是一個小方塊：越早的世代越灰越淡、落在離原點遠處；非支配解（Pareto 前緣）是靠近牆角的白色方塊面；
   其中一個被點選的解畫出到三個座標面的投影虛線，觀察三個目標之間的取捨 */
ART.case["F04-05"] = function(g, W, H, r, c, U){
  const L = W*.46, ox = W*.5, oy = H*.47, cs = Math.cos(Math.PI/6);
  const P = (x, y, z) => [ox + (x - y)*cs*L, oy + (x + y)*.5*L - z*L];
  // 三個座標面的格線（地板、左牆、右牆）
  g.lineWidth = .7;
  for(let k = 0; k <= 5; k++){ const t = k/5; g.strokeStyle = k === 0 ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.1)";
    [[[t,0,0],[t,1,0]], [[0,t,0],[1,t,0]], [[0,t,0],[0,t,1]], [[0,0,t],[0,1,t]], [[t,0,0],[t,0,1]], [[0,0,t],[1,0,t]]].forEach(([a, b]) => {
      const A = P(...a), B = P(...b); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); }); }
  g.fillStyle = "rgba(255,255,255,.03)"; U.poly(g, [P(0,0,0), P(1,0,0), P(1,1,0), P(0,1,0)], true); g.fill();
  // 三個目標軸（由牆角往外，數值越大越差）
  [[1.12,0,0], [0,1.12,0], [0,0,1.12]].forEach(v => { const A = P(0,0,0), B = P(...v); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); g.fillStyle = "#fff"; g.beginPath(); g.arc(B[0], B[1], 2, 0, U.TAU); g.fill(); });
  // 解：G 個世代，每代 16 個；越後面的世代越靠近原點
  const G = 7, S = [];
  for(let gen = 0; gen < G; gen++) for(let i = 0; i < 16; i++){
    let d = [Math.abs(r() + r() - 1) + .08, Math.abs(r() + r() - 1) + .08, Math.abs(r() + r() - 1) + .08]; const l = Math.hypot(...d); d = d.map(v => v/l);
    const rad = .42 + (G - 1 - gen)*.085 + r()*.14; S.push({p:d.map(v => Math.min(.98, v*rad)), gen}); }
  const dom = (a, b) => a.p.every((v, k) => v <= b.p[k]) && a.p.some((v, k) => v < b.p[k]);
  S.forEach(s => { s.front = !S.some(t => t !== s && dom(t, s)); });
  // 由遠到近畫方塊（觀看方向約為 (1,1,1)，x+y+z 越小越遠、越先畫）
  const cube = (p, sz, top, lf, rt) => { const [x, y, z] = p, h = sz/2;
    const q = (dx, dy, dz) => P(x + dx*h, y + dy*h, z + dz*h);
    U.poly(g, [q(-1,-1,1), q(1,-1,1), q(1,1,1), q(-1,1,1)], true); g.fillStyle = top; g.fill();
    U.poly(g, [q(-1,1,1), q(1,1,1), q(1,1,-1), q(-1,1,-1)], true); g.fillStyle = lf; g.fill();
    U.poly(g, [q(1,-1,1), q(1,1,1), q(1,1,-1), q(1,-1,-1)], true); g.fillStyle = rt; g.fill(); };
  S.slice().sort((a, b) => (a.p[0] + a.p[1] + a.p[2]) - (b.p[0] + b.p[1] + b.p[2])).forEach(s => {
    if(s.front) cube(s.p, .05, "#ffffff", "rgba(210,225,230,1)", U.rgba(c, 1));
    else { const t = s.gen/(G - 1), al = .18 + .5*t; cube(s.p, .035, U.rgba(c, al), `rgba(0,0,0,${al*.6})`, `rgba(120,120,135,${al})`); } });
  // 點選一個前緣解：到三個座標面的投影
  const fr = S.filter(s => s.front).sort((a, b) => Math.abs(a.p[0] - a.p[1]) + Math.abs(a.p[1] - a.p[2]) - Math.abs(b.p[0] - b.p[1]) - Math.abs(b.p[1] - b.p[2]));
  if(fr.length){ const [x, y, z] = fr[0].p, A = P(x, y, z);
    g.setLineDash([3, 2]); g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1;
    [[x, y, 0], [0, y, z], [x, 0, z]].forEach(b => { const B = P(...b); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
      g.fillStyle = "#fff"; g.fillRect(B[0] - 1.5, B[1] - 1.5, 3, 3); });
    g.setLineDash([]); g.strokeStyle = U.rgba(c, 1); g.lineWidth = 1.6; g.beginPath(); g.arc(A[0], A[1], 7, 0, U.TAU); g.stroke(); }
};
ART.case["F04-05"].ratio = 1.05;

/* F04-06 Wallacei 都市形態研究：鳥瞰等角都市街廓場，依群集著色 */
ART.case["F04-06"] = function(g, W, H, r, c, U){
  function iso(x,y,z){ return [(x-z)*.87, (x+z)*.5-y]; }
  const ox = W*.5, oy = H*.16, s = Math.min(W,H)*.052, cols = 9, rows = 9;
  const clusters = [U.rgba(c,.9), "rgba(255,255,255,.85)", U.rgba(c,.42)];
  const order = []; for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++) order.push([i,j]);
  order.sort((a,b) => (a[0]+a[1])-(b[0]+b[1]));
  order.forEach(([i,j]) => { const cxg = i-cols/2, czg = j-rows/2;
    const h = ((1+((i*7+j*13)%5))*s*.42)*(.7+r()*.6);
    const p = (x,y,z) => { const [ix,iy] = iso(x,y,z); return [ox+ix*s, oy+iy*s]; };
    const b0 = p(cxg,0,czg), b1 = p(cxg+1,0,czg), b2 = p(cxg+1,0,czg+1), b3 = p(cxg,0,czg+1);
    const t0 = p(cxg,h/s,czg), t1 = p(cxg+1,h/s,czg), t2 = p(cxg+1,h/s,czg+1), t3 = p(cxg,h/s,czg+1);
    const cl = clusters[(i*3+j*7)%3];
    g.fillStyle = cl; U.poly(g,[t0,t1,t2,t3],true); g.fill();
    g.fillStyle = "rgba(0,0,0,.3)"; U.poly(g,[t1,t2,b2,b1],true); g.fill();
    g.fillStyle = "rgba(0,0,0,.15)"; U.poly(g,[t0,t3,b3,b0],true); g.fill();
    g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = .6; U.poly(g,[t0,t1,t2,t3],true); g.stroke();
  });
};
ART.case["F04-06"].ratio = 1.1;

/* F04-07 醫院建築日光與能耗多目標最佳化：立面開窗率／遮陽依模擬分數著色 */
ART.case["F04-07"] = function(g, W, H, r, c, U){
  const pad = W*.08, x0 = pad, y0 = H*.08, x1 = W-pad, y1 = H*.86, cols = 8, rows = 6, cw = (x1-x0)/cols, ch = (y1-y0)/rows;
  g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(x0,y0,x1-x0,y1-y0);
  const nz = U.vnoise((r()*9999)|0);
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){ const n = nz(i*.6,j*.6), wr = .3+n*.6, sx = x0+i*cw, sy = y0+j*ch;
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(sx+2,sy+2,cw-4,ch-4);
    const ww = (cw-8)*wr, wh = (ch-8)*wr, wx = sx+(cw-ww)/2, wy = sy+(ch-wh)/2;
    g.fillStyle = `hsla(${200-140*n},75%,${35+30*n}%,.85)`; g.fillRect(wx,wy,ww,wh);
    if(n > .6){ g.strokeStyle = "rgba(20,20,26,.7)"; g.lineWidth = 2; g.beginPath(); g.moveTo(wx,wy+wh*.15); g.lineTo(wx+ww,wy+wh*.15); g.stroke(); }
  }
};
ART.case["F04-07"].ratio = 1.25;

/* F04-08 殼體多目標最佳化基準測試：曲面殼體網格，依有限元素位移著色 */
ART.case["F04-08"] = function(g, W, H, r, c, U){
  const cols = 26, rows = 14, ox = W*.1, oy = H*.2, sw = W*.8, sh = H*.62;
  function shellPt(u,v){ const rise = Math.sin(u*Math.PI)*sh*.55;
    return [ox+u*sw, oy+sh-rise*(1-Math.abs(v-.5)*1.2)-v*sh*.06];
  }
  function stress(u,v){ return Math.max(0, Math.sin(u*Math.PI)*(1-Math.abs(v-.5)*1.6)); }
  for(let j = 0; j < rows-1; j++) for(let i = 0; i < cols-1; i++){
    const a = shellPt(i/(cols-1),j/(rows-1)), b = shellPt((i+1)/(cols-1),j/(rows-1)), cc = shellPt((i+1)/(cols-1),(j+1)/(rows-1)), d = shellPt(i/(cols-1),(j+1)/(rows-1));
    const t = stress((i+.5)/(cols-1),(j+.5)/(rows-1));
    g.fillStyle = `hsl(${210-170*t},75%,${30+30*t}%)`;
    U.poly(g,[a,b,cc,d],true); g.fill();
  }
  g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = .6;
  for(let j = 0; j < rows; j += 2){ g.beginPath(); for(let i = 0; i < cols; i++){ const [x,y] = shellPt(i/(cols-1),j/(rows-1)); i?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); }
};

/* F04-09 IAAC 結構形態基因最佳化：斜格構塔樓，依 Karamba 位移分數著色 */
ART.case["F04-09"] = function(g, W, H, r, c, U){
  const bx0 = W*.32, bx1 = W*.68, y0 = H*.08, y1 = H*.88, rows = 9, rh = (y1-y0)/rows;
  for(let j = 0; j < rows; j++){ const y = y0+j*rh, t = j/(rows-1);
    const width = (bx1-bx0)*(.55+.45*Math.sin(t*Math.PI*.5+.3)), cx = (bx0+bx1)/2, lx = cx-width/2, rx = cx+width/2;
    const disp = t*t*(.4+r()*.2);
    g.strokeStyle = `hsl(${210-170*disp},75%,${45+20*disp}%)`; g.lineWidth = 2;
    g.beginPath(); g.moveTo(lx,y); g.lineTo(rx,y+rh); g.stroke();
    g.beginPath(); g.moveTo(rx,y); g.lineTo(lx,y+rh); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(lx,y); g.lineTo(lx,y+rh); g.moveTo(rx,y); g.lineTo(rx,y+rh); g.stroke();
  }
  g.strokeStyle = "rgba(255,255,255,.2)"; g.beginPath(); g.moveTo(bx0-10,y1); g.lineTo(bx1+10,y1); g.stroke();
};
ART.case["F04-09"].ratio = 1.3;
})();
