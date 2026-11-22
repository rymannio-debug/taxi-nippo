// テスト・撮影用: Google Fonts の要求を、npm で入れたフォント（Dela Gothic One・BIZ UDPゴシック・BIZ UDゴシック）に差し替える。
// 入っていなければ何もしない（ネットのフォントをそのまま使う）
const fs=require('fs'),path=require('path');
const dir=n=>{try{return path.dirname(require.resolve(n+'/package.json'))}catch(e){return null}};
const P={dela:dir('@fontsource/dela-gothic-one'),ud:dir('@fontsource/biz-udpgothic'),udg:dir('@fontsource/biz-udgothic'),bar:dir('@fontsource/barlow-condensed'),stm:dir('@fontsource/share-tech-mono')};
const okAll=Object.values(P).every(Boolean);
const rd=(k,f)=>fs.readFileSync(path.join(P[k],f),'utf8').replace(/url\(\.\/files\/([^)]+)\)/g,'url(https://fonts.gstatic.com/'+k+'/$1)');
const css=okAll?rd('dela','index.css')+rd('ud','400.css')+rd('ud','700.css')+rd('udg','700.css')+rd('bar','500.css')+rd('bar','600.css')+rd('stm','400.css'):'';
module.exports=async ctx=>{
  if(!okAll)return;
  await ctx.route(/fonts\.googleapis\.com\/css2/,r=>r.fulfill({status:200,contentType:'text/css',headers:{'access-control-allow-origin':'*'},body:css}));
  await ctx.route(/fonts\.gstatic\.com\/(dela|ud|udg|bar|stm)\//,r=>{const m=r.request().url().match(/gstatic\.com\/(dela|ud|udg|bar|stm)\/(.+)$/);const p=path.join(P[m[1]],'files',m[2]);if(!fs.existsSync(p))return r.abort();r.fulfill({status:200,contentType:p.endsWith('woff2')?'font/woff2':'font/woff',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(p)})});
};
