"use client";

import { useRef, useState } from "react";
import type { Photo } from "@/lib/types";
import Lightbox from "./Lightbox";
import Spinner from "./Spinner";

/**
 * 행(요구사항/현재상태) 단위 사진 셀 — 썸네일 나열 + 클릭 시 라이트박스.
 * 관리자는 업로드/삭제 가능, 뷰어는 열람만.
 */
export default function PhotoCell({
  photos,
  isAdmin,
  onUpload,
  onRemove,
}: {
  photos: Photo[];
  isAdmin: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: (photoId: string) => Promise<void>;
}) {
  // 라이트박스는 배열 위치가 아니라 사진 id 로 추적(삭제/재정렬 시 어긋남 방지).
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLInputElement>(null);

  const pick = async (file: File) => {
    setBusy(true);
    try {
      await onUpload(file);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  // 삭제 연타 방지 + 진행 중 표시.
  const remove = async (id: string) => {
    if (removing.has(id)) return;
    setRemoving((s) => new Set(s).add(id));
    try {
      await onRemove(id);
    } finally {
      setRemoving((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  const openIdx = openId === null ? -1 : photos.findIndex((p) => p.id === openId);

  if (!isAdmin && photos.length === 0) {
    return <span className="text-caption text-secondary">—</span>;
  }

  return (
    <>
      <div className="flex max-w-[168px] flex-wrap items-center gap-1.5">
        {photos.map((p) => (
          <span key={p.id} className="group relative">
            <button
              type="button"
              onClick={() => setOpenId(p.id)}
              title="크게 보기"
              aria-label={p.caption ? `사진 크게 보기: ${p.caption}` : "사진 크게 보기"}
              className="block h-12 w-12 overflow-hidden rounded-md border border-outline-variant"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption ?? ""}
                width={48}
                height={48}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => remove(p.id)}
                disabled={removing.has(p.id)}
                title="사진 삭제"
                aria-label="사진 삭제"
                className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 place-items-center rounded-full bg-inverse-surface text-inverse-on-surface group-hover:grid group-focus-within:grid disabled:opacity-50"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[13px]">
                  close
                </span>
              </button>
            )}
          </span>
        ))}

        {isAdmin && (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={busy}
            title="사진 추가"
            aria-label={busy ? "업로드 중" : "사진 추가"}
            className="grid h-12 w-12 place-items-center rounded-md border border-dashed border-outline-variant text-secondary hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {busy ? (
              <Spinner size={16} />
            ) : (
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                add_a_photo
              </span>
            )}
          </button>
        )}
      </div>

      {isAdmin && (
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) pick(file);
          }}
        />
      )}

      {openIdx >= 0 && (
        <Lightbox
          photos={photos}
          index={openIdx}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
