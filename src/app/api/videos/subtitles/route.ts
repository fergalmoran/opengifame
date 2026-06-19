import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

const ALLOWED_PATH_PREFIXES = [
  '/mnt/storage/media',
  path.join(process.cwd(), 'public', 'uploads'),
];

const SUBTITLE_EXTENSIONS = ['.srt', '.vtt', '.ass', '.ssa', '.sub'];

function isPathAllowed(filePath: string): boolean {
  const norm = path.normalize(filePath);
  return ALLOWED_PATH_PREFIXES.some(p => norm.startsWith(p));
}

async function toVtt(inputPath: string): Promise<string> {
  if (path.extname(inputPath).toLowerCase() === '.vtt') {
    return fs.readFile(inputPath, 'utf-8');
  }
  const { stdout } = await execFileAsync('ffmpeg', [
    '-loglevel', 'quiet',
    '-i', inputPath,
    '-f', 'webvtt',
    '-',
  ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  return stdout;
}

async function extractEmbeddedVtt(videoPath: string, subIndex: number): Promise<string> {
  const { stdout } = await execFileAsync('ffmpeg', [
    '-loglevel', 'quiet',
    '-i', videoPath,
    '-map', `0:s:${subIndex}`,
    '-f', 'webvtt',
    '-',
  ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  return stdout;
}

async function detectEmbeddedStreams(videoPath: string): Promise<{
  index: number;
  language?: string;
  title?: string;
}[]> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_streams',
      '-select_streams', 's',
      videoPath,
    ], { encoding: 'utf8' });
    const data = JSON.parse(stdout) as {
      streams?: { tags?: { language?: string; title?: string } }[];
    };
    return (data.streams ?? []).map((s, i) => ({
      index: i,
      language: s.tags?.language,
      title: s.tags?.title,
    }));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoPath = searchParams.get('path');

  if (!videoPath || videoPath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const normalized = path.normalize(videoPath);
  if (!isPathAllowed(normalized)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  const source = searchParams.get('source');

  // Serve a specific subtitle track as WebVTT
  if (source) {
    try {
      let content: string;
      if (source.startsWith('file:')) {
        const filePath = source.slice(5);
        if (filePath.includes('..') || !isPathAllowed(filePath)) {
          return NextResponse.json({ error: 'Invalid subtitle path' }, { status: 400 });
        }
        content = await toVtt(path.normalize(filePath));
      } else if (source.startsWith('embedded:')) {
        const idx = parseInt(source.slice(9), 10);
        if (isNaN(idx) || idx < 0) {
          return NextResponse.json({ error: 'Invalid stream index' }, { status: 400 });
        }
        content = await extractEmbeddedVtt(normalized, idx);
      } else {
        return NextResponse.json({ error: 'Invalid source type' }, { status: 400 });
      }
      return new Response(content, {
        headers: { 'Content-Type': 'text/vtt; charset=utf-8' },
      });
    } catch (err) {
      console.error('Subtitle serve error:', err);
      return NextResponse.json({ error: 'Failed to serve subtitle' }, { status: 500 });
    }
  }

  // Detect available subtitle tracks for this video
  const dir = path.dirname(normalized);
  const base = path.basename(normalized, path.extname(normalized));

  const tracks: {
    label: string;
    language?: string;
    url: string;
    burnPath: string;
  }[] = [];

  // Sidecar subtitle files alongside the video
  for (const ext of SUBTITLE_EXTENSIONS) {
    const sidecarPath = path.join(dir, base + ext);
    try {
      await fs.access(sidecarPath);
      const src = `file:${sidecarPath}`;
      tracks.push({
        label: `Subtitles (${ext.slice(1).toUpperCase()})`,
        url: `/api/videos/subtitles?path=${encodeURIComponent(videoPath)}&source=${encodeURIComponent(src)}`,
        burnPath: src,
      });
    } catch {
      // file not found, skip
    }
  }

  // Embedded subtitle streams inside the video container
  const embedded = await detectEmbeddedStreams(normalized);
  for (const s of embedded) {
    const src = `embedded:${s.index}`;
    tracks.push({
      label: s.title ?? (s.language ? `Subtitles (${s.language})` : `Subtitles (Track ${s.index + 1})`),
      language: s.language,
      url: `/api/videos/subtitles?path=${encodeURIComponent(videoPath)}&source=${encodeURIComponent(src)}`,
      burnPath: src,
    });
  }

  return NextResponse.json({ tracks });
}
