import LoadingScreen from "@/components/LoadingScreen";

// 세그먼트 단위 Suspense 폴백 — 이 페이지로 "진입"할 때마다 새 로딩 경계가 생겨
// 서버 데이터 로딩 동안 통일 로딩 화면이 확실히 보인다(루트 폴백만으론 이전 화면이 유지됨).
export default function Loading() {
  return <LoadingScreen />;
}
