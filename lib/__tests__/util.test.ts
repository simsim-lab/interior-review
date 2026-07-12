import { test } from "node:test";
import assert from "node:assert/strict";
import { nextSort, newId, revertPatch, insertAt } from "../util";

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

test("newId: 비어있지 않은 문자열 & 매 호출 고유", () => {
  const a = newId();
  const b = newId();
  assert.equal(typeof a, "string");
  assert.ok(a.length > 0);
  assert.notEqual(a, b);
});

test("revertPatch: 패치된 필드의 '이전 값'만 캡처(다른 편집 보존)", () => {
  const before = { title: "old", checked: true, rating: 3 };
  assert.deepEqual(revertPatch(before, { title: "new", checked: false }), {
    title: "old",
    checked: true,
  });
});

test("revertPatch: before 없으면(항목 못 찾음) null", () => {
  assert.equal(revertPatch(undefined, { title: "x" }), null);
});

test("revertPatch: 패치 키가 before 에 없으면 undefined 로 복원", () => {
  const r = revertPatch<{ a: number; b: number }>({ a: 1 }, { b: 2 });
  assert.deepEqual(r, { b: undefined });
});

test("insertAt: index 위치에 삽입(불변)", () => {
  assert.deepEqual(insertAt([1, 2, 3], 1, 9), [1, 9, 2, 3]);
});

test("insertAt: index 클램프 — length 초과→끝, 음수→앞", () => {
  assert.deepEqual(insertAt([1, 2], 5, 9), [1, 2, 9]);
  assert.deepEqual(insertAt([1, 2], -3, 9), [9, 1, 2]);
});

test("insertAt: 원본 배열 불변", () => {
  const src = [1, 2];
  insertAt(src, 0, 9);
  assert.deepEqual(src, [1, 2]);
});
