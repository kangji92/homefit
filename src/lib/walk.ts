// 역까지 거리(m) ↔ 성인 도보 분 환산.
// 부동산 표시광고 표준: 도보 1분 = 80m.
export const WALK_METERS_PER_MIN = 80;

/** 미터 → 도보 분 (반올림). */
export function metersToWalkMinutes(meters: number): number {
  return Math.round(meters / WALK_METERS_PER_MIN);
}

/** 도보 분 → 미터. */
export function walkMinutesToMeters(minutes: number): number {
  return Math.round(minutes * WALK_METERS_PER_MIN);
}
