// 지도 view-model(provider-neutral). **Map SDK 타입을 포함하지 않는다.** 도메인 객체를
// 그대로 지도 컴포넌트에 넘기지 않고, 지도 표현에 필요한 최소 metadata만 담는다.
// scoring/business logic은 여기서 계산하지 않는다(재사용만). (docs/design/decision-map.md §11)

import type { DecisionStatus, HousingType, Location, LocationAccuracy } from "@/domain/types";
import type {
  DevelopmentCertainty,
  DevelopmentGeometry,
  DevelopmentStage,
  DevelopmentType,
  RedevelopmentStage,
} from "@/domain/development";

// point entity(주택/직장/지역)만. 개발사업 구역은 MapDevelopmentOverlay(geometry)로 다루며
// UI hit-target enum(MapEntityKind)으로 승격하지 않는다 — polygon click은 adapter가 직접 처리.
export type MapEntityKind =
  | "current_home"
  | "workplace"
  | "existing_home"
  | "presale_home"
  | "area";

export interface MapEntity {
  id: string;
  kind: MapEntityKind;
  /** 좌표는 필수 — 좌표 없는 대상은 scene에 넣지 않고 degraded 처리한다. */
  location: Location;
  label: string;
  selected?: boolean;
  dimmed?: boolean;
  accuracy?: LocationAccuracy;
  /** 물리적 주택 유형(kind 확장 대신 metadata로 구분). 마커 스타일 분기. */
  housingType?: HousingType;
  /** 재개발 구역 내부 매물 표시(일반 빌라와 구분). */
  inRedevelopment?: boolean;
  // 지도 표현용 최소 decision metadata(재사용, 재계산 아님)
  fitScore?: number;
  decisionStatus?: DecisionStatus;
}

/** 개발사업 오버레이(polygon/line/point). MapEntity(point)와 분리 — 폴리곤을 point에 넣지 않음. */
export interface MapDevelopmentOverlay {
  id: string;
  label: string;
  developmentType: DevelopmentType;
  stage: DevelopmentStage;
  detailStage?: RedevelopmentStage;
  certainty: DevelopmentCertainty;
  geometry: DevelopmentGeometry;
  /** 이 구역과 연관된 entity id들(구역 내부 매물 등). */
  relatedEntityIds: string[];
  /** 선택된 구역(폴리곤 강조). selectedDevelopmentId와 일치할 때 true. */
  selected?: boolean;
}

export type MapRelationKind = "move" | "commute";

export interface MapRelation {
  fromId: string;
  toId: string;
  kind: MapRelationKind;
  /** 예: "이동", "내 통근 +9분" — currentHomeComparison 결과 재사용. */
  label?: string;
}

/** 한 화면에 필요한 관계를 묶는 provider-neutral scene. route geometry는 없음. */
export interface DecisionMapScene {
  entities: MapEntity[];
  relations: MapRelation[];
  /** fitBounds 대상 좌표(포함된 엔티티 위치). */
  boundsTargets: Location[];
  /** 개발사업 오버레이(선택). 기존 scene 리터럴 호환 위해 optional. */
  developments?: MapDevelopmentOverlay[];
}
