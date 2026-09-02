import { describe, it, expect } from "vitest";
import {
  makeComplex,
  makeConditions,
  WORKED_PRIORITIES,
} from "../__fixtures__";
import type { Dealbreakers, FitResult, Priorities } from "../types";
import { computeFit, normalizeWeights, sortByFit } from "./fit";

const NO_DEALBREAKERS: Dealbreakers = {};

describe("normalizeWeights", () => {
  it("합=1로 정규화한다", () => {
    const w = normalizeWeights(WORKED_PRIORITIES);
    const sum = Object.values(w).reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(1, 6);
    expect(w.price).toBeCloseTo(0.3, 6);
  });
  it("모두 0이면 균등(1/7)으로 폴백", () => {
    const zero = Object.fromEntries(
      Object.keys(WORKED_PRIORITIES).map((k) => [k, 0]),
    ) as Priorities;
    const w = normalizeWeights(zero);
    for (const v of Object.values(w)) expect(v).toBeCloseTo(1 / 7, 6);
  });
});

describe("computeFit — 워크드 예시 (scoring.md §7)", () => {
  const result = computeFit(
    makeConditions(),
    WORKED_PRIORITIES,
    NO_DEALBREAKERS,
    makeComplex(),
  );

  it("총점은 61", () => {
    expect(result.totalScore).toBe(61);
  });

  it("축별 점수가 기대값과 일치한다", () => {
    expect(result.axisScores).toEqual({
      price: 36,
      commute: 69,
      newness: 73,
      education: 80,
      infrastructure: 70,
      environment: 65,
      futurePotential: 60,
    });
  });

  it("절대조건이 없으면 통과", () => {
    expect(result.passesDealbreakers).toBe(true);
    expect(result.failedDealbreakers).toEqual([]);
  });
});

describe("computeFit — 절대조건 탈락", () => {
  it("탈락해도 점수는 계산하고 사유를 담는다", () => {
    const result = computeFit(
      makeConditions(),
      WORKED_PRIORITIES,
      { maxPrice: 70000 }, // 80000 > 70000 → 탈락
      makeComplex(),
    );
    expect(result.passesDealbreakers).toBe(false);
    expect(result.failedDealbreakers).toContain("maxPrice");
    expect(result.totalScore).toBe(61); // 점수는 그대로
  });
});

describe("sortByFit", () => {
  const fit = (
    complexId: string,
    totalScore: number,
    passesDealbreakers: boolean,
  ): FitResult => ({
    complexId,
    passesDealbreakers,
    failedDealbreakers: passesDealbreakers ? [] : ["maxPrice"],
    unknownDealbreakers: [],
    axisScores: {
      price: 0,
      commute: 0,
      education: 0,
      newness: 0,
      infrastructure: 0,
      environment: 0,
      futurePotential: 0,
    },
    totalScore,
  });

  it("통과 후보가 탈락 후보보다 항상 위 (94점 탈락 후보가 1위로 뜨지 않음)", () => {
    const sorted = sortByFit([
      fit("failing-high", 94, false),
      fit("passing-low", 50, true),
    ]);
    expect(sorted.map((r) => r.complexId)).toEqual([
      "passing-low",
      "failing-high",
    ]);
  });

  it("같은 그룹 안에서는 총점 내림차순", () => {
    const sorted = sortByFit([
      fit("p1", 60, true),
      fit("p2", 80, true),
      fit("f1", 30, false),
      fit("f2", 70, false),
    ]);
    expect(sorted.map((r) => r.complexId)).toEqual(["p2", "p1", "f2", "f1"]);
  });

  it("원본 배열을 변형하지 않는다", () => {
    const input = [fit("a", 10, true), fit("b", 20, true)];
    sortByFit(input);
    expect(input.map((r) => r.complexId)).toEqual(["a", "b"]);
  });
});
