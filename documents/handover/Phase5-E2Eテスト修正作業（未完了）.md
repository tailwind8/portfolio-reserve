# Phase 5: Issue #77, #78 E2Eテスト修正作業（未完了）

**作成日**: 2026-01-02
**担当**: Claude Code
**対象Issue**: #77（スタッフ指名機能のON/OFF）、#78（スタッフシフト管理のON/OFF）
**ステータス**: ⚠️ **未完了（継続作業が必要）**

---

## 📋 作業概要

Issue #77のE2Eテストを修正する作業を実施しましたが、根本的な問題（予約ボタンdisabled）が未解決のため、継続作業が必要です。

### 作業期間
- 2026-01-02 17:30 - 20:00（約2.5時間）

### 作業範囲
- ✅ Phase5デバッグドキュメント作成
- ✅ ビルドエラー修正
- ✅ data属性追加（テスト可能性向上）
- ✅ テストユーザーID修正
- ✅ スタッフ選択待機処理追加
- ⚠️ **予約ボタンdisabled問題（未解決）**

---

## 📊 テスト成功率

| 実行時点 | 成功/失敗 | 成功率 | 備考 |
|---------|---------|-------|------|
| 初回実行（前回） | 3/7 | 43% | Phase5-E2Eテスト実行・デバッグ.md参照 |
| 最終実行（今回） | 2/7 | **29%** | 改善なし、むしろ悪化 |

---

## ✅ 実施した修正

### 1. テストユーザーIDの修正

**問題**: `'temp-user-id'`が存在せず、外部キー制約エラー

**修正内容**:
```diff
# src/app/booking/page.tsx (187行目)
headers: {
  'Content-Type': 'application/json',
- 'x-user-id': 'temp-user-id',
+ // 暫定的にシードデータの最初のユーザーID（山田 太郎）を使用
+ 'x-user-id': '550e8400-e29b-41d4-a716-446655440031',
},
```

**結果**: 外部キー制約エラーは解消

---

### 2. 時間スロットクリック処理の改善

**問題**: 時間スロットが表示される前にクリックを試行してエラー

**修正内容**:
```diff
# src/__tests__/e2e/staff-selection-toggle.spec.ts
- await page.waitForSelector('[data-testid="time-slot"]');
- await page.click('[data-testid="time-slot"]:first-child');
+ // 時間選択（空き時間API取得完了まで待機）
+ const firstTimeSlot = page.locator('[data-testid="time-slot"]').first();
+ await firstTimeSlot.waitFor({ state: 'visible', timeout: 10000 });
+ await firstTimeSlot.click();
+
+ // 時間が選択されたことを確認（少し待機）
+ await page.waitForTimeout(500);
```

**適用箇所**: 3つのテストケース（全て）

---

### 3. スタッフ選択前の機能フラグ待機

**問題**: `useFeatureFlags()`が非同期でAPIから取得するため、スタッフ選択欄が表示される前に操作を試行

**修正内容**:
```diff
# src/__tests__/e2e/staff-selection-toggle.spec.ts
+ // スタッフ選択欄が表示されるまで待機（機能フラグ取得完了を待つ）
+ await bookingPage.expectStaffSelectVisible();
+
// スタッフ選択
if (staff) {
  await page.locator('select#staff').selectOption(staff.id);
}
```

**適用箇所**: 2つのテストケース

---

### 4. 予約ボタン有効化の待機

**問題**: React状態更新が完了する前に予約ボタンをクリック

**修正内容**:
```diff
# src/__tests__/e2e/staff-selection-toggle.spec.ts
+ // 予約ボタンが有効になるまで待つ（React状態更新の完了を待つ）
+ await expect(page.locator('[data-testid="submit-button"]')).toBeEnabled({ timeout: 5000 });
+
// 予約確定
await page.click('[data-testid="submit-button"]');
```

**結果**: ⚠️ **5秒待ってもdisabledのまま**

---

## 🚨 未解決の問題

### 問題: 予約ボタンがdisabledのまま（最重要）

#### 現象

```
Error: expect(locator).toBeEnabled() failed

Locator:  locator('[data-testid="submit-button"]')
Expected: enabled
Received: disabled
Timeout:  5000ms
```

#### 根本原因の仮説

**フォーム検証ロジック**:
```typescript
// src/app/booking/page.tsx:161-164
const isFormValid =
  selectedDate &&
  selectedTime &&
  selectedMenuId;
```

**仮説1**: `selectedTime`が設定されていない
- 時間スロットのクリックイベントは発火している
- しかし、`handleTimeClick()`が`setSelectedTime()`を実行していない可能性
- React状態更新のタイミング問題

