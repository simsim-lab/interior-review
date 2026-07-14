// 단일 행 "크게 보기" = 공유 대상 페이지의 본문.
// SpaceView 표의 한 행을 카드 하나로 크게 펼쳐 보여준다(공간·분류·내용·메모·사진).
// 서버 컴포넌트 — 내부의 PhotoGrid·CopyLinkButton 만 클라이언트.
import Link from "next/link";
import type { RowDetail as RowDetailData } from "@/lib/detail";
import type { ShareMode } from "@/lib/share";
import { spacePath } from "@/lib/share";
import Hero, { HeroChip } from "./Hero";
import Footer from "./Footer";
import PhotoGrid from "./PhotoGrid";
import CopyLinkButton from "./CopyLinkButton";

const HERO_IMG = {
  requirement:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=70",
  current:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=70",
} as const;

const MODE_META = {
  requirement: {
    heroImg: HERO_IMG.requirement,
    contentLabel: "요구사항",
    chip: "요구사항 명세",
    chipIcon: "architecture",
    backLabel: "요구사항 전체 보기",
  },
  current: {
    heroImg: HERO_IMG.current,
    contentLabel: "현재 상태",
    chip: "현재상태 기록",
    chipIcon: "photo_library",
    backLabel: "현재상태 전체 보기",
  },
} as const;

export default function RowDetail({
  detail,
  mode,
  path,
}: {
  detail: RowDetailData;
  mode: ShareMode;
  path: string; // 이 행의 공유 경로(링크 복사용)
}) {
  const m = MODE_META[mode];
  const back = spacePath(mode, detail.space.slug);

  return (
    <div className="flex min-h-screen flex-col">
      <Hero
        image={m.heroImg}
        icon="cottage"
        eyebrow="우리집 리모델링"
        title={detail.space.name}
        subtitle={`${detail.space.name}의 ${m.contentLabel} 한 건입니다.`}
        meta={
          <>
            <HeroChip icon="grid_view">{detail.space.name}</HeroChip>
            {detail.category && <HeroChip icon="sell">{detail.category}</HeroChip>}
            <HeroChip icon={m.chipIcon}>{m.chip}</HeroChip>
          </>
        }
      />

      <main className="mx-auto flex w-full max-w-container-max flex-grow flex-col gap-6 px-margin-mobile py-8 md:px-margin-desktop md:py-10">
        {/* 돌아가기 + 링크 복사 */}
        <div className="rise flex flex-wrap items-center justify-between gap-3">
          <Link
            href={back}
            className="inline-flex items-center gap-1.5 text-label-md font-label-md text-secondary transition-colors hover:text-primary"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            {m.backLabel}
          </Link>
          <CopyLinkButton path={path} label="이 행 링크 복사" variant="solid" />
        </div>

        {/* 본문 카드 */}
        <article className="rise flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-6 shadow-soft md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{detail.space.name}</span>
            {detail.category && <span className="chip">{detail.category}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
              {m.contentLabel}
            </p>
            <p className="whitespace-pre-line text-body-lg leading-relaxed text-on-surface">
              {detail.content}
            </p>
          </div>

          <div className="flex flex-col gap-2 border-t border-outline-variant/60 pt-5">
            <p className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
              메모
            </p>
            <p className="whitespace-pre-line text-body-md leading-relaxed text-secondary">
              {detail.notes || "—"}
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-outline-variant/60 pt-5">
            <p className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
              사진 {detail.photos.length > 0 ? `(${detail.photos.length})` : ""}
            </p>
            {detail.photos.length > 0 ? (
              <PhotoGrid photos={detail.photos} />
            ) : (
              <p className="text-body-md text-secondary">등록된 사진이 없습니다.</p>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
