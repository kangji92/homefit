import { describe, it, expect } from "vitest";
import { computeAreaFit } from "./area";
import type { Area, Priorities } from "../types";

const area: Area = {
  kind: "area",
  id: "a1",
  name: "3기신도시",
  regionId: "r1",
  areaMetrics: {
    plannedInfra: 80,
    transitPlan: 90,
    supply: 70,
    futurePotential: 85,
    environment: 60,
  },
};

describe("computeAreaFit", () => {
  it("대응 불가 축(price/commute/newness)은 제외하고 반영 축만 재정규화", () => {
    const priorities: Priorities = {
      price: 90, commute: 90, newness: 80, education: 70,
      infrastructure: 70, environment: 50, futurePotential: 80,
    };
    const r = computeAreaFit(priorities, area);

    // 반영 축은 매핑된 3개뿐 (plannedInfra/environment/futurePotential)
    expect(Object.keys(r.axisScores).sort()).toEqual([
      "environment",
      "futurePotential",
      "plannedInfra",
    ]);
    // 재정규화(합 200): 70/200*80 + 50/200*60 + 80/200*85 = 28+15+34 = 77
    expect(r.totalScore).toBe(77);
  });

  it("반영 축 가중치가 모두 0이면 균등 평균", () => {
    const zero: Priorities = {
      price: 0, commute: 0, newness: 0, education: 0,
      infrastructure: 0, environment: 0, futurePotential: 0,
    };
    // (80+60+85)/3 = 75
    expect(computeAreaFit(zero, area).totalScore).toBe(75);
  });

  it("결정적 — 같은 입력은 같은 출력", () => {
    const p: Priorities = {
      price: 10, commute: 20, newness: 30, education: 40,
      infrastructure: 50, environment: 60, futurePotential: 70,
    };
    expect(computeAreaFit(p, area)).toEqual(computeAreaFit(p, area));
  });
});
