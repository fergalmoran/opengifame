import {beforeEach, describe, expect, mock, test} from 'bun:test';

const state = {
  session: null as any,
  selectQueue: [] as any[][],
  insertResult: [] as any[],
};

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
    select: () => ({
      from: () => ({
        where: () => {
          const result = state.selectQueue.shift() ?? [];
          return Object.assign(Promise.resolve(result), {
            limit: () => Promise.resolve(result),
          });
        },
      }),
    }),
    insert: () => ({
      values: () =>
        Object.assign(Promise.resolve(state.insertResult), {
          returning: () => Promise.resolve(state.insertResult),
        }),
    }),
  },
}));

const {POST} = await import('@/app/api/comments/route');

function makeRequest(body: object) {
  return new Request('http://localhost/api/comments', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => {
  state.session = null;
  state.selectQueue = [];
  state.insertResult = [];
});

describe('POST /api/comments', () => {
  test('401 when unauthenticated', async () => {
    const res = await POST(makeRequest({imageId: 'img-1', content: 'Hello'}));
    expect(res.status).toBe(401);
  });

  test('400 when imageId is missing', async () => {
    state.session = {user: {id: 'u1'}};
    const res = await POST(makeRequest({content: 'Hello'}));
    expect(res.status).toBe(400);
  });

  test('400 when content is blank', async () => {
    state.session = {user: {id: 'u1'}};
    const res = await POST(makeRequest({imageId: 'img-1', content: '   '}));
    expect(res.status).toBe(400);
  });

  test('creates comment and returns it with author info', async () => {
    state.session = {user: {id: 'u1'}};
    state.insertResult = [
      {id: 'c1', content: 'Great shot!', createdAt: new Date('2024-01-01')},
    ];
    state.selectQueue = [
      [{name: 'Alice', email: 'alice@example.com'}], // author info lookup
    ];

    const res = await POST(makeRequest({imageId: 'img-1', content: 'Great shot!'}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('c1');
    expect(body.content).toBe('Great shot!');
    expect(body.authorName).toBe('Alice');
    expect(body.authorEmail).toBe('alice@example.com');
  });

  test('authorName is null when author has no name set', async () => {
    state.session = {user: {id: 'u1'}};
    state.insertResult = [{id: 'c2', content: 'Nice!', createdAt: new Date()}];
    state.selectQueue = [[{name: null, email: 'anon@example.com'}]];

    const res = await POST(makeRequest({imageId: 'img-1', content: 'Nice!'}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authorName).toBeNull();
  });
});
