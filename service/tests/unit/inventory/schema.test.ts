import { describe, expect, it } from "vitest";
import { users } from "@/src/db/schema/auth";
import {
  landmarks,
  plants,
  placements,
  sections,
} from "@/src/db/schema/inventory";
import { createTestDb } from "../../helpers/db";

describe("Garden Inventory Database Schema", () => {
  it("creates sections, landmarks, plants, and placement records", async () => {
    const { db } = await createTestDb();

    // 1. Create user
    const now = new Date();
    await db.insert(users).values({
      id: "usr_garden_1",
      email: "gardener@example.com",
      passwordHash: "hash",
      displayName: "Gardener",
      role: "user",
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Create section
    await db.insert(sections).values({
      id: "sec_1",
      userId: "usr_garden_1",
      name: "Front Yard Veggie Patch",
      width: 12,
      height: 12,
      createdAt: now,
      updatedAt: now,
    });

    const [insertedSection] = await db.select().from(sections);
    expect(insertedSection).toBeDefined();
    expect(insertedSection.name).toBe("Front Yard Veggie Patch");
    expect(insertedSection.width).toBe(12);

    // 3. Create landmark
    await db.insert(landmarks).values({
      id: "lm_1",
      userId: "usr_garden_1",
      sectionId: "sec_1",
      name: "Tool Shed",
      shape: "rect",
      x: 0,
      y: 0,
      width: 3,
      height: 2,
      color: "#71717a",
      icon: "shed",
      createdAt: now,
    });

    const [insertedLandmark] = await db.select().from(landmarks);
    expect(insertedLandmark).toBeDefined();
    expect(insertedLandmark.name).toBe("Tool Shed");
    expect(insertedLandmark.shape).toBe("rect");

    // 4. Create plant
    await db.insert(plants).values({
      id: "plt_1",
      userId: "usr_garden_1",
      name: "Roma Tomato",
      species: "Solanum lycopersicum",
      category: "vegetable",
      waterIntervalDays: 3,
      pruningMonths: JSON.stringify([5, 6]),
      defaultPesticideWaitingDays: 7,
      notes: "Indeterminate heirloom variety",
      createdAt: now,
      updatedAt: now,
    });

    const [insertedPlant] = await db.select().from(plants);
    expect(insertedPlant).toBeDefined();
    expect(insertedPlant.name).toBe("Roma Tomato");
    expect(insertedPlant.waterIntervalDays).toBe(3);

    // 5. Place plant on grid
    await db.insert(placements).values({
      id: "plc_1",
      userId: "usr_garden_1",
      sectionId: "sec_1",
      plantId: "plt_1",
      x: 4,
      y: 5,
      createdAt: now,
    });

    const [insertedPlacement] = await db.select().from(placements);
    expect(insertedPlacement).toBeDefined();
    expect(insertedPlacement.x).toBe(4);
    expect(insertedPlacement.y).toBe(5);

    // 6. Confirms unique constraint on (sectionId, x, y)
    await expect(
      db.insert(placements).values({
        id: "plc_duplicate",
        userId: "usr_garden_1",
        sectionId: "sec_1",
        plantId: "plt_1",
        x: 4,
        y: 5,
        createdAt: now,
      })
    ).rejects.toThrow();
  });
});
