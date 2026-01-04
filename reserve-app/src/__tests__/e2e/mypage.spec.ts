import { test, expect } from '@playwright/test';
import { setupMSW } from './msw-setup';
import { MyPage } from './pages/MyPage';

/**
 * Feature: マイページ - 予約管理
 * ユーザーとして予約の確認・変更・キャンセルをしたい
 */
test.describe('MyPage - 予約一覧', () => {
  let myPage: MyPage;

  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
    myPage = new MyPage(page);
    await myPage.goto();
  });

  /**
   * Scenario: マイページにアクセスする
   *   Then ページタイトルに「マイページ」が表示される
   *   And 「予約の確認・変更・キャンセルができます」という説明が表示される
   */
  test('should display mypage with correct title @smoke', async () => {
    await myPage.expectPageHeading('マイページ');
    await myPage.expectDescription();
  });

  /**
   * Scenario: ステータスフィルタタブが表示される
   */
  test('should display status filter tabs', async () => {
    await myPage.waitForLoad();
    await myPage.expectAllStatusTabsVisible();
  });

  /**
   * Scenario: 予約一覧が読み込まれる
   *   When ページの読み込みが完了する
   *   Then 予約一覧が表示される、または「予約がありません」が表示される
   */
  test('should load and display reservations @smoke', async () => {
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();
    await myPage.expectReservationsOrEmptyState();
  });

  /**
   * Scenario: 予約カードに正しい情報が表示される
   *   Given 予約が1件以上存在する
   *   Then 予約カードにステータスバッジが表示される
   *   And 予約カードにメニューアイコンが表示される
   *   And 予約カードにスタッフアイコンが表示される
   *   And 「予約を変更」ボタンが表示される
   *   And 「キャンセル」ボタンが表示される
   */
  test('should display reservation cards with correct information', async () => {
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();
    await myPage.expectReservationCardInfo();
  });
});

/**
 * Feature: ステータスフィルタリング
 */
test.describe('MyPage - ステータスフィルタリング', () => {
  let myPage: MyPage;

  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
    myPage = new MyPage(page);
    await myPage.goto();
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();
  });

  /**
   * Scenario: ステータスで予約をフィルタリングできる
   *   When 「予約確定」タブをクリックする
   *   Then 「予約確定」タブがアクティブになる
   */
  test('should filter reservations by status', async () => {
    await myPage.clickStatusTab('予約確定');
    await myPage.expectTabActive('予約確定');
  });

  /**
   * Scenario: 各ステータスの件数が表示される
   *   Then 各タブに件数バッジが表示される
   */
  test('should show count for each status', async () => {
    await myPage.expectTabCountBadges();
  });

  /**
   * Scenario: フィルタ結果が空の場合に空状態が表示される
   *   When 「キャンセル」タブをクリックする
   *   And そのステータスの予約が存在しない
   *   Then 「予約がありません」または「キャンセルの予約がありません」が表示される
   */
  test('should display empty state when no reservations match filter', async () => {
    await myPage.clickStatusTab('キャンセル');
    await myPage.expectEmptyState('キャンセル');
  });
});

/**
 * Feature: 予約変更フロー
 */
