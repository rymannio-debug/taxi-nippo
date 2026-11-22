// デバッグ: 日付の自動切替、支払いボタンの戻る、修正画面の時刻、料金から入れる、帰庫後・休憩中の表示
(async()=>{const {chromium}=require('./pw');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const ymdOf=n=>n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
async function page(seed,time){const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());
 const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;if(time)await p.clock.setFixedTime(time);
 await p.addInitScript(sd=>{if(!localStorage.getItem('__seeded')){localStorage.clear();if(sd)for(const k in sd)localStorage.setItem(k,JSON.stringify(sd[k]));localStorage.setItem('__seeded','1')}},seed||null);
 await p.goto((process.env.APP_URL||'file://'+__dirname+'/../index.html'));await p.waitForTimeout(700);return p}
const C=(p,id)=>p.evaluate(i=>document.getElementById(i).click(),id);
const vis=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0},sel);
const key=async(p,k)=>{await p.evaluate(k=>document.querySelector('#np [data-k="'+k+'"]').click(),k);await p.waitForTimeout(470)};

console.log('1. 日付が変わったら新しい日の日報へ（設定タブを作ったあとも）');
const t0=new Date(2026,10,20,15,0).getTime(),Y='2026-11-20',T='2026-11-21';
let p=await page({'taxi-nippo-v1':{[Y]:{type:'day',date:Y,startTime:'07:00',endTime:'14:50',trips:[{id:'a',t:'08:00',fare:2000,pay:'cash',from:'a',to:'b',ts:t0-5*3600e3}],breaks:[]}}},t0);
ok(/20日/.test(await p.textContent('#dlabel')),'今日は20日');
await p.clock.setFixedTime(new Date(2026,10,21,8,0));
await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'visible'});document.dispatchEvent(new Event('visibilitychange'))});await p.waitForTimeout(400);
ok(/21日/.test(await p.textContent('#dlabel')),'翌朝アプリを開くと21日の日報になる: '+(await p.textContent('#dlabel')).trim());
ok(await p.evaluate(()=>document.getElementById('ride').dataset.st)==='pre','新しい日は出庫前（下が「出庫」）');
await C(p,'tab-set');await p.waitForTimeout(200);await C(p,'tab-day');await p.waitForTimeout(200);ok(/21日/.test(await p.textContent('#dlabel')),'設定タブを開いて戻っても21日');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('2. 支払いボタンから「料金に戻る」で直す');
const today=ymdOf(new Date());
p=await page({'taxi-nippo-v1':{[today]:{type:'day',date:today,startTime:'07:00',trips:[],breaks:[]}}});
await C(p,'ride-b');await p.waitForTimeout(2200);await C(p,'ride-b');await p.waitForTimeout(500);
for(const k of ['1','5','0','0'])await key(p,k);await key(p,'ok');await p.waitForTimeout(500);
ok(await vis(p,'#np-pay'),'支払いボタンが出る');
await p.evaluate(()=>document.querySelector('#np-pay [data-pk="back"]').click());await p.waitForTimeout(500);
ok(await vis(p,'#np-kf')&&!(await vis(p,'#np-pay')),'「料金に戻る」で数字キーに戻る');
await key(p,'1');await key(p,'8');await key(p,'0');await key(p,'0');ok(await p.inputValue('#p-fare')==='1800','そのまま打ち直すと置き換わる 1800: '+await p.inputValue('#p-fare'));
await key(p,'ok');await p.waitForTimeout(300);ok(/1,800/.test(await p.textContent('#np-v')),'支払いの画面に直した料金 ¥1,800');
await p.waitForTimeout(300);await p.evaluate(()=>document.querySelector('#np-pay [data-pk="cash"]').click());await p.waitForTimeout(500);
if(await vis(p,'#vs'))await p.evaluate(()=>document.querySelector('#vs [data-vs="force"]').click());await p.waitForTimeout(300);
let d=await p.evaluate(k=>JSON.parse(JSON.stringify(days))[k],today);ok(d.trips.length===1&&d.trips[0].fare===1800&&d.trips[0].pay==='cash','¥1,800 現金で記録');
ok(!(await vis(p,'#np')),'記録したら数字キーは閉じる');

