// 브라우저에서 admin(authenticated) 세션으로 실행하는 쓰기 작업.
// Supabase 미연결(seed 모드)이면 null 클라이언트 → 호출부에서 로컬 상태만 갱신.
import { createClient, SUPABASE_ENABLED } from "./supabase/client";
import type {
  Requirement,
  CurrentState,
  Photo,
  Space,
  ChecklistItem,
} from "./types";
import { newId, nextSort } from "./util";

// 순수 유틸은 lib/util.ts 에 있고 여기서 재-export (기존 import 경로 호환).
export { newId, nextSort };
export const canPersist = SUPABASE_ENABLED;
const sb = () => createClient();

export async function insertSpace(name: string, sort: number): Promise<Space> {
  const slug = `sp-${newId().slice(0, 8)}`;
  if (!canPersist) return { id: newId(), slug, name, sort };
  const { data, error } = await sb()
    .from("spaces")
    .insert({ slug, name, sort })
    .select("*")
    .single();
  if (error) throw error;
  return data as Space;
}

export async function updateSpace(
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  if (!canPersist) return;
  const { error } = await sb().from("spaces").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteSpace(id: string): Promise<void> {
  if (!canPersist) return;
  const { error } = await sb().from("spaces").delete().eq("id", id);
  if (error) throw error;
}

export async function insertRequirement(
  row: Omit<Requirement, "id">
): Promise<Requirement> {
  if (!canPersist) return { ...row, id: newId() };
  const { data, error } = await sb()
    .from("requirements")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data as Requirement;
}

export async function insertCurrentState(
  row: Omit<CurrentState, "id">
): Promise<CurrentState> {
  if (!canPersist) return { ...row, id: newId() };
  const { data, error } = await sb()
    .from("current_state")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data as CurrentState;
}

export async function updateRow(
  table: "requirements" | "current_state",
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  if (!canPersist) return;
  const { error } = await sb().from(table).update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteRow(
  table: "requirements" | "current_state" | "photos",
  id: string
): Promise<void> {
  if (!canPersist) return;
  const { error } = await sb().from(table).delete().eq("id", id);
  if (error) throw error;
}

/**
 * 사진 업로드 → Storage(photos 버킷) + photos 테이블 insert. seed 모드는 로컬 objectURL.
 * 사진은 행(요구사항/현재상태) 단위로 귀속 — kind 에 따라 해당 FK 를 채운다.
 */
export async function uploadPhoto(
  spaceId: string,
  kind: "requirement" | "current",
  rowId: string,
  file: File,
  sort: number
): Promise<Photo> {
  const fk =
    kind === "requirement"
      ? { requirement_id: rowId, current_state_id: null }
      : { requirement_id: null, current_state_id: rowId };
  if (!canPersist) {
    return {
      id: newId(),
      space_id: spaceId,
      kind,
      ...fk,
      url: URL.createObjectURL(file),
      caption: file.name,
      sort,
    };
  }
  const client = sb();
  // 확장자만 안전 문자로 정제(경로 세그먼트 주입 방지).
  const ext =
    (file.name.split(".").pop() || "").replace(/[^a-z0-9]/gi, "").toLowerCase() ||
    "jpg";
  const path = `${spaceId}/${rowId}/${newId()}.${ext}`;
  const up = await client.storage.from("photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (up.error) throw up.error;
  const { data: pub } = client.storage.from("photos").getPublicUrl(path);
  const { data, error } = await client
    .from("photos")
    .insert({ space_id: spaceId, kind, ...fk, url: pub.publicUrl, caption: file.name, sort })
    .select("*")
    .single();
  if (error) throw error;
  return data as Photo;
}

// ─── 체크리스트 (admin 전용) ────────────────────────────────────────────────
export async function insertChecklistItem(
  row: Omit<ChecklistItem, "id">
): Promise<ChecklistItem> {
  if (!canPersist) return { ...row, id: newId() };
  const { data, error } = await sb()
    .from("checklist_items")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data as ChecklistItem;
}

export async function updateChecklistItem(
  id: string,
  patch: Partial<ChecklistItem>
): Promise<void> {
  if (!canPersist) return;
  const { error } = await sb().from("checklist_items").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteChecklistItem(id: string): Promise<void> {
  if (!canPersist) return;
  const { error } = await sb().from("checklist_items").delete().eq("id", id);
  if (error) throw error;
}
