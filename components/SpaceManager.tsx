"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Space } from "@/lib/types";
import Spinner from "./Spinner";

/**
 * 공간 편집 모달 — 공간 추가 / 이름 수정 / 삭제를 한 곳에서.
 * (기존 인라인 "공간 추가" 버튼을 대체.) 조상 transform 영향을 피하려 body 로 Portal.
 */
export default function SpaceManager({
  spaces,
  onAdd,
  onRename,
  onRemove,
  onClose,
}: {
  spaces: Space[];
  onAdd: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await onAdd(name);
      setNewName("");
    } finally {
      setAdding(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-primary/40 p-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="공간 편집"
        className="w-full max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-headline-md font-headline-md text-primary">
            <span className="material-symbols-outlined">edit_location_alt</span>
            공간 편집
          </h3>
          <button
            onClick={onClose}
            title="닫기"
            className="text-secondary hover:text-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 기존 공간 목록 */}
        <ul className="mb-5 space-y-2">
          {spaces.length === 0 && (
            <li className="text-caption text-secondary">아직 공간이 없습니다.</li>
          )}
          {spaces.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <input
                defaultValue={s.name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== s.name) onRename(s.id, v);
                  else e.target.value = s.name;
                }}
                aria-label="공간 이름"
                className="field min-w-0 flex-1"
              />
              <button
                onClick={() => onRemove(s.id)}
                title="공간 삭제"
                className="shrink-0 text-secondary hover:text-error"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </li>
          ))}
        </ul>

        {/* 새 공간 추가 */}
        <div className="flex items-center gap-2 border-t border-outline-variant pt-4">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
              if (e.key === "Escape") onClose();
            }}
            placeholder="새 공간 이름"
            className="field min-w-0 flex-1"
          />
          <button
            onClick={add}
            disabled={adding || !newName.trim()}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-4 py-2 text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
          >
            {adding ? (
              <Spinner size={18} />
            ) : (
              <span className="material-symbols-outlined text-[18px]">add</span>
            )}
            {adding ? "추가 중…" : "추가"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