**仮説2**: クリックハンドラーの条件分岐
```typescript
onClick={() => slot.available && handleTimeClick(slot.time, slot.staffId)}
disabled={!slot.available}
```
- `slot.available`が`false`の可能性
- しかし、テストはクリックに成功しているので、この可能性は低い

**仮説3**: 非同期状態更新の競合
- 日付クリック → 空き時間API取得 → 時間スロットレンダリング → クリック
- この一連の流れで、状態更新が正しく完了していない可能性

#### エラーコンテキスト（error-context.md）

```yaml
- generic [ref=e104]:
  - text: 2026年1月3日（土）
  - text: 時間未選択  ← これが問題！
```

**時間スロットをクリックしても、`selectedTime`が`null`のまま**

---

### 問題: 機能フラグOFF時にスタッフ選択欄が表示される

#### 現象

```
Test: スタッフ指名機能がOFFの場合、予約フォームにスタッフ選択欄が表示されない

Error: expect(locator).not.toBeVisible() failed
Expected: not visible
Received: visible
```

#### 原因の仮説

- テスト開始前の機能フラグ更新が反映されていない
- ページリロード/再訪問が必要かもしれない
- `useFeatureFlags()`のキャッシュ問題

---

### 問題: 予約重複エラー

**ログ**:
```
API Error: {
  statusCode: 409,
  message: '既にこの時間帯に予約があります',
  code: 'USER_TIME_SLOT_CONFLICT'
}
```

**原因**: テストの副作用（前回のテスト実行で作成された予約が残っている）

**対処**: テストごとにデータベースをクリーンアップする必要がある

---

## 🔍 推奨デバッグ手順

### 手順1: Playwright Trace Viewerで詳細分析

```bash
# トレース付きでテスト実行
npx dotenv-cli -e .env.local -- npx playwright test \
  src/__tests__/e2e/staff-selection-toggle.spec.ts:62 \
  --trace on

# トレース表示
npx playwright show-trace test-results/.../trace.zip
```

**確認ポイント**:
- 時間スロットクリック時のネットワークリクエスト
- React状態の変化（DevToolsログ）
- DOMの変化

---

### 手順2: Console Logで状態を追跡

**フロントエンド修正**:
```typescript
// src/app/booking/page.tsx:152-157
const handleTimeClick = (time: string, staffId?: string) => {
  console.log('🔵 handleTimeClick called:', { time, staffId, currentSelectedTime: selectedTime });
  setSelectedTime(time);
  console.log('🔵 setSelectedTime executed');
  if (staffId && !selectedStaffId) {
    setSelectedStaffId(staffId);
  }
};
```

**useEffectで状態監視**:
```typescript
useEffect(() => {
  console.log('🟢 selectedTime changed:', selectedTime);
  console.log('🟢 isFormValid:', isFormValid);
}, [selectedTime]);
```

**テストコードで確認**:
```typescript
// ブラウザコンソールのログを取得
page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
```

---

### 手順3: Playwright UI Modeでステップ実行

```bash
npx dotenv-cli -e .env.local -- npx playwright test \
  src/__tests__/e2e/staff-selection-toggle.spec.ts:62 \
  --ui --debug
```

**確認ポイント**:
- 各ステップでのDOMスナップショット
- 時間スロットクリック後の状態
- 予約ボタンのdisabled属性の変化

---

### 手順4: 時間スロットクリックの直接テスト

**簡易テストケース**:
```typescript
test('時間スロットクリックで selectedTime が設定される', async ({ page }) => {
  await page.goto('/booking');

  // メニュー選択
  await page.locator('select#menu').selectOption({ index: 1 });

  // 日付選択
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await page.click(`[data-day="${tomorrow.getDate()}"]`);

  // 時間スロットクリック
  const firstTimeSlot = page.locator('[data-testid="time-slot"]').first();
  await firstTimeSlot.waitFor({ state: 'visible', timeout: 10000 });
  const slotText = await firstTimeSlot.textContent();
  await firstTimeSlot.click();

  // 待機
  await page.waitForTimeout(1000);

  // selectedTime が設定されたことを確認（UIから判断）
  const selectedTimeDisplay = page.locator('text=時間未選択');
  await expect(selectedTimeDisplay).not.toBeVisible();

  // または、選択された時間が表示されることを確認
  await expect(page.locator(`text=${slotText}`)).toBeVisible();
});
```

---

## 📂 修正したファイル一覧

| ファイル | 修正内容 | コミット |
|---------|--------|---------|
| `src/app/booking/page.tsx` | テストユーザーID修正 | 2156447 |
| `src/__tests__/e2e/staff-selection-toggle.spec.ts` | 時間スロットクリック処理改善、機能フラグ待機追加 | 2156447 |
| `documents/handover/Phase5-E2Eテスト実行・デバッグ.md` | 前回の作業記録 | f899d05 |

---

## 🎯 次の作業者へのアドバイス

