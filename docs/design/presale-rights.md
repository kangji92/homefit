# 분양권 거래(전매) 설계 — Acquisition Path 도입

분양권(전매)을 Homefit에 추가하기 위한 설계. **이 문서는 설계만** 다루며 구현하지
않는다. `domain-model-v2.md`를 계승하고, 충돌·수정 지점을 함께 분석한다.

용어: UI·도메인에서 "딱지" 같은 비공식어를 쓰지 않고 **분양권 / 분양권 거래 /
전매**를 사용한다. 조합원입주권(재개발·재건축)은 **이번 범위 제외**(향후 확장).

---

## 0. 서비스 원칙 — 합법적 취득경로만 (불법·편법 제외) 【필수】

> **Homefit은 제한된 거래의 우회 방법을 제공하는 서비스가 아니라, 사용자가
> 공식적으로 이용 가능한 주거 취득 경로와 그 과정의 제약·위험을 이해하도록 돕는
> 서비스다.**

**제공하지 않는다(범위에서 명확히 제외):**
- 전매제한 우회 방법
- 명의변경 우회
- 이면계약·다운계약 등 방법
- 불법·편법 거래 매물 탐색
- 제한된 권리의 거래 성사 방법 안내

**적극적으로 제공한다:**
- 현재 전매 상태 · 제한 사유 · 제한 종료(예정)일
- 공식 확인 출처 · 마지막 검증일 · 추가 확인이 필요한 항목
- 정상적으로 취득 가능한 경로

이 원칙은 §5(상태·위험)·§9(UX)·§10(데이터)의 상위 제약이다. **법률 판단을 Homefit이
임의로 확정하지 않는다** — 확정 불가한 것은 "공식 공고 및 관계기관 확인 필요"로 안내.

---

## 1. 문제 정의

사용자가 "여기 들어가는 방법"을 한자리에서 비교하고 싶다:
기존 아파트 매매/전세 · 청약 예정 · 분양 중 · **입주 전 분양권 매수** · 개발 예정지.

핵심은 **청약에 당첨되지 않아도 합법적 전매가 가능한 분양권을 사서 입주하는
선택지**를 보여주는 것. 그런데 같은 물리적 단지가 시간에 따라 취득 방법이 바뀐다:

```
청약 예정 → 청약 접수 → 청약 종료 → 전매제한 중 → 전매제한 해제(분양권 거래 가능)
        → 입주 → 기존주택 매매
```

**진짜 문제**: 현재 `kind: "presale"`이 "분양 주택이라는 물리적/lifecycle 유형"과
"청약이라는 취득 방법"을 **한 단어에 섞고** 있다. 분양권은 새로운 *주택*이 아니라
같은 주택의 **다른 취득 경로**다. 여기서 두 개념을 분리하는 것이 설계의 중심이다.

---

## 2. 도메인 모델 제안 — 검토한 대안

| 대안 | 내용 | 평가 |
|------|------|------|
| A | `PresaleHome.lifecycle`/status로만 처리 | 필요하지만 부족(취득경로·권리정보 표현 안 됨) |
| B | PresaleHome에 **거래 상태·권리 정보** 구조 추가 | ✅ 채택(핵심) |
| C | `ResaleRightHome` 별도 subtype | ❌ 같은 물리 주택을 이중 모델링 → 중복·동기화 부담 |
| D | 취득경로를 kind와 **직교한 축**으로 분리 | ✅ 채택(B와 결합) |

### 채택: **B + D — 하나의 PresaleHome, 직교하는 Acquisition Path**

같은 분양 단지(주택형)를 **하나의 `PresaleHome`**으로 두고, "어떻게 취득하나"는
**별도 축 `AcquisitionPath`**로 분리한다. 취득경로는 lifecycle·전매상태에서
**파생**되며 하드코딩하지 않는다.

