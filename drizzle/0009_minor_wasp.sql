CREATE TABLE `scopsTeam` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('super_admin','admin','member') NOT NULL DEFAULT 'member',
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scopsTeam_id` PRIMARY KEY(`id`),
	CONSTRAINT `scopsTeam_email_unique` UNIQUE(`email`)
);
