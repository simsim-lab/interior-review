"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 공유 버튼 — 브라우저 네이티브 공유 시트(Web Share API)를 먼저 시도하고,
 * 지원하지 않는 환경(데스크톱 Firefox 등)에서는 링크 복사로 폴백한다.
 *  · navigator.share → 모바일/일부 데스크톱의 OS 공유 시트(카톡·메시지 등으로 바로 전달).
 *  · 미지원/실패 → clipboard 복사, 그마저 안 되면 execCommand 폴백.
 * path(앞부분 /...)에 현재 origin 을 붙여 절대 URL 로 공유한다.
 */
export default function ShareButton({
  path,
  shareTitle,
  label = "공유",
  copiedLabel = "복사됨",
  iconOnly = false,
  variant = "ghost",
  title,
}: {
  path: string;
  shareTitle: string; // 공유 시트에 실릴 제목/텍스트
  label?: string;
  copiedLabel?: string;
  iconOnly?: boolean;
  variant?: "ghost" | "solid" | "outline";
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  function flashCopied() {
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  async function copyLink(url: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      flashCopied();
    } catch {
      // 복사 실패 시 조용히 무시(주소창에서 직접 복사 가능).
    }
  }

  async function onShare() {
    const url =
      typeof window !== "undefined" ? window.location.origin + path : path;
    // 1) 네이티브 공유 시트
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareTitle, url });
        return; // 시트로 공유됨 — 별도 피드백 불필요
      } catch (err) {
        // 사용자가 시트를 닫음(취소) → 아무 것도 하지 않음
        if (err instanceof DOMException && err.name === "AbortError") return;
        // 그 외 오류는 복사로 폴백
      }
    }
    // 2) 폴백: 링크 복사
    await copyLink(url);
  }

  const icon = copied ? "check" : "share";
  const text = copied ? copiedLabel : label;

  if (iconOnly) {
    const tone =
      variant === "solid"
        ? "text-on-primary"
        : "text-secondary hover:text-primary";
    return (
      <button
        type="button"
        onClick={onShare}
        title={title ?? label}
        aria-label={copied ? copiedLabel : label}
        className={`grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-surface-container ${tone}`}
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[19px]">
          {icon}
        </span>
      </button>
    );
  }

  const cls =
    variant === "solid"
      ? "bg-primary text-on-primary hover:opacity-90"
      : variant === "outline"
      ? "border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
      : "text-on-surface-variant hover:text-primary";

  return (
    <button
      type="button"
      onClick={onShare}
      title={title ?? label}
      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-label-md font-label-md transition-all active:scale-95 ${cls}`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
        {icon}
      </span>
      {text}
    </button>
  );
}
