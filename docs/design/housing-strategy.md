# Housing Strategy / Decision View 설계

Homefit을 "아파트 적합도 랭킹"에서 **"우리 가족이 어떤 주거 *전략*을 선택할지
비교하는 서비스"**로 확장한다. `product-vision.md`의 가장 큰 gap(Housing Strategy /
Decision View)을 구체화한다. **이 문서는 설계 — 확정 전 본 구현 금지.**

관련: `product-vision.md`(상위), `domain-model-v2.md`(Home/Area·HomeFit/AreaFit·
직교), `presale-rights.md`(acquisition path·Transfer·Decision View 요소).

---

## 1. 문제 정의

지금 Homefit은 `Home`/`Area`에 점수를 매겨 나열한다. 하지만 사용자의 진짜 질문은
"A vs B 어느 집?"이 아니라:

> "지금 A를 **매수**할까 / B에 **전세**로 살며 **청약**을 기다릴까 / 거래 가능한
> **분양권**을 매수할까 / 개발예정지 **공급을 대기**할까?"

즉 비교 단위가 *주택(Listing)*이 아니라 **행동+시간의 경로(Strategy)**다. 지금은 이
개념 자체가 도메인에 없다.

---

## 2. HousingStrategy / HousingPath 개념

**Strategy = 사용자가 선택할 수 있는, 시간에 걸친 주거 행동 경로.**
- 단일 스텝일 수도(지금 매수), 다중 스텝일 수도(전세 → 청약 → 입주) 있다.
- 각 스텝은 실제 `Listing`(또는 미정 대기)을 참조하고, 취득 방법·시점을 가진다.
- 전략의 "정착 대상(targetRef)" = 최종적으로 살게 되는 집 → HomeFit 계산 기준.

```text
Strategy B "평촌 전세 → 하남교산 청약"
 step1 rent   평촌 B (전세, now)
 step2 apply  하남교산 C블록 (청약, ~2027 공고)
 step3 move_in 당첨 시 (~2029 입주)
 target = 하남교산 C블록
```

---

## 3. Listing · acquisition path와의 관계

- **Strategy는 Listing의 subtype이 아니다.** Listing(existing/presale/area)은
  현실의 주택/지역이고, Strategy는 그 위에서의 **선택·행동**이다. 둘은 다른 축.
- Strategy의 각 스텝이 `CandidateRef({kind,id})`로 Listing을 참조하고,
  `AcquisitionPath`(subscription/resale/existing_trade)로 취득 방법을 명시한다.
- **`kind`(물리적 유형)와 `acquisitionPath`(취득 방법)를 다시 섞지 않는다**
  (presale-rights §3). Strategy는 이 둘을 *조합*할 뿐 새 kind를 만들지 않는다.

```
Listing (무엇)      : existing | presale | area
AcquisitionPath (어떻게): subscription | resale | existing_trade
Strategy (언제·어떤 순서로): 위 둘을 시간축으로 엮은 경로
```

---

## 4. 최소 도메인 모델 (제안)

```ts
// 전략 종류 — 사용자가 선택 가능한 주거 경로의 상위 분류
type StrategyKind =
  | "buy_existing"       // 기존주택 즉시 매수
  | "rent_jeonse"        // 전세 거주(정착)
  | "rent_then_apply"    // 전세 거주 → 청약 대기
  | "apply_presale"      // 청약 도전
  | "buy_presale_right"  // 분양권 매수
  | "wait_for_area";     // 개발예정지 공급 대기

type StrategyStepKind = "buy" | "rent" | "apply" | "wait" | "move_in";

interface StrategyStep {
  kind: StrategyStepKind;
  ref?: CandidateRef;             // {kind,id} — 미정 대기면 없음
  acquisitionPath?: AcquisitionPath;
  timing: TimingHint;             // §5
  note?: string;                  // "당첨 시" 등 조건
}

interface HousingStrategy {
  id: string;
  kind: StrategyKind;
  label: string;                  // "평촌 전세 → 하남교산 청약"
  steps: StrategyStep[];          // 시간순
  targetRef?: CandidateRef;       // 최종 정착 대상(HomeFit 기준). area 대기면 area
}
```

