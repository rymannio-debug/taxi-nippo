// 分析（時間の使い方・曜日×時間帯・場所・料金帯・条件別・良い日悪い日）
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const G={'調布市布田一丁目':[35.6518,139.5442],'府中市宮町一丁目':[35.6726,139.48],'府中市府中町二丁目':[35.6745,139.4775],'新宿区西新宿一丁目':[35.6909,139.6996],'渋谷区道玄坂二丁目':[35.658,139.6984]};
let id=0;const T=(tin,tout,fare,from,to,src,wx,seg)=>({id:'x'+(id++),t:tin,tin:tin,tout:tout,fare:fare,pay:'cash',from:from,to:to,src:src,seg:seg||'',wx:wx?{w:wx,t:null}:null,ts:id,g1:G[from]});
const D={
 '2026-10-30':{type:'day',date:'2026-10-30',startTime:'07:00',endTime:'16:00',breaks:[],trips:[T('09:00','09:30',3000,'調布市布田一丁目','府中市宮町一丁目','nagashi','晴れ')]},
 // 月: 07:00-17:00, 休憩 12:00-13:00 → 稼働 540分
 '2026-11-02':{type:'day',date:'2026-11-02',startTime:'07:00',endTime:'17:00',breaks:[{id:'k1',s:'12:00',e:'13:00',ts:1}],trips:[
   T('07:30','08:00',2000,'調布市布田一丁目','府中市宮町一丁目','nagashi','晴れ','biz'),T('08:20','09:00',3000,'府中市府中町二丁目','新宿区西新宿一丁目','wait','晴れ','biz'),T('13:30','14:00',12000,'新宿区西新宿一丁目','調布市布田一丁目','app','晴れ','tour')]},
 // 金: 18:00-02:00（夜勤）→ 稼働 480分
 '2026-11-06':{type:'day',date:'2026-11-06',startTime:'18:00',endTime:'02:00',breaks:[],trips:[
   T('19:00','19:30',1500,'調布市布田一丁目','府中市宮町一丁目','nagashi','雨','drink'),T('19:40','20:10',2500,'府中市宮町一丁目','調布市小島町二丁目','nagashi','雨','drink'),
   T('20:40','21:20',15000,'渋谷区道玄坂二丁目','府中市宮町一丁目','radio','雨','biz'),T('00:30','00:50',1000,'港区六本木六丁目','調布市布田一丁目','nagashi','雨','drink')]},
 // 火: 帰庫なし → 時間の計算からは外れる
 '2026-11-10':{type:'day',date:'2026-11-10',startTime:'07:00',endTime:'',breaks:[],trips:[T('10:00','10:20',800,'狛江市和泉本町一丁目','調布市布田一丁目','nagashi','曇り')]},
 // 金: 07:00-15:00 → 480分
 '2026-11-13':{type:'day',date:'2026-11-13',startTime:'07:00',endTime:'15:00',breaks:[],trips:[
   T('08:00','08:30',2200,'調布市布田一丁目','府中市宮町一丁目','nagashi','晴れ'),T('08:40','09:00',1800,'府中市宮町一丁目','三鷹市下連雀三丁目','nagashi','晴れ')]}};
async function page(o={}){const ctx=await b.newContext({viewport:o.vp||{width:390,height:844},colorScheme:o.dark?'dark':'light'});await fr(ctx);await ctx.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
 await p.clock.setFixedTime(new Date(2026,10,20,12,0));
 await p.addInitScript(([sd,o])=>{if(o.claude)window.claude={use:async()=>null};if(!localStorage.getItem('__s')){localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd));if(o.ui)localStorage.setItem('taxi-nippo-ui-v1',JSON.stringify(o.ui));localStorage.setItem('__s','1')}},[D,o]);
 await p.goto((process.env.APP_URL||'file://'+__dirname+'/../index.html'));await p.waitForTimeout(800);return p}
