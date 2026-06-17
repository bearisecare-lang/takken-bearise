# 宅建士 合格ナビ — Webアプリ公開手順

このフォルダは、宅建学習アプリを **Webアプリ（PWA）** として公開するための一式です。
スマホのホーム画面に追加すれば、アプリのように全画面で使えます。
学習データ（解答履歴・弱点・テキスト進捗・ブックマーク）は端末に自動保存され、閉じても残ります。

---

## 必要なもの（無料）
- GitHub アカウント … https://github.com
- Vercel アカウント … https://vercel.com （GitHubでログイン可）

パソコンでの操作を想定していますが、後述の「② GitHubに直接アップロード」ならスマホでも可能です。

---

## 手順

### ① このフォルダ一式を用意する
`takken-pwa` フォルダの中身（package.json, index.html, src, public など）をすべて使います。
`node_modules` や `dist` は不要です（自動生成されます）。

### ② GitHubにアップロードする
1. GitHubで新しいリポジトリを作成（例：`takken-goukaku`）。Public/Privateどちらでも可。
2. 作成したリポジトリの画面で「uploading an existing file」をクリック。
3. `takken-pwa` フォルダの中身をドラッグ&ドロップでアップロード。
   - 重要：`takken-pwa` フォルダごとではなく、**中身**（package.json等）を直下に置く。
4. 「Commit changes」で確定。

### ③ Vercelで公開する
1. https://vercel.com にGitHubアカウントでログイン。
2. 「Add New...」→「Project」。
3. さきほどのGitHubリポジトリを「Import」。
4. 設定はそのままでOK（Viteは自動検出されます）。
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 「Deploy」をクリック。1〜2分で完了。
6. 発行されたURL（例：`takken-goukaku.vercel.app`）が公開アドレスです。

以降、GitHubのファイルを更新するたびにVercelが自動で再公開します。

---

## スマホのホーム画面に追加（PWA）
- **iPhone（Safari）**: 公開URLを開く → 共有ボタン → 「ホーム画面に追加」
- **Android（Chrome）**: 公開URLを開く → メニュー → 「アプリをインストール」

これで全画面のアプリとして起動できます。

---

## 補足
- **ログイン（Supabase認証）**: メール＋パスワードのログインは Supabase で管理されます。学習データは現在この端末のブラウザに保存されていますが、ログイン基盤が整ったので、今後クラウド同期に拡張できます。
- **メール確認の切り替え**: 開発中は Supabase 管理画面の Authentication → Providers → Email で「Confirm email」をオフにすると、登録後すぐログインできてテストが楽です。公開前にオンにしてください。
- **AI機能について**: 「AI問題生成」「解説の充実」はWeb公開版では動作しません（現在UIには表示されていません）。過去問演習・テキスト学習・弱点まとめはすべて動作します。
- **アプリの更新**: `src/TakkenApp.jsx` を新しい版に差し替えてGitHubにアップロードし直すだけで、自動で反映されます。

## Supabase の設定値について
`src/TakkenApp.jsx` の冒頭に、Supabase の Project URL と公開キー（sb_publishable_...）が記載されています。
これらはブラウザに公開しても安全な値です。もし将来キーを再発行した場合は、この2行を新しい値に書き換えてください。
**秘密鍵（service_role）は絶対にここに書かないでください。**


---

## ローカルで試したい場合（任意・パソコン）
```
npm install
npm run dev
```
表示されたURL（http://localhost:5173 など）をブラウザで開く。
本番ビルドの確認は `npm run build` → `npm run preview`。
