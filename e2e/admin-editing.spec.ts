import { test, expect } from "@playwright/test";

// dev-bypass ON(admin 서버). seed 모드라 편집은 저장되지 않고 로컬 낙관적 반영만 된다.

// R15: 공간 편집 모달에서 공간 추가 → 새 탭 생성 (낙관적 반영)
test("R15: 공간 편집으로 새 공간 탭이 생긴다", async ({ page }) => {
  await page.goto("/current-state");
  await expect(page.getByRole("button", { name: "거실" }).first()).toBeVisible();

  await page.getByRole("button", { name: "공간 편집" }).click();
  const dialog = page.getByRole("dialog", { name: "공간 편집" });
  await dialog.getByPlaceholder("새 공간 이름").fill("테스트공간");
  await dialog.getByRole("button", { name: "추가" }).click();
  await page.keyboard.press("Escape"); // 모달 닫기

  await expect(page.getByRole("button", { name: "테스트공간" })).toBeVisible();
});

// R16: seed 모드 미리보기 배너 표시(편집 미저장 안내)
test("R16: seed 모드에서 미리보기 배너가 표시된다", async ({ page }) => {
  await page.goto("/current-state");
  await expect(
    page.getByText("미리보기 모드 — 편집·업로드는 저장되지 않습니다", {
      exact: false,
    })
  ).toBeVisible();
});
