// 前年・複数年の比べ（月集計・年集計）
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const pad=n=>String(n).padStart(2,'0');
// 2023〜2026年: 毎月5日・10日・20日に出番。年ごとに料金を少しずつ上げる。2024年は記録なし（抜けた年）
const D={};
for(const y of [2022,2023,2025,2026])for(let m=1;m<=12;m++){if(y===2026&&m>11)continue;for(const d of [5,10,20]){if(y===2026&&m===11&&d>20)continue;const k=y+'-'+pad(m)+'-'+pad(d);const base=1000+(y-2022)*100;D[k]={type:'day',date:k,startTime:'07:00',trips:[0,1,2].map(i=>({id:k+i,t:'0'+(8+i)+':00',tin:'0'+(8+i)+':00',tout:'0'+(8+i)+':20',fare:base+i*500,pay:'cash',from:'a',to:'b',ts:1,km:5})),breaks:[]}}}
async function page(o={}){const ctx=await b.newContext({viewport:o.vp||{width:390,height:844}});await fr(ctx);await ctx.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
 await p.clock.setFixedTime(new Date(2026,10,20,12,0));
 await p.addInitScript(sd=>{if(!localStorage.getItem('__s')){localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd));localStorage.setItem('__s','1')}},D);
 await p.goto((process.env.APP_URL||'file://'+__dirname+'/../index.html'));await p.waitForTimeout(800);return p}
const C=(p,sel)=>p.evaluate(s=>document.querySelector(s).click(),sel);
const txt=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' '):''},sel);
const rows=(p,sel)=>p.$$eval(sel+' table.my tbody tr',r=>r.map(x=>[...x.children].map(c=>c.textContent.trim())));

