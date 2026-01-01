# Next.js向けGherkinシナリオパターン集

## パターン一覧

### 1. 認証・認可パターン

#### 1-1. ログイン

```gherkin
Feature: ユーザーログイン

  @ui @smoke
  Scenario: 有効な認証情報でログインする
    Given ユーザーが "/login" ページにアクセスしている
    When ユーザーが以下の認証情報を入力する
      | field | value |
      | メールアドレス | user@example.com |
      | パスワード | Password123! |
    And ログインボタンをクリックする
    Then "/" ページにリダイレクトされる
    And ナビゲーションにユーザー名が表示される

  @ui @error
  Scenario: 無効なパスワードでログインを試みる
    Given ユーザーが "/login" ページにアクセスしている
    When ユーザーが無効なパスワードでログインを試みる
    Then "メールアドレスまたはパスワードが正しくありません" というエラーが表示される
    And ログインページに留まる
```

#### 1-2. アクセス制御

```gherkin
Feature: 管理者ページアクセス制御

  @security @smoke
  Scenario: 未認証ユーザーが管理者ページにアクセスを試みる
    Given ユーザーが未認証である
    When ユーザーが "/admin/dashboard" にアクセスを試みる
    Then "/login" ページにリダイレクトされる
    And "ログインが必要です" というメッセージが表示される

  @security
  Scenario: 一般ユーザーが管理者ページにアクセスを試みる
    Given 一般ユーザーがログイン済みである
    When ユーザーが "/admin/dashboard" にアクセスを試みる
    Then "403 Forbidden" ページが表示される
    And "アクセス権限がありません" というメッセージが表示される
```

---

### 2. CRUD操作パターン

#### 2-1. 作成（Create）

```gherkin
Feature: メニュー作成

  Background:
    Given 管理者がログイン済みである
    And 管理者が "/admin/menus/new" ページにアクセスしている

  @ui @smoke
  Scenario: 有効なデータでメニューを作成する
    When 管理者が以下のメニュー情報を入力する
      | field | value |
      | 名前 | カルボナーラ |
      | 説明 | 濃厚クリームソースのパスタ |
      | 価格 | 1200 |
      | カテゴリー | パスタ |
    And "作成" ボタンをクリックする
    Then メニュー一覧ページにリダイレクトされる
    And "メニューを作成しました" という成功メッセージが表示される
    And 作成したメニューが一覧に表示される

  @ui @validation
  Scenario: 必須項目が未入力の場合エラーが表示される
    When "作成" ボタンをクリックする
    Then 以下のバリデーションエラーが表示される
      | field | message |
      | 名前 | 名前を入力してください |
      | 価格 | 価格を入力してください |
```

#### 2-2. 読み取り（Read）

```gherkin
Feature: 予約詳細表示

  @ui @smoke
  Scenario: 予約詳細を表示する
    Given 管理者がログイン済みである
    And ID "123" の予約が存在する
    When 管理者が "/admin/reservations/123" にアクセスする
    Then 予約詳細ページが表示される
    And 以下の情報が表示される
      | field | value |
      | 顧客名 | 山田太郎 |
      | 予約日時 | 2026-01-15 18:00 |
      | 人数 | 4 |
      | ステータス | confirmed |

  @ui @error
  Scenario: 存在しない予約にアクセスする
    Given 管理者がログイン済みである
    When 管理者が "/admin/reservations/999" にアクセスする
    Then "404 Not Found" ページが表示される
    And "予約が見つかりません" というメッセージが表示される
```

#### 2-3. 更新（Update）

```gherkin
Feature: スタッフ情報更新

  Background:
    Given 管理者がログイン済みである
    And ID "1" のスタッフが存在する
    And 管理者が "/admin/staff/1/edit" ページにアクセスしている

  @ui @smoke
  Scenario: スタッフ情報を更新する
    When 管理者が名前を "佐藤次郎" に変更する
    And "更新" ボタンをクリックする
    Then スタッフ一覧ページにリダイレクトされる
    And "スタッフ情報を更新しました" という成功メッセージが表示される
    And スタッフ名が "佐藤次郎" に更新されている

  @concurrency
  Scenario: 同時更新による競合を検出する
    Given 別のユーザーが同じスタッフ情報を編集中である
    And 別のユーザーが先に更新を完了した
    When 管理者が "更新" ボタンをクリックする
    Then "データが変更されています。ページを再読み込みしてください" というエラーが表示される
```

#### 2-4. 削除（Delete）

```gherkin
Feature: 予約削除

  Background:
    Given 管理者がログイン済みである
    And ID "1" の予約が存在する

  @ui @smoke
  Scenario: 予約を削除する
    Given 管理者が "/admin/reservations/1" ページにアクセスしている
    When 管理者が "削除" ボタンをクリックする
    And 確認ダイアログで "削除" を選択する
    Then 予約一覧ページにリダイレクトされる
    And "予約を削除しました" という成功メッセージが表示される
    And ID "1" の予約が一覧から削除されている

  @ui
  Scenario: 削除確認でキャンセルする
    Given 管理者が "/admin/reservations/1" ページにアクセスしている
    When 管理者が "削除" ボタンをクリックする
    And 確認ダイアログで "キャンセル" を選択する
    Then 予約詳細ページに留まる
    And 予約は削除されていない
```

