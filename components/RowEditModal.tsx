"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Photo } from "@/lib/types";
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
 * - 사진:
 *   · 편집 모드 — 기존 행에 즉시 업로드/삭제(테이블 셀과 동일 동작, onAddPhoto/onRemovePhoto).
 *   · 추가 모드 — 행이 아직 없으므로 파일을 로컬에 담아뒀다가(파일명 타일로 표시) "확인" 시
 *     onConfirm 의 두 번째 인자로 전달 → 호출부에서 행 생성 후 업로드.
 *     (담아둔 파일로 미리보기 URL 을 만들지 않는다 — 파일→이미지 src 흐름을 아예 없애
 *      XSS 정적분석 오탐 소지를 제거. 저장 후에는 실제 썸네일이 테이블/편집 모달에 표시됨.)
 * 접근성·구조는 SpaceManager 모달과 동일 패턴(Portal·ESC·Tab 트랩·포커스 복원).
 */
export default function RowEditModal({
  mode,
  isReq,
  contentLabel,
  spaces,
  initial,
  photos = [],
  onAddPhoto,
  onRemovePhoto,
  onConfirm,
  onClose,
}: {
  mode: "add" | "edit";
  isReq: boolean;
  contentLabel: string; // "요구사항" | "현재 상태"
  spaces: { id: string; name: string }[];
  initial: RowEditValues;
  photos?: Photo[]; // 편집 모드: 이 행의 기존 사진(추가 모드는 비어 있음)
  onAddPhoto?: (file: File) => Promise<void>; // 편집 모드: 즉시 업로드
  onRemovePhoto?: (photoId: string) => Promise<void>; // 편집 모드: 즉시 삭제
  onConfirm: (values: RowEditValues, pendingPhotos: File[]) => Promise<void>;
  onClose: () => void;
}) {
  const [spaceId, setSpaceId] = useState(initial.spaceId);
  const [category, setCategory] = useState(initial.category);
  const [content, setContent] = useState(initial.content);
  const [notes, setNotes] = useState(initial.notes);
  const [saving, setSaving] = useState(false);
  // 추가 모드에서 아직 저장 안 된 사진(파일만 보관 — 미리보기 URL 은 만들지 않음).
  const [pending, setPending] = useState<
    { key: string; name: string; file: File }[]
  >([]);
  const [photoBusy, setPhotoBusy] = useState(false); // 편집 모드 즉시 업로드 중
  const [removing, setRemoving] = useState<Set<string>>(new Set()); // 삭제 진행 중 사진 id
  const keyRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const dirty =
    spaceId !== initial.spaceId ||
    category !== initial.category ||
    content !== initial.content ||
    notes !== initial.notes ||
    pending.length > 0;

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

  // 배경 스크롤 잠금 — 풀스크린(모바일)에서 배경 페이지가 밀리는 것 방지.
  // Lightbox 와 동일 패턴이되, 상세(크게 보기) 위에서 열릴 수 있어 이전 값을 보존 후 복원.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC 는 문서 레벨로(포커스가 dialog 밖으로 빠져도 닫히게).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") attemptClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [attemptClose]);

  // 파일 선택 → 편집 모드는 즉시 업로드, 추가 모드는 로컬 대기열에 담는다.
  const onFiles = async (list: FileList) => {
    const files = Array.from(list);
    if (fileRef.current) fileRef.current.value = "";
    if (files.length === 0) return;
    if (mode === "add") {
      setPending((prev) => [
        ...prev,
        ...files.map((file) => ({
          key: `p${keyRef.current++}`,
          name: file.name,
          file,
        })),
      ]);
      return;
    }
    if (!onAddPhoto) return;
    setPhotoBusy(true);
    try {
      for (const file of files) await onAddPhoto(file);
    } finally {
      setPhotoBusy(false);
    }
  };

  // 기존 사진 삭제(편집 모드) — 연타 방지 + 진행 표시.
  const removeExisting = async (id: string) => {
    if (!onRemovePhoto || removing.has(id)) return;
    setRemoving((s) => new Set(s).add(id));
    try {
      await onRemovePhoto(id);
    } finally {
      setRemoving((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  // 대기 중 사진 제거(추가 모드).
  const removePending = (key: string) => {
    setPending((prev) => prev.filter((p) => p.key !== key));
  };

  const submit = async () => {
    if (saving || !content.trim()) return;
    setSaving(true);
    try {
      await onConfirm(
        {
          spaceId,
          category: category.trim(),
          content: content.trim(),
          notes: notes.trim(),
        },
        pending.map((p) => p.file)
      );
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

  const busy = saving || photoBusy;

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex flex-col justify-end overscroll-contain bg-primary/40 sm:items-center sm:justify-center sm:p-6"
      onClick={attemptClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "add" ? "항목 추가" : "항목 편집"}
        className="flex h-dvh w-full flex-col rounded-none bg-surface-container-lowest shadow-lift sm:h-auto sm:min-h-[70vh] sm:max-h-[90vh] sm:max-w-[1008px] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-outline-variant px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 sm:pt-4">
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
        <div className="custom-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-6 py-5">
          {/* 공간·분류 — 데스크톱에선 넓어진 폭을 활용해 한 줄에 나란히(모바일은 세로 유지). */}
          <div className="flex flex-col gap-5 sm:flex-row sm:gap-4">
            <label className="flex flex-col gap-1.5 sm:flex-1">
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
              <label className="flex flex-col gap-1.5 sm:flex-1">
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
          </div>

          {/* 내용·메모 — 자유서술은 가독폭(640px) 중앙 유지: 넓은 모달에서도 한 줄이 과도하게 길어지지 않게. */}
          <div className="flex flex-1 flex-col gap-5 sm:mx-auto sm:w-full sm:max-w-[640px]">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-label-md font-label-md text-on-surface-variant">
                {contentLabel}
              </span>
              <textarea
                autoFocus={!isReq}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`${contentLabel} 내용을 입력하세요`}
                className="field custom-scrollbar min-h-[30dvh] w-full flex-1 resize-none sm:min-h-[220px]"
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
                className="field custom-scrollbar min-h-[14dvh] w-full resize-none sm:min-h-[120px]"
              />
            </label>
          </div>

          {/* 사진 — 편집: 즉시 저장 / 추가: 확인 시 함께 업로드 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-label-md font-label-md text-on-surface-variant">
              사진
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {photos.map((p) => (
                <span key={p.id} className="group relative">
                  <span className="block h-14 w-14 sm:h-20 sm:w-20 overflow-hidden rounded-md border border-outline-variant">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={p.caption ?? ""}
                      width={56}
                      height={56}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExisting(p.id)}
                    disabled={removing.has(p.id)}
                    title="사진 삭제"
                    aria-label="사진 삭제"
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-inverse-surface text-inverse-on-surface disabled:opacity-50"
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-[13px]"
                    >
                      close
                    </span>
                  </button>
                </span>
              ))}

              {/* 아직 저장 안 된 사진은 파일→이미지 src 흐름을 피해 파일명 타일로만 표시. */}
              {pending.map((p) => (
                <span key={p.key} className="group relative">
                  <span
                    title={p.name}
                    className="flex h-14 w-14 sm:h-20 sm:w-20 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md border border-dashed border-outline-variant bg-surface-container-low px-1 text-secondary"
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-[18px]"
                    >
                      image
                    </span>
                    <span className="w-full truncate text-center text-[9px] leading-tight">
                      {p.name}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removePending(p.key)}
                    title="사진 제거"
                    aria-label="사진 제거"
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-inverse-surface text-inverse-on-surface"
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-[13px]"
                    >
                      close
                    </span>
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoBusy}
                title="사진 추가"
                aria-label={photoBusy ? "업로드 중" : "사진 추가"}
                className="grid h-14 w-14 sm:h-20 sm:w-20 place-items-center rounded-md border border-dashed border-outline-variant text-secondary hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {photoBusy ? (
                  <Spinner size={16} />
                ) : (
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[18px]"
                  >
                    add_a_photo
                  </span>
                )}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) onFiles(e.target.files);
              }}
            />
          </div>
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
            disabled={busy || !content.trim()}
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
