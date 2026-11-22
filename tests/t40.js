(async()=>{const {chromium}=require('./pw');const b=await chromium.launch();const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
const today=(()=>{const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')})();
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});await p.route(/nominatim|gsi|tile|open-meteo/,r=>r.abort());const E=[];p.on('pageerror',e=>E.push(e.message));
await p.addInitScript(s=>{localStorage.setItem('taxi-nippo-v1',JSON.stringify(s));window.__said=[];window.__q=[];
 Object.defineProperty(window,'speechSynthesis',{configurable:true,get:()=>({speak:u=>{if(u.text.trim()){window.__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),100)}},cancel:()=>{},getVoices:()=>[]})});window.SpeechSynthesisUtterance=function(t){this.text=t};
 window.webkitSpeechRecognition=undefined;window.SpeechRecognition=class{start(){const t=window.__q.shift();setTimeout(()=>{if(t!=null){const r=[[{transcript:t}]];r[0].isFinal=true;this.onresult({resultIndex:0,results:r})}setTimeout(()=>this.onend(),60)},120)}stop(){setTimeout(()=>this.onend&&this.onend(),20)}abort(){setTimeout(()=>this.onend&&this.onend(),20)}};
},{[today]:{type:'day',date:today,startTime:'07:00',endTime:'15:30',odoStart:45100,odoEnd:null,breaks:[],trips:[
 {id:'a',t:'08:00',tin:'08:00',tout:'08:40',fare:2400,pay:'cash',pax:1,from:'調布駅',to:'',o1:45110,o2:45118,ts:1},
 {id:'b',t:'08:30',tin:'08:30',tout:'08:50',fare:1500,pay:'card',pax:1,from:'府中駅',to:'国立駅',o1:null,o2:null,ts:2},
 {id:'c',t:'09:30',tin:'09:30',tout:'09:45',fare:300,pay:'cash',pax:1,from:'国立駅',to:'立川駅',o1:45140,o2:45146,ts:3}]}});
await p.goto('file://'+__dirname+'/../index.html');await p.waitForTimeout(700);
await p.click('#rv-open');await p.waitForTimeout(500);const t=await p.$$eval('#rv-check button',e=>e.map(x=>x.textContent.replace('直す ›','')));console.log('   '+t.join('\n   '));
ok(t.length>=5,'問題 '+t.length+'件');ok(t.some(x=>/帰庫メーター/.test(x)),'帰庫メーターなし');ok(t.some(x=>/-01.*降車地/.test(x)),'01 降車地なし');ok(t.some(x=>/-02.*メーター/.test(x)),'02 メーターなし');ok(t.some(x=>/重なって/.test(x)),'時間の重なり');ok(t.some(x=>/-03.*料金/.test(x)),'03 料金 ¥300');ok(t.some(x=>/休憩が0分/.test(x)),'休憩0分');
await p.screenshot({path:'ck_day.png'});
await p.click('#rv-check [data-dc="1"]');await p.waitForTimeout(300);ok(await p.isVisible('#ov'),'乗車の行で修正画面が開く');
console.log('-- 声: 抜けがあると読み上げて聞く');
await p.click('#e-close').catch(()=>p.evaluate(()=>{document.getElementById('ov').hidden=true}));await p.waitForTimeout(200);
await p.evaluate(()=>window.__q.push('2000円','現金','はい'));await p.evaluate(()=>{const d=JSON.parse(JSON.stringify(days));});
await p.evaluate(()=>{document.getElementById('ov').hidden=true});
await p.tap('#vbtn').catch(()=>p.evaluate(()=>document.getElementById('vbtn').click()));await p.waitForTimeout(3800);
const said=await p.evaluate(()=>window.__said.join(' / '));console.log('   読み上げ: '+said);ok(/入っていません。このまま記録しますか/.test(said),'抜けを読み上げて聞く');
console.log('errors',E);await b.close()})();
