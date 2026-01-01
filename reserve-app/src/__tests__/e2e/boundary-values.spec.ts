import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { AdminMenuPage } from './pages/AdminMenuPage';
import { BookingPage } from './pages/BookingPage';
import { RegisterPage } from './pages/RegisterPage';

/**
 * E2Eテスト: 入力値の境界値テスト
 *
 * このテストは、すべての入力フィールドに対して境界値テストを実施し、
 * 不正な値の入力を防ぐことを検証します。
 * - 価格の境界値テスト（0円、上限、負の値、小数）
 * - 所要時間の境界値テスト（1分～480分）
 * - 文字数の境界値テスト（備考、メニュー名など）
 * - 営業時間の境界値テスト
 * - パスワードの境界値テスト
 *
 * 対応Gherkin: reserve-app/features/validation/boundary-values.feature
 */

test.describe('入力値の境界値テスト', () => {
  // ===== メニュー価格の境界値テスト =====

  test.describe('メニュー価格の境界値', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto('/admin/login');
      await loginPage.login('admin@example.com', 'admin123');
      await expect(page).toHaveURL('/admin/dashboard');
    });

    test('価格に0円を設定できる（無料メニュー）', async ({ page }) => {
      await page.goto('/admin/menus/new');

      await page.locator('input[name="name"]').fill('無料カウンセリング');
      await page.locator('input[name="price"]').fill('0');
      await page.locator('input[name="duration"]').fill('30');
      await page.locator('button[type="submit"]').click();

      await expect(page.locator('text=メニューを登録しました')).toBeVisible();
    });

    test('価格に負の値を設定できない（-1円）', async ({ page }) => {
      await page.goto('/admin/menus/new');

      await page.locator('input[name="name"]').fill('カット');
      await page.locator('input[name="price"]').fill('-1');
      await page.locator('input[name="duration"]').fill('60');
      await page.locator('button[type="submit"]').click();

      await expect(page.locator('text=価格は0以上の整数で入力してください')).toBeVisible();
    });

    test('価格に上限値を設定できる（9999999円）', async ({ page }) => {
      await page.goto('/admin/menus/new');

      await page.locator('input[name="name"]').fill('プレミアムコース');
      await page.locator('input[name="price"]').fill('9999999');
      await page.locator('input[name="duration"]').fill('180');
      await page.locator('button[type="submit"]').click();

      await expect(page.locator('text=メニューを登録しました')).toBeVisible();
    });

    test('価格に上限値を超える値を設定できない（10000000円）', async ({ page }) => {
      await page.goto('/admin/menus/new');

      await page.locator('input[name="name"]').fill('超高額コース');
      await page.locator('input[name="price"]').fill('10000000');
      await page.locator('input[name="duration"]').fill('180');
      await page.locator('button[type="submit"]').click();

      await expect(page.locator('text=価格は9999999円以下で入力してください')).toBeVisible();
    });

    test('価格に小数を設定できない（1000.5円）', async ({ page }) => {
      await page.goto('/admin/menus/new');

      await page.locator('input[name="name"]').fill('カット');
      await page.locator('input[name="price"]').fill('1000.5');
      await page.locator('input[name="duration"]').fill('60');
      await page.locator('button[type="submit"]').click();

      await expect(page.locator('text=価格は整数で入力してください')).toBeVisible();
    });
  });

  // ===== 所要時間の境界値テスト =====

  test.describe('所要時間の境界値', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto('/admin/login');
      await loginPage.login('admin@example.com', 'admin123');
      await expect(page).toHaveURL('/admin/dashboard');
    });

    test('所要時間に最小値を設定できる（1分）', async ({ page }) => {
      await page.goto('/admin/menus/new');

      await page.locator('input[name="name"]').fill('クイック相談');
      await page.locator('input[name="price"]').fill('0');
      await page.locator('input[name="duration"]').fill('1');
      await page.locator('button[type="submit"]').click();

      await expect(page.locator('text=メニューを登録しました')).toBeVisible();
    });

    test('所要時間に0分は設定できない', async ({ page }) => {
      await page.goto('/admin/menus/new');

      await page.locator('input[name="name"]').fill('無効なメニュー');
      await page.locator('input[name="price"]').fill('1000');
      await page.locator('input[name="duration"]').fill('0');
      await page.locator('button[type="submit"]').click();

      await expect(page.locator('text=所要時間は1分以上で入力してください')).toBeVisible();
    });

    test('所要時間に上限値を設定できる（480分 = 8時間）', async ({ page }) => {
      await page.goto('/admin/menus/new');

      await page.locator('input[name="name"]').fill('1日コース');
      await page.locator('input[name="price"]').fill('50000');
      await page.locator('input[name="duration"]').fill('480');
      await page.locator('button[type="submit"]').click();

      await expect(page.locator('text=メニューを登録しました')).toBeVisible();
    });

    test('所要時間に上限値を超える値を設定できない（481分）', async ({ page }) => {
      await page.goto('/admin/menus/new');

      await page.locator('input[name="name"]').fill('超長時間コース');
      await page.locator('input[name="price"]').fill('50000');
      await page.locator('input[name="duration"]').fill('481');
      await page.locator('button[type="submit"]').click();

      await expect(page.locator('text=所要時間は480分以内で入力してください')).toBeVisible();
    });
  });

  // ===== 備考フィールドの文字数境界値テスト =====

  test.describe('備考の文字数境界値', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('tanaka@example.com', 'password123');
    });

    test('備考に499文字入力できる', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.goto();
      await bookingPage.selectMenu(1);
      await bookingPage.selectFutureDate('15');
      await bookingPage.selectAvailableTimeSlot();

      // 499文字のテキスト
      const text499 = 'あ'.repeat(499);
      await bookingPage.fillNotes(text499);
      await bookingPage.submit();

      await expect(page).toHaveURL('/booking/complete');
    });

    test('備考に500文字入力できる（上限）', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.goto();
      await bookingPage.selectMenu(1);
      await bookingPage.selectFutureDate('15');
      await bookingPage.selectAvailableTimeSlot();

      // 500文字のテキスト
      const text500 = 'あ'.repeat(500);
      await bookingPage.fillNotes(text500);
      await bookingPage.submit();

      await expect(page).toHaveURL('/booking/complete');
    });

    test('備考に501文字入力できない（上限超過）', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.goto();
      await bookingPage.selectMenu(1);
      await bookingPage.selectFutureDate('15');
      await bookingPage.selectAvailableTimeSlot();

      // 501文字のテキスト
      const text501 = 'あ'.repeat(501);
      await bookingPage.fillNotes(text501);
      await bookingPage.submit();

      await expect(page.locator('text=備考は500文字以内で入力してください')).toBeVisible();
    });
  });

  // ===== メニュー名の文字数境界値テスト =====

  test.describe('メニュー名の文字数境界値', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto('/admin/login');
      await loginPage.login('admin@example.com', 'admin123');
      await expect(page).toHaveURL('/admin/dashboard');
    });

    test('メニュー名に1文字入力できる（最小値）', async ({ page }) => {
      await page.goto('/admin/menus/new');

      await page.locator('input[name="name"]').fill('A');
      await page.locator('input[name="price"]').fill('1000');
      await page.locator('input[name="duration"]').fill('30');
      await page.locator('button[type="submit"]').click();

      await expect(page.locator('text=メニューを登録しました')).toBeVisible();
    });

    test('メニュー名に100文字入力できる（上限）', async ({ page }) => {
      await page.goto('/admin/menus/new');

      const name100 = 'あ'.repeat(100);
      await page.locator('input[name="name"]').fill(name100);
      await page.locator('input[name="price"]').fill('1000');
      await page.locator('input[name="duration"]').fill('30');
      await page.locator('button[type="submit"]').click();

      await expect(page.locator('text=メニューを登録しました')).toBeVisible();
    });

    test('メニュー名に101文字入力できない（上限超過）', async ({ page }) => {
      await page.goto('/admin/menus/new');

      const name101 = 'あ'.repeat(101);
      await page.locator('input[name="name"]').fill(name101);
      await page.locator('input[name="price"]').fill('1000');
      await page.locator('input[name="duration"]').fill('30');
      await page.locator('button[type="submit"]').click();

      await expect(page.locator('text=メニュー名は100文字以内で入力してください')).toBeVisible();
    });
  });

  // ===== 営業時間の境界値テスト =====

  test.describe('営業時間の境界値', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('tanaka@example.com', 'password123');
    });

    test('開店時刻（09:00）に予約できる', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.goto();
      await bookingPage.selectMenu(1);
      await bookingPage.selectFutureDate('15');

      // 09:00の時間帯を選択
      await page.locator('button:has-text("09:00")').click();
      await bookingPage.submit();

      await expect(page).toHaveURL('/booking/complete');
    });

    test('開店前（08:59）に予約できない', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.goto();
      await bookingPage.selectMenu(1);
      await bookingPage.selectFutureDate('15');

      // 08:59の時間帯が選択肢に表示されない
      const slot0859 = page.locator('button:has-text("08:59")');
      await expect(slot0859).toHaveCount(0);
    });

    test('閉店時刻を考慮した予約（所要時間が閉店時刻を超える）', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.goto();
      await bookingPage.selectMenu(1); // カット（60分）
      await bookingPage.selectFutureDate('15');

      // 19:30の時間帯を選択（20:00閉店の場合、終了時刻が20:30になる）
      const slot1930 = page.locator('button:has-text("19:30")');
      if (await slot1930.isVisible()) {
        await slot1930.click();
        await bookingPage.submit();

        await expect(page.locator('text=予約終了時刻が営業時間を超えています')).toBeVisible();
      } else {
        // ボタンが表示されない（無効化されている）
        await expect(slot1930).toHaveCount(0);
      }
    });

    test('閉店時刻ちょうどに終わる予約は可能', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.goto();
      await bookingPage.selectMenu(1); // カット（60分）
      await bookingPage.selectFutureDate('15');

      // 19:00の時間帯を選択（20:00に終了）
      await page.locator('button:has-text("19:00")').click();
      await bookingPage.submit();

      await expect(page).toHaveURL('/booking/complete');
      await expect(page.locator('[data-testid="confirmation-time"]')).toContainText('19:00');
    });
  });

  // ===== パスワードの境界値テスト =====

  test.describe('パスワードの文字数境界値', () => {
    test('パスワードに7文字は設定できない（最小値未満）', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      await registerPage.fillEmail('test@example.com');
      await registerPage.fillPassword('pass123'); // 7文字
      await registerPage.submit();

      await expect(page.locator('text=パスワードは8文字以上で入力してください')).toBeVisible();
    });

    test('パスワードに8文字設定できる（最小値）', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      await registerPage.fillEmail('test8@example.com');
      await registerPage.fillPassword('pass1234'); // 8文字
      await registerPage.submit();

      await expect(page).toHaveURL('/login');
    });

    test('パスワードに72文字設定できる（上限）', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      const password72 = 'a'.repeat(72);
      await registerPage.fillEmail('test72@example.com');
      await registerPage.fillPassword(password72);
      await registerPage.submit();

      await expect(page).toHaveURL('/login');
    });

    test('パスワードに73文字設定できない（上限超過）', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      const password73 = 'a'.repeat(73);
      await registerPage.fillEmail('test73@example.com');
      await registerPage.fillPassword(password73);
      await registerPage.submit();

      await expect(page.locator('text=パスワードは72文字以内で入力してください')).toBeVisible();
    });
  });

  // ===== 予約人数の境界値テスト =====

  test.describe('予約人数の境界値', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('tanaka@example.com', 'password123');
    });

    test('予約人数に1名設定できる（最小値）', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.goto();
      await bookingPage.selectMenu(1);
      await bookingPage.selectFutureDate('15');
      await bookingPage.selectAvailableTimeSlot();

      await page.locator('input[name="guestCount"]').fill('1');
      await bookingPage.submit();

      await expect(page).toHaveURL('/booking/complete');
    });

    test('予約人数に0名は設定できない', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.goto();
      await bookingPage.selectMenu(1);
      await bookingPage.selectFutureDate('15');
      await bookingPage.selectAvailableTimeSlot();

      await page.locator('input[name="guestCount"]').fill('0');
      await bookingPage.submit();

      await expect(page.locator('text=予約人数は1名以上で入力してください')).toBeVisible();
    });

    test('予約人数に10名設定できる（上限）', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.goto();
      await bookingPage.selectMenu(1);
      await bookingPage.selectFutureDate('15');
      await bookingPage.selectAvailableTimeSlot();

      await page.locator('input[name="guestCount"]').fill('10');
      await bookingPage.submit();

      await expect(page).toHaveURL('/booking/complete');
    });

    test('予約人数に11名は設定できない（上限超過）', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.goto();
      await bookingPage.selectMenu(1);
      await bookingPage.selectFutureDate('15');
      await bookingPage.selectAvailableTimeSlot();

      await page.locator('input[name="guestCount"]').fill('11');
      await bookingPage.submit();

      await expect(page.locator('text=予約人数は10名以下で入力してください')).toBeVisible();
    });
  });
});
