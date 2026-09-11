// 전략 생성·판정의 임계값. mock 데이터 특성 때문에 생기는 값은 여기 상수로 분리하고
// 근거를 남긴다(테스트에서 참조). (docs/design/housing-strategy.md §16)

export interface StrategyConfig {
  /** kind별 생성 상한 — 전략 과다(노이즈) 방지 */
  maxPerKind: number;
  /**
   * recommended로 올리는 최소 HomeFit. 보수적으로 높게.
   * ⚠️ 영구 제품 기준이 아니라 **현재 MVP calibration 값**이다.
   * 근거: mock 정성지표(교육/인프라/환경) 기본 ~60대라, 가격·통근이 실데이터로
   * 좋을 때 총점이 이 선을 넘는다. scoring.md 워크드 예시(총점 60대)보다 위 →
   * "명확히 잘 맞음"만 recommended. 실데이터 분포가 쌓이면 재보정한다.
   */
  recommendFitMin: number;
  /** 청약 계약금 추정 비율(분양가 대비). 통상 10%. */
  presaleDownPaymentRatio: number;
}

export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = {
  maxPerKind: 4,
  recommendFitMin: 78,
  presaleDownPaymentRatio: 0.1,
};
