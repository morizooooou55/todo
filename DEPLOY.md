# 無料でWebから開けるようにする手順

このアプリは `index.html`、`styles.css`、`app.js` だけで動く静的サイトです。
サーバーの準備やビルド作業は必要ありません。

## いちばん簡単: Netlify Drop

1. Netlifyにログインします。
2. Netlify Dropを開きます: https://app.netlify.com/drop
3. このフォルダ、または `todo-calendar-web.zip` をドラッグします。
4. 発行された `https://...netlify.app` のURLを開きます。

ビルドコマンドは不要です。

## GitHubで公開する場合: GitHub Pages

1. GitHubで新しい公開リポジトリを作ります。
2. このフォルダのファイルをアップロードします。
3. リポジトリの Settings > Pages を開きます。
4. Sourceを `Deploy from a branch` にします。
5. Branchを `main`、フォルダを `/ (root)` にして保存します。
6. 少し待つと、次のようなURLで開けます。

```text
https://ユーザー名.github.io/リポジトリ名/
```

## 注意

タスクの保存はブラウザ内の `localStorage` です。
つまり、入力したTODOはその人のスマホやPCのブラウザに保存されます。
公開URLを共有しても、ほかの人のTODOが見えるわけではありません。
