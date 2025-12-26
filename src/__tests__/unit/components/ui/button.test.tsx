
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import userEvent from '@testing-library/user-event';

describe('Button Component', () => {
    it('renders correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('applies variant classes', () => {
        render(<Button variant="destructive">Delete</Button>);
        const button = screen.getByRole('button', { name: /delete/i });
        expect(button).toHaveClass('bg-destructive');
    });

    it('applies size classes', () => {
        render(<Button size="lg">Large</Button>);
        const button = screen.getByRole('button', { name: /large/i });
        expect(button).toHaveClass('h-11');
    });

    it('handles click events', async () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Clickable</Button>);

        await userEvent.click(screen.getByRole('button', { name: /clickable/i }));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can render as a child', () => {
        render(
            <Button asChild>
                <a href="/link">Link Button</a>
            </Button>
        );
        const link = screen.getByRole('link', { name: /link button/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/link');
    });
});
