/* F03 TPMS 三週期極小曲面：變形與無照片案例的獨立畫法 */
(function(){
const ART = window.ART, U = window.GENUTIL;
ART.var["F03"] = ART.var["F03"] || [];
const TAU = U.TAU;

// 常見 TPMS 公式（用於畫法內取樣；索引：0 Gyroid、1 Schwarz P、2 Schwarz D、3 Neovius、4 I-WP 近似）
const FORM = [
  (x,y,z) => Math.sin(x)*Math.cos(y) + Math.sin(y)*Math.cos(z) + Math.sin(z)*Math.cos(x),
  (x,y,z) => Math.cos(x) + Math.cos(y) + Math.cos(z),
  (x,y,z) => Math.sin(x)*Math.sin(y)*Math.sin(z) + Math.sin(x)*Math.cos(y)*Math.cos(z) + Math.cos(x)*Math.sin(y)*Math.cos(z) + Math.cos(x)*Math.cos(y)*Math.sin(z),
  (x,y,z) => 3*(Math.cos(x)+Math.cos(y)+Math.cos(z)) + 4*Math.cos(x)*Math.cos(y)*Math.cos(z),
  (x,y,z) => Math.cos(x)*Math.cos(y) + Math.cos(y)*Math.cos(z) + Math.cos(z)*Math.cos(x),
];

// 在 (x0,y0,w,h) 這塊區域畫一片 TPMS 場＋白色等值線，供各畫法組合拼貼
function tpmsPatch(g, x0, y0, w, h, n, per, z, formIdx, col, iso){
  const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h));
  const m = Math.max(6, Math.round(n*H/W));
  const F = FORM[formIdx % FORM.length];
  const f = (i,j) => F(i/n*per*TAU, j/m*per*TAU, z);
  const off = document.createElement("canvas"); off.width = W; off.height = H;
  const og = off.getContext("2d");
  U.field(og, W, H, n, m, (i,j) => f(i,j) > iso ? .3 + Math.min(1, f(i,j)-iso)*.3 : .05, col);
  const S = W/(n-1), T = H/(m-1);
  og.strokeStyle = "#fff"; og.lineWidth = Math.max(1, W*.01); og.lineCap = "round"; og.lineJoin = "round";
  og.beginPath();
  U.contour(n, m, f, iso).forEach(([a,b]) => { og.moveTo(a[0]*S, a[1]*T); og.lineTo(b[0]*S, b[1]*T); });
  og.stroke();
  g.drawImage(off, x0, y0, w, h);
}

/* ---------------- 變形（0 起算） ---------------- */

// V01 換公式：Schwarz D、Neovius、I-WP、Gyroid 併陳，比較孔洞形態
ART.var["F03"][0] = function(g, W, H, r, c, U){
  const pad = W*.035, cw = (W-pad*3)/2, ch = (H-pad*3)/2;
  [2,3,4,0].forEach((fi,k) => { const cx = pad + (k%2)*(cw+pad), cy = pad + (k<2?0:1)*(ch+pad);
    tpmsPatch(g, cx, cy, cw, ch, 44, 2.3, .6, fi, c, 0); });
};

// V02 Sheet（薄殼，只描等值線）與 Solid（實心骨架，填滿內側）左右對照
ART.var["F03"][1] = function(g, W, H, r, c, U){
  const w2 = W/2;
  tpmsPatch(g, 0, 0, w2, H, 52, 2.6, .3, 0, c, 0);
  const n = 52, m = Math.round(n*H/w2), F = FORM[0], f = (i,j) => F(i/n*2.6*TAU, j/m*2.6*TAU, .3);
  const off = document.createElement("canvas"); off.width = Math.max(1,Math.round(w2)); off.height = Math.max(1,Math.round(H));
  const og = off.getContext("2d");
  U.field(og, w2, H, n, m, (i,j) => f(i,j) > 0 ? .9 : .06, c, .6);
  g.drawImage(off, w2, 0, w2, H);
  g.strokeStyle = "#fff"; g.lineWidth = 2; g.beginPath(); g.moveTo(w2,0); g.lineTo(w2,H); g.stroke();
};

// V03 漸變密度：由下往上 isoValue 提高，底部密實、頂部通透
ART.var["F03"][2] = function(g, W, H, r, c, U){
  const rows = 5;
  for(let k = 0; k < rows; k++){ const t = k/(rows-1), y0 = H*(1-(k+1)/rows), h = H/rows, iso = -.6 + t*1.15;
    tpmsPatch(g, 0, y0, W, h, 38, 2.2, .4, 0, c, iso); }
};

