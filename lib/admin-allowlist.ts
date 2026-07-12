// 관리자 이메일 allowlist 판정 — 프레임워크 비의존 순수 로직(테스트 대상).

/** "a@x.com, B@y.com" → ["a@x.com","b@y.com"] (trim·소문자·빈값 제거). */
export function parseAllowlist(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * 이메일이 allowlist 에 있으면 true.
 * allowlist 가 비어 있으면(미설정) 아무도 admin 이 아니다(fail-closed).
 */
export function isEmailAllowed(
  email: string | null | undefined,
  allowlist: string[]
): boolean {
  if (!email) return false;
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.toLowerCase());
}
