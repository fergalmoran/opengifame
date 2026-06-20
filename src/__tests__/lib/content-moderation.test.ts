import {afterEach, beforeEach, describe, expect, mock, test} from 'bun:test';

const originalFetch = globalThis.fetch;
let fetchMock: ReturnType<typeof mock>;

function makeFetchMock(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  return mock(handler) as unknown as typeof fetch;
}

function googleVisionResponse(adult: string, violence: string) {
  return new Response(
    JSON.stringify({responses: [{safeSearchAnnotation: {adult, violence, racy: 'UNLIKELY', spoof: 'VERY_UNLIKELY'}}]}),
    {status: 200, headers: {'Content-Type': 'application/json'}},
  );
}

function azureResponse(categories: Array<{category: string; severity: number}>) {
  return new Response(
    JSON.stringify({categoriesAnalysis: categories}),
    {status: 200, headers: {'Content-Type': 'application/json'}},
  );
}

// A 4-byte buffer small enough to pass both provider size limits
const TINY_BUFFER = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

beforeEach(() => {
  process.env.GOOGLE_VISION_API_KEY = 'test-google-key';
  process.env.AZURE_CONTENT_SAFETY_ENDPOINT = 'https://test.cognitiveservices.azure.com';
  process.env.AZURE_CONTENT_SAFETY_KEY = 'test-azure-key';
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('moderateContent', () => {
  test('passes when both providers return clean results', async () => {
    fetchMock = makeFetchMock(url => {
      if (url.includes('vision.googleapis.com'))
        return googleVisionResponse('VERY_UNLIKELY', 'VERY_UNLIKELY');
      return azureResponse([
        {category: 'Sexual', severity: 0},
        {category: 'Violence', severity: 0},
      ]);
    });
    globalThis.fetch = fetchMock;

    const {moderateContent} = await import('@/lib/content-moderation');
    const result = await moderateContent(TINY_BUFFER, 'image/png');
    expect(result.blocked).toBe(false);
  });

  test('blocks when Google Vision flags adult content as VERY_LIKELY', async () => {
    fetchMock = makeFetchMock(url => {
      if (url.includes('vision.googleapis.com'))
        return googleVisionResponse('VERY_LIKELY', 'VERY_UNLIKELY');
      return azureResponse([{category: 'Sexual', severity: 0}]);
    });
    globalThis.fetch = fetchMock;

    const {moderateContent} = await import('@/lib/content-moderation');
    const result = await moderateContent(TINY_BUFFER, 'image/png');
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('google');
  });

  test('blocks when Google Vision flags violence as LIKELY', async () => {
    fetchMock = makeFetchMock(url => {
      if (url.includes('vision.googleapis.com'))
        return googleVisionResponse('UNLIKELY', 'LIKELY');
      return azureResponse([{category: 'Violence', severity: 0}]);
    });
    globalThis.fetch = fetchMock;

    const {moderateContent} = await import('@/lib/content-moderation');
    const result = await moderateContent(TINY_BUFFER, 'image/png');
    expect(result.blocked).toBe(true);
  });

  test('blocks when Azure returns sexual content with severity >= 2', async () => {
    fetchMock = makeFetchMock(url => {
      if (url.includes('vision.googleapis.com'))
        return googleVisionResponse('VERY_UNLIKELY', 'VERY_UNLIKELY');
      return azureResponse([
        {category: 'Sexual', severity: 4},
        {category: 'Violence', severity: 0},
      ]);
    });
    globalThis.fetch = fetchMock;

    const {moderateContent} = await import('@/lib/content-moderation');
    const result = await moderateContent(TINY_BUFFER, 'image/png');
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('azure');
    expect(result.reason).toContain('Sexual=4');
  });

  test('fails closed when both providers throw', async () => {
    fetchMock = makeFetchMock(() => { throw new Error('network error'); });
    globalThis.fetch = fetchMock;

    const {moderateContent} = await import('@/lib/content-moderation');
    const result = await moderateContent(TINY_BUFFER, 'image/png');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('moderation-unavailable');
  });

  test('passes when one provider throws but the other returns clean', async () => {
    fetchMock = makeFetchMock(url => {
      if (url.includes('vision.googleapis.com')) throw new Error('Vision API down');
      return azureResponse([{category: 'Sexual', severity: 0}]);
    });
    globalThis.fetch = fetchMock;

    const {moderateContent} = await import('@/lib/content-moderation');
    const result = await moderateContent(TINY_BUFFER, 'image/png');
    expect(result.blocked).toBe(false);
  });

  test('skips moderation for video/mp4', async () => {
    fetchMock = makeFetchMock(() => { throw new Error('should not be called'); });
    globalThis.fetch = fetchMock;

    const {moderateContent} = await import('@/lib/content-moderation');
    const result = await moderateContent(TINY_BUFFER, 'video/mp4');
    expect(result.blocked).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('blocks images that exceed the size limit for all providers', async () => {
    const {moderateContent} = await import('@/lib/content-moderation');
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024); // 11 MB
    const result = await moderateContent(oversizedBuffer, 'image/jpeg');
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('image-exceeds-moderation-size-limit');
  });
});
