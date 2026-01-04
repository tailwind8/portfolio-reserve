import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: '利用規約 - 予約システム',
  description: '利用規約',
};

export default function TermsPage() {
  return (
    <>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6" data-testid="terms-title">
        利用規約
      </h1>

      <div className="prose max-w-none" data-testid="terms-content">
        <p className="text-sm text-gray-600 mb-8">
          制定日：2026年1月4日
          <br />
          最終改定日：2026年1月4日
        </p>

        {/* 前文 */}
        <section className="mb-8">
          <p className="text-gray-700 mb-4">
            この利用規約（以下「本規約」といいます）は、予約システム（以下「当サービス」といいます）が提供するサービスの利用条件を定めるものです。ユーザーの皆様（以下「ユーザー」といいます）には、本規約に従って、当サービスをご利用いただきます。
          </p>
        </section>

        {/* 1. 定義 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. 定義</h2>
          <p className="text-gray-700 mb-4">本規約において使用する用語の定義は、以下のとおりとします：</p>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>
              <strong>「当サービス」</strong>: 予約システムが提供するオンライン予約サービス
            </li>
            <li>
              <strong>「ユーザー」</strong>: 当サービスを利用するすべての個人または法人
            </li>
            <li>
              <strong>「アカウント」</strong>: ユーザーが当サービスを利用するために登録した情報
            </li>
            <li>
              <strong>「予約」</strong>: ユーザーが当サービスを通じて店舗のサービスを予約すること
            </li>
            <li>
              <strong>「店舗」</strong>: 当サービスを利用してサービスを提供する美容室、歯科医院、整体院等の事業者
            </li>
            <li>
              <strong>「知的財産権」</strong>: 著作権、特許権、実用新案権、商標権、意匠権その他の知的財産権（それらの権利を取得し、またはそれらの権利につき登録等を出願する権利を含む）
            </li>
          </ol>
        </section>

        {/* 2. 適用範囲 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. 適用範囲</h2>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>本規約は、当サービスの利用に関する当サービスとユーザーとの間の権利義務関係を定めることを目的とし、ユーザーと当サービスとの間の当サービスの利用に関わる一切の関係に適用されます。</li>
            <li>当サービスが当サービス上で掲載する当サービスの利用に関するルール、注意事項等は、本規約の一部を構成するものとします。</li>
            <li>本規約の内容と、前項のルール等の内容が異なる場合は、本規約の規定が優先して適用されるものとします。</li>
          </ol>
        </section>

        {/* 3. アカウント登録 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">3. アカウント登録</h2>

          <h3 className="text-xl font-semibold mb-3">3.1 登録手続き</h3>
          <p className="text-gray-700 mb-4">
            ユーザーは、当サービスの定める方法によって登録申請を行い、当サービスがこれを承認することによって、登録が完了するものとします。
          </p>

          <h3 className="text-xl font-semibold mb-3">3.2 登録拒否</h3>
          <p className="text-gray-700 mb-4">当サービスは、以下のいずれかの事由に該当する場合は、登録申請を承認しないことがあります：</p>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>当サービスに提供した登録情報の全部または一部につき虚偽、誤記または記載漏れがあった場合</li>
            <li>未成年者、成年被後見人、被保佐人または被補助人のいずれかであり、法定代理人、後見人、保佐人または補助人の同意等を得ていなかった場合</li>
            <li>反社会的勢力等（暴力団、暴力団員、右翼団体、反社会的勢力、その他これに準ずる者を意味する。以下同じ。）である、または資金提供その他を通じて反社会的勢力等の維持、運営もしくは経営に協力もしくは関与する等反社会的勢力等との何らかの交流もしくは関与を行っていると当サービスが判断した場合</li>
            <li>過去に当サービスとの契約に違反した者またはその関係者であると当サービスが判断した場合</li>
            <li>その他、当サービスが登録を適当でないと判断した場合</li>
          </ol>
        </section>

        {/* 4. パスワードおよびアカウント情報の管理 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">4. パスワードおよびアカウント情報の管理</h2>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>ユーザーは、自己の責任において、当サービスに関するパスワードおよびアカウント情報を適切に管理および保管するものとし、これを第三者に利用させ、または貸与、譲渡、名義変更、売買等をしてはならないものとします。</li>
            <li>パスワードまたはアカウント情報の管理不十分、使用上の過誤、第三者の使用等によって生じた損害に関する責任はユーザーが負うものとします。</li>
            <li>ユーザーは、パスワードまたはアカウント情報が盗まれたり、第三者に使用されていることが判明した場合には、直ちにその旨を当サービスに通知するとともに、当サービスからの指示に従うものとします。</li>
          </ol>
        </section>

        {/* 5. サービス内容 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. サービス内容</h2>
          <p className="text-gray-700 mb-4">当サービスは、以下のサービスを提供します：</p>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>店舗のメニュー・サービス情報の閲覧</li>
            <li>オンラインでの予約受付・変更・キャンセル</li>
            <li>予約確認メール・リマインダーメールの送信</li>
            <li>予約履歴の管理・閲覧</li>
            <li>その他、当サービスが提供するすべての機能</li>
          </ol>
        </section>

        {/* 6. 予約・キャンセルポリシー */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">6. 予約・キャンセルポリシー</h2>

          <h3 className="text-xl font-semibold mb-3">6.1 予約の成立</h3>
          <p className="text-gray-700 mb-4">
            予約は、ユーザーが当サービスの予約フォームから予約申込みを行い、当サービスが予約確認メールを送信した時点で成立するものとします。
          </p>

          <h3 className="text-xl font-semibold mb-3">6.2 予約の変更・キャンセル</h3>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2 mb-4">
            <li>ユーザーは、予約日時の24時間前までであれば、当サービスを通じて予約の変更・キャンセルを行うことができます。</li>
            <li>予約日時の24時間以内の変更・キャンセルについては、店舗に直接連絡する必要があります。</li>
            <li>無断キャンセル（予約時刻を過ぎても来店せず、連絡もない場合）が発生した場合、当サービスはユーザーのアカウントを停止または削除する場合があります。</li>
          </ol>

          <h3 className="text-xl font-semibold mb-3">6.3 店舗都合による予約キャンセル</h3>
          <p className="text-gray-700 mb-4">
            店舗の都合（休業、スタッフの急病等）により予約がキャンセルされる場合があります。この場合、当サービスは速やかにユーザーに通知しますが、当サービスは一切の責任を負いません。
          </p>
        </section>

        {/* 7. 利用料金 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">7. 利用料金</h2>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>当サービスの利用（予約の登録・変更・キャンセル）は無料です。</li>
            <li>店舗のサービス利用料金は、各店舗が定める料金表に従うものとします。</li>
            <li>ユーザーは、当サービスの利用に必要な通信費用（インターネット接続料金、通信料金等）を自己負担するものとします。</li>
          </ol>
        </section>

        {/* 8. 禁止事項 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">8. 禁止事項</h2>
          <p className="text-gray-700 mb-4">
            ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません：
          </p>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>当サービス、他のユーザー、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
            <li>当サービスの運営を妨害するおそれのある行為</li>
            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
            <li>不正アクセス、不正ログイン、権限を超えた利用</li>
            <li>他のユーザーに成りすます行為</li>
            <li>当サービスが事前に許諾しない当サービス上での宣伝、広告、勧誘、または営業行為</li>
            <li>虚偽の予約（実際に来店する意図がない予約、いたずら予約等）</li>
            <li>反復的な無断キャンセル</li>
            <li>当サービスの他のユーザー、店舗、または第三者に不利益、損害、不快感を与える行為</li>
            <li>反社会的勢力等への利益供与行為</li>
            <li>当サービスの知的財産権を侵害する行為</li>
            <li>リバースエンジニアリング、逆コンパイル、逆アセンブル等の行為</li>
            <li>自動化されたスクリプト、ボット等を使用した大量アクセス</li>
            <li>その他、当サービスが不適切と判断する行為</li>
          </ol>
        </section>

        {/* 9. 利用制限および登録抹消 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">9. 利用制限および登録抹消</h2>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>当サービスは、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して、当サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>本規約のいずれかの条項に違反した場合</li>
                <li>登録情報に虚偽の事実があることが判明した場合</li>
                <li>支払停止もしくは支払不能となり、または破産手続開始、民事再生手続開始、会社更生手続開始、特別清算開始もしくはこれらに類する手続の開始の申立てがあった場合</li>
                <li>1年以上当サービスの利用がない場合</li>
                <li>当サービスからの連絡に対し、一定期間返答がない場合</li>
                <li>その他、当サービスが当サービスの利用を適当でないと判断した場合</li>
              </ul>
            </li>
            <li>当サービスは、本条に基づき当サービスが行った行為によりユーザーに生じた損害について、一切の責任を負いません。</li>
          </ol>
        </section>

        {/* 10. 知的財産権 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">10. 知的財産権</h2>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>当サービスおよび当サービスに関連する一切の知的財産権は、当サービスまたは当サービスにライセンスを許諾している者に帰属しており、本規約に基づく当サービスの利用許諾は、当サービスまたは当サービスにライセンスを許諾している者の知的財産権の使用許諾を意味するものではありません。</li>
            <li>ユーザーは、当サービスおよび当サービスに関連するコンテンツについて、当サービスの事前の書面による許可なく、複製、譲渡、貸与、翻訳、改変、転載、公衆送信（送信可能化を含む）、伝送、配布、出版、営業使用等をしてはならないものとします。</li>
          </ol>
        </section>

        {/* 11. 免責事項 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">11. 免責事項</h2>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>当サービスは、当サービスの内容変更、中断、終了によって生じたいかなる損害についても、一切責任を負いません。</li>
            <li>当サービスは、当サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含む）がないことを明示的にも黙示的にも保証しておりません。</li>
            <li>当サービスは、当サービスに起因してユーザーに生じたあらゆる損害について、当サービスの故意または重過失による場合を除き、一切の責任を負いません。</li>
            <li>当サービスは、店舗が提供するサービスの内容、品質、安全性等について一切の責任を負いません。店舗のサービスに関するトラブルは、ユーザーと店舗の間で解決するものとします。</li>
            <li>当サービスは、ユーザーと店舗との間で生じた紛争について、一切の責任を負いません。</li>
            <li>当サービスは、当サービスに関してユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</li>
          </ol>
        </section>

        {/* 12. サービスの変更・中断・終了 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">12. サービスの変更・中断・終了</h2>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>当サービスは、ユーザーへの事前の告知をもって、当サービスの内容を変更、追加または廃止することがあり、ユーザーはこれを承諾するものとします。</li>
            <li>当サービスは、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく当サービスの全部または一部の提供を中断または停止することができるものとします。
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>当サービスに係るコンピュータシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電または天災などの不可抗力により、当サービスの提供が困難となった場合</li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当サービスが当サービスの提供が困難と判断した場合</li>
              </ul>
            </li>
            <li>当サービスは、当サービスの提供の中断または停止により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。</li>
          </ol>
        </section>

        {/* 13. 損害賠償 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">13. 損害賠償</h2>
          <p className="text-gray-700 mb-4">
            ユーザーは、本規約に違反することにより、または当サービスの利用に関連して当サービスに損害を与えた場合、当サービスに対しその損害を賠償しなければなりません。
          </p>
        </section>

        {/* 14. 秘密保持 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">14. 秘密保持</h2>
          <p className="text-gray-700 mb-4">
            ユーザーは、当サービスから開示された技術上または営業上その他の業務上の情報のうち、当サービスが秘密である旨指定した情報について、当サービスの事前の書面による承諾がある場合を除き、秘密に取り扱うものとします。
          </p>
        </section>

        {/* 15. 個人情報の取扱い */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">15. 個人情報の取扱い</h2>
          <p className="text-gray-700 mb-4">
            当サービスは、ユーザーの個人情報を、当サービスの
            <Link
              href="/privacy"
              className="text-blue-600 hover:underline mx-1"
            >
              プライバシーポリシー
            </Link>
            に従って適切に取り扱います。
          </p>
        </section>

        {/* 16. 利用規約の変更 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">16. 利用規約の変更</h2>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>当サービスは、以下の場合には、ユーザーの個別の同意を要せず、本規約を変更することができるものとします。
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>本規約の変更がユーザーの一般の利益に適合するとき</li>
                <li>本規約の変更が契約をした目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他の変更に係る事情に照らして合理的なものであるとき</li>
              </ul>
            </li>
            <li>当サービスは、本規約を変更する場合、変更後の本規約の効力発生日の1週間前までに、本規約を変更する旨および変更後の本規約の内容とその効力発生日を当サービス上に掲示し、またはユーザーに電子メール等で通知します。</li>
            <li>変更後の本規約の効力発生日以降にユーザーが当サービスを利用したときは、ユーザーは、本規約の変更に同意したものとみなします。</li>
          </ol>
        </section>

        {/* 17. 連絡・通知 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">17. 連絡・通知</h2>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>当サービスからユーザーへの連絡は、当サービスが登録されたメールアドレスへの電子メールの送信、当サービス上への掲示その他当サービスが適当と判断する方法により行うものとします。</li>
            <li>当サービスからユーザーへの連絡が電子メールで行われる場合、当該電子メールが当サービスから発信された時点で、ユーザーに到達したものとみなします。</li>
          </ol>
        </section>

        {/* 18. 権利義務の譲渡禁止 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">18. 権利義務の譲渡禁止</h2>
          <p className="text-gray-700 mb-4">
            ユーザーは、当サービスの書面による事前の承諾なく、本規約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
          </p>
        </section>

        {/* 19. 分離可能性 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">19. 分離可能性</h2>
          <p className="text-gray-700 mb-4">
            本規約のいずれかの条項またはその一部が、消費者契約法その他の法令等により無効または執行不能と判断された場合であっても、本規約の残りの規定および一部が無効または執行不能と判断された規定の残りの部分は、継続して完全に効力を有するものとします。
          </p>
        </section>

        {/* 20. 準拠法・管轄裁判所 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">20. 準拠法・管轄裁判所</h2>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
            <li>当サービスに関して紛争が生じた場合には、[所在地の管轄裁判所]を第一審の専属的合意管轄裁判所とします。</li>
          </ol>
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
          <p className="text-sm text-gray-600 mt-4">
            <Link href="/privacy" className="text-blue-600 hover:underline">
              プライバシーポリシー
            </Link>
            もあわせてご確認ください。
          </p>
        </div>
      </div>
      </main>
      <Footer />
    </>
  );
}
