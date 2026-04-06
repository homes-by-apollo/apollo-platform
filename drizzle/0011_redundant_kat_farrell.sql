ALTER TABLE `blogPosts` ADD `slug` varchar(320);--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `author` varchar(128) DEFAULT 'Apollo Home Builders';--> statement-breakpoint
ALTER TABLE `blogPosts` ADD CONSTRAINT `blogPosts_slug_unique` UNIQUE(`slug`);