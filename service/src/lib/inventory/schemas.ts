import { z } from "zod";

export const CreateSectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  width: z.number().int().min(4).max(30).default(12),
  height: z.number().int().min(4).max(30).default(12),
});

export const UpdateSectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  width: z.number().int().min(4).max(30).optional(),
  height: z.number().int().min(4).max(30).optional(),
});

export const CreateLandmarkSchema = z.object({
  sectionId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
  shape: z.enum(["rect", "circle"]).default("rect"),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().min(1).max(30).default(1),
  height: z.number().int().min(1).max(30).default(1),
  radius: z.number().int().min(1).max(15).default(1),
  color: z.string().default("#71717a"),
  icon: z.string().optional(),
});

export const CreatePlantSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  species: z.string().max(100).optional().default(""),
  category: z
    .enum(["vegetable", "herb", "fruit_tree", "shrub", "flower", "other"])
    .default("vegetable"),
  waterIntervalDays: z.number().int().min(1).max(365).default(3),
  pruningMonths: z.array(z.number().int().min(1).max(12)).default([]),
  defaultPesticideWaitingDays: z.number().int().min(0).max(90).default(7),
  notes: z.string().max(500).optional().default(""),
});

export const UpdatePlantSchema = CreatePlantSchema.partial().extend({
  id: z.string().min(1),
});

export const PlacePlantSchema = z.object({
  sectionId: z.string().min(1),
  plantId: z.string().min(1),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

export const MovePlantSchema = z.object({
  placementId: z.string().min(1),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

export type CreateSectionInput = z.input<typeof CreateSectionSchema>;
export type UpdateSectionInput = z.input<typeof UpdateSectionSchema>;
export type CreateLandmarkInput = z.input<typeof CreateLandmarkSchema>;
export type CreatePlantInput = z.input<typeof CreatePlantSchema>;
export type UpdatePlantInput = z.input<typeof UpdatePlantSchema>;
export type PlacePlantInput = z.input<typeof PlacePlantSchema>;
export type MovePlantInput = z.input<typeof MovePlantSchema>;

