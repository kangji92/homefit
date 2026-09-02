# Phase 2-C — HouseholdProfile · 자격 엔진(청약·대출)

집/지역의 **적합도 점수(HomeFit/AreaFit)** 와 별개로, **사용자(가구)의 자격·
감당가능성**을 다룬다. 이 둘은 **직교**한다 — 점수에 섞지 않고 의사결정 단계에서
결합해 보여준다(`domain-model-v2.md` §5).

```
적합도(HomeFit/AreaFit)   ── 결정적, 정책 무관
        ×
자격(eligibility)         ── 정책 버전드(기준일·출처)
        ↓
    의사결정 뷰(점수 + 자격 배지)
```

## 1. 원칙

- **스코어링 함수에 정책을 절대 넣지 않는다.** `computeHomeFit`/`computeAreaFit`
  불변. 자격은 별도 순수 엔진.
- **정책은 버전드 데이터로 주입**: `{ version, asOf, ...thresholds }`. 함수는
  결정적(기준일 주입, `Date.now()` 금지).
- MVP는 **mock 정책**(실제 수치 근사, "테스트 데이터·기준일" 고지). 실데이터는
  청약홈·정책자료 adapter로 후속 교체.
- Homefit 타깃이 신혼부부이므로 **신혼부부 특별공급**을 1차 대상으로.

## 2. HouseholdProfile (도메인)

```ts
type HousingStatus = "none" | "own";      // 무주택 | 유주택
interface HouseholdProfile {
  marriedMonths: number;         // 혼인 기간(개월). 예비신혼=0
  isProspectiveCouple: boolean;  // 예비 신혼부부
  housingStatus: HousingStatus;  // 무주택 여부
  minorChildren: number;         // 미성년 자녀 수(태아 포함 입력)
  monthlyIncomeManwon: number;   // 부부합산 월평균 소득(만원)
  totalAssetManwon: number;      // 부동산+자동차 등 자산(만원)
  subscriptionMonths: number;    // 청약통장 가입기간(개월)
  regionResidingMonths: number;  // 해당지역 거주기간(개월)
}
```
- zustand `useHouseholdStore`(persist v1). 우리 조건(선호)과 **분리**(가구 재무·자격).

## 3. 자격 엔진 (순수·버전드)

### 3.1 청약 — 신혼부부 특별공급 (2C-1)
```ts
type Requirement = { key: string; label: string; status: "pass"|"fail"|"unknown" };
interface Eligibility {
  program: string;               // "신혼부부 특별공급"
  eligible: boolean;             // 모든 필수 pass
  requirements: Requirement[];
  asOf: string; policyVersion: string;
}
evaluateNewlywedSpecial(profile, policy): Eligibility
```
규칙(mock 정책, 근사):
- 혼인 7년 이내(예비 포함) · 무주택 · 청약통장 가입 6개월+ · 소득요건(도시근로자
  월평균소득 대비 %) · 자산요건(부동산·자동차 상한). 값 미입력이면 `unknown`.
- `SUBSCRIPTION_POLICY = { version, asOf, marriageMaxMonths:84, minSubscriptionMonths:6,
  incomeLimitManwon, assetLimitManwon }` 주입.

### 3.2 정부지원 대출 (2C-2, 후속)
```ts
interface LoanProgram { key; name; eligible; maxLoanManwon?; reasons: Requirement[] }
evaluateLoans(profile, priceManwon, policy): LoanProgram[]
```
- 디딤돌(부부합산 소득·주택가격 상한·LTV), 신생아 특례(자녀·소득 완화) 등 mock.
- 대상 주택가격은 집(existing/presale)의 활성 가격.

## 4. UI

- **프로필 입력**: `/profile`(신규) 또는 우리 조건과 별도 섹션. 가구 재무·자격 항목.
- **자격 표시(직교)**: 분양 상세(`/complex/[id]` presale)에 **"청약 자격" 패널** —
  적합도 점수와 **분리된 카드**. eligible 배지 + 요건별 pass/fail/unknown + "기준일
  ·정책버전·mock 고지". unknown은 "프로필을 채우면 판정돼요".
- (2C-2) **대출 패널**: 집 상세에 감당가능성/대출 프로그램.
- **점수와 결합**: 나란히 표기하되 **하나의 숫자로 합치지 않는다**.

## 4.5 확장 — 프로그램 카탈로그 + 시나리오 what-if

