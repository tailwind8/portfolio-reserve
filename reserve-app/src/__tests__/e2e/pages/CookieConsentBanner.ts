import { type Page, type Locator } from '@playwright/test';

/**
 * Cookie同意バナーのPage Objectクラス
 */
export class CookieConsentBanner {
  readonly page: Page;
  readonly banner: Locator;
  readonly consentButton: Locator;
  readonly privacyPolicyLink: Locator;
  readonly bannerText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.banner = page.locator('[data-testid="cookie-consent-banner"]');
    this.consentButton = page.locator('[data-testid="cookie-consent-accept"]');
    this.privacyPolicyLink = page.locator(
      '[data-testid="cookie-consent-privacy-link"]'
    );
    this.bannerText = this.banner.locator('text=/Cookie/i');
  }

  /**
   * Cookie同意バナーが表示されているか確認
   */
  async isVisible(): Promise<boolean> {
    return await this.banner.isVisible();
  }

  /**
   * Cookie同意バナーが非表示か確認
   */
  async isHidden(): Promise<boolean> {
    return !(await this.banner.isVisible());
  }

  /**
   * 「同意する」ボタンをクリック
   */
  async clickAccept(): Promise<void> {
    await this.consentButton.click();
  }

  /**
   * プライバシーポリシーリンクをクリック
   */
  async clickPrivacyPolicyLink(): Promise<void> {
    await this.privacyPolicyLink.click();
  }

  /**
   * バナーに"Cookie"という文言が含まれているか確認
   */
  async hasCookieText(): Promise<boolean> {
    return await this.bannerText.isVisible();
  }

  /**
   * 「同意する」ボタンが表示されているか確認
   */
  async hasAcceptButton(): Promise<boolean> {
    return await this.consentButton.isVisible();
  }

  /**
   * プライバシーポリシーリンクが表示されているか確認
   */
  async hasPrivacyPolicyLink(): Promise<boolean> {
    return await this.privacyPolicyLink.isVisible();
  }

  /**
   * LocalStorageに同意情報が保存されているか確認
   */
  async hasConsentInLocalStorage(): Promise<boolean> {
    const consent = await this.page.evaluate(() => {
      return localStorage.getItem('cookieConsent');
    });
    return consent === 'accepted';
  }

  /**
   * LocalStorageの同意情報をクリア
   */
  async clearConsentFromLocalStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('cookieConsent');
    });
  }

  /**
   * LocalStorageに同意情報を設定
   */
  async setConsentInLocalStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.setItem('cookieConsent', 'accepted');
    });
  }

  /**
   * バナーがページ下部に固定表示されているか確認
   */
  async isFixedAtBottom(): Promise<boolean> {
    const position = await this.banner.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        position: style.position,
        bottom: style.bottom,
      };
    });
    return position.position === 'fixed' && position.bottom === '0px';
  }

  /**
   * Tabキーで「同意する」ボタンにフォーカス
   */
  async focusAcceptButtonWithTab(): Promise<void> {
    await this.page.keyboard.press('Tab');
    // 必要に応じて複数回Tabを押してフォーカスを移動
    const isFocused = await this.consentButton.evaluate((el) => {
      return document.activeElement === el;
    });
    if (!isFocused) {
      await this.page.keyboard.press('Tab');
    }
  }

  /**
   * Enterキーを押す
   */
  async pressEnter(): Promise<void> {
    await this.page.keyboard.press('Enter');
  }

  /**
   * バナーがモバイル画面に収まっているか確認
   */
  async fitsInMobileViewport(): Promise<boolean> {
    const bannerBox = await this.banner.boundingBox();
    if (!bannerBox) return false;

    const viewport = this.page.viewportSize();
    if (!viewport) return false;

    return bannerBox.width <= viewport.width;
  }

  /**
   * 「同意する」ボタンがタップしやすいサイズか確認（44x44px以上）
   */
  async hasAccessibleButtonSize(): Promise<boolean> {
    const buttonBox = await this.consentButton.boundingBox();
    if (!buttonBox) return false;

    // WCAG推奨のタッチターゲットサイズ: 44x44px以上
    return buttonBox.width >= 44 && buttonBox.height >= 44;
  }
}
