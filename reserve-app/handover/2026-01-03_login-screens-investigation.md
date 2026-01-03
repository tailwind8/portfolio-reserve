# 引き継ぎドキュメント - ログイン画面の実装状況調査

**作成日**: 2026-01-03
**担当**: Claude Code
**作業時間**: 約2時間
**進捗**: 調査完了・実装未着手

---

## 📋 作業概要

E2E認証環境変数の実装確認中に、ログイン画面の設計と実装に重大なギャップがあることを発見しました。
ユーザーからの要件「3つのログイン画面が必要（/login、/admin/login、/super-admin/login）」に対して、現在の実装では`/admin/login`ページが存在せず、E2Eテストと実装が乖離しています。

### 対応したIssue/タスク

- ✅ E2E認証環境変数の動作確認（調査完了）
- ⚠️ ログイン画面の設計書と実装のギャップ調査（完了）
- ❌ `/admin/login`ページの実装（未着手）
- ❌ ロール別リダイレクトの実装（未着手）
- ❌ **Supabaseテスト用ユーザーの登録**（最優先・未着手）

---

## 🚨 発見した3つの重大な問題

### 問題1: `/admin/login` ページが存在しない（404エラー）

**現状**:
- 存在するログイン画面: `/login` と `/super-admin/login` のみ
- `/admin/login` にアクセスすると **404 Page Not Found**

**問題の影響範囲**:

1. **UIに存在しないページへのリンク**:
   - `src/app/login/page.tsx:240` - 「管理者ログインはこちら →」リンクが404に遷移
   ```typescript
   <Link href="/admin/login" className="text-sm text-blue-500 hover:text-blue-600">
     管理者ログインはこちら →
   </Link>
   ```

2. **6つのE2Eテストが失敗**:
   以下のE2Eテストファイルが`/admin/login`を参照しており、全て404エラーで失敗します。
   - `src/__tests__/e2e/admin-weekly-calendar.spec.ts:24`
   - `src/__tests__/e2e/boundary-values.spec.ts`
   - `src/__tests__/e2e/session-management.spec.ts`
   - `src/__tests__/e2e/status-transition.spec.ts`
   - `src/__tests__/e2e/xss-csrf.spec.ts`
   - `src/__tests__/e2e/network-errors.spec.ts`

**エラーメッセージ**:
```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
Call log:
  - waiting for navigation to "/admin/dashboard" until "load"
  - navigated to "http://localhost:3000/admin/login"
  - HTTP 404 Not Found
```

**スクリーンショット証拠**:
- PlaywrightのスクリーンショットでNext.js標準の404ページを確認済み

---

### 問題2: `/login` のロール別リダイレクトが未実装

**設計書の要件**（`documents/spec/ロール設計書.md:219-231`）:
```
CUSTOMER / ADMIN
ユーザー → /login → Supabase Auth認証
         ↓
         成功
         ↓
BookingUser取得（Prisma）
         ↓
    role確認
         ↓
  CUSTOMER → /mypage へリダイレクト
  ADMIN    → /admin/dashboard へリダイレクト
```

**現在の実装**（`src/app/login/page.tsx:94`）:
```typescript
// ログイン成功後、全ユーザーが "/" にリダイレクト
router.push('/');
```

**問題点**:
- ユーザーのロール（CUSTOMER/ADMIN）を判定していない
- 全ユーザーが`/`（トップページ）にリダイレクトされる
- ADMINユーザーが`/admin/dashboard`に自動遷移しない

**影響**:
- ADMINユーザーがログイン後に手動で`/admin/dashboard`に移動する必要がある
- UXが設計書の意図と異なる

---

### 問題3: ⚠️ **最重要** - テスト用認証情報がSupabaseに存在しない

**エラーメッセージ**:
```
Supabase Auth error: Error [AuthApiError]: Invalid login credentials
    at AuthError.from (/Users/a-aoki/indivisual/2026/portfolio/reserve-system/reserve-app/node_modules/@supabase/gotrue-js/src/lib/errors.ts:72:5)
    ...
Error {
  name: 'AuthApiError',
  code: 'invalid_credentials',
  status: 400
}
```

**原因**:
`.env.local`に記載されている管理者アカウントがSupabaseに登録されていない。
```bash
E2E_ADMIN_EMAIL=admin@example.com
E2E_ADMIN_PASSWORD=Us%8d.a&-xTxE5T
```

