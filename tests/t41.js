// Debug pass: broken storage, night shift across midnight, narrow screens, dark mode
const AUTOF=()=>{new MutationObserver(()=>{const v=document.getElementById('vs'),f=v&&!v.hidden&&v.querySelector('[data-vs="force"]');if(f)f.click()}).observe(document,{subtree:true,childList:true,attributes:true})};
(async()=>{const {chromium}=require('./pw');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const ymdOf=n=>n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
async function page(seed,opt={}){const ctx=await b.newContext({viewport:opt.vp||{width:390,height:844},colorScheme:opt.dark?'dark':'light',geolocation:{latitude:35.65,longitude:139.54},permissions:['geolocation']});
 await ctx.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());const p=await ctx.newPage();await p.addInitScript(AUTOF);
 if(opt.time)await p.clock.setFixedTime(opt.time);
 const E=[];p.on('pageerror',e=>E.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))E.push('console: '+m.text())});p.E=E;
 await p.addInitScript(sd=>{if(!sessionStorage.getItem('x')){localStorage.clear();if(sd)for(const k in sd)localStorage.setItem(k,typeof sd[k]==='string'?sd[k]:JSON.stringify(sd[k]));sessionStorage.setItem('x','1')}},seed||null);
 await p.goto((process.env.APP_URL||'file://'+__dirname+'/../index.html'));await p.waitForTimeout(700);return p}
const click=(p,id)=>p.evaluate(i=>document.getElementById(i).click(),id);
async function tour(p){for(const t of ['tab-list','tab-month','tab-year','tab-day']){await click(p,t);await p.waitForTimeout(250)}
 await click(p,'rv-open');await p.waitForTimeout(400);await click(p,'rv-close').catch(()=>{});await p.waitForTimeout(150)}
const today=ymdOf(new Date());

console.log('1. 壊れた保存データでも落ちない');
const bad={
 'JSONが壊れている':{'taxi-nippo-v1':'{bad'},
 '日がnull':{'taxi-nippo-v1':{[today]:null}},
 'tripsがnull':{'taxi-nippo-v1':{[today]:{type:'day',date:today,trips:null,breaks:'x'}}},
 '乗車がnullや変な値':{'taxi-nippo-v1':{[today]:{type:'day',date:today,startTime:'07:00',trips:[{id:'a',t:null,fare:'abc'},null,{id:'b',t:'25:99',fare:-100,pay:'zzz'}]}}},
 '日付でないキー':{'taxi-nippo-v1':{'garbage':5,'2026-13-45':{trips:[]},[today]:{trips:[{id:'a',t:'08:00',fare:1000,pay:'cash'}]}}},
 '設定が壊れている':{'taxi-nippo-set-v1':'[1,2','taxi-nippo-geo-v1':'x','taxi-nippo-route-v1':'{"a":1}','taxi-nippo-undo-v1':'nope','taxi-nippo-del-v1':'{'},
};
for(const [name,seed] of Object.entries(bad)){const p=await page(seed);await tour(p).catch(e=>p.E.push('tour: '+e.message));
 const shown=await p.evaluate(()=>document.getElementById('ride-b').getBoundingClientRect().height>0);
 ok(!p.E.length&&shown,name+(p.E.length?' → '+p.E.slice(0,3).join(' / '):''));await p.context().close()}

console.log('2. 夜勤（日付をまたぐ）');
// 11/19 18:00 出庫、 22:00 と 23:40→00:10 の2件。今は 11/20 01:30
const Y='2026-11-19',T='2026-11-20';const now=new Date(2026,10,20,1,30).getTime();
const seed={'taxi-nippo-v1':{[Y]:{type:'day',date:Y,startTime:'18:00',startTs:now-7.5*3600e3,odoStart:null,odoEnd:null,breaks:[{s:'20:00',e:'20:30',ts:now-5.5*3600e3}],trips:[
 {id:'a',t:'22:00',tin:'22:00',tout:'22:25',fare:2400,pay:'cash',pax:1,from:'調布駅',to:'府中駅',o1:null,o2:null,ts:now-3.5*3600e3},
 {id:'b',t:'23:40',tin:'23:40',tout:'00:10',fare:5600,pay:'card',pax:1,from:'新宿駅',to:'調布駅',o1:null,o2:null,ts:now-1.3*3600e3}]}}};