// V04 漸變週期：由左至右單元尺度逐漸變大
ART.var["F03"][3] = function(g, W, H, r, c, U){
  const cols = 5;
  for(let k = 0; k < cols; k++){ const x0 = W*k/cols, w = W/cols, per = 1.3 + k*1.15;
    tpmsPatch(g, x0, 0, w, H, 32, per, .4+k*.15, 0, c, 0); }
};

// V05 SDF 交集：Gyroid 被裁成柱狀構件，而不是整個立方體
ART.var["F03"][4] = function(g, W, H, r, c, U){
  const cx = W/2, cy = H*.55, rad = Math.min(W,H)*.4;
  g.save(); g.beginPath(); g.arc(cx,cy,rad,0,TAU); g.clip();
  tpmsPatch(g, cx-rad, cy-rad, rad*2, rad*2, 48, 2.6, .5, 0, c, 0);
  g.restore();
  g.strokeStyle = U.rgba(c,.75); g.lineWidth = 2; g.beginPath(); g.arc(cx,cy,rad,0,TAU); g.stroke();
};

// V06 兩種 TPMS 混合過渡：Gyroid 迷宮漸變成 Schwarz P 十字管網
ART.var["F03"][5] = function(g, W, H, r, c, U){
  const n = 84, m = Math.round(n*H/W), F0 = FORM[0], F1 = FORM[1], per = 2.4, z = .5;
  const f = (i,j) => { const w = i/n, x = i/n*per*TAU, y = j/m*per*TAU; return (1-w)*F0(x,y,z) + w*F1(x,y,z); };
  U.field(g, W, H, n, m, (i,j) => f(i,j) > 0 ? .35 + Math.min(1,f(i,j))*.25 : .05, c);
  const S = W/(n-1), T = H/(m-1);
  g.strokeStyle = "#fff"; g.lineWidth = Math.max(1, W*.008); g.beginPath();
  U.contour(n, m, f, 0).forEach(([a,b]) => { g.moveTo(a[0]*S, a[1]*T); g.lineTo(b[0]*S, b[1]*T); });
  g.stroke();
};

// V07 圓柱座標映射：角度方向壓縮＋邊緣暗角，暗示纏繞在柱面上
ART.var["F03"][6] = function(g, W, H, r, c, U){
  const n = 96, m = Math.round(n*H/W), F = FORM[0], per = 3;
  const f = (i,j) => { const th = (i/n-.5)*Math.PI*.9; return F(th*per*2, j/m*per*TAU, .4); };
  U.field(g, W, H, n, m, (i,j) => { const th = (i/n-.5)*Math.PI*.9, v = f(i,j), light = Math.cos(th);
    return Math.max(0, (v>0 ? .3+v*.25 : .05) * (.5+.5*light)); }, c);
  const grad = g.createLinearGradient(0,0,W,0);
  grad.addColorStop(0,"rgba(0,0,0,.55)"); grad.addColorStop(.5,"rgba(0,0,0,0)"); grad.addColorStop(1,"rgba(0,0,0,.55)");
  g.fillStyle = grad; g.fillRect(0,0,W,H);
};

// V08 只取 2D 切片：堆疊多層不同 z 的切片線稿，像逐層雷切疊合
ART.var["F03"][7] = function(g, W, H, r, c, U){
  const layers = 6, lw = W*.66, lh = H*.14, gap = (H-lh)/(layers-1)*.72;
  for(let k = 0; k < layers; k++){ const z = k*.5, y0 = H*.05 + k*gap, xo = W*.06 + k*(W*.22/(layers-1));
    g.save(); g.translate(xo,y0);
    g.fillStyle = "#171b20"; g.fillRect(0,0,lw,lh);
    const n = 60, m = Math.round(n*lh/lw), F = FORM[0], f = (i,j) => F(i/n*2.6*TAU, j/m*2.6*TAU, z);
    const S = lw/(n-1), T = lh/(m-1);
    g.strokeStyle = U.rgba(c, .45+.5*k/layers); g.lineWidth = 1.1; g.beginPath();
    U.contour(n, m, f, 0).forEach(([a,b]) => { g.moveTo(a[0]*S,a[1]*T); g.lineTo(b[0]*S,b[1]*T); });
    g.stroke();
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.strokeRect(0,0,lw,lh);
    g.restore(); }
};