단일 "신혼부부 판정"을 넘어, **여러 청약·대출 프로그램을 카탈로그로 두고** 각각을
프로필에 대해 평가한다. 나아가 **상태를 바꾸면 열리는 것**을 함께 보여준다.
(예: 사실혼·한쪽 유주택 커플에게 "집 팔고 혼인신고하면 신혼부부 특공+신혼 대출이
열려요".)

### 청약 프로그램 카탈로그 (mock·근사)
| 프로그램 | 핵심 요건(mock) | 유주택 가능? |
|---|---|---|
| 신혼부부 특별공급 | 법적 혼인/예비 7년내 · 무주택 · 소득·자산 | ✕ |
| 생애최초 특별공급 | 무주택(세대) · 생애 최초 · 소득·자산 · 청약통장 | ✕ |
| 다자녀 특별공급 | 미성년 자녀 2~3+ · 무주택 · 소득·자산 | ✕ |
| 일반공급(추첨제) | 청약통장 · 지역 — 일부 추첨은 유주택도 | △(추첨 일부) |
| 무순위(줍줍) | 지역 거주 등 — 유주택도 신청 가능 케이스 | ○ |

### 대출 프로그램 카탈로그 (mock·근사)
| 프로그램 | 핵심 요건(mock) |
|---|---|
| 디딤돌(일반) | 무주택 · 부부합산 소득 상한 · 주택가격/전용 상한 · LTV |
| 디딤돌(신혼) | +혼인 요건, 소득 상한 완화 |
| 신생아 특례 | 2년내 출산 자녀 · 소득 대폭 완화 · 가격 상한 |
| 보금자리론 | 소득·주택가격 상한 · LTV |

### 평가 결과(프로그램별)
```ts
type ProgramFit = "eligible" | "not_eligible";
interface ProgramResult {
  key; name; kind: "subscription" | "loan";
  fit: ProgramFit; requirements: Requirement[];
  maxLoanManwon?: number;   // 대출만
}
evaluatePrograms(profile, target?, policy): ProgramResult[]
```
- 각 프로그램 = 순수 함수(요건 pass/fail/unknown → eligible/not). 정책 주입.
- 대출은 대상 집 가격(existing/presale 활성가) 참조.

### 시나리오 what-if
프로필 변형을 적용해 **새로 열리는 프로그램**을 계산한다.
```ts
const SCENARIOS = [
  { key:"register",  label:"혼인신고하면",          apply:p=>({...p,maritalStatus:"married",marriedMonths:0}) },
  { key:"sell",      label:"유주택 배우자가 집을 팔면", apply:p=>({...p,housingStatus:"none"}) },
  { key:"sell_register", label:"집 팔고 혼인신고하면",  apply:p=>({...p,housingStatus:"none",maritalStatus:"married",marriedMonths:0}) },
];
// unlocked = 시나리오에선 eligible이지만 현재는 not인 프로그램
whatIf(profile, policy): { scenario; unlocked: ProgramResult[] }[]
```
- **현재 가능** 목록 + **"이렇게 하면 열림"** 목록으로 화면 구성.

### 정직성·한계 (필수 고지)
- 전부 **mock 근사 + 기준일·정책버전** 표기. "실제는 청약 공고·금융기관 상담으로
  확인" 문구 상시 노출.
- **세대·사실혼 판정은 단순화**(무주택은 세대 기준 자기신고). 사실혼 배우자
  주택의 세대 분리·개별 판정은 다루지 않는다(고지). 절세/편법 조장이 아니라
  "상태 변화에 따른 제도상 가능성" 정보 제공.

## 5. 서브 단계

1. **2C-1** ✅: HouseholdProfile + 신혼부부 청약 자격 + 분양 상세 패널.
2. **2C-1b**: 청약 프로그램 카탈로그(생애최초·일반/추첨·무순위) + **시나리오
   what-if**("현재 가능 / 이렇게 하면 열림"). `/profile`에 "내 청약 가능성" 뷰.
3. **2C-2**: 대출 카탈로그(디딤돌 신혼/신생아·보금자리) + 집 상세 대출 패널.
4. 실데이터(청약홈·정책자료) adapter 교체.

## 6. 테스트·완료

- 엔진 순수 단위 테스트(요건별 pass/fail/unknown, 정책 버전 주입, 결정성).
- 스토어 persist/마이그레이션. 상세 패널 렌더 테스트.
- 완료 기준(lint/typecheck/test/build) green. computeFit 등 스코어링 **불변**.
