import {beforeEach, describe, expect, mock, test} from 'bun:test';

const state = {
  session: null as any,
  updateResult: [] as any[],
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
    update: () => ({
      set: () => ({
        where: () =>
          Object.assign(Promise.resolve(state.updateResult), {
            returning: () => Promise.resolve(state.updateResult),
          }),
      }),
    }),
  },
}));

const {PATCH} = await import('@/app/api/images/update-title/route');

function makeRequest(body: object) {
  return new Request('http://localhost/api/images/update-title', {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => {
  state.session = null;
  state.updateResult = [];
});

describe('PATCH /api/images/update-title', () => {
  test('401 when unauthenticated', async () => {
    const res = await PATCH(makeRequest({imageId: 'img-1', title: 'New Title'}));
    expect(res.status).toBe(401);
  });

  test('400 when imageId is missing', async () => {
    state.session = {user: {id: 'u1'}};
    const res = await PATCH(makeRequest({title: 'New Title'}));
    expect(res.status).toBe(400);
  });

  test('400 when title is blank', async () => {
    state.session = {user: {id: 'u1'}};
    const res = await PATCH(makeRequest({imageId: 'img-1', title: '   '}));
    expect(res.status).toBe(400);
  });

  test('404 when image not found or not owned by user', async () => {
    state.session = {user: {id: 'u1'}};
    state.updateResult = []; // DB found nothing to update

    const res = await PATCH(makeRequest({imageId: 'img-999', title: 'New Title'}));
    expect(res.status).toBe(404);
  });

  test('200 with trimmed title on success', async () => {
    state.session = {user: {id: 'u1'}};
    state.updateResult = [{id: 'img-1', title: 'New Title'}];

    const res = await PATCH(makeRequest({imageId: 'img-1', title: '  New Title  '}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.title).toBe('New Title');
  });
});
