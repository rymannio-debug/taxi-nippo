// AIに聞く: Claude版は Claude、単体版はキーがあれば Gemini（無料枠）、なければ近い章を出すだけ。どちらも答えと根拠の章へのリンクを出す
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const PUB='https://rymannio-debug.github.io/taxi-nippo/manual/';
const APP=(process.env.APP_URL||'file://'+__dirname+'/../index.html');
async function page(fake){const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await fr(ctx);
  await ctx.route(/nominatim|gsi|tile|open-meteo|cyberjapan/,r=>r.abort());
  const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
  if(fake)await p.addInitScript(mode=>{
    // Claude版のふり: sample だけ使える。届いた質問を残し、決まった答えを少しずつ返す
    window.__asked=[];
    const sample=(input,o)=>new Promise((res,rej)=>{window.__asked.push({input,o});
      if(mode==='deny')return rej({code:'not_granted',message:'no'});
      const ans='設定の「会社の決まり」で入れます。\n1. 上の「設定」を押す\n2. 「足切り 円」に額を入れる\n[[tsukaikata#co]] [[zukai#co]] [[easy#nope]]';
      let i=0;const t=setInterval(()=>{if(o.signal&&o.signal.aborted){clearInterval(t);return rej({code:'cancelled',message:'x',text:ans.slice(0,i)})}
        i=Math.min(ans.length,i+12);o.onText&&o.onText({text:ans.slice(0,i),delta:''});if(i>=ans.length){clearInterval(t);res({text:ans,truncated:false})}},mode==='slow'?400:20)});
    window.claude={use:n=>Promise.resolve(n==='sample'?sample:null)}},fake);
  await p.goto(APP);await p.waitForTimeout(900);return p}
const open=async p=>{await p.locator('#man-b').tap();await p.waitForTimeout(300)};

console.log('1. 単体版: キーがなければ、近い章を出すだけ');
let p=await page(null);const G=[];
await p.context().route(/generativelanguage\.googleapis\.com/,async r=>{const u=r.request().url(),k=r.request().headers()['x-goog-api-key'];G.push({u,k,body:r.request().postData()});
  if(k==='bad')return r.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:{code:400,message:'API key not valid. Please pass a valid API key.',status:'INVALID_ARGUMENT'}})});
  if(k==='busy')return r.fulfill({status:429,contentType:'application/json',body:JSON.stringify({error:{code:429,message:'quota',status:'RESOURCE_EXHAUSTED'}})});
  if(k==='quota'&&/-latest:|omni/.test(u))return r.fulfill({status:429,contentType:'application/json',body:JSON.stringify({error:{code:429,message:'quota limit: 0',status:'RESOURCE_EXHAUSTED'}})});
  if(k==='crowd'&&/-latest:/.test(u))return r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:503,message:'This model is currently experiencing high demand.',status:'UNAVAILABLE'}})});
  if(k==='old'&&/-latest:/.test(u))return r.fulfill({status:404,contentType:'application/json',body:'{"error":{"code":404}}'});
  if(/\/models\?/.test(u))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({models:[{name:'models/gemini-omni-9.9-flash',supportedGenerationMethods:['generateContent']},{name:'models/gemma-9-it',supportedGenerationMethods:['generateContent']},{name:'models/gemini-9.9-flash-preview',supportedGenerationMethods:['generateContent']},{name:'models/gemini-9.0-flash-lite',supportedGenerationMethods:['generateContent']},{name:'models/gemini-9.0-flash',supportedGenerationMethods:['generateContent']},{name:'models/gemini-9.0-flash-image',supportedGenerationMethods:['generateContent']},{name:'models/text-embedding',supportedGenerationMethods:['embedContent']}]})});
  r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({candidates:[{content:{parts:[{text:'**設定**の「会社の決まり」で入れます。\n[[tsukaikata#co]]'}]},finishReason:'STOP'}]})})});
