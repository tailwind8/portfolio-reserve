# Next.js/TypeScript向け 生成AI仕様駆動開発・ATDD/BDD Claude Code Skills 提案書

## 概要

Next.js/TypeScript構成のプロジェクトにおいて、生成AI仕様駆動開発（Spec-Driven Development）とATDD/BDD実践を支援するClaude Code Skillsの提案です。

---

## 技術スタック前提

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| BDDフレームワーク | Playwright + Cucumber/playwright-bdd |
| ユニットテスト | Jest/Vitest + React Testing Library |
| Linter/Formatter | ESLint + Prettier |
| 静的解析 | TypeScript strict mode + eslint-plugin-sonarjs |
| E2Eテスト | Playwright |

---

## 提案するSkills一覧

| # | Skill名 | 主な用途 | 優先度 |
|---|---------|----------|--------|
| 1 | `nextjs-gherkin-generator` | 仕様→Gherkinシナリオ自動生成 | 高 |
| 2 | `playwright-bdd-analyzer` | BDDテストの品質・網羅性分析 | 高 |
| 3 | `typescript-security-checker` | TypeScript/Next.js向けセキュリティ診断 | 高 |
| 4 | `nextjs-test-coverage` | テストカバレッジ・品質分析 | 中 |
| 5 | `spec-validator` | AI生成仕様の品質検証 | 中 |
| 6 | `nextjs-code-quality` | コード品質・型安全性チェック | 中 |

---

## 1. nextjs-gherkin-generator

### 目的
ユーザーストーリー・PRDからNext.js向けのGherkinシナリオを自動生成する。

### SKILL.md

```yaml
---
name: nextjs-gherkin-generator
description: |
  Next.js/TypeScriptプロジェクト向けGherkinシナリオ自動生成スキル。
  以下の場合に使用:
  (1) ユーザーストーリーからBDDシナリオ作成時
  (2) PRD/仕様書からテストシナリオ生成時
  (3) APIエンドポイントの振る舞い定義時
  (4) ページ遷移・UIインタラクションのシナリオ化時
---

# Next.js Gherkin Generator

## ワークフロー

1. 仕様/ユーザーストーリーを入力として受け取る
2. Next.js固有のパターンを考慮してシナリオを生成
   - App Router のページ遷移
   - Server Components vs Client Components
   - API Routes の振る舞い
   - ミドルウェア処理
3. Playwright-BDD互換のFeatureファイルを出力

## 生成ルール

### ファイル構造
```
e2e/
├── features/
│   ├── auth/
│   │   └── login.feature
│   ├── dashboard/
│   │   └── navigation.feature
│   └── api/
│       └── user-api.feature
├── steps/
│   └── *.steps.ts
└── support/
    └── world.ts
```

### シナリオ命名規約
- Feature: 機能単位で1ファイル
- Scenario: 1シナリオ1振る舞い（単一責任）
- タグ: @smoke, @regression, @api, @ui で分類

### Next.js固有のパターン

#### ページ遷移シナリオ
```gherkin
Feature: ダッシュボードナビゲーション

  @ui @smoke
  Scenario: 認証済みユーザーがダッシュボードにアクセスする
    Given ユーザーがログイン済みである
    When ユーザーが "/dashboard" にアクセスする
    Then ダッシュボードページが表示される
    And ナビゲーションメニューが表示される
```

#### API Routeシナリオ
```gherkin
Feature: ユーザーAPI

  @api
  Scenario: 有効なトークンでユーザー情報を取得する
    Given 有効な認証トークンを持っている
    When "GET /api/users/me" にリクエストを送信する
    Then ステータスコード 200 が返される
    And レスポンスにユーザー情報が含まれる
```

## 網羅性チェックリスト

シナリオ生成時に以下を確認:
- [ ] ハッピーパス（正常系）
- [ ] エラーパス（異常系）
- [ ] 境界値ケース
- [ ] 認証・認可パターン
- [ ] ローディング/エラー状態
- [ ] レスポンシブ対応（必要時）

詳細は references/scenario-patterns.md を参照。
```

### references/ に含めるファイル

- `scenario-patterns.md`: Next.js向けシナリオパターン集
- `step-definition-templates.md`: Playwright-BDD用ステップ定義テンプレート
- `page-object-patterns.md`: Page Object Modelパターン

---

## 2. playwright-bdd-analyzer

### 目的
Playwright-BDDテストの品質・網羅性を分析し、改善点を提案する。

### SKILL.md

