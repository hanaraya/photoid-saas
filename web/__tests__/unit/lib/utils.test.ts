/**
 * @jest-environment jsdom
 */
import { cn } from '@/lib/utils';

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
    });

    it('should handle undefined and null', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end');
    });

    it('should work with single class', () => {
      expect(cn('single')).toBe('single');
    });

    it('should work with no classes', () => {
      expect(cn()).toBe('');
    });
  });
});
