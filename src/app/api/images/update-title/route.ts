import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/server-auth';
import { db } from '@/lib/db';
import { images } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { imageId, title } = await request.json();

    if (!imageId || !title?.trim()) {
      return NextResponse.json(
        { error: 'Image ID and title are required' },
        { status: 400 }
      );
    }

    // Update the title only if the user owns the image
    const result = await db
      .update(images)
      .set({
        title: title.trim(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(images.id, imageId),
          eq(images.uploadedBy, session.user.id)
        )
      )
      .returning({
        id: images.id,
        title: images.title,
      });

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Image not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, title: result[0].title });
  } catch (error) {
    console.error('Error updating title:', error);
    return NextResponse.json(
      { error: 'Failed to update title' },
      { status: 500 }
    );
  }
}
