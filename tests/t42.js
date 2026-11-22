// 使いやすさ10点の改善を確かめる
const RIDE=()=>{try{const u=JSON.parse(localStorage.getItem('taxi-nippo-ui-v1')||'{}');if(!u.odo){u.odo='ride';localStorage.setItem('taxi-nippo-ui-v1',JSON.stringify(u))}}catch(e){}};// 乗車・降車のたびにメーターを入れる設定で試す（はじめの設定は「出庫・帰庫のときだけ」）
(async()=>{const {chromium}=require('./pw');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const today=(()=>{const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')})();
async function page(seed){const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());
 const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
 await p.addInitScript(sd=>{if(!localStorage.getItem('__seeded')){localStorage.clear();if(sd)for(const k in sd)localStorage.setItem(k,JSON.stringify(sd[k]));localStorage.setItem('__seeded','1')}
  window.__said=[];window.__q=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,get:()=>({speak:u=>{if(u.text.trim()){window.__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),80)}},cancel:()=>{},getVoices:()=>[]})});window.SpeechSynthesisUtterance=function(t){this.text=t};
  window.webkitSpeechRecognition=undefined;window.SpeechRecognition=class{start(){const t=window.__q.shift();setTimeout(()=>{if(t!=null){const r=[[{transcript:t}]];r[0].isFinal=true;this.onresult({resultIndex:0,results:r})}setTimeout(()=>this.onend(),60)},120)}stop(){setTimeout(()=>this.onend&&this.onend(),20)}abort(){setTimeout(()=>this.onend&&this.onend(),20)}};
 },seed||null);
 await p.addInitScript(RIDE);await p.goto('file://'+__dirname+'/../index.html');await p.waitForTimeout(700);return p}
const C=(p,id)=>p.evaluate(i=>document.getElementById(i).click(),id);
const vis=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'},sel);
const dockS=p=>p.evaluate(()=>{const b=document.getElementById('ride-b');return {t:b.textContent,s:b.dataset.s,st:document.getElementById('ride').dataset.st,before:getComputedStyle(b,'::before').content}});
const store=p=>p.evaluate(k=>JSON.parse(JSON.stringify(days)||'{}')[k]||{},today);
const key=async(p,k)=>{await p.evaluate(k=>document.querySelector('#np [data-k="'+k+'"]').click(),k);await p.waitForTimeout(470)};

console.log('1. 出庫前は下のボタンが「出庫」');
let p=await page();
let d=await dockS(p);ok(d.st==='pre'&&d.t==='出庫','出庫前: '+JSON.stringify(d));ok(/出庫前/.test(d.before),'ボタンの上に「出庫前」');
ok(!(await vis(p,'#ride .ride-t')),'下の「出庫前」の重複表示は出ない');
await C(p,'ride-b');await p.waitForTimeout(400);d=await store(p);ok(!!d.startTime,'押すと出庫になる: '+d.startTime);
ok(await p.evaluate(()=>document.activeElement.id)==='sh-odo','続けて出庫メーター');
await p.evaluate(()=>document.activeElement.blur());await p.waitForTimeout(300);
d=await dockS(p);ok(d.t==='乗車'&&/空車/.test(d.s),'出庫後は「乗車」・状態「空車」: '+JSON.stringify(d));
await p.evaluate(()=>window.__q.push('乗車'));

console.log('2. 空車中は必要な欄だけ');
ok(await vis(p,'#r-o1')&&!(await vis(p,'#r-o2')),'空車中は乗車メーターだけ');
ok(!(await vis(p,'#p-fare'))&&!(await vis(p,'#say')),'料金と話した内容の欄はたたまれている');
ok(!(await vis(p,'#go'))&&!(await vis(p,'#reset'))&&!(await vis(p,'#why')),'灰色の記録ボタン・リセット・説明文は出ない');
ok(await vis(p,'#q-text')&&await vis(p,'#q-fare'),'「文字で入れる」「料金から入れる」がある');
await C(p,'q-text');await p.waitForTimeout(300);ok(await vis(p,'#say')&&await p.evaluate(()=>document.activeElement.id)==='say','「文字で入れる」で入力欄が開く');
await p.evaluate(()=>document.activeElement.blur());await C(p,'reset').catch(()=>{});await p.waitForTimeout(300);
const h=await p.evaluate(()=>document.documentElement.scrollHeight);ok(h<1720,'日報画面の高さ '+h+'px（上の切り替えを押しやすい44pxにした分を含む）');

