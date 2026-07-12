import { test } from "node:test";
import assert from "node:assert/strict";
import { uploadPhoto, canPersist } from "../mutations";

// 이 테스트는 seed 모드(SUPABASE 미설정 → canPersist=false)에서 uploadPhoto 의
// 로컬 반환 분기(행 FK 매핑)를 검증한다. objectURL 은 브라우저 API 라 스텁.
(globalThis.URL as unknown as { createObjectURL: (f: unknown) => string }).createObjectURL =
  () => "blob:stub";
const fakeFile = { name: "a.png" } as unknown as File;

test("전제: 테스트 환경은 seed 모드(canPersist=false)", () => {
  assert.equal(canPersist, false);
});

test("uploadPhoto: kind=requirement → requirement_id 채우고 current_state_id=null", async () => {
  const p = await uploadPhoto("sp1", "requirement", "rq1", fakeFile, 0);
  assert.equal(p.kind, "requirement");
  assert.equal(p.requirement_id, "rq1");
  assert.equal(p.current_state_id, null);
  assert.equal(p.space_id, "sp1");
});

test("uploadPhoto: kind=current → current_state_id 채우고 requirement_id=null", async () => {
  const p = await uploadPhoto("sp2", "current", "cs9", fakeFile, 3);
  assert.equal(p.kind, "current");
  assert.equal(p.current_state_id, "cs9");
  assert.equal(p.requirement_id, null);
  assert.equal(p.sort, 3);
});
