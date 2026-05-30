'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, Play, Video } from 'lucide-react';
import { getDefaultVideoPath } from '@/lib/video-config';

interface VideoFile {
  name: string;
  path: string;
  size: number;
  duration?: number;
}

interface VideoListProps {
  onVideoSelect?: (video: VideoFile) => void;
}

export function VideoList({ onVideoSelect }: VideoListProps) {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [currentPath, setCurrentPath] = useState(getDefaultVideoPath());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/videos/list?path=${encodeURIComponent(currentPath)}`);
      
      if (!response.ok) {
        throw new Error('Failed to load videos');
      }
      
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  // Auto-load videos when component mounts
  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleVideoSelect = (video: VideoFile) => {
    onVideoSelect?.(video);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Video Files
        </CardTitle>
        <div className="space-y-2">
          <Input
            value={currentPath}
            onChange={(e) => setCurrentPath(e.target.value)}
            placeholder="Enter video folder path..."
            className="text-sm"
          />
          <Button onClick={loadVideos} size="sm" className="w-full">
            Load Videos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && (
          <div className="text-center py-4 text-muted-foreground">
            Loading videos...
          </div>
        )}
        
        {error && (
          <div className="text-center py-4 text-destructive text-sm">
            {error}
          </div>
        )}
        
        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No video files found in this directory
          </div>
        )}
        
        {videos.map((video, index) => (
          <Card key={index} className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-3" onClick={() => handleVideoSelect(video)}>
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 mt-0.5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" title={video.name}>
                    {video.name}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Size: {formatFileSize(video.size)}</div>
                    {video.duration && (
                      <div>Duration: {formatDuration(video.duration)}</div>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
