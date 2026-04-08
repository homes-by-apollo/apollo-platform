CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`title` varchar(256) NOT NULL DEFAULT 'Purchase Agreement',
	`purchasePrice` int,
	`lotAddress` varchar(512),
	`contractDate` timestamp,
	`contractStatus` enum('PENDING','EXECUTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
