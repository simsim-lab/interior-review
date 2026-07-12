"use client";

import { useEffect, useState } from "react";
import type { ChecklistItem } from "@/lib/types";
import {
  canPersist,
  nextSort,
  insertChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "@/lib/mutations";
import { checklistStats } from "@/lib/checklist";
import StarRating from "./StarRating";
import AutoTextarea from "./AutoTextarea";
import Footer from "./Footer";
import Hero, { HeroChip } from "./Hero";

const CHECKLIST_HERO =
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=2000&q=70";

const SAVE_ERR = "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.";

export default function ChecklistView({ items }: { items: ChecklistItem[] }) {
  const [list, setList] = useState<ChecklistItem[]>(items);
  const [saving, setSaving] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  function patchLocal(id: string, patch: Partial<ChecklistItem>) {
    setList((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function persist(id: string, patch: Partial<ChecklistItem>) {
    const prev = list;
    patchLocal(id, patch); // 낙관적 반영
    if (!canPersist) return; // seed 모드: 로컬만
    setSaving(id);
    try {
      await updateChecklistItem(id, patch);
    } catch {
      setList(prev); // 실패 시 롤백
      setFlash(SAVE_ERR);
    } finally {
      setSaving(null);
    }
  }

  async function addItem() {
    try {
      const item = await insertChecklistItem({
        title: "",
        checked: false,
        rating: 0,
        note: null,
        sort: nextSort(list),
      });
      setList((prev) => [...prev, item]);
    } catch {
      setFlash("항목 추가에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function removeItem(id: string) {
    const prev = list;
    setList((p) => p.filter((i) => i.id !== id)); // 낙관적 제거
    try {
      await deleteChecklistItem(id);
    } catch {
      setList(prev); // 실패 시 복원
      setFlash("삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  const { total, checked, average, pct } = checklistStats(list);

  return (
    <div className="flex flex-col min-h-screen">
      {flash && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 flex items-center gap-2 rounded-lg bg-inverse-surface px-4 py-2.5 text-caption text-inverse-on-surface shadow-lift"
        >
          <span className="material-symbols-outlined text-[16px]">error</span>
          {flash}
        </div>
      )}
      <Hero
        image={CHECKLIST_HERO}
        icon="lock"
        eyebrow="관리자 전용 · 업체 비공개"
        title="업체 평가 체크리스트"
        subtitle="미팅 중 체크·별점·메모를 남기세요. 이 페이지는 업체에게 노출되지 않습니다."
        meta={
          <>
            <HeroChip icon="checklist">{total}개 항목</HeroChip>
            <HeroChip icon="task_alt">
              {checked}개 완료 · {pct}%
            </HeroChip>
          </>
        }
      />
      <main className="flex-grow max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-12 grid grid-cols-12 gap-gutter w-full">
        {/* 체크리스트 본문 */}
        <div className="rise col-span-12 lg:col-span-8 space-y-4">
          <h2 className="text-headline-md font-headline-md text-primary mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">fact_check</span>
            평가 항목
          </h2>
          {list.map((item, idx) => (
            <div
              key={item.id}
              className="lift bg-surface-container-lowest p-6 rounded-xl shadow-soft"
            >
              <div className="flex items-start gap-4">
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => persist(item.id, { checked: e.target.checked })}
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-body-lg font-body-lg font-semibold text-primary pt-1.5">
                        {idx + 1}.
                      </span>
                      <input
                        defaultValue={item.title}
                        onBlur={(e) => persist(item.id, { title: e.target.value })}
                        placeholder="평가 항목 제목"
                        className="flex-1 bg-transparent border-0 border-b border-transparent hover:border-outline-variant focus:border-primary text-body-lg font-body-lg font-semibold text-primary py-1 outline-none transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StarRating
                        value={item.rating}
                        onChange={(v) => persist(item.id, { rating: v })}
                      />
                      <button
                        onClick={() => removeItem(item.id)}
                        title="항목 삭제"
                        className="text-secondary hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          close
                        </span>
                      </button>
                    </div>
                  </div>
                  <AutoTextarea
                    defaultValue={item.note ?? ""}
                    onBlur={(e) => persist(item.id, { note: e.target.value })}
                    placeholder="미팅 메모..."
                    className="field w-full min-h-[80px]"
                  />
                  {saving === item.id && (
                    <p className="text-caption text-secondary mt-1">저장 중…</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addItem}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-outline-variant text-label-md font-label-md text-primary hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            항목 추가
          </button>
        </div>

        {/* 요약 사이드바 */}
        <div className="rise col-span-12 lg:col-span-4 space-y-gutter">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-soft border-t-4 border-primary sticky top-8">
            <h3 className="text-headline-md font-headline-md text-primary mb-6">
              종합 평가
            </h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-body-md text-secondary">체크 완료</span>
              <span className="text-label-md font-label-md text-primary">
                {checked} / {total} 항목
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full mb-8">
              <div
                className="bg-primary h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-center py-6 border-y border-outline-variant mb-8">
              <span className="text-display-lg font-display-lg text-primary block">
                {average}
              </span>
              <span className="text-label-md font-label-md text-secondary uppercase tracking-widest">
                평균 평점
              </span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-primary-container/10 rounded-xl">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <p className="text-caption text-on-primary-container font-medium">
                {canPersist
                  ? "변경 사항은 자동 저장됩니다."
                  : "미리보기 모드 — Supabase 연결 시 저장됩니다."}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
