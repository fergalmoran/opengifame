import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { images, users, comments, votes } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Comments } from '@/components/comments';
import { EditableTitle } from '@/components/editable-title';
import { VotingButtons } from '@/components/voting-buttons';
import { getServerAuthSession } from '@/lib/server-auth';

interface ImagePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ImagePage({ params }: ImagePageProps) {
  try {
    const session = await getServerAuthSession();
    const { id } = await params;
    
    const imageResult = await db
      .select({
        id: images.id,
        title: images.title,
        description: images.description,
        url: images.url,
        originalName: images.originalName,
        upvotes: images.upvotes,
        downvotes: images.downvotes,
        createdAt: images.createdAt,
        uploadedBy: images.uploadedBy,
        uploaderName: users.name,
        uploaderEmail: users.email,
      })
      .from(images)
      .leftJoin(users, eq(images.uploadedBy, users.id))
      .where(eq(images.id, id))
      .limit(1);

    if (imageResult.length === 0) {
      notFound();
    }

    const image = imageResult[0];

    // Get user's current vote if authenticated
    let userVote: 'up' | 'down' | null = null;
    if (session?.user?.id) {
      const userVoteResult = await db
        .select({
          isUpvote: votes.isUpvote,
        })
        .from(votes)
        .where(and(eq(votes.imageId, id), eq(votes.userId, session.user.id)))
        .limit(1);

      if (userVoteResult.length > 0) {
        userVote = userVoteResult[0].isUpvote ? 'up' : 'down';
      }
    }

    // Fetch comments for this image
    const imageComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        authorName: users.name,
        authorEmail: users.email,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.imageId, id))
      .orderBy(desc(comments.createdAt));

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <EditableTitle 
              imageId={id}
              initialTitle={image.title || 'Untitled'}
              imageOwnerId={image.uploadedBy}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Display with Voting Buttons */}
            <div className="flex items-start gap-6">
              {/* Voting Buttons - Left Side */}
              <div className="flex flex-col items-center space-y-2 pt-4">
                <VotingButtons
                  imageId={id}
                  initialUpvotes={image.upvotes}
                  initialDownvotes={image.downvotes}
                  initialUserVote={userVote}
                  layout="vertical"
                />
              </div>
              
              {/* Image - Center */}
              <div className="flex-1 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.title || 'Uploaded image'}
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                  style={{ maxHeight: '80vh' }}
                />
              </div>
            </div>

            {/* Description */}
            {image.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{image.description}</p>
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t pt-6">
              <Comments 
                imageId={id} 
                initialComments={imageComments.map(comment => ({
                  id: comment.id,
                  content: comment.content,
                  authorName: comment.authorName,
                  authorEmail: comment.authorEmail || '',
                  createdAt: comment.createdAt.toISOString(),
                }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error loading image:', error);
    notFound();
  }
}
