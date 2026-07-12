import { test } from "node:test";
import assert from "node:assert/strict";
import { relocateRow } from "../rows";
import type { SpaceBundle, Requirement, CurrentState } from "../types";

const req = (id: string, space_id: string, sort = 1): Requirement => ({
  id,
  space_id,
  category: "",
  content: "",
  notes: null,
  sort,
});
const cs = (id: string, space_id: string, sort = 1): CurrentState => ({
  id,
  space_id,
  content: "",
  notes: null,
  sort,
});
const bundle = (
  id: string,
  reqs: Requirement[] = [],
  css: CurrentState[] = []
): SpaceBundle => ({
  space: { id, slug: id, name: id, sort: 1 },
  requirements: reqs,
  currentStates: css,
  photos: [],
});

test("relocateRow: 요구사항을 다른 공간으로 이동 + space_id·sort 갱신, 대상 끝에 추가", () => {
  const b = [bundle("a", [req("r1", "a", 1)]), bundle("b", [req("r2", "b", 5)])];
  const res = relocateRow(b, "requirement", "r1", "a", "b", 6);
  const a = res.find((x) => x.space.id === "a")!;
  const bb = res.find((x) => x.space.id === "b")!;
  assert.equal(a.requirements.length, 0);
  assert.deepEqual(bb.requirements.map((r) => r.id), ["r2", "r1"]);
  const moved = bb.requirements.find((r) => r.id === "r1")!;
  assert.equal(moved.space_id, "b");
  assert.equal(moved.sort, 6);
});

test("relocateRow: 현재상태도 동일하게 이동", () => {
  const b = [bundle("a", [], [cs("c1", "a", 1)]), bundle("b", [], [])];
  const res = relocateRow(b, "current", "c1", "a", "b", 2);
  assert.equal(res.find((x) => x.space.id === "a")!.currentStates.length, 0);
  const bb = res.find((x) => x.space.id === "b")!;
  assert.deepEqual(bb.currentStates.map((c) => c.id), ["c1"]);
  assert.equal(bb.currentStates[0].space_id, "b");
});

test("relocateRow: from===to 또는 행 없음 → 원본 그대로", () => {
  const b = [bundle("a", [req("r1", "a")])];
  assert.equal(relocateRow(b, "requirement", "r1", "a", "a", 2), b); // from===to
  assert.equal(relocateRow(b, "requirement", "nope", "a", "b", 2), b); // 행 없음
});

test("relocateRow: 무관한 공간 번들은 참조까지 그대로(불변)", () => {
  const other = bundle("c", [req("r3", "c")]);
  const b = [bundle("a", [req("r1", "a")]), bundle("b", []), other];
  const res = relocateRow(b, "requirement", "r1", "a", "b", 1);
  assert.equal(res.find((x) => x.space.id === "c"), other);
});
