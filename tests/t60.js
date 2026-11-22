// 出庫メーターは毎回全部の桁。前の日（違う車かもしれない）の数字からは補わない。その日の帰庫・乗車は出庫メーターから下3桁で補う
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const APP=(process.env.APP_URL||'file://'+__dirname+'/../index.html');
const K='2026-11-22',Y='2026-11-21';
const prev={[Y]:{type:'day',date:Y,startTime:'07:00',endTime:'17:00',odoStart:45230,odoEnd:45520,car:'品川500あ1234',breaks:[],trips:[{id:'a',t:'08:10',fare:1500,pay:'cash',ts:1}]}};
async function page(data,o={}){const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await fr(ctx);
  await ctx.route(/nominatim|gsi|tile|open-meteo|cyberjapan/,r=>r.abort());
  const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
  await p.clock.install({time:new Date(2026,10,22,7,0)});
  await p.addInitScript(([sd,set])=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();if(sd)localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd));if(set)localStorage.setItem('taxi-nippo-set-v1',JSON.stringify(set))},[data,o.set||null]);
  await p.goto(APP);await p.waitForTimeout(900);return p}
const keys=async(p,str)=>{for(const ch of str){await p.locator('#np [data-k="'+ch+'"]:visible').first().tap();await p.waitForTimeout(470)}};
const okKey=async p=>{await p.locator('#np [data-k="ok"]:visible').first().tap();await p.waitForTimeout(400)};
const day=(p,k)=>p.evaluate(k=>days[k],k);

console.log('1. 前の日の記録があっても、出庫は全部の桁');
let p=await page(prev);
await p.locator('#sh-b').tap();await p.waitForTimeout(600);
ok(await p.locator('#np').isVisible(),'出庫を押すと数字キーが開く');
ok(/全部の桁/.test(await p.textContent('#sh-oh'))&&/全部の桁/.test(await p.textContent('#np')),'「全部の桁を入れます」と出る（数字キーの上も「全部の桁」）');
await keys(p,'610');await okKey(p);
let d=await day(p,K);
ok(d.odoStart==null&&await p.locator('#np').isVisible()&&/全部の桁を入れてください/.test(await p.textContent('#sh-oh')),'「610」（下3桁）では決まらず、入れ直しを求める（前の日の 45,520 から 45,610 にしない）');
await p.locator('#np [data-k="clear"]:visible').first().tap();await p.waitForTimeout(470);
await keys(p,'81610');await okKey(p);
d=await day(p,K);ok(d.odoStart===81610,'全部の桁「81610」で決まる（違う車）: '+d.odoStart);
ok(!p.E.length,'エラーなし '+p.E.join('/'));

console.log('2. その日の帰庫は、出庫メーターから下3桁で補う');
await p.evaluate(()=>{const d=days[cur];d.trips=[{id:'b',t:'08:10',fare:1500,pay:'cash',ts:1}];persist(cur);render()});await p.waitForTimeout(300);
await p.locator('#sh-b').tap();await p.waitForTimeout(600);
ok(/出庫 81,610 km/.test(await p.textContent('#sh-oh')),'帰庫の案内は「出庫 81,610 km。下3桁だけ…」');
await keys(p,'790');await okKey(p);
d=await day(p,K);ok(d.odoEnd===81790,'「790」で 81,790 km: '+d.odoEnd);
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('3. 声で「出庫 610」は聞き直す');
p=await page(prev);
const r=await p.evaluate(()=>{try{vcHandle('出庫 610')}catch(e){return 'err '+e.message}return VC.step||'no-step'});
await p.waitForTimeout(600);
d=await day(p,K);
ok(d&&d.startTime&&d.odoStart==null&&r==='shodo','「出庫 610」では出庫メーターを決めず、全部の数字で聞き直す（'+r+'）');
await p.evaluate(()=>vcHandle('81610'));await p.waitForTimeout(400);d=await day(p,K);ok(d.odoStart===81610,'「81610」と答えると決まる');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('4. 初めての日は今までどおり全部の桁');
p=await page(null);await p.locator('#sh-b').tap();await p.waitForTimeout(600);
await keys(p,'45230');await okKey(p);d=await day(p,K);ok(d.odoStart===45230,'45,230 km');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
await b.close()})();
