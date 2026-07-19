import { test } from "node:test";
import assert from "node:assert/strict";
import { checklistStats, composeRows, type AnswerLike } from "../checklist";
import type { ChecklistItem, ChecklistAnswer } from "../types";

const item = (p: Partial<AnswerLike>): AnswerLike => ({
  checked: false,
  rating: 0,
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

// ─── composeRows: 공유 템플릿 + 업체별 답변 합성 ───────────────────────────
const tmpl = (id: string, sort: number): ChecklistItem => ({ id, title: id, sort });
const ans = (p: Partial<ChecklistAnswer>): ChecklistAnswer => ({
  id: `a-${p.vendor_id}-${p.item_id}`,
  vendor_id: "v1",
  item_id: "ck-1",
  checked: false,
  rating: 0,
  note: null,
  ...p,
});

test("composeRows: 항목 sort 순으로 정렬되고 해당 업체 답변만 반영", () => {
  const items = [tmpl("ck-2", 2), tmpl("ck-1", 1)];
  const answers = [
    ans({ vendor_id: "v1", item_id: "ck-1", checked: true, rating: 5, note: "좋음" }),
    ans({ vendor_id: "v2", item_id: "ck-1", checked: true, rating: 1 }), // 다른 업체 — 무시
  ];
  const rows = composeRows(items, answers, "v1");
  assert.deepEqual(
    rows.map((r) => r.item.id),
    ["ck-1", "ck-2"]
  );
  assert.equal(rows[0].checked, true);
  assert.equal(rows[0].rating, 5);
  assert.equal(rows[0].note, "좋음");
});

test("composeRows: 답변 없는 항목은 기본값(미체크·0점·빈메모)", () => {
  const rows = composeRows([tmpl("ck-1", 1)], [], "v1");
  assert.deepEqual(
    { checked: rows[0].checked, rating: rows[0].rating, note: rows[0].note },
    { checked: false, rating: 0, note: null }
  );
});
