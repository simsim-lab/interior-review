// 공유 링크가 가리키는 행이 없을 때(삭제·이동됨) 보여주는 온-브랜드 안내 페이지.
// 받는 사람이 깨진 기본 404 대신 상황과 돌아갈 길을 알 수 있게 한다.
import Link from "next/link";
import type { ShareMode } from "@/lib/share";
import { MODE_BASE } from "@/lib/share";
import Footer from "./Footer";

const LABEL: Record<ShareMode, string> = {
  requirement: "요구사항",
  current: "현재상태",
};

export default function RowMissing({ mode }: { mode: ShareMode }) {
  const label = LABEL[mode];
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-container-max flex-grow flex-col items-center justify-center gap-5 px-margin-mobile py-24 text-center md:px-margin-desktop">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-surface-container text-secondary">
          <span aria-hidden="true" className="material-symbols-outlined text-[32px]">
            search_off
          </span>
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="font-display-lg text-2xl font-medium tracking-tight text-on-surface">
            항목을 찾을 수 없습니다
          </h1>
          <p className="max-w-md text-body-md text-secondary">
            공유된 {label} 항목이 삭제되었거나 주소가 올바르지 않습니다.
          </p>
        </div>
        <Link
          href={MODE_BASE[mode]}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-label-md font-label-md text-on-primary transition-all hover:opacity-90 active:scale-95"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          {label} 전체 보기
        </Link>
      </main>
      <Footer />
    </div>
  );
}
