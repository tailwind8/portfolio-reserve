# CLAUDE.md - AI エージェント向けマスタードキュメント

このファイルは、4つのworktreeで並行作業するAIエージェントが必要な情報にすぐアクセスできるよう整理したマスタードキュメントです。

---

## 🎯 プロジェクト概要

**プロジェクト名**: 予約管理システム（美容室・歯科医院・整体院など多業種対応）
**技術スタック**: Next.js 16 + React 19 + Supabase + Prisma 7 + Tailwind CSS v4
**開発方針**: ATDD/BDD駆動開発
**目的**: ポートフォリオとして見せられる高品質なデモアプリケーション

### 📊 プロジェクト進捗状況（2026-01-03更新）

**Phase 1 完了率**: 90%
**セキュリティ対策**: ✅ OWASP推奨レベル達成
**本番リリース**: ⚠️ 法的ドキュメント作成後に可能

**実装完了済み項目**:
- ✅ セキュリティヘッダー（X-Frame-Options, CSP, HSTS等）
- ✅ CSRF保護（origin/host検証）
- ✅ レート制限（Upstash Redis）
- ✅ セキュリティ監査ログ（全認証イベント記録）
- ✅ 予約重複チェック（トランザクション処理）
- ✅ N+1クエリ対策（インデックス最適化）
- ✅ 予約ブロック機能（Issue #110完了）

**本番リリース前の残タスク**:
- ❌ プライバシーポリシー作成（推定2日）
- ❌ 利用規約作成（推定2日）
- ❌ Sentry導入（推定1日）
- ⚠️ Cookie同意バナー（推定1日）

**詳細**: `documents/実装状況差分レポート.md` を参照

---

## 🔑 ロール設計（超重要）

このシステムには**3つのロール**があります。混同すると実装ミスの原因になるため、必ず理解してください。

| ロール | 日本語名 | 権限範囲 | ルート |
|--------|---------|----------|--------|
| **CUSTOMER** | 一般ユーザー（顧客） | 予約の作成・確認・キャンセル | `/`, `/login`, `/booking`, `/mypage` |
| **ADMIN** | 店舗管理者 | 店舗運用・予約管理・顧客管理 | `/admin/*` |
| **SUPER_ADMIN** | システム管理者（開発者） | **オプション機能のON/OFF**・全テナント管理 | `/super-admin/*` |

### ⚠️ 最重要ポイント

**オプション機能のON/OFF制御権限:**
- ✅ **SUPER_ADMIN（開発者）のみ**: `/super-admin/feature-flags` でオプション機能をON/OFF可能
- ❌ **ADMIN（店舗管理者）**: オプション機能のON/OFFは**できない**。購入済み機能を使うだけ
- ❌ `/admin/settings/features` ページは**存在しない**（SUPER_ADMINのみ）

### ビジネスフロー（ココナラ販売時）

1. 顧客がココナラで「基準パッケージ + オプション機能」を購入
2. **SUPER_ADMIN（開発者）**が `/super-admin/feature-flags` でオプション機能をON
3. **ADMIN（店舗管理者）**が有効化された機能を使用開始

### 詳細ドキュメント
- `documents/spec/ロール設計書.md` - 全ロールの詳細な権限定義（必読）

---

## 📂 ドキュメント構成

### 🚀 最優先で読むべき

| ファイル | 用途 | いつ読む |
|---------|------|----------|
| **`worktree/QUICK_REFERENCE.md`** | 即座に参照する簡潔版 | 毎日・作業中 |
| **`.cursor/rules/日本語運用ルール.md`** | コミット・PR記述ルール | コミット前・PR前 |
| **`worktree/SNIPPETS.md`** | コピペで使えるコード集 | 実装中 |

### 📚 詳細ルール

