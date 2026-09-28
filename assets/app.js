/* ================================================================
   GH 演算法設計圖鑑｜主程式
   依賴：data.js（window.CATALOG）、assets/lsystem.js（A01 引擎）、assets/gen.js（其他演算法）
   ================================================================ */
const CAT = window.CATALOG;
const ALGOS = CAT.algorithms;
const ALG = Object.fromEntries(ALGOS.map(a => [a.id, a]));
const CASES = CAT.cases;
const CASES_OF = id => CASES.filter(c => c.algo === id);
const isCC = c => (c.tags || []).some(t => /creative coding/i.test(t));

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ico = (id, cls = "i") => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const dots = n => `<span class="dots" aria-label="難度 ${n}／5">${[1,2,3,4,5].map(k => `<i class="${k <= n ? "on" : ""}"></i>`).join("")}</span>`;
const LOGIC_ICON = {"直接公式":"i-logic-formula","改寫／遞迴":"i-logic-rewrite","迭代模擬":"i-logic-iterate","搜尋／求解":"i-logic-search","幾何轉換":"i-logic-transform"};
const DS_ICON = {"符號":"i-ds-symbol","網格":"i-grid","粒子":"i-ds-particle","圖（點＋連線）":"i-ds-graph","幾何":"c-modeling"};
const SCALE_ICON = {"物件":"c-modeling","構件":"c-fabrication","立面／表皮":"c-2d-pattern","建築":"c-3d-architecture","群體／都市":"c-urban-landscape","地景":"c-urban-landscape"};
const imgTag = (c, lazy) => `<img src="${esc(c.image.file)}" alt="${esc(c.title)}" width="${c.image.w}" height="${c.image.h}"${lazy ? ' loading="lazy"' : ""}>`;
const credit = im => [im.note, [im.source, im.author].filter(Boolean).join("／"), im.license].filter(Boolean).map(esc).join("｜");
// 手機版（≤600px）：部分區塊預設收合；桌機一律展開
const MQ = matchMedia("(max-width:600px)");
const FOLD = () => MQ.matches ? "" : " open";

/* ================================================================
   1. 標籤產生器（全站只用這幾個函式產生標籤，確保同類同形）
   ================================================================ */
const FAMC = {A:["#E4572E","#FBE6DF","#B8391A"],B:["#3FA34D","#E2F2E4","#2A7A36"],C:["#2F6FE4","#E1EAFB","#1F50B0"],
              D:["#9152E0","#EEE3FB","#6D35B3"],E:["#F2A007","#FDF0D5","#A86A00"],F:["#14A38F","#D9F2EE","#0B7768"],
              G:["#C8378B","#F8E1EE","#962466"]};
const fv = f => `--fc:${FAMC[f][0]};--ft:${FAMC[f][1]};--fd:${FAMC[f][2]};--fam:${FAMC[f][0]};--fam-deep:${FAMC[f][2]};--fam-tint:${FAMC[f][1]}`;
const tFam = (f, short) => `<span class="tg tg-fam${short ? " short" : ""}" style="${fv(f)}" title="家族 ${f}｜${esc(CAT.families[f])}"><span class="L">${f}</span>${short ? "" : esc(CAT.families[f])}</span>`;
const tAlgo = (id, short) => { const a = ALG[id] || {family:id[0], name_zh:""}; return `<span class="tg tg-algo${short ? " short" : ""}" style="${fv(a.family)}" title="演算法 ${id}｜${esc(a.name_zh)}"><span class="id">${id}</span>${short ? "" : `<span class="nm">${esc(a.name_zh)}</span>`}</span>`; };
const vcode = i => "V" + String(i + 1).padStart(2, "0");
const vshort = t => String(t).replace(/L-System/gi, "").replace(/[（(].*$/, "").split(/[：:]/)[0].trim() || t;
const tVar = (i, pid, full) => { const v = ALG[pid].variations[i]; return `<span class="tg tg-var" style="${fv(pid[0])}" title="${pid} 的變形 ${vcode(i)}｜${esc(v.title)}">${ico("i-var")}<span class="pid">${pid}·${vcode(i)}</span><span class="nm">${esc(full ? v.title : vshort(v.title))}</span></span>`; };
const tCat = c => `<span class="tg tg-cat" title="應用類型">${ico("c-"+c)}<span class="nm">${esc(CAT.categories[c])}</span></span>`;
const tAttr = (icon, text, title = "屬性") => `<span class="tg tg-attr" title="${title}">${ico(icon)}<span class="nm">${esc(text)}</span></span>`;
const tKw = t => `<span class="tg tg-kw">${esc(t)}</span>`;
const chain = (...parts) => `<span class="chain">${parts.join('<span class="chev" aria-hidden="true">›</span>')}</span>`;
const TYPE = {algo:["t-algo","i-algo","演算法"], var:["t-var","i-var","變形"], case:["t-case","i-case","案例"], seed:["t-seed","i-seed","專案發想"]};
const badge = (type, inline) => { const [c,i,t] = TYPE[type]; return `<span class="badge ${c}${inline ? " inline" : ""}">${ico(i)}${t}</span>`; };
const ccBadge = `<span class="cc-tag">${ico("i-code")}creative coding</span>`;

function whatIcon(w = ""){
  if(/混合|搜尋/.test(w)) return "w-hybrid";
  if(/約束|邊界/.test(w)) return "w-constraint";
  if(/動畫|迴圈/.test(w)) return "w-anim";
  if(/輸入/.test(w)) return "w-input";
  if(/輸出/.test(w)) return "w-output";
  if(/幾何|維度|曲面|3D/.test(w)) return "w-geom";
  if(/狀態/.test(w)) return "w-state";
  return "w-rule";
}
const shortWhat = w => "改" + String(w).split(/[（(／、，]/)[0].replace(/^改/,"");

/* ================================================================
   1b. 瀏覽偏好記憶（只存在這台瀏覽器的 localStorage）
   點開卡片、按篩選鈕都會累加；排序時點越多的家族／演算法／應用類型越容易排前面
   ================================================================ */
const PREF_KEY = "ghAlgoAtlas.prefs.v1";
const prefs = (() => { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch(e){ return {}; } })();
["fam","algo","cat","type","src","diff"].forEach(k => prefs[k] = prefs[k] || {});
function bump(kind, key, n = 1){
  if(!key) return; prefs[kind][key] = (prefs[kind][key] || 0) + n;
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch(e){}
}
function bumpPin(p){ bump("algo", p.algo, 2); bump("fam", p.fam); bump("type", p.type); if(p.type === "case"){ bump("cat", p.cat?.[0]); bump("src", p.cc ? "cc" : "arch"); } }
const pw = (kind, key) => prefs[kind][key] || 0;
// 加權隨機排序（Efraimidis–Spirakis）：權重越大越可能排前面，但每次重新整理都不一樣
const wkey = w => Math.pow(Math.random(), 1 / Math.max(.05, w));
const wshuffle = (arr, wf) => arr.map(x => [wkey(wf(x)), x]).sort((a,b) => b[0] - a[0]).map(x => x[1]);

/* ================================================================
   2. 圖：A01 用 L-System 引擎；其他演算法用 gen.js
   每個 canvas 先用 aspect-ratio 佔好位置，進入畫面才排隊繪製
   ================================================================ */
const RATIOS = [1, .8, 1.15, .9, 1.25, .85];
function visual(algoId, kind, n){
  // 回傳 {ratio, draw(cv), grow(cv)}
  // 變形與無照片案例：有獨立畫法（assets/art/<演算法>.js）就用它
  const caseId = `${algoId}-${String(n).padStart(2,"0")}`, art = kind === "var" ? ART.var[algoId]?.[n] : kind === "case" ? ART.case[caseId] : null;
  if(art){
    const color = FAMC[ALG[algoId].family][0], ratio = art.ratio || RATIOS[(n + algoId.charCodeAt(1)) % RATIOS.length], key = kind === "var" ? `${algoId}:V${n}` : caseId;
    let seed = 0; const d = cv => artDraw(cv, key, art, color, ratio, seed);
    return {ratio, draw: d, grow: null, big: d, reseed: cv => { seed++; d(cv); }};
  }
  if(algoId === "A01"){
    const key = kind === "algo" ? "hero" : kind === "var" ? VAR_PRESET[n % 12] : (CASE_PRESET[caseId] || "bush");
    const p = {...P[key], fam:"A"};
    return {ratio: p.ratio ?? 1, draw: cv => render(cv, p), grow: cv => grow(cv, p, 900), big: cv => grow(cv, p, 1400)};
  }
  const a = ALG[algoId], color = FAMC[a.family][0];
  const v = kind === "algo" ? 0 : kind === "var" ? n + 1 : 20 + n, ratio = kind === "algo" ? 1.2 : RATIOS[(n + algoId.charCodeAt(1)) % RATIOS.length];
  return {ratio, draw: cv => genDraw(cv, algoId, v, a.family, color, ratio), grow: null, big: cv => genDraw(cv, algoId, v, a.family, color, ratio)};
}
const queue = []; let pumping = false;
function pump(){
  if(pumping) return; pumping = true;
  const step = () => { const t0 = performance.now(); while(queue.length && performance.now() - t0 < 24){ const f = queue.shift(); f(); } if(queue.length) requestAnimationFrame(step); else pumping = false; };
  requestAnimationFrame(step);
}
const lazyCv = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ lazyCv.unobserve(e.target); queue.push(e.target._draw); pump(); } }), {rootMargin:"500px"});