```ts
// 취득 방법 — kind(물리적 유형)와 직교
type AcquisitionPath = "subscription" | "resale" | "existing_trade";
//   subscription   : 청약으로 취득 (presale, 청약 단계)
//   resale         : 분양권 전매로 취득 (presale, 전매 가능 단계)
//   existing_trade : 기존주택 매매/전세 (existing)

interface PresaleHome extends HomeBase {
  kind: "presale";              // ← 물리적/lifecycle 유형 (변경 없음)
  moveInYear: number;

  lifecycle: PresaleLifecycle;  // §4 상태머신(시점·근거)
  transfer?: TransferInfo;      // §5 전매 권리 정보(시점·근거)
  offering?: OfferingPrice;     // §6 분양가·분양권가·현금흐름
  subscription?: {              // 기존 청약 일정(2B) — 유지
    announcementDate?: string;
    scheduleNote?: string;
  };
}
```

- **새 subtype 없음.** `ResaleRightHome`을 만들지 않는다 → 같은 단지의 청약·분양권을
  이중 관리하지 않는다.
- **취득경로는 계산된 뷰**: `availableAcquisitionPaths(home, asOf): AcquisitionPath[]`
  가 lifecycle+transfer에서 파생한다. 단지 데이터에 "이건 분양권 매물"이라고 박지
  않는다.
- 탐색·필터는 이 파생 경로로 한다("분양권 거래 가능"만 보기 = path에 `resale` 포함).

---

## 3. Acquisition Path와 Home kind의 관계 【핵심 분리】

```
        kind (물리적·lifecycle 유형)      AcquisitionPath (취득 방법)
        ─────────────────────────        ──────────────────────────
existing  기존 아파트                     existing_trade
presale   분양 단지(사업)        ┌──────  subscription   (청약 단계)
                                 └──────  resale         (전매 가능 단계)
area      개발 예정지(면)                 (해당 없음 — Area는 취득 대상 아님)
```

- `kind`는 **무엇인가**(집이냐 지역이냐, 기존이냐 분양이냐)를, `AcquisitionPath`는
  **어떻게 얻나**를 답한다. 둘은 다른 질문이므로 분리한다.
- 하나의 `presale` 단지가 lifecycle에 따라 `subscription` → (전매제한 해제 후)
  `resale`로 **취득경로만 전이**한다. 물리 주택은 그대로다.
- `existing`은 항상 `existing_trade`. `area`는 취득 대상이 아니라 경로 없음.
- **HomeFit은 kind로 계산**(집이면 동일 7축). 취득경로는 **가격·현금흐름·전매자격
  레이어에만** 영향 → §7.

---

## 4. Lifecycle / State Model

시점·근거가 있는 상태머신. 각 전이는 **날짜 + 출처**를 가진다(정책·공고 변동 대비).

```ts
type PresalePhase =
  | "planned"                 // 분양 예정
  | "subscription_scheduled"  // 청약 일정 공고
  | "subscription_open"       // 청약 접수 중
  | "subscription_closed"     // 청약 종료(당첨자 발표)
  | "transfer_restricted"     // 전매제한 기간
  | "transferable"            // 전매제한 해제 → 분양권 거래 가능
  | "occupied";               // 입주(→ 이후 existing으로 전환 후보)

interface PresaleLifecycle {
  phase: PresalePhase;
  phaseSince?: string;        // 해당 상태 진입일(ISO, 확인된 경우)
  lastVerifiedAt: string;     // 이 lifecycle 정보 기준일
  source?: Provenance;        // 근거·검증(§5.3)
  note?: string;
}
```

- `phase`는 **단조 증가가 아닐 수 있음**(정책 변경으로 전매제한 재적용 등) → boolean이
  아니라 상태 + 근거로 표현.
- **occupied → existing 전환**: 입주·등기 후 실거래가가 잡히면 같은 물리 주택이
  `ExistingHome`으로 다뤄질 수 있다. 자동 전환할지는 §12 미결정.
- 상태는 `availableAcquisitionPaths`의 입력. 예: `transferable` && `transfer.status
  === "tradable"` → 경로에 `resale` 포함.

---

## 5. Transfer / Risk / Confidence Model 【세 축을 분리】

`canTransfer: boolean`을 **쓰지 않는다.** 법·정책·공고별로 단정 불가한 경우가 많다.
그리고 **서로 다른 세 개념을 절대 혼동하지 않는다:**

```
① 거래(전매) 상태  TransferStatus     — 법/정책상 전매 허용 여부(대상 사실)
② 데이터 신뢰도    VerificationStatus — 우리가 가진 정보가 얼마나 검증됐나(정보 품질)
③ 거래 위험도      TransactionRisk    — 사용자가 주의할 신호(①②+플래그에서 파생)
```