- **Decision facets는 저장하지 않고 파생**한다(`computeStrategyDecision(strategy,
  ctx)`) — 스코어링·자격·현금흐름 엔진 재사용, Strategy는 *집계 계층*.
- Strategy 자체는 점수를 갖지 않는다(§8).

---

## 5. 시간축 (Time Horizon) 모델

Strategy의 핵심 차별점. **최소 모델**은 예측이 아니라 "언제쯤"의 구간화:

```ts
type Horizon = "now" | "short" | "mid" | "long"; // 즉시 / 1~2년 / 2~4년 / 4년+
interface TimingHint {
  horizon: Horizon;
  targetYear?: number;   // 알려진 경우(입주예정·전매해제·공고)
  note?: string;         // "당첨 시", "전매제한 2028.03 해제" 등
}
```

- 전략 수준 요약: `settleBy`(정착 시점) = 마지막 move_in 스텝의 timing.
- 데이터 출처: presale lifecycle(입주예정·공고일), transfer(전매해제일), area
  targetMoveInYear에서 파생. 없으면 horizon만.

**MVP 제외(향후 확장)**: 금리·시세 변동 시뮬레이션, 미래가치 예측, 월별 현금흐름
프로젝션. MVP는 "지금 vs 몇 년 뒤"의 **구간 비교**까지만.

---

## 6. Strategy Generation (rule-based)

사용자가 전략을 직접 만들지 않아도, **조건+Listing에서 가능한 전략 후보를 규칙으로
생성**한다(설명 가능한 deterministic rule 우선, 최적화 엔진 아님).

```ts
generateStrategies(conditions, profile, listings): HousingStrategy[]
```

규칙 예(초기):
- **buy_existing**: 예산 내 existing home마다. (항상 후보)
- **rent_jeonse**: 전세 가능 existing마다. (항상 후보)
- **rent_then_apply**: 무주택 + 청약통장 보유 → 전세 스텝 + 청약 대상 presale
  (subscription phase) 조합.
- **apply_presale**: subscription phase presale마다(자격은 facet에서 판정).
- **buy_presale_right**: transferable + `transfer.status==="tradable"` presale +
  가용현금이 필요현금 이상일 때.
- **wait_for_area**: 관심 area마다.

- 생성은 **후보를 넓히는 것**이고, 실행가능성(Affordability·자격)은 **Decision에서
  설명**한다(생성 단계에서 성급히 제외하지 않음 — unknown≠fail).
- 사용자는 생성된 전략을 **선택/수정/제거**할 수 있다(완전 수동 생성은 향후).

---

## 7. Decision View 모델 (직교 유지)

전략마다 `87점/84점`으로 일렬 랭크하지 않는다. 서로 다른 판단 요소를 **직교로
유지**하고, 상태 + 설명으로 제시한다.

```ts
interface StrategyDecision {
  strategyId: string;
  status: DecisionStatus;          // §8
  fit?: FitResult | AreaFitResult; // 정착 대상 적합도(재사용)
  affordability: {                 // 감당가능성(점수 아님)
    cashNeededNow?: Money;         // 지금 필요한 현금
    futureBurden?: Money;          // 향후 추가 부담(중도금·잔금 등)
    verdict: "ok" | "short" | "unknown";
  };
  timing: { settleBy?: number; horizon: Horizon };
  eligibility?: EligibilitySummary;// 청약/전매 자격(해당 시)
  transfer?: TransferInfo;         // 분양권일 때
  risk: { flags: string[]; unknowns: string[] };
  pros: string[]; cons: string[];  // 최대 장점/단점(설명)
  nextActions: string[];           // 다음 확인 항목
}
```

Decision View는 각 전략에 대해 최소 다음에 답한다(요소→UI 매핑):
| 질문 | 근거 요소 |
|------|-----------|
| 지금 실행 가능한가? | affordability.verdict, transfer, eligibility |
| 지금 얼마 필요한가? | affordability.cashNeededNow |
| 향후 자금 부담은? | affordability.futureBurden |
| 언제 정착? | timing.settleBy/horizon |
| 두 사람 통근은? | fit.axisScores.commute + 요약 |
| 주거조건 적합도는? | fit(HomeFit/AreaFit) |
| 자격/제한은? | eligibility, transfer |
| 최대 장점/단점은? | pros/cons |
| 아직 모르는 것은? | risk.unknowns |
| 다음 할 일은? | nextActions |

