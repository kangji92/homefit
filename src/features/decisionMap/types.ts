// 지도 view-model(provider-neutral). **Map SDK 타입을 포함하지 않는다.** 도메인 객체를
// 그대로 지도 컴포넌트에 넘기지 않고, 지도 표현에 필요한 최소 metadata만 담는다.
// scoring/business logic은 여기서 계산하지 않는다(재사용만). (docs/design/decision-map.md §11)

import type { DecisionStatus, Location, LocationAccuracy } from "@/domain/types";

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
  // 지도 표현용 최소 decision metadata(재사용, 재계산 아님)
  fitScore?: number;
  decisionStatus?: DecisionStatus;
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
}
