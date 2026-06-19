import {NextRequest, NextResponse} from 'next/server';
import {getServerAuthSession} from '@/lib/server-auth';
import {db} from '@/lib/db';
import {comments, users} from '@/lib/db/schema';
import {eq} from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {error: 'Authentication required'},
        {status: 401}
      );
    }

    const {imageId, content} = await request.json();

    if (!imageId || !content?.trim()) {
      return NextResponse.json(
        {error: 'Image ID and content are required'},
        {status: 400}
      );
    }

    // Insert the comment
    const result = await db
      .insert(comments)
      .values({
        content: content.trim(),
        imageId,
        authorId: session.user.id,
      })
      .returning({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
      });

    // Get the author info for the response
    const authorInfo = await db
      .select({
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const commentWithAuthor = {
      ...result[0],
      authorName: authorInfo[0]?.name || null,
      authorEmail: authorInfo[0]?.email || '',
    };

    return NextResponse.json(commentWithAuthor);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      {error: 'Failed to create comment'},
      {status: 500}
    );
  }
}