---

### 3. バリデーションパターン

#### 3-1. 必須項目チェック

```gherkin
  @validation
  Scenario Outline: 必須項目が未入力の場合エラーが表示される
    Given ユーザーが予約フォームにアクセスしている
    When <field> を空のまま送信する
    Then "<error_message>" というエラーが表示される

    Examples:
      | field | error_message |
      | 名前 | 名前を入力してください |
      | メールアドレス | メールアドレスを入力してください |
      | 電話番号 | 電話番号を入力してください |
```

#### 3-2. 形式バリデーション

```gherkin
  @validation
  Scenario Outline: 不正な形式の入力でエラーが表示される
    Given ユーザーが予約フォームにアクセスしている
    When <field> に "<invalid_value>" を入力する
    And 送信ボタンをクリックする
    Then "<error_message>" というエラーが表示される

    Examples:
      | field | invalid_value | error_message |
      | メールアドレス | invalid-email | 正しいメールアドレスを入力してください |
      | 電話番号 | abc-defg-hijk | 正しい電話番号を入力してください |
      | 予約日時 | 2026-99-99 | 正しい日付を入力してください |
```

#### 3-3. 境界値バリデーション

```gherkin
  @validation
  Scenario Outline: 範囲外の値でエラーが表示される
    Given ユーザーが予約フォームにアクセスしている
    When 人数に <count> を入力する
    And 送信ボタンをクリックする
    Then "<error_message>" というエラーが表示される

    Examples:
      | count | error_message |
      | 0 | 1人以上を選択してください |
      | 11 | 10人以下を選択してください |
```

---

### 4. API Routeパターン

#### 4-1. GET（一覧取得）

```gherkin
Feature: 予約一覧API

  @api @smoke
  Scenario: 認証済み管理者が予約一覧を取得する
    Given 管理者が認証済みである
    And tenant_id "demo-restaurant" に以下の予約が存在する
      | id | customer_name | status |
      | 1 | 山田太郎 | confirmed |
      | 2 | 佐藤花子 | pending |
    When "GET /api/admin/reservations" にリクエストを送信する
    Then ステータスコード 200 が返される
    And レスポンスに2件の予約が含まれる
    And 全ての予約に tenant_id "demo-restaurant" が設定されている

  @api @security
  Scenario: 別テナントの予約を取得できない
    Given 管理者が認証済みである
    And 管理者の tenant_id が "demo-restaurant" である
    And tenant_id "other-restaurant" に予約が存在する
    When "GET /api/admin/reservations" にリクエストを送信する
    Then レスポンスに "other-restaurant" の予約は含まれない
```

#### 4-2. POST（作成）

```gherkin
Feature: メニュー作成API

  @api @smoke
  Scenario: 有効なデータでメニューを作成する
    Given 管理者が認証済みである
    When "POST /api/admin/menus" に以下のボディを送信する
      """json
      {
        "name": "カルボナーラ",
        "description": "濃厚クリームソースのパスタ",
        "price": 1200,
        "category": "パスタ"
      }
      """
    Then ステータスコード 201 が返される
    And レスポンスに作成されたメニュー情報が含まれる
    And レスポンスに "id" が含まれる
    And データベースにメニューが保存されている

  @api @validation
  Scenario: 必須項目が欠けている場合エラーが返される
    Given 管理者が認証済みである
    When "POST /api/admin/menus" に以下のボディを送信する
      """json
      {
        "description": "濃厚クリームソースのパスタ"
      }
      """
    Then ステータスコード 400 が返される
    And エラーメッセージに "name" が必須であることが含まれる
```

#### 4-3. PATCH（更新）

```gherkin
Feature: 予約ステータス更新API

  @api @smoke
  Scenario: 予約ステータスを更新する
    Given 管理者が認証済みである
    And ID "1" のステータスが "pending" の予約が存在する
    When "PATCH /api/admin/reservations/1" に以下のボディを送信する
      """json
      {
        "status": "confirmed"
      }
      """
    Then ステータスコード 200 が返される
    And レスポンスの status が "confirmed" である
    And データベースの予約ステータスが "confirmed" に更新されている
```

#### 4-4. DELETE（削除）

```gherkin
Feature: スタッフ削除API

  @api @smoke
  Scenario: スタッフを削除する
    Given 管理者が認証済みである
    And ID "1" のスタッフが存在する
    When "DELETE /api/admin/staff/1" にリクエストを送信する
    Then ステータスコード 204 が返される
    And データベースから ID "1" のスタッフが削除されている

  @api @error
  Scenario: 存在しないスタッフの削除を試みる
    Given 管理者が認証済みである
    When "DELETE /api/admin/staff/999" にリクエストを送信する
    Then ステータスコード 404 が返される
    And エラーメッセージ "Staff not found" が返される
```

