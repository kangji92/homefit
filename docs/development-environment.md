# Homefit 개발환경 스펙

이 문서는 Homefit 프로젝트의 **개발환경 표준**을 정의한다. 프로젝트 초기화와 이후 모든 작업의 기준(source of truth)이다.
설계 변경이 필요하면 코드보다 이 문서를 먼저 수정한다. ([CLAUDE.md](../CLAUDE.md) 참조)

---

## 1. 런타임 & 패키지 매니저

| 항목 | 값 |
|------|-----|
| Node.js | **22 LTS** (`.nvmrc`에 고정) |
| 패키지 매니저 | **pnpm** (`packageManager` 필드에 버전 고정) |
| 모듈 시스템 | ESM |

> `ai-fe-harness`는 npm을 썼지만, Homefit은 신규 Next 앱이므로 설치 속도·디스크 효율을 위해 pnpm을 채택한다. 팀 사정상 npm으로 바꿔도 무방하나 **하나로 통일**한다.

---

## 2. 프레임워크 & 핵심 라이브러리

초기화 시점의 **최신 안정 버전을 고정**한다(아래는 계열 기준).

| 영역 | 패키지 | 계열/비고 |
|------|--------|-----------|
| Framework | `next` | **15.x / 16.x, App Router** |
| UI 런타임 | `react`, `react-dom` | 19.x (Next 15+ 동반) |
| Language | `typescript` | 5.x (`strict`) |
| Styling | `tailwindcss` | v4 (`@tailwindcss/postcss`) |
| UI 컴포넌트 | shadcn/ui | 소스 생성형(의존성 아님), `components.json` |
| Icons | `lucide-react` | 라인 아이콘 |
| Form | `react-hook-form`, `zod`, `@hookform/resolvers` | 폼 + 스키마 검증 |
| State | `zustand` | 전역 상태 + `persist` |
| Query | `@tanstack/react-query` | 서버/비동기 데이터 캐싱 |
| Server/Data | `@supabase/supabase-js` | **MVP에서는 미사용**(§8) |
| Test(unit) | `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom` | |
| Test(e2e) | `@playwright/test` | |
| Lint/Format | `eslint`, `eslint-config-next`, `typescript-eslint`, `eslint-plugin-jsx-a11y`, `prettier`, `prettier-plugin-tailwindcss` | |

---

## 3. 디렉터리 구조

App Router 기준. **도메인 로직(`domain/`) → 데이터 레이어(`data/`) → 화면 조립(`features/`)** 3층 격리를 유지한다.

```
homefit/
├─ CLAUDE.md
├─ docs/
│  ├─ development-environment.md   # 이 문서
│  ├─ standards/                   # ai-fe-harness 표준 이식(+Homefit 규칙)
│  └─ design/                      # 기능별 설계 문서 (구현 전 작성)
├─ next.config.ts
├─ tsconfig.json · eslint.config.mjs · .prettierrc
├─ vitest.config.ts · vitest.setup.ts
├─ components.json                 # shadcn/ui
├─ .env.local (git-ignored) · .env.example
├─ public/
├─ e2e/                            # Playwright 스펙 (한 파일 = 한 플로우)
└─ src/
   ├─ app/                         # App Router
   │  ├─ layout.tsx                # 루트 (html/body, Providers)
   │  ├─ globals.css               # Tailwind + 디자인 토큰(@theme)
   │  ├─ (app)/                    # 하단 네비 있는 그룹
   │  │  ├─ layout.tsx             # AppShell + BottomNav
   │  │  ├─ page.tsx               # 홈  /
   │  │  ├─ candidates/page.tsx    # 후보  /candidates
   │  │  ├─ compare/page.tsx       # 비교  /compare
   │  │  ├─ conditions/page.tsx    # 우리 조건  /conditions
   │  │  └─ complex/[id]/page.tsx  # 단지 상세
   │  └─ onboarding/page.tsx       # 풀스크린 (네비 없음)
   │
   ├─ domain/                      # ★ 순수 도메인 (UI·프레임워크 무관, 테스트 집중)
   │  ├─ types.ts                  # 조건·우선순위·절대조건·단지·적합도·비교 모델
   │  ├─ scoring/                  # 정규화 + weighted score 엔진
   │  └─ dealbreakers.ts           # 절대조건 하드 필터
   │
   ├─ data/                        # ★ 교체 가능한 데이터 레이어
   │  ├─ mock/                     # regions.ts · complexes.ts (초기 seed)
   │  └─ repositories/             # 인터페이스 + mock 구현 (→ Supabase 구현 교체 지점)
   │
   ├─ stores/                      # zustand: conditionsStore · candidatesStore (persist)
   │
   ├─ components/
   │  ├─ ui/                       # shadcn 생성물 + 공통 UI(ScoreGauge 등)
   │  └─ layout/                   # AppShell · BottomNav
   │
   ├─ features/                    # 화면 단위 조립 (도메인 × UI). page.tsx는 이걸 조합만
   │  ├─ onboarding/ · conditions/
   │  ├─ candidates/ · complex-detail/
   │  ├─ compare/ · home/
   │
   ├─ hooks/
   ├─ lib/                         # cn(), format, queryClient, (supabaseClient 나중)
   └─ providers/                   # QueryClientProvider 등 클라이언트 프로바이더
```

