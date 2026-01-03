# E2E認証情報の環境変数対応 - 進捗更新

**作成日**: 2026-01-03
**作成者**: Claude Code
**対応Issue**: #108（間接的）
**ブランチ**: `feature/admin-weekly-calendar`

---

## 📝 概要

E2Eテストで使用する管理者認証情報（メールアドレス・パスワード）をハードコーディングせず、環境変数から取得するように修正しました。

---

## 🎯 背景

### 問題点
- E2Eテスト内に `admin@example.com` / `admin123` がハードコーディングされていた
- 実際のSupabaseで設定した認証情報（`admin@example.com` / `Us%8d.a&-xTxE5T`）と一致しないため、全てのE2Eテストが認証エラーで失敗

### 要件
- テストコードに認証情報を直接書かない（セキュリティ）
- 環境変数で認証情報を管理
- デフォルト値も設定（環境変数が未設定でも動作）

---

## ✅ 実施内容

### 1. 修正したE2Eテストファイル（6ファイル）

以下のファイルで環境変数を使用するように修正しました：

1. **`src/__tests__/e2e/admin-weekly-calendar.spec.ts`**
2. **`src/__tests__/e2e/session-management.spec.ts`**
3. **`src/__tests__/e2e/boundary-values.spec.ts`**
4. **`src/__tests__/e2e/network-errors.spec.ts`**
5. **`src/__tests__/e2e/xss-csrf.spec.ts`**
6. **`src/__tests__/e2e/status-transition.spec.ts`**

### 2. 修正内容

各ファイルのimport部分に以下を追加：

```typescript
// E2E用の管理者認証情報を環境変数から取得
const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123';
```

ログイン処理を修正：

```typescript
// 修正前
await loginPage.login('admin@example.com', 'admin123');

// 修正後
await loginPage.login(E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD);
```

---

## 🔧 `.env.local` に追加する内容

`reserve-app/.env.local` ファイルに以下の2行を追加してください：

```bash
# E2E用の管理者認証情報
E2E_ADMIN_EMAIL=admin@example.com
E2E_ADMIN_PASSWORD=Us%8d.a&-xTxE5T
```

### 追加手順

```bash
# reserve-appディレクトリに移動
cd /Users/a-aoki/indivisual/2026/portfolio/reserve-system/reserve-app

# .env.localを編集（既存ファイルに追記）
# エディタで開いて以下を追加：
# E2E_ADMIN_EMAIL=admin@example.com
# E2E_ADMIN_PASSWORD=Us%8d.a&-xTxE5T

# 確認
cat .env.local | grep E2E
```

---

## 🧪 動作確認

### 1. 環境変数が読み込まれることを確認

`playwright.config.ts` では既に `.env.local` を読み込む設定があります：

```typescript
import dotenv from 'dotenv';

// .env.localファイルを読み込む
dotenv.config({ path: '.env.local' });
```

### 2. E2Eテストを実行

```bash
cd reserve-app

# 週間カレンダーのE2Eテストを実行
npm run test:e2e -- admin-weekly-calendar.spec.ts

# 全E2Eテストを実行
npm run test:e2e
```

### 期待される結果

- ✅ 認証エラーが解消される
- ✅ 管理者ログインが成功する
- ✅ 16個のテストが全て通過する（admin-weekly-calendar.spec.ts）

---

## 📊 環境変数の仕組み

### 読み込み順序

1. **Playwright起動時**: `playwright.config.ts` が `.env.local` を読み込む
2. **テスト実行時**: `process.env.E2E_ADMIN_EMAIL` などが利用可能になる
3. **未設定時**: デフォルト値（`'admin@example.com'` / `'admin123'`）が使用される

### セキュリティ

- ✅ `.env.local` は `.gitignore` に含まれており、Gitにコミットされない
- ✅ 認証情報がソースコードに直接記載されない
- ✅ CI/CD環境でも環境変数で設定可能

---

## 🚀 次のステップ

1. **`.env.local` に環境変数を追加**（上記の手順を参照）
2. **E2Eテストを実行**して全て通過することを確認
3. **コミット**して進捗を記録

### コミットメッセージ例

```bash
git add .
git commit -m "test: E2E認証情報を環境変数で管理

- E2Eテストで使用する管理者認証情報をハードコーディングから環境変数に変更
- E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD を導入
- デフォルト値も設定（環境変数未設定時）

対象ファイル:
- admin-weekly-calendar.spec.ts
- session-management.spec.ts
- boundary-values.spec.ts
- network-errors.spec.ts
- xss-csrf.spec.ts
- status-transition.spec.ts

🎯 Generated with Claude Code

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 📝 補足情報

### なぜ環境変数を使うのか？

1. **セキュリティ**: 認証情報をソースコードに書かない
2. **柔軟性**: 環境ごとに異なる認証情報を使用可能（開発/ステージング/本番）
3. **保守性**: 認証情報変更時にコードを変更する必要がない
4. **ベストプラクティス**: 12 Factor Appの原則に準拠

### CI/CD環境での設定

GitHub Actionsなどで実行する場合、リポジトリのSecretsに環境変数を設定：

```yaml
# .github/workflows/e2e-test.yml
env:
  E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
  E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
```

---

## ✅ チェックリスト

- [x] 6つのE2Eテストファイルを環境変数対応に修正
- [x] ドキュメント作成（このファイル）
- [ ] `.env.local` に環境変数を追加（ユーザー作業）
- [ ] E2Eテストを実行して通過を確認（ユーザー作業）
- [ ] コミット（ユーザー作業）

---

**以上で環境変数対応の実装は完了です。`.env.local`への追加をお願いします。**
