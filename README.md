# やることカレンダー

TODOリストとカレンダーを合わせた静的Webアプリです。

## 公開方法

GitHub Pagesを使うと、無料でWebから開けるようにできます。

1. GitHubで新しい公開リポジトリを作ります。
2. このフォルダのファイルをそのリポジトリに入れます。
3. GitHubのリポジトリ画面で `Settings` > `Pages` を開きます。
4. `Source` を `Deploy from a branch` にします。
5. `Branch` は `main`、フォルダは `/ (root)` を選んで保存します。
6. 少し待つと、Webで開けるURLができます。

公開URLの形は、だいたい次のようになります。

```text
https://ユーザー名.github.io/リポジトリ名/
```

## ファイル構成

- `index.html`: 画面のHTML
- `styles.css`: レイアウトとデザイン
- `app.js`: カレンダー、TODO、保存処理

## 保存について

タスクはブラウザの `localStorage` に保存されます。
かんたんに言うと、予定やTODOは「その人のスマホやPCのブラウザの中」に保存されます。

そのため、同じ公開URLを開いても、ほかの人のTODOは見えません。
