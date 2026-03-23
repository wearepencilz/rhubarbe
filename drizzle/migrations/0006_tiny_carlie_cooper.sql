CREATE TABLE "news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" text,
	"title" text,
	"content" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"date" text,
	"time" text,
	"guests" text,
	"event_type" text,
	"delivery" text,
	"address" text,
	"notes" text,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" text,
	"slug" text,
	"title" jsonb,
	"subtitle" jsonb,
	"content" jsonb,
	"category" text,
	"tags" jsonb,
	"cover_image" text,
	"status" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "news_legacy_id_idx" ON "news" USING btree ("legacy_id");--> statement-breakpoint
CREATE INDEX "requests_type_idx" ON "requests" USING btree ("type");--> statement-breakpoint
CREATE INDEX "requests_status_idx" ON "requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stories_slug_idx" ON "stories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "stories_status_idx" ON "stories" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stories_category_idx" ON "stories" USING btree ("category");