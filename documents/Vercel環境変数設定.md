# Vercel環境変数設定ガイド

**最終更新**: 2025-12-31

---

## 🎯 概要

このガイドでは、Vercelプロジェクトに必要な環境変数の設定方法を説明します。

---

## 📋 必要な環境変数

### 1. データベース関連

| 環境変数名 | 説明 | 例 |
|-----------|------|-----|
| `DATABASE_URL` | Supabase PostgreSQL接続URL（Pooled Connection） | `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres` |
| `DIRECT_URL` | Prismaマイグレーション用直接接続URL | `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres` |

### 2. Supabase関連（新APIキー - 2025）

| 環境変数名 | 説明 | セキュリティレベル |
|-----------|------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase公開キー（`sb_publishable_...`） | Public |
| `SUPABASE_SECRET_KEY` | Supabaseシークレットキー（`sb_secret_...`） | **Secret** ⚠️ |

**⚠️ 注意:**
- 2025年以降のSupabaseプロジェクトでは、新しいAPIキー形式（`sb_publishable_...` / `sb_secret_...`）を使用します
- レガシーキー（`anon_key` / `service_role_key`）は古いプロジェクトでのみ使用

### 3. アプリケーション設定

| 環境変数名 | 説明 | 例 |
|-----------|------|-----|
| `NEXT_PUBLIC_TENANT_ID` | テナントID（マルチポートフォリオ対応） | `demo-restaurant` |
| `NEXT_PUBLIC_BASE_URL` | アプリケーションのベースURL | `https://reserve-app.vercel.app` |
| `NODE_ENV` | 環境（自動設定） | `production` |

### 4. メール送信（オプション）

| 環境変数名 | 説明 | 必須 |
|-----------|------|------|
| `EMAIL_FROM` | 送信元メールアドレス | 任意 |
| `EMAIL_PROVIDER` | メールプロバイダー（`resend` / `sendgrid`） | 任意 |
| `RESEND_API_KEY` | Resend APIキー | 任意 |
| `SENDGRID_API_KEY` | SendGrid APIキー | 任意 |

---

## 🚀 Vercelでの設定手順

### ステップ1: Vercelプロジェクトにアクセス

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. 対象プロジェクトを選択

### ステップ2: 環境変数ページへ移動

1. プロジェクト設定（Settings）を開く
2. 左メニューから「Environment Variables」を選択

### ステップ3: 環境変数を追加

各環境変数を以下の手順で追加：

1. **Name**: 環境変数名を入力（例: `DATABASE_URL`）
2. **Value**: 値を入力（例: Supabaseの接続URL）
3. **Environments**: 適用環境を選択
   - ✅ **Production**: 本番環境
   - ✅ **Preview**: プレビュー環境（PR作成時）
   - ✅ **Development**: 開発環境（ローカル）
4. **Add** ボタンをクリック

### ステップ4: Supabase情報の取得

#### DATABASE_URL の取得

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. 左メニュー「Settings」→「Database」
4. **Connection Pooling**セクションの「Connection string」をコピー
   - Mode: `Session` または `Transaction`
   - Format: `URI`
   - 例: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

#### DIRECT_URL の取得

1. 同じ「Database」ページの**Connection string**セクション
2. 「URI」形式の接続文字列をコピー
   - 例: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

#### Supabase APIキーの取得

1. Supabaseプロジェクトの左メニュー「Settings」→「API」
2. **Project URL**をコピー → `NEXT_PUBLIC_SUPABASE_URL`
3. **Publishable Key**（`sb_publishable_...`）をコピー → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. **Secret Key**（`sb_secret_...`）をコピー → `SUPABASE_SECRET_KEY`

**⚠️ 重要:**
- **Secret Key**は絶対に公開しないでください
- GitHubリポジトリにコミットしないでください

---

## 🔐 GitHub ActionsでのVercel連携設定

### 必要なGitHub Secrets

GitHub ActionsからVercelにデプロイするために、以下のシークレットを設定します。

#### ステップ1: Vercel Tokenの取得

