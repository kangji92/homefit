// 개발사업 요약 (순수) — 동측/북측 등 여러 사업을 **동일 축으로 나란히 비교**하기 위한
// 대표값 추출. 투자점수/순위로 변환하지 않는다(진행정보 비교일 뿐). 공식 계획(official)
// 우선으로 대표값을 뽑되, 상세 충돌은 planFieldComparison으로 별도 표현.

import type { DevelopmentArea, RedevelopmentStage } from "./types";

export interface DevelopmentSummaryRow {
  areaId: string;
  name: string;
  /** 현재 세부 단계(detailStage). */
  currentPhase?: RedevelopmentStage;
  totalUnits?: number;
  memberCount?: number;
  saleUnits?: number;
  rentalUnits?: number;
  maxFloor?: number;
  /** 다음 목표 milestone(있으면). */
  nextTarget?: { label: string; date?: string };
}

export function developmentSummary(area: DevelopmentArea): DevelopmentSummaryRow {
  const plans = area.plans ?? [];
  const official = plans.find((p) => p.type === "official") ?? plans[0];
  const target = (area.milestones ?? []).find((m) => m.status === "target");
  return {
    areaId: area.id,
    name: area.name,
    currentPhase: area.detailStage,
    totalUnits: official?.totalUnits,
    memberCount: area.facts?.memberCount,
    saleUnits: official?.saleUnits,
    rentalUnits: official?.rentalUnits,
    maxFloor: official?.maxFloor,
    nextTarget: target ? { label: target.label ?? target.kind, date: target.date } : undefined,
  };
}
