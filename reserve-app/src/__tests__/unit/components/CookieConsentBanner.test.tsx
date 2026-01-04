import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CookieConsentBanner from '@/components/CookieConsentBanner';

// LocalStorageのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('初回アクセス時にバナーが表示される', async () => {
    render(<CookieConsentBanner />);

    // クライアントサイドでのマウントを待つ
    await waitFor(() => {
      expect(
        screen.getByTestId('cookie-consent-banner')
      ).toBeInTheDocument();
    });

    // Cookie同意の文言が表示される
    expect(
      screen.getByText(/このサイトでは、ユーザー体験の向上/i)
    ).toBeInTheDocument();
  });

  it('「同意する」ボタンが表示される', async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(
        screen.getByTestId('cookie-consent-accept')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('同意する')).toBeInTheDocument();
  });

  it('プライバシーポリシーリンクが表示される', async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(
        screen.getByTestId('cookie-consent-privacy-link')
      ).toBeInTheDocument();
    });

    const link = screen.getByTestId('cookie-consent-privacy-link');
    expect(link).toHaveAttribute('href', '/privacy');
    expect(link).toHaveTextContent('プライバシーポリシー');
  });

  it('「同意する」ボタンをクリックするとバナーが非表示になる', async () => {
    render(<CookieConsentBanner />);

    // バナーが表示されるまで待つ
    const banner = await screen.findByTestId('cookie-consent-banner');
    expect(banner).toBeInTheDocument();

    // 「同意する」ボタンをクリック
    const acceptButton = screen.getByTestId('cookie-consent-accept');
    fireEvent.click(acceptButton);

    // バナーが非表示になる
    await waitFor(() => {
      expect(
        screen.queryByTestId('cookie-consent-banner')
      ).not.toBeInTheDocument();
    });
  });

  it('「同意する」ボタンをクリックするとLocalStorageに保存される', async () => {
    render(<CookieConsentBanner />);

    // バナーが表示されるまで待つ
    await screen.findByTestId('cookie-consent-banner');

    // 「同意する」ボタンをクリック
    const acceptButton = screen.getByTestId('cookie-consent-accept');
    fireEvent.click(acceptButton);

    // LocalStorageに保存される
    await waitFor(() => {
      expect(localStorageMock.getItem('cookieConsent')).toBe('accepted');
    });
  });

  it('同意済みの場合はバナーが表示されない', async () => {
    // 同意情報を事前に保存
    localStorageMock.setItem('cookieConsent', 'accepted');

    render(<CookieConsentBanner />);

    // バナーが表示されないことを確認
    await waitFor(() => {
      expect(
        screen.queryByTestId('cookie-consent-banner')
      ).not.toBeInTheDocument();
    });
  });
});
