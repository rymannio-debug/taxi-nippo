// 走った道（GPX）: 地図の画面で GPX を読み込むと、実際に走った道が実車（緑）・空車（灰色）に分かれて引かれ、距離が出る
(async()=>{const {chromium}=require('./pw');const fr=require('./fontroute');const b=await chromium.launch();
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const APP=(process.env.APP_URL||'file://'+__dirname+'/../index.html');
const K='2026-11-21';
/* 出庫 8:00・帰庫 12:00。乗車1：8:30〜8:45、乗車2：9:30〜（降車時刻なし） */
const A=[35.6700,139.8000],B=[35.6900,139.8000],C=[35.6900,139.8200],D=[35.7000,139.8200];
const on={[K]:{type:'day',date:K,startTime:'08:00',endTime:'12:00',odoStart:45230,odoEnd:45330,breaks:[],trips:[
  {id:'a',t:'08:30',tin:'08:30',tout:'08:45',fare:2000,pay:'cash',ts:1,g1:A,g2:B,from:'A',to:'B'},
  {id:'b',t:'09:30',tin:'09:30',tout:null,fare:1500,pay:'cash',ts:2,g1:C,g2:D,from:'C',to:'D'}]}};
/* 8:10 A を出て北へ（空車）→ 8:30 A で乗車 → 8:45 B（実車）→ 東へ C（空車）→ 9:30 乗車 → 9:50 D。途中に1点だけ飛び（時速200km超） */
const pts=[];const T=h=>Date.UTC(2026,10,21,h[0]-9,h[1],h[2]||0);
const line=(p,q,t0,t1,n)=>{for(let i=0;i<n;i++){const u=i/n;pts.push([p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u,t0+(t1-t0)*u])}};
line([35.66,139.80],A,T([8,10]),T([8,30]),20);
line(A,B,T([8,30]),T([8,45]),30);
line(B,C,T([8,45]),T([9,30]),30);
line(C,D,T([9,30]),T([9,50]),20);pts.push([D[0],D[1],T([9,50])]);
pts.splice(40,0,[36.5,140.5,pts[39][2]+1000]);
const gpx=(P)=>'<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg>'+P.map(p=>'<trkpt lat="'+p[0].toFixed(6)+'" lon="'+p[1].toFixed(6)+'">'+(p[2]!=null?'<time>'+new Date(p[2]).toISOString()+'</time>':'')+'</trkpt>').join('')+'</trkseg></trk></gpx>';
async function page(){const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await fr(ctx);
  await ctx.route(/nominatim|gsi|tile|open-meteo|cyberjapan/,r=>r.abort());
  const p=await ctx.newPage();const E=[];p.on('pageerror',e=>E.push(e.message));p.E=E;
  await p.clock.install({time:new Date(2026,10,22,9,0)});
  await p.addInitScript(sd=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s','1');localStorage.clear();localStorage.setItem('taxi-nippo-v1',JSON.stringify(sd))},on);
  await p.goto(APP);await p.waitForTimeout(900);return p}
const load=async(p,text,name)=>{await p.setInputFiles('#trk-file',{name:name||'day.gpx',mimeType:'application/gpx+xml',buffer:Buffer.from(text)});await p.waitForTimeout(900)};
const legs=p=>p.evaluate(()=>mapLegs.map(g=>({occ:g.occ,to:g.to,n:g.lls?g.lls.length:0,trk:!!g.lls})));

console.log('1. 地図の画面で GPX を読み込む');
let p=await page();
await p.evaluate(k=>{mapDay=k;location.hash='#map'},K);await p.waitForTimeout(900);
ok(await p.locator('#trk-load').isVisible(),'「走った道を読み込む（GPX）」がある');
ok(await p.locator('#trk-del').isHidden(),'読み込む前は「消す」は出ない');
await load(p,gpx(pts));
const msg=await p.textContent('#trk-msg');
ok(/読み込みました（101点）/.test(msg),'読み込んだ点の数が出る（飛びの1点は捨てる）: '+msg);
let L=await legs(p);
ok(L.length>0&&L.every(g=>g.trk),'直線の順路でなく、走った道の線になる');
ok(L.some(g=>g.occ===true&&g.to==='a'),'乗車1の 8:30〜8:45 は実車の線');
ok(L.some(g=>g.occ===false&&g.to==='b'),'乗車1と乗車2のあいだは空車の線（次の乗車に結びつく）');
ok(!L.some(g=>g.occ===true&&g.to==='b'),'降車時刻のない乗車2は実車にしない');
const sum=await p.textContent('#mp-sum');
ok(/走った道：合計 [\d.]+km（実車 2\.\dkm・空車 [\d.]+km）/.test(sum),'合計・実車・空車の距離: '+sum.replace(/.*走った道/,'走った道'));
ok(/降車時刻のない乗車が1件/.test(sum),'降車時刻のない乗車を知らせる');
ok(/お客様を乗せて走った道/.test(await p.textContent('#mp-lg')),'凡例が「走った道」の言い方になる');
ok(await p.locator('#trk-del').isVisible()&&/読み込み直す/.test(await p.textContent('#trk-load')),'読み込んだあとは「消す」「読み込み直す」');

console.log('2. 1件ずつ見ると、その案件の道だけ濃くなる');
await p.locator('#ms-next').tap();await p.waitForTimeout(400);
const op=await p.evaluate(()=>mapLegs.map(g=>({to:g.to,o:g.line.options.opacity})));
ok(op.filter(g=>g.to==='a').every(g=>g.o>.5)&&op.filter(g=>g.to!=='a').every(g=>g.o<.2),'1件目の空車と実車だけが濃い');
await p.locator('#ms-all').tap();await p.waitForTimeout(300);

console.log('3. 「走った道」を消すと、前の直線の順路に戻る');
await p.locator('[data-mpk]').tap();await p.waitForTimeout(500);
L=await legs(p);ok(L.length&&L.every(g=>!g.trk),'直線の順路');
ok(await p.locator('[data-mpr]').isVisible(),'「順路の線」のボタンが戻る');
await p.locator('[data-mpk]').tap();await p.waitForTimeout(500);

console.log('4. 開き直しても残る（この端末に保存）');
await p.reload();await p.waitForTimeout(1200);
await p.evaluate(k=>{mapDay=k;if(location.hash!=='#map')location.hash='#map';else renderMap()},K);await p.waitForTimeout(1200);
L=await legs(p);ok(L.length&&L.every(g=>g.trk),'走った道が出る');
ok(!/trk/.test(await p.evaluate(()=>JSON.stringify(days))),'日報の記録（バックアップ）には入らない');

console.log('5. 消す（2回押す）');
await p.locator('#trk-del').tap();await p.waitForTimeout(200);
ok(/もう一度押すと消します/.test(await p.textContent('#trk-del')),'1回目は確かめる');
await p.locator('#trk-del').tap();await p.waitForTimeout(600);
L=await legs(p);ok(L.every(g=>!g.trk)&&await p.locator('#trk-del').isHidden(),'消える');
ok(await p.evaluate(k=>days[k].trips.length,K)===2,'日報の記録はそのまま');

console.log('6. 違う日の GPX・GPX でないファイル・時刻のない GPX');
await load(p,gpx(pts.map(q=>[q[0],q[1],q[2]+86400000])));
ok(/11月22日の記録のようです/.test(await p.textContent('#trk-msg')),'違う日だと、その日付を教える');
await load(p,'hello','memo.txt');
ok(/GPXのファイルとして読めませんでした/.test(await p.textContent('#trk-msg')),'GPXでないと知らせる');
await load(p,gpx(pts.slice(0,60).map(q=>[q[0],q[1],null])));
ok(/時刻が入っていないので/.test(await p.textContent('#mp-sum')),'時刻がなくても線は引き、実車・空車に分けられないと知らせる');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();

console.log('7. 乗車の位置がない日でも、道だけで地図が出る');
p=await page();
await p.evaluate(k=>{days[k].trips.forEach(t=>{t.g1=null;t.g2=null});mapDay=k;location.hash='#map'},K);await p.waitForTimeout(800);
ok(await p.locator('#mapbox').isHidden(),'読み込む前は地図なし');
await load(p,gpx(pts));
ok(await p.locator('#mapbox').isVisible()&&(await legs(p)).length>0,'読み込むと地図と道が出る');
ok(!p.E.length,'エラーなし '+p.E.join('/'));

console.log('8. 電波が切れて10分以上とんだところは、線をつながない');
await load(p,gpx(pts.slice(-10).concat([[35.72,139.85,T([10,40])],[35.73,139.85,T([10,45])],[35.74,139.85,T([10,50])]])));
const n=await p.evaluate(k=>trkSegs(k,trkMem[k]).length,K);
const all=await p.evaluate(k=>trkStats(k,trkMem[k]).all,K);
ok(n>=2&&all<5000,'とんだ所で線が分かれ、その間は距離に数えない（'+Math.round(all)+'m）');
ok(!p.E.length,'エラーなし '+p.E.join('/'));await p.context().close();
await b.close()})();
