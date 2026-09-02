// 축별 0~100 정규화 (docs/design/scoring.md §2). 모두 "높을수록 좋음".

import type { Complex, PriorityKey, UserConditions } from "../types";
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

/** 가격: 예산 대비 저렴할수록 ↑ (price.representative 사용) */
export function priceScore(
  complex: Complex,
  conditions: UserConditions,
  config: ScoringConfig,
): number {
  const p = complex.price.representative;
  const floor = conditions.maxBudget * config.priceFloorRatio;
  const denom = conditions.maxBudget - floor;
  if (denom <= 0) return 0;
  return clamp((100 * (conditions.maxBudget - p)) / denom);
}

/** 통근: 모든 사람 중 가장 긴 통근 기준, 3구간 선형 */
export function commuteScore(
  complex: Complex,
  conditions: UserConditions,
  config: ScoringConfig,
): number {
  const L = conditions.maxCommuteMinutes;
  if (L <= 0) return 0;
  const mins = conditions.workplaces.map(
    (w) => complex.commuteMinutes[w.id] ?? Number.POSITIVE_INFINITY,
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

/** 신축: 연식 선형 (신축 100 → newnessZeroAtYears년 이상 0) */
export function newnessScore(complex: Complex, config: ScoringConfig): number {
  const age = Math.max(config.currentYear - complex.completionYear, 0);
  return clamp(100 * (1 - age / config.newnessZeroAtYears));
}

/** 7축 원시 점수(반올림 전). 총점 계산에는 이 값을 쓴다. */
export function computeAxisScores(
  complex: Complex,
  conditions: UserConditions,
  config: ScoringConfig,
): Record<PriorityKey, number> {
  return {
    price: priceScore(complex, conditions, config),
    commute: commuteScore(complex, conditions, config),
    newness: newnessScore(complex, config),
    education: clamp(complex.metrics.education),
    infrastructure: clamp(complex.metrics.infrastructure),
    environment: clamp(complex.metrics.environment),
    futurePotential: clamp(complex.metrics.futurePotential),
  };
}