await open(p);
ok(await p.locator('#ai').isVisible(),'「AIに聞く」が出る');
ok(/設定でGeminiのキー/.test(await p.textContent('#ai-note')),'キーを入れるとAIが答える、と案内する');
await p.locator('#ai-q').fill('足切りの額はどこで入れるの？');await p.locator('#ai-go').tap();await p.waitForTimeout(800);
let L=await p.evaluate(()=>[...document.querySelectorAll('#ai-a a')].map(a=>a.getAttribute('href')));
ok(L.length>=2&&L.length<=4&&L.includes('manual/tsukaikata.html#co')&&!G.length,'近い章を出す（Geminiには送らない）: '+L.join(' '));
console.log('2. 単体版: 設定でキーを入れる');
await p.locator('#mv-close').tap();await p.evaluate(()=>{location.hash='#set'});await p.waitForTimeout(400);
ok(await p.locator('#aiset').isVisible(),'設定に「AIに聞く（Gemini・無料）」');
await p.locator('#ai-key').fill('bad');await p.locator('#ai-key-save').tap();await p.waitForTimeout(500);
ok(/使えませんでした/.test(await p.textContent('#ai-key-st'))&&!(await p.evaluate(()=>localStorage.getItem('taxi-nippo-ai-key'))),'使えないキーは保存しない');
await p.locator('#ai-key').fill('good');await p.locator('#ai-key-save').tap();await p.waitForTimeout(500);
ok(/保存しました/.test(await p.textContent('#ai-key-st'))&&await p.evaluate(()=>localStorage.getItem('taxi-nippo-ai-key'))==='good','使えるキーは保存する（この端末だけ）');
ok(G.length===2&&G.every(g=>!/key=/.test(g.u)),'キーはアドレスに入れず、ヘッダーで送る');
G.length=0;await open(p);await p.locator('#ai-q').fill('足切りの額はどこで入れるの？');await p.locator('#ai-go').tap();await p.waitForTimeout(800);
let A=await p.evaluate(()=>({t:document.getElementById('ai-a').innerText,L:[...document.querySelectorAll('#ai-a a')].map(a=>a.getAttribute('href'))}));
ok(/会社の決まり/.test(A.t)&&!/\*\*|\[\[/.test(A.t)&&A.L.length===1&&A.L[0]==='manual/tsukaikata.html#co','Geminiの答えと根拠の章（記号は消す）');
const sent=G[0]&&JSON.parse(G[0].body).contents[0].parts[0].text;
ok(sent&&/足切り/.test(sent)&&/\[\[tsukaikata#co\]\]/.test(sent)&&!/85100|5500/.test(sent),'質問とマニュアルだけを送る（記録は送らない）');
console.log('3. 単体版: 回数の上限・古い名前・消す');
await p.evaluate(()=>localStorage.setItem('taxi-nippo-ai-key','busy'));await p.locator('#ai-go').tap();await p.waitForTimeout(800);
ok(/無料で使える回数/.test(await p.textContent('#ai-a'))&&await p.locator('#ai-a a').count()>0,'上限のときは、そう伝えて近い章を出す');
await p.evaluate(()=>localStorage.setItem('taxi-nippo-ai-key','old'));G.length=0;await p.locator('#ai-go').tap();await p.waitForTimeout(800);
ok(/会社の決まり/.test(await p.textContent('#ai-a'))&&G.some(g=>/gemini-9\.0-flash-lite:generateContent/.test(g.u))&&await p.evaluate(()=>localStorage.getItem('taxi-nippo-ai-model'))==='gemini-9.0-flash-lite','名前が使えないときは、番号付きの Flash-Lite を選び、覚える');
G.length=0;await p.locator('#ai-go').tap();await p.waitForTimeout(800);ok(G.length===1&&/gemini-9\.0-flash-lite:/.test(G[0].u),'次からは覚えたモデルに先に頼む');
await p.evaluate(()=>localStorage.removeItem('taxi-nippo-ai-model'));
await p.evaluate(()=>localStorage.setItem('taxi-nippo-ai-key','quota'));G.length=0;await p.locator('#ai-go').tap();await p.waitForTimeout(800);
ok(/会社の決まり/.test(await p.textContent('#ai-a'))&&G.some(g=>/gemini-9\.0-flash-lite:generateContent/.test(g.u)),'回数の上限(429)のときも、ほかの Flash に頼み直す');
ok(!G.some(g=>/omni|gemma|preview/.test(g.u)&&/generateContent/.test(g.u)),'omni・gemma・preview には頼まない');
await p.evaluate(()=>localStorage.removeItem('taxi-nippo-ai-model'));
await p.evaluate(()=>localStorage.setItem('taxi-nippo-ai-key','crowd'));G.length=0;await p.locator('#ai-go').tap();await p.waitForTimeout(800);
ok(/会社の決まり/.test(await p.textContent('#ai-a'))&&G.some(g=>/gemini-9\.0-flash-lite:generateContent/.test(g.u)),'混んでいる(503)ときは、ほかの Flash に頼み直す');
await p.locator('#mv-close').tap();await p.evaluate(()=>{location.hash='#set'});await p.waitForTimeout(300);
await p.locator('#ai-key-del').tap();ok(!(await p.evaluate(()=>localStorage.getItem('taxi-nippo-ai-key')))&&(await p.inputValue('#ai-key'))==='','「キーを消す」で消える');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('4. Claude版: 聞くと、答えと根拠の章へのリンク');
p=await page('ok');await open(p);
ok(await p.locator('#ai').isVisible()&&!(await p.locator('#aiset').isVisible()),'マニュアルの画面のいちばん上に「AIに聞く」（Geminiの設定は出ない）');
await p.locator('#ai-q').fill('足切りの額はどこで入れるの？');await p.locator('#ai-go').tap();await p.waitForTimeout(1500);
const a=await p.evaluate(()=>({t:document.getElementById('ai-a').innerText,links:[...document.querySelectorAll('#ai-a a')].map(x=>({h:x.getAttribute('href'),t:x.textContent,tg:x.target}))}));
ok(/会社の決まり/.test(a.t)&&!/\[\[/.test(a.t),'答えが出て、[[…]] の印は文の中に残らない');
ok(a.links.length===2&&a.links[0].h===PUB+'tsukaikata.html?from=claude#co'&&a.links[1].h===PUB+'zukai.html?from=claude#co'&&a.links.every(x=>x.tg==='_blank'),'根拠の章へのリンク（ない章は出さない）: '+a.links.map(x=>x.h).join(' '));
const asked=await p.evaluate(()=>window.__asked[0]);
ok(asked&&/足切り/.test(asked.input)&&/\[\[tsukaikata#co\]\]/.test(asked.input)&&asked.input.length<14000,'質問と、近い章（会社の決まり）だけを渡す（'+(asked&&asked.input.length)+'字）');
ok(asked&&asked.o.modelTier==='quick','早く答える設定');
ok(await p.locator('#ai-go').isEnabled()&&await p.locator('#ai-stop').isHidden(),'終わると「聞く」に戻る');

console.log('5. Claude版: 止める');
await p.evaluate(()=>{window.__asked=[]});
await p.context().close();p=await page('slow');await open(p);
await p.locator('#ai-q').fill('休憩の取り消し');await p.locator('#ai-go').tap();await p.waitForTimeout(500);
ok(await p.locator('#ai-stop').isVisible(),'考えているあいだは「止める」');
await p.locator('#ai-stop').tap();await p.waitForTimeout(700);
ok(/止めました/.test(await p.textContent('#ai-a')),'止めると「止めました」');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('6. Claude版: 断られたら隠す');
p=await page('deny');await open(p);await p.locator('#ai-q').fill('バックアップ');await p.locator('#ai-q').press('Enter');await p.waitForTimeout(600);
ok(await p.locator('#ai').isHidden(),'使えないと答えが来たら、欄を隠す');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('7. 小さい画面（SE）');
p=await page('ok');await p.setViewportSize({width:320,height:568});await open(p);
ok(await p.evaluate(()=>{const s=document.querySelector('#mv .sheet');return s.scrollWidth<=s.clientWidth+1}),'横にはみ出さない');
const hb=await p.evaluate(()=>document.getElementById('ai-go').getBoundingClientRect().height);ok(hb>=44,'「聞く」は押しやすい大きさ '+hb);
await p.context().close();await b.close()})();
