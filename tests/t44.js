// 入力動線の改善 1・2・3・4・5・7・8
const RIDE=()=>{try{const u=JSON.parse(localStorage.getItem('taxi-nippo-ui-v1')||'{}');if(!u.odo){u.odo='ride';localStorage.setItem('taxi-nippo-ui-v1',JSON.stringify(u))}}catch(e){}};// 乗車・降車のたびにメーターを入れる設定で試す（はじめの設定は「出庫・帰庫のときだけ」）
(async()=>{const {chromium}=require('./pw');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const today=(()=>{const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')})();
async function page(seed,geoOk){const ctx=await b.newContext({viewport:{width:390,height:844},geolocation:{latitude:35.65,longitude:139.54},permissions:geoOk?['geolocation']:[]});
 await ctx.route(/tile|open-meteo/,r=>r.abort());
 await ctx.route(/nominatim/,r=>geoOk?r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"address":{"province":"東京都","city":"調布市"}}'}):r.abort());
 await ctx.route(/LonLatToAddress/,r=>geoOk?r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"results":{"muniCd":"13208","lv01Nm":"小島町一丁目"}}'}):r.abort());
 const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
 await p.addInitScript(sd=>{if(!localStorage.getItem('__s')){localStorage.clear();for(const k in sd)localStorage.setItem(k,JSON.stringify(sd[k]));localStorage.setItem('__s','1')}},seed);
 await p.addInitScript(RIDE);await p.goto('file://'+__dirname+'/../index.html');await p.waitForTimeout(800);p.taps=0;return p}
const tap=async(p,sel)=>{await p.evaluate(s=>document.querySelector(s).click(),sel);p.taps++;await p.waitForTimeout(500)};
const key=(p,k)=>tap(p,'#np-kf [data-k="'+k+'"], #np .np-k:not(.np-kf) [data-k="'+k+'"]');
const kf=(p,k)=>tap(p,'#np-kf [data-k="'+k+'"]');
const vis=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0},sel);
const trips=p=>p.evaluate(k=>JSON.parse(JSON.stringify(days))[k].trips,today);
const tr=(id,pay)=>({id,t:'06:00',tin:'06:00',tout:'06:10',fare:1000,pay,from:'a',to:'b',ts:1});

console.log('1・2. 料金の数字キーに支払い（よく使う順）');
let p=await page({'taxi-nippo-v1':{[today]:{type:'day',date:today,startTime:'05:00',trips:[tr('a','card'),tr('b','card'),tr('c','qr')],breaks:[]}}},true);
await tap(p,'#ride-b');await p.waitForTimeout(1700);await tap(p,'#ride-b');
ok(await vis(p,'#np-kf')&&!(await vis(p,'#np [data-k="ok"]')),'料金のときは「確定」の代わりに支払いのキー');
let k=await p.$$eval('#np-kf .pk',e=>e.map(x=>x.dataset.pk));ok(k[2]==='card'&&k[1]==='qr','いちばん多いカードが確定の場所、次がQR: '+k.join(','));
const r1=await p.evaluate(()=>{const a=document.getElementById('np-p1').getBoundingClientRect();return [Math.round(a.right),Math.round(a.bottom),innerWidth,innerHeight]});ok(r1[2]-r1[0]<20&&r1[3]-r1[1]<30,'いちばん多い支払いは右下 '+r1.join(','));
await tap(p,'#np-p1');ok((await trips(p)).length===3&&/先に料金/.test(await p.textContent('#np-hint')),'料金が空なら記録しない（「先に料金を入れてください」）');
for(const x of ['2','4','00'])await kf(p,x);
await tap(p,'#np-p1');if(await vis(p,'#vs'))await tap(p,'#vs [data-vs="force"]');
let t=await trips(p);ok(t.length===4&&t[3].fare===2400&&t[3].pay==='card','¥2,400 カードで記録: '+JSON.stringify(t[3]&&{fare:t[3].fare,pay:t[3].pay}));
ok(p.taps<=8,'押した回数（乗車〜記録） '+p.taps+'回（以前は8回）');
console.log('   その他の支払い');await p.waitForTimeout(1600);await tap(p,'#ride-b');await p.waitForTimeout(1600);await tap(p,'#ride-b');
for(const x of ['1','5','00'])await kf(p,x);await tap(p,'#np-kf [data-pk="more"]');ok(await vis(p,'#np-pay'),'「その他の支払い」で全部の支払い');
await tap(p,'#np-pay [data-pk="emoney"]');if(await vis(p,'#vs'))await tap(p,'#vs [data-vs="force"]');t=await trips(p);ok(t[t.length-1].pay==='emoney','電子マネーで記録');
console.log('   声で「カード」と言ってあれば、それが確定の場所に');
await p.waitForTimeout(1600);await tap(p,'#q-text');await p.fill('#say','QR');await p.evaluate(()=>document.getElementById('say').blur());await tap(p,'#q-fare').catch(()=>{});
await p.evaluate(()=>document.getElementById('p-fare').focus());await p.waitForTimeout(500);ok(await p.evaluate(()=>document.getElementById('np-p1').dataset.pk)==='qr','言った支払い（QR）が大きいキーに');
await p.evaluate(()=>{document.activeElement.blur()});await tap(p,'#reset');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('3. 乗車メーターも3桁で自動で次へ');
p=await page({'taxi-nippo-v1':{[today]:{type:'day',date:today,startTime:'05:00',odoStart:45210,trips:[],breaks:[]}}},true);
await tap(p,'#ride-b');ok(await p.evaluate(()=>document.activeElement.id)==='r-o1','乗車でメーターの数字キー');
for(const x of '230')await key(p,x);ok(!(await vis(p,'#np'))&&await p.inputValue('#r-o1')==='45230','3桁で閉じて 45230');
await p.waitForTimeout(1200);await tap(p,'#ride-b');for(const x of '236')await key(p,x);ok(await p.evaluate(()=>document.activeElement.id)==='p-fare','降車メーター3桁で料金へ');
for(const x of ['2','4','00'])await kf(p,x);await tap(p,'#np-p1');if(await vis(p,'#vs'))await tap(p,'#vs [data-vs="force"]');
t=await trips(p);ok(t.length===1&&t[0].o1===45230&&t[0].o2===45236,'メーターも入って記録');ok(p.taps<=12,'メーターありの押した回数 '+p.taps+'回（以前は14回）');
console.log('   全部の桁を打つ人は自動で閉じない');
await p.waitForTimeout(1600);await tap(p,'#ride-b');for(const x of '452')await key(p,x);ok(await vis(p,'#np'),'3桁目でまだ閉じない（452 は前回より小さい）');for(const x of '40')await key(p,x);ok(await vis(p,'#np'),'5桁でも閉じない（確定で決める）');await key(p,'ok');ok(await p.inputValue('#r-o1')==='45240','確定で 45240');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('4. 位置が取れないときは場所を聞かない');
p=await page({'taxi-nippo-v1':{[today]:{type:'day',date:today,startTime:'05:00',trips:[],breaks:[]}}},false);
await tap(p,'#ride-b');await p.waitForTimeout(1600);await tap(p,'#ride-b');await p.waitForTimeout(500);
for(const x of ['2','4','00'])await kf(p,x);await tap(p,'#np-p1');
ok(!(await vis(p,'#vs')),'記録前の確認が出ずに記録');t=await trips(p);ok(t.length===1&&t[0].nf===1&&t[0].nt===1,'位置が取れなかった印が付く');
await p.evaluate(k=>{},0);await tap(p,'#sh-b');await p.evaluate(()=>document.activeElement.blur());await p.waitForTimeout(700);
const ck=await p.evaluate(()=>document.getElementById('rv-check').textContent);ok(!/乗車地|降車地/.test(ck),'帰庫の点検でも場所は出ない: '+ck.slice(0,60));
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
console.log('   位置が取れる日は今まで通り');
p=await page({'taxi-nippo-v1':{[today]:{type:'day',date:today,startTime:'05:00',trips:[],breaks:[]}}},true);
await tap(p,'#q-fare');for(const x of ['2','4','00'])await kf(p,x);await tap(p,'#np-p1');ok(await vis(p,'#vs')&&/乗車地/.test(await p.textContent('#vs-rows')),'乗車ボタンを使わず場所もないときは確認が出る');
await tap(p,'#vs [data-vs="force"]');

console.log('5・8. 記録後の知らせ');
const tb=await p.evaluate(()=>{const a=document.getElementById('toast').getBoundingClientRect(),d=document.getElementById('ride-b').getBoundingClientRect();return [Math.round(a.bottom),Math.round(d.top)]});ok(tb[1]-tb[0]>300,'知らせは画面の上（下のボタンから離れている） '+tb.join(' / '));
ok(await vis(p,'#toast-e'),'「直す」がある');await tap(p,'#toast-b');ok((await trips(p)).length===1&&/もう一度/.test(await p.textContent('#toast-b')),'「取り消す」1回目では消えない');
await p.waitForTimeout(4200);ok(/^取り消す$/.test(await p.textContent('#toast-b')),'4秒で元に戻る');
await tap(p,'#toast-e');ok(await vis(p,'#ov')&&/261/.test(await p.textContent('#sh-h')),'「直す」でその記録の修正画面');await tap(p,'#e-cancel');
await p.evaluate(()=>toast('記録しました',true));await tap(p,'#toast-b');await tap(p,'#toast-b');ok((await trips(p)).length===0,'2回押すと取り消し');

console.log('7. 人数・迎車・高速代のボタン');
await p.waitForTimeout(500);await tap(p,'#ride-b');await p.waitForTimeout(1600);await tap(p,'#ride-b');
ok(await vis(p,'#xrow'),'降車後に人数・迎車・高速代');await tap(p,'#xrow [data-x="1"]');await tap(p,'#xrow [data-x="1"]');await tap(p,'#x-mukae');
ok(await vis(p,'#np')&&await p.evaluate(()=>document.activeElement.id)==='p-fare','押しても料金の数字キーは開いたまま');
for(const x of ['5','6','00'])await kf(p,x);
await p.evaluate(()=>document.getElementById('p-toll').focus());await p.waitForTimeout(500);ok(!(await vis(p,'#np-kf'))&&await vis(p,'#np [data-k="ok"]'),'高速代は普通の数字キー（確定あり）');
for(const x of ['1','3','2','0'])await key(p,x);await key(p,'ok');ok(/3名/.test(await p.textContent('#bar-sum'))&&/迎車/.test(await p.textContent('#bar-sum'))&&/高速1,320/.test(await p.textContent('#bar-sum')),'記録の帯: '+await p.textContent('#bar-sum'));
await p.evaluate(()=>document.querySelector('#paychips [data-pay="cash"]').click());await tap(p,'#bar-go');if(await vis(p,'#vs'))await tap(p,'#vs [data-vs="force"]');
t=await trips(p);t=t[t.length-1];ok(t.fare===5600&&t.pax===3&&t.mukae===true&&t.toll===1320,'記録: '+JSON.stringify({fare:t.fare,pax:t.pax,mukae:t.mukae,toll:t.toll}));
ok(await p.textContent('#x-pax')==='1名'&&await p.evaluate(()=>document.getElementById('x-mukae').getAttribute('aria-pressed'))==='false','記録したら元に戻る');
ok(!p.E.length,'エラーなし '+p.E.join('/'));
await b.close()})();
