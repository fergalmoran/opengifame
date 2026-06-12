import { mock, describe, test, expect, beforeEach } from 'bun:test';

const state = {
  session: null as any,
  deleteResult: [] as any[],
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
    delete: () => ({
      where: () =>
        Object.assign(Promise.resolve(state.deleteResult), {
          returning: () => Promise.resolve(state.deleteResult),
        }),
    }),
  },
}));

// fs/promises.unlink is called inside a try-catch that swallows errors,
// so we don't need to mock it — it will simply fail silently on missing files.

const { DELETE } = await import('@/app/api/images/delete/route');

function makeRequest(body: object) {
  return new Request('http://localhost/api/images/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => {
  state.session = null;
  state.deleteResult = [];
});

describe('DELETE /api/images/delete', () => {
  test('401 when unauthenticated', async () => {
    const res = await DELETE(makeRequest({ imageId: 'img-1' }));
    expect(res.status).toBe(401);
  });

  test('400 when imageId is missing', async () => {
    state.session = { user: { id: 'u1' } };
    const res = await DELETE(makeRequest({}));
    expect(res.status).toBe(400);
  });

  test('404 when image not found or not owned by requesting user', async () => {
    state.session = { user: { id: 'u1' } };
    state.deleteResult = []; // nothing deleted → image not found or not owned

    const res = await DELETE(makeRequest({ imageId: 'img-999' }));
    expect(res.status).toBe(404);
  });

  test('200 and success:true on successful deletion', async () => {
    state.session = { user: { id: 'u1' } };
    state.deleteResult = [{ id: 'img-1', filename: 'nonexistent-test-file.jpg' }];

    const res = await DELETE(makeRequest({ imageId: 'img-1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
