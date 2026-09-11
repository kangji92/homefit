// Homefit 도메인 모델 (docs/design/domain-model.md의 구현).
// UI·프레임워크·네트워크와 무관한 순수 타입.

// ===== 우리 조건 =====
export type Transport = "transit" | "car" | "either";

export interface Workplace {
  id: string;
  label: string;
  lat: number;
  lng: number;
  /** 사람별 주 교통수단 */
  transport: Transport;
}

export type ChildPlan = "yes" | "no" | "undecided";
export type MoveInTiming = "asap" | "within1y" | "within2y" | "flexible";
/** 거래 유형: 매매 | 전세 */
export type DealType = "sale" | "jeonse";

export interface UserConditions {
  /** 거래 유형 (매매/전세) */
  dealType: DealType;
  /** 최대 매매 예산 (만원) — dealType==="sale"일 때 사용 */
  maxSalePrice: number;
  /** 최대 전세보증금 (만원) — dealType==="jeonse"일 때 사용 */
  maxJeonseDeposit: number;
  /** 보유 자금 (만원) — 매매·전세 공통 */
  availableFunds: number;
  /** 통근/교통수단은 각 Workplace가 보유. MVP validation은 length===2 */
  workplaces: Workplace[];
  /** 허용 가능한 출퇴근 시간 (편도, 분) */
  maxCommuteMinutes: number;
  /** 희망 평형 범위 (min <= max) */
  desiredSize: { min: number; max: number };
  childPlan: ChildPlan;
  moveInTiming: MoveInTiming;
}

// ===== 집 선택 우선순위 =====
export type PriorityKey =
  | "price"
  | "commute"
  | "education"
  | "newness"
  | "infrastructure"
  | "environment"
  | "futurePotential";

export const PRIORITY_KEYS: readonly PriorityKey[] = [
  "price",
  "commute",
  "education",
  "newness",
  "infrastructure",
  "environment",
  "futurePotential",
];

/** 각 항목의 원시 가중치 입력값 (계산 시 합=1로 정규화) */
export type Priorities = Record<PriorityKey, number>;

// ===== 절대 포기할 수 없는 조건 (하드 필터) =====
export interface Dealbreakers {
  maxPrice?: number;
  minSizePyeong?: number;
  maxStationDistanceM?: number;
  maxBuildingAgeYears?: number;
  minHouseholds?: number;
  requireSchoolNearby?: boolean;
}

// ===== 지역 · 단지 =====
export interface Region {
  id: string;
  name: string;
  summary?: string;
}

/**
 * 지역 참조 — 계층 확장 가능(시>구>생활권>역세권). MVP는 기존 flat `Region.id`를
 * 그대로 담고 level은 optional. 자유 문자열 배열로 고정하지 않기 위한 최소 래퍼.
 */
export type RegionLevel = "city" | "district" | "neighborhood" | "station_area";
export interface RegionRef {
  /** 안정적 식별자. MVP는 기존 Region.id와 동일. */
  id: string;
  level?: RegionLevel;
  /** 표시용 스냅샷(옵션). */
  label?: string;
}

// ===== 위치(좌표) =====
// provider-neutral 최소 값타입. **Map SDK/geocoding provider 타입은 넣지 않는다**
// (provider·placeId·geocodedAt·sourceAddress 등은 data 계층 metadata로 분리).
// (docs/design/coordinate-data-plan.md, decision-map.md §11)
export interface Location {
  /** 위도 (WGS84 / EPSG:4326) */
  lat: number;
  /** 경도 (WGS84 / EPSG:4326) */
  lng: number;
}

/**
 * 위치 정확도 tier — 지도에서 "정확 위치 / 대표 위치 / 위치 근사"를 구분하기 위한
 * 표시용 신호. **Fit/Strategy scoring에는 절대 사용하지 않는다.**
 *   building=건물 지번 · complex=단지 · area=개발지구/생활권 대표 · region=시군구 · unknown
 */
export type LocationAccuracy = "building" | "complex" | "area" | "region" | "unknown";

/** 한 거래 유형의 대표가 + 범위. */
export interface PriceBand {
  representative: number;
  min?: number;
  max?: number;
}

/** 매매·전세를 모두 담는다. 한쪽만 있는 단지도 가능. */
export interface ComplexPrice {
  sale?: PriceBand;
  jeonse?: PriceBand;
}

/** 0~100 정성 지표 (측정 가능한 seed. AI 생성 아님) */
export interface ComplexMetrics {
  education: number;
  infrastructure: number;
  environment: number;
  /** 미래 잠재력 — MVP는 테스트 데이터 (UI에 고지) */
  futurePotential: number;
}

// ===== 대상 분류 (domain-model-v2.md) =====
// 집(지점) = existing | presale → HomeFit,  지역(면) = area → AreaFit
export type ListingKind = "existing" | "presale" | "area";

