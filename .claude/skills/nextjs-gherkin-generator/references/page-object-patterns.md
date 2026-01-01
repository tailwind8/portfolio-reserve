# Page Object Model (POM) パターン

Page Object Modelは、UIテストのメンテナンス性と再利用性を高めるデザインパターンです。

## 基本概念

### Page Objectとは

- **1ページ = 1クラス**: 各ページまたはコンポーネントに対応するクラスを作成
- **ロケーターの隠蔽**: セレクタの詳細をPage Objectに隠蔽
- **振る舞いの抽象化**: UIの操作をメソッドとして公開

### メリット

1. **保守性向上**: UIが変更されてもPage Objectのみ修正すればよい
2. **可読性向上**: テストコードがビジネスロジックに集中できる
3. **再利用性**: 同じ操作を複数のテストで利用可能

---

## ディレクトリ構造

```
src/__tests__/e2e/
├── pages/
│   ├── BasePage.ts              # 基底クラス
│   ├── LoginPage.ts             # ログインページ
│   ├── AdminDashboardPage.ts    # 管理者ダッシュボード
│   ├── BookingPage.ts           # 予約ページ
│   ├── ReservationListPage.ts   # 予約一覧
│   └── components/
│       ├── Navigation.ts        # ナビゲーション
│       └── ReservationCard.ts   # 予約カード
├── helpers/
│   ├── auth.ts                  # 認証ヘルパー
│   └── fixtures.ts              # テストデータ作成
└── *.spec.ts                    # テストファイル
```

---

## 1. 基底クラス（BasePage）

すべてのPage Objectが継承する基底クラス。

```typescript
// src/__tests__/e2e/pages/BasePage.ts
import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * ページに移動
   */
  async goto(url: string) {
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * data-testid でロケーターを取得
   */
  getByTestId(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  /**
   * テキストでロケーターを取得（非推奨：最終手段）
   */
  getByText(text: string): Locator {
    return this.page.locator(`text=${text}`);
  }

  /**
   * フォーム送信後の完了を待つ
   */
  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * エラーメッセージを取得
   */
  async getErrorMessage(): Promise<string> {
    const errorElement = this.getByTestId('error-message');
    return await errorElement.textContent() || '';
  }

  /**
   * 成功メッセージを取得
   */
  async getSuccessMessage(): Promise<string> {
    const successElement = this.getByTestId('success-message');
    return await successElement.textContent() || '';
  }
}
```

---

## 2. ログインページ

```typescript
// src/__tests__/e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // ロケーター定義
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = this.getByTestId('email');
    this.passwordInput = this.getByTestId('password');
    this.submitButton = this.getByTestId('submit-button');
    this.errorMessage = this.getByTestId('error-message');
  }

  /**
   * ページに移動
   */
  async navigate() {
    await this.goto('/login');
  }

  /**
   * メールアドレスを入力
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * パスワードを入力
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * 送信ボタンをクリック
   */
  async clickSubmit() {
    await this.submitButton.click();
  }

  /**
   * ログイン処理（統合メソッド）
   */
  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSubmit();
    await this.waitForNavigation();
  }

  /**
   * エラーメッセージを確認
   */
  async getError(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }
}
```

### 使用例

```typescript
// auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('有効な認証情報でログインする', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('user@example.com', 'Password123!');

  await expect(page).toHaveURL('/');
});

test('無効なパスワードでエラーが表示される', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('user@example.com', 'wrong-password');

  const error = await loginPage.getError();
  expect(error).toContain('メールアドレスまたはパスワードが正しくありません');
});
```

---

## 3. 管理者ダッシュボード

```typescript
// src/__tests__/e2e/pages/AdminDashboardPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminDashboardPage extends BasePage {
  readonly heading: Locator;
  readonly totalReservationsCard: Locator;
  readonly todayReservationsCard: Locator;
  readonly totalRevenueCard: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = this.getByTestId('dashboard-heading');
    this.totalReservationsCard = this.getByTestId('total-reservations');
    this.todayReservationsCard = this.getByTestId('today-reservations');
    this.totalRevenueCard = this.getByTestId('total-revenue');
  }

  async navigate() {
    await this.goto('/admin/dashboard');
  }

  /**
   * 統計情報を取得
   */
  async getStats() {
    const totalReservations = await this.totalReservationsCard.textContent();
    const todayReservations = await this.todayReservationsCard.textContent();
    const totalRevenue = await this.totalRevenueCard.textContent();

    return {
      totalReservations: parseInt(totalReservations || '0'),
      todayReservations: parseInt(todayReservations || '0'),
      totalRevenue: parseFloat(totalRevenue?.replace(/[^\d.]/g, '') || '0'),
    };
  }

  /**
   * 予約一覧ページへ遷移
   */
  async navigateToReservations() {
    const link = this.getByTestId('reservations-link');
    await link.click();
    await this.waitForNavigation();
  }
}
```