핵심: **①과 ②는 독립 축**이다. "전매 가능(tradable)"이어도 정보가 미검증이면
초록이 아니다. `unknown`/`needs_review`를 **절대 `tradable`로 간주하지 않는다.**

### 5.1 거래 상태 · 데이터 신뢰도 · 위험도

```ts
// ① 전매 허용 여부 (대상 사실)
type TransferStatus = "tradable" | "restricted" | "conditional" | "unknown";

// ② 데이터 신뢰도 (정보 품질 — 거래 위험과 별개)
type VerificationStatus = "verified" | "needs_review" | "unknown";

// ③ 거래 위험도 (파생 신호 — 결정적 규칙, AI 임의판단 아님)
type TransactionRisk = "normal" | "needs_review" | "high_risk";

// 개별 주의 신호
type RiskFlag =
  | "transfer_restricted"          // 전매제한 중
  | "transferability_unconfirmed"  // 거래 가능 여부 확인 불가
  | "listing_mismatch"             // 공식 정보와 매물 설명 불일치
  | "rights_check_needed"          // 권리관계 추가 확인 필요
  | "price_source_unclear"         // 가격/프리미엄 정보 출처 불명확
  | "stale_info"                   // 정보가 오래되어 재확인 필요
  | "title_transfer_unconfirmed";  // 명의변경 가능 여부 확인 필요
```

- **목적은 "거래를 성사"가 아니라 "위험을 회피"하도록 상태를 보여주는 것**(§0).
  `restricted`일 때 거래 방법을 안내하지 않고, 제한 사유·종료(예정)일·근거만 보여준다.

### 5.2 TransferInfo (시점 + 근거 필수)

```ts
interface TransferInfo {
  status: TransferStatus;
  restrictionReason?: string;    // 제한 사유(사람이 읽는 문장)
  restrictionEndDate?: string;   // 전매제한 종료 예정일(ISO) — "예정" 표기
  conditions?: string[];         // 조건부 가능 시 조건 설명
  reviewReasons?: string[];      // 확인이 필요한 이유(needs_review일 때)
  riskFlags: RiskFlag[];         // 개별 위험 신호
  provenance: Provenance;        // §5.3 출처·검증(필수)
}
```

### 5.3 Provenance (정책 민감 → 판단마다 근거)

```ts
interface Provenance {
  sourceType:
    | "official_announcement" // 입주자모집공고 등 공식 공고
    | "government"            // 정부·공공기관 자료
    | "public_data"           // 공공데이터(실거래 등)
    | "transaction"           // 실거래 신고
    | "listing"               // 매물 설명(비공식)
    | "manual";               // 수기 입력
  sourceId?: string;
  sourceUrl?: string;
  effectiveFrom?: string;     // 근거의 효력 시작
  effectiveTo?: string;       // 효력 종료(있으면)
  lastVerifiedAt: string;     // 마지막 검증일 — 필수
  verificationStatus: VerificationStatus;
}
```

### 5.4 출처 충돌 우선순위 【제안】
동일 정보가 충돌하면 **공식 모집공고/정부·공공기관 자료를 최우선**:
```
official_announcement ≈ government  >  public_data  >  transaction  >  listing  >  manual
```
- 매물(`listing`) 설명이 공식 근거와 다르면 상위(공식)를 채택하고 **`listing_mismatch`
  위험 플래그**를 세운다(사용자에게 불일치 고지).
- 어떤 출처든 `lastVerifiedAt`이 오래되면(임계 초과) `stale_info` 플래그 →
  `verificationStatus`를 `needs_review`로 강등.

### 5.5 위험도 파생 규칙 (결정적·보수적)
`deriveTransactionRisk(transfer): TransactionRisk` — 순수 함수, **보수적 기본값**:
- `transfer_restricted` 플래그 또는 `status==="restricted"` → **high_risk**
- `verificationStatus!=="verified"` 또는 `status/전매성 unknown` 또는 확인계열
  플래그(transferability/ rights/ title/ mismatch/ price_source) 존재 → 최소
  **needs_review**
- 모두 `verified` + `status==="tradable"` + 위험 플래그 없음 → **normal**
- **불명확하면 위로(위험 쪽) 반올림.** unknown을 안전(normal)으로 낙관하지 않는다.

