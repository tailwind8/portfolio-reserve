# Phase 4 引き継ぎドキュメント: 機能フラグ連動実装

**作成日**: 2026-01-02
**作成者**: Claude Sonnet 4.5
**Phase**: 4
**関連PR**: #101
**関連Issue**: #95, #96, #97, #98

---

## 📝 Phase 4の概要

Phase 2-3で実装したスーパー管理者機能フラグ管理を基に、**一般ユーザー・管理者がアクセスする全画面で機能フラグを取得し、UI表示を動的に制御する仕組み**を実装しました。

### 実装の狙い

- スーパー管理者が機能フラグをON/OFFすると、即座にユーザー画面・管理者画面に反映
- 未実装機能を非表示にし、段階的リリースを可能に
- フラグ取得失敗時は安全側に倒す（すべて非表示）

---

## 🎯 実装内容

### 1. 機能フラグ取得API（一般ユーザー向け）

**ファイル**: `src/app/api/feature-flags/route.ts`

#### 特徴

- **認証不要**: 誰でもアクセス可能（読み取り専用）
- **GETのみ**: POSTは禁止（変更はスーパー管理者のみ）
- **Fail-safe設計**: エラー時は全機能をOFF（false）にして返す
- **テナント対応**: 環境変数 `NEXT_PUBLIC_TENANT_ID` でテナントを識別

#### エンドポイント

```
GET /api/feature-flags
```

#### レスポンス例（成功時）

```json
{
  "success": true,
  "data": {
    "featureFlags": {
      "enableStaffSelection": true,
      "enableStaffShiftManagement": true,
      "enableCustomerManagement": false,
      "enableReservationUpdate": false,
      "enableReminderEmail": true,
      "enableManualReservation": true,
      "enableAnalyticsReport": false,
      "enableRepeatRateAnalysis": false,
      "enableCouponFeature": false,
      "enableLineNotification": false
    }
  }
}
```

#### レスポンス例（エラー時）

```json
{
  "success": true,
  "data": {
    "featureFlags": {
      "enableStaffSelection": false,
      "enableStaffShiftManagement": false,
      "enableCustomerManagement": false,
      "enableReservationUpdate": false,
      "enableReminderEmail": false,
      "enableManualReservation": false,
      "enableAnalyticsReport": false,
      "enableRepeatRateAnalysis": false,
      "enableCouponFeature": false,
      "enableLineNotification": false
    }
  }
}
```

**注**: エラー時もHTTPステータスは200。全フラグがfalseで返る。

#### 実装コード（抜粋）

```typescript
// src/app/api/feature-flags/route.ts
export async function GET() {
  try {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    const featureFlag = await prisma.featureFlag.findUnique({
      where: { tenantId },
    });

    if (!featureFlag) {
      // デフォルト値（すべてfalse）を返す
      return successResponse({ featureFlags: { /* all false */ } });
    }

    return successResponse({ featureFlags: { /* actual values */ } });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    // エラー時は安全側に倒す
    return successResponse({ featureFlags: { /* all false */ } });
  }
}
```

---

### 2. useFeatureFlagsカスタムフック

**ファイル**: `src/hooks/useFeatureFlags.ts`

#### 特徴

- **全画面で使用可能**: 予約フォーム、管理者ダッシュボードなど
- **ローディング状態**: `isLoading` でローディング中を判定
- **エラー情報**: `error` でエラーを取得
- **型安全**: TypeScriptで全フラグを型定義

#### 使用例

```typescript
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

function MyComponent() {
  const { flags, isLoading, error } = useFeatureFlags();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    console.error('Failed to load feature flags:', error);
    // エラー時も flags は全てfalse で返る
  }

  return (
    <div>
      {flags?.enableStaffSelection && (
        <StaffSelector />
      )}
      {flags?.enableCouponFeature && (
        <CouponInput />
      )}
    </div>
  );
}
```

#### 型定義

```typescript
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export interface UseFeatureFlagsReturn {
  /** 機能フラグオブジェクト（ローディング中はnull） */
  flags: FeatureFlags | null;
  /** ローディング状態 */
  isLoading: boolean;
  /** エラー情報（エラーがない場合はnull） */
  error: Error | null;
}
```

#### 実装ポイント

- **初回マウント時にAPI呼び出し**: `useEffect` で自動取得
- **エラー時のフォールバック**: `catch`節で全フラグをfalseに設定
- **レスポンス検証**: `success` と `data.featureFlags` の存在確認

---

