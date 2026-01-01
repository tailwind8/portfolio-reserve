# BDD改善パターン集

このドキュメントは、BDDテストでよく見られる問題とその改善パターンを示します。

---

## パターン1: 命令的→宣言的スタイルへの変換

### 問題

UIの詳細が直接シナリオに記述されており、UIが変更されるとシナリオも変更が必要。

### Before（命令的）

```gherkin
Scenario: ユーザーがログインする
  Given ユーザーが "/login" ページにアクセスしている
  When ユーザー名フィールドに "test@example.com" を入力する
  And パスワードフィールドに "password123" を入力する
  And ログインボタンをクリックする
  Then "/" ページにリダイレクトされる
```

### After（宣言的）

```gherkin
Scenario: ユーザーがログインする
  Given ユーザーがログインページにアクセスしている
  When ユーザーが有効な認証情報でログインする
  Then ホームページが表示される
```

### 改善ポイント

1. **UIの詳細をステップ定義に移動**
   - フィールド名、ボタン名などはPage Objectに隠蔽

2. **ビジネスの意図を明確に**
   - 「何をするか」ではなく「何が起こるか」を記述

---

## パターン2: Background活用によるDRY原則

### 問題

同じ前提条件が複数のシナリオで繰り返されている。

### Before

```gherkin
Feature: 予約管理

Scenario: 予約を作成する
  Given 管理者がログイン済みである
  And 管理者が予約ページにアクセスしている
  When 管理者が予約を作成する
  Then 予約が作成される

Scenario: 予約を更新する
  Given 管理者がログイン済みである
  And 管理者が予約ページにアクセスしている
  When 管理者が予約を更新する
  Then 予約が更新される

Scenario: 予約を削除する
  Given 管理者がログイン済みである
  And 管理者が予約ページにアクセスしている
  When 管理者が予約を削除する
  Then 予約が削除される
```

### After

```gherkin
Feature: 予約管理

Background:
  Given 管理者がログイン済みである
  And 管理者が予約ページにアクセスしている

Scenario: 予約を作成する
  When 管理者が予約を作成する
  Then 予約が作成される

Scenario: 予約を更新する
  When 管理者が予約を更新する
  Then 予約が更新される

Scenario: 予約を削除する
  When 管理者が予約を削除する
  Then 予約が削除される
```

### 改善ポイント

1. **共通の前提条件をBackgroundに抽出**
2. **シナリオの本質に集中**
3. **保守性向上**（前提条件の変更が1箇所で済む）

---

## パターン3: Scenario Outlineによるパラメータ化

### 問題

構造が同じで値だけ異なるシナリオが重複している。

### Before

```gherkin
Scenario: メールアドレスが無効な場合エラーが表示される
  Given ユーザーが予約フォームにアクセスしている
  When メールアドレスに "invalid-email" を入力する
  And 送信ボタンをクリックする
  Then "正しいメールアドレスを入力してください" というエラーが表示される

Scenario: 電話番号が無効な場合エラーが表示される
  Given ユーザーが予約フォームにアクセスしている
  When 電話番号に "abc-defg-hijk" を入力する
  And 送信ボタンをクリックする
  Then "正しい電話番号を入力してください" というエラーが表示される

Scenario: 人数が0人の場合エラーが表示される
  Given ユーザーが予約フォームにアクセスしている
  When 人数に "0" を入力する
  And 送信ボタンをクリックする
  Then "1人以上を選択してください" というエラーが表示される
```

### After

```gherkin
Scenario Outline: 不正な入力でバリデーションエラーが表示される
  Given ユーザーが予約フォームにアクセスしている
  When <field> に "<invalid_value>" を入力する
  And 送信ボタンをクリックする
  Then "<error_message>" というエラーが表示される

  Examples:
    | field | invalid_value | error_message |
    | メールアドレス | invalid-email | 正しいメールアドレスを入力してください |
    | 電話番号 | abc-defg-hijk | 正しい電話番号を入力してください |
    | 人数 | 0 | 1人以上を選択してください |
```

### 改善ポイント

1. **類似シナリオを統合**
2. **テストケースの追加が容易**（Examplesに1行追加するだけ）
3. **保守性向上**（ロジック変更が1箇所で済む）

---

## パターン4: ステップ定義の再利用性向上

### 問題

類似したステップ定義が重複している。

### Before

