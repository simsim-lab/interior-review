import { test, expect } from "@playwright/test";

// dev-bypass ON(admin 서버). seed 체크리스트: 21항목 · 전부 미체크(0%) · 평점 전부 0(평균 "—").
// seed 모드라 편집은 저장되지 않고 로컬 낙관적 반영만 된다.
test.beforeEach(async ({ page }) => {
  await page.goto("/checklist");
});

// R9/R11: 접근 허용 + nav 링크 + 항목 렌더
test("R9/R11: dev-bypass 시 체크리스트가 열리고 nav 링크와 항목이 보인다", async ({
  page,
}) => {
  await expect(page).toHaveURL(/\/checklist$/);
  await expect(page.getByRole("link", { name: "체크리스트" })).toBeVisible();
  await expect(page.getByText("21개 항목")).toBeVisible();
});

// R10: 요약 통계 — 진행률(체크 수/전체)·평균 평점 라벨
test("R10: 요약 통계(진행률·평균 평점)가 표시된다", async ({ page }) => {
  await expect(page.getByText("평균 평점")).toBeVisible();
  await expect(page.getByText("0 / 21 항목")).toBeVisible(); // seed: 체크 0 / 전체 21
});

// R12: 항목 추가 → 항목 수 증가
test("R12: 항목 추가 버튼으로 항목이 늘어난다", async ({ page }) => {
  const boxes = page.locator('input[type="checkbox"]');
  await expect(boxes).toHaveCount(21);
  await page.getByRole("button", { name: "항목 추가" }).click();
  await expect(boxes).toHaveCount(22);
});

// R13: 체크 토글 → 완료 수/진행률 즉시 반영
test("R13: 체크박스 토글이 완료 수·진행률에 반영된다", async ({ page }) => {
  await expect(page.getByText("0개 완료")).toBeVisible(); // seed: 완료 0
  await page
    .locator("div.lift")
    .first()
    .locator('input[type="checkbox"]')
    .check();
  await expect(page.getByText("1개 완료")).toBeVisible();
});

// R14: 별점 클릭 → active 개수 반영
test("R14: 별점 클릭이 반영된다", async ({ page }) => {
  const firstItem = page.locator("div.lift").first();
  await expect(firstItem.locator("span.rating-star.active")).toHaveCount(0); // seed 0
  await firstItem.locator("span.rating-star").nth(3).click(); // 4번째 별
  await expect(firstItem.locator("span.rating-star.active")).toHaveCount(4);
});
