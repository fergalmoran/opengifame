'use client';

import { useState, useRef, useEffect } from 'react';
import path from 'path';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  FileVideo
} from 'lucide-react';

interface VideoFile {
  name: string;
  path: string;
  size: number;
  duration?: number;
}

interface VideoPlayerProps {
  selectedVideo?: VideoFile;
}

export function VideoPlayer({ selectedVideo }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedVideo && videoRef.current) {
      setVideoError(null);
      
      // Serve videos directly from uploads directory
      const videoUrl = `/uploads/${encodeURIComponent(path.basename(selectedVideo.path))}`;
      console.log('Loading video from:', videoUrl);
      
      videoRef.current.src = videoUrl;
    }
  }, [selectedVideo]);

  const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('Video error:', event);
    const video = videoRef.current;
    if (video) {
      console.error('Video error details:', {
        error: video.error,
        networkState: video.networkState,
        readyState: video.readyState,
        currentSrc: video.currentSrc
      });
    }
    setVideoError('Video playback failed. Please try another video file.');
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      console.log('Video loaded successfully:', {
        duration: duration,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight,
        currentSrc: videoRef.current.currentSrc
      });
      setDuration(duration);
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
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
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
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-auto max-h-96"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={handleVideoError}
              controls={false}
            />
            {videoError && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                <div className="text-center text-white space-y-2">
                  <FileVideo className="h-12 w-12 mx-auto text-destructive" />
                  <div className="text-sm font-medium">Video Playback Failed</div>
                  <div className="text-xs text-white/70 max-w-sm">
                    {videoError}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Video Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button onClick={handlePlayPause} size="sm">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button onClick={handleStop} size="sm" variant="outline">
                <Square className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <Badge variant="secondary">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
