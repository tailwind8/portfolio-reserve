# language: ja

Feature: GitHub Actions CI/CD
  As a developer
  I want automated CI/CD pipelines
  So that code quality is maintained and deployment is automated

  Background:
    Given GitHub Actionsワークフローが設定されている
    And reserve-appディレクトリにNext.jsアプリケーションが存在する

  Scenario: PR作成時にCI/CDワークフローが実行される
    Given 開発者が新しい機能を実装している
    When GitHubにPull Requestを作成する
    Then "CI/CD"ワークフローが自動的にトリガーされる
    And 以下のジョブが順番に実行される:
      | ジョブ名 | 説明 |
      | lint-and-test | ESLint、ビルド、テストを実行 |
      | deploy-preview | Vercel Preview環境にデプロイ |

  Scenario: lint-and-testジョブが成功する
    Given PR作成時にCI/CDワークフローが開始される
    When "lint-and-test"ジョブが実行される
    Then 以下のステップが全て成功する:
      | ステップ名 | コマンド |
      | Checkout code | actions/checkout@v4 |
      | Setup Node.js | actions/setup-node@v4 |
      | Install dependencies | npm ci |
      | Generate Prisma Client | npm run prisma:generate |
      | Run ESLint | npm run lint |
      | Type check and build | npm run build:ci |
      | Run unit tests with coverage | npm run test:coverage |
      | Install Playwright browsers | npx playwright install chromium --with-deps |
      | Run E2E tests | npm run test:e2e |
    And カバレッジレポートがCodecovにアップロードされる
    And E2Eテスト結果がアーティファクトとして保存される

  Scenario: lint-and-testジョブが失敗した場合、デプロイをブロックする
    Given PR作成時にCI/CDワークフローが開始される
    When "lint-and-test"ジョブでテストが失敗する
    Then "deploy-preview"ジョブはスキップされる
    And PRのチェックが失敗状態になる
    And マージがブロックされる

  Scenario: PR作成時にVercel Preview環境にデプロイされる
    Given "lint-and-test"ジョブが成功している
    When "deploy-preview"ジョブが実行される
    Then Vercel Preview環境にアプリケーションがデプロイされる
    And PRにプレビューURLのコメントが追加される

  Scenario: mainブランチへのマージ時に本番環境へデプロイされる
    Given PRがmainブランチにマージされる
    When "CI/CD"ワークフローがpushイベントでトリガーされる
    Then "lint-and-test"ジョブが実行される
    And "lint-and-test"ジョブが成功する
    And "deploy-production"ジョブが実行される
    And Vercel Production環境にアプリケーションがデプロイされる

  Scenario: 環境変数が正しく設定されている
    Given ".env.example"ファイルが存在する
    When 開発者が環境変数の設定方法を確認する
    Then 以下の環境変数が定義されている:
      | 環境変数名 | 説明 |
      | DATABASE_URL | Supabase PostgreSQL接続URL |
      | DIRECT_URL | マイグレーション用接続URL |
      | NEXT_PUBLIC_SUPABASE_URL | SupabaseプロジェクトURL |
      | NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Supabase公開キー |
      | SUPABASE_SECRET_KEY | Supabaseシークレットキー |
      | NEXT_PUBLIC_TENANT_ID | テナントID |
      | NEXT_PUBLIC_BASE_URL | アプリケーションベースURL |
      | NODE_ENV | 環境（development/production） |
    And Vercel環境変数設定ガイドが提供されている

  Scenario: .gitignoreでシークレットが保護されている
    Given ".gitignore"ファイルが設定されている
    When 開発者がgit commitを実行する
    Then ".env.local"ファイルはコミットされない
    And ".env"ファイルはコミットされない
    And ".env.example"ファイルはコミットできる

  Scenario: CI実行時にダミーDATABASE_URLが使用される
    Given ビルドジョブが実行される
    When DATABASE_URLが設定されていない環境でビルドする
    Then ダミーURLが環境変数として設定される:
      """
      DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
      """
    And ビルドが成功する

  Scenario: カバレッジ閾値が設定されている
    Given jest.config.jsにカバレッジ閾値が設定されている
    When 単体テストが実行される
    Then 以下の閾値を満たす必要がある:
      | 指標 | 閾値 |
      | branches | 70% |
      | functions | 80% |
      | lines | 80% |
      | statements | 80% |
    And 閾値を下回る場合はテストが失敗する
