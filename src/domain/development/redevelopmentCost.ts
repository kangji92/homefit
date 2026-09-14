// 재개발 비용 시뮬레이션 (순수·결정적). **자동 예측/수익률 판정 없음** — 사용자 입력/mock
// 값으로 계산·시나리오 비교만. 결과는 raw Home에 저장하지 않고 여기서 산출.
// 개념 분리: 시장 프리미엄 ≠ 권리가액 ≠ 추가분담금. (docs/design 개발레이어 cost)

import type { Money, MoneyRange } from "../types";
import type { DataSourceType, Sourced } from "./types";

export function sourced<T>(
  value: T,
  sourceType: DataSourceType,
  opts?: Partial<Omit<Sourced<T>, "value" | "sourceType">>,
): Sourced<T> {
  return { value, sourceType, ...opts };
}
export function unwrap<T>(s?: Sourced<T>): T | undefined {
  return s?.value;
}

// ── 비례율 단위 변환/검증 (도메인 1.0 = 100%, UI는 %) ──
export function percentToRate(percent: number): number {
  return percent / 100;
}
export function rateToPercent(rate: number): number {
  return rate * 100;
}
/** 유효 비례율: 0 초과. (0 이하는 무효) */
export function isValidRate(rate: number): boolean {
  return Number.isFinite(rate) && rate > 0;
}
/** 비정상적으로 높은 비례율(>200%) — 경고용. */
export function isRateSuspiciouslyHigh(rate: number): boolean {
  return rate > 2;
}

/** 추가분담금 부호의 중립적 상태명(환급 단정 아님). */
export type ContributionBalance = "additional_payment" | "surplus";

export interface RedevelopmentCostInputs {
  purchasePrice?: Sourced<Money>;
  /** 시장 프리미엄 기준(≠권리가액) — 최근 실거래/일반 빌라가치 등 사용자 선택. */
  comparisonPropertyValue?: Sourced<Money>;
  previousAssetAppraisal?: Sourced<Money>;
  /** 비례율(1.0 = 100%). */
  proportionalRate?: Sourced<number>;
  memberSalePrice?: Sourced<Money>;
  /** 기본 총투입액과 분리되는 부대비용(전부 optional·가산적). */
  additionalCosts?: {
    acquisitionTax?: Sourced<Money>;
    brokerageFee?: Sourced<Money>;
    financingCost?: Sourced<Money>;
    relocationLoanInterest?: Sourced<Money>;
    optionCost?: Sourced<Money>;
    other?: Sourced<Money>;
  };
}

export interface RedevelopmentCostEstimate {
  marketPremium?: Money;
  marketPremiumRate?: number;
  estimatedRightValue?: Money;
  estimatedAdditionalContribution?: Money; // 음수 허용(권리가액 초과)
  contributionBalance?: ContributionBalance;
  /** 기본 총투입액 = 매수가 + 추가분담금. */
  estimatedBaseTotalCost?: Money;
  /** 부대비용 합계(있는 항목만). */
  additionalCostsTotal?: Money;
  /** 전체 총투입액 = 기본 총투입액 + 부대비용. */
  estimatedAllInCost?: Money;
}

const money = (manwon: number): Money => ({ manwon, valueProvenance: "computed" });

function sumAdditionalCosts(costs?: RedevelopmentCostInputs["additionalCosts"]): number | undefined {
  if (!costs) return undefined;
  const vals = Object.values(costs)
    .map((c) => c?.value?.manwon)
    .filter((v): v is number => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) : undefined;
}

export function computeRedevelopmentCost(inputs: RedevelopmentCostInputs): RedevelopmentCostEstimate {
  const purchase = inputs.purchasePrice?.value?.manwon;
  const comparison = inputs.comparisonPropertyValue?.value?.manwon;
  const appraisal = inputs.previousAssetAppraisal?.value?.manwon;
  const rate = inputs.proportionalRate?.value;
  const memberSale = inputs.memberSalePrice?.value?.manwon;
  const est: RedevelopmentCostEstimate = {};

  // 시장 프리미엄 (≠ 권리가액)
  if (purchase != null && comparison != null) {
    est.marketPremium = money(purchase - comparison);
    if (comparison > 0) est.marketPremiumRate = (purchase - comparison) / comparison;
  }

  // 권리가액 = 종전자산평가액 × 비례율
  let rightValue: number | undefined;
  if (appraisal != null && rate != null && isValidRate(rate)) {
    rightValue = Math.round(appraisal * rate);
    est.estimatedRightValue = money(rightValue);
  }

  // 추가분담금 = 조합원분양가 − 권리가액 (음수 clamp 안 함)
  let contribution: number | undefined;
  if (memberSale != null && rightValue != null) {
    contribution = memberSale - rightValue;
    est.estimatedAdditionalContribution = money(contribution);
    est.contributionBalance = contribution >= 0 ? "additional_payment" : "surplus";
  }

  // 기본 총투입액 = 매수가 + 추가분담금
  if (purchase != null && contribution != null) {
    est.estimatedBaseTotalCost = money(purchase + contribution);
  }

  // 부대비용 합계 + 전체 총투입액
  const addSum = sumAdditionalCosts(inputs.additionalCosts);
  if (addSum != null) est.additionalCostsTotal = money(addSum);
  if (est.estimatedBaseTotalCost) {
    est.estimatedAllInCost = money(est.estimatedBaseTotalCost.manwon + (addSum ?? 0));
  }

  return est;
}

/**
 * 조합원분양가가 범위(min~max)일 때 low/high 두 번 계산 → 결과 범위. 계산 도메인을
 * 복잡하게 만들지 않고 기존 pure 함수를 재사용한다. (docs/design 개발레이어 cost §7)
 */
export interface RedevelopmentCostRange {
  low: RedevelopmentCostEstimate; // memberSale min 기준
  high: RedevelopmentCostEstimate; // memberSale max 기준
}
export function computeRedevelopmentCostRange(
  inputs: RedevelopmentCostInputs,
  memberSale: MoneyRange,
  sourceType: DataSourceType = "broker",
): RedevelopmentCostRange {
  return {
    low: computeRedevelopmentCost({ ...inputs, memberSalePrice: sourced(memberSale.min, sourceType) }),
    high: computeRedevelopmentCost({ ...inputs, memberSalePrice: sourced(memberSale.max, sourceType) }),
  };
}

export interface RedevelopmentScenario {
  id: string;
  label: string;
  inputs: RedevelopmentCostInputs;
  note?: string;
}

export function computeScenarios(
  scenarios: RedevelopmentScenario[],
): { scenario: RedevelopmentScenario; estimate: RedevelopmentCostEstimate }[] {
  return scenarios.map((scenario) => ({ scenario, estimate: computeRedevelopmentCost(scenario.inputs) }));
}
