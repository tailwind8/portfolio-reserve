# 予約システム設定機能 - Issue提案書

**作成日**: 2026-01-01
**目的**: 販売可能なSaaS型予約システムとして、店舗ごとに運用形態を柔軟に設定できるようにする

---

## 🎯 背景

現在のシステムは固定的な運用フローになっており、以下のような多様な店舗形態に対応できていない：

- **スタッフ1人の個人店** vs **スタッフ10人以上のチェーン店**
- **スタッフ指名必須の美容室** vs **誰でもOKの飲食店**
- **即座予約確定したい店舗** vs **管理者承認が必要な店舗**
- **シフト管理が必要** vs **常に営業している店舗**

これらに対応するため、`RestaurantSettings`テーブルを拡張し、設定画面から運用形態を切り替え可能にする。

---

## 📊 新規設定項目リスト

### 1️⃣ スタッフ運用設定

#### Issue 1-1: スタッフ指名機能のON/OFF設定
**優先度**: High
**ラベル**: `feature`, `settings`, `priority-high`

**概要**:
スタッフ指名機能を有効/無効にする設定を追加

**テーブル追加項目**:
```prisma
enableStaffSelection Boolean @default(true) @map("enable_staff_selection")
```

**影響範囲**:
- 予約フロー（`/booking`）
  - `false`: スタッフ選択欄を非表示、バックエンドで自動割り当て
  - `true`: 現状の動作（指名あり/なしを選択可能）
- 空き時間API（`/api/available-slots`）
  - `false`: 全スタッフからランダムに割り当て
  - `true`: 指名に応じて空き状況を返す

**ユースケース**:
- 飲食店: `false`（席があれば誰でもOK）
- 美容室: `true`（担当者指名が重要）

**受入条件**:
- [ ] 設定画面でトグルスイッチで切り替え可能
- [ ] 予約画面でスタッフ選択欄の表示/非表示が動的に変わる
- [ ] E2Eテストで両パターンをカバー

---

#### Issue 1-2: スタッフ指名必須/任意設定
**優先度**: Medium
**ラベル**: `feature`, `settings`, `priority-medium`

**概要**:
スタッフ指名を必須にするか、任意（指名なし可）にするかを設定

**テーブル追加項目**:
```prisma
requireStaffSelection Boolean @default(false) @map("require_staff_selection")
```

**影響範囲**:
- 予約フロー（`/booking`）
  - `true`: スタッフ選択が必須、「指名なし」選択肢を非表示
  - `false`: 現状の動作（「指名なし」選択可能）
- バリデーション（`/lib/validations.ts`）
  - `requireStaffSelection=true`の場合、`staffId`を必須項目に

**ユースケース**:
- スタイリスト指名制の美容室: `true`
- 担当者不問のクリニック: `false`

**受入条件**:
- [ ] `enableStaffSelection=true`の場合のみ有効
- [ ] 予約時に`requireStaffSelection=true`かつ`staffId`未選択の場合、バリデーションエラー
- [ ] 設定画面で依存関係を明示（`enableStaffSelection`がfalseの場合は無効化）

---

#### Issue 1-3: スタッフシフト管理のON/OFF設定
**優先度**: High
**ラベル**: `feature`, `settings`, `priority-high`

**概要**:
スタッフごとの勤務時間・休暇管理を有効/無効にする

**テーブル追加項目**:
```prisma
enableStaffShifts Boolean @default(false) @map("enable_staff_shifts")
```

**影響範囲**:
- 空き時間API（`/api/available-slots`）
  - `true`: `RestaurantStaffShift`と`RestaurantStaffVacation`を考慮して空き状況を計算
  - `false`: `isActive=true`の全スタッフを対象（現状の動作）
- 管理画面（`/admin/staff`）
  - `true`: シフト設定・休暇設定タブを表示
  - `false`: シフト関連UIを非表示

**実装タスク**:
- [ ] `/api/available-slots`ロジック修正
  - シフト判定関数の追加
  - 休暇期間の除外
  - 勤務時間内のみ空き時間として返す
- [ ] 管理画面にシフト設定UI追加
- [ ] E2Eテストでシフト考慮パターンを追加

**ユースケース**:
- 複数スタッフのサロン: `true`（シフト制）
- オーナー1人の個人店: `false`（常に勤務）

**受入条件**:
- [ ] 設定OFF時は既存動作を維持（後方互換性）
- [ ] 設定ON時のみシフトテーブルを参照
- [ ] シフト未登録スタッフは空き時間に表示されない

