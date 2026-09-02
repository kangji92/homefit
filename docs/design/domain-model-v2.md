# 도메인 모델 v2 — Home / Area 확장

MVP는 "기존 아파트"만 `Complex`로 다룬다. v2는 대상을 **집(지점)**과
**지역(면)**으로 일반화해, 분양 단지와 개발 예정지(3기신도시 등)까지 담는다.
`domain-model.md`(v1)를 계승·확장한다.

## 1. 분류 (2개 스코어 도메인)

```
kind: "existing" (기존 아파트) ─┐
                                ├─→ computeHomeFit() → HomeFit Score
kind: "presale"  (분양 단지)   ─┘    (지점=집: 위치·가격·통근·평형·연식)

kind: "area"     (개발 예정지) ───→ computeAreaFit() → Area Fit Score
                                     (면=지역: 계획인프라·교통계획·공급·미래가치)
```

- **집(existing/presale)은 같은 HomeFit**: "이 *집*이 우리한테 맞나"라는 동일한
  질문·7축 로직. 차이는 데이터 출처뿐(실거래가 vs 분양가/청약일정).
- **지역(area)은 AreaFit**: 단위가 집이 아니라 지역이라 지점 계산(그 집 통근 N분)이
  불가능. "이 *지역*이 우리 우선순위에 맞나"를 계산 — 철학은 같고(결정적 가중합)
  입력이 다른 병렬 스코어.

## 2. 타입 (판별 유니온)

```ts
type ListingKind = "existing" | "presale" | "area";

interface ListingBase {
  id: string;
  kind: ListingKind;
  name: string;
  regionId: string;
}

// ── 집(지점) ──────────────────────────────
interface HomeBase extends ListingBase {
  price: ComplexPrice;        // existing: 실거래가 / presale: 분양가(대표 추정)
  sizesPyeong: number[];
  stationDistanceM: number;
  commuteMinutes: Record<string, number>;
  metrics: ComplexMetrics;    // education/infrastructure/environment/futurePotential
  schoolNearby?: boolean;
  images?: string[];
}
interface ExistingHome extends HomeBase {
  kind: "existing";
  completionYear: number;     // 연식
}
interface PresaleHome extends HomeBase {
  kind: "presale";
  moveInYear: number;         // 입주 예정연도(연식 대체)
  subscription?: {            // 청약(2B에서 채움)
    announcementDate?: string;
    scheduleNote?: string;
  };
}
type Home = ExistingHome | PresaleHome;

// ── 지역(면) ──────────────────────────────
interface Area extends ListingBase {
  kind: "area";
  areaMetrics: {              // 0~100 지역 지표
    plannedInfra: number;     // 계획 인프라
    transitPlan: number;      // 교통계획(GTX·광역철도)
    supply: number;           // 공급 규모·속도
    futurePotential: number;  // 미래가치
    environment: number;      // 환경·입지
  };
  targetMoveInYear?: number;  // 입주 시작 예정
  commuteMinutes?: Record<string, number>; // 지역 중심 기준(선택)
}

type Listing = Home | Area;
```

- v1 `Complex` ≡ `ExistingHome`. 전환기엔 `type Complex = ExistingHome` 별칭 유지.
- `kind` 판별자로 features/hooks/UI가 분기.

## 3. 스코어링

### 3.1 HomeFit (existing + presale)
`computeHomeFit(conditions, priorities, dealbreakers, home, config)` — v1 `computeFit`
을 일반화. 축은 그대로(price/commute/education/newness/infrastructure/environment/
futurePotential). kind별 차이만 분기:
- **price**: existing=실거래가 밴드, presale=분양가 밴드. 동일 `priceScore`.
- **newness**: existing=`currentYear - completionYear`, presale=입주예정이라 신축에
  가깝게(예: `moveInYear` 기준, 미래면 만점 근처). config로 규칙 주입.
- dealbreakers(maxPrice/평형/역거리/연식/세대수/학교)는 그대로 적용.
- 결과 `FitResult`(v1과 동일 shape). `computeFit`은 `computeHomeFit` 별칭 유지.

