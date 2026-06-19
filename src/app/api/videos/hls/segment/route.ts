import {NextRequest, NextResponse} from 'next/server';
import {createReadStream, existsSync, promises as fs} from 'fs';
import {Readable} from 'stream';
import path from 'path';
import {hlsOutputDir} from '@/lib/hls-cache';

const ALLOWED_PATH_PREFIXES = [
  '/mnt/storage/media',
  path.join(process.cwd(), 'public', 'uploads'),
];

function isPathAllowed(filePath: string): boolean {
  return ALLOWED_PATH_PREFIXES.some(p => path.normalize(filePath).startsWith(p));
}

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const filePath = searchParams.get('path');
  const file = searchParams.get('file');

  if (!filePath || filePath.includes('..') || !file) {
    return NextResponse.json({error: 'Invalid params'}, {status: 400});
  }

  if (!/^(playlist\.m3u8|segment\d{4}\.ts)$/.test(file)) {
    return NextResponse.json({error: 'Invalid file'}, {status: 400});
  }

  const normalized = path.normalize(filePath);
  if (!isPathAllowed(normalized)) {
    return NextResponse.json({error: 'Path not allowed'}, {status: 403});
  }

  const outputDir = hlsOutputDir(normalized);
  const segmentPath = path.join(outputDir, file);

  // Poll up to 30s while ffmpeg is still writing this segment
  const deadline = Date.now() + 30_000;
  while (!existsSync(segmentPath) && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 200));
  }

  if (!existsSync(segmentPath)) {
    return NextResponse.json({error: 'Segment not found'}, {status: 404});
  }

  if (file === 'playlist.m3u8') {
    // Rewrite relative segment names to absolute API URLs so hls.js can fetch them
    const raw = await fs.readFile(segmentPath, 'utf-8');
    const encodedPath = encodeURIComponent(normalized);
    const rewritten = raw.replace(
      /^(segment\d{4}\.ts)$/gm,
      `/api/videos/hls/segment?path=${encodedPath}&file=$1`,
    );
    return new Response(rewritten, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store',
      },
    });
  }

  const stream = Readable.toWeb(createReadStream(segmentPath)) as ReadableStream;
  return new Response(stream, {
    headers: {
      'Content-Type': 'video/mp2t',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
