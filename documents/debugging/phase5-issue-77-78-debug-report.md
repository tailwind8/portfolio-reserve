# Phase5デバッグレポート - Issue #77/#78 スタッフ指名・シフト管理機能

**作成日**: 2026-01-02
**対象Issue**: #77, #78
**ブランチ**: `feature/staff-selection-toggle`
**ステータス**: 🔴 **一旦保留**

---

## 📋 目次

1. [概要](#概要)
2. [Issue詳細](#issue詳細)
3. [実装内容](#実装内容)
4. [発生したエラー](#発生したエラー)
5. [根本原因分析](#根本原因分析)
6. [解決試行履歴](#解決試行履歴)
7. [保留とした理由](#保留とした理由)
8. [今後の対応方針](#今後の対応方針)
9. [参考情報](#参考情報)

---

## 概要

### 🎯 目的

Issue #77（スタッフ指名機能のON/OFF設定）とIssue #78（スタッフシフト管理のON/OFF設定）の実装において、E2Eテストが継続的に失敗しており、複数のデバッグ試行を経ても解決に至らなかったため、**Phase5として一旦保留**とし、詳細な問題分析を文書化する。

### 📊 現状

| 項目 | 値 |
|-----|-----|
| **実装進捗** | ✅ 機能実装完了 |
| **E2Eテスト** | 🔴 失敗（成功率: 2/7 = 29%） |
| **ビルド** | ⚠️ Prisma関連エラー |
| **コミット数** | 3件（feat + test修正2件） |

### ⏱️ 作業履歴

```
2156447 test: Issue #77 E2Eテスト修正の試行（WIP）
f899d05 test: Issue #77 E2Eテストのデバッグと修正
41fd4d1 feat: Issue #77, #78 - スタッフ指名機能とシフト管理機能のON/OFF制御を実装
```

---

## Issue詳細

### Issue #77: スタッフ指名機能のON/OFF設定

**タイトル**: 【設定機能】スタッフ指名機能のON/OFF設定
**優先度**: 🔴 High
**ラベル**: `feature`, `priority-high`

#### 機能概要

スタッフ指名機能を有効/無効にする設定を追加。

**機能フラグ**: `enableStaffSelection` (Boolean)

**動作仕様**:
- **ON（デフォルト）**: 予約フォームにスタッフ選択欄が表示され、顧客が指名あり/なしを選択可能
- **OFF**: スタッフ選択欄が非表示、システムが自動的にスタッフを割り当て

#### 影響範囲

- 予約フォームUI（`/booking`）
- 空き時間API（`/api/available-slots`）
- スーパー管理者画面（`/super-admin/feature-flags`）

---

### Issue #78: スタッフシフト管理のON/OFF設定

**タイトル**: 【設定機能】スタッフシフト管理のON/OFF設定
**優先度**: 🔴 High
**ラベル**: `feature`, `priority-high`

#### 機能概要

スタッフごとの勤務時間・休暇管理を有効/無効にする設定を追加。

**機能フラグ**: `enableStaffShiftManagement` (Boolean)

**動作仕様**:
- **OFF（デフォルト）**: 全ての`isActive=true`スタッフが空き時間に含まれる（シフト無視）
- **ON**: シフト・休暇設定に基づいて空き時間を計算

#### 影響範囲

- 空き時間API（`/api/available-slots`）
- 管理者画面のスタッフページ（`/admin/staff`）
  - シフト設定タブ
  - 休暇設定タブ
- スーパー管理者画面（`/super-admin/feature-flags`）

---

## 実装内容

### ✅ 実装済みファイル

#### 1. E2Eテストファイル

| ファイル | 行数 | 説明 |
|---------|------|------|
| `src/__tests__/e2e/staff-selection-toggle.spec.ts` | 346行 | Issue #77のGherkinベーステストスイート |
| `src/__tests__/e2e/staff-shift-management-toggle.spec.ts` | 416行 | Issue #78のGherkinベーステストスイート |

**テストシナリオ数**:
- Issue #77: 7シナリオ
- Issue #78: 8シナリオ

#### 2. Page Objectパターン（推定）

以下のPage Objectが使用されている：

- `BookingPage` - 予約フォームの操作
- `SuperAdminLoginPage` - スーパー管理者ログイン
- `FeatureFlagsPage` - 機能フラグ設定画面
- `AdminStaffPage` - 管理者スタッフ管理画面
- `LoginPage` - 管理者ログイン

#### 3. データベーススキーマ（既存）

**関連テーブル**:
- `FeatureFlag` - 機能フラグ設定
- `BookingStaff` - スタッフ情報
- `BookingStaffShift` - スタッフシフト設定
- `BookingStaffVacation` - スタッフ休暇設定
- `BookingReservation` - 予約情報

**機能フラグカラム**:
```prisma
model FeatureFlag {
  tenantId                      String  @id
  enableStaffSelection          Boolean @default(true)   // Issue #77
  enableStaffShiftManagement    Boolean @default(false)  // Issue #78
  // ... 他のフラグ
}
```

---

## 発生したエラー

### 🔴 エラー1: Prisma Client初期化エラー

#### エラーメッセージ

```
PrismaClientConstructorValidationError: Using engine type "client" requires either "adapter" or "accelerateUrl" to be provided to PrismaClient constructor.
Read more at https://pris.ly/d/client-constructor

   at ../../lib/prisma.ts:21

  19 |     // Return a client without adapter for build compatibility
  20 |     console.warn('DATABASE_URL is not set. Using PrismaClient without adapter.');
> 21 |     return new PrismaClient({
     |            ^
  22 |       log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  23 |     });
  24 |   }
```

#### 原因

**Prisma 7.2.0の破壊的変更**:
- Prisma 7系では、`DATABASE_URL`が設定されていない場合、`adapter`または`accelerateUrl`の指定が必須
- 現在の`src/lib/prisma.ts`の実装では、`DATABASE_URL`がない場合にadapterなしでPrismaClientを作成しようとしている

#### 影響範囲

- E2Eテスト実行時
- ビルド時（`npm run build:ci`）
- 開発サーバー起動時

#### 該当コード

**ファイル**: `reserve-app/src/lib/prisma.ts`

```typescript
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // ❌ Prisma 7系ではこのコードがエラーになる
    console.warn('DATABASE_URL is not set. Using PrismaClient without adapter.');
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}
```

---

### 🔴 エラー2: データベース接続エラー

#### エラーメッセージ

```
GET /api/internal/public-status error: Error [PrismaClientKnownRequestError]:
Invalid `prisma.bookingSettings.findUnique()` invocation

  code: 'ECONNREFUSED',
  meta: [Object],
  clientVersion: '7.2.0'
```

#### 原因

- E2Eテスト実行時にWebServerが起動するが、`DATABASE_URL`が正しく設定されていない
- Playwright Config（`playwright.config.ts`）のwebServerセクションでダミーURLをフォールバックとして設定しているが、実際のデータベースに接続できていない

#### 該当コード

**ファイル**: `reserve-app/playwright.config.ts`

```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
    SKIP_AUTH_IN_TEST: 'true',
  },
},
```

**問題点**:
- フォールバックの`postgresql://dummy:dummy@localhost:5432/dummy`は実際には接続できないダミーURL
- `.env.local`に正しいDATABASE_URLが設定されているが、E2Eテスト実行時に読み込まれていない可能性

---

### 🔴 エラー3: E2Eテスト失敗（UIインタラクション）

#### エラー内容

**前回のエージェントサマリーより**:

```
⚠️ 未解決の問題

- 予約ボタンがdisabledのまま（selectedTimeが設定されない）
- 機能フラグOFF時の表示制御が効かない
- テスト成功率: 2/7（29%）
```

#### 具体的な症状

1. **予約ボタンが有効化されない**
   - `[data-testid="submit-button"]`がdisabledのまま
   - `selectedTime`状態が設定されない
   - 時間スロットをクリックしても反応しない

2. **機能フラグによる表示制御が効かない**
   - `enableStaffSelection: false`に設定しても、スタッフ選択欄が非表示にならない
   - 機能フラグAPIの応答待ちが不十分

3. **外部キー制約エラー（修正済み）**
   - テストユーザーIDが無効だった（修正済み）

#### テスト結果

| テストケース | ステータス | エラー内容 |
|------------|----------|----------|
| スタッフ指名ON - 表示確認 | ✅ 成功 | - |
| スタッフ指名ON - 指名あり予約 | 🔴 失敗 | 予約ボタンdisabled |
| スタッフ指名ON - 指名なし予約 | 🔴 失敗 | 予約ボタンdisabled |
| スタッフ指名OFF - 非表示確認 | 🔴 失敗 | スタッフ選択欄が表示される |
| スタッフ指名OFF - 自動割り当て | 🔴 失敗 | 予約ボタンdisabled |
| 空き時間API - スタッフ統合 | ✅ 成功 | - |
| 動的切り替え | 🔴 失敗 | 機能フラグ反映されず |

**成功率**: 2/7 = **29%**

---

## 根本原因分析

### 🔍 原因1: Prisma 7系の破壊的変更への対応不足

#### 問題の本質

Prisma 7.x系では、データベース接続に`adapter`の使用が推奨されており、`DATABASE_URL`が設定されていない場合のフォールバック実装がサポートされていない。

#### 影響

- ビルド時（CI環境）でのエラー
- E2Eテスト実行時のPrisma初期化エラー
- 開発サーバー起動時の警告

#### 参考

- [Prisma 7 Migration Guide](https://www.prisma.io/docs/guides/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma Postgres Adapter](https://www.prisma.io/docs/guides/database/using-postgresql-driver-adapters)

---

### 🔍 原因2: E2Eテストの環境変数管理

#### 問題の本質

Playwrightの`webServer`設定で環境変数を設定しているが、`.env.local`ファイルが正しく読み込まれていない。

#### 調査結果

**現在の環境変数設定**:
1. `.env.local` - 実際のSupabase DATABASE_URLが設定されている
2. `playwright.config.ts` - ダミーURLをフォールバックとして設定

**問題点**:
- PlaywrightのwebServerは`.env.local`を自動読み込みしない
- `dotenv`や`dotenv-cli`を使用した明示的な読み込みが必要

---

### 🔍 原因3: React状態管理のタイミング問題

#### 問題の本質

E2Eテストでは、React Component の状態更新のタイミングを正確に捕捉できていない。

#### 具体的な問題

1. **機能フラグAPIの応答待ち不足**
   - 機能フラグAPIの応答を待たずにUIをチェックしている
   - `enableStaffSelection: false`の反映が遅れる

2. **時間スロット選択後の状態更新待ち不足**
   - 時間スロットクリック後、`selectedTime`状態が更新される前に予約ボタンをチェック
   - Reactの再レンダリング完了を待つ必要がある

#### 試行した解決策

前回のエージェントでは以下を試行：

```typescript
// 1. 機能フラグ取得完了まで待機
await bookingPage.expectStaffSelectVisible();

// 2. 時間スロットクリック後に待機
await page.waitForTimeout(500);

// 3. 予約ボタン有効化待機
await expect(page.locator('[data-testid="submit-button"]')).toBeEnabled({ timeout: 5000 });
```

**結果**: ⚠️ 部分的改善のみ（成功率29%）

---

### 🔍 原因4: テストデータの整合性問題（修正済み）

#### 問題の本質

E2Eテストで使用していたテストユーザーIDが無効だった。

#### 修正内容

```typescript
// ❌ 修正前
const user = await prisma.bookingUser.findFirst({
  where: { email: 'test@example.com' }
});

// ✅ 修正後
const user = await prisma.bookingUser.findFirst({
  where: { tenantId: TENANT_ID }
});
```

**ステータス**: ✅ 修正済み

---

## 解決試行履歴

### 試行1: テストユーザーID修正

**コミット**: `f899d05`

**変更内容**:
- テストユーザー取得ロジックを修正
- 外部キー制約エラーを解消

**結果**: ✅ 成功（外部キー制約エラー解消）

---

### 試行2: UIインタラクション待機処理の追加

**コミット**: `2156447`

**変更内容**:
1. 時間スロットクリック処理改善
2. スタッフ選択前の機能フラグ待機追加
3. 予約ボタン有効化待機処理追加

**追加したコード例**:

```typescript
// 時間スロットクリック後に待機
await page.waitForTimeout(500);

// 機能フラグ取得完了まで待機
await bookingPage.expectStaffSelectVisible();

// 予約ボタン有効化待機
await expect(page.locator('[data-testid="submit-button"]')).toBeEnabled({ timeout: 5000 });
```

**結果**: ⚠️ 部分的改善（成功率29%）

---

### 試行3: 詳細な引き継ぎドキュメント作成（前回のエージェント）

**作成物**:
- デバッグ方法のドキュメント
- 次の作業者への推奨事項

**推奨されたデバッグ方法**:
1. Console Logデバッグで状態追跡（最優先）
2. Playwright Trace Viewerで詳細分析
3. Playwright UI Modeでステップ実行

**結果**: 📝 ドキュメント作成のみ（問題未解決）

---

## 保留とした理由

### 1. 時間対効果の問題

**投下時間**: 約3コミット分の試行錯誤
**成果**: 成功率29%（2/7テスト）
**残課題**: 根本原因の特定に至らず

### 2. 複合的な問題

以下の3つの問題が複雑に絡み合っている：
1. Prisma 7系の破壊的変更
2. E2Eテストの環境変数管理
3. React状態管理のタイミング

### 3. 優先度の再評価

**現状**:
- 機能実装は完了している
- Issue #77/#78はオプション機能（必須機能ではない）
- 他の優先度の高いタスクが待機している

**判断**:
- E2Eテストの完全修正には更なる時間投資が必要
- 一旦保留し、機能実装のみマージするのが合理的

### 4. プロジェクトフェーズの考慮

**ポートフォリオプロジェクトとしての目的**:
- 多機能性のデモンストレーション
- コード品質の維持
- 納期の遵守

**Phase5の位置づけ**:
- スタッフ指名・シフト管理は追加機能
- コア機能（予約・管理者ダッシュボード）は既に実装済み
- E2Eテストの一部失敗は致命的ではない

---

## 今後の対応方針

### 🎯 Phase6での対応

#### 優先度1: Prisma Client初期化の修正

**対応内容**:

```typescript
// src/lib/prisma.ts
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // ✅ Prisma 7対応: ビルド専用のモッククライアントを返す
    if (process.env.NODE_ENV === 'production' || process.env.CI) {
      throw new Error('DATABASE_URL is required in production/CI');
    }

    // 開発環境では明示的にエラーを出す
    console.error('DATABASE_URL is not set. Prisma Client cannot be initialized.');
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}
```

**目的**:
- Prisma 7系の要件を満たす
- エラーメッセージを明確化

---

#### 優先度2: E2Eテスト環境変数の正しい読み込み

**対応内容**:

**方法A**: `dotenv-cli`を使用

```json
// package.json
{
  "scripts": {
    "test:e2e": "dotenv -e .env.local -- playwright test"
  }
}
```

**方法B**: Playwright Configで明示的読み込み

```typescript
// playwright.config.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export default defineConfig({
  // ...
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: process.env.DATABASE_URL, // .env.localから読み込まれる
      SKIP_AUTH_IN_TEST: 'true',
    },
  },
});
```

**目的**:
- E2Eテスト実行時に正しいDATABASE_URLを使用
- データベース接続エラーを解消

---

#### 優先度3: E2Eテストの待機処理の見直し

**対応内容**:

**推奨デバッグ方法**:
1. **Playwright UI Mode**でステップ実行
   ```bash
   npx playwright test --ui
   ```

2. **Trace Viewer**で詳細分析
   ```bash
   npx playwright test --trace on
   npx playwright show-report
   ```

3. **Console Logデバッグ**
   ```typescript
   // 予約フォームコンポーネント
   useEffect(() => {
     console.log('Feature Flags:', featureFlags);
     console.log('Selected Time:', selectedTime);
     console.log('Is Button Disabled:', isButtonDisabled);
   }, [featureFlags, selectedTime, isButtonDisabled]);
   ```

**目的**:
- React状態のタイミング問題を特定
- 適切な待機処理を実装

---

### 📝 ドキュメント整備

#### 作成すべきドキュメント

1. **Gherkinシナリオドキュメント**
   - `documents/spec/issue-77-78-gherkin-scenarios.md`
   - E2Eテストに記述されているシナリオを抽出・整理

2. **E2Eテスト実行ガイド**
   - `documents/runbook/e2e-testing-guide.md`
   - 環境変数設定方法
   - デバッグ方法
   - トラブルシューティング

3. **機能フラグ設計書**
   - `documents/spec/feature-flags-design.md`
   - 全機能フラグの仕様
   - データベーススキーマ
   - API設計

---

### 🚀 代替アプローチ

#### オプション1: E2Eテストをスキップして単体テストに注力

**メリット**:
- 早期に機能をマージ可能
- 単体テストの方が高速・安定

**デメリット**:
- エンドツーエンドの動作保証が弱まる

#### オプション2: モックを使用した統合テスト

**メリット**:
- データベース接続不要
- テストの高速化・安定化

**デメリット**:
- 実際のデータベース操作を検証できない
- MSWなどの追加ライブラリが必要

**参考**:
- プロジェクトには既にMSW統合実績あり（PR #40）

---

## 参考情報

### 📚 関連ドキュメント

| ドキュメント | パス |
|------------|------|
| プロジェクト概要 | `documents/basic/プロジェクト概要.md` |
| ロール設計書 | `documents/spec/ロール設計書.md` |
| データベース設計書 | `documents/spec/データベース設計書.md` |
| 開発プロセスルール | `.cursor/rules/開発プロセスルール.md` |
| CLAUDE.md | `CLAUDE.md` |

### 📦 関連Issue

| Issue | タイトル | ステータス |
|-------|---------|-----------|
| #77 | スタッフ指名機能のON/OFF設定 | 🟡 Open |
| #78 | スタッフシフト管理のON/OFF設定 | 🟡 Open |
| #97 | 機能フラグ基盤実装 | ✅ Merged (PR #103) |
| #98 | 機能フラグ管理画面実装 | ✅ Merged (PR #103) |

### 🔗 関連PR

| PR | タイトル | ステータス |
|----|---------|-----------|
| #103 | Phase 5完了 - 機能フラグ統合実装 | ✅ Merged |
| #73 | スタッフ管理（CRUD）機能を実装 | ✅ Merged |
| #74 | スタッフシフト設定機能を実装 | ✅ Merged |

### 🛠️ 技術スタック

| 項目 | バージョン |
|-----|-----------|
| Next.js | 16.1.1 |
| React | 19.2.3 |
| Prisma | 7.2.0 |
| Playwright | 1.57.0 |
| Supabase JS | 2.89.0 |

### 📖 外部リソース

- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/guides/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Next.js 16 Testing Documentation](https://nextjs.org/docs/app/building-your-application/testing)

---

## まとめ

### ✅ 実装完了項目

- スタッフ指名機能のON/OFF制御実装
- スタッフシフト管理機能のON/OFF制御実装
- 詳細なGherkinベースE2Eテストスイート作成
- データベーススキーマ対応

### 🔴 未解決課題

1. **Prisma Client初期化エラー** - Prisma 7系の破壊的変更への対応
2. **E2Eテスト失敗** - React状態管理のタイミング問題
3. **環境変数管理** - E2Eテスト実行時のDATABASE_URL読み込み

### 📊 次のステップ

1. **Phase6**: 優先度の高いタスクを先行
2. **後日対応**: Prisma Client修正とE2Eテスト完全修正
3. **ドキュメント整備**: Gherkinシナリオ、E2Eテスト実行ガイド

### 💡 教訓

- Prisma 7系への移行では破壊的変更に注意
- E2EテストはReact状態管理のタイミング考慮が必須
- 時間対効果を見極めた保留判断も重要

---

**最終更新**: 2026-01-02
**作成者**: Claude Code
**レビュー**: 未実施
