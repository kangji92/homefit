import { describe, it, expect } from "vitest";
import type { Money, PresaleHome, TransferInfo, ValueProvenance } from "../types";
import { effectiveAcquisitionPriceManwon } from "./price";

const m = (manwon: number, vp: ValueProvenance = "sourced"): Money => ({
  manwon,
  valueProvenance: vp,
});
const base: PresaleHome = {
  id: "p", kind: "presale", name: "분양", regionId: "r",
  price: {}, sizesPyeong: [25], commuteMinutes: {},
  metrics: { education: 0, infrastructure: 0, environment: 0, futurePotential: 0 },
  moveInYear: 2028,
  offering: { basePrice: m(60000), resalePrice: m(66000) },
};
const tradable: TransferInfo = {
  status: "tradable", riskFlags: [],
  provenance: { sourceType: "official_announcement", lastVerifiedAt: "2026-09-01", verificationStatus: "verified" },
};

describe("effectiveAcquisitionPriceManwon", () => {
  it("청약 단계는 분양가", () => {
    const home = { ...base, lifecycle: { phase: "subscription_open" as const, lastVerifiedAt: "2026-09-01" } };
    expect(effectiveAcquisitionPriceManwon(home)).toBe(60000);
  });

  it("분양권(전매 가능+tradable) 단계는 총 취득금액(분양가+프리미엄)", () => {
    const home = {
      ...base,
      lifecycle: { phase: "transferable" as const, lastVerifiedAt: "2026-09-01" },
      transfer: tradable,
    };
    // premium = 66000-60000=6000, total = 60000+6000 = 66000
    expect(effectiveAcquisitionPriceManwon(home)).toBe(66000);
  });

  it("offering 없으면 undefined", () => {
    expect(
      effectiveAcquisitionPriceManwon({ ...base, offering: undefined }),
    ).toBeUndefined();
  });

  it("분양권 단계인데 분양권가 미확정이면 undefined(0 아님)", () => {
    const home = {
      ...base,
      offering: { basePrice: m(60000) }, // resalePrice 없음
      lifecycle: { phase: "transferable" as const, lastVerifiedAt: "2026-09-01" },
      transfer: tradable,
    };
    expect(effectiveAcquisitionPriceManwon(home)).toBeUndefined();
  });
});
