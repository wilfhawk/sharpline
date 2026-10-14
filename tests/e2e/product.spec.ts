import { expect, test } from "@playwright/test";

test("all games supports stable sport and search filters", async ({ page }) => {
  await page.goto("/games");
  await expect(page.getByRole("heading", { name: "All Games", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Sport", exact: true }).selectOption({ label: "MLB" });
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
  await expect(page.getByRole("button", { name: "Sports", exact: true })).toContainText("All sports");
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
test("landing shows live picks from the feed", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Today's free picks")).toBeVisible();
  await expect(page.getByText("Sample data")).toBeVisible();
  await expect(page.getByText("Games tracked")).toBeVisible();
});

test("promo converter locks a profit and updates with inputs", async ({ page }) => {
  await page.goto("/promos");
  await expect(page.getByText("$66.67", { exact: true })).toBeVisible();
  await page.getByLabel("Bonus bet amount ($)").fill("200");
  await expect(page.getByText("$133.33", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Deposit match" }).click();
  await expect(page.getByText("Expected value", { exact: true })).toBeVisible();
});

test("my books persists limits and promos on this device", async ({ page }) => {
  await page.goto("/books");
  await page.getByRole("combobox", { name: "Sportsbook to add" }).selectOption({ label: "DraftKings" });
  await page.getByRole("button", { name: "Add", exact: true }).click();
  const card = page.getByRole("region", { name: "DraftKings" });
  await card.getByRole("combobox").first().selectOption("limited");
  await card.getByLabel("Max bet they will take ($)").fill("25");
  await card.getByLabel("Promo title").fill("Bet $5 get $150");
  await card.getByLabel("Promo value ($)").fill("150");
  await card.getByRole("button", { name: "Add promo" }).click();
  await page.reload();
  const again = page.getByRole("region", { name: "DraftKings" });
  await expect(again.getByLabel("Max bet they will take ($)")).toHaveValue("25");
  await expect(again.getByText("Bet $5 get $150")).toBeVisible();
});

test("dashboard exposes player props with a market consensus reference", async ({ page }) => {
  await page.goto("/dashboard?tier=pro");
  await page.getByRole("combobox", { name: "Market type" }).click();
  await page.getByRole("option", { name: "Player prop" }).click();
  await expect(page.getByText("Showing sample data")).toBeVisible();
  await page.getByRole("row").nth(1).click();
  await page.getByRole("button", { name: /Over|Under/ }).first().click();
  await expect(page.getByText(/Reference: Market consensus \(\d+ books\)/)).toBeVisible();
  await expect(page.getByRole("link", { name: /^Bet at / })).toBeVisible();
});

test("new pages fit a 375px screen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ["/", "/promos", "/books", "/games"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
  }
});

test("landing demo launcher opens the dashboard as the chosen plan", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.getByTestId("demo-launcher").first().getByRole("button", { name: "Demo as Plus" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("button", { name: "PLUS", exact: true })).toBeVisible();
});

test("dashboard sports and sportsbooks selections filter results and persist", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/dashboard?tier=pro");
  const sports = page.getByRole("button", { name: "Sports", exact: true });
  await expect(sports).toContainText("All sports");
  await sports.click();
  await page.getByRole("menuitemcheckbox", { name: "NFL" }).click();
  await page.keyboard.press("Escape");
  await expect(sports).toContainText("NFL");
  await expect(page.getByText(/Chiefs|Bills|Eagles|Cowboys|49ers|Rams/).first()).toBeVisible();
  await expect(page.getByText(/Lakers|Warriors|Yankees/)).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: "Sports", exact: true })).toContainText("NFL");
  await page.getByRole("button", { name: "Show all" }).click();
  await expect(page.getByRole("button", { name: "Sports", exact: true })).toContainText("All sports");
});

test("any game can be looked up with predictions, even without an edge", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/games?tier=pro");
  await page.getByRole("textbox", { name: "Search teams or leagues" }).fill("Chiefs");
  await page.getByRole("button", { name: /Chiefs/ }).click();
  await page.getByRole("link", { name: "View predictions for this game" }).click();
  await expect(page).toHaveURL(/\/games\/evt-/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Chiefs", { timeout: 30_000 });
  await expect(page.getByText(/Model (agrees|neutral|disagrees)/).first()).toBeVisible();
  await expect(page.getByText("Reference").first()).toBeVisible();
});
