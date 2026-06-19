import {NextRequest, NextResponse} from 'next/server';
import path from 'path';
import {getOrStartHls, readySegmentCount} from '@/lib/hls-cache';

const ALLOWED_PATH_PREFIXES = [
  '/mnt/storage/media',
  path.join(process.cwd(), 'public', 'uploads'),
];

function isPathAllowed(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  return ALLOWED_PATH_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath || filePath.includes('..')) {
    return NextResponse.json({error: 'Invalid path'}, {status: 400});
  }

  const normalized = path.normalize(filePath);
  if (!isPathAllowed(normalized)) {
    return NextResponse.json({error: 'Path not allowed'}, {status: 403});
  }

  const entry = getOrStartHls(normalized);
  const segments = readySegmentCount(entry.outputDir);

  return NextResponse.json({
    ready: segments >= 2,
    segments,
    done: entry.done,
    error: entry.error,
  });
}
