// 訪日客の分析の追加: 時間あたり（訪日客とそれ以外）、行き先の種類とロング、訪日客を多く乗せた場所、年集計の月ごとの推移
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const APP=(process.env.APP_URL||'file://'+__dirname+'/../index.html');
const tr=(k,i,h,fare,from,to,ib)=>({id:k+'_'+i,t:h+':00',tin:h+':00',tout:h+':30',fare,pay:'card',ts:i,from,to,seg:ib?'inbound':undefined,ib:ib||undefined});
const D={};
['2026-11-03','2026-11-10','2026-11-17'].forEach(k=>{D[k]={type:'day',date:k,startTime:'08:00',endTime:'16:00',breaks:[],trips:[
  tr(k,0,9,12000,'帝国ホテル','羽田空港',{lang:'zh'}),   // 8:00→9:30 = 90分で12,000 → 時間あたり 8,000
  tr(k,1,11,3000,'浅草寺','東京駅',{lang:'en'}),         // 9:30→11:30 = 120分で3,000
  tr(k,2,13,2000,'府中市宮町','調布市布田',null)]}});  // 11:30→13:30 = 120分で2,000 → それ以外 1,000
['2025-03-05','2025-04-05','2026-03-05','2026-04-05','2026-04-06'].forEach((k,j)=>{D[k]={type:'day',date:k,breaks:[],trips:[tr(k,0,10,2000,'浅草寺','東京駅',{lang:'en'})]}});
async function page(){const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await fr(ctx);
  await ctx.route(/nominatim|gsi|tile|open-meteo|cyberjapan/,r=>r.abort());
  const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
  await p.clock.install({time:new Date(2026,10,22,19,0)});
  await p.addInitScript(([sd])=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd));localStorage.setItem('taxi-nippo-ui-v1',JSON.stringify({mview:'ana',yview:'ana',aopen:{6:true}}))},[D]);
  await p.goto(APP);await p.waitForTimeout(800);return p}
const txt=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.innerText.replace(/\s+/g,''):''},s);

const open=async(p,id)=>{await p.evaluate(id=>{const b=document.querySelector(id+' .atog');if(b&&b.getAttribute('aria-expanded')!=='true')b.click()},id);await p.waitForTimeout(400)};
let p=await page();await p.evaluate(()=>{location.hash='#month';route()});await p.waitForTimeout(600);await open(p,'#m-a6');
console.log('1. 時間あたり（訪日客とそれ以外）・ロング');
const I=await txt(p,'#m-a6');
ok(/時間あたり¥4,286それ以外¥1,000/.test(I),'訪日客 ¥4,286（45,000円÷630分）、それ以外 ¥1,000: '+(I.match(/時間あたり.{0,20}/)||[''])[0]);
ok(/ロング（1万円以上）3回ロング全体の100%/.test(I),'ロング3回、すべて訪日客');
console.log('2. 行き先の種類・ロングの行き方');
ok(/行き先の種類/.test(I)&&/空港/.test(I),'行き先の種類の表（空港）');
ok(/ロングホテル→空港3回/.test(I),'ロングはホテル → 空港');
ok(/話していた言葉言葉回数割合単価時間あたり/.test(I),'言葉の表に時間あたり');
console.log('3. 訪日客を多く乗せた場所');
ok(/訪日客を多く乗せた場所/.test(I)&&/帝国ホテルホテル3/.test(I)&&/浅草寺観光地3/.test(I),'帝国ホテル・浅草寺が3回ずつ');
ok(/降ろして次まで/.test(I),'降ろして次までの時間');
ok(!p.E.length,'エラーなし '+p.E.join('/'));
console.log('4. 年集計: 月ごとの推移と前の年');
await p.evaluate(()=>{location.hash='#year';route()});await p.waitForTimeout(600);await open(p,'#y-a6');
const Y=await txt(p,'#y-a6');
ok(/月ごとの推移/.test(Y)&&await p.evaluate(()=>!!document.querySelector('#y-a6 svg path.ly0')&&!!document.querySelector('#y-a6 svg path.ly1')),'線グラフ（今回と前の年）');
ok(/26年4月2/.test(Y)&&/26年11月6/.test(Y),'4月2回・11月6回: '+(Y.match(/26年4月.{0,12}/)||[''])[0]);
ok(await p.evaluate(()=>{const t=document.querySelector('#y-a6 svg title');return t&&/回$/.test(t.textContent)}),'グラフの数字は「回」');
ok(!p.E.length,'エラーなし '+p.E.join('/'));
await p.setViewportSize({width:320,height:568});await p.waitForTimeout(300);
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'SEで横にはみ出さない');
await p.context().close();await b.close()})();