/* ================================================================
   3. Pin（瀑布流卡片）：圖片左上＝卡片類型；標題下＝身分鏈
   ================================================================ */
const num = id => +id.split("-")[1];
function pinAlgo(a){
  return {type:"algo", key:`algo:${a.id}`, algo:a.id, fam:a.family, diff:a.difficulty, search:[a.id,a.name_zh,a.name_en,a.one_liner,...(a.tags||[])].join(" "), vis:visual(a.id,"algo",0), html:`
    <div class="media">${badge("algo")}<canvas></canvas><div class="scrim"></div><span class="open">${ico("i-open")}開啟</span></div>
    <div class="cap"><b>${esc(a.name_zh)}</b><div class="sub en">${esc(a.name_en)}</div><div class="row2">${chain(tFam(a.family,true), tAlgo(a.id))}${dots(a.difficulty)}</div></div>`};
}
function pinVar(a, i){
  const v = a.variations[i];
  return {type:"var", key:`var:${a.id}:${i}`, algo:a.id, fam:a.family, diff:v.level, search:[a.id,a.name_zh,v.title,v.result,v.how].join(" "), vis:visual(a.id,"var",i), html:`
    <div class="media">${badge("var")}<canvas></canvas><div class="scrim"></div><span class="open">${ico("i-open")}看改法</span></div>
    <div class="cap"><b>${esc(v.title)}</b><div class="row2">${chain(tFam(a.family,true), tAlgo(a.id,true), tVar(i,a.id))}${dots(v.level)}</div></div>`};
}
function pinCase(c){
  const a = ALG[c.algo], img = !!c.image, cc = isCC(c);
  return {type:"case", key:c.id, algo:c.algo, fam:a.family, diff:c.difficulty, cat:[c.category, ...(c.categories_extra||[])], cc, search:[c.id,c.title,c.creator,c.summary,a.name_zh,...(c.tags||[]),...(c.tools||[])].join(" "), vis: img ? null : visual(c.algo,"case",num(c.id)), html:`
    <div class="media">${badge("case")}${cc ? ccBadge : ""}
      ${img ? imgTag(c, true) : `<canvas></canvas><span class="demo-tag">示意</span>`}
      <div class="scrim"></div><span class="open">${ico("i-open")}開啟</span></div>
    <div class="cap"><b>${esc(c.title)}</b><div class="sub">${esc(String(c.creator||"").split(/[，,（(]/)[0])}${c.year ? "・"+esc(c.year) : ""}</div>
      <div class="row2">${chain(tFam(a.family,true), tAlgo(c.algo,true))}${tCat(c.category)}</div></div>`};
}
function pinSeed(a, i){
  const p = a.project_seeds[i];
  return {type:"seed", key:`seed:${a.id}:${i}`, algo:a.id, fam:a.family, diff:p.difficulty, search:[a.id,a.name_zh,p.title,p.brief].join(" "), html:`
    <div class="media" style="${fv(a.family)}">${badge("seed", true)}
      <h4>${esc(p.title)}</h4>
      <div class="combo chain">${[a.id, ...(p.combine_with||[])].filter(id => ALG[id]).map(id => tAlgo(id)).join('<b>＋</b>')}</div>
      <div style="margin-top:14px">${dots(p.difficulty)}</div></div>`};
}
// 版面：每個演算法一條佇列（演算法→案例→變形交錯，每 3 輪插一個專案），再輪流取，讓整面牆各家族交錯
// 每次載入都重新加權洗牌：演算法的先後、佇列內案例與變形的先後都會變
let ALL_PINS = null;
function allPins(){
  if(ALL_PINS) return ALL_PINS;
  const itemW = p => 1 + pw("type", p.type)*.3 + (p.cat ? pw("cat", p.cat[0])*.6 : 0) + (p.type === "case" ? pw("src", p.cc ? "cc" : "arch")*.4 : 0);
  const order = wshuffle(ALGOS, a => 1 + pw("algo", a.id)*.8 + pw("fam", a.family)*.4);
  const Qs = order.map(a => {
    const V = wshuffle(a.variations.map((_,i) => pinVar(a,i)), itemW), C = wshuffle(CASES_OF(a.id).map(pinCase), itemW), S = wshuffle((a.project_seeds||[]).map((_,i) => pinSeed(a,i)), itemW), q = [pinAlgo(a)];
    let k = 0; while(V.length || C.length || S.length){ if(C.length) q.push(C.shift()); if(V.length) q.push(V.shift()); if(C.length) q.push(C.shift()); if(++k % 3 === 0 && S.length) q.push(S.shift()); }
    return q;
  });
  // 輪流取：偏好越高的演算法每一輪可多出 1–2 張卡，讓它的案例與變形也往前
  const per = order.map(a => 1 + Math.min(2, Math.floor((pw("algo", a.id)*.8 + pw("fam", a.family)*.4) / 4)));
  const pos = Qs.map(() => 0); ALL_PINS = []; let left = true;
  while(left){ left = false; Qs.forEach((q,k) => { for(let t = 0; t < per[k] && pos[k] < q.length; t++){ ALL_PINS.push(q[pos[k]++]); } if(pos[k] < q.length) left = true; }); }
  return ALL_PINS;
}

/* ================================================================
   4. 篩選
   ================================================================ */
