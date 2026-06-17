import { NextRequest, NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { videoConfig } from '@/lib/video-config';

const execFileAsync = promisify(execFile);

const ALLOWED_PATH_PREFIXES = [
  '/mnt/storage/media',
  path.join(process.cwd(), 'public', 'uploads'),
];

function isPathAllowed(filePath: string): boolean {
  return ALLOWED_PATH_PREFIXES.some(p => path.normalize(filePath).startsWith(p));
}

export async function POST(request: NextRequest) {
  let body: { path?: string; start?: number; end?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { path: filePath, start, end } = body;

  if (!filePath || typeof start !== 'number' || typeof end !== 'number') {
    return NextResponse.json({ error: 'path, start and end are required' }, { status: 400 });
  }

  if (filePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const normalized = path.normalize(filePath);
  if (!isPathAllowed(normalized)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  if (start >= end) {
    return NextResponse.json({ error: 'start must be less than end' }, { status: 400 });
  }

  const duration = end - start;
  if (duration > videoConfig.gif.maxDuration) {
    return NextResponse.json(
      { error: `Clip duration cannot exceed ${videoConfig.gif.maxDuration} seconds` },
      { status: 400 },
    );
  }

  const uploadDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.gif`;
  const outputPath = join(uploadDir, filename);

  const { defaultFps, defaultWidth } = videoConfig.gif;

  // Single-pass high-quality GIF via split palette filter
  const vf = [
    `fps=${defaultFps}`,
    `scale=${defaultWidth}:-1:flags=lanczos`,
    `split[s0][s1]`,
    `[s0]palettegen[p]`,
    `[s1][p]paletteuse`,
  ].join(',');

  try {
    await execFileAsync('ffmpeg', [
      '-ss', String(start),
      '-t', String(duration),
      '-i', normalized,
      '-vf', vf,
      '-loop', '0',
      '-y',
      outputPath,
    ]);
  } catch (err) {
    console.error('ffmpeg clip error:', err);
    return NextResponse.json({ error: 'GIF generation failed' }, { status: 500 });
  }

  return NextResponse.json({ gifUrl: `/uploads/${filename}`, filename });
}
