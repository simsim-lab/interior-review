import LoadingScreen from "@/components/LoadingScreen";

// 루트 Suspense 폴백 — 하위 모든 라우트(현재상태·요구사항·체크리스트·로그인)의
// 서버 데이터 로딩/페이지 이동 중 통일 로딩 화면을 자동으로 보여준다.
export default function Loading() {
  return <LoadingScreen />;
}
