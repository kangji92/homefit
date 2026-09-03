import { describe, it, expect } from "vitest";
import { whatIf, SCENARIOS } from "./whatif";
import type { HouseholdProfile } from "../types";

// 사실혼 · 한쪽 유주택 커플 (전략적 미신고)
const DE_FACTO_OWNER: HouseholdProfile = {
  maritalStatus: "de_facto",
  housingStatus: "own",
  minorChildren: 0,
  monthlyIncomeManwon: 600,
  totalAssetManwon: 20000,
  subscriptionMonths: 12,
};

function unlockedKeys(results: ReturnType<typeof whatIf>, scenarioKey: string) {
  const r = results.find((x) => x.scenario.key === scenarioKey);
  return (r?.unlocked ?? []).map((p) => p.key);
}

describe("whatIf", () => {
  it("집 팔고 혼인신고하면 신혼부부·생애최초 특공이 열린다", () => {
    const r = whatIf(DE_FACTO_OWNER);
    const keys = unlockedKeys(r, "sell_register");
    expect(keys).toEqual(expect.arrayContaining(["newlywed", "firstTime"]));
  });

  it("혼인신고만 해도(유주택 유지) 신혼부부 특공은 안 열린다", () => {
    const r = whatIf(DE_FACTO_OWNER);
    expect(unlockedKeys(r, "register")).not.toContain("newlywed");
  });

  it("집만 팔면(사실혼 유지) 생애최초는 열리지만 신혼부부는 안 열린다", () => {
    const r = whatIf(DE_FACTO_OWNER);
    const keys = unlockedKeys(r, "sell");
    expect(keys).toContain("firstTime");
    expect(keys).not.toContain("newlywed");
  });

  it("임신·출산 시나리오는 신생아 특공을 연다", () => {
    // 무주택·혼인·소득이 신생아 완화 이내인 커플
    const profile: HouseholdProfile = {
      maritalStatus: "married",
      marriedMonths: 24,
      housingStatus: "none",
      minorChildren: 0,
      monthlyIncomeManwon: 1000, // 일반 상한(800) 초과 → 신혼/생애최초는 이미 not
      totalAssetManwon: 20000,
      subscriptionMonths: 12,
    };
    expect(unlockedKeys(whatIf(profile), "newborn")).toContain("newborn");
  });

  it("이미 가능한 프로그램은 unlocked에 넣지 않는다", () => {
    const eligibleNow: HouseholdProfile = {
      maritalStatus: "married",
      marriedMonths: 24,
      housingStatus: "none",
      minorChildren: 0,
      monthlyIncomeManwon: 600,
      totalAssetManwon: 20000,
      subscriptionMonths: 12,
    };
    // register 시나리오로도 newlywed는 이미 가능하므로 새로 열리지 않는다
    const r = whatIf(eligibleNow);
    expect(unlockedKeys(r, "register")).not.toContain("newlywed");
  });

  it("시나리오 목록은 4개(혼인신고·매도·출산·복합)", () => {
    expect(SCENARIOS.map((s) => s.key)).toEqual([
      "register",
      "sell",
      "newborn",
      "sell_register",
    ]);
  });
});
