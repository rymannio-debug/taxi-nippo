// ランダムデータのサンプル撮影で見つけた不具合: 年ごとの線が記録のない月で0に落ちる／途中から記録のある年の前年比／メーターの打ち間違い
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const pad=n=>String(n).padStart(2,'0');
async function page(data,o={}){const ctx=await b.newContext({viewport:{width:390,height:844}});await fr(ctx);await ctx.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
 await p.clock.install({time:o.at||new Date(2026,10,21,14,20)});
 await p.addInitScript(([sd,u])=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd));if(u)localStorage.setItem('taxi-nippo-ui-v1',JSON.stringify(u))},[data,o.ui||null]);
 await p.goto('file://'+__dirname+'/../index.html');await p.waitForTimeout(800);return p}
const C=(p,id)=>p.evaluate(i=>document.getElementById(i).click(),id);
const txt=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' '):''},sel);

console.log('1. 年ごとの線と、途中から記録のある年');
const D={};let id=0;
for(const [y,m0] of [[2025,5],[2026,1]])for(let m=m0;m<=12;m++)for(const d of [10,15,20]){if(y===2026&&(m>11||(m===11&&d>20)))continue;
 const k=y+'-'+pad(m)+'-'+pad(d);D[k]={type:'day',date:k,startTime:'07:00',endTime:'17:00',breaks:[],trips:[{id:'t'+(id++),t:'09:00',tin:'09:00',tout:'09:20',fare:20000+m*1000,pay:'cash',ts:1}]}}
let p=await page(D);await C(p,'tab-year');await p.waitForTimeout(400);
await p.evaluate(()=>document.querySelector('#y-cmp [data-cm="multi"]').click());await p.waitForTimeout(500);
const ticks=await p.$$eval('#y-trend svg text',e=>e.map(x=>x.textContent.trim()));
ok(ticks.length>0&&!ticks.includes('0'),'2025年の1〜4月（記録なし）を0として描かない（目盛り: '+ticks.filter(x=>/万|^0$/.test(x)).join(' ')+'）');
const rows=await p.$$eval('#y-cmp table.my tbody tr',r=>r.map(x=>[...x.children].map(c=>c.textContent.trim())));
ok(rows.length===2&&rows[0][0]==='2026年'&&rows[1][0]==='2025年＊','記録が5月からの2025年に＊: '+rows.map(r=>r[0]).join(' / '));
ok(/＊の年は、記録が期間の途中（5月10日）から/.test(await txt(p,'#y-cmp')),'＊の意味を書く');
await p.evaluate(()=>document.querySelector('#y-cmp [data-ny="3"]').click());await p.waitForTimeout(300);
ok((await p.$$eval('#y-cmp table.my tbody tr td:first-child',e=>e.map(x=>x.textContent))).join()==='2026年,2025年＊','3年分でも同じ');
await C(p,'tab-month');await p.waitForTimeout(300);await p.evaluate(()=>{const b=document.querySelector('#m-cmp [data-cm="multi"]');b&&b.click()});await p.waitForTimeout(300);
ok(!/＊/.test(await txt(p,'#m-cmp')),'11月の比べ（2025年11月は記録あり）には＊が付かない');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('2. メーターの打ち間違い');
const k='2026-11-21';
const D2={[k]:{type:'day',date:k,startTime:'07:00',odoStart:85100,breaks:[],trips:[{id:'a',t:'13:30',tin:'13:30',tout:'13:50',fare:2000,pay:'cash',ts:1,o1:85140.1,o2:85149.3,km:9.2}]}};
const keys=async(p,s)=>{for(const c of s){await p.evaluate(c=>document.querySelector('#np [data-k="'+c+'"]').click(),c);await p.waitForTimeout(40)}};
const hint=p=>p.evaluate(()=>{const e=document.getElementById('r-o1-h');return {t:e.textContent,bad:e.classList.contains('bad'),np:document.getElementById('np-hint').textContent,open:!document.getElementById('np').hidden}});
p=await page(D2);await C(p,'ride-b');await p.waitForTimeout(500);await keys(p,'152');await p.waitForTimeout(300);
let h=await hint(p);ok(!h.bad&&!h.open&&/前回から \+2\.7 km$/.test(h.t),'「152」→ 85,152 km（+2.7 km）は注意なしで、3桁で自動で閉じる: '+h.t);
await p.context().close();
p=await page(D2);await C(p,'ride-b');await p.waitForTimeout(500);await keys(p,'512');await p.waitForTimeout(300);
h=await hint(p);ok(h.bad&&/前回から \+362\.7 km。離れすぎていませんか/.test(h.t),'「512」→ 85,512 km は +362.7 km。赤字で知らせる: '+h.t);
ok(h.open&&/離れすぎていませんか/.test(h.np),'数字キーは閉じずに待ち、その上にも出る');
await keys(p,'');await p.evaluate(()=>document.querySelector('#np [data-k="ok"]').click());await p.waitForTimeout(300);
await p.clock.runFor(20*60*1000);await C(p,'ride-b');await p.waitForTimeout(500);await keys(p,'518');await p.waitForTimeout(500);await keys(p,'2860');await p.waitForTimeout(200);
await p.evaluate(()=>document.getElementById('np-p1').click());await p.waitForTimeout(600);
const vs=await p.evaluate(()=>document.getElementById('vs').hidden?'':document.getElementById('vs').innerText.replace(/\s+/g,' '));
ok(/前回から \+362\.7 km（離れすぎ）/.test(vs),'記録前の確認で止まり「前回から +362.7 km（離れすぎ）」と出る');
ok(await p.evaluate(k=>JSON.parse(JSON.stringify(days))[k].trips.length,k)===1,'確かめるまでは記録しない');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
p=await page(D2);await C(p,'ride-b');await p.waitForTimeout(500);await keys(p,'152');await p.waitForTimeout(300);
await p.clock.runFor(20*60*1000);await C(p,'ride-b');await p.waitForTimeout(500);await keys(p,'360');await p.waitForTimeout(300);
h=await hint(p);ok(h.bad&&h.open&&/移動距離 208 km。長すぎませんか/.test(h.t),'降車メーターで移動距離が150kmを超えると注意し、料金へ進まない: '+h.t);
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
await b.close()})();