**절대 원칙(vision §5 재확인)**: 요소를 하나의 opaque score로 합치지 않는다.
HomeFit≠AreaFit 직접비교 금지. 자격·전매를 적합도에 안 섞음. unknown≠fail. AI는
설명만.

---

## 8. 전략 비교 원칙 + Decision Status

성격이 다른 전략을 **공정·설명가능하게** 비교한다. 승자를 HomeFit 하나로 정하지
않고, **decision status + 트레이드오프 설명**으로.

```ts
type DecisionStatus = "recommended" | "consider" | "blocked" | "needsReview";
```
결정적 규칙(보수적):
- **blocked**: 지금 실행 불가가 확정 — affordability.verdict==="short"(현금 부족)
  OR dealbreaker fail OR 필수 자격 fail(전매 restricted 등).
- **needsReview**: 핵심 미확인 — 자격 판정 전(unknown), 전매 unknown, 데이터 미확인.
- **recommended**: fit 상위 + affordable(ok) + 자격 pass + risk 낮음.
- **consider**: 실행 가능하나 트레이드오프 있음(중간 fit·현금 빠듯·시점 김 등).
- 불명확하면 위험 쪽(needsReview/consider). status도 **설명 가능한 rule**.

비교 출력 예(설명형):
> A(지금 구축 매수) — **지금 정착 가능, 자격 불확실성 낮음.**
> B(전세→청약) — **현금 보존 유리하나 당첨·입주 시점 불확실(needsReview).**
> C(분양권) — **주택 적합도 최고이나 지금 필요현금 부족(blocked).**

---

## 9. 기존 HomeFit / AreaFit과의 관계

- **재사용**: Strategy의 `fit`은 targetRef에 대해 기존 `computeHomeFit`(existing/
  presale) 또는 `computeAreaFit`(area)을 **그대로** 호출. 새 스코어 안 만듦.
- **집계 계층 추가만**: `computeStrategyDecision`이 fit + 자격(evaluatePrograms/
  evaluateNewlywedSpecial) + 현금흐름(computeCashFlow) + transfer(deriveTransactionRisk)
  + timing을 **조합**해 Decision을 만든다. 모두 기존 순수 함수 재사용.
- HomeFit/AreaFit·자격·전매 코드는 **불변**.

---

## 10. 기존 UX 변경안

현재: `온보딩 → 홈 추천 랭킹 → 상세 → 후보 → 비교`.
진화(vision §10 순서 반영):

```
조건(온보딩)
 → 우리에게 가능한 주거 전략   (신규: 전략 카드 + status)
 → 전략별 이유/제약           (신규: Decision View)
 → 전략 안의 실제 후보         (재사용: RecommendationCard)
 → 후보 상세                  (재사용: 기존 상세 + 상태/자격 패널)
 → 전략/후보 비교             (재사용·확장: 기존 compare)
```

- **홈**: "추천 주택 랭킹" → "우리에게 가능한 전략"이 1급. 기존 추천 랭킹은
  **각 전략 안의 후보 목록**으로 재배치(버리지 않음).
- **후보/비교**: 그대로 재사용하되, 전략 맥락에서 진입.
- 신규 화면: `/strategy`(전략 목록·Decision View), `/strategy/[id]`(전략 상세).

---

## 11. Decision Map과의 interface (지도는 다음 단계)

지도는 종합 탐색 지도가 아니라 **Decision Map**이다. 이 문서는 지도에 넘길
**데이터 계약**만 정의(구현은 다음 단계):

```ts
interface DecisionMapInput {
  workplaces: { id; label; lat; lng }[];      // 두 사람 직장
  currentLocation?: { lat; lng };             // 현재 거주(있으면)
  items: {                                    // 전략에 포함된 것만
    ref: CandidateRef; kind: ListingKind;
    lat; lng; label;
    role: "target" | "step" | "candidate";    // 전략 내 역할
    acquisitionPath?: AcquisitionPath;
  }[];
  commuteLinks?: { from: workplaceId; to: ref; minutes }[]; // 통근 관계
}
```
- 지도는 **전략에 포함된 Home/Area + 직장 + 통근 관계**만 그린다(수도권 전체 매물
  마커 ❌ — vision §6).
