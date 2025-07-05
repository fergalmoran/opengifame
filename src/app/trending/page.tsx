import { db } from "@/lib/db";
import { images, users } from "@/lib/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import { ImageCard } from "@/components/image-card";
import { fetchImageMetadata } from "@/lib/image-utils";
export default async function TrendingPage() {

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
      uploadedBy: users.id,
      uploaderName: users.name,
      uploaderImage: users.image,
      score: sql<number>`${images.upvotes} - ${images.downvotes}`,
    })
    .from(images)
    .leftJoin(users, eq(images.uploadedBy, users.id))
    .where(sql`${images.createdAt} > NOW() - INTERVAL '30 days'`) // Only images from last 30 days
    .orderBy(
      desc(sql`${images.upvotes} - ${images.downvotes}`),
      desc(images.createdAt)
    )
    .limit(20);

  // Fetch metadata for all images
  const { tagsByImage, commentCountMap, userVotes } = await fetchImageMetadata(
    imagesData.map(img => ({
      ...img,
      uploadedBy: img.uploadedBy || "",
      uploaderName: img.uploaderName || "",
      uploaderImage: img.uploaderImage || "",
    }))
  );

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
            No trending images found. Check back later!
          </p>
        </div>
      )}
    </div>
  );
}
