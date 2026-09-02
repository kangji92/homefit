import { describe, it, expect } from "vitest";
import { makeComplex, makeConditions } from "../__fixtures__";
import { DEFAULT_SCORING_CONFIG } from "./config";
import {
  clamp,
  commuteScore,
  newnessScore,
  priceScore,
} from "./normalize";

const cfg = DEFAULT_SCORING_CONFIG;

describe("clamp", () => {
  it("0~100으로 제한한다", () => {
    expect(clamp(-10)).toBe(0);
    expect(clamp(150)).toBe(100);
    expect(clamp(42)).toBe(42);
  });
});

describe("priceScore", () => {
  // 기본: dealType "sale", maxSalePrice 100000, availableFunds 50000
  const conditions = makeConditions();
  const sale = (rep: number) => makeComplex({ price: { sale: { representative: rep } } });

  it("예산의 floor(50%) 이하 + 자금 전액 커버면 100", () => {
    // price 50000, funds 50000 → coverage 1 → 100
    expect(priceScore(sale(50000), conditions, cfg)).toBe(100);
  });
  it("예산 이상이면 자금과 무관하게 0", () => {
    expect(priceScore(sale(100000), conditions, cfg)).toBe(0);
    expect(priceScore(sale(120000), conditions, cfg)).toBe(0);
  });
  it("중간값은 여유도×커버율 보정 (80000 → 35.5)", () => {
    // headroom 40, coverage min(50000/80000,1)=0.625 → 40*(0.7+0.3*0.625)=35.5
    expect(priceScore(sale(80000), conditions, cfg)).toBeCloseTo(35.5, 5);
  });
  it("보유 자금이 적으면 커버율이 낮아 감산된다", () => {
    // funds 20000, price 80000 → coverage 0.25 → 40*(0.7+0.3*0.25)=31
    const poor = makeConditions({ availableFunds: 20000 });
    expect(priceScore(sale(80000), poor, cfg)).toBeCloseTo(31, 5);
  });
  it("전세 선택 시 전세 밴드/예산을 사용한다", () => {
    const jeonse = makeConditions({ dealType: "jeonse", availableFunds: 60000 });
    // maxJeonseDeposit 60000, floor 30000, price 45000 → headroom 50, coverage 1 → 50
    const c = makeComplex({ price: { jeonse: { representative: 45000 } } });
    expect(priceScore(c, jeonse, cfg)).toBeCloseTo(50, 5);
  });
  it("해당 거래유형 매물이 없으면 0", () => {
    const jeonse = makeConditions({ dealType: "jeonse" });
    const saleOnly = makeComplex({ price: { sale: { representative: 50000 } } });
    expect(priceScore(saleOnly, jeonse, cfg)).toBe(0);
  });
});

describe("commuteScore", () => {
  const conditions = makeConditions({ maxCommuteMinutes: 45 });
  const withCommute = (worst: number) =>
    makeComplex({ commuteMinutes: { a: 10, b: worst } });

  it("허용시간의 50% 이하면 100", () => {
    expect(commuteScore(withCommute(20), conditions, cfg)).toBe(100);
  });
  it("허용시간 정확히에서는 commuteScoreAtLimit(60)", () => {
    expect(commuteScore(withCommute(45), conditions, cfg)).toBeCloseTo(60, 5);
  });
  it("허용시간 2배(cap)에서는 0", () => {
    expect(commuteScore(withCommute(90), conditions, cfg)).toBe(0);
    expect(commuteScore(withCommute(200), conditions, cfg)).toBe(0);
  });
  it("허용시간 안(40분)은 넉넉히 높다 (≈68.9)", () => {
    expect(commuteScore(withCommute(40), conditions, cfg)).toBeCloseTo(68.889, 2);
  });
  it("가장 긴 통근을 기준으로 한다", () => {
    const c = makeComplex({ commuteMinutes: { a: 20, b: 45 } });
    expect(commuteScore(c, conditions, cfg)).toBeCloseTo(60, 5);
  });
  it("통근 데이터가 없는 직장이 있으면 0", () => {
    const c = makeComplex({ commuteMinutes: { a: 20 } }); // b 없음
    expect(commuteScore(c, conditions, cfg)).toBe(0);
  });
});

describe("newnessScore", () => {
  it("신축(age 0)이면 100", () => {
    expect(newnessScore(makeComplex({ completionYear: 2026 }), cfg)).toBe(100);
  });
  it("준공 예정(미래 연도)도 100으로 clamp", () => {
    expect(newnessScore(makeComplex({ completionYear: 2030 }), cfg)).toBe(100);
  });
  it("30년 이상이면 0", () => {
    expect(newnessScore(makeComplex({ completionYear: 1996 }), cfg)).toBe(0);
    expect(newnessScore(makeComplex({ completionYear: 1980 }), cfg)).toBe(0);
  });
  it("age 8년 → ≈73.3", () => {
    expect(newnessScore(makeComplex({ completionYear: 2018 }), cfg)).toBeCloseTo(
      73.333,
      2,
    );
  });
});