---

### 2️⃣ 予約フロー設定

#### Issue 2-1: 予約承認制のON/OFF設定
**優先度**: Medium
**ラベル**: `feature`, `settings`, `priority-medium`

**概要**:
予約を即座に確定するか、管理者承認が必要かを設定

**テーブル追加項目**:
```prisma
requireApproval Boolean @default(false) @map("require_approval")
```

**影響範囲**:
- 予約作成API（`/api/reservations`）
  - `true`: 初期ステータスを`PENDING`（承認待ち）
  - `false`: 初期ステータスを`CONFIRMED`（確定）
- 予約確認メール
  - `true`: 「予約リクエストを受け付けました。承認までお待ちください」
  - `false`: 「予約が確定しました」
- 管理画面
  - `true`: 承認ボタン表示、`PENDING`→`CONFIRMED`の遷移
  - `false`: 承認フロー不要

**ユースケース**:
- 高級レストラン: `true`（席の調整が必要）
- ファストカジュアル: `false`（即座確定）

**受入条件**:
- [ ] 設定変更が既存予約に影響しない
- [ ] 承認/却下のメール通知実装
- [ ] ステータス遷移図を更新

---

#### Issue 2-2: 予約受付期間の設定
**優先度**: Medium
**ラベル**: `feature`, `settings`, `priority-medium`

**概要**:
何日前から何日後まで予約を受け付けるかを設定

**テーブル追加項目**:
```prisma
minAdvanceBookingDays Int @default(0) @map("min_advance_booking_days") // 何日後から予約可能
maxAdvanceBookingDays Int @default(90) @map("max_advance_booking_days") // 何日後まで予約可能
```

**影響範囲**:
- 予約カレンダー（`/booking`）
  - `minAdvanceBookingDays=1`: 当日予約不可、明日以降のみ選択可能
  - `maxAdvanceBookingDays=30`: 30日後までのみカレンダーに表示
- バリデーション
  - 範囲外の日付でエラー

**ユースケース**:
- 当日予約不可の店舗: `minAdvanceBookingDays=1`
- 3ヶ月先まで受付: `maxAdvanceBookingDays=90`

**受入条件**:
- [ ] カレンダーで範囲外の日付がグレーアウト
- [ ] 範囲外予約リクエストでバリデーションエラー
- [ ] 設定値のバリデーション（min < max）

---

#### Issue 2-3: キャンセル期限の設定
**優先度**: Medium
**ラベル**: `feature`, `settings`, `priority-medium`

**概要**:
予約日の何時間前までキャンセル可能かを設定

**テーブル追加項目**:
```prisma
cancellationDeadlineHours Int @default(24) @map("cancellation_deadline_hours")
```

**影響範囲**:
- 予約キャンセルAPI（`DELETE /api/reservations/:id`）
  - 期限を過ぎている場合、エラーを返す
- マイページ（`/mypage`）
  - 期限内: キャンセルボタン表示
  - 期限外: 「キャンセル期限を過ぎています。店舗にお問い合わせください」

**ユースケース**:
- 飲食店: `24`（前日まで）
- 病院: `2`（2時間前まで）
- イベント: `168`（1週間前まで）

**受入条件**:
- [ ] 期限計算ロジック実装
- [ ] E2Eテストで期限内/外のパターン
- [ ] 期限外キャンセル時のエラーメッセージ

---

### 3️⃣ 通知設定

#### Issue 3-1: メール通知の個別ON/OFF設定
**優先度**: Low
**ラベル**: `feature`, `settings`, `priority-low`

**概要**:
各種メール通知を個別にON/OFFできる

**テーブル追加項目**:
```prisma
emailNotifications Json @default("{ \"reservationConfirmed\": true, \"reservationCancelled\": true, \"reminderBeforeDay\": true, \"reminderSameDay\": false }") @map("email_notifications")
```

**設定例**:
```json
{
  "reservationConfirmed": true,    // 予約確定メール
  "reservationCancelled": true,    // キャンセル通知
  "reminderBeforeDay": true,       // 前日リマインダー
  "reminderSameDay": false,        // 当日リマインダー
  "adminNotification": true        // 管理者への新規予約通知
}
```

**影響範囲**:
- メール送信処理（`/lib/email.ts`）
  - 各通知前に設定を確認
- 設定画面
  - チェックボックスで個別ON/OFF

