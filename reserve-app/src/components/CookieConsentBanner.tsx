'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'cookieConsent';
const COOKIE_CONSENT_VALUE = 'accepted';

export default function CookieConsentBanner() {
  const [isHidden, setIsHidden] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // クライアントサイドでマウントされたことを記録
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const handleAccept = () => {
    // LocalStorageに同意情報を保存
    localStorage.setItem(COOKIE_CONSENT_KEY, COOKIE_CONSENT_VALUE);

    // バナーを非表示
    setIsHidden(true);
  };

  // 同意情報をチェック（クライアントサイドのみ）
  const hasConsent =
    isMounted &&
    localStorage.getItem(COOKIE_CONSENT_KEY) === COOKIE_CONSENT_VALUE;

  // まだマウントされていない、または同意済み、またはバナーを閉じた場合は非表示
  if (!isMounted || hasConsent || isHidden) {
    return null;
  }

  return (
    <div
      data-testid="cookie-consent-banner"
      className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50"
    >
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-sm">
          <p>
            このサイトでは、ユーザー体験の向上とサービス改善のためにCookieを使用しています。
            Cookieの使用に同意いただける場合は、「同意する」ボタンをクリックしてください。
            詳細は
            <Link
              href="/privacy"
              data-testid="cookie-consent-privacy-link"
              className="underline hover:text-blue-300 ml-1"
            >
              プライバシーポリシー
            </Link>
            をご確認ください。
          </p>
        </div>
        <button
          type="button"
          data-testid="cookie-consent-accept"
          onClick={handleAccept}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded min-w-[120px] min-h-[44px] font-medium transition-colors whitespace-nowrap"
        >
          同意する
        </button>
      </div>
    </div>
  );
}
