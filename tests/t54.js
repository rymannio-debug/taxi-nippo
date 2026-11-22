// 会社の決まり: 締め日・釣り銭の準備金・歩率（税込/税抜・段階）・足切り（月/1乗務・届かない月の歩率）を任意で
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const K='2026-11-21';
async function page(data,o={}){const ctx=await b.newContext({viewport:o.vp||{width:390,height:844},hasTouch:true,isMobile:true});await fr(ctx);
 await ctx.route(/nominatim|gsi|tile|open-meteo|cyberjapan/,r=>r.abort());
 const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
 await p.clock.install({time:o.at||new Date(2026,10,21,18,0)});
 await p.addInitScript(([sd,set])=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();if(sd)localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd));if(set)localStorage.setItem('taxi-nippo-set-v1',JSON.stringify(set))},[data||null,o.set||null]);
 await p.goto((process.env.APP_URL||'file://'+__dirname+'/../index.html'));await p.waitForTimeout(800);return p}
const tapEl=async(p,sel)=>{const r=await p.evaluate(s=>{const e=[...document.querySelectorAll(s)].find(x=>x.getClientRects().length);if(!e)return null;e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2]},sel);if(!r)return false;await p.touchscreen.tap(r[0],r[1]);await p.waitForTimeout(350);return true};
const keys=async(p,ks)=>{for(const k of ks){await tapEl(p,'#np [data-k="'+k+'"]')}};
const txt=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' '):''},sel);
const vis=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&e.getClientRects().length>0},s);
const S=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('taxi-nippo-set-v1')||'{}'));
const typeIn=async(p,sel,v)=>{await p.fill(sel,String(v));await p.dispatchEvent(sel,'change');await p.waitForTimeout(150)};
const pick=async(p,sel,v)=>{await p.selectOption(sel,v);await p.waitForTimeout(150)};
const toMonth=async p=>{await p.evaluate(()=>{location.hash='#month';route()});await p.waitForTimeout(300)};
const wage=p=>txt(p,'#mm-wage');
// 3 乗務 × 110,000円（税込） = 330,000円、税抜 300,000円
const M={};['2026-11-03','2026-11-10','2026-11-17'].forEach(x=>{M[x]={type:'day',date:x,startTime:'07:00',endTime:'01:00',breaks:[],trips:[{id:x,t:'08:00',fare:110000,pay:'cash',ts:1}]}});

console.log('1. 設定: 「乗務員と勤務」と「会社の決まり」に分かれる／足切りを入れるまで細かい欄は出ない');
let p=await page(M);
await p.evaluate(()=>{location.hash='#set';route()});await p.waitForTimeout(300);
ok(/乗務員と勤務/.test(await txt(p,'#proset .disp-h'))&&/会社の決まり/.test(await txt(p,'#coset .disp-h')),'カードが2つ');
ok(await p.evaluate(()=>['s-close','s-change','s-rate','s-cut'].every(id=>document.getElementById(id).closest('#coset'))),'締め日・釣り銭・歩率・足切りは「会社の決まり」に');
ok(!(await vis(p,'#s-cutu'))&&!(await vis(p,'#s-rlow')),'足切りが空なら「足切りの額は」「届かない月の歩率」は出ない');
ok(await p.evaluate(()=>document.querySelector('#basechips [data-base="net"]').getAttribute('aria-pressed'))==='true','はじめは「税抜の営収にかける」');
ok(!(await vis(p,'#s-wage-ex')),'何も入れていなければ計算の例は出ない');
await typeIn(p,'#s-rate','60');
let s=await S(p);ok(s.rate===60&&s.base==='net'&&s.cutU==='m'&&s.rateLow===null&&Array.isArray(s.tiers),'歩率60%を保存（ほかは初めの値）');
ok(/11月（11\/1〜11\/30、3乗務、営収 330,000円）で計算すると ?給料の見込み180,000円（税抜営収 300,000円 × 歩率 60%）/.test(await txt(p,'#s-wage-ex')),'設定の下に今月分での計算: '+(await txt(p,'#s-wage-ex')).slice(0,90));

