CREATE TABLE `landmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`section_id` text NOT NULL,
	`name` text NOT NULL,
	`shape` text DEFAULT 'rect' NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`width` integer DEFAULT 1,
	`height` integer DEFAULT 1,
	`radius` integer DEFAULT 1,
	`color` text DEFAULT '#71717a',
	`icon` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `placements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`section_id` text NOT NULL,
	`plant_id` text NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `placements_section_coord_idx` ON `placements` (`section_id`,`x`,`y`);--> statement-breakpoint
CREATE UNIQUE INDEX `placements_section_plant_idx` ON `placements` (`section_id`,`plant_id`);--> statement-breakpoint
CREATE TABLE `plants` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`species` text,
	`category` text DEFAULT 'vegetable' NOT NULL,
	`water_interval_days` integer DEFAULT 3 NOT NULL,
	`pruning_months` text DEFAULT '[]',
	`default_pesticide_waiting_days` integer DEFAULT 7 NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`width` integer DEFAULT 12 NOT NULL,
	`height` integer DEFAULT 12 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
