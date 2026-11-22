// 訪日客を細かく: 言葉（前回と同じを最初から）・地域・旅の形・支払い・やり取り、声で「訪日 中国語 ホテルから」、修正画面・一覧・CSV、分析の「訪日客」「乗せた場所・行き先の種類」
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const APP=(process.env.APP_URL||'file://'+__dirname+'/../index.html');
const K='2026-11-22';
const mk=(id,t,fare,from,to,seg,ib,km)=>Object.assign({id,t,fare,pay:'card',ts:+id.replace(/\D/g,'')||1,from,to,km},seg?{seg}:{},ib?{ib}:{});
const data={[K]:{type:'day',date:K,startTime:'07:00',breaks:[],trips:[
  mk('a1','08:10',5200,'帝国ホテル','羽田空港第3ターミナル','inbound',{lang:'zh',reg:'cn',party:'family',pay:'alipay',x:['trans']},18.2),
  mk('a2','10:30',2400,'浅草寺','東京スカイツリー','inbound',{lang:'en',reg:'na'},3.1),
  mk('a3','13:00',1800,'東京駅','銀座三越','inbound',{lang:'zh',reg:'tw'},2.4),
  mk('a4','15:00',1500,'江東区東陽四丁目','聖路加国際病院','senior',null,4),
  mk('a5','20:00',3800,'六本木','新宿駅',null,null,6)]},
 '2025-11-10':{type:'day',date:'2025-11-10',breaks:[],trips:[mk('z1','10:00',2000,'品川駅','ホテル','inbound',{lang:'en'},3)]}};
async function page(d,vp){const ctx=await b.newContext({viewport:vp||{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true});await fr(ctx);
  await ctx.route(/nominatim|gsi|tile|open-meteo|cyberjapan/,r=>r.abort());
  const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
  await p.clock.install({time:new Date(2026,10,22,19,0)});
  await p.addInitScript(sd=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd))},d);
  await p.goto(APP);await p.waitForTimeout(900);return p}
const last=p=>p.evaluate(k=>days[k].trips.slice().sort((a,b)=>b.ts-a.ts)[0],K);

console.log('1. 記録の画面: 訪日客を押すと言葉が出る（前回と同じを最初から）');
let p=await page(data);
await p.evaluate(()=>{localStorage.setItem('taxi-nippo-iblang','zh');manualIn=true;layoutCmp();document.getElementById('opt').open=true});await p.waitForTimeout(200);
ok(await p.locator('#ibbox').isHidden(),'客層を選ぶまでは出ない');
await p.locator('#segchips [data-seg="inbound"]').tap();await p.waitForTimeout(200);
ok(await p.locator('#ibbox').isVisible(),'訪日客を押すと、言葉のボタンが出る');
ok(await p.getAttribute('#ib-lang [data-ibv="zh"]','aria-pressed')==='true','前回の言葉（中国語）が最初から選ばれている');
await p.locator('#ib-lang [data-ibv="ko"]').tap();await p.locator('#ibmore summary').tap();
await p.locator('#ib-reg [data-ibv="kr"]').tap();await p.locator('#ib-party [data-ibv="group"]').tap();await p.locator('#ib-pay [data-ibv="wechat"]').tap();await p.locator('#ib-x [data-ibv="show"]').tap();
await p.evaluate(()=>{const f=document.getElementById('p-fare');f.value='3300';f.dispatchEvent(new Event('input',{bubbles:true}));record(true)});await p.waitForTimeout(500);
let t=await last(p);
ok(t.seg==='inbound'&&JSON.stringify(t.ib)===JSON.stringify({lang:'ko',reg:'kr',party:'group',pay:'wechat',x:['show']}),'記録に入る: '+JSON.stringify(t.ib));
ok(t.pay==='qr','WeChat Pay を押すと、支払方法も QR決済 に');
ok(await p.evaluate(()=>localStorage.getItem('taxi-nippo-iblang'))==='ko','次の最初の言葉は韓国語');
ok(await p.locator('#ibbox').isHidden(),'記録すると元に戻る');

console.log('2. 声で「訪日 中国語 台湾 家族 アリペイ ホテルから」');
await p.evaluate(()=>{const s=document.getElementById('say');s.value='訪日 中国語 台湾 家族 アリペイ 帝国ホテルから 2400円';s.dispatchEvent(new Event('input',{bubbles:true}))});await p.waitForTimeout(300);
const pr=await p.evaluate(()=>({seg:parsed.seg,ib:parsed.ib,from:parsed.from,pay:parsed.pay,fare:parsed.fare}));
ok(pr.seg==='inbound'&&pr.ib&&pr.ib.lang==='zh'&&pr.ib.reg==='tw'&&pr.ib.party==='family'&&pr.ib.pay==='alipay','読み取れる: '+JSON.stringify(pr.ib));
ok(pr.from==='帝国ホテル'&&pr.pay==='qr'&&pr.fare===2400,'場所・支払い・料金も崩れない: '+pr.from+' '+pr.pay+' '+pr.fare);
ok(await p.locator('#ibbox').isVisible()&&await p.getAttribute('#ib-reg [data-ibv="tw"]','aria-pressed')==='true','ボタンにも反映');
await p.evaluate(()=>record(true));await p.waitForTimeout(400);t=await last(p);ok(t.ib&&t.ib.reg==='tw','記録に入る');
await p.evaluate(()=>{const s=document.getElementById('say');s.value='東京駅から 中国人観光 2000円';s.dispatchEvent(new Event('input',{bubbles:true}))});await p.waitForTimeout(200);
ok(await p.evaluate(()=>parsed.from==='東京駅'),'訪日でない言い方では、中国などを地域として取らない（「東京駅」はそのまま）');
await p.evaluate(()=>{document.getElementById('say').value='';renderParsed()});

