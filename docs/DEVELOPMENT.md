# 開発ガイドライン

## 開発コマンド

Node.js で作業する上での基本操作

```bash
# テスト実行
npm run test

# 開発サーバー起動 (ブラウザ上で直に TypeScript + Vue を変換)
npm run dev

# ビルド (dist/ に出力)
npm run build

# ビルド結果のプレビュー (dist/ の内容をローカルサーバーで確認)
npm run preview
```

## デプロイ

本プロジェクトは GitHub Pages でホスティングされています。

### デプロイ方法

1. コードを `main` ブランチにプッシュ
2. GitHub Actions が自動的にビルドとデプロイを実行
3. デプロイ完了後、以下のURLでアクセス可能:
   - `https://sisomoti.github.io/gakumasu_comulist/`

### 手動デプロイ

GitHub Actions のワークフロー画面から `Deploy to GitHub Pages` を手動実行することも可能です。

### 初回セットアップ

初回デプロイ時は、GitHub リポジトリの設定で GitHub Pages を有効化する必要があります：

1. リポジトリの **Settings** → **Pages** に移動
2. **Source** で **GitHub Actions** を選択
3. これでワークフローによる自動デプロイが有効になります
