import { db } from '@/lib/db';
import { images, users, imageTags, tags, votes, comments } from '@/lib/db/schema';
import { desc, sql, eq, inArray } from 'drizzle-orm';
import { ImageCard } from '@/components/image-card';
import { auth } from '@/lib/auth';

export default async function TrendingPage() {
  const session = await auth();
  
  // Get trending images based on score (upvotes - downvotes) and recent activity
  const imagesData = await db
    .select({
      id: images.id,
      title: images.title,
      description: images.description,
      url: images.url,
      upvotes: images.upvotes,
      downvotes: images.downvotes,
      createdAt: images.createdAt,
      uploadedBy: {
        name: users.name,
        image: users.image,
      },
      score: sql<number>`${images.upvotes} - ${images.downvotes}`,
    })
    .from(images)
    .leftJoin(users, eq(images.uploadedBy, users.id))
    .where(sql`${images.createdAt} > NOW() - INTERVAL '30 days'`) // Only images from last 30 days
    .orderBy(desc(sql`${images.upvotes} - ${images.downvotes}`), desc(images.createdAt))
    .limit(20);

  // Get tags for each image
  const imageIds = imagesData.map(img => img.id);
  
  let imageTags_data: Array<{
    imageId: string;
    tag: { id: string; name: string } | null;
  }> = [];
  
  if (imageIds.length > 0) {
    imageTags_data = await db
      .select({
        imageId: imageTags.imageId,
        tag: {
          id: tags.id,
          name: tags.name,
        },
      })
      .from(imageTags)
      .leftJoin(tags, eq(imageTags.tagId, tags.id))
      .where(inArray(imageTags.imageId, imageIds));
  }

  // Get user votes if logged in
  let userVotes: Record<string, 'up' | 'down'> = {};
  if (session?.user?.id && imageIds.length > 0) {
    const userVotesData = await db
      .select({
        imageId: votes.imageId,
        isUpvote: votes.isUpvote,
      })
      .from(votes)
      .where(eq(votes.userId, session.user.id));
    
    const filteredVotes = userVotesData.filter(vote => imageIds.includes(vote.imageId));
    
    userVotes = filteredVotes.reduce((acc: Record<string, 'up' | 'down'>, vote: { imageId: string; isUpvote: boolean }) => {
      acc[vote.imageId] = vote.isUpvote ? 'up' : 'down';
      return acc;
    }, {});
  }

  // Get comment counts
  let commentCounts: Array<{ imageId: string; count: number }> = [];
  if (imageIds.length > 0) {
    commentCounts = await db
      .select({
        imageId: comments.imageId,
        count: sql<number>`count(*)`,
      })
      .from(comments)
      .where(inArray(comments.imageId, imageIds))
      .groupBy(comments.imageId);
  }

  const commentCountMap = commentCounts.reduce((acc: Record<string, number>, { imageId, count }: { imageId: string; count: number }) => {
    acc[imageId] = count;
    return acc;
  }, {});

  // Group tags by image
  const tagsByImage = imageTags_data.reduce((acc: Record<string, Array<{ id: string; name: string }>>, item) => {
    if (!acc[item.imageId]) acc[item.imageId] = [];
    if (item.tag) {
      acc[item.imageId].push(item.tag);
    }
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Trending Images</h1>
        <p className="text-muted-foreground">
          The hottest images from the last 30 days based on community votes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {imagesData.map((image) => (
          <ImageCard
            key={image.id}
            id={image.id}
            title={image.title}
            description={image.description || undefined}
            url={image.url}
            upvotes={image.upvotes}
            downvotes={image.downvotes}
            createdAt={image.createdAt}
            uploadedBy={{
              name: image.uploadedBy?.name || undefined,
              image: image.uploadedBy?.image || undefined,
            }}
            tags={tagsByImage[image.id] || []}
            userVote={userVotes[image.id] || null}
            commentCount={commentCountMap[image.id] || 0}
          />
        ))}
      </div>

      {imagesData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            No trending images found. Check back later!
          </p>
        </div>
      )}
    </div>
  );
}
