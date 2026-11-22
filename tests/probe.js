// WebKit の調べ用: 数字キーを押したときに、どのイベントが届くかを書き出す（ふだんのテストには入らない）
(async()=>{const {chromium}=require('./pw');const b=await chromium.launch();
const today=(()=>{const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')})();
const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:process.env.MOBILE==='1'});
const p=await ctx.newPage();p.on('console',m=>console.log('console:',m.text()));p.on('pageerror',e=>console.log('pageerror:',e.message));
await p.addInitScript(s=>{if(!sessionStorage.getItem('x')){localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(s));localStorage.setItem('taxi-nippo-ui-v1',JSON.stringify({odo:'ride'}));sessionStorage.setItem('x','1')}
  ['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup','click','focusin','focusout'].forEach(ev=>document.addEventListener(ev,e=>{const t=e.target;window.__ev=(window.__ev||[]);window.__ev.push(ev+':'+(t.id||t.dataset&&t.dataset.k||t.tagName)+(e.defaultPrevented?'(pd)':''))},true))},{[today]:{type:'day',date:today,trips:[{id:'z',t:'08:00',fare:1000,pay:'cash',pax:1,o1:45200,o2:45210,km:10}],breaks:[],startTime:'07:00',odoStart:45100}});
await p.goto(process.env.APP_URL);await p.waitForTimeout(900);
const dump=async l=>{console.log(l,JSON.stringify(await p.evaluate(()=>{const r={ev:(window.__ev||[]).join(' '),np:!document.getElementById('np').hidden,v:document.getElementById('np-v').textContent,act:document.activeElement&&document.activeElement.id,boot:!document.getElementById('boot').hidden};window.__ev=[];return r})))};
await dump('start');
await p.tap('#ride-b');await p.waitForTimeout(700);await dump('after ride-b tap');
await p.tap('#np [data-k="2"]:visible');await p.waitForTimeout(200);await dump('after key 2 (p.tap)');
await p.locator('#np [data-k="3"]:visible').click();await p.waitForTimeout(200);await dump('after key 3 (click)');
const r=await p.evaluate(()=>{const e=document.querySelector('#np [data-k="4"]');const q=e.getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2]});
await p.touchscreen.tap(r[0],r[1]);await p.waitForTimeout(200);await dump('after key 4 (touchscreen)');
await b.close()})();
