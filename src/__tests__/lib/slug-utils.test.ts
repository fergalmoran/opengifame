import { mock, describe, test, expect, beforeEach } from 'bun:test';

// Queue of results returned by db.select().from().where().limit()
// Each entry is consumed by one slug-existence check.
const selectQueue: any[][] = [];

mock.module('@/lib/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => {
          const result = selectQueue.shift() ?? [];
          return Object.assign(Promise.resolve(result), {
            limit: () => Promise.resolve(result),
          });
        },
      }),
    }),
  },
}));

const { slugify, generateUniqueSlug } = await import('@/lib/slug-utils');

describe('slugify', () => {
  test('lowercases input', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world');
  });

  test('replaces spaces and special characters with hyphens', () => {
    expect(slugify('hello! world?')).toBe('hello-world');
  });

  test('strips diacritics', () => {
    expect(slugify('café')).toBe('cafe');
  });

  test('collapses consecutive separators into one hyphen', () => {
    expect(slugify('hello  --  world')).toBe('hello-world');
  });

  test('trims leading and trailing hyphens', () => {
    expect(slugify('!hello!')).toBe('hello');
  });

  test('empty string returns empty string', () => {
    expect(slugify('')).toBe('');
  });

  test('numeric-only string is preserved', () => {
    expect(slugify('2024')).toBe('2024');
  });
});

describe('generateUniqueSlug', () => {
  beforeEach(() => {
    selectQueue.length = 0;
  });

  test('uses the slugified title when there is no collision', async () => {
    selectQueue.push([]); // 'happy-cat' is free
    expect(await generateUniqueSlug('Happy Cat')).toBe('happy-cat');
  });

  test('appends -2 on first collision', async () => {
    selectQueue.push([{ id: 'x' }]); // 'happy-cat' exists
    selectQueue.push([]);            // 'happy-cat-2' is free
    expect(await generateUniqueSlug('Happy Cat')).toBe('happy-cat-2');
  });

  test('keeps incrementing until a free slug is found', async () => {
    selectQueue.push([{ id: 'x' }]); // 'happy-cat' taken
    selectQueue.push([{ id: 'x' }]); // 'happy-cat-2' taken
    selectQueue.push([]);            // 'happy-cat-3' free
    expect(await generateUniqueSlug('Happy Cat')).toBe('happy-cat-3');
  });

  test('falls back to "image" when the title produces an empty slug', async () => {
    selectQueue.push([]); // 'image' is free
    expect(await generateUniqueSlug('!@#$')).toBe('image');
  });
});
