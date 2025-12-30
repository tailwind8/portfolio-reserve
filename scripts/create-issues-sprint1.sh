#!/bin/bash

echo "📋 Sprint 1のIssueを作成します..."

# Issue #1: テスト環境セットアップ
gh issue create \
  --title "[FEATURE] テスト環境セットアップ" \
  --label "feature,test,sprint-1,priority-high" \
  --body "## 📋 機能概要
Jest, React Testing Library, Playwrightのセットアップ

## 🎯 ユーザーストーリー
\`\`\`
As a developer
I want to set up testing environment
So that I can write reliable tests for all features
\`\`\`

## ✅ 受入基準（BDD Scenario）
\`\`\`gherkin
Feature: テスト環境構築

  Scenario: 単体テストを実行できる
    Given Jestがインストールされている
    When \`npm run test\`を実行する
    Then テストが正常に実行される

  Scenario: E2Eテストを実行できる
    Given Playwrightがインストールされている
    When \`npm run test:e2e\`を実行する
    Then E2Eテストが正常に実行される
\`\`\`

## 🔧 実装タスク
- [ ] Jestインストール・設定
- [ ] React Testing Libraryインストール・設定
- [ ] Playwrightインストール・設定
- [ ] MSW（Mock Service Worker）セットアップ
- [ ] サンプルテスト作成・実行確認
- [ ] package.jsonにテストスクリプト追加

## 📝 参考
- documents/ATDD-BDD環境セットアップ.md"

echo "✅ Issue #1 作成完了"

# Issue #2: Prisma + Supabaseセットアップ
gh issue create \
  --title "[FEATURE] Prisma + Supabaseセットアップ" \
  --label "feature,sprint-1,priority-high" \
  --body "## 📋 機能概要
Prismaのセットアップとデータベース接続

## 🎯 ユーザーストーリー
\`\`\`
As a developer
I want to set up Prisma ORM with Supabase
So that I can interact with the database in a type-safe way
\`\`\`

## ✅ 受入基準（BDD Scenario）
\`\`\`gherkin
Feature: データベース接続

  Scenario: Prisma Clientでデータベースに接続できる
    Given Prismaがセットアップされている
    And Supabase接続情報が設定されている
    When Prisma Clientを使用してクエリを実行する
    Then データが取得できる
\`\`\`

## 🔧 実装タスク
- [ ] Prismaインストール
- [ ] schema.prisma作成（restaurant_* テーブル定義）
- [ ] .env.local設定（Supabase接続情報）
- [ ] 初回マイグレーション実行
- [ ] Prisma Clientセットアップ
- [ ] 接続テスト実行

## 🗄️ データベース変更
- [x] 新規テーブル作成
  - restaurant_users
  - restaurant_reservations
  - restaurant_menus
  - restaurant_staff
  - restaurant_settings

## 📝 参考
- documents/デモサイトのインフラ.md
- documents/ATDD-BDD環境セットアップ.md"

echo "✅ Issue #2 作成完了"

# Issue #3: 環境変数管理
gh issue create \
  --title "[FEATURE] 環境変数管理" \
  --label "feature,sprint-1,priority-high" \
  --body "## 📋 機能概要
.env.local, .env.exampleの整備

## 🔧 実装タスク
- [ ] .env.example作成
- [ ] Supabase環境変数定義
  - DATABASE_URL
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Vercel環境変数設定ドキュメント作成
- [ ] .gitignoreに.env.local追加確認

## 📝 メモ
本番環境ではVercelの環境変数に設定する"

echo "✅ Issue #3 作成完了"

# Issue #4: CI/CD構築（GitHub Actions）
gh issue create \
  --title "[FEATURE] CI/CD構築（GitHub Actions）" \
  --label "feature,sprint-1,priority-high" \
  --body "## 📋 機能概要
自動テスト・デプロイのワークフロー構築

## 🔧 実装タスク
- [ ] test.ymlワークフロー作成（PR時に自動テスト）
- [ ] lint.ymlワークフロー作成（ESLint + TypeScript）
- [ ] deploy.ymlワークフロー作成（mainマージ時に自動デプロイ）
- [ ] Vercel連携設定
- [ ] PR作成してCI動作確認

## ✅ 成功基準
- PR作成時に自動テスト実行
- mainマージ時に自動デプロイ
- テスト失敗時はマージブロック

## 📝 参考
- documents/ATDD-BDD環境セットアップ.md"

echo "✅ Issue #4 作成完了"

# Issue #5: ユーザー新規登録機能
gh issue create \
  --title "[FEATURE] ユーザー新規登録機能" \
  --label "feature,sprint-1,priority-high" \
  --body "## 📋 機能概要
ユーザーがアカウントを作成できる機能

## 🎯 ユーザーストーリー
\`\`\`
As a customer
I want to register for an account
So that I can make reservations
\`\`\`

## ✅ 受入基準（BDD Scenario）
\`\`\`gherkin
Feature: ユーザー新規登録

  Scenario: 新規登録成功
    Given 新規登録ページにアクセスしている
    When 名前に\"山田太郎\"を入力する
    And メールアドレスに\"yamada@example.com\"を入力する
    And パスワードに\"password123\"を入力する
    And \"アカウントを作成\"ボタンをクリックする
    Then 確認メールが送信される
    And ログインページにリダイレクトされる
\`\`\`

## 🔧 実装タスク
- [ ] BDDシナリオ作成
- [ ] E2Eテスト実装（Playwright）
- [ ] 単体テスト実装（Jest + RTL）
- [ ] Supabase Auth統合
- [ ] バリデーション実装（Zod）
- [ ] エラーハンドリング
- [ ] 確認メール送信機能
- [ ] リファクタリング

## 📦 関連Issue
- Depends on: #1, #2"

echo "✅ Issue #5 作成完了"

# Issue #6: ユーザーログイン機能
gh issue create \
  --title "[FEATURE] ユーザーログイン機能" \
  --label "feature,sprint-1,priority-high" \
  --body "## 📋 機能概要
ユーザーがアカウントにログインできる機能

## 🎯 ユーザーストーリー
\`\`\`
As a customer
I want to log in to my account
So that I can access my reservations
\`\`\`

## ✅ 受入基準（BDD Scenario）
\`\`\`gherkin
Feature: ユーザーログイン

  Scenario: ログイン成功
    Given ログインページにアクセスしている
    And 登録済みユーザーが存在する
    When メールアドレスに\"yamada@example.com\"を入力する
    And パスワードに\"password123\"を入力する
    And \"ログイン\"ボタンをクリックする
    Then ダッシュボードにリダイレクトされる
    And ユーザー名が表示される
\`\`\`

## 🔧 実装タスク
- [ ] E2Eテスト作成
- [ ] Supabase Auth統合（ログイン）
- [ ] セッション管理
- [ ] エラーハンドリング
- [ ] ログイン状態の保持

## 📦 関連Issue
- Depends on: #5"

echo "✅ Issue #6 作成完了"

# Issue #7: 管理者ログイン機能
gh issue create \
  --title "[FEATURE] 管理者ログイン機能" \
  --label "feature,sprint-1,priority-high" \
  --body "## 📋 機能概要
管理者が管理画面にログインできる機能

## 🎯 ユーザーストーリー
\`\`\`
As a store admin
I want to log in to the admin panel
So that I can manage reservations
\`\`\`

## ✅ 受入基準（BDD Scenario）
\`\`\`gherkin
Feature: 管理者ログイン

  Scenario: 管理者ログイン成功
    Given 管理者ログインページにアクセスしている
    When メールアドレスに\"admin@store.com\"を入力する
    And パスワードに\"adminpass\"を入力する
    And \"ログイン\"ボタンをクリックする
    Then 管理者ダッシュボードにリダイレクトされる
\`\`\`

## 🔧 実装タスク
- [ ] E2Eテスト作成
- [ ] 管理者ロール判定ロジック
- [ ] 管理者専用ルート保護
- [ ] セッション管理

## 📦 関連Issue
- Depends on: #6"

echo "✅ Issue #7 作成完了"

echo ""
echo "🎉 Sprint 1のIssue作成完了（7件）"
