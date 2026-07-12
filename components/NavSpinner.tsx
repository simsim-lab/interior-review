"use client";

import { useLinkStatus } from "next/link";
import Spinner from "./Spinner";

// 사이드바 링크의 페이지 이동이 진행 중이면 아이콘 자리에 스피너를 띄운다.
// Next 16 useLinkStatus 는 <Link> 자식에서만 pending 을 감지하므로 반드시 링크 안에 렌더한다.
// loading.tsx(Suspense 폴백)는 소프트 내비게이션 중 이전 화면을 유지해 표시가 안 되는데,
// 이 훅은 커밋 타이밍과 무관하게 "이동 중" 을 확실히 알려준다.
export default function NavSpinner({
  icon,
  active,
}: {
  icon: string;
  active: boolean;
}) {
  const { pending } = useLinkStatus();
  if (pending) {
    return (
      <span
        data-testid="nav-pending"
        className="grid h-[20px] w-[20px] place-items-center"
      >
        <Spinner size={20} />
      </span>
    );
  }
  return (
    <span
      className="material-symbols-outlined text-[20px]"
      style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {icon}
    </span>
  );
}
