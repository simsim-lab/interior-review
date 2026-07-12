import LoadingScreen from "@/components/LoadingScreen";

// 세그먼트 단위 Suspense 폴백 — app/current-state/loading.tsx 와 동일한 통일 화면.
export default function Loading() {
  return <LoadingScreen />;
}
