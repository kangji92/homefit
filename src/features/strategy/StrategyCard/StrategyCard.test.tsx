import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { HousingStrategy, StrategyDecision } from "@/domain/types";
import { StrategyCard } from "./StrategyCard";

const strategy: HousingStrategy = {
  id: "rent-apply-x",
  kind: "rent_then_apply",
  label: "전세 거주 → X 청약",
  targetRef: { kind: "presale", id: "x" },
  steps: [
    { kind: "rent", timing: { horizon: "now" } }, // ref 없음 → 미선정
    { kind: "apply", ref: { kind: "presale", id: "x" }, timing: { horizon: "short" } },
    { kind: "move_in", ref: { kind: "presale", id: "x" }, timing: { horizon: "long", targetYear: 2032 } },
  ],
};

const decision: StrategyDecision = {
  strategyId: "rent-apply-x",
  status: "needs_review",
  reasons: [{ code: "review_unknown", text: "확인이 필요한 항목이 있어요" }],
  fit: {
    complexId: "x",
    passesDealbreakers: true,
    failedDealbreakers: [],
    unknownDealbreakers: [],
    axisScores: { price: 0, commute: 0, education: 0, newness: 0, infrastructure: 0, environment: 0, futurePotential: 0 },
    totalScore: 82,
  },
  affordability: { verdict: "ok", cashNeededNow: 6000 },
  timing: { horizon: "long", settleBy: 2032 },
  eligibility: { status: "pass", program: "생애최초 특별공급" },
  risk: { flags: [], requiredReviews: [], incompleteInputs: ["전세 후보 미선정"] },
  pros: ["청약 자격이 있어요"],
  cons: ["정착까지 시간이 걸려요"],
  nextActions: ["거주할 전세 후보를 추가로 탐색하세요"],
};

describe("StrategyCard", () => {
  it("전략 라벨·서술형 상태·한 줄 서사를 렌더한다", () => {
    render(<StrategyCard item={{ strategy, decision }} />);
    expect(screen.getByText("전세 거주 → X 청약")).toBeInTheDocument();
    expect(screen.getByText("확인이 필요해요")).toBeInTheDocument(); // status label
    expect(screen.getByText(/기다리는 선택/)).toBeInTheDocument(); // narrative
  });

  it("아직 정하지 않은 항목(전세 후보)과 실제 CTA를 표시한다", () => {
    render(<StrategyCard item={{ strategy, decision }} />);
    expect(screen.getByText("아직 정하지 않은 항목")).toBeInTheDocument();
    expect(screen.getByText(/전세 후보 미선정/)).toBeInTheDocument();
    // 실제 라우트 CTA
    expect(screen.getByRole("link", { name: /전세 후보 찾기/ })).toHaveAttribute("href", "/explore");
    expect(screen.getByRole("link", { name: /청약 자격 확인/ })).toHaveAttribute("href", "/profile");
  });

  it("HomeFit은 보조 지표로 하단에만 노출된다", () => {
    render(<StrategyCard item={{ strategy, decision }} />);
    expect(screen.getByText(/HomeFit 82/)).toBeInTheDocument();
    expect(screen.getByText("주택 적합도")).toBeInTheDocument();
  });
});