### 3. 予約フォームでの機能フラグ制御

**ファイル**: `src/app/booking/page.tsx`

#### 実装内容

- **スタッフ選択**: `enableStaffSelection` フラグで制御
- **クーポン入力**: `enableCouponFeature` フラグで制御

#### コード例

```typescript
'use client';

import { useFeatureFlags } from '@/hooks/useFeatureFlags';

function BookingContent() {
  const { flags: featureFlags } = useFeatureFlags();
  const [couponCode, setCouponCode] = useState('');

  return (
    <form>
      {/* スタッフ選択（機能フラグで制御） */}
      {featureFlags?.enableStaffSelection && (
        <div>
          <label htmlFor="staff">担当者</label>
          <select id="staff" value={selectedStaffId} onChange={handleStaffChange}>
            <option value="">指定なし</option>
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* クーポン入力（機能フラグで制御） */}
      {featureFlags?.enableCouponFeature && (
        <div>
          <label htmlFor="coupon">クーポンコード（任意）</label>
          <input
            id="coupon"
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            data-testid="coupon-input"
          />
        </div>
      )}
    </form>
  );
}
```

#### 動作確認方法

1. スーパー管理者で `/super-admin/feature-flags` にアクセス
2. 「スタッフ指名機能」をON/OFF切り替え
3. 予約ページ `/booking` をリロード
4. スタッフ選択フィールドの表示/非表示を確認

---

### 4. 管理者サイドバーでの機能フラグ制御

**ファイル**: `src/components/AdminSidebar.tsx`

#### 実装内容

管理者サイドバーのメニュー項目を機能フラグに応じて動的に表示/非表示します。

| メニュー項目 | 機能フラグ | testId |
|------------|----------|--------|
| ダッシュボード | なし（常に表示） | `nav-link-ダッシュボード` |
| 予約管理 | なし（常に表示） | `nav-link-予約管理` |
| **顧客管理** | `enableCustomerManagement` | `nav-customer-management` |
| **スタッフ管理** | `enableStaffShiftManagement` | `nav-staff-management` |
| メニュー管理 | なし（常に表示） | `nav-link-メニュー管理` |
| **分析レポート** | `enableAnalyticsReport` | `nav-link-分析レポート` |
| 店舗設定 | なし（常に表示） | `nav-link-店舗設定` |

#### コード例

```typescript
'use client';

import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export default function AdminSidebar() {
  const { flags: featureFlags } = useFeatureFlags();

  const allMenuItems = [
    {
      name: 'ダッシュボード',
      href: '/admin/dashboard',
      requiresFeature: null, // 常に表示
      testId: 'nav-link-ダッシュボード',
      icon: <DashboardIcon />,
    },
    {
      name: '顧客管理',
      href: '/admin/customers',
      requiresFeature: 'enableCustomerManagement', // 機能フラグで制御
      testId: 'nav-customer-management',
      icon: <CustomersIcon />,
    },
    // ...
  ];

  // 機能フラグに基づいてフィルタリング
  const menuItems = allMenuItems.filter((item) => {
    if (!item.requiresFeature) return true; // 常に表示
    if (!featureFlags) return false; // ローディング中は非表示
    return featureFlags[item.requiresFeature] === true;
  });

  return (
    <aside>
      <nav>
        {menuItems.map((item) => (
          <Link key={item.name} href={item.href} data-testid={item.testId}>
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

#### 動作確認方法

1. スーパー管理者で機能フラグ管理画面にアクセス
2. 「顧客管理機能」をON/OFF切り替え
3. 管理者ダッシュボード `/admin/dashboard` をリロード
4. サイドバーの「顧客管理」メニューの表示/非表示を確認

---

## 🧪 テスト戦略

### 1. E2Eテスト（API）

**ファイル**: `src/__tests__/e2e/feature-flag-integration.spec.ts`

#### テストケース（8件）

```typescript
describe('機能フラグ連動 - API', () => {
  test('一般ユーザーが機能フラグを取得できる', async ({ request }) => {
    const response = await request.get('/api/feature-flags');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.featureFlags).toBeDefined();

    // 全10フラグが存在することを確認
    expect(body.data.featureFlags.enableStaffSelection).toBeDefined();
    expect(body.data.featureFlags.enableCouponFeature).toBeDefined();
    // ...
  });

  test('機能フラグは全てboolean値である', async ({ request }) => {
    const response = await request.get('/api/feature-flags');
    const body = await response.json();
    const flags = body.data.featureFlags;

    Object.values(flags).forEach((value) => {
      expect(typeof value).toBe('boolean');
    });
  });

  // その他6件のテスト...
});
```

#### 実行方法

```bash
npm run test:e2e -- feature-flag-integration.spec.ts
```

---

### 2. 単体テスト（useFeatureFlagsフック）

**ファイル**: `src/__tests__/unit/hooks/useFeatureFlags.test.ts`

#### テストケース（6件）

| テストケース | 目的 |
|------------|------|
| 正常にフラグを取得できる | ハッピーパス |
| APIエラー時は全てfalseのフラグを返す | HTTP 500エラー時のフォールバック |
| レスポンス形式が不正な場合はエラーを返す | `success: false` の場合 |
| ネットワークエラー時は全てfalseのフラグを返す | fetch失敗時 |
| レスポンスにdataがない場合はエラーを返す | レスポンス検証 |
| レスポンスにfeatureFlagsがない場合はエラーを返す | レスポンス検証 |

#### カバレッジ結果

```
useFeatureFlags.ts: 100% (statements/branches/functions/lines) ✅
```

#### 実行方法

```bash
npm test -- useFeatureFlags.test.ts
```

---

### 3. 単体テスト（AdminSidebar）

**ファイル**: `src/__tests__/unit/AdminSidebar.test.tsx`

#### テストケース（12件）

- 基本的なレンダリング（8件）
- **機能フラグ制御**（4件）:
  - 顧客管理機能OFFで「顧客管理」が非表示
  - スタッフ管理機能OFFで「スタッフ管理」が非表示
  - 分析レポート機能OFFで「分析レポート」が非表示
  - 全フラグONで全メニュー表示

#### 重要ポイント

**useFeatureFlagsフックのモック**が必須です：

```typescript
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

