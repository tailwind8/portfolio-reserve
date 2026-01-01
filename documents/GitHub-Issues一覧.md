# GitHub Issues 一覧

**最終更新**: 2026-01-01

このドキュメントは、GitHub Issueの完全リストと進捗状況を管理するドキュメントです。

## 📊 進捗サマリー

- **実装済み (CLOSED)**: 44件 (81.5%)
- **未実装 (OPEN)**: 11件 (18.5%)
- **合計**: 54件

**Phase 1（基本機能）完了率**: 100% ✅
**Phase 2（拡張機能）完了率**: 75%

---

## 🏷️ ラベルの設定（最初に実施）

GitHubリポジトリで以下のラベルを作成してください：

| ラベル名 | 色 | 説明 |
|---------|-----|------|
| `feature` | `#10B981` | 新機能実装 |
| `bug` | `#EF4444` | バグ修正 |
| `refactor` | `#F59E0B` | リファクタリング |
| `test` | `#3B82F6` | テスト追加 |
| `docs` | `#9CA3AF` | ドキュメント |
| `tech-debt` | `#F97316` | 技術的負債 |
| `priority-high` | `#DC2626` | 高優先度 |
| `priority-medium` | `#FBBF24` | 中優先度 |
| `priority-low` | `#34D399` | 低優先度 |
| `sprint-1` | `#6366F1` | Sprint 1 |
| `sprint-2` | `#8B5CF6` | Sprint 2 |
| `sprint-3` | `#EC4899` | Sprint 3 |
| `sprint-4` | `#14B8A6` | Sprint 4 |

---

## 📦 Sprint 1: 基盤構築 ✅ 完了

### #1 [FEATURE] テスト環境セットアップ ✅ CLOSED
**Labels**: `feature`, `test`, `sprint-1`, `priority-high`

**概要**: Jest, React Testing Library, Playwrightのセットアップ

**ユーザーストーリー**:
```
As a developer
I want to set up testing environment
So that I can write reliable tests for all features
```

**受入基準**:
```gherkin
Feature: テスト環境構築

  Scenario: 単体テストを実行できる
    Given Jestがインストールされている
    When `npm run test`を実行する
    Then テストが正常に実行される

  Scenario: E2Eテストを実行できる
    Given Playwrightがインストールされている
    When `npm run test:e2e`を実行する
    Then E2Eテストが正常に実行される
```

**実装タスク**:
- [ ] Jestインストール・設定
- [ ] React Testing Libraryインストール・設定
- [ ] Playwrightインストール・設定
- [ ] MSW（Mock Service Worker）セットアップ
- [ ] サンプルテスト作成・実行確認

---

### #2 [FEATURE] Prisma + Supabaseセットアップ ✅ CLOSED
**Labels**: `feature`, `sprint-1`, `priority-high`

**概要**: Prismaのセットアップとデータベース接続

**ユーザーストーリー**:
```
As a developer
I want to set up Prisma ORM with Supabase
So that I can interact with the database in a type-safe way
```

**受入基準**:
```gherkin
Feature: データベース接続

  Scenario: Prisma Clientでデータベースに接続できる
    Given Prismaがセットアップされている
    And Supabase接続情報が設定されている
    When Prisma Clientを使用してクエリを実行する
    Then データが取得できる
```

**実装タスク**:
- [ ] Prismaインストール
- [ ] schema.prisma作成（restaurant_* テーブル定義）
- [ ] .env設定（Supabase接続情報）
- [ ] 初回マイグレーション実行
- [ ] Prisma Clientセットアップ

**データベーススキーマ**:
```prisma
// restaurant_users
model RestaurantUser {
  id         String   @id @default(uuid())
  tenantId   String   @default("demo-restaurant") @map("tenant_id")
  email      String
  name       String?
  phone      String?
  createdAt  DateTime @default(now()) @map("created_at")

  @@unique([tenantId, email])
  @@map("restaurant_users")
}

// restaurant_reservations
// restaurant_menus
// restaurant_staff
// restaurant_settings
```

---

### #3 [FEATURE] 環境変数管理 ✅ CLOSED
**Labels**: `feature`, `sprint-1`, `priority-high`

**概要**: .env.local, .env.exampleの整備

**実装タスク**:
- [ ] .env.example作成
- [ ] Supabase環境変数定義
- [ ] Vercel環境変数設定ドキュメント作成

