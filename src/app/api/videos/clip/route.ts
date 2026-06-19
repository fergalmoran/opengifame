import {NextRequest, NextResponse} from 'next/server';
import {access, mkdir} from 'fs/promises';
import path, {join} from 'path';
import {execFile} from 'child_process';
import {promisify} from 'util';
import {videoConfig} from '@/lib/video-config';

const execFileAsync = promisify(execFile);

const ALLOWED_PATH_PREFIXES = [
  '/mnt/storage/media',
  path.join(process.cwd(), 'public', 'uploads'),
];

function isPathAllowed(filePath: string): boolean {
  return ALLOWED_PATH_PREFIXES.some(p => path.normalize(filePath).startsWith(p));
}

function escapeFilterPath(p: string): string {
  return p.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");
}

// Escape text for use as a drawtext filter value
function escapeDrawtextText(t: string): string {
  return t
    .replace(/\\/g, '\\\\') // must be first
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/%/g, '%%');
}

function buildSubtitleFilter(burnPath: string, videoPath: string): string {
  if (burnPath.startsWith('file:')) {
    return `subtitles=${escapeFilterPath(burnPath.slice(5))}`;
  }
  if (burnPath.startsWith('embedded:')) {
    const idx = burnPath.slice(9);
    return `subtitles=${escapeFilterPath(videoPath)}:stream_index=${idx}`;
  }
  return '';
}

// Find a bold system font via fontconfig; returns null if unavailable
async function findBoldFont(): Promise<string | null> {
  // Try fc-match first (works on most Linux systems with fontconfig)
  try {
    const {stdout} = await execFileAsync('fc-match', ['--format', '%{file}', 'sans:bold'], {encoding: 'utf8'});
    const f = stdout.trim();
    if (f) return f;
  } catch {/* fontconfig not available */}

  // Fallback: probe common locations (Arch, Debian/Ubuntu, Fedora paths)
  const candidates = [
    '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/ttf-liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/noto/NotoSans-Bold.ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf',
  ];
  for (const f of candidates) {
    try { await access(f); return f; } catch {/* not found */}
  }
  return null;
}

interface Caption {
  start: number;
  end: number;
  text: string;
}

// Build ffmpeg drawtext filters for custom captions — giphy/meme style
function buildCaptionFilters(captions: Caption[], fontFile: string | null): string[] {
  return captions
    .filter(c => c.text.trim() && c.end > c.start)
    .map(c => {
      const text = escapeDrawtextText(c.text.trim().toUpperCase());
      const parts: string[] = [];
      if (fontFile) parts.push(`fontfile=${escapeFilterPath(fontFile)}`);
      parts.push(
        `text=${text}`,
        'fontsize=60',
        'fontcolor=white',
        'borderw=5',
        'bordercolor=black',
        'shadowx=4',
        'shadowy=4',
        'shadowcolor=black@0.7',
        'x=(w-text_w)/2',
        'y=h-text_h-24',
        `enable=between(t\\,${c.start}\\,${c.end})`,
      );
      return `drawtext=${parts.join(':')}`;
    });
}

export async function POST(request: NextRequest) {
  let body: {
    path?: string;
    start?: number;
    end?: number;
    includeAudio?: boolean;
    subtitleBurnPath?: string;
    captions?: Caption[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({error: 'Invalid JSON body'}, {status: 400});
  }

  const {path: filePath, start, end, includeAudio = false, subtitleBurnPath, captions = []} = body;

  if (!filePath || typeof start !== 'number' || typeof end !== 'number') {
    return NextResponse.json({error: 'path, start and end are required'}, {status: 400});
  }

  if (filePath.includes('..')) {
    return NextResponse.json({error: 'Invalid path'}, {status: 400});
  }

  const normalized = path.normalize(filePath);
  if (!isPathAllowed(normalized)) {
    return NextResponse.json({error: 'Path not allowed'}, {status: 403});
  }

  if (start >= end) {
    return NextResponse.json({error: 'start must be less than end'}, {status: 400});
  }

  const clipDuration = end - start;
  if (clipDuration > videoConfig.gif.maxDuration) {
    return NextResponse.json(
      {error: `Clip duration cannot exceed ${videoConfig.gif.maxDuration} seconds`},
      {status: 400},
    );
  }

  const uploadDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, {recursive: true});

  const subFilter = subtitleBurnPath ? buildSubtitleFilter(subtitleBurnPath, normalized) : null;
  const fontFile = captions.length > 0 ? await findBoldFont() : null;
  const captionFilters = buildCaptionFilters(captions, fontFile);

  if (includeAudio) {
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.mp4`;
    const outputPath = join(uploadDir, filename);

    const allFilters = [...(subFilter ? [subFilter] : []), ...captionFilters];
    const ffmpegArgs = [
      '-ss', String(start),
      '-t', String(clipDuration),
      '-i', normalized,
      ...(allFilters.length > 0 ? ['-vf', allFilters.join(',')] : []),
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      outputPath,
    ];

    try {
      await execFileAsync('ffmpeg', ffmpegArgs);
    } catch (err) {
      console.error('ffmpeg MP4 clip error:', err);
      return NextResponse.json({error: 'MP4 generation failed'}, {status: 500});
    }

    return NextResponse.json({gifUrl: `/uploads/${filename}`, filename, mimeType: 'video/mp4'});
  }

  // GIF — palette-optimised single-pass filtergraph
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.gif`;
  const outputPath = join(uploadDir, filename);

  const {defaultFps, defaultWidth} = videoConfig.gif;

  // Build the main filter chain (everything before the palette split)
  const mainChain = [
    `fps=${defaultFps}`,
    `scale=${defaultWidth}:-1:flags=lanczos`,
    ...(subFilter ? [subFilter] : []),
    ...captionFilters,
  ].join(',');

  // Filtergraph: main chain feeds into palette generation and application
  const vf = `${mainChain},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`;

  try {
    await execFileAsync('ffmpeg', [
      '-ss', String(start),
      '-t', String(clipDuration),
      '-i', normalized,
      '-vf', vf,
      '-loop', '0',
      '-y',
      outputPath,
    ]);
  } catch (err) {
    console.error('ffmpeg GIF clip error:', err);
    return NextResponse.json({error: 'GIF generation failed'}, {status: 500});
  }

  return NextResponse.json({gifUrl: `/uploads/${filename}`, filename, mimeType: 'image/gif'});
}
