import type {
  Space,
  Requirement,
  CurrentState,
  Photo,
  SpaceBundle,
} from "./types";

/**
 * 공간별로 requirements/currentStates/photos 를 묶고 sort 순으로 정렬한다.
 * 프레임워크 비의존 순수 함수(테스트 대상).
 * - space_id 가 없는 공간을 참조하는 고아 항목은 어떤 번들에도 포함되지 않는다.
 */
export function bundle(
  spaces: Space[],
  requirements: Requirement[],
  currentStates: CurrentState[],
  photos: Photo[]
): SpaceBundle[] {
  return [...spaces]
    .sort((a, b) => a.sort - b.sort)
    .map((space) => ({
      space,
      requirements: requirements
        .filter((r) => r.space_id === space.id)
        .sort((a, b) => a.sort - b.sort),
      currentStates: currentStates
        .filter((c) => c.space_id === space.id)
        .sort((a, b) => a.sort - b.sort),
      photos: photos
        .filter((p) => p.space_id === space.id)
        .sort((a, b) => a.sort - b.sort),
    }));
}