```typescript
When('ユーザーがログインページにアクセスする', async ({ page }) => {
  await page.goto('/login');
});

When('ユーザーがダッシュボードページにアクセスする', async ({ page }) => {
  await page.goto('/dashboard');
});

When('ユーザーが予約ページにアクセスする', async ({ page }) => {
  await page.goto('/booking');
});
```

### After

```typescript
When('ユーザーが {string} にアクセスする', async ({ page }, url: string) => {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
});
```

### Gherkinも更新

```gherkin
When ユーザーが "/login" にアクセスする
When ユーザーが "/dashboard" にアクセスする
When ユーザーが "/booking" にアクセスする
```

### 改善ポイント

1. **パラメータ化による汎用性向上**
2. **ステップ定義数の削減**
3. **保守性向上**

---

## パターン5: フレーキーテストの修正

### 問題

固定待機時間を使用しているため、テストが不安定。

### Before

```typescript
Then('予約が作成される', async ({ page }) => {
  await page.click('[data-testid="submit-booking"]');
  await page.waitForTimeout(2000); // ❌ フレーキー
  const message = await page.locator('[data-testid="success-message"]').textContent();
  expect(message).toContain('予約を作成しました');
});
```

### After

```typescript
Then('予約が作成される', async ({ page }) => {
  await page.click('[data-testid="submit-booking"]');
  // ✅ 要素が表示されるまで待つ
  const message = await page.locator('[data-testid="success-message"]');
  await message.waitFor({ state: 'visible' });
  await expect(message).toHaveText('予約を作成しました');
});
```

### 改善ポイント

1. **`waitForTimeout` を `waitFor` に置き換え**
2. **テストの安定性向上**
3. **実行時間の短縮**（待機時間が動的に最適化）

---

## パターン6: テキストセレクタ → data-testid

### 問題

テキストセレクタを使用しているため、表示テキストが変わるとテストが壊れる。

### Before

```typescript
When('ログインボタンをクリックする', async ({ page }) => {
  await page.click('button:has-text("ログイン")'); // ❌ テキスト依存
});
```

### After

```typescript
When('ログインボタンをクリックする', async ({ page }) => {
  await page.click('[data-testid="login-button"]'); // ✅ data-testid
});
```

### コンポーネントも更新

```tsx
// Before
<button>ログイン</button>

// After
<button data-testid="login-button">ログイン</button>
```

### 改善ポイント

1. **data-testid による安定したセレクタ**
2. **多言語対応が容易**
3. **テストの保守性向上**

---

## パターン7: シナリオの独立性確保

### 問題

シナリオが実行順序に依存している。

### Before

```gherkin
Scenario: ユーザーを作成する
  When ユーザー "test@example.com" を作成する
  Then ユーザーが作成される

Scenario: 作成したユーザーでログインする  # ❌ 前のシナリオに依存
  When ユーザー "test@example.com" でログインする
  Then ログインに成功する
```

### After

```gherkin
Scenario: ユーザーを作成する
  When ユーザー "test@example.com" を作成する
  Then ユーザーが作成される

Scenario: 既存ユーザーでログインする  # ✅ 独立
  Given ユーザー "test@example.com" が存在する  # 前提条件を明示
  When ユーザー "test@example.com" でログインする
  Then ログインに成功する
```

### 改善ポイント

1. **各シナリオの前提条件を明示**
2. **並列実行が可能**
3. **テストの信頼性向上**

---

## パターン8: 境界値テストの追加

### 問題

ハッピーパスのみで境界値テストが不足。

### Before

```gherkin
Feature: 予約作成

Scenario: 有効な人数で予約を作成する
  Given ユーザーが予約フォームにアクセスしている
  When 人数に "4" を入力する
  And 予約ボタンをクリックする
  Then 予約が作成される
```

### After

```gherkin
Feature: 予約作成

Scenario: 有効な人数で予約を作成する
  Given ユーザーが予約フォームにアクセスしている
  When 人数に "4" を入力する
  And 予約ボタンをクリックする
  Then 予約が作成される

# ✅ 境界値テストを追加
Scenario Outline: 不正な人数でエラーが表示される
  Given ユーザーが予約フォームにアクセスしている
  When 人数に "<count>" を入力する
  And 予約ボタンをクリックする
  Then "<error_message>" というエラーが表示される

  Examples:
    | count | error_message |
    | 0 | 1人以上を選択してください |
    | -1 | 1人以上を選択してください |
    | 11 | 10人以下を選択してください |
```

### 改善ポイント