**影響**:
- **全てのE2Eテストが認証で失敗**
- `admin-weekly-calendar.spec.ts`、`boundary-values.spec.ts` など6つのテストが動作不可
- 問題1と問題2を解決しても、この問題が残る限りテストは通過しない

**緊急度**: 🔴 **最優先で解決が必要**

このユーザーを作成しない限り、どのE2Eテストも通過できません。

---

## 📖 設計書と実装のギャップ整理

### 設計書の意図（`documents/spec/ロール設計書.md`）

| 項目 | 設計 |
|------|------|
| **ログイン画面数** | **2つ** |
| **CUSTOMER/ADMIN** | `/login` で共用（ロール別リダイレクト） |
| **SUPER_ADMIN** | `/super-admin/login` で独立 |

**設計の根拠**:
- CUSTOMER/ADMINは同じSupabase Authテーブルを使用
- ログイン後にPrismaで`BookingUser`のロールを取得して分岐
- SUPER_ADMINは開発者専用で別認証フロー

### 現在の実装状況

| 項目 | 実装 | 問題 |
|------|------|------|
| **ログイン画面数** | **2つ** `/login`, `/super-admin/login` | `/admin/login`へのリンクあり（404） |
| **CUSTOMER/ADMIN** | `/login` で共用 | ロール別リダイレクト**未実装** |
| **SUPER_ADMIN** | `/super-admin/login` ✅ | 正常動作 |

### ユーザー要件との相違

**ユーザー要件**:
> 「ログイン画面が3つ必要だよね。/loginと/admin/loginと /super-admin/login の3つが必要と思われる。資料などでそうなっているか確認して。」

**調査結果**:
- 設計書: **2つ**のログイン画面（CUSTOMER/ADMIN共用 + SUPER_ADMIN独立）
- 実装: **2つ**のログイン画面（但し`/admin/login`へのリンクあり）
- E2Eテスト: **3つ**のログイン画面を前提（6つのテストが`/admin/login`を参照）
- ユーザー期待: **3つ**のログイン画面

**結論**:
設計書と実装が一致しているが、E2Eテストとユーザー期待は**3つ**のログイン画面を前提としている。

---

## 🔧 提案する解決方針

### ✅ Option 1（推奨）: 3つのログイン画面を作成

**理由**:
1. ✅ ユーザーの明示的な要件（「3つ必要」）に合致
2. ✅ 既存の6つのE2Eテストがそのまま動作（修正不要）
3. ✅ UIのリンク（`/admin/login`）との整合性が取れる
4. ✅ ユーザーにとって分かりやすい（CUSTOMER/ADMINで別画面）

**作業内容**:

#### タスク1: Supabaseにテスト用管理者ユーザーを登録 🔴 **最優先**

**推定時間**: 15分

**手順**:
1. Supabase ダッシュボードにアクセス
2. Authentication → Users → Add User
3. 以下の情報で登録:
   - Email: `admin@example.com`
   - Password: `Us%8d.a&-xTxE5T`
   - Confirm Password: `Us%8d.a&-xTxE5T`
4. `booking_users`テーブルにレコード追加（`role: 'ADMIN'`）

**または**、Next.jsアプリ経由で登録:
```bash
# 開発サーバー起動
cd reserve-app
npm run dev

# ブラウザで http://localhost:3000/register にアクセス
# admin@example.com で登録後、DBで role を 'ADMIN' に変更
```

**検証方法**:
```bash
# E2Eテスト実行
npm run test:e2e -- admin-weekly-calendar.spec.ts

# ログインに成功すれば OK
```

---

#### タスク2: `/admin/login` ページを作成

**推定時間**: 1時間

**ディレクトリ構造**:
```
reserve-app/src/app/
├── login/              # CUSTOMER用（既存）
│   └── page.tsx
├── admin/
│   ├── login/          # ADMIN用（新規作成）
│   │   └── page.tsx
│   └── dashboard/
│       └── page.tsx
└── super-admin/
    └── login/          # SUPER_ADMIN用（既存）
        └── page.tsx
```

**実装方針**:
`/super-admin/login/page.tsx` をベースにコピー&修正

**主な変更点**:
1. ログイン成功後のリダイレクト先: `/admin/dashboard`
2. APIエンドポイント: `/api/auth/admin-login` または共通の `/api/auth/login`
3. ページタイトル: 「管理者ログイン」

**参考ファイル**:
- `src/app/super-admin/login/page.tsx:1-250` - ベーステンプレート

