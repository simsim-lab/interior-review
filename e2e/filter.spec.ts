import { test, expect } from "@playwright/test";

// dev-bypass ON(admin 서버). 엑셀식 다중선택 컬럼 필터 상호작용 검증(seed 모드).
// seed(xlsx): 전체 탭은 여러 공간의 요구사항이 한 표에. "조명" 분류는 1행,
// "거실" 공간의 분류는 4종(샷시·난간·확장·안방 베란다).
test.beforeEach(async ({ page }) => {
  await page.goto("/requirements");
});

// R28: 분류 다중선택 → 행 필터 + 활성 배지 개수
test("R28: 분류 필터로 행이 걸러지고 헤더에 선택 개수 배지가 뜬다", async ({ page }) => {
  const rows = page.locator("tbody tr");
  await page.getByRole("button", { name: /^분류 필터/ }).click();
  const panel = page.getByRole("group", { name: "분류 필터" });
  await panel.getByText("조명", { exact: true }).click();

  await expect(rows).toHaveCount(1); // "조명" 분류 = 1행
  await expect(
    page.getByRole("button", { name: /분류 필터, 1개 선택됨/ })
  ).toBeVisible();
});

// R29: 공간 필터 선택 시 분류 옵션이 그 공간 값으로 좁혀진다(크로스 컬럼)
test("R29: 공간 선택 시 분류 옵션이 동적으로 좁혀진다", async ({ page }) => {
  await page.getByRole("button", { name: /^공간 필터/ }).click();
  const spacePanel = page.getByRole("group", { name: "공간 필터" });
  await spacePanel.getByText("거실", { exact: true }).click();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /^분류 필터/ }).click();
  const catPanel = page.getByRole("group", { name: "분류 필터" });
  // 거실의 분류는 4종(샷시·난간·확장·안방 베란다)
  await expect(catPanel.getByRole("checkbox")).toHaveCount(4);
});

// R30: "전체"로 초기화하면 선택이 해제되고 전 행이 복귀
test("R30: 필터 패널의 '전체'로 선택이 해제된다", async ({ page }) => {
  const rows = page.locator("tbody tr");
  const total = await rows.count();
  await page.getByRole("button", { name: /^분류 필터/ }).click();
  const panel = page.getByRole("group", { name: "분류 필터" });
  await panel.getByText("조명", { exact: true }).click();
  await expect(rows).toHaveCount(1);
  await panel.getByRole("button", { name: "전체" }).click();
  await expect(rows).toHaveCount(total); // 초기 전체 행 수로 복귀
});
