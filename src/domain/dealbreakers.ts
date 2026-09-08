// 절대조건 하드 필터 (docs/design/domain-model.md §6.1, v2 §3.3).
// 미확정(주로 presale) 값은 fail이 아니라 unknown으로 분류한다.

import type { Dealbreakers, DealType, Home } from "./types";
import { priceBandFor } from "./price";
import { DEFAULT_SCORING_CONFIG, type ScoringConfig } from "./scoring/config";

export interface DealbreakerEval {
  failed: (keyof Dealbreakers)[];
  unknown: (keyof Dealbreakers)[];
}

/**
 * 절대조건 평가. 값이 미확정(undefined)이면 unknown(탈락 아님), 위반이면 fail.
 * 기존 아파트(existing)는 필드가 전부 확정이라 unknown은 항상 빈 배열.
 */
export function evaluateDealbreakers(
  dealbreakers: Dealbreakers,
  home: Home,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
  dealType: DealType = "sale",
): DealbreakerEval {
  const d = dealbreakers;
  const failed: (keyof Dealbreakers)[] = [];
  const unknown: (keyof Dealbreakers)[] = [];
  const isPresale = home.kind === "presale";

  const band = priceBandFor(home.price, dealType);
  // 해당 유형 매물이 없으면(밴드 없음) 가격 절대조건은 판정에서 제외(v1 유지)
  if (d.maxPrice !== undefined && band !== undefined && band.representative > d.maxPrice) {
    failed.push("maxPrice");
  }

  if (d.minSizePyeong !== undefined) {
    if (!home.sizesPyeong?.length && isPresale) unknown.push("minSizePyeong");
    else if (!home.sizesPyeong.some((p) => p >= d.minSizePyeong!)) failed.push("minSizePyeong");
  }

  if (d.maxStationDistanceM !== undefined) {
    if (home.stationDistanceM === undefined) {
      if (isPresale) unknown.push("maxStationDistanceM");
    } else if (home.stationDistanceM > d.maxStationDistanceM) {
      failed.push("maxStationDistanceM");
    }
  }

  if (d.maxBuildingAgeYears !== undefined) {
    // existing: 준공연도로 연식, presale: 입주예정연도로 연식(미래면 음수→통과)
    const year = home.kind === "existing" ? home.completionYear : home.moveInYear;
    if (year === undefined) {
      if (isPresale) unknown.push("maxBuildingAgeYears");
    } else if (config.currentYear - year > d.maxBuildingAgeYears) {
      failed.push("maxBuildingAgeYears");
    }
  }

  if (d.minHouseholds !== undefined) {
    if (home.households === undefined) {
      if (isPresale) unknown.push("minHouseholds");
    } else if (home.households < d.minHouseholds) {
      failed.push("minHouseholds");
    }
  }

  if (d.requireSchoolNearby) {
    if (home.schoolNearby === undefined && isPresale) unknown.push("requireSchoolNearby");
    else if (home.schoolNearby !== true) failed.push("requireSchoolNearby");
  }

  return { failed, unknown };
}
