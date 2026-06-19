import {NextRequest, NextResponse} from 'next/server';
import {createReadStream, promises as fs} from 'fs';
import {Readable} from 'stream';
import path from 'path';
import {spawn} from 'child_process';
import {getMimeType} from '@/lib/video-config';

const ALLOWED_PATH_PREFIXES = [
  '/mnt/storage/media',
  path.join(process.cwd(), 'public', 'uploads'),
];

function isPathAllowed(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  return ALLOWED_PATH_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

const BROWSER_NATIVE_FORMATS = new Set(['.mp4', '.webm', '.ogg', '.ogv']);

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({error: 'Path parameter is required'}, {status: 400});
  }

  if (filePath.includes('..')) {
    return NextResponse.json({error: 'Invalid path'}, {status: 400});
  }

  const normalized = path.normalize(filePath);

  if (!isPathAllowed(normalized)) {
    return NextResponse.json({error: 'Path not allowed'}, {status: 403});
  }

  let stat;
  try {
    stat = await fs.stat(normalized);
    if (!stat.isFile()) {
      return NextResponse.json({error: 'Not a file'}, {status: 400});
    }
  } catch {
    return NextResponse.json({error: 'File not found'}, {status: 404});
  }

  const ext = path.extname(normalized).toLowerCase();

  if (BROWSER_NATIVE_FORMATS.has(ext)) {
    // Serve directly with byte-range support so the player can seek
    const fileSize = stat.size;
    const rangeHeader = request.headers.get('range');

    if (rangeHeader) {
      const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const nodeStream = createReadStream(normalized, {start, end});
      const webStream = Readable.toWeb(nodeStream) as ReadableStream;

      return new Response(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': getMimeType(ext),
        },
      });
    }

    const nodeStream = createReadStream(normalized);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new Response(webStream, {
      headers: {
        'Content-Length': String(fileSize),
        'Content-Type': getMimeType(ext),
        'Accept-Ranges': 'bytes',
      },
    });
  }

  // Non-browser-native format (MKV, AVI, etc.) — transcode to fragmented MP4 via ffmpeg
  const ffmpeg = spawn('ffmpeg', [
    '-i', normalized,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '28',
    '-vf', 'scale=-2:480',       // downscale to 480p for real-time performance
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', 'frag_keyframe+empty_moov',
    '-f', 'mp4',
    'pipe:1',
  ]);

  const webStream = new ReadableStream({
    start(controller) {
      ffmpeg.stdout.on('data', (chunk: Buffer) => controller.enqueue(chunk));
      ffmpeg.stdout.on('end', () => controller.close());
      ffmpeg.stderr.on('data', (data: Buffer) =>
        console.error('[ffmpeg]', data.toString())
      );
      ffmpeg.on('error', (err) => controller.error(err));
    },
    cancel() {
      ffmpeg.kill('SIGKILL');
    },
  });

  return new Response(webStream, {
    headers: {
      'Content-Type': 'video/mp4',
      'Transfer-Encoding': 'chunked',
    },
  });
}
