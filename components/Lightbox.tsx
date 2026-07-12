"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Photo } from "@/lib/types";

/**
 * 전체화면 사진 뷰어 — 화면 가득 + 확대/축소 + 이동(pan) + 이전/다음.
 * ESC 닫기, ← → 이동, +/- 또는 휠로 확대/축소.
 */
export default function Lightbox({
  photos,
  index,
  onClose,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
}) {
  const [i, setI] = useState(index);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const reset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (d: number) => {
      setI((prev) => (prev + d + photos.length) % photos.length);
      reset();
    },
    [photos.length, reset]
  );

  const zoom = useCallback((d: number) => {
    setScale((s) => Math.min(5, Math.max(1, +(s + d).toFixed(2))));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") zoom(0.25);
      else if (e.key === "-") zoom(-0.25);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [go, zoom, onClose]);

  // 드래그 이동 (확대 상태에서만)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);

  const photo = photos[i];
  if (!photo) return null;
  if (typeof document === "undefined") return null;

  // document.body 로 Portal — 조상의 CSS transform(.rise 등장 애니메이션 등)이
  // position:fixed 의 기준을 바꿔 전체화면이 깨지는 것을 방지.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-primary/95 flex items-center justify-center select-none"
      onClick={onClose}
    >
      {/* 상단 바 */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 text-on-primary z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-label-md tracking-widest">
          {i + 1} / {photos.length}
          {photo.caption ? `  ·  ${photo.caption}` : ""}
        </span>
        <div className="flex items-center gap-2">
          <button className="lb-btn" onClick={() => zoom(-0.25)} title="축소">
            <span className="material-symbols-outlined">zoom_out</span>
          </button>
          <span className="text-caption w-12 text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button className="lb-btn" onClick={() => zoom(0.25)} title="확대">
            <span className="material-symbols-outlined">zoom_in</span>
          </button>
          <button className="lb-btn" onClick={reset} title="원래대로">
            <span className="material-symbols-outlined">fit_screen</span>
          </button>
          <button className="lb-btn" onClick={onClose} title="닫기">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      {/* 이전/다음 */}
      {photos.length > 1 && (
        <>
          <button
            className="lb-btn absolute left-4 top-1/2 -translate-y-1/2 z-10"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            title="이전"
          >
            <span className="material-symbols-outlined text-3xl">chevron_left</span>
          </button>
          <button
            className="lb-btn absolute right-4 top-1/2 -translate-y-1/2 z-10"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            title="다음"
          >
            <span className="material-symbols-outlined text-3xl">chevron_right</span>
          </button>
        </>
      )}

      {/* 이미지 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={photo.caption ?? ""}
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => zoom(e.deltaY < 0 ? 0.2 : -0.2)}
        onDoubleClick={() => (scale > 1 ? reset() : zoom(1))}
        onMouseDown={(e) => scale > 1 && setDrag({ x: e.clientX - pos.x, y: e.clientY - pos.y })}
        onMouseMove={(e) => drag && setPos({ x: e.clientX - drag.x, y: e.clientY - drag.y })}
        onMouseUp={() => setDrag(null)}
        onMouseLeave={() => setDrag(null)}
        className="max-w-[92vw] max-h-[88vh] object-contain transition-transform"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          cursor: scale > 1 ? (drag ? "grabbing" : "grab") : "zoom-in",
        }}
      />

      <style jsx>{`
        .lb-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
          transition: background 0.2s;
        }
        .lb-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </div>,
    document.body
  );
}
