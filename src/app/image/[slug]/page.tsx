import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { images, users, comments, votes, imageTags, tags } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/user-avatar';
import { Comments } from '@/components/comments';
import { EditableTitle } from '@/components/editable-title';
import { EditImageDialog } from '@/components/edit-image-dialog';
import { DeleteImageButton } from '@/components/delete-image-button';
import { VotingButtons } from '@/components/voting-buttons';
import { getServerAuthSession } from '@/lib/server-auth';

interface ImagePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ImagePage({ params }: ImagePageProps) {
  let data: Awaited<ReturnType<typeof loadImagePageData>>;
  try {
    data = await loadImagePageData(params);
  } catch (error) {
    console.error('Error loading image:', error);
    notFound();
  }

  const { image, userVote, imageComments, imageTagList } = data;

  return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <EditableTitle
                imageId={image.id}
                initialTitle={image.title || 'Untitled'}
                imageOwnerId={image.uploadedBy}
              />
              <div className="flex items-center gap-2 shrink-0">
                <EditImageDialog
                  imageId={image.id}
                  imageOwnerId={image.uploadedBy}
                  initialTitle={image.title || ''}
                  initialDescription={image.description || ''}
                  initialTags={imageTagList.map((tag) => tag.name)}
                />
                <DeleteImageButton
                  imageId={image.id}
                  imageOwnerId={image.uploadedBy}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Display with Voting Buttons */}
            <div className="flex items-start gap-6">
              {/* Voting Buttons - Left Side */}
              <div className="flex flex-col items-center space-y-2 pt-4">
                <VotingButtons
                  imageId={image.id}
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
                  className="max-w-full max-h-[80vh] h-auto rounded-lg shadow-lg mx-auto"
                />
              </div>
            </div>

            {/* Uploader */}
            <Link
              href={`/user/${image.uploaderSlug ?? image.uploadedBy}`}
              className="inline-flex items-center gap-3 group w-fit"
            >
              <UserAvatar
                src={image.uploaderImage}
                name={image.uploaderName}
                size={36}
              />
              <span className="text-sm">
                <span className="text-muted-foreground">Uploaded by </span>
                <span className="font-medium group-hover:text-primary transition-colors">
                  {image.uploaderName || 'Anonymous'}
                </span>
              </span>
            </Link>

            {/* Description */}
            {image.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{image.description}</p>
              </div>
            )}

            {/* Tags */}
            {imageTagList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageTagList.map((tag) => (
                  <Badge key={tag.id} variant="secondary" asChild>
                    <Link href={`/tag/${tag.name}`}>#{tag.name}</Link>
                  </Badge>
                ))}
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t pt-6">
              <Comments
                imageId={image.id}
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
}

async function loadImagePageData(params: ImagePageProps['params']) {
  const session = await getServerAuthSession();
  const { slug } = await params;

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
      uploaderImage: users.image,
      uploaderSlug: users.slug,
    })
    .from(images)
    .leftJoin(users, eq(images.uploadedBy, users.id))
    .where(eq(images.slug, slug))
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
      .where(and(eq(votes.imageId, image.id), eq(votes.userId, session.user.id)))
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
    .where(eq(comments.imageId, image.id))
    .orderBy(desc(comments.createdAt));

  // Fetch tags for this image
  const imageTagList = await db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(imageTags)
    .innerJoin(tags, eq(imageTags.tagId, tags.id))
    .where(eq(imageTags.imageId, image.id));

  return { image, userVote, imageComments, imageTagList };
}
