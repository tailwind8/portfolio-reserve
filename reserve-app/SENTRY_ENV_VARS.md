# Sentry環境変数設定

Sentryを有効化するために、以下の環境変数を`.env.local`に追加してください。

## 必須環境変数

### NEXT_PUBLIC_SENTRY_DSN
Sentry Data Source Name（DSN）。Sentryプロジェクトから取得します。

```bash
NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

**取得方法**:
1. https://sentry.io/ にログイン
2. プロジェクトを作成または選択
3. Settings → Client Keys (DSN) からDSNをコピー

## オプション環境変数

### NEXT_PUBLIC_ENVIRONMENT
実行環境を指定します（development/staging/production）。

```bash
NEXT_PUBLIC_ENVIRONMENT=development
```

**デフォルト**: `NODE_ENV`の値を使用

### NEXT_PUBLIC_SENTRY_RELEASE
リリースバージョンを指定します。エラーを特定のリリースに紐付けます。

```bash
NEXT_PUBLIC_SENTRY_RELEASE=v1.0.0
```

**デフォルト**: 未設定

### SENTRY_ORG
Sentryの組織名（ソースマップアップロード用）。

```bash
SENTRY_ORG=your-organization-name
```

### SENTRY_PROJECT
Sentryのプロジェクト名（ソースマップアップロード用）。

```bash
SENTRY_PROJECT=reserve-system
```

### SENTRY_AUTH_TOKEN
Sentryの認証トークン（ソースマップアップロード用）。

```bash
SENTRY_AUTH_TOKEN=your-auth-token
```

**取得方法**:
1. https://sentry.io/ にログイン
2. Settings → Auth Tokens
3. "Create New Token" をクリック
4. スコープ: `project:releases` と `org:read` を選択
5. トークンをコピー

**⚠️ 注意**: このトークンは機密情報です。リポジトリにコミットしないでください。

## .env.localファイル例

```bash
# Sentry設定
NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_SENTRY_RELEASE=v1.0.0

# ビルド時のみ必要（本番環境）
# SENTRY_ORG=your-organization-name
# SENTRY_PROJECT=reserve-system
# SENTRY_AUTH_TOKEN=your-auth-token
```

## 本番環境での設定

Vercelなどのホスティングプラットフォームでは、環境変数をUI経由で設定してください。

**Vercelの場合**:
1. Project Settings → Environment Variables
2. 上記の環境変数を追加
3. Production/Preview/Development環境ごとに設定

## Sentryを無効化する方法

開発中にSentryを無効化したい場合、`NEXT_PUBLIC_SENTRY_DSN`を空文字列に設定してください。

```bash
NEXT_PUBLIC_SENTRY_DSN=
```

または、環境変数を削除してください。
