import {beforeEach, describe, expect, mock, test} from 'bun:test';

const selectQueue: any[][] = [];
let mockSession: any = null;

// makeSelectProxy: passes through from/join/orderBy/groupBy; where() consumes the queue.
function makeSelectProxy(): any {
  const proxy: any = {
    from: () => proxy,
    leftJoin: () => proxy,
    innerJoin: () => proxy,
    orderBy: () => proxy,
    groupBy: () => proxy,
    where: () => {
      const result = selectQueue.shift() ?? [];
      return Object.assign(Promise.resolve(result), {
        orderBy: () => Promise.resolve(result),
        limit: () => Promise.resolve(result),
        groupBy: () => Promise.resolve(result),
      });
    },
  };
  return proxy;
}

mock.module('@/lib/db', () => ({
  db: {select: () => makeSelectProxy()},
}));

mock.module('@/lib/auth', () => ({authOptions: {}}));

mock.module('next-auth', () => ({
  default: {},
  getServerSession: async () => mockSession,
}));

const {
  fetchCommentCounts,
  fetchImageTags,
  fetchUserVotes,
  fetchImageMetadata,
} = await import('@/lib/image-utils');

beforeEach(() => {
  selectQueue.length = 0;
  mockSession = null;
});

describe('fetchCommentCounts', () => {
  test('returns {} for empty imageIds without hitting the DB', async () => {
    expect(await fetchCommentCounts([])).toEqual({});
  });

  test('maps imageId → count from DB results', async () => {
    selectQueue.push([
      {imageId: 'img-1', count: 3},
      {imageId: 'img-2', count: 7},
    ]);
    const result = await fetchCommentCounts(['img-1', 'img-2']);
    expect(result).toEqual({'img-1': 3, 'img-2': 7});
  });

  test('returns {} when DB returns no rows', async () => {
    selectQueue.push([]);
    expect(await fetchCommentCounts(['img-1'])).toEqual({});
  });
});

describe('fetchImageTags', () => {
  test('returns {} for empty imageIds without hitting the DB', async () => {
    expect(await fetchImageTags([])).toEqual({});
  });

  test('groups tags by imageId', async () => {
    selectQueue.push([
      {imageId: 'img-1', tag: {id: 't1', name: 'funny'}},
      {imageId: 'img-1', tag: {id: 't2', name: 'cats'}},
      {imageId: 'img-2', tag: {id: 't3', name: 'dogs'}},
    ]);
    const result = await fetchImageTags(['img-1', 'img-2']);
    expect(result['img-1']).toHaveLength(2);
    expect(result['img-2']).toHaveLength(1);
    expect(result['img-2'][0].name).toBe('dogs');
  });

  test('returns {} when DB returns no rows', async () => {
    selectQueue.push([]);
    expect(await fetchImageTags(['img-1'])).toEqual({});
  });
});

describe('fetchUserVotes', () => {
  test('returns {} immediately when imageIds is empty', async () => {
    expect(await fetchUserVotes([])).toEqual({});
  });

  test('returns {} when there is no active session', async () => {
    mockSession = null;
    // no DB call should happen
    expect(await fetchUserVotes(['img-1'])).toEqual({});
  });

  test('maps imageId → "up"/"down" from DB results when authenticated', async () => {
    mockSession = {user: {id: 'u1'}};
    selectQueue.push([
      {imageId: 'img-1', isUpvote: true},
      {imageId: 'img-2', isUpvote: false},
    ]);
    const result = await fetchUserVotes(['img-1', 'img-2']);
    expect(result['img-1']).toBe('up');
    expect(result['img-2']).toBe('down');
  });

  test('returns {} when authenticated but no votes found', async () => {
    mockSession = {user: {id: 'u1'}};
    selectQueue.push([]);
    expect(await fetchUserVotes(['img-1'])).toEqual({});
  });
});

describe('fetchImageMetadata', () => {
  test('returns empty maps for an empty images array', async () => {
    const result = await fetchImageMetadata([]);
    expect(result.tagsByImage).toEqual({});
    expect(result.commentCountMap).toEqual({});
    expect(result.userVotes).toEqual({});
  });

  test('aggregates tags, comment counts, and user votes for given images', async () => {
    mockSession = {user: {id: 'u1'}};
    const images = [{id: 'img-1'} as any];

    // Queue: tags, comment counts, user votes (3 parallel DB calls via Promise.all)
    selectQueue.push([{imageId: 'img-1', tag: {id: 't1', name: 'cats'}}]);
    selectQueue.push([{imageId: 'img-1', count: 5}]);
    selectQueue.push([{imageId: 'img-1', isUpvote: true}]);

    const result = await fetchImageMetadata(images);
    expect(result.tagsByImage['img-1'][0].name).toBe('cats');
    expect(result.commentCountMap['img-1']).toBe(5);
    expect(result.userVotes['img-1']).toBe('up');
  });
});
