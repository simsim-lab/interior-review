import { test } from "node:test";
import assert from "node:assert/strict";
import { checklistStats } from "../checklist";
import type { ChecklistItem } from "../types";

const item = (p: Partial<ChecklistItem>): ChecklistItem => ({
  id: "x",
  title: "",
  checked: false,
  rating: 0,
  note: null,
  sort: 0,
  ...p,
});

test("checklistStats: 빈 목록", () => {
  assert.deepEqual(checklistStats([]), {
    total: 0,
    checked: 0,
    average: "—",
    pct: 0,
  });
});

test("checklistStats: 평균은 rating>0 항목만 (0점 제외)", () => {
  const s = checklistStats([
    item({ rating: 4 }),
    item({ rating: 2 }),
    item({ rating: 0 }),
  ]);
  assert.equal(s.average, "3.0"); // (4+2)/2 = 3.0, rating 0 은 분모에서 제외
});

test("checklistStats: pct = 체크/전체 반올림", () => {
  const s = checklistStats([item({ checked: true }), item({}), item({})]);
  assert.equal(s.total, 3);
  assert.equal(s.checked, 1);
  assert.equal(s.pct, 33);
});

test("checklistStats: 평가 없으면 average '—'", () => {
  assert.equal(checklistStats([item({}), item({})]).average, "—");
});
