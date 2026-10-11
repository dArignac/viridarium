import { describe, expect, it } from "vitest";
import { users } from "@/src/db/schema/auth";
import {
  createLandmarkAction,
  createPlantAction,
  createSectionAction,
  movePlantAction,
  placePlantAction,
  removePlacementAction,
} from "@/src/lib/inventory/actions";
import { getUnplacedPlants } from "@/src/lib/inventory/queries";
import { createTestDb } from "../../helpers/db";

describe("Inventory Server Actions & Boundary Rules", () => {
  it("creates section, landmark, and places plant with strict boundary checks", async () => {
    const { db } = await createTestDb();
    const now = new Date();

    const userId = "usr_tester_1";
    await db.insert(users).values({
      id: userId,
      email: "tester@example.com",
      passwordHash: "hash",
      displayName: "Tester",
      role: "user",
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    });

    // 1. Create 8x8 section
    const secResult = await createSectionAction(
      {
        name: "Backyard Garden",
        width: 8,
        height: 8,
      },
      { db, userId }
    );
    expect(secResult.success).toBe(true);
    const sectionId = secResult.section!.id;

    // 2. Create landmark fitting within bounds (x:0, y:0, width:3, height:2)
    const lmResult = await createLandmarkAction(
      {
        sectionId,
        name: "Compost Bin",
        shape: "rect",
        x: 0,
        y: 0,
        width: 3,
        height: 2,
        color: "#15803d",
      },
      { db, userId }
    );
    expect(lmResult.success).toBe(true);

    // 3. Create plant
    const pltResult = await createPlantAction(
      {
        name: "Cherry Tomato",
        category: "vegetable",
        waterIntervalDays: 2,
        pruningMonths: [4, 5, 6],
        defaultPesticideWaitingDays: 7,
      },
      { db, userId }
    );
    expect(pltResult.success).toBe(true);
    const plantId = pltResult.plant!.id;

    // 4. Place plant at valid coordinate (4, 4)
    const plcResult = await placePlantAction(
      {
        sectionId,
        plantId,
        x: 4,
        y: 4,
      },
      { db, userId }
    );
    expect(plcResult.success).toBe(true);

    // 5. Attempt placing out of bounds (x: 10, y: 4) on an 8x8 grid -> should fail
    await expect(
      placePlantAction(
        {
          sectionId,
          plantId,
          x: 10,
          y: 4,
        },
        { db, userId }
      )
    ).rejects.toThrow("Coordinates out of bounds");

    // 6. Attempt placing on an already occupied cell (4, 4) -> should fail
    const plt2Result = await createPlantAction(
      {
        name: "Bell Pepper",
        category: "vegetable",
        waterIntervalDays: 3,
        pruningMonths: [],
        defaultPesticideWaitingDays: 7,
      },
      { db, userId }
    );

    await expect(
      placePlantAction(
        {
          sectionId,
          plantId: plt2Result.plant!.id,
          x: 4,
          y: 4,
        },
        { db, userId }
      )
    ).rejects.toThrow("Cell is already occupied");

    // 7. Move plant to unoccupied cell (5, 5)
    const moveResult = await movePlantAction(
      {
        placementId: plcResult.placement!.id,
        x: 5,
        y: 5,
      },
      { db, userId }
    );
    expect(moveResult.success).toBe(true);

    // Place another plant at (4, 4)
    await placePlantAction(
      {
        sectionId,
        plantId: plt2Result.plant!.id,
        x: 4,
        y: 4,
      },
      { db, userId }
    );

    // Attempt moving first plant to (4, 4) -> should fail
    await expect(
      movePlantAction(
        {
          placementId: plcResult.placement!.id,
          x: 4,
          y: 4,
        },
        { db, userId }
      )
    ).rejects.toThrow("Cell is already occupied");

    // 8. Remove placement -> plant returns to unplaced pool
    const removeResult = await removePlacementAction(
      plcResult.placement!.id,
      { db, userId }
    );
    expect(removeResult.success).toBe(true);

    const unplaced = await getUnplacedPlants(userId, db);
    expect(unplaced.some((p) => p.name === "Cherry Tomato")).toBe(true);
  });

  it("rejects landmark coordinates out of section bounds", async () => {
    const { db } = await createTestDb();
    const userId = "usr_tester_lmk";
    await db.insert(users).values({
      id: userId,
      email: "lmk@example.com",
      passwordHash: "hash",
      displayName: "LMK Tester",
      role: "user",
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const sec = await createSectionAction(
      { name: "Small Plot", width: 5, height: 5 },
      { db, userId }
    );

    await expect(
      createLandmarkAction(
        {
          sectionId: sec.section!.id,
          name: "Shed",
          x: 10,
          y: 2,
        },
        { db, userId }
      )
    ).rejects.toThrow("Landmark coordinates out of bounds");
  });
});

