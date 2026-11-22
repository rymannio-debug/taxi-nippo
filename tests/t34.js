const RIDE=()=>{try{const u=JSON.parse(localStorage.getItem('taxi-nippo-ui-v1')||'{}');if(!u.odo){u.odo='ride';localStorage.setItem('taxi-nippo-ui-v1',JSON.stringify(u))}}catch(e){}};// 乗車・降車のたびにメーターを入れる設定で試す（はじめの設定は「出庫・帰庫のときだけ」）
const SHIM=()=>{const gi=Storage.prototype.getItem;let done=false;Storage.prototype.getItem=function(k){let v=gi.call(this,k);if(!done&&k==='taxi-nippo-v1'&&!window.__pre){done=true;try{const n=new Date(),t=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');const o=JSON.parse(v||'{}');if(!o[t]){o[t]={type:'day',date:t,trips:[],startTime:'05:00',endTime:'',odoStart:null,odoEnd:null};v=JSON.stringify(o);this.setItem(k,v)}}catch(e){}}return v};
 document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='#composer.lite #tawrap,#composer.lite #nbox{display:block!important}';document.head.appendChild(st)});};
const AUTOF=()=>{new MutationObserver(()=>{const v=document.getElementById('vs'),f=v&&!v.hidden&&v.querySelector('[data-vs="force"]');if(f)f.click()}).observe(document,{subtree:true,childList:true,attributes:true})};
(async()=>{const {chromium}=require('./pw');const b=await chromium.launch();const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
for(const scheme of ['light','dark']){
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:scheme,geolocation:{latitude:35.65,longitude:139.54},permissions:['geolocation']});
await ctx.route(/tile|open-meteo/,r=>r.abort());await ctx.route(/nominatim/,r=>r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"address":{"province":"東京都","city":"調布市"}}'}));
await ctx.route(/LonLatToAddress/,r=>r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"results":{"muniCd":"13208","lv01Nm":"小島町一丁目"}}'}));
const p=await ctx.newPage().then(async pg=>{await pg.addInitScript(AUTOF);await pg.addInitScript(SHIM);return pg});const E=[];p.on('pageerror',e=>E.push(e.message));
await p.addInitScript(RIDE);await p.goto((process.env.APP_URL||'file://'+__dirname+'/../index.html'));await p.waitForTimeout(700);
const pos=()=>p.$eval('#ride-b',e=>{const r=e.getBoundingClientRect();return {txt:e.textContent,bottom:Math.round(innerHeight-r.bottom),w:Math.round(r.width),h:Math.round(r.height),bg:getComputedStyle(e).backgroundColor,vis:getComputedStyle(e).display!=='none'}});
let q=await pos();ok(q.bottom<110&&q.w>330&&q.h>=100&&q.vis,scheme+' 空車: 下に大きく固定 '+JSON.stringify(q));ok(await p.evaluate(()=>{const r=document.getElementById('dockrow').getBoundingClientRect();return r.bottom>innerHeight-40&&r.height>50}),'その下に［休憩］［話す］［帰庫］');
await p.evaluate(()=>window.scrollTo(0,9999));await p.waitForTimeout(200);q=await pos();ok(q.bottom<110,'下まで動かしても下に残る');
await p.screenshot({path:'dock_'+scheme+'_a.png'});
await p.click('#ride-b');await p.waitForTimeout(400);await p.evaluate(()=>{if(document.activeElement.id!=='r-o1')document.getElementById('r-o1').focus()});await p.waitForTimeout(200);
ok(await p.evaluate(()=>document.body.classList.contains('typing')),'メーター入力中は typing');q=await pos();ok(!q.vis,'入力中はボタンが隠れる');
await p.evaluate(()=>document.activeElement.blur());await p.waitForTimeout(200);q=await pos();ok(q.vis&&q.txt==='降車','入力をやめると「降車」が出る '+q.bg);
await p.screenshot({path:'dock_'+scheme+'_b.png'});
await p.waitForTimeout(2000);await p.click('#ride-b');await p.waitForTimeout(400);ok(await p.evaluate(()=>document.activeElement.id)==='p-fare','降車で料金へ');
await p.keyboard.type('2400');await p.evaluate(()=>document.activeElement.blur());await p.waitForTimeout(300);
ok(await p.isVisible('#bar')&&!(await p.evaluate(()=>document.body.classList.contains('dock'))),'料金を入れると下は「記録」の帯に変わる');
await p.screenshot({path:'dock_'+scheme+'_c.png'});
await p.click('#bar-go');await p.waitForTimeout(400);q=await pos();ok(q.vis&&q.txt==='乗車'&&q.bottom<110,'記録すると下が「乗車」に戻る');
await p.click('#d-brk');await p.waitForTimeout(300);q=await pos();ok(q.txt==='休憩終了','休憩中は「休憩終了」 '+q.bg);
await p.evaluate(()=>location.hash='#month');await p.waitForTimeout(300);ok(!(await p.isVisible('#ride-b')),'月集計の画面では出ない');
await p.evaluate(()=>location.hash='');await p.waitForTimeout(300);await p.click('#rv-open');await p.waitForTimeout(300);ok(!(await p.evaluate(()=>document.body.classList.contains('dock'))),'日報1枚の画面では出ない');
console.log('errors',E);await ctx.close()}
await b.close()})();
