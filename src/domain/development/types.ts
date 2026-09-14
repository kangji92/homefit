// 개발사업(정비사업·철도·신도시) 도메인. 지도 SDK 타입을 넣지 않는다(geometry는
// Location(lat/lng)만). developmentType(사업 종류)과 stage/detailStage(진행 단계),
// certainty(확정성)를 분리. scoring(fitScore/decisionStatus)에 반영하지 않는다 — 판단 보조.
// (docs/design/decision-map.md 개발레이어)

import type { Location } from "../types";

export type DevelopmentType =
  | "redevelopment"
  | "reconstruction"
  | "railway"
  | "new_town"
  | "other";

/** 모든 developmentType 공통 generic lifecycle. */
export type DevelopmentStage =
  | "proposed"
  | "planned"
  | "approved"
  | "in_progress"
  | "completed";

/** 정비사업(재개발/재건축) 전용 세부 단계(옵션). 과-generic 회피. */
export type RedevelopmentStage =
  | "designation"
  | "association"
  | "implementation"
  | "management"
  | "demolition"
  | "construction";

/** 확정성 — 확정 사업과 장기검토를 UI 강도로 차등(numeric score 아님). */
export type DevelopmentCertainty = "confirmed" | "likely" | "uncertain";

// ── SDK-독립 geometry (Location = WGS84 lat/lng) ──
export interface GeoPolygon {
  kind: "polygon";
  /** 외곽 링(들). 각 링은 닫힌 좌표열. */
  rings: Location[][];
}
export interface GeoLine {
  kind: "line";
  path: Location[];
}
export interface GeoPointGeom {
  kind: "point";
  at: Location;
}
export type DevelopmentGeometry = GeoPolygon | GeoLine | GeoPointGeom;

// ── 입력값 출처(provenance) — "누가 준 숫자인가" 축. 기존 SourceType/ValueProvenance와 별개. ──
export type DataSourceType =
  | "official"
  | "association"
  | "contractor" // 시공사 제안/IR
  | "media" // 언론 보도 등 2차
  | "broker"
  | "user_input"
  | "mock"
  | "estimated";

/**
 * 개발정보 검증 상태. **기존 `VerificationStatus`(verified|needs_review|unknown)와 의미축이
 * 다르다** — 그건 데이터 신선도/품질 축, 이건 "누가 확인했나" 출처 신뢰 축이다.
 *   verified: 공식 원문/기관 자료 확인 · reported: 언론·시공사 등 2차/공개 자료 ·
 *   unverified: 중개사·사용자 입력 등 별도 공식 검증 전. **숫자 score 아님.**
 */
export type DevelopmentVerification = "verified" | "reported" | "unverified";

/**
 * geometry 정확도. 공식 도면을 사람이 trace한 polygon은 source가 verified여도
 * accuracy는 traced_from_official_map이어야 한다(공식 GIS boundary와 동일 취급 금지).
 */
export type DevelopmentGeometryAccuracy =
  | "official_boundary" // 공식 좌표/GIS 경계
  | "traced_from_official_map" // 공식 고시도면 등을 보고 수기 trace
  | "approximate" // 공개 지도 기반 근사
  | "centroid_only"; // 경계 없이 대표점만

/** 값 + 출처 최소 래퍼. cost 입력·사업계획에만 사용(Money 등 전역 primitive는 안 바꿈). */
export interface Sourced<T> {
  value: T;
  sourceType: DataSourceType;
  sourceLabel?: string;
  sourceUrl?: string;
  verifiedAt?: string;
}

// ── 사업계획: 공식/시공사제안/사업시행/관리처분 등을 덮어쓰지 않고 배열로 병존 ──
export type DevelopmentPlanType =
  | "official"
  | "contractor_proposal"
  | "implementation"
  | "management"
  | "other";