---

### #4 [FEATURE] CI/CD構築（GitHub Actions） ✅ CLOSED
**Labels**: `feature`, `sprint-1`, `priority-high`

**概要**: 自動テスト・デプロイのワークフロー構築

**実装タスク**:
- [ ] test.ymlワークフロー作成（PR時に自動テスト）
- [ ] lint.ymlワークフロー作成（ESLint + TypeScript）
- [ ] deploy.ymlワークフロー作成（mainマージ時に自動デプロイ）

---

### #5 [FEATURE] ユーザー新規登録機能 ✅ CLOSED
**Labels**: `feature`, `sprint-1`, `priority-high`

**ユーザーストーリー**:
```
As a customer
I want to register for an account
So that I can make reservations
```

**受入基準**:
```gherkin
Feature: ユーザー新規登録

  Scenario: 新規登録成功
    Given 新規登録ページにアクセスしている
    When 名前に"山田太郎"を入力する
    And メールアドレスに"yamada@example.com"を入力する
    And パスワードに"password123"を入力する
    And "アカウントを作成"ボタンをクリックする
    Then 確認メールが送信される
    And ログインページにリダイレクトされる
```

**実装タスク**:
- [ ] E2Eテスト作成（Playwright）
- [ ] Supabase Auth統合
- [ ] バリデーション実装（Zod）
- [ ] エラーハンドリング
- [ ] 確認メール送信機能

---

### #6 [FEATURE] ユーザーログイン機能 ✅ CLOSED
**Labels**: `feature`, `sprint-1`, `priority-high`

**ユーザーストーリー**:
```
As a customer
I want to log in to my account
So that I can access my reservations
```

**受入基準**:
```gherkin
Feature: ユーザーログイン

  Scenario: ログイン成功
    Given ログインページにアクセスしている
    And 登録済みユーザーが存在する
    When メールアドレスに"yamada@example.com"を入力する
    And パスワードに"password123"を入力する
    And "ログイン"ボタンをクリックする
    Then ダッシュボードにリダイレクトされる
    And ユーザー名が表示される
```

**実装タスク**:
- [ ] E2Eテスト作成
- [ ] Supabase Auth統合（ログイン）
- [ ] セッション管理
- [ ] エラーハンドリング

---

### #7 [FEATURE] 管理者ログイン機能 ✅ CLOSED
**Labels**: `feature`, `sprint-1`, `priority-high`

**ユーザーストーリー**:
```
As a store admin
I want to log in to the admin panel
So that I can manage reservations
```

**受入基準**:
```gherkin
Feature: 管理者ログイン

  Scenario: 管理者ログイン成功
    Given 管理者ログインページにアクセスしている
    When メールアドレスに"admin@store.com"を入力する
    And パスワードに"adminpass"を入力する
    And "ログイン"ボタンをクリックする
    Then 管理者ダッシュボードにリダイレクトされる
```

**実装タスク**:
- [ ] E2Eテスト作成
- [ ] 管理者ロール判定ロジック
- [ ] 管理者専用ルート保護
- [ ] セッション管理

---

## 📦 Sprint 2: 予約機能（ユーザー側） ✅ 完了

### #8 [FEATURE] メニュー一覧表示 ✅ CLOSED
**Labels**: `feature`, `sprint-2`, `priority-high`

**ユーザーストーリー**:
```
As a customer
I want to view available menus
So that I can choose what service I want
```

**受入基準**:
```gherkin
Feature: メニュー一覧表示

  Scenario: メニュー一覧を表示
    Given メニューページにアクセスしている
    When ページが読み込まれる
    Then すべてのメニューが表示される
    And 各メニューに料金と所要時間が表示される
```

---

### #9 [FEATURE] 予約カレンダー（空き状況表示） ✅ CLOSED
**Labels**: `feature`, `sprint-2`, `priority-high`

**ユーザーストーリー**:
```
As a customer
I want to see available time slots on a calendar
So that I can choose a convenient time
```

**受入基準**:
```gherkin
Feature: 予約カレンダー

  Scenario: 空き状況を確認
    Given 予約ページにアクセスしている
    When カレンダーで日付を選択する
    Then その日の空き時間帯が表示される
    And 予約済みの時間帯はグレーアウトされる
```

