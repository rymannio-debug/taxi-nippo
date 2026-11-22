// A+B+D: タイムライン、下の大きいボタンと［休憩］［話す］［帰庫］、表示灯とメーター風、画面の明るさ
(async()=>{const {chromium}=require('./pw');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const today=(()=>{const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')})();
async function page(seed,opt={}){const ctx=await b.newContext({viewport:opt.vp||{width:390,height:844}});await ctx.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());
 const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;if(opt.time)await p.clock.setFixedTime(opt.time);
 await p.addInitScript(sd=>{if(!localStorage.getItem('__s')){localStorage.clear();for(const k in sd)localStorage.setItem(k,JSON.stringify(sd[k]));localStorage.setItem('__s','1')}},seed);
 await p.goto('file://'+__dirname+'/../index.html');await p.waitForTimeout(700);return p}
const C=(p,id)=>p.evaluate(i=>document.getElementById(i).click(),id);
const vis=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0},sel);
const tl=p=>p.$$eval('#listwrap .tl',e=>e.map(x=>x.className.replace('tl ','')+':'+x.textContent.replace(/\s+/g,' ').trim().slice(0,22)));
const now=Date.now();
const tr=(id,t,tout,fare)=>({id,t,tin:t,tout,fare,pay:'cash',pax:1,from:'a駅',to:'b駅',ts:now-3600e3});

console.log('D. タイムライン');
let p=await page({'taxi-nippo-v1':{[today]:{type:'day',date:today,startTime:'07:02',odoStart:45202,breaks:[{id:'k',s:'09:40',e:'10:00',ts:1}],trips:[tr('c','10:20','10:44',3100),tr('a','08:12','08:31',2400),tr('b','09:05','09:22',1500)]}}});
let L=await tl(p);console.log('     '+L.join('\n     '));
ok(/^tl-s/.test(L[0])&&/出庫/.test(L[0]),'いちばん上が出庫');
ok(/08:12/.test(L[1])&&/09:05/.test(L[2])&&/tl-k/.test(L[3])&&/10:20/.test(L[4]),'乗車と休憩が時刻順（08:12 → 09:05 → 休憩 09:40 → 10:20）');
ok(/tl-now/.test(L[L.length-1])&&/いまここ/.test(L[L.length-1])&&/空車/.test(L[L.length-1]),'いちばん下に「いまここ 空車」');
ok(/今日の流れ/.test(await p.textContent('#listwrap').then(()=>p.evaluate(()=>document.getElementById('listwrap').previousElementSibling.textContent))),'見出しは「今日の流れ」');
await p.evaluate(()=>document.querySelector('.tl-r .trip').click());await p.waitForTimeout(300);ok(await vis(p,'#ov')&&/261/.test(await p.textContent('#sh-h')),'乗車の行を押すと修正画面');await C(p,'e-cancel');
await p.evaluate(()=>document.querySelector('.tl-s .tl-x').click());await p.waitForTimeout(300);ok(await p.evaluate(()=>document.getElementById('meta').open),'出庫の行を押すと「乗務情報・目標」が開く');
await C(p,'ride-b');await p.waitForTimeout(300);ok(/乗車中/.test(await p.textContent('#tl-now')),'乗車すると「いまここ」が乗車中に: '+(await p.textContent('#tl-now')).replace(/\s+/g,' '));
await C(p,'ride-x');await p.waitForTimeout(200);

console.log('A. 大きいボタンと［休憩］［話す］［帰庫］');
const geo=await p.evaluate(()=>{const g=e=>{const r=e.getBoundingClientRect();return {t:Math.round(r.top),b:Math.round(innerHeight-r.bottom),h:Math.round(r.height),w:Math.round(r.width)}};return {big:g(document.getElementById('ride-b')),row:g(document.getElementById('dockrow')),items:[...document.getElementById('dockrow').children].map(x=>x.textContent.trim())}});
ok(geo.big.h>=100&&geo.big.w>=340,'次にやるボタンが大きい '+JSON.stringify(geo.big));ok(geo.items.join()==='休憩,話す'&&geo.row.b<30,'その下に 休憩・話す（帰庫は置かない） '+geo.items.join('/'));
await p.evaluate(()=>scrollTo(0,99999));await p.waitForTimeout(200);
ok(await p.evaluate(()=>{const n=document.getElementById('tl-now').getBoundingClientRect(),d=document.getElementById('ride-b').getBoundingClientRect();return n.bottom<=d.top}),'いちばん下まで動かすと「いまここ」がボタンに隠れない');
await C(p,'d-brk');await p.waitForTimeout(300);ok(await p.evaluate(()=>document.getElementById('ride').dataset.st)==='brk','［休憩］で休憩に入る');
ok(await p.evaluate(()=>document.getElementById('d-brk').classList.contains('off')),'休憩中は［休憩］は薄く');
await p.waitForTimeout(2100);await C(p,'ride-b');await p.waitForTimeout(300);
await p.waitForTimeout(2100);await C(p,'ride-b');await p.waitForTimeout(300);
ok(!(await p.$('#d-kiko')),'下の段に［帰庫］はない（話すの隣で押し間違えないように）');
await C(p,'ride-x');await p.waitForTimeout(200);
await C(p,'sh-b');await p.waitForTimeout(400);let d=await p.evaluate(k=>JSON.parse(JSON.stringify(days))[k],today);ok(!!d.endTime&&await p.evaluate(()=>document.activeElement.id)==='sh-odo','帰庫は「乗務中」の［帰庫］から。押すと帰庫メーターへ');
await p.evaluate(()=>document.activeElement.blur());await p.waitForTimeout(800);await C(p,'rv-close').catch(()=>{});await p.waitForTimeout(300);
L=await tl(p);ok(/tl-e/.test(L[L.length-1])&&/帰庫/.test(L[L.length-1])&&!L.some(x=>/tl-now/.test(x)),'帰庫後はいちばん下が帰庫（いまここは出ない）');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('   出庫前');
p=await page({'taxi-nippo-v1':{}});ok(await p.evaluate(()=>document.getElementById('d-brk').classList.contains('off')),'出庫前は［休憩］は薄く');
ok(await vis(p,'#listwrap .blank')&&!(await vis(p,'.tl')),'出庫前で記録がなければ、使い方の説明');await p.context().close();

console.log('   夜勤（日付またぎ）');
const t0=new Date(2026,10,20,1,30).getTime(),Y='2026-11-19';
p=await page({'taxi-nippo-v1':{[Y]:{type:'day',date:Y,startTime:'18:00',startTs:t0-7*3600e3,breaks:[],trips:[{id:'x',t:'23:40',tin:'23:40',tout:'00:10',fare:5600,pay:'card',from:'a',to:'b',ts:t0-2*3600e3},{id:'y',t:'00:40',tin:'00:40',tout:'01:00',fare:1800,pay:'cash',from:'c',to:'d',ts:t0-3600e3}]}}},{time:t0});
L=await tl(p);ok(/23:40/.test(L[1])&&/00:40/.test(L[2])&&/tl-now/.test(L[3]),'深夜0時をまたいでも順番どおり: '+L.join(' | '));await p.context().close();

console.log('B. 表示灯とメーター風、画面の明るさ');
p=await page({'taxi-nippo-v1':{[today]:{type:'day',date:today,startTime:'07:00',trips:[],breaks:[]}}});
ok(await p.evaluate(()=>getComputedStyle(document.getElementById('ride-s')).boxShadow!=='none'),'状態の札が光る（表示灯）');
ok(await p.evaluate(()=>{const s=getComputedStyle(document.getElementById('sb-total'));return !/Dela/.test(s.fontFamily.split(',')[0])&&+s.fontWeight>=700}),'営収は読みやすい太字の数字');
await C(p,'tab-set');await p.waitForTimeout(200);ok(await vis(p,'#themechips'),'設定に「画面の明るさ」');
await p.evaluate(()=>document.querySelector('[data-theme-set="dark"]').click());await p.waitForTimeout(200);
ok(await p.evaluate(()=>document.documentElement.dataset.theme==='dark'&&getComputedStyle(document.body).backgroundColor!=='rgb(255, 255, 255)'),'「夜」で暗い画面');
ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('taxi-nippo-ui-v1')).theme==='dark'),'選んだものを覚える');
await p.evaluate(()=>document.querySelector('[data-theme-set="auto"]').click());await p.waitForTimeout(200);ok(await p.evaluate(()=>!document.documentElement.dataset.theme),'「自動」に戻せる');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('   狭い画面');
p=await page({'taxi-nippo-v1':{[today]:{type:'day',date:today,startTime:'07:02',breaks:[],trips:[tr('a','08:12','08:31',123400)]}}},{vp:{width:320,height:568}});
ok(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'320pxではみ出さない');
ok(await p.evaluate(()=>[...document.getElementById('dockrow').children].every(b=>b.scrollWidth<=b.clientWidth+1)),'下の3つのボタンの文字が収まる');
await p.screenshot({path:'abd_320.png'});await p.context().close();
await b.close()})();
