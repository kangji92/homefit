import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { HousingStrategy, StrategyDecision, StrategyKind } from "@/domain/types";
import { TradeoffSummary } from "./TradeoffSummary";
import type { StrategyBoardItem } from "../strategyView";

function make(id: string, kind: StrategyKind, over: Partial<StrategyDecision>): StrategyBoardItem {
  return {
    strategy: { id, kind, label: `${id} 전략`, steps: [] } as HousingStrategy,
    decision: {
      strategyId: id, status: "consider", reasons: [],
      affordability: { verdict: "ok" }, timing: { horizon: "now" },
      risk: { flags: [], requiredReviews: [], incompleteInputs: [] },
      pros: [], cons: [], nextActions: [], ...over,
    },
  };
}

describe("TradeoffSummary", () => {
  it("종합 승자를 만들지 않고 각 전략의 +/-를 보여준다", () => {
    const cols = [
      make("buy", "buy_existing", { affordability: { verdict: "ok", cashNeededNow: 30000 }, timing: { horizon: "now" } }),
      make("rent", "rent_then_apply", { affordability: { verdict: "ok", cashNeededNow: 6000 }, timing: { horizon: "long" } }),
    ];
    render(<TradeoffSummary columns={cols} />);
    expect(screen.getByText("무엇을 우선하느냐의 문제예요")).toBeInTheDocument();
    expect(screen.getByText(/종합 승자는 없어요/)).toBeInTheDocument();
    expect(screen.getByText("가장 빨리 정착해요")).toBeInTheDocument(); // buy 강점
    expect(screen.getByText("지금 필요한 현금이 가장 적어요")).toBeInTheDocument(); // rent 강점
  });

  it("열이 1개면 렌더하지 않는다", () => {
    const { container } = render(<TradeoffSummary columns={[make("a", "buy_existing", {})]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
