import { mock, describe, test, expect, beforeEach } from 'bun:test';

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

// writeFile/mkdir are needed when an avatar is uploaded; mock them to avoid real I/O.
mock.module('fs/promises', () => ({
  writeFile: async () => {},
  mkdir: async () => {},
}));

const { PATCH } = await import('@/app/api/user/update/route');

// Pass blobs as [blob, filename] tuples so the MIME type is explicit.
// Bun infers the content-type from the filename extension, not the Blob's type property.
function makeFormRequest(fields: Record<string, string | [Blob, string]>, method = 'PATCH') {
  const fd = new FormData();
  for (const [key, val] of Object.entries(fields)) {
    if (Array.isArray(val)) {
      fd.append(key, val[0], val[1]);
    } else {
      fd.append(key, val);
    }
  }
  return new Request('http://localhost/api/user/update', { method, body: fd }) as any;
}

beforeEach(() => {
  state.session = null;
  state.updateResult = [];
});

describe('PATCH /api/user/update', () => {
  test('401 when unauthenticated', async () => {
    const res = await PATCH(makeFormRequest({ name: 'Alice' }));
    expect(res.status).toBe(401);
  });

  test('400 when name is missing', async () => {
    state.session = { user: { id: 'u1' } };
    const res = await PATCH(makeFormRequest({ bio: 'Hello' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/name/i);
  });

  test('400 when name is blank', async () => {
    state.session = { user: { id: 'u1' } };
    const res = await PATCH(makeFormRequest({ name: '   ' }));
    expect(res.status).toBe(400);
  });

  test('200 with updated user on success (no avatar)', async () => {
    state.session = { user: { id: 'u1' } };
    state.updateResult = [{ id: 'u1', name: 'Alice', bio: 'Hello', image: null }];

    const res = await PATCH(makeFormRequest({ name: 'Alice', bio: 'Hello' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.name).toBe('Alice');
  });

  test('400 when uploaded avatar is not an image', async () => {
    // Use a .txt filename so Bun infers text/plain rather than an image type
    state.session = { user: { id: 'u1' } };
    const textFile = new Blob(['not an image'], { type: 'text/plain' });
    const res = await PATCH(makeFormRequest({ name: 'Alice', avatar: [textFile, 'data.txt'] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/image/i);
  });

  test('200 when a valid image avatar is uploaded', async () => {
    state.session = { user: { id: 'u1' } };
    state.updateResult = [{ id: 'u1', name: 'Alice', bio: null, image: '/uploads/avatar-u1.png' }];
    const imageBlob = new Blob(['fake-png-bytes'], { type: 'image/png' });

    const res = await PATCH(makeFormRequest({ name: 'Alice', avatar: [imageBlob, 'avatar.png'] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