**実装タスク**:
- [ ] E2Eテスト作成
- [ ] カレンダーコンポーネント実装
- [ ] 空き状況取得API実装
- [ ] リアルタイム更新機能

---

### #10 [FEATURE] 予約登録機能 ✅ CLOSED
**Labels**: `feature`, `sprint-2`, `priority-high`

**ユーザーストーリー**:
```
As a customer
I want to book a reservation
So that I can visit the store at my preferred time
```

**受入基準**:
```gherkin
Feature: 予約登録

  Scenario: 予約成功
    Given ログイン済みユーザーが予約ページにいる
    When 日付、時間、メニュー、スタッフを選択する
    And "予約を確定する"ボタンをクリックする
    Then 予約が登録される
    And 予約完了画面が表示される
    And 確認メールが送信される
```

**実装タスク**:
- [ ] E2Eテスト作成
- [ ] 予約登録API実装
- [ ] バリデーション（重複予約チェック）
- [ ] 確認メール送信
- [ ] トランザクション処理

---

### #11 [FEATURE] 予約確認メール送信 ✅ CLOSED
**Labels**: `feature`, `sprint-2`, `priority-high`

**ユーザーストーリー**:
```
As a customer
I want to receive a confirmation email
So that I have a record of my reservation
```

**実装タスク**:
- [ ] メール送信機能実装（Resend or SendGrid）
- [ ] メールテンプレート作成
- [ ] E2Eテストでメール送信確認

---

### #12 [FEATURE] マイページ（予約一覧） ✅ CLOSED
**Labels**: `feature`, `sprint-2`, `priority-medium`

**ユーザーストーリー**:
```
As a customer
I want to view my reservations
So that I can manage my bookings
```

**受入基準**:
```gherkin
Feature: マイページ

  Scenario: 予約一覧を表示
    Given ログイン済みユーザーがマイページにアクセスする
    Then 自分の予約一覧が表示される
    And 各予約の日時、メニュー、ステータスが表示される
```

---

### #13 [FEATURE] 予約変更機能 ✅ CLOSED
**Labels**: `feature`, `sprint-2`, `priority-medium`

**ユーザーストーリー**:
```
As a customer
I want to change my reservation
So that I can adjust to my schedule
```

**受入基準**:
```gherkin
Feature: 予約変更

  Scenario: 予約変更成功
    Given マイページで予約を選択している
    When "変更"ボタンをクリックする
    And 新しい日時を選択する
    And "変更を保存"ボタンをクリックする
    Then 予約が更新される
    And 変更確認メールが送信される
```

---

### #14 [FEATURE] 予約キャンセル機能 ✅ CLOSED
**Labels**: `feature`, `sprint-2`, `priority-medium`

**ユーザーストーリー**:
```
As a customer
I want to cancel my reservation
So that I can free up the time slot
```

**受入基準**:
```gherkin
Feature: 予約キャンセル

  Scenario: 予約キャンセル成功
    Given マイページで予約を選択している
    When "キャンセル"ボタンをクリックする
    And 確認ダイアログで"はい"を選択する
    Then 予約がキャンセル済みに更新される
    And キャンセル確認メールが送信される
```

---

## 📦 Sprint 3: 管理機能（店舗側） ⚠️ 一部未完了

### #15 [FEATURE] 管理者ダッシュボード（統計表示） ✅ CLOSED
**Labels**: `feature`, `sprint-3`, `priority-high`

**ユーザーストーリー**:
```
As a store admin
I want to view key metrics on a dashboard
So that I can understand business performance
```

**受入基準**:
```gherkin
Feature: ダッシュボード

  Scenario: 統計データを表示
    Given 管理者がログインしている
    When ダッシュボードにアクセスする
    Then 本日の予約件数が表示される
    And 今月の予約件数が表示される
    And 売上統計が表示される
```

---

### #16 [FEATURE] 予約一覧表示（管理者） ✅ CLOSED
**Labels**: `feature`, `sprint-3`, `priority-high`

**ユーザーストーリー**:
```
As a store admin
I want to view all reservations
So that I can manage bookings effectively
```

**受入基準**:
```gherkin
Feature: 予約一覧（管理者）

  Scenario: 予約一覧を表示
    Given 管理者が予約管理ページにアクセスする
    Then すべての予約が一覧表示される
    And 日付・ステータスでフィルタリングできる
```