- **컴포넌트 파일 규칙**: 폴더당 컴포넌트 — `<Name>/{<Name>.tsx, <Name>.test.tsx, <Name>.stories.tsx, index.ts}`.
- MVP는 로컬 mock + localStorage 기반이라 대부분 **클라이언트 컴포넌트**(`"use client"`)로 시작한다. Supabase 도입 시 서버 컴포넌트/Route Handler로 데이터 접근을 옮긴다.

---

## 4. TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true` 권장.
- 경로 별칭 **`@/*` → `src/*`** (`tsconfig.json`의 `paths` + Next 기본 지원).
- `target` ES2022, `moduleResolution: Bundler`, `jsx: preserve`(Next 관리).

---

## 5. Lint / Format

- **ESLint (flat config)**: `eslint-config-next` + `typescript-eslint` recommended + `eslint-plugin-jsx-a11y`(접근성 강제).
- **Prettier** + `prettier-plugin-tailwindcss`(클래스 정렬 자동).
- `any` 금지(`ai-fe-harness` 표준). 위반은 CI에서 차단.

---

## 6. 스타일 & 디자인 토큰

- **Tailwind v4**: 설정은 `globals.css`의 `@theme`로 관리(CSS-first).
- **shadcn/ui**: `components.json`으로 초기화, 생성물은 `src/components/ui/`에 위치. 필요할 때만 개별 컴포넌트 추가(과설치 금지).
- **디자인 방향**(별도 디자인 문서에서 확장):
  - 넉넉한 여백, 카드 기반 UI, 핵심 정보 우선 + progressive disclosure.
  - 뉴트럴 베이스 + 절제된 단일 강조색. 적합도 점수에만 색을 강하게 쓴다.
  - 신혼부부 서비스라도 핑크·과도한 귀여움·과색 지양. 소비자용 라이프스타일 톤.
- 다크모드는 토큰 기반으로 확장 가능하게 두되 MVP 필수 아님.

---

## 7. 상태 & 데이터 흐름

- **Zustand + `persist`(localStorage)**: `우리 조건`, `후보/즐겨찾기/메모` 등 전역·영속 상태.
- **TanStack Query**: repository 호출을 감싸 로딩/에러/캐싱을 일관 처리. mock repository도 Promise 인터페이스라 그대로 적용, Supabase 전환 시 무변경.
- **Repository 패턴**: `data/repositories/`에 인터페이스 정의 → `mock` 구현으로 시작 → 나중에 `supabase` 구현 추가. **features/컴포넌트는 인터페이스에만 의존**한다.
- **적합도 계산은 `domain/scoring`의 순수 함수**로. 상태/네트워크와 분리해 단위 테스트한다.

---

## 8. 환경변수 & Supabase (MVP 유예)

- `.env.example`에 키 이름만 커밋, 실제 값은 `.env.local`(git-ignored).
- Supabase 관련 변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등)는 **정의만 해두고 MVP에서는 연결하지 않는다**.
- MVP 데이터는 전부 `data/mock/`의 seed + localStorage. Supabase는 repository 구현 교체 시점에 붙인다.

---

## 9. 테스트 전략

| 종류 | 도구 | 대상 |
|------|------|------|
| 단위 | Vitest | `domain/`(적합도·필터 로직) — **최우선·고커버리지** |
| 컴포넌트 | Vitest + RTL | 렌더/상호작용, `getByRole`·`getByLabelText` 기반 |
| E2E | Playwright | 핵심 플로우(온보딩→조건→후보→비교), role·label 셀렉터 |

- 컴포넌트당 최소 1개 렌더 테스트. 커버리지 목표 80%+.
- E2E는 한 파일 = 한 사용자 플로우, 자동 대기 사용(고정 `sleep` 금지).

---

## 10. 스크립트

`package.json`:

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  }
}
```

---

## 11. CI

GitHub Actions — `pnpm install → lint → typecheck → test → build`.
(Playwright E2E는 별도 잡 또는 후속 도입.)

---

## 12. ai-fe-harness 와의 관계

- Homefit은 **완전히 독립적**으로 실행/빌드/배포된다. `../ai-fe-harness`를 런타임 import 하지 않는다.
- 이식 대상(복사 후 Homefit 맥락으로 수정): `standards/` 문서, 컴포넌트 폴더 패턴, ESLint 베이스, 테스트 철학, 커밋 컨벤션, (선택) `scaffold.mjs`.
- 이식하지 않음: `agent-generate.mjs`/`quality-fix.mjs`(AI 생성 루프 — MVP 불필요), 하네스의 예시 컴포넌트 소스.
