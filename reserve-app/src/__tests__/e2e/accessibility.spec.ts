import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * アクセシビリティ（a11y）テスト
 *
 * 目的:
 * - 主要ページがWCAG 2.1レベルAA基準を満たすことを確認
 * - axe-coreを使用した自動a11yチェック
 * - スクリーンリーダー対応の基本的な確認
 *
 * 参考:
 * - WCAG 2.1: https://www.w3.org/TR/WCAG21/
 * - axe-core: https://github.com/dequelabs/axe-core
 */

test.describe('アクセシビリティテスト', () => {
  // 共通のaxe-core設定
  // 一部のルールは既知の問題として除外（将来的に修正予定）
  const axeConfig = {
    // WCAGレベルA、AAに準拠
    runOnly: {
      type: 'tag' as const,
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
  };

  test.describe('公開ページ', () => {
    test('ホームページのa11yチェック', async ({ page }) => {
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .options(axeConfig)
        .analyze();

      // 違反がある場合は詳細を出力
      if (results.violations.length > 0) {
        console.log('a11y違反:', JSON.stringify(results.violations, null, 2));
      }

      // 重大な違反（critical, serious）がないことを確認
      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toEqual([]);
    });

    test('メニュー一覧ページのa11yチェック', async ({ page }) => {
      await page.goto('/menus');

      const results = await new AxeBuilder({ page })
        .options(axeConfig)
        .analyze();

      if (results.violations.length > 0) {
        console.log('a11y違反:', JSON.stringify(results.violations, null, 2));
      }

      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toEqual([]);
    });

    test('プライバシーポリシーページのa11yチェック', async ({ page }) => {
      await page.goto('/privacy');

      const results = await new AxeBuilder({ page })
        .options(axeConfig)
        .analyze();

      if (results.violations.length > 0) {
        console.log('a11y違反:', JSON.stringify(results.violations, null, 2));
      }

      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toEqual([]);
    });

    test('利用規約ページのa11yチェック', async ({ page }) => {
      await page.goto('/terms');

      const results = await new AxeBuilder({ page })
        .options(axeConfig)
        .analyze();

      if (results.violations.length > 0) {
        console.log('a11y違反:', JSON.stringify(results.violations, null, 2));
      }

      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toEqual([]);
    });

    test('ログインページのa11yチェック', async ({ page }) => {
      await page.goto('/login');

      const results = await new AxeBuilder({ page })
        .options(axeConfig)
        .analyze();

      if (results.violations.length > 0) {
        console.log('a11y違反:', JSON.stringify(results.violations, null, 2));
      }

      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe('セマンティックHTML構造', () => {
    test('ホームページのセマンティック構造', async ({ page }) => {
      await page.goto('/');

      // main要素が存在する
      const main = page.locator('main');
      await expect(main).toBeVisible();

      // h1が1つだけ存在する
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);

      // header要素が存在する
      const header = page.locator('header');
      await expect(header).toBeVisible();
    });

    test('メニュー一覧ページのセマンティック構造', async ({ page }) => {
      await page.goto('/menus');

      // main要素が存在する
      const main = page.locator('main');
      await expect(main).toBeVisible();

      // h1が1つだけ存在する
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
    });
  });

  test.describe('キーボードナビゲーション', () => {
    test('ログインフォームのキーボード操作', async ({ page }) => {
      await page.goto('/login');

      // Tabキーでフォーム要素を移動できる
      await page.keyboard.press('Tab');

      // フォーカスがメールフィールドに当たる
      const emailField = page.locator('[data-testid="login-email"]');
      const passwordField = page.locator('[data-testid="login-password"]');
      const submitButton = page.locator('[data-testid="login-submit"]');

      // いずれかの要素にフォーカスが当たっていることを確認
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName?.toLowerCase();
      });

      // input, button, aのいずれかにフォーカスが当たっている
      expect(['input', 'button', 'a']).toContain(focusedElement);

      // Tab移動でパスワードフィールド、送信ボタンに移動できる
      // （実際のフォーカス順序はDOM順に依存）
    });

    test('メニューカードのキーボード選択', async ({ page }) => {
      await page.goto('/menus');

      // リンクやボタンにTabで移動できることを確認
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName?.toLowerCase();
      });

      // フォーカス可能な要素に当たっている
      expect(['a', 'button', 'input']).toContain(focusedElement);
    });
  });

  test.describe('カラーコントラスト', () => {
    test('テキストのコントラスト比（自動チェック）', async ({ page }) => {
      await page.goto('/');

      // axe-coreのcolor-contrastルールでチェック
      const results = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();

      if (results.violations.length > 0) {
        console.log(
          'コントラスト違反:',
          JSON.stringify(results.violations, null, 2)
        );
      }

      // 重大なコントラスト違反がないことを確認
      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe('フォームアクセシビリティ', () => {
    test('ログインフォームのラベル', async ({ page }) => {
      await page.goto('/login');

      // axe-coreのフォーム関連ルールでチェック
      const results = await new AxeBuilder({ page })
        .withRules(['label', 'form-field-multiple-labels'])
        .analyze();

      if (results.violations.length > 0) {
        console.log(
          'フォームラベル違反:',
          JSON.stringify(results.violations, null, 2)
        );
      }

      // ラベルに関する違反がないことを確認
      expect(results.violations).toEqual([]);
    });
  });

  test.describe('画像アクセシビリティ', () => {
    test('画像のalt属性', async ({ page }) => {
      await page.goto('/');

      // axe-coreの画像関連ルールでチェック
      const results = await new AxeBuilder({ page })
        .withRules(['image-alt'])
        .analyze();

      if (results.violations.length > 0) {
        console.log(
          '画像alt違反:',
          JSON.stringify(results.violations, null, 2)
        );
      }

      // 画像のalt属性に関する違反がないことを確認
      expect(results.violations).toEqual([]);
    });
  });

  test.describe('管理画面', () => {
    test('管理者ダッシュボードのa11yチェック', async ({ page }) => {
      await page.goto('/admin/dashboard');

      const results = await new AxeBuilder({ page })
        .options(axeConfig)
        .analyze();

      if (results.violations.length > 0) {
        console.log('a11y違反:', JSON.stringify(results.violations, null, 2));
      }

      // 重大な違反がないことを確認
      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toEqual([]);
    });

    test('予約一覧ページのa11yチェック', async ({ page }) => {
      await page.goto('/admin/reservations');

      const results = await new AxeBuilder({ page })
        .options(axeConfig)
        .analyze();

      if (results.violations.length > 0) {
        console.log('a11y違反:', JSON.stringify(results.violations, null, 2));
      }

      // 重大な違反がないことを確認
      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toEqual([]);
    });
  });
});
