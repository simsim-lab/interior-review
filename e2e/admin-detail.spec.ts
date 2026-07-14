import { test, expect } from "@playwright/test";

// dev-bypass ON(admin 서버). seed 모드라 편집은 저장되지 않고 로컬 낙관적 반영만 된다.

// D1: admin 은 상세(크게 보기)에서 바로 편집 모달을 열어 내용을 수정할 수 있다.
test("D1: 상세에서 편집 모달로 내용을 수정한다", async ({ page }) => {
  await page.goto("/requirements");
  // 행 끝 '크게 보기' 셰브론(링크)으로 상세 진입.
  await page.getByRole("link", { name: "크게 보기" }).first().click();
  await expect(page).toHaveURL(/\/requirements\/[^/]+$/);

  // admin 전용 '편집' 버튼 → 편집 모달.
  await page.getByRole("button", { name: "편집" }).click();
  const dialog = page.getByRole("dialog", { name: "항목 편집" });
  await expect(dialog).toBeVisible();

  await dialog
    .getByPlaceholder("요구사항 내용을 입력하세요")
    .fill("상세에서 수정한 내용 D1");
  await dialog.getByRole("button", { name: "확인" }).click();
  await expect(dialog).toBeHidden();

  // 상세 카드에 수정 내용이 낙관적으로 반영된다.
  await expect(page.getByText("상세에서 수정한 내용 D1")).toBeVisible();
});

// D2: 상세에도 공유 버튼이 있다(일반 리스트 화면이 아닐 때도 공유 가능).
test("D2: 상세 화면에서도 공유 버튼이 보인다", async ({ page }) => {
  await page.goto("/requirements");
  await page.getByRole("link", { name: "크게 보기" }).first().click();
  await expect(
    page.getByRole("button", { name: "공유", exact: true })
  ).toBeVisible();
});

// D3: 상세 편집 모달에서 공간을 바꿔 저장하면 상세(히어로 제목)가 새 공간으로 갱신된다.
test("D3: 상세에서 공간을 이동하면 새 공간으로 갱신된다", async ({ page }) => {
  await page.goto("/requirements");
  await page.getByRole("link", { name: "크게 보기" }).first().click();
  await expect(page).toHaveURL(/\/requirements\/[^/]+$/);

  await page.getByRole("button", { name: "편집" }).click();
  const dialog = page.getByRole("dialog", { name: "항목 편집" });
  await expect(dialog).toBeVisible();

  // 공간 select 를 마지막 공간(보조 주방)으로 변경 후 저장.
  await dialog.locator("select").first().selectOption({ label: "보조 주방" });
  await dialog.getByRole("button", { name: "확인" }).click();
  await expect(dialog).toBeHidden();

  // 히어로 제목이 이동한 공간명으로 갱신(낙관적 반영).
  await expect(
    page.getByRole("heading", { name: "보조 주방", level: 1 })
  ).toBeVisible();
});
