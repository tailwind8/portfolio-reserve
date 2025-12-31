# CI/CD Setup Guide

このドキュメントでは、GitHub ActionsとVercelを使用したCI/CDパイプラインのセットアップ方法を説明します。

## 📋 目次

- [GitHub Actions CI/CD](#github-actions-cicd)
- [Vercel デプロイ](#vercel-デプロイ)
- [環境変数の設定](#環境変数の設定)
- [トラブルシューティング](#トラブルシューティング)

## 🔄 GitHub Actions CI/CD

### ワークフロー概要

`.github/workflows/ci.yml` には以下のジョブが定義されています：

#### 1. `lint-and-test` ジョブ

すべてのPRとmainブランチへのpushで実行されます。

- ✅ ESLint による静的解析
- ✅ TypeScript 型チェック
- ✅ Next.js ビルド
- ✅ Jest 単体テスト（カバレッジ付き）
- ✅ Playwright E2Eテスト
- 📊 テストカバレッジレポートのアップロード
- 📊 E2Eテスト結果のアップロード

#### 2. `deploy-preview` ジョブ

PRが作成されたときに実行されます。

- 🚀 Vercel Preview環境への自動デプロイ
- ✅ テストが成功した場合のみデプロイ

#### 3. `deploy-production` ジョブ

mainブランチへのpushで実行されます。

- 🚀 Vercel Production環境への自動デプロイ
- ✅ テストが成功した場合のみデプロイ

### テストカバレッジ

テストカバレッジは自動的に [Codecov](https://codecov.io/) にアップロードされます。

- カバレッジレポートは各PRに自動コメント
- カバレッジバッジをREADMEに追加可能

## 🚀 Vercel デプロイ

### 初回セットアップ

#### 1. Vercelプロジェクトの作成

```bash
# Vercel CLIのインストール
npm i -g vercel

# Vercelにログイン
vercel login

# プロジェクトをリンク
cd reserve-app
vercel link
```

#### 2. プロジェクト情報の取得

```bash
# .vercel/project.json から以下の情報を取得
# - projectId (VERCEL_PROJECT_ID)
# - orgId (VERCEL_ORG_ID)
```

#### 3. Vercel Tokenの取得

1. [Vercel ダッシュボード](https://vercel.com/account/tokens) にアクセス
2. 新しいトークンを作成
3. トークンをコピー（VERCEL_TOKEN）

### GitHub Secrets の設定

以下のSecretsをGitHubリポジトリに追加します：

Settings → Secrets and variables → Actions → New repository secret

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `VERCEL_TOKEN` | Vercel API トークン | Vercel ダッシュボードで作成 |
| `VERCEL_ORG_ID` | Vercel 組織ID | `.vercel/project.json` の `orgId` |
| `VERCEL_PROJECT_ID` | Vercel プロジェクトID | `.vercel/project.json` の `projectId` |

### Vercel環境変数の設定

Vercelダッシュボードで以下の環境変数を設定します：

Settings → Environment Variables

#### Production & Preview環境

```bash
# Database
DATABASE_URL=postgresql://postgres:***@db.xxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:***@db.xxx.supabase.co:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_***
SUPABASE_SECRET_KEY=sb_secret_***

# Application
NEXT_PUBLIC_TENANT_ID=demo-restaurant
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# Environment
NODE_ENV=production
```

## 🔐 環境変数の設定

### ローカル開発環境

1. `.env.example` を `.env.local` にコピー

```bash
cp .env.example .env.local
```

2. Supabaseの接続情報を設定

```bash
# Supabaseダッシュボードから取得
# Project Settings → Database → Connection string
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

# Project Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_***"
SUPABASE_SECRET_KEY="sb_secret_***"
```

### CI環境（GitHub Actions）

GitHub Actionsでは、ビルド時のみ必要な環境変数を自動設定：

```yaml
env:
  DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy"
```

実際のデータベース接続は不要で、ダミー値で型チェックとビルドが通ります。

## 🛠️ トラブルシューティング

### ビルドエラー: "DATABASE_URL is not defined"

**原因**: ビルド時にDATABASE_URLが必要です

**解決策**:
- ローカル: `.env.local` を作成してDATABASE_URLを設定
- CI: ワークフロー内で環境変数を設定（すでに設定済み）
- Vercel: 環境変数をVercelダッシュボードで設定

### E2Eテストが失敗する

**原因**: Playwrightブラウザがインストールされていない

**解決策**:
```bash
npx playwright install chromium --with-deps
```

### Vercelデプロイが失敗する

**チェックリスト**:
1. ✅ GitHub Secretsが正しく設定されているか
2. ✅ Vercel環境変数が設定されているか
3. ✅ `vercel.json` が正しく配置されているか
4. ✅ ビルドコマンドが正しいか

### テストカバレッジがアップロードされない

**原因**: Codecovトークンが設定されていない

**解決策**:
1. [Codecov](https://codecov.io/) でリポジトリを有効化
2. トークンを取得
3. GitHub Secretsに `CODECOV_TOKEN` を追加

## 📚 参考リンク

- [GitHub Actions Documentation](https://docs.github.com/ja/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Codecov Documentation](https://docs.codecov.com/)
- [Playwright Documentation](https://playwright.dev/)

## 🎯 次のステップ

1. ✅ GitHub ActionsワークフローをカスタマイズしてCI時間を最適化
2. ✅ Lighthouse CI を追加してパフォーマンス測定
3. ✅ Dependabot を設定して依存関係の自動更新
4. ✅ Semantic Release を導入して自動バージョニング