---

### 5. エラーハンドリングパターン

#### 5-1. ネットワークエラー

```gherkin
Feature: ネットワークエラー処理

  @error @ui
  Scenario: ネットワークエラー時にエラーメッセージが表示される
    Given ユーザーが予約フォームにアクセスしている
    And ネットワークが切断されている
    When ユーザーが予約を送信する
    Then "ネットワークエラーが発生しました" というエラーが表示される
    And リトライボタンが表示される
```

#### 5-2. サーバーエラー

```gherkin
Feature: サーバーエラー処理

  @error @ui
  Scenario: サーバーエラー時にエラーページが表示される
    Given APIサーバーがダウンしている
    When ユーザーが "/admin/dashboard" にアクセスする
    Then "500 Internal Server Error" ページが表示される
    And "一時的なエラーが発生しました。しばらくしてから再度お試しください" というメッセージが表示される
```

---

### 6. 同時実行制御パターン

```gherkin
Feature: 在庫管理（空席数）

  @concurrency @smoke
  Scenario: 最後の1席を2人が同時に予約する
    Given 18:00の枠に空きが1つだけある
    When ユーザーAとユーザーBが同時に18:00の予約を試みる
    Then 1人の予約のみが成功する
    And もう1人には "この時間帯は満席です" というエラーが表示される
    And データベースには1件の予約のみが保存されている
```

---

### 7. マルチテナントパターン

```gherkin
Feature: テナント分離

  @security @smoke
  Scenario: テナントAの管理者がテナントBのデータを閲覧できない
    Given テナントAの管理者がログイン済みである
    And テナントBに予約が存在する
    When "GET /api/admin/reservations" にリクエストを送信する
    Then テナントBの予約は含まれない
    And テナントAの予約のみが含まれる

  @security
  Scenario: URLパラメータでのテナント切り替えを防ぐ
    Given テナントAの管理者がログイン済みである
    When "GET /api/admin/reservations?tenant_id=tenant-b" にリクエストを送信する
    Then ステータスコード 403 が返される
    And エラーメッセージ "Forbidden" が返される
```

---

### 8. セキュリティパターン

#### 8-1. XSS対策

```gherkin
Feature: XSS保護

  @security
  Scenario: スクリプトタグがサニタライズされる
    Given ユーザーが予約フォームにアクセスしている
    When 名前フィールドに "<script>alert('XSS')</script>" を入力する
    And 予約を登録する
    Then データベースには "&lt;script&gt;alert('XSS')&lt;/script&gt;" が保存される
    And 予約詳細ページでスクリプトが実行されない
```

#### 8-2. CSRF対策

```gherkin
Feature: CSRF保護

  @security
  Scenario: CSRFトークンなしのリクエストが拒否される
    Given ユーザーがログイン済みである
    When CSRFトークンなしで "POST /api/reservations" にリクエストを送信する
    Then ステータスコード 403 が返される
    And エラーメッセージ "CSRF token missing" が返される
```

---

## タグ使用ガイドライン

| タグ | 使用場面 | 実行頻度 |
|-----|---------|---------|
| `@smoke` | クリティカルパス | 全PR |
| `@regression` | リグレッションテスト | リリース前 |
| `@api` | API Routes | API変更時 |
| `@ui` | UI/UX | UI変更時 |
| `@security` | セキュリティ | セキュリティ監査時 |
| `@concurrency` | 同時実行 | 負荷テスト時 |
| `@validation` | バリデーション | フォーム変更時 |
| `@error` | エラーハンドリング | エラー処理変更時 |
| `@slow` | 時間がかかるテスト | 夜間バッチ |

## 命名規則

### Feature名
- 簡潔で分かりやすい日本語
- 名詞形または動詞+名詞形
- 例: "ユーザーログイン", "予約一覧表示", "メニュー作成"

### Scenario名
- Given-When-Thenが明確に分かる日本語
- 具体的な振る舞いを記述
- 例: "有効な認証情報でログインする", "存在しない予約にアクセスする"

## ベストプラクティス

1. **宣言的スタイルを使う**
   - UIの詳細はステップ定義に隠蔽
   - ビジネスの意図を明確に記述

2. **シナリオの独立性を保つ**
   - 各シナリオは単独で実行可能
   - 実行順序に依存しない

3. **Backgroundを活用**
   - 共通の前提条件を抽出
   - DRY原則を守る

4. **データテーブルで網羅性を確保**
   - `Scenario Outline` で類似ケースを効率化
   - 境界値、等価クラスを明示

5. **タグで分類**
   - CI/CDでのテスト選択を容易にする
   - レポートの可読性を向上
