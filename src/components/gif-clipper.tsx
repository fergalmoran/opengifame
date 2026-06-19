'use client';

import {useEffect, useId, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Checkbox} from '@/components/ui/checkbox';
import {Clock, Loader2, Plus, Scissors, Trash2, Upload} from 'lucide-react';
import {videoConfig} from '@/lib/video-config';
import {TrimBar} from '@/components/trim-bar';
import type {SubtitleTrack} from '@/components/video-player';

interface VideoFile {
  name: string;
  path: string;
  size: number;
  duration?: number;
}

interface CustomCaption {
  id: string;
  start: string;
  end: string;
  text: string;
}

interface GifClipperProps {
  selectedVideo?: VideoFile;
  subtitleTracks?: SubtitleTrack[];
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
  if (/^\d+(\.\d+)?$/.test(trimmed)) return parseFloat(trimmed);
  const parts = trimmed.split(':');
  if (parts.length === 2) {
    const [m, s] = parts.map(Number);
    if (!isNaN(m) && !isNaN(s)) return m * 60 + s;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts.map(Number);
    if (!isNaN(h) && !isNaN(m) && !isNaN(s)) return h * 3600 + m * 60 + s;
  }
  return null;
}

let captionIdCounter = 0;
function newCaption(clipStart = 0, clipEnd = 2): CustomCaption {
  return {
    id: String(++captionIdCounter),
    start: formatTime(clipStart),
    end: formatTime(Math.min(clipEnd, clipStart + 2)),
    text: '',
  };
}

