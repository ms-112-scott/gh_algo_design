/* ================================================================
   A01 L-System 引擎（網頁版，跟 A01_LSystem.cs 同一套符號）
   提供：expand, turtle, build, bounds, render, grow, mix, P（預設樣式）,
         VAR_PRESET（A01 的 12 種變形）, CASE_PRESET（無圖片案例的示意）
   ================================================================ */
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
function rng(seed){ let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function expand(axiom, rules, gens, seed){
  const r = rng(seed); let s = axiom;
  for(let g = 0; g < gens; g++){
    let out = "";
    for(const ch of s){
      const rule = rules[ch];
      if(!rule) out += ch;
      else if(Array.isArray(rule)){ let x = r(), acc = 0, pick = rule[rule.length-1][0]; for(const [str,p] of rule){ acc += p; if(x < acc){ pick = str; break; } } out += pick; }
      else out += rule;
      if(out.length > 90000) return out;
    }
    s = out;
  }
  return s;
}
function noise2(x, y){ return Math.sin(x*1.7 + Math.sin(y*1.3)) * Math.cos(y*1.1 - Math.sin(x*0.9)); }
// 畫筆走一遍：回傳線段（含深度、離根距離），供繪圖與生長動畫用
function turtle(str, o){
  const segs = [], tips = [], st = [];
  let x = 0, y = 0, h = o.heading ?? -Math.PI/2, len = o.step ?? 10, d = 0, dist = 0, prevF = false;
  const ang = (o.angle ?? 25) * Math.PI/180, r = rng((o.seed ?? 1) + 99);
  let pruned = 0;
  for(const ch of str){
    if(pruned){ if(ch === "[") pruned++; else if(ch === "]") pruned--; if(pruned) continue; else { ({x,y,h,len,d,dist} = st.pop()); continue; } }
    if(ch === "F" || ch === "G" || ch === "A" || ch === "B" && o.drawAB){
      if((ch === "A" || ch === "B") && !o.drawAB) continue;
      let L = len;
      if(o.attractor){ const [ax,ay,s] = o.attractor; const dd = Math.hypot(x-ax, y-ay); L *= 0.45 + 1.2*Math.exp(-(dd*dd)/(s*s)); }
      if(o.jitter) h += (r()-0.5) * o.jitter;
      if(o.field) h += noise2(x*o.field, y*o.field) * 0.35;
      const nx = x + Math.cos(h)*L, ny = y + Math.sin(h)*L;
      if(o.bound && !o.bound(nx, ny)){ if(st.length){ pruned = 1; continue; } else continue; }
      segs.push([x,y,nx,ny,d,dist]); dist += L; x = nx; y = ny; prevF = true;
      if(o.tropism){ const [tx,ty,e] = o.tropism; const target = Math.atan2(ty,tx); h += e * Math.sin(target - h); }
    } else if(ch === "f"){ x += Math.cos(h)*len; y += Math.sin(h)*len; }
    else if(ch === "+"){ h -= ang * (o.angleVar ? 1 + (r()-0.5)*o.angleVar : 1); }
    else if(ch === "-"){ h += ang * (o.angleVar ? 1 + (r()-0.5)*o.angleVar : 1); }
    else if(ch === "["){ st.push({x,y,h,len,d,dist}); len *= (o.scale ?? 1); d++; prevF = false; }
    else if(ch === "]"){ if(prevF) tips.push([x,y,d]); ({x,y,h,len,d,dist} = st.pop()); prevF = false; }
  }
  if(prevF) tips.push([x,y,d]);
  return {segs, tips};
}

/* ---------- 預設樣式：演算法本體、12 種變形、案例示意 ---------- */
const TREE = {axiom:"F", rules:{F:"F[+F]F[-F]F"}, gens:4, angle:25.7, scale:1};
const P = {
  hero:   {...TREE, gens:5, angle:22.5, rules:{X:"F+[[X]-X]-F[-FX]+X", F:"FF"}, axiom:"X", ratio:1.35},
  v0:     {forest:5, axiom:"X", rules:{X:[["F[+X][-X]FX",0.34],["F[+X]FX",0.33],["F[-X]FX",0.33]], F:"FF"}, gens:6, angle:24, angleVar:0.5, ratio:0.8},
  v1:     {axiom:"F", rules:{F:"F[+F][-F]"}, gens:7, angle:28, scale:0.72, ratio:1.0, width:true},
  v2:     {axiom:"F", rules:{F:"FF[+F][-F]"}, gens:5, angle:24, scale:0.8, ratio:1.25, pipe:true},
  v3:     {axiom:"X", rules:{X:"F[+X][-X]FX", F:"FF"}, gens:6, angle:26, tropism:[0,1,0.16], ratio:1.1},
  v4:     {axiom:"X", rules:{X:"F[+X][-X]FX", F:"FF"}, gens:6, angle:30, attractorRel:[0.35,0.2,0.35], ratio:1.0, showAttr:true},
  v5:     {axiom:"X", rules:{X:"F[+X][--X]F[-X]+X", F:"FF"}, gens:6, angle:24, boundRel:"circle", ratio:1.0, showBound:true},
  v6:     {axiom:"X", rules:{X:"F[+X]F[-X]+X", F:"FF"}, gens:6, angle:22, surface:true, ratio:0.75},
  v7:     {...TREE, gens:4, ratio:1.3, growth:true},
  v8:     {axiom:"X", rules:{X:"F[+X][-X]FX", F:"FF"}, gens:6, angle:24, field:0.02, ratio:1.2},
  v9:     {axiom:"X", rules:{X:"F[+X][-X]FX", F:"FF"}, gens:5, angle:30, leaves:true, ratio:1.0},
  v10:    {axiom:"F", rules:{F:"F[++F][--F]"}, gens:4, angle:18, scale:0.75, column:true, ratio:1.25},
  v11:    {axiom:"A", rules:{A:"+BF-AFA-FB+", B:"-AF+BFB+FA-"}, gens:5, angle:90, heading:0, ratio:1.0, drawAB:false},
  roads:  {axiom:"F", rules:{F:[["F[+F]F",0.35],["F[-F]F",0.35],["FF",0.3]]}, gens:6, angle:90, scale:0.8, heading:0, ratio:0.85, jitter:0.02},
  pattern:{axiom:"F+F+F+F", rules:{F:"F+F-F-FF+F+F-F"}, gens:3, angle:90, heading:0, ratio:1.0},
  bush:   {axiom:"F", rules:{F:"FF-[-F+F+F]+[+F-F-F]"}, gens:4, angle:22.5, ratio:1.15},
};
const VAR_PRESET = ["v0","v1","v2","v3","v4","v5","v6","v7","v8","v9","v10","v11"];
const CASE_PRESET = {"A01-02":"v10","A01-03":"v10","A01-05":"roads","A01-07":"v0","A01-08":"v2","A01-09":"v1","A01-13":"pattern","A01-14":"v6","A01-15":"bush"};

/* 把一個預設畫進 canvas；t = 0..1 控制生長進度 */
function build(p, overrides = {}){
  const o = {...p, ...overrides};
  if(o.forest){
    const all = {segs:[], tips:[]};
    for(let k = 0; k < o.forest; k++){
      const s = expand(o.axiom, o.rules, o.gens - (k % 2), 7 + k*13);
      const t = turtle(s, {...o, seed: k*31 + 3});
      const dx = k * 150;
      t.segs.forEach(g => all.segs.push([g[0]+dx, g[1], g[2]+dx, g[3], g[4], g[5]]));
    }
    return all;
  }
  const s = expand(o.axiom, o.rules, o.gens, o.seed ?? 5);
  // 先跑一次拿邊界，再換成相對座標的吸引子／邊界
  let t = turtle(s, o);
  if(o.attractorRel || o.boundRel){
    const b = bounds(t.segs); const w = b.x1-b.x0, h = b.y1-b.y0;
    const oo = {...o};
    if(o.attractorRel){ const [rx,ry,rs] = o.attractorRel; oo.attractor = [b.x0 + w*rx, b.y0 + h*ry, Math.max(w,h)*rs]; }
    if(o.boundRel){ const cx = (b.x0+b.x1)/2, cy = b.y0 + h*0.42, R = Math.min(w,h)*0.42; oo.bound = (x,y) => Math.hypot(x-cx,y-cy) < R || y > cy + R*0.35; oo._circle = [cx,cy,R]; }
    t = turtle(s, oo); t.o = oo;
  }
  return t;
}
function bounds(segs){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const s of segs){ x0=Math.min(x0,s[0],s[2]); x1=Math.max(x1,s[0],s[2]); y0=Math.min(y0,s[1],s[3]); y1=Math.max(y1,s[1],s[3]); }
  return {x0,y0,x1,y1};
}
const FAM = {A:"#E4572E",B:"#3FA34D",C:"#2F6FE4",D:"#9152E0",E:"#F2A007",F:"#14A38F"};
function render(cv, p, t = 1, overrides = {}, geom){
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cv.clientWidth || 300, H = Math.round(W * (p.ratio ?? 1));
  if(cv.width !== W*dpr || cv.height !== H*dpr){ cv.width = W*dpr; cv.height = H*dpr; cv.style.height = H + "px"; }
  const g = geom || build(p, overrides);
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr,0,0,dpr,0,0);
  const bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#1C1C24"); bg.addColorStop(1,"#121217");
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
  if(!g.segs.length) return g;
  let b = bounds(g.segs), pad = W*0.09;
  let sx = (W-2*pad)/Math.max(1e-6,b.x1-b.x0), sy = (H-2*pad)/Math.max(1e-6,b.y1-b.y0), s = Math.min(sx,sy);
  const ox = (W - (b.x1-b.x0)*s)/2 - b.x0*s, oy = (H - (b.y1-b.y0)*s)/2 - b.y0*s;
  let X = x => x*s + ox, Y = y => y*s + oy;
  if(p.surface){ // 貼到一個彎曲屋面：把平面座標投影到正弦曲面上
    const X0 = X, Y0 = Y; X = (x,y) => X0(x) ; Y = (y,x) => Y0(y)*0.72 + H*0.14 + Math.sin((X0(x)/W)*Math.PI*2.2)*H*0.07;
    ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 1;
    for(let k = 0; k <= 10; k++){ ctx.beginPath(); for(let i = 0; i <= 40; i++){ const xx = i/40*W, yy = (k/10)*H*0.72 + H*0.14 + Math.sin((xx/W)*Math.PI*2.2)*H*0.07; i ? ctx.lineTo(xx,yy) : ctx.moveTo(xx,yy);} ctx.stroke(); }
  }
  const maxDist = Math.max(...g.segs.map(q => q[5])) || 1, maxD = Math.max(...g.segs.map(q => q[4])) || 1;
  const cut = t * (maxDist + 1);
  const col = FAM[p.fam || "A"];
  // 輔助圖形：吸引子、邊界
  if(p.showAttr && g.o?.attractor){ const [ax,ay,rr] = g.o.attractor; const gr = ctx.createRadialGradient(X(ax),Y(ay),0,X(ax),Y(ay),rr*s); gr.addColorStop(0,"rgba(242,160,7,.45)"); gr.addColorStop(1,"rgba(242,160,7,0)"); ctx.fillStyle = gr; ctx.fillRect(0,0,W,H); ctx.fillStyle = "#F2A007"; ctx.beginPath(); ctx.arc(X(ax),Y(ay),5,0,7); ctx.fill(); }
  if(p.showBound && g.o?._circle){ const [cx,cy,R] = g.o._circle; ctx.setLineDash([5,5]); ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X(cx),Y(cy),R*s,0,7); ctx.stroke(); ctx.setLineDash([]); }
  ctx.lineCap = "round";
  for(const q of g.segs){
    if(q[5] > cut) continue;
    const k = q[4]/maxD;
    let w = 1.1;
    if(p.pipe || p.width) w = Math.max(0.8, (p.pipe ? 7 : 4.5) * Math.pow(1 - k, 1.6) * Math.min(1, W/300));
    ctx.strokeStyle = p.pipe ? `rgba(255,255,255,${0.95 - k*0.3})` : mix(col, "#FFFFFF", 0.15 + k*0.55);
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(X(q[0],q[1]), Y(q[1],q[0])); ctx.lineTo(X(q[2],q[3]), Y(q[3],q[2])); ctx.stroke();
  }
  if(p.leaves && t >= 1){ // 枝端長葉：不重疊的圓（E01 Circle Packing 的簡化）
    const placed = [];
    for(const [x,y] of g.tips){ const px = X(x,y), py = Y(y,x); let r = W*0.035; for(const c of placed){ const d = Math.hypot(c[0]-px,c[1]-py) - c[2]; r = Math.min(r, d); } if(r > 2){ placed.push([px,py,r]); ctx.fillStyle = mix("#3FA34D","#FFFFFF",0.2) + "cc"; ctx.beginPath(); ctx.arc(px,py,r*0.92,0,7); ctx.fill(); } }
  }
  if(p.column && t >= 1){ const b2 = bounds(g.segs); ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(pad*0.6, Y(b2.y0)-4); ctx.lineTo(W-pad*0.6, Y(b2.y0)-4); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(W/2-18, Y(b2.y1), 36, 6); }
  return g;
}
function mix(a, b, t){ const pa = parseInt(a.slice(1),16), pb = parseInt(b.slice(1),16); const c = k => Math.round(((pa>>k)&255)*(1-t) + ((pb>>k)&255)*t); return "#" + [16,8,0].map(k => c(k).toString(16).padStart(2,"0")).join(""); }
function grow(cv, p, ms = 1100, overrides){
  const g = build(p, overrides); if(reduced){ render(cv,p,1,overrides,g); return; }
  const t0 = performance.now(); cv._anim = t0;
  const tick = now => { if(cv._anim !== t0) return; const t = Math.min(1,(now-t0)/ms); render(cv,p,easeOut(t),overrides,g); if(t < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
const easeOut = t => 1 - Math.pow(1-t, 3);

/* ---------- A01 詳細頁專用：圖示流程、符號表、C# 積木、參數小圖 ---------- */
// 圖示流程：起始 → 規則 → 重複 → 畫筆 → 分岔 → 輸出
function flowLSystem(compact){
  const tile = (x,y,t,w = 20,fill) => `<rect x="${x}" y="${y}" width="${w}" height="22" rx="5" class="p-tile" ${fill ? `style="fill:${fill}"` : ""}/><text x="${x+w/2}" y="${y+11.5}" class="p-txt" style="font-size:14px">${t}</text>`;
  const steps = [
    ["起始", `<g class="bob">${tile(28,26,"F",28)}</g><path class="p-ink" d="M42 56v12" /><circle cx="42" cy="72" r="3" class="p-fill"/>`],
    ["規則", `${tile(4,30,"F",20)}<path class="p-fam" d="M28 41h10M34 36l5 5-5 5"/>${tile(42,8,"F",14)}${tile(58,8,"[",12,"#FBE6DF")}${tile(42,32,"+F",24)}${tile(42,56,"]F",24,"#FBE6DF")}`],
    ["重複 n 次", `<g class="spin"><path class="p-ink" d="M66 42a24 24 0 1 1-7-17"/><path class="p-ink" d="M66 16v10H56"/></g><text x="42" y="43" class="p-txt" style="font-size:22px;fill:var(--A)">×n</text>`],
    ["畫筆走", `<path class="p-ink" d="M12 70h18" stroke-dasharray="3 5"/><g class="walk"><path d="M30 58l14-8-4 14z" style="fill:var(--A)"/></g><path class="p-fam" d="M56 30a14 14 0 0 1 14 14" /><path class="p-fam" d="M66 42l4 3 2-5"/><text x="62" y="22" class="p-txt" style="font-size:14px">+−</text>`],
    ["記住／回來", `<g class="bob"><rect x="22" y="18" width="40" height="10" rx="4" style="fill:var(--A)"/></g><rect x="22" y="34" width="40" height="10" rx="4" class="p-tile"/><rect x="22" y="50" width="40" height="10" rx="4" class="p-tile"/><path class="p-ink" d="M14 60V20M10 26l4-6 4 6"/><path class="p-ink" d="M70 20v40M66 54l4 6 4-6"/><text x="14" y="72" class="p-txt" style="font-size:13px">[</text><text x="70" y="72" class="p-txt" style="font-size:13px">]</text>`],
    ["輸出線段", `<path class="p-fam drawme" style="--len:160" d="M42 76V48M42 60 28 44M42 60l14-16M42 48V26M42 48 32 34M42 48l10-14M28 44l-8-6M56 44l8-6"/>`],
  ];
  return `<div class="flow${compact ? " compact" : ""}">${steps.map(([t,svg],i) => `
    ${i ? `<div class="arrow" style="--i:${i}">${ico("i-arrow")}</div>` : ""}
    <div class="step" style="--i:${i}"><div class="pict"><span class="n">${i+1}</span><svg viewBox="0 0 84 84" aria-hidden="true">${svg}</svg></div><b>${t}</b></div>`).join("")}</div>`;
}
function glyphs(){
  const G = [
    ["F", `<path class="p-fam" d="M8 30h24M26 24l6 6-6 6"/>`, "前進畫線"],
    ["f", `<path class="p-ink" d="M8 30h24" stroke-dasharray="3 4"/><path class="p-ink" d="M26 24l6 6-6 6"/>`, "前進不畫"],
    ["+", `<path class="p-fam" d="M30 30A12 12 0 1 0 18 18"/><path class="p-fam" d="M13 14l5 4-1 6"/>`, "左轉"],
    ["−", `<path class="p-fam" d="M10 30A12 12 0 1 1 22 18"/><path class="p-fam" d="M27 14l-5 4 1 6"/>`, "右轉"],
    ["[", `<rect x="8" y="10" width="24" height="7" rx="3" style="fill:var(--A)"/><rect x="8" y="21" width="24" height="7" rx="3" class="p-tile"/><path class="p-ink" d="M20 36V30"/>`, "記住位置"],
    ["]", `<rect x="8" y="21" width="24" height="7" rx="3" class="p-tile"/><path class="p-ink" d="M20 6v8M16 10l4 4 4-4"/>`, "回到位置"],
  ];
  return G.map(([k,svg,t]) => `<div class="glyph" title="${t}"><span class="k">${k}</span><svg viewBox="0 0 40 40" aria-hidden="true">${svg}</svg><span class="sr" style="font-size:13px;color:var(--mute)">${t}</span></div>`).join("");
}
function blocks(){
  const B = [
    ["StringBuilder", "拼字串", `<rect x="3" y="10" width="7" height="10" rx="2" class="p-tile"/><rect x="11.5" y="10" width="7" height="10" rx="2" class="p-tile"/><rect x="20" y="10" width="7" height="10" rx="2" style="fill:var(--A)"/>`],
    ["Dictionary<char,string>", "規則表", `<rect x="3" y="6" width="8" height="8" rx="2" class="p-tile"/><path class="p-fam" d="M13 10h5"/><rect x="20" y="6" width="8" height="8" rx="2" style="fill:var(--A)"/><rect x="3" y="17" width="8" height="8" rx="2" class="p-tile"/><path class="p-fam" d="M13 21h5"/><rect x="20" y="17" width="8" height="8" rx="2" style="fill:var(--A)"/>`],
    ["Stack<Pen>", "分岔記憶", `<rect x="6" y="5" width="18" height="6" rx="2" style="fill:var(--A)"/><rect x="6" y="13" width="18" height="6" rx="2" class="p-tile"/><rect x="6" y="21" width="18" height="6" rx="2" class="p-tile"/>`],
    ["Plane", "畫筆方向", `<path class="p-ink" d="M8 24h16" style="stroke:#E4572E"/><path class="p-ink" d="M8 24V8" style="stroke:#3FA34D"/><circle cx="8" cy="24" r="2.5" style="fill:#17171C"/>`],
  ];
  return B.map(([c,s,svg]) => `<div class="block"><div class="bi"><svg viewBox="0 0 30 30" aria-hidden="true">${svg}</svg></div><div><code>${esc(c)}</code><small>${s}</small></div></div>`).join("");
}
function paramStrips(){
  const rows = [
    ["世代","generations", [1,2,3,4,5], v => ({gens:v}), v => "n="+v],
    ["轉角","turnAngle", [10,20,30,45,90], v => ({angle:v}), v => v+"°"],
    ["縮放","branchScale", [1,0.9,0.8,0.7,0.6], v => ({scale:v}), v => v.toFixed(1)],
  ];
  const base = {axiom:"X", rules:{X:"F[+X][-X]FX", F:"FF"}, gens:5, angle:25.7, scale:1, ratio:1.1, fam:"A"};
  const el = document.getElementById("params");
  el.innerHTML = rows.map(([n,code,vals],r) => `<div class="prow"><div class="pl">${ico(["i-logic-iterate","w-state","w-geom"][r])}<div>${n}<code>${code}</code></div></div>
    <div class="strip">${vals.map((v,i) => `<figure><canvas data-r="${r}" data-i="${i}"></canvas><figcaption>${rows[r][4](v)}</figcaption></figure>`).join("")}<div class="scale-arrow"></div></div></div>`).join("");
  el.querySelectorAll("canvas").forEach(cv => { const [n,code,vals,f] = rows[cv.dataset.r]; const bp = cv.dataset.r === "2" ? {...base, axiom:"F", rules:{F:"F[+F][-F]"}, gens:6, angle:30} : base; render(cv, bp, 1, f(vals[cv.dataset.i])); });
}
