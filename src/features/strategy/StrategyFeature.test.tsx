import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { PresaleHome } from "@/domain/types";
import { makeComplex } from "@/domain/__fixtures__";
import { DEFAULT_CONDITIONS, useConditionsStore } from "@/stores/conditionsStore";
import { useHouseholdStore } from "@/stores/householdStore";
import { StrategyFeature } from "./StrategyFeature";

const { useHomesMock, useAreasMock } = vi.hoisted(() => ({
  useHomesMock: vi.fn(),
  useAreasMock: vi.fn(),
}));

vi.mock("@/hooks/queries", () => ({
  useHomes: () => useHomesMock(),
  useAreas: () => useAreasMock(),
}));

const READY_CONDITIONS = {
  ...DEFAULT_CONDITIONS,
  maxSalePrice: 100000,
  availableFunds: 50000,
  maxCommuteMinutes: 60,
  desiredSize: { min: 20, max: 40 },
  workplaces: [
    { id: "gangnam", label: "강남", lat: 0, lng: 0, transport: "transit" as const },
    { id: "pangyo", label: "판교", lat: 0, lng: 0, transport: "car" as const },
  ],
};

beforeEach(() => {
  localStorage.clear();
  useConditionsStore.getState().reset();
  useConditionsStore.setState({ hasHydrated: true, conditions: READY_CONDITIONS });
  useHouseholdStore.getState().reset();
  useAreasMock.mockReturnValue({ data: [], isLoading: false, isError: false });
});

describe("StrategyFeature", () => {
  it("조건 미입력이면 조건 입력 안내를 보여준다", () => {
    useConditionsStore.setState({ conditions: DEFAULT_CONDITIONS });
    useHomesMock.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<StrategyFeature />);
    expect(screen.getByText("먼저 우리 조건을 알려주세요")).toBeInTheDocument();
  });

  it("예산 내 기존주택이 있으면 매수 전략 카드를 렌더한다", () => {
    useHomesMock.mockReturnValue({
      data: [makeComplex({ id: "a", price: { sale: { representative: 70000 } } })],
      isLoading: false,
      isError: false,
    });
    render(<StrategyFeature />);
    expect(screen.getByRole("heading", { name: "주거 전략" })).toBeInTheDocument();
    expect(screen.getByText("지금 매수")).toBeInTheDocument();
  });

  it("전략이 2종 이상이면 '나란히 비교'로 전환해 동일 축 매트릭스를 보여준다", () => {
    const open: PresaleHome = {
      kind: "presale", id: "open", name: "청약단지", regionId: "r",
      price: { sale: { representative: 60000 } }, sizesPyeong: [25, 34],
      commuteMinutes: { a: 25, b: 30 },
      metrics: { education: 80, infrastructure: 80, environment: 80, futurePotential: 85 },
      moveInYear: 2029,
      lifecycle: { phase: "subscription_open", lastVerifiedAt: "2026-01-01" },
    };
    useHomesMock.mockReturnValue({
      data: [makeComplex({ id: "a", price: { sale: { representative: 70000 } } }), open],
      isLoading: false,
      isError: false,
    });
    render(<StrategyFeature />);
    fireEvent.click(screen.getByRole("button", { name: "나란히 비교" }));
    expect(screen.getByText("비교 축")).toBeInTheDocument();
    expect(screen.getByText("정착 시점")).toBeInTheDocument();
  });
});
