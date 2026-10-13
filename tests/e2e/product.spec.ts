import { expect, test } from "@playwright/test";

test("all games supports stable sport and search filters", async ({ page }) => {
  await page.goto("/games");
  await expect(page.getByRole("heading", { name: "All Games", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Sport", exact: true }).selectOption({ label: "Baseball" });
  await expect(page.getByRole("button", { name: /Yankees|Red Sox/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Chiefs/ })).toHaveCount(0);
  await page.getByRole("combobox", { name: "Sport", exact: true }).selectOption("");
  await page.getByRole("textbox", { name: "Search teams or leagues" }).fill("Chiefs");
  await expect(page.getByRole("button", { name: /Chiefs/ })).toBeVisible();
  await page.getByRole("button", { name: /Chiefs/ }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("mobile dashboard and calculator fit and calculations update", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/dashboard");
  await expect(page.getByRole("combobox", { name: "Sport", exact: true })).toContainText("All sports");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/dashboard-mobile.png", fullPage: true });
  await page.goto("/learn/earnings");
  await expect(page.getByRole("heading", { name: "Earnings & Risk", exact: true })).toBeVisible();
  const chart = page.getByRole("img", { name: /Expected net profit/ });
  const before = await chart.getAttribute("aria-label");
  await page.getByLabel("Assumed true edge (%)", { exact: true }).fill("-5");
  await expect(chart).not.toHaveAttribute("aria-label", before!);
  await expect(page.getByText("-$750", { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/earnings-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/earnings-desktop.png", fullPage: true });
});

test("free comparisons are blocked and callback targets stay local", async ({ request }) => {
  const comparison = await request.get("/api/markets/unknown/comparison?tier=free");
  expect(comparison.status()).toBe(403);
  const callback = await request.get("/api/auth/callback?next=https://example.com", { maxRedirects: 0 });
  expect(new URL(callback.headers().location).origin).toBe("http://localhost:3100");
});