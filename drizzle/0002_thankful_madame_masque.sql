-- Add slug as nullable first so existing rows can be backfilled.
ALTER TABLE "images" ADD COLUMN "slug" text;--> statement-breakpoint

-- Backfill existing rows: slugify the title and append a short id fragment
-- to guarantee uniqueness. Falls back to "image" when the title slugifies
-- to an empty string.
UPDATE "images"
SET "slug" = COALESCE(
    NULLIF(trim(both '-' from regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g')), ''),
    'image'
  ) || '-' || substr("id"::text, 1, 8);--> statement-breakpoint

-- Now enforce the constraints.
ALTER TABLE "images" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_slug_unique" UNIQUE("slug");
