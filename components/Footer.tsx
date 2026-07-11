export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant py-12 mt-auto">
      <div className="max-w-container-max mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="text-label-md font-semibold tracking-widest text-primary">
            우리집 리모델링
          </span>
          <span className="text-outline-variant hidden md:inline">|</span>
          <p className="text-caption text-secondary max-w-sm">
            인테리어 업체 미팅용 요구사항 정리 보드
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-label-md">
          <span className="text-secondary">현재상태</span>
          <span className="text-secondary">요구사항</span>
        </div>
      </div>
    </footer>
  );
}
