CREATE TABLE `emailCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listId` int NOT NULL,
	`subject` varchar(256) NOT NULL,
	`previewText` varchar(256),
	`fromName` varchar(128) DEFAULT 'Apollo Home Builders',
	`fromEmail` varchar(320) DEFAULT 'hello@apollohomebuilders.com',
	`htmlBody` text NOT NULL,
	`templateType` enum('campaign_blast','new_lead_welcome','tour_reminder','custom') NOT NULL DEFAULT 'campaign_blast',
	`campaignStatus` enum('draft','scheduled','sending','sent','cancelled') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`totalRecipients` int DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailListMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listId` int NOT NULL,
	`contactId` int,
	`email` varchar(320) NOT NULL,
	`name` varchar(256),
	`source` varchar(64) DEFAULT 'manual',
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailListMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailLists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`isDefault` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailLists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(256),
	`resendMessageId` varchar(128),
	`sendStatus` enum('queued','sent','delivered','opened','clicked','bounced','failed','unsubscribed') NOT NULL DEFAULT 'queued',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`bouncedAt` timestamp,
	`failureReason` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailSends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailUnsubscribes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`listId` int,
	`campaignId` int,
	`reason` varchar(256),
	`unsubscribedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailUnsubscribes_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailUnsubscribes_email_unique` UNIQUE(`email`)
);