- 좌표는 이 설계 이후 지오코딩으로 확보(별도).

---

## 12. MVP 범위 / 이후 범위

**MVP (이 확장에서 구현 목표)**
- StrategyKind 4종: `buy_existing`, `rent_then_apply`, `apply_presale`,
  `buy_presale_right`. (rent_jeonse·wait_for_area는 후속)
- rule-based `generateStrategies` (자동 생성) + 사용자 선택.
- `computeStrategyDecision`(기존 엔진 재사용) + `deriveDecisionStatus`.
- Decision View 화면(전략 카드 + 요소별 설명 + status).
- 소량 sample 데이터로 검증(§13-데이터: existing ~10, presale 2~3, area 2).

**이후**
- Affordability 금융 시뮬(중도금 스케줄·대출 한도·월부담), 시점별 현금흐름.
- 완전 수동 전략 빌더, 최적화/스코어링 랭킹(신중히).
- Decision Map 구현, 실데이터 대량 연동.

---

## 13. 데이터 전략

- **대량 수도권 수집은 보류.** 기존 mock + 소량 대표 sample로 Strategy/Decision UX를
  먼저 검증.
- 필요 최소 샘플: ExistingHome ~10(기존 mock 충분), Presale 2~3(기존 mock/청약홈
  샘플), Area 2(기존 mock). 이 조합으로 시나리오 A/B/C 전략이 생성되는지 확인.
- 실데이터·좌표·대량 적재는 **Strategy가 유효하다는 판단 이후** 확장.

---

## 14. 테스트 전략

- **순수 함수 단위테스트**(결정성): `generateStrategies`(조건별 후보 생성),
  `computeStrategyDecision`(요소 집계), `deriveDecisionStatus`(경계: blocked/
  needsReview/recommended/consider), timing 파생.
- 시나리오 픽스처: 시나리오 A/B/C 가구 프로필 → 기대 전략·status 검증.
- unknown≠fail·자격 미판정→needsReview·현금부족→blocked 등 원칙을 테스트로 고정.
- UI 렌더 테스트(전략 카드·Decision View 요소 노출).
- 기존 computeHomeFit/AreaFit·자격·현금흐름 테스트 **불변**.

---

## 15. 제품 가설 검증 방법

| 가설 | 프로토타입에서 확인 |
|------|--------------------|
| ① cross-strategy 비교가 가치 | 데모 가구로 3전략(매수/전세+청약/분양권) Decision View 노출 → 사용자가 전략 카드·비교에 체류/선택하는지 |
| ② 근거 있는 Decision View > 랭킹 | 같은 후보를 (a)점수 랭킹 (b)Decision View(이유·제약)로 제시 비교 → 어느 쪽이 "결정에 도움" 응답이 높은지 |
| ③ 개인화가 의미 | 동일 Listing 세트에 가구 조건만 바꿔(현금·직장·자녀·무주택여부) → 생성 전략·status가 달라지고 사용자가 유용하다 느끼는지 |

프로토타입은 소량 sample + rule-based 생성으로 충분(실데이터 불요).

---

## 16. 미결정 사항 【사용자 확정 요망】

1. **Affordability 상세도(MVP)**: "지금 필요현금 + 대략 향후부담"까지만 vs 대출
   한도·월부담까지. (제안: 전자 — 시뮬은 후속)
2. **전략 생성 방식**: 자동생성 + 사용자 수정 vs 자동만 vs 수동만. (제안: 자동생성
   + 선택/제거)
3. **MVP StrategyKind 범위**: 4종(위) vs 3종(buy_existing·rent_then_apply·
   buy_presale_right)으로 더 좁게. (제안: 3종부터, 시나리오 A/B/C 커버)
4. **Decision status 노출 방식**: recommended/consider/blocked/needsReview 배지 vs
   설명 문장만. (제안: 배지 + 설명 병행)
5. **홈 재구성 강도**: 홈을 "전략 우선"으로 바꿀지, 별도 `/strategy` 탭 추가로
   점진 도입할지. (제안: 별도 탭 먼저 → 검증 후 홈 격상)
6. **targetRef 없는 전략**(막연한 area 대기): Decision View를 어디까지 채울지.
