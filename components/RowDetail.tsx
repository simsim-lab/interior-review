"use client";

// 단일 행 "크게 보기" = 공유 대상 페이지의 본문.
// SpaceView 표의 한 행을 카드 하나로 크게 펼쳐 보여준다(공간·분류·내용·메모·사진).
// admin 은 전체화면에서도 편집 가능 — 리스트와 같은 RowEditModal·뮤테이션을 재사용한다.
// 편집은 SpaceView 와 동일한 "순수 낙관적" 방식(로컬 state 갱신). 저장값을 그대로 반영하므로
// 별도 재조회(router.refresh) 없이도 화면이 맞고, 공개 뷰어는 편집기 청크를 받지 않는다.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Photo } from "@/lib/types";
import type { RowDetail as RowDetailData } from "@/lib/detail";
import type { ShareMode } from "@/lib/share";
import { spacePath } from "@/lib/share";
import Hero, { HeroChip } from "./Hero";
import Footer from "./Footer";
import PhotoGrid from "./PhotoGrid";
import ShareButton from "./ShareButton";
import type { RowEditValues } from "./RowEditModal";
import { updateRow, uploadPhoto, deleteRow, nextSort } from "@/lib/mutations";

// admin 편집 모달은 필요할 때만 로드 — 공개 공유 페이지(뷰어) 초기 번들에서 제외.
const RowEditModal = dynamic(() => import("./RowEditModal"), { ssr: false });

const HERO_IMG = {
  requirement:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=70",
  current:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=70",
} as const;

const MODE_META = {
  requirement: {
    heroImg: HERO_IMG.requirement,
    table: "requirements" as const,
    contentLabel: "요구사항",
    chip: "요구사항 명세",
    chipIcon: "architecture",
    backLabel: "요구사항 전체 보기",
  },
  current: {
    heroImg: HERO_IMG.current,
    table: "current_state" as const,
    contentLabel: "현재 상태",
    chip: "현재상태 기록",
    chipIcon: "photo_library",
    backLabel: "현재상태 전체 보기",
  },
} as const;

const SAVE_ERR = "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.";

type Row = {
  spaceId: string;
  spaceName: string;
  slug: string;
  category: string | null;
  content: string;
  notes: string | null;
};

