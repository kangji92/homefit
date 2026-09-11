// 시간축 파생 (순수). 예측이 아니라 "언제쯤"의 구간화.
// (docs/design/housing-strategy.md §5)

import type { Horizon } from "../types";

export function horizonForYear(
  targetYear: number | undefined,
  currentYear: number,
): Horizon {
  if (targetYear === undefined) return "mid"; // 미상 → 중간 구간(보수)
  const d = targetYear - currentYear;
  if (d <= 0) return "now";
  if (d <= 2) return "short";
  if (d <= 4) return "mid";
  return "long";
}
