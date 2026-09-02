// 적합도 계산 + 정렬 (docs/design/scoring.md §3~5).

import { evaluateDealbreakers } from "../dealbreakers";
import {
  PRIORITY_KEYS,
  type Complex,
  type Dealbreakers,
  type FitResult,
  type Priorities,
  type PriorityKey,
  type UserConditions,
} from "../types";
import { DEFAULT_SCORING_CONFIG, type ScoringConfig } from "./config";
import { computeAxisScores } from "./normalize";

/** 가중치를 합=1로 정규화. 모두 0이면 균등(1/7). */
export function normalizeWeights(
  priorities: Priorities,
): Record<PriorityKey, number> {
  const sum = PRIORITY_KEYS.reduce((s, k) => s + Math.max(priorities[k] ?? 0, 0), 0);
  const entries = PRIORITY_KEYS.map((k): [PriorityKey, number] => {
    if (sum <= 0) return [k, 1 / PRIORITY_KEYS.length];
    return [k, Math.max(priorities[k] ?? 0, 0) / sum];
  });
  return Object.fromEntries(entries) as Record<PriorityKey, number>;
}

/** 한 단지의 적합도. 점수는 통과/탈락과 무관하게 계산한다. */
export function computeFit(
  conditions: UserConditions,
  priorities: Priorities,
  dealbreakers: Dealbreakers,
  complex: Complex,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): FitResult {
  const failed = evaluateDealbreakers(
    dealbreakers,
    complex,
    config,
    conditions.dealType,
  );
  const raw = computeAxisScores(complex, conditions, config);
  const w = normalizeWeights(priorities);

  // 총점은 반올림 전 원시 점수로 계산
  const total = PRIORITY_KEYS.reduce((s, k) => s + w[k] * raw[k], 0);

  const axisScores = Object.fromEntries(
    PRIORITY_KEYS.map((k): [PriorityKey, number] => [k, Math.round(raw[k])]),
  ) as Record<PriorityKey, number>;

  return {
    complexId: complex.id,
    passesDealbreakers: failed.length === 0,
    failedDealbreakers: failed,
    axisScores,
    totalScore: Math.round(total),
  };
}

/**
 * 랭킹 규칙 (docs/design/domain-model.md §6.4):
 * 1) 절대조건 통과 후보가 먼저  2) 총점 내림차순
 * 3) 탈락 후보  4) 탈락 내부도 총점 내림차순
 */
export function sortByFit(results: FitResult[]): FitResult[] {
  return [...results].sort((x, y) => {
    if (x.passesDealbreakers !== y.passesDealbreakers) {
      return x.passesDealbreakers ? -1 : 1;
    }
    return y.totalScore - x.totalScore;
  });
}
