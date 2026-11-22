// 使用感の見直し: メーターの入れ方・小さい画面の下のボタン・帰庫の位置・長い時間の表示・位置情報の案内・小さい文字
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const k='2026-11-21';
const base=()=>({[k]:{type:'day',date:k,startTime:'07:02',odoStart:45202,breaks:[],trips:[{id:'a',t:'08:12',tin:'08:12',tout:'08:31',fare:2400,pay:'cash',ts:1,from:'調布駅',to:'府中市宮町',o1:45210,o2:45218}]}});
async function page(o={}){const ctx=await b.newContext({viewport:o.vp||{width:390,height:844}});await fr(ctx);await ctx.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
 await p.clock.setFixedTime(o.at||new Date(2026,10,21,9,0));
 await p.addInitScript(([sd,u])=>{if(!sessionStorage.getItem('s')){localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd));if(u)localStorage.setItem('taxi-nippo-ui-v1',JSON.stringify(u));sessionStorage.setItem('s','1')}},[o.data||base(),o.ui||null]);
 await p.goto('file://'+__dirname+'/../index.html');await p.waitForTimeout(800);return p}
const C=(p,id)=>p.evaluate(i=>document.getElementById(i).click(),id);
const vis=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0},sel);
const txt=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' '):''},sel);

console.log('1. メーターを入れるとき');
let p=await page();
ok(await vis(p,'#r-o1'),'ふだん（乗車・降車のたび）は空車の画面にメーター欄');
await C(p,'ride-b');await p.waitForTimeout(500);
ok(await p.evaluate(()=>document.activeElement.id)==='r-o1'&&await vis(p,'#np')&&await vis(p,'#np-skip'),'乗車すると数字キーが開き、「毎回は入れない」がある');
await p.click('#np-skip');await p.waitForTimeout(400);
ok(!(await vis(p,'#np'))&&!(await vis(p,'#r-o1'))&&!(await vis(p,'#r-o2')),'押すと数字キーが閉じ、メーター欄が消える');
ok(/出庫・帰庫のときだけ/.test(await txt(p,'#toast-t')),'「設定で戻せます」と知らせる');
ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('taxi-nippo-ui-v1')).odo)==='end','設定に残る');
await p.clock.setFixedTime(new Date(2026,10,21,9,5));await C(p,'ride-b');await p.waitForTimeout(500);
{const st=await p.evaluate(()=>[document.getElementById('ride').dataset.st,document.activeElement.id,document.getElementById('p-t2').value]);ok(st[0]==='done'&&st[1]!=='r-o2'&&!(await vis(p,'#r-o2')),'降車でもメーターを聞かない（そのまま料金へ） '+st.join('/'))}
await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await p.waitForTimeout(300);
await C(p,'ride-x');await p.waitForTimeout(300);await p.clock.setFixedTime(new Date(2026,10,21,9,10));await C(p,'ride-b');await p.waitForTimeout(500);
ok(await p.evaluate(()=>document.activeElement.id)!=='r-o1'&&!(await vis(p,'#np')),'次の乗車でも数字キーは開かない');
await C(p,'ride-x');await p.waitForTimeout(300);
await C(p,'tab-set');await p.waitForTimeout(300);
ok(await p.evaluate(()=>document.querySelector('#odochips [data-odo="end"]').getAttribute('aria-pressed'))==='true','設定では「出庫・帰庫のときだけ」が選ばれている');
await p.evaluate(()=>document.querySelector('#odochips [data-odo="ride"]').click());await p.waitForTimeout(200);
await C(p,'tab-day');await p.waitForTimeout(300);ok(await vis(p,'#r-o1'),'「乗車・降車のたび」に戻すと欄が戻る');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('2. 下のボタン');
p=await page();
let g=await p.evaluate(()=>{const r=id=>{const e=document.getElementById(id);if(!e)return null;const x=e.getBoundingClientRect();return {l:Math.round(x.left),r:Math.round(x.right),t:Math.round(x.top),b:Math.round(x.bottom)}};return {items:[...document.getElementById('dockrow').children].map(x=>x.textContent.trim()),big:r('ride-b'),brk:r('d-brk'),v:r('vbtn'),H:innerHeight}});
ok(g.items.join()==='休憩,話す'&&g.big.b<g.brk.t,'ふつうの画面: 大きい「乗車」の下に 休憩・話す（帰庫は置かない）');
await p.context().close();
p=await page({vp:{width:375,height:667}});
g=await p.evaluate(()=>{const r=id=>{const x=document.getElementById(id).getBoundingClientRect();return {l:Math.round(x.left),r:Math.round(x.right),t:Math.round(x.top),b:Math.round(x.bottom),h:Math.round(x.height)}};return {big:r('ride-b'),brk:r('d-brk'),v:r('vbtn'),H:innerHeight,pad:parseFloat(getComputedStyle(document.querySelector('.app')).paddingBottom)}});
console.log('     '+JSON.stringify(g));
ok(Math.abs(g.big.b-g.brk.b)<=2&&g.brk.r<=g.big.l&&g.big.r<=g.v.l,'小さい画面（667）: 休憩｜乗車｜話す の1列');
ok(g.H-g.big.t<=100,'下のボタンの高さは '+(g.H-g.big.t)+'px（画面の15%ほど）');
ok(g.big.h>=60&&g.brk.h>=60&&g.v.h>=60,'どのボタンも高さ60px以上で押しやすい');
await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(100);
ok(await p.evaluate(()=>{const f=document.getElementById('r-o1').getBoundingClientRect(),d=document.getElementById('ride-b').getBoundingClientRect();return f.bottom<=d.top}),'空車のメーター欄が「乗車」の裏に隠れない');
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'横にはみ出さない');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('3. 長い時間と帰庫の忘れ');
p=await page({at:new Date(2026,10,21,13,0)});
let rd=await txt(p,'#ride-d'),tl=await txt(p,'#tl-now');
ok(/空車 4時間29分/.test(rd)&&/帰庫を忘れていませんか/.test(rd),'空車が3時間を超えると「帰庫を忘れていませんか？」: '+rd);
ok(/空車 4時間29分（08:31から）/.test(tl)&&/帰庫は上の「乗務中」の「帰庫」から/.test(tl),'今日の流れにも出る');
await p.context().close();
p=await page({at:new Date(2026,10,21,9,30)});
rd=await txt(p,'#ride-d');ok(/乗せたら「乗車」を押します/.test(rd)&&/空車 59分/.test(await txt(p,'#tl-now')),'1時間までは「59分」のまま、注意も出ない');
await p.evaluate(()=>{document.getElementById('p-t1').value='08:20';saveTm()});await p.waitForTimeout(200);
ok(/08:20から 1時間10分/.test(await txt(p,'#ride-d')),'乗車中も「1時間10分」');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('4. 位置情報の案内と小さい文字');
p=await page();await C(p,'ride-b');await p.waitForTimeout(1500);await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await p.waitForTimeout(300);
const gm=await p.evaluate(()=>{const m=document.getElementById('geo-msg');return m.hidden?'':m.innerHTML});
ok(gm===''||(/位置情報がオフのため、乗車地が入りません。/.test(gm)&&/<details class="gm"><summary>直し方<\/summary>/.test(gm)),'位置情報がオフの案内は1行。直し方は押すと開く');
const small=await p.evaluate(()=>{const o=[];['r-o1-h','sh-d'].forEach(id=>{const e=document.getElementById(id);if(e&&e.offsetParent&&parseFloat(getComputedStyle(e).fontSize)<14)o.push(id)});document.querySelectorAll('#v-day .tl-sub,.ro>span:first-child').forEach(e=>{if(e.offsetParent&&parseFloat(getComputedStyle(e).fontSize)<14)o.push(e.className||'ro')});return o});
ok(!small.length,'メーターの説明・今日の流れの説明は14px以上 '+small.join('/'));
ok(/前回 45,218 km（下3桁でよい）|乗車時/.test(await txt(p,'#r-o1-h')),'メーターの説明は短く: '+await txt(p,'#r-o1-h'));
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('5. 320px の画面');
p=await page({vp:{width:320,height:568},at:new Date(2026,10,21,13,0)});
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'日報が横にはみ出さない');
const wrap=await p.evaluate(()=>[...document.querySelectorAll('#dockrow button,#ride-b')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent.trim()));
ok(!wrap.length,'下のボタンの文字が切れない '+wrap.join('/'));
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
console.log('6. デバッグで直したところ');
{const Y='2026-11-20';p=await page({at:new Date(2026,10,21,1,10),data:{[Y]:{type:'day',date:Y,startTime:'18:00',startTs:new Date(2026,10,20,18,0).getTime(),breaks:[],trips:[{id:'a',t:'21:00',tin:'21:00',tout:'21:20',fare:2000,pay:'cash',ts:new Date(2026,10,20,21,20).getTime()}]}}});
 ok(/空車 3時間50分（21:20から）/.test(await txt(p,'#tl-now'))&&/帰庫を忘れていませんか/.test(await txt(p,'#ride-d')),'夜勤で日付をまたいでも、空車の時間と「帰庫を忘れていませんか？」が出る');
 ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close()}
{p=await page({ui:{odo:'end'},data:{[k]:{type:'day',date:k,startTime:'07:00',odoStart:45000,breaks:[],trips:[]}}});
 await C(p,'ride-b');await p.waitForTimeout(300);await p.clock.setFixedTime(new Date(2026,10,21,9,20));await C(p,'ride-b');await p.waitForTimeout(300);
 await p.clock.setFixedTime(new Date(2026,10,21,9,21));for(const x of ['2','5','0','0'])await p.evaluate(x=>document.querySelector('#np [data-k="'+x+'"]').click(),x);
 await p.evaluate(()=>document.getElementById('np-p1').click());await p.waitForTimeout(500);
 const d=await p.evaluate(k=>JSON.parse(JSON.stringify(days))[k],k);
 ok(d.trips.length===1&&d.trips[0].fare===2500&&!(await p.evaluate(()=>!document.getElementById('vs').hidden)),'「出庫・帰庫のときだけ」なら、メーターなしでも確認なしで記録できる');
 const dc=await p.evaluate(k=>dayCheck(k).map(x=>x.msg).join('/'),k);
 ok(!/乗車メーター|降車メーター/.test(dc),'1日の点検で、乗車ごとのメーターを求めない（'+dc+'）');
 ok(/帰庫のときにタクシーメーターの集計/.test(await txt(p,'#odoset')),'設定の説明: 帰庫のときにメーターの集計を写す');
 ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close()}
