// プロのやり方に合わせた作り変え: メーターは出庫・帰庫だけ（はじめの設定）／帰庫でメーターの集計を写して照合／乗務記録の形の日報／納金
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const K='2026-11-21';
async function page(data,o={}){const ctx=await b.newContext({viewport:o.vp||{width:390,height:844},geolocation:o.geo,permissions:o.geo?['geolocation']:[]});await fr(ctx);
 if(o.geo){await ctx.route(/nominatim/,r=>r.fulfill({contentType:'application/json',body:JSON.stringify({address:{city:'調布市',suburb:'布田'}})}));
  await ctx.route(/gsi\.go\.jp/,r=>r.fulfill({contentType:'application/json',body:JSON.stringify({results:{muniCd:'13208',lv01Nm:'布田一丁目'}})}))}
 else await ctx.route(/nominatim|gsi/,r=>r.abort());
 await ctx.route(/tile|open-meteo|cyberjapan/,r=>r.abort());
 const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
 await p.clock.install({time:o.at||new Date(2026,10,21,17,30)});
 await p.addInitScript(([sd,u])=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();if(sd)localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd));if(u)localStorage.setItem('taxi-nippo-ui-v1',JSON.stringify(u))},[data||null,o.ui||null]);
 await p.goto('file://'+__dirname+'/../index.html');await p.waitForTimeout(800);return p}
const C=(p,id)=>p.evaluate(i=>document.getElementById(i).click(),id);
const kv=p=>p.evaluate(()=>[...document.querySelectorAll('#rv-body .rtable tr')].filter(r=>r.querySelector('th')).map(r=>r.querySelector('th').textContent+'='+r.querySelector('td').textContent).join('|'));
const txt=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' '):''},sel);
const vis=(p,id)=>p.evaluate(i=>{const e=document.getElementById(i);return !!e&&!e.hidden&&e.getClientRects().length>0},id);
const store=p=>p.evaluate(k=>JSON.parse(JSON.stringify(days))[k],K);
const fill=async(p,id,v)=>{await p.evaluate(([i,v])=>{const e=document.getElementById(i);e.focus();e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.blur()},[id,v]);await p.waitForTimeout(150)};
const rides=()=>[{id:'a',t:'08:10',tin:'08:10',tout:'08:25',fare:1500,pay:'cash',from:'調布駅',to:'府中駅',ts:1},
 {id:'b',t:'10:00',tin:'10:00',tout:'10:30',fare:3200,pay:'card',from:'府中駅',to:'三鷹駅',ts:2,toll:0},
 {id:'c',t:'13:40',tin:'13:40',tout:'14:05',fare:2600,pay:'qr',from:'三鷹駅',to:'調布駅',ts:3},
 {id:'d',t:'15:00',tin:'15:00',tout:'15:20',fare:4100,pay:'ticket',tkco:'東京電力',from:'調布駅',to:'新宿',ts:4}];

console.log('1. はじめの設定は「出庫・帰庫のときだけ」');
let p=await page(null);
ok(await p.evaluate(()=>document.querySelector('#odochips [data-odo="end"]').getAttribute('aria-pressed'))==='true','記録がない新しい端末では「出庫・帰庫のときだけ」');
ok(await p.evaluate(()=>document.querySelector('#odochips').firstElementChild.dataset.odo)==='end','設定では「出庫・帰庫のときだけ」が先に並ぶ');
await p.context().close();
p=await page({[K]:{type:'day',date:K,startTime:'07:00',odoStart:85100,breaks:[],trips:[{id:'x',t:'08:00',fare:1000,pay:'cash',o1:85110,o2:85114,ts:1}]}});
ok(await p.evaluate(()=>document.querySelector('#odochips [data-odo="ride"]').getAttribute('aria-pressed'))==='true','乗車ごとにメーターを入れてきた人は「乗車・降車のたび」のまま');
await p.context().close();