```yaml
---
name: playwright-bdd-analyzer
description: |
  Playwright-BDD/Cucumberテストの品質分析スキル。
  以下の場合に使用:
  (1) .featureファイルのレビュー・品質チェック時
  (2) ステップ定義の再利用性分析時
  (3) シナリオ網羅性の確認時
  (4) E2Eテスト実行結果の分析時
  (5) テストの保守性評価時
---

# Playwright-BDD Analyzer

## 分析項目

### 1. Gherkin品質分析
- 構文の正確性
- 宣言的 vs 命令的スタイルの評価
- シナリオの独立性チェック
- Background の適切な使用

### 2. 網羅性分析
- 機能ごとのシナリオカバレッジ
- ハッピーパス/エラーパスのバランス
- 境界値テストの有無
- タグによる分類状況

### 3. ステップ定義分析
- 再利用率の計算
- 重複ステップの検出
- パラメータ化の提案
- Page Objectパターンの適用状況

### 4. 実行効率分析
- 並列実行可能性
- セットアップ/ティアダウンの効率
- フレーキーテストの検出

## 分析コマンド

機能ファイル群を分析する場合:
1. e2e/features/ ディレクトリを走査
2. 各 .feature ファイルを解析
3. steps/*.steps.ts との対応を確認
4. レポートを生成

## 出力フォーマット

分析結果は以下の形式で出力:

```markdown
## Gherkin品質レポート

### サマリー
- 総Feature数: X
- 総Scenario数: Y
- ステップ再利用率: Z%

### 問題点
1. [重要度:高] feature/auth/login.feature
   - 命令的なシナリオが多い（5/7シナリオ）
   - 推奨: UIの詳細をステップ定義に移動

### 改善提案
- 共通ステップの抽出候補: 3件
- 欠落しているエラーケース: 2件
```

詳細な分析パターンは references/analysis-rules.md を参照。
```

### scripts/ に含めるファイル

```typescript
// scripts/analyze-features.ts
// Feature/Scenarioの統計情報を収集・分析

// scripts/check-step-coverage.ts
// ステップ定義のカバレッジをチェック

// scripts/detect-flaky-patterns.ts
// フレーキーテストになりやすいパターンを検出
```

---

## 3. typescript-security-checker

### 目的
Next.js/TypeScriptプロジェクト向けのセキュリティ診断を実行する。

### SKILL.md

```yaml
---
name: typescript-security-checker
description: |
  Next.js/TypeScriptプロジェクト向けセキュリティ診断スキル。OWASP準拠。
  以下の場合に使用:
  (1) PRレビュー時のセキュリティチェック
  (2) API Routes のセキュリティ検証
  (3) 認証・認可ロジックの確認
  (4) 依存パッケージの脆弱性確認
  (5) 環境変数・シークレット管理の確認
---

# TypeScript Security Checker

## チェック項目

### 1. Next.js固有のセキュリティ

#### Server Components
- サーバー専用コードのクライアント漏洩チェック
- `"use server"` ディレクティブの適切な使用
- Server Actions のバリデーション確認

#### API Routes
- 入力バリデーション（Zod等）の有無
- 認証ミドルウェアの適用確認
- レート制限の実装確認
- CORS設定の検証

#### ミドルウェア
- 認証・認可ロジックの確認
- リダイレクト処理の安全性

### 2. TypeScript/JavaScript共通

#### OWASP Top 10対応
- A01: アクセス制御の不備
- A02: 暗号化の失敗
- A03: インジェクション
- A07: 認証の不備

#### コードパターン
```typescript
// 危険なパターン検出
dangerouslySetInnerHTML  // XSSリスク
eval(), new Function()   // コードインジェクション
process.env.* (クライアント) // 環境変数漏洩
```

### 3. 依存関係

- `npm audit` / `pnpm audit` の実行
- 既知の脆弱性を持つパッケージの検出
- 未使用依存関係の特定

## ESLint統合

推奨ESLint設定:
```javascript
// eslint.config.mjs (Flat Config)
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  // ... 他の設定
  {
    plugins: { security, sonarjs },
    rules: {
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'sonarjs/no-hardcoded-credentials': 'error',
    }
  }
];
```

詳細は references/security-checklist.md を参照。
```

### references/ に含めるファイル

- `security-checklist.md`: Next.js向けセキュリティチェックリスト
- `owasp-api-mapping.md`: OWASP API Security Top 10対応表
- `secure-patterns.md`: セキュアコーディングパターン集

---

## 4. nextjs-test-coverage

### 目的
Next.jsプロジェクトのテストカバレッジを多角的に分析する。

### SKILL.md

