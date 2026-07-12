"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SpaceBundle, PhotoKind, Photo } from "@/lib/types";
import PhotoGrid from "./PhotoGrid";
import AutoTextarea from "./AutoTextarea";
import Footer from "./Footer";
import Hero, { HeroChip } from "./Hero";
import {
  canPersist,
  insertSpace,
  updateSpace,
  deleteSpace,
  insertRequirement,
  insertCurrentState,
  updateRow,
  deleteRow,
  uploadPhoto,
  nextSort,
} from "@/lib/mutations";

const HERO_IMG = {
  requirement:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=70",
  current:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=70",
} as const;

// 모드별 차이(테이블·사진종류·라벨·아이콘·히어로)를 한 곳에 모은 전략 객체.
// 산재하던 `mode === "requirement"` 분기를 cfg 참조로 대체한다.
const MODE = {
  requirement: {
    photoKind: "requirement" as PhotoKind,
    table: "requirements" as const,
    heroImg: HERO_IMG.requirement,
    heroChip: "요구사항 명세",
    heroChipIcon: "architecture",
    sectionIcon: "architecture",
    photoLabel: "레퍼런스 사진",
  },
  current: {
    photoKind: "current" as PhotoKind,
    table: "current_state" as const,
    heroImg: HERO_IMG.current,
    heroChip: "현재상태 기록",
    heroChipIcon: "photo_library",
    sectionIcon: "photo_camera",
    photoLabel: "현재 사진",
  },
} as const;

const SAVE_ERR = "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.";

