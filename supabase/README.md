# Supabase 카탈로그 셋업 (Phase 2-A)

단지/지역 카탈로그를 Supabase에서 읽기 위한 1회 셋업. 값은 아직 mock 시드
그대로이며, 소비 코드는 `data/repositories` 인터페이스라 무변경이다.
설계: [`docs/design/data-phase2-supabase-catalog.md`](../docs/design/data-phase2-supabase-catalog.md)

## 1. 프로젝트 · 키

1. [supabase.com](https://supabase.com)에서 프로젝트 생성.
2. Settings → API 에서 `Project URL`, `anon public` 키 확인.
3. `.env.local`에 설정:
   ```
   NEXT_PUBLIC_DATA_SOURCE=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
   ```

## 2. 스키마 · 시드

Supabase 대시보드 **SQL Editor**에서 순서대로 실행:

1. `schema.sql` — 테이블 · 인덱스 · 읽기전용 RLS.
2. `seed.sql` — mock 데이터 주입.

## 3. 시드 재생성

mock(`src/data/mock/*`)이 진실 소스다. 변경 시 재생성:

```bash
pnpm gen:seed   # → supabase/seed.sql
```

## 롤백

`.env`에서 `NEXT_PUBLIC_DATA_SOURCE=mock`(또는 제거)이면 즉시 mock으로 복귀.
기본값이 mock이라 미설정 환경(CI·테스트)은 항상 mock으로 동작한다.
