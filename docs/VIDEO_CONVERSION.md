# Video Feature

## Overview

OpenGifame provides basic video functionality for playing videos in the browser. The system serves videos directly from the uploads directory for browser playback.

## Current Features

### Direct Video Serving

- Videos are served directly from the `/uploads/` directory
- No server-side transcoding or format conversion
- Browser native video support required

### Supported Input Formats

For best browser compatibility, upload videos in these formats:

- MP4 (H.264/AAC) - Recommended
- WebM (VP8/VP9)
- OGV (Theora/Vorbis)

## API Endpoints

The video system uses this endpoint:

1. **`/api/videos/list`**: List available video files

## Usage

### For Users

1. Upload videos in browser-compatible formats (MP4 recommended)
2. Select videos from the video list
3. Use the video player to preview content

### For Developers

Videos are served as static files from the uploads directory. The video player component loads videos directly using standard HTML5 video elements.

## Future Considerations

For advanced video processing needs (format conversion, streaming, transcoding, GIF generation, etc.), consider implementing a separate microservice dedicated to video processing rather than handling it within the main application.

## Performance

- Direct file serving provides optimal performance for compatible formats
- No server-side processing overhead for video playback

## Error Handling

The system handles:

- Missing or corrupted video files
- Unsupported browser formats