/* headless Chromium can drop localStorage on a reload of a file:// page; put back what the page had (app settings included) */
const reloadKeep=async q=>{const snap=await q.evaluate(()=>Object.assign({},localStorage));await q.addInitScript(sn=>{for(const k in sn)localStorage.setItem(k,sn[k])},snap);await q.reload()};
const C=(p,sel)=>p.evaluate(s=>document.querySelector(s).click(),sel);
const txt=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' '):''},sel);
const vis=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0},sel);
const rows=(p,sel)=>p.$$eval(sel+' tbody tr',r=>r.map(x=>[...x.children].map(c=>c.textContent.trim())));

console.log('1. 切り替え');
let p=await page();await C(p,'#tab-month');await p.waitForTimeout(300);
ok(await vis(p,'#m-view [data-av="sum"]')&&await vis(p,'#v-month .meter')&&!(await vis(p,'#m-ana')),'月集計はふだん「集計」で、合計の数字が出る');
await C(p,'#m-view [data-av="ana"]');await p.waitForTimeout(500);
ok(!(await vis(p,'#v-month .meter'))&&!(await vis(p,'#mcard'))&&await p.$$eval('#m-ana>.card',e=>e.length)===10&&await p.evaluate(()=>document.querySelector('#m-ana>.card').id)==='m-a8','「分析」で合計が隠れ、分析のカード10枚が出る（いちばん上は「この期間の要点」）');
ok(await p.evaluate(()=>document.querySelector('#m-view [data-av="ana"]').getAttribute('aria-pressed'))==='true','「分析」が押された状態');
await reloadKeep(p);await p.waitForTimeout(800);await C(p,'#tab-month');await p.waitForTimeout(400);
ok(await vis(p,'#m-ana .astat'),'開き直しても「分析」のまま');

console.log('2. 時間の使い方');
let t=await txt(p,'#m-a0');
ok(/稼働時間\s?25:00/.test(t)&&/1出番 平均 8:20/.test(t),'稼働時間 25:00（3日分）、1出番平均 8:20');
ok(/時間あたり営収\s?¥1,640/.test(t),'時間あたり営収 ¥1,640（41,000円÷25時間）');
ok(/実車時間率\s?18%/.test(t),'実車時間率 18%（270分÷1,500分）');
ok(/次のお客さんまで\s?52分/.test(t),'次のお客さんまで 52分（休憩をはさんだ分は除く）');
let R=await rows(p,'#m-a0 table');console.log('     '+R.map(r=>r.join(' ')).join(' | '));
ok(R.length===3&&R[0][0]==='2日(月)'&&R[0][1]==='9:00'&&R[0][3]==='1,889'&&R[1][1]==='8:00'&&R[1][3]==='2,500','日ごとの表（11/2 稼働9:00・時間あたり1,889、夜勤の11/6 8:00・2,500）');
ok(await p.evaluate(()=>document.querySelector('#m-a0 tbody tr:nth-child(2) td:nth-child(4)').classList.contains('best')),'時間あたりがいちばん高い日に緑の印');
ok(/時間を計算できない1日/.test(t),'帰庫のない日は外したと書いてある');

console.log('3. 曜日×時間帯');
const hv=await p.$$eval('#m-a1 tbody tr',r=>Object.fromEntries(r.map(x=>[x.children[0].textContent,[...x.children].slice(1).map(c=>c.textContent)])));
console.log('     '+Object.keys(hv).join(' '));
ok(hv['8時']&&hv['8時'][4]==='4.0'&&hv['8時'][0]==='3.0','8時台: 金曜 4.0千円、月曜 3.0千円');
ok(hv['20時'][4]==='15.0'&&await p.evaluate(()=>{const td=[...document.querySelectorAll('#m-a1 tbody tr')].find(r=>r.querySelector('th').textContent==='20時').children[5];return td.classList.contains('few')&&!td.classList.contains('top')}),'金曜20時台 15.0 は1日だけなので薄く、「いちばん」（枠）にはしない');
ok(hv['13時'][0]==='12.0'&&!hv['12時'][0]&&hv['12時'][4]==='0.0','月曜13時台 12.0、休憩の12時台は空き、金曜12時台は 0.0');
const keys=Object.keys(hv);ok(keys.indexOf('0時')>keys.indexOf('23時')&&hv['0時'][4]==='1.0','日付をまたいだ0時台は23時台のあと、出庫した金曜に入る');
ok(!keys.includes('10時')||hv['10時'][1]==='','帰庫のない火曜は入らない');

