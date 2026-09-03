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
  /** 지역 중심 기준(선택) */
  commuteMinutes?: Record<string, number>;
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
  /** 부부합산 월평균 소득(만원) */
  monthlyIncomeManwon?: number;
  /** 부동산·자동차 등 자산(만원) */
  totalAssetManwon?: number;
  /** 청약통장 가입기간(개월) */
  subscriptionMonths?: number;
  /** 최근 2년내 출산(임신 포함) 여부 — 신생아 특공·특례대출 요건 */
  hasNewborn?: boolean;
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
