import { test, expect } from "@playwright/test";

const pages = ["/dashboard", "/items"];

for (const path of pages) {
  for (const width of [1280, 1440, 1728, 1920, 2560]) {
    test(`layout @ ${width}px with sidebar open: ${path}`, async ({ page, browserName }) => {
      test.skip(browserName === "webkit" && width === 2560, "Skip if local runner cannot resize that wide");
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);

      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();
      const box = await h1.boundingBox();
      expect(box?.width).toBeGreaterThan(0);

      const hasHScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHScroll).toBeFalsy();

      const tooltip = page.locator('[data-radix-tooltip-content], [role="tooltip"]');
      await expect(tooltip).toHaveCount(0);
    });
  }
}
