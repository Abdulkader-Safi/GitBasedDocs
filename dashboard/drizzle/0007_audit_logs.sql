CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
