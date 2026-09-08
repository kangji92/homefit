import { describe, it, expect } from "vitest";
import { evaluateNewlywedSpecial } from "./newlywed";
import { DEFAULT_SUBSCRIPTION_POLICY } from "./policy";
import type { HouseholdProfile } from "../types";

const FULL: HouseholdProfile = {
  maritalStatus: "married",
  marriedMonths: 24,
  housingStatus: "none",
  minorChildren: 1,
  householdSize: 3,
  dualIncome: true,
  monthlyIncomeManwon: 600,
  realEstateAssetManwon: 20000,
  carValueManwon: 2000,
  subscriptionMonths: 12,
};

describe("evaluateNewlywedSpecial", () => {
  it("모든 요건 충족이면 eligible", () => {
    const r = evaluateNewlywedSpecial(FULL);
    expect(r.eligible).toBe(true);
    expect(r.hasUnknown).toBe(false);
    expect(r.requirements.every((x) => x.status === "pass")).toBe(true);
  });

  it("혼인 7년 초과·유주택·소득/자산 초과는 fail", () => {
    const r = evaluateNewlywedSpecial({
      ...FULL,
      marriedMonths: 100, // > 84
      housingStatus: "own",
      monthlyIncomeManwon: 1500, // 도시근로자소득×140%(맞벌이·3인=약 1144) 초과
      realEstateAssetManwon: 40000, // > 21550
    });
    const fail = r.requirements.filter((x) => x.status === "fail").map((x) => x.key);
    expect(fail).toEqual(
      expect.arrayContaining(["marriage", "housing", "income", "realEstate"]),
    );
    expect(r.eligible).toBe(false);
  });

  it("예비 신혼부부는 혼인 요건 통과", () => {
    const r = evaluateNewlywedSpecial({ ...FULL, maritalStatus: "prospective", marriedMonths: undefined });
    expect(r.requirements.find((x) => x.key === "marriage")?.status).toBe("pass");
  });

  it("사실혼(동거)은 혼인 요건 fail — 신혼부부 특공 대상 아님", () => {
    const r = evaluateNewlywedSpecial({ ...FULL, maritalStatus: "de_facto" });
    const marriage = r.requirements.find((x) => x.key === "marriage");
    expect(marriage?.status).toBe("fail");
    expect(marriage?.detail).toMatch(/혼인신고/);
    expect(r.eligible).toBe(false);
  });

  it("미입력 값은 unknown이고 eligible 아님", () => {
    const r = evaluateNewlywedSpecial({});
    expect(r.hasUnknown).toBe(true);
    expect(r.eligible).toBe(false);
    expect(r.requirements.filter((x) => x.status === "unknown").length).toBeGreaterThan(0);
  });

  it("정책 버전/기준일을 반영한다(주입)", () => {
    const r = evaluateNewlywedSpecial(FULL, {
      ...DEFAULT_SUBSCRIPTION_POLICY,
      version: "test-v1",
      asOf: "2027-01-01",
    });
    expect(r.policyVersion).toBe("test-v1");
    expect(r.asOf).toBe("2027-01-01");
  });
});
