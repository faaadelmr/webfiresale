
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, CartContext } from '@/context/cart-context';

// Mock dependencies
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: mockToast }),
}));

// Helper component
const TestConsumer = () => {
    const context = React.useContext(CartContext);
    if (!context) return <div>No Context</div>;
    return (
        <div>
            <div data-testid="cart-total-items">{context.totalItems}</div>
            <button onClick={() => context.addToCart({
                id: 'prod-1',
                name: 'Product 1',
                flashSalePrice: 10000,
                price: 20000,
                quantity: 10,
                description: 'Description',
                images: [],
                categoryId: 'cat-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                weight: 100,
            } as any)}>Add Item</button>
        </div>
    );
};

describe('CartContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn((url, options) => {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ cartItems: [] })
            });
        }) as jest.Mock;
    });

    it('initializes with empty cart', async () => {
        render(
            <CartProvider>
                <TestConsumer />
            </CartProvider>
        );
        await waitFor(() => {
            expect(screen.getByTestId('cart-total-items')).toHaveTextContent('0');
        });
    });

    it('adds item to cart', async () => {
        const user = userEvent.setup();

        // Mock POST success
        (global.fetch as jest.Mock).mockImplementation((url, options) => {
            if (options?.method === 'POST') {
                const body = JSON.parse(options.body);
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        cartItems: [{
                            product: {
                                id: body.productId, name: 'Product 1', flashSalePrice: 10000,
                                // Mock required properties for cartItem -> product
                            },
                            quantity: body.quantity
                        }]
                    })
                });
            }
            // Initial load
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ cartItems: [] })
            });
        });

        render(
            <CartProvider>
                <TestConsumer />
            </CartProvider>
        );

        await user.click(screen.getByText('Add Item'));

        await waitFor(() => {
            expect(screen.getByTestId('cart-total-items')).toHaveTextContent('1');
        });

        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Item ditambahkan ke keranjang'
        }));
    });
});
