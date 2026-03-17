CREATE TABLE `aiInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`insightType` enum('risk_analysis','recommendations','market_summary','diversification') NOT NULL,
	`content` json NOT NULL,
	`riskLevel` enum('low','medium','high'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `aiInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`assetType` enum('stock','crypto','etf','commodity','bond') NOT NULL,
	`quantity` decimal(18,8) NOT NULL,
	`averageCost` decimal(15,2) NOT NULL,
	`currentPrice` decimal(15,2) NOT NULL,
	`totalValue` decimal(15,2) NOT NULL,
	`gainLoss` decimal(15,2) DEFAULT '0',
	`gainLossPercentage` decimal(10,2) DEFAULT '0',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`currentPrice` decimal(15,2) NOT NULL,
	`dayHigh` decimal(15,2),
	`dayLow` decimal(15,2),
	`dayChange` decimal(10,2),
	`dayChangePercent` decimal(10,2),
	`marketCap` decimal(20,2),
	`volume` decimal(20,0),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketData_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketData_symbol_unique` UNIQUE(`symbol`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('price_alert','milestone','portfolio_update','social','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedData` json,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('live','practice') NOT NULL DEFAULT 'live',
	`initialBalance` decimal(15,2) NOT NULL,
	`currentBalance` decimal(15,2) NOT NULL,
	`totalInvested` decimal(15,2) DEFAULT '0',
	`totalGain` decimal(15,2) DEFAULT '0',
	`gainPercentage` decimal(10,2) DEFAULT '0',
	`isPublic` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priceAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`alertType` enum('above','below') NOT NULL,
	`targetPrice` decimal(15,2) NOT NULL,
	`isActive` boolean DEFAULT true,
	`triggeredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `priceAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`assetId` int,
	`symbol` varchar(20) NOT NULL,
	`type` enum('buy','sell','transfer') NOT NULL,
	`quantity` decimal(18,8) NOT NULL,
	`price` decimal(15,2) NOT NULL,
	`totalAmount` decimal(15,2) NOT NULL,
	`fee` decimal(15,2) DEFAULT '0',
	`notes` text,
	`transactionDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`bio` text,
	`avatarUrl` text,
	`portfolioVisibility` enum('private','public','friends') NOT NULL DEFAULT 'private',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `aiInsights` ADD CONSTRAINT `aiInsights_portfolioId_portfolios_id_fk` FOREIGN KEY (`portfolioId`) REFERENCES `portfolios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_portfolioId_portfolios_id_fk` FOREIGN KEY (`portfolioId`) REFERENCES `portfolios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `follows` ADD CONSTRAINT `follows_followerId_users_id_fk` FOREIGN KEY (`followerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `follows` ADD CONSTRAINT `follows_followingId_users_id_fk` FOREIGN KEY (`followingId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolios` ADD CONSTRAINT `portfolios_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `priceAlerts` ADD CONSTRAINT `priceAlerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_portfolioId_portfolios_id_fk` FOREIGN KEY (`portfolioId`) REFERENCES `portfolios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_assetId_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD CONSTRAINT `userProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_portfolioId` ON `aiInsights` (`portfolioId`);--> statement-breakpoint
CREATE INDEX `idx_portfolioId` ON `assets` (`portfolioId`);--> statement-breakpoint
CREATE INDEX `idx_symbol` ON `assets` (`symbol`);--> statement-breakpoint
CREATE INDEX `idx_followerId` ON `follows` (`followerId`);--> statement-breakpoint
CREATE INDEX `idx_followingId` ON `follows` (`followingId`);--> statement-breakpoint
CREATE INDEX `idx_symbol` ON `marketData` (`symbol`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_isRead` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `portfolios` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `priceAlerts` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_symbol` ON `priceAlerts` (`symbol`);--> statement-breakpoint
CREATE INDEX `idx_portfolioId` ON `transactions` (`portfolioId`);--> statement-breakpoint
CREATE INDEX `idx_symbol` ON `transactions` (`symbol`);--> statement-breakpoint
CREATE INDEX `idx_transactionDate` ON `transactions` (`transactionDate`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `userProfiles` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_openId` ON `users` (`openId`);