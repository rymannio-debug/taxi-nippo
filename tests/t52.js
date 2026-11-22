// 本物の指のタップで押せるか: 小さい画面で下の段（休憩｜乗車｜話す）が乗車ボタンをふさいでいた不具合の再発防止
(async()=>{const {chromium}=require('./pw');const b=await chromium.launch();const out=[];
const states={idle:[],on:[{id:'a',t:'07:20',tin:'07:20',ts:1,fare:null,pay:'',open:true}]};
for(const vp of [{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:430,height:932}]){
 for(const st of ['idle','on','done','brk','pad','pay']){
  const ctx=await b.newContext({viewport:vp,hasTouch:true,isMobile:true});await ctx.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());
  const p=await ctx.newPage();await p.clock.install({time:new Date(2026,10,21,7,30)});
  await p.addInitScript(()=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify({'2026-11-21':{type:'day',date:'2026-11-21',startTime:'06:55',odoStart:85100,breaks:[],trips:[{id:'x',t:'07:00',tin:'07:00',tout:'07:10',fare:1500,pay:'cash',ts:1}]}}))});
  await p.goto((process.env.APP_URL||'file://'+__dirname+'/../index.html'));await p.waitForTimeout(700);
  const T=async id=>{const r=await p.evaluate(i=>{const e=document.getElementById(i).getBoundingClientRect();return [e.left+e.width/2,e.top+e.height/2]},id);await p.touchscreen.tap(r[0],r[1]);await p.waitForTimeout(500)};
  if(st==='on'||st==='done'||st==='pad'||st==='pay'){await T('ride-b');await p.clock.runFor(10*60000)}
  if(st==='done'||st==='pad'||st==='pay'){await T('ride-b');}
  if(st==='pay'){for(const k of ['1','5','00'])await p.evaluate(k=>[...document.querySelectorAll('#np [data-k="'+k+'"]')].find(x=>x.getClientRects().length).click(),k);await p.waitForTimeout(600);await p.evaluate(()=>document.querySelector('#np-kf [data-pk="more"]').click());await p.waitForTimeout(600)}
  if(st==='brk'){await T('d-brk')}
  const bad=await p.evaluate(()=>{const sel='#ride-b,#d-brk,#vbtn,#np button,#bar button,#toast button,#np-pay button';const r=[];
    document.querySelectorAll(sel).forEach(e=>{if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')return;const q=e.getBoundingClientRect();if(q.bottom<0||q.top>innerHeight)return;
      for(const [fx,fy] of [[.5,.5],[.2,.5],[.8,.5]]){const x=q.left+q.width*fx,y=q.top+q.height*fy;if(y<0||y>=innerHeight||x<0||x>=innerWidth)continue;const t=document.elementFromPoint(x,y);if(t&&t!==e&&!e.contains(t)){r.push((e.id||e.dataset.k||e.dataset.pk||e.textContent.trim().slice(0,6))+'←'+(t.id||t.className||t.tagName));break}}});return r});
  out.push(vp.width+'x'+vp.height+' '+st+': '+(bad.length?bad.join(', '):'OK'));
  await ctx.close()}}
const ng=out.filter(x=>!/: OK$/.test(x));console.log((ng.length?'  ✗ ':'  ✓ ')+'固定ボタンがほかの要素に隠れていない（4画面×6状態） '+ng.join(' / '));await b.close()})();
(async()=>{const {chromium}=require('./pw');const b=await chromium.launch();
for(const vp of [{width:320,height:568},{width:375,height:667},{width:390,height:844}]){
const ctx=await b.newContext({viewport:vp,hasTouch:true,isMobile:true});await ctx.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());
const p=await ctx.newPage();await p.clock.install({time:new Date(2026,10,21,7,30)});
await p.addInitScript(()=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify({'2026-11-21':{type:'day',date:'2026-11-21',startTime:'06:55',odoStart:85100,breaks:[],trips:[]}}))});
await p.goto((process.env.APP_URL||'file://'+__dirname+'/../index.html'));await p.waitForTimeout(700);
const tapId=async id=>{const r=await p.evaluate(i=>{const e=document.getElementById(i).getBoundingClientRect();return [e.left+e.width/2,e.top+e.height/2]},id);await p.touchscreen.tap(r[0],r[1]);await p.waitForTimeout(500)};
await tapId('ride-b');const s1=await p.evaluate(()=>document.getElementById('ride').dataset.st);
await p.clock.runFor(10*60000);await tapId('ride-b');const s2=await p.evaluate(()=>document.getElementById('ride').dataset.st+'/'+!document.getElementById('np').hidden);
console.log(((s1==='on'&&s2==='done/true')?'  ✓ ':'  ✗ ')+vp.width+'x'+vp.height+': 指で「乗車」→「降車」→ 料金の数字キー（'+s1+' → '+s2+'）');
await ctx.close()}
await b.close()})();
