import { test } from "node:test";
import assert from "node:assert/strict";
import { findRowDetail, detailSpaces } from "../detail";
import type {
  SpaceBundle,
  Requirement,
  CurrentState,
  Photo,
} from "../types";

const req = (id: string, space_id: string, category = "분류"): Requirement => ({
  id,
  space_id,
  category,
  content: `내용 ${id}`,
  notes: `메모 ${id}`,
  sort: 1,
});
const cs = (id: string, space_id: string): CurrentState => ({
  id,
  space_id,
  content: `상태 ${id}`,
  notes: null,
  sort: 1,
});
const photo = (
  id: string,
  space_id: string,
  kind: "requirement" | "current",
  fk: string,
  sort: number
): Photo => ({
  id,
  space_id,
  kind,
  requirement_id: kind === "requirement" ? fk : null,
  current_state_id: kind === "current" ? fk : null,
  url: `http://x/${id}.jpg`,
  caption: null,
  sort,
});

const bundle = (
  id: string,
  reqs: Requirement[] = [],
  css: CurrentState[] = [],
  photos: Photo[] = []
): SpaceBundle => ({
  space: { id, slug: id, name: id.toUpperCase(), sort: 1 },
  requirements: reqs,
  currentStates: css,
  photos,
});

test("요구사항 행을 찾아 공간·분류·사진을 정규화한다", () => {
  const bundles = [
    bundle(
      "living",
      [req("rq-1", "living", "샷시")],
      [],
      [
        photo("p2", "living", "requirement", "rq-1", 2),
        photo("p1", "living", "requirement", "rq-1", 1),
        photo("pX", "living", "current", "cs-1", 1), // 다른 kind — 제외
      ]
    ),
  ];
  const d = findRowDetail(bundles, "requirement", "rq-1");
  assert.ok(d);
  assert.equal(d.space.name, "LIVING");
  assert.equal(d.category, "샷시");
  assert.equal(d.content, "내용 rq-1");
  // sort 순으로 정렬, kind 로 필터
  assert.deepEqual(d.photos.map((p) => p.id), ["p1", "p2"]);
});

test("현재상태 행은 category 가 null", () => {
  const bundles = [bundle("bath", [], [cs("cs-9", "bath")])];
  const d = findRowDetail(bundles, "current", "cs-9");
  assert.ok(d);
  assert.equal(d.category, null);
  assert.equal(d.content, "상태 cs-9");
});

test("없는 id 는 null", () => {
  const bundles = [bundle("living", [req("rq-1", "living")])];
  assert.equal(findRowDetail(bundles, "requirement", "nope"), null);
  // 모드가 다르면(현재상태에서 요구사항 id) 찾지 못한다
  assert.equal(findRowDetail(bundles, "current", "rq-1"), null);
});

test("공간 이동으로 사진이 다른 번들에 남아도 행 FK 로 찾는다", () => {
  // rq-1 은 kitchen 으로 옮겨졌지만 사진은 아직 living 번들에 남아있는 상황
  const bundles = [
    bundle("living", [], [], [photo("p1", "living", "requirement", "rq-1", 1)]),
    bundle("kitchen", [req("rq-1", "kitchen")]),
  ];
  const d = findRowDetail(bundles, "requirement", "rq-1");
  assert.ok(d);
  assert.equal(d.space.name, "KITCHEN");
  assert.deepEqual(d.photos.map((p) => p.id), ["p1"]);
});

test("detailSpaces: 공간 목록과 공간별 다음 sort(요구사항 기준)", () => {
  const bundles = [
    bundle("living", [req("rq-1", "living"), req("rq-2", "living")]), // 2행 → nextSort 2
    bundle("bath", []), // 빈 공간 → nextSort 1 (경계값)
  ];
  const { spaces, nextSortBySpace } = detailSpaces(bundles, "requirement");
  assert.deepEqual(spaces, [
    { id: "living", name: "LIVING", slug: "living" },
    { id: "bath", name: "BATH", slug: "bath" },
  ]);
  assert.equal(nextSortBySpace.living, 2);
  assert.equal(nextSortBySpace.bath, 1);
});

test("detailSpaces: current 모드는 currentStates 기준으로 sort 계산", () => {
  const bundles = [
    // req 는 무시되고 currentStates 로만 계산돼야 한다.
    bundle("bath", [req("rq-1", "bath")], [cs("cs-1", "bath")]),
    bundle("kitchen", [], []),
  ];
  const { nextSortBySpace } = detailSpaces(bundles, "current");
  assert.equal(nextSortBySpace.bath, 2); // cs 1행 → 2
  assert.equal(nextSortBySpace.kitchen, 1);
});