console.log('2. 帰庫 → 帰庫メーター → メーターの集計を写す → 照合');
const D={[K]:{type:'day',date:K,startTime:'07:00',odoStart:85100,breaks:[{id:'b1',s:'12:00',e:'12:50',ts:1}],trips:rides()}};
p=await page(D);
ok(!(await vis(p,'r-o1')),'乗車の欄にメーターが出ない');
await C(p,'sh-b');await p.waitForTimeout(300);
await p.evaluate(()=>{const e=document.getElementById('sh-odo');e.value='85310';e.dispatchEvent(new Event('input',{bubbles:true}));e.blur()});await p.waitForTimeout(800);
ok(await vis(p,'rv'),'帰庫メーターを入れると日報が開く');
ok(await vis(p,'rv-meter'),'「タクシーメーターの集計を写す」の欄が出る');
const note=await txt(p,'#rv-note');
ok(/納金：現金 1,500円・キャッシュレス 5,800円・チケット 4,100円/.test(note),'帰庫のカードに納金: '+note.replace(/^.*納金/,'納金'));
await fill(p,'mt-n','5');
let res=await txt(p,'#mt-res');
ok(/メーター 5回・記録 4回。1回分の記録漏れがあるかもしれません/.test(res),'営業回数が多い → 記録漏れ: '+res);
let chk=await txt(p,'#rv-check');
ok(/メーターの営業回数より、記録が1回少ない（記録漏れ）/.test(chk),'確かめてほしいところにも出る');
await p.evaluate(()=>{const b=[...document.querySelectorAll('#rv-check [data-dc]')].find(x=>/営業回数/.test(x.textContent));b.click()});await p.waitForTimeout(400);
ok(await vis(p,'rv')&&await p.evaluate(()=>document.activeElement&&document.activeElement.id)==='mt-n','「直す」で日報を閉じずに営業回数の欄へ');
await fill(p,'mt-n','4');await fill(p,'mt-fare','11400');await fill(p,'mt-lk','98.6');
res=await txt(p,'#mt-res');
ok(/✓営業回数 4回は、記録と合っています/.test(res)&&/✓運収 11,400円は、記録の営収と合っています/.test(res),'合っていれば ✓');
ok(/実車率 47%（実車 98.6 km ÷ 走行 210 km）/.test(res),'メーターの実車キロで実車率: '+res.replace(/^.*実車率/,'実車率'));
ok(/入力の漏れはありません/.test(await txt(p,'#rv-check')),'照合が合えば「入力の漏れはありません」');
let d=await store(p);
ok(JSON.stringify(d.meter)==='{"n":4,"fare":11400,"lk":98.6}','日の記録に保存: '+JSON.stringify(d.meter));
await fill(p,'mt-fare','11000');
res=await txt(p,'#mt-res');
ok(/メーター 11,000円・記録 11,400円。400円多くなっています/.test(res),'運収がちがえば差額: '+res.replace(/^.*メーター 11/,'メーター 11'));
await fill(p,'mt-fare','11400');

console.log('3. 日報1枚 = 乗務記録の形');
const body=await kv(p);
const caps=await p.$$eval('#rv-body .rcap',e=>e.map(x=>x.textContent));
ok(caps.join('/')==='乗務/走行距離計/タクシーメーターの集計/実車・空車/営収/納金/休憩（時刻・地点）/乗車','並び: '+caps.join('/'));
ok(/出庫時刻=07:00\|出庫地点=—\|帰庫時刻=17:30\|帰庫地点=—/.test(body),'出庫・帰庫の時刻と地点（地点はまだ空）');
ok(/出庫時=85,100 km\|帰庫時=85,310 km\|乗務距離=210 km/.test(body),'走行距離計: 出庫時・帰庫時・乗務距離');
ok(/営業回数=4 回\|実車キロ=98.6 km\|運収=11,400 円\|記録との照合=合っています/.test(body),'メーターの集計と照合');
ok(/実車距離=98.6 km\|空車距離=111.4 km\|実車率=47 %/.test(body),'実車・空車はメーターの実車キロから');
ok(/現金=1,500 円\|キャッシュレス=5,800 円カード 3,200・QR決済 2,600\|チケット=4,100 円/.test(body),'納金: 現金・キャッシュレス（内訳）・チケット');
await p.context().close();