export default function SpaceView({
  bundles,
  mode,
  isAdmin,
  title,
  subtitle,
}: {
  bundles: SpaceBundle[];
  mode: "requirement" | "current";
  isAdmin: boolean;
  title: string;
  subtitle: string;
}) {
  const cfg = MODE[mode];
  const [data, setData] = useState<SpaceBundle[]>(bundles);
  const [active, setActive] = useState<string>("all");
  const [newSpace, setNewSpace] = useState("");
  const [adding, setAdding] = useState(false);
  const [showSpaceInput, setShowSpaceInput] = useState(false);
  const [catFilter, setCatFilter] = useState<string>("all");
  const [flash, setFlash] = useState<{ msg: string } | null>(null);
  const photoKind = cfg.photoKind;
  const itemTable = cfg.table;

  // 알림 토스트 — 매번 새 객체라 같은 문구가 연속돼도 4초 타이머가 갱신됨.
  const notify = (msg: string) => setFlash({ msg });
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const visible =
    active === "all" ? data : data.filter((b) => b.space.slug === active);

  // 분류 필터 (요구사항 모드): 전체 공간의 고유 분류 목록. useMemo 로 참조 안정화.
  const categories = useMemo(
    () =>
      mode === "requirement"
        ? Array.from(
            new Set(
              data.flatMap((b) =>
                b.requirements
                  .map((r) => (r.category || "").trim())
                  .filter(Boolean)
              )
            )
          )
        : [],
    [mode, data]
  );
  // 선택된 분류가 사라지면 렌더 중 파생값으로 "전체"처럼 취급 — 死상태·깜빡임 없음.
  const effectiveCat =
    mode === "requirement" && categories.includes(catFilter) ? catFilter : "all";
  const catActive = effectiveCat !== "all";
  const blocks = visible.filter((b) =>
    catActive
      ? b.requirements.some((r) => (r.category || "").trim() === effectiveCat)
      : true
  );

  // ─── 공간 ───
  async function addSpace() {
    const name = newSpace.trim();
    if (!name) return;
    setAdding(true);
    try {
      const space = await insertSpace(name, nextSort(data.map((b) => b.space)));
      setData((d) => [
        ...d,
        { space, requirements: [], currentStates: [], photos: [] },
      ]);
      setNewSpace("");
      setShowSpaceInput(false);
    } catch {
      notify(SAVE_ERR);
    } finally {
      setAdding(false);
    }
  }

  // 낙관적 변경: 실패 시 해당 공간의 이름만 되돌림(다른 편집 보존).
  function renameSpace(spaceId: string, name: string) {
    const before = data.find((b) => b.space.id === spaceId)?.space.name;
    const setName = (v: string) =>
      setData((d) =>
        d.map((b) =>
          b.space.id === spaceId ? { ...b, space: { ...b.space, name: v } } : b
        )
      );
    setName(name);
    updateSpace(spaceId, { name }).catch(() => {
      if (before !== undefined) setName(before);
      notify(SAVE_ERR);
    });
  }

  async function removeSpace(spaceId: string) {
    if (!confirm("이 공간과 하위 항목·사진이 모두 삭제됩니다. 진행할까요?")) return;
    try {
      await deleteSpace(spaceId);
      setData((d) => d.filter((b) => b.space.id !== spaceId));
    } catch {
      notify("삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  // ─── 항목 ───
  async function addItem(spaceId: string) {
    const bundle = data.find((b) => b.space.id === spaceId);
    if (!bundle) return;
    try {
      if (mode === "requirement") {
        const row = await insertRequirement({
          space_id: spaceId,
          category: "",
          content: "",
          notes: null,
          sort: nextSort(bundle.requirements),
        });
        setData((d) =>
          d.map((b) =>
            b.space.id === spaceId
              ? { ...b, requirements: [...b.requirements, row] }
              : b
          )
        );
      } else {
        const row = await insertCurrentState({
          space_id: spaceId,
          content: "",
          notes: null,
          sort: nextSort(bundle.currentStates),
        });
        setData((d) =>
          d.map((b) =>
            b.space.id === spaceId
              ? { ...b, currentStates: [...b.currentStates, row] }
              : b
          )
        );
      }
    } catch {
      notify(SAVE_ERR);
    }
  }

  function patchItem(spaceId: string, id: string, patch: Record<string, unknown>) {
    // 실패 시 되돌릴 값: 해당 항목의 "패치된 필드만" 캡처(다른 편집 보존).
    const bundle = data.find((b) => b.space.id === spaceId);
    const rows = mode === "requirement" ? bundle?.requirements : bundle?.currentStates;
    const before = rows?.find((r) => r.id === id) as
      | Record<string, unknown>
      | undefined;
    const revert = before
      ? Object.fromEntries(Object.keys(patch).map((k) => [k, before[k]]))
      : null;

    const apply = (p: Record<string, unknown>) =>
      setData((d) =>
        d.map((b) => {
          if (b.space.id !== spaceId) return b;
          if (mode === "requirement") {
            return {
              ...b,
              requirements: b.requirements.map((r) =>
                r.id === id ? { ...r, ...p } : r
              ),
            };
          }
          return {
            ...b,
            currentStates: b.currentStates.map((c) =>
              c.id === id ? { ...c, ...p } : c
            ),
          };
        })
      );

    apply(patch);
    updateRow(itemTable, id, patch).catch(() => {
      if (revert) apply(revert); // 해당 항목의 해당 필드만 복원
      notify(SAVE_ERR);
    });
  }

  async function removeItem(spaceId: string, id: string) {
    try {
      await deleteRow(itemTable, id);
      setData((d) =>
        d.map((b) => {
          if (b.space.id !== spaceId) return b;
          return mode === "requirement"
            ? { ...b, requirements: b.requirements.filter((r) => r.id !== id) }
            : { ...b, currentStates: b.currentStates.filter((c) => c.id !== id) };
        })
      );
    } catch {
      notify("삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  // ─── 사진 ───
  async function addPhoto(spaceId: string, file: File) {
    const bundle = data.find((b) => b.space.id === spaceId);
    if (!bundle) return;
    try {
      const photo = await uploadPhoto(
        spaceId,
        photoKind,
        file,
        nextSort(bundle.photos)
      );
      setData((d) =>
        d.map((b) =>
          b.space.id === spaceId ? { ...b, photos: [...b.photos, photo] } : b
        )
      );
    } catch {
      notify("사진 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function removePhoto(spaceId: string, photoId: string) {
    try {
      await deleteRow("photos", photoId);
      setData((d) =>
        d.map((b) =>
          b.space.id === spaceId
            ? { ...b, photos: b.photos.filter((p) => p.id !== photoId) }
            : b
        )
      );
    } catch {
      notify("사진 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

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
        image={cfg.heroImg}
        icon="cottage"
        eyebrow="우리집 리모델링"
        title={title}
        subtitle={subtitle}
        meta={
          <>
            <HeroChip icon="grid_view">공간 {data.length}곳</HeroChip>
            <HeroChip icon={cfg.heroChipIcon}>{cfg.heroChip}</HeroChip>
          </>
        }
      />
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-10 flex flex-col gap-6">
        {isAdmin && !canPersist && (
          <div className="flex items-center gap-2 text-caption text-secondary bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2">
            <span className="material-symbols-outlined text-[16px]">info</span>
            미리보기 모드 — 편집·업로드는 저장되지 않습니다 (Supabase 연결 시 저장).
          </div>
        )}

        {/* 탭 + 공간추가 + 분류 필터 */}
        <div className="rise flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <nav className="flex items-center gap-6 border-b border-outline-variant overflow-x-auto pb-px custom-scrollbar sm:flex-1 sm:min-w-0">
              {[{ slug: "all", name: "전체" }, ...data.map((b) => b.space)].map((s) => (
                <button
                  key={s.slug}
                  onClick={() => setActive(s.slug)}
                  className={`relative py-4 text-label-md font-label-md whitespace-nowrap transition-colors ${
                    active === s.slug
                      ? "text-primary font-bold active-tab-line"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </nav>

            {isAdmin && (
              <div className="flex shrink-0 items-center gap-2 sm:pb-3">
                {showSpaceInput ? (
                  <>
                    <input
                      autoFocus
                      value={newSpace}
                      onChange={(e) => setNewSpace(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addSpace();
                        if (e.key === "Escape") {
                          setShowSpaceInput(false);
                          setNewSpace("");
                        }
                      }}
                      placeholder="새 공간 이름"
                      className="field w-40"
                    />
                    <button
                      onClick={addSpace}
                      disabled={adding || !newSpace.trim()}
                      className="flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      확인
                    </button>
                    <button
                      onClick={() => {
                        setShowSpaceInput(false);
                        setNewSpace("");
                      }}
                      className="text-secondary hover:text-primary px-2 py-2 text-label-md"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowSpaceInput(true)}
                    className="flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md hover:opacity-90 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    공간 추가
                  </button>
                )}
              </div>
            )}
          </div>

          {mode === "requirement" && categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1 text-caption text-secondary">
                <span className="material-symbols-outlined text-[16px]">filter_list</span>
                분류
              </span>
              <button
                type="button"
                className="fchip"
                data-active={effectiveCat === "all"}
                onClick={() => setCatFilter("all")}
              >
                전체
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="fchip"
                  data-active={effectiveCat === c}
                  onClick={() => setCatFilter(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 공간별 블록 */}
        <div className="space-y-10 md:space-y-12">
          {blocks.map((b, si) => {
            const photos = b.photos.filter((p) => p.kind === photoKind);
            return (
              <section
                key={b.space.id}
                className="rise scroll-mt-8"
                style={{ animationDelay: `${Math.min(si, 6) * 70}ms` }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tertiary-container/70 text-tertiary">
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {cfg.sectionIcon}
                    </span>
                  </span>
                  {isAdmin ? (
                    <input
                      defaultValue={b.space.name}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== b.space.name) renameSpace(b.space.id, v);
                        else e.target.value = b.space.name;
                      }}
                      aria-label="공간 이름"
                      className="text-headline-md font-headline-md text-primary bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary outline-none py-1 min-w-0 transition-colors"
                    />
                  ) : (
                    <h2 className="text-headline-md font-headline-md text-primary">
                      {b.space.name}
                    </h2>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => removeSpace(b.space.id)}
                      title="공간 삭제"
                      className="text-secondary hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        delete
                      </span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter items-start">
                  {/* 좌: 텍스트 내용 */}
                  <div className="xl:col-span-2 bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden">
                    {mode === "requirement" ? (
                      <RequirementBlock
                        bundle={b}
                        isAdmin={isAdmin}
                        filterCat={effectiveCat}
                        onPatch={patchItem}
                        onRemove={removeItem}
                        onAdd={addItem}
                      />
                    ) : (
                      <CurrentStateBlock
                        bundle={b}
                        isAdmin={isAdmin}
                        onPatch={patchItem}
                        onRemove={removeItem}
                        onAdd={addItem}
                      />
                    )}
                  </div>

                  {/* 우: 사진 */}
                  <aside className="lift bg-surface-container-low rounded-xl p-5 shadow-soft">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-label-md font-label-md text-secondary">
                        {cfg.photoLabel}
                      </p>
                      {isAdmin && (
                        <PhotoUploadButton
                          onSelect={(file) => addPhoto(b.space.id, file)}
                        />
                      )}
                    </div>
                    {photos.length > 0 ? (
                      <AdminPhotos
                        photos={photos}
                        isAdmin={isAdmin}
                        onRemove={(pid) => removePhoto(b.space.id, pid)}
                      />
                    ) : (
                      <div className="aspect-video w-full rounded-lg border border-dashed border-outline-variant flex items-center justify-center text-secondary text-caption">
                        <span className="material-symbols-outlined mr-1 text-[18px]">
                          image
                        </span>
                        사진 없음
                      </div>
                    )}
                  </aside>
                </div>
              </section>
            );
          })}
          {blocks.length === 0 && (
            <div className="text-center text-secondary text-body-md py-16">
              {catActive
                ? `"${effectiveCat}" 분류에 해당하는 요구사항이 없습니다.`
                : isAdmin
                ? "위에서 공간을 추가하세요."
                : "등록된 공간이 없습니다."}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─── 요구사항 블록 ──────────────────────────────────────────────────────────
function RequirementBlock({
  bundle,
  isAdmin,
  filterCat,
  onPatch,
  onRemove,
  onAdd,
}: {
  bundle: SpaceBundle;
  isAdmin: boolean;
  filterCat: string;
  onPatch: (spaceId: string, id: string, patch: Record<string, unknown>) => void;
  onRemove: (spaceId: string, id: string) => void;
  onAdd: (spaceId: string) => void;
}) {
  const spaceId = bundle.space.id;
  // 관리자는 행을 숨기지 않는다(분류 편집 중 행이 사라지는 것 방지). 공간 단위 필터는
  // 부모 blocks 에서 이미 적용됨. 뷰어(업체)만 행 단위로 필터링.
  const rows =
    filterCat === "all" || isAdmin
      ? bundle.requirements
      : bundle.requirements.filter(
          (r) => (r.category || "").trim() === filterCat
        );
  if (!isAdmin && bundle.requirements.length === 0) {
    return (
      <div className="p-8 text-center text-secondary text-body-md">
        등록된 요구사항이 없습니다.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full min-w-[520px] text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant">
            <th className="px-8 py-3.5 text-label-md font-label-md text-secondary uppercase tracking-wider">
              분류
            </th>
            <th className="px-8 py-3.5 text-label-md font-label-md text-secondary uppercase tracking-wider">
              요구사항
            </th>
            <th className="px-8 py-3.5 text-label-md font-label-md text-secondary uppercase tracking-wider">
              메모
            </th>
            {isAdmin && <th className="w-10" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">
          {rows.map((r) =>
            isAdmin ? (
              <tr key={r.id} className="align-top">
                <td className="px-4 py-3.5">
                  <input
                    defaultValue={r.category}
                    onBlur={(e) =>
                      onPatch(spaceId, r.id, { category: e.target.value })
                    }
                    placeholder="분류"
                    className="chip-input w-20 ml-2 mt-1.5"
                  />
                </td>
                <td className="px-4 py-3.5">
                  <AutoTextarea
                    defaultValue={r.content}
                    onBlur={(e) =>
                      onPatch(spaceId, r.id, { content: e.target.value })
                    }
                    placeholder="요구사항 내용"
                    className="cell-edit"
                  />
                </td>
                <td className="px-4 py-3.5">
                  <AutoTextarea
                    defaultValue={r.notes ?? ""}
                    onBlur={(e) =>
                      onPatch(spaceId, r.id, { notes: e.target.value || null })
                    }
                    placeholder="메모"
                    className="cell-edit"
                  />
                </td>
                <td className="px-2 py-3.5 text-center">
                  <button
                    onClick={() => onRemove(spaceId, r.id)}
                    title="삭제"
                    className="text-secondary hover:text-error"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </td>
              </tr>
            ) : (
              <tr
                key={r.id}
                className="hover:bg-surface-container/50 transition-colors"
              >
                <td className="px-8 py-7 align-top">
                  <span className="chip">{r.category || "일반"}</span>
                </td>
                <td className="px-8 py-7 align-top text-body-md text-on-surface-variant">
                  {r.content}
                </td>
                <td className="px-8 py-7 align-top text-body-md text-secondary whitespace-pre-line">
                  {r.notes || "—"}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
      {isAdmin && <AddItemButton onClick={() => onAdd(spaceId)} label="요구사항 추가" />}
    </div>
  );
}

// ─── 현재상태 블록 ──────────────────────────────────────────────────────────
function CurrentStateBlock({
  bundle,
  isAdmin,
  onPatch,
  onRemove,
  onAdd,
}: {
  bundle: SpaceBundle;
  isAdmin: boolean;
  onPatch: (spaceId: string, id: string, patch: Record<string, unknown>) => void;
  onRemove: (spaceId: string, id: string) => void;
  onAdd: (spaceId: string) => void;
}) {
  const spaceId = bundle.space.id;
  if (!isAdmin && bundle.currentStates.length === 0) {
    return (
      <div className="p-8 text-center text-secondary text-body-md">
        등록된 현재상태가 없습니다.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full min-w-[420px] text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant">
            <th className="px-8 py-3.5 text-label-md font-label-md text-secondary uppercase tracking-wider">
              현재 상태
            </th>
            <th className="px-8 py-3.5 text-label-md font-label-md text-secondary uppercase tracking-wider">
              메모
            </th>
            {isAdmin && <th className="w-10" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">
          {bundle.currentStates.map((c) =>
            isAdmin ? (
              <tr key={c.id} className="align-top">
                <td className="px-4 py-3.5">
                  <AutoTextarea
                    defaultValue={c.content}
                    onBlur={(e) =>
                      onPatch(spaceId, c.id, { content: e.target.value })
                    }
                    placeholder="현재 상태 내용"
                    className="cell-edit"
                  />
                </td>
                <td className="px-4 py-3.5">
                  <AutoTextarea
                    defaultValue={c.notes ?? ""}
                    onBlur={(e) =>
                      onPatch(spaceId, c.id, { notes: e.target.value || null })
                    }
                    placeholder="메모 (선택)"
                    className="cell-edit"
                  />
                </td>
                <td className="px-2 py-3.5 text-center">
                  <button
                    onClick={() => onRemove(spaceId, c.id)}
                    title="삭제"
                    className="text-secondary hover:text-error"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </td>
              </tr>
            ) : (
              <tr
                key={c.id}
                className="hover:bg-surface-container/50 transition-colors"
              >
                <td className="px-8 py-7 align-top text-body-md text-on-surface-variant whitespace-pre-line">
                  {c.content}
                </td>
                <td className="px-8 py-7 align-top text-body-md text-secondary whitespace-pre-line">
                  {c.notes || "—"}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
      {isAdmin && <AddItemButton onClick={() => onAdd(spaceId)} label="현재상태 추가" />}
    </div>
  );
}

function AddItemButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-4 text-label-md font-label-md text-primary border-t border-outline-variant hover:bg-surface-container-low transition-colors"
    >
      <span className="material-symbols-outlined text-[18px]">add</span>
      {label}
    </button>
  );
}

function PhotoUploadButton({ onSelect }: { onSelect: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="flex items-center gap-1 text-label-md text-primary hover:underline disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">upload</span>
        {busy ? "업로드 중…" : "사진 추가"}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            await onSelect(file);
          } finally {
            setBusy(false);
            if (ref.current) ref.current.value = "";
          }
        }}
      />
    </>
  );
}

function AdminPhotos({
  photos,
  isAdmin,
  onRemove,
}: {
  photos: Photo[];
  isAdmin: boolean;
  onRemove: (id: string) => void;
}) {
  if (!isAdmin) return <PhotoGrid photos={photos} />;
  // admin: 삭제 버튼 오버레이 + 라이트박스
  return (
    <div className="space-y-3">
      <PhotoGrid photos={photos} />
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => (
          <button
            key={p.id}
            onClick={() => onRemove(p.id)}
            className="flex items-center gap-1 text-caption text-secondary hover:text-error border border-outline-variant rounded-full px-2 py-1"
            title="사진 삭제"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
            {p.caption?.slice(0, 12) || "사진"}
          </button>
        ))}
      </div>
    </div>
  );
}
