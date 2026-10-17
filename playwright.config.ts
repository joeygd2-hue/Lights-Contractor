import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgres://app:app@localhost:5432/lights_test";

/**
 * End-to-end tests run against a production build (`npm run build` first).
 * They use a separate database because they insert real leads and bookings.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } },
      testIgnore: /mobile\.spec\.ts/,
    },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      SESSION_SECRET: "e2e-secret-0123456789abcdef0123456789",
      ADMIN_EMAIL: "owner@example.com",
      // Password: "e2e-owner-password"
      ADMIN_PASSWORD_HASH: process.env.E2E_ADMIN_PASSWORD_HASH ?? "",
      RESEND_API_KEY: "",
      EMAIL_FROM: "",
    },
  },
});
