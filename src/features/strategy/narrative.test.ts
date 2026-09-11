import { describe, it, expect } from "vitest";
import type { HousingStrategy, StrategyDecision, StrategyKind } from "@/domain/types";
import { strategyNarrative, tradeoffSummary } from "./narrative";
import type { StrategyBoardItem } from "./strategyView";

function make(
  id: string,
  kind: StrategyKind,
  over: Partial<StrategyDecision> = {},
): StrategyBoardItem {
  const strategy: HousingStrategy = { id, kind, label: `${id} 전략`, steps: [] };
  const decision: StrategyDecision = {
    strategyId: id,
    status: "consider",
    reasons: [],
    affordability: { verdict: "ok" },
    timing: { horizon: "now" },
    risk: { flags: [], requiredReviews: [], incompleteInputs: [] },
    pros: [],
    cons: [],
    nextActions: [],
    ...over,
  };
  return { strategy, decision };
}

describe("strategyNarrative — 결정적 변주", () => {
  it("buy_existing은 정착 시점에 따라 문구가 달라진다", () => {
    expect(strategyNarrative(make("a", "buy_existing", { timing: { horizon: "now" } }))).toContain("지금 바로");
    expect(strategyNarrative(make("a", "buy_existing", { timing: { horizon: "mid" } }))).toContain("앞당겨");
  });
  it("rent_then_apply는 자격 pass면 문구가 강화된다", () => {
    expect(strategyNarrative(make("r", "rent_then_apply", { eligibility: { status: "pass" } }))).toContain("청약 자격을 살려");
    expect(strategyNarrative(make("r", "rent_then_apply"))).not.toContain("살려");
  });
});

describe("tradeoffSummary — 종합 승자 없이 +/-", () => {
  const cols = [
    make("buy", "buy_existing", { fit: fit(90), affordability: { verdict: "ok", cashNeededNow: 30000 }, timing: { horizon: "now" } }),
    make("rent", "rent_then_apply", {
      fit: fit(70),
      affordability: { verdict: "ok", cashNeededNow: 6000 },
      timing: { horizon: "long" },
      eligibility: { status: "pass" },
      risk: { flags: [], requiredReviews: [], incompleteInputs: ["전세 후보 미선정"] },
    }),
  ];

  it("매수는 적합도·시점 강점, 현금은 약점", () => {
    const [buy] = tradeoffSummary(cols);
    expect(buy.strengths).toContain("적합도가 가장 높아요");
    expect(buy.strengths).toContain("가장 빨리 정착해요");
    expect(buy.weaknesses.some((w) => w.includes("현금이"))).toBe(true);
  });
  it("전세→청약은 현금 강점, 시점·미결정 약점", () => {
    const [, rent] = tradeoffSummary(cols);
    expect(rent.strengths).toContain("지금 필요한 현금이 가장 적어요");
    expect(rent.weaknesses).toContain("정착까지 더 오래 걸려요");
    expect(rent.weaknesses.some((w) => w.includes("전세 후보 미선정"))).toBe(true);
  });
});

function fit(totalScore: number) {
  return {
    complexId: "t",
    passesDealbreakers: true,
    failedDealbreakers: [],
    unknownDealbreakers: [],
    axisScores: { price: 0, commute: 0, education: 0, newness: 0, infrastructure: 0, environment: 0, futurePotential: 0 },
    totalScore,
  };
}
