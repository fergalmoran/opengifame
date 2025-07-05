import { ImageCard } from "@/components/image-card";
import { db } from "@/lib/db";
import { images, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { fetchImageMetadata } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Link from "next/link";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
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
        uploadedBy: images.uploadedBy,
        uploaderName: users.name,
        uploaderImage: users.image,
      })
      .from(images)
      .leftJoin(users, eq(images.uploadedBy, users.id))
      .orderBy(desc(images.createdAt))
      .limit(20);

    // Fetch metadata for all images
    const { tagsByImage, commentCountMap, userVotes } = await fetchImageMetadata(imagesData);

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Hero section for empty state or main content */}
        {imagesData.length === 0 ? (
          <div className="text-center py-24">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                Welcome to OpenGifame
              </h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                No images uploaded yet. Be the first to share your amazing content with the world!
              </p>
              <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                <Link href="/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload First Image
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Page header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Latest Images
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Discover and share amazing images from our creative community
              </p>
            </div>
            
            {/* Image grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

            {/* Load more section */}
            <div className="text-center mt-16">
              <Button variant="outline">
                Load More Images
              </Button>
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
