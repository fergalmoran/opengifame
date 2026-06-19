-- slug on user was applied via db:push; guard so this migration is safe either way.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "slug" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "permissions" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_slug_unique'
  ) THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_slug_unique" UNIQUE("slug");
  END IF;
END $$;
