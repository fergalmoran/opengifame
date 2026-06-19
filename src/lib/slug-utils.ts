import {db} from '@/lib/db';
import {images, users} from '@/lib/db/schema';
import {eq} from 'drizzle-orm';

/**
 * Convert arbitrary text into a lowercase, URL-safe slug,
 * e.g. "Our Vivacious Horse!" -> "our-vivacious-horse".
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics become hyphens
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

async function slugExists(slug: string): Promise<boolean> {
  const existing = await db
    .select({id: images.id})
    .from(images)
    .where(eq(images.slug, slug))
    .limit(1);
  return existing.length > 0;
}

/**
 * Build a slug from a title that is guaranteed unique across the images
 * table by appending an incrementing suffix on collision
 * (e.g. "happy-cat", "happy-cat-2", "happy-cat-3").
 */
export async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || 'image';
  let slug = base;
  let counter = 2;

  while (await slugExists(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}

async function userSlugExists(slug: string): Promise<boolean> {
  const existing = await db
    .select({id: users.id})
    .from(users)
    .where(eq(users.slug, slug))
    .limit(1);
  return existing.length > 0;
}

/**
 * Build a URL-safe slug from a display name that is guaranteed unique
 * across the users table (e.g. "jane-doe", "jane-doe-2").
 */
export async function generateUniqueUserSlug(name: string): Promise<string> {
  const base = slugify(name) || 'user';
  let slug = base;
  let counter = 2;

  while (await userSlugExists(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}