### 3.2 AreaFit (area)
`computeAreaFit(conditions, priorities, area, config)` — 지역 적합도.
- 사용 축: `commute?`(지역 중심 기준, 있으면) + `education/infrastructure/environment/
  futurePotential`을 `areaMetrics`에서 매핑 + area 고유 `plannedInfra`·`transitPlan`·
  `supply`.
- **price 축은 없음**(지역엔 개별 가격 없음) → 가중치 재정규화 시 price 제외.
- 사용자 `priorities`를 area 축으로 매핑(가격·통근 비중이 큰 사용자에겐 area가
  불리할 수 있음을 UI에 고지).
- 별도 `AreaFitResult { areaId, axisScores, totalScore }`(dealbreakers 미적용 또는
  area용 최소 dealbreaker만).

두 함수 모두 **결정적·config 주입**(`Date.now()` 금지) 원칙 유지.

## 4. 후보 · 비교 영향

- `Candidate`가 `complexId` → **`{ kind, id }`** 참조로 일반화(`listingRef`).
  `candidatesStore`·`RegionInterest`도 이에 맞춤.
- **비교는 같은 종류끼리 기본**: 집 vs 집(HomeFit), 지역 vs 지역(AreaFit). 교차
  비교(아파트 vs 개발예정지)는 점수 성격이 달라 **별도 취급**(나란히 보기 + 경고,
  winner 판정은 종류 내에서만).
- 상세 라우트: `/complex/[id]`(집) 외 `/area/[id]`(지역) 추가 검토. 또는 통합
  `/listing/[kind]/[id]`.

## 5. 2C 직교 원칙 (청약자격·대출은 점수 아님)

`HouseholdProfile`(소득·자산·무주택기간·청약통장·부양가족·소득분위 등)과
`청약 자격 엔진`·`정부지원 대출`은 **집/지역의 점수가 아니라 사용자 자격 레이어**다.

```
적합도 점수(HomeFit/AreaFit)   ── 결정적, 정책 무관
        ×
자격·감당가능성(eligibility)    ── 정책 버전드(기준일·출처)
        ↓
       의사결정 뷰(점수 + 자격 배지 결합)
```

- `eligibility(target, profile) → { eligible, reasons, programVersion, asOf }`.
- **스코어링 함수에 정책을 섞지 않는다.** 정책은 버전드 데이터로 주입, 자격은
  별도 엔진. 결합은 표시/필터 단계에서만.

## 6. 어댑터 · 데이터 출처(kind별)

원칙: 외부 응답 → adapter → repository → domain(`real-data-integration.md` 원칙 1).
- existing: 국토부 실거래가(완료). 
- presale: 청약Home(청약홈)·분양공고 → `PresaleHome`.
- area: 3기신도시·택지·개발계획 공공데이터 → `Area`.
- repository는 kind별 조회(`listingRepository.list({kind})`) 또는 타입별 분리.

## 7. 롤아웃 (가산적·무중단)

v1을 깨지 않고 확장한다.
1. 타입 도입: `Complex→ExistingHome` 별칭, `Home`/`Area` 유니온 추가.
2. `computeFit→computeHomeFit` 별칭, `computeAreaFit` 신설(+테스트).
3. `Candidate` listingRef 일반화(마이그레이션: 기존 complexId → {kind:"existing",id}).
4. presale/area 데이터·화면은 Phase 매핑대로 단계 도입.

### Phase 매핑
| Phase | 내용 | 모델 |
|-------|------|------|
| 2A(진행) | 실거래가·실단지·지도/통근 | ExistingHome + computeHomeFit |
| 2B | 3기신도시 Region·분양/청약 Project·일정 | **PresaleHome·Area 도입, computeAreaFit** |
| 2C | HouseholdProfile·청약자격·대출 | eligibility 레이어(점수와 직교) |
| 2D | 교육/생활/환경·미래가치 | 두 스코어 공통 지표 보강 |

## 8. 미결정(구현 전 확정할 것)

- AreaFit 축 가중: 사용자 `priorities`(집 기준)를 area로 어떻게 매핑할지 확정.
- 라우팅: `/complex/[id]` 유지 + `/area/[id]` vs 통합 `/listing/...`.
- presale의 dealbreaker(입주 전이라 세대수·역거리 등 확정 전 값 처리).
- `Candidate` 마이그레이션(persist v3) 방식.
