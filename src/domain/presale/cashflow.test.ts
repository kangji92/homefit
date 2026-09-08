import { describe, it, expect } from "vitest";
import type { Money, OfferingPrice, ValueProvenance } from "../types";
import { computeCashFlow } from "./cashflow";

const m = (manwon: number, vp: ValueProvenance = "sourced"): Money => ({
  manwon,
  valueProvenance: vp,
});

const full: OfferingPrice = {
  basePrice: m(80000),
  resalePrice: m(90000),
  downPayment: m(8000),
  midPaymentPaid: m(24000),
  midPaymentRemaining: m(16000),
};

describe("computeCashFlow", () => {
  it("입력이 모두 있으면 파생값을 계산한다", () => {
    const r = computeCashFlow(full);
    expect(r.premium?.manwon).toBe(10000); // 90000 - 80000
    expect(r.estimatedTotalAcquisition?.manwon).toBe(90000); // 80000 + premium
    expect(r.cashNeededAtPurchase?.manwon).toBe(42000); // 10000 + 8000 + 24000
    expect(r.balance?.manwon).toBe(32000); // 80000 - 8000 - (24000+16000)
    expect(r.missing).toEqual([]);
  });

  it("파생값의 valueProvenance는 computed", () => {
    const r = computeCashFlow(full);
    expect(r.premium?.valueProvenance).toBe("computed");
    expect(r.cashNeededAtPurchase?.valueProvenance).toBe("computed");
  });

  it("분양권가가 없으면 프리미엄·총액·필요현금은 unknown(0 아님)", () => {
    const r = computeCashFlow({ ...full, resalePrice: undefined });
    expect(r.premium).toBeUndefined();
    expect(r.estimatedTotalAcquisition).toBeUndefined();
    expect(r.cashNeededAtPurchase).toBeUndefined();
    expect(r.balance?.manwon).toBe(32000); // 잔금은 분양권가 불필요 → 계산됨
    expect(r.missing).toEqual(
      expect.arrayContaining(["premium", "estimatedTotalAcquisition", "cashNeededAtPurchase"]),
    );
  });

  it("분양가가 없으면 잔금·프리미엄·총액 unknown", () => {
    const r = computeCashFlow({ ...full, basePrice: undefined });
    expect(r.premium).toBeUndefined();
    expect(r.balance).toBeUndefined();
    expect(r.estimatedTotalAcquisition).toBeUndefined();
  });

  it("빈 입력이면 전부 unknown, missing 비어있지 않음", () => {
    const r = computeCashFlow({});
    expect(r.premium).toBeUndefined();
    expect(r.balance).toBeUndefined();
    expect(r.missing.length).toBeGreaterThan(0);
  });
});
