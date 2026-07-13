"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Spinner from "./Spinner";

export type RowEditValues = {
  spaceId: string;
  category: string;
  content: string;
  notes: string;
};

/**
 * 행(요구사항/현재상태) 추가·편집 모달.
 * - 모바일: 화면을 가득 채우는 바텀시트, 데스크탑: 가운데 다이얼로그.
 * - 저장 원칙: 입력 후 "확인" 클릭 시에만 반영·저장(즉시 저장).
 * - 값을 바꾼 뒤 취소/ESC/배경 클릭 시 "변경사항 버릴까요?" 1회 경고.
 * 접근성·구조는 SpaceManager 모달과 동일 패턴(Portal·ESC·Tab 트랩·포커스 복원).
 */
export default function RowEditModal({
  mode,
  isReq,
  contentLabel,
  spaces,
  initial,
  onConfirm,
  onClose,
}: {
  mode: "add" | "edit";
  isReq: boolean;
  contentLabel: string; // "요구사항" | "현재 상태"
  spaces: { id: string; name: string }[];
  initial: RowEditValues;
  onConfirm: (values: RowEditValues) => Promise<void>;
  onClose: () => void;
}) {
  const [spaceId, setSpaceId] = useState(initial.spaceId);
  const [category, setCategory] = useState(initial.category);
  const [content, setContent] = useState(initial.content);
  const [notes, setNotes] = useState(initial.notes);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const dirty =
    spaceId !== initial.spaceId ||
    category !== initial.category ||
    content !== initial.content ||
    notes !== initial.notes;

  // 값을 바꿨을 때만 버릴지 물어본다. 저장 중에는 닫기 무시.
  const attemptClose = useMemo(
    () => () => {
      if (saving) return;
      if (dirty && !confirm("변경사항을 버릴까요?")) return;
      onClose();
    },
    [saving, dirty, onClose]
  );

  // 열릴 때 포커스를 잡고 있던 요소를 기억 → 닫힐 때 복원.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    return () => prev?.focus?.();
  }, []);

  // ESC 는 문서 레벨로(포커스가 dialog 밖으로 빠져도 닫히게).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") attemptClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [attemptClose]);

  const submit = async () => {
    if (saving || !content.trim()) return;
    setSaving(true);
    try {
      await onConfirm({
        spaceId,
        category: category.trim(),
        content: content.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch {
      // onConfirm 내부에서 토스트로 알림 — 모달은 유지해 재시도 가능.
      setSaving(false);
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
      className="fixed inset-0 z-[130] flex flex-col justify-end bg-primary/40 sm:items-center sm:justify-center sm:p-4"
      onClick={attemptClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "add" ? "항목 추가" : "항목 편집"}
        className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-surface-container-lowest shadow-lift sm:max-h-[85vh] sm:max-w-lg sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <h3 className="flex items-center gap-2 text-headline-md font-headline-md text-primary">
            <span
              aria-hidden="true"
              className="material-symbols-outlined"
              style={{ color: "var(--ochre)", fontVariationSettings: "'FILL' 1" }}
            >
              {mode === "add" ? "note_add" : "edit"}
            </span>
            {mode === "add" ? `${contentLabel} 추가` : `${contentLabel} 편집`}
          </h3>
          <button
            onClick={attemptClose}
            title="닫기"
            aria-label="닫기"
            className="text-secondary hover:text-primary"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>

        {/* 본문(스크롤) */}
        <div className="custom-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-label-md font-label-md text-on-surface-variant">
              공간
            </span>
            <select
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              className="field w-full"
            >
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          {isReq && (
            <label className="flex flex-col gap-1.5">
              <span className="text-label-md font-label-md text-on-surface-variant">
                분류
              </span>
              <input
                autoFocus
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="예: 전기, 도장, 가구"
                className="field w-full"
              />
            </label>
          )}

          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-label-md font-label-md text-on-surface-variant">
              {contentLabel}
            </span>
            <textarea
              autoFocus={!isReq}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`${contentLabel} 내용을 입력하세요`}
              className="field custom-scrollbar min-h-[38vh] w-full flex-1 resize-none sm:min-h-[140px]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-label-md font-label-md text-on-surface-variant">
              메모
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="메모(선택)"
              className="field custom-scrollbar min-h-[18vh] w-full resize-none sm:min-h-[92px]"
            />
          </label>
        </div>

        {/* 푸터 — 모바일 바텀시트는 홈 인디케이터를 피해 safe-area 만큼 여백 추가 */}
        <div className="flex items-center justify-end gap-2 border-t border-outline-variant px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
          <button
            onClick={attemptClose}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-label-md font-label-md text-secondary transition-colors hover:bg-surface-container-low hover:text-primary disabled:opacity-40"
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={saving || !content.trim()}
            className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
          >
            {saving ? (
              <Spinner size={18} />
            ) : (
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                check
              </span>
            )}
            {saving ? "저장 중…" : "확인"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
