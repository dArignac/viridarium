import { describe, expect, it } from "vitest";
import { users } from "@/src/db/schema/auth";
import {
  landmarks,
  plants,
  placements,
  sections,
} from "@/src/db/schema/inventory";
import {
  getPlantById,
  getPlants,
  getSectionById,
  getSections,
  getSectionWithGrid,
  getUnplacedPlants,
} from "@/src/lib/inventory/queries";
import { createTestDb } from "../../helpers/db";

describe("Inventory Scoped Queries & Tenant Isolation", () => {
  it("enforces strict user tenancy across sections and plants", async () => {
    const { db } = await createTestDb();
    const now = new Date();

    // User A & User B
    await db.insert(users).values([
      {
        id: "usr_alice",
        email: "alice@example.com",
        passwordHash: "hash",
        displayName: "Alice",
        role: "user",
        twoFactorEnabled: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "usr_bob",
        email: "bob@example.com",
        passwordHash: "hash",
        displayName: "Bob",
        role: "user",
        twoFactorEnabled: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Sections for Alice & Bob
    await db.insert(sections).values([
      {
        id: "sec_alice_1",
        userId: "usr_alice",
        name: "Alice's Orchard",
        width: 10,
        height: 10,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "sec_bob_1",
        userId: "usr_bob",
        name: "Bob's Greenhouse",
        width: 8,
        height: 8,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Alice queries sections -> only gets Alice's section
    const aliceSections = await getSections("usr_alice", db);
    expect(aliceSections).toHaveLength(1);
    expect(aliceSections[0].name).toBe("Alice's Orchard");

    // Alice cannot read Bob's section
    const bobsSectionFromAlice = await getSectionById(
      "usr_alice",
      "sec_bob_1",
      db
    );
    expect(bobsSectionFromAlice).toBeNull();

    // Bob can read Bob's section
    const bobsSectionFromBob = await getSectionById("usr_bob", "sec_bob_1", db);
    expect(bobsSectionFromBob).not.toBeNull();
    expect(bobsSectionFromBob?.name).toBe("Bob's Greenhouse");
  });

  it("fetches section grid state with landmarks and joined plant placements", async () => {
    const { db } = await createTestDb();
    const now = new Date();

    await db.insert(users).values({
      id: "usr_clara",
      email: "clara@example.com",
      passwordHash: "hash",
      displayName: "Clara",
      role: "user",
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(sections).values({
      id: "sec_clara",
      userId: "usr_clara",
      name: "Veggie Beds",
      width: 12,
      height: 12,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(landmarks).values({
      id: "lm_clara_1",
      userId: "usr_clara",
      sectionId: "sec_clara",
      name: "Water Spigot",
      shape: "circle",
      x: 0,
      y: 0,
      radius: 1,
      color: "#0284c7",
      createdAt: now,
    });

    await db.insert(plants).values([
      {
        id: "plt_basil",
        userId: "usr_clara",
        name: "Sweet Basil",
        category: "herb",
        waterIntervalDays: 2,
        defaultPesticideWaitingDays: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "plt_rosemary",
        userId: "usr_clara",
        name: "Rosemary",
        category: "herb",
        waterIntervalDays: 7,
        defaultPesticideWaitingDays: 5,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Place basil, leave rosemary unplaced
    await db.insert(placements).values({
      id: "plc_basil",
      userId: "usr_clara",
      sectionId: "sec_clara",
      plantId: "plt_basil",
      x: 2,
      y: 3,
      createdAt: now,
    });

    const gridState = await getSectionWithGrid("usr_clara", "sec_clara", db);
    expect(gridState).not.toBeNull();
    expect(gridState?.section.name).toBe("Veggie Beds");
    expect(gridState?.landmarks).toHaveLength(1);
    expect(gridState?.landmarks[0].name).toBe("Water Spigot");
    expect(gridState?.placements).toHaveLength(1);
    expect(gridState?.placements[0].plant.name).toBe("Sweet Basil");
    expect(gridState?.placements[0].x).toBe(2);
    expect(gridState?.placements[0].y).toBe(3);

    // Check all plants
    const allClaraPlants = await getPlants("usr_clara", db);
    expect(allClaraPlants).toHaveLength(2);

    const singlePlant = await getPlantById("usr_clara", "plt_basil", db);
    expect(singlePlant?.name).toBe("Sweet Basil");

    // Check unplaced plants
    const unplaced = await getUnplacedPlants("usr_clara", db);
    expect(unplaced).toHaveLength(1);
    expect(unplaced[0].name).toBe("Rosemary");
  });
});