---

## 4. 予約フォーム

```typescript
// src/__tests__/e2e/pages/BookingPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  dateTime: string;
  guestCount: number;
  notes?: string;
}

export class BookingPage extends BasePage {
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly dateTimeInput: Locator;
  readonly guestCountSelect: Locator;
  readonly notesTextarea: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = this.getByTestId('name');
    this.emailInput = this.getByTestId('email');
    this.phoneInput = this.getByTestId('phone');
    this.dateTimeInput = this.getByTestId('date-time');
    this.guestCountSelect = this.getByTestId('guest-count');
    this.notesTextarea = this.getByTestId('notes');
    this.submitButton = this.getByTestId('submit-booking');
  }

  async navigate() {
    await this.goto('/booking');
  }

  /**
   * 名前を入力
   */
  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  /**
   * メールアドレスを入力
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * 電話番号を入力
   */
  async fillPhone(phone: string) {
    await this.phoneInput.fill(phone);
  }

  /**
   * 予約日時を入力
   */
  async fillDateTime(dateTime: string) {
    await this.dateTimeInput.fill(dateTime);
  }

  /**
   * 人数を選択
   */
  async fillGuestCount(count: number) {
    await this.guestCountSelect.selectOption({ value: count.toString() });
  }

  /**
   * 備考を入力
   */
  async fillNotes(notes: string) {
    await this.notesTextarea.fill(notes);
  }

  /**
   * 送信ボタンをクリック
   */
  async submit() {
    await this.submitButton.click();
    await this.waitForNavigation();
  }

  /**
   * 予約フォーム全体を入力（統合メソッド）
   */
  async fillForm(data: BookingFormData) {
    await this.fillName(data.name);
    await this.fillEmail(data.email);
    await this.fillPhone(data.phone);
    await this.fillDateTime(data.dateTime);
    await this.fillGuestCount(data.guestCount);
    if (data.notes) {
      await this.fillNotes(data.notes);
    }
  }

  /**
   * 予約作成（フォーム入力 + 送信）
   */
  async createReservation(data: BookingFormData) {
    await this.fillForm(data);
    await this.submit();
  }

  /**
   * フィールドのバリデーションエラーを取得
   */
  async getFieldError(fieldName: string): Promise<string> {
    const errorElement = this.getByTestId(`error-${fieldName}`);
    return await errorElement.textContent() || '';
  }
}
```

### 使用例

```typescript
// booking.spec.ts
import { test, expect } from '@playwright/test';
import { BookingPage } from './pages/BookingPage';

test('有効なデータで予約を作成する', async ({ page }) => {
  const bookingPage = new BookingPage(page);
  await bookingPage.navigate();

  await bookingPage.createReservation({
    name: '山田太郎',
    email: 'yamada@example.com',
    phone: '090-1234-5678',
    dateTime: '2026-01-15T18:00',
    guestCount: 4,
  });

  await expect(page).toHaveURL(/\/booking\/confirmation/);
});

test('必須項目が未入力の場合エラーが表示される', async ({ page }) => {
  const bookingPage = new BookingPage(page);
  await bookingPage.navigate();
  await bookingPage.submit();

  const nameError = await bookingPage.getFieldError('name');
  expect(nameError).toContain('名前を入力してください');
});
```

---

## 5. 予約一覧（リストページ）

```typescript
// src/__tests__/e2e/pages/ReservationListPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReservationListPage extends BasePage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly filterStatusSelect: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = this.getByTestId('reservations-heading');
    this.searchInput = this.getByTestId('search-input');
    this.filterStatusSelect = this.getByTestId('filter-status');
  }

  async navigate() {
    await this.goto('/admin/reservations');
  }

  /**
   * 予約行を取得
   */
  getReservationRow(id: string): Locator {
    return this.getByTestId(`reservation-row-${id}`);
  }

  /**
   * 予約カードを取得
   */
  getReservationCard(id: string): Locator {
    return this.getByTestId(`reservation-card-${id}`);
  }

  /**
   * 検索
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // デバウンス待機
  }

  /**
   * ステータスでフィルタリング
   */
  async filterByStatus(status: string) {
    await this.filterStatusSelect.selectOption({ value: status });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 予約詳細ページへ遷移
   */
  async openReservation(id: string) {
    const row = this.getReservationRow(id);
    await row.click();
    await this.waitForNavigation();
  }

  /**
   * 予約一覧の件数を取得
   */
  async getReservationCount(): Promise<number> {
    const rows = this.page.locator('[data-testid^="reservation-row-"]');
    return await rows.count();
  }

  /**
   * すべての予約IDを取得
   */
  async getAllReservationIds(): Promise<string[]> {
    const rows = this.page.locator('[data-testid^="reservation-row-"]');
    const count = await rows.count();
    const ids: string[] = [];

    for (let i = 0; i < count; i++) {
      const testId = await rows.nth(i).getAttribute('data-testid');
      if (testId) {
        const id = testId.replace('reservation-row-', '');
        ids.push(id);
      }
    }

    return ids;
  }
}
```

