PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_repo_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`repo` text NOT NULL,
	`branch` text DEFAULT 'main' NOT NULL,
	`docs_root` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'connected' NOT NULL,
	`last_synced_sha` text,
	`last_checked_at` integer,
	`last_error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_repo_connections`("id", "owner", "repo", "branch", "docs_root", "status", "last_synced_sha", "last_checked_at", "last_error", "created_at", "updated_at") SELECT "id", "owner", "repo", "branch", "docs_root", "status", "last_synced_sha", "last_checked_at", "last_error", "created_at", "updated_at" FROM `repo_connections`;--> statement-breakpoint
DROP TABLE `repo_connections`;--> statement-breakpoint
ALTER TABLE `__new_repo_connections` RENAME TO `repo_connections`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `doc_pages` ADD `content` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `doc_pages` ADD `description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `doc_pages` ADD `size` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Pages indexed before `content` existed have an empty body. Clearing the
-- blob sha makes the next sync refetch every page, and clearing the head sha
-- makes sure that sync actually diffs instead of stopping on "unchanged".
UPDATE `doc_pages` SET `blob_sha` = NULL;--> statement-breakpoint
UPDATE `repo_connections` SET `last_synced_sha` = NULL;
