CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`propertyId` int,
	`stage` enum('OFFER_SUBMITTED','UNDER_CONTRACT','CLOSED','LOST') NOT NULL DEFAULT 'OFFER_SUBMITTED',
	`amount` int,
	`expectedCloseDate` timestamp,
	`actualCloseDate` timestamp,
	`notes` text,
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadPropertyInterest` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`propertyId` int NOT NULL,
	`interestLevel` enum('VIEWED','SAVED','TOURED') NOT NULL DEFAULT 'VIEWED',
	`viewCount` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leadPropertyInterest_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contacts` MODIFY COLUMN `pipelineStage` enum('NEW_INQUIRY','QUALIFIED','TOUR_SCHEDULED','TOURED','OFFER_SUBMITTED','UNDER_CONTRACT','CLOSED','LOST') NOT NULL DEFAULT 'NEW_INQUIRY';--> statement-breakpoint
ALTER TABLE `contacts` ADD `primaryPropertyId` int;--> statement-breakpoint
ALTER TABLE `contacts` ADD `lastContactedAt` timestamp;--> statement-breakpoint
ALTER TABLE `contacts` ADD `nextAction` varchar(256);