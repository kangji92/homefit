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

### 3.2 AreaFit (area) — 【결정】
`computeAreaFit(conditions, priorities, area, config)` — 지역 적합도.

**HomeFit 7축을 억지로 1:1 매핑하지 않는다.** Home 우선순위 중 Area에서 **대응
가능한 축만** 사용하고, 측정 불가능한 축(price/commute/newness 등)은 **0점 처리하지
않고 계산에서 제외한 뒤 남은 축만 재정규화**한다. 그래야 가격·통근을 중요시하는
사용자가 "3기신도시라는 이유만으로" 이상하게 낮은 점수를 받지 않는다.

```
home priorities        → AreaFit
  price          90     → 제외
  commute        90     → 제외(실제 교통 데이터 붙기 전)
  newness        80     → 제외
  education      70     → 대응 metric 있을 때만 반영
  infrastructure 70     → plannedInfra
  environment    50     → environment
  futurePotential 80    → futurePotential
// 반영 가능한 축의 가중치만 다시 정규화(합=1)
```

- **직접 순위 비교 금지**: `HomeFit 87 vs AreaFit 91` 식으로 두 점수를 나란히
  대소 비교하지 않는다. 성격이 다른 척도다. UI는 **홈에서 섹션을 분리**해
  보여준다(기존/분양 주택 → HomeFit / 개발 예정지 → AreaFit).
- `AreaFitResult { areaId, axisScores, totalScore }`. dealbreakers는 area엔 최소만
  또는 미적용.
- **공식은 아직 확정하지 않는다.** 이번 단계는 **축 정의 + exclude-후-재정규화 +
  결정성 테스트**까지만. 각 축 점수는 우선 `areaMetrics` 값(0~100)을 그대로 쓰고,
  **가중·결합 공식 튜닝은 실제 3기신도시 데이터를 한 번 넣어본 뒤** 조정한다.

두 함수 모두 **결정적·config 주입**(`Date.now()` 금지) 원칙 유지.

### 3.3 Dealbreaker 상태 — pass/fail/unknown 【결정】
presale은 입주 전이라 세대수·역거리 등이 **미확정**일 수 있다. 미확정을 fail로
처리하면 안 된다.

```ts
type DealbreakerStatus = "pass" | "fail" | "unknown";
// 예) 최소 1,000세대 ← 공급계획 1,200세대           → PASS
//     역거리 800m 이하 ← 역사 위치 미확정            → UNKNOWN
//     최대 8억 ← 분양가 8.4억 확정                   → FAIL
```

- `evaluateDealbreakers` → `{ failed: [...], unknown: [...] }`. 대상 필드가
  `undefined`(미확정)면 **unknown**, 값이 있고 조건 위반이면 **fail**.
- `FitResult`에 `unknownDealbreakers` 추가. **unknown은 탈락 조건이 아니다**
  (`passesDealbreakers = failed.length === 0`).
- 기존 아파트는 필드가 전부 확정이라 `unknown`은 항상 `[]`(하위호환).
- UI: "⚠️ 역 접근성은 아직 확정되지 않았어요." → 이후 presale 데이터
  신뢰도/완성도 표시로 확장.

## 4. 후보 · 비교 · 라우팅 【결정】

- `Candidate`가 `complexId` → **`{ kind, id }`** 참조로 일반화. **지금 persist v3로
  마이그레이션한다**(미루지 않음). 기존 저장값은 전부 기존 아파트이므로 변환 명확:
  ```ts
  type CandidateRef =
    | { kind: "existing"; id: string }
    | { kind: "presale"; id: string }
    | { kind: "area"; id: string };
  // migrate v2→v3: { complexId } → { kind: "existing", id: complexId }
  ```
- **비교는 같은 종류끼리 기본**: 집 vs 집(HomeFit), 지역 vs 지역(AreaFit). 교차
  비교(아파트 vs 개발예정지)는 점수 성격이 달라 **별도 취급**(나란히 보기 + 경고,
  winner 판정은 종류 내에서만).
- **라우팅**: 기존 `/complex/[id]` 유지(ExistingHome/PresaleHome), Area만
  `/area/[id]` 추가. **`/listing/[kind]/[id]` 통합은 하지 않는다** — 도메인 모델과
  URL을 억지로 일치시킬 이유가 없고, URL은 사용자에게 의미가 명확한 게 낫다. 나중에
  정말 필요하면 `/complex`→`/home` 전환 가능하나 지금은 migration 비용이 더 크다.

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

## 8. 결정 완료 (구현 확정)

1. **AreaFit 가중** — HomeFit과 직접 비교 금지. 대응 가능 축만 사용, price/commute/
   newness 등은 0점이 아니라 **제외 후 재정규화**(§3.2).
2. **라우팅** — `/complex/[id]` 유지 + `/area/[id]` 추가. `/listing` 통합 안 함(§4).
3. **presale dealbreaker** — 미확정은 fail이 아닌 **unknown**, 탈락 아님(§3.3).
4. **Candidate persist v3** — 지금 마이그레이션. `complexId`→`{kind:"existing",id}`(§4).

추가 원칙: **computeAreaFit 공식은 조기 확정하지 않는다** — 축·정규화·결정성
테스트까지만, 실 데이터 투입 후 튜닝(§3.2).

### 1단계 구현 범위 (이번)
- `Complex`→`ExistingHome` 별칭, `Home`/`Area`/`Listing` 유니온 타입.
- `computeFit`→`computeHomeFit` 별칭. `evaluateDealbreakers`→`{failed,unknown}`,
  `FitResult.unknownDealbreakers`(기존은 항상 `[]`).
- `computeAreaFit` 골격(축·재정규화·결정성 테스트, 공식 튜닝 보류).
- `Candidate` persist v3 마이그레이션 + 소비 측 `complexId`→`id` 일반화.
- **기존 화면/테스트 동작 유지.**
