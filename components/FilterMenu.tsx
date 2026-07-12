"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const PANEL_W = 220; // .filter-panel width (globals.css) — 위치 계산·화면밖 방지에 사용
const EDGE = 8; // 뷰포트 가장자리 최소 여백

/**
 * 엑셀식 컬럼 헤더 필터 — 헤더의 필터 버튼을 누르면 체크박스 팝오버가 뜨고
 * 값을 다중 선택해 해당 행만 남긴다. 선택이 비면 전체 표시.
 * - 옵션은 "현재 보이는 테이블에 실제 존재하는 값"만 넘겨받는다(호출부 책임).
 * - 외부 클릭·ESC 로 닫힘.
 * - 패널은 body 포털 + position:fixed 로 띄운다 → 테이블의 overflow(가로스크롤)에
 *   잘리지 않고, 테이블 레이아웃 크기에도 영향을 주지 않는다.
 */
export default function FilterMenu({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  // value = 식별자(공간은 slug), label = 표시명. 이름 중복이 있어도 안전하게 구분.
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);
  const panelId = useId();
  const active = selected.length > 0;

  // 버튼 위치 기준으로 패널 좌표 계산(뷰포트 밖으로 나가지 않게 좌우 클램프).
  useEffect(() => {
    if (!open) {
      setPos(null);
      focusedRef.current = false;
      return;
    }
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const left = Math.max(
        EDGE,
        Math.min(r.left, window.innerWidth - PANEL_W - EDGE)
      );
      setPos({ top: r.bottom + 6, left });
    };
    place();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // capture:true 로 내부 스크롤(테이블 가로스크롤 등)까지 따라가 재배치.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 패널이 실제로 붙은 뒤 첫 체크박스로 포커스(열릴 때 1회만 — 스크롤 재배치 시 뺏지 않게).
  useEffect(() => {
    if (open && pos && !focusedRef.current) {
      focusedRef.current = true;
      panelRef.current
        ?.querySelector<HTMLInputElement>('input[type="checkbox"]')
        ?.focus();
    }
  }, [open, pos]);

  const toggle = (v: string) => {
    onChange(
      selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]
    );
  };

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`${label} 필터${active ? `, ${selected.length}개 선택됨` : ""}`}
        data-active={active}
        onClick={() => setOpen((o) => !o)}
        className="filter-head group"
        title={`${label} 필터`}
      >
        <span className="whitespace-nowrap text-label-md font-label-md uppercase tracking-wider">
          {label}
        </span>
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-[13px] leading-none transition-opacity ${
            active ? "opacity-100" : "opacity-50 group-hover:opacity-90"
          }`}
          style={{
            fontVariationSettings: active
              ? "'FILL' 1, 'wght' 400"
              : "'FILL' 0, 'wght' 300",
          }}
        >
          filter_alt
        </span>
        {active && (
          <span aria-hidden="true" className="filter-badge">
            {selected.length}
          </span>
        )}
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="group"
            aria-label={`${label} 필터`}
            className="filter-panel"
            style={{ position: "fixed", top: pos.top, left: pos.left }}
          >
            <div className="flex items-center justify-between px-3 pb-2 pt-1">
              <span className="text-caption font-semibold text-secondary">
                {label} 필터
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                disabled={!active}
                className="text-caption text-primary hover:underline disabled:opacity-40"
              >
                전체
              </button>
            </div>
            <ul className="max-h-64 overflow-y-auto custom-scrollbar">
              {options.length === 0 && (
                <li className="px-3 py-2 text-caption text-secondary">
                  값 없음
                </li>
              )}
              {options.map((opt) => {
                const checked = selected.includes(opt.value);
                return (
                  <li key={opt.value}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 hover:bg-surface-container-low">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(opt.value)}
                        style={{ accentColor: "var(--ochre)" }}
                        className="h-[15px] w-[15px] rounded-[4px] border-outline-variant"
                      />
                      <span className="truncate text-body-md text-on-surface">
                        {opt.label}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}
