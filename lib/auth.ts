import { cache } from "react";
import { createClient, SUPABASE_ENABLED } from "./supabase/server";
import { parseAllowlist, isEmailAllowed } from "./admin-allowlist";

/**
 * 관리자 판정 (서버 전용).
 *
 * 보안 원칙: "로그인된 아무 유저 = admin" 이 아니라 **allowlist 에 등록된 이메일만** admin.
 * (Supabase 셀프 가입이 켜져 있어도 임의 계정이 체크리스트를 열람하지 못하게 한다.
 *  DB 쪽도 supabase/schema.sql 의 is_admin() RLS 로 동일하게 차단한다.)
 *
 * - Supabase 연결됨: 유효 세션의 이메일이 ADMIN_EMAILS 에 있으면 admin.
 * - Supabase 미연결 + NEXT_PUBLIC_ADMIN_DEV_BYPASS=1 (production 아님): 로컬 미리보기용 admin.
 */
const ADMIN_EMAILS = parseAllowlist(process.env.ADMIN_EMAILS);

export function emailAllowed(email: string | null | undefined): boolean {
  return isEmailAllowed(email, ADMIN_EMAILS);
}

// 요청 단위 메모이즈 — 한 렌더에서 auth.getUser() Supabase 왕복을 1회로 축소.
const getUser = cache(async () => {
  if (!SUPABASE_ENABLED) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function isAdmin(): Promise<boolean> {
  if (!SUPABASE_ENABLED) {
    return (
      process.env.NODE_ENV !== "production" &&
      process.env.NEXT_PUBLIC_ADMIN_DEV_BYPASS === "1"
    );
  }
  const user = await getUser();
  return emailAllowed(user?.email);
}

export async function getAdminEmail(): Promise<string | null> {
  if (!SUPABASE_ENABLED) return null;
  const user = await getUser();
  return user?.email ?? null;
}
