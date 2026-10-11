import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3005",
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],
  webServer: {
    command: "DATABASE_URL=file:./data/e2e-test.db pnpm next start -p 3005",
    url: "http://localhost:3005",
    reuseExistingServer: false,
    timeout: 60 * 1000,
  },
});
