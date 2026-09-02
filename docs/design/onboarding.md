# 온보딩 설계

Homefit의 **첫 실제 UX**. 사용자가 우리 조건·우선순위·절대조건을 입력해 적합도 계산의 입력을 만든다.
`src/features/onboarding/`, `src/stores/conditionsStore` 구현의 source of truth다.
도메인 타입은 [domain-model.md](./domain-model.md), 스코어링은 [scoring.md](./scoring.md).

**원칙**
- 부동산을 몰라도 따라올 수 있게 **한 스텝 = 한 주제**, 넉넉한 여백, 모바일 우선.
- **부분 저장**: 스텝을 넘길 때마다 store에 반영 → 중단 후 복귀해도 값 유지·재개.
- 파생값(적합도 등)은 저장하지 않는다. 온보딩은 **입력만** 수집한다.

---

## 1. 수집 데이터 → 스텝 구성

총 5스텝. 각 스텝은 자체 Zod 스키마로 검증하고, 통과해야 다음으로 넘어간다.

| 스텝 | 주제 | 필드 | 대상 |
|---|---|---|---|
| 1 | 예산 | `dealType`(매매/전세), `maxSalePrice` \| `maxJeonseDeposit`, `availableFunds` | UserConditions |
| 2 | 직장·통근 | `workplaces[2]`(지역+교통수단), `maxCommuteMinutes` | UserConditions |
| 3 | 평형·가족 | `desiredSize{min,max}`, `childPlan`, `moveInTiming` | UserConditions |
| 4 | 우선순위 | 7개 `Priorities`(0~100) | Priorities |
| 5 | 절대조건 | `Dealbreakers`(전부 선택) | Dealbreakers |

완료 시 `onboardingCompleted=true` 설정 후 `/`로 이동.

### 스텝 1 — 예산
- `dealType`: **매매/전세** 토글. 선택에 따라 예산 필드 라벨·검증 대상이 바뀐다.
- 매매 선택 → `maxSalePrice` (만원): 숫자 입력. **> 0**.
- 전세 선택 → `maxJeonseDeposit` (만원): 숫자 입력. **> 0**.
- `availableFunds` (만원): 공통. 숫자 입력. **>= 0**. 예산 초과 시 하드 에러 아님 — 가격 점수의 커버율로만 반영.
- 매매·전세 예산은 **각각 저장**한다(토글해도 반대쪽 값 보존). 검증은 활성 `dealType` 필드만 **> 0**을 요구한다.

### 스텝 2 — 직장·통근
- `workplaces`: **정확히 2개**(MVP). 각 항목:
  - 근무지역: **프리셋 WorkArea 목록에서 선택**(§2). 선택한 지역의 id가 `workplace.id`, 라벨·좌표도 프리셋에서 채운다.
  - `transport`: `transit | car | either` 중 선택 (사람별).
- `maxCommuteMinutes` (편도, 분): **10~180** 범위 슬라이더/입력.
- 안내: "두 분 중 더 오래 걸리는 통근을 기준으로 점수를 계산해요."

### 스텝 3 — 평형·가족
- `desiredSize`: `{ min, max }` 평형. **min > 0, max >= min**. 듀얼 입력 또는 range.
- `childPlan`: `yes | no | undecided` 세그먼트.
- `moveInTiming`: `asap | within1y | within2y | flexible` 세그먼트.

### 스텝 4 — 우선순위
- 7개 항목 슬라이더(0~100): 가격/출퇴근/교육·육아/신축/생활 인프라/주거환경/미래가치.
- **슬라이더는 숫자만 보여주지 않고 낮음/보통/높음 의미를 함께 표현**한다(예: 0~33 낮음 · 34~66 보통 · 67~100 높음 라벨/색). `aria-valuetext`에도 이 의미를 넣어 접근성 확보.
- **미래가치 슬라이더 옆에 "지표는 현재 테스트용 데이터" 고지**(domain-model 참조).
- 사용자가 조정하지 않아도 진행 가능. 전부 0이어도 허용(스코어링이 균등 폴백). 기본값 각 50.

### 스텝 5 — 절대조건 (선택)
- `maxPrice`, `minSizePyeong`, `maxStationDistanceM`, `maxBuildingAgeYears`, `minHouseholds`, `requireSchoolNearby`.
- 전부 비워도 완료 가능(스킵 버튼). 입력한 값만 검증(양수).
- 안내: "여기 넣은 조건을 못 지키는 단지는 '조건 미충족'으로 표시돼요."

