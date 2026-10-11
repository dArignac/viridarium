"use server";

import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db as defaultDb } from "@/src/db";
import {
  landmarks,
  plants,
  placements,
  sections,
  type Landmark,
  type Plant,
  type Placement,
  type Section,
} from "@/src/db/schema/inventory";
import { requireUser } from "@/src/lib/auth/guard";
import {
  CreateLandmarkSchema,
  CreatePlantSchema,
  CreateSectionSchema,
  MovePlantSchema,
  PlacePlantSchema,
  UpdatePlantSchema,
  UpdateSectionSchema,
  type CreateLandmarkInput,
  type CreatePlantInput,
  type CreateSectionInput,
  type MovePlantInput,
  type PlacePlantInput,
  type UpdatePlantInput,
  type UpdateSectionInput,
} from "./schemas";

interface ActionContext {
  db?: typeof defaultDb;
  userId?: string;
}

async function resolveContext(ctx?: ActionContext): Promise<{
  userId: string;
  db: typeof defaultDb;
}> {
  const db = ctx?.db || defaultDb;
  if (ctx?.userId) {
    return { userId: ctx.userId, db };
  }
  const user = await requireUser();
  return { userId: user.userId, db };
}

export async function createSectionAction(
  input: CreateSectionInput,
  ctx?: ActionContext
): Promise<{ success: boolean; section?: Section; error?: string }> {
  const { userId, db } = await resolveContext(ctx);
  const data = CreateSectionSchema.parse(input);

  const sectionId = `sec_${crypto.randomUUID()}`;
  const now = new Date();

  const [section] = await db
    .insert(sections)
    .values({
      id: sectionId,
      userId,
      name: data.name,
      width: data.width,
      height: data.height,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return { success: true, section };
}

export async function updateSectionAction(
  input: UpdateSectionInput,
  ctx?: ActionContext
): Promise<{ success: boolean; section?: Section; error?: string }> {
  const { userId, db } = await resolveContext(ctx);
  const data = UpdateSectionSchema.parse(input);

  const [existing] = await db
    .select()
    .from(sections)
    .where(and(eq(sections.id, data.id), eq(sections.userId, userId)));

  if (!existing) {
    throw new Error("Section not found");
  }

  const [updated] = await db
    .update(sections)
    .set({
      ...(data.name ? { name: data.name } : {}),
      ...(data.width ? { width: data.width } : {}),
      ...(data.height ? { height: data.height } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(sections.id, data.id), eq(sections.userId, userId)))
    .returning();

  return { success: true, section: updated };
}

export async function deleteSectionAction(
  sectionId: string,
  ctx?: ActionContext
): Promise<{ success: boolean }> {
  const { userId, db } = await resolveContext(ctx);

  await db
    .delete(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.userId, userId)));

  return { success: true };
}

export async function createLandmarkAction(
  input: CreateLandmarkInput,
  ctx?: ActionContext
): Promise<{ success: boolean; landmark?: Landmark; error?: string }> {
  const { userId, db } = await resolveContext(ctx);
  const data = CreateLandmarkSchema.parse(input);

  const [section] = await db
    .select()
    .from(sections)
    .where(and(eq(sections.id, data.sectionId), eq(sections.userId, userId)));

  if (!section) {
    throw new Error("Section not found");
  }

  if (
    data.x < 0 ||
    data.x >= section.width ||
    data.y < 0 ||
    data.y >= section.height
  ) {
    throw new Error("Landmark coordinates out of bounds");
  }

  const landmarkId = `lmk_${crypto.randomUUID()}`;
  const [landmark] = await db
    .insert(landmarks)
    .values({
      id: landmarkId,
      userId,
      sectionId: data.sectionId,
      name: data.name,
      shape: data.shape,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      radius: data.radius,
      color: data.color,
      icon: data.icon,
      createdAt: new Date(),
    })
    .returning();

  return { success: true, landmark };
}

export async function deleteLandmarkAction(
  landmarkId: string,
  ctx?: ActionContext
): Promise<{ success: boolean }> {
  const { userId, db } = await resolveContext(ctx);

  await db
    .delete(landmarks)
    .where(and(eq(landmarks.id, landmarkId), eq(landmarks.userId, userId)));

  return { success: true };
}

export async function createPlantAction(
  input: CreatePlantInput,
  ctx?: ActionContext
): Promise<{ success: boolean; plant?: Plant; error?: string }> {
  const { userId, db } = await resolveContext(ctx);
  const data = CreatePlantSchema.parse(input);

  const plantId = `plt_${crypto.randomUUID()}`;
  const now = new Date();

  const [plant] = await db
    .insert(plants)
    .values({
      id: plantId,
      userId,
      name: data.name,
      species: data.species,
      category: data.category,
      waterIntervalDays: data.waterIntervalDays,
      pruningMonths: JSON.stringify(data.pruningMonths || []),
      defaultPesticideWaitingDays: data.defaultPesticideWaitingDays,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return { success: true, plant };
}

export async function updatePlantAction(
  input: UpdatePlantInput,
  ctx?: ActionContext
): Promise<{ success: boolean; plant?: Plant; error?: string }> {
  const { userId, db } = await resolveContext(ctx);
  const data = UpdatePlantSchema.parse(input);

  const [existing] = await db
    .select()
    .from(plants)
    .where(and(eq(plants.id, data.id), eq(plants.userId, userId)));

  if (!existing) {
    throw new Error("Plant not found");
  }

  const [updated] = await db
    .update(plants)
    .set({
      ...(data.name ? { name: data.name } : {}),
      ...(data.species !== undefined ? { species: data.species } : {}),
      ...(data.category ? { category: data.category } : {}),
      ...(data.waterIntervalDays ? { waterIntervalDays: data.waterIntervalDays } : {}),
      ...(data.pruningMonths ? { pruningMonths: JSON.stringify(data.pruningMonths) } : {}),
      ...(data.defaultPesticideWaitingDays !== undefined
        ? { defaultPesticideWaitingDays: data.defaultPesticideWaitingDays }
        : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(plants.id, data.id), eq(plants.userId, userId)))
    .returning();

  return { success: true, plant: updated };
}

export async function deletePlantAction(
  plantId: string,
  ctx?: ActionContext
): Promise<{ success: boolean }> {
  const { userId, db } = await resolveContext(ctx);

  await db
    .delete(plants)
    .where(and(eq(plants.id, plantId), eq(plants.userId, userId)));

  return { success: true };
}

export async function placePlantAction(
  input: PlacePlantInput,
  ctx?: ActionContext
): Promise<{ success: boolean; placement?: Placement; error?: string }> {
  const { userId, db } = await resolveContext(ctx);
  const data = PlacePlantSchema.parse(input);

  const [section] = await db
    .select()
    .from(sections)
    .where(and(eq(sections.id, data.sectionId), eq(sections.userId, userId)));

  if (!section) {
    throw new Error("Section not found");
  }

  if (
    data.x < 0 ||
    data.x >= section.width ||
    data.y < 0 ||
    data.y >= section.height
  ) {
    throw new Error("Coordinates out of bounds");
  }

  const [existing] = await db
    .select()
    .from(placements)
    .where(
      and(
        eq(placements.sectionId, data.sectionId),
        eq(placements.x, data.x),
        eq(placements.y, data.y)
      )
    );

  if (existing) {
    throw new Error("Cell is already occupied");
  }

  const placementId = `plc_${crypto.randomUUID()}`;
  const [placement] = await db
    .insert(placements)
    .values({
      id: placementId,
      userId,
      sectionId: data.sectionId,
      plantId: data.plantId,
      x: data.x,
      y: data.y,
      createdAt: new Date(),
    })
    .returning();

  return { success: true, placement };
}

export async function movePlantAction(
  input: MovePlantInput,
  ctx?: ActionContext
): Promise<{ success: boolean; placement?: Placement; error?: string }> {
  const { userId, db } = await resolveContext(ctx);
  const data = MovePlantSchema.parse(input);

  const [placement] = await db
    .select()
    .from(placements)
    .where(and(eq(placements.id, data.placementId), eq(placements.userId, userId)));

  if (!placement) {
    throw new Error("Placement not found");
  }

  const [section] = await db
    .select()
    .from(sections)
    .where(and(eq(sections.id, placement.sectionId), eq(sections.userId, userId)));

  if (!section) {
    throw new Error("Section not found");
  }

  if (
    data.x < 0 ||
    data.x >= section.width ||
    data.y < 0 ||
    data.y >= section.height
  ) {
    throw new Error("Coordinates out of bounds");
  }

  const [existing] = await db
    .select()
    .from(placements)
    .where(
      and(
        eq(placements.sectionId, placement.sectionId),
        eq(placements.x, data.x),
        eq(placements.y, data.y)
      )
    );

  if (existing && existing.id !== placement.id) {
    throw new Error("Cell is already occupied");
  }

  const [updated] = await db
    .update(placements)
    .set({
      x: data.x,
      y: data.y,
    })
    .where(and(eq(placements.id, data.placementId), eq(placements.userId, userId)))
    .returning();

  return { success: true, placement: updated };
}

export async function removePlacementAction(
  placementId: string,
  ctx?: ActionContext
): Promise<{ success: boolean }> {
  const { userId, db } = await resolveContext(ctx);

  await db
    .delete(placements)
    .where(and(eq(placements.id, placementId), eq(placements.userId, userId)));

  return { success: true };
}
