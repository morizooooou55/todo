# Supabaseでユーザーごとに保存する手順

## 1. Supabaseでプロジェクトを作る

Supabaseで新しいプロジェクトを作ります。

## 2. SQLを実行する

Supabaseの画面で `SQL Editor` を開きます。
このフォルダの `supabase.sql` の中身を貼り付けて実行します。

これで `tasks` テーブルができます。
Row Level Securityも有効になり、ログインした本人のTODOだけ読める・書ける状態になります。

## 3. API情報を入れる

Supabaseの `Project Settings` > `API` を開きます。

次の2つを `supabase-config.js` に入れてください。

- Project URL
- anon public key

```js
window.SUPABASE_CONFIG = {
  url: "https://xxxxxxxx.supabase.co",
  anonKey: "xxxxxxxx",
};
```

`service_role` keyは絶対に入れないでください。
ブラウザに入れてよいのは `anon public key` だけです。

## 4. GitHubにアップロードする

追加で必要なファイルはこの2つです。

- `supabase-config.js`
- `supabase.sql`

アプリで使うのは `supabase-config.js` です。
`supabase.sql` は設定メモとして置いておくファイルです。

## 注意

ログイン状態はブラウザに保存されます。
TODO本体はSupabaseのデータベースに保存されます。
