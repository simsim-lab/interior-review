import { test, expect } from "@playwright/test";

// dev-bypass ON(admin 서버). seed 모드라 편집은 저장되지 않고 로컬 낙관적 반영만 된다.

// 1x1 투명 PNG — 메모리 버퍼로 주입(픽스처 파일 불필요).
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

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

// R20: 행 삭제(X)는 확인 팝업을 거친다 — 취소하면 남고, 확인하면 지워진다.
test("R20: 항목 삭제는 확인 팝업 후에만 지워진다", async ({ page }) => {
  await page.goto("/requirements");
  const del = page.getByRole("button", { name: "항목 삭제" });
  await expect(del.first()).toBeVisible();
  const before = await del.count();

  // 취소 → 아무것도 안 지워짐
  page.once("dialog", (d) => d.dismiss());
  await del.first().click();
  await expect(del).toHaveCount(before);

  // 확인 → 한 행 삭제
  page.once("dialog", (d) => d.accept());
  await del.first().click();
  await expect(del).toHaveCount(before - 1);
});

// R21: 추가 모달에서 사진을 담아 저장하면 새 행에 썸네일이 붙는다(행 먼저 만들 필요 없음).
test("R21: 항목 추가 모달에서 사진을 담아 저장한다", async ({ page }) => {
  await page.goto("/requirements");
  await page.getByRole("button", { name: "요구사항 추가" }).click();

  const dialog = page.getByRole("dialog", { name: "항목 추가" });
  await expect(dialog).toBeVisible();
  await dialog
    .getByPlaceholder("요구사항 내용을 입력하세요")
    .fill("사진 딸린 새 요구사항");

  // 모달 내부 파일 입력에 주입 → 미리보기(제거 버튼) 등장
  await dialog
    .locator('input[type="file"]')
    .setInputFiles({ name: "t.png", mimeType: "image/png", buffer: PNG_1x1 });
  await expect(dialog.getByRole("button", { name: "사진 제거" })).toBeVisible();

  await dialog.getByRole("button", { name: "확인" }).click();
  await expect(dialog).toBeHidden();

  // 새 행 + 그 행 사진 셀에 썸네일
  const row = page
    .getByRole("row")
    .filter({ hasText: "사진 딸린 새 요구사항" });
  await expect(row).toBeVisible();
  await expect(row.getByRole("button", { name: "크게 보기" })).toBeVisible();
});

// R22: 편집 모달에도 사진 섹션이 있다(기존 행 사진 관리).
test("R22: 편집 모달에 사진 섹션이 있다", async ({ page }) => {
  await page.goto("/requirements");
  await page.getByRole("button", { name: "항목 편집" }).first().click();

  const dialog = page.getByRole("dialog", { name: "항목 편집" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("사진", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "사진 추가" })).toBeVisible();
});
