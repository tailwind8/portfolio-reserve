import { render, screen } from '@testing-library/react';
import BookingFeatures from '@/components/booking/BookingFeatures';

describe('BookingFeatures', () => {
  it('3つの機能カードが表示される', () => {
    render(<BookingFeatures />);

    expect(screen.getByText('24時間予約OK')).toBeInTheDocument();
    expect(screen.getByText('確認メール送信')).toBeInTheDocument();
    expect(screen.getByText('リマインダー')).toBeInTheDocument();
  });

  it('各機能の説明が表示される', () => {
    render(<BookingFeatures />);

    expect(screen.getByText('いつでもオンラインで予約できます')).toBeInTheDocument();
    expect(screen.getByText('予約確定後すぐに送信されます')).toBeInTheDocument();
    expect(screen.getByText('予約日前日にメールでお知らせ')).toBeInTheDocument();
  });

  it('3カラムのグリッドレイアウトで表示される', () => {
    const { container } = render(<BookingFeatures />);

    const grid = container.querySelector('.md\\:grid-cols-3');
    expect(grid).toBeInTheDocument();
  });

  it('各アイコンが正しい色で表示される', () => {
    const { container } = render(<BookingFeatures />);

    const greenIcon = container.querySelector('.bg-green-100');
    const blueIcon = container.querySelector('.bg-blue-100');
    const orangeIcon = container.querySelector('.bg-orange-100');

    expect(greenIcon).toBeInTheDocument();
    expect(blueIcon).toBeInTheDocument();
    expect(orangeIcon).toBeInTheDocument();
  });
});
