"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Vendor } from "@/lib/types";
import Spinner from "./Spinner";

/**
 * 업체 편집 모달 — 업체 추가 / 이름 수정 / 삭제를 한 곳에서.
 * (SpaceManager 와 같은 패턴·접근성.) 조상 transform 영향을 피하려 body 로 Portal.
 * 접근성: 문서 레벨 ESC·Tab 포커스 트랩·닫힐 때 이전 포커스 복원.
 */
export default function VendorManager({
  vendors,
  onAdd,
  onRename,
  onRemove,
  onClose,
}: {
  vendors: Vendor[];
  onAdd: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // 열릴 때 포커스를 잡고 있던 요소를 기억 → 닫힐 때 복원.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    return () => prev?.focus?.();
  }, []);

  // ESC 는 문서 레벨로 — 버튼 disabled 등으로 포커스가 dialog 밖으로 빠져도 닫히게.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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

  // Tab 포커스 트랩(ESC 는 위 문서 레벨 리스너가 처리).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const root = dialogRef.current;
    if (!root) return;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled"));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-primary/40 p-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="업체 편집"
        className="w-full max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-headline-md font-headline-md text-primary">
            <span
              aria-hidden="true"
              className="material-symbols-outlined"
              style={{ color: "var(--ochre)", fontVariationSettings: "'FILL' 1" }}
            >
              storefront
            </span>
            업체 편집
          </h3>
          <button
            onClick={onClose}
            title="닫기"
            aria-label="닫기"
            className="text-secondary hover:text-primary"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>

        {/* 기존 업체 목록 */}
        <ul className="mb-5 space-y-2">
          {vendors.length === 0 && (
            <li className="text-caption text-secondary">아직 업체가 없습니다.</li>
          )}
          {vendors.map((v) => (
            <li key={v.id} className="flex items-center gap-2">
              <input
                defaultValue={v.name}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val && val !== v.name) onRename(v.id, val);
                  else e.target.value = v.name;
                }}
                aria-label="업체 이름"
                className="field min-w-0 flex-1"
              />
              <button
                onClick={() => onRemove(v.id)}
                title="업체 삭제"
                aria-label={`${v.name} 업체 삭제`}
                className="shrink-0 text-secondary hover:text-error"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                  delete
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* 새 업체 추가 */}
        <div className="flex items-center gap-2 border-t border-outline-variant pt-4">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder="새 업체 이름"
            aria-label="새 업체 이름"
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
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                add
              </span>
            )}
            {adding ? "추가 중…" : "추가"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