1. [Vercel Account Settings](https://vercel.com/account/tokens) にアクセス
2. 「Create Token」ボタンをクリック
3. Token名を入力（例: `GitHub Actions CI/CD`）
4. Scopeを選択（通常は「Full Account」）
5. 「Create」ボタンをクリック
6. 生成されたトークンをコピー（**一度しか表示されません**）

#### ステップ2: Vercel Project IDとOrg IDの取得

```bash
# プロジェクトディレクトリで実行
cd reserve-app

# Vercelにログイン
npx vercel login

# プロジェクトをリンク
npx vercel link

# .vercel/project.jsonが生成される
cat .vercel/project.json
```

出力例:
```json
{
  "projectId": "prj_XXXXXXXXXXXXXXXXXXXX",
  "orgId": "team_XXXXXXXXXXXXXXXXXXXX"
}
```

- `projectId` → `VERCEL_PROJECT_ID`
- `orgId` → `VERCEL_ORG_ID`

#### ステップ3: GitHub Secretsに登録

1. GitHubリポジトリページへ移動
2. 「Settings」→「Secrets and variables」→「Actions」
3. 「New repository secret」をクリック
4. 以下の3つのシークレットを追加:

| Name | Value |
|------|-------|
| `VERCEL_TOKEN` | Vercel Tokenの値 |
| `VERCEL_ORG_ID` | `.vercel/project.json`の`orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json`の`projectId` |

---

## ✅ 設定確認チェックリスト

### Vercel環境変数

- [ ] `DATABASE_URL` が設定されている（Production, Preview）
- [ ] `DIRECT_URL` が設定されている（Production, Preview）
- [ ] `NEXT_PUBLIC_SUPABASE_URL` が設定されている（All environments）
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` が設定されている（All environments）
- [ ] `SUPABASE_SECRET_KEY` が設定されている（Production, Preview）
- [ ] `NEXT_PUBLIC_TENANT_ID` が設定されている（All environments）
- [ ] `NEXT_PUBLIC_BASE_URL` が設定されている（Production）

### GitHub Secrets

- [ ] `VERCEL_TOKEN` が登録されている
- [ ] `VERCEL_ORG_ID` が登録されている
- [ ] `VERCEL_PROJECT_ID` が登録されている

---

## 🧪 デプロイ動作確認

### 1. Preview環境のテスト

```bash
# 新しいブランチを作成
git checkout -b test/vercel-deploy

# 変更をコミット
git commit --allow-empty -m "test: Vercelデプロイテスト"

# プッシュ
git push origin test/vercel-deploy

# PR作成
gh pr create --title "[TEST] Vercelデプロイテスト" --body "Preview環境へのデプロイ動作確認"
```

**期待動作:**
- GitHub Actionsワークフローが自動実行される
- `deploy-preview`ジョブが成功する
- PRにVercel Preview URLが表示される

### 2. Production環境のテスト

```bash
# mainブランチにマージ
gh pr merge --merge

# GitHub Actionsが自動実行される
```

**期待動作:**
- `deploy-production`ジョブが実行される
- Vercel Production環境にデプロイされる
- `https://reserve-app.vercel.app`（実際のURL）でアクセス可能になる

---

## 🚨 トラブルシューティング

### エラー: `Error: No token specified`

**原因**: `VERCEL_TOKEN`が設定されていない

**解決策**:
1. Vercel Tokenを取得（上記手順参照）
2. GitHub Secretsに`VERCEL_TOKEN`を登録

### エラー: `Error: Project not found`

**原因**: `VERCEL_PROJECT_ID`または`VERCEL_ORG_ID`が間違っている

**解決策**:
1. `.vercel/project.json`を確認
2. 正しい値をGitHub Secretsに再登録

### エラー: `PrismaClientInitializationError: Can't reach database server`

**原因**: `DATABASE_URL`が間違っているか、Supabaseプロジェクトが停止している

**解決策**:
1. Supabase Dashboardでプロジェクトが稼働中か確認
2. `DATABASE_URL`の値を確認（パスワード、リージョンが正しいか）
3. Vercel環境変数を更新

### エラー: `Invalid API key`

**原因**: Supabase APIキーが間違っているか、期限切れ

**解決策**:
1. Supabase Dashboard「Settings」→「API」でキーを確認
2. 新しいキーを発行（必要であれば）
3. Vercel環境変数を更新

---

## 📚 関連ドキュメント

- [Vercel 公式ドキュメント](https://vercel.com/docs)
- [Supabase ドキュメント](https://supabase.com/docs)
- [Prisma ドキュメント](https://www.prisma.io/docs)
- `reserve-app/.env.example` - 環境変数テンプレート
- `.github/workflows/cicd.yml` - CI/CDワークフロー

---

**セキュリティ注意事項:**
- シークレットキーは絶対に公開リポジトリにコミットしないでください
- `.env.local`は`.gitignore`に含まれています
- `.env.example`のみバージョン管理されます
