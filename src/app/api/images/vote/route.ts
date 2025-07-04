import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { votes, images } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageId, isUpvote } = await request.json();

    if (!imageId || typeof isUpvote !== 'boolean') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Check if user already voted on this image
    const existingVote = await db
      .select()
      .from(votes)
      .where(and(eq(votes.imageId, imageId), eq(votes.userId, session.user.id)))
      .limit(1);

    if (existingVote.length > 0) {
      const currentVote = existingVote[0];
      
      if (currentVote.isUpvote === isUpvote) {
        // Remove vote if clicking the same vote type
        await db
          .delete(votes)
          .where(eq(votes.id, currentVote.id));
      } else {
        // Update vote if changing vote type
        await db
          .update(votes)
          .set({ isUpvote })
          .where(eq(votes.id, currentVote.id));
      }
    } else {
      // Create new vote
      await db.insert(votes).values({
        imageId,
        userId: session.user.id,
        isUpvote,
      });
    }

    // Get updated vote counts
    const allVotes = await db
      .select()
      .from(votes)
      .where(eq(votes.imageId, imageId));

    const upvotes = allVotes.filter(v => v.isUpvote).length;
    const downvotes = allVotes.filter(v => !v.isUpvote).length;

    // Update image vote counts
    await db
      .update(images)
      .set({ upvotes, downvotes })
      .where(eq(images.id, imageId));

    // Get user's current vote
    const userVote = await db
      .select()
      .from(votes)
      .where(and(eq(votes.imageId, imageId), eq(votes.userId, session.user.id)))
      .limit(1);

    return NextResponse.json({
      upvotes,
      downvotes,
      userVote: userVote.length > 0 ? (userVote[0].isUpvote ? 'up' : 'down') : null,
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
