# Playwright-BDD ステップ定義テンプレート

このドキュメントは、Gherkinシナリオに対応するPlaywrightステップ定義のテンプレート集です。

## 基本構造

```typescript
import { Given, When, Then } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

Given('ユーザーが {string} ページにアクセスしている', async ({ page }, url: string) => {
  await page.goto(url);
});

When('ユーザーが有効な認証情報でログインする', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('user@example.com', 'Password123!');
});

Then('{string} ページにリダイレクトされる', async ({ page }, expectedUrl: string) => {
  await expect(page).toHaveURL(expectedUrl);
});
```

---

## 1. ナビゲーション

### Given: ページアクセス

```typescript
Given('ユーザーが {string} ページにアクセスしている', async ({ page }, url: string) => {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
});

Given('ユーザーが {string} にアクセスする', async ({ page }, url: string) => {
  await page.goto(url);
});
```

### Then: リダイレクト確認

```typescript
Then('{string} ページにリダイレクトされる', async ({ page }, expectedUrl: string) => {
  await expect(page).toHaveURL(expectedUrl);
});

Then('{string} ページに留まる', async ({ page }, expectedUrl: string) => {
  await expect(page).toHaveURL(expectedUrl);
});
```

---

## 2. 認証

### Given: 認証状態

```typescript
import { loginAsUser, loginAsAdmin } from '../helpers/auth';

Given('ユーザーがログイン済みである', async ({ page, context }) => {
  await loginAsUser(page, context);
});

Given('管理者がログイン済みである', async ({ page, context }) => {
  await loginAsAdmin(page, context);
});

Given('ユーザーが未認証である', async ({ context }) => {
  // Cookieをクリア
  await context.clearCookies();
});
```

### When: ログイン操作

```typescript
When('ユーザーが有効な認証情報でログインする', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('user@example.com', 'Password123!');
});

When('ユーザーが無効なパスワードでログインを試みる', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('user@example.com', 'wrong-password');
});

When('ユーザーが以下の認証情報を入力する', async ({ page }, dataTable) => {
  const loginPage = new LoginPage(page);
  const data = dataTable.rowsHash();
  await loginPage.fillEmail(data['メールアドレス']);
  await loginPage.fillPassword(data['パスワード']);
});
```

---

## 3. フォーム操作

### When: フォーム入力

```typescript
When('以下の予約情報を入力する', async ({ page }, dataTable) => {
  const bookingPage = new BookingPage(page);
  const rows = dataTable.hashes();

  for (const row of rows) {
    switch (row.field) {
      case '名前':
        await bookingPage.fillName(row.value);
        break;
      case 'メールアドレス':
        await bookingPage.fillEmail(row.value);
        break;
      case '電話番号':
        await bookingPage.fillPhone(row.value);
        break;
      case '予約日時':
        await bookingPage.fillDateTime(row.value);
        break;
      case '人数':
        await bookingPage.fillGuestCount(row.value);
        break;
    }
  }
});

When('{string} に {string} を入力する', async ({ page }, fieldName: string, value: string) => {
  const field = page.locator(`[data-testid="${fieldName}"]`);
  await field.fill(value);
});

When('{string} を選択する', async ({ page }, optionText: string) => {
  await page.selectOption('select', { label: optionText });
});
```

### When: ボタンクリック

```typescript
When('予約ボタンをクリックする', async ({ page }) => {
  await page.click('[data-testid="submit-booking"]');
});

When('{string} ボタンをクリックする', async ({ page }, buttonName: string) => {
  // data-testidまたはロール+名前で検索
  const button = page.locator(`[data-testid="${buttonName}"], button:has-text("${buttonName}")`);
  await button.click();
});

When('ログインボタンをクリックする', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.clickSubmit();
});
```

---

## 4. API操作

### Given: データセットアップ

```typescript
import { createReservation, createMenu } from '../helpers/fixtures';

Given('ID {string} の予約が存在する', async ({ request }, id: string) => {
  await createReservation(request, { id });
});

Given('tenant_id {string} に以下の予約が存在する', async ({ request }, tenantId: string, dataTable) => {
  const rows = dataTable.hashes();
  for (const row of rows) {
    await createReservation(request, {
      id: row.id,
      customer_name: row.customer_name,
      status: row.status,
      tenant_id: tenantId,
    });
  }
});
```

### When: APIリクエスト

```typescript
When('{string} にリクエストを送信する', async ({ request }, endpoint: string) => {
  const [method, url] = endpoint.split(' ');
  const response = await request[method.toLowerCase()](url);
  // レスポンスをコンテキストに保存
  return { response };
});

When('{string} に以下のボディを送信する', async ({ request }, endpoint: string, docString: string) => {
  const [method, url] = endpoint.split(' ');
  const body = JSON.parse(docString);
  const response = await request[method.toLowerCase()](url, { data: body });
  return { response };
});
```