console.log('4. 乗務情報で地点とメーターの集計を直す・休憩の地点');
p=await page(Object.assign({},D,{[K]:Object.assign({},D[K],{endTime:'17:30',odoEnd:85310,meter:{n:4,fare:11400,lk:98.6}})}));
await p.evaluate(()=>{document.getElementById('meta').open=true});await p.waitForTimeout(200);
ok(await p.evaluate(()=>document.getElementById('f-mn').value+'/'+document.getElementById('f-mlk').value+'/'+document.getElementById('f-mfare').value)==='4/98.6/11400','乗務情報にもメーターの集計');
await fill(p,'f-sp','本社営業所');await fill(p,'f-ep','本社営業所');await fill(p,'f-mlk','101.2');
await p.evaluate(()=>{const e=document.querySelector('#brk-list .bpl');e.focus();e.value='多摩川緑地';e.dispatchEvent(new Event('change',{bubbles:true}));e.blur()});await p.waitForTimeout(300);
d=await store(p);
ok(d.sp==='本社営業所'&&d.ep==='本社営業所'&&d.meter.lk===101.2&&d.breaks[0].pl==='多摩川緑地','保存: 出庫地点・帰庫地点・実車キロ・休憩の地点');
await C(p,'rv-open');await p.waitForTimeout(400);
const b2=await kv(p);
ok(/出庫地点=本社営業所/.test(b2)&&/帰庫地点=本社営業所/.test(b2),'日報に地点');
ok(/12:00 〜 12:50=50分多摩川緑地/.test(b2),'休憩の時刻と地点');
ok(/実車率=48 %/.test(b2),'直した実車キロで実車率 48%');
const csv2=await p.evaluate(()=>reportCsv('2026-11-21')).catch(()=>null);
if(csv2!=null){ok(/【タクシーメーターの集計】/.test(csv2)&&/営業回数,4 回/.test(csv2)&&/【納金】/.test(csv2)&&/休憩,開始,終了,分,地点/.test(csv2)&&/,12:00,12:50,50,多摩川緑地/.test(csv2),'CSVにも同じ並び')}
else ok(false,'reportCsv を呼べない');
await p.evaluate(()=>document.getElementById('meta').open=true);await p.waitForTimeout(200);
ok((await p.$$eval('#pl-list option',e=>e.map(x=>x.value))).join()==='本社営業所,多摩川緑地','前に入れた地点を候補に出す');
await C(p,'rv-close');
await C(p,'tab-month');await p.waitForTimeout(400);
const mrow=await p.$$eval('#mcard tbody tr',r=>r.map(x=>[...x.children].map(c=>c.textContent.trim())));
ok(mrow.length===1&&mrow[0][2]==='101.2'&&mrow[0][5]==='48%','月の表の距離・実車率もメーターの実車キロ: '+JSON.stringify(mrow[0]));
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('5. 位置情報で出庫・帰庫・休憩の地点を自動で入れる（GitHub版）');
p=await page({},{geo:{latitude:35.6518,longitude:139.5442},at:new Date(2026,10,21,7,0)});
await C(p,'sh-b');await p.waitForTimeout(300);await p.evaluate(()=>{const e=document.getElementById('sh-odo');e.value='85100';e.blur()});await p.waitForTimeout(1200);
d=await store(p);ok(d.sp==='調布市布田一丁目','出庫地点: '+d.sp);
await p.clock.runFor(3*3600*1000);await p.evaluate(()=>document.getElementById('d-brk').click());await p.waitForTimeout(1200);
d=await store(p);ok(d.breaks&&d.breaks[0]&&d.breaks[0].pl==='調布市布田一丁目','休憩の地点: '+(d.breaks&&d.breaks[0]&&d.breaks[0].pl));
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('6. 夜勤・空の集計・狭い画面');
const N={[K]:{type:'day',date:K,startTime:'18:00',endTime:'03:00',odoStart:85100,odoEnd:85290,breaks:[],trips:rides().slice(0,2)}};
p=await page(N,{vp:{width:320,height:568}});
await C(p,'rv-open');await p.waitForTimeout(400);
ok(/帰庫時刻=翌日 03:00/.test(await kv(p)),'夜勤の帰庫は「翌日 03:00」');
ok(/営業回数=—\|実車キロ=—\|運収=—\|記録との照合=—/.test(await kv(p)),'集計を写していなければ —');
ok(!(await txt(p,'#mt-res')),'照合の行は出ない');
const ov=await p.evaluate(()=>{const r=document.getElementById('rv-meter').getBoundingClientRect(),s=document.querySelector('#rv .sheet');return [...document.querySelectorAll('#rv-meter input')].every(i=>{const q=i.getBoundingClientRect();return q.right<=r.right+0.5&&q.width>=60})&&s.scrollWidth<=s.clientWidth});
ok(ov,'320px幅でも3つの欄が収まる');
await fill(p,'mt-lk','250');
ok(/実車キロ 250 kmが、走行距離 190 kmより長くなっています/.test(await txt(p,'#mt-res')),'実車キロが走行距離より長ければ知らせる');
ok(/実車率=—/.test(await kv(p)),'そのときは実車率を出さない');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
console.log('7. 納金に高速代を含める・含めない（設定）');
const TL={[K]:{type:'day',date:K,startTime:'07:00',odoStart:85100,breaks:[],trips:[
 {id:'a',t:'08:10',fare:5200,pay:'cash',toll:1320,from:'調布駅',to:'羽田空港',ts:1},{id:'b',t:'10:00',fare:6800,pay:'card',toll:930,from:'羽田空港',to:'府中駅',ts:2},{id:'c',t:'13:00',fare:2000,pay:'ticket',toll:500,ts:3},{id:'d',t:'15:00',fare:1500,pay:'cash',ts:4}]}};