await p.fill('#s-cut','350,000円');await p.dispatchEvent('#s-cut','change');await p.evaluate(()=>document.getElementById('s-cut').blur());await p.waitForTimeout(150);
s=await S(p);ok(s.cutoff===350000&&await p.inputValue('#s-cut')==='350,000','「350,000円」と打っても 350000 として入り、カンマ付きで出る');
await p.fill('#s-cut','');await p.dispatchEvent('#s-cut','change');await p.evaluate(()=>document.getElementById('s-cut').blur());await p.waitForTimeout(150);
console.log('2. 税込の営収にかける');
await tapEl(p,'#basechips [data-base="gross"]');
s=await S(p);ok(s.base==='gross','税込を保存');
await toMonth(p);ok(/給料の見込み198,000円（税込営収 330,000円 × 歩率 60%）/.test(await wage(p)),'税込 330,000 × 60% = 198,000: '+(await wage(p)).slice(0,50));
await p.evaluate(()=>{location.hash='#set';route()});await p.waitForTimeout(300);await tapEl(p,'#basechips [data-base="net"]');

console.log('3. 足切り（1か月）と届かない月の歩率');
await typeIn(p,'#s-cut','400000');
ok(await vis(p,'#s-cutu')&&await vis(p,'#s-rlow'),'足切りを入れると細かい欄が出る');
await toMonth(p);
ok(/給料の見込み180,000円/.test(await wage(p))&&/足切り 400,000円まで あと100,000円（税抜営収で比べています）/.test(await wage(p)),'届かない月の歩率が空: 歩率は60%のまま、残り100,000円');
ok(/届かない月の歩率は、設定の「会社の決まり」で入れられます/.test(await wage(p)),'届かない月の歩率を入れられることを案内');
await p.evaluate(()=>{location.hash='#set';route()});await p.waitForTimeout(300);
await typeIn(p,'#s-rlow','50');
await toMonth(p);
ok(/給料の見込み150,000円（税抜営収 300,000円 × 歩率 50%）/.test(await wage(p)),'届かない → 歩率50%で 150,000円');
ok(/足切り 400,000円まで あと100,000円（届けば歩率 60%）/.test(await wage(p)),'「届けば歩率 60%」');
await p.evaluate(()=>{location.hash='#set';route()});await p.waitForTimeout(300);
await typeIn(p,'#s-rlow','0');s=await S(p);ok(s.rateLow===0,'届かない月の歩率 0%（歩合なし）も入る');
await toMonth(p);ok(/給料の見込み0円/.test(await wage(p)),'0%なら見込み0円');

console.log('4. 足切りを1乗務あたりにする');
await p.evaluate(()=>{location.hash='#set';route()});await p.waitForTimeout(300);
await pick(p,'#s-cutu','s');await typeIn(p,'#s-cut','90000');
s=await S(p);ok(s.cutU==='s'&&s.cutoff===90000,'1乗務 90,000円を保存');
await toMonth(p);
ok(/足切り 270,000円（1乗務 90,000円 × 3乗務）を超えています/.test(await wage(p)),'90,000 × 3乗務 = 270,000円を超えた');
ok(/給料の見込み180,000円/.test(await wage(p)),'超えたので歩率60%');
await p.evaluate(()=>{location.hash='#set';route()});await p.waitForTimeout(300);await typeIn(p,'#s-cut','110000');
await toMonth(p);ok(/足切り 330,000円（1乗務 110,000円 × 3乗務）まで あと30,000円（届けば歩率 60%）/.test(await wage(p))&&/× 歩率 0%/.test(await wage(p)),'110,000 × 3 = 330,000円に届かない → 0%');

