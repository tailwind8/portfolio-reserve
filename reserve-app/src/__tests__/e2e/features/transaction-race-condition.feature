Feature: トランザクション処理によるRace Condition防止
  予約システムにおける並行処理時のデータ整合性を保証するため、
  トランザクション処理を実装してRace Conditionを防止する。

  Background:
    Given 管理者 "admin@example.com" がログイン済み
    And 顧客 "tanaka@example.com" がシステムに登録済み
    And 顧客 "suzuki@example.com" がシステムに登録済み
    And メニュー "カット" (60分、5000円) が利用可能
    And スタッフ "佐藤花子" が勤務可能

  # シナリオ1: 管理者予約作成のRace Condition防止
  Scenario: 管理者が同時に同じ時間帯の予約を作成しようとした場合、1つだけ成功する
    Given 予約日時 "2026-01-25 14:00" が空いている
    When 管理者が同時に2つの予約リクエストを送信する
      | 顧客ID           | メニューID | スタッフID | 予約日      | 予約時間 |
      | tanaka_user_id   | menu_id    | staff_id   | 2026-01-25 | 14:00    |
      | suzuki_user_id   | menu_id    | staff_id   | 2026-01-25 | 14:00    |
    Then 1つの予約のみ成功する
    And もう1つの予約は "TIME_SLOT_CONFLICT" エラーで失敗する
    And データベースに1件の予約のみ登録される

  Scenario: 管理者予約作成中にユーザー確認が失敗した場合、予約が作成されない
    Given 予約日時 "2026-01-25 14:00" が空いている
    When 管理者が存在しないユーザーIDで予約を作成しようとする
      | 顧客ID           | メニューID | スタッフID | 予約日      | 予約時間 |
      | invalid_user_id  | menu_id    | staff_id   | 2026-01-25 | 14:00    |
    Then 予約作成は "USER_NOT_FOUND" エラーで失敗する
    And データベースに予約が登録されない
    And トランザクションがロールバックされる

  Scenario: 管理者予約作成中にメニュー確認が失敗した場合、予約が作成されない
    Given 予約日時 "2026-01-25 14:00" が空いている
    When 管理者が非アクティブなメニューIDで予約を作成しようとする
      | 顧客ID         | メニューID      | スタッフID | 予約日      | 予約時間 |
      | tanaka_user_id | inactive_menu   | staff_id   | 2026-01-25 | 14:00    |
    Then 予約作成は "MENU_NOT_FOUND" エラーで失敗する
    And データベースに予約が登録されない
    And トランザクションがロールバックされる

  # シナリオ2: 予約更新のRace Condition防止
  Scenario: 同じ予約を同時に更新しようとした場合、1つだけ成功する
    Given 顧客 "tanaka@example.com" が "2026-01-25 14:00" に予約済み
    And 予約日時 "2026-01-25 15:00" が空いている
    When 顧客が同時に2つの更新リクエストを送信する
      | 新しい予約日 | 新しい予約時間 |
      | 2026-01-25   | 15:00          |
      | 2026-01-25   | 16:00          |
    Then 1つの更新のみ成功する
    And もう1つの更新は失敗またはタイムアウトする
    And 予約が最終的に1つの時間帯のみに更新される

  Scenario: 予約更新中に時間重複チェックが失敗した場合、更新されない
    Given 顧客 "tanaka@example.com" が "2026-01-25 14:00" に予約済み (予約ID: reservation_1)
    And 顧客 "suzuki@example.com" が "2026-01-25 15:00" に予約済み (同じスタッフ)
    When 顧客 "tanaka@example.com" が予約を "15:00" に変更しようとする
    Then 更新は "TIME_SLOT_CONFLICT" エラーで失敗する
    And 元の予約 "14:00" が保持される
    And トランザクションがロールバックされる

  Scenario: 予約更新中にメニュー確認が失敗した場合、更新されない
    Given 顧客 "tanaka@example.com" が "2026-01-25 14:00" に予約済み
    When 顧客が非アクティブなメニューに変更しようとする
      | 新しいメニューID |
      | inactive_menu    |
    Then 更新は "MENU_NOT_FOUND" エラーで失敗する
    And 元の予約が保持される
    And トランザクションがロールバックされる

  # シナリオ3: データ整合性の保証
  Scenario: 複数の検証が連続で失敗してもデータベースの整合性が保たれる
    Given システムに1000件の予約が登録されている
    When 管理者が無効なデータで100件の予約を同時に作成しようとする
    Then すべての予約作成が失敗する
    And データベースに中途半端なデータが残らない
    And 元の1000件の予約がすべて保持される

  Scenario: トランザクション内のエラーが適切なHTTPステータスコードで返される
    Given 予約日時 "2026-01-25 14:00" に既に予約が存在する
    When 管理者が同じ時間帯に予約を作成しようとする
    Then HTTPステータスコード 409 が返される
    And エラーコード "TIME_SLOT_CONFLICT" が返される
    And エラーメッセージ "This time slot is already booked for the selected staff" が表示される
