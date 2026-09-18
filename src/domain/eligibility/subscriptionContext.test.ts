import { describe, it, expect } from "vitest";
import { isSpecialSupplyContext } from "./subscriptionContext";

describe("isSpecialSupplyContext", () => {
  it("미지정·일반·특공은 신혼 특공 자격 안내가 유효(true)", () => {
    expect(isSpecialSupplyContext(undefined)).toBe(true);
    expect(isSpecialSupplyContext("general")).toBe(true);
    expect(isSpecialSupplyContext("special")).toBe(true);
  });

  it("무순위·잔여·취소재공급은 특공이 아니므로 false(패널 숨김)", () => {
    expect(isSpecialSupplyContext("unranked")).toBe(false);
    expect(isSpecialSupplyContext("remaining")).toBe(false);
    expect(isSpecialSupplyContext("cancelled_resale")).toBe(false);
  });
});
