# language: ja
Feature: メニュー一覧表示
  As a customer
  I want to view the menu list
  So that I can choose services before booking

  Background:
    Given メニュー一覧ページにアクセスしている

  Scenario: すべてのアクティブなメニューが表示される
    When ページが読み込まれる
    Then ページタイトル"メニュー一覧"が表示される
    And すべてのアクティブなメニューが表示される
    And 各メニューに名前が表示される
    And 各メニューに料金が表示される
    And 各メニューに所要時間が表示される
    And 各メニューに説明が表示される

  Scenario: カテゴリ別にメニューがグループ化されている
    When ページが読み込まれる
    Then カテゴリ見出しが表示される
    And 各カテゴリ配下に該当メニューが表示される

  Scenario: メニューから予約ページへ遷移できる
    When ページが読み込まれる
    And 最初のメニューの"このメニューで予約"ボタンをクリックする
    Then 予約ページ"/booking"にリダイレクトされる
    And メニューIDがクエリパラメータに含まれている

  Scenario: 料金が正しいフォーマットで表示される
    When ページが読み込まれる
    Then 料金が¥記号付きで表示される
    And 料金が3桁ごとにカンマ区切りで表示される

  Scenario: 所要時間が分表示される
    When ページが読み込まれる
    Then 所要時間が"分"単位で表示される

  Scenario: メニューが存在しない場合の表示
    Given メニューが1件も存在しない
    When メニュー一覧ページにアクセスする
    Then "メニューが見つかりません"というメッセージが表示される

  Scenario: ローディング状態が表示される
    Given ユーザーがメニュー一覧ページにアクセスする
    When データ取得中である
    Then ローディングインジケーターが表示される
    And メニューカードは表示されない

  Scenario: APIエラー時のエラー表示
    Given APIがエラーを返す
    When メニュー一覧ページにアクセスする
    Then エラーメッセージが表示される
    And メニューカードは表示されない

  Scenario: メニューカードにホバー効果が適用される
    When ページが読み込まれる
    And メニューカードにマウスを重ねる
    Then シャドウが強調される