```yaml
---
name: nextjs-test-coverage
description: |
  Next.jsプロジェクトのテストカバレッジ・品質分析スキル。
  以下の場合に使用:
  (1) テストスイートの品質評価時
  (2) カバレッジギャップの特定時
  (3) コンポーネント/API別カバレッジ分析時
  (4) テスト戦略の見直し時
---

# Next.js Test Coverage Analyzer

## 分析対象

### テストレイヤー別カバレッジ

| レイヤー | ツール | 対象 |
|---------|--------|------|
| ユニット | Jest/Vitest | Components, Hooks, Utils |
| 統合 | Testing Library | Component + Context |
| E2E | Playwright | ページ全体フロー |
| API | Playwright/Supertest | API Routes |

### Next.js固有の分析

#### App Router構造
```
app/
├── (auth)/
│   ├── login/page.tsx    → テスト有無確認
│   └── register/page.tsx → テスト有無確認
├── dashboard/
│   └── page.tsx          → テスト有無確認
└── api/
    └── users/route.ts    → テスト有無確認
```

#### コンポーネント分類
- Server Components: ユニットテスト必須度を評価
- Client Components: インタラクションテストの網羅性
- 共通コンポーネント: 再利用性とテストカバレッジ

## カバレッジ指標

### 基本指標
- ライン/ブランチ/関数カバレッジ
- ステートメントカバレッジ

### 品質指標
- アサーション密度（Assertion/Invoke比率）
- ミューテーションスコア（Stryker使用時）
- テストの独立性評価

## レポート形式

```markdown
## テストカバレッジレポート

### 概要
| 指標 | 値 | 目標 | 状態 |
|------|-----|------|------|
| ライン | 78% | 80% | ⚠️ |
| ブランチ | 65% | 70% | ⚠️ |
| E2E網羅率 | 85% | 80% | ✅ |

### ギャップ分析
- 未テストページ: 3件
- 未テストAPI: 2件
- 低カバレッジコンポーネント: 5件

### 改善優先順位
1. app/api/payment/route.ts (ビジネスクリティカル)
2. components/CheckoutForm.tsx (複雑度高)
```

詳細は references/coverage-strategy.md を参照。
```

---

## 5. spec-validator

### 目的
AI生成仕様の品質を検証し、実装前に問題を発見する。

### SKILL.md

```yaml
---
name: spec-validator
description: |
  AI生成仕様・PRDの品質検証スキル。仕様駆動開発の品質ゲート。
  以下の場合に使用:
  (1) AI生成仕様のレビュー時
  (2) PRD/要件定義の曖昧さチェック時
  (3) Gherkin変換前の仕様検証時
  (4) 仕様の矛盾・欠落発見時
---

# Spec Validator

## 検証項目

### 1. 曖昧性検出

検出パターン:
- 「など」「等」「適切に」「必要に応じて」
- 「すべて」「常に」（例外が不明確）
- 数値のない基準（「速く」「多く」）
- 主語・目的語の省略

### 2. 完全性検証

チェック項目:
- [ ] エラーケースの定義
- [ ] 境界条件の明示
- [ ] 非機能要件（性能、セキュリティ）
- [ ] 前提条件・事前条件
- [ ] 期待される出力形式

### 3. 一貫性検証

- 用語の統一性（同一概念に複数名称がないか）
- 仕様間の矛盾検出
- データフロー整合性

### 4. テスト可能性評価

各仕様項目に対して:
- Given-When-Then形式への変換可能性
- 検証可能な受け入れ基準の有無
- 自動テスト化の容易さ

## 出力形式

```markdown
## 仕様検証レポート

### 検出された問題

#### 曖昧性 (3件)
1. [行12] "適切なエラーメッセージを表示"
   → 推奨: 具体的なエラーメッセージ文言を定義

#### 欠落 (2件)
1. ログイン失敗時の試行回数制限が未定義
   → 推奨: 最大試行回数とロックアウト時間を追加

### テスト可能性スコア: 75/100
- 明確な仕様: 15/20
- 曖昧な仕様: 5/20
```
```

---

## 6. nextjs-code-quality

### 目的
Next.js/TypeScriptコードの品質と型安全性を検証する。

### SKILL.md

```yaml
---
name: nextjs-code-quality
description: |
  Next.js/TypeScriptコードの品質・保守性分析スキル。
  以下の場合に使用:
  (1) PRレビュー時のコード品質チェック
  (2) 技術的負債の特定時
  (3) TypeScript型安全性の確認時
  (4) Next.jsベストプラクティス準拠確認時
---

# Next.js Code Quality

## 分析項目

### 1. TypeScript型安全性

チェック項目:
- `any` 型の使用箇所
- 非nullアサーション (`!`) の過剰使用
- 型アサーション (`as`) の適切性
- strict mode 準拠

### 2. Next.js固有のパターン

#### 推奨パターン
```typescript
// ✅ 推奨: Server Action with Zod validation
'use server';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export async function submitForm(formData: FormData) {
  const result = schema.safeParse({
    email: formData.get('email'),
  });
  if (!result.success) {
    return { error: result.error.flatten() };
  }
  // ...
}
```

#### 避けるべきパターン
```typescript
// ❌ 非推奨: クライアントでのシークレット使用
const apiKey = process.env.API_KEY; // クライアントバンドルに含まれる可能性

