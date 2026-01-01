# language: ja
Feature: ホームページ（トップページ）
  As a visitor
  I want to view the home page
  So that I can understand the booking system and navigate to other pages

  Background:
    Given ホームページにアクセスしている

  Scenario: ホームページが正しくレンダリングされる
    Then ページタイトルに"予約システム"が含まれる
    And ヘッダーが表示される
    And ヒーローセクションの見出し"店舗専用の予約管理システムで"が表示される
    And CTAボタン"今すぐ予約する"が表示される
    And CTAボタン"無料で始める"が表示される

  Scenario: 主な機能セクションが表示される
    Then 見出し"主な機能"が表示される
    And 機能カード"24時間予約受付"が表示される
    And 機能カード"顧客管理"が表示される
    And 機能カード"自動メール送信"が表示される
    And 機能カード"スタッフ管理"が表示される
    And 機能カード"分析レポート"が表示される
    And 機能カード"スマホ完全対応"が表示される

  Scenario: 予約ボタンから予約ページに遷移できる
    When CTAボタン"今すぐ予約する"をクリックする
    Then 予約ページ"/booking"にリダイレクトされる

  Scenario: デモ表示の注意書きが表示される
    Then "これはデモサイトです"というテキストが表示される

  Scenario: レスポンシブデザイン（モバイル表示）
    Given モバイル表示に設定している
    When ホームページにアクセスする
    Then ヒーローセクションの見出し"店舗専用の予約管理システムで"が表示される

  Scenario: レスポンシブデザイン（デスクトップ表示）
    Given デスクトップ表示に設定している
    When ホームページにアクセスする
    Then ヒーローセクションの見出し"店舗専用の予約管理システムで"が表示される

  Scenario: ナビゲーションリンク（ログイン）が機能する
    When ヘッダーの"ログイン"リンクをクリックする
    Then ログインページ"/login"にリダイレクトされる

  Scenario: ナビゲーションリンク（新規登録）が機能する（モバイル用フォールバック）
    When ヘッダーの"新規登録"リンクをクリックする
    Then 登録ページ"/register"にリダイレクトされる