| ファイル | 内容 |
|---------|------|
| `documents/並行作業ガイドライン.md` | worktree運用の全体像・共有ファイル管理 |
| `documents/コード品質チェックリスト.md` | PR前の品質確認項目 |
| `documents/Git運用ルール.md` | ブランチ・コミット・PRの詳細ルール |

### 📖 参考資料

| ファイル | 内容 |
|---------|------|
| `documents/開発プロセス設計.md` | ATDD/BDD開発プロセス |
| `documents/GitHub-Issues一覧.md` | 全Issue一覧 |
| `reserve-app/README.md` | 技術スタック・セットアップ |

---

## 🔐 セキュリティルール（絶対厳守）

### ⚠️ 機密情報の保護（最優先）

**絶対にやってはいけないこと:**
- ❌ `.env`ファイルの内容を読み取る・表示する
- ❌ API キー、シークレットキー、パスワードをログに出力する
- ❌ SSH鍵を読み取る・表示する
- ❌ 環境変数の内容を直接表示する
- ❌ データベース接続文字列（DATABASE_URL）を表示する

**機密情報の取り扱い:**
- ✅ 機密情報は環境変数経由でのみ使用
- ✅ `.env.example`のみ編集可能（実際の値は含めない）
- ✅ コード内にAPI キーをハードコーディングしない
- ✅ コミット前に`git diff`で機密情報が含まれていないか確認

### 🚫 破壊的操作の禁止

**絶対に実行してはいけないコマンド:**
- ❌ `git reset --hard`（履歴破壊）
- ❌ `git push --force`（リモート履歴破壊）
- ❌ `rm -rf /`（システム破壊）
- ❌ `docker system prune`（環境破壊）
- ❌ ディスク初期化系コマンド（`diskutil eraseDisk`、`mkfs`等）

**安全な代替手段:**
- ✅ `git revert`（履歴を保持して元に戻す）
- ✅ `git restore`（ファイルを復元）
- ✅ `rm`（個別削除、-rfフラグなし）

### 🔍 エラー時の対応

デバッグ時にエラーが発生しても、以下は禁止：
- ❌ `.env`ファイルの内容をログに出力
- ❌ 環境変数全体をダンプ
- ❌ データベース接続文字列を表示

**正しいデバッグ方法:**
- ✅ 環境変数が設定されているか確認（値を表示せず存在確認のみ）
- ✅ `.env.example`のフォーマットを確認
- ✅ エラーメッセージから機密情報を除外してログ出力

### 📋 denyリスト設定

`.claude/settings.json`に以下のdenyリストが設定されています：

**機密情報保護:**
- `.env*`ファイルの読み取り禁止
- SSH鍵（`.ssh/`）の読み取り禁止
- AWS/GCP認証情報の読み取り禁止

**破壊的操作の禁止:**
- ディスク初期化系コマンド
- Git履歴破壊コマンド
- Docker環境破壊コマンド
- 重要ディレクトリ削除コマンド

---

## 🚨 最重要ルール（必読）

### 1. 日本語で記述（絶対厳守）

```bash
# ✅ GOOD
git commit -m "feat: ユーザー登録機能を実装"

# ❌ BAD
git commit -m "feat: Add user registration"
```

**対象:**
- コミットメッセージ: 日本語
- PRタイトル: 日本語
- PR説明: 日本語
- コードコメント: 日本語

**例外（英語）:**
- ブランチ名: `feature/user-authentication`
- 変数名・関数名: `getUserById`
- ファイル名: `BookingForm.tsx`

### 2. 共有ファイルは触らない

**cicd worktreeのみ編集可能:**
- `package.json`
- `tsconfig.json`
- `eslint.config.mjs`
- `.env.example`
- `prisma/schema.prisma` (要相談)

**各worktreeで編集OK:**
- `src/app/` 配下の各自担当ページ
- `src/components/` 配下の各自コンポーネント
- `src/__tests__/` 配下の各自テスト

### 3. 毎朝rebase（コンフリクト回避）

