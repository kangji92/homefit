// AreaFit — 개발 예정지(area) 적합도 (docs/design/domain-model-v2.md §3.2).
//
// 원칙:
// - HomeFit 7축을 1:1 매핑하지 않는다. Area에서 대응 가능한 축만 사용하고,
//   측정 불가능한 축(price/commute/newness 등)은 0점이 아니라 "제외" 후
//   남은 축만 재정규화한다.
// - HomeFit 점수와 직접 대소 비교하지 않는다(성격이 다른 척도).
// - 결정적. 축 정의·정규화·결정성까지만 확정하고, 가중·결합 공식 튜닝은
//   실제 3기신도시 데이터를 넣어본 뒤 조정한다(TODO).

import type { Area, AreaFitResult, Priorities, PriorityKey } from "../types";
import { clamp } from "./normalize";

/** Home 우선순위 → Area 지표 매핑. 여기 없는 축은 계산에서 제외된다. */
const AREA_AXIS_FROM_PRIORITY: Partial<
  Record<PriorityKey, keyof Area["areaMetrics"]>
> = {
  infrastructure: "plannedInfra",
  environment: "environment",
  futurePotential: "futurePotential",
  // TODO(2B, 실데이터 후): commute→transitPlan, education, supply 반영 검토
};

const MAPPED_KEYS = Object.keys(AREA_AXIS_FROM_PRIORITY) as PriorityKey[];

export function computeAreaFit(
  priorities: Priorities,
  area: Area,
): AreaFitResult {
  const entries = MAPPED_KEYS.map((pk) => {
    const metricKey = AREA_AXIS_FROM_PRIORITY[pk]!;
    return {
      metricKey,
      score: clamp(area.areaMetrics[metricKey]),
      weight: Math.max(priorities[pk] ?? 0, 0),
    };
  });

  // 제외 후 재정규화: 반영 축의 가중치 합으로 나눈다. 합이 0이면 균등.
  const wSum = entries.reduce((s, e) => s + e.weight, 0);
  const total = entries.reduce((s, e) => {
    const w = wSum > 0 ? e.weight / wSum : 1 / entries.length;
    return s + w * e.score;
  }, 0);

  const axisScores = Object.fromEntries(
    entries.map((e) => [e.metricKey, Math.round(e.score)]),
  ) as AreaFitResult["axisScores"];

  return { areaId: area.id, axisScores, totalScore: Math.round(total) };
}