### Then: APIレスポンス検証

```typescript
Then('ステータスコード {int} が返される', async ({ }, statusCode: number, { response }) => {
  expect(response.status()).toBe(statusCode);
});

Then('レスポンスに予約一覧が含まれる', async ({ }, { response }) => {
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThan(0);
});

Then('レスポンスに {string} が含まれる', async ({ }, key: string, { response }) => {
  const body = await response.json();
  expect(body).toHaveProperty(key);
});

Then('全ての予約に tenant_id {string} が設定されている', async ({ }, tenantId: string, { response }) => {
  const body = await response.json();
  body.forEach((item: any) => {
    expect(item.tenant_id).toBe(tenantId);
  });
});
```

---

## 5. アサーション

### Then: 表示確認

```typescript
Then('ダッシュボードページが表示される', async ({ page }) => {
  const dashboardPage = new AdminDashboardPage(page);
  await expect(dashboardPage.heading).toBeVisible();
});

Then('{string} というメッセージが表示される', async ({ page }, message: string) => {
  await expect(page.locator(`text=${message}`)).toBeVisible();
});

Then('{string} というエラーが表示される', async ({ page }, errorMessage: string) => {
  const errorElement = page.locator('[data-testid="error-message"]');
  await expect(errorElement).toHaveText(errorMessage);
});

Then('以下のバリデーションエラーが表示される', async ({ page }, dataTable) => {
  const rows = dataTable.hashes();
  for (const row of rows) {
    const errorElement = page.locator(`[data-testid="error-${row.field}"]`);
    await expect(errorElement).toHaveText(row.message);
  }
});
```

### Then: 要素の状態確認

```typescript
Then('{string} ボタンが非活性である', async ({ page }, buttonName: string) => {
  const button = page.locator(`[data-testid="${buttonName}"]`);
  await expect(button).toBeDisabled();
});

Then('ナビゲーションにユーザー名が表示される', async ({ page }) => {
  const userName = page.locator('[data-testid="user-name"]');
  await expect(userName).toBeVisible();
});

Then('以下の情報が表示される', async ({ page }, dataTable) => {
  const rows = dataTable.hashes();
  for (const row of rows) {
    const element = page.locator(`[data-testid="${row.field}"]`);
    await expect(element).toHaveText(row.value);
  }
});
```

### Then: データベース確認

```typescript
import { prisma } from '../helpers/db';

Then('データベースにメニューが保存されている', async ({ }, { response }) => {
  const body = await response.json();
  const menu = await prisma.restaurantMenu.findUnique({
    where: { id: body.id },
  });
  expect(menu).not.toBeNull();
});

Then('データベースの予約ステータスが {string} になっている', async ({ }, status: string, { reservationId }) => {
  const reservation = await prisma.restaurantReservation.findUnique({
    where: { id: reservationId },
  });
  expect(reservation?.status).toBe(status);
});

Then('データベースから ID {string} のスタッフが削除されている', async ({ }, id: string) => {
  const staff = await prisma.restaurantStaff.findUnique({
    where: { id },
  });
  expect(staff).toBeNull();
});
```

---

## 6. 同時実行制御

```typescript
When('ユーザーAとユーザーBが同時に18:00の予約を試みる', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // 並行実行
  const [resultA, resultB] = await Promise.allSettled([
    new BookingPage(pageA).createReservation({
      dateTime: '2026-01-15 18:00',
      guestCount: 4,
    }),
    new BookingPage(pageB).createReservation({
      dateTime: '2026-01-15 18:00',
      guestCount: 4,
    }),
  ]);

  await contextA.close();
  await contextB.close();

  return { resultA, resultB };
});

Then('1人の予約のみが成功する', async ({ }, { resultA, resultB }) => {
  const successCount = [resultA, resultB].filter(r => r.status === 'fulfilled').length;
  expect(successCount).toBe(1);
});
```

---

## 7. エラーハンドリング

### Given: エラー状態のセットアップ

```typescript
Given('ネットワークが切断されている', async ({ context }) => {
  await context.setOffline(true);
});

Given('APIサーバーがダウンしている', async ({ page }) => {
  await page.route('**/api/**', route => route.abort());
});
```

### Then: エラー表示確認

```typescript
Then('{string} ページが表示される', async ({ page }, pageTitle: string) => {
  await expect(page.locator('h1')).toHaveText(pageTitle);
});

Then('リトライボタンが表示される', async ({ page }) => {
  const retryButton = page.locator('[data-testid="retry-button"]');
  await expect(retryButton).toBeVisible();
});
```