const state = {type:"all", fam:new Set(), algo:new Set(), diff:new Set(), cat:null, src:"all", q:"", open:new Set()};
// 三層：① 卡片／來源／難度　② 應用類型　③ 家族＋演算法（家族可左右展開／合併，展開後演算法接在家族後面）
function renderChips(){
  const g = (label, inner) => `<div class="fgroup" role="group" aria-label="${label}"><span class="glabel">${label}</span>${inner}</div>`;
  const line = (key, label, ...groups) => `<div class="clwrap" data-k="${key}">
    <button class="clarr l" data-scroll="-1" tabindex="-1" aria-hidden="true">${ico("i-chev-l")}</button>
    <div class="chipline" role="group" aria-label="${label}">${groups.join('<span class="sep"></span>')}</div>
    <button class="clarr r" data-scroll="1" tabindex="-1" aria-hidden="true">${ico("i-chev-r")}</button></div>`;
  const all = (attr, on) => `<button class="fchip" data-${attr}="" aria-pressed="${on}"><span class="tg tg-attr">全部</span></button>`;
  const famGroup = f => {
    const list = ALGOS.filter(a => a.family === f), open = state.open.has(f);
    const nSel = list.filter(a => state.algo.has(a.id)).length;
    return `<div class="famgroup${open ? " open" : ""}${state.just === f ? " just" : ""}" data-f="${f}">
      <button class="fchip" data-fam="${f}" aria-pressed="${state.fam.has(f)}">${tFam(f)}</button>
      <button class="fexp" data-open="${f}" aria-expanded="${open}" title="${open ? "合併" : "展開"} ${f} 家族的 ${list.length} 個演算法"><span>${open ? "" : list.length}</span>${ico(open ? "i-chev-l" : "i-chev-r")}</button>
      ${open ? `<span class="falgos">${list.map(a => `<button class="fchip" data-algo="${a.id}" aria-pressed="${state.algo.has(a.id)}">${tAlgo(a.id)}</button>`).join("")}</span>`
             : (nSel ? `<span class="fcount" title="已選 ${nSel} 個演算法">${nSel}</span>` : "")}</div>`;
  };
  // 重新產生前記住每一列的捲動位置，避免點選後跳回最左邊
  const keep = {};
  document.querySelectorAll("#chips .clwrap").forEach(w => keep[w.dataset.k] = w.querySelector(".chipline").scrollLeft);
  document.getElementById("chips").innerHTML =
    `<div class="fsheet-h"><b>篩選</b><button class="fsheet-clear" type="button">清除</button><button class="fsheet-done" type="button">完成</button></div>` +
    line("r1", "卡片、來源與難度",
      g("卡片", all("type", state.type === "all") +
        ["algo","var","case","seed"].map(k => `<button class="fchip" data-type="${k}" aria-pressed="${state.type===k}">${badge(k, true)}</button>`).join("")),
      g("來源", [["all","全部"],["arch","建築與研究"],["cc","Creative Coding"]].map(([k,t]) => `<button class="fchip" data-src="${k}" aria-pressed="${state.src===k}"><span class="tg tg-attr">${k === "cc" ? ico("i-code") : ""}${t}</span></button>`).join("")),
      g("難度", all("diff", !state.diff.size) + [1,2,3,4,5].map(d => `<button class="fchip" data-diff="${d}" aria-pressed="${state.diff.has(d)}"><span class="tg tg-attr tg-diff">${dots(d)}${CAT.difficulty[d]}</span></button>`).join(""))) +
    line("r2", "應用類型", g("應用類型", Object.keys(CAT.categories).map(c => `<button class="fchip" data-cat="${c}" aria-pressed="${state.cat===c}">${tCat(c)}</button>`).join(""))) +
    line("r3", "家族與演算法", g("家族・演算法", all("fam", !state.fam.size && !state.algo.size) + Object.keys(CAT.families).map(famGroup).join("")));
  document.querySelectorAll("#chips .clwrap").forEach(w => { const cl = w.querySelector(".chipline"); if(keep[w.dataset.k]) cl.scrollLeft = keep[w.dataset.k]; cl.onscroll = () => chipHints(w); chipHints(w); });
  const on = (sel, fn, feed = true) => document.querySelectorAll(`#chips ${sel}`).forEach(b => b.onclick = () => { fn(b); renderChips(); if(feed) renderFeed(); });
  on("[data-type]", b => { state.type = b.dataset.type; bump("type", state.type); if(state.type !== "case"){ state.cat = null; state.src = "all"; } });
  on("[data-src]", b => { state.src = b.dataset.src; bump("src", state.src === "all" ? "" : state.src); if(state.src !== "all") state.type = "case"; });
  on("[data-fam]", b => { const f = b.dataset.fam; if(!f){ state.fam.clear(); state.algo.clear(); return; }
    if(state.fam.has(f)){ state.fam.delete(f); state.open.delete(f); [...state.algo].forEach(id => { if(ALG[id]?.family === f) state.algo.delete(id); }); }
    else { state.fam.add(f); state.open.add(f); state.just = f; bump("fam", f); } });
  on("[data-open]", b => { const f = b.dataset.open; state.open.has(f) ? state.open.delete(f) : (state.open.add(f), state.just = f); }, false);
  on("[data-diff]", b => { const d = +b.dataset.diff; if(!d){ state.diff.clear(); return; } state.diff.has(d) ? state.diff.delete(d) : (state.diff.add(d), bump("diff", String(d))); });
  on("[data-algo]", b => { const id = b.dataset.algo; state.algo.has(id) ? state.algo.delete(id) : (state.algo.add(id), bump("algo", id)); });
  on("[data-cat]", b => { state.cat = state.cat === b.dataset.cat ? null : b.dataset.cat; if(state.cat) bump("cat", state.cat); state.type = state.cat ? "case" : "all"; });
  document.querySelectorAll("#chips [data-scroll]").forEach(b => b.onclick = () => { const cl = b.parentElement.querySelector(".chipline"); cl.scrollBy({left: +b.dataset.scroll * cl.clientWidth * .7, behavior: "smooth"}); });
  document.querySelector("#chips .fsheet-done").onclick = () => filterSheet(false);
  document.querySelector("#chips .fsheet-clear").onclick = () => { Object.assign(state, {type:"all", cat:null, src:"all"}); ["fam","algo","diff","open"].forEach(k => state[k].clear()); renderChips(); renderFeed(); };
  filterSummary();
  // 剛展開的家族：讓它的演算法捲進可見範圍
  const opened = document.querySelector("#chips .famgroup.open.just");
  if(opened) opened.scrollIntoView({block: "nearest", inline: "nearest", behavior: "smooth"});
  state.just = null;
}
// 捲動提示：左右還有內容時顯示漸層與箭頭
function chipHints(w){
  const cl = w.querySelector(".chipline");
  w.classList.toggle("can-l", cl.scrollLeft > 2);
  w.classList.toggle("can-r", cl.scrollLeft + cl.clientWidth < cl.scrollWidth - 2);
}
addEventListener("resize", () => document.querySelectorAll("#chips .clwrap").forEach(chipHints));
// 手機版：篩選收成底部面板，篩選列只剩「篩選」鈕與已選條件摘要
function filterSummary(){
  const parts = [
    state.type !== "all" && TYPE[state.type][2],
    state.src !== "all" && (state.src === "cc" ? "Creative Coding" : "建築與研究"),
    ...[...state.diff].sort().map(d => CAT.difficulty[d]),
    state.cat && CAT.categories[state.cat],
    ...[...state.fam].filter(f => ![...state.algo].some(id => ALG[id]?.family === f)).map(f => `${f} 家族`),
    ...[...state.algo]].filter(Boolean);
  document.getElementById("fsum").textContent = parts.join("、");
  const n = document.querySelector("#filterBtn .fb-n"); n.textContent = parts.length || ""; n.hidden = !parts.length;
}
function filterSheet(on){
  document.getElementById("chips").classList.toggle("on", on);
  document.getElementById("fback").classList.toggle("on", on);
  document.getElementById("filterBtn").setAttribute("aria-expanded", on);
  if(!modal.classList.contains("on")) document.body.style.overflow = on ? "hidden" : "";
}
document.getElementById("filterBtn").onclick = () => filterSheet(true);
document.getElementById("fback").onclick = () => { filterSheet(false); legendOn(false); };
// 頂部列高度：手機版篩選列黏在它下方
const setTopH = () => document.documentElement.style.setProperty("--toph", document.getElementById("top").offsetHeight + "px");
addEventListener("resize", setTopH);
// 手機版搜尋框提示縮短
const qHint = () => { document.getElementById("q").placeholder = MQ.matches ? "搜尋" : "搜尋演算法、案例、p5.js、Voronoi、樹狀柱…"; };
MQ.addEventListener?.("change", qHint);
// 家族與演算法合併篩選：某家族有勾選個別演算法 → 只看那些演算法；只勾家族 → 整個家族；不同家族之間是「或」
function allowedAlgos(){
  if(!state.fam.size && !state.algo.size) return null;
  const picked = new Set([...state.algo].map(id => ALG[id]?.family));
  return new Set(ALGOS.filter(a => picked.has(a.family) ? state.algo.has(a.id) : state.fam.has(a.family)).map(a => a.id));
}
function filtered(){
  const q = state.q, allow = allowedAlgos();
  return allPins().filter(p =>
    (state.type === "all" || p.type === state.type) &&
    (!allow || allow.has(p.algo)) &&
    (!state.diff.size || state.diff.has(p.diff)) &&
    (!state.cat || (p.cat || []).includes(state.cat)) &&
    (state.src === "all" || (p.type === "case" && (state.src === "cc" ? p.cc : !p.cc))) &&
    (!q || p.search.toLowerCase().includes(q)));
}

