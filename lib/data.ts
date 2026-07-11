// 데이터 로딩 layer (서버 전용).
//  1) Supabase env 있으면 → Supabase 에서 read
//  2) 없으면 → lib/seed.ts 로컬 데모 데이터 (레이아웃 확인용)
import { createClient, SUPABASE_ENABLED } from "./supabase/server";
import {
  SEED_SPACES,
  SEED_REQUIREMENTS,
  SEED_CURRENT_STATES,
  SEED_PHOTOS,
  SEED_CHECKLIST,
} from "./seed";
import type {
  Space,
  Requirement,
  CurrentState,
  Photo,
  ChecklistItem,
  SpaceBundle,
} from "./types";

function bundle(
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

/** 공간 + 요구사항/현재상태/사진 (공개 데이터 — 업체도 열람 가능) */
export async function getSpaceBundles(): Promise<SpaceBundle[]> {
  if (!SUPABASE_ENABLED) {
    return bundle(SEED_SPACES, SEED_REQUIREMENTS, SEED_CURRENT_STATES, SEED_PHOTOS);
  }
  const sb = createClient();
  const [spaces, reqs, states, photos] = await Promise.all([
    sb.from("spaces").select("*"),
    sb.from("requirements").select("*"),
    sb.from("current_state").select("*"),
    sb.from("photos").select("*"),
  ]);
  if (spaces.error || reqs.error || states.error || photos.error) {
    // Supabase 연결됐지만 아직 스키마/데이터 없을 때 → seed 로 안전 fallback
    return bundle(SEED_SPACES, SEED_REQUIREMENTS, SEED_CURRENT_STATES, SEED_PHOTOS);
  }
  return bundle(
    (spaces.data ?? []) as Space[],
    (reqs.data ?? []) as Requirement[],
    (states.data ?? []) as CurrentState[],
    (photos.data ?? []) as Photo[]
  );
}

/**
 * 체크리스트 — admin 전용. 반드시 isAdmin() 확인 후에만 호출할 것.
 * Supabase 연결 시 anon 은 RLS 로 select 자체가 차단되므로 [] 가 돌아온다.
 */
export async function getChecklist(): Promise<ChecklistItem[]> {
  if (!SUPABASE_ENABLED) {
    return [...SEED_CHECKLIST].sort((a, b) => a.sort - b.sort);
  }
  const sb = createClient();
  const { data, error } = await sb.from("checklist_items").select("*");
  if (error || !data) return [];
  return (data as ChecklistItem[]).sort((a, b) => a.sort - b.sort);
}
