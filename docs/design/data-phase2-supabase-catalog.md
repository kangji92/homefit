# Phase 2-A — Supabase 카탈로그

MVP는 단지/지역 데이터를 TS mock 배열에서 읽는다. Phase 2-A는 그 **출처를
Supabase 테이블로 교체**한다. `data/repositories/` 인터페이스 seam이 이미
있으므로 **소비 측(features·hooks·domain)은 무변경**이다.

## 1. 범위

포함:
- Supabase 프로젝트·클라이언트·환경변수 셋업.
- `regions`·`complexes` 테이블 스키마 + 읽기 전용 RLS.
- `supabaseComplexRepository`·`supabaseRegionRepository` 구현(행 → 도메인 매핑).
- 기존 mock 데이터를 Supabase에 넣는 **시드 SQL**(mock을 진실 소스로 이관).
- 데이터 소스 선택 플래그(mock ↔ supabase) — Supabase 미구성 환경에서도
  빌드·테스트가 깨지지 않게.

**제외(다음 단계):**
- 실거래가·통근시간·정성지표의 **실측 값 출처**(국토부/KB·지도·지표 API).
  값 자체는 지금 mock 시드를 그대로 Supabase에 넣는다. 스키마만 실데이터를
  받을 수 있게 열어둔다. → Phase 2-B.
- 로그인/인증, 사용자 상태(우리 조건·후보) 클라우드 동기화. → Phase 2-C.
- 쓰기(관리자 CRUD). 카탈로그는 읽기 전용.

## 2. 원칙 유지

- 소비 측은 `ComplexRepository`/`RegionRepository` 인터페이스에만 의존(무변경).
- 도메인 타입(`Complex`, `Region`)은 그대로. 매핑은 repository 안에서만.
- 결정적 스코어링·mock 원칙 위배 없음: 값은 여전히 시드된 고정 데이터.
- `../ai-fe-harness` 런타임 import 금지 유지.

## 3. 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_DATA_SOURCE=mock | supabase   # 기본 mock
```

- `.env.local`(gitignore) + `.env.example`(커밋)로 문서화.
- anon key는 공개 키. 카탈로그는 RLS로 **읽기만** 허용하므로 노출 안전.

## 4. 스키마

nested/배열 필드는 도메인 shape를 보존하기 위해 **JSONB**로 둔다(정규화는
Phase 2-B에서 필요해지면). 컬럼은 snake_case, 매핑에서 camelCase로 변환.

```sql
create table regions (
  id text primary key,
  name text not null,
  summary text
);

create table complexes (
  id text primary key,
  region_id text not null references regions(id),
  name text not null,
  price jsonb not null,              -- { sale?: PriceBand, jeonse?: PriceBand }
  sizes_pyeong int[] not null,
  completion_year int not null,
  households int not null,
  station_distance_m int not null,
  commute_minutes jsonb not null,    -- Record<workAreaId, minutes>
  metrics jsonb not null,            -- { education, infrastructure, environment, futurePotential }
  school_nearby boolean,
  images text[]
);

create index complexes_region_id_idx on complexes(region_id);
```

RLS(읽기 전용 공개):
```sql
alter table regions enable row level security;
alter table complexes enable row level security;
create policy "public read regions"   on regions   for select using (true);
create policy "public read complexes" on complexes for select using (true);
```

## 5. 클라이언트 · repository

- `src/lib/supabase.ts`: `@supabase/supabase-js`로 브라우저 클라이언트 1개
  생성(카탈로그는 공개 읽기라 서버/브라우저 구분 불필요). URL/anon key 미설정
  시 명확히 throw.
- `src/data/repositories/supabase.ts`:
  - `supabaseRegionRepository.list()` → `from("regions").select()` → `mapRegion`.
  - `supabaseComplexRepository.list(params)` → `from("complexes").select()`,
    `params.regionId`면 `.eq("region_id", …)` → `mapComplex`.
  - `getById(id)` → `.eq("id", id).maybeSingle()` → 없으면 null.
  - `mapComplex`(row → `Complex`): snake→camel, jsonb 필드를 도메인 타입으로
    캐스팅. 방어적 파싱은 최소(시드 데이터가 스키마를 보장).

## 6. 소스 선택 (플래그)

`data/repositories/index.ts`에서 `NEXT_PUBLIC_DATA_SOURCE`로 분기:
```ts
export * from "./types";
const useSupabase = process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase";
export const complexRepository = useSupabase ? supabaseComplexRepository : mockComplexRepository;
export const regionRepository  = useSupabase ? supabaseRegionRepository  : mockRegionRepository;
```
- 기본 mock → CI·로컬·테스트는 Supabase 없이 그대로 동작.
- Supabase 검증은 `NEXT_PUBLIC_DATA_SOURCE=supabase`로 로컬에서 스모크.

## 7. 시드

- `MOCK_COMPLEXES`/`MOCK_REGIONS`가 시드의 **진실 소스**.
- 이관 방법: mock 배열을 `INSERT` SQL(또는 seed 스크립트)로 변환해 Supabase에
  1회 주입. 스크립트는 `scripts/seed-supabase.ts`(선택) 또는 생성된 `.sql`.
- mock 파일은 당분간 **삭제하지 않는다**(시드 소스 + 기본 폴백 + 테스트 픽스처).

## 8. 테스트

- `mapComplex`/`mapRegion` 순수 매핑 **단위 테스트**(대표 행 → 도메인 타입).
- repository 통합 테스트는 Supabase 클라이언트를 모킹하거나 생략(네트워크
  의존). 기존 mock repository 테스트·hooks 테스트는 그대로 유지.
- 완료 기준(`lint`/`typecheck`/`test`/`build`)은 **기본 mock 소스**에서 통과.

## 9. 롤아웃 (가산적, 무중단)

1. env·클라이언트·스키마·RLS 준비.
2. supabase repository + 매핑 + 테스트 추가(기본 소스는 여전히 mock).
3. 시드 주입 후 로컬에서 `DATA_SOURCE=supabase` 스모크.
4. 배포 환경에 env 설정 시 실데이터로 전환. 문제 시 플래그로 즉시 mock 롤백.

## 10. 리스크 · 완화

- **Supabase 미구성 환경 파손** → 기본 mock + 명확한 throw로 방지.
- **anon key 오남용** → 카탈로그 읽기 전용 RLS. 쓰기 정책 없음.
- **스키마 드리프트(도메인 변경 시)** → 매핑 단위 테스트가 최소 안전망.
- **JSONB 남용** → Phase 2-B에서 실측/필터 요구가 생기면 그때 정규화.
