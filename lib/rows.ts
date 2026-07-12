// 프레임워크 비의존 순수 로직: 행(요구사항/현재상태)을 다른 공간으로 이동. 테스트 대상.
import type { SpaceBundle, Requirement, CurrentState } from "./types";

/**
 * 행 하나(id)를 fromSpaceId → toSpaceId 로 옮긴 새 번들 배열을 반환한다.
 * - 대상 공간의 끝에 space_id·sort 를 갱신해 추가한다.
 * - 행을 찾지 못하거나 from===to 면 원본을 그대로 반환한다.
 * - 무관한 공간/행은 건드리지 않는다(불변 업데이트).
 */
export function relocateRow(
  bundles: SpaceBundle[],
  mode: "requirement" | "current",
  id: string,
  fromSpaceId: string,
  toSpaceId: string,
  sort: number
): SpaceBundle[] {
  if (fromSpaceId === toSpaceId) return bundles;
  const isReq = mode === "requirement";
  const src = bundles.find((b) => b.space.id === fromSpaceId);
  const moved =
    src && (isReq ? src.requirements : src.currentStates).find((r) => r.id === id);
  if (!moved) return bundles;
  return bundles.map((b) => {
    if (b.space.id === fromSpaceId) {
      return isReq
        ? { ...b, requirements: b.requirements.filter((r) => r.id !== id) }
        : { ...b, currentStates: b.currentStates.filter((c) => c.id !== id) };
    }
    if (b.space.id === toSpaceId) {
      return isReq
        ? {
            ...b,
            requirements: [
              ...b.requirements,
              { ...(moved as Requirement), space_id: toSpaceId, sort },
            ],
          }
        : {
            ...b,
            currentStates: [
              ...b.currentStates,
              { ...(moved as CurrentState), space_id: toSpaceId, sort },
            ],
          };
    }
    return b;
  });
}
