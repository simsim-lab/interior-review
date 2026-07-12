import { test } from "node:test";
import assert from "node:assert/strict";
import { bundle } from "../bundle";
import type { Space, Requirement, CurrentState, Photo } from "../types";

const sp = (id: string, sort: number): Space => ({ id, slug: id, name: id, sort });
const req = (id: string, space_id: string, sort: number): Requirement => ({
  id,
  space_id,
  category: "",
  content: "",
  notes: null,
  sort,
});
const cs = (id: string, space_id: string, sort: number): CurrentState => ({
  id,
  space_id,
  content: "",
  notes: null,
  sort,
});
const ph = (id: string, space_id: string, sort: number): Photo => ({
  id,
  space_id,
  kind: "requirement",
  url: "",
  caption: null,
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

test("bundle: 현재상태를 space_id 로 묶고 sort 정렬", () => {
  const res = bundle([sp("a", 1)], [], [cs("c2", "a", 2), cs("c1", "a", 1)], []);
  assert.deepEqual(
    res[0].currentStates.map((c) => c.id),
    ["c1", "c2"]
  );
});

test("bundle: 사진을 space_id 로 묶고 sort 정렬", () => {
  const res = bundle([sp("a", 1)], [], [], [ph("p2", "a", 2), ph("p1", "a", 1)]);
  assert.deepEqual(
    res[0].photos.map((p) => p.id),
    ["p1", "p2"]
  );
});

test("bundle: 여러 공간 교차 배정 — 각 항목이 올바른 공간에만", () => {
  const res = bundle(
    [sp("a", 1), sp("b", 2)],
    [req("ra", "a", 1), req("rb", "b", 1)],
    [cs("ca", "a", 1), cs("cb", "b", 1)],
    [ph("pa", "a", 1), ph("pb", "b", 1)]
  );
  const a = res.find((r) => r.space.id === "a")!;
  const b = res.find((r) => r.space.id === "b")!;
  assert.deepEqual(a.requirements.map((r) => r.id), ["ra"]);
  assert.deepEqual(a.currentStates.map((c) => c.id), ["ca"]);
  assert.deepEqual(a.photos.map((p) => p.id), ["pa"]);
  assert.deepEqual(b.requirements.map((r) => r.id), ["rb"]);
  assert.deepEqual(b.currentStates.map((c) => c.id), ["cb"]);
  assert.deepEqual(b.photos.map((p) => p.id), ["pb"]);
});

test("bundle: 고아 항목(없는 space_id)은 req/current/photo 셋 다 제외", () => {
  const res = bundle(
    [sp("a", 1)],
    [req("r1", "ghost", 1)],
    [cs("c1", "ghost", 1)],
    [ph("p1", "ghost", 1)]
  );
  assert.equal(res.length, 1);
  assert.equal(res[0].requirements.length, 0);
  assert.equal(res[0].currentStates.length, 0);
  assert.equal(res[0].photos.length, 0);
});

test("bundle: 빈 입력 → 빈 배열", () => {
  assert.deepEqual(bundle([], [], [], []), []);
});
