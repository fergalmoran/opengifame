CREATE TABLE "account"
(
  "userId"            text NOT NULL,
  "type"              text NOT NULL,
  "provider"          text NOT NULL,
  "providerAccountId" text NOT NULL,
  "refresh_token"     text,
  "access_token"      text,
  "expires_at"        integer,
  "token_type"        text,
  "scope"             text,
  "id_token"          text,
  "session_state"     text,
  CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY ("provider", "providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "comments"
(
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "content"    text                                       NOT NULL,
  "image_id"   uuid                                       NOT NULL,
  "author_id"  text                                       NOT NULL,
  "parent_id"  uuid,
  "created_at" timestamp        DEFAULT now()             NOT NULL,
  "updated_at" timestamp        DEFAULT now()             NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_tags"
(
  "image_id" uuid NOT NULL,
  "tag_id"   uuid NOT NULL,
  CONSTRAINT "image_tags_image_id_tag_id_pk" PRIMARY KEY ("image_id", "tag_id")
);
--> statement-breakpoint
CREATE TABLE "images"
(
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title"         text                                       NOT NULL,
  "description"   text,
  "filename"      text                                       NOT NULL,
  "original_name" text                                       NOT NULL,
  "mime_type"     text                                       NOT NULL,
  "size"          integer                                    NOT NULL,
  "url"           text                                       NOT NULL,
  "uploaded_by"   text                                       NOT NULL,
  "upvotes"       integer          DEFAULT 0                 NOT NULL,
  "downvotes"     integer          DEFAULT 0                 NOT NULL,
  "created_at"    timestamp        DEFAULT now()             NOT NULL,
  "updated_at"    timestamp        DEFAULT now()             NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session"
(
  "sessionToken" text PRIMARY KEY NOT NULL,
  "userId"       text             NOT NULL,
  "expires"      timestamp        NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags"
(
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name"       text                                       NOT NULL,
  "created_by" text                                       NOT NULL,
  "created_at" timestamp        DEFAULT now()             NOT NULL,
  CONSTRAINT "tags_name_unique" UNIQUE ("name")
);
--> statement-breakpoint
CREATE TABLE "user"
(
  "id"            text PRIMARY KEY NOT NULL,
  "name"          text,
  "email"         text             NOT NULL,
  "emailVerified" timestamp,
  "image"         text
);
--> statement-breakpoint
CREATE TABLE "verificationToken"
(
  "identifier" text      NOT NULL,
  "token"      text      NOT NULL,
  "expires"    timestamp NOT NULL,
  CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY ("identifier", "token")
);
--> statement-breakpoint
CREATE TABLE "votes"
(
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "image_id"   uuid                                       NOT NULL,
  "user_id"    text                                       NOT NULL,
  "is_upvote"  boolean                                    NOT NULL,
  "created_at" timestamp        DEFAULT now()             NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account"
  ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments"
  ADD CONSTRAINT "comments_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments"
  ADD CONSTRAINT "comments_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments"
  ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_tags"
  ADD CONSTRAINT "image_tags_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_tags"
  ADD CONSTRAINT "image_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images"
  ADD CONSTRAINT "images_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session"
  ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags"
  ADD CONSTRAINT "tags_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes"
  ADD CONSTRAINT "votes_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes"
  ADD CONSTRAINT "votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;