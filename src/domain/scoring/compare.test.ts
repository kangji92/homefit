import { describe, it, expect } from "vitest";
import type { FitResult, PriorityKey } from "../types";
import { compareFit } from "./compare";

const axes = (
  overrides: Partial<Record<PriorityKey, number>> = {},
): Record<PriorityKey, number> => ({
  price: 50,
  commute: 50,
  education: 50,
  newness: 50,
  infrastructure: 50,
  environment: 50,
  futurePotential: 50,
  ...overrides,
});

const fit = (
  complexId: string,
  totalScore: number,
  axisScores = axes(),
): FitResult => ({
  complexId,
  passesDealbreakers: true,
  failedDealbreakers: [],
  unknownDealbreakers: [],
  axisScores,
  totalScore,
});

describe("compareFit", () => {
  it("총점 차이가 tieThreshold보다 크면 우세 후보 결정", () => {
    const c = compareFit(fit("a", 70), fit("b", 60));
    expect(c.overallWinner).toBe("a");
  });

  it("총점 차이가 tieThreshold 이하면 tie", () => {
    const c = compareFit(fit("a", 61), fit("b", 60)); // 차이 1 <= 2
    expect(c.overallWinner).toBe("tie");
  });

  it("항목별로 우세를 판정한다", () => {
    const a = fit("a", 60, axes({ price: 90, commute: 40 }));
    const b = fit("b", 60, axes({ price: 50, commute: 80 }));
    const c = compareFit(a, b);
    expect(c.perAxisWinner.price).toBe("a"); // 90 vs 50
    expect(c.perAxisWinner.commute).toBe("b"); // 40 vs 80
    expect(c.perAxisWinner.education).toBe("tie"); // 50 vs 50
  });
});
