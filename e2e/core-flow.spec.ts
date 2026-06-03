import { Buffer } from "node:buffer";

import { expect, test } from "@playwright/test";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const email = `core-flow-${runId}@example.com`;
const initialDisplayName = `Core Flow ${runId}`;
const updatedDisplayName = `Core Flow Updated ${runId}`;
const password = "secure-e2e-password";
const postTitle = `E2E core flow post ${runId}`;
const postBody = "This post verifies the registered user core flow.";
const replyBody = "This reply verifies the post detail reply flow.";
const documentFileName = "core-flow-document.txt";
const avatarFileName = "core-flow-avatar.png";
const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

test("registration to profile core flow", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Display name").fill(initialDisplayName);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("Account created.");

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Posts" })).toBeVisible();

  await page.goto("/posts/new");
  await page.getByLabel("Upload document").setInputFiles({
    name: documentFileName,
    mimeType: "text/plain",
    buffer: Buffer.from("Core flow document contents"),
  });
  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page.getByText(`Uploaded ${documentFileName}`)).toBeVisible();

  await page.getByLabel("Title").fill(postTitle);
  await page.getByLabel("Body").fill(postBody);
  await page.getByRole("button", { name: "Create post" }).click();
  await expect(page).toHaveURL(/\/posts\/[^/]+$/);
  const postUrl = page.url();
  await expect(page.getByRole("heading", { name: postTitle })).toBeVisible();
  await expect(page.getByText(postBody)).toBeVisible();
  await expect(page.getByText(documentFileName)).toBeVisible();

  await page.getByLabel("Reply").fill(replyBody);
  await page.getByRole("button", { name: "Post reply" }).click();
  await expect(page.getByRole("status")).toContainText("Reply created.");
  await expect(page.getByText(replyBody)).toBeVisible();

  await page.goto("/profile/edit");
  await page.getByLabel("Upload avatar").setInputFiles({
    name: avatarFileName,
    mimeType: "image/png",
    buffer: onePixelPng,
  });
  await page.getByRole("button", { name: "Upload" }).click();
  await expect(page.getByText(`Uploaded ${avatarFileName}`)).toBeVisible();
  await page.getByLabel("Display name").fill(updatedDisplayName);
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status")).toContainText("Profile updated.");

  await page.goto(postUrl);
  await page.getByRole("link", { name: updatedDisplayName }).click();
  await expect(
    page.getByRole("heading", { name: updatedDisplayName })
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: `${updatedDisplayName} avatar` })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: postTitle })).toBeVisible();
  await expect(page.getByText("1 post")).toBeVisible();
  await expect(page.getByText("1 reply")).toBeVisible();
});