1. **境界値（最小-1、最小、最大、最大+1）をテスト**
2. **バグ検出能力向上**
3. **仕様の明確化**

---

## パターン9: セキュリティテストの追加

### 問題

XSS/CSRF対策のテストが不足。

### Before

```gherkin
Feature: 予約作成

Scenario: 有効なデータで予約を作成する
  When 名前に "山田太郎" を入力する
  Then 予約が作成される
```

### After

```gherkin
Feature: 予約作成

Scenario: 有効なデータで予約を作成する
  When 名前に "山田太郎" を入力する
  Then 予約が作成される

# ✅ セキュリティテストを追加
@security
Scenario: XSS攻撃を防ぐ
  When 名前に "<script>alert('XSS')</script>" を入力する
  And 予約ボタンをクリックする
  Then 予約が作成される
  And データベースに "&lt;script&gt;alert('XSS')&lt;/script&gt;" が保存される
  And 予約詳細ページでスクリプトが実行されない
```

### 改善ポイント

1. **XSS対策の確認**
2. **セキュリティ意識の向上**
3. **本番環境でのインシデント防止**

---

## パターン10: エラーメッセージの具体化

### 問題

エラーメッセージが曖昧で、何を確認すべきか不明確。

### Before

```gherkin
Then エラーが表示される
```

### After

```gherkin
Then "メールアドレスまたはパスワードが正しくありません" というエラーが表示される
```

### 改善ポイント

1. **期待値を明確化**
2. **仕様の文書化**
3. **テスト失敗時の原因特定が容易**

---

## パターン11: データテーブルの活用

### 問題

複数の値を検証する際、コードが冗長。

### Before

```gherkin
Then 予約詳細ページが表示される
And 顧客名が "山田太郎" である
And メールアドレスが "yamada@example.com" である
And 電話番号が "090-1234-5678" である
And 予約日時が "2026-01-15 18:00" である
And 人数が "4" である
```

### After

```gherkin
Then 予約詳細ページに以下の情報が表示される
  | field | value |
  | 顧客名 | 山田太郎 |
  | メールアドレス | yamada@example.com |
  | 電話番号 | 090-1234-5678 |
  | 予約日時 | 2026-01-15 18:00 |
  | 人数 | 4 |
```

### 改善ポイント

1. **可読性向上**
2. **検証項目の追加が容易**
3. **ステップ定義の簡素化**

---

## パターン12: マルチテナント分離の確認

### 問題

マルチテナントシステムなのに、テナント分離のテストがない。

### Before

```gherkin
Feature: 予約一覧表示

Scenario: 予約一覧を表示する
  Given 管理者がログイン済みである
  When 予約一覧ページにアクセスする
  Then 予約一覧が表示される
```

### After

```gherkin
Feature: 予約一覧表示

Scenario: 予約一覧を表示する
  Given 管理者がログイン済みである
  When 予約一覧ページにアクセスする
  Then 予約一覧が表示される

# ✅ テナント分離テストを追加
@security
Scenario: 別テナントの予約を閲覧できない
  Given テナントAの管理者がログイン済みである
  And テナントBに予約が存在する
  When 予約一覧ページにアクセスする
  Then テナントBの予約は表示されない
  And テナントAの予約のみが表示される
```

### 改善ポイント

1. **データ漏洩防止**
2. **セキュリティ強化**
3. **マルチテナント要件の明確化**

---

## 改善プロセス

### ステップ1: 問題の特定

分析ツールで以下を検出：
- 命令的シナリオ
- 重複するステップ
- フレーキーパターン
- カバレッジギャップ

### ステップ2: 優先度付け

| 優先度 | 改善内容 | 理由 |
|--------|---------|------|
| 🔴 高 | セキュリティテスト追加 | リスクが高い |
| 🔴 高 | フレーキーテスト修正 | 信頼性に影響 |
| 🟡 中 | 境界値テスト追加 | バグ検出能力向上 |
| 🟡 中 | 宣言的スタイルへの変換 | 保守性向上 |
| 🟢 低 | Background活用 | 可読性向上 |

### ステップ3: 段階的改善

1. **週1回のレビュー**: 新規シナリオの品質チェック
2. **月1回のリファクタリング**: 既存シナリオの改善
3. **四半期ごとの棚卸し**: 全体の品質評価

---

## まとめ

これらの改善パターンを適用することで、BDDテストの品質、保守性、信頼性が向上します。

重要なのは、**一度に全てを改善しようとせず、優先度の高いものから段階的に改善すること**です。
