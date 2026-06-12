import { mock, describe, test, expect } from 'bun:test';

// image-utils.ts imports db, next-auth, and authOptions at the module level;
// mock them to prevent real connections during tests.
mock.module('@/lib/db', () => ({ db: {} }));
mock.module('@/lib/auth', () => ({ authOptions: {} }));
mock.module('next-auth', () => ({ default: {}, getServerSession: async () => null }));

const { processCommentCounts, groupTagsByImage, processUserVotes } =
  await import('@/lib/image-utils');

describe('processCommentCounts', () => {
  test('empty input returns empty map', () => {
    expect(processCommentCounts([])).toEqual({});
  });

  test('maps imageId to count', () => {
    expect(
      processCommentCounts([
        { imageId: 'a', count: 3 },
        { imageId: 'b', count: 7 },
      ])
    ).toEqual({ a: 3, b: 7 });
  });

  test('last entry wins on duplicate imageId', () => {
    const result = processCommentCounts([
      { imageId: 'a', count: 2 },
      { imageId: 'a', count: 5 },
    ]);
    expect(result['a']).toBe(5);
  });
});

describe('groupTagsByImage', () => {
  test('empty input returns empty map', () => {
    expect(groupTagsByImage([])).toEqual({});
  });

  test('groups multiple tags under the same imageId', () => {
    const result = groupTagsByImage([
      { imageId: 'img-1', tag: { id: 't1', name: 'funny' } },
      { imageId: 'img-1', tag: { id: 't2', name: 'cats' } },
      { imageId: 'img-2', tag: { id: 't3', name: 'dogs' } },
    ]);
    expect(result['img-1']).toHaveLength(2);
    expect(result['img-2']).toHaveLength(1);
    expect(result['img-2'][0].name).toBe('dogs');
  });

  test('null tag entry is skipped', () => {
    const result = groupTagsByImage([{ imageId: 'img-1', tag: null }]);
    expect(result['img-1']).toEqual([]);
  });
});

describe('processUserVotes', () => {
  test('empty input returns empty map', () => {
    expect(processUserVotes([])).toEqual({});
  });

  test('isUpvote:true → "up", isUpvote:false → "down"', () => {
    const result = processUserVotes([
      { imageId: 'a', isUpvote: true },
      { imageId: 'b', isUpvote: false },
    ]);
    expect(result['a']).toBe('up');
    expect(result['b']).toBe('down');
  });

  test('last entry wins on duplicate imageId', () => {
    const result = processUserVotes([
      { imageId: 'a', isUpvote: true },
      { imageId: 'a', isUpvote: false },
    ]);
    expect(result['a']).toBe('down');
  });
});
