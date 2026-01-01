# 顧客管理機能実装計画（Issue #19, #20）

**Worktree**: `reserve-system-customers`  
**ブランチ**: `feature/customer-management`  
**担当機能**: 顧客管理（一覧・詳細・メモ機能）

---

## 📋 現状確認

### ✅ 既に存在するもの

1. **Gherkinシナリオ**: `features/admin/customers.feature` ✅
2. **データベーススキーマ**: `RestaurantUser`モデル ✅
3. **既存パターン**: `AdminStaffPage`の実装パターン ✅

### ❌ 実装が必要なもの

1. **API Routes**:
   - `GET /api/admin/customers` - 顧客一覧取得
   - `GET /api/admin/customers/[id]` - 顧客詳細取得
   - `PATCH /api/admin/customers/[id]` - 顧客情報更新
   - `PATCH /api/admin/customers/[id]/memo` - 顧客メモ更新

2. **フロントエンドページ**:
   - `/admin/customers` - 顧客一覧ページ
   - `/admin/customers/[id]` - 顧客詳細ページ

3. **E2Eテスト**:
   - `src/__tests__/e2e/admin-customers.spec.ts`
   - `src/__tests__/e2e/pages/AdminCustomersPage.ts`

4. **データベース変更**:
   - `RestaurantUser`モデルに`memo`フィールドを追加（⚠️ 共有ファイル）

---

## 🎯 実装タスク（優先順位順）

### Phase 1: データベーススキーマ変更（最優先）

**⚠️ 注意**: `schema.prisma`は共有ファイル。他のworktreeと競合する可能性があるため、変更前に確認が必要。

#### タスク 1.1: スキーマにmemoフィールドを追加

```prisma
model RestaurantUser {
  // ... 既存フィールド
  memo String? @default("") // 顧客メモ（500文字以内）
}
```

**ファイル**: `prisma/schema.prisma`

**マイグレーション**:
```bash
npm run prisma:migrate dev --name add_customer_memo
```

---

### Phase 2: API Routes実装

#### タスク 2.1: GET /api/admin/customers（顧客一覧）

**ファイル**: `src/app/api/admin/customers/route.ts`

**機能**:
- 顧客一覧を取得
- 検索機能（名前・メールアドレスで検索）
- ソート機能（来店回数・最終来店日）
- 来店回数の集計
- 最終来店日の取得

**レスポンス例**:
```typescript
{
  success: true,
  data: [
    {
      id: string,
      name: string,
      email: string,
      phone: string,
      visitCount: number, // 来店回数
      lastVisitDate: string | null, // 最終来店日
      createdAt: string,
    }
  ]
}
```

**参考**: `src/app/api/admin/staff/route.ts`

---

#### タスク 2.2: GET /api/admin/customers/[id]（顧客詳細）

**ファイル**: `src/app/api/admin/customers/[id]/route.ts`

**機能**:
- 顧客の基本情報を取得
- 来店履歴（status='COMPLETED'の予約）を取得
- 予約履歴（全ステータス）を取得
- 顧客メモを取得

**レスポンス例**:
```typescript
{
  success: true,
  data: {
    id: string,
    name: string,
    email: string,
    phone: string,
    memo: string,
    visitHistory: [...], // 来店履歴
    reservationHistory: [...], // 予約履歴
    createdAt: string,
  }
}
```

---

#### タスク 2.3: PATCH /api/admin/customers/[id]（顧客情報更新）

**ファイル**: `src/app/api/admin/customers/[id]/route.ts`

**機能**:
- 顧客の基本情報（名前、電話番号）を更新
- バリデーション（Zod）

**リクエスト例**:
```typescript
{
  name?: string,
  phone?: string,
}
```

---

#### タスク 2.4: PATCH /api/admin/customers/[id]/memo（顧客メモ更新）

**ファイル**: `src/app/api/admin/customers/[id]/memo/route.ts`

**機能**:
- 顧客メモを更新
- バリデーション（500文字以内）

**リクエスト例**:
```typescript
{
  memo: string, // 500文字以内
}
```

---

### Phase 3: フロントエンド実装

#### タスク 3.1: 顧客一覧ページ（/admin/customers）

**ファイル**: `src/app/admin/customers/page.tsx`

**機能**:
- 顧客一覧の表示
- 検索機能（名前・メール）
- ソート機能（来店回数・最終来店日）
- 顧客カードのクリックで詳細ページへ遷移
- 空状態の表示

**コンポーネント構成**:
- メインページコンポーネント
- CustomerCardコンポーネント（必要に応じて）

**参考**: `src/app/admin/staff/page.tsx`

**data-testid属性**:
- `customer-list`
- `customer-item`
- `customer-name`
- `customer-email`
- `customer-phone`
- `customer-visit-count`
- `customer-last-visit-date`
- `search-box`
- `sort-button`
- `empty-message`

---

#### タスク 3.2: 顧客詳細ページ（/admin/customers/[id]）

**ファイル**: `src/app/admin/customers/[id]/page.tsx`

**機能**:
- 顧客基本情報の表示
- 来店履歴の表示
- 予約履歴の表示（タブ切り替え）
- 顧客メモの表示・編集・削除
- 顧客情報の編集（モーダル）

