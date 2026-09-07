CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`body` text NOT NULL,
	`movie` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_messages_sender` ON `messages` (`sender`,`created`);--> statement-breakpoint
CREATE INDEX `idx_messages_recipient` ON `messages` (`recipient`,`created`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`movie_id` integer NOT NULL,
	`movie` text NOT NULL,
	`body` text NOT NULL,
	`rating` integer NOT NULL,
	`verdict` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_reviews_created` ON `reviews` (`created`);--> statement-breakpoint
CREATE TABLE `watchlist` (
	`user_id` text NOT NULL,
	`movie_id` integer NOT NULL,
	`movie` text NOT NULL,
	PRIMARY KEY(`user_id`, `movie_id`)
);
