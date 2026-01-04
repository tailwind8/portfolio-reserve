## 目的

生成AI活用で起きがちな「Oversight fatigue（監視疲れ）」「Cognitive overload（認知過負荷）」を前提に、**人間が全ての実装詳細を把握しなくても品質を担保できる**ように、このプロジェクトの品質ゲート・仕様（契約）・テスト・運用を整理する。

## 背景（問題意識）

- **AIが書いたコードは「なぜ動くか」を把握しにくい**  
- **レビューが“全量チェック”になりやすく、疲弊して破綻しやすい**  
- **「動いた→マージした」で記憶に残らず、将来の保守コストが上がる**  

本ドキュメントは「コードを読む」依存を減らし、**仕様（契約）とゲートで守る**方針へ寄せるためのガイドである。

## このリポジトリの現状（すでにできている土台）

### 仕様（契約）寄りの土台

- **TypeScript strict mode**: `reserve-app/tsconfig.json` の `strict: true`
- **入力バリデーション（Zod）**: `reserve-app/src/lib/validations.ts`
  - 例: 予約作成/更新、認証フォーム、管理者用クエリなどをスキーマで定義
- **APIレスポンスの標準化**: `reserve-app/src/lib/api-response.ts`
  - `ApiResponse<T>`、`ZodError`/Prismaエラーの変換、`withErrorHandling` など

### 多層ゲート（自動化）の土台

- **CI（lint→build→unit→E2E）**: `.github/workflows/cicd.yml`
  - ESLint
  - `DATABASE_URL` ダミー指定で `build:ci`
  - Jest coverage
  - Playwright（PRはsmoke、mainはfull）
- **E2Eの安定化工夫**
  - `reserve-app/playwright.config.ts` で `SKIP_AUTH_IN_TEST` を使い、E2Eのために認証をスキップ可能
  - 本番事故の抑止（警告）: `reserve-app/next.config.ts` に `SKIP_AUTH_IN_TEST` のproduction警告
  - 認証スキップの実装側: `reserve-app/src/lib/auth.ts`、`reserve-app/src/middleware.ts`

### Observability（検知）の土台

- **Sentry導入**: `reserve-app/next.config.ts`（`withSentryConfig`）および関連設定
- **SentryのE2E検証テストが存在**: `reserve-app/src/__tests__/e2e/sentry-error-tracking.spec.ts`

## 「全てを把握しない前提」での品質担保：8つのアイデアをこのプロジェクトに落とす

### 1. 契約による設計（Design by Contract）の徹底

**狙い**: 実装詳細ではなく「契約（入力/出力/不変条件）」を人間が所有し、AIには契約を満たす実装を生成させる。

- **現状**: 入力（Zod）と型（strict）は強い
- **追加で効くポイント**
  - **出力の契約化**（APIレスポンスの `data` 形状、状態遷移の戻り値など）
  - **不変条件の明文化**（例: 予約ステータス遷移の禁止/許可をテストで固定）

**成果物（例）**
- `src/lib/*` の純関数は「仕様テスト」を最上位に置く
- APIは「Request/Responseの契約」をテスト化する（成功/失敗の境界、エラーコード、メッセージ規約）

### 2. Property-Based Testing（性質ベーステスト）

**狙い**: 具体例テストだけでは漏れるエッジケースを、性質（常に成立すべきこと）で自動探索する。

- **現状**: Jestで例ベーステストは存在（例: `src/__tests__/unit/lib/validations.test.ts`）
- **導入候補（相性が良い領域）**
  - `src/lib/validations.ts` の日付/時刻/文字数/UUIDなど
  - 予約ステータス遷移（`validateStatusTransition` のようなロジック）
  - セキュリティユーティリティ（リダイレクト安全性、CSRF判定の境界条件）

**導入方針（推奨）**
- まずは「純関数」から限定導入（Flakyにしない）
- 性質テストは「境界条件の穴を探す用途」と割り切り、失敗例は再現ケースとして固定テストに昇格する

> 依存追加が必要な場合（例: `fast-check`）は、共有ファイル方針に従って担当範囲で実施すること。

### 3. 多層的な自動ゲート（人間レビュー前の機械フィルター）

**狙い**: 人間は「ゲートを通らなかった箇所」だけ見る。

