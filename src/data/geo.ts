// 좌표 provenance/검증 — **data 계층 전용**. domain `Location`은 단순(lat/lng)하게
// 두고, 출처(source)는 여기서만 추적한다(QA·ingest용). scoring에 사용하지 않는다.
// 정확도(LocationAccuracy)는 지도 표시에 쓰이므로 domain에 둔다. (coordinate-data-plan §1,§5,§9)

import type { Location } from "@/domain/types";

/** 좌표 출처. 표시가 아니라 데이터 계보 추적용(도메인/scoring 미사용). */
export type LocationSource = "public_data" | "geocoded" | "curated" | "fallback";

/** ingest/mock에서 좌표에 계보를 붙일 때 쓰는 data-layer 레코드. */
export interface LocationRecord {
  location: Location;
  source: LocationSource;
}

// 수도권(서울·경기·인천) 대략 bounding box — 좌표 sanity 검증용.
export const METRO_BOUNDS = { latMin: 36.9, latMax: 38.1, lngMin: 126.3, lngMax: 127.9 };

/** 좌표가 수도권 범위 안에 있는지(명백한 오류·좌표계 혼동 방지). */
export function isPlausibleMetroLocation(loc: Location): boolean {
  return (
    Number.isFinite(loc.lat) &&
    Number.isFinite(loc.lng) &&
    loc.lat >= METRO_BOUNDS.latMin &&
    loc.lat <= METRO_BOUNDS.latMax &&
    loc.lng >= METRO_BOUNDS.lngMin &&
    loc.lng <= METRO_BOUNDS.lngMax
  );
}
