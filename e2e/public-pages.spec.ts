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
