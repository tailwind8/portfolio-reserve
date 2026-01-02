# language: ja
Feature: スーパー管理者 - 機能フラグ管理
  As a super administrator
  I want to manage feature flags for optional features
  So that I can enable or disable features based on customer purchases

  Issue: Phase 3, #95-98

  ユーザーストーリー:
  ココナラでオプション機能を購入した顧客に対して、
  スーパー管理者が機能フラグを有効化することで、
  店舗側が購入済みオプションのみ利用できるようにする。

  Background:
    Given スーパー管理者がログイン済み
    And 機能フラグ管理ページ"/super-admin/feature-flags"にアクセスしている

  # 基本表示
  Scenario: 機能フラグ管理ページが正しく表示される
    Then ページタイトルに「機能フラグ管理」が表示される
    And ページ見出しに「機能フラグ管理」が表示される
    And テナント選択ドロップダウンが表示される
    And 10種類のオプション機能トグルスイッチが表示される
    And 「保存」ボタンが表示される

  # 機能フラグ一覧表示
  Scenario: 10種類のオプション機能が表示される
    Then 以下の機能フラグが表示される
      | 機能名 | フラグ名 | 価格 |
      | スタッフ指名機能 | enableStaffSelection | +8,000円 |
      | スタッフシフト管理 | enableStaffShiftManagement | +10,000円 |
      | 顧客管理・メモ機能 | enableCustomerManagement | +12,000円 |
      | 予約変更機能 | enableReservationUpdate | +5,000円 |
      | リマインダーメール | enableReminderEmail | +8,000円 |
      | 予約手動追加 | enableManualReservation | +6,000円 |
      | 分析レポート | enableAnalyticsReport | +15,000円 |
      | リピート率分析 | enableRepeatRateAnalysis | +12,000円 |
      | クーポン機能 | enableCouponFeature | +18,000円 |
      | LINE通知連携 | enableLineNotification | +20,000円 |

  # 初期状態の確認
  Scenario: デモテナントの初期状態が正しく表示される
    When テナント「demo-booking」を選択する
    Then 以下の機能フラグがONになっている
      | スタッフ指名機能 |
      | スタッフシフト管理 |
      | 顧客管理・メモ機能 |
      | リマインダーメール |
      | 予約手動追加 |
      | 分析レポート |
    And 以下の機能フラグがOFFになっている
      | 予約変更機能 |
      | リピート率分析 |
      | クーポン機能 |
      | LINE通知連携 |

  # トグル操作
  Scenario: 機能フラグをONにできる
    Given 「予約変更機能」がOFFの状態
    When 「予約変更機能」のトグルスイッチをクリックする
    Then 「予約変更機能」のトグルスイッチがONになる
    And 「保存」ボタンが有効化される

  Scenario: 機能フラグをOFFにできる
    Given 「スタッフ指名機能」がONの状態
    When 「スタッフ指名機能」のトグルスイッチをクリックする
    Then 「スタッフ指名機能」のトグルスイッチがOFFになる
    And 「保存」ボタンが有効化される

  # 一括操作
  Scenario: すべての機能フラグをONにできる
    When 「すべて有効化」ボタンをクリックする
    Then すべての機能フラグがONになる
    And 「保存」ボタンが有効化される

  Scenario: すべての機能フラグをOFFにできる
    When 「すべて無効化」ボタンをクリックする
    Then すべての機能フラグがOFFになる
    And 「保存」ボタンが有効化される

  # 保存処理
  Scenario: 機能フラグの変更を保存できる（ハッピーパス）
    Given 「予約変更機能」をONにする
    And 「クーポン機能」をONにする
    When 「保存」ボタンをクリックする
    Then 保存中のローディング表示がされる
    And 成功メッセージ「機能フラグを更新しました」が表示される
    And 「保存」ボタンが無効化される

  Scenario: 変更がない場合は保存ボタンが無効
    Given 機能フラグを変更していない
    Then 「保存」ボタンが無効化されている

  Scenario: 保存後にページをリロードしても変更が保持される
    Given 「予約変更機能」をONにして保存済み
    When ページをリロードする
    Then 「予約変更機能」がONの状態で表示される

  # エラーハンドリング
  Scenario: 保存時にAPIエラーが発生した場合
    Given 「予約変更機能」をONにする
    And APIが500エラーを返す
    When 「保存」ボタンをクリックする
    Then エラーメッセージ「保存に失敗しました。もう一度お試しください。」が表示される
    And 変更内容が保持されている

  Scenario: ネットワークエラー時のハンドリング
    Given 「予約変更機能」をONにする
    And ネットワークエラーが発生する
    When 「保存」ボタンをクリックする
    Then エラーメッセージ「ネットワークエラーが発生しました」が表示される

  # テナント切り替え
  Scenario: テナントを切り替えると機能フラグが再読み込みされる
    Given テナント「demo-booking」を選択している
    When テナント「another-tenant」を選択する
    Then ローディング表示がされる
    And テナント「another-tenant」の機能フラグが表示される

  # UI状態
  Scenario: 実装済み機能には「実装済み」バッジが表示される
    Then 「スタッフ指名機能」に「実装済み」バッジが表示される
    And 「顧客管理・メモ機能」に「実装済み」バッジが表示される
    And 「リマインダーメール」に「実装済み」バッジが表示される
    And 「予約手動追加」に「実装済み」バッジが表示される
    And 「分析レポート」に「実装済み」バッジが表示される
    And 「スタッフシフト管理」に「実装済み」バッジが表示される

  Scenario: 未実装機能には「未実装」バッジが表示される
    Then 「予約変更機能」に「未実装」バッジが表示される
    And 「リピート率分析」に「未実装」バッジが表示される
    And 「クーポン機能」に「未実装」バッジが表示される
    And 「LINE通知連携」に「未実装」バッジが表示される

  # アクセシビリティ
  Scenario: すべてのトグルスイッチにラベルが設定されている
    Then 各機能フラグにアクセシブルなラベルが設定されている

  Scenario: キーボード操作でトグルスイッチを操作できる
    When 「スタッフ指名機能」のトグルスイッチにフォーカスする
    And Spaceキーを押す
    Then 「スタッフ指名機能」のトグルスイッチが切り替わる

  # セキュリティ
  Scenario: 一般ユーザーは機能フラグ管理ページにアクセスできない
    Given 一般ユーザーがログインしている
    When 機能フラグ管理ページ"/super-admin/feature-flags"にアクセスする
    Then エラーページ「403 Forbidden」が表示される

  Scenario: 店舗管理者は機能フラグ管理ページにアクセスできない
    Given 店舗管理者がログインしている
    When 機能フラグ管理ページ"/super-admin/feature-flags"にアクセスする
    Then エラーページ「403 Forbidden」が表示される

  # レスポンシブデザイン
  Scenario: モバイルで正しく表示される
    Given モバイル画面サイズ（375x667）に設定している
    When 機能フラグ管理ページにアクセスする
    Then 機能フラグが縦1列で表示される
    And すべてのトグルスイッチが操作可能である

  # data-testid属性
  Scenario: すべてのインタラクティブ要素にdata-testid属性が設定されている
    Then テナント選択ドロップダウンにdata-testid="tenant-select"が設定されている
    And 各トグルスイッチにdata-testid="toggle-{機能名}"が設定されている
    And 保存ボタンにdata-testid="save-feature-flags"が設定されている
    And すべて有効化ボタンにdata-testid="enable-all"が設定されている
    And すべて無効化ボタンにdata-testid="disable-all"が設定されている