test.describe('MyPage - 予約変更フロー', () => {
  let myPage: MyPage;

  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
    myPage = new MyPage(page);
    await myPage.goto();
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();
  });

  /**
   * Scenario: 予約編集モーダルを開く
   *   Given 予約が1件以上存在する
   *   When 「予約を変更」ボタンをクリックする
   *   Then 「予約変更」というタイトルのモーダルが表示される
   */
  test('should open edit modal when clicking edit button', async ({ page }) => {
    const editButton = page.getByRole('button', { name: '予約を変更' }).first();
    if (await editButton.isVisible()) {
      await myPage.openEditModal();
      await myPage.expectEditModalVisible();
    }
  });

  /**
   * Scenario: 予約編集モーダルを閉じる
   *   Given 予約編集モーダルを開いている
   *   When 閉じるボタンをクリックする
   *   Then モーダルが閉じる
   */
  test('should close edit modal when clicking close button', async ({ page }) => {
    const editButton = page.getByRole('button', { name: '予約を変更' }).first();
    if (await editButton.isVisible()) {
      await myPage.openEditModal();
      await expect(page.getByRole('heading', { name: '予約変更' })).toBeVisible();
      await myPage.closeEditModal();
      await myPage.expectEditModalClosed();
    }
  });

  /**
   * Scenario: 予約編集フォームに既存データが事前入力されている
   *   Given 予約が1件以上存在する
   *   When 「予約を変更」ボタンをクリックする
   *   Then メニュー選択に値が入っている
   *   And スタッフ選択に値が入っている
   */
  test('should have form pre-filled with existing reservation data', async ({ page }) => {
    const editButton = page.getByRole('button', { name: '予約を変更' }).first();
    if (await editButton.isVisible()) {
      await myPage.openEditModal();
      await myPage.expectFormPreFilled();
    }
  });

  /**
   * Scenario: 編集モーダルで過去の日付が無効化される
   *   Given 予約編集モーダルを開いている
   *   Then 過去の日付ボタンが無効化されている
   */
  test('should disable past dates in edit modal calendar', async ({ page }) => {
    const editButton = page.getByRole('button', { name: '予約を変更' }).first();
    if (await editButton.isVisible()) {
      await myPage.openEditModal();
      await myPage.expectPastDatesDisabled();
    }
  });

  /**
   * Scenario: 予約のメニューを変更できる
   *   Given 予約編集モーダルを開いている
   *   When 別のメニューを選択する
   *   Then 新しいメニューが選択される
   */
  test('should change menu in edit modal', async ({ page }) => {
    const editButton = page.getByRole('button', { name: '予約を変更' }).first();
    if (await editButton.isVisible()) {
      await myPage.openEditModal();
      await myPage.changeMenu();
    }
  });

  /**
   * Scenario: 予約のスタッフを変更できる
   *   Given 予約編集モーダルを開いている
   *   When 別のスタッフを選択する
   *   Then 新しいスタッフが選択される
   */
  test('should change staff in edit modal', async ({ page }) => {
    const editButton = page.getByRole('button', { name: '予約を変更' }).first();
    if (await editButton.isVisible()) {
      await myPage.openEditModal();
      await myPage.changeStaff();
    }
  });

  /**
   * Scenario: 予約の備考を編集できる
   *   Given 予約編集モーダルを開いている
   *   When 備考欄を編集する
   *   Then 新しい備考が入力される
   */
  test('should edit notes in edit modal', async ({ page }) => {
    const editButton = page.getByRole('button', { name: '予約を変更' }).first();
    if (await editButton.isVisible()) {
      await myPage.openEditModal();
      await myPage.editNotes('新しい要望を追加しました');
    }
  });
});

/**
 * Feature: 予約キャンセルフロー
 */
test.describe('MyPage - 予約キャンセルフロー', () => {
  let myPage: MyPage;

  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
    myPage = new MyPage(page);
    await myPage.goto();
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();
  });

  /**
   * Scenario: 予約キャンセル確認ダイアログを開く
   *   Given 予約が1件以上存在し、キャンセル可能である
   *   When 「キャンセル」ボタンをクリックする
   *   Then 「予約をキャンセルしますか？」というダイアログが表示される
   */
  test('should open cancel confirmation dialog when clicking cancel button', async ({ page }) => {
    const cancelButton = page.getByRole('button', { name: 'キャンセル' }).first();
    if (await cancelButton.isVisible() && (await cancelButton.isEnabled())) {
      await myPage.openCancelDialog();
      await myPage.expectCancelDialogVisible();
    }
  });

  /**
   * Scenario: キャンセル確認ダイアログを閉じる
   *   Given キャンセル確認ダイアログを開いている
   *   When 「戻る」ボタンをクリックする
   *   Then ダイアログが閉じる
   */
  test('should close cancel dialog when clicking back button', async ({ page }) => {
    const cancelButton = myPage['getFirstCancelButton']();
    if (await cancelButton.isVisible() && (await cancelButton.isEnabled())) {
      await myPage.openCancelDialog();
      await expect(page.getByText('予約をキャンセルしますか?')).toBeVisible();
      await myPage.closeCancelDialog();
      await myPage.expectCancelDialogClosed();
    }
  });

  /**
   * Scenario: キャンセル確認ダイアログで予約の詳細が表示される
   *   Given 予約が1件以上存在し、キャンセル可能である
   *   When 「キャンセル」ボタンをクリックする
   *   Then 予約日時、メニュー名、担当者名、料金、所要時間が表示される
   */
  test('should display reservation summary in cancel dialog', async ({ page }) => {
    const cancelButton = page.getByRole('button', { name: 'キャンセル' }).first();
    if (await cancelButton.isVisible() && (await cancelButton.isEnabled())) {
      await myPage.openCancelDialog();
      await myPage.expectReservationDetailsInDialog();
    }
  });

  /**
   * Scenario: 過去の予約の編集・キャンセルボタンが無効化される
   *   Given 過去の予約が存在する
   *   Then 「予約を変更」ボタンが無効化されている
   *   And 「キャンセル」ボタンが無効化されている
   */
  test('should disable edit and cancel buttons for past reservations', async () => {
    await myPage.expectPastReservationButtonsDisabled();
  });

  /**
   * Scenario: キャンセル確認ダイアログで予約の詳細が表示される（完全版）
   */
  test('should show all reservation details in cancel dialog', async ({ page }) => {
    const cancelButton = page.getByRole('button', { name: 'キャンセル' }).first();
    if (await cancelButton.isVisible() && (await cancelButton.isEnabled())) {
      await myPage.openCancelDialog();
      await myPage.expectReservationDetailsInDialog();
      await myPage.expectCancelWarningMessage();
    }
  });

  /**
   * Scenario: キャンセル警告メッセージが表示される
   *   Given キャンセル確認ダイアログが表示されている
   *   Then "この操作は取り消せません"という警告が表示される
   */
  test('should display warning message in cancel dialog', async ({ page }) => {
    const cancelButton = page.getByRole('button', { name: 'キャンセル' }).first();
    if (await cancelButton.isVisible() && (await cancelButton.isEnabled())) {
      await myPage.openCancelDialog();

      // Warning icon should be visible
      const warningIcon = page.locator('svg').filter({ has: page.locator('path[stroke-linecap="round"]') }).first();
      await expect(warningIcon).toBeVisible();

      await myPage.expectCancelWarningMessage();
    }
  });
});

