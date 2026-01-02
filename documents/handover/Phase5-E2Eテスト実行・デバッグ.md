# Phase 5: Issue #77, #78 E2Eテスト実行・デバッグ

**作成日**: 2026-01-02
**担当**: Claude Code
**対象Issue**: #77（スタッフ指名機能のON/OFF）、#78（スタッフシフト管理のON/OFF）

---

## 📋 作業概要

Issue #77と#78で実装されたスタッフ指名機能とシフト管理機能のE2Eテストを実行し、発見された問題を修正しました。

### 作業期間
- 2026-01-02 17:30 - 18:30（約1時間）

### 作業範囲
- ✅ Issue #77 E2Eテスト実行（`staff-selection-toggle.spec.ts`）
- ⚠️ Issue #78 E2Eテスト実行（未実施、Issue #77の問題解決後に推奨）
- ✅ ビルドエラー修正
- ✅ フロントエンド実装修正（テスト属性追加）
- ✅ テストコード修正（タイムアウト調整）
- ✅ 環境設定修正（テナントID）

---

## 🎯 達成した成果

### テスト成功率の改善

| 実行 | 成功/失敗 | 成功率 |
|------|---------|-------|
| 初回実行 | 0/7 | 0% |
| 最終実行 | 3/7 | **43%** |

**進捗**: 0% → 43%（3つの主要テストケースが通過）

---

## ✅ 実施した作業

### 1. 環境確認・修正

#### 1-1. テナントID不一致の修正
**問題**: `.env.local`のテナントIDが`demo-restaurant`だったが、シードデータは`demo-booking`で作成されていた

**修正内容**:
```diff
# .env.local
- NEXT_PUBLIC_TENANT_ID="demo-restaurant"
+ NEXT_PUBLIC_TENANT_ID="demo-booking"
```

**影響**: 機能フラグテーブルのレコードが見つからず、全テストが失敗していた

#### 1-2. シードデータ投入
**実行コマンド**:
```bash
npm run prisma:seed
```

**投入データ**:
- 店舗設定: 1件
- メニュー: 15件
- スタッフ: 5件
- スタッフシフト: 複数曜日
- 顧客: 複数件
- 予約: 複数件
- 機能フラグ: 10種類（実装済み6個/未実装4個）

---

### 2. ビルドエラー修正

#### 2-1. `dayOfWeek`変数重複エラー

**エラー内容**:
```
src/app/api/available-slots/route.ts:347:11
the name `dayOfWeek` is defined multiple times
```

**原因**: 150行目と347行目で同じ変数名`dayOfWeek`が定義されていた

**修正内容**:
```diff
# src/app/api/available-slots/route.ts (150行目)
- const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
+ const closedDayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
- if (settings.closedDays.includes(dayOfWeek)) {
+ if (settings.closedDays.includes(closedDayName)) {
```

**結果**: ビルドエラーが解消され、開発サーバーが正常起動

---

### 3. フロントエンド実装修正

#### 3-1. カレンダー日付ボタンに`data-day`属性追加

**問題**: E2Eテストで`[data-day="3"]`セレクタが見つからずタイムアウト

**修正内容**:
```diff
# src/app/booking/page.tsx (307行目)
<button
  key={day}
  onClick={() => handleDateClick(day)}
  disabled={isPast}
+ data-day={day}
  className={...}
>
  {day}
</button>
```

**結果**: カレンダー日付の選択が可能になった

#### 3-2. 時間スロットボタンに`data-testid`属性追加

**問題**: E2Eテストで`[data-testid="time-slot"]`セレクタが見つからない

**修正内容**:
```diff
# src/app/booking/page.tsx (349行目)
<button
  key={slot.time}
  onClick={() => slot.available && handleTimeClick(slot.time, slot.staffId)}
  disabled={!slot.available}
+ data-testid="time-slot"
  className={...}
>
  {slot.time}
</button>
```

**結果**: 時間スロットの検証が可能になった

---

### 4. テストコード修正

#### 4-1. `expectStaffSelectVisible()`のタイムアウト延長

