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

export interface Complex {
  id: string;
  name: string;
  regionId: string;
  price: ComplexPrice;
  sizesPyeong: number[];
  completionYear: number;
  households: number;
  stationDistanceM: number;
  /** workplaceId → 편도 분 (교통수단 반영된 값) */
  commuteMinutes: Record<string, number>;
  metrics: ComplexMetrics;
  schoolNearby?: boolean;
  images?: string[];
}

// ===== 후보 관리 =====
export interface CandidateNotes {
  pros: string[];
  cons: string[];
  visitMemo?: string;
}

export interface Candidate {
  complexId: string;
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
export interface FitResult {
  complexId: string;
  passesDealbreakers: boolean;
  failedDealbreakers: (keyof Dealbreakers)[];
  /** 각 항목 0~100 (표시용 정수) */
  axisScores: Record<PriorityKey, number>;
  /** 가중합 0~100 (정수) */
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