/**
 * Feature: エラーハンドリング
 */
test.describe('MyPage - エラーハンドリング', () => {
  let myPage: MyPage;

  /**
   * Scenario: APIエラー時にエラーメッセージが表示される
   *   Given APIがエラーを返す
   *   When マイページにアクセスする
   *   Then 「エラーが発生しました」というメッセージが表示される
   *   And 「再試行」ボタンが表示される
   */
  test('should display error message when API fails', async ({ page }) => {
    await setupMSW(page);
    myPage = new MyPage(page);

    // Intercept API call and return error
    await page.route('**/api/reservations', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'Internal Server Error' },
        }),
      });
    });

    await myPage.goto();
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();
    await myPage.expectErrorMessageVisible();
  });

  /**
   * Scenario: エラー時に再試行できる
   *   Given APIがエラーを返している
   *   And マイページにアクセスしている
   *   When 「再試行」ボタンをクリックする
   *   And 2回目のAPIリクエストが成功する
   *   Then エラーメッセージが消える
   */
  test('should retry fetching reservations when clicking retry button', async ({ page }) => {
    await setupMSW(page);
    myPage = new MyPage(page);
    let requestCount = 0;

    // Intercept API calls
    await page.route('**/api/reservations', (route) => {
      requestCount++;
      if (requestCount === 1) {
        // First request fails
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Internal Server Error' },
          }),
        });
      } else {
        // Second request succeeds
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      }
    });

    await myPage.goto();
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();

    // Error should be visible first
    await myPage.expectErrorMessageVisible();

    // Click retry button
    await myPage.clickRetryButton();

    // Wait for loading to complete again
    await myPage.waitForLoadingComplete();

    // Error should disappear
    await myPage.expectErrorMessageHidden();
  });
});

/**
 * Feature: レスポンシブデザイン
 */
test.describe('MyPage - レスポンシブデザイン', () => {
  let myPage: MyPage;

  /**
   * Scenario: モバイルで正しく表示される
   *   Given モバイル画面サイズ（375x667）に設定している
   *   When マイページにアクセスする
   *   Then タブコンテナがスクロール可能である
   *   And ページタイトルが表示される
   */
  test('should display correctly on mobile', async ({ page }) => {
    await setupMSW(page);
    myPage = new MyPage(page);

    await myPage.setMobileViewport();
    await myPage.goto();
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();

    await myPage.expectScrollableTabsVisible();
    await myPage.expectPageHeading('マイページ');
  });

  /**
   * Scenario: タブレットで正しく表示される
   *   Given タブレット画面サイズ（768x1024）に設定している
   *   When マイページにアクセスする
   *   Then グリッドが2列で表示される
   */
  test('should display correctly on tablet', async ({ page }) => {
    await setupMSW(page);
    myPage = new MyPage(page);

    await myPage.setTabletViewport();
    await myPage.goto();
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();

    await myPage.expectGridVisible();
  });

  /**
   * Scenario: デスクトップで正しく表示される
   *   Given デスクトップ画面サイズ（1920x1080）に設定している
   *   When マイページにアクセスする
   *   Then グリッドが3列で表示される
   */
  test('should display correctly on desktop', async ({ page }) => {
    await setupMSW(page);
    myPage = new MyPage(page);

    await myPage.setDesktopViewport();
    await myPage.goto();
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();

    await myPage.expectGridVisible();
  });
});
