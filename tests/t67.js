// 分析の「AIのアドバイス」: 数字のまとめだけを AI に渡し、傾向・改善点・気をつけることと、根拠のカードへのボタンを出す
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const APP=(process.env.APP_URL||'file://'+__dirname+'/../index.html');
const day=(k,f)=>({type:'day',date:k,startTime:'08:00',endTime:'16:00',breaks:[],trips:[0,1,2].map(i=>({id:k+i,t:(9+i*2)+':00',tin:(9+i*2)+':00',tout:(9+i*2)+':40',fare:f,pay:'cash',ts:i,from:'府中市宮町1-2-3',to:'調布市布田',src:'wait',note:'ひみつのメモ'}))});
const D={};['2026-11-03','2026-11-10','2026-11-17'].forEach(k=>D[k]=day(k,3000));['2026-10-13','2026-10-20','2026-10-27'].forEach(k=>D[k]=day(k,2000));
const ANS='【傾向】\n- 火曜の朝は時間あたりが高い [[a1]]\n- 前の期間より時間あたりが上がった [[a0]]\n【改善点】\n- 府中市で付け待ちを続ける [[a2]]\n【気をつけること】\n- 記録の件数がまだ少ない [[a9]]';
async function page(o){const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await fr(ctx);
  await ctx.route(/nominatim|gsi|tile|open-meteo|cyberjapan/,r=>r.abort());const G=[];
  await ctx.route(/generativelanguage\.googleapis\.com/,r=>{G.push(r.request().postData()||'');r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({candidates:[{content:{parts:[{text:ANS}]},finishReason:'STOP'}]})})});
  const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;p.G=G;
  await p.clock.install({time:new Date(2026,10,22,19,0)});
  await p.addInitScript(([sd,o])=>{if(o.claude){window.__asked=[];const sample=(input,op)=>{window.__asked.push(input);op&&op.onText&&op.onText({text:'【傾向】\n- 書いて',delta:''});return new Promise(r=>setTimeout(()=>r({text:o.ans,truncated:false}),300))};window.claude={use:n=>Promise.resolve(n==='sample'?sample:null)}}
    if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd));localStorage.setItem('taxi-nippo-ui-v1',JSON.stringify({mview:'ana'}));if(o.key)localStorage.setItem('taxi-nippo-ai-key',o.key)},[D,Object.assign({ans:ANS},o)]);
  await p.goto(APP);await p.waitForTimeout(800);await p.evaluate(()=>{location.hash='#month';route()});await p.waitForTimeout(500);return p}

console.log('1. iPhone版・キーなし');
let p=await page({});ok(/キーを入れると/.test(await p.textContent('#m-a10'))&&!(await p.$('#m-a10 [data-adv="go"]')),'キーの入れ方を案内するだけ');ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('2. iPhone版・Geminiのキーあり');
p=await page({key:'AQ.test'});
ok(await p.evaluate(()=>[...document.querySelectorAll('#m-ana>.card')].slice(0,2).map(c=>c.id).join())==='m-a8,m-a10','要点の次にAIのアドバイス');
await p.locator('#m-a10 [data-adv="go"]').tap();await p.waitForTimeout(1200);
const out=await p.evaluate(()=>{const o=document.getElementById('m-adv');return {t:o.innerText,h:[...o.querySelectorAll('.ctitle')].map(x=>x.textContent),li:o.querySelectorAll('li').length,refs:[...o.querySelectorAll('[data-akey]')].map(x=>x.dataset.akey)}});
ok(out.h.join()==='傾向,改善点,気をつけること'&&out.li===4&&!/\[\[/.test(out.t),'見出し3つと箇条書き（印は文に残らない）');
ok(out.refs.join()==='1,0,2,9','根拠のカードへのボタン: '+out.refs.join());
const pr=p.G[0]?JSON.parse(p.G[0]).contents[0].parts[0].text:'';
ok(/時間あたり営収 ¥1,125/.test(pr)&&/前の22日間/.test(pr)&&/曜日×時間帯/.test(pr)&&/府中市 9回/.test(pr),'数字のまとめを渡す（時間あたり・前の期間・曜日×時間帯・市区町村）');
ok(!/宮町|1-2-3|ひみつのメモ/.test(pr),'詳しい住所とメモは渡さない');
await p.locator('#m-a10 [data-akey="1"]').tap();await p.waitForTimeout(500);
ok(await p.evaluate(()=>!document.querySelector('#m-a1 .abody').hidden),'ボタンでそのカードの表が開く');
ok(/アドバイスの|火曜の朝/.test(await p.textContent('#m-a10')),'開いたあともアドバイスは残る');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('3. Claude版（Claudeが書く、書いているあいだも見える）');
p=await page({claude:true});
await p.locator('#m-a10 [data-adv="go"]').tap();await p.waitForTimeout(100);
ok(/書いて/.test(await p.textContent('#m-adv'))&&await p.locator('#m-a10 [data-adv="stop"]').isVisible(),'書いているあいだは途中の文と「止める」');
await p.waitForTimeout(600);ok(/府中市で付け待ち/.test(await p.textContent('#m-adv')),'書き終わると全部出る');
ok(await p.evaluate(()=>window.__asked.length===1&&!/ひみつのメモ/.test(window.__asked[0])),'Claudeにもメモは渡さない');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
await b.close()})();
