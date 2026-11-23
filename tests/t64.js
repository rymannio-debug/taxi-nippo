// 分析の見直し: いちばん上の「この期間の要点」、前の同じ日数との比べ、件数が足りないものは「いちばん」にしない、記録のそろい具合、訪日客の季節の比べは今日までの分で
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const APP=(process.env.APP_URL||'file://'+__dirname+'/../index.html');
const day=(k,fares,src,o={})=>({type:'day',date:k,startTime:'08:00',endTime:'16:00',breaks:[],trips:fares.map((f,i)=>({id:k+'_'+i,t:(9+i*2)+':00',tin:(9+i*2)+':00',tout:(9+i*2)+':40',fare:f,pay:'cash',ts:i,from:'府中市宮町'+(i+1),to:'調布市布田',src:src,seg:o.seg,ib:o.ib}))});
const D={};
['2026-11-03','2026-11-10','2026-11-17'].forEach(k=>D[k]=day(k,[3000,3000,3000],'wait'));           // 今の期間: 時間あたり ¥1,125（9,000円÷8時間）
['2026-10-13','2026-10-20','2026-10-27'].forEach(k=>D[k]=day(k,[2000,2000,2000],'nagashi'));       // 前の22日間: ¥750
D['2026-11-18']={type:'day',date:'2026-11-18',breaks:[],trips:[{id:'x1',t:'10:00',fare:1500,pay:'cash',ts:1,seg:'inbound',ib:{lang:'en'}},{id:'x2',t:'11:00',fare:1500,pay:'cash',ts:2,seg:'inbound',ib:{lang:'en'}},{id:'x3',t:'12:00',fare:1500,pay:'cash',ts:3,seg:'inbound'}]}; // 出庫・帰庫なし、時刻・場所なし
D['2026-11-19']={type:'day',date:'2026-11-19',breaks:[],trips:[{id:'w1',t:'10:00',fare:1500,pay:'cash',ts:1},{id:'w2',t:'11:00',fare:1500,pay:'cash',ts:2},{id:'w3',t:'12:00',fare:1500,pay:'cash',ts:3}]};
D['2025-11-05']={type:'day',date:'2025-11-05',breaks:[],trips:[{id:'y1',t:'10:00',fare:1000,pay:'cash',ts:1,seg:'inbound'}]};
D['2025-11-28']={type:'day',date:'2025-11-28',breaks:[],trips:[{id:'y2',t:'10:00',fare:1000,pay:'cash',ts:1,seg:'inbound'}]};
async function page(){const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await fr(ctx);
  await ctx.route(/nominatim|gsi|tile|open-meteo|cyberjapan/,r=>r.abort());
  const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
  await p.clock.install({time:new Date(2026,10,22,19,0)});
  await p.addInitScript(([sd])=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd));localStorage.setItem('taxi-nippo-ui-v1',JSON.stringify({mview:'ana'}))},[D]);
  await p.goto(APP);await p.waitForTimeout(800);await p.evaluate(()=>{location.hash='#month';route()});await p.waitForTimeout(600);return p}
const txt=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.innerText.replace(/\s+/g,''):''},s);

console.log('1. いちばん上は「この期間の要点」');
let p=await page();
ok(await p.evaluate(()=>document.querySelector('#m-ana>.card').id)==='m-a8','要点のカードがいちばん上');
const K=await txt(p,'#m-a8');
ok(/時間あたり営収は¥1,125。前の22日間より\+50%/.test(K),'時間あたり営収と、前の同じ日数との比べ: '+K.slice(0,80));
ok(/乗車がいちばん多い場所は府中市（9回/.test(K),'いちばん多い場所（3回以上）');
ok(/ロング（1万円以上）は0回/.test(K)&&/訪日客は3回/.test(K),'ロングと訪日客');
ok(/記録の抜けがあります/.test(K),'出庫・帰庫や時刻の抜けを知らせる');
ok(/いちばん稼げた時間は火曜9時台/.test(K),'いちばん稼げた時間（火曜は3日あるので決められる）');

console.log('2. 押すと、そのカードの表が開く');
await p.locator('#m-a8 [data-akey="9"]').tap();await p.waitForTimeout(500);
ok(await p.evaluate(()=>!document.querySelector('#m-a9 .abody').hidden),'「記録の抜け」→ 記録のそろい具合の表が開く');
const Q=await txt(p,'#m-a9');ok(/出庫・帰庫の時刻60%/.test(Q)&&/乗車地60%/.test(Q),'そろい具合: '+Q.slice(0,120));

console.log('3. 時間の使い方に、前の期間との比べ');
const T=await txt(p,'#m-a0 .astat');ok(/前の期間より\+¥375/.test(T),'時間あたり ¥375 上がった（緑）: '+T.slice(0,160));
ok(await p.evaluate(()=>!!document.querySelector('#m-a0 .astat em.dlt.up')),'良くなったものは緑');

console.log('4. 曜日×時間帯: 2日以上・1時間以上のところだけ「いちばん」');
ok(/いちばん稼げたのは火曜/.test(await txt(p,'#m-a1 .asum')),'火曜は3日あるので決められる');

console.log('5. 訪日客の季節の比べは、今日（22日）までの分で');
await p.evaluate(()=>{ui.aopen[6]=true;renderMonth()});await p.waitForTimeout(400);
const I=await txt(p,'#m-a6');ok(/11月22日まで3回1回\+2/.test(I),'前の年は22日までの1回だけ（28日の1回は入れない）: '+(I.match(/前の年の同じ月と比べる.{0,60}/)||[''])[0]);
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
await b.close()})();
