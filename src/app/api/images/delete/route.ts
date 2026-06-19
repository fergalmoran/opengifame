import {NextRequest, NextResponse} from 'next/server';
import {getServerAuthSession} from '@/lib/server-auth';
import {db} from '@/lib/db';
import {images} from '@/lib/db/schema';
import {and, eq} from 'drizzle-orm';
import {unlink} from 'fs/promises';
import {join} from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {error: 'Authentication required'},
        {status: 401}
      );
    }

    const {imageId} = await request.json();

    if (!imageId) {
      return NextResponse.json(
        {error: 'Image ID is required'},
        {status: 400}
      );
    }

    // Delete the image only if the user owns it. Related rows (votes,
    // comments, image_tags) are removed via ON DELETE CASCADE.
    const result = await db
      .delete(images)
      .where(
        and(
          eq(images.id, imageId),
          eq(images.uploadedBy, session.user.id)
        )
      )
      .returning({
        id: images.id,
        filename: images.filename,
      });

    if (result.length === 0) {
      return NextResponse.json(
        {error: 'Image not found or you do not have permission to delete it'},
        {status: 404}
      );
    }

    // Best-effort removal of the file from disk; don't fail the request if
    // the file is already gone.
    try {
      const filepath = join(process.cwd(), 'public', 'uploads', result[0].filename);
      await unlink(filepath);
    } catch (fileError) {
      console.error('Failed to delete image file:', fileError);
    }

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      {error: 'Failed to delete image'},
      {status: 500}
    );
  }
}
