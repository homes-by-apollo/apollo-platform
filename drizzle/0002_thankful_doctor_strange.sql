CREATE TABLE `newsletterSubscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`source` varchar(64) NOT NULL DEFAULT 'footer',
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletterSubscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletterSubscribers_email_unique` UNIQUE(`email`)
);
