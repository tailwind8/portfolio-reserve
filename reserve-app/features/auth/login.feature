# language: ja
Feature: ユーザーログイン
  As a customer
  I want to log in to my account
  So that I can access my reservations

  Background:
    Given ログインページにアクセスしている

  Scenario: バリデーションエラー（空フィールド）
    When 何も入力せずに"ログイン"ボタンをクリックする
    Then エラーメッセージ"Invalid email address"が表示される
    And エラーメッセージ"Password is required"が表示される

  Scenario: ログイン失敗（無効な認証情報）
    When メールアドレスに"nonexistent@example.com"を入力する
    And パスワードに"wrongpassword"を入力する
    And "ログイン"ボタンをクリックする
    Then エラーメッセージ"Invalid email or password"が表示される

  Scenario: 新規登録リンクの確認
    Then "新規登録"リンクが表示される
    And "新規登録"リンクのhrefが"/register"である

  Scenario: 管理者ログインリンクの確認
    Then "管理者ログインはこちら"リンクが表示される
    And "管理者ログインはこちら"リンクのhrefが"/admin/login"である

  Scenario: パスワードリセットリンクの確認
    Then "お忘れですか？"リンクが表示される
    And "お忘れですか？"リンクのhrefが"/reset-password"である

  Scenario: ログイン状態保持チェックボックス
    Then "remember"チェックボックスが表示される
    And "remember"チェックボックスがデフォルトで未チェックである
    When "remember"チェックボックスをチェックする
    Then "remember"チェックボックスがチェック済みになる

  Scenario: 完全な登録とログインフロー
    # ステップ1: 新規登録
    Given 新規登録ページにアクセスしている
    When 名前に"田中花子"を入力する
    And メールアドレスに"tanaka-12345@example.com"を入力する
    And パスワードに"securePassword123"を入力する
    And パスワード確認に"securePassword123"を入力する
    And 利用規約に同意する
    And "アカウントを作成"ボタンをクリックする
    Then ログインページ"/login"にリダイレクトされる
    # ステップ2: ログイン
    When メールアドレスに"tanaka-12345@example.com"を入力する
    And パスワードに"securePassword123"を入力する
    And "ログイン"ボタンをクリックする
    Then ホームページ"/"にリダイレクトされる