export function GifClipper({
  selectedVideo,
  subtitleTracks = [],
  currentTime,
  duration,
  onSeek,
  onRangeChange,
}: GifClipperProps) {
  const router = useRouter();
  const captionLabelId = useId();
  const [startInput, setStartInput] = useState('00:00.00');
  const [endInput, setEndInput] = useState('00:00.00');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputMime, setOutputMime] = useState<string>('image/gif');
  const [filename, setFilename] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [includeSubs, setIncludeSubs] = useState(false);
  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const [includeAudio, setIncludeAudio] = useState(false);
  const [captions, setCaptions] = useState<CustomCaption[]>([]);
  const [previewTime, setPreviewTime] = useState(0);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const hasSubtitles = subtitleTracks.length > 0;
  const maxDuration = videoConfig.gif.maxDuration;
  const start = parseTimeInput(startInput) ?? 0;
  const end = parseTimeInput(endInput) ?? 0;
  const clipDuration = end - start;

  useEffect(() => {
    onRangeChange?.(start, end);
  }, [start, end, onRangeChange]);

  // For GIF previews there's no timeupdate event, so simulate the clock
  useEffect(() => {
    if (outputMime !== 'image/gif' || !outputUrl || clipDuration <= 0) return;
    setPreviewTime(0);
    const t0 = Date.now();
    const id = setInterval(() => {
      setPreviewTime(((Date.now() - t0) / 1000) % clipDuration);
    }, 50);
    return () => clearInterval(id);
  }, [outputUrl, outputMime, clipDuration]);

  if (!selectedVideo) return null;

  const durationOk = clipDuration > 0 && clipDuration <= maxDuration;
  const durationLabel = clipDuration > 0 ? formatTime(clipDuration) : '—';
  const overLimit = clipDuration > maxDuration;

  const clampEnd = (endVal: number, startVal: number) => {
    const lo = startVal + 0.1;
    const hi = duration > 0 ? Math.min(startVal + maxDuration, duration) : startVal + maxDuration;
    return Math.min(Math.max(endVal, lo), hi);
  };

  const applyStart = (t: number) => setStartInput(formatTime(t));
  const applyEnd = (t: number) => setEndInput(formatTime(clampEnd(t, start)));

  const handleTrimStartChange = (t: number) => { applyStart(t); onSeek?.(t); };
  const handleTrimEndChange = (t: number) => applyEnd(t);
  const handleSetStart = () => applyStart(currentTime);
  const handleSetEnd = () => applyEnd(currentTime);

  const addCaption = () => setCaptions(prev => [...prev, newCaption(0, Math.min(2, clipDuration))]);
  const removeCaption = (id: string) => setCaptions(prev => prev.filter(c => c.id !== id));
  const updateCaption = (id: string, field: keyof Omit<CustomCaption, 'id'>, value: string) =>
    setCaptions(prev => prev.map(c => c.id === id ? {...c, [field]: value} : c));

  const outputLabel = includeAudio ? 'MP4' : 'GIF';

  const handleGenerate = async () => {
    if (!durationOk) return;
    setStatus('generating');
    setOutputUrl(null);
    setFilename(null);
    setErrorMsg(null);

    const subtitleBurnPath =
      includeSubs && hasSubtitles ? subtitleTracks[activeSubIndex].burnPath : undefined;

    const captionsPayload = captions
      .map(c => ({
        start: parseTimeInput(c.start) ?? 0,
        end: parseTimeInput(c.end) ?? 0,
        text: c.text,
      }))
      .filter(c => c.text.trim() && c.end > c.start);

    try {
      const res = await fetch('/api/videos/clip', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          path: selectedVideo.path,
          start,
          end,
          includeAudio,
          subtitleBurnPath,
          captions: captionsPayload,
        }),
      });
      const data = await res.json() as {gifUrl?: string; filename?: string; mimeType?: string; error?: string};
      if (!res.ok || !data.gifUrl) throw new Error(data.error ?? 'Generation failed');
      setOutputUrl(data.gifUrl);
      setOutputMime(data.mimeType ?? 'image/gif');
      setFilename(data.filename ?? null);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  const handleUpload = async () => {
    if (!outputUrl || !filename) return;
    setStatus('uploading');
    setErrorMsg(null);
    try {
      const fileRes = await fetch(outputUrl);
      const blob = await fileRes.blob();
      const file = new File([blob], filename, {type: outputMime});
      const form = new FormData();
      form.append('file', file);
      form.append('title', title.trim() || selectedVideo.name.replace(/\.[^.]+$/, ''));
      const res = await fetch('/api/images/upload', {method: 'POST', body: form});
      const data = await res.json() as {slug?: string; error?: string};
      if (!res.ok || !data.slug) throw new Error(data.error ?? 'Upload failed');
      router.push(`/image/${data.slug}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      setStatus('done');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5"/>
          Clip to {outputLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        <TrimBar
          duration={duration}
          currentTime={currentTime}
          start={start}
          end={end}
          onStartChange={handleTrimStartChange}
          onEndChange={handleTrimEndChange}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Start</label>
            <div className="flex gap-2">
              <Input
                value={startInput}
                onChange={e => setStartInput(e.target.value)}
                onBlur={() => {
                  const t = parseTimeInput(startInput);
                  if (t != null) { applyStart(t); onSeek?.(t); }
                }}
                className="font-mono text-sm"
                placeholder="00:00.00"
              />
              <Button size="sm" variant="outline" onClick={handleSetStart} title="Set to current position">
                <Clock className="h-4 w-4"/>
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">End</label>
            <div className="flex gap-2">
              <Input
                value={endInput}
                onChange={e => setEndInput(e.target.value)}
                onBlur={() => {
                  const t = parseTimeInput(endInput);
                  if (t != null) applyEnd(t);
                }}
                className="font-mono text-sm"
                placeholder="00:00.00"
              />
              <Button size="sm" variant="outline" onClick={handleSetEnd} title="Set to current position">
                <Clock className="h-4 w-4"/>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Duration:</span>
          <Badge variant={overLimit ? 'destructive' : clipDuration > 0 ? 'secondary' : 'outline'}>
            {durationLabel}
          </Badge>
          {overLimit && <span className="text-destructive text-xs">Max {maxDuration} s</span>}
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <p className="text-sm font-medium">Output options</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={includeAudio} onCheckedChange={v => setIncludeAudio(v === true)}/>
            <span className="text-sm">
              Include audio <span className="text-muted-foreground">(produces MP4 instead of GIF)</span>
            </span>
          </label>
          <label className={`flex items-center gap-3 ${hasSubtitles ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
            <Checkbox
              checked={includeSubs && hasSubtitles}
              disabled={!hasSubtitles}
              onCheckedChange={v => setIncludeSubs(v === true)}
            />
            <span className="text-sm">
              Burn in subtitles
              {!hasSubtitles && <span className="text-muted-foreground"> (no subtitles found)</span>}
            </span>
          </label>
          {includeSubs && hasSubtitles && subtitleTracks.length > 1 && (
            <div className="pl-7">
              <select
                className="text-xs border rounded px-2 py-1 bg-background w-full"
                title="Select subtitle track to burn in"
                value={activeSubIndex}
                onChange={e => setActiveSubIndex(Number(e.target.value))}
              >
                {subtitleTracks.map((t, i) => (
                  <option key={t.burnPath} value={i}>{t.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!durationOk || status === 'generating' || status === 'uploading'}
          className="w-full"
        >
          {status === 'generating' ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Generating…</>
          ) : (
            <><Scissors className="h-4 w-4 mr-2"/>Generate {outputLabel}</>
          )}
        </Button>

        {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

        {/* Preview + caption editor side by side */}
        {outputUrl && status !== 'generating' && (
          <div className="pt-2 border-t">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* Left column: preview + title + upload */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Preview</p>

                {/* Preview with live caption overlay */}
                {(() => {
                  const activeCaptions = captions.filter(c => {
                    const s = parseTimeInput(c.start) ?? 0;
                    const e = parseTimeInput(c.end) ?? 0;
                    return c.text.trim() && e > s && previewTime >= s && previewTime < e;
                  });
                  return (
                    <div className="relative rounded-lg border overflow-hidden bg-black">
                      {outputMime === 'video/mp4' ? (
                        <video
                          ref={previewVideoRef}
                          src={outputUrl}
                          controls
                          className="w-full"
                          onTimeUpdate={() => setPreviewTime(previewVideoRef.current?.currentTime ?? 0)}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={outputUrl} alt="Generated GIF preview" className="w-full"/>
                      )}
                      {activeCaptions.map(c => (
                        <div
                          key={c.id}
                          className="absolute bottom-6 left-0 right-0 flex justify-center px-3 pointer-events-none"
                        >
                          <span className="caption-overlay text-center">
                            {c.text.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={selectedVideo.name.replace(/\.[^.]+$/, '')}
                  />
                </div>
                <Button onClick={handleUpload} disabled={status === 'uploading'} className="w-full">
                  {status === 'uploading' ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Uploading…</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2"/>Upload to Gallery</>
                  )}
                </Button>
              </div>

              {/* Right column: custom caption editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p id={captionLabelId} className="text-sm font-medium">
                    Captions
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      burned in on next generate
                    </span>
                  </p>
                  <Button size="sm" variant="outline" onClick={addCaption}>
                    <Plus className="h-3 w-3 mr-1"/>Add
                  </Button>
                </div>

                {captions.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      No captions yet. Add one to overlay bold text on the clip.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="grid grid-cols-[5rem_5rem_1fr_2rem] gap-1 px-1">
                      <span className="text-xs font-medium text-muted-foreground"></span>
                      <span className="text-xs font-medium text-muted-foreground">End</span>
                      <span className="text-xs font-medium text-muted-foreground">Text</span>
                    </div>
                    {captions.map(cap => (
                      <div key={cap.id} className="grid grid-cols-[5rem_5rem_1fr_2rem] gap-1 items-center">
                        <Input
                          value={cap.start}
                          onChange={e => updateCaption(cap.id, 'start', e.target.value)}
                          className="font-mono text-xs h-7 px-2"
                          placeholder="00:00"
                          aria-label="Caption start time"
                        />
                        <Input
                          value={cap.end}
                          onChange={e => updateCaption(cap.id, 'end', e.target.value)}
                          className="font-mono text-xs h-7 px-2"
                          placeholder="00:02"
                          aria-label="Caption end time"
                        />
                        <Input
                          value={cap.text}
                          onChange={e => updateCaption(cap.id, 'text', e.target.value)}
                          className="text-xs h-7 px-2"
                          placeholder="Caption text…"
                          aria-label="Caption text"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeCaption(cap.id)}
                          aria-label="Remove caption"
                        >
                          <Trash2 className="h-3 w-3"/>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Times are relative to clip start (0 = first frame).
                  Text is displayed in uppercase with a bold white outline — giphy style.
                  Click <strong>Generate {outputLabel}</strong> above to apply.
                </p>
              </div>

            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
