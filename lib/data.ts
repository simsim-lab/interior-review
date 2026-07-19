// 데이터 로딩 layer (서버 전용).
//  1) Supabase env 있으면 → Supabase 에서 read
//  2) 없으면 → lib/seed.ts 로컬 데모 데이터 (레이아웃 확인용)
import { createClient, SUPABASE_ENABLED } from "./supabase/server";
import { bundle } from "./bundle";
import {
  SEED_SPACES,
  SEED_REQUIREMENTS,
  SEED_CURRENT_STATES,
  SEED_PHOTOS,
  SEED_VENDORS,
  SEED_CHECKLIST,
  SEED_ANSWERS,
} from "./seed";
import type {
  Space,
  Requirement,
  CurrentState,
  Photo,
  Vendor,
  ChecklistItem,
  ChecklistAnswer,
  SpaceBundle,
} from "./types";

/** 업체 + 공유 항목 템플릿 + 업체별 답변 (admin 전용 체크리스트 묶음). */
export interface ChecklistData {
  vendors: Vendor[];
  items: ChecklistItem[];
  answers: ChecklistAnswer[];
}

/** 공간 + 요구사항/현재상태/사진 (공개 데이터 — 업체도 열람 가능) */
export async function getSpaceBundles(): Promise<SpaceBundle[]> {
  if (!SUPABASE_ENABLED) {
    return bundle(SEED_SPACES, SEED_REQUIREMENTS, SEED_CURRENT_STATES, SEED_PHOTOS);
  }
  const sb = await createClient();
  const [spaces, reqs, states, photos] = await Promise.all([
    sb.from("spaces").select("*").order("sort"),
    sb.from("requirements").select("*").order("space_id").order("sort"),
    sb.from("current_state").select("*").order("space_id").order("sort"),
    sb.from("photos").select("*").order("space_id").order("sort"),
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
 * 체크리스트(업체·항목·답변) — admin 전용. 반드시 isAdmin() 확인 후에만 호출할 것.
 * Supabase 연결 시 anon 은 RLS 로 select 자체가 차단되므로 빈 묶음이 돌아온다.
 */
export async function getChecklistData(): Promise<ChecklistData> {
  if (!SUPABASE_ENABLED) {
    return {
      vendors: [...SEED_VENDORS].sort((a, b) => a.sort - b.sort),
      items: [...SEED_CHECKLIST].sort((a, b) => a.sort - b.sort),
      answers: SEED_ANSWERS,
    };
  }
  const sb = await createClient();
  const [vendors, items, answers] = await Promise.all([
    sb.from("vendors").select("*").order("sort"),
    sb.from("checklist_items").select("*").order("sort"),
    sb.from("checklist_answers").select("*"),
  ]);
  if (vendors.error || items.error || answers.error) return { vendors: [], items: [], answers: [] };
  return {
    vendors: ((vendors.data ?? []) as Vendor[]).sort((a, b) => a.sort - b.sort),
    items: ((items.data ?? []) as ChecklistItem[]).sort((a, b) => a.sort - b.sort),
    answers: (answers.data ?? []) as ChecklistAnswer[],
  };
}