p=await page(TL);
ok(await p.evaluate(()=>document.querySelector('#nkchips [data-nk="0"]').getAttribute('aria-pressed'))==='true','はじめは「含めない」');
await C(p,'sh-b');await p.waitForTimeout(300);await p.evaluate(()=>{const e=document.getElementById('sh-odo');e.value='85300';e.blur()});await p.waitForTimeout(800);
let nt=await txt(p,'#rv-note');
ok(/納金：現金 6,700円・キャッシュレス 6,800円・チケット 2,000円（高速代は含まない）/.test(nt),'含めない: '+nt.replace(/^.*納金/,'納金'));
let kv1=await kv(p);
ok(/現金=6,700 円\|キャッシュレス=6,800 円カード 6,800\|チケット=2,000 円\|高速代=含まない設定/.test(kv1),'日報の納金: 料金だけ・「高速代 含まない」の行');
ok(/高速代=2,750 円/.test(kv1),'営収の高速代は 2,750 円のまま');
await C(p,'rv-close');await C(p,'tab-set');await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('#nkchips [data-nk="1"]').click());await p.waitForTimeout(300);
ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('taxi-nippo-ui-v1')).nktoll)===true,'設定に残る');
await p.evaluate(k=>openReport(k,true),K);await p.waitForTimeout(400);
nt=await txt(p,'#rv-note');
ok(/納金：現金 8,020円・キャッシュレス 7,730円・チケット 2,500円（高速代 2,750円を含む）/.test(nt),'含める: 支払方法ごとに高速代を足す: '+nt.replace(/^.*納金/,'納金'));
kv1=await kv(p);
ok(/現金=8,020 円\|キャッシュレス=7,730 円カード 7,730\|チケット=2,500 円\|高速代=含む（2,750 円）/.test(kv1),'日報の納金にも');
ok(/営収（税込）=15,500 円/.test(kv1),'営収は料金だけ（15,500 円）のまま');
const cv=await p.evaluate(k=>reportCsv(k),K);
ok(/\n現金,"8,020 円"/.test(cv)&&/高速代,"含む（2,750 円）"/.test(cv),'CSVにも');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
p=await page(TL,{ui:{nktoll:true}});
ok(await p.evaluate(()=>document.querySelector('#nkchips [data-nk="1"]').getAttribute('aria-pressed'))==='true','開き直しても「含める」のまま（保存した設定を読む）');await p.context().close();
p=await page(D);await C(p,'rv-open');await p.waitForTimeout(300);
ok(!/高速代=含/.test(await kv(p))&&!/高速代/.test(await txt(p,'#rv-note')),'高速代のない日は納金に高速代の行・注記を出さない');
await p.context().close();
await b.close()})();