jest.mock('@/hooks/useFeatureFlags');

describe('AdminSidebar', () => {
  beforeEach(() => {
    // 全フラグをtrueでモック
    (useFeatureFlags as jest.Mock).mockReturnValue({
      flags: {
        enableStaffSelection: true,
        enableStaffShiftManagement: true,
        enableCustomerManagement: true,
        // ... 全フラグをtrue
      },
      isLoading: false,
      error: null,
    });
  });

  it('顧客管理機能OFFで非表示', () => {
    // 顧客管理のみfalseに変更
    (useFeatureFlags as jest.Mock).mockReturnValue({
      flags: {
        enableCustomerManagement: false, // OFF
        // ... 他はtrue
      },
      isLoading: false,
      error: null,
    });

    render(<AdminSidebar />);

    expect(screen.queryByTestId('nav-customer-management')).not.toBeInTheDocument();
    expect(screen.queryByText('顧客管理')).not.toBeInTheDocument();
  });
});
```

---

## 📊 カバレッジ改善

### Before（Phase 4実装前）

```
branches: 38.65%（閾値39%未達 ❌）
```

### After（Phase 4実装後）

```
useFeatureFlags.ts: 100%
全体 branches: 40.61%（閾値39%クリア ✅）
```

### 改善内容

- `useFeatureFlags.test.ts`（6テスト）追加
- `AdminSidebar.test.tsx`（4テスト）追加
- 合計 **+1.96ポイント** 向上

---

## 🔧 開発時の注意点

### 1. フラグ取得失敗時の挙動

**設計思想**: エラー時は「機能を非表示にする」ことで安全側に倒す

```typescript
// ❌ 悪い例: エラー時にエラー画面を表示
if (error) {
  return <ErrorPage />;
}

// ✅ 良い例: エラー時は機能を非表示
if (flags?.enableStaffSelection) {
  return <StaffSelector />;
}
// flags が null or false の場合は何も表示しない
```

### 2. ローディング中の表示

```typescript
// ❌ 悪い例: ローディング中に何も表示しない
if (isLoading) return null;

// ✅ 良い例: スケルトンローディングを表示
if (isLoading) {
  return <Skeleton />;
}
```

### 3. 機能フラグの型安全性

`FeatureFlagKey` 型を使用して、タイポを防ぐ：

```typescript
// ❌ 悪い例: 文字列リテラルで直接指定
const flag = featureFlags['enableStafSelection']; // タイポ

