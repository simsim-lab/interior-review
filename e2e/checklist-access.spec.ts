import { test, expect } from "@playwright/test";

// 보안 핵심: 비로그인(dev-bypass OFF)은 체크리스트에 접근할 수 없어야 한다.

// R6: /checklist 직접 접속 → 로그인으로 리다이렉트
test("R6: 비로그인 /checklist 접속은 /login?next=/checklist 로 리다이렉트한다", async ({
  page,
}) => {
  await page.goto("/checklist");
  await expect(page).toHaveURL(/\/login\?next=(%2F|\/)checklist/);
});

// R7: 리다이렉트 후 체크리스트 데이터(체크박스)가 전혀 렌더되지 않음
test("R7: 리다이렉트 후 체크리스트 항목이 노출되지 않는다", async ({ page }) => {
  await page.goto("/checklist");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);
});