**Gherkinシナリオ** (オプション):
```gherkin
# features/admin/login.feature
Feature: 管理者ログイン
  管理者が専用ログイン画面からログインできる

  Scenario: 管理者が /admin/login からログインする
    Given 管理者ログインページ "/admin/login" にアクセスする
    When メールアドレス "admin@example.com" を入力する
    And パスワード "Us%8d.a&-xTxE5T" を入力する
    And ログインボタンをクリックする
    Then "/admin/dashboard" にリダイレクトされる
```

---

#### タスク3: `/login` ページのリンクを修正（オプション）

**推定時間**: 5分

**ファイル**: `src/app/login/page.tsx:240`

**修正内容**:
リンクはそのまま維持（`/admin/login`が作成されるため）

または、説明テキストを追加:
```typescript
<div className="mt-4 text-center">
  <p className="text-sm text-gray-600">管理者の方はこちら</p>
  <Link href="/admin/login" className="text-sm text-blue-500 hover:text-blue-600">
    管理者ログイン →
  </Link>
</div>
```

---

#### タスク4: E2Eテストを実行して検証

**推定時間**: 30分

**コマンド**:
```bash
# 6つのE2Eテストを実行
npm run test:e2e -- admin-weekly-calendar.spec.ts
npm run test:e2e -- boundary-values.spec.ts
npm run test:e2e -- session-management.spec.ts
npm run test:e2e -- status-transition.spec.ts
npm run test:e2e -- xss-csrf.spec.ts
npm run test:e2e -- network-errors.spec.ts
```

**期待結果**:
- 全テストが `/admin/login` に正常にアクセス
- ログイン処理が成功
- `/admin/dashboard` にリダイレクト

---

### Option 2: 設計書通り2つの画面で実装

**理由**:
- 設計書の意図に忠実
- ロール別リダイレクトで柔軟な運用

**作業内容**:

#### タスク1: Supabaseにテスト用管理者ユーザーを登録 🔴 **最優先**

（Option 1と同じ）

#### タスク2: `/login` にロール別リダイレクト機能を追加

**推定時間**: 2時間

**ファイル**: `src/app/login/page.tsx:80-100`

**実装例**:
```typescript
// ログイン成功後
const { data: { session } } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (!session) {
  setError('ログインに失敗しました');
  return;
}

// BookingUserを取得してロールを確認
const response = await fetch('/api/users/me');
const { data: user } = await response.json();

if (user.role === 'ADMIN') {
  router.push('/admin/dashboard');
} else if (user.role === 'CUSTOMER') {
  router.push('/mypage');
} else {
  router.push('/');
}
```

**必要なAPI**: `/api/users/me` - 現在のユーザー情報を取得

#### タスク3: UIのリンクを削除

**ファイル**: `src/app/login/page.tsx:240`

**修正**:
```typescript
// 削除
<Link href="/admin/login" className="text-sm text-blue-500 hover:text-blue-600">
  管理者ログインはこちら →
</Link>
```

#### タスク4: 6つのE2Eテストを修正

**推定時間**: 1時間

**修正内容**:
全てのE2Eテストで`/admin/login` → `/login` に変更

**例** (`admin-weekly-calendar.spec.ts:24`):
```typescript
// Before
await loginPage.goto('/admin/login');

// After
await loginPage.goto('/login');
// または
await loginPage.goto(); // デフォルトが /login
```

**影響範囲**:
- `admin-weekly-calendar.spec.ts`
- `boundary-values.spec.ts`
- `session-management.spec.ts`
- `status-transition.spec.ts`
- `xss-csrf.spec.ts`
- `network-errors.spec.ts`

---

## 📊 Option比較表

| 項目 | Option 1（推奨） | Option 2 |
|------|-----------------|---------|
| **ログイン画面数** | 3つ | 2つ |
| **ユーザー要件** | ✅ 合致 | ❌ 不一致 |
| **設計書** | ⚠️ 要更新 | ✅ 合致 |
| **E2Eテスト修正** | ✅ 不要 | ❌ 6ファイル修正 |
| **UIリンク修正** | ✅ 不要 | ❌ 削除が必要 |
| **推定作業時間** | 2時間 | 3.5時間 |
| **リスク** | 低 | 中（テスト修正漏れ） |

**推奨**: **Option 1** - ユーザー要件に合致し、既存コードへの影響が最小

---

## 📂 関連ファイル一覧

### 修正が必要なファイル（Option 1の場合）

#### 新規作成
- `src/app/admin/login/page.tsx` - 管理者ログイン画面（新規）

