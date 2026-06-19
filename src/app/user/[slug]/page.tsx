import {notFound} from 'next/navigation';
import {db} from '@/lib/db';
import {images, users} from '@/lib/db/schema';
import {desc, eq, or} from 'drizzle-orm';
import {UserAvatar} from '@/components/user-avatar';
import {ImageCard} from '@/components/image-card';
import {EditProfileDialog} from '@/components/edit-profile-dialog';
import {fetchImageMetadata} from '@/lib/image-utils';
import {getServerAuthSession} from '@/lib/server-auth';

interface ProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Force dynamic rendering so vote/comment state stays fresh
export const dynamic = 'force-dynamic';

export default async function ProfilePage({params}: ProfilePageProps) {
  const {slug} = await params;
  const session = await getServerAuthSession();

  // Support both slug-based URLs (new) and id-based URLs (legacy links) transparently.
  const userResult = await db
    .select({
      id: users.id,
      slug: users.slug,
      name: users.name,
      image: users.image,
      bio: users.bio,
    })
    .from(users)
    .where(or(eq(users.slug, slug), eq(users.id, slug)))
    .limit(1);

  if (userResult.length === 0) {
    notFound();
  }

  const profile = userResult[0];
  const isOwnProfile = session?.user?.id === profile.id;

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
    .from(images)
    .leftJoin(users, eq(images.uploadedBy, users.id))
    .where(eq(images.uploadedBy, profile.id))
    .orderBy(desc(images.createdAt))
    .limit(50);

  const {tagsByImage, commentCountMap, userVotes} =
    await fetchImageMetadata(imagesData);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-start gap-6 mb-10">
        <UserAvatar src={profile.image} name={profile.name} size={96}/>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold">{profile.name || 'Anonymous'}</h1>
            {isOwnProfile && (
              <EditProfileDialog
                initialName={profile.name || ''}
                initialBio={profile.bio || ''}
                initialImage={profile.image || ''}
              />
            )}
          </div>
          {profile.bio ? (
            <p className="text-muted-foreground mt-2 whitespace-pre-line">
              {profile.bio}
            </p>
          ) : (
            isOwnProfile && (
              <p className="text-muted-foreground mt-2 italic">
                You haven&apos;t added a bio yet.
              </p>
            )
          )}
          {profile.slug && (
            <p className="text-sm text-muted-foreground mt-1">@{profile.slug}</p>
          )}
          <p className="text-sm text-muted-foreground mt-3">
            {imagesData.length} image{imagesData.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Image grid */}
      {imagesData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            {isOwnProfile
              ? "You haven't uploaded any images yet."
              : 'No images uploaded yet.'}
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
