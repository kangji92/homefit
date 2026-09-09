// 통근시간 추정 (순수·결정적). 청약홈 주소 → 시군구 중심좌표 → WorkArea까지
// 직선거리 기반 근사. 실제 대중교통 경로가 아니라 "지역 기반 추정"임을 고지.
// (라우팅 API 도입 시 이 모듈만 교체.)

export interface LatLng {
  lat: number;
  lng: number;
}

// 경기·수도권 주요 시군구 중심좌표(시청 근사). 표에 없으면 추정 불가(undefined).
export const SIGUNGU_CENTROIDS: Record<string, LatLng> = {
  시흥시: { lat: 37.38, lng: 126.8 },
  여주시: { lat: 37.3, lng: 127.64 },
  남양주시: { lat: 37.64, lng: 127.22 },
  양주시: { lat: 37.79, lng: 127.05 },
  의정부시: { lat: 37.74, lng: 127.03 },
  부천시: { lat: 37.5, lng: 126.79 },
  성남시: { lat: 37.42, lng: 127.13 },
  용인시: { lat: 37.24, lng: 127.18 },
  수원시: { lat: 37.26, lng: 127.03 },
  화성시: { lat: 37.2, lng: 126.83 },
  안양시: { lat: 37.39, lng: 126.93 },
  광명시: { lat: 37.48, lng: 126.86 },
  하남시: { lat: 37.54, lng: 127.21 },
  김포시: { lat: 37.62, lng: 126.72 },
  파주시: { lat: 37.76, lng: 126.78 },
  고양시: { lat: 37.66, lng: 126.83 },
  안산시: { lat: 37.32, lng: 126.83 },
  평택시: { lat: 36.99, lng: 127.11 },
  오산시: { lat: 37.15, lng: 127.07 },
  이천시: { lat: 37.27, lng: 127.44 },
  군포시: { lat: 37.36, lng: 126.94 },
  의왕시: { lat: 37.34, lng: 126.97 },
  구리시: { lat: 37.59, lng: 127.13 },
  포천시: { lat: 37.89, lng: 127.2 },
  안성시: { lat: 37.01, lng: 127.28 },
};

/** 주소 문자열에서 첫 시/군을 뽑아 중심좌표를 찾는다. */
export function sigunguCentroid(address: string | undefined): LatLng | undefined {
  if (!address) return undefined;
  const m = address.match(/([가-힣]{2,}(?:시|군))/);
  return m ? SIGUNGU_CENTROIDS[m[1]] : undefined;
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** 직선거리(km) → 편도 분 근사(도어투도어: 도보·환승 포함 계수). */
function minutesFromKm(km: number): number {
  return Math.min(120, Math.max(10, Math.round(10 + km * 1.6)));
}

/** coords → WorkArea별 통근 분. workAreas는 호출부에서 주입. */
export function estimateCommuteMinutes(
  coords: LatLng,
  workAreas: readonly { id: string; lat: number; lng: number }[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const wa of workAreas) {
    out[wa.id] = minutesFromKm(haversineKm(coords, wa));
  }
  return out;
}

/** 주소 → 통근 분(추정). 시군구 미상이면 undefined. */
export function commuteFromAddress(
  address: string | undefined,
  workAreas: readonly { id: string; lat: number; lng: number }[],
): Record<string, number> | undefined {
  const c = sigunguCentroid(address);
  return c ? estimateCommuteMinutes(c, workAreas) : undefined;
}
