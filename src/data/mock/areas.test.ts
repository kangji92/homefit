import { describe, it, expect } from "vitest";
import { MOCK_AREAS, supplyScore } from "./areas";

describe("supplyScore", () => {
  it("계획 세대수가 클수록 공급 점수가 높다", () => {
    expect(supplyScore(80000)).toBeGreaterThan(supplyScore(18000));
  });
  it("35~98 범위로 clamp된다", () => {
    expect(supplyScore(0)).toBeGreaterThanOrEqual(35);
    expect(supplyScore(1_000_000)).toBeLessThanOrEqual(98);
  });
  it("공식대로 산정한다(왕숙 8만≈96)", () => {
    expect(supplyScore(80000)).toBe(96);
  });
});

describe("MOCK_AREAS", () => {
  it("supply는 plannedHouseholds에서 결정적으로 산정된다", () => {
    for (const a of MOCK_AREAS) {
      if (a.plannedHouseholds) {
        expect(a.areaMetrics.supply).toBe(supplyScore(a.plannedHouseholds));
      }
    }
  });
  it("모든 개발예정지에 근거(metricsBasis)가 있다", () => {
    expect(MOCK_AREAS.every((a) => (a.metricsBasis?.length ?? 0) > 0)).toBe(true);
  });
});
