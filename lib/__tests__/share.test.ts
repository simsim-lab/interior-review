import { test } from "node:test";
import assert from "node:assert/strict";
import { MODE_BASE, spacePath, rowPath } from "../share";

test("MODE_BASE 는 페이지 라우트와 일치한다", () => {
  assert.equal(MODE_BASE.requirement, "/requirements");
  assert.equal(MODE_BASE.current, "/current-state");
});

test("spacePath: 개별 공간은 ?space= 파라미터를 붙인다", () => {
  assert.equal(spacePath("requirement", "kitchen"), "/requirements?space=kitchen");
  assert.equal(spacePath("current", "living"), "/current-state?space=living");
});

test("spacePath: all/빈 값은 파라미터 없이 기본 경로", () => {
  assert.equal(spacePath("requirement", "all"), "/requirements");
  assert.equal(spacePath("requirement", null), "/requirements");
  assert.equal(spacePath("current", undefined), "/current-state");
  assert.equal(spacePath("current", ""), "/current-state");
});

test("spacePath: slug 를 URL 인코딩한다", () => {
  assert.equal(
    spacePath("requirement", "sub kitchen"),
    "/requirements?space=sub%20kitchen"
  );
});

test("rowPath: 모드 기본 경로 뒤에 행 id 를 붙인다", () => {
  assert.equal(rowPath("requirement", "rq-1"), "/requirements/rq-1");
  assert.equal(rowPath("current", "cs-9"), "/current-state/cs-9");
});
