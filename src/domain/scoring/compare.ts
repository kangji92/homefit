// VS 비교 (docs/design/domain-model.md §7, scoring.md §6).

import { PRIORITY_KEYS, type Comparison, type FitResult, type PriorityKey, type Winner } from "../types";

function decideWinner(av: number, bv: number, tieThreshold: number): Winner {
  const diff = av - bv;
  if (Math.abs(diff) <= tieThreshold) return "tie";
  return diff > 0 ? "a" : "b";
}

/** 두 적합도 결과를 축별·총점으로 비교한다. */
export function compareFit(
  a: FitResult,
  b: FitResult,
  tieThreshold = 2,
): Comparison {
  const perAxisWinner = Object.fromEntries(
    PRIORITY_KEYS.map((k): [PriorityKey, Winner] => [
      k,
      decideWinner(a.axisScores[k], b.axisScores[k], tieThreshold),
    ]),
  ) as Record<PriorityKey, Winner>;

  return {
    a,
    b,
    perAxisWinner,
    overallWinner: decideWinner(a.totalScore, b.totalScore, tieThreshold),
    tieThreshold,
  };
}
