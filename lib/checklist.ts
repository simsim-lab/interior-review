import type { ChecklistItem, ChecklistAnswer } from "./types";

export type ChecklistStats = {
  total: number;
  checked: number;
  /** 평점(>0)이 매겨진 항목들의 평균. 없으면 "—". */
  average: string;
  /** 체크 완료 비율 0~100 (%). */
  pct: number;
};

/** 통계·합성이 다루는 최소 답변 형태(항목 템플릿과 무관한 평가값). */
export type AnswerLike = { checked: boolean; rating: number };

/** 체크리스트 요약 통계 — UI와 분리된 순수 함수(테스트 대상). */
export function checklistStats(items: AnswerLike[]): ChecklistStats {
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

/** 미기록(답변 행 없음) 항목의 기본값 — 미체크·0점·빈 메모. */
export const EMPTY_ANSWER = { checked: false, rating: 0, note: null as string | null };

/** 공유 템플릿 항목 + 특정 업체의 답변을 합쳐, 항목 순서대로 뷰 행을 만든다. */
export function composeRows(
  items: ChecklistItem[],
  answers: ChecklistAnswer[],
  vendorId: string
): Array<{ item: ChecklistItem } & typeof EMPTY_ANSWER> {
  const byItem = new Map<string, ChecklistAnswer>();
  for (const a of answers) {
    if (a.vendor_id === vendorId) byItem.set(a.item_id, a);
  }
  return [...items]
    .sort((a, b) => a.sort - b.sort)
    .map((item) => {
      const a = byItem.get(item.id);
      return {
        item,
        checked: a?.checked ?? EMPTY_ANSWER.checked,
        rating: a?.rating ?? EMPTY_ANSWER.rating,
        note: a?.note ?? EMPTY_ANSWER.note,
      };
    });
}
