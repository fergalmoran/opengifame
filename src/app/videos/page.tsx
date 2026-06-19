'use client';

import {useCallback, useState} from 'react';
import {VideoPlayer} from '@/components/video-player';
import type {SubtitleTrack} from '@/components/video-player';
import {VideoList} from '@/components/video-list';
import {GifClipper} from '@/components/gif-clipper';

interface VideoFile {
  name: string;
  path: string;
  size: number;
  duration?: number;
}

export default function VideosPage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | undefined>();
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(0);

  const handleVideoSelect = useCallback(async (video: VideoFile) => {
    setSelectedVideo(video);
    setSubtitleTracks([]);
    try {
      const res = await fetch(`/api/videos/subtitles?path=${encodeURIComponent(video.path)}`);
      if (res.ok) {
        const data = await res.json() as {tracks?: SubtitleTrack[]};
        setSubtitleTracks(data.tracks ?? []);
      }
    } catch {
      // subtitle detection failure is non-fatal
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Video Player</h1>
        <p className="text-muted-foreground">
          Select a video, scrub to your clip start and end points, then generate and upload a GIF or MP4.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <VideoList onVideoSelect={handleVideoSelect}/>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <VideoPlayer
            selectedVideo={selectedVideo}
            subtitleTracks={subtitleTracks}
            onTimeChange={setCurrentTime}
            onDurationChange={setDuration}
            seekTo={seekTarget}
            loopStart={clipStart}
            loopEnd={clipEnd}
          />
          <GifClipper
            selectedVideo={selectedVideo}
            subtitleTracks={subtitleTracks}
            currentTime={currentTime}
            duration={duration}
            onSeek={setSeekTarget}
            onRangeChange={(s, e) => {
              setClipStart(s);
              setClipEnd(e);
            }}
          />
        </div>
      </div>
    </div>
  );
}
