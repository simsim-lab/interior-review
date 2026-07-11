-- interior-review Supabase 스키마.
-- 적용: Supabase Dashboard → SQL Editor 에 붙여넣기.
-- 핵심: 요구사항/현재상태/사진은 공개 읽기(anon), 체크리스트는 로그인(admin)만.

-- ─── 공간 ────────────────────────────────────────────────────────────────
create table if not exists spaces (
  id    uuid primary key default gen_random_uuid(),
  slug  text unique not null,
  name  text not null,
  sort  int  not null default 0
);

-- ─── 요구사항 (공간별) ─────────────────────────────────────────────────────
create table if not exists requirements (
  id        uuid primary key default gen_random_uuid(),
  space_id  uuid not null references spaces(id) on delete cascade,
  category  text not null default '',
  content   text not null default '',
  notes     text,
  sort      int  not null default 0
);
create index if not exists requirements_space_idx on requirements(space_id, sort);

-- ─── 현재상태 (공간별) ─────────────────────────────────────────────────────
create table if not exists current_state (
  id        uuid primary key default gen_random_uuid(),
  space_id  uuid not null references spaces(id) on delete cascade,
  content   text not null default '',
  notes     text,
  sort      int  not null default 0
);
create index if not exists current_state_space_idx on current_state(space_id, sort);

-- ─── 사진 (공간별, requirement | current) ──────────────────────────────────
create table if not exists photos (
  id        uuid primary key default gen_random_uuid(),
  space_id  uuid not null references spaces(id) on delete cascade,
  kind      text not null check (kind in ('requirement','current')),
  url       text not null,
  caption   text,
  sort      int  not null default 0
);
create index if not exists photos_space_idx on photos(space_id, kind, sort);

-- ─── 체크리스트 (admin 전용 — 업체에게 절대 노출 금지) ──────────────────────
create table if not exists checklist_items (
  id       uuid primary key default gen_random_uuid(),
  title    text not null default '',
  checked  boolean not null default false,
  rating   int not null default 0 check (rating between 0 and 5),
  note     text,
  sort     int not null default 0
);

-- ─── RLS ───────────────────────────────────────────────────────────────────
alter table spaces          enable row level security;
alter table requirements    enable row level security;
alter table current_state   enable row level security;
alter table photos          enable row level security;
alter table checklist_items enable row level security;

-- 공개 데이터: 누구나 읽기(anon+authenticated), 쓰기는 로그인(authenticated)만.
create policy "spaces read"          on spaces        for select using (true);
create policy "spaces write"         on spaces        for all to authenticated using (true) with check (true);
create policy "requirements read"    on requirements  for select using (true);
create policy "requirements write"   on requirements  for all to authenticated using (true) with check (true);
create policy "current_state read"   on current_state for select using (true);
create policy "current_state write"  on current_state for all to authenticated using (true) with check (true);
create policy "photos read"          on photos        for select using (true);
create policy "photos write"         on photos        for all to authenticated using (true) with check (true);

-- 체크리스트: anon 정책을 만들지 않는다 → 비로그인은 select 조차 불가(원천 차단).
-- authenticated(admin) 만 모든 작업 허용.
create policy "checklist admin all"  on checklist_items for all to authenticated using (true) with check (true);

-- ─── Storage (사진 버킷) ───────────────────────────────────────────────────
-- 아래는 Dashboard → Storage 에서 'photos' 버킷을 Public 으로 만든 뒤,
-- 업로드 권한만 authenticated 로 제한하는 정책 예시.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos bucket public read"
  on storage.objects for select using (bucket_id = 'photos');
create policy "photos bucket admin write"
  on storage.objects for insert to authenticated with check (bucket_id = 'photos');
create policy "photos bucket admin update"
  on storage.objects for update to authenticated using (bucket_id = 'photos');
create policy "photos bucket admin delete"
  on storage.objects for delete to authenticated using (bucket_id = 'photos');
