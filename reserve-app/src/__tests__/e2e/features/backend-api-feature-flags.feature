# language: ja

機能: バックエンドAPI機能フラグチェック
  API側で機能フラグを確認し、無効な機能へのアクセスを403で返す

  背景:
    前提 スーパー管理者としてログインしている

  シナリオ: スタッフシフト管理機能が無効な場合、スタッフAPI呼び出しが403エラーを返す
    前提 機能フラグ "enableStaffShiftManagement" が無効である
    もし "/api/admin/staff" に GET リクエストを送信する
    ならば ステータスコード 403 が返される
    かつ レスポンスに "この機能は現在無効です" というメッセージが含まれる

  シナリオ: スタッフシフト管理機能が有効な場合、スタッフAPI呼び出しが正常に動作する
    前提 機能フラグ "enableStaffShiftManagement" が有効である
    もし "/api/admin/staff" に GET リクエストを送信する
    ならば ステータスコード 200 が返される
    かつ スタッフ一覧が取得できる

  シナリオ: 予約変更機能が無効な場合、予約更新API呼び出しが403エラーを返す
    前提 機能フラグ "enableReservationUpdate" が無効である
    かつ 予約ID "test-reservation-1" が存在する
    もし "/api/reservations/test-reservation-1" に PATCH リクエストを送信する
    ならば ステータスコード 403 が返される
    かつ レスポンスに "この機能は現在無効です" というメッセージが含まれる

  シナリオ: 予約変更機能が有効な場合、予約更新API呼び出しが正常に動作する
    前提 機能フラグ "enableReservationUpdate" が有効である
    かつ 予約ID "test-reservation-1" が存在する
    もし "/api/reservations/test-reservation-1" に PATCH リクエストを送信する
    ならば ステータスコード 200 が返される
    かつ 予約が更新される

  シナリオ: 手動予約機能が無効な場合、予約作成API呼び出しが403エラーを返す
    前提 機能フラグ "enableManualReservation" が無効である
    もし "/api/admin/reservations" に POST リクエストを送信する
    ならば ステータスコード 403 が返される
    かつ レスポンスに "この機能は現在無効です" というメッセージが含まれる

  シナリオ: 手動予約機能が有効な場合、予約作成API呼び出しが正常に動作する
    前提 機能フラグ "enableManualReservation" が有効である
    もし "/api/admin/reservations" に POST リクエストを送信する
    ならば ステータスコード 201 が返される
    かつ 予約が作成される

  シナリオ: リピート率分析機能が無効な場合、分析API呼び出しが403エラーを返す
    前提 機能フラグ "enableRepeatRateAnalysis" が無効である
    もし "/api/admin/analytics/repeat-rate" に GET リクエストを送信する
    ならば ステータスコード 403 が返される
    かつ レスポンスに "この機能は現在無効です" というメッセージが含まれる

  シナリオ: リピート率分析機能が有効な場合、分析API呼び出しが正常に動作する
    前提 機能フラグ "enableRepeatRateAnalysis" が有効である
    もし "/api/admin/analytics/repeat-rate" に GET リクエストを送信する
    ならば ステータスコード 200 が返される
    かつ リピート率データが取得できる

  シナリオ: 機能フラグが取得できない場合、APIはデフォルトで403エラーを返す
    前提 機能フラグAPIがエラーを返す
    もし "/api/admin/staff" に GET リクエストを送信する
    ならば ステータスコード 403 が返される
