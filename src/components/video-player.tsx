'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type HlsType from 'hls.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, FileVideo, Loader2 } from 'lucide-react';

interface VideoFile {
  name: string;
  path: string;
  size: number;
  duration?: number;
}

interface VideoPlayerProps {
  selectedVideo?: VideoFile;
}

type LoadState = 'idle' | 'preparing' | 'ready' | 'error';

export function VideoPlayer({ selectedVideo }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [videoError, setVideoError] = useState<string | null>(null);

  const destroyHls = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
  }, []);

  useEffect(() => {
    if (!selectedVideo) return;

    destroyHls();
    setVideoError(null);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setLoadState('preparing');

    let cancelled = false;
    const encodedPath = encodeURIComponent(selectedVideo.path);

    const init = async () => {
      // Poll until ffmpeg has produced at least 2 segments (~8 s of video)
      while (!cancelled) {
        const res = await fetch(`/api/videos/hls?path=${encodedPath}`);
        const data = await res.json() as { ready: boolean; error?: string };
        if (data.error) throw new Error(data.error);
        if (data.ready) break;
        await new Promise(r => setTimeout(r, 500));
      }

      if (cancelled) return;

      // Fetch real duration from ffprobe (stream has no duration metadata)
      fetch(`/api/videos/info?path=${encodedPath}`)
        .then(r => r.json())
        .then((d: { duration?: number }) => { if (!cancelled && d.duration) setDuration(d.duration); })
        .catch(console.error);

      const video = videoRef.current;
      if (!video) return;

      const playlistUrl = `/api/videos/hls/segment?path=${encodedPath}&file=playlist.m3u8`;
      const Hls = (await import('hls.js')).default;

      if (cancelled) return;

      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, backBufferLength: 90 });
        hlsRef.current = hls;
        hls.loadSource(playlistUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!cancelled) setLoadState('ready');
        });
        hls.on(Hls.Events.ERROR, (_, d) => {
          if (d.fatal && !cancelled) {
            setVideoError('HLS playback error — try reloading');
            setLoadState('error');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = playlistUrl;
        setLoadState('ready');
      } else {
        throw new Error('HLS is not supported in this browser');
      }
    };

    init().catch(err => {
      if (!cancelled) {
        setVideoError(String(err));
        setLoadState('error');
      }
    });

    return () => {
      cancelled = true;
      destroyHls();
    };
  }, [selectedVideo, destroyHls]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play();
  };

  const handleStop = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleLoadedMetadata = () => {
    const reported = videoRef.current?.duration;
    if (reported && isFinite(reported) && reported > 0) {
      setDuration(d => d || reported);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!selectedVideo) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <FileVideo className="h-16 w-16 mx-auto text-muted-foreground" />
            <div className="text-lg font-medium">Select a video to get started</div>
            <div className="text-sm text-muted-foreground">
              Choose a video from the list to create animated GIFs
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isReady = loadState === 'ready';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            {selectedVideo.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden min-h-48">
            <video
              ref={videoRef}
              className="w-full h-auto max-h-96"
              onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {loadState === 'preparing' && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="text-center text-white space-y-3">
                  <Loader2 className="h-10 w-10 mx-auto animate-spin" />
                  <div className="text-sm font-medium">Preparing video…</div>
                  <div className="text-xs text-white/60">Transcoding first segments</div>
                </div>
              </div>
            )}
            {loadState === 'error' && videoError && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                <div className="text-center text-white space-y-2">
                  <FileVideo className="h-12 w-12 mx-auto text-destructive" />
                  <div className="text-sm font-medium">Playback Failed</div>
                  <div className="text-xs text-white/70 max-w-sm">{videoError}</div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* Seek bar — full width, above controls for easy scrubbing */}
            <input
              type="range"
              aria-label="Video seek"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full accent-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!isReady}
            />

            <div className="flex items-center gap-3">
              <Button onClick={handlePlayPause} size="sm" disabled={!isReady}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button onClick={handleStop} size="sm" variant="outline" disabled={!isReady}>
                <Square className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="ml-auto tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
