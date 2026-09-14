import { describe, it, expect } from "vitest";
import type { Money } from "@/domain/types";
import {
  computeRedevelopmentCost,
  isRateSuspiciouslyHigh,
  isValidRate,
  percentToRate,
  rateToPercent,
  sourced,
  unwrap,
  type RedevelopmentCostInputs,
} from "./redevelopmentCost";

const won = (manwon: number): Money => ({ manwon, valueProvenance: "sourced" });
// 기준 시나리오(mock): 매수 9억, 비교 6억, 종전 6억, 비례율 100%, 조합원분양 10억
const base: RedevelopmentCostInputs = {
  purchasePrice: sourced(won(90000), "mock"),
  comparisonPropertyValue: sourced(won(60000), "user_input"),
  previousAssetAppraisal: sourced(won(60000), "mock"),
  proportionalRate: sourced(1.0, "mock"),
  memberSalePrice: sourced(won(100000), "mock"),
};

describe("비례율 단위 변환/검증", () => {
  it("% ↔ 1.0 변환", () => {
    expect(percentToRate(90)).toBeCloseTo(0.9);
    expect(percentToRate(100)).toBe(1.0);
    expect(percentToRate(105)).toBeCloseTo(1.05);
    expect(rateToPercent(1.0)).toBe(100);
  });
  it("0 이하 무효, 과도하게 높으면 경고", () => {
    expect(isValidRate(0)).toBe(false);
    expect(isValidRate(-0.5)).toBe(false);
    expect(isValidRate(0.9)).toBe(true);
    expect(isRateSuspiciouslyHigh(2.5)).toBe(true);
    expect(isRateSuspiciouslyHigh(1.1)).toBe(false);
  });
});

describe("computeRedevelopmentCost — 개념 분리", () => {
  it("시장 프리미엄 ≠ 권리가액 ≠ 추가분담금 (기준 시나리오)", () => {
    const e = computeRedevelopmentCost(base);
    expect(e.marketPremium?.manwon).toBe(30000); // 9억 − 6억
    expect(e.marketPremiumRate).toBeCloseTo(0.5);
    expect(e.estimatedRightValue?.manwon).toBe(60000); // 6억 × 1.0
    expect(e.estimatedAdditionalContribution?.manwon).toBe(40000); // 10억 − 6억
    expect(e.contributionBalance).toBe("additional_payment");
    expect(e.estimatedBaseTotalCost?.manwon).toBe(130000); // 9억 + 4억
    expect(e.estimatedAllInCost?.manwon).toBe(130000); // 부대비용 없음 → 기본과 동일
  });

  it("보수적(90%)·낙관적(110%) 비례율에 따라 달라진다", () => {
    const con = computeRedevelopmentCost({ ...base, proportionalRate: sourced(0.9, "mock") });
    expect(con.estimatedRightValue?.manwon).toBe(54000);
    expect(con.estimatedAdditionalContribution?.manwon).toBe(46000);
    expect(con.estimatedBaseTotalCost?.manwon).toBe(136000); // 13.6억
    const opt = computeRedevelopmentCost({ ...base, proportionalRate: sourced(1.1, "mock") });
    expect(opt.estimatedBaseTotalCost?.manwon).toBe(124000); // 12.4억
  });

  it("권리가액 > 조합원분양가면 음수(surplus) — clamp 안 함, 환급 단정 안 함", () => {
    const e = computeRedevelopmentCost({ ...base, memberSalePrice: sourced(won(50000), "mock") });
    expect(e.estimatedAdditionalContribution?.manwon).toBe(-10000);
    expect(e.contributionBalance).toBe("surplus");
    expect(e.estimatedBaseTotalCost?.manwon).toBe(80000); // 9억 − 1억
  });

  it("전체 총투입액 = 기본 + 부대비용(있는 항목만)", () => {
    const e = computeRedevelopmentCost({
      ...base,
      additionalCosts: { acquisitionTax: sourced(won(3000), "estimated"), brokerageFee: sourced(won(800), "broker") },
    });
    expect(e.additionalCostsTotal?.manwon).toBe(3800);
    expect(e.estimatedAllInCost?.manwon).toBe(133800); // 13억 + 3800
  });

  it("입력 누락 시 해당 출력만 undefined (부분 계산)", () => {
    const e = computeRedevelopmentCost({ purchasePrice: sourced(won(90000), "mock") });
    expect(e.estimatedRightValue).toBeUndefined();
    expect(e.estimatedAdditionalContribution).toBeUndefined();
    expect(e.estimatedBaseTotalCost).toBeUndefined();
  });

  it("비교기준가 0이면 프리미엄 rate div-by-zero 가드", () => {
    const e = computeRedevelopmentCost({ ...base, comparisonPropertyValue: sourced(won(0), "user_input") });
    expect(e.marketPremiumRate).toBeUndefined();
  });

  it("비례율 0 이하는 권리가액 미산출", () => {
    const e = computeRedevelopmentCost({ ...base, proportionalRate: sourced(0, "user_input") });
    expect(e.estimatedRightValue).toBeUndefined();
  });
});

describe("sourced/unwrap", () => {
  it("값과 출처 유지, unwrap은 값만", () => {
    const s = sourced(won(1000), "association", { sourceLabel: "조합 공고" });
    expect(s.sourceType).toBe("association");
    expect(unwrap(s)?.manwon).toBe(1000);
    expect(unwrap(undefined)).toBeUndefined();
  });
});
