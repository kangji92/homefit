import { describe, it, expect } from "vitest";
import { WORK_AREA_IDS } from "@/data/workAreas";
import { MOCK_REGIONS } from "@/data/mock/regions";
import { computeAxisScores } from "@/domain/scoring/normalize";
import { DEFAULT_SCORING_CONFIG } from "@/domain/scoring/config";
import type { UserConditions } from "@/domain/types";
import { MOCK_COMPLEXES } from "./complexes";

describe("mock 단지 데이터 무결성", () => {
  it("8~12개 범위의 단지를 제공한다", () => {
    expect(MOCK_COMPLEXES.length).toBeGreaterThanOrEqual(8);
    expect(MOCK_COMPLEXES.length).toBeLessThanOrEqual(12);
  });

  it("모든 단지가 유효한 regionId를 가진다", () => {
    const ids = new Set(MOCK_REGIONS.map((r) => r.id));
    expect(MOCK_COMPLEXES.every((c) => ids.has(c.regionId))).toBe(true);
  });

  it("모든 단지가 7개 WorkArea 전부의 통근시간을 가진다", () => {
    for (const c of MOCK_COMPLEXES) {
      for (const areaId of WORK_AREA_IDS) {
        expect(typeof c.commuteMinutes[areaId]).toBe("number");
      }
    }
  });

  it("실제 조건으로 통근 점수가 계산된다 (Infinity·0 폴백 아님)", () => {
    const conditions: UserConditions = {
      dealType: "sale",
      maxSalePrice: 100000,
      maxJeonseDeposit: 60000,
      availableFunds: 50000,
      workplaces: [
        { id: "gangnam", label: "강남", lat: 0, lng: 0, transport: "transit" },
        { id: "pangyo", label: "판교", lat: 0, lng: 0, transport: "car" },
      ],
      maxCommuteMinutes: 60,
      desiredSize: { min: 25, max: 34 },
      childPlan: "undecided",
      moveInTiming: "flexible",
    };
    const scores = computeAxisScores(
      MOCK_COMPLEXES[0],
      conditions,
      DEFAULT_SCORING_CONFIG,
    );
    expect(scores.commute).toBeGreaterThan(0);
    expect(Number.isFinite(scores.commute)).toBe(true);
  });
});
