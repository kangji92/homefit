import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { makeComplex } from "@/domain/__fixtures__";
import type { Home, PresaleHome, StrategyDecision } from "@/domain/types";
import type { DevelopmentArea } from "@/domain/development";
import type { StrategyBoardItem } from "@/features/strategy/strategyView";

const won = (manwon: number) => ({ manwon, valueProvenance: "sourced" as const });
const area: DevelopmentArea = {
  id: "dev-east", name: "동측 재개발", developmentType: "redevelopment",
  stage: "in_progress", detailStage: "implementation", certainty: "confirmed",
  geometry: { kind: "polygon", rings: [[]] },
};
const villa = {
  ...makeComplex({ id: "v1", name: "A빌라" }), housingType: "villa",
  location: { lat: 37.4, lng: 126.94 }, locationAccuracy: "complex",
  listing: { askingPrice: won(92000), recentTransactionPrice: won(78000) },
  redevelopment: { areaId: "dev-east", inside: true },
} as Home;

// DecisionMap을 stub으로 — selection 동기화만 검증. 전략 marker + 매물 marker 트리거 제공.
vi.mock("./DecisionMap", () => ({
  DecisionMap: (props: { selectedEntityId?: string | null; onSelectEntity?: (id: string) => void; onSelectDevelopment?: (id: string) => void }) => (
    <div data-testid="map" data-selected={props.selectedEntityId ?? ""}>
      <button type="button" onClick={() => props.onSelectEntity?.("other:h2")}>marker-h2</button>
      <button type="button" onClick={() => props.onSelectEntity?.("property:v1")}>marker-villa</button>
      {/* 개발구역은 폴리곤 클릭(onSelectDevelopment) — entity marker가 아님 */}
      <button type="button" onClick={() => props.onSelectDevelopment?.("dev-east")}>polygon-dev</button>
    </div>
  ),
}));
vi.mock("@/hooks/queries", () => ({
  useDevelopments: () => ({ data: [area] }),
  useDevelopmentProperties: () => ({ data: [villa] }),
}));

import { DecisionMapView } from "./DecisionMapView";

const decision = (): StrategyDecision => ({
  strategyId: "x", status: "consider", reasons: [],
  fit: { complexId: "x", passesDealbreakers: true, failedDealbreakers: [], unknownDealbreakers: [], axisScores: { price: 0, commute: 0, education: 0, newness: 0, infrastructure: 0, environment: 0, futurePotential: 0 }, totalScore: 80 },
  affordability: { verdict: "ok" }, timing: { horizon: "now" },
  risk: { flags: [], requiredReviews: [], incompleteInputs: [] }, pros: [], cons: [], nextActions: [],
});
const item = (id: string, kind: StrategyBoardItem["strategy"]["kind"], targetId: string, label: string): StrategyBoardItem => ({
  strategy: { id, kind, label, targetRef: { kind: kind === "apply_presale" ? "presale" : "existing", id: targetId }, steps: [] },
  decision: { ...decision(), strategyId: id },
});

const h1: Home = { ...makeComplex({ id: "h1" }), location: { lat: 37.3, lng: 127.0 }, locationAccuracy: "complex" } as Home;
const h2 = { ...makeComplex({ id: "h2" }), kind: "presale", moveInYear: 2030, location: { lat: 37.35, lng: 127.05 }, locationAccuracy: "area" } as unknown as PresaleHome;
const board = [item("s1", "buy_existing", "h1", "매수전략"), item("s2", "apply_presale", "h2", "청약전략")];

const renderView = () =>
  render(<DecisionMapView board={board} homes={[h1, h2]} areas={[]} workplaces={[]} currentHousing={undefined} />);

describe("DecisionMapView 카드↔지도 sync", () => {
  it("초기 선택은 첫 카드(target 엔티티가 지도에 전달)", () => {
    renderView();
    expect(screen.getByTestId("map").getAttribute("data-selected")).toBe("target:h1");
  });

  it("카드 선택 → 지도 selectedEntityId 갱신", () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: /청약전략/ }));
    expect(screen.getByTestId("map").getAttribute("data-selected")).toBe("target:h2");
  });

  it("marker(전략) 선택 → 해당 카드 active + 상태 텍스트", () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "marker-h2" }));
    expect(screen.getByTestId("map").getAttribute("data-selected")).toBe("target:h2");
    expect(screen.getByRole("status").textContent).toContain("청약전략");
  });

  it("재개발 빌라 marker 선택 → RedevelopmentPanel 노출(전략 카드 대신)", () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "marker-villa" }));
    expect(screen.getByTestId("map").getAttribute("data-selected")).toBe("property:v1");
    expect(screen.getByText("실거주 + 정비사업 투자대상")).toBeInTheDocument();
    expect(screen.getByRole("status").textContent).toContain("A빌라");
  });

  it("개발구역 폴리곤 클릭 → DevelopmentDetailPanel 노출(매물 없이 구역 자체, marker 승격 없음)", () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "polygon-dev" }));
    // 구역 선택은 point marker 강조가 아니라 폴리곤 강조 → selectedEntityId는 비어있음
    expect(screen.getByTestId("map").getAttribute("data-selected")).toBe("");
    expect(screen.getByRole("heading", { name: "동측 재개발" })).toBeInTheDocument();
    expect(screen.getByRole("status").textContent).toContain("개발구역");
  });
});
