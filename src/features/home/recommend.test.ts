import { describe, it, expect } from "vitest";
import { makeComplex, makeConditions, WORKED_PRIORITIES } from "@/domain/__fixtures__";
import type { Complex, Dealbreakers } from "@/domain/types";
import { isConditionsReady, recommendComplexes, topAxes } from "./recommend";

const conditions = makeConditions();
const highMetrics = {
  education: 95,
  infrastructure: 95,
  environment: 95,
  futurePotential: 95,
};
const lowMetrics = {
  education: 30,
  infrastructure: 30,
  environment: 30,
  futurePotential: 30,
};

const passHigh: Complex = makeComplex({
  id: "pass-high",
  price: { sale: { representative: 60000 } },
  metrics: highMetrics,
});
const passLow: Complex = makeComplex({
  id: "pass-low",
  price: { sale: { representative: 80000 } },
  metrics: lowMetrics,
});
const failHigh: Complex = makeComplex({
  id: "fail-high",
  price: { sale: { representative: 99000 } },
  metrics: highMetrics,
});

const dealbreakers: Dealbreakers = { maxPrice: 85000 }; // fail-high(99000) 탈락

describe("recommendComplexes", () => {
  it("통과 후보가 탈락 후보보다 먼저, 통과 그룹은 총점 내림차순", () => {
    const recs = recommendComplexes(
      [failHigh, passLow, passHigh],
      conditions,
      WORKED_PRIORITIES,
      dealbreakers,
    );
    expect(recs.map((r) => r.complex.id)).toEqual([
      "pass-high",
      "pass-low",
      "fail-high",
    ]);
    expect(recs[0].fit.passesDealbreakers).toBe(true);
    expect(recs[2].fit.passesDealbreakers).toBe(false);
  });

  it("상위 N개로 제한한다", () => {
    const recs = recommendComplexes(
      [failHigh, passLow, passHigh],
      conditions,
      WORKED_PRIORITIES,
      dealbreakers,
      2,
    );
    expect(recs).toHaveLength(2);
    expect(recs.map((r) => r.complex.id)).toEqual(["pass-high", "pass-low"]);
  });

  it("빈 목록이면 빈 배열", () => {
    expect(
      recommendComplexes([], conditions, WORKED_PRIORITIES, {}),
    ).toEqual([]);
  });
});

describe("isConditionsReady", () => {
  it("필수 조건이 채워지면 true", () => {
    expect(isConditionsReady(conditions)).toBe(true);
  });
  it("예산이 0이면 false", () => {
    expect(isConditionsReady({ ...conditions, maxSalePrice: 0 })).toBe(false);
  });
  it("직장 id가 비면 false", () => {
    expect(
      isConditionsReady({
        ...conditions,
        workplaces: [
          { id: "", label: "", lat: 0, lng: 0, transport: "transit" },
          conditions.workplaces[1],
        ],
      }),
    ).toBe(false);
  });
});

describe("topAxes", () => {
  it("점수 내림차순으로 n개를 반환한다", () => {
    const [rec] = recommendComplexes([passHigh], conditions, WORKED_PRIORITIES, {});
    const axes = topAxes(rec.fit, 3);
    expect(axes).toHaveLength(3);
    expect(axes[0].score).toBeGreaterThanOrEqual(axes[1].score);
    expect(axes[1].score).toBeGreaterThanOrEqual(axes[2].score);
  });
});
