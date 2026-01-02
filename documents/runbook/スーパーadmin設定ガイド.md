# 🔧 スーパーadmin設定ガイド - オプション機能ON/OFF実装

**作成日**: 2026-01-02
**目的**: ココナラ販売時のオプション機能切り替えに必要なスーパーadmin機能のセットアップ

---

## 📋 目次

1. [概要](#概要)
2. [Phase 1: データベース設計（完了）](#phase-1-データベース設計完了)
3. [Supabaseアカウント作成手順](#supabaseアカウント作成手順)
4. [動作確認](#動作確認)
5. [次のステップ（Phase 2以降）](#次のステップphase-2以降)
6. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### 🎯 実装の背景

ココナラでシステムを販売する際、以下の3層構造が必要：

| 層 | ログイン | 権限範囲 | 画面パス |
|---|---|---|---|
| **1. ユーザー側（顧客）** | `/login` | 予約作成・確認・キャンセル | `/booking`, `/mypage` |
| **2. 店舗側（管理者）** | `/admin/login` | 店舗運用設定・予約管理 | `/admin/*` |
| **3. 開発側（スーパー管理者）** | `/super-admin/login` | オプション機能ON/OFF・テナント管理 | `/super-admin/*` |

**問題点**:
- 現状の `/admin/*` は店舗オーナーがアクセス可能
- もしオプション機能設定を `/admin/settings/features` に置くと...
- → **店舗側が購入していないオプションを勝手に有効化できてしまう** ❌

**解決策**:
- スーパーadmin専用の認証・画面を実装
- オプション機能のON/OFFはスーパーadminのみ操作可能
- 店舗側は営業時間・定休日などの「店舗運用設定」のみ変更可能

---

## Phase 1: データベース設計（✅ 完了）

### 実装内容

#### 1. Prismaスキーマ拡張

**追加したEnum**:
```prisma
enum UserRole {
  CUSTOMER     // 一般ユーザー（顧客）
  ADMIN        // 店舗管理者
  SUPER_ADMIN  // スーパー管理者（開発者）
}
```

**BookingUserモデルの変更**:
```prisma
model BookingUser {
  id        String   @id @default(uuid())
  tenantId  String   @default("demo-booking") @map("tenant_id")
  authId    String?  @unique @map("auth_id")
  email     String
  name      String?
  phone     String?
  memo      String?  @default("")
  role      UserRole @default(CUSTOMER) // 🆕 追加
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  reservations BookingReservation[]

  @@unique([tenantId, email])
  @@index([tenantId])
  @@index([role]) // 🆕 追加
  @@map("booking_users")
}
```

**FeatureFlagモデルの追加**:
```prisma
model FeatureFlag {
  id       String @id @default(uuid())
  tenantId String @unique @default("demo-booking") @map("tenant_id")

  // オプション機能のフラグ（10種類）
  enableStaffSelection       Boolean @default(false) @map("enable_staff_selection") // +8,000円
  enableStaffShiftManagement Boolean @default(false) @map("enable_staff_shift_management") // +10,000円
  enableCustomerManagement   Boolean @default(true) @map("enable_customer_management") // +12,000円（実装済み）
  enableReservationUpdate    Boolean @default(false) @map("enable_reservation_update") // +5,000円
  enableReminderEmail        Boolean @default(true) @map("enable_reminder_email") // +8,000円（実装済み）
  enableManualReservation    Boolean @default(true) @map("enable_manual_reservation") // +6,000円（実装済み）
  enableAnalyticsReport      Boolean @default(true) @map("enable_analytics_report") // +15,000円（実装済み）
  enableRepeatRateAnalysis   Boolean @default(false) @map("enable_repeat_rate_analysis") // +12,000円
  enableCouponFeature        Boolean @default(false) @map("enable_coupon_feature") // +18,000円
  enableLineNotification     Boolean @default(false) @map("enable_line_notification") // +20,000円

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("feature_flags")
}
```

#### 2. マイグレーション実行

```bash
# reserve-appディレクトリで実行
cd reserve-app

# データベーススキーマを最新化
npx prisma db push

# Prisma Clientを再生成
npm run prisma:generate

# Seedデータ投入
npm run prisma:seed
```

#### 3. Seedデータ投入結果

**作成されたデータ**:
- ✅ スーパーadminユーザー: 1件
  - Email: `contact@tailwind8.com`
  - Role: `SUPER_ADMIN`
  - Name: スーパー管理者

- ✅ FeatureFlag: 1件（demo-bookingテナント用）
  - 実装済み機能6個: ON
  - 未実装機能4個: OFF

---

## Supabaseアカウント作成手順

### 🔐 重要：スーパーadminアカウントの作成

Phase 1でデータベースにスーパーadminユーザーは作成されましたが、**Supabase Authでアカウントを作成する必要があります**。

### 手順

#### 1. Supabase Dashboardにアクセス

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクト「Reserve System」を選択

#### 2. ユーザーを手動作成

1. 左サイドバー → **Authentication** → **Users** をクリック
2. 右上の **「Add user」** ボタンをクリック
3. ユーザー情報を入力：

   | フィールド | 値 |
   |----------|-----|
   | Email | `contact@tailwind8.com` |
   | Password | （強力なパスワードを設定） |
   | Auto Confirm User | ✅ チェック（メール確認をスキップ） |

4. **「Create user」** をクリック

#### 3. User IDをコピー

1. 作成されたユーザーの一覧から `contact@tailwind8.com` を見つける
2. **User ID**（UUID形式）をコピー
3. 例: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

#### 4. BookingUserのauthIdを更新

Supabaseで作成したUser IDを、データベースの`BookingUser`テーブルの`auth_id`に紐付けます。

**方法1: Supabase SQL Editorで実行**

```sql
-- Supabase Dashboard → SQL Editor で実行
UPDATE booking_users
SET auth_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' -- ← コピーしたUser IDを貼り付け
WHERE email = 'contact@tailwind8.com';
```

**方法2: Prisma Studioで手動編集**

```bash
# reserve-appディレクトリで実行
npm run prisma:studio
```

1. `BookingUser` テーブルを開く
2. `contact@tailwind8.com` のレコードを探す
3. `authId` フィールドにSupabaseのUser IDを貼り付け
4. 保存

---

## 動作確認

### 1. ローカル開発サーバーを起動

```bash
cd reserve-app
npm run dev
```

### 2. スーパーadminログイン画面にアクセス（Phase 2実装後）

**注意**: Phase 2が未実装の場合、ログイン画面はまだ存在しません。Phase 2実装後に以下を実施してください。

```
http://localhost:3000/super-admin/login
```

### 3. ログイン

- Email: `contact@tailwind8.com`
- Password: Supabaseで設定したパスワード

### 4. 機能フラグ管理画面にアクセス（Phase 3実装後）

```
http://localhost:3000/super-admin/feature-flags
```

**確認項目**:
- [ ] オプション機能10種類が表示される
- [ ] 実装済み6個がON、未実装4個がOFFになっている
- [ ] トグルスイッチでON/OFFを切り替えられる
- [ ] 保存ボタンで変更が反映される

---

## 次のステップ（Phase 2以降）

Phase 1が完了しました。以下を順番に実装します：

### Phase 2: スーパーadmin認証（2〜3日）

- [ ] スーパーadminログイン画面（`/super-admin/login`）
- [ ] スーパーadmin認証API（`POST /api/auth/super-admin/login`）
- [ ] middleware.tsの拡張（`/super-admin/*` ルート保護）
- [ ] ロール確認ミドルウェア

### Phase 3: スーパーadmin専用画面（3〜4日）

- [ ] ダッシュボード（`/super-admin/dashboard`）
- [ ] オプション機能管理画面（`/super-admin/feature-flags`）
  - テナント選択UI
  - 10種類のオプション機能トグル
  - 保存機能

### Phase 4: 機能フラグAPI（2〜3日）

- [ ] `GET /api/super-admin/feature-flags` - フラグ取得（スーパーadmin専用）
- [ ] `PATCH /api/super-admin/feature-flags` - フラグ更新（スーパーadmin専用）
- [ ] `GET /api/feature-flags` - フラグ取得（全ユーザー向け・読み取り専用）
- [ ] 権限チェックミドルウェア実装

### Phase 5: フロントエンド制御（2〜3日）

- [ ] `useFeatureFlags` カスタムフック作成
- [ ] 各機能での条件分岐実装
  - スタッフ指名機能（予約フォーム）
  - クーポン機能（予約フォーム）
  - 分析レポート（管理者ダッシュボード）
  - その他7機能

### Phase 6: テスト・ドキュメント（2〜3日）

- [ ] E2Eテスト作成（スーパーadminログイン、機能フラグ切り替え）
- [ ] 単体テスト作成
- [ ] ドキュメント更新

**合計見積工数**: 12〜18日

---

## トラブルシューティング

### Q1: Seedデータ投入時にエラーが出る

**エラー例**:
```
Error: Unknown argument `role`. Did you mean `name`?
```

**原因**: Prisma Clientが古い

**解決策**:
```bash
npm run prisma:generate
npm run prisma:seed
```

---

### Q2: スーパーadminでログインできない

**確認項目**:

1. **Supabaseでアカウントが作成されているか？**
   ```
   Supabase Dashboard → Authentication → Users
   → contact@tailwind8.com が存在するか確認
   ```

2. **BookingUser.authIdが設定されているか？**
   ```bash
   npm run prisma:studio
   # booking_usersテーブルを開く
   # contact@tailwind8.comのauth_idがSupabaseのUser IDと一致するか確認
   ```

3. **BookingUser.roleがSUPER_ADMINか？**
   ```sql
   SELECT email, role FROM booking_users WHERE email = 'contact@tailwind8.com';
   -- roleが "SUPER_ADMIN" であることを確認
   ```

---

### Q3: FeatureFlagテーブルが見つからない

**エラー例**:
```
Error: Table 'feature_flags' does not exist
```

**原因**: マイグレーションが実行されていない

**解決策**:
```bash
cd reserve-app
npx prisma db push
npm run prisma:generate
npm run prisma:seed
```

---

### Q4: 既存のユーザーのroleがnullになっている

**原因**: 既存データにroleカラムが追加されたが、デフォルト値が設定されていない

**解決策**:
```sql
-- Supabase SQL Editorで実行
-- 既存の全ユーザーをCUSTOMERに設定
UPDATE booking_users
SET role = 'CUSTOMER'
WHERE role IS NULL;
```

---

### Q5: FeatureFlagが2重に作成されてしまった

**確認**:
```sql
SELECT * FROM feature_flags WHERE tenant_id = 'demo-booking';
```

**解決策**:
```sql
-- 古い方を削除（created_atで判断）
DELETE FROM feature_flags
WHERE id NOT IN (
  SELECT id FROM feature_flags
  WHERE tenant_id = 'demo-booking'
  ORDER BY created_at DESC
  LIMIT 1
);
```

---

## 📊 データベーススキーマ変更履歴

### 変更日: 2026-01-02

**追加されたテーブル**:
- `feature_flags`

**変更されたテーブル**:
- `booking_users`: `role` カラム追加（UserRole型）

**追加されたEnum**:
- `UserRole` (CUSTOMER, ADMIN, SUPER_ADMIN)

**追加されたインデックス**:
- `booking_users.role` インデックス

---

## 📝 関連ドキュメント

- `documents/marketing/Admin機能フラグ設計.md` - オプション機能の詳細設計
- `documents/marketing/ココナラ販売戦略.md` - 販売戦略とオプション一覧
- `documents/issues-proposal-system-settings.md` - 店舗設定機能の提案
- `prisma/schema.prisma` - Prismaスキーマ
- `prisma/seed.ts` - Seedデータ

---

## ✅ チェックリスト

### Phase 1完了確認

- [x] Prismaスキーマに`UserRole` enum追加
- [x] `BookingUser`に`role`カラム追加
- [x] `FeatureFlag`モデル追加
- [x] マイグレーション実行（`npx prisma db push`）
- [x] Prisma Client再生成（`npm run prisma:generate`）
- [x] Seedデータ投入（`npm run prisma:seed`）
- [x] スーパーadminユーザー作成（contact@tailwind8.com）
- [x] FeatureFlag初期データ作成

### Supabaseアカウント作成確認

- [ ] Supabaseでcontact@tailwind8.comアカウント作成
- [ ] User IDをコピー
- [ ] BookingUser.authIdにUser IDを設定
- [ ] BookingUser.roleが`SUPER_ADMIN`であることを確認

### Phase 2実装待ち

- [ ] スーパーadminログイン画面実装
- [ ] スーパーadmin認証API実装
- [ ] middleware.ts拡張
- [ ] ログイン動作確認

---

**最終更新**: 2026-01-02
**次回更新**: Phase 2実装完了後