### 優先度: 最高 ⚠️

#### 1. `selectedTime`が設定されない根本原因の特定

**推奨アプローチ**:

**オプション1: Console Logデバッグ（最も確実）**
1. `handleTimeClick()`にconsole.logを追加
2. `useEffect(() => { console.log(selectedTime) }, [selectedTime])`を追加
3. テスト実行中のブラウザコンソールを確認
4. `handleTimeClick`が呼ばれているか、`setSelectedTime`が実行されているかを確認

**オプション2: Playwright UI Mode（視覚的に確認）**
1. `--ui`オプションでテスト実行
2. 時間スロットクリック前後のDOMを比較
3. クリックイベントが発火しているか確認

**オプション3: クリック処理の見直し**
```typescript
// テストコード内で直接状態を確認
await firstTimeSlot.click();
await page.waitForTimeout(1000); // 待機時間を増やす

// DOMから選択状態を確認
const isSelected = await firstTimeSlot.evaluate(el =>
  el.classList.contains('bg-blue-500')
);
console.log('Time slot selected:', isSelected);
```

---

#### 2. 代替アプローチの検討

**アプローチA: テストの期待値を調整**
- 予約ボタンの有効化待機を諦め、エラーハンドリングで対応
- スクリーンショット撮影でデバッグ情報を収集

**アプローチB: 実装の見直し**
- `handleTimeClick()`の処理を同期的に実行
- `selectedTime`の設定ロジックを簡略化

**アプローチC: E2Eテストを一旦skip**
```typescript
test.skip('スタッフを指名して予約できる', async ({ page }) => {
  // テストを一旦スキップし、Issue化
});
```

---

### 優先度: 高

#### 3. データベースクリーンアップの実装

**問題**: 予約重複エラー

**解決策**:
```typescript
// テストセットアップ
test.beforeEach(async () => {
  // 前回のテストデータを削除
  await prisma.bookingReservation.deleteMany({
    where: { tenantId: TENANT_ID },
  });
});
```

---

#### 4. 機能フラグOFF時の表示制御テスト修正

**問題**: 機能フラグをOFFにしてもスタッフ選択欄が表示される

**解決策**:
```typescript
// 機能フラグ更新後、ページをリロード
await prisma.featureFlag.update({
  where: { tenantId: TENANT_ID },
  data: { enableStaffSelection: false },
});

// ページリロード（キャッシュクリア）
await page.reload({ waitUntil: 'networkidle' });

// または、再訪問
await page.goto('/booking');
await page.waitForLoadState('networkidle');
```

---

### 優先度: 中

#### 5. Issue #78のE2Eテスト実行

**注意事項**:
- Issue #77の問題が解決してから実行を推奨
- 同様の問題（予約ボタンdisabled、機能フラグ待機）が発生する可能性が高い
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
- `documents/handover/Phase5-E2Eテスト実行・デバッグ.md` - 前回の作業記録
- `CLAUDE.md` - AIエージェント向けマスタードキュメント

---

### よく使うコマンド

```bash
# E2Eテスト実行（特定テストケース）
npx dotenv-cli -e .env.local -- npx playwright test \
  src/__tests__/e2e/staff-selection-toggle.spec.ts:62

# E2Eテスト実行（UIモード）
npx dotenv-cli -e .env.local -- npx playwright test \
  src/__tests__/e2e/staff-selection-toggle.spec.ts --ui

# E2Eテスト実行（トレース付き）
npx dotenv-cli -e .env.local -- npx playwright test \
  src/__tests__/e2e/staff-selection-toggle.spec.ts --trace on

# トレース表示
npx playwright show-trace test-results/.../trace.zip

# データベースクリーンアップ
npx dotenv-cli -e .env.local -- npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
await prisma.bookingReservation.deleteMany({ where: { tenantId: 'demo-booking' } });
await prisma.\$disconnect();
"

# シードデータ再投入
npx dotenv-cli -e .env.local -- npx tsx prisma/seed.ts
```

---

## 💡 学んだこと・Tips

### 1. Playwright非同期待機のベストプラクティス

**❌ 悪い例**:
```typescript
await page.waitForSelector('[data-testid="time-slot"]');
await page.click('[data-testid="time-slot"]:first-child');
```

**✅ 良い例**:
```typescript
const firstTimeSlot = page.locator('[data-testid="time-slot"]').first();
await firstTimeSlot.waitFor({ state: 'visible', timeout: 10000 });
await firstTimeSlot.click();
```

---

### 2. React状態更新とE2Eテストのタイミング

**問題**: React状態更新は非同期なので、クリック直後に状態を確認するとまだ更新されていない