/* ================================================================
   5. 瀑布流：grid + row span；無限捲動；進場動畫
   ================================================================ */
const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }), {rootMargin:"60px"});
function span(el){ const h = el.getBoundingClientRect().height; el.style.gridRowEnd = "span " + Math.ceil((h + 16) / 4); }
function makePin(p, i, container){
  const el = document.createElement("button");
  el.className = "pin" + (p.type === "seed" ? " seed" : ""); el.dataset.type = p.type; el.style.setProperty("--i", i % 12);
  el.innerHTML = p.html; el.dataset.key = p.key; el.setAttribute("aria-label", el.querySelector("b,h4")?.textContent || "");
  const cv = el.querySelector("canvas");
  if(cv && p.vis){ cv.style.aspectRatio = `1 / ${p.vis.ratio}`; cv._draw = () => { p.vis.draw(cv); span(el); }; lazyCv.observe(cv); if(p.vis.grow) el.addEventListener("mouseenter", () => p.vis.grow(cv)); }
  el.querySelector("img")?.addEventListener("load", () => span(el));
  el.onclick = () => { bumpPin(p); nav.list = container?._pins || null; open(p.key, {hint:true}); };
  return el;
}
function mountPins(container, pins, batch = 0){
  container.innerHTML = ""; container._pins = pins; container._n = 0;
  const more = () => {
    const end = batch ? Math.min(pins.length, container._n + batch) : pins.length;
    for(let i = container._n; i < end; i++){ const el = makePin(pins[i], i - container._n, container); container.appendChild(el); requestAnimationFrame(() => span(el)); io.observe(el); }
    container._n = end;
  };
  more(); container._more = more;
}
const feed = document.getElementById("feed"), sentinel = document.getElementById("sentinel");
new IntersectionObserver(es => { if(es[0].isIntersecting && feed._more && feed._n < feed._pins.length) feed._more(); }, {rootMargin:"1200px"}).observe(sentinel);
function renderFeed(){
  const pins = filtered();
  document.getElementById("count").textContent = `${pins.length} 張卡片`;
  mountPins(feed, pins, 40);
  document.getElementById("empty").hidden = pins.length > 0;
}
addEventListener("resize", () => { clearTimeout(renderFeed.t); renderFeed.t = setTimeout(() => document.querySelectorAll(".pin").forEach(span), 120); });
addEventListener("scroll", () => document.getElementById("top").classList.toggle("scrolled", scrollY > 4), {passive:true});
document.getElementById("q").oninput = e => { state.q = e.target.value.trim().toLowerCase(); clearTimeout(renderFeed.q); renderFeed.q = setTimeout(renderFeed, 180); };

/* ================================================================
   6. 詳細頁
   ================================================================ */