console.log('3. 修正画面');
await p.evaluate(()=>{openEdit('a2');document.getElementById('e-more').open=true});await p.waitForTimeout(300);
ok(await p.locator('#e-ib').isVisible()&&await p.inputValue('#e-ib-lang')==='en','訪日客の乗車では、言葉などの欄が出る');
await p.selectOption('#e-ib-party','solo');await p.check('#e-ib-trans');await p.locator('#e-save').tap();await p.waitForTimeout(400);
t=await p.evaluate(k=>days[k].trips.find(x=>x.id==='a2'),K);ok(t.ib.party==='solo'&&t.ib.x[0]==='trans','保存される');
await p.evaluate(()=>{openEdit('a5');document.getElementById('e-more').open=true});await p.waitForTimeout(300);ok(await p.locator('#e-ib').isHidden(),'訪日客でなければ出ない');
await p.selectOption('#e-seg','inbound');ok(await p.locator('#e-ib').isVisible(),'客層を訪日客に変えると出る');
await p.evaluate(()=>document.getElementById('e-cancel').click());

console.log('4. 一覧・CSV');
await p.evaluate(()=>{location.hash='#list';route()});await p.waitForTimeout(500);
const th=await p.evaluate(()=>[...document.querySelectorAll('#lcard thead th')].map(x=>x.textContent));
ok(['言葉','地域','旅の形','訪日の支払い','やり取り','乗車地の種類','降車地の種類'].every(x=>th.includes(x)),'一覧に列が増える');
const row=await p.evaluate(()=>{const tr=document.querySelector('#lcard tr[data-id="a1"]');return Object.fromEntries([...tr.querySelectorAll('td[data-f]')].map(td=>[td.dataset.f,td.textContent]))});
ok(row.iblang==='中国語'&&row.ibreg==='中国'&&row.pk1==='ホテル'&&row.pk2==='空港','一覧の中身: '+row.iblang+'/'+row.ibreg+'/'+row.pk1+'/'+row.pk2);
const csv=await p.evaluate(()=>csvFor('2026-11').text);
ok(/訪日客：言葉/.test(csv)&&/中国語,中国,家族,Alipay,翻訳アプリを使った,ホテル,空港/.test(csv),'CSVにも入る');

console.log('5. 分析: 訪日客・場所の種類');
await p.evaluate(()=>{location.hash='#month';route()});await p.waitForTimeout(400);
await p.evaluate(()=>{const b=[...document.querySelectorAll('#v-month button')].find(x=>/分析/.test(x.textContent));b&&b.click()});await p.waitForTimeout(600);
const an=await p.evaluate(()=>{const c=[...document.querySelectorAll('#v-month .card')].map(x=>x.innerText);return {ib:c.find(x=>/^訪日客/.test(x))||'',kind:c.find(x=>/乗せた場所・行き先の種類/.test(x))||''}});
ok(/回数\s*5回/.test(an.ib)&&/中国語/.test(an.ib),'訪日客の回数と多い言葉: '+an.ib.split('\n').slice(0,6).join(' '));
for(const re of ['^訪日客','乗せた場所・行き先']){await p.evaluate(r=>{const c=[...document.querySelectorAll('#v-month .card')].find(c=>new RegExp(r).test(c.innerText));const b=c&&c.querySelector('.atog');if(b&&b.getAttribute('aria-expanded')!=='true')b.click()},re);await p.waitForTimeout(400)}
const an2=await p.evaluate(()=>[...document.querySelectorAll('#v-month .card')].map(x=>x.innerText).filter(x=>/^訪日客|乗せた場所・行き先/.test(x)).join('\n'));
ok(/話していた言葉/.test(an2)&&/地域/.test(an2)&&/旅の形/.test(an2)&&/時間帯/.test(an2)&&/前の年の同じ月と比べる/.test(an2),'表: 言葉・地域・旅の形・時間帯・前の年');
const kd=an2.slice(an2.indexOf('乗せた場所・行き先の種類'));ok(/乗車地の種類/.test(kd)&&/ホテル/.test(kd)&&/病院/.test(kd)&&/繁華街/.test(kd)&&/住宅地・その他/.test(kd),'乗せた場所・行き先の種類が自動で分かれる: '+kd.replace(/\s+/g,' ').slice(0,400));
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('6. 小さい画面（SE）');
p=await page(data,{width:320,height:568});await p.evaluate(()=>{manualIn=true;layoutCmp();document.getElementById('opt').open=true});await p.waitForTimeout(200);
await p.locator('#segchips [data-seg="inbound"]').tap();await p.locator('#ibmore summary').tap();await p.waitForTimeout(200);
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'横にはみ出さない');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
await b.close()})();
