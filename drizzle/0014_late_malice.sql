ALTER TABLE `leadPropertyInterest` MODIFY COLUMN `interestLevel` enum('INQUIRED','VIEWED','SAVED','TOURED') NOT NULL DEFAULT 'INQUIRED';--> statement-breakpoint
ALTER TABLE `contacts` ADD `nextActionDueAt` timestamp;--> statement-breakpoint
ALTER TABLE `leadPropertyInterest` ADD `isPrimaryInterest` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `leadPropertyInterest` ADD `rankOrder` int DEFAULT 0;