**コンポーネント構成**:
- メインページコンポーネント
- CustomerMemoEditorコンポーネント
- CustomerInfoEditModalコンポーネント
- VisitHistoryListコンポーネント
- ReservationHistoryListコンポーネント

**data-testid属性**:
- `customer-detail-name`
- `customer-detail-email`
- `customer-detail-phone`
- `customer-memo`
- `customer-memo-edit-button`
- `customer-memo-save-button`
- `customer-memo-delete-button`
- `customer-info-edit-button`
- `visit-history-list`
- `reservation-history-list`

---

### Phase 4: E2Eテスト実装

#### タスク 4.1: Page Object作成

**ファイル**: `src/__tests__/e2e/pages/AdminCustomersPage.ts`

**機能**:
- 顧客一覧ページのPage Object
- 顧客詳細ページのPage Object
- data-testid属性を使用した要素アクセス

**参考**: `src/__tests__/e2e/pages/AdminStaffPage.ts`

---

#### タスク 4.2: E2Eテスト実装

**ファイル**: `src/__tests__/e2e/admin-customers.spec.ts`

**カバーするシナリオ**:
1. 顧客一覧を表示
2. 顧客詳細を表示
3. 来店履歴を表示
4. 顧客メモを追加
5. 顧客メモを編集
6. 顧客メモを削除
7. 顧客情報を編集
8. 顧客検索機能
9. 顧客一覧のソート機能
10. 顧客一覧が空の場合
11. 顧客の予約履歴を表示
12. 顧客メモの文字数制限

**参考**: `src/__tests__/e2e/admin-staff.spec.ts`

---

### Phase 5: AdminSidebarにリンク追加

#### タスク 5.1: サイドバーに顧客管理リンクを追加

**ファイル**: `src/components/AdminSidebar.tsx`

**変更内容**:
- 「顧客管理」メニューアイテムを追加
- `/admin/customers`へのリンク

---

## 📊 実装順序

```
1. Phase 1: データベーススキーマ変更
   ↓
2. Phase 2: API Routes実装（2.1 → 2.2 → 2.3 → 2.4）
   ↓
3. Phase 4: E2Eテスト実装（Red状態で作成）
   ↓
4. Phase 3: フロントエンド実装（3.1 → 3.2）
   ↓
5. Phase 5: AdminSidebarにリンク追加
   ↓
6. E2Eテスト実行（Green確認）
   ↓
7. リファクタリング
```

---

## 🔍 技術的な注意事項

### 1. データベーススキーマ変更

- `schema.prisma`は共有ファイルのため、変更前に他のworktreeの状態を確認
- マイグレーション実行後、Prisma Clientを再生成
- デモデータ（seed.ts）に影響なし（既存データは`memo = null`として扱われる）

### 2. 来店回数の計算

```typescript
// Prismaクエリ例
const customer = await prisma.restaurantUser.findUnique({
  where: { id },
  include: {
    reservations: {
      where: {
        status: 'COMPLETED',
      },
      orderBy: {
        reservedDate: 'desc',
      },
    },
  },
});

const visitCount = customer.reservations.length;
const lastVisitDate = customer.reservations[0]?.reservedDate || null;
```

### 3. 顧客メモの文字数制限

- フロントエンド: 500文字まで入力可能
- バックエンド: Zodスキーマで500文字まで検証
- UI: 文字カウンター表示（例: "250/500文字"）

### 4. バリデーション

**顧客情報更新**:
```typescript
const updateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
});
```

**顧客メモ更新**:
```typescript
const updateMemoSchema = z.object({
  memo: z.string().max(500, 'メモは500文字以内で入力してください'),
});
```

---

## ✅ 完成チェックリスト

### API Routes
- [ ] GET /api/admin/customers が動作する
- [ ] GET /api/admin/customers/[id] が動作する
- [ ] PATCH /api/admin/customers/[id] が動作する
- [ ] PATCH /api/admin/customers/[id]/memo が動作する
- [ ] エラーハンドリングが適切
- [ ] バリデーションが実装されている

### フロントエンド
- [ ] 顧客一覧ページが表示される
- [ ] 顧客詳細ページが表示される
- [ ] 検索機能が動作する
- [ ] ソート機能が動作する
- [ ] 顧客メモの追加・編集・削除が動作する
- [ ] 顧客情報の編集が動作する
- [ ] 来店履歴が表示される
- [ ] 予約履歴が表示される
- [ ] data-testid属性が適切に設定されている
- [ ] ローディング・エラー状態が適切に表示される

### テスト
- [ ] E2Eテストが全て通過する
- [ ] Gherkinシナリオが全てカバーされている
- [ ] Page Objectパターンが適切に使用されている

### 品質
- [ ] ESLintエラー0件
- [ ] TypeScriptエラー0件
- [ ] ビルドが成功する
- [ ] コードレビュー対応完了

---

## 📝 参考リソース

- **既存実装**: `src/app/admin/staff/page.tsx`
- **API実装**: `src/app/api/admin/staff/route.ts`
- **Page Object**: `src/__tests__/e2e/pages/AdminStaffPage.ts`
- **E2Eテスト**: `src/__tests__/e2e/admin-staff.spec.ts`
- **Gherkinシナリオ**: `features/admin/customers.feature`
- **データベーススキーマ**: `prisma/schema.prisma`

---

**最終更新**: 2026-01-01

