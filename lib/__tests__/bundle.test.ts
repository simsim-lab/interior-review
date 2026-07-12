import { test } from "node:test";
import assert from "node:assert/strict";
import { bundle } from "../bundle";
import type { Space, Requirement } from "../types";

const sp = (id: string, sort: number): Space => ({ id, slug: id, name: id, sort });
const req = (id: string, space_id: string, sort: number): Requirement => ({
  id,
  space_id,
  category: "",
  content: "",
  notes: null,
  sort,
});

test("bundle: 공간을 sort 순으로 정렬", () => {
  const res = bundle([sp("b", 2), sp("a", 1)], [], [], []);
  assert.deepEqual(
    res.map((r) => r.space.id),
    ["a", "b"]
  );
});

test("bundle: 요구사항을 space_id 로 묶고 sort 정렬", () => {
  const res = bundle([sp("a", 1)], [req("r2", "a", 2), req("r1", "a", 1)], [], []);
  assert.deepEqual(
    res[0].requirements.map((r) => r.id),
    ["r1", "r2"]
  );
});

test("bundle: 존재하지 않는 space_id(고아) 항목은 어떤 번들에도 포함되지 않음", () => {
  const res = bundle([sp("a", 1)], [req("r1", "ghost", 1)], [], []);
  assert.equal(res.length, 1);
  assert.equal(res[0].requirements.length, 0);
});

test("bundle: 빈 입력 → 빈 배열", () => {
  assert.deepEqual(bundle([], [], [], []), []);
});
