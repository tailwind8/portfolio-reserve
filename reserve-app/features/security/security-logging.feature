# language: ja
機能: セキュリティイベントのログ記録

  アプリケーションでは、セキュリティ関連のイベント（ログイン失敗、権限エラーなど）を記録し、
  異常なアクセスパターンを検知できるようにする必要がある。
  これにより、セキュリティインシデントの検知、不正アクセスの追跡、監査証跡の確保が可能になる。

  背景:
    前提 テナント"demo-booking"が存在する
    かつ ユーザー"test@example.com"が登録されている

  # ========================================
  # 認証イベントのログ記録
  # ========================================

  シナリオ: ログイン成功イベントが記録される
    もし ユーザー"test@example.com"が正しいパスワードでログインする
    ならば ログインが成功する
    かつ セキュリティログに以下の内容が記録される:
      | eventType     | LOGIN_SUCCESS |
      | userId        | (ユーザーID)  |
      | ipAddress     | (IPアドレス)  |
      | userAgent     | (User-Agent)  |
    かつ ログのmetadataに"email"フィールドが含まれる

  シナリオ: ログイン失敗イベントが記録される
    もし ユーザー"test@example.com"が誤ったパスワードでログインを試みる
    ならば ログインが失敗する
    かつ ステータスコード "401" が返される
    かつ セキュリティログに以下の内容が記録される:
      | eventType     | LOGIN_FAILED  |
      | ipAddress     | (IPアドレス)  |
      | userAgent     | (User-Agent)  |
    かつ ログのmetadataに"email"と"reason"フィールドが含まれる

  シナリオ: ユーザー登録イベントが記録される
    もし 新規ユーザー"newuser@example.com"が登録する
    ならば 登録が成功する
    かつ セキュリティログに以下の内容が記録される:
      | eventType     | USER_REGISTER |
      | userId        | (ユーザーID)  |
      | ipAddress     | (IPアドレス)  |
      | userAgent     | (User-Agent)  |
    かつ ログのmetadataに"email"フィールドが含まれる

  シナリオ: ログアウトイベントが記録される
    前提 ユーザー"test@example.com"がログインしている
    もし ユーザーがログアウトする
    ならば ログアウトが成功する
    かつ セキュリティログに以下の内容が記録される:
      | eventType     | LOGOUT        |
      | userId        | (ユーザーID)  |
      | ipAddress     | (IPアドレス)  |
      | userAgent     | (User-Agent)  |

  # ========================================
  # 権限エラーのログ記録
  # ========================================

  シナリオ: 管理者ページへの不正アクセスが記録される
    前提 一般ユーザー"test@example.com"がログインしている
    もし 管理者ページ "/admin/dashboard" にアクセスを試みる
    ならば ステータスコード "403" が返される
    かつ セキュリティログに以下の内容が記録される:
      | eventType     | UNAUTHORIZED_ACCESS |
      | userId        | (ユーザーID)        |
      | ipAddress     | (IPアドレス)        |
      | userAgent     | (User-Agent)        |
    かつ ログのmetadataに"path"フィールドが"/admin/dashboard"として記録される

  シナリオ: API権限エラーが記録される
    前提 一般ユーザー"test@example.com"がログインしている
    もし 管理者専用API "/api/admin/users" にアクセスを試みる
    ならば ステータスコード "403" が返される
    かつ セキュリティログに以下の内容が記録される:
      | eventType     | UNAUTHORIZED_ACCESS |
      | userId        | (ユーザーID)        |
      | ipAddress     | (IPアドレス)        |
      | userAgent     | (User-Agent)        |
    かつ ログのmetadataに"path"フィールドが"/api/admin/users"として記録される

  # ========================================
  # レート制限超過のログ記録
  # ========================================

  シナリオ: ログインレート制限超過が記録される
    もし ユーザーが短時間に6回以上ログインを試みる
    ならば 6回目以降のリクエストはステータスコード "429" が返される
    かつ セキュリティログに以下の内容が記録される:
      | eventType     | RATE_LIMIT_EXCEEDED |
      | ipAddress     | (IPアドレス)        |
      | userAgent     | (User-Agent)        |
    かつ ログのmetadataに"endpoint"フィールドが"/api/auth/login"として記録される

  シナリオ: 登録レート制限超過が記録される
    もし ユーザーが短時間に4回以上登録を試みる
    ならば 4回目以降のリクエストはステータスコード "429" が返される
    かつ セキュリティログに以下の内容が記録される:
      | eventType     | RATE_LIMIT_EXCEEDED |
      | ipAddress     | (IPアドレス)        |
      | userAgent     | (User-Agent)        |
    かつ ログのmetadataに"endpoint"フィールドが"/api/auth/register"として記録される

  # ========================================
  # ログの保持と照会
  # ========================================

  シナリオ: セキュリティログが正しく保存され照会できる
    前提 複数のセキュリティイベントが発生している:
      | eventType           | userId      |
      | LOGIN_SUCCESS       | user-1      |
      | LOGIN_FAILED        | (なし)      |
      | UNAUTHORIZED_ACCESS | user-2      |
    もし セキュリティログをeventType "LOGIN_FAILED" で検索する
    ならば ログイン失敗イベントのログのみが取得できる
    かつ ログに以下のフィールドが含まれる:
      | id          |
      | tenantId    |
      | eventType   |
      | userId      |
      | ipAddress   |
      | userAgent   |
      | metadata    |
      | createdAt   |

  シナリオ: ログ記録失敗が本処理に影響しない
    前提 データベース接続エラーが発生する状況
    もし ユーザー"test@example.com"が正しいパスワードでログインする
    ならば ログインが成功する
    かつ セキュリティログへの記録は失敗する
    かつ ログインAPIレスポンスは正常に返される
    かつ コンソールに"Failed to log security event"エラーが出力される
