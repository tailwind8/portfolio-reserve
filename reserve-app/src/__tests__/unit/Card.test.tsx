import { render, screen } from '@testing-library/react';
import Card from '@/components/Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies default padding', () => {
    render(<Card><div data-testid="content">Content</div></Card>);
    const card = screen.getByTestId('content').parentElement;
    expect(card).toHaveClass('p-6');
  });

  it('applies custom padding', () => {
    render(<Card padding="lg"><div data-testid="content">Content</div></Card>);
    const card = screen.getByTestId('content').parentElement;
    expect(card).toHaveClass('p-8');
  });

  it('applies hover effect when hover prop is true', () => {
    render(<Card hover><div data-testid="content">Content</div></Card>);
    const card = screen.getByTestId('content').parentElement;
    expect(card).toHaveClass('hover:shadow-lg');
  });

  it('applies custom className', () => {
    render(<Card className="custom-class"><div data-testid="content">Content</div></Card>);
    const card = screen.getByTestId('content').parentElement;
    expect(card).toHaveClass('custom-class');
  });
});
