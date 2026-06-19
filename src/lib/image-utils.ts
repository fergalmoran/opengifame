import {db} from '@/lib/db';
import {comments, imageTags, tags, votes} from '@/lib/db/schema';
import {and, eq, inArray, sql} from 'drizzle-orm';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';

export interface ImageWithMetadata {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  uploadedBy: string;
  uploaderName?: string | null;
  uploaderImage?: string | null;
}

export interface ImageTag {
  id: string;
  name: string;
}

export interface ProcessedImageData {
  images: ImageWithMetadata[];
  tagsByImage: Record<string, ImageTag[]>;
  commentCountMap: Record<string, number>;
  userVotes: Record<string, 'up' | 'down'>;
}

/**
 * Processes comment counts data into a map
 */
export function processCommentCounts(
  commentCounts: Array<{ imageId: string; count: number }>
): Record<string, number> {
  return commentCounts.reduce(
    (acc: Record<string, number>, {imageId, count}) => {
      acc[imageId] = count;
      return acc;
    },
    {}
  );
}

/**
 * Groups tags by image ID
 */
export function groupTagsByImage(
  imageTags_data: Array<{
    imageId: string;
    tag?: { id: string; name: string } | null;
  }>
): Record<string, ImageTag[]> {
  return imageTags_data.reduce(
    (acc: Record<string, Array<{ id: string; name: string }>>, item) => {
      if (!acc[item.imageId]) acc[item.imageId] = [];
      if (item.tag) {
        acc[item.imageId].push(item.tag);
      }
      return acc;
    },
    {}
  );
}

/**
 * Processes user votes data into a map
 */
export function processUserVotes(
  userVotes_data: Array<{ imageId: string; isUpvote: boolean }>
): Record<string, 'up' | 'down'> {
  return userVotes_data.reduce(
    (acc: Record<string, 'up' | 'down'>, item) => {
      acc[item.imageId] = item.isUpvote ? 'up' : 'down';
      return acc;
    },
    {}
  );
}

/**
 * Fetches user votes for given image IDs
 */
export async function fetchUserVotes(
  imageIds: string[]
): Promise<Record<string, 'up' | 'down'>> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || imageIds.length === 0) {
    return {};
  }

  const userVotes_data = await db
    .select({
      imageId: votes.imageId,
      isUpvote: votes.isUpvote,
    })
    .from(votes)
    .where(and(eq(votes.userId, session.user.id), inArray(votes.imageId, imageIds)));

  return processUserVotes(userVotes_data);
}

/**
 * Fetches comment counts for given image IDs
 */
export async function fetchCommentCounts(
  imageIds: string[]
): Promise<Record<string, number>> {
  if (imageIds.length === 0) {
    return {};
  }

  const commentCounts = await db
    .select({
      imageId: comments.imageId,
      count: sql<number>`count(*)`,
    })
    .from(comments)
    .where(inArray(comments.imageId, imageIds))
    .groupBy(comments.imageId);

  return processCommentCounts(commentCounts);
}

/**
 * Fetches tags for given image IDs
 */
export async function fetchImageTags(
  imageIds: string[]
): Promise<Record<string, ImageTag[]>> {
  if (imageIds.length === 0) {
    return {};
  }

  const imageTags_data = await db
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

  return groupTagsByImage(imageTags_data);
}

/**
 * Fetches all metadata for images (tags, comments, votes)
 */
export async function fetchImageMetadata(
  images: ImageWithMetadata[]
): Promise<Omit<ProcessedImageData, 'images'>> {
  const imageIds = images.map((img) => img.id);

  const [tagsByImage, commentCountMap, userVotes] = await Promise.all([
    fetchImageTags(imageIds),
    fetchCommentCounts(imageIds),
    fetchUserVotes(imageIds),
  ]);

  return {
    tagsByImage,
    commentCountMap,
    userVotes,
  };
}