// ❌ 非推奨: 未検証の入力
export async function handler(req: Request) {
  const body = await req.json(); // バリデーションなし
}
```

### 3. コード複雑度

- 循環的複雑度 (上限: 10)
- 認知的複雑度 (上限: 15)
- 関数の行数 (上限: 50行)
- ネスト深度 (上限: 4)

### 4. アーキテクチャ準拠

- コンポーネント分類の一貫性
- 関心の分離
- 依存関係の方向性

## ESLint推奨設定

```javascript
// eslint.config.mjs
import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  {
    plugins: {
      '@next/next': nextPlugin,
      '@typescript-eslint': tsPlugin,
      sonarjs,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': 'warn',
    },
  },
];
```
```

---

## 統合開発フロー

### フロー図

```
┌─────────────────────────────────────────────────────────────┐
│                    仕様駆動開発フロー                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 要件定義                                                 │
│     ├── PRD/ユーザーストーリー作成                            │
│     └── [spec-validator] 仕様品質検証 ────────────┐         │
│                                                   ↓         │
│  2. シナリオ作成                                             │
│     ├── [nextjs-gherkin-generator] Gherkin生成               │
│     └── [playwright-bdd-analyzer] シナリオ品質分析            │
│                                                             │
│  3. 実装                                                    │
│     ├── Red: テスト作成（失敗確認）                           │
│     ├── Green: 実装（テスト通過）                             │
│     └── Refactor: リファクタリング                           │
│                                                             │
│  4. 品質検証                                                 │
│     ├── [typescript-security-checker] セキュリティ診断        │
│     ├── [nextjs-test-coverage] カバレッジ分析                 │
│     └── [nextjs-code-quality] コード品質チェック              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD統合例

```yaml
# .github/workflows/quality-check.yml
name: Quality Check

on: [pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type Check
        run: pnpm tsc --noEmit
      
      - name: Lint
        run: pnpm lint
      
      - name: Security Audit
        run: pnpm audit
      
      - name: Unit Tests
        run: pnpm test:unit --coverage
      
      - name: E2E Tests
        run: pnpm test:e2e
      
      - name: Coverage Report
        # カバレッジ閾値チェック
        run: |
          pnpm coverage:check --lines 80 --branches 70
```

---

## 実装ロードマップ

### Phase 1: 基盤構築（1-2週間）
- [ ] `nextjs-gherkin-generator` 実装
- [ ] `playwright-bdd-analyzer` 実装
- [ ] プロジェクトへのBDD基盤導入

### Phase 2: 品質強化（2-3週間）
- [ ] `typescript-security-checker` 実装
- [ ] `nextjs-test-coverage` 実装
- [ ] CI/CDパイプラインへの統合

### Phase 3: 継続的改善（継続）
- [ ] `spec-validator` 実装
- [ ] `nextjs-code-quality` 実装
- [ ] メトリクス可視化ダッシュボード

---

## 推奨パッケージ構成

```json
{
  "devDependencies": {
    // BDD/E2Eテスト
    "@playwright/test": "^1.49.0",
    "@cucumber/cucumber": "^11.0.0",
    "playwright-bdd": "^7.0.0",
    
    // ユニットテスト
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    
    // 静的解析
    "eslint": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "eslint-plugin-sonarjs": "^2.0.0",
    "eslint-plugin-security": "^3.0.0",
    
    // カバレッジ
    "@vitest/coverage-v8": "^2.0.0",
    
    // ミューテーションテスト（オプション）
    "@stryker-mutator/core": "^8.0.0"
  }
}
```

---

## まとめ

本提案の6つのSkillsにより、Next.js/TypeScriptプロジェクトで以下を実現:

1. **仕様品質の向上**: AI生成仕様の曖昧さ・欠落を早期発見
2. **BDDテストの効率化**: Gherkin自動生成とシナリオ品質分析
3. **セキュリティ強化**: Next.js固有のセキュリティリスク検出
4. **テスト網羅性の可視化**: 多層的なカバレッジ分析
5. **コード品質の維持**: TypeScript型安全性と保守性の確保
6. **開発サイクルの高速化**: CI/CD統合による自動品質ゲート