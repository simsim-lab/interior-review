// 단일 행 상세 조회 — 전체 번들에서 id 로 한 행을 찾아 표시용 데이터로 정규화.
// 사진은 행 FK(requirement_id/current_state_id)로 전체 번들에서 조회한다
// (공간 이동으로 사진이 다른 번들에 남아도 찾도록 — SpaceView.photosFor 와 동일 규칙).
import type { SpaceBundle, Photo, Space, Requirement, CurrentState } from "./types";
import type { ShareMode } from "./share";
import { nextSort } from "./util";

export interface RowDetail {
  id: string;
  space: Space;
  category: string | null; // 요구사항에만 존재
  content: string;
  notes: string | null;
  photos: Photo[];
}

export function findRowDetail(
  bundles: SpaceBundle[],
  mode: ShareMode,
  id: string
): RowDetail | null {
  const isReq = mode === "requirement";
  const kind = isReq ? "requirement" : "current";

  for (const b of bundles) {
    const rows: (Requirement | CurrentState)[] = isReq
      ? b.requirements
      : b.currentStates;
    const row = rows.find((r) => r.id === id);
    if (!row) continue;

    const photos = bundles
      .flatMap((x) => x.photos)
      .filter(
        (p) =>
          p.kind === kind &&
          (isReq ? p.requirement_id : p.current_state_id) === id
      )
      .sort((a, p) => a.sort - p.sort);

    return {
      id,
      space: b.space,
      category: isReq ? (row as Requirement).category : null,
      content: row.content,
      notes: row.notes,
      photos,
    };
  }
  return null;
}

/**
 * 상세 편집(공간 이동)용 컨텍스트 — 공간 목록과 공간별 다음 sort.
 * admin 이 상세에서 공간을 바꿔 저장할 때 대상 공간의 끝 sort 를 쓰기 위함.
 */
export function detailSpaces(bundles: SpaceBundle[], mode: ShareMode) {
  const isReq = mode === "requirement";
  const spaces = bundles.map((b) => ({
    id: b.space.id,
    name: b.space.name,
    slug: b.space.slug,
  }));
  const nextSortBySpace: Record<string, number> = Object.fromEntries(
    bundles.map((b) => [
      b.space.id,
      nextSort(isReq ? b.requirements : b.currentStates),
    ])
  );
  return { spaces, nextSortBySpace };
}
