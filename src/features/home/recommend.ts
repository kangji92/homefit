// 홈 추천 파생 로직 (순수 함수). scoring은 domain의 computeFit/sortByFit을 재사용한다.

import { computeFit, sortByFit } from "@/domain/scoring";
import { DEFAULT_SCORING_CONFIG, type ScoringConfig } from "@/domain/scoring/config";
import {
  PRIORITY_KEYS,
  type Complex,
  type Dealbreakers,
  type FitResult,
  type Priorities,
  type PriorityKey,
  type UserConditions,
} from "@/domain/types";

export { isConditionsReady } from "@/lib/conditions";

export const RECOMMEND_LIMIT = 5;

export interface Recommendation {
  complex: Complex;
  fit: FitResult;
}

/**
 * 각 단지에 computeFit 적용 후 sortByFit 규칙(통과 우선 → 총점순)으로 정렬,
 * 상위 limit개를 반환한다.
 */
export function recommendComplexes(
  complexes: Complex[],
  conditions: UserConditions,
  priorities: Priorities,
  dealbreakers: Dealbreakers,
  limit: number = RECOMMEND_LIMIT,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): Recommendation[] {
  const pairs = complexes.map((complex) => ({
    complex,
    fit: computeFit(conditions, priorities, dealbreakers, complex, config),
  }));
  const byId = new Map(pairs.map((p) => [p.complex.id, p]));

  return sortByFit(pairs.map((p) => p.fit))
    .map((f) => byId.get(f.complexId))
    .filter((p): p is Recommendation => p !== undefined)
    .slice(0, limit);
}

/** 카드에 노출할 상위 axis n개 (점수 내림차순). */
export function topAxes(
  fit: FitResult,
  n = 3,
): { key: PriorityKey; score: number }[] {
  return PRIORITY_KEYS.map((key) => ({ key, score: fit.axisScores[key] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}
