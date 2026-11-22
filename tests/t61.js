// 降車後のメモ: 料金の数字キーの「メモ」（記録の前）、「記録しました」の「メモ」（記録の後）、声の「メモ ○○」。今日の流れに 📝 で出る
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const APP=(process.env.APP_URL||'file://'+__dirname+'/../index.html');
const K='2026-11-22';
const on={[K]:{type:'day',date:K,startTime:'07:00',odoStart:45230,breaks:[],trips:[{id:'a',t:'07:40',fare:1500,pay:'cash',ts:1,note:'忘れ物の問い合わせ'}]}};
async function page(vp){const ctx=await b.newContext({viewport:vp||{width:390,height:844},hasTouch:true,isMobile:true});await fr(ctx);
  await ctx.route(/nominatim|gsi|tile|open-meteo|cyberjapan/,r=>r.abort());
  const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
  await p.clock.install({time:new Date(2026,10,22,9,0)});
  await p.addInitScript(sd=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd))},on);
  await p.goto(APP);await p.waitForTimeout(900);return p}
const vis=(p,s)=>p.locator(s).first().isVisible();
const key=async(p,k)=>{await p.locator('#np [data-k="'+k+'"]:visible').first().tap();await p.waitForTimeout(470)};
const trips=p=>p.evaluate(k=>days[k].trips.slice().sort((a,b)=>a.ts-b.ts),K);
const toFare=async p=>{for(let i=0;i<2;i++){await p.locator('#ride-b').tap();await p.clock.runFor(2500);await p.waitForTimeout(400)}};

console.log('1. 降車のあと、料金の数字キーの「メモ」');
let p=await page();
await toFare(p);
ok(await vis(p,'#np [data-xk="memo"]'),'料金の数字キーの上の段に「メモ」');
await key(p,'2');await key(p,'4');await key(p,'00');
await p.locator('#np [data-xk="memo"]').tap();await p.waitForTimeout(400);
ok(await vis(p,'#memo')&&/これから記録する乗車/.test(await p.textContent('#memo-sub')),'メモの画面が開く（これから記録する乗車）');
ok(await p.locator('#memo-q button').count()===1,'前に書いたメモが選べる');
await p.locator('#memo-t').fill('駅の東口で待ち合わせ');await p.locator('#memo-save').tap();await p.waitForTimeout(500);
ok(await vis(p,'#np')&&/メモ ✓/.test(await p.textContent('#np [data-xk="memo"]')),'数字キーに戻り、「メモ ✓」になる');
ok(await p.evaluate(()=>document.getElementById('p-fare').value)==='2400','料金は消えない');
await p.locator('#np [data-pk]:visible').last().tap();await p.waitForTimeout(700);
let T=await trips(p);ok(T.length===2&&T[1].note==='駅の東口で待ち合わせ'&&T[1].fare===2400,'支払いを押すと、メモも一緒に記録');
ok(/📝 駅の東口で待ち合わせ/.test(await p.textContent('#v-day')),'今日の流れに 📝 で出る');

console.log('2. 記録の直後、「記録しました」の「メモ」');
ok(await vis(p,'#toast-m'),'「記録しました」に「メモ」');
await p.locator('#toast-m').tap();await p.waitForTimeout(400);
ok(/記録した乗車/.test(await p.textContent('#memo-sub'))&&(await p.inputValue('#memo-t'))==='駅の東口で待ち合わせ','記録した乗車のメモを開く');
await p.locator('#memo-q button').first().tap();
ok(/駅の東口で待ち合わせ　忘れ物の問い合わせ/.test(await p.inputValue('#memo-t')),'前のメモを押すと後ろに足す');
await p.locator('#memo-save').tap();await p.waitForTimeout(400);
T=await trips(p);ok(T[1].note==='駅の東口で待ち合わせ　忘れ物の問い合わせ','保存される');
await p.locator('#toast-m').isHidden();
await p.evaluate(()=>{lastAdded={date:cur,id:days[cur].trips.slice().sort((a,b)=>b.ts-a.ts)[0].id};toast('x',true)});await p.locator('#toast-m').tap();await p.waitForTimeout(300);
await p.locator('#memo-del').tap();await p.waitForTimeout(300);T=await trips(p);ok(!T[1].note,'「消す」でメモを消せる');

console.log('3. 声の「メモ ○○」');
await p.evaluate(()=>vcHandle('メモ 次回も予約したい'));await p.waitForTimeout(400);
T=await trips(p);ok(T[1].note==='次回も予約したい','記録のあとなら、今日の最後の乗車に残す');
await toFare(p);
await p.evaluate(()=>vcHandle('メモ'));await p.waitForTimeout(300);await p.evaluate(()=>vcHandle('トランクに荷物'));await p.waitForTimeout(300);
await p.evaluate(()=>{const f=document.getElementById('p-fare');f.value='1800';f.dispatchEvent(new Event('input',{bubbles:true}))});
await p.evaluate(()=>{payOverride='cash';record()});await p.waitForTimeout(500);
T=await trips(p);ok(T.length===3&&T[2].note==='トランクに荷物','降車のあとなら、これから記録する乗車に入る（「メモ」→「トランクに荷物」）');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('4. 小さい画面（SE）');
p=await page({width:320,height:568});await toFare(p);
const r=await p.evaluate(()=>{const x=document.getElementById('np-xr');return {w:x.scrollWidth<=x.clientWidth+1,h:Math.min(...[...x.children].map(b=>b.getBoundingClientRect().height)),page:document.documentElement.scrollWidth<=document.documentElement.clientWidth}});
ok(r.w&&r.page&&r.h>=44,'迎車・人数・高速代・メモが1列に収まり、押しやすい');
await p.locator('#np [data-xk="memo"]').tap();await p.waitForTimeout(300);
ok(await p.evaluate(()=>{const s=document.querySelector('#memo .sheet');return s.scrollWidth<=s.clientWidth+1}),'メモの画面もはみ出さない');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
await b.close()})();
