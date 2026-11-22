# タクシー売上日報

iPhoneのホーム画面に置いて使う、タクシーの売上日報アプリです。公開先：https://rymannio-debug.github.io/taxi-nippo/

## 中身
| 場所 | 中身 |
| --- | --- |
| `src/app.html` | アプリ本体（Claude版と同じもの） |
| `src/head.html` | ページの頭の部分 |
| `manual/src/*.md` | マニュアルの原稿（かんたん手順書・図解マニュアル・使い方マニュアル）。直すのは Claude だけ |
| `manual/img/` | マニュアルの図 |
| `manual/*.html` | 公開される読むだけのマニュアル（`tools/build.py` で作る） |
| `tools/build.py` | `src` から公開用の `index.html`・`manifest.webmanifest`・`sw.js` を、`manual/src` からマニュアルのページを作る（`pip install markdown==3.11` が要る） |
| `tests/` | 自動テスト（`node tests/run.js`） |
| `index.html` ほか | 公開されるファイル（`tools/build.py` で作る） |
| `CHANGELOG.md` | 変更の記録 |

## 更新の流れ
1. `src/app.html` やマニュアルの原稿を直し、`python3 tools/build.py` で公開用のファイルを作る
2. `dev` ブランチに入れる
3. GitHub Actions が自動でテストする（Chromium と WebKit。WebKit は iPhone の Safari と同じしくみ）
4. 全部通ったら、自動で `main` に反映され、GitHub Pages で公開される

手元でテストするとき：`npm ci` → `npx playwright install chromium` → `node tests/run.js`（WebKit は `BROWSER=webkit`）

記録は使う人のiPhoneの中だけにあり、このリポジトリには入りません。
