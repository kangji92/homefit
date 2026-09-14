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
  | "broker"
  | "user_input"
  | "mock"
  | "estimated";

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
  generalSaleUnits?: number;
  rentalUnits?: number;
  buildingCount?: number;
  maxFloor?: number;
  sourceType: DataSourceType;
  sourceLabel?: string;
  sourceUrl?: string;
  effectiveDate?: string;
  verifiedAt?: string;
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
  updatedAt?: string;
  /** 사업계획(공식/시공사제안/변경안 등) — 시간순 병존. 덮어쓰지 않는다. */
  plans?: DevelopmentPlan[];
}
