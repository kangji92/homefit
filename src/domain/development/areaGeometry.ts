// 개발구역 경계 근사 유틸 (순수). 공식 고시도면의 좌표목록을 확보하지 못한 경우,
// **실 사업면적으로 크기를 산출**한 정사각 근사 polygon을 만든다(중심점=실 지번 근사).
// 이는 임의 형상이 아니라 면적·위치 기준 근사 → geometryAccuracy "approximate"로만 표기.
// 공식 좌표목록/GIS를 확보하면 traced_from_official_map/official_boundary로 승격.
// (docs/design 개발레이어 geometry)

import type { Location } from "../types";
import type { GeoPolygon } from "./types";

const M_PER_DEG_LAT = 111_320;

/** 중심점 + 면적(㎡) → 같은 면적의 정사각 근사 polygon(WGS84). 실제 구역은 부정형임을 전제. */
export function approximateSquarePolygon(center: Location, areaM2: number): GeoPolygon {
  const side = Math.sqrt(Math.max(0, areaM2)); // 한 변(m)
  const half = side / 2;
  const dLat = half / M_PER_DEG_LAT;
  const mPerDegLng = M_PER_DEG_LAT * Math.cos((center.lat * Math.PI) / 180);
  const dLng = mPerDegLng > 0 ? half / mPerDegLng : 0;
  const ring: Location[] = [
    { lat: center.lat + dLat, lng: center.lng - dLng }, // NW
    { lat: center.lat + dLat, lng: center.lng + dLng }, // NE
    { lat: center.lat - dLat, lng: center.lng + dLng }, // SE
    { lat: center.lat - dLat, lng: center.lng - dLng }, // SW
  ];
  return { kind: "polygon", rings: [ring] };
}

/**
 * 중심점 + local 미터 오프셋(동=east, 북=north) 배열 → polygon. 공식 정비계획도의 경계
 * **형상을 수기 trace**할 때 사용(북 기준 up 가정). 절대좌표는 중심점·축척 기준 근사.
 */
export function polygonFromLocalOffsets(
  center: Location,
  offsets: { east: number; north: number }[],
): GeoPolygon {
  const mPerDegLng = M_PER_DEG_LAT * Math.cos((center.lat * Math.PI) / 180) || 1;
  const ring: Location[] = offsets.map((o) => ({
    lat: center.lat + o.north / M_PER_DEG_LAT,
    lng: center.lng + o.east / mPerDegLng,
  }));
  return { kind: "polygon", rings: [ring] };
}

/** polygon 첫 링의 좌표 평균(대략 중심). */
export function polygonCentroid(poly: GeoPolygon): Location | undefined {
  const ring = poly.rings[0];
  if (!ring || ring.length === 0) return undefined;
  const sum = ring.reduce((a, p) => ({ lat: a.lat + p.lat, lng: a.lng + p.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / ring.length, lng: sum.lng / ring.length };
}
