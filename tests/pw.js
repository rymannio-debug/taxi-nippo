// テストで使うブラウザを選ぶ（BROWSER=chromium か webkit）。テストは chromium の名前で呼ぶので、そこに選んだものを入れる
const pw=require('playwright');const n=process.env.BROWSER||'chromium';
if(!pw[n])throw new Error('BROWSER は chromium か webkit');
module.exports=Object.assign({},pw,{chromium:pw[n]});
