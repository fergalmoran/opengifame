import {createHash} from 'crypto';
import {mkdirSync, readdirSync} from 'fs';
import {ChildProcess, spawn} from 'child_process';
import path from 'path';
import os from 'os';

export interface HlsEntry {
  outputDir: string;
  process: ChildProcess | null;
  done: boolean;
  error?: string;
}

// Module-level cache survives across requests within the same Next.js server process.
const cache = new Map<string, HlsEntry>();

const BASE_TEMP_DIR = path.join(os.tmpdir(), 'opengifame-hls');

export function hlsOutputDir(filePath: string): string {
  const hash = createHash('md5').update(filePath).digest('hex');
  return path.join(BASE_TEMP_DIR, hash);
}

export function readySegmentCount(outputDir: string): number {
  try {
    return readdirSync(outputDir).filter(f => f.endsWith('.ts')).length;
  } catch {
    return 0;
  }
}

export function getOrStartHls(filePath: string): HlsEntry {
  const existing = cache.get(filePath);
  if (existing) return existing;

  const outputDir = hlsOutputDir(filePath);
  mkdirSync(outputDir, {recursive: true});

  const entry: HlsEntry = {outputDir, process: null, done: false};
  cache.set(filePath, entry);

  const proc = spawn('ffmpeg', [
    '-i', filePath,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '28',
    '-vf', 'scale=-2:480',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-hls_time', '4',            // 4-second segments — short enough for smooth seeking
    '-hls_list_size', '0',       // keep all segments (enables backward seeks)
    '-hls_segment_filename', path.join(outputDir, 'segment%04d.ts'),
    path.join(outputDir, 'playlist.m3u8'),
  ]);

  entry.process = proc;

  proc.stderr.on('data', () => { /* suppress ffmpeg noise */
  });

  proc.on('close', (code) => {
    entry.done = true;
    entry.process = null;
    if (code !== 0 && code !== null) entry.error = `ffmpeg exited with code ${code}`;
  });

  return entry;
}
