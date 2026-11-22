// テストをまとめて走らせる。✗ が1つでもあるか、止まったら失敗（終了コード1）
// 使い方: node tests/run.js [t42 t53 ...]   環境変数 BROWSER=chromium|webkit、SHARD=1/4（4つに分けた1つ目だけ）
const {spawnSync}=require('child_process'),fs=require('fs'),path=require('path');
let files=process.argv.slice(2).map(f=>f.replace(/\.js$/,''));
if(!files.length)files=fs.readdirSync(__dirname).filter(f=>/^t\d+\.js$/.test(f)).map(f=>f.slice(0,-3)).sort((a,b)=>+a.slice(1)-+b.slice(1)).concat(['random']);
const sh=(process.env.SHARD||'').match(/^(\d+)\/(\d+)$/);if(sh)files=files.filter((f,i)=>i%+sh[2]===+sh[1]-1);
/* ページは file:// ではなく手元の http で開く（WebKit は file:// からの読み込みを止めるため）。テストを順に待つあいだも返事できるよう、別のプロセスで動かす */
const {spawn}=require('child_process');
const srv=spawn(process.execPath,[path.join(__dirname,'serve.js')],{stdio:['ignore','pipe','inherit']});
let bad=0;const sum=[];
srv.stdout.once('data',d=>{const env=Object.assign({},process.env,{APP_URL:'http://127.0.0.1:'+String(d).trim()+'/index.html'});
for(const f of files){
  const r=spawnSync(process.execPath,[path.join(__dirname,f+'.js')],{encoding:'utf8',timeout:20*60000,env});
  const out=(r.stdout||'')+(r.stderr||'');const ok=(out.match(/✓/g)||[]).length,ng=(out.match(/✗/g)||[]).length;
  const prob=(out.match(/=== 問題 (\d+)件/)||[])[1];
  const fail=ng>0||r.status!==0||r.error||(f==='random'&&prob!=='0')||(f!=='random'&&ok===0);
  sum.push(f+' ok='+ok+' ng='+ng+(prob!=null?' 問題='+prob:'')+(r.error?' '+r.error.code:'')+(fail?'  ← 失敗':''));
  if(fail){bad++;console.log('---- '+f+' の出力 ----\n'+out.split('\n').filter(l=>/✗|Error|error|問題/.test(l)).slice(0,40).join('\n'))}
}
console.log((process.env.BROWSER||'chromium')+' '+(process.env.SHARD||'')+'\n'+sum.join('\n'));srv.kill();process.exit(bad?1:0)});
