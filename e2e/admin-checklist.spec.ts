import { test, expect } from "@playwright/test";

// dev-bypass ON(admin 서버). seed 체크리스트: 10항목 · 완료 1(10%) · 평균 3.5 · ck-1 별점 3.
test.beforeEach(async ({ page }) => {
  await page.goto("/checklist");
});

// R9/R11: 접근 허용 + nav 링크 + 항목 렌더
test("R9/R11: dev-bypass 시 체크리스트가 열리고 nav 링크와 항목이 보인다", async ({
  page,
}) => {
  await expect(page).toHaveURL(/\/checklist$/);
  await expect(page.getByRole("link", { name: "체크리스트" })).toBeVisible();
  await expect(page.getByText("10개 항목")).toBeVisible();
});

// R10: 요약 통계
test("R10: 요약 통계(평균 평점)가 표시된다", async ({ page }) => {
  await expect(page.getByText("평균 평점")).toBeVisible();
  await expect(page.getByText("3.5")).toBeVisible(); // seed 평균
});

// R12: 항목 추가 → 항목 수 증가
test("R12: 항목 추가 버튼으로 항목이 늘어난다", async ({ page }) => {
  const boxes = page.locator('input[type="checkbox"]');
  await expect(boxes).toHaveCount(10);
  await page.getByRole("button", { name: "항목 추가" }).click();
  await expect(boxes).toHaveCount(11);
});

// R13: 체크 토글 → 완료 수/진행률 즉시 반영
test("R13: 체크박스 토글이 완료 수·진행률에 반영된다", async ({ page }) => {
  await expect(page.getByText("1개 완료")).toBeVisible();
  await page
    .locator("div.lift")
    .first()
    .locator('input[type="checkbox"]')
    .check();
  await expect(page.getByText("2개 완료")).toBeVisible();
});

// R14: 별점 클릭 → active 개수 반영
test("R14: 별점 클릭이 반영된다", async ({ page }) => {
  const firstItem = page.locator("div.lift").first();
  await expect(firstItem.locator("span.rating-star.active")).toHaveCount(3); // seed 3
  await firstItem.locator("span.rating-star").nth(3).click(); // 4번째 별
  await expect(firstItem.locator("span.rating-star.active")).toHaveCount(4);
});
