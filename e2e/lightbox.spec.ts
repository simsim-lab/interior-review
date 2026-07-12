import { test, expect } from "@playwright/test";

// 회귀 방지 핵심: 사진 클릭 시 라이트박스가 "전체화면"으로 떠야 한다.
// (과거 조상 transform 애니메이션이 position:fixed 기준을 바꿔 작은 박스로 뜨던 회귀 →
//  createPortal(document.body) 로 수정. 이 부류는 브라우저 E2E 만 잡을 수 있음.)
//
// seed 에는 사진이 없으므로(SEED_PHOTOS=[]) admin(dev-bypass ON) 화면에서 사진을 업로드해
// 썸네일을 만든 뒤 검증한다. seed 모드 업로드는 objectURL 로 로컬 반영된다.
// 사진은 이제 "행 단위"라 행이 있는 /requirements(seed 요구사항 다수)에서 검증한다.
// 1x1 투명 PNG — 메모리 버퍼로 주입(픽스처 파일 불필요).
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

test("R17-R19: 사진 업로드 → 클릭 → 전체화면 라이트박스 → ESC 로 닫힘", async ({
  page,
}) => {
  await page.goto("/requirements");

  // 첫 행(전체 공간 첫 요구사항)의 사진 셀에 업로드 → 썸네일 생성 (숨은 file input 에 직접 주입)
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer: PNG_1x1,
  });

  // R17: 썸네일(PhotoGrid 의 button[title="크게 보기"]) 클릭 → 오버레이 등장
  const thumb = page.locator('button[title="크게 보기"]').first();
  await expect(thumb).toBeVisible();
  await thumb.click();

  const overlay = page.locator("div.fixed.inset-0").last();
  await expect(overlay).toBeVisible();

  // R18: 오버레이가 뷰포트 전체(폭·높이 98%↑)를 덮는지 — 이 단언이 회귀를 직접 잡는다.
  const box = await overlay.boundingBox();
  const vp = page.viewportSize();
  expect(box).not.toBeNull();
  expect(vp).not.toBeNull();
  expect(box!.width).toBeGreaterThan(vp!.width * 0.98);
  expect(box!.height).toBeGreaterThan(vp!.height * 0.98);

  // R19: ESC 로 닫힘
  await page.keyboard.press("Escape");
  await expect(overlay).toBeHidden();
});
