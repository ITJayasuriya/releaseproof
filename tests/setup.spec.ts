import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("setup page loads and has no automated accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "ReleaseProof", exact: true }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test.describe("M1 workflow setup", () => {
  test.beforeEach(async ({ page }) => {
    // Setup for M1 workflow tests
    await page.goto("/");
  });

  test("should have access to M1 workflow features", async ({ page }) => {
    // Verify that the main navigation has options for M1 workflow
    await expect(page.getByRole("navigation")).toBeVisible();
    // This will be expanded when implementing the actual workflow
  });
});
