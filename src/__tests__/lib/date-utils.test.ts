import {describe, expect, test} from 'bun:test';
import {formatDate, formatHumanDate} from '@/lib/date-utils';

describe('formatDate', () => {
  test('output contains the year, abbreviated month, and day', () => {
    const result = formatDate('2024-01-15T12:30:00.000Z');
    expect(result).toContain('2024');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  test('is deterministic for the same input', () => {
    const input = '2024-06-01T08:00:00.000Z';
    expect(formatDate(input)).toBe(formatDate(input));
  });
});

describe('formatHumanDate', () => {
  test('very recent date returns a relative "ago" string', () => {
    const thirtySecondsAgo = new Date(Date.now() - 30_000);
    expect(formatHumanDate(thirtySecondsAgo)).toMatch(/ago/i);
  });

  test('yesterday returns "yesterday"', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatHumanDate(yesterday)).toBe('yesterday');
  });

  test('old date returns a string containing the year', () => {
    expect(formatHumanDate(new Date('2020-03-15'))).toContain('2020');
  });
});
