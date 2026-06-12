import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { videoConfig } from '@/lib/video-config';

const VIDEO_EXTENSIONS = videoConfig.supportedExtensions;

interface VideoFile {
  name: string;
  path: string;
  size: number;
  duration?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderPath = searchParams.get('path');
    
    if (!folderPath) {
      return NextResponse.json(
        { error: 'Path parameter is required' }, 
        { status: 400 }
      );
    }

    // Security check - prevent directory traversal (check raw input before normalize strips ..)
    if (folderPath.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }
    const normalizedPath = path.normalize(folderPath);

    let files: string[];
    try {
      files = await fs.readdir(normalizedPath);
    } catch (error) {
      console.error('Error reading directory:', error);
      return NextResponse.json(
        { error: 'Directory not found or not accessible' }, 
        { status: 404 }
      );
    }

    const videoFiles: VideoFile[] = [];
    
    for (const file of files) {
      const filePath = path.join(normalizedPath, file);
      const ext = path.extname(file).toLowerCase();
      
      if (VIDEO_EXTENSIONS.includes(ext)) {
        try {
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            videoFiles.push({
              name: file,
              path: filePath,
              size: stats.size,
              // Duration will be determined client-side or via ffprobe
            });
          }
        } catch (error) {
          console.error(`Error getting stats for ${filePath}:`, error);
          // Continue with other files
        }
      }
    }

    // Sort by name
    videoFiles.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ 
      videos: videoFiles,
      count: videoFiles.length 
    });

  } catch (error) {
    console.error('Error in video list API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
