import { describe, it, expect } from "vitest";
import { makeComplex } from "./__fixtures__";
import { evaluateDealbreakers } from "./dealbreakers";
import { DEFAULT_SCORING_CONFIG } from "./scoring/config";

const cfg = DEFAULT_SCORING_CONFIG; // currentYear 2026

describe("evaluateDealbreakers", () => {
  it("조건이 없으면 통과(빈 배열)", () => {
    expect(evaluateDealbreakers({}, makeComplex(), cfg)).toEqual([]);
  });

  it("maxPrice: 대표가가 초과하면 탈락", () => {
    const c = makeComplex({ price: { representative: 90000 } });
    expect(evaluateDealbreakers({ maxPrice: 80000 }, c, cfg)).toContain("maxPrice");
    expect(evaluateDealbreakers({ maxPrice: 90000 }, c, cfg)).toEqual([]);
  });

  it("minSizePyeong: 해당 이상 평형이 하나도 없으면 탈락", () => {
    const c = makeComplex({ sizesPyeong: [18, 24] });
    expect(evaluateDealbreakers({ minSizePyeong: 30 }, c, cfg)).toContain(
      "minSizePyeong",
    );
    expect(evaluateDealbreakers({ minSizePyeong: 24 }, c, cfg)).toEqual([]);
  });

  it("maxStationDistanceM: 초과하면 탈락", () => {
    const c = makeComplex({ stationDistanceM: 800 });
    expect(evaluateDealbreakers({ maxStationDistanceM: 500 }, c, cfg)).toContain(
      "maxStationDistanceM",
    );
  });

  it("maxBuildingAgeYears: 연식 초과하면 탈락", () => {
    const c = makeComplex({ completionYear: 2000 }); // age 26
    expect(evaluateDealbreakers({ maxBuildingAgeYears: 20 }, c, cfg)).toContain(
      "maxBuildingAgeYears",
    );
    expect(evaluateDealbreakers({ maxBuildingAgeYears: 26 }, c, cfg)).toEqual([]);
  });

  it("minHouseholds: 미만이면 탈락", () => {
    const c = makeComplex({ households: 300 });
    expect(evaluateDealbreakers({ minHouseholds: 500 }, c, cfg)).toContain(
      "minHouseholds",
    );
  });

  it("requireSchoolNearby: schoolNearby가 true가 아니면 탈락", () => {
    expect(
      evaluateDealbreakers(
        { requireSchoolNearby: true },
        makeComplex({ schoolNearby: false }),
        cfg,
      ),
    ).toContain("requireSchoolNearby");
    expect(
      evaluateDealbreakers(
        { requireSchoolNearby: true },
        makeComplex({ schoolNearby: true }),
        cfg,
      ),
    ).toEqual([]);
  });

  it("여러 조건이 동시에 실패하면 모두 담는다", () => {
    const c = makeComplex({
      price: { representative: 99999 },
      households: 100,
    });
    const failed = evaluateDealbreakers(
      { maxPrice: 80000, minHouseholds: 500 },
      c,
      cfg,
    );
    expect(failed).toEqual(expect.arrayContaining(["maxPrice", "minHouseholds"]));
  });
});