---

## 2. 근무지역(WorkArea) 프리셋 — MVP 통근 모델

지도/실거리 API가 없으므로 직장은 **고정 프리셋 목록**에서 고른다. `data/mock/workAreas.ts`에 seed.

```ts
interface WorkArea {
  id: string;      // 예: "gangnam" — 이 값이 workplace.id가 된다
  label: string;   // "강남"
  lat: number;
  lng: number;     // mock 좌표 (표시/향후용)
}
```

- 프리셋 예: 강남, 판교, 여의도, 광화문, 잠실, 마곡, 구로·가산 (5~7개).
- **mock 단지의 `commuteMinutes`는 이 지역 id별로 미리 값을 가진다** → `commuteScore`가 `complex.commuteMinutes[workplace.id]`로 결정적 조회.
- 이 방식은 **도메인 타입을 바꾸지 않는다**(`workplace.id = areaId`). 실제 지오코딩 도입 시 이 레이어만 교체.
- 두 사람이 같은 지역을 골라도 무방(둘 다 같은 통근시간 → worst 동일).

### 레이어 분리 (교체 가능성)
- **`WorkArea`는 `data/mock` + 온보딩 UI 레이어에만 존재**한다. `domain/`·`scoring/`은 `WorkArea`를 import하지 않는다.
- 통근 점수는 오직 `complex.commuteMinutes[workplace.id]`로만 조회 → 도메인은 "id로 통근시간을 찾는다"만 안다.
- 향후 지도/장소검색 API로 **실제 좌표 기반 Workplace 입력**으로 교체할 때, 바뀌는 것은 (1) 온보딩의 직장 입력 UI, (2) `commuteMinutes`를 채우는 데이터 소스뿐. domain/scoring/store 스키마는 불변.

---

## 3. 폼 아키텍처 (RHF + Zod)

- 폼 라이브러리: **react-hook-form**, 검증: **zod** + `@hookform/resolvers/zod`.
- **스텝별 스키마**를 두고(`stepSchemas[step]`), 전체 스키마는 스텝 스키마의 합성으로 정의.
- 각 스텝 컴포넌트는 해당 슬라이스만 다루는 `useForm`(또는 단일 폼 + 스텝별 `trigger(fields)`)로 검증. MVP는 **스텝별 개별 useForm**으로 단순화.
- 컴포넌트 경계에서만 `"use client"`(feature 루트). `page.tsx`는 얇게.

```
features/onboarding/
  OnboardingFeature.tsx     // "use client" — 스텝 상태·라우팅
  steps/
    BudgetStep.tsx
    CommuteStep.tsx
    HouseholdStep.tsx
    PriorityStep.tsx
    DealbreakerStep.tsx
  schema.ts                 // zod 스텝 스키마 + 타입
  Stepper.tsx               // 진행 표시
```

---

## 4. 부분 저장 & 재개

- **다음 버튼**: 현재 스텝 검증 통과 → 해당 슬라이스를 `conditionsStore`에 patch → 다음 스텝.
- **이전 버튼**: 저장된 값을 그대로 폼 기본값으로 로드.
- 중단 후 재진입: 저장된 `onboardingStep`에서 이어서 시작.
- **보정 규칙**: 저장된 `onboardingStep`이 비정상(범위 밖)이거나, 그 앞 스텝들의 **필수값이 누락/무효**면 → 저장 step을 무시하고 **가장 앞의 미완료 스텝**으로 이동한다.
  - 판정은 스텝별 zod 스키마로: `firstIncompleteStep = 앞에서부터 스키마 검증 실패가 처음 나는 스텝`.
  - `resolveResumeStep(state) = clamp(min(savedStep, firstIncompleteStep), 0, lastStep)`.
- store가 단일 소스이므로 `/conditions`(상시 편집)와 **동일 스키마·필드 컴포넌트를 재사용**한다.

---

## 5. conditionsStore 스키마

zustand + `persist`(localStorage). **부분 저장을 위해 기본값으로 초기화**하고 완료 플래그로 게이트한다.

