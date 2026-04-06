ALTER TABLE `blogPosts` ADD `scheduledPublishAt` timestamp;--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `lastEditedBy` varchar(128);--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `lastEditedAt` timestamp;