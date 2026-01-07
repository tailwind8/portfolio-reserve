import { render, screen } from '@testing-library/react';
import { AlertCard } from '@/components/AlertCard';

describe('AlertCard', () => {
  describe('エラータイプ', () => {
    it('エラーメッセージを表示する', () => {
      render(<AlertCard type="error" message="エラーが発生しました" />);

      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByTestId('alert-error')).toBeInTheDocument();
    });

    it('エラースタイルが適用される', () => {
      render(<AlertCard type="error" message="テスト" />);

      const alert = screen.getByTestId('alert-error');
      expect(alert).toHaveClass('border-red-200', 'bg-red-50');
    });
  });

  describe('成功タイプ', () => {
    it('成功メッセージを表示する', () => {
      render(<AlertCard type="success" message="保存しました" />);

      expect(screen.getByText('保存しました')).toBeInTheDocument();
      expect(screen.getByTestId('alert-success')).toBeInTheDocument();
    });

    it('成功スタイルが適用される', () => {
      render(<AlertCard type="success" message="テスト" />);

      const alert = screen.getByTestId('alert-success');
      expect(alert).toHaveClass('border-green-200', 'bg-green-50');
    });
  });

  describe('警告タイプ', () => {
    it('警告メッセージを表示する', () => {
      render(<AlertCard type="warning" message="注意してください" />);

      expect(screen.getByText('注意してください')).toBeInTheDocument();
      expect(screen.getByTestId('alert-warning')).toBeInTheDocument();
    });

    it('警告スタイルが適用される', () => {
      render(<AlertCard type="warning" message="テスト" />);

      const alert = screen.getByTestId('alert-warning');
      expect(alert).toHaveClass('border-yellow-200', 'bg-yellow-50');
    });
  });

  describe('情報タイプ', () => {
    it('情報メッセージを表示する', () => {
      render(<AlertCard type="info" message="お知らせです" />);

      expect(screen.getByText('お知らせです')).toBeInTheDocument();
      expect(screen.getByTestId('alert-info')).toBeInTheDocument();
    });

    it('情報スタイルが適用される', () => {
      render(<AlertCard type="info" message="テスト" />);

      const alert = screen.getByTestId('alert-info');
      expect(alert).toHaveClass('border-blue-200', 'bg-blue-50');
    });
  });

  describe('カスタムクラス', () => {
    it('追加のクラス名を適用できる', () => {
      render(<AlertCard type="error" message="テスト" className="mt-4" />);

      const alert = screen.getByTestId('alert-error');
      expect(alert).toHaveClass('mt-4');
    });
  });

  describe('アイコン表示', () => {
    it('SVGアイコンが表示される', () => {
      render(<AlertCard type="error" message="テスト" />);

      const svg = screen.getByTestId('alert-error').querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-5', 'w-5');
    });
  });
});
