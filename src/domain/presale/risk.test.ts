import { describe, it, expect } from "vitest";
import type { Provenance, TransferInfo } from "../types";
import { deriveTransactionRisk } from "./risk";

const verified: Provenance = {
  sourceType: "official_announcement",
  lastVerifiedAt: "2026-09-01",
  verificationStatus: "verified",
};
const ti = (over: Partial<TransferInfo>): TransferInfo => ({
  status: "tradable",
  riskFlags: [],
  provenance: verified,
  ...over,
});

describe("deriveTransactionRisk", () => {
  it("검증된 tradable + 무플래그 → normal", () => {
    expect(deriveTransactionRisk(ti({}))).toBe("normal");
  });

  it("전매제한 상태 → high_risk", () => {
    expect(deriveTransactionRisk(ti({ status: "restricted" }))).toBe("high_risk");
  });

  it("transfer_restricted 플래그 → high_risk", () => {
    expect(deriveTransactionRisk(ti({ riskFlags: ["transfer_restricted"] }))).toBe(
      "high_risk",
    );
  });

  it("미검증 데이터 → 최소 needs_review (tradable이어도)", () => {
    const p: Provenance = { ...verified, verificationStatus: "needs_review" };
    expect(deriveTransactionRisk(ti({ provenance: p }))).toBe("needs_review");
  });

  it("unknown/conditional 상태 → needs_review", () => {
    expect(deriveTransactionRisk(ti({ status: "unknown" }))).toBe("needs_review");
    expect(deriveTransactionRisk(ti({ status: "conditional" }))).toBe("needs_review");
  });

  it("확인계열 플래그 있으면 needs_review", () => {
    for (const f of [
      "transferability_unconfirmed",
      "rights_check_needed",
      "title_transfer_unconfirmed",
      "listing_mismatch",
      "price_source_unclear",
      "stale_info",
    ] as const) {
      expect(deriveTransactionRisk(ti({ riskFlags: [f] }))).toBe("needs_review");
    }
  });

  it("제한이 확인계열보다 우선(high_risk)", () => {
    expect(
      deriveTransactionRisk(ti({ status: "restricted", riskFlags: ["stale_info"] })),
    ).toBe("high_risk");
  });
});