// V09 輸出可製造幾何：解析度降低呼應減面，虛線切成分件模組，加封閉外框
ART.var["F03"][8] = function(g, W, H, r, c, U){
  tpmsPatch(g, 0, 0, W, H, 30, 2.2, .4, 0, c, 0);
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.3; g.setLineDash([6,5]);
  g.beginPath(); g.moveTo(W/2,0); g.lineTo(W/2,H); g.moveTo(0,H/2); g.lineTo(W,H/2); g.stroke();
  g.setLineDash([]);
  g.strokeStyle = U.rgba(c,.8); g.lineWidth = 2; g.strokeRect(2,2,W-4,H-4);
};

// V10 效能版：同一場拆成 4 塊平行拼接（拼縫細虛線），呈現高解析度仍可互動
ART.var["F03"][9] = function(g, W, H, r, c, U){
  const tw = W/2, th = H/2;
  for(let k = 0; k < 4; k++){ const x0 = (k%2)*tw, y0 = ((k/2)|0)*th;
    tpmsPatch(g, x0, y0, tw, th, 58, 2.8, .35, 0, c, 0); }
  g.strokeStyle = "rgba(255,255,255,.28)"; g.lineWidth = 1; g.setLineDash([3,3]);
  g.beginPath(); g.moveTo(W/2,0); g.lineTo(W/2,H); g.moveTo(0,H/2); g.lineTo(W,H/2); g.stroke();
  g.setLineDash([]);
};

// V11 動畫化：同一等值線在不同相位疊加殘影，暗示 isoValue／相位掃描
ART.var["F03"][10] = function(g, W, H, r, c, U){
  const n = 78, m = Math.round(n*H/W), F = FORM[0], per = 2.6;
  const phases = 6;
  for(let k = 0; k < phases; k++){ const ph = (k/phases-.5)*2.2, f = (i,j) => F(i/n*per*TAU+ph, j/m*per*TAU, .4);
    const S = W/(n-1), T = H/(m-1);
    g.strokeStyle = U.rgba(c, .16+.7*k/phases); g.lineWidth = 1.4; g.beginPath();
    U.contour(n, m, f, 0).forEach(([a,b]) => { g.moveTo(a[0]*S,a[1]*T); g.lineTo(b[0]*S,b[1]*T); });
    g.stroke(); }
};

// V12 混合其他家族：密度依到「受力點」的距離調整，受力大處密實、受力小處通透
ART.var["F03"][11] = function(g, W, H, r, c, U){
  const n = 88, m = Math.round(n*H/W), F = FORM[0], per = 2.4;
  const px = n*.3, py = m*.75;
  const f = (i,j) => F(i/n*per*TAU, j/m*per*TAU, .4);
  const dist = (i,j) => Math.hypot(i-px,j-py)/Math.max(n,m);
  const iso = (i,j) => -.5 + dist(i,j)*1.3;
  U.field(g, W, H, n, m, (i,j) => f(i,j) > iso(i,j) ? .3 + Math.min(1, f(i,j)-iso(i,j))*.3 : .04, c);
  const S = W/(n-1), T = H/(m-1);
  g.strokeStyle = "#fff"; g.lineWidth = Math.max(1, W*.008); g.beginPath();
  U.contour(n, m, (i,j) => f(i,j)-iso(i,j), 0).forEach(([a,b]) => { g.moveTo(a[0]*S,a[1]*T); g.lineTo(b[0]*S,b[1]*T); });
  g.stroke();
  g.fillStyle = U.rgba(c,1); g.beginPath(); g.arc(px*S, py*T, W*.02, 0, TAU); g.fill();
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.5; g.stroke();
};

/* ---------------- 沒有照片的案例 ---------------- */

// F03-01 Gyroid 的發現：NASA 技術報告手繪感（格線紙＋單一晶胞線稿）
ART.case["F03-01"] = function(g, W, H, r, c, U){
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1;
  for(let x = 0; x <= W; x += W/12){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); }
  for(let y = 0; y <= H; y += H/12){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
  const n = 56, m = Math.round(n*H/W), F = FORM[0], f = (i,j) => F(i/n*2*TAU, j/m*2*TAU, .3);
  const S = W/(n-1), T = H/(m-1);
  g.strokeStyle = "#EDE9DD"; g.lineWidth = 1.4; g.beginPath();
  U.contour(n, m, f, 0).forEach(([a,b]) => { g.moveTo(a[0]*S,a[1]*T); g.lineTo(b[0]*S,b[1]*T); });
  g.stroke();
};

