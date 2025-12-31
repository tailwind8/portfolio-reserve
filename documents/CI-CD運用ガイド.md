# CI/CD運用ガイド

**最終更新**: 2025-12-31

---

## 🎯 概要

このガイドでは、GitHub Actionsを使用したCI/CDパイプラインの運用方法を説明します。

---

## 📋 CI/CDワークフロー概要

### ワークフローファイル

| ファイル | トリガー | 実行内容 |
|---------|---------|---------|
| `.github/workflows/cicd.yml` | PR作成時 / mainマージ時 | Lint, Test, Build, Deploy |

### ジョブ構成

```
PR作成時:
  lint-and-test → deploy-preview

mainマージ時:
  lint-and-test → deploy-production
```

---

## 🚀 ワークフロー詳細

### 1. lint-and-test ジョブ

**目的**: コード品質とテストの自動実行

**実行ステップ:**

| # | ステップ名 | コマンド | 目的 |
|---|----------|---------|------|
| 1 | Checkout code | `actions/checkout@v4` | ソースコードを取得 |
| 2 | Setup Node.js | `actions/setup-node@v4` | Node.js 20をセットアップ |
| 3 | Install dependencies | `npm ci` | 依存関係をインストール |
| 4 | Generate Prisma Client | `npm run prisma:generate` | Prisma Clientを生成 |
| 5 | Run ESLint | `npm run lint` | ESLintでコード品質チェック |
| 6 | Type check and build | `npm run build:ci` | TypeScript型チェック + ビルド |
| 7 | Run unit tests with coverage | `npm run test:coverage` | 単体テスト + カバレッジ計測 |
| 8 | Upload coverage to Codecov | `codecov/codecov-action@v4` | カバレッジレポートをアップロード |
| 9 | Install Playwright browsers | `npx playwright install chromium --with-deps` | E2Eテスト用ブラウザをインストール |
| 10 | Run E2E tests | `npm run test:e2e` | E2Eテストを実行 |
| 11 | Upload E2E test results | `actions/upload-artifact@v4` | E2Eテスト結果を保存 |
| 12 | Upload coverage artifact | `actions/upload-artifact@v4` | カバレッジレポートを保存 |

**環境変数:**
- `DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"` (ビルド・E2E時)

**成功基準:**
- ✅ ESLintエラー0件
- ✅ TypeScriptエラー0件
- ✅ ビルド成功
- ✅ 単体テスト全て通過
- ✅ E2Eテスト全て通過

---

### 2. deploy-preview ジョブ

**目的**: PR作成時にVercel Preview環境へ自動デプロイ

**トリガー条件:**
- `github.event_name == 'pull_request'`
- `lint-and-test`ジョブが成功

**実行内容:**
1. Vercel Preview環境にアプリケーションをデプロイ
2. PRにプレビューURLのコメントを追加

**必要なGitHub Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

### 3. deploy-production ジョブ

**目的**: mainマージ時にVercel Production環境へ自動デプロイ

**トリガー条件:**
- `github.event_name == 'push'`
- `github.ref == 'refs/heads/main'`
- `lint-and-test`ジョブが成功

**実行内容:**
1. Vercel Production環境にアプリケーションをデプロイ

**必要なGitHub Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## 🔄 開発フロー

### 標準的なPRフロー

```bash
# 1. 新しいブランチを作成
git checkout -b feature/new-feature

# 2. 開発作業
# コード編集...

# 3. ローカルで品質チェック
cd reserve-app
npm run lint
npm run build:ci
npm test
npm run test:e2e

# 4. コミット（日本語）
git add .
git commit -m "feat: 新機能を実装"

# 5. プッシュ
git push origin feature/new-feature

# 6. PR作成
gh pr create --title "[FEATURE] 新機能を実装" --body "..."

# 7. GitHub Actionsが自動実行される
# - lint-and-test ジョブが実行
# - deploy-preview ジョブが実行
# - PRにVercel Preview URLが表示される

# 8. レビュー後、mainにマージ
gh pr merge --merge

# 9. GitHub Actionsが自動実行される
# - lint-and-test ジョブが実行
# - deploy-production ジョブが実行
# - Vercel Productionにデプロイ
```

---

## ✅ PR作成前のチェックリスト

### 必須チェック

- [ ] `npm run lint` → エラー0件
- [ ] `DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build:ci` → ビルド成功
- [ ] `npm test` → 単体テスト全て通過
- [ ] `npm run test:e2e` → E2Eテスト全て通過

### コミットメッセージ

- [ ] 日本語で記述
- [ ] プレフィックス使用（`feat:`, `fix:`, `test:` など）

