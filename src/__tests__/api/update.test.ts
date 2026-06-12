import { mock, describe, test, expect, beforeEach } from 'bun:test';

const state = {
  session: null as any,
  selectQueue: [] as any[][],
  insertQueue: [] as any[][],
  updateResult: [] as any[],
  deleteResult: [] as any[],
};

// All select chain methods pass through until where() consumes one queue slot.
function makeSelectProxy(): any {
  const proxy: any = {
    from: () => proxy,
    leftJoin: () => proxy,
    innerJoin: () => proxy,
    orderBy: () => proxy,
    groupBy: () => proxy,
    where: () => {
      const result = state.selectQueue.shift() ?? [];
      return Object.assign(Promise.resolve(result), {
        limit: () => Promise.resolve(result),
        orderBy: () => Promise.resolve(result),
      });
    },
  };
  return proxy;
}

mock.module('next/server', () => ({
  NextRequest: Request,
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

mock.module('@/lib/server-auth', () => ({
  getServerAuthSession: async () => state.session,
}));

mock.module('@/lib/db', () => ({
  db: {
    select: () => makeSelectProxy(),
    insert: () => ({
      values: () => {
        const result = state.insertQueue.shift() ?? [];
        return Object.assign(Promise.resolve(result), {
          returning: () => Promise.resolve(result),
        });
      },
    }),
    update: () => ({
      set: () => ({
        where: () =>
          Object.assign(Promise.resolve(state.updateResult), {
            returning: () => Promise.resolve(state.updateResult),
          }),
      }),
    }),
    delete: () => ({
      where: () =>
        Object.assign(Promise.resolve(state.deleteResult), {
          returning: () => Promise.resolve(state.deleteResult),
        }),
    }),
  },
}));

const { PATCH } = await import('@/app/api/images/update/route');

function makeRequest(body: object) {
  return new Request('http://localhost/api/images/update', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => {
  state.session = null;
  state.selectQueue = [];
  state.insertQueue = [];
  state.updateResult = [];
  state.deleteResult = [];
});

describe('PATCH /api/images/update', () => {
  test('401 when unauthenticated', async () => {
    const res = await PATCH(makeRequest({ imageId: 'img-1', title: 'T' }));
    expect(res.status).toBe(401);
  });

  test('400 when imageId is missing', async () => {
    state.session = { user: { id: 'u1' } };
    const res = await PATCH(makeRequest({ title: 'T' }));
    expect(res.status).toBe(400);
  });

  test('400 when title is blank', async () => {
    state.session = { user: { id: 'u1' } };
    const res = await PATCH(makeRequest({ imageId: 'img-1', title: '  ' }));
    expect(res.status).toBe(400);
  });

  test('404 when image not found or not owned', async () => {
    state.session = { user: { id: 'u1' } };
    state.updateResult = []; // nothing updated → not found / wrong owner

    const res = await PATCH(makeRequest({ imageId: 'img-1', title: 'Title', tags: [] }));
    expect(res.status).toBe(404);
  });

  test('200 when updating with no tags', async () => {
    state.session = { user: { id: 'u1' } };
    state.updateResult = [{ id: 'img-1' }];
    // No tags to resolve, but still fetches current image_tags
    state.selectQueue = [
      [], // current image_tags → empty
    ];

    const res = await PATCH(makeRequest({ imageId: 'img-1', title: 'New Title', tags: [] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('creates new tags that do not yet exist', async () => {
    state.session = { user: { id: 'u1' } };
    state.updateResult = [{ id: 'img-1' }];
    state.selectQueue = [
      [],              // 'cats' tag lookup → does not exist
      [],              // current image_tags → empty
    ];
    state.insertQueue = [
      [{ id: 't-new' }], // newly created 'cats' tag
      [],                // image_tags insert (no returning needed)
    ];

    const res = await PATCH(makeRequest({ imageId: 'img-1', title: 'T', tags: ['cats'] }));
    expect(res.status).toBe(200);
  });

  test('reuses existing tags without inserting duplicates', async () => {
    state.session = { user: { id: 'u1' } };
    state.updateResult = [{ id: 'img-1' }];
    state.selectQueue = [
      [{ id: 't1' }], // 'funny' tag lookup → already exists
      [],             // current image_tags → empty
    ];
    state.insertQueue = [
      [], // image_tags insert (the existing tag is just linked)
    ];

    const res = await PATCH(makeRequest({ imageId: 'img-1', title: 'T', tags: ['funny'] }));
    expect(res.status).toBe(200);
  });

  test('removes tags no longer in the list', async () => {
    state.session = { user: { id: 'u1' } };
    state.updateResult = [{ id: 'img-1' }];
    state.selectQueue = [
      // No tag name lookups (tags: [])
      [{ tagId: 't-old' }], // current image_tags has one tag to remove
    ];

    const res = await PATCH(makeRequest({ imageId: 'img-1', title: 'T', tags: [] }));
    expect(res.status).toBe(200);
  });

  test('normalises tag names to lowercase and trims whitespace', async () => {
    state.session = { user: { id: 'u1' } };
    state.updateResult = [{ id: 'img-1' }];
    // Expect the tag lookup to happen with 'cats' (lowercased/trimmed)
    state.selectQueue = [
      [{ id: 't1' }], // 'cats' found
      [],             // current image_tags empty
    ];
    state.insertQueue = [[]];

    const res = await PATCH(makeRequest({ imageId: 'img-1', title: 'T', tags: ['  CATS  '] }));
    expect(res.status).toBe(200);
  });

  test('deduplicates tag names', async () => {
    state.session = { user: { id: 'u1' } };
    state.updateResult = [{ id: 'img-1' }];
    // Only one tag lookup should happen despite two identical entries
    state.selectQueue = [
      [{ id: 't1' }], // 'funny' (looked up once)
      [],             // current image_tags
    ];
    state.insertQueue = [[]];

    const res = await PATCH(makeRequest({ imageId: 'img-1', title: 'T', tags: ['funny', 'funny'] }));
    expect(res.status).toBe(200);
  });
});
