"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  SpaceBundle,
  PhotoKind,
  Requirement,
  CurrentState,
} from "@/lib/types";
import AutoTextarea from "./AutoTextarea";
import Footer from "./Footer";
import Hero, { HeroChip } from "./Hero";
import Spinner from "./Spinner";
import FilterMenu from "./FilterMenu";
import PhotoCell from "./PhotoCell";
import SpaceManager from "./SpaceManager";
import {
  requirementCategories,
  spaceSlugs,
  pruneSelection,
  matchesFilter,
} from "@/lib/filter";
import { revertPatch } from "@/lib/util";
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
const MODE = {
  requirement: {
    photoKind: "requirement" as PhotoKind,
    table: "requirements" as const,
    heroImg: HERO_IMG.requirement,
    heroChip: "요구사항 명세",
    heroChipIcon: "architecture",
    addLabel: "요구사항 추가",
    minWidth: "min-w-[760px]",
  },
  current: {
    photoKind: "current" as PhotoKind,
    table: "current_state" as const,
    heroImg: HERO_IMG.current,
    heroChip: "현재상태 기록",
    heroChipIcon: "photo_library",
    addLabel: "현재상태 추가",
    minWidth: "min-w-[640px]",
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
  const isReq = mode === "requirement";
  const [data, setData] = useState<SpaceBundle[]>(bundles);
  const [active, setActive] = useState<string>("all");
  const [addingItem, setAddingItem] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [catFilter, setCatFilter] = useState<string[]>([]);
  const [spaceFilter, setSpaceFilter] = useState<string[]>([]);
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

  // 탭이 삭제돼 사라지면 "전체"처럼 취급.
  const isAll = active === "all" || !data.some((b) => b.space.slug === active);
  // 참조 안정화 — 이게 매 렌더 새 배열이면 아래 useMemo 들이 memoize 되지 않는다.
  const visibleBundles = useMemo(
    () => (isAll ? data : data.filter((b) => b.space.slug === active)),
    [data, active, isAll]
  );
  const showSpaceCol = isAll; // 공간 열/필터는 "전체"에서만

  // ─── 필터(엑셀식 다중 선택) — 현재 보이는 테이블 기준으로 동적 ───
  const rowsOf = (b: SpaceBundle): (Requirement | CurrentState)[] =>
    isReq ? b.requirements : b.currentStates;
  const catText = (r: Requirement | CurrentState) =>
    "category" in r ? r.category : "";
  const catOf = (r: Requirement | CurrentState) => catText(r).trim();

  // 선택값 폴백: 현재 뷰에 없는 값은 무시(死상태 방지). 공간은 유니크한 slug 로 식별.
  const cat = useMemo(
    () => pruneSelection(catFilter, requirementCategories(visibleBundles)),
    [catFilter, visibleBundles]
  );
  const spc = useMemo(
    () => pruneSelection(spaceFilter, spaceSlugs(visibleBundles)),
    [spaceFilter, visibleBundles]
  );

  // 각 필터의 드롭다운 옵션은 "다른 필터를 적용한 뒤 남는 값"만 노출(동적).
  const spaceScoped = visibleBundles.filter((b) =>
    matchesFilter(b.space.slug, spc)
  );
  const catMenuOptions = requirementCategories(spaceScoped).map((c) => ({
    value: c,
    label: c,
  }));
  const spaceMenuOptions = visibleBundles
    .filter((b) => rowsOf(b).some((r) => matchesFilter(catOf(r), cat)))
    .map((b) => ({ value: b.space.slug, label: b.space.name }));

  // 최종 표시 행 — 공간 필터 → 분류 필터.
  const rows = spaceScoped.flatMap((b) =>
    rowsOf(b)
      .filter((r) => (isReq ? matchesFilter(catOf(r), cat) : true))
      .map((r) => ({ b, r }))
  );

  // 사진은 행 FK 로 조회한다(공간 이동 시 사진이 다른 번들에 남아도 찾도록 전체 검색).
  const allPhotos = useMemo(() => data.flatMap((b) => b.photos), [data]);
  const photosFor = (rowId: string) =>
    allPhotos.filter(
      (p) =>
        p.kind === photoKind &&
        (isReq ? p.requirement_id : p.current_state_id) === rowId
    );

  // ─── 공간 ───
  async function addSpace(name: string) {
    try {
      const space = await insertSpace(name, nextSort(data.map((b) => b.space)));
      setData((d) => [
        ...d,
        { space, requirements: [], currentStates: [], photos: [] },
      ]);
    } catch {
      notify(SAVE_ERR);
    }
  }

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
  async function addRow() {
    // 추가 대상 공간: 개별 탭이면 그 공간, 전체면 현재 보이는 마지막 공간(표 맨 아래).
    const target = isAll
      ? spaceScoped[spaceScoped.length - 1] ??
        visibleBundles[visibleBundles.length - 1]
      : visibleBundles[0];
    if (!target) return;
    const spaceId = target.space.id;
    // 새 행이 활성 분류 필터 밖(빈 분류)이라 안 보이는 혼란 방지 → 분류 필터 해제.
    if (isReq) setCatFilter([]);
    setAddingItem(true);
    try {
      if (isReq) {
        const row = await insertRequirement({
          space_id: spaceId,
          category: "",
          content: "",
          notes: null,
          sort: nextSort(target.requirements),
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
          sort: nextSort(target.currentStates),
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
    } finally {
      setAddingItem(false);
    }
  }

  function patchItem(spaceId: string, id: string, patch: Record<string, unknown>) {
    // 실패 시 되돌릴 값: 해당 항목의 "패치된 필드만" 캡처(다른 편집 보존).
    const bundle = data.find((b) => b.space.id === spaceId);
    const before = rowsOf(bundle ?? ({} as SpaceBundle))?.find(
      (r) => r.id === id
    ) as Record<string, unknown> | undefined;
    const revert = revertPatch(before, patch);

    const apply = (p: Record<string, unknown>) =>
      setData((d) =>
        d.map((b) => {
          if (b.space.id !== spaceId) return b;
          return isReq
            ? {
                ...b,
                requirements: b.requirements.map((r) =>
                  r.id === id ? { ...r, ...p } : r
                ),
              }
            : {
                ...b,
                currentStates: b.currentStates.map((c) =>
                  c.id === id ? { ...c, ...p } : c
                ),
              };
        })
      );

    apply(patch);
    updateRow(itemTable, id, patch).catch(() => {
      if (revert) apply(revert);
      notify(SAVE_ERR);
    });
  }

  // 행을 다른 공간으로 이동(전체 뷰의 "공간" 셀 드롭다운).
  // 대상 공간 끝에 새 sort 로 재배치. 실패 시 "그 행만" 원위치(다른 편집 보존).
  // 사진은 행 FK 로 조회하므로(photosFor 전체검색) 함께 옮길 필요 없음.
  function moveRowSpace(fromSpaceId: string, id: string, toSpaceId: string) {
    if (fromSpaceId === toSpaceId) return;
    const src = data.find((b) => b.space.id === fromSpaceId);
    const orig = src && rowsOf(src).find((r) => r.id === id);
    if (!orig) return;
    const origSort = orig.sort;
    const target = data.find((b) => b.space.id === toSpaceId);
    const newSort = target ? nextSort(rowsOf(target)) : origSort;

    // 특정 행 하나만 from→to 로 옮기는 함수형 업데이트(무관한 행은 건드리지 않음).
    const relocate = (from: string, to: string, sort: number) =>
      setData((d) => {
        const s = d.find((b) => b.space.id === from);
        const moved = s && rowsOf(s).find((r) => r.id === id);
        if (!moved) return d;
        const item = { ...moved, space_id: to, sort };
        return d.map((b) => {
          if (b.space.id === from) {
            return isReq
              ? { ...b, requirements: b.requirements.filter((r) => r.id !== id) }
              : {
                  ...b,
                  currentStates: b.currentStates.filter((c) => c.id !== id),
                };
          }
          if (b.space.id === to) {
            return isReq
              ? { ...b, requirements: [...b.requirements, item as Requirement] }
              : {
                  ...b,
                  currentStates: [...b.currentStates, item as CurrentState],
                };
          }
          return b;
        });
      });

    relocate(fromSpaceId, toSpaceId, newSort); // 낙관적 이동
    updateRow(itemTable, id, { space_id: toSpaceId, sort: newSort }).catch(() => {
      relocate(toSpaceId, fromSpaceId, origSort); // 그 행만 원위치
      notify(SAVE_ERR);
    });
  }

  async function removeItem(spaceId: string, id: string) {
    try {
      await deleteRow(itemTable, id);
      setData((d) =>
        d.map((b) => {
          if (b.space.id !== spaceId) return b;
          return isReq
            ? { ...b, requirements: b.requirements.filter((r) => r.id !== id) }
            : { ...b, currentStates: b.currentStates.filter((c) => c.id !== id) };
        })
      );
    } catch {
      notify("삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  // ─── 사진(행 단위) ───
  async function addPhoto(spaceId: string, rowId: string, file: File) {
    const bundle = data.find((b) => b.space.id === spaceId);
    if (!bundle) return;
    try {
      const photo = await uploadPhoto(
        spaceId,
        photoKind,
        rowId,
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

  // 사진이 (공간 이동 등으로) 어느 번들에 있든 찾아 제거 — 전체 번들에서 필터.
  async function removePhoto(photoId: string) {
    try {
      await deleteRow("photos", photoId);
      setData((d) =>
        d.map((b) => ({
          ...b,
          photos: b.photos.filter((p) => p.id !== photoId),
        }))
      );
    } catch {
      notify("사진 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  // 삭제 열 포함 총 컬럼 수(빈 상태 colSpan 용).
  const colCount =
    (showSpaceCol ? 1 : 0) + (isReq ? 1 : 0) + 2 /*내용·메모*/ + 1 /*사진*/ + (isAdmin ? 1 : 0);

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

        {/* 탭 + 공간 편집 */}
        <div className="rise flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <nav className="flex items-center gap-6 border-b border-outline-variant overflow-x-auto pb-px custom-scrollbar sm:flex-1 sm:min-w-0">
            {[{ slug: "all", name: "전체" }, ...data.map((b) => b.space)].map((s) => {
              const on = isAll ? s.slug === "all" : active === s.slug;
              return (
                <button
                  key={s.slug}
                  onClick={() => setActive(s.slug)}
                  className={`relative py-4 text-label-md font-label-md whitespace-nowrap transition-colors ${
                    on
                      ? "text-primary font-bold active-tab-line"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </nav>

          {isAdmin && (
            <div className="flex shrink-0 items-center gap-2 sm:pb-3">
              <button
                onClick={() => setShowManager(true)}
                className="flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md hover:opacity-90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">edit_location_alt</span>
                공간 편집
              </button>
            </div>
          )}
        </div>

        {/* 통합 테이블 */}
        <div className="rise bg-surface-container-lowest rounded-xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className={`w-full ${cfg.minWidth} text-left border-collapse`}>
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  {showSpaceCol && (
                    <th className="px-6 py-3">
                      <FilterMenu
                        label="공간"
                        options={spaceMenuOptions}
                        selected={spc}
                        onChange={setSpaceFilter}
                      />
                    </th>
                  )}
                  {isReq && (
                    <th className="px-6 py-3">
                      <FilterMenu
                        label="분류"
                        options={catMenuOptions}
                        selected={cat}
                        onChange={setCatFilter}
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">
                    {isReq ? "요구사항" : "현재 상태"}
                  </th>
                  <th className="px-6 py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">
                    메모
                  </th>
                  <th className="px-6 py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">
                    사진
                  </th>
                  {isAdmin && <th className="w-10" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {rows.map(({ b, r }) => (
                  <tr
                    key={r.id}
                    className={
                      isAdmin
                        ? "align-top"
                        : "align-top hover:bg-surface-container/50 transition-colors"
                    }
                  >
                    {showSpaceCol &&
                      (isAdmin ? (
                        <td className="px-4 py-3.5">
                          <select
                            value={b.space.id}
                            onChange={(e) =>
                              moveRowSpace(b.space.id, r.id, e.target.value)
                            }
                            aria-label="공간"
                            className="space-select"
                          >
                            {data.map((sb) => (
                              <option key={sb.space.id} value={sb.space.id}>
                                {sb.space.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      ) : (
                        <td className="px-6 py-5 align-top">
                          <span className="chip">{b.space.name}</span>
                        </td>
                      ))}

                    {isReq &&
                      (isAdmin ? (
                        <td className="px-4 py-3.5">
                          <input
                            defaultValue={catText(r)}
                            onBlur={(e) =>
                              patchItem(b.space.id, r.id, {
                                category: e.target.value,
                              })
                            }
                            placeholder="분류"
                            className="chip-input w-24"
                          />
                        </td>
                      ) : (
                        <td className="px-6 py-5 align-top">
                          <span className="chip">{catText(r) || "일반"}</span>
                        </td>
                      ))}

                    {isAdmin ? (
                      <>
                        <td className="px-4 py-3.5">
                          <AutoTextarea
                            defaultValue={r.content}
                            onBlur={(e) =>
                              patchItem(b.space.id, r.id, {
                                content: e.target.value,
                              })
                            }
                            placeholder={isReq ? "요구사항 내용" : "현재 상태 내용"}
                            className="cell-edit"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <AutoTextarea
                            defaultValue={r.notes ?? ""}
                            onBlur={(e) =>
                              patchItem(b.space.id, r.id, {
                                notes: e.target.value || null,
                              })
                            }
                            placeholder="메모"
                            className="cell-edit"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-5 align-top text-body-md text-on-surface-variant whitespace-pre-line">
                          {r.content}
                        </td>
                        <td className="px-6 py-5 align-top text-body-md text-secondary whitespace-pre-line">
                          {r.notes || "—"}
                        </td>
                      </>
                    )}

                    <td className={isAdmin ? "px-4 py-3.5" : "px-6 py-5 align-top"}>
                      <PhotoCell
                        photos={photosFor(r.id)}
                        isAdmin={isAdmin}
                        onUpload={(file) => addPhoto(b.space.id, r.id, file)}
                        onRemove={(pid) => removePhoto(pid)}
                      />
                    </td>

                    {isAdmin && (
                      <td className="px-2 py-3.5 text-center align-top">
                        <button
                          onClick={() => removeItem(b.space.id, r.id)}
                          title="삭제"
                          className="text-secondary hover:text-error"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            close
                          </span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={colCount}
                      className="px-6 py-16 text-center text-secondary text-body-md"
                    >
                      {cat.length > 0 || spc.length > 0
                        ? "선택한 필터에 해당하는 항목이 없습니다."
                        : isAdmin
                        ? data.length === 0
                          ? "‘공간 편집’에서 공간을 먼저 추가하세요."
                          : "아래 버튼으로 항목을 추가하세요."
                        : isReq
                        ? "등록된 요구사항이 없습니다."
                        : "등록된 현재상태가 없습니다."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {isAdmin && data.length > 0 && (
            <button
              onClick={addRow}
              disabled={addingItem}
              className="w-full flex items-center justify-center gap-2 py-4 text-label-md font-label-md text-primary border-t border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-60"
            >
              {addingItem ? (
                <Spinner size={18} />
              ) : (
                <span className="material-symbols-outlined text-[18px]">add</span>
              )}
              {addingItem ? "추가 중…" : cfg.addLabel}
            </button>
          )}
        </div>
      </main>
      <Footer />

      {showManager && (
        <SpaceManager
          spaces={data.map((b) => b.space)}
          onAdd={addSpace}
          onRename={renameSpace}
          onRemove={removeSpace}
          onClose={() => setShowManager(false)}
        />
      )}
    </div>
  );
}
