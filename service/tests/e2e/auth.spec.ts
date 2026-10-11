import { test, expect, type Page } from "@playwright/test";
import { generateSync } from "otplib";

test.describe.serial("Full-Stack Identity & Auth E2E Flow", () => {
  const adminEmail = `admin_${Date.now()}@example.com`;
  const adminPassword = "StrongGarden2026!#$";
  let page: Page;
  let totpSecret = "";

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("1. Redirects uninitialized instance from root to /setup", async () => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/setup/);
    await expect(page.locator("h1")).toContainText("Welcome to Viridarium");
  });

  test("2. Completes first-run admin setup wizard and lands on cockpit", async () => {
    await page.goto("/setup");

    await page.fill('input[placeholder="e.g. Garden Host"]', "Garden Admin");
    await page.fill('input[placeholder="admin@example.com"]', adminEmail);
    await page.fill('input[placeholder="••••••••••••"]', adminPassword);

    await page.click('button:has-text("Complete Setup & Sign In")');
    await expect(page).toHaveURL("/");
    await expect(page.locator("header")).toContainText(adminEmail);
  });

  test("3. Blocks subsequent access to /setup once initialized", async () => {
    await page.goto("/setup");
    await expect(page.locator("h1")).toContainText("Setup Already Completed");
  });

  test("4. Logs out and logs back in with valid credentials", async () => {
    await page.goto("/");
    await page.click('button:has-text("Sign Out")');
    await expect(page).toHaveURL(/\/login/);

    await page.fill('input[placeholder="your@email.com"]', adminEmail);
    await page.fill('input[placeholder="••••••••••••"]', adminPassword);
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL("/");
    await expect(page.locator("header")).toContainText(adminEmail);
  });

  test("5. Enables TOTP 2FA and enforces verification on next login", async () => {
    // Navigate to 2FA settings
    await page.goto("/settings/2fa");
    await page.click('button:has-text("Set Up 2FA")');

    // Wait for setup panel with QR code and key
    const secretLocator = page.locator("p.select-all").first();
    await expect(secretLocator).toBeVisible();
    totpSecret = (await secretLocator.innerText()).trim();

    expect(totpSecret).toBeTruthy();

    // Generate valid TOTP token and confirm
    const token = generateSync({ secret: totpSecret });
    await page.fill('input[placeholder="123456"]', token);
    await page.click('button:has-text("Confirm & Enable 2FA")');

    // Verify enabled badge
    await expect(page.locator("text=Enabled")).toBeVisible();

    // Log out
    await page.goto("/");
    await page.click('button:has-text("Sign Out")');
    await expect(page).toHaveURL(/\/login/);

    // Sign in (Step 1)
    await page.fill('input[placeholder="your@email.com"]', adminEmail);
    await page.fill('input[placeholder="••••••••••••"]', adminPassword);
    await page.click('button:has-text("Sign In")');

    // Lands on 2FA challenge (Step 2)
    await expect(page).toHaveURL(/\/login\/2fa/);

    // Generate fresh TOTP code and submit
    const challengeCode = generateSync({ secret: totpSecret });
    await page.fill('input[placeholder="123456"]', challengeCode);
    await page.click('button:has-text("Verify & Continue")');

    // Lands back on home page authenticated
    await expect(page).toHaveURL("/");
    await expect(page.locator("header")).toContainText(adminEmail);
  });
});
