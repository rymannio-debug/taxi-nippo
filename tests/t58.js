// AIに聞く（Claude版だけ）: 単体版には出ない。Claude版では、質問に近いマニュアルの章を Claude に渡し、答えと章へのリンクを出す
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

console.log('1. 単体版には出ない');
let p=await page(null);await open(p);
ok(await p.locator('#ai').isHidden(),'「AIに聞く」は出ない');ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('2. Claude版: 聞くと、答えと根拠の章へのリンク');
p=await page('ok');await open(p);
ok(await p.locator('#ai').isVisible(),'マニュアルの画面のいちばん上に「AIに聞く」');
await p.locator('#ai-q').fill('足切りの額はどこで入れるの？');await p.locator('#ai-go').tap();await p.waitForTimeout(1500);
const a=await p.evaluate(()=>({t:document.getElementById('ai-a').innerText,links:[...document.querySelectorAll('#ai-a a')].map(x=>({h:x.getAttribute('href'),t:x.textContent,tg:x.target}))}));
ok(/会社の決まり/.test(a.t)&&!/\[\[/.test(a.t),'答えが出て、[[…]] の印は文の中に残らない');
ok(a.links.length===2&&a.links[0].h===PUB+'tsukaikata.html?from=claude#co'&&a.links[1].h===PUB+'zukai.html?from=claude#co'&&a.links.every(x=>x.tg==='_blank'),'根拠の章へのリンク（ない章は出さない）: '+a.links.map(x=>x.h).join(' '));
const asked=await p.evaluate(()=>window.__asked[0]);
ok(asked&&/足切り/.test(asked.input)&&/\[\[tsukaikata#co\]\]/.test(asked.input)&&asked.input.length<14000,'質問と、近い章（会社の決まり）だけを渡す（'+(asked&&asked.input.length)+'字）');
ok(asked&&asked.o.modelTier==='quick','早く答える設定');
ok(await p.locator('#ai-go').isEnabled()&&await p.locator('#ai-stop').isHidden(),'終わると「聞く」に戻る');

console.log('3. 止める');
await p.evaluate(()=>{window.__asked=[]});
await p.context().close();p=await page('slow');await open(p);
await p.locator('#ai-q').fill('休憩の取り消し');await p.locator('#ai-go').tap();await p.waitForTimeout(500);
ok(await p.locator('#ai-stop').isVisible(),'考えているあいだは「止める」');
await p.locator('#ai-stop').tap();await p.waitForTimeout(700);
ok(/止めました/.test(await p.textContent('#ai-a')),'止めると「止めました」');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('4. 断られたら隠す');
p=await page('deny');await open(p);await p.locator('#ai-q').fill('バックアップ');await p.locator('#ai-q').press('Enter');await p.waitForTimeout(600);
ok(await p.locator('#ai').isHidden(),'使えないと答えが来たら、欄を隠す');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('5. 小さい画面（SE）');
p=await page('ok');await p.setViewportSize({width:320,height:568});await open(p);
ok(await p.evaluate(()=>{const s=document.querySelector('#mv .sheet');return s.scrollWidth<=s.clientWidth+1}),'横にはみ出さない');
const hb=await p.evaluate(()=>document.getElementById('ai-go').getBoundingClientRect().height);ok(hb>=44,'「聞く」は押しやすい大きさ '+hb);
await p.context().close();await b.close()})();
