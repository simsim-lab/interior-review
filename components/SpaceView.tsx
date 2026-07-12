"use client";

import { useRef, useState } from "react";
import type { SpaceBundle, PhotoKind, Photo } from "@/lib/types";
import PhotoGrid from "./PhotoGrid";
import AutoTextarea from "./AutoTextarea";
import Footer from "./Footer";
import Hero, { HeroChip } from "./Hero";

const HERO_IMG = {
  requirement:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=70",
  current:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=70",
} as const;
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
} from "@/lib/mutations";

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
  const [data, setData] = useState<SpaceBundle[]>(bundles);
  const [active, setActive] = useState<string>("all");
  const [newSpace, setNewSpace] = useState("");
  const [adding, setAdding] = useState(false);
  const [showSpaceInput, setShowSpaceInput] = useState(false);
  const [catFilter, setCatFilter] = useState<string>("all");
  const photoKind: PhotoKind = mode === "requirement" ? "requirement" : "current";
  const itemTable = mode === "requirement" ? "requirements" : "current_state";

  const visible =
    active === "all" ? data : data.filter((b) => b.space.slug === active);

  // 분류 필터 (요구사항 모드): 전체 공간의 고유 분류 목록
  const categories =
    mode === "requirement"
      ? Array.from(
          new Set(
            data.flatMap((b) =>
              b.requirements.map((r) => (r.category || "").trim()).filter(Boolean)
            )
          )
        )
      : [];
  const catActive = mode === "requirement" && catFilter !== "all";
  const blocks = visible.filter((b) =>
    catActive
      ? b.requirements.some((r) => (r.category || "").trim() === catFilter)
      : true
  );

  // ─── 공간 ───
  async function addSpace() {
    const name = newSpace.trim();
    if (!name) return;
    setAdding(true);
    try {
      const space = await insertSpace(name, data.length + 1);
      setData((d) => [
        ...d,
        { space, requirements: [], currentStates: [], photos: [] },
      ]);
      setNewSpace("");
      setShowSpaceInput(false);
    } finally {
      setAdding(false);
    }
  }

  function renameSpace(spaceId: string, name: string) {
    setData((d) =>
      d.map((b) =>
        b.space.id === spaceId ? { ...b, space: { ...b.space, name } } : b
      )
    );
    updateSpace(spaceId, { name }).catch(() => {});
  }

  async function removeSpace(spaceId: string) {
    if (!confirm("이 공간과 하위 항목·사진이 모두 삭제됩니다. 진행할까요?")) return;
    await deleteSpace(spaceId);
    setData((d) => d.filter((b) => b.space.id !== spaceId));
  }

  // ─── 항목 ───
  async function addItem(spaceId: string) {
    const bundle = data.find((b) => b.space.id === spaceId)!;
    if (mode === "requirement") {
      const row = await insertRequirement({
        space_id: spaceId,
        category: "",
        content: "",
        notes: null,
        sort: bundle.requirements.length + 1,
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
        sort: bundle.currentStates.length + 1,
      });
      setData((d) =>
        d.map((b) =>
          b.space.id === spaceId
            ? { ...b, currentStates: [...b.currentStates, row] }
            : b
        )
      );
    }
  }

  function patchItem(spaceId: string, id: string, patch: Record<string, unknown>) {
    setData((d) =>
      d.map((b) => {
        if (b.space.id !== spaceId) return b;
        if (mode === "requirement") {
          return {
            ...b,
            requirements: b.requirements.map((r) =>
              r.id === id ? { ...r, ...patch } : r
            ),
          };
        }
        return {
          ...b,
          currentStates: b.currentStates.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        };
      })
    );
    updateRow(itemTable, id, patch).catch(() => {});
  }

  async function removeItem(spaceId: string, id: string) {
    await deleteRow(itemTable, id);
    setData((d) =>
      d.map((b) => {
        if (b.space.id !== spaceId) return b;
        return mode === "requirement"
          ? { ...b, requirements: b.requirements.filter((r) => r.id !== id) }
          : { ...b, currentStates: b.currentStates.filter((c) => c.id !== id) };
      })
    );
  }

  // ─── 사진 ───
  async function addPhoto(spaceId: string, file: File) {
    const bundle = data.find((b) => b.space.id === spaceId)!;
    const photo = await uploadPhoto(
      spaceId,
      photoKind,
      file,
      bundle.photos.length + 1
    );
    setData((d) =>
      d.map((b) =>
        b.space.id === spaceId ? { ...b, photos: [...b.photos, photo] } : b
      )
    );
  }

  async function removePhoto(spaceId: string, photoId: string) {
    await deleteRow("photos", photoId);
    setData((d) =>
      d.map((b) =>
        b.space.id === spaceId
          ? { ...b, photos: b.photos.filter((p) => p.id !== photoId) }
          : b
      )
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Hero
        image={HERO_IMG[mode === "requirement" ? "requirement" : "current"]}
        icon="cottage"
        eyebrow="우리집 리모델링"
        title={title}
        subtitle={subtitle}
        meta={
          <>
            <HeroChip icon="grid_view">공간 {data.length}곳</HeroChip>
            <HeroChip
              icon={mode === "requirement" ? "architecture" : "photo_library"}
            >
              {mode === "requirement" ? "요구사항 명세" : "현재상태 기록"}
            </HeroChip>
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
                data-active={catFilter === "all"}
                onClick={() => setCatFilter("all")}
              >
                전체
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="fchip"
                  data-active={catFilter === c}
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
                      {mode === "requirement" ? "architecture" : "photo_camera"}
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
                        filterCat={catFilter}
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
                        {mode === "requirement" ? "레퍼런스 사진" : "현재 사진"}
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
                ? `"${catFilter}" 분류에 해당하는 요구사항이 없습니다.`
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
  const rows =
    filterCat === "all"
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
