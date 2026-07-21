"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Vendor, ChecklistItem, ChecklistAnswer } from "@/lib/types";
import {
  canPersist,
  newId,
  nextSort,
  insertVendor,
  updateVendor,
  deleteVendor,
  insertChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  upsertChecklistAnswer,
} from "@/lib/mutations";
import { checklistStats, composeRows } from "@/lib/checklist";
import { revertPatch, insertAt } from "@/lib/util";
import StarRating from "./StarRating";
import AutoTextarea from "./AutoTextarea";
import Footer from "./Footer";
import Hero, { HeroChip } from "./Hero";
import Spinner from "./Spinner";
import VendorManager from "./VendorManager";

const CHECKLIST_HERO =
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=2000&q=70";

const SAVE_ERR = "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.";

// 답변의 평가값(항목 제목과 무관). 미기록 항목의 기본값.
type Answered = { checked: boolean; rating: number; note: string | null };
const EMPTY: Answered = { checked: false, rating: 0, note: null };

export default function ChecklistView({
  vendors,
  items,
  answers,
}: {
  vendors: Vendor[];
  items: ChecklistItem[];
  answers: ChecklistAnswer[];
}) {
  const [vendorList, setVendorList] = useState<Vendor[]>(vendors);
  const [itemList, setItemList] = useState<ChecklistItem[]>(items);
  const [answerList, setAnswerList] = useState<ChecklistAnswer[]>(answers);
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [flash, setFlash] = useState<{ msg: string } | null>(null);

  // 알림 토스트 — 매번 새 객체라 같은 문구가 연속돼도 4초 타이머가 갱신됨.
  const notify = (msg: string) => setFlash({ msg });
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  // 활성 업체를 URL(?vendor=id)에서 파생 — URL 이 단일 원본이라 선택 시 링크가 바뀌고,
  // 그 링크로 진입하거나 뒤로가기 해도 업체가 맞춰진다. 없거나 무효면 첫 업체로 폴백.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const wanted = searchParams.get("vendor");
  const activeVendor =
    vendorList.find((v) => v.id === wanted) ?? vendorList[0] ?? null;
  const activeId = activeVendor?.id ?? "";
  // 업체 전환은 RSC 재요청(force-dynamic)을 유발 — 완료까지 스피너를 띄워 멈춘 듯 보이지
  // 않게 한다(AppShell 로그아웃과 동일 양식: useTransition + Spinner).
  const [switching, startSwitch] = useTransition();
  const selectVendor = (id: string) => {
    startSwitch(() => {
      router.replace(`${pathname}?vendor=${encodeURIComponent(id)}`, {
        scroll: false,
      });
    });
  };

  // ─── 업체별 답변 조회/저장 ─────────────────────────────────────────────────
  const answerOf = (vendorId: string, itemId: string): ChecklistAnswer | undefined =>
    answerList.find((a) => a.vendor_id === vendorId && a.item_id === itemId);
  const valuesOf = (vendorId: string, itemId: string): Answered => {
    const a = answerOf(vendorId, itemId);
    return a ? { checked: a.checked, rating: a.rating, note: a.note } : EMPTY;
  };

  function setAnswerLocal(vendorId: string, itemId: string, full: Answered) {
    setAnswerList((prev) => {
      const idx = prev.findIndex(
        (a) => a.vendor_id === vendorId && a.item_id === itemId
      );
      if (idx === -1) {
        return [
          ...prev,
          { id: newId(), vendor_id: vendorId, item_id: itemId, ...full },
        ];
      }
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], ...full };
      return copy;
    });
  }

  // 답변 저장 — 전체값(checked·rating·note)을 upsert 하고, 실패 시 이전 답변으로 복원.
  async function persistAnswer(itemId: string, patch: Partial<Answered>) {
    if (!activeVendor) return;
    const vendorId = activeVendor.id;
    const before = answerOf(vendorId, itemId); // 없을 수도(미기록)
    const full: Answered = { ...valuesOf(vendorId, itemId), ...patch };
    setAnswerLocal(vendorId, itemId, full); // 낙관적 반영
    if (!canPersist) return; // seed 모드: 로컬만
    setSaving(itemId);
    try {
      await upsertChecklistAnswer(vendorId, itemId, full);
    } catch {
      // 실패 시 이 (업체·항목) 답변만 이전 상태로 복원(다른 편집 보존).
      setAnswerList((prev) => {
        const others = prev.filter(
          (a) => !(a.vendor_id === vendorId && a.item_id === itemId)
        );
        return before ? [...others, before] : others;
      });
      notify(SAVE_ERR);
    } finally {
      setSaving(null);
    }
  }

  // ─── 항목(공유 템플릿) 편집 — 모든 업체 공통 ───────────────────────────────
  async function persistTitle(id: string, title: string) {
    const before = itemList.find((it) => it.id === id) as
      | Record<string, unknown>
      | undefined;
    const revert = revertPatch<ChecklistItem>(before, { title });
    setItemList((prev) => prev.map((it) => (it.id === id ? { ...it, title } : it)));
    if (!canPersist) return;
    setSaving(id);
    try {
      await updateChecklistItem(id, { title });
    } catch {
      if (revert)
        setItemList((prev) =>
          prev.map((it) => (it.id === id ? { ...it, ...revert } : it))
        );
      notify(SAVE_ERR);
    } finally {
      setSaving(null);
    }
  }

  async function addItem() {
    setAdding(true);
    try {
      const item = await insertChecklistItem({
        title: "",
        sort: nextSort(itemList),
      });
      setItemList((prev) => [...prev, item]);
    } catch {
      notify("항목 추가에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setAdding(false);
    }
  }

  async function removeItem(id: string) {
    if (
      !confirm(
        "이 항목을 삭제하면 모든 업체의 해당 평가도 함께 사라집니다. 진행할까요?"
      )
    )
      return;
    const idx = itemList.findIndex((i) => i.id === id);
    const removed = itemList[idx];
    const removedAnswers = answerList.filter((a) => a.item_id === id);
    setItemList((p) => p.filter((i) => i.id !== id)); // 낙관적 제거
    setAnswerList((p) => p.filter((a) => a.item_id !== id)); // 딸린 답변도(캐스케이드)
    try {
      await deleteChecklistItem(id);
    } catch {
      if (removed) setItemList((p) => insertAt(p, idx, removed));
      if (removedAnswers.length)
        setAnswerList((p) => [...p, ...removedAnswers]);
      notify("삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  // ─── 업체 ───────────────────────────────────────────────────────────────
  async function addVendor(name: string) {
    try {
      const vendor = await insertVendor(name, nextSort(vendorList));
      setVendorList((v) => [...v, vendor]);
      selectVendor(vendor.id); // 새 업체로 전환
    } catch {
      notify(SAVE_ERR);
    }
  }

  function renameVendor(id: string, name: string) {
    const before = vendorList.find((v) => v.id === id)?.name;
    const setName = (val: string) =>
      setVendorList((v) => v.map((x) => (x.id === id ? { ...x, name: val } : x)));
    setName(name);
    updateVendor(id, { name }).catch(() => {
      if (before !== undefined) setName(before);
      notify(SAVE_ERR);
    });
  }

  async function removeVendor(id: string) {
    if (!confirm("이 업체와 이 업체의 모든 평가가 삭제됩니다. 진행할까요?")) return;
    try {
      await deleteVendor(id);
      setVendorList((v) => v.filter((x) => x.id !== id));
      setAnswerList((a) => a.filter((x) => x.vendor_id !== id)); // 딸린 답변도(캐스케이드)
      if (id === activeId) {
        const nextV = vendorList.find((x) => x.id !== id);
        if (nextV) selectVendor(nextV.id);
      }
    } catch {
      notify("삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  // 활성 업체 기준으로 항목+답변 합성(항목 sort 순).
  const rows = useMemo(
    () => (activeVendor ? composeRows(itemList, answerList, activeVendor.id) : []),
    [activeVendor, itemList, answerList]
  );
  const { total, checked, average, pct } = checklistStats(rows);

  return (
    <div className="flex flex-col min-h-screen">
      {flash && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 flex items-center gap-2 rounded-lg bg-inverse-surface px-4 py-2.5 text-caption text-inverse-on-surface shadow-lift"
        >
          <span className="material-symbols-outlined text-[16px]">error</span>
          {flash.msg}
        </div>
      )}
      <Hero
        image={CHECKLIST_HERO}
        icon="lock"
        eyebrow="관리자 전용 · 업체 비공개"
        title="업체 평가 체크리스트"
        subtitle="업체를 골라 미팅 중 체크·별점·메모를 남기세요. 이 페이지는 업체에게 노출되지 않습니다."
        meta={
          <>
            <HeroChip icon="storefront">업체 {vendorList.length}곳</HeroChip>
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
          {/* 업체 선택 바 — 드롭다운으로 평가 대상 업체 전환 + 업체 관리 */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <label
                htmlFor="vendor-select"
                className="text-label-md font-label-md text-secondary"
              >
                업체
              </label>
              <select
                id="vendor-select"
                value={activeId}
                onChange={(e) => selectVendor(e.target.value)}
                disabled={vendorList.length === 0}
                title={activeVendor?.name}
                aria-label="평가할 업체 선택"
                className="space-select disabled:opacity-40"
                style={{ maxWidth: "16rem" }}
              >
                {vendorList.length === 0 && <option value="">업체 없음</option>}
                {vendorList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              {switching && (
                <span
                  role="status"
                  className="flex items-center gap-1.5 text-label-md font-label-md text-secondary"
                >
                  <Spinner size={14} />
                  전환 중…
                </span>
              )}
            </div>
            <button
              onClick={() => setShowManager(true)}
              className="flex items-center gap-1 border border-outline-variant text-primary px-4 py-2 rounded-lg text-label-md font-label-md hover:bg-surface-container-low active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              업체 관리
            </button>
          </div>

          <h2 className="text-headline-md font-headline-md text-primary mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">fact_check</span>
            평가 항목
          </h2>

          {!activeVendor ? (
            <div className="bg-surface-container-lowest p-10 rounded-xl shadow-soft text-center">
              <p className="text-body-md text-secondary mb-4">
                평가할 업체가 없습니다. 먼저 업체를 추가하세요.
              </p>
              <button
                onClick={() => setShowManager(true)}
                className="inline-flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md hover:opacity-90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                업체 추가
              </button>
            </div>
          ) : (
            <>
              {rows.map(({ item, checked: isChecked, rating, note }, idx) => (
                <div
                  // 업체+항목 키 — 업체 전환 시 remount 되어 uncontrolled 메모칸이 새 값으로 갱신됨.
                  key={`${activeId}:${item.id}`}
                  className="lift bg-surface-container-lowest p-6 rounded-xl shadow-soft"
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          persistAnswer(item.id, { checked: e.target.checked })
                        }
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
                            onBlur={(e) => persistTitle(item.id, e.target.value)}
                            placeholder="평가 항목 제목"
                            className="flex-1 bg-transparent border-0 border-b border-transparent hover:border-outline-variant focus:border-primary text-body-lg font-body-lg font-semibold text-primary py-1 outline-none transition-colors"
                          />
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <StarRating
                            value={rating}
                            onChange={(v) => persistAnswer(item.id, { rating: v })}
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
                        defaultValue={note ?? ""}
                        onBlur={(e) => persistAnswer(item.id, { note: e.target.value })}
                        placeholder="미팅 메모..."
                        className="field w-full min-h-[80px]"
                      />
                      {saving === item.id && (
                        <p className="flex items-center gap-1.5 text-caption text-secondary mt-1">
                          <Spinner size={13} />
                          저장 중…
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addItem}
                disabled={adding}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-outline-variant text-label-md font-label-md text-primary hover:bg-surface-container-low transition-colors disabled:opacity-60"
              >
                {adding ? (
                  <Spinner size={18} />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">add</span>
                )}
                {adding ? "추가 중…" : "항목 추가"}
              </button>
            </>
          )}
        </div>

        {/* 요약 사이드바 */}
        <div className="rise col-span-12 lg:col-span-4 space-y-gutter">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-soft border-t-4 border-primary sticky top-8">
            <h3 className="text-headline-md font-headline-md text-primary mb-1">
              종합 평가
            </h3>
            {activeVendor && (
              <p className="text-caption text-secondary mb-6 truncate" title={activeVendor.name}>
                {activeVendor.name}
              </p>
            )}
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
                  ? "변경 사항은 업체별로 자동 저장됩니다."
                  : "미리보기 모드 — Supabase 연결 시 저장됩니다."}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {showManager && (
        <VendorManager
          vendors={vendorList}
          onAdd={addVendor}
          onRename={renameVendor}
          onRemove={removeVendor}
          onClose={() => setShowManager(false)}
        />
      )}
    </div>
  );
}
