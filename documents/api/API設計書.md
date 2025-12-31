# API設計書

**最終更新**: 2025-12-31
**ベースURL**: `https://reserve-system.vercel.app/api`
**プロトコル**: HTTPS
**認証**: Bearer Token (JWT)

---

## 📋 目次

- [認証API](#認証api)
- [予約API](#予約api)
- [メニューAPI](#メニューapi)
- [スタッフAPI](#スタッフapi)
- [顧客管理API](#顧客管理api)
- [店舗設定API](#店舗設定api)
- [エラーレスポンス](#エラーレスポンス)

---

## 🔐 認証API

### POST /api/auth/register
ユーザー新規登録

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "山田太郎",
  "phone": "090-1234-5678"
}
```

**レスポンス (201)**:
```json
{
  "message": "Registration successful. Please check your email for confirmation.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "山田太郎"
  }
}
```

**エラー (400)**:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

### POST /api/auth/login
ログイン

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "山田太郎"
  }
}
```

**エラー (401)**:
```json
{
  "error": "Invalid credentials"
}
```

---

### POST /api/auth/logout
ログアウト

**ヘッダー**:
```
Authorization: Bearer {access_token}
```

**レスポンス (200)**:
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /api/auth/reset-password
パスワードリセットリクエスト

**リクエスト**:
```json
{
  "email": "user@example.com"
}
```

**レスポンス (200)**:
```json
{
  "message": "Password reset email sent"
}
```

---

## 📅 予約API

### GET /api/reservations
予約一覧取得

**ヘッダー**:
```
Authorization: Bearer {access_token}
```

**クエリパラメータ**:
| パラメータ | 型 | 必須 | 説明 | 例 |
|----------|---|------|------|---|
| `date` | string | NO | 予約日フィルタ | `2025-01-20` |
| `staffId` | string | NO | スタッフIDフィルタ | `uuid` |
| `status` | enum | NO | ステータスフィルタ | `CONFIRMED` |
| `limit` | number | NO | 取得件数 | `20` |
| `offset` | number | NO | オフセット | `0` |

**レスポンス (200)**:
```json
{
  "reservations": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "山田太郎",
      "userEmail": "user@example.com",
      "staffId": "uuid",
      "staffName": "田中太郎",
      "menuId": "uuid",
      "menuName": "カット",
      "reservedDate": "2025-01-20",
      "reservedTime": "14:00",
      "status": "CONFIRMED",
      "notes": "初めての利用です",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

---

### GET /api/reservations/:id
予約詳細取得

**ヘッダー**:
```
Authorization: Bearer {access_token}
```

**レスポンス (200)**:
```json
{
  "id": "uuid",
  "user": {
    "id": "uuid",
    "name": "山田太郎",
    "email": "user@example.com",
    "phone": "090-1234-5678"
  },
  "staff": {
    "id": "uuid",
    "name": "田中太郎",
    "role": "スタイリスト"
  },
  "menu": {
    "id": "uuid",
    "name": "カット",
    "price": 5000,
    "duration": 60
  },
  "reservedDate": "2025-01-20",
  "reservedTime": "14:00",
  "status": "CONFIRMED",
  "notes": "初めての利用です",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

**エラー (404)**:
```json
{
  "error": "Reservation not found"
}
```

---

### POST /api/reservations
予約作成

**ヘッダー**:
```
Authorization: Bearer {access_token}
```

**リクエスト**:
```json
{
  "menuId": "uuid",
  "staffId": "uuid",
  "reservedDate": "2025-01-20",
  "reservedTime": "14:00",
  "notes": "初めての利用です"
}
```

**バリデーション**:
- `menuId`: UUID形式
- `staffId`: UUID形式
- `reservedDate`: YYYY-MM-DD形式、過去日付不可
- `reservedTime`: HH:MM形式、営業時間内
- `notes`: 500文字以内（任意）

**レスポンス (201)**:
```json
{
  "id": "uuid",
  "menuId": "uuid",
  "staffId": "uuid",
  "reservedDate": "2025-01-20",
  "reservedTime": "14:00",
  "status": "CONFIRMED",
  "message": "Reservation created successfully. Confirmation email sent."
}
```

**エラー (409)**:
```json
{
  "error": "Time slot already booked",
  "conflictingReservation": {
    "id": "uuid",
    "reservedTime": "14:00"
  }
}
```

**エラー (400)**:
```json
{
  "error": "Invalid date",
  "message": "Cannot book reservations in the past"
}
```

---

### PATCH /api/reservations/:id
予約更新

**ヘッダー**:
```
Authorization: Bearer {access_token}
```

**リクエスト**:
```json
{
  "reservedDate": "2025-01-21",
  "reservedTime": "15:00",
  "notes": "時間変更しました"
}
```

**レスポンス (200)**:
```json
{
  "id": "uuid",
  "reservedDate": "2025-01-21",
  "reservedTime": "15:00",
  "status": "CONFIRMED",
  "message": "Reservation updated successfully"
}
```

---

### DELETE /api/reservations/:id
予約キャンセル

**ヘッダー**:
```
Authorization: Bearer {access_token}
```

**レスポンス (200)**:
```json
{
  "message": "Reservation cancelled successfully",
  "id": "uuid"
}
```

**エラー (403)**:
```json
{
  "error": "Cannot cancel reservation within 24 hours of scheduled time"
}
```

---

### PATCH /api/reservations/:id/status
予約ステータス変更（管理者のみ）

**ヘッダー**:
```
Authorization: Bearer {admin_access_token}
```

**リクエスト**:
```json
{
  "status": "COMPLETED"
}
```

**許可されるステータス**:
- `PENDING` → `CONFIRMED`
- `CONFIRMED` → `COMPLETED`
- `CONFIRMED` → `CANCELLED`
- `CONFIRMED` → `NO_SHOW`

**レスポンス (200)**:
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "message": "Status updated successfully"
}
```

---

## 📋 メニューAPI

### GET /api/menus
メニュー一覧取得

**クエリパラメータ**:
| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|------|
| `category` | string | NO | カテゴリフィルタ |
| `isActive` | boolean | NO | 有効/無効フィルタ |

**レスポンス (200)**:
```json
{
  "menus": [
    {
      "id": "uuid",
      "name": "カット",
      "description": "スタイリッシュなカット",
      "price": 5000,
      "duration": 60,
      "category": "カット",
      "isActive": true
    },
    {
      "id": "uuid",
      "name": "カラー",
      "description": "トレンドカラー",
      "price": 8000,
      "duration": 90,
      "category": "カラー",
      "isActive": true
    }
  ]
}
```

---

### POST /api/menus
メニュー作成（管理者のみ）

**ヘッダー**:
```
Authorization: Bearer {admin_access_token}
```

**リクエスト**:
```json
{
  "name": "パーマ",
  "description": "ふんわりパーマ",
  "price": 10000,
  "duration": 120,
  "category": "パーマ"
}
```

**レスポンス (201)**:
```json
{
  "id": "uuid",
  "name": "パーマ",
  "price": 10000,
  "duration": 120,
  "message": "Menu created successfully"
}
```

---

### PATCH /api/menus/:id
メニュー更新（管理者のみ）

**ヘッダー**:
```
Authorization: Bearer {admin_access_token}
```

**リクエスト**:
```json
{
  "price": 9500,
  "description": "キャンペーン価格"
}
```

**レスポンス (200)**:
```json
{
  "id": "uuid",
  "name": "パーマ",
  "price": 9500,
  "message": "Menu updated successfully"
}
```

---

### DELETE /api/menus/:id
メニュー削除（管理者のみ）

**ヘッダー**:
```
Authorization: Bearer {admin_access_token}
```

**レスポンス (200)**:
```json
{
  "message": "Menu deleted successfully"
}
```

**エラー (409)**:
```json
{
  "error": "Cannot delete menu with existing reservations"
}
```

---

## 👥 スタッフAPI

### GET /api/staff
スタッフ一覧取得

**レスポンス (200)**:
```json
{
  "staff": [
    {
      "id": "uuid",
      "name": "田中太郎",
      "role": "スタイリスト",
      "isActive": true
    }
  ]
}
```

---

### POST /api/staff
スタッフ作成（管理者のみ）

**ヘッダー**:
```
Authorization: Bearer {admin_access_token}
```

**リクエスト**:
```json
{
  "name": "佐藤花子",
  "role": "シニアスタイリスト"
}
```

**レスポンス (201)**:
```json
{
  "id": "uuid",
  "name": "佐藤花子",
  "role": "シニアスタイリスト",
  "message": "Staff created successfully"
}
```

---

## 👤 顧客管理API

### GET /api/admin/customers
顧客一覧取得（管理者のみ）

**ヘッダー**:
```
Authorization: Bearer {admin_access_token}
```

**クエリパラメータ**:
| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|------|
| `search` | string | NO | 名前・メール検索 |
| `limit` | number | NO | 取得件数 |
| `offset` | number | NO | オフセット |

**レスポンス (200)**:
```json
{
  "customers": [
    {
      "id": "uuid",
      "name": "山田太郎",
      "email": "user@example.com",
      "phone": "090-1234-5678",
      "totalReservations": 5,
      "lastVisit": "2025-01-15",
      "createdAt": "2024-12-01T10:00:00Z"
    }
  ],
  "total": 100
}
```

---

### GET /api/admin/customers/:id
顧客詳細取得（管理者のみ）

**ヘッダー**:
```
Authorization: Bearer {admin_access_token}
```

**レスポンス (200)**:
```json
{
  "id": "uuid",
  "name": "山田太郎",
  "email": "user@example.com",
  "phone": "090-1234-5678",
  "createdAt": "2024-12-01T10:00:00Z",
  "reservationHistory": [
    {
      "id": "uuid",
      "menuName": "カット",
      "staffName": "田中太郎",
      "reservedDate": "2025-01-15",
      "status": "COMPLETED"
    }
  ]
}
```

---

## ⚙️ 店舗設定API

### GET /api/settings
店舗設定取得

**レスポンス (200)**:
```json
{
  "storeName": "サンプル美容室",
  "storeEmail": "info@sample-salon.com",
  "storePhone": "03-1234-5678",
  "openTime": "10:00",
  "closeTime": "20:00",
  "closedDays": ["Monday"],
  "slotDuration": 30
}
```

---

### PATCH /api/settings
店舗設定更新（管理者のみ）

**ヘッダー**:
```
Authorization: Bearer {admin_access_token}
```

**リクエスト**:
```json
{
  "openTime": "09:00",
  "closeTime": "21:00"
}
```

**レスポンス (200)**:
```json
{
  "message": "Settings updated successfully",
  "openTime": "09:00",
  "closeTime": "21:00"
}
```

---

## ❌ エラーレスポンス

### 共通エラーフォーマット

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "statusCode": 400
}
```

### HTTPステータスコード

| コード | 意味 | 用途 |
|-------|------|------|
| **200** | OK | 成功 |
| **201** | Created | リソース作成成功 |
| **400** | Bad Request | バリデーションエラー |
| **401** | Unauthorized | 認証エラー |
| **403** | Forbidden | 権限エラー |
| **404** | Not Found | リソースが存在しない |
| **409** | Conflict | リソースの競合（重複予約等） |
| **500** | Internal Server Error | サーバーエラー |

### バリデーションエラー例

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "reservedDate",
      "message": "Date must be in the future"
    },
    {
      "field": "reservedTime",
      "message": "Time must be in HH:MM format"
    }
  ],
  "statusCode": 400
}
```

---

## 🔒 認証・認可

### JWTトークン

**トークン形式**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**トークンペイロード**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "customer",
  "tenantId": "demo-restaurant",
  "iat": 1640000000,
  "exp": 1640003600
}
```

### 権限レベル

| ロール | 権限 |
|-------|------|
| **customer** | 自身の予約CRUD、メニュー閲覧、スタッフ閲覧 |
| **admin** | 全予約管理、顧客管理、スタッフ管理、メニュー管理、設定管理 |

---

## 📊 レート制限

| エンドポイント | 制限 |
|-------------|------|
| `/api/auth/login` | 5回/分 |
| `/api/auth/register` | 3回/分 |
| その他 | 100回/分 |

**レート制限超過時のレスポンス (429)**:
```json
{
  "error": "Too many requests",
  "message": "Please try again later",
  "retryAfter": 60
}
```

---

## 📚 関連ドキュメント

- `spec/データベース設計書.md` - DB設計
- `architecture/システムアーキテクチャ.md` - システム構成
- `reserve-app/src/app/api/` - API Route実装

---

**このAPI設計は、RESTful原則に従い、明確で一貫性のあるインターフェースを提供します。**
