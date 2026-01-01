# language: ja
Feature: セキュリティヘッダー
  As a security-conscious application
  I want to set appropriate security headers
  So that I can protect users from common web vulnerabilities

  Background:
    Given アプリケーションが起動している

  Scenario: X-Frame-Optionsヘッダーが設定される（クリックジャッキング対策）
    When ホームページにアクセスする
    Then レスポンスヘッダー"X-Frame-Options"に"DENY"が設定される

  Scenario: X-Content-Type-Optionsヘッダーが設定される（MIMEスニッフィング防止）
    When ホームページにアクセスする
    Then レスポンスヘッダー"X-Content-Type-Options"に"nosniff"が設定される

  Scenario: Referrer-Policyヘッダーが設定される（リファラー情報の制限）
    When ホームページにアクセスする
    Then レスポンスヘッダー"Referrer-Policy"に"strict-origin-when-cross-origin"が設定される

  Scenario: Permissions-Policyヘッダーが設定される（不要な機能の無効化）
    When ホームページにアクセスする
    Then レスポンスヘッダー"Permissions-Policy"が設定される
    And "Permissions-Policy"ヘッダーに"camera=()"が含まれる
    And "Permissions-Policy"ヘッダーに"microphone=()"が含まれる
    And "Permissions-Policy"ヘッダーに"geolocation=()"が含まれる

  Scenario: Strict-Transport-Securityヘッダーが設定される（HTTPS強制）
    When ホームページにアクセスする
    Then レスポンスヘッダー"Strict-Transport-Security"が設定される
    And "Strict-Transport-Security"ヘッダーに"max-age"が含まれる

  Scenario: Content-Security-Policyヘッダーが設定される（XSS対策）
    When ホームページにアクセスする
    Then レスポンスヘッダー"Content-Security-Policy"が設定される
    And "Content-Security-Policy"ヘッダーに"default-src"が含まれる

  Scenario: 管理者ページにもセキュリティヘッダーが設定される
    When 管理者ダッシュボード"/admin/dashboard"にアクセスする
    Then レスポンスヘッダー"X-Frame-Options"に"DENY"が設定される
    And レスポンスヘッダー"Content-Security-Policy"が設定される
