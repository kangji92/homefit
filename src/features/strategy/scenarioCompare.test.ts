// 시나리오 A/B/C를 Decision View(보드 + 비교 열) 수준에서 강화 검증한다.
// 도메인 scenario.test.ts가 생성/판정 규칙을 다룬다면, 여기서는 "같은 축으로
// 나란히 비교"가 실제로 어떤 열/강조로 나오는지 고정한다.

import { describe, it, expect } from "vitest";
import { makeComplex, makeConditions, WORKED_PRIORITIES } from "@/domain/__fixtures__";
import type { HouseholdProfile, Money, PresaleHome } from "@/domain/types";
import type { StrategyInput } from "@/domain/strategy";
import {
  buildStrategyBoard,
  compareHighlights,
  pickCompareColumns,
} from "./strategyView";

const src = { sourceType: "official_announcement" as const, lastVerifiedAt: "2026-01-01", verificationStatus: "verified" as const };
const m = (manwon: number): Money => ({ manwon, valueProvenance: "sourced" });
const kinds = (input: StrategyInput) =>
  pickCompareColumns(buildStrategyBoard(input)).map((c) => c.strategy.kind);

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

describe("시나리오 A — 지금 매수만", () => {
  it("비교 열이 매수 1종(줄세우기 아님, 단일 경로)", () => {
    const input = ctx({ homes: [makeComplex({ id: "a", price: { sale: { representative: 60000 } } })] });
    expect(kinds(input)).toEqual(["buy_existing"]);
  });
});

describe("시나리오 B — 매수 vs 전세→청약", () => {
  const input = ctx({
    homes: [
      makeComplex({ id: "now", price: { sale: { representative: 60000 } }, commuteMinutes: { a: 20, b: 25 } }),
      presale({ id: "sched", lifecycle: { phase: "subscription_scheduled", lastVerifiedAt: "2026-01-01" }, moveInYear: 2032 }),
    ],
  });
  it("서로 다른 두 전략이 같은 축에 나란히 놓인다", () => {
    expect(kinds(input)).toEqual(["buy_existing", "rent_then_apply"]);
  });
  it("정착 시점 축에서 매수가 最速으로 강조된다(억지 종합점수 없이 축별 우세)", () => {
    const cols = pickCompareColumns(buildStrategyBoard(input));
    const hl = compareHighlights(cols);
    expect(hl.soonestId).toBe("buy-now");
  });
});

describe("시나리오 C — 청약 vs 분양권", () => {
  const input = ctx({
    homes: [
      presale({ id: "capp", lifecycle: { phase: "subscription_open", lastVerifiedAt: "2026-01-01" }, moveInYear: 2029 }),
      presale({
        id: "dres", lifecycle: { phase: "transferable", lastVerifiedAt: "2026-01-01" }, moveInYear: 2028,
        transfer: { status: "tradable", riskFlags: [], provenance: src },
        offering: { basePrice: m(70000), resalePrice: m(78000), downPayment: m(7000), midPaymentPaid: m(21000), midPaymentRemaining: m(21000) },
      }),
    ],
  });
  it("청약과 분양권이 나란히, 감당가능성(현금) 축에서 청약이 최저로 강조", () => {
    const cols = pickCompareColumns(buildStrategyBoard(input));
    expect(cols.map((c) => c.strategy.kind)).toEqual(["apply_presale", "buy_presale_right"]);
    const hl = compareHighlights(cols);
    // 청약 계약금(6000) < 분양권 필요현금(36000)
    expect(hl.lowestCashId).toBe("apply-capp");
  });
});