**問題**: 機能フラグAPI取得完了前にスタッフ選択欄の存在確認を行い、タイムアウト

**修正内容**:
```diff
# src/__tests__/e2e/pages/BookingPage.ts (89行目)
async expectStaffSelectVisible() {
- await expect(this.page.locator(this.selectors.staffSelect)).toBeVisible();
+ await expect(this.page.locator(this.selectors.staffSelect)).toBeVisible({ timeout: 10000 });
}
```

**理由**: `useFeatureFlags()`フックが非同期でAPIから機能フラグを取得するため、初期レンダリング時は`flags=null`でスタッフ選択欄が表示されない

**結果**: 機能フラグ取得完了まで待機し、正しく検証できるようになった

#### 4-2. 時間スロット検証に`.first()`追加

**問題**: 複数の時間スロットが見つかり、strict mode違反エラー

**修正内容**:
```diff
# src/__tests__/e2e/staff-selection-toggle.spec.ts (177行目)
- await expect(page.locator('[data-testid="time-slot"]')).toBeVisible();
+ await expect(page.locator('[data-testid="time-slot"]').first()).toBeVisible();
```

**結果**: 最初の時間スロットのみを検証し、エラー解消

---

## 📊 テスト結果詳細

### Issue #77: スタッフ指名機能のON/OFF設定

**テストファイル**: `src/__tests__/e2e/staff-selection-toggle.spec.ts`
**テストケース数**: 7件
**ブラウザ**: Chromium

#### ✅ 成功したテスト（3件）

| # | テストケース | 実行時間 | 検証内容 |
|---|---|---|---|
| 1 | スタッフ指名機能がONの場合、予約フォームにスタッフ選択欄が表示される | 2.0s | UIの表示/非表示制御 |
| 2 | スタッフ指名機能がOFFの場合、予約フォームにスタッフ選択欄が表示されない | 3.5s | UIの表示/非表示制御 |
| 3 | スタッフ指名機能がOFFの場合、空き時間APIは全スタッフの空き状況を統合して返す | 2.6s | APIロジック |

#### ❌ 失敗したテスト（4件）

| # | テストケース | タイムアウト | エラー内容 | 根本原因 |
|---|---|---|---|---|
| 1 | スタッフを指名して予約できる | 30s | 予約ボタンがdisabled | フォーム検証が無効状態 |
| 2 | 指名なしで予約できる | 30s | 予約ボタンがdisabled | フォーム検証が無効状態 |
| 3 | スタッフが自動割り当てされる | 30s | 外部キー制約エラー | テストユーザーIDが存在しない |
| 4 | 機能フラグOFF変更時の即座反映 | 1.7s | 詳細不明 | - |

---

## 🔍 残っている問題の分析

### 問題1: 予約ボタンがdisabledのまま（優先度: 高）

#### エラーログ
```
element is not enabled
<button disabled data-testid="submit-button"...>予約を確定する</button>
```

#### 発生箇所
```typescript
// src/__tests__/e2e/staff-selection-toggle.spec.ts:98
await page.click('[data-testid="submit-button"]');
// → 30秒間待機後、タイムアウト
```

#### 原因の仮説

1. **フォーム検証ロジックの問題**
   ```typescript
   // src/app/booking/page.tsx:161-164
   const isFormValid =
     selectedDate &&
     selectedTime &&
     selectedMenuId;
   ```
   - `selectedDate`、`selectedTime`、`selectedMenuId`のいずれかが`null`または空文字列
   - 特に`selectedTime`が状態に反映されていない可能性が高い

2. **時間スロットクリックハンドラーの問題**
   ```typescript
   // src/app/booking/page.tsx:152-157
   const handleTimeClick = (time: string, staffId?: string) => {
     setSelectedTime(time);
     if (staffId && !selectedStaffId) {
       setSelectedStaffId(staffId);
     }
   };
   ```
   - クリックイベントが正しく発火していない？
   - 状態更新が非同期で反映されていない？

#### 推奨デバッグ手順

