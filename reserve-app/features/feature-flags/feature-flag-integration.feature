# language: ja
Feature: 機能フラグ連動 - ユーザー画面での動的表示制御
  As a store owner
  I want features to be shown/hidden based on feature flags
  So that only purchased features are available to users

  Issue: Phase 4, #95-98

  ユーザーストーリー:
  スーパー管理者が機能フラグをON/OFFすると、
  一般ユーザーや店舗管理者の画面で対応する機能が動的に表示/非表示される。

  Background:
    Given データベースにテナント「demo-booking」の機能フラグが設定されている

  # ====================
  # 一般ユーザー向けAPI
  # ====================

  Scenario: 一般ユーザーが機能フラグを取得できる
    When "/api/feature-flags"にGETリクエストを送る
    Then レスポンスステータスコードが200である
    And レスポンスに以下の機能フラグが含まれる
      | フラグ名 | 値 |
      | enableStaffSelection | true |
      | enableStaffShiftManagement | true |
      | enableCustomerManagement | true |
      | enableReservationUpdate | false |
      | enableReminderEmail | true |
      | enableManualReservation | true |
      | enableAnalyticsReport | true |
      | enableRepeatRateAnalysis | false |
      | enableCouponFeature | false |
      | enableLineNotification | false |

  Scenario: 認証なしでも機能フラグを取得できる（読み取り専用）
    When 未認証で"/api/feature-flags"にGETリクエストを送る
    Then レスポンスステータスコードが200である
    And 機能フラグが返される

  Scenario: 機能フラグが存在しない場合はデフォルト値を返す
    Given テナントの機能フラグが存在しない
    When "/api/feature-flags"にGETリクエストを送る
    Then レスポンスステータスコードが200である
    And すべての機能フラグがfalseで返される

  # ====================
  # 予約フォーム - スタッフ指名機能
  # ====================

  Scenario: スタッフ指名機能がONの場合、予約フォームにスタッフ選択が表示される
    Given 「enableStaffSelection」がtrueに設定されている
    When 予約ページ"/booking"にアクセスする
    Then スタッフ選択フィールドが表示される
    And スタッフ選択フィールドにdata-testid="staff-select"が設定されている

  Scenario: スタッフ指名機能がOFFの場合、予約フォームにスタッフ選択が表示されない
    Given 「enableStaffSelection」がfalseに設定されている
    When 予約ページ"/booking"にアクセスする
    Then スタッフ選択フィールドが表示されない

  # ====================
  # 予約フォーム - クーポン機能
  # ====================

  Scenario: クーポン機能がONの場合、予約フォームにクーポン入力が表示される
    Given 「enableCouponFeature」がtrueに設定されている
    When 予約ページ"/booking"にアクセスする
    Then クーポン入力フィールドが表示される
    And クーポン入力フィールドにdata-testid="coupon-input"が設定されている

  Scenario: クーポン機能がOFFの場合、予約フォームにクーポン入力が表示されない
    Given 「enableCouponFeature」がfalseに設定されている
    When 予約ページ"/booking"にアクセスする
    Then クーポン入力フィールドが表示されない

  # ====================
  # 管理者ダッシュボード - 分析レポート
  # ====================

  Scenario: 分析レポート機能がONの場合、ダッシュボードに分析レポートが表示される
    Given 「enableAnalyticsReport」がtrueに設定されている
    And 管理者がログイン済み
    When 管理者ダッシュボード"/admin/dashboard"にアクセスする
    Then 分析レポートセクションが表示される
    And 分析レポートセクションにdata-testid="analytics-report"が設定されている

  Scenario: 分析レポート機能がOFFの場合、ダッシュボードに分析レポートが表示されない
    Given 「enableAnalyticsReport」がfalseに設定されている
    And 管理者がログイン済み
    When 管理者ダッシュボード"/admin/dashboard"にアクセスする
    Then 分析レポートセクションが表示されない

  # ====================
  # 管理者ダッシュボード - リピート率分析
  # ====================

  Scenario: リピート率分析機能がONの場合、ダッシュボードにリピート率分析が表示される
    Given 「enableRepeatRateAnalysis」がtrueに設定されている
    And 管理者がログイン済み
    When 管理者ダッシュボード"/admin/dashboard"にアクセスする
    Then リピート率分析セクションが表示される
    And リピート率分析セクションにdata-testid="repeat-rate-analysis"が設定されている

  Scenario: リピート率分析機能がOFFの場合、ダッシュボードにリピート率分析が表示されない
    Given 「enableRepeatRateAnalysis」がfalseに設定されている
    And 管理者がログイン済み
    When 管理者ダッシュボード"/admin/dashboard"にアクセスする
    Then リピート率分析セクションが表示されない

  # ====================
  # 管理者メニュー - スタッフ管理
  # ====================

  Scenario: スタッフシフト管理機能がONの場合、管理者メニューに「スタッフ管理」が表示される
    Given 「enableStaffShiftManagement」がtrueに設定されている
    And 管理者がログイン済み
    When 管理者ダッシュボード"/admin/dashboard"にアクセスする
    Then ナビゲーションに「スタッフ管理」リンクが表示される
    And 「スタッフ管理」リンクにdata-testid="nav-staff-management"が設定されている

  Scenario: スタッフシフト管理機能がOFFの場合、管理者メニューに「スタッフ管理」が表示されない
    Given 「enableStaffShiftManagement」がfalseに設定されている
    And 管理者がログイン済み
    When 管理者ダッシュボード"/admin/dashboard"にアクセスする
    Then ナビゲーションに「スタッフ管理」リンクが表示されない

  # ====================
  # 管理者メニュー - 顧客管理
  # ====================

  Scenario: 顧客管理機能がONの場合、管理者メニューに「顧客管理」が表示される
    Given 「enableCustomerManagement」がtrueに設定されている
    And 管理者がログイン済み
    When 管理者ダッシュボード"/admin/dashboard"にアクセスする
    Then ナビゲーションに「顧客管理」リンクが表示される
    And 「顧客管理」リンクにdata-testid="nav-customer-management"が設定されている

  Scenario: 顧客管理機能がOFFの場合、管理者メニューに「顧客管理」が表示されない
    Given 「enableCustomerManagement」がfalseに設定されている
    And 管理者がログイン済み
    When 管理者ダッシュボード"/admin/dashboard"にアクセスする
    Then ナビゲーションに「顧客管理」リンクが表示されない

  # ====================
  # リアルタイム更新
  # ====================

  Scenario: 機能フラグが変更されたらページをリロードすると反映される
    Given 「enableCouponFeature」がfalseに設定されている
    And 予約ページ"/booking"にアクセスしている
    And クーポン入力フィールドが表示されていない
    When スーパー管理者が「enableCouponFeature」をtrueに変更する
    And 予約ページをリロードする
    Then クーポン入力フィールドが表示される

  # ====================
  # エラーハンドリング
  # ====================

  Scenario: API取得失敗時は安全側に倒す（すべてOFF）
    Given 機能フラグAPIが500エラーを返す
    When 予約ページ"/booking"にアクセスする
    Then スタッフ選択フィールドが表示されない
    And クーポン入力フィールドが表示されない

  Scenario: ネットワークエラー時は安全側に倒す（すべてOFF）
    Given ネットワークエラーが発生する
    When 予約ページ"/booking"にアクセスする
    Then スタッフ選択フィールドが表示されない
    And クーポン入力フィールドが表示されない

  # ====================
  # パフォーマンス
  # ====================

  Scenario: 機能フラグのロード中はローディング表示される
    When 予約ページ"/booking"にアクセスする
    Then 機能フラグのローディング中はスケルトン表示される

  # ====================
  # useFeatureFlagsフック
  # ====================

  Scenario: useFeatureFlagsフックで機能フラグを取得できる
    Given React コンポーネント内でuseFeatureFlagsフックを使用する
    Then 機能フラグオブジェクトが返される
    And isLoadingフラグが初期状態trueである
    And API取得完了後、isLoadingフラグがfalseになる
    And 取得した機能フラグが反映される

  Scenario: useFeatureFlagsフックがエラー時に安全な値を返す
    Given 機能フラグAPIがエラーを返す
    When React コンポーネント内でuseFeatureFlagsフックを使用する
    Then すべての機能フラグがfalseで返される
    And errorオブジェクトにエラー情報が含まれる