```bash
# メインリポジトリ
cd /Users/a-aoki/indivisual/2026/portpfolio/reserve-system
git checkout main
git pull origin main

# 自分のworktree
cd /Users/a-aoki/indivisual/2026/portpfolio/reserve-system-XXX
git rebase main
```

### 4. PR前の品質チェック

```bash
cd reserve-app
npm run lint           # ✅ エラー0件
npm run build:ci       # ✅ ビルド成功
npm test               # ✅ テスト通過
npm run test:e2e       # ✅ E2E通過
```

すべて通過するまでPR禁止。

---

## 📦 Worktree分業（4つ）

### Worktree 1: CI/CD (`reserve-system-cicd`)

**ディレクトリ**: `/Users/a-aoki/indivisual/2026/portpfolio/reserve-system-cicd`
**ブランチ**: `feature/ci-cd-infrastructure`
**Issue**: #3, #4

**担当範囲:**
- `.github/workflows/*.yml` 作成
- `package.json` 編集（依存関係追加）
- `.env.example` 更新
- `tsconfig.json`, `eslint.config.mjs` 編集

**作業内容:**
1. GitHub Actions ワークフロー作成
2. 環境変数ドキュメント化
3. 依存関係管理

---

### Worktree 2: Auth (`reserve-system-auth`)

**ディレクトリ**: `/Users/a-aoki/indivisual/2026/portpfolio/reserve-system-auth`
**ブランチ**: `feature/user-authentication`
**Issue**: #5, #6

**担当範囲:**
- `src/app/(auth)/register/`
- `src/app/(auth)/login/`
- `src/components/auth/`
- `src/__tests__/e2e/auth.spec.ts`

**作業内容:**
1. Supabase Auth統合
2. 登録・ログインフォーム実装
3. E2Eテスト作成

**必要な依存:**
```bash
npm install @supabase/auth-helpers-nextjs
```

---

### Worktree 3: Admin (`reserve-system-admin`)

**ディレクトリ**: `/Users/a-aoki/indivisual/2026/portpfolio/reserve-system-admin`
**ブランチ**: `feature/admin-dashboard`
**Issue**: #7, #15, #16

**担当範囲:**
- `src/app/(admin)/admin/dashboard/`
- `src/app/(admin)/admin/reservations/`
- `src/components/admin/`
- `src/__tests__/e2e/admin.spec.ts`

**作業内容:**
1. 管理者ログイン機能
2. ダッシュボード（統計表示）
3. 予約一覧ページ
4. E2Eテスト作成

---

### Worktree 4: Booking (`reserve-system-booking`)

**ディレクトリ**: `/Users/a-aoki/indivisual/2026/portpfolio/reserve-system-booking`
**ブランチ**: `feature/booking-system`
**Issue**: #8, #9, #10, #11

**担当範囲:**
- `src/app/(booking)/menus/`
- `src/app/(booking)/booking/`
- `src/components/booking/`
- `src/__tests__/e2e/booking.spec.ts`

**作業内容:**
1. メニュー一覧表示
2. 予約カレンダー（空き状況）
3. 予約登録機能
4. 確認メール送信
5. E2Eテスト作成

**必要な依存:**
```bash
npm install resend
```

---

## 🔄 マージ順序

```
1️⃣ cicd → main (最優先)
   ↓ 全員rebase
2️⃣ auth → main
   ↓ booking/admin rebase
3️⃣ booking → main
   ↓ admin rebase
4️⃣ admin → main
```

**理由:**
- CI/CD先行 → 以降のPRで自動テストが動く
- auth先行 → booking/adminで認証機能が使える

---

## 📝 よく使うコマンド

### 毎朝のルーチン

```bash
# メインリポジトリ
cd /Users/a-aoki/indivisual/2026/portpfolio/reserve-system
git checkout main
git pull origin main

# 自分のworktree
cd /Users/a-aoki/indivisual/2026/portpfolio/reserve-system-XXX
git rebase main
```