console.log('3. 料金から入れる（乗車ボタンを使わない記録）');
await p.waitForTimeout(500);await C(p,'q-fare');await p.waitForTimeout(600);ok(await p.evaluate(()=>document.activeElement.id)==='p-fare','料金の欄が開いて数字キー');
for(const k of ['3','0','0','0'])await key(p,k);await key(p,'ok');await p.waitForTimeout(500);await p.evaluate(()=>document.querySelector('#np-pay [data-pk="card"]').click());await p.waitForTimeout(500);
ok(await vis(p,'#vs')&&/時刻/.test(await p.textContent('#vs-rows')),'時刻がないので記録前の確認');await p.evaluate(()=>document.querySelector('#vs [data-vs="force"]').click());await p.waitForTimeout(300);
d=await p.evaluate(k=>JSON.parse(JSON.stringify(days))[k],today);ok(d.trips.length===2&&d.trips[1].pay==='card'&&/^\d\d:\d\d$/.test(d.trips[1].t),'¥3,000 カード、いまの時刻で記録');
ok(await vis(p,'#q-fare')&&!(await vis(p,'#p-fare')),'記録したら欄はまたたたまれる');

console.log('4. 修正画面で時刻を触らずに保存');
await p.evaluate(k=>{const o=JSON.parse(JSON.stringify(days));o[k].trips.push({id:'v',t:'11:11',tin:null,tout:null,fare:900,pay:'cash',pax:1,from:'x',to:'y',ts:9});localStorage.setItem('taxi-nippo-v1',JSON.stringify(o))},today);
await p.evaluate(()=>{loadLocal();render()});await p.waitForTimeout(300);
await p.evaluate(()=>[...document.querySelectorAll('.trip')].find(x=>/11:11/.test(x.textContent)).click());await p.waitForTimeout(300);
ok(await p.inputValue('#e-t1')==='11:11','乗車時刻の欄に 11:11 が出る');await C(p,'e-save');await p.waitForTimeout(300);
d=await p.evaluate(k=>JSON.parse(JSON.stringify(days))[k].trips.find(t=>t.id==='v'),today);ok(d.t==='11:11'&&d.tin==null,'触らなければ時刻はそのまま: '+JSON.stringify({t:d.t,tin:d.tin}));
await p.evaluate(()=>[...document.querySelectorAll('.trip')].find(x=>/11:11/.test(x.textContent)).click());await p.waitForTimeout(300);await p.fill('#e-t1','11:40');await C(p,'e-save');await p.waitForTimeout(300);
d=await p.evaluate(k=>JSON.parse(JSON.stringify(days))[k].trips.find(t=>t.id==='v'),today);ok(d.t==='11:40'&&d.tin==='11:40','直すと時刻と乗車時刻がそろう: '+JSON.stringify({t:d.t,tin:d.tin}));
ok(!p.E.length,'エラーなし '+p.E.join('/'));

console.log('5. 休憩中と帰庫後の表示');
await C(p,'brk-b');await p.waitForTimeout(300);let s=await p.evaluate(()=>({st:document.getElementById('ride').dataset.st,t:document.getElementById('ride-b').textContent,s:document.getElementById('ride-b').dataset.s}));
ok(s.st==='brk'&&s.t==='休憩終了'&&/休憩中/.test(s.s),'休憩中: '+JSON.stringify(s));ok(!(await vis(p,'#r-o1'))&&!(await vis(p,'#q-fare')),'休憩中はメーターと「料金から入れる」は出ない');
await p.waitForTimeout(2100);await C(p,'ride-b');await p.waitForTimeout(300);
await C(p,'sh-b');await p.waitForTimeout(300);await p.evaluate(()=>document.activeElement.blur());await p.waitForTimeout(600);await C(p,'rv-close').catch(()=>{});await p.waitForTimeout(300);
s=await p.evaluate(()=>({st:document.getElementById('ride').dataset.st,s:document.getElementById('ride-b').dataset.s}));ok(s.st==='closed'&&/帰庫済み/.test(s.s),'帰庫後: '+JSON.stringify(s));
ok(!(await vis(p,'#q-fare'))&&!(await vis(p,'#q-text'))&&!(await vis(p,'#r-o1')),'帰庫後は入力欄を出さない');
await p.waitForTimeout(2100);await C(p,'ride-b');await p.waitForTimeout(300);ok(await vis(p,'#ride-closed'),'帰庫後に下のボタンを押すと確認が出る');
ok(!p.E.length,'エラーなし '+p.E.join('/'));
await b.close()})();
