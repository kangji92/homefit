# Homefit 도메인 모델 설계

Homefit의 **핵심 도메인**(우리 조건 · 우선순위 · 절대조건 · 후보 · 적합도 · 비교)과 그 계산 규칙을 정의한다.
이 문서는 `src/domain/`, `src/data/`, `src/stores/` 구현의 source of truth다.

**원칙**
- 도메인 로직은 **UI·프레임워크·네트워크와 무관한 순수 코드**다.
- **적합도 점수는 결정적(deterministic) 계산**으로만 만든다. AI가 점수를 생성하지 않는다.
- 단지의 원시 속성(가격·세대수·연식…)과, 그로부터 계산된 0~100 점수를 **명확히 구분**한다.

---

## 1. 우리 조건 (UserConditions)

사용자(커플)가 설정하는 정량 조건.

```ts
type Transport = "transit" | "car" | "either";

interface Workplace {
  id: string;          // 안정 키
  label: string;       // 표시용 (예: "강남 직장")
  lat: number;         // mock 좌표 (MVP는 거리 계산 대신 mock 값 사용)
  lng: number;
  transport: Transport;// 사람별 주 교통수단 (한 명 대중교통 / 한 명 자동차 가능)
}

type ChildPlan = "yes" | "no" | "undecided";

type MoveInTiming = "asap" | "within1y" | "within2y" | "flexible";

type DealType = "sale" | "jeonse";   // 매매 | 전세

interface UserConditions {
  dealType: DealType;                // 거래 유형 (매매/전세)
  maxSalePrice: number;              // 최대 매매 예산 (만원) — dealType==="sale"일 때 사용
  maxJeonseDeposit: number;          // 최대 전세보증금 (만원) — dealType==="jeonse"일 때 사용
  availableFunds: number;            // 보유 자금 (만원) — 매매·전세 공통
  workplaces: Workplace[];           // 통근/교통수단은 각 Workplace가 보유
  maxCommuteMinutes: number;         // 허용 가능한 출퇴근 시간 (편도, 분)
  desiredSize: { min: number; max: number }; // 희망 평형 범위
  childPlan: ChildPlan;              // 자녀 계획
  moveInTiming: MoveInTiming;        // 입주 희망 시기
}
```

**모델은 열고, 제약은 validation에서**
- `workplaces`는 배열이다. **MVP validation은 `length === 2`(커플)만 강제**한다(zod). 데이터 모델을 2명으로 고정하지 않아 외벌이·재택·1인 출근을 나중에 자연스럽게 수용한다.
- 교통수단은 **사람(Workplace)별**로 둔다. 통근 점수는 각자의 교통수단이 반영된 `Complex.commuteMinutes[workplaceId]`를 사용한다(§6.2).
- `desiredSize.min <= desiredSize.max` 검증. 평형은 단일값이 아니라 **범위**로 다룬다(예: 30평 희망 → 29~34 허용).
- **거래 유형은 매매/전세를 분리 저장**한다. 예산 필드를 하나로 합치지 않고 `maxSalePrice`·`maxJeonseDeposit`를 각각 두어, 유형을 토글해도 반대쪽 입력이 보존된다. 스코어링·검증은 `dealType`에 맞는 필드만 사용한다(활성 예산 = `maxBudgetFor(conditions)`).
- 보유 자금(`availableFunds`)은 두 유형 공통이며, **가격 점수 계산에 반영**된다(§6.2 price). 대출·이자는 모델링하지 않고 "보유 자금으로 얼마나 감당되나"(커버율)만 결정적으로 쓴다.

---

## 2. 집 선택 우선순위 (Priorities)

7개 평가 항목의 **가중치**. 슬라이더 등으로 입력받는다.

```ts
type PriorityKey =
  | "price"          // 가격
  | "commute"        // 출퇴근
  | "education"      // 교육/육아
  | "newness"        // 신축 여부
  | "infrastructure" // 생활 인프라
  | "environment"    // 주거환경
  | "futurePotential";   // 미래 잠재력 지표 (라벨은 "미래가치" 가능하나 MVP는 테스트 데이터 — 아래 주의)

type Priorities = Record<PriorityKey, number>; // 각 0~100 (또는 0~10) 입력값
```

