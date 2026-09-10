ALTER TABLE `doc_pages` ADD `last_commit_sha` text;--> statement-breakpoint
ALTER TABLE `doc_pages` ADD `last_commit_author` text;--> statement-breakpoint
ALTER TABLE `doc_pages` ADD `last_commit_at` integer;--> statement-breakpoint
ALTER TABLE `doc_pages` ADD `last_commit_message` text DEFAULT '' NOT NULL;--> statement-breakpoint
-- Existing pages have no commit yet. Forget their blob shas so the next sync
-- fetches each once more and records who changed it last.
UPDATE `doc_pages` SET `blob_sha` = NULL;--> statement-breakpoint
UPDATE `repo_connections` SET `last_synced_sha` = NULL;
