import { render, screen } from '@testing-library/react';
import EmptyState from '@/components/EmptyState';

describe('EmptyState', () => {
  it('タイトルのみの場合、正しく表示される', () => {
    render(<EmptyState title="データがありません" />);

    expect(screen.getByText('データがありません')).toBeInTheDocument();
  });

  it('アイコンが表示される', () => {
    const icon = (
      <svg data-testid="test-icon">
        <path />
      </svg>
    );

    render(<EmptyState title="データがありません" icon={icon} />);

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('説明文が表示される', () => {
    render(
      <EmptyState
        title="データがありません"
        description="新しいアイテムを作成しましょう"
      />
    );

    expect(screen.getByText('新しいアイテムを作成しましょう')).toBeInTheDocument();
  });

  it('アクションボタンが表示される', () => {
    const action = <button>アクションを実行</button>;

    render(<EmptyState title="データがありません" action={action} />);

    expect(screen.getByText('アクションを実行')).toBeInTheDocument();
  });

  it('全てのプロパティを指定した場合、正しく表示される', () => {
    const icon = (
      <svg data-testid="test-icon">
        <path />
      </svg>
    );
    const action = <button>新規作成</button>;

    render(
      <EmptyState
        title="データがありません"
        description="新しいアイテムを作成しましょう"
        icon={icon}
        action={action}
      />
    );

    expect(screen.getByText('データがありません')).toBeInTheDocument();
    expect(screen.getByText('新しいアイテムを作成しましょう')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('新規作成')).toBeInTheDocument();
  });
});