---

### #17 [FEATURE] 予約手動追加（管理者） ✅ CLOSED
**Labels**: `feature`, `sprint-3`, `priority-high`

**ユーザーストーリー**:
```
As a store admin
I want to manually add reservations
So that I can handle phone bookings
```

---

### #18 [FEATURE] 予約編集・削除（管理者） ✅ CLOSED
**Labels**: `feature`, `sprint-3`, `priority-high`

---

### #19 [FEATURE] 顧客管理（一覧・詳細） ✅ CLOSED
**Labels**: `feature`, `sprint-3`, `priority-medium`
**完了日**: 2026-01-01

**ユーザーストーリー**:
```
As a store admin
I want to view customer information
So that I can provide personalized service
```

**実装タスク**:
- [x] 顧客一覧ページ作成
- [x] 顧客詳細ページ作成
- [x] 来店履歴表示機能
- [x] 予約履歴表示機能
- [x] 検索機能実装
- [x] ソート機能実装

**成果物**:
- `reserve-app/src/app/api/admin/customers/route.ts`
- `reserve-app/src/app/api/admin/customers/[id]/route.ts`
- `reserve-app/src/app/admin/customers/page.tsx`
- `reserve-app/src/app/admin/customers/[id]/page.tsx`
- `reserve-app/src/__tests__/e2e/admin-customers.spec.ts`

---

### #20 [FEATURE] 顧客メモ機能 ✅ CLOSED
**Labels**: `feature`, `sprint-3`, `priority-medium`
**完了日**: 2026-01-01

**実装タスク**:
- [x] 顧客メモCRUD機能
- [x] メモ表示UI
- [x] データベーススキーマ変更（memoフィールド追加）
- [x] 文字数制限実装（500文字）
- [x] 文字カウンター表示

**成果物**:
- `reserve-app/src/app/api/admin/customers/[id]/memo/route.ts`
- `reserve-app/src/app/admin/customers/[id]/page.tsx`（メモ機能含む）
- `reserve-app/prisma/schema.prisma`（memoフィールド追加）

---

### #21 [FEATURE] スタッフ管理（CRUD） ✅ CLOSED
**Labels**: `feature`, `sprint-3`, `priority-medium`

---

### #22 [FEATURE] スタッフシフト設定 ✅ CLOSED
**Labels**: `feature`, `sprint-3`, `priority-medium`

---

## 📦 Sprint 4: 拡張機能 ⚠️ 一部未完了

### #23 [FEATURE] メニュー管理（CRUD） ✅ CLOSED
**Labels**: `feature`, `sprint-4`, `priority-medium`

---

### #24 [FEATURE] 店舗設定（営業時間・定休日） ✅ CLOSED
**Labels**: `feature`, `sprint-4`, `priority-medium`

---

### #25 [FEATURE] リマインダーメール自動送信 ✅ CLOSED
**Labels**: `feature`, `sprint-4`, `priority-medium`

**ユーザーストーリー**:
```
As a customer
I want to receive a reminder email
So that I don't forget my reservation
```

**実装タスク**:
- [ ] Cron Job設定（Vercel Cron or Supabase Edge Functions）
- [ ] 前日リマインダーメール送信処理
- [ ] メールテンプレート作成

---

### #26 [FEATURE] 分析レポート（予約推移） ⚠️ OPEN
**Labels**: `feature`, `sprint-4`, `priority-low`

**実装タスク**:
- [ ] 予約件数推移グラフ（日別/週別/月別）
- [ ] グラフ表示UI（Chart.js or Recharts）

---

### #27 [FEATURE] リピート率分析 ⚠️ OPEN
**Labels**: `feature`, `sprint-4`, `priority-low`

**実装タスク**:
- [ ] リピート率計算ロジック
- [ ] 分析結果表示UI

---

### #28 [TEST] E2Eテスト拡充 ✅ CLOSED
**Labels**: `test`, `sprint-4`, `priority-medium`

**概要**: 全主要フローのE2Eテストカバレッジ100%達成

---

### #29 [REFACTOR] コンポーネント整理 ⚠️ OPEN
**Labels**: `refactor`, `tech-debt`, `sprint-4`

**概要**: 重複コードの削減、コンポーネントの分割

