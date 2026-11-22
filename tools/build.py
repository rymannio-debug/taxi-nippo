# src/app.html（アプリ本体。Claude版と同じもの）から、GitHub Pages で配る index.html・manifest・sw.js を作る。
# 使い方: python3 tools/build.py        作る
#         python3 tools/build.py --check 作り直したものが、いまのファイルと同じかだけ確かめる（自動テストで使う）
import json,hashlib,os,sys
root=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
P=lambda *a:os.path.join(root,*a)
src=open(P('src','app.html'),encoding='utf8').read()
head=open(P('src','head.html'),encoding='utf8').read().split('\n')[0]
assert head.startswith('<!doctype html>') and head.endswith('<body>')
head=head.replace('<html>','<html lang="ja">',1)
extra=('<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
 '<meta name="apple-mobile-web-app-title" content="売上日報"><meta name="apple-mobile-web-app-status-bar-style" content="default">'
 '<meta name="theme-color" content="#fff3c4" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#1f1c15" media="(prefers-color-scheme: dark)">'
 '<link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-180.png">')
head=head.replace('</head>',extra+'</head>',1)
out={}
out['index.html']=head+'\n'+src.rstrip()+'\n</body></html>\n'
ver=hashlib.sha256(out['index.html'].encode()+open(P('leaflet.js'),'rb').read()).hexdigest()[:10]
out['manifest.webmanifest']=json.dumps({"name":"タクシー売上日報","short_name":"売上日報","lang":"ja","start_url":"./","scope":"./","display":"standalone","background_color":"#fff3c4","theme_color":"#fff3c4","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"}]},ensure_ascii=False,indent=1)
out['sw.js']=open(P('tools','sw.template.js'),encoding='utf8').read().replace('__VER__',ver)
if '--check' in sys.argv:
    bad=[f for f,t in out.items() if not os.path.exists(P(f)) or open(P(f),encoding='utf8').read()!=t]
    if bad:print('作り直していないファイルがあります: '+', '.join(bad)+'（python3 tools/build.py を実行してください）');sys.exit(1)
    print('組み立て済みのファイルは src と一致しています');sys.exit(0)
for f,t in out.items():open(P(f),'w',encoding='utf8').write(t)
print('built',ver)