console.log('4. 場所');
R=await rows(p,'#m-a2 table.a4');console.log('     '+R.map(r=>r.join(' ')).join(' | '));
ok(R[0][0]==='府中市'&&R[0][1]==='3'&&R[1][0]==='調布市'&&R[1][1]==='3','市区町村ごと: 府中市3・調布市3（同じ回数なら営収の多い順）');
R=await rows(p,'#m-a2 table.a4w');console.log('     '+R.map(r=>r.join(' ')).join(' | '));
ok(R.length===1&&R[0].join('|')==='府中市|4|58分|府中市','降車地ごと: 府中市で降ろすと次まで平均58分、次は府中市が多い');
await C(p,'#m-a2 [data-apl="name"]');await p.waitForTimeout(400);
R=await rows(p,'#m-a2 table.a4w');ok(R[0].join('|')==='府中市宮町一丁目|4|58分|府中市宮町一丁目','地名ごとにも切り替わる');
ok(!(await vis(p,'#m-a2 table'))&&/乗車がいちばん多い場所 調布市布田一丁目（3回）/.test(await txt(p,'#m-a2'))&&/降ろしてから次がいちばん早い場所 府中市宮町一丁目（平均58分）/.test(await txt(p,'#m-a2')),'はじめは要点だけ（表はたたまれている。地名ごとの要点）');
ok(!(await p.$('#m-amap.leaflet-container')),'たたんでいる間は地図を作らない');
await C(p,'#m-a2 [data-aopen="2"]');await p.waitForTimeout(800);
ok(await vis(p,'#m-a2 table')&&await p.evaluate(()=>document.querySelector('#m-a2 [data-aopen]').getAttribute('aria-expanded'))==='true','「表と説明を見る」で開く');
ok(await vis(p,'#m-amap')&&/乗車した地点（8件）/.test(await txt(p,'#m-a2')),'単体版は乗車地点の地図が出る（位置のある8件）');
ok(await p.evaluate(()=>!!document.querySelector('#m-amap.leaflet-container')&&!!document.querySelector('#m-amap canvas')),'地図に点が描かれる');
await C(p,'#m-a2 [data-apl="muni"]');await p.waitForTimeout(300);

console.log('5. 料金帯');
R=await rows(p,'#m-a3 table.a5b');console.log('     '+R.map(r=>r.join(' ')).join(' | '));
ok(R.map(r=>r[1]).join()==='2,3,3,0,2'&&R[4][3]==='27,000'&&R[4][4]==='65%','回数 2・3・3・0・2、1万円以上は 27,000円で営収の65%');
t=await txt(p,'#m-a3');ok(/ロング（1万円以上）2回/.test(t),'ロング2回');
const L=await p.$$eval('#m-a3 .alist li',e=>e.map(x=>x.textContent.replace(/\s+/g,' ')));ok(L.length===2&&/11\/6\(金\) 20:40/.test(L[0])&&/15,000/.test(L[0])&&/11\/2\(月\) 13:30/.test(L[1]),'新しい順に並ぶ');
ok(/無線/.test(t)&&/アプリ配車/.test(t)&&/20時台/.test(t),'ロングの時間帯・きっかけが出る');

