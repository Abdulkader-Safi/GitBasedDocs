-- Assets are downloaded during the diff, but an install already at the repo
-- head stops on "unchanged" and would never fetch them until the next push.
-- Clearing the synced sha makes the next run diff once and backfill them.
UPDATE `repo_connections` SET `last_synced_sha` = NULL;