**実装タスク**:
- [ ] 共通コンポーネントの抽出
- [ ] コンポーネント分割
- [ ] 重複コード削減

---

### #30 [DOCS] API仕様書作成 ⚠️ OPEN (実質完了)
**Labels**: `docs`, `sprint-4`, `priority-low`

**概要**: 全APIエンドポイントの仕様書作成（OpenAPI or Markdown）

**補足**: `documents/api/API設計書.md` として既に作成済み（最終更新: 2026-01-01）。Issueクローズを推奨。

---

## 📦 Sprint 5: テスト品質向上（Page Objectパターン移行） ✅ 完了

### #43 [TEST] 予約機能のGherkin featureファイルとPage Object作成 ✅ CLOSED
**Labels**: `test`, `priority-high`

**概要**: 予約機能のBDD仕様とPage Objectパターン実装

---

### #44 [REFACTOR] booking.spec.tsをPage Objectパターンに移行 ✅ CLOSED
**Labels**: `refactor`, `test`, `priority-high`

---

### #45 [TEST] マイページのGherkin featureファイルとPage Object作成 ✅ CLOSED
**Labels**: `test`, `priority-high`

---

### #46 [REFACTOR] mypage.spec.tsをPage Objectパターンに移行 ✅ CLOSED
**Labels**: `refactor`, `test`, `priority-high`

---

### #47 [TEST] メニュー一覧のGherkin featureファイルとPage Object作成 ✅ CLOSED
**Labels**: `test`, `priority-medium`

---

### #48 [REFACTOR] menus.spec.tsをPage Objectパターンに移行 ✅ CLOSED
**Labels**: `refactor`, `test`, `priority-medium`

---

### #49 [TEST] ホームページのGherkin featureファイルとPage Object作成 ✅ CLOSED
**Labels**: `test`, `priority-medium`

---

### #50 [REFACTOR] home.spec.tsをPage Objectパターンに移行 ✅ CLOSED
**Labels**: `refactor`, `test`, `priority-medium`

---

## 📦 Sprint 6: セキュリティ強化 ⚠️ 一部未完了

### #62 【セキュリティ】セキュリティヘッダーの追加 ✅ CLOSED
**Labels**: `feature`, `security`, `priority-high`

**概要**: CSP, X-Frame-Options等のセキュリティヘッダー実装

---

### #63 【セキュリティ】APIエンドポイントへのレート制限実装 ✅ CLOSED
**Labels**: `feature`, `security`, `priority-high`

**概要**: Upstash Redisを使用したレート制限機能

---

### #64 【セキュリティ】CSRF保護の強化 ✅ CLOSED
**Labels**: `feature`, `security`, `priority-high`

---

### #65 【セキュリティ】パスワードポリシーの強化 ✅ CLOSED
**Labels**: `feature`, `security`, `priority-high`

**概要**: 8文字以上、英数字必須のパスワードポリシー実装

---

### #66 【セキュリティ】Next.js middlewareによる認証チェック実装 ✅ CLOSED
**Labels**: `feature`, `security`, `priority-high`

**概要**: middleware.tsによる認証ルート保護

---

### #67 【セキュリティ】セキュリティイベントのログ記録実装 ⚠️ OPEN
**Labels**: `feature`, `security`, `priority-medium`

**実装タスク**:
- [ ] ログイン試行ログ
- [ ] 不正アクセス検知ログ
- [ ] セキュリティイベント監視

---

## 📦 Sprint 7: パフォーマンス最適化 ⚠️ 一部未完了

### #68 【パフォーマンス】N+1問題の修正（admin/stats API） ✅ CLOSED
**Labels**: `performance`, `priority-high`

**概要**: 統計API のN+1クエリ問題を修正

---

### #69 【パフォーマンス】複合インデックスの追加 ✅ CLOSED
**Labels**: `performance`, `priority-high`

**概要**: Prismaスキーマに複合インデックスを追加してクエリ最適化

---

### #70 【パフォーマンス】トランザクションの実装 ⚠️ OPEN
**Labels**: `performance`, `priority-medium`

**実装タスク**:
- [ ] 予約作成時のトランザクション処理
- [ ] データ整合性の保証

---

### #71 【パフォーマンス】検索フィルターのDB最適化 ⚠️ OPEN
**Labels**: `performance`, `priority-medium`

