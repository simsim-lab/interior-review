"use client";

import { createBrowserClient } from "@supabase/ssr";

// 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트 — anon key.
// admin 로그인 세션은 쿠키에 저장되어 서버 컴포넌트와 공유된다.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const SUPABASE_ENABLED = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