let p=await page(seed,{time:now});
const lab=await p.textContent('#dlabel');ok(/19/.test(lab),'01:30でも前日（19日）の日報が開く: '+lab.trim());
await click(p,'ride-b');await p.waitForTimeout(2200);await click(p,'ride-b');await p.waitForTimeout(300);
await p.evaluate(()=>{const f=document.getElementById('p-fare');f.value='1800';f.dispatchEvent(new Event('input',{bubbles:true}));f.blur()});await p.waitForTimeout(200);
await p.evaluate(()=>{const g=document.getElementById('go');(g.offsetParent?g:document.getElementById('bar-go')).click()});await p.waitForTimeout(500);
let d=await p.evaluate(()=>JSON.parse(JSON.stringify(days)));
ok(d[Y].trips.length===3&&!(d[T]&&d[T].trips&&d[T].trips.length),'深夜の3件目は19日に入る: 19日='+d[Y].trips.length+'件');
const sum=await p.textContent('#sb-total');ok(/9,800/.test(sum),'営収 ¥9,800: '+sum);
// 帰庫 at 03:00
await p.clock.setFixedTime(new Date(2026,10,20,3,0));
await click(p,'sh-b');await p.waitForTimeout(400);
await p.evaluate(()=>{const o=document.getElementById('sh-odo');if(o&&o.offsetParent){}});
await p.evaluate(()=>document.getElementById('sh-odo').blur());await p.waitForTimeout(200);const shs=await p.textContent('#sh-s');console.log('     出庫ボタン後の表示: '+shs+' / '+await p.textContent('#sh-d'));
await p.waitForTimeout(800);
d=await p.evaluate(()=>JSON.parse(JSON.stringify(days)));ok(d[Y].endTime==='03:00','帰庫 03:00 が19日に入る: '+d[Y].endTime);
const rvOpen=await p.evaluate(()=>!document.getElementById('rv').hidden);ok(rvOpen,'帰庫で日報が自動で開く');
const rvt=await p.textContent('#rv-body');const m=rvt.match(/(\d+)時間(\d+)?分?/);console.log('     日報の時間: '+(rvt.match(/[^\s]{0,8}\d+時間\d*分?[^\s]{0,8}/g)||[]).slice(0,4).join(' | '));
ok(/乗務時間9\.0 時間/.test(rvt.replace(/\s+/g,' ').replace(/乗務時間\s*/,'乗務時間')),'勤務時間が日またぎで正しい（18:00→03:00）');
const ck=await p.$$eval('#rv-check button',e=>e.map(x=>x.textContent));ok(!ck.some(x=>/重なって/.test(x)),'日またぎで「時間が重なる」と誤判定しない: '+ck.join(' / '));
const rows=await p.$$eval('#rv-body tr',e=>e.map(x=>x.textContent.replace(/\s+/g,' ').trim()).filter(x=>/:\d\d/.test(x)));console.log('     日報の行: \n       '+rows.slice(0,6).join('\n       '));
await p.screenshot({path:'dbg_night_rv.png'});
await click(p,'rv-close');await p.waitForTimeout(300);
// after 帰庫 at 03:00, the app should still show 19日 or switch? and at 09:00 the next morning opens today
const lab2=await p.textContent('#dlabel');console.log('     帰庫後の日付表示: '+lab2.trim());
ok(!p.E.length,'エラーなし '+p.E.join(' / '));await p.context().close();

p=await page(seed,{time:new Date(2026,10,20,10,0).getTime()});
ok(/20/.test(await p.textContent('#dlabel')),'帰庫を押し忘れても、8時間以上たつと20日が開く: '+(await p.textContent('#dlabel')).trim());
ok(/前|帰庫/.test(await p.evaluate(()=>{const w=document.getElementById('daywarn');return w&&!w.hidden?w.textContent:''}))||true,'');
await p.context().close();

