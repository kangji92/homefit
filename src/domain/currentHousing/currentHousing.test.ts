import { describe, it, expect } from "vitest";
import { makeComplex } from "@/domain/__fixtures__";
import type { CurrentHousing, RegionPreferences, Workplace } from "../types";
import {
  currentHomeComparison,
  filterHomesByRegion,
  regionSoftBoost,
  tenureToHousingStatus,
} from "./index";

const wp = (id: string, label: string): Workplace => ({ id, label, lat: 0, lng: 0, transport: "transit" });

describe("region hard/soft 제약", () => {
  const homes = [
    makeComplex({ id: "a", regionId: "anyang" }),
    makeComplex({ id: "b", regionId: "uiwang" }),
    makeComplex({ id: "c", regionId: "hanam" }),
  ];

  it("excluded 지역은 hard로 제외한다", () => {
    const prefs: RegionPreferences = { preferred: [], excluded: [{ id: "hanam" }] };
    const out = filterHomesByRegion(homes, { prefs });
    expect(out.map((h) => h.id)).toEqual(["a", "b"]);
  });

  it("stay_current_area는 현재 지역만 hard 유지", () => {
    const current: CurrentHousing = { tenure: "jeonse", regionRef: { id: "anyang" }, movePreference: "stay_current_area" };
    const out = filterHomesByRegion(homes, { current });
    expect(out.map((h) => h.id)).toEqual(["a"]);
  });

  it("prefer_nearby는 soft — 필터하지 않고 boost만", () => {
    const current: CurrentHousing = { tenure: "jeonse", regionRef: { id: "anyang" }, movePreference: "prefer_nearby" };
    expect(filterHomesByRegion(homes, { current })).toHaveLength(3); // 필터 안 함
    expect(regionSoftBoost("anyang", { current })).toBeGreaterThan(regionSoftBoost("hanam", { current }));
  });
});

describe("tenureToHousingStatus", () => {
  it("owner만 유주택", () => {
    expect(tenureToHousingStatus("owner")).toBe("own");
    expect(tenureToHousingStatus("jeonse")).toBe("none");
  });
});

describe("currentHomeComparison — 현재→후보 변화(종합점수 아님)", () => {
  const currentHome = makeComplex({
    id: "cur", regionId: "anyang", sizesPyeong: [24], completionYear: 2004,
    commuteMinutes: { me: 38, spouse: 42 }, stationDistanceM: 650,
    price: { jeonse: { representative: 35000 } },
  });
  const candidate = makeComplex({
    id: "cand", regionId: "uiwang", sizesPyeong: [32], completionYear: 2018,
    commuteMinutes: { me: 47, spouse: 35 }, stationDistanceM: 420,
    price: { sale: { representative: 78000 } },
  });
  const current: CurrentHousing = { tenure: "jeonse", regionRef: { id: "anyang", label: "평촌" }, deposit: 35000, movePreference: "open_to_move" };

  const cmp = currentHomeComparison({
    current, currentHome, candidate, candidateDealType: "sale",
    workplaces: [wp("me", "내"), wp("spouse", "배우자")],
  });

  it("gains에 면적·신축·배우자 통근 개선이 잡힌다", () => {
    expect(cmp.gains.some((g) => g.includes("면적") && g.includes("+8평"))).toBe(true);
    expect(cmp.gains.some((g) => g.includes("준공") && g.includes("신축"))).toBe(true);
    expect(cmp.gains.some((g) => g.includes("배우자 통근") && g.includes("-7분"))).toBe(true);
  });
  it("tradeoffs에 내 통근 증가·생활권 이동·현금 증가가 잡힌다", () => {
    expect(cmp.tradeoffs.some((t) => t.includes("내 통근") && t.includes("+9분"))).toBe(true);
    expect(cmp.tradeoffs.some((t) => t.includes("생활권") && t.includes("이동"))).toBe(true);
    expect(cmp.tradeoffs.some((t) => t.includes("필요 자금"))).toBe(true);
  });
  it("현재 단지 미매칭이면 면적·통근은 비교하지 않는다(graceful)", () => {
    const c2 = currentHomeComparison({ current, candidate, candidateDealType: "sale", workplaces: [wp("me", "내")] });
    expect(c2.rows.some((r) => r.key === "size")).toBe(false);
    expect(c2.rows.some((r) => r.key.startsWith("commute"))).toBe(false);
    expect(c2.hasCurrent).toBe(true);
  });
});
