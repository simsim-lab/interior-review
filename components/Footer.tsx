import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-outline-variant bg-surface-container-lowest py-12">
      <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-8 px-margin-mobile md:flex-row md:px-margin-desktop">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[18px]">cottage</span>
          </span>
          <span className="font-headline-md text-lg font-medium tracking-tight text-primary">
            우리집 리모델링
          </span>
          <span className="hidden text-outline-variant md:inline">·</span>
          <p className="hidden max-w-sm text-caption text-secondary md:block">
            인테리어 업체 미팅용 요구사항 정리 보드
          </p>
        </div>
        <nav className="flex flex-wrap justify-center gap-8 text-label-md">
          <Link
            href="/current-state"
            className="text-secondary transition-colors hover:text-primary"
          >
            현재상태
          </Link>
          <Link
            href="/requirements"
            className="text-secondary transition-colors hover:text-primary"
          >
            요구사항
          </Link>
        </nav>
      </div>
    </footer>
  );
}
