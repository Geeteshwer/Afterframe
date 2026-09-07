ALTER TABLE `reviews` ADD `liked` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_reviews_user_movie` ON `reviews` (`user_id`,`movie_id`);