/**
 * seed 데이터를 Supabase 에 적재. (service_role 필요 — RLS 우회)
 * 사용:  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed
 * 먼저 supabase/schema.sql 을 SQL Editor 에 적용해 둘 것.
 */
import { createClient } from "@supabase/supabase-js";
import {
  SEED_SPACES,
  SEED_REQUIREMENTS,
  SEED_CURRENT_STATES,
  SEED_PHOTOS,
  SEED_CHECKLIST,
} from "../lib/seed";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL 와 SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  // 공간 먼저 (FK 대상). seed 의 문자열 id 대신 slug 로 매핑해 uuid 재생성.
  const spaceIdBySlug: Record<string, string> = {};
  for (const s of SEED_SPACES) {
    const { data, error } = await sb
      .from("spaces")
      .upsert({ slug: s.slug, name: s.name, sort: s.sort }, { onConflict: "slug" })
      .select("id, slug")
      .single();
    if (error) throw error;
    spaceIdBySlug[data.slug] = data.id;
  }

  const slugById: Record<string, string> = {};
  for (const s of SEED_SPACES) slugById[s.id] = s.slug;
  const mapSpace = (oldId: string) => spaceIdBySlug[slugById[oldId]];

  await sb.from("requirements").insert(
    SEED_REQUIREMENTS.map((r) => ({
      space_id: mapSpace(r.space_id),
      category: r.category,
      content: r.content,
      notes: r.notes,
      sort: r.sort,
    }))
  );
  await sb.from("current_state").insert(
    SEED_CURRENT_STATES.map((c) => ({
      space_id: mapSpace(c.space_id),
      content: c.content,
      notes: c.notes,
      sort: c.sort,
    }))
  );
  await sb.from("photos").insert(
    SEED_PHOTOS.map((p) => ({
      space_id: mapSpace(p.space_id),
      kind: p.kind,
      url: p.url,
      caption: p.caption,
      sort: p.sort,
    }))
  );
  await sb.from("checklist_items").insert(
    SEED_CHECKLIST.map((c) => ({
      title: c.title,
      checked: c.checked,
      rating: c.rating,
      note: c.note,
      sort: c.sort,
    }))
  );

  console.log("seed 적재 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