console.log('6. 条件別の効率');
R=await rows(p,'#m-a4 table');console.log('     '+R.map(r=>r.join(' ')).join(' | '));
ok(R[0].join('|')==='流し|7|1,686|87分|1,269','流し: 7回・単価1,686・1回87分・時間あたり1,269');
ok(R.map(r=>r[0]).join()==='流し,付け待ち,無線,アプリ配車'&&R[2][4]==='12,857','無線は 1回70分で時間あたり12,857');
ok(await p.evaluate(()=>{const c=document.querySelector('#m-a4 tbody tr:nth-child(3) td:nth-child(5)').classList;return c.contains('few')&&!c.contains('best')}),'無線は1回だけなので薄く、「いちばん」にはしない');
await C(p,'#m-a4 [data-acd="wx"]');await p.waitForTimeout(300);
R=await rows(p,'#m-a4 table');ok(R.map(r=>r[0]).join()==='晴れ,曇り,雨'&&R[1][3]==='—','天気でも比べられる（帰庫のない日の曇りは時間が—）');
await C(p,'#m-a4 [data-acd="seg"]');await p.waitForTimeout(300);
R=await rows(p,'#m-a4 table');ok(R.map(r=>r[0]).join()==='ビジネス,観光,飲み帰り','客層でも比べられる');

