'use client';

import { useState } from 'react';
import { VideoPlayer } from '@/components/video-player';
import { VideoList } from '@/components/video-list';

interface VideoFile {
  name: string;
  path: string;
  size: number;
  duration?: number;
}

export default function VideosPage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | undefined>();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Video Player</h1>
        <p className="text-muted-foreground">
          Select a video from your collection and play it in the browser.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <VideoList onVideoSelect={setSelectedVideo} />
        </div>
        <div className="lg:col-span-2">
          <VideoPlayer selectedVideo={selectedVideo} />
        </div>
      </div>
    </div>
  );
}
