import type { ChecklistItem } from "./types";

export type ChecklistStats = {
  total: number;
  checked: number;
  /** 평점(>0)이 매겨진 항목들의 평균. 없으면 "—". */
  average: string;
  /** 체크 완료 비율 0~100 (%). */
  pct: number;
};

/** 체크리스트 요약 통계 — UI와 분리된 순수 함수(테스트 대상). */
export function checklistStats(items: ChecklistItem[]): ChecklistStats {
  const total = items.length;
  const checked = items.filter((i) => i.checked).length;
  const rated = items.filter((i) => i.rating > 0);
  const average =
    rated.length > 0
      ? (rated.reduce((s, i) => s + i.rating, 0) / rated.length).toFixed(1)
      : "—";
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
  return { total, checked, average, pct };
}
