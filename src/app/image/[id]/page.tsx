import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { images, users, comments } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Comments } from '@/components/comments';
import { EditableTitle } from '@/components/editable-title';

interface ImagePageProps {
  params: {
    id: string;
  };
}

export default async function ImagePage({ params }: ImagePageProps) {
  try {
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
      .where(eq(images.id, params.id))
      .limit(1);

    if (imageResult.length === 0) {
      notFound();
    }

    const image = imageResult[0];

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
      .where(eq(comments.imageId, params.id))
      .orderBy(desc(comments.createdAt));

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <EditableTitle 
              imageId={params.id}
              initialTitle={image.title || 'Untitled'}
              imageOwnerId={image.uploadedBy}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Display */}
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.title || 'Uploaded image'}
                className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                style={{ maxHeight: '80vh' }}
              />
            </div>

            {/* Description */}
            {image.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{image.description}</p>
              </div>
            )}

            {/* Vote counts */}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>👍 {image.upvotes} upvotes</span>
              <span>👎 {image.downvotes} downvotes</span>
            </div>

            {/* Comments Section */}
            <div className="border-t pt-6">
              <Comments 
                imageId={params.id} 
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