console.log('3. 乗車・降車・料金・支払い（テンキーの確定のあと支払いボタン）');
await p.waitForTimeout(2100);await C(p,'ride-b');await p.waitForTimeout(400);
d=await dockS(p);ok(d.t==='降車'&&/乗車中/.test(d.s),'乗車中: '+JSON.stringify(d));
ok(await p.evaluate(()=>document.activeElement.id)!=='r-o1','メーターを使っていない人には、乗車のたびにテンキーが出ない');
ok(!(await vis(p,'#r-o2')),'乗車中、メーターを使っていなければ降車メーター欄は出ない');
await p.waitForTimeout(2100);await C(p,'ride-b');await p.waitForTimeout(500);
ok(await p.evaluate(()=>document.activeElement.id)==='p-fare','降車で料金へ');
ok(await p.evaluate(()=>[...document.querySelectorAll('#paychips [aria-pressed="true"]')].length)===0,'支払方法は最初は選ばれていない');
ok(await p.evaluate(()=>document.getElementById('toast').hidden),'テンキーが出たら「乗車 HH:MM」の知らせは消える');
for(const k of ['2','4','0','0'])await key(p,k);
await key(p,'ok');await p.waitForTimeout(200);ok(await vis(p,'#np-pay'),'確定で支払いのボタンが出る');
const pk=await p.$$eval('#np-pay button',e=>e.map(x=>x.textContent));ok(pk.includes('カード')&&pk.includes('現金')&&pk.includes('記録せずに閉じる'),'ボタン: '+pk.join(' / '));
await p.waitForTimeout(500);await p.evaluate(()=>document.querySelector('#np-pay [data-pk="card"]').click());await p.waitForTimeout(400);
if(await vis(p,'#vs')){const t=await p.textContent('#vs-t');ok(/確認/.test(t),'場所がないので記録前の確認: '+t);await p.evaluate(()=>document.querySelector('#vs [data-vs="force"]').click());await p.waitForTimeout(300)}
d=await store(p);let t=(d.trips||[]).slice(-1)[0]||{};ok(d.trips&&d.trips.length===1&&t.fare===2400&&t.pay==='card','カードで記録: '+JSON.stringify({n:(d.trips||[]).length,fare:t.fare,pay:t.pay}));
ok(/カード/.test(await p.textContent('#toast-t')),'知らせに支払いも出る: '+await p.textContent('#toast-t'));

console.log('4. 支払いを選ばずに閉じたとき');
await p.waitForTimeout(2100);await C(p,'q-fare');await p.waitForTimeout(400);for(const k of ['1','5','0','0'])await key(p,k);
await key(p,'ok');await p.waitForTimeout(500);await p.evaluate(()=>document.querySelector('#np-pay [data-pk="later"]').click());await p.waitForTimeout(400);
ok(await vis(p,'#bar')&&/支払い未選択/.test(await p.textContent('#bar-sum')),'記録の帯に「支払い未選択」: '+await p.textContent('#bar-sum'));
await C(p,'bar-go');await p.waitForTimeout(400);ok(await vis(p,'#vs'),'記録前の確認が出る');
const rows=await p.$$eval('#vs .ck-row',e=>e.map(x=>x.className+':'+x.textContent));ok(rows.some(r=>/warn/.test(r)&&/支払方法未選択/.test(r)),'支払方法が ⚠ 未選択');
await p.evaluate(()=>document.querySelector('#vs [data-ck="pay"]').click());await p.waitForTimeout(400);ok(await vis(p,'#np-pay'),'⚠ を押すと支払いのボタンへ');
await p.waitForTimeout(500);await p.evaluate(()=>document.querySelector('#np-pay [data-pk="qr"]').click());await p.waitForTimeout(400);
if(await vis(p,'#vs'))await p.evaluate(()=>document.querySelector('#vs [data-vs="force"]').click());await p.waitForTimeout(300);
d=await store(p);t=d.trips.slice(-1)[0];ok(d.trips.length===2&&t.pay==='qr','QRで記録: '+t.pay);

console.log('5. 声：料金のあと支払いを聞く');
await p.waitForTimeout(500);await p.evaluate(()=>window.__q.splice(0),0);await p.evaluate(()=>window.__q.push('3000円','カード'));await p.evaluate(()=>document.getElementById('vbtn').click());await p.waitForTimeout(2600);
const said=await p.evaluate(()=>window.__said.join(' / '));ok(/支払いは/.test(said),'「支払いは？」と聞く');ok(/aria-pressed="true"[^>]*>カード/.test(await p.innerHTML('#vs-rows')),'答えた「カード」が入る');
await p.evaluate(()=>document.querySelector('#vs [data-vs="again"]')&&document.getElementById('vs-close')&&document.getElementById('vs-close').click());
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('6・7・8. 営収カード・状態の札・知らせ');
const seed={'taxi-nippo-v1':{[today]:{type:'day',date:today,startTime:'07:00',odoStart:45100,breaks:[],trips:[{id:'a',t:'08:00',tin:'08:00',tout:'08:30',fare:2400,pay:'cash',pax:1,from:'調布駅',to:'府中駅',o1:45110,o2:45118,ts:1}]}}};
p=await page(seed);
ok(await p.evaluate(()=>document.getElementById('meterp').classList.contains('fold'))&&!(await vis(p,'#m-total')),'営収の大きい数字はたたまれている（上の帯に出ている）');
await C(p,'m-fold');await p.waitForTimeout(300);ok(await vis(p,'#m-total'),'「大きく表示」で開く');
ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('taxi-nippo-ui-v1')||'{}').mbig===true),'開いた状態を覚える（保存される）');await C(p,'m-fold');await p.waitForTimeout(200);
await C(p,'ride-b');await p.waitForTimeout(300);await p.evaluate(()=>document.activeElement.blur());await p.evaluate(()=>scrollTo(0,1400));await p.waitForTimeout(400);
ok(!(await vis(p,'#stpill')),'スクロールしても右上に札が浮かない');d=await dockS(p);ok(/乗車中/.test(d.before),'状態は下のボタンの中に: '+d.before);
await p.evaluate(()=>{const e=document.createElement('x');})/*pad open on a meter day hides the toast*/;await p.evaluate(()=>window.toast?0:0);await p.evaluate(()=>{document.activeElement&&document.activeElement.blur()});await p.evaluate(()=>{const ev=new Event('x');});await p.evaluate(()=>{toast('乗車 テスト',false)});ok(await p.evaluate(()=>!document.getElementById('toast').hidden),'知らせが出る');await p.waitForTimeout(2800);ok(await p.evaluate(()=>document.getElementById('toast').hidden),'2.5秒で消える');
ok(await vis(p,'#r-o1')&&await vis(p,'#r-o2'),'メーターを使う日は乗車中に両方のメーター');

