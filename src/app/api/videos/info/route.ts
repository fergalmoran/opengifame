import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const ALLOWED_PATH_PREFIXES = [
  '/mnt/storage/media',
  path.join(process.cwd(), 'public', 'uploads'),
];

function isPathAllowed(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  return ALLOWED_PATH_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
  }

  if (filePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const normalized = path.normalize(filePath);

  if (!isPathAllowed(normalized)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  try {
    await fs.access(normalized);
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      normalized,
    ]);

    const probe = JSON.parse(stdout) as { format?: { duration?: string } };
    const duration = parseFloat(probe.format?.duration ?? '0');

    return NextResponse.json({ duration });
  } catch (err) {
    console.error('ffprobe error:', err);
    return NextResponse.json({ error: 'Could not probe video' }, { status: 500 });
  }
}
