CREATE TABLE `lotAnalysisRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`lotAddress` varchar(512),
	`apn` varchar(64),
	`goals` text,
	`timeline` varchar(64),
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lotAnalysisRequests_id` PRIMARY KEY(`id`)
);
