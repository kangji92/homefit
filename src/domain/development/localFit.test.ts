import { describe, it, expect } from "vitest";
import { computeDevelopmentLocalFit } from "./localFit";
import type { DevelopmentArea } from "./types";
import type { Priorities } from "../types";

const EVEN: Priorities = { price: 1, commute: 1, education: 1, newness: 1, infrastructure: 1, environment: 1, futurePotential: 1 };
const base: Omit<DevelopmentArea, "localMetrics"> = {
  id: "d", name: "구역", developmentType: "redevelopment", stage: "in_progress", certainty: "confirmed",
  geometry: { kind: "point", at: { lat: 37.4, lng: 126.9 } },
};

describe("computeDevelopmentLocalFit", () => {
  it("localMetrics 없으면 미산출(undefined) — 정보만", () => {
    expect(computeDevelopmentLocalFit(EVEN, base as DevelopmentArea)).toBeUndefined();
  });

  it("지역 축(교육·교통·인프라·환경)만 가중평균한다", () => {
    const area = { ...base, localMetrics: { education: 80, transit: 60, infrastructure: 70, environment: 90 } } as DevelopmentArea;
    const fit = computeDevelopmentLocalFit(EVEN, area);
    // 균등 가중 → (80+60+70+90)/4 = 75
    expect(fit?.totalScore).toBe(75);
    expect(fit?.axisScores.education).toBe(80);
  });

  it("우선순위 가중을 반영한다(교육 몰빵 → 교육 점수에 수렴)", () => {
    const area = { ...base, localMetrics: { education: 90, transit: 10, infrastructure: 10, environment: 10 } } as DevelopmentArea;
    const only = { ...EVEN, price: 0, commute: 0, education: 5, newness: 0, infrastructure: 0, environment: 0, futurePotential: 0 };
    expect(computeDevelopmentLocalFit(only, area)?.totalScore).toBe(90);
  });

  it("price/newness/futurePotential은 지역 축이 아니라 무시된다(개발 성과 미반영)", () => {
    const area = { ...base, localMetrics: { education: 50, transit: 50, infrastructure: 50, environment: 50 } } as DevelopmentArea;
    const priceHeavy = { ...EVEN, price: 100, futurePotential: 100 };
    // price/futurePotential 가중이 커도 지역 축만 보므로 50 유지
    expect(computeDevelopmentLocalFit(priceHeavy, area)?.totalScore).toBe(50);
  });
});