**ユースケース**:
- メールコスト削減したい店舗: 一部通知をOFF
- SMS通知を使う店舗: メール通知をすべてOFF

**受入条件**:
- [ ] 設定画面でJSON編集不要（UI化）
- [ ] デフォルト値の妥当性検証
- [ ] 管理者通知のテスト

---

### 4️⃣ 業種別設定

#### Issue 4-1: 業種の選択設定
**優先度**: Low
**ラベル**: `feature`, `settings`, `priority-low`

**概要**:
業種を選択することで、適切なデフォルト値・用語を設定

**テーブル追加項目**:
```prisma
industry String @default("salon") @map("industry") // salon, restaurant, clinic, other
```

**業種別のデフォルト**:
| 設定項目 | 美容室 | 飲食店 | クリニック |
|---------|-------|-------|-----------|
| `enableStaffSelection` | true | false | true |
| `requireApproval` | false | true | true |
| `slotDuration` | 30分 | 60分 | 15分 |
| `cancellationDeadlineHours` | 24 | 24 | 2 |

**影響範囲**:
- 初期設定時のデフォルト値
- 用語の変更（スタッフ→医師、メニュー→診療科目）

**ユースケース**:
- 新規テナント登録時、業種に応じた初期設定を自動適用

**受入条件**:
- [ ] 業種選択UIの実装
- [ ] 業種変更時の確認ダイアログ
- [ ] 用語カスタマイズは将来対応（今回はデフォルトのみ）

---

#### Issue 4-2: 予約単位の設定（時間/人数/席）
**優先度**: Low
**ラベル**: `feature`, `settings`, `priority-low`, `future`

**概要**:
予約を時間ベースで管理するか、人数・席ベースで管理するか

**テーブル追加項目**:
```prisma
reservationUnit String @default("time") @map("reservation_unit") // time, capacity, table
```

**違い**:
- `time`: 時間スロット管理（現在の実装）
- `capacity`: 同時受入人数管理（例: レストラン20席）
- `table`: テーブル単位管理（例: テーブルA/B/C）

**影響範囲**:
- 空き時間APIの根本的な変更が必要
- フロントエンドUIの大幅変更

**受入条件**:
- [ ] Phase 1では`time`のみサポート
- [ ] 将来拡張のためのENUM定義のみ実施

---

### 5️⃣ 表示・UI設定

#### Issue 5-1: カレンダー表示形式の設定
**優先度**: Low
**ラベル**: `feature`, `settings`, `priority-low`

**概要**:
カレンダーのデフォルト表示形式を設定

**テーブル追加項目**:
```prisma
calendarDefaultView String @default("month") @map("calendar_default_view") // month, week, day
```

**影響範囲**:
- 予約カレンダー（`/booking`）
- 管理画面カレンダー（`/admin/reservations`）

**ユースケース**:
- 美容室: `week`（週間スケジュール）
- 飲食店: `day`（当日の席状況）

**受入条件**:
- [ ] 設定画面でラジオボタン選択
- [ ] ユーザーは画面上で手動切替可能
- [ ] デフォルト値のみ設定に従う

---

#### Issue 5-2: タイムゾーン設定
**優先度**: Low
**ラベル**: `feature`, `settings`, `priority-low`, `i18n`

**概要**:
店舗のタイムゾーンを設定

**テーブル追加項目**:
```prisma
timezone String @default("Asia/Tokyo") @map("timezone")
```

**影響範囲**:
- 日時表示の全般
- メール送信時刻
- リマインダースケジュール

**ユースケース**:
- 海外展開時に必要
- 日本国内では`Asia/Tokyo`固定でOK

**受入条件**:
- [ ] Phase 1では`Asia/Tokyo`固定
- [ ] 将来の国際化対応のためのカラムのみ追加

---

## 📋 実装優先順位

### Phase 1（必須）
1. **Issue 1-1**: スタッフ指名機能ON/OFF ⭐
2. **Issue 1-3**: スタッフシフト管理ON/OFF ⭐
3. **Issue 2-2**: 予約受付期間設定 ⭐
4. **Issue 2-3**: キャンセル期限設定 ⭐

### Phase 2（重要）
5. **Issue 1-2**: スタッフ指名必須/任意
6. **Issue 2-1**: 予約承認制ON/OFF
7. **Issue 3-1**: メール通知個別設定

### Phase 3（将来対応）
8. **Issue 4-1**: 業種選択
9. **Issue 5-1**: カレンダー表示形式
10. **Issue 4-2**: 予約単位設定（時間/人数/席）
11. **Issue 5-2**: タイムゾーン設定

