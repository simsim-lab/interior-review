"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * 엑셀식 컬럼 헤더 필터 — 헤더의 ▾ 버튼을 누르면 체크박스 팝오버가 뜨고
 * 값을 다중 선택해 해당 행만 남긴다. 선택이 비면 전체 표시.
 * - 옵션은 "현재 보이는 테이블에 실제 존재하는 값"만 넘겨받는다(호출부 책임).
 * - 외부 클릭·ESC 로 닫힘.
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
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const active = selected.length > 0;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (v: string) => {
    onChange(
      selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]
    );
  };

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        data-active={active}
        onClick={() => setOpen((o) => !o)}
        className="filter-head"
        title={`${label} 필터`}
      >
        <span className="text-label-md font-label-md uppercase tracking-wider">
          {label}
        </span>
        <span className="material-symbols-outlined text-[16px]">
          filter_list
        </span>
        {active && <span className="filter-badge">{selected.length}</span>}
      </button>

      {open && (
        <div id={panelId} role="menu" className="filter-panel">
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
                      className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span className="truncate text-body-md text-on-surface">
                      {opt.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