// ✅ 良い例: 型定義を使用
import { FeatureFlagKey } from '@/lib/feature-flags-config';
const flagKey: FeatureFlagKey = 'enableStaffSelection';
const flag = featureFlags[flagKey];
```

### 4. テストでのモック

**必ず `beforeEach` でモックをリセット**してください：

```typescript
beforeEach(() => {
  (useFeatureFlags as jest.Mock).mockReturnValue({
    flags: { /* デフォルト値 */ },
    isLoading: false,
    error: null,
  });
});
```

---

## 📁 ファイル構成

```
reserve-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── feature-flags/
│   │   │       └── route.ts                    # 機能フラグ取得API ⭐NEW
│   │   └── booking/
│   │       └── page.tsx                        # 予約フォーム（機能フラグ連動） ✏️UPDATED
│   ├── components/
│   │   └── AdminSidebar.tsx                     # 管理者サイドバー（機能フラグ連動） ✏️UPDATED
│   ├── hooks/
│   │   └── useFeatureFlags.ts                   # カスタムフック ⭐NEW
│   └── __tests__/
│       ├── e2e/
│       │   └── feature-flag-integration.spec.ts # E2Eテスト ⭐NEW
│       └── unit/
│           ├── AdminSidebar.test.tsx            # ユニットテスト ✏️UPDATED
│           └── hooks/
│               └── useFeatureFlags.test.ts      # フックテスト ⭐NEW
└── features/
    └── feature-flags/
        └── feature-flag-integration.feature     # Gherkinシナリオ ⭐NEW
```

---

## 🚀 次のフェーズへの引き継ぎ

### Phase 5で実装すべき内容

#### 1. 未実装UI機能の実装

以下の機能フラグに対応するUIがまだ実装されていません：

| 機能フラグ | 対応ページ | 実装状況 |
|----------|----------|---------|
| `enableReservationUpdate` | 予約変更モーダル | 未実装 |
| `enableReminderEmail` | 管理者設定ページ | 未実装 |
| `enableManualReservation` | 管理者予約作成ページ | 未実装 |
| `enableRepeatRateAnalysis` | 分析レポートページ | 未実装 |
| `enableLineNotification` | 店舗設定ページ | 未実装 |

#### 2. 機能フラグのリアルタイム更新

現在は**ページリロードでフラグを再取得**していますが、以下を検討：

- WebSocketでフラグ変更をリアルタイム通知
- ポーリング（30秒ごとに再取得）
- Server-Sent Events (SSE)

#### 3. 機能フラグの永続化

ブラウザリロード時の再取得を減らすため：

- LocalStorageにキャッシュ
- TTL（Time To Live）設定（例: 5分）
- フラグ変更時にキャッシュ無効化

---

## 📚 参考資料

### 関連ドキュメント

- [機能フラグ設定ガイド](../basic/機能フラグ設定ガイド.md)（未作成）
- [Phase 2-3引き継ぎ](./Phase2-3-スーパーadmin機能実装.md)（未作成）

### 関連API

- `GET /api/feature-flags` - 機能フラグ取得（一般ユーザー向け）
- `GET /api/super-admin/feature-flags` - 機能フラグ管理（スーパー管理者向け）
- `PATCH /api/super-admin/feature-flags` - 機能フラグ更新（スーパー管理者向け）

### Prismaモデル

```prisma
model FeatureFlag {
  id        String   @id @default(uuid())
  tenantId  String   @unique @default("demo-booking")

  enableStaffSelection       Boolean @default(false)
  enableStaffShiftManagement Boolean @default(false)
  enableCustomerManagement   Boolean @default(false)
  enableReservationUpdate    Boolean @default(false)
  enableReminderEmail        Boolean @default(false)
  enableManualReservation    Boolean @default(false)
  enableAnalyticsReport      Boolean @default(false)
  enableRepeatRateAnalysis   Boolean @default(false)
  enableCouponFeature        Boolean @default(false)
  enableLineNotification     Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("booking_feature_flags")
}
```

---

## ✅ Phase 4完了チェックリスト

- [x] 機能フラグ取得API実装（`GET /api/feature-flags`）
- [x] useFeatureFlagsカスタムフック実装
- [x] 予約フォームでの機能フラグ制御
- [x] 管理者サイドバーでの機能フラグ制御
- [x] E2Eテスト実装（8件）
- [x] useFeatureFlagsカバレッジテスト実装（6件）
- [x] AdminSidebarテスト更新（4件追加）
- [x] カバレッジ閾値クリア（branches: 40.61% > 39%）
- [x] CI/CD全て通過
- [x] PR作成・レビュー準備完了

---

**Phase 4は完了しました。Phase 5の実装に進んでください。** 🎉