- 저장은 원시 입력값(예: 각 0~100)으로 하고, **계산 시 합=1로 정규화**한다. → §6
- 모든 가중치가 0이면 균등 가중(각 1/7)으로 폴백.

---

## 3. 절대 포기할 수 없는 조건 (Dealbreakers)

만족 못하면 후보를 **탈락 처리(하드 필터)**. 모두 optional — 설정한 항목만 검사한다.

```ts
interface Dealbreakers {
  maxPrice?: number;             // 이 가격 초과 탈락 (만원)
  minSizePyeong?: number;        // 제공 평형 중 이 이상이 하나도 없으면 탈락
  maxStationDistanceM?: number;  // 역까지 거리 초과 탈락 (m)
  maxBuildingAgeYears?: number;  // 연식 초과 탈락 (년)
  minHouseholds?: number;        // 세대수 미만 탈락
  requireSchoolNearby?: boolean; // 학교 접근성 기준 미달 탈락
}
```

---

## 4. 지역 · 단지 (Region, Complex)

`data/mock/`의 seed 데이터. **단지는 측정 가능한 원시 속성만 보유**한다(점수가 아님).

```ts
interface Region {
  id: string;
  name: string;        // 예: "동탄2신도시"
  summary?: string;    // 한 줄 소개
}

// 단지는 하나의 가격이 아니다. 대표가 + 범위를 거래 유형(매매/전세)별로 둔다.
interface PriceBand {
  representative: number; // 대표가 (만원) — 스코어링·비교의 기준값
  min?: number;           // 단지 내 최저가 (평형/동에 따라)
  max?: number;           // 단지 내 최고가
}

// 매매·전세를 모두 담는다. 한쪽만 있는 단지도 가능(그 유형 매물이 없으면 undefined).
interface ComplexPrice {
  sale?: PriceBand;       // 매매
  jeonse?: PriceBand;     // 전세 보증금
}

interface Complex {
  id: string;
  name: string;
  regionId: string;

  // --- 정량 원시 속성 ---
  price: ComplexPrice;                    // 단지 가격 (매매·전세, 만원)
  sizesPyeong: number[];                  // 제공 평형 목록
  completionYear: number;                 // 준공연도 (연식 계산용)
  households: number;                     // 세대수
  stationDistanceM: number;               // 최인접 역까지 거리 (m)
  commuteMinutes: Record<string, number>; // workplaceId → 편도 분 (교통수단 반영된 mock 값)

  // --- 정성 지표 (0~100, 측정 가능한 품질 지표의 seed. AI 생성 아님) ---
  metrics: {
    education: number;      // 학군/육아 인프라
    infrastructure: number; // 마트·병원·편의 등 생활 인프라
    environment: number;    // 공원·소음·조망 등 주거환경
    futurePotential: number;    // 미래 잠재력 (MVP: 교통호재 제외한 단순 seed — 테스트 데이터)
  };

  schoolNearby?: boolean;   // Dealbreakers.requireSchoolNearby 판정용
  images?: string[];
}
```

> `metrics`는 "AI가 매긴 점수"가 아니라 **데이터로 주어지는 지표**다. 실제 서비스에서는 공개 데이터로 산출되며, MVP에서는 mock seed로 고정한다.
>
> **`futurePotential` 주의**: 사용자는 이 값을 "가격이 오를 가능성"으로 읽기 쉽다. 하지만 MVP에서는 mock seed일 뿐이므로, **내부 키는 `futurePotential`로 두고** UI에는 "미래가치 지표는 현재 테스트용 데이터입니다"를 명시한다.

> **로드맵 (MVP 미구현)**: 현실적으로는 `Complex → UnitType(평형별) → Transaction(실거래)` 계층으로 확장된다. MVP는 여기까지 가지 않되, `price`를 `ComplexPrice`(대표가+범위)로 열어두어 나중에 `UnitType.price`로 자연스럽게 내려갈 여지를 남긴다.

---

## 5. 후보 관리 (Candidate)

사용자가 담는 관심 지역/단지와 메모. **Zustand + persist(localStorage)**로 저장.

