# Admin機能フラグ設計 - オプション機能のON/OFF切り替え

**最終更新**: 2026-01-02
**目的**: ココナラ販売時のオプション機能をAdmin権限で切り替え可能にする

---

## 📋 目次

1. [概要](#概要)
2. [機能フラグ一覧](#機能フラグ一覧)
3. [データベース設計](#データベース設計)
4. [API設計](#api設計)
5. [Admin設定画面設計](#admin設定画面設計)
6. [実装の考慮事項](#実装の考慮事項)

---

## 概要

### 目的
ココナラで販売時に、顧客が購入したオプション機能のみを有効化できるようにする。
Admin権限を持つ管理者が、管理画面から各機能のON/OFFを切り替えられるようにする。

### ユースケース
1. **ココナラ販売時**: 顧客が購入したオプションのみを有効化
2. **トライアル提供時**: 一定期間だけ全機能を有効化
3. **段階的導入時**: 初めは基準機能のみ、後からオプション追加
4. **メンテナンス時**: 特定機能を一時的に無効化

---

## 機能フラグ一覧

### 切り替え可能な機能

| フラグ名 | 機能名 | デフォルト値 | 料金 | 対象画面 |
|---------|--------|------------|------|---------|
| `enableStaffSelection` | スタッフ指名機能 | `false` | +8,000円 | 予約フォーム、スタッフ一覧 |
| `enableStaffShiftManagement` | スタッフシフト管理 | `false` | +10,000円 | 管理者スタッフページ |
| `enableCustomerManagement` | 顧客管理・メモ機能 | `false` | +12,000円 | 管理者顧客ページ |
| `enableReservationUpdate` | 予約変更機能（ユーザー側） | `false` | +5,000円 | マイページ |
| `enableReminderEmail` | リマインダーメール自動送信 | `false` | +8,000円 | バックグラウンド処理 |
| `enableManualReservation` | 予約手動追加（管理者） | `false` | +6,000円 | 管理者予約ページ |
| `enableAnalyticsReport` | 分析レポート・予約推移 | `false` | +15,000円 | 管理者ダッシュボード |
| `enableRepeatRateAnalysis` | リピート率分析・顧客ランク | `false` | +12,000円 | 管理者顧客ページ |
| `enableCouponFeature` | クーポン・キャンペーン機能 | `false` | +18,000円 | 予約フォーム、管理者 |
| `enableLineNotification` | LINE通知連携 | `false` | +20,000円 | バックグラウンド処理 |

### 基準パッケージの機能（常にON）
以下の機能は基準パッケージに含まれるため、フラグ管理せず常にON

- ユーザー登録・ログイン
- 予約カレンダー・予約登録
- マイページ・予約一覧
- 予約キャンセル
- 管理者ダッシュボード（基本統計）
- 予約管理（一覧・ステータス変更）
- 基本メニュー管理
- 店舗基本設定

---

## データベース設計

### テーブル: `feature_flags`

オプション機能のON/OFF状態を管理するテーブル

```prisma
model FeatureFlag {
  id                         String   @id @default(uuid())
  tenantId                   String   @map("tenant_id")

  // オプション機能のフラグ
  enableStaffSelection       Boolean  @default(false) @map("enable_staff_selection")
  enableStaffShiftManagement Boolean  @default(false) @map("enable_staff_shift_management")
  enableCustomerManagement   Boolean  @default(false) @map("enable_customer_management")
  enableReservationUpdate    Boolean  @default(false) @map("enable_reservation_update")
  enableReminderEmail        Boolean  @default(false) @map("enable_reminder_email")
  enableManualReservation    Boolean  @default(false) @map("enable_manual_reservation")
  enableAnalyticsReport      Boolean  @default(false) @map("enable_analytics_report")
  enableRepeatRateAnalysis   Boolean  @default(false) @map("enable_repeat_rate_analysis")
  enableCouponFeature        Boolean  @default(false) @map("enable_coupon_feature")
  enableLineNotification     Boolean  @default(false) @map("enable_line_notification")

  // メタデータ
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([tenantId])
  @@map("feature_flags")
}
```

### 初期データ（Seed）

```typescript
// prisma/seed.ts
await prisma.featureFlag.upsert({
  where: { tenantId: 'demo-booking' },
  update: {},
  create: {
    tenantId: 'demo-booking',
    // デモ環境では全機能有効化
    enableStaffSelection: true,
    enableStaffShiftManagement: true,
    enableCustomerManagement: true,
    enableReservationUpdate: true,
    enableReminderEmail: true,
    enableManualReservation: true,
    enableAnalyticsReport: true,
    enableRepeatRateAnalysis: true,
    enableCouponFeature: true,
    enableLineNotification: false, // LINEのみ無効（API設定が必要なため）
  },
});
```

---

## API設計

### GET `/api/admin/feature-flags`
機能フラグの取得（Admin権限必須）

**リクエスト**:
```http
GET /api/admin/feature-flags
Authorization: Bearer {token}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "enableStaffSelection": true,
    "enableStaffShiftManagement": false,
    "enableCustomerManagement": true,
    "enableReservationUpdate": false,
    "enableReminderEmail": true,
    "enableManualReservation": true,
    "enableAnalyticsReport": false,
    "enableRepeatRateAnalysis": false,
    "enableCouponFeature": false,
    "enableLineNotification": false
  }
}
```

---

### PATCH `/api/admin/feature-flags`
機能フラグの更新（Admin権限必須）

**リクエスト**:
```http
PATCH /api/admin/feature-flags
Authorization: Bearer {token}
Content-Type: application/json

{
  "enableStaffSelection": true,
  "enableCustomerManagement": true
}
```

**レスポンス**:
```json
{
  "success": true,
  "message": "機能フラグを更新しました",
  "data": {
    "enableStaffSelection": true,
    "enableStaffShiftManagement": false,
    "enableCustomerManagement": true,
    ...
  }
}
```

**バリデーション**:
- Admin権限のチェック
- boolean型のバリデーション
- 不正なフラグ名の拒否

---

### GET `/api/feature-flags`
機能フラグの取得（全ユーザー向け、フロントエンドで使用）

**リクエスト**:
```http
GET /api/feature-flags
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "enableStaffSelection": true,
    "enableReservationUpdate": false,
    "enableCouponFeature": false,
    ...
  }
}
```

**用途**:
- フロントエンドで機能の表示/非表示を切り替える
- 機能が無効な場合はUIを表示しない

---

## Admin設定画面設計

### 画面レイアウト

```
┌─────────────────────────────────────────┐
│ 🔧 機能設定                              │
├─────────────────────────────────────────┤
│                                         │
│ オプション機能のON/OFFを切り替えます     │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ スタッフ指名機能              ○ ON│   │
│ │ +8,000円                           │   │
│ │ スタッフ一覧ページとスタッフ指名   │   │
│ └───────────────────────────────────┘   │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ スタッフシフト管理            ● OFF│   │
│ │ +10,000円                          │   │
│ │ スタッフのシフト登録・管理       │   │
│ └───────────────────────────────────┘   │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ 顧客管理・メモ機能            ○ ON│   │
│ │ +12,000円                          │   │
│ │ 顧客情報・来店履歴・メモ管理     │   │
│ └───────────────────────────────────┘   │
│                                         │
│ ... (他のオプション)                    │
│                                         │
│ [💾 設定を保存]                         │
└─────────────────────────────────────────┘
```

### コンポーネント設計

**ページ**: `/admin/settings/features`

**コンポーネント構成**:
```tsx
<FeatureSettingsPage>
  <PageHeader title="機能設定" />

  <FeatureFlagList>
    <FeatureFlagCard
      name="スタッフ指名機能"
      price="+8,000円"
      description="スタッフ一覧ページとスタッフ指名"
      enabled={flags.enableStaffSelection}
      onToggle={handleToggle('enableStaffSelection')}
    />

    <FeatureFlagCard
      name="スタッフシフト管理"
      price="+10,000円"
      description="スタッフのシフト登録・管理"
      enabled={flags.enableStaffShiftManagement}
      onToggle={handleToggle('enableStaffShiftManagement')}
    />

    {/* ... 他のフラグ */}
  </FeatureFlagList>

  <SaveButton onClick={handleSave} />
</FeatureSettingsPage>
```

---

## 実装の考慮事項

### フロントエンドでの制御

#### 条件分岐例（React）
```tsx
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export function BookingForm() {
  const { flags } = useFeatureFlags();

  return (
    <form>
      {/* メニュー選択（基準機能） */}
      <MenuSelect />

      {/* スタッフ指名（オプション機能） */}
      {flags.enableStaffSelection && (
        <StaffSelect />
      )}

      {/* クーポン入力（オプション機能） */}
      {flags.enableCouponFeature && (
        <CouponInput />
      )}

      <SubmitButton />
    </form>
  );
}
```

#### カスタムフック
```tsx
// hooks/useFeatureFlags.ts
import useSWR from 'swr';

export function useFeatureFlags() {
  const { data, error, isLoading } = useSWR('/api/feature-flags');

  return {
    flags: data?.data ?? {},
    isLoading,
    error,
  };
}
```

---

### バックエンドでの制御

#### ミドルウェア例
```typescript
// middleware/checkFeatureFlag.ts
export function requireFeatureFlag(flagName: keyof FeatureFlag) {
  return async (req: NextRequest) => {
    const flags = await getFeatureFlags(TENANT_ID);

    if (!flags[flagName]) {
      return NextResponse.json(
        { success: false, error: 'この機能は有効化されていません' },
        { status: 403 }
      );
    }

    // 機能が有効な場合は処理を続行
  };
}
```

#### API Route例
```typescript
// app/api/reservations/update/route.ts
export async function PATCH(request: NextRequest) {
  // 機能フラグチェック
  const flags = await getFeatureFlags(TENANT_ID);
  if (!flags.enableReservationUpdate) {
    return NextResponse.json(
      { success: false, error: '予約変更機能は有効化されていません' },
      { status: 403 }
    );
  }

  // 予約変更処理
  // ...
}
```

---

### セキュリティ考慮事項

1. **Admin権限チェック必須**
   - 機能フラグの変更はAdmin権限を持つユーザーのみ
   - middleware.tsでAdmin routeを保護

2. **テナント分離**
   - 各テナントは自分のフラグのみ変更可能
   - tenantIdでフィルタリング

3. **監査ログ**
   - 機能フラグの変更履歴を記録
   - 誰が・いつ・何を変更したかを追跡可能にする

---

### パフォーマンス考慮事項

1. **キャッシュ活用**
   - 機能フラグは頻繁に変更されないため、キャッシュを活用
   - SWRやReact Queryでクライアント側キャッシュ
   - サーバー側でもRedis等でキャッシュ（将来的に）

2. **初期読み込み**
   - アプリケーション起動時に機能フラグを取得
   - Context APIで全コンポーネントからアクセス可能にする

---

### ユーザー体験の考慮

1. **機能無効時のメッセージ**
   - 機能が無効な場合、UIを非表示にするだけでなく説明を表示
   - 例: 「この機能を有効にするには管理者にお問い合わせください」

2. **段階的ロールアウト**
   - 新規顧客には基準機能のみ提供
   - 後からオプション追加時にスムーズに有効化

3. **トライアル対応**
   - 一定期間だけ全機能を有効化する機能
   - 有効期限の設定（将来的に追加）

---

## 実装タスク一覧

### Phase 1: 基本機能（優先度: High）
- [ ] Prismaスキーマに`FeatureFlag`モデル追加
- [ ] マイグレーション実行
- [ ] Seed dataで初期フラグ設定
- [ ] `GET /api/admin/feature-flags` API実装
- [ ] `PATCH /api/admin/feature-flags` API実装
- [ ] `GET /api/feature-flags` API実装（全ユーザー向け）

### Phase 2: Admin設定画面（優先度: High）
- [ ] `/admin/settings/features` ページ作成
- [ ] `FeatureFlagCard` コンポーネント実装
- [ ] トグルスイッチUI実装
- [ ] 保存ボタン・保存処理実装
- [ ] ローディング・エラー表示

### Phase 3: 各機能での制御（優先度: Medium）
- [ ] `useFeatureFlags` カスタムフック実装
- [ ] スタッフ指名機能の表示制御
- [ ] スタッフシフト管理の表示制御
- [ ] 顧客管理機能の表示制御
- [ ] 予約変更機能の表示制御
- [ ] 分析レポートの表示制御
- [ ] その他オプション機能の表示制御

### Phase 4: バックエンド保護（優先度: Medium）
- [ ] `requireFeatureFlag` ミドルウェア実装
- [ ] 各APIでフラグチェック実装
- [ ] エラーメッセージの統一

### Phase 5: 監査・ログ（優先度: Low）
- [ ] 機能フラグ変更履歴テーブル作成
- [ ] 変更履歴の記録処理実装
- [ ] 変更履歴の閲覧画面実装

---

**最終更新日**: 2026-01-02
**作成者**: 開発チーム
