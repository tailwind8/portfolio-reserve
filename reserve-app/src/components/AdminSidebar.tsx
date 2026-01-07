'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

type MenuItem = {
  name: string;
  href: string;
  requiresFeature: string | null;
  testId: string;
  icon: React.ReactNode;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

export default function AdminSidebar() {
  const pathname = usePathname();
  // 機能フラグを取得
  const { flags: featureFlags } = useFeatureFlags();

  // セクション定義（3つのセクションに分類）
  const menuSections: MenuSection[] = [
    {
      title: '運用管理',
      items: [
        {
          name: 'ダッシュボード',
          href: '/admin/dashboard',
          requiresFeature: null, // 常に表示
          testId: 'nav-link-ダッシュボード',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
        {
          name: '予約管理',
          href: '/admin/reservations',
          requiresFeature: null, // 常に表示
          testId: 'nav-link-予約管理',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          name: '予約ブロック',
          href: '/admin/blocked-times',
          requiresFeature: null, // 常に表示
          testId: 'nav-link-予約ブロック',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          ),
        },
        {
          name: '顧客管理',
          href: '/admin/customers',
          requiresFeature: 'enableCustomerManagement', // 機能フラグで制御
          testId: 'nav-customer-management',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'マスタ管理',
      items: [
        {
          name: 'スタッフ管理',
          href: '/admin/staff',
          requiresFeature: 'enableStaffShiftManagement', // 機能フラグで制御
          testId: 'nav-staff-management',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          name: 'メニュー管理',
          href: '/admin/menus',
          requiresFeature: null, // 常に表示
          testId: 'nav-link-メニュー管理',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
        },
      ],
    },
    {
      title: '分析・設定',
      items: [
        {
          name: '分析レポート',
          href: '/admin/analytics',
          requiresFeature: 'enableAnalyticsReport', // 機能フラグで制御
          testId: 'nav-link-分析レポート',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
        {
          name: '店舗設定',
          href: '/admin/settings',
          requiresFeature: null, // 常に表示
          testId: 'nav-link-店舗設定',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white" data-testid="admin-sidebar">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <span className="text-sm font-bold text-white">R</span>
          </div>
          <span className="text-lg font-bold text-gray-900" data-testid="sidebar-title">管理画面</span>
        </div>
      </div>

      <nav className="space-y-1 p-4" data-testid="sidebar-nav">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title}>
            {/* セクション区切り線（最初のセクション以外） */}
            {sectionIndex > 0 && <div className="my-2 border-t border-gray-200" />}

            {/* セクションヘッダー */}
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {section.title}
            </div>

            {/* メニュー項目 */}
            {section.items
              .filter((item) => {
                // 機能フラグに基づいてフィルタリング
                if (!item.requiresFeature) {return true;} // 機能フラグ不要な項目は常に表示
                if (!featureFlags) {return false;} // 機能フラグ読み込み中は非表示
                return featureFlags[item.requiresFeature as keyof typeof featureFlags] === true;
              })
              .map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 -ml-px'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    data-testid={item.testId}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full border-t p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          data-testid="user-screen-link"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          ユーザー画面へ
        </Link>
      </div>
    </aside>
  );
}
