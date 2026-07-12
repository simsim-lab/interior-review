// 프레임워크 비의존 순수 유틸 (테스트 대상).

/** 임시 로컬 ID (Supabase 미연결 seed 모드용). crypto.randomUUID 우선. */
export function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `tmp-${Math.floor(performance.now() * 1000)}-${Math.floor(
        performance.now() % 1000
      )}`;
}

/**
 * 다음 sort 값 = 현재 최대 sort + 1.
 * (length 기반은 중간 항목 삭제 후 추가 시 sort 가 충돌하므로 지양.)
 */
export function nextSort(rows: { sort: number }[]): number {
  return rows.reduce((max, r) => Math.max(max, r.sort), 0) + 1;
}

/**
 * 낙관적 편집 실패 시 되돌릴 패치 — 패치된 필드의 "이전 값"만 캡처(다른 편집 보존).
 * before 가 없으면(항목 못 찾음) null → 호출부에서 복원 생략.
 */
export function revertPatch<T>(
  before: Record<string, unknown> | undefined,
  patch: Partial<T>
): Partial<T> | null {
  if (!before) return null;
  return Object.fromEntries(
    Object.keys(patch).map((k) => [k, before[k]])
  ) as Partial<T>;
}

/** 배열의 index 위치에 item 삽입(불변). index 는 [0, length] 로 클램프 — 원위치 복원용. */
export function insertAt<T>(list: T[], index: number, item: T): T[] {
  const next = [...list];
  next.splice(Math.min(Math.max(index, 0), next.length), 0, item);
  return next;
}
