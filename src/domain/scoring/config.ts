// 스코어링 파라미터 (docs/design/scoring.md §1).
// 시간 등 외부 상태는 config로 주입한다 — 결정성 유지(Date.now 직접 호출 금지).

export interface ScoringConfig {
  /** 연식 기준연도 */
  currentYear: number;
  /** 가격 만점 기준 (예산 대비 비율) */
  priceFloorRatio: number;
  /** 가격 점수 중 보유 자금 커버율 반영 비중 (0~1) */
  fundsCoverageWeight: number;
  /** 통근 만점 기준 (허용시간 대비 비율) */
  commuteFullRatio: number;
  /** 허용시간 정확히에서의 통근 점수 */
  commuteScoreAtLimit: number;
  /** 통근 0점 기준 (허용시간 배수) */
  commuteHardCapRatio: number;
  /** 신축 점수가 0이 되는 연식(년) */
  newnessZeroAtYears: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  currentYear: 2026,
  priceFloorRatio: 0.5,
  fundsCoverageWeight: 0.3,
  commuteFullRatio: 0.5,
  commuteScoreAtLimit: 60,
  commuteHardCapRatio: 2,
  newnessZeroAtYears: 30,
};
