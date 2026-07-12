import LoadingScreen from "@/components/LoadingScreen";

// 세그먼트 단위 Suspense 폴백 — 체크리스트 접근/데이터 로딩 동안 통일 로딩 화면.
export default function Loading() {
  return <LoadingScreen />;
}
