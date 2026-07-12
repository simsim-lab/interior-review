"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, SUPABASE_ENABLED } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/checklist";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!SUPABASE_ENABLED) {
      setError(
        "Supabase 미연결 상태입니다. .env.local 에 키를 넣거나, 로컬 미리보기는 NEXT_PUBLIC_ADMIN_DEV_BYPASS=1 로 여세요."
      );
      return;
    }
    setBusy(true);
    const supabase = createClient();
    // 아이디만 입력하면 내부 이메일로 매핑 (admin → admin@example.com)
    const loginEmail = email.includes("@") ? email : `${email.trim()}@example.com`;
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    setBusy(false);
    if (error) {
      setError("로그인 실패: 아이디 또는 비밀번호를 확인하세요.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-soft border-t-4 border-primary p-8">
        <div className="flex items-center gap-2 text-secondary text-label-md font-label-md uppercase tracking-widest mb-2">
          <span className="material-symbols-outlined text-[18px]">
            admin_panel_settings
          </span>
          관리자 로그인
        </div>
        <h1 className="text-headline-lg font-headline-lg text-primary mb-6">
          체크리스트 접근
        </h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-label-md font-label-md text-secondary block mb-1">
              아이디
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="text-label-md font-label-md text-secondary block mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-caption text-error bg-error-container/60 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-xl hover:opacity-90 transition-all text-label-md font-label-md shadow-md active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">login</span>
            {busy ? "확인 중…" : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
