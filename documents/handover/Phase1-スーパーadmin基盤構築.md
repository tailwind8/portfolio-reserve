# Phase 1: スーパーadmin基盤構築 - 引き継ぎ資料

**作成日**: 2026-01-02
**担当者**: 開発チーム
**ステータス**: ✅ 完了
**次フェーズ**: Phase 2（スーパーadmin認証実装）

---

## 📋 目次

1. [実装概要](#実装概要)
2. [背景と目的](#背景と目的)
3. [実装完了内容](#実装完了内容)
4. [データベース変更詳細](#データベース変更詳細)
5. [Supabase設定](#supabase設定)
6. [動作確認手順](#動作確認手順)
7. [次フェーズの概要](#次フェーズの概要)
8. [重要な注意事項](#重要な注意事項)
9. [トラブルシューティング](#トラブルシューティング)
10. [関連ドキュメント](#関連ドキュメント)

---

## 実装概要

### 完了した作業

**Phase 1: データベース設計とスーパーadminユーザー基盤**

- ✅ Prismaスキーマに`UserRole` enum追加
- ✅ `BookingUser`モデルに`role`カラム追加
- ✅ `FeatureFlag`モデル新規作成（10種類のオプション機能管理）
- ✅ データベースマイグレーション実行
- ✅ Seedデータ作成（スーパーadminユーザー + FeatureFlag初期データ）
- ✅ Supabaseアカウント作成・連携
- ✅ 引き継ぎドキュメント作成

### 実装期間
- 開始日: 2026-01-02
- 完了日: 2026-01-02
- 実績工数: 1日

---

## 背景と目的

### なぜスーパーadmin機能が必要か

#### ココナラ販売時の課題

現在のシステムは2層構造：
1. **ユーザー側（顧客）**: 予約作成・確認・キャンセル
2. **店舗側（管理者）**: 予約管理・店舗設定

**問題点**:
- オプション機能のON/OFF設定を`/admin/settings`に置くと...
- → **店舗側が購入していないオプションを勝手に有効化できてしまう** ❌

#### 解決策：3層構造の実装

| 層 | ログインパス | 権限範囲 | 画面パス |
|---|---|---|---|
| **1. ユーザー側** | `/login` | 予約作成・確認・キャンセル | `/booking`, `/mypage` |
| **2. 店舗側** | `/admin/login` | 店舗運用設定・予約管理 | `/admin/*` |
| **3. 開発側（NEW）** | `/super-admin/login` | オプション機能ON/OFF・テナント管理 | `/super-admin/*` |

### ビジネス的な意義

#### ココナラ販売戦略との連携

**基準パッケージ**: 50,000円（買い切り）
- ユーザー登録・ログイン
- 予約カレンダー・予約登録
- マイページ・予約一覧
- 管理者ダッシュボード（基本統計）
- 予約管理・基本メニュー管理
- 店舗基本設定

**オプション機能**: +5,000円〜+20,000円
1. スタッフ指名機能（+8,000円）
2. スタッフシフト管理（+10,000円）
3. 顧客管理・メモ機能（+12,000円）※実装済み
4. 予約変更機能（+5,000円）
5. リマインダーメール（+8,000円）※実装済み
6. 予約手動追加（+6,000円）※実装済み
7. 分析レポート（+15,000円）※実装済み
8. リピート率分析（+12,000円）
9. クーポン機能（+18,000円）
10. LINE通知連携（+20,000円）

**運用フロー**:
1. 顧客がココナラで基準パッケージ + オプションを購入
2. 開発者がスーパーadmin画面でオプション機能をON
3. 店舗側は購入済みオプションのみ利用可能

---

## 実装完了内容

### 1. Prismaスキーマ変更

#### 新規Enum: `UserRole`

```prisma
enum UserRole {
  CUSTOMER     // 一般ユーザー（顧客）
  ADMIN        // 店舗管理者
  SUPER_ADMIN  // スーパー管理者（開発者）
}
```

#### 変更モデル: `BookingUser`

**追加カラム**:
```prisma
model BookingUser {
  // ...既存フィールド
  role      UserRole @default(CUSTOMER) // 🆕 追加
  // ...

  @@index([role]) // 🆕 ロール検索用インデックス
}
```

#### 新規モデル: `FeatureFlag`

```prisma
model FeatureFlag {
  id       String @id @default(uuid())
  tenantId String @unique @default("demo-booking") @map("tenant_id")

  // オプション機能のフラグ（10種類）
  enableStaffSelection       Boolean @default(false) // スタッフ指名機能
  enableStaffShiftManagement Boolean @default(false) // スタッフシフト管理
  enableCustomerManagement   Boolean @default(true)  // 顧客管理（実装済み）
  enableReservationUpdate    Boolean @default(false) // 予約変更機能
  enableReminderEmail        Boolean @default(true)  // リマインダー（実装済み）
  enableManualReservation    Boolean @default(true)  // 予約手動追加（実装済み）
  enableAnalyticsReport      Boolean @default(true)  // 分析レポート（実装済み）
  enableRepeatRateAnalysis   Boolean @default(false) // リピート率分析
  enableCouponFeature        Boolean @default(false) // クーポン機能
  enableLineNotification     Boolean @default(false) // LINE通知連携

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("feature_flags")
}
```

### 2. マイグレーション実行

**実行コマンド**:
```bash
cd reserve-app
npx prisma db push
npm run prisma:generate
```

**変更内容**:
- `booking_users`テーブルに`role`カラム追加（UserRole型）
- `feature_flags`テーブル新規作成

### 3. Seedデータ作成

**実行コマンド**:
```bash
npm run prisma:seed
```

**投入データ**:

#### スーパーadminユーザー
```typescript
{
  id: 'super-admin-001',
  tenantId: 'demo-booking',
  email: 'contact@tailwind8.com',
  name: 'スーパー管理者',
  phone: '080-0000-0000',
  role: 'SUPER_ADMIN',
  authId: '255e0ef0-aeca-4ce5-84da-ae360d76080e', // Supabase User ID
  memo: '開発者用スーパーadminアカウント',
}
```

#### FeatureFlag初期データ
```typescript
{
  tenantId: 'demo-booking',
  // 実装済み機能（ON）
  enableCustomerManagement: true,   // 顧客管理
  enableReminderEmail: true,        // リマインダーメール
  enableManualReservation: true,    // 予約手動追加
  enableAnalyticsReport: true,      // 分析レポート
  enableStaffSelection: true,       // スタッフ指名
  enableStaffShiftManagement: true, // スタッフシフト管理

  // 未実装機能（OFF）
  enableReservationUpdate: false,   // 予約変更機能
  enableRepeatRateAnalysis: false,  // リピート率分析
  enableCouponFeature: false,       // クーポン機能
  enableLineNotification: false,    // LINE通知連携
}
```

---

## データベース変更詳細

### 変更サマリー

| 変更種別 | 対象 | 内容 |
|---------|------|------|
| **新規テーブル** | `feature_flags` | オプション機能管理テーブル |
| **カラム追加** | `booking_users.role` | ユーザーロール（UserRole型） |
| **インデックス追加** | `booking_users.role` | ロール検索用インデックス |
| **Enum追加** | `UserRole` | CUSTOMER, ADMIN, SUPER_ADMIN |

### テーブル定義: `feature_flags`

| カラム名 | データ型 | NULL | デフォルト値 | 説明 |
|---------|---------|------|------------|------|
| id | UUID | NOT NULL | uuid() | 主キー |
| tenant_id | VARCHAR | NOT NULL | 'demo-booking' | テナントID（ユニーク） |
| enable_staff_selection | BOOLEAN | NOT NULL | false | スタッフ指名機能 |
| enable_staff_shift_management | BOOLEAN | NOT NULL | false | スタッフシフト管理 |
| enable_customer_management | BOOLEAN | NOT NULL | true | 顧客管理（実装済み） |
| enable_reservation_update | BOOLEAN | NOT NULL | false | 予約変更機能 |
| enable_reminder_email | BOOLEAN | NOT NULL | true | リマインダーメール（実装済み） |
| enable_manual_reservation | BOOLEAN | NOT NULL | true | 予約手動追加（実装済み） |
| enable_analytics_report | BOOLEAN | NOT NULL | true | 分析レポート（実装済み） |
| enable_repeat_rate_analysis | BOOLEAN | NOT NULL | false | リピート率分析 |
| enable_coupon_feature | BOOLEAN | NOT NULL | false | クーポン機能 |
| enable_line_notification | BOOLEAN | NOT NULL | false | LINE通知連携 |
| created_at | TIMESTAMP | NOT NULL | now() | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | now() | 更新日時 |

**制約**:
- PRIMARY KEY: `id`
- UNIQUE: `tenant_id`

### カラム定義: `booking_users.role`

| カラム名 | データ型 | NULL | デフォルト値 | 説明 |
|---------|---------|------|------------|------|
| role | UserRole (ENUM) | NOT NULL | CUSTOMER | ユーザーロール |

**Enum値**:
- `CUSTOMER`: 一般ユーザー（顧客）
- `ADMIN`: 店舗管理者
- `SUPER_ADMIN`: スーパー管理者（開発者）

---

## Supabase設定

### 作成したアカウント

| 項目 | 値 |
|------|-----|
| **Email** | contact@tailwind8.com |
| **User ID** | 255e0ef0-aeca-4ce5-84da-ae360d76080e |
| **Role** | SUPER_ADMIN |
| **Status** | Active（メール確認済み） |

### 連携設定

**BookingUserとの紐付け**:
```sql
UPDATE booking_users
SET auth_id = '255e0ef0-aeca-4ce5-84da-ae360d76080e'
WHERE email = 'contact@tailwind8.com';
```

**確認クエリ**:
```sql
SELECT
  email,
  role,
  auth_id
FROM booking_users
WHERE role = 'SUPER_ADMIN';
```

**期待される結果**:
```
email                    | role         | auth_id
------------------------|--------------|--------------------------------------
contact@tailwind8.com   | SUPER_ADMIN  | 255e0ef0-aeca-4ce5-84da-ae360d76080e
```

---

## 動作確認手順

### 1. データベース確認

**Prisma Studioで確認**:
```bash
cd reserve-app
npm run prisma:studio
```

**確認項目**:
- [ ] `booking_users`テーブルに`contact@tailwind8.com`が存在
- [ ] `role`が`SUPER_ADMIN`
- [ ] `auth_id`が`255e0ef0-aeca-4ce5-84da-ae360d76080e`
- [ ] `feature_flags`テーブルに`demo-booking`テナントのレコードが存在
- [ ] 実装済み機能6個が`true`、未実装4個が`false`

### 2. Supabase確認

**Supabase Dashboard**:
1. Authentication → Users
2. `contact@tailwind8.com`が存在することを確認
3. User IDが`255e0ef0-aeca-4ce5-84da-ae360d76080e`であることを確認

### 3. SQL直接確認（オプション）

**Supabase SQL Editor**:
```sql
-- スーパーadminユーザー確認
SELECT id, email, role, auth_id, name
FROM booking_users
WHERE role = 'SUPER_ADMIN';

-- FeatureFlag確認
SELECT
  tenant_id,
  enable_staff_selection,
  enable_customer_management,
  enable_reminder_email,
  enable_manual_reservation,
  enable_analytics_report
FROM feature_flags
WHERE tenant_id = 'demo-booking';
```

---

## 次フェーズの概要

### Phase 2: スーパーadmin認証（見積: 2〜3日）

**実装内容**:
- [ ] スーパーadminログイン画面（`/super-admin/login`）
- [ ] スーパーadmin認証API（`POST /api/auth/super-admin/login`）
- [ ] middleware.ts拡張（`/super-admin/*`ルート保護）
- [ ] ロール確認ミドルウェア実装

**主要ファイル**:
- `src/app/super-admin/login/page.tsx`
- `src/app/api/auth/super-admin/login/route.ts`
- `src/middleware.ts`

### Phase 3: スーパーadmin専用画面（見積: 3〜4日）

**実装内容**:
- [ ] ダッシュボード（`/super-admin/dashboard`）
- [ ] オプション機能管理画面（`/super-admin/feature-flags`）
  - テナント選択ドロップダウン
  - 10種類のオプション機能トグルスイッチ
  - 保存ボタン

**主要ファイル**:
- `src/app/super-admin/dashboard/page.tsx`
- `src/app/super-admin/feature-flags/page.tsx`

### Phase 4: 機能フラグAPI（見積: 2〜3日）

**実装内容**:
- [ ] `GET /api/super-admin/feature-flags` - フラグ取得（スーパーadmin専用）
- [ ] `PATCH /api/super-admin/feature-flags` - フラグ更新（スーパーadmin専用）
- [ ] `GET /api/feature-flags` - フラグ取得（全ユーザー向け・読み取り専用）
- [ ] 権限チェックミドルウェア

**主要ファイル**:
- `src/app/api/super-admin/feature-flags/route.ts`
- `src/app/api/feature-flags/route.ts`
- `src/lib/check-super-admin.ts`

### Phase 5: フロントエンド制御（見積: 2〜3日）

**実装内容**:
- [ ] `useFeatureFlags`カスタムフック作成
- [ ] 各機能での条件分岐実装
  - スタッフ指名機能（予約フォーム）
  - クーポン機能（予約フォーム）
  - 分析レポート（管理者ダッシュボード）
  - その他7機能

**主要ファイル**:
- `src/hooks/useFeatureFlags.ts`
- `src/app/booking/page.tsx`（スタッフ選択の表示制御）
- `src/app/admin/dashboard/page.tsx`（分析レポートの表示制御）

### Phase 6: テスト・ドキュメント（見積: 2〜3日）

**実装内容**:
- [ ] E2Eテスト作成
  - スーパーadminログインテスト
  - 機能フラグ切り替えテスト
  - 権限チェックテスト
- [ ] 単体テスト作成
- [ ] ドキュメント更新

**主要ファイル**:
- `src/__tests__/e2e/super-admin-login.spec.ts`
- `src/__tests__/e2e/feature-flags.spec.ts`
- `documents/handover/Phase2-スーパーadmin認証.md`

---

## 重要な注意事項

### 🚨 セキュリティ上の注意

1. **スーパーadminパスワードの管理**
   - 強力なパスワードを設定すること
   - パスワードをコードやドキュメントに記載しないこと
   - パスワード管理ツール（1Password、Bitwarden等）を使用すること

2. **auth_idの取り扱い**
   - `auth_id`はSupabase User IDと必ず一致させること
   - 不一致の場合、ログインできなくなる

3. **ロールの変更**
   - 既存ユーザーのロールを`SUPER_ADMIN`に変更しないこと
   - スーパーadminは`contact@tailwind8.com`のみ

### ⚠️ データベース操作の注意

1. **feature_flagsテーブルの重複**
   - 1テナントにつき1レコードのみ
   - `tenant_id`がユニーク制約
   - 重複作成しないよう注意

2. **既存ユーザーのrole**
   - 既存の全ユーザーは自動的に`CUSTOMER`がデフォルト
   - 店舗管理者は手動で`ADMIN`に変更が必要（Phase 2以降で実装）

3. **マイグレーションのロールバック**
   - Phase 1の変更をロールバックする場合：
     ```sql
     -- feature_flagsテーブル削除
     DROP TABLE feature_flags;

     -- booking_usersのroleカラム削除
     ALTER TABLE booking_users DROP COLUMN role;

     -- UserRole Enum削除
     DROP TYPE "UserRole";
     ```

### 📝 ドキュメント管理の注意

1. **引き継ぎ資料の更新**
   - 各フェーズ完了時に引き継ぎ資料を作成すること
   - `documents/handover/Phase{N}-{タイトル}.md`形式

2. **変更履歴の記録**
   - データベーススキーマ変更は必ず記録
   - Supabase設定変更も記録

---

## トラブルシューティング

### Q1: Seedデータ投入時にエラー

**エラー例**:
```
Error: Unknown argument `role`. Did you mean `name`?
```

**原因**: Prisma Clientが最新でない

**解決策**:
```bash
npm run prisma:generate
npm run prisma:seed
```

---

### Q2: スーパーadminユーザーが見つからない

**確認方法**:
```sql
SELECT * FROM booking_users WHERE email = 'contact@tailwind8.com';
```

**レコードが存在しない場合**:
```bash
npm run prisma:seed
```

---

### Q3: auth_idがnullになっている

**確認方法**:
```sql
SELECT email, auth_id FROM booking_users WHERE email = 'contact@tailwind8.com';
```

**解決策**:
```sql
UPDATE booking_users
SET auth_id = '255e0ef0-aeca-4ce5-84da-ae360d76080e'
WHERE email = 'contact@tailwind8.com';
```

---

### Q4: FeatureFlagが2件以上存在する

**確認方法**:
```sql
SELECT COUNT(*) FROM feature_flags WHERE tenant_id = 'demo-booking';
```

**解決策（古い方を削除）**:
```sql
DELETE FROM feature_flags
WHERE id NOT IN (
  SELECT id FROM feature_flags
  WHERE tenant_id = 'demo-booking'
  ORDER BY created_at DESC
  LIMIT 1
);
```

---

### Q5: 既存ユーザーのroleがnull

**確認方法**:
```sql
SELECT COUNT(*) FROM booking_users WHERE role IS NULL;
```

**解決策**:
```sql
-- 既存の全ユーザーをCUSTOMERに設定
UPDATE booking_users
SET role = 'CUSTOMER'
WHERE role IS NULL;
```

---

## 関連ドキュメント

### プロジェクトドキュメント

| ドキュメント | パス | 説明 |
|------------|------|------|
| **スーパーadmin設定ガイド** | `documents/runbook/スーパーadmin設定ガイド.md` | セットアップ手順書 |
| **Admin機能フラグ設計** | `documents/marketing/Admin機能フラグ設計.md` | 機能フラグの詳細設計 |
| **ココナラ販売戦略** | `documents/marketing/ココナラ販売戦略.md` | 販売戦略とオプション一覧 |
| **システム設定提案** | `documents/issues-proposal-system-settings.md` | 店舗設定機能の提案 |
| **データベース設計書** | `documents/spec/データベース設計書.md` | DB設計全体 |

### コードファイル

| ファイル | パス | 説明 |
|---------|------|------|
| **Prismaスキーマ** | `reserve-app/prisma/schema.prisma` | データベーススキーマ定義 |
| **Seedファイル** | `reserve-app/prisma/seed.ts` | 初期データ投入スクリプト |

### 外部リソース

| リソース | URL | 説明 |
|---------|-----|------|
| **Supabase Dashboard** | https://supabase.com/dashboard | 認証・DB管理 |
| **Prisma Docs** | https://www.prisma.io/docs | Prisma公式ドキュメント |

---

## チェックリスト

### Phase 1完了確認

#### データベース
- [x] Prismaスキーマに`UserRole` enum追加
- [x] `BookingUser`に`role`カラム追加
- [x] `FeatureFlag`モデル追加
- [x] マイグレーション実行（`npx prisma db push`）
- [x] Prisma Client再生成（`npm run prisma:generate`）

#### Seedデータ
- [x] スーパーadminユーザー作成
- [x] FeatureFlag初期データ作成
- [x] Seedデータ投入実行（`npm run prisma:seed`）

#### Supabase設定
- [x] contact@tailwind8.comアカウント作成
- [x] User ID取得（255e0ef0-aeca-4ce5-84da-ae360d76080e）
- [x] BookingUser.authIdに設定

#### ドキュメント
- [x] スーパーadmin設定ガイド作成
- [x] 引き継ぎ資料作成（本ドキュメント）

#### 動作確認
- [x] Prisma Studioで全データ確認
- [x] Supabaseでアカウント確認
- [x] SQLクエリで連携確認

### Phase 2準備確認

- [ ] Phase 1の引き継ぎ資料を後任者に共有
- [ ] Supabaseパスワードを安全に保管
- [ ] 次フェーズの見積を確認
- [ ] 開発環境のセットアップ完了

---

## 承認

| 役割 | 氏名 | 承認日 | 署名 |
|------|------|--------|------|
| 開発担当 | - | 2026-01-02 | ✅ |
| レビュアー | - | - | - |

---

**最終更新**: 2026-01-02
**次回更新**: Phase 2完了時