console.log('5. 営収で歩率が上がる段階');
await p.evaluate(()=>{location.hash='#set';route()});await p.waitForTimeout(300);
await typeIn(p,'#s-cut','');ok(!(await vis(p,'#s-cutu')),'足切りを空にすると、細かい欄は隠れる');
s=await S(p);ok(s.cutoff===null,'足切りを使わなくなる');
await tapEl(p,'#tier-add');
ok(await p.evaluate(()=>document.querySelectorAll('#tier-list .tier').length)===1,'「歩率の段階を足す」で1行');
ok(await p.evaluate(()=>document.activeElement&&document.activeElement.matches('#tier-list [data-tmin]')),'足した行の営収の欄にすぐ入れられる');
await p.fill('#tier-list .tier:nth-child(1) [data-tmin]','250000');await p.dispatchEvent('#tier-list .tier:nth-child(1) [data-tmin]','change');await p.waitForTimeout(150);
await p.evaluate(()=>document.activeElement.blur());await p.evaluate(()=>renderProSet());
ok(await p.evaluate(()=>document.querySelectorAll('#tier-list .tier').length)===1&&/^250,?000$/.test(await p.inputValue('#tier-list .tier:nth-child(1) [data-tmin]')),'営収だけ入れた行も消えない');
await p.fill('#tier-list .tier:nth-child(1) [data-trate]','62');await p.dispatchEvent('#tier-list .tier:nth-child(1) [data-trate]','change');await p.waitForTimeout(150);
await tapEl(p,'#tier-add');
await p.fill('#tier-list .tier:nth-child(2) [data-tmin]','350000');await p.dispatchEvent('#tier-list .tier:nth-child(2) [data-tmin]','change');
await p.fill('#tier-list .tier:nth-child(2) [data-trate]','65');await p.dispatchEvent('#tier-list .tier:nth-child(2) [data-trate]','change');await p.waitForTimeout(150);
s=await S(p);ok(JSON.stringify(s.tiers)==='[{"min":250000,"rate":62},{"min":350000,"rate":65}]','段階2つを保存: '+JSON.stringify(s.tiers));
await toMonth(p);
ok(/給料の見込み186,000円（税抜営収 300,000円 × 歩率 62%）/.test(await wage(p)),'300,000円は250,000円以上 → 62%で 186,000円');
ok(/あと50,000円で歩率 65%（税抜営収 350,000円から）/.test(await wage(p)),'次の段階まで あと50,000円');
await p.evaluate(()=>{location.hash='#set';route()});await p.waitForTimeout(300);
await tapEl(p,'#tier-list .tier:nth-child(1) [data-tdel]');
s=await S(p);ok(JSON.stringify(s.tiers)==='[{"min":350000,"rate":65}]','「消す」で1つ目の段階を消す');
await typeIn(p,'#s-rate','');
await toMonth(p);
ok(!/給料の見込み/.test(await wage(p))&&/あと50,000円で歩率 65%/.test(await wage(p)),'歩率が空で段階にも届かないとき: 見込みは出さず、段階までの残りだけ');
await p.evaluate(()=>{location.hash='#set';route()});await p.waitForTimeout(200);for(let i=0;i<6;i++){await tapEl(p,'#tier-add')}
ok(await p.evaluate(()=>document.querySelectorAll('#tier-list .tier').length)===6&&!(await vis(p,'#tier-add')),'段階は6つまで');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('5b. 指で: 段階の営収を入れて、そのまま歩率の欄を押して入れる');
p=await page(M,{set:{rate:60}});await p.evaluate(()=>{location.hash='#set';route()});await p.waitForTimeout(300);
await tapEl(p,'#tier-add');await p.keyboard.type('300000');
await tapEl(p,'#tier-list .tier:nth-child(1) [data-trate]');await p.keyboard.type('63');
await tapEl(p,'#coset .disp-h');
s=await S(p);ok(JSON.stringify(s.tiers)==='[{"min":300000,"rate":63}]','続けて押しても両方入る: '+JSON.stringify(s.tiers));
ok(/給料の見込み189,000円（税抜営収 300,000円 × 歩率 63%）/.test(await txt(p,'#s-wage-ex')),'計算の例もすぐ変わる');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('6. 何も入れていない月集計から「会社の決まり」へ');
p=await page(M);await toMonth(p);
ok(await vis(p,'#mm-setco')&&!(await vis(p,'#mm-wage')),'月集計に「締め日・歩率・足切りを設定」');
await tapEl(p,'#mm-setco');
ok(await p.evaluate(()=>location.hash)==='#set','押すと設定へ');
ok(await p.evaluate(()=>{const r=document.getElementById('coset').getBoundingClientRect();return r.top>=-2&&r.top<200}),'「会社の決まり」が画面の上に来る');
await pick(p,'#s-close','20');await toMonth(p);
ok(!(await vis(p,'#mm-setco')),'締め日を入れたら、その案内は出ない');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('7. 帰庫の「現金を数える」で釣り銭の準備金も直せる（設定にも入る）');
const C={[K]:{type:'day',date:K,startTime:'07:00',endTime:'17:30',odoStart:85100,odoEnd:85310,breaks:[],trips:[{id:'a',t:'08:10',fare:5500,pay:'cash',ts:1}]}};
p=await page(C);
await p.evaluate(()=>document.getElementById('rv-open').click());await p.waitForTimeout(500);
ok(await vis(p,'#ca-ch')&&await p.inputValue('#ca-ch')==='','準備金の欄（はじめは空）');
await tapEl(p,'#ca-in');await p.waitForTimeout(200);await keys(p,['1','5','5','00']);await tapEl(p,'#np [data-k="ok"]');
ok(/10,000円多い（納金の現金 5,500円）/.test(await txt(p,'#ca-res')),'準備金なし: 15,500円は「10,000円多い」');
await tapEl(p,'#ca-ch');await p.waitForTimeout(200);
ok(/釣り銭の準備金/.test(await txt(p,'#np-l')),'準備金の欄でも大きい数字キー');
await keys(p,['1','0','00','0']);await tapEl(p,'#np [data-k="ok"]');
ok(/ぴったりです（納金の現金 5,500円＋釣り銭 10,000円＝15,500円）/.test(await txt(p,'#ca-res')),'準備金10,000円を入れると「ぴったり」');
s=await S(p);ok(s.change===10000,'設定にも入る');
await p.evaluate(()=>{document.getElementById('rv-close').click();location.hash='#set';route()});await p.waitForTimeout(300);
ok(await p.inputValue('#s-change')==='10,000','設定の「釣り銭の準備金」も 10,000（カンマ付きで読みやすく）');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('8. 前の版の設定（新しい項目なし）でも動く／おかしな値は捨てる');
p=await page(M,{set:{closeDay:20,rate:55,cutoff:300000,change:5000,base:'x',cutU:'y',rateLow:'abc',tiers:[{min:-1,rate:200},'z',{min:400000,rate:70}]}});
s=await p.evaluate(()=>settings);
ok(s.base==='net'&&s.cutU==='m'&&s.rateLow===null&&JSON.stringify(s.tiers)==='[{"min":400000,"rate":70}]','おかしな値は初めの値に: '+JSON.stringify([s.base,s.cutU,s.rateLow,s.tiers]));
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('9. 小さい画面（SE）で設定がはみ出さない');
p=await page(M,{vp:{width:320,height:568},set:{rate:60,cutoff:400000,tiers:[{min:4000000,rate:65}]}});
await p.evaluate(()=>{location.hash='#set';route()});await p.waitForTimeout(300);
const over=await p.evaluate(()=>[...document.querySelectorAll('#coset *')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().right>document.documentElement.clientWidth+0.5).map(e=>e.tagName+'#'+e.id+'.'+e.className).slice(0,5));
ok(!over.length,'はみ出しなし '+over.join(','));
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'横にスクロールしない');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
await b.close()})();
