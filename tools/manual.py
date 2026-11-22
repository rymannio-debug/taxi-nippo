# manual/src/*.md（マニュアルの原稿）から、読むだけのページ manual/*.html を作る。build.py から呼ぶ。
# 原稿を直すのは Claude だけ。ページには編集の仕組みを入れない。
import re, html, os, struct, markdown


def webp_size(path):
    # 図の幅と高さ（ページを開いたときに図が後から入って、飛んだ先の見出しがずれないように）
    b = open(path, 'rb').read(40)
    c = b[12:16]
    if c == b'VP8 ':
        w, h = struct.unpack('<HH', b[26:30]); return w & 0x3fff, h & 0x3fff
    if c == b'VP8L':
        v = int.from_bytes(b[21:25], 'little'); return (v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1
    if c == b'VP8X':
        return int.from_bytes(b[24:27], 'little') + 1, int.from_bytes(b[27:30], 'little') + 1
    raise ValueError(path)

DOCS = [('easy', 'かんたん手順書'), ('zukai', '図解マニュアル'), ('tsukaikata', '使い方マニュアル')]
CLAUDE_APP = 'https://claude.ai/artifact/6g9yyZ7npMk4AZThAYAykY'

CSS = r'''
:root{--bg:#fff8e1;--card:#fffdf6;--ink:#1f1c15;--mute:#5d5546;--line:#2a261d;--soft:#e9dfc4;--acc:#ffd23f;--link:#0b5cad;--hit:#fff1a8}
@media (prefers-color-scheme:dark){:root{--bg:#1f1c15;--card:#2a261d;--ink:#f5eedc;--mute:#c9bfa6;--line:#8a7f66;--soft:#4a4334;--acc:#ffd23f;--link:#8cc4ff;--hit:#4d4520}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.75 "Hiragino Sans","BIZ UDPGothic","Noto Sans JP",system-ui,sans-serif;overflow-wrap:anywhere}
.bar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:10px;padding:8px 16px;padding-top:max(8px,env(safe-area-inset-top));background:var(--acc);color:#1f1c15;border-bottom:3px solid #1f1c15}
.bar a.back{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border:2px solid #1f1c15;border-radius:12px;background:#fff;color:#1f1c15;font-weight:700;text-decoration:none;white-space:nowrap}
.bar .t{font-weight:700;font-size:15px;line-height:1.3;min-width:0}
main{max-width:760px;margin:0 auto;padding:12px 16px 40px}
h1{font-size:26px;line-height:1.35;margin:14px 0 6px}
h2{font-size:22px;line-height:1.4;margin:36px 0 10px;padding:6px 12px;border-left:8px solid var(--acc);background:var(--card);border-radius:6px}
h3{font-size:19px;margin:26px 0 8px}
h4{font-size:17px;margin:20px 0 6px}
h2,h3,h4{scroll-margin-top:84px}
:target{animation:hit 2.4s ease-out}
@keyframes hit{0%,40%{background:var(--hit)}100%{}}
a{color:var(--link)}
p,li{margin:.5em 0}
ol,ul{padding-left:1.6em}
img{display:block;max-width:100%;height:auto;margin:14px auto;border:2px solid var(--line);border-radius:10px;background:#fff}
.tw{overflow-x:auto;margin:12px 0;-webkit-overflow-scrolling:touch}
table{border-collapse:collapse;width:100%;font-size:15px;line-height:1.55;background:var(--card)}
th,td{border:1px solid var(--soft);padding:8px 10px;text-align:left;vertical-align:top}
th{background:var(--soft)}
.ro.hint{position:sticky;top:64px;z-index:4;margin:0 16px;background:var(--hit);color:var(--ink)}
.ro{font-size:14px;color:var(--mute);background:var(--card);border:1px dashed var(--line);border-radius:10px;padding:8px 12px;margin:10px 0}
details.toc{background:var(--card);border:2px solid var(--line);border-radius:12px;padding:4px 14px;margin:14px 0}
details.toc summary{min-height:44px;display:flex;align-items:center;font-weight:700;cursor:pointer}
details.toc ol{list-style:none;padding:0;margin:4px 0 10px}
details.toc li{margin:0}
details.toc a{display:block;padding:9px 4px;border-top:1px solid var(--soft);text-decoration:none}
.others{display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 0}
.others a{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border:2px solid var(--line);border-radius:12px;background:var(--card);text-decoration:none;font-weight:700}
.flow{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:12px 0;font-weight:700}
.flow span{padding:8px 12px;border:2px solid var(--line);border-radius:10px;background:var(--card)}
.flow .loop{border-style:dashed}
.flow small{font-weight:400;color:var(--mute)}
footer{max-width:760px;margin:0 auto;padding:16px;color:var(--mute);font-size:14px;border-top:1px solid var(--soft)}
'''

# 戻るボタン: 同じ画面でマニュアル間を移ったときは前のページへ。別の画面で開いたときは閉じてアプリへ戻る。
# 閉じられないとき（iPhoneのアプリから開いた画面など）は、閉じ方を出す。ここからアプリのアドレスを開くと、
# 記録の入っていない別の画面になるので、単体版では開かない。
JS = r"""(function(){var c=/[?&]from=claude/.test(location.search),b=document.getElementById('back'),h=document.getElementById('backhint');
if(c){document.querySelectorAll('a[href]').forEach(function(a){var x=a.getAttribute('href');if(/^[a-z]+\.html/.test(x))a.setAttribute('href',x.replace(/^([a-z]+\.html)/,'$1?from=claude'))})}
b.addEventListener('click',function(e){e.preventDefault();
 if(history.length>1&&document.referrer&&document.referrer.indexOf(location.origin)===0&&/\/manual\//.test(document.referrer)){history.back();return}
 try{window.close()}catch(x){}
 setTimeout(function(){if(c){location.href=%s;return}h.hidden=false;h.scrollIntoView({block:'nearest'})},250)});
var t=location.hash&&document.getElementById(decodeURIComponent(location.hash.slice(1)));if(t)setTimeout(function(){t.scrollIntoView()},60)})();""" % repr(CLAUDE_APP)


def page(key, title, md_text, ver, date, P):
    body = markdown.markdown(md_text, extensions=['attr_list', 'tables'], output_format='html')
    body = re.sub(r'<table>', '<div class="tw"><table>', body).replace('</table>', '</table></div>')
    def img(m):
        a = m.group(1); w, h = webp_size(P('manual', re.search(r'src="([^"]+)"', a).group(1)))
        return '<img %s width="%d" height="%d" decoding="async">' % (a, w, h)
    body = re.sub(r'<img ([^>]*?)\s*/?>', img, body)
    toc = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body)
    toc_html = ('<details class="toc"><summary>目次（押すとその章へ）</summary><ol>' +
                ''.join('<li><a href="#%s">%s</a></li>' % (i, re.sub(r'<[^>]+>', '', t)) for i, t in toc) +
                '</ol></details>') if toc else ''
    # h1 のすぐ後に「読むだけ」の注意と目次
    note = '<p class="ro">このページは読むだけのマニュアルです。書き換えはできません（内容の直しはClaudeが行います）。青い字を押すと、その場所へ移ります。</p>'
    body = re.sub(r'(</h1>)', r'\1' + note + toc_html, body, count=1)
    others = '<nav class="others">' + ''.join('<a href="%s.html">%s</a>' % (k, n) for k, n in DOCS if k != key) + '</nav>'
    return ('<!doctype html>\n<html lang="ja"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<meta name="robots" content="noindex"><meta name="color-scheme" content="light dark">'
            '<meta name="theme-color" content="#ffd23f">'
            '<title>%s｜タクシー売上日報</title><style>%s</style></head><body>\n'
            '<header class="bar"><a class="back" id="back" href="#" role="button">‹ 戻る</a><span class="t">%s</span></header>\n'
            '<p class="ro hint" id="backhint" hidden>iPhoneのホーム画面のアプリから開いたときは、左上か下の「完了」を押すと、アプリに戻ります。ほかの画面で開いたときは、この画面（タブ）を閉じてください。</p>\n'
            '<main>\n%s\n%s\n</main>\n<footer>タクシー売上日報 %s（%s）のマニュアル。読むだけのページです。</footer>\n'
            '<script>%s</script>\n</body></html>\n') % (
        html.escape(title), CSS.strip(), html.escape(title), body, others, ver, date, JS)


def build(P, src):
    ver = re.search(r"APP_VER='([^']+)'", src).group(1)
    date = re.search(r"APP_DATE='([^']+)'", src).group(1)
    out = {}
    for key, title in DOCS:
        md_text = open(P('manual', 'src', key + '.md'), encoding='utf8').read()
        out['manual/%s.html' % key] = page(key, title, md_text, ver, date, P)
    return out
