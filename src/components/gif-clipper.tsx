'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Scissors, Loader2, Upload, Clock } from 'lucide-react';
import { videoConfig } from '@/lib/video-config';
import { TrimBar } from '@/components/trim-bar';

interface VideoFile {
  name: string;
  path: string;
  size: number;
  duration?: number;
}

interface GifClipperProps {
  selectedVideo?: VideoFile;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  onRangeChange?: (start: number, end: number) => void;
}

type Status = 'idle' | 'generating' | 'done' | 'uploading' | 'error';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function parseTimeInput(value: string): number | null {
  const trimmed = value.trim();
  // Accept bare seconds
  if (/^\d+(\.\d+)?$/.test(trimmed)) return parseFloat(trimmed);
  // MM:SS or MM:SS.cc
  const parts = trimmed.split(':');
  if (parts.length === 2) {
    const [m, s] = parts.map(Number);
    if (!isNaN(m) && !isNaN(s)) return m * 60 + s;
  }
  // HH:MM:SS or HH:MM:SS.cc
  if (parts.length === 3) {
    const [h, m, s] = parts.map(Number);
    if (!isNaN(h) && !isNaN(m) && !isNaN(s)) return h * 3600 + m * 60 + s;
  }
  return null;
}

export function GifClipper({ selectedVideo, currentTime, duration, onSeek, onRangeChange }: GifClipperProps) {
  const router = useRouter();
  const [startInput, setStartInput] = useState('00:00.00');
  const [endInput, setEndInput] = useState('00:00.00');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const maxDuration = videoConfig.gif.maxDuration;
  const start = parseTimeInput(startInput) ?? 0;
  const end = parseTimeInput(endInput) ?? 0;

  // Report the resolved clip range to the parent (used by the player to loop)
  useEffect(() => {
    onRangeChange?.(start, end);
  }, [start, end, onRangeChange]);

  if (!selectedVideo) return null;

  const clipDuration = end - start;
  const durationOk = clipDuration > 0 && clipDuration <= maxDuration;
  const durationLabel = clipDuration > 0 ? formatTime(clipDuration) : '—';
  const overLimit = clipDuration > maxDuration;

  // Constrain end so it stays after start and no more than maxDuration past it
  const clampEnd = (endVal: number, startVal: number) => {
    const lo = startVal + 0.1;
    const hi = duration > 0
      ? Math.min(startVal + maxDuration, duration)
      : startVal + maxDuration;
    return Math.min(Math.max(endVal, lo), hi);
  };

  // Start doubles as the scrubber, so it moves freely regardless of the end.
  // (An invalid start ≥ end just disables Generate until the end is adjusted.)
  const applyStart = (t: number) => setStartInput(formatTime(t));
  // Set the end, constrained to stay after start and within maxDuration of it
  const applyEnd = (t: number) => setEndInput(formatTime(clampEnd(t, start)));

  // Called when the start handle on the trim bar is dragged (also seeks the video)
  const handleTrimStartChange = (t: number) => {
    applyStart(t);
    onSeek?.(t);
  };
  const handleTrimEndChange = (t: number) => applyEnd(t);

  const handleSetStart = () => applyStart(currentTime);
  const handleSetEnd = () => applyEnd(currentTime);

  const handleGenerate = async () => {
    if (!durationOk) return;
    setStatus('generating');
    setGifUrl(null);
    setFilename(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/videos/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedVideo.path, start, end }),
      });
      const data = await res.json() as { gifUrl?: string; filename?: string; error?: string };
      if (!res.ok || !data.gifUrl) throw new Error(data.error ?? 'Generation failed');
      setGifUrl(data.gifUrl);
      setFilename(data.filename ?? null);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  const handleUpload = async () => {
    if (!gifUrl || !filename) return;
    setStatus('uploading');
    setErrorMsg(null);

    try {
      // Fetch the generated GIF and wrap as a File for the upload endpoint
      const gifRes = await fetch(gifUrl);
      const blob = await gifRes.blob();
      const file = new File([blob], filename, { type: 'image/gif' });

      const form = new FormData();
      form.append('file', file);
      form.append('title', title.trim() || selectedVideo.name.replace(/\.[^.]+$/, ''));

      const res = await fetch('/api/images/upload', { method: 'POST', body: form });
      const data = await res.json() as { slug?: string; error?: string };
      if (!res.ok || !data.slug) throw new Error(data.error ?? 'Upload failed');

      router.push(`/image/${data.slug}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      setStatus('done'); // back to done so user can retry
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          Clip to GIF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Timeline trim bar */}
        <TrimBar
          duration={duration}
          currentTime={currentTime}
          start={start}
          end={end}
          onStartChange={handleTrimStartChange}
          onEndChange={handleTrimEndChange}
        />

        {/* Time selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Start</label>
            <div className="flex gap-2">
              <Input
                value={startInput}
                onChange={e => setStartInput(e.target.value)}
                onBlur={() => { const t = parseTimeInput(startInput); if (t != null) { applyStart(t); onSeek?.(t); } }}
                className="font-mono text-sm"
                placeholder="00:00.00"
              />
              <Button size="sm" variant="outline" onClick={handleSetStart} title="Set to current position">
                <Clock className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">End</label>
            <div className="flex gap-2">
              <Input
                value={endInput}
                onChange={e => setEndInput(e.target.value)}
                onBlur={() => { const t = parseTimeInput(endInput); if (t != null) applyEnd(t); }}
                className="font-mono text-sm"
                placeholder="00:00.00"
              />
              <Button size="sm" variant="outline" onClick={handleSetEnd} title="Set to current position">
                <Clock className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Duration indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Duration:</span>
          <Badge variant={overLimit ? 'destructive' : clipDuration > 0 ? 'secondary' : 'outline'}>
            {durationLabel}
          </Badge>
          {overLimit && (
            <span className="text-destructive text-xs">
              Max {maxDuration} s
            </span>
          )}
        </div>

        {/* Generate */}
        <Button
          onClick={handleGenerate}
          disabled={!durationOk || status === 'generating' || status === 'uploading'}
          className="w-full"
        >
          {status === 'generating' ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
          ) : (
            <><Scissors className="h-4 w-4 mr-2" />Generate GIF</>
          )}
        </Button>

        {errorMsg && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}

        {/* Preview + upload */}
        {gifUrl && status !== 'generating' && (
          <div className="space-y-4 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Preview</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gifUrl}
              alt="Generated GIF preview"
              className="max-w-full rounded-lg border"
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={selectedVideo.name.replace(/\.[^.]+$/, '')}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={status === 'uploading'}
              className="w-full"
              variant="default"
            >
              {status === 'uploading' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" />Upload to Gallery</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
