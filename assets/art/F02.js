/* F02 伊斯蘭幾何圖樣（Hankin 法）：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = U.TAU;
ART.var["F02"] = ART.var["F02"] || [];

// ---- 共用：Hankin 構造（每條邊中點射出射線，與鄰邊射線相交成星形折點）----
// P：凸多邊形頂點；angleAt(i, mid, dir) 回傳第 i 邊的接觸角（徑度）
function hankinEdges(P, angleAt){
  const n = P.length, mids = [], dirs = [];
  for(let i = 0; i < n; i++){
    const a = P[i], b = P[(i+1)%n];
    const mx = (a[0]+b[0])/2, my = (a[1]+b[1])/2;
    const ex = b[0]-a[0], ey = b[1]-a[1], l = Math.hypot(ex,ey) || 1e-6, ux = ex/l, uy = ey/l, nx = -uy, ny = ux;
    const th = angleAt(i, [mx,my], [ux,uy]);
    mids.push([mx,my]);
    dirs.push([[Math.cos(th)*ux + Math.sin(th)*nx, Math.cos(th)*uy + Math.sin(th)*ny],
               [-Math.cos(th)*ux + Math.sin(th)*nx, -Math.cos(th)*uy + Math.sin(th)*ny]]);
  }
  const segs = [];
  for(let i = 0; i < n; i++){
    const j = (i+1)%n, p = mids[i], d1 = dirs[i][0], q = mids[j], d2 = dirs[j][1];
    const den = d1[0]*d2[1] - d1[1]*d2[0];
    if(Math.abs(den) < 1e-6){ segs.push([p, [(p[0]+q[0])/2,(p[1]+q[1])/2], q]); continue; }
    const t = ((q[0]-p[0])*d2[1] - (q[1]-p[1])*d2[0]) / den;
    segs.push([p, [p[0]+d1[0]*t, p[1]+d1[1]*t], q]);
  }
  return segs;
}
function strokeHankin(g, P, angleAt){
  for(const [p,x,q] of hankinEdges(P, angleAt)){ g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(x[0],x[1]); g.lineTo(q[0],q[1]); g.stroke(); }
}
function hexTile(s, W, H){
  const R = s*.6, hw = R*Math.sqrt(3), polys = [];
  for(let row = -1; row*R*1.5 < H+R; row++) for(let col = -1; col*hw < W+hw; col++){
    const cx = col*hw + (row%2 ? hw/2 : 0), cy = row*R*1.5;
    polys.push([...Array(6)].map((_,k) => [cx + R*Math.cos(Math.PI/6+k*TAU/6), cy + R*Math.sin(Math.PI/6+k*TAU/6)]));
  }
  return polys;
}
function sqTile(s, W, H){
  const polys = [];
  for(let y = -s; y < H+s; y += s) for(let x = -s; x < W+s; x += s) polys.push([[x,y],[x+s,y],[x+s,y+s],[x,y+s]]);
  return polys;
}
function triTile(s, W, H){
  const h = s*Math.sqrt(3)/2, polys = [];
  for(let row = -1; row*h < H+h; row++) for(let col = -2; col*s < W+s*2; col++){
    const x = col*s/2, y = row*h, up = (row+col)%2 === 0;
    polys.push(up ? [[x,y+h],[x+s/2,y],[x+s,y+h]] : [[x,y],[x+s,y],[x+s/2,y+h]]);
  }
  return polys;
}
function regPoly(cx, cy, R, n, rot){ return [...Array(n)].map((_,k) => [cx + R*Math.cos(rot+k*TAU/n), cy + R*Math.sin(rot+k*TAU/n)]); }

// V01 換底圖：上半三角形鋪面、下半六角形鋪面，同一接觸角畫出不同星形家族
ART.var["F02"][0] = function(g, W, H, r, c, U){
  const th = 50*Math.PI/180;
  g.save(); g.beginPath(); g.rect(0,0,W,H*.52); g.clip();
  g.strokeStyle = c; g.lineWidth = 1.3;
  for(const P of triTile(Math.min(W,H)/6, W, H)) strokeHankin(g, P, () => th);
  g.restore();
  g.save(); g.beginPath(); g.rect(0,H*.52,W,H*.48); g.clip();
  g.strokeStyle = U.rgba(c,.9); g.lineWidth = 1.3;
  for(const P of hexTile(Math.min(W,H)/5.5, W, H)) strokeHankin(g, P, () => th);
  g.restore();
  g.strokeStyle = "#fff"; g.globalAlpha = .35; g.lineWidth = 1; g.beginPath(); g.moveTo(0,H*.52); g.lineTo(W,H*.52); g.stroke(); g.globalAlpha = 1;
};

// V02 吸引子漸變接觸角：離吸引點越遠，星芒越尖細
ART.var["F02"][1] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/7, ax = W*(.25+r()*.5), ay = H*(.25+r()*.5), maxD = Math.hypot(W,H)*.5;
  g.lineWidth = 1.3;
  for(const P of sqTile(s, W, H)){
    const cx = (P[0][0]+P[2][0])/2, cy = (P[0][1]+P[2][1])/2;
    const d = Math.hypot(cx-ax, cy-ay)/maxD;
    const th = (18 + d*55) * Math.PI/180;
    g.strokeStyle = U.rgba(c, .35 + (1-Math.min(1,d))*.5);
    strokeHankin(g, P, () => th);
  }
  g.strokeStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.arc(ax,ay,s*1.15,0,TAU); g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); g.arc(ax,ay,4,0,TAU); g.fill();
};

// V03 兩點接觸（offset）：同一格內疊兩層不同尺度／角度的星形線，形成雙線與中心小多邊形
ART.var["F02"][2] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/3.6, th = 50*Math.PI/180;
  g.lineWidth = 1.2;
  for(const P of sqTile(s, W, H)){
    const cx = (P[0][0]+P[2][0])/2, cy = (P[0][1]+P[2][1])/2;
    const Pb = P.map(p => [cx + (p[0]-cx)*.86, cy + (p[1]-cy)*.86]);
    g.strokeStyle = U.rgba(c, .9); strokeHankin(g, P, () => th);
    g.strokeStyle = U.rgba(c, .5); strokeHankin(g, Pb, () => th*.8);
  }
};

// V04 交織帶（over-under strapwork）：線變成有厚度的帶，交叉處以背景色打斷模擬上下交織
ART.var["F02"][3] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/4.2, th = 50*Math.PI/180, bw = s*.12;
  const polys = hexTile(s, W, H), allSegs = [];
  for(const P of polys) allSegs.push(...hankinEdges(P, () => th));
  g.lineCap = "round"; g.lineJoin = "round";
  g.lineWidth = bw; g.strokeStyle = U.rgba(c,.92);
  for(const [p,x,q] of allSegs){ g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(x[0],x[1]); g.lineTo(q[0],q[1]); g.stroke(); }
  g.lineWidth = bw*.32; g.strokeStyle = "#1C1C24";
  for(const [p,x,q] of allSegs){ g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(x[0],x[1]); g.lineTo(q[0],q[1]); g.stroke(); }
  g.fillStyle = "#1C1C24";
  let k = 0;
  for(const P of polys){ const n = P.length; for(let i = 0; i < n; i++){ const a = P[i], b = P[(i+1)%n]; if((k++%2) === 0){ const mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2; g.beginPath(); g.arc(mx,my,bw*.6,0,TAU); g.fill(); } } }
};

// V05 girih 十角鋪面（五重對稱）：十邊形＋五邊形磁磚，接觸角固定 54°
ART.var["F02"][4] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/4.6, th = 54*Math.PI/180, hw = s*1.7;
  g.lineWidth = 1.4; g.strokeStyle = c;
  for(let row = -1; row*s*1.5 < H+s; row++) for(let col = -1; col*hw < W+hw; col++){
    const cx = col*hw + (row%2 ? hw/2 : 0), cy = row*s*1.5;
    strokeHankin(g, regPoly(cx,cy,s*.62,10,0), () => th);
    g.strokeStyle = U.rgba(c,.7);
    strokeHankin(g, regPoly(cx+hw/2, cy+s*.75, s*.32, 5, Math.PI/2), () => 72*Math.PI/180);
    g.strokeStyle = c;
  }
};

// V06 Penrose／準週期底圖：十角星以自相似比例向外分裂成小星，永不重複但處處局部對稱
ART.var["F02"][5] = function(g, W, H, r, c, U){
  const th = 54*Math.PI/180;
  function star(cx, cy, R, depth, a){
    g.strokeStyle = U.rgba(c, a); g.lineWidth = Math.max(.6, R*.045);
    strokeHankin(g, regPoly(cx,cy,R,10,0), () => th);
    if(depth <= 0 || R < 10) return;
    const r2 = R*.36;
    for(let k = 0; k < 5; k++){ const ang = k*TAU/5 + TAU/10;
      star(cx + (R-r2*1.02)*Math.cos(ang), cy + (R-r2*1.02)*Math.sin(ang), r2, depth-1, a*.85); }
  }
  star(W/2, H/2, Math.min(W,H)*.46, 2, .95);
};

// V07 Voronoi 自由底圖：抖動格點形成不規則四邊形，失去嚴格對稱但保留星形＋共用中點語彙
ART.var["F02"][6] = function(g, W, H, r, c, U){
  const n = 8, m = Math.round(n*H/W)+1, cw = W/n, ch = H/m;
  const pts = [];
  for(let j = 0; j <= m; j++){ pts.push([]); for(let i = 0; i <= n; i++) pts[j].push([i*cw + (r()-.5)*cw*.7, j*ch + (r()-.5)*ch*.7]); }
  g.strokeStyle = c; g.lineWidth = 1.3;
  for(let j = 0; j < m; j++) for(let i = 0; i < n; i++){
    const P = [pts[j][i], pts[j][i+1], pts[j+1][i+1], pts[j+1][i]];
    strokeHankin(g, P, () => (44 + (r()-.5)*18)*Math.PI/180);
  }
};

// V08 曲面上的星形圖樣：極座標網格＋壓扁比例模擬穹頂透視
ART.var["F02"][7] = function(g, W, H, r, c, U){
  const cx = W/2, cy = H*.06, rings = 6, seg = 14, R = Math.min(W,H)*1.05;
  g.strokeStyle = c; g.lineWidth = 1.2;
  for(let ring = 0; ring < rings; ring++){
    const r0 = R*Math.sin(ring/rings*Math.PI/2*.9), r1 = R*Math.sin((ring+1)/rings*Math.PI/2*.9);
    const squish = .5 + ring/rings*.5;
    for(let s2 = 0; s2 < seg; s2++){
      const a0 = s2/seg*TAU, a1 = (s2+1)/seg*TAU;
      const P = [
        [cx + r0*Math.cos(a0), cy + r0*Math.sin(a0)*squish],
        [cx + r1*Math.cos(a0), cy + r1*Math.sin(a0)*squish],
        [cx + r1*Math.cos(a1), cy + r1*Math.sin(a1)*squish],
        [cx + r0*Math.cos(a1), cy + r0*Math.sin(a1)*squish]
      ];
      strokeHankin(g, P, () => 48*Math.PI/180);
    }
  }
};

// V09 星形開口與面板輸出：線變成封閉面，實心填滿星形、縫隙留孔，模擬 CNC 穿孔板
ART.var["F02"][8] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/6, th = 50*Math.PI/180;
  g.fillStyle = U.rgba(c,.3); g.fillRect(0,0,W,H);
  for(const P of sqTile(s, W, H)){
    const star = hankinEdges(P, () => th).map(seg => seg[1]);
    g.fillStyle = c; g.strokeStyle = "#1C1C24"; g.lineWidth = 1;
    g.beginPath(); star.forEach((p,i) => i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1])); g.closePath(); g.fill(); g.stroke();
  }
};

// V10 日照驅動可動遮陽：依格點位置決定開合角度，呼應太陽路徑弧
ART.var["F02"][9] = function(g, W, H, r, c, U){
  const cols = 6, rows = 5, cw = W/cols, ch = H*.86/rows;
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const cx = (i+.5)*cw, cy = H*.12 + (j+.5)*ch;
    const open = Math.sin((i/cols)*Math.PI) * (.5+.5*Math.sin((j/rows)*Math.PI));
    const th = (20 + open*50) * Math.PI/180;
    g.strokeStyle = U.rgba(c, .5+open*.5); g.lineWidth = 1.2;
    strokeHankin(g, regPoly(cx,cy, Math.min(cw,ch)*.42, 8, TAU/16), () => th);
  }
  g.strokeStyle = "rgba(255,255,255,.35)"; g.setLineDash([2,3]);
  g.beginPath(); g.arc(W/2, H*1.05, H*.95, Math.PI*1.08, Math.PI*1.92); g.stroke(); g.setLineDash([]);
  g.fillStyle = "#fff"; g.beginPath(); g.arc(W*.78, H*.06, 3.5, 0, TAU); g.fill();
};

// V11 多層疊合（穹頂光影）：多層星形板沿高度堆疊，透明度遞增，地面留下光斑
ART.var["F02"][10] = function(g, W, H, r, c, U){
  const layers = 4, bandH = H*.16;
  for(let L = 0; L < layers; L++){
    const y0 = H*.06 + L*bandH*.9, s = Math.min(W,bandH)/1.6;
    g.save(); g.beginPath(); g.rect(0, y0, W, bandH*1.3); g.clip();
    g.strokeStyle = U.rgba(c, .32 + L*.16); g.lineWidth = 1;
    for(const P of sqTile(s, W, bandH*1.3)) strokeHankin(g, P.map(p => [p[0]+L*s*.15, p[1]+y0]), () => 50*Math.PI/180);
    g.restore();
  }
  g.fillStyle = "rgba(255,255,255,.55)";
  for(let k = 0; k < 46; k++){ const x = r()*W, y = H*.82 + r()*H*.16, rr = .6+r()*1.8; g.beginPath(); g.ellipse(x,y,rr*1.7,rr,0,0,TAU); g.fill(); }
};

// V12 星形內再長星形（遞迴）：把星形折點連成的中心多邊形當新底圖，縮小角度再套一次
ART.var["F02"][11] = function(g, W, H, r, c, U){
  const th = 50*Math.PI/180;
  function rec(P, depth, alpha){
    g.strokeStyle = U.rgba(c, alpha); g.lineWidth = Math.max(.6, 2.2 - depth*.5);
    const segs = hankinEdges(P, () => th);
    for(const [p,x,q] of segs){ g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(x[0],x[1]); g.lineTo(q[0],q[1]); g.stroke(); }
    if(depth <= 0) return;
    rec(segs.map(seg => seg[1]), depth-1, alpha*.8);
  }
  const s = Math.min(W,H)/3.6;
  for(const P of sqTile(s, W, H)) rec(P, 3, .95);
};

// V13 疊紋（Moiré）：兩層近乎相同的星形板疊合，其中一層微旋轉，產生干涉紋
ART.var["F02"][12] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/5, th = 50*Math.PI/180;
  g.lineWidth = 1;
  g.strokeStyle = U.rgba(c,.55);
  for(const P of sqTile(s, W, H)) strokeHankin(g, P, () => th);
  g.save(); g.translate(W/2, H/2); g.rotate(2.4*Math.PI/180); g.translate(-W/2, -H/2);
  g.strokeStyle = U.rgba(c,.55);
  for(const P of sqTile(s, W, H)) strokeHankin(g, P, () => th);
  g.restore();
};

// ---- 沒有照片的案例：獨立示意圖 ----

// F02-01 Hankin 的 polygons in contact 法：八角形網格構造線（虛線）＋星形線（實線）
ART.case["F02-01"] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/3.2, th = 45*Math.PI/180;
  const polys = [];
  for(let y = -s; y < H+s; y += s) for(let x = -s; x < W+s; x += s) polys.push(regPoly(x+s/2, y+s/2, s*.5, 8, Math.PI/8));
  g.strokeStyle = "rgba(255,255,255,.28)"; g.setLineDash([3,3]); g.lineWidth = 1;
  for(const P of polys){ g.beginPath(); P.forEach((p,i) => i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1])); g.closePath(); g.stroke(); }
  g.setLineDash([]);
  g.strokeStyle = c; g.lineWidth = 1.5;
  for(const P of polys) strokeHankin(g, P, () => th);
};

// F02-02 形式化為演算法：小圖網格逐格掃過接觸角參數，示範「少數參數→不同星形」
ART.case["F02-02"] = function(g, W, H, r, c, U){
  const cols = 3, rows = 4, cw = W/cols, ch = H/rows;
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const cx = (i+.5)*cw, cy = (j+.5)*ch, R = Math.min(cw,ch)*.36;
    const t = (i+j*cols)/(cols*rows), th = (20 + t*55)*Math.PI/180;
    g.strokeStyle = U.rgba(c, .5+t*.5); g.lineWidth = 1.2;
    strokeHankin(g, regPoly(cx,cy,R,6,0), () => th);
  }
};

// F02-05 準週期研究：girih 十角鋪面套在拱形立面剪影內，呼應「底圖＋線條規則＝演算法」
ART.case["F02-05"] = function(g, W, H, r, c, U){
  g.save();
  g.beginPath(); g.moveTo(W*.12,H); g.lineTo(W*.12,H*.42); g.arc(W/2,H*.42,W*.38,Math.PI,0); g.lineTo(W*.88,H); g.closePath(); g.clip();
  const s = Math.min(W,H)/5, th = 54*Math.PI/180, hw = s*1.7;
  g.strokeStyle = U.rgba(c,.9); g.lineWidth = 1.2;
  for(let row = -1; row*s*1.5 < H+s; row++) for(let col = -1; col*hw < W+hw; col++){
    const cx = col*hw + (row%2 ? hw/2 : 0), cy = row*s*1.5;
    strokeHankin(g, regPoly(cx,cy,s*.62,10,0), () => th);
  }
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(W*.12,H); g.lineTo(W*.12,H*.42); g.arc(W/2,H*.42,W*.38,Math.PI,0); g.lineTo(W*.88,H); g.stroke();
};
ART.case["F02-05"].ratio = 1.2;

// F02-09 Institut du Monde Arabe：感光光圈立面網格，每格依位置各自開合
ART.case["F02-09"] = function(g, W, H, r, c, U){
  const cols = 8, rows = 10, cw = W/cols, ch = H/rows;
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const cx = (i+.5)*cw, cy = (j+.5)*ch, R = Math.min(cw,ch)*.42;
    const open = .3 + .7*Math.abs(Math.sin((i/cols+j/rows)*Math.PI*1.3));
    g.strokeStyle = U.rgba(c, .5+open*.4); g.lineWidth = 1;
    strokeHankin(g, regPoly(cx,cy,R*open,8,TAU/16), () => 50*Math.PI/180);
    g.strokeStyle = "rgba(255,255,255,.14)"; g.strokeRect(i*cw+1, j*ch+1, cw-2, ch-2);
  }
};
ART.case["F02-09"].ratio = 1.25;

// F02-10 Al Bahr Towers：三角形模組立面，各模組依位置縮放開合，模擬傘狀遮陽單元
ART.case["F02-10"] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/6;
  for(const P of triTile(s, W, H)){
    const cx = (P[0][0]+P[1][0]+P[2][0])/3, cy = (P[0][1]+P[1][1]+P[2][1])/3;
    const open = .35 + .65*Math.max(0, Math.sin((cx/W)*Math.PI*2 + (cy/H)*Math.PI));
    const Q = P.map(p => [cx+(p[0]-cx)*open, cy+(p[1]-cy)*open]);
    g.strokeStyle = U.rgba(c, .4+open*.5); g.lineWidth = 1.1;
    strokeHankin(g, Q, () => 54*Math.PI/180);
    g.strokeStyle = "rgba(255,255,255,.12)";
    g.beginPath(); g.moveTo(P[0][0],P[0][1]); g.lineTo(P[1][0],P[1][1]); g.lineTo(P[2][0],P[2][1]); g.closePath(); g.stroke();
  }
};
ART.case["F02-10"].ratio = 1.2;

// F02-11 杜哈伊斯蘭藝術博物館：抽象化疊澀量體＋星形開孔
ART.case["F02-11"] = function(g, W, H, r, c, U){
  const blocks = [[.15,.55,.3,.4],[.38,.35,.26,.6],[.58,.48,.24,.47],[.74,.6,.18,.35]];
  for(const [bx,by,bw,bh] of blocks){
    const x = bx*W, y = by*H, w = bw*W, h = bh*H;
    g.fillStyle = U.rgba(c,.18); g.fillRect(x,y,w,h);
    g.strokeStyle = U.rgba(c,.8); g.lineWidth = 1.3; g.strokeRect(x,y,w,h);
  }
  const [bx,by,bw,bh] = blocks[1], cx = (bx+bw/2)*W, cy = (by+bh*.32)*H, R = Math.min(bw*W,bh*H)*.22;
  g.strokeStyle = "#fff"; g.lineWidth = 1.2;
  strokeHankin(g, regPoly(cx,cy,R,8,TAU/16), () => 50*Math.PI/180);
};
ART.case["F02-11"].ratio = 1.15;

// F02-12 Freeform：圓堆積（隨機貪婪放置，不重疊）為骨架，大小不一的 rosette 填入
ART.case["F02-12"] = function(g, W, H, r, c, U){
  const circles = [];
  for(let tries = 0; tries < 500 && circles.length < 26; tries++){
    const x = r()*W, y = r()*H, maxR = Math.min(W,H)*.22, rad = 6 + r()*maxR;
    let ok = true;
    for(const cc of circles){ if(Math.hypot(cc.x-x, cc.y-y) < cc.r+rad+2){ ok = false; break; } }
    if(ok) circles.push({x, y, r: rad});
  }
  for(const cc of circles){
    const n = cc.r > 34 ? 10 : cc.r > 20 ? 8 : 6;
    g.strokeStyle = U.rgba(c, .55+Math.min(.4, cc.r/60)); g.lineWidth = 1;
    strokeHankin(g, regPoly(cc.x,cc.y,cc.r*.86,n, r()*TAU), () => 50*Math.PI/180);
    g.strokeStyle = "rgba(255,255,255,.15)"; g.beginPath(); g.arc(cc.x,cc.y,cc.r,0,TAU); g.stroke();
  }
};

// F02-13 同心圓參數化星形：三個相切圓為磁磚單元，切點連成三角形並鑲上菱形節點
ART.case["F02-13"] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/4.4, R = s*.56, h = s*Math.sqrt(3)/2;
  for(let row = -1; row*h < H+h; row++) for(let col = -1; col*s < W+s*1.5; col++){
    const x = col*s + (row%2 ? s/2 : 0), y = row*h;
    const centers = [[x,y],[x+s,y],[x+s/2,y+h]];
    g.strokeStyle = U.rgba(c,.45); g.lineWidth = 1;
    for(const [cx,cy] of centers){ g.beginPath(); g.arc(cx,cy,R,0,TAU); g.stroke(); }
    const mid = (a,b) => [(a[0]+b[0])/2, (a[1]+b[1])/2];
    const t01 = mid(centers[0],centers[1]), t12 = mid(centers[1],centers[2]), t20 = mid(centers[2],centers[0]);
    g.strokeStyle = c; g.lineWidth = 1.5;
    [t01,t12,t20].forEach(p => { g.save(); g.translate(p[0],p[1]); g.rotate(Math.PI/4); g.strokeRect(-R*.18,-R*.18,R*.36,R*.36); g.restore(); });
    g.beginPath(); g.moveTo(t01[0],t01[1]); g.lineTo(t12[0],t12[1]); g.lineTo(t20[0],t20[1]); g.closePath(); g.stroke();
  }
};
})();
