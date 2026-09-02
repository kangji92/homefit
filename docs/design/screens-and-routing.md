# Homefit 화면 · 라우팅 설계

모바일 우선 화면 구조와 App Router 기반 라우팅/내비게이션을 정의한다.
`src/app/` 라우트와 `src/features/` 조립의 source of truth다. 도메인 타입은 [domain-model.md](./domain-model.md) 참조.

**설계 톤**
- 모바일 우선, 데스크톱은 중앙 정렬 컨테이너(`max-w`)로 자연스러운 반응형.
- 한 화면에 숫자·정보를 밀집시키지 않는다. **핵심 우선 + progressive disclosure**.
- 적합도 점수에만 색을 강하게 쓰고, 나머지는 뉴트럴 톤.

---

## 1. 라우트 맵

| 경로 | 화면 | 그룹 | BottomNav |
|------|------|------|-----------|
| `/onboarding` | 온보딩 (최초 조건 설정) | 풀스크린 | ✕ |
| `/` | 홈 | `(app)` | ✓ 홈 |
| `/candidates` | 후보 (관심 지역/단지) | `(app)` | ✓ 후보 |
| `/compare` | VS 비교 | `(app)` | ✓ 비교 |
| `/conditions` | 우리 조건 | `(app)` | ✓ 우리 조건 |
| `/complex/[id]` | 단지 상세 | `(app)` | ✓ (후보 탭 활성 유지) |

App Router 구조:

```
src/app/
├─ layout.tsx            # 루트: html/body, Providers(QueryClient 등), 모바일 컨테이너
├─ globals.css
├─ onboarding/page.tsx   # 그룹 밖 → 네비 없는 풀스크린
└─ (app)/
   ├─ layout.tsx         # AppShell(상단 헤더 옵션) + 하단 BottomNav
   ├─ page.tsx           # 홈
   ├─ candidates/page.tsx
   ├─ compare/page.tsx
   ├─ conditions/page.tsx
   └─ complex/[id]/page.tsx
```

- 각 `page.tsx`는 **얇게** 유지하고 실제 UI는 `features/<name>/`에서 조립한다.
- **`page.tsx`와 `layout`은 가능한 Server Component로 유지**하고, Zustand·localStorage·form·event handler·browser API가 필요한 **feature/컴포넌트 경계에서만 `"use client"`**를 붙인다.

  ```tsx
  // app/(app)/candidates/page.tsx  — Server Component
  export default function CandidatesPage() {
    return <CandidatesFeature />;
  }

  // features/candidates/CandidatesFeature.tsx
  "use client";
  // Zustand/이벤트/폼은 여기서부터
  ```

---

## 2. 하단 내비게이션 (BottomNav)

- 고정 4탭: **홈 / 후보 / 비교 / 우리 조건**.
- 화면 하단 고정, `(app)` 그룹 레이아웃에 위치. `/complex/[id]`에서도 표시하며 **후보 탭을 활성**으로 둔다.
- 각 탭: lucide 아이콘 + 라벨. 활성 탭만 강조색.
- `/onboarding`은 네비 없음(집중 흐름).

---

## 3. 내비게이션 흐름 & 가드

```
첫 방문 (온보딩 미완료)
  └─▶ /onboarding ──완료──▶ /  (홈)

이후 방문 (온보딩 완료)
  └─▶ /  ↔ 4탭 자유 이동
             후보 카드 탭 ─▶ /complex/[id]
             비교하기      ─▶ /compare?a=..&b=..
```

- **가드**: `conditionsStore.onboardingCompleted === false`면 앱 진입 시 `/onboarding`으로 유도.
  구현은 `(app)/layout.tsx`(또는 클라이언트 훅)에서 확인 후 리다이렉트.
- 온보딩은 언제든 `/conditions`에서 다시 수정 가능(온보딩 = 최초 1회 흐름, 조건 = 상시 편집).

---

## 4. 화면별 설계

### 4.1 온보딩 `/onboarding`
- **목적**: 우리 조건 + 우선순위 + 절대조건을 최초 입력.
- **형태**: 다단계(스텝) 폼. 한 스텝 = 한 주제, 진행 표시(stepper). 뒤로/다음.
  1. 예산 (최대 예산·보유 자금)
  2. 직장 (각 위치 + **사람별 교통수단**) + 허용 통근시간 — MVP는 2명 고정(validation)
  3. 희망 평형 **범위(min~max)** · 자녀 계획 · 입주 시기
  4. 우선순위 (7항목 슬라이더)
  5. 절대조건 (선택 입력)
- 완료 시 `conditionsStore`에 저장 + `onboardingCompleted=true` → `/`.
- **폼**: react-hook-form + zod 스텝별 스키마. 부분 저장 허용(중단해도 값 유지).