export interface DevelopmentPlan {
  id: string;
  type: DevelopmentPlanType;
  contractor?: string;
  brand?: string;
  proposedComplexName?: string;
  totalUnits?: number;
  memberUnits?: number;
  /** 분양세대수(중립). **일반분양(generalSaleUnits)과 다르다** — 공식 근거 없으면 undefined. */
  saleUnits?: number;
  /** 일반분양 세대수 — 공식 근거 있을 때만. saleUnits와 혼동 금지. */
  generalSaleUnits?: number;
  rentalUnits?: number;
  buildingCount?: number;
  maxFloor?: number;
  sourceType: DataSourceType;
  sourceLabel?: string;
  sourceUrl?: string;
  effectiveDate?: string;
  verifiedAt?: string;
  /** 이 계획안의 검증 상태(세부 필드 신뢰 기준). */
  verification?: DevelopmentVerification;
}

/** 사업 주요 일정. 확정(인가·완료)과 목표/예정을 혼동하지 않게 status로 분리. */
export type DevelopmentMilestoneKind =
  | "designation" // 정비구역 지정
  | "association" // 조합설립인가
  | "implementation" // 사업시행계획인가
  | "management" // 관리처분계획인가
  | "construction" // 착공
  | "move_in" // 입주
  | "other"; // 위 enum에 없는 절차(정비예정구역 고시·추진위 승인·정비계획 변경 등) — label로 표기
export type DevelopmentMilestoneStatus = "confirmed" | "planned" | "target";
export interface DevelopmentMilestone {
  kind: DevelopmentMilestoneKind;
  /** 정확 절차명(고시 원문 표현). kind가 "other"거나 상세 표기가 필요할 때. */
  label?: string;
  /** ISO(YYYY-MM 등) 또는 연도. 미확인이면 undefined. */
  date?: string;
  /** confirmed: 공식 인가·완료일 / target: 목표 / planned: 예정(확정 아님). */
  status: DevelopmentMilestoneStatus;
  sourceType?: DataSourceType;
  sourceUrl?: string;
  verification?: DevelopmentVerification;
}

/**
 * 사업 현황·물리 facts(area-level, 단일 스냅샷). **분양(saleUnits)≠일반분양·현황(existing)≠
 * 계획** 등 의미를 혼동하지 않도록 계획 세대수는 DevelopmentPlan에, 현황/물리량은 여기에.
 */
export interface DevelopmentProjectFacts {
  siteAreaM2?: number;
  landParcelCount?: number;
  existingBuildingCount?: number;
  existingHouseholds?: number;
  /** 조합원 수(인/세대). 계획의 memberUnits(조합원분양)와 구분. */
  memberCount?: number;
  parkingSpaces?: number;
  buildingCoverageRatio?: number; // 건폐율 %
  floorAreaRatio?: number; // 용적률 %
  basementFloors?: number;
}

export interface DevelopmentArea {
  id: string;
  name: string;
  developmentType: DevelopmentType;
  stage: DevelopmentStage;
  /** redevelopment/reconstruction에서만 의미 있는 세부 단계. */
  detailStage?: RedevelopmentStage;
  certainty: DevelopmentCertainty;
  regionId?: string;
  geometry: DevelopmentGeometry;
  summary?: string;
  /** 출처/갱신 — 표시·계보용. */
  source?: string;
  sourceUrl?: string;
  updatedAt?: string;
  /**
   * Area-level 검증 = **project identity**(사업 존재·구역/사업명·기본 정보) 검증 상태만.
   * 세대수/시공사/동수/층/계획안 등 세부는 각 DevelopmentPlan.verification을 기준으로.
   * (DevelopmentArea.verification ≠ 내부 모든 데이터가 verified)
   */
  verification?: DevelopmentVerification;
  /** geometry 정확도(공식 GIS ≠ 수기 trace 구분). */
  geometryAccuracy?: DevelopmentGeometryAccuracy;
  /** 사업 현황·물리 facts(단일 스냅샷). */
  facts?: DevelopmentProjectFacts;
  /** 사업 주요 일정(확정/목표 구분). */
  milestones?: DevelopmentMilestone[];
  /** 사업계획(공식/시공사제안/변경안 등) — 시간순 병존. 덮어쓰지 않는다. */
  plans?: DevelopmentPlan[];
}
