import { ImageCard } from "@/components/image-card";
import { getServerAuthSession } from "@/lib/server-auth";
import { db } from "@/lib/db";
import {
  images,
  users,
  imageTags,
  tags,
  votes,
  comments,
} from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";

export default async function Home() {
  try {
    const session = await getServerAuthSession();

    // Get images with related data
    const imagesData = await db
      .select({
        id: images.id,
        title: images.title,
        description: images.description,
        url: images.url,
        upvotes: images.upvotes,
        downvotes: images.downvotes,
        createdAt: images.createdAt,
        uploaderName: users.name,
        uploaderImage: users.image,
      })
      .from(images)
      .leftJoin(users, eq(images.uploadedBy, users.id))
      .orderBy(desc(images.createdAt))
      .limit(20);

    // Get tags for each image
    const imageIds = imagesData.map((img) => img.id);

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
    let userVotes: Record<string, "up" | "down"> = {};
    if (session?.user?.id && imageIds.length > 0) {
      const userVotesData = await db
        .select({
          imageId: votes.imageId,
          isUpvote: votes.isUpvote,
        })
        .from(votes)
        .where(eq(votes.userId, session.user.id));

      const filteredVotes = userVotesData.filter((vote) =>
        imageIds.includes(vote.imageId)
      );

      userVotes = filteredVotes.reduce(
        (
          acc: Record<string, "up" | "down">,
          vote: { imageId: string; isUpvote: boolean }
        ) => {
          acc[vote.imageId] = vote.isUpvote ? "up" : "down";
          return acc;
        },
        {}
      );
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

    const commentCountMap = commentCounts.reduce(
      (
        acc: Record<string, number>,
        { imageId, count }: { imageId: string; count: number }
      ) => {
        acc[imageId] = count;
        return acc;
      },
      {}
    );

    // Group tags by image
    const tagsByImage = imageTags_data.reduce(
      (acc: Record<string, Array<{ id: string; name: string }>>, item) => {
        if (!acc[item.imageId]) acc[item.imageId] = [];
        if (item.tag) {
          acc[item.imageId].push(item.tag);
        }
        return acc;
      },
      {}
    );

    return (
      <div className="container mx-auto px-4 py-8">
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
                name: image.uploaderName || undefined,
                image: image.uploaderImage || undefined,
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
              No images uploaded yet. Be the first to share!
            </p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error loading homepage:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            Unable to load images. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