### 4.2 홈 `/`
- **목적**: 지금 내 조건 기준 한눈 요약 + 다음 행동 유도.
- **구성(위→아래)**:
  - 조건 요약 카드(예산·통근·평형 핵심 몇 개) → 탭하면 `/conditions`.
  - **추천 후보 카드 리스트**: 담은 후보를 **`sortByFit` 규칙(domain-model §6.4)**으로 정렬 — 절대조건 통과 후보가 항상 위, 탈락 후보는 아래로. 상위 몇 개 노출. 각 카드에 **ScoreGauge**로 적합도 강조 + 단지명·가격·핵심 1~2개, 탈락 후보는 경고 배지.
  - 후보가 없으면 빈 상태(empty state) + "후보 찾기" CTA → `/candidates`.
- 정보 과밀 금지: 카드당 핵심 3~4개 지표만.

### 4.3 후보 `/candidates`
- **목적**: 관심 지역/단지 관리 + 즐겨찾기.
- **구성**: 상단 세그먼트 탭 `관심 단지 | 관심 지역`.
  - 관심 단지: Candidate 카드 리스트(적합도·즐겨찾기 토글·가격). 탭 → `/complex/[id]`.
  - 관심 지역: RegionInterest 리스트.
  - (MVP) 전체 mock 단지 탐색/추가 진입점 포함 — 후보에 담기.
- 즐겨찾기·담기/빼기는 `candidatesStore` 갱신.

### 4.4 단지 상세 `/complex/[id]`
- **목적**: 한 단지의 적합도 + 상세 + 사용자 메모.
- **구성(progressive disclosure)**:
  - 히어로: 단지명·지역·대표 가격 + **적합도 ScoreGauge(크게)**.
  - **절대조건 통과/탈락** 배지(탈락 시 사유 표시).
  - 항목별 적합도(7축) 간단 시각화(막대) — 접었다 펼치기. **미래가치(`futurePotential`) 축에는 "현재 테스트용 데이터입니다" 고지**를 함께 표시.
  - 원시 정보(평형·세대수·연식·역거리·통근): 기본 핵심만, "자세히"로 확장.
  - **내 메모**: 장점/단점/임장 메모 편집(Candidate.notes). 미담은 단지면 "후보에 담기".
  - 하단 액션: 즐겨찾기, 비교에 추가(→ `/compare`에 선택 반영).

### 4.5 VS 비교 `/compare`
- **목적**: 후보 2개를 나란히 비교.
- **구성**:
  - 후보 A/B 선택(담은 후보 중). URL 쿼리 `?a=&b=`로 상태 공유 가능.
  - 상단: 두 **적합도 총점** 대비 + `overallWinner` 표시.
  - 항목별 비교 표: 7축 각각 두 값 + **우세 후보 하이라이트**(`perAxisWinner`).
  - 원시 속성 비교 행(가격·평형·세대수·연식·역거리·통근)도 병기.
  - 미선택/1개만 선택 시 안내 상태.
- **AI(향후)**: 결과 설명 문구 자리만 비워둔다(MVP는 계산 결과만).

### 4.6 우리 조건 `/conditions`
- **목적**: 온보딩에서 넣은 조건을 상시 편집.
- **구성**: 섹션별 폼 — 예산 / 직장·통근 / 평형·자녀·시기 / 우선순위 / 절대조건.
  - 온보딩과 **동일 스키마·컴포넌트 재사용**(스텝 대신 섹션 나열).
  - 저장 즉시 적합도 재계산에 반영(파생 계산).

---

## 5. 공통 레이아웃 규칙

- **모바일 우선 반응형 + 화면별 선택적 데스크톱 확장**: 기본 컨테이너는 모바일 1열(중앙 정렬). 단, VS 비교·후보 목록처럼 넓은 폭이 유리한 화면은 `md`+에서 넓은 폭/다열 레이아웃으로 확장한다(모든 화면을 좁게 고정하지 않음). 확장 여부는 화면별로 명시한다.
- `(app)/layout.tsx`: 콘텐츠 영역 + 하단 고정 BottomNav(safe-area 대응). 스크롤은 콘텐츠만.
- 카드/여백/타이포는 shadcn/ui + Tailwind 토큰(`docs/development-environment.md` §6) 기준.

---

## 6. 상태 ↔ 화면 매핑 요약

| 화면 | 읽는 상태 | 쓰는 상태 |
|------|-----------|-----------|
| 온보딩 | conditionsStore | conditionsStore(조건·우선순위·절대조건·완료플래그) |
| 홈 | conditionsStore, candidatesStore, 단지 조회(Query) → 적합도 파생 | — |
| 후보 | candidatesStore, 단지/지역 조회(Query) | candidatesStore(담기·즐겨찾기) |
| 단지 상세 | 단지 조회(Query), conditionsStore → 적합도 파생, candidatesStore | candidatesStore(메모·즐겨찾기·담기) |
| 비교 | candidatesStore, 단지 조회, conditionsStore → 비교 파생 | (선택 A/B는 URL 쿼리) |
| 우리 조건 | conditionsStore | conditionsStore |

적합도/비교는 **저장하지 않고 조건·후보로부터 파생 계산**한다(domain-model §9).
