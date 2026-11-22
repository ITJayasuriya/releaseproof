import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("M1 End-to-End Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page before each test
    await page.goto("/");
  });

  test("should complete the main sample journey end-to-end", async ({ page }) => {
    // Step 1: Verify baseline artifact generation
    await expect(
      page.getByRole("heading", { name: "ReleaseProof", exact: true }),
    ).toBeVisible();
    
    // Step 2: Navigate to import/create workflow
    const importButton = page.getByRole("button", { name: /import|create/i });
    await expect(importButton).toBeVisible();
    await importButton.click();
    
    // Step 3: Select baseline artifacts
    await expect(page.getByText(/baseline|initial/i)).toBeVisible();
    const baselineSelector = page.getByRole("button", { name: /select baseline/i });
    await expect(baselineSelector).toBeVisible();
    await baselineSelector.click();
    
    // Step 4: Select candidate artifacts
    await expect(page.getByText(/candidate|changed/i)).toBeVisible();
    const candidateSelector = page.getByRole("button", { name: /select candidate/i });
    await expect(candidateSelector).toBeVisible();
    await candidateSelector.click();
    
    // Step 5: Build review packet
    await expect(page.getByRole("button", { name: /build|generate/i })).toBeVisible();
    const buildButton = page.getByRole("button", { name: /build|generate/i });
    await buildButton.click();
    
    // Step 6: Verify packet creation
    await expect(page.getByText(/packet created|review ready/i)).toBeVisible();
    
    // Step 7: Navigate to packet review
    const reviewButton = page.getByRole("button", { name: /review|start review/i });
    await expect(reviewButton).toBeVisible();
    await reviewButton.click();
    
    // Step 8: Verify packet summary
    await expect(page.getByRole("heading", { name: /packet summary|overview/i })).toBeVisible();
    
    // Step 9: Check for findings
    await expect(page.getByText(/findings|issues|problems/i)).toBeVisible();
    
    // Step 10: Verify scenario navigation
    const scenarioRail = page.getByRole("navigation", { name: /scenarios/i });
    await expect(scenarioRail).toBeVisible();
    
    // Step 11: Check evidence display
    const evidencePanel = page.getByRole("region", { name: /evidence/i });
    await expect(evidencePanel).toBeVisible();
    
    // Step 12: Verify review decision capability
    const decisionButton = page.getByRole("button", { name: /decision|mark as reviewed/i });
    await expect(decisionButton).toBeVisible();
    
    // Final verification: Complete workflow
    await expect(page.getByText(/review complete|finished/i)).toBeVisible();
  });

  test("should handle failure recovery in the workflow", async ({ page }) => {
    // Simulate a failure in artifact selection
    const importButton = page.getByRole("button", { name: /import|create/i });
    await importButton.click();
    
    // Select invalid artifacts
    const invalidSelector = page.getByRole("button", { name: /invalid|unsupported/i });
    if (await invalidSelector.isVisible()) {
      await invalidSelector.click();
      
      // Verify error handling
      await expect(page.getByText(/invalid|error|unsupported/i)).toBeVisible();
      
      // Recovery: Select valid artifacts
      const baselineSelector = page.getByRole("button", { name: /select baseline/i });
      await baselineSelector.click();
      
      const candidateSelector = page.getByRole("button", { name: /select candidate/i });
      await candidateSelector.click();
      
      // Continue with workflow
      const buildButton = page.getByRole("button", { name: /build|generate/i });
      await buildButton.click();
      
      // Verify recovery success
      await expect(page.getByText(/packet created|review ready/i)).toBeVisible();
    }
  });

  test("should maintain original data requirements", async ({ page }) => {
    // Start M1 workflow
    const importButton = page.getByRole("button", { name: /import|create/i });
    await importButton.click();
    
    // Select baseline artifacts
    const baselineSelector = page.getByRole("button", { name: /select baseline/i });
    await baselineSelector.click();
    
    // Select candidate artifacts
    const candidateSelector = page.getByRole("button", { name: /select candidate/i });
    await candidateSelector.click();
    
    // Build review packet
    const buildButton = page.getByRole("button", { name: /build|generate/i });
    await buildButton.click();
    
    // Verify original data is preserved
    await expect(page.getByText(/original data|baseline preserved/i)).toBeVisible();
    
    // Check metadata preservation
    const metadataPanel = page.getByRole("region", { name: /metadata|provenance/i });
    await expect(metadataPanel).toBeVisible();
    
    // Verify artifact checksums
    await expect(page.getByText(/checksum|hash/i)).toBeVisible();
  });

  test("should validate accessibility of the workflow", async ({ page }) => {
    // Complete the workflow
    const importButton = page.getByRole("button", { name: /import|create/i });
    await importButton.click();
    
    const baselineSelector = page.getByRole("button", { name: /select baseline/i });
    await baselineSelector.click();
    
    const candidateSelector = page.getByRole("button", { name: /select candidate/i });
    await candidateSelector.click();
    
    const buildButton = page.getByRole("button", { name: /build|generate/i });
    await buildButton.click();
    
    const reviewButton = page.getByRole("button", { name: /review|start review/i });
    await reviewButton.click();
    
    // Run accessibility tests on the review interface
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
    
    // Verify keyboard navigation
    await page.keyboard.press("Tab");
    const focusableElement = page.locator(":focus-visible");
    await expect(focusableElement).toBeVisible();
    
    // Verify screen reader support
    await expect(page.getByRole("alert")).toBeHidden(); // No unexpected alerts
    await expect(page.getByRole("status")).toBeVisible(); // Status information present
  });
});