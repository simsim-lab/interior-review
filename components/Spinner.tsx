// 통일 로딩 스피너 — "처리 중" 을 시각적으로 알리는 회전 링.
// currentColor 를 상속하므로 버튼/화면 어디서든 주변 텍스트 색을 따라간다.
// 회전 애니메이션은 globals.css 의 `.spinner`(reduced-motion 시 감속) 로 처리.
export default function Spinner({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={`spinner shrink-0 ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="presentation"
      aria-hidden="true"
    >
      {/* 배경 트랙 (옅게) */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="3"
      />
      {/* 회전 호 */}
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