console.log('7. 良い日・悪い日');
const tbs=await p.$$eval('#m-a5 table',ts=>ts.map(t=>[...t.querySelectorAll('tbody tr')].map(x=>[...x.children].map(c=>c.textContent.trim()))));
console.log('     '+tbs.map(t=>t.map(r=>r.join(' ')).join(' / ')).join(' || '));
ok(tbs[0].map(r=>r[0]).join()==='11/6(金),11/2(月)'&&tbs[1].map(r=>r[0]).join()==='11/10(火),11/13(金)','4日なので上下2日ずつ（悪い日は少ない順）');
const cm=Object.fromEntries(tbs[2].map(r=>[r[0],[r[1],r[2]]]));
ok(cm['営収の平均'].join()==='¥18,500,¥2,400'&&cm['出庫の平均'].join()==='12:30,7:00'&&cm['稼働の平均'].join()==='8:30,8:00','営収・出庫・稼働の平均');
ok(cm['時間あたり'].join()==='¥2,176,¥500'&&cm['回数の平均'].join()==='3.5回,1.5回'&&cm['単価'].join()==='¥5,286,¥1,600','時間あたり・回数・単価');
ok(cm['多い曜日'].join()==='ばらばら,ばらばら','曜日が重ならなければ「ばらばら」');
await C(p,'#m-a5 [data-go="2026-11-06"]');await p.waitForTimeout(400);
ok(await p.evaluate(()=>location.hash)==='#day'&&/11月6日/.test(await txt(p,'#dlabel')),'日付を押すとその日の日報が開く');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('8. 年集計');
p=await page({ui:{yview:'ana'}});await C(p,'#tab-year');await p.waitForTimeout(500);
ok(await vis(p,'#y-ana .astat')&&!(await vis(p,'#v-year .meter')),'年集計も「分析」を覚えている');
R=await rows(p,'#y-a0 table');ok(R.map(r=>r[0]).join()==='10月,11月'&&R[0][1]==='9:00','年集計は月ごとの行');
ok(/2026年/.test(await txt(p,'#ylabel'))&&await vis(p,'#yq'),'期間の選び方（年・四半期）はそのまま使える');
await C(p,'#yq [data-q="4"]');await p.waitForTimeout(400);ok((await rows(p,'#y-a0 table')).length===2,'10〜12月に切り替えても分析が出る');
await C(p,'#y-view [data-av="sum"]');await p.waitForTimeout(300);ok(await vis(p,'#v-year .meter')&&!(await vis(p,'#y-ana')),'「集計」に戻せる');
await C(p,'#tab-month');await p.waitForTimeout(300);ok(await vis(p,'#v-month .meter'),'月集計は別に覚える（まだ集計）');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('9. 記録が少ないとき・Claude版');
p=await page({ui:{mview:'ana'}});await p.evaluate(()=>{});await C(p,'#tab-month');await C(p,'#mprev');await C(p,'#mprev');await p.waitForTimeout(300);
ok(/この月の記録はまだありません/.test(await txt(p,'#m-ana')),'記録のない月はそう書く');
await C(p,'#mnext');await p.waitForTimeout(300);t=await txt(p,'#m-ana');
ok(/出番が4日以上ある期間で出ます（この期間は1日）/.test(t)&&/この期間にロングはありません/.test(t),'1日だけの月: 良い日・悪い日は出ない、ロングなし');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
p=await page({ui:{mview:'ana'},claude:true});await C(p,'#tab-month');await p.waitForTimeout(500);
ok(await p.$$eval('#m-ana>.card',e=>e.length)===10&&!(await p.$('#m-amap')),'Claude版は地図なしで10枚');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('10. 画面の幅と夜');
for(const [w,dark] of [[320,false],[390,true]]){p=await page({vp:{width:w,height:700},ui:{mview:'ana',aopen:{0:true,1:true,2:true,3:true,4:true,5:true}},dark:dark});await C(p,'#tab-month');await p.waitForTimeout(500);
 const ov=await p.evaluate(()=>{const W=document.documentElement.clientWidth,out=[];document.querySelectorAll('#m-ana *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.right>W+1&&!e.closest('.hwrap,.leaflet-container'))out.push((e.id||e.className||e.tagName)+':'+Math.round(r.right))});return {sw:document.documentElement.scrollWidth,W:W,out:out.slice(0,5)}});
 ok(ov.sw<=ov.W&&!ov.out.length,w+'px: 横にはみ出さない '+JSON.stringify(ov.out));
 const clip=await p.evaluate(()=>[...document.querySelectorAll('#m-ana td,#m-ana th')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent.trim()).slice(0,6));
 ok(!clip.length,w+'px: 表の文字が切れない '+clip.join('/'));
 if(dark){const low=await p.evaluate(()=>{const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return null;const f=/^color\(srgb/.test(c)?1:255;const [r,g,b2]=m.slice(0,3).map(x=>{x/=f;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b2};
  const bgOf=e=>{while(e){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return c;e=e.parentElement}return 'rgb(31,28,21)'};
  const out=[];document.querySelectorAll('#m-ana td,#m-ana th,#m-ana span,#m-ana b,#m-ana i,#m-ana button').forEach(e=>{if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;const f=lum(getComputedStyle(e).color),g=lum(bgOf(e));if(f==null||g==null)return;const cr=(Math.max(f,g)+.05)/(Math.min(f,g)+.05);if(cr<3.5)out.push(e.textContent.trim().slice(0,8)+' '+cr.toFixed(1))});return out.slice(0,8)});
  ok(!low.length,'夜の画面で読みにくい文字なし '+low.join(' / '))}
 ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close()}
console.log('11. デバッグで直したところ');
{const D2={'2026-11-02':{type:'day',date:'2026-11-02',startTime:'07:00',endTime:'06:00',breaks:[],trips:[{id:'a',t:'08:00',tin:'08:00',tout:'08:20',fare:2000,pay:'cash',ts:1}]},
  '2026-11-03':{type:'day',date:'2026-11-03',startTime:'07:00',endTime:'17:00',breaks:[],trips:[{id:'b',t:'',tin:'',tout:'',fare:3000,pay:'cash',ts:1},{id:'c',t:'09:00',tin:'09:00',tout:'09:20',fare:null,pay:'cash',ts:2},{id:'d',t:'10:00',tin:'10:00',tout:'10:20',fare:1500,pay:'cash',ts:3,from:'東村山市本町二丁目'},{id:'e',t:'11:00',tin:'11:00',tout:'11:20',fare:1500,pay:'cash',ts:4,from:'武蔵村山市本町'}]}};
 const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());const q=await ctx.newPage();const E2=[];q.on('pageerror',e=>E2.push(e.message));
 await q.clock.setFixedTime(new Date(2026,10,20,12,0));
 await q.addInitScript(sd=>{localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd));localStorage.setItem('taxi-nippo-ui-v1',JSON.stringify({mview:'ana'}))},D2);
 await q.goto((process.env.APP_URL||'file://'+__dirname+'/../index.html'));await q.waitForTimeout(600);await q.evaluate(()=>document.getElementById('tab-month').click());await q.waitForTimeout(400);
 const mu=await q.evaluate(()=>['東村山市本町二丁目','武蔵村山市本町','田村市船引町','新宿区市谷本村町','横浜市中区本町','神奈川県川崎市中原区小杉町','市川市市川','四日市市諏訪町','西多摩郡瑞穂町箱根ケ崎','市ヶ谷駅'].map(muniOf).join());
 ok(mu==='東村山市,武蔵村山市,田村市,新宿区,横浜市中区,川崎市中原区,市川市,四日市市,西多摩郡瑞穂町,市ヶ谷駅','市区町村のまとめ方（東村山市が「東村」にならない） '+mu);
 const R2=await rows(q,'#m-a0 table');ok(R2.length===1&&R2[0][0]==='3日(火)'&&/22時間を超える日/.test(await txt(q,'#m-a0')),'帰庫を出庫より前に入れた日（23時間）は時間の計算から外す');
 ok(!(await q.$$eval('#m-a1 tbody th',e=>e.map(x=>x.textContent))).includes('0時'),'時刻のない乗車を0時台に入れない');
 const B=await rows(q,'#m-a3 table.a5b');ok(B[0][1]==='0'&&B[1][1]==='3'&&/料金の入っていない1件は入れていません/.test(await txt(q,'#m-a3')),'料金のない乗車は料金帯に入れない');
 ok((await rows(q,'#m-a2 table.a4')).map(r=>r[0]).join()==='東村山市,武蔵村山市','場所の表も東村山市・武蔵村山市');
 ok(!E2.length,'エラーなし '+E2.join('/'));await ctx.close()}
console.log('12. 要点とたたみ');
{const q=await page({ui:{mview:'ana'}});await C(q,'#tab-month');await q.waitForTimeout(500);
 const S=await q.evaluate(()=>['#m-a1','#m-a2','#m-a3','#m-a4','#m-a5'].map(id=>{const e=document.querySelector(id+' .asum');return e?e.textContent.replace(/\s+/g,' '):''}));console.log('     '+S.join(' / '));
 ok(/いちばんは決めていません/.test(S[0])&&/1万円以上（営収の65%）\s?ロング（1万円以上） 2回/.test(S[2]),'曜日×時間帯（1日だけでは決めない）・料金帯の要点');
 ok(/単価がいちばん高いきっかけ 流し/.test(S[3])&&/良い日の営収 平均 ¥18,500\s?悪い日の営収 平均 ¥2,400/.test(S[4]),'条件別（3回以上のものから）・良い日悪い日の要点');
 ok(await q.$$eval('#m-ana .abody[hidden]',e=>e.length)>=6&&await vis(q,'#m-a0 .astat'),'表は6枚ともたたまれ、時間の使い方の数字は見えている');
 const h0=await q.evaluate(()=>document.getElementById('m-ana').getBoundingClientRect().height);ok(h0<2400,'分析の長さ '+Math.round(h0)+'px（たたむ前は7,000px台）');
 await C(q,'#m-a4 [data-aopen="4"]');await q.waitForTimeout(300);await reloadKeep(q);await q.waitForTimeout(800);await C(q,'#tab-month');await q.waitForTimeout(400);
 ok(await vis(q,'#m-a4 table')&&!(await vis(q,'#m-a3 table')),'開いたカードは開き直しても開いたまま');
 await C(q,'#m-a4 [data-aopen="4"]');await q.waitForTimeout(300);ok(!(await vis(q,'#m-a4 table')),'「表をたたむ」で閉じる');
 ok(!q.E.length,'エラーなし '+q.E.join('/'));await q.context().close()}
await b.close()})();
