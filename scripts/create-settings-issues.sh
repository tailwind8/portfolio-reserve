#!/bin/bash

# Phase 1の設定機能Issueを作成するスクリプト

# Issue 1-1: スタッフ指名機能のON/OFF設定
gh issue create \
  --title "【設定機能】スタッフ指名機能のON/OFF設定" \
  --label "feature,settings,priority-high,sprint-5" \
  --body "## 📋 機能概要
スタッフ指名機能を有効/無効にする設定を追加

## 🎯 目的
- 飲食店など、スタッフ指名が不要な業種に対応
- 予約フローをシンプル化したい店舗に対応

## 🔧 実装タスク

### データベース
- [ ] Prismaスキーマに\`enableStaffSelection\`フィールド追加
- [ ] マイグレーション作成・実行
- [ ] デフォルト値: \`true\`（既存動作を維持）

### バックエンド
- [ ] 設定取得API（\`GET /api/admin/settings\`）に新フィールド追加
- [ ] 設定更新API（\`PATCH /api/admin/settings\`）に新フィールド追加
- [ ] Zodバリデーション追加

### フロントエンド
- [ ] 設定画面にトグルスイッチ追加
- [ ] 予約ページ（\`/booking\`）でスタッフ選択欄の表示/非表示を動的制御
- [ ] \`enableStaffSelection=false\`の場合、スタッフ自動割り当て

### 空き時間API
- [ ] \`enableStaffSelection=false\`の場合、\`staffId\`パラメータを無視
- [ ] バックエンドで自動的にスタッフを割り当て

### テスト
- [ ] E2Eテスト: 設定OFF時のフロー
- [ ] E2Eテスト: 設定ON時のフロー
- [ ] 単体テスト: 設定バリデーション

## 📊 受入条件
- [ ] 設定画面でトグルスイッチで切り替え可能
- [ ] 予約画面でスタッフ選択欄の表示/非表示が動的に変わる
- [ ] 設定OFFでも予約が正常に作成される
- [ ] E2Eテストで両パターンをカバー

## 📚 関連ドキュメント
\`documents/issues-proposal-system-settings.md\` - Issue 1-1

## 🔗 関連Issue
なし"

# Issue 1-3: スタッフシフト管理のON/OFF設定
gh issue create \
  --title "【設定機能】スタッフシフト管理のON/OFF設定" \
  --label "feature,settings,priority-high,sprint-5" \
  --body "## 📋 機能概要
スタッフごとの勤務時間・休暇管理を有効/無効にする設定を追加

## 🎯 目的
- オーナー1人の個人店はシフト管理不要
- 複数スタッフのサロンはシフト管理が必要
- 店舗の運用形態に応じて切り替え可能にする

## 🔧 実装タスク

### データベース
- [ ] Prismaスキーマに\`enableStaffShifts\`フィールド追加
- [ ] マイグレーション作成・実行
- [ ] デフォルト値: \`false\`（シンプルな運用がデフォルト）

### 空き時間API修正（重要）
- [ ] \`enableStaffShifts=true\`の場合、シフト判定ロジック追加
  - [ ] \`RestaurantStaffShift\`から曜日・時間帯を取得
  - [ ] \`RestaurantStaffVacation\`から休暇期間を取得
  - [ ] 勤務時間外・休暇中のスタッフを除外
- [ ] \`enableStaffShifts=false\`の場合、\`isActive=true\`の全スタッフを対象（現状維持）

### シフト判定ロジック実装
\`\`\`typescript
// 疑似コード
function isStaffAvailable(
  staffId: string,
  date: Date,
  time: string,
  enableShifts: boolean
): boolean {
  if (!enableShifts) return true; // シフト管理OFF

  // 休暇チェック
  const vacation = await getStaffVacation(staffId, date);
  if (vacation) return false;

  // シフトチェック
  const dayOfWeek = getDayOfWeek(date);
  const shift = await getStaffShift(staffId, dayOfWeek);
  if (!shift) return false;

  // 時間チェック
  return isTimeInRange(time, shift.startTime, shift.endTime);
}
\`\`\`

### 管理画面
- [ ] 設定画面にトグルスイッチ追加
- [ ] \`/admin/staff\`にシフト設定タブ追加（設定ON時のみ表示）
- [ ] シフト登録・編集・削除UI実装
- [ ] 休暇登録・編集・削除UI実装

### テスト
- [ ] E2Eテスト: 設定OFF時の空き時間取得
- [ ] E2Eテスト: 設定ON + シフト内の時間帯
- [ ] E2Eテスト: 設定ON + シフト外の時間帯（予約不可）
- [ ] E2Eテスト: 設定ON + 休暇中（予約不可）
- [ ] 単体テスト: シフト判定ロジック

## 📊 受入条件
- [ ] 設定OFF時は既存動作を維持（後方互換性）
- [ ] 設定ON時のみシフトテーブルを参照
- [ ] シフト未登録スタッフは空き時間に表示されない
- [ ] 休暇期間中のスタッフは空き時間に表示されない
- [ ] E2Eテストですべてのパターンをカバー

## 📚 関連ドキュメント
\`documents/issues-proposal-system-settings.md\` - Issue 1-3

## 🔗 関連Issue
既存のシフト管理API（Issue #77）と連携"

# Issue 2-2: 予約受付期間の設定
gh issue create \
  --title "【設定機能】予約受付期間の設定（何日前〜何日後）" \
  --label "feature,settings,priority-high,sprint-5" \
  --body "## 📋 機能概要
何日前から何日後まで予約を受け付けるかを設定可能にする

## 🎯 目的
- 当日予約不可の店舗に対応
- 3ヶ月先までしか受け付けない店舗に対応
- 予約の管理負荷を軽減

## 🔧 実装タスク

### データベース
- [ ] Prismaスキーマに以下フィールド追加
  - \`minAdvanceBookingDays\`: 何日後から予約可能（デフォルト: 0）
  - \`maxAdvanceBookingDays\`: 何日後まで予約可能（デフォルト: 90）
- [ ] マイグレーション作成・実行

### バリデーション
- [ ] 設定値のバリデーション（\`min < max\`）
- [ ] 予約作成時のバリデーション
  \`\`\`typescript
  const today = new Date();
  const minDate = addDays(today, settings.minAdvanceBookingDays);
  const maxDate = addDays(today, settings.maxAdvanceBookingDays);

  if (reservedDate < minDate || reservedDate > maxDate) {
    throw new Error('予約可能期間外です');
  }
  \`\`\`

### フロントエンド
- [ ] 予約カレンダー（\`/booking\`）で範囲外の日付をグレーアウト
- [ ] ホバー時に「予約受付期間外です」とツールチップ表示
- [ ] カレンダーの表示範囲を設定に合わせる

### 設定画面
- [ ] 数値入力フィールド追加
- [ ] プレビュー表示（「本日から○日後〜○日後まで予約可能」）
- [ ] バリデーションエラー表示

### テスト
- [ ] E2Eテスト: 範囲内の日付で予約成功
- [ ] E2Eテスト: 範囲外の日付で予約失敗
- [ ] E2Eテスト: カレンダーのグレーアウト表示
- [ ] 単体テスト: 期間計算ロジック

## 📊 受入条件
- [ ] 設定画面で日数を入力可能
- [ ] カレンダーで範囲外の日付がグレーアウト
- [ ] 範囲外予約リクエストでバリデーションエラー
- [ ] エラーメッセージがわかりやすい

## 💡 ユースケース
- 当日予約不可: \`minAdvanceBookingDays=1\`
- 3ヶ月先まで受付: \`maxAdvanceBookingDays=90\`
- 2週間先まで: \`maxAdvanceBookingDays=14\`

## 📚 関連ドキュメント
\`documents/issues-proposal-system-settings.md\` - Issue 2-2

## 🔗 関連Issue
なし"

# Issue 2-3: キャンセル期限の設定
gh issue create \
  --title "【設定機能】キャンセル期限の設定（予約日の何時間前まで）" \
  --label "feature,settings,priority-high,sprint-5" \
  --body "## 📋 機能概要
予約日の何時間前までキャンセル可能かを設定

## 🎯 目的
- 当日キャンセルを防ぐ
- 直前キャンセルによる機会損失を減らす
- 店舗のキャンセルポリシーを反映

## 🔧 実装タスク

### データベース
- [ ] Prismaスキーマに\`cancellationDeadlineHours\`フィールド追加
- [ ] マイグレーション作成・実行
- [ ] デフォルト値: \`24\`（24時間前まで）

### キャンセル期限計算ロジック
\`\`\`typescript
function canCancelReservation(
  reservation: { reservedDate: Date; reservedTime: string },
  deadlineHours: number
): boolean {
  const reservationDateTime = parseDateTime(
    reservation.reservedDate,
    reservation.reservedTime
  );
  const now = new Date();
  const deadlineDateTime = subHours(reservationDateTime, deadlineHours);

  return now <= deadlineDateTime;
}
\`\`\`

### API修正
- [ ] \`DELETE /api/reservations/:id\`でキャンセル期限チェック追加
- [ ] 期限外の場合、403エラーを返す
  \`\`\`json
  {
    \"error\": \"キャンセル期限を過ぎています\",
    \"code\": \"CANCELLATION_DEADLINE_PASSED\",
    \"message\": \"予約日の24時間前までキャンセル可能です。店舗にお問い合わせください。\"
  }
  \`\`\`

### フロントエンド
- [ ] マイページ（\`/mypage\`）で期限判定
  - 期限内: キャンセルボタン表示
  - 期限外: 「キャンセル期限を過ぎています」メッセージ表示
- [ ] 予約詳細にキャンセル期限を表示
  - 例: 「2026年1月15日 14:00までキャンセル可能」

### 設定画面
- [ ] 時間数入力フィールド追加
- [ ] プレビュー表示（「予約日の○時間前までキャンセル可能」）
- [ ] よくある設定例を提示（24時間/48時間/1週間）

### テスト
- [ ] E2Eテスト: 期限内キャンセル成功
- [ ] E2Eテスト: 期限外キャンセル失敗
- [ ] E2Eテスト: UIでのキャンセルボタン表示/非表示
- [ ] 単体テスト: 期限計算ロジック

## 📊 受入条件
- [ ] 設定画面で時間数を入力可能
- [ ] 期限内のみキャンセル可能
- [ ] 期限外キャンセル時に明確なエラーメッセージ
- [ ] マイページでキャンセル可否が一目でわかる

## 💡 ユースケース
- 飲食店: \`24\`（前日まで）
- 病院: \`2\`（2時間前まで）
- イベント: \`168\`（1週間前まで）
- 美容室: \`24\`（前日まで）

## 📚 関連ドキュメント
\`documents/issues-proposal-system-settings.md\` - Issue 2-3

## 🔗 関連Issue
なし"

echo "✅ Phase 1の設定機能Issue（4件）を作成しました"
echo ""
echo "作成されたIssue:"
echo "- スタッフ指名機能のON/OFF設定"
echo "- スタッフシフト管理のON/OFF設定"
echo "- 予約受付期間の設定"
echo "- キャンセル期限の設定"
echo ""
echo "次のステップ:"
echo "1. GitHub IssuesページでIssueを確認"
echo "2. スプリント5に追加"
echo "3. 優先順位を調整"