---

## 8. セキュリティ

### When: XSS/CSRF攻撃シミュレーション

```typescript
When('名前フィールドに {string} を入力する', async ({ page }, maliciousInput: string) => {
  await page.fill('[data-testid="name"]', maliciousInput);
});

When('CSRFトークンなしで {string} にリクエストを送信する', async ({ request }, endpoint: string) => {
  const [method, url] = endpoint.split(' ');
  const response = await request[method.toLowerCase()](url, {
    headers: {
      // CSRFトークンヘッダーを省略
    },
  });
  return { response };
});
```

### Then: サニタイズ確認

```typescript
Then('データベースには {string} が保存される', async ({ }, sanitizedValue: string, { reservationId }) => {
  const reservation = await prisma.restaurantReservation.findUnique({
    where: { id: reservationId },
  });
  expect(reservation?.customer_name).toBe(sanitizedValue);
});

Then('予約詳細ページでスクリプトが実行されない', async ({ page }) => {
  // スクリプトタグがエスケープされていることを確認
  const content = await page.content();
  expect(content).not.toContain('<script>');
  expect(content).toContain('&lt;script&gt;');
});
```

---

## 9. ヘルパー関数

### 認証ヘルパー

```typescript
// helpers/auth.ts
import { Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

export async function loginAsUser(page: Page, context: BrowserContext) {
  await page.goto('/login');
  const loginPage = new LoginPage(page);
  await loginPage.login('user@example.com', 'Password123!');

  // セッションを保存
  const cookies = await context.cookies();
  await context.addCookies(cookies);
}

export async function loginAsAdmin(page: Page, context: BrowserContext) {
  await page.goto('/login');
  const loginPage = new LoginPage(page);
  await loginPage.login('admin@example.com', 'AdminPassword123!');

  const cookies = await context.cookies();
  await context.addCookies(cookies);
}
```

### フィクスチャヘルパー

```typescript
// helpers/fixtures.ts
import { APIRequestContext } from '@playwright/test';

export async function createReservation(
  request: APIRequestContext,
  data: Partial<Reservation>
) {
  const response = await request.post('/api/admin/reservations', {
    data: {
      customer_name: data.customer_name || 'テストユーザー',
      email: data.email || 'test@example.com',
      phone: data.phone || '090-1234-5678',
      date_time: data.date_time || '2026-01-15T18:00:00Z',
      guest_count: data.guest_count || 4,
      status: data.status || 'pending',
      tenant_id: data.tenant_id || 'demo-restaurant',
      ...data,
    },
  });

  return await response.json();
}

export async function createMenu(
  request: APIRequestContext,
  data: Partial<Menu>
) {
  const response = await request.post('/api/admin/menus', {
    data: {
      name: data.name || 'テストメニュー',
      description: data.description || 'テスト用メニュー',
      price: data.price || 1000,
      category: data.category || 'その他',
      tenant_id: data.tenant_id || 'demo-restaurant',
      ...data,
    },
  });

  return await response.json();
}
```

---

## 10. データテーブル処理

### rowsHash（キー・バリュー）

```gherkin
When ユーザーが以下の認証情報を入力する
  | メールアドレス | user@example.com |
  | パスワード | Password123! |
```

```typescript
When('ユーザーが以下の認証情報を入力する', async ({ page }, dataTable) => {
  const data = dataTable.rowsHash(); // { 'メールアドレス': 'user@example.com', 'パスワード': 'Password123!' }
  const loginPage = new LoginPage(page);
  await loginPage.fillEmail(data['メールアドレス']);
  await loginPage.fillPassword(data['パスワード']);
});
```

### hashes（テーブル）

```gherkin
Given 以下の予約が存在する
  | id | customer_name | status |
  | 1 | 山田太郎 | pending |
  | 2 | 佐藤花子 | confirmed |
```

```typescript
Given('以下の予約が存在する', async ({ request }, dataTable) => {
  const rows = dataTable.hashes(); // [{ id: '1', customer_name: '山田太郎', status: 'pending' }, ...]
  for (const row of rows) {
    await createReservation(request, row);
  }
});
```

---

## ベストプラクティス

1. **Page Objectを活用**
   - ステップ定義にUIの詳細を書かない
   - Page Objectに委譲

2. **再利用可能なステップを作る**
   - パラメータ化して汎用性を高める
   - 正規表現で柔軟に対応

3. **ヘルパー関数を活用**
   - 認証、データセットアップを共通化
   - テストコードの可読性を向上

4. **非同期処理を適切に扱う**
   - `await` を忘れない
   - `waitForLoadState`, `waitForSelector` で待機

5. **エラーメッセージを明確に**
   - アサーションが失敗したときに原因が分かるように