```ts
interface CandidateNotes {
  pros: string[];        // 장점
  cons: string[];        // 단점
  visitMemo?: string;    // 임장 메모
}

interface Candidate {
  complexId: string;
  favorite: boolean;
  notes: CandidateNotes;
  addedAt: string;       // ISO 문자열 (정렬용)
}

// 관심 지역은 단순 즐겨찾기
interface RegionInterest {
  regionId: string;
  addedAt: string;
}
```

---

## 6. 적합도 (FitResult) — 계산 규칙

각 단지에 대해 **0~100 적합도**를 계산한다. 순수 함수 `computeFit(conditions, priorities, dealbreakers, complex, config)`.

```ts
interface FitResult {
  complexId: string;
  passesDealbreakers: boolean;
  failedDealbreakers: (keyof Dealbreakers)[]; // 탈락 사유
  axisScores: Record<PriorityKey, number>;    // 각 항목 0~100
  totalScore: number;                         // 가중합 0~100
}

interface ScoringConfig {
  currentYear: number;        // 연식 계산 기준연도 (예: 2026). 결정성 위해 주입.
  priceFloorRatio: number;    // 가격 만점 기준 (예: 0.5 → 예산의 50% 이하면 만점)
  fundsCoverageWeight: number;// 가격 점수 중 보유 자금 커버율 반영 비중 (예: 0.3)
  commuteFullRatio: number;   // 이 비율 이하 통근은 만점 (예: 0.5 → 허용시간의 50%)
  commuteScoreAtLimit: number;// 허용시간 정확히에서의 점수 (예: 60)
  commuteHardCapRatio: number;// 이 배수에서 0점 (예: 2 → 허용시간의 2배)
}
```

### 6.1 절대조건 필터

각 설정된 Dealbreaker를 검사해 `failedDealbreakers`에 수집. 하나라도 실패하면 `passesDealbreakers=false`.
점수는 **계산은 하되**, UI에서 탈락을 명확히 표시한다(완전 숨김이 아니라 경고).

| Dealbreaker | 통과 조건 |
|---|---|
| `maxPrice` | 활성 거래유형 대표가 `priceBandFor(price, dealType).representative <= maxPrice`. 해당 유형 매물이 없으면(밴드 undefined) 판정에서 제외(탈락 아님) |
| `minSizePyeong` | `sizesPyeong.some(p => p >= minSizePyeong)` |
| `maxStationDistanceM` | `stationDistanceM <= maxStationDistanceM` |
| `maxBuildingAgeYears` | `currentYear - completionYear <= maxBuildingAgeYears` |
| `minHouseholds` | `households >= minHouseholds` |
| `requireSchoolNearby` | `schoolNearby === true` |

### 6.2 항목별 0~100 정규화 (axisScores)

각 항목을 **높을수록 좋음(0~100)**으로 정규화. 모든 함수는 `clamp(0, 100)`.

- **price** (활성 거래유형 예산 대비 저렴할수록↑ + 보유 자금 커버율 반영):
  활성 밴드 `band = priceBandFor(price, dealType)`. **밴드가 없으면 0점**(해당 유형 매물 없음).
  `p = band.representative`, `budget = maxBudgetFor(conditions)`
  - 여유도 `headroom = clamp( 100 * (budget - p) / (budget - budget * priceFloorRatio) )`
  - 커버율 `coverage = clamp( min(availableFunds / p, 1) )` (0~1)
  - `price = headroom * ( (1 - fundsCoverageWeight) + fundsCoverageWeight * coverage )`
  → 예산 초과면 `headroom=0`이라 **0점 유지**. 예산 여유가 크고 보유 자금으로 전액 감당되면 **100**. 자금 커버가 낮으면 그만큼 감산(대출·이자는 모델링하지 않음).
- **commute** (허용시간 대비 짧을수록↑, **모든 사람 중 가장 긴 통근** 기준 — 둘 다 만족해야 좋은 집):
  `worst = max( workplaces.map(w => commuteMinutes[w.id]) )`, `L = maxCommuteMinutes`
  3구간 선형 (허용시간 안이면 넉넉히 높은 점수):
  - `worst <= commuteFullRatio * L` → **100**
  - `commuteFullRatio*L < worst <= L` → 100 → `commuteScoreAtLimit`(예: 60) 선형 감소
  - `L < worst <= commuteHardCapRatio * L` → `commuteScoreAtLimit` → 0 선형 감소
  - `worst > commuteHardCapRatio * L` → **0**

  > 예) `L=45, commuteFullRatio=0.5, commuteScoreAtLimit=60`일 때 40분 → 약 69점(기존 가혹한 식은 11점).
  > 정확한 파라미터·곡선은 후속 [`scoring.md`]에서 축별로 확정한다.