1. **状態ログの追加**
   ```typescript
   // テストコード内で状態確認
   await page.click(`[data-testid="time-slot"]:has-text("10:00")`);
   await page.waitForTimeout(1000); // 状態更新待ち

   // ブラウザコンソールで状態確認
   const buttonState = await page.evaluate(() => {
     const btn = document.querySelector('[data-testid="submit-button"]');
     return btn?.hasAttribute('disabled');
   });
   console.log('Button disabled:', buttonState);
   ```

2. **Playwright UI Modeでデバッグ**
   ```bash
   npx dotenv-cli -e .env.local -- npx playwright test \
     src/__tests__/e2e/staff-selection-toggle.spec.ts \
     --ui
   ```
   - ステップバイステップで実行
   - 時間スロットクリック後の状態を目視確認

3. **時間スロットクリック前後のスクリーンショット**
   ```typescript
   await page.screenshot({ path: 'before-time-click.png' });
   await page.click(`[data-testid="time-slot"]:has-text("10:00")`);
   await page.waitForTimeout(500);
   await page.screenshot({ path: 'after-time-click.png' });
   ```

---

### 問題2: 外部キー制約エラー（優先度: 中）

#### エラーログ
```
Foreign key constraint violated on the constraint: `booking_reservations_user_id_fkey`
Invalid `tx.bookingReservation.create()` invocation in
src/app/api/reservations/route.ts:376:42
```

#### 原因
テストが使用している`'x-user-id': 'temp-user-id'`がデータベースに存在しない

#### 現在の実装
```typescript
// src/app/booking/page.tsx:186
headers: {
  'Content-Type': 'application/json',
  // TODO: Replace with actual authenticated user ID
  'x-user-id': 'temp-user-id',
},
```

#### 解決策

**オプション1: シードデータのユーザーIDを使用（推奨）**
```bash
# Prisma Studioでユーザーテーブルを確認
npx dotenv-cli -e .env.local -- npx prisma studio

# booking_users テーブルからIDをコピー
# 例: 550e8400-e29b-41d4-a716-446655440101
```

テストコードを修正:
```typescript
// テストセットアップで実際のユーザーIDを取得
const user = await prisma.bookingUser.findFirst({
  where: { tenantId: TENANT_ID },
});

// テスト内でユーザーIDを設定
await page.evaluate((userId) => {
  localStorage.setItem('test-user-id', userId);
}, user.id);
```

**オプション2: テストユーザーを動的に作成**
```typescript
// テストセットアップ
let testUserId: string;

test.beforeEach(async () => {
  const testUser = await prisma.bookingUser.create({
    data: {
      id: 'test-user-001',
      tenantId: TENANT_ID,
      email: 'test@example.com',
      name: 'Test User',
    },
  });
  testUserId = testUser.id;
});

test.afterEach(async () => {
  await prisma.bookingUser.delete({
    where: { id: testUserId },
  });
});
```

---

### 問題3: 機能フラグOFF変更時の即座反映テスト失敗（優先度: 低）

#### テストケース
```typescript
test('スーパー管理者が機能フラグをOFFに変更すると、即座に反映される', async ({ page }) => {
  // スーパー管理者としてログイン
  // 機能フラグをOFFに変更
  // 予約ページに戻る
  // スタッフ選択欄が非表示になることを確認
});
```

#### 問題
1.7秒でタイムアウトしているため、ログインまたはページ遷移で問題が発生している可能性

#### 推奨デバッグ手順
- スクリーンショットで失敗箇所を確認
- エラーコンテキストファイルを確認
- 個別にテストケースを実行

---

## 📂 修正したファイル一覧

### 環境設定
| ファイル | 修正内容 | 行数 |
|---------|--------|------|
| `.env.local` | テナントID修正（`demo-restaurant` → `demo-booking`） | 29 |

### バックエンド
| ファイル | 修正内容 | 行数 |
|---------|--------|------|
| `src/app/api/available-slots/route.ts` | `dayOfWeek`変数重複エラー修正 | 150 |

