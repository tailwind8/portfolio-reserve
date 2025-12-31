# language: ja
Feature: ユーザー新規登録
  As a customer
  I want to register for an account
  So that I can make reservations

  Background:
    Given 新規登録ページにアクセスしている

  Scenario: 新規登録成功（ハッピーパス）
    When 名前に"山田太郎"を入力する
    And メールアドレスに"test-12345@example.com"を入力する
    And 電話番号に"090-1234-5678"を入力する
    And パスワードに"password123"を入力する
    And パスワード確認に"password123"を入力する
    And 利用規約に同意する
    And "アカウントを作成"ボタンをクリックする
    Then 成功メッセージ"Registration successful"が表示される
    And ログインページ"/login"にリダイレクトされる

  Scenario: バリデーションエラー（必須項目未入力）
    When 何も入力せずに"アカウントを作成"ボタンをクリックする
    Then エラーメッセージ"Name is required"が表示される
    And エラーメッセージ"Invalid email address"が表示される

  Scenario: バリデーションエラー（パスワード不一致）
    When 名前に"Test User"を入力する
    And メールアドレスに"test@example.com"を入力する
    And パスワードに"password123"を入力する
    And パスワード確認に"different password"を入力する
    And 利用規約に同意する
    And "アカウントを作成"ボタンをクリックする
    Then エラーメッセージ"Passwords do not match"が表示される

  Scenario: バリデーションエラー（弱いパスワード）
    When 名前に"Test User"を入力する
    And メールアドレスに"test@example.com"を入力する
    And パスワードに"weak"を入力する
    And パスワード確認に"weak"を入力する
    And 利用規約に同意する
    And "アカウントを作成"ボタンをクリックする
    Then エラーメッセージ"Password must be at least 8 characters"が表示される

  Scenario: バリデーションエラー（利用規約未同意）
    When 名前に"Test User"を入力する
    And メールアドレスに"test@example.com"を入力する
    And パスワードに"password123"を入力する
    And パスワード確認に"password123"を入力する
    And "アカウントを作成"ボタンをクリックする
    Then エラーメッセージ"You must accept the terms and conditions"が表示される
