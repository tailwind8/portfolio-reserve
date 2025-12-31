import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

describe('Footer', () => {
  it('should render footer with company name', () => {
    render(<Footer />);

    expect(screen.getByText('予約システム')).toBeInTheDocument();
  });

  it('should render service links', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'メニュー' })).toHaveAttribute('href', '/menus');
    expect(screen.getByRole('link', { name: '予約' })).toHaveAttribute('href', '/booking');
    expect(screen.getByRole('link', { name: 'マイページ' })).toHaveAttribute('href', '/mypage');
  });

  it('should render admin links', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: '管理者ログイン' })).toHaveAttribute('href', '/admin/login');
    expect(screen.getByRole('link', { name: 'ダッシュボード' })).toHaveAttribute('href', '/admin/dashboard');
  });

  it('should render contact information', () => {
    render(<Footer />);

    expect(screen.getByText(/support@example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/営業時間: 10:00 - 18:00/)).toBeInTheDocument();
  });

  it('should render copyright notice', () => {
    render(<Footer />);

    expect(screen.getByText(/© 2025 予約システム\. All rights reserved\./)).toBeInTheDocument();
  });
});
