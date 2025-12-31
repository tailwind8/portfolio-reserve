# language: ja
Feature: 管理者ログイン
  As a store admin
  I want to log in to the admin panel
  So that I can manage reservations

  Background:
    Given 管理者ログインページにアクセスしている

  Scenario: 管理者ログイン成功（ハッピーパス）
    When メールアドレスに"admin@store.com"を入力する
    And パスワードに"adminpass"を入力する
    And "ログイン"ボタンをクリックする
    Then 管理者ダッシュボード"/admin/dashboard"にリダイレクトされる
    And 管理者名が表示される

  Scenario: バリデーションエラー（空フィールド）
    When 何も入力せずに"ログイン"ボタンをクリックする
    Then エラーメッセージ"Invalid email address"が表示される
    And エラーメッセージ"Password is required"が表示される

  Scenario: ログイン失敗（無効な認証情報）
    When メールアドレスに"wrong@example.com"を入力する
    And パスワードに"wrongpassword"を入力する
    And "ログイン"ボタンをクリックする
    Then エラーメッセージ"Invalid email or password"が表示される

  Scenario: 一般ユーザーでの管理者ログイン試行（失敗）
    Given 一般ユーザー"customer@example.com"が存在する
    When メールアドレスに"customer@example.com"を入力する
    And パスワードに"password123"を入力する
    And "ログイン"ボタンをクリックする
    Then エラーメッセージ"Access denied. Admin privileges required"が表示される
    And 管理者ダッシュボードにリダイレクトされない

  Scenario: ログアウト機能
    Given 管理者がログインしている
    When "ログアウト"ボタンをクリックする
    Then 管理者ログインページ"/admin/login"にリダイレクトされる
    And ログイン状態が解除される

  Scenario: セッション管理（ログイン状態保持）
    Given 管理者ログインページにアクセスしている
    When メールアドレスに"admin@store.com"を入力する
    And パスワードに"adminpass"を入力する
    And "ログイン状態を保持する"チェックボックスをチェックする
    And "ログイン"ボタンをクリックする
    Then 管理者ダッシュボードにリダイレクトされる
    When ブラウザを閉じて再度管理者ダッシュボードにアクセスする
    Then ログイン状態が保持されている
    And 管理者ダッシュボードが表示される

  Scenario: セッション管理（ログイン状態を保持しない）
    Given 管理者ログインページにアクセスしている
    When メールアドレスに"admin@store.com"を入力する
    And パスワードに"adminpass"を入力する
    And "ログイン状態を保持する"チェックボックスをチェックしない
    And "ログイン"ボタンをクリックする
    Then 管理者ダッシュボードにリダイレクトされる
    When ブラウザを閉じて再度管理者ダッシュボードにアクセスする
    Then 管理者ログインページにリダイレクトされる

  Scenario: 一般ユーザーログインページへのリンク確認
    Then "一般ユーザーログインはこちら"リンクが表示される
    And "一般ユーザーログインはこちら"リンクのhrefが"/login"である

  Scenario: パスワードリセットリンクの確認
    Then "パスワードをお忘れですか？"リンクが表示される
    And "パスワードをお忘れですか？"リンクのhrefが"/admin/reset-password"である

