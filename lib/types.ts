// 데이터 모델 — Supabase 테이블과 1:1. seed.ts 도 동일 형태.

export type PhotoKind = "requirement" | "current";

export interface Space {
  id: string;
  slug: string;
  name: string;
  sort: number;
}

export interface Requirement {
  id: string;
  space_id: string;
  category: string;
  content: string;
  notes: string | null;
  sort: number;
}

export interface CurrentState {
  id: string;
  space_id: string;
  content: string;
  notes: string | null;
  sort: number;
}

export interface Photo {
  id: string;
  space_id: string;
  kind: PhotoKind;
  // 사진은 행(요구사항/현재상태) 단위로 귀속된다. kind 에 따라 한쪽만 채워짐.
  // (space_id 는 스토리지 경로·공간별 조회용으로 유지 — 행 FK 로부터 파생 가능)
  requirement_id: string | null;
  current_state_id: string | null;
  url: string;
  caption: string | null;
  sort: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  checked: boolean;
  rating: number; // 0~5
  note: string | null;
  sort: number;
}

/** 공간 + 그 공간에 속한 요구사항/현재상태/사진을 묶은 뷰 모델 */
export interface SpaceBundle {
  space: Space;
  requirements: Requirement[];
  currentStates: CurrentState[];
  photos: Photo[];
}
