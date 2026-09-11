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
- **rent_then_apply**: 자격 스크리닝 non-fail(§6.1) + 예정(planned/scheduled)
  presale → 전세 스텝 + 청약 대상 presale 조합.
- **apply_presale**: 자격 스크리닝 non-fail(§6.1) + subscription_open presale마다
  (세부 자격은 Decision facet에서 판정).
- **buy_presale_right**: transferable + `transfer.status==="tradable"` presale +
  가용현금이 필요현금 이상일 때.
- **wait_for_area**: 관심 area마다.

- 생성은 **후보를 넓히는 것**이고, 실행가능성(Affordability·자격)은 **Decision에서
  설명**한다(생성 단계에서 성급히 제외하지 않음 — unknown≠fail).
- 사용자는 생성된 전략을 **제외/보관/선택하는 가벼운 수정만** 한다. **완전 수동
  Strategy Builder는 MVP 제외.**
- **강한 필터링(생성 과다 방지)** 【확정】: 전략이 노이즈가 되지 않도록 규칙으로
  좁힌다. 예 —
  - `targetRef` 없는 추상적 대기 전략은 **생성하지 않는다**(명확한 Listing/Area
    근거 필수). `wait_for_area`는 후속.
  - kind별·targetRef별 **중복 제거**, 후보 상한(예: kind당 상위 N개만).

### 6.1 청약 자격은 **자격 계층(eligibility screen)**으로 게이팅 【보정 확정】

`hasHome`(유주택 여부)를 **Strategy generator가 정책 규칙처럼 직접 해석하지 않는다.**
청약 가능 여부는 공급유형(특공/일반/무순위)·정책·공고에 따라 달라지므로, 판단을
`domain/eligibility/screen.ts`의 `screenSubscriptionEligibility(profile)` 한 곳으로
일원화한다.

| screen 결과 | 생성 | Decision status |
|---|---|---|
| `fail` (랭크드 특공·일반이 전부 hard-fail) | **제외** | (미생성) — 유지되면 `blocked` |
| `unknown` (hard-fail 없이 미입력만) | **생성** | `needs_review` |
| `pass` (특공/일반 중 하나 충족) | **생성** | 정상 |

- 무주택 요건은 **프로그램별 요건**(`housingRequirement`)에 이미 인코딩돼 있다.
  일반공급(추첨제)은 유주택도 통장만 있으면 통과하므로, **유주택이라고 청약 전략을
  일괄 제외하지 않는다**.
- **무순위(줍줍)**는 항상 열려 있어(누구나 eligible) 판별신호가 못 되므로
  스크리닝에서 **제외**한다(카탈로그로는 `evaluatePrograms`에 남음).
- **MVP 한계(TODO)**: `evaluatePrograms`는 현재 청약 프로그램만 다룬다. 공급유형
  (공공/민영)·공고별 거주요건·대출 연계는 미모델. 이 계층 범위가 넓어지면 자연히
  정교해진다. (product-vision Scope Guardrail)

### 6.2 `rent_then_apply`의 중간 전세 step 의미 【보정 확정】

- 최종 `targetRef`는 **반드시 presale listing**을 가진다(청약 정착 대상).
- 중간 `rent` step은 실제 전세 후보가 아직 없을 수 있어 **`ref`를 optional** 허용.
- `rent` step에 `ref`가 없으면 Decision View에서 **"전세 후보 미선정"을 unknown +
  "거주할 전세 후보를 추가로 탐색하세요" nextAction**으로 명시한다.
