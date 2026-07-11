import { createClient, SUPABASE_ENABLED } from "./supabase/server";

/**
 * 현재 요청이 admin(로그인된 사용자)인지 서버에서 판정.
 * - Supabase 연결됨: 유효한 인증 세션이 있으면 admin.
 * - Supabase 미연결 + NEXT_PUBLIC_ADMIN_DEV_BYPASS=1 (production 아님): 미리보기용 admin 허용.
 *
 * 체크리스트는 이 판정이 true 일 때만 데이터를 로드/렌더한다.
 * (실제 데이터 차단은 Supabase RLS 가 담당 — anon 은 checklist select 정책이 없다.)
 */
export async function isAdmin(): Promise<boolean> {
  if (!SUPABASE_ENABLED) {
    return (
      process.env.NODE_ENV !== "production" &&
      process.env.NEXT_PUBLIC_ADMIN_DEV_BYPASS === "1"
    );
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

export async function getAdminEmail(): Promise<string | null> {
  if (!SUPABASE_ENABLED) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}
