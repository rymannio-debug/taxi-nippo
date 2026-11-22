// AIに聞く（単体版・Gemini）を、実機の「接続を調べる」の結果（2026-11-22 16:23, v87）どおりに Google の返事をまねて、最初から最後まで通す
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const APP=(process.env.APP_URL||'file://'+__dirname+'/../index.html');
const KEY='AQ.'+'x'.repeat(50);
// 実機で見えた返事
const R={
  'gemini-flash-latest':[503,{error:{code:503,message:'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',status:'UNAVAILABLE'}}],
  'gemini-2.5-flash':[404,{error:{code:404,message:'This model models/gemini-2.5-flash is no longer available to new users.',status:'NOT_FOUND'}}],
  'gemini-2.5-flash-lite':[404,{error:{code:404,message:'no longer available',status:'NOT_FOUND'}}],
  'gemma-4-31b-it':[503,{error:{code:503,status:'UNAVAILABLE'}}],
  'gemini-omni-flash-preview':[429,{error:{code:429,message:'You exceeded your current quota',status:'RESOURCE_EXHAUSTED'}}],
  'gemini-omni-1.1-flash':[429,{error:{code:429,status:'RESOURCE_EXHAUSTED'}}],
  'gemini-omni-1.2-flash':[429,{error:{code:429,status:'RESOURCE_EXHAUSTED'}}]};
const NAMES=['gemini-flash-latest','gemini-flash-lite-latest','gemini-2.5-flash','gemma-4-26b-a4b-it','gemma-4-31b-it','gemini-2.5-flash-lite','gemini-3-flash-preview','gemini-3.1-flash-lite-preview','gemini-3.1-flash-lite','gemini-3.5-flash','gemini-3.5-flash-lite','gemini-omni-flash-preview','gemini-omni-1.1-flash','gemini-omni-1.2-flash','text-embedding-005'];
// 3.x の本物の返事の形（thoughtSignature つき、usageMetadata、modelVersion）
const answer=(model,text)=>({candidates:[{content:{parts:[{text,thoughtSignature:'CiQB0e2Kb...'}],role:'model'},finishReason:'STOP',index:0}],usageMetadata:{promptTokenCount:3200,candidatesTokenCount:80,totalTokenCount:3280},modelVersion:model,responseId:'abc'});
async function page(opts={}){const ctx=await b.newContext({viewport:opts.vp||{width:390,height:844},hasTouch:true,isMobile:true,colorScheme:opts.dark?'dark':'light'});await fr(ctx);
  await ctx.route(/nominatim|gsi|tile|open-meteo|cyberjapan/,r=>r.abort());
  const G=[];
  await ctx.route(/generativelanguage\.googleapis\.com/,async r=>{const req=r.request(),u=req.url();
    const cors={'access-control-allow-origin':'*'};
    if(req.method()==='OPTIONS')return r.fulfill({status:200,headers:Object.assign({'access-control-allow-headers':'content-type,x-goog-api-key','access-control-allow-methods':'POST,GET'},cors)});
    const m=(u.match(/models\/([^:?]+):generateContent/)||[])[1];G.push({u,m,key:req.headers()['x-goog-api-key'],body:req.postData()});
    if(/\/models\?/.test(u))return r.fulfill({status:200,headers:cors,contentType:'application/json',body:JSON.stringify({models:NAMES.map(n=>({name:'models/'+n,supportedGenerationMethods:n.startsWith('text-')?['embedContent']:['generateContent','countTokens']}))})});
    await new Promise(z=>setTimeout(z,opts.slow||50));
    if(R[m])return r.fulfill({status:R[m][0],headers:cors,contentType:'application/json',body:JSON.stringify(R[m][1])});
    const p=JSON.parse(req.postData()).contents[0].parts[0].text;
    const q=(p.match(/質問: (.*)/)||[])[1]||'';
    const marks=[...p.matchAll(/\[\[(easy|zukai|tsukaikata)#([\w-]+)\]\]/g)].slice(0,2).map(x=>x[0]).join(' ');
    r.fulfill({status:200,headers:cors,contentType:'application/json',body:JSON.stringify(answer(m,'**「'+q+'」**の答えです。\n1. 上の「設定」を押す\n2. 「会社の決まり」の欄に入れる\n'+marks))})});
  const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))E.push('console: '+m.text())});p.E=E;p.G=G;
  await p.addInitScript(k=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();localStorage.setItem('taxi-nippo-ai-key',k)},opts.nokey?'':KEY);
  await p.goto(APP);await p.waitForTimeout(900);return p}
