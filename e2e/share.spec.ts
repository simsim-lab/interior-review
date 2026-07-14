import { test, expect } from "@playwright/test";

// S1: 공간 탭 선택 시 URL(?space=slug)이 바뀐다 — 공간별 공유 링크.
test("S1: 공간 탭을 누르면 ?space= 로 URL 이 바뀐다", async ({ page }) => {
  await page.goto("/requirements");
  await page.getByRole("button", { name: "거실" }).first().click();
  await expect(page).toHaveURL(/\/requirements\?space=living$/);
});

// S2: ?space= 링크로 직접 진입하면 해당 공간 탭이 활성화되고 공유 버튼이 보인다.
test("S2: ?space= 로 진입하면 해당 공간의 공유 버튼이 보인다", async ({ page }) => {
  await page.goto("/requirements?space=living");
  await expect(
    page.getByRole("button", { name: "공유", exact: true })
  ).toBeVisible();
});

// S3: 행 내용을 누르면 그 행만 보는 상세(=공유) 페이지로 이동한다. 뷰어도 공유 버튼 사용.
test("S3: 행 '크게 보기' 클릭 시 단일 행 상세로 이동한다", async ({ page }) => {
  await page.goto("/requirements");
  // 행 끝 셰브론(접근성 이름 "크게 보기")으로 진입 — 내용 링크와 구분되는 고유 매치.
  await page.getByRole("link", { name: "크게 보기" }).first().click();
  await expect(page).toHaveURL(/\/requirements\/[^/]+$/);
  await expect(
    page.getByRole("link", { name: "요구사항 전체 보기" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "공유", exact: true })
  ).toBeVisible();
});

// S4: 없는 행 링크는 온-브랜드 안내 페이지(기본 404 아님)를 보여준다.
test("S4: 없는 행은 안내 페이지로 폴백한다", async ({ page }) => {
  await page.goto("/requirements/does-not-exist");
  await expect(
    page.getByRole("heading", { name: "항목을 찾을 수 없습니다" })
  ).toBeVisible();
});

// S5: 뷰어(비로그인)도 각 행을 공유할 수 있다 — 행 동작 열은 모두에게 노출.
test("S5: 뷰어에게도 행 공유 버튼이 보인다", async ({ page }) => {
  await page.goto("/requirements");
  await expect(
    page.getByRole("button", { name: "이 행 공유" }).first()
  ).toBeVisible();
});
