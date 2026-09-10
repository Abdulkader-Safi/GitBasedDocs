ALTER TABLE `sync_logs` ADD `status` text DEFAULT 'synced' NOT NULL;--> statement-breakpoint
-- Older rows never stored a status. A run that moved nothing and logged an
-- error failed; one that moved nothing cleanly was a no-op check.
UPDATE `sync_logs` SET `status` = CASE
  WHEN `added` + `changed` + `removed` = 0 AND `errors` != '' THEN 'error'
  WHEN `added` + `changed` + `removed` = 0 THEN 'unchanged'
  ELSE 'synced'
END;
