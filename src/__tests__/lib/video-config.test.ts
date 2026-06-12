import { describe, test, expect } from 'bun:test';
import { getMimeType, getDefaultVideoPath, videoConfig } from '@/lib/video-config';

describe('getMimeType', () => {
  test('.mp4 → video/mp4', () => {
    expect(getMimeType('.mp4')).toBe('video/mp4');
  });

  test('.webm → video/webm', () => {
    expect(getMimeType('.webm')).toBe('video/webm');
  });

  test('.mkv → video/x-matroska', () => {
    expect(getMimeType('.mkv')).toBe('video/x-matroska');
  });

  test('.avi → video/x-msvideo', () => {
    expect(getMimeType('.avi')).toBe('video/x-msvideo');
  });

  test('.m4v falls back to video/mp4', () => {
    expect(getMimeType('.m4v')).toBe('video/mp4');
  });

  test('unknown extension falls back to video/mp4', () => {
    expect(getMimeType('.xyz')).toBe('video/mp4');
  });

  test('empty extension falls back to video/mp4', () => {
    expect(getMimeType('')).toBe('video/mp4');
  });
});

describe('getDefaultVideoPath', () => {
  test('returns a non-empty string', () => {
    expect(getDefaultVideoPath().length).toBeGreaterThan(0);
  });
});

describe('videoConfig', () => {
  test('supportedExtensions includes common video formats', () => {
    const exts = videoConfig.supportedExtensions;
    expect(exts).toContain('.mp4');
    expect(exts).toContain('.avi');
    expect(exts).toContain('.mkv');
    expect(exts).toContain('.webm');
  });

  test('streaming chunk size is a positive number', () => {
    expect(videoConfig.streaming.chunkSize).toBeGreaterThan(0);
  });

  test('gif maxDuration is positive', () => {
    expect(videoConfig.gif.maxDuration).toBeGreaterThan(0);
  });
});
