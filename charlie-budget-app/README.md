# Charlie 家計簿

使った金額だけ入力するシンプルな家計簿アプリです。元の `charlie家計簿.xlsx` の設定値と2026年6月までの記録を初期データとして反映しています。

## できること

- 日付と金額だけで支出を入力
- 月予算、残り予算、日上限超過、平均支出を自動更新
- 月タグの期間は毎月10日始まりで集計
- Supabase設定がある場合は匿名ユーザーごとに保存
- Supabase未設定でもローカルのデモとして動作

## ローカル起動

```bash
npm install
npm run dev
```

## Supabase

1. Supabaseで新しいプロジェクトを作成します。
2. Authentication settingsで匿名サインインを有効にします。
3. SQL Editorで `supabase/schema.sql` を実行します。
4. `.env.example` を参考に `.env.local` を作成します。

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Vercel

VercelでGitHubリポジトリをImportし、環境変数に以下を設定します。

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Build Commandは `npm run build`、Output Directoryは `dist` です。`vercel.json` にも同じ内容を入れています。

## GitHub

GitHubへ反映する場合は、このフォルダでリポジトリを作成してpushします。

```bash
git init
git add .
git commit -m "Create simple budget app"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```
