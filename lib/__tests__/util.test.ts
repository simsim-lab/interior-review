import { test } from "node:test";
import assert from "node:assert/strict";
import { nextSort } from "../util";

test("nextSort: 빈 배열이면 1", () => {
  assert.equal(nextSort([]), 1);
});

test("nextSort: 최대 sort + 1 (length 기반 아님 — 중간 삭제 충돌 방지)", () => {
  // [1,2,3] 에서 sort=2 삭제 → [1,3]. length+1=3(기존 3과 충돌), nextSort=4(정상)
  assert.equal(nextSort([{ sort: 1 }, { sort: 3 }]), 4);
});

test("nextSort: 순서 무관 + 0 처리", () => {
  assert.equal(nextSort([{ sort: 5 }, { sort: 2 }]), 6);
  assert.equal(nextSort([{ sort: 0 }]), 1);
});
