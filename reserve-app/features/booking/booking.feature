# language: ja
Feature: 予約機能
  As a customer
  I want to book a service
  So that I can reserve my preferred time slot

  Background:
    Given 予約ページにアクセスしている

  Scenario: 予約ページが正しく表示される
    When ページが読み込まれる
    Then ページタイトル"予約カレンダー"が表示される
    And カレンダーが表示される
    And 予約情報サイドバーが表示される
    And メニュー選択ドロップダウンが表示される
    And スタッフ選択ドロップダウンが表示される

  Scenario: メニューとスタッフがAPIから読み込まれる
    When ページが読み込まれる
    Then メニュー選択ドロップダウンにオプションが表示される
    And スタッフ選択ドロップダウンにオプションが表示される

  Scenario: 過去の日付が選択できない
    When ページが読み込まれる
    Then 過去の日付ボタンが無効化されている

  Scenario: メニュー選択後に日付を選択すると時間帯が表示される
    When メニューを選択する
    And 未来の日付"15日"を選択する
    And 1秒待つ
    Then "時間帯を選択"セクションが表示される

  Scenario: すべての必須項目を入力すると予約確定ボタンが有効になる
    When メニューを選択する
    And スタッフを選択する
    And 未来の日付"15日"を選択する
    And 1秒待つ
    And 利用可能な時間帯を選択する
    Then "予約を確定する"ボタンが有効になる

  Scenario: 予約確定ボタンは初期状態で無効
    When ページが読み込まれる
    Then "予約を確定する"ボタンが無効である

  Scenario: 月のナビゲーションが機能する
    When ページが読み込まれる
    And 現在の月を記録する
    When "次月 →"ボタンをクリックする
    Then 月が変更されている
    When "← 前月"ボタンをクリックする
    Then 元の月に戻っている

  Scenario: 機能セクションが表示される
    When ページが読み込まれる
    Then "24時間予約OK"が表示される
    And "確認メール送信"が表示される
    And "リマインダー"が表示される

  Scenario: 備考フィールドが機能する
    When ページが読み込まれる
    Then 備考フィールドが表示される
    When 備考フィールドに"窓際の席を希望します"と入力する
    Then 文字カウンター"/500文字"が表示される

  Scenario: URLパラメータからメニューIDを読み取る
    Given クエリパラメータ"menuId=test-menu-id"付きで予約ページにアクセスする
    When ページが読み込まれる
    Then メニュー選択ドロップダウンが表示される
