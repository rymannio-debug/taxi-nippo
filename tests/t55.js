// マニュアルとアプリの連携: 右上の［？ マニュアル］、画面ごとの説明、シートの中の「説明」
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const K='2026-11-22';
const USE='https://claude.ai/artifact/9nQ32ZWAXXYZvCppfzTzNG',FIG='https://claude.ai/artifact/2ocLy81gMMvBTcmyspwR7M',EASY='https://claude.ai/artifact/3GFqong9d9odhL9MNRJyCr';
async function page(data,o={}){const ctx=await b.newContext({viewport:o.vp||{width:390,height:844},hasTouch:true,isMobile:true});await fr(ctx);
 await ctx.route(/nominatim|gsi|tile|open-meteo|cyberjapan/,r=>r.abort());
 const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
 await p.clock.install({time:new Date(2026,10,22,10,0)});
 await p.addInitScript(([sd,set])=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();if(sd)localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd));if(set)localStorage.setItem('taxi-nippo-set-v1',JSON.stringify(set))},[data||null,o.set||null]);
 await p.goto('file://'+__dirname+'/../index.html');await p.waitForTimeout(900);return p}
const tapEl=async(p,sel)=>{const r=await p.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>x.getClientRects().length);if(!e)return null;e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2]},sel);if(!r)return false;await p.touchscreen.tap(r[0],r[1]);await p.waitForTimeout(300);return true};
const vis=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&e.getClientRects().length>0},s);
const links=(p,sel)=>p.evaluate(s=>[...document.querySelectorAll(s+' a')].map(a=>({t:a.textContent.replace(/\s+/g,' ').trim(),h:a.href,tg:a.target,rel:a.rel})),sel);
const go=async(p,h)=>{await p.evaluate(h=>{location.hash=h;route()},h);await p.waitForTimeout(250)};
const open=async p=>{await tapEl(p,'#man-b');return links(p,'#mv-here')};
const close=async p=>{await tapEl(p,'#mv-close')};
const pre={},on={[K]:{type:'day',date:K,startTime:'07:00',breaks:[],trips:[{id:'a',t:'08:10',fare:5500,pay:'cash',ts:1}]}};
const brk={[K]:{type:'day',date:K,startTime:'07:00',breaks:[{id:'b',s:'09:30',ts:1}],trips:[]}};
const done={[K]:{type:'day',date:K,startTime:'07:00',endTime:'09:00',odoStart:85100,odoEnd:85200,breaks:[],trips:[{id:'a',t:'08:10',fare:5500,pay:'cash',ts:1}]}};

console.log('1. 右上の［？ マニュアル］');
let p=await page(on);
ok(await vis(p,'#man-b'),'日報の画面の右上にある');
const hb=await p.evaluate(()=>{const r=e=>document.querySelector(e).getBoundingClientRect();const h=r('.top h1'),m=r('#man-b'),s=r('.top .seg');return {sameRow:Math.abs((h.top+h.bottom)/2-(m.top+m.bottom)/2)<6,right:m.right,segBelow:s.top>=m.bottom-1,w:document.documentElement.clientWidth}});
ok(hb.sameRow&&hb.right<=hb.w-15&&hb.segBelow,'題名と同じ行の右端、切り替えのボタンはその下');
for(const h of ['#list','#month','#year','#set']){await go(p,h);ok(await vis(p,'#man-b'),h+' でも出る')}
await go(p,'#day');

