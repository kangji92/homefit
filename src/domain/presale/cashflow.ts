// 분양권 현금흐름 계산 (순수). 누락 입력은 0이 아니라 undefined(unknown)로
// 전파한다 — 계산 불가한 파생값은 undefined, missing에 기록. (presale-rights.md §6)

import type { Money, OfferingPrice } from "../types";

export interface CashFlowResult {
  premium?: Money;                 // resale - base
  estimatedTotalAcquisition?: Money; // base + premium (부대비용 제외)
  cashNeededAtPurchase?: Money;    // premium + downPayment + midPaymentPaid(승계)
  balance?: Money;                 // base - down - (midPaid + midRemaining)
  /** 계산하지 못한 파생 필드명 */
  missing: string[];
}

const val = (m?: Money): number | undefined => m?.manwon;
const computed = (manwon: number): Money => ({ manwon, valueProvenance: "computed" });

/** 모든 인자가 정의됐을 때만 fn 적용, 아니면 undefined. */
function calc(
  inputs: (number | undefined)[],
  fn: (v: number[]) => number,
): Money | undefined {
  if (inputs.some((x) => x === undefined)) return undefined;
  return computed(fn(inputs as number[]));
}

export function computeCashFlow(offering: OfferingPrice): CashFlowResult {
  const base = val(offering.basePrice);
  const resale = val(offering.resalePrice);
  const down = val(offering.downPayment);
  const midPaid = val(offering.midPaymentPaid);
  const midRemaining = val(offering.midPaymentRemaining);

  const premium = calc([resale, base], ([r, b]) => r - b);
  const premiumV = val(premium);

  const estimatedTotalAcquisition = calc([base, premiumV], ([b, p]) => b + p);
  const cashNeededAtPurchase = calc(
    [premiumV, down, midPaid],
    ([p, d, mp]) => p + d + mp,
  );
  const balance = calc(
    [base, down, midPaid, midRemaining],
    ([b, d, mp, mr]) => b - d - (mp + mr),
  );

  const missing: string[] = [];
  if (!premium) missing.push("premium");
  if (!estimatedTotalAcquisition) missing.push("estimatedTotalAcquisition");
  if (!cashNeededAtPurchase) missing.push("cashNeededAtPurchase");
  if (!balance) missing.push("balance");

  return { premium, estimatedTotalAcquisition, cashNeededAtPurchase, balance, missing };
}