- 이는 §6의 **"targetRef 없는 추상 전략 금지"와 충돌하지 않는다** — 전략 자체는
  명확한 청약 대상(targetRef)을 가진 **구체 전략**이고, 다만 **중간 거주지만
  미선정**일 뿐이다. (전략 존재 근거 = targetRef ≠ 개별 step의 ref)

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
type DecisionStatus = "recommended" | "consider" | "blocked" | "needs_review";
```
결정적 규칙(보수적):
- **blocked**: 지금 실행 불가가 확정 — affordability.verdict==="short"(현금 부족)
  OR dealbreaker fail OR 필수 자격 fail(전매 restricted 등).
- **needs_review**: 핵심 미확인 — 자격 판정 전(unknown), 전매 unknown, 데이터 미확인.
- **recommended**: fit 상위 + affordable(ok) + 자격 pass + risk 낮음.
- **consider**: 실행 가능하나 트레이드오프 있음(중간 fit·현금 빠듯·시점 김 등).
- 불명확하면 위험 쪽(needs_review/consider). status도 **설명 가능한 rule**.

비교 출력 예(설명형):
> A(지금 구축 매수) — **지금 정착 가능, 자격 불확실성 낮음.**
> B(전세→청약) — **현금 보존 유리하나 당첨·입주 시점 불확실(needs_review).**
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
  needs_review/recommended/consider), timing 파생.
- 시나리오 픽스처: 시나리오 A/B/C 가구 프로필 → 기대 전략·status 검증.
- unknown≠fail·자격 미판정→needs_review·현금부족→blocked 등 원칙을 테스트로 고정.
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

## 16. 결정 확정 【완료】

| # | 항목 | 확정 |
|---|------|------|
| 1 | Affordability(MVP) | **지금 필요현금 + 향후 주요 부담**까지만. 대출한도·월상환·정교한 financing 시뮬은 후속. 목적은 금융계산기가 아니라 Strategy 비교 가치 검증. |
| 2 | 전략 생성 | **자동 생성**(조건+Listing 기반). 사용자는 **제외/보관/선택**의 가벼운 수정만. 완전 수동 Strategy Builder는 MVP 제외. |
| 3 | MVP StrategyKind | **4종**: `buy_existing`·`apply_presale`·`rent_then_apply`·`buy_presale_right`. `rent_jeonse`·`wait_for_area`는 후속. |
| 4 | Decision Status | **배지 + 설명**: `recommended`/`consider`/`needs_review`/`blocked`. **status는 단독 결론 금지 — 항상 deterministic reason과 함께.** |
| 5 | 홈 재구성 | 홈을 바로 갈아엎지 않고 **`/strategy` 화면 먼저 추가**. 가치 검증 후 홈 primary 승격 여부 판단. |
| 6 | targetRef 없는 대기 전략 | **MVP 제한** — 명확한 Listing/Area 근거 없는 추상적 wait 전략은 자동 생성 안 함. `wait_for_area`는 후속. |

### 추가 원칙 (확정)
- Strategy 자체의 **새로운 종합점수를 만들지 않는다.**
- HomeFit/AreaFit/Eligibility/Affordability/Transfer/Risk/Unknown을 **직교 유지.**
- Strategy generation은 **explainable rule-based**로 시작.
- generated strategy가 과다해지지 않도록 **강한 필터링 규칙**(§6).
- 청약 자격 게이팅은 **자격 계층(screen)** 경유(§6.1) — `hasHome` 직접 해석 금지.
- `rent_then_apply` 중간 전세 step은 **ref optional**, 미선정 시 unknown 표시(§6.2).

### 보정 확정 (Phase 1 이후)
| 항목 | 확정 |
|------|------|
| 청약 자격 게이팅 | generator가 `hasHome`를 직접 해석하지 않고 `screenSubscriptionEligibility`로 일원화. fail→제외, unknown→생성+needs_review, pass→정상(§6.1). |
| rent step 의미 | 최종 targetRef=presale 필수, 중간 rent step ref optional, 미선정 시 "전세 후보 미선정" unknown+nextAction(§6.2). |
| `recommendFitMin=78` | **영구 제품 기준 아님 — 현재 MVP calibration 값.** mock 정성지표 분포 기준. 실데이터 분포가 쌓이면 재보정. (`strategy/config.ts`) |

---

## 17. unknown 분리 · 비교 UX · IA (Phase 3 확정)

### 17.1 unknown을 두 성격으로 분리 【보정 확정】
`StrategyDecision.risk`를 두 배열로 나눈다:
| 종류 | 예 | status 영향 | UI |
|------|-----|------------|-----|
| `requiredReviews` | 청약 자격 미판정, 전매·권리 확인, 자금 미확정, 법적/정책 확인 | **needs_review로 강등** | "확인이 필요해요"(warning) |
| `incompleteInputs` | 전세 후보 미선정 등 아직 안 고른 중간 단계 | **강등 안 함** — `consider` 유지 | "아직 정하지 않은 항목"(중립) |

- `incompleteInputs`만 있는 전략은 **needs_review가 아니라 `consider`**. 단, `recommended`
  로는 올리지 않는다(아직 미완 선택이 있으므로). status.ts는 recommended 게이트에서
  `incompleteInputs.length===0`을 요구하고, 아니면 `consider_incomplete` 사유로 consider.
- 결과: MVP의 `rent_then_apply`(전세 후보 항상 미선정)는 자격이 pass여도 **최대 consider**.

### 17.2 전략 간 비교(Decision View) 【확정】
- **동일 축 비교 매트릭스**(`StrategyCompareTable`): 행=축(적합도·감당가능성·시점·자격·
  전매·확인필요·미결정), 열=전략 종류. **종합점수로 줄세우지 않는다.**
- 대신 **축별 극값만 강조**(적합도 최고 / 필요현금 최저 / 정착 最速). 종합 우세 배지 없음.
- 비교 열은 **kind별 최상위 1개**만 뽑아 "서로 다른 전략 종류"를 나란히 둔다.

### 17.3 1차 grouping: **strategy-first** 【확정】
- A(status-first) vs B(strategy-first)를 검토한 결과, **B 채택.**
- 카드 목록 1차 grouping = **전략 종류**(지금 매수/청약/전세→청약/분양권), status는 **카드
  배지**로. Vision상 사용자가 먼저 이해할 것은 rank가 아니라 "어떤 주거 전략인가".
- status-first는 "결정" 국면(비교/필터)에서 보조로만. 비교 매트릭스 열도 kind-first라 일관.

### 17.4 전략 → 후보 → 상세 내비게이션 【확정】
- 카드·비교열의 targetRef → 기존 상세(`/complex/[id]`, 개발예정지 `/area/[id]`)로 연결.
- 전략(추상 결정) → 실제 후보(단지) → 상세(실거래·통근·학군)로 자연 하강.

### 17.5 BottomNav / IA — Phase 3 이후 재편 제안 (미확정)
- 현재 6탭(홈·탐색·전략·후보·비교·조건)은 **`/strategy` 검증용 임시 진입점**. 최종 IA 아님.
- Strategy가 핵심 경험으로 확인되면 제안:
  1. **홈을 Strategy 중심으로 재구성**(현재 추천 목록 → 전략 Decision View 우선).
  2. **비교를 독립 탭에서 제거**하고 각 맥락의 context action(단지/전략 비교 버튼)으로 이동.
  3. **BottomNav 4탭 축소** 예: 홈(=전략) · 탐색 · 후보 · 조건.
- 지금 단계에선 **홈 미변경**. 위는 Phase 3 이후 별도 결정.

---

## 18. Decision View 심화 · 홈 IA 재편 (Phase 4 구현)

목표: 구조적 차별점(전략 비교·직교 축)을 **화면에서도** 느끼게. 점수보다 **결정
서사·전략 차이**를 전면에.

### 18.1 StrategyCard 정보 우선순위 재구성 【구현】
순서: ① 무엇(전략명) → ② 왜(한 줄 서사) → ③ 지금 실행 가능? → ④ 필요 현금 →
⑤ 정착 시점 → ⑥ 왜 고려(✓) → ⑦ 주의(제약+확인필요, △) → ⑧ 아직 정하지 않은 항목 →
⑨ 다음 행동(실제 라우트) → ⑩ **HomeFit(보조)**. HomeFit ScoreGauge(원형·색 강조)를
없애고 **하단 얇은 바 + "HomeFit NN"**으로 강등 — 결론이 아니라 근거 하나.

### 18.2 Strategy Narrative (deterministic) 【구현】
`features/strategy/narrative.ts` — kind별 기본 문구 + Decision facet에 따른 변주(결정적,
AI 미사용). 예: buy_existing는 `horizon==="now"`면 "지금 바로 정착…", 아니면 "정착 시점을
앞당겨…". rent_then_apply는 자격 pass면 "청약 자격을 살려…".

### 18.3 Trade-off Summary (의사결정용) vs 비교표(근거용) 역할 분리 【구현】
- 비교 화면 상단 `TradeoffSummary`: 각 전략의 +/−를 **사용자 언어**로. **종합 승자 없음.**
  deterministic(`tradeoffSummary()`): 강점(적합도 최고/현금 최저/最速/자격/전매), 약점
  (현금 N 더 필요/정착 늦음/자격 불확실/미결정).
- 그 아래 `StrategyCompareTable`은 **근거 확인용** 표로 역할 분리.

### 18.4 Status presentation label 【구현】
도메인 enum 유지, 표시 문구만 서술형: recommended=`조건이 잘 맞아요`,
consider=`검토해볼 만해요`, needs_review=`확인이 필요해요`, blocked=`현재 조건에선 어려워요`.

### 18.5 홈 IA 재편 (최소 구현) 【구현】
- 홈 상단에 `StrategyHomeSection`(주인공): "우리 가족에게 가능한 주거 선택"(kind별 대표
  1개, 최대 3) + "지금 가장 먼저 확인할 것" 체크리스트(실제 라우트). 
- 기존 추천 단지는 **"참고 · 조건에 맞는 단지"**(muted, 상위 3개)로 **강등**. 홈은 유지하되
  주인공을 Strategy로 교체. 대규모 삭제 없음.

### 18.6 BottomNav 4탭 확정 【구현】
홈 / 탐색 / 후보 / 우리 조건. `전략`→홈 흡수(/strategy는 홈 탭 활성), `비교`→context
action(후보 탭 활성). `/strategy`·`/compare` 라우트는 내부 유지, 네비에서만 제거.

### 18.7 Next Action = 실제 라우트만 【구현】
fake CTA 금지. 카드 CTA: 대상 단지 상세(`/complex|/area`), 청약 자격 확인(`/profile`),
전세 후보 찾기(`/explore`). 홈 체크리스트도 동일 라우트만.