/** 집(지점) 공통 속성 */
interface HomeBase {
  id: string;
  name: string;
  regionId: string;
  price: ComplexPrice;
  sizesPyeong: number[];
  /** workplaceId → 편도 분 (교통수단 반영된 값) */
  commuteMinutes: Record<string, number>;
  metrics: ComplexMetrics;
  schoolNearby?: boolean;
  images?: string[];
  /** 지도 표시용 좌표(선택). 없으면 지도는 degraded 처리. */
  location?: Location;
  /** 위 location의 정확도 tier(표시용). */
  locationAccuracy?: LocationAccuracy;
}

/** 기존 아파트 — 실거래가 기반 */
export interface ExistingHome extends HomeBase {
  kind: "existing";
  completionYear: number;
  households: number;
  stationDistanceM: number;
}

/** 분양 단지 — 분양가·청약. 입주 전이라 일부 값 미확정(optional) */
export interface PresaleHome extends HomeBase {
  kind: "presale";
  /** 입주 예정연도 (연식 대체) */
  moveInYear: number;
  households?: number;
  stationDistanceM?: number;
  subscription?: { announcementDate?: string; scheduleNote?: string };
  // ── 분양권/전매 (presale-rights.md) — 전부 선택(가산적) ──
  lifecycle?: PresaleLifecycle;
  transfer?: TransferInfo;
  offering?: OfferingPrice;
}

// ===== 분양권 · 취득경로 (docs/design/presale-rights.md) =====

/** 취득 방법 — kind(물리적 유형)와 직교 */
export type AcquisitionPath = "subscription" | "resale" | "existing_trade";

/** 분양 lifecycle 상태 */
export type PresalePhase =
  | "planned"
  | "subscription_scheduled"
  | "subscription_open"
  | "subscription_closed"
  | "transfer_restricted"
  | "transferable"
  | "occupied";

/** ① 전매 허용 여부(대상 사실) */
export type TransferStatus = "tradable" | "restricted" | "conditional" | "unknown";
/** ② 데이터 신뢰도(정보 품질) — 거래 위험과 별개 */
export type VerificationStatus = "verified" | "needs_review" | "unknown";
/** ③ 거래 위험도(파생 신호) */
export type TransactionRisk = "normal" | "needs_review" | "high_risk";

/** 개별 주의 신호 */
export type RiskFlag =
  | "transfer_restricted"
  | "transferability_unconfirmed"
  | "listing_mismatch"
  | "rights_check_needed"
  | "price_source_unclear"
  | "stale_info"
  | "title_transfer_unconfirmed";

export type SourceType =
  | "official_announcement"
  | "government"
  | "public_data"
  | "transaction"
  | "listing"
  | "manual";

/** 출처·검증 메타 (정책 민감 → 판단마다 근거) */
export interface Provenance {
  sourceType: SourceType;
  sourceId?: string;
  sourceUrl?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  /** 마지막 검증일 — 필수 */
  lastVerifiedAt: string;
  verificationStatus: VerificationStatus;
}

export interface PresaleLifecycle {
  phase: PresalePhase;
  phaseSince?: string;
  lastVerifiedAt: string;
  source?: Provenance;
  note?: string;
}

export interface TransferInfo {
  status: TransferStatus;
  restrictionReason?: string;
  restrictionEndDate?: string;
  conditions?: string[];
  reviewReasons?: string[];
  riskFlags: RiskFlag[];
  provenance: Provenance;
}

/** 값 확보난이도 — Provenance(출처 메타)와 다른 축 */
export type ValueProvenance = "sourced" | "computed" | "user_input" | "hard";

export interface Money {
  manwon: number;
  valueProvenance: ValueProvenance;
  asOf?: string;
  source?: Provenance;
}

/** 분양가·분양권가·현금흐름. 값 없음은 undefined(0 아님) */
export interface OfferingPrice {
  basePrice?: Money;
  resalePrice?: Money;
  premium?: Money;
  downPayment?: Money;
  midPaymentPaid?: Money;
  midPaymentRemaining?: Money;
  balance?: Money;
  cashNeededAtPurchase?: Money;
  estimatedTotalAcquisition?: Money;
  byUnitType?: Record<string, Partial<OfferingPrice>>;
}

export type Home = ExistingHome | PresaleHome;

/** v1 명칭 — ExistingHome 별칭(하위호환). */
export type Complex = ExistingHome;

/** 지역 수준 지표 (0~100) */
export interface AreaMetrics {
  plannedInfra: number;
  transitPlan: number;
  supply: number;
  futurePotential: number;
  environment: number;
}

