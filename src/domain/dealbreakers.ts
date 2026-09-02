// 절대조건 하드 필터 (docs/design/domain-model.md §6.1).

import type { Complex, Dealbreakers, DealType } from "./types";
import { priceBandFor } from "./price";
import { DEFAULT_SCORING_CONFIG, type ScoringConfig } from "./scoring/config";

/**
 * 실패한 절대조건 키 목록을 반환한다. 빈 배열이면 통과.
 * dealType은 maxPrice 판정에 쓸 활성 거래유형(기본 매매).
 */
export function evaluateDealbreakers(
  dealbreakers: Dealbreakers,
  complex: Complex,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
  dealType: DealType = "sale",
): (keyof Dealbreakers)[] {
  const d = dealbreakers;
  const failed: (keyof Dealbreakers)[] = [];

  const band = priceBandFor(complex.price, dealType);
  // 해당 유형 매물이 없으면(밴드 없음) 가격 절대조건은 판정에서 제외
  if (
    d.maxPrice !== undefined &&
    band !== undefined &&
    band.representative > d.maxPrice
  ) {
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
