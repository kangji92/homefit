// 정비사업 구역 목록 표시 정렬(순수). 점수/순위가 아니라 **진행 상태 정렬**일 뿐 —
// 확정성 높고 단계 진행된 사업을 위로. fitScore와 무관(판단 보조 레이어).
import type { DevelopmentArea, DevelopmentCertainty, DevelopmentStage } from "./types";

const STAGE_RANK: Record<DevelopmentStage, number> = {
  proposed: 0,
  planned: 1,
  approved: 2,
  in_progress: 3,
  completed: 4,
};
const CERTAINTY_RANK: Record<DevelopmentCertainty, number> = {
  confirmed: 0,
  likely: 1,
  uncertain: 2,
};

/** 확정성(confirmed 먼저) → 단계 진행(진행/완료 먼저) → 이름순. 원본 배열은 건드리지 않는다. */
export function sortDevelopmentsByProgress(areas: DevelopmentArea[]): DevelopmentArea[] {
  return [...areas].sort(
    (a, b) =>
      CERTAINTY_RANK[a.certainty] - CERTAINTY_RANK[b.certainty] ||
      STAGE_RANK[b.stage] - STAGE_RANK[a.stage] ||
      a.name.localeCompare(b.name, "ko"),
  );
}
