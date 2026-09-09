# 소셜 로그인 (카카오·네이버) + 계정 동기화

MVP는 로그인 없이 localStorage로만 동작했다(우리 조건·관심·프로필). 다른 기기/
브라우저에서 초기화되는 한계를 해결하기 위해 소셜 로그인 + 계정 저장을 도입한다.

## 스택 — Auth.js v5 (next-auth@beta)
- **카카오·네이버 둘 다 기본 provider 지원**(Supabase Auth는 네이버 미지원 → Auth.js).
- **JWT 세션**(DB 불필요)으로 로그인 자체는 동작. Next 16 App Router·Vercel 호환.
- 시크릿은 **서버 전용**(`AUTH_*`), 클라이언트 노출 금지.

## 단계
| 단계 | 내용 | 필요 |
|------|------|------|
| **1차(이번)** | 카카오 로그인/로그아웃 + 사용자(닉네임) 표시. 비로그인=게스트(기존 localStorage 유지) | AUTH_KAKAO_*·AUTH_SECRET |
| 2차 | 네이버 provider 추가 | AUTH_NAVER_* |
| 3차 | **Supabase per-user 저장**(조건/후보/프로필). 로그인 시 서버 hydrate, 변경 시 upsert. 게스트→로그인 시 로컬 데이터 이관 | Supabase 프로젝트 |

## 원칙
- **게스트 우선**: 로그인 안 해도 앱은 100% 동작(현행 유지). 로그인은 "기기 간 유지"를 위한 부가.
- 로그인 상태와 스토어(zustand)는 **분리** — 3차에서 로그인 시 서버 데이터로 hydrate하는 어댑터만 추가.
- 점수·자격 등 기존 로직 불변.

## 구현 (1차)
- `auth.ts` — `NextAuth({ providers: [Kakao] })` → `{ handlers, signIn, signOut, auth }`.
  Auth.js가 `AUTH_KAKAO_ID/SECRET`를 자동 인식.
- `app/api/auth/[...nextauth]/route.ts` — `export const { GET, POST } = handlers`.
- 루트 레이아웃에 `<SessionProvider>`(next-auth/react) 래핑.
- `LoginButton` — `useSession()`·`signIn("kakao")`·`signOut()`. 프로필 화면/네비에 배치.
- Redirect URI: `/api/auth/callback/kakao` (로컬·배포 도메인 둘 다 등록).

## env
```
AUTH_KAKAO_ID / AUTH_KAKAO_SECRET   # 카카오 REST API키·client secret
AUTH_SECRET                          # 세션 암호화(npx auth secret)
AUTH_NAVER_ID / AUTH_NAVER_SECRET    # 2차
```
Vercel에도 동일 등록(서버 전용 — NEXT_PUBLIC_ 아님).

## 3차 데이터 모델 (예고)
```
user_conditions(user_id pk, conditions jsonb, priorities jsonb, dealbreakers jsonb)
user_candidates(user_id, kind, id, favorite, notes jsonb, added_at)
user_profile(user_id pk, profile jsonb)
```
RLS로 본인 데이터만. 로그인 시 store를 서버값으로 hydrate.