**実装タスク**:
- [ ] 予約検索クエリの最適化
- [ ] インデックス活用の見直し

---

## 📦 Sprint 8: ドキュメント・設定機能拡張 ⚠️ 一部未完了

### #75 docs: プロジェクトドキュメントを拡充 ✅ CLOSED
**Labels**: `docs`, `priority-medium`

**概要**: 事業展開戦略、ポートフォリオ完成ロードマップ等のドキュメント作成

---

### #77 【設定機能】スタッフ指名機能のON/OFF設定 ⚠️ OPEN
**Labels**: `feature`, `settings`, `priority-low`

**実装タスク**:
- [ ] 設定画面にトグルスイッチ追加
- [ ] スタッフ指名フィールドの表示/非表示制御

---

### #78 【設定機能】スタッフシフト管理のON/OFF設定 ⚠️ OPEN
**Labels**: `feature`, `settings`, `priority-low`

**実装タスク**:
- [ ] 設定画面にトグルスイッチ追加
- [ ] シフト管理機能の有効/無効制御

---

### #79 【設定機能】予約受付期間の設定（何日前〜何日後） ✅ CLOSED
**Labels**: `feature`, `settings`, `priority-high`

**概要**: 予約可能期間の設定機能（最小/最大予約可能日数）

---

### #80 【設定機能】キャンセル期限の設定（予約日の何時間前まで） ✅ CLOSED
**Labels**: `feature`, `settings`, `priority-high`

**概要**: キャンセル可能期限の設定機能

---

## 🚀 Issue登録の手順

### 1. GitHubリポジトリ初期化
```bash
cd /Users/a-aoki/indivisual/2026/portpfolio/reserve-system
git init
git add .
git commit -m "Initial commit: Mock pages and documentation"
git branch -M main
git remote add origin [GitHubリポジトリURL]
git push -u origin main
```

### 2. ラベル作成
GitHubリポジトリ > Issues > Labels から、上記のラベルを手動作成

### 3. Issue一括登録（推奨ツール）
以下のツールを使うと効率的：
- **GitHub CLI**: `gh issue create`コマンドで一括登録
- **スクリプト**: Node.jsスクリプトで自動登録

### 4. プロジェクトボード作成
GitHub Projects で Sprint ごとのカンバンボードを作成

---

## 📊 進捗管理の推奨方法

### GitHub Projects（カンバンボード）
```
Backlog → In Progress → Review → Done
```

### Sprint別完了状況

| Sprint | 状態 | 完了率 |
|--------|------|--------|
| Sprint 1: 基盤構築 | ✅ 完了 | 100% (7/7) |
| Sprint 2: 予約機能（ユーザー側） | ✅ 完了 | 100% (7/7) |
| Sprint 3: 管理機能（店舗側） | ⚠️ 一部未完了 | 83% (5/6) |
| Sprint 4: 拡張機能 | ⚠️ 一部未完了 | 60% (3/5) |
| Sprint 5: テスト品質向上 | ✅ 完了 | 100% (8/8) |
| Sprint 6: セキュリティ強化 | ⚠️ 一部未完了 | 83% (5/6) |
| Sprint 7: パフォーマンス最適化 | ⚠️ 一部未完了 | 50% (2/4) |
| Sprint 8: ドキュメント・設定機能拡張 | ⚠️ 一部未完了 | 60% (3/5) |

### 未完了Issue一覧（優先順位順）

**優先度: 中〜高**
- #67: セキュリティイベントのログ記録実装
- #70: トランザクションの実装
- #71: 検索フィルターのDB最適化

**優先度: 低**
- #26: 分析レポート（予約推移）
- #27: リピート率分析
- #29: コンポーネント整理
- #30: API仕様書作成（実質完了）
- #77: スタッフ指名機能のON/OFF設定
- #78: スタッフシフト管理のON/OFF設定

---

## 🎯 次のステップ

### 推奨タスク優先順位
1. **Issue #30をクローズ**: API設計書は既に完成
2. ~~**顧客管理機能の実装** (#19, #20): ポートフォリオ価値向上~~ ✅ 完了
3. **分析レポート機能の実装** (#26, #27): データ可視化スキルのアピール
4. **パフォーマンス強化** (#70, #71): システムの完成度向上
5. **コンポーネント整理** (#29): 技術的負債の解消

---

**最終更新**: 2026-01-01
