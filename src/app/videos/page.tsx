'use client';

import { useState } from 'react';
import { VideoPlayer } from '@/components/video-player';
import { VideoList } from '@/components/video-list';
import { GifClipper } from '@/components/gif-clipper';

interface VideoFile {
  name: string;
  path: string;
  size: number;
  duration?: number;
}

export default function VideosPage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | undefined>();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Video Player</h1>
        <p className="text-muted-foreground">
          Select a video, scrub to your clip start and end points, then generate and upload a GIF.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <VideoList onVideoSelect={setSelectedVideo} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <VideoPlayer
            selectedVideo={selectedVideo}
            onTimeChange={setCurrentTime}
            onDurationChange={setDuration}
            seekTo={seekTarget}
            loopStart={clipStart}
            loopEnd={clipEnd}
          />
          <GifClipper
            selectedVideo={selectedVideo}
            currentTime={currentTime}
            duration={duration}
            onSeek={setSeekTarget}
            onRangeChange={(s, e) => { setClipStart(s); setClipEnd(e); }}
          />
        </div>
      </div>
    </div>
  );
}
