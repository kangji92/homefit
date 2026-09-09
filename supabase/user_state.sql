-- 계정별 사용자 상태(우리 조건·관심·프로필). Supabase SQL Editor에서 1회 실행.
-- (docs/design/auth-social-login.md §3차)
--
-- 접근은 서버(service role)에서만 — Auth.js 세션 user id로 키. anon/public 접근
-- 차단(RLS enable + 정책 없음 → service role만 통과).

create table if not exists user_state (
  user_id    text primary key,        -- "provider:sub" (Auth.js 세션)
  data       jsonb not null,          -- { conditions, priorities, dealbreakers, ... }
  updated_at timestamptz not null default now()
);

alter table user_state enable row level security;
-- 정책 없음: anon/authenticated(anon key) 접근 불가. 서버 service role만 read/write.