**解決策**:
```typescript
// クリック
await button.click();

// 状態更新の完了を待つ（UIの変化で判断）
await expect(page.locator('[data-state="selected"]')).toBeVisible();

// または、一定時間待機（最終手段）
await page.waitForTimeout(500);
```

---

### 3. 機能フラグの非同期取得

**問題**: `useFeatureFlags()`は非同期でAPIから取得するため、初期レンダリング時は`null`

**テストでの対処**:
```typescript
// Page Objectメソッドを使う（内部でタイムアウト延長済み）
await bookingPage.expectStaffSelectVisible();

// または、直接タイムアウトを指定
await expect(page.locator('select#staff')).toBeVisible({ timeout: 10000 });
```

---

### 4. テストユーザー管理

**現在の実装**: ハードコードされたユーザーID
```typescript
'x-user-id': '550e8400-e29b-41d4-a716-446655440031'
```

**改善案**: テストフィクスチャ作成
```typescript
// test/fixtures/users.ts
export const testUsers = {
  customer: {
    id: '550e8400-e29b-41d4-a716-446655440031',
    email: 'yamada@example.com',
    name: '山田 太郎',
  },
};

// テストで使用
'x-user-id': testUsers.customer.id
```

---

## 🔄 継続的改善提案

### 1. テストデータ管理の改善

**提案**: テストごとに専用データを作成・削除
```typescript
let testData: {
  userId: string;
  menuId: string;
  staffId: string;
};

test.beforeEach(async () => {
  // テスト用データ作成
  testData = await createTestData();
});

test.afterEach(async () => {
  // テスト用データ削除
  await cleanupTestData(testData);
});
```

---

### 2. Page Objectの拡張

**追加推奨メソッド**:
```typescript
// BookingPage.ts
async selectTimeSlot(index: number = 0) {
  const timeSlot = this.page.locator('[data-testid="time-slot"]').nth(index);
  await timeSlot.waitFor({ state: 'visible', timeout: 10000 });
  await timeSlot.click();
  await this.page.waitForTimeout(500); // 状態更新待機
}

async waitForFormValid() {
  // 予約ボタンが有効になるまで待つ
  await expect(this.page.locator('[data-testid="submit-button"]'))
    .toBeEnabled({ timeout: 10000 });
}
```

---

### 3. デバッグヘルパー関数

**提案**:
```typescript
// test/helpers/debug.ts
export async function dumpFormState(page: Page) {
  const state = await page.evaluate(() => {
    const form = document.querySelector('form');
    return {
      selectedDate: form?.querySelector('[data-selected-date]')?.textContent,
      selectedTime: form?.querySelector('[data-selected-time]')?.textContent,
      selectedMenu: form?.querySelector('select#menu')?.value,
      submitDisabled: form?.querySelector('[data-testid="submit-button"]')?.hasAttribute('disabled'),
    };
  });
  console.log('📋 Form State:', state);
  return state;
}

// テストで使用
await dumpFormState(page);
```

---

## 📞 問い合わせ先

- **プロジェクト**: 予約管理システム
- **GitHub**: [portfolio-reserve](https://github.com/tailwind8/portfolio-reserve)
- **ブランチ**: `feature/staff-selection-toggle`
- **関連Issue**: #77, #78

---

## 🚨 重要な注意事項

### テスト実行前の準備

1. **データベースのクリーンアップ**
   ```bash
   npx dotenv-cli -e .env.local -- npx tsx -e "
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();
   await prisma.bookingReservation.deleteMany({ where: { tenantId: 'demo-booking' } });
   await prisma.\$disconnect();
   "
   ```

2. **シードデータの投入**
   ```bash
   npx dotenv-cli -e .env.local -- npx tsx prisma/seed.ts
   ```

3. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

---

## 📈 進捗トラッキング

### 完了した作業
- [x] Phase5デバッグドキュメント作成
- [x] ビルドエラー修正（dayOfWeek変数重複）
- [x] data属性追加（data-day, data-testid）
- [x] テストユーザーID修正
- [x] 時間スロットクリック処理改善
- [x] スタッフ選択待機処理追加
- [x] 予約ボタン有効化待機処理追加

### 未完了の作業
- [ ] **予約ボタンdisabled問題の解決**（最重要）
- [ ] 機能フラグOFF時の表示制御テスト修正
- [ ] データベースクリーンアップの実装
- [ ] Issue #78のE2Eテスト実行

---

**引き継ぎ日**: 2026-01-02 20:00
**次回作業者へ**: 上記「推奨デバッグ手順」から作業を開始してください。特に**Console Logデバッグ**が最も効果的だと考えられます。予約ボタンdisabled問題の根本原因を特定することが最優先です。

この問題は、フロントエンドの状態管理とPlaywrightの非同期処理のタイミング問題である可能性が高いです。焦らず、一つずつデバッグしていけば必ず解決できます。頑張ってください！🔥
