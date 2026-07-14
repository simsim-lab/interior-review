"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 공유 링크 복사 버튼 — path(앞부분 /...)에 현재 origin 을 붙여 절대 URL 을 클립보드에 복사.
 * 복사 성공 시 잠깐 체크 아이콘으로 피드백. iconOnly 는 표 안 좁은 셀용(라벨 없이 아이콘만).
 * clipboard API 불가 환경(비 HTTPS 등)은 textarea + execCommand 로 폴백.
 */
export default function CopyLinkButton({
  path,
  label = "링크 복사",
  copiedLabel = "복사됨",
  iconOnly = false,
  variant = "ghost",
  title,
}: {
  path: string;
  label?: string;
  copiedLabel?: string;
  iconOnly?: boolean;
  variant?: "ghost" | "solid";
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 언마운트 후 setState 방지.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    const url =
      typeof window !== "undefined" ? window.location.origin + path : path;
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
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // 복사 실패 시 조용히 무시(사용자는 주소창에서 직접 복사 가능).
    }
  }

  const base =
    variant === "solid"
      ? "bg-primary text-on-primary hover:opacity-90"
      : "text-secondary hover:text-primary";

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={copy}
        title={title ?? label}
        aria-label={copied ? copiedLabel : label}
        className={`${base} transition-colors`}
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
          {copied ? "check" : "link"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={title ?? label}
      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-label-md font-label-md transition-all active:scale-95 ${
        variant === "solid"
          ? "bg-primary text-on-primary hover:opacity-90"
          : "border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary"
      }`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
        {copied ? "check" : "link"}
      </span>
      {copied ? copiedLabel : label}
    </button>
  );
}