console.log('7. 小さい画面の大きいボタン（2回目のデバッグ）');
{p=await page({vp:{width:320,height:568}});
 const chk=async lab=>{const r=await p.evaluate(()=>{const b=document.getElementById('ride-b'),cs=getComputedStyle(b,'::before');return {cut:b.scrollWidth>b.clientWidth+1,txt:b.textContent.trim(),pre:cs.content}});
  ok(!r.cut&&!/いま /.test(r.pre),lab+': 「'+r.txt+'」が切れず、上の小さい字は '+r.pre)};
 await chk('空車');
 await C(p,'ride-b');await p.waitForTimeout(400);await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await p.clock.setFixedTime(new Date(2026,10,21,10,12));await p.evaluate(()=>renderRide());await p.waitForTimeout(200);
 await chk('乗車中');ok(await p.evaluate(()=>getComputedStyle(document.getElementById('ride-b'),'::before').content)==='"乗車中 1時間12分"','乗車中は経過時間まで見える');
 await C(p,'ride-b');await p.waitForTimeout(400);await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await p.waitForTimeout(200);await chk('降車済み');
 await C(p,'ride-x');await p.waitForTimeout(300);await p.clock.setFixedTime(new Date(2026,10,21,10,20));await C(p,'d-brk');await p.waitForTimeout(300);await chk('休憩中');
 ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close()}
{p=await page();await C(p,'ride-b');await p.waitForTimeout(1500);
 const gm=await p.evaluate(()=>{const m=document.getElementById('geo-msg');if(m.hidden||!m.querySelector('summary'))return 'none';m.querySelector('summary').click();return m.querySelector('details').open});
 ok(gm==='none'||gm===true,'位置情報の「直し方」を押すと開く');await p.context().close()}
await b.close()})();