```ts
interface ConditionsState {
  conditions: UserConditions;   // DEFAULT_CONDITIONS로 초기화
  priorities: Priorities;       // 기본 각 50
  dealbreakers: Dealbreakers;   // 기본 {}
  onboardingStep: number;       // 재개용 (0-index)
  onboardingCompleted: boolean;
  hasHydrated: boolean;         // localStorage 복원 완료 여부

  patchConditions(patch: Partial<UserConditions>): void;
  setPriorities(p: Priorities): void;
  setDealbreakers(d: Dealbreakers): void;
  setStep(n: number): void;
  completeOnboarding(): void;   // onboardingCompleted=true
  reset(): void;                // 기본값으로 초기화(테스트/재설정)
  setHasHydrated(v: boolean): void;
}
```

기본값:
```ts
const DEFAULT_CONDITIONS: UserConditions = {
  dealType: "sale",
  maxSalePrice: 0,
  maxJeonseDeposit: 0,
  availableFunds: 0,
  workplaces: [
    { id: "", label: "", lat: 0, lng: 0, transport: "transit" },
    { id: "", label: "", lat: 0, lng: 0, transport: "transit" },
  ],
  maxCommuteMinutes: 45,
  desiredSize: { min: 25, max: 34 },
  childPlan: "undecided",
  moveInTiming: "flexible",
};
const DEFAULT_PRIORITIES: Priorities = {
  price: 50, commute: 50, education: 50, newness: 50,
  infrastructure: 50, environment: 50, futurePotential: 50,
};
```

- persist name: `homefit-conditions`, `version: 1`(마이그레이션 여지).
- **파생값(FitResult·Comparison)은 저장하지 않는다.** 화면에서 `computeFit`/selector로 계산.

### hydration 처리
- `persist`의 `onRehydrateStorage`에서 복원 완료 시 `setHasHydrated(true)`.
- `hasHydrated`가 false인 동안 온보딩 가드·조건 의존 UI는 **판정을 보류**(스켈레톤/로딩)하여 SSR-클라이언트 첫 렌더 불일치와 잘못된 리다이렉트를 방지.

---

## 6. 완료 처리 & 라우팅 가드

- **완료**: 스텝 5 통과(또는 스킵) → `completeOnboarding()` → `router.replace("/")`.
- **가드**: 앱 진입 시 `hasHydrated === true && onboardingCompleted === false`면 `/onboarding`으로 유도.
  - MVP 구현: `(app)` 그룹에 **클라이언트 가드 컴포넌트**를 두고 hydration 이후 판정(미들웨어는 localStorage 접근 불가라 사용 안 함).
  - `hasHydrated` 전에는 리다이렉트하지 않는다(플래시 방지).
- `/onboarding`은 이미 완료된 사용자가 열면 재설정 흐름으로 쓰거나 `/`로 되돌린다(MVP: 재설정 허용).

---

## 7. UI / 접근성

- 상단 **Stepper**(n/5) + 스텝 제목. 하단 고정 **이전/다음**(마지막은 "완료", 스텝5는 "건너뛰기" 제공).
- 모바일 우선 1열, 넉넉한 여백. 세그먼트/슬라이더는 shadcn/ui 프리미티브.
- 접근성: 각 입력에 `label`, 슬라이더 `aria-valuetext`, 에러는 `aria-describedby`로 연결, 키보드 이동 가능.

---

## 8. 검증 규칙 요약 (Zod)

| 필드 | 규칙 |
|---|---|
| dealType | "sale" \| "jeonse" |
| maxSalePrice / maxJeonseDeposit | number, 활성 유형만 > 0 |
| availableFunds | number, >= 0 |
| workplaces | length === 2, 각 id는 프리셋에 존재, transport enum |
| maxCommuteMinutes | int, 10~180 |
| desiredSize | min > 0, max >= min |
| childPlan / moveInTiming | enum |
| priorities[k] | 0~100 |
| dealbreakers.* | 선택. 있으면 양수(정수 성격은 반올림) |

---

## 9. 테스트 관점

- **스키마 단위 테스트**: 각 스텝 zod가 유효/무효 케이스를 올바로 가른다(예: max<min 거부, workplaces length!=2 거부).
- **store 테스트**: patch/complete/reset 동작, persist 직렬화 라운드트립, `hasHydrated` 플래그.
- **컴포넌트 테스트**: 스텝 진행 시 다음 버튼 활성/검증, 부분 저장(뒤로 갔다 와도 값 유지), 완료 시 라우팅 호출.
- 가드: 미완료 상태에서 hydration 후 `/onboarding`로 유도, 완료 상태에서는 통과.
