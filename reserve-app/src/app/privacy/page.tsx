import type { Metadata } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'プライバシーポリシー - 予約システム',
  description: 'プライバシーポリシー',
};

export default function PrivacyPage() {
  return (
    <>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1
        className="text-3xl font-bold mb-6"
        data-testid="privacy-policy-title"
      >
        プライバシーポリシー
      </h1>

      <div className="prose max-w-none" data-testid="privacy-content">
        <p className="text-sm text-gray-600 mb-8">
          制定日：2026年1月4日
          <br />
          最終改定日：2026年1月4日
        </p>

        {/* 1. 基本方針 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. 基本方針</h2>
          <p className="text-gray-700 mb-4">
            予約システム（以下「当サービス」といいます）は、ユーザーの個人情報の重要性を認識し、個人情報の保護に関する法律（個人情報保護法）およびEU一般データ保護規則（GDPR）を遵守し、適切に個人情報を取り扱います。
          </p>
        </section>

        {/* 2. 事業者情報 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. 事業者情報</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>
              <strong>サービス名</strong>: 予約システム
            </li>
            <li>
              <strong>運営者</strong>: [事業者名を記載]
            </li>
            <li>
              <strong>代表者</strong>: [代表者名を記載]
            </li>
            <li>
              <strong>所在地</strong>: [所在地を記載]
            </li>
            <li>
              <strong>お問い合わせ</strong>:{' '}
              <a
                href="mailto:privacy@example.com"
                className="text-blue-600 hover:underline"
              >
                privacy@example.com
              </a>
            </li>
          </ul>
          <p className="text-sm text-gray-600 mt-4">
            ※
            本番環境では、上記[　]内に実際の事業者情報を記載してください。
          </p>
        </section>

        {/* 3. 収集する個人情報 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">3. 収集する個人情報</h2>
          <p className="text-gray-700 mb-4">
            当サービスでは、以下の個人情報を収集します：
          </p>

          <h3 className="text-xl font-semibold mb-3">
            3.1 ユーザー登録時に収集する情報
          </h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>氏名（ふりがな含む）</li>
            <li>メールアドレス</li>
            <li>電話番号</li>
            <li>パスワード（暗号化して保存）</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            3.2 予約時に収集する情報
          </h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>予約日時</li>
            <li>利用メニュー</li>
            <li>担当スタッフ</li>
            <li>備考・要望事項</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            3.3 自動的に収集される情報
          </h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>
              IPアドレス、ブラウザ情報、デバイス情報、OS情報、アクセス日時
            </li>
            <li>
              Cookie、LocalStorage（詳細は「6. Cookieとトラッキング技術」を参照）
            </li>
            <li>アクセスログ、行動履歴</li>
          </ul>
        </section>

        {/* 4. 利用目的 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">4. 個人情報の利用目的</h2>
          <p className="text-gray-700 mb-4">
            収集した個人情報は、以下の目的で利用します：
          </p>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>予約の受付、確認、変更、キャンセル処理</li>
            <li>予約確認メール、リマインダーメールの送信</li>
            <li>ユーザーアカウントの管理・認証</li>
            <li>サービス提供、カスタマーサポート対応</li>
            <li>サービスの改善、新機能開発のための統計分析</li>
            <li>不正利用の防止、セキュリティ対策</li>
            <li>
              法令遵守、利用規約違反への対応、紛争解決のための記録保持
            </li>
            <li>お知らせ、キャンペーン情報の配信（同意を得た場合のみ）</li>
          </ol>
        </section>

        {/* 5. 第三者提供 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. 第三者への提供</h2>
          <p className="text-gray-700 mb-4">
            当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません：
          </p>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>ユーザーの同意を得た場合</li>
            <li>
              法令に基づく場合（裁判所、警察等の公的機関からの開示要請）
            </li>
            <li>
              人の生命、身体または財産の保護のために必要がある場合であって、ユーザーの同意を得ることが困難である場合
            </li>
            <li>
              サービス提供に必要な業務委託先（以下参照）への提供（機密保持契約締結済み）
            </li>
          </ol>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            5.1 第三者サービスの利用
          </h3>
          <p className="text-gray-700 mb-4">
            当サービスは、以下の第三者サービスを利用しています：
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>
              <strong>Supabase</strong>（認証・データベース）- データ保管場所：
              シンガポール/米国
            </li>
            <li>
              <strong>Vercel</strong>（ホスティング）- データ保管場所： 米国
            </li>
            <li>
              <strong>Resend</strong>（メール送信）- データ保管場所： 米国
            </li>
            <li>
              <strong>Sentry</strong>（エラー監視）- データ保管場所： 米国
            </li>
            <li>
              <strong>Upstash Redis</strong>（レート制限）- データ保管場所：
              グローバル
            </li>
          </ul>
          <p className="text-sm text-gray-600 mt-4">
            ※
            各サービスは独自のプライバシーポリシーを持ち、適切なセキュリティ対策を実施しています。
          </p>
        </section>

        {/* 6. Cookie */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            6. Cookieとトラッキング技術
          </h2>

          <h3 className="text-xl font-semibold mb-3">6.1 Cookieとは</h3>
          <p className="text-gray-700 mb-4">
            Cookieは、ウェブサイトがユーザーのブラウザに保存する小さなテキストファイルです。当サービスでは、ユーザー体験の向上とサービス改善のためにCookieを使用します。
          </p>

          <h3 className="text-xl font-semibold mb-3">
            6.2 使用するCookieの種類
          </h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>
              <strong>必須Cookie</strong>:
              認証、セッション管理など、サービス提供に不可欠なCookie（同意不要）
            </li>
            <li>
              <strong>機能Cookie</strong>: ユーザー設定の保存（言語設定等）
            </li>
            <li>
              <strong>分析Cookie</strong>:
              アクセス解析、サービス改善のための統計情報収集
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            6.3 LocalStorageの使用
          </h3>
          <p className="text-gray-700 mb-4">
            当サービスでは、Cookie同意情報の保存にLocalStorageを使用します。LocalStorageに保存される情報：
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded">
                cookieConsent
              </code>
              : Cookie同意状態（&quot;accepted&quot;）
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">
            6.4 Cookieの無効化方法
          </h3>
          <p className="text-gray-700 mb-4">
            ブラウザ設定でCookieを無効化できますが、サービスの一部機能が正常に動作しない可能性があります。
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>
              Chrome:{' '}
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Cookieの設定を変更する
              </a>
            </li>
            <li>
              Firefox:{' '}
              <a
                href="https://support.mozilla.org/ja/kb/enhanced-tracking-protection-firefox-desktop"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                強化型トラッキング防止機能
              </a>
            </li>
            <li>
              Safari:{' '}
              <a
                href="https://support.apple.com/ja-jp/guide/safari/sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Cookieとウェブサイトデータを管理する
              </a>
            </li>
          </ul>
        </section>

        {/* 7. セキュリティ */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">7. セキュリティ対策</h2>
          <p className="text-gray-700 mb-4">
            当サービスは、個人情報の漏洩、紛失、改ざん、不正アクセスを防止するため、以下のセキュリティ対策を実施しています：
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>HTTPS（TLS/SSL）による通信の暗号化</li>
            <li>パスワードのハッシュ化（bcrypt）による保存</li>
            <li>CSRF保護、XSS対策、SQLインジェクション対策</li>
            <li>
              セキュリティヘッダー（CSP、HSTS、X-Frame-Options等）の設定
            </li>
            <li>レート制限による不正アクセス防止</li>
            <li>定期的なセキュリティ監査とログ監視</li>
            <li>
              データベースアクセス制限（最小権限の原則、Row Level
              Securityの適用）
            </li>
          </ul>
        </section>

        {/* 8. 保存期間 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">8. 個人情報の保存期間</h2>
          <p className="text-gray-700 mb-4">
            個人情報は、利用目的の達成に必要な期間のみ保存します：
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>
              <strong>ユーザーアカウント情報</strong>:
              アカウント削除まで（削除後は完全消去）
            </li>
            <li>
              <strong>予約履歴</strong>:
              最終予約日から3年間（税法・会計基準に基づく）
            </li>
            <li>
              <strong>アクセスログ</strong>:
              6ヶ月間（セキュリティ対策・不正利用防止のため）
            </li>
            <li>
              <strong>Cookie同意情報</strong>: ユーザーが削除するまで
            </li>
          </ul>
        </section>

        {/* 9. ユーザーの権利 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">9. ユーザーの権利</h2>
          <p className="text-gray-700 mb-4">
            ユーザーは、自己の個人情報について以下の権利を有します：
          </p>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>
              <strong>開示請求権</strong>:
              保存されている個人情報の開示を請求できます
            </li>
            <li>
              <strong>訂正・追加・削除請求権</strong>:
              個人情報の訂正、追加、削除を請求できます
            </li>
            <li>
              <strong>利用停止・消去請求権</strong>:
              個人情報の利用停止または消去を請求できます
            </li>
            <li>
              <strong>データポータビリティ権</strong>（GDPR）:
              構造化された形式で個人情報の提供を請求できます
            </li>
            <li>
              <strong>異議申立権</strong>（GDPR）:
              個人情報の処理に異議を申し立てることができます
            </li>
          </ol>
          <p className="text-gray-700 mt-4">
            上記の権利を行使する場合は、本ポリシー「10.
            お問い合わせ」記載の連絡先までご連絡ください。本人確認後、遅滞なく対応いたします。
          </p>
        </section>

        {/* 10. お問い合わせ */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">10. お問い合わせ</h2>
          <p className="text-gray-700 mb-4">
            個人情報の取り扱いに関するご質問、開示請求、苦情等は、以下までお問い合わせください：
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-2">
              <strong>個人情報保護管理者</strong>: [担当者名を記載]
            </p>
            <p className="text-gray-700 mb-2">
              <strong>メールアドレス</strong>:{' '}
              <a
                href="mailto:privacy@example.com"
                className="text-blue-600 hover:underline"
              >
                privacy@example.com
              </a>
            </p>
            <p className="text-gray-700">
              <strong>対応時間</strong>: 平日 10:00-18:00（土日祝日を除く）
            </p>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            ※
            回答までに1週間程度お時間をいただく場合があります。あらかじめご了承ください。
          </p>
        </section>

        {/* 11. 改定 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            11. プライバシーポリシーの改定
          </h2>
          <p className="text-gray-700 mb-4">
            当サービスは、法令改正、サービス内容の変更等に応じて、本プライバシーポリシーを改定する場合があります。重要な変更がある場合は、サービス内での告知またはメール通知により、ユーザーに事前にお知らせします。
          </p>
          <p className="text-gray-700">
            改定後のプライバシーポリシーは、本ページに掲載した時点で効力を生じるものとします。定期的に本ページをご確認ください。
          </p>
        </section>

        {/* 12. 準拠法・管轄裁判所 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">12. 準拠法・管轄裁判所</h2>
          <p className="text-gray-700 mb-4">
            本プライバシーポリシーの解釈・適用は、日本法に準拠します。
          </p>
          <p className="text-gray-700">
            本プライバシーポリシーに関する紛争については、[所在地の管轄裁判所]を第一審の専属的合意管轄裁判所とします。
          </p>
          <p className="text-sm text-gray-600 mt-4">
            ※ 本番環境では、[　]内に実際の管轄裁判所を記載してください。
          </p>
        </section>

        {/* フッター */}
        <div className="border-t pt-6 mt-12">
          <p className="text-sm text-gray-600">
            制定日：2026年1月4日
            <br />
            最終改定日：2026年1月4日
          </p>
        </div>
      </div>
      </main>
      <Footer />
    </>
  );
}
