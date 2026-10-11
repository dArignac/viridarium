import { test, expect } from "@playwright/test";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "node:path";
import { users } from "@/src/db/schema/auth";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/src/lib/auth/session";

test.describe.serial("Garden Inventory 2D Spatial & Botanical E2E Flow", () => {
  const dbUrl = `file:${path.resolve(__dirname, "../../data/e2e-test.db")}`;
  const client = createClient({ url: dbUrl });
  const testDb = drizzle(client);

  const timestamp = Date.now();
  const gardenerId = `usr_gardener_${timestamp}`;
  const gardenerEmail = `gardener_${timestamp}@example.com`;

  const intruderId = `usr_intruder_${timestamp}`;
  const intruderEmail = `intruder_${timestamp}@example.com`;

  test.beforeAll(async () => {
    const now = new Date();
    // Seed authenticated gardener
    await testDb.insert(users).values({
      id: gardenerId,
      email: gardenerEmail,
      passwordHash: "dummy_argon2_hash",
      displayName: "Mobile Gardener",
      role: "user",
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    });

    // Seed another user for tenant isolation test
    await testDb.insert(users).values({
      id: intruderId,
      email: intruderEmail,
      passwordHash: "dummy_argon2_hash",
      displayName: "Intruder User",
      role: "user",
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    });
  });

  test("1. Gardener creates section, landmark, plant, and places on 2D grid", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const sessionToken = await createSessionToken({
      userId: gardenerId,
      email: gardenerEmail,
      role: "user",
      isTwoFactorAuthenticated: true,
    });

    await context.addCookies([
      {
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    const page = await context.newPage();

    // Navigate to root cockpit and click Garden Inventory
    await page.goto("/");
    await expect(page.locator("header")).toContainText(gardenerEmail);

    const inventoryLink = page.locator('a[href="/inventory"]');
    await expect(inventoryLink).toBeVisible();
    await inventoryLink.click();

    // Lands on /inventory with empty state
    await expect(page).toHaveURL(/\/inventory/);
    await expect(page.locator("h3")).toContainText("No Garden Sections Yet");

    // Click create garden section
    await page.click('[data-testid="create-first-section-btn"]');

    // Fill new section modal
    await page.fill('[data-testid="section-name-input"]', "Herb & Veggie Plot");
    await page.fill('[data-testid="section-width-input"]', "8");
    await page.fill('[data-testid="section-height-input"]', "8");
    await page.click('[data-testid="submit-section-btn"]');

    // Verify grid appears
    await expect(page.locator('[data-testid="section-title"]')).toContainText("Herb & Veggie Plot");
    await expect(page.locator('[data-testid="grid-cell-0-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="grid-cell-7-7"]')).toBeVisible();

    // Add a landmark
    await page.click('[data-testid="add-landmark-btn"]');
    await page.fill('[data-testid="landmark-name-input"]', "Tool Shed");
    await page.click('[data-testid="submit-landmark-btn"]');

    // Verify landmark appears on grid
    await expect(page.locator('[data-testid="grid-cell-0-0"]')).toContainText("Tool Shed");

    // Navigate to Plants catalog
    await page.click('a[href="/inventory/plants"]');
    await expect(page).toHaveURL(/\/inventory\/plants/);
    await expect(page.locator("h1")).toContainText("Botanical Plant Registry");

    // Add a new plant
    await page.click('[data-testid="add-first-plant-btn"]');
    await page.fill('[data-testid="plant-name-input"]', "Genovese Basil");
    await page.fill('[data-testid="plant-species-input"]', "Ocimum basilicum");
    await page.selectOption('[data-testid="plant-category-select"]', "herb");
    await page.click('[data-testid="submit-plant-btn"]');

    // Verify plant listed
    await expect(page.locator("h4")).toContainText("Genovese Basil");

    // Return to Garden Grid
    await page.click('a:has-text("Garden Grid")');
    await expect(page).toHaveURL(/\/inventory/);

    // Tap cell (2, 2) to place plant
    await page.click('[data-testid="grid-cell-2-2"]');
    await expect(page.locator("h4")).toContainText("Cell (2, 2)");

    // Select plant from dropdown and place
    const selectLocator = page.locator('[data-testid="select-plant-to-place"]');
    await expect(selectLocator).toBeVisible();
    await selectLocator.selectOption({ label: "Genovese Basil (herb)" });

    await page.click('[data-testid="submit-place-plant-btn"]');

    // Verify cell (2, 2) now displays plant marker
    const cell22 = page.locator('[data-testid="grid-cell-2-2"]');
    await expect(cell22).toContainText("Genovese Basil");
    await expect(cell22).toContainText("🌿");

    await context.close();
  });

  test("2. Enforces strict tenant isolation across inventory sections", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const intruderToken = await createSessionToken({
      userId: intruderId,
      email: intruderEmail,
      role: "user",
      isTwoFactorAuthenticated: true,
    });

    await context.addCookies([
      {
        name: SESSION_COOKIE_NAME,
        value: intruderToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    const page = await context.newPage();
    await page.goto("/inventory");

    // Intruder user has empty state and cannot see Gardener's "Herb & Veggie Plot"
    await expect(page.locator("h3")).toContainText("No Garden Sections Yet");
    await expect(page.locator("text=Herb & Veggie Plot")).not.toBeVisible();

    await context.close();
  });
});
