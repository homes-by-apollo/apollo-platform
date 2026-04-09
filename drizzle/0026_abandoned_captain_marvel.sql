CREATE TABLE `floorPlanRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`floorPlanId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(256),
	`phone` varchar(32),
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `floorPlanRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `floorPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`sqft` int NOT NULL,
	`beds` int NOT NULL,
	`baths` varchar(16) NOT NULL,
	`garage` int NOT NULL DEFAULT 2,
	`startingPrice` int,
	`description` text,
	`imageUrl` text,
	`pdfUrl` text,
	`featured` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `floorPlans_id` PRIMARY KEY(`id`),
	CONSTRAINT `floorPlans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `listingAlertSubscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(256),
	`priceMin` int,
	`priceMax` int,
	`alertPropertyType` enum('HOME','LOT','BOTH') DEFAULT 'BOTH',
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`unsubscribedAt` timestamp,
	CONSTRAINT `listingAlertSubscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `listingAlertSubscribers_email_unique` UNIQUE(`email`)
);