### PRタイトル・説明文

- [ ] 日本語で記述
- [ ] プレフィックス使用（`[FEATURE]`, `[FIX]`, `[TEST]` など）
- [ ] 関連Issueを記載（`Closes #XX`）

---

## 🚨 トラブルシューティング

### Q1: lint-and-testジョブが失敗する

**原因:** ESLintエラー、型エラー、テスト失敗のいずれか

**解決策:**
```bash
# ローカルで品質チェック
cd reserve-app

# ESLintチェック
npm run lint

# 型チェック + ビルド
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build:ci

# 単体テスト
npm test

# E2Eテスト
npm run test:e2e
```

エラーを修正後、再度プッシュ。

---

### Q2: deploy-previewジョブが失敗する

**原因:** Vercel認証エラー、環境変数不足

**解決策:**
1. GitHub Secretsを確認
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
2. 詳細は `documents/Vercel環境変数設定.md` を参照

---

### Q3: E2Eテストが失敗する

**原因:** テストコードのバグ、実装のバグ、環境変数不足

**解決策:**
```bash
# ローカルでE2Eテストを実行
cd reserve-app
npm run test:e2e

# UIモードで詳細確認
npm run test:e2e:ui

# 特定のテストのみ実行
npx playwright test src/__tests__/e2e/auth.spec.ts
```

エラーログを確認して修正。

---

### Q4: ビルドエラー（Type errorやModule not found）

**原因:** 依存関係の不整合、型エラー

**解決策:**
```bash
# 依存関係を再インストール
cd reserve-app
rm -rf node_modules package-lock.json
npm install

# Prisma Clientを再生成
npm run prisma:generate

# ビルド確認
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build:ci
```

---

### Q5: カバレッジ閾値を下回る

**原因:** テストカバレッジが基準を満たしていない

**現在の閾値（jest.config.js）:**
- branches: 50%
- functions: 60%
- lines: 55%
- statements: 55%

**解決策:**
```bash
# カバレッジレポート確認
npm run test:coverage

# カバレッジレポートをブラウザで開く
open coverage/lcov-report/index.html
```

不足しているテストを追加。

---

## 📊 GitHub Actionsステータスの確認

### GitHubリポジトリページで確認

1. リポジトリページの「Actions」タブをクリック
2. 最新のワークフロー実行を確認
3. 各ジョブの詳細ログを確認

### コマンドラインで確認

```bash
# 最新のワークフロー実行を確認
gh run list

# 特定のワークフロー実行の詳細を確認
gh run view <run-id>

# ワークフローをリトライ
gh run rerun <run-id>
```

---

## 🎯 カバレッジ目標

### 現在の閾値（段階的に引き上げ中）

| 指標 | 現在 | 目標 |
|------|------|------|
| branches | 50% | 70% |
| functions | 60% | 80% |
| lines | 55% | 80% |
| statements | 55% | 80% |

### カバレッジ向上のための推奨事項

1. **単体テスト**: コンポーネント、関数の振る舞いをテスト
2. **E2Eテスト**: ユーザーフロー全体をテスト
3. **Page Objectパターン**: E2Eテストの保守性向上
4. **data-testid属性**: セレクタの安定性確保

---

## 📚 関連ドキュメント

- `.github/workflows/cicd.yml` - CI/CDワークフロー定義
- `documents/Vercel環境変数設定.md` - Vercel環境変数設定ガイド
- `documents/開発プロセスルール.md` - ATDD/BDD開発プロセス
- `documents/コード品質チェックリスト.md` - 品質基準
- `features/cicd/github-actions.feature` - CI/CD Gherkinシナリオ
- `reserve-app/jest.config.js` - Jest設定
- `reserve-app/playwright.config.ts` - Playwright設定

---

## 🔧 CI/CD最適化

### Playwrightテスト実行時間の短縮

**CI環境**: Chromiumのみで実行（高速化）
**ローカル環境**: 複数ブラウザでテスト（クロスブラウザ対応確認）

設定: `reserve-app/playwright.config.ts:17-43`

---

## 💡 ベストプラクティス

1. **PRは小さく保つ**: 1つのIssueに対して1つのPR
2. **テストファースト**: 実装前にテストを書く（TDD/BDD）
3. **ローカルで品質チェック**: PR作成前に必ず実行
4. **コミットメッセージは日本語**: プロジェクト統一ルール
5. **CI失敗時は即座に修正**: マージをブロックされる前に対応

---

**質問や問題がある場合は、Issue #3, #4 を参照してください。**