- **newness** (신축일수록↑, 30년 기준 선형):
  `age = currentYear - completionYear`; `100 * (1 - age / 30)`
- **education / infrastructure / environment / futurePotential**:
  해당 `metrics.*` 값을 그대로 사용(이미 0~100 지표).

> 정규화식은 **튜닝 가능한 규칙**이다. 변경 시 이 문서를 먼저 수정한다.

### 6.3 가중합 (totalScore)

1. `Priorities`를 합=1로 정규화 → `w[k]`.
2. `totalScore = round( Σ_k  w[k] * axisScores[k] )`.

> **자녀 계획(childPlan)**은 점수를 조작하지 않는다. 대신 UI 추천/설명이나, `education` 가중치 기본값 제안에만 활용한다(선택). 결정 로직은 어디까지나 가중합.

### 6.4 랭킹/정렬 규칙 (중요)

후보 목록·추천은 반드시 아래 순서로 정렬한다. `sortByFit(results): FitResult[]`.

1. **`passesDealbreakers === true` 후보를 먼저** 배치
2. 그 안에서 `totalScore` **내림차순**
3. 그 다음 `passesDealbreakers === false`(탈락) 후보
4. 탈락 후보 내부에서도 `totalScore` 내림차순

> 이유: 탈락 후보의 점수는 계산·표시하되, **총점만으로 정렬하면 94점짜리 탈락 후보가 1위로 뜨는 사고**가 난다. 절대조건 통과 여부가 1차 정렬 키다.

> 정규화 규칙·파라미터의 상세와 튜닝은 후속 `docs/design/scoring.md`에서 축별로 확장한다.

---

## 7. VS 비교 (Comparison)

두 후보의 `FitResult`를 비교.

```ts
type Winner = "a" | "b" | "tie";

interface Comparison {
  a: FitResult;
  b: FitResult;
  perAxisWinner: Record<PriorityKey, Winner>; // 항목별 우세
  overallWinner: Winner;                       // 총점 우세
  tieThreshold: number;                        // 이 차이 이하는 tie (예: 2)
}
```

- 항목별: `axisScores[k]` 차이가 `tieThreshold` 이하면 `tie`, 아니면 큰 쪽.
- 총점: `totalScore` 차이로 동일 규칙.
- 원시 속성(가격·평형·세대수 등)도 표에 나란히 보여주되, **우세 판정은 정규화 점수 기준**.
- **AI의 역할(향후)**: 점수 생성이 아니라 이 결과를 **설명**하는 것뿐.

---

## 8. 데이터 접근 (Repository)

`features/`·컴포넌트는 구현체가 아닌 **인터페이스**에만 의존한다. MVP는 mock 구현, 이후 Supabase 구현으로 교체.

```ts
interface ComplexRepository {
  list(params?: { regionId?: string }): Promise<Complex[]>;
  getById(id: string): Promise<Complex | null>;
}

interface RegionRepository {
  list(): Promise<Region[]>;
}
```

- mock 구현은 `data/mock`의 seed를 Promise로 반환(비동기 인터페이스 유지 → TanStack Query 그대로 사용).
- Supabase 도입 시 같은 인터페이스의 다른 구현만 추가한다.

---

## 9. 상태 저장 범위

| 스토어 | 내용 | 저장 |
|---|---|---|
| `conditionsStore` | `UserConditions`, `Priorities`, `Dealbreakers`, 온보딩 완료 여부 | localStorage(persist) |
| `candidatesStore` | `Candidate[]`, `RegionInterest[]` | localStorage(persist) |
| (Query 캐시) | `Complex`/`Region` 조회 결과 | 메모리(TanStack Query) |

적합도(`FitResult`)와 비교(`Comparison`)는 **저장하지 않고 파생 계산**한다(조건·후보가 바뀌면 재계산). 필요 시 `useMemo`/selector로 캐싱.