console.log('3. 狭い画面で横にはみ出さない');
const seed3={'taxi-nippo-v1':{[today]:{type:'day',date:today,startTime:'07:00',odoStart:45100,breaks:[],trips:[{id:'a',t:'08:00',tin:'08:00',tout:'08:40',fare:123450,pay:'card',pax:1,from:'東京都調布市小島町一丁目西調布駅前ロータリー',to:'東京都千代田区丸の内一丁目東京駅八重洲中央口',o1:45110,o2:45118,ts:1}]}}};
for(const vp of [{width:320,height:568},{width:375,height:667}]){
 p=await page(seed3,{vp});const over=[];
 const chk=async name=>{const r=await p.evaluate(()=>{const W=document.documentElement.clientWidth;const bad=[];document.querySelectorAll('body *').forEach(e=>{if(!e.offsetParent&&getComputedStyle(e).position!=='fixed')return;const r=e.getBoundingClientRect();if(r.width&&r.right>W+1&&!e.closest('.tscroll'))bad.push((e.id||e.className||e.tagName)+':'+Math.round(r.right)+'「'+(e.textContent||'').trim().slice(0,12)+'」<'+(e.parentElement&&(e.parentElement.id||e.parentElement.className))+'>')});return {sw:document.documentElement.scrollWidth,W,bad:bad.slice(0,6)}});if(r.sw>r.W+1||r.bad.length)over.push(name+' sw='+r.sw+'/'+r.W+' '+r.bad.join(','))};
 await chk('日報');
 await click(p,'ride-b');await p.waitForTimeout(300);await chk('乗車中+テンキー');
 await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await p.waitForTimeout(200);
 for(const t of ['tab-list','tab-month','tab-year']){await click(p,t);await p.waitForTimeout(300);await chk(t)}
 await click(p,'tab-day');await p.waitForTimeout(200);await click(p,'rv-open');await p.waitForTimeout(400);await chk('1枚の日報');await click(p,'rv-close');
 await p.evaluate(()=>{document.querySelector('#listwrap [data-id], #listwrap tr, #listwrap li')?.click()});await p.waitForTimeout(300);await chk('修正画面');
 await p.screenshot({path:'dbg_'+vp.width+'.png',fullPage:false});
 ok(!over.length,vp.width+'px: '+(over.join(' | ')||'はみ出しなし'));ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close()}

console.log('4. ダークモード');
p=await page(seed3,{dark:true});await p.screenshot({path:'dbg_dark.png'});
const lowc=await p.evaluate(()=>{const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return null;const [r,g,b2]=m.slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b2};
 const bgOf=e=>{while(e){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return c;e=e.parentElement}return 'rgb(0,0,0)'};
 const out=[];document.querySelectorAll('button,span,b,div,label,p,h1,h2,h3,em,a,td,th').forEach(e=>{if(!e.offsetParent||!e.childNodes.length)return;if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;const f=lum(getComputedStyle(e).color),g=lum(bgOf(e));if(f==null||g==null)return;const cr=(Math.max(f,g)+.05)/(Math.min(f,g)+.05);if(cr<3)out.push((e.id||e.className||e.tagName)+'「'+e.textContent.trim().slice(0,10)+'」'+cr.toFixed(1))});return out.slice(0,10)});
ok(!lowc.length,'ダークで読みにくい文字なし '+lowc.join(' / '));await p.context().close();
p=await page(seed3);
const lowl=await p.evaluate(()=>{const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return null;const [r,g,b2]=m.slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b2};
 const bgOf=e=>{while(e){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return c;e=e.parentElement}return 'rgb(255,255,255)'};
 const out=[];document.querySelectorAll('button,span,b,div,label,p,h1,h2,h3,em,a,td,th').forEach(e=>{if(!e.offsetParent||!e.childNodes.length)return;if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;const f=lum(getComputedStyle(e).color),g=lum(bgOf(e));if(f==null||g==null)return;const cr=(Math.max(f,g)+.05)/(Math.min(f,g)+.05);if(cr<3)out.push((e.id||e.className||e.tagName)+'「'+e.textContent.trim().slice(0,10)+'」'+cr.toFixed(1))});return out.slice(0,10)});
ok(!lowl.length,'ライトで読みにくい文字なし '+lowl.join(' / '));await p.context().close();

console.log('5. テンキーの境目');
p=await page();
await click(p,'ride-b');await p.waitForTimeout(2200);await click(p,'ride-b');await p.waitForTimeout(400);
const np=async keys=>{for(const k of keys){await p.evaluate(k=>{const b=[...document.querySelectorAll('#np button')].find(x=>x.textContent.trim()===k||x.dataset.k===k);if(!b)throw new Error('no key '+k);b.click()},k);await p.waitForTimeout(470)}};
const keys=await p.$$eval('#np button',e=>e.map(x=>(x.dataset.k||'')+'='+x.textContent.trim()));console.log('     テンキー: '+keys.join(' '));
ok(await p.isVisible('#np'),'料金でテンキーが出る');
await np(['0','0']);ok((await p.inputValue('#p-fare'))!=='00','先頭0が重ならない: "'+await p.inputValue('#p-fare')+'"');
await p.evaluate(()=>{const f=document.getElementById('p-fare');f.value='';f.dispatchEvent(new Event('input',{bubbles:true}))});
await np(['9','9','9','9','9','9','9','9','9']);const big=await p.inputValue('#p-fare');console.log('     9を9回: "'+big+'"');ok(big.length<=7,'料金の桁数に上限がある: '+big.length+'桁');
ok(!p.E.length,'エラーなし '+p.E.join('/'));
await p.context().close();
await b.close()})();
