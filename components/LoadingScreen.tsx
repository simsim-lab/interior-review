import Spinner from "./Spinner";

// 페이지 단위 전체 로딩 화면 — 첫 렌더·페이지 이동 시 콘텐츠 영역(사이드바 유지)에 표시.
// role=status + aria-live 로 스크린리더에도 "처리 중" 을 알린다.
export default function LoadingScreen({
  label = "불러오는 중…",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="route-loading"
      className="flex min-h-[60vh] flex-grow flex-col items-center justify-center gap-4 px-6 text-secondary"
    >
      <Spinner size={40} className="text-primary" />
      <p className="text-body-md">{label}</p>
    </div>
  );
}
