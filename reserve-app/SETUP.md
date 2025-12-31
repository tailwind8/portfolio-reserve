# セットアップガイド

このドキュメントでは、予約システムの開発環境セットアップ手順を説明します。

## 📋 目次

- [クイックスタート](#クイックスタート)
- [詳細セットアップ](#詳細セットアップ)
- [CI/CD設定](#cicd設定)
- [トラブルシューティング](#トラブルシューティング)

## 前提条件

- Node.js 20.x 以上
- npm または yarn
- Supabaseアカウント

---

## 🚀 クイックスタート

自動セットアップスクリプトを使用する場合：

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd reserve-system/reserve-app

# 2. 開発環境を自動セットアップ
./scripts/setup-dev.sh

# 3. .env.local を編集してSupabase認証情報を追加
# vim .env.local

# 4. マイグレーションを再実行
npm run prisma:migrate

# 5. 開発サーバーを起動
npm run dev
```

詳細な手動セットアップ手順は以下をご覧ください。

---

## 1. 環境変数の設定

### ステップ1: `.env.example`をコピー

```bash
cp .env.example .env.local
```

> **Note**: Next.jsでは、ローカル環境の秘密情報は`.env.local`に保存することが推奨されています。このファイルはGitで管理されません。

### ステップ2: Supabaseプロジェクトを作成

1. [Supabase](https://app.supabase.com/)にログイン
2. 新しいプロジェクトを作成
3. プロジェクト名: `reserve-system`（任意）
4. データベースパスワードを設定（保存しておく）

### ステップ3: 環境変数を設定

Supabaseダッシュボードから必要な情報を取得し、`.env.local`ファイルを編集：

**Settings > Database > Connection String** から取得:
```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

**Settings > API** から取得:
```env
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"

# 新しいAPIキー（2025年版 - sb_publishable_...形式）
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_SECRET_KEY="sb_secret_..."

# レガシーキー（古いプロジェクトの場合のみ）
# NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

> **Note**: 2025年11月以降の新規プロジェクトは `publishable` と `secret` キーのみを提供します。レガシーキー（`anon`/`service_role`）は段階的に廃止されます。

### ステップ4: テナントIDを設定（マルチポートフォリオ対応）

```env
NEXT_PUBLIC_TENANT_ID="demo-restaurant"
```

別のポートフォリオシステムを作成する場合は、別のテナントIDを使用してください（例: `demo-hotel`, `demo-clinic`）。

---

## 2. データベースマイグレーション

### Prisma Clientの生成

```bash
npm run prisma:generate
# または
npx prisma generate
```

### マイグレーションの実行

```bash
npm run prisma:migrate
# または
npx prisma migrate dev --name init
```

### データベースのリセット（必要な場合）

```bash
# スクリプトを使用
./scripts/db-reset.sh

# または手動で
npx prisma migrate reset --force
```

### 初期データの投入（オプション）

```bash
# スクリプトを使用
./scripts/db-seed.sh

# または手動で
npx prisma db seed
```

---

## 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## 4. Vercelへのデプロイ

### ステップ1: Vercelプロジェクトを作成

```bash
vercel
```

### ステップ2: 環境変数を設定

Vercelダッシュボード > Settings > Environment Variables で以下を設定：

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `DATABASE_URL` | Supabaseの接続URL（pooler） | Production, Preview, Development |
| `DIRECT_URL` | Supabaseの直接接続URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | Production, Preview |
| `NEXT_PUBLIC_TENANT_ID` | テナントID（例: demo-restaurant） | Production, Preview, Development |

### ステップ3: デプロイ

```bash
vercel --prod
```

---

## 5. データベーススキーマ構成

### テーブル一覧

| テーブル名 | 説明 |
|-----------|------|
| `restaurant_users` | ユーザー情報 |
| `restaurant_staff` | スタッフ情報 |
| `restaurant_menus` | メニュー情報 |
| `restaurant_reservations` | 予約情報 |
| `restaurant_settings` | 店舗設定 |

すべてのテーブルに`tenant_id`カラムがあり、マルチポートフォリオ対応しています。

### マルチテナント設計

複数のポートフォリオシステム（予約システム、ホテル管理システムなど）を同じデータベースで管理する場合：

- 各テーブルに`tenant_id`を含める
- テーブル名にプレフィックス（`restaurant_*`, `hotel_*`など）を使用
- クエリ時に必ず`tenant_id`でフィルタリング

---

## 6. CI/CD設定

このプロジェクトはGitHub ActionsとVercelを使用した自動CI/CDパイプラインを備えています。

### GitHub Actions

- ✅ 自動lint、型チェック、ビルド
- ✅ 単体テスト（カバレッジ付き）
- ✅ E2Eテスト（Playwright）
- ✅ PRでの自動プレビューデプロイ
- ✅ mainマージで本番デプロイ

詳細は [docs/CICD_SETUP.md](./docs/CICD_SETUP.md) を参照してください。

### 必要なGitHub Secrets

| Secret名 | 説明 |
|---------|------|
| `VERCEL_TOKEN` | Vercel APIトークン |
| `VERCEL_ORG_ID` | Vercel組織ID |
| `VERCEL_PROJECT_ID` | VercelプロジェクトID |

### Vercel設定ファイル

`vercel.json` でビルド設定、環境変数、ヘッダー、関数の設定を管理しています。

---

## 7. 便利なスクリプト

### 開発環境セットアップ

```bash
./scripts/setup-dev.sh
```

### データベースリセット

```bash
./scripts/db-reset.sh
```

### データベースシード

```bash
./scripts/db-seed.sh
```

---

## トラブルシューティング

### マイグレーションエラー

```bash
# キャッシュをクリア
rm -rf node_modules/.prisma
npx prisma generate
```

### データベース接続エラー

- `.env`のDATABASE_URLが正しいか確認
- Supabaseプロジェクトが起動しているか確認
- ファイアウォールやVPNの設定を確認

### Prisma Clientが見つからない

```bash
npx prisma generate
```

---

## 参考リンク

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
