import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('デフォルト表示', () => {
    it('スピナーが表示される', () => {
      render(<LoadingSpinner />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('デフォルトでmdサイズが適用される', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByTestId('loading-spinner').querySelector('div');
      expect(spinner).toHaveClass('h-8', 'w-8', 'border-4');
    });
  });

  describe('サイズ変更', () => {
    it('smサイズが適用される', () => {
      render(<LoadingSpinner size="sm" />);

      const spinner = screen.getByTestId('loading-spinner').querySelector('div');
      expect(spinner).toHaveClass('h-4', 'w-4', 'border-2');
    });

    it('mdサイズが適用される', () => {
      render(<LoadingSpinner size="md" />);

      const spinner = screen.getByTestId('loading-spinner').querySelector('div');
      expect(spinner).toHaveClass('h-8', 'w-8', 'border-4');
    });

    it('lgサイズが適用される', () => {
      render(<LoadingSpinner size="lg" />);

      const spinner = screen.getByTestId('loading-spinner').querySelector('div');
      expect(spinner).toHaveClass('h-12', 'w-12', 'border-4');
    });
  });

  describe('カスタムクラス', () => {
    it('追加のクラス名を適用できる', () => {
      render(<LoadingSpinner className="mt-8" />);

      const container = screen.getByTestId('loading-spinner');
      expect(container).toHaveClass('mt-8');
    });
  });

  describe('アニメーション', () => {
    it('spinアニメーションクラスが適用されている', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByTestId('loading-spinner').querySelector('div');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('ボーダースタイルが適用されている', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByTestId('loading-spinner').querySelector('div');
      expect(spinner).toHaveClass('rounded-full', 'border-blue-500', 'border-t-transparent');
    });
  });
});
