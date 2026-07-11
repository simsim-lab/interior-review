"use client";

import { useEffect, useRef } from "react";

/**
 * 내용에 따라 높이가 자동으로 늘어나는 textarea.
 * maxLines(기본 5)까지 커지고, 그 이상이면 세로 스크롤바가 나온다.
 */
export default function AutoTextarea({
  maxLines = 5,
  className = "",
  onInput,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { maxLines?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight) || 24;
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const borderY =
      parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    const max = lh * maxLines + padY + borderY;

    el.style.height = "auto";
    const needed = el.scrollHeight + borderY;
    el.style.height = Math.min(needed, max) + "px";
    el.style.overflowY = needed > max ? "auto" : "hidden";
  };

  useEffect(() => {
    resize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <textarea
      ref={ref}
      rows={1}
      onInput={(e) => {
        resize();
        onInput?.(e);
      }}
      className={`custom-scrollbar resize-none ${className}`}
      {...props}
    />
  );
}
