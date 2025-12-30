# GitHub Issues 一覧

このドキュメントは、GitHub Issueとして登録すべき機能の完全リストです。
以下の順序で登録することを推奨します。

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

## 📦 Sprint 1: 基盤構築（Week 1）

### #1 [FEATURE] テスト環境セットアップ
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

### #2 [FEATURE] Prisma + Supabaseセットアップ
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

### #3 [FEATURE] 環境変数管理
**Labels**: `feature`, `sprint-1`, `priority-high`

**概要**: .env.local, .env.exampleの整備

**実装タスク**:
- [ ] .env.example作成
- [ ] Supabase環境変数定義
- [ ] Vercel環境変数設定ドキュメント作成

---

### #4 [FEATURE] CI/CD構築（GitHub Actions）
**Labels**: `feature`, `sprint-1`, `priority-high`

**概要**: 自動テスト・デプロイのワークフロー構築

**実装タスク**:
- [ ] test.ymlワークフロー作成（PR時に自動テスト）
- [ ] lint.ymlワークフロー作成（ESLint + TypeScript）
- [ ] deploy.ymlワークフロー作成（mainマージ時に自動デプロイ）

---

### #5 [FEATURE] ユーザー新規登録機能
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

### #6 [FEATURE] ユーザーログイン機能
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

### #7 [FEATURE] 管理者ログイン機能
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

## 📦 Sprint 2: 予約機能（ユーザー側）（Week 2）

### #8 [FEATURE] メニュー一覧表示
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

### #9 [FEATURE] 予約カレンダー（空き状況表示）
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

### #10 [FEATURE] 予約登録機能
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

### #11 [FEATURE] 予約確認メール送信
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

### #12 [FEATURE] マイページ（予約一覧）
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

### #13 [FEATURE] 予約変更機能
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

### #14 [FEATURE] 予約キャンセル機能
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

## 📦 Sprint 3: 管理機能（店舗側）（Week 3）

### #15 [FEATURE] 管理者ダッシュボード（統計表示）
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

### #16 [FEATURE] 予約一覧表示（管理者）
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

### #17 [FEATURE] 予約手動追加（管理者）
**Labels**: `feature`, `sprint-3`, `priority-high`

**ユーザーストーリー**:
```
As a store admin
I want to manually add reservations
So that I can handle phone bookings
```

---

### #18 [FEATURE] 予約編集・削除（管理者）
**Labels**: `feature`, `sprint-3`, `priority-high`

---

### #19 [FEATURE] 顧客管理（一覧・詳細）
**Labels**: `feature`, `sprint-3`, `priority-medium`

**ユーザーストーリー**:
```
As a store admin
I want to view customer information
So that I can provide personalized service
```

---

### #20 [FEATURE] 顧客メモ機能
**Labels**: `feature`, `sprint-3`, `priority-medium`

---

### #21 [FEATURE] スタッフ管理（CRUD）
**Labels**: `feature`, `sprint-3`, `priority-medium`

---

### #22 [FEATURE] スタッフシフト設定
**Labels**: `feature`, `sprint-3`, `priority-medium`

---

## 📦 Sprint 4: 拡張機能（Week 4）

### #23 [FEATURE] メニュー管理（CRUD）
**Labels**: `feature`, `sprint-4`, `priority-medium`

---

### #24 [FEATURE] 店舗設定（営業時間・定休日）
**Labels**: `feature`, `sprint-4`, `priority-medium`

---

### #25 [FEATURE] リマインダーメール自動送信
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

### #26 [FEATURE] 分析レポート（予約推移）
**Labels**: `feature`, `sprint-4`, `priority-low`

---

### #27 [FEATURE] リピート率分析
**Labels**: `feature`, `sprint-4`, `priority-low`

---

### #28 [TEST] E2Eテスト拡充
**Labels**: `test`, `sprint-4`, `priority-medium`

**概要**: 全主要フローのE2Eテストカバレッジ100%達成

---

### #29 [REFACTOR] コンポーネント整理
**Labels**: `refactor`, `tech-debt`, `sprint-4`

**概要**: 重複コードの削減、コンポーネントの分割

---

### #30 [DOCS] API仕様書作成
**Labels**: `docs`, `sprint-4`, `priority-low`

**概要**: 全APIエンドポイントの仕様書作成（OpenAPI or Markdown）

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
Backlog → Sprint 1 → In Progress → Review → Done
```

### マイルストーン
- Sprint 1: Week 1 (1/15 - 1/22)
- Sprint 2: Week 2 (1/23 - 1/29)
- Sprint 3: Week 3 (1/30 - 2/5)
- Sprint 4: Week 4 (2/6 - 2/12)

---

次は、このリストをもとにGitHubに実際にIssueを登録しますか？
それとも、先にテスト環境のセットアップから始めますか？
