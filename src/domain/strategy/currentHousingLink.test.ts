import { describe, it, expect } from "vitest";
import { makeComplex, makeConditions, WORKED_PRIORITIES } from "@/domain/__fixtures__";
import type { CurrentHousing, HouseholdProfile, PresaleHome } from "@/domain/types";
import { generateStrategies, type StrategyInput } from "./generate";
import { computeStrategyDecision } from "./decision";

const NONE: HouseholdProfile = { housingStatus: "none", subscriptionMonths: 12 };
function sched(id: string, regionId = "r"): PresaleHome {
  return {
    kind: "presale", id, name: id, regionId,
    price: { sale: { representative: 60000 } }, sizesPyeong: [25, 34],
    commuteMinutes: { a: 30, b: 40 },
    metrics: { education: 70, infrastructure: 70, environment: 70, futurePotential: 70 },
    moveInYear: 2030,
    lifecycle: { phase: "subscription_scheduled", lastVerifiedAt: "2026-01-01" },
  };
}
function input(over: Partial<StrategyInput>): StrategyInput {
  return {
    conditions: makeConditions(), priorities: WORKED_PRIORITIES, dealbreakers: {},
    profile: NONE, homes: [], areas: [], currentYear: 2026, ...over,
  };
}

describe("CurrentHousing → generateStrategies 연결", () => {
  it("excluded 지역은 전략 생성에서 제외된다", () => {
    const homes = [makeComplex({ id: "a", regionId: "keep", price: { sale: { representative: 70000 } } }), makeComplex({ id: "b", regionId: "drop", price: { sale: { representative: 70000 } } })];
    const s = generateStrategies(input({ homes, regionPrefs: { preferred: [], excluded: [{ id: "drop" }] } }));
    expect(s.some((x) => x.targetRef?.id === "b")).toBe(false);
    expect(s.some((x) => x.targetRef?.id === "a")).toBe(true);
  });

  it("현재 전세 유지 가능하면 rent_then_apply가 '전세 후보 미선정'을 해소한다", () => {
    const current: CurrentHousing = { tenure: "jeonse", regionRef: { id: "r" }, movePreference: "prefer_nearby" };
    const ctx = input({ homes: [sched("p")], currentHousing: current });
    const strat = generateStrategies(ctx).find((x) => x.kind === "rent_then_apply")!;
    expect(strat.label).toContain("현재 전세 유지");
    const d = computeStrategyDecision(strat, ctx);
    expect(d.risk.incompleteInputs).not.toContain("전세 후보 미선정");
  });

  it("떠날 의향(want_to_leave)이면 현재 전세를 유지하지 않아 미선정이 남는다", () => {
    const current: CurrentHousing = { tenure: "jeonse", regionRef: { id: "r" }, movePreference: "want_to_leave" };
    const ctx = input({ homes: [sched("p")], currentHousing: current });
    const strat = generateStrategies(ctx).find((x) => x.kind === "rent_then_apply")!;
    const d = computeStrategyDecision(strat, ctx);
    expect(d.risk.incompleteInputs).toContain("전세 후보 미선정");
  });

  it("현재 자가(owner)면 housingStatus prefill로 자격 계층이 반영된다(통장 없으면 청약 계열 제외)", () => {
    const current: CurrentHousing = { tenure: "owner", regionRef: { id: "r" }, movePreference: "open_to_move" };
    // profile.housingStatus 미입력 + 통장 0 → owner prefill → 특공·일반 hard-fail → 청약 제외
    const ctx = input({ homes: [sched("p")], profile: { subscriptionMonths: 0 }, currentHousing: current });
    const s = generateStrategies(ctx);
    expect(s.some((x) => x.kind === "apply_presale" || x.kind === "rent_then_apply")).toBe(false);
  });
});
