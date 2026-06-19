import {describe, expect, test} from 'bun:test';
import {generateRandomTitle} from '@/lib/title-utils';

describe('generateRandomTitle', () => {
  test('returns a non-empty string', () => {
    expect(generateRandomTitle().length).toBeGreaterThan(0);
  });

  test('produces exactly three space-separated words', () => {
    const parts = generateRandomTitle().split(' ');
    expect(parts).toHaveLength(3);
  });

  test('each word starts with an uppercase letter', () => {
    const parts = generateRandomTitle().split(' ');
    for (const word of parts) {
      expect(word[0]).toBe(word[0].toUpperCase());
    }
  });

  test('returns different values on successive calls (random)', () => {
    const results = new Set(Array.from({length: 10}, () => generateRandomTitle()));
    // With faker randomness, 10 calls should not all be identical
    expect(results.size).toBeGreaterThan(1);
  });
});