- 전매제한은 (a) 주택법 시행령 기반 **정책 추정**과 (b) 공고별 **개별 확인**이 다를 수
  있음 → `sourceType`으로 구분(정책=`government`, 공고=`official_announcement`).
  정책 추정만 있는 경우 `verificationStatus`는 `needs_review` 이하로 둔다.

---

## 6. Price / Cash-flow Model 【확보난이도 분류 + unknown 명시】

값이 없을 때 **`0`으로 간주 금지** — `undefined`(unknown)를 명시 처리한다. 각 값의
**확보난이도**(`ValueProvenance`)와 **출처 메타**(`Provenance`, §5.3)는 별개 개념이다.

```ts
// 값 확보난이도 — §5.3 Provenance(출처 메타)와 다른 축
type ValueProvenance =
  | "sourced"     // 외부 실데이터로 확보 가능(공고/실거래)
  | "computed"    // 다른 값에서 계산
  | "user_input"  // 사용자 입력 필요
  | "hard";       // 안정적 확보 어려움(추정/확인 필요)

interface Money {
  manwon: number;
  valueProvenance: ValueProvenance;
  asOf?: string;
  source?: Provenance;      // §5.3 출처·검증 메타
}

interface OfferingPrice {
  basePrice?: Money;           // 최초 분양가(주택형 대표)
  resalePrice?: Money;         // 현재 분양권 거래가/확인가
  premium?: Money;             // 프리미엄 = resale - base (computed)
  downPayment?: Money;         // 계약금
  midPaymentPaid?: Money;      // 납부된 중도금(승계 대상)
  midPaymentRemaining?: Money; // 남은 중도금
  balance?: Money;             // 잔금
  cashNeededAtPurchase?: Money;// 매수 시점 필요 현금(computed)
  estimatedTotalAcquisition?: Money; // 최종 예상 취득금액(computed)
  byUnitType?: Record<string, Partial<OfferingPrice>>; // 주택형별
}
```

### 필드별 확보 전략

| 필드 | 분류 | 근거/계산 |
|------|------|-----------|
| 최초 분양가 basePrice | **sourced** | 입주자모집공고 / HUG |
| 분양권 거래가 resalePrice | **sourced** | 국토부 분양권 전매 실거래가(주택형·시점 매칭 필요) |
| 프리미엄 premium | **computed** | `resale − base` (둘 다 있을 때만) |
| 계약금 downPayment | computed / **hard** | 보통 분양가 10~20%(공고 조건). 단지별 상이 |
| 납부 중도금 midPaymentPaid | **user_input** / computed | 회차 스케줄 × 경과. 개별 계약 상태 의존 |
| 남은 중도금 midPaymentRemaining | computed | `총 중도금 − 납부분` |
| 잔금 balance | computed | `base − down − midTotal` |
| 매수 시점 필요 현금 cashNeeded | **computed** | `premium + down + midPaymentPaid(승계)` (+부대비용) |
| 최종 예상 취득금액 total | **computed** | `base + premium` (+취득세·부대비용) |
| 취득 부대비용(취득세 등) | **hard** | 분양권은 세제 상이 → 추정, 확인 필요 |

- **계산 필드는 입력이 unknown이면 결과도 unknown**(0 아님). `computeCashFlow`는
  누락 입력을 propagate하고 "일부 값 미확인" 플래그를 반환한다.
- `byUnitType`으로 주택형별 분해. 대표값은 있으나 형별은 부분적일 수 있음(부분 unknown).

---

## 7. Scoring / Affordability / Eligibility 분리 【직교 유지】

기존 원칙 유지: **적합도 ≠ 매수가능성 ≠ 자격**. 하나의 숫자로 합치지 않는다.

```
HomeFit  ×  Affordability  ×  Transfer Eligibility  ×  Subscription Eligibility
────────    ─────────────    ───────────────────      ────────────────────────
결정적 점수   현금흐름 감당     전매 가능/조건            청약 자격(2C)
   │              │                 │                        │
   └──────────────┴────── Decision View(나란히, 미합산) ─────┘
```

### 7.1 HomeFit에 넣는 값(점수 축)
`computeHomeFit` 최대한 재사용. 취득경로별 **가격 축의 입력만** 분기:

| 축 | 입력 |
|----|------|
| price | **유효가격**: existing=실거래가 / subscription=분양가 / **resale=최종 예상 취득금액(분양가+프리미엄)** |
| newness | `moveInYear`(입주 예정) |
| commute · education · infrastructure · environment · futurePotential | kind 무관 동일 |

- **price 축은 "그 경로로 얻을 때의 총액"을 쓴다.** 분양권은 분양가가 아니라
  `estimatedTotalAcquisition`이 유효가격(프리미엄 포함). 값 unknown이면 price 축은
  presale의 dealbreaker처럼 **unknown**(2B `DealbreakerStatus` 재사용).

### 7.2 점수에 넣지 않고 분리하는 값
- **Affordability(감당가능성)**: `cashNeededAtPurchase`, 향후 납부부담(중도금·잔금
  스케줄), 계약금 — 점수 아님. `evaluateAffordability(home, profile)` 별도 레이어
  (2C `HouseholdProfile.availableFunds`와 결합). "지금 필요한 현금 X, 이후 Y" 표시.
- **Transfer Eligibility**: §5 `TransferInfo` — 게이트/배지(점수 아님).
- **Subscription Eligibility**: 2C 청약 자격 엔진 그대로(점수와 직교).

원칙 유지: **AI가 법적 자격·숫자 점수를 임의 결정하지 않는다.** 전매 가능/자격은
근거·기준일 있는 데이터로만, 없으면 unknown.

---

## 8. 데이터 소스 전략 (공식/공공 → adapter → repository → domain)

이번 단계 API 구현 없음. 필드별 흐름과 "자동 확보 어려움" 표시.

| 데이터 | 후보 소스 | 흐름 | 자동확보 |
|--------|-----------|------|:---:|
| 청약/분양 공고·일정 | 청약홈(한국부동산원) OpenAPI, LH 청약 | adapter→repo→`subscription`/`lifecycle` | △ 신청 필요 |
| 분양가 | 입주자모집공고, HUG 분양보증 | adapter→`offering.basePrice` | △ 공고 파싱 |
| 분양권 실거래 | **국토부 분양권 전매 실거래가**(실거래가 계열) | adapter→`offering.resalePrice` | ○ (매칭 필요) |
| 전매제한 | 주택법 시행령(정책) + 공고별 | policy+공고→`transfer` | ✕ 개별 확인 |
| 입주예정일 | 공고/분양 사업정보 | adapter→`moveInYear`/`lifecycle` | △ |
| 단지/블록 정보 | 입주 전=공고/분양정보, 입주 후=공동주택정보(kapt) | adapter→`HomeBase` | △ |

- **✕/△ 표시분(전매제한·부대비용·개별 계약 상태)은 별도 검증/사용자 입력** 필요 —
  자동 파이프라인이 단정하지 않는다. `lastVerifiedAt` 없는 값은 "확인 필요".
- 어댑터 경계 원칙(`real-data-integration.md`) 유지: 외부 raw → adapter 변환 →
  repository → domain. domain은 raw를 모른다.
- 기존 국토부 실거래 어댑터 패턴 재사용(분양권 전매 실거래는 같은 계열 API).

---

## 9. UI / 라우팅 영향

### 9.1 탐색(“들어가는 방법”)
지역/교산 단위로 취득경로별 그룹:
```
하남교산에 들어가는 방법
 ├ 청약 예정        3   (presale · path=subscription, phase=scheduled)
 ├ 분양 중          1   (presale · subscription, open)
 ├ 분양권 거래 가능  2   (presale · path=resale, transfer=tradable)
 └ 주변 기존 매매    5   (existing)
```
- 필터 "분양권 거래 가능"은 `availableAcquisitionPaths` 파생값으로. (기존 탐색
  화면 `explore-search.md`에 취득경로 필터 축 추가.)

### 9.2 분양 단지 상세 — 상태 배지 + 신호등
lifecycle+transfer를 사람이 이해할 문장으로:
```
[청약 종료] · [전매제한 중] · [2028.03 이후 전매 가능(예정)]
```

