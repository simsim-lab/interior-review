// 프레임워크 비의존 순수 필터 로직 (엑셀식 다중 선택 컬럼 필터). 테스트 대상.
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
 * 번들의 공간 slug 목록 — 등장(정렬) 순서 유지. "공간" 컬럼 필터의 식별자용.
 * (이름은 중복 가능하므로 필터 매칭·키는 반드시 유니크한 slug 로 한다.)
 */
export function spaceSlugs(bundles: SpaceBundle[]): string[] {
  return bundles.map((b) => b.space.slug);
}

/**
 * 선택값 중 현재 가용 목록에 없는 것을 걸러낸다(다중 선택판 폴백).
 * 분류/공간이 삭제·변경돼 사라져도 死상태 없이 자연스럽게 정리됨.
 * 가용 목록의 순서를 따른다.
 */
export function pruneSelection(
  selected: readonly string[],
  available: readonly string[]
): string[] {
  const set = new Set(selected);
  return available.filter((v) => set.has(v));
}

/**
 * 다중 선택 필터 매칭. 선택이 비어 있으면(=필터 없음) 전부 통과.
 * 하나 이상 선택됐으면 그 집합에 포함될 때만 통과.
 */
export function matchesFilter(
  value: string,
  selected: readonly string[]
): boolean {
  return selected.length === 0 || selected.includes(value);
}
