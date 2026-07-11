"use client";

import { useState } from "react";
import type { Photo } from "@/lib/types";
import Lightbox from "./Lightbox";

export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => setOpen(idx)}
            className="group relative aspect-video w-full rounded-lg overflow-hidden border border-outline-variant"
            title="크게 보기"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.caption ?? ""}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-3xl">
                zoom_in
              </span>
            </div>
            {p.caption && (
              <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/70 to-transparent text-white text-caption px-2 py-1 text-left">
                {p.caption}
              </span>
            )}
          </button>
        ))}
      </div>
      {open !== null && (
        <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
