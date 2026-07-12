import type { ReactNode } from "react";

/**
 * 페이지 상단 풀-블리드 히어로.
 * 실제 인테리어 사진 위에 파인 스크림을 얹어 세리프 타이틀을 얹는다.
 * 사진이 로드되지 않아도 밑에 깔린 그러데이션이 항상 배경을 채운다(안전한 폴백).
 */
export default function Hero({
  image,
  eyebrow,
  title,
  subtitle,
  icon,
  meta,
}: {
  image: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: string;
  meta?: ReactNode;
}) {
  return (
    <header
      className="hero-in relative isolate overflow-hidden bg-primary"
      style={{
        backgroundImage: `
          linear-gradient(180deg,
            rgba(30,22,14,0.08) 0%,
            rgba(30,22,14,0.15) 20%,
            rgba(30,22,14,0.24) 36%,
            rgba(30,22,14,0.34) 50%,
            rgba(30,22,14,0.45) 63%,
            rgba(30,22,14,0.54) 74%,
            rgba(30,22,14,0.52) 83%,
            rgba(30,22,14,0.43) 90%,
            rgba(30,22,14,0.30) 95%,
            rgba(30,22,14,0.18) 100%),
          linear-gradient(90deg, rgba(30,22,14,0.42) 0%, rgba(30,22,14,0.18) 32%, rgba(30,22,14,0) 60%),
          url('${image}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* 하단 종이색 페이드 — 촘촘한 다단계 그러데이션으로 본문과 매끄럽게 이어짐 */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{
          background:
            "linear-gradient(to top, #f6f1e6 0%, rgba(246,241,230,0.985) 7%, rgba(246,241,230,0.94) 15%, rgba(246,241,230,0.86) 23%, rgba(246,241,230,0.75) 31%, rgba(246,241,230,0.62) 40%, rgba(246,241,230,0.49) 49%, rgba(246,241,230,0.37) 58%, rgba(246,241,230,0.26) 67%, rgba(246,241,230,0.16) 76%, rgba(246,241,230,0.08) 85%, rgba(246,241,230,0.03) 93%, rgba(246,241,230,0) 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[300px] w-full max-w-container-max flex-col justify-end gap-4 px-margin-mobile pb-12 pt-16 md:min-h-[380px] md:px-margin-desktop md:pb-14">
        <span className="flex items-center gap-2 text-label-md font-label-md uppercase tracking-[0.18em] text-on-primary/85">
          {icon && (
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          )}
          {eyebrow}
        </span>

        <h1 className="max-w-3xl font-display-lg text-[clamp(2.4rem,5vw,3.6rem)] font-medium leading-[1.05] tracking-tight text-on-primary">
          {title}
        </h1>

        {subtitle && (
          <p className="max-w-xl text-body-md leading-relaxed text-on-primary/80">
            {subtitle}
          </p>
        )}

        {meta && <div className="mt-1 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
    </header>
  );
}

/** 히어로 하단에 놓는 유리질 메타 칩. */
export function HeroChip({
  icon,
  children,
}: {
  icon?: string;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-on-primary/25 bg-on-primary/10 px-3 py-1 text-caption font-medium text-on-primary backdrop-blur-sm">
      {icon && (
        <span className="material-symbols-outlined text-[15px]">{icon}</span>
      )}
      {children}
    </span>
  );
}
