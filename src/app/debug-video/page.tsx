'use client';

import { useEffect, useRef, useState } from 'react';

export default function VideoDebugPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  const addDebugMessage = (message: string) => {
    console.log(message);
    setDebugMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => addDebugMessage('loadstart event');
    const handleDurationChange = () => addDebugMessage(`durationchange: ${video.duration} seconds`);
    const handleLoadedMetadata = () => {
      addDebugMessage(`loadedmetadata: duration=${video.duration}s, videoWidth=${video.videoWidth}, videoHeight=${video.videoHeight}`);
    };
    const handleLoadedData = () => addDebugMessage('loadeddata event');
    const handleCanPlay = () => addDebugMessage('canplay event');
    const handleCanPlayThrough = () => addDebugMessage('canplaythrough event');
    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      const error = target.error;
      addDebugMessage(`error: ${error?.message || 'Unknown video error'} (code: ${error?.code})`);
    };
    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime > 0) {
        addDebugMessage(`timeupdate: ${video.currentTime.toFixed(1)}s / ${video.duration.toFixed(1)}s`);
      }
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);

    // Log current state every 5 seconds
    const interval = setInterval(() => {
      if (video.duration && !isNaN(video.duration)) {
        addDebugMessage(`Status: ${video.currentTime.toFixed(1)}s / ${video.duration.toFixed(1)}s (${((video.currentTime / video.duration) * 100).toFixed(1)}%)`);
      } else {
        addDebugMessage(`Status: currentTime=${video.currentTime}, duration=${video.duration}, readyState=${video.readyState}, networkState=${video.networkState}`);
      }
    }, 5000);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Video Duration Debug Test</h1>
      
      <div className="mb-4">
        <video 
          ref={videoRef}
          controls 
          width="800"
          className="border border-gray-300"
        >
          <source src="/uploads/test-10min-video.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Debug Output:</h2>
        <div className="max-h-96 overflow-y-auto">
          {debugMessages.map((message, index) => (
            <div key={index} className="text-sm font-mono mb-1">
              {message}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>This page tests video duration detection for the 10-minute test video.</p>
        <p>Expected duration: 600 seconds (10 minutes)</p>
      </div>
    </div>
  );
}