### フロントエンド
| ファイル | 修正内容 | 行数 |
|---------|--------|------|
| `src/app/booking/page.tsx` | カレンダー日付ボタンに`data-day`属性追加 | 307 |
| `src/app/booking/page.tsx` | 時間スロットボタンに`data-testid="time-slot"`属性追加 | 349 |

### テストコード
| ファイル | 修正内容 | 行数 |
|---------|--------|------|
| `src/__tests__/e2e/pages/BookingPage.ts` | `expectStaffSelectVisible()`のタイムアウトを10秒に延長 | 89 |
| `src/__tests__/e2e/staff-selection-toggle.spec.ts` | 時間スロット検証に`.first()`追加 | 177 |

---

## 🎯 次のステップ

### 優先度: 高

#### 1. 予約フォーム検証ロジックのデバッグ

**作業内容**:
1. Playwright UI Modeでテストを実行
   ```bash
   npx dotenv-cli -e .env.local -- npx playwright test \
     src/__tests__/e2e/staff-selection-toggle.spec.ts:62 \
     --ui --debug
   ```

2. 時間スロットクリック後の状態を確認
   - `selectedTime`が正しく設定されているか
   - `selectedDate`が正しく設定されているか
   - `selectedMenuId`が正しく設定されているか

3. 必要に応じて修正
   - クリックハンドラーの修正
   - 状態更新の待機時間追加
   - フォーム検証ロジックの修正

**期待される結果**: 予約ボタンが有効になり、予約が完了する

---

### 優先度: 中

#### 2. テストユーザーIDの修正

**作業内容**:
1. Prisma Studioでユーザーテーブルを確認
   ```bash
   npx dotenv-cli -e .env.local -- npx prisma studio
   ```

2. 実際のユーザーIDをテストで使用
   ```typescript
   // テストセットアップで実際のユーザーを取得
   const user = await prisma.bookingUser.findFirst({
     where: { tenantId: TENANT_ID },
   });

   // ヘッダーに設定
   headers: {
     'x-user-id': user.id,
   }
   ```

3. テスト再実行

**期待される結果**: 外部キー制約エラーが解消され、予約が正常に作成される

---

### 優先度: 低

#### 3. Issue #78 E2Eテスト実行

**作業内容**:
```bash
npx dotenv-cli -e .env.local -- npx playwright test \
  src/__tests__/e2e/staff-shift-management-toggle.spec.ts \
  --project=chromium
```

**注意事項**:
- Issue #77の問題解決後に実行を推奨
- 同様の問題（予約フォーム、ユーザーID）が発生する可能性が高い
- Issue #77で得た知見を活用して修正

---

## 📚 参考情報

### 関連ファイル

#### 機能フラグ関連
- `src/hooks/useFeatureFlags.ts` - 機能フラグ取得フック
- `src/app/api/feature-flags/route.ts` - 機能フラグAPI
- `src/lib/api-feature-flag.ts` - サーバーサイド機能フラグ取得

#### 予約フォーム関連
- `src/app/booking/page.tsx` - 予約ページ（メインコンポーネント）
- `src/app/api/reservations/route.ts` - 予約作成API
- `src/app/api/available-slots/route.ts` - 空き時間API

#### テスト関連
- `src/__tests__/e2e/staff-selection-toggle.spec.ts` - Issue #77 E2Eテスト
- `src/__tests__/e2e/staff-shift-management-toggle.spec.ts` - Issue #78 E2Eテスト
- `src/__tests__/e2e/pages/BookingPage.ts` - 予約ページPage Object

#### ドキュメント
- `documents/spec/issue-77-78-gherkin-scenarios.md` - Gherkinシナリオ
- `CLAUDE.md` - AIエージェント向けマスタードキュメント
- `.cursor/rules/開発プロセスルール.md` - 開発プロセスルール

### よく使うコマンド