**신호등(거래 위험도 + 상태 결합, 보수적):**
| 표시 | 조건 | 문구 예 |
|------|------|---------|
| 🟢 현재 전매 가능 | `tradable` **그리고** `verified` **그리고** 위험플래그 없음 | "현재 분양권 거래 가능 (○○공고 기준, 검증일 …)" |
| 🟡 조건/확인 필요 | `conditional`, 또는 `needs_review` | "조건 확인 필요 — 공식 공고 및 관계기관 확인 필요" |
| 🔴 전매제한 중 | `restricted` / `transfer_restricted` | "전매제한 중 · 사유 … · YYYY.MM 종료 예정" |
| ⚪ 공식 정보 확인 필요 | `unknown` / 미검증 | "공식 공고 및 관계기관 확인 필요" |

**규칙(§0 파생):**
- **`unknown`·`needs_review`를 🟢(tradable)로 표시하지 않는다.** 초록은 오직
  `verified` + `tradable` + 위험플래그 없음일 때만.
- **법적/정책 판단이 필요한 경우 단정 문구 금지** → "공식 공고 및 관계기관 확인 필요"
  같은 안내로. 거래 *방법*은 절대 안내하지 않는다(§0).
- 위험 플래그는 칩으로 나열: "정보와 매물 설명 불일치", "권리관계 확인 필요",
  "가격 출처 불명확", "정보 오래됨(재확인)", "명의변경 확인 필요" 등. 각 칩에 사유·
  출처·마지막 검증일.
- 항상 `lastVerifiedAt`·`sourceUrl`(있으면)을 함께 노출. 오래된 정보는 "재확인 필요".

- 가격 카드: 분양가 / 분양권가 / 프리미엄 / **지금 필요한 현금** / 최종 취득금액.
  unknown은 "—" + "확인 필요"(0 아님). 출처 불명확이면 `price_source_unclear` 칩.

### 9.3 라우팅
- `/complex/[id]` **유지**(presale 상세가 취득경로 섹션을 포함). 분양권용 새 라우트
  없음 — 같은 단지의 다른 경로일 뿐. (`domain-model-v2.md` §4 라우팅 원칙 유지.)

---

## 10. 기존 v2 Migration 영향

| 항목 | 변경 | 파괴적? |
|------|------|:---:|
| `ListingKind` | 변경 없음(existing/presale/area) | 아니오 |
| **`AcquisitionPath`** | **신규**(kind와 직교) | 가산 |
| `PresaleHome` | `lifecycle`·`transfer`·`offering` **선택 필드 추가** | 가산(옵셔널) |
| `ExistingHome` | 변경 없음 | 아니오 |
| `HomeBase`/`Home`/`Listing` | 변경 없음 | 아니오 |
| `CandidateRef` | **변경 없음** — 분양권은 새 kind 아님(같은 presale id). 취득경로는 후보 정체성이 아니라 뷰 | 아니오 |
| `computeHomeFit` | price 축 유효가격 선택에 resale 분기 추가(입력만) | 가산 |
| `FitResult` | `unknownDealbreakers` 재사용(price unknown 포함) | 아니오 |
| Repository | `homeRepository`가 presale에 lifecycle/transfer/offering 채움. 새 repo 불필요 | 가산 |
| routing | 변경 없음 | 아니오 |
| mock data | presale mock에 lifecycle/transfer/offering 샘플 추가 | 가산 |

### `kind:"presale"` 의미 정리 【이번에 확정】
- `kind:"presale"` = **"분양 주택(사업)이라는 물리적/lifecycle 유형"**. **취득 방법이
  아님.**
- "청약"은 취득 방법 → `AcquisitionPath.subscription`. "분양권 매수"도 취득 방법 →
  `AcquisitionPath.resale`. 둘 다 같은 `presale` 주택 위에서 lifecycle에 따라 전이.
- 문서·주석에서 "presale=청약"이라는 암묵적 등치를 제거한다.

---

## 11. 단계별 구현 계획 (후속 — 이 문서 승인 후)

1. **타입 도입(가산)**: `AcquisitionPath`, `PresaleLifecycle`, `TransferInfo`,
   `TransferStatus`/`VerificationStatus`/`TransactionRisk`/`RiskFlag`,
   `OfferingPrice`, `Provenance`, `Money`/`ValueProvenance`. PresaleHome 옵셔널
   필드 추가. `availableAcquisitionPaths`·`deriveTransactionRisk` 순수 함수 + 테스트.
