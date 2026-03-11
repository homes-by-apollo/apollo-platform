CREATE TABLE `activityLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`userId` int,
	`activityType` enum('STAGE_CHANGE','NOTE_ADDED','EMAIL_SENT','CALL_LOGGED','FORM_SUBMITTED','TOUR_SCHEDULED','SCORE_UPDATED') NOT NULL,
	`description` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactType` enum('BUYER','AGENT') NOT NULL DEFAULT 'BUYER',
	`firstName` varchar(128) NOT NULL,
	`lastName` varchar(128) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`timeline` enum('ASAP','1_3_MONTHS','3_6_MONTHS','6_12_MONTHS','JUST_BROWSING'),
	`priceRangeMin` int,
	`priceRangeMax` int,
	`financingStatus` enum('PRE_APPROVED','IN_PROCESS','NOT_STARTED','CASH_BUYER'),
	`lenderName` varchar(128),
	`brokerageName` varchar(128),
	`licenseNumber` varchar(64),
	`commissionRate` decimal(5,2),
	`source` enum('WEBSITE','ZILLOW','MLS','REFERRAL','AGENT','BILLBOARD','WALK_IN','OTHER') NOT NULL DEFAULT 'WEBSITE',
	`leadScore` enum('HOT','WARM','COLD'),
	`pipelineStage` enum('NEW_LEAD','CONTACTED','NURTURE','SQL','TOUR_SCHEDULED','TOUR_COMPLETED','PROPOSAL_SENT','CONTRACT_SIGNED','IN_CONSTRUCTION','CLOSED','LOST') NOT NULL DEFAULT 'NEW_LEAD',
	`lossReason` enum('BOUGHT_ELSEWHERE','FINANCING_FAILED','TIMELINE_CHANGED','PRICE_TOO_HIGH','NO_RESPONSE','OTHER'),
	`notes` text,
	`assignedTo` int,
	`referringAgentId` int,
	`tourDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`templateId` varchar(64) NOT NULL,
	`subject` varchar(256) NOT NULL,
	`toEmail` varchar(320) NOT NULL,
	`resendId` varchar(128),
	`status` enum('SENT','DELIVERED','OPENED','CLICKED','BOUNCED','FAILED') NOT NULL DEFAULT 'SENT',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailLog_id` PRIMARY KEY(`id`)
);
