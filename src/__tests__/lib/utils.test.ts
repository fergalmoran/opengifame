import { describe, test, expect } from 'bun:test';
import { cn } from '@/lib/utils';

describe('cn', () => {
  test('returns a single class unchanged', () => {
    expect(cn('flex')).toBe('flex');
  });

  test('merges multiple classes', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  test('ignores falsy values', () => {
    expect(cn('flex', false, undefined, null as any, 'gap-2')).toBe('flex gap-2');
  });

  test('handles conditional object syntax', () => {
    expect(cn({ flex: true, hidden: false })).toBe('flex');
  });

  test('resolves conflicting tailwind classes (last wins via twMerge)', () => {
    // twMerge should keep p-4 and discard p-2
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  test('resolves conflicting text-color classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  test('returns empty string for no arguments', () => {
    expect(cn()).toBe('');
  });
});