const ask=async(p,q)=>{if(await p.locator('#mv').isHidden()){await p.locator('#man-b').tap();await p.waitForTimeout(250)}await p.locator('#ai-q').fill(q);await p.locator('#ai-go').tap();
  await p.waitForFunction(()=>!document.getElementById('ai-go').disabled,null,{timeout:40000});await p.waitForTimeout(150);
  return p.evaluate(()=>({t:document.getElementById('ai-a').innerText,links:[...document.querySelectorAll('#ai-a a')].map(a=>a.getAttribute('href'))}))};

console.log('1. 実機と同じ返事で、聞く → 答え');
let p=await page();
let A=await ask(p,'足切りはどこで入れるの？');
const calls=p.G.filter(g=>g.m).map(g=>g.m);
ok(/答えです/.test(A.t)&&!/\*\*|\[\[/.test(A.t),'答えが出る: '+A.t.split('\n')[0].slice(0,40));
ok(A.links.length>=1&&A.links.every(h=>/^manual\/(easy|zukai|tsukaikata)\.html#[\w-]+$/.test(h)),'根拠の章へのボタン '+A.links.join(' '));
ok(calls[0]==='gemini-flash-lite-latest'&&calls.length===1,'最初に gemini-flash-lite-latest に頼み、1回で答える（'+calls.join('→')+'）');
ok(p.G.every(g=>g.key===KEY&&!/key=/.test(g.u)),'キーはヘッダーで送る');
const body=JSON.parse(p.G.find(g=>g.m).body);const pl=body.contents[0].parts[0].text.length;
ok(pl<16000,'送る文の長さ '+pl+'字');
ok(await p.evaluate(()=>localStorage.getItem('taxi-nippo-ai-model'))==='gemini-flash-lite-latest','答えたモデルを覚える');
console.log('2. 続けてもう1回・別の質問');
p.G.length=0;A=await ask(p,'帰庫を押し間違えた');
ok(/答えです/.test(A.t)&&p.G.filter(g=>g.m).length===1,'2回目も1回で答える');
p.G.length=0;A=await ask(p,'休憩を取り消したい');ok(/答えです/.test(A.t),'3回目も答える');
ok(!p.E.length,'エラーなし '+p.E.join(' / '));await p.context().close();

console.log('3. 覚えたモデルが混んだら、次へ');
p=await page();await p.evaluate(()=>localStorage.setItem('taxi-nippo-ai-model','gemini-flash-latest'));await p.reload();await p.waitForTimeout(800);
A=await ask(p,'バックアップの取り方');const c3=p.G.filter(g=>g.m).map(g=>g.m);
ok(/答えです/.test(A.t)&&c3[0]==='gemini-flash-latest'&&c3[1]==='gemini-flash-lite-latest','混んでいたら flash-lite-latest へ（'+c3.join('→')+'）');
ok(!c3.some(m=>/omni|gemma|preview/.test(m)),'omni・gemma・preview には頼まない');
ok(!p.E.length,'エラーなし '+p.E.join(' / '));await p.context().close();

console.log('4. 遅いとき（6秒）・止める');
p=await page({slow:6000});
await p.locator('#man-b').tap();await p.waitForTimeout(250);await p.locator('#ai-q').fill('メーターの入れ方');await p.locator('#ai-go').tap();await p.waitForTimeout(700);
ok(/考えています/.test(await p.textContent('#ai-a'))&&await p.locator('#ai-stop').isVisible(),'待つあいだは「考えています…」と「止める」');
await p.locator('#ai-stop').tap();await p.waitForTimeout(500);
const st4=await p.textContent('#ai-a');ok(/止めました/.test(st4)&&await p.locator('#ai-go').isEnabled(),'止められる: '+st4.slice(0,60));
ok(!p.E.length,'エラーなし '+p.E.join(' / '));await p.context().close();

console.log('5. SE・暗い画面で、答えが読める');
p=await page({vp:{width:320,height:568},dark:true});A=await ask(p,'足切りはどこで入れるの？');
const v=await p.evaluate(()=>{const a=document.getElementById('ai-a'),s=document.querySelector('#mv .sheet'),c=getComputedStyle(a);return {over:s.scrollWidth>s.clientWidth+1,fg:c.color,bg:c.backgroundColor}});
ok(/答えです/.test(A.t)&&!v.over&&v.fg!==v.bg,'答えが出て、横にはみ出さない（文字 '+v.fg+' / 背景 '+v.bg+'）');
ok(!p.E.length,'エラーなし '+p.E.join(' / '));await p.context().close();
await b.close()})();
