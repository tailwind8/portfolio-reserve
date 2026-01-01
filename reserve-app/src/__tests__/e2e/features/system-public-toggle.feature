# language: ja

Feature: システム公開・非公開トグル
  管理者としてシステムの公開状態を制御したい

  Background:
    Given 管理者として認証済みである
    And 店舗設定ページ「/admin/settings」にアクセスしている

  Scenario: デフォルトで公開中になっている
    When ページが読み込まれる
    Then isPublicトグルがONになっている
    And isPublicラベルが「システム公開中」と表示される

  Scenario: システムを非公開に変更できる
    Given システムが公開中である
    When isPublicトグルをOFFにする
    And 保存ボタンをクリックする
    Then 「店舗設定を更新しました」という成功メッセージが表示される
    And isPublicトグルがOFFになっている

  Scenario: システムを公開に変更できる
    Given システムが非公開である
    When isPublicトグルをONにする
    And 保存ボタンをクリックする
    Then 「店舗設定を更新しました」という成功メッセージが表示される
    And isPublicトグルがONになっている

  Scenario: 非公開時は一般ページがメンテナンス画面にリダイレクトされる
    Given システムを非公開に変更して保存した
    When ホームページ「/」にアクセスする
    Then メンテナンスページ「/maintenance」にリダイレクトされる
    And メンテナンスタイトルが表示される

  Scenario: 非公開時でも管理画面にはアクセスできる
    Given システムを非公開に変更して保存した
    When 店舗設定ページ「/admin/settings」に直接アクセスする
    Then ページが正常に表示される
    And ページタイトルに「店舗設定」が表示される

  Scenario: ページをリロードしても設定が保持される
    Given システムを非公開に変更して保存した
    When ページをリロードする
    Then isPublicトグルがOFFのまま表示される
