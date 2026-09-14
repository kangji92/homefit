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
}
