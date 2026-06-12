import { db } from "@/lib/db";
import { images, users, imageTags, tags } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { ImageCard } from "@/components/image-card";
import { fetchImageMetadata } from "@/lib/image-utils";

interface TagPageProps {
  params: Promise<{
    name: string;
  }>;
}

// Force dynamic rendering so vote/comment state stays fresh
export const dynamic = "force-dynamic";

export default async function TagPage({ params }: TagPageProps) {
  const { name } = await params;
  const tagName = decodeURIComponent(name).toLowerCase();

  const imagesData = await db
    .select({
      id: images.id,
      slug: images.slug,
      title: images.title,
      description: images.description,
      url: images.url,
      upvotes: images.upvotes,
      downvotes: images.downvotes,
      createdAt: images.createdAt,
      uploadedBy: images.uploadedBy,
      uploaderName: users.name,
      uploaderImage: users.image,
      uploaderSlug: users.slug,
    })
    .from(imageTags)
    .innerJoin(tags, eq(imageTags.tagId, tags.id))
    .innerJoin(images, eq(imageTags.imageId, images.id))
    .leftJoin(users, eq(images.uploadedBy, users.id))
    .where(eq(tags.name, tagName))
    .orderBy(desc(images.createdAt))
    .limit(50);

  const { tagsByImage, commentCountMap, userVotes } =
    await fetchImageMetadata(imagesData);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">#{tagName}</h1>
        <p className="text-muted-foreground">
          {imagesData.length} image{imagesData.length === 1 ? "" : "s"} tagged
          with #{tagName}
        </p>
      </div>

      {imagesData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            No images found for #{tagName}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imagesData.map((image) => (
            <ImageCard
              key={image.id}
              id={image.id}
              slug={image.slug}
              title={image.title}
              description={image.description || undefined}
              url={image.url}
              upvotes={image.upvotes}
              downvotes={image.downvotes}
              createdAt={image.createdAt}
              uploadedBy={{
                id: image.uploadedBy,
                slug: image.uploaderSlug || undefined,
                name: image.uploaderName || undefined,
                image: image.uploaderImage || undefined,
              }}
              tags={tagsByImage[image.id] || []}
              userVote={userVotes[image.id] || null}
              commentCount={commentCountMap[image.id] || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
