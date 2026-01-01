# 予約システム 引き継ぎ資料

**最終更新**: 2025-12-31
**対象**: 新規参画メンバー、保守担当者

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [プロジェクト構成](#プロジェクト構成)
4. [開発の進捗状況](#開発の進捗状況)
5. [セットアップ手順](#セットアップ手順)
6. [開発プロセス](#開発プロセス)
7. [テスト戦略](#テスト戦略)
8. [CI/CD運用](#cicd運用)
9. [データベース設計](#データベース設計)
10. [次のステップ](#次のステップ)
11. [トラブルシューティング](#トラブルシューティング)
12. [関連ドキュメント](#関連ドキュメント)

---

## プロジェクト概要

### システム名
**飲食店向け予約管理システム**

### コンセプト
- ホットペッパーより安く、店舗専用で他店に誘導されない自社予約システム
- 白ベースで爽やか、汎用的（美容室・飲食店・歯科医院など多業種対応）
- マルチテナント対応（複数店舗の管理が可能）

### 主要機能

#### ユーザー側
- ユーザー新規登録・ログイン ✅
- 予約カレンダー（空き状況表示）🚧
- メニュー選択・スタッフ指名 🚧
- 予約登録・変更・キャンセル 🚧
- マイページ（予約一覧・来店履歴）🚧

#### 管理者側
- 管理者ログイン・ダッシュボード ✅
- 予約管理（カレンダー/一覧）🚧
- 顧客管理（一覧・詳細・メモ）✅
- スタッフ管理（CRUD・シフト設定）🚧
- メニュー管理（CRUD）🚧
- 店舗設定（営業時間・定休日）🚧

**凡例**: ✅ 完了 / 🚧 未実装

---

## 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 16.1.1 | Reactフレームワーク（App Router） |
| React | 19.2.3 | UIライブラリ |
| Tailwind CSS | 4.x | CSSフレームワーク |
| TypeScript | Latest | 型安全性 |

### バックエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js API Routes | 16.1.1 | バックエンドAPI |
| Prisma | 7.2.0 | ORM（型安全なDB操作） |
| Supabase | Latest | 認証・PostgreSQLホスティング |
| Zod | 4.2.1 | バリデーション |

### テスト
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Jest | 30.2.0 | 単体テスト |
| React Testing Library | 16.3.1 | Reactコンポーネントテスト |
| Playwright | 1.57.0 | E2Eテスト |

### インフラ・CI/CD
| 技術 | 用途 |
|------|------|
| Vercel | ホスティング・自動デプロイ |
| GitHub Actions | CI/CD（自動テスト・Lint・デプロイ） |
| Supabase | PostgreSQLデータベース・認証 |

---

## プロジェクト構成

```
reserve-system/
├── .github/
│   ├── ISSUE_TEMPLATE/       # Issueテンプレート
│   └── workflows/
│       └── cicd.yml          # CI/CDワークフロー
├── documents/                # プロジェクトドキュメント
│   ├── handover/             # 引き継ぎ資料（本ディレクトリ）
│   ├── 機能一覧とページ設計.md
│   ├── 開発プロセス設計.md
│   ├── 開発プロセスルール.md   # 🔴 必読
│   ├── GitHub-Issues一覧.md
│   ├── ATDD-BDD環境セットアップ.md
│   ├── 開発開始ガイド.md
│   ├── CI-CD運用ガイド.md
│   └── Vercel環境変数設定.md
├── features/                 # Gherkinシナリオ（BDD）
│   └── cicd/
│       └── github-actions.feature
├── reserve-app/              # Next.jsアプリケーション
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   │   ├── page.tsx      # トップページ
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── booking/
│   │   │   ├── mypage/
│   │   │   ├── admin/
│   │   │   └── api/          # API Routes
│   │   ├── components/       # Reactコンポーネント
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── AdminSidebar.tsx
│   │   ├── lib/              # ユーティリティ・ロジック
│   │   │   ├── auth.ts
│   │   │   ├── validations.ts
│   │   │   └── api-response.ts
│   │   └── __tests__/        # テストコード
│   │       ├── e2e/          # Playwright E2Eテスト
│   │       │   ├── auth.spec.ts
│   │       │   ├── admin-dashboard.spec.ts
│   │       │   └── home.spec.ts
│   │       └── unit/         # Jest 単体テスト
│   │           ├── Button.test.tsx
│   │           └── lib/
│   ├── prisma/
│   │   └── schema.prisma     # データベーススキーマ
│   ├── public/               # 静的ファイル
│   ├── jest.config.js        # Jest設定
│   ├── playwright.config.ts  # Playwright設定
│   ├── package.json
│   └── .env.local            # 環境変数（Git管理外）
└── scripts/                  # 自動化スクリプト
    └── create-issues-sprint2.sh
```

---

## 開発の進捗状況

### Sprint 1: 基盤構築（Week 1）✅ 完了

**完了したIssue（7/7）:**

| Issue | 機能 | ステータス |
|-------|------|----------|
| #1 | テスト環境セットアップ | ✅ |
| #2 | Prisma + Supabaseセットアップ | ✅ |
| #3 | 環境変数管理 | ✅ |
| #4 | CI/CD構築（GitHub Actions） | ✅ |
| #5 | ユーザー新規登録機能 | ✅ |
| #6 | ユーザーログイン機能 | ✅ |
| #15 | 管理者ダッシュボード | ✅ |

**主要成果物:**
- Jest + React Testing Library + Playwright のテスト環境
- Prismaスキーマ定義（5テーブル）
- GitHub Actions CI/CD（自動テスト・Lint・デプロイ）
- Supabase Auth統合（ユーザー認証）
- E2Eテストカバレッジ（認証フロー・ダッシュボード）
- カバレッジ閾値設定（branches: 50%, functions: 60%, lines/statements: 55%）

---

### Sprint 2: 予約機能（ユーザー側）🚧 未着手

**予定されているIssue（7件）:**

| Issue | 機能 | 優先度 |
|-------|------|--------|
| #8 | メニュー一覧表示 | High |
| #9 | 予約カレンダー（空き状況表示） | High |
| #10 | 予約登録機能 | High |
| #11 | 予約確認メール送信 | High |
| #12 | マイページ（予約一覧） | Medium |
| #13 | 予約変更機能 | Medium |
| #14 | 予約キャンセル機能 | Medium |

**推定工数**: 1-2週間

---

### Sprint 3: 管理機能（店舗側）🚧 一部完了

**完了したIssue（2/8）:**

| Issue | 機能 | ステータス |
|-------|------|----------|
| #19 | 顧客管理（一覧・詳細） | ✅ |
| #20 | 顧客メモ機能 | ✅ |

**予定されているIssue（6件）:**

| Issue | 機能 | 優先度 |
|-------|------|--------|
| #16 | 予約一覧表示（管理者） | High |
| #17 | 予約手動追加（管理者） | Medium |
| #18 | 予約編集・削除（管理者） | Medium |
| #21 | スタッフ管理（CRUD） | Medium |
| #22 | スタッフシフト設定 | Medium |

**推定工数**: 1-2週間

---

### Sprint 4: 拡張機能 🚧 未着手

**予定されているIssue（8件）:**

| Issue | 機能 | 優先度 |
|-------|------|--------|
| #23 | メニュー管理（CRUD） | Medium |
| #24 | 店舗設定（営業時間・定休日） | Medium |
| #25 | リマインダーメール自動送信 | Medium |
| #26 | 分析レポート（予約推移） | Low |
| #27 | リピート率分析 | Low |
| #28 | E2Eテスト拡充 | Medium |
| #29 | コンポーネント整理（リファクタリング） | Medium |
| #30 | API仕様書作成 | Low |

**推定工数**: 1-2週間

---

## セットアップ手順

### 1. 前提条件

- Node.js 20以上
- npm または yarn
- Git
- GitHub CLI（`gh`）推奨
- Supabaseアカウント

---

### 2. リポジトリクローン

```bash
git clone https://github.com/aokitashipro/reserve-system.git
cd reserve-system/reserve-app
```

---

### 3. 依存関係のインストール

```bash
npm install
```

---

### 4. 環境変数の設定

`.env.local`ファイルを作成：

```bash
# データベース接続（Supabase PostgreSQL）
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxx:password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# アプリケーション設定
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

詳細は `documents/Vercel環境変数設定.md` を参照。

---

### 5. データベースセットアップ

```bash
# Prisma Clientを生成
npm run prisma:generate

# マイグレーション実行（開発環境のみ）
npm run prisma:migrate

# または、スキーマを直接反映（本番環境推奨）
npm run prisma:push

# Prisma Studioでデータベース確認
npm run prisma:studio
```

---

### 6. 開発サーバー起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス。

---

### 7. テスト実行

```bash
# 単体テスト
npm test

# カバレッジ付き単体テスト
npm run test:coverage

# E2Eテスト（全体）
npm run test:e2e

# E2Eテスト（スモークテストのみ）
npm run test:e2e:smoke

# E2EテストUI（デバッグ用）
npm run test:e2e:ui
```

---

### 8. Lint・ビルド確認

```bash
# ESLint実行
npm run lint

# 型チェック + ビルド
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build:ci
```

---

## 開発プロセス

### 🔴 最重要ルール: スペックファースト開発

**このプロジェクトは、ATDD/BDDプロセスに厳格に従います。**

詳細は `.cursor/rules/開発プロセスルール.md` を **必ず** 読んでください。

---

### 開発の流れ（TDD/BDD）

```
1. Gherkinシナリオ作成（features/ディレクトリ）
   ↓
2. E2Eテスト実装（Playwright）
   ↓
3. E2Eテスト実行（Red確認）
   ↓
4. 最小実装（コード）
   ↓
5. E2Eテスト実行（Green確認）
   ↓
6. 単体テスト追加（Jest）
   ↓
7. リファクタリング（テストは変更しない）
   ↓
8. 全テスト実行（Green確認）
   ↓
9. カバレッジ確認（閾値以上か確認）
   ↓
10. PR作成
```

**❌ 禁止事項:**
- いきなり実装コードを書く
- 実装後にテストを追加する
- テストを書かずにリファクタリングする

---

### 毎日のルーチン

#### 朝（9:00 - 10:00）
1. GitHub Issueから今日のタスクを選択
2. ブランチ作成: `git checkout -b feature/issue-X-description`
3. Gherkinシナリオ確認・作成

#### 午前（10:00 - 12:00）
1. E2Eテスト作成（Red）
2. 単体テスト作成（Red）
3. 実装開始

#### 午後（13:00 - 17:00）
1. 実装継続（Green）
2. リファクタリング（Refactor）
3. テスト実行・カバレッジ確認
4. コミット: `git commit -m "feat: 機能名"`

#### 夕方（17:00 - 18:00）
1. PR作成
2. AIによるコードレビュー
3. CIの結果確認
4. 翌日のタスク確認

---

## テスト戦略

### カバレッジ目標

| 指標 | 現在の閾値 | 最終目標 |
|------|----------|---------|
| branches | 50% | 70% |
| functions | 60% | 80% |
| lines | 55% | 80% |
| statements | 55% | 80% |

---

### E2Eテストの書き方

**Page Objectパターン必須**

```typescript
// src/__tests__/e2e/pages/RegisterPage.ts
export class RegisterPage {
  constructor(private page: Page) {}

  private selectors = {
    nameInput: '[data-testid="register-name"]',
    emailInput: '[data-testid="register-email"]',
    passwordInput: '[data-testid="register-password"]',
    submitButton: '[data-testid="register-submit"]',
  };

  async goto() {
    await this.page.goto('/register');
  }

  async fillForm(data: RegisterFormData) {
    await this.page.fill(this.selectors.nameInput, data.name);
    await this.page.fill(this.selectors.emailInput, data.email);
    await this.page.fill(this.selectors.passwordInput, data.password);
  }

  async submit() {
    await this.page.click(this.selectors.submitButton);
  }
}
```

**重要:** 全てのインタラクティブ要素に `data-testid` 属性を必ず追加すること。

---

### テスト実行戦略

#### CI環境（GitHub Actions）
- **スモークテスト**: トップページのみ（高速）
- **Chromiumのみ**: クロスブラウザテストはローカルで

#### ローカル環境
- **フルE2Eテスト**: 全てのシナリオ
- **複数ブラウザ**: Chromium, Firefox, WebKit

---

## CI/CD運用

### GitHub Actionsワークフロー

**ファイル**: `.github/workflows/cicd.yml`

**トリガー:**
- PR作成時: `lint-and-test` → `deploy-preview`
- mainマージ時: `lint-and-test` → `deploy-production`

---

### lint-and-testジョブ

**実行内容:**
1. ESLint
2. TypeScript型チェック + ビルド
3. 単体テスト（カバレッジ測定）
4. E2Eテスト（スモークテスト）
5. カバレッジレポート（Codecov）

**環境変数:**
- `DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"`

---

### deploy-previewジョブ

**実行内容:**
- Vercel Preview環境へ自動デプロイ
- PRにプレビューURLをコメント

**必要なGitHub Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**注意:** 現在は無効化されています（Secrets未設定のため）

---

### deploy-productionジョブ

**実行内容:**
- Vercel Production環境へ自動デプロイ

**注意:** 現在は無効化されています（Secrets未設定のため）

---

### PR作成前のチェックリスト

- [ ] `npm run lint` → エラー0件
- [ ] `DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build:ci` → ビルド成功
- [ ] `npm test` → 単体テスト全て通過
- [ ] `npm run test:e2e` → E2Eテスト全て通過
- [ ] カバレッジ閾値クリア
- [ ] コミットメッセージは日本語
- [ ] PRタイトル・説明文は日本語

---

## データベース設計

### テーブル一覧

| テーブル名 | 説明 |
|-----------|------|
| `restaurant_users` | ユーザー情報 |
| `restaurant_staff` | スタッフ情報 |
| `restaurant_menus` | メニュー情報 |
| `restaurant_reservations` | 予約情報 |
| `restaurant_settings` | 店舗設定 |

**特徴:**
- **マルチテナント対応**: 全テーブルに `tenantId` カラム
- **テーブルプレフィックス**: `restaurant_` で統一（複数ポートフォリオ対応）
- **Supabase Auth統合**: `restaurant_users.authId` がSupabase Auth UUIDに対応

---

### 主要なリレーション

```
RestaurantUser 1 ----< ∞ RestaurantReservation
RestaurantStaff 1 ----< ∞ RestaurantReservation
RestaurantMenu 1 ----< ∞ RestaurantReservation
```

---

### Prismaスキーマ

詳細は `reserve-app/prisma/schema.prisma` を参照。

**主要モデル:**
- `RestaurantUser`: 顧客情報
- `RestaurantStaff`: スタッフ情報（シフト管理予定）
- `RestaurantMenu`: メニュー情報（カテゴリ・料金・所要時間）
- `RestaurantReservation`: 予約情報（ステータス管理）
- `RestaurantSettings`: 店舗設定（営業時間・定休日・予約間隔）

**Enum:**
- `ReservationStatus`: PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW

---

## 次のステップ

### 優先度: High（すぐに着手すべき）

1. **Issue #8-11（Sprint 2の必須機能）**
   - メニュー一覧表示
   - 予約カレンダー（空き状況表示）
   - 予約登録機能
   - 予約確認メール送信

2. **Vercel環境変数設定**
   - GitHub Secretsの設定
   - CI/CDデプロイジョブの有効化

3. **Gherkinシナリオ作成**
   - Sprint 2の全Issue分のシナリオ作成（`features/booking/`）

---

### 優先度: Medium（次に取り組むべき）

4. **Issue #12-14（Sprint 2のサブ機能）**
   - マイページ（予約一覧）
   - 予約変更機能
   - 予約キャンセル機能

5. **管理機能（Sprint 3）**
   - 予約一覧表示（管理者）
   - 予約手動追加・編集・削除
   - スタッフ管理（顧客管理は完了済み ✅）

---

### 優先度: Low（余裕があれば）

6. **分析・レポート機能（Sprint 4）**
   - 予約推移グラフ
   - リピート率分析

7. **コード整理**
   - 重複コードの削減
   - コンポーネントの分割

8. **ドキュメント整備**
   - API仕様書作成（OpenAPI）
   - Storybookの導入（コンポーネントカタログ）

---

## トラブルシューティング

### Q1: テストが失敗する

**原因:** ESLintエラー、型エラー、テスト失敗のいずれか

**解決策:**
```bash
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

エラーログを確認して修正。

---

### Q2: Prismaマイグレーションエラー

**原因:** データベース接続エラー、スキーマ不整合

**解決策:**
```bash
# 環境変数確認
cat .env.local

# Prisma Clientを再生成
npm run prisma:generate

# マイグレーションリセット（開発環境のみ）
npx prisma migrate reset

# 再度マイグレーション
npm run prisma:migrate
```

---

### Q3: E2Eテストがタイムアウト

**原因:** 開発サーバーが起動していない、ネットワークエラー

**解決策:**
```bash
# 開発サーバーを起動
npm run dev

# 別ターミナルでE2Eテスト実行
npm run test:e2e

# UIモードでデバッグ
npm run test:e2e:ui
```

---

### Q4: ビルドエラー（Module not found）

**原因:** 依存関係の不整合

**解決策:**
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install

# Prisma Clientを再生成
npm run prisma:generate

# ビルド確認
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build:ci
```

---

### Q5: Supabase認証エラー

**原因:** 環境変数の誤設定、Supabase設定の不備

**解決策:**
1. `.env.local`の環境変数を確認
2. Supabaseダッシュボードで認証設定を確認
3. `NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`が正しいか確認

詳細は `documents/開発開始ガイド.md` を参照。

---

## 関連ドキュメント

### 必読ドキュメント（⭐️）

| ドキュメント | 説明 |
|------------|------|
| ⭐️ `.cursor/rules/開発プロセスルール.md` | ATDD/BDD開発プロセス（最重要） |
| ⭐️ `documents/機能一覧とページ設計.md` | 全機能・ページ一覧 |
| ⭐️ `documents/CI-CD運用ガイド.md` | CI/CD運用マニュアル |

---

### 参考ドキュメント

| ドキュメント | 説明 |
|------------|------|
| `documents/開発プロセス設計.md` | 開発プロセスの設計思想 |
| `documents/開発開始ガイド.md` | 開発開始手順 |
| `documents/GitHub-Issues一覧.md` | 全Issue一覧 |
| `documents/ATDD-BDD環境セットアップ.md` | テスト環境詳細 |
| `documents/Vercel環境変数設定.md` | Vercel環境変数設定手順 |

---

### コードドキュメント

| ファイル | 説明 |
|---------|------|
| `reserve-app/prisma/schema.prisma` | データベーススキーマ |
| `reserve-app/jest.config.js` | Jest設定 |
| `reserve-app/playwright.config.ts` | Playwright設定 |
| `.github/workflows/cicd.yml` | CI/CDワークフロー定義 |

---

## FAQ

### Q: 新しい機能を追加する際の手順は？

A: 必ず以下の順序で開発してください：

1. GitHub Issueを作成（または既存Issueを確認）
2. Gherkinシナリオを作成（`features/`ディレクトリ）
3. E2Eテストを実装（Playwright）
4. E2Eテストを実行（Red確認）
5. 最小実装
6. E2Eテストを実行（Green確認）
7. 単体テストを追加
8. リファクタリング
9. 全テスト実行（Green確認）
10. PR作成

詳細は `.cursor/rules/開発プロセスルール.md` を参照。

---

### Q: テストカバレッジが閾値を下回る場合は？

A: カバレッジレポートを確認し、不足しているテストを追加してください。

```bash
# カバレッジレポート確認
npm run test:coverage

# ブラウザで詳細を確認
open coverage/lcov-report/index.html
```

カバレッジが閾値を下回る場合、CIが失敗します。

---

### Q: Vercelデプロイジョブが無効化されているのはなぜ？

A: GitHub Secretsが未設定のため、一時的に無効化されています。

Vercelデプロイを有効化する場合：
1. `documents/Vercel環境変数設定.md` を参照
2. GitHub Secretsを設定
3. `.github/workflows/cicd.yml`の該当ジョブのコメントアウトを解除

---

### Q: マルチテナント対応とは？

A: 全テーブルに`tenantId`カラムがあり、複数店舗のデータを1つのデータベースで管理できる設計です。

現在のデフォルト値: `demo-restaurant`

将来的に複数店舗を管理する場合、`tenantId`でデータを分離できます。

---

### Q: AIエージェント（Cursor AI、Claude Code）に依頼する際のコツは？

A: 以下のプロンプト例を参考にしてください：

**Gherkinシナリオ生成:**
```
以下のIssueに対するGherkinシナリオを作成してください。
Issue: #XX [機能名]
要件: Feature/Scenario形式、Given/When/Then形式、日本語で記述
```

**E2Eテスト生成:**
```
以下のGherkinシナリオに対応するPlaywright E2Eテストを生成してください。
要件: Page Objectパターン、data-testid属性使用、TypeScript strict mode
```

**実装生成:**
```
以下のE2Eテストをパスする最小実装を生成してください。
要件: Next.js 16 App Router、TypeScript strict mode、Zodバリデーション、data-testid属性追加
```

詳細は `.cursor/rules/開発プロセスルール.md` の「AIエージェント向けプロンプト例」を参照。

---

## 連絡先・サポート

**質問・問題がある場合:**
- GitHub Issueを作成
- `.cursor/rules/開発プロセスルール.md` を確認
- `documents/` ディレクトリの関連ドキュメントを参照

---

**最終更新日**: 2026-01-01
**作成者**: 開発チーム
