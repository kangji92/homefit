// 절대조건 하드 필터 (docs/design/domain-model.md §6.1).

import type { Complex, Dealbreakers } from "./types";
import { DEFAULT_SCORING_CONFIG, type ScoringConfig } from "./scoring/config";

/** 실패한 절대조건 키 목록을 반환한다. 빈 배열이면 통과. */
export function evaluateDealbreakers(
  dealbreakers: Dealbreakers,
  complex: Complex,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): (keyof Dealbreakers)[] {
  const d = dealbreakers;
  const failed: (keyof Dealbreakers)[] = [];

  if (d.maxPrice !== undefined && complex.price.representative > d.maxPrice) {
    failed.push("maxPrice");
  }
  if (
    d.minSizePyeong !== undefined &&
    !complex.sizesPyeong.some((p) => p >= d.minSizePyeong!)
  ) {
    failed.push("minSizePyeong");
  }
  if (
    d.maxStationDistanceM !== undefined &&
    complex.stationDistanceM > d.maxStationDistanceM
  ) {
    failed.push("maxStationDistanceM");
  }
  if (
    d.maxBuildingAgeYears !== undefined &&
    config.currentYear - complex.completionYear > d.maxBuildingAgeYears
  ) {
    failed.push("maxBuildingAgeYears");
  }
  if (d.minHouseholds !== undefined && complex.households < d.minHouseholds) {
    failed.push("minHouseholds");
  }
  if (d.requireSchoolNearby && complex.schoolNearby !== true) {
    failed.push("requireSchoolNearby");
  }

  return failed;
}
