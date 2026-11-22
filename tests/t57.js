// 読むだけのマニュアル（manual/*.html）: アプリの説明のボタンから、その見出しへ飛ぶ。書き換えられない。目次とリンクで移れる
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const APP=(process.env.APP_URL||'file://'+__dirname+'/../index.html');
const base=APP.replace(/index\.html.*$/,'');
const K='2026-11-22';
async function ctxNew(vp){const ctx=await b.newContext({viewport:vp||{width:390,height:844},hasTouch:true,isMobile:true});await fr(ctx);await ctx.route(/nominatim|gsi|tile|open-meteo|cyberjapan/,r=>r.abort());return ctx}
const docs=['easy','zukai','tsukaikata'];

console.log('1. 3つのページが開き、書き換えの仕組みがない');
let ctx=await ctxNew();
for(const d of docs){const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));
  await p.goto(base+'manual/'+d+'.html');await p.waitForTimeout(300);
  const r=await p.evaluate(()=>({h1:document.querySelector('h1')&&document.querySelector('h1').textContent,
    ed:document.querySelectorAll('[contenteditable],textarea,input,form').length,design:document.designMode,
    ro:!!document.querySelector('.ro'),toc:document.querySelectorAll('details.toc a').length,
    imgs:[...document.images].map(i=>i.getAttribute('src')),over:document.documentElement.scrollWidth>document.documentElement.clientWidth}));
  ok(r.h1&&r.ed===0&&r.design==='off'&&r.ro,d+': 「'+r.h1+'」 入力欄なし・読むだけの注意あり');
  ok(r.toc>=5,d+': 目次 '+r.toc+'項目');
  ok(!r.over,d+': 横にはみ出さない');
  if(r.imgs.length){const bad=await p.evaluate(async s=>{const out=[];for(const u of s){const x=await fetch(u);if(!x.ok)out.push(u)}return out},r.imgs);ok(!bad.length,d+': 図 '+r.imgs.length+'枚が全部ある '+bad.join(','))}
  ok(!E.length,d+': エラーなし '+E.join('/'));await p.close()}

console.log('2. アプリの説明のボタンの行き先が、どれもページの中にある');
const p0=await ctx.newPage();await p0.goto(APP);await p0.waitForTimeout(800);
const all=await p0.evaluate(()=>Object.keys(MS).map(k=>manUrl(k)));
let miss=[];for(const u of all){const [f,id]=u.split('#');const q=await ctx.newPage();await q.goto(new URL(f,p0.url()).href);if(!(await q.evaluate(i=>!!document.getElementById(i),id)))miss.push(u);await q.close()}
ok(all.length>=30&&!miss.length,all.length+'個のリンクの見出しが全部ある '+miss.join(' '));
ok(await p0.evaluate(()=>MAN.easy.u==='manual/easy.html'),'単体版は同じ場所のマニュアルを開く');
await p0.close();

console.log('3. 押すとその見出しへ飛ぶ');
let p=await ctx.newPage();await p.goto(base+'manual/tsukaikata.html#co');await p.waitForTimeout(600);
let top=await p.evaluate(()=>document.getElementById('co').getBoundingClientRect().top);
ok(top>=40&&top<200,'#co で開くと「会社の決まり」の見出しが上に見える（'+Math.round(top)+'px。上の帯に隠れない）');
await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(200);
await p.locator('details.toc summary').tap();await p.waitForTimeout(200);
await p.locator('details.toc a[href="#trouble"]').tap();await p.waitForTimeout(900);
top=await p.evaluate(()=>document.getElementById('trouble').getBoundingClientRect().top);
ok(top>=40&&top<200,'目次の「困ったとき」を押すと、その章へ移る（'+Math.round(top)+'px）');
await p.goto(base+'manual/easy.html');await p.waitForTimeout(300);
await p.locator('a[href="zukai.html"]').first().tap();await p.waitForURL(/zukai\.html/);ok(/zukai\.html$/.test(p.url()),'本文のリンクで、ほかのマニュアルへ移る');
const hb=await p.evaluate(()=>{const a=document.getElementById('back').getBoundingClientRect();return a.height});ok(hb>=44,'［‹ 戻る］は押しやすい大きさ '+hb);
await p.locator('#back').tap();await p.waitForTimeout(600);ok(/easy\.html/.test(p.url()),'［‹ 戻る］で前のマニュアルへ');
await p.close();
p=await ctx.newPage();await p.goto(base+'manual/zukai.html#co');await p.waitForTimeout(300);
await p.locator('#back').tap();await p.waitForTimeout(600);
ok(/zukai\.html/.test(p.url())&&await p.evaluate(()=>!document.getElementById('backhint').hidden),'直接開いたときは、閉じ方の案内を出す（記録のない画面へは移らない）');
await p.close();

console.log('4. Claude版から開いたとき');
p=await ctx.newPage();await p.goto(base+'manual/easy.html?from=claude#ride');await p.waitForTimeout(300);
const hs=await p.evaluate(()=>[...document.querySelectorAll('main a')].map(a=>a.getAttribute('href')).filter(h=>/\.html/.test(h)));
ok(hs.length&&hs.every(h=>/\?from=claude/.test(h)),'ほかのマニュアルへのリンクも Claude版 のまま '+hs.length+'個');
await p.close();await ctx.close();

console.log('5. 小さい画面（SE）・暗い画面');
ctx=await ctxNew({width:320,height:568});
for(const d of docs){const q=await ctx.newPage();await q.emulateMedia({colorScheme:'dark'});await q.goto(base+'manual/'+d+'.html');await q.waitForTimeout(200);
  const r=await q.evaluate(()=>({over:document.documentElement.scrollWidth>document.documentElement.clientWidth,bg:getComputedStyle(document.body).backgroundColor}));
  ok(!r.over&&r.bg!=='rgb(255, 248, 225)',d+': 320px で横にはみ出さず、暗い画面になる');await q.close()}
await ctx.close();await b.close()})();