---

## 6. コンポーネント（ナビゲーション）

ページ間で共通のコンポーネントもPage Objectとして抽出できます。

```typescript
// src/__tests__/e2e/pages/components/Navigation.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

export class Navigation extends BasePage {
  readonly homeLink: Locator;
  readonly dashboardLink: Locator;
  readonly reservationsLink: Locator;
  readonly menusLink: Locator;
  readonly staffLink: Locator;
  readonly logoutButton: Locator;
  readonly userNameDisplay: Locator;

  constructor(page: Page) {
    super(page);
    this.homeLink = this.getByTestId('nav-home');
    this.dashboardLink = this.getByTestId('nav-dashboard');
    this.reservationsLink = this.getByTestId('nav-reservations');
    this.menusLink = this.getByTestId('nav-menus');
    this.staffLink = this.getByTestId('nav-staff');
    this.logoutButton = this.getByTestId('nav-logout');
    this.userNameDisplay = this.getByTestId('nav-user-name');
  }

  async navigateToHome() {
    await this.homeLink.click();
    await this.waitForNavigation();
  }

  async navigateToDashboard() {
    await this.dashboardLink.click();
    await this.waitForNavigation();
  }

  async navigateToReservations() {
    await this.reservationsLink.click();
    await this.waitForNavigation();
  }

  async logout() {
    await this.logoutButton.click();
    await this.waitForNavigation();
  }

  async getUserName(): Promise<string> {
    return await this.userNameDisplay.textContent() || '';
  }
}
```

### 使用例

```typescript
// navigation.spec.ts
import { test, expect } from '@playwright/test';
import { Navigation } from './pages/components/Navigation';
import { loginAsAdmin } from './helpers/auth';

test('ナビゲーションでページ遷移できる', async ({ page, context }) => {
  await loginAsAdmin(page, context);

  const navigation = new Navigation(page);
  await navigation.navigateToDashboard();
  await expect(page).toHaveURL('/admin/dashboard');

  await navigation.navigateToReservations();
  await expect(page).toHaveURL('/admin/reservations');
});
```

---

## 7. ダイアログ・モーダル

```typescript
// src/__tests__/e2e/pages/components/ConfirmDialog.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

export class ConfirmDialog extends BasePage {
  readonly dialog: Locator;
  readonly message: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.dialog = this.getByTestId('confirm-dialog');
    this.message = this.getByTestId('confirm-message');
    this.confirmButton = this.getByTestId('confirm-button');
    this.cancelButton = this.getByTestId('cancel-button');
  }

  async isVisible(): Promise<boolean> {
    return await this.dialog.isVisible();
  }

  async getMessage(): Promise<string> {
    return await this.message.textContent() || '';
  }

  async confirm() {
    await this.confirmButton.click();
    await this.page.waitForTimeout(300); // アニメーション待機
  }

  async cancel() {
    await this.cancelButton.click();
    await this.page.waitForTimeout(300);
  }
}
```

---

## ベストプラクティス

### 1. data-testid を優先的に使用

❌ 避ける
```typescript
this.submitButton = this.page.locator('button.btn-primary');
```

✅ 推奨
```typescript
this.submitButton = this.getByTestId('submit-button');
```

### 2. ロケーターは readonly で定義

```typescript
readonly emailInput: Locator;
```

### 3. 統合メソッドを提供

複数のアクションを組み合わせた高レベルメソッドを提供する。

```typescript
async login(email: string, password: string) {
  await this.fillEmail(email);
  await this.fillPassword(password);
  await this.clickSubmit();
  await this.waitForNavigation();
}
```

### 4. アサーションはテストコードに書く

Page Objectはアサーション（`expect`）を含めない。

❌ 避ける
```typescript
async login(email: string, password: string) {
  // ...
  await expect(this.page).toHaveURL('/'); // Page Object内でアサーション
}
```

✅ 推奨
```typescript
// Page Object
async login(email: string, password: string) {
  // ...
}

// テストコード
test('ログインできる', async ({ page }) => {
  await loginPage.login('user@example.com', 'Password123!');
  await expect(page).toHaveURL('/'); // テストコードでアサーション
});
```

### 5. DRY原則を守る

共通の処理は BasePage や ヘルパー関数に抽出する。

---

## まとめ

- **1ページ = 1クラス**: 各ページに対応するPage Objectを作成
- **ロケーターの隠蔽**: セレクタの詳細はPage Objectに隠蔽
- **data-testid を使用**: テキストやCSSセレクタではなく data-testid を優先
- **統合メソッド**: 複数アクションを組み合わせた高レベルメソッドを提供
- **アサーションはテストコード**: Page ObjectにはAssertionを含めない
