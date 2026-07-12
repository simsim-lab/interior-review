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
