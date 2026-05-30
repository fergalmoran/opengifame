# Video Player Feature

This feature allows you to play video files in the browser.

## Features

- Browse video files from a specified directory
- Play videos with custom controls
- Support for standard browser-compatible video formats

## Setup

The video feature requires no additional dependencies beyond the base Next.js application.

## Usage

1. Navigate to `/videos` in your application
2. Enter the path to your video directory (default: `/mnt/storage/media/tv/Frasier/Season 1/`)
3. Click "Load Videos" to scan for video files
4. Select a video from the list to load it in the player
5. Use the video controls to play the video

## Supported Video Formats

For optimal browser compatibility:

- MP4 (.mp4) - Recommended
- WebM (.webm)
- M4V (.m4v)

Other formats may work depending on browser support:
- AVI (.avi)
- MKV (.mkv)
- MOV (.mov)
- WMV (.wmv)
- FLV (.flv)

## Configuration

You can modify the default video directory by editing the `currentPath` state in `src/components/video-list.tsx`.

For production, ensure your video directory is accessible by the Next.js server process.

## Security Notes

- The system includes path traversal protection
- Only video files with supported extensions are listed
- File access is restricted to prevent unauthorized file system access

## Performance

- Videos are served directly as static files for optimal performance
- No server-side transcoding or processing overhead

## Advanced Video Processing

For advanced needs like format conversion, streaming, or GIF generation, consider implementing a separate microservice rather than handling it within the main application.
