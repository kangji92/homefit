import { describe, it, expect } from "vitest";
import { makeComplex, makeConditions, WORKED_PRIORITIES } from "@/domain/__fixtures__";
import type { HouseholdProfile, Money, PresaleHome } from "@/domain/types";
import { generateStrategies, type StrategyInput } from "./generate";
import { computeStrategyDecision } from "./decision";

const src = { sourceType: "official_announcement" as const, lastVerifiedAt: "2026-01-01", verificationStatus: "verified" as const };
const m = (manwon: number): Money => ({ manwon, valueProvenance: "sourced" });

function presale(over: Partial<PresaleHome> & Pick<PresaleHome, "id">): PresaleHome {
  return {
    kind: "presale", name: over.id, regionId: "r",
    price: { sale: { representative: 60000 } }, sizesPyeong: [25, 34],
    commuteMinutes: { a: 25, b: 30 },
    metrics: { education: 80, infrastructure: 80, environment: 80, futurePotential: 85 },
    moveInYear: 2029, ...over,
  } as PresaleHome;
}

const ELIGIBLE: HouseholdProfile = {
  maritalStatus: "married", marriedMonths: 24, housingStatus: "none", minorChildren: 0,
  householdSize: 3, dualIncome: true, monthlyIncomeManwon: 600,
  realEstateAssetManwon: 20000, carValueManwon: 2000, subscriptionMonths: 12,
};

function ctx(over: Partial<StrategyInput>): StrategyInput {
  return {
    conditions: makeConditions(), priorities: WORKED_PRIORITIES, dealbreakers: {},
    profile: ELIGIBLE, homes: [], areas: [], currentYear: 2026, ...over,
  };
}
const decide = (input: StrategyInput) =>
  generateStrategies(input).map((s) => computeStrategyDecision(s, input));

describe("Scenario A — 지금 매수", () => {
  const great = makeComplex({
    id: "great", price: { sale: { representative: 60000 } },
    metrics: { education: 95, infrastructure: 95, environment: 95, futurePotential: 95 },
    commuteMinutes: { a: 20, b: 25 },
  });
  const input = ctx({ homes: [great] });

  it("예산 내 기존주택 매수 전략을 만들고 적합하면 recommended", () => {
    const decisions = decide(input);
    const buy = decisions.find((d) => d.strategyId === "buy-great");
    expect(buy).toBeDefined();
    expect(buy!.affordability.verdict).toBe("ok");
    expect(buy!.status).toBe("recommended");
    expect(buy!.timing.horizon).toBe("now");
  });
});

describe("Scenario B — 매수 vs 전세+청약", () => {
  const great = makeComplex({ id: "great", price: { sale: { representative: 60000 } }, metrics: { education: 90, infrastructure: 90, environment: 90, futurePotential: 90 }, commuteMinutes: { a: 20, b: 25 } });
  const gyosan = presale({ id: "gyosan", lifecycle: { phase: "subscription_scheduled", phaseSince: "2027-01-01", lastVerifiedAt: "2026-01-01" }, moveInYear: 2032 });
  const input = ctx({ homes: [great, gyosan] });

  it("매수와 전세+청약 두 전략을 함께 제시하고, 청약 전략엔 자격·미래 시점이 있다", () => {
    const decisions = decide(input);
    const kinds = decisions.map((d) => d.strategyId);
    expect(kinds).toContain("buy-great");
    expect(kinds).toContain("rent-apply-gyosan");
    const rentApply = decisions.find((d) => d.strategyId === "rent-apply-gyosan")!;
    expect(rentApply.eligibility?.status).toBe("pass"); // 자격 있음
    expect(rentApply.status).not.toBe("blocked");
    expect(rentApply.timing.horizon).toBe("long"); // 2032 입주 = 6년 뒤
  });
});

describe("Scenario C — 청약 vs 분양권", () => {
  const applyTarget = presale({ id: "capp", lifecycle: { phase: "subscription_open", lastVerifiedAt: "2026-01-01" }, moveInYear: 2029 });
  const resaleTarget = presale({
    id: "dres", lifecycle: { phase: "transferable", lastVerifiedAt: "2026-01-01" }, moveInYear: 2028,
    transfer: { status: "tradable", riskFlags: [], provenance: src },
    offering: { basePrice: m(70000), resalePrice: m(78000), downPayment: m(7000), midPaymentPaid: m(21000), midPaymentRemaining: m(21000) },
  });
  const input = ctx({ homes: [applyTarget, resaleTarget] });

  it("청약 전략과 분양권 전략을 함께, 분양권은 실 필요현금으로 감당가능성 판정", () => {
    const decisions = decide(input);
    const apply = decisions.find((d) => d.strategyId === "apply-capp");
    const resale = decisions.find((d) => d.strategyId === "resale-dres");
    expect(apply).toBeDefined();
    expect(resale).toBeDefined();
    // 분양권: 필요현금 = 프리미엄8000+계약금7000+기납부중도금21000 = 36000, 자금 50000 → ok
    expect(resale!.affordability.cashNeededNow).toBe(36000);
    expect(resale!.affordability.verdict).toBe("ok");
    expect(resale!.transfer?.status).toBe("tradable");
  });

  it("분양권 필요현금이 가용자금 초과면 blocked", () => {
    const poor = ctx({ homes: [resaleTarget], conditions: makeConditions({ availableFunds: 10000 }) });
    const d = decide(poor).find((x) => x.strategyId === "resale-dres")!;
    expect(d.affordability.verdict).toBe("short");
    expect(d.status).toBe("blocked");
  });
});
