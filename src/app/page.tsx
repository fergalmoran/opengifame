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
  let imagesData: Awaited<ReturnType<typeof loadHomepageImages>>["imagesData"];
  let tagsByImage: Awaited<ReturnType<typeof loadHomepageImages>>["tagsByImage"];
  let commentCountMap: Awaited<ReturnType<typeof loadHomepageImages>>["commentCountMap"];
  let userVotes: Awaited<ReturnType<typeof loadHomepageImages>>["userVotes"];

  try {
    ({ imagesData, tagsByImage, commentCountMap, userVotes } = await loadHomepageImages());
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

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Hero section for empty state or main content */}
        {imagesData.length === 0 ? (
          <div className="text-center py-24 relative">
            <div className="space-y-8 relative z-10">
              <div className="animate-float">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-bg-shift bg-[length:400%_400%]">
                  Welcome to OpenGifame
                </h2>
              </div>
              <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
                No images uploaded yet. Be the first to share your amazing content with the world! 🚀
              </p>
              <div className="flex justify-center">
                <Button asChild className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white font-bold px-8 py-4 text-lg rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 animate-pulse-glow relative overflow-hidden group">
                  <Link href="/upload">
                    <Upload className="mr-3 h-5 w-5 group-hover:animate-bounce" />
                    Upload First Image
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-float"></div>
              <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-pink-500/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
              <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
            </div>
          </div>
        ) : (
          <>
            {/* Page header */}
            <div className="text-center mb-12 relative">
              <div className="space-y-4 relative z-10">
                <div className="animate-float">
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-bg-shift bg-[length:400%_400%] mb-4">
                    Latest Images
                  </h1>
                </div>
                <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
                  Discover and share amazing images from our creative community ✨
                </p>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-24 h-24 bg-purple-500/5 rounded-full blur-xl animate-float"></div>
                <div className="absolute top-0 right-1/4 w-32 h-32 bg-pink-500/5 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>
              </div>
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
              <Button variant="outline" className="px-8 py-3 text-lg font-medium hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group relative overflow-hidden">
                Load More Images
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              </Button>
            </div>
          </>
        )}
      </div>
    );
}

async function loadHomepageImages() {
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

  return { imagesData, tagsByImage, commentCountMap, userVotes };
}