console.log('9. 修正画面');
await C(p,'ride-x');await p.waitForTimeout(200);await p.evaluate(()=>document.querySelector('.trip').click());await p.waitForTimeout(400);
ok(!(await vis(p,'#e-t')),'「時刻」の重複欄はない');ok(!(await p.evaluate(()=>document.getElementById('e-more').open)),'その他はたたまれている');
const ord=await p.$$eval('#ov .sheet > .grid2 .f',e=>e.filter(x=>x.getClientRects().length).map(x=>x.textContent.trim().slice(0,4)));ok(/料金/.test(ord[0])&&/支払/.test(ord[1])&&/乗車地/.test(ord[2]),'上から 料金・支払・乗車地: '+ord.join(','));
await p.evaluate(()=>document.querySelector('[data-pax="1"]').click());await p.evaluate(()=>document.querySelector('[data-pax="1"]').click());ok(await p.inputValue('#e-pax')==='3','＋で人数が増える');
await p.fill('#e-t1','08:05');await C(p,'e-save');await p.waitForTimeout(300);d=await store(p);t=d.trips[0];ok(t.pax===3&&t.tin==='08:05'&&t.t==='08:05','保存: '+JSON.stringify({pax:t.pax,tin:t.tin,t:t.t}));
await p.evaluate(()=>document.querySelector('.trip').click());await p.waitForTimeout(300);await p.evaluate(()=>document.getElementById('e-more').open=true);await p.fill('#e-km','');await p.fill('#e-o1','45120');await p.fill('#e-o2','45131');await C(p,'e-save');await p.waitForTimeout(300);
d=await store(p);ok(d.trips[0].km===11,'メーターを直すと距離もそろう: '+d.trips[0].km);

console.log('10. 設定タブ / 5. 日報の実車距離');
ok(!(await vis(p,'#bk')),'日報の画面にバックアップ・消去はない');await C(p,'tab-set');await p.waitForTimeout(300);ok(await vis(p,'#bk-copy')&&await vis(p,'#del-check'),'設定タブにある');
await C(p,'tab-day');await p.waitForTimeout(300);
await p.evaluate(k=>{const o=JSON.parse(JSON.stringify(days));o[k].trips.push({id:'z',t:'09:00',tin:'09:00',tout:'09:20',fare:1500,pay:'cash',pax:1,from:'a',to:'b',o1:45140,o2:45147,ts:5});o[k].endTime='15:00';o[k].odoEnd=45200;localStorage.setItem('taxi-nippo-v1',JSON.stringify(o))},today);
await p.evaluate(()=>{loadLocal();render()});await p.waitForTimeout(300);await C(p,'rv-open');await p.waitForTimeout(500);const rv=(await p.textContent('#rv-body')).replace(/\s+/g,' ');
ok(/実車距離\s*18 km/.test(rv),'実車距離 11+7=18 km: '+(rv.match(/実車距離[^走空]*/)||[''])[0]);ok(/実車率\s*\d+ %/.test(rv),'実車率も出る: '+(rv.match(/実車率[^回]*/)||[''])[0]);
const wrap=await p.$$eval('#rv-body .rtable th',e=>e.filter(x=>{const r=document.createRange();r.selectNodeContents(x);return r.getClientRects().length>1}).map(x=>x.textContent));ok(!wrap.length,'項目名が折り返さない '+wrap.join(','));
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('11. 出庫前に声で「乗車」');
p=await page();await p.evaluate(()=>window.__q.push('乗車'));await p.evaluate(()=>document.getElementById('vbtn').click());await p.waitForTimeout(1500);
ok(/出庫していません/.test(await p.textContent('#vs-t')),'「まだ出庫していません」: '+await p.textContent('#vs-t'));
ok(!p.E.length,'エラーなし '+p.E.join('/'));
await b.close()})();