2. **가격/현금흐름 계산**: `computeCashFlow(offering)` — computed 필드 산출, unknown
   propagate. 단위 테스트(누락 입력 → unknown, 0 아님).
3. **HomeFit 연동**: price 축 유효가격 선택기(existing/subscription/resale) + resale
   unknown 시 price DealbreakerStatus=unknown. `computeHomeFit` 시그니처 불변 목표.
4. **Affordability 레이어**: `evaluateAffordability(home, profile)`(점수와 직교, 2C
   프로필 재사용).
5. **UI**: 탐색 취득경로 필터 + 상세 상태 배지/가격 카드(기준일·출처·unknown 처리).
6. **데이터 어댑터(Phase 2B+)**: 분양권 전매 실거래 → `resalePrice`; 청약홈 →
   lifecycle/subscription; 전매제한은 정책+수동 검증.
7. mock 데이터로 전 구간 검증 후 실데이터 단계 도입.

원칙: 각 단계 **가산적·무중단**, 기존 화면/테스트 유지, `computeHomeFit`/
`computeAreaFit` 스코어 성격 불변.

---

## 12. 아직 결정이 필요한 사항 【사용자 확정 요망】

1. **분양권 유효가격**: HomeFit price 축에 `estimatedTotalAcquisition`(분양가+프리미엄)
   을 쓰고 프리미엄까지 점수 반영 — 이게 맞나? 아니면 분양가만 점수, 프리미엄은
   Affordability로만? (제안: 총 취득금액을 유효가격으로.)
2. **occupied → existing 전환**: 입주·실거래 발생 후 같은 주택을 자동으로
   `ExistingHome`으로 승격할지, presale로 유지하고 phase만 occupied로 둘지.
3. **전매제한 확보 범위**: 정책(주택법) 기반 자동 추정까지 할지, 아니면 **공고로
   확인된 것만** 표기하고 나머지는 `unknown`으로 둘지. (법적 리스크 관련.)
4. **청약홈 API**: 청약/분양 공고 자동 수집을 위해 청약홈 OpenAPI 활용신청을 진행할지
   (없으면 lifecycle/subscription은 수동·부분 데이터로 시작).
5. **분양권 전매 실거래 매칭 신뢰도**: 주택형·동·시점 매칭이 애매할 때 대표
   `resalePrice`를 노출할지, "표본 부족" 처리할지 기준.
6. **AcquisitionPath 필터를 탐색 1급 축으로** 노출할지(“분양권 거래 가능만 보기”), 아니면
   분양 상세 안에서만 상태로 보여줄지.
7. **🟢(전매 가능) 표시 최소 요건**: `verified + tradable + 무플래그`로 충분한지,
   아니면 **출처가 `official_announcement`일 때만** 초록 허용처럼 더 엄격히 할지.
8. **정보 노후 임계(`stale_info`)**: 며칠(예: 30/60/90일) 지나면 `needs_review`로
   강등할지 — 정책 민감도에 따라.
9. **출처 충돌 우선순위 확정**: 제안(§5.4) `공식공고≈정부 > 공공데이터 > 실거래 >
   매물 > 수기` 그대로 채택할지, 조정할지.
10. **위험도 파생 규칙(§5.5)** 세부(어떤 플래그를 high_risk로 승격할지) 확정.

---

## 부록: 기존 문서와의 충돌/수정 지점

- `domain-model-v2.md` §1 도표의 "kind:presale (분양 단지)"에 **취득경로 개념이
  없음** → 본 문서로 보강(“presale=물리 유형, 청약/분양권=취득경로”). v2 문서에 교차
  참조 주석 추가 필요.
- `data-phase2b-presale-area.md`의 presale 모델은 청약 중심 → 전매/분양권 lifecycle을
  포함하도록 확장 참조.
- `explore-search.md`: 유형 필터(전체/기존/분양/개발예정지)에 **취득경로 필터**(분양권
  거래 가능) 축 추가 검토.
- `data-phase2c-household-eligibility.md`: Affordability 레이어가 2C
  `HouseholdProfile.availableFunds`·소득과 결합 — 자격과 별개의 "현금흐름 감당" 뷰로
  확장.
