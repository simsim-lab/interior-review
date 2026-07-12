import { test } from "node:test";
import assert from "node:assert/strict";
import { requirementCategories, effectiveCategory } from "../filter";
import type { SpaceBundle, Requirement } from "../types";

const req = (id: string, category: string): Requirement => ({
  id,
  space_id: "s",
  category,
  content: "",
  notes: null,
  sort: 1,
});

const bundle = (reqs: Requirement[]): SpaceBundle => ({
  space: { id: "s", slug: "s", name: "s", sort: 1 },
  requirements: reqs,
  currentStates: [],
  photos: [],
});

test("requirementCategories: 고유·trim·빈값 제외, 등장 순서 유지", () => {
  const res = requirementCategories([
    bundle([req("1", "조명"), req("2", " 바닥 "), req("3", "")]),
    bundle([req("4", "조명"), req("5", "설비")]),
  ]);
  assert.deepEqual(res, ["조명", "바닥", "설비"]);
});

test("requirementCategories: 빈 입력 → []", () => {
  assert.deepEqual(requirementCategories([]), []);
  assert.deepEqual(requirementCategories([bundle([])]), []);
});

test("effectiveCategory: 목록에 있으면 선택 유지", () => {
  assert.equal(effectiveCategory("조명", ["조명", "바닥"]), "조명");
});

test("effectiveCategory: 선택 분류가 사라지면 'all' 폴백", () => {
  assert.equal(effectiveCategory("조명", ["바닥"]), "all"); // 분류 삭제됨
  assert.equal(effectiveCategory("조명", []), "all"); // 분류 없음
  assert.equal(effectiveCategory("all", ["조명"]), "all"); // 이미 전체
});
