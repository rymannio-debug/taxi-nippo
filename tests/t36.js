const SHIM=()=>{const gi=Storage.prototype.getItem;let done=false;Storage.prototype.getItem=function(k){let v=gi.call(this,k);if(!done&&k==='taxi-nippo-v1'&&!window.__pre){done=true;try{const n=new Date(),t=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');const o=JSON.parse(v||'{}');if(!o[t]){o[t]={type:'day',date:t,trips:[],startTime:'05:00',endTime:'',odoStart:null,odoEnd:null};v=JSON.stringify(o);this.setItem(k,v)}}catch(e){}}return v};
 document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='#composer.lite #tawrap,#composer.lite #nbox{display:block!important}';document.head.appendChild(st)});};
const AUTOF=()=>{new MutationObserver(()=>{const v=document.getElementById('vs'),f=v&&!v.hidden&&v.querySelector('[data-vs="force"]');if(f)f.click()}).observe(document,{subtree:true,childList:true,attributes:true})};
(async()=>{const {chromium}=require('./pw');const b=await chromium.launch();const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const today=(()=>{const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')})();
const seed={[today]:{type:'day',date:today,trips:[{id:'z',t:'08:00',fare:1000,pay:'cash',pax:1,o1:45200,o2:45210,km:10,ts:1}],breaks:[],startTime:'07:00',endTime:'',odoStart:45190,odoEnd:null}};
async function page(mode){
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true});await ctx.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());
 const p=await ctx.newPage().then(async pg=>{await pg.addInitScript(AUTOF);await pg.addInitScript(SHIM);return pg});const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
 await p.addInitScript(([s,mode])=>{
  if(!sessionStorage.getItem('x')){localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(s));sessionStorage.setItem('x','1')}
  window.__said=[];window.__script=[];
  Object.defineProperty(window,'speechSynthesis',{configurable:true,get:()=>({speak:u=>{if(u.text.trim())window.__said.push(u.text)},cancel:()=>{},getVoices:()=>[{lang:'ja-JP',name:'Kyoko'}]})});
  window.SpeechSynthesisUtterance=function(t){this.text=t};
  if(mode==='claude'){
   const st={a:false,p:null,f:null,s:null};
   window.claude={use:async n=>n==='dictation'?{onPartial:f=>st.p=f,onFinal:f=>st.f=f,onState:f=>st.s=f,active:()=>st.a,
     start:async()=>{st.a=true;st.s({state:'listening'});const sc=window.__script.shift()||[];for(const [kind,t] of sc){await new Promise(r=>setTimeout(r,150));if(kind==='p')st.p({text:t});else st.f({text:t})}},
     stop:async()=>{st.a=false;st.s({state:'idle',reason:'stopped'})}}:null};
  }else{
   window.webkitSpeechRecognition=undefined;
   window.SpeechRecognition=class{start(){const sc=window.__script.shift()||[];let i=0;
     const step=()=>{if(i>=sc.length){setTimeout(()=>this.onend&&this.onend(),100);return}const [kind,t]=sc[i++];
       if(kind==='err'){this.onerror&&this.onerror({error:t});setTimeout(()=>this.onend&&this.onend(),50);return}
       const res=[[{transcript:t}]];res[0].isFinal=kind==='f';this.onresult&&this.onresult({resultIndex:0,results:res});setTimeout(step,150)};setTimeout(step,150)}
     stop(){setTimeout(()=>this.onend&&this.onend(),30)} abort(){setTimeout(()=>this.onend&&this.onend(),30)}};
  }},[seed,mode]);
 await p.goto((process.env.APP_URL||'file://'+__dirname+'/../index.html'));await p.waitForTimeout(800);return p}
const store=(p)=>p.evaluate(k=>JSON.parse(JSON.stringify(days))[k].trips,today);
/* Claude版は iPhone版の写し（v96〜）で記録しないので、声で記録する流れは単体版だけ。Claude版は「話す」が出ないことを確かめる */
{const p=await page('claude');ok(!(await p.isVisible('#vbtn'))&&await p.evaluate(()=>document.body.classList.contains('ro')),'Claude版（写し）には「話す」が出ない');await p.context().close()}
for(const mode of ['solo']){
console.log('==',mode==='solo'?'単体版（ブラウザの音声認識）':'Claude版（dictation）');
const p=await page(mode);
ok(await p.isVisible('#vbtn'),'下に「話す」ボタンがある');
const box=async s=>p.$eval(s,e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.right),Math.round(innerHeight-r.bottom)]});
const vb=await box('#vbtn'),rb=await box('#ride-b');ok(vb[2]<rb[2]&&vb[0]>=rb[0]&&vb[1]<=rb[1],'話す は大きいボタンのすぐ下の列 '+JSON.stringify([vb,rb]));
await p.screenshot({path:'voice_'+mode+'_0.png'});
await p.evaluate(()=>window.__script.push([['p','調布駅から'],['f','調布駅から府中駅まで 2400円 カード']]));
await p.tap('#vbtn');await p.waitForTimeout(250);ok(await p.isVisible('#vs-listen'),'押すとすぐ聞き取りが始まる');ok(/調布駅/.test(await p.textContent('#vs-live')),'話している途中の言葉が大きく出る: '+await p.textContent('#vs-live'));
await p.screenshot({path:'voice_'+mode+'_1.png'});
await p.waitForTimeout(mode==='claude'?2800:900);
ok(await p.isVisible('#vs-res'),'話し終わると結果が出る');
ok(/¥2,400/.test(await p.textContent('#vs-rows')),'料金 ¥2,400 が大きく出る');ok(await p.getAttribute('#vs [data-vp="card"]','aria-pressed')==='true','支払はカード');ok(/調布駅 → 府中駅/.test(await p.textContent('#vs-rows')),'区間');
const said=await p.evaluate(()=>window.__said.slice(-1)[0]);ok(/2400円、カード、調布駅から府中駅まで。記録しますか/.test(said),'読み上げ: '+said);
await p.screenshot({path:'voice_'+mode+'_2.png'});
await p.tap('#vs [data-vp="cash"]');ok(await p.getAttribute('#vs [data-vp="cash"]','aria-pressed')==='true','その場で現金に変えられる');
await p.tap('#vs [data-vs="rec"]');await p.waitForTimeout(300);let tr=await store(p);const last=tr[tr.length-1];
ok(tr.length===2&&last.fare===2400&&last.pay==='cash'&&last.from==='調布駅'&&last.to==='府中駅','これで記録 → 保存: '+JSON.stringify({fare:last.fare,pay:last.pay,from:last.from,to:last.to}));
ok(!(await p.isVisible('#vs')),'記録すると閉じる');
console.log('-- 直前の修正');
await p.evaluate(()=>window.__script.push([['f','さっきのはカード']]));await p.tap('#vbtn');await p.waitForTimeout(mode==='claude'?2700:700);
ok(/直します/.test(await p.textContent('#vs-t')),'見出し: '+await p.textContent('#vs-t'));ok(/修正する/.test(await p.textContent('#vs-btns')),'ボタンが「修正する」');
ok(/カード/.test(await p.evaluate(()=>window.__said.slice(-1)[0])),'読み上げ: '+await p.evaluate(()=>window.__said.slice(-1)[0]));
await p.tap('#vs [data-vs="rec"]');await p.waitForTimeout(300);tr=await store(p);ok(tr[tr.length-1].pay==='card','直前の記録がカードに');
console.log('-- メーターのマイク');
await p.waitForTimeout(2100);await p.tap('#ride-b');await p.waitForTimeout(300);await p.evaluate(()=>document.activeElement.blur());await p.waitForTimeout(200);
await p.evaluate(()=>window.__script.push([['f','230']]));await p.tap('.rmic[data-say="メーター "]');await p.waitForTimeout(mode==='claude'?2700:700);
ok(await p.inputValue('#p-o1')==='45230','「230」で乗車メーター 45230: '+await p.inputValue('#p-o1'));ok(/メーター/.test(await p.textContent('#vs-t')),'見出し: '+await p.textContent('#vs-t'));
await p.tap('#vs [data-vs="close"]');await p.waitForTimeout(200);ok(!(await p.isVisible('#vs')),'OKで閉じる');
console.log('-- 聞き取れない');
await p.evaluate(()=>window.__script.push([]));await p.tap('#vbtn');await p.waitForTimeout(mode==='claude'?200:600);
if(mode==='claude'){await p.tap('#vs [data-vs="stop"]');await p.waitForTimeout(300)}
ok(/聞き取れません/.test(await p.textContent('#vs-t')),'聞き取れなかったときの表示: '+await p.textContent('#vs-t'));
await p.tap('#vs [data-vs="close"]');
console.log('-- 料金なし');
await p.evaluate(()=>window.__script.push([['f','調布駅から府中駅']]));await p.tap('#vbtn');await p.waitForTimeout(mode==='claude'?2700:700);
ok(/料金は/.test(await p.textContent('#vs-t')),'料金がないと「料金は？」と聞く: '+await p.textContent('#vs-t'));ok(await p.isVisible('#vs [data-vs="answer"]'),'「答える」ボタンがある');
await p.evaluate(()=>window.__script.push([['f','3000']]));await p.tap('#vs [data-vs="answer"]');await p.waitForTimeout(mode==='claude'?2800:900);
ok(/支払い/.test(await p.textContent('#vs-t')),'料金のあと「支払いは？」と聞く: '+await p.textContent('#vs-t'));
await p.evaluate(()=>window.__script.push([['f','カード']]));await p.tap('#vs [data-vs="answer"]');await p.waitForTimeout(mode==='claude'?2800:900);
ok(/カード"? ?aria-pressed="true"|aria-pressed="true"[^>]*>カード/.test(await p.innerHTML('#vs-rows')),'答えた支払い カード が入る');
ok(/¥3,000/.test(await p.textContent('#vs-rows')),'答えた料金 ¥3,000 が入る');
console.log('errors',p.E);await p.context().close()}
console.log('== 使えないとき');
{const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await ctx.newPage().then(async pg=>{await pg.addInitScript(AUTOF);await pg.addInitScript(SHIM);return pg});
 await p.addInitScript(()=>{window.SpeechRecognition=class{start(){setTimeout(()=>{this.onerror({error:'service-not-allowed'});this.onend()},50)}stop(){}abort(){}};window.webkitSpeechRecognition=undefined});
 await p.goto((process.env.APP_URL||'file://'+__dirname+'/../index.html'));await p.waitForTimeout(600);await p.tap('#vbtn');await p.waitForTimeout(500);
 ok(!(await p.isVisible('#vs'))&&await p.evaluate(()=>document.activeElement.id)==='say','使えないときは入力欄が開き、キーボードのマイクへ');ok(/キーボードのマイク/.test(await p.textContent('#toast-t')),'知らせが出る');await ctx.close()}
await b.close()})();