console.log('月集計');
let p=await page();await C(p,'#tab-month');await p.waitForTimeout(400);
ok(/前月との比較/.test(await txt(p,'#m-cmp'))&&await p.evaluate(()=>document.querySelector('#m-cmp [data-cm="prev"]').getAttribute('aria-pressed'))==='true','ふだんは前月と比べる');
await C(p,'#m-cmp [data-cm="yoy"]');await p.waitForTimeout(300);
let t=await txt(p,'#m-cmp');ok(/前年同月比/.test(t)&&/2026年/.test(t)&&/2025年/.test(t),'前年の同じ月と比べられる');
ok(/20日までの分/.test(t),'今月は途中なので前年も20日までで比べる');
// 2026/11: 3 出番 × (1400+1900+2400)=5700 → 17100 ; 2025/11: 3×(1300+1800+2300)=5400 → 16200
ok(/17,100/.test(t)&&/16,200/.test(t)&&/\+6%/.test(t),'金額と増減が正しい（17,100 と 16,200、+6%）');
await C(p,'#m-cmp [data-cm="multi"]');await p.waitForTimeout(300);
let R=await rows(p,'#m-cmp');console.log('     '+R.map(r=>r.join(' ')).join(' / '));
ok(R.length===4&&R[0][0]==='2026年'&&R[1][0]==='2025年'&&R[2][0]==='2023年'&&R[3][0]==='2022年','複数年（5年分）：記録のある年だけ新しい順（2024年は抜ける）');
ok(R[0][2]==='+6%'&&R[1][2]==='—','前年比は1年前と比べ、1年前に記録がなければ —');
ok(await p.evaluate(()=>!!document.querySelector('#m-cmp svg')),'年ごとの営収の棒グラフ');
await C(p,'#m-cmp [data-ny="3"]');await p.waitForTimeout(300);R=await rows(p,'#m-cmp');ok(R.length===2&&R[1][0]==='2025年','3年分にすると、3年前まで（'+R.map(r=>r[0]).join(',')+'）');
await C(p,'#m-cmp [data-ny="10"]');await p.waitForTimeout(300);R=await rows(p,'#m-cmp');ok(R.length===4,'10年分');
/* headless Chromium can drop localStorage on a reload of a file:// page; put back what the page had */
{const snap=await p.evaluate(()=>Object.assign({},localStorage));await p.addInitScript(sn=>{for(const k in sn)localStorage.setItem(k,sn[k])},snap)}
await p.reload();await p.waitForTimeout(800);await C(p,'#tab-month');await p.waitForTimeout(400);
ok(await p.evaluate(()=>document.querySelector('#m-cmp [data-cm="multi"]').getAttribute('aria-pressed')==='true'&&document.querySelector('#m-cmp [data-ny="10"]').getAttribute('aria-pressed')==='true'),'選んだ比べ方と年数を覚えている');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('年集計');
p=await page();await C(p,'#tab-year');await p.waitForTimeout(400);
ok(/前の期間との比較/.test(await txt(p,'#y-cmp'))&&await p.evaluate(()=>!!document.querySelector('#y-trend svg rect.bb')),'ふだんは前年と比べる（棒グラフも前年つき）');
await C(p,'#y-cmp [data-cm="multi"]');await p.waitForTimeout(300);
R=await rows(p,'#y-cmp');console.log('     '+R.map(r=>r.join(' ')).join(' / '));
ok(R.length===4&&R[0][0]==='2026年'&&R[2][0]==='2023年'&&R[3][0]==='2022年','複数年：年ごとの表');
ok(/11月20日）までの分/.test(await txt(p,'#y-cmp')),'今年は途中なので、どの年も11月20日までで比べる');
const lines=await p.$$eval('#y-trend path.ly',e=>e.map(x=>x.getAttribute('class')));
ok(lines.length===4&&lines.includes('ly ly0')&&lines.includes('ly ly1'),'月ごとの折れ線が年の数だけ（'+lines.length+'本）');
ok(await p.evaluate(()=>document.querySelectorAll('#y-trend .lg span').length===4),'凡例に年が並ぶ');
ok(await p.evaluate(()=>{const d=document.querySelector('#y-trend path.ly0').getAttribute('d');return (d.match(/[ML]/g)||[]).length===10}),'今年の線は先月まで（途中の月と先の月は描かない）');
await C(p,'#yq [data-q="1"]');await p.waitForTimeout(300);R=await rows(p,'#y-cmp');ok(R[0][0]==='2026年 1〜3月'&&R.length===4,'四半期でも年ごとに比べられる');
await C(p,'#yq [data-q="1"]');await p.waitForTimeout(200);
await C(p,'#ymode [data-ym="fy"]');await p.waitForTimeout(300);R=await rows(p,'#y-cmp');ok(/年度/.test(R[0][0]),'年度でも比べられる: '+R.map(r=>r[0]).join(','));
await C(p,'#ymode [data-ym="range"]');await p.waitForTimeout(300);
await p.evaluate(()=>{const f=document.getElementById('y-from'),t=document.getElementById('y-to');f.value='2026-03-01';f.dispatchEvent(new Event('change'));t.value='2026-03-31';t.dispatchEvent(new Event('change'))});await p.waitForTimeout(300);
ok(await p.evaluate(()=>[...document.querySelectorAll('#y-cmp [data-cm]')].map(x=>x.textContent).join()==='直前の期間,前年の同じ期間,複数年'),'期間を指定のときは3つから選べる');
await C(p,'#y-cmp [data-cm="yoy"]');await p.waitForTimeout(300);t=await txt(p,'#y-cmp');ok(/前年の同じ期間との比較/.test(t)&&/2025\/03\/01 〜 2025\/03\/31/.test(t),'前年の同じ期間と比べられる');
await C(p,'#y-cmp [data-cm="multi"]');await p.waitForTimeout(300);R=await rows(p,'#y-cmp');ok(R.length===4&&R[0][0]==='2026年','期間を指定でも複数年');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('記録が今年しかないとき・狭い画面');
const only={};for(const k of Object.keys(D).filter(k=>k.startsWith('2026-11')))only[k]=D[k];
const ctx=await b.newContext({viewport:{width:320,height:568}});await fr(ctx);p=await ctx.newPage();p.E=[];p.on('pageerror',e=>p.E.push(e.message));await p.clock.setFixedTime(new Date(2026,10,20,12,0));
await p.addInitScript(sd=>{localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd));localStorage.setItem('taxi-nippo-ui-v1',JSON.stringify({mcmp:'multi'}));localStorage.setItem('taxi-nippo-yr-v1',JSON.stringify({mode:'cal',cmp:'multi'}))},only);
await p.goto((process.env.APP_URL||'file://'+__dirname+'/../index.html'));await p.waitForTimeout(800);
await C(p,'#tab-month');await p.waitForTimeout(300);ok(/前の年の同じ期間の記録がまだない/.test(await txt(p,'#m-cmp')),'前の年がないときは、その旨を出す');
ok(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'320pxではみ出さない（月）');
await C(p,'#tab-year');await p.waitForTimeout(300);ok(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'320pxではみ出さない（年）');
ok(!p.E.length,'エラーなし '+p.E.join('/'));
await b.close()})();