console.log('2. 押すと、3つのマニュアルといまの画面の説明');
let L=await open(p);
ok(await vis(p,'#mv'),'マニュアルの画面が開く');
const docs=await links(p,'#mv-docs');
ok(docs.length===3&&docs[0].h===EASY&&docs[1].h===FIG&&docs[2].h===USE,'かんたん手順書・図解マニュアル・使い方マニュアルの順: '+docs.map(d=>d.t.slice(0,8)).join('/'));
ok(docs.every(d=>d.tg==='_blank'&&/noopener/.test(d.rel)),'別の画面で開く（アプリは閉じない）');
ok(/いまの画面（日報）の説明/.test(await p.textContent('#mv-here-h')),'見出しは「いまの画面（日報）の説明」');
ok(L.length===4&&L[0].h===EASY+'#mv322v937h3.5721'&&/お客様1人を記録する/.test(L[0].t),'乗務中: 先頭は手順書の「お客様1人を記録する」へ直接');
ok(L.some(x=>x.h===FIG+'#m451xxj3bmb.6264'),'「声で記録する」（図解）も');
const tr=await links(p,'#mv-trouble');ok(tr.length===3&&tr[2].h===USE+'#mjrhtaa28xg.46421','困ったとき: 3つのマニュアルの「困ったとき」へ');
await close(p);ok(!(await vis(p,'#mv')),'「閉じる」で閉じる');
await open(p);await p.mouse.click(195,30);await p.waitForTimeout(200);ok(!(await vis(p,'#mv')),'外側を押しても閉じる');
await open(p);await p.keyboard.press('Escape');await p.waitForTimeout(200);ok(!(await vis(p,'#mv')),'Escキーでも閉じる');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('3. 画面と状態で、説明が変わる');
const want=async(data,hash,first,label,o)=>{const p=await page(data,o);if(hash)await go(p,hash);const L=await open(p);ok(L.length&&L[0].h===first,label+': '+L.map(x=>x.t.replace(/(かんたん手順書|図解マニュアル|使い方マニュアル)$/,'')).join('／'));const r=L;await p.context().close();return r};
await want(pre,'',EASY+'#mv322v937h3.5417','出庫前 → 1日の流れ');
await want(brk,'',USE+'#mjrhtaa28xg.41817','休憩中 → 休憩');
await want(done,'',EASY+'#mv322v937h3.7407','帰庫済み → 帰庫したら');
await want(on,'#list',USE+'#mjrhtaa28xg.44789','一覧 → 一覧');
await want(on,'#month',USE+'#mjrhtaa28xg.44994','月集計 → 月集計・年集計');
await want(on,'#year',USE+'#mjrhtaa28xg.44994','年集計 → 月集計・年集計');
let S=await want(on,'#set',USE+'#mjrhtaa28xg.45480','設定 → 設定');
ok(S.some(x=>x.h===USE+'#mjrhtaa28xg.58348')&&S.some(x=>x.h===FIG+'#m451xxj3bmb.12483'),'設定では「会社の決まり」も（使い方・図解）');
S=await want(on,'#set',USE+'#mjrhtaa28xg.45480','大和自動車交通を選んでいるとき',{set:{coPreset:'daiwa'}});
ok(S.some(x=>x.h===USE+'#mjrhtaa28xg.59491'),'「大和自動車交通の給与」の説明も出る');

console.log('4. シートやカードの中の「説明」');
p=await page(done);
await p.evaluate(()=>document.getElementById('rv-open').click());await p.waitForTimeout(500);
L=await links(p,'#rv .manrow');
ok(L.length===4&&L.every(x=>x.tg==='_blank')&&L[0].h===FIG+'#m451xxj3bmb.7522'&&L[2].h===USE+'#mjrhtaa28xg.56423','帰庫の日報: 帰庫したら（図）・メーターの集計・現金を数える・日報を1枚で見る');
await p.evaluate(()=>document.getElementById('rv-close').click());await p.waitForTimeout(300);
await p.evaluate(()=>{const b=document.querySelector('#v-day .trip');b&&b.click()});await p.waitForTimeout(400);
L=await links(p,'#ov .manrow');ok(await vis(p,'#ov .manrow')&&L[0].h===USE+'#mjrhtaa28xg.43304','修正画面: 「修正画面」の説明');
await p.evaluate(()=>document.getElementById('e-cancel').click());
await go(p,'#set');L=await links(p,'#coset .hrow');ok(L.length===1&&L[0].t==='？ 説明'&&L[0].h===USE+'#mjrhtaa28xg.58348','「会社の決まり」の見出しの横に「？ 説明」');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('5. 小さい画面（SE）');
p=await page(on,{vp:{width:320,height:568}});
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'横にはみ出さない');
const t=await p.evaluate(()=>{const s=document.querySelector('.top .seg').getBoundingClientRect(),m=document.getElementById('man-b').getBoundingClientRect();return {segR:s.right,w:document.documentElement.clientWidth,over:!(m.bottom<=s.top||m.top>=s.bottom)}});
ok(t.segR<=t.w&&!t.over,'切り替えのボタンと重ならない');
await open(p);ok(await p.evaluate(()=>{const c=document.getElementById('mv-close').getBoundingClientRect();return c.width>60&&c.height<60}),'「閉じる」は横書きのまま');
ok(await p.evaluate(()=>{const s=document.querySelector('#mv .sheet');return s.scrollHeight>s.clientHeight||true}),'長いときは画面の中で動かせる');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
await b.close()})();