```bash
# E2Eテスト実行（全て）
npx dotenv-cli -e .env.local -- npx playwright test

# E2Eテスト実行（特定ファイル）
npx dotenv-cli -e .env.local -- npx playwright test \
  src/__tests__/e2e/staff-selection-toggle.spec.ts

# E2Eテスト実行（UIモード）
npx dotenv-cli -e .env.local -- npx playwright test --ui

# E2Eテスト実行（デバッグモード）
npx dotenv-cli -e .env.local -- npx playwright test --debug

# Prisma Studio起動
npx dotenv-cli -e .env.local -- npx prisma studio

# シードデータ再投入
npx dotenv-cli -e .env.local -- npx tsx prisma/seed.ts

# ビルド確認
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build:ci
```

---

## 💡 学んだこと・Tips

### 1. Playwrightのdata属性ベストプラクティス

- `data-testid`は一意である必要がない（`.first()`で最初の要素を取得可能）
- `data-day`のような動的属性はテストの可読性を向上させる
- テキストセレクタ（`:has-text()`）よりもdata属性の方が安定

### 2. 機能フラグの非同期取得

- `useFeatureFlags()`フックは非同期でAPIから取得
- 初期レンダリング時は`flags=null`
- テストでは適切なタイムアウト設定が必要（10秒推奨）

### 3. テナントIDの一貫性

- `.env.local`とシードデータのテナントIDは一致させる必要がある
- 不一致の場合、機能フラグやマスタデータが見つからずテスト失敗
- プロジェクト全体で`demo-booking`に統一

### 4. E2Eテストのデバッグ方法

- Playwright UI Mode（`--ui`）が最も効率的
- スクリーンショットとエラーコンテキストが自動保存される
- `test-results/`ディレクトリを確認

---

## 🔄 継続的改善提案

### 1. テストユーザー管理の改善

**現状の問題**:
- ハードコードされた`'temp-user-id'`を使用
- 実際のユーザーが存在せず外部キー制約エラー

**提案**:
```typescript
// テストフィクスチャを作成
export const testUsers = {
  customer: {
    id: 'test-customer-001',
    email: 'customer@test.com',
    name: 'Test Customer',
  },
  admin: {
    id: 'test-admin-001',
    email: 'admin@test.com',
    name: 'Test Admin',
  },
};

// セットアップでテストユーザーを作成
test.beforeAll(async () => {
  await prisma.bookingUser.createMany({
    data: [testUsers.customer, testUsers.admin],
  });
});
```

### 2. Page Objectの拡張

**追加推奨メソッド**:
```typescript
// BookingPage.ts
async waitForFeatureFlags() {
  // 機能フラグ取得完了を待つ
  await this.page.waitForFunction(() => {
    return window.localStorage.getItem('feature-flags-loaded') === 'true';
  });
}

async fillBookingForm(data: {
  menuIndex: number;
  date: Date;
  time: string;
  staffIndex?: number;
}) {
  // フォーム入力を1つのメソッドにまとめる
}
```

### 3. 環境変数チェックスクリプト

**提案**:
```bash
# scripts/check-env.sh
#!/bin/bash

TENANT_ID=$(grep NEXT_PUBLIC_TENANT_ID .env.local | cut -d '=' -f2 | tr -d '"')
SEED_TENANT_ID=$(grep 'const TENANT_ID' prisma/seed.ts | cut -d "'" -f2)

if [ "$TENANT_ID" != "$SEED_TENANT_ID" ]; then
  echo "⚠️  テナントIDが不一致です！"
  echo "   .env.local: $TENANT_ID"
  echo "   seed.ts: $SEED_TENANT_ID"
  exit 1
fi

echo "✅ テナントIDは一致しています: $TENANT_ID"
```

---

## 📞 問い合わせ先

- **プロジェクト**: 予約管理システム
- **GitHub**: [reserve-system](URL)
- **ブランチ**: `feature/staff-selection-toggle`
- **関連Issue**: #77, #78

---

**引き継ぎ日**: 2026-01-02
**次回作業者へ**: 上記「次のステップ」セクションから作業を開始してください。特に優先度「高」の予約フォーム検証ロジックのデバッグが重要です。
