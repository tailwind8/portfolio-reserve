import { render, screen } from '@testing-library/react';
import AdminSidebar from '@/components/AdminSidebar';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

// 機能フラグフックをモック
jest.mock('@/hooks/useFeatureFlags');

describe('AdminSidebar', () => {
  beforeEach(() => {
    // すべての機能フラグをtrueでモック（すべてのメニュー項目が表示される）
    (useFeatureFlags as jest.Mock).mockReturnValue({
      flags: {
        enableStaffSelection: true,
        enableStaffShiftManagement: true,
        enableCustomerManagement: true,
        enableReservationUpdate: true,
        enableReminderEmail: true,
        enableManualReservation: true,
        enableAnalyticsReport: true,
        enableRepeatRateAnalysis: true,
        enableCouponFeature: true,
        enableLineNotification: true,
      },
      isLoading: false,
      error: null,
    });
  });

  it('should render sidebar', () => {
    render(<AdminSidebar />);
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should display sidebar title', () => {
    render(<AdminSidebar />);
    expect(screen.getByTestId('sidebar-title')).toHaveTextContent('管理画面');
  });

  it('should render navigation menu', () => {
    render(<AdminSidebar />);
    expect(screen.getByTestId('sidebar-nav')).toBeInTheDocument();
  });

  it('should display all menu items', () => {
    render(<AdminSidebar />);

    // テキストで確認（testIdは機能フラグで制御されるメニューで異なる）
    const menuItems = [
      'ダッシュボード',
      '予約管理',
      '顧客管理',
      'スタッフ管理',
      'メニュー管理',
      '分析レポート',
      '店舗設定',
    ];

    menuItems.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it('should have correct hrefs for menu items', () => {
    render(<AdminSidebar />);

    const expectedLinks = [
      { testId: 'nav-link-ダッシュボード', href: '/admin/dashboard' },
      { testId: 'nav-link-予約管理', href: '/admin/reservations' },
      { testId: 'nav-customer-management', href: '/admin/customers' },
      { testId: 'nav-staff-management', href: '/admin/staff' },
      { testId: 'nav-link-メニュー管理', href: '/admin/menus' },
      { testId: 'nav-link-分析レポート', href: '/admin/analytics' },
      { testId: 'nav-link-店舗設定', href: '/admin/settings' },
    ];

    expectedLinks.forEach(({ testId, href }) => {
      const link = screen.getByTestId(testId);
      expect(link).toHaveAttribute('href', href);
    });
  });

  it('should display user screen link', () => {
    render(<AdminSidebar />);
    const userScreenLink = screen.getByTestId('user-screen-link');

    expect(userScreenLink).toBeInTheDocument();
    expect(userScreenLink).toHaveTextContent('ユーザー画面へ');
    expect(userScreenLink).toHaveAttribute('href', '/');
  });

  it('should have correct styling classes', () => {
    render(<AdminSidebar />);
    const sidebar = screen.getByTestId('admin-sidebar');

    expect(sidebar).toHaveClass('fixed', 'left-0', 'top-0', 'h-screen', 'w-64');
  });

  it('should display logo with R character', () => {
    render(<AdminSidebar />);
    expect(screen.getByText('R')).toBeInTheDocument();
  });

  // 機能フラグによる表示制御のテスト
  describe('Feature flag control', () => {
    it('should hide customer management when feature flag is off', () => {
      // 顧客管理機能をOFFにする
      (useFeatureFlags as jest.Mock).mockReturnValue({
        flags: {
          enableStaffSelection: true,
          enableStaffShiftManagement: true,
          enableCustomerManagement: false, // OFF
          enableReservationUpdate: true,
          enableReminderEmail: true,
          enableManualReservation: true,
          enableAnalyticsReport: true,
          enableRepeatRateAnalysis: true,
          enableCouponFeature: true,
          enableLineNotification: true,
        },
        isLoading: false,
        error: null,
      });

      render(<AdminSidebar />);

      // 顧客管理リンクが表示されない
      expect(screen.queryByTestId('nav-customer-management')).not.toBeInTheDocument();
      expect(screen.queryByText('顧客管理')).not.toBeInTheDocument();

      // 他のメニューは表示される
      expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
      expect(screen.getByText('予約管理')).toBeInTheDocument();
    });

    it('should hide staff management when feature flag is off', () => {
      // スタッフ管理機能をOFFにする
      (useFeatureFlags as jest.Mock).mockReturnValue({
        flags: {
          enableStaffSelection: true,
          enableStaffShiftManagement: false, // OFF
          enableCustomerManagement: true,
          enableReservationUpdate: true,
          enableReminderEmail: true,
          enableManualReservation: true,
          enableAnalyticsReport: true,
          enableRepeatRateAnalysis: true,
          enableCouponFeature: true,
          enableLineNotification: true,
        },
        isLoading: false,
        error: null,
      });

      render(<AdminSidebar />);

      // スタッフ管理リンクが表示されない
      expect(screen.queryByTestId('nav-staff-management')).not.toBeInTheDocument();
      expect(screen.queryByText('スタッフ管理')).not.toBeInTheDocument();
    });

    it('should hide analytics report when feature flag is off', () => {
      // 分析レポート機能をOFFにする
      (useFeatureFlags as jest.Mock).mockReturnValue({
        flags: {
          enableStaffSelection: true,
          enableStaffShiftManagement: true,
          enableCustomerManagement: true,
          enableReservationUpdate: true,
          enableReminderEmail: true,
          enableManualReservation: true,
          enableAnalyticsReport: false, // OFF
          enableRepeatRateAnalysis: true,
          enableCouponFeature: true,
          enableLineNotification: true,
        },
        isLoading: false,
        error: null,
      });

      render(<AdminSidebar />);

      // 分析レポートリンクが表示されない
      expect(screen.queryByTestId('nav-link-分析レポート')).not.toBeInTheDocument();
      expect(screen.queryByText('分析レポート')).not.toBeInTheDocument();
    });

    it('should show all menus when all feature flags are on', () => {
      render(<AdminSidebar />);

      // すべてのメニューが表示される
      expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
      expect(screen.getByText('予約管理')).toBeInTheDocument();
      expect(screen.getByText('顧客管理')).toBeInTheDocument();
      expect(screen.getByText('スタッフ管理')).toBeInTheDocument();
      expect(screen.getByText('メニュー管理')).toBeInTheDocument();
      expect(screen.getByText('分析レポート')).toBeInTheDocument();
      expect(screen.getByText('店舗設定')).toBeInTheDocument();
    });
  });
});
