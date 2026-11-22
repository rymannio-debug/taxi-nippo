// デバッグ: 音声が使えない端末で「話す」、閉じて入力欄で直す、タイムラインの境目、明るさの強制、記録が多い日
(async()=>{const {chromium}=require('./pw');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const ymdOf=n=>n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
const today=ymdOf(new Date()),yest=ymdOf(new Date(Date.now()-864e5));
async function page(seed,opt={}){const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:opt.dark?'dark':'light'});await ctx.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());
 const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
 await p.addInitScript(([sd,o])=>{if(!localStorage.getItem('__s')){localStorage.clear();for(const k in sd)localStorage.setItem(k,JSON.stringify(sd[k]));localStorage.setItem('__s','1')}
  if(o.nospeech){window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined}
  if(o.silent){window.webkitSpeechRecognition=undefined;window.SpeechRecognition=class{start(){setTimeout(()=>this.onend&&this.onend(),150)}stop(){}abort(){}}}
  Object.defineProperty(window,'speechSynthesis',{configurable:true,get:()=>({speak:u=>setTimeout(()=>u.onend&&u.onend(),30),cancel:()=>{},getVoices:()=>[]})});window.SpeechSynthesisUtterance=function(t){this.text=t};
 },[seed,opt]);
 await p.goto('file://'+__dirname+'/../index.html');await p.waitForTimeout(700);return p}
const C=(p,id)=>p.evaluate(i=>document.getElementById(i).click(),id);
const vis=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0},sel);
const base={'taxi-nippo-v1':{[today]:{type:'day',date:today,startTime:'07:00',trips:[],breaks:[]}}};

console.log('1. 音声が使えない端末で「話す」');
let p=await page(base,{nospeech:true});
ok(!(await vis(p,'#say')),'ふだん入力欄はたたまれている');
await C(p,'vbtn');await p.waitForTimeout(400);
ok(await vis(p,'#say')&&await p.evaluate(()=>document.activeElement.id)==='say','「話す」で入力欄が開いて入れられる');
ok(/キーボードのマイク/.test(await p.textContent('#toast-t')),'「キーボードのマイクを押して話してください」と出る');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('2. 何も聞き取れなかったあと「閉じて、入力欄で直す」');
p=await page(base,{silent:true});
await C(p,'vbtn');await p.waitForTimeout(1500);
const t=await p.textContent('#vs-t');console.log('     見出し: '+t);
await p.evaluate(()=>document.getElementById('vs-close').click());await p.waitForTimeout(400);
ok(!(await vis(p,'#vs'))&&await vis(p,'#say')&&await p.evaluate(()=>document.activeElement.id)==='say','閉じると入力欄が開いて入れられる');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('3. タイムラインの境目');
const tr=(id,t,fare)=>({id,t,tin:t,tout:t,fare,pay:'cash',from:'a',to:'b',ts:1});
p=await page({'taxi-nippo-v1':{[today]:{type:'day',date:today,trips:[tr('a','09:00',1000),tr('b','08:00',2000)],breaks:[{id:'k',s:'08:30',e:null,ts:Date.now()-600000}]},[yest]:{type:'day',date:yest,startTime:'07:00',trips:[tr('y','08:00',1500)],breaks:[]}}});
let L=await p.$$eval('#listwrap .tl',e=>e.map(x=>x.className.replace('tl ','')+':'+x.textContent.replace(/\s+/g,' ').trim().slice(0,18)));console.log('     '+L.join(' | '));
ok(L.length>=3&&/08:00/.test(L[0])&&/休憩 中/.test(L[1])&&/09:00/.test(L[2]),'出庫なしでも乗車と休憩中が時刻順');
ok(/tl-now/.test(L[L.length-1])&&/休憩中/.test(L[L.length-1]),'いまここ は休憩中');
await C(p,'prev');await p.waitForTimeout(400);L=await p.$$eval('#listwrap .tl',e=>e.map(x=>x.className));ok(!L.some(x=>/tl-now/.test(x))&&L.length===2,'前の日には「いまここ」は出ない');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('4. 明るさの強制');
p=await page({...base,'taxi-nippo-ui-v1':{theme:'light'}},{dark:true});
ok(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor)!=='rgb(31, 28, 21)'&&await p.evaluate(()=>document.documentElement.dataset.theme==='light'),'iPhoneが暗くても「昼」なら明るい: '+await p.evaluate(()=>getComputedStyle(document.body).backgroundColor));
await p.context().close();
p=await page({...base,'taxi-nippo-ui-v1':{theme:'dark'}});
ok(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor)==='rgb(31, 28, 21)','iPhoneが明るくても「夜」なら暗い');
const lowc=await p.evaluate(()=>{const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return null;const [r,g,b2]=m.slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b2};
 const bgOf=e=>{while(e){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return c;e=e.parentElement}return 'rgb(10,15,26)'};
 const out=[];document.querySelectorAll('button,span,b,div,label,em,a,i').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return;if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;const f=lum(getComputedStyle(e).color),g=lum(bgOf(e));if(f==null||g==null)return;const cr=(Math.max(f,g)+.05)/(Math.min(f,g)+.05);if(cr<3)out.push((e.id||e.className||e.tagName)+'「'+e.textContent.trim().slice(0,8)+'」'+cr.toFixed(1))});return out.slice(0,8)});
ok(!lowc.length,'夜の画面で読みにくい文字なし '+lowc.join(' / '));
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('5. 記録が多い日（60件）');
const many=Array.from({length:60},(_,i)=>{const h=7+Math.floor(i/4),m=(i%4)*15;const s=String(h%24).padStart(2,'0')+':'+String(m).padStart(2,'0');return tr('m'+i,s,1000+i*10)});
p=await page({'taxi-nippo-v1':{[today]:{type:'day',date:today,startTime:'06:30',trips:many,breaks:[]}}});
const ms=await p.evaluate(()=>{const t0=performance.now();for(let i=0;i<5;i++)renderDay();return (performance.now()-t0)/5});
ok(ms<120,'日報の描き直し 1回 '+ms.toFixed(1)+' ms');
ok(await p.$$eval('#listwrap .tl-r',e=>e.length)===60,'60件すべて並ぶ');
ok(!p.E.length,'エラーなし '+p.E.join('/'));
await b.close()})();
