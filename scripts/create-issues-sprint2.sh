#!/bin/bash

echo "📋 Sprint 2のIssueを作成します..."

# Issue #8: メニュー一覧表示
gh issue create \
  --title "[FEATURE] メニュー一覧表示" \
  --label "feature,sprint-2,priority-high" \
  --body "## 📋 機能概要
ユーザーが利用可能なメニューを一覧表示

## 🎯 ユーザーストーリー
\`\`\`
As a customer
I want to view available menus
So that I can choose what service I want
\`\`\`

## ✅ 受入基準（BDD Scenario）
\`\`\`gherkin
Feature: メニュー一覧表示

  Scenario: メニュー一覧を表示
    Given メニューページにアクセスしている
    When ページが読み込まれる
    Then すべてのメニューが表示される
    And 各メニューに料金と所要時間が表示される
\`\`\`

## 🔧 実装タスク
- [ ] E2Eテスト作成
- [ ] API実装（GET /api/menus）
- [ ] メニューカードコンポーネント実装
- [ ] カテゴリフィルタ機能
- [ ] ローディング状態実装

## 📦 関連Issue
- Depends on: #2"

echo "✅ Issue #8 作成完了"

# Issue #9: 予約カレンダー（空き状況表示）
gh issue create \
  --title "[FEATURE] 予約カレンダー（空き状況表示）" \
  --label "feature,sprint-2,priority-high" \
  --body "## 📋 機能概要
空き状況をカレンダーで視覚的に表示

## 🎯 ユーザーストーリー
\`\`\`
As a customer
I want to see available time slots on a calendar
So that I can choose a convenient time
\`\`\`

## ✅ 受入基準（BDD Scenario）
\`\`\`gherkin
Feature: 予約カレンダー

  Scenario: 空き状況を確認
    Given 予約ページにアクセスしている
    When カレンダーで日付を選択する
    Then その日の空き時間帯が表示される
    And 予約済みの時間帯はグレーアウトされる
\`\`\`

## 🔧 実装タスク
- [ ] E2Eテスト作成
- [ ] カレンダーコンポーネント実装
- [ ] 空き状況取得API実装（GET /api/availability）
- [ ] リアルタイム更新機能（Supabase Realtime）
- [ ] 時間帯選択UI実装

## 📦 関連Issue
- Depends on: #2"

echo "✅ Issue #9 作成完了"

# Issue #10: 予約登録機能
gh issue create \
  --title "[FEATURE] 予約登録機能" \
  --label "feature,sprint-2,priority-high" \
  --body "## 📋 機能概要
ユーザーが予約を作成できる機能

## 🎯 ユーザーストーリー
\`\`\`
As a customer
I want to book a reservation
So that I can visit the store at my preferred time
\`\`\`

## ✅ 受入基準（BDD Scenario）
\`\`\`gherkin
Feature: 予約登録

  Scenario: 予約成功
    Given ログイン済みユーザーが予約ページにいる
    When 日付、時間、メニュー、スタッフを選択する
    And \"予約を確定する\"ボタンをクリックする
    Then 予約が登録される
    And 予約完了画面が表示される
    And 確認メールが送信される
\`\`\`

## 🔧 実装タスク
- [ ] E2Eテスト作成
- [ ] 予約登録API実装（POST /api/reservations）
- [ ] バリデーション（重複予約チェック）
- [ ] 確認メール送信
- [ ] トランザクション処理
- [ ] 予約完了画面実装

## 📦 関連Issue
- Depends on: #9, #11"

echo "✅ Issue #10 作成完了"

# Issue #11: 予約確認メール送信
gh issue create \
  --title "[FEATURE] 予約確認メール送信" \
  --label "feature,sprint-2,priority-high" \
  --body "## 📋 機能概要
予約時に確認メールを自動送信

## 🎯 ユーザーストーリー
\`\`\`
As a customer
I want to receive a confirmation email
So that I have a record of my reservation
\`\`\`

## 🔧 実装タスク
- [ ] メール送信機能実装（Resend or SendGrid）
- [ ] メールテンプレート作成（HTML）
- [ ] E2Eテストでメール送信確認
- [ ] 環境変数設定（APIキー）

## 📝 メモ
開発環境ではメール送信をモック化"

echo "✅ Issue #11 作成完了"

# Issue #12: マイページ（予約一覧）
gh issue create \
  --title "[FEATURE] マイページ（予約一覧）" \
  --label "feature,sprint-2,priority-medium" \
  --body "## 📋 機能概要
ユーザーが自分の予約一覧を確認できる

## 🎯 ユーザーストーリー
\`\`\`
As a customer
I want to view my reservations
So that I can manage my bookings
\`\`\`

## ✅ 受入基準（BDD Scenario）
\`\`\`gherkin
Feature: マイページ

  Scenario: 予約一覧を表示
    Given ログイン済みユーザーがマイページにアクセスする
    Then 自分の予約一覧が表示される
    And 各予約の日時、メニュー、ステータスが表示される
\`\`\`

## 🔧 実装タスク
- [ ] E2Eテスト作成
- [ ] API実装（GET /api/reservations）
- [ ] 予約カードコンポーネント実装
- [ ] ステータス別フィルタ機能
- [ ] ページネーション実装

## 📦 関連Issue
- Depends on: #10"

echo "✅ Issue #12 作成完了"

# Issue #13: 予約変更機能
gh issue create \
  --title "[FEATURE] 予約変更機能" \
  --label "feature,sprint-2,priority-medium" \
  --body "## 📋 機能概要
ユーザーが既存の予約を変更できる

## 🎯 ユーザーストーリー
\`\`\`
As a customer
I want to change my reservation
So that I can adjust to my schedule
\`\`\`

## ✅ 受入基準（BDD Scenario）
\`\`\`gherkin
Feature: 予約変更

  Scenario: 予約変更成功
    Given マイページで予約を選択している
    When \"変更\"ボタンをクリックする
    And 新しい日時を選択する
    And \"変更を保存\"ボタンをクリックする
    Then 予約が更新される
    And 変更確認メールが送信される
\`\`\`

## 🔧 実装タスク
- [ ] E2Eテスト作成
- [ ] API実装（PATCH /api/reservations/:id）
- [ ] 予約編集画面実装
- [ ] バリデーション（変更可能期限チェック）
- [ ] 変更確認メール送信

## 📦 関連Issue
- Depends on: #12"

echo "✅ Issue #13 作成完了"

# Issue #14: 予約キャンセル機能
gh issue create \
  --title "[FEATURE] 予約キャンセル機能" \
  --label "feature,sprint-2,priority-medium" \
  --body "## 📋 機能概要
ユーザーが予約をキャンセルできる

## 🎯 ユーザーストーリー
\`\`\`
As a customer
I want to cancel my reservation
So that I can free up the time slot
\`\`\`

## ✅ 受入基準（BDD Scenario）
\`\`\`gherkin
Feature: 予約キャンセル

  Scenario: 予約キャンセル成功
    Given マイページで予約を選択している
    When \"キャンセル\"ボタンをクリックする
    And 確認ダイアログで\"はい\"を選択する
    Then 予約がキャンセル済みに更新される
    And キャンセル確認メールが送信される
\`\`\`

## 🔧 実装タスク
- [ ] E2Eテスト作成
- [ ] API実装（PATCH /api/reservations/:id/cancel）
- [ ] 確認ダイアログ実装
- [ ] バリデーション（キャンセル期限チェック）
- [ ] キャンセル確認メール送信

## 📦 関連Issue
- Depends on: #12"

echo "✅ Issue #14 作成完了"

echo ""
echo "🎉 Sprint 2のIssue作成完了（7件）"
