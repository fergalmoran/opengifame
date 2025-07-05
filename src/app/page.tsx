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
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Link from "next/link";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

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
        {/* Hero section for empty state or main content */}
        {imagesData.length === 0 ? (
          <div className="text-center py-24">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-pulse" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold gradient-text mb-4">
                  Welcome to OpenGifame
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                  No images uploaded yet. Be the first to share your amazing content with the world!
                </p>
                <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover-lift neon-glow">
                  <Link href="/upload">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload First Image
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Page header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold gradient-text mb-4 animate-float">
                Latest Images
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Discover and share amazing images from our creative community
              </p>
            </div>
            
            {/* Image grid with staggered animations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {imagesData.map((image, index) => (
                <div key={image.id} className={`animate-float stagger-${Math.min((index % 5) + 1, 5)}`}>
                  <ImageCard
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
                </div>
              ))}
            </div>

            {/* Load more section */}
            <div className="text-center mt-16">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse" />
                </div>
                <div className="relative z-10">
                  <Button variant="outline" className="hover-lift neon-border">
                    Load More Images
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error loading homepage:", error);
    
    // Return a fallback UI instead of throwing
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-destructive/10 rounded-lg border border-destructive/20">
          <p className="text-lg text-destructive mb-4">
            Oops! Something went wrong loading the images.
          </p>
          <p className="text-sm text-muted-foreground">
            Please try refreshing the page. If the problem persists, contact support.
          </p>
        </div>
      </div>
    );
  }
}