// F03-02 Gyroid 金屬雕塑：展場聚光燈下的橢圓量體，金屬明暗
ART.case["F03-02"] = function(g, W, H, r, c, U){
  const cx = W*.5, cy = H*.4;
  const spot = g.createRadialGradient(cx,cy,10,cx,cy,H*.6);
  spot.addColorStop(0,"rgba(255,255,255,.12)"); spot.addColorStop(1,"rgba(255,255,255,0)");
  g.fillStyle = spot; g.fillRect(0,0,W,H);
  const rw = W*.34, rh = H*.3;
  g.save(); g.beginPath(); g.ellipse(cx,cy,rw,rh,0,0,TAU); g.clip();
  const n = 48, m = Math.round(n*rh/rw), F = FORM[0], f = (i,j) => F(i/n*2.8*TAU, j/m*2.8*TAU, .5);
  U.field(g, W, H, n, m, (i,j) => f(i,j) > 0 ? .55 + Math.min(1,f(i,j))*.4 : .1, "#D9DEE2", .5);
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx,cy,rw,rh,0,0,TAU); g.stroke();
  g.fillStyle = "#2A2A32"; g.fillRect(cx-rw*.9, cy+rh*.7, rw*1.8, H*.14);
  g.strokeStyle = "rgba(255,255,255,.15)"; g.strokeRect(cx-rw*.9, cy+rh*.7, rw*1.8, H*.14);
};

// F03-03 3D 列印的 Gyroid 填充：外殼邊界內部填滿 Gyroid 內芯，疊上列印分層線
ART.case["F03-03"] = function(g, W, H, r, c, U){
  const m0 = W*.1;
  g.strokeStyle = U.rgba(c,.9); g.lineWidth = 3; g.strokeRect(m0,m0,W-2*m0,H-2*m0);
  g.save(); g.beginPath(); g.rect(m0,m0,W-2*m0,H-2*m0); g.clip();
  tpmsPatch(g, m0, m0, W-2*m0, H-2*m0, 44, 3.2, .4, 0, c, .15);
  g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1;
  for(let y = m0; y < H-m0; y += (H-2*m0)/14){ g.beginPath(); g.moveTo(m0,y); g.lineTo(W-m0,y); g.stroke(); }
  g.restore();
};

// F03-04 徑向漸變 TPMS 骨骼支架：骨骼狀輪廓內，核心密實、表層通透
ART.case["F03-04"] = function(g, W, H, r, c, U){
  g.save();
  const cx = W/2, top = H*.08, bot = H*.92, head = W*.34;
  g.beginPath();
  g.moveTo(cx-head, top+head*.6);
  g.bezierCurveTo(cx-head, top-head*.1, cx+head, top-head*.1, cx+head, top+head*.6);
  g.bezierCurveTo(cx+head*.5, H*.35, cx+head*.5, H*.65, cx+head, bot-head*.6);
  g.bezierCurveTo(cx+head, bot+head*.1, cx-head, bot+head*.1, cx-head, bot-head*.6);
  g.bezierCurveTo(cx-head*.5, H*.65, cx-head*.5, H*.35, cx-head, top+head*.6);
  g.closePath(); g.clip();
  const n = 56, m = Math.round(n*H/W), F = FORM[0], f = (i,j) => F(i/n*3*TAU, j/m*3*TAU, .5);
  const dist = (i,j) => Math.abs(i/n-.5)*2;
  U.field(g, W, H, n, m, (i,j) => { const iso = -.7 + dist(i,j)*1.2; return f(i,j) > iso ? .3+Math.min(1,f(i,j)-iso)*.3 : .05; }, c);
  g.restore();
};

// F03-05 Gyroid 積層製造熱交換器：冷熱雙流道以雙色疊加，呈現互鎖通道
ART.case["F03-05"] = function(g, W, H, r, c, U){
  const n = 60, m = Math.round(n*H/W), F0 = FORM[0];
  const f = (i,j) => F0(i/n*2.6*TAU, j/m*2.6*TAU, .4);
  U.field(g, W, H, n, m, (i,j) => f(i,j) > 0 ? .35 + Math.min(1,f(i,j))*.25 : 0, "#E4572E", .8);
  const off = document.createElement("canvas"); off.width = Math.round(W); off.height = Math.round(H);
  U.field(off.getContext("2d"), W, H, n, m, (i,j) => f(i,j) < 0 ? .35 + Math.min(1,-f(i,j))*.25 : 0, "#2E9DE4", .8);
  g.globalCompositeOperation = "lighter"; g.drawImage(off, 0, 0, W, H); g.globalCompositeOperation = "source-over";
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2; g.strokeRect(2,2,W-4,H-4);
};

