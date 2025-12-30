#!/bin/bash

echo "📋 Sprint 3 & 4のIssueを作成します..."

# Sprint 3: 管理機能

# Issue #15: 管理者ダッシュボード（統計表示）
gh issue create \
  --title "[FEATURE] 管理者ダッシュボード（統計表示）" \
  --label "feature,sprint-3,priority-high" \
  --body "## 📋 機能概要
管理者用ダッシュボードに統計情報を表示

## 🎯 ユーザーストーリー
\`\`\`
As a store admin
I want to view key metrics on a dashboard
So that I can understand business performance
\`\`\`

## 🔧 実装タスク
- [ ] E2Eテスト作成
- [ ] 統計データ取得API実装
- [ ] ダッシュボードコンポーネント実装
- [ ] グラフ表示（Chart.js or Recharts）
- [ ] リアルタイム更新

## 📦 関連Issue
- Depends on: #7"

echo "✅ Issue #15 作成完了"

# Issue #16-22: 管理機能
for issue_num in 16 17 18 19 20 21 22; do
  case $issue_num in
    16)
      title="予約一覧表示（管理者）"
      body="管理者が全予約を一覧表示・フィルタリング"
      ;;
    17)
      title="予約手動追加（管理者）"
      body="管理者が電話予約などを手動で追加"
      ;;
    18)
      title="予約編集・削除（管理者）"
      body="管理者が予約情報を編集・削除"
      ;;
    19)
      title="顧客管理（一覧・詳細）"
      body="管理者が顧客情報を閲覧・管理"
      ;;
    20)
      title="顧客メモ機能"
      body="顧客ごとにメモを記録"
      ;;
    21)
      title="スタッフ管理（CRUD）"
      body="スタッフ情報の登録・編集・削除"
      ;;
    22)
      title="スタッフシフト設定"
      body="スタッフの出勤シフトを設定"
      ;;
  esac

  gh issue create \
    --title "[FEATURE] $title" \
    --label "feature,sprint-3,priority-medium" \
    --body "## 📋 機能概要
$body

## 🔧 実装タスク
- [ ] E2Eテスト作成
- [ ] API実装
- [ ] UI実装
- [ ] バリデーション
- [ ] テストデータ作成

## 📦 関連Issue
- Depends on: #15" >/dev/null

  echo "✅ Issue #$issue_num 作成完了"
done

# Sprint 4: 拡張機能

# Issue #23-27: 拡張機能
for issue_num in 23 24 25 26 27; do
  case $issue_num in
    23)
      title="メニュー管理（CRUD）"
      label="feature,sprint-4,priority-medium"
      body="管理者がメニュー情報を管理"
      ;;
    24)
      title="店舗設定（営業時間・定休日）"
      label="feature,sprint-4,priority-medium"
      body="店舗の基本情報・営業時間を設定"
      ;;
    25)
      title="リマインダーメール自動送信"
      label="feature,sprint-4,priority-medium"
      body="予約前日にリマインダーメールを自動送信（Cron Job）"
      ;;
    26)
      title="分析レポート（予約推移）"
      label="feature,sprint-4,priority-low"
      body="予約件数の推移をグラフで表示"
      ;;
    27)
      title="リピート率分析"
      label="feature,sprint-4,priority-low"
      body="顧客のリピート率を分析・表示"
      ;;
  esac

  gh issue create \
    --title "[FEATURE] $title" \
    --label "$label" \
    --body "## 📋 機能概要
$body

## 🔧 実装タスク
- [ ] E2Eテスト作成
- [ ] API実装
- [ ] UI実装
- [ ] テスト" >/dev/null

  echo "✅ Issue #$issue_num 作成完了"
done

# Issue #28: E2Eテスト拡充
gh issue create \
  --title "[TEST] E2Eテスト拡充" \
  --label "test,sprint-4,priority-medium" \
  --body "## 📋 テスト対象
全主要フローのE2Eテストカバレッジ100%達成

## 🧪 テストケース
- [ ] ユーザー登録フロー
- [ ] ログインフロー
- [ ] 予約作成フロー
- [ ] 予約変更フロー
- [ ] 予約キャンセルフロー
- [ ] 管理者ログインフロー
- [ ] 予約管理フロー
- [ ] 顧客管理フロー

## 📈 カバレッジ目標
- 現在: XX%
- 目標: 90%+" >/dev/null

echo "✅ Issue #28 作成完了"

# Issue #29: コンポーネント整理
gh issue create \
  --title "[REFACTOR] コンポーネント整理" \
  --label "refactor,tech-debt,sprint-4" \
  --body "## 🔄 リファクタリング対象
重複コードの削減、コンポーネントの分割

## 🎯 リファクタリングの目的
- [x] 可読性向上
- [x] 保守性向上
- [x] 重複コード削減（DRY原則）
- [x] コード量削減

## ✅ チェックリスト
- [ ] 既存テストがすべて通る
- [ ] 機能に影響がない（デグレなし）
- [ ] ESLint/TypeScriptエラー0件" >/dev/null

echo "✅ Issue #29 作成完了"

# Issue #30: API仕様書作成
gh issue create \
  --title "[DOCS] API仕様書作成" \
  --label "docs,sprint-4,priority-low" \
  --body "## 📋 概要
全APIエンドポイントの仕様書作成

## 🔧 実装タスク
- [ ] OpenAPI (Swagger) 仕様書作成
- [ ] 各エンドポイントのドキュメント
- [ ] サンプルリクエスト/レスポンス
- [ ] エラーコード一覧

## 📝 メモ
documents/API仕様書/ に配置" >/dev/null

echo "✅ Issue #30 作成完了"

echo ""
echo "🎉 Sprint 3 & 4のIssue作成完了（16件）"
echo ""
echo "✅ 全Issue作成完了！合計30件"
