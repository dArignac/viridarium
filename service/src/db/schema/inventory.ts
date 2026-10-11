import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { users } from "./auth";

export const sections = sqliteTable("sections", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  width: integer("width").notNull().default(12),
  height: integer("height").notNull().default(12),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const landmarks = sqliteTable("landmarks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sectionId: text("section_id")
    .notNull()
    .references(() => sections.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  shape: text("shape", { enum: ["rect", "circle"] })
    .notNull()
    .default("rect"),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  width: integer("width").default(1),
  height: integer("height").default(1),
  radius: integer("radius").default(1),
  color: text("color").default("#71717a"),
  icon: text("icon"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const plants = sqliteTable("plants", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  species: text("species"),
  category: text("category", {
    enum: ["vegetable", "herb", "fruit_tree", "shrub", "flower", "other"],
  })
    .notNull()
    .default("vegetable"),
  waterIntervalDays: integer("water_interval_days").notNull().default(3),
  pruningMonths: text("pruning_months").default("[]"), // JSON string array of months (1-12)
  defaultPesticideWaitingDays: integer("default_pesticide_waiting_days")
    .notNull()
    .default(7),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const placements = sqliteTable(
  "placements",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sectionId: text("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    plantId: text("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    x: integer("x").notNull(),
    y: integer("y").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("placements_section_coord_idx").on(
      table.sectionId,
      table.x,
      table.y
    ),
    uniqueIndex("placements_section_plant_idx").on(
      table.sectionId,
      table.plantId
    ),
  ]
);

export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
export type Landmark = typeof landmarks.$inferSelect;
export type NewLandmark = typeof landmarks.$inferInsert;
export type Plant = typeof plants.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;
export type Placement = typeof placements.$inferSelect;
export type NewPlacement = typeof placements.$inferInsert;
