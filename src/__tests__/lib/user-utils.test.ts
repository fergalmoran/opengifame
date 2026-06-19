import {describe, expect, test} from 'bun:test';
import {getUserInitials} from '@/lib/user-utils';

describe('getUserInitials', () => {
  test('returns ? for null', () => {
    expect(getUserInitials(null)).toBe('?');
  });

  test('returns ? for undefined', () => {
    expect(getUserInitials(undefined)).toBe('?');
  });

  test('returns ? for empty string', () => {
    expect(getUserInitials('')).toBe('?');
  });

  test('single name → one initial uppercased', () => {
    expect(getUserInitials('alice')).toBe('A');
  });

  test('full name → two initials uppercased', () => {
    expect(getUserInitials('alice bob')).toBe('AB');
  });

  test('three-word name → capped at two initials', () => {
    expect(getUserInitials('Alice Bob Charlie')).toBe('AB');
  });
});
