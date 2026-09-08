import { describe, it, expect } from "vitest";
import { makeComplex } from "./__fixtures__";
import { evaluateDealbreakers } from "./dealbreakers";
import { DEFAULT_SCORING_CONFIG } from "./scoring/config";
import type { Dealbreakers, DealType, Home } from "./types";

const cfg = DEFAULT_SCORING_CONFIG; // currentYear 2026

// failed 배열만 편하게 뽑는 헬퍼
const failed = (d: Dealbreakers, home: Home, dealType?: DealType) =>
  evaluateDealbreakers(d, home, cfg, dealType).failed;

describe("evaluateDealbreakers", () => {
  it("조건이 없으면 통과(빈 배열)", () => {
    const r = evaluateDealbreakers({}, makeComplex(), cfg);
    expect(r.failed).toEqual([]);
    expect(r.unknown).toEqual([]);
  });

  it("maxPrice: 활성 거래유형 대표가가 초과하면 탈락", () => {
    const c = makeComplex({ price: { sale: { representative: 90000 } } });
    expect(failed({ maxPrice: 80000 }, c)).toContain("maxPrice");
    expect(failed({ maxPrice: 90000 }, c)).toEqual([]);
  });

  it("maxPrice: 해당 거래유형 매물이 없으면 판정 제외(탈락 아님)", () => {
    const c = makeComplex({ price: { sale: { representative: 90000 } } });
    expect(failed({ maxPrice: 10000 }, c, "jeonse")).toEqual([]);
  });

  it("minSizePyeong: 해당 이상 평형이 하나도 없으면 탈락", () => {
    const c = makeComplex({ sizesPyeong: [18, 24] });
    expect(failed({ minSizePyeong: 30 }, c)).toContain("minSizePyeong");
    expect(failed({ minSizePyeong: 24 }, c)).toEqual([]);
  });

  it("maxStationDistanceM: 초과하면 탈락", () => {
    const c = makeComplex({ stationDistanceM: 800 });
    expect(failed({ maxStationDistanceM: 500 }, c)).toContain("maxStationDistanceM");
  });

  it("maxBuildingAgeYears: 연식 초과하면 탈락", () => {
    const c = makeComplex({ completionYear: 2000 }); // age 26
    expect(failed({ maxBuildingAgeYears: 20 }, c)).toContain("maxBuildingAgeYears");
    expect(failed({ maxBuildingAgeYears: 26 }, c)).toEqual([]);
  });

  it("minHouseholds: 미만이면 탈락", () => {
    const c = makeComplex({ households: 300 });
    expect(failed({ minHouseholds: 500 }, c)).toContain("minHouseholds");
  });

  it("requireSchoolNearby: schoolNearby가 true가 아니면 탈락", () => {
    expect(
      failed({ requireSchoolNearby: true }, makeComplex({ schoolNearby: false })),
    ).toContain("requireSchoolNearby");
    expect(
      failed({ requireSchoolNearby: true }, makeComplex({ schoolNearby: true })),
    ).toEqual([]);
  });

  it("여러 조건이 동시에 실패하면 모두 담는다", () => {
    const c = makeComplex({
      price: { sale: { representative: 99999 } },
      households: 100,
    });
    expect(failed({ maxPrice: 80000, minHouseholds: 500 }, c)).toEqual(
      expect.arrayContaining(["maxPrice", "minHouseholds"]),
    );
  });

  it("presale의 미확정 값은 fail이 아니라 unknown", () => {
    const presale: Home = {
      kind: "presale",
      id: "p1",
      name: "분양단지",
      regionId: "r1",
      price: { sale: { representative: 84000 } },
      sizesPyeong: [25, 34],
      commuteMinutes: { a: 30, b: 40 },
      metrics: { education: 70, infrastructure: 70, environment: 70, futurePotential: 70 },
      moveInYear: 2028,
      // households·stationDistanceM 미확정(undefined)
    };
    const r = evaluateDealbreakers(
      { maxStationDistanceM: 500, minHouseholds: 1000, maxPrice: 80000 },
      presale,
      cfg,
    );
    expect(r.unknown).toEqual(
      expect.arrayContaining(["maxStationDistanceM", "minHouseholds"]),
    );
    expect(r.failed).toContain("maxPrice"); // 확정된 분양가는 fail
    expect(r.failed).not.toContain("maxStationDistanceM");
  });
});
