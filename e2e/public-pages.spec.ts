import { test, expect } from "@playwright/test";

// R2: 현재상태 공개 페이지 렌더 + seed 공간 데이터
test("R2: 현재상태 페이지가 제목과 seed 공간을 렌더한다", async ({ page }) => {
  await page.goto("/current-state");
  await expect(page.getByRole("heading", { name: "현재상태" })).toBeVisible();
  await expect(page.getByRole("button", { name: "거실" }).first()).toBeVisible();
});

// R3: 요구사항 공개 페이지 렌더
test("R3: 요구사항 페이지가 제목과 seed 공간을 렌더한다", async ({ page }) => {
  await page.goto("/requirements");
  await expect(page.getByRole("heading", { name: "요구사항" })).toBeVisible();
  await expect(page.getByRole("button", { name: "거실" }).first()).toBeVisible();
});

// R4: 비로그인 사이드바에 체크리스트 링크 없음
test("R4: 비로그인 사이드바에 체크리스트 링크가 없다", async ({ page }) => {
  await page.goto("/current-state");
  await expect(page.getByRole("link", { name: "체크리스트" })).toHaveCount(0);
});

// R31: 뷰어(비로그인)는 공간이 칩(드롭다운 아님)이고 편집 컨트롤이 없다
test("R31: 뷰어는 공간 칩·필터만 보이고 편집 컨트롤이 없다", async ({ page }) => {
  await page.goto("/requirements");
  await expect(page.getByRole("button", { name: "거실" }).first()).toBeVisible();
  // 편집 컨트롤 부재
  await expect(page.locator("select.space-select")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "공간 편집" })).toHaveCount(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  // 공간은 칩으로 표시
  await expect(page.locator("td span.chip").first()).toBeVisible();
  // 분류 필터는 뷰어도 사용 가능
  await expect(page.getByRole("button", { name: /^분류 필터/ }).first()).toBeVisible();
});
