import {env} from '@/env';

function resolveMaxGifDuration(): number {
  return env.NEXT_PUBLIC_GIF_MAX_DURATION;
}

// Video processing configuration
export const videoConfig = {
  // Default video directory paths
  defaultPaths: {
    development: '/srv/dev/opengifame/opengifame/public/uploads',
    production: '/mnt/storage/media/tv/Frasier/Season 1/',
  },

  // Supported video file extensions
  supportedExtensions: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'] as string[],

  // Video conversion settings for browser compatibility
  conversion: {
    targetHeight: 480, // Convert to 480p for optimal streaming
    videoBitrate: '800k', // Lower bitrate for smaller file size
    audioBitrate: '128k', // Lower audio bitrate
    codec: 'libx264', // H.264 codec for maximum compatibility
    audioCodec: 'aac', // AAC audio for web compatibility
    preset: 'fast', // Fast encoding preset
    crf: 28, // Constant rate factor for good quality/size balance
  },

  // GIF generation settings
  gif: {
    defaultWidth: 480,
    defaultFps: 10,
    maxWidth: 1024,
    maxFps: 30,
    maxDuration: resolveMaxGifDuration(), // seconds — override with NEXT_PUBLIC_GIF_MAX_DURATION
  },

  // Video streaming settings
  streaming: {
    chunkSize: 1024 * 1024, // 1MB chunks
    supportedMimeTypes: {
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.m4v': 'video/mp4',
    },
  },
} as const;

export function getDefaultVideoPath(): string {
  // Always use the Frasier directory as requested
  return '/mnt/storage/media/tv/Frasier/Season 1/';
}

export function getMimeType(extension: string): string {
  return videoConfig.streaming.supportedMimeTypes[extension as keyof typeof videoConfig.streaming.supportedMimeTypes] || 'video/mp4';
}
