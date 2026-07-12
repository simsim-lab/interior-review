import { test, expect, type Page } from "@playwright/test";

// R25: 페이지 이동이 즉시 끝나지 않을 때 "처리 중" 스피너가 보인다.
// 사이드바 링크는 useLinkStatus(NavSpinner)로 이동 진행 중 아이콘 자리에 스피너를 띄운다.
// seed 모드는 응답이 즉각적이라, 목적지(RSC) 응답을 게이트로 붙잡아 pending 을 유지시켜 검증.

/** /requirements 로 가는 모든 요청(프리페치·소프트내비)을 release() 전까지 붙잡는다. */
async function gateRequirements(page: Page) {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/requirements*", async (route) => {
    await gate;
    await route.continue();
  });
  return () => release();
}

test("R25: 페이지 이동 중 사이드바에 로딩 스피너가 표시된다", async ({ page }) => {
  const release = await gateRequirements(page);

  await page.goto("/current-state");
  await expect(page.getByRole("heading", { name: "현재상태" })).toBeVisible();

  await page.locator("aside").getByRole("link", { name: "요구사항" }).click();

  // 응답이 게이트에 붙잡힌 동안 "이동 중" 스피너가 보여야 한다.
  const spinner = page.getByTestId("nav-pending");
  await expect(spinner).toBeVisible();
  // 통일 스피너(.spinner 회전 애니메이션 훅)를 사용한다.
  await expect(spinner.locator("svg.spinner")).toBeVisible();

  release(); // 응답 해제 → 목적지 렌더, 스피너 사라짐

  await expect(page.getByRole("heading", { name: "요구사항" })).toBeVisible();
  await expect(spinner).toHaveCount(0);
});

test("R25b: 이동이 끝나면 스피너가 사라지고 아이콘으로 복귀한다", async ({ page }) => {
  await page.goto("/current-state");
  await page.locator("aside").getByRole("link", { name: "요구사항" }).click();
  // 게이트 없이 정상 이동 — 완료 후 pending 스피너가 남지 않아야 한다.
  await expect(page.getByRole("heading", { name: "요구사항" })).toBeVisible();
  await expect(page.getByTestId("nav-pending")).toHaveCount(0);
});
