
import { cn, formatPrice } from '@/lib/utils'; // formatDate might need consistent timezone handling for tests

describe('Utils', () => {
    describe('cn', () => {
        it('should merge class names correctly', () => {
            expect(cn('class1', 'class2')).toBe('class1 class2');
        });

        it('should handle conditions', () => {
            expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
        });

        it('should handle arrays', () => {
            expect(cn(['class1', 'class2'])).toBe('class1 class2');
        });

        it('should merge tailwind classes', () => {
            expect(cn('p-4', 'p-2')).toBe('p-2'); // tailwind-merge should win
        });
    });

    describe('formatPrice', () => {
        it('should format numbers as IDR currency', () => {
            // Note: non-breaking space might be used by Intl (nbsp)
            const formatted = formatPrice(10000);
            expect(formatted).toMatch(/Rp/);
            expect(formatted).toMatch(/10.000/);
        });
    });
});
