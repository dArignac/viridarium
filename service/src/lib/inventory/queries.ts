import { and, eq, notInArray } from "drizzle-orm";
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

export async function getSections(
  userId: string,
  dbInstance = defaultDb
): Promise<Section[]> {
  return dbInstance
    .select()
    .from(sections)
    .where(eq(sections.userId, userId))
    .orderBy(sections.createdAt);
}

export async function getSectionById(
  userId: string,
  sectionId: string,
  dbInstance = defaultDb
): Promise<Section | null> {
  const [section] = await dbInstance
    .select()
    .from(sections)
    .where(and(eq(sections.userId, userId), eq(sections.id, sectionId)));
  return section || null;
}

export interface PlacedPlantItem extends Placement {
  plant: Plant;
}

export interface SectionGridState {
  section: Section;
  landmarks: Landmark[];
  placements: PlacedPlantItem[];
}

export async function getSectionWithGrid(
  userId: string,
  sectionId: string,
  dbInstance = defaultDb
): Promise<SectionGridState | null> {
  const section = await getSectionById(userId, sectionId, dbInstance);
  if (!section) return null;

  const sectionLandmarks = await dbInstance
    .select()
    .from(landmarks)
    .where(
      and(eq(landmarks.userId, userId), eq(landmarks.sectionId, sectionId))
    );

  const placementRecords = await dbInstance
    .select({
      placement: placements,
      plant: plants,
    })
    .from(placements)
    .innerJoin(plants, eq(placements.plantId, plants.id))
    .where(
      and(eq(placements.userId, userId), eq(placements.sectionId, sectionId))
    );

  const placedItems: PlacedPlantItem[] = placementRecords.map((r) => ({
    ...r.placement,
    plant: r.plant,
  }));

  return {
    section,
    landmarks: sectionLandmarks,
    placements: placedItems,
  };
}

export async function getPlants(
  userId: string,
  dbInstance = defaultDb
): Promise<Plant[]> {
  return dbInstance
    .select()
    .from(plants)
    .where(eq(plants.userId, userId))
    .orderBy(plants.name);
}

export async function getPlantById(
  userId: string,
  plantId: string,
  dbInstance = defaultDb
): Promise<Plant | null> {
  const [plant] = await dbInstance
    .select()
    .from(plants)
    .where(and(eq(plants.userId, userId), eq(plants.id, plantId)));
  return plant || null;
}

export async function getUnplacedPlants(
  userId: string,
  dbInstance = defaultDb
): Promise<Plant[]> {
  const activePlacements = await dbInstance
    .select({ plantId: placements.plantId })
    .from(placements)
    .where(eq(placements.userId, userId));

  const placedIds = activePlacements.map((p) => p.plantId);

  if (placedIds.length === 0) {
    return getPlants(userId, dbInstance);
  }

  return dbInstance
    .select()
    .from(plants)
    .where(and(eq(plants.userId, userId), notInArray(plants.id, placedIds)))
    .orderBy(plants.name);
}
