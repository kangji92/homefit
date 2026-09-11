import { describe, it, expect } from "vitest";
import { makeComplex, makeConditions, WORKED_PRIORITIES } from "@/domain/__fixtures__";
import type { HouseholdProfile, Home, PresaleHome } from "@/domain/types";
import { generateStrategies, type StrategyInput } from "./generate";

const NONE: HouseholdProfile = { housingStatus: "none", subscriptionMonths: 12 };

function presale(over: Partial<PresaleHome> & Pick<PresaleHome, "id">): PresaleHome {
  return {
    kind: "presale",
    name: over.id,
    regionId: "r",
    price: { sale: { representative: 60000 } },
    sizesPyeong: [25, 34],
    commuteMinutes: { a: 30, b: 40 },
    metrics: { education: 70, infrastructure: 70, environment: 70, futurePotential: 70 },
    moveInYear: 2029,
    ...over,
  } as PresaleHome;
}

function input(over: Partial<StrategyInput>): StrategyInput {
  return {
    conditions: makeConditions(),
    priorities: WORKED_PRIORITIES,
    dealbreakers: {},
    profile: NONE,
    homes: [],
    areas: [],
    currentYear: 2026,
    ...over,
  };
}

describe("generateStrategies — kind별 생성 조건", () => {
  it("buy_existing: 예산 내 기존주택만", () => {
    const inBudget = makeComplex({ id: "in", price: { sale: { representative: 80000 } } });
    const overBudget = makeComplex({ id: "over", price: { sale: { representative: 130000 } } });
    const s = generateStrategies(input({ homes: [inBudget, overBudget] }));
    const buys = s.filter((x) => x.kind === "buy_existing");
    expect(buys.map((b) => b.targetRef?.id)).toEqual(["in"]);
  });

  it("apply_presale: 접수 중(subscription_open) presale만", () => {
    const open = presale({ id: "open", lifecycle: { phase: "subscription_open", lastVerifiedAt: "2026-01-01" } });
    const closed = presale({ id: "closed", lifecycle: { phase: "subscription_closed", lastVerifiedAt: "2026-01-01" } });
    const s = generateStrategies(input({ homes: [open, closed] }));
    expect(s.filter((x) => x.kind === "apply_presale").map((x) => x.targetRef?.id)).toEqual(["open"]);
  });

  it("rent_then_apply: 예정(scheduled/planned) presale만", () => {
    const sched = presale({ id: "sched", lifecycle: { phase: "subscription_scheduled", lastVerifiedAt: "2026-01-01" } });
    const s = generateStrategies(input({ homes: [sched] }));
    const r = s.find((x) => x.kind === "rent_then_apply");
    expect(r?.targetRef?.id).toBe("sched");
    expect(r?.steps[0].kind).toBe("rent"); // 전세 스텝 먼저
  });

  it("buy_presale_right: 전매 가능(transferable+tradable)만", () => {
    const src = { sourceType: "official_announcement" as const, lastVerifiedAt: "2026-01-01", verificationStatus: "verified" as const };
    const tradable = presale({
      id: "trade",
      lifecycle: { phase: "transferable", lastVerifiedAt: "2026-01-01" },
      transfer: { status: "tradable", riskFlags: [], provenance: src },
    });
    const restricted = presale({
      id: "restr",
      lifecycle: { phase: "transfer_restricted", lastVerifiedAt: "2026-01-01" },
      transfer: { status: "restricted", riskFlags: ["transfer_restricted"], provenance: src },
    });
    const s = generateStrategies(input({ homes: [tradable, restricted] }));
    expect(s.filter((x) => x.kind === "buy_presale_right").map((x) => x.targetRef?.id)).toEqual(["trade"]);
  });
});

describe("generateStrategies — 청약 계열은 자격 계층으로 게이팅(hasHome 직접 해석 안 함)", () => {
  const open = presale({ id: "o", lifecycle: { phase: "subscription_open", lastVerifiedAt: "2026-01-01" } });
  const hasApply = (s: ReturnType<typeof generateStrategies>) =>
    s.some((x) => x.kind === "apply_presale" || x.kind === "rent_then_apply");

  it("자격 fail(통장 없는 유주택 → 특공·일반 모두 hard-fail)이면 생성 안 함", () => {
    const s = generateStrategies(input({ homes: [open], profile: { housingStatus: "own", subscriptionMonths: 0 } }));
    expect(hasApply(s)).toBe(false);
  });

  it("유주택이어도 일반공급 자격(통장 보유)이면 생성한다 — 유주택 일괄 제외 아님", () => {
    const s = generateStrategies(input({ homes: [open], profile: { housingStatus: "own", subscriptionMonths: 24 } }));
    expect(s.some((x) => x.kind === "apply_presale")).toBe(true);
  });

  it("무주택·정보 부족(unknown)이면 생성한다(상태는 decision에서 needs_review)", () => {
    const s = generateStrategies(input({ homes: [open], profile: { housingStatus: "none", subscriptionMonths: 12 } }));
    expect(s.some((x) => x.kind === "apply_presale")).toBe(true);
  });

  it("maxPerKind로 상한을 둔다", () => {
    const homes: Home[] = Array.from({ length: 7 }, (_, i) =>
      makeComplex({ id: `h${i}`, price: { sale: { representative: 70000 } } }),
    );
    const s = generateStrategies(input({ homes, config: { maxPerKind: 4, recommendFitMin: 78, presaleDownPaymentRatio: 0.1 } }));
    expect(s.filter((x) => x.kind === "buy_existing").length).toBe(4);
  });

  it("targetRef 없는 추상 대기 전략은 생성하지 않는다(모든 전략에 targetRef 존재)", () => {
    const open = presale({ id: "o", lifecycle: { phase: "subscription_open", lastVerifiedAt: "2026-01-01" } });
    const s = generateStrategies(input({ homes: [makeComplex({ id: "x" }), open] }));
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((x) => x.targetRef !== undefined)).toBe(true);
  });
});
