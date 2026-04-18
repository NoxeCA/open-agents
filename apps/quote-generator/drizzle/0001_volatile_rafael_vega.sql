ALTER TABLE "quote_files" ADD COLUMN "media_type" text;--> statement-breakpoint
ALTER TABLE "quote_files" ADD COLUMN "analysis" jsonb;--> statement-breakpoint
ALTER TABLE "quote_files" ADD COLUMN "analyzed_at" timestamp;
--> statement-breakpoint
UPDATE "quote_files"
SET "media_type" = CASE
  WHEN "kind" = 'excel' THEN 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  WHEN "kind" = 'pdf' THEN 'application/pdf'
  ELSE 'application/octet-stream'
END
WHERE "media_type" IS NULL;
--> statement-breakpoint
ALTER TABLE "quote_files" ALTER COLUMN "media_type" SET NOT NULL;