#### 推奨ゲート構成（このプロジェクト版）

- **Gate 1: 静的解析**（すでに強い）
  - ESLint / TypeScript build（CIで実施）
- **Gate 2: 自動テスト**（すでに強い）
  - Unit（Jest）/ E2E（Playwright）
- **Gate 3: セキュリティスキャン**（未導入）
  - 例: CodeQL / Dependency Review / Dependabot
- **Gate 4: AIレビュー**（未導入）
  - “別モデル/別プロンプト”での二重チェック（機械的観点の抜けを補う）
- **Gate 5: 段階的リリース**（部分的に可能）
  - feature flag を前提に canary / ロールバック運用へ接続

### 4. サンプリングレビュー + SQC（統計的品質管理）

**狙い**: 全行レビューから「高リスク領域の重点レビュー」と「ランダムサンプル」の組み合わせに切り替える。

#### 高リスク領域（重点レビュー対象の例）

- **認証・認可**: `reserve-app/src/lib/auth.ts`
- **ミドルウェア（CSRF/リダイレクト/保護）**: `reserve-app/src/middleware.ts`
- **APIルート**: `reserve-app/src/app/api/**`
- **DB/トランザクション**: Prisma周辺（`reserve-app/src/lib/prisma.ts` など）

#### サンプリングの運用例

- PRごとに「変更行が多い/影響が大きい」ものは重点レビュー
- それ以外は「毎週N本」などでランダムに深掘りレビューし、品質傾向（抜けやすい観点）を蓄積する

### 5. 「仕様」を最上位の成果物にする

**狙い**: コードではなく、仕様・テスト・型・契約を人間が所有する。実装は交換可能な部品と割り切る。

#### このプロジェクトでの最上位成果物（推奨）

- **受け入れ仕様（Gherkin / E2E）**
  - `features/**/*.feature`（Living Documentation）
  - `src/__tests__/e2e/**`
- **契約（型 + Zod）**
  - `src/lib/validations.ts`
  - APIレスポンス規約（`src/lib/api-response.ts`）
- **アーキテクチャ判断**
  - `documents/architecture/**`、`documents/spec/**`

### 6. Observabilityの強化（本番で検知）

**狙い**: 「完璧に検証してからリリース」だけに寄せず、検知と切り戻しで事故を小さくする。

- **現状**: Sentry導入済み + E2Eで疎通確認テストあり
- **追加で効くポイント**
  - 重要イベント（予約作成/キャンセル/権限エラー）のログ/メトリクス整備
  - feature flag とアラートを紐づけて、異常時に即座にOFFできる運用

### 7. コードの「賞味期限」を設定する

**狙い**: 理解できないAI生成コードを“永続資産”にしない。テストがあるから置換できる。

#### 運用案

- 「理解が浅いコード」には **期限（Review-by）** を付け、月次で置換/リファクタ候補として棚卸しする
- 置換の判断基準は「契約テスト/E2Eが守れているか」に寄せる

### 8. 人間の役割の再定義（品質の門番）

**狙い**: 人間は実装の全理解ではなく、**仕様とゲートの健全性**に責任を持つ。

#### 人間が必ず見るべきポイント（例）

- 仕様（受入条件）が更新されているか
- 契約（型/Zod/エラーハンドリング規約）が守られているか
- 高リスク領域の変更が適切に隔離されているか
- ゲート（CI/テスト/セキュリティ）が落ちた箇所の原因と再発防止が書かれているか

## 直近のアクション（導入コスト順）

### すぐ運用で入れられる（依存追加なし）

- **重点レビューの“対象パス”を明文化**（本ドキュメントの高リスク領域）
- **PRに「契約・危険度・未検証点」を書く**運用（テンプレがあるとより良い）
- **不変条件をテストで固定**（例: 状態遷移、権限、エラーコード規約）

### 変更が必要だが効果が高い（小規模）

- **Gate 3: セキュリティスキャン追加**（CodeQL / Dependency Review / Dependabot）
- **Property-Based Testingの限定導入**（純関数から）

## 関連ドキュメント

- `documents/development/開発プロセス設計.md`
- `documents/development/開発プロセス改善提案.md`
- `documents/コード品質チェックリスト.md`
- `.github/workflows/cicd.yml`
