-- Pages stored before comment stripping still hold their %% comments, which
-- search would match. Forget the blob shas so the next sync fetches every
-- page again and stores it without them.
UPDATE `doc_pages` SET `blob_sha` = NULL;--> statement-breakpoint
UPDATE `repo_connections` SET `last_synced_sha` = NULL;