### 作業開始

```bash
cd /Users/a-aoki/indivisual/2026/portpfolio/reserve-system-XXX/reserve-app
npm install
npm run prisma:generate
npm run dev
```

### 品質チェック

```bash
npm run lint
npm run build:ci
npm test
npm run test:e2e
```

### コミット・プッシュ

```bash
git add .
git commit -m "feat: ユーザー登録機能を実装"
git push origin feature/XXX
```

---

## ✅ PR作成チェックリスト

### 実行前

- [ ] `npm run lint` → エラー0件
- [ ] `DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build:ci` → ビルド成功
- [ ] `npm test` → テスト通過
- [ ] `npm run test:e2e` → E2E通過

### PRタイトル（日本語）

```
[FEATURE] ユーザー登録機能を実装
[FIX] 予約カレンダーのバグを修正
[TEST] E2Eテストを追加
```

### PR説明文（日本語）

```markdown
## 📝 概要
ユーザー登録機能を実装しました。

## 🎯 関連Issue
Closes #5

## ✅ 実装内容
- [x] 登録フォームコンポーネント作成
- [x] Supabase Auth統合
- [x] E2Eテスト作成

## 🧪 テスト方法
1. `npm run dev`
2. http://localhost:3000/register にアクセス
3. フォーム送信

## 📊 品質チェック
- [x] Lintエラー0件
- [x] ビルド成功
- [x] テスト通過
```

---

## 🎨 統一デザイン

### カラー（Tailwind）

```typescript
primary:   'bg-blue-500'   // アクション
secondary: 'bg-purple-500' // 強調
success:   'bg-green-500'  // 成功
warning:   'bg-yellow-500' // 警告
danger:    'bg-red-500'    // エラー
```

### ボタンスタイル

```tsx
// Primary
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  送信
</button>

// Secondary
<button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">
  キャンセル
</button>
```

### ページレイアウト

```tsx
<main className="container mx-auto px-4 py-8">
  <h1 className="text-2xl font-bold mb-6">タイトル</h1>
  <div className="bg-white rounded shadow p-6">
    {/* コンテンツ */}
  </div>
</main>
```

---

## 🧪 テストパターン

### E2E（Playwright）

```typescript
import { test, expect } from '@playwright/test';

test('ユーザーが登録できる', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/login');
});
```

### 単体テスト（Jest + RTL）

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';

