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
  it("대응 불가 축(price/newness/supply)은 제외, 반영 축만 재정규화", () => {
    const priorities: Priorities = {
      price: 90, commute: 90, newness: 80, education: 70,
      infrastructure: 70, environment: 50, futurePotential: 80,
    };
    const r = computeAreaFit(priorities, area);

    // 반영 축: plannedInfra/environment/futurePotential/transitPlan(←commute)
    expect(Object.keys(r.axisScores).sort()).toEqual([
      "environment",
      "futurePotential",
      "plannedInfra",
      "transitPlan",
    ]);
    // 합 290: 70*80 + 50*60 + 80*85 + 90*90 = 23500 → /290 = 81.03
    expect(r.totalScore).toBe(81);
  });

  it("반영 축 가중치가 모두 0이면 균등 평균", () => {
    const zero: Priorities = {
      price: 0, commute: 0, newness: 0, education: 0,
      infrastructure: 0, environment: 0, futurePotential: 0,
    };
    // (80+60+85+90)/4 = 78.75 → 79
    expect(computeAreaFit(zero, area).totalScore).toBe(79);
  });

  it("결정적 — 같은 입력은 같은 출력", () => {
    const p: Priorities = {
      price: 10, commute: 20, newness: 30, education: 40,
      infrastructure: 50, environment: 60, futurePotential: 70,
    };
    expect(computeAreaFit(p, area)).toEqual(computeAreaFit(p, area));
  });
});
