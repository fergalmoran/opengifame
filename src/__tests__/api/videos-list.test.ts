import { mock, describe, test, expect } from 'bun:test';

// The route imports `{ promises as fs } from 'fs'`, so we mock the 'fs' module.
const mockFs = {
  readdir: async (_path: string) => [] as string[],
  stat: async (_path: string) => ({ isFile: () => true, size: 1024 }),
};

mock.module('fs', () => ({ promises: mockFs }));
mock.module('next/server', () => ({
  NextRequest: Request,
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

const { GET } = await import('@/app/api/videos/list/route');

function makeRequest(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/videos/list');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new Request(url) as any;
}

describe('GET /api/videos/list', () => {
  test('400 when path query parameter is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/path/i);
  });

  test('400 when path contains a directory traversal sequence', async () => {
    const res = await GET(makeRequest({ path: '/some/../secret' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid path/i);
  });

  test('404 when directory cannot be read', async () => {
    mockFs.readdir = async () => { throw new Error('ENOENT'); };
    const res = await GET(makeRequest({ path: '/nonexistent' }));
    expect(res.status).toBe(404);
  });

  test('returns only video files, sorted by name', async () => {
    mockFs.readdir = async () => ['movie.avi', 'photo.jpg', 'clip.mp4', 'notes.txt', 'show.mkv'] as any;
    mockFs.stat = async () => ({ isFile: () => true, size: 2048 } as any);

    const res = await GET(makeRequest({ path: '/videos' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(3);
    const names = body.videos.map((v: any) => v.name);
    expect(names).toContain('clip.mp4');
    expect(names).toContain('movie.avi');
    expect(names).toContain('show.mkv');
    expect(names).not.toContain('photo.jpg');
    expect(names).not.toContain('notes.txt');
    // Sorted alphabetically
    expect(names).toEqual([...names].sort());
  });

  test('excludes entries that are not regular files', async () => {
    mockFs.readdir = async () => ['real.mp4', 'dir.mp4'] as any;
    let callCount = 0;
    mockFs.stat = async () => {
      callCount++;
      return { isFile: () => callCount === 1, size: 512 } as any; // only first is a file
    };

    const res = await GET(makeRequest({ path: '/videos' }));
    const body = await res.json();
    expect(body.count).toBe(1);
    expect(body.videos[0].name).toBe('real.mp4');
  });

  test('returns empty list when directory has no video files', async () => {
    mockFs.readdir = async () => ['readme.txt', 'image.png'] as any;
    mockFs.stat = async () => ({ isFile: () => true, size: 100 } as any);

    const res = await GET(makeRequest({ path: '/videos' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(0);
    expect(body.videos).toEqual([]);
  });
});
