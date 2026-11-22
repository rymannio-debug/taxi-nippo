// テスト用の小さな web サーバー（リポジトリの直下を配る）。空いている番号で開き、その番号を1行だけ書く
const http=require('http'),fs=require('fs'),path=require('path'),root=path.join(__dirname,'..');
const TY={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json','.json':'application/json'};
const srv=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end()}s.writeHead(200,{'Content-Type':TY[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s)});
srv.listen(0,'127.0.0.1',()=>process.stdout.write(srv.address().port+'\n'));
