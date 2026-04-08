CREATE TABLE `emailSequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`trigger` varchar(256) NOT NULL,
	`emailCount` int NOT NULL DEFAULT 1,
	`window` varchar(64) NOT NULL DEFAULT '7 days',
	`goal` varchar(256),
	`seqStatus` enum('active','draft','paused') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailSequences_id` PRIMARY KEY(`id`)
);
