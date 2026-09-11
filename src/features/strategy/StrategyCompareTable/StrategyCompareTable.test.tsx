import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { HousingStrategy, StrategyDecision } from "@/domain/types";
import { StrategyCompareTable } from "./StrategyCompareTable";
import type { StrategyBoardItem } from "../strategyView";

function item(
  id: string,
  kind: HousingStrategy["kind"],
  fitScore: number,
  cash: number | undefined,
): StrategyBoardItem {
  const strategy: HousingStrategy = {
    id,
    kind,
    label: `${id} 전략`,
    targetRef: { kind: "existing", id },
    steps: [],
  };
  const decision: StrategyDecision = {
    strategyId: id,
    status: "consider",
    reasons: [],
    fit: { complexId: id, passesDealbreakers: true, failedDealbreakers: [], unknownDealbreakers: [], axisScores: { price: 0, commute: 0, education: 0, newness: 0, infrastructure: 0, environment: 0, futurePotential: 0 }, totalScore: fitScore },
    affordability: { verdict: "ok", cashNeededNow: cash },
    timing: { horizon: "now" },
    risk: { flags: [], requiredReviews: [], incompleteInputs: [] },
    pros: [],
    cons: [],
    nextActions: [],
  };
  return { strategy, decision };
}

describe("StrategyCompareTable", () => {
  const cols = [
    item("a", "buy_existing", 90, 30000),
    item("b", "apply_presale", 70, 6000),
  ];

  it("동일 축 라벨을 렌더한다", () => {
    render(<StrategyCompareTable columns={cols} />);
    expect(screen.getByText("적합도")).toBeInTheDocument();
    expect(screen.getByText("정착 시점")).toBeInTheDocument();
  });

  it("적합도 최고·현금 최저를 축별로 강조한다(종합점수 아님)", () => {
    render(<StrategyCompareTable columns={cols} />);
    expect(screen.getByText("최고")).toBeInTheDocument(); // a: fit 90
    expect(screen.getByText("현금 최저")).toBeInTheDocument(); // b: 6000
  });
});
