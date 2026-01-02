# language: ja
Feature: スーパー管理者ログイン
  As a super administrator
  I want to log in to the super admin panel
  So that I can manage feature flags and tenant settings

  Issue: Phase 2

  ユーザーストーリー:
  開発者として、スーパー管理者専用のログイン画面から認証し、
  オプション機能の有効化/無効化やテナント管理を行いたい。
  店舗管理者や一般ユーザーはスーパー管理者機能にアクセスできないようにする。

  Background:
    Given スーパー管理者ログインページ"/super-admin/login"にアクセスしている

  # 基本表示
  Scenario: スーパー管理者ログインページが正しく表示される
    Then ページタイトルに「スーパー管理者ログイン」が表示される
    And ページ見出しに「スーパー管理者ログイン」が表示される
    And メールアドレス入力欄が表示される
    And パスワード入力欄が表示される
    And 「ログイン」ボタンが表示される
    And 注意書き「このページは開発者専用です」が表示される

  # 成功シナリオ
  Scenario: スーパー管理者が正しい認証情報でログインできる（ハッピーパス）
    Given スーパー管理者「contact@tailwind8.com」がパスワード「SuperAdmin2026!」で登録されている
    When メールアドレスに「contact@tailwind8.com」と入力する
    And パスワードに「SuperAdmin2026!」と入力する
    And 「ログイン」ボタンをクリックする
    Then ログインが成功する
    And スーパー管理者ダッシュボード「/super-admin/dashboard」にリダイレクトされる
    And ページ上部に「スーパー管理者」のロール表示がある

  # 失敗シナリオ - 権限不足
  Scenario: 店舗管理者（ADMIN）がスーパー管理者ログインを試みると拒否される
    Given 店舗管理者「admin@store.com」がロール「ADMIN」で登録されている
    When メールアドレスに「admin@store.com」と入力する
    And パスワードに「adminpass」と入力する
    And 「ログイン」ボタンをクリックする
    Then エラーメッセージ「スーパー管理者権限が必要です」が表示される
    And スーパー管理者ダッシュボードにリダイレクトされない

  Scenario: 一般ユーザー（CUSTOMER）がスーパー管理者ログインを試みると拒否される
    Given 一般ユーザー「customer@example.com」がロール「CUSTOMER」で登録されている
    When メールアドレスに「customer@example.com」と入力する
    And パスワードに「password123」と入力する
    And 「ログイン」ボタンをクリックする
    Then エラーメッセージ「スーパー管理者権限が必要です」が表示される
    And スーパー管理者ダッシュボードにリダイレクトされない

  # 失敗シナリオ - 認証エラー
  Scenario: 存在しないメールアドレスでログインを試みるとエラーが表示される
    When メールアドレスに「nonexistent@example.com」と入力する
    And パスワードに「password123」と入力する
    And 「ログイン」ボタンをクリックする
    Then エラーメッセージ「メールアドレスまたはパスワードが正しくありません」が表示される
    And ページはリダイレクトされない

  Scenario: 間違ったパスワードでログインを試みるとエラーが表示される
    Given スーパー管理者「contact@tailwind8.com」がパスワード「SuperAdmin2026!」で登録されている
    When メールアドレスに「contact@tailwind8.com」と入力する
    And パスワードに「wrongpassword」と入力する
    And 「ログイン」ボタンをクリックする
    Then エラーメッセージ「メールアドレスまたはパスワードが正しくありません」が表示される

  # バリデーションエラー
  Scenario: 必須項目が空欄の場合エラーが表示される
    When 何も入力せずに「ログイン」ボタンをクリックする
    Then エラーメッセージ「有効なメールアドレスを入力してください」が表示される
    And エラーメッセージ「パスワードを入力してください」が表示される
    And ページはリダイレクトされない

  Scenario: 無効なメールアドレス形式の場合エラーが表示される
    When メールアドレスに「invalid-email」と入力する
    And パスワードに「password」と入力する
    And 「ログイン」ボタンをクリックする
    Then エラーメッセージ「有効なメールアドレスを入力してください」が表示される

  # ミドルウェア保護（未認証アクセス）
  Scenario: 未認証でスーパー管理者ダッシュボードにアクセスするとログイン画面にリダイレクトされる
    When ブラウザで直接「/super-admin/dashboard」にアクセスする
    Then スーパー管理者ログインページ「/super-admin/login」にリダイレクトされる
    And エラーメッセージ「ログインが必要です」が表示される

  Scenario: 未認証でスーパー管理者機能フラグページにアクセスするとログイン画面にリダイレクトされる
    When ブラウザで直接「/super-admin/feature-flags」にアクセスする
    Then スーパー管理者ログインページ「/super-admin/login」にリダイレクトされる

  # ミドルウェア保護（権限不足）
  Scenario: 店舗管理者でログイン後、スーパー管理者ページにアクセスするとエラーになる
    Given 店舗管理者「admin@store.com」がロール「ADMIN」でログイン済み
    When ブラウザで直接「/super-admin/dashboard」にアクセスする
    Then エラーページ「403 Forbidden」が表示される
    And エラーメッセージ「このページへのアクセス権限がありません」が表示される

  Scenario: 一般ユーザーでログイン後、スーパー管理者ページにアクセスするとエラーになる
    Given 一般ユーザー「customer@example.com」がロール「CUSTOMER」でログイン済み
    When ブラウザで直接「/super-admin/dashboard」にアクセスする
    Then エラーページ「403 Forbidden」が表示される

  # セキュリティ
  Scenario: パスワードフィールドがマスクされている
    Then パスワード入力欄が「password」タイプである
    And 入力した文字が「●」で表示される

  Scenario: パスワードフィールドのオートコンプリートが設定されている
    Then パスワード入力欄にオートコンプリート属性が設定されている

  # アクセシビリティ
  Scenario: すべての入力欄にラベルが設定されている
    Then メールアドレス入力欄にラベル「メールアドレス」が設定されている
    And パスワード入力欄にラベル「パスワード」が設定されている

  Scenario: キーボード操作でフォームを送信できる
    Given メールアドレスとパスワードを入力している
    When パスワード入力欄でEnterキーを押す
    Then フォームが送信される

  # ローディング状態
  Scenario: 送信中はボタンがローディング状態になる
    Given メールアドレスとパスワードを入力している
    When 「ログイン」ボタンをクリックする
    Then ボタンがローディング状態になる
    And ボタンが無効化されている

  # セッション管理
  Scenario: スーパー管理者ログイン後、ログアウトできる
    Given スーパー管理者がログインしている
    When 「ログアウト」ボタンをクリックする
    Then スーパー管理者ログインページ「/super-admin/login」にリダイレクトされる
    And ログイン状態が解除される

  # リンク
  Scenario: 管理者ログインページへのリンクが表示される
    Then 「店舗管理者ログインはこちら」リンクが表示される
    And 「店舗管理者ログインはこちら」リンクのhrefが「/admin/login」である

  Scenario: 一般ユーザーログインページへのリンクが表示される
    Then 「一般ユーザーログインはこちら」リンクが表示される
    And 「一般ユーザーログインはこちら」リンクのhrefが「/login」である

  # レスポンシブデザイン
  Scenario: モバイルで正しく表示される
    Given モバイル画面サイズ（375x667）に設定している
    When スーパー管理者ログインページにアクセスする
    Then フォームが縦1列で表示される
    And すべての入力欄が読みやすく表示される

  # data-testid属性（E2Eテスト用）
  Scenario: すべてのインタラクティブ要素にdata-testid属性が設定されている
    Then メールアドレス入力欄にdata-testid="super-admin-email"が設定されている
    And パスワード入力欄にdata-testid="super-admin-password"が設定されている
    And ログインボタンにdata-testid="super-admin-login-button"が設定されている
