// provider-neutral 지도 adapter 경계. 이후 KakaoMapAdapter 등이 이 interface를 구현한다.
//   DecisionMap → MapAdapter ├ KakaoMapAdapter └ future
// 지금 실제 필요한 기능만 정의(YAGNI). polygon/directions/clustering은 필요해질 때 확장.
// **Map SDK 타입은 이 파일에 등장하지 않는다.** (docs/design/decision-map.md §11, §4)

import type { Location } from "@/domain/types";
import type { DecisionMapScene } from "./types";

/** provider-neutral 뷰포트(경계 상자). SDK 타입 대신 순수 값. */
export interface MapViewport {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export interface MapAdapter {
  /** scene의 엔티티/관계를 지도에 반영. */
  render(scene: DecisionMapScene): void;
  /** 엔티티(마커) 클릭 콜백 등록 — id를 돌려준다(카드 동기화용). */
  onEntityClick(handler: (entityId: string) => void): void;
  /**
   * 개발구역(polygon/line geometry) 클릭 콜백 등록 — development id를 돌려준다.
   * 개발구역은 MapEntity가 아니라 overlay이므로 onEntityClick과 별도 경로.
   * SDK별 도형 클릭 리스너는 구현체 내부에만 존재한다.
   */
  onDevelopmentClick(handler: (developmentId: string) => void): void;
  /** 선택 엔티티 강조(없으면 해제). */
  setSelected(entityId: string | null): void;
  /** 좌표들이 한 화면에 들어오도록 맞춘다. */
  fitBounds(targets: Location[]): void;
  /** 뷰포트 변경(pan/zoom) 콜백 — 탐색 보조용. */
  onViewportChange(handler: (viewport: MapViewport) => void): void;
}
