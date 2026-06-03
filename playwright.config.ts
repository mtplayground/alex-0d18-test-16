import { defineConfig, devices } from "@playwright/test";

const port = 8080;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run start",
    url: `${baseURL}/sign-up`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AUTH_SECRET:
        process.env.AUTH_SECRET ??
        "e2e-auth-secret-must-be-at-least-thirty-two-chars",
      AUTH_TRUST_HOST: "true",
      AUTH_URL: baseURL,
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      E2E_UPLOAD_MOCK: "true",
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID ?? "e2e-access-key",
      S3_BUCKET: process.env.S3_BUCKET ?? "e2e-bucket",
      S3_ENDPOINT: process.env.S3_ENDPOINT ?? "http://127.0.0.1:9000",
      S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE ?? "true",
      S3_PUBLIC_BASE_URL:
        process.env.S3_PUBLIC_BASE_URL ?? `${baseURL}/e2e-assets`,
      S3_REGION: process.env.S3_REGION ?? "us-east-1",
      S3_SECRET_ACCESS_KEY:
        process.env.S3_SECRET_ACCESS_KEY ?? "e2e-secret-key",
    },
  },
});
