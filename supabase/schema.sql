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

-- ─── 사진 (행 단위: 요구사항 | 현재상태) ───────────────────────────────────
-- 사진은 개별 행에 귀속된다. kind 에 따라 requirement_id | current_state_id 중
-- 한쪽만 채워짐. space_id 는 스토리지 경로·공간별 조회용으로 함께 유지.
create table if not exists photos (
  id                uuid primary key default gen_random_uuid(),
  space_id          uuid not null references spaces(id) on delete cascade,
  kind              text not null check (kind in ('requirement','current')),
  requirement_id    uuid references requirements(id) on delete cascade,
  current_state_id  uuid references current_state(id) on delete cascade,
  url               text not null,
  caption           text,
  sort              int  not null default 0
);
-- 기존 DB 마이그레이션(테이블이 이미 있을 때) — 컬럼 추가는 멱등.
alter table photos add column if not exists requirement_id   uuid references requirements(id)   on delete cascade;
alter table photos add column if not exists current_state_id uuid references current_state(id)  on delete cascade;
create index if not exists photos_space_idx on photos(space_id, kind, sort);
create index if not exists photos_requirement_idx   on photos(requirement_id);
create index if not exists photos_current_state_idx on photos(current_state_id);

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

-- 관리자 판정: JWT 이메일이 allowlist 에 있을 때만 true.
-- ⚠️ 아래 배열을 앱의 ADMIN_EMAILS env 와 동일하게 유지할 것.
--    그리고 Supabase Dashboard → Authentication 에서 셀프 이메일 가입을 비활성(초대만) 권장.
create or replace function public.is_admin()
  returns boolean
  language sql stable
  security definer
  set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = any (array[
    'simsim.hugh@gmail.com'
  ]);
$$;

-- 공개 데이터: 누구나 읽기(anon+authenticated). 쓰기는 **관리자(is_admin) 만**.
drop policy if exists "spaces read"          on spaces;
drop policy if exists "spaces write"         on spaces;
drop policy if exists "requirements read"    on requirements;
drop policy if exists "requirements write"   on requirements;
drop policy if exists "current_state read"   on current_state;
drop policy if exists "current_state write"  on current_state;
drop policy if exists "photos read"          on photos;
drop policy if exists "photos write"         on photos;
create policy "spaces read"          on spaces        for select using (true);
create policy "spaces write"         on spaces        for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "requirements read"    on requirements  for select using (true);
create policy "requirements write"   on requirements  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "current_state read"   on current_state for select using (true);
create policy "current_state write"  on current_state for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "photos read"          on photos        for select using (true);
create policy "photos write"         on photos        for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 체크리스트: anon 정책 없음 → 비로그인은 select 조차 불가. 로그인해도 **관리자만** 허용.
drop policy if exists "checklist admin all" on checklist_items;
create policy "checklist admin all"  on checklist_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── Storage (사진 버킷) ───────────────────────────────────────────────────
-- 'photos' 버킷은 Public 읽기, 쓰기는 관리자만.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos bucket public read"  on storage.objects;
drop policy if exists "photos bucket admin write"  on storage.objects;
drop policy if exists "photos bucket admin update" on storage.objects;
drop policy if exists "photos bucket admin delete" on storage.objects;
create policy "photos bucket public read"
  on storage.objects for select using (bucket_id = 'photos');
create policy "photos bucket admin write"
  on storage.objects for insert to authenticated with check (bucket_id = 'photos' and public.is_admin());
create policy "photos bucket admin update"
  on storage.objects for update to authenticated using (bucket_id = 'photos' and public.is_admin());
create policy "photos bucket admin delete"
  on storage.objects for delete to authenticated using (bucket_id = 'photos' and public.is_admin());