/** 개발 예정지 (3기신도시 등) — AreaFit 대상 */
export interface Area {
  kind: "area";
  id: string;
  name: string;
  regionId: string;
  summary?: string;
  areaMetrics: AreaMetrics;
  targetMoveInYear?: number;
  /** 계획 세대수(실 발표치) — supply 지표를 결정적으로 환산하는 근거 */
  plannedHouseholds?: number;
  /** 지역지표 점수의 핵심 근거(루브릭 적용 요약). 표시용. */
  metricsBasis?: string;
  /** 지역 중심 기준(선택) */
  commuteMinutes?: Record<string, number>;
  /** 지도 표시용 대표 좌표(선택). Area는 polygon 없이 representative point면 충분. */
  location?: Location;
  /** 위 location의 정확도 tier(표시용). */
  locationAccuracy?: LocationAccuracy;
  /**
   * AI가 정리한 지역 참고 정보(정성). **점수(AreaFit)에는 절대 반영하지 않는다.**
   * 결정적 점수와 분리된 표시용 — "AI 생성·참고용·사실과 다를 수 있음" 라벨 필수.
   */
  aiInsight?: string;
}

export type Listing = Home | Area;

// ===== 가구 프로필 (자격 판정용, 점수와 직교) =====
export type HousingStatus = "none" | "own"; // 무주택 | 유주택
/** 법적 기혼 | 예비 신혼부부 | 사실혼(동거, 미신고) */
export type MaritalStatus = "married" | "prospective" | "de_facto";

/** 미입력(undefined)은 자격 판정에서 unknown으로 처리한다. */
export interface HouseholdProfile {
  maritalStatus?: MaritalStatus;
  /** 혼인 기간(개월) — maritalStatus==="married"일 때 */
  marriedMonths?: number;
  housingStatus?: HousingStatus;
  /** 미성년 자녀 수(태아 포함) */
  minorChildren?: number;
  /** 최근 2년내 출산(임신 포함) 여부 — 신생아 특공·특례대출 요건 */
  hasNewborn?: boolean;
  /** 가구원수 — 도시근로자 소득기준 표 조회 키 */
  householdSize?: number;
  /** 맞벌이 여부 — 소득 상한 비율 선택 */
  dualIncome?: boolean;
  /** 부부합산 월평균 소득(만원, 세전) */
  monthlyIncomeManwon?: number;
  /** 부동산가액(세대 합산, 만원) */
  realEstateAssetManwon?: number;
  /** 자동차가액(세대 합산, 만원) */
  carValueManwon?: number;
  /** 청약통장 가입기간(개월) — 신청자 기준(합산 아님) */
  subscriptionMonths?: number;
}

// ===== 현재 주거 맥락 (Current Housing Context) =====
// "앞으로 원하는 집"(UserConditions)과 별개로, **지금 어디서 어떻게 사는지**를
// 출발점으로 둔다. Decision View가 "좋은 집 설명"이 아니라 "현재 상태에서 이 선택으로
// 옮기면 무엇이 달라지는가"가 되도록 하는 기준점. (docs/design/current-housing.md)

/** 현재 점유 형태. HouseholdProfile.housingStatus(자격용)보다 세분화. */
export type Tenure = "owner" | "jeonse" | "monthly_rent" | "family" | "other";

/** 현재 생활권을 얼마나 유지하고 싶은지. hard=stay_current_area, 나머지는 soft. */
export type MovePreference =
  | "stay_current_area" // (hard) 현재 생활권 유지가 중요
  | "prefer_nearby" // (soft) 가급적 근처
  | "open_to_move" // (neutral) 다른 지역도 가능
  | "want_to_leave"; // (soft) 오히려 다른 지역 희망

export interface CurrentHousing {
  tenure: Tenure;
  /** 현재 지역(계층 확장 가능). */
  regionRef?: RegionRef;
  /** Homefit 데이터와 매칭되는 경우의 단지 참조(옵션). */
  homeRef?: CandidateRef;
  /** 매칭 못한 경우의 최소 표시명. */
  homeName?: string;
  /** 보증금(만원) — 전세/월세. */
  deposit?: number;
  /** 월세(만원) — 월세. */
  monthlyRent?: number;
  movePreference: MovePreference;
}

/** 관심/제외 지역. preferred=soft(우선), excluded=hard(생성·추천 제외). */
export interface RegionPreferences {
  preferred: RegionRef[];
  excluded: RegionRef[];
}

// ===== 현재 집 ↔ 후보 비교 (새 종합점수 아님) =====
export type DeltaDirection = "gain" | "tradeoff" | "neutral";
export interface HousingDelta {
  key: string;
  label: string;
  /** 사용자 표시 문자열(수치 or 라벨). 미상이면 undefined. */
  current?: string;
  candidate?: string;
  /** 변화 요약(예: "+8평", "생활권 이동"). */
  change?: string;
  direction: DeltaDirection;
}

