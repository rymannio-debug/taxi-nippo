# 試し版を作る: dev の組み立てたもの（GitHub Pages で配るファイルだけ）を、指定した場所（main の test/）にコピーする。
# ホーム画面に置いたとき本番と見分けられるよう、manifest の名前に「試し版」を付ける。
import json, os, shutil, sys
src, dst = sys.argv[1], sys.argv[2]
if os.path.isdir(dst): shutil.rmtree(dst)
os.makedirs(dst)
for f in ['index.html','sw.js','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','leaflet.js','leaflet.css']:
    if os.path.exists(os.path.join(src,f)): shutil.copy2(os.path.join(src,f), os.path.join(dst,f))
shutil.copytree(os.path.join(src,'manual'), os.path.join(dst,'manual'))
m=json.load(open(os.path.join(dst,'manifest.webmanifest'),encoding='utf8'))
m['name']='試し版 '+m['name'];m['short_name']='試し版'
json.dump(m,open(os.path.join(dst,'manifest.webmanifest'),'w',encoding='utf8'),ensure_ascii=False,indent=1)
print('試し版を', dst, 'に作りました')
