"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, SUPABASE_ENABLED } from "@/lib/supabase/client";
import Spinner from "@/components/Spinner";

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      setError("로그인 실패: 이메일 또는 비밀번호를 확인하세요.");
      return;
    }
    // 성공: busy 를 유지해 리다이렉트+체크리스트 데이터 로딩까지 스피너를 이어간다.
    router.push(next);
    router.refresh();
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-6 py-12"
      style={{
        backgroundImage: `
          linear-gradient(rgba(246,241,230,0.84), rgba(246,241,230,0.93)),
          url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2000&q=70')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="hero-in w-full max-w-md rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-8 shadow-lift">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[22px]">lock</span>
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">
              관리자 로그인
            </p>
            <h1 className="font-headline-md text-2xl font-medium text-primary">
              체크리스트 접근
            </h1>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-label-md font-label-md text-secondary block mb-1">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="field w-full"
              placeholder="you@example.com"
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
              className="field w-full"
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
            {busy ? (
              <Spinner size={18} />
            ) : (
              <span className="material-symbols-outlined text-lg">login</span>
            )}
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
