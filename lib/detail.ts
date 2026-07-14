// 단일 행 상세 조회 — 전체 번들에서 id 로 한 행을 찾아 표시용 데이터로 정규화.
// 사진은 행 FK(requirement_id/current_state_id)로 전체 번들에서 조회한다
// (공간 이동으로 사진이 다른 번들에 남아도 찾도록 — SpaceView.photosFor 와 동일 규칙).
import type { SpaceBundle, Photo, Space, Requirement, CurrentState } from "./types";
import type { ShareMode } from "./share";

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
