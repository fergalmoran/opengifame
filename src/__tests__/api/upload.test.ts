import {beforeEach, describe, expect, mock, test} from 'bun:test';

const state = {
  session: null as any,
  selectQueue: [] as any[][],
  insertResult: [] as any[],
};

// All select chain methods pass through until where() consumes one queue slot.
// This handles both the slug uniqueness check (select from images) and tag
// lookups (select from tags) that the upload route performs.
function makeSelectProxy(): any {
  const proxy: any = {
    from: () => proxy,
    leftJoin: () => proxy,
    where: () => {
      const result = state.selectQueue.shift() ?? [];
      return Object.assign(Promise.resolve(result), {
        limit: () => Promise.resolve(result),
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

// Upload route calls getServerSession(authOptions) directly, not via server-auth.
mock.module('next-auth', () => ({
  default: {},
  getServerSession: async () => state.session,
}));

mock.module('@/lib/auth', () => ({authOptions: {}}));

mock.module('@/lib/db', () => ({
  db: {
    select: () => makeSelectProxy(),
    insert: () => ({
      values: () =>
        Object.assign(Promise.resolve(state.insertResult), {
          returning: () => Promise.resolve(state.insertResult),
        }),
    }),
  },
}));

mock.module('fs/promises', () => ({
  writeFile: async () => {
  },
  mkdir: async () => {
  },
}));

const {POST} = await import('@/app/api/images/upload/route');

function makeUploadRequest(opts: {
  file?: { content: string; type: string; name: string };
  title?: string;
  tags?: string;
}) {
  const fd = new FormData();
  if (opts.file) {
    fd.append('file', new Blob([opts.file.content], {type: opts.file.type}), opts.file.name);
  }
  if (opts.title !== undefined) fd.append('title', opts.title);
  if (opts.tags !== undefined) fd.append('tags', opts.tags);
  return new Request('http://localhost/api/images/upload', {method: 'POST', body: fd}) as any;
}

const validFile = {content: 'fake-image-bytes', type: 'image/jpeg', name: 'photo.jpg'};

beforeEach(() => {
  state.session = null;
  state.selectQueue = [];
  state.insertResult = [];
});

describe('POST /api/images/upload', () => {
  test('401 when unauthenticated', async () => {
    const res = await POST(makeUploadRequest({file: validFile}));
    expect(res.status).toBe(401);
  });

  test('400 when no file is included', async () => {
    state.session = {user: {id: 'u1'}};
    const res = await POST(makeUploadRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/missing file/i);
  });

  test('400 when file is not an image', async () => {
    state.session = {user: {id: 'u1'}};
    const res = await POST(
      makeUploadRequest({file: {content: 'data', type: 'application/pdf', name: 'doc.pdf'}})
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/image/i);
  });

  test('200 returns id/slug/url on successful upload (no title, no tags)', async () => {
    state.session = {user: {id: 'u1'}};
    // Slot for generateUniqueSlug's slug-existence check
    state.selectQueue.push([]);
    state.insertResult = [{id: 'img-1', slug: 'happy-cat', url: '/uploads/img.jpg'}];

    const res = await POST(makeUploadRequest({file: validFile}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('img-1');
    expect(body.slug).toBe('happy-cat');
    expect(body.url).toBeTruthy();
  });

  test('200 with custom title', async () => {
    state.session = {user: {id: 'u1'}};
    state.selectQueue.push([]); // slug check
    state.insertResult = [{id: 'img-2', slug: 'my-photo', url: '/uploads/img.jpg'}];

    const res = await POST(makeUploadRequest({file: validFile, title: 'My Photo'}));
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe('img-2');
  });

  test('200 and processes comma-separated tags', async () => {
    state.session = {user: {id: 'u1'}};
    state.selectQueue.push([]);             // slug uniqueness check
    state.selectQueue.push([]);             // 'cats' tag lookup → does not exist (triggers insert)
    state.selectQueue.push([{id: 't1'}]); // 'funny' tag lookup → already exists
    state.insertResult = [{id: 'img-3', slug: 'test-slug', url: '/uploads/img.jpg'}];

    const res = await POST(makeUploadRequest({file: validFile, tags: 'cats, funny'}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('img-3');
  });
});
