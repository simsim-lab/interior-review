// 프레임워크 비의존 순수 필터 로직 (요구사항 분류 필터). 테스트 대상.
import type { SpaceBundle } from "./types";

/** 요구사항 번들에서 고유 분류 목록 — 공백 제거·빈값 제외, 등장 순서 유지. */
export function requirementCategories(bundles: SpaceBundle[]): string[] {
  return Array.from(
    new Set(
      bundles.flatMap((b) =>
        b.requirements.map((r) => (r.category || "").trim()).filter(Boolean)
      )
    )
  );
}

/**
 * 선택된 분류가 목록에 없으면 "all"(전체)로 폴백.
 * (분류가 삭제/변경돼 사라져도 死상태·깜빡임 없이 "전체"처럼 취급.)
 */
export function effectiveCategory(
  selected: string,
  categories: string[]
): string {
  return categories.includes(selected) ? selected : "all";
}
