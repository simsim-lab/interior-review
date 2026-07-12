import { test, expect } from "@playwright/test";

// R1: 루트 진입 리다이렉트
test("R1: / 는 /current-state 로 리다이렉트한다", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/current-state$/);
});