export default function RowDetail({
  detail,
  mode,
  path,
  isAdmin,
  spaces = [],
  nextSortBySpace = {},
}: {
  detail: RowDetailData;
  mode: ShareMode;
  path: string; // 이 행의 공유 경로
  isAdmin: boolean;
  // 편집(공간 이동)용 컨텍스트 — admin 에게만 전달된다.
  spaces?: { id: string; name: string; slug: string }[];
  nextSortBySpace?: Record<string, number>;
}) {
  const m = MODE_META[mode];
  const isReq = mode === "requirement";

  const [row, setRow] = useState<Row>({
    spaceId: detail.space.id,
    spaceName: detail.space.name,
    slug: detail.space.slug,
    category: detail.category,
    content: detail.content,
    notes: detail.notes,
  });
  const [photos, setPhotos] = useState<Photo[]>(detail.photos);
  const [editing, setEditing] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 토스트 타이머는 ref 로 관리 — 연속 알림이 서로를 조기 소멸시키지 않고, 언마운트 후 setState 도 막는다.
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );
  const notify = (msg: string) => {
    setFlash(msg);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 4000);
  };

  // 편집 저장 — DB 갱신 후 저장값 그대로 로컬 state 에 낙관적 반영.
  async function saveEdit(values: RowEditValues) {
    const patch: Record<string, unknown> = {
      content: values.content,
      notes: values.notes || null,
    };
    if (isReq) patch.category = values.category;
    const moving = values.spaceId !== row.spaceId;
    if (moving) {
      patch.space_id = values.spaceId;
      patch.sort = nextSortBySpace[values.spaceId] ?? nextSort([]);
    }
    try {
      await updateRow(m.table, detail.id, patch);
    } catch {
      notify(SAVE_ERR);
      throw new Error("save failed"); // 모달 유지 → 재시도
    }
    const sp = spaces.find((s) => s.id === values.spaceId);
    setRow({
      spaceId: values.spaceId,
      spaceName: sp?.name ?? row.spaceName,
      slug: sp?.slug ?? row.slug,
      category: isReq ? values.category : null,
      content: values.content,
      notes: values.notes || null,
    });
  }

  async function addPhoto(file: File) {
    try {
      const photo = await uploadPhoto(
        row.spaceId,
        isReq ? "requirement" : "current",
        detail.id,
        file,
        nextSort(photos)
      );
      setPhotos((p) => [...p, photo]);
    } catch {
      notify("사진 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function removePhoto(photoId: string) {
    try {
      await deleteRow("photos", photoId);
      setPhotos((p) => p.filter((x) => x.id !== photoId));
    } catch {
      notify("사진 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {flash && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 flex items-center gap-2 rounded-lg bg-inverse-surface px-4 py-2.5 text-caption text-inverse-on-surface shadow-lift"
        >
          <span className="material-symbols-outlined text-[16px]">error</span>
          {flash}
        </div>
      )}

      <Hero
        image={m.heroImg}
        icon="cottage"
        eyebrow="우리집 리모델링"
        title={row.spaceName}
        subtitle={`${row.spaceName}의 ${m.contentLabel} 한 건입니다.`}
        meta={
          <>
            <HeroChip icon="grid_view">{row.spaceName}</HeroChip>
            {row.category && <HeroChip icon="sell">{row.category}</HeroChip>}
            <HeroChip icon={m.chipIcon}>{m.chip}</HeroChip>
          </>
        }
      />

      <main className="mx-auto flex w-full max-w-container-max flex-grow flex-col gap-6 px-margin-mobile py-8 md:px-margin-desktop md:py-10">
        {/* 돌아가기 + 공유 + (admin) 편집 */}
        <div className="rise flex flex-wrap items-center justify-between gap-3">
          <Link
            href={spacePath(mode, row.slug)}
            className="inline-flex items-center gap-1.5 text-label-md font-label-md text-secondary transition-colors hover:text-primary"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            {m.backLabel}
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-4 py-2 text-label-md font-label-md text-on-surface-variant transition-all hover:border-primary hover:text-primary active:scale-95"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                  edit
                </span>
                편집
              </button>
            )}
            <ShareButton
              path={path}
              shareTitle={`${row.spaceName} · ${
                row.content.split("\n")[0].slice(0, 40) || m.contentLabel
              }`}
              variant="solid"
            />
          </div>
        </div>

        {/* 본문 카드 */}
        <article className="rise flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-6 shadow-soft md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{row.spaceName}</span>
            {row.category && <span className="chip">{row.category}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
              {m.contentLabel}
            </p>
            <p className="whitespace-pre-line text-body-lg leading-relaxed text-on-surface">
              {row.content}
            </p>
          </div>

          <div className="flex flex-col gap-2 border-t border-outline-variant/60 pt-5">
            <p className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
              메모
            </p>
            <p className="whitespace-pre-line text-body-md leading-relaxed text-secondary">
              {row.notes || "—"}
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-outline-variant/60 pt-5">
            <p className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
              사진 {photos.length > 0 ? `(${photos.length})` : ""}
            </p>
            {photos.length > 0 ? (
              <PhotoGrid photos={photos} />
            ) : (
              <p className="text-body-md text-secondary">
                {isAdmin
                  ? "‘편집’에서 사진을 추가할 수 있습니다."
                  : "등록된 사진이 없습니다."}
              </p>
            )}
          </div>
        </article>
      </main>
      <Footer />

      {isAdmin && editing && (
        <RowEditModal
          mode="edit"
          isReq={isReq}
          contentLabel={m.contentLabel}
          spaces={spaces.map((s) => ({ id: s.id, name: s.name }))}
          initial={{
            spaceId: row.spaceId,
            category: row.category ?? "",
            content: row.content,
            notes: row.notes ?? "",
          }}
          photos={photos}
          onAddPhoto={addPhoto}
          onRemovePhoto={removePhoto}
          onConfirm={saveEdit}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