#### 既存ファイル（参考）
- `src/app/login/page.tsx:240` - CUSTOMERログイン画面（リンク確認）
- `src/app/super-admin/login/page.tsx` - SUPER_ADMINログイン画面（テンプレート）
- `src/__tests__/e2e/pages/LoginPage.ts` - Page Object（動作確認）

### 影響を受けるE2Eテストファイル（Option 1では修正不要）

- `src/__tests__/e2e/admin-weekly-calendar.spec.ts:24`
- `src/__tests__/e2e/boundary-values.spec.ts`
- `src/__tests__/e2e/session-management.spec.ts`
- `src/__tests__/e2e/status-transition.spec.ts`
- `src/__tests__/e2e/xss-csrf.spec.ts`
- `src/__tests__/e2e/network-errors.spec.ts`

### 参照すべき設計書

- `documents/spec/ロール設計書.md:219-231` - ログイン画面の設計意図
- `documents/handover/2026-01-03_e2e-auth-env-vars.md` - E2E認証環境変数の実装

---

## 🚀 次のステップ（優先順位順）

### ステップ1: 🔴 **最優先** - Supabaseにテスト用ユーザーを登録

**推定時間**: 15分

**重要度**: 🔴 **CRITICAL**

このステップを完了しない限り、どのE2Eテストも通過できません。

**手順**:
1. Supabase ダッシュボード → Authentication → Users
2. Add User: `admin@example.com` / `Us%8d.a&-xTxE5T`
3. `booking_users` テーブルに `role: 'ADMIN'` のレコード追加

**検証**:
```bash
# ログインテスト
npm run test:e2e -- admin-weekly-calendar.spec.ts --grep "管理者でログイン"
```

---

### ステップ2: Option選択とユーザー確認

**推定時間**: 5分（ユーザーとのコミュニケーション）

**質問内容**:
- Option 1（3つの画面）とOption 2（2つの画面）のどちらで進めるか？
- 設計書の更新は必要か？

**推奨回答**: Option 1（ユーザー要件に合致、作業時間も短い）

---

### ステップ3: `/admin/login` ページの作成（Option 1の場合）

**推定時間**: 1時間

**タスク**:
1. `src/app/admin/login/page.tsx` を作成
2. `/super-admin/login/page.tsx` をベースに修正
3. リダイレクト先を `/admin/dashboard` に変更

**検証**:
```bash
npm run dev
# ブラウザで http://localhost:3000/admin/login にアクセス
# admin@example.com でログイン → /admin/dashboard に遷移することを確認
```

---

### ステップ4: E2Eテスト全体を実行

**推定時間**: 30分

**コマンド**:
```bash
# 全E2Eテストを実行
npm run test:e2e

# 特に以下の6つが通過することを確認
npm run test:e2e -- --grep "admin"
```

**期待結果**:
- 6つのE2Eテストが全て通過
- 404エラーが発生しない
- ログイン処理が成功

---

### ステップ5: 設計書の更新（Option 1の場合）

**推定時間**: 30分

**ファイル**: `documents/spec/ロール設計書.md:219-231`

**修正内容**:
```markdown
#### CUSTOMER
ユーザー → /login → Supabase Auth認証 → /mypage

#### ADMIN
管理者 → /admin/login → Supabase Auth認証 → /admin/dashboard

#### SUPER_ADMIN
開発者 → /super-admin/login → Supabase Auth認証 → /super-admin/dashboard
```

---

### ステップ6: Issue #108の完了確認とクローズ

**推定時間**: 15分

**確認項目**:
- ✅ E2E認証環境変数が動作している
- ✅ 管理者向け週間カレンダーのE2Eテストが通過
- ✅ ログイン画面の問題が解決

**コマンド**:
```bash
# Issue #108関連のE2Eテストを実行
npm run test:e2e -- admin-weekly-calendar.spec.ts
```

**Issueクローズ手順**:
```bash
# GitHub CLI でクローズ
gh issue close 108 --comment "E2E認証環境変数の動作確認完了。ログイン画面の問題も解決しました。"
```

---

## 💡 学んだこと・注意点

### 1. 設計書とE2Eテストの乖離リスク

**教訓**:
- E2Eテストが`/admin/login`を参照しているのに、設計書では2つの画面を想定
- **実装前にE2Eテストと設計書の整合性を確認する**ことが重要

**対策**:
- 設計書更新時にE2Eテストも確認
- E2Eテスト実装時に設計書を参照

