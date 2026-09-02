// 축별 0~100 정규화 (docs/design/scoring.md §2). 모두 "높을수록 좋음".

import type { Home, PriorityKey, UserConditions } from "../types";
import { maxBudgetFor, priceBandFor } from "../price";
import type { ScoringConfig } from "./config";

export const clamp = (x: number, lo = 0, hi = 100): number =>
  Math.min(hi, Math.max(lo, x));

/** x0..x1 구간을 y0..y1로 선형 매핑 */
export const lerp = (
  x: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): number => y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);

/**
 * 가격: 활성 거래유형 예산 대비 저렴할수록 ↑, 보유 자금 커버율로 보정.
 * 해당 유형 매물이 없으면 0. (docs/design/scoring.md §2.1)
 */
export function priceScore(
  home: Home,
  conditions: UserConditions,
  config: ScoringConfig,
): number {
  const band = priceBandFor(home.price, conditions.dealType);
  if (!band) return 0; // 해당 거래유형 매물 없음
  const budget = maxBudgetFor(conditions);
  const p = band.representative;

  const floor = budget * config.priceFloorRatio;
  const denom = budget - floor;
  if (denom <= 0) return 0;
  const headroom = clamp((100 * (budget - p)) / denom);

  const coverage = p > 0 ? clamp(conditions.availableFunds / p, 0, 1) : 0;
  const w = config.fundsCoverageWeight;
  return clamp(headroom * (1 - w + w * coverage));
}

/** 통근: 모든 사람 중 가장 긴 통근 기준, 3구간 선형 */
export function commuteScore(
  home: Home,
  conditions: UserConditions,
  config: ScoringConfig,
): number {
  const L = conditions.maxCommuteMinutes;
  if (L <= 0) return 0;
  const mins = conditions.workplaces.map(
    (w) => home.commuteMinutes[w.id] ?? Number.POSITIVE_INFINITY,
  );
  const worst = mins.length ? Math.max(...mins) : 0;

  const a = config.commuteFullRatio * L;
  const cap = config.commuteHardCapRatio * L;
  const S = config.commuteScoreAtLimit;

  if (worst <= a) return 100;
  if (worst <= L) return clamp(lerp(worst, a, L, 100, S));
  if (worst <= cap) return clamp(lerp(worst, L, cap, S, 0));
  return 0;
}

/** 신축: 연식 선형 (신축 100 → newnessZeroAtYears년 이상 0).
 *  existing=준공연도, presale=입주예정연도(미래면 신축 만점). */
export function newnessScore(home: Home, config: ScoringConfig): number {
  const year = home.kind === "existing" ? home.completionYear : home.moveInYear;
  const age = Math.max(config.currentYear - year, 0);
  return clamp(100 * (1 - age / config.newnessZeroAtYears));
}

/** 7축 원시 점수(반올림 전). 총점 계산에는 이 값을 쓴다. */
export function computeAxisScores(
  home: Home,
  conditions: UserConditions,
  config: ScoringConfig,
): Record<PriorityKey, number> {
  return {
    price: priceScore(home, conditions, config),
    commute: commuteScore(home, conditions, config),
    newness: newnessScore(home, config),
    education: clamp(home.metrics.education),
    infrastructure: clamp(home.metrics.infrastructure),
    environment: clamp(home.metrics.environment),
    futurePotential: clamp(home.metrics.futurePotential),
  };
}
