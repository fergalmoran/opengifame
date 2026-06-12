import { mock, describe, test, expect, beforeEach } from 'bun:test';

// Per-test mutable state; reset in beforeEach.
const state = {
  session: null as any,
  // Each entry is consumed by one db.select().from().where() call.
  selectQueue: [] as any[][],
  insertResult: [] as any[],
  updateResult: [] as any[],
  deleteResult: [] as any[],
};

function makeSelectChain() {
  const result = state.selectQueue.shift() ?? [];
  return Object.assign(Promise.resolve(result), {
    limit: () => Promise.resolve(result),
    orderBy: () => Promise.resolve(result),
  });
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
    select: () => ({ from: () => ({ where: makeSelectChain }) }),
    insert: () => ({
      values: () =>
        Object.assign(Promise.resolve(state.insertResult), {
          returning: () => Promise.resolve(state.insertResult),
        }),
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

const { POST } = await import('@/app/api/images/vote/route');

function makeRequest(body: object) {
  return new Request('http://localhost/api/images/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => {
  state.session = null;
  state.selectQueue = [];
  state.insertResult = [];
  state.updateResult = [];
  state.deleteResult = [];
});

describe('POST /api/images/vote', () => {
  test('401 when unauthenticated', async () => {
    const res = await POST(makeRequest({ imageId: 'img-1', isUpvote: true }));
    expect(res.status).toBe(401);
  });

  test('400 when imageId is missing', async () => {
    state.session = { user: { id: 'u1' } };
    const res = await POST(makeRequest({ isUpvote: true }));
    expect(res.status).toBe(400);
  });

  test('400 when isUpvote is not a boolean', async () => {
    state.session = { user: { id: 'u1' } };
    const res = await POST(makeRequest({ imageId: 'img-1', isUpvote: 'yes' }));
    expect(res.status).toBe(400);
  });

  test('creates a new vote and returns correct counts', async () => {
    state.session = { user: { id: 'u1' } };
    // 1) existingVote check  2) allVotes after insert  3) userVote after insert
    state.selectQueue = [[], [{ isUpvote: true }], [{ isUpvote: true }]];

    const res = await POST(makeRequest({ imageId: 'img-1', isUpvote: true }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.upvotes).toBe(1);
    expect(body.downvotes).toBe(0);
    expect(body.userVote).toBe('up');
  });

  test('removes vote when the same type is clicked again (toggle off)', async () => {
    state.session = { user: { id: 'u1' } };
    // 1) existingVote = upvote  2) allVotes = empty after deletion  3) userVote = none
    state.selectQueue = [[{ id: 'v1', isUpvote: true }], [], []];

    const res = await POST(makeRequest({ imageId: 'img-1', isUpvote: true }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.upvotes).toBe(0);
    expect(body.userVote).toBeNull();
  });

  test('changes vote direction when the opposite type is clicked', async () => {
    state.session = { user: { id: 'u1' } };
    // 1) existingVote = upvote  2) allVotes = 1 downvote  3) userVote = downvote
    state.selectQueue = [
      [{ id: 'v1', isUpvote: true }],
      [{ isUpvote: false }],
      [{ isUpvote: false }],
    ];

    const res = await POST(makeRequest({ imageId: 'img-1', isUpvote: false }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.upvotes).toBe(0);
    expect(body.downvotes).toBe(1);
    expect(body.userVote).toBe('down');
  });
});
