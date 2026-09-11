import { describe, it, expect } from "vitest";
import type { HouseholdProfile } from "../types";
import { screenSubscriptionEligibility } from "./screen";

const p = (over: Partial<HouseholdProfile>): HouseholdProfile => ({ ...over });

describe("screenSubscriptionEligibility — 무순위 제외·공급유형별 판정", () => {
  it("특공 자격 충족 → pass (해당 특공명)", () => {
    const r = screenSubscriptionEligibility(
      p({ maritalStatus: "married", marriedMonths: 24, housingStatus: "none", householdSize: 3, dualIncome: true, monthlyIncomeManwon: 600, realEstateAssetManwon: 20000, carValueManwon: 2000, subscriptionMonths: 12 }),
    );
    expect(r.status).toBe("pass");
    expect(r.program).toBeDefined();
  });

  it("무주택·정보 부족(통장 미입력) → unknown (hard-fail 없음)", () => {
    const r = screenSubscriptionEligibility(p({ housingStatus: "none" }));
    expect(r.status).toBe("unknown");
  });

  it("무주택·통장 보유 → 일반공급(추첨) 통장만 요건 → pass", () => {
    const r = screenSubscriptionEligibility(p({ housingStatus: "none", subscriptionMonths: 12 }));
    expect(r.status).toBe("pass");
  });

  it("유주택이어도 일반공급(통장 보유) → pass — 유주택 일괄 fail 아님", () => {
    const r = screenSubscriptionEligibility(p({ housingStatus: "own", subscriptionMonths: 24 }));
    expect(r.status).toBe("pass");
  });

  it("유주택 + 통장 없음 → 특공·일반 모두 hard-fail → fail", () => {
    const r = screenSubscriptionEligibility(p({ housingStatus: "own", subscriptionMonths: 0 }));
    expect(r.status).toBe("fail");
  });

  it("무순위(줍줍)가 항상 열려 있어도 그것만으로 pass로 만들지 않는다", () => {
    // 유주택+통장없음: 무순위는 evaluatePrograms에서 eligible이지만 스크리닝은 fail
    const r = screenSubscriptionEligibility(p({ housingStatus: "own", subscriptionMonths: 0 }));
    expect(r.status).toBe("fail");
  });
});
