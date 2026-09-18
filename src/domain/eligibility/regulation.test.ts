import { describe, it, expect } from "vitest";
import { regulatoryConditions } from "./regulation";

describe("regulatoryConditions (규제지역 → 청약 조건 도출)", () => {
  it("조정대상지역: 전매 36개월·재당첨 적용·청약통장 24개월·해당지역 우선", () => {
    const c = regulatoryConditions("adjustment", { overcrowdedZone: true });
    expect(c.resaleRestrictionMonths).toBe(36);
    expect(c.rewinLimit).toBe(true);
    expect(c.subscriptionAccount).toEqual({ required: true, minMonths: 24 });
    expect(c.localResidency?.required).toBe(true);
    // 실거주 의무는 도출하지 않는다(단지별 → 공고 확인)
    expect(c.mandatoryResidenceMonths).toBeUndefined();
  });

  it("비규제 과밀억제권역: 전매 12개월·재당첨 미적용·통장 12개월", () => {
    const c = regulatoryConditions("none", { overcrowdedZone: true });
    expect(c.resaleRestrictionMonths).toBe(12);
    expect(c.rewinLimit).toBe(false);
    expect(c.subscriptionAccount?.minMonths).toBe(12);
  });

  it("비규제·비과밀: 전매 6개월", () => {
    expect(regulatoryConditions("none").resaleRestrictionMonths).toBe(6);
  });
});
