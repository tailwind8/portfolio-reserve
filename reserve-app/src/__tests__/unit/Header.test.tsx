import { render, screen } from '@testing-library/react';
import Header from '@/components/Header';

describe('Header', () => {
  it('should render header with logo and brand name', () => {
    render(<Header />);

    const logo = screen.getByText('R');
    expect(logo).toBeInTheDocument();

    const brandName = screen.getByText('予約システム');
    expect(brandName).toBeInTheDocument();
  });

  it('should render home link', () => {
    render(<Header />);

    const homeLink = screen.getAllByRole('link', { name: /予約システム/ })[0];
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should render navigation links', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: 'メニュー' })).toHaveAttribute('href', '/menus');
    expect(screen.getByRole('link', { name: '予約' })).toHaveAttribute('href', '/booking');
    expect(screen.getByRole('link', { name: 'マイページ' })).toHaveAttribute('href', '/my-reservations');
  });

  it('should render authentication links', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: 'ログイン' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: '新規登録' })).toHaveAttribute('href', '/register');
  });
});
