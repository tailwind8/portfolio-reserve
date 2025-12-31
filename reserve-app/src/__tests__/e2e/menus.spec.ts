import { test } from '@playwright/test';
import { setupMSW } from './msw-setup';
import { MenusPage } from './pages/MenusPage';

/**
 * Feature: メニュー一覧表示
 * Gherkinシナリオ: features/menus.feature
 *
 * 顧客として予約前にメニュー一覧を確認したい
 */

test.describe('メニュー一覧表示', () => {
  let menusPage: MenusPage;

  test.beforeEach(async ({ page }) => {
    // MSWセットアップ（APIモック）
    await setupMSW(page);
    menusPage = new MenusPage(page);
  });

  /**
   * Scenario: すべてのアクティブなメニューが表示される
   *   When ページが読み込まれる
   *   Then すべてのアクティブなメニューが表示される
   *   And 各メニューに名前が表示される
   *   And 各メニューに料金が表示される
   *   And 各メニューに所要時間が表示される
   *   And 各メニューに説明が表示される
   */
  test('すべてのアクティブなメニューが表示される', async () => {
    // Given: メニュー一覧ページにアクセスしている
    await menusPage.goto();

    // When: ページが読み込まれる（自動的に読み込まれる）

    // Then: ページタイトル"メニュー一覧"が表示される
    await menusPage.expectPageTitleVisible('メニュー一覧');

    // And: すべてのアクティブなメニューが表示される（MSWで3件をモック）
    await menusPage.expectMenuCardsVisible(3);

    // And: 各メニューに名前、料金、所要時間、説明が表示される
    const firstMenu = menusPage.getFirstMenuCard();
    await menusPage.expectMenuCardDetailsVisible(firstMenu);
  });

  /**
   * Scenario: カテゴリ別にメニューがグループ化されている
   *   Given メニュー一覧ページにアクセスしている
   *   When ページが読み込まれる
   *   Then カテゴリ見出しが表示される
   *   And 各カテゴリ配下に該当メニューが表示される
   */
  test('カテゴリ別にメニューがグループ化されている', async () => {
    // Given: メニュー一覧ページにアクセスしている
    await menusPage.goto();

    // When: ページが読み込まれる（自動的に読み込まれる）

    // Then: カテゴリ見出しが表示される
    await menusPage.expectCategoryHeadingsVisible();
  });

  /**
   * Scenario: メニューから予約ページへ遷移できる
   *   Given メニュー一覧ページにアクセスしている
   *   When ページが読み込まれる
   *   And 最初のメニューの"このメニューで予約"ボタンをクリックする
   *   Then 予約ページ"/booking"にリダイレクトされる
   *   And メニューIDがクエリパラメータに含まれている
   */
  test('メニューから予約ページへ遷移できる', async () => {
    // Given: メニュー一覧ページにアクセスしている
    await menusPage.goto();

    // When: ページが読み込まれる（自動的に読み込まれる）

    // メニューIDを取得
    const firstMenuCard = menusPage.getFirstMenuCard();
    const menuId = await menusPage.getMenuId(firstMenuCard);

    // And: 最初のメニューの"このメニューで予約"ボタンをクリックする
    await menusPage.clickFirstMenuBookButton();

    // Then: 予約ページ"/booking"にリダイレクトされる
    await menusPage.expectRedirectToBookingPage();

    // And: メニューIDがクエリパラメータに含まれている
    if (menuId) {
      await menusPage.expectUrlContainsMenuId(menuId);
    }
  });

  /**
   * Scenario: 料金が正しいフォーマットで表示される
   *   Given メニュー一覧ページにアクセスしている
   *   When ページが読み込まれる
   *   Then 料金が¥記号付きで表示される
   */
  test('料金が正しいフォーマットで表示される', async () => {
    // Given: メニュー一覧ページにアクセスしている
    await menusPage.goto();

    // When: ページが読み込まれる（自動的に読み込まれる）

    // Then: 料金が¥記号付きで表示される
    await menusPage.expectPriceHasYenSymbol();
  });

  /**
   * Scenario: 所要時間が分表示される
   *   Given メニュー一覧ページにアクセスしている
   *   When ページが読み込まれる
   *   Then 所要時間が"分"単位で表示される
   */
  test('所要時間が分表示される', async () => {
    // Given: メニュー一覧ページにアクセスしている
    await menusPage.goto();

    // When: ページが読み込まれる（自動的に読み込まれる）

    // Then: 所要時間が"分"単位で表示される
    await menusPage.expectDurationHasMinuteSuffix();
  });

  /**
   * Scenario: メニューが存在しない場合の表示
   *   Given メニューが1件も存在しない
   *   When メニュー一覧ページにアクセスする
   *   Then "メニューが見つかりません"というメッセージが表示される
   *
   * 注: MSWハンドラーを拡張する必要があるため、スキップ
   */
  test.skip('メニューが存在しない場合の表示', async () => {
    // TODO: MSWハンドラーを拡張して空配列を返すようにする
  });

  /**
   * Scenario: ローディング状態が表示される
   *   Given ユーザーがメニュー一覧ページにアクセスする
   *   When データ取得中である
   *   Then ローディングインジケーターが表示される
   *   And メニューカードは表示されない
   *
   * 注: ローディング状態の観測は難しいため、スキップ
   */
  test.skip('ローディング状態が表示される', async () => {
    // TODO: ローディング状態のテスト実装
  });

  /**
   * Scenario: モバイルで正しく表示される
   *   Given モバイル画面サイズ（375x667）に設定している
   *   When メニュー一覧ページにアクセスする
   *   Then メニューカードが縦1列で表示される
   *   And すべてのメニュー情報が読みやすく表示される
   */
  test('モバイルで正しく表示される', async () => {
    // Given: モバイル画面サイズに設定
    await menusPage.setMobileViewport();

    // When: メニュー一覧ページにアクセスする
    await menusPage.goto();

    // Then: メニューカードが表示される
    await menusPage.expectMenuCardsVisible(3);
    await menusPage.expectGridColumns('1');

    // And: すべてのメニュー情報が読みやすく表示される
    const firstMenu = menusPage.getFirstMenuCard();
    await menusPage.expectMenuCardDetailsVisible(firstMenu);
  });

  /**
   * Scenario: タブレットで正しく表示される
   *   Given タブレット画面サイズ（768x1024）に設定している
   *   When メニュー一覧ページにアクセスする
   *   Then メニューカードがグリッド2列で表示される
   */
  test('タブレットで正しく表示される', async () => {
    // Given: タブレット画面サイズに設定
    await menusPage.setTabletViewport();

    // When: メニュー一覧ページにアクセスする
    await menusPage.goto();

    // Then: メニューカードがグリッド2列で表示される
    await menusPage.expectMenuCardsVisible(3);
    await menusPage.expectGridColumns('2');
  });

  /**
   * Scenario: デスクトップで正しく表示される
   *   Given デスクトップ画面サイズ（1920x1080）に設定している
   *   When メニュー一覧ページにアクセスする
   *   Then メニューカードがグリッド3列以上で表示される
   */
  test('デスクトップで正しく表示される', async () => {
    // Given: デスクトップ画面サイズに設定
    await menusPage.setDesktopViewport();

    // When: メニュー一覧ページにアクセスする
    await menusPage.goto();

    // Then: メニューカードがグリッド3列以上で表示される
    await menusPage.expectMenuCardsVisible(3);
    await menusPage.expectGridColumns('3+');
  });

  /**
   * Scenario: メニューカードにマウスホバーでハイライト表示される
   *   When 最初のメニューカードにマウスをホバーする
   *   Then メニューカードがハイライト表示される
   */
  test('メニューカードにマウスホバーでハイライト表示される', async () => {
    // Given: メニュー一覧ページにアクセス
    await menusPage.goto();

    // When: 最初のメニューカードにマウスをホバーする
    await menusPage.hoverFirstMenuCard();

    // Then: メニューカードがハイライト表示される
    await menusPage.expectFirstMenuCardHighlighted();
  });
});

/**
 * Feature: メニュー検索・フィルタリング（Phase 2予定）
 *
 * 注: 現在は実装されていないため、テストはスキップ
 */
test.describe('メニュー検索・フィルタリング (Phase 2)', () => {
  test.skip('カテゴリでメニューをフィルタリングできる', async () => {
    // Phase 2で実装予定
  });

  test.skip('メニュー名で検索できる', async () => {
    // Phase 2で実装予定
  });
});
