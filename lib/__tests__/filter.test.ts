import { test } from "node:test";
import assert from "node:assert/strict";
import {
  requirementCategories,
  spaceSlugs,
  pruneSelection,
  matchesFilter,
} from "../filter";
import type { SpaceBundle, Requirement } from "../types";

const req = (id: string, category: string): Requirement => ({
  id,
  space_id: "s",
  category,
  content: "",
  notes: null,
  sort: 1,
});

const bundle = (
  name: string,
  reqs: Requirement[],
  slug = name
): SpaceBundle => ({
  space: { id: slug, slug, name, sort: 1 },
  requirements: reqs,
  currentStates: [],
  photos: [],
});

test("requirementCategories: 고유·trim·빈값 제외, 등장 순서 유지", () => {
  const res = requirementCategories([
    bundle("s1", [req("1", "조명"), req("2", " 바닥 "), req("3", "")]),
    bundle("s2", [req("4", "조명"), req("5", "설비")]),
  ]);
  assert.deepEqual(res, ["조명", "바닥", "설비"]);
});

test("requirementCategories: 빈 입력 → []", () => {
  assert.deepEqual(requirementCategories([]), []);
  assert.deepEqual(requirementCategories([bundle("s", [])]), []);
});

test("spaceSlugs: 번들의 공간 slug 를 순서대로(이름 아님)", () => {
  assert.deepEqual(
    spaceSlugs([
      bundle("욕실", [], "bath-1"),
      bundle("욕실", [], "bath-2"), // 이름 중복이어도 slug 로 구분
    ]),
    ["bath-1", "bath-2"]
  );
  assert.deepEqual(spaceSlugs([]), []);
});

test("pruneSelection: 가용 목록에 없는 선택 제거, 가용 순서 유지", () => {
  assert.deepEqual(pruneSelection(["조명", "바닥"], ["바닥", "조명", "설비"]), [
    "바닥",
    "조명",
  ]);
  assert.deepEqual(pruneSelection(["없음"], ["조명"]), []); // 삭제된 값
  assert.deepEqual(pruneSelection([], ["조명"]), []); // 선택 없음
});

test("matchesFilter: 선택 없으면 전부 통과, 있으면 포함 여부", () => {
  assert.equal(matchesFilter("조명", []), true); // 필터 없음 → 통과
  assert.equal(matchesFilter("조명", ["조명", "바닥"]), true);
  assert.equal(matchesFilter("설비", ["조명", "바닥"]), false);
});