### 2. テストデータの事前準備の重要性

**教訓**:
- `.env.local`に認証情報があっても、Supabaseに実ユーザーが存在しないとテスト失敗
- **テスト用データは実装前に準備**する

**対策**:
- E2Eテスト実装時にテストデータ作成手順を明記
- Supabaseのシードスクリプトでテストユーザーを自動作成

### 3. Page Object Patternの `goto()` メソッド

**注意点**:
```typescript
// LoginPage.ts
async goto(path = '/login') {
  await this.page.goto(path);
}
```
- デフォルト引数が `/login` なので、`await loginPage.goto()` は `/login` に遷移
- `/admin/login` に遷移したい場合は明示的に `await loginPage.goto('/admin/login')`

**ベストプラクティス**:
```typescript
// 明示的なメソッドを用意
async gotoCustomerLogin() {
  await this.page.goto('/login');
}

async gotoAdminLogin() {
  await this.page.goto('/admin/login');
}

async gotoSuperAdminLogin() {
  await this.page.goto('/super-admin/login');
}
```

### 4. 404エラーのデバッグ

**手順**:
1. ブラウザでURLに直接アクセス（http://localhost:3000/admin/login）
2. Next.js 404ページが表示されるか確認
3. `src/app/` ディレクトリ構造を確認（`admin/login/page.tsx` が存在するか）
4. ファイル名のtypo確認（`page.tsx` vs `Page.tsx`）

---

## 🔍 デバッグ方法

### Supabaseのユーザー確認

```bash
# Supabase ダッシュボード
# → Authentication → Users
# → admin@example.com が存在するか確認

# または、Prismaで確認
npx prisma studio
# → booking_users テーブルで email = 'admin@example.com' を検索
```

### E2Eテストのデバッグ

```bash
# UIモードで実行（ブラウザで動作を確認）
npm run test:e2e -- --ui admin-weekly-calendar.spec.ts

# ヘッドモードで実行（ブラウザを表示）
npm run test:e2e -- --headed admin-weekly-calendar.spec.ts

# スクリーンショットを確認
ls -la reserve-app/playwright-report/
```

### ログイン処理のデバッグ

```typescript
// src/app/admin/login/page.tsx
console.log('[DEBUG] Login attempt:', { email, password: '***' });

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

console.log('[DEBUG] Supabase response:', { data, error });

if (error) {
  console.error('[ERROR] Login failed:', error.message, error.code);
}
```

---

## 📞 質問・相談先

- **仕様確認**: ユーザーに Option 1/2 の選択を確認
- **設計書更新**: ロール設計書の更新要否を確認
- **Supabaseアクセス**: テストユーザー登録の権限確認
- **コードレビュー**: `/admin/login` ページ実装後にPR作成

---

## ✅ チェックリスト

### 緊急対応（最優先）
- [ ] Supabaseにテストユーザー（admin@example.com）を登録
- [ ] `booking_users` テーブルに `role: 'ADMIN'` レコードを追加
- [ ] E2Eテストで認証が成功することを確認

### Option 1（推奨）の場合
- [ ] ユーザーに Option 1 で進めることを確認
- [ ] `/admin/login/page.tsx` を作成（`/super-admin/login` をベース）
- [ ] ブラウザで `/admin/login` にアクセスして404が解消されることを確認
- [ ] admin@example.com でログインして `/admin/dashboard` に遷移することを確認
- [ ] 6つのE2Eテストを実行して全て通過することを確認
- [ ] 設計書（`ロール設計書.md`）を更新
- [ ] Issue #108 をクローズ

### Option 2 の場合
- [ ] ユーザーに Option 2 で進めることを確認
- [ ] `/api/users/me` APIを実装
- [ ] `/login` にロール別リダイレクト機能を追加
- [ ] UIのリンク（`/admin/login`）を削除
- [ ] 6つのE2Eテストを修正（`/admin/login` → `/login`）
- [ ] E2Eテストを実行して全て通過することを確認
- [ ] Issue #108 をクローズ

---

**このドキュメントを読んだら、次の担当者は以下の順序で作業してください**:

1. 🔴 **最優先**: Supabaseにテスト用管理者ユーザーを登録（15分）
2. ユーザーに Option 1/2 の選択を確認（5分）
3. 選択したOptionに従って実装を開始

**推奨**: Option 1（3つのログイン画面）で進めることを強く推奨します。
理由: ユーザー要件に合致し、E2Eテストの修正が不要で、作業時間も短いためです。