// F03-06 3D 石墨烯 Gyroid：稀疏通透的骨架上疊一層極細緻的微結構紋理
ART.case["F03-06"] = function(g, W, H, r, c, U){
  tpmsPatch(g, 0, 0, W, H, 28, 2, .3, 0, c, .32);
  const n2 = 130, m2 = Math.round(n2*H/W);
  const noise = U.vnoise((r()*1e6)|0);
  g.save(); g.globalAlpha = .18;
  U.field(g, W, H, n2, m2, (i,j) => noise(i*.15,j*.15) > .55 ? .5 : .05, "#EAF6F2", 1);
  g.restore();
};

// F03-07 蝴蝶鱗片的 Gyroid 光子晶體：翅膀輪廓內以彩虹色階呈現結構色
ART.case["F03-07"] = function(g, W, H, r, c, U){
  const cx = W*.28, cy = H*.5;
  g.save();
  g.beginPath();
  g.moveTo(cx,cy);
  g.bezierCurveTo(cx+W*.5, cy-H*.5, cx+W*.75, cy-H*.1, cx+W*.55, cy+H*.05);
  g.bezierCurveTo(cx+W*.7, cy+H*.15, cx+W*.6, cy+H*.42, cx+W*.3, cy+H*.4);
  g.closePath(); g.clip();
  const n = 42, m = Math.round(n*H/W), F = FORM[0], f = (i,j) => F(i/n*4.5*TAU, j/m*4.5*TAU, .6);
  const S = W/(n-1), T = H/(m-1);
  for(let i = 0; i < n; i++) for(let j = 0; j < m; j++){ if(f(i,j) <= 0) continue;
    const hue = (i/n*260 + j/m*60) % 360;
    g.fillStyle = `hsla(${hue},75%,60%,.5)`; g.fillRect(i*S, j*T, S+1, T+1); }
  g.restore();
};

