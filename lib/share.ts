// 공유 링크 경로 헬퍼 — 공간/행을 URL 로 지목한다.
//  · 공간: 쿼리 파라미터(?space=slug) — SpaceView 한 곳에서 탭 state 와 동기화.
//  · 행:   전용 상세 경로(/requirements/{id}) — "크게 보기" 이자 공유 대상.
// origin(host)은 클라이언트에서 window.location.origin 을 붙여 절대 URL 로 만든다.

export type ShareMode = "requirement" | "current";

/** 모드 → 기본 경로. 페이지 라우트와 1:1. */
export const MODE_BASE: Record<ShareMode, string> = {
  requirement: "/requirements",
  current: "/current-state",
};

/** 공간 탭 공유 경로. "all"·빈 값이면 파라미터 없이 기본 경로. */
export function spacePath(mode: ShareMode, slug: string | null | undefined): string {
  const base = MODE_BASE[mode];
  return slug && slug !== "all" ? `${base}?space=${encodeURIComponent(slug)}` : base;
}

/** 단일 행 상세(크게 보기 = 공유) 경로. */
export function rowPath(mode: ShareMode, id: string): string {
  return `${MODE_BASE[mode]}/${id}`;
}
