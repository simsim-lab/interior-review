"use client";

import { useMemo, useState } from "react";
import type { ChecklistItem } from "@/lib/types";
import { createClient, SUPABASE_ENABLED } from "@/lib/supabase/client";
import StarRating from "./StarRating";
import AutoTextarea from "./AutoTextarea";
import Footer from "./Footer";

export default function ChecklistView({ items }: { items: ChecklistItem[] }) {
  const [list, setList] = useState<ChecklistItem[]>(items);
  const [saving, setSaving] = useState<string | null>(null);

  const supabase = useMemo(() => (SUPABASE_ENABLED ? createClient() : null), []);

  function patchLocal(id: string, patch: Partial<ChecklistItem>) {
    setList((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function persist(id: string, patch: Partial<ChecklistItem>) {
    patchLocal(id, patch);
    if (!supabase) return; // seed 모드: 로컬만
    setSaving(id);
    await supabase.from("checklist_items").update(patch).eq("id", id);
    setSaving(null);
  }

  function newId(): string {
    return typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `tmp-${Math.floor(performance.now() * 1000)}`;
  }

  async function addItem() {
    const sort = list.length + 1;
    let id = newId();
    if (supabase) {
      const { data } = await supabase
        .from("checklist_items")
        .insert({ title: "", checked: false, rating: 0, note: null, sort })
        .select("*")
        .single();
      if (data) id = data.id;
    }
    setList((prev) => [
      ...prev,
      { id, title: "", checked: false, rating: 0, note: null, sort },
    ]);
  }

  async function removeItem(id: string) {
    setList((prev) => prev.filter((i) => i.id !== id));
    if (supabase) await supabase.from("checklist_items").delete().eq("id", id);
  }

  const total = list.length;
  const checked = list.filter((i) => i.checked).length;
  const rated = list.filter((i) => i.rating > 0);
  const weighted =
    rated.length > 0
      ? (rated.reduce((s, i) => s + i.rating, 0) / rated.length).toFixed(1)
      : "—";
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow max-w-container-max mx-auto px-margin-desktop py-12 grid grid-cols-12 gap-gutter w-full">
        {/* 헤더 */}
        <div className="col-span-12 mb-4 border-b border-outline-variant pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="text-label-md font-label-md text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                관리자 전용 · 업체 비공개
              </span>
              <h1 className="text-display-lg font-display-lg text-primary">
                업체 평가 체크리스트
              </h1>
              <p className="text-body-md text-secondary mt-3">
                미팅 중 체크·별점·메모를 남기세요. 이 페이지는 업체에게 노출되지 않습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 체크리스트 본문 */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <h2 className="text-headline-md font-headline-md text-primary mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">fact_check</span>
            평가 항목
          </h2>
          {list.map((item, idx) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest p-6 rounded-xl shadow-soft border border-transparent hover:border-outline-variant transition-all"
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
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none min-h-[80px]"
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
        <div className="col-span-12 lg:col-span-4 space-y-gutter">
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
                {weighted}
              </span>
              <span className="text-label-md font-label-md text-secondary uppercase tracking-widest">
                가중 평점
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
                {SUPABASE_ENABLED
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