test('クリックイベントが発火する', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click</Button>);

  fireEvent.click(screen.getByText('Click'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

---

## 🚨 トラブルシューティング

### Q: rebase中にコンフリクト発生

```bash
# コンフリクトファイルを確認
git status

# エディタで手動解決（<<<<< HEAD などを削除）

# 解決後
git add .
git rebase --continue

# 解決できない場合は中止
git rebase --abort
```

### Q: package.jsonに依存を追加したい

**A**: `cicd` worktreeで追加。他のworktreeは翌朝rebaseで取得。

### Q: Prismaスキーマを変更したい

**A**: 全員に影響するため、事前に調整が必要。

### Q: ビルドエラー（DATABASE_URLがない）

```bash
# ダミーURLを設定してビルド
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build:ci
```

### Q: 共通コンポーネントを作りたい

**A**: `src/components/ui/` に配置。既存確認後に作成。

---

## 📊 ポートフォリオ品質基準

### デザイン

- ✅ レスポンシブ対応（mobile/tablet/desktop）
- ✅ 統一カラーパレット
- ✅ ローディング・エラー表示

### パフォーマンス

- ✅ Lighthouse Performance 90以上
- ✅ Next.js `<Image>` 使用
- ✅ 動的import活用

### アクセシビリティ

- ✅ セマンティックHTML
- ✅ aria-label追加
- ✅ キーボード操作対応

### セキュリティ

- ✅ 環境変数の適切な管理
- ✅ XSS/CSRF対策
- ✅ 認証チェック

### テスト

- ✅ カバレッジ80%以上
- ✅ E2E主要フロー100%

---

## 🎯 今すぐやること

1. **自分のworktreeに移動**
2. **担当Issueを確認**
3. **E2Eテストから書く**（BDD）
4. **実装**
5. **品質チェック**
6. **PR作成**

---

## 📚 詳細情報が必要な場合

| 疑問 | 参照ドキュメント |
|------|---------------|
| コミット・PR記述方法 | `.cursor/rules/日本語運用ルール.md` |
| 共有ファイルの取り扱い | `documents/並行作業ガイドライン.md` |
| 品質チェック項目 | `documents/コード品質チェックリスト.md` |
| コピペコード | `worktree/SNIPPETS.md` |
| Git詳細ルール | `documents/Git運用ルール.md` |
| 開発プロセス | `documents/開発プロセス設計.md` |

---

## 📖 Context7で最新ドキュメントを取得

このプロジェクトでは、**Context7 MCP**を使用して15,000以上のライブラリの最新ドキュメントをリアルタイムで取得できます。

### 📦 現在のプロジェクトバージョン

| ライブラリ | バージョン | Context7 ID |
|----------|----------|------------|
| **Next.js** | 16.1.1 | `/vercel/next.js` |
| **React** | 19.2.3 | `/facebook/react` |
| **Supabase JS** | 2.89.0 | `/supabase/supabase-js` |
| **Prisma** | 7.2.0 | `/prisma/prisma` |
| **Playwright** | 1.57.0 | `/microsoft/playwright` |
| **Tailwind CSS** | 4.x | `/tailwindlabs/tailwindcss` |
| **Zod** | 4.2.1 | `/colinhacks/zod` |

### 🔍 使用例

**Supabase認証の実装方法を調べる:**
```
Supabase v2系でメール・パスワード認証を実装する方法を教えて
```

**Next.js 16の新機能を確認:**
```
Next.js 16のServer Actionsの使い方を教えて
```

**Prisma 7のマイグレーション:**
```
Prisma 7でデータベースマイグレーションを実行する方法を教えて
```

**Playwright-BDDのGherkin構文:**
```
PlaywrightでGherkin形式のE2Eテストを書く方法を教えて
```

### ⚠️ 重要な注意事項

1. **バージョン互換性**
   - Context7のドキュメントは最新版に近いですが、完全一致しない場合があります
   - v2系同士、v4系同士など、メジャーバージョンが一致していれば互換性は高いです
   - 実装前に必ず公式ドキュメントでバージョン固有の変更を確認してください

2. **実装時の確認手順**
   - Context7で実装方法を取得
   - プロジェクトの`package.json`でバージョンを確認
   - 必要に応じて公式ドキュメントで差分を確認

3. **よく使うライブラリのContext7 ID**
   - Supabase公式ドキュメント全体: `/websites/supabase_com-docs`
   - Next.js公式ドキュメント: `/websites/nextjs_org-docs`
   - React公式ドキュメント: `/websites/react_dev`

### 📚 Context7の活用が特に有効な場面

- ✅ Supabase認証・データベース操作の実装
- ✅ Next.js 16の新機能（Server Actions、Partial Prerenderingなど）
- ✅ React 19の新機能（Suspense、use hookなど）
- ✅ Prisma 7のスキーマ定義・マイグレーション
- ✅ Playwright-BDDのテスト実装
- ✅ Zodバリデーションスキーマの定義

---

## 🚀 成功の鍵

✅ **毎朝rebase** - コンフリクトを最小化
✅ **共有ファイルは触らない** - 競合を回避
✅ **日本語でコミット・PR** - 統一された履歴
✅ **テストを必ず書く** - 品質担保
✅ **ドキュメントを参照** - 迷ったら確認
✅ **Context7を活用** - 最新ドキュメントで正確な実装

---

**最終更新**: 2026-01-01
**管理者**: Claude Code