// F03-08 Axolotl 的 TPMS 晶格元件：建模視窗感，格線地板＋座標軸小提示
ART.case["F03-08"] = function(g, W, H, r, c, U){
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1;
  for(let x = 0; x <= W; x += W/10){ g.beginPath(); g.moveTo(x,H*.15); g.lineTo(x,H*.95); g.stroke(); }
  for(let y = H*.15; y <= H*.95; y += (H*.8)/8){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
  const m0 = W*.12;
  tpmsPatch(g, m0, H*.1, W-2*m0, H*.7, 38, 2.2, .5, 0, c, 0);
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.3; g.strokeRect(m0,H*.1,W-2*m0,H*.7);
  const ax = W*.1, ay = H*.9;
  g.lineWidth = 1.5;
  g.strokeStyle = "#E4572E"; g.beginPath(); g.moveTo(ax,ay); g.lineTo(ax+W*.06,ay); g.stroke();
  g.strokeStyle = "#4CAF50"; g.beginPath(); g.moveTo(ax,ay); g.lineTo(ax,ay-W*.06); g.stroke();
  g.strokeStyle = "#2E9DE4"; g.beginPath(); g.moveTo(ax,ay); g.lineTo(ax-W*.04,ay+W*.04); g.stroke();
};

// F03-09 Digital Grotesque：全尺度砂印洞窟，拱形剖面內佈滿細密紋理牆面
ART.case["F03-09"] = function(g, W, H, r, c, U){
  g.fillStyle = "#0E0E13"; g.fillRect(0,0,W,H);
  const cx = W/2, archW = W*.7, archH = H*.85;
  g.save();
  g.beginPath();
  g.moveTo(cx-archW/2, H); g.lineTo(cx-archW/2, H-archH*.5);
  g.quadraticCurveTo(cx-archW/2, H-archH, cx, H-archH);
  g.quadraticCurveTo(cx+archW/2, H-archH, cx+archW/2, H-archH*.5);
  g.lineTo(cx+archW/2, H); g.closePath(); g.clip();
  const n = 56, m = Math.round(n*H/W), F = FORM[2], f = (i,j) => F(i/n*4*TAU, j/m*4*TAU, .8);
  U.field(g, W, H, n, m, (i,j) => f(i,j) > .1 ? .25 + Math.min(1,f(i,j))*.35 : .04, c, 1.2);
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 2;
  g.beginPath();
  g.moveTo(cx-archW/2, H); g.lineTo(cx-archW/2, H-archH*.5);
  g.quadraticCurveTo(cx-archW/2, H-archH, cx, H-archH);
  g.quadraticCurveTo(cx+archW/2, H-archH, cx+archW/2, H-archH*.5);
  g.lineTo(cx+archW/2, H); g.stroke();
};
ART.case["F03-09"].ratio = 1.25;

// F03-10 Smart Slab：砂印模板澆置的樓板底面，混凝土灰底上浮現肋狀紋理
ART.case["F03-10"] = function(g, W, H, r, c, U){
  g.fillStyle = "#3A3A3E"; g.fillRect(0,0,W,H);
  const n = 46, m = Math.round(n*H/W), F = FORM[1], f = (i,j) => F(i/n*2.4*TAU, j/m*2.4*TAU, .3);
  const S = W/(n-1), T = H/(m-1);
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = Math.max(1.5, W*.012);
  g.beginPath();
  U.contour(n, m, f, 0).forEach(([a,b]) => { g.moveTo(a[0]*S,a[1]*T); g.lineTo(b[0]*S,b[1]*T); });
  g.stroke();
  g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = Math.max(1, W*.005);
  g.beginPath();
  U.contour(n, m, f, -.15).forEach(([a,b]) => { g.moveTo(a[0]*S,a[1]*T); g.lineTo(b[0]*S,b[1]*T); });
  g.stroke();
};

// F03-11 Minimal Complexity 極小曲面裝置：多片薄殼並排，帶透視深度
ART.case["F03-11"] = function(g, W, H, r, c, U){
  const panels = 4;
  for(let k = 0; k < panels; k++){ const t = k/(panels-1), x0 = W*(.08+t*.6), w = W*.22, sc = 1-t*.35, h = H*.78*sc, y0 = H*.1+(H*.78-h)/2;
    g.save(); g.globalAlpha = .55+.45*(1-t);
    tpmsPatch(g, x0, y0, w, h, 28, 1.8, .4+t*.4, 0, c, 0);
    g.restore(); }
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0,H*.92); g.lineTo(W,H*.92); g.stroke();
};
ART.case["F03-11"].ratio = 1.15;

// F03-12 Gyroid 水凝膠支架：培養皿俯視，圓形範圍內為柔軟的生物粉色骨架
ART.case["F03-12"] = function(g, W, H, r, c, U){
  const cx = W/2, cy = H/2, R = Math.min(W,H)*.42;
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 2; g.beginPath(); g.arc(cx,cy,R,0,TAU); g.stroke();
  g.save(); g.beginPath(); g.arc(cx,cy,R*.86,0,TAU); g.clip();
  const n = 48, m = 48, F = FORM[0], f = (i,j) => F(i/n*3*TAU, j/m*3*TAU, .5);
  U.field(g, W, H, n, m, (i,j) => f(i,j) > 0 ? .3 + Math.min(1,f(i,j))*.3 : .08, "#F0A6C0", .7);
  g.restore();
};

// F03-13 依最佳化壁厚設計的 TPMS 支架：以熱區色階呈現壁厚分布，附色階條
ART.case["F03-13"] = function(g, W, H, r, c, U){
  const n = 56, m = Math.round(n*H/W), F = FORM[0], f = (i,j) => F(i/n*3*TAU, j/m*3*TAU, .5);
  const cx = n*.5, cy = m*.7;
  U.field(g, W, H, n, m, (i,j) => { if(f(i,j) <= 0) return 0; const d = Math.hypot(i-cx,j-cy)/Math.max(n,m); return .2 + (1-d)*.7; }, c, .9);
  const bw = W*.06, bx = W*.9, by0 = H*.15, bh = H*.7;
  const grad = g.createLinearGradient(0,by0,0,by0+bh);
  grad.addColorStop(0, U.rgba(c,1)); grad.addColorStop(1, "rgba(255,255,255,.15)");
  g.fillStyle = grad; g.fillRect(bx,by0,bw,bh);
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.strokeRect(bx,by0,bw,bh);
};
})();
