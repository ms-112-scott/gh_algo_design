/* F01 Truchet 磁磚：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL, TAU = U.TAU, rgba = U.rgba;

// ---- 共用工具 ----
// 與 GEN.F01 相同的基礎四分之一圓 Truchet 格
function arcCell(g, x, y, s, rotated){
  g.beginPath();
  if(rotated){ g.arc(x, y, s/2, 0, Math.PI/2); g.moveTo(x+s, y+s/2); g.arc(x+s, y+s, s/2, -Math.PI/2, -Math.PI, true); }
  else { g.arc(x+s, y, s/2, Math.PI/2, Math.PI); g.moveTo(x+s/2, y+s); g.arc(x, y+s, s/2, 0, -Math.PI/2, true); }
  g.stroke();
}
// 同一格用兩色填滿（弧線分割出的區域上色，示意 Smith 兩色著色）
function arcCellFill(g, x, y, s, rotated, colBG, colFG){
  g.fillStyle = colBG; g.fillRect(x, y, s, s);
  g.fillStyle = colFG;
  if(rotated){
    g.beginPath(); g.moveTo(x, y); g.arc(x, y, s/2, 0, Math.PI/2); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x+s, y+s); g.arc(x+s, y+s, s/2, Math.PI, Math.PI*1.5); g.closePath(); g.fill();
  } else {
    g.beginPath(); g.moveTo(x+s, y); g.arc(x+s, y, s/2, Math.PI/2, Math.PI); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x, y+s); g.arc(x, y+s, s/2, Math.PI*1.5, TAU); g.closePath(); g.fill();
  }
}
// 原始 1704 年三角形 Truchet：對角線切兩色三角形，dir 0-3 決定切法與配色
function triCell(g, x, y, s, dir, colA, colB){
  const TL=[x,y], TR=[x+s,y], BL=[x,y+s], BR=[x+s,y+s];
  let pA, pB;
  if(dir % 2 === 0){ pA = [TL,TR,BR]; pB = [TL,BR,BL]; } else { pA = [TR,BR,BL]; pB = [TR,BL,TL]; }
  const c1 = dir < 2 ? colA : colB, c2 = dir < 2 ? colB : colA;
  g.fillStyle = c1; g.beginPath(); g.moveTo(pA[0][0],pA[0][1]); g.lineTo(pA[1][0],pA[1][1]); g.lineTo(pA[2][0],pA[2][1]); g.closePath(); g.fill();
  g.fillStyle = c2; g.beginPath(); g.moveTo(pB[0][0],pB[0][1]); g.lineTo(pB[1][0],pB[1][1]); g.lineTo(pB[2][0],pB[2][1]); g.closePath(); g.fill();
}
// 多尺度（Carlson）遞迴切分：shouldSplit(x,y,s,depth,r) 決定是否再切成四格
function subdivideTruchet(g, x, y, s, depth, maxDepth, shouldSplit, r, colA, colB, minSize){
  if(depth < maxDepth && s > minSize && shouldSplit(x, y, s, depth, r)){
    const h = s/2;
    subdivideTruchet(g, x, y, h, depth+1, maxDepth, shouldSplit, r, colA, colB, minSize);
    subdivideTruchet(g, x+h, y, h, depth+1, maxDepth, shouldSplit, r, colA, colB, minSize);
    subdivideTruchet(g, x, y+h, h, depth+1, maxDepth, shouldSplit, r, colA, colB, minSize);
    subdivideTruchet(g, x+h, y+h, h, depth+1, maxDepth, shouldSplit, r, colA, colB, minSize);
  } else {
    g.lineWidth = Math.max(1, s*.13);
    g.strokeStyle = depth % 2 ? colB : colA;
    arcCell(g, x, y, s, r() < .5);
  }
}
// 六角格 Truchet：每格 3 條弧，phase 決定三向配對的偏移
function hexCenters(s, W, H){
  const R = s*.62, hw = R*Math.sqrt(3), list = [];
  for(let row = -1; row*R*1.5 < H+R; row++) for(let col = -1; col*hw < W+hw; col++){
    list.push([col*hw + (row%2 ? hw/2 : 0), row*R*1.5, R]);
  }
  return list;
}
function hexArc(g, cx, cy, R, phase){
  const V = [...Array(6)].map((_,k) => [cx + R*Math.cos(k*TAU/6), cy + R*Math.sin(k*TAU/6)]);
  const mids = [...Array(6)].map((_,k) => { const a = V[k], b = V[(k+1)%6]; return [(a[0]+b[0])/2, (a[1]+b[1])/2]; });
  for(let i = 0; i < 6; i += 2){
    const i0 = (i+phase)%6, i1 = (i+2+phase)%6, vIdx = (i+1+phase)%6;
    const m0 = mids[i0], m1 = mids[i1], vx = cx + R*Math.cos(vIdx*TAU/6), vy = cy + R*Math.sin(vIdx*TAU/6);
    const rad = Math.hypot(m0[0]-vx, m0[1]-vy), a0 = Math.atan2(m0[1]-vy, m0[0]-vx), a1 = Math.atan2(m1[1]-vy, m1[0]-vx);
    g.beginPath(); g.arc(vx, vy, rad, a0, a1); g.stroke();
  }
}
// 等角投影：在局部單位方格座標系內作畫（DPR 縮放不受影響，用 transform 疊加）
function isoFace(g, ox, oy, ux, uy, vx, vy, drawFn){
  g.save(); g.translate(ox, oy); g.transform(ux, uy, vx, vy, 0, 0); drawFn(); g.restore();
}
function isoBlock(g, ox, oy, ux, uy, vx, vy, depth, dark1, dark2, top0, drawTop){
  const Pr = [ox+ux, oy+uy], Pb = [ox+ux+vx, oy+uy+vy], Pl = [ox+vx, oy+vy];
  g.fillStyle = dark1; g.beginPath(); g.moveTo(Pr[0],Pr[1]); g.lineTo(Pb[0],Pb[1]); g.lineTo(Pb[0],Pb[1]+depth); g.lineTo(Pr[0],Pr[1]+depth); g.closePath(); g.fill();
  g.fillStyle = dark2; g.beginPath(); g.moveTo(Pb[0],Pb[1]); g.lineTo(Pl[0],Pl[1]); g.lineTo(Pl[0],Pl[1]+depth); g.lineTo(Pb[0],Pb[1]+depth); g.closePath(); g.fill();
  g.fillStyle = top0; g.beginPath(); g.moveTo(ox,oy); g.lineTo(Pr[0],Pr[1]); g.lineTo(Pb[0],Pb[1]); g.lineTo(Pl[0],Pl[1]); g.closePath(); g.fill();
  isoFace(g, ox, oy, ux, uy, vx, vy, drawTop);
}

ART.var["F01"] = ART.var["F01"] || [];

// V01 吸引子控制方向：近吸引子偏一種方向、遠處偏另一種，亮度隨距離衰減
ART.var["F01"][0] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/13, cols = Math.ceil(W/s), rows = Math.ceil(H/s);
  const ax = (.2+r()*.6)*W, ay = (.2+r()*.6)*H, maxD = Math.hypot(W,H);
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const x = i*s, y = j*s, d = Math.hypot(x+s/2-ax, y+s/2-ay)/maxD;
    const rotated = d < .28 ? true : (d > .55 ? false : r() < .5);
    g.lineWidth = s*.15; g.strokeStyle = rgba(c, .35 + (1-Math.min(1,d*1.6))*.55);
    arcCell(g, x, y, s, rotated);
  }
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1;
  for(let k = 1; k <= 3; k++){ g.beginPath(); g.arc(ax, ay, s*.85*k, 0, TAU); g.stroke(); }
  g.fillStyle = "#fff"; g.beginPath(); g.arc(ax, ay, 3, 0, TAU); g.fill();
};

// V02 影像驅動 Truchet（半色調）：以橢圓漸層模擬一張「照片」亮度場，暗處留白、亮處疊粗弧
ART.var["F01"][1] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/17, cols = Math.ceil(W/s), rows = Math.ceil(H/s);
  const noise = U.vnoise((r()*9999)|0), cx = cols/2, cy = rows/2, maxR = Math.hypot(cx,cy);
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const d = Math.hypot(i-cx, (j-cy)*1.15)/maxR;
    let bright = Math.max(0, Math.min(1, 1 - d*.9 + (noise(i*.15,j*.15)-.5)*.35));
    const x = i*s, y = j*s;
    if(bright < .18) continue;
    else if(bright < .45){ g.lineWidth = s*.08; g.strokeStyle = rgba(c,.5); arcCell(g,x,y,s,(i+j)%2===0); }
    else if(bright < .75){ g.lineWidth = s*.15; g.strokeStyle = c; arcCell(g,x,y,s, r()<.5); }
    else { g.lineWidth = s*.26; g.strokeStyle = "#fff"; arcCell(g,x,y,s, r()<.5); }
  }
};

// V03 原始三角形 Truchet（四方向）：對角線分兩色三角形，隨機挑四種旋轉
ART.var["F01"][2] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/11, cols = Math.ceil(W/s), rows = Math.ceil(H/s), white = "#eceff2";
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++) triCell(g, i*s, j*s, s, (r()*4)|0, c, white);
};

// V04 對角線迷宮（10 PRINT）：每格畫一條對角線，方向由擲硬幣決定
ART.var["F01"][3] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/22, cols = Math.ceil(W/s), rows = Math.ceil(H/s);
  g.lineWidth = Math.max(1, s*.12); g.strokeStyle = c;
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const x = i*s, y = j*s; g.beginPath();
    if(r() < .5){ g.moveTo(x,y+s); g.lineTo(x+s,y); } else { g.moveTo(x,y); g.lineTo(x+s,y+s); }
    g.stroke();
  }
};

// V05 兩色分區填色（Smith 著色）：弧線圍出的區域依奇偶交錯上色
ART.var["F01"][4] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/12, cols = Math.ceil(W/s), rows = Math.ceil(H/s), dark = "#15151b";
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const rotated = r() < .5, parity = (i+j+(rotated?1:0))%2;
    arcCellFill(g, i*s, j*s, s, rotated, parity ? dark : c, parity ? c : dark);
  }
};

// V06 多尺度 Truchet（Carlson）：遞迴切分四格，深度越深顏色反轉、尺寸減半
ART.var["F01"][5] = function(g, W, H, r, c, U){
  const s0 = Math.min(W,H)/6, cols = Math.ceil(W/s0), rows = Math.ceil(H/s0), white = "#f2f2f6";
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++)
    subdivideTruchet(g, i*s0, j*s0, s0, 0, 3, () => r() < .55, r, c, white, s0/8);
};

// V07 六角形 Truchet：三向交織的流線，比方格版更像編織
ART.var["F01"][6] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/7;
  g.lineWidth = s*.09; g.strokeStyle = c;
  for(const [cx,cy,R] of hexCenters(s, W, H)) hexArc(g, cx, cy, R*.95, (r()*3)|0);
};

// V08 曲面上的 Truchet 立面：橫向依 sin 曲率縮放格寬並下拉中段，模擬包覆在弧形立面上
ART.var["F01"][7] = function(g, W, H, r, c, U){
  const cols = 16;
  const widths = [...Array(cols)].map((_,i) => { const u = (i+.5)/cols*2-1; return Math.max(.25, Math.sqrt(Math.max(0,1-u*u))); });
  const totalW = widths.reduce((a,b)=>a+b,0), baseS = W/totalW;
  let x = 0;
  for(let i = 0; i < cols; i++){
    const sx = widths[i]*baseS, u = (i+.5)/cols*2-1, bulge = Math.sqrt(Math.max(0,1-u*u));
    const yOff = (1-bulge)*H*.15, rows = Math.max(1, Math.floor((H-yOff)/sx));
    g.lineWidth = Math.max(1, sx*.13);
    for(let j = 0; j < rows; j++){ g.strokeStyle = rgba(c, .5+bulge*.4); arcCell(g, x, yOff+j*sx, sx, r()<.5); }
    x += sx;
  }
};

// V09 弧線轉成可製造的 3D 模組：兩種等角模組（0°/90°）＋下方以同兩種模組拼出的牆面
ART.var["F01"][8] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)*.24, ux = s*.87, uy = s*.5, vx = -s*.87, vy = s*.5, depth = s*.4;
  const dark1 = "#0b0b10", dark2 = "#050508", top0 = "#1c1c24";
  isoBlock(g, W*.28, H*.28, ux, uy, vx, vy, depth, dark1, dark2, top0, () => { g.lineWidth=.11; g.strokeStyle=c; arcCell(g,0,0,1,true); });
  isoBlock(g, W*.6, H*.28, ux, uy, vx, vy, depth, dark1, dark2, top0, () => { g.lineWidth=.11; g.strokeStyle=c; arcCell(g,0,0,1,false); });
  const gs = s*.5, cols = 7, rows = 3, gx = W*.5-cols*gs/2, gy = H*.6;
  g.lineWidth = gs*.14;
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){ g.strokeStyle = c; arcCell(g, gx+i*gs, gy+j*gs, gs, (i+j)%2===0); }
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(gx, gy, cols*gs, rows*gs);
};

// V10 3D Truchet 方塊（空間管路）：兩層立方格堆疊，頂面弧線像管路穿越空間
ART.var["F01"][9] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/8.5, ux = s*.87, uy = s*.5, vx = -s*.87, vy = s*.5, zh = s*.9;
  const dark1 = "#0b0b10", dark2 = "#050508", top0 = "#1c1c24";
  const cells = [];
  for(let lvl = 0; lvl < 2; lvl++) for(let j = 0; j < 3; j++) for(let i = 0; i < 3; i++){
    if(lvl === 1 && r() < .4) continue;
    cells.push([i,j,lvl]);
  }
  cells.sort((a,b) => (a[2]-b[2]) || ((a[0]+a[1])-(b[0]+b[1])));
  cells.forEach(([i,j,lvl]) => {
    const ox = W*.5+(i-j)*ux, oy = H*.78+(i+j)*uy-lvl*zh;
    isoBlock(g, ox, oy, ux, uy, vx, vy, zh, dark1, dark2, top0, () => { g.lineWidth=.16; g.strokeStyle=c; arcCell(g,0,0,1,(i+j+lvl)%2===0); });
  });
};

// V11 動畫：逐格翻轉：對角波前掃過畫面，波前後方已翻面、波前上殘影疊加、波前前方未變
ART.var["F01"][10] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/13, cols = Math.ceil(W/s), rows = Math.ceil(H/s), front = .2+r()*.6;
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const x = i*s, y = j*s, prog = (i/cols+j/rows)/2, baseRot = (i*7+j*13)%2===0;
    if(prog < front-.08){ g.globalAlpha=1; g.lineWidth=s*.15; g.strokeStyle="#fff"; arcCell(g,x,y,s,!baseRot); }
    else if(prog < front+.08){
      g.globalAlpha=.35; g.lineWidth=s*.12; g.strokeStyle=c; arcCell(g,x,y,s,baseRot);
      g.globalAlpha=.6; g.strokeStyle="#fff"; arcCell(g,x,y,s,!baseRot);
    } else { g.globalAlpha=.5; g.lineWidth=s*.12; g.strokeStyle=c; arcCell(g,x,y,s,baseRot); }
  }
  g.globalAlpha = 1;
};

// V12 偵測封閉迴圈並分級：淡底紋上疊一條主要「長河」與數個「小島」，依大小分色
ART.var["F01"][11] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/13, cols = Math.ceil(W/s), rows = Math.ceil(H/s);
  g.lineWidth = s*.08; g.strokeStyle = rgba(c,.32);
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++) arcCell(g, i*s, j*s, s, r()<.5);
  g.strokeStyle = "#fff"; g.lineWidth = s*.3; g.beginPath();
  let py = H*(.3+r()*.4); g.moveTo(0,py);
  for(let i = 1; i <= cols; i++){ py = Math.max(H*.15, Math.min(H*.85, py+(r()-.5)*s*1.5)); g.lineTo(i*s, py); }
  g.stroke();
  for(let k = 0; k < 7; k++){
    const rad = s*(.22+r()*.5);
    g.fillStyle = rad > s*.48 ? rgba(c,.85) : "rgba(255,255,255,.55)";
    g.beginPath(); g.arc(r()*W, r()*H, rad, 0, TAU); g.fill();
  }
};

// V13 鏡曲線：Kolam 與凱爾特結：三種磚（鏡甲／鏡乙／十字交織斷線）＋角點 pulli
ART.var["F01"][12] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/11, cols = Math.ceil(W/s), rows = Math.ceil(H/s), gap = s*.09;
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const x = i*s, y = j*s, type = (r()*3)|0;
    g.lineWidth = s*.1; g.strokeStyle = c;
    if(type === 0) arcCell(g,x,y,s,true);
    else if(type === 1) arcCell(g,x,y,s,false);
    else {
      const cx = x+s/2, cy = y+s/2, over = (i+j)%2===0;
      g.beginPath();
      if(over){ g.moveTo(x,cy); g.lineTo(cx-gap,cy); g.moveTo(cx+gap,cy); g.lineTo(x+s,cy); g.moveTo(cx,y); g.lineTo(cx,y+s); }
      else { g.moveTo(x,cy); g.lineTo(x+s,cy); g.moveTo(cx,y); g.lineTo(cx,cy-gap); g.moveTo(cx,cy+gap); g.lineTo(cx,y+s); }
      g.stroke();
    }
  }
  g.fillStyle = "#fff";
  for(let j = 0; j <= rows; j += 2) for(let i = 0; i <= cols; i += 2){ g.beginPath(); g.arc(i*s, j*s, 1.6, 0, TAU); g.fill(); }
};

// V14 複數共形映射（e^z／Droste）：格子沿極座標指數收縮成同心環，磚朝切線方向旋轉
ART.var["F01"][13] = function(g, W, H, r, c, U){
  const cx = W/2, cy = H/2, rings = 9, Rmax = Math.min(W,H)*.48;
  for(let ring = 0; ring < rings; ring++){
    const t = ring/(rings-1), R = Rmax*Math.exp(-t*2.1);
    const per = Math.max(6, Math.round(10*(1+t*2))), s = TAU*R/per;
    if(s < 2) continue;
    for(let k = 0; k < per; k++){
      const ang = k/per*TAU + ring*.15, px = cx+Math.cos(ang)*R, py = cy+Math.sin(ang)*R;
      g.save(); g.translate(px,py); g.rotate(ang+Math.PI/2);
      g.lineWidth = Math.max(.6, s*.14); g.strokeStyle = rgba(c, .5+t*.4);
      arcCell(g, -s/2, -s/2, s, r()<.5);
      g.restore();
    }
  }
};

// ---- 沒有照片的案例 ----

// F01-01 Truchet 原始論文：規則排列（(i+j)%4）的黑白三角拼花，加裝飾邊框如古版畫
ART.case["F01-01"] = function(g, W, H, r, c, U){
  const pad = Math.min(W,H)*.09, iw = W-2*pad, ih = H-2*pad;
  const s = Math.min(iw,ih)/7, cols = Math.floor(iw/s), rows = Math.floor(ih/s);
  const ox = (W-cols*s)/2, oy = (H-rows*s)/2, white = "#eceff2";
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++) triCell(g, ox+i*s, oy+j*s, s, (i+j)%4, c, white);
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2; g.strokeRect(ox-8, oy-8, cols*s+16, rows*s+16);
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.strokeRect(ox-15, oy-15, cols*s+30, rows*s+30);
};

// F01-02 Smith 圓弧與結構層級拓樸：淡底紋上追出一條連續路徑，強調曲線可連成單一長曲線
ART.case["F01-02"] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/11, cols = Math.ceil(W/s), rows = Math.ceil(H/s);
  g.lineWidth = s*.08; g.strokeStyle = rgba(c,.3);
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++) arcCell(g, i*s, j*s, s, r()<.5);
  g.strokeStyle = "#fff"; g.lineWidth = s*.22; g.beginPath();
  let j = (rows/2)|0; g.moveTo(0, (j+.5)*s);
  for(let i = 0; i < cols; i++){ const rot = r()<.5, wob = rot ? -.32 : .32; g.lineTo((i+1)*s, Math.min(rows-1,Math.max(0,j))*s + (.5+wob)*s); if(r()<.3 && j<rows-1) j++; else if(r()<.15 && j>0) j--; }
  g.stroke();
};

// F01-03 多尺度 Truchet（Carlson，Bridges 2018）：切分機率隨對角帶距離遞減，形成細碎↔大塊的漸變
ART.case["F01-03"] = function(g, W, H, r, c, U){
  const s0 = Math.min(W,H)/5, cols = Math.ceil(W/s0), rows = Math.ceil(H/s0), white = "#eceff2";
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const dd = Math.abs((i/cols)-(j/rows));
    subdivideTruchet(g, i*s0, j*s0, s0, 0, 3, () => r() < (.78-dd*1.3), r, c, white, s0/9);
  }
};

// F01-04 10 PRINT：復刻終端機畫面──綠色掃描線、機殼邊框與游標方塊
ART.case["F01-04"] = function(g, W, H, r, c, U){
  g.fillStyle = "#04140a"; g.fillRect(0,0,W,H);
  const green = "#39ff6a", s = Math.min(W,H)/16, cols = Math.ceil(W/s), rows = Math.ceil(H/s);
  g.lineWidth = Math.max(1, s*.16); g.strokeStyle = rgba(green,.85);
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const x = i*s, y = j*s; g.beginPath();
    if(r()<.5){ g.moveTo(x,y+s); g.lineTo(x+s,y); } else { g.moveTo(x,y); g.lineTo(x+s,y+s); }
    g.stroke();
  }
  g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1;
  for(let y = 0; y < H; y += 3){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 6; g.strokeRect(3,3,W-6,H-6);
  g.fillStyle = green; g.fillRect(W-s*1.2, H-s*1.6, s*.8, s*1.1);
};

// F01-05 雷射切割 Truchet 拼圖（MoMath）：等角視角的分離小方磚堆疊，底層方塊＋上層凸起弧片、切割線虛線示意
ART.case["F01-05"] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)*.24, ux = s*.87, uy = s*.5, vx = -s*.87, vy = s*.5, depth = s*.16;
  const ox0 = W*.5, oy0 = H*.28;
  for(let j = 0; j < 3; j++) for(let i = 0; i < 3; i++){
    const ox = ox0+(i-j)*ux*1.15, oy = oy0+(i+j)*uy*1.15, rotated = (i+j)%2===0;
    isoBlock(g, ox, oy, ux, uy, vx, vy, depth, "#101015", "#08080b", "#1b1b22", () => {
      g.strokeStyle = "rgba(255,255,255,.4)"; g.setLineDash([.06,.06]); g.lineWidth = .04; g.strokeRect(.08,.08,.84,.84); g.setLineDash([]);
      g.lineWidth = .17; g.strokeStyle = c; arcCell(g,0,0,1,rotated);
    });
  }
};

// F01-06 Truchet 吸音磚：格子依五種模組形狀上不同線條記號，底色從冷藍到家族色表示吸音性能
ART.case["F01-06"] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/7, cols = Math.ceil(W/s), rows = Math.ceil(H/s), cold = "#2a6df0";
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const shapeType = (i+j*3)%5, perf = shapeType/4, x = i*s, y = j*s;
    g.fillStyle = cold; g.fillRect(x,y,s,s);
    g.fillStyle = rgba(c, .25+perf*.65); g.fillRect(x,y,s,s);
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(x,y,s,s);
    g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1.4;
    if(shapeType===1) arcCell(g,x,y,s,true);
    else if(shapeType===2) arcCell(g,x,y,s,false);
    else if(shapeType===3){ g.beginPath(); g.moveTo(x,y+s/2); g.lineTo(x+s,y+s/2); g.stroke(); }
    else if(shapeType===4){ g.beginPath(); g.arc(x+s/2,y+s/2,s*.3,0,TAU); g.stroke(); }
  }
};

// F01-07 Truchet 作為立面的視覺編碼：立面圖，量體輪廓中鋪滿弧線模組、地面線與女兒牆
ART.case["F01-07"] = function(g, W, H, r, c, U){
  const grad = g.createLinearGradient(0,0,0,H); grad.addColorStop(0,"#1a1e2c"); grad.addColorStop(1,"#12121a");
  g.fillStyle = grad; g.fillRect(0,0,W,H);
  const bx = W*.22, by = H*.1, bw = W*.56, bh = H*.75;
  g.fillStyle = "#0f0f15"; g.fillRect(bx,by,bw,bh);
  const s = Math.min(bw,bh)/9, cols = Math.floor(bw/s), rows = Math.floor(bh/s);
  g.lineWidth = Math.max(1, s*.12); g.strokeStyle = c;
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++) arcCell(g, bx+i*s, by+j*s, s, r()<.5);
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0,by+bh); g.lineTo(W,by+bh); g.stroke();
  g.fillStyle = "#0f0f15"; g.fillRect(bx-4, by-s*.4, bw+8, s*.4);
};

// F01-08 織物模板預鑄面板：一排雙曲面鼓脹輪廓，鼓脹程度不一模擬軟模灌漿的自由曲面
ART.case["F01-08"] = function(g, W, H, r, c, U){
  const cols = 6, s = W/cols;
  for(let i = 0; i < cols; i++){
    const bulge = .3+.7*Math.abs(Math.sin(i*1.3+r()*2)), x = i*s, midY = H*.55;
    const grad = g.createRadialGradient(x+s/2, midY, 2, x+s/2, midY, s*.9*bulge);
    grad.addColorStop(0, rgba(c,.9)); grad.addColorStop(1, rgba(c,.05));
    g.fillStyle = grad;
    g.beginPath(); g.ellipse(x+s/2, midY, s*.46, s*.75*bulge, 0, 0, TAU); g.fill();
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1;
    g.beginPath(); g.ellipse(x+s/2, midY, s*.46, s*.75*bulge, 0, 0, TAU); g.stroke();
  }
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1;
  g.beginPath(); g.moveTo(0,H*.18); g.lineTo(W,H*.18); g.stroke();
  g.beginPath(); g.moveTo(0,H*.92); g.lineTo(W,H*.92); g.stroke();
};

// F01-09 Truchet 參數化曲面立面（Sketchfab 模型）：曲面鋪面加 UV 等參線與控制點，強調建模感
ART.case["F01-09"] = function(g, W, H, r, c, U){
  const cols = 13;
  const widths = [...Array(cols)].map((_,i) => { const u = (i+.5)/cols*2-1; return Math.max(.3, Math.sqrt(Math.max(0,1-u*u*.85))); });
  const totalW = widths.reduce((a,b)=>a+b,0), baseS = W/totalW;
  let x = 0; const nodePts = [], colX = [0];
  for(let i = 0; i < cols; i++){
    const sx = widths[i]*baseS, u = (i+.5)/cols*2-1, bulge = Math.sqrt(Math.max(0,1-u*u*.85));
    const yOff = (1-bulge)*H*.18, rows = Math.max(1, Math.floor((H-yOff*2)/sx));
    for(let j = 0; j < rows; j++){ const y = yOff+j*sx; g.lineWidth = 1.2; g.strokeStyle = rgba(c,.75); arcCell(g,x,y,sx,(i+j)%2===0); nodePts.push([x,y]); }
    x += sx; colX.push(x);
  }
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1;
  for(let i = 0; i <= cols; i += 3){ g.beginPath(); g.moveTo(colX[i],0); g.lineTo(colX[i],H); g.stroke(); }
  g.fillStyle = "#fff"; nodePts.forEach((p,idx) => { if(idx%5===0){ g.beginPath(); g.arc(p[0],p[1],1.6,0,TAU); g.fill(); } });
};

// F01-10 Truchet Tiles Grasshopper 教學：Dispatch 分成兩組色塊，底部疊一段簡化節點連線示意 GH 畫布
ART.case["F01-10"] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/10, cols = Math.ceil(W/s), rows = Math.ceil(H*.78/s), teal = "#33c9a8";
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const groupA = (i+j)%2===0, x = i*s, y = j*s;
    g.fillStyle = groupA ? rgba(c,.12) : rgba(teal,.12); g.fillRect(x,y,s,s);
    g.lineWidth = s*.12; g.strokeStyle = groupA ? c : teal; arcCell(g,x,y,s,groupA);
  }
  g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(0,H*.8,W,H*.2);
  const gy = H*.86, nodes = [[W*.15,gy],[W*.4,gy-14],[W*.4,gy+14],[W*.65,gy],[W*.85,gy]];
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.2; g.beginPath();
  g.moveTo(nodes[0][0],nodes[0][1]); g.lineTo(nodes[1][0],nodes[1][1]);
  g.moveTo(nodes[0][0],nodes[0][1]); g.lineTo(nodes[2][0],nodes[2][1]);
  g.moveTo(nodes[1][0],nodes[1][1]); g.lineTo(nodes[3][0],nodes[3][1]);
  g.moveTo(nodes[2][0],nodes[2][1]); g.lineTo(nodes[3][0],nodes[3][1]);
  g.moveTo(nodes[3][0],nodes[3][1]); g.lineTo(nodes[4][0],nodes[4][1]);
  g.stroke();
  g.fillStyle = "#fff"; nodes.forEach(p => { g.beginPath(); g.arc(p[0],p[1],3,0,TAU); g.fill(); });
};

// F01-11 C# 多尺度 Truchet 產生器：以雜訊場（模擬 Perlin noise）決定切分區域，底部附色盤條
ART.case["F01-11"] = function(g, W, H, r, c, U){
  const noise = U.vnoise((r()*9999)|0);
  const s0 = Math.min(W,H)/5, cols = Math.ceil(W/s0), rows = Math.ceil((H-24)/s0), white = "#eceff2";
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const n = noise(i*.4, j*.4);
    subdivideTruchet(g, i*s0, j*s0, s0, 0, 3, () => n>.35 && n<.75, r, c, white, s0/9);
  }
  const pal = [c, "#e0663a", "#3aa0e0", "#e0d23a", "#ffffff"], pw = W/pal.length;
  for(let k = 0; k < pal.length; k++){ g.fillStyle = pal[k]; g.fillRect(k*pw, H-16, pw-2, 14); }
};

// F01-12 Truchet blocks 數學互動教具：桌面上一小疊等角立方塊，頂面留有弧線紋樣
ART.case["F01-12"] = function(g, W, H, r, c, U){
  const s = W*.16, ux = s*.87, uy = s*.5, vx = -s*.87, vy = s*.5, zh = s*.9;
  g.fillStyle = "#15151c"; g.beginPath(); g.moveTo(W*.5,H*.55); g.lineTo(W*.9,H*.72); g.lineTo(W*.5,H*.9); g.lineTo(W*.1,H*.72); g.closePath(); g.fill();
  const dark1 = "#0c0c11", dark2 = "#060609", top0 = "#1e1e26";
  const cubes = [[0,0,0],[1,0,0],[0,1,0],[0,0,1]];
  cubes.forEach(([i,j,lvl]) => {
    const ox = W*.5+(i-j)*ux, oy = H*.62+(i+j)*uy-lvl*zh;
    isoBlock(g, ox, oy, ux, uy, vx, vy, zh, dark1, dark2, top0, () => { g.lineWidth=.13; g.strokeStyle=c; arcCell(g,0,0,1, r()<.5); });
  });
};

// F01-13 Truchet 密碼卡片：磚的方向偏向拼出愛心輪廓，卡片外加裝飾邊框
ART.case["F01-13"] = function(g, W, H, r, c, U){
  const pad = Math.min(W,H)*.08, s = Math.min(W,H)/13, cols = Math.floor((W-2*pad)/s), rows = Math.floor((H-2*pad)/s);
  const ox = (W-cols*s)/2, oy = (H-rows*s)/2;
  function inHeart(x,y){ const yy=-y; return ((x*x+yy*yy-1)**3 - x*x*yy*yy*yy) < 0; }
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const u = ((i+.5)/cols)*2-1, v = (1-((j+.5)/rows))*2-1, inside = inHeart(u*1.15, v*1.15-0.15);
    g.lineWidth = s*.13; g.strokeStyle = inside ? "#fff" : rgba(c,.4);
    arcCell(g, ox+i*s, oy+j*s, s, inside ? (i+j)%2===0 : r()<.5);
  }
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2; g.strokeRect(ox-10, oy-10, cols*s+20, rows*s+20);
};

// F01-14 可 3D 列印的磁吸 Truchet 磁磚：數片散落、微旋轉的方磚，四角留磁鐵孔
ART.case["F01-14"] = function(g, W, H, r, c, U){
  const s = Math.min(W,H)/4.2, dark = "#0f0f15";
  for(let k = 0; k < 5; k++){
    const x = W*.15+r()*W*.6, y = H*.15+r()*H*.55, rot = (r()-.5)*.5;
    g.save(); g.translate(x,y); g.rotate(rot);
    g.fillStyle = "#1c1c24"; g.fillRect(-s/2,-s/2,s,s);
    g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1; g.strokeRect(-s/2+3,-s/2+3,s-6,s-6);
    g.lineWidth = s*.1; g.strokeStyle = c; arcCell(g,-s/2,-s/2,s, r()<.5);
    g.fillStyle = dark;
    [[-s/2+s*.12,-s/2+s*.12],[s/2-s*.12,-s/2+s*.12],[-s/2+s*.12,s/2-s*.12],[s/2-s*.12,s/2-s*.12]].forEach(([hx,hy]) => { g.beginPath(); g.arc(hx,hy,s*.05,0,TAU); g.fill(); });
    g.restore();
  }
};

})();