---

## 🗂️ データベーススキーマ拡張案

```prisma
model RestaurantSettings {
  id         String  @id @default(uuid())
  tenantId   String  @unique @default("demo-restaurant") @map("tenant_id")

  // 既存フィールド
  storeName  String  @map("store_name")
  storeEmail String? @map("store_email")
  storePhone String? @map("store_phone")
  openTime   String   @default("09:00") @map("open_time")
  closeTime  String   @default("20:00") @map("close_time")
  closedDays String[] @default([]) @map("closed_days")
  slotDuration Int @default(30) @map("slot_duration")

  // ===== Phase 1 新規フィールド =====
  // スタッフ運用設定
  enableStaffSelection Boolean @default(true) @map("enable_staff_selection")
  requireStaffSelection Boolean @default(false) @map("require_staff_selection")
  enableStaffShifts Boolean @default(false) @map("enable_staff_shifts")

  // 予約フロー設定
  minAdvanceBookingDays Int @default(0) @map("min_advance_booking_days")
  maxAdvanceBookingDays Int @default(90) @map("max_advance_booking_days")
  cancellationDeadlineHours Int @default(24) @map("cancellation_deadline_hours")

  // ===== Phase 2 新規フィールド =====
  requireApproval Boolean @default(false) @map("require_approval")
  emailNotifications Json @default("{ \"reservationConfirmed\": true, \"reservationCancelled\": true, \"reminderBeforeDay\": true, \"reminderSameDay\": false, \"adminNotification\": true }") @map("email_notifications")

  // ===== Phase 3 新規フィールド =====
  industry String @default("salon") @map("industry")
  calendarDefaultView String @default("month") @map("calendar_default_view")
  timezone String @default("Asia/Tokyo") @map("timezone")
  reservationUnit String @default("time") @map("reservation_unit")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("restaurant_settings")
}
```

---

## 🧪 テスト戦略

### E2Eテスト
各設定パターンでの予約フローをテスト:

```gherkin
Feature: 設定に応じた予約フロー
  Scenario: スタッフ指名機能OFFの場合
    Given 設定で「enableStaffSelection」がfalse
    When 予約ページにアクセスする
    Then スタッフ選択欄が表示されない
    And 予約作成時にスタッフが自動割り当てされる

  Scenario: スタッフ指名必須の場合
    Given 設定で「requireStaffSelection」がtrue
    When スタッフ未選択で予約を試みる
    Then バリデーションエラーが表示される
```

### 単体テスト
- 設定値バリデーション（min < max等）
- デフォルト値の妥当性
- JSON設定のパース

---

## 📊 影響範囲マトリクス

| 設定項目 | フロントエンド | API | データベース | メール |
|---------|-------------|-----|------------|-------|
| スタッフ指名ON/OFF | ◎ | ◎ | - | - |
| スタッフ指名必須 | ○ | ◎ | - | - |
| シフト管理ON/OFF | - | ◎ | - | - |
| 予約承認制 | ○ | ◎ | △ | ◎ |
| 予約受付期間 | ◎ | ○ | - | - |
| キャンセル期限 | ○ | ◎ | - | ○ |
| メール通知設定 | ○ | - | - | ◎ |

凡例: ◎大きい変更 ○中程度 △小さい -影響なし

---

## 🚀 実装ロードマップ

### Step 1: スキーマ拡張（1-2日）
- [ ] Prismaスキーマ更新
- [ ] マイグレーション作成
- [ ] デフォルト値設定

### Step 2: 設定画面UI実装（3-5日）
- [ ] 設定一覧ページ
- [ ] 設定編集フォーム
- [ ] バリデーション

### Step 3: 各機能への設定適用（5-7日）
- [ ] 予約フロー修正
- [ ] 空き時間API修正
- [ ] メール送信処理修正

### Step 4: テスト（3-4日）
- [ ] E2Eテスト追加
- [ ] 単体テスト追加
- [ ] QAテスト

**合計見積**: 約2-3週間

---

## 📝 備考

- 既存テナントへの影響を最小化するため、すべての新設定にはデフォルト値を設定
- 設定変更は即座に反映（キャッシュクリアが必要な場合は要検討）
- 設定のエクスポート/インポート機能は将来検討

---

**この提案書をもとに、GitHub Issueを作成してスプリント計画に組み込んでください。**
