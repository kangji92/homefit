import { describe, it, expect } from "vitest";
import { evaluatePrograms, PROGRAM_KEYS } from "./programs";
import { DEFAULT_SUBSCRIPTION_POLICY } from "./policy";
import type { HouseholdProfile } from "../types";

const NEWLYWED_OK: HouseholdProfile = {
  maritalStatus: "married",
  marriedMonths: 24,
  housingStatus: "none",
  minorChildren: 0,
  householdSize: 3,
  dualIncome: true,
  monthlyIncomeManwon: 600,
  realEstateAssetManwon: 20000,
  carValueManwon: 2000,
  subscriptionMonths: 12,
};

function byKey(profile: HouseholdProfile) {
  return Object.fromEntries(
    evaluatePrograms(profile).map((p) => [p.key, p]),
  );
}

describe("evaluatePrograms", () => {
  it("카탈로그의 모든 프로그램을 평가한다", () => {
    const results = evaluatePrograms(NEWLYWED_OK);
    expect(results.map((p) => p.key).sort()).toEqual([...PROGRAM_KEYS].sort());
  });

  it("무주택·소득/자산 충족 신혼부부는 신혼부부·생애최초 특공 eligible", () => {
    const m = byKey(NEWLYWED_OK);
    expect(m.newlywed.eligible).toBe(true);
    expect(m.firstTime.eligible).toBe(true);
  });

  it("자녀 2명이면 다자녀 특공 eligible, 1명이면 아님", () => {
    expect(byKey({ ...NEWLYWED_OK, minorChildren: 2 }).multiChild.eligible).toBe(
      true,
    );
    expect(byKey({ ...NEWLYWED_OK, minorChildren: 1 }).multiChild.eligible).toBe(
      false,
    );
  });

  it("신생아(2년내 출산)면 신생아 특공 eligible, 소득 완화 반영", () => {
    // 3인·맞벌이: 신혼 상한 약 1144만, 신생아 완화 상한 약 1634만.
    // 소득 1200은 신혼 초과지만 신생아 완화 이내.
    const m = byKey({ ...NEWLYWED_OK, hasNewborn: true, monthlyIncomeManwon: 1200 });
    expect(m.newborn.eligible).toBe(true);
    expect(m.newlywed.eligible).toBe(false); // 신혼 소득 상한 초과
  });

  it("유주택이면 특공은 not eligible, 무순위·일반은 유주택 허용", () => {
    const m = byKey({ ...NEWLYWED_OK, housingStatus: "own" });
    expect(m.newlywed.eligible).toBe(false);
    expect(m.firstTime.eligible).toBe(false);
    expect(m.unranked.allowsOwnHome).toBe(true);
    expect(m.general.allowsOwnHome).toBe(true);
  });

  it("무순위는 유주택이어도 신청 가능(eligible)", () => {
    expect(byKey({ ...NEWLYWED_OK, housingStatus: "own" }).unranked.eligible).toBe(
      true,
    );
  });

  it("미입력 값은 unknown이고 eligible 아님", () => {
    const m = byKey({});
    expect(m.newlywed.eligible).toBe(false);
    expect(m.newlywed.hasUnknown).toBe(true);
  });

  it("정책 버전/기준일을 반영한다(주입)", () => {
    const [first] = evaluatePrograms(NEWLYWED_OK, {
      ...DEFAULT_SUBSCRIPTION_POLICY,
      version: "test-v9",
      asOf: "2027-05-05",
    });
    expect(first.policyVersion).toBe("test-v9");
    expect(first.asOf).toBe("2027-05-05");
  });
});
