# Supabase セットアップガイド（2025年版）

このガイドでは、新しいSupabase APIキーシステムを使用した設定方法を説明します。

## 📌 新しいAPIキーシステムについて

2025年以降、Supabaseは新しいAPIキーフォーマットを導入しました：

| 旧キー名 | 新キー名 | フォーマット | 用途 |
|---------|---------|------------|------|
| `anon` key | **Publishable** key | `sb_publishable_...` | クライアント側（安全） |
| `service_role` key | **Secret** key | `sb_secret_...` | サーバー側（管理者権限） |

### 重要な違い

- **互換性**: 新しいキーは旧キーと同じように使えます
- **セキュリティ**: Secret keyは個別にリビールする必要があり、監査ログに記録されます
- **ローテーション**: 独立してローテーション可能（ダウンタイムなし）

---

## 🚀 セットアップ手順

### ステップ1: Supabaseダッシュボードにアクセス

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. 作成済みのプロジェクトを選択
3. 左サイドバーから `Settings` > `API` を開く

### ステップ2: API情報を取得

#### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```
`Project URL` セクションからコピー

#### Publishable Key（新形式）
```
sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
`API Keys` セクションの `Publishable (anon)` からコピー

> **注意**: レガシープロジェクトの場合、`anon` キーが表示されることがあります（`eyJhbGci...`形式）。どちらでも動作します。

#### Secret Key（新形式）
```
sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
`API Keys` セクションの `Secret (service_role)` の **Reveal** ボタンをクリックしてコピー

> **警告**: Secret Keyは絶対にクライアント側（ブラウザ）で使用しないでください！

---

### ステップ3: Database接続情報を取得

1. `Settings` > `Database` を開く
2. `Connection String` セクションから以下をコピー：

#### Connection Pooling（推奨）
```
Mode: Transaction
Port: 6543
```

例:
```
postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

#### Direct Connection（マイグレーション用）
```
Port: 5432
```

例:
```
postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
```

> **ヒント**: `[YOUR-PASSWORD]` の部分を、プロジェクト作成時に設定したデータベースパスワードに置き換えてください。

---

### ステップ4: .envファイルを作成

プロジェクトルートで以下を実行：

```bash
cp .env.example .env
```

`.env` ファイルを編集して、取得した情報を設定：

```env
# Database
DATABASE_URL="postgresql://postgres.xxxxxxxxxxxxx:YOUR_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxxxxxxxxxx:YOUR_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# Supabase API (新形式)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SUPABASE_SECRET_KEY="sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Application
NEXT_PUBLIC_TENANT_ID="demo-restaurant"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### ステップ5: データベースマイグレーションを実行

```bash
# Prisma Clientを生成
npm run prisma:generate

# マイグレーションを実行（テーブル作成）
npm run prisma:migrate
```

プロンプトが表示されたら、マイグレーション名を入力（例: `init`）

### ステップ6: 接続確認

開発サーバーを起動：
```bash
npm run dev
```

ヘルスチェックAPIで接続確認：
```bash
curl http://localhost:3000/api/health
```

成功すると以下のようなレスポンスが返ります：
```json
{
  "status": "ok",
  "message": "Database connection successful",
  "timestamp": "2025-12-30T09:00:00.000Z"
}
```

---

## 🔧 トラブルシューティング

### エラー: "Missing Supabase environment variables"

`.env` ファイルが正しく読み込まれていません。

**解決方法**:
1. `.env` ファイルがプロジェクトルート（`reserve-app/`）にあることを確認
2. 開発サーバーを再起動

### エラー: "Database connection failed"

データベース接続情報が間違っています。

**チェックポイント**:
- `DATABASE_URL` のパスワードが正しいか
- ファイアウォール/VPNがSupabase接続をブロックしていないか
- Supabaseプロジェクトが起動しているか（ダッシュボードで確認）

### レガシーキーしか表示されない場合

古いプロジェクトの場合、`anon` と `service_role` キー（`eyJhbGci...`形式）のみが表示されます。

**対応方法**:
`.env` ファイルでレガシーキーを使用：
```env
# レガシーキーを使用する場合
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

コードは自動的にフォールバックするため、変更不要です。

---

## 📚 参考リンク

- [Understanding API keys | Supabase Docs](https://supabase.com/docs/guides/api/api-keys)
- [Upcoming changes to Supabase API Keys](https://github.com/orgs/supabase/discussions/29260)
- [Use of new API keys discussion](https://github.com/orgs/supabase/discussions/40300)

---

## 次のステップ

セットアップが完了したら：

1. **初期データを投入**: `npm run prisma:seed`（作成予定）
2. **Prisma Studioでデータ確認**: `npm run prisma:studio`
3. **認証機能の実装**: Issue #5-7に進む
