-- Homefit 카탈로그 스키마 (Phase 2-A)
-- docs/design/data-phase2-supabase-catalog.md §4
-- Supabase SQL Editor에서 1회 실행 후 seed.sql 실행.

create table if not exists regions (
  id      text primary key,
  name    text not null,
  summary text
);

create table if not exists complexes (
  id                 text primary key,
  region_id          text not null references regions(id),
  name               text not null,
  price              jsonb not null,   -- { sale?: PriceBand, jeonse?: PriceBand }
  sizes_pyeong       int[] not null,
  completion_year    int  not null,
  households         int  not null,
  station_distance_m int  not null,
  commute_minutes    jsonb not null,   -- Record<workAreaId, minutes>
  metrics            jsonb not null,   -- { education, infrastructure, environment, futurePotential }
  school_nearby      boolean,
  images             text[]
);

create index if not exists complexes_region_id_idx on complexes(region_id);

-- 읽기 전용 공개 (anon key 노출 안전). 쓰기 정책 없음.
alter table regions   enable row level security;
alter table complexes enable row level security;

drop policy if exists "public read regions" on regions;
drop policy if exists "public read complexes" on complexes;
create policy "public read regions"   on regions   for select using (true);
create policy "public read complexes" on complexes for select using (true);