const modal = document.getElementById("modal"), sheet = document.getElementById("sheet");
function open(key, opt = {}){
  const go = () => {
    const [kind, id, n] = key.includes(":") ? key.split(":") : ["case", key];
    if(key === "info") sheet.innerHTML = document.getElementById("infoTpl").innerHTML;
    else if(kind === "algo") sheet.innerHTML = algoDetail(ALG[id]);
    else if(kind === "var") sheet.innerHTML = varDetail(ALG[id], +n);
    else if(kind === "seed") sheet.innerHTML = seedDetail(ALG[id], +n);
    else { const c = CASES.find(c => c.id === key); if(!c) return; sheet.innerHTML = caseDetail(c); }
    // 手機版頂部細條顯示目前頁名
    modal.dataset.title = key === "info" ? "關於這個圖鑑" : kind === "algo" ? ALG[id].name_zh : kind === "var" ? ALG[id].variations[+n].title
      : kind === "seed" ? ALG[id].project_seeds[+n].title : (CASES.find(c => c.id === key)?.title || "");
    sheet.style.cssText = fv((ALG[id] || ALG[(key.match(/^[A-Z]\d\d/)||["A01"])[0]] || {family:"A"}).family);
    modal.classList.add("on"); modal.scrollTop = 0; document.body.style.overflow = "hidden";
    modal.dataset.key = key;
    wireDetail(key);
    updateNav(); if(opt.hint) swipeHint();
    history.replaceState(null, "", "#" + key);
  };
  document.startViewTransition && !reduced && !opt.instant ? document.startViewTransition(go) : go();
}
function close(){
  const key = modal.dataset.key; modal.classList.remove("on"); document.body.style.overflow = ""; history.replaceState(null, "", location.pathname);
  if(nav.list && nav.list === feed._pins && key) revealInFeed(key);
}
document.getElementById("close").onclick = close;
modal.onclick = e => { if(e.target === modal) close(); };
addEventListener("keydown", e => {
  if(e.key === "Escape") close();
  if(!modal.classList.contains("on") || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
  if(e.key === "ArrowRight") slideTo(1); else if(e.key === "ArrowLeft") slideTo(-1);
});
document.getElementById("infoBtn").onclick = () => { nav.list = null; open("info"); };

/* ---- 卡片之間切換：左右滑（手機）／左右鍵與箭頭鈕（桌機）；在頂端往下拉關閉 ----
   nav.list＝點開這張卡的那一排（圖庫或詳細頁裡的橫滑列），依它的順序換上一張／下一張 */
const nav = {list: null};
const navPrev = document.getElementById("navPrev"), navNext = document.getElementById("navNext");
const navIndex = () => nav.list ? nav.list.findIndex(p => p.key === modal.dataset.key) : -1;
const pinTitle = p => { const d = document.createElement("div"); d.innerHTML = p.html; return d.querySelector("b,h4")?.textContent || ""; };
function updateNav(){
  const i = navIndex(), prev = i > 0 ? nav.list[i - 1] : null, next = i >= 0 ? nav.list[i + 1] : null;
  [[navPrev, prev, "上一張"], [navNext, next, "下一張"]].forEach(([b, p, t]) => { b.hidden = !p; if(p){ const n = `${t}：${pinTitle(p)}`; b.title = n; b.setAttribute("aria-label", n); } });
  modal.dataset.pos = i >= 0 ? `${i + 1} / ${nav.list.length}` : "";
}
navPrev.onclick = () => slideTo(-1); navNext.onclick = () => slideTo(1);
// 換卡動畫：目前這張往滑動方向滑出，下一張從另一側滑入
const clearAnim = () => ["transform", "opacity", "transition"].forEach(k => sheet.style.removeProperty(k));
function slideTo(step, fromDrag = 0){
  const i = navIndex(), p = i >= 0 ? nav.list[i + step] : null;
  if(!p){ bounceBack(); return false; }
  bumpPin(p);
  if(reduced){ open(p.key, {instant:true}); return true; }
  const w = sheet.offsetWidth || innerWidth;
  sheet.style.transition = "transform 170ms cubic-bezier(.4,0,1,1), opacity 170ms";
  sheet.style.transform = `translateX(${-step * w * .6}px)`; sheet.style.opacity = "0";
  setTimeout(() => {
    open(p.key, {instant:true});
    sheet.style.transition = "none"; sheet.style.transform = `translateX(${step * w * .35}px)`; sheet.style.opacity = "0";
    sheet.offsetWidth;
    sheet.style.transition = "transform 260ms var(--ease-out), opacity 200ms";
    sheet.style.transform = "translateX(0)"; sheet.style.opacity = "1";
    setTimeout(clearAnim, 280);
  }, fromDrag ? 120 : 170);
  return true;
}
function bounceBack(){
  if(reduced){ clearAnim(); return; }
  sheet.style.transition = "transform 280ms var(--ease-spring)"; sheet.style.transform = "translate(0,0)";
  modal.style.removeProperty("background-color");
  setTimeout(clearAnim, 300);
}
// 往下拉關閉：面板跟著手指往下，放開超過門檻就收起
function dragClose(){
  if(reduced){ clearAnim(); close(); return; }
  sheet.style.transition = "transform 260ms cubic-bezier(.4,0,1,1)"; sheet.style.transform = `translateY(${innerHeight}px)`;
  close();
  setTimeout(() => { clearAnim(); modal.style.removeProperty("background-color"); }, 300);
}
// 關閉後讓圖庫停在最後看的那張卡
function revealInFeed(key){
  const idx = feed._pins.findIndex(p => p.key === key); if(idx < 0) return;
  while(feed._n <= idx && feed._more) feed._more();
  const el = [...feed.children].find(e => e.dataset.key === key); if(!el) return;
  const r = el.getBoundingClientRect(), topH = document.getElementById("top").offsetHeight + 60;
  if(r.top < topH || r.bottom > innerHeight) scrollTo({top: scrollY + r.top - innerHeight / 3, behavior: "auto"});
}
// 觸控手勢
const hScroller = el => { for(let e = el; e && e !== modal; e = e.parentElement){ const ox = getComputedStyle(e).overflowX; if((ox === "auto" || ox === "scroll") && e.scrollWidth > e.clientWidth + 1) return e; } return null; };
let tg = null;
modal.addEventListener("touchstart", e => {
  if(e.touches.length !== 1 || !modal.classList.contains("on")){ tg = null; return; }
  const t = e.touches[0];
  tg = {x0: t.clientX, y0: t.clientY, t0: performance.now(), mode: null, top: modal.scrollTop <= 0,
        noX: !!hScroller(e.target) || !!e.target.closest("input,select,textarea,.jumpnav")};
}, {passive: true});
modal.addEventListener("touchmove", e => {
  if(!tg) return;
  const t = e.touches[0], dx = t.clientX - tg.x0, dy = t.clientY - tg.y0;
  if(!tg.mode){
    // 在頂端往下拉：第一個 touchmove 就接手，避免瀏覽器的回彈或下拉重新整理
    if(tg.top && modal.scrollTop <= 0 && dy > 0 && dy >= Math.abs(dx) && e.cancelable) e.preventDefault();
    if(Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    if(!tg.noX && Math.abs(dx) > Math.abs(dy) * 1.3 && navIndex() >= 0 && e.cancelable) tg.mode = "x";
    else if(tg.top && modal.scrollTop <= 0 && dy > 0 && dy > Math.abs(dx) && e.cancelable) tg.mode = "y";
    else { tg.mode = "none"; return; }
    sheet.style.transition = "none";
  }
  if(tg.mode === "none") return;
  if(e.cancelable) e.preventDefault();
  if(tg.mode === "x"){
    const edge = !nav.list[navIndex() + (dx < 0 ? 1 : -1)];
    sheet.style.transform = `translateX(${edge ? dx * .25 : dx}px)`;
  } else {
    const d = Math.max(0, dy) * .65;
    sheet.style.transform = `translateY(${d}px) scale(${1 - Math.min(d, 400) / 4000})`;
    modal.style.backgroundColor = `rgba(18,18,22,${.62 * Math.max(.15, 1 - d / 500)})`;
  }
}, {passive: false});
const touchEnd = e => {
  if(!tg || !tg.mode || tg.mode === "none"){ tg = null; return; }
  const t = e.changedTouches[0], dx = t.clientX - tg.x0, dy = t.clientY - tg.y0, v = performance.now() - tg.t0;
  const mode = tg.mode; tg = null;
  if(mode === "x"){
    const far = Math.abs(dx) > innerWidth * .22 || (Math.abs(dx) > 40 && Math.abs(dx) / v > .5);
    if(!(far && slideTo(dx < 0 ? 1 : -1, dx))) bounceBack();
  } else {
    const d = Math.max(0, dy) * .65;
    if(d > 110 || (d > 30 && dy / v > .6)) dragClose(); else bounceBack();
  }
};
modal.addEventListener("touchend", touchEnd);
modal.addEventListener("touchcancel", touchEnd);
// 第一次打開卡片的手機提示（只顯示前三次）
const HINT_KEY = "ghAlgoAtlas.swipeHint";
function swipeHint(){
  if(!MQ.matches || navIndex() < 0) return;
  let n = 0; try { n = +localStorage.getItem(HINT_KEY) || 0; } catch(e){}
  if(n >= 3) return;
  try { localStorage.setItem(HINT_KEY, n + 1); } catch(e){}
  const h = document.getElementById("swipeHint"); h.classList.add("on"); clearTimeout(swipeHint.t); swipeHint.t = setTimeout(() => h.classList.remove("on"), 2800);
}

const factDiff = d =>`<div class="fact"><div class="ico" style="font:900 15px 'JetBrains Mono'">${d}/5</div><small>難度</small><b>${dots(d)} ${CAT.difficulty[d]}</b></div>`;

/* ---- 演算法詳細頁 ---- */
function algoDetail(a){
  const rich = a.id === "A01", cs = CASES_OF(a.id);
  return `
  <div class="closeup">
    <div class="left"><canvas id="big"></canvas>
      <div class="ctrl">${rich ? `
        <div class="row"><label>${ico("i-logic-iterate")}世代</label><input type="range" id="g" min="1" max="6" value="4"><output id="go">4</output></div>
        <div class="row"><label>${ico("w-state")}轉角</label><input type="range" id="an" min="5" max="90" value="22"><output id="ao">22°</output></div>
        <div class="row"><label>${ico("w-geom")}縮放</label><input type="range" id="sc" min="50" max="100" value="100"><output id="so">1.00</output></div>
        <div class="row"><button class="btn" id="replay">${ico("i-play")}重播生長</button></div>` : `
        <div class="row"><button class="btn" id="reseed">${ico("i-dice")}換一組亂數</button><span class="ctrl-note algo-note">網頁版簡化實作，參數與範例程式相同邏輯</span></div>`}
      </div>
    </div>
    <div class="right in">
      <div class="kicker">${badge("algo", true)} ${chain(tFam(a.family), tAlgo(a.id))}<span class="kick-m">${a.id}・${esc(CAT.families[a.family])}</span></div>
      <h2>${esc(a.name_zh)}</h2><div class="en">${esc(a.name_en)}</div>
      <p class="oneliner">${esc(a.one_liner)}</p>
      <div class="facts">
        <div class="fact"><div class="ico">${ico(LOGIC_ICON[a.logic?.[0]] || "i-algo")}</div><small>邏輯</small>${(a.logic||[]).map(l => tAttr(LOGIC_ICON[l] || "i-algo", l, "邏輯")).join("")}</div>
        <div class="fact"><div class="ico">${ico(DS_ICON[a.data_structure?.[0]] || "i-ds-symbol")}</div><small>資料結構</small>${(a.data_structure||[]).map(d => tAttr(DS_ICON[d] || "i-ds-symbol", d, "資料結構")).join("")}</div>
        ${factDiff(a.difficulty)}
      </div>
      <div class="mini-h">${ico("i-logic-iterate")}怎麼運作 <small>${rich ? "滑過每一格看動作" : "每一格是一個步驟"}</small></div>
      ${rich ? flowLSystem(true) : flowGeneric(a)}
      <ol class="steps-m">${(a.how_it_works||[]).map(t => `<li>${esc(t)}</li>`).join("")}</ol>
      <div class="taglines" style="margin-top:22px">
        <div class="tagline"><span class="lbl">屬性</span>${tAttr("i-algo", a.loc + " 行 C#", "規模")}${tAttr("c-modeling", a.file || "", "範例檔")}</div>
        <div class="tagline"><span class="lbl">關鍵字</span>${(a.tags||[]).map(tKw).join("")}</div>
      </div>
    </div>
  </div>
  <nav class="jumpnav" aria-label="頁內導覽">${[["s-top","概要"], a.pseudo_code?.length && ["s-pseudo","虛擬碼"], ["s-param","參數"], ["s-var","變形"], ["s-case","案例"], (a.project_seeds||[]).length && ["s-seed","專案"]].filter(Boolean)
    .map(([id,t]) => `<button type="button" data-jump="${id}">${t}</button>`).join("")}</nav>
  ${pseudoBlock(a)}
  ${rich ? `
  <section class="sec reveal"><h3>${ico("i-ds-symbol")}符號表 <small>字串裡每個字元，畫筆怎麼動</small></h3><div class="glyphs">${glyphs()}</div></section>
  <section class="sec reveal" id="s-param"><h3>${ico("w-state")}參數怎麼影響形 <small>同一條規則，只改一個數字</small></h3><div class="params" id="params"></div></section>` : `
  <section class="sec reveal" id="s-param"><h3>${ico("w-state")}關鍵參數 <small>改這些數字，形就會變</small></h3><div class="pcards">${(a.key_params||[]).map(p => `<div class="pcard"><div class="pi">${ico("i-slider")}</div><div><code>${esc(p.name)}</code><p>${esc(p.effect)}</p></div></div>`).join("")}</div></section>`}
  <section class="sec reveal"><h3>${ico("i-code")}用到的 C# 積木</h3><div class="blocks">${rich ? blocks() : (a.csharp_concepts||[]).map(k => `<div class="block"><div class="bi">${ico("i-code")}</div><div><code>${esc(k)}</code></div></div>`).join("")}</div>
    ${a.teaching_note ? `<details class="tipbox fold"${FOLD()}><summary>${ico("i-bulb")}<b>學習建議</b></summary><p>${esc(a.teaching_note)}</p></details>` : ""}</section>
  <section class="sec" id="s-var"><h3>${ico("i-var")}變形 <small class="cnt">${a.variations.length} 種</small></h3><div class="subfeed" id="subVar"></div></section>
  <section class="sec" id="s-case"><h3>${ico("i-case")}應用案例 <small class="cnt">${cs.length} 個</small></h3><div class="subfeed" id="subCase"></div></section>
  <section class="sec" id="s-seed"><h3>${ico("i-seed")}延伸專案發想</h3><div class="subfeed" id="subSeed"></div></section>
  ${(a.references||[]).length ? `<section class="sec"><details class="fold"${FOLD()}><summary><h3>${ico("i-book")}延伸閱讀</h3></summary><ul class="refs">${a.references.map(r => `<li>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a>` : esc(r.title)}${r.author ? `<span>${esc(r.author)}</span>` : ""}${r.year ? `<span>${esc(r.year)}</span>` : ""}</li>`).join("")}</ul></details></section>` : ""}`;
}
// 虛擬碼：資料的 pseudo_code（每行一個字串，行首空白＝縮排）；關鍵字加粗、← 用家族色、參數名稱與關鍵參數同色、// 之後是註解
const PSEUDO_KW = /^(\s*)(輸入|輸出|重複|對|如果|否則|直到|當|回傳|結束)/;
function pseudoBlock(a){
  const lines = a.pseudo_code;
  if(!Array.isArray(lines) || !lines.length) return "";
  const names = (a.key_params||[]).map(p => p.name).filter(n => /^\w+$/.test(n || "")).sort((x, y) => y.length - x.length);
  const pv = names.length ? new RegExp(`\\b(${names.join("|")})\\b`, "g") : null;
  const fmt = line => {
    const i = line.indexOf("//"), code = i < 0 ? line : line.slice(0, i), cm = i < 0 ? "" : line.slice(i);
    let h = esc(code);
    if(pv) h = h.replace(pv, '<span class="pv">$1</span>');
    h = h.replace(PSEUDO_KW, '$1<span class="kw">$2</span>').replace(/←/g, '<span class="op">←</span>');
    return h + (cm ? `<span class="cm">${esc(cm)}</span>` : "");
  };
  // 手機版預設只顯示 RunScript 那一段，「RunScript 下方」之後（Fields／RULE／class）按鈕展開
  const cut = lines.findIndex(l => /-{3,}\s*RunScript 下方/.test(l)), head = cut > 0 ? lines.slice(0, cut) : lines, tail = cut > 0 ? lines.slice(cut) : [];
  const nTail = tail.filter(l => l.trim()).length;
  return `<section class="sec reveal" id="s-pseudo"><h3>${ico("i-code")}虛擬碼 <small>程式邏輯骨架；藍字是上方的關鍵參數</small></h3><pre class="pseudo">${head.map(fmt).join("\n")}${tail.length ? `<span class="ps-tail">\n${tail.map(fmt).join("\n")}</span>` : ""}</pre>${tail.length ? `<button class="ps-more" type="button" aria-expanded="false">展開 RunScript 下方與 class（${nTail} 行）</button>` : ""}</section>`;
}
// 一般演算法的圖示流程：依步驟內容挑圖示，只留短標題；完整句子收在下方
const STEP_ICON = [
  [/隨機|亂數|random/i, "i-dice"], [/停止|收斂|直到|結束|門檻/, "i-stop"], [/鄰居|最近|距離|附近|範圍內/, "i-ds-graph"],
  [/網格|格子|陣列|grid|像素/i, "i-grid"], [/力|速度|加速|推|移動/, "i-force"], [/規則|改寫|替換|文法/, "w-rule"],
  [/遞迴|分割|切|細分/, "i-logic-rewrite"], [/重複|每一代|每一步|迭代|迴圈|反覆/, "i-logic-iterate"],
  [/加入|新增|插入|長出|生成|放置/, "i-plus"], [/輸出|畫|繪|連成|Mesh|曲線|線段|多邊形/, "w-output"], [/輸入|讀|給定|設定|建立|初始/, "w-input"],
];
const stepIcon = t => (STEP_ICON.find(([re]) => re.test(t)) || [0, "i-algo"])[1];
const stepLabel = t => { const s = String(t).split(/[，。；：、（(]/)[0].trim(); return s.length > 13 ? s.slice(0, 12) + "…" : s; };
function flowGeneric(a){
  const S = a.how_it_works || [];
  return `<div class="flow compact gen">${S.map((t,i) => `<div class="step" style="--i:${i}" title="${esc(t)}"><div class="pict"><span class="n">${i+1}</span>${ico(stepIcon(t), "i big")}</div><b>${esc(stepLabel(t))}</b></div>`).join("")}</div>
    <details class="steps-full"><summary>看完整步驟說明</summary><ol>${S.map(t => `<li>${esc(t)}</li>`).join("")}</ol></details>`;
}
function wireDetail(key){
  const so = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add("in"); so.unobserve(e.target); } }), {root:modal, threshold:.15});
  sheet.querySelectorAll(".sec").forEach(s => so.observe(s));
  sheet.querySelectorAll(".vchip").forEach(b => b.onclick = () => b.setAttribute("aria-expanded", b.getAttribute("aria-expanded") !== "true"));
  const psm = sheet.querySelector(".ps-more");
  if(psm) psm.onclick = () => { const on = psm.getAttribute("aria-expanded") !== "true"; psm.setAttribute("aria-expanded", on); psm.previousElementSibling.classList.toggle("open", on);
    psm.textContent = on ? "收合" : psm.dataset.label; };
  if(psm) psm.dataset.label = psm.textContent;
  // 頁內跳轉列（手機版）：點了捲到該段，捲動時標出目前所在段落
  const jn = sheet.querySelector(".jumpnav");
  if(jn){
    const bs = [...jn.querySelectorAll("[data-jump]")], tgt = b => b.dataset.jump === "s-top" ? null : document.getElementById(b.dataset.jump);
    const off = () => jn.offsetHeight + 60;
    bs.forEach(b => b.onclick = () => { const t = tgt(b); modal.scrollTo({top: t ? modal.scrollTop + t.getBoundingClientRect().top - off() + 8 : 0, behavior: reduced ? "auto" : "smooth"}); });
    const mark = () => { let cur = bs[0]; bs.forEach(b => { const t = tgt(b); if(t && t.getBoundingClientRect().top - off() < 12) cur = b; }); bs.forEach(b => b.toggleAttribute("aria-current", b === cur)); };
    modal.onscroll = mark; mark();
  } else modal.onscroll = null;
  if(key === "info"){ wireInfo(); return; }
  const [kind, id, n] = key.includes(":") ? key.split(":") : ["case", key];
  const cv = document.getElementById("big");
  if(kind === "algo"){
    const a = ALG[id];
    if(id === "A01"){
      const p = {...P.hero, fam:"A"}, g = document.getElementById("g"), an = document.getElementById("an"), sc = document.getElementById("sc");
      const ov = () => ({gens:+g.value, angle:+an.value, scale:sc.value/100});
      const upd = anim => { document.getElementById("go").textContent = g.value; document.getElementById("ao").textContent = an.value+"°"; document.getElementById("so").textContent = (sc.value/100).toFixed(2); anim ? grow(cv,p,1600,ov()) : render(cv,p,1,ov()); };
      [g,an,sc].forEach(x => x.oninput = () => upd(false));
      document.getElementById("replay").onclick = () => upd(true);
      requestAnimationFrame(() => upd(true));
      paramStrips();
    } else {
      let seed = 0; const draw = () => genDraw(cv, id, seed, a.family, FAMC[a.family][0], 1);
      requestAnimationFrame(draw); document.getElementById("reseed").onclick = () => { seed = seed ? seed + 1 : 100; draw(); };
    }
    mountPins(document.getElementById("subVar"), a.variations.map((_,i) => pinVar(a,i)));
    mountPins(document.getElementById("subCase"), CASES_OF(id).map(pinCase));
    mountPins(document.getElementById("subSeed"), (a.project_seeds||[]).map((_,i) => pinSeed(a,i)));
    return;
  }
  const algoId = kind === "case" ? key.slice(0,3) : id, a = ALG[algoId];
  if(cv){ const vis = kind === "var" ? visual(algoId,"var",+n) : visual(algoId,"case",num(key)); requestAnimationFrame(() => vis.big(cv)); document.getElementById("replay")?.addEventListener("click", () => (vis.reseed || vis.big)(cv)); }
  const more = document.getElementById("subMore");
  if(more) mountPins(more, [pinAlgo(a), ...a.variations.map((_,i) => pinVar(a,i)).filter(p => p.key !== key).slice(0,5), ...CASES_OF(algoId).map(pinCase).filter(p => p.key !== key).slice(0,6)]);
}

/* ---- 變形詳細頁 ---- */
function varDetail(a, i){
  const v = a.variations[i];
  return `<div class="closeup">
    <div class="left"><canvas id="big"></canvas><div class="ctrl"><div class="row"><button class="btn" id="replay">${ico("i-play")}重畫</button></div></div></div>
    <div class="right">
      <div class="kicker">${badge("var", true)} ${chain(tFam(a.family,true), tAlgo(a.id), tVar(i,a.id))}<span class="kick-m">變形 ${a.id}·${vcode(i)}・${esc(a.name_zh)}</span></div>
      <h2>${esc(v.title)}</h2>
      <div class="facts">
        <div class="fact"><div class="ico">${ico(whatIcon(v.what_changes))}</div><small>改哪裡</small>${tAttr(whatIcon(v.what_changes), shortWhat(v.what_changes), "改哪裡")}</div>
        <div class="fact"><div class="ico" style="font:900 15px 'JetBrains Mono'">${v.level}/5</div><small>難度</small><b>${dots(v.level)}</b></div>
        <div class="fact"><div class="ico">${ico("i-case")}</div><small>得到</small><b style="font-size:13px;font-weight:500">${esc(v.result)}</b></div>
      </div>
      <div class="vchips"><button class="vchip" aria-expanded="true"><span class="vi">${ico("w-rule")}</span><div><b>怎麼改</b><div class="more"><div><p>${esc(v.how)}</p></div></div></div></button></div>
    </div></div>
  <section class="sec"><h3>${ico("i-var")}更多</h3><div class="subfeed" id="subMore"></div></section>`;
}
/* ---- 案例詳細頁 ---- */
function caseDetail(c){
  const a = ALG[c.algo], img = !!c.image;
  return `<div class="closeup">
    <div class="left">${img ? `${imgTag(c)}<div class="credit">${c.image.page ? `<a href="${esc(c.image.page)}" target="_blank" rel="noopener">${credit(c.image)}</a>` : credit(c.image)}</div>`
      : `<canvas id="big"></canvas><div class="ctrl"><div class="row"><button class="btn" id="replay">${ico("i-play")}重畫</button><span class="ctrl-note"><span class="note-full">示意圖：以 ${a.id} 的網頁版程式重現概念，非原作</span><span class="note-short">示意圖・非原作</span></span></div></div>`}</div>
    <div class="right">
      <div class="kicker">${badge("case", true)} ${chain(tFam(a.family,true), tAlgo(a.id))} ${tCat(c.category)}${isCC(c) ? ccBadge : ""}<span class="kick-m">案例・${a.id} ${esc(a.name_zh)}</span></div>
      <h2 style="font-size:28px">${esc(c.title)}</h2><div class="en">${esc(c.creator)}${c.year ? "・"+esc(c.year) : ""}</div>
      <div class="facts">
        <div class="fact"><div class="ico">${ico(SCALE_ICON[c.scale] || "c-3d-architecture")}</div><small>尺度</small>${c.scale ? tAttr(SCALE_ICON[c.scale] || "c-3d-architecture", c.scale, "尺度") : "—"}</div>
        <div class="fact"><div class="ico" style="font:900 15px 'JetBrains Mono'">${c.difficulty}/5</div><small>難度</small><b>${dots(c.difficulty)}</b></div>
        <div class="fact"><div class="ico">${ico("i-algo")}</div><small>演算法</small>${tAlgo(a.id)}</div>
      </div>
      <p class="oneliner" style="font-size:15px">${esc(c.summary)}</p>
      <h3 class="subh">${ico("i-var")}這個案例怎麼改 ${a.id} <small>點開看改法</small></h3>
      <div class="vchips">${(c.variations||[]).map(v => `<button class="vchip" aria-expanded="false"><span class="vi">${ico(whatIcon(v.how))}</span><div><b>${esc(v.name)}</b><div style="font-size:13px;color:var(--mute)">${esc(v.effect)}</div><div class="more"><div><p>${esc(v.how)}</p></div></div></div></button>`).join("")}</div>
      <div class="taglines" style="margin-top:16px">
        ${(c.tools||[]).length ? `<div class="tagline"><span class="lbl">工具</span>${c.tools.map(t => tAttr("c-modeling", t, "工具")).join("")}</div>` : ""}
        <div class="tagline"><span class="lbl">關鍵字</span>${(c.tags||[]).map(tKw).join("")}</div>
      </div>
      ${c.url ? `<a class="srcbtn" href="${esc(c.url)}" target="_blank" rel="noopener">${ico("i-open")}原始出處</a>` : `<p class="legend-note">出處待查證</p>`}
    </div></div>
  <section class="sec"><h3>${ico("i-case")}更多類似</h3><div class="subfeed" id="subMore"></div></section>`;
}
function seedDetail(a, i){
  const p = a.project_seeds[i];
  return `<div class="closeup"><div class="left seed-hero" style="background:var(--fam-tint);display:grid;place-items:center;min-height:380px"><svg viewBox="0 0 24 24" style="width:140px;height:140px;stroke:var(--fam-deep);fill:none;stroke-width:1.2"><use href="#i-seed"/></svg></div>
    <div class="right"><div class="kicker">${badge("seed", true)} ${chain(tFam(a.family,true), tAlgo(a.id))}<span class="kick-m">專案發想・${a.id} ${esc(a.name_zh)}</span></div><h2 style="font-size:28px">${esc(p.title)}</h2>
    <div class="facts"><div class="fact"><div class="ico" style="font:900 15px 'JetBrains Mono'">${p.difficulty}/5</div><small>難度</small><b>${dots(p.difficulty)}</b></div>
    <div class="fact fact-wide" style="grid-column:span 2"><div class="ico">${ico("w-hybrid")}</div><small>搭配</small><div class="chain">${[a.id, ...(p.combine_with||[])].filter(id => ALG[id]).map(id => tAlgo(id)).join("<b>＋</b>")}</div></div></div>
    <p class="oneliner">${esc(p.brief)}</p></div></div>
  <section class="sec"><h3>${ico("i-var")}可以從這些變形出發</h3><div class="subfeed" id="subMore"></div></section>`;
}

/* ================================================================
   7. 標籤說明（圖例）與「關於」
   ================================================================ */
document.getElementById("legend").innerHTML = `
  <div class="lg-head"><h4>標籤怎麼看</h4><button class="lg-close" type="button" aria-label="關閉標籤說明">${ico("i-x")}</button></div><div style="font-size:13px;color:var(--mute)">形狀代表「哪一類」；只有身分鏈用家族色。</div>
  <details class="lg-grp" open><summary class="lg-sec">身分鏈：這張卡屬於誰（家族 › 演算法 › 變形）</summary>
  <div class="lg"><span>${tFam("A")}</span><p><b>① 家族</b>實心方塊。依「長出來像什麼」分成七大家族 A–G。</p></div>
  <div class="lg"><span>${tAlgo("A01")}</span><p><b>② 演算法</b>分段膠囊。前段是編號，對應一支 Grasshopper C# 基礎範例（.cs）。</p></div>
  <div class="lg"><span>${tVar(0,"A01")}</span><p><b>③ 變形</b>虛線膠囊。從某個演算法改出來的版本，編號＝母演算法·V序號。</p></div></details>
  <details class="lg-grp"${FOLD()}><summary class="lg-sec">描述：這張卡是什麼、用在哪、有什麼特性</summary>
  <div class="lg"><span>${badge("case", true)}</span><p><b>④ 卡片類型</b>圓章，只出現在圖片左上：演算法（黑）／變形（虛線）／案例（白）／專案發想（黑）。</p></div>
  <div class="lg"><span>${ccBadge}</span><p><b>來源</b>creative coding 案例（p5.js、Processing 等）在圖片右上多一個標記。</p></div>
  <div class="lg"><span>${tCat("3d-architecture")}</span><p><b>⑤ 應用類型</b>灰底膠囊＋圖示。案例用在哪個領域（8 類）。</p></div>
  <div class="lg"><span>${tAttr("i-logic-rewrite","改寫／遞迴")}</span><p><b>⑥ 屬性</b>方角細框。邏輯、資料結構、尺度、工具、改哪裡。</p></div>
  <div class="lg"><span>${tKw("遞迴")}</span><p><b>⑦ 關鍵字</b>沒有框，# 開頭，用來搜尋。</p></div>
  <div class="lg"><span>${dots(3)}</span><p><b>難度</b>5 點，實心越多越難。</p></div></details>`;
const lb = document.getElementById("legendBtn"), lg = document.getElementById("legend");
const legendOn = on => { lg.classList.toggle("on", on); lb.setAttribute("aria-expanded", on); if(MQ.matches && !document.getElementById("chips").classList.contains("on")) document.getElementById("fback").classList.toggle("on", on); };
lb.onclick = e => { e.stopPropagation(); legendOn(!lg.classList.contains("on")); };
lg.querySelector(".lg-close").onclick = () => legendOn(false);
document.addEventListener("click", e => { if(!lg.contains(e.target)) legendOn(false); });

function wireInfo(){
  const nV = ALGOS.reduce((s,a) => s + a.variations.length, 0), nS = ALGOS.reduce((s,a) => s + (a.project_seeds||[]).length, 0), nCC = CASES.filter(isCC).length;
  sheet.querySelector("#iStats").innerHTML = [[ALGOS.length,"演算法"],[CASES.length,"應用案例"],[nCC,"creative coding 案例"],[nV,"變形食譜"],[nS,"專案發想"]].map(([n,t]) => `<div class="stat"><b>${n}</b><small>${t}</small></div>`).join("");
  sheet.querySelector("#iFams").innerHTML = Object.keys(CAT.families).map(f => { const list = ALGOS.filter(a => a.family === f);
    return `<details class="ifam"${FOLD()}><summary>${tFam(f)}<span class="ifam-n">${list.length}</span></summary><div class="list">${list.map(a => `<button class="linkchip" data-open="algo:${a.id}">${tAlgo(a.id)}</button>`).join("")}</div></details>`; }).join("");
  if(MQ.matches) sheet.querySelectorAll("details.fold").forEach(d => d.open = false);
  sheet.querySelectorAll("[data-open]").forEach(b => b.onclick = () => open(b.dataset.open));
  const top = (k, name) => Object.entries(prefs[k]).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([key]) => name(key)).join("");
  const pr = sheet.querySelector("#iPrefs");
  const show = () => { const t = top("algo", id => ALG[id] ? tAlgo(id) : "") + top("fam", f => CAT.families[f] ? tFam(f) : "") + top("cat", c => CAT.categories[c] ? tCat(c) : "");
    pr.innerHTML = t ? `<div class="tagline">${t}</div>` : `<p class="legend-note">還沒有瀏覽紀錄。</p>`; };
  show();
  sheet.querySelector("#iReset").onclick = () => { ["fam","algo","cat","type","src","diff"].forEach(k => prefs[k] = {}); try { localStorage.removeItem(PREF_KEY); } catch(e){} show(); };
}

/* ================================================================
   8. 啟動
   ================================================================ */
renderChips(); renderFeed(); setTopH(); qHint();
if(location.hash.length > 1) setTimeout(() => { nav.list = feed._pins; open(decodeURIComponent(location.hash.slice(1))); }, 60);