/** HomeFit과 섞지 않는 별도 결과. 현재→후보의 변화만 결정적으로 서술. */
export interface CurrentHomeComparison {
  hasCurrent: boolean;
  rows: HousingDelta[];
  gains: string[];
  tradeoffs: string[];
}

// ===== 주거 전략 (docs/design/housing-strategy.md) =====
// Strategy는 Listing의 subtype이 아니라 "행동+시간의 경로". 새 종합점수를 만들지
// 않고 기존 엔진(HomeFit/자격/현금흐름/전매)을 직교로 조합한다.

export type StrategyKind =
  | "buy_existing" // 기존주택 즉시 매수
  | "apply_presale" // 청약 도전(접수 중)
  | "rent_then_apply" // 전세 거주 → 청약 대기(예정)
  | "buy_presale_right"; // 분양권 매수

export type StrategyStepKind = "buy" | "rent" | "apply" | "wait" | "move_in";

export type Horizon = "now" | "short" | "mid" | "long"; // 즉시/1~2년/2~4년/4년+

export interface TimingHint {
  horizon: Horizon;
  targetYear?: number;
  note?: string;
}

export interface StrategyStep {
  kind: StrategyStepKind;
  ref?: CandidateRef; // 미정(예: 새 전세)이면 없음
  acquisitionPath?: AcquisitionPath;
  timing: TimingHint;
  note?: string;
}

export interface HousingStrategy {
  id: string;
  kind: StrategyKind;
  label: string;
  steps: StrategyStep[]; // 시간순
  targetRef?: CandidateRef; // 최종 정착 대상(HomeFit 기준)
}

export type DecisionStatus =
  | "recommended"
  | "consider"
  | "needs_review"
  | "blocked";

/** status 근거 — 코드(테스트/규칙) + 설명(표시). UI 문구에 규칙이 종속되지 않게 분리. */
export interface DecisionReason {
  code: string;
  text: string;
}

export interface StrategyDecision {
  strategyId: string;
  status: DecisionStatus;
  reasons: DecisionReason[];
  fit?: FitResult | AreaFitResult;
  affordability: {
    cashNeededNow?: number; // 만원
    futureBurden?: number; // 만원(향후 주요 부담)
    verdict: "ok" | "short" | "unknown";
  };
  timing: { settleBy?: number; horizon: Horizon };
  eligibility?: { status: DealbreakerStatus; program?: string };
  transfer?: TransferInfo;
  risk: {
    flags: string[];
    /** 확인이 필요한 불확실성 — 자격·전매/권리·자금·법적/정책. status를 needs_review로 강등. */
    requiredReviews: string[];
    /** 사용자가 아직 정하지 않은 중간 단계(예: 전세 후보 미선정). 정보가 채워지면
     *  해소되며, 이것만 있으면 needs_review로 강등하지 않는다(consider 유지). */
    incompleteInputs: string[];
  };
  pros: string[];
  cons: string[];
  nextActions: string[];
}

// ===== 후보 관리 =====
export interface CandidateNotes {
  pros: string[];
  cons: string[];
  visitMemo?: string;
}

/** 후보 참조 — kind로 대상 종류 구분 (persist v3) */
export type CandidateRef =
  | { kind: "existing"; id: string }
  | { kind: "presale"; id: string }
  | { kind: "area"; id: string };

export interface Candidate {
  kind: ListingKind;
  id: string;
  favorite: boolean;
  notes: CandidateNotes;
  /** ISO 문자열 (정렬용) */
  addedAt: string;
}

export interface RegionInterest {
  regionId: string;
  addedAt: string;
}

// ===== 적합도 =====
export type DealbreakerStatus = "pass" | "fail" | "unknown";

export interface FitResult {
  complexId: string;
  passesDealbreakers: boolean;
  failedDealbreakers: (keyof Dealbreakers)[];
  /** 미확정(주로 presale) — 탈락 조건 아님, 별도 표시 */
  unknownDealbreakers: (keyof Dealbreakers)[];
  /** 각 항목 0~100 (표시용 정수) */
  axisScores: Record<PriorityKey, number>;
  /** 가중합 0~100 (정수) */
  totalScore: number;
}

/** AreaFit 결과 — HomeFit과 직접 점수 비교 금지 (성격이 다른 척도) */
export interface AreaFitResult {
  areaId: string;
  /** 반영된 축만 (제외 축은 키 없음) */
  axisScores: Partial<Record<PriorityKey | "plannedInfra" | "transitPlan" | "supply", number>>;
  totalScore: number;
}

// ===== VS 비교 =====
export type Winner = "a" | "b" | "tie";

export interface Comparison {
  a: FitResult;
  b: FitResult;
  perAxisWinner: Record<PriorityKey, Winner>;
  overallWinner: Winner;
  tieThreshold: number;
}
