// 정비사업/개발 구역의 **지역 적합도**(위치·교통·학군·인프라·환경) — 결정적.
// 개발 성과(세대·분양가·완성 후 가치)는 **절대 반영하지 않는다**. localMetrics 없으면 미산출.
// (docs/design/development-catalyst.md §3)

import type { DevelopmentArea, DevelopmentLocalMetrics } from "./types";
import type { Priorities, PriorityKey } from "../types";

// 우선순위 → 지역 축 매핑. price/newness/futurePotential은 지역 축이 아니라 제외
// (가격·연식·미래잠재력은 확인 가능한 현재 지역 특성이 아님).
const LOCAL_AXIS_FROM_PRIORITY: Partial<Record<PriorityKey, keyof DevelopmentLocalMetrics>> = {
  education: "education",
  commute: "transit",
  infrastructure: "infrastructure",
  environment: "environment",
};
const MAPPED = Object.keys(LOCAL_AXIS_FROM_PRIORITY) as PriorityKey[];
const clamp = (n: number) => Math.min(100, Math.max(0, n));

export interface DevelopmentLocalFit {
  developmentId: string;
  /** 반영된 지역 축 점수(표시용). */
  axisScores: Partial<Record<keyof DevelopmentLocalMetrics, number>>;
  /** 0~100. 개발 성과 아님 — 지역 축(위치·교통·학군) 기준. */
  totalScore: number;
}

/** localMetrics가 있을 때만 지역 적합도 산출(우선순위 가중·재정규화). 없으면 undefined(정보만). */
export function computeDevelopmentLocalFit(
  priorities: Priorities,
  area: DevelopmentArea,
): DevelopmentLocalFit | undefined {
  const m = area.localMetrics;
  if (!m) return undefined;

  const entries = MAPPED.map((pk) => {
    const axis = LOCAL_AXIS_FROM_PRIORITY[pk]!;
    return { axis, score: clamp(m[axis]), weight: Math.max(priorities[pk] ?? 0, 0) };
  });
  const wSum = entries.reduce((s, e) => s + e.weight, 0);
  const total = entries.reduce((s, e) => {
    const w = wSum > 0 ? e.weight / wSum : 1 / entries.length;
    return s + w * e.score;
  }, 0);

  const axisScores = Object.fromEntries(entries.map((e) => [e.axis, Math.round(e.score)]));
  return { developmentId: area.id, axisScores, totalScore: Math.round(total) };
}
